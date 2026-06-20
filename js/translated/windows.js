/* NetHack 5.0	windows.c	$NHDT-Date: 1737345149 2025/01/19 19:52:29 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.138 $ */
/* Copyright (c) D. Cohrs, 1993. */
/* NetHack may be freely redistributed.  See license for details. */
/* Cannot just blindly include winX.h without including all of X11 stuff
   and must get the order of include files right.  Don't bother. */
/*#include "wingem.h"*/
/* be_win_init doesn't exist? XXX*/
/*#include "winGnome.h"*/
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { panic } from '../c2js-runtime/panic.js';
import { pline, raw_printf } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, fprintf, puts, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strchr, strcmp, strcpy, strlen, strncmpi, strncpy, strstr } from '../c2js-runtime/string.js';
import { tty_procs, win_tty_init } from '../c2js-runtime/wintty.js';
import { cmdq_pop } from './cmd.js';
import { cg, hexdd } from './decl.js';
import { map_glyphinfo, nul_glyphinfo } from './display.js';
import { def_char_to_monclass, def_char_to_objclass, def_monsyms, def_oc_syms } from './drawing.js';
import { nh_terminate } from './end.js';
import { eos, mungspaces } from './hacklib.js';
import { BL_AC, BL_ALIGN, BL_CAP, BL_CH, BL_CO, BL_CONDITION, BL_DX, BL_ENE, BL_ENEMAX, BL_EXP, BL_FLUSH, BL_GOLD, BL_HD, BL_HP, BL_HPMAX, BL_HUNGER, BL_IN, BL_LEVELDESC, BL_RESET, BL_SCORE, BL_STR, BL_TIME, BL_TITLE, BL_WI, BL_XP, CMDQ_KEY, MAXBLSTATS, MAX_GLYPH, set_menu_promptstyle, wp_hup } from './nh-constants.js';

game.windowprocs = { name: null, wp_id: 0, wincap: 0, wincap2: 0, has_color: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], win_init_nhwindows: null, win_player_selection: null, win_askname: null, win_get_nh_event: null, win_exit_nhwindows: null, win_suspend_nhwindows: null, win_resume_nhwindows: null, win_create_nhwindow: null, win_clear_nhwindow: null, win_display_nhwindow: null, win_destroy_nhwindow: null, win_curs: null, win_putstr: null, win_putmixed: null, win_display_file: null, win_start_menu: null, win_add_menu: null, win_end_menu: null, win_select_menu: null, win_message_menu: null, win_mark_synch: null, win_wait_synch: null, win_cliparound: null, win_print_glyph: null, win_raw_print: null, win_raw_print_bold: null, win_nhgetch: null, win_nh_poskey: null, win_nhbell: null, win_doprev_message: null, win_yn_function: null, win_getlin: null, win_get_ext_cmd: null, win_number_pad: null, win_delay_output: null, win_outrip: null, win_preference_update: null, win_getmsghistory: null, win_putmsghistory: null, win_status_init: null, win_status_finish: null, win_status_enablefield: null, win_status_update: null, win_can_suspend: null, win_update_inventory: null, win_ctrl_nhwindow: null };
// struct win_choices: { procs, ini_routine }
/* optional (can be 0) */
game.winchoices = [{ procs: tty_procs, ini_routine: win_tty_init }, { procs: null, ini_routine: null }];
/* Old font version of the game */
/* Tile version of the game */
/* must be last */
/* NB: this chain does not contain the terminal real window system pointer */
/* WINCHAIN */
export function genl_can_suspend_no() {
    return 0;
}
export function genl_can_suspend_yes() {
    return 1;
}
export function def_raw_print(s) {
    puts(s);
    if (__nh_char_at0(s)) {
        game.iflags.raw_printed++;
    }
}
export function def_wait_synch() {
    /* Config file error handling routines
     * call wait_sync() without checking to
     * see if it actually has a value,
     * leading to spectacular violations
     * when you try to execute address zero.
     * The existence of this allows early
     * processing to have something to execute
     * even though it essentially does nothing
     */
    /* window ports are expected to provide
       their own preference update routine
       for the preference capabilities that
       they support.
       Just return in this genl one. */
    return;
}
export function check_tty_wincap(wincap) {
    let wc = win_choices_find("tty");
    if (wc) {
        return ((wc.procs.wincap & wincap) == wincap);
    }
    return 0;
}
export function check_tty_wincap2(wincap2) {
    let wc = win_choices_find("tty");
    if (wc) {
        return ((wc.procs.wincap2 & wincap2) == wincap2);
    }
    return 0;
}
export function win_choices_find(s) {
    let i = 0;
    for (i = 0; game.winchoices[i].procs; i++) {
        if (!strncmpi((s), (game.winchoices[i].procs.name), -1)) {
            return game.winchoices[i];
        }
    }
    /* window ports can provide
       their own getmsghistory() routine to
       preserve message history between games.
       The routine is called repeatedly from
       the core save routine, and the window
       port is expected to successively return
       each message that it wants saved, starting
       with the oldest message first, finishing
       with the most recent.
       Return null pointer when finished.
     */
    return null;
}
export async function choose_windows(s) {
    let i = 0;
    let tmps = null;
    for (i = 0; game.winchoices[i].procs; i++) {
        if (43 == __nh_char_at0(game.winchoices[i].procs.name)) {
            continue;
        }
        if (45 == __nh_char_at0(game.winchoices[i].procs.name)) {
            continue;
        }
        if (!strncmpi((s), (game.winchoices[i].procs.name), -1)) {
            Object.assign(game.windowprocs, game.winchoices[i].procs);
            if (game.last_winchoice && game.last_winchoice.ini_routine) {
                (game.last_winchoice.ini_routine)(1);
            }
            if (game.winchoices[i].ini_routine) {
                (game.winchoices[i].ini_routine)(0);
            }
            game.last_winchoice = game.winchoices[i];
            /* processed one field other than BL_FLUSH */
            /* if 'str' is Null, just return without adding any menu entry */
            return;
        }
    }
    if (!game.windowprocs.win_raw_print) {
        game.windowprocs.win_raw_print = def_raw_print;
    }
    if (!game.windowprocs.win_wait_synch) {
        game.windowprocs.win_wait_synch = def_wait_synch;
    }
    if (!game.winchoices[0].procs) {
        await raw_printf("No window types supported?");
        nh_terminate(1);
    }
    if (strlen(s) >= 50) {
        /* 50: arbitrary, no real window_type names are anywhere near that long;
       used to prevent potential raw_printf() overflow if user supplies a
       very long string (on the order of 1200 chars) on the command line
       (config file options can't get that big; they're truncated at 1023) */
        tmps = alloc(50);
        tmps = strncpy(tmps, s, 50 - 1);
        tmps = __nh_char_write(tmps, 50 - 1, 0);
        s = tmps;
    }
    if (!game.winchoices[1].procs) {
        config_error_add("Window type %s not recognized.  The only choice is: %s", s, game.winchoices[0].procs.name);
    } else {
        let buf = '';
        let first = 1;
        buf = '';
        for (i = 0; game.winchoices[i].procs; i++) {
            if (43 == __nh_char_at0(game.winchoices[i].procs.name)) {
                continue;
            }
            if (45 == __nh_char_at0(game.winchoices[i].procs.name)) {
                continue;
            }
            buf = __nh_buf_append(buf, sprintf('', "%s%s", first ? "" : ", ", game.winchoices[i].procs.name));
            first = 0;
        }
        config_error_add("Window type %s not recognized.  Choices are:  %s", s, buf);
    }
    if (tmps) {
        free(tmps);
    }
    if (game.windowprocs.win_raw_print == def_raw_print) {
        nh_terminate(0);
    }
}
/* NB: The ini_routine() will be called during commit. */
/* Save wincap* from the real window system - we'll restore it below. */
/* add -chainin at head and -chainout at tail */
/* Now alloc() init() similar to Objective-C. */
/* Restore the saved wincap* values.  We do it here to give the
     * ini_routine()s a chance to change or check them. */
