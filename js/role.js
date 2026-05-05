// role.js — Per-role startup randomization.
// C ref: role.c — role_init(). Most of role_init is bookkeeping
// (validating choices, copying tables); only a few sites emit PRNG
// calls, and those are role-dependent:
//
//   ldrgend (line 2039):   rn2(100) iff quest LEADER monster has
//                          random gender (mflags2 lacks MALE/FEMALE/NEUTER)
//   nemgend (line 2060):   rn2(100) iff quest NEMESIS monster has
//                          random gender
//   pantheon (line 2069):  rn2(13) loop iff role's lgod is NULL
//
// This file ports the gender-randomization sites only. The pantheon
// loop and the validation rolls (randrole_filtered, randrace, randgend,
// randalign) are not ported yet — sessions whose nethackrc fully
// specifies role/race/gender/align won't trigger them.
//
// Per-role gender flags are derived empirically from the recordings
// (see scripts/compare-firstdiv.mjs --prng-only --all output for
// `firstDiv@199`). Future work: port mons[] and read mflags2 directly.

import { game } from './gstate.js';
import { rn2 } from './rng.js';

// Role names whose quest NEMESIS has random gender (rn2(100) at line
// 2060). Discovered from C-side recordings: at index 199 of every
// session of these roles, C emits rn2(100) annotated `role.c:2060`.
//
// Verified roles: Wizard (nemesis = PM_DARK_ONE), Archeologist
// (nemesis = PM_MASTER_MIND_FLAYER).
//
// Roles confirmed to NOT trigger this rn2: Tourist, Knight, Samurai,
// Rogue, Healer, Priest, Caveman, Valkyrie, Barbarian, Monk, Ranger.
const ROLES_WITH_RANDOM_NEMGEND = new Set(['Wizard', 'Archeologist']);

// Roles whose quest LEADER has random gender (rn2(100) at line 2039).
// None of the public sessions show this firing yet; placeholder set.
const ROLES_WITH_RANDOM_LDRGEND = new Set();

// Role index of Priest in the roles[] table (matches js/roles.js order).
// Priest is the only role in NetHack 5.0 with a null `lgod` field
// (role.c line 285: "deities from a randomly chosen other role will
// be used"), so it's the only index that triggers the pantheon
// retry loop.
const PRIEST_ROLE_INDEX = 6;
const SIZE_ROLES_MINUS_ONE = 13;  // SIZE(roles) - 1 in C

export function role_init() {
    const role = game.opts_role || '';

    // ldrgend rn2(100) — fires iff role's quest leader has random gender.
    if (ROLES_WITH_RANDOM_LDRGEND.has(role)) {
        rn2(100);
    }

    // nemgend rn2(100) — fires iff role's quest nemesis has random gender.
    if (ROLES_WITH_RANDOM_NEMGEND.has(role)) {
        rn2(100);
    }

    // Pantheon loop (role.c:2068):
    //     flags.pantheon = flags.initrole;
    //     while (!roles[flags.pantheon].lgod && ++trycnt < 100)
    //         flags.pantheon = randrole(FALSE);
    //
    // For Priest, initial pantheon == Priest, lgod == null, so the
    // loop enters at least once. Each iteration emits rn2(13). The
    // loop exits as soon as the random pick is NOT Priest (only
    // Priest has null lgod in 5.0).
    //
    // For seed0367-priest the loop ran once (rn2(13)=11 → Valkyrie).
    // For seed0501-priest it ran twice (rn2(13)=6 → Priest again,
    // rn2(13)=10 → Tourist).
    if (role === 'Priest') {
        let pantheon = PRIEST_ROLE_INDEX;
        let trycnt = 0;
        while (pantheon === PRIEST_ROLE_INDEX && ++trycnt < 100) {
            pantheon = rn2(SIZE_ROLES_MINUS_ONE);
        }
    }
}

