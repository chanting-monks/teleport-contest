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
last_run_commit:    63185d1
last_run_time:      2026-05-05T15:49Z
last_aggregate:     p:(12/4143) 45662/840507    s:(0/44) 15/10902    e:(0/6382) 0/366370    m:(0/3088) 0/4713
best_aggregate:     p:(12/4143) 45662/840507    s:(0/44) 15/10902    e:(0/6382) 0/366370    m:(0/3088) 0/4713
best_commit:        63185d1
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
session:            (cluster — see below)
first_div_step:     0
suspected_c_func:   place_level(dungeon.c:687)
suspected_js_file:  js/mklev.js  +  js/fastforward.js
notes:              `node scripts/compare-firstdiv.mjs --prng-only --all` shows the
                    actionable focus map. firstDiv distribution (post log-wipe fix):

                      [0,   100):   7 sessions  — full chargen (pick_role/pick_gend/pick_align)
                      [100, 200):  13 sessions  — role_init / randrole / pick_role
                      [200, 300):  23 sessions  — place_level dungeon arrangement
                      3103     :   1 session    — seed8000 (fastforward home)

                    Top blocking C functions across all 44:
                      20× place_level         (dungeon.c:687)
                      10× role_init            (role.c:2060)
                       4× pick_role            (role.c:1032)
                       3× randrole             (role.c:726)
                       3× init_dungeon_dungeons (dungeon.c:1074)
                       2× pick_align           (role.c:1222)
                       1× pick_gend            (role.c:1157)
                       1× m_move               (monmove.c:1963)  ← seed8000

                    Highest-leverage single port: place_level — recursive backtracking
                    in dungeon.c that picks positions for special levels. JS currently
                    has fastforward.js emitting hardcoded place_level calls tuned to
                    seed8000 normal-mode. A real port unblocks 20 sessions; partial
                    correctness blocks fewer. Requires reading C dungeon.c:680-700
                    plus possible_places() / pick_level() / proto_dungeon data.
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
2026-05-05T14:35Z  5fa0e94  STATE.md focus update: identified post-shuffle fastforward.js mismatches as next blocker (wizard-mode rn2(100) skips at role.c:2060, dungeon.c:1022, dungeon.c:572). agg unchanged (focus narrowing).
2026-05-05T14:48Z  0a5524c   compare-firstdiv: add --prng-only filter so event-bearing sessions show their real PRNG-channel firstDiv (was masked at 0 by C events vs JS PRNG misalignment). Distribution after log-wipe fix: 7 sessions diverge [0,100) — full chargen needed; 13 in [100,200) — pick_role / role_init; 23 in [200,300) — place_level dungeon issues; seed8000 alone at 3103 (fastforward home). place_level cluster is highest-leverage focus.
2026-05-05T15:00Z  ac58568  state: refresh focus map with PRNG-only firstDiv cluster.
2026-05-05T15:21Z  8f88193   port real init_dungeons (js/dungeon.js): full dungeon.lua data + level_range, possible_places, pick_level, place_level (recursive backtracking), init_level, parent_dlevel, init_dungeon_dungeons, init_castle_tune. Honors wizard mode (game.flags.debug). Replaces fastforward.js's hardcoded seed8000-tuned dungeon-init slice. Caught a bit-collision bug: D_ALIGN_CHAOTIC and UNCONNECTED both occupy 0x10 in C; they must be tracked as separate fields per dungeon (C does this; my first cut OR'd them, falsely flagging Vlad's Tower as unconnected). Aggregate PRNG calls matched: 25431 → 31649 (+6218). seed8000 unchanged (p:(11)3126/3130 — canary preserved). Big winners: seed0700-samurai 359→1723, seed0017-samurai 325→1368, seed5006-tourist 555→1181, seed4500-knight 289→556. The 23-session place_level cluster is now resolved.
2026-05-05T15:31Z  85e1b70   js/role.js: role-aware role_init for Wizard/Archeologist nemgend (rn2(100)) and Priest pantheon-loop (rn2(13), single iteration); plus per-role newpw rnd(enadv.inrnd) for Healer/Knight/Priest/Wizard/Monk inside u_init_misc. Plumb role string from nethackrc into game.opts_role. Mirrors C's allmain.c order: init_objects → role_init → lua_pair → init_dungeons → u_init_misc. Aggregate p: 31649 → 43298 (+11649). seed8000 still p:(11)3126/3130 (canary). turnsFully 11→12. Big winners: seed4500 556→1232, seed0016-healer 367→1285, seed0367-priest 362→885, seed0106-priest 431→1201. Small regression seed0501-priest 297→283: pantheon loop iterates twice for that seed; my port emits one rn2(13). The 12 sessions blocked at firstDiv@199-200 (Priest/Wizard/Archeologist) now advance past role_init.
2026-05-05T15:39Z  8f138bf   Priest pantheon loop now iterates correctly: models C's `while (pantheon == 6 && ++trycnt < 100) pantheon = rn2(13)`. Priest (idx 6) is the only role in NetHack 5.0 with null lgod (verified by grepping role.c for `0, 0, 0,` god lines), so the loop continues iff rn2(13) returns 6 again. Aggregate p: 43298 → 44162 (+864). seed0501-priest 283 → 1147 (+864) — full recovery of prior regression and then some. seed0367/seed0106 unchanged (their loops were already 1 iteration). seed8000 still canary p:(11)3126/3130.
2026-05-05T15:49Z  63185d1  options.js: parse `playmode:explore`. Sets g.flags.explore so JS getbones honors C bones.c:639's `if (discover) return 0` — the rn2(3) at bones.c:645 must be skipped in explore mode. seed0900-tourist (only Tourist explore session): 351 → 1285 (+934). seed1150-caveman-explore also gained. Aggregate p: 44162 → 45662 (+1500). seed8000 unchanged.
```
