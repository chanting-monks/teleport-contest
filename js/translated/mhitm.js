/* NetHack 5.0	mhitm.c	$NHDT-Date: 1732979463 2024/11/30 07:11:03 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.253 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { You, You_feel, You_hear, Your, pline } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strcpy, strncmpi } from '../c2js-runtime/string.js';
import { snuff_lit } from './apply.js';
import { is_art } from './artifact.js';
import { c_common_strings } from './decl.js';
import { canseemon, flush_screen, map_invisible, mon_visible, newsym, sensemon, shieldeff } from './display.js';
import { Adjmonnam, Monnam, a_monnam, hliquid, mon_nam, mon_nam_too, noname_monnam, some_mon_nam, x_monnam } from './do_name.js';
import { finish_meating } from './dogmove.js';
import { is_fainted } from './eat.js';
import { mon_explodes } from './explode.js';
import { dist2, distmin, s_suffix, strNsubst, strsubst } from './hacklib.js';
import { clone_mon, grow_up } from './makemon.js';
import { could_seduce, getmattk, mswings_verb, mtrapped_in_pit } from './mhitu.js';
import { golemeffects, healmon, minliquid, mon_givit, mon_to_stone, mondead, monkilled, monnear, monstone, newcham, pm_to_cham, seemimic, set_ustuck, shieldeff_mon, unstuck, xkilled, zombie_form, zombie_maker } from './mon.js';
import { Resists_Elem, attacktype, defended, dmgtype, dmgtype_fromattack, mon_hates_silver, poly_when_stoned, pronoun_gender, resist_conflict, resists_blnd, resists_magm, stagger, sticks } from './mondata.js';
import { closed_door, itsstuck } from './monmove.js';
import { breamm, spitmm, thrwmm } from './mthrowu.js';
import { mon_reflects } from './muse.js';
import { ACID_RES, ANTIMAGIC, ART_SNICKERSNEE, ART_TROLLSBANE, BLINDED, COLD_RES, CONFLICT, DEAF, FIRE_RES, IRON, IRONBARS, LOW_PM, METAL, M_AP_FURNITURE, M_AP_MONSTER, M_AP_NOTHING, M_AP_OBJECT, NEED_HTH_WEAPON, NEED_WEAPON, NON_PM, NUMMONS, PASSES_WALLS, PLNMSG_HIDE_UNDER, PM_AIR_ELEMENTAL, PM_ARCHON, PM_BLACK_PUDDING, PM_BROWN_PUDDING, PM_CHICKATRICE, PM_COCKATRICE, PM_DEATH, PM_FAMINE, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLOATING_EYE, PM_GREEN_SLIME, PM_GRID_BUG, PM_MEDUSA, PM_NURSE, PM_PESTILENCE, PM_SALAMANDER, PM_SHADE, PM_STEAM_VORTEX, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WRAITH, POLY_NOFLAGS, POOL, P_LANCE, P_POLEARMS, SHOCK_RES, SILVER, SLEEP_RES, STONE, STONE_RES, S_GHOST, S_MIMIC, S_TROLL, S_VORTEX, TOOL_CLASS, TREE, Trap_Killed_Mon, UNCHANGING, WAND_CLASS, WEAPON_CLASS } from './nh-constants.js';
import { makeplural, simpleonames, xname } from './objnam.js';
import { pline_mon } from './pline.js';
import { polyself } from './polyself.js';
import { split_mon } from './potion.js';
import { update_monster_region } from './region.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { place_monster } from './steed.js';
import { goodpos, rloc, tele, tele_restrict } from './teleport.js';
import { acid_damage, erode_obj, mintrap, t_at, unconscious } from './trap.js';
import { erode_armor, mhitm_ad_blnd, mhitm_adtyping, mhitm_knockback, shade_miss } from './uhitm.js';
import { hitval, mon_wield_item, possibly_unwield } from './weapon.js';
import { you_unwere, you_were } from './were.js';
import { place_worm_tail_randomly, remove_worm } from './worm.js';
import { find_mac, which_armor } from './worn.js';
import { drain_item, resist } from './zap.js';

const brief_feeling = "have a %s feeling for a moment, then it passes.";
export async function noises(magr, mattk) {
    let farq = (dist2(((magr).mx), ((magr).my), game.u.ux, game.u.uy) > 15);
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && (farq != game.far_noise || game.moves - game.noisetime > 10)) {
        game.far_noise = farq;
        game.noisetime = game.moves;
        await You_hear("%s%s.", (mattk.aatyp == 13) ? "an explosion" : "some noises", farq ? " in the distance" : "");
    }
}
export async function pre_mm_attack(magr, mdef) {
    let showit = (0);
    if (((mdef).m_ap_type & 7)) {
        await seemimic(mdef);
        showit |= game.vis;
    } else if (mdef.mundetected) {
        /* mundetected monsters become un-hidden if they are attacked */
        mdef.mundetected = 0;
        showit |= game.vis;
    }
    if (((magr).m_ap_type & 7)) {
        await seemimic(magr);
        showit |= game.vis;
    } else if (magr.mundetected) {
        magr.mundetected = 0;
        showit |= game.vis;
    }
    if (game.vis) {
        if (!(canseemon(magr) || sensemon(magr))) {
            await map_invisible(magr.mx, magr.my);
        } else if (showit) {
            await newsym(magr.mx, magr.my);
        }
        if (!(canseemon(mdef) || sensemon(mdef))) {
            await map_invisible(mdef.mx, mdef.my);
        } else if (showit) {
            await newsym(mdef.mx, mdef.my);
        }
    }
}
/* feedback for when a monster-vs-monster attack misses */
/* attacker */
/* defender */
/* attack and damage types */
export async function missmm(magr, mdef, mattk) {
    await pre_mm_attack(magr, mdef);
    if (game.vis) {
        await pline("%s %s %s.", await Monnam(magr), (magr.mcan || !could_seduce(magr, mdef, mattk)) ? "misses" : "pretends to be friendly to", await mon_nam_too(mdef, magr));
    } else {
        await noises(magr, mattk);
    }
}
/*
 *  fightm()  -- fight some other monster
 *
 *  Returns:
 *      0 - Monster did nothing.
 *      1 - If the monster made an attack.  The monster might have died.
 *
 *  There is an exception to the above.  If mtmp has the hero swallowed,
 *  then we report that the monster did nothing so it will continue to
 *  digest the hero.
 */
