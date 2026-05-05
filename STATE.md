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
last_run_commit:    536ff81
last_run_time:      2026-05-05T17:14Z
last_aggregate:     p:(12/4143) 45683/840507    s:(0/44) 15/10902    e:(0/6382) 0/366370    m:(0/3088) 0/4713
best_aggregate:     p:(12/4143) 45683/840507    s:(0/44) 15/10902    e:(0/6382) 0/366370    m:(0/3088) 0/4713
best_commit:        536ff81
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
                    *(place_level was ported in commit 8f88193; cluster resolved.)*

                    Current top blockers (after place_level resolved):
                      - mkclass_aligned (makemon.c:1946) — JS stub emits rn2(NUMMONS=398)
                        where C iterates class members emitting rn2(9) per member +
                        conditional rn2(2) toostrong + rnd(num) final pick. Blocks
                        seed0103, seed0700, seed0102 (Knight/Samurai/Ranger normal).
                        Requires per-class member counts + monster geno/maligntyp/
                        difficulty data.
                      - fill_special_room (sp_lev.c:2769) — JS doesn't have this
                        path. Blocks seed1500, seed0017, seed0105, seed0383.
                        Requires sp_lev port.
                      - lspo_map (sp_lev.c:6154/6163) — JS doesn't process themed
                        map placement. Blocks seed0013×2, seed0399, seed5002,
                        seed0015, seed0200. Requires lua-side themerms.lua port.
                      - mkobj RANDOM_CLASS (mkobj.c:281,290) — JS stub doesn't emit
                        rnd(100) class pick + rnd(class_total) item pick. Affects
                        many sessions in level fill. Requires mkobjprobs +
                        oclass_prob_totals tables.
                      - chargen (pick_role/pick_race/pick_gend/pick_align) — 7
                        sessions stuck at firstDiv@0 with empty role spec. Requires
                        UI simulation + role/race/gender/alignment validation tables.

                    Each is a multi-hour port. The session can pick any one and
                    ship a chunk-sized port that preserves seed8000 canary.

                    Update 2026-05-05T17:14Z: mkobj/mksobj_init port (6 commits)
                    extended class coverage to SCROLL/POTION/ARMOR/WEAPON/SPBOOK/
                    WAND/AMULET + mkobj_erosions. RING/TOOL/FOOD/GEM remain
                    stubbed. Real impact small (+33 calls aggregate) because
                    most non-Tourist sessions diverge BEFORE reaching mkobj
                    in their PRNG stream — but the port is correct C-shape
                    and will start contributing once chargen / fill_special_room
                    / lspo_map ports unlock the level-fill phase.

                    Concrete next chunks (in roughly decreasing leverage order):

                      1. **fill_special_room (sp_lev.c:2731-2900)** — port
                         the chance-check loop + per-rtype dispatch. Unblocks
                         seed1500/seed0017/seed0105/seed0383 directly. Requires
                         room.rtype tracking (already partially in JS) and
                         per-rtype RNG patterns.

                      2. **mkclass_aligned (makemon.c:1880-1974)** — port the
                         per-class iteration loop. Need monst[] table data:
                         per-monster maligntyp, geno, difficulty, mlet. Hard
                         without parsing monsters.h. Unblocks seed0103/seed0700/
                         seed0102 + many sessions further into level fill.

                      3. **lspo_map / themerms.lua port (sp_lev.c:6100+,
                         themerms.lua:1009-1049)** — themed-fill picker plus
                         contents() functions for each fill type. Big lua-side
                         port; partial picker-only port unblocks
                         seed5002/seed0013/seed0399 to advance ~50 calls each.

                      4. **chargen UI (role.c select_role/select_race/...)** —
                         simulate the keystroke menu, emit pick_role/race/
                         gend/align rn2 calls when "random" is chosen.
                         Unblocks 7 sessions currently at firstDiv@0. Needs
                         per-role race/gender/align bitmasks (data in roles[]).

                      5. **u_init_role / ini_inv (u_init.c)** — replaces the
                         hardcoded post_mklev fastforward sequence with role-
                         specific stat rolls and starting inventory. Probably
                         8-12 PRNG calls per session. Big payoff once role
                         is plumbed (already done) and other sessions reach
                         this point.
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
2026-05-05T16:30Z  68a4b85  state: log session-2026-05-05 cumulative summary; LEARNINGS #9 (rc options).
2026-05-05T16:35Z  4e0bb15  docs: ABSOLUTE RULE — never voluntarily stop. Strengthens both PROMPT.md and docs/ITERATION.md.
2026-05-05T16:42Z  fd1cb8b  allmain: plumb role/race/gender/align from nethackrc into urole/urace/flags.female. Welcome message now uses correct values per session.
2026-05-05T16:43Z  4a32f89  mklev: fix blessorcurse to mirror C — rn2(chance) + conditional rn2(2). Aggregate p: 45662 → 45664 (+2).
2026-05-05T16:55Z  c0d3c06  docs/LEARNINGS items 10, 11 — fastforward_step guard hazard and pline timing trap. Documents experiments that regressed (so future iterations don't repeat them).
2026-05-05T17:00Z  0c054d3  docs/LEARNINGS item 11.5 — screen scoring is bottlenecked on PRNG matching first. Of 10,902 screens, only 15 match (all in seed8000); ALL non-seed8000 sessions have 0 screens matching because they diverge PRNG-wise within ~1500 calls. Pursuing screen fixes ahead of PRNG matching produces no aggregate improvement.
2026-05-05T17:01Z  eac8b14  state: refresh focus map with current top blockers post-place_level (mkclass, fill_special_room, lspo_map, mkobj RANDOM_CLASS, chargen).
2026-05-05T17:04Z  f44a370  mklev: partial mkobj RANDOM_CLASS port — emits rnd(100) class pick via mkobjprobs + rnd(class_total) item pick via oclass_prob_totals. Aggregate p: 45664 → 45674 (+10). seed8000 unchanged.
2026-05-05T17:06Z  e641d25  mklev: port ARMOR_CLASS init in mksobj_init; wire mkobj to invoke it (init=TRUE, synthesized otyp). +11 calls.
2026-05-05T17:08Z  af89e69  mklev: extend mksobj_init — WEAPON, SPBOOK, WAND classes + mkobj_erosions (rn2(100) erodeproof, rn2(80) flammable+do-while, rn2(80) rottable+do-while, rn2(1000) greased). +12 calls.
2026-05-05T17:12Z  1e4d4bb  mklev: port AMULET_CLASS in mksobj_init — rn2(10) + blessorcurse(10). turnsFully 11→12 (recovered from prior coincidental shift). seed8000 unchanged.
2026-05-05T17:14Z  536ff81  mklev: faithful WEAPON_CLASS init — rn2(11) + (rne(3)+rn2(2) | rn2(10)+(rne(3)|blessorcurse(10))). 0 immediate gain (no test session exercises WEAPON via mkobj path) but correct C-shape for future unlocks.
2026-05-05T17:15Z  eb37561  state: log AMULET + WEAPON ports; mksobj_init now covers 7 classes.
2026-05-05T17:18Z  50335ba  state: enumerate concrete next-chunk priorities (5 chunks with leverage estimates).
2026-05-05T17:22Z  65534df  dungeon: drop unused rnd import (cleanup, no behavior change).
2026-05-05T17:24Z  ed61814  mklev: mkcorpstat now respects CORPSTAT_INIT (0x08) flag. Was hardcoded init=false; now derives from caller flags. Affects corpse/statue generation paths to invoke mksobj_init properly.
2026-05-05T17:27Z  6845c6d  state: log dungeon-cleanup + mkcorpstat-CORPSTAT_INIT commits.
2026-05-05T17:30Z  aa7f046  docs/LEARNINGS item 12: chargen port requires per-role bitmask data + UI sim. Documents prerequisites for chargen chunk.
2026-05-05T17:32Z  ea4db6e  role: add ROLE_DATA bitmask table (foundation for future chargen port). 13 roles' allowed (races, genders, aligns) extracted from C role.c roles[].flags. Not wired into chargen yet — needs UI sim to distinguish menu-letter picks from random.

Investigation this turn (no code change but documented):
- Multiple sessions blocked at makelevel:1410 fillable_room_count rn2.
  C emits rn2(7), JS emits rn2(8) — JS counts 1 more fillable room
  than C. Investigation incomplete; vault is correctly typed VAULT not
  OROOM, so it's not the source. Some room creation path in JS produces
  one extra OROOM/THEMEROOM with needfill=FILL_NORMAL that C doesn't.
- Multiple chargen sessions need per-role allowed-attribute bitmasks
  (now in ROLE_DATA) plus UI keystroke parsing to know which menus
  the user chose "*" (random) vs specific letter.
- Tried chargen port that emits all 4 picks for sessions with empty
  rc components — over-emits for sessions where user pressed letters
  via menu. Reverted; data table preserved as ea4db6e.
```
