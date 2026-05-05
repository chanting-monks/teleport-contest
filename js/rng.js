// rng.js — PRNG wrappers around ISAAC64.
// C ref: rng.c — three RNG contexts: core, display, lua.
// Contest: only core context is used for parity.

import { isaac64_init, isaac64_next_uint64 } from './isaac64.js';
import { game } from './gstate.js';

let _rngLog = [];
let _rngLogEnabled = false;

export function initRng(seed) {
    game.currentSeed = seed;
    // Convert seed to 8 little-endian bytes
    let s = BigInt(seed) & 0xFFFFFFFFFFFFFFFFn;
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
        bytes[i] = Number(s & 0xFFn);
        s >>= 8n;
    }
    game.coreCtx = isaac64_init(bytes);
    // NB: do NOT clear _rngLog here. Multi-segment sessions re-seed
    // between segments; the contest scorer expects the JS log to be
    // the cumulative sequence across all segments (matching C's
    // recorder which captures both the original game and the
    // restored/fresh game in one stream). Use clearRngLog() for
    // explicit reset at session start.
}

export function enableRngLog() { _rngLogEnabled = true; }
export function clearRngLog() { _rngLog = []; }
export function getRngLog() { return _rngLog; }
export function pushRngLogEntry(entry) { if (_rngLogEnabled) _rngLog.push(entry); }

function RND(x) {
    const val = isaac64_next_uint64(game.coreCtx);
    return Number(val % BigInt(x));
}

// C ref: rn2(x) — random number 0..x-1
export function rn2(x) {
    if (x <= 0) return 0;
    const val = RND(x);
    if (_rngLogEnabled) _rngLog.push(`rn2(${x})=${val}`);
    return val;
}

// C ref: rnd(x) — random number 1..x
export function rnd(x) {
    if (x <= 0) return 0;
    const val = RND(x) + 1;
    if (_rngLogEnabled) _rngLog.push(`rnd(${x})=${val}`);
    return val;
}

// C ref: rn1(x, y) — random number y..y+x-1
export function rn1(x, y) { return rn2(x) + y; }

// C ref: d(n, x) — roll n dice of x sides
export function d(n, x) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += rnd(x);
    return sum;
}

// C ref: rne(x) — exponentially distributed
// Internal rn2 calls are logged (matching C's PRNG log format).
export function rne(x) {
    const ulevel = game.u?.ulevel || 1;
    const utmp = ulevel < 15 ? 5 : Math.trunc(ulevel / 3);
    let tmp = 1;
    while (tmp < utmp && !rn2(x)) tmp++;
    if (_rngLogEnabled) _rngLog.push(`rne(${x})=${tmp}`);
    return tmp;
}

// C ref: rnz(i) — fuzzy random around i
// Internal rn2/rne calls are logged (matching C's PRNG log format).
export function rnz(i) {
    let x = i;
    let tmp = 1000;
    tmp += rn2(1000);
    tmp *= rne(4);
    if (rn2(2)) { x *= tmp; x = Math.trunc(x / 1000); }
    else { x *= 1000; x = Math.trunc(x / tmp); }
    if (_rngLogEnabled) _rngLog.push(`rnz(${i})=${x}`);
    return x;
}

export const c_d = d;
export const lua_d = d;