/* have monsters fight each other */
export async function fightm(mtmp) {
    let mon = null;
    let nmon = null;
    let result = 0;
    let has_u_swallowed = 0;
    /* perhaps the monster will resist Conflict */
    if (resist_conflict(mtmp)) {
        return 0;
    }
    if (game.u.ustuck == mtmp) {
        if (await itsstuck(mtmp)) {
            return 0;
        }
    }
    has_u_swallowed = (game.u.uswallow && (game.u.ustuck == (mtmp)));
    for (mon = game.level.monlist; mon; mon = nmon) {
        nmon = mon.nmon;
        if (nmon == mtmp) {
            nmon = mtmp.nmon;
        }
        if (mon != mtmp && !((mon).mhp < 1)) {
            if (monnear(mtmp, mon.mx, mon.my)) {
                if (!game.u.uswallow && (mtmp == game.u.ustuck)) {
                    if (!rn2(4)) {
                        await set_ustuck(null);
                        await pline("%s releases you!", await Monnam(mtmp));
                    } else {
                        /* special case; no defense needed */
                        /* caller needs to check for weapon */
                        /* attacker needs both to be protected */
                        break;
                    }
                }
                game.bhitpos.x = mon.mx , game.bhitpos.y = mon.my;
                game.notonhead = (0);
                result = await mattackm(mtmp, mon);
                if (result & 4) {
                    /* no damage during the polymorph */
                    return 1;
                }
                /*
                 * If mtmp has the hero swallowed, lie and say there
                 * was no attack (this allows mtmp to digest the hero).
                 */
                if (has_u_swallowed) {
                    return 0;
                }
                if ((result & (1 | 2)) == 1 && rn2(4) && mon.movement > rn2(12)) {
                    if (mon.movement > 12) {
                        mon.movement -= 12;
                    /* allow attacked monsters a chance to hit back, primarily
                   to allow monsters that resist conflict to respond */
                    } else {
                        mon.movement = 0;
                    }
                    game.bhitpos.x = mtmp.mx , game.bhitpos.y = mtmp.my;
                    game.notonhead = (0);
                    await mattackm(mon, mtmp);
                }
                return (result & 1) ? 1 : 0;
            }
        }
    }
    return 0;
}
/*
 * mdisplacem() -- attacker moves defender out of the way;
 *                 returns same results as mattackm().
 */
export async function mdisplacem(magr, mdef, quietly) {
    let pa = null;
    let pd = null;
    let tx = 0;
    let ty = 0;
    let fx = 0;
    let fy = 0;
    /* sanity checks; could matter if we unexpectedly get a long worm */
    if (!magr || !mdef || magr == mdef) {
        return 0;
    }
    pa = magr.data , pd = mdef.data;
    tx = mdef.mx , ty = mdef.my;
    fx = magr.mx , fy = magr.my;
    if ((game.level.monsters[fx][fy]) != magr || (game.level.monsters[tx][ty]) != mdef) {
        return 0;
    }
    /* The 1 in 7 failure below matches the chance in do_attack()
     * for pet displacement.
     */
    if (!rn2(7)) {
        return 0;
    }
    /* Grid bugs cannot displace at an angle. */
    /* Grid bugs cannot attack at an angle. */
    if (pa == game.mons[PM_GRID_BUG] && magr.mx != mdef.mx && magr.my != mdef.my) {
        return 0;
    }
    /* undetected monster becomes un-hidden if it is displaced */
    if (mdef.mundetected) {
        mdef.mundetected = 0;
    }
    if (((mdef).m_ap_type & 7) && ((mdef).m_ap_type & 7) != M_AP_MONSTER) {
        await seemimic(mdef);
    }
    /* wake up the displaced defender */
    mdef.msleeping = 0;
    mdef.mstrategy &= ~(268435456 | 536870912);
    await finish_meating(mdef);
    /*
     * Set up the visibility of action.
     * You can observe monster displacement if you can see both of
     * the monsters involved.
     */
    game.vis = ((canseemon(magr) || sensemon(magr)) && (canseemon(mdef) || sensemon(mdef)));
    if (((pd) == game.mons[PM_COCKATRICE] || (pd) == game.mons[PM_CHICKATRICE]) && !await Resists_Elem(magr, STONE_RES)) {
        if (!await which_armor(magr, 16)) {
            if (poly_when_stoned(pa)) {
                await mon_to_stone(magr);
                return 1;
            }
            if (!quietly && (canseemon(magr) || sensemon(magr))) {
                if (game.vis) {
                    await pline("%s tries to move %s out of %s way.", await Monnam(magr), await mon_nam(mdef), ((pa) == game.mons[PM_DEATH] || (pa) == game.mons[PM_FAMINE] || (pa) == game.mons[PM_PESTILENCE]) ? "the" : (genders[pronoun_gender(magr, 2)].his));
                }
                await pline_mon(magr, "%s turns to stone!", await Monnam(magr));
            }
            await monstone(magr);
            if (!((magr).mhp < 1)) {
                return 1;
            } else if (magr.mtame && !game.vis) {
                await You(brief_feeling, "peculiarly sad");
            }
            return 4;
        }
    }
    game.level.monsters[fx][fy] = null;
    if (mdef.wormno) {
        await remove_worm(mdef);
    } else {
        game.level.monsters[tx][ty] = null;
    }
    await place_monster(magr, tx, ty);
    await place_monster(mdef, fx, fy);
    if (mdef.wormno) {
        await place_worm_tail_randomly(mdef, fx, fy);
    }
    await update_monster_region(magr);
    await update_monster_region(mdef);
    if (game.vis && !quietly) {
        await pline("%s moves %s out of %s way!", await Monnam(magr), await mon_nam(mdef), ((pa) == game.mons[PM_DEATH] || (pa) == game.mons[PM_FAMINE] || (pa) == game.mons[PM_PESTILENCE]) ? "the" : (genders[pronoun_gender(magr, 2)].his));
    }
    await newsym(fx, fy);
    await newsym(tx, ty);
    await flush_screen(0);
    return 1;
}
/*
 * mattackm() -- a monster attacks another monster.
 *
 *          --------- aggressor died
 *         /  ------- defender died
 *        /  /  ----- defender was hit
 *       /  /  /
 *      x  x  x
 *
 *      0x8     M_ATTK_AGR_DONE
 *      0x4     M_ATTK_AGR_DIED
 *      0x2     M_ATTK_DEF_DIED
 *      0x1     M_ATTK_HIT
 *      0x0     M_ATTK_MISS
 *
 * Each successive attack has a lower probability of hitting.  Some rely on
 * success of previous attacks.  ** this doesn't seem to be implemented -dl **
 *
 * Attacker has targeted <bhitpos.x,bhitpos.y> rather than
 * <mdef->mx,mdef->my>; matters for long worms.
 *
 * In the case of exploding monsters, the monster dies as well.
 */
