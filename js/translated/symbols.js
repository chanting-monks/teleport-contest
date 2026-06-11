/* NetHack 5.0	symbols.c	$NHDT-Date: 1736530208 2025/01/10 09:30:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.123 $ */
/* Copyright (c) NetHack Development Team 2020.                   */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { pline } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strchr, strcmp, strlen, strncmpi, strrchr } from '../c2js-runtime/string.js';
import { cg } from './decl.js';
import { nul_glyphinfo, reset_glyphmap } from './display.js';
import { def_monsyms, def_oc_syms, def_r_oc_syms, def_warnsyms, defsyms } from './drawing.js';
import { on_level } from './dungeon.js';
import { apply_customizations, clear_all_glyphmap_colors, fill_glyphid_cache, free_glyphid_cache, glyphid_cache_status, glyphrep_to_custom_map_entries, match_glyph, purge_custom_entries } from './glyphs.js';
import { lowc, mungspaces } from './hacklib.js';
import { DEF_INVISIBLE, H_DEC, H_MAC, H_UNK, H_UTF8, MAXMCLASSES, MAXOCLASSES, MAXOTHER, MAXPCHARS, MAX_GLYPH, PRIMARYSET, ROCK_CLASS, ROGUESET, SYM_BOULDER, SYM_CONTROL, SYM_HERO_OVERRIDE, SYM_INVALID, SYM_INVISIBLE, SYM_MON, SYM_NOTHING, SYM_OC, SYM_OTH, SYM_PCHAR, SYM_PET_OVERRIDE, SYM_UNEXPLORED, S_ANGEL, S_ANT, S_BAT, S_BLOB, S_CENTAUR, S_COCKATRICE, S_DEMON, S_DOG, S_DRAGON, S_EEL, S_ELEMENTAL, S_EYE, S_FELINE, S_FUNGUS, S_GHOST, S_GIANT, S_GNOME, S_GOLEM, S_GREMLIN, S_HUMAN, S_HUMANOID, S_IMP, S_JABBERWOCK, S_JELLY, S_KOBOLD, S_KOP, S_LEPRECHAUN, S_LICH, S_LIGHT, S_LIZARD, S_MIMIC, S_MIMIC_DEF, S_MUMMY, S_NAGA, S_NYMPH, S_OGRE, S_ORC, S_PIERCER, S_PUDDING, S_QUADRUPED, S_QUANTMECH, S_RODENT, S_RUSTMONST, S_SNAKE, S_SPIDER, S_TRAPPER, S_TROLL, S_UMBER, S_UNICORN, S_VAMPIRE, S_VORTEX, S_WORM, S_WORM_TAIL, S_WRAITH, S_XAN, S_XORN, S_YETI, S_ZOMBIE, S_ZRUTY, S_air, S_altar, S_amulet, S_anti_magic_trap, S_armor, S_arrow_trap, S_ball, S_bars, S_bear_trap, S_blcorn, S_book, S_boomleft, S_boomright, S_brcorn, S_brdnladder, S_brdnstair, S_brupladder, S_brupstair, S_chain, S_cloud, S_coin, S_corr, S_crwall, S_darkroom, S_dart_trap, S_digbeam, S_dnladder, S_dnstair, S_engrcorr, S_engroom, S_expl_bc, S_expl_bl, S_expl_br, S_expl_mc, S_expl_ml, S_expl_mr, S_expl_tc, S_expl_tl, S_expl_tr, S_falling_rock_trap, S_fire_trap, S_flashbeam, S_food, S_fountain, S_gem, S_goodpos, S_grave, S_hbeam, S_hcdbridge, S_hcdoor, S_hodbridge, S_hodoor, S_hole, S_hwall, S_ice, S_invisible, S_land_mine, S_lava, S_lavawall, S_level_teleporter, S_litcorr, S_lslant, S_magic_portal, S_magic_trap, S_ndoor, S_pit, S_poisoncloud, S_polymorph_trap, S_pool, S_potion, S_ring, S_rock, S_rolling_boulder_trap, S_room, S_rslant, S_rust_trap, S_scroll, S_sink, S_sleeping_gas_trap, S_spiked_pit, S_squeaky_board, S_ss1, S_ss2, S_ss3, S_ss4, S_statue_trap, S_stone, S_strange_obj, S_sw_bc, S_sw_bl, S_sw_br, S_sw_ml, S_sw_mr, S_sw_tc, S_sw_tl, S_sw_tr, S_tdwall, S_teleportation_trap, S_throne, S_tlcorn, S_tlwall, S_tool, S_trap_door, S_trapped_chest, S_trapped_door, S_trcorn, S_tree, S_trwall, S_tuwall, S_upladder, S_upstair, S_vbeam, S_vcdbridge, S_vcdoor, S_venom, S_vibrating_square, S_vodbridge, S_vodoor, S_vwall, S_wand, S_water, S_weapon, S_web, do_custom_colors, do_custom_symbols, gm_symchange } from './nh-constants.js';
import { sym_val } from './options.js';
import { There } from './pline.js';
import { strbuf_append } from './strutil.js';
import { free_all_glyphmap_u } from './utf8map.js';
import { add_menu, select_menu } from './windows.js';

/* drawing.c */
game.decgraphics_mode_callback = null;
/* set in term_start_screen() */
/* TERMLIB || CURSES */
/* set in term_start_screen() */
/* set in term_start_screen() */
game.utf8graphics_mode_callback = null;
/* set in term_start_screen and
                                               * found in unixtty,windtty,&c */
/*
 * Explanations of the functions found below:
 *
 * init_symbols()
 *                     Sets the current display symbols, the
 *                     loadable symbols to the default NetHack
 *                     symbols, including the rogue_syms rogue level
 *                     symbols. This would typically be done
 *                     immediately after execution begins. Any
 *                     previously loaded external symbol sets are
 *                     discarded.
 *
 * switch_symbols(arg)
 *                     Called to swap in new current display symbols
 *                     (showsyms) from either the default symbols,
 *                     or from the loaded symbols.
 *
 *                     If (arg == 0) then showsyms are taken from
 *                     defsyms, def_oc_syms, and def_monsyms.
 *
 *                     If (arg != 0), which is the normal expected
 *                     usage, then showsyms are taken from the
 *                     adjustable display symbols found in gp.primary_syms.
 *                     gp.primary_syms may have been loaded from an external
 *                     symbol file by config file options or interactively
 *                     in the Options menu.
 *
 * assign_graphics(arg)
 *
 *                     This is used in the game core to toggle in and
 *                     out of other {rogue} level display modes.
 *
 *                     If arg is ROGUESET, this places the rogue level
 *                     symbols from gr.rogue_syms into gs.showsyms.
 *
 *                     If arg is PRIMARYSET, this places the symbols
 *                     from gp.primary_syms into gs.showsyms.
 *
 * update_primary_symset()
 *                     Update a member of the primary(primary_*) symbol set.
 *
 * update_rogue_symset()
 *                     Update a member of the rogue (rogue_*) symbol set.
 *
 * update_ov_primary_symset()
 *                     Update a member of the overrides for primary symbol set.
 *
 * update_ov_rogue_symset()
 *                     Update a member of the overrides for rogue symbol set.
 *
 */