/* Call the init procs.  Do not re-init the terminal real win. */
/* Install the chain into window procs very late so ini_routine()s
     * can raw_print on error. */
/* assignment, not proof */
/* WINCHAIN */
/*
 * tty_message_menu() provides a means to get feedback from the
 * --More-- prompt; other interfaces generally don't need that.
 */
/*ARGSUSED*/
export async function genl_message_menu(let_, how, mesg) {
    await pline("%s", mesg);
    return 0;
}
/*ARGSUSED*/
export function genl_preference_update(pref) {
    return;
}
export function genl_getmsghistory(init) {
    return null;
}
export async function genl_putmsghistory(msg, is_restoring) {
    if (!is_restoring) {
        await pline("%s", msg);
    }
    return;
}
/*
 * Dummy windowing scheme used to replace current one with no-ops
 * in order to avoid all terminal I/O after hangup/disconnect.
 */
/* CHANGE_COLOR */
game.hup_procs = { name: "hup", wp_id: wp_hup, wincap: 0, wincap2: 0, has_color: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], win_init_nhwindows: hup_init_nhwindows, win_player_selection: hup_void_ndecl, win_askname: hup_void_ndecl, win_get_nh_event: hup_void_ndecl, win_exit_nhwindows: hup_exit_nhwindows, win_suspend_nhwindows: hup_void_fdecl_constchar_p, win_resume_nhwindows: hup_void_ndecl, win_create_nhwindow: hup_create_nhwindow, win_clear_nhwindow: hup_void_fdecl_winid, win_display_nhwindow: hup_display_nhwindow, win_destroy_nhwindow: hup_void_fdecl_winid, win_curs: hup_curs, win_putstr: hup_putstr, win_putmixed: hup_putstr, win_display_file: hup_display_file, win_start_menu: hup_void_fdecl_winid_ulong, win_add_menu: hup_add_menu, win_end_menu: hup_end_menu, win_select_menu: hup_select_menu, win_message_menu: genl_message_menu, win_mark_synch: hup_void_ndecl, win_wait_synch: hup_void_ndecl, win_cliparound: hup_cliparound, win_print_glyph: hup_print_glyph, win_raw_print: hup_void_fdecl_constchar_p, win_raw_print_bold: hup_void_fdecl_constchar_p, win_nhgetch: hup_nhgetch, win_nh_poskey: hup_nh_poskey, win_nhbell: hup_void_ndecl, win_doprev_message: hup_int_ndecl, win_yn_function: hup_yn_function, win_getlin: hup_getlin, win_get_ext_cmd: hup_int_ndecl, win_number_pad: hup_void_fdecl_int, win_delay_output: hup_void_ndecl, win_outrip: hup_outrip, win_preference_update: genl_preference_update, win_getmsghistory: genl_getmsghistory, win_putmsghistory: genl_putmsghistory, win_status_init: hup_void_ndecl, win_status_finish: hup_void_ndecl, win_status_enablefield: genl_status_enablefield, win_status_update: hup_status_update, win_can_suspend: genl_can_suspend_no, win_update_inventory: hup_void_fdecl_int, win_ctrl_nhwindow: hup_ctrl_nhwindow };
/* colors */
/* player_selection */
/* askname */
/* get_nh_event */
/* suspend_nhwindows */
/* resume_nhwindows */
/* clear_nhwindow */
/* destroy_nhwindow */
/* putmixed */
/* start_menu */
/* mark_synch */
/* wait_synch */
/* update_positionbar */
/* raw_print */
/* raw_print_bold */
/* nhbell  */
/* doprev_message */
/* get_ext_cmd */
/* number_pad */
/* nh_delay_output  */
/* change_background */
/* CHANGE_COLOR */
/* status_init */
/* status_finish */
/* update_inventory */
const previnterface_exit_nhwindows = null;
/* hangup has occurred; switch to no-op user interface */
export function nhwindows_hangup() {
    let previnterface_getmsghistory = null;
    /* command processor shouldn't look for 2nd char after seeing ESC */
    game.iflags.altmeta = 0;
    /* don't call exit_nhwindows() directly here; if a hangup occurs
       while interface code is executing, exit_nhwindows could knock
       the interface's active data structures out from under itself */
    if (game.iflags.window_inited && game.windowprocs.win_exit_nhwindows != hup_exit_nhwindows) {
        previnterface_exit_nhwindows = game.windowprocs.win_exit_nhwindows;
    }
    /* also, we have to leave the old interface's getmsghistory()
       in place because it will be called while saving the game */
    if (game.windowprocs.win_getmsghistory != game.hup_procs.win_getmsghistory) {
        previnterface_getmsghistory = game.windowprocs.win_getmsghistory;
    }
    Object.assign(game.windowprocs, game.hup_procs);
    if (previnterface_getmsghistory) {
        game.windowprocs.win_getmsghistory = previnterface_getmsghistory;
    }
}
export function hup_exit_nhwindows(lastgasp) {
    if (previnterface_exit_nhwindows) {
        /* core has called exit_nhwindows(); call the previous interface's
       shutdown routine now; xxx_exit_nhwindows() needs to call other
       xxx_ routines directly rather than through windowprocs pointers */
        /* don't want exit routine to attempt extra output */
        lastgasp = null;
        (previnterface_exit_nhwindows)(lastgasp);
        previnterface_exit_nhwindows = null;
    }
    game.iflags.window_inited = 0;
}
export function hup_nhgetch() {
    return 27;
}
/*ARGSUSED*/
export function hup_yn_function(prompt, resp, deflt) {
    if (!deflt) {
        deflt = 27;
    }
    return deflt;
}
/*ARGSUSED*/
export function hup_nh_poskey(x, y, mod) {
    return 27;
}
/*ARGSUSED*/
export function hup_getlin(prompt, outbuf) {
    outbuf = strcpy(outbuf, "\x1b");
}
/*ARGSUSED*/
export function hup_init_nhwindows(argc_p, argv) {
    game.iflags.window_inited = 1;
}
/*ARGUSED*/
export function hup_create_nhwindow(type) {
    return (-1);
}
/*ARGSUSED*/
export function hup_select_menu(window, how, menu_list) {
    return -1;
}
/*ARGSUSED*/
export function hup_add_menu(window, glyphinfo, identifier, sel, grpsel, attr, clr, txt, itemflags) {
    return;
}
/*ARGSUSED*/
export function hup_end_menu(window, prompt) {
    return;
}
/*ARGSUSED*/
export function hup_putstr(window, attr, text) {
    return;
}
/*ARGSUSED*/
export function hup_print_glyph(window, x, y, glyphinfo, bkglyphinfo) {
    return;
}
/*ARGSUSED*/
export function hup_outrip(tmpwin, how, when) {
    return;
}
/*ARGSUSED*/
export function hup_curs(window, x, y) {
    return;
}
/*ARGSUSED*/
export function hup_display_nhwindow(window, blocking) {
    return;
}
/*ARGSUSED*/
export function hup_display_file(fname, complain) {
    return;
}
/*ARGSUSED*/
export function hup_cliparound(x, y) {
    return;
}
/*ARGSUSED*/
/*ARGSUSED*/
/* MACOS9 */
/* CHANGE_COLOR */
/*ARGSUSED*/
export function hup_status_update(idx, ptr, chg, pc, color, colormasks) {
    return;
}
/*
 * Non-specific stubs.
 */
