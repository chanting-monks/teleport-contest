# A One-Shot Prompt for Porting NetHack 5.0 to JavaScript

You are porting NetHack 5.0 from C to JavaScript with bit-exact parity for
the Teleport Coding Challenge. Your fork starts at near-zero. Your goal
is to climb the leaderboard by passing as many of 88 recorded C sessions
as possible (44 public + 44 held-out you never see). Each session passes
when both PRNG and Screen channels match 100% positionally.

This document is your operating manual. It contains lessons accumulated
from prior porting attempts. Read it fully before writing any code. The
single most expensive class of mistake is starting to port without
building the right diagnostic infrastructure first — so don't.

---

## Part 0 — You are running in iteration mode

This repository is run by a continuous loop of Claude Code iterations.
A cron fires every hour (the routine API's minimum interval); each
iteration ideally works for hours and commits many improvements before
exiting. The loop NEVER auto-halts.

Before doing anything else on every invocation:

1. Read [`STATE.md`](STATE.md). Honor `halt: true` (commit nothing, exit).
2. Read [`docs/ITERATION.md`](docs/ITERATION.md). It defines the loop,
   the kill switch, the leaderboard cadence, and the **mandatory commit
   message format**.
3. Run `node scripts/score-table.mjs` to capture the canonical parity
   table for all 44 public sessions before you make any change. This
   is your baseline.

Every commit on `main` MUST contain the parity table produced by
`scripts/score-table.mjs`, with a line per session in the canonical
form:

```
seed0008-filename   p:(12)2423/3224   s:(8)8/35   e:(10)123/987   m:(9)16/40
```

`p:` = PRNG (turns fully matched, calls matched/total). `s:` = Screen
(boundaries fully matched/total). `e:` = events (placeholder until
Part 2/3 infrastructure exists). `m:` = map snapshot (placeholder until
Part 3.5 infrastructure exists). The full spec is in `docs/ITERATION.md`.

**Async human review depends on this table.** Reviewers watch `git log`
to see whether the agent is making progress; the table makes every
commit legible without checking out the worktree. Skipping it or
producing a non-canonical version breaks the review loop.

The rest of this document is the porting manual you consult during
each iteration's WORK step. Build the diagnostic infrastructure first
(Parts 2-3), then port. The cardinal rules of Part 5 apply on every
iteration.

---

## Part 1 — What you inherit

**Frozen files** (judge overlays from `frozen/` on every scoring run):

- `js/isaac64.js` — canonical PRNG engine (BigInt ISAAC64, bit-exact w/ C)
- `js/terminal.js` — 24×80 grid + `serialize()` (defines "the screen")

**Editable** (this is your code):

- `js/jsmain.js`, `js/rng.js`, `js/display.js`, `js/const.js`, all other `js/`

**Reference** (read-only):

- `nethack-c/upstream/` — NetHack 5.0.0_Release C source. Your bible.
- `nethack-c/patches/` — 6 patches that produce the deterministic
  recorder build (PRNG logging, SI/SO charset capture, fixed datetime).
  Read these to understand what C actually records.
- `sessions/` — 44 public `*.session.json` — each step is
  `{key, rng[], screen, cursor}`. The judge passes only
  `{seed, datetime, nethackrc, moves}` into your `runSegment`.

**The contestant API** (the only contract you must satisfy):

```js
export async function runSegment(input, prevGame=null) {
    // input: {seed, datetime, nethackrc, moves}
    // return: an object with three methods —
    //   getScreens():  string[]              one per input boundary
    //   getRngLog():   string[]              every PRNG call in order
    //   getCursors():  [col, row, vis][]
}
```

---

## Part 2 — Own your recorder fork (prerequisite to Parts 3 and 4)

The contest ships `nethack-c/upstream/` (NetHack 5.0 source) and
`nethack-c/patches/` (6 patches that produce the deterministic recorder
used to make `sessions/`). You will need to extend BOTH:

- Add patches that emit additional diagnostic markers in the RNG log
  stream (Part 3).
- Add patches that snapshot game state per turn (Part 3).
- Add new keyplans and re-record to generate supplemental coverage
  (Part 4).

This means owning a build pipeline that pulls upstream, applies the
contest's patches PLUS your own, and produces a private recorder you
can run on demand.

### 2.1 Directory layout (suggested — adapt as you like)

```
nethack-c/
├── upstream/                  ← submodule (read-only, pinned to 5.0.0)
├── patches/                   ← contest's 6 patches (don't modify;
│                                modifying would invalidate the
│                                official sessions/)
├── my-patches/                ← YOUR diagnostic patches
├── recorder/                  ← gitignored: built source tree
│                                (upstream + contest patches only —
│                                use this to verify sessions/)
└── debug-recorder/            ← gitignored: built source tree
                                 (upstream + contest patches + your
                                 patches — use this for debugging
                                 and supplemental session generation)

my-keyplans/                   ← named keystroke scenarios (you write)
my-sessions/                   ← gitignored: re-recorded sessions
                                 with your diagnostic markers +
                                 supplemental coverage (you generate)
```

### 2.2 Two builds, two purposes

**BUILD A — clean recorder** (verifies official sessions are reproducible)

```
bash nethack-c/build-recorder.sh
→ nethack-c/recorder/install/games/lib/nethackdir/nethack
```

Use to: re-record `sessions/` and confirm byte-equal output. If your
re-recording differs from the shipped `sessions/`, your build is wrong.
Fix before going further.

**BUILD B — debug recorder** (your private debugging tool)

Write your own build script that:

1. rsync upstream → debug-recorder
2. apply `patches/*.patch` (contest's, in order)
3. apply `my-patches/*.patch` (yours, in order)
4. configure + make

```
→ nethack-c/debug-recorder/install/games/lib/nethackdir/nethack
```

Use to: re-record `sessions/` → `my-sessions/` with diagnostic markers.
Generate supplemental sessions from keyplans. Every internal debugging
task uses this binary.

### 2.3 The cardinal rule for your patches

Your patches MUST NOT alter PRNG calls, screen output, or any
observable game behavior. They are PURELY additive — they add
diagnostic information to the recording log without changing what
the game does.

Common ways to break this:

- Calling `rand()`/`random()` inside your diagnostics (consumes RNG state).
- Calling `time(NULL)` for timestamps (defeats the fixed-datetime patch).
- Allocating memory in a hot path (changes object IDs / heap order).
- Logging through stderr/stdout instead of a private channel
  (pollutes the screen capture).
- Adding a function call where C doesn't have one — even a no-op
  function changes the call stack and may affect debug builds.

Pre-flight check after every patch you add: re-record one of the shipped
sessions with your debug-recorder. The PRNG calls and screens should
match byte-for-byte. The only difference should be your new diagnostic
content. If they don't match, your patch is corrupting state. Fix
before committing.

### 2.4 What kind of diagnostic information to emit (you design the format)

The general pattern: at every state-change site you care about, write a
tagged line into the recording log alongside PRNG calls. The tag tells
you which function emitted it; the body tells you enough to localize
a divergence.

Decide on:

- A naming convention for tagged lines that doesn't collide with the
  PRNG call format already in the log.
- A canonical argument format (positional? key=value? whatever you can
  parse easily).
- Which functions are worth instrumenting. A reasonable starting set:
  anything that mutates a monster, an object, the map, the hero's
  state, or the display. Add more as your debugging surfaces what
  you wish you'd traced.
- A separate per-turn state-snapshot mechanism: hash the entire live
  game state at every input boundary and emit the hash in the log.
  When two runs have matching PRNG but different snapshot hashes,
  you've caught a state divergence that hasn't cascaded into RNG
  calls yet — extremely valuable.

Mirror the SAME convention in your JS port. For every diagnostic line
C emits, JS must emit an identical line at the same relative position.
Your comparator then becomes "find the first line that differs" —
usable on PRNG calls, diagnostic markers, or state hashes
interchangeably.

### 2.5 Re-recording workflow

Write a script that takes a list of session files. For each: extract
seed/datetime/nethackrc/moves. Run debug-recorder with the right env
vars, piping moves to stdin. Capture the diagnostic log + screen
capture stream. Stitch into a `session.json` with the same step-by-step
structure the official format uses, but with the extra diagnostic
content in `step.rng[]`.

First run target: re-record all 44 of `sessions/` into `my-sessions/`.
The PRNG and screen channels should match byte-for-byte. The only
additional content is your diagnostic markers. If anything else differs,
your patches or your build broke something.

Once that works, generating supplemental sessions from keyplans is the
same workflow with a different input source.

### 2.6 Why this comes BEFORE porting

It is tempting to skip this and start porting JS immediately. Don't.
Without the debug-recorder, your only debugging signal is "PRNG diverged
at call N" — which tells you nothing about WHERE in the code that
happened. Building this infrastructure costs maybe a day. Skipping it
costs weeks.

---

## Part 3 — Build the diagnostic channel

The contest scores PRNG and Screen. Both are positionally compared.
But PRNG-only divergences are EXTREMELY hard to localize. Knowing
"your RNG call #1234 was `rn2(8)` where C had `rn2(20)`" tells you
nothing about WHERE in the code that happened.

Build a third diagnostic channel — events — that is NOT scored but is
interleaved with PRNG calls in BOTH C and JS recordings. Then a
divergence shows up as "JS emitted `<event-A>` where C emitted
`<event-B>`" — and you immediately know which function path is wrong.

This investment pays for itself within hours. Every team that skips it
spends weeks bisecting RNG sequences manually.

### 3.1 C-side: emit events from the recorder

Add a 7th C-side patch (your own, not in `nethack-c/patches/`) that
introduces a logging primitive — for example, a function or macro that
formats a tagged line and writes it to the same log as PRNG calls.
Wire it from the bottleneck functions you care about: anything that
mutates a monster, an object, the map, the hero's state, or the
display. Examples: object placement / removal, monster creation /
death / movement, attacks, status updates, message line writes,
level transitions, hunger ticks.

The exact tag names and argument format are yours to design. The
constraint is consistency: same tag with same args from C and JS for
the same situation.

### 3.2 Mirror in JS — emit the SAME events from corresponding JS code

For every diagnostic event C emits, your JS port must emit an identical
event at the same relative position. The discipline: for every event
in C, there is EXACTLY ONE place in JS that emits it — in the matching
JS function, under the matching condition. If you emit the same event
from two JS sites, you have wrong code structure.

### 3.3 Re-record the public sessions with events

Build the patched recorder once (Part 2). Re-record each session in
`sessions/` — write the events into `step.rng[]` interleaved with PRNG
calls. Save these as your private debugging set
(`my-sessions/with-events/`), separate from the official `sessions/`.

The official judge uses `sessions/` (PRNG + screens only). Your debug
runs use `my-sessions/with-events/`. Same C state, same RNG sequence,
just richer logs.

### 3.4 Build a comparator that displays divergence in event terms

Write a script that walks the JS rng log and the C session.rng log in
parallel, finds the FIRST mismatch, and prints:

- 5 events / RNG calls before the divergence
- The mismatching pair
- 5 after
- The C event's source annotation (`@ funcname(file:line)`)

This is your primary debugging interface. Run it after every change.

### 3.5 Add a 4th channel — state snapshot hashing

At every input boundary, hash the entire game state (hero pos, hp, fmon
chain, fobj chain, level grid, traps, stairs) into a compact string and
emit it as a tagged event. C emits the same. When the hash diverges but
PRNG matches, you have a state divergence that doesn't (yet) affect
random numbers but will eventually cascade.

---

## Part 4 — Supplemental test sessions (your own coverage net)

The contest scores against 88 sessions: 44 public (in `sessions/`) + 44
held-out. Your port can pass all 44 public and still flunk the held-out
because they exercise code paths the public set doesn't touch. Examples
the public set may under-cover:

- Roles you didn't write much code for (the public set might be heavy
  on Tourist/Wizard; held-out probably tests Caveman, Healer, Knight,
  Samurai, Monk, Priest, Ranger, Rogue, Archeologist, Barbarian,
  Valkyrie too)
- Races other than human (dwarf, elf, gnome, orc)
- Alignments other than neutral
- Specific actions: kicking, throwing, polymorphing, praying, drinking
  from fountains, reading scrolls, zapping wands, applying tools,
  eating corpses
- Dungeon areas: Mines, Sokoban, Quest, Fort Ludios, Castle, Gehennom,
  Elemental Planes
- Multi-segment scenarios: save/restore, death + bones revisit, quest
  portal + return
- Hallucination, blindness, confusion, stunning, levitation,
  polymorphed-self states
- Combat flavor: ranged attacks, spell casting, two-weapon, riding,
  grabbing/swallowing

YOUR JOB: build a workflow that generates supplemental sessions covering
the dimensions you suspect are under-represented, and run your port
against them as a private test set.

### 4.1 Build a keyplan-based session generator

A "keyplan" is a named keystroke sequence for a specific scenario:

```
keyplans/wizard-zap-wand.txt:
  # role:Wizard, race:Elf, align:Chaotic
  # objective: cast a spell, then quaff a potion, then zap wand
  OPTIONS=name:Tester,role:Wizard,race:Elf,align:Chaotic
  seed: 4321
  datetime: 20260514120000
  keys: " yyyy Z01 q\\b q "
```

Then a script:

```
bash record-keyplan.sh keyplans/wizard-zap-wand.txt → my-sessions/wizard-zap-wand.session.json
```

The script runs your patched recorder with the keyplan's seed, datetime,
nethackrc, and key sequence, and captures a `session.json` in the same
format the contest uses. Now your event-aware comparator works against
this session too.

### 4.2 Coverage matrix to fill

13 roles × 5 races × 3 alignments = 195 combos. You don't need all of
them, but you should have at least:

- 1 session per role × default-race × any-align (13 sessions)
- 1 session per major action verb (kick, throw, zap, read, drink, apply,
  pray, eat) — 8+ sessions
- 1 session per major dungeon branch entrance (Mines, Sokoban, Quest
  portal entry, Castle approach) — 4+ sessions
- 1 session per major status effect onset (hallucinate, blind, confused,
  stunned) — 4+ sessions
- Multi-segment: save+restore, death+bones — 2 sessions

That's ~30 supplemental sessions covering dimensions the public set
probably samples thinly. They become your private "did I just regress
something the held-out cares about?" detector.

### 4.3 Discipline: don't game the comparator

Supplemental sessions are for debugging your code, not for shaping your
port to specific outputs. If your port matches a supplemental session
because you hardcoded its expected value: you'll fail the held-out
anyway. The supplemental sessions exist to FORCE you to port code paths,
not to memorize answers.

Treat them exactly like `sessions/`: run your port, find the first
divergence, port the C function it points to, repeat.

### 4.4 Generation strategy: bias toward sparse code paths

After every batch of porting work, scan the C source for functions your
port hasn't touched yet. For each untouched function, design a keyplan
that exercises it (look at C's call graph: which command or condition
reaches that function?). Add it to the supplemental set. This way your
test coverage grows in step with your port, pulling in code paths the
public set doesn't bother with.

### 4.5 Self-test cadence

```
bash frozen/score.sh                 # official: 44 public sessions
bash my-sessions/score.sh            # private: your supplemental set
```

Run both after every commit. Public score is what the leaderboard sees;
supplemental score is what predicts your held-out performance. A change
that improves public but regresses supplemental should be treated with
suspicion (the supplemental likely caught a hidden coupling you'd
otherwise discover only when held-out scores drop).

---

## Part 5 — The cardinal rules

Read these. Re-read them when stuck. They will save you days each.

### 5.1 PRNG IS THE SOURCE OF TRUTH

If your PRNG sequence diverges at call N, every subsequent call is
garbage. Fix the FIRST divergence, re-run, repeat. Do not chase
downstream symptoms. (Events make this orders of magnitude faster.)

### 5.2 READ THE C, NOT THE COMMENTS

Port implementation, INCLUDING ITS BUGS. When a comment says "this does
X" and the code does Y, port Y. NetHack is 46 years old; comments are
stale.

### 5.3 FOLLOW THE FIRST DIVERGENCE

Every subsequent mismatch is a cascade. Fix #1, re-run, repeat. Never
investigate divergence #50 while #1 is unfixed.

### 5.4 DO NOT REVERT HIGH-CONFIDENCE C-FAITHFUL FIXES THAT CAUSE REGRESSIONS

When a change that faithfully matches C causes other sessions to regress,
the regressions reveal COUPLED BUGS — places where JS was accidentally
matching C for the wrong reasons. These are extremely difficult to find
by other means and extremely valuable to fix. Stand firm. Analyze the
regression. Find the coupled bug. Reverting hides real problems.

### 5.5 NEVER ADD JS-ONLY GUARDS TO HIDE REGRESSIONS

"Add `if (specialCase)` so this only fires for non-tutorial sessions"
is overfitting. If C doesn't have the condition, JS shouldn't either.
Mask the real bug and you'll pay later.

### 5.6 TRACE C'S CALL CHAINS — PORT THE REAL FUNCTION CALLS

The single most productive technique. When an event divergence shows
JS emitting X where C emits Y:

1. Read the C annotation. `>pline @ xkilled(mon.c:3495)` tells you the
   file and function.
2. Read that C function. Find its call chain — what it calls, in what
   order, with what side effects. Example: C's `xkilled()` calls
   `nomul(0)` → `end_running(TRUE)` → `You("kill...")`.
3. Port those calls in JS in the same order. Don't add event strings —
   add the actual function calls. `nomul(0)` is a real function with
   real state resets. Calling it produces the right events as a natural
   consequence.

### 5.7 SUSPECT NEW CODE, TRUST EXERCISED CODE

Code run successfully across many passing sessions and many commits is
almost certainly correct. Code written today is almost certainly wrong.
When investigating a divergence, your prior should be overwhelmingly
weighted toward the newest, least-tested code. The most common mistake:
spending hours investigating mature infrastructure to explain a
divergence caused by a 3-line stub written 5 minutes ago.

---

## Part 6 — The gotchas (these will eat your week if you miss them)

### 6.1 LOOP CONDITION RNG

`for(i=1; i<=d(5,5); i++)` evaluates `d(5,5)` ONCE in C, EVERY ITERATION
in JS. Always hoist:

```js
const limit = d(5, 5);
for (let i = 1; i <= limit; i++) ...
```

### 6.2 ARGUMENT EVALUATION ORDER

C is undefined; recorded with clang (left-to-right). JS is left-to-right.
They match — but for `f(rn2(5), rn2(3))` where confusion is possible,
pre-evaluate:

```js
const a = rn2(5); const b = rn2(3); f(a, b);
```

### 6.3 INTEGER DIVISION

`Math.floor()` and `Math.trunc()` differ for negatives. C's int `/` is
truncating. ALWAYS use `Math.trunc()` for ported division.

### 6.4 '\0' IS TRUTHY IN JS

C's `if (ch)` is false for `'\0'`. JS's is true. Check `ch !== '\0'`
explicitly.

### 6.5 UNDEFINED ARITHMETIC

`undefined + 1` is `NaN`. C zero-init makes this work; JS doesn't.
Initialize ALL numeric fields you'll arithmetic on.

### 6.6 MISSING `await` IS SILENT AND DEVASTATING

The orphaned promise resolves during an unrelated `await`, scrambling
execution order. PROPAGATE async UP the call chain to preserve C's call
ordering. Don't reorder calls to avoid making something async. If you
need a guard against this, write one that throws when game code fires
during a modal wait.

### 6.7 MAINTAIN owornmask IN EVERY EQUIP/UNEQUIP PATH

Including chargen's starting equipment. C uses `setworn()`/`setnotworn()`.
Mirror exactly.

### 6.8 THREE PRNG CONTEXTS — never mix them

- core (`rn2`/`rnd`/`d`/`rn1`/`rne`/`rnz`/`rnl`) — gameplay
- lua — special level scripts
- display — hallucination

Each has separate state. Wrap each so calls go to the right one.

### 6.9 OOC EVALUATION ORDER IN COMPLEX EXPRESSIONS

`arr[i++] = arr[i++]` is undefined in C; evaluate explicitly in JS.

### 6.10 POINTER ARITHMETIC

C's `mtmp = mtmp->nmon` traversal — port as iteration. C's
`&svm.mvitals[i]` — emulate via index.

### 6.11 BIT FIELDS

C's struct rm uses unions. `wall_info` aliases `flags`. Track these
explicitly in JS — don't try to use a JS union.

### 6.12 STATIC LOCAL VARIABLES

C's `static int counter` persists across calls. JS needs module-level
state.

### 6.13 DEC CHARSET

C records walls as `\x0e lqkmtujnvw \x0f`. The judge translates these
to Unicode (┌─│└┤┬├┴┐) automatically. You can store either form in the
grid; both compare equal.

### 6.14 SGR COLORS

C records colors as `\x1b[Nm` codes. The frozen `terminal.js`
`serialize()` emits these from `cell.color`/`cell.attr`. Map NetHack
colors:

- 0..7 (CLR_BLACK..CLR_GRAY) → ANSI 30..37
- 8 (NO_COLOR) → 39 (default)
- 9..15 (CLR_ORANGE..CLR_WHITE) → 90..97 (bright)
- ATR_BOLD/UNDERLINE/INVERSE → 1/4/7

Reset to default at end of line.

---

## Part 7 — Module structure must mirror C

This is non-negotiable. It's how you find code, how you port it, and how
the C annotations help you debug.

| C file | JS file |
|---|---|
| `src/allmain.c` | `js/allmain.js` |
| `src/mklev.c` | `js/mklev.js` |
| `src/mon.c` | `js/mon.js` |
| `src/monmove.c` | `js/monmove.js` |
| `src/hack.c` | `js/hack.js` |
| `src/cmd.c` | `js/cmd.js` |
| `src/eat.c` | `js/eat.js` |
| `src/pickup.c` | `js/pickup.js` |
| `src/mhitm.c` | `js/mhitm.js` |
| `src/uhitm.c` | `js/uhitm.js` |
| `src/zap.c` | `js/zap.js` |
| `src/save.c` | `js/save.js` |
| `src/restore.c` | `js/restore.js` |
| `src/bones.c` | `js/bones.js` |
| `src/dog.c` | `js/dog.js` |
| `src/dogmove.c` | `js/dogmove.js` |
| `src/sounds.c` | `js/sounds.js` |

Function names match C function names: `mksobj()` not
`makeStandardObject()`. `mfndpos()` not `findValidMonsterPositions()`.
When the C trace says `@ exercise(attrib.c:509)`, you should know
exactly where to look: `js/attrib.js`, function `exercise`.

Circular imports are FINE. ES modules handle cycles at runtime. Don't
stub a function to avoid an import cycle.

---

## Part 8 — The skeleton's traps to escape

### 8.1 fastforward.js — DELETE IT, ONE STEP AT A TIME

The starter ships with `js/fastforward.js`, a hardcoded sequence of
`rn2()` calls that fakes the RNG sequence for `seed8000`. This works for
`seed8000` only. It will never generalize. It will never pass a held-out
session. It is a trap.

The path forward: replace `fastforward_pre_mklev()` with real ports of
o_init/dungeon-init/u_init_misc. Replace `fastforward_step(N)` with a
real moveloop that calls real `dosounds`, `gethungry`, `monmove`, etc.
As you port, the fastforward arrays shrink and disappear.

### 8.2 Hardcoded inventory/state — port chargen instead

The skeleton has things like `g._goldCount = 757; g.u.acurr.a = [9,...]`.
These match `seed8000` by hand and are useless for everything else. Port
the real `u_init_misc` + `ini_inv`.

### 8.3 A "passing" seed8000 with fastforward gets you 1/88 score

Even if you keep the fastforward path AND make screens match, you pass
exactly one session. The leaderboard rewards generalization.

---

## Part 9 — The workflow (run this loop continuously)

```
while (passing < 88) {
    // 1. Score everything
    bash frozen/score.sh

    // 2. Pick the simplest still-failing session.
    //    (Sort by step count ascending; lowest first.)

    // 3. Run your event-aware comparator on it. Find the FIRST
    //    divergent event or RNG call. Note the C annotation.

    // 4. Open the C source file named by the annotation. Read the
    //    function. Read what it calls.

    // 5. Port the missing function (or fix the wrong one) in the
    //    matching JS file.

    // 6. Re-run the same session. The first divergence should move
    //    later (or the session should pass).

    // 7. Re-run frozen/score.sh — see if any other session improved
    //    or regressed. Treat regressions as discoveries (they expose
    //    coupled bugs); fix the underlying cause.

    // 8. Commit and push. Move to step 1.
}
```

The instinct to "port a few related functions all at once" is strong and
wrong. Port ONE function at a time. Verify ONE divergence at a time. The
accumulated evidence about what's matching keeps you sane.

---

## Part 10 — Architectural rules (non-obvious)

### 10.1 SINGLE-THREADED CONTRACT

No `setTimeout`. No `Promise.all` of game-state-mutating work. No
background tasks. C is single-threaded; your JS must be too. The only
async is for await-on-input. Anything else WILL break parity.

### 10.2 NO FAKE IMPLEMENTATIONS

A function is either fully ported or not ported at all. There is no
third state. A stub that consumes RNG without doing real work creates
invisible state drift that surfaces as "mystery divergences" in
unrelated subsystems weeks later. The vast majority of failing sessions
in prior attempts traced back to such stubs.

### 10.3 NO COMPENSATING COMPLEXITY

Don't invent state C doesn't have. If C tracks a flag with one integer,
JS tracks it with one integer. If you find yourself adding a
`_topMessageConcatEpoch` or `_savedMessage` or
`_preserveFrozenPromptScreen` — STOP. You're compensating for a
structural bug. Find and fix the structural bug.

### 10.4 NEVER SUPPRESS LOGS, NEVER RELAX COMPARISONS

Logs must honestly reflect what the code does. If JS emits an event C
doesn't (or vice versa), the code path is wrong — fix the code, not the
logging. Suppressing logs to make tests pass hides real bugs and dooms
the project.

### 10.5 PROPAGATE async/await UP, NOT DOWN

When a C function calls another that in JS needs await (input, display,
timing), make the caller async too. Do NOT rearrange calls to avoid
async — that distorts C's execution order. async is JS's answer to C's
blocking I/O; propagate it.

### 10.6 PROPAGATE PARAMETERS DOWN

When a C function uses contextual info (window dimensions, player state,
menu type), wire callers to pass it through. Don't hardcode an
approximation at the leaf with a TODO. Wire the plumbing now, when you
understand the system.

### 10.7 EVENTS ARE STRUCTURAL MARKERS, NOT OUTPUT TO MATCH

Every event in C comes from ONE specific place in C code — one function,
one condition, one call site. Your JS must reproduce that same
structural situation: same function, same logic, same condition. The
event is then emitted from that ONE corresponding place in JS as a
natural consequence.

### 10.8 IF YOU CREATE A function_no_event() VARIANT — STOP

If you split a function into "with event" and "without event" versions,
the real problem is JS calling DIFFERENT functions than C. C has ONE
`remove_object` — JS should too. Trace which function C actually calls
at that point. Port the same one.

---

## Part 11 — Order of attack (priority)

**Phase 1 — Diagnostic infrastructure** (DO THIS FIRST)

- Add diagnostic event logging to your local C build (own fork of
  `nethack-c/`).
- Re-record `sessions/` to `my-sessions/with-events/`.
- Build the event-aware comparator.
- Add per-turn state-snapshot hashing in JS.
- Add a guard module to catch missing await.

**Phase 2 — Replace fastforward** (kill the trap)

- `js/o_init.js`: full port of `randomize_gem_colors`, `shuffle_objects`,
  etc.
- `js/dungeon.js`: port `init_dungeons`.
- `js/u_init.js`: port `u_init_misc`, `u_init_role`, `ini_inv`.
- `js/role.js`: port `role_init`.
- `js/mklev.js`: real level generation (`mklev`, `makerooms`,
  `makecorridors`, `makewizard`, `place_level_features`, `fill_rooms`,
  `mineralize`, `bound_digging` — all of `mklev.c` plus `mkroom.c`
  and `mkmaze.c`).

**Phase 3 — Per-turn machinery** (every session needs these)

- `js/allmain.js`: real `moveloop_core`.
- `js/sounds.js`: `dosounds` (called every turn).
- `js/eat.js`: `gethungry` (called every turn).
- `js/monmove.js`: `m_move` + `dochug` + `mfndpos` + `distfleeck`.
- `js/mon.js`: `movemon`, `mcalcmove`, `mcalcdistress`, `makemon`
  (for spawns).
- `js/dog.js`, `js/dogmove.js`: pet behavior.
- `js/hack.js`: `domove` (hero movement).
- `js/cmd.js`: `rhack` (command dispatch).
- `js/display.js`: `docrt`, `flush_screen`, `bot`, `vision_recalc`.
- `js/vision.js`: `vision_recalc`, raycasting, lit/dark cells.

**Phase 4 — Player actions** (broad coverage)

- `js/pickup.js`, `js/drink.js`, `js/read.js`, `js/zap.js`, `js/apply.js`
- `js/uhitm.js` (hero attacks monster), `js/mhitu.js` (monster attacks
  hero)
- `js/mhitm.js` (monster vs monster), `js/spell.js`, `js/wield.js`,
  `js/do_wear.js`
- `js/dothrow.js`, `js/eat.js` (full), `js/pray.js`

**Phase 5 — Late game / special cases**

- `js/save.js`, `js/restore.js` (multi-segment)
- `js/bones.js` (death-and-revisit)
- `js/polyself.js` (polymorph)
- `js/quest.js` (quest entry)
- `js/end.js` (death)
- `js/sp_lev.js` (special level Lua interpreter)

**Phase 6 — Display polish** (screen scoring final percentage)

- Dim/lit cell coloring (CLR_BLACK for remembered out-of-sight floor)
- Status line with proper colors (HP red when low, etc.)
- Menu rendering (inventory, discoveries, --More-- prompts)
- Hallucination glyph rotation
- Map cursor positioning

Each phase enables more sessions to potentially pass. Don't skip phases —
later code depends on earlier code being correct.

---

## Part 12 — Parallelization (if you have multiple agents)

You can fan out work across sub-agents. Effective splits:

- Each agent owns one C file (one `.c` → one `.js`).
- Each agent picks one failing session and works only on it.
- One agent owns the comparator + diagnostic tools.
- One agent maintains the priority list of failing sessions.

Bad splits (have failed in practice):

- Splitting a single C function across two agents.
- One agent on RNG, another on screens — they're coupled.
- Random division of work — leads to overlapping edits.

Coordinate via shared task list. Each completed port should have:

- A note about which session it unblocked.
- A note about any C call chain it found that needs porting next.
- A regression report (which sessions, if any, lost ground).

---

## Part 13 — How to persist

This is a project measured in months, not hours. The failure mode is
never "the work got too hard"; it's drift, regressions you didn't catch,
and accumulated uncommitted state. These habits keep the slope positive
across thousands of small ports.

### 13.1 Commit after every divergence resolved

Not "after I finish this function." Not "when the screens line up."
Every divergence resolved is a permanent gain ONLY if committed.
Uncommitted work is at constant risk of being lost or muddled with
other changes that may or may not be helping.

### 13.2 Run the full test suite on every commit

`bash frozen/score.sh` after every change. Watch which sessions moved
(forward or backward). A regression caught immediately traces to ONE
commit; a regression caught two days later traces to a haystack.
Whatever dashboard you build on top of the scoring output is your only
honest signal of progress — treat it as gospel, not as a thing you
check occasionally.

### 13.3 Measure progress as "first divergence moved later"

A failing session whose first divergence moved from step 100 to step
500 is real progress. Track this in your commit messages: "seed0007
first PRNG div moved from step 392 to step 1247." If you can't measure
progress this way, you're probably not making any.

### 13.4 Write commit messages about WHY, not WHAT

The diff shows what changed. The message should record what you
discovered: "C's `xkilled()` calls `nomul(0)` BEFORE the death pline,
not after — fixes seed0007 div@392 by reordering JS path." This is the
only durable record of why decisions were made. Your future self (or
the next agent) will read these; the diff alone is opaque.

### 13.5 Don't pause to understand the whole system

NetHack is too big to hold in your head. Port one function. Verify.
Move on. The temptation to "first study how levels work" or "first
understand monster AI" almost always wastes a day. Port `domove`, see
what breaks, port what's needed to fix what broke.

### 13.6 Refactor when structure is the bug, not when structure is ugly

Two kinds of refactors:

**DIAGNOSTIC refactors** — driven by a concrete bug you can name.

- "I'm chasing a divergence that I can't localize because the same
  logic lives in three files and they've drifted."
- "This compensating-state machinery (epoch counters, latched frames,
  save/restore shims) was added to mask a structural mismatch with C.
  Until I rip it out, I can't see the real bug."
