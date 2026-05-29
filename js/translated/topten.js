/* NetHack 5.0	topten.c	$NHDT-Date: 1606009004 2020/11/22 01:36:44 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.74 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
/* We don't want to rewrite the whole file, because that entails
   creating a new version which requires that the old one be deletable.
   [Write and Delete are separate permissions on VMS.  'record' should
   be writable but not deletable there.]  */
/*
 * Updating in place can leave junk at the end of the file in some
 * circumstances (if it shrinks and the OS doesn't have a straightforward
 * way to truncate it).  The trailing junk is harmless and the code
 * which reads the scores will ignore it.
 */
/* [note: do not move this to the 'g' struct] */
/* Changing NAMSZ can break your existing record/logfile */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { raw_printf } from '../c2js-runtime/pline.js';
import { fprintf, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strchr, strcmp, strcpy, strlen, strncat, strncmp } from '../c2js-runtime/string.js';
import { timet_to_seconds } from './allmain.js';
import { rank_of, rank_to_xlev } from './botl.js';
import { yyyymmdd } from './calendar.js';
import { canseemon } from './display.js';
import { christen_monst, oname } from './do_name.js';
import { deepest_lev_reached, depth, init_dungeons } from './dungeon.js';
import { money_cnt } from './hack.js';
import { copynchars, digit, eos, highc, lcase, onlyspace, ordin, strNsubst, strsubst } from './hacklib.js';
import { num_genocides, sokoban_in_play } from './insight.js';
import { set_corpsenm } from './mkobj.js';
import { ACH_AMUL, ACH_ASTR, ACH_BELL, ACH_BGRM, ACH_BOOK, ACH_CNDL, ACH_ENDG, ACH_HELL, ACH_INVK, ACH_MEDU, ACH_MINE, ACH_MINE_PRIZE, ACH_NOVL, ACH_ORCL, ACH_RNK1, ACH_RNK2, ACH_RNK3, ACH_RNK4, ACH_RNK5, ACH_RNK6, ACH_RNK7, ACH_RNK8, ACH_SHOP, ACH_SOKO, ACH_SOKO_PRIZE, ACH_TMPL, ACH_TOWN, ACH_TUNE, ACH_UWIN, NON_PM, PANICKED, PM_ARCHEOLOGIST, PM_HUMAN, PM_HUMAN_MUMMY, PM_RANGER, PM_WIZARD } from './nh-constants.js';
import { an } from './objnam.js';
import { rn2, rnd } from './rnd.js';
import { aligns, genders, roles, str2race, str2role } from './role.js';
import { Strlen_ } from './strutil.js';
import { hidden_gold } from './vault.js';

// struct toptenentry: { tt_next, points, deathdnum, deathlev, maxlvl, hp, maxhp, deaths, ver_major, ver_minor, patchlevel, deathdate, birthdate, uid, plrole, plrace, plgend, plalign, name, death }
game.tt_head = null;
/* size big enough to read in all the string fields at once; includes
   room for separating space or trailing newline plus string terminator */