export function hup_int_ndecl() {
    return -1;
}
export function hup_void_ndecl() {
    return;
}
/*ARGUSED*/
export function hup_void_fdecl_int(arg) {
    return;
}
/*ARGUSED*/
export function hup_void_fdecl_winid(window) {
    return;
}
/*ARGUSED*/
export function hup_void_fdecl_winid_ulong(window, mbehavior) {
    return;
}
/*ARGUSED*/
export function hup_void_fdecl_constchar_p(string) {
    return;
}
/*ARGUSED*/
/* window to use, must be of type NHW_MENU */
export function hup_ctrl_nhwindow(window, request, wri) {
    return null;
}
/* HANGUPHANDLING */
/****************************************************************************/
/* genl backward compat stuff                                               */
/****************************************************************************/
export const status_fieldnm = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
export const status_fieldfmt = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
game.status_vals = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
game.status_activefields = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export async function genl_status_init() {
    let i = 0;
    for (i = 0; i < MAXBLSTATS; ++i) {
        game.status_vals[i] = alloc(200);
        game.status_vals[i] = '';
        game.status_activefields[i] = 0;
        status_fieldfmt[i] = null;
    }
    /* Use a window for the genl version; backward port compatibility */
    game.WIN_STATUS = (game.windowprocs.win_create_nhwindow)(2);
    await (game.windowprocs.win_display_nhwindow)(game.WIN_STATUS, 0);
}
export function genl_status_finish() {
    let i = 0;
    for (i = 0; i < MAXBLSTATS; ++i) {
        /* free alloc'd memory here */
        if (game.status_vals[i]) {
            free(game.status_vals[i]) , game.status_vals[i] = null;
        }
    }
}
export function genl_status_enablefield(fieldidx, nm, fmt, enable) {
    status_fieldfmt[fieldidx] = fmt;
    status_fieldnm[fieldidx] = nm;
    game.status_activefields[fieldidx] = enable;
}
/* call once for each field, then call with BL_FLUSH to output the result */
/* move experience and time to the end */
/* move level description plus gold and experience and time to end */
let __genl_status_update_fieldorder = [[BL_TITLE, BL_STR, BL_DX, BL_CO, BL_IN, BL_WI, BL_CH, BL_ALIGN, BL_SCORE, BL_FLUSH, BL_FLUSH, BL_FLUSH, BL_FLUSH, BL_FLUSH, BL_FLUSH], [BL_LEVELDESC, BL_GOLD, BL_HP, BL_HPMAX, BL_ENE, BL_ENEMAX, BL_AC, BL_XP, BL_EXP, BL_HD, BL_TIME, BL_HUNGER, BL_CAP, BL_CONDITION, BL_FLUSH], [BL_LEVELDESC, BL_GOLD, BL_HP, BL_HPMAX, BL_ENE, BL_ENEMAX, BL_AC, BL_XP, BL_EXP, BL_HD, BL_HUNGER, BL_CAP, BL_CONDITION, BL_TIME, BL_FLUSH], [BL_LEVELDESC, BL_GOLD, BL_HP, BL_HPMAX, BL_ENE, BL_ENEMAX, BL_AC, BL_HUNGER, BL_CAP, BL_CONDITION, BL_XP, BL_EXP, BL_HD, BL_TIME, BL_FLUSH], [BL_HP, BL_HPMAX, BL_ENE, BL_ENEMAX, BL_AC, BL_HUNGER, BL_CAP, BL_CONDITION, BL_LEVELDESC, BL_GOLD, BL_XP, BL_EXP, BL_HD, BL_TIME, BL_FLUSH]];
__nh_register_static(() => { __genl_status_update_fieldorder = [[BL_TITLE, BL_STR, BL_DX, BL_CO, BL_IN, BL_WI, BL_CH, BL_ALIGN, BL_SCORE, BL_FLUSH, BL_FLUSH, BL_FLUSH, BL_FLUSH, BL_FLUSH, BL_FLUSH], [BL_LEVELDESC, BL_GOLD, BL_HP, BL_HPMAX, BL_ENE, BL_ENEMAX, BL_AC, BL_XP, BL_EXP, BL_HD, BL_TIME, BL_HUNGER, BL_CAP, BL_CONDITION, BL_FLUSH], [BL_LEVELDESC, BL_GOLD, BL_HP, BL_HPMAX, BL_ENE, BL_ENEMAX, BL_AC, BL_XP, BL_EXP, BL_HD, BL_HUNGER, BL_CAP, BL_CONDITION, BL_TIME, BL_FLUSH], [BL_LEVELDESC, BL_GOLD, BL_HP, BL_HPMAX, BL_ENE, BL_ENEMAX, BL_AC, BL_HUNGER, BL_CAP, BL_CONDITION, BL_XP, BL_EXP, BL_HD, BL_TIME, BL_FLUSH], [BL_HP, BL_HPMAX, BL_ENE, BL_ENEMAX, BL_AC, BL_HUNGER, BL_CAP, BL_CONDITION, BL_LEVELDESC, BL_GOLD, BL_XP, BL_EXP, BL_HD, BL_TIME, BL_FLUSH]]; });
export function genl_status_update(idx, ptr, chg, percent, color, colormasks) {
    let newbot1 = '';
    let newbot2 = '';
    let cond = 0;
    let condptr = ptr;
    let i = 0;
    let pass = 0;
    let lndelta = 0;
    let idx1 = 0;
    let idx2 = 0;
    let fieldlist = null;
    let nb = null;
    let text = ptr;
    /* in case interface is using genl_status_update() but has not
       specified WC2_FLUSH_STATUS (status_update() for field values
       is buffered so final BL_FLUSH is needed to produce output) */
    game.windowprocs.wincap2 |= 128;
    if (idx >= 0) {
        if (!game.status_activefields[idx]) {
            return;
        }
        switch (idx) {
            case BL_CONDITION:
                cond = condptr ? condptr.value : 0;
                nb = game.status_vals[idx];
                nb = __nh_char_write(nb, 0, 0);
                if (cond & 1048576) {
                    strcpy(nb = eos(nb), " Stone");
                }
                if (cond & 262144) {
                    strcpy(nb = eos(nb), " Slime");
                }
                if (cond & 2097152) {
                    strcpy(nb = eos(nb), " Strngl");
                }
                if (cond & 128) {
                    strcpy(nb = eos(nb), " FoodPois");
                }
                if (cond & 16777216) {
                    strcpy(nb = eos(nb), " TermIll");
                }
                if (cond & 2) {
                    strcpy(nb = eos(nb), " Blind");
                }
                if (cond & 16) {
                    strcpy(nb = eos(nb), " Deaf");
                }
                if (cond & 4194304) {
                    strcpy(nb = eos(nb), " Stun");
                }
                if (cond & 8) {
                    strcpy(nb = eos(nb), " Conf");
                }
                if (cond & 1024) {
                    strcpy(nb = eos(nb), " Hallu");
                }
                if (cond & 16384) {
                    strcpy(nb = eos(nb), " Lev");
                }
                if (cond & 64) {
                    strcpy(nb = eos(nb), " Fly");
                }
                if (cond & 65536) {
                    strcpy(nb = eos(nb), " Ride");
                }
                break;
            default:
                game.status_vals[idx] = sprintf(game.status_vals[idx], status_fieldfmt[idx] ? status_fieldfmt[idx] : "%s", text ? text : "");
                break;
        }
        return;
    }
    /* (idx >= 0, thus not BL_FLUSH, BL_RESET, BL_CHARACTERISTICS) */
    /* does BL_RESET require any specific code to ensure all fields ? */
    if (!(idx == BL_FLUSH || idx == BL_RESET)) {
        return;
    }
    /* We've received BL_FLUSH; time to output the gathered data */
    nb = newbot1;
    nb = __nh_char_write(nb, 0, 0);
    for (i = 0; (idx1 = __genl_status_update_fieldorder[0][i]) != BL_FLUSH; ++i) {
        /* BL_FLUSH is the only pseudo-index value we need to check for
       in the loop below because it is the only entry used to pad the
       end of the fieldorder array. We could stop on any
       negative (illegal) index, but this should be fine */
        if (game.status_activefields[idx1]) {
            strcpy(nb = eos(nb), game.status_vals[idx1]);
        }
    }
    /* if '$' is encoded, buffer length of \GXXXXNNNN is 9 greater than
       single char; we want to subtract that 9 when checking display length */
    lndelta = (game.status_activefields[BL_GOLD] && strstr(game.status_vals[BL_GOLD], "\\G")) ? 9 : 0;
    for (pass = 1; pass <= 4; pass++) {
        /* basic bot2 formats groups of second line fields into five buffers,
       then decides how to order those buffers based on comparing lengths
       of [sub]sets of them to the width of the map; we have more control
       here but currently emulate that behavior */
        fieldlist = __genl_status_update_fieldorder[pass];
        nb = newbot2;
        nb = __nh_char_write(nb, 0, 0);
        for (i = 0; (idx2 = fieldlist[i]) != BL_FLUSH; ++i) {
            if (game.status_activefields[idx2]) {
                let val = game.status_vals[idx2];
                switch (idx2) {
                    /* for pass 4, Hp comes first; mungspaces()
                               will strip the unwanted leading spaces */
                    case BL_HP:
                    case BL_XP:
                    case BL_HD:
                    case BL_TIME:
                        strcpy(nb = eos(nb), " ");
                        break;
                    case BL_LEVELDESC:
                        if (i != 0) {
                            strcpy(nb = eos(nb), " ");
                        }
                        break;
                    /*
                 * We want "  hunger encumbrance conditions"
                 *   or    "  encumbrance conditions"
                 *   or    "  hunger conditions"
                 *   or    "  conditions"
                 * 'hunger'      is either " " or " hunger_text";
                 * 'encumbrance' is either " " or " encumbrance_text";
                 * 'conditions'  is either ""  or " cond1 cond2...".
                 */
                    case BL_HUNGER:
                        if (strcmp(val, " ")) {
                            strcpy(nb = eos(nb), " ");
                        }
                        break;
                    case BL_CAP:
                        if (!strcmp(val, " ")) {
                            (val = __nh_advance_str(val, 1));
                        }
                        break;
                    default:
                        break;
                }
                strcpy(nb = eos(nb), val);
            }
            /* status_activefields[idx2] */
            if (idx2 == BL_CONDITION && pass < 4 && strlen(newbot2) - lndelta > 80) {
                break;
            }
        }
        if (idx2 == BL_FLUSH) {
            /* made it past BL_CONDITION */
            if (pass > 1) {
                newbot2 = mungspaces(newbot2);
            }
            break;
        }
    }
    (game.windowprocs.win_curs)(game.WIN_STATUS, 1, 0);
    (game.windowprocs.win_putstr)(game.WIN_STATUS, 0, newbot1);
    (game.windowprocs.win_curs)(game.WIN_STATUS, 1, 1);
    /* putmixed() due to GOLD glyph */
    (game.windowprocs.win_putmixed)(game.WIN_STATUS, 0, newbot2);
}
game.dumplog_windowprocs_backup = { name: null, wp_id: 0, wincap: 0, wincap2: 0, has_color: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], win_init_nhwindows: null, win_player_selection: null, win_askname: null, win_get_nh_event: null, win_exit_nhwindows: null, win_suspend_nhwindows: null, win_resume_nhwindows: null, win_create_nhwindow: null, win_clear_nhwindow: null, win_display_nhwindow: null, win_destroy_nhwindow: null, win_curs: null, win_putstr: null, win_putmixed: null, win_display_file: null, win_start_menu: null, win_add_menu: null, win_end_menu: null, win_select_menu: null, win_message_menu: null, win_mark_synch: null, win_wait_synch: null, win_cliparound: null, win_print_glyph: null, win_raw_print: null, win_raw_print_bold: null, win_nhgetch: null, win_nh_poskey: null, win_nhbell: null, win_doprev_message: null, win_yn_function: null, win_getlin: null, win_get_ext_cmd: null, win_number_pad: null, win_delay_output: null, win_outrip: null, win_preference_update: null, win_getmsghistory: null, win_putmsghistory: null, win_status_init: null, win_status_finish: null, win_status_enablefield: null, win_status_update: null, win_can_suspend: null, win_update_inventory: null, win_ctrl_nhwindow: null };
game.dumplog_file = null;
/* True -> full substitution for file name,
                       * False -> partial substitution for '--showpaths'
                       * feedback where there's no game in progress */