// Per-role newpw inrnd (role.enadv.inrnd at u_init_misc start). Used
// by u_init_misc to compute starting energy. Empirically derived from
// the C recordings (only one rnd call between init_castle_tune and
// the rn2(10) for u.uhandedness — and that rnd's argument matches the
// role's enadv.inrnd value). newhp.inrnd is 0 for all human-role
// sessions in the public set.
const ROLE_ENADV_INRND = {
    Healer: 4,
    Knight: 4,
    Priest: 3,
    Wizard: 3,
    Monk: 2,
    // Tourist, Rogue, Valkyrie, Samurai, Ranger, Archeologist,
    // Barbarian, Caveman: 0 (no rnd call).
};

// Returns 0 for "no call" — the caller should skip the rnd() entirely
// rather than invoking rnd(0).
export function role_enadv_inrnd() {
    return ROLE_ENADV_INRND[game.opts_role || ''] || 0;
}

// Per-race allowed alignment list, derived from races[].allow at
// nethack-c/upstream/src/role.c:581-682 (ROLE_LAWFUL/NEUTRAL/CHAOTIC bits).
const RACE_ALIGNS = {
    human: ['lawful', 'neutral', 'chaotic'],
    elf:   ['chaotic'],
    dwarf: ['lawful'],
    gnome: ['neutral'],
    orc:   ['chaotic'],
};

// Per-race allowed gender list (all races allow male+female in 5.0).
const RACE_GENDS = {
    human: ['male', 'female'],
    elf:   ['male', 'female'],
    dwarf: ['male', 'female'],
    gnome: ['male', 'female'],
    orc:   ['male', 'female'],
};

// Role menu accelerator letter → role index. C ref: setup_rolemenu
// (role.c:2856) — first letter of name, lowercased; collisions get
// uppercased on the second occurrence (Rogue='r', Ranger='R').
const ROLE_BY_LETTER = {
    a: 0, b: 1, c: 2, h: 3, k: 4, m: 5, p: 6,
    r: 7, R: 8, s: 9, t: 10, v: 11, w: 12,
};
const RACE_BY_LETTER = { h: 'human', e: 'elf', d: 'dwarf', g: 'gnome', o: 'orc' };
const GEND_BY_LETTER = { m: 'male', f: 'female' };
const ALGN_BY_LETTER = { l: 'lawful', n: 'neutral', c: 'chaotic' };

// Compute valid race indices for a role under current constraints.
function validRaces(roleIdx, gend, algn) {
    const rd = ROLE_DATA[roleIdx];
    return rd.races.filter(race => {
        if (gend !== null && !RACE_GENDS[race].includes(gend)) return false;
        if (algn !== null && !RACE_ALIGNS[race].includes(algn)) return false;
        return true;
    });
}
function validGends(roleIdx, race, algn) {
    const rd = ROLE_DATA[roleIdx];
    return rd.gens.filter(g => {
        if (race && !RACE_GENDS[race].includes(g)) return false;
        return true;
    });
}
function validAligns(roleIdx, race, gend) {
    const rd = ROLE_DATA[roleIdx];
    return rd.aligns.filter(a => {
        if (race && !RACE_ALIGNS[race].includes(a)) return false;
        return true;
    });
}

// rigid_role_checks (role.c:1235): if role is set, fire pick_race/
// pick_align/pick_gend in PICK_RIGID mode for any unset attribute.
// PICK_RIGID returns the single valid option (and emits rn2(1)) if
// exactly one is valid; otherwise returns ROLE_NONE without rn2.
//
// Order in C: race, align, gend (line 1273-1280). Each subsequent
// pick uses any value just set by the prior one.
//
// Mutates state in place; returns nothing.
function rigid_role_checks(s) {
    if (s.roleIdx === null) return;
    if (s.race === null) {
        const valid = validRaces(s.roleIdx, s.gend, s.algn);
        if (valid.length === 1) {
            rn2(1);
            s.race = valid[0];
        }
    }
    if (s.algn === null) {
        const valid = validAligns(s.roleIdx, s.race, s.gend);
        if (valid.length === 1) {
            rn2(1);
            s.algn = valid[0];
        }
    }
    if (s.gend === null) {
        const valid = validGends(s.roleIdx, s.race, s.algn);
        if (valid.length === 1) {
            rn2(1);
            s.gend = valid[0];
        }
    }
}