export async function mattackm(magr, mdef) {
    let i = 0;
    let tmp = 0;
    let strike = 0;
    let attk = 0;
    let struck = 0;
    let res = [0, 0, 0, 0, 0, 0];
    let dieroll = 0;
    let mattk = null;
    let alt_attk = { aatyp: 0, adtyp: 0, damn: 0, damd: 0 };
    let mwep = null;
    let pa = null;
    let pd = null;
    if (!magr || !mdef) {
        return 0;
    }
    if (((magr).msleeping || !(magr).mcanmove)) {
        return 0;
    }
    pa = magr.data;
    pd = mdef.data;
    if (pa == game.mons[PM_GRID_BUG] && magr.mx != mdef.mx && magr.my != mdef.my) {
        return 0;
    }
    /* Calculate the armour class differential. */
    tmp = find_mac(mdef) + magr.m_lev;
    if (mdef.mconf || ((mdef).msleeping || !(mdef).mcanmove)) {
        /* attack attempted this time */
        tmp += 4;
        mdef.msleeping = 0;
    }
    if (mdef.mundetected) {
        mdef.mundetected = 0;
        await newsym(mdef.mx, mdef.my);
        if (canseemon(mdef) && !sensemon(mdef)) {
            if ((game.multi < 0 && (unconscious() || is_fainted()))) {
                let justone = (mdef.data.geno & 4096) != 0;
                let montype = null;
                montype = await noname_monnam(mdef, justone ? 1 : 0);
                if (!justone) {
                    montype = await makeplural(montype);
                }
                await You("dream of %s.", montype);
            } else {
                if (game.iflags.last_msg == PLNMSG_HIDE_UNDER && mdef.m_id == game.last_hider) {
                    await pline_mon(mdef, "%s emerges from hiding.", await Monnam(mdef));
                } else if (mdef.m_id == game.last_hider) {
                    await You("notice %s.", await mon_nam(mdef));
                } else {
                    await pline("Suddenly, you notice %s.", await a_monnam(mdef));
                }
            }
        }
    }
    if ((((pa).mflags2 & 16) != 0) && (((pd).mflags2 & 128) != 0)) {
        tmp++;
    }
    /* Set up the visibility of action */
    game.vis = ((((game.viz_array[magr.my][magr.mx] & 2) != 0) && (canseemon(magr) || sensemon(magr))) || (((game.viz_array[mdef.my][mdef.mx] & 2) != 0) && (canseemon(mdef) || sensemon(mdef))));
    /* Set flag indicating monster has moved this turn.  Necessary since a
     * monster might get an attack out of sequence (i.e. before its move) in
     * some cases, in which case this still counts as its move for the round
     * and it shouldn't move again.
     */
    magr.mlstmv = game.moves;
    /* controls whether a mind flayer uses all of its tentacle-for-DRIN
       attacks; when fighting a headless monster, stop after the first
       one because repeating the same failing hit (or even an ordinary
       tentacle miss) is very verbose and makes the flayer look stupid */
    game.skipdrin = (0);
    for (i = 0; i < 6; i++) {
        /* Now perform all attacks for the monster. */
        res[i] = 0;
        /* target might no longer be there */
        if (i > 0 && ((game.level.monsters[game.bhitpos.x][game.bhitpos.y]) != mdef || ((magr).mhp < 1) || ((mdef).mhp < 1))) {
            continue;
        }
        mattk = await getmattk(magr, mdef, i, res, alt_attk);
        /* reduce verbosity for mind flayer attacking creature without a
           head (or worm's tail); this is similar to monster with multiple
           attacks after a wildmiss against displaced or invisible hero */
        if (game.skipdrin && mattk.aatyp == 16 && mattk.adtyp == 32) {
            continue;
        }
        mwep = null;
        attk = 1;
        switch (mattk.aatyp) {
            case 254:
                /* Nymph that teleported away on first attack? */
                /* D: Prevent engulf from a distance */
                if (distmin(magr.mx, magr.my, mdef.mx, mdef.my) > 1) {
                    strike = (await thrwmm(magr, mdef) == 0) ? 0 : 1;
                    /* We don't really know if we hit or not; pretend we did. */
                    if (strike) {
                        res[i] |= 1;
                    }
                    /* don't really know if we hit or not; pretend we did */
                    if (((mdef).mhp < 1)) {
                        res[i] = 2;
                    }
                    if (((magr).mhp < 1)) {
                        res[i] |= 4;
                    }
                    break;
                }
                if (magr.weapon_check == NEED_WEAPON || !((magr).mw)) {
                    magr.weapon_check = NEED_HTH_WEAPON;
                    if (await mon_wield_item(magr) != 0) {
                        return 0;
                    }
                }
                await possibly_unwield(magr, (0));
                if ((mwep = ((magr).mw)) != null) {
                    if (game.vis) {
                        await mswingsm(magr, mdef, mwep);
                    }
                    tmp += await hitval(mwep, mdef);
                }
                ;
            case 1:
            case 3:
            case 2:
            case 6:
            case 5:
            case 4:
            case 16:
                if (mattk.aatyp == 3 && mtrapped_in_pit(magr)) {
                    continue;
                }
                if (distmin(magr.mx, magr.my, mdef.mx, mdef.my) > 1) {
                    continue;
                }
                if (!magr.mconf && !(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && mwep && mattk.aatyp != 254 && ((mdef.data) == game.mons[PM_COCKATRICE] || (mdef.data) == game.mons[PM_CHICKATRICE])) {
                    /* Continue because the monster may have a ranged attack. */
                    /* Monsters won't attack cockatrices physically if they
             * have a weapon instead.  This instinct doesn't work for
             * players, or under conflict or confusion.
             */
                    /* D: Prevent explosions from a distance */
                    /* Engulfing attacks are directed at the hero if possible. -dlc */
                    strike = 0;
                    break;
                }
                dieroll = rnd(20 + i);
                strike = (tmp > dieroll);
                if (mwep) {
                    tmp -= await hitval(mwep, mdef);
                }
                if (strike) {
                    if ((((mdef.data).mflags1 & 1048576) != 0) && await failed_grab(magr, mdef, mattk)) {
                        /* for eel AT_TUCH+AD_WRAP attack: can't grab an unsolid
                   target; the unsolid test is redundant since failed_grab
                   checks it too, but is cheap and avoids calling failed_grab
                   for ordinary targets */
                        strike = 0;
                        break;
                    }
                    res[i] = await hitmm(magr, mdef, mattk, mwep, dieroll);
                    if ((mdef.data == game.mons[PM_BLACK_PUDDING] || mdef.data == game.mons[PM_BROWN_PUDDING]) && (mwep && (game.objects[mwep.otyp].oc_material == IRON || game.objects[mwep.otyp].oc_material == METAL)) && mdef.mhp > 1 && !mdef.mcan) {
                        let mclone = null;
                        if ((mclone = await clone_mon(mdef, 0, 0)) != null) {
                            if (game.vis && (canseemon(mdef) || sensemon(mdef))) {
                                await pline("%s divides as %s hits it!", await Monnam(mdef), await mon_nam(magr));
                            }
                            await mintrap(mclone, 0);
                            if (((magr).mhp < 1)) {
                                res[i] |= 4;
                            }
                        }
                    }
                } else {
                    await missmm(magr, mdef, mattk);
                }
                break;
            /* automatic if prev two attacks succeed */
            case 7:
                strike = (i >= 2 && res[i - 1] == 1 && res[i - 2] == 1);
                if (strike) {
                    if (await failed_grab(magr, mdef, mattk)) {
                        strike = 0;
                    } else {
                        res[i] = await hitmm(magr, mdef, mattk, null, 0);
                    }
                }
                break;
            case 15:
                strike = 0;
                res[i] = await gazemm(magr, mdef, mattk);
                break;
            case 13:
                if (distmin(magr.mx, magr.my, mdef.mx, mdef.my) > 1) {
                    continue;
                }
                res[i] = await explmm(magr, mdef, mattk);
                if (res[i] == 0) {
                    strike = 0;
                    attk = 0;
                } else {
                    strike = 1;
                }
                break;
            case 11:
                if (mdef.data == game.mons[PM_SHADE]) {
                    if (game.vis) {
                        await pline("%s attempt to engulf %s is futile.", s_suffix(await Monnam(magr)), await mon_nam(mdef));
                    }
                    strike = 0;
                    break;
                }
                if (game.u.usteed && mdef == game.u.usteed) {
                    strike = 0;
                    break;
                }
                if (distmin(magr.mx, magr.my, mdef.mx, mdef.my) > 1) {
                    continue;
                }
                if ((game.u.uswallow && (game.u.ustuck == (magr)))) {
                    strike = 0;
                } else if ((strike = (tmp > rnd(20 + i))) != 0) {
                    if (await failed_grab(magr, mdef, mattk)) {
                        strike = 0;
                    } else {
                        res[i] = await gulpmm(magr, mdef, mattk);
                    }
                } else {
                    await missmm(magr, mdef, mattk);
                }
                break;
            case 12:
            case 10:
                if (!monnear(magr, mdef.mx, mdef.my)) {
                    let mmtmp = ((mattk.aatyp == 12) ? await breamm(magr, mattk, mdef) : await spitmm(magr, mattk, mdef));
                    strike = (mmtmp == 0) ? 0 : 1;
                    if (strike) {
                        res[i] |= 1;
                    }
                    if (((mdef).mhp < 1)) {
                        res[i] = 2;
                    }
                    if (((magr).mhp < 1)) {
                        res[i] |= 4;
                    }
                } else {
                    strike = 0;
                    attk = 0;
                }
                break;
            default:
                strike = 0;
                attk = 0;
                break;
        }
        if (attk && !(res[i] & 4) && distmin(magr.mx, magr.my, mdef.mx, mdef.my) <= 1) {
            res[i] = await passivemm(magr, mdef, strike, (res[i] & 2), mwep);
        }
        if (res[i] & 2) {
            return res[i];
        }
        if (res[i] & 4) {
            return res[i];
        }
        /* return if aggressor can no longer attack */
        if ((res[i] & 8) || ((magr).msleeping || !(magr).mcanmove)) {
            return res[i];
        }
        /* eg. defender was knocked into a level teleport trap */
        if (((mdef).mstate != 0)) {
            return res[i];
        }
        if (res[i] & 1) {
            struck = 1;
        }
    }
    return (struck ? 1 : 0);
}
/* can't hold an unsolid target (ghosts, lights, vortices, most elementals)
   or a long worm tail */
export async function failed_grab(magr, mdef, mattk) {
    if (((((mdef.data).mflags1 & 1048576) != 0) || game.notonhead) && (mattk.aatyp == 7 || mattk.adtyp == 28 || mattk.adtyp == 19 || mattk.adtyp == 26)) {
        if ((game.vis && (canseemon(mdef) || sensemon(mdef))) || magr == game.youmonst || mdef == game.youmonst) {
            /* hug attack: most holders (owlbear, python, pit fiend, &c);
           wrap damage: eel grabbing, trapper/lurker-above engulfing;
           stick-to damage: mimic, lichen;
           digestion damage: purple worm swallowing */
            let magrnam = '';
            let mdefnam = '';
            let tailmiss = game.notonhead;
            let verb = (mattk.adtyp == 26) ? "gulp" : (mattk.adtyp == 19) ? "adhere" : "grab";
            magrnam = strcpy(magrnam, (magr == game.youmonst) ? "Your" : s_suffix(await Monnam(magr)));
            if (!tailmiss) {
                mdefnam = strcpy(mdefnam, (mdef == game.youmonst) ? "you" : await mon_nam(mdef));
            } else {
                mdefnam = sprintf(mdefnam, "%s tail", s_suffix(await some_mon_nam(mdef)));
            }
            await pline("%.99s %s attempt %s %.99s!", magrnam, verb, !tailmiss ? "passes right through" : "fails to hold", mdefnam);
        }
        return (1);
    }
    return (0);
}
/* Returns the result of mdamagem(). */
export async function hitmm(magr, mdef, mattk, mwep, dieroll) {
    let compat = 0;
    let weaponhit = (mattk.aatyp == 254 || (mattk.aatyp == 1 && mwep));
    let silverhit = (weaponhit && mwep && game.objects[mwep.otyp].oc_material == SILVER);
    await pre_mm_attack(magr, mdef);
    compat = !magr.mcan ? could_seduce(magr, mdef, mattk) : 0;
    if (!compat && await shade_miss(magr, mdef, mwep, (0), game.vis)) {
        return 0;
    }
    if (game.vis) {
        let buf = '';
        let magr_name = '';
        magr_name = strcpy(magr_name, await Monnam(magr));
        if (compat) {
            buf = nh_snprintf("hitmm", 669, buf, 256 /* sizeof(char [256]) */, "%s %s", magr_name, mdef.mcansee ? "smiles at" : "talks to");
            await pline("%s %s %s.", buf, await mon_nam(mdef), (compat == 2) ? "engagingly" : "seductively");
        } else {
            buf = '';
            switch (mattk.aatyp) {
                case 2:
                    buf = nh_snprintf("hitmm", 676, buf, 256 /* sizeof(char [256]) */, "%s bites", magr_name);
                    break;
                case 6:
                    buf = nh_snprintf("hitmm", 679, buf, 256 /* sizeof(char [256]) */, "%s stings", magr_name);
                    break;
                case 4:
                    buf = nh_snprintf("hitmm", 682, buf, 256 /* sizeof(char [256]) */, "%s butts", magr_name);
                    break;
                case 5:
                    buf = nh_snprintf("hitmm", 685, buf, 256 /* sizeof(char [256]) */, "%s touches", magr_name);
                    break;
                case 16:
                    buf = nh_snprintf("hitmm", 689, buf, 256 /* sizeof(char [256]) */, "%s tentacles suck", s_suffix(magr_name));
                    break;
                case 7:
                    if (magr != game.u.ustuck) {
                        buf = nh_snprintf("hitmm", 693, buf, 256 /* sizeof(char [256]) */, "%s squeezes", magr_name);
                        break;
                    }
                    ;
                default:
                    if (!weaponhit || !mwep || !mwep.oartifact) {
                        buf = nh_snprintf("hitmm", 700, buf, 256 /* sizeof(char [256]) */, "%s hits", magr_name);
                    }
                    break;
            }
            if (buf) {
                await pline("%s %s.", buf, await mon_nam_too(mdef, magr));
            }
            if (mon_hates_silver(mdef) && silverhit) {
                let mdef_name = await mon_nam_too(mdef, magr);
                magr_name = strcpy(magr_name, s_suffix(magr_name));
                if (!((mdef.data).mlet == S_GHOST) && !(((mdef.data).mflags1 & 4) != 0)) {
                    if (mdef != magr) {
                        /* note: mon_nam_too returns a modifiable buffer; so
                   does s_suffix, but it returns a single static buffer
                   and we might be calling it twice for this message */
                        mdef_name = s_suffix(mdef_name);
                    } else {
                        mdef_name = strsubst(mdef_name, "himself", "his own");
                        mdef_name = strsubst(mdef_name, "herself", "her own");
                        mdef_name = strsubst(mdef_name, "itself", "its own");
                    }
                    mdef_name = strcat(mdef_name, " flesh");
                }
                await pline("%s %s sears %s!", magr_name, await simpleonames(mwep), mdef_name);
            }
        }
    } else {
        await noises(magr, mattk);
    }
    return await mdamagem(magr, mdef, mattk, mwep, dieroll);
}
/* Returns the same values as mdamagem(). */
export async function gazemm(magr, mdef, mattk) {
    let buf = '';
    /* an Archon's gaze affects target even if Archon itself is blinded */
    let archon = (magr.data == game.mons[PM_ARCHON] && mattk.adtyp == 11);
    let altmesg = (archon && !magr.mcansee);
    /* bring target out of hiding even if hero doesn't see it happen (this
       is already done in pre_mm_attack() and shouldn't be needed here) */
    if (mdef.data.mlet == S_MIMIC && ((mdef).m_ap_type & 7) != M_AP_NOTHING) {
        await seemimic(mdef);
    }
    mdef.mundetected = 0;
    if (game.vis) {
        buf = sprintf(buf, "%s gazes %s", altmesg ? await Adjmonnam(magr, "blinded") : await Monnam(magr), altmesg ? "toward" : "at");
        await pline("%s %s...", buf, (canseemon(mdef) || sensemon(mdef)) ? await mon_nam(mdef) : "something");
    }
    if (magr.mcan || !mdef.mcansee || (archon ? await resists_blnd(mdef) : !magr.mcansee) || (magr.minvis && !(((mdef.data).mflags1 & 16777216) != 0)) || mdef.msleeping) {
        if (game.vis && (canseemon(mdef) || sensemon(mdef))) {
            await pline("but nothing happens.");
        }
        return 0;
    }
    if (magr.data == game.mons[PM_MEDUSA] && await mon_reflects(mdef, null)) {
        if (canseemon(mdef)) {
            await mon_reflects(mdef, "The gaze is reflected away by %s %s.");
        }
        if (mdef.mcansee) {
            if (await mon_reflects(magr, null)) {
                if (canseemon(magr)) {
                    await mon_reflects(magr, "The gaze is reflected away by %s %s.");
                }
                return 0;
            }
            if (mdef.minvis && !(((magr.data).mflags1 & 16777216) != 0)) {
                if (canseemon(magr)) {
                    await pline("%s doesn't seem to notice that %s gaze was reflected.", await Monnam(magr), (genders[pronoun_gender(magr, 2)].his));
                }
                return 0;
            }
            if (canseemon(magr)) {
                await pline_mon(magr, "%s is turned to stone!", await Monnam(magr));
            }
            await monstone(magr);
            if (!((magr).mhp < 1)) {
                return 0;
            }
            return 4;
        }
    } else if (archon) {
        await mhitm_ad_blnd(magr, mattk, mdef, null);
        /* an Archon's blinding radiance also stuns;
           this is different from the way the hero gets stunned because
           a stunned monster recovers randomly instead of via countdown;
           both cases make an effort to prevent the target from being
           continuously stunned due to repeated gaze attacks */
        if (rn2(2)) {
            mdef.mstun = 1;
        }
    }
    return await mdamagem(magr, mdef, mattk, null, 0);
}
/* return True if magr is allowed to swallow mdef, False otherwise */
export function engulf_target(magr, mdef) {
    let lev = null;
    let ax = 0;
    let ay = 0;
    let dx = 0;
    let dy = 0;
    let uatk = (magr == game.youmonst);
    let udef = (mdef == game.youmonst);
    /* can't swallow something that's too big */
    if (mdef.data.msize >= 4 || (magr.data.msize < mdef.data.msize && !((magr.data).mlet == S_VORTEX || (magr.data) == game.mons[PM_AIR_ELEMENTAL]))) {
        return (0);
    }
    /* can't (move to) swallow if trapped. TODO: could do some? */
    if (mdef.mtrapped || magr.mtrapped) {
        return (0);
    }
    /* if attacker is phasing in solid rock and defender can't move there,
       or vice versa, don't allow engulf to succeed; otherwise expelling
       might not be able to place attacker and defender both back on map;
       when defender is the hero, a sanity_check complaint about placing
       the hero on top of a monster can occur */
    dx = (mdef == game.youmonst) ? game.u.ux : mdef.mx;
    dy = (mdef == game.youmonst) ? game.u.uy : mdef.my;
    lev = game.level.locations[dx][dy];
    if (!(udef ? (game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) : (((mdef.data).mflags1 & 8) != 0)) && (((lev.typ) < POOL) || closed_door(dx, dy) || ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)) || (lev.typ == IRONBARS && !((magr.data).mlet == S_VORTEX || (magr.data) == game.mons[PM_AIR_ELEMENTAL])))) {
        return (0);
    }
    /* not passes_bars(); engulfer isn't squeezing through */
    ax = (magr == game.youmonst) ? game.u.ux : magr.mx;
    ay = (magr == game.youmonst) ? game.u.uy : magr.my;
    lev = game.level.locations[ax][ay];
    if (!(uatk ? (game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) : (((magr.data).mflags1 & 8) != 0)) && (((lev.typ) < POOL) || closed_door(ax, ay) || ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)) || (lev.typ == IRONBARS && !((mdef.data).mlet == S_VORTEX || (mdef.data) == game.mons[PM_AIR_ELEMENTAL])))) {
        return (0);
    }
    return (1);
}
/* Returns the same values as mattackm(). */
export async function gulpmm(magr, mdef, mattk) {
    let ax = 0;
    let ay = 0;
    let dx = 0;
    let dy = 0;
    let status = 0;
    let obj = null;
    if (!engulf_target(magr, mdef)) {
        return 0;
    }
    if (game.vis) {
        await pline("%s %s %s.", await Monnam(magr), (dmgtype_fromattack((magr.data), 26, 11) != null) ? "swallows" : (dmgtype_fromattack((magr.data), 28, 11) != null) ? "encloses" : "engulfs", await mon_nam(mdef));
    }
    if (!((magr.data) == game.mons[PM_FIRE_VORTEX] || (magr.data) == game.mons[PM_FLAMING_SPHERE] || (magr.data) == game.mons[PM_FIRE_ELEMENTAL] || (magr.data) == game.mons[PM_SALAMANDER])) {
        for (obj = mdef.minvent; obj; obj = obj.nobj) {
            await snuff_lit(obj);
        }
    }
    if (((mdef).cham == PM_VAMPIRE || (mdef).cham == PM_VAMPIRE_LEADER || (mdef).cham == PM_VLAD_THE_IMPALER) && await newcham(mdef, game.mons[mdef.cham], 0)) {
        if (game.vis) {
            await pline("%s expels %s.", await Monnam(magr), (canseemon(mdef) || sensemon(mdef)) ? "it" : c_common_strings.c_something);
            if ((canseemon(mdef) || sensemon(mdef))) {
                await pline("It turns into %s.", await x_monnam(mdef, 2, null, (32 | 1 | 2), (0)));
            }
        }
        return 1;
    }
    /*
     *  All of this manipulation is needed to keep the display correct.
     *  There is a flush at the next pline().
     */
    ax = magr.mx;
    ay = magr.my;
    dx = mdef.mx;
    dy = mdef.my;
    game.level.monsters[dx][dy] = null;
    game.level.monsters[ax][ay] = null;
    await place_monster(magr, dx, dy);
    await newsym(ax, ay);
    await newsym(dx, dy);
    /* corpse_chance() wants this */
    game.mswallower = magr;
    status = await mdamagem(magr, mdef, mattk, null, 0);
    game.mswallower = null;
    if ((status & (4 | 2)) == (4 | 2)) {
        ;
    } else if (status & 2) {
        if (!goodpos(dx, dy, magr, 8)) {
            if ((game.level.monsters[dx][dy]) == magr) {
                game.level.monsters[dx][dy] = null;
                await newsym(dx, dy);
            }
            /* magr's spot at start of the attack */
            dx = ax , dy = ay;
        }
        if ((game.level.monsters[dx][dy]) != magr) {
            await place_monster(magr, dx, dy);
            await newsym(dx, dy);
        }
        if (await minliquid(magr) || (t_at(dx, dy) && await mintrap(magr, 0) == Trap_Killed_Mon)) {
            status |= 4;
        }
    } else if (status & 4) {
        await place_monster(mdef, dx, dy);
        await newsym(dx, dy);
    } else {
        if (((game.viz_array[dy][dx] & 2) != 0)) {
            await pline("%s is %s!", await Monnam(mdef), (dmgtype_fromattack((magr.data), 26, 11) != null) ? "regurgitated" : (dmgtype_fromattack((magr.data), 28, 11) != null) ? "released" : "expelled");
        }
        game.level.monsters[dx][dy] = null;
        await place_monster(magr, ax, ay);
        await place_monster(mdef, dx, dy);
        await newsym(ax, ay);
        await newsym(dx, dy);
    }
    return status;
}
export async function explmm(magr, mdef, mattk) {
    let result = 0;
    if (magr.mcan) {
        return 0;
    }
    if (((game.viz_array[magr.my][magr.mx] & 2) != 0)) {
        await pline_mon(magr, "%s explodes!", await Monnam(magr));
    } else {
        await noises(magr, mattk);
    }
    if (mattk.adtyp == 2 || mattk.adtyp == 3 || mattk.adtyp == 6) {
        await mon_explodes(magr, mattk);
        /* unconditionally set AGR_DIED here; lifesaving is accounted below */
        result = 4 | (((mdef).mhp < 1) ? 2 : 0);
    } else {
        result = await mdamagem(magr, mdef, mattk, null, 0);
    }
    if (!(result & 4)) {
        /* Kill off aggressor if it didn't die. */
        let was_leashed = (magr.mleashed != 0);
        await mondead(magr);
        if (!((magr).mhp < 1)) {
            return result;
        }
        result |= 4;
        if (was_leashed) {
            await Your("leash falls slack.");
        }
    }
    if (magr.mtame) {
        await You(brief_feeling, "melancholy");
    }
    return result;
}
/*
 *  See comment at top of mattackm(), for return values.
 */
