/* NetHack 5.0	cmd.c	$NHDT-Date: 1762680996 2025/11/09 01:36:36 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.755 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2013. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * Some systems may have getchar() return EOF for various reasons, and
 * we should not quit before seeing at least NR_OF_EOFS consecutive EOFs.
 */
/* stuff commented out in extern.h, but needed here */
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/* DUMB */
import { game } from '../gstate.js';
import { close_nhfile } from '../c2js-runtime/levelfile.js';
import { lua_getglobal, lua_pushstring, lua_settop, lua_toboolean, nhl_pcall_handle } from '../c2js-runtime/lua.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { alloc, free, memcpy, memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, pline, raw_printf } from '../c2js-runtime/pline.js';
import { do_write_config_file, dobugreport, dosave } from '../c2js-runtime/savestubs.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strchr, strcmp, strcpy, strlen, strncmp, strncmpi, strncpy, strrchr, strstri } from '../c2js-runtime/string.js';
import { timet_delta } from './allmain.js';
import { doapply, dojump, dorub, reset_trapset, use_unicorn_horn } from './apply.js';
import { doinvoke } from './artifact.js';
import { ballrelease, placebc, unplacebc } from './ball.js';
import { getnow } from './calendar.js';
import { is_pool } from './dbridge.js';
import { c_common_strings, cg, dirs_ord, hidespinchars, nhcb_name, quitchars, rightleftchars, xdir, ydir, ynaqchars, ynchars, ynqchars, zdir } from './decl.js';
import { dosearch, reveal_terrain } from './detect.js';
import { wiz_debug_cmd_bury } from './dig.js';
import { canseemon, cls, docrt, docrt_flags, doredraw, flush_screen, glyph_at, nul_glyphinfo, sensemon } from './display.js';
import { doddrop, dodown, dodrop, donull, doup, dowipe, save_currentstate, u_collide_m } from './do.js';
import { docallcmd, mon_nam, x_monnam } from './do_name.js';
import { doddoremarm, doputon, doremring, dotakeoff, dowear, ia_dotakeoff, remarm_swapwep, reset_remarm } from './do_wear.js';
import { losedogs } from './dog.js';
import { pet_ranged_attk } from './dogmove.js';
import { dokick } from './dokick.js';
import { dofire, dothrow } from './dothrow.js';
import { defsyms } from './drawing.js';
import { donamelevel, dooverview, ledger_no, on_level, recalc_mapseen, rm_mapseen, u_on_rndspot } from './dungeon.js';
import { doeat } from './eat.js';
import { done2, nh_terminate } from './end.js';
import { can_reach_floor, doengrave } from './engrave.js';
import { dryup } from './fountain.js';
import { auto_describe, gather_locs_interesting, getpos, getpos_menu } from './getpos.js';
import { glyph_to_cmap } from './glyphs.js';
import { check_special_room, domove, dopickup, set_uinwater, test_move, u_maybe_impaired } from './hack.js';
import { copynchars, digit, dist2, eos, highc, letter, mungspaces, strsubst, trimspaces, upstart, visctrl } from './hacklib.js';
import { do_gamelog, doattributes, doborn, doconduct, dogenocided, dovanquished, remove_achievement } from './insight.js';
import { adjust_split, carrying, ddoinv, dolook, doorganize, doperminv, dopramulet, doprarm, doprgold, doprinuse, doprring, doprtool, doprwep, dotypeinv } from './invent.js';
import { wiz_light_sources } from './light.js';
import { doclose, doforce, doopen, maybe_reset_pick, reset_pick } from './lock.js';
import { dobjsfree } from './mkobj.js';
import { dmonsfree, kill_genocided_monsters } from './mon.js';
import { attacktype } from './mondata.js';
import { linedup } from './mthrowu.js';
import { ACH_MINE_PRIZE, ACH_SOKO_PRIZE, ALTAR, AMULET_SYM, ARMOR_SYM, BAG_OF_TRICKS, BOULDER, CMDQ_DIR, CMDQ_EXTCMD, CMDQ_INT, CMDQ_KEY, CMDQ_USER_INPUT, CORR, CQ_CANNED, CQ_REPEAT, CREDIT_CARD, DBWALL, DIR_DOWN, DIR_E, DIR_ERR, DIR_N, DIR_NE, DIR_NW, DIR_S, DIR_SE, DIR_SW, DIR_UP, DIR_W, DOOR, DRAWBRIDGE_UP, FOOD_CLASS, FOUNTAIN, GFILTER_VIEW, GLOC_INTERESTING, GLYPH_CMAP_C_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_UNEXPLORED_OFF, GOLD_SYM, IRONBARS, LARGE_BOX, LAVAWALL, LOCK_PICK, MALE, MAX_TYPE, MS_SHRIEK, MV_ANY, MV_RUN, MV_RUSH, MV_WALK, NHCB_CMD_BEFORE, NHKF_COUNT, NHKF_ESC, NHKF_GETDIR_HELP, NHKF_GETDIR_MOUSE, NHKF_GETDIR_SELF, NHKF_GETDIR_SELF2, NHKF_GETPOS_AUTODESC, NHKF_GETPOS_DOOR_NEXT, NHKF_GETPOS_DOOR_PREV, NHKF_GETPOS_HELP, NHKF_GETPOS_INTERESTING_NEXT, NHKF_GETPOS_INTERESTING_PREV, NHKF_GETPOS_LIMITVIEW, NHKF_GETPOS_MENU, NHKF_GETPOS_MON_NEXT, NHKF_GETPOS_MON_PREV, NHKF_GETPOS_MOVESKIP, NHKF_GETPOS_OBJ_NEXT, NHKF_GETPOS_OBJ_PREV, NHKF_GETPOS_PICK, NHKF_GETPOS_PICK_O, NHKF_GETPOS_PICK_Q, NHKF_GETPOS_PICK_V, NHKF_GETPOS_SELF, NHKF_GETPOS_SHOWVALID, NHKF_GETPOS_UNEX_NEXT, NHKF_GETPOS_UNEX_PREV, NHKF_GETPOS_VALID_NEXT, NHKF_GETPOS_VALID_PREV, NHLpa_panic, N_DIRS_Z, N_MOVEMODES, PLNMSG_UNKNOWN, PM_CAVE_SPIDER, PM_GIANT_SPIDER, PM_GREMLIN, PM_GRID_BUG, PM_MASTER_MIND_FLAYER, PM_MIND_FLAYER, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, RING_SYM, ROOM, SADDLE, SCORR, SDOOR, SINK, SKELETON_KEY, SPBOOK_SYM, STONE, S_NYMPH, S_UNICORN, S_VAMPIRE, S_corr, S_digbeam, S_fountain, S_goodpos, S_litcorr, S_sink, THRONE, TOOL_SYM, TREE, VIBRATING_SQUARE, WATER, WEAPON_SYM, commandInp, docrtRefresh, fuzzer_impossible_continue, getdirInp, getposInp, otherInp } from './nh-constants.js';
import { doclassdisco, dodiscovered } from './o_init.js';
import { an, doname } from './objnam.js';
import { doset, doset_simple, dotogglepickup, show_menu_controls, toggle_bool_option } from './options.js';
import { do_screen_description, dohelp, dohistory, doidtrap, doquickwhatis, dowhatdoes, dowhatdoes_core, dowhatis } from './pager.js';
import { doloot, dotip } from './pickup.js';
import { Norep, There, custompline, dumplogmsg, pline_xy, set_msg_xy } from './pline.js';
import { dobreathe, dogaze, dohide, domindblast, dopoly, doremove, dospinweb, dospit, dosummon } from './polyself.js';
import { dip_into, dodip, dodrink, split_mon } from './potion.js';
import { dopray, dosacrifice, doturn } from './pray.js';
import { deliver_splev_message } from './questpgr.js';
import { doread } from './read.js';
import { rn2, rnd } from './rnd.js';
import { selection_floodfill, selection_free, selection_getbounds, selection_getpoint, selection_new, selection_size_description, set_selection_floodfillchk } from './selvar.js';
import { dopay } from './shk.js';
import { dosit } from './sit.js';
import { dotalk } from './sounds.js';
import { docast, dovspell, dowizcast, num_spells } from './spell.js';
import { On_stairs_dn, On_stairs_up, stairway_at } from './stairs.js';
import { can_saddle, doride } from './steed.js';
import { Strlen_, pmatchi, strbuf_append } from './strutil.js';
import { dotelecmd } from './teleport.js';
import { wiz_timeout_queue } from './timeout.js';
import { initrack } from './track.js';
import { dountrap, reset_utrap, t_at } from './trap.js';
import { doextversion, doversion } from './version.js';
import { vision_reset } from './vision.js';
import { enhance_weapon_skill } from './weapon.js';
import { doswapweapon, dotwoweapon, dowield, dowieldquiver } from './wield.js';
import { add_menu, add_menu_heading, add_menu_str, getlin, nhwindows_hangup, select_menu } from './windows.js';
import { aggravate } from './wizard.js';
import { makemap_remove_mons, wiz_custom, wiz_detect, wiz_display_macros, wiz_flip_level, wiz_fuzzer, wiz_genesis, wiz_identify, wiz_intrinsic, wiz_kill, wiz_level_change, wiz_level_tele, wiz_levltyp_legend, wiz_load_lua, wiz_load_splua, wiz_makemap, wiz_map, wiz_map_levltyp, wiz_migrate_mons, wiz_mon_diff, wiz_objprobs, wiz_panic, wiz_polyself, wiz_rumor_check, wiz_show_nhuuid, wiz_show_seenv, wiz_show_stats, wiz_show_vision, wiz_show_wmodes, wiz_smell, wiz_telekinesis, wiz_where, wiz_wish } from './wizcmds.js';
import { which_armor } from './worn.js';
import { dozap } from './zap.js';

game.timed_occ_fn = null;
const readchar_queue = "";
/* for rejecting attempts to use wizard mode commands
 * Also used in wizcmds.c  */
export const unavailcmd = "Unavailable command '%s'.";
/* for rejecting #if !SHELL, !SUSPEND */
const cmdnotavail = "'%s' command not available.";
/* the #prevmsg command */
export function doprev_message() {
    (game.windowprocs.win_doprev_message)();
    return 0;
}
/* Count down by decrementing multi */
export function timed_occupation() {
    (game.timed_occ_fn)();
    if (game.multi > 0) {
        game.multi--;
    }
    return game.multi > 0;
}
/* If you have moved since initially setting some occupations, they
 * now shouldn't be able to restart.
 *
 * The basic rule is that if you are carrying it, you can continue
 * since it is with you.  If you are acting on something at a distance,
 * your orientation to it must have changed when you moved.
 *
 * The exception to this is taking off items, since they can be taken
 * off in a number of ways in the intervening time, screwing up ordering.
 *
 *      Currently:      Take off all armor.
 *                      Picking Locks / Forcing Chests.
 *                      Setting traps.
 */
export function reset_occupations() {
    reset_remarm();
    reset_pick();
    reset_trapset();
}
/* If a time is given, use it to timeout this function, otherwise the
 * function times out by its own means.
 */
