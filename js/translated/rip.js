/* NetHack 5.0	rip.c	$NHDT-Date: 1597967808 2020/08/20 23:56:48 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.33 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2017. */
/* NetHack may be freely redistributed.  See license for details. */
/* Defining TEXT_TOMBSTONE causes genl_outrip() to exist, but it doesn't
   necessarily have to be used by a binary with multiple window-ports */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strlen } from '../c2js-runtime/string.js';
import { yyyymmdd } from './calendar.js';
import { formatkiller } from './topten.js';

/* A normal tombstone for end of game display. */
const rip_txt = ["                       ----------", "                      /          \\", "                     /    REST    \\", "                    /      IN      \\", "                   /     PEACE      \\", "                  /                  \\", "                  |                  |", "                  |                  |", "                  |                  |", "                  |                  |", "                  |                  |", "                  |                  |", "                  |       1001       |", "                 *|     *  *  *      | *", "        _________)/\\\\_//(\\/(/\\)/\\//\\/|_)_______", null];
/* Name of player */
/* Amount of $ */
/* Type of death */
/* . */
/* . */
/* . */
/* Real year of death */
/* char[] element of center of stone face */
/* NH320_DEDICATION */
/* NetHack 3.2.x displayed a dual tombstone as a tribute to Izchak. */
/* char[] element of center of stone face */
/* NH320_DEDICATION */
/* # chars that fit on one line
                            * (note 1 ' ' border)           */
/* *char[] line # for player name */
/* *char[] line # for amount of gold */
/* *char[] line # for death description */
/* *char[] line # for year */
export function center(line, text) {
    let __nh_ip_idx = 0;
    let op = null;
    __nh_ip_idx = 0;
    op = game.rip[line][28 - ((strlen(text) + 1) >> 1)];
    while (text[__nh_ip_idx]) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = text[__nh_ip_idx++]) */;
    }
}
export function genl_outrip(tmpwin, how, when) {
    let dp = null;
    let dpx = null;
    let buf = '';
    let x = 0;
    let line = 0;
    let year = 0;
    let cash = 0;
    game.rip = dp = alloc(16 /* sizeof(const char *const [16]) */);
    for (x = 0; rip_txt[x]; ++x) {
        dp[x] = dupstr(rip_txt[x]);
    }
    dp[x] = null;
    buf = sprintf(buf, "%.*s", 16, game.plname);
    center(6, buf);
    cash = ((game.done_money) > (0) ? (game.done_money) : (0));
    /* arbitrary upper limit; practical upper limit is quite a bit less */
    if (cash > 999999999) {
        cash = 999999999;
    }
    buf = sprintf(buf, "%ld Au", cash);
    center(7, buf);
    /* Put together death description */
    formatkiller(buf, 256 /* sizeof(char [256]) */, how, (0));
    for (line = 8 , dpx = buf; line < 12; line++) {
        let tmpchar = 0;
        let i = 0;
        let i0 = strlen(dpx);
        if (i0 > 16) {
            for (i = 16; (i > 0) && (i0 > 16); --i) {
                if (__nh_char_at0(__nh_advance_str(dpx, i)) == 32) {
                    i0 = i;
                }
            }
            if (!i) {
                i0 = 16;
            }
        }
        tmpchar = __nh_char_at0(__nh_advance_str(dpx, i0));
        dpx = __nh_char_write(dpx, i0, 0);
        center(line, dpx);
        if (tmpchar != 32) {
            dpx = __nh_char_write(dpx, i0, tmpchar);
            dpx = __nh_advance_str(dpx, i0);
        } else {
            dpx = __nh_advance_str(dpx, i0 + 1);
        }
    }
    year = ((Math.trunc(yyyymmdd(when) / 10000)) % 10000);
    buf = sprintf(buf, "%4d", year);
    center(12, buf);
    (game.windowprocs.win_putstr)(tmpwin, 0, "");
    for (; dp; dp++) {
        (game.windowprocs.win_putstr)(tmpwin, 0, dp);
    }
    (game.windowprocs.win_putstr)(tmpwin, 0, "");
    (game.windowprocs.win_putstr)(tmpwin, 0, "");
    for (x = 0; rip_txt[x]; x++) {
        free(game.rip[x]);
    }
    free(game.rip);
    game.rip = null;
}
/* TEXT_TOMBSTONE */
/*rip.c*/
