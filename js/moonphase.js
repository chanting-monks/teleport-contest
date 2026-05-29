// moonphase.js — Date-derived moveloop_preamble status flags.
// C ref: nethack-c/upstream/src/calendar.c:191 phase_of_the_moon(),
// :206 friday_13th().
//
// Used by allmain.js to decide whether to pline:
//   "You are lucky!  Full moon tonight."          (FULL_MOON)
//   "Be careful!  New moon tonight."              (NEW_MOON)
//   "Watch out!  Bad things can happen on Friday the 13th."
// at the start of moveloop_preamble (allmain.c:48-68).
//
// Driven by the session's `datetime` field (set in jsmain.js from
// the recorded YYYYMMDDHHMMSS string).  No PRNG involvement.

import { FULL_MOON, NEW_MOON } from './const.js';

// Parse "YYYYMMDDHHMMSS" → { yyyy, mm (1..12), dd (1..31), hh, mi, ss }.
function parseDatetime(s) {
    if (!s || s.length < 8) return null;
    return {
        yyyy: parseInt(s.slice(0, 4), 10),
        mm:   parseInt(s.slice(4, 6), 10),
        dd:   parseInt(s.slice(6, 8), 10),
    };
}

// 0-indexed day of year.  Matches C's `struct tm.tm_yday`.
function dayOfYear({ yyyy, mm, dd }) {
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if ((yyyy % 4 === 0 && yyyy % 100 !== 0) || yyyy % 400 === 0) days[1] = 29;
    let total = 0;
    for (let i = 0; i < mm - 1; i++) total += days[i];
    return total + dd - 1;
}

// 0=Sunday, 1=Monday, ..., 5=Friday.  Matches C's `struct tm.tm_wday`.
// Zeller's congruence variant.
function dayOfWeek({ yyyy, mm, dd }) {
    let m = mm, y = yyyy;
    if (m < 3) { m += 12; y -= 1; }
    const k = y % 100;
    const j = Math.floor(y / 100);
    const h = (dd + Math.floor(13 * (m + 1) / 5) + k + Math.floor(k / 4)
               + Math.floor(j / 4) + 5 * j) % 7;
    // Zeller: 0=Saturday, 1=Sunday, ..., 6=Friday.  Map to tm_wday:
    // 0=Sunday: Zeller 1 → tm_wday 0.  6=Saturday: Zeller 0 → tm_wday 6.
    return (h + 6) % 7;
}

// C ref: calendar.c:191 — returns 0..7 with 0=new, 4=full.
export function phase_of_the_moon(dtString) {
    const dt = parseDatetime(dtString);
    if (!dt) return -1;
    const diy = dayOfYear(dt);
    const tmYear = dt.yyyy - 1900;
    const goldn = (tmYear % 19) + 1;
    let epact = (11 * goldn + 18) % 30;
    if ((epact === 25 && goldn > 11) || epact === 24) epact++;
    return ((((diy + epact) * 6 + 11) % 177) / 22 | 0) & 7;
}

// C ref: calendar.c:206 — true iff date is Friday the 13th.
export function friday_13th(dtString) {
    const dt = parseDatetime(dtString);
    if (!dt) return false;
    return dt.dd === 13 && dayOfWeek(dt) === 5;
}

// True when moveloop_preamble would emit at least one pline.
// Used by allmain.js to decide whether welcome's pline must force
// --More-- (because there's a queued message about to overflow).
export function preamble_will_pline(dtString) {
    const p = phase_of_the_moon(dtString);
    return p === FULL_MOON || p === NEW_MOON || friday_13th(dtString);
}

// Pline strings the preamble will emit, in the order C plines them.
// Empty array if none apply.  C ref: allmain.c:58-68.
export function preamble_plines(dtString) {
    const out = [];
    const p = phase_of_the_moon(dtString);
    if (p === FULL_MOON) out.push('You are lucky!  Full moon tonight.');
    else if (p === NEW_MOON) out.push('Be careful!  New moon tonight.');
    if (friday_13th(dtString)) {
        out.push('Watch out!  Bad things can happen on Friday the 13th.');
    }
    return out;
}