export function set_occupation(fn, txt, xtime) {
    if (xtime) {
        game.occupation = timed_occupation;
        game.timed_occ_fn = fn;
    } else {
        game.occupation = fn;
    }
    game.occtxt = txt;
    game.occtime = 0;
    /* not necessarily true for vms... */
    return;
}
/*
void
cmdq_print(int q)
{
    char buf[QBUFSZ];
    struct _cmd_queue *cq = gc.command_queue[q];

    pline("CQ:%i", q);
    while (cq) {
        switch (cq->typ) {
        case CMDQ_KEY:
            pline("(key:%s)", key2txt(cq->key, buf));
            break;
        case CMDQ_EXTCMD:
            pline("(extcmd:#%s)", cq->ec_entry->ef_txt);
            break;
        case CMDQ_DIR:
            pline("(dir:%i,%i,%i)", cq->dirx, cq->diry, cq->dirz);
            break;
        case CMDQ_USER_INPUT:
            pline("(userinput)");
            break;
        case CMDQ_INT:
            pline("(int:%i)", cq->intval);
            break;
        default:
            pline("(ERROR:%i)",cq->typ);
            break;
        }
        cq = cq->next;
    }
}
*/
/* add extended command function to the command queue */
export function cmdq_add_ec(q, fn) {
    let tmp = alloc(1 /* sizeof(struct _cmd_queue) */);
    let cq = game.command_queue[q];
    tmp.typ = CMDQ_EXTCMD;
    tmp.ec_entry = ext_func_tab_from_func(fn);
    tmp.next = null;
    while (cq && cq.next) {
        cq = cq.next;
    }
    if (cq) {
        cq.next = tmp;
    } else {
        game.command_queue[q] = tmp;
    }
}
/* add a key to the command queue */
export function cmdq_add_key(q, key) {
    let tmp = alloc(1 /* sizeof(struct _cmd_queue) */);
    let cq = game.command_queue[q];
    tmp.typ = CMDQ_KEY;
    tmp.key = key;
    tmp.next = null;
    while (cq && cq.next) {
        cq = cq.next;
    }
    if (cq) {
        cq.next = tmp;
    } else {
        game.command_queue[q] = tmp;
    }
}
/* add a direction to the command queue */
export function cmdq_add_dir(q, dx, dy, dz) {
    let tmp = alloc(1 /* sizeof(struct _cmd_queue) */);
    let cq = game.command_queue[q];
    tmp.typ = CMDQ_DIR;
    tmp.dirx = dx;
    tmp.diry = dy;
    tmp.dirz = dz;
    tmp.next = null;
    while (cq && cq.next) {
        cq = cq.next;
    }
    if (cq) {
        cq.next = tmp;
    } else {
        game.command_queue[q] = tmp;
    }
}
/* add placeholder to the command queue, allows user input there */
export function cmdq_add_userinput(q) {
    let tmp = alloc(1 /* sizeof(struct _cmd_queue) */);
    let cq = game.command_queue[q];
    tmp.typ = CMDQ_USER_INPUT;
    tmp.next = null;
    while (cq && cq.next) {
        cq = cq.next;
    }
    if (cq) {
        cq.next = tmp;
    } else {
        game.command_queue[q] = tmp;
    }
}
/* add integer to the command queue */
export function cmdq_add_int(q, val) {
    let tmp = alloc(1 /* sizeof(struct _cmd_queue) */);
    let cq = game.command_queue[q];
    tmp.typ = CMDQ_INT;
    tmp.intval = val;
    tmp.next = null;
    while (cq && cq.next) {
        cq = cq.next;
    }
    if (cq) {
        cq.next = tmp;
    } else {
        game.command_queue[q] = tmp;
    }
}
/* shift the last entry in command queue to first */
export function cmdq_shift(q) {
    let tmp = null;
    let cq = game.command_queue[q];
    while (cq && cq.next && cq.next.next) {
        cq = cq.next;
    }
    if (cq) {
        tmp = cq.next;
    }
    if (tmp) {
        tmp.next = game.command_queue[q];
        game.command_queue[q] = tmp;
        cq.next = null;
    }
}
export function cmdq_reverse(head) {
    let prev = null;
    let curr = head;
    let next = null;
    while (curr) {
        next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}
export function cmdq_copy(q) {
    let tmp = null;
    let cq = game.command_queue[q];
    while (cq) {
        let tmp2 = alloc(1 /* sizeof(struct _cmd_queue) */);
        Object.assign(tmp2, cq);
        tmp2.next = tmp;
        tmp = tmp2;
        cq = cq.next;
    }
    tmp = cmdq_reverse(tmp);
    return tmp;
}
/* pop off the topmost command from the command queue.
 * caller is responsible for freeing the returned _cmd_queue.
 */
export function cmdq_pop() {
    let q = (game.in_doagain) ? CQ_REPEAT : CQ_CANNED;
    let tmp = game.command_queue[q];
    if (tmp) {
        game.command_queue[q] = tmp.next;
        tmp.next = null;
    }
    return tmp;
}
/* get the top entry without popping it */
export function cmdq_peek(q) {
    return game.command_queue[q];
}
/* clear all commands from the command queue */
export function cmdq_clear(q) {
    let tmp = game.command_queue[q];
    let tmp2 = null;
    while (tmp) {
        tmp2 = tmp.next;
        free(tmp);
        tmp = tmp2;
    }
    game.command_queue[q] = null;
}
/* courtesy of aeb@cwi.nl */
export function pgetchar() {
    let ch = 0;
    if (game.iflags.debug_fuzzer) {
        return randomkey();
    }
    ch = (game.windowprocs.win_nhgetch)();
    return ch;
}
/* '#' or whatever has been bound to doextcmd() in its place */
export function extcmd_initiator() {
    return game.Cmd.extcmd_char;
}
export function can_do_extcmd(extcmd) {
    let ecflags = extcmd.flags;
    if (game.luacore && game.nhcb_counts[NHCB_CMD_BEFORE]) {
        lua_getglobal(game.luacore, "nh_callback_run");
        lua_pushstring(game.luacore, nhcb_name[NHCB_CMD_BEFORE]);
        lua_pushstring(game.luacore, extcmd.ef_txt);
        nhl_pcall_handle(game.luacore, 2, 1, "can_do_extcmd", NHLpa_panic);
        if (!lua_toboolean(game.luacore, -1)) {
            lua_settop(game.luacore, 0);
            return (0);
        }
        lua_settop(game.luacore, 0);
    }
    if (!game.flags.debug && (ecflags & 4)) {
        pline(unavailcmd, extcmd.ef_txt);
        return (0);
    } else if (game.u.uburied && !(ecflags & 1)) {
        You_cant("do that while you are buried!");
        return (0);
    } else if (game.iflags.debug_fuzzer && (ecflags & 32)) {
        return (0);
    }
    return (1);
}
/* here after # - now read a full-word command */
export function doextcmd() {
    let idx = 0;
    let retval = 0;
    let func = null;
    do {
        idx = (game.windowprocs.win_get_ext_cmd)();
        if (idx < 0) {
            return 0;
        }
        func = game.extcmdlist[idx].ef_funct;
        if (!can_do_extcmd(game.extcmdlist[idx])) {
            return 0;
        }
        if (game.iflags.menu_requested && !accept_menu_prefix(game.extcmdlist[idx])) {
            /* keep repeating until we don't run help or quit */
            pline("'%s' prefix has no effect for the %s command.", visctrl(cmd_from_func(do_reqmenu)), game.extcmdlist[idx].ef_txt);
            game.iflags.menu_requested = (0);
        }
        /* tell rhack() what command is actually executing */
        game.ext_tlist = game.extcmdlist[idx];
        retval = (func)();
    } while (func == doextlist);
    return retval;
}
/* format extended command flags for display */
/* if Null, add a footnote to the menu */
let __doc_extcmd_flagstr_Abuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function doc_extcmd_flagstr(menuwin, efp) {
    if (!efp) {
        /* 5 would suffice: {'[','m','A',']','\0'} */
        /* note: tag shown for menu prefix is 'm' even if m-prefix action
       has been bound to some other key */
        let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        add_menu_str(menuwin, "[A] Command autocompletes");
        qbuf = sprintf(qbuf, "[m] Command accepts '%s' prefix", visctrl(cmd_from_func(do_reqmenu)));
        add_menu_str(menuwin, qbuf);
        return null;
    } else {
        let mprefix = accept_menu_prefix(efp);
        let autocomplete = (efp.flags & 2) != 0;
        let __nh_p_idx = 0;
        if (mprefix || autocomplete) {
            /* "" or "[m]" or "[A]" or "[mA]" */
            __doc_extcmd_flagstr_Abuf[__nh_p_idx++] = 91;
            if (mprefix) {
                __doc_extcmd_flagstr_Abuf[__nh_p_idx++] = 109;
            }
            if (autocomplete) {
                __doc_extcmd_flagstr_Abuf[__nh_p_idx++] = 65;
            }
            __doc_extcmd_flagstr_Abuf[__nh_p_idx++] = 93;
        }
        __doc_extcmd_flagstr_Abuf[__nh_p_idx] = 0;
        return __doc_extcmd_flagstr_Abuf;
    }
}
/* here after #? - now list all full-word commands and provide
   some navigation capability through the long list */
const __doextlist_headings = ["Extended commands", "Debugging Extended Commands"];
export function doextlist() {
    let efp = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let searchbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let descbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let promptbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let cmd_desc = null;
    let menuwin = 0;
    let any = 0;
    let selected = null;
    let n = 0;
    let pass = 0;
    let menumode = 0;
    let menushown = [0, 0];
    let onelist = 0;
    let redisplay = (1);
    let search = (0);
    let clr = 8;
    searchbuf[0] = 0;
    menuwin = (game.windowprocs.win_create_nhwindow)(4);
    while (redisplay) {
        redisplay = (0);
        /* TODO: fixed letters for the menu entries? */
        any = cg.zeroany;
        (game.windowprocs.win_start_menu)(menuwin, 0);
        add_menu_str(menuwin, "Extended Commands List");
        add_menu_str(menuwin, "");
        buf = sprintf(buf, "Switch to %s commands that don't autocomplete", menumode ? "including" : "excluding");
        any.a_int = 1;
        add_menu(menuwin, nul_glyphinfo, any, 97, 0, 0, clr, buf, 0);
        if (!searchbuf) {
            any.a_int = 2;
            /* was 's', but then using ':' handling within the interface
               would only examine the two or three meta entries, not the
               actual list of extended commands shown via separator lines;
               having ':' as an explicit selector overrides the default
               menu behavior for it; we retain 's' as a group accelerator */
            add_menu(menuwin, nul_glyphinfo, any, 58, 115, 0, clr, "Search extended commands", 0);
        } else {
            buf = strcpy(buf, "Switch back from search");
            if (strlen(buf) + strlen(searchbuf) + strlen(" (\"\")") < 128) {
                buf = (buf || '') + sprintf('', " (\"%s\")", searchbuf);
            }
            any.a_int = 3;
            /* specifying ':' as a group accelerator here is mostly a
               statement of intent (we'd like to accept it as a synonym but
               also want to hide it from general menu use) because it won't
               work for interfaces which support ':' to search; use as a
               general menu command takes precedence over group accelerator */
            add_menu(menuwin, nul_glyphinfo, any, 115, 58, 0, clr, buf, 0);
        }
        if (game.flags.debug) {
            any.a_int = 4;
            add_menu(menuwin, nul_glyphinfo, any, 122, 0, 0, clr, onelist ? "Switch to showing debugging commands in separate section" : "Switch to showing all alphabetically, including debugging commands", 0);
        }
        add_menu_str(menuwin, "");
        menushown[0] = menushown[1] = 0;
        n = 0;
        for (pass = 0; pass <= 1; ++pass) {
            /* skip second pass if not in wizard mode or wizard mode
               commands are being integrated into a single list */
            if (pass == 1 && (onelist || !game.flags.debug)) {
                break;
            }
            for (let __nhi_efp = 0; (efp = game.extcmdlist[__nhi_efp]) && (efp.ef_txt); __nhi_efp++) {
                let wizc = 0;
                if ((efp.flags & (16 | 64)) != 0) {
                    continue;
                }
                /* if hiding non-autocomplete commands, skip such */
                if (menumode == 1 && (efp.flags & 2) == 0) {
                    continue;
                }
                /* skip wizard mode commands if not in wizard mode;
                   when showing two sections, skip wizard mode commands
                   in pass==0 and skip other commands in pass==1 */
                wizc = (efp.flags & 4) != 0;
                if (wizc && !game.flags.debug) {
                    continue;
                }
                if (!onelist && pass != wizc) {
                    continue;
                }
                /* command description might get modified on the fly */
                cmd_desc = efp.ef_desc;
                /* suppress part of the description for #genocided if it
                   doesn't apply during the current game */
                if (!game.flags.debug && !game.flags.explore && (efp.flags & 8) != 0 && strstri(cmd_desc, "extinct")) {
                    cmd_desc = strsubst(strcpy(descbuf, cmd_desc), " been genocided or become extinct", " been genocided");
                }
                /* if searching, skip this command if it doesn't match */
                if (searchbuf && !strstri(efp.ef_txt, searchbuf) && !strstri(cmd_desc, searchbuf) && !pmatchi(searchbuf, efp.ef_txt) && !pmatchi(searchbuf, cmd_desc)) {
                    continue;
                }
                if (!menushown[pass]) {
                    buf = strcpy(buf, __doextlist_headings[pass]);
                    /* first try case-insensitive substring match */
                    /* wildcard support; most interfaces use case-insensitive
                       pmatch rather than regexp for menu searching */
                    /* We're about to show an item, have we shown the menu yet?
                   Doing menu in inner loop like this on demand avoids a
                   heading with no subordinate entries on the search
                   results menu. */
                    add_menu_heading(menuwin, buf);
                    menushown[pass] = 1;
                }
                buf = sprintf(buf, " %-14s %4s %s", efp.ef_txt, doc_extcmd_flagstr(menuwin, efp), cmd_desc);
                add_menu_str(menuwin, buf);
                ++n;
            }
            if (n) {
                add_menu_str(menuwin, "");
            }
        }
        if (searchbuf && !n) {
            add_menu_str(menuwin, "no matches");
        /* longest ef_txt at present is "wizrumorcheck" (13 chars);
                   2nd field will be "    " or " [A]" or " [m]" or "[mA]" */
        } else {
            doc_extcmd_flagstr(menuwin, null);
        }
        (game.windowprocs.win_end_menu)(menuwin, null);
        n = select_menu(menuwin, 1, selected);
        if (n > 0) {
            switch (selected[0].item.a_int) {
                /* 'a': toggle show/hide non-autocomplete */
                case 1:
                    menumode = 1 - menumode;
                    redisplay = (1);
                    break;
                /* ':' when not searching yet: enable search */
                /* known map with known traps */
                case 2:
                    search = (1);
                    break;
                /* 's' when already searching: disable search */
                /* known map with known traps and objects */
                case 3:
                    search = (0);
                    searchbuf[0] = 0;
                    redisplay = (1);
                    break;
                /* 'z': toggle showing wizard mode commands separately */
                case 4:
                    search = (0);
                    searchbuf[0] = 0;
                    onelist = 1 - onelist;
                    redisplay = (1);
                    break;
            }
            free(selected);
        } else {
            search = (0);
            searchbuf[0] = 0;
        }
        if (search) {
            promptbuf = strcpy(promptbuf, "Extended command list search phrase");
            promptbuf = strcat(promptbuf, "?");
            getlin(promptbuf, searchbuf);
            searchbuf = mungspaces(searchbuf);
            if (searchbuf[0] == 27) {
                searchbuf[0] = 0;
            }
            if (searchbuf) {
                redisplay = (1);
            }
            search = (0);
        }
    }
    (game.windowprocs.win_destroy_nhwindow)(menuwin);
    return 0;
}
/* Change if we ever have more ext cmds */
/*
 * This is currently used only by the tty interface and is
 * controlled via runtime option 'extmenu'.  (Most other interfaces
 * already use a menu all the time for extended commands.)
 *
 * ``# ?'' is counted towards the limit of the number of commands,
 * so we actually support MAX_EXT_CMD-1 "real" extended commands.
 *
 * Here after # - now show pick-list of possible commands.
 */
export function extcmd_via_menu() {
    let efp = null;
    let pick_list = null;
    let win = 0;
    let any = 0;
    let choices = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let cbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let prompt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let fmtstr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    let n = 0;
    let nchoices = 0;
    let acount = 0;
    let ret = 0;
    let len = 0;
    let biggest = 0;
    let accelerator = 0;
    let prevaccelerator = 0;
    let matchlevel = 0;
    let wastoolong = 0;
    let one_per_line = 0;
    let clr = 8;
    ret = 0;
    cbuf[0] = 0;
    biggest = 0;
    while (!ret) {
        i = n = 0;
        any = cg.zeroany;
        for (let __nhi_efp = 0; (efp = game.extcmdlist[__nhi_efp]) && (efp.ef_txt); __nhi_efp++) {
            if ((efp.flags & (16 | 64)) || !(efp.flags & 2) || (!game.flags.debug && (efp.flags & 4))) {
                continue;
            }
            if (!matchlevel || !strncmp(efp.ef_txt, cbuf, matchlevel)) {
                choices[i] = efp;
                if ((len = strlen(efp.ef_desc)) > biggest) {
                    biggest = len;
                }
                if (++i > 200) {
                    /* NH_DEVEL_STATUS != NH_STATUS_RELEASED */
                    game.iflags.extmenu = (0);
                    return -1;
                }
            }
        }
        choices[i] = null;
        nchoices = i;
        if (nchoices <= 1) {
            /* if we're down to one, we have our selection so get out of here */
            ret = (nchoices == 1) ? (choices[0] - game.extcmdlist) : -1;
            break;
        }
        win = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(win, 0);
        fmtstr = sprintf(fmtstr, "%%-%ds", biggest + 15);
        prompt[0] = 0;
        /* True => had to wrap due to line width
                             * ('w' in wizard mode) */
        wastoolong = (0);
        /* -3: two line menu header, 1 line menu footer (for prompt) */
        one_per_line = (nchoices < 21 - 3);
        prevaccelerator = 0;
        acount = 0;
        for (i = 0; choices[i]; ++i) {
            accelerator = choices[i].ef_txt[matchlevel];
            if (accelerator != prevaccelerator || one_per_line) {
                wastoolong = (0);
            }
            if (accelerator != prevaccelerator || one_per_line || (acount >= 2 && (strlen(prompt) + 4 + strlen(choices[i].ef_txt) >= ((128 /* sizeof(char [128]) */) < (80 - 6) ? (128 /* sizeof(char [128]) */) : (80 - 6))))) {
                if (acount) {
                    buf = sprintf(buf, fmtstr, prompt);
                    /* +4: + sizeof " or " - sizeof "" */
                    /* -6: enough room for 1 space left margin
                         *   + "%c - " menu selector + 1 space right margin */
                    /* flush extended cmds for that letter already in buf */
                    any.a_char = prevaccelerator;
                    add_menu(win, nul_glyphinfo, any, any.a_char, 0, 0, clr, buf, 0);
                    acount = 0;
                    if (!(accelerator != prevaccelerator || one_per_line)) {
                        wastoolong = (1);
                    }
                }
            }
            prevaccelerator = accelerator;
            if (!acount || one_per_line) {
                prompt = sprintf(prompt, "%s%s [%s]", wastoolong ? "or " : "", choices[i].ef_txt, choices[i].ef_desc);
            } else if (acount == 1) {
                prompt = sprintf(prompt, "%s%s or %s", wastoolong ? "or " : "", choices[i - 1].ef_txt, choices[i].ef_txt);
            } else {
                prompt = strcat(prompt, " or ");
                prompt = strcat(prompt, choices[i].ef_txt);
            }
            ++acount;
        }
        if (acount) {
            buf = sprintf(buf, fmtstr, prompt);
            any.a_char = prevaccelerator;
            add_menu(win, nul_glyphinfo, any, any.a_char, 0, 0, clr, buf, 0);
        }
        nh_snprintf("extcmd_via_menu", 856, prompt, 128 /* sizeof(char [128]) */, "Extended Command: %s", cbuf);
        (game.windowprocs.win_end_menu)(win, prompt);
        n = select_menu(win, 1, pick_list);
        (game.windowprocs.win_destroy_nhwindow)(win);
        if (n == 1) {
            if (matchlevel > (128 - 2)) {
                free(pick_list);
                ret = -1;
            } else {
                cbuf[matchlevel++] = pick_list[0].item.a_char;
                cbuf[matchlevel] = 0;
                free(pick_list);
            }
        } else {
            if (matchlevel) {
                ret = 0;
                matchlevel = 0;
            } else {
                ret = -1;
            }
        }
    }
    return ret;
}
/* TTY_GRAPHICS */
/* #monster command - use special monster ability while polymorphed */
export function domonability() {
    let uptr = game.youmonst.data;
    let might_hide = ((((uptr).mflags1 & 256) != 0) || (((uptr).mflags1 & 128) != 0));
    let c = 0;
    if (might_hide && ((uptr) == game.mons[PM_CAVE_SPIDER] || (uptr) == game.mons[PM_GIANT_SPIDER])) {
        c = yn_function("Hide [h] or spin a web [s]?", hidespinchars, 113, (1));
        if (c == 113 || c == 27) {
            return 0;
        }
    }
    if (attacktype(uptr, 12)) {
        return dobreathe();
    } else if (attacktype(uptr, 10)) {
        return dospit();
    } else if (uptr.mlet == S_NYMPH) {
        return doremove();
    } else if (attacktype(uptr, 15)) {
        return dogaze();
    } else if ((((uptr).mflags2 & 4) != 0)) {
        return dosummon();
    } else if (c ? c == 104 : might_hide) {
        return dohide();
    } else if (c ? c == 115 : ((uptr) == game.mons[PM_CAVE_SPIDER] || (uptr) == game.mons[PM_GIANT_SPIDER])) {
        return dospinweb();
    } else if (((uptr) == game.mons[PM_MIND_FLAYER] || (uptr) == game.mons[PM_MASTER_MIND_FLAYER])) {
        return domindblast();
    } else if (game.u.umonnum == PM_GREMLIN) {
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == FOUNTAIN)) {
            if (split_mon(game.youmonst, null)) {
                dryup(game.u.ux, game.u.uy, (1));
            }
        } else if (is_pool(game.u.ux, game.u.uy)) {
            /* is_pool: might be wearing water walking boots or amulet of
               magical breathing */
            split_mon(game.youmonst, null);
        } else {
            There("is no fountain here.");
        }
    } else if (((uptr).mlet == S_UNICORN && (((uptr).mflags2 & 536870912) != 0))) {
        use_unicorn_horn(null);
        return 1;
    } else if (uptr.msound == MS_SHRIEK) {
        You("shriek.");
        if (game.u.uburied) {
            pline("Unfortunately sound does not carry well through rock.");
        } else {
            aggravate();
        }
    } else if (((uptr).mlet == S_VAMPIRE) || ((game.youmonst).cham == PM_VAMPIRE || (game.youmonst).cham == PM_VAMPIRE_LEADER || (game.youmonst).cham == PM_VLAD_THE_IMPALER)) {
        return dopoly();
    } else if (game.u.usteed && attacktype(game.u.usteed.data, 12)) {
        pet_ranged_attk(game.u.usteed, (1));
        return 1;
    } else if ((game.u.umonnum != game.u.umonster)) {
        pline("Any special ability you may have is purely reflexive.");
    } else {
        You("don't have a special ability in your normal form!");
    }
    return 0;
}
export function enter_explore_mode() {
    if (game.flags.explore) {
        You("are already in explore mode.");
    } else {
        let oldmode = !game.flags.debug ? "normal game" : "debug mode";
        if (!authorize_explore_mode()) {
            if (!game.flags.debug) {
                You("cannot access explore mode.");
                return 0;
            } else {
                pline("Note: normally you wouldn't be allowed into explore mode.");
            }
        }
        pline("Beware!  From explore mode there will be no return to %s,", oldmode);
        if (paranoid_query(((game.flags.paranoia_bits & 2) != 0), "Do you want to enter explore mode?")) {
            game.flags.explore = (1);
            game.flags.debug = (0);
            (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
            You("are now in non-scoring explore mode.");
        } else {
            (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
            pline("Continuing with %s.", oldmode);
        }
    }
    return 0;
}
const __makemap_prepost_Unachieve = "%s achievement revoked.";
export function makemap_prepost(pre, wiztower) {
    let tmpnhfp = null;
    let mtmp = null;
    if (pre) {
        makemap_remove_mons();
        /* discard overview info for level */
        rm_mapseen(ledger_no(game.u.uz));
{
            if ((((((game.dungeon_topology.d_mineend_level)).dlevel || ((game.dungeon_topology.d_mineend_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_mineend_level))))) {
                /* achievement tracking; if replacing a level that has a
               special prize, lose credit for previously finding it and
               reset for the new instance of that prize */
                if (remove_achievement(ACH_MINE_PRIZE)) {
                    pline(__makemap_prepost_Unachieve, "Mine's-end");
                }
                game.context.achieveo.mines_prize_oid = 0;
            } else if ((((((game.dungeon_topology.d_sokoend_level)).dlevel || ((game.dungeon_topology.d_sokoend_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_sokoend_level))))) {
                if (remove_achievement(ACH_SOKO_PRIZE)) {
                    pline(__makemap_prepost_Unachieve, "Soko-prize");
                }
                game.context.achieveo.soko_prize_oid = 0;
            }
        }
        if ((game.uball != null)) {
            ballrelease((0));
            unplacebc();
        }
        /* reset lock picking unless it's for a carried container */
        maybe_reset_pick(null);
        /* reset interrupted digging if it was taking place on this level */
        if (on_level(game.context.digging.level, game.u.uz)) {
            memset(game.context.digging, 0, 1 /* sizeof(struct dig_info) */);
        }
        game.iflags.travelcc.x = game.iflags.travelcc.y = 0;
        game.context.polearm.hitmon = null;
        reset_utrap((0));
        check_special_room((1));
        memset(game.dndest, 0, 1 /* sizeof(dest_area) */);
        memset(game.updest, 0, 1 /* sizeof(dest_area) */);
        game.u.ustuck = null;
        game.u.uswallow = game.u.uswldtim = 0;
        set_uinwater(0);
        /* not hidden, even if means are available */
        game.u.uundetected = 0;
        /* purge dead monsters from 'fmon' */
        dmonsfree();
        dobjsfree();
        /* discard current level; "saving" is used to release dynamic data */
        tmpnhfp = get_freeing_nhfile();
        savelev(tmpnhfp, ledger_no(game.u.uz));
        close_nhfile(tmpnhfp);
    } else {
        vision_reset();
        game.vision_full_recalc = 1;
        cls();
        /* was using safe_teleds() but that doesn't honor arrival region
           on levels which have such; we don't force stairs, just area */
        u_on_rndspot((game.u.uhave.amulet ? 1 : 0) | (wiztower ? 2 : 0));
        losedogs();
        kill_genocided_monsters();
        /* u_on_rndspot() might pick a spot that has a monster, or losedogs()
           might pick the hero's spot (only if there isn't already a monster
           there), so we might have to move hero or the co-located monster */
        if ((mtmp = (game.level.monsters[game.u.ux][game.u.uy])) != null) {
            u_collide_m(mtmp);
        }
        initrack();
        if ((game.uball != null)) {
            unplacebc();
            placebc();
        }
        docrt();
        /* Flush screen buffer. Put the cursor on the hero. */
        flush_screen(1);
        deliver_splev_message();
        check_special_room((0));
        save_currentstate();
    }
}
/* temporary? hack, since level type codes aren't the same as screen
   symbols and only the latter have easily accessible descriptions.
   Also used by wizcmds.c */
export const levltyp = ["stone", "vertical wall", "horizontal wall", "top-left corner wall", "top-right corner wall", "bottom-left corner wall", "bottom-right corner wall", "cross wall", "tee-up wall", "tee-down wall", "tee-left wall", "tee-right wall", "drawbridge wall", "tree", "secret door", "secret corridor", "pool", "moat", "water", "drawbridge up", "lava pool", "lava wall", "iron bars", "door", "corridor", "room", "stairs", "ladder", "fountain", "throne", "sink", "grave", "altar", "ice", "drawbridge down", "air", "cloud", "unreachable/undiggable", ""];
/* not a real terrain type, but used for undiggable stone
       by wiz_map_levltyp() */
/* padding in case the number of entries above is odd */
export function levltyp_to_name(typ) {
    if (typ >= 0 && typ < MAX_TYPE) {
        return levltyp[typ];
    }
    return null;
}
/* #terrain command -- show known map, inspired by crawl's '|' command */
export function doterrain() {
    let men = 0;
    let sel = null;
    let any = 0;
    let n = 0;
    let which = 0;
    let clr = 8;
    /* this used to be done each time vision was recalculated, so would
       always be up to date (hopefully); now we do it on demand instead */
    recalc_mapseen();
    /*
     * normal play: choose between known map without mons, obj, and traps
     *  (to see underlying terrain only), or
     *  known map without mons and objs (to see traps under mons and objs), or
     *  known map without mons (to see objects under monsters);
     * explore mode: normal choices plus full map (w/o mons, objs, traps);
     * wizard mode: normal and explore choices plus
     *  a dump of the internal levl[][].typ codes w/ level flags, or
     *  a legend for the levl[][].typ codes dump
     */
    men = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(men, 0);
    any = cg.zeroany;
    any.a_int = 1;
    add_menu(men, nul_glyphinfo, any, 0, 0, 0, clr, "known map without monsters, objects, and traps", 1);
    any.a_int = 2;
    add_menu(men, nul_glyphinfo, any, 0, 0, 0, clr, "known map without monsters and objects", 0);
    any.a_int = 3;
    add_menu(men, nul_glyphinfo, any, 0, 0, 0, clr, "known map without monsters", 0);
    if (game.flags.explore || game.flags.debug) {
        any.a_int = 4;
        add_menu(men, nul_glyphinfo, any, 0, 0, 0, clr, "full map without monsters, objects, and traps", 0);
        if (game.flags.debug) {
            any.a_int = 5;
            add_menu(men, nul_glyphinfo, any, 0, 0, 0, clr, "internal levl[][].typ codes in base-36", 0);
            any.a_int = 6;
            add_menu(men, nul_glyphinfo, any, 0, 0, 0, clr, "legend of base-36 levl[][].typ codes", 0);
        }
    }
    (game.windowprocs.win_end_menu)(men, "View which?");
    n = select_menu(men, 1, sel);
    (game.windowprocs.win_destroy_nhwindow)(men);
    /*
     * n <  0: player used ESC to cancel;
     * n == 0: preselected entry was explicitly chosen and got toggled off;
     * n == 1: preselected entry was implicitly chosen via <space>|<enter>;
     * n == 2: another entry was explicitly chosen, so skip preselected one.
     */
    which = (n < 0) ? -1 : (n == 0) ? 1 : sel[0].item.a_int;
    if (n > 1 && which == 1) {
        which = sel[1].item.a_int;
    }
    if (n > 0) {
        free(sel);
    }
    switch (which) {
        case 1:
            reveal_terrain(1);
            break;
        case 2:
            reveal_terrain(1 | 2);
            break;
        case 3:
            reveal_terrain(1 | 2 | 4);
            break;
        case 4:
            reveal_terrain(1 | 16);
            break;
        case 5:
            wiz_map_levltyp();
            break;
        case 6:
            wiz_levltyp_legend();
            break;
        default:
            break;
    }
    return 0;
}
/* has hero seen all locations in selection? */
export function u_have_seen_whole_selection(sel) {
    let x = 0;
    let y = 0;
    let rect = cg.zeroNhRect;
    selection_getbounds(sel, rect);
    for (x = rect.lx; x <= rect.hx; x++) {
        for (y = rect.ly; y <= rect.hy; y++) {
            if (isok(x, y) && selection_getpoint(x, y, sel) && glyph_at(x, y) == GLYPH_UNEXPLORED_OFF) {
                return (0);
            }
        }
    }
    return (1);
}
/* has hero seen all location of the rectangular outline in the selection */
export function u_have_seen_bounds_selection(sel) {
    let x = 0;
    let y = 0;
    let rect = cg.zeroNhRect;
    selection_getbounds(sel, rect);
    for (x = rect.lx; x <= rect.hx; x++) {
        y = rect.ly;
        if (isok(x, y) && selection_getpoint(x, y, sel) && glyph_at(x, y) == GLYPH_UNEXPLORED_OFF) {
            return (0);
        }
        y = rect.hy;
        if (isok(x, y) && selection_getpoint(x, y, sel) && glyph_at(x, y) == GLYPH_UNEXPLORED_OFF) {
            return (0);
        }
    }
    for (y = rect.ly; y <= rect.hy; y++) {
        x = rect.lx;
        if (isok(x, y) && selection_getpoint(x, y, sel) && glyph_at(x, y) == GLYPH_UNEXPLORED_OFF) {
            return (0);
        }
        x = rect.hx;
        if (isok(x, y) && selection_getpoint(x, y, sel) && glyph_at(x, y) == GLYPH_UNEXPLORED_OFF) {
            return (0);
        }
    }
    return (1);
}
/* can hero currently see all locations in the selection */
export function u_can_see_whole_selection(sel) {
    let x = 0;
    let y = 0;
    let rect = cg.zeroNhRect;
    selection_getbounds(sel, rect);
    for (x = rect.lx; x <= rect.hx; x++) {
        for (y = rect.ly; y <= rect.hy; y++) {
            if (isok(x, y) && selection_getpoint(x, y, sel) && !((game.viz_array[y][x] & 2) != 0)) {
                return (0);
            }
        }
    }
    return (1);
}
/* selection_floofill callback to get all locations in a room */
export function dolookaround_floodfill_findroom(x, y) {
    let typ = game.level.locations[x][y].typ;
    if (((typ) <= DBWALL) || ((typ) == DOOR) || ((typ) == TREE || (game.level.flags.arboreal && (typ) == STONE)) || ((typ) == WATER) || typ == LAVAWALL || typ == IRONBARS || typ == SCORR || typ == SDOOR || typ == DRAWBRIDGE_UP) {
        return (0);
    }
    return (1);
}
/* describe the room at x,y */
export function lookaround_known_room(x, y) {
    let sel = selection_new();
    let rmno = game.u.urooms[0] - 3;
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    set_selection_floodfillchk(dolookaround_floodfill_findroom);
    selection_floodfill(sel, x, y, (1));
    if (!((x) == game.u.ux && (y) == game.u.uy)) {
        set_msg_xy(x, y);
    }
    if (u_have_seen_whole_selection(sel)) {
        let u_in = selection_getpoint(x, y, sel);
        You("%s %s %s.", ((x) == game.u.ux && (y) == game.u.uy) && u_in && u_can_see_whole_selection(sel) ? "are in" : (((x) == game.u.ux && (y) == game.u.uy)) ? "remember this as" : "remember that as", an(selection_size_description(sel, qbuf)), rmno >= 0 ? "room" : "area");
    } else if (u_have_seen_bounds_selection(sel)) {
        You("guess %s to be %s %s.", ((x) == game.u.ux && (y) == game.u.uy) ? "this" : "that", an(selection_size_description(sel, qbuf)), rmno >= 0 ? "room" : "area");
    } else {
        You("can't guess the size of %s area.", ((x) == game.u.ux && (y) == game.u.uy) ? "this" : "that");
    }
    selection_free(sel, (1));
}
/* #lookaround - describe what the hero can see, in text */
export function dolookaround() {
    let x = 0;
    let y = 0;
    let tmp_getloc_filter = game.iflags.getloc_filter;
    let tmp_accessiblemsg = game.a11y.accessiblemsg;
    let corr_next2u = (0);
    game.a11y.accessiblemsg = (1);
    if (game.level.locations[game.u.ux][game.u.uy].typ == CORR) {
        /* In a corridor, mention corridors next to you. */
        /* TODO: if we know, describe where the corridor goes,
           perhaps by describing the rooms? */
        corr_next2u = (1);
    } else if (((game.level.locations[game.u.ux][game.u.uy].typ) == DOOR)) {
        /* In a doorway, describe the rooms next to you */
        let i = 0;
        for (i = DIR_W; i < (N_DIRS_Z - 2); i += 2) {
            x = game.u.ux + xdir[i];
            y = game.u.uy + ydir[i];
            if (isok(x, y) && ((game.level.locations[x][y].typ) >= ROOM)) {
                lookaround_known_room(x, y);
            }
        }
        corr_next2u = (1);
    } else {
        lookaround_known_room(game.u.ux, game.u.uy);
    }
    /* TODO: maybe describe stuff outside the current room differently? */
    game.iflags.getloc_filter = GFILTER_VIEW;
    for (y = 0; y < 21; y++) {
        for (x = 1; x < 80; x++) {
            let glyph = 0;
            let mapsym = 0;
            let iscorr = (corr_next2u && (glyph = glyph_at(x, y)) >= 0 && ((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && ((mapsym = glyph_to_cmap(glyph)) == S_corr || mapsym == S_litcorr));
            if (!((x) == game.u.ux && (y) == game.u.uy) && (gather_locs_interesting(x, y, GLOC_INTERESTING) || iscorr)) {
                /* note: GLOC_INTERESTING catches S_engrcorr */
                let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let cc = { x: 0, y: 0 };
                let sym = 0;
                let firstmatch = null;
                cc.x = x , cc.y = y;
                do_screen_description(cc, (1), sym, buf, { get value() { return firstmatch; }, set value(_v) { firstmatch = _v; } }, null);
                pline_xy(x, y, "%s.", firstmatch);
            }
        }
    }
    game.iflags.getloc_filter = tmp_getloc_filter;
    game.a11y.accessiblemsg = tmp_accessiblemsg;
    return 0;
}
/* #toggle extended command

   BIND=':toggle(price_quotes)
   BIND=@:toggle(autopickup) */
export function dotoggleoption() {
    if (game.cmd_bind && game.cmd_bind.param) {
        return toggle_bool_option(game.cmd_bind.param);
    } else {
        pline("Use #optionsfull to set any option instead.");
        return 0;
    }
}
export function set_move_cmd(dir, run) {
    game.u.dz = zdir[dir];
    game.u.dx = xdir[dir];
    game.u.dy = ydir[dir];
    /* #reqmenu -prefix disables autopickup during movement */
    if (game.iflags.menu_requested) {
        game.context.nopick = 1;
    }
    game.context.travel = game.context.travel1 = 0;
    if (!game.domove_attempting && !game.u.dz) {
        game.context.run = run;
        game.domove_attempting |= (!run ? 1 : 2);
    }
}
/* move or attack */
export function do_move_west() {
    set_move_cmd(DIR_W, 0);
    return 1;
}
export function do_move_northwest() {
    set_move_cmd(DIR_NW, 0);
    return 1;
}
export function do_move_north() {
    set_move_cmd(DIR_N, 0);
    return 1;
}
export function do_move_northeast() {
    set_move_cmd(DIR_NE, 0);
    return 1;
}
export function do_move_east() {
    set_move_cmd(DIR_E, 0);
    return 1;
}
export function do_move_southeast() {
    set_move_cmd(DIR_SE, 0);
    return 1;
}
export function do_move_south() {
    set_move_cmd(DIR_S, 0);
    return 1;
}
export function do_move_southwest() {
    set_move_cmd(DIR_SW, 0);
    return 1;
}
/* rush */
export function do_rush_west() {
    set_move_cmd(DIR_W, 3);
    return 1;
}
export function do_rush_northwest() {
    set_move_cmd(DIR_NW, 3);
    return 1;
}
export function do_rush_north() {
    set_move_cmd(DIR_N, 3);
    return 1;
}
export function do_rush_northeast() {
    set_move_cmd(DIR_NE, 3);
    return 1;
}
export function do_rush_east() {
    set_move_cmd(DIR_E, 3);
    return 1;
}
export function do_rush_southeast() {
    set_move_cmd(DIR_SE, 3);
    return 1;
}
export function do_rush_south() {
    set_move_cmd(DIR_S, 3);
    return 1;
}
export function do_rush_southwest() {
    set_move_cmd(DIR_SW, 3);
    return 1;
}
/* run */
export function do_run_west() {
    set_move_cmd(DIR_W, 1);
    return 1;
}
export function do_run_northwest() {
    set_move_cmd(DIR_NW, 1);
    return 1;
}
export function do_run_north() {
    set_move_cmd(DIR_N, 1);
    return 1;
}
export function do_run_northeast() {
    set_move_cmd(DIR_NE, 1);
    return 1;
}
export function do_run_east() {
    set_move_cmd(DIR_E, 1);
    return 1;
}
export function do_run_southeast() {
    set_move_cmd(DIR_SE, 1);
    return 1;
}
export function do_run_south() {
    set_move_cmd(DIR_S, 1);
    return 1;
}
export function do_run_southwest() {
    set_move_cmd(DIR_SW, 1);
    return 1;
}
/* #reqmenu, prefix command to modify some others */
export function do_reqmenu() {
    if (game.iflags.menu_requested) {
        Norep("Double %s prefix, canceled.", visctrl(cmd_from_func(do_reqmenu)));
        game.iflags.menu_requested = (0);
        return 2;
    }
    game.iflags.menu_requested = (1);
    return 0;
}
/* #rush */
export function do_rush() {
    if ((game.domove_attempting & 2)) {
        Norep("Double rush prefix, canceled.");
        game.context.run = 0;
        game.domove_attempting = 0;
        return 2;
    }
    game.context.run = 2;
    game.domove_attempting |= 2;
    return 0;
}
/* #run */
export function do_run() {
    if ((game.domove_attempting & 2)) {
        Norep("Double run prefix, canceled.");
        game.context.run = 0;
        game.domove_attempting = 0;
        return 2;
    }
    game.context.run = 3;
    game.domove_attempting |= 2;
    return 0;
}
/* #fight */
export function do_fight() {
    if (game.context.forcefight) {
        Norep("Double fight prefix, canceled.");
        game.context.forcefight = 0;
        game.domove_attempting = 0;
        return 2;
    }
    game.context.forcefight = 1;
    game.domove_attempting |= 1;
    return 0;
}
/* #repeat */
export function do_repeat() {
    let res = 0;
    if (!game.in_doagain) {
        let repeat_copy = null;
        if (!cmdq_peek(CQ_REPEAT)) {
            Norep("There is no command available to repeat.");
            return 4;
        }
        repeat_copy = cmdq_copy(CQ_REPEAT);
        game.in_doagain = (1);
        /* read and execute command */
        rhack(0);
        game.in_doagain = (0);
        cmdq_clear(CQ_REPEAT);
        game.command_queue[CQ_REPEAT] = repeat_copy;
        game.iflags.menu_requested = (0);
        if (game.context.move) {
            res = 1;
        }
    }
    return res;
}
/* extcmdlist: full command list, ordered by command name;
   commands with no keystroke or with only a meta keystroke generally
   need to be flagged as autocomplete and ones with a regular keystroke
   or control keystroke generally should not be; there are a few exceptions
   such as ^O/#overview and C/N/#name */
game.extcmdlist = [{ key: 35, ef_txt: "#", ef_desc: "enter and perform an extended command", ef_funct: doextcmd, flags: 1 | 8 | 128, f_text: null }, { key: ((63) - 128), ef_txt: "?", ef_desc: "list all extended commands", ef_funct: doextlist, flags: 1 | 2 | 8 | 128, f_text: null }, { key: ((97) - 128), ef_txt: "adjust", ef_desc: "adjust inventory letters", ef_funct: doorganize, flags: 1 | 2 | 8, f_text: null }, { key: ((65) - 128), ef_txt: "annotate", ef_desc: "name current level", ef_funct: donamelevel, flags: 1 | 2 | 8 | 128, f_text: null }, { key: 97, ef_txt: "apply", ef_desc: "apply (use) a tool (pick-axe, key, lamp...)", ef_funct: doapply, flags: 128, f_text: null }, { key: (31 & (120)), ef_txt: "attributes", ef_desc: "show your attributes", ef_funct: doattributes, flags: 1 | 8, f_text: null }, { key: 64, ef_txt: "autopickup", ef_desc: "toggle the 'autopickup' option on/off", ef_funct: dotogglepickup, flags: 1 | 8, f_text: null }, { key: 0, ef_txt: "bugreport", ef_desc: "file a bug report", ef_funct: dobugreport, flags: 8 | 32, f_text: null }, { key: 67, ef_txt: "call", ef_desc: "name a monster, specific object, or type of object", ef_funct: docallcmd, flags: 1 | 8, f_text: null }, { key: 90, ef_txt: "cast", ef_desc: "zap (cast) a spell", ef_funct: docast, flags: 1, f_text: null }, { key: ((99) - 128), ef_txt: "chat", ef_desc: "talk to someone", ef_funct: dotalk, flags: 1 | 2, f_text: null }, { key: 118, ef_txt: "chronicle", ef_desc: "show journal of major events", ef_funct: do_gamelog, flags: 1 | 2 | 8, f_text: null }, { key: 99, ef_txt: "close", ef_desc: "close a door", ef_funct: doclose, flags: 0, f_text: null }, { key: ((67) - 128), ef_txt: "conduct", ef_desc: "list voluntary challenges you have maintained", ef_funct: doconduct, flags: 1 | 2 | 8, f_text: null }, { key: 0, ef_txt: "debugfuzzer", ef_desc: "start the fuzz tester", ef_funct: wiz_fuzzer, flags: 1 | 4 | 32, f_text: null }, { key: ((100) - 128), ef_txt: "dip", ef_desc: "dip an object into something", ef_funct: dodip, flags: 2 | 128, f_text: null }, { key: 62, ef_txt: "down", ef_desc: "go down a staircase", ef_funct: dodown, flags: 128, f_text: null }, { key: 100, ef_txt: "drop", ef_desc: "drop an item", ef_funct: dodrop, flags: 0, f_text: null }, { key: 68, ef_txt: "droptype", ef_desc: "drop specific item types", ef_funct: doddrop, flags: 0, f_text: null }, { key: 101, ef_txt: "eat", ef_desc: "eat something", ef_funct: doeat, flags: 128, f_text: null }, { key: 69, ef_txt: "engrave", ef_desc: "engrave writing on the floor", ef_funct: doengrave, flags: 0, f_text: null }, { key: ((101) - 128), ef_txt: "enhance", ef_desc: "advance or check weapon and spell skills", ef_funct: enhance_weapon_skill, flags: 1 | 2 | 8, f_text: null }, { key: ((88) - 128), ef_txt: "exploremode", ef_desc: "enter explore (discovery) mode", ef_funct: enter_explore_mode, flags: 1 | 8 | 32, f_text: null }, { key: 70, ef_txt: "fight", ef_desc: "prefix: force fight even if you don't see a monster", ef_funct: do_fight, flags: 512, f_text: null }, { key: 102, ef_txt: "fire", ef_desc: "fire ammunition from quiver", ef_funct: dofire, flags: 0, f_text: null }, { key: ((102) - 128), ef_txt: "force", ef_desc: "force a lock", ef_funct: doforce, flags: 2, f_text: null }, { key: ((103) - 128), ef_txt: "genocided", ef_desc: "list monsters that have been genocided or become extinct", ef_funct: dogenocided, flags: 1 | 2 | 8 | 128, f_text: null }, { key: 59, ef_txt: "glance", ef_desc: "show what type of thing a map symbol corresponds to", ef_funct: doquickwhatis, flags: 1 | 8, f_text: null }, { key: 63, ef_txt: "help", ef_desc: "give a help message", ef_funct: dohelp, flags: 1 | 8, f_text: null }, { key: 0, ef_txt: "herecmdmenu", ef_desc: "show menu of commands you can do here", ef_funct: doherecmdmenu, flags: 1 | 2 | 8, f_text: null }, { key: 0, ef_txt: "history", ef_desc: "show a summary of the game's development", ef_funct: dohistory, flags: 1 | 2 | 8, f_text: null }, { key: 105, ef_txt: "inventory", ef_desc: "show your inventory", ef_funct: ddoinv, flags: 1 | 8, f_text: null }, { key: 73, ef_txt: "inventtype", ef_desc: "show inventory of one specific item class", ef_funct: dotypeinv, flags: 1 | 8, f_text: null }, { key: ((105) - 128), ef_txt: "invoke", ef_desc: "invoke an object's special powers", ef_funct: doinvoke, flags: 1 | 2, f_text: null }, { key: ((106) - 128), ef_txt: "jump", ef_desc: "jump to another location", ef_funct: dojump, flags: 2, f_text: null }, { key: (31 & (100)), ef_txt: "kick", ef_desc: "kick something", ef_funct: dokick, flags: 0, f_text: null }, { key: 92, ef_txt: "known", ef_desc: "show what object types have been discovered", ef_funct: dodiscovered, flags: 1 | 8 | 128, f_text: null }, { key: 96, ef_txt: "knownclass", ef_desc: "show discovered types for one class of objects", ef_funct: doclassdisco, flags: 1 | 8 | 128, f_text: null }, { key: 0, ef_txt: "levelchange", ef_desc: "change experience level", ef_funct: wiz_level_change, flags: 1 | 2 | 4, f_text: null }, { key: 0, ef_txt: "lightsources", ef_desc: "show mobile light sources", ef_funct: wiz_light_sources, flags: 1 | 2 | 4, f_text: null }, { key: 58, ef_txt: "look", ef_desc: "look at what is here", ef_funct: dolook, flags: 1, f_text: null }, { key: 0, ef_txt: "lookaround", ef_desc: "describe what you can see", ef_funct: dolookaround, flags: 1 | 8, f_text: null }, { key: ((108) - 128), ef_txt: "loot", ef_desc: "loot a box on the floor", ef_funct: doloot, flags: 2 | 128, f_text: null }, { key: 0, ef_txt: "migratemons", ef_desc: "show migrating monsters and migrate N random ones", ef_funct: wiz_migrate_mons, flags: 1 | 2 | 4, f_text: null }, { key: ((109) - 128), ef_txt: "monster", ef_desc: "use monster's special ability", ef_funct: domonability, flags: 1 | 2, f_text: null }, { key: ((110) - 128), ef_txt: "name", ef_desc: "same as call; name a monster or object or object type", ef_funct: docallcmd, flags: 1 | 2 | 8, f_text: null }, { key: ((111) - 128), ef_txt: "offer", ef_desc: "offer a sacrifice to the gods", ef_funct: dosacrifice, flags: 2 | 128, f_text: null }, { key: 111, ef_txt: "open", ef_desc: "open a door", ef_funct: doopen, flags: 0, f_text: null }, { key: 79, ef_txt: "options", ef_desc: "show option settings", ef_funct: doset_simple, flags: 1 | 8 | 128, f_text: null }, { key: 0, ef_txt: "optionsfull", ef_desc: "show all option settings, possibly change them", ef_funct: doset, flags: 1 | 8 | 128, f_text: null }, { key: (31 & (111)), ef_txt: "overview", ef_desc: "show a summary of the explored dungeon", ef_funct: dooverview, flags: 1 | 2 | 8 | 128, f_text: null }, { key: 0, ef_txt: "panic", ef_desc: "test panic routine (fatal to game)", ef_funct: wiz_panic, flags: 1 | 2 | 4, f_text: null }, { key: 112, ef_txt: "pay", ef_desc: "pay your shopping bill", ef_funct: dopay, flags: 128, f_text: null }, { key: 124, ef_txt: "perminv", ef_desc: "scroll persistent inventory display", ef_funct: doperminv, flags: 1 | 8 | 32, f_text: null }, { key: 44, ef_txt: "pickup", ef_desc: "pick up things at the current location", ef_funct: dopickup, flags: 128, f_text: null }, { key: 0, ef_txt: "polyself", ef_desc: "polymorph self", ef_funct: wiz_polyself, flags: 1 | 2 | 4, f_text: null }, { key: ((112) - 128), ef_txt: "pray", ef_desc: "pray to the gods for help", ef_funct: dopray, flags: 1 | 2, f_text: null }, { key: (31 & (112)), ef_txt: "prevmsg", ef_desc: "view recent game messages", ef_funct: doprev_message, flags: 1 | 8 | 4096, f_text: null }, { key: 80, ef_txt: "puton", ef_desc: "put on an accessory (ring, amulet, etc)", ef_funct: doputon, flags: 0, f_text: null }, { key: 113, ef_txt: "quaff", ef_desc: "quaff (drink) something", ef_funct: dodrink, flags: 128, f_text: null }, { key: 0, ef_txt: "quit", ef_desc: "exit without saving current game", ef_funct: done2, flags: 1 | 2 | 8 | 32, f_text: null }, { key: 81, ef_txt: "quiver", ef_desc: "select ammunition for quiver", ef_funct: dowieldquiver, flags: 0, f_text: null }, { key: 114, ef_txt: "read", ef_desc: "read a scroll or spellbook", ef_funct: doread, flags: 0, f_text: null }, { key: (31 & (114)), ef_txt: "redraw", ef_desc: "redraw screen", ef_funct: doredraw, flags: 1 | 8 | 4096, f_text: null }, { key: 82, ef_txt: "remove", ef_desc: "remove an accessory (ring, amulet, etc)", ef_funct: doremring, flags: 0, f_text: null }, { key: (31 & (97)), ef_txt: "repeat", ef_desc: "repeat a previous command", ef_funct: do_repeat, flags: 1 | 8, f_text: null }, { key: 109, ef_txt: "reqmenu", ef_desc: "prefix: request menu or modify command", ef_funct: do_reqmenu, flags: 512, f_text: null }, { key: (31 & (95)), ef_txt: "retravel", ef_desc: "travel to previously selected travel location", ef_funct: dotravel_target, flags: 0, f_text: null }, { key: ((82) - 128), ef_txt: "ride", ef_desc: "mount or dismount a saddled steed", ef_funct: doride, flags: 2, f_text: null }, { key: ((114) - 128), ef_txt: "rub", ef_desc: "rub a lamp or a stone", ef_funct: dorub, flags: 2, f_text: null }, { key: 71, ef_txt: "run", ef_desc: "prefix: run until something interesting is seen", ef_funct: do_run, flags: 512, f_text: null }, { key: 103, ef_txt: "rush", ef_desc: "prefix: rush until something interesting is seen", ef_funct: do_rush, flags: 512, f_text: null }, { key: 83, ef_txt: "save", ef_desc: "save the game and exit", ef_funct: dosave, flags: 1 | 8 | 32, f_text: null }, { key: 0, ef_txt: "saveoptions", ef_desc: "save the game configuration", ef_funct: do_write_config_file, flags: 1 | 8 | 32, f_text: null }, { key: 115, ef_txt: "search", ef_desc: "search for traps and secret doors", ef_funct: dosearch, flags: 1 | 128, f_text: "searching" }, { key: 42, ef_txt: "seeall", ef_desc: "show all equipment in use", ef_funct: doprinuse, flags: 1 | 8 | 128, f_text: null }, { key: AMULET_SYM, ef_txt: "seeamulet", ef_desc: "show the amulet currently worn", ef_funct: dopramulet, flags: 1 | 8 | 128, f_text: null }, { key: ARMOR_SYM, ef_txt: "seearmor", ef_desc: "show the armor currently worn", ef_funct: doprarm, flags: 1 | 8 | 128, f_text: null }, { key: RING_SYM, ef_txt: "seerings", ef_desc: "show the ring(s) currently worn", ef_funct: doprring, flags: 1 | 8 | 128, f_text: null }, { key: TOOL_SYM, ef_txt: "seetools", ef_desc: "show the tools currently in use", ef_funct: doprtool, flags: 1 | 8 | 128, f_text: null }, { key: WEAPON_SYM, ef_txt: "seeweapon", ef_desc: "show the weapon currently wielded", ef_funct: doprwep, flags: 1 | 8 | 128, f_text: null }, { key: 33, ef_txt: "shell", ef_desc: "leave game to enter a sub-shell ('exit' to come back)", ef_funct: dosh_core, flags: (1 | 8 | 32), f_text: null }, { key: GOLD_SYM, ef_txt: "showgold", ef_desc: "show gold, possibly shop credit or debt", ef_funct: doprgold, flags: 1 | 8 | 128, f_text: null }, { key: SPBOOK_SYM, ef_txt: "showspells", ef_desc: "list and reorder known spells", ef_funct: dovspell, flags: 1 | 8, f_text: null }, { key: 94, ef_txt: "showtrap", ef_desc: "describe an adjacent, discovered trap", ef_funct: doidtrap, flags: 1 | 8, f_text: null }, { key: ((115) - 128), ef_txt: "sit", ef_desc: "sit down", ef_funct: dosit, flags: 2, f_text: null }, { key: 0, ef_txt: "stats", ef_desc: "show memory statistics", ef_funct: wiz_show_stats, flags: 1 | 2 | 4, f_text: null }, { key: (31 & (122)), ef_txt: "suspend", ef_desc: "push game to background ('fg' to come back)", ef_funct: dosuspend_core, flags: (1 | 8 | 32), f_text: null }, { key: 120, ef_txt: "swap", ef_desc: "swap wielded and secondary weapons", ef_funct: doswapweapon, flags: 0, f_text: null }, { key: 84, ef_txt: "takeoff", ef_desc: "take off one piece of armor", ef_funct: dotakeoff, flags: 0, f_text: null }, { key: 65, ef_txt: "takeoffall", ef_desc: "remove all armor", ef_funct: doddoremarm, flags: 0, f_text: null }, { key: (31 & (116)), ef_txt: "teleport", ef_desc: "teleport around the level", ef_funct: dotelecmd, flags: 1 | 128, f_text: null }, { key: 127, ef_txt: "terrain", ef_desc: "view map without monsters or objects obstructing it", ef_funct: doterrain, flags: 1 | 8 | 2, f_text: null }, { key: 0, ef_txt: "therecmdmenu", ef_desc: "menu of commands you can do from here to adjacent spot", ef_funct: dotherecmdmenu, flags: 2 | 8 | 2048, f_text: null }, { key: 116, ef_txt: "throw", ef_desc: "throw something", ef_funct: dothrow, flags: 0, f_text: null }, { key: 0, ef_txt: "timeout", ef_desc: "look at timeout queue and hero's timed intrinsics", ef_funct: wiz_timeout_queue, flags: 1 | 2 | 4, f_text: null }, { key: ((84) - 128), ef_txt: "tip", ef_desc: "empty a container", ef_funct: dotip, flags: 2 | 128, f_text: null }, { key: 0, ef_txt: "toggle", ef_desc: "toggle boolean option", ef_funct: dotoggleoption, flags: 1 | 8 | 16384, f_text: null }, { key: 95, ef_txt: "travel", ef_desc: "travel to a specific location on the map", ef_funct: dotravel, flags: 128, f_text: null }, { key: ((116) - 128), ef_txt: "turn", ef_desc: "turn undead away", ef_funct: doturn, flags: 1 | 2, f_text: null }, { key: 88, ef_txt: "twoweapon", ef_desc: "toggle two-weapon combat", ef_funct: dotwoweapon, flags: 0, f_text: null }, { key: ((117) - 128), ef_txt: "untrap", ef_desc: "untrap something", ef_funct: dountrap, flags: 2, f_text: null }, { key: 60, ef_txt: "up", ef_desc: "go up a staircase", ef_funct: doup, flags: 128, f_text: null }, { key: ((86) - 128), ef_txt: "vanquished", ef_desc: "list vanquished monsters", ef_funct: dovanquished, flags: 1 | 2 | 8 | 128, f_text: null }, { key: ((118) - 128), ef_txt: "version", ef_desc: "list compile time options for this version of NetHack", ef_funct: doextversion, flags: 1 | 2 | 8, f_text: null }, { key: 86, ef_txt: "versionshort", ef_desc: "show version and date+time program was built", ef_funct: doversion, flags: 1 | 8 | 128, f_text: null }, { key: 0, ef_txt: "vision", ef_desc: "show vision array", ef_funct: wiz_show_vision, flags: 1 | 2 | 4, f_text: null }, { key: 46, ef_txt: "wait", ef_desc: "rest one move while doing nothing", ef_funct: donull, flags: 1 | 128, f_text: "waiting" }, { key: 87, ef_txt: "wear", ef_desc: "wear a piece of armor", ef_funct: dowear, flags: 0, f_text: null }, { key: 38, ef_txt: "whatdoes", ef_desc: "tell what a command does", ef_funct: dowhatdoes, flags: 1 | 8, f_text: null }, { key: 47, ef_txt: "whatis", ef_desc: "show what type of thing a symbol corresponds to", ef_funct: dowhatis, flags: 1 | 8, f_text: null }, { key: 119, ef_txt: "wield", ef_desc: "wield (put in use) a weapon", ef_funct: dowield, flags: 0, f_text: null }, { key: ((119) - 128), ef_txt: "wipe", ef_desc: "wipe off your face", ef_funct: dowipe, flags: 2, f_text: null }, { key: 0, ef_txt: "wizborn", ef_desc: "show stats of monsters created", ef_funct: doborn, flags: 1 | 4, f_text: null }, { key: 0, ef_txt: "wizbury", ef_desc: "bury objs under and around you", ef_funct: wiz_debug_cmd_bury, flags: 1 | 2 | 4, f_text: null }, { key: 0, ef_txt: "wizcast", ef_desc: "cast any spell", ef_funct: dowizcast, flags: 1 | 4, f_text: null }, { key: 0, ef_txt: "wizcustom", ef_desc: "show customized glyphs", ef_funct: wiz_custom, flags: 1 | 4 | 32, f_text: null }, { key: (31 & (101)), ef_txt: "wizdetect", ef_desc: "reveal hidden things within a small radius", ef_funct: wiz_detect, flags: 1 | 4, f_text: null }, { key: 0, ef_txt: "wizdispmacros", ef_desc: "validate the display macro ranges", ef_funct: wiz_display_macros, flags: 1 | 2 | 4, f_text: null }, { key: 0, ef_txt: "wizfliplevel", ef_desc: "flip the level", ef_funct: wiz_flip_level, flags: 1 | 4, f_text: null }, { key: (31 & (103)), ef_txt: "wizgenesis", ef_desc: "create a monster", ef_funct: wiz_genesis, flags: 1 | 4, f_text: null }, { key: (31 & (105)), ef_txt: "wizidentify", ef_desc: "identify all items in inventory", ef_funct: wiz_identify, flags: 1 | 4, f_text: null }, { key: 0, ef_txt: "wizintrinsic", ef_desc: "set an intrinsic", ef_funct: wiz_intrinsic, flags: 1 | 2 | 4, f_text: null }, { key: 0, ef_txt: "wizkill", ef_desc: "slay a monster", ef_funct: wiz_kill, flags: (1 | 2 | 4 | 128 | 32), f_text: null }, { key: (31 & (118)), ef_txt: "wizlevelport", ef_desc: "teleport to another level", ef_funct: wiz_level_tele, flags: 1 | 4 | 128, f_text: null }, { key: 0, ef_txt: "wizloaddes", ef_desc: "load and execute a des-file lua script", ef_funct: wiz_load_splua, flags: 1 | 4 | 32, f_text: null }, { key: 0, ef_txt: "wizloadlua", ef_desc: "load and execute a lua script", ef_funct: wiz_load_lua, flags: 1 | 4 | 32, f_text: null }, { key: 0, ef_txt: "wizobjprobs", ef_desc: "list object generation probabilities", ef_funct: wiz_objprobs, flags: 1 | 4, f_text: null }, { key: 0, ef_txt: "wizmakemap", ef_desc: "recreate the current level", ef_funct: wiz_makemap, flags: 1 | 4, f_text: null }, { key: (31 & (102)), ef_txt: "wizmap", ef_desc: "map the level", ef_funct: wiz_map, flags: 1 | 4, f_text: null }, { key: 0, ef_txt: "wizmondiff", ef_desc: "validate the difficulty ratings of monsters", ef_funct: wiz_mon_diff, flags: 1 | 2 | 4, f_text: null }, { key: 0, ef_txt: "wizrumorcheck", ef_desc: "verify rumor boundaries", ef_funct: wiz_rumor_check, flags: 1 | 2 | 4, f_text: null }, { key: 0, ef_txt: "wizseenv", ef_desc: "show map locations' seen vectors", ef_funct: wiz_show_seenv, flags: 1 | 2 | 4, f_text: null }, { key: 0, ef_txt: "wizshownhuuid", ef_desc: "show NHUUID for this game", ef_funct: wiz_show_nhuuid, flags: 2 | 4, f_text: null }, { key: 0, ef_txt: "wizsmell", ef_desc: "smell monster", ef_funct: wiz_smell, flags: 1 | 2 | 4, f_text: null }, { key: 0, ef_txt: "wiztelekinesis", ef_desc: "telekinesis", ef_funct: wiz_telekinesis, flags: 1 | 2 | 4, f_text: null }, { key: 0, ef_txt: "wizwhere", ef_desc: "show locations of special levels", ef_funct: wiz_where, flags: 1 | 2 | 4, f_text: null }, { key: (31 & (119)), ef_txt: "wizwish", ef_desc: "wish for something", ef_funct: wiz_wish, flags: 1 | 128 | 4, f_text: null }, { key: 0, ef_txt: "wmode", ef_desc: "show wall modes", ef_funct: wiz_show_wmodes, flags: 1 | 2 | 4, f_text: null }, { key: 122, ef_txt: "zap", ef_desc: "zap a wand", ef_funct: dozap, flags: 0, f_text: null }, { key: 0, ef_txt: "movewest", ef_desc: "move west (screen left)", ef_funct: do_move_west, flags: 1024 | (128 | 256), f_text: null }, { key: 0, ef_txt: "movenorthwest", ef_desc: "move northwest (screen upper left)", ef_funct: do_move_northwest, flags: 1024 | (128 | 256), f_text: null }, { key: 0, ef_txt: "movenorth", ef_desc: "move north (screen up)", ef_funct: do_move_north, flags: 1024 | (128 | 256), f_text: null }, { key: 0, ef_txt: "movenortheast", ef_desc: "move northeast (screen upper right)", ef_funct: do_move_northeast, flags: 1024 | (128 | 256), f_text: null }, { key: 0, ef_txt: "moveeast", ef_desc: "move east (screen right)", ef_funct: do_move_east, flags: 1024 | (128 | 256), f_text: null }, { key: 0, ef_txt: "movesoutheast", ef_desc: "move southeast (screen lower right)", ef_funct: do_move_southeast, flags: 1024 | (128 | 256), f_text: null }, { key: 0, ef_txt: "movesouth", ef_desc: "move south (screen down)", ef_funct: do_move_south, flags: 1024 | (128 | 256), f_text: null }, { key: 0, ef_txt: "movesouthwest", ef_desc: "move southwest (screen lower left)", ef_funct: do_move_southwest, flags: 1024 | (128 | 256), f_text: null }, { key: 0, ef_txt: "rushwest", ef_desc: "rush west (screen left)", ef_funct: do_rush_west, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "rushnorthwest", ef_desc: "rush northwest (screen upper left)", ef_funct: do_rush_northwest, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "rushnorth", ef_desc: "rush north (screen up)", ef_funct: do_rush_north, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "rushnortheast", ef_desc: "rush northeast (screen upper right)", ef_funct: do_rush_northeast, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "rusheast", ef_desc: "rush east (screen right)", ef_funct: do_rush_east, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "rushsoutheast", ef_desc: "rush southeast (screen lower right)", ef_funct: do_rush_southeast, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "rushsouth", ef_desc: "rush south (screen down)", ef_funct: do_rush_south, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "rushsouthwest", ef_desc: "rush southwest (screen lower left)", ef_funct: do_rush_southwest, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "runwest", ef_desc: "run west (screen left)", ef_funct: do_run_west, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "runnorthwest", ef_desc: "run northwest (screen upper left)", ef_funct: do_run_northwest, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "runnorth", ef_desc: "run north (screen up)", ef_funct: do_run_north, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "runnortheast", ef_desc: "run northeast (screen upper right)", ef_funct: do_run_northeast, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "runeast", ef_desc: "run east (screen right)", ef_funct: do_run_east, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "runsoutheast", ef_desc: "run southeast (screen lower right)", ef_funct: do_run_southeast, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "runsouth", ef_desc: "run south (screen down)", ef_funct: do_run_south, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "runsouthwest", ef_desc: "run southwest (screen lower left)", ef_funct: do_run_southwest, flags: 1024 | 128, f_text: null }, { key: 0, ef_txt: "clicklook", ef_desc: null, ef_funct: doclicklook, flags: 64 | 2048, f_text: null }, { key: 0, ef_txt: "mouseaction", ef_desc: null, ef_funct: domouseaction, flags: 64 | 2048, f_text: null }, { key: 0, ef_txt: "altadjust", ef_desc: null, ef_funct: adjust_split, flags: 64, f_text: null }, { key: 0, ef_txt: "altdip", ef_desc: null, ef_funct: dip_into, flags: 64, f_text: null }, { key: 0, ef_txt: "alttakeoff", ef_desc: null, ef_funct: ia_dotakeoff, flags: 64, f_text: null }, { key: 0, ef_txt: "altunwield", ef_desc: null, ef_funct: remarm_swapwep, flags: 64, f_text: null }, { key: 0, ef_txt: null, ef_desc: null, ef_funct: donull, flags: 0, f_text: null }];
/* allows 'm' prefix (for move without autopickup) but not the
                 g/G/F movement modifiers; not flagged as MOVEMENTCMD because
                 that would suppress it from dokeylist output */
/* #exploremode should be flagged AUTOCOMPETE but that would negatively
       impact frequently used #enhance by making #e become ambiguous */
/* 'm #options' runs doset() */
/* 'm #optionsfull' runs doset_simple() */
/* #overview used to need autocomplete and has retained that even
       after being assigned to ^O [old wizard mode ^O is now #wizwhere];
       'm' prefix displays overview as a menu where player can choose a
       level to supply with an annotation */
/* [should #panic actually autocomplete?] */
/* "modify command" is a vague description for use as no-autopickup,
       no-attack movement as well as miscellaneous non-movement things;
       key2extcmddesc() constructs a more explicit two line description
       for display by the '&' command and expects to find "prefix:" as
       the start of the text here */
/* SHELL */
/* $ is like ),=,&c but is not included with *, so not called "seegold" */
/* SUSPEND */
/* \177 == <del> aka <delete> aka <rubout>; some terminals have an
       option to swap it with <backspace> so if there's a key labeled
       <delete> it may or may not actually invoke the #terrain command */
/* (see comment for dodown() above */
/* movement commands will be bound by reset_commands() */
/* move or attack; accept m/g/G/F prefixes */
/* rush; accept m prefix but not g/G/F */
/* run; accept m prefix but not g/G/F */
/* internal commands: only used by game core, not available for user */
/* sentinel */
/* mapping direction and move mode to extended command function */
game.move_funcs = [[do_move_west, do_run_west, do_rush_west], [do_move_northwest, do_run_northwest, do_rush_northwest], [do_move_north, do_run_north, do_rush_north], [do_move_northeast, do_run_northeast, do_rush_northeast], [do_move_east, do_run_east, do_rush_east], [do_move_southeast, do_run_southeast, do_rush_southeast], [do_move_south, do_run_south, do_rush_south], [do_move_southwest, do_run_southwest, do_rush_southwest], [dodown, dodown, dodown], [doup, doup, doup]];
/* misleading; rush and run for down or up are rejected by rhack()
       because dodown() and doup() lack the CMD_gGF_PREFIX flag */
/* used by dokeylist() and by key2extcmddesc() for dowhatdoes() */
const misc_keys = [{ nhkf: NHKF_ESC, desc: "cancel current prompt or pending prefix", numpad: (0) }, { nhkf: NHKF_COUNT, desc: "Prefix: for digits when preceding a command with a count", numpad: (1) }, { nhkf: 0, desc: null, numpad: (0) }];
game.extcmdlist_length = (Math.trunc(171 /* sizeof(struct ext_func_tab [171]) */ / 1 /* sizeof(struct ext_func_tab) */)) - 1;
/* get entry i in the extended commands list. for windowport use. */
export function extcmds_getentry(i) {
    if (i < 0 || i > game.extcmdlist_length) {
        return null;
    }
    return game.extcmdlist[i];
}
/* get the command bound to a key */
export function cmdbind_get(key) {
    let bind = game.Cmd.cmdbinds;
    if (!key) {
        return null;
    }
    while (bind) {
        if (bind.key == key) {
            return bind;
        }
        bind = bind.next;
    }
    return bind;
}
export function cmdbind_add(key, extcmd, user) {
    let bind = cmdbind_get(key);
    if (!key) {
        return;
    }
    if (!extcmd && bind) {
        cmdbind_remove(key);
        return;
    }
    if (bind) {
        /* binding exists, set it to this command */
        bind.cmd = extcmd;
        bind.userbind = user;
        if (bind.param) {
            free(bind.param);
            bind.param = null;
        }
        return;
    } else {
        bind = alloc(1 /* sizeof(struct Cmd_bind) */);
        bind.key = key;
        bind.userbind = user;
        bind.param = null;
        bind.cmd = extcmd;
        bind.next = game.Cmd.cmdbinds;
        game.Cmd.cmdbinds = bind;
    }
}
export function cmdbind_remove(key) {
    let bind = game.Cmd.cmdbinds;
    let prev = null;
    while (bind) {
        if (bind.key == key) {
            if (prev) {
                prev.next = bind.next;
            } else {
                game.Cmd.cmdbinds = bind.next;
            }
            if (bind.param) {
                free(bind.param);
            }
            free(bind);
            return;
        }
        prev = bind;
        bind = bind.next;
    }
}
export function cmdbind_freeall() {
    let next = null;
    while (game.Cmd.cmdbinds) {
        next = game.Cmd.cmdbinds.next;
        if (game.Cmd.cmdbinds.param) {
            free(game.Cmd.cmdbinds.param);
        }
        free(game.Cmd.cmdbinds);
        game.Cmd.cmdbinds = next;
    }
}
/* swap key bindings for key1 and key2. both bindings must exist. */
export function cmdbind_swapkeys(key1, key2) {
    let bind1 = cmdbind_get(key1);
    let bind2 = cmdbind_get(key2);
    if (bind1 && bind2) {
        bind1.key = key2;
        bind2.key = key1;
    }
}
/* return number of extended commands bound to a non-default key */
export function count_bind_keys() {
    let bind = game.Cmd.cmdbinds;
    let i = 0;
    let nbinds = 0;
    let keys = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    memset(keys, 0, 1 /* sizeof(uchar) */ * 256);
    while (bind) {
        /* commands bound to different key */
        keys[bind.key] = 1;
        if (bind.userbind && bind.cmd && bind.cmd.key != bind.key) {
            nbinds++;
        }
        bind = bind.next;
    }
    /* commands which should be bound to a key, but aren't */
    for (i = 0; i < game.extcmdlist_length; i++) {
        if (game.extcmdlist[i].key && !keys[game.extcmdlist[i].key]) {
            nbinds++;
        }
    }
    return nbinds;
}
/* show changed key bindings in text, or if sbuf is non-null, append to it */
export function get_changed_key_binds(sbuf) {
    let win = (-1);
    let i = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let buf2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let bind = game.Cmd.cmdbinds;
    let keys = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    memset(keys, 0, 1 /* sizeof(uchar) */ * 256);
    if (!sbuf) {
        /* for movement prefix followed by '.' or (numpad && 's') to mean 'self';
       note: '-' for hands (inventory form of 'self') is not handled here */
        /* for movement prefix followed by up or down */
        /* was "upwards" and "downwards", but they're considered
                   to be variants of canonical "upward" and "downward" */
        /* if '!cmdassist', display via pline() and we're done (note: asking
       for help at getdir() prompt forces cmdassist for this operation) */
        /* when 'cmdassist' is off and caller doesn't insist, do nothing */
        win = (game.windowprocs.win_create_nhwindow)(5);
    }
    while (bind) {
        keys[bind.key] = 1;
        if (bind.userbind && bind.cmd && bind.cmd.key != bind.key) {
            if ((bind.cmd.flags & 16384) != 0) {
                buf = sprintf(buf, "BIND=%s:%s(%s)%s", key2txt(bind.key, buf2), bind.cmd.ef_txt, bind.param, sbuf ? "\n" : "");
            } else {
                buf = sprintf(buf, "BIND=%s:%s%s", key2txt(bind.key, buf2), bind.cmd.ef_txt, sbuf ? "\n" : "");
            }
            if (sbuf) {
                strbuf_append(sbuf, buf);
            } else {
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
        }
        bind = bind.next;
    }
    for (i = 0; i < game.extcmdlist_length; i++) {
        let ec = game.extcmdlist[i];
        if (ec.key && !keys[ec.key]) {
            buf = sprintf(buf, "BIND=%s:nothing%s", key2txt(ec.key, buf2), sbuf ? "\n" : "");
            if (sbuf) {
                strbuf_append(sbuf, buf);
            } else {
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
        }
    }
    if (!sbuf) {
        (game.windowprocs.win_display_nhwindow)(win, (1));
        (game.windowprocs.win_destroy_nhwindow)(win);
    }
}
/* interactive key binding */
export function handler_rebind_keys_add(keyfirst) {
    let ec = null;
    let win = 0;
    let any = 0;
    let i = 0;
    let npick = 0;
    let picks = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let buf2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let key = 0;
    let clr = 8;
    if (keyfirst) {
        pline("Bind which key? ");
        key = pgetchar();
        if (!key || key == 27) {
            return;
        }
    }
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    any = cg.zeroany;
    if (key) {
        let bind = cmdbind_get(key);
        if (bind && bind.cmd) {
            buf = sprintf(buf, "Key '%s' is currently bound to \"%s\".", key2txt(key, buf2), bind.cmd.ef_txt);
        } else {
            buf = sprintf(buf, "Key '%s' is not bound to anything.", key2txt(key, buf2));
        }
        add_menu_str(win, buf);
        add_menu_str(win, "");
    }
    any.a_int = -1;
    add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, "nothing: unbind the key", 0);
    add_menu_str(win, "");
    for (i = 0; i < game.extcmdlist_length; i++) {
        ec = game.extcmdlist[i];
        if ((ec.flags & (1024 | 64 | 16)) != 0) {
            continue;
        }
        any.a_int = (i + 1);
        buf = sprintf(buf, "%s: %s", ec.ef_txt, ec.ef_desc);
        add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
    }
    if (key) {
        buf = sprintf(buf, "Bind '%s' to what command?", key2txt(key, buf2));
    } else {
        buf = sprintf(buf, "Bind what command?");
    }
    (game.windowprocs.win_end_menu)(win, buf);
    npick = select_menu(win, 1, picks);
    (game.windowprocs.win_destroy_nhwindow)(win);
    if (npick > 0) {
        let prevcmd = null;
        let cmdstr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        bindit: {
            i = picks.item.a_int;
            free(picks);
            if (i == -1) {
                ec = null;
                cmdstr = strcat(cmdstr, "nothing");
                break bindit;
            } else {
                ec = game.extcmdlist[i - 1];
                if ((ec.flags & 16384) != 0) {
                    let parambuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    let querybuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    parambuf[0] = 0;
                    querybuf = sprintf(querybuf, "Command %s requires a parameter:", ec.ef_txt);
                    getlin(querybuf, parambuf);
                    parambuf = mungspaces(parambuf);
                    nh_snprintf("handler_rebind_keys_add", 2376, cmdstr, 256 - 1, "%s(%s)", ec.ef_txt, parambuf);
                    cmdstr[256 - 1] = 0;
                } else {
                    cmdstr = strcat(cmdstr, ec.ef_txt);
                }
            }
        }
        if (!key) {
            pline("Bind which key? ");
            key = pgetchar();
            if (!key || key == 27) {
                return;
            }
        }
        prevcmd = cmdbind_get(key);
        if (bind_key(key, cmdstr, (1))) {
            if (prevcmd && prevcmd.cmd != ec) {
                pline("Changed key '%s' from \"%s\" to \"%s\".", key2txt(key, buf2), prevcmd.cmd.ef_txt, cmdstr);
            } else if (!prevcmd) {
                pline("Bound key '%s' to \"%s\".", key2txt(key, buf2), cmdstr);
            }
        } else {
            pline("Key binding failed?!");
        }
    }
}
export function handler_rebind_keys() {
    let win = 0;
    let any = 0;
    let i = 0;
    let npick = 0;
    let picks = null;
    let clr = 8;
    redo_rebind: while (true) {
        win = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(win, 0);
        any = cg.zeroany;
        any.a_int = 1;
        add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, "bind key to a command", 0);
        any.a_int = 2;
        add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, "bind command to a key", 0);
        if (count_bind_keys()) {
            any.a_int = 3;
            add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, "view changed key binds", 0);
        }
        (game.windowprocs.win_end_menu)(win, "Do what?");
        npick = select_menu(win, 1, picks);
        (game.windowprocs.win_destroy_nhwindow)(win);
        if (npick > 0) {
            i = picks.item.a_int;
            free(picks);
            if (i == 1 || i == 2) {
                handler_rebind_keys_add((i == 1));
            } else if (i == 3) {
                get_changed_key_binds(null);
            }
            continue redo_rebind;
        }
        break;
    }
}
export function handler_change_autocompletions() {
    let win = 0;
    let any = 0;
    let i = 0;
    let n = 0;
    let picks = null;
    let clr = 8;
    let ec = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    any = cg.zeroany;
    for (i = 0; i < game.extcmdlist_length; i++) {
        ec = game.extcmdlist[i];
        if ((ec.flags & (64 | 16)) != 0) {
            continue;
        }
        if (strlen(ec.ef_txt) < 2) {
            continue;
        }
        any.a_int = (i + 1);
        buf = sprintf(buf, "%c %s: %s", (ec.flags & 8192) ? 42 : 32, ec.ef_txt, ec.ef_desc);
        add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, buf, (ec.flags & 2) ? 1 : 0);
    }
    (game.windowprocs.win_end_menu)(win, "Which commands autocomplete?");
    n = select_menu(win, 2, picks);
    if (n >= 0) {
        let j = 0;
        for (i = 0; i < game.extcmdlist_length; i++) {
            let setit = (0);
            ec = game.extcmdlist[i];
            if ((ec.flags & (64 | 16)) != 0) {
                continue;
            }
            if (strlen(ec.ef_txt) < 2) {
                continue;
            }
            buf = sprintf(buf, "%s", ec.ef_txt);
            for (j = 0; j < n; ++j) {
                if (ec == game.extcmdlist[(picks[j].item.a_int - 1)]) {
                    parseautocomplete(buf, (1));
                    setit = (1);
                    break;
                }
            }
            if (!setit) {
                parseautocomplete(buf, (0));
            }
        }
        if (n > 0) {
            free(picks);
        }
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
}
/* find extended command entries matching findstr.
   if findstr is NULL, returns all available entries.
   returns: number of matching extended commands,
            and the entry indexes in matchlist.
   for windowport use. */
let __extcmds_match_retmatchlist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function extcmds_match(findstr, ecmflags, matchlist) {
    let i = 0;
    let mi = 0;
    let fslen = findstr ? Strlen_(findstr, "extcmds_match", 2527) : 0;
    let ignoreac = (ecmflags & 1) != 0;
    let exactmatch = (ecmflags & 2) != 0;
    let no1charcmd = (ecmflags & 4) != 0;
    for (i = 0; game.extcmdlist[i].ef_txt; i++) {
        if (game.extcmdlist[i].flags & (16 | 64)) {
            continue;
        }
        if (!game.flags.debug && (game.extcmdlist[i].flags & 4)) {
            continue;
        }
        if (!ignoreac && !(game.extcmdlist[i].flags & 2)) {
            continue;
        }
        if (no1charcmd && (strlen(game.extcmdlist[i].ef_txt) == 1)) {
            continue;
        }
        if (!findstr) {
            __extcmds_match_retmatchlist[mi++] = i;
        } else if (exactmatch) {
            if (!strncmpi((findstr), (game.extcmdlist[i].ef_txt), -1)) {
                __extcmds_match_retmatchlist[mi++] = i;
            }
        } else {
            if (!strncmpi(findstr, game.extcmdlist[i].ef_txt, fslen)) {
                __extcmds_match_retmatchlist[mi++] = i;
            }
        }
    }
    if (matchlist) {
        matchlist.value = __extcmds_match_retmatchlist;
    }
    return mi;
}
let __key2extcmddesc_key2cmdbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function key2extcmddesc(key) {
    let txt = null;
    let k = 0;
    let i = 0;
    let j = 0;
    let M_5 = ((53) - 128);
    let M_0 = ((48) - 128);
    let cmdbind = null;
    /* need to check for movement commands before checking the extended
       commands table because it contains entries for number_pad commands
       that match !number_pad movement (like 'j' for "jump") */
    __key2extcmddesc_key2cmdbuf[0] = 0;
    if (movecmd(k = key, MV_WALK)) {
        __key2extcmddesc_key2cmdbuf = strcpy(__key2extcmddesc_key2cmdbuf, "move");
    } else if (movecmd(k = key, MV_RUSH)) {
        __key2extcmddesc_key2cmdbuf = strcpy(__key2extcmddesc_key2cmdbuf, "rush");
    } else if (movecmd(k = key, MV_RUN)) {
        __key2extcmddesc_key2cmdbuf = strcpy(__key2extcmddesc_key2cmdbuf, "run");
    }
    if (digit(key) || (game.Cmd.num_pad && digit((127 & (key))))) {
        __key2extcmddesc_key2cmdbuf[0] = 0;
        if (!game.Cmd.num_pad) {
            __key2extcmddesc_key2cmdbuf = strcpy(__key2extcmddesc_key2cmdbuf, "start of, or continuation of, a count");
        } else if (key == 53 || key == M_5) {
            __key2extcmddesc_key2cmdbuf = sprintf(__key2extcmddesc_key2cmdbuf, "%s prefix", (!!game.Cmd.pcHack_compat ^ (key == M_5)) ? "run" : "rush");
        } else if (key == 48 || (game.Cmd.pcHack_compat && key == M_0)) {
            __key2extcmddesc_key2cmdbuf = strcpy(__key2extcmddesc_key2cmdbuf, "synonym for 'i'");
        }
        if (__key2extcmddesc_key2cmdbuf) {
            return __key2extcmddesc_key2cmdbuf;
        }
    }
    for (i = 0; misc_keys[i].desc; ++i) {
        /* check prefixes before regular commands; includes ^A pseudo-command */
        if (misc_keys[i].numpad && !game.iflags.num_pad) {
            continue;
        }
        j = misc_keys[i].nhkf;
        if (key == game.Cmd.spkeys[j]) {
            return misc_keys[i].desc;
        }
    }
    if ((cmdbind = cmdbind_get(key)) != null && cmdbind.cmd && (txt = cmdbind.cmd.ef_txt) != null) {
        __key2extcmddesc_key2cmdbuf = sprintf(__key2extcmddesc_key2cmdbuf, "%s (#%s)", cmdbind.cmd.ef_desc, txt);
        /* finally, check whether 'key' is a command */
        /* special case: for reqmenu prefix (normally 'm'), replace
           "prefix: request menu or modify command (#reqmenu)"
           with two-line "movement prefix:...\nnon-movement prefix:..." */
        if (!strncmpi(__key2extcmddesc_key2cmdbuf, "prefix:", 7) && !strncmpi((txt), ("reqmenu"), -1)) {
            __key2extcmddesc_key2cmdbuf = strsubst(__key2extcmddesc_key2cmdbuf, "prefix:", "movement prefix: move without autopickup and without attacking\nnon-movement prefix:");
        }
        /* another special case: 'txt' for '#' is "#" and showing that as
           "perform an extended command (##)" looks silly; strip "(##)" off */
        return strsubst(__key2extcmddesc_key2cmdbuf, " (##)", "");
    }
    return null;
}
export function bind_mousebtn(btn, command) {
    let extcmd = null;
    if (btn < 1 || btn > 2) {
        config_error_add("Wrong mouse button, valid are 1-%i", 2);
        return (0);
    }
    btn--;
    if (!strncmpi((command), ("nothing"), -1)) {
        /* special case: "nothing" is reserved for unbinding */
        game.Cmd.mousebtn[btn] = null;
        /* silently accept key binding for unavailable command (!SHELL,&c) */
        return (1);
    }
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        if (strncmpi((command), (extcmd.ef_txt), -1)) {
            continue;
        }
        if (!(extcmd.flags & 2048)) {
            continue;
        }
        game.Cmd.mousebtn[btn] = extcmd;
        return (1);
    }
    return (0);
}
export function bind_key(key, command, user) {
    let extcmd = null;
    let len = 0;
    let buf = null;
    let p = null;
    let lastp = null;
    if (!strncmpi((command), ("nothing"), -1)) {
        cmdbind_remove(key);
        return (1);
    }
    /* copy command to buf for modification */
    len = strlen(command) + 1;
    buf = alloc(len);
    buf = strncpy(buf, command, len);
    if ((p = strchr(buf, 40)) != null && (lastp = strrchr(buf, 41)) != null && (lastp > p)) {
        /* does buf have a parameter in parenthesis? */
        /* break off first autocomplete from the rest; parse the rest */
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        p++;
    }
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        /* p points to the parameter */
        if (strncmpi((buf), (extcmd.ef_txt), -1)) {
            continue;
        }
        if ((extcmd.flags & 64) != 0) {
            continue;
        }
        cmdbind_add(key, extcmd, user);
        if ((extcmd.flags & 16384) != 0) {
            if (!p) {
                config_error_add("'%s' requires a parameter", buf);
            } else {
                let bind = cmdbind_get(key);
                let maxlen = ((30) < (strlen(p)) ? (30) : (strlen(p))) + 1;
                if (maxlen <= 1) {
                    config_error_add("Required parameter cannot be empty");
                } else {
                    bind.param = alloc(maxlen);
                    bind.param = strncpy(bind.param, p, maxlen);
                    bind.param[maxlen - 1] = 0;
                }
            }
        } else if (p && strlen(p) > 0) {
            config_error_add("'%s' does not take a parameter", buf);
        }
        free(buf);
        return (1);
    }
    free(buf);
    return (0);
}
/* bind key by ext cmd function */
export function bind_key_fn(key, fn) {
    let extcmd = null;
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        if (extcmd.ef_funct != fn) {
            continue;
        }
        if ((extcmd.flags & 64) != 0) {
            continue;
        }
        cmdbind_add(key, extcmd, (0));
        return (1);
    }
    return (0);
}
/* initialize all keyboard commands */
export function commands_init() {
    let extcmd = null;
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        if (extcmd.key) {
            cmdbind_add(extcmd.key, extcmd, (0));
        }
    }
    bind_mousebtn(1, "therecmdmenu");
    bind_mousebtn(2, "clicklook");
    bind_key((31 & (108)), "redraw", (0));
    bind_key(104, "help", (0));
    bind_key(106, "jump", (0));
    bind_key(107, "kick", (0));
    bind_key(108, "loot", (0));
    bind_key((31 & (110)), "annotate", (0));
    bind_key(78, "name", (0));
    bind_key(117, "untrap", (0));
    bind_key(53, "run", (0));
    bind_key(((53) - 128), "rush", (0));
    bind_key(45, "fight", (0));
    bind_key(((79) - 128), "overview", (0));
    bind_key(((50) - 128), "twoweapon", (0));
    /* don't do this until the rest_on_space option is set or cleared */
    bind_key(((78) - 128), "name", (0));
}
/* boolean keys_used[256] */
export function keylist_func_has_key(extcmd, skip_keys_used) {
    let i = 0;
    let bind = null;
    for (i = 0; i < 256; ++i) {
        if (skip_keys_used[i]) {
            continue;
        }
        if (((bind = cmdbind_get(i)) != null) && (bind.cmd == extcmd)) {
            return (1);
        }
    }
    return (0);
}
/* boolean keys_used[256] */
export function keylist_putcmds(datawin, docount, incl_flags, excl_flags, keys_used) {
    let extcmd = null;
    let i = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let buf2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* copy of keys_used[] before updates */
    let keys_already_used = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let count = 0;
    let bind = null;
    for (i = 0; i < 256; i++) {
        let key = i;
        keys_already_used[i] = keys_used[i];
        if (keys_used[i]) {
            continue;
        }
        if (key == 32 && !game.flags.rest_on_space) {
            continue;
        }
        bind = cmdbind_get(key);
        if (bind && bind.cmd != null) {
            if ((incl_flags && !(bind.cmd.flags & incl_flags)) || (excl_flags && (bind.cmd.flags & excl_flags))) {
                continue;
            }
            if (docount) {
                /* found a command for current category without any key assignment */
                count++;
                continue;
            }
            if ((bind.cmd.flags & 16384) != 0) {
                buf = sprintf(buf, "%-7s %-13s %s \"%s\"", key2txt(key, buf2), bind.cmd.ef_txt, bind.cmd.ef_desc, bind.param);
            } else {
                buf = sprintf(buf, "%-7s %-13s %s", key2txt(key, buf2), bind.cmd.ef_txt, bind.cmd.ef_desc);
            }
            /* '#'+20 for one column here == 7+' '+13 for two columns above */
            (game.windowprocs.win_putstr)(datawin, 0, buf);
            keys_used[i] = (1);
        }
    }
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        /* also list commands that lack key assignments; most are wizard mode */
        if ((incl_flags && !(extcmd.flags & incl_flags)) || (excl_flags && (extcmd.flags & excl_flags))) {
            continue;
        }
        /* can't just check for non-Null extcmd->key; it holds the
           default assignment and a user-specified binding might hijack
           this command's default key for some other command; or this
           command might have been assigned a key being used for
           movement or as a prefix, intercepting that keystroke */
        if (keylist_func_has_key(extcmd, keys_already_used)) {
            continue;
        }
        if (docount) {
            count++;
            continue;
        }
        buf = sprintf(buf, "#%-20s %s", extcmd.ef_txt, extcmd.ef_desc);
        (game.windowprocs.win_putstr)(datawin, 0, buf);
    }
    return count;
}
/* list all keys and their bindings, like dat/hh but dynamic */
export function dokeylist() {
    let extcmd = null;
    let datawin = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let buf2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let key = 0;
    let spkey_gap = 0;
    let keys_used = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let mov_seen = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    let j = 0;
    let pfx_seen = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    memset(keys_used, 0, 256 /* sizeof(boolean [256]) */);
    memset(pfx_seen, 0, 1024 /* sizeof(int [256]) */);
    /* this is actually ambiguous; tty raw mode will override SIGINT;
       when enabled, treat it like a movement command since assigning
       other commands to this keystroke would be unwise... */
    key = (31 & (99));
    keys_used[key] = (1);
    /* movement keys have been flagged in keys_used[]; clone them */
    memcpy(mov_seen, keys_used, 256 /* sizeof(boolean [256]) */);
    spkey_gap = (0);
    for (i = 0; misc_keys[i].desc; ++i) {
        if (misc_keys[i].numpad && !game.iflags.num_pad) {
            continue;
        }
        j = misc_keys[i].nhkf;
        key = game.Cmd.spkeys[j];
        if (key && !mov_seen[key] && !pfx_seen[key]) {
            keys_used[key] = (1);
            pfx_seen[key] = j;
        } else {
            spkey_gap = (1);
        }
    }
    datawin = (game.windowprocs.win_create_nhwindow)(5);
    (game.windowprocs.win_putstr)(datawin, 0, "");
    buf = sprintf(buf, "%7s %s", "", "    Full Current Key Bindings List");
    (game.windowprocs.win_putstr)(datawin, 0, buf);
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        if (spkey_gap || !keylist_func_has_key(extcmd, keys_used)) {
            buf = sprintf(buf, "%7s %s", "", "(also commands with no key assignment)");
            (game.windowprocs.win_putstr)(datawin, 0, buf);
            break;
        }
    }
    (game.windowprocs.win_putstr)(datawin, 0, "");
    (game.windowprocs.win_putstr)(datawin, 0, "Directional keys:");
    /* '.'==self in direct'n grid */
    show_direction_keys(datawin, 46, (0));
    if (!game.iflags.num_pad) {
        (game.windowprocs.win_putstr)(datawin, 0, "");
        (game.windowprocs.win_putstr)(datawin, 0, "Ctrl+<direction> will run in specified direction until something very");
        buf = sprintf(buf, "%7s %s", "", "interesting is seen.");
        (game.windowprocs.win_putstr)(datawin, 0, buf);
        buf = strcpy(buf, "Shift");
    } else {
        (game.windowprocs.win_putstr)(datawin, 0, "");
        buf = strcpy(buf, "Meta");
    }
    buf = strcat(buf, "+<direction> will run in specified direction until you encounter");
    (game.windowprocs.win_putstr)(datawin, 0, buf);
    buf = sprintf(buf, "%7s %s", "", "an obstacle.");
    (game.windowprocs.win_putstr)(datawin, 0, buf);
    (game.windowprocs.win_putstr)(datawin, 0, "");
    (game.windowprocs.win_putstr)(datawin, 0, "Miscellaneous keys:");
    for (i = 0; misc_keys[i].desc; ++i) {
        if (misc_keys[i].numpad && !game.iflags.num_pad) {
            continue;
        }
        j = misc_keys[i].nhkf;
        key = game.Cmd.spkeys[j];
        if (key && !mov_seen[key] && (pfx_seen[key] == j)) {
            buf = sprintf(buf, "%-7s %s", key2txt(key, buf2), misc_keys[i].desc);
            (game.windowprocs.win_putstr)(datawin, 0, buf);
        }
    }
    key = (31 & (99));
    buf = sprintf(buf, "%-7s", key2txt(key, buf2));
    buf = strcat(buf, " interrupt: break out of NetHack (SIGINT)");
    (game.windowprocs.win_putstr)(datawin, 0, buf);
    if (spkey_gap) {
        for (i = 0; misc_keys[i].desc; ++i) {
            /* last of the special keys */
            /* first of the keyless commands */
            /* keyless special key commands, if any */
            if (misc_keys[i].numpad && !game.iflags.num_pad) {
                continue;
            }
            j = misc_keys[i].nhkf;
            key = game.Cmd.spkeys[j];
            if (!key || (pfx_seen[key] != j)) {
                buf2 = sprintf(buf2, "[%s]", spkey_name(j));
                nh_snprintf("dokeylist", 2976, buf, 256 /* sizeof(char [256]) */, "%-21s %s", buf2, misc_keys[i].desc);
                (game.windowprocs.win_putstr)(datawin, 0, buf);
            }
        }
    }
    (game.windowprocs.win_putstr)(datawin, 0, "");
    show_menu_controls(datawin, (1));
    if (keylist_putcmds(datawin, (1), 8, (4 | 64 | 1024), keys_used)) {
        (game.windowprocs.win_putstr)(datawin, 0, "");
        (game.windowprocs.win_putstr)(datawin, 0, "General commands:");
        /* lines up with the other unassigned commands which use
                   "#%-20s ", but not with the other special keys */
        keylist_putcmds(datawin, (0), 8, (4 | 64 | 1024), keys_used);
    }
    if (keylist_putcmds(datawin, (1), 0, 8 | (4 | 64 | 1024), keys_used)) {
        (game.windowprocs.win_putstr)(datawin, 0, "");
        (game.windowprocs.win_putstr)(datawin, 0, "Game commands:");
        keylist_putcmds(datawin, (0), 0, 8 | (4 | 64 | 1024), keys_used);
    }
    if (game.flags.debug && keylist_putcmds(datawin, (1), 4, 64, keys_used)) {
        (game.windowprocs.win_putstr)(datawin, 0, "");
        (game.windowprocs.win_putstr)(datawin, 0, "Debug mode commands:");
        keylist_putcmds(datawin, (0), 4, 64, keys_used);
    }
    (game.windowprocs.win_display_nhwindow)(datawin, (0));
    (game.windowprocs.win_destroy_nhwindow)(datawin);
}
export function ext_func_tab_from_func(fn) {
    let extcmd = null;
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        if (extcmd.ef_funct == fn) {
            return extcmd;
        }
    }
    return null;
}
/* returns the key bound to a movement command for given DIR_ and MV_ mode */
export function cmd_from_dir(dir, mode) {
    return cmd_from_func(game.move_funcs[dir][mode]);
}
/* return the key bound to extended command */
export function cmd_from_func(fn) {
    let i = 0;
    let ret = 0;
    let bind = null;
    for (bind = game.Cmd.cmdbinds; bind; bind = bind.next) {
        i = bind.key;
        /* skip space; we'll use it below as last resort if no other
           keystroke invokes space's command */
        if (i == 32) {
            continue;
        }
        /* skip digits if number_pad is Off; also skip '-' unless it has
           been bound to something other than what number_pad assigns */
        if (((i >= 48 && i <= 57) || (i == 45 && fn == do_fight)) && !game.Cmd.num_pad) {
            continue;
        }
        if (bind.cmd && bind.cmd.ef_funct == fn) {
            if (i >= 32 && i <= 126) {
                return i;
            } else {
                ret = i;
            }
        }
    }
    if ((bind = cmdbind_get(32)) != null && bind.cmd && bind.cmd.ef_funct == fn) {
        return 32;
    }
    return ret;
}
/* return visual interpretation of the key bound to extended command,
   or the ext cmd name if not bound to any key. */
