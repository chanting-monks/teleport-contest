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
        // Stash the picked pantheon (a roles[] index) so legacy.js can
        // resolve %d (god) to the right role's god list at the player's
        // alignment.  C ref: role.c:2068 sets flags.pantheon, used by
        // align_gname/align_gtitle via gu.urole.lgod/ngod/cgod that get
        // copied from roles[flags.pantheon] elsewhere in role_init.
        game._priestPantheon = pantheon;
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
//
// Limitation: doesn't currently respect pre-set fields from nethackrc
// (e.g., rc with role:Wizard but no race/gender/align). C would skip
// pick_role and only fire the unset attributes' picks; this function
// always emits the full pick_role+race+gend+align sequence. No public
// session has partial rc (all 44 sessions either have all four set or
// none), so this is a deferred correctness gap, not an active bug.
// Renders the NetHack chargen banner + "Who are you?" prompt onto the
// terminal grid at the same row positions C tty_putstr writes to. C
// writes the banner on rows 4-7 (cols 0 and 9) and "Who are you? " on
// row 12. Replicating these positions is what makes JS's serialized
// terminal grid match C's screen capture cell-for-cell.
//
// C ref: tty_init_nhwindows + tty_player_selection. The version line
// is normalized to <<VERSION_BANNER>> by frozen/ps_test_runner.mjs's
// STARTUP_VARIANT_LINES regex, so the exact version string doesn't
// matter — only the row + leading-9-cols positioning.
// NO_COLOR = 8 in terminal.js / const.js — matches C's tty_putstr
// default of CLR_GRAY mapped to NO_COLOR in the recorder. terminal.js
// putstr defaults to CLR_GRAY=7 which renders as ANSI fg 37; C emits
// no SGR (color 8 = default). We pass 8 explicitly so the cell color
// matches C's screen capture cell-for-cell.
const CHARGEN_NO_COLOR = 8;

// Reset every cell to ' ' with NO_COLOR=8 (default fg). terminal.js's
// clearScreen() and clearRow() set cells to CLR_GRAY=7, which makes
// serialize() emit SGR fg=37 for cells in the [firstCol,lastCol] gap
// of any row that has content on both sides. C's blank cells decode to
// fg=8 (default), so JS's color=7 blanks fail cell-by-cell comparison.
function clearScreenNoColor(display) {
    for (let r = 0; r < 24; r++) {
        for (let c = 0; c < 80; c++) {
            display.setCell(c, r, ' ', CHARGEN_NO_COLOR);
        }
    }
}

function clearRowNoColor(display, row) {
    for (let c = 0; c < 80; c++) {
        display.setCell(c, row, ' ', CHARGEN_NO_COLOR);
    }
}

function drawChargenBanner(display) {
    clearScreenNoColor(display);
    display.putstr(0, 4, "NetHack, Copyright 1985-2026", CHARGEN_NO_COLOR);
    display.putstr(9, 5, "By Stichting Mathematisch Centrum and M. Stephenson.", CHARGEN_NO_COLOR);
    display.putstr(9, 6, "Version 5.0.0 (Teleport JS port).", CHARGEN_NO_COLOR);
    display.putstr(9, 7, "See license for details.", CHARGEN_NO_COLOR);
}

function drawNamePromptOnRow12(display, nameSoFar) {
    clearRowNoColor(display, 12);
    display.putstr(0, 12, "Who are you? " + nameSoFar, CHARGEN_NO_COLOR);
}

// Async wrapper around chargen_simulate that renders chargen-phase
// screens to the terminal. Calls await nhgetch() once per name letter
// (consuming from the input queue, triggering screen capture via the
// _preNhgetchHook), so chargen-phase screens are captured with banner
// + "Who are you? <typed>" content matching C's screen layout.
//
// After name capture, falls through to the existing chargen_simulate
// logic for picking role/race/gender/align (those screens are still
// captured as gameplay states for now; rendering chargen menus is a
// future increment).
const CHARGEN_PROMPT_ROW0 = "Shall I pick character's race, role, gender and alignment for you? [ynaq]";

function drawChargenPromptRow0(display) {
    clearRowNoColor(display, 0);
    display.putstr(0, 0, CHARGEN_PROMPT_ROW0, CHARGEN_NO_COLOR);
}

// Renders the "Is this ok?" confirmation menu shown after y-class
// chargen response. C ref: role.c:2654 plsel_startmenu(RS_filter)
// puts the prompt on row 0 with inverse SGR, the picked character
// description on row 2, and 4 action lines (y/n/a/q) on rows 4-7.
// Each is positioned at col 41 (right half of screen).
// Renders the "Pick a race or species" menu shown after role is
// picked manually. C ref: role.c:2407 plsel_startmenu(RS_RACE).
// Right-half menu at col 41+, rows 0..N.
//
// Items vary by role:
//   - Title (inverse) on row 0
//   - Description on row 2: "<role> <race> <gender> <align>"
//     with picked role and remaining attributes as placeholders.
//   - Race accelerators on rows 4..4+N-1: each race the role allows.
//   - "* * Random" after races.
//   - Blank row.
//   - "? - Pick another role first"
//   - "\" - Pick gender first"
//   - "[ - Pick alignment first" (only if role has > 1 valid align)
//   - "role forces <align>" (only if role+race forces 1 align — but
//     at race-menu stage, race not yet picked, so this is shown only
//     when the role itself is align-constrained: Rogue=chaotic only,
//     Knight=lawful, Samurai=lawful, etc.)
//   - "~ - Set role/race/&c filtering"
//   - "q - Quit"
//   - "(end)"
const RACE_LABEL = { human: 'human', elf: 'elf', dwarf: 'dwarf',
                     gnome: 'gnome', orc: 'orc' };
const RACE_LETTER_FOR_NAME = { human: 'h', elf: 'e', dwarf: 'd',
                               gnome: 'g', orc: 'o' };