game.zerott = { tt_next: null, points: 0, deathdnum: 0, deathlev: 0, maxlvl: 0, hp: 0, maxhp: 0, deaths: 0, ver_major: 0, ver_minor: 0, patchlevel: 0, deathdate: 0, birthdate: 0, uid: 0, plrole: [0, 0, 0, 0], plrace: [0, 0, 0, 0], plgend: [0, 0, 0, 0], plalign: [0, 0, 0, 0], name: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], death: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
/* "killed by",&c ["an"] 'svk.killer.name' */
/* DIED, CHOKING, POISONING, STARVING, */
/* DROWNING, BURNING, DISSOLVED, CRUSHING, */
/* STONING, TURNED_SLIME, GENOCIDED, */
/* PANICKED, TRICKED, QUIT, ESCAPED, ASCENDED */
const __formatkiller_killed_by_prefix = ["killed by ", "choked on ", "poisoned by ", "died of ", "drowned in ", "burned by ", "dissolved in ", "crushed to death by ", "petrified by ", "turned to slime by ", "killed by ", "", "", "", "", ""];
export function formatkiller(buf, siz, how, incl_helpless) {
    let l = 0;
    let c = 0;
    let kname = game.killer.name;
    buf[0] = 0;
    switch (game.killer.format) {
        default:
            impossible("bad killer format? (%d)", game.killer.format);
            ;
        case 2:
            break;
        case 0:
            kname = an(kname);
            ;
        case 1:
            buf = strncat(buf, __formatkiller_killed_by_prefix[how], siz - 1);
            l = Strlen_(buf, "formatkiller", 123);
            buf += l , siz -= l;
            break;
    }
    while (--siz > 0) {
        /* Copy kname into buf[].
     * Object names and named fruit have already been sanitized, but
     * monsters can have "called 'arbitrary text'" attached to them,
     * so make sure that that text can't confuse field splitting when
     * record, logfile, or xlogfile is re-read at some later point.
     */
        c = kname++;
        if (!c) {
            break;
        } else if (c == 44) {
            c = 59;
        } else if (c == 61) {
            c = 95;
        } else if (c == 9) {
            c = 32;
        }
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = c) */;
    }
    buf.value = 0;
    if (incl_helpless && game.multi < 0) {
        /* 'xlogfile' doesn't really need protection for '=', but
           fixrecord.awk for corrupted 3.6.0 'record' does (only
           if using xlogfile rather than logfile to repair record) */
        /* tab is not possible due to use of mungspaces() when naming;
           it would disrupt xlogfile parsing if it were present */
        /* X <= siz: 'sizeof "string"' includes 1 for '\0' terminator */
        /* else extra death info won't fit, so leave it out */
        if (game.multi_reason && strlen(game.multi_reason) + 9 /* sizeof(char [9]) */ <= siz) {
            buf = sprintf(buf, ", while %s", game.multi_reason);
        } else if (17 /* sizeof(char [17]) */ <= siz) {
            buf = strcpy(buf, ", while helpless");
        }
    }
}
export function topten_print(x) {
    if (game.toptenwin == (-1)) {
        (game.windowprocs.win_raw_print)(x);
    } else {
        (game.windowprocs.win_putstr)(game.toptenwin, 0, x);
    }
}
export function topten_print_bold(x) {
    if (game.toptenwin == (-1)) {
        (game.windowprocs.win_raw_print_bold)(x);
    } else {
        (game.windowprocs.win_putstr)(game.toptenwin, 1, x);
    }
}
export function observable_depth(lev) {
    /* if we ever randomize the order of the elemental planes, we
       must use a constant external representation in the record file */
    return depth(lev);
}
/* throw away characters until current record has been entirely consumed */
export function discardexcess(rfile) {
    let c = 0;
    do {
        c = fgetc(rfile);
    } while (c != 10 && c != (-1));
}
const __readentry_fmt = "%d.%d.%d %ld %d %d %d %d %d %d %ld %ld %d ";
const __readentry_fmt32 = "%c%c %[^,],%[^\n]%*c";
const __readentry_fmt33 = "%s %s %s %s %[^,],%[^\n]%*c";
export function readentry(rfile, tt) {
    let inbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let s1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let s2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let s3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let s4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let s5 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let s6 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (fscanf(rfile, __readentry_fmt, tt.ver_major, tt.ver_minor, tt.patchlevel, tt.points, tt.deathdnum, tt.deathlev, tt.maxlvl, tt.hp, tt.maxhp, tt.deaths, tt.deathdate, tt.birthdate, tt.uid) != 13) {
        /* Version_ Pts DgnLevs_ Hp___ Died__Born id */
        /* note: input below must read the record's terminating newline */
        tt.points = 0;
        discardexcess(rfile);
    } else {
        if (!fgets(inbuf, 129 /* sizeof(char [129]) */, rfile)) {
            /* load remainder of record into a local buffer;
           this imposes an implicit length limit of SCANBUFSZ
           on every string field extracted from the buffer */
            /* sscanf will fail and tt->points will be set to 0 */
            inbuf = '';
        } else if (!strchr(inbuf, 10)) {
            strcpy(inbuf[129 /* sizeof(char [129]) */ - 2], "\n");
            discardexcess(rfile);
        }
        if (tt.ver_major < 3 || (tt.ver_major == 3 && tt.ver_minor < 3)) {
            /* Check for backwards compatibility */
            let i = 0;
            if (sscanf(inbuf, __readentry_fmt32, tt.plrole, tt.plgend, s1, s2) == 4) {
                tt.plrole[1] = tt.plgend[1] = 0;
                tt.name = copynchars(tt.name, s1, (11 /* sizeof(char [11]) */) - 1);
                tt.death = copynchars(tt.death, s2, (101 /* sizeof(char [101]) */) - 1);
            } else {
                tt.points = 0;
            }
            tt.plrole[1] = 0;
            if ((i = str2role(tt.plrole)) >= 0) {
                tt.plrole = strcpy(tt.plrole, roles[i].filecode);
            }
            tt.plrace = strcpy(tt.plrace, "?");
            tt.plgend = strcpy(tt.plgend, (tt.plgend[0] == 77) ? "Mal" : "Fem");
            tt.plalign = strcpy(tt.plalign, "?");
        } else if (sscanf(inbuf, __readentry_fmt33, s1, s2, s3, s4, s5, s6) == 6) {
            tt.plrole = copynchars(tt.plrole, s1, (4 /* sizeof(char [4]) */) - 1);
            tt.plrace = copynchars(tt.plrace, s2, (4 /* sizeof(char [4]) */) - 1);
            tt.plgend = copynchars(tt.plgend, s3, (4 /* sizeof(char [4]) */) - 1);
            tt.plalign = copynchars(tt.plalign, s4, (4 /* sizeof(char [4]) */) - 1);
            tt.name = copynchars(tt.name, s5, (11 /* sizeof(char [11]) */) - 1);
            tt.death = copynchars(tt.death, s6, (101 /* sizeof(char [101]) */) - 1);
        } else {
            tt.points = 0;
        }
    }
    if (tt.points > 0) {
        /* check old score entries for Y2K problem and fix whenever found */
        if (tt.birthdate < 19000000) {
            tt.birthdate += 19000000;
        }
        if (tt.deathdate < 19000000) {
            tt.deathdate += 19000000;
        }
    }
}
const __writeentry_fmt32 = "%c%c ";
const __writeentry_fmt33 = "%s %s %s %s ";
const __writeentry_fmt0 = "%d.%d.%d %ld %d %d %d %d %d %d %ld %ld %d ";
const __writeentry_fmtX = "%s,%s\n";
export function writeentry(rfile, tt) {
    fprintf(rfile, __writeentry_fmt0, tt.ver_major, tt.ver_minor, tt.patchlevel, tt.points, tt.deathdnum, tt.deathlev, tt.maxlvl, tt.hp, tt.maxhp, tt.deaths, tt.deathdate, tt.birthdate, tt.uid);
    if (tt.ver_major < 3 || (tt.ver_major == 3 && tt.ver_minor < 3)) {
        fprintf(rfile, __writeentry_fmt32, tt.plrole[0], tt.plgend[0]);
    } else {
        fprintf(rfile, __writeentry_fmt33, tt.plrole, tt.plrace, tt.plgend, tt.plalign);
    }
    fprintf(rfile, __writeentry_fmtX, onlyspace(tt.name) ? "_" : tt.name, tt.death);
}
/* as tab is never used in eg. svp.plname or death, no need to mangle those. */
export function writexlentry(rfile, tt, how) {
    /* xlogfile field separator. */
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let achbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    buf = sprintf(buf, "version=%d.%d.%d", tt.ver_major, tt.ver_minor, tt.patchlevel);
    buf = (buf || '') + sprintf('', "%cpoints=%ld%cdeathdnum=%d%cdeathlev=%d", 9, tt.points, 9, tt.deathdnum, 9, tt.deathlev);
    buf = (buf || '') + sprintf('', "%cmaxlvl=%d%chp=%d%cmaxhp=%d", 9, tt.maxlvl, 9, tt.hp, 9, tt.maxhp);
    buf = (buf || '') + sprintf('', "%cdeaths=%d%cdeathdate=%ld%cbirthdate=%ld%cuid=%d", 9, tt.deaths, 9, tt.deathdate, 9, tt.birthdate, 9, tt.uid);
    fprintf(rfile, "%s", buf);
    buf = sprintf(buf, "%crole=%s%crace=%s%cgender=%s%calign=%s", 9, tt.plrole, 9, tt.plrace, 9, tt.plgend, 9, tt.plalign);
    /* make a copy of death reason that doesn't include ", while helpless" */
    formatkiller(tmpbuf, 101 /* sizeof(char [101]) */, how, (0));
    fprintf(rfile, "%s%cname=%s%cdeath=%s", buf, 9, game.plname, 9, tmpbuf);
    if (game.multi < 0) {
        fprintf(rfile, "%cwhile=%s", 9, game.multi_reason ? game.multi_reason : "helpless");
    }
    fprintf(rfile, "%cconduct=0x%lx%cturns=%ld%cachieve=0x%lx", 9, encodeconduct(), 9, game.moves, 9, encodeachieve((0)));
    fprintf(rfile, "%cachieveX=%s", 9, encode_extended_achievements(achbuf));
    fprintf(rfile, "%cconductX=%s", 9, encode_extended_conducts(buf));
    fprintf(rfile, "%crealtime=%ld%cstarttime=%ld%cendtime=%ld", 9, game.urealtime.realtime, 9, timet_to_seconds(game.ubirthday), 9, timet_to_seconds(game.urealtime.finish_time));
    fprintf(rfile, "%cgender0=%s%calign0=%s", 9, genders[game.flags.initgend].filecode, 9, aligns[1 - game.u.ualignbase[1]].filecode);
    fprintf(rfile, "%cflags=0x%lx", 9, encodexlogflags());
    fprintf(rfile, "%cgold=%ld", 9, money_cnt(game.invent) + hidden_gold((1)));
    fprintf(rfile, "%cwish_cnt=%ld", 9, game.u.uconduct.wishes);
    fprintf(rfile, "%carti_wish_cnt=%ld", 9, game.u.uconduct.wisharti);
    fprintf(rfile, "%cbones=%ld", 9, game.u.uroleplay.numbones);
    fprintf(rfile, "%crerolls=%ld", 9, game.u.uroleplay.numrerolls);
    fprintf(rfile, "\n");
}
export function encodexlogflags() {
    let e = 0;
    if (game.flags.debug) {
        e |= 1 << 0;
    }
    if (game.flags.explore) {
        e |= 1 << 1;
    }
    if (!game.u.uroleplay.numbones) {
        e |= 1 << 2;
    }
    if (game.u.uroleplay.reroll) {
        e |= 1 << 3;
    }
    return e;
}
export function encodeconduct() {
    let e = 0;
    if (!game.u.uconduct.food) {
        e |= 1 << 0;
    }
    if (!game.u.uconduct.unvegan) {
        e |= 1 << 1;
    }
    if (!game.u.uconduct.unvegetarian) {
        e |= 1 << 2;
    }
    if (!game.u.uconduct.gnostic) {
        e |= 1 << 3;
    }
    if (!game.u.uconduct.weaphit) {
        e |= 1 << 4;
    }
    if (!game.u.uconduct.killer) {
        e |= 1 << 5;
    }
    if (!game.u.uconduct.literate) {
        e |= 1 << 6;
    }
    if (!game.u.uconduct.polypiles) {
        e |= 1 << 7;
    }
    if (!game.u.uconduct.polyselfs) {
        e |= 1 << 8;
    }
    if (!game.u.uconduct.wishes) {
        e |= 1 << 9;
    }
    if (!game.u.uconduct.wisharti) {
        e |= 1 << 10;
    }
    if (!num_genocides()) {
        e |= 1 << 11;
    }
    /* one bit isn't really adequate for sokoban conduct:
       reporting "obeyed sokoban rules" is misleading if sokoban wasn't
       completed or at least attempted; however, suppressing that when
       sokoban was never entered, as we do here, risks reporting
       "violated sokoban rules" when no such thing occurred; this can
       be disambiguated in xlogfile post-processors by testing the
       entered-sokoban bit in the 'achieve' field */
    if (!game.u.uconduct.sokocheat && sokoban_in_play()) {
        e |= 1 << 12;
    }
    if (!game.u.uconduct.pets) {
        e |= 1 << 13;
    }
    return e;
}
/* False: handle achievements 1..31, True: 32..62 */
export function encodeachieve(secondlong) {
    let i = 0;
    let achidx = 0;
    let offset = 0;
    let r = 0;
    /*
     * 32: portable limit for 'long'.
     * Force 32 even on configurations that are using 64 bit longs.
     *
     * We use signed long and limit ourselves to 31 bits since tools
     * that post-process xlogfile might not be able to cope with
     * 'unsigned long'.
     */
    offset = secondlong ? (32 - 1) : 0;
    for (i = 0; game.u.uachieved[i]; ++i) {
        achidx = game.u.uachieved[i] - offset;
        /* value 1..31 sets bit 0..30 */
        if (achidx > 0 && achidx < 32) {
            r |= 1 << (achidx - 1);
        }
    }
    return r;
}
/* add the achievement or conduct comma-separated to string */
export function add_achieveX(buf, achievement, condition) {
    if (condition) {
        if (buf[0] != 0) {
            buf = strcat(buf, ",");
        }
        buf = strcat(buf, achievement);
    }
}
export function encode_extended_achievements(buf) {
    let rnkbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let achievement = null;
    let i = 0;
    let achidx = 0;
    let absidx = 0;
    buf[0] = 0;
    for (i = 0; game.u.uachieved[i]; i++) {
        achidx = game.u.uachieved[i];
        absidx = abs(achidx);
        switch (absidx) {
            case ACH_UWIN:
                achievement = "ascended";
                break;
            case ACH_ASTR:
                achievement = "entered_astral_plane";
                break;
            case ACH_ENDG:
                achievement = "entered_elemental_planes";
                break;
            case ACH_AMUL:
                achievement = "obtained_the_amulet_of_yendor";
                break;
            case ACH_INVK:
                achievement = "performed_the_invocation_ritual";
                break;
            case ACH_BOOK:
                achievement = "obtained_the_book_of_the_dead";
                break;
            case ACH_BELL:
                achievement = "obtained_the_bell_of_opening";
                break;
            case ACH_CNDL:
                achievement = "obtained_the_candelabrum_of_invocation";
                break;
            case ACH_HELL:
                achievement = "entered_gehennom";
                break;
            case ACH_MEDU:
                achievement = "defeated_medusa";
                break;
            case ACH_MINE_PRIZE:
                achievement = "obtained_the_luckstone_from_the_mines";
                break;
            case ACH_SOKO_PRIZE:
                achievement = "obtained_the_sokoban_prize";
                break;
            case ACH_ORCL:
                achievement = "consulted_the_oracle";
                break;
            case ACH_NOVL:
                achievement = "read_a_discworld_novel";
                break;
            case ACH_MINE:
                achievement = "entered_the_gnomish_mines";
                break;
            case ACH_TOWN:
                achievement = "entered_mine_town";
                break;
            case ACH_SHOP:
                achievement = "entered_a_shop";
                break;
            case ACH_TMPL:
                achievement = "entered_a_temple";
                break;
            case ACH_SOKO:
                achievement = "entered_sokoban";
                break;
            case ACH_BGRM:
                achievement = "entered_bigroom";
                break;
            case ACH_TUNE:
                achievement = "learned_castle_drawbridge_tune";
                break;
            /* rank 0 is the starting condition, not an achievement; 8 is Xp 30 */
            case ACH_RNK1:
            case ACH_RNK2:
            case ACH_RNK3:
            case ACH_RNK4:
            case ACH_RNK5:
            case ACH_RNK6:
            case ACH_RNK7:
            case ACH_RNK8:
                rnkbuf = sprintf(rnkbuf, "attained_the_rank_of_%s", rank_of(rank_to_xlev(absidx - (ACH_RNK1 - 1)), (game.urole.mnum), (achidx < 0) ? (1) : (0)));
                /* replace every ' ' with '_' */
                strNsubst(rnkbuf, " ", "_", 0);
                achievement = lcase(rnkbuf);
                break;
            default:
                continue;
        }
        add_achieveX(buf, achievement, (1));
    }
    return buf;
}
export function encode_extended_conducts(buf) {
    buf[0] = 0;
    add_achieveX(buf, "foodless", !game.u.uconduct.food);
    add_achieveX(buf, "vegan", !game.u.uconduct.unvegan);
    add_achieveX(buf, "vegetarian", !game.u.uconduct.unvegetarian);
    add_achieveX(buf, "atheist", !game.u.uconduct.gnostic);
    add_achieveX(buf, "weaponless", !game.u.uconduct.weaphit);
    add_achieveX(buf, "pacifist", !game.u.uconduct.killer);
    add_achieveX(buf, "illiterate", !game.u.uconduct.literate);
    add_achieveX(buf, "polyless", !game.u.uconduct.polypiles);
    add_achieveX(buf, "polyselfless", !game.u.uconduct.polyselfs);
    add_achieveX(buf, "wishless", !game.u.uconduct.wishes);
    add_achieveX(buf, "artiwishless", !game.u.uconduct.wisharti);
    add_achieveX(buf, "genocideless", !num_genocides());
    if (sokoban_in_play()) {
        add_achieveX(buf, "sokoban", !game.u.uconduct.sokocheat);
    }
    add_achieveX(buf, "blind", game.u.uroleplay.blind);
    add_achieveX(buf, "deaf", game.u.uroleplay.deaf);
    add_achieveX(buf, "nudist", game.u.uroleplay.nudist);
    add_achieveX(buf, "pauper", game.u.uroleplay.pauper);
    add_achieveX(buf, "bonesless", !game.flags.bones);
    add_achieveX(buf, "petless", !game.u.uconduct.pets);
    add_achieveX(buf, "unrerolled", !game.u.uroleplay.reroll);
    return buf;
}
/* XLOGFILE */
export function free_ttlist(tt) {
    let ttnext = null;
    while (tt.points > 0) {
        ttnext = tt.tt_next;
        free((tt));
        tt = ttnext;
    }
    free((tt));
}
export function topten(how, when) {
    let t0 = null;
    let tprev = null;
    let t1 = null;
    let rfile = null;
    let lfile = null;
    let xlfile = null;
    let uid = 0;
    let rank = 0;
    let rank0 = 0;
    let rank1 = 0;
    let occ_cnt = 0;
    let flg = 0;
    let t0_used = 0;
    let skip_scores = 0;
    showwin: {
        uid = getuid();
        rank0 = -1;
        rank1 = 0;
        occ_cnt = game.sysopt.persmax;
        flg = 0;
        /* If we are in the midst of a panic, cut out topten entirely.
     * topten uses alloc() several times, which will lead to
     * problems if the panic was the result of an alloc() failure.
     */
        if (game.program_state.panicking) {
            return;
        }
        if (game.iflags.toptenwin) {
            game.toptenwin = (game.windowprocs.win_create_nhwindow)(5);
        }
        /* make sure the screen is black on white */
        /* create a new 'topten' entry */
        t0_used = (0);
        t0 = alloc(1 /* sizeof(struct toptenentry) */);
        Object.assign(t0, game.zerott);
        t0.ver_major = 5;
        t0.ver_minor = 0;
        t0.patchlevel = 0;
        t0.points = game.u.urexp;
        t0.deathdnum = game.u.uz.dnum;
        /* deepest_lev_reached() is in terms of depth(), and reporting the
     * deepest level reached in the dungeon death occurred in doesn't
     * seem right, so we have to report the death level in depth() terms
     * as well (which also seems reasonable since that's all the player
     * sees on the screen anyway)
     */
        t0.deathlev = observable_depth(game.u.uz);
        t0.maxlvl = deepest_lev_reached((1));
        t0.hp = game.u.uhp;
        t0.maxhp = game.u.uhpmax;
        t0.deaths = game.u.umortality;
        t0.uid = uid;
        t0.plrole = copynchars(t0.plrole, game.urole.filecode, 3);
        t0.plrace = copynchars(t0.plrace, game.urace.filecode, 3);
        t0.plgend = copynchars(t0.plgend, genders[game.flags.female].filecode, 3);
        t0.plalign = copynchars(t0.plalign, aligns[1 - game.u.ualign.type].filecode, 3);
        t0.name = copynchars(t0.name, game.plname, 10);
        formatkiller(t0.death, 101 /* sizeof(char [101]) */, how, (1));
        t0.birthdate = yyyymmdd(game.ubirthday);
        t0.deathdate = yyyymmdd(when);
        t0.tt_next = null;
        if (lock_file("logfile", 5, 10)) {
            /* used for debugging (who dies of what, where) */
            if (!(lfile = fopen_datafile("logfile", "a", 5))) {
                if (!game.program_state.done_hup) {
                    (game.windowprocs.win_raw_print)("Cannot open log file!");
                }
            } else {
                writeentry(lfile, t0);
                fclose(lfile);
            }
            unlock_file("logfile");
        }
        if (lock_file("xlogfile", 5, 10)) {
            if (!(xlfile = fopen_datafile("xlogfile", "a", 5))) {
                if (!game.program_state.done_hup) {
                    (game.windowprocs.win_raw_print)("Cannot open extended log file!");
                }
            } else {
                writexlentry(xlfile, t0, how);
                fclose(xlfile);
            }
            unlock_file("xlogfile");
        }
        if (game.flags.debug || game.flags.explore) {
            if (how != PANICKED) {
                if (!game.program_state.done_hup) {
                    let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    topten_print("");
                    pbuf = sprintf(pbuf, "Since you were in %s mode, the score list will not be checked.", game.flags.debug ? "wizard" : "discover");
                    topten_print(pbuf);
                }
            }
            break showwin;
        }
        if (!lock_file("record", 5, 60)) {
            if (!t0_used) { free(t0); }
            if (game.iflags.toptenwin) {
                (game.windowprocs.win_destroy_nhwindow)(game.toptenwin);
                game.toptenwin = (-1);
            }
            return;
        }
        rfile = fopen_datafile("record", "r", 5);
        if (!rfile) {
            if (!game.program_state.done_hup) {
                (game.windowprocs.win_raw_print)("Cannot open record file!");
            }
            unlock_file("record");
            if (!t0_used) { free(t0); }
            if (game.iflags.toptenwin) {
                (game.windowprocs.win_destroy_nhwindow)(game.toptenwin);
                game.toptenwin = (-1);
            }
            return;
        }
        if (!game.program_state.done_hup) {
            topten_print("");
        }
        /* assure minimum number of points */
        if (t0.points < game.sysopt.pointsmin) {
            t0.points = 0;
        }
        t1 = game.tt_head = alloc(1 /* sizeof(struct toptenentry) */);
        tprev = null;
        for (rank = 1; ; ) {
            /* rank0: -1 undefined, 0 not_on_list, n n_th on list */
            readentry(rfile, t1);
            if (t1.points < game.sysopt.pointsmin) {
                t1.points = 0;
            }
            if (rank0 < 0 && t1.points < t0.points) {
                rank0 = rank++;
                if (tprev == null) {
                    game.tt_head = t0;
                } else {
                    tprev.tt_next = t0;
                }
                t0.tt_next = t1;
                t0_used = (1);
                occ_cnt--;
                flg++;
            } else {
                tprev = t1;
            }
            if (t1.points == 0) {
                break;
            }
            if ((game.sysopt.pers_is_uid ? t1.uid == t0.uid : strncmp(t1.name, t0.name, 10) == 0) && !strncmp(t1.plrole, t0.plrole, 3) && --occ_cnt <= 0) {
                if (rank0 < 0) {
                    rank0 = 0;
                    rank1 = rank;
                    if (!game.program_state.done_hup) {
                        let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        pbuf = sprintf(pbuf, "You didn't beat your previous score of %ld points.", t1.points);
                        topten_print(pbuf);
                        topten_print("");
                    }
                }
                if (occ_cnt < 0) {
                    flg++;
                    continue;
                }
            }
            if (rank <= game.sysopt.entrymax) {
                t1.tt_next = alloc(1 /* sizeof(struct toptenentry) */);
                t1 = t1.tt_next;
                rank++;
            }
            if (rank > game.sysopt.entrymax) {
                t1.points = 0;
                break;
            }
        }
        if (flg) {
            /* if a reasonable way to truncate a file exists, use it */
            /* use sentinel record rather than relying on truncation */
            /* [redundant] terminates file when read back in */
            /* note: there might be junk (if file has shrunk due to shorter
           entries supplanting longer ones) after this dummy entry, but
           reading and/or updating will ignore it */
            fclose(rfile);
            if (!(rfile = fopen_datafile("record", "w", 5))) {
                if (!game.program_state.done_hup) {
                    (game.windowprocs.win_raw_print)("Cannot write record file");
                }
                unlock_file("record");
                free_ttlist(game.tt_head);
                if (!t0_used) { free(t0); }
                if (game.iflags.toptenwin) {
                    (game.windowprocs.win_destroy_nhwindow)(game.toptenwin);
                    game.toptenwin = (-1);
                }
                return;
            }
            if (!game.program_state.stopprint) {
                if (rank0 > 0) {
                    if (rank0 <= 10) {
                        topten_print("You made the top ten list!");
                    } else {
                        let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        pbuf = sprintf(pbuf, "You reached the %d%s place on the top %d list.", rank0, ordin(rank0), game.sysopt.entrymax);
                        topten_print(pbuf);
                    }
                    topten_print("");
                }
            }
        }
        skip_scores = !game.flags.end_top && !game.flags.end_around && !game.flags.end_own;
        if (rank0 == 0) {
            rank0 = rank1;
        }
        if (rank0 <= 0) {
            rank0 = rank;
        }
        if (!skip_scores && !game.program_state.stopprint) {
            outheader();
        }
        for (t1 = game.tt_head , rank = 1; t1.points != 0; t1 = t1.tt_next , ++rank) {
            if (flg) {
                writeentry(rfile, t1);
            }
            if (skip_scores || game.program_state.stopprint) {
                continue;
            }
            if (rank <= game.flags.end_top || (rank >= rank0 - game.flags.end_around && rank <= rank0 + game.flags.end_around) || (game.flags.end_own && (game.sysopt.pers_is_uid ? t1.uid == t0.uid : !strncmp(t1.name, t0.name, 10)))) {
                if (rank == rank0 - game.flags.end_around && rank0 > game.flags.end_top + game.flags.end_around + 1 && !game.flags.end_own) {
                    topten_print("");
                }
                if (rank != rank0) {
                    outentry(rank, t1, (0));
                } else if (!rank1) {
                    outentry(rank, t1, (1));
                } else {
                    outentry(rank, t1, (1));
                    outentry(0, t0, (1));
                }
            }
        }
        if (rank0 >= rank) {
            if (!skip_scores && !game.program_state.stopprint) {
                outentry(0, t0, (1));
            }
        }
        fclose(rfile);
        unlock_file("record");
        free_ttlist(game.tt_head);
    }
    if (!game.program_state.stopprint) {
        if (game.iflags.toptenwin) {
            (game.windowprocs.win_display_nhwindow)(game.toptenwin, (1));
        } else {
            ;
        }
    }
    destroywin: {
    }
    if (!t0_used) {
        free((t0));
    }
    if (game.iflags.toptenwin) {
        (game.windowprocs.win_destroy_nhwindow)(game.toptenwin);
        game.toptenwin = (-1);
    }
}
export function outheader() {
    /* Hand-port: C outheader builds the scoreboard column header
       " No  Points     Name" + N spaces + "Hp [max]" with column-71
       alignment via `while (bp < linebuf + 71) *bp++ = ' ';`.

       Translator emitted the loop body as a `void 0` TODO so the
       padding never happened, and the trailing "Hp [max]" suffix
       was applied to a discarded `bp` (a copy of `linebuf` from the
       broken eos() — bp wasn't a real interior pointer in JS).

       JS rewrite: native padEnd to fill to col 71, then concat
       "Hp [max]".  topten_print accepts the string. */
    const header = " No  Points     Name".padEnd(80 - 9, ' ') + "Hp [max]";
    topten_print(header);
}
/* so>0: standout line; so=0: ordinary line */
export function outentry(rank, t1, so) {
    let second_line = (1);
    let linebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let bp = null;
    let hpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let linebuf3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let hppos = 0;
    let lngr = 0;
    linebuf[0] = 0;
    if (rank) {
        linebuf = (linebuf || '') + sprintf('', "%3d", rank);
    } else {
        linebuf = strcat(linebuf, "   ");
    }
    linebuf = (linebuf || '') + sprintf('', " %10ld  %.10s", t1.points ? t1.points : game.u.urexp, t1.name);
    linebuf = (linebuf || '') + sprintf('', "-%s", t1.plrole);
    if (t1.plrace[0] != 63) {
        linebuf = (linebuf || '') + sprintf('', "-%s", t1.plrace);
    }
    linebuf = (linebuf || '') + sprintf('', "-%s", t1.plgend);
    /* Printing of gender and alignment is intentional.  It has been
     * part of the NetHack Geek Code, and illustrates a proper way to
     * specify a character from the command line.
     */
    if (t1.plalign[0] != 63) {
        linebuf = (linebuf || '') + sprintf('', "-%s ", t1.plalign);
    } else {
        linebuf = strcat(linebuf, " ");
    }
    if (!strncmp("escaped", t1.death, 7)) {
        linebuf = (linebuf || '') + sprintf('', "escaped the dungeon %s[max level %d]", !strncmp(" (", t1.death + 7, 2) ? t1.death + 7 + 2 : "", t1.maxlvl);
        /* fixup for closing paren in "escaped... with...Amulet)[max..." */
        if ((bp = strchr(linebuf, 41)) != null) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = (t1.deathdnum == (game.dungeon_topology.) */;
        }
        second_line = (0);
    } else if (!strncmp("ascended", t1.death, 8)) {
        linebuf = (linebuf || '') + sprintf('', "ascended to demigod%s-hood", (t1.plgend[0] == 70) ? "dess" : "");
        second_line = (0);
    } else {
        if (!strncmp(t1.death, "quit", 4)) {
            linebuf = strcat(linebuf, "quit");
            second_line = (0);
        } else if (!strncmp(t1.death, "died of st", 10)) {
            linebuf = strcat(linebuf, "starved to death");
            second_line = (0);
        } else if (!strncmp(t1.death, "choked", 6)) {
            linebuf = (linebuf || '') + sprintf('', "choked on h%s food", (t1.plgend[0] == 70) ? "er" : "is");
        } else if (!strncmp(t1.death, "poisoned", 8)) {
            linebuf = strcat(linebuf, "was poisoned");
        } else if (!strncmp(t1.death, "crushed", 7)) {
            linebuf = strcat(linebuf, "was crushed to death");
        } else if (!strncmp(t1.death, "petrified by ", 13)) {
            linebuf = strcat(linebuf, "turned to stone");
        } else {
            linebuf = strcat(linebuf, "died");
        }
        if (t1.deathdnum == (game.dungeon_topology.d_astral_level).dnum) {
            let arg = null;
            let fmt = " on the Plane of %s";
            switch (t1.deathlev) {
                case -5:
                    fmt = " on the %s Plane";
                    arg = "Astral";
                    break;
                case -4:
                    arg = "Water";
                    break;
                case -3:
                    arg = "Fire";
                    break;
                case -2:
                    arg = "Air";
                    break;
                case -1:
                    arg = "Earth";
                    break;
                default:
                    arg = "Void";
                    break;
            }
            linebuf = (linebuf || '') + sprintf('', fmt, arg);
        } else {
            linebuf = (linebuf || '') + sprintf('', " in %s", game.dungeons[t1.deathdnum].dname);
            if (t1.deathdnum != (game.dungeon_topology.d_knox_level).dnum) {
                linebuf = (linebuf || '') + sprintf('', " on level %d", t1.deathlev);
            }
            if (t1.deathlev != t1.maxlvl) {
                linebuf = (linebuf || '') + sprintf('', " [max %d]", t1.maxlvl);
            }
        }
        /* kludge for "quit while already on Charon's boat" */
        if (!strncmp(t1.death, "quit ", 5)) {
            linebuf = strcat(linebuf, t1.death + 4);
        }
    }
    linebuf = strcat(linebuf, ".");
    if (second_line) {
        /* Quit, starved, ascended, and escaped contain no second line */
        bp = eos(linebuf);
        bp = sprintf(bp, "  %c%s.", highc((t1.death)), t1.death + 1);
        /* fix up "Killed by Mr. Asidonhopo; the shopkeeper"; that starts
           with a comma but has it changed to semi-colon to keep the comma
           out of 'record'; change it back for display */
        bp = strsubst(bp, "; the ", ", the ");
    }
    lngr = strlen(linebuf);
    if (t1.hp <= 0) {
        hpbuf[0] = 45 , hpbuf[1] = 0;
    } else {
        hpbuf = sprintf(hpbuf, "%d", t1.hp);
    }
    /* beginning of hp column after padding (not actually padded yet) */
    hppos = 80 - (11 /* sizeof(char [11]) */ - 1 /* sizeof(char [1]) */);
    while (lngr >= hppos) {
        for (bp = eos(linebuf); !(bp == 32 && bp - linebuf < hppos); bp--) {
            ;
        }
        /* special case: word is too long, wrap in the middle */
        if (linebuf + 15 >= bp) {
            bp = linebuf + hppos - 1;
        }
        /* special case: if about to wrap in the middle of maximum
           dungeon depth reached, wrap in front of it instead */
        if (bp > linebuf + 5 && !strncmp(bp - 5, " [max", 5)) {
            bp -= 5;
        }
        if (bp != 32) {
            linebuf3 = strcpy(linebuf3, bp);
        } else {
            linebuf3 = strcpy(linebuf3, bp + 1);
        }
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        if (so) {
            while (bp < linebuf + (80 - 1)) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32) */;
            }
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            topten_print_bold(linebuf);
        } else {
            topten_print(linebuf);
        }
        nh_snprintf("outentry", 1082, linebuf, 256 /* sizeof(char [256]) */, "%15s %s", "", linebuf3);
        lngr = Strlen_(linebuf, "outentry", 1083);
    }
    /* beginning of hp column not including padding */
    hppos = 80 - 7 - strlen(hpbuf);
    bp = eos(linebuf);
    if (bp <= linebuf + hppos) {
        /* pad any necessary blanks to the hit point entry */
        while (bp < linebuf + hppos) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32) */;
        }
        bp = strcpy(bp, hpbuf);
        bp = (bp || '') + sprintf('', " %s[%d]", (t1.maxhp < 10) ? "  " : (t1.maxhp < 100) ? " " : "", t1.maxhp);
    }
    if (so) {
        bp = eos(linebuf);
        while (bp < linebuf + (80 - 1)) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32) */;
        }
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        topten_print_bold(linebuf);
    } else {
        topten_print(linebuf);
    }
}
export function score_wanted(current_ver, rank, t1, playerct, players, uid) {
    let arg = null;
    let nxt = null;
    let i = 0;
    if (current_ver && (t1.ver_major != 5 || t1.ver_minor != 0 || t1.patchlevel != 0)) {
        return 0;
    }
    if (game.sysopt.pers_is_uid && !playerct && t1.uid == uid) {
        return 1;
    }
    /*
     * FIXME:
     *  This selection produces a union (OR) of criteria rather than
     *  an intersection (AND).  So
     *    nethack -s -u igor -p Cav -r Hum
     *  will list all entries for name igor regardless of role or race
     *  plus all entries for cave dwellers regardless of name or race
     *  plus all entries for humans regardless of name or role.
     *
     *  It would be more useful if it only chose human cave dwellers
     *  named igor.  That would be pretty straightforward if only one
     *  instance of each of the criteria were possible, but
     *    nethack -s -u igor -u ayn -p Cav -p Pri -r Hum -r Dwa
     *  should list human cave dwellers named igor and human cave
     *  dwellers named ayn plus dwarven cave dwellers named igor and
     *  dwarven cave dwellers named ayn plus human priest[esse]s named
     *  igor and human priest[esse]s named ayn (the combination of
     *  dwarven priest[esse]s doesn't occur but the selection can test
     *  entries without being aware of such; it just won't find any
     *  matches for that).  An extra initial pass of the command line
     *  to collect all criteria before testing any entry is needed to
     *  accomplish this.  And we might need to drop support for
     *  pre-3.3.0 entries (old elf role) depending on how the criteria
     *  matching is performed.
     *
     *  It also ought to extended to handle
     *    nethack -s -u igor-Cav-Hum
     *  Alignment and gender could be useful too but no one has ever
     *  clamored for them.  Presumably if they care they postprocess
     *  with some custom tool.
     */
    for (i = 0; i < playerct; i++) {
        arg = players[i];
        if (arg[0] == 45 && arg[1] == 117 && arg[2] != 0) {
            arg += 2;
        }
        if (arg[0] == 45 && strchr("pru", arg[1]) && !arg[2] && i + 1 < playerct) {
            nxt = players[i + 1];
            if ((arg[1] == 112 && str2role(nxt) == str2role(t1.plrole)) || (arg[1] == 114 && str2race(nxt) == str2race(t1.plrace)) || (arg[1] == 117 && (!strcmp(nxt, "all") || !strncmp(t1.name, nxt, 10)))) {
                return 1;
            }
            i++;
        } else if (!strcmp(arg, "all") || !strncmp(t1.name, arg, 10) || (arg[0] == 45 && arg[1] == t1.plrole[0] && !arg[2]) || (digit(arg[0]) && rank <= atoi(arg))) {
            return 1;
        }
    }
    return 0;
}
/*
 * print selected parts of score list.
 * argc >= 2, with argv[0] untrustworthy (directory names, et al.),
 * and argv[1] starting with "-s".
 * caveat: some shells might allow argv elements to be arbitrarily long.
 */