let __cmd_from_ecname_cmdnamebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function cmd_from_ecname(ecname) {
    let extcmd = null;
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        if (!strcmp(extcmd.ef_txt, ecname)) {
            let key = cmd_from_func(extcmd.ef_funct);
            if (key) {
                __cmd_from_ecname_cmdnamebuf = sprintf(__cmd_from_ecname_cmdnamebuf, "%s", visctrl(key));
            } else {
                __cmd_from_ecname_cmdnamebuf = sprintf(__cmd_from_ecname_cmdnamebuf, "#%s", ecname);
            }
            return __cmd_from_ecname_cmdnamebuf;
        }
    }
    __cmd_from_ecname_cmdnamebuf[0] = 0;
    return __cmd_from_ecname_cmdnamebuf;
}
export function ecname_from_fn(fn) {
    let extcmd = null;
    let cmdptr = null;
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        if (extcmd.ef_funct == fn) {
            cmdptr = extcmd;
            return cmdptr.ef_txt;
        }
    }
    return null;
}
/* return extended command name (without leading '#') for command (*fn)() */
/* function whose command name is wanted */
/* place to store the result */
/* False: just enough to disambiguate */
export function cmdname_from_func(fn, outbuf, fullname) {
    let extcmd = null;
    let cmdptr = null;
    let res = null;
    for (let __nhi_extcmd = 0; (extcmd = game.extcmdlist[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
        if (extcmd.ef_funct == fn) {
            cmdptr = extcmd;
            res = cmdptr.ef_txt;
            break;
        }
    }
    if (!res) {
        /* make sure output buffer doesn't contain junk or stale data;
           return Null below */
        outbuf[0] = 0;
    } else if (fullname) {
        /* easy; the entire command name */
        res = strcpy(outbuf, res);
    } else {
        let matchcmd = game.extcmdlist;
        let len = 0;
        let maxlen = Strlen_(res, "cmdname_from_func", 3130);
        do {
            if (++len >= maxlen) {
                break;
            }
            for (let __nhi_extcmd = 0; (extcmd = matchcmd[__nhi_extcmd]) && (extcmd.ef_txt); __nhi_extcmd++) {
                /* find the shortest leading substring which is unambiguous */
                if (extcmd == cmdptr) {
                    continue;
                }
                if ((extcmd.flags & 16) != 0 || ((extcmd.flags & 4) != 0 && !game.flags.debug)) {
                    continue;
                }
                if (!strncmp(res, extcmd.ef_txt, len)) {
                    matchcmd = extcmd;
                    break;
                }
            }
        } while (extcmd.ef_txt);
        outbuf = copynchars(outbuf, res, len);
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/cmd.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("shortened %s: \"%s\"", res, outbuf);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        /* [note: for Qt, this debugpline writes a couple dozen lines to
            stdout during menu setup when message window isn't ready yet] */
        res = outbuf;
    }
    return res;
}
const spkeys_binds = [{ nhkf: NHKF_ESC, key: 27, name: null }, { nhkf: NHKF_GETDIR_SELF, key: 46, name: "getdir.self" }, { nhkf: NHKF_GETDIR_SELF2, key: 115, name: "getdir.self2" }, { nhkf: NHKF_GETDIR_HELP, key: 63, name: "getdir.help" }, { nhkf: NHKF_GETDIR_MOUSE, key: 95, name: "getdir.mouse" }, { nhkf: NHKF_COUNT, key: 110, name: "count" }, { nhkf: NHKF_GETPOS_SELF, key: 64, name: "getpos.self" }, { nhkf: NHKF_GETPOS_PICK, key: 46, name: "getpos.pick" }, { nhkf: NHKF_GETPOS_PICK_Q, key: 44, name: "getpos.pick.quick" }, { nhkf: NHKF_GETPOS_PICK_O, key: 59, name: "getpos.pick.once" }, { nhkf: NHKF_GETPOS_PICK_V, key: 58, name: "getpos.pick.verbose" }, { nhkf: NHKF_GETPOS_SHOWVALID, key: 36, name: "getpos.valid" }, { nhkf: NHKF_GETPOS_AUTODESC, key: 35, name: "getpos.autodescribe" }, { nhkf: NHKF_GETPOS_MON_NEXT, key: 109, name: "getpos.mon.next" }, { nhkf: NHKF_GETPOS_MON_PREV, key: 77, name: "getpos.mon.prev" }, { nhkf: NHKF_GETPOS_OBJ_NEXT, key: 111, name: "getpos.obj.next" }, { nhkf: NHKF_GETPOS_OBJ_PREV, key: 79, name: "getpos.obj.prev" }, { nhkf: NHKF_GETPOS_DOOR_NEXT, key: 100, name: "getpos.door.next" }, { nhkf: NHKF_GETPOS_DOOR_PREV, key: 68, name: "getpos.door.prev" }, { nhkf: NHKF_GETPOS_UNEX_NEXT, key: 120, name: "getpos.unexplored.next" }, { nhkf: NHKF_GETPOS_UNEX_PREV, key: 88, name: "getpos.unexplored.prev" }, { nhkf: NHKF_GETPOS_VALID_NEXT, key: 122, name: "getpos.valid.next" }, { nhkf: NHKF_GETPOS_VALID_PREV, key: 90, name: "getpos.valid.prev" }, { nhkf: NHKF_GETPOS_INTERESTING_NEXT, key: 97, name: "getpos.all.next" }, { nhkf: NHKF_GETPOS_INTERESTING_PREV, key: 65, name: "getpos.all.prev" }, { nhkf: NHKF_GETPOS_HELP, key: 63, name: "getpos.help" }, { nhkf: NHKF_GETPOS_LIMITVIEW, key: 34, name: "getpos.filter" }, { nhkf: NHKF_GETPOS_MOVESKIP, key: 42, name: "getpos.moveskip" }, { nhkf: NHKF_GETPOS_MENU, key: 33, name: "getpos.menu" }];
/* no binding */
export function bind_specialkey(key, command) {
    let i = 0;
    for (i = 0; i < (Math.trunc(29 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/cmd.c:3157:8) [29]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/cmd.c:3157:8)) */)); i++) {
        if (!spkeys_binds[i].name || strcmp(command, spkeys_binds[i].name)) {
            continue;
        }
        game.Cmd.spkeys[spkeys_binds[i].nhkf] = key;
        return (1);
    }
    return (0);
}
export function spkey_name(nhkf) {
    let name = null;
    let i = 0;
    for (i = 0; i < (Math.trunc(29 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/cmd.c:3157:8) [29]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/cmd.c:3157:8)) */)); i++) {
        if (spkeys_binds[i].nhkf == nhkf) {
            name = (nhkf == NHKF_ESC) ? "escape" : spkeys_binds[i].name;
            break;
        }
    }
    return name;
}
/* returns the text for a one-byte encoding;
 * must be shorter than a tab for proper formatting */
