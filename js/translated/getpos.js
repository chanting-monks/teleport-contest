/* NetHack 5.0	getpos.c	$NHDT-Date: 1763708572 2025/11/20 23:02:52 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.6 $ */
/*-Copyright (c) Pasi Kallinen, 2023. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { You, pline } from '../c2js-runtime/pline.js';
import { qsort } from '../c2js-runtime/qsort.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strchr, strcmp, strcpy } from '../c2js-runtime/string.js';
import { cmd_from_func, cmdq_add_key, cmdq_clear, cmdq_pop, directionname, do_move_east, do_move_north, do_move_south, do_move_west, do_run, do_run_east, do_run_north, do_run_south, do_run_west, do_rush, isok, lock_mouse_buttons, movecmd, readchar_poskey, redraw_cmd, xytodir } from './cmd.js';
import { cg, quitchars } from './decl.js';
import { back_to_glyph, docrt_flags, flush_screen, glyph_at, nul_glyphinfo } from './display.js';
import { defsyms } from './drawing.js';
import { glyph_to_cmap } from './glyphs.js';
import { handle_tip, invocation_pos, is_valid_travelpt } from './hack.js';
import { strsubst, visctrl } from './hacklib.js';
import { BOULDER, CMDQ_DIR, CMDQ_KEY, CQ_CANNED, CQ_REPEAT, DOOR, FEMALE, FIRST_OBJECT, GFILTER_AREA, GFILTER_VIEW, GLOC_DOOR, GLOC_EXPLORE, GLOC_INTERESTING, GLOC_MONS, GLOC_OBJS, GLOC_VALID, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_NOTHING_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GLYPH_UNEXPLORED_OFF, LOOK_ONCE, LOOK_QUICK, LOOK_TRADITIONAL, LOOK_VERBOSE, MALE, MAXPCHARS, MV_RUN, MV_RUSH, MV_WALK, NHKF_ESC, NHKF_GETPOS_AUTODESC, NHKF_GETPOS_DOOR_NEXT, NHKF_GETPOS_DOOR_PREV, NHKF_GETPOS_HELP, NHKF_GETPOS_INTERESTING_NEXT, NHKF_GETPOS_INTERESTING_PREV, NHKF_GETPOS_LIMITVIEW, NHKF_GETPOS_MENU, NHKF_GETPOS_MON_NEXT, NHKF_GETPOS_MON_PREV, NHKF_GETPOS_MOVESKIP, NHKF_GETPOS_OBJ_NEXT, NHKF_GETPOS_OBJ_PREV, NHKF_GETPOS_PICK, NHKF_GETPOS_PICK_O, NHKF_GETPOS_PICK_Q, NHKF_GETPOS_PICK_V, NHKF_GETPOS_SELF, NHKF_GETPOS_SHOWVALID, NHKF_GETPOS_UNEX_NEXT, NHKF_GETPOS_UNEX_PREV, NHKF_GETPOS_VALID_NEXT, NHKF_GETPOS_VALID_PREV, NUMMONS, NUM_GFILTER, NUM_GLOCS, NUM_OBJECTS, PM_LONG_WORM_TAIL, ROCK, S_air, S_arrow_trap, S_bars, S_cloud, S_corr, S_darkroom, S_digbeam, S_engrcorr, S_engroom, S_fountain, S_goodpos, S_hcdbridge, S_hcdoor, S_ice, S_lava, S_lavawall, S_litcorr, S_ndoor, S_pool, S_room, S_stone, S_tree, S_trwall, S_upstair, S_vodbridge, S_vodoor, S_water, TIP_GETPOS, TRAPNUM, VIBRATING_SQUARE, docrtRefresh } from './nh-constants.js';
import { an } from './objnam.js';
import { do_screen_description, what_is_a_location } from './pager.js';
import { custompline } from './pline.js';
import { selection_floodfill, selection_force_newsyms, selection_free, selection_getpoint, selection_new, selection_setpoint, set_selection_floodfillchk } from './selvar.js';
import { t_at } from './trap.js';
import { add_menu, select_menu } from './windows.js';

/* from pager.c */
/* Callback function for getpos() to highlight desired map locations.
 * Parameter TRUE: initialize and highlight, FALSE: done (remove highlights).
 */
game.getpos_hilitefunc = null;
game.getpos_getvalid = null;
export const HiliteNormalMap = 0;
export const HiliteGoodposSymbol = 1;
export const HiliteBackground = 2;
game.getpos_hilite_state = HiliteNormalMap;
game.defaultHiliteState = HiliteNormalMap;
export function getpos_sethilite(gp_hilitef, gp_getvalidf) {
    let old_getvalid = game.getpos_getvalid;
    let old_map_frame_color = game.wsettings.map_frame_color;
    let sel = selection_new();
    game.defaultHiliteState = game.iflags.bgcolors ? HiliteBackground : HiliteNormalMap;
    if (gp_getvalidf != old_getvalid) {
        game.getpos_hilite_state = game.defaultHiliteState;
    }
    getpos_getvalids_selection(sel, game.getpos_getvalid);
    game.getpos_hilitefunc = gp_hilitef;
    game.getpos_getvalid = gp_getvalidf;
    getpos_getvalids_selection(sel, game.getpos_getvalid);
    game.wsettings.map_frame_color = (game.getpos_hilite_state == HiliteBackground) ? 12 : 8;
    if (game.getpos_getvalid != old_getvalid || game.wsettings.map_frame_color != old_map_frame_color) {
        selection_force_newsyms(sel);
    }
    selection_free(sel, (1));
}
/* cycle 'getpos_hilite_state' to its next state;
   when 'bgcolors' is Off, it will alternate between not showing valid
   positions and showing them via temporary S_goodpos symbol;
   when 'bgcolors' is On, there are three states and showing them via
   setting background color becomes the default */
