/* NetHack 5.0	rumors.c	$NHDT-Date: 1594370241 2020/07/10 08:37:21 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.56 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
/*      [Note:  this comment is fairly old, but still accurate for 3.1;
 *       it's no longer accurate for 5.0 but may still be of interest.]
 * Rumors have been entirely rewritten to speed up the access.  This is
 * essential when working from floppies.  Using fseek() the way that's done
 * here means rumors following longer rumors are output more often than those
 * following shorter rumors.  Also, you may see the same rumor more than once
 * in a particular game (although the odds are highly against it), but
 * this also happens with real fortune cookies.  -dgk
 */
/*      3.6
 * The rumors file consists of a "do not edit" line, then a line containing
 * three sets of three counts (first two in decimal, third in hexadecimal).
 * The first set has the number of true rumors, the count in bytes for all
 * true rumors, and the file offset to the first one.  The second set has
 * the same group of numbers for the false rumors.  The third set has 0 for
 * count, 0 for size, and the file offset for end-of-file.  The offset of
 * the first true rumor plus the size of the true rumors matches the offset
 * of the first false rumor.  Likewise, the offset of the first false rumor
 * plus the size of the false rumors matches the offset for end-of-file.
 */
/*      3.1     [now obsolete for rumors but still accurate for oracles]
 * The rumors file consists of a "do not edit" line, a hexadecimal number
 * giving the number of bytes of useful/true rumors, followed by those
 * true rumors (one per line), followed by the useless/false/misleading/cute
 * rumors (also one per line).  Number of bytes of untrue rumors is derived
 * via fseek(EOF)+ftell().
 *
 * The oracles file consists of a "do not edit" comment, a decimal count N
 * and set of N+1 hexadecimal fseek offsets, followed by N multiple-line
 * records, separated by "---" lines.  The first oracle is a special case,
 * and placed there by 'makedefs'.
 */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, pline, verbalize } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, nh_strchr_truncate, strchr, strcmp, strcpy, strlen, strncmp, xcrypt } from '../c2js-runtime/string.js';
import { getrumor as __runtime_getrumor } from '../c2js-runtime/rumors.js';
import { exercise } from './attrib.js';
import { yn_function } from './cmd.js';
import { ynchars, ynqchars } from './decl.js';
import { Monnam, bogon_codes, bogon_is_pname } from './do_name.js';
import { is_fainted } from './eat.js';
import { more_experienced, newexplevel } from './exper.js';
import { money_cnt } from './hack.js';
import { eos, lowc } from './hacklib.js';
import { record_achievement } from './insight.js';
import { currency } from './invent.js';
import { ACH_ORCL, A_WIS, BLINDED, LOW_PM, MALE, NUMMONS, NUM_MGENDERS } from './nh-constants.js';
import { the_unique_pm } from './objnam.js';
import { There, nhassert_failed } from './pline.js';
import { rn2, rnd } from './rnd.js';
import { sfi_ulong, sfi_unsigned, sfo_ulong, sfo_unsigned } from './sfbase.js';
import { money2mon } from './shk.js';

/* used by CapitalMon(); set up by init_CapMons(), released by free_CapMons();
   there's no need for these to be put into 'struct instance_globals g' */
game.CapMonstCnt = 0;
game.CapBogonCnt = 0;
game.CapMonSiz = 0;
/* CapMonstCnt+CapBogonCnt+1 when non-zero */
const CapMons = null;
/* list of bogusmons prefixes used to indicate special monster type such as
   unique or always a particular gender; see dat/bogusmon.txt */
/* from do_name.c */
/* makedefs pads short rumors, epitaphs, engravings, and hallucinatory
   monster names with trailing underscores; strip those off */
