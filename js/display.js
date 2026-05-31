// display.js — Map rendering and terminal output.
// C ref: display.c — newsym, show_glyph, docrt, cls, flush_screen.

import { game } from './gstate.js';
import { cansee } from './vision.js';
import {
    COLNO, ROWNO, STONE, ROOM, CORR, DOOR, SDOOR, SCORR, STAIRS,
    HWALL, VWALL, TLCORNER, TRCORNER, BLCORNER, BRCORNER,
    CROSSWALL, TUWALL, TDWALL, TLWALL, TRWALL,
    TREE, POOL, MOAT, LAVAPOOL, LAVAWALL, IRONBARS,
    FOUNTAIN, THRONE, SINK, GRAVE, ALTAR, ICE,
    D_NODOOR, D_ISOPEN, D_CLOSED, D_LOCKED,
} from './const.js';
import { NO_COLOR, CLR_GRAY, CLR_BROWN, CLR_WHITE, CLR_YELLOW,
    CLR_GREEN, CLR_BLUE, CLR_CYAN, CLR_BRIGHT_BLUE,
    CLR_RED, CLR_ORANGE, DEC_TO_UNICODE } from './terminal.js';
import { def_monsyms, def_oc_syms } from './translated/drawing.js';
import { stairway_at, known_branch_stairs } from './translated/stairs.js';
import { In_mines, In_hell } from './translated/dungeon.js';
import { engr_at } from './translated/engrave.js';

// ── ANSI color codes ──
// Maps CLR_* constants (0-15) to ANSI SGR color codes.
// C ref: wintty.c term_start_color
const ANSI_DEFAULT = 39;
const ANSI_COLOR = [
    30,  // CLR_BLACK     0
    31,  // CLR_RED       1
    32,  // CLR_GREEN     2
    33,  // CLR_BROWN     3
    34,  // CLR_BLUE      4
    35,  // CLR_MAGENTA   5
    36,  // CLR_CYAN      6
    37,  // CLR_GRAY      7
    39,  // NO_COLOR      8 → default
    91,  // CLR_ORANGE    9
    92,  // CLR_BRIGHT_GREEN  10
    93,  // CLR_YELLOW    11
    94,  // CLR_BRIGHT_BLUE   12
    95,  // CLR_BRIGHT_MAGENTA 13
    96,  // CLR_BRIGHT_CYAN   14
    97,  // CLR_WHITE     15
];

