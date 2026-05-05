# Iteration State

Persistent handoff between Claude Code iterations of the NetHack porting
loop. Read this FIRST on every iteration. Update it BEFORE pushing.

The full iteration contract lives in [`docs/ITERATION.md`](docs/ITERATION.md).
The porting manual is [`PROMPT.md`](PROMPT.md).

---

## halt

```
halt: false
```

Manual kill switch only. The loop NEVER auto-halts. If you ever want the
next iteration to no-op cleanly, flip this to `true`. Iterations check
this flag on startup and exit immediately if set, leaving the worktree
clean.

## scores

```
last_run_commit:    eb34692
last_run_time:      2026-05-05T14:23Z
last_aggregate:     p:(12/4143) 25431/840507    s:(0/44) 15/10902    e:(0/6382) 0/366370    m:(0/3088) 0/4713
best_aggregate:     p:(12/4143) 25431/840507    s:(0/44) 15/10902    e:(0/6382) 0/366370    m:(0/3088) 0/4713
best_commit:        eb34692
```

Baseline notes (skeleton + fastforward.js):
- 12 PRNG turns fully match (out of 4143 active turns across 44 sessions)
- 0 sessions pass screens fully; only 15 individual screens out of 10902 match
  (all in seed8000-tourist-starter, where fastforward.js fakes the early RNG)
- The `e:` and `m:` columns surface from sessions/ recordings that were
  produced by the contest's fuller debug recorder build — most public
  sessions already contain `>funcname`, `<funcname=retval`, `^tag[args]`,
  and `^mapstate[...]` lines. The four sessions without are recorded with
  the minimal build (`e:-`, `m:-`).
- Total recorded events: 366,370 across 37 sessions. Total map snapshots:
  4,713 across 40 sessions. JS port currently emits 0 of either.

The aggregate format mirrors the per-session table format documented in
`docs/ITERATION.md`. Update both lines on every iteration that runs the
scorer; never overwrite `best_*` with a regression (only update when the
new aggregate strictly improves on at least one channel without
regressing the others).

## leaderboard

```
last_check_time:    -
last_check_score:   -
last_check_rank:    -
notes:              -
```

Fetch [mazesofmenace.ai/leaderboard](https://mazesofmenace.ai/leaderboard/)
no more often than every 6 hours. The leaderboard is the only signal on
held-out generalization; treat any held-out regression as a higher-priority
discovery than a small public-set regression.

## focus

```
session:            seed5002-wizard-coverage-pair (seg 0)
first_div_step:     0  (call index 199)
suspected_c_func:   role_init(role.c:2060)  +  init_dungeon_dungeons(dungeon.c:1022)  +  init_level(dungeon.c:572)
suspected_js_file:  js/fastforward.js (wizard-mode awareness missing)  +  js/role.js (does not exist)
notes:              fastforward.js was tuned to seed8000 (Tourist, normal mode). Multi-seed sessions diverge because (a) role-specific rn2(100) at role.c:2060 fires only when nemesis gender is random — Tourist's nemesis isn't, Wizard's is — and (b) several rn2(100) calls in dungeon.c (lines 1022, 572) are guarded by !wizard, which is FALSE in playmode:debug sessions. The pragmatic stepping-stone is a wizard-mode-aware fastforward branch; the principled fix is to port real role_init + init_dungeon_dungeons + init_level. Either way, the post-shuffle ~50 calls of fastforward.js need restructuring before any wizard-mode session can advance past index 199.
```

The single session being chased this iteration. The first iteration
should populate this after running the scorer for the first time.
`suspected_c_func` should be a `funcname(file:line)` reference taken
from the C annotation when the event-aware comparator (Part 3.4 of
PROMPT.md) is built.

## backlog

Ordered. Each iteration consumes ≤1 item; may push 1-3 new ones. Don't
delete items when finished — move them to `## graveyard` with a
one-line outcome note.

**Discovered at bootstrap:** the contest recorder build that produced
`sessions/` ALREADY emits events (`>funcname`, `<funcname=retval`,
`^tag[args]`) and map snapshots (`^mapstate[...]`) for 37+ of the 44
public sessions. `scripts/score-table.mjs` already reads them. So the
e: and m: columns are LIVE from day one — the agent's task is to make
the JS port emit matching events/maps, not to instrument C first.

1. Pick the first event divergence in the simplest failing session and
   port the JS code path that should emit that event. Start with
   seed0077-rogue-chargen (33 boundaries, 99 events) — small surface
   area, exercises chargen which is what `fastforward.js` currently
   fakes.
2. Make the JS RNG wrapper layer ALSO emit events alongside PRNG calls
   so that `getRngLog()` returns an interleaved stream the comparator
   can walk. Mirror the C tag format exactly (per `frozen/score.sh`'s
   recordings).
3. ~~Build an event-aware comparator (`scripts/compare-firstdiv.mjs`).~~
   **DONE** in commit `eb34692`. Run
   `node scripts/compare-firstdiv.mjs <session>` to see the first
   divergence between JS and C with a context window of ±8 lines.
4. Once events are flowing for one session: extend score-table.mjs to
   include a `firstDiv` column showing the first divergent event/call
   per session (truncated). This is the actionable signal for the
   next iteration's focus.
5. Begin Phase 2 of PROMPT.md: replace `js/fastforward.js` one entry at
   a time, ported with real C call chains, so events match
   structurally.
6. Build supplemental keyplan generator (Part 4 of PROMPT.md) for
   coverage on roles/branches the public set under-samples.
7. Build BUILD B / debug-recorder (Part 2.2) when needed for *new*
   diagnostic patches beyond what the contest recorder emits — the
   existing recordings are rich enough to start.

## graveyard

Failed experiments + reason. One line each. Future iterations consult
this to avoid repeating dead-ends.

```
(empty)
```

## run_log

Append-only. One line per iteration. Format:

```
YYYY-MM-DDTHH:MMZ  <commit-sha>  <delta-summary>
```

Where `<delta-summary>` is a terse human-readable note: what was tried,
what changed, did the aggregate move.

```
2026-05-05T13:58Z  88ad3c8  bootstrap iteration mode: STATE.md, ITERATION.md, PROMPT.md Part 0, scripts/score-table.mjs.
2026-05-05T14:08Z  4c46062  add AGENTS.md, scripts/compare-firstdiv.mjs (first-divergence localizer); fix 30m→1h cron docs. agg unchanged (infra).
2026-05-05T14:11Z  d4a4d1a  compare-firstdiv: add --all summary mode for focus selection. agg unchanged (infra).
2026-05-05T14:23Z  eb34692  fix initRng/enableRngLog wiping rng log on each segment — multi-segment sessions now retain seg0 calls in the cumulative log. PRNG matched 19409 → 25431 (+6022) across 44 sessions; seed0030 alone gained +4987.
2026-05-05T14:35Z  <next>   STATE.md focus update: identified post-shuffle fastforward.js mismatches as next blocker (wizard-mode rn2(100) skips at role.c:2060, dungeon.c:1022, dungeon.c:572). agg unchanged (focus narrowing).
```
