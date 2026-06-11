// rng.js — bridge between translated C calls and the frozen
// js/isaac64.js API.
//
// The C source declares
//   void isaac64_init(struct isaac64_ctx *ctx, unsigned char *seed, int len);
// but the frozen ISAAC64 module exposes a different API:
//   isaac64_init(seed_bytes) → ctx
//   isaac64_reseed(ctx, seed_bytes) → void
// Translated rnd.c expects to call the C-shaped 3-arg form on
// pre-existing rng_state structures stashed inside `game.rnglist[i]`.
// This wrapper bridges the two: it mutates the passed-in ctx in place,
// matching C semantics, by initializing its slots and then calling
// the frozen reseed routine.

import {
    isaac64_reseed as frozen_reseed,
} from '../isaac64.js';

const SZ = 256;

// Reset `ctx` to a pristine ISAAC64 state and seed it from `seed_bytes`
// (truncated to `len` bytes when provided).  C calls that pre-allocate
// the state struct (as our translated rnd.js does) end up here, and
// the result mutates in place — matching `void isaac64_init(...)` C
// semantics.
export function isaac64_init(ctx, seed_bytes, len) {
    ctx.a = 0n;
    ctx.b = 0n;
    ctx.c = 0n;
    ctx.n = 0;
    ctx.r = new Array(SZ).fill(0n);
    ctx.m = new Array(SZ).fill(0n);
    // §23.232y: rnd.c STRING_MODE migration converts new_rng_state from
    // a char-array [0,0,...] to a string '' — `seed_bytes` arrives as a
    // string in that case.  Frozen isaac64 does `BigInt(seed_bytes[idx])`
    // which fails on a single-char string ('a' isn't a BigInt).  Coerce
    // string to a byte array of char codes so the frozen path sees the
    // same shape regardless of which side built the seed.
    let coerced = seed_bytes;
    if (typeof seed_bytes === 'string') {
        coerced = new Array(seed_bytes.length);
        for (let i = 0; i < seed_bytes.length; i++) coerced[i] = seed_bytes.charCodeAt(i);
    }
    const seed = (typeof len === 'number' && Array.isArray(coerced))
        ? coerced.slice(0, len)
        : coerced;
    frozen_reseed(ctx, seed);
}