/* sufficiently long buffer */
export function key2txt(c, txt) {
    /* should probably switch to "SPC", "ESC", "RET"
       since nethack's documentation uses ESC for <escape> */
    if (c == 32) {
        txt = sprintf(txt, "<space>");
    } else if (c == 27) {
        txt = sprintf(txt, "<esc>");
    } else if (c == 10) {
        txt = sprintf(txt, "<enter>");
    } else if (c == 127) {
        txt = sprintf(txt, "<del>");
    } else {
        txt = strcpy(txt, visctrl(c));
    }
    return txt;
}
export function parseautocomplete(autocomplete, condition) {
    let efp = null;
    let autoc = null;
    if ((autoc = strchr(autocomplete, 44)) != null || (autoc = strchr(autocomplete, 58)) != null) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        parseautocomplete(autoc, condition);
    }
    /* strip leading and trailing white space */
    autocomplete = trimspaces(autocomplete);
    if (!autocomplete.value) {
        return;
    }
    if (autocomplete.value == 33) {
        /* unlike most options, a leading "no" might actually be a part of
         * the extended command.  Thus you have to use ! */
        autocomplete++;
        autocomplete = trimspaces(autocomplete);
        condition = !condition;
    }
    for (let __nhi_efp = 0; (efp = game.extcmdlist[__nhi_efp]) && (efp.ef_txt); __nhi_efp++) {
        if (!strcmp(autocomplete, efp.ef_txt)) {
            if (condition == ((efp.flags & 2) ? (0) : (1))) {
                if ((efp.flags & 8192)) {
                    efp.flags &= ~8192;
                /* find and modify the extended command */
                } else {
                    efp.flags |= 8192;
                }
            }
            if (condition) {
                efp.flags |= 2;
            } else {
                efp.flags &= ~2;
            }
            return;
        }
    }
    /* not a real extended command */
    raw_printf("Bad autocomplete: invalid extended command '%s'.", autocomplete);
    (game.windowprocs.win_wait_synch)();
}
/* add changed autocompletions to the string buffer in config file format */
export function all_options_autocomplete(sbuf) {
    let efp = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let __nhi_efp = 0; (efp = game.extcmdlist[__nhi_efp]) && (efp.ef_txt); __nhi_efp++) {
        if ((efp.flags & 8192) != 0) {
            buf = sprintf(buf, "AUTOCOMPLETE=%s%s\n", (efp.flags & 2) ? "" : "!", efp.ef_txt);
            strbuf_append(sbuf, buf);
        }
    }
}
/* return the number of changed autocompletions */
export function count_autocompletions() {
    let efp = null;
    let n = 0;
    for (let __nhi_efp = 0; (efp = game.extcmdlist[__nhi_efp]) && (efp.ef_txt); __nhi_efp++) {
        if ((efp.flags & 8192) != 0) {
            n++;
        }
    }
    return n;
}
/* save&clear the mouse button actions, or restore the saved ones */
const __lock_mouse_buttons_mousebtn = [null, null];
export function lock_mouse_buttons(savebtns) {
    let i = 0;
    if (savebtns) {
        for (i = 0; i < 2; i++) {
            __lock_mouse_buttons_mousebtn[i] = game.Cmd.mousebtn[i];
            game.Cmd.mousebtn[i] = null;
        }
    } else {
        for (i = 0; i < 2; i++) {
            game.Cmd.mousebtn[i] = __lock_mouse_buttons_mousebtn[i];
        }
    }
}
/* called at startup and after number_pad is twiddled */
const __reset_commands_sdir = "hykulnjb><";
const __reset_commands_sdir_swap_yz = "hzkulnjb><";
const __reset_commands_ndir = "47896321><";
const __reset_commands_ndir_phone_layout = "41236987><";
const __reset_commands_ylist = [121, 89, (31 & (121)), ((121) - 128), ((89) - 128), (((31 & (121))) - 128)];
let __reset_commands_back_dir_cmd = [[null, null, null], [null, null, null], [null, null, null], [null, null, null], [null, null, null], [null, null, null], [null, null, null], [null, null, null]];
let __reset_commands_back_dir_key = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
let __reset_commands_backed_dir_cmd = (0);
export function reset_commands(initial) {
    let flagtemp = 0;
    let c = 0;
    let i = 0;
    let updated = 0;
    let dir = 0;
    let mode = 0;
    if (initial) {
        updated = 1;
        game.Cmd.num_pad = (0);
        game.Cmd.pcHack_compat = game.Cmd.phone_layout = game.Cmd.swap_yz = (0);
        for (i = 0; i < (Math.trunc(29 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/cmd.c:3157:8) [29]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/cmd.c:3157:8)) */)); i++) {
            game.Cmd.spkeys[spkeys_binds[i].nhkf] = spkeys_binds[i].key;
        }
        commands_init();
    } else {
        if (__reset_commands_backed_dir_cmd) {
            for (dir = 0; dir < (N_DIRS_Z - 2); dir++) {
                for (mode = 0; mode < N_MOVEMODES; mode++) {
                    cmdbind_add(__reset_commands_back_dir_key[dir][mode], __reset_commands_back_dir_cmd[dir][mode], (0));
                }
            }
        }
        flagtemp = game.iflags.num_pad;
        if (flagtemp != game.Cmd.num_pad) {
            game.Cmd.num_pad = flagtemp;
            ++updated;
        }
        /* swap_yz mode (only applicable for !num_pad); intended for
           QWERTZ keyboard used in Central Europe, particularly Germany */
        flagtemp = (game.iflags.num_pad_mode & 1) ? !game.Cmd.num_pad : (0);
        if (flagtemp != game.Cmd.swap_yz) {
            game.Cmd.swap_yz = flagtemp;
            ++updated;
            for (i = 0; i < (Math.trunc(24 /* sizeof(const int [6]) */ / 4 /* sizeof(const int) */)); i++) {
                /* FIXME? should Cmd.spkeys[] be scanned for y and/or z to swap?
               Cmd.swap_yz has been toggled;
               perform the swap (or reverse previous one) */
                c = __reset_commands_ylist[i] & 255;
                cmdbind_swapkeys(c, c + 1);
            }
        }
        /* MSDOS compatibility mode (only applicable for num_pad) */
        flagtemp = (game.iflags.num_pad_mode & 1) ? game.Cmd.num_pad : (0);
        if (flagtemp != game.Cmd.pcHack_compat) {
            game.Cmd.pcHack_compat = flagtemp;
            ++updated;
            /* pcHack_compat has been toggled */
            /* FIXME: NHKF_DOINV2 ought to be implemented instead of this */
            c = ((48) - 128) & 255;
            if (game.Cmd.pcHack_compat) {
                cmdbind_add(c, ext_func_tab_from_func(dotypeinv), (0));
            } else {
                cmdbind_remove(c);
            }
        }
        /* phone keypad layout (only applicable for num_pad) */
        flagtemp = (game.iflags.num_pad_mode & 2) ? game.Cmd.num_pad : (0);
        if (flagtemp != game.Cmd.phone_layout) {
            game.Cmd.phone_layout = flagtemp;
            ++updated;
            for (i = 0; i < 3; i++) {
                /* phone_layout has been toggled */
                c = 49 + i;
                cmdbind_swapkeys(c, c + 6);
                /* M-1,M-2,M-3 <-> M-7,M-8,M-9 */
                c = (((49) - 128) & 255) + i;
                cmdbind_swapkeys(c, c + 6);
            }
        }
    }
    /* choose updated movement keys */
    if (updated) {
        game.Cmd.serialno++;
    }
    game.Cmd.dirchars = !game.Cmd.num_pad ? (!game.Cmd.swap_yz ? __reset_commands_sdir : __reset_commands_sdir_swap_yz) : (!game.Cmd.phone_layout ? __reset_commands_ndir : __reset_commands_ndir_phone_layout);
    game.Cmd.alphadirchars = !game.Cmd.num_pad ? game.Cmd.dirchars : __reset_commands_sdir;
    for (dir = 0; dir < (N_DIRS_Z - 2); dir++) {
        for (mode = MV_WALK; mode < N_MOVEMODES; mode++) {
            let di = game.Cmd.dirchars.charCodeAt(dir);
            let bind = null;
            if (!game.Cmd.num_pad) {
                if (mode == MV_RUN) {
                    di = (di >= 0x61 && di <= 0x7a) ? di - 32 : di;
                } else if (mode == MV_RUSH) {
                    di = (31 & di);
                }
            } else {
                if (mode == MV_RUN) {
                    di = ((di) - 128);
                } else if (mode == MV_RUSH) {
                    di = ((di) - 128);
                }
            }
            __reset_commands_back_dir_key[dir][mode] = di;
            if ((bind = cmdbind_get(di)) != null) {
                __reset_commands_back_dir_cmd[dir][mode] = bind.cmd;
            } else {
                __reset_commands_back_dir_cmd[dir][mode] = null;
            }
            cmdbind_remove(di);
        }
    }
    __reset_commands_backed_dir_cmd = (1);
    for (i = 0; i < (N_DIRS_Z - 2); i++) {
        /* dirchars-int fix */
        bind_key_fn(game.Cmd.dirchars.charCodeAt(i), game.move_funcs[i][MV_WALK]);
        if (!game.Cmd.num_pad) {
            bind_key_fn(game.Cmd.dirchars.charCodeAt(i) >= 0x61 && game.Cmd.dirchars.charCodeAt(i) <= 0x7a ? game.Cmd.dirchars.charCodeAt(i) - 32 : game.Cmd.dirchars.charCodeAt(i), game.move_funcs[i][MV_RUN]);
            bind_key_fn(31 & game.Cmd.dirchars.charCodeAt(i), game.move_funcs[i][MV_RUSH]);
        } else {
            bind_key_fn(game.Cmd.dirchars.charCodeAt(i) - 128, game.move_funcs[i][MV_RUN]);
        }
    }
    update_rest_on_space();
    game.Cmd.extcmd_char = cmd_from_func(doextcmd);
}
/* called when 'rest_on_space' is toggled, also called by reset_commands()
   from initoptions_init() which takes place before key bindings have been
   processed, and by initoptions_finish() after key bindings so that we
   can remember anything bound to <space> in 'unrestonspace' */
