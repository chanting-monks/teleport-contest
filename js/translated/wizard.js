/* NetHack 5.0	wizard.c	$NHDT-Date: 1741407262 2025/03/07 20:14:22 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.116 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2016. */
/* NetHack may be freely redistributed.  See license for details. */
/* wizard code - inspired by rogue code from Merlyn Leroy (digi-g!brian) */
/*             - heavily modified to give the wiz balls.  (genat!mike)   */
/*             - dewimped and given some maledictions. -3. */
/*             - generalized for 3.1 (mike@bullns.on01.bull.ca) */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { You, You_feel, pline, verbalize } from '../c2js-runtime/pline.js';
import { strcmp, strncmp, strrchr } from '../c2js-runtime/string.js';
import { isok } from './cmd.js';
import { c_color_names } from './decl.js';
import { newsym } from './display.js';
import { Monnam, hcolor } from './do_name.js';
import { mon_arrive, mon_catchup_elapsed_time } from './dog.js';
import { def_monsyms } from './drawing.js';
import { In_W_tower, In_hell, builds_up, on_level } from './dungeon.js';
import { dist2 } from './hacklib.js';
import { makemon, set_malign, unmakemon } from './makemon.js';
import { expels } from './mhitu.js';
import { monster_census, msummon } from './minion.js';
import { add_to_minv, mksobj, obj_extract_self } from './mkobj.js';
import { healmon, mnearto, mnexto, monnear, wake_nearto } from './mon.js';
import { attacktype, big_to_little } from './mondata.js';
import { AMULET_OF_YENDOR, ART_ORB_OF_DETECTION, BELL_OF_OPENING, BLINDED, CANDELABRUM_OF_INVOCATION, DEAF, FAKE_AMULET_OF_YENDOR, MAGIC_PORTAL, M_AP_MONSTER, NEUTRAL, PM_ALEAX, PM_ARCHON, PM_ARCH_LICH, PM_BALUCHITHERIUM, PM_BARBED_DEVIL, PM_BLACK_DRAGON, PM_CAPTAIN, PM_CARNIVOROUS_APE, PM_COCKATRICE, PM_COUATL, PM_DISENCHANTER, PM_DISPLACER_BEAST, PM_ELF_NOBLE, PM_ELVEN_MONARCH, PM_ETTIN, PM_FIRE_ELEMENTAL, PM_FIRE_GIANT, PM_FLOATING_EYE, PM_GENETIC_ENGINEER, PM_GREEN_DRAGON, PM_GREEN_SLIME, PM_GREMLIN, PM_GUARDIAN_NAGA, PM_HORNED_DEVIL, PM_HUMAN, PM_IRON_GOLEM, PM_JABBERWOCK, PM_LEOCROTTA, PM_MASTER_MIND_FLAYER, PM_MINOTAUR, PM_OCHRE_JELLY, PM_OGRE_TYRANT, PM_OLOG_HAI, PM_ORANGE_DRAGON, PM_OWLBEAR, PM_PURPLE_WORM, PM_RED_DRAGON, PM_SILVER_DRAGON, PM_STALKER, PM_STORM_GIANT, PM_TRAPPER, PM_TROLL, PM_UMBER_HULK, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_WATER_DEMON, PM_WINGED_GARGOYLE, PM_WIZARD_OF_YENDOR, PM_XAN, PM_XORN, PM_YELLOW_DRAGON, PM_ZRUTY, PROT_FROM_SHAPE_CHANGERS, SPE_BOOK_OF_THE_DEAD, S_ANGEL, S_DEMON } from './nh-constants.js';
import { Tobjnam, distant_name, doname } from './objnam.js';
import { inhistemple, mon_aligntyp } from './priest.js';
import { com_pager } from './questpgr.js';
import { rn2, rnd } from './rnd.js';
import { inhishop } from './shk.js';
import { rndcurse } from './sit.js';
import { stairway_find_type_dir } from './stairs.js';
import { mpickobj } from './steal.js';
import { enexto, noteleport_level, rloc, rloc_to } from './teleport.js';

/* other_mon_has_arti() won't blow up if passed a NULL monst,
 * but its caller target_on() passes it a nonnull monst;
 * it may return a NULL monst pointer */
/* might return NULL obj pointer */
/* adding more neutral creatures will tend to reduce the number of monsters
   summoned by nasty(); adding more lawful creatures will reduce the number
   of monsters summoned by lawfuls; adding more chaotic creatures will reduce
   the number of monsters summoned by chaotics; prior to 3.6.1, there were
   only four lawful candidates, so lawful summoners tended to summon more
   (trying to get lawful or neutral but obtaining chaotic instead) than
   their chaotic counterparts */
