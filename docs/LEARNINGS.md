# Learnings — porting NetHack 5.0 C → JavaScript

A growing list of non-obvious things we've discovered. Each entry:
**Lesson** in one line, then **Why** (the failure mode that surfaced
it) and **How** (the fix or the rule going forward). Future iterations
should append, never delete.

---

## 1. `initRng` and `enableRngLog` must not clear `_rngLog`

**Lesson.** PRNG seed re-initialization (`initRng`) and log enabling
(`enableRngLog`) must leave the rng log untouched. Only construction
of a fresh `NethackGame` clears it.

**Why.** A multi-segment session (save+restore, death+bones, fresh
game pair) re-seeds the PRNG between segments. The contest scorer
expects the JS log to be the cumulative call sequence across all
segments — matching how C's recorder captures the entire process.
The skeleton's `initRng` and `enableRngLog` each cleared `_rngLog`,
so segment 2+ wiped segment 1's log and the scorer was comparing C's
flat seg0+seg1 log against JS's seg1-only log. Most of the JS calls
appeared "wrong" because they were correct calls for seg1 being
positionally aligned against C's seg0.

**How.** Separate "enable" from "reset". `clearRngLog()` is the new
explicit reset, called once from `NethackGame`'s constructor.
`initRng` and `enableRngLog` no longer touch the log.

**Found by.** `compare-firstdiv` showing seed5002 div@2 with values
that looked random — a hint that the comparator was misaligned.
Fix gave +6,022 PRNG calls instantly. (commit `eb34692`)

---

## 2. `D_ALIGN_CHAOTIC` and `UNCONNECTED` collide on bit 0x10

**Lesson.** Don't OR a dungeon's flag bits together with its alignment
bits. C keeps them in separate `int` fields (`tmpdungeon.flags` and
`tmpdungeon.align`).

**Why.** In `include/dgn_file.h`:
```
#define UNCONNECTED         0x10
#define D_ALIGN_CHAOTIC     (AM_CHAOTIC << 4)  // = 1<<4 = 0x10
```
Both occupy bit 0x10. Vlad's Tower is *chaotic* but not unconnected;
my first port OR'd `dgn_align` into `dgn_flags` and the unconnected
check (`dgn_flags & UNCONNECTED`) returned true. That made
`init_dungeon_set_depth` skip Vlad's Tower's parent_dlevel `rn2(5)`,
so every wizard-mode session diverged at `firstDiv@268`.

**How.** Track flags and align separately on the dungeon side
(matching `dungeon.c:1056-1057`). Only LEVELS merge them
(`dungeon.c:838 tmpl->flags = lvl_flags | lvl_align`), and the
level-side check uses the `D_ALIGN_MASK` (0x70) shift to extract
align — that part still merges, since for levels the bits are
unambiguous in context.

**Found by.** seed8000 advancing only to index 268 instead of all
the way to 3103 after the first init_dungeons port. The diverging
call was the missing rn2(5) for Vlad's Tower. (commit `8f88193`)

---

## 3. Init order: init_objects → role_init → lua_pair → init_dungeons → u_init_misc

**Lesson.** The PRNG-call sequence at startup follows
`allmain.c`'s init order. role_init runs *between* init_objects
(line 234 of o_init.c) and init_dungeons. The two lua-side shuffle
calls (`rn2(3); rn2(2);`) happen between role_init and init_dungeons.

**Why.** I initially put the lua pair inside `fastforward_pre_dungeon`
(after init_objects). For roles whose `role_init` doesn't fire any
rn2 (Tourist, Knight, etc.) that worked. But for Wizard/Archeologist
(nemgend rn2(100)) and Priest (pantheon-loop rn2(13)) the role_init
calls had to slot in *before* the lua pair, so I had to split the
helper.

