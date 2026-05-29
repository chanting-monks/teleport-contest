/* NetHack 5.0	pline.c	$NHDT-Date: 1719819280 2024/07/01 07:34:40 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.130 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2018. */
/* NetHack may be freely redistributed.  See license for details. */
/* big enough to format a 4*BUFSZ string (from
                              * config file parsing) with modest decoration;
                              * result will then be truncated to BUFSZ-1 */
import { game } from '../gstate.js';
import { __builtin_va_end, __builtin_va_start } from '../c2js-runtime/builtins.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { panic } from '../c2js-runtime/panic.js';
import { fprintf, vsnprintf } from '../c2js-runtime/stdio.js';
import { strcat, strchr, strcmp, strcpy, strlen, strncmp, strncpy, strrchr } from '../c2js-runtime/string.js';
import { dirtocoord, isok, yn_function } from './cmd.js';
import { ynchars } from './decl.js';
import { flush_screen } from './display.js';
import { is_fainted } from './eat.js';
import { nh_terminate } from './end.js';
import { coord_desc } from './getpos.js';
import { strNsubst } from './hacklib.js';
import { BLINDED, DEAF, PLNMSG_UNKNOWN, fuzzer_impossible_panic } from './nh-constants.js';
import { msgtype_type } from './options.js';
import { submit_web_report } from './report.js';
import { unconscious } from './trap.js';
import { vision_recalc } from './vision.js';

/* keep the most recent DUMPLOG_MSG_COUNT messages */
export function dumplogmsg(line) {
    /*
     * TODO:
     *  This essentially duplicates message history, which is
     *  currently implemented in an interface-specific manner.
     *  The core should take responsibility for that and have
     *  this share it.
     */
    let indx = game.saved_pline_index;
    /* current content of that slot */
    let oldest = game.saved_plines[indx];
    if (!strncmp(line, "Unknown command", 15)) {
        return;
    }
    if (oldest && strlen(oldest) >= strlen(line)) {
        oldest = strcpy(oldest, line);
    } else {
        if (oldest) {
            free(oldest);
        }
        game.saved_plines[indx] = dupstr(line);
    }
    game.saved_pline_index = (indx + 1) % 50;
}
/* called during save (unlike the interface-specific message history,
   this data isn't saved and restored); end-of-game releases saved_plines[]
   while writing its contents to the final dump log */
