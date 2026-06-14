import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	monmove.c	$NHDT-Date: 1737392015 2025/01/20 08:53:35 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.266 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Michael Allison, 2006. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_hear, You_see, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { strchr, strcpy } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { artifact_light, has_magic_key, is_art } from './artifact.js';
import { acurrstr } from './attrib.js';
import { isok } from './cmd.js';
import { db_under_typ, is_pool } from './dbridge.js';
import { c_common_strings } from './decl.js';
import { bury_an_obj, is_digging, mdig_tunnel, watch_dig } from './dig.js';
import { canseemon, newsym, sensemon, swallowed } from './display.js';
import { Adjmonnam, Amonnam, Monnam, YMonnam, mon_nam, y_monnam } from './do_name.js';
import { dogfood } from './dog.js';
import { could_reach_item, cursed_object_at, dog_move, finish_meating } from './dogmove.js';
import { In_hell, Is_special, has_ceiling, on_level, u_on_newpos } from './dungeon.js';
import { eaten_stat, is_fainted } from './eat.js';
import { sengr_at, wipe_engr_at } from './engrave.js';
import { disturb_buried_zombies, in_rooms, in_town, losehp, may_dig, money_cnt, notice_mon, switch_terrain } from './hack.js';
import { dist2, distmin, upstart } from './hacklib.js';
import { delobj, g_at, sobj_at } from './invent.js';
import { picking_lock } from './lock.js';
import { grow_up, set_malign } from './makemon.js';
import { castmu } from './mcastu.js';
import { mattackm, mdisplacem } from './mhitm.js';
import { expels, mattacku, ranged_attk_available } from './mhitu.js';
import { demon_talk } from './minion.js';
import { bill_dummy_object, splitobj } from './mkobj.js';
import { angry_guards, can_carry, can_touch_safely, curr_mon_load, healmon, hideunder, m_consume_obj, m_respond, max_mon_load, maybe_unhide_at, meatcorpse, meatmetal, meatobj, mfndpos, mnexto, mon_allowflags, mondied, mongone, monkilled, monnear, mpickstuff, newcham, unstuck, wake_msg, wake_nearto, wakeup } from './mon.js';
import { attacktype, can_track, dmgtype, locomotion, mon_knows_traps, mon_learns_traps, noattacks, pronoun_gender, resist_conflict, sticks } from './mondata.js';
import { lined_up, m_carrying, m_has_launcher_and_ammo } from './mthrowu.js';
import { find_defensive, find_misc, find_offensive, searches_for_item, use_defensive, use_misc } from './muse.js';
import { ACCFOOD, AGGRAVATE_MONSTER, ALTAR, AMULET_CLASS, ARM, ARMOR_CLASS, ARM_CLOAK, ARM_GLOVES, ARM_SHIRT, ARROW, ART_SNICKERSNEE, BAG_OF_HOLDING, BAG_OF_TRICKS, BALL_CLASS, BLINDFOLD, BOOMERANG, BOULDER, CANDY_BAR, COIN_CLASS, CONFLICT, CORPSE, CORR, CREDIT_CARD, CRYSKNIFE, DAGGER, DBWALL, DEAF, DISPLACED, DOOR, DRAWBRIDGE_UP, FEDORA, FOOD_CLASS, FORTUNE_COOKIE, GEMSTONE, GEM_CLASS, GOLD_PIECE, HALF_SPDAM, HALLUC, HALLUC_RES, HEAD, INVIS, IRONBARS, LADDER, LARGE_BOX, LEASH, LEATHER_JACKET, LEMBAS_WAFER, LOCK_PICK, LUMP_OF_ROYAL_JELLY, MAGIC_MARKER, MAGIC_WHISTLE, MANFOOD, MINERAL, MS_BRIBE, MS_CUSS, MS_LEADER, M_AP_FURNITURE, M_AP_MONSTER, M_AP_NOTHING, M_AP_OBJECT, NEED_AXE, NEED_HTH_WEAPON, NEED_PICK_AXE, NEED_PICK_OR_AXE, NEED_WEAPON, OILSKIN_SACK, PANCAKE, PIT, PM_ANGEL, PM_BABY_PURPLE_WORM, PM_CAVE_SPIDER, PM_CHICKATRICE, PM_COCKATRICE, PM_DEATH, PM_DISPLACER_BEAST, PM_ETTIN, PM_FAMINE, PM_FLOATING_EYE, PM_FOG_CLOUD, PM_GELATINOUS_CUBE, PM_GHOUL, PM_GIANT_SPIDER, PM_GREMLIN, PM_HEZROU, PM_JABBERWOCK, PM_KILLER_BEE, PM_LEPRECHAUN, PM_MAIL_DAEMON, PM_MASTER_MIND_FLAYER, PM_MIND_FLAYER, PM_MINOTAUR, PM_PESTILENCE, PM_PIRANHA, PM_PURPLE_WORM, PM_QUEEN_BEE, PM_STALKER, PM_STEAM_VORTEX, PM_TENGU, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_VROCK, PM_WATCHMAN, PM_WATCH_CAPTAIN, PM_XORN, POOL, POTION_CLASS, PROT_FROM_SHAPE_CHANGERS, P_AXE, P_LANCE, P_PICK_AXE, P_POLEARMS, RING_CLASS, ROCK, ROCK_CLASS, ROOM, SACK, SCROLL_CLASS, SCR_SCARE_MONSTER, SHOPBASE, SKELETON_KEY, SLING, SPBOOK_CLASS, SPIKED_PIT, STAIRS, STEALTH, STETHOSCOPE, STONE, STRANGE_OBJECT, S_BAT, S_DOG, S_EEL, S_EYE, S_HUMAN, S_LEPRECHAUN, S_LIGHT, S_NYMPH, S_UNICORN, S_VAMPIRE, TALLOW_CANDLE, TELEPAT, TIN_OPENER, TIN_WHISTLE, TOOL_CLASS, TOWEL, TRAPPED_DOOR, TREE, Trap_Caught_Mon, Trap_Killed_Mon, Trap_Moved_Mon, VENOM_CLASS, WAND_CLASS, WAX_CANDLE, WEAPON_CLASS, WEB, WOOD } from './nh-constants.js';
import { an, bare_artifactname, makeplural, vtense, xname, yname } from './objnam.js';
import { Norep, pline_mon, pline_xy, set_msg_xy } from './pline.js';
import { mbodypart } from './polyself.js';
import { in_your_sanctuary, inhistemple, mon_aligntyp, pri_move } from './priest.js';
import { quest_stat_check, quest_talk } from './quest.js';
import { create_gas_cloud, m_in_out_region, visible_region_at } from './region.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { add_damage, after_shk_move, costly_spot, inhishop, shk_move } from './shk.js';
import { stairway_at, stairway_find_dir } from './stairs.js';
import { findgold, mdrop_obj } from './steal.js';
import { place_monster } from './steed.js';
import { noteleport_level, rloc, tele_restrict } from './teleport.js';
import { gettrack } from './track.js';
import { count_traps, maketrap, mintrap, t_at, unconscious } from './trap.js';
import { gd_move } from './vault.js';
import { clear_path, recalc_block_point, vision_recalc } from './vision.js';
import { autoreturn_weapon, mon_wield_item, select_rwep } from './weapon.js';
import { mwelded } from './wield.js';
import { cuss, tactics } from './wizard.js';
import { see_wsegs, worm_move, worm_nomove, wormhitu } from './worm.js';
import { extract_from_minvent } from './worn.js';
import { fracture_rock } from './zap.js';

/* a11y: give a message when monster moved */
export async function msg_mon_movement(mtmp, omx, omy) {
    if (game.a11y.mon_movement && (canseemon(mtmp) || sensemon(mtmp)) && mtmp.mspotted) {
        let nix = mtmp.mx;
        let niy = mtmp.my;
        let n2u = (dist2(((nix)), ((niy)), game.u.ux, game.u.uy) <= 2);
        let close = !n2u && (dist2((nix), (niy), game.u.ux, game.u.uy) <= (8 * 8));
        let closer = !n2u && (dist2((nix), (niy), game.u.ux, game.u.uy) <= dist2((omx), (omy), game.u.ux, game.u.uy));
        await pline_xy(nix, niy, "%s %s%s.", await Monnam(mtmp), await vtense(null, locomotion(mtmp.data, "move")), n2u ? " next to you" : (close && closer) ? " closer" : (close && !closer) ? " further away" : " in the distance");
    }
}
/* monster has triggered trapped door lock or was present when it got
   triggered remotely (at door spot, door hit by zap);
   returns True if mtmp dies */
export async function mb_trapped(mtmp, canseeit) {
    if (game.flags.verbose) {
        if (canseeit && !(game.multi < 0 && (unconscious() || is_fainted()))) {
            await pline_mon(mtmp, "KABOOM!!  You see a door explode.");
        } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await You_hear("a %s explosion.", (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) > 7 * 7) ? "distant" : "nearby");
        }
    }
    await wake_nearto(mtmp.mx, mtmp.my, 7 * 7);
    mtmp.mstun = 1;
    mtmp.mhp -= rnd(15);
    if (((mtmp).mhp < 1)) {
        await mondied(mtmp);
        /* will get here if lifesaved */
        if (((mtmp).mhp < 1)) {
            /*
     * 'obj' might have been changed, but only if we've skipped coins that
     * are on the top of a pile.  However, the statue loop will clobber it.
     */
            /* can't hide under statues regardless of pile stacking order */
            /*
     * If we reach here, 'obj' is now Null but wasn't earlier so the original
     * 'obj' can be hidden beneath.
     */
            /* can hide under the object */
            return (1);
        }
    }
    mon_learns_traps(mtmp, TRAPPED_DOOR);
    /* mondied() allows is_pool() as an exception to !accessible(),
           but we'll only do that if 'mtmp' is already at a water location
           so that we don't swap a water critter onto land */
    return (0);
}
/* push coordinate x,y to mtrack, making monster remember where it was */
export function mon_track_add(mtmp, x, y) {
    fnEnter("mon_track_add", "monmove.c", 0);
    let j = 0;
    for (j = 4 - 1; j > 0; j--) {
        Object.assign(mtmp.mtrack[j], mtmp.mtrack[j - 1]);
    }
    mtmp.mtrack[0].x = x;
    mtmp.mtrack[0].y = y;
}
export function mon_track_clear(mtmp) {
    fnEnter("mon_track_clear", "monmove.c", 0);
    memset(mtmp.mtrack, 0, 4 /* sizeof(coord [4]) */);
}
/* check whether a monster is carrying a locking/unlocking tool */
/* true => credit card ok, false => not ok */
export function monhaskey(mon, for_unlocking) {
    fnEnter("monhaskey", "monmove.c", 0);
    if (for_unlocking && m_carrying(mon, CREDIT_CARD)) {
        return (1);
    }
    return m_carrying(mon, SKELETON_KEY) || m_carrying(mon, LOCK_PICK);
}
export async function mon_yells(mon, shout) {
    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        if ((canseemon(mon) || sensemon(mon))) {
            await pline_mon(mon, "%s angrily %s %s %s!", await Amonnam(mon), (((mon.data).mflags1 & 24576) == 24576) ? "shakes" : "waves", (genders[pronoun_gender(mon, 2)].his), (((mon.data).mflags1 & 24576) == 24576) ? await mbodypart(mon, HEAD) : await makeplural(await mbodypart(mon, ARM)));
        }
    } else {
        if ((canseemon(mon) || sensemon(mon))) {
            await pline_mon(mon, "%s yells:", await Amonnam(mon));
        } else {
            await You_hear("someone yell:");
        }
        ;
        await verbalize("%s", shout);
    }
}
/* can monster mtmp break boulders? */
export function m_can_break_boulder(mtmp) {
    return (((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE]) || (!mtmp.mspec_used && (mtmp.isshk || mtmp.ispriest || (mtmp.data.msound == MS_LEADER))));
}
/* monster mtmp breaks boulder at x,y */
export async function m_break_boulder(mtmp, x, y) {
    let otmp = null;
    if (m_can_break_boulder(mtmp) && ((otmp = sobj_at(BOULDER, x, y)) != null)) {
        if (!((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE])) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) < 4 * 4)) {
                if ((canseemon(mtmp) || sensemon(mtmp))) {
                    set_msg_xy(mtmp.mx, mtmp.my);
                }
                await pline("%s mutters %s.", await Monnam(mtmp), mtmp.ispriest ? "a prayer" : "an incantation");
            }
            mtmp.mspec_used += (rn2(20) + (10));
        }
        if (((game.viz_array[y][x] & 2) != 0)) {
            set_msg_xy(x, y);
            await pline_The("boulder falls apart.");
        }
        if (otmp.unpaid) {
            await bill_dummy_object(otmp);
        }
        await fracture_rock(otmp);
    }
}
export async function watch_on_duty(mtmp) {
    fnEnter("watch_on_duty", "monmove.c", 0);
    let x = 0;
    let y = 0;
    if (mtmp.mpeaceful && in_town(game.u.ux + game.u.dx, game.u.uy + game.u.dy) && mtmp.mcansee && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0)) && !rn2(3)) {
        if (picking_lock({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }) && ((game.level.locations[x][y].typ) == DOOR) && (game.level.locations[x][y].flags & 8)) {
            if (((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
                if (game.level.locations[x][y].flags & 16) {
                    await mon_yells(mtmp, "Halt, thief!  You're under arrest!");
                    await angry_guards(!!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf));
                } else {
                    await mon_yells(mtmp, "Hey, stop picking that lock!");
                    game.level.locations[x][y].flags |= 16;
                }
                await stop_occupation();
            }
        } else if (is_digging()) {
            await watch_dig(mtmp, game.context.digging.pos.x, game.context.digging.pos.y, (0));
        }
    }
}
/* move a monster; if a threat to busy hero, stop doing whatever it is */
/* True: monster is moving;
                   * False: monster was just created or has teleported
                   * so perform stop-what-you're-doing-if-close-enough-
                   * to-be-a-threat check but don't move mtmp */
