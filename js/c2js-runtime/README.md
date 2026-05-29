# js/c2js-runtime

Hand-written libc / OS shim that the transpiler emits imports of.
Modules under this directory have **no C ancestor** — they exist to
provide the JS-side semantics the C code expects from `<stdio.h>`,
`<string.h>`, `<setjmp.h>`, etc.

The conformance pass exempts files under this directory from the
file-name-parity check (since they don't correspond to C source files
the translator owns).

## Phase 0 status

Empty.  Each module gets populated by the phase that first translates a
TU needing it:

- `string.js` — Phase 1 (`strlen`, `strcpy`, ...) when first arithmetic-
  testing C source uses string functions
- `stdio.js` — Phase 1 (`printf`-family routed through display)
- `input.js` — Phase 7 (`nhgetch`, `yn_prompt`, `getlin`, `getobj`,
  `getpos`, `menu`, `modal_guard`)
- `time.js` — Phase 6 (re-exports `getnow` from `js/calendar.js`)
- `setjmp.js` — Phase 8 (`NhLongjmp` class + helpers)
- `qsort.js` — Phase 5 (deterministic sort)
- `lua.js` — Phase 9 (decision: minimal interpreter vs hand-translated themerms)