**How.** `fastforward_pre_dungeon()` ends at the rn2(2) at
`o_init.c:234` (init_objects's last call). Then `role_init()`
emits its 0-1+ rn2 calls. Then `fastforward_lua_pair()` emits
the rn2(3), rn2(2). Then `init_dungeons()`.

The lua pair is most likely emitted by some lua-side init that
shuffles a 3-element list (Fisher-Yates: rn2(3), rn2(2)). Its
exact source isn't yet pinpointed; it could come from
init_dungeons' lua-state setup. Future work: trace it.

---

## 4. `rn1(x, y)` is `rn2(x) + y`, logged as plain `rn2(x)`

**Lesson.** C's `rn1(x, y)` is a macro/inline that calls `rn2(x)` and
adds `y` to the result. The PRNG log captures only `rn2(x)=N`, not
`rn1(x, y)=N+y`.

**Why.** I initially wrote `rnd(dgn_range)` for `num_dunlevs` in
`init_dungeon_dungeons` because the C code was
`num_dunlevs = rn1(dgn_range, dgn_base)`. But `rnd(N)` logs as
`rnd(N)=...` — the recorder expects `rn2(N)=...`. Bit-exactness
includes the *function name* in the log, not just the value.

**How.** Use `rn2(dgn_range) + dgn_base` directly. Same math, same
log line, same parity.

**Rule.** When porting, distinguish between the C-side function the
*recorder log captures* vs. C-side wrapper macros that decompose into
that function. The log is the source of truth for which rn2/rnd/rne
call site is being recorded.

---

## 5. Wizard mode skips chance checks → MORE place_level calls

**Lesson.** Wizard mode (`playmode:debug`) skips `!wizard`-guarded
`rn2(100)` calls, which means every special level survives its
chance check. With more surviving levels, `place_level` recursion
explores more positions and emits more total `rn2(npossible)` calls.
The wizard-mode call sequence has different SHAPE, not just fewer
calls.

**Why.** I initially thought wizard-mode fastforward could just delete
the `rn2(100)` chance checks from the seed8000-tuned sequence. But
seed4500 (Knight wizard mode) and seed5006 (Tourist wizard mode)
have totally different place_level sequences than seed8000. They
also differ from each other beyond the role-specific role_init
calls — because place_level's recursion is seed-driven and depends
on the full set of surviving levels.

**How.** Port `place_level` properly — the recursive backtracking
runs its real logic per seed, producing the right sequence for any
mode/role/seed combination.

---

## 6. role_init has role-specific PRNG sites, not just one

**Lesson.** `role_init` (role.c:1980) emits rn2 from several conditional
sites. Empirically observed across the public sessions:

- `ldrgend (line 2039)`: `rn2(100)` iff quest leader has random gender.
  None observed yet in public sessions.
- `nemgend (line 2060)`: `rn2(100)` iff quest nemesis has random
  gender. Observed for **Wizard** (Dark One) and **Archeologist**
  (Master Mind Flayer).
- `pantheon (line 2069)`: `rn2(13)` loop iff role's `lgod` is null.
  Observed for **Priest** — typically 1 iteration, but seed0501 shows
  2 iterations (loop ran until a role with lgod was selected).

Beyond role_init, `u_init_misc` calls `newpw()` → emits `rnd(role.enadv.inrnd)`
if `inrnd > 0`. Per-role values empirically:
**Healer 4, Knight 4, Priest 3, Wizard 3, Monk 2** — others 0.

**Why.** Without modeling these, every wizard/archeologist/priest/
healer/knight/monk session diverges at the role_init point even
when the dungeon init is otherwise correct.

**How.** `js/role.js` ports the gender randomization sites and
exposes `role_enadv_inrnd()` for the post-dungeon newpw rnd. Pantheon
loop is currently modeled as a single iteration; future work:
honest port using per-role `lgod` data.

---

## 7. The "trap" pattern: hardcoded sequences from one seed

**Lesson.** `js/fastforward.js` is a hardcoded list of `rn2(N)`
calls extracted from one specific session (seed8000, Tourist,
normal mode). It works perfectly for that one session and *only*
that one session. For any other role, mode, or seed, the call shape
diverges within ~200 calls.

**Why.** PROMPT.md Part 8 calls this out explicitly: "fastforward.js —
DELETE IT, ONE STEP AT A TIME." The trap is tempting because it
gets seed8000 from "almost matching" to "fully matching" with little
work. But the cost is that improvements seem to be working when they
aren't generalizing.

**How.** Port real C functions in place of fastforward sections. Each
ported function:
- Mirrors C call-by-call with same rn2 args.
- Honors all C-side branching (mode, role, race, alignment, seed
  values).
- Verified against seed8000 (canary) for non-regression first.
- Then re-scored to see how many other sessions advance.

**Pattern that's been working.** Pick a single C function (or a small
contiguous block) named in `compare-firstdiv --prng-only --all`.
Read the C carefully. Port it. Run score-table; if seed8000 still
matches and the aggregate moves up, ship.