- "The C trace says the bug is in `mhitm()` but my JS code for `mhitm`
  logic is scattered across `cmd.js`, `hack.js`, and a stub in
  `mon.js`. I can't fix it until it's one function in one place."

Diagnostic refactors are essential. Skipping them costs more than
doing them. The refactor IS the fix.

**AESTHETIC refactors** — driven by "this is ugly."

- "Let me rename these variables for clarity before continuing."
- "These three functions look similar; let me extract a helper."

These are usually traps during active porting. Defer them. Either leave
a TODO and continue, or save them for between porting tasks when the
suite is green.

The test: write down what bug the refactor fixes BEFORE starting.
Concrete divergence or blocker → diagnostic, do it now. Can't name
one → aesthetic, defer.

Cleanup discipline when you do refactor:

- Cleanups that touch many files happen as their OWN dedicated commit,
  not mixed with other porting work.
- Run the full scoring suite before AND after; a "pure cleanup" should
  produce zero change in passing sessions. Any regression from a pure
  cleanup is a real bug the old structure was hiding — don't revert
  the cleanup, hunt the bug.
- Time-box: if a cleanup is taking longer than expected, the scope is
  wrong. Stop, commit a partial cleanup that compiles and passes,
  leave a note about what's left.

### 13.7 Time-box stuck threads at 30 minutes