/*
     * Note: %t and %T assume that time_t is a 'long int' number of
     * seconds since some epoch value.  That's quite iffy....  The
     * unit of time might be different and the datum size might be
     * some variant of 'long long int'.  [Their main purpose is to
     * construct a unique file name rather than record the date and
     * time; violating the 'long seconds since base-date' assumption
     * may or may not interfere with that usage.]
     */
/* fallthrough */
/* literal % */
/* game start, timestamp */
/* current time, timestamp */
/* game start, YYYYMMDDhhmmss */
/* current time, YYYYMMDDhhmmss */
/* version, eg. "5.0.0,-0" */
/* UID */
/* player name */
/* first character of player name */
/* replace potentially troublesome characters (including
                   <space> even though it might be an acceptable file name
                   character); user shouldn't be able to get ' ' or '/'
                   or '\\' into plname[] but play things safe */
/* note: replacements are only done on field substitutions,
                   not on the template (from sysconf or DUMPLOG_FILE) */
/* DUMPLOG */
export function dump_open_log(now) {
    ((now));
}
export function dump_close_log() {
    if (game.dumplog_file) {
        fclose(game.dumplog_file);
        game.dumplog_file = null;
    }
}
export function dump_forward_putstr(win, attr, str, no_forward) {
    if (game.dumplog_file) {
        fprintf(game.dumplog_file, "%s\n", str);
    }
    if (!no_forward) {
        (game.windowprocs.win_putstr)(win, attr, str);
    }
}
/*ARGSUSED*/
export function dump_putstr(win, attr, str) {
    if (game.dumplog_file) {
        fprintf(game.dumplog_file, "%s\n", str);
    }
}
export function dump_create_nhwindow(type) {
    return (-1);
}
/*ARGUSED*/
export function dump_clear_nhwindow(win) {
    return;
}
/*ARGSUSED*/
export function dump_display_nhwindow(win, p) {
    return;
}
/*ARGUSED*/
export function dump_destroy_nhwindow(win) {
    return;
}
/*ARGUSED*/
export function dump_start_menu(win, mbehavior) {
    return;
}
/*ARGSUSED*/
export function dump_add_menu(win, glyphinfo, identifier, ch, gch, attr, clr, str, itemflags) {
    if (game.dumplog_file) {
        if (glyphinfo.glyph == MAX_GLYPH) {
            fprintf(game.dumplog_file, " %s\n", str);
        } else {
            fprintf(game.dumplog_file, "  %c - %s\n", ch, str);
        }
    }
}
/*ARGSUSED*/
export function dump_end_menu(win, str) {
    if (game.dumplog_file) {
        if (str) {
            fprintf(game.dumplog_file, "%s\n", str);
        } else {
            fputs("\n", game.dumplog_file);
        }
    }
}
export function dump_select_menu(win, how, item) {
    item.value = null;
    return 0;
}
export function dump_redirect(onoff_flag) {
    if (game.dumplog_file) {
        if (onoff_flag) {
            game.windowprocs.win_create_nhwindow = dump_create_nhwindow;
            game.windowprocs.win_clear_nhwindow = dump_clear_nhwindow;
            game.windowprocs.win_display_nhwindow = dump_display_nhwindow;
            game.windowprocs.win_destroy_nhwindow = dump_destroy_nhwindow;
            game.windowprocs.win_start_menu = dump_start_menu;
            game.windowprocs.win_add_menu = dump_add_menu;
            game.windowprocs.win_end_menu = dump_end_menu;
            game.windowprocs.win_select_menu = dump_select_menu;
            game.windowprocs.win_putstr = dump_putstr;
        } else {
            Object.assign(game.windowprocs, game.dumplog_windowprocs_backup);
        }
        game.iflags.in_dumplog = onoff_flag;
    } else {
        game.iflags.in_dumplog = 0;
    }
}
export function has_color(color) {
    return (game.iflags.wc_color && game.windowprocs.name && (game.windowprocs.wincap & 1) && game.windowprocs.has_color[color]);
}
export function glyph2ttychar(glyph) {
    let glyphinfo = { glyph: 0, ttychar: 0, framecolor: 0, gm: { glyphflags: 0, sym: { color: 0, symidx: 0 }, customcolor: 0, color256idx: 0, tileidx: 0, u: null } };
    map_glyphinfo(0, 0, glyph, 0, glyphinfo);
    return glyphinfo.ttychar;
}
export function glyph2symidx(glyph) {
    let glyphinfo = { glyph: 0, ttychar: 0, framecolor: 0, gm: { glyphflags: 0, sym: { color: 0, symidx: 0 }, customcolor: 0, color256idx: 0, tileidx: 0, u: null } };
    map_glyphinfo(0, 0, glyph, 0, glyphinfo);
    return glyphinfo.gm.sym.symidx;
}
let __encglyph_encbuf = '';
__nh_register_static(() => { __encglyph_encbuf = ''; });
export function encglyph(glyph) {
    __encglyph_encbuf = sprintf(__encglyph_encbuf, "\\G%04X%04X", game.context.rndencode, glyph);
    return __encglyph_encbuf;
}
/* hexdd[] is defined in decl.c */
export function decode_glyph(str, glyph_ptr) {
    let rndchk = 0;
    let dcount = 0;
    let retval = 0;
    let dp = null;
    for (; __nh_char_at0(str) && ++dcount <= 4; (str = __nh_advance_str(str, 1))) {
        if ((dp = strchr(hexdd, __nh_char_at0(str))) != null) {
            retval++;
            rndchk = (rndchk * 16) + (Math.trunc(((hexdd.length - dp.length)) / 2));
        } else {
            break;
        }
    }
    if (rndchk == game.context.rndencode) {
        glyph_ptr.value = dcount = 0;
        for (; __nh_char_at0(str) && ++dcount <= 4; (str = __nh_advance_str(str, 1))) {
            if ((dp = strchr(hexdd, __nh_char_at0(str))) != null) {
                retval++;
                glyph_ptr.value = (glyph_ptr.value * 16) + (Math.trunc(((hexdd.length - dp.length)) / 2));
            } else {
                break;
            }
        }
        return retval;
    }
    return 0;
}
export function decode_mixed(buf, str) {
    let __nh_put_idx = 0;
    let glyphinfo = nul_glyphinfo;
    if (!str) {
        return strcpy(buf, "");
    }
    while (__nh_char_at0(str)) {
        if (__nh_char_at0(str) == 92) {
            let dcount = 0;
            let so = 0;
            let ggv = 0;
            let save_str = null;
            save_str = (str = __nh_advance_str(str, 1));
            switch (__nh_char_at0(str)) {
                case 71:
                    if ((dcount = decode_glyph(__nh_advance_str(str, 1), { get value() { return ggv; }, set value(_v) { ggv = _v; } }))) {
                        str = __nh_advance_str(str, (dcount + 1));
                        map_glyphinfo(0, 0, ggv, 0, glyphinfo);
                        so = glyphinfo.gm.sym.symidx;
                        buf = buf.slice(0, __nh_put_idx++) + String.fromCharCode(game.showsyms[so]);
                        /* 'str' is ready for the next loop iteration and '*str'
                       should not be copied at the end of this iteration */
                        continue;
                    } else {
                        /* possible forgery - leave it the way it is */
                        str = save_str;
                    }
                    break;
                case 92:
                    break;
                case 0:
                    str = save_str;
                    break;
            }
        }
        buf = buf.slice(0, __nh_put_idx++) + String.fromCharCode((str = __nh_advance_str(str, 1)));
    }
    buf = buf.slice(0, __nh_put_idx);
    return buf;
}
/*
 * This differs from putstr() because the str parameter can
 * contain a sequence of characters representing:
 *        \GXXXXNNNN    a glyph value, encoded by encglyph().
 *
 * For window ports that haven't yet written their own
 * XXX_putmixed() routine, this general one can be used.
 * It replaces the encoded glyph sequence with a single
 * showsyms[] char, then just passes that string onto
 * putstr().
 */