// ── Terrain to display character + color + DEC flag ──
function terrain_glyph(loc, x, y) {
    const typ = loc.typ;
    switch (typ) {
    case STONE:     return { ch: ' ', color: NO_COLOR, dec: false };
    case ROOM:
        // C ref drawing.c default_showsyms[S_room]='.' (ASCII) vs
        // DECgraphics_init[S_room]='~' (DEC middle dot, rendered as '·').
        // Same as walls — switch on g.symset[0].handling (H_DEC=2).
        return (game.symset?.[0]?.handling === 2)
            ? { ch: '~', color: NO_COLOR, dec: true }
            : { ch: '.', color: NO_COLOR, dec: false };
    case CORR:      return { ch: '#', color: NO_COLOR, dec: false };
    case DOOR:
        // C ref dat/symbols S_vodoor / S_hodoor — under DECgraphics
        // both vertical and horizontal open doors render as
        // \xe1 = meta-a = 'a' (DEC checkerboard ▒) brown.  Default
        // symset uses ASCII '|' (vertical) / '-' (horizontal) brown.
        if (loc.doormask & D_ISOPEN) {
            if (game.symset?.[0]?.handling === 2) {
                return { ch: 'a', color: CLR_BROWN, dec: true };
            }
            return { ch: loc.horizontal ? '|' : '-', color: CLR_BROWN, dec: false };
        }
        if (loc.doormask & (D_CLOSED | D_LOCKED)) return { ch: '+', color: CLR_BROWN, dec: false };
        // D_NODOOR (empty doorway) renders as the floor symbol — '.' for the
        // default symset, '~' DEC middle-dot for DECgraphics (matches ROOM).
        return (game.symset?.[0]?.handling === 2)
            ? { ch: '~', color: NO_COLOR, dec: true }
            : { ch: '.', color: NO_COLOR, dec: false };
    // Undetected secret doors and corridors render as adjacent wall /
    // stone.  C ref display.c — back_to_glyph for SDOOR/SCORR returns
    // the surrounding-typ glyph.  loc.horizontal flags vertical vs
    // horizontal alignment for SDOOR (set by mklev when placing the
    // door); when unset, default to horizontal wall (matches C's
    // dchar(SDOOR) where horizontal flag = 0 hits the S_hwall branch).
    case SDOOR:
        return loc.horizontal
            ? { ch: 'q', color: NO_COLOR, dec: true }   // ─ horizontal wall
            : { ch: 'x', color: NO_COLOR, dec: true };  // │ vertical wall
    case SCORR:
        // Undetected secret corridor renders as stone (' ').
        return { ch: ' ', color: NO_COLOR, dec: false };
    case STAIRS:
        // C ref rm.h:216 `#define ladder flags` — direction is encoded
        // in the 5-bit `flags` bitfield: LA_UP (1) for upstair, LA_DOWN
        // (2) for downstair.  Hand-written mklev historically set
        // `loc.ladder` (a separate JS field) and recorded position in
        // `game.level.upstair`; translated mklev sets `loc.flags`
        // matching C.  Check both so the same renderer covers both
        // paths.  Position-fallback on game.level.upstair stays for the
        // legacy hand-written path that never set the bitfield.
        {
            // Branch stairs use CLR_YELLOW; regular stairs use CLR_GRAY which
            // collapses to NO_COLOR in the recorded terminal stream (because
            // wintty drops the redundant [37m).  C ref defsym.h:120-125 +
            // display.c known_branch_stairs branch in back_to_glyph.
            const sway = (typeof stairway_at === 'function') ? stairway_at(x, y) : null;
            const isBranch = (typeof known_branch_stairs === 'function')
                && known_branch_stairs(sway);
            const color = isBranch ? CLR_YELLOW : NO_COLOR;
            if ((loc.flags & 1) || (loc.ladder & 1)
                || (game.level?.upstair?.x === x && game.level?.upstair?.y === y))
                return { ch: '<', color, dec: false };
            return { ch: '>', color, dec: false };
        }
    // Wall types → DEC line-drawing characters.  Color depends on
    // dungeon branch: the recorder ships wallcolors[]={GRAY, BROWN,
    // RED, GRAY, BRIGHT_BLUE} indexed by main/mines/gehennom/knox/
    // sokoban (display.c:2677 — the commented-out alternative is what
    // the contest recordings use).  GRAY collapses to NO_COLOR via
    // the wintty drop-redundant-[37m rule.
    case HWALL: case VWALL: case TLCORNER: case TRCORNER:
    case BLCORNER: case BRCORNER: case CROSSWALL: case TUWALL:
    case TDWALL: case TLWALL: case TRWALL:
        {
            const wallColor = (typeof In_mines === 'function' && In_mines(game.u?.uz)) ? CLR_BROWN
                            : (typeof In_hell === 'function' && In_hell(game.u?.uz)) ? CLR_RED
                            : NO_COLOR;
            // C ref drawing.c default_showsyms vs DECgraphics_init.  When
            // .nethackrc sets symset:DECgraphics, walls are DEC line-
            // drawing chars wrapped in SO/SI escapes.  Otherwise the
            // default symset emits plain ASCII '-' / '|' / '+'.  jsmain.js
            // applies opts.symset to g.symset[0].handling; H_DEC=2.
            const decMode = (game.symset?.[0]?.handling === 2);
            if (decMode) {
                switch (typ) {
                case HWALL:     return { ch: 'q', color: wallColor, dec: true };  // ─
                case VWALL:     return { ch: 'x', color: wallColor, dec: true };  // │
                case TLCORNER:  return { ch: 'l', color: wallColor, dec: true };  // ┌
                case TRCORNER:  return { ch: 'k', color: wallColor, dec: true };  // ┐
                case BLCORNER:  return { ch: 'm', color: wallColor, dec: true };  // └
                case BRCORNER:  return { ch: 'j', color: wallColor, dec: true };  // ┘
                case CROSSWALL: return { ch: 'n', color: wallColor, dec: true };  // ┼
                case TUWALL:    return { ch: 'v', color: wallColor, dec: true };  // ┴
                case TDWALL:    return { ch: 'w', color: wallColor, dec: true };  // ┬
                case TLWALL:    return { ch: 'u', color: wallColor, dec: true };  // ┤
                case TRWALL:    return { ch: 't', color: wallColor, dec: true };  // ├
                }
            }
            // Default symset: ASCII walls.  Corners draw as '-' (drawing.c
            // default_showsyms[S_tlcorn..S_brcorn] = '-').  TUWALL/TDWALL
            // are horizontal joins ('-'); TLWALL/TRWALL are vertical joins
            // ('|'); CROSSWALL is '+'.
            switch (typ) {
            case HWALL:     return { ch: '-', color: wallColor, dec: false };
            case VWALL:     return { ch: '|', color: wallColor, dec: false };
            case TLCORNER:  return { ch: '-', color: wallColor, dec: false };
            case TRCORNER:  return { ch: '-', color: wallColor, dec: false };
            case BLCORNER:  return { ch: '-', color: wallColor, dec: false };
            case BRCORNER:  return { ch: '-', color: wallColor, dec: false };
            case CROSSWALL: return { ch: '+', color: wallColor, dec: false };
            case TUWALL:    return { ch: '-', color: wallColor, dec: false };
            case TDWALL:    return { ch: '-', color: wallColor, dec: false };
            case TLWALL:    return { ch: '|', color: wallColor, dec: false };
            case TRWALL:    return { ch: '|', color: wallColor, dec: false };
            }
        }
    // Furniture / liquid / special terrain — C ref defsym.h
    case TREE:      return { ch: '#', color: CLR_GREEN, dec: false };
    case IRONBARS:  return { ch: '#', color: CLR_CYAN, dec: false };
    case POOL:      return { ch: '}', color: CLR_BLUE, dec: false };
    case MOAT:      return { ch: '}', color: CLR_BLUE, dec: false };
    case LAVAPOOL:  return { ch: '}', color: CLR_RED, dec: false };
    case LAVAWALL:  return { ch: '}', color: CLR_ORANGE, dec: false };
    case FOUNTAIN:  return { ch: '{', color: CLR_BRIGHT_BLUE, dec: false };
    case SINK:      return { ch: '{', color: CLR_WHITE, dec: false };
    case THRONE:    return { ch: '\\', color: CLR_YELLOW, dec: false };
    case GRAVE:     return { ch: '|', color: CLR_WHITE, dec: false };
    case ALTAR:     return { ch: '_', color: CLR_GRAY, dec: false };
    case ICE:       return { ch: '.', color: CLR_CYAN, dec: false };
    default:        return { ch: '?', color: NO_COLOR, dec: false };
    // (No cases needed for WATER/AIR/CLOUD/LADDER/DRAWBRIDGE_*/DBWALL —
    // they're only reached in deep-dungeon levels (Plane of Air, Plane of
    // Water, Castle/Medusa) and no current session reaches them; adding
    // cases without verifying renders against canonical recording could
    // introduce silent diffs.  Defer until a session actually exercises
    // them.)
    }
}

