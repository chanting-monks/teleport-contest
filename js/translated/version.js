/* NetHack 5.0	version.c	$NHDT-Date: 1737622664 2025/01/23 00:57:44 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.105 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Michael Allison, 2018. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { pline, raw_printf } from '../c2js-runtime/pline.js';
import { regex_id } from '../c2js-runtime/regex.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strchr, strcmp, strcpy, strlen, strncmpi, strncpy, strrchr, strstri } from '../c2js-runtime/string.js';
import { datamodel, eos, strip_newline, strsubst, tabexpand, what_datamodel_is_this } from './hacklib.js';
import { exportascii } from './nh-constants.js';
import { sfi_char, sfi_uchar, sfi_version_info, sfo_char, sfo_uchar, sfo_version_info } from './sfbase.js';

/* fill buffer with short version (so caller can avoid including date.h)
 * buf cannot be NULL */
export function version_string(buf, bufsz) {
    nh_snprintf("version_string", 29, buf, bufsz, "%s", ((game.nomakedefs.version_string && game.nomakedefs.version_string[0]) ? game.nomakedefs.version_string : mdlib_version_string(buf, ".")));
    /* in case we try to write a paniclog entry after releasing
                 the 'nomakedefs' data */
    return buf;
}
/* fill and return the given buffer with the long nethack version string */
export function getversionstring(buf, bufsz) {
    buf = strcpy(buf, game.nomakedefs.version_id);
{
        let c = 0;
        let p = eos(buf);
        let dotoff = (p > buf && p[-1] == 46);
        if (dotoff) {
            --p;
        }
        p = strcpy(p, " (");
        if (game.nomakedefs.git_sha) {
            nh_snprintf("getversionstring", 58, eos(buf), (bufsz - strlen(buf)) - 1, "%s%s", c++ ? "," : "", game.nomakedefs.git_sha);
        }
        if (game.nomakedefs.git_prefix) {
            nh_snprintf("getversionstring", 68, eos(buf), (bufsz - strlen(buf)) - 1, "%sprefix:%s", c++ ? "," : "", game.nomakedefs.git_prefix);
        }
        if (c) {
            nh_snprintf("getversionstring", 71, eos(buf), (bufsz - strlen(buf)) - 1, "%s", ")");
        /* if nothing has been added, strip " (" back off */
        } else {
            /* retain one buffer so that it all goes into the paste buffer */
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        }
        if (dotoff) {
            nh_snprintf("getversionstring", 76, eos(buf), (bufsz - strlen(buf)) - 1, "%s", ".");
        }
    }
    return buf;
}
/* version info that could be displayed on status lines;
     "<game name> <git branch name> <x.y.z version number>";
   if game name is a prefix of--or same as--branch name, it is omitted
     "<git branch name> <x.y.z version number>";
   after release--or if branch info is unavailable--it will be
     "<game name> <x.y.z version number>";
   game name or branch name or both can be requested via flags */
