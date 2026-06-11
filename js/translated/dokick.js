/* NetHack 5.0	dokick.c	$NHDT-Date: 1712453347 2024/04/07 01:29:07 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.223 $ */
/* Copyright (c) Izchak Miller, Mike Stephenson, Steve Linhart, 1989. */
/* NetHack may be freely redistributed.  See license for details. */
/* gk.kickedobj (decl.c) tracks a kicked object until placed or destroyed */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { You, You_cant, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_char_at0, strcat, strchr, strcpy, strncpy } from '../c2js-runtime/string.js';
import { snuff_candle } from './apply.js';
import { is_art, undiscovered_artifact } from './artifact.js';
import { acurr, acurrstr, adjalign, change_luck, exercise } from './attrib.js';
import { getdir, isok, yn_function } from './cmd.js';
import { find_drawbridge, is_drawbridge_wall, is_ice, is_pool } from './dbridge.js';
import { c_color_names, c_common_strings, ynchars } from './decl.js';
import { cvt_sdoor_to_door, find_trap } from './detect.js';
import { canseemon, feel_location, feel_newsym, glyph_at, map_invisible, newsym, sensemon, show_glyph, unmap_invisible } from './display.js';
import { flooreffects, legs_in_no_shape, set_wounded_legs } from './do.js';
import { Monnam, a_monnam, christen_orc, free_oname, hcolor, hliquid, mon_nam } from './do_name.js';
import { abuse_dog } from './dog.js';
import { finish_meating } from './dogmove.js';
import { breaks, breaktest, hero_breaks, hurtle, thitmonst } from './dothrow.js';
import { In_mines, Is_botlevel, dunlev, dunlevs_in_dungeon, on_level, surface } from './dungeon.js';
import { del_engr_at, disturb_grave, u_wipe_engr } from './engrave.js';
import { scatter } from './explode.js';
import { sink_backs_up } from './fountain.js';
import { impact_disturbs_zombies, in_rooms, in_town, inv_weight, losehp, money_cnt, near_capacity, overexertion, weight_cap } from './hack.js';
import { upstart } from './hacklib.js';
import { currency, delobj, sobj_at, stackobj, useup } from './invent.js';
import { breakchestlock } from './lock.js';
import { makemon } from './makemon.js';
import { add_to_migration, add_to_minv, dealloc_obj, mkgold, mksobj, mksobj_at, obj_extract_self, place_object, rnd_treefruit_at, splitobj, weight } from './mkobj.js';
import { angry_guards, get_iter_mons, get_iter_mons_xy, killed, maybe_mnexto, maybe_unhide_at, seemimic, setmangry, wake_nearby, wake_nearto, wakeup } from './mon.js';
import { attacktype, dmgtype_fromattack, poly_when_stoned, pronoun_gender } from './mondata.js';
import { closed_door, mon_yells, monflee, set_apparxy } from './monmove.js';
import { AIR, ALTAR, ART_EYES_OF_THE_OVERWORLD, ART_MJOLLNIR, A_CHA, A_CON, A_DEX, A_STR, A_WIS, BAG_OF_HOLDING, BAG_OF_TRICKS, BLINDED, BOULDER, CHEST, CLOUD, COIN_CLASS, CORPSE, CORR, DBWALL, DEAF, DILITHIUM_CRYSTAL, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, EGG, EXPENSIVE_CAMERA, FOOT, FOUNTAIN, FUMBLING, GEM_CLASS, GLASS, GLYPH_INVIS_OFF, GRAVE, HALF_PHDAM, HALLUC, HALLUC_RES, HOLE, IRONBARS, KICKED_WEAPON, KICKING_BOOTS, LADDER, LARGE_BOX, LAVAWALL, LEG, LEVITATION, LOW_PM, LUCKSTONE, MIRROR, M_AP_MONSTER, NON_PM, NUMMONS, PASSES_WALLS, PIT, PM_AMOROUS_DEMON, PM_ARCHEOLOGIST, PM_BLACK_PUDDING, PM_CAPTAIN, PM_CHICKATRICE, PM_COCKATRICE, PM_KILLER_BEE, PM_LIEUTENANT, PM_MONK, PM_SAMURAI, PM_SASQUATCH, PM_SERGEANT, PM_SHADE, PM_SOLDIER, PM_STONE_GOLEM, PM_WATCHMAN, PM_WATCH_CAPTAIN, POOL, P_BARE_HANDED_COMBAT, P_NONE, ROCK, ROOM, SCORR, SDOOR, SHOPBASE, SINK, SLT_ENCUMBER, SPIKED_PIT, STAIRS, STATUE_TRAP, STONE, STONE_RES, S_EEL, S_EYE, S_LIGHT, S_LIZARD, THRONE, TRAPDOOR, TREE, TT_BEARTRAP, TT_PIT, TT_WEB, Trap_Killed_Mon, WEB, WOUNDED_LEGS } from './nh-constants.js';
import { An, Doname2, The, Tobjnam, corpse_xname, distant_name, doname, killer_xname, makeplural, otense, rnd_class, singular, xname } from './objnam.js';
import { Norep, There } from './pline.js';
import { body_part, poly_gender, polymon } from './polyself.js';
import { altar_wrath } from './pray.js';
import { ok_to_quest } from './quest.js';
import { m_in_out_region } from './region.js';
import { rn2, rnd, rnl } from './rnd.js';
import { genders } from './role.js';
import { add_damage, addtobill, contained_gold, costly_adjacent, costly_gold, costly_spot, donate_gold, find_objowner, hot_pursuit, inside_shop, is_unpaid, make_angry_shk, make_happy_shk, obfree, pay_for_damage, picked_container, shop_keeper, stolen_value, subfrombill } from './shk.js';
import { Shknam, shkname } from './shknam.js';
import { stairway_at, stairway_find_from } from './stairs.js';
import { mpickobj, remove_worn_item } from './steal.js';
import { kick_steed, place_monster } from './steed.js';
import { enexto, goodpos, noteleport_level, rloco } from './teleport.js';
import { activate_statue_trap, b_trapped, chest_trap, fall_through, instapetrify, mintrap, t_at, water_damage } from './trap.js';
import { attack_checks, check_caitiff, damageum, find_roll_to_hit, missum, mon_maybe_unparalyze, passive } from './uhitm.js';
import { hidden_gold } from './vault.js';
import { recalc_block_point, unblock_point } from './vision.js';
import { special_dmgval, use_skill } from './weapon.js';
import { bhit, miss, obj_resists } from './zap.js';