const nasties = [PM_COCKATRICE, PM_ETTIN, PM_STALKER, PM_MINOTAUR, PM_OWLBEAR, PM_PURPLE_WORM, PM_XAN, PM_UMBER_HULK, PM_XORN, PM_ZRUTY, PM_LEOCROTTA, PM_BALUCHITHERIUM, PM_CARNIVOROUS_APE, PM_FIRE_ELEMENTAL, PM_JABBERWOCK, PM_IRON_GOLEM, PM_OCHRE_JELLY, PM_GREEN_SLIME, PM_DISPLACER_BEAST, PM_GENETIC_ENGINEER, PM_BLACK_DRAGON, PM_RED_DRAGON, PM_ARCH_LICH, PM_VAMPIRE_LEADER, PM_MASTER_MIND_FLAYER, PM_DISENCHANTER, PM_WINGED_GARGOYLE, PM_STORM_GIANT, PM_OLOG_HAI, PM_ELF_NOBLE, PM_ELVEN_MONARCH, PM_OGRE_TYRANT, PM_CAPTAIN, PM_GREMLIN, PM_SILVER_DRAGON, PM_ORANGE_DRAGON, PM_GREEN_DRAGON, PM_YELLOW_DRAGON, PM_GUARDIAN_NAGA, PM_FIRE_GIANT, PM_ALEAX, PM_COUATL, PM_HORNED_DEVIL, PM_BARBED_DEVIL];
/* neutral */
/* chaotic */
/* lawful */
/* (Archons, titans, ki-rin, and golden nagas are suitably nasty, but
       they're summoners so would aggravate excessive summoning) */
const wizapp = [PM_HUMAN, PM_WATER_DEMON, PM_VAMPIRE, PM_RED_DRAGON, PM_TROLL, PM_UMBER_HULK, PM_XORN, PM_XAN, PM_COCKATRICE, PM_FLOATING_EYE, PM_GUARDIAN_NAGA, PM_TRAPPER];
/* If you've found the Amulet, make the Wizard appear after some time */
/* Also, give hints about portal locations, if amulet is worn/wielded -dlc */
export async function amulet() {
    let mtmp = null;
    let ttmp = null;
    let amu = null;
    if ((((amu = game.uamul) != null && amu.otyp == AMULET_OF_YENDOR) || ((amu = game.uwep) != null && amu.otyp == AMULET_OF_YENDOR)) && !rn2(15)) {
        for (ttmp = game.ftrap; ttmp; ttmp = ttmp.ntrap) {
            if (ttmp.ttyp == MAGIC_PORTAL) {
                /* caller takes care of this check */
                let du = dist2((ttmp.tx), (ttmp.ty), game.u.ux, game.u.uy);
                if (du <= 9) {
                    await pline("%s hot!", await Tobjnam(amu, "feel"));
                } else if (du <= 64) {
                    await pline("%s very warm.", await Tobjnam(amu, "feel"));
                } else if (du <= 144) {
                    await pline("%s warm.", await Tobjnam(amu, "feel"));
                }
                /* else, the amulet feels normal */
                break;
            }
        }
    }
    if (!game.context.no_of_wizards) {
        return;
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        /* find Wizard, and wake him if necessary */
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (mtmp.iswiz && mtmp.msleeping && !rn2(40)) {
            mtmp.msleeping = 0;
            if (!(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
                await You("get the creepy feeling that somebody noticed your taking the Amulet.");
            }
            return;
        }
    }
}
export function mon_has_amulet(mtmp) {
    let otmp = null;
    for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == AMULET_OF_YENDOR) {
            return 1;
        }
    }
    return 0;
}
export function mon_has_special(mtmp) {
    let otmp = null;
    for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == AMULET_OF_YENDOR || ((otmp).oartifact >= ART_ORB_OF_DETECTION) || otmp.otyp == BELL_OF_OPENING || otmp.otyp == CANDELABRUM_OF_INVOCATION || otmp.otyp == SPE_BOOK_OF_THE_DEAD) {
            return 1;
        }
    }
    return 0;
}
/*
 *      New for 3.1  Strategy / Tactics for the wiz, as well as other
 *      monsters that are "after" something (defined via mflag3).
 *
 *      The strategy section decides *what* the monster is going
 *      to attempt, the tactics section implements the decision.
 */
