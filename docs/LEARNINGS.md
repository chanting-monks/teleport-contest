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

## 10. `seed8000` is the canary, not the goal

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