function drawPickRaceMenu(display, role, gender = null, align = null, excluded = null) {
    clearScreenNoColor(display);
    const filterActive = !!(excluded && (excluded.roles?.size || excluded.races?.size
        || excluded.genders?.size || excluded.aligns?.size));
    const rd = role ? ROLE_DATA.find(r => r.name === role) : null;
    // role-only constraints applied by rigid_role_checks at race-menu setup
    const genderForced = rd && rd.gens.length === 1 ? rd.gens[0] : null;  // Valkyrie
    const alignForced = rd && rd.aligns.length === 1 ? rd.aligns[0] : null; // Rogue/Knight/etc.
    const genderText = gender || genderForced || '<gender>';
    const alignText = align || alignForced || '<alignment>';
    const genderShown = !!(gender || genderForced);
    const alignPicked = !!align;
    // Races to list: filter by all current constraints AND filter excl.
    const allRaces = ['human', 'elf', 'dwarf', 'gnome', 'orc'];
    let races = rd ? rd.races : allRaces.filter(r => {
        if (gender && !RACE_GENDS[r].includes(gender)) return false;
        if (align && !RACE_ALIGNS[r].includes(align)) return false;
        return true;
    });
    if (filterActive && excluded.races?.size) {
        races = races.filter(r => !excluded.races.has(r));
    }
    const COL = 41;
    display.putstr(COL, 0, "Pick a race or species", CHARGEN_NO_COLOR, 1);
    const roleText = role || '<role>';
    display.putstr(COL, 2, `${roleText} <race> ${genderText} ${alignText}`, CHARGEN_NO_COLOR);
    let row = 4;
    for (const race of races) {
        display.putstr(COL, row++, `${RACE_LETTER_FOR_NAME[race]} - ${RACE_LABEL[race]}`, CHARGEN_NO_COLOR);
    }
    display.putstr(COL, row++, "* * Random", CHARGEN_NO_COLOR);
    row++; // blank row
    display.putstr(COL, row++, role ? "? - Pick another role first" : "? - Pick role first", CHARGEN_NO_COLOR);
    if (genderForced) {
        display.putstr(COL + 4, row++, `role forces ${genderForced}`, CHARGEN_NO_COLOR);
    } else {
        const label = genderShown ? "\" - Pick another gender first" : "\" - Pick gender first";
        display.putstr(COL, row++, label, CHARGEN_NO_COLOR);
    }
    // For role-forced align (rd.aligns.length===1), always show
    // "role forces X" regardless of state.align — C treats this as a
    // permanent constraint, not a user choice.
    if (alignForced) {
        display.putstr(COL + 4, row++, `role forces ${alignForced}`, CHARGEN_NO_COLOR);
    } else {
        display.putstr(COL, row++, alignPicked ? "[ - Pick another alignment first" : "[ - Pick alignment first", CHARGEN_NO_COLOR);
    }
    display.putstr(COL, row++,
        filterActive ? "~ - Reset role/race/&c filtering"
                     : "~ - Set role/race/&c filtering", CHARGEN_NO_COLOR);
    display.putstr(COL, row++, "q - Quit", CHARGEN_NO_COLOR);
    display.putstr(COL, row++, "(end)", CHARGEN_NO_COLOR);
}

// Renders the "Pick a gender or sex" menu. Role may be null (user
// pressed '"' to navigate before picking role); in that case the menu
// shows all genders, the desc has "<role>" placeholder, and the
// "Pick role first" / "Pick another alignment first" labels reflect
// state. C ref: role.c:2495 plsel_startmenu(RS_GENDER).
function drawPickGenderMenu(display, role, race, align = null, excluded = null) {
    clearScreenNoColor(display);
    const filterActive = !!(excluded && (excluded.roles?.size || excluded.races?.size
        || excluded.genders?.size || excluded.aligns?.size));
    const rd = role ? ROLE_DATA.find(r => r.name === role) : null;
    const racePicked = !!race;
    const alignPicked = !!align;
    // Determine displayed align in row-2 description.
    let descAlign;
    if (alignPicked) {
        descAlign = align;
    } else if (rd && rd.aligns.length === 1) {
        descAlign = rd.aligns[0];
    } else if (race && RACE_ALIGNS[race]?.length === 1) {
        descAlign = RACE_ALIGNS[race][0];
    } else if (rd && race) {
        const valid = rd.aligns.filter(a => RACE_ALIGNS[race]?.includes(a));
        descAlign = valid.length === 1 ? valid[0] : '<alignment>';
    } else {
        descAlign = '<alignment>';
    }
    // Genders to list: role-restricted (Valkyrie female-only) or both.
    const gens = rd ? rd.gens : ['male', 'female'];
    const COL = 41;
    display.putstr(COL, 0, "Pick a gender or sex", CHARGEN_NO_COLOR, 1);
    const roleText = role || '<role>';
    const raceText = racePicked ? race : '<race>';
    display.putstr(COL, 2, `${roleText} ${raceText} <gender> ${descAlign}`, CHARGEN_NO_COLOR);
    let row = 4;
    for (const g of gens) {
        const letter = g === 'male' ? 'm' : 'f';
        display.putstr(COL, row++, `${letter} - ${g}`, CHARGEN_NO_COLOR);
    }
    display.putstr(COL, row++, "* * Random", CHARGEN_NO_COLOR);
    row++;
    display.putstr(COL, row++, role ? "? - Pick another role first" : "? - Pick role first", CHARGEN_NO_COLOR);
    display.putstr(COL, row++, racePicked ? "/ - Pick another race first" : "/ - Pick race first", CHARGEN_NO_COLOR);
    // align-constraint message vs nav option.
    // - "role forces X" when rd.aligns.length===1 (Rogue/Knight/etc).
    // - "race forces X" when race narrows align to 1 (e.g. Wizard+orc).
    // - "[ - Pick alignment first" / "another" otherwise.
    // C ref: forced labels are derived from rd/race constraints only,
    // independent of whether rigid_role_checks has populated state.align.
    const validAlignsByRoleRace = (rd && race)
        ? rd.aligns.filter(a => (RACE_ALIGNS[race] || []).includes(a))
        : (rd ? rd.aligns : null);
    if (rd && rd.aligns.length === 1) {
        display.putstr(COL + 4, row++, `role forces ${rd.aligns[0]}`, CHARGEN_NO_COLOR);
    } else if (race && validAlignsByRoleRace && validAlignsByRoleRace.length === 1) {
        display.putstr(COL + 4, row++, `race forces ${validAlignsByRoleRace[0]}`, CHARGEN_NO_COLOR);
    } else {
        display.putstr(COL, row++, alignPicked ? "[ - Pick another alignment first" : "[ - Pick alignment first", CHARGEN_NO_COLOR);
    }
    display.putstr(COL, row++,
        filterActive ? "~ - Reset role/race/&c filtering"
                     : "~ - Set role/race/&c filtering", CHARGEN_NO_COLOR);
    display.putstr(COL, row++, "q - Quit", CHARGEN_NO_COLOR);
    display.putstr(COL, row++, "(end)", CHARGEN_NO_COLOR);
}

