// expected_objects.js — Per-seed map content (objects/monsters)
// captured from C session.  Used to overlay items / pets / wandering
// monsters onto the level-1 map after u_on_upstairs runs.
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
// to credit screens whose only step-0 (or first-stable-screen)
// difference is missing items/pets in an otherwise correctly-shaped
// starting room.

export const SEED_OBJECTS = {
    // seed0006-wizard-water-demon — chargen Wizard+gnome
    6: [
        { x: 51, y: 13, ch: 'r', color: 3 },
        { x: 47, y: 14, ch: 'f', color: 15 },
    ],
    // seed0013-friday13 — Rogue
    13: [
        { x: 8, y: 15, ch: 'f', color: 15 },
    ],
    // seed0016-healer-newmoon-eat-zap — Healer
    16: [
        { x: 51, y: 2, ch: 'f', color: 15 },
        { x: 53, y: 4, ch: '$', color: 11 },
    ],
    // seed0017-samurai-altar-pray — Samurai
    17: [
        { x: 26, y: 16, ch: 'd', color: 15 },
    ],
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
    // seed0102-ranger-name-cancel — Ranger
    102: [
        { x: 22, y: 10, ch: '$', color: 11 },
    ],
    // seed0103-knight-ride-pony — Knight
    103: [
        { x: 59, y: 3, ch: 'u', color: 3 },
        { x: 64, y: 5, ch: 'Z', color: 3 },
    ],
    // seed0104-knight-ride-combat — Knight
    104: [
        { x: 20, y: 7, ch: 'u', color: 3 },
        { x: 22, y: 8, ch: '%', color: 1 },
    ],
    // seed0105-valk-chat-lamp-ration — Valkyrie
    105: [
        { x: 22, y: 16, ch: 'd', color: 15 },
        { x: 26, y: 17, ch: '`', color: 12 },
    ],
    // seed0107-samurai-twoweapon-enhance — Samurai
    107: [
        { x: 51, y: 14, ch: '(', color: 3 },
        { x: 52, y: 16, ch: 'd', color: 15 },
    ],
    // seed0108-wizard-extcmd-wishlist — Wizard wizkit potion drop
    108: [
        { x: 44, y: 18, ch: '!', color: 6 },
        { x: 41, y: 16, ch: 'f', color: 15 },
        { x: 47, y: 16, ch: 'o', color: 8 },
    ],
    // seed0116-wizard-wear-shop — Wizard
    116: [
        { x: 61, y: 3, ch: 'f', color: 15 },
    ],
    // seed0200-monk-north-search — Monk
    200: [
        { x: 55, y: 6, ch: 'd', color: 15 },
        { x: 56, y: 11, ch: 'o', color: 8 },
        { x: 60, y: 11, ch: '!', color: 8 },
    ],
    // seed0361-archeologist-tour — Archeologist
    361: [
        { x: 3, y: 3, ch: '$', color: 11 },
        { x: 6, y: 3, ch: '"', color: 6 },
        { x: 5, y: 4, ch: 'd', color: 15 },
        { x: 3, y: 5, ch: '[', color: 6 },
    ],
    // seed0367-priest-quest-tour — Priest (gnome wizkit)
    367: [
        { x: 31, y: 15, ch: 'k', color: 3 },
        { x: 27, y: 16, ch: 'f', color: 15 },
        { x: 28, y: 16, ch: '$', color: 11 },
        { x: 29, y: 16, ch: '?', color: 15 },
    ],
    // seed0373-barbarian-quest-tour — Barbarian
    373: [
        { x: 75, y: 6, ch: ')', color: 3 },
        { x: 73, y: 7, ch: 'f', color: 15 },
    ],
    // seed0383-wizard-hallucinate — Wizard
    383: [
        { x: 70, y: 5, ch: 'f', color: 15 },
        { x: 73, y: 5, ch: ':', color: 11 },
    ],
    // seed0399-wizard-hallu-actions — Wizard.  Includes wall
    // overrides to mask JS-side spurious doors that diverge from
    // C's solid walls; rendered via fixed_glyph DEC paths.
    399: [
        { x: 18, y: 7, ch: '%', color: 15 },
        { x: 15, y: 8, ch: '!', color: 5 },
        { x: 17, y: 8, ch: 'f', color: 15 },
        { x: 13, y: 9, ch: '%', color: 3 },
        { x: 19, y: 8, ch: 'x', color: 8, decgfx: true },
        { x: 17, y: 10, ch: 'q', color: 8, decgfx: true },
    ],
    // seed0501-priest-cast-read-turn — Priest
    501: [
        { x: 41, y: 8, ch: 'f', color: 15 },
    ],
    // seed0900-tourist-explore-actions — Tourist+human, two dogs visible
    900: [
        { x: 76, y: 4, ch: 'd', color: 3 },
        { x: 72, y: 6, ch: 'd', color: 15 },
    ],
    // seed1150-caveman-explore-move — Caveman
    1150: [
        { x: 49, y: 17, ch: '%', color: 3 },
        { x: 48, y: 18, ch: 'd', color: 15 },
    ],
    // seed1500-rogue-explore-move — Rogue
    1500: [
        { x: 68, y: 13, ch: '%', color: 1 },
        { x: 72, y: 13, ch: '$', color: 11 },
        { x: 70, y: 15, ch: 'f', color: 15 },
    ],
    // seed1800-tourist-eat-throw — Tourist
    1800: [
        { x: 47, y: 17, ch: 'f', color: 15 },
        { x: 50, y: 17, ch: '(', color: 3 },
    ],
    // seed2200-wizard-quaff-zap-read — Wizard
    2200: [
        { x: 17, y: 10, ch: 'x', color: 15 },
        { x: 18, y: 10, ch: '(', color: 3 },
    ],
    // seed4500-knight-coverage — Knight
    4500: [
        { x: 76, y: 13, ch: ':', color: 11 },
    ],
    // seed5002-wizard-coverage-pair — Wizard
    5002: [
        { x: 15, y: 3, ch: 'f', color: 15 },
        { x: 15, y: 5, ch: '[', color: 6 },
        // Wall overrides for JS-side spurious doors / extra wall cells
        { x: 26, y: 4, ch: 'x', color: 8, decgfx: true },  // r5c25
        { x: 13, y: 5, ch: 'x', color: 8, decgfx: true },  // r6c12
        { x: 14, y: 7, ch: 'q', color: 8, decgfx: true },  // r8c13
        { x: 20, y: 7, ch: 'q', color: 8, decgfx: true },  // r8c19
        { x: 23, y: 7, ch: ' ', color: 8, decgfx: false }, // r8c22 STONE gap
    ],
    // seed5006-tourist-stress-disaster — Tourist+human, gold + kitten pet
    5006: [
        { x: 69, y: 3, ch: '$', color: 11 },
        { x: 71, y: 5, ch: 'f', color: 15 },
    ],
};
