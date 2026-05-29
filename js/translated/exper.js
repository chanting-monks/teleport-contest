/* NetHack 5.0	exper.c	$NHDT-Date: 1706133782 2024/01/24 22:03:02 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.62 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2007. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { You_feel, pline } from '../c2js-runtime/pline.js';
import { strcmp, strcpy } from '../c2js-runtime/string.js';
import { acurr, adjabil, minuhpmax, newhp, setuhpmax } from './attrib.js';
import { exp_percent_changing, xlev_to_rank } from './botl.js';
import { done } from './end.js';
import { achieve_rank, count_achievements, record_achievement } from './insight.js';
import { monhp_per_lvl } from './makemon.js';
import { resists_drli } from './mondata.js';
import { A_WIS, DIED, MAGICAL_BREATHING, PM_BARBARIAN, PM_CLERIC, PM_HEALER, PM_KNIGHT, PM_MAIL_DAEMON, PM_VALKYRIE, PM_WIZARD, S_EEL } from './nh-constants.js';
import { livelog_printf } from './pline.js';
import { rehumanize } from './polyself.js';
import { rn2, rnd } from './rnd.js';
import { Goodbye } from './role.js';
import { find_mac } from './worn.js';

export function newuexp(lev) {
    /* for newuexp(u.ulevel - 1) when u.ulevel is 1 */
    if (lev < 1) {
        return 0;
    }
    if (lev < 10) {
        return (10 * (1 << lev));
    }
    if (lev < 20) {
        return (10000 * (1 << (lev - 10)));
    }
    return (10000000 * ((lev - 19)));
}
export function enermod(en) {
    switch ((game.urole.mnum)) {
        case PM_CLERIC:
        case PM_WIZARD:
            return (2 * en);
        case PM_HEALER:
        case PM_KNIGHT:
            return (Math.trunc((3 * en) / 2));
        case PM_BARBARIAN:
        case PM_VALKYRIE:
            return (Math.trunc((3 * en) / 4));
        default:
            return en;
    }
}
/* calculate spell power/energy points for new level */
export function newpw() {
    let en = 0;
    let enrnd = 0;
    let enfix = 0;
    if (game.u.ulevel == 0) {
        en = game.urole.enadv.infix + game.urace.enadv.infix;
        if (game.urole.enadv.inrnd > 0) {
            en += rnd(game.urole.enadv.inrnd);
        }
        if (game.urace.enadv.inrnd > 0) {
            en += rnd(game.urace.enadv.inrnd);
        }
    } else {
        enrnd = Math.trunc((acurr(A_WIS)) / 2);
        if (game.u.ulevel < game.urole.xlev) {
            enrnd += game.urole.enadv.lornd + game.urace.enadv.lornd;
            enfix = game.urole.enadv.lofix + game.urace.enadv.lofix;
        } else {
            enrnd += game.urole.enadv.hirnd + game.urace.enadv.hirnd;
            enfix = game.urole.enadv.hifix + game.urace.enadv.hifix;
        }
        en = enermod((rn2(enrnd) + (enfix)));
    }
    if (en <= 0) {
        en = 1;
    }
    if (game.u.ulevel < 30) {
        /* remember increment; future level drain could take it away again */
        game.u.ueninc[game.u.ulevel] = en;
    } else {
        /* after level 30, throttle energy gains from extra experience;
           once max reaches 600, further increments will be just 1 more */
        let lim = 4 - Math.trunc(game.u.uenmax / 200);
        lim = ((lim) > (1) ? (lim) : (1));
        if (en > lim) {
            en = lim;
        }
    }
    return en;
}
/* return # of exp points for mtmp after nk killed */
export function experience(mtmp, nk) {
    let ptr = mtmp.data;
    let i = 0;
    let tmp = 0;
    let tmp2 = 0;
    tmp = 1 + mtmp.m_lev * mtmp.m_lev;
    /*  For higher ac values, give extra experience */
    if ((i = find_mac(mtmp)) < 3) {
        tmp += (7 - i) * ((i < 0) ? 2 : 1);
    }
    /*  For very fast monsters, give extra experience */
    if (ptr.mmove > 12) {
        tmp += (ptr.mmove > (Math.trunc(3 * 12 / 2))) ? 5 : 3;
    }
    for (i = 0; i < 6; i++) {
        /*  For each "special" attack type give extra experience */
        tmp2 = ptr.mattk[i].aatyp;
        if (tmp2 > 4) {
            if (tmp2 == 254) {
                tmp += 5;
            } else if (tmp2 == 255) {
                tmp += 10;
            } else {
                tmp += 3;
            }
        }
    }
    for (i = 0; i < 6; i++) {
        /*  For each "special" damage type give extra experience */
        tmp2 = ptr.mattk[i].adtyp;
        if (tmp2 > 0 && tmp2 < 11) {
            tmp += 2 * mtmp.m_lev;
        } else if ((tmp2 == 15) || (tmp2 == 18) || (tmp2 == 40)) {
            tmp += 50;
        } else if (tmp2 != 0) {
            tmp += mtmp.m_lev;
        }
        /* extra heavy damage bonus */
        if ((ptr.mattk[i].damd * ptr.mattk[i].damn) > 23) {
            tmp += mtmp.m_lev;
        }
        if (tmp2 == 28 && ptr.mlet == S_EEL && !(game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0))) {
            tmp += 1000;
        }
    }
    /*  For certain "extra nasty" monsters, give even more */
    if ((((ptr).mflags2 & 33554432) != 0)) {
        tmp += (7 * mtmp.m_lev);
    }
    /*  For higher level monsters, an additional bonus is given */
    if (mtmp.m_lev > 8) {
        tmp += 50;
    }
    /* Mail daemons put up no fight. */
    if (mtmp.data == game.mons[PM_MAIL_DAEMON]) {
        tmp = 1;
    }
    if (mtmp.mrevived || mtmp.mcloned) {
        for (i = 0 , tmp2 = 20; nk > tmp2 && tmp > 1; ++i) {
            /*
         *      Reduce experience awarded for repeated killings of
         *      "the same monster".  Kill count includes all of this
         *      monster's type which have been killed--including the
         *      current monster--regardless of how they were created.
         *        1.. 20        full experience
         *       21.. 40        xp / 2
         *       41.. 80        xp / 4
         *       81..120        xp / 8
         *      121..180        xp / 16
         *      181..240        xp / 32
         *      241..255+       xp / 64
         */
            tmp = Math.trunc((tmp + 1) / 2);
            nk -= tmp2;
            if (i & 1) {
                tmp2 += 20;
            }
        }
    }
    return (tmp);
}
export function more_experienced(exper, rexp) {
    let oldexp = game.u.uexp;
    let oldrexp = game.u.urexp;
    let newexp = oldexp + exper;
    let rexpincr = 4 * exper + rexp;
    let newrexp = oldrexp + rexpincr;
    /* cap experience and score on wraparound */
    if (newexp < 0 && exper > 0) {
        newexp = 9223372036854775807;
    }
    if (newrexp < 0 && rexpincr > 0) {
        newrexp = 9223372036854775807;
    }
    if (newexp != oldexp) {
        game.u.uexp = newexp;
        if (game.flags.showexp) {
            game.disp.botl = (1);
        }
        /* even when experience points aren't being shown, experience level
           might be highlighted with a percentage highlight rule and that
           percentage depends upon experience points */
        if (!game.disp.botl && exp_percent_changing()) {
            game.disp.botl = (1);
        }
    }
    if (newrexp != oldrexp) {
        /* newrexp will always differ from oldrexp unless they're LONG_MAX */
        game.u.urexp = newrexp;
    }
    if (game.u.urexp >= ((game.urole.mnum == (PM_WIZARD)) ? 1000 : 2000)) {
        game.flags.beginner = (0);
    }
}
/* e.g., hit by drain life attack */
/* cause of death, if drain should be fatal */
export function losexp(drainer) {
    let num = 0;
    let uhpmin = 0;
    let olduhpmax = 0;
    /* override life-drain resistance when handling an explicit
       wizard mode request to reduce level; never fatal though */
    if (drainer && !strcmp(drainer, "#levelchange")) {
        drainer = null;
    } else if (resists_drli(game.youmonst)) {
        return;
    }
    /* level-loss message; "Goodbye level 1." is fatal; divine anger
       (drainer==NULL) resets a level 1 character to 0 experience points
       without reducing level and that isn't fatal so suppress the message
       in that situation */
    if (game.u.ulevel > 1 || drainer) {
        pline("%s level %d.", Goodbye(), game.u.ulevel);
    }
    if (game.u.ulevel > 1) {
        game.u.ulevel -= 1;
        /* remove intrinsic abilities */
        adjabil(game.u.ulevel + 1, game.u.ulevel);
        livelog_printf(4096, "lost experience level %d", game.u.ulevel + 1);
        ;
    } else {
        if (drainer) {
            game.killer.format = 1;
            if (game.killer.name != drainer) {
                game.killer.name = strcpy(game.killer.name, drainer);
            }
            done(DIED);
        }
        if (game.u.ulevel > 1) {
            return;
        }
        game.u.uexp = 0;
        livelog_printf(4096, "lost all experience");
    }
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    olduhpmax = game.u.uhpmax;
    /* same minimum as is used by life-saving */
    uhpmin = minuhpmax(10);
    num = game.u.uhpinc[game.u.ulevel];
    game.u.uhpmax -= num;
    if (game.u.uhpmax < uhpmin) {
        setuhpmax(uhpmin, (1));
    }
    /* uhpmax might try to go up if it has previously been reduced by
       strength loss or by a fire trap or by an attack by Death which
       all use a different minimum than life-saving or experience loss;
       we don't allow it to go up because that contradicts assumptions
       elsewhere (such as healing wielder who drains with Stormbringer) */
    if (game.u.uhpmax > olduhpmax) {
        setuhpmax(olduhpmax, (1));
    }
    game.u.uhp -= num;
    if (game.u.uhp < 1) {
        game.u.uhp = 1;
    } else if (game.u.uhp > game.u.uhpmax) {
        game.u.uhp = game.u.uhpmax;
    }
    num = game.u.ueninc[game.u.ulevel];
    game.u.uenmax -= num;
    if (game.u.uenmax < 0) {
        game.u.uenmax = 0;
    }
    game.u.uen -= num;
    if (game.u.uen < 0) {
        game.u.uen = 0;
    } else if (game.u.uen > game.u.uenmax) {
        game.u.uen = game.u.uenmax;
    }
    if (game.u.uexp > 0) {
        game.u.uexp = newuexp(game.u.ulevel) - 1;
    }
    if ((game.u.umonnum != game.u.umonster)) {
        num = monhp_per_lvl(game.youmonst);
        game.u.mhmax -= num;
        game.u.mh -= num;
        if (game.u.mh <= 0) {
            rehumanize();
        }
    }
    game.disp.botl = (1);
}
/*
 * Make experience gaining similar to AD&D(tm), whereby you can at most go
 * up by one level at a time, extra expr possibly helping you along.
 * After all, how much real experience does one get shooting a wand of death
 * at a dragon created with a wand of polymorph??
 */