export function genl_putmixed(window, attr, str) {
    let buf = '';
    /* now send it to the normal putstr */
    (game.windowprocs.win_putstr)(window, attr, decode_mixed(buf, str));
}
/* possibly called to show usage info during command line processing when
   an interface hasn't yet been chosen and set up */
export function genl_display_file(fname, complain) {
    let buf = '';
    let f = fopen(fname, "r");
    if (!f) {
        /* send complaint to stdout rather than to stderr */
        if (complain) {
            fprintf(stdout, "\nCannot open \"%s\".\n", fname);
        }
    } else {
        while (fgets(buf, 256, f)) {
            /* straight copy to stdout, no pagination or other interaction */
            if (fputs(buf, stdout) < 0) {
                break;
            }
        }
        fclose(f);
    }
}
/*
 * Window port helper function for menu invert routines to move the decision
 * logic into one place instead of 7 different window-port routines.
 */
/* 0: invert; 1: select; 2: deselect */
/* itemflags for the item */
/* current selection status of the item */
export function menuitem_invert_test(mode, itemflags, is_selected) {
    let skipinvert = (itemflags & 2) != 0;
    /* if not flagged SKIPINVERT, always pass test */
    if (!skipinvert) {
        return 1;
    }
    if (game.iflags.menuinvertmode == 2) {
        /*
     * mode 0: inverting current on/off state;
     *      1: unconditionally setting on;
     *      2: unconditionally setting off.
     * menuinvertmode 0: treat entries flagged with skipinvert as ordinary
     *                   (same as if not flagged);
     * menuinvertmode 1: don't toggle bulk invert or bulk select entries On;
     *                   allow toggling to Off (for invert and deselect;
     *                   select doesn't do Off);
     * menuinvertmode 2: don't toggle skipinvert entries either On or Off
     *                   when any bulk change is performed.
     */
        return 0;
    } else if (game.iflags.menuinvertmode == 1) {
        return is_selected ? 1 : 0;
    }
    return 1;
}
/*
 * helper routine if a window port wants to extract the glyph
 * information from a glyph number representation in the string;
 * the returned string is the remainder of the string after
 * extracting the \GNNNNNNNN information. The glyph details,
 * including the utf8 representation under ENHANCED_SYMBOLS,
 * will be stored in the glyph_info struct pointed to by gip.
 */
