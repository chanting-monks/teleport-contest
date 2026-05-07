// legacy.js — Port of `com_pager(legacy)` from
// nethack-c/upstream/src/allmain.c:832 + nethack-c/upstream/dat/quest.lua
// `legacy` entry.  Renders the player's role/alignment-specific
// "It is written in the Book of <god>:" intro story to the terminal
// grid as a centered overlay, ending with a "--More--" prompt that
// the next nh_getch will dismiss.  Called from newgame() between
// chargen completion and welcome() when flags.legacy is on.
//
// Substitutions (subset of questpgr.c:236 convert_arg + 328 convert_line):
//   %d → align_gname(player_align)  — god name, leading '_' stripped
//   %G → align_gtitle(player_align) — "god" / "goddess" (goddess if '_' prefix)
//   %r → rank-1 title for player's role/gender
//
// Renderer (per the "menu" output mode at questpgr.c:474 howtoput):
//   - Each line emitted at column `(80 - max_visible_line_len - 1)`
//     plus its template's leading-space indent (4 spaces for the
//     middle paragraph in the legacy template).
//   - Empty lines remain empty rows.
//   - "--More--" appended at the menu's left column after the last
//     paragraph.  The next nh_getch captures this overlay; the
//     player's next keystroke dismisses it.
//
// The map and status bar drawn before legacy remain visible at any
// rows the menu does not cover (typically rows below the --More--).

import { game } from './gstate.js';
import { roles } from './roles.js';
import { nhgetch } from './input.js';

const LEGACY_TEMPLATE = `It is written in the Book of %d:

    After the Creation, the cruel god Moloch rebelled
    against the authority of Marduk the Creator.
    Moloch stole from Marduk the most powerful of all
    the artifacts of the gods, the Amulet of Yendor,
    and he hid it in the dark cavities of Gehennom, the
    Under World, where he now lurks, and bides his time.

Your %G %d seeks to possess the Amulet, and with it
to gain deserved ascendance over the other gods.

You, a newly trained %r, have been heralded
from birth as the instrument of %d.  You are destined
to recover the Amulet for your deity, or die in the
attempt.  Your hour of destiny has come.  For the sake
of us all:  Go bravely with %d!`;

// Strip the leading '_' goddess marker.  C ref: pray.c:2552-2554.
function stripUnderscore(s) {
    return (s && s[0] === '_') ? s.slice(1) : s;
}

// Resolve %d / %G / %r for the player's current role + alignment.
// alignType: -1 chaotic, 0 neutral, 1 lawful (matches aligns[].value).
// female: boolean for selecting rank1.f.
function buildSubstitutions(roleName, alignType, female, priestPantheon) {
    const role = roles.find(r => r.name.m === roleName ||
                                  (r.name.f && r.name.f === roleName));
    if (!role) return null;

    // gods[] is [lawful, neutral, chaotic]; map align value 1/0/-1
    // to index 0/1/2.  For Priest the gods come from a randomly
    // chosen role's pantheon (rn2(13) loop in role_init); we read
    // the picked role index from `game._priestPantheon` set by
    // role_init.
    let godsSource = role.gods;
    if (!godsSource) {
        if (typeof priestPantheon !== 'number') return null;
        const pantheonRole = roles[priestPantheon];
        if (!pantheonRole || !pantheonRole.gods) return null;
        godsSource = pantheonRole.gods;
    }

    const alignIdx = alignType === 1 ? 0 : alignType === 0 ? 1 : 2;
    const rawGod = godsSource[alignIdx];
    const god = stripUnderscore(rawGod);
    const title = (rawGod && rawGod[0] === '_') ? 'goddess' : 'god';

    // For Priest, rank1 is from the Priest role itself ("Aspirant"),
    // not from the pantheon role — only the gods are borrowed.
    const rank1 = (female && role.rank1.f) ? role.rank1.f : role.rank1.m;

    return { d: god, G: title, r: rank1 };
}

// Apply %d/%G/%r substitutions to one template line.
function substituteLine(line, subs) {
    return line
        .replaceAll('%d', subs.d)
        .replaceAll('%G', subs.G)
        .replaceAll('%r', subs.r);
}