const kick_passes_thru = "kick passes harmlessly through";
/* kicking damage when not poly'd into a form with a kick attack */
export function kickdmg(mon, clumsy) {
    let mdx = 0;
    let mdy = 0;
    let dmg = Math.trunc(((acurrstr()) + (acurr(A_DEX)) + (acurr(A_CON))) / 15);
    let specialdmg = 0;
    let kick_skill = P_NONE;
    let trapkilled = (0);
    if (game.uarmf && game.uarmf.otyp == KICKING_BOOTS) {
        dmg += 5;
    }
    /* excessive wt affects dex, so it affects dmg */
    if (clumsy) {
        dmg = Math.trunc(dmg / 2);
    }
    /* kicking a dragon or an elephant will not harm it */
    if ((((mon.data).mflags1 & 2097152) != 0)) {
        dmg = 0;
    }
    /* attacking a shade is normally useless */
    if (mon.data == game.mons[PM_SHADE]) {
        dmg = 0;
    }
    specialdmg = special_dmgval(game.youmonst, mon, 32, null);
    if (mon.data == game.mons[PM_SHADE] && !specialdmg) {
        pline_The("%s.", kick_passes_thru);
        /* doesn't exercise skill or abuse alignment or frighten pet,
           and shades have no passive counterattack */
        return;
    }
    if (((mon).m_ap_type & 7)) {
        seemimic(mon);
    }
    check_caitiff(mon);
    if (mon.mtame) {
        /* squeeze some guilt feelings... */
        abuse_dog(mon);
        if (mon.mtame) {
            monflee(mon, (dmg ? rnd(dmg) : 1), (0), (0));
        } else {
            mon.mflee = 0;
        }
    }
    if (dmg > 0) {
        /* convert potential damage to actual damage */
        dmg = rnd(dmg);
        if ((((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS))) {
            if (dmg > 1) {
                kick_skill = P_BARE_HANDED_COMBAT;
            }
            dmg += rn2(Math.trunc((acurr(A_DEX)) / 2) + 1);
        }
        /* a good kick exercises your dex */
        exercise(A_DEX, (1));
    }
    /* for blessed (or hypothetically, silver) boots */
    dmg += specialdmg;
    if (game.uarmf) {
        dmg += game.uarmf.spe;
    }
    /* add ring(s) of increase damage */
    dmg += game.u.udaminc;
    if (dmg > 0) {
        mon.mhp -= dmg;
    }
    if (!((mon).mhp < 1) && (((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)) && !((mon.data).msize >= 3) && !rn2(3) && mon.mcanmove && mon != game.u.ustuck && !mon.mtrapped) {
        /* see if the monster has a place to move into */
        mdx = mon.mx + game.u.dx;
        mdy = mon.my + game.u.dy;
        if (goodpos(mdx, mdy, mon, 0)) {
            /* TODO: replace with mhurtle? */
            pline("%s reels from the blow.", Monnam(mon));
            if (m_in_out_region(mon, mdx, mdy)) {
                game.level.monsters[mon.mx][mon.my] = null;
                newsym(mon.mx, mon.my);
                place_monster(mon, mdx, mdy);
                newsym(mon.mx, mon.my);
                set_apparxy(mon);
                if (mintrap(mon, 0) == Trap_Killed_Mon) {
                    trapkilled = (1);
                }
            }
        }
    }
    passive(mon, game.uarmf, (1), !((mon).mhp < 1), 3, (0));
    if (((mon).mhp < 1) && !trapkilled) {
        killed(mon);
    }
    /* may bring up a dialog, so put this after all messages */
    if (kick_skill != P_NONE) {
        use_skill(kick_skill, 1);
    }
}
export function maybe_kick_monster(mon, x, y) {
    if (mon) {
        let save_forcefight = game.context.forcefight;
        game.bhitpos.x = x;
        game.bhitpos.y = y;
        if (!mon.mpeaceful || !(canseemon(mon) || sensemon(mon))) {
            game.context.forcefight = (1);
        }
        /* attack even if invisible */
        /* kicking might be halted by discovery of hidden monster,
           by player declining to attack peaceful monster,
           or by passing out due to encumbrance */
        if (attack_checks(mon, null) || overexertion()) {
            mon = null;
        }
        game.context.forcefight = save_forcefight;
    }
    return (mon != null);
}
export function kick_monster(mon, x, y) {
    let clumsy = 0;
    let i = 0;
    let j = 0;
    doit: {
        clumsy = (0);
        /* anger target even if wild miss will occur */
        setmangry(mon, (1));
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !rn2(3) && ((mon.data).msize < 1) && !(((mon.data).mflags1 & 1) != 0)) {
            pline("Floating in the air, you miss wildly!");
            exercise(A_DEX, (0));
            passive(mon, game.uarmf, (0), 1, 3, (0));
            return;
        }
        if (mon.mundetected || (((mon).m_ap_type & 7) && ((mon).m_ap_type & 7) != M_AP_MONSTER)) {
            /* reveal hidden target even if kick ends up missing (note: being
       hidden doesn't affect chance to hit so neither does this reveal) */
            if (((mon).m_ap_type & 7)) {
                seemimic(mon);
            }
            mon.mundetected = 0;
            if (!(canseemon(mon) || sensemon(mon))) {
                /* check <x,y>; monster that evades kick by jumping
                      to an unseen square doesn't leave an I behind */
                map_invisible(x, y);
            } else {
                newsym(x, y);
            }
            There("is %s here.", (canseemon(mon) || sensemon(mon)) ? a_monnam(mon) : "something hidden");
        }
        if ((game.u.umonnum != game.u.umonster) && attacktype(game.youmonst.data, 3)) {
            /* Kick attacks by kicking monsters are normal attacks, not special.
     * This is almost always worthless, since you can either take one turn
     * and do all your kicks, or else take one turn and attack the monster
     * normally, getting all your attacks _including_ all your kicks.
     * If you have >1 kick attack, you get all of them.
     */
            let uattk = null;
            let sum = 0;
            let kickdieroll = 0;
            let armorpenalty = 0;
            let specialdmg = 0;
            let attknum = 0;
            let tmp = find_roll_to_hit(mon, 3, null, { get value() { return attknum; }, set value(_v) { attknum = _v; } }, { get value() { return armorpenalty; }, set value(_v) { armorpenalty = _v; } });
            mon_maybe_unparalyze(mon);
            for (i = 0; i < 6; i++) {
                /* first of two kicks might have provoked counterattack
               that has incapacitated the hero (ie, floating eye) */
                if (game.multi < 0) {
                    /* skip any additional kicks */
                    break;
                }
                uattk = game.youmonst.data.mattk[i];
                /* we only care about kicking attacks here */
                if (uattk.aatyp != 3) {
                    continue;
                }
                kickdieroll = rnd(20);
                specialdmg = special_dmgval(game.youmonst, mon, 32, null);
                if (mon.data == game.mons[PM_SHADE] && !specialdmg) {
                    /* doesn't matter whether it would have hit or missed,
                   and shades have no passive counterattack */
                    Your("%s %s.", kick_passes_thru, mon_nam(mon));
                    break;
                } else if (tmp > kickdieroll) {
                    You("kick %s.", mon_nam(mon));
                    sum = damageum(mon, uattk, specialdmg);
                    passive(mon, game.uarmf, (sum != 0), !(sum & 2), 3, (0));
                    if ((sum & 2)) {
                        break;
                    }
                } else {
                    missum(mon, uattk, (tmp + armorpenalty > kickdieroll));
                    passive(mon, game.uarmf, (0), 1, 3, (0));
                }
            }
            return;
        }
        i = -inv_weight();
        j = weight_cap();
        if (i < Math.trunc((j * 3) / 10)) {
            if (!rn2((i < Math.trunc(j / 10)) ? 2 : (i < Math.trunc(j / 5)) ? 3 : 4)) {
                /* What the following confusing if statements mean:
     * If you are over 70% of carrying capacity, you go through a "deal no
     * damage" check, and if that fails, a "clumsy kick" check.
     * At this % of carrycap | Chance of no damage | Chance of clumsiness
     *             [70%-80%) |                 1/4 |                  1/3
     *             [80%-90%) |                 1/3 |                  1/2
     *            [90%-100%) |                 1/2 |                   1
     */
                if ((((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS))) {
                    break doit;
                }
                Your("clumsy kick does no damage.");
                passive(mon, game.uarmf, (0), 1, 3, (0));
                return;
            }
            if (i < Math.trunc(j / 10)) {
                clumsy = (1);
            } else if (!rn2((i < Math.trunc(j / 5)) ? 2 : 3)) {
                clumsy = (1);
            }
        }
        if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) {
            clumsy = (1);
        } else if (game.uarm && game.objects[game.uarm.otyp].oc_big && (acurr(A_DEX)) < rnd(25)) {
            clumsy = (1);
        }
    }
    You("kick %s.", mon_nam(mon));
    if (!rn2(clumsy ? 3 : 4) && (clumsy || !((mon.data).msize >= 3)) && mon.mcansee && !mon.mtrapped && !(((mon.data).mflags1 & 2097152) != 0) && mon.data.mlet != S_EEL && (((mon.data).mflags1 & 4096) == 0) && mon.mcanmove && !mon.mstun && !mon.mconf && !mon.msleeping && mon.data.mmove >= 12) {
        if (!(((mon.data).mflags1 & 8192) != 0) && !rn2((((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)) ? 5 : 3)) {
            pline("%s blocks your %skick.", Monnam(mon), clumsy ? "clumsy " : "");
            passive(mon, game.uarmf, (0), 1, 3, (0));
            return;
        } else {
            maybe_mnexto(mon);
            if (mon.mx != x || mon.my != y) {
                unmap_invisible(x, y);
                pline("%s %s, %s evading your %skick.", Monnam(mon), ((((mon.data).mflags1 & 33554432) != 0) && !noteleport_level(mon)) ? "teleports" : ((mon.data).mlet == S_EYE || (mon.data).mlet == S_LIGHT) ? "floats" : (((mon.data).mflags1 & 1) != 0) ? "swoops" : ((((mon.data).mflags1 & 24576) == 24576) || (((mon.data).mflags1 & 524288) != 0)) ? "slides" : "jumps", clumsy ? "easily" : "nimbly", clumsy ? "clumsy " : "");
                passive(mon, game.uarmf, (0), 1, 3, (0));
                return;
            }
        }
    }
    kickdmg(mon, clumsy);
}
/*
 *  Return TRUE if caught (the gold taken care of), FALSE otherwise.
 *  The gold object is *not* attached to the fobj chain!
 */
export function ghitm(mtmp, gold) {
    let msg_given = (0);
    if (!(((mtmp.data).mflags2 & 268435456) != 0) && !mtmp.isshk && !mtmp.ispriest && !mtmp.isgd && !(((mtmp.data).mflags2 & 512) != 0)) {
        wakeup(mtmp, (1));
    } else if (!mtmp.mcanmove) {
        if (canseemon(mtmp)) {
            /* too light to do real damage */
            pline_The("%s harmlessly %s %s.", xname(gold), otense(gold, "hit"), mon_nam(mtmp));
            msg_given = (1);
        }
    } else {
        let was_sleeping = mtmp.msleeping;
        let umoney = 0;
        let value = gold.quan * game.objects[gold.otyp].oc_cost;
        /* end indeterminate sleep (won't get here
                              * for temporary--counted--sleep since that
                              * uses mfrozen and mfrozen implies !mcanmove) */
        mtmp.msleeping = 0;
        finish_meating(mtmp);
        if (!mtmp.isgd && !rn2(4)) {
            setmangry(mtmp, (1));
        }
        /* greedy monsters catch gold */
        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
            pline("%s %scatches the gold.", Monnam(mtmp), was_sleeping ? "awakens and " : "");
        }
        mpickobj(mtmp, gold);
        gold = null;
        if (mtmp.isshk) {
            let robbed = ((mtmp).mextra.eshk).robbed;
            if (robbed) {
                robbed -= value;
                if (robbed < 0) {
                    robbed = 0;
                }
                pline_The("amount %scovers %s recent losses.", !robbed ? "" : "partially ", (genders[pronoun_gender(mtmp, 2)].his));
                ((mtmp).mextra.eshk).robbed = robbed;
                if (!robbed) {
                    make_happy_shk(mtmp, (0));
                }
            } else {
                ;
                if (mtmp.mpeaceful) {
                    ((mtmp).mextra.eshk).credit += value;
                    You("have %ld %s in credit.", ((mtmp).mextra.eshk).credit, currency(((mtmp).mextra.eshk).credit));
                } else {
                    verbalize("Thanks, scum!");
                }
            }
        } else if (mtmp.ispriest) {
            ;
            if (mtmp.mpeaceful) {
                verbalize("Thank you for your contribution.");
            } else {
                verbalize("Thanks, scum!");
            }
        } else if (mtmp.isgd) {
            umoney = money_cnt(game.invent);
            ;
            /* Some of these are iffy, because a hostile guard
               won't become peaceful and resume leading hero
               out of the vault.  If he did do that, player
               could try fighting, then weasel out of being
               killed by throwing his/her gold when losing. */
            verbalize(umoney ? "Drop the rest and follow me." : hidden_gold((1)) ? "You still have hidden gold.  Drop it now." : mtmp.mpeaceful ? "I'll take care of that; please move along." : "I'll take that; now get moving.");
        } else if ((((mtmp.data).mflags2 & 512) != 0)) {
            let was_angry = !mtmp.mpeaceful;
            let goldreqd = 0;
            if (mtmp.data == game.mons[PM_SOLDIER]) {
                goldreqd = 100;
            } else if (mtmp.data == game.mons[PM_SERGEANT]) {
                goldreqd = 250;
            } else if (mtmp.data == game.mons[PM_LIEUTENANT]) {
                goldreqd = 500;
            } else if (mtmp.data == game.mons[PM_CAPTAIN]) {
                goldreqd = 750;
            }
            if (goldreqd && rn2(3)) {
                umoney = money_cnt(game.invent);
                goldreqd += Math.trunc((umoney + game.u.ulevel * rn2(5)) / (acurr(A_CHA)));
                if (value > goldreqd) {
                    mtmp.mpeaceful = (1);
                }
            }
            if (!mtmp.mpeaceful) {
                ;
                if (goldreqd) {
                    verbalize("That's not enough, coward!");
                } else {
                    verbalize("I don't take bribes from scum like you!");
                }
            } else if (was_angry) {
                ;
                verbalize("That should do.  Now beat it!");
            } else {
                ;
                verbalize("Thanks for the tip, %s.", game.flags.female ? "lady" : "buddy");
            }
        }
        return (1);
    }
    if (!msg_given) {
        miss(xname(gold), mtmp);
    }
    return (0);
}
/* container is kicked, dropped, thrown or otherwise impacted by player.
 * Assumes container is on floor.  Checks contents for possible damage. */
/* coordinates where object was */
/* before the impact, not after */
export function container_impact_dmg(obj, x, y) {
    let shkp = null;
    let otmp = null;
    let otmp2 = null;
    let loss = 0;
    let costly = 0;
    let insider = 0;
    let frominv = 0;
    let wchange = (0);
    /* only consider normal containers */
    if (!((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) || !((obj).cobj != null) || ((obj).otyp == BAG_OF_HOLDING || (obj).otyp == BAG_OF_TRICKS)) {
        return;
    }
    costly = ((shkp = shop_keeper(in_rooms(x, y, SHOPBASE))) && costly_spot(x, y));
    insider = (game.u.ushops && inside_shop(game.u.ux, game.u.uy) && in_rooms(x, y, SHOPBASE) == game.u.ushops);
    /* if dropped or thrown, shop ownership flags are set on this obj */
    frominv = (obj != game.kickedobj);
    for (otmp = obj.cobj; otmp; otmp = otmp2) {
        /* some things break rather than ship */
        let result = null;
        otmp2 = otmp.nobj;
        if (game.objects[otmp.otyp].oc_material == GLASS && otmp.oclass != GEM_CLASS && !obj_resists(otmp, 33, 100)) {
            result = "shatter";
        } else if (otmp.otyp == EGG && !rn2(3)) {
            result = "cracking";
        }
        if (result) {
            if (otmp.otyp == MIRROR) {
                change_luck(-2);
            }
            /* eggs laid by you.  penalty is -1 per egg, max 5,
             * but it's always exactly 1 that breaks */
            /* penalty for breaking eggs laid by you */
            if (otmp.otyp == EGG && otmp.spe && ((otmp.corpsenm) >= LOW_PM && (otmp.corpsenm) < NUMMONS)) {
                change_luck(-1);
            }
            if (otmp.otyp == EGG) {
                ;
            } else {
                ;
            }
            You_hear("a muffled %s.", result);
            if (costly) {
                if (frominv && !otmp.unpaid) {
                    otmp.no_charge = 1;
                }
                loss += stolen_value(otmp, x, y, shkp.mpeaceful, (1));
            }
            if (otmp.quan > 1) {
                useup(otmp);
            } else {
                obj_extract_self(otmp);
                obfree(otmp, null);
            }
            /* contents of this container are no longer known */
            obj.cknown = 0;
            wchange = (1);
        }
    }
    if (wchange) {
        obj.owt = weight(obj);
    }
    if (costly && loss) {
        if (!insider) {
            You("caused %ld %s worth of damage!", loss, currency(loss));
            make_angry_shk(shkp, x, y);
        } else {
            You("owe %s %ld %s for objects destroyed.", shkname(shkp), loss, currency(loss));
        }
    }
}
/* jacket around really_kick_object */
export function kick_object(x, y, kickobjnam) {
    let res = 0;
    kickobjnam.value = 0;
    /* if a pile, the "top" object gets kicked */
    game.kickedobj = game.level.objects[x][y];
    if (game.kickedobj) {
        kickobjnam = strcpy(kickobjnam, killer_xname(game.kickedobj));
        /* formatted object name matters iff res==0 */
        /* kick object; if fatal, done() will clean up kickedobj */
        res = really_kick_object(x, y);
        game.kickedobj = null;
    }
    return res;
}
/* guts of kick_object */
const __really_kick_object_flyingcoinmsg = ["scatter the coins", "knock coins all over the place", "send coins flying in all directions"];
export function really_kick_object(x, y) {
    let range = 0;
    let mon = null;
    let shkp = null;
    let trap = null;
    let bhitroom = 0;
    let costly = 0;
    let isgold = 0;
    let slide = (0);
    /* gk.kickedobj should always be set due to conditions of call */
    if (!game.kickedobj || game.kickedobj.otyp == BOULDER || game.kickedobj == game.uball || game.kickedobj == game.uchain) {
        return 0;
    }
    if ((trap = t_at(x, y)) != null) {
        if ((((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT) && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) || trap.ttyp == WEB) {
            if (!trap.tseen) {
                find_trap(trap);
            }
            You_cant("kick %s that's in a %s!", c_common_strings.c_something, (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "tizzy" : (trap.ttyp == WEB) ? "web" : "pit");
            /* pretend the kick is fast enough for lava not to burn */
            return 1;
        }
        if (trap.ttyp == STATUE_TRAP) {
            activate_statue_trap(trap, x, y, (0));
            return 1;
        }
    }
    if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) && !rn2(3)) {
        Your("clumsy kick missed.");
        return 1;
    }
    if (!game.uarmf && game.kickedobj.otyp == CORPSE && ((game.mons[game.kickedobj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[game.kickedobj.corpsenm]) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        You("kick %s with your bare %s.", corpse_xname(game.kickedobj, null, 4), makeplural(body_part(FOOT)));
        if (poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM)) {
            ;
        } else {
            game.killer.name = sprintf(game.killer.name, "kicking %s barefoot", killer_xname(game.kickedobj));
            instapetrify(game.killer.name);
        }
    }
    isgold = (game.kickedobj.oclass == COIN_CLASS);
{
        let k_owt = game.kickedobj.owt;
        if (game.kickedobj.quan > 1 && !isgold) {
            /* hero has been transformed but kick continues */
            /* for non-gold stack, 1 item will be split off below (unless an
           early return occurs, so we aren't moving the split to here);
           calculate the range for that 1 rather than for the whole stack */
            let save_quan = game.kickedobj.quan;
            game.kickedobj.quan = 1;
            k_owt = weight(game.kickedobj);
            game.kickedobj.quan = save_quan;
        }
        /* range < 2 means the object will not move
           (maybe dexterity should also figure here) */
        range = Math.trunc(((acurrstr())) / 2) - Math.trunc(k_owt / 40);
    }
    if ((((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS))) {
        /* you're in air, since is_pool did not match */
        range += rnd(3);
    }
    if (is_pool(x, y)) {
        /* you're in the water too; significantly reduce range */
        /* {1,2}=>1, {3,4,5}=>2, {6,7,8}=>3 */
        range = Math.trunc(range / 3) + 1;
    } else if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        range += rnd(3);
    } else {
        if (is_ice(x, y)) {
            range += rnd(3) , slide = (1);
        }
        if (game.kickedobj.greased) {
            range += rnd(3) , slide = (1);
        }
    }
    /* Mjollnir is magically too heavy to kick */
    if (is_art(game.kickedobj, ART_MJOLLNIR)) {
        range = 1;
    }
    /* see if the object has a place to move into */
    if (!isok(x + game.u.dx, y + game.u.dy) || !((game.level.locations[x + game.u.dx][y + game.u.dy].typ) >= POOL) || closed_door(x + game.u.dx, y + game.u.dy)) {
        range = 1;
    }
    /* 5.0: this used to skip 'costly' handling if kickedobj->no_charge
       was set but that optimization could result in no_charge staying set
       for objects kicked out of the shop */
    shkp = find_objowner(game.kickedobj, x, y);
    costly = (shkp && (costly_spot(x, y) || (costly_adjacent(shkp, x, y) && game.kickedobj.unpaid)));
    /* 5.0: give feedback about the item being kicked; some follow-on
       messages refer to "it" */
    Norep("You kick %s.", !isgold ? singular(game.kickedobj, doname) : doname(game.kickedobj));
    if (((game.level.locations[x][y].typ) < POOL) || closed_door(x, y)) {
        if ((!(((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)) && rn2(20) > (acurr(A_DEX))) || ((game.level.locations[game.u.ux][game.u.uy].typ) < POOL) || closed_door(game.u.ux, game.u.uy)) {
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("It doesn't come loose.");
            } else {
                pline("%s %sn't come loose.", The(distant_name(game.kickedobj, xname)), otense(game.kickedobj, "do"));
            }
            return (!rn2(3) || (((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)));
        }
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("It comes loose.");
        } else {
            pline("%s %s loose.", The(distant_name(game.kickedobj, xname)), otense(game.kickedobj, "come"));
        }
        /* now that 'costly' above includes no_charge items, this would
         * clear their no_charge state (while declining to add to bill)
         * and then costly handling below would end up charging for them
         *
         * [fixme?  if there is anything which won't break when kicked
         * but will be used up with hitting a monster, suppressing this
         * results in the used-up item not being charged for]
         */
        /* && !gk.kickedobj->no_charge) */
        obj_extract_self(game.kickedobj);
        newsym(x, y);
        if (costly && (!costly_spot(game.u.ux, game.u.uy) || !strchr(game.u.urooms, in_rooms(x, y, SHOPBASE)))) {
            if (!game.kickedobj.no_charge) {
                addtobill(game.kickedobj, (0), (0), (0));
            /* don't leave no_charge set when outside shop */
            } else {
                game.kickedobj.no_charge = 0;
            }
        }
        if (!flooreffects(game.kickedobj, game.u.ux, game.u.uy, "fall")) {
            place_object(game.kickedobj, game.u.ux, game.u.uy);
            impact_disturbs_zombies(game.kickedobj, (1));
            stackobj(game.kickedobj);
            newsym(game.u.ux, game.u.uy);
        }
        return 1;
    }
    if (((game.kickedobj).otyp == LARGE_BOX || (game.kickedobj).otyp == CHEST)) {
        /* a box gets a chance of breaking open here */
        let otrp = game.kickedobj.otrapped;
        if (range < 2) {
            pline("THUD!");
        }
        container_impact_dmg(game.kickedobj, x, y);
        if (game.kickedobj.olocked) {
            if (!rn2(5) || ((((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)) && !rn2(2))) {
                You("break open the lock!");
                breakchestlock(game.kickedobj, (0));
                if (otrp) {
                    chest_trap(game.kickedobj, LEG, (0));
                }
                return 1;
            }
        } else {
            if (!rn2(3) || ((((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)) && !rn2(2))) {
                pline_The("lid slams open, then falls shut.");
                game.kickedobj.lknown = 1;
                if (otrp) {
                    chest_trap(game.kickedobj, LEG, (0));
                }
                return 1;
            }
        }
        /* else let it fall through to the next cases... */
        if (range < 2) {
            return 1;
        }
    }
    /* fragile objects should not be kicked */
    if (hero_breaks(game.kickedobj, game.kickedobj.ox, game.kickedobj.oy, 0)) {
        return 1;
    }
    if (range < 2) {
        /* too heavy to move.  range is calculated as potential distance from
     * player, so range == 2 means the object may move up to one square
     * from its current position
     */
        if (!((game.kickedobj).otyp == LARGE_BOX || (game.kickedobj).otyp == CHEST)) {
            pline("Thump!");
        }
        return (!rn2(3) || (((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)));
    }
    if (game.kickedobj.quan > 1) {
        if (!isgold) {
            game.kickedobj = splitobj(game.kickedobj, 1);
        } else {
            if (rn2(20)) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    pline("%s", "Thwwpingg!");
                }
                You("%s!", __really_kick_object_flyingcoinmsg[rn2((Math.trunc(3 /* sizeof(const char *const [3]) */ / 1 /* sizeof(const char *const) */)))]);
                scatter(x, y, rnd(3), 1 | (2 | 4), game.kickedobj);
                newsym(x, y);
                return 1;
            }
            if (game.kickedobj.quan > 300) {
                pline("Thump!");
                return (!rn2(3) || (((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)));
            }
        }
    }
    if (slide && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        pline("Whee!  %s %s across the %s.", Doname2(game.kickedobj), otense(game.kickedobj, "slide"), surface(x, y));
    }
    obj_extract_self(game.kickedobj);
    snuff_candle(game.kickedobj);
    newsym(x, y);
    mon = bhit(game.u.dx, game.u.dy, range, KICKED_WEAPON, null, null, game.kickedobj);
    if (!game.kickedobj) {
        return 1;
    }
    if (mon) {
        if (mon.isshk && game.kickedobj.where == 4 && game.kickedobj.v.v_ocarry == mon) {
            return 1;
        }
        game.notonhead = (mon.mx != game.bhitpos.x || mon.my != game.bhitpos.y);
        if (isgold ? ghitm(mon, game.kickedobj) : thitmonst(mon, game.kickedobj)) {
            return 1;
        }
    }
    /* the object might have fallen down a hole;
       ship_object() will have taken care of shop billing */
    if (game.kickedobj.where == 5) {
        return 1;
    }
    bhitroom = in_rooms(game.bhitpos.x, game.bhitpos.y, SHOPBASE);
    if (costly && (!costly_spot(game.bhitpos.x, game.bhitpos.y) || in_rooms(x, y, SHOPBASE) != bhitroom)) {
        if (isgold) {
            costly_gold(x, y, game.kickedobj.quan, (0));
        /* if obj is marked no_charge, stolen_value() won't blame hero for
       theft but will clear that flag */
        /* kicked from inside shop to somewhere outside shop */
        } else {
            stolen_value(game.kickedobj, x, y, shkp.mpeaceful, (0));
        }
        costly = (0);
    }
    if (flooreffects(game.kickedobj, game.bhitpos.x, game.bhitpos.y, "fall")) {
        return 1;
    }
    if (costly) {
        let gtg = 0;
        /* costly + landed outside shop handled above; must be inside shop */
        if (game.kickedobj.unpaid) {
            subfrombill(game.kickedobj, shkp);
        }
        /* if billed for contained gold during kick, get a refund now */
        if (((game.kickedobj).cobj != null) && (gtg = contained_gold(game.kickedobj, (1))) > 0) {
            donate_gold(gtg, shkp, (0));
        }
    }
    place_object(game.kickedobj, game.bhitpos.x, game.bhitpos.y);
    impact_disturbs_zombies(game.kickedobj, (1));
    stackobj(game.kickedobj);
    newsym(game.kickedobj.ox, game.kickedobj.oy);
    return 1;
}
/* cause of death if kicking kills kicker */
export function kickstr(buf, kickobjnam) {
    let what = null;
    if (__nh_char_at0(kickobjnam)) {
        what = kickobjnam;
    } else if (game.maploc == game.nowhere) {
        what = "nothing";
    } else if (((game.maploc.typ) == DOOR)) {
        what = "a door";
    } else if (((game.maploc.typ) == TREE || (game.level.flags.arboreal && (game.maploc.typ) == STONE))) {
        what = "a tree";
    } else if (((game.maploc.typ) <= DBWALL)) {
        what = "a wall";
    } else if (((game.maploc.typ) < POOL)) {
        what = "a rock";
    } else if (((game.maploc.typ) == THRONE)) {
        what = "a throne";
    } else if (((game.maploc.typ) == FOUNTAIN)) {
        what = "a fountain";
    } else if (((game.maploc.typ) == GRAVE)) {
        what = "a headstone";
    } else if (((game.maploc.typ) == SINK)) {
        what = "a sink";
    } else if (((game.maploc.typ) == ALTAR)) {
        what = "an altar";
    } else if (((game.maploc.typ) == DRAWBRIDGE_UP || (game.maploc.typ) == DRAWBRIDGE_DOWN)) {
        what = "a drawbridge";
    } else if (game.maploc.typ == STAIRS) {
        what = "the stairs";
    } else if (game.maploc.typ == LADDER) {
        what = "a ladder";
    } else if (game.maploc.typ == IRONBARS) {
        what = "an iron bar";
    } else {
        what = "something weird";
    }
    return strcat(strcpy(buf, "kicking "), what);
}
export function watchman_thief_arrest(mtmp) {
    if (((mtmp.data) == game.mons[PM_WATCHMAN] || (mtmp.data) == game.mons[PM_WATCH_CAPTAIN]) && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) && mtmp.mpeaceful) {
        mon_yells(mtmp, "Halt, thief!  You're under arrest!");
        angry_guards((0));
        return (1);
    }
    return (0);
}
export function watchman_door_damage(mtmp, x, y) {
    if (((mtmp.data) == game.mons[PM_WATCHMAN] || (mtmp.data) == game.mons[PM_WATCH_CAPTAIN]) && mtmp.mpeaceful && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
        if (game.level.locations[x][y].flags & 16) {
            mon_yells(mtmp, "Halt, vandal!  You're under arrest!");
            angry_guards((0));
        } else {
            mon_yells(mtmp, "Hey, stop damaging that door!");
            game.level.locations[x][y].flags |= 16;
        }
        return (1);
    }
    return (0);
}
export function kick_dumb(x, y) {
    exercise(A_DEX, (0));
    if ((((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)) || (acurr(A_DEX)) >= 16 || rn2(3)) {
        You("kick at empty space.");
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            feel_location(x, y);
        }
    } else {
        pline("Dumb move!  You strain a muscle.");
        exercise(A_STR, (0));
        set_wounded_legs(262144, 5 + rnd(5));
    }
    if (((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) && rn2(2)) {
        hurtle(-game.u.dx, -game.u.dy, 1, (1));
    }
}
export function kick_ouch(x, y, kickobjnam) {
    let dmg = 0;
    let buf = '';
    pline("Ouch!  That hurts!");
    exercise(A_DEX, (0));
    exercise(A_STR, (0));
    if (isok(x, y)) {
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            feel_location(x, y);
        }
        if (is_drawbridge_wall(x, y) >= 0) {
            pline_The("drawbridge is unaffected.");
            /* update maploc to refer to the drawbridge */
            find_drawbridge({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } });
            game.maploc = game.level.locations[x][y];
        }
        wake_nearto(x, y, 5 * 5);
    }
    if (!rn2(3)) {
        set_wounded_legs(262144, 5 + rnd(5));
    }
    dmg = rnd((acurr(A_CON)) > 15 ? 3 : 5);
    losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), kickstr(buf, kickobjnam), 1);
    if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        hurtle(-game.u.dx, -game.u.dy, (rn2(2) + (4)), (1));
    }
}
/* kick a door */
export function kick_door(x, y, avrg_attrib) {
    let doorbuster = 0;
    if (game.maploc.flags == 2 || game.maploc.flags == 1 || game.maploc.flags == 0) {
        kick_dumb(x, y);
        return;
    }
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        /* not enough leverage to kick open doors while levitating */
        kick_ouch(x, y, "");
        return;
    }
    exercise(A_DEX, (1));
    doorbuster = (game.u.umonnum != game.u.umonster) && (((game.youmonst.data).mflags2 & 8192) != 0);
    if (doorbuster || (rnl(35) < avrg_attrib + (!(((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) || ((game.youmonst.data) == game.mons[PM_SASQUATCH]) || (game.uarmf && game.uarmf.otyp == KICKING_BOOTS)) ? 0 : (acurr(A_DEX))))) {
        /* door is known to be CLOSED or LOCKED */
        let shopdoor = in_rooms(x, y, SHOPBASE) ? (1) : (0);
        if (game.maploc.flags & 16) {
            if (game.flags.verbose) {
                You("kick the door.");
            }
            exercise(A_STR, (0));
            /* don't leave loose ends.. */
            game.maploc.flags = 0;
            b_trapped("door", FOOT);
        } else if ((acurr(A_STR)) > 18 && !rn2(5) && !shopdoor) {
            ;
            pline("As you kick the door, it shatters to pieces!");
            exercise(A_STR, (1));
            game.maploc.flags = 0;
        } else {
            ;
            pline("As you kick the door, it crashes open!");
            exercise(A_STR, (1));
            game.maploc.flags = 1;
        }
        feel_newsym(x, y);
        recalc_block_point(x, y);
        if (shopdoor) {
            add_damage(x, y, 400);
            pay_for_damage("break", (0));
        }
        if (in_town(x, y)) {
            get_iter_mons(watchman_thief_arrest);
        }
    } else {
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            feel_location(x, y);
        }
        exercise(A_STR, (1));
        /* note: this used to be unconditional "WHAMMM!!!" but that has a
           fairly strong connotation of noise that a deaf hero shouldn't
           hear; we've kept the extra 'm's and one of the extra '!'s */
        pline("%s!!", ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) || !rn2(3)) ? "Thwack" : "Whammm");
        if (in_town(x, y)) {
            get_iter_mons_xy(watchman_door_damage, x, y);
        }
    }
}
/* kick non-door terrain */
export function kick_nondoor(x, y, avrg_attrib) {
    if (game.maploc.typ == SDOOR) {
        if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && rn2(30) < avrg_attrib) {
            cvt_sdoor_to_door(game.maploc);
            ;
            pline("Crash!  %s a secret door!", ((game.maploc.flags & (8 | 16)) == 8) ? "Your kick uncovers" : "You kick open");
            exercise(A_DEX, (1));
            if (game.maploc.flags & 16) {
                /* don't "kick open" when it's locked
                     unless it also happens to be trapped */
                game.maploc.flags = 0;
                b_trapped("door", FOOT);
            } else if (game.maploc.flags != 0 && !(game.maploc.flags & 8)) {
                game.maploc.flags = 2;
            }
            feel_newsym(x, y);
            if (game.maploc.flags == 2 || game.maploc.flags == 0) {
                unblock_point(x, y);
            }
            return 1;
        } else {
            kick_ouch(x, y, "");
            return 1;
        }
    }
    if (game.maploc.typ == SCORR) {
        if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && rn2(30) < avrg_attrib) {
            ;
            pline("Crash!  You kick open a secret passage!");
            exercise(A_DEX, (1));
            game.maploc.typ = CORR;
            feel_newsym(x, y);
            unblock_point(x, y);
            return 1;
        } else {
            kick_ouch(x, y, "");
            return 1;
        }
    }
    if (((game.maploc.typ) == THRONE)) {
        let i = 0;
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            kick_dumb(x, y);
            return 1;
        }
        if (((game.u.uluck + game.u.moreluck) < 0 || game.maploc.flags) && !rn2(3)) {
            game.maploc.flags = 0;
            game.maploc.typ = ROOM;
            mkgold(rnd(200), x, y);
            ;
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("CRASH!  You destroy it.");
            } else {
                pline("CRASH!  You destroy the throne.");
                newsym(x, y);
            }
            exercise(A_DEX, (1));
            return 1;
        } else if ((game.u.uluck + game.u.moreluck) > 0 && !rn2(3) && !game.maploc.flags) {
            mkgold((rn2(201) + (300)), x, y);
            i = (game.u.uluck + game.u.moreluck) + 1;
            if (i > 6) {
                i = 6;
            }
            while (i--) {
                mksobj_at(rnd_class(DILITHIUM_CRYSTAL, LUCKSTONE - 1), x, y, (0), (1));
            }
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                You("kick %s loose!", c_common_strings.c_something);
            } else {
                You("kick loose some ornamental coins and gems!");
                newsym(x, y);
            }
            game.maploc.flags = 1;
            return 1;
        } else if (!rn2(4)) {
            if (dunlev(game.u.uz) < dunlevs_in_dungeon(game.u.uz)) {
                fall_through((0), 0);
                return 1;
            } else {
                kick_ouch(x, y, "");
                return 1;
            }
        }
        kick_ouch(x, y, "");
        return 1;
    }
    if (((game.maploc.typ) == ALTAR)) {
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            kick_dumb(x, y);
            return 1;
        }
        You("kick %s.", (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? c_common_strings.c_something : "the altar"));
        altar_wrath(x, y);
        if (!rn2(3)) {
            kick_ouch(x, y, "");
            return 1;
        }
        exercise(A_DEX, (1));
        return 1;
    }
    if (((game.maploc.typ) == FOUNTAIN)) {
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            kick_dumb(x, y);
            return 1;
        }
        You("kick %s.", (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? c_common_strings.c_something : "the fountain"));
        if (!rn2(3)) {
            kick_ouch(x, y, "");
            return 1;
        }
        if (game.uarmf && rn2(3)) {
            if (water_damage(game.uarmf, "metal boots", (1)) == 0) {
                /* could cause short-lived fumbling here */
                Your("boots get wet.");
            }
        }
        exercise(A_DEX, (1));
        return 1;
    }
    if (((game.maploc.typ) == GRAVE)) {
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            kick_dumb(x, y);
        } else if (rn2(4)) {
            kick_ouch(x, y, "");
        } else if (!game.maploc.horizontal && !rn2(2)) {
            /* disturb the grave: summon a ghoul (once only), same as
               when engraving */
            disturb_grave(x, y);
        } else {
            /* destroy the headstone, implicitly destroying any
               not-yet-created contents (including zombie or mummy);
               any already created contents will still be buried here */
            exercise(A_WIS, (0));
            if ((game.urole.mnum == (PM_ARCHEOLOGIST)) || (game.urole.mnum == (PM_SAMURAI)) || (game.u.ualign.type == 1 && game.u.ualign.record > -10)) {
                adjalign(-sgn(game.u.ualign.type));
            }
            game.maploc.typ = ROOM;
            game.maploc.flags = 0;
            game.maploc.horizontal = 0;
            mksobj_at(ROCK, x, y, (1), (0));
            del_engr_at(x, y);
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                /* [feel this happen if Deaf?] */
                pline("Crack!  %s broke!", c_common_strings.c_Something);
            } else {
                pline_The("headstone topples over and breaks!");
                newsym(x, y);
            }
        }
        return 1;
    }
    if (game.maploc.typ == IRONBARS) {
        kick_ouch(x, y, "");
        return 1;
    }
    if (((game.maploc.typ) == TREE || (game.level.flags.arboreal && (game.maploc.typ) == STONE))) {
        let treefruit = null;
        if (rn2(3)) {
            /* nothing, fruit or trouble? 75:23.5:1.5% */
            if (!rn2(6) && !(game.mvitals[PM_KILLER_BEE].mvflags & (2 | 1))) {
                You_hear("a low buzzing.");
            }
            kick_ouch(x, y, "");
            return 1;
        }
        if (rn2(15) && !(game.maploc.flags & 1) && (treefruit = rnd_treefruit_at(x, y))) {
            let nfruit = 8 - rnl(7);
            let nfall = 0;
            let frtype = treefruit.otyp;
            treefruit.quan = nfruit;
            treefruit.owt = weight(treefruit);
            if (((treefruit).quan != 1 || ((treefruit).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD)))) {
                pline("Some %s fall from the tree!", xname(treefruit));
            } else {
                pline("%s falls from the tree!", An(xname(treefruit)));
            }
            nfall = scatter(x, y, 2, (2 | 4), treefruit);
            if (nfall != nfruit) {
                /* scatter left some in the tree, but treefruit
                 * may not refer to the correct object */
                treefruit = mksobj(frtype, (1), (0));
                treefruit.quan = nfruit - nfall;
                pline("%ld %s got caught in the branches.", nfruit - nfall, xname(treefruit));
                dealloc_obj(treefruit);
            }
            exercise(A_DEX, (1));
            /* discovered a new food source! */
            exercise(A_WIS, (1));
            newsym(x, y);
            game.maploc.flags |= 1;
            return 1;
        } else if (!(game.maploc.flags & 2)) {
            let cnt = rnl(4) + 2;
            let made = 0;
            let mm = { x: 0, y: 0 };
            mm.x = x;
            mm.y = y;
            while (cnt--) {
                if (enexto(mm, mm.x, mm.y, game.mons[PM_KILLER_BEE]) && makemon(game.mons[PM_KILLER_BEE], mm.x, mm.y, 32 | 131072)) {
                    made++;
                }
            }
            if (made) {
                pline("You've attracted the tree's former occupants!");
            } else {
                You("smell stale honey.");
            }
            game.maploc.flags |= 2;
            return 1;
        }
        kick_ouch(x, y, "");
        return 1;
    }
    if (((game.maploc.typ) == SINK)) {
        let gend = poly_gender();
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            kick_dumb(x, y);
            return 1;
        }
        if (rn2(5)) {
            ;
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                pline("Klunk!  The pipes vibrate noisily.");
            } else {
                pline("Klunk!");
            }
            exercise(A_DEX, (1));
            return 1;
        } else if (!(game.maploc.flags & 1) && !rn2(3) && !(game.mvitals[PM_BLACK_PUDDING].mvflags & (2 | 1))) {
            ;
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    You_hear("a gushing sound.");
                }
            } else {
                pline("A %s ooze gushes up from the drain!", hcolor(c_color_names.c_black));
            }
            makemon(game.mons[PM_BLACK_PUDDING], x, y, 131072);
            exercise(A_DEX, (1));
            newsym(x, y);
            game.maploc.flags |= 1;
            return 1;
        } else if (!(game.maploc.flags & 2) && !rn2(3) && !(game.mvitals[PM_AMOROUS_DEMON].mvflags & (2 | 1))) {
            pline("%s returns!", (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? c_common_strings.c_Something : "The dish washer"));
            if (makemon(game.mons[PM_AMOROUS_DEMON], x, y, 131072 | ((gend == 1 || (gend == 2 && rn2(2))) ? 32768 : 65536))) {
                newsym(x, y);
            }
            game.maploc.flags |= 2;
            exercise(A_DEX, (1));
            return 1;
        } else if (!rn2(3)) {
            sink_backs_up(x, y);
            return 1;
        }
        kick_ouch(x, y, "");
        return 1;
    }
    if (game.maploc.typ == STAIRS || game.maploc.typ == LADDER || ((game.maploc.typ) <= DBWALL)) {
        if (!((game.maploc.typ) <= DBWALL) && game.maploc.flags == 2) {
            kick_dumb(x, y);
            return 1;
        }
        kick_ouch(x, y, "");
        return 1;
    }
    kick_dumb(x, y);
    return 1;
}
/* the #kick command */
export function dokick() {
    let x = 0;
    let y = 0;
    let avrg_attrib = 0;
    let glyph = 0;
    let oldglyph = -1;
    let mtmp = null;
    let no_kick = (0);
    if ((((game.youmonst.data).mflags1 & 24576) == 24576) || (((game.youmonst.data).mflags1 & 524288) != 0)) {
        You("have no legs to kick with.");
        no_kick = (1);
    } else if (((game.youmonst.data).msize < 1)) {
        You("are too small to do any kicking.");
        no_kick = (1);
    } else if (game.u.usteed) {
        if (yn_function("Kick your steed?", ynchars, 121, (1)) == 121) {
            You("kick %s.", mon_nam(game.u.usteed));
            kick_steed();
            return 1;
        } else {
            return 0;
        }
    } else if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic)) {
        legs_in_no_shape("kicking", (0));
        no_kick = (1);
    } else if (near_capacity() > SLT_ENCUMBER) {
        Your("load is too heavy to balance yourself for a kick.");
        no_kick = (1);
    } else if (game.youmonst.data.mlet == S_LIZARD) {
        Your("legs cannot kick effectively.");
        no_kick = (1);
    } else if (game.u.uinwater && !rn2(2)) {
        Your("slow motion kick doesn't hit anything.");
        no_kick = (1);
    } else if (game.u.utrap) {
        no_kick = (1);
        switch (game.u.utraptype) {
            case TT_PIT:
                if (!(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
                    pline("There's not enough room to kick down here.");
                } else {
                    no_kick = (0);
                }
                break;
            case TT_WEB:
            case TT_BEARTRAP:
                You_cant("move your %s!", body_part(LEG));
                break;
            default:
                break;
        }
    } else if (sobj_at(BOULDER, game.u.ux, game.u.uy) && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
        pline("There's not enough room to kick in here.");
        no_kick = (1);
    }
    if (no_kick) {
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
        /* ignore direction typed before player notices kick failed */
        return 4;
    }
    if (!getdir(null)) {
        return 2;
    }
    if (!game.u.dx && !game.u.dy) {
        return 2;
    }
    x = game.u.ux + game.u.dx;
    y = game.u.uy + game.u.dy;
    game.kickedloc.x = x , game.kickedloc.y = y;
    if (game.uarmf && game.uarmf.otyp == KICKING_BOOTS) {
        avrg_attrib = 99;
    /* KMH -- Kicking boots always succeed */
    } else {
        avrg_attrib = Math.trunc(((acurrstr()) + (acurr(A_DEX)) + (acurr(A_CON))) / 3);
    }
    if (game.u.uswallow) {
        switch (rn2(3)) {
            case 0:
                You_cant("move your %s!", body_part(LEG));
                break;
            case 1:
                if ((dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null)) {
                    pline("%s burps loudly.", Monnam(game.u.ustuck));
                    break;
                }
                ;
            default:
                Your("feeble kick has no effect.");
                break;
        }
        return 1;
    } else if (game.u.utrap && game.u.utraptype == TT_PIT) {
        You("kick at the side of the pit.");
        return 1;
    }
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        let xx = 0;
        let yy = 0;
        xx = game.u.ux - game.u.dx;
        yy = game.u.uy - game.u.dy;
        if (isok(xx, yy) && !((game.level.locations[xx][yy].typ) < POOL) && !((game.level.locations[xx][yy].typ) == DOOR) && (!(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || !(game.level.objects[xx][yy] != null))) {
            /* doors can be opened while levitating, so they must be
         * reachable for bracing purposes
         * Possible extension: allow bracing against stuff on the side?
         */
            You("have nothing to brace yourself against.");
            return 0;
        }
    }
    mtmp = isok(x, y) ? (game.level.monsters[x][y]) : null;
    if (mtmp) {
        /* might not kick monster if it is hidden and becomes revealed,
       if it is peaceful and player declines to attack, or if the
       hero passes out due to encumbrance with low hp; svc.context.move
       will be 1 unless player declines to kick peaceful monster */
        oldglyph = glyph_at(x, y);
        if (!maybe_kick_monster(mtmp, x, y)) {
            return (game.context.move ? 1 : 0);
        }
    }
    wake_nearby((0));
    u_wipe_engr(2);
    if (!isok(x, y)) {
        game.maploc = game.nowhere;
        kick_ouch(x, y, "");
        return 1;
    }
    game.maploc = game.level.locations[x][y];
    if (mtmp) {
        /*
     * The next five tests should stay in their present order:
     * monsters, pools, objects, non-doors, doors.
     *
     * [FIXME:  Monsters who are hidden underneath objects or
     * in pools should lead to hero kicking the concealment
     * rather than the monster, probably exposing the hidden
     * monster in the process.  And monsters who are hidden on
     * ceiling shouldn't be kickable (unless hero is flying?);
     * kicking toward them should just target whatever is on
     * the floor at that spot.]
     */
        /* save mtmp->data (for recoil) in case mtmp gets killed */
        let mdat = mtmp.data;
        kick_monster(mtmp, x, y);
        glyph = glyph_at(x, y);
        if (((mtmp).mhp < 1)) {
            /* see comment in attack_checks() */
            /* if we mapped an invisible monster and immediately
               killed it, we don't want to forget what we thought
               was there before the kick */
            if (glyph != oldglyph && ((glyph) == GLYPH_INVIS_OFF)) {
                show_glyph(x, y, oldglyph);
            }
        } else if (!(canseemon(mtmp) || sensemon(mtmp)) && mtmp.mx == x && mtmp.my == y && !((glyph) == GLYPH_INVIS_OFF) && !(game.u.uswallow && (game.u.ustuck == (mtmp)))) {
            map_invisible(x, y);
        }
        if (((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) && game.context.move) {
            let range = 0;
            range = (game.youmonst.data.cwt + (weight_cap() + inv_weight()));
            if (range < 1) {
                range = 1;
            }
            /* divide by zero avoidance */
            range = Math.trunc((3 * mdat.cwt) / range);
            if (range < 1) {
                range = 1;
            }
            hurtle(-game.u.dx, -game.u.dy, range, (1));
        }
        return 1;
    }
    unmap_invisible(x, y);
    if ((is_pool(x, y) || game.maploc.typ == LAVAWALL) ^ !!game.u.uinwater) {
        /* objects normally can't be removed from water by kicking */
        You("splash some %s around.", hliquid(is_pool(x, y) ? "water" : "lava"));
        return 1;
    }
    if ((game.level.objects[x][y] != null) && (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || sobj_at(BOULDER, x, y))) {
        let kickobjnam = '';
        if (kick_object(x, y, kickobjnam)) {
            if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
                hurtle(-game.u.dx, -game.u.dy, 1, (1));
            }
            return 1;
        }
        kick_ouch(x, y, kickobjnam);
        return 1;
    }
    if (((game.maploc.typ) == DOOR)) {
        kick_door(x, y, avrg_attrib);
    } else {
        return kick_nondoor(x, y, avrg_attrib);
    }
    return 1;
}
export function drop_to(cc, loc, x, y) {
    let stway = stairway_at(x, y);
    switch (loc) {
        case 0:
            if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
                /* cover all the MIGR_xxx choices generated by down_gate() */
                cc.x = (game.dungeon_topology.d_valley_level).dnum;
                cc.y = (game.dungeon_topology.d_valley_level).dlevel;
                break;
            } else if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) || Is_botlevel(game.u.uz)) {
                cc.y = cc.x = 0;
                break;
            }
            ;
        case 3:
        case 5:
        case 7:
            if (stway) {
                cc.x = stway.tolev.dnum;
                cc.y = stway.tolev.dlevel;
            } else {
                cc.x = game.u.uz.dnum;
                cc.y = game.u.uz.dlevel + 1;
            }
            break;
        default:
        case (-1):
            cc.y = cc.x = 0;
            break;
    }
}
/* player or missile impacts location, causing objects to fall down */
/* caused impact, won't drop itself */
/* location affected */
/* if !0 send to dlev near player */
export function impact_drop(missile, x, y, dlev) {
    let toloc = 0;
    let obj = null;
    let obj2 = null;
    let shkp = null;
    let oct = 0;
    let dct = 0;
    let price = 0;
    let debit = 0;
    let robbed = 0;
    let angry = 0;
    let costly = 0;
    let isrock = 0;
    let cc = { x: 0, y: 0 };
    if (!(game.level.objects[x][y] != null)) {
        return;
    }
    toloc = down_gate(x, y);
    drop_to(cc, toloc, x, y);
    if (!cc.y) {
        return;
    }
    if (dlev) {
        /* send objects next to player falling through trap door.
         * checked in obj_delivery().
         */
        toloc = 9;
        cc.y = dlev;
    }
    costly = costly_spot(x, y);
    price = debit = robbed = 0;
    angry = (0);
    shkp = null;
    if (costly) {
        if ((shkp = shop_keeper(in_rooms(x, y, SHOPBASE))) != null) {
            /* if 'costly', we must keep a record of ESHK(shkp) before
     * it undergoes changes through the calls to stolen_value.
     * the angry bit must be reset, if needed, in this fn, since
     * stolen_value is called under the 'silent' flag to avoid
     * unsavory pline repetitions.
     */
            debit = ((shkp).mextra.eshk).debit;
            robbed = ((shkp).mextra.eshk).robbed;
            angry = !shkp.mpeaceful;
        }
    }
    isrock = (missile && missile.otyp == ROCK);
    oct = dct = 0;
    for (obj = game.level.objects[x][y]; obj; obj = obj2) {
        obj2 = obj.v.v_nexthere;
        if (obj == missile) {
            continue;
        }
        /* number of objects in the pile */
        oct += obj.quan;
        if (obj == game.uball || obj == game.uchain) {
            continue;
        }
        /* boulders can fall too, but rarely & never due to rocks */
        if ((isrock && obj.otyp == BOULDER) || rn2(obj.otyp == BOULDER ? 30 : 3)) {
            continue;
        }
        obj_extract_self(obj);
        if (costly) {
            price += stolen_value(obj, x, y, (costly_spot(game.u.ux, game.u.uy) && strchr(game.u.urooms, in_rooms(x, y, SHOPBASE))), (1));
            if (((obj).cobj != null)) {
                picked_container(obj);
            }
            if (obj.oclass != COIN_CLASS) {
                obj.no_charge = 0;
            }
        }
        add_to_migration(obj);
        obj.ox = cc.x;
        obj.oy = cc.y;
        obj.owornmask = toloc;
        /* number of fallen objects */
        dct += obj.quan;
    }
    if (dct && ((game.viz_array[y][x] & 2) != 0)) {
        /* at least one object fell */
        let what = (dct == 1 ? "object falls" : "objects fall");
        if (missile) {
            pline("From the impact, %sother %s.", dct == oct ? "the " : dct == 1 ? "an" : "", what);
        } else if (oct == dct) {
            pline("%s adjacent %s %s.", dct == 1 ? "The" : "All the", what, game.gate_str);
        } else {
            pline("%s adjacent %s %s.", dct == 1 ? "One of the" : "Some of the", dct == 1 ? "objects falls" : what, game.gate_str);
        }
    }
    if (costly && shkp && price) {
        if (((shkp).mextra.eshk).robbed > robbed) {
            You("removed %ld %s worth of goods!", price, currency(price));
            if (((game.viz_array[shkp.my][shkp.mx] & 2) != 0)) {
                if (((shkp).mextra.eshk).customer[0] == 0) {
                    ((shkp).mextra.eshk).customer = strncpy(((shkp).mextra.eshk).customer, game.plname, 32);
                }
                if (angry) {
                    pline("%s is infuriated!", Shknam(shkp));
                } else {
                    pline("\"%s, you are a thief!\"", game.plname);
                }
            } else {
                You_hear("a scream, \"Thief!\"");
            }
            hot_pursuit(shkp);
            angry_guards((0));
            return;
        }
        if (((shkp).mextra.eshk).debit > debit) {
            let amt = (((shkp).mextra.eshk).debit - debit);
            You("owe %s %ld %s for goods lost.", shkname(shkp), amt, currency(amt));
        }
    }
}
/* NOTE: ship_object assumes otmp was FREED from fobj or invent.
 * <x,y> is the point of drop.  otmp is _not_ an <x,y> resident:
 * otmp is either a kicked, dropped, or thrown object.
 */