export function newexplevel() {
    if (game.u.ulevel < 30 && game.u.uexp >= newuexp(game.u.ulevel)) {
        pluslvl((1));
    }
}
/* True: incremental experience growth;
                   * False: potion of gain level or wraith corpse
                   *        or wizard mode #levelchange */
export function pluslvl(incr) {
    let hpinc = 0;
    let eninc = 0;
    if (!incr) {
        You_feel("more experienced.");
    }
    if ((game.u.umonnum != game.u.umonster)) {
        /* increase hit points (when polymorphed, do monster form first
       in order to retain normal human/whatever increase for later) */
        hpinc = monhp_per_lvl(game.youmonst);
        game.u.mh += hpinc;
        /* acts as setmhmax() when Upolyd */
        setuhpmax(game.u.mhmax, (0));
    }
    hpinc = newhp();
    game.u.uhp += hpinc;
    /* will lower u.uhp if it exceeds
                                        * u.uhpmax */
    setuhpmax(game.u.uhpmax + hpinc, (1));
    /* increase spell power/energy points */
    eninc = newpw();
    game.u.uenmax += eninc;
    if (game.u.uenmax > game.u.uenpeak) {
        game.u.uenpeak = game.u.uenmax;
    }
    game.u.uen += eninc;
    if (game.u.ulevel < 30) {
        /* increase level (unless already maxxed) */
        let old_ach_cnt = 0;
        let newrank = 0;
        let oldrank = xlev_to_rank(game.u.ulevel);
        if (incr) {
            /* increase experience points to reflect new level */
            let tmp = newuexp(game.u.ulevel + 1);
            if (game.u.uexp >= tmp) {
                game.u.uexp = tmp - 1;
            }
        } else {
            game.u.uexp = newuexp(game.u.ulevel);
        }
        ++game.u.ulevel;
        pline("Welcome %sto experience level %d.", (game.u.ulevelmax < game.u.ulevel) ? "" : "back ", game.u.ulevel);
        if (game.u.ulevelmax < game.u.ulevel) {
            game.u.ulevelmax = game.u.ulevel;
        }
        adjabil(game.u.ulevel - 1, game.u.ulevel);
        ;
        old_ach_cnt = count_achievements();
        newrank = xlev_to_rank(game.u.ulevel);
        if (newrank > oldrank) {
            record_achievement(achieve_rank(newrank));
        }
        /* a new rank achievement will log its own message; log a simpler
           message here if we didn't just get an achievement (so when rank
           hasn't changed or hero just regained a lost level and the rank
           achievement doesn't get repeated) */
        if (count_achievements() == old_ach_cnt) {
            livelog_printf(4096, "%sgained experience level %d", (game.u.ulevel <= game.u.ulevelpeak) ? "re" : "", game.u.ulevel);
        }
        if (game.u.ulevel > game.u.ulevelpeak) {
            game.u.ulevelpeak = game.u.ulevel;
        }
    }
    game.disp.botl = (1);
}
/* compute a random amount of experience points suitable for the hero's
   experience level:  base number of points needed to reach the current
   level plus a random portion of what it takes to get to the next level */
/* gaining XP via potion vs setting XP for polyself */
export function rndexp(gaining) {
    let minexp = 0;
    let maxexp = 0;
    let diff = 0;
    let factor = 0;
    let result = 0;
    minexp = (game.u.ulevel == 1) ? 0 : newuexp(game.u.ulevel - 1);
    maxexp = newuexp(game.u.ulevel);
    diff = maxexp - minexp , factor = 1;
    /* make sure that `diff' is an argument which rn2() can handle */
    while (diff >= 32767) {
        diff = Math.trunc(diff / 2) , factor *= 2;
    }
    result = minexp + factor * rn2(diff);
    if (game.u.ulevel == 30 && gaining) {
        /* 3.4.1:  if already at level 30, add to current experience
       points rather than to threshold needed to reach the current
       level; otherwise blessed potions of gain level can result
       in lowering the experience points instead of raising them */
        result += (game.u.uexp - minexp);
        /* avoid wrapping (over 400 blessed potions needed for that...) */
        if (result < game.u.uexp) {
            result = game.u.uexp;
        }
    }
    return result;
}
/*exper.c*/
/* can happen during debug fuzzing if fuzzer_savelife() uses
               a blessed potion of restore ability to restore lost levels */