export function which_arti(mask) {
    switch (mask) {
        /* panic time - mtmp is almost snuffed */
        /* the wiz is less cautious */
        case 1:
            return AMULET_OF_YENDOR;
        case 2:
            return BELL_OF_OPENING;
        case 8:
            return CANDELABRUM_OF_INVOCATION;
        case 4:
            return SPE_BOOK_OF_THE_DEAD;
        /* perhaps a shopkeeper has been polymorphed into a master
           lich; we don't want it teleporting to the stairs to heal
           because that will leave its shop untended */
        /* likewise for temple priests */
        default:
            break;
    }
    return 0;
}
/*
 *      If "otyp" is zero, it triggers a check for the quest_artifact,
 *      since bell, book, candle, and amulet are all objects, not really
 *      artifacts right now.  [MRS]
 */
export function mon_has_arti(mtmp, otyp) {
    let otmp = null;
    for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
        if (otyp) {
            if (otmp.otyp == otyp) {
                return 1;
            }
        } else if (((otmp).oartifact >= ART_ORB_OF_DETECTION)) {
            return 1;
        }
    }
    return 0;
}
/*
 * Returns some monster other than mtmp that
 * has artifact, or NULL monst pointer.
 */
export function other_mon_has_arti(mtmp, otyp) {
    let mtmp2 = null;
    for (mtmp2 = game.level.monlist; mtmp2; mtmp2 = mtmp2.nmon) {
        if (mtmp2 != mtmp) {
            if (mon_has_arti(mtmp2, otyp)) {
                return mtmp2;
            }
        }
    }
    return null;
}
/*
 * Returns obj of type specified if there is one
 * on the ground, otherwise returns NULL obj pointer.
 */
export function on_ground(otyp) {
    let otmp = null;
    for (otmp = game.level.objlist; otmp; otmp = otmp.nobj) {
        if (otyp) {
            if (otmp.otyp == otyp) {
                return otmp;
            }
        } else if (((otmp).oartifact >= ART_ORB_OF_DETECTION)) {
            return otmp;
        }
    }
    return null;
}
export function you_have(mask) {
    switch (mask) {
        case 1:
            return game.u.uhave.amulet;
        case 2:
            return game.u.uhave.bell;
        case 8:
            return game.u.uhave.menorah;
        case 4:
            return game.u.uhave.book;
        case 16:
            return game.u.uhave.questart;
        default:
            break;
    }
    return 0;
}
export function target_on(mask, mtmp) {
    let otyp = 0;
    let otmp = null;
    let mtmp2 = null;
    if (!(mtmp.data.mflags3 & (mask))) {
        return 0;
    }
    otyp = which_arti(mask);
    if (!mon_has_arti(mtmp, otyp)) {
        if (you_have(mask)) {
            mtmp.mgoal.x = game.u.ux;
            mtmp.mgoal.y = game.u.uy;
            return (16777216 | mask);
        } else if ((otmp = on_ground(otyp))) {
            mtmp.mgoal.x = otmp.ox;
            mtmp.mgoal.y = otmp.oy;
            return (67108864 | mask);
        } else if ((mtmp2 = other_mon_has_arti(mtmp, otyp)) != null && (otyp != AMULET_OF_YENDOR || (!mtmp2.iswiz && !inhistemple(mtmp2)))) {
            /* when seeking the Amulet, avoid targeting the Wizard
                    or temple priests (to protect Moloch's high priest) */
            mtmp.mgoal.x = mtmp2.mx;
            mtmp.mgoal.y = mtmp2.my;
            return (33554432 | mask);
        }
    }
    mtmp.mgoal.x = mtmp.mgoal.y = 0;
    return 0;
}
export function strategy(mtmp) {
    let strat = 0;
    let dstrat = 0;
    if (!(((mtmp.data).mflags3 & 31)) || (mtmp.isshk && inhishop(mtmp)) || (mtmp.ispriest && inhistemple(mtmp))) {
        return 0;
    }
    switch (Math.trunc((mtmp.mhp * 3) / mtmp.mhpmax)) {
        default:
        /* cases 0 and 5 don't apply on the Astral level */
        case 0:
            return 134217728;
        case 1:
            if (mtmp.data != game.mons[PM_WIZARD_OF_YENDOR]) {
                return 134217728;
            }
            ;
        case 2:
            dstrat = 134217728;
            break;
        case 3:
            dstrat = 0;
            break;
    }
    if (game.context.made_amulet) {
        if ((strat = target_on(1, mtmp)) != 0) {
            return strat;
        }
    }
    if (game.u.uevent.invoked) {
        /* priorities change once gate opened */
        if ((strat = target_on(16, mtmp)) != 0) {
            return strat;
        }
        if ((strat = target_on(4, mtmp)) != 0) {
            return strat;
        }
        if ((strat = target_on(2, mtmp)) != 0) {
            return strat;
        }
        if ((strat = target_on(8, mtmp)) != 0) {
            return strat;
        }
    } else {
        if ((strat = target_on(4, mtmp)) != 0) {
            return strat;
        }
        if ((strat = target_on(2, mtmp)) != 0) {
            return strat;
        }
        if ((strat = target_on(8, mtmp)) != 0) {
            return strat;
        }
        if ((strat = target_on(16, mtmp)) != 0) {
            return strat;
        }
    }
    return dstrat;
}
/* pick a destination for a covetous monster to flee to so that it can
   heal or for guardians (Kops) to congregate at to block hero's progress */
