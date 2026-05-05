# AGENTS.md

You are an LLM agent working on `chanting-monks/teleport-contest`, a fork
of `davidbau/teleport-contest` (the Teleport Coding Challenge). The
contest is a long-running C-to-JavaScript port of NetHack 5.0 with
bit-exact parity scoring against 88 recorded gameplay sessions.

This file is the entry point. Read these THREE files immediately on
every invocation, in order:

1. **[`STATE.md`](STATE.md)** — Persistent handoff between iterations.
   Honors `halt: true` as a manual kill switch. Records last/best
   aggregate scores, current focus session, backlog, graveyard, and
   the run log of every prior iteration.
2. **[`docs/ITERATION.md`](docs/ITERATION.md)** — The iteration-loop
   contract. Defines the canonical commit-message format (a parity
   table for all 44 public sessions on every commit), the kill
   switch, the leaderboard cadence, and the "never voluntarily exit"
   rule.
3. **[`PROMPT.md`](PROMPT.md)** — The full porting manual. Part 0
   restates iteration mode; Parts 1-13 are the operational playbook
   (cardinal rules, gotchas, architectural rules, order of attack,
   persistence habits).

## What this project is

A continuous, autonomous improvement loop. A scheduled remote agent
fires hourly (the API minimum); each invocation ideally runs for hours
and commits many improvements before exiting. The cron is a watchdog
for involuntary exits (context limit, crash), not a primary cadence.

The loop never auto-halts. If you feel stuck, the task is to figure
out how to get unstuck — switch focus session, sharpen a diagnostic,
re-read C source, write a new keyplan, anything. Voluntary early exit
is not allowed. The only graceful stop is a human flipping
`halt: true` in `STATE.md`.

## What you commit on every push

`scripts/score-table.mjs` produces the canonical parity table for all
44 public sessions in this format:

```
seed0008-filename   p:(turns)calls/total   s:(turns)screens/total   e:(turns)events/total   m:(turns)cells/total
```

The table goes in every commit message. It is the contract that makes
asynchronous human review possible — reviewers watch `git log` to see
the agent's progress per channel, per session, without checking out.
Producing the table by hand or summarizing it is prohibited. The
script is the source of truth.

See `docs/ITERATION.md` for the full commit-message format.

## What's frozen vs editable

- Frozen (judge overlays at score time): `js/isaac64.js`, `js/terminal.js`
- Editable (yours): `js/jsmain.js`, `js/rng.js`, all of `js/*` except
  the two frozen files; everything in `nethack-c/my-patches/`,
  `scripts/`, `docs/`, `STATE.md`, `AGENTS.md`, `PROMPT.md`.
- Reference (read-only): `nethack-c/upstream/` (NetHack 5.0 C source),
  `nethack-c/patches/` (contest's deterministic-build patches),
  `sessions/` (44 recorded ground-truth `.session.json` files).

## Quick command reference

```bash
node scripts/score-table.mjs           # canonical parity table (commit fodder)
node scripts/compare-firstdiv.mjs S    # first-divergence diff for one session S
bash frozen/score.sh                   # official PRNG+Screen scoring (frozen)
node frozen/ps_test_runner.mjs S       # score one session officially
```

## Hard rules (from PROMPT.md Part 5; restated here so you never forget)

- **PRNG is the source of truth.** Fix the FIRST divergence; never
  chase a downstream symptom.
- **Read the C, not the comments.** Comments are 46 years stale;
  port the implementation including its bugs.
- **Suspect new code, trust exercised code.** Code passing across
  many sessions and commits is almost certainly correct; code written
  in the last hour is almost certainly the bug.
- **Never extend `js/fastforward.js`** or hardcode session-specific
  state. The shortcut buys 1 session and prevents the other 87.
- **Never suppress logs or relax comparators** to mask divergences.
  Fix the code, not the logging.
- **Never add JS-only guards** (`if (specialCase)`) to hide
  regressions. If C doesn't have the condition, JS shouldn't either.
- **No fake implementations.** A function is fully ported or not
  ported at all. A stub that consumes RNG creates invisible drift.

If a piece of guidance in this file conflicts with `PROMPT.md`,
`PROMPT.md` wins — it is the master document.
