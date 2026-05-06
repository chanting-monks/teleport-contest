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
function buildSubstitutions(roleName, alignType, female) {
    const role = roles.find(r => r.name.m === roleName ||
                                  (r.name.f && r.name.f === roleName));
    if (!role) return null;
    if (!role.gods) return null; // Priest — random pantheon, not yet wired.

    // gods[] is [lawful, neutral, chaotic]; map align value 1/0/-1
    // to index 0/1/2.
    const alignIdx = alignType === 1 ? 0 : alignType === 0 ? 1 : 2;
    const rawGod = role.gods[alignIdx];
    const god = stripUnderscore(rawGod);
    const title = (rawGod && rawGod[0] === '_') ? 'goddess' : 'god';

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

    const subs = buildSubstitutions(role, alignType, female);
    if (!subs) return; // unknown role or Priest with random pantheon — skip.

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

    // Lines occupy rows 0..N (where N = subbedLines.length - 1),
    // then --More-- at row N+1.  Total rows used = subbedLines.length + 1.
    // First clear all rows the menu occupies — C's pager covers the
    // map underneath, so rows that are empty in the template (e.g. the
    // paragraph-separator rows 1, 8, 11) display as blank rather than
    // letting the map show through.  Rows after --More-- are not
    // touched (status line, partial map below).
    const lastMenuRow = subbedLines.length; // index of --More-- row
    for (let r = 0; r <= lastMenuRow; r++) {
        for (let c = 0; c < 80; c++) {
            display.setCell(c, r, ' ', NO_COLOR, 0);
        }
    }
    for (let r = 0; r < subbedLines.length; r++) {
        paintLine(r, subbedLines[r]);
    }
    paintLine(subbedLines.length, '--More--');

    // Capture the overlay (the _preNhgetchHook serializes the grid)
    // and consume the dismiss keystroke.  We do NOT call flush_screen
    // here — the caller already flushed before us, and flush_screen
    // would clear our just-painted overlay before nhgetch captures.
    // Caller passes one keystroke (typically space) to advance.
    await nhgetch();
}