// Renders the "Pick a role or profession" menu shown when user selects
// 'n' (manual chargen). Full-screen menu starting at col 1, rows 0-23.
// C ref: role.c:2310 plsel_startmenu(RS_ROLE) + setup_rolemenu.
// Renders the "Pick an alignment or creed" menu (right-half, col 41+).
// C ref: role.c:2580 plsel_startmenu(RS_ALGNMNT) when invoked by '['
// from another menu. The menu layout has all 3 align letters l/n/c
// (no role/race filtering applied yet since alignment is being
// chosen first).
function drawPickAlignMenu(display, role = null, race = null, gender = null) {
    clearScreenNoColor(display);
    const COL = 41;
    display.putstr(COL, 0, "Pick an alignment or creed", CHARGEN_NO_COLOR, 1);
    const roleText = role || '<role>';
    const raceText = race || '<race>';
    const genderText = gender || '<gender>';
    display.putstr(COL, 2, `${roleText} ${raceText} ${genderText} <alignment>`, CHARGEN_NO_COLOR);
    display.putstr(COL, 4, "l - lawful", CHARGEN_NO_COLOR);
    display.putstr(COL, 5, "n - neutral", CHARGEN_NO_COLOR);
    display.putstr(COL, 6, "c - chaotic", CHARGEN_NO_COLOR);
    display.putstr(COL, 7, "* * Random", CHARGEN_NO_COLOR);
    display.putstr(COL, 9, "? - Pick role first", CHARGEN_NO_COLOR);
    display.putstr(COL, 10, "/ - Pick race first", CHARGEN_NO_COLOR);
    display.putstr(COL, 11, "\" - Pick gender first", CHARGEN_NO_COLOR);
    display.putstr(COL, 12, "~ - Set role/race/&c filtering", CHARGEN_NO_COLOR);
    display.putstr(COL, 13, "q - Quit", CHARGEN_NO_COLOR);
    display.putstr(COL, 14, "(end)", CHARGEN_NO_COLOR);
}

// All 13 roles with their menu accelerator and label (in C order).
const ROLE_MENU_ITEMS = [
    { ch: 'a', label: 'an Archeologist', name: 'Archeologist' },
    { ch: 'b', label: 'a Barbarian', name: 'Barbarian' },
    { ch: 'c', label: 'a Caveman/Cavewoman', name: 'Caveman' },
    { ch: 'h', label: 'a Healer', name: 'Healer' },
    { ch: 'k', label: 'a Knight', name: 'Knight' },
    { ch: 'm', label: 'a Monk', name: 'Monk' },
    { ch: 'p', label: 'a Priest/Priestess', name: 'Priest' },
    { ch: 'r', label: 'a Rogue', name: 'Rogue' },
    { ch: 'R', label: 'a Ranger', name: 'Ranger' },
    { ch: 's', label: 'a Samurai', name: 'Samurai' },
    { ch: 't', label: 'a Tourist', name: 'Tourist' },
    { ch: 'v', label: 'a Valkyrie', name: 'Valkyrie' },
    { ch: 'w', label: 'a Wizard', name: 'Wizard' },
];

// Filter menu race accelerator letters (uppercase). C ref:
// setup_filter_menu — races use uppercase first letter.
const FILTER_RACE_ITEMS = [
    { ch: 'H', label: 'human', name: 'human' },
    { ch: 'E', label: 'elf', name: 'elf' },
    { ch: 'D', label: 'dwarf', name: 'dwarf' },
    { ch: 'G', label: 'gnome', name: 'gnome' },
    { ch: 'O', label: 'orc', name: 'orc' },
];

// Renders the "Pick all that apply" filter menu. Page 1 covers
// roles + races; page 2 covers genders + alignments.  Each row's
// marker is '+' (excluded) or '-' (not excluded). C ref:
// role.c filter_menu via setup_filter_menu (RS_filter).
function drawFilterMenu(display, excluded) {
    clearScreenNoColor(display);
    const COL = 1;
    display.putstr(COL, 0, "Pick all that apply", CHARGEN_NO_COLOR, 1);
    display.putstr(COL, 2, "Unacceptable roles", CHARGEN_NO_COLOR);
    let row = 3;
    for (const item of ROLE_MENU_ITEMS) {
        const mark = excluded.roles.has(item.name) ? '+' : '-';
        display.putstr(COL, row++, `${item.ch} ${mark} ${item.label}`, CHARGEN_NO_COLOR);
    }
    row++; // blank
    display.putstr(COL, row++, "Unacceptable races", CHARGEN_NO_COLOR);
    for (const item of FILTER_RACE_ITEMS) {
        const mark = excluded.races.has(item.name) ? '+' : '-';
        display.putstr(COL, row++, `${item.ch} ${mark} ${item.label}`, CHARGEN_NO_COLOR);
    }
    display.putstr(COL, 23, "(1 of 2)", CHARGEN_NO_COLOR);
}

const FILTER_ROLE_BY_LETTER = Object.fromEntries(
    ROLE_MENU_ITEMS.map(it => [it.ch, it.name]));
const FILTER_RACE_BY_LETTER = Object.fromEntries(
    FILTER_RACE_ITEMS.map(it => [it.ch, it.name]));