/* output; left as-is if no spot found */
/* True: forward, False: backtrack (usually up) */
export async function choose_stairs(sx, sy, dir) {
    let stway = null;
    let stdir = await builds_up(game.u.uz) ? dir : !dir;
    /* look for stairs in direction 'stdir' (True: up, False: down) */
    stway = stairway_find_type_dir((0), stdir);
    if (!stway) {
        /* no stairs; look for ladder it that direction */
        stway = stairway_find_type_dir((1), stdir);
        if (!stway) {
            /* no ladder either; look for branch stairs or ladder in any
               direction */
            for (stway = game.stairs; stway; stway = stway.next) {
                if (stway.tolev.dnum != game.u.uz.dnum) {
                    /* note: there might be a second Wizard; if so,
                       he'll have to wait until the next resurrection */
                    break;
                }
            }
            if (!stway) {
                /* if no branch stairs/ladder, check for regular stairs in
               opposite direction, then for regular ladder if necessary */
                stway = stairway_find_type_dir((0), !stdir);
                if (!stway) {
                    stway = stairway_find_type_dir((1), !stdir);
                }
            }
        }
    }
    if (stway) {
        sx.value = stway.sx , sy.value = stway.sy;
    }
}
export async function tactics(mtmp) {
    let strat = strategy(mtmp);
    let sx = 0;
    let sy = 0;
    let mx = 0;
    let my = 0;
    mtmp.mstrategy = (mtmp.mstrategy & ((268435456 | 536870912) | 2147483648)) | strat;
    switch (strat) {
        case 134217728:
            mx = mtmp.mx , my = mtmp.my;
            if (game.u.uswallow && game.u.ustuck == mtmp) {
                await expels(mtmp, mtmp.data, (1));
            }
            await choose_stairs({ get value() { return sx; }, set value(_v) { sx = _v; } }, { get value() { return sy; }, set value(_v) { sy = _v; } }, (mtmp.m_id % 2));
            /* covetous monsters attack while fleeing */
            mtmp.mavenge = 1;
            if (await In_W_tower(mx, my, game.u.uz) || (mtmp.iswiz && !sx && !mon_has_amulet(mtmp))) {
                if (!await noteleport_level(mtmp) && !rn2(3 + Math.trunc(mtmp.mhp / 10))) {
                    await rloc(mtmp, 2);
                }
            } else if (sx && (mx != sx || my != sy)) {
                if (!await noteleport_level(mtmp) && !await mnearto(mtmp, sx, sy, (1), 2)) {
                    await rloc_to(mtmp, mx, my);
                    /* simply wants you to close */
                    return 0;
                }
                mx = mtmp.mx , my = mtmp.my;
            }
            if (dist2((mx), (my), game.u.ux, game.u.uy) > (8 * 8)) {
                if (mtmp.mhp <= mtmp.mhpmax - 8) {
                    await healmon(mtmp, rnd(8), 0);
                    return 1;
                }
            }
            ;
        case 0:
            if (!await noteleport_level(mtmp) && !rn2(!mtmp.mflee ? 5 : 33)) {
                await mnexto(mtmp, 2);
            }
            return 0;
        default:
{
                let where = (strat & 251658240);
                let tx = mtmp.mgoal.x;
                let ty = mtmp.mgoal.y;
                let targ = (strat & 255);
                let otmp = null;
                if (!targ || !isok(tx, ty)) {
                    return 0;
                }
                if (await noteleport_level(mtmp) && !monnear(mtmp, tx, ty)) {
                    return 0;
                }
                if (((tx) == game.u.ux && (ty) == game.u.uy) || where == 16777216) {
                    /* player is standing on it (or has it) */
                    /* a monster has it - 'port beside it. */
                    mx = mtmp.mx , my = mtmp.my;
                    if (await noteleport_level(mtmp) || !await mnearto(mtmp, tx, ty, (0), 2)) {
                        await rloc_to(mtmp, mx, my);
                    }
                    return 0;
                }
                if (where == 67108864) {
                    if (!(game.level.monsters[tx][ty] != null) || (mtmp.mx == tx && mtmp.my == ty)) {
                        await rloc_to(mtmp, tx, ty);
                        if ((otmp = on_ground(which_arti(targ))) != null) {
                            if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                                await pline("%s picks up %s.", await Monnam(mtmp), await distant_name(otmp, doname));
                            }
                            await obj_extract_self(otmp);
                            await mpickobj(mtmp, otmp);
                            return 1;
                        } else {
                            return 0;
                        }
                    } else {
                        if (!rn2(5) && !await noteleport_level(mtmp)) {
                            await mnexto(mtmp, 2);
                        }
                        return 0;
                    }
                } else {
                    mx = mtmp.mx , my = mtmp.my;
                    if (!await noteleport_level(mtmp) && !await mnearto(mtmp, tx, ty, (0), 2)) {
                        await rloc_to(mtmp, mx, my);
                    }
                    return 0;
                }
            }
    }
    return 0;
}
/* are there any monsters mon could aggravate? */
export async function has_aggravatables(mon) {
    let mtmp = null;
    let in_w_tower = await In_W_tower(mon.mx, mon.my, game.u.uz);
    if (in_w_tower != await In_W_tower(game.u.ux, game.u.uy, game.u.uz)) {
        return (0);
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (in_w_tower != await In_W_tower(mtmp.mx, mtmp.my, game.u.uz)) {
            continue;
        }
        if ((mtmp.mstrategy & 536870912) != 0 || ((mtmp).msleeping || !(mtmp).mcanmove)) {
            return (1);
        }
    }
    return (0);
}
export async function aggravate() {
    let mtmp = null;
    let in_w_tower = await In_W_tower(game.u.ux, game.u.uy, game.u.uz);
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (in_w_tower != await In_W_tower(mtmp.mx, mtmp.my, game.u.uz)) {
            continue;
        }
        mtmp.mstrategy &= ~(536870912 | 2147483648);
        mtmp.msleeping = 0;
        if (!mtmp.mcanmove && !rn2(5)) {
            mtmp.mfrozen = 0;
            mtmp.mcanmove = 1;
        }
    }
}
/* "Double Trouble" spell cast by the Wizard; caller is responsible for
   only casting this when there is currently one wizard in existence;
   the clone can't use it unless/until its creator has been killed off */