const __update_rest_on_space_restonspace = { key: 32, ef_txt: "wait", ef_desc: "rest one move via 'rest_on_space' option", ef_funct: donull, flags: (1 | 128), f_text: "waiting" };
const __update_rest_on_space_unrestonspace = null;
export function update_rest_on_space() {
    /* cloned from extcmdlist['.'], then slightly modified to be distinct;
       donull is all that's needed for it to operate; command name and
       description get shown by help menu's "Info on what a given key does"
       (which runs the '&' command) and "Full list of keyboard commands" */
    let bind = cmdbind_get(32);
    /* when 'rest_on_space' is On, <space> will run the #wait command;
       when it is Off, <space> will use 'unrestonspace' which will either
       be Null and elicit "Unknown command ' '." or have some non-Null
       command bound in player's RC file */
    if (bind && bind.cmd != __update_rest_on_space_restonspace) {
        __update_rest_on_space_unrestonspace = bind.cmd;
    }
    cmdbind_add(32, game.flags.rest_on_space ? __update_rest_on_space_restonspace : __update_rest_on_space_unrestonspace, (0));
}
/* commands which accept 'm' prefix to request menu operation or other
   alternate behavior; it's also overloaded for move-without-autopickup;
   there is no overlap between the two groups of commands */
export function accept_menu_prefix(ec) {
    return (ec && ((ec.flags & 128) != 0));
}
/* choose a random character, biased towards movement commands, primarily
   for debug-fuzzer testing */