export function init_symbols() {
    init_ov_primary_symbols();
    init_ov_rogue_symbols();
    init_primary_symbols();
    init_showsyms();
    init_rogue_symbols();
}
export function init_showsyms() {
    let i = 0;
    for (i = 0; i < MAXPCHARS; i++) {
        game.showsyms[i + (0)] = defsyms[i].sym;
    }
    for (i = 0; i < MAXOCLASSES; i++) {
        game.showsyms[i + ((0) + MAXPCHARS)] = def_oc_syms[i].sym;
    }
    for (i = 0; i < MAXMCLASSES; i++) {
        game.showsyms[i + (((0) + MAXPCHARS) + MAXOCLASSES)] = def_monsyms[i].sym;
    }
    for (i = 0; i < 6; i++) {
        game.showsyms[i + ((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES)] = def_warnsyms[i].sym;
    }
    for (i = 0; i < MAXOTHER; i++) {
        game.showsyms[i + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] = get_othersym(i, PRIMARYSET);
    }
}
/* initialize defaults for the overrides to the rogue symset */
export function init_ov_rogue_symbols() {
    let i = 0;
    for (i = 0; i < ((((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6) + MAXOTHER); i++) {
        game.ov_rogue_syms[i] = 0;
    }
}
/* initialize defaults for the overrides to the primary symset */
export function init_ov_primary_symbols() {
    let i = 0;
    for (i = 0; i < ((((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6) + MAXOTHER); i++) {
        game.ov_primary_syms[i] = 0;
    }
}
export function get_othersym(idx, which_set) {
    let sym = 0;
    let oidx = idx + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6);
    if (which_set == ROGUESET) {
        sym = game.ov_rogue_syms[oidx] ? game.ov_rogue_syms[oidx] : game.rogue_syms[oidx];
    } else {
        sym = game.ov_primary_syms[oidx] ? game.ov_primary_syms[oidx] : game.primary_syms[oidx];
    }
    if (!sym) {
        switch (idx) {
            case SYM_NOTHING:
            case SYM_UNEXPLORED:
                sym = 32;
                break;
            case SYM_BOULDER:
                sym = def_oc_syms[ROCK_CLASS].sym;
                break;
            case SYM_INVISIBLE:
                sym = DEF_INVISIBLE;
                break;
        }
    }
    return sym;
}
/* initialize defaults for the primary symset */
export function init_primary_symbols() {
    let i = 0;
    for (i = 0; i < MAXPCHARS; i++) {
        game.primary_syms[i + (0)] = defsyms[i].sym;
    }
    for (i = 0; i < MAXOCLASSES; i++) {
        game.primary_syms[i + ((0) + MAXPCHARS)] = def_oc_syms[i].sym;
    }
    for (i = 0; i < MAXMCLASSES; i++) {
        game.primary_syms[i + (((0) + MAXPCHARS) + MAXOCLASSES)] = def_monsyms[i].sym;
    }
    for (i = 0; i < 6; i++) {
        game.primary_syms[i + ((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES)] = def_warnsyms[i].sym;
    }
    for (i = 0; i < MAXOTHER; i++) {
        game.primary_syms[i + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] = get_othersym(i, PRIMARYSET);
    }
    clear_symsetentry(PRIMARYSET, (0));
}
/* initialize defaults for the rogue symset */
export function init_rogue_symbols() {
    let i = 0;
    /* These are defaults that can get overwritten
       later by the roguesymbols option */
    for (i = 0; i < MAXPCHARS; i++) {
        game.rogue_syms[i + (0)] = defsyms[i].sym;
    }
    ((game.rogue_syms[S_ndoor] = 43, game.rogue_syms[S_hodoor] = 43), game.rogue_syms[S_vodoor] = 43);
    (game.rogue_syms[S_dnstair] = 37, game.rogue_syms[S_upstair] = 37);
    for (i = 0; i < MAXOCLASSES; i++) {
        game.rogue_syms[i + ((0) + MAXPCHARS)] = def_r_oc_syms[i];
    }
    for (i = 0; i < MAXMCLASSES; i++) {
        game.rogue_syms[i + (((0) + MAXPCHARS) + MAXOCLASSES)] = def_monsyms[i].sym;
    }
    for (i = 0; i < 6; i++) {
        game.rogue_syms[i + ((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES)] = def_warnsyms[i].sym;
    }
    for (i = 0; i < MAXOTHER; i++) {
        game.rogue_syms[i + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] = get_othersym(i, ROGUESET);
    }
    clear_symsetentry(ROGUESET, (0));
    /* default on Rogue level is no color
     * but some symbol sets can override that
     */
    game.symset[ROGUESET].nocolor = 1;
}
export function assign_graphics(whichset) {
    let i = 0;
    switch (whichset) {
        case ROGUESET:
            for (i = 0; i < ((((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6) + MAXOTHER); i++) {
                game.showsyms[i] = game.ov_rogue_syms[i] ? game.ov_rogue_syms[i] : game.rogue_syms[i];
            }
            game.currentgraphics = ROGUESET;
            break;
        case PRIMARYSET:
        default:
            for (i = 0; i < ((((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6) + MAXOTHER); i++) {
                game.showsyms[i] = game.ov_primary_syms[i] ? game.ov_primary_syms[i] : game.primary_syms[i];
            }
            game.currentgraphics = PRIMARYSET;
            break;
    }
    reset_glyphmap(gm_symchange);
}
export function switch_symbols(nondefault) {
    let i = 0;
    if (nondefault) {
        for (i = 0; i < ((((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6) + MAXOTHER); i++) {
            game.showsyms[i] = game.ov_primary_syms[i] ? game.ov_primary_syms[i] : game.primary_syms[i];
        }
        /* curses doesn't assign any routine to dec..._callback but
           probably does the expected initialization under the hood
           for terminals capable of rendering DECgraphics */
        if ((game.symset[game.currentgraphics].handling == (H_DEC)) && game.decgraphics_mode_callback) {
            (game.decgraphics_mode_callback)();
        }
        /* there aren't any symbol sets with CURS handling, and the
           curses interface never assigns a routine to curses..._callback */
        if ((game.symset[game.currentgraphics].handling == (H_UTF8)) && game.utf8graphics_mode_callback) {
            (game.utf8graphics_mode_callback)();
        }
    /* Set default symbols and clear the handling value */
    } else {
        init_primary_symbols();
        init_showsyms();
    }
}
export function update_ov_primary_symset(symp, val) {
    game.ov_primary_syms[symp.idx] = val;
}
export function update_ov_rogue_symset(symp, val) {
    game.ov_rogue_syms[symp.idx] = val;
}
export function update_primary_symset(symp, val) {
    game.primary_syms[symp.idx] = val;
}
export function update_rogue_symset(symp, val) {
    game.rogue_syms[symp.idx] = val;
}
export function clear_symsetentry(which_set, name_too) {
    let other_set = (which_set == PRIMARYSET) ? ROGUESET : PRIMARYSET;
    let old_handling = game.symset[which_set].handling;
    if (game.symset[which_set].desc) {
        free(game.symset[which_set].desc);
    }
    game.symset[which_set].desc = null;
    game.symset[which_set].handling = H_UNK;
    game.symset[which_set].nocolor = 0;
    /* initialize restriction bits */
    game.symset[which_set].primary = 0;
    game.symset[which_set].rogue = 0;
    if (name_too) {
        if (game.symset[which_set].name) {
            free(game.symset[which_set].name);
        }
        game.symset[which_set].name = null;
    }
    /* if 'which_set' was using UTF8, it isn't anymore; if the other set
       isn't using UTF8, discard the data for that */
    if (old_handling == H_UTF8 && game.symset[other_set].handling != H_UTF8) {
        free_all_glyphmap_u();
    }
    purge_custom_entries(which_set);
    clear_all_glyphmap_colors();
}
/* called from windmain.c */
export function symset_is_compatible(handling, wincap2) {
    if (handling == H_UTF8 && ((wincap2 & (131072)) != (131072))) {
        return (0);
    }
    return (1);
}
/*
 * If you are adding code somewhere to be able to recognize
 * particular types of symset "handling", define a
 * H_XXX macro in include/sym.h and add the name
 * to this array at the matching offset.
 * Externally referenced from files.c, options.c, utf8map.c.
 */
export const known_handling = ["UNKNOWN", "IBM", "DEC", "CURS", "MAC", "UTF8", null];
/* H_UNK  */
/* H_IBM  */
/* H_DEC  */
/* H_CURS */
/* H_MAC  -- pre-OSX MACgraphics */
/* H_UTF8 */
/*
 * Accepted keywords for symset restrictions.
 * These can be virtually anything that you want to
 * be able to test in the code someplace.
 * Be sure to:
 *    - add a corresponding Bitfield to the symsetentry struct in sym.h
 *    - initialize the field to zero in parse_sym_line in the SYM_CONTROL
 *      case 0 section of the idx switch. The location is prefaced with
 *      with a comment stating "initialize restriction bits".
 *    - set the value appropriately based on the index of your keyword
 *      under the case 5 sections of the same SYM_CONTROL idx switches.
 *    - add the field to clear_symsetentry()
 */
export const known_restrictions = ["primary", "rogue", null];
export const loadsyms = [{ range: SYM_CONTROL, idx: 0, name: "start" }, { range: SYM_CONTROL, idx: 0, name: "begin" }, { range: SYM_CONTROL, idx: 1, name: "finish" }, { range: SYM_CONTROL, idx: 2, name: "handling" }, { range: SYM_CONTROL, idx: 3, name: "description" }, { range: SYM_CONTROL, idx: 4, name: "color" }, { range: SYM_CONTROL, idx: 4, name: "colour" }, { range: SYM_CONTROL, idx: 5, name: "restrictions" }, { range: SYM_PCHAR, idx: S_stone, name: "S_stone" }, { range: SYM_PCHAR, idx: S_vwall, name: "S_vwall" }, { range: SYM_PCHAR, idx: S_hwall, name: "S_hwall" }, { range: SYM_PCHAR, idx: S_tlcorn, name: "S_tlcorn" }, { range: SYM_PCHAR, idx: S_trcorn, name: "S_trcorn" }, { range: SYM_PCHAR, idx: S_blcorn, name: "S_blcorn" }, { range: SYM_PCHAR, idx: S_brcorn, name: "S_brcorn" }, { range: SYM_PCHAR, idx: S_crwall, name: "S_crwall" }, { range: SYM_PCHAR, idx: S_tuwall, name: "S_tuwall" }, { range: SYM_PCHAR, idx: S_tdwall, name: "S_tdwall" }, { range: SYM_PCHAR, idx: S_tlwall, name: "S_tlwall" }, { range: SYM_PCHAR, idx: S_trwall, name: "S_trwall" }, { range: SYM_PCHAR, idx: S_ndoor, name: "S_ndoor" }, { range: SYM_PCHAR, idx: S_vodoor, name: "S_vodoor" }, { range: SYM_PCHAR, idx: S_hodoor, name: "S_hodoor" }, { range: SYM_PCHAR, idx: S_vcdoor, name: "S_vcdoor" }, { range: SYM_PCHAR, idx: S_hcdoor, name: "S_hcdoor" }, { range: SYM_PCHAR, idx: S_bars, name: "S_bars" }, { range: SYM_PCHAR, idx: S_tree, name: "S_tree" }, { range: SYM_PCHAR, idx: S_room, name: "S_room" }, { range: SYM_PCHAR, idx: S_darkroom, name: "S_darkroom" }, { range: SYM_PCHAR, idx: S_engroom, name: "S_engroom" }, { range: SYM_PCHAR, idx: S_corr, name: "S_corr" }, { range: SYM_PCHAR, idx: S_litcorr, name: "S_litcorr" }, { range: SYM_PCHAR, idx: S_engrcorr, name: "S_engrcorr" }, { range: SYM_PCHAR, idx: S_upstair, name: "S_upstair" }, { range: SYM_PCHAR, idx: S_dnstair, name: "S_dnstair" }, { range: SYM_PCHAR, idx: S_upladder, name: "S_upladder" }, { range: SYM_PCHAR, idx: S_dnladder, name: "S_dnladder" }, { range: SYM_PCHAR, idx: S_brupstair, name: "S_brupstair" }, { range: SYM_PCHAR, idx: S_brdnstair, name: "S_brdnstair" }, { range: SYM_PCHAR, idx: S_brupladder, name: "S_brupladder" }, { range: SYM_PCHAR, idx: S_brdnladder, name: "S_brdnladder" }, { range: SYM_PCHAR, idx: S_altar, name: "S_altar" }, { range: SYM_PCHAR, idx: S_grave, name: "S_grave" }, { range: SYM_PCHAR, idx: S_throne, name: "S_throne" }, { range: SYM_PCHAR, idx: S_sink, name: "S_sink" }, { range: SYM_PCHAR, idx: S_fountain, name: "S_fountain" }, { range: SYM_PCHAR, idx: S_pool, name: "S_pool" }, { range: SYM_PCHAR, idx: S_ice, name: "S_ice" }, { range: SYM_PCHAR, idx: S_lava, name: "S_lava" }, { range: SYM_PCHAR, idx: S_lavawall, name: "S_lavawall" }, { range: SYM_PCHAR, idx: S_vodbridge, name: "S_vodbridge" }, { range: SYM_PCHAR, idx: S_hodbridge, name: "S_hodbridge" }, { range: SYM_PCHAR, idx: S_vcdbridge, name: "S_vcdbridge" }, { range: SYM_PCHAR, idx: S_hcdbridge, name: "S_hcdbridge" }, { range: SYM_PCHAR, idx: S_air, name: "S_air" }, { range: SYM_PCHAR, idx: S_cloud, name: "S_cloud" }, { range: SYM_PCHAR, idx: S_water, name: "S_water" }, { range: SYM_PCHAR, idx: S_arrow_trap, name: "S_arrow_trap" }, { range: SYM_PCHAR, idx: S_dart_trap, name: "S_dart_trap" }, { range: SYM_PCHAR, idx: S_falling_rock_trap, name: "S_falling_rock_trap" }, { range: SYM_PCHAR, idx: S_squeaky_board, name: "S_squeaky_board" }, { range: SYM_PCHAR, idx: S_bear_trap, name: "S_bear_trap" }, { range: SYM_PCHAR, idx: S_land_mine, name: "S_land_mine" }, { range: SYM_PCHAR, idx: S_rolling_boulder_trap, name: "S_rolling_boulder_trap" }, { range: SYM_PCHAR, idx: S_sleeping_gas_trap, name: "S_sleeping_gas_trap" }, { range: SYM_PCHAR, idx: S_rust_trap, name: "S_rust_trap" }, { range: SYM_PCHAR, idx: S_fire_trap, name: "S_fire_trap" }, { range: SYM_PCHAR, idx: S_pit, name: "S_pit" }, { range: SYM_PCHAR, idx: S_spiked_pit, name: "S_spiked_pit" }, { range: SYM_PCHAR, idx: S_hole, name: "S_hole" }, { range: SYM_PCHAR, idx: S_trap_door, name: "S_trap_door" }, { range: SYM_PCHAR, idx: S_teleportation_trap, name: "S_teleportation_trap" }, { range: SYM_PCHAR, idx: S_level_teleporter, name: "S_level_teleporter" }, { range: SYM_PCHAR, idx: S_magic_portal, name: "S_magic_portal" }, { range: SYM_PCHAR, idx: S_web, name: "S_web" }, { range: SYM_PCHAR, idx: S_statue_trap, name: "S_statue_trap" }, { range: SYM_PCHAR, idx: S_magic_trap, name: "S_magic_trap" }, { range: SYM_PCHAR, idx: S_anti_magic_trap, name: "S_anti_magic_trap" }, { range: SYM_PCHAR, idx: S_polymorph_trap, name: "S_polymorph_trap" }, { range: SYM_PCHAR, idx: S_vibrating_square, name: "S_vibrating_square" }, { range: SYM_PCHAR, idx: S_trapped_door, name: "S_trapped_door" }, { range: SYM_PCHAR, idx: S_trapped_chest, name: "S_trapped_chest" }, { range: SYM_PCHAR, idx: S_vbeam, name: "S_vbeam" }, { range: SYM_PCHAR, idx: S_hbeam, name: "S_hbeam" }, { range: SYM_PCHAR, idx: S_lslant, name: "S_lslant" }, { range: SYM_PCHAR, idx: S_rslant, name: "S_rslant" }, { range: SYM_PCHAR, idx: S_digbeam, name: "S_digbeam" }, { range: SYM_PCHAR, idx: S_flashbeam, name: "S_flashbeam" }, { range: SYM_PCHAR, idx: S_boomleft, name: "S_boomleft" }, { range: SYM_PCHAR, idx: S_boomright, name: "S_boomright" }, { range: SYM_PCHAR, idx: S_ss1, name: "S_ss1" }, { range: SYM_PCHAR, idx: S_ss2, name: "S_ss2" }, { range: SYM_PCHAR, idx: S_ss3, name: "S_ss3" }, { range: SYM_PCHAR, idx: S_ss4, name: "S_ss4" }, { range: SYM_PCHAR, idx: S_poisoncloud, name: "S_poisoncloud" }, { range: SYM_PCHAR, idx: S_goodpos, name: "S_goodpos" }, { range: SYM_PCHAR, idx: S_sw_tl, name: "S_sw_tl" }, { range: SYM_PCHAR, idx: S_sw_tc, name: "S_sw_tc" }, { range: SYM_PCHAR, idx: S_sw_tr, name: "S_sw_tr" }, { range: SYM_PCHAR, idx: S_sw_ml, name: "S_sw_ml" }, { range: SYM_PCHAR, idx: S_sw_mr, name: "S_sw_mr" }, { range: SYM_PCHAR, idx: S_sw_bl, name: "S_sw_bl" }, { range: SYM_PCHAR, idx: S_sw_bc, name: "S_sw_bc" }, { range: SYM_PCHAR, idx: S_sw_br, name: "S_sw_br" }, { range: SYM_PCHAR, idx: S_expl_tl, name: "S_expl_tl" }, { range: SYM_PCHAR, idx: S_expl_tc, name: "S_expl_tc" }, { range: SYM_PCHAR, idx: S_expl_tr, name: "S_expl_tr" }, { range: SYM_PCHAR, idx: S_expl_ml, name: "S_expl_ml" }, { range: SYM_PCHAR, idx: S_expl_mc, name: "S_expl_mc" }, { range: SYM_PCHAR, idx: S_expl_mr, name: "S_expl_mr" }, { range: SYM_PCHAR, idx: S_expl_bl, name: "S_expl_bl" }, { range: SYM_PCHAR, idx: S_expl_bc, name: "S_expl_bc" }, { range: SYM_PCHAR, idx: S_expl_br, name: "S_expl_br" }, { range: SYM_OC, idx: S_strange_obj + ((0) + MAXPCHARS), name: "S_strange_obj" }, { range: SYM_OC, idx: S_weapon + ((0) + MAXPCHARS), name: "S_weapon" }, { range: SYM_OC, idx: S_armor + ((0) + MAXPCHARS), name: "S_armor" }, { range: SYM_OC, idx: S_ring + ((0) + MAXPCHARS), name: "S_ring" }, { range: SYM_OC, idx: S_amulet + ((0) + MAXPCHARS), name: "S_amulet" }, { range: SYM_OC, idx: S_tool + ((0) + MAXPCHARS), name: "S_tool" }, { range: SYM_OC, idx: S_food + ((0) + MAXPCHARS), name: "S_food" }, { range: SYM_OC, idx: S_potion + ((0) + MAXPCHARS), name: "S_potion" }, { range: SYM_OC, idx: S_scroll + ((0) + MAXPCHARS), name: "S_scroll" }, { range: SYM_OC, idx: S_book + ((0) + MAXPCHARS), name: "S_book" }, { range: SYM_OC, idx: S_wand + ((0) + MAXPCHARS), name: "S_wand" }, { range: SYM_OC, idx: S_coin + ((0) + MAXPCHARS), name: "S_coin" }, { range: SYM_OC, idx: S_gem + ((0) + MAXPCHARS), name: "S_gem" }, { range: SYM_OC, idx: S_rock + ((0) + MAXPCHARS), name: "S_rock" }, { range: SYM_OC, idx: S_ball + ((0) + MAXPCHARS), name: "S_ball" }, { range: SYM_OC, idx: S_chain + ((0) + MAXPCHARS), name: "S_chain" }, { range: SYM_OC, idx: S_venom + ((0) + MAXPCHARS), name: "S_venom" }, { range: SYM_MON, idx: S_ANT + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_ANT" }, { range: SYM_MON, idx: S_BLOB + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_BLOB" }, { range: SYM_MON, idx: S_COCKATRICE + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_COCKATRICE" }, { range: SYM_MON, idx: S_DOG + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_DOG" }, { range: SYM_MON, idx: S_EYE + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_EYE" }, { range: SYM_MON, idx: S_FELINE + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_FELINE" }, { range: SYM_MON, idx: S_GREMLIN + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_GREMLIN" }, { range: SYM_MON, idx: S_HUMANOID + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_HUMANOID" }, { range: SYM_MON, idx: S_IMP + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_IMP" }, { range: SYM_MON, idx: S_JELLY + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_JELLY" }, { range: SYM_MON, idx: S_KOBOLD + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_KOBOLD" }, { range: SYM_MON, idx: S_LEPRECHAUN + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_LEPRECHAUN" }, { range: SYM_MON, idx: S_MIMIC + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_MIMIC" }, { range: SYM_MON, idx: S_NYMPH + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_NYMPH" }, { range: SYM_MON, idx: S_ORC + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_ORC" }, { range: SYM_MON, idx: S_PIERCER + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_PIERCER" }, { range: SYM_MON, idx: S_QUADRUPED + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_QUADRUPED" }, { range: SYM_MON, idx: S_RODENT + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_RODENT" }, { range: SYM_MON, idx: S_SPIDER + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_SPIDER" }, { range: SYM_MON, idx: S_TRAPPER + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_TRAPPER" }, { range: SYM_MON, idx: S_UNICORN + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_UNICORN" }, { range: SYM_MON, idx: S_VORTEX + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_VORTEX" }, { range: SYM_MON, idx: S_WORM + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_WORM" }, { range: SYM_MON, idx: S_XAN + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_XAN" }, { range: SYM_MON, idx: S_LIGHT + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_LIGHT" }, { range: SYM_MON, idx: S_ZRUTY + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_ZRUTY" }, { range: SYM_MON, idx: S_ANGEL + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_ANGEL" }, { range: SYM_MON, idx: S_BAT + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_BAT" }, { range: SYM_MON, idx: S_CENTAUR + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_CENTAUR" }, { range: SYM_MON, idx: S_DRAGON + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_DRAGON" }, { range: SYM_MON, idx: S_ELEMENTAL + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_ELEMENTAL" }, { range: SYM_MON, idx: S_FUNGUS + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_FUNGUS" }, { range: SYM_MON, idx: S_GNOME + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_GNOME" }, { range: SYM_MON, idx: S_GIANT + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_GIANT" }, { range: SYM_MON, idx: S_invisible + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_invisible" }, { range: SYM_MON, idx: S_JABBERWOCK + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_JABBERWOCK" }, { range: SYM_MON, idx: S_KOP + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_KOP" }, { range: SYM_MON, idx: S_LICH + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_LICH" }, { range: SYM_MON, idx: S_MUMMY + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_MUMMY" }, { range: SYM_MON, idx: S_NAGA + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_NAGA" }, { range: SYM_MON, idx: S_OGRE + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_OGRE" }, { range: SYM_MON, idx: S_PUDDING + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_PUDDING" }, { range: SYM_MON, idx: S_QUANTMECH + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_QUANTMECH" }, { range: SYM_MON, idx: S_RUSTMONST + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_RUSTMONST" }, { range: SYM_MON, idx: S_SNAKE + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_SNAKE" }, { range: SYM_MON, idx: S_TROLL + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_TROLL" }, { range: SYM_MON, idx: S_UMBER + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_UMBER" }, { range: SYM_MON, idx: S_VAMPIRE + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_VAMPIRE" }, { range: SYM_MON, idx: S_WRAITH + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_WRAITH" }, { range: SYM_MON, idx: S_XORN + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_XORN" }, { range: SYM_MON, idx: S_YETI + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_YETI" }, { range: SYM_MON, idx: S_ZOMBIE + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_ZOMBIE" }, { range: SYM_MON, idx: S_HUMAN + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_HUMAN" }, { range: SYM_MON, idx: S_GHOST + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_GHOST" }, { range: SYM_MON, idx: S_GOLEM + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_GOLEM" }, { range: SYM_MON, idx: S_DEMON + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_DEMON" }, { range: SYM_MON, idx: S_EEL + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_EEL" }, { range: SYM_MON, idx: S_LIZARD + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_LIZARD" }, { range: SYM_MON, idx: S_WORM_TAIL + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_WORM_TAIL" }, { range: SYM_MON, idx: S_MIMIC_DEF + (((0) + MAXPCHARS) + MAXOCLASSES), name: "S_MIMIC_DEF" }, { range: SYM_OTH, idx: SYM_NOTHING + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6), name: "S_nothing" }, { range: SYM_OTH, idx: SYM_UNEXPLORED + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6), name: "S_unexplored" }, { range: SYM_OTH, idx: SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6), name: "S_boulder" }, { range: SYM_OTH, idx: SYM_INVISIBLE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6), name: "S_invisible" }, { range: SYM_OTH, idx: SYM_PET_OVERRIDE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6), name: "S_pet_override" }, { range: SYM_OTH, idx: SYM_HERO_OVERRIDE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6), name: "S_hero_override" }, { range: SYM_INVALID, idx: 0, name: null }];
/* fence post */
export function proc_symset_line(buf) {
    return !(parse_sym_line(buf, game.symset_which_set));
}
/* returns 0 on error */
export function parse_sym_line(buf, which_set) {
    let val = 0;
    let i = 0;
    let symp = null;
    let bufp = null;
    let commentp = null;
    let altp = null;
    let glyph = MAX_GLYPH;
    let enhanced_unavailable = (0);
    let is_glyph = (0);
    if (strlen(buf) >= 256) {
        buf = __nh_char_write(buf, 256 - 1, 0);
    }
    /* convert each instance of whitespace (tabs, consecutive spaces)
       into a single space; leading and trailing spaces are stripped */
    buf = mungspaces(buf);
    /* remove trailing comment, if any (this isn't strictly needed for
       individual symbols, and it won't matter if "X#comment" without
       separating space slips through; for handling or set description,
       symbol set creator is responsible for preceding '#' with a space
       and that comment itself doesn't contain " #") */
    if ((commentp = strrchr(buf, 35)) != null && __nh_char_at0(__nh_advance_str(commentp, -1)) == 32) {
        commentp = __nh_char_write(commentp, -1, 0);
    }
    bufp = strchr(buf, 61);
    altp = strchr(buf, 58);
    if (!bufp || (altp && altp < bufp)) {
        bufp = altp;
    }
    if (!bufp) {
        if (strncmpi(buf, "finish", 6) == 0) {
            /* end current graphics set */
            if (game.chosen_symset_start) {
                game.chosen_symset_end = (1);
            }
            game.chosen_symset_start = (0);
            return 1;
        }
        config_error_add("No \"finish\"");
        return 0;
    }
    /* skip '=' and space which follows, if any */
    (bufp = __nh_advance_str(bufp, 1));
    if (__nh_char_at0(bufp) == 32) {
        (bufp = __nh_advance_str(bufp, 1));
    }
    symp = match_sym(buf);
    if (!symp && __nh_char_at0(buf) == 71 && __nh_char_at0(__nh_advance_str(buf, 1)) == 95) {
        if (game.chosen_symset_start) {
            is_glyph = match_glyph(buf);
        } else {
            is_glyph = (1);
        }
        enhanced_unavailable = (0);
    }
    if (!symp && !is_glyph && !enhanced_unavailable) {
        config_error_add("Unknown sym keyword");
        return 0;
    }
    if (symp) {
        if (!game.symset[which_set].name) {
            if (symp.range == SYM_CONTROL) {
                /* A null symset name indicates that we're just
               building a pick-list of possible symset
               values from the file, so only do that */
                let tmpsp = null;
                let lastsp = null;
                for (lastsp = game.symset_list; lastsp; lastsp = lastsp.next) {
                    if (!lastsp.next) {
                        break;
                    }
                }
                switch (symp.idx) {
                    case 0:
                        tmpsp = alloc(1 /* sizeof(struct symsetentry) */);
                        tmpsp.next = null;
                        if (!lastsp) {
                            game.symset_list = tmpsp;
                        } else {
                            lastsp.next = tmpsp;
                        }
                        tmpsp.idx = game.symset_count++;
                        tmpsp.name = dupstr(bufp);
                        tmpsp.desc = null;
                        tmpsp.handling = H_UNK;
                        tmpsp.nocolor = 0;
                        tmpsp.primary = 0;
                        tmpsp.rogue = 0;
                        break;
                    case 2:
                        tmpsp = lastsp;
                        for (i = 0; known_handling[i]; ++i) {
                            if (!strncmpi((known_handling[i]), (bufp), -1)) {
                                if (tmpsp) {
                                    tmpsp.handling = i;
                                }
                                break;
                            }
                        }
                        break;
                    case 3:
                        tmpsp = lastsp;
                        if (tmpsp && !tmpsp.desc) {
                            tmpsp.desc = dupstr(bufp);
                        }
                        break;
                    case 5:
                        tmpsp = lastsp;
                        for (i = 0; known_restrictions[i]; ++i) {
                            if (!strncmpi((known_restrictions[i]), (bufp), -1)) {
                                if (tmpsp) {
                                    switch (i) {
                                        case 0:
                                            tmpsp.primary = 1;
                                            break;
                                        case 1:
                                            tmpsp.rogue = 1;
                                            break;
                                    }
                                }
                                break;
                            }
                        }
                        break;
                }
            }
            return 1;
        }
        if (symp.range && symp.range == SYM_CONTROL) {
            switch (symp.idx) {
                case 0:
                    if (!strncmpi((bufp), (game.symset[which_set].name), -1)) {
                        game.chosen_symset_start = (1);
                        /* these init_*() functions clear symset fields too */
                        if (which_set == ROGUESET) {
                            init_rogue_symbols();
                        } else if (which_set == PRIMARYSET) {
                            init_primary_symbols();
                        }
                    }
                    break;
                case 1:
                    if (game.chosen_symset_start) {
                        game.chosen_symset_end = (1);
                    }
                    game.chosen_symset_start = (0);
                    break;
                case 2:
                    if (game.chosen_symset_start) {
                        set_symhandling(bufp, which_set);
                    }
                    break;
                case 4:
                    if (game.chosen_symset_start) {
                        if (bufp) {
                            /* case 3: (description) is ignored here */
                            if (!strncmpi((bufp), ("true"), -1) || !strncmpi((bufp), ("yes"), -1) || !strncmpi((bufp), ("on"), -1)) {
                                game.symset[which_set].nocolor = 0;
                            } else if (!strncmpi((bufp), ("false"), -1) || !strncmpi((bufp), ("no"), -1) || !strncmpi((bufp), ("off"), -1)) {
                                game.symset[which_set].nocolor = 1;
                            }
                        }
                    }
                    break;
                case 5:
                    if (game.chosen_symset_start) {
                        let n = 0;
                        while (known_restrictions[n]) {
                            if (!strncmpi((known_restrictions[n]), (bufp), -1)) {
                                switch (n) {
                                    case 0:
                                        game.symset[which_set].primary = 1;
                                        break;
                                    case 1:
                                        game.symset[which_set].rogue = 1;
                                        break;
                                }
                                break;
                            }
                            n++;
                        }
                    }
                    break;
            }
        } else {
            if (game.symset[which_set].handling != H_UTF8) {
                if (game.chosen_symset_start) {
                    val = sym_val(bufp);
                    if (which_set == PRIMARYSET) {
                        update_primary_symset(symp, val);
                    } else if (which_set == ROGUESET) {
                        update_rogue_symset(symp, val);
                    }
                }
            } else {
                if (game.chosen_symset_start) {
                    glyphrep_to_custom_map_entries(buf, { get value() { return glyph; }, set value(_v) { glyph = _v; } });
                }
            }
        }
    } else if (game.chosen_symset_start) {
        glyphrep_to_custom_map_entries(buf, { get value() { return glyph; }, set value(_v) { glyph = _v; } });
    }
    return 1;
}
export function set_symhandling(handling, which_set) {
    let i = 0;
    game.symset[which_set].handling = H_UNK;
    while (known_handling[i]) {
        if (!strncmpi((known_handling[i]), (handling), -1)) {
            game.symset[which_set].handling = i;
            return;
        }
        i++;
    }
}
/* bundle some common usage into one easy-to-use routine */
export function load_symset(s, which_set) {
    clear_symsetentry(which_set, (1));
    if (game.symset[which_set].name) {
        free(game.symset[which_set].name);
    }
    game.symset[which_set].name = dupstr(s);
    if (read_sym_file(which_set)) {
        switch_symbols((1));
        apply_customizations(game.currentgraphics, do_custom_symbols | do_custom_colors);
    } else {
        clear_symsetentry(which_set, (1));
        return 0;
    }
    return 1;
}
export function free_symsets() {
    clear_symsetentry(PRIMARYSET, (1));
    /* symset_list is cleaned up as soon as it's used, so we shouldn't
       have to anything about it here */
    /* assert( symset_list == NULL ); */
    clear_symsetentry(ROGUESET, (1));
}
// struct _savedsym: { name, val, which_set, next }
game.saved_symbols = null;
export function savedsym_free() {
    let tmp = game.saved_symbols;
    let tmp2 = null;
    while (tmp) {
        tmp2 = tmp.next;
        free(tmp.name);
        free(tmp.val);
        free(tmp);
        tmp = tmp2;
    }
}
export function savedsym_find(name, which_set) {
    let tmp = game.saved_symbols;
    while (tmp) {
        if (which_set == tmp.which_set && !strcmp(name, tmp.name)) {
            return tmp;
        }
        tmp = tmp.next;
    }
    return null;
}
export function savedsym_add(name, val, which_set) {
    let tmp = null;
    if ((tmp = savedsym_find(name, which_set)) != null) {
        free(tmp.val);
        tmp.val = dupstr(val);
    } else {
        tmp = alloc(1 /* sizeof(struct _savedsym) */);
        tmp.name = dupstr(name);
        tmp.val = dupstr(val);
        tmp.which_set = which_set;
        tmp.next = game.saved_symbols;
        game.saved_symbols = tmp;
    }
}
export function savedsym_strbuf(sbuf) {
    let tmp = game.saved_symbols;
    let buf = '';
    while (tmp) {
        buf = sprintf(buf, "%sSYMBOLS=%s:%s\n", (tmp.which_set == ROGUESET) ? "ROGUE" : "", tmp.name, tmp.val);
        strbuf_append(sbuf, buf);
        tmp = tmp.next;
    }
}
/* Parse the value of a SYMBOLS line from a config file */
export function parsesymbols(opts, which_set) {
    let val = 0;
    let symname = null;
    let strval = null;
    let ch = null;
    let first_unquoted_comma = null;
    let first_unquoted_colon = null;
    let symp = null;
    let is_glyph = (0);
    for (ch = __nh_advance_str(opts, 1); __nh_char_at0(ch); (ch = __nh_advance_str(ch, 1))) {
        /* are there any commas or colons that aren't quoted? */
        let prech = null;
        let postch = null;
        prech = ch - 1;
        postch = __nh_advance_str(ch, 1);
        if (!__nh_char_at0(postch)) {
            break;
        }
        if (__nh_char_at0(ch) == 44) {
            if (__nh_char_at0(prech) == 39 && __nh_char_at0(postch) == 39) {
                continue;
            }
            if (__nh_char_at0(prech) == 92) {
                continue;
            }
        }
        if (__nh_char_at0(ch) == 58) {
            if (__nh_char_at0(prech) == 39 && __nh_char_at0(postch) == 39) {
                continue;
            }
        }
        if (__nh_char_at0(ch) == 44 && !first_unquoted_comma) {
            first_unquoted_comma = ch;
        }
        if (__nh_char_at0(ch) == 58 && !first_unquoted_colon) {
            first_unquoted_colon = ch;
        }
    }
    if (first_unquoted_comma != null) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        if (!parsesymbols(first_unquoted_comma, which_set)) {
            return (0);
        }
    }
    symname = opts;
    strval = first_unquoted_colon;
    if (!strval) {
        strval = strchr(opts, 61);
    }
    if (!strval) {
        return (0);
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    /* strip leading and trailing white space from symname and strval */
    symname = mungspaces(symname);
    strval = mungspaces(strval);
    symp = match_sym(symname);
    if (!symp && __nh_char_at0(symname) == 71 && __nh_char_at0(__nh_advance_str(symname, 1)) == 95) {
        is_glyph = match_glyph(symname);
    }
    if (!symp && !is_glyph) {
        return (0);
    }
    if (symp) {
        if (symp.range && symp.range != SYM_CONTROL) {
            if (game.symset[which_set].handling == H_UTF8 || (lowc(__nh_char_at0(strval)) == 117 && __nh_char_at0(__nh_advance_str(strval, 1)) == 43)) {
                let buf = '';
                let glyph = 0;
                buf = nh_snprintf("parsesymbols", 836, buf, 256 /* sizeof(char [256]) */, "%s:%s", opts, strval);
                glyphrep_to_custom_map_entries(buf, { get value() { return glyph; }, set value(_v) { glyph = _v; } });
            } else {
                val = sym_val(strval);
                if (which_set == ROGUESET) {
                    update_ov_rogue_symset(symp, val);
                } else {
                    update_ov_primary_symset(symp, val);
                }
            }
        }
    }
    savedsym_add(opts, strval, which_set);
    return (1);
}
/* alt explosion names are numbered in phone key/button layout */
let __match_sym_alternates = [{ altnm: "S_armour", nm: "S_armor" }, { altnm: "S_explode1", nm: "S_expl_tl" }, { altnm: "S_explode2", nm: "S_expl_tc" }, { altnm: "S_explode3", nm: "S_expl_tr" }, { altnm: "S_explode4", nm: "S_expl_ml" }, { altnm: "S_explode5", nm: "S_expl_mc" }, { altnm: "S_explode6", nm: "S_expl_mr" }, { altnm: "S_explode7", nm: "S_expl_bl" }, { altnm: "S_explode8", nm: "S_expl_bc" }, { altnm: "S_explode9", nm: "S_expl_br" }];
export function match_sym(buf) {
    let i = 0;
    let len = strlen(buf);
    let p = strchr(buf, 58);
    let q = strchr(buf, 61);
    let sp = loadsyms;
    /* G_ lines will never match here */
    if ((__nh_char_at0(buf) == 71 || __nh_char_at0(buf) == 103) && __nh_char_at0(__nh_advance_str(buf, 1)) == 95) {
        return null;
    }
    if (!p || (q && q < p)) {
        p = q;
    }
    if (p) {
        /* note: there will be at most one space before the '='
           because caller has condensed buf[] with mungspaces() */
        if (p > buf && __nh_char_at0(__nh_advance_str(p, -1)) == 32) {
            (p = __nh_advance_str(p, -1));
        }
        len = ((buf.length - p.length));
    }
    const __nhi_sp_arr = sp;
    for (let __nhi_sp = 0; (sp = __nhi_sp_arr[__nhi_sp]) && (sp.range); __nhi_sp++) {
        if ((len >= strlen(sp.name)) && !strncmpi(buf, sp.name, len)) {
            return sp;
        }
    }
    for (i = 0; i < (Math.trunc(10 /* sizeof(struct alternate_parse [10]) */ / 1 /* sizeof(struct alternate_parse) */)); ++i) {
        if ((len >= strlen(__match_sym_alternates[i].altnm)) && !strncmpi(buf, __match_sym_alternates[i].altnm, len)) {
            sp = loadsyms;
            const __nhi_sp_arr = sp;
            for (let __nhi_sp = 0; (sp = __nhi_sp_arr[__nhi_sp]) && (sp.range); __nhi_sp++) {
                if (!strcmp(__match_sym_alternates[i].nm, sp.name)) {
                    return sp;
                }
            }
        }
    }
    return null;
}
/*
 * this is called from options.c to do the symset work.
 */
export function do_symset(rogueflag) {
    let tmpwin = 0;
    let any = 0;
    let n = 0;
    let buf = '';
    let symset_pick = null;
    let ready_to_switch = (0);
    let nothing_to_do = (0);
    let symset_name = null;
    let fmtstr = '';
    let sl = null;
    let res = 0;
    let which_set = 0;
    let setcount = 0;
    let chosen = -2;
    let defindx = 0;
    let clr = 8;
    which_set = rogueflag ? ROGUESET : PRIMARYSET;
    game.symset_list = null;
    /* clear symset[].name as a flag to read_sym_file() to build list */
    symset_name = game.symset[which_set].name;
    game.symset[which_set].name = null;
    res = read_sym_file(which_set);
    game.symset[which_set].name = symset_name;
    if (res && game.symset_list) {
        let thissize = 0;
        let biggest = (16 /* sizeof(char [16]) */ - 1 /* sizeof(char [1]) */);
        let big_desc = 0;
        for (sl = game.symset_list; sl; sl = sl.next) {
            if (rogueflag ? sl.primary : sl.rogue) {
                continue;
            }
            if (sl.handling == H_MAC) {
                continue;
            }
            setcount++;
            thissize = sl.name ? strlen(sl.name) : 0;
            if (thissize > biggest) {
                biggest = thissize;
            }
            thissize = sl.desc ? strlen(sl.desc) : 0;
            if (thissize > big_desc) {
                big_desc = thissize;
            }
        }
        if (!setcount) {
            There("are no appropriate %s symbol sets available.", rogueflag ? "rogue level" : "primary");
            return (1);
        }
        fmtstr = sprintf(fmtstr, "%%-%ds %%s", biggest + 2);
        tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(tmpwin, 0);
        any = cg.zeroany;
        /* -1 + 2 [see 'if (sl->name) {' below]*/
        any.a_int = 1;
        if (!symset_name) {
            defindx = any.a_int;
        }
        add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, "Default Symbols", (any.a_int == defindx) ? 1 : 0);
        for (sl = game.symset_list; sl; sl = sl.next) {
            if (rogueflag ? sl.primary : sl.rogue) {
                continue;
            }
            if (sl.handling == H_MAC) {
                continue;
            }
            if (sl.name) {
                /* +2: sl->idx runs from 0 to N-1 for N symsets;
                   +1 because Defaults are implicitly in slot [0];
                   +1 again so that valid data is never 0 */
                any.a_int = sl.idx + 2;
                if (symset_name && !strncmpi((sl.name), (symset_name), -1)) {
                    defindx = any.a_int;
                }
                buf = sprintf(buf, fmtstr, sl.name, sl.desc ? sl.desc : "");
                add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, (any.a_int == defindx) ? 1 : 0);
            }
        }
        buf = sprintf(buf, "Select %ssymbol set:", rogueflag ? "rogue level " : "");
        (game.windowprocs.win_end_menu)(tmpwin, buf);
        n = select_menu(tmpwin, 1, symset_pick);
        if (n > 0) {
            chosen = symset_pick[0].item.a_int;
            /* if picking non-preselected entry yields 2, make sure
               that we're going with the non-preselected one */
            if (n == 2 && chosen == defindx) {
                chosen = symset_pick[1].item.a_int;
            }
            /* convert menu index to symset index;
                          * "Default symbols" have index -1 */
            chosen -= 2;
            free(symset_pick);
        } else if (n == 0 && defindx > 0) {
            chosen = defindx - 2;
        }
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        if (chosen > -1) {
            /* chose an actual symset name from file */
            for (sl = game.symset_list; sl; sl = sl.next) {
                if (sl.idx == chosen) {
                    break;
                }
            }
            if (sl) {
                /* free the now stale attributes */
                /* explicit selection of defaults */
                /* free the now stale symset attributes */
                clear_symsetentry(which_set, (1));
                /* transfer only the name of the symbol set */
                game.symset[which_set].name = dupstr(sl.name);
                ready_to_switch = (1);
            }
        } else if (chosen == -1) {
            clear_symsetentry(which_set, (1));
        } else {
            nothing_to_do = (1);
        }
    } else if (!res) {
        /* The symbols file could not be accessed */
        pline("Unable to access \"%s\" file.", "symbols");
        return (1);
    } else if (!game.symset_list) {
        /* The symbols file was empty */
        There("were no symbol sets found in \"%s\".", "symbols");
        return (1);
    }
    while ((sl = game.symset_list) != null) {
        game.symset_list = sl.next;
        if (sl.name) {
            free(sl.name) , sl.name = null;
        }
        if (sl.desc) {
            free(sl.desc) , sl.desc = null;
        }
        free(sl);
    }
    if (nothing_to_do) {
        return (1);
    }
    if (rogueflag) {
        init_rogue_symbols();
    } else {
        init_primary_symbols();
    }
    if (game.symset[which_set].name) {
        let ok = 0;
        if (!glyphid_cache_status()) {
            fill_glyphid_cache();
        }
        ok = read_sym_file(which_set);
        if (glyphid_cache_status()) {
            free_glyphid_cache();
        }
        if (ok) {
            ready_to_switch = (1);
        } else {
            clear_symsetentry(which_set, (1));
            return (1);
        }
    }
    if (ready_to_switch) {
        switch_symbols((1));
    }
    if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        if (rogueflag) {
            assign_graphics(ROGUESET);
        }
    } else if (!rogueflag) {
        assign_graphics(PRIMARYSET);
    }
    apply_customizations(rogueflag ? ROGUESET : PRIMARYSET, (do_custom_symbols | do_custom_colors));
    (game.windowprocs.win_preference_update)("symset");
    return (1);
}
/*symbols.c*/
/* these intentionally have no defaults */
/* Adjust graphics display characters on Rogue levels */