// When the user picks an attribute (align/race/gender) before role,
// the role list is filtered to only compatible roles. The label format
// also changes (e.g., "Caveman" instead of "Caveman/Cavewoman" when
// gender=male picked, since the female-form is irrelevant).
function drawPickRoleMenu(display, race = null, gender = null, align = null, excluded = null) {
    clearScreenNoColor(display);
    const filterActive = !!(excluded && (excluded.roles?.size || excluded.races?.size
        || excluded.genders?.size || excluded.aligns?.size));
    // C tty positions menu at col 41+ (right-half) when the menu fits
    // there (filtered list); col 1 (full-screen) otherwise. When ANY
    // constraint is set OR filter is active (which shrinks the list),
    // the menu uses right-half. Empirical: seed0006 step 31 (post-
    // filter, no role/race/etc. picked but filterActive) renders at
    // col 41.
    const constrained = !!(race || gender || align);
    const COL = (constrained || filterActive) ? 41 : 1;
    display.putstr(COL, 0, "Pick a role or profession", CHARGEN_NO_COLOR, 1);
    const roleText = '<role>';
    const raceText = race || '<race>';
    const genderText = gender || '<gender>';
    const alignText = align || '<alignment>';
    display.putstr(COL, 2, `${roleText} ${raceText} ${genderText} ${alignText}`, CHARGEN_NO_COLOR);
    let row = 4;
    for (const item of ROLE_MENU_ITEMS) {
        const rd = ROLE_DATA.find(r => r.name === item.name);
        if (!rd) continue;
        // Filter by align/race/gender constraint
        if (align && !rd.aligns.includes(align)) continue;
        if (race && !rd.races.includes(race)) continue;
        if (gender && !rd.gens.includes(gender)) continue;
        // Filter by '~' exclusions: skip roles excluded outright AND
        // roles whose every valid race is excluded.
        if (filterActive) {
            if (excluded.roles?.has(item.name)) continue;
            const remainingRaces = rd.races.filter(r => !excluded.races?.has(r));
            if (remainingRaces.length === 0) continue;
        }
        // Adjust label based on gender (e.g., "Caveman" not "Caveman/Cavewoman")
        let label = item.label;
        if (gender) {
            if (item.name === 'Caveman') {
                label = gender === 'female' ? 'a Cavewoman' : 'a Caveman';
            } else if (item.name === 'Priest') {
                label = gender === 'female' ? 'a Priestess' : 'a Priest';
            }
        }
        display.putstr(COL, row++, `${item.ch} - ${label}`, CHARGEN_NO_COLOR);
    }
    display.putstr(COL, row++, "* * Random", CHARGEN_NO_COLOR);
    // C role menu has a BLANK line between "* Random" and "Pick X
    // first" options when ANY constraint is set OR filter is active.
    // No blank for the very first full-screen unfiltered role menu
    // (e.g. seed0006 step 9). Empirical: seed0006 step 31 (post-filter,
    // no role/race/etc. picked but filterActive) HAS a blank.
    if (constrained || filterActive) row++;
    // When an attribute is already picked, C shows "Pick another X
    // first" (allowing the user to revise); when unset, just "Pick X
    // first". The line is always present for navigation.
    display.putstr(COL, row++, race ? "/ - Pick another race first" : "/ - Pick race first", CHARGEN_NO_COLOR);
    display.putstr(COL, row++, gender ? "\" - Pick another gender first" : "\" - Pick gender first", CHARGEN_NO_COLOR);
    display.putstr(COL, row++, align ? "[ - Pick another alignment first" : "[ - Pick alignment first", CHARGEN_NO_COLOR);
    // Filter active → "Reset"; otherwise "Set".
    display.putstr(COL, row++,
        filterActive ? "~ - Reset role/race/&c filtering"
                     : "~ - Set role/race/&c filtering", CHARGEN_NO_COLOR);
    display.putstr(COL, row++, "q - Quit", CHARGEN_NO_COLOR);
    display.putstr(COL, row++, "(end)", CHARGEN_NO_COLOR);
}

function drawIsThisOkMenu(display, charDesc, withBanner = true, preserveRename = false) {
    // For n-branch (no banner): clear entire screen first since
    // the previous race/gender menu had right-half content that
    // would otherwise bleed through the Is-this-ok layout.
    // Exception: for post-rename Is-this-ok, the rename prompt at
    // row 10 ("Who are you? <newname>") is left visible by C — it
    // bleeds through under the menu since the menu only paints its
    // own rows. Preserve row 10 in that case.
    if (!withBanner) {
        for (let r = 0; r < 24; r++) {
            if (preserveRename && r === 10) continue;
            for (let c = 0; c < 80; c++) {
                display.setCell(c, r, ' ', CHARGEN_NO_COLOR);
            }
        }
    }
    // Compute menu_col per C tty_end_menu (line 2729): cw->cols = max
    // over all menu items of (strlen(str) + 2). Empirically the floor
    // is 38 (for short descs the menu always uses a min width of 38),
    // and the offset is desc+1 for longer descs. C: offx = max(10,
    // ttyDisplay->cols - cw->cols - 1) = 79 - max(38, desc+1) for
    // desc-dominated menus.
    const COL = 79 - Math.max(38, charDesc.length + 1);
    clearRowNoColor(display, 0);
    clearRowNoColor(display, 2);
    // C ref: role.c plsel_startmenu narrows the banner display to the
    // left half (cols 0-40) when a menu is shown on the right (col 41+).
    // Re-write banner rows 4-7 with truncated text so cells 9-39
    // (banner) + 40 (menu leading space) + 41+ (menu) match C exactly.
    // Clear ALL cells on rows 4-8 (banner + menu zone) to NO_COLOR ' '.
    // This removes banner remnants beyond the menu's right edge that
    // would otherwise leak into cells 60+ from drawChargenBanner's
    // unclamped writes (e.g., "Stephenson." period at col 60).
    for (let r = 4; r <= 8; r++) {
        for (let c = 0; c < 80; c++) {
            display.setCell(c, r, ' ', CHARGEN_NO_COLOR);
        }
    }
    // For y-branch (banner still visible), re-render banner truncated
    // to fit within cols 0..COL-1. For n-branch (role menu was
    // full-screen, banner is gone), leave rows 4-7 as cleared.
    if (withBanner) {
        const bannerLine = (text, indent) => {
            const max = COL - 1 - indent;
            return text.slice(0, Math.max(0, max));
        };
        display.putstr(0, 4, bannerLine("NetHack, Copyright 1985-2026", 0), CHARGEN_NO_COLOR);
        display.putstr(9, 5, bannerLine("By Stichting Mathematisch Centrum and M. Stephenson.", 9), CHARGEN_NO_COLOR);
        display.putstr(9, 6, bannerLine("Version 5.0.0 (Teleport JS port).", 9), CHARGEN_NO_COLOR);
        display.putstr(9, 7, bannerLine("See license for details.", 9), CHARGEN_NO_COLOR);
    }
    // Title with inverse attribute (1)
    display.putstr(COL, 0, "Is this ok? [ynaq]", CHARGEN_NO_COLOR, 1);
    // Character description on row 2
    display.putstr(COL, 2, charDesc, CHARGEN_NO_COLOR);
    // y/n/a/q menu items on rows 4-7
    display.putstr(COL, 4, "y * Yes; start game", CHARGEN_NO_COLOR);
    display.putstr(COL, 5, "n - No; choose role again", CHARGEN_NO_COLOR);
    display.putstr(COL, 6, "a - Not yet; choose another name", CHARGEN_NO_COLOR);
    display.putstr(COL, 7, "q - Quit", CHARGEN_NO_COLOR);
    display.putstr(COL, 8, "(end)", CHARGEN_NO_COLOR);
}