// ── show_glyph_cell ──
export function show_glyph_cell(x, y, ch, color = NO_COLOR, decgfx = false, attr = 0) {
    const loc = game.level?.at(x, y);
    if (!loc) return;
    loc.disp_ch = ch;
    loc.disp_color = color;
    loc.disp_decgfx = !!decgfx;
    loc.disp_attr = attr | 0;
    loc.gnew = 1;
}

// ── newsym ──
export function newsym(x, y) {
    const loc = game.level?.at(x, y);
    if (!loc) return;

    if (game.u?.ux === x && game.u?.uy === y) {
        // Hero
        show_glyph_cell(x, y, '@', CLR_WHITE, false);
        const tg = terrain_glyph(loc, x, y);
        loc.remembered_glyph = { ch: tg.ch, color: tg.color, decgfx: tg.dec };
        return;
    }

    const tg = terrain_glyph(loc, x, y);
    // Object rendering: check game.level.objects[x][y].  Same
    // pattern as monsters; objects are placed by translated
    // fill_ordinary_room / mineralize / makelevel via place_object.
    // C display ordering: monster, then object, then trap, then
    // terrain — render the topmost present (so the monster check
    // below takes precedence over this object check when both
    // exist on the same cell).
    const obj = game.level?.objects?.[x]?.[y];
    // Monster rendering: check game.level.monsters[x][y].  Translated
    // makemon → place_monster populates this 2D map; without this
    // arm, the hand-written display path renders only terrain even
    // when a visible mon (pet, mklev-placed mon) is on the cell.
    // C ref display.c map_monster + mon_to_glyph picks the symbol
    // from objects/mon → def_monsyms[mlet].sym; we use mlevel.mlet
    // (the monster permonst data's mlet field) for the same lookup.
    const mon = game.level?.monsters?.[x]?.[y];
    if (mon && cansee(x, y)) {
        const mlet = mon.data?.mlet ?? 0;
        const sym = def_monsyms?.[mlet]?.sym ?? 63 /* '?' */;
        const ch = String.fromCharCode(sym);
        // Color: use mon.data.mcolor when set; CLR_GRAY (=7)
        // collapses to NO_COLOR (=8 / ANSI default 39) because C's
        // wintty drops the explicit `[37m` escape for the default
        // terminal grey, so screen-decode reads those cells as
        // fg=DEFAULT_COLOR.  Without this, every gray monster
        // (goblin, kobold, etc.) registers as a 1-cell colour
        // mismatch against C's recording.
        const rawMc = mon.data?.mcolor;
        const color = (rawMc == null || rawMc === 7) ? 8 /*NO_COLOR*/ : rawMc;
        show_glyph_cell(x, y, ch, color, false);
        if (game.level?.flags?.hero_memory) {
            // Don't remember the monster glyph itself — only the
            // terrain beneath it, matching C's remembered_glyph
            // semantics (mon moves, terrain stays).
            loc.remembered_glyph = { ch: tg.ch, color: tg.color, decgfx: tg.dec };
        }
        return;
    }
    if (obj && cansee(x, y)) {
        const oclass = obj.oclass ?? 0;
        // STATUE (otyp 476, oclass 14 = ROCK_CLASS) renders with the
        // represented monster's letter, not the generic ROCK class
        // char.  C ref display.c obj_to_glyph: STATUE maps to
        // GLYPH_STATUE_*_OFF + corpsenm and back_to_glyph renders the
        // monster's mlet symbol.  Without this a statue of a newt
        // shows as backtick (the rock-class default) instead of `:`
        // (the lizard-class symbol).  CORPSE still renders as `%`
        // (FOOD_CLASS) — only the colour comes from the monster.
        let sym;
        if (obj.otyp === 476 /* STATUE */) {
            const mlet = game.mons?.[obj.corpsenm]?.mlet ?? 0;
            sym = def_monsyms?.[mlet]?.sym ?? def_oc_syms?.[oclass]?.sym ?? 63;
        } else {
            sym = def_oc_syms?.[oclass]?.sym ?? 63 /* '?' */;
        }
        const ch = String.fromCharCode(sym);
        // Object colour: game.objects[otyp].oc_color when available;
        // fall back to GRAY.  C display.c map_object reads
        // objects[obj->otyp].oc_color.
        const ocl = game.objects?.[obj.otyp];
        // Corpses and statues color from the monster, not the object class.
        // C ref: display.c GLYPH_BODY_OFF/STATUE_*_OFF branches use mon_color
        // / obj_color(STATUE).  CLR_GRAY (=7) collapses to NO_COLOR (=8 /
        // ANSI default 39) because wintty drops the explicit [37m escape;
        // applying the same collapse here matches the recorded stream.
        //
        // Unidentified potions/gems/spellbooks still render in their
        // shuffled appearance color (oc_color holds the appearance color
        // post-shuffle, NOT CLR_GRAY).  The earlier isGeneric NO_COLOR
        // collapse was wrong: it forced cyan/blue/etc. potions back to
        // gray and broke seed0108's first-room potion render.
        let color;
        if (obj.otyp === 265 /* CORPSE */ || obj.otyp === 476 /* STATUE */) {
            const mc = game.mons?.[obj.corpsenm]?.mcolor;
            color = (mc == null || mc === 7) ? NO_COLOR : mc;
        } else {
            const raw = ocl?.oc_color;
            color = (raw == null || raw === 7) ? NO_COLOR : raw;
        }
        show_glyph_cell(x, y, ch, color, false);
        if (game.level?.flags?.hero_memory) {
            // Remember the object glyph (objects don't generally move
            // off their cell unattended; treat as part of the
            // remembered scene per C semantics).
            loc.remembered_glyph = { ch, color, decgfx: false };
        }
        return;
    }

    // Engraving: if cell is visible and floor/corr/ice and carries an
    // engraving, render the engraving glyph instead of bare terrain.
    // C ref display.c map_location: monster → object → trap → engraving →
    // terrain. defsym.h: S_engroom='`' CLR_BRIGHT_BLUE; S_engrcorr='#'
    // CLR_GRAY (collapses to NO_COLOR via wintty drop-redundant-[37m).
    if (cansee(x, y) && (loc.typ === ROOM || loc.typ === CORR || loc.typ === ICE)) {
        const ep = engr_at(x, y);
        if (ep) {
            const isCorr = loc.typ === CORR;
            const ech = isCorr ? '#' : '`';
            const ecolor = isCorr ? NO_COLOR : CLR_BRIGHT_BLUE;
            show_glyph_cell(x, y, ech, ecolor, false);
            if (game.level?.flags?.hero_memory) {
                loc.remembered_glyph = { ch: ech, color: ecolor, decgfx: false };
            }
            return;
        }
    }

    // Only update display/memory if cell is IN_SIGHT (lit and visible)
    if (cansee(x, y)) {
        show_glyph_cell(x, y, tg.ch, tg.color, tg.dec);
        if (game.level?.flags?.hero_memory) {
            loc.remembered_glyph = { ch: tg.ch, color: tg.color, decgfx: tg.dec };
        }
    } else if (loc.remembered_glyph) {
        // Out of sight but remembered — show remembered glyph
        show_glyph_cell(x, y, loc.remembered_glyph.ch,
            loc.remembered_glyph.color, loc.remembered_glyph.decgfx);
    }
}

