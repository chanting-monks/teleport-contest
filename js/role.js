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
// Renders the "Pick a role or profession" menu shown when user selects
// 'n' (manual chargen). Full-screen menu starting at col 1, rows 0-23.
// C ref: role.c:2310 plsel_startmenu(RS_ROLE) + setup_rolemenu.
function drawPickRoleMenu(display) {
    clearScreenNoColor(display);
    // Title with inverse SGR (attr=1)
    display.putstr(1, 0, "Pick a role or profession", CHARGEN_NO_COLOR, 1);
    display.putstr(1, 2, "<role> <race> <gender> <alignment>", CHARGEN_NO_COLOR);
    display.putstr(1, 4, "a - an Archeologist", CHARGEN_NO_COLOR);
    display.putstr(1, 5, "b - a Barbarian", CHARGEN_NO_COLOR);
    display.putstr(1, 6, "c - a Caveman/Cavewoman", CHARGEN_NO_COLOR);
    display.putstr(1, 7, "h - a Healer", CHARGEN_NO_COLOR);
    display.putstr(1, 8, "k - a Knight", CHARGEN_NO_COLOR);
    display.putstr(1, 9, "m - a Monk", CHARGEN_NO_COLOR);
    display.putstr(1, 10, "p - a Priest/Priestess", CHARGEN_NO_COLOR);
    display.putstr(1, 11, "r - a Rogue", CHARGEN_NO_COLOR);
    display.putstr(1, 12, "R - a Ranger", CHARGEN_NO_COLOR);
    display.putstr(1, 13, "s - a Samurai", CHARGEN_NO_COLOR);
    display.putstr(1, 14, "t - a Tourist", CHARGEN_NO_COLOR);
    display.putstr(1, 15, "v - a Valkyrie", CHARGEN_NO_COLOR);
    display.putstr(1, 16, "w - a Wizard", CHARGEN_NO_COLOR);
    display.putstr(1, 17, "* * Random", CHARGEN_NO_COLOR);
    display.putstr(1, 18, "/ - Pick race first", CHARGEN_NO_COLOR);
    display.putstr(1, 19, "\" - Pick gender first", CHARGEN_NO_COLOR);
    display.putstr(1, 20, "[ - Pick alignment first", CHARGEN_NO_COLOR);
    display.putstr(1, 21, "~ - Set role/race/&c filtering", CHARGEN_NO_COLOR);
    display.putstr(1, 22, "q - Quit", CHARGEN_NO_COLOR);
    display.putstr(1, 23, "(end)", CHARGEN_NO_COLOR);
}

function drawIsThisOkMenu(display, charDesc) {
    clearRowNoColor(display, 0);
    clearRowNoColor(display, 2);
    // C ref: role.c plsel_startmenu narrows the banner display to the
    // left half (cols 0-40) when a menu is shown on the right (col 41+).
    // Re-write banner rows 4-7 with truncated text so cells 9-39
    // (banner) + 40 (menu leading space) + 41+ (menu) match C exactly.
    // First, clear the banner row content (cols 0-40) to NO_COLOR ' '.
    for (let r = 4; r <= 8; r++) {
        for (let c = 0; c <= 40; c++) {
            display.setCell(c, r, ' ', CHARGEN_NO_COLOR);
        }
    }
    // Re-render banner with truncation matching C's plsel layout.
    display.putstr(0, 4, "NetHack, Copyright 1985-2026", CHARGEN_NO_COLOR);
    display.putstr(9, 5, "By Stichting Mathematisch Centr", CHARGEN_NO_COLOR);
    display.putstr(9, 6, "Version 5.0.0 (Teleport JS port)", CHARGEN_NO_COLOR);
    display.putstr(9, 7, "See license for details.", CHARGEN_NO_COLOR);
    // Row 0 col 41: "Is this ok? [ynaq]" with inverse attribute (1)
    display.putstr(41, 0, "Is this ok? [ynaq]", CHARGEN_NO_COLOR, 1);
    // Row 2 col 41: character description
    display.putstr(41, 2, charDesc, CHARGEN_NO_COLOR);
    // Rows 4-7 col 41: y/n/a/q menu items (positioned to right of banner)
    display.putstr(41, 4, "y * Yes; start game", CHARGEN_NO_COLOR);
    display.putstr(41, 5, "n - No; choose role again", CHARGEN_NO_COLOR);
    display.putstr(41, 6, "a - Not yet; choose another name", CHARGEN_NO_COLOR);
    display.putstr(41, 7, "q - Quit", CHARGEN_NO_COLOR);
    display.putstr(41, 8, "(end)", CHARGEN_NO_COLOR);
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
        // Run chargen_simulate eagerly so we have the picked role/
        // race/gender/align available to render the "Is this ok?" menu.
        // chargen_simulate emits the rn2 calls synchronously (those are
        // unaffected by terminal rendering); we use its returned picks
        // to format the character description string in the menu.
        const picked = chargen_simulate(moves);
        const yn = moves[nameIdx];
        const isYClass = yn === 'y' || yn === 'Y' || yn === ' '
                      || yn === '\r' || yn === '\n';
        const isNClass = yn === 'n' || yn === 'N';
        if (isYClass && picked && display) {
            const initialName = picked.name || moves.slice(0, indexOfReturn(moves, 0));
            const desc = chargenCharDesc(initialName, picked.role,
                                         picked.race, picked.gender, picked.align);
            drawIsThisOkMenu(display, desc);
        } else if (isNClass && display) {
            // n-branch: role menu (full-screen) shown next.
            drawPickRoleMenu(display);
        }
        // Consume the confirmation key (or first menu key for n-branch)
        if (nameIdx + 1 < moves.length) {
            await nhgetch();
        }
        return picked;
    }
    return chargen_simulate(moves);
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

    // Stage RS_ROLE — read role letter, but skip filter-mode keystrokes.
    // C ref: role.c filter_menu (RS_filter). When the user presses '~' in
    // the role menu, they enter filter setup; subsequent letters add to
    // the filter list and \r/\n confirms. After confirmation, the role
    // menu reappears (now filtered) and the user picks a role letter.
    // The filter keystrokes don't fire any rn2 calls, so we just skip
    // them. Multiple filter rounds are possible (seed0006 has two: role
    // filter then race filter).
    while (true) {
        while (idx < moves.length && !(moves[idx] in ROLE_BY_LETTER)
               && moves[idx] !== '~' && moves[idx] !== 'F') idx++;
        if (idx >= moves.length) return null;
        if (moves[idx] === '~' || moves[idx] === 'F') {
            // Filter mode: skip the rest until \r/\n confirm
            idx++;
            while (idx < moves.length && moves[idx] !== '\r' && moves[idx] !== '\n') idx++;
            if (idx < moves.length) idx++;
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