export function ship_object(otmp, x, y, shop_floor_obj) {
    let toloc = 0;
    let ox = 0;
    let oy = 0;
    let cc = { x: 0, y: 0 };
    let obj = null;
    let t = null;
    let nodrop = 0;
    let unpaid = 0;
    let container = 0;
    let impact = (0);
    let chainthere = (0);
    let n = 0;
    if (!otmp) {
        /* let caller finish the drop */
        return (0);
    }
    if ((toloc = down_gate(x, y)) == (-1)) {
        return (0);
    }
    drop_to(cc, toloc, x, y);
    if (!cc.y) {
        return (0);
    }
    /* objects other than attached iron ball always fall down ladder,
       but have a chance of staying otherwise */
    nodrop = (otmp == game.uball) || (otmp == game.uchain) || (toloc != 5 && rn2(3));
    container = ((otmp).cobj != null);
    unpaid = is_unpaid(otmp);
    if ((game.level.objects[x][y] != null)) {
        for (obj = game.level.objects[x][y]; obj; obj = obj.v.v_nexthere) {
            if (obj == game.uchain) {
                chainthere = (1);
            } else if (obj != otmp) {
                n += obj.quan;
            }
        }
        if (n) {
            impact = (1);
        }
    }
    if (otmp.otyp == BOULDER && ((t = t_at(x, y)) != null) && ((t.ttyp) == HOLE || (t.ttyp) == TRAPDOOR)) {
        /* boulders never fall through trap doors, but they might knock
       other things down before plugging the hole */
        if (impact) {
            /* the objs impacted may be in a shop other than
         * the one in which the hero is located.  another
         * check for a shk is made in impact_drop.  it is, e.g.,
         * possible to kick/throw an object belonging to one
         * shop into another shop through a gap in the wall,
         * and cause objects belonging to the other shop to
         * fall down a trap door--thereby getting two shopkeepers
         * angry at the hero in one shot.
         */
            impact_drop(otmp, x, y, 0);
        }
        return (0);
    }
    if (((game.viz_array[y][x] & 2) != 0)) {
        otransit_msg(otmp, nodrop, chainthere, n);
    }
    if (nodrop) {
        if (impact) {
            impact_drop(otmp, x, y, 0);
            maybe_unhide_at(x, y);
        }
        return (0);
    }
    if (unpaid || shop_floor_obj) {
        if (unpaid) {
            stolen_value(otmp, game.u.ux, game.u.uy, (1), (0));
        } else {
            ox = otmp.ox;
            oy = otmp.oy;
            stolen_value(otmp, ox, oy, (costly_spot(game.u.ux, game.u.uy) && strchr(game.u.urooms, in_rooms(ox, oy, SHOPBASE))), (0));
        }
        /* set otmp->no_charge to 0 */
        if (container) {
            picked_container(otmp);
        }
        /* happens to do the right thing */
        if (otmp.oclass != COIN_CLASS) {
            otmp.no_charge = 0;
        }
    }
    if (otmp.owornmask) {
        remove_worn_item(otmp, (1));
    }
    if (breaktest(otmp)) {
        let result = null;
        if (game.objects[otmp.otyp].oc_material == GLASS || otmp.otyp == EXPENSIVE_CAMERA) {
            if (otmp.otyp == MIRROR) {
                change_luck(-2);
            }
            result = "crash";
        } else {
            if (otmp.otyp == EGG && otmp.spe && ((otmp.corpsenm) >= LOW_PM && (otmp.corpsenm) < NUMMONS)) {
                change_luck(-((otmp.quan) < (5) ? (otmp.quan) : (5)));
            }
            result = "splat";
        }
        if (otmp.otyp == EGG) {
            ;
        } else {
            ;
        }
        You_hear("a muffled %s.", result);
        obj_extract_self(otmp);
        obfree(otmp, null);
        return (1);
    }
    add_to_migration(otmp);
    otmp.ox = cc.x;
    otmp.oy = cc.y;
    otmp.owornmask = toloc;
    /* boulder from rolling boulder trap, no longer part of the trap */
    if (otmp.otyp == BOULDER) {
        otmp.otrapped = 0;
    }
    if (impact) {
        impact_drop(otmp, x, y, 0);
        newsym(x, y);
    }
    return (1);
}
export function obj_delivery(near_hero) {
    let otmp = null;
    let otmp2 = null;
    let nx = 0;
    let ny = 0;
    let where = 0;
    let nobreak = 0;
    let noscatter = 0;
    let stway = null;
    let fromdlev = { dnum: 0, dlevel: 0 };
    let isladder = 0;
    for (otmp = game.migrating_objs; otmp; otmp = otmp2) {
        otmp2 = otmp.nobj;
        if (otmp.ox != game.u.uz.dnum || otmp.oy != game.u.uz.dlevel) {
            continue;
        }
        where = (otmp.owornmask & 32767);
        if ((where & 4096) != 0) {
            continue;
        }
        nobreak = (where & 1024) != 0;
        noscatter = (where & 9) != 0;
        where &= ~(1024 | 2048);
        if (!near_hero ^ (where == 9)) {
            continue;
        }
        obj_extract_self(otmp);
        otmp.owornmask = 0;
        fromdlev.dnum = otmp.omigr_from_dnum;
        fromdlev.dlevel = otmp.omigr_from_dlevel;
        isladder = (0);
        switch (where) {
            case 5:
                isladder = (1);
                ;
            case 3:
            case 7:
                if ((stway = stairway_find_from(fromdlev, isladder)) != null) {
                    nx = stway.sx;
                    ny = stway.sy;
                }
                break;
            case 9:
                nx = game.u.ux , ny = game.u.uy;
                break;
            default:
            case 0:
                nx = ny = 0;
                break;
        }
        otmp.omigr_from_dnum = 0;
        otmp.omigr_from_dlevel = 0;
        if (nx > 0) {
            place_object(otmp, nx, ny);
            if (!nobreak && !((game.level.locations[nx][ny].typ) == AIR || (game.level.locations[nx][ny].typ) == CLOUD || ((game.level.locations[nx][ny].typ) >= POOL && (game.level.locations[nx][ny].typ) <= DRAWBRIDGE_UP))) {
                if (where == 9) {
                    if (breaks(otmp, nx, ny)) {
                        continue;
                    }
                } else if (breaktest(otmp)) {
                    /* assume it broke before player arrived, no messages */
                    delobj(otmp);
                    continue;
                }
            }
            stackobj(otmp);
            if (!noscatter) {
                scatter(nx, ny, rnd(2), 0, otmp);
            } else {
                newsym(nx, ny);
            }
        } else {
            /* set dummy coordinates because there's no
               current position for rloco() to update */
            otmp.ox = otmp.oy = 0;
            if (rloco(otmp) && !nobreak && breaktest(otmp)) {
                delobj(otmp);
            }
        }
    }
}
export function deliver_obj_to_mon(mtmp, cnt, deliverflags) {
    let otmp = null;
    let otmp2 = null;
    let where = 0;
    let maxobj = 1;
    let at_crime_scene = In_mines(game.u.uz);
    if ((deliverflags & 1) && cnt > 1) {
        maxobj = rnd(cnt);
    } else if (deliverflags & 4) {
        maxobj = 0;
    } else {
        maxobj = 1;
    }
    cnt = 0;
    for (otmp = game.migrating_objs; otmp; otmp = otmp2) {
        otmp2 = otmp.nobj;
        where = (otmp.owornmask & 32767);
        if ((where & 4096) == 0) {
            continue;
        }
        if (otmp.corpsenm != NON_PM && ((mtmp.data.mflags2 & (2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 8192)) == otmp.corpsenm)) {
            obj_extract_self(otmp);
            otmp.owornmask = 0;
            otmp.ox = otmp.oy = 0;
            if ((otmp.corpsenm & 128) != 0 && ((otmp).oextra && ((otmp).oextra.oname))) {
                if (!((mtmp).mextra && ((mtmp).mextra.mgivenname))) {
                    /* special treatment for orcs and their kind */
                    if (at_crime_scene || !rn2(2)) {
                        mtmp = christen_orc(mtmp, at_crime_scene ? ((otmp).oextra.oname) : null, " the Fence");
                    }
                }
                free_oname(otmp);
            }
            otmp.corpsenm = NON_PM;
            otmp.omigr_from_dnum = 0;
            otmp.omigr_from_dlevel = 0;
            add_to_minv(mtmp, otmp);
            cnt++;
            /* getting here implies DF_ALL */
            if (maxobj && cnt >= maxobj) {
                break;
            }
        }
    }
}
export function otransit_msg(otmp, nodrop, chainthere, num) {
    let optr = null;
    let obuf = '';
    let xbuf = '';
    if (otmp.otyp == CORPSE) {
        /* Tobjnam() calls xname() and would yield "The corpse";
           we want more specific "The newt corpse" or "Medusa's corpse" */
        optr = upstart(corpse_xname(otmp, null, 4));
    } else {
        optr = Tobjnam(otmp, null);
    }
    obuf = strcpy(obuf, optr);
    if (num || chainthere) {
        /* As of 3.6.2: use a separate buffer for the suffix to avoid risk of
           overrunning obuf[] (let pline() handle truncation if necessary) */
        /* means: other objects are impacted */
        if (num) {
            xbuf = sprintf(xbuf, " %s %s object%s", otense(otmp, "hit"), (num == 1) ? "another" : "other", (num > 1) ? "s" : "");
        } else {
            xbuf = sprintf(xbuf, " %s your chain", otense(otmp, "rattle"));
        }
        if (nodrop) {
            xbuf = __nh_buf_append(xbuf, sprintf('', "."));
        } else {
            xbuf = __nh_buf_append(xbuf, sprintf('', " and %s %s.", otense(otmp, "fall"), game.gate_str));
        }
        pline("%s%s", obuf, xbuf);
    } else if (!nodrop) {
        pline("%s %s %s.", obuf, otense(otmp, "fall"), game.gate_str);
    }
}
/* migration destination for objects which fall down to next level */
export function down_gate(x, y) {
    let ttmp = null;
    let stway = stairway_at(x, y);
    game.gate_str = null;
    if (on_level(game.u.uz, (game.dungeon_topology.d_qstart_level)) && !ok_to_quest()) {
        /* this matches the player restriction in goto_level() */
        return (-1);
    }
    if (stway && !stway.up && !stway.isladder) {
        game.gate_str = "down the stairs";
        return (stway.tolev.dnum == game.u.uz.dnum) ? 3 : 7;
    }
    if (stway && !stway.up && stway.isladder) {
        game.gate_str = "down the ladder";
        return 5;
    }
    if ((ttmp = t_at(x, y)) != null && ttmp.tseen && ((ttmp.ttyp) == HOLE || (ttmp.ttyp) == TRAPDOOR)) {
        /* hole will always be flagged as seen; trap drop might or might not */
        game.gate_str = (ttmp.ttyp == TRAPDOOR) ? "through the trap door" : "through the hole";
        return 0;
    }
    return (-1);
}
/*dokick.c*/
/* normalize body shape here; foot, not body_part(FOOT) */
/* y==0 means "nowhere", in which case x doesn't matter */