export async function mdamagem(magr, mdef, mattk, mwep, dieroll) {
    let pa = magr.data;
    let pd = mdef.data;
    let mhm = { damage: 0, hitflags: 0, done: 0, permdmg: 0, specialdmg: 0, dieroll: 0 };
    mhm.damage = d(mattk.damn, mattk.damd);
    mhm.hitflags = 0;
    mhm.permdmg = 0;
    mhm.specialdmg = 0;
    mhm.dieroll = dieroll;
    mhm.done = (0);
    if ((((pd) == game.mons[PM_COCKATRICE] || (pd) == game.mons[PM_CHICKATRICE]) || (mattk.adtyp == 26 && pd == game.mons[PM_MEDUSA])) && !await Resists_Elem(magr, STONE_RES)) {
        let protector = attk_protection(mattk.aatyp);
        let wornitems = magr.misc_worn_check;
        /* wielded weapon gives same protection as gloves here */
        if (mwep) {
            wornitems |= 16;
        }
        if (protector == 0 || (protector != ~0 && (wornitems & protector) != protector)) {
            if (poly_when_stoned(pa)) {
                await mon_to_stone(magr);
                return 1;
            }
            if (game.vis && (canseemon(magr) || sensemon(magr))) {
                await pline_mon(magr, "%s turns to stone!", await Monnam(magr));
            }
            await monstone(magr);
            if (!((magr).mhp < 1)) {
                return 1;
            } else if (magr.mtame && !game.vis) {
                await You(brief_feeling, "peculiarly sad");
            }
            return 4;
        }
    }
    await mhitm_adtyping(magr, mattk, mdef, mhm);
    if (await mhitm_knockback(magr, mdef, mattk, { get value() { return mhm.hitflags; }, set value(_v) { mhm.hitflags = _v; } }, (((magr).mw) != null)) && ((mhm.hitflags & (2 | 1)) != 0 || ((mdef).mstate != 0))) {
        return mhm.hitflags;
    }
    if (mhm.done) {
        return mhm.hitflags;
    }
    if (!mhm.damage) {
        return mhm.hitflags;
    }
    mdef.mhp -= mhm.damage;
    if (mdef.mhp < 1) {
        if ((game.level.monsters[mdef.mx][mdef.my]) == magr) {
            game.level.monsters[mdef.mx][mdef.my] = null;
            /* otherwise place_monster will complain */
            mdef.mhp = 1;
            await place_monster(mdef, mdef.mx, mdef.my);
            mdef.mhp = 0;
        }
        if (mattk.aatyp == 254 || mattk.aatyp == 1) {
            game.mkcorpstat_norevive = ((mdef).data.mlet == S_TROLL && (mwep) && (mwep).oartifact == ART_TROLLSBANE) ? (1) : (0);
        }
        game.zombify = (!mwep && zombie_maker(magr) && (mattk.aatyp == 5 || mattk.aatyp == 1 || mattk.aatyp == 2) && zombie_form(mdef.data) != NON_PM);
        await monkilled(mdef, "", mattk.adtyp);
        game.zombify = (0);
        game.mkcorpstat_norevive = (0);
        if (!((mdef).mhp < 1)) {
            return mhm.hitflags;
        } else if (mhm.hitflags == 4) {
            return (2 | 4);
        }
        if (mattk.adtyp == 26) {
            if (((mdef.cham) >= LOW_PM && (mdef.cham) < NUMMONS)) {
                await newcham(magr, null, 1);
            } else if (pd == game.mons[PM_GREEN_SLIME] && !((pa) == game.mons[PM_GREEN_SLIME] || ((pa) == game.mons[PM_FIRE_VORTEX] || (pa) == game.mons[PM_FLAMING_SPHERE] || (pa) == game.mons[PM_FIRE_ELEMENTAL] || (pa) == game.mons[PM_SALAMANDER]) || ((pa).mlet == S_GHOST))) {
                await newcham(magr, game.mons[PM_GREEN_SLIME], 1);
            } else if (pd == game.mons[PM_WRAITH]) {
                await grow_up(magr, null);
                return (2 | (!((magr).mhp < 1) ? 0 : 4));
            } else if (pd == game.mons[PM_NURSE]) {
                await healmon(magr, magr.mhpmax, 0);
            }
            await mon_givit(magr, pd);
        }
        return (2 | (await grow_up(magr, mdef) ? 0 : 4));
    }
    return (mhm.hitflags == 4) ? 4 : 1;
}
const __mon_poly_freaky = " undergoes a freakish metamorphosis";
export async function mon_poly(magr, mdef, dmg) {
    let oldform = mdef.data;
    if (mdef == game.youmonst) {
        if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
            await shieldeff(game.u.ux, game.u.uy);
        } else if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
            ;
        } else {
            if (game.u.ulycn == NON_PM) {
                await You("are subjected to a freakish metamorphosis.");
                await polyself(POLY_NOFLAGS);
            } else if (game.u.umonnum != game.u.ulycn) {
                await You_feel("an unnatural urge coming on.");
                await you_were();
            } else {
                await You_feel("a natural urge coming on.");
                await you_unwere((0));
            }
            dmg = 0;
        }
    } else {
        let Before = '';
        Before = strcpy(Before, await Monnam(mdef));
        if (resists_magm(mdef)) {
            if (game.vis) {
                await shieldeff_mon(mdef);
            }
        } else if (await resist(mdef, WAND_CLASS, 0, 1)) {
            ;
        } else if (!rn2(25) && mdef.cham == NON_PM && (mdef.mcan || pm_to_cham(((mdef.data).pmidx)) != NON_PM)) {
            if (game.vis) {
                await pline("%s shudders!", Before);
            }
            dmg += Math.trunc((mdef.mhpmax + 1) / 2);
            mdef.mhp -= dmg;
            dmg = 0;
            if (((mdef).mhp < 1)) {
                if (magr == game.youmonst) {
                    await xkilled(mdef, 0 | 2);
                } else {
                    await monkilled(mdef, "", 242);
                }
            }
        } else if (await newcham(mdef, null, 0)) {
            if (game.vis) {
                let was_seen = !!strncmpi(("It"), (Before), -1);
                let verbosely = game.flags.verbose || !was_seen;
                if ((canseemon(mdef) || sensemon(mdef))) {
                    await pline("%s%s%s turns into %s.", Before, verbosely ? __mon_poly_freaky : "", verbosely ? " and" : "", await x_monnam(mdef, 2, null, (32 | 1 | 2), (0)));
                } else if (was_seen || magr == game.youmonst) {
                    await pline("%s%s%s.", Before, __mon_poly_freaky, !was_seen ? "" : " and disappears");
                }
            }
            dmg = 0;
            if ((((magr.data).mflags1 & 33554432) != 0)) {
                if (magr == game.youmonst) {
                    await tele();
                } else if (!await tele_restrict(magr)) {
                    await rloc(magr, 2);
                }
            }
        } else {
            if (game.vis && game.flags.verbose) {
                await pline("%s", c_common_strings.c_nothing_happens);
            }
        }
    }
    /* when a transformation has happened, can't attack again for poly
       effect during next turn or two; not enforced for poly'd hero */
    if (mdef.data != oldform && magr != game.youmonst) {
        magr.mspec_used += rnd(2);
    }
    return dmg;
}
export function paralyze_monst(mon, amt) {
    if (amt > 127) {
        amt = 127;
    }
    mon.mcanmove = 0;
    mon.mfrozen = amt;
    /* terminate any meal-in-progress */
    mon.meating = 0;
    mon.mstrategy &= ~536870912;
}
/* `mon' is hit by a sleep attack; return 1 if it's affected, 0 otherwise */
export async function sleep_monst(mon, amt, how) {
    /* reveal mimic unless already asleep or paralyzed (won't be 'busy') */
    if (how >= 0 && !mon.msleeping && !mon.mfrozen && mon.data.mlet == S_MIMIC && (((mon).m_ap_type & 7) == M_AP_FURNITURE || ((mon).m_ap_type & 7) == M_AP_OBJECT)) {
        await seemimic(mon);
    }
    if (await Resists_Elem(mon, SLEEP_RES) || await defended(mon, 4) || (how >= 0 && await resist(mon, how, 0, 0))) {
        await shieldeff(mon.mx, mon.my);
    } else if (mon.mcanmove) {
        await finish_meating(mon);
        amt += mon.mfrozen;
        if (amt > 0) {
            mon.mcanmove = 0;
            mon.mfrozen = ((amt) < (127) ? (amt) : (127));
        } else {
            mon.msleeping = 1;
        }
        return 1;
    }
    return 0;
}
/* sleeping grabber releases, engulfer doesn't; don't use for paralysis! */
export async function slept_monst(mon) {
    if (((mon).msleeping || !(mon).mcanmove) && mon == game.u.ustuck && !sticks(game.youmonst.data) && !game.u.uswallow) {
        await pline_mon(mon, "%s grip relaxes.", s_suffix(await Monnam(mon)));
        await unstuck(mon);
    }
}
export async function rustm(mdef, obj) {
    let dmgtyp = -1;
    let chance = 1;
    if (!mdef || !obj) {
        return;
    }
    if (dmgtype(mdef.data, 42)) {
        /* AD_ACID and AD_ENCH are handled in passivemm() and passiveum() */
        dmgtyp = 3;
    } else if (dmgtype(mdef.data, 24)) {
        dmgtyp = 1;
    } else if (dmgtype(mdef.data, 2) && mdef.data != game.mons[PM_STEAM_VORTEX]) {
        /* steam vortex: fire resist applies, fire damage doesn't */
        dmgtyp = 0;
        chance = 6;
    }
    if (dmgtyp != -1 && !rn2(chance)) {
        await erode_obj(obj, null, dmgtyp, 1 | 4);
    }
}
/* attacker */
/* defender */
/* attacker's weapon */
export async function mswingsm(magr, mdef, otemp) {
    if (game.flags.verbose && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && mon_visible(magr)) {
        let bash = (((otemp.oclass == WEAPON_CLASS || otemp.oclass == TOOL_CLASS) && (game.objects[otemp.otyp].oc_subtyp == P_POLEARMS || game.objects[otemp.otyp].oc_subtyp == P_LANCE || is_art(otemp, ART_SNICKERSNEE))) && !is_art(otemp, ART_SNICKERSNEE) && (dist2(magr.mx, magr.my, mdef.mx, mdef.my) <= 2));
        await pline("%s %s %s%s %s at %s.", await Monnam(magr), mswings_verb(otemp, bash), (otemp.quan > 1) ? "one of " : "", (genders[pronoun_gender(magr, 2)].his), await xname(otemp), await mon_nam(mdef));
    }
}
/*
 * Passive responses by defenders.  Does not replicate responses already
 * handled above.  Returns same values as mattackm.
 */
