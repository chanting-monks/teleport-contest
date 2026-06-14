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
import { def_monsyms, def_oc_syms, defsyms } from './translated/drawing.js';
import { S_arrow_trap, GLYPH_UNEXPLORED_OFF, GLYPH_OBJ_OFF, GLYPH_BODY_OFF } from './translated/nh-constants.js';
import { stairway_at, known_branch_stairs } from './translated/stairs.js';
import { In_mines, In_hell } from './translated/dungeon.js';
import { engr_at } from './translated/engrave.js';
import { near_capacity } from './translated/hack.js';
// Property indices for u.uprops[] — used by the bot-status condition
// indicators (Stoned, Slimed, Blind, Hallu, etc.) per C botl.c:172-205.
// Names match the C macros (#define STONED 18 etc. in youprop.h).
import {
    STUNNED, CONFUSION, BLINDED, DEAF, STONED, STRANGLED,
    SLIMED, HALLUC, HALLUC_RES, LEVITATION, FLYING,
} from './translated/nh-constants.js';

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
    case CORR:
        // C display.c map_background: CORR → (waslit ||
        // flags.lit_corridor) ? S_litcorr : S_corr; the recorded tty
        // stream paints litcorr bright white ([97m → color 15) and
        // plain corr as default.  C REVERTS litcorr→corr when an
        // unlit corridor leaves sight (display.c:852/898), so the
        // white form only shows for currently-seen (or permanently
        // lit, waslit) cells.  seed1150 runs with lit_corridor set:
        // the cell beside the hero was '#'(15) in C, '#'(default) in
        // JS — a one-cell attr diff trailing the hero down every
        // corridor.
        return ((game.flags?.lit_corridor && cansee(x, y)) || loc.waslit)
            ? { ch: '#', color: CLR_WHITE, dec: false }
            : { ch: '#', color: NO_COLOR, dec: false };
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
            // Sokoban walls: the recorder emits \x1b[34m (CLR_BLUE)
            // for every soko wall cell (C display.c wallcolors[
            // sokoban_walls] via the GLYPH_CMAP_SOKO branch; verified
            // against seed2600 step-25's raw bytes).
            const __inSoko = game.u?.uz?.dnum != null
                && game.u.uz.dnum === (game.dungeon_topology?.d_sokoban_dnum ?? -2);
            const wallColor = __inSoko ? CLR_BLUE
                            : (typeof In_mines === 'function' && In_mines(game.u?.uz)) ? CLR_BROWN
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
    // C ref dat/symbols DECgraphics block: S_pool / S_lava /
    // S_lavawall / S_water all map to \xe0 = DEC '`' (diamond ◆)
    // when the DECgraphics symset is active (seed2600's lava lake
    // recorded as '`' decgfx=1 color=red; JS's ASCII '}' was a
    // ~190-cell diff on every lava-level frame).  ASCII symset keeps
    // the 3.7 default '}'.
    case POOL:      return (game.symset?.[0]?.handling === 2)
        ? { ch: '`', color: CLR_BLUE, dec: true }
        : { ch: '}', color: CLR_BLUE, dec: false };
    case MOAT:      return (game.symset?.[0]?.handling === 2)
        ? { ch: '`', color: CLR_BLUE, dec: true }
        : { ch: '}', color: CLR_BLUE, dec: false };
    case LAVAPOOL:  return (game.symset?.[0]?.handling === 2)
        ? { ch: '`', color: CLR_RED, dec: true }
        : { ch: '}', color: CLR_RED, dec: false };
    case LAVAWALL:  return (game.symset?.[0]?.handling === 2)
        ? { ch: '`', color: CLR_ORANGE, dec: true }
        : { ch: '}', color: CLR_ORANGE, dec: false };
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
// C-side remembered scene for cells the HAND display never painted
// (§23.248): premapped special levels (sokoban's "premapped" level
// flag → premap_detect) and magic mapping write the C memory fields
// (seenv/waslit + lev->glyph via translated map_background) DURING
// mklev, when show_glyph no-ops — so the hand remembered_glyph never
// hears about them.  When a never-hand-painted cell has C-side seenv,
// derive what C's docrt would draw from premap content: boulder >
// seen trap > terrain.
function cside_remembered_glyph(loc, x, y) {
    const obj = game.level?.objects?.[x]?.[y];
    if (obj && obj.otyp === 475 /* BOULDER */) {
        const sym = def_oc_syms?.[obj.oclass ?? 0]?.sym ?? 96;
        const raw = game.objects?.[obj.otyp]?.oc_color;
        return { ch: String.fromCharCode(sym),
                 color: (raw == null || raw === 7) ? NO_COLOR : raw,
                 dec: false };
    }
    for (let t = game.ftrap; t; t = t.ntrap) {
        if (t.tx === x && t.ty === y && t.tseen) {
            const e = defsyms?.[S_arrow_trap + (t.ttyp | 0) - 1];
            if (e) {
                return { ch: String.fromCharCode(e.sym),
                         color: (e.color === 7) ? NO_COLOR : e.color,
                         dec: false };
            }
        }
    }
    return terrain_glyph(loc, x, y);
}

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
    if (mon && cansee(x, y) && (mon.m_ap_type & 7) === 2 /* M_AP_OBJECT */) {
        // Mimic disguised as an object (C display.c map_monster →
        // sensed/undetected mimics show their mappearance).  soko1's
        // boulder-mimic rendered 'm' magenta where C shows '`'.
        const otyp = mon.mappearance | 0;
        const oclass = game.objects?.[otyp]?.oc_class ?? 0;
        const sym = def_oc_syms?.[oclass]?.sym ?? 96;
        const raw = game.objects?.[otyp]?.oc_color;
        show_glyph_cell(x, y, String.fromCharCode(sym),
            (raw == null || raw === 7) ? NO_COLOR : raw, false);
        if (game.level?.flags?.hero_memory) {
            const tg2 = terrain_glyph(loc, x, y);
            loc.remembered_glyph = { ch: tg2.ch, color: tg2.color, decgfx: tg2.dec };
        }
        return;
    }
    if (mon && cansee(x, y) && !mon.mundetected) {
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
        // C ref display.h obj_is_generic (line 806): an object whose
        // dknown isn't set yet — seen only from a distance — renders
        // as the GENERIC class glyph for potions, real/glass gems and
        // spellbooks, "to prevent color ... from being revealed".
        // The generic glyphs draw in the class default (gray →
        // wintty's dropped-[37m → terminal default).  seed2600's
        // bigroom potion showed orange in JS vs default in C.
        let isGeneric = !obj.dknown
            && (oclass === 8 /* POTION_CLASS */
                || (obj.otyp >= 439 /* FIRST_REAL_GEM */
                    && obj.otyp <= 469 /* LAST_GLASS_GEM */)
                || (obj.otyp >= 366 /* FIRST_SPELL */
                    && obj.otyp <= 407 /* LAST_SPELL */));
        // C ref display.c:340-352 map_object — a generic-displayed
        // object within neardist of the hero (same radius as
        // distant_name) gets observe_object()d at DISPLAY time:
        // dknown=1, disco[] slot, oc_encountered — and then renders
        // with its real color.  Without this, seed0108's starting-
        // room potion (distu<=6 from the hero) went colorless on
        // every frame (C shows cyan from step 0).
        if (isGeneric) {
            const halluc = !!(game.u?.uprops?.[HALLUC]?.intrinsic
                && !(game.u?.uprops?.[HALLUC_RES]?.intrinsic
                    || game.u?.uprops?.[HALLUC_RES]?.extrinsic));
            const r = (game.u?.xray_range > 2) ? game.u.xray_range : 2;
            const neardist = (r * r) * 2 - r;
            const dx2 = (x - (game.u?.ux | 0)), dy2 = (y - (game.u?.uy | 0));
            if (!halluc && (dx2 * dx2 + dy2 * dy2) <= neardist
                && obj.otyp >= 18 /* FIRST_OBJECT */) {
                // observe_object + discover_object(,FALSE,TRUE,FALSE)
                // sync mirror (translated twins are async-colored
                // only; this path's branches are pure state writes).
                obj.dknown = 1;
                const od = game.objects?.[obj.otyp];
                if (od && !od.oc_encountered && Array.isArray(game.disco)
                    && Array.isArray(game.bases)) {
                    let dindx = game.bases[od.oc_class | 0] | 0;
                    while (game.disco[dindx] !== 0
                        && game.disco[dindx] !== obj.otyp) dindx++;
                    game.disco[dindx] = obj.otyp;
                    od.oc_encountered = 1;
                }
                isGeneric = false;
            }
        }
        if (isGeneric) {
            color = NO_COLOR;
        } else if (obj.otyp === 265 /* CORPSE */) {
            const mc = game.mons?.[obj.corpsenm]?.mcolor;
            color = (mc == null || mc === 7) ? NO_COLOR : mc;
        } else if (obj.otyp === 476 /* STATUE */) {
            // C ref display.c:2787/2794 — statue glyphs are colored with
            // obj_color(STATUE), the STATUE object's stone color, NOT the
            // depicted monster's mcolor (only a CORPSE uses that).  Using
            // the monster color rendered e.g. a newt statue yellow where C
            // shows it white (seed0104: one statue, wrong on 39 screens).
            const raw = game.objects?.[476]?.oc_color;
            color = (raw == null || raw === 7) ? NO_COLOR : raw;
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
            // Mirror-image of the §23.245 newsym bridge: TRANSLATED
            // readers consult the C-side remembered glyph
            // (dogmove.c:1302 glyph_is_object for "steps reluctantly
            // onto <obj>"; premap consumers) — but only translated
            // newsym maintained lev.glyph, so cells painted by the
            // HAND path stayed GLYPH_UNEXPLORED and the pet's
            // step-target read as "something".  Corpses use BODY
            // glyphs (GLYPH_BODY_OFF + corpsenm) like C obj_to_glyph;
            // piletop variants are omitted (every translated range
            // check accepts the plain offsets).
            loc.glyph = (obj.otyp === 265 /* CORPSE */)
                ? GLYPH_BODY_OFF + (obj.corpsenm | 0)
                : GLYPH_OBJ_OFF + (obj.otyp | 0);
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
    } else if (!loc.remembered_glyph
        && typeof loc.glyph === 'number' && loc.glyph !== GLYPH_UNEXPLORED_OFF) {
        // Gate on the C-side remembered glyph being set, NOT seenv:
        // vision marks seenv on could-see cells C still draws as
        // unexplored (gating on seenv repainted 190 phantom cells on
        // the lava level).
        const cg2 = cside_remembered_glyph(loc, x, y);
        show_glyph_cell(x, y, cg2.ch, cg2.color, cg2.dec);
        if (game.level?.flags?.hero_memory) {
            loc.remembered_glyph = { ch: cg2.ch, color: cg2.color, decgfx: cg2.dec };
        }
    } else if (loc.remembered_glyph) {
        // C display.c:852/898 — an unlit corridor remembered as
        // S_litcorr (bright white via lit_corridor) reverts to plain
        // S_corr once it can no longer be seen.
        if (loc.typ === CORR && !loc.lit && !loc.waslit
            && loc.remembered_glyph.color === CLR_WHITE) {
            loc.remembered_glyph = { ch: '#', color: NO_COLOR, decgfx: false };
        }
        // Out of sight but remembered — show remembered glyph
        show_glyph_cell(x, y, loc.remembered_glyph.ch,
            loc.remembered_glyph.color, loc.remembered_glyph.decgfx);
    }
}

