/* NetHack 5.0  date.c  $NHDT-Date: 1655402414 2022/06/16 18:00:14 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.3 $ */
/* Copyright (c) Michael Allison, 2021.                           */
/* NetHack may be freely redistributed.  See license for details. */
/* these are in extern.h but we don't include hack.h */
import { game } from '../gstate.js';
import { free } from '../c2js-runtime/memory.js';
import { nh_snprintf } from '../c2js-runtime/stdio.js';
import { strlen } from '../c2js-runtime/string.js';
import { case_insensitive_comp } from './hacklib.js';

/* nomakedefs_populated: flag for whether 'nomakedefs' should be freed */
game.nomakedefs_populated = 0;
game.nomakedefs = { build_date: "Tue, 28-Jul-87 13:18:57 EDT", copyright_banner_c: "Version 1.0, built Jul 28 13:18:57 1987.", git_sha: null, git_branch: null, git_prefix: null, version_string: "1.0.0-0", version_id: "NetHack Version 1.0.0-0 - last build Tue Jul 28 13:18:57 1987.", version_number: 16842752, version_features: 0, ignored_features: 0, version_sanity1: 0, build_time: 554476737 };
/* https://groups.google.com/forum/#!original/
       comp.sources.games/91SfKYg_xzI/dGnR3JnspFkJ */
/* git_sha */
/* git_branch */
/* git_prefix */
export function populate_nomakedefs(version) {
    let i = 0;
    let tmpbuf1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tmpbuf2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let strp = null;
    let mth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let t = { tm_sec: 0, tm_min: 0, tm_hour: 0, tm_mday: 0, tm_mon: 0, tm_year: 0, tm_wday: 0, tm_yday: 0, tm_isdst: 0, tm_gmtoff: 0, tm_zone: null };
    let timeresult = 0;
    nh_snprintf("populate_nomakedefs", 82, tmpbuf1, 256 /* sizeof(char [256]) */, "%s %s", "May 24 2026", "06:33:36");
    if (strlen(tmpbuf1) == 20) {
        do {
            for (i = 0; i < 4; ++i) {
                tmpbuf2[i] = tmpbuf1[i + 7];
            }
            tmpbuf2[i] = 0;
        } while (0);
        /*
     * In a cross-compiled environment, you can't execute
     * the target binaries during the build, so we can't
     * use makedefs to write the values of the build
     * date and time to a file for retrieval. Not for
     * information meaningful to the target execution
     * environment.
     *
     * How can we capture the build date/time of the target
     * binaries in such a situation?  We need to rely on the
     * cross-compiler itself to do it for us during the
     * cross-compile.
     *
     * To that end, we are going to make use of the
     * following pre-defined preprocessor macros for this:
     *    gcc, msvc, clang   __DATE__  "Feb 12 1996"
     *    gcc, msvc, clang   __TIME__  "23:59:01"
     *
     */
        /* "Feb 12 1996 23:59:01"
        01234567890123456789  */
        t.tm_year = atoi(tmpbuf2) - 1900;
        do {
            for (i = 0; i < 3; ++i) {
                tmpbuf2[i] = tmpbuf1[i + 0];
            }
            tmpbuf2[i] = 0;
        } while (0);
        for (i = 0; i < (Math.trunc(96 /* sizeof(const char *[12]) */ / 8 /* sizeof(const char *) */)); ++i) {
            if (!case_insensitive_comp(tmpbuf2, mth[i])) {
                t.tm_mon = i;
                break;
            }
        }
        do {
            for (i = 0; i < 2; ++i) {
                tmpbuf2[i] = tmpbuf1[i + 4];
            }
            tmpbuf2[i] = 0;
        } while (0);
        strp = tmpbuf2;
        if (strp == 32) {
            strp++;
        }
        t.tm_mday = atoi(strp);
        do {
            for (i = 0; i < 2; ++i) {
                tmpbuf2[i] = tmpbuf1[i + 12];
            }
            tmpbuf2[i] = 0;
        } while (0);
        t.tm_hour = atoi(tmpbuf2);
        do {
            for (i = 0; i < 2; ++i) {
                tmpbuf2[i] = tmpbuf1[i + 15];
            }
            tmpbuf2[i] = 0;
        } while (0);
        t.tm_min = atoi(tmpbuf2);
        do {
            for (i = 0; i < 2; ++i) {
                tmpbuf2[i] = tmpbuf1[i + 18];
            }
            tmpbuf2[i] = 0;
        } while (0);
        t.tm_sec = atoi(tmpbuf2);
        timeresult = mktime(t);
        game.nomakedefs.build_time = timeresult;
        game.nomakedefs.build_date = dupstr(tmpbuf1);
    }
    game.nomakedefs.version_number = version.incarnation;
    game.nomakedefs.version_features = version.feature_set;
    game.nomakedefs.ignored_features = md_ignored_features();
    game.nomakedefs.version_sanity1 = version.entity_count;
    game.nomakedefs.version_string = dupstr(mdlib_version_string(tmpbuf2, "."));
    game.nomakedefs.version_id = dupstr(version_id_string(tmpbuf2, 256 /* sizeof(char [256]) */, game.nomakedefs.build_date));
    game.nomakedefs.copyright_banner_c = dupstr(bannerc_string(tmpbuf2, 256 /* sizeof(char [256]) */, game.nomakedefs.build_date));
    game.nomakedefs_populated = 1;
    return;
}
export function free_nomakedefs() {
    /* can't just free non-Null values because they're initialized at
       compile-time with static strings and won't have dynamic values
       unless populate_nomakedefs() has been called */
    if (!game.nomakedefs_populated) {
        return;
    }
    if (game.nomakedefs.build_date) {
        free(game.nomakedefs.build_date) , game.nomakedefs.build_date = null;
    }
    if (game.nomakedefs.version_string) {
        free(game.nomakedefs.version_string) , game.nomakedefs.version_string = null;
    }
    if (game.nomakedefs.version_id) {
        free(game.nomakedefs.version_id) , game.nomakedefs.version_id = null;
    }
    if (game.nomakedefs.copyright_banner_c) {
        free(game.nomakedefs.copyright_banner_c) , game.nomakedefs.copyright_banner_c = null;
    }
    /* values are Null now; dynamic vs static doesn't really matter anymore */
    game.nomakedefs_populated = 0;
    return;
}
/* __DATE__ && __TIME__ */
/*date.c*/