export function mixed_to_glyphinfo(str, gip) {
    let dcount = 0;
    let ggv = 0;
    if (!str || !gip) {
        return " ";
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = nul_glyphinfo) */;
    if (__nh_char_at0(str) == 92 && __nh_char_at0((__nh_advance_str(str, 1))) == 71) {
        if ((dcount = decode_glyph(__nh_advance_str(str, 2), { get value() { return ggv; }, set value(_v) { ggv = _v; } }))) {
            map_glyphinfo(0, 0, ggv, 0, gip);
            /* 'str' is ready for the next loop iteration and
                '*str' should not be copied at the end of this
                iteration */
            str = __nh_advance_str(str, (dcount + 2));
        }
    }
    return str;
}
/*
 * This is a somewhat generic menu for taking a list of NetHack style
 * class choices and presenting them via a description
 * rather than the traditional NetHack characters.
 * (Benefits users whose first exposure to NetHack is via tiles).
 *
 * prompt
 *           The title at the top of the menu.
 *
 * category: 0 = monster class
 *           1 = object  class
 *
 * way
 *           FALSE = PICK_ONE, TRUE = PICK_ANY
 *
 * class_list
 *           a null terminated string containing the list of choices.
 *
 * class_selection
 *           a null terminated string containing the selected characters.
 *
 * Returns number selected.
 */