// ── docrt ──
export async function docrt() {
    if (!game.level) return;
    for (let y = 0; y < ROWNO; y++)
        for (let x = 1; x < COLNO; x++) {
            const loc = game.level.at(x, y);
            // Call newsym() per-cell so the current state (monster /
            // hero / terrain) renders, not just the remembered
            // terrain.  Falling back to remembered_glyph for cells
            // newsym leaves untouched (out-of-sight, no memory).
            if (game.level.monsters?.[x]?.[y] || game.level.objects?.[x]?.[y] || (game.u?.ux === x && game.u?.uy === y) || cansee(x, y)) {
                newsym(x, y);
            } else if (loc?.remembered_glyph) {
                show_glyph_cell(x, y, loc.remembered_glyph.ch,
                    loc.remembered_glyph.color, loc.remembered_glyph.decgfx);
            }
        }
    if (game.u?.ux > 0) show_glyph_cell(game.u.ux, game.u.uy, '@', CLR_WHITE, false);
}

// ── Serialize a map row with DEC line-drawing and ANSI colors ──
function render_map_row(y) {
    if (!game.level) return '';
    let firstCol = -1, lastCol = -1;
    for (let x = 1; x < COLNO; x++) {
        const loc = game.level.at(x, y);
        if (loc?.disp_ch && loc.disp_ch !== ' ') {
            if (firstCol < 0) firstCol = x;
            lastCol = x;
        }
    }
    if (firstCol < 0) return '';

    let output = '';
    let activeColor = ANSI_DEFAULT;  // default
    let activeDec = false;

    // Leading gap
    const gap = firstCol - 1;
    if (gap > 4) output += `\x1b[${gap}C`;
    else if (gap > 0) output += ' '.repeat(gap);

    for (let x = firstCol; x <= lastCol; x++) {
        const loc = game.level.at(x, y);
        const ch = loc?.disp_ch ?? ' ';
        const color = loc?.disp_color ?? NO_COLOR;
        const dec = !!loc?.disp_decgfx;

        if (ch === ' ') {
            // Space runs
            let run = 1;
            while (x + run <= lastCol && (game.level.at(x + run, y)?.disp_ch ?? ' ') === ' ') run++;
            if (activeDec) { output += '\x0f'; activeDec = false; }
            if (run > 4) output += `\x1b[${run}C`;
            else output += ' '.repeat(run);
            x += run - 1;
            continue;
        }

        let wantAnsi = ANSI_COLOR[color] ?? ANSI_DEFAULT;
        if (wantAnsi !== activeColor) {
            output += `\x1b[${wantAnsi}m`;
            activeColor = wantAnsi;
        }

        // DEC mode switching
        if (dec && !activeDec) { output += '\x0e'; activeDec = true; }
        else if (!dec && activeDec) { output += '\x0f'; activeDec = false; }

        output += ch;
    }

    // Reset state at end of row (C does per-row SO/SI)
    if (activeColor !== ANSI_DEFAULT) output += `\x1b[${ANSI_DEFAULT}m`;
    if (activeDec) output += '\x0f';

    return output;
}