---

## 8. compare-firstdiv must filter to PRNG-only for event-bearing sessions

**Lesson.** Many session recordings interleave diagnostic events
(`>funcname`, `<funcname=retval`, `^tag[args]`, `^mapstate[...]`)
with `rn2/rnd` calls. A naive position-by-position comparison reports
firstDiv@0 because C's first log line is an event but JS emits
nothing for events.

**How.** `--prng-only` filters BOTH sides to PRNG calls before
comparing. Matches the same logic score-table.mjs uses for the p:
column. Reveals the real PRNG drift point.

**Caveat.** This means the comparator and scorer are deliberately
ignoring the event channel entirely. Once JS starts emitting events
(future work), a different comparator mode will be needed.

---

## 9. nethackrc options that affect PRNG must be plumbed

**Lesson.** Every `OPTIONS=` key that affects a C-side branching
decision (especially in early-game / level-gen code) must be parsed
into game state. Missing one introduces silent PRNG drift even if
all the algorithmic ports are otherwise correct.

**Why.** seed0900-tourist had `OPTIONS=playmode:explore`, which
maps to C's `discover` flag. C's `getbones` (bones.c:639) returns
early if `discover` is set, skipping the `rn2(3)` at line 645. JS
already had a `flags.explore` check in its `getbones` stub, but
options.js never set the flag — the parser handled `playmode:debug`
but not `playmode:explore`. Consequence: JS emitted an extra
`rn2(3)` that C didn't, advancing JS by one PRNG draw and pushing
every downstream call out of alignment. seed0900 was at 351 calls
matched; the one-line parser fix took it to 1285.

**How.** Audit `options.c`'s parser against `js/options.js`. Any
option whose value gets read by something other than UI code must
be propagated. `playmode` is the canonical example because it
gates `wizard`, `discover`, and several side effects that are
non-PRNG-affecting (e.g., `iflags.deferred_X`).

**Pattern.** Every commit that fixes a divergence at firstDiv@N for
some session group should ALSO check whether other sessions in the
group have similar nethackrc options that aren't yet parsed.

---

## 10. `fastforward_step` over-emits when commands don't advance turns

**Lesson.** Don't add a guard that prevents `fastforward_step` from
re-firing across non-movement command iterations until you have the
correct per-step seed-specific data to replace the accidental
matches.

**Why.** Investigated this turn: `moveloop_core` calls
`fastforward_step((g.moves || 1) - 1)` every iteration, including
when the previous command was non-movement (which leaves `g.moves`
unchanged). Each non-movement-step iteration RE-FIRES the previous
step's hardcoded seed8000 sequence. For seed8000's steps 11-19
(non-movement) this over-emits 14×9=126 extra calls.

The over-emission is BAD STRUCTURE but ACCIDENTALLY HELPS seed8000:
the over-emitted values land in cumulative-log positions where C's
movement steps 20-21 emit similar `rn2(5)/rn2(12)/rn2(70)/...`
sequences. Removing the over-emission (via a `_lastFastforwardStep`
guard) shrinks the JS log and breaks the accidental positional
alignment. Net aggregate regressed -177 calls in testing.

**How.** The structurally correct fix is a guard PLUS proper per-step
data for steps 11+ in fastforward_step. Without seed8000-step-20's
14 calls and seed8000-step-21's 14 calls (extracted from the
session: `rn2(5) rn2(20) rn2(5) rn2(5) rn2(12) rn2(5) rn2(12) rn2(12)
rn2(12) rn2(12) rn2(70) rn2(300) rn2(20) rn2(82)` and `rn2(5) rn2(16)
rn2(5) rn2(5) rn2(16) rn2(5) rn2(12) rn2(12) rn2(12) rn2(12) rn2(70)
rn2(300) rn2(20) rn2(82)`), the guard would lose net.