export function getpos_toggle_hilite_state() {
    if (game.getpos_hilite_state == HiliteGoodposSymbol) {
        /* getpos_hilitefunc isn't Null */
        (game.getpos_hilitefunc)((0));
    }
    game.getpos_hilite_state = (game.getpos_hilite_state + 1) % (game.iflags.bgcolors ? 3 : 2);
    /* resetting the callback functions to their current values will draw
       valid-spots with background color if that is the new state and turn
       off that color if it was the previous state */
    getpos_sethilite(game.getpos_hilitefunc, game.getpos_getvalid);
    if (game.getpos_hilite_state == HiliteGoodposSymbol) {
        (game.getpos_hilitefunc)((1));
    }
}
export function mapxy_valid(x, y) {
    if (game.getpos_getvalid) {
        return (game.getpos_getvalid)(x, y);
    }
    return (0);
}
export function getpos_getvalids_selection(sel, validf) {
    let x = 0;
    let y = 0;
    if (!sel || !validf) {
        return;
    }
    for (x = 1; x < sel.wid; x++) {
        for (y = 0; y < sel.hei; y++) {
            if ((validf)(x, y)) {
                selection_setpoint(x, y, sel, 1);
            }
        }
    }
}
const gloc_descr = [["any monsters", "monster", "next/previous monster", "monsters"], ["any items", "item", "next/previous object", "objects"], ["any doors", "door", "next/previous door or doorway", "doors or doorways"], ["any unexplored areas", "unexplored area", "unexplored location", "locations next to unexplored locations"], ["anything interesting", "interesting thing", "anything interesting", "anything interesting"], ["any valid locations", "valid location", "valid location", "valid locations"]];
const gloc_filtertxt = ["", " in view", " in this area"];
export function getpos_help_keyxhelp(tmpwin, k1, k2, gloc) {
    let sbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let fbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let move_cursor_to = "move the cursor to ";
    let filtertxt = gloc_filtertxt[game.iflags.getloc_filter];
    if (gloc == GLOC_EXPLORE) {
        /* default of "move to unexplored location" is inaccurate
           because the position will be one spot short of that */
        move_cursor_to = "move the cursor next to an ";
        if (game.iflags.getloc_usemenu) {
            filtertxt = strsubst(strcpy(fbuf, filtertxt), "this area", "area");
        }
    }
    sbuf = sprintf(sbuf, "Use '%s'/'%s' to %s%s%s.", k1, k2, game.iflags.getloc_usemenu ? "get a menu of " : move_cursor_to, gloc_descr[gloc][2 + game.iflags.getloc_usemenu], filtertxt);
    (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
}
/* the response for '?' help request in getpos() */
const __getpos_help_fastmovemode = ["8 units at a time", "skipping same glyphs"];
export function getpos_help(force, goal) {
    let sbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let doing_what_is = 0;
    let tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    sbuf = sprintf(sbuf, "Use '%s', '%s', '%s', '%s' to move the cursor to %s.", visctrl(cmd_from_func(do_move_west)), visctrl(cmd_from_func(do_move_south)), visctrl(cmd_from_func(do_move_north)), visctrl(cmd_from_func(do_move_east)), goal);
    (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
    sbuf = sprintf(sbuf, "Use '%s', '%s', '%s', '%s' to fast-move the cursor, %s.", visctrl(cmd_from_func(do_run_west)), visctrl(cmd_from_func(do_run_south)), visctrl(cmd_from_func(do_run_north)), visctrl(cmd_from_func(do_run_east)), __getpos_help_fastmovemode[game.iflags.getloc_moveskip]);
    (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
    sbuf = sprintf(sbuf, "(or prefix normal move with '%s' or '%s' to fast-move)", visctrl(cmd_from_func(do_run)), visctrl(cmd_from_func(do_rush)));
    (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
    (game.windowprocs.win_putstr)(tmpwin, 0, "Or enter a background symbol (ex. '<').");
    sbuf = sprintf(sbuf, "Use '%s' to move the cursor on yourself.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_SELF]));
    (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
    if (!game.iflags.terrainmode || (game.iflags.terrainmode & 8) != 0) {
        getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_MON_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_MON_PREV]), GLOC_MONS);
    }
    /* skip_non_mons-flag fix */
    let __goto_skip_non_mons = (0);
    if (goal && !strcmp(goal, "a monster")) {
        __goto_skip_non_mons = (1);
    }
    if (!__goto_skip_non_mons) {
        if (!game.iflags.terrainmode || (game.iflags.terrainmode & 4) != 0) {
            getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_OBJ_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_OBJ_PREV]), GLOC_OBJS);
        }
        if (!game.iflags.terrainmode || (game.iflags.terrainmode & 1) != 0) {
            /* these are primarily useful when choosing a travel
           destination for the '_' command */
            getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_DOOR_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_DOOR_PREV]), GLOC_DOOR);
            getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_UNEX_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_UNEX_PREV]), GLOC_EXPLORE);
            getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_INTERESTING_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_INTERESTING_PREV]), GLOC_INTERESTING);
        }
        sbuf = sprintf(sbuf, "Use '%s' to change fast-move mode to %s.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_MOVESKIP]), __getpos_help_fastmovemode[!game.iflags.getloc_moveskip]);
        (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
        if (!game.iflags.terrainmode || (game.iflags.terrainmode & 32) == 0) {
            sbuf = sprintf(sbuf, "Use '%s' to toggle menu listing for possible targets.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_MENU]));
            (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
            sbuf = sprintf(sbuf, "Use '%s' to change the mode of limiting possible targets.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_LIMITVIEW]));
            (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
        }
    }
    if (__goto_skip_non_mons || !game.iflags.terrainmode) {
        let kbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        skip_non_mons: {
            if (game.getpos_getvalid) {
                sbuf = sprintf(sbuf, "Use '%s' or '%s' to move to valid locations.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_VALID_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_VALID_PREV]));
                (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
            }
            if (game.getpos_hilitefunc) {
                sbuf = sprintf(sbuf, "Use '%s' to toggle marking of valid locations.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_SHOWVALID]));
                (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
            }
            sbuf = sprintf(sbuf, "Use '%s' to toggle automatic description.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_AUTODESC]));
            (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
            /* assisting the '/' command, I suppose... */
            if (game.iflags.cmdassist) {
                sbuf = sprintf(sbuf, (game.iflags.getpos_coords == 110) ? "(Set 'whatis_coord' option to include coordinates with '%s' text.)" : "(Reset 'whatis_coord' option to omit coordinates from '%s' text.)", visctrl(game.Cmd.spkeys[NHKF_GETPOS_AUTODESC]));
            }
        }
        doing_what_is = (goal == what_is_a_location);
        /* disgusting hack; the alternate selection characters work for any
           getpos call, but only matter for dowhatis (and doquickwhatis,
           also for dotherecmdmenu's simulated mouse) */
        if (doing_what_is) {
            kbuf = sprintf(kbuf, "'%s' or '%s' or '%s' or '%s'", visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK_Q]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK_O]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK_V]));
        } else {
            kbuf = sprintf(kbuf, "'%s'", visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK]));
        }
        nh_snprintf("getpos_help", 280, sbuf, 256 /* sizeof(char [256]) */, "Type a %s when you are at the right place.", kbuf);
        (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
        if (doing_what_is) {
            sbuf = sprintf(sbuf, "  '%s' describe current spot, show 'more info', move to another spot.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK_V]));
            (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
            sbuf = sprintf(sbuf, "  '%s' describe current spot,%s move to another spot;", visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK]), game.flags.help && !force ? " prompt if 'more info'," : "");
            (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
            sbuf = sprintf(sbuf, "  '%s' describe current spot, move to another spot;", visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK_Q]));
            (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
            sbuf = sprintf(sbuf, "  '%s' describe current spot, stop looking at things;", visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK_O]));
            (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
        }
    }
    if (!force) {
        (game.windowprocs.win_putstr)(tmpwin, 0, "Type Space or Escape when you're done.");
    }
    (game.windowprocs.win_putstr)(tmpwin, 0, "");
    (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
}
export function cmp_coord_distu(a, b) {
    let c1 = a;
    let c2 = b;
    /* [12] suffices: "[%02d,%02d]" */
    let dx = 0;
    let dy = 0;
    let dist_1 = 0;
    let dist_2 = 0;
    dx = game.u.ux - c1.x;
    dy = game.u.uy - c1.y;
    dist_1 = ((abs(dx)) > (abs(dy)) ? (abs(dx)) : (abs(dy)));
    dx = game.u.ux - c2.x;
    dy = game.u.uy - c2.y;
    dist_2 = ((abs(dx)) > (abs(dy)) ? (abs(dx)) : (abs(dy)));
    if (dist_1 == dist_2) {
        return (c1.y != c2.y) ? (c1.y - c2.y) : (c1.x - c2.x);
    }
    return dist_1 - dist_2;
}
export function gloc_filter_classify_glyph(glyph) {
    let c = 0;
    if (!((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1)))) {
        return 0;
    }
    c = glyph_to_cmap(glyph);
    if (((c) >= S_room && (c) <= S_darkroom) || ((c) >= S_upstair && (c) <= S_fountain)) {
        return 1;
    } else if (((c) >= S_stone && (c) <= S_trwall) || c == S_tree) {
        return 2;
    } else if (((c) >= S_corr && (c) <= S_litcorr)) {
        return 3;
    } else if (((c) == S_pool || (c) == S_water)) {
        return 4;
    } else if (((c) == S_lava || (c) == S_lavawall)) {
        return 5;
    }
    return 0;
}
export function gloc_filter_floodfill_matcharea(x, y) {
    let glyph = back_to_glyph(x, y);
    if (!game.level.locations[x][y].seenv) {
        return (0);
    }
    if (glyph == game.gloc_filter_floodfill_match_glyph) {
        return (1);
    }
    if (gloc_filter_classify_glyph(glyph) == gloc_filter_classify_glyph(game.gloc_filter_floodfill_match_glyph)) {
        return (1);
    }
    return (0);
}
export function gloc_filter_floodfill(x, y) {
    game.gloc_filter_floodfill_match_glyph = back_to_glyph(x, y);
    set_selection_floodfillchk(gloc_filter_floodfill_matcharea);
    selection_floodfill(game.gloc_filter_map, x, y, (0));
}
export function gloc_filter_init() {
    if (game.iflags.getloc_filter == GFILTER_AREA) {
        if (!game.gloc_filter_map) {
            game.gloc_filter_map = selection_new();
        }
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == DOOR)) {
            if ((game.u.dx || game.u.dy) && isok(game.u.ux + game.u.dx, game.u.uy + game.u.dy)) {
                /* special case: if we're in a doorway, try to figure out which
           direction we're moving, and use that side of the doorway */
                gloc_filter_floodfill(game.u.ux + game.u.dx, game.u.uy + game.u.dy);
            } else { /* TODO: maybe add both sides of the doorway? */ }
        } else {
            gloc_filter_floodfill(game.u.ux, game.u.uy);
        }
    }
}
export function gloc_filter_done() {
    if (game.gloc_filter_map) {
        selection_free(game.gloc_filter_map, (1));
        game.gloc_filter_map = null;
    }
}
export function known_vibrating_square_at(x, y) {
    if (invocation_pos(x, y)) {
        /* note: this only acknowledges the genuine vibrating square, not
       fake ones produced by wizard mode wishing for traps which could
       possibly be transfered to normal play via bones file */
        let ttmp = t_at(x, y);
        return ttmp && ttmp.ttyp == VIBRATING_SQUARE && ttmp.tseen;
    }
    return (0);
}
export function gather_locs_interesting(x, y, gloc) {
    let glyph = 0;
    let sym = 0;
    if (game.iflags.getloc_filter == GFILTER_VIEW && !((game.viz_array[y][x] & 2) != 0)) {
        return (0);
    }
    if (game.iflags.getloc_filter == GFILTER_AREA && !(isok((x), (y)) && (selection_getpoint((x), (y), game.gloc_filter_map))) && !(isok((x - 1), (y)) && (selection_getpoint((x - 1), (y), game.gloc_filter_map))) && !(isok((x), (y - 1)) && (selection_getpoint((x), (y - 1), game.gloc_filter_map))) && !(isok((x + 1), (y)) && (selection_getpoint((x + 1), (y), game.gloc_filter_map))) && !(isok((x), (y + 1)) && (selection_getpoint((x), (y + 1), game.gloc_filter_map)))) {
        return (0);
    }
    glyph = glyph_at(x, y);
    sym = ((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) ? glyph_to_cmap(glyph) : -1;
    switch (gloc) {
        default:
        case GLOC_MONS:
            return (((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) && glyph != ((PM_LONG_WORM_TAIL) + (((MALE) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) && glyph != ((PM_LONG_WORM_TAIL) + (((FEMALE) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)));
        case GLOC_OBJS:
            return ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS))))) && glyph != ((BOULDER) + GLYPH_OBJ_OFF) && glyph != ((ROCK) + GLYPH_OBJ_OFF));
        case GLOC_DOOR:
            return (((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && (((sym) >= S_vodoor && (sym) <= S_hcdoor) || ((sym) >= S_vodbridge && (sym) <= S_hcdbridge) || sym == S_ndoor));
        case GLOC_EXPLORE:
            return (((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && !((glyph_to_cmap(glyph)) == GLYPH_NOTHING_OFF) && (((sym) >= S_vodoor && (sym) <= S_hcdoor) || ((sym) >= S_vodbridge && (sym) <= S_hcdbridge) || sym == S_ndoor || ((sym) >= S_room && (sym) <= S_darkroom) || ((sym) >= S_corr && (sym) <= S_litcorr)) && ((isok((x + 1), (y)) && ((game.level.locations[(x + 1)][(y)].glyph) == GLYPH_UNEXPLORED_OFF) && !game.level.locations[(x + 1)][(y)].seenv) || (isok((x - 1), (y)) && ((game.level.locations[(x - 1)][(y)].glyph) == GLYPH_UNEXPLORED_OFF) && !game.level.locations[(x - 1)][(y)].seenv) || (isok((x), (y + 1)) && ((game.level.locations[(x)][(y + 1)].glyph) == GLYPH_UNEXPLORED_OFF) && !game.level.locations[(x)][(y + 1)].seenv) || (isok((x), (y - 1)) && ((game.level.locations[(x)][(y - 1)].glyph) == GLYPH_UNEXPLORED_OFF) && !game.level.locations[(x)][(y - 1)].seenv)));
        case GLOC_VALID:
            if (game.getpos_getvalid) {
                return (game.getpos_getvalid)(x, y);
            }
            ;
        case GLOC_INTERESTING:
            return (gather_locs_interesting(x, y, GLOC_DOOR) || !((((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && (((sym) >= S_stone && (sym) <= S_trwall) || sym == S_tree || sym == S_bars || sym == S_ice || sym == S_air || sym == S_cloud || ((sym) == S_lava || (sym) == S_lavawall) || ((sym) == S_pool || (sym) == S_water) || sym == S_ndoor || ((sym) >= S_room && (sym) <= S_darkroom) || ((sym) >= S_corr && (sym) <= S_litcorr))) || ((glyph) == GLYPH_NOTHING_OFF) || ((glyph) == GLYPH_UNEXPLORED_OFF)) || known_vibrating_square_at(x, y));
    }
    return (0);
}
/* gather locations for monsters or objects shown on the map */
export function gather_locs(arr_p, cnt_p, gloc) {
    let pass = 0;
    let idx = 0;
    let x = 0;
    let y = 0;
    /*
     * We always include the hero's location even if there is no monster
     * (invisible hero without see invisible) or object (usual case)
     * displayed there.  That way, the count will always be at least 1,
     * and player has a visual indicator (cursor returns to hero's spot)
     * highlighting when successive 'm's or 'o's have cycled all the way
     * through all monsters or objects.
     *
     * Hero's spot will always sort to array[0] because it will always
     * be the shortest distance (namely, 0 units) away from <u.ux,u.uy>.
     */
    gloc_filter_init();
    cnt_p.value = idx = 0;
    for (pass = 0; pass < 2; pass++) {
        for (x = 1; x < 80; x++) {
            for (y = 0; y < 21; y++) {
                if (((x) == game.u.ux && (y) == game.u.uy) || gather_locs_interesting(x, y, gloc)) {
                    if (!pass) {
                        ++cnt_p.value;
                    } else {
                        (arr_p.value)[idx].x = x;
                        (arr_p.value)[idx].y = y;
                        ++idx;
                    }
                }
            }
        }
        if (!pass) {
            arr_p.value = alloc(cnt_p.value * 1 /* sizeof(coord) */);
        } else {
            qsort(arr_p.value, cnt_p.value, 1 /* sizeof(coord) */, cmp_coord_distu);
        }
    }
    gloc_filter_done();
}
let __dxdy_to_dist_descr_buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const __dxdy_to_dist_descr_dirnames = [["n", "north"], ["s", "south"], ["w", "west"], ["e", "east"]];
export function dxdy_to_dist_descr(dx, dy, fulldir) {
    let dst = 0;
    if (!dx && !dy) {
        __dxdy_to_dist_descr_buf = sprintf(__dxdy_to_dist_descr_buf, "here");
    } else if ((dst = xytodir(dx, dy)) != -1) {
        __dxdy_to_dist_descr_buf = sprintf(__dxdy_to_dist_descr_buf, "%s", directionname(dst));
    } else {
        __dxdy_to_dist_descr_buf[0] = 0;
        if (dy) {
            /* explicit direction; 'one step' is implicit */
            /* 9999: protect buf[] against overflow caused by invalid values */
            if (abs(dy) > 9999) {
                dy = sgn(dy) * 9999;
            }
            buf = (buf || '') + sprintf('', "%d%s%s", abs(dy), __dxdy_to_dist_descr_dirnames[(dy > 0)][fulldir], dx ? "," : "");
        }
        if (dx) {
            if (abs(dx) > 9999) {
                dx = sgn(dx) * 9999;
            }
            buf = (buf || '') + sprintf('', "%d%s", abs(dx), __dxdy_to_dist_descr_dirnames[2 + (dx > 0)][fulldir]);
        }
    }
    return __dxdy_to_dist_descr_buf;
}
/* coordinate formatting for 'whatis_coord' option */
let __coord_desc_screen_fmt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function coord_desc(x, y, outbuf, cmode) {
    let dx = 0;
    let dy = 0;
    outbuf[0] = 0;
    switch (cmode) {
        default:
            /* map line 0 is screen row 2;
           map column 0 isn't used, map column 1 is screen column 1 */
            break;
        case 102:
        case 99:
            dx = x - game.u.ux;
            dy = y - game.u.uy;
            outbuf = sprintf(outbuf, "(%s)", dxdy_to_dist_descr(dx, dy, cmode == 102));
            break;
        case 109:
            outbuf = sprintf(outbuf, "<%d,%d>", x, y);
            break;
        case 115:
            if (!__coord_desc_screen_fmt) {
                __coord_desc_screen_fmt = sprintf(__coord_desc_screen_fmt, "[%%%sd,%%%sd]", (21 - 1 + 2 < (100)) ? "02" : "03", (80 - 1 < (100)) ? "02" : "03");
            }
            outbuf = sprintf(outbuf, __coord_desc_screen_fmt, y + 2, x);
            break;
    }
    return outbuf;
}
export function auto_describe(cx, cy) {
    let cc = { x: 0, y: 0 };
    let sym = 0;
    let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let firstmatch = "unknown";
    cc.x = cx;
    cc.y = cy;
    if (do_screen_description(cc, (1), sym, tmpbuf, { get value() { return firstmatch; }, set value(_v) { firstmatch = _v; } }, null)) {
        coord_desc(cx, cy, tmpbuf, game.iflags.getpos_coords);
        custompline((4 | 2 | 64), "%s%s%s%s%s", firstmatch, tmpbuf ? " " : "", tmpbuf, (game.iflags.autodescribe && game.getpos_getvalid && !(game.getpos_getvalid)(cx, cy)) ? " (invalid target)" : "", (game.iflags.getloc_travelmode && !is_valid_travelpt(cx, cy)) ? " (no travel path)" : "");
        (game.windowprocs.win_curs)(game.WIN_MAP, cx, cy);
        flush_screen(0);
    }
}
export function getpos_menu(ccp, gloc) {
    let garr = [null];
    let gcount = 0;
    let tmpwin = 0;
    let any = 0;
    let i = 0;
    let pick_cnt = 0;
    let picks = null;
    let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let clr = 8;
    gather_locs({ get value() { return garr; }, set value(_v) { garr = _v; } }, { get value() { return gcount; }, set value(_v) { gcount = _v; } }, gloc);
    if (gcount < 2) {
        /* gcount always includes the hero */
        free(garr);
        You("cannot %s %s.", (game.iflags.getloc_filter == GFILTER_VIEW) ? "see" : "detect", gloc_descr[gloc][0]);
        return (0);
    }
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    any = cg.zeroany;
    for (i = 1; i < gcount; i++) {
        /* gather_locs returns array[0] == you. skip it. */
        let fullbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let tmpcc = { x: 0, y: 0 };
        let firstmatch = "unknown";
        let sym = 0;
        any.a_int = i + 1;
        tmpcc.x = garr[i].x;
        tmpcc.y = garr[i].y;
        if (do_screen_description(tmpcc, (1), sym, tmpbuf, { get value() { return firstmatch; }, set value(_v) { firstmatch = _v; } }, null)) {
            coord_desc(garr[i].x, garr[i].y, tmpbuf, game.iflags.getpos_coords);
            nh_snprintf("getpos_menu", 705, fullbuf, 256 /* sizeof(char [256]) */, "%s%s%s", firstmatch, (tmpbuf ? " " : ""), tmpbuf);
            add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, fullbuf, 0);
        }
    }
    tmpbuf = sprintf(tmpbuf, "Pick %s%s%s", an(gloc_descr[gloc][1]), gloc_filtertxt[game.iflags.getloc_filter], game.iflags.getloc_travelmode ? " for travel destination" : "");
    (game.windowprocs.win_end_menu)(tmpwin, tmpbuf);
    pick_cnt = select_menu(tmpwin, 1, picks);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (pick_cnt > 0) {
        ccp.x = garr[picks.item.a_int - 1].x;
        ccp.y = garr[picks.item.a_int - 1].y;
        free(picks);
    }
    free(garr);
    return (pick_cnt > 0);
}
/* add dx,dy to cx,cy, truncating at map edges */
export function truncate_to_map(cx, cy, dx, dy) {
    if (cx.value + dx < 1) {
        /* diagonal moves complicate this... */
        dy -= sgn(dy) * (1 - (cx.value + dx));
        dx = 1 - cx.value;
    } else if (cx.value + dx > 80 - 1) {
        dy += sgn(dy) * ((80 - 1) - (cx.value + dx));
        dx = (80 - 1) - cx.value;
    }
    if (cy.value + dy < 0) {
        dx -= sgn(dx) * (0 - (cy.value + dy));
        dy = 0 - cy.value;
    } else if (cy.value + dy > 21 - 1) {
        dx += sgn(dx) * ((21 - 1) - (cy.value + dy));
        dy = (21 - 1) - cy.value;
    }
    cx.value += dx;
    cy.value += dy;
}
/* called when ^R typed; if '$' is being shown for valid spots, remove that;
   if alternate background color is being shown for that, redraw it */
export function getpos_refresh() {
    if (game.getpos_hilitefunc && game.getpos_hilite_state == HiliteGoodposSymbol) {
        (game.getpos_hilitefunc)((0));
        game.getpos_hilite_state = game.defaultHiliteState;
    }
    docrt_flags(docrtRefresh);
    if (game.getpos_hilitefunc && game.getpos_hilite_state == HiliteBackground) {
        /* resetting to current values will draw valid-spots highlighting */
        getpos_sethilite(game.getpos_hilitefunc, game.getpos_getvalid);
    }
}
/* have the player use movement keystrokes to position the cursor at a
   particular map location, then use one of [.,:;] to pick the spot */
const __getpos_pick_chars_def = [{ nhkf: NHKF_GETPOS_PICK, ret: LOOK_TRADITIONAL }, { nhkf: NHKF_GETPOS_PICK_Q, ret: LOOK_QUICK }, { nhkf: NHKF_GETPOS_PICK_O, ret: LOOK_ONCE }, { nhkf: NHKF_GETPOS_PICK_V, ret: LOOK_VERBOSE }];
const __getpos_mMoOdDxX_def = [NHKF_GETPOS_MON_NEXT, NHKF_GETPOS_MON_PREV, NHKF_GETPOS_OBJ_NEXT, NHKF_GETPOS_OBJ_PREV, NHKF_GETPOS_DOOR_NEXT, NHKF_GETPOS_DOOR_PREV, NHKF_GETPOS_UNEX_NEXT, NHKF_GETPOS_UNEX_PREV, NHKF_GETPOS_INTERESTING_NEXT, NHKF_GETPOS_INTERESTING_PREV, NHKF_GETPOS_VALID_NEXT, NHKF_GETPOS_VALID_PREV];
const __getpos_view_filters = ["Not limiting targets", "Limiting targets to those in sight", "Limiting targets to those in same area"];
export function getpos(ccp, force, goal) {
    let cq = { typ: 0, key: 0, dirx: 0, diry: 0, dirz: 0, intval: 0, ec_entry: null, next: null };
    let cmdq = null;
    let cp = null;
    let pick_chars = [0, 0, 0, 0, 0, 0];
    let mMoOdDxX = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let result = 0;
    let i = 0;
    let c = 0;
    let sidx = 0;
    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;
    let msg_given = 0;
    let show_goal_msg = 0;
    let garr = [null, null, null, null, null, null];
    let gcount = [0, 0, 0, 0, 0, 0];
    let gidx = [0, 0, 0, 0, 0, 0];
    let udx = 0;
    let udy = 0;
    let udz = 0;
    let dx = 0;
    let dy = 0;
    let rushrun = 0;
    exitgetpos: {
        result = 0;
        tx = game.u.ux;
        ty = game.u.uy;
        /* clear message window by default */
        msg_given = (1);
        show_goal_msg = (0);
        garr = [null, null, null, null, null, null];
        gcount = [0, 0, 0, 0, 0, 0];
        gidx = [0, 0, 0, 0, 0, 0];
        udx = game.u.dx;
        udy = game.u.dy;
        udz = game.u.dz;
        rushrun = (0);
        if (!game.in_doagain) {
            if ((cmdq = cmdq_pop()) != null) {
                /* temporary? if we have a queued direction, return the adjacent spot
       in that direction */
                Object.assign(cq, cmdq);
                free(cmdq);
                if (cq.typ == CMDQ_DIR && !cq.dirz) {
                    ccp.x = game.u.ux + cq.dirx;
                    ccp.y = game.u.uy + cq.diry;
                } else {
                    cmdq_clear(CQ_CANNED);
                    result = -1;
                }
                return result;
            }
        }
        for (i = 0; i < (Math.trunc(4 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/getpos.c:773:12) [4]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/getpos.c:773:12)) */)); i++) {
            pick_chars[i] = game.Cmd.spkeys[__getpos_pick_chars_def[i].nhkf];
        }
        pick_chars[(Math.trunc(4 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/getpos.c:773:12) [4]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/getpos.c:773:12)) */))] = 0;
        for (i = 0; i < (Math.trunc(48 /* sizeof(const int [12]) */ / 4 /* sizeof(const int) */)); i++) {
            mMoOdDxX[i] = game.Cmd.spkeys[__getpos_mMoOdDxX_def[i]];
        }
        mMoOdDxX[(Math.trunc(48 /* sizeof(const int [12]) */ / 4 /* sizeof(const int) */))] = 0;
        if (handle_tip(TIP_GETPOS)) {
            show_goal_msg = (1);
        }
        /* tip has overwritten prompt in mesg window */
        if (!goal) {
            goal = "desired location";
        }
        if (game.flags.verbose) {
            pline("(For instructions type a '%s')", visctrl(game.Cmd.spkeys[NHKF_GETPOS_HELP]));
            msg_given = (1);
        }
        cx = game.getposx = ccp.x;
        cy = game.getposy = ccp.y;
        (game.windowprocs.win_cliparound)(cx, cy);
        (game.windowprocs.win_curs)(game.WIN_MAP, cx, cy);
        flush_screen(0);
        lock_mouse_buttons((1));
        for (; ; ) {
            nxtc: {
                if (show_goal_msg) {
                    pline("Move cursor to %s:", goal);
                    (game.windowprocs.win_curs)(game.WIN_MAP, cx, cy);
                    flush_screen(0);
                    show_goal_msg = (0);
                } else if (game.iflags.autodescribe && !msg_given) {
                    auto_describe(cx, cy);
                }
                rushrun = (0);
                if ((cmdq = cmdq_pop()) != null) {
                    if (cmdq.typ == CMDQ_KEY) {
                        c = cmdq.key;
                    } else {
                        cmdq_clear(CQ_CANNED);
                        result = -1;
                        break exitgetpos;
                    }
                    free(cmdq);
                } else {
                    c = readchar_poskey({ get value() { return tx; }, set value(_v) { tx = _v; } }, { get value() { return ty; }, set value(_v) { ty = _v; } }, { get value() { return sidx; }, set value(_v) { sidx = _v; } });
                    /* remember_getpos is normally False because reusing the
               cursor positioning during ^A is almost never the right
               thing to do, but caller could set it if that was needed */
                    if (game.iflags.remember_getpos && !game.in_doagain) {
                        cmdq_add_key(CQ_REPEAT, c);
                    }
                }
                if (game.iflags.autodescribe) {
                    msg_given = (0);
                }
                if (c == game.Cmd.spkeys[NHKF_ESC]) {
                    cx = cy = -10;
                    msg_given = (1);
                    result = -1;
                    break;
                }
                if (c == cmd_from_func(do_run) || c == cmd_from_func(do_rush)) {
                    c = readchar_poskey({ get value() { return tx; }, set value(_v) { tx = _v; } }, { get value() { return ty; }, set value(_v) { ty = _v; } }, { get value() { return sidx; }, set value(_v) { sidx = _v; } });
                    rushrun = (1);
                }
                if (c == 0) {
                    if (!isok(tx, ty)) {
                        continue;
                    }
                    /* a mouse click event, just assign and return */
                    cx = tx;
                    cy = ty;
                    break;
                }
                if ((cp = strchr(pick_chars, c)) != null) {
                    /* '.' => 0, ',' => 1, ';' => 2, ':' => 3 */
                    result = __getpos_pick_chars_def[(cp - pick_chars)].ret;
                    break;
                } else if (movecmd(c, MV_WALK)) {
                    if (rushrun) {
                        if (game.iflags.getloc_moveskip) {
                            let glyph = glyph_at(cx, cy);
                            dx = game.u.dx;
                            dy = game.u.dy;
                            while (isok(cx + dx, cy + dy) && glyph == glyph_at(cx + dx, cy + dy) && isok(cx + dx + game.u.dx, cy + dy + game.u.dy) && glyph == glyph_at(cx + dx + game.u.dx, cy + dy + game.u.dy)) {
                                dx += game.u.dx;
                                dy += game.u.dy;
                            }
                        } else {
                            dx = 8 * game.u.dx;
                            dy = 8 * game.u.dy;
                        }
                        truncate_to_map({ get value() { return cx; }, set value(_v) { cx = _v; } }, { get value() { return cy; }, set value(_v) { cy = _v; } }, dx, dy);
                        break nxtc;
                    }
                    dx = game.u.dx;
                    dy = game.u.dy;
                    truncate_to_map({ get value() { return cx; }, set value(_v) { cx = _v; } }, { get value() { return cy; }, set value(_v) { cy = _v; } }, dx, dy);
                    break nxtc;
                } else if (movecmd(c, MV_RUSH) || movecmd(c, MV_RUN)) {
                    if (game.iflags.getloc_moveskip) {
                        let glyph = glyph_at(cx, cy);
                        dx = game.u.dx;
                        dy = game.u.dy;
                        while (isok(cx + dx, cy + dy) && glyph == glyph_at(cx + dx, cy + dy) && isok(cx + dx + game.u.dx, cy + dy + game.u.dy) && glyph == glyph_at(cx + dx + game.u.dx, cy + dy + game.u.dy)) {
                            dx += game.u.dx;
                            dy += game.u.dy;
                        }
                    } else {
                        dx = 8 * game.u.dx;
                        dy = 8 * game.u.dy;
                    }
                    truncate_to_map({ get value() { return cx; }, set value(_v) { cx = _v; } }, { get value() { return cy; }, set value(_v) { cy = _v; } }, dx, dy);
                    break nxtc;
                }
                if (c == game.Cmd.spkeys[NHKF_GETPOS_HELP] || redraw_cmd(c)) {
                    /* '?' will redraw twice, first when removing popup text window
               after showing the help text, then to reset highlighting */
                    if (c == game.Cmd.spkeys[NHKF_GETPOS_HELP]) {
                        getpos_help(force, goal);
                    }
                    /* ^R: docrt(), hilite_state = default */
                    getpos_refresh();
                    (game.windowprocs.win_curs)(game.WIN_MAP, cx, cy);
                    /* update message window to reflect that we're still targeting */
                    show_goal_msg = (1);
                } else if (c == game.Cmd.spkeys[NHKF_GETPOS_SHOWVALID]) {
                    if (game.getpos_hilitefunc) {
                        getpos_toggle_hilite_state();
                        (game.windowprocs.win_curs)(game.WIN_MAP, cx, cy);
                    }
                    show_goal_msg = (1);
                    break nxtc;
                } else if (c == game.Cmd.spkeys[NHKF_GETPOS_AUTODESC]) {
                    game.iflags.autodescribe = !game.iflags.autodescribe;
                    pline("Automatic description %sis %s.", game.flags.verbose ? "of features under cursor " : "", game.iflags.autodescribe ? "on" : "off");
                    if (!game.iflags.autodescribe) {
                        show_goal_msg = (1);
                    }
                    msg_given = (1);
                    break nxtc;
                } else if (c == game.Cmd.spkeys[NHKF_GETPOS_LIMITVIEW]) {
                    game.iflags.getloc_filter = (game.iflags.getloc_filter + 1) % NUM_GFILTER;
                    for (i = 0; i < NUM_GLOCS; i++) {
                        if (garr[i]) {
                            free(garr[i]);
                            garr[i] = null;
                        }
                        gidx[i] = gcount[i] = 0;
                    }
                    pline("%s.", __getpos_view_filters[game.iflags.getloc_filter]);
                    msg_given = (1);
                    break nxtc;
                } else if (c == game.Cmd.spkeys[NHKF_GETPOS_MENU]) {
                    game.iflags.getloc_usemenu = !game.iflags.getloc_usemenu;
                    pline("%s a menu to show possible targets%s.", game.iflags.getloc_usemenu ? "Using" : "Not using", game.iflags.getloc_usemenu ? " for 'm|M', 'o|O', 'd|D', and 'x|X'" : "");
                    msg_given = (1);
                    break nxtc;
                } else if (c == game.Cmd.spkeys[NHKF_GETPOS_SELF]) {
                    /* reset 'm&M', 'o&O', &c; otherwise, there's no way for player
               to achieve that except by manually cycling through all spots */
                    for (i = 0; i < NUM_GLOCS; i++) {
                        gidx[i] = 0;
                    }
                    cx = game.u.ux;
                    cy = game.u.uy;
                    break nxtc;
                } else if (c == game.Cmd.spkeys[NHKF_GETPOS_MOVESKIP]) {
                    game.iflags.getloc_moveskip = !game.iflags.getloc_moveskip;
                    pline("%skipping over similar terrain when fastmoving the cursor.", game.iflags.getloc_moveskip ? "S" : "Not s");
                    msg_given = (1);
                    break nxtc;
                } else if ((cp = strchr(mMoOdDxX, c)) != null) {
                    /* nearest or farthest monster or object or door or unexplored */
                    let gtmp = (cp - mMoOdDxX);
                    let gloc = gtmp >> 1;
                    if (game.iflags.getloc_usemenu) {
                        let tmpcrd = { x: 0, y: 0 };
                        if (getpos_menu(tmpcrd, gloc)) {
                            cx = tmpcrd.x;
                            cy = tmpcrd.y;
                        }
                        break nxtc;
                    }
                    if (!garr[gloc]) {
                        gather_locs({ get value() { return garr[gloc]; }, set value(_v) { garr[gloc] = _v; } }, { get value() { return gcount[gloc]; }, set value(_v) { gcount[gloc] = _v; } }, gloc);
                        /* garr[][0] is hero's spot */
                        gidx[gloc] = 0;
                    }
                    if (!(gtmp & 1)) {
                        /* c=='m' || c=='o' || c=='d' || c=='x') */
                        gidx[gloc] = (gidx[gloc] + 1) % gcount[gloc];
                    } else {
                        /* c=='M' || c=='O' || c=='D' || c=='X') */
                        if (--gidx[gloc] < 0) {
                            gidx[gloc] = gcount[gloc] - 1;
                        }
                    }
                    cx = garr[gloc][gidx[gloc]].x;
                    cy = garr[gloc][gidx[gloc]].y;
                    break nxtc;
                } else {
                    if (!strchr(quitchars, c)) {
                        let matching = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        let pass = 0;
                        let k = 0;
                        let lo_x = 0;
                        let lo_y = 0;
                        let hi_x = 0;
                        let hi_y = 0;
                        memset(matching, 0, 105 /* sizeof(char [105]) */);
                        for (sidx = 0; sidx < MAXPCHARS; sidx++) {
                            /* don't even try to match some terrain: walls, room... */
                            if (((sidx) >= S_stone && (sidx) <= S_trwall) || ((sidx) >= S_room && (sidx) <= S_darkroom) || ((sidx) >= S_corr && (sidx) <= S_litcorr) || ((sidx) >= S_vodoor && (sidx) <= S_hcdoor) || sidx == S_ndoor) {
                                continue;
                            }
                            if (c == defsyms[sidx].sym || c == game.showsyms[sidx] || (c == 94 && ((sidx) >= S_arrow_trap && (sidx) < S_arrow_trap + (TRAPNUM - 1))) || (c == game.showsyms[S_engroom] && ((sidx) == S_engroom || (sidx) == S_engrcorr))) {
                                matching[sidx] = ++k;
                            }
                        }
                        if (k) {
                            for (pass = 0; pass <= 1; pass++) {
                                /* have '^' match webs and vibrating square or any
                           other trap that uses something other than '^' */
                                /* have room engraving character (default '`')
                           match corridor engravings (default '#') too */
                                /* pass 0: just past current pos to lower right;
                           pass 1: upper left corner to current pos */
                                lo_y = (pass == 0) ? cy : 0;
                                hi_y = (pass == 0) ? 21 - 1 : cy;
                                for (ty = lo_y; ty <= hi_y; ty++) {
                                    lo_x = (pass == 0 && ty == lo_y) ? cx + 1 : 1;
                                    hi_x = (pass == 1 && ty == hi_y) ? cx : 80 - 1;
                                    for (tx = lo_x; tx <= hi_x; tx++) {
                                        foundc: {
                                            /* first, look at what is currently visible
                                   (might be monster) */
                                            k = glyph_at(tx, ty);
                                            if (((k) >= GLYPH_CMAP_STONE_OFF && (k) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && matching[glyph_to_cmap(k)]) {
                                                break foundc;
                                            }
                                            if (game.level.flags.hero_memory && !game.iflags.terrainmode) {
                                                /* next, try glyph that's remembered here
                                   (might be trap or object) */
                                                /* !terrainmode: don't move to remembered
                                       trap or object if not currently shown */
                                                k = game.level.locations[tx][ty].glyph;
                                                if (((k) >= GLYPH_CMAP_STONE_OFF && (k) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && matching[glyph_to_cmap(k)]) {
                                                    break foundc;
                                                }
                                            }
                                            /* FIXME: check player-specified vib.sq trap
                                   symbol rather than or in addition to '~' */
                                            if (c == 126 && known_vibrating_square_at(tx, ty)) {
                                                break foundc;
                                            }
                                            if (game.level.locations[tx][ty].seenv) {
                                                /* last, try actual terrain here (shouldn't
                                   we be using svl.lastseentyp[][] instead?) */
                                                k = back_to_glyph(tx, ty);
                                                if (((k) >= GLYPH_CMAP_STONE_OFF && (k) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && matching[glyph_to_cmap(k)]) {
                                                    break foundc;
                                                }
                                            }
                                            continue;
                                        }
                                        cx = tx , cy = ty;
                                        if (msg_given) {
                                            (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
                                            msg_given = (0);
                                        }
                                        break nxtc;
                                    }
                                }
                            }
                            pline("Can't find dungeon feature '%c'.", c);
                            msg_given = (1);
                            break nxtc;
                        } else {
                            let note = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            if (!force) {
                                note = strcpy(note, "aborted");
                            } else {
                                note = sprintf(note, "use '%s', '%s', '%s', '%s' or '%s'", visctrl(cmd_from_func(do_move_west)), visctrl(cmd_from_func(do_move_south)), visctrl(cmd_from_func(do_move_north)), visctrl(cmd_from_func(do_move_east)), visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK]));
                            }
                            pline("Unknown direction: '%s' (%s).", visctrl(c), note);
                            msg_given = (1);
                        }
                    }
                    if (force) {
                        break nxtc;
                    }
                    pline("Done.");
                    msg_given = (0);
                    cx = -1;
                    cy = 0;
                    result = 0;
                    break;
                }
            }
            game.getposx = cx , game.getposy = cy;
            (game.windowprocs.win_cliparound)(cx, cy);
            (game.windowprocs.win_curs)(game.WIN_MAP, cx, cy);
            flush_screen(0);
        }
    }
    lock_mouse_buttons((0));
    if (msg_given) {
        (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
    }
    ccp.x = cx;
    ccp.y = cy;
    game.getposx = game.getposy = 0;
    for (i = 0; i < NUM_GLOCS; i++) {
        if (garr[i]) {
            free(garr[i]);
        }
    }
    getpos_sethilite(null, null);
    game.u.dx = udx , game.u.dy = udy , game.u.dz = udz;
    return result;
}
/*getpos.c*/
/* default is too wide for basic 80-column tty so shorten it
               to avoid wrapping */
/* unlike '/M', this skips monsters revealed by
           warning glyphs and remembered unseen ones */
/* upper left corner of map is <1,0>;
           with default COLNO,ROWNO lower right corner is <79,20> */
/* for normal map sizes, force a fixed-width formatting so that
           /m, /M, /o, and /O output lines up cleanly; map sizes bigger
           than Nx999 or 999xM will still work, but not line up like normal
           when displayed in a column setting.

           The (100) is placed in brackets below to mark the [: "03"] as
           explicit compile-time dead code for clang */