export function dumplogfreemessages() {
    let i = 0;
    for (i = 0; i < 50; ++i) {
        if (game.saved_plines[i]) {
            free(game.saved_plines[i]) , game.saved_plines[i] = null;
        }
    }
    game.saved_pline_index = 0;
}
/* keeps windowprocs usage out of pline() */
export function putmesg(line) {
    let attr = 0;
    if (game.iflags.debug_prevent_pline) {
        return;
    }
    if ((game.pline_flags & 8) != 0 && (game.windowprocs.wincap2 & 16384) != 0) {
        attr |= 16;
    }
    if ((game.pline_flags & 4) != 0 && (game.windowprocs.wincap2 & 32768) != 0) {
        attr |= 32;
    }
    (game.windowprocs.win_putstr)(game.WIN_MESSAGE, attr, line);
    ;
}
/* set the direction where next message happens */
export function set_msg_dir(dir) {
    dirtocoord(game.a11y.msg_loc, dir);
    game.a11y.msg_loc.x += game.u.ux;
    game.a11y.msg_loc.y += game.u.uy;
}
/* set the coordinate where next message happens */
export function set_msg_xy(x, y) {
    game.a11y.msg_loc.x = x;
    game.a11y.msg_loc.y = y;
}
export function pline(line) {
    let the_args = 0;
    __builtin_va_start(the_args, line);
    vpline(line, the_args);
    __builtin_va_end(the_args);
}
export function pline_dir(dir, line) {
    let the_args = 0;
    set_msg_dir(dir);
    __builtin_va_start(the_args, line);
    vpline(line, the_args);
    __builtin_va_end(the_args);
}
export function pline_xy(x, y, line) {
    let the_args = 0;
    set_msg_xy(x, y);
    __builtin_va_start(the_args, line);
    vpline(line, the_args);
    __builtin_va_end(the_args);
}
export function pline_mon(mtmp, line) {
    let the_args = 0;
    if (mtmp == game.youmonst) {
        set_msg_xy(0, 0);
    } else {
        set_msg_xy(mtmp.mx, mtmp.my);
    }
    __builtin_va_start(the_args, line);
    vpline(line, the_args);
    __builtin_va_end(the_args);
}
let __vpline_in_pline = 0;
export function vpline(line, the_args) {
    /* will be chopped down to BUFSZ-1 if longer */
    let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ln = 0;
    let msgtyp = 0;
    let no_repeat = 0;
    let a11y_mesgxy = { x: 0, y: 0 };
    pline_done: {
        /* will get chopped down to BUFSZ-1 if longer */
        /* save a11y.msg_loc before reseting it */
        Object.assign(a11y_mesgxy, game.a11y.msg_loc);
        /* always reset a11y.msg_loc whether we end up using it or not */
        game.a11y.msg_loc.x = game.a11y.msg_loc.y = 0;
        if (!line || !line.value) {
            return;
        }
        if (game.program_state.done_hup) {
            return;
        }
        if (game.program_state.wizkit_wishing) {
            return;
        }
        if (game.a11y.accessiblemsg && isok(a11y_mesgxy.x, a11y_mesgxy.y)) {
            /* when accessiblemsg is set and a11y.msg_loc is nonzero, use the latter
       to insert a location prefix in front of current message */
            let tmp = null;
            let dirstr = null;
            let dirstrbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            dirstr = coord_desc(a11y_mesgxy.x, a11y_mesgxy.y, dirstrbuf, ((game.iflags.getpos_coords == 110) ? 102 : game.iflags.getpos_coords));
            tmp = alloc(strlen(line) + 3 /* sizeof(char [3]) */ + strlen(dirstr));
            tmp = strcpy(tmp, dirstr);
            tmp = strcat(tmp, ": ");
            tmp = strcat(tmp, line);
            vpline(tmp, the_args);
            free(tmp);
            return;
        }
        if (!strchr(line, 37)) {
            /* format does not specify any substitutions; use it as-is */
            ln = strlen(line);
        } else if (line[0] == 37 && line[1] == 115 && !line[2]) {
            /* "%s" => single string; skip format and use its first argument;
           unlike with the format, it is irrelevant whether the argument
           contains any percent signs */
            /*VA_NEXT(line,const char *);*/
            line = /* unhandled expr VAArgExpr */ 0;
            ln = strlen(line);
        } else {
            /* perform printf() formatting */
            ln = vsnprintf(pbuf, 1280 /* sizeof(char [1280]) */, line, the_args);
            /* note: 'ln' is number of characters attempted, not necessarily
           strlen(line); that matters for the overflow check; if we avoid
           the extremely-too-long panic then 'ln' will be actual length */
            line = pbuf;
        }
        if (ln > 1280 /* sizeof(char [1280]) */ - 1) {
            panic("pline attempting to print %d characters!", ln);
        }
        if (ln > 256 - 1) {
            /* too long but modestly so; allow but truncate, preserving final
           3 chars: "___ extremely long text" -> "___ extremely l...ext"
           (this may be suboptimal if overflow is less than 3) */
            /* no '%' was present or format was just "%s" */
            if (line != pbuf) {
                pbuf = strncpy(pbuf, line, 256 - 1);
            }
            pbuf[256 - 1 - 6] = pbuf[256 - 1 - 5] = pbuf[256 - 1 - 4] = 46;
            /* avoid strncpy; buffers could overlap if excess is small */
            pbuf[256 - 1 - 3] = line[ln - 3];
            pbuf[256 - 1 - 2] = line[ln - 2];
            pbuf[256 - 1 - 1] = line[ln - 1];
            /* unlike pline, we don't futz around to keep last few chars */
            /* terminate strncpy or truncate vsprintf */
            pbuf[256 - 1] = 0;
            line = pbuf;
        }
        msgtyp = 0;
        /* We hook here early to have options-agnostic output.
     * Unfortunately, that means Norep() isn't honored (general issue) and
     * that short lines aren't combined into one longer one (tty behavior).
     */
        if ((game.pline_flags & 4) == 0) {
            dumplogmsg(line);
        }
        if (__vpline_in_pline++ || !game.iflags.window_inited) {
            (game.windowprocs.win_raw_print)(line);
            /* use raw_print() if we're called too early (or perhaps too late
       during shutdown) or if we're being called recursively (probably
       via debugpline() in the interface code) */
            /* [we should probably be using raw_printf("\n%s", line) here] */
            /* this gets cleared after every pline message */
            game.iflags.last_msg = PLNMSG_UNKNOWN;
            break pline_done;
        }
        no_repeat = (game.pline_flags & 1) ? (1) : (0);
        if ((game.pline_flags & 2) == 0) {
            msgtyp = msgtype_type(line, no_repeat);
            if ((game.pline_flags & 8) == 0 && (msgtyp == 2 || (msgtyp == 1 && !strcmp(line, game.prevmsg)))) {
                break pline_done;
            }
        }
        if (game.vision_full_recalc) {
            /* FIXME: we need a way to tell our caller that this message
             * was suppressed so that caller doesn't set iflags.last_msg
             * for something that hasn't been shown, otherwise a subsequent
             * message which uses alternate wording based on that would be
             * doing so out of context and probably end up seeming silly.
             * (Not an issue for no-repeat but matters for no-show.)
             */
            let tmp_in_pline = __vpline_in_pline;
            __vpline_in_pline = 0;
            vision_recalc(0);
            __vpline_in_pline = tmp_in_pline;
        }
        if (game.u.ux) {
            flush_screen((game.pline_flags & 64) ? 0 : 1);
        }
        putmesg(line);
        execplinehandler(line);
        game.iflags.last_msg = PLNMSG_UNKNOWN;
        strncpy(game.prevmsg, line, 256) , game.prevmsg[256 - 1] = 0;
        if (msgtyp == 3) {
            (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
        }
    }
    --__vpline_in_pline;
}
/* pline() variant which can override MSGTYPE handling or suppress
   message history (tty interface uses pline() to issue prompts and
   they shouldn't be blockable via MSGTYPE=hide) */
export function custompline(pflags, line) {
    let the_args = 0;
    __builtin_va_start(the_args, line);
    game.pline_flags = pflags;
    vpline(line, the_args);
    game.pline_flags = 0;
    __builtin_va_end(the_args);
}
/* if player has dismissed --More-- with ESC to suppress further messages
   until next input request, tell the interface that it should override that
   and re-enable them; equivalent to custompline(URGENT_MESSAGE, line, ...)
   but slightly simpler to use */
export function urgent_pline(line) {
    let the_args = 0;
    __builtin_va_start(the_args, line);
    game.pline_flags = 8;
    vpline(line, the_args);
    game.pline_flags = 0;
    __builtin_va_end(the_args);
}
export function Norep(line) {
    let the_args = 0;
    __builtin_va_start(the_args, line);
    game.pline_flags = 1;
    vpline(line, the_args);
    game.pline_flags = 0;
    __builtin_va_end(the_args);
}
export function You_buf(siz) {
    if (siz > game.you_buf_siz) {
        if (game.you_buf) {
            free(game.you_buf);
        }
        game.you_buf_siz = siz + 10;
        game.you_buf = alloc(game.you_buf_siz);
    }
    return game.you_buf;
}
export function free_youbuf() {
    if (game.you_buf) {
        free(game.you_buf) , game.you_buf = null;
    }
    game.you_buf_siz = 0;
}
/* `prefix' must be a string literal, not a pointer */
export function You(line) {
    let the_args = 0;
    let tmp = null;
    __builtin_va_start(the_args, line);
    vpline(strcat((strcpy((tmp = You_buf((strlen(line) + 5 /* sizeof(char [5]) */))), "You ") , tmp), line), the_args);
    __builtin_va_end(the_args);
}
export function Your(line) {
    let the_args = 0;
    let tmp = null;
    __builtin_va_start(the_args, line);
    vpline(strcat((strcpy((tmp = You_buf((strlen(line) + 6 /* sizeof(char [6]) */))), "Your ") , tmp), line), the_args);
    __builtin_va_end(the_args);
}
export function You_feel(line) {
    let the_args = 0;
    let tmp = null;
    __builtin_va_start(the_args, line);
    if ((game.multi < 0 && (unconscious() || is_fainted()))) {
        strcpy((tmp = You_buf((strlen(line) + 25 /* sizeof(char [25]) */))), "You dream that you feel ");
    } else {
        strcpy((tmp = You_buf((strlen(line) + 10 /* sizeof(char [10]) */))), "You feel ");
    }
    /* caller should have caught this... */
    vpline(strcat(tmp, line), the_args);
    __builtin_va_end(the_args);
}
export function You_cant(line) {
    let the_args = 0;
    let tmp = null;
    __builtin_va_start(the_args, line);
    vpline(strcat((strcpy((tmp = You_buf((strlen(line) + 11 /* sizeof(char [11]) */))), "You can't ") , tmp), line), the_args);
    __builtin_va_end(the_args);
}
export function pline_The(line) {
    let the_args = 0;
    let tmp = null;
    __builtin_va_start(the_args, line);
    vpline(strcat((strcpy((tmp = You_buf((strlen(line) + 5 /* sizeof(char [5]) */))), "The ") , tmp), line), the_args);
    __builtin_va_end(the_args);
}
export function There(line) {
    let the_args = 0;
    let tmp = null;
    __builtin_va_start(the_args, line);
    vpline(strcat((strcpy((tmp = You_buf((strlen(line) + 7 /* sizeof(char [7]) */))), "There ") , tmp), line), the_args);
    __builtin_va_end(the_args);
}
export function You_hear(line) {
    let the_args = 0;
    let tmp = null;
    if (((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(game.multi < 0 && (unconscious() || is_fainted()))) || !game.flags.acoustics) {
        return;
    }
    __builtin_va_start(the_args, line);
    if ((game.u.uinwater)) {
        strcpy((tmp = You_buf((strlen(line) + 17 /* sizeof(char [17]) */))), "You barely hear ");
    } else if ((game.multi < 0 && (unconscious() || is_fainted()))) {
        strcpy((tmp = You_buf((strlen(line) + 25 /* sizeof(char [25]) */))), "You dream that you hear ");
    } else {
        strcpy((tmp = You_buf((strlen(line) + 10 /* sizeof(char [10]) */))), "You hear ");
    }
    vpline(strcat(tmp, line), the_args);
    __builtin_va_end(the_args);
}
export function You_see(line) {
    let the_args = 0;
    let tmp = null;
    __builtin_va_start(the_args, line);
    if ((game.multi < 0 && (unconscious() || is_fainted()))) {
        strcpy((tmp = You_buf((strlen(line) + 24 /* sizeof(char [24]) */))), "You dream that you see ");
    } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        strcpy((tmp = You_buf((strlen(line) + 11 /* sizeof(char [11]) */))), "You sense ");
    } else {
        strcpy((tmp = You_buf((strlen(line) + 9 /* sizeof(char [9]) */))), "You see ");
    }
    vpline(strcat(tmp, line), the_args);
    __builtin_va_end(the_args);
}
/* Print a message inside double-quotes.
 * The caller is responsible for checking deafness.
 * Gods can speak directly to you in spite of deafness.
 */
export function verbalize(line) {
    let the_args = 0;
    let tmp = null;
    __builtin_va_start(the_args, line);
    game.pline_flags |= 16;
    tmp = You_buf(strlen(line) + 3 /* sizeof(char [3]) */);
    tmp = strcpy(tmp, "\"");
    tmp = strcat(tmp, line);
    tmp = strcat(tmp, "\"");
    vpline(tmp, the_args);
    game.pline_flags &= ~16;
    __builtin_va_end(the_args);
}
export function gamelog_add(glflags, gltime, str) {
    let tmp = null;
    let lst = game.gamelog;
    tmp = alloc(1 /* sizeof(struct gamelog_line) */);
    tmp.turn = gltime;
    tmp.flags = glflags;
    tmp.text = dupstr(str);
    tmp.next = null;
    while (lst && lst.next) {
        lst = lst.next;
    }
    if (!lst) {
        game.gamelog = tmp;
    } else {
        lst.next = tmp;
    }
}
export function livelog_printf(ll_type, line) {
    let gamelogbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let the_args = 0;
    __builtin_va_start(the_args, line);
    vsnprintf(gamelogbuf, 512 /* sizeof(char [512]) */, line, the_args);
    __builtin_va_end(the_args);
    gamelog_add(ll_type, game.moves, gamelogbuf);
    strNsubst(gamelogbuf, "\t", "_", 0);
    livelog_add(ll_type, gamelogbuf);
}
/* nothing here */
/* nothing here */
/* !CHRONICLE */
export function raw_printf(line) {
    let the_args = 0;
    __builtin_va_start(the_args, line);
    vraw_printf(line, the_args);
    __builtin_va_end(the_args);
    if (!game.program_state.beyond_savefile_load) {
        game.early_raw_messages++;
    }
}
export function vraw_printf(line, the_args) {
    let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (strchr(line, 37)) {
        vsnprintf(pbuf, 1280 /* sizeof(char [1280]) */, line, the_args);
        line = pbuf;
    }
    if (strlen(line) > 256 - 1) {
        if (line != pbuf) {
            line = strncpy(pbuf, line, 256 - 1);
        }
        pbuf[256 - 1] = 0;
    }
    (game.windowprocs.win_raw_print)(line);
    execplinehandler(line);
    if (!game.program_state.beyond_savefile_load) {
        game.early_raw_messages++;
    }
}
export function impossible(s) {
    let the_args = 0;
    let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let pbuf2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    __builtin_va_start(the_args, s);
    if (game.program_state.in_impossible) {
        panic("impossible called impossible");
    }
    game.program_state.in_impossible = 1;
    vsnprintf(pbuf, 1280 /* sizeof(char [1280]) */, s, the_args);
    __builtin_va_end(the_args);
    pbuf[256 - 1] = 0;
    paniclog("impossible", pbuf);
    if (game.iflags.debug_fuzzer == fuzzer_impossible_panic) {
        panic("%s", pbuf);
    }
    game.pline_flags = 8;
    pline("%s", pbuf);
    game.pline_flags = 0;
    if (game.program_state.in_sanity_check) {
        /* skip rest of multi-line feedback */
        game.program_state.in_impossible = 0;
        return;
    }
    pbuf2 = strcpy(pbuf2, "Program in disorder!");
    if (game.program_state.something_worth_saving) {
        pbuf2 = strcat(pbuf2, "  (Saving and reloading may fix this problem.)");
    }
    pline("%s", pbuf2);
    pline("Please report these messages to %s.", "devteam@nethack.org");
    if (game.sysopt.support) {
        pline("Alternatively, contact local support: %s", game.sysopt.support);
    }
    if (game.sysopt.crashreporturl) {
        let report = (121 == yn_function("Report now?", ynchars, 110, (0)));
        (game.windowprocs.win_raw_print)("");
        if (report) {
            /* prove to the user the character was accepted */
            submit_web_report(1, "Impossible", pbuf);
        }
    }
    game.program_state.in_impossible = 0;
}
game.use_pline_handler = (1);
export function execplinehandler(line) {
    let f = 0;
    let args = [null, null, null];
    if (!game.use_pline_handler || !game.sysopt.msghandler) {
        return;
    }
    f = fork();
    /* -Wunused-but-set-variable */
    if (f == 0) {
        args[0] = game.sysopt.msghandler;
        args[1] = line;
        args[2] = null;
        setgid(getgid());
        setuid(getuid());
        execv(args[0], args);
        perror(null);
        fprintf(stderr, "Exec to message handler %s failed.\n", game.sysopt.msghandler);
        nh_terminate(1);
    } else if (f > 0) {
        let status = 0;
        waitpid(f, { get value() { return status; }, set value(_v) { status = _v; } }, 0);
    } else if (f == -1) {
        perror(null);
        game.use_pline_handler = (0);
        pline("%s", "Fork to message handler failed.");
    }
}
/* nhassert_failed is called when an nhassert's condition is false */
export function nhassert_failed(expression, filepath, line) {
    let filename = null;
    let p = null;
    /* Attempt to get filename from path.
       TODO: we really need a port provided function to return a filename
       from a path. */
    filename = filepath;
    if ((p = strrchr(filename, 47)) != null) {
        filename = p + 1;
    }
    if ((p = strrchr(filename, 92)) != null) {
        filename = p + 1;
    }
    /* usually "device:[directory]name"
       but might be "device:[root.][directory]name"
       and either "[directory]" or "[root.]" or both can be delimited
       by <> rather than by []; find the last of ']', '>', and ':'  */
    impossible("nhassert(%s) failed in file '%s' at line %d", expression, filename, line);
}
/*pline.c*/
/* this buffer will gradually shrink until the 'else' is needed;
           there's no pressing need to track allocation size instead */
/* clear the SPEECH flag so caller never has to */