If a single divergence has eaten 30 minutes without a clear path
forward: write down everything you know about it as a comment in the
file (or a note), then switch to a different failing session. A day
later you'll see the original problem fresh. Pounding on it while
spinning costs more than skipping does.

### 13.8 Suspect new code, trust exercised code

Code that has run successfully across many sessions and many commits
is almost certainly correct. Code written in the last hour is almost
certainly wrong. When investigating a divergence, your prior should
overwhelmingly favor "the new thing is wrong." Stop second-guessing
battle-tested infrastructure.

### 13.9 Document surprises inline

Every time C does something unexpected — a comment that's wrong, a
side effect that's hidden, a state mutation that happens five function
calls deep — leave a comment in the JS port explaining it. These notes
compound: by month two, your codebase contains the consolidated wisdom
of every weird thing C does, and the next agent doesn't have to
re-discover any of it.

### 13.10 Don't conflate "missing port" with "buggy port"

If your port doesn't implement function X yet, that's missing — port
it. If your port implements X but X diverges, that's a bug — debug
it. The remedies differ. Misdiagnosing one as the other wastes hours.

### 13.11 Watch for the "I'm close" delusion

When you're sure a session is about to pass and just need "one more
fix" — stop. Run the suite. Verify the actual state. The feeling of
being close is uncorrelated with actual closeness; it's correlated
with how invested you are. Trust the dashboard, not the feeling.