export async function dochugw(mtmp, chug) {
    fnEnter("dochugw", "monmove.c", 0);
    /* 'mtmp's location before dochug() */
    let x = mtmp.mx;
    let y = mtmp.my;
    /* skip canspotmon() if occupation is Null */
    let already_saw_mon = (chug && game.occupation) ? (canseemon(mtmp) || sensemon(mtmp)) : 0;
    let rd = chug ? await dochug(mtmp) : 0;
    /*
     * A similar check is in monster_nearby() in hack.c.
     * [The two checks have a lot of differences and chances are high
     * that some of those are unintentional.]
     */
    /* check whether hero notices monster and stops current activity */
    if (game.occupation && !rd && ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || (!mtmp.mpeaceful && !noattacks(mtmp.data))) && dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= (8 + 1) * (8 + 1) && (!already_saw_mon || !((game.viz_array[y][x] & 1) != 0) || dist2((x), (y), game.u.ux, game.u.uy) > (8 + 1) * (8 + 1)) && (canseemon(mtmp) || sensemon(mtmp)) && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) && mtmp.mcanmove && !onscary(game.u.ux, game.u.uy, mtmp)) {
        await stop_occupation();
    }
    return rd;
}
export function onscary(x, y, mtmp) {
    fnEnter("onscary", "monmove.c", 0);
    let ep = null;
    /* <0,0> is used by musical scaring;
     * it doesn't care about scrolls or engravings or dungeon branch */
    let auditory_scare = (x == 0 && y == 0);
    let magical_scare = !auditory_scare;
    /* creatures who are directly resistant to any type of scaring:
     * Rodney, lawful minions, Angels, the Riders */
    if (mtmp.iswiz || (((((mtmp).data).mflags2 & 4096) != 0) && mon_aligntyp(mtmp) == 1) || mtmp.data == game.mons[PM_ANGEL] || ((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE])) {
        return (0);
    }
    /* creatures who are directly resistant to magical scaring
     * based on the mere presence of something at a location:
     * humans etc.
     * uniques have ascended their base monster instincts */
    if (magical_scare && (mtmp.data.mlet == S_HUMAN || (((mtmp.data).geno & 4096) != 0))) {
        return (0);
    }
    /* creatues who resist scaring under particular circumstances:
     * shopkeepers inside their own shop
     * priests inside their own temple */
    if ((mtmp.isshk && inhishop(mtmp)) || (mtmp.ispriest && inhistemple(mtmp))) {
        return (0);
    }
    if (auditory_scare) {
        return (1);
    }
    /* should this still be true for defiled/molochian altars? */
    if (((game.level.locations[x][y].typ) == ALTAR) && (mtmp.data.mlet == S_VAMPIRE || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER))) {
        return (1);
    }
    /* the scare monster scroll doesn't have any of the below
     * restrictions, being its own source of power */
    if (sobj_at(SCR_SCARE_MONSTER, x, y)) {
        return (1);
    }
    /*
     * Creatures who don't (or can't) fear a written Elbereth:
     * all the above plus shopkeepers (even if poly'd into non-human),
     * vault guards (also even if poly'd), blind or peaceful monsters,
     * humans and elves, and minotaurs.
     *
     * If the player isn't actually on the square OR the player's image
     * isn't displaced to the square, no protection is being granted.
     *
     * Elbereth doesn't work in Gehennom, the Elemental Planes, or the
     * Astral Plane; the influence of the Valar only reaches so far.
     */
    return ((ep = sengr_at("Elbereth", x, y, (1))) != null && (((x) == game.u.ux && (y) == game.u.uy) || ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic) && mtmp.mux == x && mtmp.muy == y) || (ep.guardobjects && (game.level.objects[x][y]))) && !(mtmp.isshk || mtmp.isgd || !mtmp.mcansee || mtmp.mpeaceful || mtmp.data == game.mons[PM_MINOTAUR] || In_hell(game.u.uz) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)));
}
/* regenerate lost hit points */
export async function mon_regen(mon, digest_meal) {
    fnEnter("mon_regen", "monmove.c", 0);
    if (game.moves % 20 == 0 || (((mon.data).mflags1 & 8388608) != 0)) {
        await healmon(mon, 1, 0);
    }
    if (mon.mspec_used) {
        mon.mspec_used--;
    }
    if (digest_meal) {
        if (mon.meating) {
            mon.meating--;
            if (mon.meating <= 0) {
                await finish_meating(mon);
            }
        }
    }
}
/*
 * Possibly awaken the given monster.  Return a 1 if the monster has been
 * jolted awake.
 */
export async function disturb(mtmp) {
    fnEnter("disturb", "monmove.c", 0);
    if (((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) && dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 100 && (!((game.u.uprops[STEALTH].intrinsic || game.u.uprops[STEALTH].extrinsic) && !game.u.uprops[STEALTH].blocked) || (mtmp.data == game.mons[PM_ETTIN] && rn2(10))) && (!(mtmp.data.mlet == S_NYMPH || mtmp.data == game.mons[PM_JABBERWOCK] || mtmp.data.mlet == S_LEPRECHAUN) || !rn2(50)) && ((game.u.uprops[AGGRAVATE_MONSTER].intrinsic || game.u.uprops[AGGRAVATE_MONSTER].extrinsic) || (mtmp.data.mlet == S_DOG || mtmp.data.mlet == S_HUMAN) || (!rn2(7) && ((mtmp).m_ap_type & 7) != M_AP_FURNITURE && ((mtmp).m_ap_type & 7) != M_AP_OBJECT))) {
        await wake_msg(mtmp, !mtmp.mpeaceful);
        mtmp.msleeping = 0;
        return 1;
    }
    return 0;
}
/* ungrab/expel held/swallowed hero */
export async function release_hero(mon) {
    fnEnter("release_hero", "monmove.c", 0);
    if (mon == game.u.ustuck) {
        if (game.u.uswallow) {
            await expels(mon, mon.data, (1));
        } else if (!sticks(game.youmonst.data)) {
            await unstuck(mon);
            await You("get released!");
        }
    }
}
export function find_pmmonst(pm) {
    let mtmp = null;
    if ((game.mvitals[pm].mvflags & 2) == 0) {
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (((mtmp).mhp < 1)) {
                continue;
            }
            if (mtmp.data == game.mons[pm]) {
                break;
            }
        }
    }
    return mtmp;
}
/* killer bee 'mon' is on a spot containing lump of royal jelly 'obj' and
   will eat it if there is no queen bee on the level; return 1: mon died,
   0: mon ate jelly and lived; -1: mon didn't eat jelly to use its move */
export async function bee_eat_jelly(mon, obj) {
    fnEnter("bee_eat_jelly", "monmove.c", 0);
    let m_delay = 0;
    let mtmp = find_pmmonst(PM_QUEEN_BEE);
    if (!mtmp) {
        /* if there's no queen on the level, eat the royal jelly and become one */
        m_delay = obj.blessed ? 3 : !obj.cursed ? 5 : 7;
        if (obj.quan > 1) {
            obj = await splitobj(obj, 1);
        }
        if (canseemon(mon)) {
            await pline_mon(mon, "%s eats %s.", await Monnam(mon), await an(await xname(obj)));
        }
        await delobj(obj);
        if (mon.m_lev < game.mons[PM_QUEEN_BEE].mlevel - 1) {
            mon.m_lev = (game.mons[PM_QUEEN_BEE].mlevel - 1);
        }
        await grow_up(mon, null);
        if (((mon).mhp < 1)) {
            return 1;
        }
        /* dead; apparently queen bees have been genocided */
        mon.mfrozen = m_delay , mon.mcanmove = 0;
        /* give the leaders a chance to speak */
        /* other frozen monsters can't do anything */
        return 0;
    }
    /* a queen is already present; ordinary bee hasn't moved yet */
    return -1;
}
/* gelatinous cube eats something from its inventory */
async function gelcube_digests(mtmp) {
    let otmp = mtmp.minvent;
    if (mtmp.meating || !mtmp.minvent) {
        return -1;
    }
    while (otmp) {
        if ((game.objects[otmp.otyp].oc_material <= WOOD) && !otmp.oartifact && !((otmp).o_id == game.context.achieveo.mines_prize_oid) && !((otmp).o_id == game.context.achieveo.soko_prize_oid)) {
            break;
        }
        otmp = otmp.nobj;
    }
    if (!otmp) {
        return -1;
    }
    mtmp.meating = await eaten_stat(mtmp.meating, otmp);
    await extract_from_minvent(mtmp, otmp, (1), (1));
    await m_consume_obj(mtmp, otmp);
    return 0;
}
/* FIXME: gremlins don't flee from monsters wielding Sunsword or wearing
   gold dragon scales/mail, nor from gold dragons, only from the hero */
/* not applicable if mon can't see or hero isn't in line of sight */
/* doesn't matter if hero is invisible--light being emitted isn't */
/* monster begins fleeing for the specified time, 0 means untimed flee
 * if first, only adds fleetime if monster isn't already fleeing
 * if fleemsg, prints a message about new flight, otherwise, caller should */
export async function monflee(mtmp, fleetime, first, fleemsg) {
    fnEnter("monflee", "monmove.c", 0);
    /* shouldn't happen; maybe warrants impossible()? */
    if (((mtmp).mhp < 1)) {
        return;
    }
    if (mtmp == game.u.ustuck) {
        await release_hero(mtmp);
    }
    if (!first || !mtmp.mflee) {
        if (!fleetime) {
            mtmp.mfleetim = 0;
        } else if (!mtmp.mflee || mtmp.mfleetim) {
            /* don't lose untimed scare */
            fleetime += mtmp.mfleetim;
            /* ensure monster flees long enough to visibly stop fighting */
            if (fleetime == 1) {
                fleetime++;
            }
            mtmp.mfleetim = ((fleetime) < (127) ? (fleetime) : (127));
        }
        if (!mtmp.mflee && fleemsg && canseemon(mtmp) && ((mtmp).m_ap_type & 7) != M_AP_FURNITURE && ((mtmp).m_ap_type & 7) != M_AP_OBJECT) {
            if (!mtmp.mcanmove || !mtmp.data.mmove) {
                await pline_mon(mtmp, "%s seems to flinch.", await Adjmonnam(mtmp, "immobile"));
            } else if (((mtmp).data == game.mons[PM_GREMLIN] && ((game.uwep && game.uwep.lamplit && artifact_light(game.uwep)) || (game.uarm && game.uarm.lamplit && artifact_light(game.uarm))) && mtmp.mcansee && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0))) {
                if ((game.multi < 0 && (unconscious() || is_fainted()))) {
                    await pline_mon(mtmp, "%s is frightened.", await Monnam(mtmp));
                } else if (rn2(10) || (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    let lsrc = (game.uwep && artifact_light(game.uwep)) ? await bare_artifactname(game.uwep) : (game.uarm && artifact_light(game.uarm)) ? await yname(game.uarm) : "[its imagination?]";
                    await pline_mon(mtmp, "%s flees from the painful light of %s.", await Monnam(mtmp), lsrc);
                } else {
                    ;
                    await verbalize("Bright light!");
                }
            } else {
                await pline_mon(mtmp, "%s turns to flee.", await Monnam(mtmp));
            }
        }
        if (mtmp.data == game.mons[PM_VROCK] && !mtmp.mspec_used) {
            mtmp.mspec_used = 75 + rn2(25);
            await create_gas_cloud(mtmp.mx, mtmp.my, 5, 8);
        }
        mtmp.mflee = 1;
    }
    /* ignore recently-stepped spaces when made to flee */
    mon_track_clear(mtmp);
}
/* output */
export async function distfleeck(mtmp, inrange, nearby, scared) {
    fnEnter("distfleeck", "monmove.c", 0);
    let seescaryx = 0;
    let seescaryy = 0;
    let sawscary = (0);
    let bravegremlin = (rn2(5) == 0);
    inrange.value = (dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) <= (8 * 8));
    nearby.value = inrange.value && monnear(mtmp, mtmp.mux, mtmp.muy);
    if (!mtmp.mcansee || (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mtmp.data).mflags1 & 16777216) != 0))) {
        /* Note: if your image is displaced, the monster sees the Elbereth
     * at your displaced position, thus never attacking your displaced
     * position, but possibly attacking you by accident.  If you are
     * invisible, it sees the Elbereth at your real position, thus never
     * running into you by accident but possibly attacking the spot
     * where it guesses you are.
     */
        seescaryx = mtmp.mux;
        seescaryy = mtmp.muy;
    } else {
        seescaryx = game.u.ux;
        seescaryy = game.u.uy;
    }
    sawscary = onscary(seescaryx, seescaryy, mtmp);
    if (nearby.value && (sawscary || (((mtmp).data == game.mons[PM_GREMLIN] && ((game.uwep && game.uwep.lamplit && artifact_light(game.uwep)) || (game.uarm && game.uarm.lamplit && artifact_light(game.uarm))) && mtmp.mcansee && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) && !bravegremlin) || (!mtmp.mpeaceful && in_your_sanctuary(mtmp, 0, 0)))) {
        scared.value = 1;
        await monflee(mtmp, rnd(rn2(7) ? 10 : 100), (1), (1));
    } else {
        scared.value = 0;
    }
}
/* perform a special one-time action for a monster; returns -1 if nothing
   special happened, 0 if monster uses up its turn, 1 if monster is killed */