export async function prscore(argc, argv) {
    let players = null;
    let player0 = null;
    let i = 0;
    let playerct = 0;
    let rank = 0;
    let t1 = null;
    let rfile = null;
    let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let p = null;
    let ln = 0;
    let uid = -1;
    let current_ver = (1);
    let init_done = (0);
    let match_found = (0);
    /* expect "-s" or "--scores"; "-s<anything> is accepted */
    ln = (argc < 2) ? 0 : ((p = strchr(argv[1], 32)) != null) ? (p - argv[1]) : Strlen_(argv[1], "prscore", 1208);
    if (ln < 2 || (strncmp(argv[1], "-s", 2) && strcmp(argv[1], "--scores"))) {
        raw_printf("prscore: bad arguments (%d)", argc);
        return;
    }
    rfile = fopen_datafile("record", "r", 5);
    if (!rfile) {
        (game.windowprocs.win_raw_print)("Cannot open record file!");
        return;
    }
    if ((game.dungeon_topology.d_wiz1_level).dlevel == 0) {
        ;
        /* If the score list isn't after a game, we never went through
     * initialization. */
        await init_dungeons();
        init_done = (1);
    }
    if (argv[1][1] == 45 || !argv[1][2]) {
        /* to get here, argv[1] either starts with "-s" or is "--scores" without
       trailing stuff; for "-s<anything>" treat <anything> as separate arg */
        argc--;
        argv++;
    } else {
        /* concatenated arg string; use up "-s" but keep argc,argv */
        argv[1] += 2;
    }
    if (argc > 1 && !strcmp(argv[1], "-v")) {
        /* -v doesn't take a version number arg; it means 'all versions present
       in the file' instead of the default of only the current version;
       unlike -s, we don't accept "-v<anything>" for non-empty <anything> */
        current_ver = (0);
        argc--;
        argv++;
    }
    if (argc <= 1) {
        if (game.sysopt.pers_is_uid) {
            uid = getuid();
            playerct = 0;
            players = null;
        } else {
            player0 = game.plname;
            if (!player0) {
                player0 = "all";
            }
            /* if no plname[], show all scores
                                  * (possibly filtered by '-v') */
            playerct = 1;
            players = player0;
        }
    } else {
        playerct = --argc;
        players = ++argv;
    }
    (game.windowprocs.win_raw_print)("");
    t1 = game.tt_head = alloc(1 /* sizeof(struct toptenentry) */);
    for (rank = 1; ; rank++) {
        readentry(rfile, t1);
        if (t1.points == 0) {
            break;
        }
        if (!match_found && score_wanted(current_ver, rank, t1, playerct, players, uid)) {
            match_found = (1);
        }
        t1.tt_next = alloc(1 /* sizeof(struct toptenentry) */);
        t1 = t1.tt_next;
    }
    fclose(rfile);
    if (init_done) {
        free_dungeons();
        ;
    }
    if (match_found) {
        outheader();
        t1 = game.tt_head;
        for (rank = 1; t1.points != 0; rank++ , t1 = t1.tt_next) {
            if (score_wanted(current_ver, rank, t1, playerct, players, uid)) {
                outentry(rank, t1, (0));
            }
        }
    } else {
        pbuf = sprintf(pbuf, "Cannot find any %sentries for ", current_ver ? "current " : "");
        if (playerct < 1) {
            pbuf = strcat(pbuf, "you");
        } else {
            /* minor bug: 'nethack -s -u ziggy' will say "any of"
               even though the '-u' doesn't indicate multiple names */
            if (playerct > 1) {
                pbuf = strcat(pbuf, "any of ");
            }
            for (i = 0; i < playerct; i++) {
                if (!strncmp(players[i], "-u", 2)) {
                    /* accept '-u name' and '-uname' as well as just 'name'
                   so skip '-u' for the none-found feedback */
                    if (!players[i][2]) {
                        continue;
                    }
                    players[i] += 2;
                }
                if (strlen(pbuf) + strlen(players[i]) + 2 >= 256) {
                    /* stop printing players if there are too many to fit */
                    if (strlen(pbuf) < 256 - 4) {
                        pbuf = strcat(pbuf, "...");
                    } else {
                        strcpy(pbuf + strlen(pbuf) - 4, "...");
                    }
                    break;
                }
                pbuf = strcat(pbuf, players[i]);
                if (i < playerct - 1) {
                    if (players[i][0] == 45 && strchr("pr", players[i][1]) && players[i][2] == 0) {
                        pbuf = strcat(pbuf, " ");
                    } else {
                        pbuf = strcat(pbuf, ":");
                    }
                }
            }
        }
        /* append end-of-sentence punctuation if there is room */
        if (strlen(pbuf) < 256 - 1) {
            pbuf = strcat(pbuf, ".");
        }
        (game.windowprocs.win_raw_print)(pbuf);
        raw_printf("Usage: %s -s [-v] <playertypes> [maxrank] [playernames]", game.hname);
        raw_printf("Player types are: [-p role] [-r race]");
    }
    free_ttlist(game.tt_head);
}
export function classmon(plch) {
    let i = 0;
    for (i = 0; roles[i].name.m; i++) {
        if (!strncmp(plch, roles[i].filecode, 3)) {
            if (roles[i].mnum != NON_PM) {
                return roles[i].mnum;
            /* Look for this role in the role table */
            } else {
                return PM_HUMAN;
            }
        }
    }
    /* this might be from a 3.2.x score for former Elf class */
    if (!strcmp(plch, "E")) {
        return PM_RANGER;
    }
    impossible("What weird role is this? (%s)", plch);
    return PM_HUMAN_MUMMY;
}
/*
 * Get a random player name and class from the high score list,
 */