export function unpadline(line) {
    let p = eos(line);
    /* remove newline if still present; caller should have stripped it */
    if (p > line && __nh_char_at0(__nh_advance_str(p, -1)) == 10) {
        (p = __nh_advance_str(p, -1));
    }
    while (p > line && __nh_char_at0(__nh_advance_str(p, -1)) == 95) {
        (p = __nh_advance_str(p, -1));
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
}
const __init_rumors_rumors_header = "%d,%ld,%lx;%d,%ld,%lx;0,0,%lx\n";
export function init_rumors(fp) {
    /* in file but not used here */
    let true_count = 0;
    let false_count = 0;
    let eof_offset = 0;
    let line = '';
    /* skip "don't edit" comment */
    /* this assumes we're only called once */
    /* skip "don't edit" comment*/
    fgets(line, 256 /* sizeof(char [256]) */, fp);
    fgets(line, 256 /* sizeof(char [256]) */, fp);
    if (sscanf(line, __init_rumors_rumors_header, true_count, game.true_rumor_size, game.true_rumor_start, false_count, game.false_rumor_size, game.false_rumor_start, eof_offset) == 7 && game.true_rumor_size > 0 && game.false_rumor_size > 0) {
        game.true_rumor_end = game.true_rumor_start + game.true_rumor_size;
        /* assert( gt.true_rumor_end == false_rumor_start ); */
        /* assert( gf.false_rumor_end == eof_offset ); */
        game.false_rumor_end = game.false_rumor_start + game.false_rumor_size;
    } else {
        /* don't try to open it again */
        game.true_rumor_size = -1;
        fclose(fp);
    }
}
/* exclude_cookie is a hack used because we sometimes want to get rumors in a
 * context where messages such as "You swallowed the fortune!" that refer to
 * cookies should not appear.  This has no effect for true rumors since none
 * of them contain such references anyway.
 */
/* 1=true, -1=false, 0=either */
const __getrumor_cookie_marker = "[cookie] ";
export async function getrumor(truth, rumor_buf, exclude_cookie) {
    return __runtime_getrumor(truth, rumor_buf, exclude_cookie);
}
/* test that the true/false rumor boundaries are valid and show the first
   two and very last epitaphs, engravings, and bogus monsters */
export async function rumor_check() {
    let rumors = null;
    let tmpwin = (-1);
    let endp = null;
    let line = '';
    let xbuf = '';
    let rumor_buf = '';
    rumors = (game.true_rumor_size >= 0) ? fopen("rumors", "r") : null;
    if (rumors) {
        let ftell_rumor_start = 0;
        /*
         * check the first rumor (start of true rumors) by
         * skipping the first two lines.
         *
         * Then seek to the start of the false rumors (based on
         * the value read in rumors, and display it.
         */
        rumor_buf = '';
        if (game.true_rumor_size == 0) {
            init_rumors(rumors);
            if (game.true_rumor_size < 0) {
                /* init_rumors() closes it upon failure */
                rumors = null;
                /* TODO Phase 5+: goto no_rumors (label not in scope of break) */
            }
        }
        tmpwin = (game.windowprocs.win_create_nhwindow)(5);
        rumor_buf = sprintf(rumor_buf, "T start=%06ld (%06lx), end=%06ld (%06lx), size=%06ld (%06lx)", game.true_rumor_start, game.true_rumor_start, game.true_rumor_end, game.true_rumor_end, game.true_rumor_size, game.true_rumor_size);
        (game.windowprocs.win_putstr)(tmpwin, 0, rumor_buf);
        rumor_buf = sprintf(rumor_buf, "F start=%06ld (%06lx), end=%06ld (%06lx), size=%06ld (%06lx)", game.false_rumor_start, game.false_rumor_start, game.false_rumor_end, game.false_rumor_end, game.false_rumor_size, game.false_rumor_size);
        (game.windowprocs.win_putstr)(tmpwin, 0, rumor_buf);
        rumor_buf = '';
        fseek(rumors, game.true_rumor_start, 0);
        ftell_rumor_start = ftell(rumors);
        fgets(line, 256 /* sizeof(char [256]) */, rumors);
        if ((endp = strchr(line, 10)) != null) {
            line = nh_strchr_truncate(line, 10, 'chr');
        }
        rumor_buf = sprintf(rumor_buf, "T %06ld %s", ftell_rumor_start, xcrypt(line, xbuf));
        (game.windowprocs.win_putstr)(tmpwin, 0, rumor_buf);
        while (fgets(line, 256 /* sizeof(char [256]) */, rumors) && ftell(rumors) < game.true_rumor_end) {
            continue;
        }
        if ((endp = strchr(line, 10)) != null) {
            line = nh_strchr_truncate(line, 10, 'chr');
        }
        rumor_buf = sprintf(rumor_buf, "  %6s %s", "", xcrypt(line, xbuf));
        (game.windowprocs.win_putstr)(tmpwin, 0, rumor_buf);
        rumor_buf = '';
        fseek(rumors, game.false_rumor_start, 0);
        ftell_rumor_start = ftell(rumors);
        fgets(line, 256 /* sizeof(char [256]) */, rumors);
        if ((endp = strchr(line, 10)) != null) {
            line = nh_strchr_truncate(line, 10, 'chr');
        }
        rumor_buf = sprintf(rumor_buf, "F %06ld %s", ftell_rumor_start, xcrypt(line, xbuf));
        (game.windowprocs.win_putstr)(tmpwin, 0, rumor_buf);
        while (fgets(line, 256 /* sizeof(char [256]) */, rumors) && ftell(rumors) < game.false_rumor_end) {
            continue;
        }
        if ((endp = strchr(line, 10)) != null) {
            line = nh_strchr_truncate(line, 10, 'chr');
        }
        rumor_buf = sprintf(rumor_buf, "  %6s %s", "", xcrypt(line, xbuf));
        (game.windowprocs.win_putstr)(tmpwin, 0, rumor_buf);
        /* if a previous attempt couldn't open file or rejected its contents,
       we didn't bother trying again this time */
        fclose(rumors);
    }
    if (__rumors_failed || (!rumors && game.true_rumor_size < 0)) {
        await pline("rumors not accessible.");
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
    } else if (!rumors && !__rumors_failed) {
        await couldnt_open_file("rumors");
        game.true_rumor_size = -1;
    }
    await others_check("Engravings:", "engrave", { get value() { return tmpwin; }, set value(_v) { tmpwin = _v; } });
    await others_check("Epitaphs:", "epitaph", { get value() { return tmpwin; }, set value(_v) { tmpwin = _v; } });
    await others_check("Bogus monsters:", "bogusmon", { get value() { return tmpwin; }, set value(_v) { tmpwin = _v; } });
    if (tmpwin != (-1)) {
        await (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    }
}
/* 5.0: augments rumors_check(); test 'engrave' or 'epitaph' or 'bogusmon' */
/* header: "{Engravings|Epitaphs|Bogus monsters}:" */
/* filename: {ENGRAVEFILE|EPITAPHFILE|BOGUSMONFILE} */
/* text window for output; created here if necessary */
const __others_check_errfmt = "others_check(\"%s\"): %s";
export async function others_check(ftype, fname, winptr) {
    let fh = null;
    let line = '';
    let xbuf = '';
    let endp = null;
    let tmpwin = winptr.value;
    let entrycount = 0;
    fh = fopen(fname, "r");
    if (fh) {
        closeit: {
            if (tmpwin == (-1)) {
                winptr.value = tmpwin = (game.windowprocs.win_create_nhwindow)(5);
                if (tmpwin == (-1)) {
                    await impossible(__others_check_errfmt, fname, "can't create temporary window");
                    break closeit;
                }
            }
            (game.windowprocs.win_putstr)(tmpwin, 0, "");
            (game.windowprocs.win_putstr)(tmpwin, 0, ftype);
            /* first line; should be default one inserted by makedefs when
           building the file but we don't have the expected value so
           can only require a line to exist */
            line = '';
            if (!fgets(line, 256 /* sizeof(char [256]) */, fh)) {
                xbuf = sprintf(xbuf, __others_check_errfmt, fname, "error; can't read comment line");
                (game.windowprocs.win_putstr)(tmpwin, 0, xbuf);
                break closeit;
            }
            if (line != 35) {
                xbuf = sprintf(xbuf, __others_check_errfmt, fname, "malformed; first line is not a comment line:");
                (game.windowprocs.win_putstr)(tmpwin, 0, xbuf);
                /* show the bad line; we don't know whether it has been
               encrypted via xcrypt() so show it both ways */
                if ((endp = strchr(line, 10)) != null) {
                    line = nh_strchr_truncate(line, 10, 'chr');
                }
                (game.windowprocs.win_putstr)(tmpwin, 0, "- first line, as is");
                (game.windowprocs.win_putstr)(tmpwin, 0, line);
                (game.windowprocs.win_putstr)(tmpwin, 0, "- xcrypt of first line");
                (game.windowprocs.win_putstr)(tmpwin, 0, xcrypt(line, xbuf));
                break closeit;
            }
            line = '';
            if (!fgets(line, 256 /* sizeof(char [256]) */, fh) || line == 10) {
                xbuf = sprintf(xbuf, __others_check_errfmt, fname, !line ? "can't read first non-comment line" : "first non-comment line is empty");
                (game.windowprocs.win_putstr)(tmpwin, 0, xbuf);
                break closeit;
            }
            ++entrycount;
            if ((endp = strchr(line, 10)) != null) {
                line = nh_strchr_truncate(line, 10, 'chr');
            }
            (game.windowprocs.win_putstr)(tmpwin, 0, xcrypt(line, xbuf));
            if (!fgets(line, 256 /* sizeof(char [256]) */, fh)) {
                (game.windowprocs.win_putstr)(tmpwin, 0, "(no second entry)");
            } else {
                ++entrycount;
                if ((endp = strchr(line, 10)) != null) {
                    line = nh_strchr_truncate(line, 10, 'chr');
                }
                (game.windowprocs.win_putstr)(tmpwin, 0, xcrypt(line, xbuf));
                while (fgets(line, 256 /* sizeof(char [256]) */, fh)) {
                    ++entrycount;
                    if ((endp = strchr(line, 10)) != null) {
                        line = nh_strchr_truncate(line, 10, 'chr');
                    }
                    line = xcrypt(line, xbuf);
                }
                /* count will be 2 if the default entry and the first ordinary
               entry are the only ones present (if either of those were
               missing, we wouldn't have gotten here...) */
                if (entrycount == 2) {
                    (game.windowprocs.win_putstr)(tmpwin, 0, "(only two entries)");
                } else {
                    /* showing an ellipsis avoids ambiguity about whether
                   there are other lines; doing so three times (once for
                   each file) results in total output being 24 lines,
                   forcing a --More-- prompt if using a 24 line screen;
                   displaying 23 lines and --More-- followed by second
                   page with 1 line doesn't look very good but isn't
                   incorrect, and taller screens where that won't be an
                   issue are more common than 24 line terminals nowadays */
                    if (entrycount > 3) {
                        (game.windowprocs.win_putstr)(tmpwin, 0, " ...");
                    }
                    (game.windowprocs.win_putstr)(tmpwin, 0, xbuf);
                }
            }
        }
        fclose(fh);
    } else {
        await couldnt_open_file(fname);
    }
}
/* load one randomly chosen line from a section of a file; undoes
   decryption and strips trailing underscore padding and final newline;
   if padlength is non-zero, every line is expected to be at least that
   long and every line in the file will have an equal chance of being
   chosen; however, if padlength is 0, lines following long lines are
   more likely than average to be picked, and lines after short lines
   are less likely */
/* already opened file */
/* output buffer */
/* (unsigned) sizeof buf */
/* random number routine; rn2(N) or similar, 0..N-1 */
/* location in file of first line of interest */
/* location one byte past last line of interest;
                         * if 0, end-of-file will be used */
/* expected line length; 0 if no expectations */
export async function get_rnd_line(fh, buf, bufsiz, rng, startpos, endpos, padlength) {
    let newl = null;
    let xbufp = null;
    let xbuf = '';
    let filechunksize = 0;
    let chunkoffset = 0;
    let trylimit = 0;
    buf.value = 0;
    if (!endpos) {
        fseek(fh, 0, 2);
        endpos = ftell(fh);
    }
    filechunksize = endpos - startpos;
    /* might be zero (only if file is empty); should complain in that
       case but it could happen over and over, also the suggestion
       that save and restore might fix the problem wouldn't be useful */
    if (filechunksize < 1) {
        return buf;
    }
    ((!!(filechunksize <= 2147483647)) || (await nhassert_failed("filechunksize <= INT_MAX", "/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/rumors.c", 449) , 0));
    for (trylimit = 10; trylimit > 0; --trylimit) {
        /* 'rumors' is about 3/4 of the way to the limit on a 16-bit config
       for the whole, roughly 3/8 of the way for either half; all active
       configurations these days are at least 32-bits anyway */
        /*
     * Position randomly which will probably be in the middle of a line.
     * (Occasionally by chance it will happen to be at the very start of
     * a line, but we'll have no way of knowing that so have to behave
     * as if it were positioned in the middle.)
     * Read the rest of that line, then use the next one.  If there's no
     * next line (ie, end of file), go back to beginning and use first.
     *
     * When short lines have been padded to length N, only accept long
     * lines if we land within last N+1 characters (+1 is for newline
     * which hasn't been stripped away yet), effectively shortening
     * them to normal length.  That yields even selection distribution.
     */
        chunkoffset = (rng)(filechunksize);
        fseek(fh, startpos + chunkoffset, 0);
        fgets(buf, bufsiz, fh);
        /* if padlength is 0, accept any position; when non-zero,
           padlength does not count the newline but strlen(buf) does */
        if (!padlength || strlen(buf) <= padlength + 1) {
            break;
        }
    }
    if (ftell(fh) >= endpos || !fgets(buf, bufsiz, fh)) {
        /* use next line; for rumors, caller takes care of whether startpos
       and endpos cover just true rumors or just false rumors; reaching
       endpos is equivalent to end-of-file in order to avoid using the
       first false rumor if fseek for a true one lands within the last one */
        /* assume failure is due to end-of-file; go back to start */
        fseek(fh, startpos, 0);
        fgets(buf, bufsiz, fh);
    }
    if ((newl = strchr(buf, 10)) != null) {
        buf = nh_strchr_truncate(buf, 10, 'chr');
    }
    /* decrypt line; make sure that our intermediate buffer is big enough */
    xbufp = (strlen(buf) <= 256 /* sizeof(char [256]) */ - 1) ? __nh_char_at0(xbuf) : alloc(strlen(buf) + 1);
    buf = strcpy(buf, xcrypt(buf, xbufp));
    if (xbufp != __nh_char_at0(xbuf)) {
        free(xbufp);
    }
    /* strip padding that makedefs adds to short lines */
    if (padlength) {
        unpadline(buf);
    }
    return buf;
}
/* Gets a random line of text from file 'fname', and returns it.
   rng is the random number generator to use, and should act like rn2 does. */
export async function get_rnd_text(fname, buf, rng, padlength) {
    let fh = fopen(fname, "r");
    buf = __nh_char_write(buf, 0, 0);
    if (fh) {
        let starttxt = 0;
        let line = '';
        fgets(line, 256 /* sizeof(char [256]) */, fh);
        /* obtain current file position */
        fseek(fh, 0, 1);
        starttxt = ftell(fh);
        buf = strcpy(buf, await get_rnd_line(fh, line, 256 /* sizeof(char [256]) */, rng, starttxt, 0, padlength));
        fclose(fh);
    } else {
        await couldnt_open_file(fname);
    }
    return buf;
}
/* 1=true, -1=false, 0=either */
const __outrumor_fortune_msg = "This cookie has a scrap of paper inside.";
export async function outrumor(truth, mechanism) {
    let line = null;
    let buf = '';
    let reading = (mechanism == 1 || mechanism == 2);
    if (reading) {
        if (is_fainted() && mechanism == 1) {
            /* deal with various things that prevent reading */
            /* [WIS exercised by getrumor()] */
            return;
        } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            if (mechanism == 1) {
                await pline(__outrumor_fortune_msg);
            }
            await pline("What a pity that you cannot read it!");
            return;
        }
    }
    line = await getrumor(truth, buf, reading ? (0) : (1));
    if (!__nh_char_at0(line)) {
        line = "NetHack rumors file closed for renovation.";
    }
    switch (mechanism) {
        case 0:
            await pline("True to her word, the Oracle %ssays: ", (!rn2(4) ? "offhandedly " : (!rn2(3) ? "casually " : (rn2(2) ? "nonchalantly " : ""))));
            ;
            await verbalize("%s", line);
            return;
        case 1:
            await pline(__outrumor_fortune_msg);
            ;
        case 2:
            await pline("It reads:");
            break;
    }
    await pline("%s", line);
}
export function init_oracles(fp) {
    let i = 0;
    let line = '';
    let cnt = 0;
    fgets(line, 256 /* sizeof(char [256]) */, fp);
    fgets(line, 256 /* sizeof(char [256]) */, fp);
    if (sscanf(line, "%5d\n", cnt) == 1 && cnt > 0) {
        game.oracle_cnt = cnt;
        game.oracle_loc = alloc(cnt * 8 /* sizeof(long) */);
        for (i = 0; i < cnt; i++) {
            fgets(line, 256 /* sizeof(char [256]) */, fp);
            sscanf(line, "%5lx\n", game.oracle_loc[i]);
        }
    }
    return;
}
export function save_oracles(nhfp) {
    let i = 0;
    if (((nhfp).mode & (1 | 2))) {
        sfo_unsigned(nhfp, { get value() { return game.oracle_cnt; }, set value(_v) { game.oracle_cnt = _v; } }, "oracle-oracle_cnt");
        if (game.oracle_cnt) {
            for (i = 0; i < game.oracle_cnt; ++i) {
                sfo_ulong(nhfp, { get value() { return game.oracle_loc[i]; }, set value(_v) { game.oracle_loc[i] = _v; } }, "oracle-oracle_loc");
                ;
            }
        }
    }
    if (((nhfp).mode & 4)) {
        if (game.oracle_cnt) {
            game.oracle_cnt = 0 , game.oracle_flg = 0;
        }
        if (game.oracle_loc) {
            free(game.oracle_loc);
            game.oracle_loc = null;
        }
    }
}
/* !SFCTOOL */
export function restore_oracles(nhfp) {
    let i = 0;
    sfi_unsigned(nhfp, { get value() { return game.oracle_cnt; }, set value(_v) { game.oracle_cnt = _v; } }, "oracle-oracle_cnt");
    ;
    if (game.oracle_cnt) {
        game.oracle_loc = alloc(game.oracle_cnt * 8 /* sizeof(unsigned long) */);
        for (i = 0; i < game.oracle_cnt; ++i) {
            sfi_ulong(nhfp, { get value() { return game.oracle_loc[i]; }, set value(_v) { game.oracle_loc[i] = _v; } }, "oracle-oracle_loc");
            ;
        }
        /* no need to call init_oracles() */
        game.oracle_flg = 1;
    }
}
export async function outoracle(special, delphi) {
    let tmpwin = 0;
    let oracles = null;
    let oracle_idx = 0;
    let endp = null;
    let line = '';
    let xbuf = '';
    /* early return if we couldn't open ORACLEFILE on previous attempt,
       or if all the oracularities are already exhausted */
    if (game.oracle_flg < 0 || (game.oracle_flg > 0 && game.oracle_cnt == 0)) {
        return;
    }
    oracles = fopen("oracles", "r");
    if (oracles) {
        close_oracles: {
            if (game.oracle_flg == 0) {
                /* if this is the first outoracle() */
                init_oracles(oracles);
                game.oracle_flg = 1;
                if (game.oracle_cnt == 0) {
                    break close_oracles;
                }
            }
            /* oracle_loc[0] is the special oracle;
           oracle_loc[1..oracle_cnt-1] are normal ones */
            if (game.oracle_cnt <= 1 && !special) {
                break close_oracles;
            }
            oracle_idx = special ? 0 : rnd(game.oracle_cnt - 1);
            fseek(oracles, game.oracle_loc[oracle_idx], 0);
            /* move offset of very last one into this slot */
            if (!special) {
                game.oracle_loc[oracle_idx] = game.oracle_loc[--game.oracle_cnt];
            }
            tmpwin = (game.windowprocs.win_create_nhwindow)(5);
            if (delphi) {
                (game.windowprocs.win_putstr)(tmpwin, 0, special ? "The Oracle scornfully takes all your gold and says:" : "The Oracle meditates for a moment and then intones:");
            } else {
                (game.windowprocs.win_putstr)(tmpwin, 0, "The message reads:");
            }
            (game.windowprocs.win_putstr)(tmpwin, 0, "");
            while (fgets(line, 80, oracles) && strcmp(line, "---\n")) {
                if ((endp = strchr(line, 10)) != null) {
                    line = nh_strchr_truncate(line, 10, 'chr');
                }
                (game.windowprocs.win_putstr)(tmpwin, 0, xcrypt(line, xbuf));
            }
            await (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
            (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        }
        fclose(oracles);
    } else {
        await couldnt_open_file("oracles");
        game.oracle_flg = -1;
    }
}
export async function doconsult(oracl) {
    let umoney = 0;
    let u_pay = 0;
    let minor_cost = 50;
    let major_cost = 500 + 50 * game.u.ulevel;
    let add_xpts = 0;
    let qbuf = '';
    game.multi = 0;
    umoney = money_cnt(game.invent);
    if (!oracl) {
        await There("is no one here to consult.");
        return 0;
    } else if (!oracl.mpeaceful) {
        await pline("%s is in no mood for consultations.", await Monnam(oracl));
        return 0;
    } else if (!umoney) {
        await You("have no gold.");
        return 0;
    }
    qbuf = sprintf(qbuf, "\"Wilt thou settle for a minor consultation?\" (%d %s)", minor_cost, await currency(minor_cost));
    switch (await yn_function(qbuf, ynqchars, 113, (1))) {
        default:
        case 113:
            return 0;
        case 121:
            if (umoney < minor_cost) {
                await You("don't even have enough gold for that!");
                return 0;
            }
            u_pay = minor_cost;
            break;
        case 110:
            if (umoney <= minor_cost || (game.oracle_cnt == 1 || game.oracle_flg < 0)) {
                return 0;
            }
            qbuf = sprintf(qbuf, "\"Then dost thou desire a major one?\" (%d %s)", major_cost, await currency(major_cost));
            if (await yn_function(qbuf, ynchars, 110, (1)) != 121) {
                return 0;
            }
            u_pay = (umoney < major_cost) ? umoney : major_cost;
            break;
    }
    await money2mon(oracl, u_pay);
    game.disp.botl = (1);
    if (!game.u.uevent.major_oracle && !game.u.uevent.minor_oracle) {
        await record_achievement(ACH_ORCL);
    }
    /* first oracle of each type gives experience points */
    add_xpts = 0;
    if (u_pay == minor_cost) {
        await outrumor(1, 0);
        if (!game.u.uevent.minor_oracle) {
            add_xpts = Math.trunc(u_pay / ((game.u.uevent.major_oracle ? 25 : 10)));
        }
        /* 5 pts if very 1st, or 2 pts if major already done */
        game.u.uevent.minor_oracle = (1);
    } else {
        let cheapskate = u_pay < major_cost;
        await outoracle(cheapskate, (1));
        if (!cheapskate && !game.u.uevent.major_oracle) {
            add_xpts = Math.trunc(u_pay / ((game.u.uevent.minor_oracle ? 25 : 10)));
        }
        /* ~100 pts if very 1st, ~40 pts if minor already done */
        game.u.uevent.major_oracle = (1);
        await exercise(A_WIS, !cheapskate);
    }
    if (add_xpts) {
        await more_experienced(add_xpts, Math.trunc(u_pay / 50));
        await newexplevel();
    }
    return 1;
}
export async function couldnt_open_file(filename) {
    let save_something = game.program_state.something_worth_saving;
    /* most likely the file is missing, so suppress impossible()'s
       "saving and restoring might fix this" (unless the fuzzer,
       which escalates impossible to panic, is running) */
    if (!game.iflags.debug_fuzzer) {
        game.program_state.something_worth_saving = 0;
    }
    await impossible("Can't open '%s' file.", filename);
    game.program_state.something_worth_saving = save_something;
}
/* is 'word' a capitalized monster name that should be preceded by "the"?
   (non-unique monster like Mordor Orc, or capitalized title like Norn
   rather than a name); used by the() on a string without any context;
   this sets up a list of names rather than scan all of mons[] every time
   the decision is needed (resulting list currently contains 27 monster
   entries and 20 hallucination entries) */
/* potential monster name; a name might be followed by
                       * something like " corpse" */
export async function CapitalMon(word) {
    let nam = null;
    let i = 0;
    let wln = 0;
    let nln = 0;
    if (!word || !__nh_char_at0(word) || __nh_char_at0(word) == lowc(__nh_char_at0(word))) {
        return (0);
    }
    if (!CapMons) {
        await init_CapMons();
    }
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    wln = strlen(word);
    for (i = 0; i < game.CapMonSiz - 1; ++i) {
        nam = CapMons[i];
        nln = strlen(nam);
        if (wln < nln) {
            continue;
        }
        /*
         * Unlike name_to_mon(), we don't need to find the longest match
         * or return the gender or a pointer to trailing stuff.  We do
         * check full words though: "Foo" matches "Foo" and "Foo bar" and
         * "Foo's bar" but not "Foobar".  We use case-sensitive matching.
         */
        /* 'word' is a capitalized monster name */
        if (!strncmp(nam, word, nln) && (!__nh_char_at0(__nh_advance_str(word, nln)) || __nh_char_at0(__nh_advance_str(word, nln)) == 32 || __nh_char_at0(__nh_advance_str(word, nln)) == 39)) {
            return (1);
        }
    }
    return (0);
}
/* one-time initialization of CapMons[], a list of non-unique monsters
   having a capitalized type name like Green-elf or Archon, plus unique
   monsters whose "name" is a title rather than a personal name, plus
   hallucinatory monster names that fall into either of those categories */
export async function init_CapMons() {
    let pass = 0;
    let bogonfile = fopen("bogusmon", "r");
    if (CapMons) {
        free_CapMons();
    }
    for (pass = 1; pass <= 2; ++pass) {
        /* first pass: count the number of relevant monster names, then
       allocate memory for CapMons[]; second pass: populate CapMons[] */
        let mptr = null;
        let nam = null;
        let mndx = 0;
        let mgend = 0;
        /* the first CapMonstCnt entries come from mons[].pmnames[] and
           the next CapBogonCnt entries from the 'bogusmons' file;
           there is an extra entry for Null at the end, but that is only
           useful to force non-zero array size in case both mons[] and
           bogusmons get modified to have no applicable monster names */
        game.CapMonstCnt = game.CapBogonCnt = 0;
        for (mndx = LOW_PM; mndx < NUMMONS; ++mndx) {
            /* gather applicable actual monsters */
            mptr = game.mons[mndx];
            if ((mptr.geno & 4096) != 0 && !the_unique_pm(mptr)) {
                continue;
            }
            for (mgend = MALE; mgend < NUM_MGENDERS; ++mgend) {
                nam = mptr.pmnames[mgend];
                if (nam && __nh_char_at0(nam) != lowc(__nh_char_at0(nam))) {
                    if (pass == 2) {
                        CapMons[game.CapMonstCnt] = nam;
                    }
                    ++game.CapMonstCnt;
                }
            }
        }
        if (bogonfile) {
            /* now gather applicable hallucinatory monsters */
            let hline = '';
            let xbuf = '';
            let endp = null;
            let startp = null;
            let code = 0;
            /* rewind; effectively a no-op for pass 1; essential for pass 2 */
            fseek(bogonfile, 0, 0);
            /* skip "don't edit" comment (first line of file) */
            fgets(hline, 256 /* sizeof(char [256]) */, bogonfile);
            while (fgets(hline, 256 /* sizeof(char [256]) */, bogonfile)) {
                /* one monster name per line in rudimentary encrypted format;
               some are prefixed by a classification code to indicate
               gender and/or to distinguish an individual from a type
               (code is a single punctuation character when present) */
                if ((endp = strchr(hline, 10)) != null) {
                    hline = nh_strchr_truncate(hline, 10, 'chr');
                }
                hline = xcrypt(hline, xbuf);
                unpadline(xbuf);
                if (!__nh_char_at0(xbuf) || !strchr(bogon_codes, __nh_char_at0(xbuf))) {
                    code = 0 , startp = __nh_char_at0(xbuf);
                } else {
                    code = __nh_char_at0(xbuf) , startp = __nh_char_at0(__nh_advance_str(xbuf, 1));
                }
                if (__nh_char_at0(startp) != lowc(__nh_char_at0(startp)) && !bogon_is_pname(code)) {
                    if (pass == 2) {
                        CapMons[game.CapMonstCnt + game.CapBogonCnt] = dupstr(startp);
                    }
                    ++game.CapBogonCnt;
                }
            }
        }
        if (pass == 1) {
            game.CapMonSiz = game.CapMonstCnt + game.CapBogonCnt + 1;
            CapMons = alloc(game.CapMonSiz * 8 /* sizeof(const char *) */);
        } else {
            /* terminator; not strictly needed */
            CapMons[game.CapMonSiz - 1] = null;
            if (bogonfile) {
                fclose(bogonfile) , bogonfile = null;
            }
        }
    }
    if (game.flags.debug && debugcore("CapMons", (0))) {
        /*
     * CapMons[] init doesn't kick in until needed.  To force this name
     * dump, set DEBUGFILES to "CapMons" in your environment (or in
     * sysconf) prior to starting nethack, wish for a statue of an Archon
     * and drop it if held, then step away and apply a stethoscope towards
     * it to trigger a message that passes "Archon" to the() which will
     * then call CapitalMon() which in turn will call init_CapMons().
     */
        let buf = '';
        let i = 0;
        let tmpwin = (game.windowprocs.win_create_nhwindow)(5);
        (game.windowprocs.win_putstr)(tmpwin, 0, "Capitalized monster type names normally preceded by \"the\":");
        for (i = 0; i < game.CapMonSiz - 1; ++i) {
            buf = sprintf(buf, "  %.77s", CapMons[i]);
            (game.windowprocs.win_putstr)(tmpwin, 0, buf);
        }
        await (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    }
    return;
}
/* release memory allocated for the list of capitalized monster type names */
export function free_CapMons() {
    if (CapMons) {
        /* note: some elements of CapMons[] are string literals from
       mons[].pmnames[] and should not be freed, others are dynamically
       allocated copies of hallucinatory monster names and should be freed */
        let idx = 0;
        /* skip 0..MonstCnt-1, free MonstCnt..(MonstCnt+BogonCnt-1) */
        for (idx = game.CapMonstCnt; idx < game.CapMonSiz - 1; ++idx) {
            free(CapMons[idx]);
        }
        free(CapMons) , CapMons = null;
    }
    game.CapMonSiz = 0;
}
/* !SFCTOOL */
/*rumors.c*/
/* a previous try failed to open RUMORFILE */
/* if this is 1st outrumor() */
/*
             *  input:      1    0   -1
             *   rn2 \ +1  2=T  1=T  0=F
             *   adj./ +0  1=T  0=F -1=F
             */
/*(might let a bogus input arg sneak thru)*/
/* once here, 0 => false rather than "either"*/
/* avoid exercising wisdom for graffiti */
/* remove cookie_marker from the string */
/* terminator wasn't copied */
/* initial implementation of default epitaph/engraving/bogusmon
       contained an error; check those along with rumors */
/*
         * reveal the values.
         */
/* file could be opened but init_rumors() didn't like it */
/* engravings, epitaphs, and bogus monsters will still be shown,
           and in tmpwin rather than via additional pline() calls */
/* first attempt to open file has just failed */
/* should panic, but won't for wizard mode check operation */
/* since this comes out via impossible(), it won't be integrated
           with the text window of values, but it shouldn't ever happen
           so we won't waste effort integrating it */
/* get a randomly chosen line; it comes back decrypted and unpadded */
/* Oracle delivers the rumor */
/* 'word' is not a capitalized monster name */