export async function clonewiz() {
    let mtmp2 = null;
    if ((mtmp2 = await makemon(game.mons[PM_WIZARD_OF_YENDOR], game.u.ux, game.u.uy, 2)) != null) {
        mtmp2.msleeping = mtmp2.mtame = mtmp2.mpeaceful = 0;
        if (!game.u.uhave.amulet && rn2(2)) {
            await add_to_minv(mtmp2, await mksobj(FAKE_AMULET_OF_YENDOR, (1), (0)));
        }
        if (!(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
            mtmp2.m_ap_type = M_AP_MONSTER;
            mtmp2.mappearance = wizapp[rn2((Math.trunc(48 /* sizeof(const unsigned int [12]) */ / 4 /* sizeof(const unsigned int) */)))];
        }
        await newsym(mtmp2.mx, mtmp2.my);
    }
}
/* also used by newcham() */
/* if non-zero, try to make difficulty be lower than this */
export function pick_nasty(difcap) {
    let alt = 0;
    let res = nasties[rn2((Math.trunc(176 /* sizeof(const int [44]) */ / 4 /* sizeof(const int) */)))];
    /* To do?  Possibly should filter for appropriate forms when
     * in the elemental planes or surrounded by water or lava.
     *
     * We want monsters represented by uppercase on rogue level,
     * but we don't try very hard.
     */
    if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) && !(65 <= (def_monsyms[(game.mons[res]).mlet].sym) && (def_monsyms[(game.mons[res]).mlet].sym) <= 90)) {
        res = nasties[rn2((Math.trunc(176 /* sizeof(const int [44]) */ / 4 /* sizeof(const int) */)))];
    }
    /* if genocided or too difficult or out of place, try a substitute
       when a suitable one exists
           arch-lich -> master lich,
           master mind flayer -> mind flayer,
       but the substitutes are likely to be genocided too */
    alt = res;
    if ((game.mvitals[res].mvflags & 2) != 0 || (difcap > 0 && game.mons[res].difficulty >= difcap) || (game.mons[res].geno & (In_hell(game.u.uz) ? 2048 : 1024)) != 0) {
        alt = big_to_little(res);
    }
    if (alt != res && (game.mvitals[alt].mvflags & 2) == 0) {
        /* note: nasty() -> makemon() ignores G_HELL|G_NOHELL;
            arch-lich and master lich are both flagged as hell-only;
            this filtering demotes arch-lich to master lich when
            outside of Gehennom (unless the latter has been genocided) */
        let mnam = game.mons[alt].pmnames[NEUTRAL];
        let lastspace = strrchr(mnam, 32);
        /* only non-juveniles can become alternate choice */
        if (strncmp(mnam, "baby ", 5) && (!lastspace || (strcmp(lastspace, " hatchling") && strcmp(lastspace, " pup") && strcmp(lastspace, " cub")))) {
            res = alt;
        }
    }
    return res;
}
/* create some nasty monsters, aligned with the caster or neutral; chaotic
   and unaligned are treated as equivalent; if summoner is Null, this is
   for late-game harassment (after the Wizard has been killed at least once
   or the invocation ritual has been performed), in which case we treat
   'summoner' as neutral, since that will produce the greatest number of
   creatures on average (in 3.6.0 and earlier, Null was treated as chaotic);
   returns the number of monsters created */