// ── Status lines ──
function _statusLine1() {
    const u = game.u;
    if (!u) return '';
    // C ref botl.c:989-990 — copy plname then `nb[0] = highc(nb[0])`.
    const raw = game.plname || 'Hero';
    const name = raw.length > 0 ? raw[0].toUpperCase() + raw.slice(1) : raw;
    // urole.rank is the per-level array; for level-1 hero use [0].
    const lvl0 = Math.max(0, (game.u?.ulevel ?? 1) - 1);
    const role = game.urole?.rank?.[lvl0]?.m || game.urole?.name?.m || 'Adventurer';
    const title = `${name} the ${role}`;
    // a[] uses C indices: A_STR=0, A_INT=1, A_WIS=2, A_DEX=3,
    // A_CON=4, A_CHA=5 (per nh-constants.js).  Display order is
    // St / Dx / Co / In / Wi / Ch (the conventional order).
    //
    // Strength has a special "18/XX" exceptional-strength format
    // (C ref botl.c:21 get_strength_str): values 19-117 display as
    // "18/01"–"18/99" (st-18 percentile), 118 is "18/**", and
    // 119+ display as (st-100) — i.e. st=119 → "19", st=120 → "20".
    // STR18(100) is the macro for 118.  Without this, JS shows
    // raw "St:20" where C shows "St:18/02", which is the same
    // internal value just formatted differently.
    const fmtStr = (st) => {
        if (st == null) return '?';
        if (st > 18) {
            if (st > 118) return String(st - 100);
            if (st < 118) return `18/${String(st - 18).padStart(2, '0')}`;
            return '18/**';
        }
        return String(st);
    };
    const stats = `St:${fmtStr(u.acurr?.a?.[0])} Dx:${u.acurr?.a?.[3] || '?'} Co:${u.acurr?.a?.[4] || '?'} In:${u.acurr?.a?.[1] || '?'} Wi:${u.acurr?.a?.[2] || '?'} Ch:${u.acurr?.a?.[5] || '?'}`;
    const align = u.ualign?.type === 0 ? 'Neutral' : u.ualign?.type > 0 ? 'Lawful' : 'Chaotic';
    // C uses cursor-forward for gap between title and stats
    // C pads to align stats starting at a fixed column
    const gap = Math.max(1, 31 - title.length);
    if (gap > 4) return `${title}\x1b[${gap}C${stats} ${align}`;
    return `${title}${' '.repeat(gap)}${stats} ${align}`;
}

function _statusLine2() {
    const u = game.u;
    if (!u) return '';
    // C ref botl.c:148-162: Xp shows "/uexp" only when flags.showexp
    // is set, and " T:moves" is appended only when flags.time is set.
    // Hardcoded "Xp:1/0 T:1" everywhere was a pre-Phase-F skeleton
    // shortcut that worked for seed8000 (which sets both) but
    // produced extra digits for every session that doesn't (most).
    const xp = game.flags?.showexp
        ? `Xp:${u.ulevel || 1}/${u.uexp || 0}`
        : `Xp:${u.ulevel || 1}`;
    const t = game.flags?.time ? ` T:${game.moves || 1}` : '';
    // C ref allmain.c:832 — bot() at the legacy-splash window captures
    // uac=0 because it fires BEFORE u_init_skills_discoveries calls
    // find_ac.  Allmain sets `_chargen_force_ac_zero = true` while the
    // legacy splash dmore loop is active so JS shows AC:0 to match.
    const acDisplay = game._chargen_force_ac_zero === true ? 0 : (u.uac ?? 10);
    return `Dlvl:${u.uz?.dlevel || 1} $:${game._goldCount || 0} HP:${u.uhp || 0}(${u.uhpmax || 0}) Pw:${u.uen || 0}(${u.uenmax || 0}) AC:${acDisplay} ${xp}${t}`;
}