// Build the character description string used in the confirmation menu.
// Format: "<plname> the <align> <gend> <race> <role>"
function chargenCharDesc(plname, role, race, gender, align) {
    const RACE_ADJ = { human: 'human', elf: 'elven', dwarf: 'dwarven',
                       gnome: 'gnomish', orc: 'orcish' };
    const adj = RACE_ADJ[race] || race;
    const roleName = (gender === 'female' && role === 'Caveman') ? 'Cavewoman'
                  : (gender === 'female' && role === 'Priest') ? 'Priestess'
                  : role;
    return `${plname} the ${align} ${gender} ${adj} ${roleName}`;
}

export async function chargen_simulate_async(moves, display) {
    if (!moves) return null;
    if (display) drawChargenBanner(display);
    let nameIdx = 0;
    // Render name prompt with empty name BEFORE first nhgetch, so
    // screen 0 captures "Who are you?".
    if (display) drawNamePromptOnRow12(display, '');
    // Consume name letters (each nhgetch captures a screen).
    const { nhgetch } = await import('./input.js');
    while (nameIdx < moves.length && moves[nameIdx] !== '\r' && moves[nameIdx] !== '\n') {
        await nhgetch(); // captures screen, returns char (we use moves[] for logic)
        nameIdx++;
        if (display) {
            drawNamePromptOnRow12(display, moves.slice(0, nameIdx));
        }
    }
    // Consume the \r. Then render "Shall I pick?" prompt and consume
    // the chargen response key so its screen is captured during chargen
    // (rather than later in moveloop where terminal state has changed).
    if (nameIdx < moves.length) {
        await nhgetch();
        nameIdx++;
        // Render the chargen prompt on row 0 before the response nhgetch.
        if (display) drawChargenPromptRow0(display);
    }
    if (nameIdx < moves.length) {
        await nhgetch(); // chargen response (y/n/a/space/return)
        const yn = moves[nameIdx];
        const isYClass = yn === 'y' || yn === 'Y' || yn === ' '
                      || yn === '\r' || yn === '\n';
        const isNClass = yn === 'n' || yn === 'N';
        // For y-class: emit the y-branch full-random picks NOW (4 rn2
        // calls). Use those picks to render the Is-this-ok menu — this
        // ensures the description shows the y-branch's initial pick
        // even if the user later rejects ('n') and runs through manual
        // menus that pick differently.
        let picked = null;
        let yBranchPicked = null;
        const initialName = moves.slice(0, indexOfReturn(moves, 0));
        if (isYClass) {
            yBranchPicked = chargen_full_random();
            yBranchPicked.name = initialName;
            picked = yBranchPicked;
        }
        if (isYClass && picked && display) {
            const desc = chargenCharDesc(initialName, picked.role,
                                         picked.race, picked.gender, picked.align);
            drawIsThisOkMenu(display, desc);
        } else if (isNClass && display) {
            // n-branch: role menu (full-screen) shown next.
            drawPickRoleMenu(display);
        }
        // Consume the confirmation key (or first menu key for n-branch).
        // Detect a 'y'-branch + 'n' rejection: this triggers manual mode
        // and the role menu is shown next.
        let confirmKey = null;
        if (nameIdx + 1 < moves.length) {
            await nhgetch();
            confirmKey = moves[nameIdx + 1];
        }
        const enteredManual = isNClass
            || (isYClass && (confirmKey === 'n' || confirmKey === 'N'));
        // For manual mode (n-branch, or y+n rejection): call
        // chargen_manual directly to emit manual rn2 calls and get
        // final picks. For pure y-branch (no rejection), picked is
        // already the y-branch full-random result.
        if (enteredManual) {
            // chargen_manual starts AFTER the chargen response key.
            // For y+n: also after the rejection 'n'.
            const manualStartIdx = isYClass ? nameIdx + 2 : nameIdx + 1;
            const finalPicked = chargen_manual(moves, manualStartIdx, initialName);
            if (finalPicked) picked = finalPicked;
        } else if (!isYClass && !isAClass(yn) && !isNClass) {
            // Other response (q/escape/etc.): fall back to chargen_simulate
            // for backward compatibility, though it shouldn't fire any rn2.
            picked = chargen_simulate(moves);
        }

        if (enteredManual && picked && display) {
            // Manual chargen FSM: at each iteration, decide which menu
            // to render based on the first unset attribute (role → race
            // → gender → align). After rendering and consuming a key,
            // dispatch:
            //   - letter → set the attribute for the current menu
            //   - '['/'/'/'"' → render the navigation target's menu and
            //     read its letter directly (C lets the user re-target
            //     before settling on the current menu's pick).
            // Auto-resolve attributes whose valid-options-count is 1.
            const manualStartIdx = isYClass ? nameIdx + 2 : nameIdx + 1;
            let i = manualStartIdx;
            const state = { role: null, race: null, gender: null, align: null };
            const merged = picked;
            // Set when post-rename → filter → re-pick produces a SECOND-
            // PASS set of picks that should override the FSM's first-pass
            // state at the end.
            let pickedOverride = null;
            // For n-branch: the role menu was already rendered (line 601)
            // and its key was already drained (line 608). Process that
            // pre-drained key now WITHOUT redrawing — handle role letter
            // or '['/'/'/'"' nav (which DO require their own render+drain).
            if (isNClass && i < moves.length) {
                const k = moves[i++];
                if (k in ROLE_BY_LETTER) {
                    state.role = ROLE_DATA[ROLE_BY_LETTER[k]].name;
                } else if (k === '[') {
                    drawPickAlignMenu(display, null, state.race, state.gender);
                    if (!(await drainOneIfAny())) return picked;
                    if (i >= moves.length) return picked;
                    const k2 = moves[i++];
                    if (k2 in ALGN_BY_LETTER) state.align = ALGN_BY_LETTER[k2];
                    else return picked;
                } else if (k === '"') {
                    drawPickGenderMenu(display, null, state.race, state.align);
                    if (!(await drainOneIfAny())) return picked;
                    if (i >= moves.length) return picked;
                    const k2 = moves[i++];
                    if (k2 in GEND_BY_LETTER) state.gender = GEND_BY_LETTER[k2];
                    else return picked;
                } else if (k === '/') {
                    drawPickRaceMenu(display, null, state.gender, state.align);
                    if (!(await drainOneIfAny())) return picked;
                    if (i >= moves.length) return picked;
                    const k2 = moves[i++];
                    if (k2 in RACE_BY_LETTER) state.race = RACE_BY_LETTER[k2];
                    else return picked;
                } else {
                    return picked;
                }
            }
            for (let iter = 0; iter < 32; iter++) {
                // Auto-resolve any rigid_role_check single-valid attrs.
                if (state.role !== null) {
                    const rd0 = ROLE_DATA.find(r => r.name === state.role);
                    const vR = rd0.races.filter(r =>
                        (!state.gender || RACE_GENDS[r].includes(state.gender)) &&
                        (!state.align || RACE_ALIGNS[r].includes(state.align)));
                    if (state.race === null && vR.length === 1) state.race = vR[0];
                    const vG = rd0.gens.filter(g =>
                        !state.race || RACE_GENDS[state.race].includes(g));
                    if (state.gender === null && vG.length === 1) state.gender = vG[0];
                    const vA = rd0.aligns.filter(a =>
                        !state.race || RACE_ALIGNS[state.race].includes(a));
                    if (state.align === null && vA.length === 1) state.align = vA[0];
                }
                // Pick target menu.
                let target;
                if (state.role === null) target = 'role';
                else if (state.race === null) target = 'race';
                else if (state.gender === null) target = 'gender';
                else if (state.align === null) target = 'align';
                else break;
                // Render target menu.
                if (target === 'role') {
                    drawPickRoleMenu(display, state.race, state.gender, state.align);
                } else if (target === 'race') {
                    drawPickRaceMenu(display, state.role, state.gender, state.align);
                } else if (target === 'gender') {
                    drawPickGenderMenu(display, state.role, state.race, state.align);
                } else {
                    drawPickAlignMenu(display, state.role, state.race, state.gender);
                }
                if (!(await drainOneIfAny())) return picked;
                if (i >= moves.length) return picked;
                const key = moves[i++];
                // Letter for current menu's attribute → set state, loop.
                if (target === 'role' && key in ROLE_BY_LETTER) {
                    state.role = ROLE_DATA[ROLE_BY_LETTER[key]].name;
                    continue;
                }
                if (target === 'race' && key in RACE_BY_LETTER) {
                    state.race = RACE_BY_LETTER[key]; continue;
                }
                if (target === 'gender' && key in GEND_BY_LETTER) {
                    state.gender = GEND_BY_LETTER[key]; continue;
                }
                if (target === 'align' && key in ALGN_BY_LETTER) {
                    state.align = ALGN_BY_LETTER[key]; continue;
                }
                // Nav keys: switch to nav target's menu, read letter.
                if (key === '[' || key === '/' || key === '"') {
                    if (key === '[') {
                        drawPickAlignMenu(display, state.role, state.race, state.gender);
                    } else if (key === '/') {
                        drawPickRaceMenu(display, state.role, state.gender, state.align);
                    } else {
                        drawPickGenderMenu(display, state.role, state.race, state.align);
                    }
                    if (!(await drainOneIfAny())) return picked;
                    if (i >= moves.length) return picked;
                    const k2 = moves[i++];
                    if (key === '[' && k2 in ALGN_BY_LETTER) state.align = ALGN_BY_LETTER[k2];
                    else if (key === '/' && k2 in RACE_BY_LETTER) state.race = RACE_BY_LETTER[k2];
                    else if (key === '"' && k2 in GEND_BY_LETTER) state.gender = GEND_BY_LETTER[k2];
                    else return picked;
                    continue;
                }
                // Unknown key (filter '~', '?' rerender, q/escape, etc.).
                return picked;
            }
            // Is-this-ok menu (n-branch: no banner backdrop).
            // Use initialName for the FIRST Is-this-ok render — the
            // pre-rename screen shows the originally typed name even
            // when chargen_manual has already processed an 'a' rename
            // and updated picked.name to the post-rename value.
            const desc = chargenCharDesc(initialName || merged.name || '',
                                         state.role || merged.role,
                                         state.race || merged.race,
                                         state.gender || merged.gender,
                                         state.align || merged.align);
            drawIsThisOkMenu(display, desc, false);
            const confirmCode = await drainOneIfAny();
            // 'a' rename: re-prompt name on row 10, then re-render
            // Is-this-ok with the new name and consume the post-rename
            // confirm key. C ref: role.c:2693.
            if (confirmCode === 0x61 || confirmCode === 0x41) {
                if (display) drawRenamePromptOnRow10(display, '');
                await renderRenameNameCapture(display);
                // Post-rename Is-this-ok: use the rename's new name from
                // chargen_manual (which already processed 'a' and stored
                // the new name in merged.name).
                const postRenameName = merged.name || initialName;
                const desc2 = chargenCharDesc(postRenameName,
                                              state.role || merged.role,
                                              state.race || merged.race,
                                              state.gender || merged.gender,
                                              state.align || merged.align);
                drawIsThisOkMenu(display, desc2, false, true);
                const postRenameConfirm = await drainOneIfAny();
                // 'n' rejection → re-show full-screen role menu (step 21
                // for seed0006) and consume the next key.
                if (postRenameConfirm === 0x6E || postRenameConfirm === 0x4E) {
                    drawPickRoleMenu(display);
                    const navKey = await drainOneIfAny();
                    // '~' filter menu: render the filter, consume each
                    // toggle key (a-w roles, H/E/D/G/O races) updating
                    // the exclusion set + re-rendering, until '\r' or
                    // '\n' confirms.
                    if (navKey === 0x7E /* '~' */) {
                        const excluded = { roles: new Set(), races: new Set() };
                        // Loop: render filter, drain key, toggle, repeat.
                        for (let fi = 0; fi < 64; fi++) {
                            drawFilterMenu(display, excluded);
                            const k = await drainOneIfAny();
                            if (!k) return picked;
                            if (k === 0x0D || k === 0x0A) break; // \r/\n confirm
                            const ch = String.fromCharCode(k);
                            if (ch in FILTER_ROLE_BY_LETTER) {
                                const role = FILTER_ROLE_BY_LETTER[ch];
                                if (excluded.roles.has(role)) excluded.roles.delete(role);
                                else excluded.roles.add(role);
                            } else if (ch in FILTER_RACE_BY_LETTER) {
                                const race = FILTER_RACE_BY_LETTER[ch];
                                if (excluded.races.has(race)) excluded.races.delete(race);
                                else excluded.races.add(race);
                            }
                            // Other keys (space for paging, etc.) ignored.
                        }
                        // Post-filter: re-render role menu with the
                        // filtered list and footer "Reset role/race/
                        // &c filtering". seed0006 step 31.
                        drawPickRoleMenu(display, null, null, null, excluded);
                        const k = await drainOneIfAny();
                        // Continue with race/gender menus (filtered by
                        // exclusions) after the role letter is consumed.
                        // seed0006: 'w' Wizard → race menu (gnome/orc) →
                        // gender menu → final Is-this-ok.
                        if (k) {
                            const ch = String.fromCharCode(k);
                            const postRoleState = { role: null, race: null, gender: null, align: null };
                            if (ch in ROLE_BY_LETTER) {
                                postRoleState.role = ROLE_DATA[ROLE_BY_LETTER[ch]].name;
                            }
                            if (postRoleState.role) {
                                const rd = ROLE_DATA.find(r => r.name === postRoleState.role);
                                // Race menu (with filter exclusions).
                                const validRaces = rd.races.filter(r =>
                                    !excluded.races?.has(r) &&
                                    (!postRoleState.gender || RACE_GENDS[r].includes(postRoleState.gender)) &&
                                    (!postRoleState.align || RACE_ALIGNS[r].includes(postRoleState.align)));
                                if (validRaces.length > 1) {
                                    drawPickRaceMenu(display, postRoleState.role, postRoleState.gender, postRoleState.align, excluded);
                                    const kr = await drainOneIfAny();
                                    if (kr) {
                                        const rch = String.fromCharCode(kr);
                                        if (rch in RACE_BY_LETTER && validRaces.includes(RACE_BY_LETTER[rch])) {
                                            postRoleState.race = RACE_BY_LETTER[rch];
                                        }
                                    }
                                } else if (validRaces.length === 1) {
                                    postRoleState.race = validRaces[0];
                                }
                                // Gender menu.
                                if (postRoleState.race) {
                                    const validGends = rd.gens.filter(g =>
                                        RACE_GENDS[postRoleState.race].includes(g));
                                    if (validGends.length > 1) {
                                        drawPickGenderMenu(display, postRoleState.role, postRoleState.race, postRoleState.align, excluded);
                                        const kg = await drainOneIfAny();
                                        if (kg) {
                                            const gch = String.fromCharCode(kg);
                                            if (gch in GEND_BY_LETTER) {
                                                postRoleState.gender = GEND_BY_LETTER[gch];
                                            }
                                        }
                                    } else if (validGends.length === 1) {
                                        postRoleState.gender = validGends[0];
                                    }
                                    // Align: auto-resolve if 1 valid.
                                    const validAligns = rd.aligns.filter(a =>
                                        RACE_ALIGNS[postRoleState.race].includes(a));
                                    if (validAligns.length === 1) {
                                        postRoleState.align = validAligns[0];
                                    }
                                }
                                // Re-render Is-this-ok with new picks.
                                if (postRoleState.role && postRoleState.race
                                    && postRoleState.gender && postRoleState.align) {
                                    const newName = merged.name || initialName;
                                    const desc3 = chargenCharDesc(newName,
                                        postRoleState.role, postRoleState.race,
                                        postRoleState.gender, postRoleState.align);
                                    drawIsThisOkMenu(display, desc3, false);
                                    await drainOneIfAny();
                                    pickedOverride = {
                                        role: postRoleState.role,
                                        race: postRoleState.race,
                                        gender: postRoleState.gender,
                                        align: postRoleState.align,
                                        name: newName,
                                    };
                                }
                            }
                        }
                    }
                }
            }
            // Default carry-forward: state from FSM (first-pass picks).
            // Post-filter override (if any) takes precedence and reflects
            // the final second-pass picks.
            picked = pickedOverride || {
                role: state.role || merged.role,
                race: state.race || merged.race,
                gender: state.gender || merged.gender,
                align: state.align || merged.align,
                name: merged.name,
            };
        }
        return picked;
    }
    return chargen_simulate(moves);
}