export async function nasty(summoner) {
    let mtmp = null;
    let bypos = { x: 0, y: 0 };
    let i = 0;
    let j = 0;
    let count = 0;
    let census = 0;
    let tmp = 0;
    let makeindex = 0;
    let s_cls = 0;
    let m_cls = 0;
    let difcap = 0;
    let trylimit = 0;
    let castalign = 0;
    /* when a monster casts the "summon nasties" spell, it gives feedback;
       when random post-Wizard harassment casts that, we give feedback */
    let mmflags = summoner ? 131072 : 0;
    /* more than this can be created */
    /* some candidates may be created in groups, so simple count
       of non-null makemon() return is inadequate */
    census = monster_census((0));
    if (!rn2(10) && In_hell(game.u.uz)) {
        count = await msummon(null);
    } else {
        count = 0;
        s_cls = summoner ? summoner.data.mlet : 0;
        difcap = summoner ? summoner.data.difficulty : 0;
        castalign = summoner ? sgn(summoner.data.maligntyp) : 0;
        tmp = (game.u.ulevel > 3) ? Math.trunc(game.u.ulevel / 3) : 1;
        /* if we don't have a casting monster, nasties appear around hero,
           otherwise they'll appear around spot summoner thinks she's at */
        bypos.x = game.u.ux;
        bypos.y = game.u.uy;
        for (i = rnd(tmp); i > 0 && count < 10; --i) {
            for (j = 0; j < 20; j++) {
                nextj: {
                    /* Of the 44 nasties[], 10 are lawful, 14 are chaotic,
             * and 20 are neutral.  [These numbers are up date for
             * 5.0.0; the ones in the next paragraph are not....]
             *
             * Neutral caster, used for late-game harassment,
             * has 18/42 chance to stop the inner loop on each
             * critter, 24/42 chance for another iteration.
             * Lawful caster has 28/42 chance to stop unless the
             * summoner is an angel or demon, in which case the
             * chance is 26/42.
             * Chaotic or unaligned caster has 32/42 chance to
             * stop, so will summon fewer creatures on average.
             *
             * The outer loop potentially gives chaotic/unaligned
             * a chance to even things up since others will hit
             * MAXNASTIES sooner, but its number of iterations is
             * randomized so it won't always do so.
             */
                    /* Don't create more spellcasters of the monster's level or
                 * higher--avoids chain summoners filling up the level.
                 */
                    trylimit = 10 + 1;
                    do {
                        if (!--trylimit) {
                            break nextj;
                        }
                        /* break this loop, continue outer one */
                        makeindex = pick_nasty(difcap);
                        m_cls = game.mons[makeindex].mlet;
                    } while ((difcap > 0 && game.mons[makeindex].difficulty >= difcap && attacktype(game.mons[makeindex], 255)) || (s_cls == S_DEMON && m_cls == S_ANGEL) || (s_cls == S_ANGEL && m_cls == S_DEMON));
                    if (summoner && !await enexto(bypos, summoner.mux, summoner.muy, game.mons[makeindex])) {
                        continue;
                    }
                    if ((mtmp = await makemon(game.mons[makeindex], bypos.x, bypos.y, mmflags)) != null) {
                        /* this honors genocide but overrides extinction; it ignores
                   inside-hell-only (G_HELL) & outside-hell-only (G_NOHELL) */
                        mtmp.msleeping = mtmp.mpeaceful = mtmp.mtame = 0;
                        set_malign(mtmp);
                    } else {
                        if ((mtmp = await makemon(null, bypos.x, bypos.y, mmflags)) != null) {
                            /* random monster to substitute for geno'd selection;
                       unlike direct choice, not forced to be hostile [why?];
                       limit spellcasters to inhibit chain summoning */
                            m_cls = mtmp.data.mlet;
                            if ((difcap > 0 && mtmp.data.difficulty >= difcap && rn2(((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) ? 3 : 7) && attacktype(mtmp.data, 255)) || (s_cls == S_DEMON && m_cls == S_ANGEL) || (s_cls == S_ANGEL && m_cls == S_DEMON)) {
                                mtmp = await unmakemon(mtmp, 0);
                            }
                        }
                    }
                    if (mtmp) {
                        if (mtmp.data == game.mons[PM_ARCH_LICH] || mtmp.data == game.mons[PM_ARCHON]) {
                            /* if creating an arch-lich or Archon, further directly
                       selected nasties will have to be less difficult, and
                       substitues for geno victims will usually be less
                       (note: Archon is not in nasties[] but could be chosen
                       as random replacement for a genocided selection) */
                            tmp = ((game.mons[PM_ARCHON].difficulty) < (game.mons[PM_ARCH_LICH].difficulty) ? (game.mons[PM_ARCHON].difficulty) : (game.mons[PM_ARCH_LICH].difficulty));
                            if (!difcap || difcap > tmp) {
                                difcap = tmp;
                            }
                        }
                        /* delay first use of spell or breath attack */
                        mtmp.mspec_used = rnd(4);
                        if (++count >= 10 || mtmp.data.maligntyp == 0 || sgn(mtmp.data.maligntyp) == castalign) {
                            break;
                        }
                    }
                }
            }
        }
    }
    if (count) {
        count = monster_census((0)) - census;
    }
    return count;
}
/* Let's resurrect the Wizard, for some unexpected fun. */
export async function resurrect() {
    let mtmp = null;
    let mmtmp__parent = null;
    let mmtmp__field = null;
    let elapsed = 0;
    let verb = null;
    if (!game.context.no_of_wizards) {
        verb = "kill";
        mtmp = await makemon(game.mons[PM_WIZARD_OF_YENDOR], game.u.ux, game.u.uy, 2);
        /* affects experience; he's not coming back from a corpse
           but is subject to repeated killing like a revived corpse */
        if (mtmp) {
            mtmp.mrevived = 1;
        }
    } else {
        /* look for a migrating Wizard */
        verb = "elude";
        (mmtmp__parent = game, mmtmp__field = "migrating_mons");
        while ((mtmp = mmtmp__parent[mmtmp__field]) != null) {
            if (mtmp.iswiz && !mon_has_amulet(mtmp) && (elapsed = game.moves - mtmp.mlstmv) > 0) {
                await mon_catchup_elapsed_time(mtmp, elapsed);
                if (elapsed >= 32767) {
                    elapsed = 32767 - 1;
                }
                elapsed = Math.trunc(elapsed / 50);
                if (mtmp.msleeping && rn2(elapsed + 1)) {
                    mtmp.msleeping = 0;
                }
                /* would unfreeze on next move */
                if (mtmp.mfrozen == 1) {
                    mtmp.mfrozen = 0 , mtmp.mcanmove = 1;
                }
                if (!((mtmp).msleeping || !(mtmp).mcanmove)) {
                    mmtmp__parent[mmtmp__field] = mtmp.nmon;
                    await mon_arrive(mtmp, -1);
                    /* mx: mon_arrive() might have sent mtmp into limbo */
                    if (!mtmp.mx) {
                        mtmp = null;
                    }
                    break;
                }
            }
            (mmtmp__parent = mtmp, mmtmp__field = "nmon");
        }
    }
    if (mtmp) {
        /* FIXME: when a new wizard is created by makemon(), it gives
           a "<mon> appears" message, delivered after he's been placed
           on the map; however, when an existing wizard comes off
           migrating_mons, he ends up triggering "<mon> vanishes and
           reappears" on his first move (tactics when hero is carrying
           the Amulet); setting STRAT_WAITMASK suppresses that but then
           he just sits wherever he is, "meditating", contradicting the
           threatening message below */
        mtmp.mstrategy &= ~(268435456 | 536870912);
        mtmp.mtame = 0 , mtmp.mpeaceful = 0;
        set_malign(mtmp);
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await pline("A voice booms out...");
            ;
            await verbalize("So thou thought thou couldst %s me, fool.", verb);
        }
    }
}
/* Here, we make trouble for the poor shmuck who actually
   managed to do in the Wizard. */
