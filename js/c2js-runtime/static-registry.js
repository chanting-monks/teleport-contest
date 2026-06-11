// static-registry.js — per-session reset of translator-hoisted C
// function statics (Q9.5(b), single-process harness convergence).
//
// C function statics (`static int count = 0;` inside a function)
// hoist to JS module scope as `let __<fn>_<name> = <init>;`.  Module
// state persists for the Node process lifetime, so back-to-back
// sessions in ONE process leak state across sessions (LEARNINGS
// §23.143) — the historical reason the harness forked a subprocess
// per session.  The translator now emits, after each non-const
// hoisted static, a registration:
//
//     let __fn_buf = INIT;
//     __nh_register_static(() => { __fn_buf = INIT; });
//
// Re-evaluating INIT reproduces exactly what a fresh process would
// compute at module load (C static initializers are constant
// expressions; aggregate initializers produce a fresh object, which
// is precisely fresh-process behavior).  Registration order is
// declaration order, so cross-referencing statics reset in the same
// order module init ran them.
//
// __nh_reset_statics() runs at session start (jsmain runSegment) so
// every session sees fresh-process module state.  In the frozen
// production tree no registrations exist (regen-only emit) and the
// reset is a no-op.

const __resets = [];

export function __nh_register_static(resetFn) {
    __resets.push(resetFn);
}

export function __nh_reset_statics() {
    for (const f of __resets) f();
}

// Diagnostic: how many statics are registered (conformance/health
// scripts compare this against the translated tree's hoist count).
export function __nh_static_count() {
    return __resets.length;
}