// ── Serialize terminal grid for screen comparison ──
export function serialize_terminal_grid(display) {
    let output = '';
    let lastRow = 0;
    for (let r = 0; r < display.rows; r++) {
        for (let c = 0; c < display.cols; c++) {
            if (display.grid[r][c].ch !== ' ') { lastRow = r; break; }
        }
    }
    for (let r = 0; r <= lastRow; r++) {
        let lastCol = -1;
        for (let c = display.cols - 1; c >= 0; c--) {
            if (display.grid[r][c].ch !== ' ') { lastCol = c; break; }
        }
        if (lastCol < 0) { if (r < lastRow) output += '\n'; continue; }
        let firstCol = 0;
        for (let c = 0; c <= lastCol; c++) {
            if (display.grid[r][c].ch !== ' ') { firstCol = c; break; }
        }
        if (firstCol > 4) output += `\x1b[${firstCol}C`;
        else if (firstCol > 0) output += ' '.repeat(firstCol);
        for (let c = firstCol; c <= lastCol; c++) output += display.grid[r][c].ch;
        if (r < lastRow) output += '\n';
    }
    return output;
}

// Mirror tty.c's dmore() cursor-leave behavior for a menu/text
// overlay.  Each producer (buildAttributesPages, renderTranslated-
// TextWindow, buildInventoryFromState) already embeds the morestr
// "(N of M)" / "--More--" / "(end)" as the LAST row of pages[page]
// — those cells already match C's recorded screen.  The cursor
// position is wherever tty.c's xputs(prompt) would have left it:
//
//   NHW_TEXT  → curx = offx + strlen(morestr)
//   NHW_MENU  → curx = offx + 1 + strlen(morestr)
//
// The +1 for NHW_MENU comes from dmore's `offset=2` (vs 1 for text)
// — tty_curs(BASE_WINDOW, curx+2, cury) leaves ttyDisplay->curx at
// offx+1 before xputs runs.  See wintty.c:1153 (dmore) and
// wintty.c:1546 (process_menu_window dmore call site).
//
// The morestr defaults match C exactly:
//   NHW_TEXT single page : "--More--"     (defmorestr, wintty.c:181)
//   NHW_MENU single page : "(end) "       (wintty.c:2748)
//   any multi-page       : "(N of M)"     (wintty.c:1537)
//
// cury is always the last row of the page (where the morestr is
// embedded as cell content).
function computeOverlayCursor(menu, _termRows) {
    const page = menu.pages[menu.page] || [];
    const numPages = menu.pages.length;
    const isMulti = numPages > 1;
    const offx = menu.offx || 0;
    let morestrLen;
    if (isMulti) {
        morestrLen = `(${menu.page + 1} of ${numPages})`.length;
    } else if (menu.cType === 'NHW_TEXT') {
        morestrLen = '--More--'.length;
    } else {
        // NHW_MENU single-page: morestr is "(end)".  Cursor parks just
        // past the closing ')' for right-corner menus (kind 'menu'),
        // one column further (past a trailing space) for full-screen
        // menus (kind 'text', PAD=1).
        morestrLen = (menu.kind === 'menu') ? '(end)'.length : '(end) '.length;
    }
    const dmoreOffset = (menu.cType === 'NHW_TEXT') ? 0 : 1;
    const curx = offx + dmoreOffset + morestrLen;
    const cury = Math.max(0, page.length - 1);
    return [curx, cury];
}