// Walks the moves[] keystroke prefix, simulating the chargen UI's RNG
// emission. Returns { role, race, gender, align } when chargen is
// detected, or null otherwise.
//
// C ref: role.c plsel() main loop (line 2249+). Three response modes
// at the "Shall I pick a character for you? [ynaq]" prompt:
//   y/a/space/\r/\n/@/*  → pick_role+race+gend+align (4 rn2 calls)
//   n                    → enter manual menu loop; PICK_RIGID auto-
//                          picks (rn2(1)) any 1-valid attribute when
//                          a menu is shown for the next attribute.
// We model the "n then manual menus" path by replaying menu accelerator
// keys against ROLE_DATA / RACE_* tables.
export function chargen_simulate(moves) {
    if (!moves) return null;
    let idx = 0;
    while (idx < moves.length && moves[idx] !== '\r' && moves[idx] !== '\n') idx++;
    if (idx >= moves.length - 1) return null;
    idx++;
    if (idx >= moves.length) return null;
    const yn = moves[idx]; idx++;

    if (yn === 'y' || yn === 'Y' || yn === 'a' || yn === 'A'
        || yn === ' ' || yn === '\r' || yn === '\n'
        || yn === '@' || yn === '*') {
        return chargen_full_random();
    }

    if (yn !== 'n' && yn !== 'N') return null;

    const s = { roleIdx: null, race: null, gend: null, algn: null };

    // Stage RS_ROLE — read role letter
    while (idx < moves.length && !(moves[idx] in ROLE_BY_LETTER)) idx++;
    if (idx >= moves.length) return null;
    s.roleIdx = ROLE_BY_LETTER[moves[idx]]; idx++;

    // Stage RS_RACE
    if (s.race === null) {
        const races = validRaces(s.roleIdx, s.gend, s.algn);
        if (races.length > 1) {
            rigid_role_checks(s);
            // Read race menu key
            while (idx < moves.length && !(moves[idx] in RACE_BY_LETTER)) idx++;
            if (idx >= moves.length) return null;
            const raceName = RACE_BY_LETTER[moves[idx]]; idx++;
            if (races.includes(raceName)) s.race = raceName;
            else s.race = races[0];
        } else if (races.length === 1) {
            s.race = races[0];
        }
    }

    // Stage RS_GENDER
    if (s.gend === null) {
        const gends = validGends(s.roleIdx, s.race, s.algn);
        if (gends.length > 1) {
            rigid_role_checks(s);
            while (idx < moves.length && !(moves[idx] in GEND_BY_LETTER)) idx++;
            if (idx >= moves.length) return null;
            const gendName = GEND_BY_LETTER[moves[idx]]; idx++;
            if (gends.includes(gendName)) s.gend = gendName;
            else s.gend = gends[0];
        } else if (gends.length === 1) {
            s.gend = gends[0];
        }
    }

    // Stage RS_ALGNMNT
    if (s.algn === null) {
        const aligns = validAligns(s.roleIdx, s.race, s.gend);
        if (aligns.length > 1) {
            rigid_role_checks(s);
            while (idx < moves.length && !(moves[idx] in ALGN_BY_LETTER)) idx++;
            if (idx >= moves.length) return null;
            const algnName = ALGN_BY_LETTER[moves[idx]]; idx++;
            if (aligns.includes(algnName)) s.algn = algnName;
            else s.algn = aligns[0];
        } else if (aligns.length === 1) {
            s.algn = aligns[0];
        }
    }

    return {
        role: ROLE_DATA[s.roleIdx].name,
        race: s.race, gender: s.gend, align: s.algn,
    };
}