export function m_arrival(mon) {
    fnEnter("m_arrival", "monmove.c", 0);
    mon.mstrategy &= ~1073741824;
    return -1;
}
/* a mind flayer unleashes a mind blast  */
export async function mind_blast(mtmp) {
    fnEnter("mind_blast", "monmove.c", 0);
    let m2 = null;
    let nmon = null;
    if (canseemon(mtmp)) {
        await pline_mon(mtmp, "%s concentrates.", await Monnam(mtmp));
    }
    if (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) > 8 * 8) {
        await You("sense a faint wave of psychic energy.");
        return;
    }
    await pline("A wave of psychic energy pours over you!");
    if (mtmp.mpeaceful && (!(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) || resist_conflict(mtmp))) {
        await pline("It feels quite soothing.");
    } else if (!game.u.uinvulnerable) {
        let dmg = 0;
        let m_sen = sensemon(mtmp);
        if (m_sen || ((game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic) && rn2(2)) || !rn2(10)) {
            if (game.u.uundetected) {
                /* hiding monsters are brought out of hiding when hit by
                a psychic blast, so do the same for hiding poly'd hero */
                game.u.uundetected = 0;
                await newsym(game.u.ux, game.u.uy);
            } else if ((game.youmonst.m_ap_type & 7) != M_AP_NOTHING && (game.youmonst.m_ap_type & 7) != M_AP_MONSTER) {
                /* hero has no way to hide as monster but
                            check for that theoretical case anyway */
                game.youmonst.m_ap_type = M_AP_NOTHING;
                game.youmonst.mappearance = 0;
                await newsym(game.u.ux, game.u.uy);
            }
            await pline("It locks on to your %s!", m_sen ? "telepathy" : (game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic) ? "latent telepathy" : "mind");
            /* note: hero is never mindless */
            dmg = rnd(15);
            if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
                dmg = Math.trunc((dmg + 1) / 2);
            }
            await losehp(dmg, "psychic blast", 0);
        }
    }
    for (m2 = game.level.monlist; m2; m2 = nmon) {
        nmon = m2.nmon;
        if (((m2).mhp < 1)) {
            continue;
        }
        if (m2.mpeaceful == mtmp.mpeaceful) {
            continue;
        }
        if ((((m2.data).mflags1 & 65536) != 0)) {
            continue;
        }
        if (m2 == mtmp) {
            continue;
        }
        if ((((m2.data) == game.mons[PM_FLOATING_EYE] || (m2.data) == game.mons[PM_MIND_FLAYER] || (m2.data) == game.mons[PM_MASTER_MIND_FLAYER]) && (rn2(2) || m2.mblinded)) || !rn2(10)) {
            await wakeup(m2, (0));
            if (((game.viz_array[m2.my][m2.mx] & 2) != 0)) {
                await pline("It locks on to %s.", await mon_nam(m2));
            }
            m2.mhp -= rnd(15);
            if (((m2).mhp < 1)) {
                await monkilled(m2, "", 32);
            }
        }
    }
}
/* called every turn for each living monster on the map, and the hero;
   caller makes sure that we're not called for DEADMONSTER() */
export async function m_everyturn_effect(mtmp) {
    fnEnter("m_everyturn_effect", "monmove.c", 0);
    let is_u = (mtmp == game.youmonst) ? (1) : (0);
    let x = is_u ? game.u.ux : mtmp.mx;
    let y = is_u ? game.u.uy : mtmp.my;
    if (mtmp.data == game.mons[PM_FOG_CLOUD]) {
        /* don't leave a vapor cloud if some other gas cloud is already
           present, or when flowing under closed doors so that visibility
           changes aren't mixed with messages about doing such */
        if (!closed_door(x, y) && !visible_region_at(x, y)) {
            await create_gas_cloud(x, y, 1, 0);
        }
    }
}
/* do whatever effects monster has after moving.
   called for both monsters and polyed hero.
   for hero, called after location changes,
   to prevent spam messages for hero getting enveloped in a cloud.
   for monsters, called before location changes,
   because monsters don't have "previous location" field */
export async function m_postmove_effect(mtmp) {
    fnEnter("m_postmove_effect", "monmove.c", 0);
    let is_u = (mtmp == game.youmonst) ? (1) : (0);
    let x = is_u ? game.u.ux0 : mtmp.mx;
    let y = is_u ? game.u.uy0 : mtmp.my;
    /* Hezrous create clouds of stench. This does not cost a move. */
    if (mtmp.data == game.mons[PM_HEZROU]) {
        await create_gas_cloud(x, y, 1, 8);
    } else if (mtmp.data == game.mons[PM_STEAM_VORTEX] && !mtmp.mcan) {
        await create_gas_cloud(x, y, 1, 0);
    }
}
/* returns 1 if monster died moving, 0 otherwise */
/* The whole dochugw/m_move/distfleeck/mfndpos section is serious spaghetti
 * code. --KAA
 */