let __get_rnd_toptenentry_tt_buf = { tt_next: null, points: 0, deathdnum: 0, deathlev: 0, maxlvl: 0, hp: 0, maxhp: 0, deaths: 0, ver_major: 0, ver_minor: 0, patchlevel: 0, deathdate: 0, birthdate: 0, uid: 0, plrole: [0, 0, 0, 0], plrace: [0, 0, 0, 0], plgend: [0, 0, 0, 0], plalign: [0, 0, 0, 0], name: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], death: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
export function get_rnd_toptenentry() {
    let rank = 0;
    let i = 0;
    let rfile = null;
    let tt = null;
    rfile = fopen_datafile("record", "r", 5);
    if (!rfile) {
        impossible("Cannot open record file!");
        return null;
    }
    tt = __get_rnd_toptenentry_tt_buf;
    rank = rnd(game.sysopt.tt_oname_maxrank);
    pickentry: while (true) {
        for (i = rank; i; i--) {
            readentry(rfile, tt);
            if (tt.points == 0) {
                break;
            }
        }
        if (tt.points == 0) {
            if (rank > 1) {
                rank = 1;
                rewind(rfile);
                continue pickentry;
            }
            tt = null;
        }
        fclose(rfile);
        return tt;
        break;
    }
}
/*
 * Attach random player name and class from high score list
 * to an object (for statues or morgue corpses).
 */