**Real fix.** Eventually replace fastforward_step with a real per-turn
moveloop port (mcalcmove + dosounds + gethungry + maybe_generate_rnd_mon
+ moveloop_core + per-monster distfleeck/m_move). That would emit the
right calls regardless of session and remove the need for the guard
at all.

---

## 11.5 Screen scoring is bottlenecked on PRNG matching first

**Lesson.** Of 10,902 total screen captures across 44 sessions, only
15 currently match — and ALL 15 are in seed8000-tourist-starter. No
other session has any matching screens.

**Why.** Screen matching requires both (a) PRNG matching that lets the
JS port reach the same gameplay state as C, AND (b) display rendering
that produces the same 24×80 grid. Currently (a) holds only for
seed8000 (because of fastforward.js hardcoded for it) — every other
session diverges PRNG-wise within ~1500 calls of game start, well
before any meaningful gameplay screens get captured.

**How.** Don't pursue screen-scoring fixes until PRNG matching extends
significantly past startup for at least one non-seed8000 session.
The current "screens stuck at 15" is a SYMPTOM of PRNG limitations,
not a separate problem to solve. Once a non-Tourist session reaches
moveloop with correct PRNG, its screen captures will start mattering;
THEN per-command pline plumbing becomes a productive lever.

The screen scoring bottleneck order:
1. Match PRNG into moveloop for at least one non-seed8000 session.
2. Get screens to match for THAT session's early turns.
3. Generalize per-command pline plumbing to other sessions.