export async function choose_classes_menu(prompt, category, way, class_list, class_select) {
    let pick_list = null;
    let win = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let buf = '';
    let text = null;
    let selected = 0;
    let ret = 0;
    let i = 0;
    let n = 0;
    let next_accelerator = 0;
    let accelerator = 0;
    let clr = 8;
    if (!class_list || !class_select) {
        return 0;
    }
    next_accelerator = 97;
    Object.assign(any, cg.zeroany);
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    while (__nh_char_at0(class_list)) {
        let idx = 0;
        selected = 0;
        switch (category) {
            case 0:
                idx = def_char_to_monclass(__nh_char_at0(class_list));
                if (!((idx) >= 0 && (idx) < (Math.trunc(61 /* sizeof(const struct class_sym [61]) */ / 1 /* sizeof(const struct class_sym) */)))) {
                    await panic("choose_classes_menu: invalid monclass '%c'", __nh_char_at0(class_list));
                }
                text = def_monsyms[idx].explain;
                accelerator = __nh_char_at0(class_list);
                buf = sprintf(buf, "%s", text);
                break;
            case 1:
                idx = def_char_to_objclass(__nh_char_at0(class_list));
                if (!((idx) >= 0 && (idx) < (Math.trunc(18 /* sizeof(const struct class_sym [18]) */ / 1 /* sizeof(const struct class_sym) */)))) {
                    await panic("choose_classes_menu: invalid objclass '%c'", __nh_char_at0(class_list));
                }
                text = def_oc_syms[idx].explain;
                accelerator = next_accelerator;
                buf = sprintf(buf, "%c  %s", __nh_char_at0(class_list), text);
                break;
            default:
                await panic("choose_classes_menu: invalid category %d", category);
        }
        if (way && class_select.value) {
            if (strchr(class_select, __nh_char_at0(class_list))) {
                /* Selections there already */
                selected = 1;
            }
        }
        any.a_int = __nh_char_at0(class_list);
        await add_menu(win, nul_glyphinfo, any, accelerator, category ? __nh_char_at0(class_list) : 0, 0, clr, buf, selected ? 1 : 0);
        if (category > 0) {
            if (next_accelerator == 90) {
                break;
            } else if (next_accelerator == 122) {
                next_accelerator = 65;
            } else {
                ++next_accelerator;
            }
        }
        (class_list = __nh_advance_str(class_list, 1));
    }
    if (category == 1 && next_accelerator <= 122) {
        await add_menu_str(win, "");
        Object.assign(any, cg.zeroany);
        any.a_int = 32;
        buf = sprintf(buf, "%c  %s", any.a_int, "All classes of objects");
        await add_menu(win, nul_glyphinfo, any, 65, 0, 0, clr, buf, 2);
        if (!strcmp(prompt, "Autopickup what?")) {
            await add_menu_str(win, "Note: when no choices are selected, \"all\" is implied.");
            await add_menu_str(win, game.flags.pickup ? "Toggle off 'autopickup' to not pick up anything." : "Toggle on 'autopickup' to automatically pick these things up.");
        }
    }
    (game.windowprocs.win_end_menu)(win, prompt);
    n = await select_menu(win, way ? 2 : 1, pick_list);
    (game.windowprocs.win_destroy_nhwindow)(win);
    if (n > 0) {
        if (category == 1) {
            for (i = 0; i < n; ++i) {
                if (pick_list[i].item.a_int == 32) {
                    /* for object classes, first check for 'all'; it means 'use
               a blank list' rather than 'collect every possible choice' */
                    pick_list[0].item.a_int = 32;
                    /* return 1; also an implicit 'break;' */
                    n = 1;
                }
            }
        }
        for (i = 0; i < n; ++i) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = pick_list[i].item.a_int) */;
        }
        free(pick_list);
        ret = n;
    } else if (n == -1) {
        class_select = eos(class_select);
        ret = -1;
    } else {
        ret = 0;
    }
    class_select.value = 0;
    return ret;
}
/* enum and structs are defined in wintype.h */
game.zerowri = { tocore: { tocore_flags: 0, active: 0, use_update_inventory: 0, maxslot: 0, needrows: 0, needcols: 0, haverows: 0, havecols: 0 }, fromcore: { core_request: 0, invmode: 0, menu_promptstyle: { color: 8, attr: 0 } } };
export function adjust_menu_promptstyle(window, style) {
    let wri = game.zerowri;
    wri.fromcore.menu_promptstyle.color = style.color;
    wri.fromcore.menu_promptstyle.attr = style.attr;
    /*  relay the style change to the window port */
    (game.windowprocs.win_ctrl_nhwindow)(window, set_menu_promptstyle, wri);
    game.opt_need_promptstyle = 0;
}
/*
 *   Common code point leading into the interface-specific
 *   add_menu() to allow single-spot adjustments to the parameters,
 *   such as those done by menu_colors.
 */
