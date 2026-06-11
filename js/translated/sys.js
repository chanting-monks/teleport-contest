/* NetHack 5.0	sys.c	$NHDT-Date: 1717449153 2024/06/03 21:12:33 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.64 $ */
/* Copyright (c) Kenneth Lorber, Kensington, Maryland, 2008. */
/* NetHack may be freely redistributed.  See license for details. */
/* !SYSCF configurations need '#define DEBUGFILES "foo.c bar.c"'
 * to enable debugging feedback for source files foo.c and bar.c;
 * to activate debugpline(), set an appropriate value and uncomment
 */
/* # define DEBUGFILES "*" */
/* note: DEBUGFILES value here or in sysconf.DEBUGFILES can be overridden
   at runtime by setting up a value for "DEBUGFILES" in the environment */
import { game } from '../gstate.js';
import { free } from '../c2js-runtime/memory.js';
import { panic } from '../c2js-runtime/panic.js';
import { historical } from './nh-constants.js';

game.sysopt = { support: null, recover: null, wizards: null, fmtd_wizard_list: null, explorers: null, shellers: null, genericusers: null, debugfiles: null, msghandler: null, env_dbgfl: 0, maxplayers: 0, seduce: 0, check_save_uid: 0, check_plname: 0, bones_pools: 0, livelog: 0, persmax: 0, pers_is_uid: 0, entrymax: 0, pointsmin: 0, tt_oname_maxrank: 0, gdbpath: null, greppath: null, crashreporturl: null, panictrace_gdb: 0, panictrace_libc: 0, saveformat: [0, 0], bonesformat: [0, 0], accessibility: 0, hideusage: 0 };
export function sys_early_init() {
    let p = null;
    /* Don't assume that these are not already set, and that it is
     * safe to dupstr() without orphaning any pointers. Check them. */
    game.sysopt.support = null;
    game.sysopt.recover = null;
    game.sysopt.wizards = null;
    if ((p = getenv("DEBUGFILES")) != null) {
        if (game.sysopt.debugfiles) {
            free(game.sysopt.debugfiles);
        }
        game.sysopt.debugfiles = dupstr(p);
        /* prevent sysconf processing from overriding */
        game.sysopt.env_dbgfl = 1;
    } else {
        game.sysopt.debugfiles = null;
        game.sysopt.env_dbgfl = 0;
    }
    game.sysopt.shellers = null;
    game.sysopt.explorers = null;
    game.sysopt.genericusers = null;
    game.sysopt.msghandler = null;
    /* XXX eventually replace MAX_NR_OF_PLAYERS */
    game.sysopt.maxplayers = 0;
    game.sysopt.bones_pools = 0;
    game.sysopt.livelog = 0;
    game.sysopt.persmax = ((3) > (1) ? (3) : (1));
    game.sysopt.entrymax = ((100) > (10) ? (100) : (10));
    game.sysopt.pointsmin = ((1) > (1) ? (1) : (1));
    game.sysopt.pers_is_uid = 1;
    game.sysopt.tt_oname_maxrank = 10;
    if (game.sysopt.pers_is_uid != 0 && game.sysopt.pers_is_uid != 1) {
        panic("config error: PERS_IS_UID must be either 0 or 1");
    }
    if (game.sysopt.gdbpath) {
        free(game.sysopt.gdbpath);
    }
    game.sysopt.gdbpath = dupstr("/usr/bin/gdb");
    if (game.sysopt.greppath) {
        free(game.sysopt.greppath);
    }
    game.sysopt.greppath = dupstr("/bin/grep");
    game.sysopt.panictrace_gdb = 0;
    game.sysopt.panictrace_libc = 0;
    game.sysopt.crashreporturl = null;
    game.sysopt.check_save_uid = 1;
    game.sysopt.check_plname = 0;
    /* if it's compiled in, default to on */
    game.sysopt.seduce = 1;
    sysopt_seduce_set(game.sysopt.seduce);
    (game.sysopt.bonesformat[0] = historical, game.sysopt.saveformat[0] = historical);
    game.sysopt.accessibility = 0;
    game.sysopt.hideusage = 0;
    return;
}
export function sysopt_release() {
    if (game.sysopt.support) {
        free(game.sysopt.support) , game.sysopt.support = null;
    }
    if (game.sysopt.recover) {
        free(game.sysopt.recover) , game.sysopt.recover = null;
    }
    if (game.sysopt.wizards) {
        free(game.sysopt.wizards) , game.sysopt.wizards = null;
    }
    if (game.sysopt.explorers) {
        free(game.sysopt.explorers) , game.sysopt.explorers = null;
    }
    if (game.sysopt.shellers) {
        free(game.sysopt.shellers) , game.sysopt.shellers = null;
    }
    if (game.sysopt.debugfiles) {
        free(game.sysopt.debugfiles) , game.sysopt.debugfiles = null;
    }
    game.sysopt.env_dbgfl = 0;
    if (game.sysopt.msghandler) {
        free(game.sysopt.msghandler) , game.sysopt.msghandler = null;
    }
    if (game.sysopt.genericusers) {
        free(game.sysopt.genericusers) , game.sysopt.genericusers = null;
    }
    if (game.sysopt.gdbpath) {
        free(game.sysopt.gdbpath) , game.sysopt.gdbpath = null;
    }
    if (game.sysopt.greppath) {
        free(game.sysopt.greppath) , game.sysopt.greppath = null;
    }
    if (game.crash_email) {
        free(game.crash_email) , game.crash_email = (null);
    }
    if (game.crash_name) {
        free(game.crash_name) , game.crash_name = (null);
    }
    /* this one's last because it might be used in panic feedback, although
       none of the preceding ones are likely to trigger a controlled panic */
    if (game.sysopt.fmtd_wizard_list) {
        free(game.sysopt.fmtd_wizard_list) , game.sysopt.fmtd_wizard_list = null;
    }
    return;
}
/*
 * Attack substitution is now done on the fly in getmattk(mhitu.c).
 */
export function sysopt_seduce_set(val) {
    return;
}
/*sys.c*/