export async function passivemm(magr, mdef, mhitb, mdead, mwep) {
    let mddat = null;
    let madat = null;
    let buf = '';
    let i = 0;
    let tmp = 0;
    let mhit = 0;
    assess_dmg: {
        mddat = mdef.data;
        madat = magr.data;
        mhit = mhitb ? 1 : 0;
        for (i = 0; ; i++) {
            if (i >= 6) {
                return (mdead | mhit);
            }
            if (mddat.mattk[i].aatyp == 0) {
                break;
            }
        }
        if (mddat.mattk[i].damn) {
            tmp = d(mddat.mattk[i].damn, mddat.mattk[i].damd);
        } else if (mddat.mattk[i].damd) {
            tmp = d(mddat.mlevel + 1, mddat.mattk[i].damd);
        } else {
            tmp = 0;
        }
        switch (mddat.mattk[i].adtyp) {
            case 8:
                if (mhitb && !rn2(2)) {
                    buf = strcpy(buf, await Monnam(magr));
                    if (canseemon(magr)) {
                        await pline("%s is splashed by %s %s!", buf, s_suffix(await mon_nam(mdef)), hliquid("acid"));
                    }
                    if (await Resists_Elem(magr, ACID_RES)) {
                        if (canseemon(magr)) {
                            await pline("%s is not affected.", await Monnam(magr));
                        }
                        tmp = 0;
                    }
                } else {
                    tmp = 0;
                }
                if (!rn2(30)) {
                    await erode_armor(magr, 3);
                }
                if (!rn2(6)) {
                    await acid_damage(((magr).mw));
                }
                break assess_dmg;
            case 41:
                if (mhitb && !mdef.mcan && mwep) {
                    await drain_item(mwep, (0));
                }
                break;
            default:
                break;
        }
        if (mdead || mdef.mcan) {
            return (mdead | mhit);
        }
        if (rn2(3)) {
            switch (mddat.mattk[i].adtyp) {
                /* These affect the enemy only if defender is still alive */
                case 14:
                    if (tmp > 127) {
                        tmp = 127;
                    }
                    if (mddat == game.mons[PM_FLOATING_EYE]) {
                        if (!rn2(4)) {
                            tmp = 127;
                        }
                        if (magr.mcansee && (((madat).mflags1 & 4096) == 0) && mdef.mcansee && ((((madat).mflags1 & 16777216) != 0) || !mdef.minvis)) {
                            buf = strcpy(buf, s_suffix(await Monnam(mdef)));
                            /* construct format string; guard against '%' in Monnam */
                            strNsubst(buf, "%", "%%", 0);
                            buf = strcat(buf, " gaze is reflected by %s %s.");
                            if (await mon_reflects(magr, canseemon(magr) ? buf : null)) {
                                return (mdead | mhit);
                            }
                            buf = strcpy(buf, await Monnam(magr));
                            if (canseemon(magr)) {
                                await pline("%s is frozen by %s gaze!", buf, s_suffix(await mon_nam(mdef)));
                            }
                            paralyze_monst(magr, tmp);
                            return (mdead | mhit);
                        }
                    } else {
                        buf = strcpy(buf, await Monnam(magr));
                        if (canseemon(magr)) {
                            await pline("%s is frozen by %s.", buf, await mon_nam(mdef));
                        }
                        paralyze_monst(magr, tmp);
                        return (mdead | mhit);
                    }
                    return 1;
                case 3:
                    if (await Resists_Elem(magr, COLD_RES)) {
                        if (canseemon(magr)) {
                            await pline_mon(magr, "%s is mildly chilly.", await Monnam(magr));
                            await golemeffects(magr, 3, tmp);
                        }
                        tmp = 0;
                        break;
                    }
                    if (canseemon(magr)) {
                        await pline_mon(magr, "%s is suddenly very cold!", await Monnam(magr));
                    }
                    await healmon(mdef, Math.trunc(tmp / 2), Math.trunc(tmp / 2));
                    if (mdef.mhpmax > ((mdef.m_lev + 1) * 8)) {
                        await split_mon(mdef, magr);
                    }
                    break;
                case 12:
                    if (!magr.mstun) {
                        magr.mstun = 1;
                        if (canseemon(magr)) {
                            await pline_mon(magr, "%s %s...", await Monnam(magr), await makeplural(stagger(magr.data, "stagger")));
                        }
                    }
                    tmp = 0;
                    break;
                case 2:
                    if (await Resists_Elem(magr, FIRE_RES)) {
                        if (canseemon(magr)) {
                            await pline_mon(magr, "%s is mildly warmed.", await Monnam(magr));
                            await golemeffects(magr, 2, tmp);
                        }
                        tmp = 0;
                        break;
                    }
                    if (canseemon(magr)) {
                        await pline_mon(magr, "%s is suddenly very hot!", await Monnam(magr));
                    }
                    break;
                case 6:
                    if (await Resists_Elem(magr, SHOCK_RES)) {
                        if (canseemon(magr)) {
                            await pline_mon(magr, "%s is mildly tingled.", await Monnam(magr));
                            await golemeffects(magr, 6, tmp);
                        }
                        tmp = 0;
                        break;
                    }
                    if (canseemon(magr)) {
                        await pline_mon(magr, "%s is jolted with electricity!", await Monnam(magr));
                    }
                    break;
                default:
                    tmp = 0;
                    break;
            }
        } else {
            tmp = 0;
        }
    }
    if ((magr.mhp -= tmp) <= 0) {
        await monkilled(magr, "", mddat.mattk[i].adtyp);
        return (mdead | mhit | 4);
    }
    return (mdead | mhit);
}
/* hero or monster has successfully hit target mon with drain energy attack */
export async function xdrainenergym(mon, givemsg) {
    if (mon.mspec_used < 20 && (attacktype(mon.data, 255) || attacktype(mon.data, 12))) {
        mon.mspec_used += d(2, 2);
        if (givemsg) {
            await pline_mon(mon, "%s seems lethargic.", await Monnam(mon));
        }
    }
}
/* "aggressive defense"; what type of armor prevents specified attack
   from touching its target? */