let __randomkey_i = 0;
let __randomkey_last_c = 0;
export function randomkey() {
    let c = 0;
    /* give ^A and ^P a high probability of being repeated */
    if ((__randomkey_last_c == (31 & (97)) || __randomkey_last_c == (31 & (112))) && game.program_state.input_state == commandInp && rn2(5)) {
        return __randomkey_last_c;
    }
    switch (rn2(16)) {
        default:
            c = 27;
            break;
        case 0:
            c = 10;
            break;
        case 1:
        case 2:
        case 3:
        case 4:
            c = (rn2(126 - 32 + 1) + (32));
            break;
        case 5:
            c = (rn2(2) ? 9 : 32);
            break;
        case 6:
            c = (rn2(122 - 97 + 1) + (97));
            break;
        case 7:
            c = (rn2(90 - 65 + 1) + (65));
            break;
        case 8:
            c = game.extcmdlist[__randomkey_i++ % (Math.trunc(171 /* sizeof(struct ext_func_tab [171]) */ / 1 /* sizeof(struct ext_func_tab) */))].key;
            break;
        case 9:
            c = 35;
            break;
        case 10:
        case 11:
        case 12:
{
                let d = rn2((N_DIRS_Z - 2));
                let m = rn2(7) ? MV_WALK : (!rn2(3) ? MV_RUSH : MV_RUN);
                c = cmd_from_dir(d, m);
            }
            break;
        case 13:
            c = (rn2(57 - 48 + 1) + (48));
            break;
        case 14:
            c = rnd(game.iflags.wc_eight_bit_input ? 255 : 127);
            break;
    }
    if (game.program_state.input_state == commandInp) {
        __randomkey_last_c = c;
    }
    return c;
}
export function random_response(buf, sz) {
    let c = 0;
    let count = 0;
    for (; ; ) {
        c = randomkey();
        if (c == 10) {
            break;
        }
        if (c == 27) {
            count = 0;
            break;
        }
        if (count < sz - 1) {
            buf[count++] = c;
        }
    }
    buf[count] = 0;
}
export function rnd_extcmd_idx() {
    return rn2(game.extcmdlist_length + 1) - 1;
}
export function reset_cmd_vars(reset_cmdq) {
    game.context.run = 0;
    game.context.nopick = game.context.forcefight = (0);
    game.context.move = game.context.mv = (0);
    game.domove_attempting = 0;
    game.multi = 0;
    game.iflags.menu_requested = (0);
    game.context.travel = game.context.travel1 = 0;
    if (game.travelmap) {
        selection_free(game.travelmap, (1));
        game.travelmap = null;
    }
    if (reset_cmdq) {
        cmdq_clear(CQ_CANNED);
        cmdq_clear(CQ_REPEAT);
    }
}
export function rhack(key) {
    let bad_command = 0;
    let firsttime = (key == 0);
    let cq = { typ: 0, key: 0, dirx: 0, diry: 0, dirz: 0, intval: 0, ec_entry: null, next: null };
    let cmdq = null;
    let cmdq_ec = null;
    let prefix_seen = null;
    let was_m_prefix = (0);
    let func = dummyfunction;
    game.iflags.menu_requested = (0);
    game.context.nopick = 0;
    got_prefix_input: while (true) {
        if (game.program_state.done_hup) {
            end_of_input();
        }
        if ((cmdq = cmdq_pop()) != null) {
            Object.assign(cq, cmdq);
            free(cmdq);
            if (cq.typ == CMDQ_EXTCMD && (cmdq_ec = cq.ec_entry) != null) {
                /* TODO Phase 5+: goto do_cmdq_extcmd (label not in scope of break) */
            }
            /* already handled a queued command (goto do_cmdq_extcmd);
           if something other than a key is queued, we'll drop down
           to the !*cmd handling which clears out the command-queue */
            key = (cq.typ == CMDQ_KEY) ? cq.key : 0;
        } else if (firsttime) {
            key = parse();
            /* parse() pushed a cmd but didn't return any key */
            if (!key && cmdq_peek(CQ_CANNED)) {
                continue got_prefix_input;
            }
        }
        if (!key || key == 255 || key == game.Cmd.spkeys[NHKF_ESC]) {
            /* if there's no command, there's nothing to do except reset */
            if (key == game.Cmd.spkeys[NHKF_ESC]) {
                game.iflags.sanity_no_check = game.iflags.sanity_check;
            } else {
                (game.windowprocs.win_nhbell)();
            }
            reset_cmd_vars((1));
            return;
        }
        /* handle most movement commands */
        game.context.travel = game.context.travel1 = 0;
{
            let tlist = null;
            let res = 0;
            do_cmdq_extcmd: {
                /* don't perform next sanity check if player typed ESC for
               the current command, similar to handling for CMD_INSANE
               flag below (^P and ^R) */
                game.cmd_bind = cmdbind_get(key & 255);
            }
            if (cmdq_ec) {
                tlist = cmdq_ec;
            } else {
                tlist = game.cmd_bind ? game.cmd_bind.cmd : null;
            }
            if (tlist != null) {
                if (!can_do_extcmd(tlist)) {
                    /* current - use key to directly index cmdlist array */
                    /* can_do_extcmd() already gave a message */
                    /* it is possible to have a result of (ECMD_TIME|ECMD_CANCEL)
               [for example, using 'f'ire, manually filling quiver with
               wielded weapon or dual-wielded swap-weapon, then cancelling
               at the direction prompt; using time to unwield should take
               precedence over general cancellation] */
                    /* command was canceled by user, maybe they declined to
                   pick an object to act on, or command failed to finish */
                    reset_cmd_vars((1));
                    res = 0;
                } else if (prefix_seen && !(tlist.flags & 512) && !(tlist.flags & (was_m_prefix ? 128 : 256))) {
                    let pfxidx = cmd_from_func(prefix_seen.ef_funct);
                    let which = (pfxidx != 0) ? visctrl(pfxidx) : (prefix_seen.ef_funct == do_reqmenu) ? "move-no-pickup or request-menu" : prefix_seen.ef_txt;
                    if (was_m_prefix) {
                        /*
                 * We got a prefix previously and looped for another
                 * command instead of returning, but the command we got
                 * doesn't accept a prefix.  The feedback here supersedes
                 * the former call to help_dir() (for 'bad_command' below).
                 */
                        custompline(4, "The %s command does not accept '%s' prefix.", tlist.ef_txt, which);
                    } else {
                        let ch = tlist.key;
                        let up = (ch == 60 || tlist.ef_funct == doup);
                        let down = (ch == 62 || tlist.ef_funct == dodown);
                        pline("The '%s' prefix should be followed by a movement command%s.", which, (up || down) ? " other than up or down" : "");
                    }
                    res = 4;
                    prefix_seen = null;
                } else {
                    /* we discard 'const' because some compilers seem to have
                   trouble with the pointer passed to set_occupation() */
                    func = (tlist).ef_funct;
                    if (tlist.f_text && !game.occupation && game.multi) {
                        set_occupation(func, tlist.f_text, game.multi);
                    }
                    game.ext_tlist = null;
                    if (!game.in_doagain && func != do_repeat && func != doextcmd) {
                        if (!prefix_seen) {
                            cmdq_clear(CQ_REPEAT);
                        }
                        /* Add the command post-execution */
                        cmdq_add_ec(CQ_REPEAT, (tlist).ef_funct);
                    } else {
                        if (func == doextcmd) {
                            cmdq_clear(CQ_REPEAT);
                        }
                    }
                    /* some commands shouldn't trigger sanity_check() because
                   if it produces output that might interfere with them;
                   note: if sanity_check is False, this has no effect */
                    if ((tlist.flags & 4096) != 0) {
                        game.iflags.sanity_no_check = game.iflags.sanity_check;
                    }
                    res = (func)();
                    if (game.ext_tlist) {
                        /* if 'func' is doextcmd(), 'tlist' is for Cmd.commands['#']
                   rather than for the command that doextcmd() just ran;
                   doextcmd() notifies us what that was via ext_tlist;
                   other commands leave it Null */
                        tlist = game.ext_tlist , game.ext_tlist = null;
                        cmdq_add_ec(CQ_REPEAT, (tlist).ef_funct);
                        /* shift the command to first */
                        cmdq_shift(CQ_REPEAT);
                    }
                    if ((tlist.flags & 512) != 0) {
                        if ((res & 2) != 0) {
                            /* it was a prefix command, mark and get another cmd */
                            /* prefix commands cancel if pressed twice */
                            reset_cmd_vars((1));
                            return;
                        }
                        prefix_seen = tlist;
                        cmdq_ec = null;
                        if (func == do_reqmenu) {
                            was_m_prefix = (1);
                        }
                        continue got_prefix_input;
                    } else if (!(tlist.flags & 1024) && game.domove_attempting) {
                        ;
                    } else if (((game.domove_attempting & (2 | 1)) != 0) && !game.context.travel && !dxdy_moveok()) {
                        /* not a movement command, but a move prefix earlier? */
                        /* trying to move diagonally as a grid bug */
                        You_cant("get there from here...");
                        reset_cmd_vars((1));
                        return;
                    } else if ((game.domove_attempting & 1) != 0) {
                        if (game.multi) {
                            game.context.mv = (1);
                        }
                        domove();
                        game.context.forcefight = 0;
                        game.iflags.menu_requested = (0);
                        return;
                    } else if ((game.domove_attempting & 2) != 0) {
                        if (firsttime) {
                            if (!game.multi) {
                                game.multi = ((80) > (21) ? (80) : (21));
                            }
                            game.u.last_str_turn = 0;
                        }
                        game.context.mv = (1);
                        domove();
                        game.iflags.menu_requested = (0);
                        return;
                    }
                    prefix_seen = null;
                }
                if ((res & (2 | 4)) != 0) {
                    reset_cmd_vars((1));
                } else if ((res & (0 | 1)) == 0) {
                    reset_cmd_vars(game.multi < 0);
                }
                if ((res & 1) != 0) {
                    /* reset_cmd_vars() sets context.move to False so we might
               need to change it [back] to True */
                    /* assume next command will take game time */
                    game.context.move = (1);
                    if (func != dokick) {
                        /* hero did something else than kicking a location;
                       reset the location, so pets don't avoid it */
                        game.kickedloc.x = 0 , game.kickedloc.y = 0;
                    }
                }
                return;
            }
            /* if we reach here, cmd wasn't found in cmdlist[] */
            bad_command = (1);
        }
        if (bad_command) {
            custompline(4, "Unknown command '%s'.", visctrl(key));
            cmdq_clear(CQ_CANNED);
            cmdq_clear(CQ_REPEAT);
            game.iflags.sanity_no_check = game.iflags.sanity_check;
        }
        game.context.move = (0);
        game.multi = 0;
        return;
        break;
    }
}
/* convert an x,y pair into a direction code */
export function xytodir(x, y) {
    let dd = 0;
    for (dd = 0; dd < (N_DIRS_Z - 2); dd++) {
        if (x == xdir[dd] && y == ydir[dd]) {
            return dd;
        }
    }
    return DIR_ERR;
}
/* convert a direction code into an x,y pair */
export function dirtocoord(cc, dd) {
    if (dd > DIR_ERR && dd < N_DIRS_Z) {
        cc.x = xdir[dd];
        cc.y = ydir[dd];
    }
}
/* also sets u.dz, but returns false for <> */
export function movecmd(sym, mode) {
    let d = DIR_ERR;
    let bind = cmdbind_get(sym);
    if (bind && bind.cmd) {
        let fnc = bind.cmd.ef_funct;
        if (mode == MV_ANY) {
            for (d = N_DIRS_Z - 1; d > DIR_ERR; d--) {
                if (fnc == game.move_funcs[d][MV_WALK] || fnc == game.move_funcs[d][MV_RUN] || fnc == game.move_funcs[d][MV_RUSH]) {
                    break;
                }
            }
        } else {
            for (d = N_DIRS_Z - 1; d > DIR_ERR; d--) {
                if (fnc == game.move_funcs[d][mode]) {
                    break;
                }
            }
        }
    }
    if (d != DIR_ERR) {
        game.u.dx = xdir[d];
        game.u.dy = ydir[d];
        game.u.dz = zdir[d];
        return !game.u.dz;
    }
    game.u.dz = 0;
    return 0;
}
/* grid bug handling */
export function dxdy_moveok() {
    if (game.u.dx && game.u.dy && ((game.u.umonnum) == PM_GRID_BUG)) {
        game.u.dx = game.u.dy = 0;
    }
    return game.u.dx || game.u.dy;
}
/* decide whether character (user input keystroke) requests screen repaint */
export function redraw_cmd(c) {
    let uc = c;
    let bind = cmdbind_get(uc);
    return (bind && bind.cmd && bind.cmd.ef_funct == doredraw);
}
/*
 * uses getdir() but unlike getdir() it specifically
 * produces coordinates using the direction from getdir()
 * and verifies that those coordinates are ok.
 *
 * If the call to getdir() returns 0, Never_mind is displayed.
 * If the resulting coordinates are not okay, emsg is displayed.
 *
 * Returns non-zero if coordinates in cc are valid.
 */
export function get_adjacent_loc(prompt, emsg, x, y, cc) {
    let new_x = 0;
    let new_y = 0;
    if (!getdir(prompt)) {
        pline("%s", c_common_strings.c_Never_mind);
        return 0;
    }
    new_x = x + game.u.dx;
    new_y = y + game.u.dy;
    if (cc && isok(new_x, new_y)) {
        cc.x = new_x;
        cc.y = new_y;
    } else {
        if (emsg) {
            pline("%s", emsg);
        }
        return 0;
    }
    return 1;
}
/* prompt for a direction (specified via movement keystroke) and return it
   in u.dx, u.dy, and u.dz; function return value is 1 for ok, 0 otherwise */
export function getdir(s) {
    let dirsym = 0;
    let is_mov = 0;
    let cmdq = null;
    /* getdir-cmdq-flow fix */
    let __from_cmdq = (0);
    cmdq = cmdq_pop();
    if (cmdq) {
        if (cmdq.typ == CMDQ_DIR) {
            if (!cmdq.dirz) {
                dirsym = game.Cmd.dirchars.charCodeAt(xytodir(cmdq.dirx, cmdq.diry));
            } else {
                dirsym = game.Cmd.dirchars.charCodeAt((cmdq.dirz > 0) ? DIR_DOWN : DIR_UP);
            }
        } else if (cmdq.typ == CMDQ_KEY) {
            dirsym = cmdq.key;
        } else {
            cmdq_clear(CQ_CANNED);
            dirsym = 0;
            impossible("getdir: command queue had no dir?");
        }
        free(cmdq);
        __from_cmdq = (1);
    }
    /* getdir-retry-help fix */
    retry: while (true) {
        if (!__from_cmdq) {
            game.program_state.input_state = getdirInp;
            if (game.in_doagain || readchar_queue) {
                dirsym = readchar();
            } else {
                dirsym = yn_function((s && s.value != 94) ? s : "In what direction?", null, 0, (0));
                if (game.iflags.debug_fuzzer && rn2(20)) {
                    switch (rn2(20)) {
                        /* for the fuzzer, usually force the result to be a valid direction,
           but sometimes let it exercise the invalid direction code; we
           don't try to enforce no-diagonal for hero in grid bug form since
           things like '^' to look at adjacent trap shouldn't be bound by
           that (caller is expected to handle situations where it matters) */
                        case 0:
                            dirsym = game.Cmd.spkeys[rn2(2) ? NHKF_GETDIR_SELF : NHKF_ESC];
                            break;
                        case 1:
                            dirsym = game.Cmd.dirchars.charCodeAt(rn2(2) ? DIR_DOWN : DIR_UP);
                            break;
                        default:
                            dirsym = game.Cmd.dirchars.charCodeAt(rn2((N_DIRS_Z - 2)));
                            break;
                    }
                }
            }
            (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
            if (redraw_cmd(dirsym)) {
                /* remove the prompt string so caller won't have to */
                docrt_flags(docrtRefresh);
                continue retry;
            }
            if (!game.in_doagain) {
                cmdq_add_key(CQ_REPEAT, dirsym);
            }
        }
        __from_cmdq = (0);
    if (dirsym == game.Cmd.spkeys[NHKF_GETDIR_SELF] || dirsym == game.Cmd.spkeys[NHKF_GETDIR_SELF2]) {
        game.u.dx = game.u.dy = game.u.dz = 0;
    } else if (dirsym == game.Cmd.spkeys[NHKF_GETDIR_MOUSE]) {
        let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let cc = { x: 0, y: 0 };
        let pos = 0;
        let mod = 0;
        qbuf = sprintf(qbuf, "desired location, then type '%s' for left click, '%s' for right", visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK_Q]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_PICK]));
        /* starting cursor location for getpos() */
        cc.x = game.u.ux , cc.y = game.u.uy;
        pos = getpos(cc, (1), qbuf);
        if (pos < 0) {
            /*
         * For #therecmdmenu:
         * Player has entered the 'simulated mouse' key ('_' by default)
         * at the "which direction?" prompt so we use getpos() to get a
         * simulated click after moving cursor to the desired location.
         *
         * getpos() returns 0..3 for period, comma, semi-colon, colon.
         * We treat "," as left click and "." as right click due to
         * their positions relative to each other on the keyboard.
         * Using ";" as synonym for "," and ":" for "." is due to their
         * shapes rather than to their keyboard location.
         *
         * Those keys aren't separately bindable for being treated as
         * clicks but we do honor their getpos bindings if player has
         * changed them.  (Bound values might have scrambled keyboard
         * locations relative to each other so ruin the memory aid of
         * "," being left of ".".)
         */
            /* visctrl() cycles through several static buffers for its
                   return value so using two in the same expression is ok */
            game.u.dx = game.u.dy = game.u.dz = 0;
            /* neither CLICK_1 nor CLICK_2 */
            mod = 0;
        } else {
            /* caller expects simulated click to be relative to hero's spot */
            game.u.dx = cc.x - game.u.ux;
            game.u.dy = cc.y - game.u.uy;
            if (!game.iflags.getdir_click) {
                /* non-zero getdir_click actually means ok to click farther than
               one spot away from hero; adjacent click is always allowed */
                game.u.dx = sgn(game.u.dx);
                game.u.dy = sgn(game.u.dy);
            }
            game.u.dz = 0;
            switch (pos + NHKF_GETPOS_PICK) {
                case NHKF_GETPOS_PICK_Q:
                case NHKF_GETPOS_PICK_O:
                    mod = 1;
                    break;
                case NHKF_GETPOS_PICK:
                case NHKF_GETPOS_PICK_V:
                    mod = 2;
                    break;
                default:
                    impossible("getpos successful but not one of [.,;:] (%d)", pos);
                    mod = 0;
                    pos = -1;
                    break;
            }
        }
        if (game.iflags.getdir_click) {
            game.iflags.getdir_click = mod;
        }
        return (pos >= 0);
    } else if (!(is_mov = movecmd(dirsym, MV_ANY)) && !game.u.dz) {
        let did_help = (0);
        let help_requested = 0;
        if (!strchr(quitchars, dirsym)) {
            help_requested = (dirsym == game.Cmd.spkeys[NHKF_GETDIR_HELP]);
            if (help_requested || game.iflags.cmdassist) {
                did_help = help_dir((s && s.value == 94) ? dirsym : 0, game.Cmd.spkeys[NHKF_ESC], help_requested ? null : "Invalid direction key!");
                if (help_requested) {
                    continue retry;
                }
            }
            if (!did_help) {
                pline("What a strange direction!");
            }
        }
        return 0;
    } else if (is_mov && !dxdy_moveok()) {
        You_cant("orient yourself that direction.");
        return 0;
    }
    break;
    }
    if (!game.u.dz) {
        confdir((0));
    }
    return 1;
}
/* should specify a window which is using a fixed-width font */
/* '.' or '@' or ' ' */
export function show_direction_keys(win, centerchar, nodiag) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!centerchar) {
        centerchar = 32;
    }
    if (nodiag) {
        buf = sprintf(buf, "             %s   ", visctrl(cmd_from_func(do_move_north)));
        (game.windowprocs.win_putstr)(win, 0, buf);
        (game.windowprocs.win_putstr)(win, 0, "             |   ");
        buf = sprintf(buf, "          %s- %c -%s", visctrl(cmd_from_func(do_move_west)), centerchar, visctrl(cmd_from_func(do_move_east)));
        (game.windowprocs.win_putstr)(win, 0, buf);
        (game.windowprocs.win_putstr)(win, 0, "             |   ");
        buf = sprintf(buf, "             %s   ", visctrl(cmd_from_func(do_move_south)));
        (game.windowprocs.win_putstr)(win, 0, buf);
    } else {
        buf = sprintf(buf, "          %s  %s  %s", visctrl(cmd_from_func(do_move_northwest)), visctrl(cmd_from_func(do_move_north)), visctrl(cmd_from_func(do_move_northeast)));
        (game.windowprocs.win_putstr)(win, 0, buf);
        (game.windowprocs.win_putstr)(win, 0, "           \\ | / ");
        buf = sprintf(buf, "          %s- %c -%s", visctrl(cmd_from_func(do_move_west)), centerchar, visctrl(cmd_from_func(do_move_east)));
        (game.windowprocs.win_putstr)(win, 0, buf);
        (game.windowprocs.win_putstr)(win, 0, "           / | \\ ");
        buf = sprintf(buf, "          %s  %s  %s", visctrl(cmd_from_func(do_move_southwest)), visctrl(cmd_from_func(do_move_south)), visctrl(cmd_from_func(do_move_southeast)));
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    ;
}
/* explain choices if player has asked for getdir() help or has given
   an invalid direction after a prefix key ('F', 'g', 'm', &c), which
   might be bogus but could be up, down, or self when not applicable */