export function status_version(buf, bufsz, indent) {
    let name = null;
    let altname = null;
    let indentation = null;
    let vflags = game.flags.versinfo;
    let shownum = ((vflags & 1) != 0);
    let showname = ((vflags & 2) != 0);
    let showbranch = ((vflags & 4) != 0);
    if (showname) {
        /* game's name {variants should use own name, not "NetHack"} */
        /* can be set to override default (base of filename) */
        name = nh_basename(game.hname, (0));
        if (!name || !name) {
            showname = (0);
        }
    }
    if (showbranch) {
        /* git branch name, if available */
        /*#if (NH_DEVEL_STATUS != NH_STATUS_RELEASED)*/
        altname = game.nomakedefs.git_branch;
        if (!altname || !altname) {
            showbranch = (0);
        }
    }
    if (showname && showbranch) {
        /* note: it's possible for branch name to be a prefix of game name
           but that's unlikely enough that we won't bother with it; having
           branch "nethack-5.0" be a superset of game "nethack" seems like
           including both is redundant, but having branch "net" be a subset
           of game "nethack" doesn't feel that way; optimizing "net" out
           seems like it would be a mistake */
        if (!strncmpi(name, altname, strlen(name))) {
            showname = (0);
        }
    } else if (!showname && !showbranch) {
        /* flags.versinfo could be set to only 'branch' but it might not
           be available */
        shownum = (1);
    }
    buf.value = 0;
    indentation = indent ? " " : "";
    if (showname) {
        nh_snprintf("status_version", 137, eos(buf), bufsz - strlen(buf), "%s%s", indentation, name);
        /* forced separator rather than optional indent */
        indentation = " ";
    }
    if (showbranch) {
        nh_snprintf("status_version", 141, eos(buf), bufsz - strlen(buf), "%s%s", indentation, altname);
        indentation = " ";
    }
    if (shownum) {
        nh_snprintf("status_version", 149, eos(buf), bufsz - strlen(buf), "%s%s", indentation, (game.nomakedefs.version_string && game.nomakedefs.version_string[0]) ? game.nomakedefs.version_string : mdlib_version_string(buf, "."));
    }
    return buf;
}
/* the #versionshort command */
export function doversion() {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (game.iflags.menu_requested) {
        return doextversion();
    }
    pline("%s", getversionstring(buf, 256 /* sizeof(char [256]) */));
    return 0;
}
/* the '#version' command; also a choice for '?' */
export function doextversion() {
    let rtcontext = 0;
    let rtbuf = null;
    let f = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let p = null;
    let win = (game.windowprocs.win_create_nhwindow)(5);
    let use_dlb = (1);
    let done_rt = (0);
    let done_dlb = (0);
    let prolog = 0;
    /* lua_info[] moved to util/mdlib.c and rendered via do_runtime_info() */
    use_dlb = (0);
    /* instead of using ``display_file(OPTIONS_USED,TRUE)'' we handle
       the file manually so we can include dynamic version info */
    getversionstring(buf, 256 /* sizeof(char [256]) */);
    /* if extra text (git info) is present, put it on separate line
       but don't wrap on (x86) */
    /* Hand-port: C source wraps long banner at the last '(' if the
       previous char is ' ' and the next char isn't 'x' (Linux x86_64
       string format).  C truncates buf via `p[-1] = '\0'`, prints
       buf, then `*--p = ' '` restores the space and prints from that
       point.  JS strings are immutable — compute the wrap index in
       buf, print the prefix, print the " (..." suffix. */
    let __wrapIdx = -1;
    if (typeof buf === 'string' && buf.length >= 80) {
        const __parenIdx = buf.lastIndexOf('(');
        if (__parenIdx > 0 && buf.charCodeAt(__parenIdx - 1) === 32
            && (__parenIdx + 1 >= buf.length || buf.charCodeAt(__parenIdx + 1) !== 120)) {
            __wrapIdx = __parenIdx;
        }
    }
    const __bufPrefix = (__wrapIdx > 0) ? buf.slice(0, __wrapIdx - 1) : buf;
    (game.windowprocs.win_putstr)(win, 0, __bufPrefix);
    if (__wrapIdx > 0) {
        /* Print from the space char onwards (matches C's `*--p = ' '`
           and then putstr(p) — p now points at the restored space). */
        const __bufSuffix = buf.slice(__wrapIdx - 1);
        (game.windowprocs.win_putstr)(win, 0, __bufSuffix);
    }
    p = null;
    if (use_dlb) {
        f = fopen("options", "r");
        if (!f) {
            (game.windowprocs.win_putstr)(win, 0, "");
            buf = sprintf(buf, "[Configuration '%s' not available?]", "options");
            (game.windowprocs.win_putstr)(win, 0, buf);
            done_dlb = (1);
        }
    }
    /*
     * already inserted above:
     * + outdented program name and version plus build date and time
     * dat/options; display contents with lines prefixed by '-' deleted:
     * - blank-line
     * -     indented program name and version
     *   blank-line
     *   outdented feature header
     * - blank-line
     *       indented feature list
     *       spread over multiple lines
     *   blank-line
     *   outdented windowing header
     * - blank-line
     *       indented windowing choices with
     *       optional second line for default
     * - blank-line
     * - EOF
     */
    /* to skip indented program name */
    prolog = (1);
    for (; ; ) {
        if (use_dlb && !done_dlb) {
            if (!fgets(buf, 256, f)) {
                done_dlb = (1);
                continue;
            }
        } else if (!done_rt) {
            if (!(rtbuf = do_runtime_info({ get value() { return rtcontext; }, set value(_v) { rtcontext = _v; } }))) {
                done_rt = (1);
                continue;
            }
            buf = strncpy(buf, rtbuf, 256 - 1);
            buf[256 - 1] = 0;
        } else {
            break;
        }
        buf = strip_newline(buf);
        if (strchr(buf, 9) != null) {
            buf = tabexpand(buf);
        }
        if (buf && buf != 32) {
            (game.windowprocs.win_putstr)(win, 0, "");
            /* found outdented header; insert a separator since we'll
               have skipped corresponding blank line inside the file */
            prolog = (0);
        }
        /* skip blank lines and prolog (progame name plus version) */
        if (prolog || !buf) {
            continue;
        }
        if (strchr(buf, 58)) {
            insert_rtoption(buf);
        }
        if (buf) {
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
    }
    if (use_dlb) {
        fclose(f);
    }
    (game.windowprocs.win_display_nhwindow)(win, (0));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
export function early_version_info(pastebuf) {
    let buf1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let buf2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let buf = null;
    let tmp = null;
    nh_snprintf("early_version_info", 285, buf1, 256 /* sizeof(char [256]) */, "test");
    /* this is early enough that we have to do our own line-splitting */
    getversionstring(buf1, 256 /* sizeof(char [256]) */);
    /* split at start of version info */
    tmp = strstri(buf1, " (");
    if (tmp) {
        /* Hand-port: C `*p = '\0'` truncates buf1 at the " (" position
           so the snprintf below sees only the prefix.  JS strings are
           immutable; compute the truncated prefix via slice and pass
           it explicitly to snprintf instead. */
        const __buf1Idx = (typeof buf1 === 'string') ? buf1.indexOf(' (') : -1;
        const __buf1Prefix = (__buf1Idx >= 0) ? buf1.slice(0, __buf1Idx) : buf1;
        nh_snprintf("early_version_info", 292, buf2, 256 /* sizeof(char [256]) */, "%s\n%s", __buf1Prefix, tmp);
        buf = buf2;
    } else {
        buf = buf1;
    }
    raw_printf("%s", buf);
    if (pastebuf) {
        /*
         * Call a platform/port-specific routine to insert the
         * version information into a paste buffer. Useful for
         * easy inclusion in bug reports.
         */
        raw_printf("%s", "Paste buffer copy is not available.\n");
    }
}
/*
 * makedefs should put the first token into dat/options; we'll substitute
 * the second value for it.  The token must contain at least one colon
 * so that we can spot it, and should not contain spaces so that makedefs
 * won't split it across lines.  Ideally the length should be close to
 * that of the substituted value since we don't do phrase-splitting/line-
 * wrapping when displaying it.
 */
// struct rt_opt: { token, value }
game.rt_opts = [{ token: ":PATMATCH:", value: regex_id }, { token: ":LUAVERSION:", value: game.lua_ver }, { token: ":LUACOPYRIGHT:", value: game.lua_copyright }];
/*
 * 3.6.0
 * Some optional stuff is no longer available to makedefs because
 * it depends which of several object files got linked into the
 * game image, so we insert those options here.
 */
export function insert_rtoption(buf) {
    let i = 0;
    if (!game.lua_ver[0]) {
        get_lua_version();
    }
    for (i = 0; i < (Math.trunc(3 /* sizeof(struct rt_opt [3]) */ / 1 /* sizeof(struct rt_opt) */)); ++i) {
        /* we don't break out of the loop after a match; there might be
           other matches on the same line */
        if (strstri(buf, game.rt_opts[i].token) && game.rt_opts[i].value) {
            buf = strsubst(buf, game.rt_opts[i].token, game.rt_opts[i].value);
        }
    }
}
/* BUILD_TIME is constant but might have L suffix rather than UL;
       'filetime' is historically signed but ought to have been unsigned */
/* !SFCTOOL */
/* SFCTOOL */
export function check_version(version_data, filename, complain, utdflags) {
    if (!filename) {
        /* 'complain' requires 'filename' for pline("%s") */
        complain = (0);
    }
    if ((version_data.feature_set & (1 << 30)) != 0) {
        game.converted_savefile_loaded = (1);
        version_data.feature_set &= ~((1 << 30));
    }
    if (version_data.incarnation != game.nomakedefs.version_number) {
        if (complain) {
            pline("Version mismatch for file \"%s\".", filename);
            if (game.WIN_MESSAGE != (-1)) {
                (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
            }
        }
        return (0);
    } else if ((version_data.feature_set & ~game.nomakedefs.ignored_features) != (game.nomakedefs.version_features & ~game.nomakedefs.ignored_features) || ((utdflags & 4) == 0 && version_data.entity_count != game.nomakedefs.version_sanity1)) {
        if (complain) {
            pline("Configuration incompatibility for file \"%s\".", filename);
            (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
        }
        return (0);
    }
    return (1);
}
export function get_feature_notice_ver(str) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ver_maj = 0;
    let ver_min = 0;
    let patch = 0;
    let istr = [null, null, null];
    let j = 0;
    if (!str) {
        return 0;
    }
    str = strcpy(buf, str);
    istr[j] = str;
    while (str.value) {
        if (str.value == 46) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            j++;
            istr[j] = str;
            if (j == 2) {
                break;
            }
        } else if (strchr("0123456789", str.value) != null) {
            str++;
        } else {
            return 0;
        }
    }
    if (j != 2) {
        return 0;
    }
    ver_maj = atoi(istr[0]);
    ver_min = atoi(istr[1]);
    patch = atoi(istr[2]);
    return ((ver_maj << 24) | (ver_min << 16) | (patch << 8) | (0));
}
export function get_current_feature_ver() {
    return ((5 << 24) | (0 << 16) | (0 << 8) | (0));
}
/*ARGUSED*/
export function copyright_banner_line(indx) {
    if (indx == 1) {
        return "NetHack, Copyright 1985-2026";
    }
    if (indx == 2) {
        return "         By Stichting Mathematisch Centrum and M. Stephenson.";
    }
    if (indx == 3) {
        return game.nomakedefs.copyright_banner_c;
    }
    if (indx == 4) {
        return "         See license for details.";
    }
    return "";
}
/* called by argcheck(allmain.c) from early_options(sys/xxx/xxxmain.c) */
export function dump_version_info() {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let hname = game.hname ? game.hname : "nethack";
    if (strlen(hname) > 33) {
        hname = eos((hname)) - 33;
    }
    runtime_info_init();
    nh_snprintf("dump_version_info", 506, buf, 256 /* sizeof(char [256]) */, "%-12.33s %08lx %08lx %08lx", hname, game.nomakedefs.version_number, (game.nomakedefs.version_features & ~game.nomakedefs.ignored_features), game.nomakedefs.version_sanity1);
    (game.windowprocs.win_raw_print)(buf);
    release_runtime_info();
    return;
}
export function store_version(nhfp) {
    let version_data = { incarnation: 0, feature_set: 0, entity_count: 0 };
    version_data.incarnation = game.nomakedefs.version_number;
    /* bitmask of config settings */
    version_data.feature_set = game.nomakedefs.version_features;
    /* # of monsters and objects */
    version_data.entity_count = game.nomakedefs.version_sanity1;
    /* bwrite() before bufon() uses plain write() */
    if (nhfp.structlevel) {
        bufoff(nhfp.fd);
    }
    store_critical_bytes(nhfp);
    sfo_version_info(nhfp, version_data, "version_info");
    if (nhfp.structlevel) {
        bufon(nhfp.fd);
    }
    return;
}
/* !SFCTOOL */
/* MINIMAL_FOR_RECOVER */
// struct critical_sizes_with_names: { ucsize, nm }
game.critical_sizes = [{ ucsize: 0, nm: "unused" }, { ucsize: 2 /* sizeof(short) */, nm: "short" }, { ucsize: 4 /* sizeof(int) */, nm: "int" }, { ucsize: 8 /* sizeof(long) */, nm: "long" }, { ucsize: 8 /* sizeof(long long) */, nm: "long long" }, { ucsize: 1 /* sizeof(genericptr_t) */, nm: "genericptr_t" }, { ucsize: 1 /* sizeof(aligntyp) */, nm: "aligntyp" }, { ucsize: 1 /* sizeof(boolean) */, nm: "boolean" }, { ucsize: 1 /* sizeof(coordxy) */, nm: "coordxy" }, { ucsize: 1 /* sizeof(int16) */, nm: "int16" }, { ucsize: 1 /* sizeof(int32) */, nm: "int32" }, { ucsize: 1 /* sizeof(int64) */, nm: "int64" }, { ucsize: 1 /* sizeof(schar) */, nm: "schar" }, { ucsize: 8 /* sizeof(size_t) */, nm: "size_t" }, { ucsize: 1 /* sizeof(uchar) */, nm: "uchar" }, { ucsize: 1 /* sizeof(uint16) */, nm: "uint16" }, { ucsize: 1 /* sizeof(uint32) */, nm: "uint32" }, { ucsize: 1 /* sizeof(uint64) */, nm: "uint64" }, { ucsize: 1 /* sizeof(ulong) */, nm: "ulong" }, { ucsize: 4 /* sizeof(unsigned int) */, nm: "unsigned" }, { ucsize: 1 /* sizeof(ushort) */, nm: "ushort" }, { ucsize: 1 /* sizeof(xint16) */, nm: "xint16" }, { ucsize: 1 /* sizeof(xint8) */, nm: "xint8" }, { ucsize: 1 /* sizeof(struct arti_info) */, nm: "struct arti_info" }, { ucsize: 1 /* sizeof(struct nhrect) */, nm: "struct nhrect" }, { ucsize: 1 /* sizeof(struct branch) */, nm: "struct branch" }, { ucsize: 1 /* sizeof(struct bubble) */, nm: "struct bubble" }, { ucsize: 1 /* sizeof(struct cemetery) */, nm: "struct cemetery" }, { ucsize: 1 /* sizeof(struct context_info) */, nm: "struct context_info" }, { ucsize: 1 /* sizeof(struct nhcoord) */, nm: "struct nhcoord" }, { ucsize: 1 /* sizeof(struct damage) */, nm: "struct damage" }, { ucsize: 1 /* sizeof(struct dest_area) */, nm: "struct dest_area" }, { ucsize: 1 /* sizeof(struct dgn_topology) */, nm: "struct dgn_topology" }, { ucsize: 1 /* sizeof(struct dungeon) */, nm: "struct dungeon" }, { ucsize: 1 /* sizeof(struct d_level) */, nm: "struct d_level" }, { ucsize: 1 /* sizeof(struct ebones) */, nm: "struct ebones" }, { ucsize: 1 /* sizeof(struct edog) */, nm: "struct edog" }, { ucsize: 1 /* sizeof(struct egd) */, nm: "struct egd" }, { ucsize: 1 /* sizeof(struct emin) */, nm: "struct emin" }, { ucsize: 1 /* sizeof(struct engr) */, nm: "struct engr" }, { ucsize: 1 /* sizeof(struct epri) */, nm: "struct epri" }, { ucsize: 1 /* sizeof(struct eshk) */, nm: "struct eshk" }, { ucsize: 1 /* sizeof(struct fe) */, nm: "struct fe" }, { ucsize: 1 /* sizeof(struct flag) */, nm: "struct flag" }, { ucsize: 1 /* sizeof(struct fruit) */, nm: "struct fruit" }, { ucsize: 1 /* sizeof(struct gamelog_line) */, nm: "struct gamelog_line" }, { ucsize: 1 /* sizeof(struct kinfo) */, nm: "struct kinfo" }, { ucsize: 1 /* sizeof(struct levelflags) */, nm: "struct levelflags" }, { ucsize: 1 /* sizeof(struct ls_t) */, nm: "struct ls_t" }, { ucsize: 1 /* sizeof(struct linfo) */, nm: "struct linfo" }, { ucsize: 1 /* sizeof(struct mapseen_feat) */, nm: "struct mapseen_feat" }, { ucsize: 1 /* sizeof(struct mapseen_flags) */, nm: "struct mapseen_flags" }, { ucsize: 1 /* sizeof(struct mapseen_rooms) */, nm: "struct mapseen_rooms" }, { ucsize: 1 /* sizeof(struct mextra) */, nm: "struct mextra" }, { ucsize: 1 /* sizeof(struct mkroom) */, nm: "struct mkroom" }, { ucsize: 1 /* sizeof(struct monst) */, nm: "struct monst" }, { ucsize: 1 /* sizeof(struct mvitals) */, nm: "struct mvitals" }, { ucsize: 1 /* sizeof(struct obj) */, nm: "struct obj" }, { ucsize: 1 /* sizeof(struct objclass) */, nm: "struct objclass" }, { ucsize: 1 /* sizeof(struct oextra) */, nm: "struct oextra" }, { ucsize: 1 /* sizeof(struct q_score) */, nm: "struct q_score" }, { ucsize: 1 /* sizeof(struct rm) */, nm: "struct rm" }, { ucsize: 1 /* sizeof(struct spell) */, nm: "struct spell" }, { ucsize: 1 /* sizeof(struct stairway) */, nm: "struct stairway" }, { ucsize: 1 /* sizeof(struct s_level) */, nm: "struct s_level" }, { ucsize: 1 /* sizeof(struct trap) */, nm: "struct trap" }, { ucsize: 1 /* sizeof(struct version_info) */, nm: "struct version_info" }, { ucsize: 1 /* sizeof(anything) */, nm: "anything" }, { ucsize: ((1 /* sizeof(struct you) */ & 255)), nm: "you_LO" }, { ucsize: ((1 /* sizeof(struct you) */ & 65280) >> 8), nm: "you_HI" }, { ucsize: 0, nm: "" }, { ucsize: 0, nm: "" }, { ucsize: 0, nm: "" }, { ucsize: 0, nm: "" }, { ucsize: 0, nm: "" }, { ucsize: 0, nm: "" }, { ucsize: 0, nm: "" }, { ucsize: 0, nm: "" }, { ucsize: 0, nm: "" }, { ucsize: 0, nm: "" }];
/* simple types, that don't have subfields */
/* complex - they break down into one or more simple types */
/* struct you requires 2 bytes */
/*
     * the ones below are substructures of the ones
     * above, so there is no need to check these directly.
     */
/* SF_INCLUDE_SUBSTRUCTS */
/* 10 for future expansion without changing array size */
game.cscbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function get_critical_size_count() {
    return (Math.trunc(80 /* sizeof(struct critical_sizes_with_names [80]) */ / 1 /* sizeof(struct critical_sizes_with_names) */));
}
export function store_critical_bytes(nhfp) {
    let i = 0;
    let cnt = 0;
    let indicate = 117;
    let csc_count = (Math.trunc(80 /* sizeof(struct critical_sizes_with_names [80]) */ / 1 /* sizeof(struct critical_sizes_with_names) */));
    if (nhfp.mode & 2) {
        indicate = (nhfp.structlevel) ? 104 : (nhfp.fnidx == exportascii) ? 97 : 63;
        sfo_char(nhfp, { get value() { return indicate; }, set value(_v) { indicate = _v; } }, "indicate-format", 1);
        sfo_char(nhfp, { get value() { return csc_count; }, set value(_v) { csc_count = _v; } }, "count-critical_sizes", 1);
        cnt = csc_count;
        for (i = 0; i < cnt; ++i) {
            sfo_uchar(nhfp, { get value() { return game.critical_sizes[i].ucsize; }, set value(_v) { game.critical_sizes[i].ucsize = _v; } }, "critical_sizes");
        }
    }
}
/* this used to be based on file date and somewhat OS-dependent,
 *  but now examines the initial part of the file's contents.
 *
 * returns:
 *
 *   SF_UPTODATE                     (0) everything matched and looks good
 *   SF_OUTDATED                     (1) savefile is outdated
 *   SF_CRITICAL_BYTE_COUNT_MISMATCH (2) critical size count mismatch
 *   SF_DM_IL32LLP64_ON_ILP32LL64    (3) Windows x64 savefile on x86
 *   SF_DM_I32LP64_ON_ILP32LL64      (4) Unix 64 savefile on x86
 *   SF_DM_ILP32LL64_ON_I32LP64      (5) x86 savefile on Unix 64
 *   SF_DM_ILP32LL64_ON_IL32LLP64    (6) x86 savefile on Windows x64
 *   SF_DM_I32LP64_ON_IL32LLP64      (7) Unix 64 savefile on Windows x64
 *   SF_DM_IL32LLP64_ON_I32LP64      (8) Windows x64 savefile on Unix 64
 *   SF_DM_MISMATCH                  (9) some other mismatch
 */
export function uptodate(nhfp, name, utdflags) {
    let vers_info = { incarnation: 0, feature_set: 0, entity_count: 0 };
    let indicator = 0;
    let sfstatus = 0;
    let idx_1st_mismatch = 0;
    let quietly = (utdflags & 32) != 0;
    let verbose = name ? (1) : (0);
    sfi_char(nhfp, { get value() { return indicator; }, set value(_v) { indicator = _v; } }, "indicate-format", 1);
    if ((sfstatus = compare_critical_bytes(nhfp, { get value() { return idx_1st_mismatch; }, set value(_v) { idx_1st_mismatch = _v; } }, utdflags)) != 0) {
        if (sfstatus > 0 && idx_1st_mismatch) {
            if (!quietly) {
                raw_printf("comparison of critical bytes mismatched at %d (%s).", game.critical_sizes[idx_1st_mismatch].ucsize, game.critical_sizes[idx_1st_mismatch].nm);
            }
        }
    }
    sfi_version_info(nhfp, vers_info, "version_info");
    if (!check_version(vers_info, name, verbose, utdflags)) {
        if (verbose) {
            if ((utdflags & 16) == 0) {
                (game.windowprocs.win_wait_synch)();
            }
        }
        return 1;
    }
    return sfstatus;
}
/*
 * returns:
 *
 *   SF_UPTODATE                     (0) everything matched and looks good
 *   SF_OUTDATED                     (1) savefile is outdated
 *   SF_CRITICAL_BYTE_COUNT_MISMATCH (2) critical size count mismatch
 *   SF_DM_IL32LLP64_ON_ILP32LL64    (3) Windows x64 savefile on x86
 *   SF_DM_I32LP64_ON_ILP32LL64      (4) Unix 64 savefile on x86
 *   SF_DM_ILP32LL64_ON_I32LP64      (5) x86 savefile on Unix 64
 *   SF_DM_ILP32LL64_ON_IL32LLP64    (6) x86 savefile on Windows x64
 *   SF_DM_I32LP64_ON_IL32LLP64      (7) Unix 64 savefile on Windows x64
 *   SF_DM_IL32LLP64_ON_I32LP64      (8) Windows x64 savefile on Unix 64
 *   SF_DM_MISMATCH                  (9) some other mismatch
 */
export function compare_critical_bytes(nhfp, idx_1st_mismatch, utdflags) {
    let active_csc_count = (Math.trunc(80 /* sizeof(struct critical_sizes_with_names [80]) */ / 1 /* sizeof(struct critical_sizes_with_names) */));
    let file_csc_count = 0;
    let i = 0;
    let cnt = active_csc_count;
    let dmmismatch = 9;
    let quietly = (utdflags & 32) != 0;
    sfi_char(nhfp, { get value() { return file_csc_count; }, set value(_v) { file_csc_count = _v; } }, "count-critical_sizes", 1);
    if (file_csc_count > cnt) {
        if (!quietly) {
            raw_printf("critical byte counts do not match, file:%d, critical_sizes:%d.", file_csc_count, (Math.trunc(80 /* sizeof(struct critical_sizes_with_names [80]) */ / 1 /* sizeof(struct critical_sizes_with_names) */)));
        }
        return 2;
    }
    for (i = 0; i < file_csc_count; ++i) {
        sfi_uchar(nhfp, game.cscbuf[i], "critical_sizes");
    }
    for (i = 1; i < cnt; ++i) {
        if (game.cscbuf[i] != game.critical_sizes[i].ucsize) {
            let dm = datamodel(0);
            let dmfile = null;
            dmfile = what_datamodel_is_this(0, game.cscbuf[1], game.cscbuf[2], game.cscbuf[3], game.cscbuf[4], game.cscbuf[5]);
            if (!strcmp(dmfile, "IL32LLP64") && !strcmp(dm, "ILP32LL64")) {
                /*  Windows x64 savefile on x86 */
                dmmismatch = 3;
            } else if (!strcmp(dmfile, "I32LP64") && !strcmp(dm, "ILP32LL64")) {
                dmmismatch = 4;
            } else if (!strcmp(dmfile, "ILP32LL64") && !strcmp(dm, "I32LP64")) {
                /*  x86 savefile on Unix 64 */
                dmmismatch = 5;
            } else if (!strcmp(dmfile, "ILP32LL64") && !strcmp(dm, "IL32LLP64")) {
                /* x86 savefile on Windows x64 */
                dmmismatch = 6;
            } else if (!strcmp(dmfile, "I32LP64") && !strcmp(dm, "IL32LLP64")) {
                /* Unix 64 savefile on Windows x64 */
                dmmismatch = 7;
            } else if (!strcmp(dmfile, "IL32LLP64") && !strcmp(dm, "I32LP64")) {
                /* Windows x64 savefile on Unix 64 */
                dmmismatch = 8;
            }
            if (idx_1st_mismatch) {
                idx_1st_mismatch.value = i;
            }
            return dmmismatch;
        }
    }
    return 0;
}
/*
 * returns:
 *
 *   SF_UPTODATE                     (0) everything matched and looks good
 *   SF_OUTDATED                     (1) savefile is outdated
 *   SF_CRITICAL_BYTE_COUNT_MISMATCH (2) critical size count mismatch
 *   SF_DM_IL32LLP64_ON_ILP32LL64    (3) Windows x64 savefile on x86
 *   SF_DM_I32LP64_ON_ILP32LL64      (4) Unix 64 savefile on x86
 *   SF_DM_ILP32LL64_ON_I32LP64      (5) x86 savefile on Unix 64
 *   SF_DM_ILP32LL64_ON_IL32LLP64    (6) x86 savefile on Windows x64
 *   SF_DM_I32LP64_ON_IL32LLP64      (7) Unix 64 savefile on Windows x64
 *   SF_DM_IL32LLP64_ON_I32LP64      (8) Windows x64 savefile on Unix 64
 *   SF_DM_MISMATCH                  (9) some other mismatch
 */
export function validate(nhfp, name, without_waitsynch_perfile) {
    let utdflags = 0;
    let validsf = 0;
    if (nhfp.structlevel) {
        utdflags |= 1;
    }
    if (without_waitsynch_perfile) {
        utdflags |= 16;
    }
    if (nhfp.fieldlevel) {
        utdflags |= 2 | 4;
    }
    validsf = uptodate(nhfp, name, utdflags);
    return validsf;
}
/* MINIMAL_FOR_RECOVER */
/*version.c*/
