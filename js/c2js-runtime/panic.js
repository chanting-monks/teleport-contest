// panic.js — NetHack's `panic` and `impossible` error functions.
// C ref: end.c:panic, src/pline.c:impossible
//
// `panic` is a hard abort — the C version saves bones and exits the
// process.  We translate to throwing, since JS modules can't terminate
// the host process cleanly.  The caller (or a top-level catch in
// jsmain.js) decides what to do.
//
// `impossible` is a soft assertion — C plines a message and continues.
// We log to console so reviewers see the message during testing, then
// continue.

export class NhPanic extends Error {
    constructor(msg) {
        super(`nh_panic: ${msg}`);
        this.name = 'NhPanic';
    }
}

// Format-string-aware: matches printf-family signatures NetHack uses.
// Most call sites pass a literal string with no args; a few use
// printf-style format args, so we route through the stdio formatter.
import { format_string } from './stdio.js';
import { traceImpossible } from './trace.js';
import { coerceCStr } from './string.js';

export function panic(fmt, ...args) {
    const msg = args.length ? format_string(coerceCStr(fmt), args) : coerceCStr(fmt);
    throw new NhPanic(msg);
}

export function impossible(fmt, ...args) {
    const msg = args.length ? format_string(coerceCStr(fmt), args) : coerceCStr(fmt);
    // Mirror into the trace stream so a counter-aligned differ can
    // pin which side fired the impossible and at what PRNG position.
    traceImpossible(msg);
    if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`nh_impossible: ${msg}\n`);
    } else {
        // Browser fallback
        console.warn(`nh_impossible: ${msg}`);
    }
}
