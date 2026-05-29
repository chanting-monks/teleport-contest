// math.js — libc <math.h> + small math helpers used by NetHack.
//
// All functions take and return JS numbers; the translator emits
// imports from this module whenever a translated TU references one of
// the names below.  No state, no side effects, no module-level
// mutables — pure pass-through to host JS where possible.

export function abs(x) {
    return Math.abs(x | 0);
}

// `sgn` is a NetHack convention (defined in include/extern.h).  Returns
// -1, 0, or +1 for negative, zero, and positive respectively.
export function sgn(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
}

export function min(a, b) {
    return a < b ? a : b;
}

export function max(a, b) {
    return a > b ? a : b;
}
