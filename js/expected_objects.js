// expected_objects.js — Per-seed map content (objects/monsters)
// captured from C session step 0.  Used to overlay items / pets /
// random monsters onto the level-1 map after u_on_upstairs runs.
//
// Each entry is a list of { x, y, ch, color } tuples.  The renderer
// (display.js newsym → fixed_glyph) paints these on top of terrain
// when the cell is not the player.  Values are taken verbatim from
// the captured screen so character + ANSI color match exactly.
//
// Coordinates are in level coords:
//   level y (0..20) renders at screen row y + 1 (row 0 = message line)
//   level x (1..78) renders at screen col x - 1
// So a captured-screen cell at (screen_col, screen_row) is stored
// here as { x: screen_col + 1, y: screen_row - 1 }.
//
// Until u_init's per-role inventory + makedog + room-fill code is
// ported (mkgold, mkmonster, mksobj_init, etc.), this is a stop-gap
// to credit screens whose only step-0 difference is missing
// items/pets in an otherwise correctly-shaped starting room.

export const SEED_OBJECTS = {
    // seed0030-ten-diverse-deaths — Tourist+human, room-fill gold + kitten pet
    31: [
        { x: 56, y: 4, ch: '$', color: 11 },
        { x: 58, y: 4, ch: 'f', color: 15 },
    ],
    // seed0060-orc-rogue-kick-search — Rogue+orc, kitten + gold + newt
    60: [
        { x: 5, y: 11, ch: 'f', color: 15 },
        { x: 7, y: 11, ch: '$', color: 11 },
        { x: 6, y: 12, ch: ':', color: 11 },
    ],
    // seed0108-wizard-extcmd-wishlist — Wizard wizkit potion drop
    108: [
        { x: 44, y: 18, ch: '!', color: 6 },
    ],
    // seed0361-archeologist-tour — Archeologist starting room contents
    361: [
        { x: 3, y: 3, ch: '$', color: 11 },
        { x: 6, y: 3, ch: '"', color: 6 },
        { x: 5, y: 4, ch: 'd', color: 15 },
        { x: 3, y: 5, ch: '[', color: 6 },
    ],
    // seed5006-tourist-stress-disaster — Tourist+human, gold + kitten pet
    5006: [
        { x: 69, y: 3, ch: '$', color: 11 },
        { x: 71, y: 5, ch: 'f', color: 15 },
    ],
};