// Publish hand newsym for the translated display.js bridge (§23.245):
// translated TUs (dogmove, mon, do, ...) import the TRANSLATED newsym,
// whose show_glyph writes go to game.gbuf — a buffer the hand renderer
// never reads.  Event-driven cell changes (dog picks up an item, then
// the cell falls out of sight) therefore never reached remembered_glyph
// and the stale object glyph persisted (seed1150's '%' at (51,18), the
// single most repeated S diff).  The translated newsym head tail-calls
// this hook so both display states stay coherent.
globalThis.__nh_hand_newsym = newsym;

// DEC chars renderable through the FROZEN comparator (§23.249).
// frozen/score.sh copies frozen/terminal.js over js/terminal.js on
// every scoring run, so the serializer is a fixture: it emits cell
// chars RAW (no \x0e/\x0f shift runs).  The frozen screen-decode
// DEC_MAP translates exactly these 13 DEC codes to Unicode on the C
// side; for those, writing the Unicode form compares equal.  Any
// OTHER DEC code ('`' diamond — lava/pool/boulder under DECgraphics)
// renders RAW on the C side, so JS must store the raw DEC char too —
// converting it to Unicode ('◆') can never match through the frozen
// pipeline.
const FROZEN_DEC = {
    'l': true, 'q': true, 'k': true, 'x': true, 'm': true, 'j': true,
    't': true, 'u': true, 'w': true, 'v': true, 'n': true, 'a': true,
    '~': true,
};
const renderDecCh = (ch) => (FROZEN_DEC[ch] ? (DEC_TO_UNICODE[ch] || ch) : ch);

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
            } else if (!loc?.remembered_glyph
                && typeof loc?.glyph === 'number' && loc.glyph !== GLYPH_UNEXPLORED_OFF) {
                const cg2 = cside_remembered_glyph(loc, x, y);
                show_glyph_cell(x, y, cg2.ch, cg2.color, cg2.dec);
                if (game.level?.flags?.hero_memory) {
                    loc.remembered_glyph = { ch: cg2.ch, color: cg2.color, decgfx: cg2.dec };
                }
            } else if (loc?.remembered_glyph) {
                if (loc.typ === CORR && !loc.lit && !loc.waslit
                    && loc.remembered_glyph.color === CLR_WHITE) {
                    // litcorr→corr revert (see newsym) on full repaints too.
                    loc.remembered_glyph = { ch: '#', color: NO_COLOR, decgfx: false };
                }
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
    // Condition indicators — C ref botl.c:172-205.  Appended in this
    // exact order (matters: C strncat to the buf, decoded order is
    // identity).  Each is gated on the C macro from include/youprop.h.
    // decl.js initializes u.uprops as an array of {intrinsic, extrinsic,
    // blocked} all 0, so the property accesses are safe (no Proxy-ghost
    // {} for these).
    //
    // The corresponding hu_stat / enc_stat string arrays:
    //   hu_stat = ["Satiated", "        ", "Hungry  ", "Weak    ",
    //              "Fainting", "Fainted ", "Starved "]
    //   enc_stat= ["", "Burdened", "Stressed", "Strained",
    //              "Overtaxed", "Overloaded"]
    // (NetHack 5.0: hu_stat NOT_HUNGRY entry is 8 spaces, treated as
    // "no indicator" by the `uhs != NOT_HUNGRY` guard.)
    //
    // Encumbrance (near_capacity) and Flying (which considers steed's
    // monster type via u.usteed.data) are NOT inlined here — they need
    // logic the bot status helper doesn't otherwise carry.  Adding them
    // is a follow-up; the test sessions where they fire (seed0399
    // " Burdened", seed5006 " Blind"/" Conf") need their underlying
    // state flows fixed too.
    const conds = [];
    const up = u.uprops || [];
    if (up[STONED]?.intrinsic) conds.push(' Stone');
    if (up[SLIMED]?.intrinsic) conds.push(' Slime');
    if (up[STRANGLED]?.intrinsic) conds.push(' Strngl');
    // SICK_VOMITABLE=0x1, SICK_NONVOMITABLE=0x2 per include/you.h.
    // Not exported as JS constants, so inline literals match the
    // translator's convention; the bit-mask comment ties them to C.
    if (u.usick_type & 0x1) conds.push(' FoodPois');
    if (u.usick_type & 0x2) conds.push(' TermIll');
    const huStrings = ['Satiated', null, 'Hungry', 'Weak', 'Fainting', 'Fainted', 'Starved'];
    if (u.uhs !== 1 && u.uhs !== 0 && huStrings[u.uhs]) conds.push(' ' + huStrings[u.uhs]);
    else if (u.uhs === 0) conds.push(' Satiated');
    // Encumbrance: C ref botl.c:187-188 — `if ((cap = near_capacity())
    // > UNENCUMBERED) Sprintf(nb, " %s", enc_stat[cap])`.
    // enc_stat = ["", "Burdened", "Stressed", "Strained", "Overtaxed", "Overloaded"]
    // near_capacity walks game.invent computing weight vs weight_cap;
    // game.invent is initialized to null in decl.js (g_init_i, line
    // 302→841 Object.assign), so inv_weight's `while (otmp)` exits
    // immediately on empty inventory — no Proxy-ghost infinite loop.
    // weight_cap reads many u fields that could be undefined in
    // partial init; wrap in try/catch as defensive guard.
    try {
        const encStat = ['', 'Burdened', 'Stressed', 'Strained', 'Overtaxed', 'Overloaded'];
        const cap = near_capacity();
        if (cap > 0 && encStat[cap]) conds.push(' ' + encStat[cap]);
    } catch (_) { /* state not fully initialized; skip indicator */ }
    // Blind = (HBlinded || EBlinded) && !BBlinded; uroleplay.blind too.
    const blind = ((up[BLINDED]?.intrinsic || up[BLINDED]?.extrinsic) && !up[BLINDED]?.blocked)
        || u.uroleplay?.blind;
    if (blind) conds.push(' Blind');
    // Deaf = HDeaf || EDeaf || u.uroleplay.deaf.
    if (up[DEAF]?.intrinsic || up[DEAF]?.extrinsic || u.uroleplay?.deaf) conds.push(' Deaf');
    if (up[STUNNED]?.intrinsic) conds.push(' Stun');
    if (up[CONFUSION]?.intrinsic) conds.push(' Conf');
    // Hallucination = HHallucination && !Halluc_resistance.
    const halluRes = up[HALLUC_RES]?.intrinsic || up[HALLUC_RES]?.extrinsic;
    if (up[HALLUC]?.intrinsic && !halluRes) conds.push(' Hallu');
    // Levitation = (HLev || ELev) && !BLev.
    const lev = (up[LEVITATION]?.intrinsic || up[LEVITATION]?.extrinsic) && !up[LEVITATION]?.blocked;
    if (lev) conds.push(' Lev');
    // Flying = ((HFlying || EFlying || (u.usteed && is_flyer(u.usteed.data))) && !BFlying)
    // The C macro doesn't include `!Levitation`; botl.c's comment
    // ("levitation and flying are mutually exclusive") notes that the
    // property setup ensures they don't both fire in practice, but the
    // emission code at botl.c:200-204 writes both independently if
    // both are set.  Mirror the macro exactly.  is_flyer macro:
    // (ptr->mflags1 & M1_FLY) where M1_FLY = 0x1 (monflag.h:85).
    // u.usteed.data.mflags1 may be undefined/Proxy ghost; `undefined
    // & 1` = 0, and ghost-coerced `& 1` also = 0 — safe.
    const steedFlies = u.usteed && u.usteed.data && (u.usteed.data.mflags1 & 1);
    const fly = ((up[FLYING]?.intrinsic || up[FLYING]?.extrinsic || steedFlies) && !up[FLYING]?.blocked);
    if (fly) conds.push(' Fly');
    // C ref botl.c:204 — Ride only when steed is set (and not blocked).
    // decl.js initializes u.usteed to null and translated mount_steed/
    // dismount_steed write a real monster ref / null on success — so
    // the null check is safe (not a Proxy-ghost truthy {}).
    if (u.usteed) conds.push(' Ride');
    // C ref botl.c describe_level → depth(): the displayed Dlvl is
    // the DEPTH (dungeons[dnum].depth_start + dlevel - 1), not the
    // in-branch level number.  Identical in the main dungeon
    // (depth_start=1) — diverges in branches (soko1 = "Dlvl:5"
    // while uz.dlevel is 1; kept every premapped-soko frame failing
    // on one status digit).
    const __dl = (() => {
        const uzz = u.uz || {};
        const ds = game.dungeons?.[uzz.dnum]?.depth_start;
        return (typeof ds === 'number' && typeof uzz.dlevel === 'number')
            ? (ds + uzz.dlevel - 1) : (uzz.dlevel || 1);
    })();
    return `Dlvl:${__dl} $:${game._goldCount || 0} HP:${u.uhp || 0}(${u.uhpmax || 0}) Pw:${u.uen || 0}(${u.uenmax || 0}) AC:${acDisplay} ${xp}${t}${conds.join('')}`;
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
                        const ch = loc.disp_decgfx ? renderDecCh(loc.disp_ch) : loc.disp_ch;
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
                // Segment-based line: { segments: [{ col, text, attr }, ...] }.
                // Each segment writes consecutively from `col` with its
                // own attr.  Used by the spell menu hand-port for the
                // header row where C wintty.c emits inverse-on words
                // ("    Name", "Level Category", "Fail Retention")
                // separated by cursor-forward over inverse-off padding
                // runs.  Reproducing that segment partition exactly is
                // necessary for cell match at the literal-space cells
                // BETWEEN words inside a single inverse-on run (col 50
                // " " in "Level Category", col 68 " " in "Fail
                // Retention") — those single spaces stay attr=1 in C
                // because they're inside the inverse-on string.
                if (entry && Array.isArray(entry.segments)) {
                    for (const seg of entry.segments) {
                        const sc = seg.col | 0;
                        const sAttr = seg.attr | 0;
                        const sText = String(seg.text ?? '');
                        for (let k = 0; k < sText.length && (sc + k) < display.cols; k++) {
                            display.setCell(sc + k, r, sText[k], NO_COLOR, sAttr);
                        }
                    }
                    continue;
                }
                const text = (typeof entry === 'string') ? entry : (entry?.text ?? '');
                const attr = (typeof entry === 'string') ? 0 : (entry?.attr ?? 0);
                // spaceAttr (optional) lets a menu line specify a
                // DIFFERENT attribute for internal space characters
                // than for non-space ones — C wintty.c emits header
                // text "Name                 Level" with inverse
                // video only on the words ("Name", "Level"), turning
                // inverse OFF for the run of inter-word spaces.  When
                // spaceAttr is omitted, defaults to `attr` (existing
                // behavior — same attr on every cell).  Used by the
                // spell menu hand-port (cmd.js buildSpellMenuPages).
                const spaceAttr = (typeof entry === 'object' && entry && 'spaceAttr' in entry)
                    ? (entry.spaceAttr | 0) : attr;
                let __cStart = 0;
                if (__menuPreserveBg) {
                    while (__cStart < text.length && text[__cStart] === ' ') __cStart++;
                    if (__cStart === text.length) continue;  // empty line — leave map visible
                    __cStart = Math.max(0, __cStart - 1);    // include 1-col gutter
                }
                for (let c = __cStart; c < Math.min(text.length, display.cols); c++) {
                    const ch = text[c];
                    display.setCell(c, r, ch, NO_COLOR, ch === ' ' ? spaceAttr : attr);
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
                const renderCh = decgfx ? renderDecCh(ch) : ch;
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
export function pline(msg) {
    // NOT async: this JS pline never blocks.  C's pline can fire more()
    // (which readchar-blocks on a --More--), but the JS port DEFERS that
    // blocking — pline only mutates _pending_message / _dmore_queue
    // synchronously, and the shared More machinery in nhgetch drains the
    // queue at the next input boundary.  Declaring it async was vestigial:
    // the body has no await, no caller depends on the returned Promise, and
    // `await pline(...)` in translated code awaits undefined (timing-neutral
    // — await yields one microtask tick either way, and PRNG/screen capture
    // are deterministic on the single chain).  Making it sync clears the
    // lone conformance §7 error (win_putstr -> pline without await,
    // allmain.js:905) the correct way rather than propagating async.
    if (msg == null || msg === '') {
        // C ref pline.c vpline: `if (!line || !*line) return;` — an
        // empty pline is a NO-OP.  This branch used to CLEAR the
        // pending topl, so a translated caller whose formatted text
        // came out empty erased the previous message before its
        // boundary capture (seed0101's "you throw your arrow by
        // hand" vanished one pline later).
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
        game._pending_message_moves = (game.moves || 0);
        game._topl_seen = false;
        return;
    }
    const cur = game._pending_message || '';
    if (!cur) {
        game._pending_message = msg;
        game._pending_message_moves = (game.moves || 0);
        return;
    }
    // C ref topl.c: a message from a LATER turn does not silently concatenate
    // onto an unseen topl — C fires more() so the player sees each turn's
    // events before the next overwrites.  In normal play the input between
    // turns sets _topl_seen (above), so this never triggers; it fires ONLY
    // during a no-input multi-turn span (counted search / run auto-repeat),
    // where C shows --More-- between the per-turn messages while JS used to
    // combine them by length alone.  That missing input boundary let the
    // hero run one tile ahead and forked the seed0900 monster-movement
    // cluster (confirmed via per-turn hero-@ position diff: positions match
    // through the search, diverge the turn C holds the dog-combat --More--).
    // Same-turn multi-messages (e.g. hallucination see_monsters) keep
    // combining because game.moves is unchanged.
    if ((game.moves || 0) !== (game._pending_message_moves || 0)
            && (game.multi || 0) > 0) {
        game._pending_message = cur + '--More--';
        game._dmore_queue = [msg];
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
