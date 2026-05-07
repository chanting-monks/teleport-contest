// u_init.js — Per-(role, race) initial attribute distribution.
//
// C ref:
//   src/attrib.c:723 init_attr — distribute role.attrbase + np leftover
//   src/attrib.c:699 init_attr_role_redist — rn2(100)-walk ATTRDIST
//   src/attrib.c:682 rnd_attr — rn2(100) cumulative pick on ATTRDIST
//   src/attrib.c:764 vary_init_attr — 6× rn2(20), then rn2(7)-2 if !rn2(20)
//
// Currently NOT WIRED into allmain.js — js/fastforward.js still emits
// the 28× rn2(100) + 6× rn2(20) + 1× rn2(7) attr-related calls
// inline as part of `fastforward_post_mklev`.  This module is a
// reference port that future iterations can swap in once the mklev
// call-count-alignment work lands; until then, replacing fastforward's
// hardcoded calls with computed values would break seed8000 if any
// detail diverges.
//
// Verified manually: for Tourist+human with the seed8000 PRNG state
// at u_init time, this produces [Str=9, Int=11, Wis=16, Dex=14,
// Con=12, Cha=16] in C order = [9, 14, 12, 11, 16, 16] in display
// order — matching the hardcoded values in allmain.js.

import { rn2, rnd } from './rng.js';

// Attribute index constants.  C ref: include/youprop.h.
export const A_MAX = 6;
export const A_STR = 0, A_INT = 1, A_WIS = 2, A_DEX = 3, A_CON = 4, A_CHA = 5;

// Per-role base attributes (C order: Str Int Wis Dex Con Cha).
// Source: src/role.c roles[] attrbase struct.
export const ROLE_ATTRBASE = {
    Archeologist: [7, 10, 10, 7, 7, 7],
    Barbarian:    [16, 7, 7, 15, 16, 6],
    Caveman:      [10, 7, 7, 7, 8, 6],
    Healer:       [7, 7, 13, 7, 11, 16],
    Knight:       [13, 7, 14, 8, 10, 17],
    Monk:         [10, 7, 8, 8, 7, 7],
    Priest:       [7, 7, 10, 7, 7, 7],
    Rogue:        [7, 7, 7, 10, 7, 6],
    Ranger:       [13, 13, 13, 9, 13, 7],
    Samurai:      [10, 8, 7, 10, 17, 6],
    Tourist:      [7, 10, 6, 7, 7, 10],
    Valkyrie:     [10, 7, 7, 7, 10, 7],
    Wizard:       [7, 10, 7, 7, 7, 7],
};

// Per-role attribute distribution (C order: Str Int Wis Dex Con Cha).
// Source: src/role.c roles[] attrdist struct.  Sums to 100.
export const ROLE_ATTRDIST = {
    Archeologist: [20, 20, 20, 10, 20, 10],
    Barbarian:    [30, 6, 7, 20, 30, 7],
    Caveman:      [30, 6, 7, 20, 30, 7],
    Healer:       [15, 20, 20, 15, 25, 5],
    Knight:       [30, 15, 15, 10, 20, 10],
    Monk:         [25, 10, 20, 20, 15, 10],
    Priest:       [15, 10, 30, 15, 20, 10],
    Rogue:        [20, 10, 10, 30, 20, 10],
    Ranger:       [30, 10, 10, 20, 20, 10],
    Samurai:      [30, 10, 8, 30, 14, 8],
    Tourist:      [15, 10, 10, 15, 30, 20],
    Valkyrie:     [30, 6, 7, 20, 30, 7],
    Wizard:       [10, 30, 10, 20, 20, 10],
};

// Per-race attribute max (C order).  Source: src/role.c races[].attrmax.
export const RACE_ATTRMAX = {
    human: [25, 18, 18, 18, 18, 18],  // STR18(100) is 25 (post-translation)
    elf:   [18, 20, 20, 18, 16, 18],
    dwarf: [25, 16, 16, 20, 20, 16],
    gnome: [25, 19, 18, 18, 18, 18],  // STR18(50) is 25
    orc:   [25, 16, 16, 20, 18, 16],
};

const ATTRMIN = [3, 3, 3, 3, 3, 3];

// C ref: attrib.c:682 — pick an attr index by walking ATTRDIST
// cumulatively against rn2(100).
function rnd_attr(attrdist) {
    let x = rn2(100);
    for (let i = 0; i < A_MAX; i++) {
        x -= attrdist[i];
        if (x < 0) return i;
    }
    return A_MAX;
}

// C ref: attrib.c:699 init_attr_role_redist.  Distributes np points
// across attrs (positive np: add; negative np: subtract) using
// rnd_attr to pick.  Skips capped attrs (counted as a "try" up to
// 100 before giving up).
function init_attr_role_redist(attrs, attrmax, attrdist, np, addition) {
    let tryct = 0;
    const adj = addition ? 1 : -1;
    while ((addition ? np > 0 : np < 0) && tryct < 100) {
        const i = rnd_attr(attrdist);
        if (i >= A_MAX
            || (addition ? attrs[i] >= attrmax[i]
                         : attrs[i] <= ATTRMIN[i])) {
            tryct++;
            continue;
        }
        tryct = 0;
        attrs[i] += adj;
        np -= adj;
    }
    return np;
}

