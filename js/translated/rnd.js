
const _NH_TRACE_CALLER = (typeof process !== "undefined" && process.env && process.env.NH_TRACE_CALLER === "1");
function _nh_trace_caller() {
    if (!_NH_TRACE_CALLER) return "";
    const stk = (new Error()).stack || "";
    const lines = stk.split("\n");
    for (let i = 1; i < lines.length; i++) {
        const L = lines[i];
        if (L.includes("/rnd.js:")) continue;
        if (L.includes("/c2js-runtime/")) continue;
        let m = L.match(/at\s+(\S+)\s+\(.*?\/([^/]+):(\d+):\d+\)/);
        if (m) return " @ " + m[1] + "(" + m[2] + ":" + m[3] + ")";
        m = L.match(/at\s+.*?\/([^/]+):(\d+):\d+/);
        if (m) return " @ (" + m[1] + ":" + m[2] + ")";
    }
    return "";
}
/* NetHack 5.0	rnd.c	$NHDT-Date: 1596498205 2020/08/03 23:43:25 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.30 $ */
/*      Copyright (c) 2004 by Robert Patrick Rankin               */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { panic } from '../c2js-runtime/panic.js';
import { isaac64_init } from '../c2js-runtime/rng.js';
import { __nh_char_write } from '../c2js-runtime/string.js';
import { isaac64_next_uint64 } from '../isaac64.js';

// struct rnglist_t: { fn, init, rng_state }
export const CORE = 0;
export const DISP = 1;
game.rnglist = [{ fn: rn2, init: (0), rng_state: { n: 0, r: null, m: null, a: 0, b: 0, c: 0 } }, { fn: rn2_on_display_rng, init: (0), rng_state: { n: 0, r: null, m: null, a: 0, b: 0, c: 0 } }];
/* CORE */
/* DISP */
export function whichrng(fn) {
    let i = 0;
    for (i = 0; i < (Math.trunc(2 /* sizeof(struct rnglist_t [2]) */ / 1 /* sizeof(struct rnglist_t) */)); ++i) {
        if (game.rnglist[i].fn == fn) {
            return i;
        }
    }
    return -1;
}
export async function init_isaac64(seed, fn) {
    let new_rng_state = '';
    let i = 0;
    let rngindx = whichrng(fn);
    if (rngindx < 0) {
        await panic("Bad rng function passed to init_isaac64().");
    }
    for (i = 0; i < 8 /* sizeof(unsigned long) */; i++) {
        new_rng_state = __nh_char_write(new_rng_state, i, (seed & 255));
        seed >>= 8;
    }
    isaac64_init(game.rnglist[rngindx].rng_state, new_rng_state, 8 /* sizeof(unsigned long) */);
}
export function RND(x) {
    return (Number((isaac64_next_uint64(game.rnglist[CORE].rng_state)) % BigInt(x)));
}
/* 0 <= rn2(x) < x, but on a different sequence from the "main" rn2;
   used in cases where the answer doesn't affect gameplay and we don't
   want to give users easy control over the main RNG sequence. */
function _orig_rn2_on_display_rng(x) {
    return (Number((isaac64_next_uint64(game.rnglist[DISP].rng_state)) % BigInt(x)));
}
export function rn2_on_display_rng(x) {
    const _r = _orig_rn2_on_display_rng(x);
    if (game._rngLogEnabled) game._rngLog.push("rn2_on_display_rng(" + [x].join(",") + ")=" + _r + _nh_trace_caller());
    const _wd = game._movemon_watchdog;
    if (_wd) {
        if (++_wd.count > _wd.limit) throw new Error("movemon rn2-count watchdog tripped");
    }
    return _r;
}

/* USE_ISAAC64 */
/* "Rand()"s definition is determined by [OS]conf.h */
/* Good luck: the bottom order bits are cyclic. */
/* USE_ISAAC64 */
/* 0 <= rn2(x) < x */
function _orig_rn2(x) {
    return RND(x);
}
export function rn2(x) {
    const _r = _orig_rn2(x);
    if (game._rngLogEnabled) game._rngLog.push("rn2(" + [x].join(",") + ")=" + _r + _nh_trace_caller());
    const _wd = game._movemon_watchdog;
    if (_wd) {
        if (++_wd.count > _wd.limit) throw new Error("movemon rn2-count watchdog tripped");
    }
    return _r;
}

/* 0 <= rnl(x) < x; sometimes subtracting Luck;
   good luck approaches 0, bad luck approaches (x-1) */
function _orig_rnl(x) {
    let i = 0;
    let adjustment = 0;
    adjustment = (game.u.uluck + game.u.moreluck);
    if (x <= 15) {
        /* for small ranges, use Luck/3 (rounded away from 0);
           also guard against architecture-specific differences
           of integer division involving negative values */
        /*
         *       11..13 ->  4
         *        8..10 ->  3
         *        5.. 7 ->  2
         *        2.. 4 ->  1
         *       -1,0,1 ->  0 (no adjustment)
         *       -4..-2 -> -1
         *       -7..-5 -> -2
         *      -10..-8 -> -3
         *      -13..-11-> -4
         */
        adjustment = Math.trunc((abs(adjustment) + 1) / 3) * sgn(adjustment);
    }
    i = RND(x);
    if (adjustment && rn2(37 + abs(adjustment))) {
        i -= adjustment;
        if (i < 0) {
            i = 0;
        } else if (i >= x) {
            i = x - 1;
        }
    }
    return i;
}
export function rnl(x) {
    const _r = _orig_rnl(x);
    if (game._rngLogEnabled) game._rngLog.push("rnl(" + [x].join(",") + ")=" + _r + _nh_trace_caller());
    const _wd = game._movemon_watchdog;
    if (_wd) {
        if (++_wd.count > _wd.limit) throw new Error("movemon rn2-count watchdog tripped");
    }
    return _r;
}