// ── Build screen output ──
function _buildScreenOutput() {
    const display = game?.nhDisplay;
    if (!display) return;

    let output = '';
    // Row 0: message
    output += (game._pending_message || '') + '\n';

    // Rows 1-21: map (rendered with DEC + ANSI, per-row SO/SI)
    for (let y = 0; y < ROWNO; y++) {
        output += render_map_row(y) + '\n';
    }

    // Row 22-23: status
    output += _statusLine1() + '\n';
    output += _statusLine2();

    game._screen_output = output;

    // Also write to grid for serialize_terminal_grid
    if (display.grid) {
        display.clearScreen();

        // Full-screen text overlay (^X attributes, '\\' discoveries,
        // 'i' inventory, etc).  When game._menu_overlay is set,
        // render the current page's lines as a multi-row overlay
        // covering the map and status.  Mirrors NetHack's NHW_TEXT
        // and NHW_MENU windows.
        // Guard against auto-Proxy ghost: `game._menu_overlay` is
        // always a truthy `{}` even when unset (per gstate.js's
        // Proxy semantics), so the truthiness alone isn't enough.
        // We require a real `pages` array.
        const menu = game._menu_overlay;
        if (Array.isArray(menu?.pages) && menu.pages[menu.page]) {
            const lines = menu.pages[menu.page];
            // For 'menu' kind (right-corner inventory etc.) C's
            // wintty.c only writes the menu within its window — cells
            // OUTSIDE the menu's row range stay as whatever the main
            // map showed before.  Render the map and status FIRST so
            // those out-of-menu rows show through; then write the
            // menu lines on top.  'text' kind (full-screen) skips the
            // underlying map.
            if (menu.kind === 'menu') {
                // bgPreserve flag: render map UNDER all menu rows so
                // the gutter cols (where menu text has spaces) show
                // the map.  Default behavior (no flag) skips menu
                // rows — inventory menus rely on this to hide the
                // map behind their padded text.  Set bgPreserve on
                // overlays where C captured map cells visible behind
                // the menu (e.g. #name menu).
                const __bgPreserve = !!menu.bgPreserve;
                for (let y = 0; y < ROWNO; y++) {
                    // Skip rows that the menu overwrites — let the
                    // menu's setCell fill cols 0..menu_width below.
                    if (!__bgPreserve && (y + 1) < lines.length) continue;
                    for (let x = 1; x < COLNO; x++) {
                        const loc = game.level?.at(x, y);
                        if (!loc?.disp_ch || loc.disp_ch === ' ') continue;
                        const ch = loc.disp_decgfx ? (DEC_TO_UNICODE[loc.disp_ch] || loc.disp_ch) : loc.disp_ch;
                        display.setCell(x - 1, y + 1, ch, loc.disp_color ?? NO_COLOR, loc.disp_attr ?? 0);
                    }
                }
                const s1 = _statusLine1().replace(/\x1b\[[0-9;]*[A-Za-z]/g, m =>
                    m.match(/\x1b\[\d+C/) ? ' '.repeat(parseInt(m.slice(2))) : '');
                for (let c = 0; c < Math.min(s1.length, display.cols); c++)
                    display.setCell(c, 22, s1[c], NO_COLOR, 0);
                const s2 = _statusLine2();
                for (let c = 0; c < Math.min(s2.length, display.cols); c++)
                    display.setCell(c, 23, s2[c], NO_COLOR, 0);
            }
            // Each line can be either a plain string (attr=0) or an
            // object {text, attr} for bold class headers etc.  ATR_BOLD=1
            // matches NetHack's term_attr enumeration in C.
            //
            // For bgPreserve menus, skip writing spaces so the
            // underlying map (rendered above) shows through the
            // menu's left-gutter cols.  C wintty.c only writes
            // within the menu's bounding box.
            // bgPreserve menu: skip leading PAD spaces so the
            // underlying map shows through.  Write one space
            // immediately before the content (C wintty.c menu has
            // a 1-col left gutter that the menu owns) and then the
            // full content including its internal spaces.
            const __menuPreserveBg = (menu.kind === 'menu' && !!menu.bgPreserve);
            for (let r = 0; r < lines.length && r < display.rows; r++) {
                const entry = lines[r];
                const text = (typeof entry === 'string') ? entry : (entry?.text ?? '');
                const attr = (typeof entry === 'string') ? 0 : (entry?.attr ?? 0);
                let __cStart = 0;
                if (__menuPreserveBg) {
                    while (__cStart < text.length && text[__cStart] === ' ') __cStart++;
                    if (__cStart === text.length) continue;  // empty line — leave map visible
                    __cStart = Math.max(0, __cStart - 1);    // include 1-col gutter
                }
                for (let c = __cStart; c < Math.min(text.length, display.cols); c++) {
                    display.setCell(c, r, text[c], NO_COLOR, attr);
                }
            }
            // Position cursor to match tty.c's dmore() leave-state.
            // The morestr (last visible row of the page content) is
            // already drawn as cells above; this places the visible
            // cursor at the column the C tty engine would leave it.
            const [cx, cy] = computeOverlayCursor(menu, display.rows);
            display.setCursor(cx, cy);
            return;
        }

        // Message line
        const msg = game._pending_message || '';
        for (let c = 0; c < Math.min(msg.length, display.cols); c++)
            display.setCell(c, 0, msg[c], NO_COLOR, 0);
        // Map — write characters to grid (DEC → Unicode for browser display)
        for (let y = 0; y < ROWNO; y++) {
            for (let x = 1; x < COLNO; x++) {
                const loc = game.level?.at(x, y);
                if (!loc?.disp_ch || loc.disp_ch === ' ') continue;
                let ch = loc.disp_ch;
                let color = loc.disp_color ?? NO_COLOR;
                let decgfx = loc.disp_decgfx;
                // Door auto-open via translated lock.js doopen_indir
                // updates loc.doormask (game-data) but the translated
                // newsym → show_glyph path doesn't refresh the hand-
                // written display's loc.disp_ch cache.  When the
                // cached disp_ch is still a closed-door symbol but
                // doormask is now D_ISOPEN, recompute the glyph from
                // current door state.  Guarded by disp_ch being a
                // door symbol so monsters/objects on doors keep
                // taking precedence.  seed0077 step 17 'j' bumps the
                // closed door south of hero (36, 8), auto-open
                // succeeds, doormask → D_ISOPEN, but disp_ch stayed
                // at the closed '+' until this recompute.
                if (loc.typ === DOOR
                    && (ch === '+' || ch === '|' || ch === '-'
                        || (decgfx && ch === 'a'))) {
                    const tg = terrain_glyph(loc, x, y);
                    ch = tg.ch;
                    color = tg.color;
                    decgfx = tg.dec;
                }
                const renderCh = decgfx ? (DEC_TO_UNICODE[ch] || ch) : ch;
                display.setCell(x - 1, y + 1, renderCh, color, loc.disp_attr ?? 0);
            }
        }
        // Status lines
        const s1 = _statusLine1().replace(/\x1b\[[0-9;]*[A-Za-z]/g, m =>
            m.match(/\x1b\[\d+C/) ? ' '.repeat(parseInt(m.slice(2))) : '');
        for (let c = 0; c < Math.min(s1.length, display.cols); c++)
            display.setCell(c, 22, s1[c], NO_COLOR, 0);
        const s2 = _statusLine2();
        for (let c = 0; c < Math.min(s2.length, display.cols); c++)
            display.setCell(c, 23, s2[c], NO_COLOR, 0);
        // Cursor: input prompts (extcmd, getlin) leave cursor at end of
        // message line on row 0; otherwise tty positions cursor at hero.
        // Guard against gstate.js auto-Proxy ghost: an unset field reads
        // as truthy {} so we require a real numeric .x to honor the
        // override.
        const co = game._cursor_override;
        if (co && typeof co.x === 'number' && typeof co.y === 'number') {
            display.setCursor(co.x | 0, co.y | 0);
        } else if (msg.endsWith('--More--')) {
            // C tty more() leaves the cursor at the END of the
            // "--More--" suffix on row 0 — wintty.c topl.c more()
            // positions via tty_curs after putsyms(defmorestr).  The
            // hero-position fallback below mis-places the cursor in
            // the dungeon for multi-message --More-- captures.
            // Mirror C by placing cursor at column = msg.length on
            // row 0.  Verified against seed1800 steps 5/6/25.
            // Added 2026-05-31 alongside the objnam.js xname strncat
            // fix that unblocked the multi-pline visibility.
            display.setCursor(msg.length, 0);
        } else if (game.u?.ux > 0) {
            display.setCursor(game.u.ux - 1, game.u.uy + 1);
        }
    }
}

// ── flush_screen ──
export async function flush_screen(mode) {
    _buildScreenOutput();
}

// ── cls ──
export async function cls() {
    const display = game?.nhDisplay;
    if (display?.clearScreen) display.clearScreen();
    game._pending_message = '';
}

// ── bot ──
export async function bot() {
    // Status line updates happen in _buildScreenOutput
}

// Re-write the status rows (22-23) of the terminal grid using the
// current _statusLine1/2 output.  Used by allmain.js to refresh the
// status display after toggling the AC:0 chargen flag, without
// touching the rest of the grid (which is mid-overlay during the
// legacy splash render).
export function rebuild_status_rows() {
    const display = game?.nhDisplay;
    if (!display?.setCell) return;
    // Clear both rows first so a previously-longer status row doesn't
    // leave trailing chars (e.g. "Xp:1/0" from a Proxy-truthy showexp
    // would leave the "/0" suffix when overwritten by a shorter "Xp:1").
    for (let c = 0; c < display.cols; c++) display.setCell(c, 22, ' ', NO_COLOR, 0);
    for (let c = 0; c < display.cols; c++) display.setCell(c, 23, ' ', NO_COLOR, 0);
    const s1 = _statusLine1().replace(/\x1b\[[0-9;]*[A-Za-z]/g, m =>
        m.match(/\x1b\[\d+C/) ? ' '.repeat(parseInt(m.slice(2))) : '');
    for (let c = 0; c < Math.min(s1.length, display.cols); c++)
        display.setCell(c, 22, s1[c], NO_COLOR, 0);
    const s2 = _statusLine2();
    for (let c = 0; c < Math.min(s2.length, display.cols); c++)
        display.setCell(c, 23, s2[c], NO_COLOR, 0);
}

// ── pline ──
// C tty topl semantics: consecutive plines within one "input boundary"
// (no readchar between them) concatenate with two-space separator on
// the same topl line until they would overflow CO-8 columns, at which
// point the existing topl gets a --More-- suffix and subsequent
// messages queue up to be shown after each dismiss.  The
// _topl_seen flag is set by nhgetch after each capture+read so the
// next pline starts a fresh topl rather than appending to a stale one.
//
// The dmore queue is drained by input.js nhgetch — see that file for
// the dismiss loop.
const _TOPL_FIT = 72;  // CO (80) minus reserve for "--More--"
export async function pline(msg) {
    if (msg == null || msg === '') {
        game._pending_message = msg || '';
        return;
    }
    // If a dmore dismiss is already pending, append into the queue
    // (so the next dismiss reveals this message, possibly concat'd).
    const q = game._dmore_queue;
    if (q && q.length > 0) {
        const last = q[q.length - 1];
        const combined = last + '  ' + msg;
        if (combined.length <= _TOPL_FIT) {
            q[q.length - 1] = combined;
        } else {
            q.push(msg);
        }
        return;
    }
    if (game._topl_seen) {
        game._pending_message = msg;
        game._topl_seen = false;
        return;
    }
    const cur = game._pending_message || '';
    if (!cur) {
        game._pending_message = msg;
        return;
    }
    const combined = cur + '  ' + msg;
    if (combined.length <= _TOPL_FIT) {
        game._pending_message = combined;
        return;
    }
    // Overflow: dmore the existing topl, queue the new msg for after dismiss.
    game._pending_message = cur + '--More--';
    game._dmore_queue = [msg];
}