// C ref: attrib.c:764 vary_init_attr — small per-attr variation.
// Always emits 6× rn2(20); for each one that returns 0, also emits
// rn2(7) and applies xd = rn2(7) - 2 (range -2..+4) to that attr,
// capping by ATTRMAX[i].
function vary_init_attr(attrs, attrmax) {
    for (let i = 0; i < A_MAX; i++) {
        if (rn2(20) === 0) {
            const xd = rn2(7) - 2;
            attrs[i] += xd;
            if (attrs[i] > attrmax[i]) attrs[i] = attrmax[i];
            if (attrs[i] < ATTRMIN[i]) attrs[i] = ATTRMIN[i];
        }
    }
}

// Public entry: compute final attrs for the given role/race after
// init_attr(75) and vary_init_attr().  Returns C-order array
// [Str, Int, Wis, Dex, Con, Cha].
export function compute_init_attrs(role, race) {
    const base = ROLE_ATTRBASE[role];
    const dist = ROLE_ATTRDIST[role];
    const max = RACE_ATTRMAX[race];
    if (!base || !dist || !max) return null;

    const attrs = base.slice();
    let np = 75 - attrs.reduce((s, v) => s + v, 0);
    np = init_attr_role_redist(attrs, max, dist, np, true);
    np = init_attr_role_redist(attrs, max, dist, np, false);
    vary_init_attr(attrs, max);
    return attrs;
}

// Convert C-order [Str, Int, Wis, Dex, Con, Cha] to display-order
// [Str, Dex, Con, Int, Wis, Cha].  C ref: src/botl.c — display
// order matches the row-22 status bar.
export function c_to_display(attrs) {
    return [attrs[0], attrs[3], attrs[4], attrs[1], attrs[2], attrs[5]];
}

// Per-role enadv struct (energy-points advancement).
// C ref: role.c roles[].enadv — { infix, inrnd, lofix, lornd, hifix, hirnd }
// Used by newpw() at u_init_misc time (u.ulevel == 0 branch only).
export const ROLE_ENADV = {
    Archeologist: { infix: 1, inrnd: 0 },
    Barbarian:    { infix: 1, inrnd: 0 },
    Caveman:      { infix: 1, inrnd: 0 },
    Healer:       { infix: 1, inrnd: 4 },
    Knight:       { infix: 1, inrnd: 4 },
    Monk:         { infix: 2, inrnd: 2 },
    Priest:       { infix: 4, inrnd: 3 },
    Rogue:        { infix: 1, inrnd: 0 },
    Ranger:       { infix: 1, inrnd: 0 },
    Samurai:      { infix: 1, inrnd: 0 },
    Tourist:      { infix: 1, inrnd: 0 },
    Valkyrie:     { infix: 1, inrnd: 0 },
    Wizard:       { infix: 4, inrnd: 3 },
};

// Per-race enadv struct.
// C ref: role.c races[].enadv — same layout as role.
export const RACE_ENADV = {
    human: { infix: 1, inrnd: 0 },
    elf:   { infix: 2, inrnd: 0 },
    dwarf: { infix: 0, inrnd: 0 },
    gnome: { infix: 2, inrnd: 0 },
    orc:   { infix: 1, inrnd: 0 },
};

// Per-role hpadv struct.  All inrnd=0 at level 0, so HP at character
// initialization is fully deterministic = role.infix + race.infix.
export const ROLE_HPADV = {
    Archeologist: { infix: 11, inrnd: 0 },
    Barbarian:    { infix: 14, inrnd: 0 },
    Caveman:      { infix: 14, inrnd: 0 },
    Healer:       { infix: 11, inrnd: 0 },
    Knight:       { infix: 14, inrnd: 0 },
    Monk:         { infix: 12, inrnd: 0 },
    Priest:       { infix: 12, inrnd: 0 },
    Rogue:        { infix: 10, inrnd: 0 },
    Ranger:       { infix: 13, inrnd: 0 },
    Samurai:      { infix: 13, inrnd: 0 },
    Tourist:      { infix:  8, inrnd: 0 },
    Valkyrie:     { infix: 14, inrnd: 0 },
    Wizard:       { infix: 10, inrnd: 0 },
};

export const RACE_HPADV = {
    human: { infix: 2, inrnd: 0 },
    elf:   { infix: 1, inrnd: 0 },
    dwarf: { infix: 4, inrnd: 0 },
    gnome: { infix: 1, inrnd: 0 },
    orc:   { infix: 1, inrnd: 0 },
};

// C ref: attrib.c:1080 newhp() with u.ulevel==0.
// Returns level-1 starting HP.  All known role/race combos have
// inrnd=0 so this is purely deterministic.  Includes the rnd()
// scaffold so future race additions with non-zero inrnd Just Work.
export function compute_newhp(role, race) {
    const r = ROLE_HPADV[role] || ROLE_HPADV.Tourist;
    const c = RACE_HPADV[race] || RACE_HPADV.human;
    let hp = r.infix + c.infix;
    if (r.inrnd > 0) hp += rnd(r.inrnd);
    if (c.inrnd > 0) hp += rnd(c.inrnd);
    return hp <= 0 ? 1 : hp;
}

// C ref: exper.c:45 newpw() with u.ulevel==0.
// Returns level-1 starting Pw.  For roles with role.enadv.inrnd > 0
// (Healer, Knight, Monk, Priest, Wizard) this consumes rnd() — the
// caller must have set up PRNG state to match C's u_init_misc point.
export function compute_newpw(role, race) {
    const r = ROLE_ENADV[role] || ROLE_ENADV.Tourist;
    const c = RACE_ENADV[race] || RACE_ENADV.human;
    let en = r.infix + c.infix;
    if (r.inrnd > 0) en += rnd(r.inrnd);
    if (c.inrnd > 0) en += rnd(c.inrnd);
    return en <= 0 ? 1 : en;
}