export async function dochug(mtmp) {
    fnEnter("dochug", "monmove.c", 0);
    let mdat = null;
    let status = 0;
    let inrange = 0;
    let nearby = 0;
    let scared = 0;
    let res = 0;
    let otmp = null;
    let panicattk = (0);
    /*
     * PHASE ONE: Pre-movement adjustments
     */
    mdat = mtmp.data;
    if (mtmp.mstrategy & 1073741824) {
        res = m_arrival(mtmp);
        if (res >= 0) {
            return res;
        }
    }
    /* check for waitmask status change */
    if ((mtmp.mstrategy & 536870912) && (((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0)) || mtmp.mhp < mtmp.mhpmax)) {
        mtmp.mstrategy &= ~536870912;
    }
    /* update quest status flags */
    quest_stat_check(mtmp);
    if (!mtmp.mcanmove || (mtmp.mstrategy & (268435456 | 536870912))) {
        /* there is a chance we will wake it */
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            await newsym(mtmp.mx, mtmp.my);
        }
        if (mtmp.mcanmove && (mtmp.mstrategy & 268435456) && !mtmp.msleeping && monnear(mtmp, game.u.ux, game.u.uy)) {
            await quest_talk(mtmp);
        }
        return 0;
    }
    if (mtmp.msleeping && !await disturb(mtmp)) {
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            await newsym(mtmp.mx, mtmp.my);
        }
        return 0;
    }
    await wipe_engr_at(mtmp.mx, mtmp.my, 1, (0));
    /* confused monsters get unconfused with small probability */
    if (mtmp.mconf && !rn2(50)) {
        mtmp.mconf = 0;
    }
    /* stunned monsters get un-stunned with larger probability */
    if (mtmp.mstun && !rn2(10)) {
        mtmp.mstun = 0;
    }
    if (mtmp.mflee && !rn2(40) && (((mdat).mflags1 & 33554432) != 0) && !mtmp.iswiz && !await noteleport_level(mtmp)) {
        if (await rloc(mtmp, 2)) {
            await leppie_stash(mtmp);
        }
        return 0;
    }
    await m_respond(mtmp);
    if (((mtmp).mhp < 1)) {
        return 1;
    }
    /* m_respond gaze can kill medusa */
    /* fleeing monsters might regain courage */
    if (mtmp.mflee && !mtmp.mfleetim && mtmp.mhp == mtmp.mhpmax && !rn2(25)) {
        mtmp.mflee = 0;
    }
    if (mtmp == game.u.ustuck && mtmp.mpeaceful && !mtmp.mconf && !(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic)) {
        await release_hero(mtmp);
        return 0;
    }
    /*
     * PHASE TWO: Special Movements and Actions
     */
    /* The monster decides where it thinks you are. This call to set_apparxy()
       must be done after you move and before the monster does. The
       set_apparxy() call in m_move() doesn't suffice since the variables
       inrange, etc. all depend on stuff set by set_apparxy().
     */
    set_apparxy(mtmp);
    if ((((mdat).mflags3 & 31))) {
        await tactics(mtmp);
        /* tactics -> mnexto -> deal_with_overcrowding */
        if (mtmp.mstate) {
            return 0;
        }
        /* Where does 'mtmp' think you are?  Not necessary if m_move() called
       from this file, but needed for other calls of m_move(). */
        /* set mtmp->mux, mtmp->muy */
        set_apparxy(mtmp);
    }
    await distfleeck(mtmp, { get value() { return inrange; }, set value(_v) { inrange = _v; } }, { get value() { return nearby; }, set value(_v) { nearby = _v; } }, { get value() { return scared; }, set value(_v) { scared = _v; } });
    if (await find_defensive(mtmp, (0))) {
        if (await use_defensive(mtmp) != 0) {
            return 1;
        }
    } else if (await find_misc(mtmp)) {
        if (await use_misc(mtmp) != 0) {
            return 1;
        }
    }
    if (nearby && mdat.msound == MS_BRIBE && mtmp.mpeaceful && !mtmp.mtame && !game.u.uswallow) {
        if (mtmp.mux != game.u.ux || mtmp.muy != game.u.uy) {
            await pline("%s whispers at thin air.", ((game.viz_array[mtmp.muy][mtmp.mux] & 2) != 0) ? await Monnam(mtmp) : "It");
            if ((((game.youmonst.data).mflags2 & 256) != 0)) {
                if (!await tele_restrict(mtmp)) {
                    await rloc(mtmp, 2);
                }
            } else {
                mtmp.minvis = mtmp.perminvis = 0;
                /* Why?  For the same reason in real demon talk */
                if (canseemon(mtmp)) {
                    set_msg_xy(mtmp.mx, mtmp.my);
                }
                await pline("%s gets angry!", await Amonnam(mtmp));
                mtmp.mpeaceful = 0;
                /* since no way is an image going to pay it off */
                set_malign(mtmp);
            }
        } else if (await demon_talk(mtmp)) {
            return 1;
        }
    }
    if (((mdat) == game.mons[PM_WATCHMAN] || (mdat) == game.mons[PM_WATCH_CAPTAIN])) {
        await watch_on_duty(mtmp);
    } else if (((mdat) == game.mons[PM_MIND_FLAYER] || (mdat) == game.mons[PM_MASTER_MIND_FLAYER]) && !rn2(20)) {
        await mind_blast(mtmp);
        set_apparxy(mtmp);
        await distfleeck(mtmp, { get value() { return inrange; }, set value(_v) { inrange = _v; } }, { get value() { return nearby; }, set value(_v) { nearby = _v; } }, { get value() { return scared; }, set value(_v) { scared = _v; } });
    }
    if ((!mtmp.mpeaceful || (game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic)) && inrange && dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) <= 8 && attacktype(mdat, 254)) {
        /* If monster is nearby you, and has to wield a weapon, do so.  This
     * costs the monster a move, of course.
     */
        let mw_tmp = null;
        /* The scared check is necessary.  Otherwise a monster that is
         * one square near the player but fleeing into a wall would keep
         * switching between pick-axe and weapon.  If monster is stuck
         * in a trap, prefer ranged weapon (wielding is done in thrwmu).
         * This may cost the monster an attack, but keeps the monster
         * from switching back and forth if carrying both.
         */
        mw_tmp = ((mtmp).mw);
        if (!(scared && mw_tmp && ((mw_tmp.oclass == WEAPON_CLASS || mw_tmp.oclass == TOOL_CLASS) && game.objects[mw_tmp.otyp].oc_subtyp == P_PICK_AXE)) && mtmp.weapon_check == NEED_WEAPON && !(mtmp.mtrapped && !nearby && await select_rwep(mtmp))) {
            mtmp.weapon_check = NEED_HTH_WEAPON;
            if (await mon_wield_item(mtmp) != 0) {
                return 0;
            }
        }
    }
    if (mdat == game.mons[PM_KILLER_BEE] && (otmp = sobj_at(LUMP_OF_ROYAL_JELLY, mtmp.mx, mtmp.my)) != null && (res = await bee_eat_jelly(mtmp, otmp)) >= 0) {
        return res;
    }
    if (mdat == game.mons[PM_GELATINOUS_CUBE] && (res = await gelcube_digests(mtmp)) >= 0) {
        return res;
    }
    if (!nearby || mtmp.mflee || scared || mtmp.mconf || mtmp.mstun || (mtmp.minvis && !rn2(3)) || (mdat.mlet == S_LEPRECHAUN && !findgold(game.invent) && (findgold(mtmp.minvent) || rn2(2))) || ((((mdat).mflags2 & 8388608) != 0) && !rn2(4)) || ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !mtmp.iswiz) || (!mtmp.mcansee && !rn2(4)) || mtmp.mpeaceful) {
        if (!mtmp.mspec_used && dist2(mtmp.mx, mtmp.my, game.u.ux, game.u.uy) <= 49) {
            /* could be smarter and deliberately move to royal jelly, but
           then we'd need to scan the level for queen bee in advance;
           avoid that overhead and rely on serendipity... */
            /* A monster that passes the following checks has the opportunity
       to move. Movement itself is handled by the m_move() function. */
            /* Possibly cast an undirected spell if not attacking you */
            /* note that most of the time castmu() will pick a directed
           spell and do nothing, so the monster moves normally */
            /* arbitrary distance restriction to keep monster far away
           from you from having cast dozens of sticks-to-snakes
           or similar spells by the time you reach it */
            let a = null;
            for (let __nhi_a = 0; __nhi_a < 6 && (a = mdat.mattk[__nhi_a]); __nhi_a++) {
                if (a.aatyp == 255 && (a.adtyp == 241 || a.adtyp == 240)) {
                    if ((await castmu(mtmp, a, (0), (0)) & 1)) {
                        status = 3;
                        /* found an item of interest; skip the rest of the pile */
                        /* shk follow hero outside shop */
                        break;
                    }
                }
            }
        }
        if (!status) {
            status = await m_move(mtmp, 0);
        }
        if (((mtmp).mstate != 0)) {
            return 1;
        }
        if (status != 2) {
            await distfleeck(mtmp, { get value() { return inrange; }, set value(_v) { inrange = _v; } }, { get value() { return nearby; }, set value(_v) { nearby = _v; } }, { get value() { return scared; }, set value(_v) { scared = _v; } });
        }
        switch (status) {
            /* for pets, cases 0 and 3 are equivalent */
            case 4:
                if (scared) {
                    panicattk = (1);
                }
                ;
            /* no movement, but it can still attack you */
            case 0:
            case 3:
                if (mtmp.isgd && (((mtmp).mhp < 1) || mtmp.mx == 0)) {
                    return 1;
                }
                /* During hallucination, monster appearance should
             * still change - even if it doesn't move.
             */
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    await newsym(mtmp.mx, mtmp.my);
                }
                break;
            case 1:
                if (mtmp == game.u.ustuck && !(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
                    await unstuck(mtmp);
                }
                if ((!(((mdat).mflags1 & 1) != 0) && !((mdat).mlet == S_EYE || (mdat).mlet == S_LIGHT) && (!(((mdat).mflags1 & 16) != 0) || !has_ceiling(game.u.uz)))) {
                    await disturb_buried_zombies(mtmp.mx, mtmp.my);
                }
                /* Maybe it stepped on a trap and fell asleep... */
                if (((mtmp).msleeping || !(mtmp).mcanmove)) {
                    return 0;
                }
                if (!nearby && (ranged_attk_available(mtmp) || attacktype(mdat, 254) || await find_offensive(mtmp))) {
                    break;
                }
                /* a monster that's digesting you can move at the
             * same time -dlc
             */
                if ((game.u.uswallow && (game.u.ustuck == (mtmp)))) {
                    return await mattacku(mtmp);
                }
                return 0;
            case 2:
                return 1;
        }
    }
    if (status != 3 && (!mtmp.mpeaceful || ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !resist_conflict(mtmp)))) {
        if (((inrange && !scared) || panicattk) && !noattacks(mdat) && ((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp) > 0) {
            if (await mattacku(mtmp)) {
                return 1;
            }
        }
        if (mtmp.wormno) {
            if (await wormhitu(mtmp)) {
                return 1;
            }
        }
    }
    /* special speeches for quest monsters */
    if (!((mtmp).msleeping || !(mtmp).mcanmove) && nearby) {
        await quest_talk(mtmp);
    }
    /* extra emotional attack for vile monsters */
    if (inrange && mtmp.data.msound == MS_CUSS && !mtmp.mpeaceful && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) && !mtmp.minvis && !rn2(5)) {
        await cuss(mtmp);
    }
    /* note: can't get here when monster is dead, so this always returns 0 */
    return (status == 2);
}
const practical = [WEAPON_CLASS, ARMOR_CLASS, GEM_CLASS, FOOD_CLASS, 0];
const magical = [AMULET_CLASS, POTION_CLASS, SCROLL_CLASS, WAND_CLASS, RING_CLASS, SPBOOK_CLASS, 0];
/* monster mtmp would love to take object otmp? */
export async function mon_would_take_item(mtmp, otmp) {
    let pctload = Math.trunc((curr_mon_load(mtmp) * 100) / max_mon_load(mtmp));
    if (otmp == game.uball || otmp == game.uchain) {
        return (0);
    }
    if (mtmp.mtame && otmp.cursed) {
        return (0);
    }
    /* note: will get overridden if mtmp will eat otmp */
    if (((mtmp.data).mlet == S_UNICORN && (((mtmp.data).mflags2 & 536870912) != 0)) && game.objects[otmp.otyp].oc_material != GEMSTONE) {
        return (0);
    }
    if (!(((mtmp.data).mflags1 & 65536) != 0) && !(((mtmp.data).mflags1 & 262144) != 0) && pctload < 75 && await searches_for_item(mtmp, otmp)) {
        return (1);
    }
    if ((((mtmp.data).mflags2 & 268435456) != 0) && otmp.otyp == GOLD_PIECE && pctload < 95) {
        return (1);
    }
    if ((((mtmp.data).mflags2 & 536870912) != 0) && otmp.oclass == GEM_CLASS && game.objects[otmp.otyp].oc_material != MINERAL && pctload < 85) {
        return (1);
    }
    if ((((mtmp.data).mflags2 & 1073741824) != 0 || attacktype(mtmp.data, 254)) && strchr(practical, otmp.oclass) && pctload < 75) {
        return (1);
    }
    if ((((mtmp.data).mflags2 & 2147483648) != 0) && strchr(magical, otmp.oclass) && pctload < 85) {
        return (1);
    }
    if ((((mtmp.data).mflags2 & 134217728) != 0) && otmp.otyp == BOULDER && pctload < 50 && !game.level.flags.sokoban_rules) {
        return (1);
    }
    if (mtmp.data == game.mons[PM_GELATINOUS_CUBE] && otmp.oclass != ROCK_CLASS && otmp.oclass != BALL_CLASS && !(otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]))) {
        return (1);
    }
    return (0);
}
/* monster mtmp would love to consume object otmp, without picking it up */
export async function mon_would_consume_item(mtmp, otmp) {
    let ftyp = 0;
    if (otmp.otyp == CORPSE && !((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) && (mtmp.data == game.mons[PM_PURPLE_WORM] || mtmp.data == game.mons[PM_BABY_PURPLE_WORM] || mtmp.data == game.mons[PM_GHOUL] || mtmp.data == game.mons[PM_PIRANHA])) {
        return (1);
    }
    if (mtmp.mtame && ((mtmp).mextra && ((mtmp).mextra.edog)) && (ftyp = await dogfood(mtmp, otmp)) < MANFOOD && (ftyp < ACCFOOD || ((mtmp).mextra.edog).hungrytime <= game.moves)) {
        return (1);
    }
    return (0);
}
export async function itsstuck(mtmp) {
    fnEnter("itsstuck", "monmove.c", 0);
    if (sticks(game.youmonst.data) && mtmp == game.u.ustuck && !game.u.uswallow) {
        await pline_mon(mtmp, "%s cannot escape from you!", await Monnam(mtmp));
        return (1);
    }
    return (0);
}
/*
 * should_displace()
 *
 * Displacement of another monster is a last resort and only
 * used on approach. If there are better ways to get to target,
 * those should be used instead. This function does that evaluation.
 */
export function should_displace(mtmp, data, ggx, ggy) {
    fnEnter("should_displace", "monmove.c", 0);
    let shortest_with_displacing = -1;
    let shortest_without_displacing = -1;
    let count_without_displacing = 0;
    let i = 0;
    let nx = 0;
    let ny = 0;
    let ndist = 0;
    for (i = 0; i < data.cnt; i++) {
        nx = data.poss[i].x;
        ny = data.poss[i].y;
        ndist = dist2(nx, ny, ggx, ggy);
        if ((game.level.monsters[nx][ny] != null) && (data.info[i] & 4096) && !(data.info[i] & 524288) && !undesirable_disp(mtmp, nx, ny)) {
            if (shortest_with_displacing == -1 || (ndist < shortest_with_displacing)) {
                shortest_with_displacing = ndist;
            }
        } else {
            if ((shortest_without_displacing == -1) || (ndist < shortest_without_displacing)) {
                shortest_without_displacing = ndist;
            }
            count_without_displacing++;
        }
    }
    if (shortest_with_displacing > -1 && (shortest_with_displacing < shortest_without_displacing || !count_without_displacing)) {
        return (1);
    }
    return (0);
}
/* have monster wield a pick-axe if it wants to dig and it has one;
   return True if it spends this move wielding one, False otherwise */
export async function m_digweapon_check(mtmp, nix, niy) {
    fnEnter("m_digweapon_check", "monmove.c", 0);
    let can_tunnel = (0);
    let mw_tmp = ((mtmp).mw);
    if (!(((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        can_tunnel = (((mtmp.data).mflags1 & 32) != 0);
    }
    if (can_tunnel && (((mtmp.data).mflags1 & 64) != 0) && !mwelded(mw_tmp) && (may_dig(nix, niy) || closed_door(nix, niy))) {
        if (closed_door(nix, niy)) {
            /* may_dig() is either IS_STWALL or IS_TREE */
            if (!mw_tmp || !((mw_tmp.oclass == WEAPON_CLASS || mw_tmp.oclass == TOOL_CLASS) && game.objects[mw_tmp.otyp].oc_subtyp == P_PICK_AXE) || !((mw_tmp.oclass == WEAPON_CLASS || mw_tmp.oclass == TOOL_CLASS) && game.objects[mw_tmp.otyp].oc_subtyp == P_AXE)) {
                mtmp.weapon_check = NEED_PICK_OR_AXE;
            }
        } else if (((game.level.locations[nix][niy].typ) == TREE || (game.level.flags.arboreal && (game.level.locations[nix][niy].typ) == STONE))) {
            if (!mw_tmp || !((mw_tmp.oclass == WEAPON_CLASS || mw_tmp.oclass == TOOL_CLASS) && game.objects[mw_tmp.otyp].oc_subtyp == P_AXE)) {
                mtmp.weapon_check = NEED_AXE;
            }
        } else if (((game.level.locations[nix][niy].typ) <= DBWALL)) {
            if (!mw_tmp || !((mw_tmp.oclass == WEAPON_CLASS || mw_tmp.oclass == TOOL_CLASS) && game.objects[mw_tmp.otyp].oc_subtyp == P_PICK_AXE)) {
                mtmp.weapon_check = NEED_PICK_AXE;
            }
        }
        if (mtmp.weapon_check >= NEED_PICK_AXE && await mon_wield_item(mtmp)) {
            return (1);
        }
    }
    return (0);
}
/* does leprechaun want to avoid the hero? */
export function leppie_avoidance(mtmp) {
    fnEnter("leppie_avoidance", "monmove.c", 0);
    let lepgold = null;
    let ygold = null;
    if (mtmp.data == game.mons[PM_LEPRECHAUN] && ((lepgold = findgold(mtmp.minvent)) && (lepgold.quan > ((ygold = findgold(game.invent)) ? ygold.quan : 0)))) {
        return (1);
    }
    return (0);
}
/* unseen leprechaun with gold might stash it */
export async function leppie_stash(mtmp) {
    fnEnter("leppie_stash", "monmove.c", 0);
    let gold = null;
    if (mtmp.data == game.mons[PM_LEPRECHAUN] && !((mtmp).mhp < 1) && !((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0)) && !in_rooms(mtmp.mx, mtmp.my, SHOPBASE) && game.level.locations[mtmp.mx][mtmp.my].typ == ROOM && !t_at(mtmp.mx, mtmp.my) && rn2(4) && (gold = findgold(mtmp.minvent)) != null) {
        await mdrop_obj(mtmp, gold, (0));
        gold = g_at(mtmp.mx, mtmp.my);
        if (gold) {
            await bury_an_obj(gold, null);
        }
    }
}
/* does monster want to avoid you?
 *  returns the original value of appr if not.
 *  returns -1 if so.
 *  returns -2 if monster wants to adhere to a particular range,
 *             which may actually be further away,
 *             and sets *pdistmin and *pdistmax to describe that range
 */
export function m_balks_at_approaching(oldappr, mtmp, pdistmin, pdistmax) {
    fnEnter("m_balks_at_approaching", "monmove.c", 0);
    let mwep = ((mtmp).mw);
    let x = mtmp.mx;
    let y = mtmp.my;
    let ux = mtmp.mux;
    let uy = mtmp.muy;
    let edist = dist2(x, y, ux, uy);
    let arw = null;
    if (pdistmin) {
        pdistmin.value = 0;
    }
    if (pdistmax) {
        pdistmax.value = 0;
    }
    /* peaceful, far away, or can't see you */
    if (mtmp.mpeaceful || (edist >= 5 * 5) || !((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0))) {
        return oldappr;
    }
    if (m_has_launcher_and_ammo(mtmp)) {
        return -1;
    }
    /* is using a polearm and in range */
    if (((mtmp).mw) && ((((mtmp).mw).oclass == WEAPON_CLASS || ((mtmp).mw).oclass == TOOL_CLASS) && (game.objects[((mtmp).mw).otyp].oc_subtyp == P_POLEARMS || game.objects[((mtmp).mw).otyp].oc_subtyp == P_LANCE || is_art(((mtmp).mw), ART_SNICKERSNEE))) && edist <= 5) {
        return -1;
    }
    if (mwep && (arw = autoreturn_weapon(mwep)) != null) {
        /* is using a throw-and-return weapon; provide min and max preferred range
     */
        if (pdistmin) {
            pdistmin.value = 2 * 2;
        }
        if (pdistmax) {
            pdistmax.value = arw.range;
        }
        return -2;
    }
    /* can attack from distance, and hp loss or attack not used */
    if (ranged_attk_available(mtmp) && ((mtmp.mhp < Math.trunc((mtmp.mhpmax + 1) / 3)) || !mtmp.mspec_used)) {
        return -1;
    }
    return oldappr;
}
export function holds_up_web(x, y) {
    let sway = null;
    if (!isok(x, y) || ((game.level.locations[x][y].typ) < POOL) || ((game.level.locations[x][y].typ == STAIRS || game.level.locations[x][y].typ == LADDER) && (sway = stairway_at(x, y)) != null && sway.up) || game.level.locations[x][y].typ == IRONBARS) {
        return (1);
    }
    return (0);
}
/* returns the number of walls in the four cardinal directions that could
   hold up a web */
export function count_webbing_walls(x, y) {
    return (holds_up_web(x, y - 1) + holds_up_web(x + 1, y) + holds_up_web(x, y + 1) + holds_up_web(x - 1, y));
}
/* reject webs which interfere with solving Sokoban */
export function soko_allow_web(mon) {
    let stway = null;
    /* for a non-Sokoban level or a solved Sokoban level, no restriction */
    if (!game.level.flags.sokoban_rules) {
        return (1);
    }
    /* not-yet-solved Sokoban level:  allow web only when spinner can see
       the stairs up [we really want 'is in same chamber as stairs up'] */
    stway = stairway_find_dir((1));
    if (stway && clear_path((mon).mx, (mon).my, (stway.sx), (stway.sy))) {
        return (1);
    }
    return (0);
}
/* monster might spin a web */
export async function maybe_spin_web(mtmp) {
    if (((mtmp.data) == game.mons[PM_CAVE_SPIDER] || (mtmp.data) == game.mons[PM_GIANT_SPIDER]) && !((mtmp).msleeping || !(mtmp).mcanmove) && !mtmp.mspec_used && !t_at(mtmp.mx, mtmp.my) && soko_allow_web(mtmp)) {
        let trap = null;
        let prob = ((((mtmp.data == game.mons[PM_GIANT_SPIDER]) ? 15 : 5) * (count_webbing_walls(mtmp.mx, mtmp.my) + 1)) - (3 * count_traps(WEB)));
        if (rn2(1000) < prob && (trap = await maketrap(mtmp.mx, mtmp.my, WEB)) != null) {
            mtmp.mspec_used = d(4, 4);
            if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                let mbuf = '';
                mbuf = strcpy(mbuf, (canseemon(mtmp) || sensemon(mtmp)) ? await y_monnam(mtmp) : c_common_strings.c_something);
                await pline_mon(mtmp, "%s spins a web.", upstart(mbuf));
                trap.tseen = 1;
            }
            if (in_rooms(mtmp.mx, mtmp.my, SHOPBASE)) {
                await add_damage(mtmp.mx, mtmp.my, 0);
            }
        }
    }
}
/* monster avoids a location nx, ny, if hero kicked that location */
export function m_avoid_kicked_loc(mtmp, nx, ny) {
    if ((mtmp.mpeaceful || mtmp.mtame) && mtmp.mcansee && !mtmp.mconf && !mtmp.mstun && !(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && isok(game.kickedloc.x, game.kickedloc.y) && nx == game.kickedloc.x && ny == game.kickedloc.y && (dist2(((nx)), ((ny)), game.u.ux, game.u.uy) <= 2)) {
        return (1);
    }
    return (0);
}
/* monster avoids a location nx, ny, if we're in sokoban, and
   there's a boulder between the location and hero */
export function m_avoid_soko_push_loc(mtmp, nx, ny) {
    if (game.level.flags.sokoban_rules && (mtmp.mpeaceful || mtmp.mtame) && !mtmp.mconf && !mtmp.mstun && !(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && (dist2(nx, ny, game.u.ux, game.u.uy) == 4) && sobj_at(BOULDER, nx + sgn(game.u.ux - nx), ny + sgn(game.u.uy - ny))) {
        return (1);
    }
    return (0);
}
/* max distmin() distance for monster to look for items */
/* monster looks for items it wants nearby */
export async function m_search_items(mtmp, ggx, ggy, mmoved, appr) {
    fnEnter("m_search_items", "monmove.c", 0);
    let minr = 0;
    let otmp = null;
    let xx = 0;
    let yy = 0;
    let hmx = 0;
    let hmy = 0;
    let lmx = 0;
    let lmy = 0;
    let ttmp = null;
    let omx = 0;
    let omy = 0;
    let ptr = null;
    let mtoo = null;
    let costly = 0;
    finish_search: {
        minr = 5;
        omx = mtmp.mx;
        omy = mtmp.my;
        /* in case mintrap() caused polymorph */
        /* mintrap() can change mtmp->data -dlc */
        ptr = mtmp.data;
        /* cut down the search radius if it thinks character is closer. */
        if (distmin(mtmp.mux, mtmp.muy, omx, omy) < 5 && !mtmp.mpeaceful) {
            minr--;
        }
        /* guards shouldn't get too distracted */
        if (!mtmp.mpeaceful && (((ptr).mflags2 & 512) != 0)) {
            minr = 1;
        }
        if (in_rooms(omx, omy, SHOPBASE) && (rn2(25) || mtmp.isshk)) {
            break finish_search;
        }
        /* distmin() gives a rectangular area */
        hmx = ((80 - 1) < (omx + minr) ? (80 - 1) : (omx + minr));
        hmy = ((21 - 1) < (omy + minr) ? (21 - 1) : (omy + minr));
        lmx = ((1) > (omx - minr) ? (1) : (omx - minr));
        lmy = ((0) > (omy - minr) ? (0) : (omy - minr));
        for (xx = lmx; xx <= hmx; xx++) {
            for (yy = lmy; yy <= hmy; yy++) {
                if (!(game.level.objects[xx][yy] != null)) {
                    continue;
                }
                /* found an object closer already */
                if (minr < distmin(omx, omy, xx, yy)) {
                    continue;
                }
                /* the mfndpos() test for whether to allow a move to a
               water location accepts flyers, but they can't reach
               underwater objects, so being able to move to a spot
               is insufficient for deciding whether to do so */
                if (!could_reach_item(mtmp, xx, yy)) {
                    continue;
                }
                /* hiders avoid hero's line of sight */
                if ((((ptr).mflags1 & 128) != 0) && ((game.viz_array[yy][xx] & 2) != 0)) {
                    continue;
                }
                /* don't get stuck circling around object that's
               underneath an immobile or hidden monster;
               paralysis victims excluded */
                if ((mtoo = (game.level.monsters[xx][yy])) != null && (((mtoo).msleeping || !(mtoo).mcanmove) || mtoo.mundetected || (mtoo.mappearance && !mtoo.iswiz) || !mtoo.data.mmove)) {
                    continue;
                }
                /* Don't get stuck circling an Elbereth */
                if (onscary(xx, yy, mtmp)) {
                    continue;
                }
                if ((ttmp = t_at(xx, yy)) != null && mon_knows_traps(mtmp, ttmp.ttyp)) {
                    if (ggx.value == xx && ggy.value == yy) {
                        /* ignore obj if there's a trap and monster knows it */
                        ggx.value = mtmp.mux;
                        ggy.value = mtmp.muy;
                    }
                    continue;
                }
                /* avoid getting stuck on eg. items in niches */
                if (!clear_path((mtmp).mx, (mtmp).my, (xx), (yy))) {
                    continue;
                }
                costly = await costly_spot(xx, yy);
                for (otmp = game.level.objects[xx][yy]; otmp; otmp = otmp.v.v_nexthere) {
                    /* look through the items on this location */
                    /* monsters may pick rocks up, but won't go out of their way
                   to grab them; this might hamper sling wielders, but it cuts
                   down on move overhead by filtering out most common item */
                    if (otmp.otyp == ROCK) {
                        continue;
                    }
                    /* avoid special items; once hero picks them up, they'll
                   cease being special */
                    if (((otmp).o_id == game.context.achieveo.mines_prize_oid) || ((otmp).o_id == game.context.achieveo.soko_prize_oid)) {
                        continue;
                    }
                    if (costly && !otmp.no_charge) {
                        continue;
                    }
                    if (((await mon_would_take_item(mtmp, otmp) && (await can_carry(mtmp, otmp) > 0)) || await mon_would_consume_item(mtmp, otmp)) && await can_touch_safely(mtmp, otmp)) {
                        minr = distmin(omx, omy, xx, yy);
                        ggx.value = otmp.ox;
                        ggy.value = otmp.oy;
                        if (ggx.value == omx && ggy.value == omy) {
                            mmoved.value = 3;
                            return (1);
                        }
                        break;
                    }
                }
            }
        }
    }
    if (minr < 5 && appr.value == -1) {
        if (distmin(omx, omy, mtmp.mux, mtmp.muy) <= 3) {
            ggx.value = mtmp.mux;
            ggy.value = mtmp.muy;
        } else {
            appr.value = 1;
        }
    }
    return (0);
}
export async function postmov(mtmp, ptr, omx, omy, mmoved, seenflgs, can_tunnel, can_unlock, can_open) {
    let nix = 0;
    let niy = 0;
    let etmp = 0;
    let trapret = 0;
    let canseeit = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
    let didseeit = canseeit;
    await notice_mon(mtmp);
    if (mmoved == 1) {
        nix = mtmp.mx , niy = mtmp.my;
        if (((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER) && !(((mtmp.data).mflags1 & 4) != 0) && ((game.level.locations[nix][niy].typ) == DOOR) && ((game.level.locations[nix][niy].flags & (8 | 4)) != 0) && can_fog(mtmp)) {
            if (seenflgs) {
                game.level.monsters[nix][niy] = null;
                await place_monster(mtmp, omx, omy);
                await newsym(nix, niy) , await newsym(omx, omy);
            }
            if (await vamp_shift(mtmp, game.mons[PM_FOG_CLOUD], ((seenflgs & 1) != 0) ? (1) : (0))) {
                ptr = mtmp.data;
                ((ptr));
            }
            if (seenflgs) {
                game.level.monsters[omx][omy] = null;
                await place_monster(mtmp, nix, niy);
                await newsym(omx, omy) , await newsym(nix, niy);
            }
        }
        await newsym(omx, omy);
        trapret = await mintrap(mtmp, 0);
        if (trapret == Trap_Killed_Mon || trapret == Trap_Moved_Mon) {
            if (mtmp.mx) {
                await newsym(mtmp.mx, mtmp.my);
            }
            return 2;
        } else if (((mtmp).mstate != 0)) {
            return 3;
        }
        ptr = mtmp.data;
        if (((game.level.locations[mtmp.mx][mtmp.my].typ) == DOOR) && !(((ptr).mflags1 & 8) != 0) && !can_tunnel) {
            /* open a door, or crash through it, if 'mtmp' can */
            /* doesn't need to open doors */
            let here = game.level.locations[mtmp.mx][mtmp.my];
            let btrapped = (here.flags & 16) != 0;
            if (btrapped && has_magic_key(mtmp)) {
                /* used after monster 'who' has been moved to closed door spot 'where'
       which will now be changed to door state 'what' with map update */
                /* update cached value since it might change */
                /* if mon has MKoT, disarm door trap; no message given */
                /* BUG: this lets a vampire or blob or a doorbuster
                   holding the Key disarm the trap even though it isn't
                   using that Key when squeezing under or smashing the
                   door.  Not significant enough to worry about; perhaps
                   the Key's magic is more powerful for monsters? */
                here.flags &= ~16;
                btrapped = (0);
            }
            if ((here.flags & (8 | 4)) != 0 && (((ptr).mflags1 & 4) != 0)) {
                if (game.flags.verbose && canseemon(mtmp)) {
                    await pline_mon(mtmp, "%s %s under the door.", await YMonnam(mtmp), (ptr == game.mons[PM_FOG_CLOUD] || ptr.mlet == S_LIGHT) ? "flows" : "oozes");
                }
            } else if ((here.flags & 8) != 0 && can_unlock) {
                do {
                    (here).flags = (!btrapped ? 2 : 0);
                    await newsym((mtmp).mx, (mtmp).my);
                    recalc_block_point((mtmp).mx, (mtmp).my);
                    await vision_recalc(0);
                    canseeit = didseeit || ((game.viz_array[(mtmp).my][(mtmp).mx] & 2) != 0);
                } while (0);
                if (btrapped) {
                    if (await mb_trapped(mtmp, canseeit)) {
                        return 2;
                    }
                } else {
                    ;
                    if (game.flags.verbose) {
                        if (canseeit && (canseemon(mtmp) || sensemon(mtmp))) {
                            await pline_mon(mtmp, "%s unlocks and opens a door.", await Monnam(mtmp));
                        } else if (canseeit) {
                            await You_see("a door unlock and open.");
                        } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                            await You_hear("a door unlock and open.");
                        }
                    }
                }
            } else if (here.flags == 4 && can_open) {
                do {
                    (here).flags = (!btrapped ? 2 : 0);
                    await newsym((mtmp).mx, (mtmp).my);
                    recalc_block_point((mtmp).mx, (mtmp).my);
                    await vision_recalc(0);
                    canseeit = didseeit || ((game.viz_array[(mtmp).my][(mtmp).mx] & 2) != 0);
                } while (0);
                if (btrapped) {
                    if (await mb_trapped(mtmp, canseeit)) {
                        return 2;
                    }
                } else {
                    ;
                    if (game.flags.verbose) {
                        if (canseeit && (canseemon(mtmp) || sensemon(mtmp))) {
                            await pline_mon(mtmp, "%s opens a door.", await Monnam(mtmp));
                        } else if (canseeit) {
                            await You_see("a door open.");
                        } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                            await You_hear("a door open.");
                        }
                    }
                }
            } else if ((here.flags & (8 | 4)) != 0) {
                /* mfndpos guarantees this must be a doorbuster */
                let mask = 0;
                mask = ((btrapped || ((here.flags & 8) != 0 && !rn2(2))) ? 0 : 1);
                do {
                    (here).flags = (mask);
                    await newsym((mtmp).mx, (mtmp).my);
                    recalc_block_point((mtmp).mx, (mtmp).my);
                    await vision_recalc(0);
                    canseeit = didseeit || ((game.viz_array[(mtmp).my][(mtmp).mx] & 2) != 0);
                } while (0);
                if (btrapped) {
                    if (await mb_trapped(mtmp, canseeit)) {
                        return 2;
                    }
                } else {
                    ;
                    if (game.flags.verbose) {
                        if (canseeit && (canseemon(mtmp) || sensemon(mtmp))) {
                            await pline_mon(mtmp, "%s smashes down a door.", await Monnam(mtmp));
                        } else if (canseeit) {
                            await You_see("a door crash open.");
                        } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                            await You_hear("a door crash open.");
                        }
                    }
                }
                /* if it's a shop door, schedule repair */
                if (in_rooms(mtmp.mx, mtmp.my, SHOPBASE)) {
                    await add_damage(mtmp.mx, mtmp.my, 0);
                }
            }
        } else if (game.level.locations[mtmp.mx][mtmp.my].typ == IRONBARS) {
            if (!(game.level.locations[mtmp.mx][mtmp.my].flags & 8) && (dmgtype(ptr, 24) || dmgtype(ptr, 42) || (((ptr).mflags1 & 2147483648) != 0))) {
                if (canseemon(mtmp)) {
                    await pline_mon(mtmp, "%s eats through the iron bars.", await Monnam(mtmp));
                }
                await dissolve_bars(mtmp.mx, mtmp.my);
                return 3;
            } else if (game.flags.verbose && canseemon(mtmp)) {
                await Norep("%s %s %s the iron bars.", await Monnam(mtmp), await makeplural(locomotion(ptr, "pass")), (((ptr).mflags1 & 8) != 0) ? "through" : "between");
            }
        }
        if (can_tunnel && may_dig(mtmp.mx, mtmp.my) && await mdig_tunnel(mtmp)) {
            return 2;
        }
        if ((game.u.uswallow && (game.u.ustuck == (mtmp))) && (mtmp.mx != omx || mtmp.my != omy)) {
            /* pluralization fakes verb conjugation */
            /* mon died (position already updated) */
            /* set also in domove(), hack.c */
            /* If the monster moved, then update */
            game.u.ux0 = game.u.ux;
            game.u.uy0 = game.u.uy;
            await u_on_newpos(mtmp.mx, mtmp.my);
            await swallowed(0);
        } else {
            await newsym(mtmp.mx, mtmp.my);
        }
    }
    if (mmoved == 1 || mmoved == 3) {
        if ((game.level.objects[mtmp.mx][mtmp.my] != null) && mtmp.mcanmove) {
            if ((((ptr).mflags1 & 2147483648) != 0)) {
                if (await meatmetal(mtmp) == 2) {
                    return 2;
                }
            }
            if (ptr == game.mons[PM_GELATINOUS_CUBE]) {
                if ((etmp = await meatobj(mtmp)) >= 2) {
                    return etmp;
                }
            }
            if ((ptr == game.mons[PM_PURPLE_WORM] || ptr == game.mons[PM_BABY_PURPLE_WORM] || ptr == game.mons[PM_GHOUL] || ptr == game.mons[PM_PIRANHA])) {
                if ((etmp = await meatcorpse(mtmp)) >= 2) {
                    return etmp;
                }
            }
            if (await mpickstuff(mtmp)) {
                mmoved = 3;
            }
            if (mtmp.minvis) {
                await newsym(mtmp.mx, mtmp.my);
                if (mtmp.wormno) {
                    await see_wsegs(mtmp);
                }
            }
        }
        await maybe_spin_web(mtmp);
        if ((((ptr).mflags1 & 128) != 0) || ptr.mlet == S_EEL) {
            /* Always set--or reset--mundetected if it's already hidden
               (just in case the object it was hiding under went away);
               usually set mundetected unless monster can't move. */
            if (mtmp.mundetected || (!((mtmp).msleeping || !(mtmp).mcanmove) && rn2(5))) {
                await hideunder(mtmp);
            }
            await newsym(mtmp.mx, mtmp.my);
        }
        if (mtmp.isshk) {
            await after_shk_move(mtmp);
        }
    }
    return mmoved;
}
/* Handles the movement of a standard monster.
 * Return values:
 * 0: did not move, but can still attack and do other stuff;
 * 1: moved, possibly can attack;
 * 2: monster died;
 * 3: did not move, and can't do anything else either.
 */
export async function m_move(mtmp, after) {
    fnEnter("m_move", "monmove.c", 0);
    let appr = 0;
    let ggx = 0;
    let ggy = 0;
    let nix = 0;
    let niy = 0;
    let chcnt = 0;
    let can_tunnel = 0;
    let can_open = 0;
    let can_unlock = 0;
    let getitems = 0;
    let avoid = 0;
    let better_with_displacing = 0;
    let seenflgs = 0;
    let ptr = null;
    let chi = 0;
    let mmoved = 0;
    let preferredrange_min = 0;
    let preferredrange_max = 0;
    let mfp = { cnt: 0, poss: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], info: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    let flag = 0;
    let omx = 0;
    let omy = 0;
    not_special: {
        can_tunnel = 0;
        can_open = 0;
        can_unlock = 0;
        getitems = (0);
        avoid = (0);
        better_with_displacing = (0);
        /* not strictly nec.: chi >= 0 will do */
        mmoved = 0;
        preferredrange_min = 0;
        preferredrange_max = 0;
        omx = mtmp.mx;
        omy = mtmp.my;
        if (mtmp.mtrapped) {
            let i = await mintrap(mtmp, 0);
            if (i == Trap_Killed_Mon) {
                await newsym(mtmp.mx, mtmp.my);
                return 2;
            }
            /* still in trap, so didn't move */
            if (i == Trap_Caught_Mon) {
                return 0;
            }
        }
        ptr = mtmp.data;
        if (mtmp.meating) {
            mtmp.meating--;
            if (mtmp.meating <= 0) {
                await finish_meating(mtmp);
            }
            return 3;
        }
        if ((((ptr).mflags1 & 128) != 0) && (game.level.objects[mtmp.mx][mtmp.my] != null) && can_hide_under_obj(game.level.objects[mtmp.mx][mtmp.my]) && rn2(10)) {
            return 0;
        }
        /* do not leave hiding place */
        /* set up pre-move visibility flags */
        seenflgs = (canseemon(mtmp) ? 1 : 0) | ((canseemon(mtmp) || sensemon(mtmp)) ? 2 : 0);
        set_apparxy(mtmp);
        if (!(((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
            can_tunnel = (((ptr).mflags1 & 32) != 0);
        }
        can_open = !((((ptr).mflags1 & 8192) != 0) || ((ptr).msize < 1));
        can_unlock = ((can_open && monhaskey(mtmp, (1))) || mtmp.iswiz || ((ptr) == game.mons[PM_DEATH] || (ptr) == game.mons[PM_FAMINE] || (ptr) == game.mons[PM_PESTILENCE]));
        /* doorbuster = is_giant(ptr); */
        if (mtmp.wormno) {
            break not_special;
        }
        if (mtmp.mtame) {
            return await postmov(mtmp, ptr, omx, omy, await dog_move(mtmp, after), seenflgs, can_tunnel, can_unlock, can_open);
        }
        if ((((ptr).mflags3 & 31))) {
            /* and the acquisitive monsters get special treatment */
            /* [should this include
                             *  '&& mtmp->mstrategy != STRAT_NONE'?] */
            let covetousattack = 0;
            let tx = mtmp.mgoal.x;
            let ty = mtmp.mgoal.y;
            let intruder = isok(tx, ty) ? (game.level.monsters[tx][ty]) : null;
            /* otherwise continue with normal AI routine */
            if (intruder && intruder != mtmp && dist2(mtmp.mx, mtmp.my, tx, ty) <= 2) {
                /*
         * if there's a monster on the object or in possession of it,
         * attack it.
         */
                /* 5.0: this used to use 'dist2() < 2' which meant that intended
               attack was disallowed if they were adjacent diagonally */
                game.bhitpos.x = tx , game.bhitpos.y = ty;
                game.notonhead = (intruder.mx != tx || intruder.my != ty);
                covetousattack = await mattackm(mtmp, intruder);
                /* 5.0: this used to erroneously use '== 2' (M_ATTK_DEF_DIED) */
                if (covetousattack & 4) {
                    return 2;
                }
                mmoved = 1;
                return await postmov(mtmp, ptr, omx, omy, mmoved, seenflgs, can_tunnel, can_unlock, can_open);
            }
        }
        if (mtmp.isshk || mtmp.isgd || mtmp.ispriest) {
            let xm = mtmp.isshk ? await shk_move(mtmp) : mtmp.isgd ? await gd_move(mtmp) : await pri_move(mtmp);
            switch (xm) {
                case -2:
                    return 2;
                case -1:
                    mmoved = 0;
                    break;
                default:
                    await impossible("unknown shk/gd/pri_move return value (%d)", xm);
                    ;
                case 0:
                case 1:
                    return await postmov(mtmp, ptr, omx, omy, (xm != 1) ? 0 : 1, seenflgs, can_tunnel, can_unlock, can_open);
            }
        }
        if (ptr == game.mons[PM_MAIL_DAEMON]) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && canseemon(mtmp)) {
                ;
                await verbalize("I'm late!");
            }
            await mongone(mtmp);
            return 2;
        }
        if (ptr == game.mons[PM_TENGU] && !rn2(5) && !mtmp.mcan && !await tele_restrict(mtmp)) {
            if (mtmp.mhp < 7 || mtmp.mpeaceful || rn2(2)) {
                await rloc(mtmp, 2);
            } else {
                await mnexto(mtmp, 2);
            }
            return await postmov(mtmp, ptr, omx, omy, 1, seenflgs, can_tunnel, can_unlock, can_open);
        }
    }
    if (game.u.uswallow && !mtmp.mflee && game.u.ustuck != mtmp) {
        return 1;
    }
    omx = mtmp.mx;
    omy = mtmp.my;
    ggx = mtmp.mux;
    ggy = mtmp.muy;
    appr = mtmp.mflee ? -1 : 1;
    if (mtmp.mconf || (game.u.uswallow && (game.u.ustuck == (mtmp)))) {
        appr = 0;
    } else {
        let should_see = (((game.viz_array[omy][omx] & 1) != 0) && (game.level.locations[ggx][ggy].lit || !game.level.locations[omx][omy].lit) && (dist2(omx, omy, ggx, ggy) <= 36));
        if (!mtmp.mcansee || (should_see && ((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((ptr).mflags1 & 16777216) != 0) && rn2(11)) || (((game.youmonst).m_ap_type & 7) == M_AP_OBJECT && (game.youmonst).mappearance == (STRANGE_OBJECT)) || game.u.uundetected || ((((game.youmonst).m_ap_type & 7) == M_AP_OBJECT && (game.youmonst).mappearance == (GOLD_PIECE)) && !(((ptr).mflags2 & 268435456) != 0)) || (mtmp.mpeaceful && !mtmp.isshk) || ((((ptr).pmidx) == PM_STALKER || ptr.mlet == S_BAT || ptr.mlet == S_LIGHT) && !rn2(3))) {
            appr = 0;
        }
        if (appr == 1 && leppie_avoidance(mtmp)) {
            appr = -1;
        }
        /* hostiles with ranged weapon or attack try to stay away */
        appr = m_balks_at_approaching(appr, mtmp, { get value() { return preferredrange_min; }, set value(_v) { preferredrange_min = _v; } }, { get value() { return preferredrange_max; }, set value(_v) { preferredrange_max = _v; } });
        if (!should_see && can_track(ptr)) {
            let cp = null;
            cp = gettrack(omx, omy);
            if (cp) {
                ggx = cp.x;
                ggy = cp.y;
            }
        }
    }
    if ((!mtmp.mpeaceful || !rn2(10)) && (!(((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))))) {
        let in_line = (lined_up(mtmp) && (distmin(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) <= ((((game.youmonst.data).mflags2 & 134217728) != 0) ? 20 : (Math.trunc((acurrstr()) / 2) + 1))));
        if (appr != 1 || !in_line) {
            /* Monsters in combat won't pick stuff up, avoiding the
             * situation where you toss arrows at it and it has nothing
             * better to do than pick the arrows up.
             */
            getitems = (1);
        }
    }
    if (getitems && await m_search_items(mtmp, { get value() { return ggx; }, set value(_v) { ggx = _v; } }, { get value() { return ggy; }, set value(_v) { ggy = _v; } }, { get value() { return mmoved; }, set value(_v) { mmoved = _v; } }, { get value() { return appr; }, set value(_v) { appr = _v; } })) {
        return await postmov(mtmp, ptr, omx, omy, mmoved, seenflgs, can_tunnel, can_unlock, can_open);
    }
    /* don't tunnel if hostile and close enough to prefer a weapon */
    if (can_tunnel && (((ptr).mflags1 & 64) != 0) && ((!mtmp.mpeaceful || (game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic)) && dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) <= 8)) {
        can_tunnel = (0);
    }
    nix = omx;
    niy = omy;
    flag = await mon_allowflags(mtmp);
{
        let i = 0;
        let j = 0;
        let nx = 0;
        let ny = 0;
        let nearer = 0;
        let jcnt = 0;
        let cnt = 0;
        let ndist = 0;
        let nidist = 0;
        let mtrk = null;
        cnt = await mfndpos(mtmp, mfp, flag);
        if (cnt == 0 && !((mtmp.data).mlet == S_UNICORN && (((mtmp.data).mflags2 & 536870912) != 0))) {
            if (await find_defensive(mtmp, (1)) && await use_defensive(mtmp)) {
                return 3;
            }
            return 4;
        }
        chcnt = 0;
        jcnt = ((4) < (cnt - 1) ? (4) : (cnt - 1));
        chi = -1;
        nidist = dist2(nix, niy, ggx, ggy);
        /* allow monsters be shortsighted on some levels for balance */
        if (!mtmp.mpeaceful && game.level.flags.shortsighted && nidist > (((game.viz_array[niy][nix] & 1) != 0) ? 144 : 36) && appr == 1) {
            appr = 0;
        }
        if (((ptr).mlet == S_UNICORN && (((ptr).mflags2 & 536870912) != 0)) && await noteleport_level(mtmp)) {
            /* on noteleport levels, perhaps we cannot avoid hero */
            for (i = 0; i < cnt; i++) {
                if (!(mfp.info[i] & 2097152)) {
                    avoid = (1);
                }
            }
        }
        better_with_displacing = should_displace(mtmp, mfp, ggx, ggy);
        for (i = 0; i < cnt; i++) {
            nxti: {
                if (avoid && (mfp.info[i] & 2097152)) {
                    continue;
                }
                nx = mfp.poss[i].x;
                ny = mfp.poss[i].y;
                if (m_avoid_kicked_loc(mtmp, nx, ny)) {
                    continue;
                }
                if ((game.level.monsters[nx][ny] != null) && (mfp.info[i] & 4096) && !(mfp.info[i] & 524288) && !better_with_displacing) {
                    continue;
                }
                if (appr != 0) {
                    mtrk = mtmp.mtrack[0];
                    for (j = 0; j < jcnt; j++) {
                        mtrk = mtmp.mtrack[j];
                        if (nx == mtrk.x && ny == mtrk.y) {
                            if (rn2(4 * (cnt - j))) {
                                break nxti;
                            }
                        }
                    }
                }
                nearer = ((ndist = dist2(nx, ny, ggx, ggy)) < nidist);
                if ((appr == 1 && nearer) || (appr == -1 && !nearer) || (!appr && !rn2(++chcnt)) || (appr == -2 && ((ndist <= preferredrange_min && !nearer) || (ndist >= preferredrange_max && nearer))) || (mmoved == 0)) {
                    nix = nx;
                    niy = ny;
                    nidist = ndist;
                    chi = i;
                    mmoved = 1;
                }
            }
        }
    }
    if (mmoved != 0) {
        if (mmoved == 1 && !((nix) == game.u.ux && (niy) == game.u.uy) && await itsstuck(mtmp)) {
            return 3;
        }
        if (mmoved == 1 && await m_digweapon_check(mtmp, nix, niy)) {
            return 3;
        }
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        if (mfp.info[chi] & 262144) {
            /* If ALLOW_U is set, either it's trying to attack you, or it
         * thinks it is.  In either case, attack this spot in preference to
         * all others.
         */
            /* Actually, this whole section of code doesn't work as you'd expect.
         * Most attacks are handled in dochug().  It calls distfleeck(), which
         * among other things sets nearby if the monster is near you--and if
         * nearby is set, we never call m_move unless it is a special case
         * (confused, stun, etc.)  The effect is that this ALLOW_U (and
         * mfndpos) has no effect for normal attacks, though it lets a
         * confused monster attack you by accident.
         */
            nix = mtmp.mux;
            niy = mtmp.muy;
        }
        if (((nix) == game.u.ux && (niy) == game.u.uy)) {
            /*
     * do cheapest and/or most likely tests first
     */
            /* pet knows your smell; grabber still has hold of you; monsters which
       know where you are don't suddenly forget, if you haven't moved away */
            mtmp.mux = game.u.ux;
            mtmp.muy = game.u.uy;
            return 0;
        }
        /* The monster may attack another based on 1 of 2 conditions:
         * 1 - It may be confused.
         * 2 - It may mistake the monster for your (displaced) image.
         * Pets get taken care of above and shouldn't reach this code.
         * Conflict gets handled even farther away (movemon()).
         */
        if ((mfp.info[chi] & 524288) != 0 || (nix == mtmp.mux && niy == mtmp.muy)) {
            return await m_move_aggress(mtmp, nix, niy);
        }
        if ((mfp.info[chi] & 4096) != 0) {
            let mtmp2 = null;
            let mstatus = 0;
            /* ALLOW_MDISP implies m_at() is !Null */
            mtmp2 = (game.level.monsters[nix][niy]);
            mstatus = await mdisplacem(mtmp, mtmp2, (0));
            /*[if either dies, this reports mtmp has died; is that correct?]*/
            if (mstatus & (4 | 2)) {
                return 2;
            }
            if (mstatus & 1) {
                return 1;
            }
            return 3;
        }
        if (!await m_in_out_region(mtmp, nix, niy)) {
            return 3;
        }
        if ((mfp.info[chi] & 33554432) && m_can_break_boulder(mtmp)) {
            await m_break_boulder(mtmp, nix, niy);
            return 3;
        }
        await m_postmove_effect(mtmp);
        game.level.monsters[omx][omy] = null;
        await place_monster(mtmp, nix, niy);
        await msg_mon_movement(mtmp, omx, omy);
        if (mtmp.wormno) {
            await worm_move(mtmp);
        }
        await maybe_unhide_at(mtmp.mx, mtmp.my);
        mon_track_add(mtmp, omx, omy);
    } else {
        if (((ptr).mlet == S_UNICORN && (((ptr).mflags2 & 536870912) != 0)) && rn2(2) && !await tele_restrict(mtmp)) {
            await rloc(mtmp, 2);
            return 1;
        }
        if (mtmp.wormno) {
            await worm_nomove(mtmp);
        }
    }
    return await postmov(mtmp, ptr, omx, omy, mmoved, seenflgs, can_tunnel, can_unlock, can_open);
}
/* The part of m_move that deals with a monster attacking another monster (and
 * that monster possibly retaliating).
 * Extracted into its own function so that it can be called with monsters that
 * have special move patterns (shopkeepers, priests, etc) that want to attack
 * other monsters but aren't just roaming freely around the level (so allowing
 * m_move to run fully for them could select an invalid move).
 * x and y are the coordinates mtmp wants to attack.
 * Return values are the same as for m_move, but this function only return 2
 * (mtmp died) or 3 (mtmp made its move).
 */
export async function m_move_aggress(mtmp, x, y) {
    let mtmp2 = null;
    let mstatus = 0;
    mtmp2 = (game.level.monsters[x][y]);
    if (mtmp2) {
        game.bhitpos.x = x , game.bhitpos.y = y;
        game.notonhead = (x != mtmp2.mx || y != mtmp2.my);
        mstatus = await mattackm(mtmp, mtmp2);
    }
    if ((mstatus & 4) || ((mtmp).mhp < 1)) {
        return 2;
    }
    if ((mstatus & (1 | 2)) == 1 && rn2(4) && mtmp2.movement > rn2(12)) {
        if (mtmp2.movement > 12) {
            mtmp2.movement -= 12;
        } else {
            mtmp2.movement = 0;
        }
        game.bhitpos.x = mtmp.mx , game.bhitpos.y = mtmp.my;
        game.notonhead = (0);
        mstatus = await mattackm(mtmp2, mtmp);
        /* note: at this point, defender is the original (moving) aggressor */
        if (mstatus & 2) {
            return 2;
        }
    }
    return 3;
}
/* returns TRUE if a mon can hide under the obj */
export function can_hide_under_obj(obj) {
    /* uncomment '#define NO_HIDING_UNDER_STATUES' to prevent hiding under
 * statues; that was introduced to avoid nullifying statue traps but
 * isn't needed now that hiding at any non-pit trap site is disallowed */
    /* #define NO_HIDING_UNDER_STATUES */
    let t = null;
    if (!obj || obj.where != 1) {
        return (0);
    }
    /* can't hide in/on/under traps (except pits) even when there is an
       object here; since obj is on floor, its <ox,oy> are up to date */
    if ((t = t_at(obj.ox, obj.oy)) != null && !((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT)) {
        return (0);
    }
    if (obj.oclass == COIN_CLASS) {
        /* can't hide under small amount of coins unless non-coins are also
       present; we expect coins to be a single stack but don't assume that */
        let coinquan = 0;
        do {
            /* 10 coins is arbitrary amount considered enough to hide under */
            if ((coinquan += obj.quan) >= 10) {
                break;
            }
            /* fall through to other checks */
            obj = obj.v.v_nexthere;
            /* whole pile was less than 10 coins */
            if (!obj) {
                return (0);
            }
        } while (obj.oclass == COIN_CLASS);
    }
    return (1);
}
export async function dissolve_bars(x, y) {
    game.level.locations[x][y].typ = (game.level.locations[x][y].edge == 1) ? DOOR : (Is_special(game.u.uz) || in_rooms(x, y, 0)) ? ROOM : CORR;
    game.level.locations[x][y].flags = 0;
    await newsym(x, y);
    if (((x) == game.u.ux && (y) == game.u.uy)) {
        await switch_terrain();
    }
}
export function closed_door(x, y) {
    return (((game.level.locations[x][y].typ) == DOOR) && (game.level.locations[x][y].flags & (8 | 4)));
}
export function accessible(x, y) {
    /* use underlying terrain in front of closed drawbridge */
    let levtyp = ((game.level.locations[x][y].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[x][y].flags) : game.level.locations[x][y].typ);
    return (((levtyp) >= DOOR) && !closed_door(x, y));
}
/* decide where the monster thinks you are standing */
export function set_apparxy(mtmp) {
    let notseen = 0;
    let notthere = 0;
    let gotu = 0;
    let displ = 0;
    let mx = mtmp.mux;
    let my = mtmp.muy;
    let umoney = money_cnt(game.invent);
    if (mtmp.mtame || mtmp == game.u.ustuck || ((mx) == game.u.ux && (my) == game.u.uy)) {
        mtmp.mux = game.u.ux;
        mtmp.muy = game.u.uy;
        return;
    }
    notseen = (!mtmp.mcansee || (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mtmp.data).mflags1 & 16777216) != 0)));
    notthere = ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic) && mtmp.data != game.mons[PM_DISPLACER_BEAST]);
    if ((game.u.uinwater)) {
        /* add cases as required.  eg. Displacement ... */
        displ = 1;
    } else if (notseen) {
        /* Xorns can smell quantities of valuable metal
           like that in solid gold coins, treat as seen */
        displ = (mtmp.data == game.mons[PM_XORN] && umoney) ? 0 : 1;
    } else if (notthere) {
        displ = ((game.viz_array[my][mx] & 1) != 0) ? 2 : 1;
    } else {
        displ = 0;
    }
    if (!displ) {
        mtmp.mux = game.u.ux;
        mtmp.muy = game.u.uy;
        return;
    }
    /* without something like the following, invisibility and displacement
       are too powerful */
    gotu = notseen ? !rn2(3) : notthere ? !rn2(4) : (0);
    if (!gotu) {
        let try_cnt = 0;
        do {
            if (++try_cnt > 200) {
                mx = game.u.ux;
                my = game.u.uy;
                break;
            }
            mx = game.u.ux - displ + rn2(2 * displ + 1);
            my = game.u.uy - displ + rn2(2 * displ + 1);
        } while (!isok(mx, my) || (displ != 2 && mx == mtmp.mx && my == mtmp.my) || ((mx != game.u.ux || my != game.u.uy) && !(((mtmp.data).mflags1 & 8) != 0) && !(accessible(mx, my) || (closed_door(mx, my) && (can_ooze(mtmp) || can_fog(mtmp))))) || !((game.viz_array[my][mx] & 1) != 0));
    } else {
        mx = game.u.ux;
        my = game.u.uy;
    }
    mtmp.mux = mx;
    mtmp.muy = my;
}
/*
 * mon-to-mon displacement is a deliberate "get out of my way" act,
 * not an accidental bump, so we don't consider mstun or mconf in
 * undesired_disp().
 *
 * We do consider many other things about the target and its
 * location however.
 */