// Emits the four pick_role/pick_race/pick_gend/pick_align rn2 calls
// fired by chargen when the user accepts full-random selection
// (responding y/a/space/return at the "Shall I pick a character for
// you?" prompt; see role.c:2249-2301). All four pickers walk a "valid
// option count" derived from intersected role/race/gend/align bitmasks
// and call rn2(count).
//
// For initial unconstrained chargen:
//   - pick_role:  rn2(13)            — 13 = SIZE(roles) - 1
//   - pick_race:  rn2(N_role)        — races compatible with role
//   - pick_gend:  rn2(N_role_race)   — genders compatible with role+race
//                                      (always 2 except Valkyrie's 1)
//   - pick_align: rn2(N_role_race_g) — aligns compatible with role+race;
//                                      gender doesn't constrain align
//
// Returns the picked role name, race, gender, align so the caller can
// store them on game state for subsequent role-conditional logic
// (welcome message, role_init's nemgend, ROLE_DATA lookups).
export function chargen_full_random() {
    const SIZE_ROLES = 13;
    const roleIdx = rn2(SIZE_ROLES);
    const rd = ROLE_DATA[roleIdx];
    const raceIdx = rn2(rd.races.length);
    const raceName = rd.races[raceIdx];
    const gendIdx = rn2(rd.gens.length);
    const gendName = rd.gens[gendIdx];
    const allowedAligns = rd.aligns.filter(a => RACE_ALIGNS[raceName].includes(a));
    const alignIdx = rn2(allowedAligns.length);
    const alignName = allowedAligns[alignIdx];
    return { role: rd.name, race: raceName, gender: gendName, align: alignName };
}

// Per-role allowed (races, genders, aligns) bitmask data extracted from
// nethack-c/upstream/src/role.c roles[].flags. Order matches js/roles.js.
//
// Required by the future chargen port (LEARNINGS item #12) to compute
// pick_race/pick_gend/pick_align rn2 args. NOT YET WIRED INTO chargen
// because the chargen UI distinguishes "user pressed letter for menu X"
// from "user pressed * for random" via keystroke inspection of moves;
// without that distinction, emitting all picks for sessions with empty
// rc components mismatches sessions where the user pressed letters
// (e.g., seed0077: only align was random; pick_role/race/gend were
// menu-picked by letter and emit 0 rn2 calls in C).
//
// Future iteration that takes the chargen chunk will (a) parse the
// chargen-relevant prefix of moves[] to identify menu choices, then
// (b) emit pick_* only when a menu was random.
export const ROLE_DATA = [
    { name: 'Archeologist', races: ['human','dwarf','gnome'],         gens: ['male','female'], aligns: ['lawful','neutral'] },
    { name: 'Barbarian',    races: ['human','orc'],                   gens: ['male','female'], aligns: ['neutral','chaotic'] },
    { name: 'Caveman',      races: ['human','dwarf','gnome'],         gens: ['male','female'], aligns: ['lawful','neutral'] },
    { name: 'Healer',       races: ['human','gnome'],                 gens: ['male','female'], aligns: ['neutral'] },
    { name: 'Knight',       races: ['human'],                         gens: ['male','female'], aligns: ['lawful'] },
    { name: 'Monk',         races: ['human'],                         gens: ['male','female'], aligns: ['lawful','neutral','chaotic'] },
    { name: 'Priest',       races: ['human','elf'],                   gens: ['male','female'], aligns: ['lawful','neutral','chaotic'] },
    { name: 'Rogue',        races: ['human','orc'],                   gens: ['male','female'], aligns: ['chaotic'] },
    { name: 'Ranger',       races: ['human','elf','gnome','orc'],     gens: ['male','female'], aligns: ['neutral','chaotic'] },
    { name: 'Samurai',      races: ['human'],                         gens: ['male','female'], aligns: ['lawful'] },
    { name: 'Tourist',      races: ['human'],                         gens: ['male','female'], aligns: ['neutral'] },
    { name: 'Valkyrie',     races: ['human','dwarf'],                 gens: ['female'],        aligns: ['lawful','neutral'] },
    { name: 'Wizard',       races: ['human','elf','gnome','orc'],     gens: ['male','female'], aligns: ['neutral','chaotic'] },
];