Chasing screen fixes ahead of step 1 produces no aggregate
improvement (and risks regressing seed8000's 15 matches).

---

## 11. JS pline writes only `_pending_message`; flush_screen renders it

**Lesson.** Adding a new command handler that calls `pline()` does
NOT cause its message to appear on the screen captured for that step.
The capture happens during `nhgetch` BEFORE the handler runs;
`flush_screen` (which renders `_pending_message` to row 0) ran
earlier in the same iteration with the previous turn's leftover
message.

**Why.** Investigated this turn: tried adding a `+` (view spells)
handler that emits "You don't know any spells right now." via pline.
Score-table showed no improvement on seed8000's screen 13. Tracing:
moveloop_core's order is

  1. flush_screen (renders current `_pending_message` to grid)
  2. rhack — nhgetch hook fires INSIDE rhack, BEFORE the handler
     runs, capturing the grid. Then handler runs, sets
     `_pending_message`.
  3. `_pending_message = ''` (cleared)

So the handler's pline only affects the NEXT iter's flush_screen
output; but the clear at step 3 wipes it before flush_screen runs.

**How.** Don't try a one-line "remove the clear" fix — that breaks
13 of 15 currently-matching screens because previously-empty rows
get polluted with stale messages from prior turns. The proper fix
is to make pline write directly to the grid (mirroring C's
top-line behavior of immediate display) AND to trigger a re-render
between handler and the next nhgetch.

---

## 12. Chargen port — RESOLVED via per-role bitmask + UI sim (commits 0e45afd, 0df7f38, 65450be)

**Final approach.** chargen_simulate(moves) in js/role.js walks the
keystroke prefix after name+\r:
- 'y'/'a'/space/\r/\n/@/* → pick_role+race+gend+align (4 rn2 calls).
- 'n' → manual menu mode. Per-stage (RS_ROLE→RACE→GENDER→ALGNMNT),
  if attribute unset and >1 valid, fire rigid_role_checks
  (PICK_RIGID emits rn2(1) for each unset attr with exactly 1 valid)
  then read menu accelerator key from moves to set the attribute.
- 'y' followed by 'n' (rejection of "Is X OK?") → fire 4 picks
  then enter manual mode (the picks' values are discarded; PRNG
  state still advances).

**Wiring.** allmain.js newgame() calls chargen_simulate BEFORE
fastforward_pre_dungeon (which contains init_objects). Detection in
options.js detectChargenNeeded(opts): runs whenever ANY of role/race/
gender/align is unset in nethackrc. Picked attributes are stored on
g.opts_role/race/gender/align so role_init's nemgend and the welcome
banner work correctly.

**Required data tables** (now in js/role.js):
- ROLE_DATA[13]: per-role races/gens/aligns lists.
- RACE_ALIGNS / RACE_GENDS: per-race allowed sets (e.g., elf only
  allows chaotic alignment, regardless of role).

**Impact.** 7 sessions advanced from firstDiv@0 to 1+ matched turn:
- seed0002-healer:    p:(0)90 → (1)1008 (+918)
- seed0004-feeding:   p:(0)108 → (1)544 (+436)
- seed0006-wizard:    p:(0)138 → (1)1008 (+870)
- seed0007-rogue:     p:(0)190 → (2)1409 (+1219)
- seed0009-swimmer:   p:(0)126 → (1)529 (+403)
- seed0014-dequa:     p:(0)78 → (1)1517 (+1439)
- seed0077-rogue:     p:(0)445 → (1)2445 (+2000)

Total chargen contribution: +7888 PRNG calls and +7 matched turns.

**Caveats discovered during port.**
- C role order has Rogue=7, Ranger=8 (role.c:318/358). JS originally
  had them swapped — fixed in commit fcab8c6.
- pick_align rn2(N) where N depends on race AS WELL AS role: e.g.,
  Caveman+gnome → 1 align (neutral). Wizard+orc → 1 align (chaotic).
  Race ALIGNs subset is required (RACE_ALIGNS table).
- rigid_role_checks runs INSIDE plsel_startmenu (role.c:2814), which
  is only invoked when n>1 (menu shown). For attributes auto-set
  via rigid_role_checks during a previous menu's setup, no rn2 fires
  in the later stage's "n=1 just pick" branch.
- '~' / filter-reset menus and complex re-pick flows (seed0006 step
  22+) are NOT yet modeled. seed0006 still diverges at index 1
  (the 2nd pick_align after a complex restart) but matches 1 turn.

---

## 13. JS flush_screen clears grid; C overlays incrementally

**Lesson.** JS's `flush_screen` calls `display.clearScreen()` then
re-renders state to the grid. So even if `_pending_message` were
preserved from the previous iteration, JS still resets the grid
each iteration; only the current pline shows.

C's flush_screen doesn't clear — it overlays current state on top of
existing buffer. The toplin message persists across iterations until
an explicit pline overwrites or another command displaces it.

**Why.** Verified this turn: tried removing the `_pending_message = ''`
clear in moveloop_core to allow messages to persist; expected this to
fix seed8000's 8 missing screens (s11, s13, s15, s17, s18, s22 etc).
Instead, seed8000 dropped from s:(15)15/23 to s:(1)1/23 because the
welcome message ("Aloha Contestant, welcome to NetHack!...") persisted
into screens 1+, polluting rows that should have had different state.

**How.** Proper fix requires refactoring JS's display layer to mirror
C's overlay-not-clear behavior. Each pline call should write to the
grid directly (not via `_pending_message`), and `flush_screen` should
NOT call `display.clearScreen()`. cls() at game start handles the
initial wipe; subsequent flush_screens just update what changed.

Until then: don't pursue persisting `_pending_message`. It's a deeper
fix than a one-line edit and any halfway version regresses seed8000.

---

## 14. `seed8000` is the canary, not the goal

**Lesson.** seed8000-tourist-starter is the only public session whose
fastforward exactly matches its seed. Every commit must verify
seed8000 is preserved at p:(11)3126/3130 *before* shipping. If
seed8000 regresses, the change introduced a regression even if it
helped other sessions — investigate before merging.

**Why.** Most port work is for the OTHER 43 sessions. seed8000
already (mostly) works because the skeleton was tuned for it. Real
score gains come from advancing the other 43 — but a regression on
seed8000 indicates the port has a bug that probably affects all
sessions, just visibly on this one because it has the most lockstep
matching.

**How.** Always run `node scripts/compare-firstdiv.mjs --prng-only seed8000-tourist-starter`
after any change to dungeon/role/init code. firstDiv must remain at
3103. If it moves, fix before committing.

---

*Append new entries above this line. Each entry numbered, dated, and
linked to the commit that introduced/fixed it.*