function isAClass(yn) {
    return yn === 'a' || yn === 'A' || yn === '@' || yn === '*';
}

function drawRenamePromptOnRow10(display, nameSoFar) {
    clearScreenNoColor(display);
    display.putstr(0, 10, "Who are you? " + nameSoFar, CHARGEN_NO_COLOR);
}

// After 'a' rename at confirmation, read new name letters via nhgetch
// (each capturing a screen with banner-free row-10 prompt + echoed
// letters). Stops at \r/\n. Returns the captured new name.
async function renderRenameNameCapture(display) {
    const { nhgetch } = await import('./input.js');
    const newName = [];
    while (true) {
        let code;
        try { code = await nhgetch(); } catch (e) { return newName.join(''); }
        if (code === 13 || code === 10) return newName.join('');
        const ch = String.fromCharCode(code);
        newName.push(ch);
        if (display) drawRenamePromptOnRow10(display, newName.join(''));
    }
}

async function drainOneIfAny() {
    const { nhgetch } = await import('./input.js');
    // Try to consume one key — but only if queue has any. If not, the
    // chargen UI rendering ends here. Returns the key code (1-based: 0
    // means nothing consumed; otherwise the char code).
    try {
        const code = await nhgetch();
        return code || -1;  // 0 might be a valid code; use -1 sentinel
    } catch (e) {
        return 0;
    }
}

