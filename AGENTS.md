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
node scripts/screen-diff.mjs S         # per-screen cell-level diff (hint=status|message|map)
node scripts/step-prng-diff.mjs S      # per-step PRNG match (find coupled-bug boundaries)
bash frozen/score.sh                   # official PRNG+Screen scoring (frozen)
node frozen/ps_test_runner.mjs S       # score one session officially
```

## Anti-stall rule (READ EVERY TURN)

If you ever find yourself about to write **"state unchanged"**, **"nothing
new to commit,"** **"I've hit a wall,"** **"the next chunk is multi-hour,"**
or any variant — STOP. That sentence is the trigger to switch tactics,
not the conclusion. Do at least one of these instead:

1. **Run a diagnostic on a session you haven't checked yet.**
   `node scripts/screen-diff.mjs <session> --diverged-only` shows the
   first row+col of each unmatched screen with a hint
   (status / message / map). `r=23 hint=status` mismatches are often
   single-line fixes (turn counter, gold display, attribute math).
   `r=0 hint=message` mismatches sometimes reveal commands that should
   advance the turn but don't, or messages that should be plined.
2. **Write a new diagnostic in `scripts/`.** Phase-1 work per
   `PROMPT.md` is always available. Diagnostics never regress the
   parity table and frequently surface bugs the next turn fixes.
3. **Pick a small experimental fix** even if it seems unhelpful.
   Re-read one `nethack-c/upstream/src/*.c` function you haven't
   ported and try porting it. The seed8000 search-turn bug
   (`af17822`, +2 screens) was a 6-line change found by walking
   one screen-diff hint to its root cause.
4. **Don't summarize prior work as a substitute for new work.**
   Status reports describing what's already pushed are noise unless
   they're the very last sentence before a real commit.

You are NEVER stuck — only between diagnostic-and-act cycles. Treat
"I've explored the obvious paths" as the trigger for cycle N+1, not
the end of cycle N.

## On C-faithful fixes that drop a parity-table sub-metric

**The current upstream scoring rubric (per `README.md`) is screens-only;
PRNG match is advisory.** Therefore:

- A C-faithful fix that drops `p:(turnsFully)` by 1 while preserving
  `s:` (screens) is acceptable and should be committed. The lost turn
  is a coincidental in-step alignment (often `rn2(1)=0` which always
  returns 0 regardless of state, per LEARN #22) — it represented zero
  real progress and reverting hides the underlying coupled bug per
  `PROMPT.md` §5.4.
- A fix that drops `s:` (screens) is a real regression and should be
  reverted unless you've found the coupled bug *and* fixed it in the
  same commit.
- The matched-call count column (`53843/792885`) tracks PRNG advisory
  progress — small fluctuations there from C-faithful fixes are
  expected and not regressions.

In other words: **screens are the score; PRNG turns are advisory; PRNG
calls are diagnostic.** Optimize for screens, then for screens-via-PRNG-
correctness, then for diagnostics.

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