/* actual key; either prefix or ESC */
const __help_dir_wiz_only_list = "EFGIVW";
export function help_dir(sym, spkey, msg) {
    let ctrl = 0;
    let win = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let buf2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let explain = null;
    let dothat = null;
    let prefixhandling = 0;
    /* NHKF_ESC indicates that player asked for help at getdir prompt */
    /* viawindow = (spkey == gc.Cmd.spkeys[NHKF_ESC] || iflags.cmdassist); */
    prefixhandling = (spkey != game.Cmd.spkeys[NHKF_ESC]);
    /*
     * Handling for prefix keys that don't want special directions.
     * Delivered via pline if 'cmdassist' is off, or instead of the
     * general message if it's on.
     */
    dothat = "do that";
    /* for "<action> at yourself"; not used for up/down */
    buf[0] = 0;
    ((prefixhandling));
    win = (game.windowprocs.win_create_nhwindow)(5);
    if (!win) {
        return (0);
    }
    if (buf) {
        (game.windowprocs.win_putstr)(win, 0, buf);
        (game.windowprocs.win_putstr)(win, 0, "");
    } else if (msg) {
        buf = sprintf(buf, "cmdassist: %s", msg);
        (game.windowprocs.win_putstr)(win, 0, buf);
        (game.windowprocs.win_putstr)(win, 0, "");
    }
    if (!prefixhandling && (letter(sym) || sym == 91)) {
        /* show bad-prefix message instead of general invalid-direction one */
        /* '[': old 'cmdhelp' showed ESC as ^[ */
        /* @A-Z[ (note: letter() accepts '@') */
        sym = highc(sym);
        /* 0-27 (note: 28-31 aren't applicable) */
        ctrl = (sym - 65) + 1;
        if ((explain = dowhatdoes_core(ctrl, buf2)) != null && (!strchr(__help_dir_wiz_only_list, sym) || game.flags.debug)) {
            buf = sprintf(buf, "Are you trying to use ^%c%s?", sym, strchr(__help_dir_wiz_only_list, sym) ? "" : " as specified in the Guidebook");
            (game.windowprocs.win_putstr)(win, 0, buf);
            (game.windowprocs.win_putstr)(win, 0, "");
            (game.windowprocs.win_putstr)(win, 0, explain);
            (game.windowprocs.win_putstr)(win, 0, "");
            (game.windowprocs.win_putstr)(win, 0, "To use that command, hold down the <Ctrl> key as a shift");
            buf = sprintf(buf, "and press the <%c> key.", sym);
            (game.windowprocs.win_putstr)(win, 0, buf);
            (game.windowprocs.win_putstr)(win, 0, "");
        }
    }
    buf = sprintf(buf, "Valid direction keys%s%s%s are:", prefixhandling ? " to " : "", prefixhandling ? dothat : "", ((game.u.umonnum) == PM_GRID_BUG) ? " in your current form" : "");
    (game.windowprocs.win_putstr)(win, 0, buf);
    show_direction_keys(win, !prefixhandling ? 46 : 32, ((game.u.umonnum) == PM_GRID_BUG));
    if (!prefixhandling) {
        (game.windowprocs.win_putstr)(win, 0, "");
        (game.windowprocs.win_putstr)(win, 0, "          <  up");
        (game.windowprocs.win_putstr)(win, 0, "          >  down");
        if (!prefixhandling) {
            /* NOPICKUP: unlike the other prefix keys, 'm' allows up/down for
           stair traversal; we won't get here when "m<" or "m>" has been
           given but we include up and down for 'm'+invalid_direction;
           self is excluded as a viable direction for every prefix */
            let selfi = game.Cmd.num_pad ? NHKF_GETDIR_SELF2 : NHKF_GETDIR_SELF;
            buf = sprintf(buf, "       %4s  direct at yourself", visctrl(game.Cmd.spkeys[selfi]));
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
    }
    if (msg) {
        (game.windowprocs.win_putstr)(win, 0, "");
        (game.windowprocs.win_putstr)(win, 0, "(Suppress this message with !cmdassist in config file.)");
    }
    (game.windowprocs.win_display_nhwindow)(win, (0));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return (1);
}
/* if hero is impaired, pick random movement direction */
export function confdir(force_impairment) {
    if (force_impairment || u_maybe_impaired()) {
        let kmax = ((game.u.umonnum) == PM_GRID_BUG) ? (Math.trunc((N_DIRS_Z - 2) / 2)) : (N_DIRS_Z - 2);
        let k = dirs_ord[rn2(kmax)];
        game.u.dx = xdir[k];
        game.u.dy = ydir[k];
    }
    return;
}
const __directionname_dirnames = ["west", "northwest", "north", "northeast", "east", "southeast", "south", "southwest", "down", "up"];
export function directionname(dir) {
    if (dir < 0 || dir >= N_DIRS_Z) {
        return "invalid";
    }
    return __directionname_dirnames[dir];
}
export function isok(x, y) {
    /* x corresponds to curx, so x==1 is the first column. Ach. %% */
    return x >= 1 && x <= 80 - 1 && y >= 0 && y <= 21 - 1;
}
/* #herecmdmenu command */
export function doherecmdmenu() {
    let ch = here_cmd_menu();
    return (ch && ch != 27) ? 1 : 0;
}
/* #therecmdmenu command, a way to test there_cmd_menu without mouse */
export function dotherecmdmenu() {
    let ch = 0;
    let dir = 0;
    let click = 0;
    let x = game.clicklook_cc.x;
    let y = game.clicklook_cc.y;
    game.iflags.getdir_click = 1 | 2;
    if (isok(x, y)) {
        if (x == game.u.ux && y == game.u.uy) {
            ch = here_cmd_menu();
        } else {
            ch = there_cmd_menu(x, y, game.iflags.getdir_click);
        }
        game.clicklook_cc.x = game.clicklook_cc.y = -1;
        game.iflags.getdir_click = 0;
        return (ch && ch != 27) ? 1 : 0;
    }
    dir = getdir(null);
    click = game.iflags.getdir_click;
    game.iflags.getdir_click = 0;
    if (!dir || !isok(game.u.ux + game.u.dx, game.u.uy + game.u.dy)) {
        return 2;
    }
    if (game.u.dx || game.u.dy) {
        ch = there_cmd_menu(game.u.ux + game.u.dx, game.u.uy + game.u.dy, click);
    } else {
        ch = here_cmd_menu();
    }
    return (ch && ch != 27) ? 1 : 0;
}
/* commands for [t]herecmdmenu */
export const MCMD_NOTHING = 0;
export const MCMD_OPEN_DOOR = 1;
export const MCMD_LOCK_DOOR = 2;
export const MCMD_UNTRAP_DOOR = 3;
export const MCMD_KICK_DOOR = 4;
export const MCMD_CLOSE_DOOR = 5;
export const MCMD_SEARCH = 6;
export const MCMD_LOOK_TRAP = 7;
export const MCMD_UNTRAP_TRAP = 8;
export const MCMD_MOVE_DIR = 9;
export const MCMD_RIDE = 10;
export const MCMD_REMOVE_SADDLE = 11;
export const MCMD_APPLY_SADDLE = 12;
export const MCMD_TALK = 13;
export const MCMD_NAME = 14;
export const MCMD_QUAFF = 15;
export const MCMD_DIP = 16;
export const MCMD_SIT = 17;
export const MCMD_UP = 18;
export const MCMD_DOWN = 19;
export const MCMD_DISMOUNT = 20;
export const MCMD_MONABILITY = 21;
export const MCMD_PICKUP = 22;
export const MCMD_LOOT = 23;
export const MCMD_TIP = 24;
export const MCMD_EAT = 25;
export const MCMD_DROP = 26;
export const MCMD_REST = 27;
export const MCMD_LOOK_HERE = 28;
export const MCMD_LOOK_AT = 29;
export const MCMD_ATTACK_NEXT2U = 30;
export const MCMD_UNTRAP_HERE = 31;
export const MCMD_OFFER = 32;
export const MCMD_INVENTORY = 33;
export const MCMD_CAST_SPELL = 34;
export const MCMD_THROW_OBJ = 35;
export const MCMD_TRAVEL = 36;
export function mcmd_addmenu(win, act, txt) {
    let any = 0;
    let clr = 8;
    any = cg.zeroany;
    any.a_int = act;
    add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, txt, 0);
}
/* command menu entries when targeting self */
export function there_cmd_menu_self(win, x, y, act) {
    let K = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let typ = game.level.locations[x][y].typ;
    let stway = stairway_at(x, y);
    let ttmp = null;
    if (!((x) == game.u.ux && (y) == game.u.uy)) {
        return K;
    }
    if ((((typ) == FOUNTAIN) || ((typ) == SINK)) && can_reach_floor((0))) {
        buf = sprintf(buf, "Drink from the %s", defsyms[((typ) == FOUNTAIN) ? S_fountain : S_sink].explanation);
        mcmd_addmenu(win, MCMD_QUAFF, buf) , ++K;
    }
    if (((typ) == FOUNTAIN) && can_reach_floor((0))) {
        mcmd_addmenu(win, MCMD_DIP, "Dip something into the fountain") , ++K;
    }
    if (((typ) == THRONE)) {
        mcmd_addmenu(win, MCMD_SIT, "Sit on the throne") , ++K;
    }
    if (((typ) == ALTAR)) {
        mcmd_addmenu(win, MCMD_OFFER, "Sacrifice something on the altar") , ++K;
    }
    if (stway && stway.up) {
        buf = sprintf(buf, "Go up the %s", stway.isladder ? "ladder" : "stairs");
        mcmd_addmenu(win, MCMD_UP, buf) , ++K;
    }
    if (stway && !stway.up) {
        buf = sprintf(buf, "Go down the %s", stway.isladder ? "ladder" : "stairs");
        mcmd_addmenu(win, MCMD_DOWN, buf) , ++K;
    }
    if (game.u.usteed) {
        buf = sprintf(buf, "Dismount %s", x_monnam(game.u.usteed, 1, null, 8, (0)));
        mcmd_addmenu(win, MCMD_DISMOUNT, buf) , ++K;
    }
    if ((game.level.objects[x][y] != null)) {
        let otmp = game.level.objects[x][y];
        buf = sprintf(buf, "Pick up %s", otmp.v.v_nexthere ? "items" : doname(otmp));
        mcmd_addmenu(win, MCMD_PICKUP, buf) , ++K;
        if (((otmp).otyp >= LARGE_BOX && (otmp).otyp <= BAG_OF_TRICKS)) {
            buf = sprintf(buf, "Loot %s", doname(otmp));
            mcmd_addmenu(win, MCMD_LOOT, buf) , ++K;
            buf = sprintf(buf, "Tip %s", doname(otmp));
            mcmd_addmenu(win, MCMD_TIP, buf) , ++K;
        }
        if (otmp.oclass == FOOD_CLASS) {
            buf = sprintf(buf, "Eat %s", doname(otmp));
            mcmd_addmenu(win, MCMD_EAT, buf) , ++K;
        }
    }
    if (game.invent) {
        mcmd_addmenu(win, MCMD_INVENTORY, "Inventory") , ++K;
        mcmd_addmenu(win, MCMD_DROP, "Drop items") , ++K;
    }
    mcmd_addmenu(win, MCMD_REST, "Rest one turn") , ++K;
    mcmd_addmenu(win, MCMD_SEARCH, "Search around you") , ++K;
    mcmd_addmenu(win, MCMD_LOOK_HERE, "Look at what is here") , ++K;
    if (num_spells() > 0) {
        mcmd_addmenu(win, MCMD_CAST_SPELL, "Cast a spell") , ++K;
    }
    if ((ttmp = t_at(x, y)) != null && ttmp.tseen) {
        if (ttmp.ttyp != VIBRATING_SQUARE) {
            mcmd_addmenu(win, MCMD_UNTRAP_HERE, "Attempt to disarm trap") , ++K;
        }
    }
    return K;
}
/* add entries to there_cmd_menu, when x,y is next to hero */
export function there_cmd_menu_next2u(win, x, y, mod, act) {
    let K = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let typ = game.level.locations[x][y].typ;
    let ttmp = null;
    let mtmp = null;
    if (!(dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2)) {
        return K;
    }
    if (((typ) == DOOR)) {
        let key_or_pick = 0;
        let card = 0;
        let dm = game.level.locations[x][y].flags;
        if ((dm & (4 | 8))) {
            mcmd_addmenu(win, MCMD_OPEN_DOOR, "Open the door") , ++K;
            /* unfortunately there's no lknown flag for doors to
               remember the locked/unlocked state */
            key_or_pick = (carrying(SKELETON_KEY) || carrying(LOCK_PICK));
            card = (carrying(CREDIT_CARD) != null);
            if (key_or_pick || card) {
                buf = sprintf(buf, "%sunlock the door", key_or_pick ? "lock or " : "");
                mcmd_addmenu(win, MCMD_LOCK_DOOR, upstart(buf)) , ++K;
            }
            /* unfortunately there's no tknown flag for doors (or chests)
               to remember whether a trap had been found */
            mcmd_addmenu(win, MCMD_UNTRAP_DOOR, "Search the door for a trap") , ++K;
            mcmd_addmenu(win, MCMD_KICK_DOOR, "Kick the door") , ++K;
        } else if ((dm & 2) && (mod == 2)) {
            mcmd_addmenu(win, MCMD_CLOSE_DOOR, "Close the door") , ++K;
        }
    }
    if (typ <= SCORR) {
        mcmd_addmenu(win, MCMD_SEARCH, "Search for secret doors") , ++K;
    }
    if ((ttmp = t_at(x, y)) != null && ttmp.tseen) {
        mcmd_addmenu(win, MCMD_LOOK_TRAP, "Examine trap") , ++K;
        if (ttmp.ttyp != VIBRATING_SQUARE) {
            mcmd_addmenu(win, MCMD_UNTRAP_TRAP, "Attempt to disarm trap") , ++K;
        }
        mcmd_addmenu(win, MCMD_MOVE_DIR, "Move on the trap") , ++K;
    }
    if (game.level.locations[x][y].glyph == ((BOULDER) + GLYPH_OBJ_OFF)) {
        mcmd_addmenu(win, MCMD_MOVE_DIR, "Push the boulder") , ++K;
    }
    mtmp = (game.level.monsters[x][y]);
    if (mtmp && !(canseemon(mtmp) || sensemon(mtmp))) {
        mtmp = null;
    }
    if (mtmp && which_armor(mtmp, 1048576)) {
        let mnam = x_monnam(mtmp, 1, null, 8, (0));
        if (!game.u.usteed) {
            buf = sprintf(buf, "Ride %s", mnam);
            mcmd_addmenu(win, MCMD_RIDE, buf) , ++K;
        }
        buf = sprintf(buf, "Remove saddle from %s", mnam);
        mcmd_addmenu(win, MCMD_REMOVE_SADDLE, buf) , ++K;
    }
    if (mtmp && can_saddle(mtmp) && !which_armor(mtmp, 1048576) && carrying(SADDLE)) {
        buf = sprintf(buf, "Put saddle on %s", mon_nam(mtmp));
        mcmd_addmenu(win, MCMD_APPLY_SADDLE, buf) , ++K;
    }
    if (mtmp && (mtmp.mpeaceful || mtmp.mtame)) {
        buf = sprintf(buf, "Talk to %s", mon_nam(mtmp));
        mcmd_addmenu(win, MCMD_TALK, buf) , ++K;
        buf = sprintf(buf, "Swap places with %s", mon_nam(mtmp));
        mcmd_addmenu(win, MCMD_MOVE_DIR, buf) , ++K;
        buf = sprintf(buf, "%s %s", !((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? "Name" : "Rename", mon_nam(mtmp));
        mcmd_addmenu(win, MCMD_NAME, buf) , ++K;
    }
    if ((mtmp && !(mtmp.mpeaceful || mtmp.mtame)) || ((glyph_at(x, y)) == GLYPH_INVIS_OFF)) {
        buf = sprintf(buf, "Attack %s", mtmp ? mon_nam(mtmp) : "unseen creature");
        mcmd_addmenu(win, MCMD_ATTACK_NEXT2U, buf) , ++K;
        /* attacking overrides any other automatic action */
        act.value = MCMD_ATTACK_NEXT2U;
    } else { /* "Move %s", direction - handled below */ }
    return K;
}
export function there_cmd_menu_far(win, x, y, mod) {
    let K = 0;
    if (mod == 1) {
        if (linedup(game.u.ux, game.u.uy, x, y, 1) && dist2(game.u.ux, game.u.uy, x, y) < 18 * 18) {
            mcmd_addmenu(win, MCMD_THROW_OBJ, "Throw something") , ++K;
        }
        mcmd_addmenu(win, MCMD_TRAVEL, "Travel here") , ++K;
    }
    return K;
}
export function there_cmd_menu_common(win, x, y, mod, act) {
    let K = 0;
    if (mod == 1 || mod == 2) {
        /* ignore iflags.clicklook here */
        /* for self, only include "look at map symbol" if it isn't the
           ordinary hero symbol (steed, invisible w/o see invisible, ?) */
        if (!((x) == game.u.ux && (y) == game.u.uy) || (game.u.umonnum != game.u.umonster) || glyph_at(x, y) != ((((game.u.umonnum != game.u.umonster) || !game.flags.showrace) ? game.u.umonnum : game.urace.mnum) + (((((((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0))) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF))) {
            mcmd_addmenu(win, MCMD_LOOK_AT, "Look at map symbol") , ++K;
        }
    }
    return K;
}
/* queue up command(s) to perform #therecmdmenu action */
/* action */
/* delta to adjacent spot (farther sometimes) */
export function act_on_act(act, dx, dy) {
    let otmp = null;
    let dir = 0;
    switch (act) {
        /* a few there_cmd_menu_far() actions use dx,dy differently */
        case MCMD_THROW_OBJ:
        case MCMD_TRAVEL:
        case MCMD_LOOK_AT:
            break;
        default:
            dx = sgn(dx);
            dy = sgn(dy);
            break;
    }
    switch (act) {
        case MCMD_TRAVEL:
            game.iflags.travelcc.x = game.u.tx = game.u.ux + dx;
            game.iflags.travelcc.y = game.u.ty = game.u.uy + dy;
            cmdq_add_ec(CQ_CANNED, dotravel_target);
            break;
        case MCMD_THROW_OBJ:
            cmdq_add_ec(CQ_CANNED, dothrow);
            cmdq_add_userinput(CQ_CANNED);
            /* getpos() uses u.ux+dx,u.uy+dy */
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_OPEN_DOOR:
            cmdq_add_ec(CQ_CANNED, doopen);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_LOCK_DOOR:
            otmp = carrying(SKELETON_KEY);
            if (!otmp) {
                otmp = carrying(LOCK_PICK);
            }
            if (!otmp) {
                otmp = carrying(CREDIT_CARD);
            }
            if (otmp) {
                /* FIXME: player has explicitly picked "travel to this location"
           from the menu but it will only work if flags.travelcmd is True.
           That option is intended as way to guard against stray mouse
           clicks and shouldn't inhibit explicit travel. */
                /* m-prefix for #loot: skip any floor containers */
                cmdq_add_ec(CQ_CANNED, doapply);
                cmdq_add_key(CQ_CANNED, otmp.invlet);
                cmdq_add_dir(CQ_CANNED, dx, dy, 0);
                /* "Do you want to remove saddle? */
                /* "Drink from the fountain?" */
                /* "Dip foo into the fountain?" */
                /* "There is foo here; tip it?" */
                /* "There is foo here; eat it?" */
                cmdq_add_key(CQ_CANNED, 121);
            }
            break;
        case MCMD_UNTRAP_DOOR:
            cmdq_add_ec(CQ_CANNED, dountrap);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_KICK_DOOR:
            cmdq_add_ec(CQ_CANNED, dokick);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_CLOSE_DOOR:
            cmdq_add_ec(CQ_CANNED, doclose);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_SEARCH:
            cmdq_add_ec(CQ_CANNED, dosearch);
            break;
        case MCMD_LOOK_TRAP:
            cmdq_add_ec(CQ_CANNED, doidtrap);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_UNTRAP_TRAP:
            cmdq_add_ec(CQ_CANNED, dountrap);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_MOVE_DIR:
            dir = xytodir(dx, dy);
            cmdq_add_ec(CQ_CANNED, game.move_funcs[dir][MV_WALK]);
            break;
        case MCMD_RIDE:
            cmdq_add_ec(CQ_CANNED, doride);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_REMOVE_SADDLE:
            cmdq_add_ec(CQ_CANNED, do_reqmenu);
            cmdq_add_ec(CQ_CANNED, doloot);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            cmdq_add_key(CQ_CANNED, 121);
            break;
        case MCMD_APPLY_SADDLE:
            if ((otmp = carrying(SADDLE)) != null) {
                cmdq_add_ec(CQ_CANNED, doapply);
                cmdq_add_key(CQ_CANNED, otmp.invlet);
                cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            }
            break;
        case MCMD_ATTACK_NEXT2U:
            dir = xytodir(dx, dy);
            cmdq_add_ec(CQ_CANNED, game.move_funcs[dir][MV_WALK]);
            break;
        case MCMD_TALK:
            cmdq_add_ec(CQ_CANNED, dotalk);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_NAME:
            cmdq_add_ec(CQ_CANNED, docallcmd);
            cmdq_add_key(CQ_CANNED, 109);
            cmdq_add_dir(CQ_CANNED, dx, dy, 0);
            break;
        case MCMD_QUAFF:
            cmdq_add_ec(CQ_CANNED, dodrink);
            cmdq_add_key(CQ_CANNED, 121);
            break;
        case MCMD_DIP:
            cmdq_add_ec(CQ_CANNED, dodip);
            cmdq_add_userinput(CQ_CANNED);
            cmdq_add_key(CQ_CANNED, 121);
            break;
        case MCMD_SIT:
            cmdq_add_ec(CQ_CANNED, dosit);
            break;
        case MCMD_UP:
            cmdq_add_ec(CQ_CANNED, doup);
            break;
        case MCMD_DOWN:
            cmdq_add_ec(CQ_CANNED, dodown);
            break;
        case MCMD_DISMOUNT:
            cmdq_add_ec(CQ_CANNED, doride);
            break;
        case MCMD_MONABILITY:
            cmdq_add_ec(CQ_CANNED, domonability);
            break;
        case MCMD_PICKUP:
            cmdq_add_ec(CQ_CANNED, dopickup);
            break;
        case MCMD_LOOT:
            cmdq_add_ec(CQ_CANNED, doloot);
            break;
        case MCMD_TIP:
            cmdq_add_ec(CQ_CANNED, dotip);
            cmdq_add_key(CQ_CANNED, 121);
            break;
        case MCMD_EAT:
            cmdq_add_ec(CQ_CANNED, doeat);
            cmdq_add_key(CQ_CANNED, 121);
            break;
        case MCMD_DROP:
            cmdq_add_ec(CQ_CANNED, dodrop);
            break;
        case MCMD_INVENTORY:
            cmdq_add_ec(CQ_CANNED, ddoinv);
            break;
        case MCMD_REST:
            /* map click on player to "rest" command */
            cmdq_add_ec(CQ_CANNED, donull);
            break;
        case MCMD_LOOK_HERE:
            cmdq_add_ec(CQ_CANNED, dolook);
            break;
        case MCMD_LOOK_AT:
            game.clicklook_cc.x = game.u.ux + dx;
            game.clicklook_cc.y = game.u.uy + dy;
            cmdq_add_ec(CQ_CANNED, doclicklook);
            break;
        case MCMD_UNTRAP_HERE:
            cmdq_add_ec(CQ_CANNED, dountrap);
            cmdq_add_dir(CQ_CANNED, 0, 0, 1);
            break;
        case MCMD_OFFER:
            cmdq_add_ec(CQ_CANNED, dosacrifice);
            cmdq_add_userinput(CQ_CANNED);
            break;
        case MCMD_CAST_SPELL:
            cmdq_add_ec(CQ_CANNED, docast);
            break;
        default:
            break;
    }
}
/* offer choice of actions to perform at adjacent location <x,y>;
   a few choices can be farther away */
export function there_cmd_menu(x, y, mod) {
    let win = 0;
    let ch = 0;
    let npick = 0;
    let K = 0;
    let picks = null;
    /*int dx = sgn(x - u.ux), dy = sgn(y - u.uy);*/
    let dx = x - game.u.ux;
    let dy = y - game.u.uy;
    let act = MCMD_NOTHING;
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    if (((x) == game.u.ux && (y) == game.u.uy)) {
        K += there_cmd_menu_self(win, x, y, { get value() { return act; }, set value(_v) { act = _v; } });
    } else if ((dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2)) {
        K += there_cmd_menu_next2u(win, x, y, mod, { get value() { return act; }, set value(_v) { act = _v; } });
    } else {
        K += there_cmd_menu_far(win, x, y, mod);
    }
    K += there_cmd_menu_common(win, x, y, mod, { get value() { return act; }, set value(_v) { act = _v; } });
    if (!K) {
        if ((dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2) && test_move(game.u.ux, game.u.uy, dx, dy, 1)) {
            /* no menu options, try to move */
            let dir = xytodir(dx, dy);
            cmdq_add_ec(CQ_CANNED, game.move_funcs[dir][MV_WALK]);
        } else if (game.flags.travelcmd) {
            game.iflags.travelcc.x = game.u.tx = x;
            game.iflags.travelcc.y = game.u.ty = y;
            cmdq_add_ec(CQ_CANNED, dotravel_target);
        }
        npick = 0;
        ch = 0;
    } else if (K == 1 && act != MCMD_NOTHING && act != MCMD_TRAVEL) {
        (game.windowprocs.win_destroy_nhwindow)(win);
        act_on_act(act, dx, dy);
        return 0;
    } else {
        (game.windowprocs.win_end_menu)(win, "What do you want to do?");
        npick = select_menu(win, 1, picks);
        ch = 27;
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
    if (npick > 0) {
        act = picks.item.a_int;
        free(picks);
        act_on_act(act, dx, dy);
        return 0;
    }
    return ch;
}
export function here_cmd_menu() {
    there_cmd_menu(game.u.ux, game.u.uy, 1);
    return 0;
}
export function click_to_cmd(x, y, mod) {
    game.clicklook_cc.x = x;
    game.clicklook_cc.y = y;
    if (game.Cmd.mousebtn[mod - 1]) {
        cmdq_add_ec(CQ_CANNED, game.Cmd.mousebtn[mod - 1].ef_funct);
    }
}
export function domouseaction() {
    let x = 0;
    let y = 0;
    let o = null;
    let dir = 0;
    x = game.clicklook_cc.x - game.u.ux;
    y = game.clicklook_cc.y - game.u.uy;
    if (game.flags.travelcmd) {
        /* convert without using floating point, allowing sloppy clicking */
        if (abs(x) <= 1 && abs(y) <= 1) {
            x = sgn(x) , y = sgn(y);
        } else {
            game.iflags.travelcc.x = game.u.tx = game.u.ux + x;
            game.iflags.travelcc.y = game.u.ty = game.u.uy + y;
            cmdq_add_ec(CQ_CANNED, dotravel_target);
            return 0;
        }
        if (x == 0 && y == 0) {
            if (((game.level.locations[game.u.ux][game.u.uy].typ) == FOUNTAIN) || ((game.level.locations[game.u.ux][game.u.uy].typ) == SINK)) {
                cmdq_add_ec(CQ_CANNED, dodrink);
                return 0;
            } else if (((game.level.locations[game.u.ux][game.u.uy].typ) == THRONE)) {
                cmdq_add_ec(CQ_CANNED, dosit);
                return 0;
            } else if (On_stairs_up(game.u.ux, game.u.uy)) {
                cmdq_add_ec(CQ_CANNED, doup);
                return 0;
            } else if (On_stairs_dn(game.u.ux, game.u.uy)) {
                cmdq_add_ec(CQ_CANNED, dodown);
                return 0;
            } else if ((o = (game.level.objects[game.u.ux][game.u.uy])) != null) {
                cmdq_add_ec(CQ_CANNED, ((o).otyp >= LARGE_BOX && (o).otyp <= BAG_OF_TRICKS) ? doloot : dopickup);
                return 0;
            } else {
                cmdq_add_ec(CQ_CANNED, donull);
                return 0;
            }
        }
        dir = xytodir(x, y);
        if (!(game.level.monsters[game.u.ux + x][game.u.uy + y]) && !test_move(game.u.ux, game.u.uy, x, y, 1)) {
            if (((game.level.locations[game.u.ux + x][game.u.uy + y].typ) == DOOR)) {
                if (game.level.locations[game.u.ux + x][game.u.uy + y].flags & 8) {
                    /* slight assistance to player: choose kick/open for them */
                    cmdq_add_ec(CQ_CANNED, dokick);
                    return 0;
                }
                if (game.level.locations[game.u.ux + x][game.u.uy + y].flags & 4) {
                    cmdq_add_ec(CQ_CANNED, doopen);
                    return 0;
                }
            }
            if (game.level.locations[game.u.ux + x][game.u.uy + y].typ <= SCORR) {
                cmdq_add_ec(CQ_CANNED, dosearch);
                return 0;
            }
            cmdq_add_ec(CQ_CANNED, game.move_funcs[dir][MV_WALK]);
            return 0;
        }
    } else {
        if (x > 2 * abs(y)) {
            x = 1 , y = 0;
        } else if (y > 2 * abs(x)) {
            x = 0 , y = 1;
        } else if (x < -2 * abs(y)) {
            x = -1 , y = 0;
        } else if (y < -2 * abs(x)) {
            x = 0 , y = -1;
        } else {
            x = sgn(x) , y = sgn(y);
        }
        if (x == 0 && y == 0) {
            cmdq_add_ec(CQ_CANNED, donull);
            return 0;
        }
        dir = xytodir(x, y);
    }
    cmdq_add_ec(CQ_CANNED, game.move_funcs[dir][MV_WALK]);
    return 0;
}
/* gather typed digits into a number in *count; return the next non-digit */
/* what comes after digits; if Null, anything */
/* if caller already got first digit, this is it */
/* if user tries to enter a bigger count, use this */
/* primary output */
/* control flags: GC_SAVEHIST, GC_ECHOFIRST */
export function get_count(allowchars, inkey, maxcount, count, gc_flags) {
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let key = 0;
    let save_input_state = game.program_state.input_state;
    let cnt = 0;
    let first = inkey ? (inkey - 48) : 0;
    let backspaced = (0);
    let showzero = (1);
    let historicmsg = (gc_flags & 1) != 0;
    let conditionalmsg = (gc_flags & 2) != 0;
    let echoalways = (gc_flags & 4) != 0;
    /* this should be done in port code so that we have erase_char
       and kill_char available; we can at least fake erase_char */
    count.value = 0;
    for (; ; ) {
        if (inkey) {
            /* should "Count: 123" go into message history? */
            /* put "Count: N" into mesg hist unless N is the same as the
               [first digit] value passed in via 'inkey' */
            /* normally "Count: 12" isn't echoed until the second digit */
            key = inkey;
            inkey = 0;
        } else {
            /* if readchar() has already been called in this loop, it will
               have reset input_state; put that back to its previous value */
            game.program_state.input_state = save_input_state;
            key = readchar();
        }
        if (digit(key)) {
            let dgt = (key - 48);
            /* cnt = (10 * cnt) + (key - '0'); */
            cnt = (((cnt) < Math.trunc(9223372036854775807 / 10) || ((cnt) == Math.trunc(9223372036854775807 / 10) && (dgt) <= 9223372036854775807 % 10)) ? (cnt) * 10 + (dgt) : -1);
            if (cnt < 0) {
                cnt = 0;
            } else if (maxcount > 0 && cnt > maxcount) {
                cnt = maxcount;
            }
            /* if we've backed up to nothing, then typed 0, show that 0 */
            showzero = (key == 48);
        } else if (key == 8 || key == 127) {
            if (!cnt && !echoalways) {
                break;
            }
            showzero = (0);
            cnt = Math.trunc(cnt / 10);
            backspaced = (1);
        } else if (key == game.Cmd.spkeys[NHKF_ESC]) {
            break;
        } else if (!allowchars || strchr(allowchars, key)) {
            count.value = cnt;
            if (count.value != cnt) {
                impossible("get_count: cmdcount_nht");
            }
            break;
        }
        if (cnt > 9 || backspaced || echoalways) {
            (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
            if (backspaced && !cnt && !showzero) {
                qbuf = sprintf(qbuf, "Count: ");
            } else {
                qbuf = sprintf(qbuf, "Count: %ld", cnt);
                backspaced = (0);
            }
            custompline(4, "%s", qbuf);
            (game.windowprocs.win_mark_synch)();
        }
    }
    if (historicmsg || (conditionalmsg && count.value != first)) {
        qbuf = sprintf(qbuf, "Count: %ld ", count.value);
        key2txt(key, eos(qbuf));
        (game.windowprocs.win_putmsghistory)(qbuf, (0));
    }
    return key;
}
/* main command input routine when not repeating and not executing canned
   commands; input comes via get_count() which collects repeat count if one
   is present and returns next non-digit to us */
export function parse() {
    let foo = 0;
    let bind = null;
    game.iflags.in_parse = (1);
    game.command_count = 0;
    game.context.move = (1);
    flush_screen(1);
    /* affects readchar() behavior for ESC iff 'altmeta' option is On;
       is always reset to otherInp by readchar() */
    game.program_state.input_state = commandInp;
    if (!game.Cmd.num_pad || (foo = readchar()) == game.Cmd.spkeys[NHKF_COUNT]) {
        /* if 'num_pad' is On then readchar() has just reset input_state;
           set it back to commandInp, so that get_count() supports 'altmeta';
           otherwise "n<count>ESC<character>" becomes "n<count>ESC" (with
           <character> not read from keyboard yet) rather than intended count
           and meta keystroke "n<count>M-<character>" */
        game.program_state.input_state = commandInp;
        foo = get_count(null, 0, 32767, { get value() { return game.command_count; }, set value(_v) { game.command_count = _v; } }, 0);
    }
    game.last_command_count = game.command_count;
    if (foo == game.Cmd.spkeys[NHKF_ESC]) {
        (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
        game.command_count = 0;
        game.last_command_count = 0;
    } else if (game.in_doagain) {
        /* these shouldn't go into the do-again buffer */
        /* this one might get put into the do-again buffer but
                      only if the interface code tells the core to do it */
        /* gc.command_count will be set again when we
           re-enter with gi.in_doagain set true */
        game.command_count = game.last_command_count;
    } else if (foo && (bind = cmdbind_get(foo & 255)) != null && bind && bind.cmd && (bind.cmd.ef_funct == do_repeat || bind.cmd.ef_funct == doprev_message || bind.cmd.ef_funct == doextcmd)) {
        game.command_count = game.last_command_count;
    }
    game.multi = game.command_count;
    if (game.multi) {
        game.multi--;
    }
    game.cmd_key = foo;
    (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
    game.iflags.in_parse = (0);
    return game.cmd_key;
}
/* some very old systems, or descendents of such systems, expect signal
   handlers to have return type `int', but they don't actually inspect
   the return value so we should be safe using `void' unconditionally */
/*ARGUSED*/
/* called as signal() handler, so sent
                              * at least one arg */
export function hangup(sig_unused) {
    if (game.program_state.exiting) {
        game.program_state.in_moveloop = 0;
    }
    nhwindows_hangup();
    /* When using SAFERHANGUP, the done_hup flag is tested in rhack
       and a couple of other places; actual hangup handling occurs then.
       This is 'safer' because it disallows certain cheats and also
       protects against losing objects in the process of being thrown,
       but also potentially riskier because the disconnected program
       must continue running longer before attempting a hangup save. */
    game.program_state.done_hup++;
    /* defer hangup iff game appears to be in progress */
    if (game.program_state.in_moveloop && game.program_state.something_worth_saving) {
        return;
    }
    end_of_input();
}
export function end_of_input() {
    if (((game.u.uz).dnum == (game.dungeon_topology.d_tutorial_dnum))) {
        game.program_state.something_worth_saving = 0;
    }
    if (game.program_state.something_worth_saving) {
        dosave0();
    }
    if (game.soundprocs.sound_exit_nhsound) {
        (game.soundprocs.sound_exit_nhsound)("end_of_input");
    }
    if (game.iflags.window_inited) {
        (game.windowprocs.win_exit_nhwindows)(null);
    }
    clearlocks();
    nh_terminate(0);
    return;
}
/* HANGUPHANDLING */
export function readchar_core(x, y, mod) {
    let sym = 0;
    readchar_done: {
        if (game.iflags.debug_fuzzer) {
            sym = randomkey();
            break readchar_done;
        }
        if (readchar_queue) {
            sym = readchar_queue++;
        } else if (game.in_doagain) {
            sym = pgetchar();
        } else {
            sym = (game.windowprocs.win_nh_poskey)(x, y, mod);
        }
        if (sym == (-1)) {
            let cnt = 20;
            do {
                /* omit if clearerr is undefined */
                clearerr(stdin);
                sym = pgetchar();
            } while (--cnt && sym == (-1));
        }
        if (sym == (-1)) {
            /* call end_of_input() or set program_state.done_hup */
            hangup(0);
            sym = 27;
        } else if (sym == 27 && game.iflags.altmeta && game.program_state.input_state != otherInp) {
            /* iflags.altmeta: treat two character ``ESC c'' as single `M-c' but
           only when we're called by parse() [possibly via get_count()]
           or getpos() [to support Alt+digit] or getdir() [for arrow keys
           under curses] */
            sym = readchar_queue ? readchar_queue++ : pgetchar();
            if (sym == (-1) || sym == 0) {
                sym = 27;
            } else if (sym != 27) {
                sym |= 128;
            }
        } else if (sym == 0) {
            game.clicklook_cc.x = game.clicklook_cc.y = -1;
            click_to_cmd(x.value, y.value, mod.value);
        }
    }
    /* in case we're called via getdir() which sets input_state */
    game.program_state.input_state = otherInp;
    /* next readchar() will be for an ordinary char unless parse()
       sets this back to non-zero */
    return sym;
}
/* get a character */
export function readchar() {
    let ch = 0;
    let x = game.u.ux;
    let y = game.u.uy;
    let mod = 0;
    ch = readchar_core({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, { get value() { return mod; }, set value(_v) { mod = _v; } });
    return ch;
}
/* used by getpos() to accept mouse input as well as keyboard input */
export function readchar_poskey(x, y, mod) {
    let ch = 0;
    game.program_state.input_state = getposInp;
    ch = readchar_core(x, y, mod);
    return ch;
}
/* '_' command, #travel, via keyboard rather than mouse click */
export function dotravel() {
    let cc = { x: 0, y: 0 };
    /*
     * Traveling used to be a no-op if user toggled 'travel' option
     * Off.  However, travel was initially implemented as a mouse-only
     * command and the original purpose of the option was to be able
     * to prevent clicks on the map from initiating travel.
     *
     * Travel via '_' came later.  Since it requires a destination--
     * which offers the user a chance to cancel if it was accidental--
     * there's no reason for the option to disable travel-by-keys.
     */
    cc.x = game.iflags.travelcc.x;
    cc.y = game.iflags.travelcc.y;
    if (cc.x == 0 && cc.y == 0) {
        /* No cached destination, start attempt from current position */
        cc.x = game.u.ux;
        cc.y = game.u.uy;
    }
    game.iflags.getloc_travelmode = (1);
    if (game.iflags.menu_requested) {
        let gfilt = game.iflags.getloc_filter;
        game.iflags.getloc_filter = GFILTER_VIEW;
        if (!getpos_menu(cc, GLOC_INTERESTING)) {
            game.iflags.getloc_filter = gfilt;
            game.iflags.getloc_travelmode = (0);
            return 0;
        }
        game.iflags.getloc_filter = gfilt;
    } else {
        pline("Where do you want to travel to?");
        if (getpos(cc, (1), "the desired destination") < 0) {
            game.iflags.getloc_travelmode = (0);
            return 2;
        }
    }
    game.iflags.travelcc.x = game.u.tx = cc.x;
    game.iflags.travelcc.y = game.u.ty = cc.y;
    return dotravel_target();
}
/* #retravel, travel to iflags.travelcc, which must be set */
export function dotravel_target() {
    if (!isok(game.iflags.travelcc.x, game.iflags.travelcc.y)) {
        /* assume <0,0>, the value assigned when travel reaches destination */
        pline("No travel destination set.");
        return 0;
    } else if (((game.iflags.travelcc.x) == game.u.ux && (game.iflags.travelcc.y) == game.u.uy)) {
        /* maybe interrupted while traveling then just walked rest of way
           so destination hasn't been reset yet */
        You("are already here.");
        game.iflags.travelcc.x = game.iflags.travelcc.y = 0;
        return 0;
    }
    game.iflags.getloc_travelmode = (0);
    game.context.travel = 1;
    game.context.travel1 = 1;
    game.context.run = 8;
    game.context.nopick = 1;
    game.domove_attempting |= 2;
    if (!game.multi) {
        game.multi = ((80) > (21) ? (80) : (21));
    }
    game.u.last_str_turn = 0;
    game.context.mv = (1);
    domove();
    return 1;
}
/* mouse click look command */
export function doclicklook() {
    if (!isok(game.clicklook_cc.x, game.clicklook_cc.y)) {
        return 0;
    }
    game.context.move = (0);
    auto_describe(game.clicklook_cc.x, game.clicklook_cc.y);
    return 0;
}
/* can we use menu entries to respond to a query? */
export function yn_menuable_resp(resp) {
    return game.iflags.query_menu && game.iflags.window_inited && (resp == ynchars || resp == ynqchars || resp == ynaqchars || resp == rightleftchars || resp == hidespinchars);
}
export function yn_func_menu_opt(win, key, text, def) {
    let any = 0;
    any = cg.zeroany;
    any.a_char = key;
    add_menu(win, nul_glyphinfo, any, key, 0, 0, 8, text, (def == key) ? 1 : 0);
}
/* use a menu to ask a specific response to a query.
   returns TRUE if the menu was shown to the user.
   puts the response char into res. */
export function yn_function_menu(query, resp, def, res) {
    let __nh_res_idx = 0;
    if (yn_menuable_resp(resp)) {
        let win = (game.windowprocs.win_create_nhwindow)(4);
        let sel = null;
        let n = 0;
        let keybuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        (game.windowprocs.win_start_menu)(win, 0);
        if (resp == rightleftchars) {
            yn_func_menu_opt(win, 114, "Right", def);
            yn_func_menu_opt(win, 108, "Left", def);
        } else if (resp == hidespinchars) {
            yn_func_menu_opt(win, 104, "Hide", def);
            yn_func_menu_opt(win, 115, "Spin a web", def);
        } else {
            yn_func_menu_opt(win, 121, "Yes", def);
            yn_func_menu_opt(win, 110, "No", def);
        }
        if (resp == ynaqchars) {
            yn_func_menu_opt(win, 97, "All", def);
        }
        if (resp == ynqchars || resp == ynaqchars || resp == hidespinchars) {
            yn_func_menu_opt(win, 113, "Quit", def);
        }
        (game.windowprocs.win_end_menu)(win, query);
        n = select_menu(win, 1, sel);
        (game.windowprocs.win_destroy_nhwindow)(win);
        if (n > 0) {
            res.value = sel[0].item.a_char;
            /* two were selected? use the one that wasn't the default */
            if (n > 1 && res[__nh_res_idx] == def) {
                res.value = sel[1].item.a_char;
            }
            free(sel);
        } else {
            res.value = def;
        }
        pline("%s %s", query, key2txt(res[__nh_res_idx], keybuf));
        (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
        return (1);
    }
    return (0);
}
/*
 *   Parameter validator for generic yes/no function to prevent
 *   the core from sending too long a prompt string to the
 *   window port causing a buffer overflow there.
 */
export function yn_function(query, resp, def, addcmdq) {
    let res = 27;
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let cq = { typ: 0, key: 0, dirx: 0, diry: 0, dirz: 0, intval: 0, ec_entry: null, next: null };
    let cmdq = null;
    let idx = game.saved_pline_index;
    /* buffer to hold query+space+formatted_single_char_response */
    /* [QBUFSZ+1+7] should suffice */
    let dumplog_buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* most recent pline is clobbered */
    game.iflags.last_msg = PLNMSG_UNKNOWN;
    if (strlen(query) >= 128) {
        /* maximum acceptable length is QBUFSZ-1 */
        /* caller shouldn't have passed anything this long */
        paniclog("Query truncated: ", query);
        qbuf = strncpy(qbuf, query, 128 - 1 - 3);
        strcpy({ get value() { return qbuf[128 - 1 - 3]; }, set value(_v) { qbuf[128 - 1 - 3] = _v; } }, "...");
        query = qbuf;
    }
    if (addcmdq && (cmdq = cmdq_pop()) != null) {
        Object.assign(cq, cmdq);
        free(cmdq);
    } else {
        cq.typ = CMDQ_USER_INPUT;
        cq.key = 0;
    }
    if (cq.typ != CMDQ_USER_INPUT) {
        if (cq.typ == CMDQ_KEY) {
            res = cq.key;
        } else {
            cmdq_clear(CQ_CANNED);
        }
        /* for the fuzzer, usually force a valid response, but sometimes let
       it exercise windowport yn_function and invalid response handling */
        addcmdq = (0);
    } else if (game.iflags.debug_fuzzer && resp && resp.value && rn2(20)) {
        let ln = strlen(resp);
        let ridx = rn2(ln);
        res = resp[ridx];
        if (res == 27) {
            if (ln > 1) {
                /* if valid-responses includes ESC followed by unshown candidates
           and we randomly picked the ESC, try again with only whatever is
           before it; be careful to avoid rn2(0) */
                /* if ESC is at start (ridx==0), pick something after it */
                ridx = (ridx == 0) ? (1 + rn2(ln - 1)) : rn2(ridx);
                res = resp[ridx];
            } else {
                /* ESC is the only thing (ln==1); something is strange... */
                res = def;
            }
        }
    } else {
        if (!yn_function_menu(query, resp, def, { get value() { return res; }, set value(_v) { res = _v; } })) {
            res = (game.windowprocs.win_yn_function)(query, resp, def);
        }
    }
    if (addcmdq) {
        cmdq_add_key(CQ_REPEAT, res);
    }
    if (idx == game.saved_pline_index) {
        dumplog_buf = sprintf(dumplog_buf, "%s ", query);
        /* when idx is still the same as gs.saved_pline_index, the interface
           didn't put the prompt into gs.saved_plines[]; we put a simplified
           version in there now (without response choices or default) */
        key2txt(res, eos(dumplog_buf));
        dumplogmsg(dumplog_buf);
    }
    if (resp && resp.value && res && !strchr(resp, res)) {
        /* should not happen but cq.key has been observed to not obey 'resp';
       it is most likely caused by saving a keystroke that was just used
       to answer a context-sensitive prompt, then using the do-again
       command with context that has changed */
        /* this probably needs refinement since caller is expecting something
           within 'resp' and ESC won't be (it could be present, but as a flag
           for unshown possibilities rather than as acceptable input) */
        let altres = def ? def : 27;
        if (!game.in_doagain || game.flags.debug) {
            let fuzzing = game.iflags.debug_fuzzer;
            let dbg_buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            nh_snprintf("yn_function", 5570, dbg_buf, 256 /* sizeof(char [256]) */, "%s [%s] (%s)", query, resp ? resp : "", def ? visctrl(def) : "");
            paniclog("yn debug", dbg_buf);
            /* don't let this known problem kill the fuzzer */
            game.iflags.debug_fuzzer = fuzzer_impossible_continue;
            impossible("yn_function() returned '%s'; using '%s' instead", visctrl(res), visctrl(altres));
            game.iflags.debug_fuzzer = fuzzing;
        }
        res = altres;
    }
    game.program_state.input_state = otherInp;
    return res;
}
/* for paranoid_confirm:quit,die,attack,&c prompting; allows yes, n|no,
   or q|quit; result is one of 'y' or 'n' or 'q'; ESC yields 'q' */
export function paranoid_ynq(be_paranoid, prompt, accept_q) {
    let c = 110;
    if (be_paranoid) {
        /* when paranoid, player must respond with "yes" rather than just 'y'
       to give the go-ahead for this query; default is "no" unless the
       ParanoidConfirm flag is set in which case there's no default */
        let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let ans = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        /* empty for first iteration */
        let promptprefix = "";
        let responsetype = ((game.flags.paranoia_bits & 1) != 0) ? (accept_q ? "[yes|no|quit]" : "[yes|no]") : (accept_q ? "[yes|n|q] (n)" : "[yes|n] (n)");
        /* 1 normal, 5 more with "Yes or No:" prefix */
        let k = 0;
        let trylimit = 6;
        pbuf = copynchars(pbuf, prompt, 256 - 1);
        do {
            /* make sure we won't overflow a QBUFSZ sized buffer */
            k = (strlen(promptprefix) + 1 + strlen(responsetype));
            if (strlen(pbuf) + k > 128 - 1) {
                strcpy(pbuf + (128 - 1) - k - 4, "...?");
            }
            nh_snprintf("paranoid_ynq", 5624, qbuf, 128 /* sizeof(char [128]) */, "%s%s %s", promptprefix, pbuf, responsetype);
            ans = '';
            getlin(qbuf, ans);
            ans = mungspaces(ans);
            if (!strncmpi((ans), ("yes"), -1)) {
                /* default of 'n' is shown for
                                             * the !ParanoidConfirm cases */
                /* in addition to being paranoid about this particular
           query, we might be even more paranoid about all paranoia
           responses (ie, ParanoidConfirm is set) in which case we
           require "no" to reject in addition to "yes" to confirm
           (except we won't loop if response is ESC; it means no) */
                /* chop off some at the end */
                c = 121;
                break;
            }
            if (!strncmpi((ans), ("quit"), -1) || ans == 27) {
                c = 113;
                break;
            }
            /* we don't bother adding "or \"Quit\"" for the accept_q case */
            /* for empty input, return value c will already be 'n' */
            promptprefix = "\"Yes\" or \"No\": ";
        } while (((game.flags.paranoia_bits & 1) != 0) && strncmpi((ans), ("no"), -1) && --trylimit);
    } else if (accept_q) {
        c = yn_function(prompt, ynqchars, 110, (0));
    } else {
        c = yn_function(prompt, ynchars, 110, (0));
    }
    if (c != 121 && (c != 113 || !accept_q)) {
        c = 110;
    }
    return c;
}
/* for paranoid_confirm:quit,die,attack,&c prompting; allows yes or n|no;
   result is True for yes; n|no and ESC yield False */
export function paranoid_query(be_paranoid, prompt) {
    return (paranoid_ynq(be_paranoid, prompt, (0)) == 121);
}
/* ^Z command, #suspend */
export function dosuspend_core() {
    if ((game.windowprocs.win_can_suspend)()) {
        /* Does current window system support suspend? */
        let now = getnow();
        game.urealtime.realtime += timet_delta(now, game.urealtime.start_timing);
        /* as a safeguard against panic save */
        game.urealtime.start_timing = now;
        /* NB: SYSCF SHELLERS handled in port code. */
        dosuspend();
        /* resume keeping track of time */
        game.urealtime.start_timing = getnow();
    } else {
        Norep(cmdnotavail, "#suspend");
    }
    return 0;
}
/* '!' command, #shell */
export function dosh_core() {
    let now = getnow();
    game.urealtime.realtime += timet_delta(now, game.urealtime.start_timing);
    game.urealtime.start_timing = now;
    /* access restrictions, if any, are handled in port code */
    dosh();
    game.urealtime.start_timing = getnow();
    return 0;
}
export function dummyfunction() {
    return 2;
}
/*cmd.c*/
/* relies on implicit concatenation of literal strings */
/* back up the commands & keys overwritten by new movement keys */
/* bind the new keys to movement commands */
/* M(number) works when altmeta is on */
/* can't bind highc() or C() of digits. just use the 5 prefix. */
/* any char, but avoid '\0' because it's used for mouse click */
/* could plug in bound values for spkeys[NHKF_GETPOS_PICK],&c
                   but that feels like overkill for something which should
                   never happen; just show their default values */
/* Since prefix keys got 'promoted' to commands, feedback for
         * invalid prefix is done in rhack() these days.
         */
/* non-null msg means that this wasn't an explicit user request */
/* force dx and dy to be +1, 0, or -1 */
/*
         * Some SYSV systems seem to return EOFs for various reasons
         * (?like when one hits break or for interrupted systemcalls?),
         * and we must see several before we quit.
         */