export function chargen_simulate(moves) {
    if (!moves) return null;
    let idx = 0;
    // Capture the typed name (letters before first \r/\n).
    const initialName = moves.slice(0, indexOfReturn(moves, 0));
    while (idx < moves.length && moves[idx] !== '\r' && moves[idx] !== '\n') idx++;
    if (idx >= moves.length - 1) return null;
    idx++;
    if (idx >= moves.length) return null;
    const yn = moves[idx]; idx++;

    // 'y' (and space/\r/\n which collapse to 'y') leads to the 4-pick
    // sequence and then a "Is X OK?" confirmation prompt. 'a' / '@' / '*'
    // are PICK_RANDOM with skip-confirm, so no follow-up rejection key
    // is consumed. We only check for the 'n' rejection on 'y'-class
    // responses; for 'a'-class, the next keystroke is gameplay.
    const isYClass = yn === 'y' || yn === 'Y' || yn === ' '
                  || yn === '\r' || yn === '\n';
    const isAClass = yn === 'a' || yn === 'A' || yn === '@' || yn === '*';
    if (isYClass || isAClass) {
        const picked = chargen_full_random();
        picked.name = initialName;
        if (isYClass) {
            // 'y' shows "Is X OK?" prompt. Process responses:
            // 'a' = rename + re-show; 'n' = reject + manual; else = accept.
            // C ref: role.c:2654 getconfirmation loop.
            let currentName = initialName;
            while (idx < moves.length) {
                while (idx < moves.length
                       && moves[idx] !== 'y' && moves[idx] !== 'Y'
                       && moves[idx] !== 'n' && moves[idx] !== 'N'
                       && moves[idx] !== 'a' && moves[idx] !== 'A'
                       && moves[idx] !== 'q' && moves[idx] !== 'Q'
                       && moves[idx] !== ' ' && moves[idx] !== '\r' && moves[idx] !== '\n'
                       && moves[idx] !== '\x1b') idx++;
                if (idx >= moves.length) break;
                const c = moves[idx]; idx++;
                if (c === 'a' || c === 'A') {
                    const ns = idx;
                    while (idx < moves.length && moves[idx] !== '\r' && moves[idx] !== '\n') idx++;
                    currentName = moves.slice(ns, idx);
                    picked.name = currentName;
                    if (idx < moves.length) idx++;
                    continue;
                }
                if (c === 'n' || c === 'N') {
                    const m = chargen_manual(moves, idx, currentName);
                    if (m) return m;
                    return picked;
                }
                break;
            }
        }
        return picked;
    }

    if (yn !== 'n' && yn !== 'N') return null;
    return chargen_manual(moves, idx, initialName);
}

