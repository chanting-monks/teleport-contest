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