export function tt_oname(otmp) {
    let tt = null;
    if (!otmp) {
        return null;
    }
    tt = get_rnd_toptenentry();
    if (!tt) {
        return null;
    }
    set_corpsenm(otmp, classmon(tt.plrole));
    if (tt.plgend[0] == 70) {
        otmp.spe = 1;
    } else if (tt.plgend[0] == 77) {
        otmp.spe = 2;
    }
    otmp = oname(otmp, tt.name, 0);
    return otmp;
}
/* Randomly select a topten entry to mimic */
export function tt_doppel(mon) {
    let tt = rn2(13) ? get_rnd_toptenentry() : null;
    let ret = 0;
    if (!tt) {
        ret = (rn2(PM_WIZARD - PM_ARCHEOLOGIST + 1) + (PM_ARCHEOLOGIST));
    } else {
        if (tt.plgend[0] == 70) {
            mon.female = 1;
        } else if (tt.plgend[0] == 77) {
            mon.female = 0;
        }
        ret = classmon(tt.plrole);
        /* Only take on a name if the player can see
           the doppelganger, otherwise we end up with
           named monsters spoiling the fun - Kes */
        if (canseemon(mon)) {
            christen_monst(mon, tt.name);
        }
    }
    return ret;
}
/* Lattice scanf isn't up to reading the scorefile.  What */
/* follows deals with that; I admit it's ugly. (KL) */
/* Now generally available (KL) */
/* NO_SCAN_BRACK */
/*topten.c*/
/* either gm.multi_reason wasn't specified or wouldn't fit */
/* (already includes separator) */
/* when not a window, we need something comparable to more()
               but can't use it directly because we aren't dealing with
               the message window */