export function attk_protection(aatyp) {
    let w_mask = 0;
    switch (aatyp) {
        case 0:
        case 10:
        case 13:
        case 14:
        case 15:
        case 12:
        case 255:
            w_mask = ~0;
            break;
        case 1:
        case 5:
        case 254:
            w_mask = 16;
            break;
        case 3:
            w_mask = 32;
            break;
        case 4:
            w_mask = 4;
            break;
        case 7:
            w_mask = (2 | 16);
            break;
        case 2:
        case 6:
        case 11:
        case 16:
        default:
            w_mask = 0;
            break;
    }
    return w_mask;
}
/*mhitm.c*/
/* unhiding or unmimicking happens even if hero can't see it
       because the formerly concealed monster is now in action */
/* perhaps we're holding it... */
/* Be careful to ignore monsters that are already dead, since we
         * might be calling this before we've cleaned them up.  This can
         * happen if the monster attacked a cockatrice bare-handedly, for
         * instance.
         */
/* pick up from orig position */
/* either creature might move into or out of a poison gas cloud */
/* D: Do a ranged attack here! */
/* KMH -- don't accumulate to-hit bonuses */
/* note: monsters with hug attacks don't wear cloaks or gloves
                   so this doesn't need a special case for hugging a shade
                   while covered by blessed armor (which does damage but does
                   not achieve a successful hold); likewise, rope golems can't
                   wield weapons so ability to choke isn't affected by such */