/* barging creature */
/* spot 'mtmp' is considering moving to */
export function undesirable_disp(mtmp, x, y) {
    let is_pet = (mtmp.mtame && !mtmp.isminion);
    let trap = t_at(x, y);
    if (is_pet) {
        /* Pets avoid a trap if you've seen it usually. */
        if (trap && trap.tseen && rn2(40)) {
            return (1);
        }
        /* Pets avoid cursed locations */
        /* Monsters avoid a trap if they've seen that type before */
        if (cursed_object_at(x, y)) {
            return (1);
        }
    } else if (trap && rn2(40) && mon_knows_traps(mtmp, trap.ttyp)) {
        return (1);
    }
    /* oversimplification:  creatures that bargethrough can't swap places
       when target monster is in rock or closed door or water (in particular,
       avoid moving to spots where mondied() won't leave a corpse; doesn't
       matter whether barger is capable of moving to such a target spot if
       it were unoccupied) */
    if (!accessible(x, y) && !(is_pool(x, y) && is_pool(mtmp.mx, mtmp.my))) {
        return (1);
    }
    return (0);
}
/*
 * Inventory prevents passage under door.
 * Used by can_ooze() and can_fog().
 */
export function stuff_prevents_passage(mtmp) {
    let chain = null;
    let obj = null;
    if (mtmp == game.youmonst) {
        chain = game.invent;
    } else {
        chain = mtmp.minvent;
    }
    for (obj = chain; obj; obj = obj.nobj) {
        let typ = obj.otyp;
        if (typ == COIN_CLASS && obj.quan > 100) {
            return (1);
        }
        if (obj.oclass != GEM_CLASS && !(typ >= ARROW && typ <= BOOMERANG) && !(typ >= DAGGER && typ <= CRYSKNIFE) && typ != SLING && !(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_CLOAK) && typ != FEDORA && !(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_GLOVES) && typ != LEATHER_JACKET && typ != CREDIT_CARD && !(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_SHIRT) && !(typ == CORPSE && ((game.mons[obj.corpsenm]).msize < 1)) && typ != FORTUNE_COOKIE && typ != CANDY_BAR && typ != PANCAKE && typ != LEMBAS_WAFER && typ != LUMP_OF_ROYAL_JELLY && obj.oclass != AMULET_CLASS && obj.oclass != RING_CLASS && obj.oclass != VENOM_CLASS && typ != SACK && typ != BAG_OF_HOLDING && typ != BAG_OF_TRICKS && !(obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE) && typ != OILSKIN_SACK && typ != LEASH && typ != STETHOSCOPE && typ != BLINDFOLD && typ != TOWEL && typ != TIN_WHISTLE && typ != MAGIC_WHISTLE && typ != MAGIC_MARKER && typ != TIN_OPENER && typ != SKELETON_KEY && typ != LOCK_PICK) {
            return (1);
        }
        if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) && obj.cobj) {
            return (1);
        }
    }
    return (0);
}
export function can_ooze(mtmp) {
    if (!(((mtmp.data).mflags1 & 4) != 0) || stuff_prevents_passage(mtmp)) {
        return (0);
    }
    return (1);
}
/* monster can change form into a fog if necessary */
export function can_fog(mtmp) {
    if (!(game.mvitals[PM_FOG_CLOUD].mvflags & 2) && ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER) && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && !stuff_prevents_passage(mtmp)) {
        return (1);
    }
    return (0);
}
/* this is called when a vampire turns into a fog cloud in order to move
   under a closed door; if it was sensed via telepathy or seen via
   infravision, its new fog cloud shape will disappear */