### 13.12 Each session a clean handoff

The only way long projects compound is leaving the worktree in a state
someone (or some agent) can pick up. Clean status. Clear commit. One
thing in flight, not seven. If you stop work mid-debugging, leave a
note in the relevant JS file describing what you were chasing, what
you've ruled out, and what to try next.

### 13.13 The fastforward.js trap, restated

If you find yourself adding a new entry to `fastforward.js` or
hardcoding session-specific state — STOP. You are extending the trap.
The shortcut buys you 1 session and prevents 87. Always port the C
function instead, even if it takes 10x longer for that one session.

The cumulative effect of these habits is that month 2 looks like
month 1 plus permanent gains. Without them, month 2 is a different
set of bugs from month 1 because nothing was actually solved.

---

## Start here

1. Read [`STATE.md`](STATE.md) and [`docs/ITERATION.md`](docs/ITERATION.md).
   Honor `halt: true` if set.
2. Run `node scripts/score-table.mjs` to capture the baseline parity table.
3. If you're in the very first iteration: build your recorder fork
   (Part 2), then add the diagnostic channel (Part 3). Don't skip these
   even if they buy zero immediate score — they pay for themselves
   within a day.
4. Pick the focus session per `docs/ITERATION.md` step 4. Run your
   event-aware comparator (once it exists) or fall back to PRNG-only
   diff against the official scorer.
5. Open the C function named by the first divergence's annotation.
   Port it.
6. Re-run `scripts/score-table.mjs`. Commit + push to main using the
   canonical commit message format from `docs/ITERATION.md`. Update
   STATE.md.
7. Loop back to step 4 and start the next unit. Don't exit just because
   one fix landed. Keep going. If you feel stuck, the task is to figure
   out how to get unstuck — switch focus session, build a new diagnostic,
   re-read the C function, change the comparator, anything — but do not
   stop. Stuckness is a problem to solve, not a reason to exit.
   **ABSOLUTE RULE: never voluntarily stop.** "I've run out of easy wins"
   means PICK THE BIGGEST HARD ONE NEXT, not "wait for the user". The
   small-bug phase always ends; what follows is bigger ports of bigger
   functions (themerms, chargen, moveloop, per-command pline). Ship each
   in commit-sized chunks with seed8000 canary preserved. The cron is
   only a watchdog for involuntary exits.

Welcome to NetHack.
