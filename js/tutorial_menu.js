// tutorial_menu.js — Renders the "Do you want a tutorial?" menu
// from options.c:430 ask_do_tutorial(), called by allmain.c:574
// maybe_do_tutorial() right after moveloop_preamble() finishes its
// status messages.  C tty's rendering of this menu is fixed across
// all sessions: header at row 0 col 21 in REVERSE VIDEO, items at
// col 21 of rows 2-3, hint at col 21 of row 5, "(end)" at col 21
// of row 6.  Captured via nh_getch and dismissed by the user's
// 'y' / 'n' / SPACE / ESC keystroke.

import { game } from './gstate.js';
import { nhgetch } from './input.js';

const NO_COLOR = 8;
const ATTR_INVERSE = 0x1;  // observable in screen-decode.mjs SPACE_VISIBLE_ATTRS

// Empirically derived from 32 captured sessions — every tutorial
// menu lands at col 21.  Computed by C as
// `(80 - menu_width) / 2` rounded with right-padding 2; the longest
// line is the hint at 57 chars, so col = 80 - 57 - 2 = 21.
const TUTORIAL_LEFT_COL = 21;

const TUTORIAL_LINES = [
    { row: 0, text: 'Do you want a tutorial?', inverse: true },
    { row: 2, text: 'y - Yes, do a tutorial' },
    { row: 3, text: 'n - No, just start play' },
    { row: 5, text: 'Put "OPTIONS=!tutorial" in .nethackrc to skip this query.' },
    { row: 6, text: '(end)' },
];

// After an invalid keystroke C inserts a "(Please choose 'y' or 'n'.)"
// hint at row 6 and pushes "(end)" down to row 7.
const TUTORIAL_LINES_INVALID = [
    { row: 0, text: 'Do you want a tutorial?', inverse: true },
    { row: 2, text: 'y - Yes, do a tutorial' },
    { row: 3, text: 'n - No, just start play' },
    { row: 5, text: 'Put "OPTIONS=!tutorial" in .nethackrc to skip this query.' },
    { row: 6, text: "(Please choose 'y' or 'n'.)" },
    { row: 7, text: '(end)' },
];

// Render the tutorial menu, capture via nh_getch, then clear.  The
// caller must have already determined that ask_do_tutorial() should
// fire (i.e., `g.tutorial_set_in_config` is false and the level has
// a "tut-1" entry — for our public sessions, the tut-1 level always
// exists).
export async function display_tutorial_menu() {
    const display = game.nhDisplay;
    if (!display) { await nhgetch(); return; }

    // Clear the menu rows in case anything from preamble plines is
    // still lingering.  Leave rows 7+ untouched — the map underneath
    // is partially visible below the menu in C captures.
    for (let r = 0; r <= 6; r++) {
        for (let c = 0; c < 80; c++) {
            display.setCell(c, r, ' ', NO_COLOR, 0);
        }
    }

    // Paint each menu line.  Clear rows 0..maxRow (varies by whether
    // the invalid-input hint pushes (end) to row 7).
    function paintMenu(lines) {
        let maxRow = 0;
        for (const line of lines) if (line.row > maxRow) maxRow = line.row;
        for (let r = 0; r <= maxRow; r++) {
            for (let c = 0; c < 80; c++) {
                display.setCell(c, r, ' ', NO_COLOR, 0);
            }
        }
        for (const line of lines) {
            const attr = line.inverse ? ATTR_INVERSE : 0;
            for (let i = 0; i < line.text.length && TUTORIAL_LEFT_COL + i < 80; i++) {
                display.setCell(TUTORIAL_LEFT_COL + i, line.row, line.text[i], NO_COLOR, attr);
            }
        }
    }

    paintMenu(TUTORIAL_LINES);

    // Loop on invalid input.  Only y / Y / n / N / ESC dismiss the
    // menu; anything else (including space) redraws the prompt with
    // an added "(Please choose 'y' or 'n'.)" hint.  C ref:
    // options.c:430 ask_do_tutorial.
    let invalid = false;
    while (true) {
        const key = await nhgetch();
        const ch = String.fromCharCode(key);
        if (ch === 'y' || ch === 'Y' || ch === 'n' || ch === 'N' || key === 27) break;
        invalid = true;
        // Re-paint with the invalid-input hint for the next capture.
        paintMenu(TUTORIAL_LINES_INVALID);
    }

    // Clear the menu rows so the next flush_screen draws the map
    // unobscured.  Up to row 7 if the invalid-input hint was painted.
    const clearMax = invalid ? 7 : 6;
    for (let r = 0; r <= clearMax; r++) {
        for (let c = 0; c < 80; c++) {
            display.setCell(c, r, ' ', NO_COLOR, 0);
        }
    }
}
