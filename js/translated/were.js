/* NetHack 5.0	were.c	$NHDT-Date: 1766588485 2025/12/24 07:01:25 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.41 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You_feel, You_hear, pline } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcpy } from '../c2js-runtime/string.js';
import { night } from './calendar.js';
import { paranoid_query } from './cmd.js';
import { canseemon, newsym } from './display.js';
import { Mgender, Monnam, pmname } from './do_name.js';
import { tamedog } from './dog.js';
import { is_fainted } from './eat.js';
import { monster_nearby } from './hack.js';
import { makemon } from './makemon.js';
import { healmon, monnear, wake_nearto } from './mon.js';
import { set_mon_data } from './mondata.js';
import { monflee, onscary } from './monmove.js';
import { DEAF, HALLUC, HALLUC_RES, LOW_PM, NEUTRAL, NON_PM, PM_COYOTE, PM_FOX, PM_GIANT_RAT, PM_HUMAN_WEREJACKAL, PM_HUMAN_WERERAT, PM_HUMAN_WEREWOLF, PM_JACKAL, PM_RABID_RAT, PM_SEWER_RAT, PM_WARG, PM_WEREJACKAL, PM_WERERAT, PM_WEREWOLF, PM_WINTER_WOLF, PM_WINTER_WOLF_CUB, PM_WOLF, POLYMORPH_CONTROL, PROT_FROM_SHAPE_CHANGERS, STUNNED, UNCHANGING } from './nh-constants.js';
import { an } from './objnam.js';
import { polymon, rehumanize, set_uasmon } from './polyself.js';
import { rn2, rnd } from './rnd.js';
import { unconscious } from './trap.js';
import { possibly_unwield } from './weapon.js';
import { mon_break_armor } from './worn.js';

export function were_change(mon) {
    if (!(((mon.data).mflags2 & 4) != 0)) {
        /* `+4' => skip "were" prefix to get name of beast */
        return;
    }
    if ((((mon.data).mflags2 & 8) != 0)) {
        if (!(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && !rn2(night() ? (game.flags.moonphase == 4 ? 3 : 30) : (game.flags.moonphase == 4 ? 10 : 50))) {
            /* change back into human form */
            new_were(mon);
            game.were_changes++;
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !canseemon(mon)) {
                let howler = null;
                switch (((mon.data).pmidx)) {
                    case PM_WEREWOLF:
                        howler = "wolf";
                        break;
                    case PM_WEREJACKAL:
                        howler = "jackal";
                        break;
                    default:
                        howler = null;
                        break;
                }
                if (howler) {
                    ;
                    You_hear("a %s howling at the moon.", howler);
                    wake_nearto(mon.mx, mon.my, 4 * 4);
                }
            }
        }
    } else if (!rn2(30) || (game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
        new_were(mon);
        game.were_changes++;
    }
}
export function counter_were(pm) {
    switch (pm) {
        case PM_WEREWOLF:
            return PM_HUMAN_WEREWOLF;
        case PM_HUMAN_WEREWOLF:
            return PM_WEREWOLF;
        case PM_WEREJACKAL:
            return PM_HUMAN_WEREJACKAL;
        case PM_HUMAN_WEREJACKAL:
            return PM_WEREJACKAL;
        case PM_WERERAT:
            return PM_HUMAN_WERERAT;
        case PM_HUMAN_WERERAT:
            return PM_WERERAT;
        default:
            return NON_PM;
    }
}
/* convert monsters similar to werecritters into appropriate werebeast */
export function were_beastie(pm) {
    switch (pm) {
        case PM_WERERAT:
        case PM_SEWER_RAT:
        case PM_GIANT_RAT:
        case PM_RABID_RAT:
            return PM_WERERAT;
        case PM_WEREJACKAL:
        case PM_JACKAL:
        case PM_FOX:
        case PM_COYOTE:
            return PM_WEREJACKAL;
        case PM_WEREWOLF:
        case PM_WOLF:
        case PM_WARG:
        case PM_WINTER_WOLF:
        case PM_WINTER_WOLF_CUB:
            return PM_WEREWOLF;
        default:
            break;
    }
    return NON_PM;
}
export function new_were(mon) {
    let pm = 0;
    /* neither hero nor werecreature can change from human form to
       critter form if hero has Protection_from_shape_changers extrinsic;
       if already in critter form, always change to human form for that */
    if ((game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && (((mon.data).mflags2 & 8) != 0)) {
        return;
    }
    pm = counter_were(((mon.data).pmidx));
    if (pm < LOW_PM) {
        impossible("unknown lycanthrope %s.", mon.data.pmnames[NEUTRAL]);
        return;
    }
    if (canseemon(mon) && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        pline("%s changes into a %s.", Monnam(mon), (((game.mons[pm]).mflags2 & 8) != 0) ? "human" : pmname(game.mons[pm], Mgender(mon)) + 4);
    }
    set_mon_data(mon, game.mons[pm]);
    if (((mon).msleeping || !(mon).mcanmove)) {
        /* pmname()+4: skip past "were" prefix */
        /* transformation wakens and/or revitalizes */
        mon.msleeping = 0;
        mon.mfrozen = 0;
        mon.mcanmove = 1;
    }
    /* regenerate by 1/4 of the lost hit points */
    healmon(mon, Math.trunc((mon.mhpmax - mon.mhp) / 4), 0);
    newsym(mon.mx, mon.my);
    mon_break_armor(mon, (0));
    possibly_unwield(mon, (0));
    /* vision capability isn't changing so we don't call set_apparxy() to
       update mon's idea of where hero is; peaceful check is redundant */
    if (game.context.mon_moving && !mon.mpeaceful && onscary(mon.mux, mon.muy, mon) && monnear(mon, mon.mux, mon.muy)) {
        monflee(mon, (rn2(9) + (2)), (1), (1));
    }
}
/* were-creature (even you) summons a horde */
/* number of visible helpers created */
export function were_summon(ptr, yours, visible, genbuf) {
    let i = 0;
    let typ = 0;
    let pm = ((ptr).pmidx);
    let mtmp = null;
    let total = 0;
    visible.value = 0;
    if ((game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && !yours) {
        return 0;
    }
    for (i = rnd(5); i > 0; i--) {
        switch (pm) {
            case PM_WERERAT:
            case PM_HUMAN_WERERAT:
                typ = rn2(3) ? PM_SEWER_RAT : rn2(3) ? PM_GIANT_RAT : PM_RABID_RAT;
                if (genbuf) {
                    genbuf = strcpy(genbuf, "rat");
                }
                break;
            case PM_WEREJACKAL:
            case PM_HUMAN_WEREJACKAL:
                typ = rn2(7) ? PM_JACKAL : rn2(3) ? PM_COYOTE : PM_FOX;
                if (genbuf) {
                    genbuf = strcpy(genbuf, "jackal");
                }
                break;
            case PM_WEREWOLF:
            case PM_HUMAN_WEREWOLF:
                typ = rn2(5) ? PM_WOLF : rn2(2) ? PM_WARG : PM_WINTER_WOLF;
                if (genbuf) {
                    genbuf = strcpy(genbuf, "wolf");
                }
                break;
            default:
                continue;
        }
        mtmp = makemon(game.mons[typ], game.u.ux, game.u.uy, 0);
        if (mtmp) {
            total++;
            if (canseemon(mtmp)) {
                visible.value += 1;
            }
        }
        if (yours && mtmp) {
            tamedog(mtmp, null, (0));
        }
    }
    return total;
}
export function you_were() {
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let controllable_poly = (game.u.uprops[POLYMORPH_CONTROL].intrinsic || game.u.uprops[POLYMORPH_CONTROL].extrinsic) && !(game.u.uprops[STUNNED].intrinsic || (game.multi < 0 && (unconscious() || is_fainted())));
    if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) || game.u.umonnum == game.u.ulycn) {
        return;
    }
    if (controllable_poly) {
        qbuf = sprintf(qbuf, "Do you want to change into %s?", an(game.mons[game.u.ulycn].pmnames[NEUTRAL] + 4));
        if (!paranoid_query(((game.flags.paranoia_bits & 256) != 0), qbuf)) {
            return;
        }
    } else if (monster_nearby()) {
        return;
    }
    game.were_changes++;
    polymon(game.u.ulycn);
}
export function you_unwere(purify) {
    let controllable_poly = (game.u.uprops[POLYMORPH_CONTROL].intrinsic || game.u.uprops[POLYMORPH_CONTROL].extrinsic) && !(game.u.uprops[STUNNED].intrinsic || (game.multi < 0 && (unconscious() || is_fainted())));
    if (purify) {
        You_feel("purified.");
        set_ulycn(NON_PM);
    }
    /* 40% of initial were change */
    if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && (((game.youmonst.data).mflags2 & 4) != 0) && !monster_nearby() && (!controllable_poly || !paranoid_query(((game.flags.paranoia_bits & 256) != 0), "Remain in beast form?"))) {
        rehumanize();
    } else if ((((game.youmonst.data).mflags2 & 4) != 0) && !game.u.mtimedone) {
        game.u.mtimedone = (rn2(200) + (200));
    }
}
/* lycanthropy is being caught or cured, but no shape change is involved */
export function set_ulycn(which) {
    game.u.ulycn = which;
    /* add or remove lycanthrope's innate intrinsics (Drain_resistance) */
    set_uasmon();
}
/*were.c*/