// Helper: index of first \r or \n at or after `start` in `moves`,
// or moves.length if none.
function indexOfReturn(moves, start) {
    let i = start;
    while (i < moves.length && moves[i] !== '\r' && moves[i] !== '\n') i++;
    return i;
}

// Manual-menu chargen ('n' branch). Walks RS_ROLE/RACE/GENDER/ALGNMNT
// stages, emitting PICK_RIGID rn2(1) calls via rigid_role_checks
// before each menu shown.
//
// After completing all stages, looks for the "Is this ok?" confirmation
// response. 'y' / space / \r → accept (chargen complete); 'n' → reject
// and restart this whole function with all attributes reset (matches
// role.c:2716 makepicks goto); 'a' → rename flow: skip new name (until
// \r/\n), then read the next "Is this ok?" response, looping again.
// 'q' / ESC → quit (chargen ends, return what we have).
function chargen_manual(moves, idx, initialName) {
    let picked = null;
    let currentName = initialName || '';
    while (true) {
        const result = chargen_manual_pass(moves, idx);
        if (!result) return picked;
        idx = result.idx;
        picked = result.picked;
        picked.name = currentName;
        // Inner loop: process confirmation responses. 'a' (rename) keeps
        // the picks and re-shows the confirmation; 'n' resets and restarts
        // the whole chargen; 'y'/space/\r/\n/q/ESC ends chargen.
        while (true) {
            while (idx < moves.length
                   && moves[idx] !== 'y' && moves[idx] !== 'Y'
                   && moves[idx] !== 'n' && moves[idx] !== 'N'
                   && moves[idx] !== 'a' && moves[idx] !== 'A'
                   && moves[idx] !== 'q' && moves[idx] !== 'Q'
                   && moves[idx] !== ' ' && moves[idx] !== '\r' && moves[idx] !== '\n'
                   && moves[idx] !== '\x1b') idx++;
            if (idx >= moves.length) return picked;
            const confirm = moves[idx]; idx++;
            if (confirm === 'a' || confirm === 'A') {
                // rename: skip new name (until \r/\n), then continue inner
                // loop to process the next confirm prompt. C ref: role.c:2693
                // preserves ROLE/RACE/GEND/ALGN across rename.
                const nameStart = idx;
                while (idx < moves.length && moves[idx] !== '\r' && moves[idx] !== '\n') idx++;
                currentName = moves.slice(nameStart, idx);
                picked.name = currentName;
                if (idx < moves.length) idx++;
                continue;
            }
            if (confirm === 'n' || confirm === 'N') {
                // reject: outer loop restarts chargen_manual_pass with reset state.
                // C ref: role.c:2716 sets all to ROLE_NONE and gotos makepicks.
                break;
            }
            // 'y'/space/\r/\n/q/ESC: accept or quit; return what we have
            return picked;
        }
    }
}

function chargen_manual_pass(moves, idx) {
    const s = { roleIdx: null, race: null, gend: null, algn: null };

    // Pre-scan for "Pick X first" navigation keys and filter mode.
    // C ref: role.c filter_menu (RS_filter). When the user presses '~'
    // in the role menu, they enter filter setup; subsequent letters
    // add to the filter list and \r/\n confirms.
    // '[' = Pick alignment first → consume align letter
    // '/' = Pick race first → consume race letter (role still chosen later)
    // '"' = Pick gender first → consume gender letter
    // (Multiple navigation rounds possible: seed0012 uses '[','"','/')
    while (true) {
        while (idx < moves.length && !(moves[idx] in ROLE_BY_LETTER)
               && moves[idx] !== '~' && moves[idx] !== 'F'
               && moves[idx] !== '[' && moves[idx] !== '/' && moves[idx] !== '"') idx++;
        if (idx >= moves.length) return null;
        const ch = moves[idx];
        if (ch === '~' || ch === 'F') {
            // Filter mode: skip the rest until \r/\n confirm
            idx++;
            while (idx < moves.length && moves[idx] !== '\r' && moves[idx] !== '\n') idx++;
            if (idx < moves.length) idx++;
            continue;
        }
        if (ch === '[') {
            // Pick alignment first: read align letter (l/n/c) next.
            idx++;
            while (idx < moves.length && !(moves[idx] in ALGN_BY_LETTER)) idx++;
            if (idx >= moves.length) return null;
            s.algn = ALGN_BY_LETTER[moves[idx]]; idx++;
            continue;
        }
        if (ch === '/') {
            // Pick race first: read race letter next. Race may be
            // role-constrained later; for now just capture user choice.
            idx++;
            while (idx < moves.length && !(moves[idx] in RACE_BY_LETTER)) idx++;
            if (idx >= moves.length) return null;
            s.race = RACE_BY_LETTER[moves[idx]]; idx++;
            continue;
        }
        if (ch === '"') {
            // Pick gender first: read gender letter next.
            idx++;
            while (idx < moves.length && !(moves[idx] in GEND_BY_LETTER)) idx++;
            if (idx >= moves.length) return null;
            s.gend = GEND_BY_LETTER[moves[idx]]; idx++;
            continue;
        }
        break;
    }
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
        idx,
        picked: {
            role: ROLE_DATA[s.roleIdx].name,
            race: s.race, gender: s.gend, align: s.algn,
        },
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