export async function intervene() {
    let which = (((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) ? rnd(4) : rn2(6);
    switch (which) {
        case 0:
        case 1:
            await You_feel("vaguely nervous.");
            break;
        case 2:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await You("notice a %s glow surrounding you.", hcolor(c_color_names.c_black));
            }
            await rndcurse();
            break;
        case 3:
            await aggravate();
            break;
        case 4:
            await nasty(null);
            break;
        case 5:
            await resurrect();
            break;
    }
}
/* Wizard of Yendor is being removed from play (dead or escaped the dungeon);
   keep the bookkeeping for him up to date */
export function wizdeadorgone() {
    game.context.no_of_wizards--;
    if (!game.u.uevent.udemigod) {
        game.u.uevent.udemigod = (1);
        game.u.udg_cnt = (rn2(250) + (50));
    }
}
const random_insult = ["antic", "blackguard", "caitiff", "chucklehead", "coistrel", "craven", "cretin", "cur", "dastard", "demon fodder", "dimwit", "dolt", "fool", "footpad", "imbecile", "knave", "maledict", "miscreant", "niddering", "poltroon", "rattlepate", "reprobate", "scapegrace", "varlet", "villein", "wittol", "worm", "wretch"];
/* (sic.) */
const random_malediction = ["Hell shall soon claim thy remains,", "I chortle at thee, thou pathetic", "Prepare to die, thou", "Resistance is useless,", "Surrender or die, thou", "There shall be no mercy, thou", "Thou shalt repent of thy cunning,", "Thou art as a flea to me,", "Thou art doomed,", "Thy fate is sealed,", "Verily, thou shalt be one dead"];
/* Insult or intimidate the player */
export async function cuss(mtmp) {
    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        return;
    }
    if (mtmp.iswiz) {
        if (!rn2(5)) {
            await pline("%s laughs fiendishly.", await Monnam(mtmp));
        } else if (game.u.uhave.amulet && !rn2((Math.trunc(28 /* sizeof(const char *const [28]) */ / 1 /* sizeof(const char *const) */)))) {
            ;
            await verbalize("Relinquish the amulet, %s!", random_insult[rn2((Math.trunc(28 /* sizeof(const char *const [28]) */ / 1 /* sizeof(const char *const) */)))]);
        } else if (game.u.uhp < 5 && !rn2(2)) {
            ;
            await verbalize(rn2(2) ? "Even now thy life force ebbs, %s!" : "Savor thy breath, %s, it be thy last!", random_insult[rn2((Math.trunc(28 /* sizeof(const char *const [28]) */ / 1 /* sizeof(const char *const) */)))]);
        } else if (mtmp.mhp < 5 && !rn2(2)) {
            ;
            await verbalize(rn2(2) ? "I shall return." : "I'll be back.");
        } else {
            ;
            await verbalize("%s %s!", random_malediction[rn2((Math.trunc(11 /* sizeof(const char *const [11]) */ / 1 /* sizeof(const char *const) */)))], random_insult[rn2((Math.trunc(28 /* sizeof(const char *const [28]) */ / 1 /* sizeof(const char *const) */)))]);
        }
    } else if ((((((mtmp).data).mflags2 & 4096) != 0) && mon_aligntyp(mtmp) == 1) && !(mtmp.isminion && ((mtmp).mextra.emin).renegade)) {
        await com_pager("angel_cuss");
    } else {
        if (!rn2((((mtmp.data).mflags2 & 4096) != 0) ? 100 : 5)) {
            await pline("%s casts aspersions on your ancestry.", await Monnam(mtmp));
        } else {
            await com_pager("demon_cuss");
        }
    }
    await wake_nearto(mtmp.mx, mtmp.my, 5 * 5);
}
/*wizard.c*/
/* 0 signifies quest artifact */
/* no need for !DEADMONSTER check here since they have no inventory */
/* [note: 'stway' could still be Null if the only access to this
           level is via magic portal] */
/* if wounded, hole up on or near the stairs (to block them) */
/* couldn't move to the target spot for some reason,
                   so stay where we are (don't actually need rloc_to()
                   because mtmp is still on the map at <mx,my>... */
/* if you're not around, cast healing spells */
/* teleport to it and pick it up */
/* a monster is standing on it - cause some trouble */
/* this might summon a demon prince or lord */
/* do this after picking the monster to place */
/* always capping for substitutes made wanton
                                genocide become too strong in the endgame */
/* rest must be lower difficulty */
/* empty; label must be followed by a statement */
/* if he has the Amulet, he won't bring it to you */
/* TODO: the Hallucination msg */
/*com_pager(rn2(QTN_ANGELIC - 1 + (Hallucination ? 1 : 0))
          + QT_ANGELIC);*/
