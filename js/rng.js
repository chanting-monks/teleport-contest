// rng.js — PRNG wrappers around the frozen ISAAC64.
//
// Single source of truth: js/translated/rnd.js (translated rnd.c).
// State lives in `game.rnglist[CORE].rng_state` — a frozen-ISAAC64
// ctx structure populated by `init_isaac64`.  This module re-exports
// the translated rn2/rnd/etc. so engine code (`allmain.js`,
// `display.js`, etc.) and translated code (e.g. `o_init.js`'s
// `init_objects()`) drive the SAME state.  Without this unification
// the engine would have its own ctx and translated code would have
// its own — the two would diverge at any translated PRNG call.
//
// Logging: the build-engine.mjs script wraps each translated PRNG
// function to push `name(args)=result` into `game._rngLog` when
// `game._rngLogEnabled` is true.  `getRngLog()` returns that log;
// the contest scorer reads it for PRNG parity comparison.
//
// C ref: rnd.c — three RNG contexts (core, display, lua); contest
// only scores the core context for parity.

import { game } from './gstate.js';
import {
    rn2, rnd, d, rne, rnz, rnl,
    rn2_on_display_rng,
    init_isaac64,
} from './translated/rnd.js';

export { rn2, rnd, d, rne, rnz, rnl, rn2_on_display_rng };

// rn1(x, y) — C macro for `rn2(x) + y`.  Translator doesn't emit a
// function for macros, so define it here.
export function rn1(x, y) { return rn2(x) + y; }

// `seed` is a 32- or 64-bit number; translated init_isaac64 packs it
// into 8 little-endian bytes inside the function before reseeding.
export async function initRng(seed) {
    game.currentSeed = seed;
    // game.rnglist is populated by translated rnd.js's module-load
    // top-level statement, but resetGame() between segments drops
    // it (the per-segment fresh state semantic).  Reconstruct here
    // so `init_isaac64`'s `whichrng(fn)` lookup finds the entries.
    if (!Array.isArray(game.rnglist)) {
        game.rnglist = [
            { fn: rn2, init: 0, rng_state: { n: 0, r: null, m: null, a: 0, b: 0, c: 0 } },
            { fn: rn2_on_display_rng, init: 0, rng_state: { n: 0, r: null, m: null, a: 0, b: 0, c: 0 } },
        ];
    }
    await init_isaac64(seed, rn2);
    await init_isaac64(seed, rn2_on_display_rng);
    // Legacy alias: code paths that still read `game.coreCtx`
    // hit the same ctx as translated code.
    game.coreCtx = game.rnglist[0].rng_state;
    // C ref rnd.c: rng_logfile stays open across save/restore (each
    // segment of a multi-segment session appends to the same trace).
    // For our multi-segment replay (e.g. seed0030 with 10 segments)
    // the scorer reads game.getRngLog() ONCE at the end and compares
    // against C's all-segments flattened RNG.  Resetting _rngLog
    // here would drop every earlier segment's calls, so the score
    // would only reflect the LAST segment's match — initialize it
    // empty in enableRngLog (called once at start of segment 0 via
    // NethackGame.start) but never wipe between segments.
    if (!Array.isArray(game._rngLog)) game._rngLog = [];
}

export function enableRngLog() {
    game._rngLogEnabled = true;
    game._rngLog = [];
}
export function getRngLog() {
    return game._rngLog || [];
}
// Compatibility alias for any caller that pushed entries directly.
export function pushRngLogEntry(entry) {
    if (game._rngLogEnabled) (game._rngLog ??= []).push(entry);
}

export const c_d = d;
export const lua_d = d;
