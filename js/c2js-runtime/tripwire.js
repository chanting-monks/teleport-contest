// tripwire.js — fail-loud detection of Promises in sync positions
// (UNWEDGE_PLAN Q4 / T2, design §23.237).
//
// The port's one PRNG-safety invariant is TOTAL AWAIT COVERAGE: a
// Promise consumed where a plain value is expected means an async
// function escaped without an await — fire-and-forget — which shows
// up later as inscrutable state-lag divergence (LEARNINGS §23.235).
// These tripwires turn that silent corruption into an immediate,
// located error.
//
// Enabled by NH_DEBUG_TRIPWIRE=1 (all local test tooling sets it);
// disabled = zero overhead (callers skip wrapping entirely).
// Browser-safe: reads globalThis.process?.env.

export const tripwireEnabled =
    !!(globalThis.process?.env?.NH_DEBUG_TRIPWIRE);

export function assertNotThenable(v, site) {
    if (v != null && typeof v.then === 'function') {
        throw new Error(`[tripwire] thenable returned at ${site} — an async `
            + `function escaped without await (fire-and-forget); see `
            + `docs/UNWEDGE_PLAN.md / LEARNINGS §23.235`);
    }
    return v;
}

// Wrap every function-valued member of a windowprocs-like object so
// sync-contract procs assert their returns.  Members named in
// `asyncOk` are input-reading procs whose Promise returns are part of
// the contract (awaited by callers).  No-op when tripwires are off.
export function tripwireWrapWindowprocs(wp, asyncOk) {
    if (!tripwireEnabled || !wp) return wp;
    for (const k of Object.keys(wp)) {
        const fn = wp[k];
        if (typeof fn !== 'function' || asyncOk.has(k)) continue;
        wp[k] = (...args) => assertNotThenable(fn(...args), `windowprocs.${k}`);
    }
    return wp;
}