/* 1 <= rnd(x) <= x */
function _orig_rnd(x) {
    x = RND(x) + 1;
    return x;
}
export function rnd(x) {
    const _r = _orig_rnd(x);
    if (game._rngLogEnabled) game._rngLog.push("rnd(" + [x].join(",") + ")=" + _r + _nh_trace_caller());
    const _wd = game._movemon_watchdog;
    if (_wd) {
        if (++_wd.count > _wd.limit) throw new Error("movemon rn2-count watchdog tripped");
    }
    return _r;
}

export function rnd_on_display_rng(x) {
    return rn2_on_display_rng(x) + 1;
}
/* d(N,X) == NdX == dX+dX+...+dX N times; n <= d(n,x) <= (n*x) */
function _orig_d(n, x) {
    let tmp = n;
    while (n--) {
        tmp += RND(x);
    }
    /* was:
     *  tmp = 1;
     *  while (!rn2(x))
     *    tmp++;
     *  return min(tmp, (u.ulevel < 15) ? 5 : u.ulevel / 3);
     * which is clearer but less efficient and stands a vanishingly
     * small chance of overflowing tmp
     */
    return tmp;
}
export function d(n, x) {
    const _r = _orig_d(n, x);
    if (game._rngLogEnabled) game._rngLog.push("d(" + [n, x].join(",") + ")=" + _r + _nh_trace_caller());
    const _wd = game._movemon_watchdog;
    if (_wd) {
        if (++_wd.count > _wd.limit) throw new Error("movemon rn2-count watchdog tripped");
    }
    return _r;
}

/* 1 <= rne(x) <= max(u.ulevel/3,5) */
function _orig_rne(x) {
    let tmp = 0;
    let utmp = 0;
    utmp = (game.u.ulevel < 15) ? 5 : Math.trunc(game.u.ulevel / 3);
    tmp = 1;
    while (tmp < utmp && !rn2(x)) {
        tmp++;
    }
    return tmp;
}
export function rne(x) {
    const _r = _orig_rne(x);
    if (game._rngLogEnabled) game._rngLog.push("rne(" + [x].join(",") + ")=" + _r + _nh_trace_caller());
    const _wd = game._movemon_watchdog;
    if (_wd) {
        if (++_wd.count > _wd.limit) throw new Error("movemon rn2-count watchdog tripped");
    }
    return _r;
}

/* rnz: everyone's favorite! */
function _orig_rnz(i) {
    let x = i;
    let tmp = 1000;
    tmp += rn2(1000);
    tmp *= rne(4);
    if (rn2(2)) {
        x *= tmp;
        x = Math.trunc(x / 1000);
    } else {
        x *= 1000;
        x = Math.trunc(x / tmp);
    }
    return x;
}
export function rnz(i) {
    const _r = _orig_rnz(i);
    if (game._rngLogEnabled) game._rngLog.push("rnz(" + [i].join(",") + ")=" + _r + _nh_trace_caller());
    const _wd = game._movemon_watchdog;
    if (_wd) {
        if (++_wd.count > _wd.limit) throw new Error("movemon rn2-count watchdog tripped");
    }
    return _r;
}

/* Sets the seed for the random number generator */
export async function set_random(seed, fn) {
    await init_isaac64(seed, fn);
}
/* USE_ISAAC64 */
/*ARGSUSED*/
/*
     * The types are different enough here that sweeping the different
     * routine names into one via #defines is even more confusing.
     */
/* srandom() from sys/share/random.c */
/* system srandom() */
/* system srand48() */
/* poor quality system routine */
/* USE_ISAAC64 */
/* An appropriate version of this must always be provided in
   port-specific code somewhere. It returns a number suitable
   as seed for the random number generator */
/*
 * Initializes the random number generator.
 * Only call once.
 */
export async function init_random(fn) {
    await set_random(sys_random_seed(), fn);
}
/* Reshuffles the random number generator. */
export async function reseed_random(fn) {
    if (game.has_strong_rngseed) {
        await init_random(fn);
    }
}
/* randomize the given list of numbers  0 <= i < count */
export function shuffle_int_array(indices, count) {
    let i = 0;
    let iswap = 0;
    let temp = 0;
    for (i = count - 1; i > 0; i--) {
        if ((iswap = rn2(i + 1)) == i) {
            continue;
        }
        temp = indices[i];
        indices[i] = indices[iswap];
        indices[iswap] = temp;
    }
}
/*rnd.c*/
/* only reseed if we are certain that the seed generation is unguessable
    * by the players. */