/* window to use, must be of type NHW_MENU */
/* glyph info with glyph to
                                  * display with item */
/* what to return if selected */
/* selector letter (0 = pick our own) */
/* group accelerator (0 = no group) */
/* attribute for menu text (str) */
/* color for menu text (str) */
/* menu text */
/* itemflags such as MENU_ITEMFLAGS_SELECTED */
export async function add_menu(window, glyphinfo, identifier, ch, gch, attr, color, str, itemflags) {
    if (!str) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/windows.c", 1)) {
                let save_plnmsg = game.iflags.last_msg;
                await pline("add_menu(Null)");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        return;
    }
    if (game.iflags.use_menu_color) {
        if ((itemflags & 4) == 0) {
            get_menu_coloring(str, { get value() { return color; }, set value(_v) { color = _v; } }, { get value() { return attr; }, set value(_v) { attr = _v; } });
        }
    }
    /* this is the only function that cared about this flag; remove it now */
    itemflags &= ~4;
    (game.windowprocs.win_add_menu)(window, glyphinfo, identifier, ch, gch, attr, color, str, itemflags);
}
/* insert a non-selectable, possibly highlighted line of text into a menu */
export async function add_menu_heading(tmpwin, buf) {
    let any = cg.zeroany;
    let attr = game.iflags.menu_headings.attr;
    let color = game.iflags.menu_headings.color;
    /* suppress highlighting during end-of-game disclosure */
    if (game.program_state.gameover) {
        attr = 0 , color = 8;
    }
    await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, attr, color, buf, 4);
}
/* insert a non-selectable, unhighlighted line of text into a menu */
export async function add_menu_str(tmpwin, buf) {
    let any = cg.zeroany;
    await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, 8, buf, 0);
}
export function get_menu_coloring(str, color, attr) {
    let tmpmc = null;
    if (game.iflags.use_menu_color) {
        for (tmpmc = game.menu_colorings; tmpmc; tmpmc = tmpmc.next) {
            if (regex_match(str, tmpmc.match)) {
                color.value = tmpmc.color;
                attr.value = tmpmc.attr;
                return 1;
            }
        }
    }
    return 0;
}
export async function select_menu(window, how, menu_list) {
    let reslt = 0;
    let old_bot_disabled = game.bot_disabled;
    game.bot_disabled = 1;
    reslt = await (game.windowprocs.win_select_menu)(window, how, menu_list);
    game.bot_disabled = old_bot_disabled;
    return reslt;
}
export async function getlin(query, bufp) {
    let old_bot_disabled = game.bot_disabled;
    let obufp = bufp;
    let got_cmdq = 0;
    let cmdq = null;
    let __line = '';
    while ((cmdq = cmdq_pop()) != null) {
        if (cmdq.typ == CMDQ_KEY) {
            got_cmdq = 1;
            if (cmdq.key != 10) {
                __line += String.fromCharCode(cmdq.key);
            }
            if (cmdq.key == 10) {
                break;
            }
        } else {
            break;
        }
        free(cmdq);
        cmdq = null;
    }
    if (cmdq) {
        free(cmdq);
    }
    if (got_cmdq) {
        bufp = __line;
        await pline("%s %s", query, bufp);
        return bufp;
    }
    game.program_state.in_getlin = 1;
    game.bot_disabled = 1;
    bufp = await (game.windowprocs.win_getlin)(query, bufp);
    game.bot_disabled = old_bot_disabled;
    game.program_state.in_getlin = 0;
    return bufp;
}
/*windows.c*/

game.__getlin_returns_buffer = 1;

// Install hup_procs no-op defaults for null windowprocs fields.
// Gated: enable with NH_WINPROCS_DEFAULTS=1.  See LEARNINGS §23.29.
if (typeof process !== 'undefined' && process.env?.NH_WINPROCS_DEFAULTS) {
    for (const __wp_k of Object.keys(game.windowprocs)) {
        if (game.windowprocs[__wp_k] === null && typeof game.hup_procs[__wp_k] === 'function') {
            game.windowprocs[__wp_k] = game.hup_procs[__wp_k];
        }
    }
}
/* early config file error processing routines call this */
/* window ports can provide
       their own putmsghistory() routine to
       load message history from a saved game.
       The routine is called repeatedly from
       the core restore routine, starting with
       the oldest saved message first, and
       finishing with the latest.
       The window port routine is expected to
       load the message recall buffers in such
       a way that the ordering is preserved.
       The window port routine should make no
       assumptions about how many messages are
       forthcoming, nor should it assume that
       another message will follow this one,
       so it should keep all pointers/indexes
       intact at the end of each call.
    */
/* this doesn't provide for reloading the message window with the
       previous session's messages upon restore, but it does put the quest
       message summary lines there by treating them as ordinary messages */
/* leveldesc has no leading space, so if we've moved
                       it past the first position, provide one */
/* hunger==" " - keep it, end up with " ";
                       hunger!=" " - insert space and get "  hunger" */
/* cap==" " - suppress it, retain "  hunger" or " ";
                       cap!=" " - use it, get "  hunger cap" or "  cap" */
/* String ended with '\\'.  This can happen when someone
                   names an object with a name ending with '\\', drops the
                   named object on the floor nearby and does a look at all
                   nearby objects. */
/* brh - should we perhaps not allow things to have names
                   that contain '\\' */
/* for objects, add "A - ' '  all classes", after a separator */
/* we won't preselect this even if the incoming list is empty;
           having it selected means that it would have to be explicitly
           de-selected in order to select anything else */
/* for 'O', "toggle" should be intuitive; for 'm O', it would
               probably be better to say "Set 'autopickup' to true|false" */