/* purple worm can't swallow unsolid mons */
/*
             * Ranged attacks aren't allowed at point blank range.
             *
             * That impacts pet use of ranged attacks.  It's rather arbitrary
             * but various parts of the code assume it to be the case, not to
             * mention a part of player tactics when fighting dragons.
             */
/* hero poly'd into long worm can't grow tail
                   so no 'youmonst' handling is needed here */
/* unsolid grab misses are actually somewhat iffy--how come
               ordinary attacks don't also pass right through? */
/* beware of "Foo's grab passes through Bar's ghost";
               mon_nam(x_monnam) calls s_suffix() for named ghosts and
               s_suffix() uses a single static buffer; make copies of both
               names to overcome that [note: comment predates 'tailmiss'] */
/* call mon_reflects 2x, first test, then, if visible, print message */
/* 'it' -- previous form is no longer available and
               using that would be excessively verbose */
/*
     *  Leave the defender in the monster chain at its current position,
     *  but don't leave it on the screen.  Move the aggressor to the
     *  defender's position.
     */
/* both died -- do nothing  */
/*
         *  Note: mdamagem() -> monkilled() -> mondead() -> m_detach()
         *  -> relmon() used to call remove_monster() for the dead
         *  monster even when it wasn't the one on the map, so we
         *  needed to put magr back after mdef was killed and removed
         *  from their shared spot.  But now [5.0] relmon() calls
         *  mon_leaving_level() and that checks whether the monster at
         *  dying monster's coordinates is that dying monster and only
         *  removes it when they match.  So magr is still at mdef's
         *  former spot these days.
         *
         *  We still potentially do one fixup:  if the gulp targeted
         *  an inhospitable location, magr will return to its previous
         *  spot instead of staying.
         */
/* aggressor moves to <dx,dy> and might encounter trouble there */
/* both alive, put them back */
/* monster explosion types which actually create an explosion */
/* mondead() -> m_detach() -> m_unleash() always suppresses
           the m_unleash() slack message, so deliver it here instead */
/* give this one even if it was visible */
/* various checks similar to dog_eat and meatobj.
             * after monkilled() to provide better message ordering */
/* caveat: above digestion handling doesn't keep `pa' up to date */
/* just take a little damage */
/* system shock might take place in polyself() */
/* general resistance to magic... */
/* system shock; this variation takes away half of mon's HP
               rather than kill outright */
/* These affect the enemy even if defender killed */
/* KMH -- remove enchantment (disenchanter) */