// Compute the menu's left column from the longest visible line's
// length (including any 4-space indent from the template).  See
// LEARNINGS.md #16 — empirically derived, the menu is right-padded
// by 1 column so col = 79 - max_visible_line_len.
function computeMenuLeftCol(lines) {
    let maxLen = 0;
    for (const line of lines) {
        if (line.length > maxLen) maxLen = line.length;
    }
    return Math.max(0, 79 - maxLen);
}

// Render the legacy text overlay onto the terminal grid, then await
// one nh_getch (which captures the overlay screen and returns the
// dismiss key).  Caller is responsible for ensuring the rest of the
// screen (status line, any visible map) is already in place — this
// function only paints the menu rows.
export async function display_legacy() {
    const g = game;
    const role = g.opts_role || (g.urole?.name?.m || 'Tourist');
    const alignName = g._align_name || 'neutral';
    const alignType = alignName === 'lawful' ? 1
                    : alignName === 'chaotic' ? -1 : 0;
    const female = !!(g.flags?.female);

    const subs = buildSubstitutions(role, alignType, female, g._priestPantheon);
    if (!subs) return; // unknown role or Priest pantheon not resolved.

    // Substitute each template line in place; preserve leading spaces.
    const rawLines = LEGACY_TEMPLATE.split('\n');
    const subbedLines = rawLines.map(l => substituteLine(l, subs));

    // The "--More--" prompt is drawn one row below the last text row
    // and aligned to the menu's left column (no indent).  Per
    // questpgr.c:480 the menu auto-fits its widest line; --More-- is
    // narrower and just sits at the menu's left edge.
    const allLines = [...subbedLines, '--More--'];
    const leftCol = computeMenuLeftCol(allLines);

    const display = g.nhDisplay;
    if (!display) return;

    // Paint each line at its computed column.  Empty lines stay
    // empty.  Lines with leading 4-space indent shift right by 4
    // (handled naturally because line.length includes the 4 spaces
    // and we substring from index 0 — the indent gets stripped, then
    // re-applied via cursor offset by adding `leadingSpaces` to the
    // base col).
    const NO_COLOR = 8; // CHARGEN_NO_COLOR / NetHack NO_COLOR == default
    function paintLine(rowIdx, line) {
        if (!line) return;
        // Count leading spaces.
        let leading = 0;
        while (leading < line.length && line[leading] === ' ') leading++;
        const text = line.slice(leading);
        const col = leftCol + leading;
        for (let i = 0; i < text.length && col + i < 80; i++) {
            display.setCell(col + i, rowIdx, text[i], NO_COLOR, 0);
        }
    }

    // The menu overlay covers cols [leftCol, 80) of rows 0..N where
    // N is the --More-- row (= subbedLines.length).  Map content in
    // cols [0, leftCol) of those rows shows through, and rows below
    // N are untouched entirely.  Matches C's tty pager — one line at
    // a time at the menu's left col with implicit clear-to-eol after
    // each line, no clearing of rows the menu didn't visit.
    // Confirmed via:
    //   seed0013-friday13 step 0 — room at cols 5-11 rows 15-19 is
    //     visible alongside the legacy text at cols 23+ on rows 15-17,
    //     and the room continues unobscured on rows 18-19.
    //   seed0106-priest step 0 — room at cols 67-72 rows 6-12 is
    //     within the menu's clear range and gets wiped.
    //   seed0367-priest-debug step 0 — room at rows 18-19 is below
    //     the menu's last row (17) and remains visible.
    const lastMenuRow = subbedLines.length; // index of --More-- row
    for (let r = 0; r <= lastMenuRow; r++) {
        for (let c = leftCol; c < 80; c++) {
            display.setCell(c, r, ' ', NO_COLOR, 0);
        }
    }
    for (let r = 0; r < subbedLines.length; r++) {
        paintLine(r, subbedLines[r]);
    }
    paintLine(lastMenuRow, '--More--');

    // Capture the overlay (the _preNhgetchHook serializes the grid)
    // and consume the dismiss keystroke.  We do NOT call flush_screen
    // here — the caller already flushed before us, and flush_screen
    // would clear our just-painted overlay before nhgetch captures.
    // Caller passes one keystroke (typically space) to advance.
    await nhgetch();
}
