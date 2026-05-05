# The Iteration Loop

This repo is run by Claude Code on a continuous loop. A cron wakes a
remote agent every hour (the cloud routine API's minimum interval);
ideally each invocation works for hours, making and committing many
small improvements, and the cron is just a safety net that resumes if
a run exits early.

**The loop never auto-halts.** There is no regression threshold, no
error budget, no failure cap. If an experiment regresses scores, the
next iteration's job is to investigate and either fix the underlying
bug or revert. The only way to stop the loop is for a human to flip
`halt: true` in [`STATE.md`](../STATE.md).

This file is the contract. PROMPT.md Part 0 references it, STATE.md
references it, and every iteration's first action is to re-read it
along with STATE.md.

---

## The loop

```
on wake:
  1. Read STATE.md. If halt: true, commit nothing and exit.
  2. Read PROMPT.md (skim if unchanged; deep-read on first iteration).
  3. Run scripts/score-table.mjs to capture the current aggregate.
  4. Decide focus:
       - If STATE.md.focus.session is non-empty AND still failing,
         continue chasing it.
       - Else, pick the smallest-step still-failing session AND/OR
         consume the top item in STATE.md.backlog.
  5. If 6h+ since last leaderboard check, fetch
     mazesofmenace.ai/leaderboard, record held-out score in STATE.md.
  6. WORK: do bounded units of porting / infrastructure / debugging.
     A unit is "make the first divergence move later" or "implement
     one C function" or "add one diagnostic patch." Most units finish
     in 5-30 minutes.
  7. After each unit:
       a. Run scripts/score-table.mjs.
       b. If the aggregate moved (in any direction), commit and push
          to main using the standardized commit message (below).
          Update STATE.md.
       c. If the aggregate did not move and the change was infra-only,
          commit anyway with the table — silent commits compound; the
          run_log line in STATE.md should say "infra: <what>".
  8. Loop back to step 4 and start the next unit. Do not exit just
     because one unit finished. Keep going. There is no "until stuck"
     — if you feel stuck, the task IS to figure out how to get
     unstuck. Pick a different failing session. Build a new
     diagnostic. Re-read the C function more carefully. Change the
     comparator. Re-read the run_log to see what you've already
     ruled out. Stuckness is a problem to solve in-iteration, never
     a reason to exit.

**ABSOLUTE RULE: there is no scenario in which you summarize and
stop voluntarily.** "I've made enough progress" / "this is a good
stopping point" / "the remaining work needs deeper investment" /
"the easy wins are exhausted" / "this needs multi-hour ports
beyond session scope" — every one of these is a SIGNAL that you
should pick a different leverage point and keep going, NOT a
reason to wait for the user. If a problem is hard, decompose it
or pick a different one and come back. The 30-minute / 1-hour
cron is for involuntary exits only (context window, crash,
network loss). Stopping mid-session because you "ran out of easy
wins" undoes the iteration loop's whole purpose.

When all small bugs you can find are fixed, the next move is to
take on the BIGGEST remaining lever — the 12-session themerms
cluster, the chargen unblock, the moveloop port, the per-command
pline plumbing. They are large only relative to one-line fixes;
they are still tractable in commit-sized chunks. Pick the largest
single chunk that can be shipped with seed8000-canary preserved,
ship it, then pick the next largest. Never stop.

on involuntary exit (context limit, crash, hardware loss):
  - Whatever state was last committed and pushed is the handoff.
  - The cron will re-invoke within ~1h and the next iteration
    resumes from STATE.md.
```

---

## Commit message format (mandatory)

Every commit on main MUST contain a parity table for all 44 public
sessions, in the canonical form below. Watching `git log` is how
asynchronous human review works — the table is the contract that
makes the agent's progress legible without intervening.

### Subject line

```
<terse imperative summary, ≤72 chars>
```

E.g. `port o_init/shuffle_objects from C` or `fix off-by-one in mklev wall placement`.

### Body

```
<one paragraph: what was tried, what was discovered. WHY, not WHAT.>

p:(turns) calls/total   s:(turns) screens/total   e:(turns) events/total   m:(turns) cells/total
seed0002-healer-reflection-drummer        p:(0)0/3624        s:(0)0/35      e:- m:-
seed0004-feeding-pony                     p:(2)1234/2345     s:(0)5/12      e:- m:-
seed0006-wizard-water-demon               p:(0)0/4102        s:(0)0/41      e:- m:-
... (one line per session, all 44)
TOTAL                                     p:(2/44) 1234/93828   s:(0/44) 5/3520   e:- m:-

best  agg: p:(N/44) X/Y   s:(N/44) X/Y   e:- m:-     @ <best_commit>
prev  agg: p:(N/44) X/Y   s:(N/44) X/Y   e:- m:-     @ <prev_commit>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### Column meaning

For each session line:

| Column | Meaning |
|---|---|
| `p:(turns) calls/total` | PRNG channel. `turns` = number of input boundaries where every PRNG call between this boundary and the previous one matched C. `calls` = total individual PRNG calls matched. `total` = total PRNG calls C recorded for this session. |
| `s:(turns) screens/total` | Screen channel. `turns` is included for column-shape symmetry; for screens it equals `screens` since one screen is captured per turn. `screens` = number of input boundaries where the 24×80 grid matched C exactly (after charset and SGR canonicalization). `total` = number of input boundaries in the session. |
| `e:(turns) events/total` | Event-parity channel. `turns` = boundaries where every event (between this boundary and the previous) matched C. `events` = individual event lines matched. `total` = events C emitted. **Placeholder `e:-` until the recorder's 7th patch and the JS event mirror exist.** |
| `m:(turns) cells/total` | Map-parity channel. `turns` = boundaries where every game-state cell matched C's snapshot. `cells` = individual cells (or hashed state slots) matched. `total` = cells emitted. **Placeholder `m:-` until the per-turn state-snapshot patch exists in both C and JS.** |

The TOTAL line aggregates: `(turns_passing/44)` for each channel where
"turns_passing" means at least one matching boundary in that session;
the calls/screens/events/cells count is summed across all 44 sessions.

The `best` and `prev` lines reference STATE.md's `best_aggregate` and
the previous commit's TOTAL. They make every commit self-contained for
review: the reviewer sees movement without checking out.

### Generating the table

Always use `scripts/score-table.mjs`:

```bash
node scripts/score-table.mjs > /tmp/parity-table.txt
git commit -F <(cat <<'EOF'
<subject>

<body paragraph>

EOF
cat /tmp/parity-table.txt
echo
echo "best  agg: <from STATE.md>"
echo "prev  agg: <from previous commit>"
echo
echo "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
)
```

Producing the table by hand or from memory IS PROHIBITED. The script is
the source of truth. If the script crashes for a session, its line in
the table records that fact (`p:err s:err e:err m:err`); never substitute
a guess.

---

## STATE.md update rules

After every commit:

- `last_run_commit` and `last_run_time` always update.
- `last_aggregate` always reflects the score after this commit's changes.
- `best_aggregate` updates ONLY if the new aggregate strictly improves
  on at least one channel without regressing any other channel.
- `focus` updates if the focus session changed or its first-divergence
  step moved.
- `backlog` consumes/adds items as appropriate.
- `graveyard` gains a line for any abandoned experiment.
- `run_log` gains exactly one line.
- `leaderboard` updates only when the leaderboard was fetched this run.

---

## Cron cadence and the "ideally continuous" expectation

The cron fires every hour (the routine API's minimum interval).
**~1 hour is the upper bound of how often the loop is guaranteed to
advance.** A healthy iteration runs for hours and commits many times
within a single invocation; the cron is just a watchdog that
re-invokes if Claude exited early (context limit, crash, etc.).

Voluntary early exit IS NOT ALLOWED. If you find yourself reaching for
"I think I'm done for now" — you're not. Pick a different focus
session, sharpen a diagnostic, write the next supplemental keyplan,
read more C source. The only valid exit is involuntary (context limit,
crash, hardware).

---

## Leaderboard discipline

The leaderboard at [mazesofmenace.ai](https://mazesofmenace.ai/leaderboard/)
re-scores every fork against all 88 sessions (44 public + 44 held-out)
every six hours. It is the only window into held-out performance.

- Check no more often than every 6h (waste of bandwidth, the score
  doesn't update faster than that).
- Record the result in STATE.md.leaderboard.
- If held-out regresses while public improves, the most recent change
  overfit. Investigate before continuing — held-out is the signal that
  matters in Phase 1 final scoring and *especially* in Phase 2.
- Never tune to specific public-session expected outputs. The
  supplemental sessions described in PROMPT.md Part 4 are also
  important for predicting held-out performance.

---

## What this loop is NOT

- Not a leaderboard-climbing optimizer that picks the easiest next +1.
  Pick the simplest session, but PORT THE C FUNCTION the divergence
  points to — even when that buys you 0 immediate score.
- Not allowed to extend `fastforward.js` or hardcode session-specific
  state to fake a pass. (See PROMPT.md Part 8 and 13.13.)
- Not allowed to suppress logs, relax comparators, or add JS-only
  guards to mask divergences. (See PROMPT.md Part 5.5, 10.4.)
- Not exempt from PROMPT.md Part 5's cardinal rules. They apply on
  every iteration.