export async function vamp_shift(mon, ptr, domsg) {
    let reslt = 0;
    if (mon.data == ptr) {
        reslt = 1;
    } else if (((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) {
        reslt = await newcham(mon, ptr, domsg ? 1 : 0);
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
    }
    return reslt;
}
/*monmove.c*/
/* Sidenote on "A watchman angrily waves her arms!"
             * Female being called watchman is correct (career name).
             */
/* Soundeffect(se_someone_yells, 75); */
/* boulders pushed onto shop's boundary or free spot are cases where
           an item not in hero's inventory can have its unpaid flag set;
           if the boulder isn't already on the bill, don't charge for it */
/* remove original from bill + add cloned copy to used-up bill */
/* fracturing keeps otmp, changing its otyp from BOULDER to ROCK */
/* chewing, wand/spell of digging are checked elsewhere */
/* monster is hostile and can attack (or hallu distorts knowledge) */
/* it's close enough to be a threat */
/* and either couldn't see it before, or it was too far away */
/* can see it now, or sense it and would normally see it */
/* monster isn't paralyzed or afraid (scare monster/Elbereth) */
/*
     * + Ettins are hard to surprise.
     * + Nymphs, jabberwocks, and leprechauns do not easily wake up.
     *
     * Wake up if:
     *  in direct LOS                                           AND
     *  within 10 squares                                       AND
     *  not stealthy or (mon is an ettin and 9/10)              AND
     *  (mon is not a nymph, jabberwock, or leprechaun) or 1/50 AND
     *  Aggravate or mon is (dog or human) or
     *      (1/7 and mon is not mimicking furniture or object)
     */
/* there should be delay after eating, but that's too much
           hassle; transform immediately, then have a short delay */
/* unfortunately we can't distinguish between temporary
               sleep and temporary paralysis, so both conditions
               receive the same alternate message */
/* tell the player even if the hero is unconscious */
/* via flees_light(), will always be either via uwep
                       (Sunsword) or uarm (gold dragon scales/mail) or both;
                       TODO? check for both and describe the one which is
                       emitting light with a bigger radius */
/* wake it up first, to bring hidden monster out of hiding */
/* not frozen or sleeping: wipe out texts written in the dust */
/* Some monsters teleport. Teleportation costs a turn. */
/* some monsters have special abilities */
/* Cease conflict-induced swallow/grab if conflict has ended. Releasing
       the hero in this way uses up the monster's turn. */
/* Monsters that want to acquire things may teleport, so do it before
       inrange is set. This costs a turn only if mstate is set.  */
/* check distance and scariness of attacks */
/* search for and potentially use defensive or miscellaneous items. */
/* the watch will look around and see if you are up to no good :-) */
/* mind flayers can make psychic attacks! */
/*
     * PHASE THREE: Now the actual movement phase
     */
/* A killer bee may eat honey in order to turn into a queen bee,
       costing it a move. */
/* Monsters can move and then shoot on same turn;
               our hero can't.  Is that fair? */
/* vault guard might have vanished */
/* if confused grabber has wandered off, let go */
/*
     * PHASE FOUR: Standard Attacks
     */
/* Now, attack the player if possible - one attack set per monst */
/* [is this hp check really needed?] */
/* monster died (e.g. exploded) */
/* worm died (poly'd hero passive counter-attack) */
/* has_edog(): not guardian angel */
/* sequencing issue:  when monster movement decides that a
           monster can move to a door location, it moves the monster
           there before dealing with the door rather than after;
           so a vampire/bat that is going to shift to fog cloud and
           pass under the door is already there but transformation
           into fog form--and its message, when in sight--has not
           happened yet; we have to move monster back to previous
           location before performing the vamp_shift() to make the
           message happen at right time, then back to the door again
           [if we did the shift sooner, before moving the monster,
           we would need to duplicate it in dog_move()...] */
/* note: remove_monster()+place_monster is not right for
               long worms but they won't reach here */
/* like the vampshift hack, there are sequencing
                   issues when the monster is moved to the door's spot
                   first then door handling plus feedback comes after */
/* 3.6.2: was using may_dig() but that doesn't handle bars;
               AD_RUST catches rust monsters but metallivorous() is
                   needed for xorns and rock moles */
/* Maybe a rock mole just ate some metal object */
/* Maybe a cube ate just about anything */
/* it died or got forced off the level */
/* Maybe a purple worm ate a corpse */
/* my dog gets special treatment */
/* likewise for shopkeeper, guard, or priest */
/* teleport if that lies in our nature */
/* move a normal monster; for a long worm, remove_monster() and
           place_monster() only manipulate the head; they leave tail as-is */
/* for a long worm, insert a new segment to reconnect the head
           with the tail; worm_move() keeps the end of the tail if worm
           is scheduled to grow, removes that for move-without-growing */
/* for a long worm, shrink it (by discarding end of tail) when
           it has failed to move */
/* shape-change message is given when vampshifter turns into a
           fog cloud in order to move under a closed door */
