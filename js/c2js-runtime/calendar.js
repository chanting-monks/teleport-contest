// calendar.js — runtime shims for C's <time.h> functions called from
// translated NetHack code.
//
// `time(time_t *t)`: in C, returns current time and optionally stores
// it via *t.  Translated u_init_misc calls `time(game.ubirthday);`
// where `game.ubirthday` is a `time_t` (treated as an out-pointer).
// For PRNG-faithful play the actual value is irrelevant to RNG —
// time() doesn't fire any rn2 calls — so a no-op that returns 0 is
// sufficient.  Translated NetHack code doesn't dereference *t for
// arithmetic that affects PRNG state.
export function time(_t) {
    return 0;
}

// `difftime(t1, t0)`: difference in seconds.  Returns 0 here; real
// difftime is only read by ranking/leaderboard code that doesn't
// affect PRNG-faithful play.
export function difftime(_t1, _t0) {
    return 0;
}

// `localtime(t)`: convert time_t to broken-down `struct tm`.
// jsmain.js sets globalThis.__nh_localtime per-session to a fixed-
// date returning function built from the session.json `datetime`
// field (so phase_of_the_moon / friday_13th compute against the
// recording's calendar).  We return its value if set; otherwise
// return a deterministic epoch-zero struct so translated code
// doesn't crash with NaN arithmetic.  C ref <time.h>: tm_year is
// years-since-1900, tm_mon is 0..11, tm_wday is 0..6 (Sun=0),
// tm_yday is 0..365.
const _epochTm = {
    tm_sec: 0, tm_min: 0, tm_hour: 0,
    tm_mday: 1, tm_mon: 0, tm_year: 70, // 1970-01-01
    tm_wday: 4, tm_yday: 0,             // Jan 1 1970 = Thursday
    tm_isdst: 0, tm_gmtoff: 0, tm_zone: null,
};
export function localtime(_t) {
    if (typeof globalThis.__nh_localtime === 'function') {
        return globalThis.__nh_localtime(_t);
    }
    return _epochTm;
}
