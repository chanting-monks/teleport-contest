/* NetHack 5.0	trap.c	$NHDT-Date: 1741926700 2025/03/13 20:31:40 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.621 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2013. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, You_see, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, strcat, strchr, strcmp, strcpy, strncmp, strncmpi } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { catch_lit, check_leash, maybe_dunk_boulders, next_to_u, number_leashed, splash_lit, unleash_all } from './apply.js';
import { attacks, defends_when_carried, has_magic_key, is_art, undiscovered_artifact } from './artifact.js';
import { acurr, adjalign, adjattrib, change_luck, exercise, minuhpmax, poisoned, setuhpmax } from './attrib.js';
import { ballfall, drag_ball, move_bc, placebc, unplacebc } from './ball.js';
import { bot, rank_of } from './botl.js';
import { getdir, isok, xytodir, yn_function } from './cmd.js';
import { destroy_drawbridge, find_drawbridge, is_drawbridge_wall, is_ice, is_lava, is_pool, is_pool_or_lava, is_waterwall } from './dbridge.js';
import { c_common_strings, cg, materialnm, vowels, xdir, ydir, ynqchars } from './decl.js';
import { buried_ball, bury_an_obj, fillholetyp, liquid_flow, unearth_objs } from './dig.js';
import { canseemon, curs_on_u, feel_newsym, map_invisible, map_trap, newsym, sensemon, shieldeff, tmp_at, under_water } from './display.js';
import { dropx, flooreffects, schedule_goto, set_wounded_legs } from './do.js';
import { Amonnam, Monnam, YMonnam, a_monnam, christen_monst, hcolor, hliquid, mon_nam, mon_pmname, noit_Monnam, obj_pmname, rndcolor, rndmonnam, x_monnam, y_monnam } from './do_name.js';
import { Boots_off, hard_helmet } from './do_wear.js';
import { abuse_dog, tamedog, wary_dog } from './dog.js';
import { down_gate, impact_drop, ship_object } from './dokick.js';
import { defsyms } from './drawing.js';
import { Can_fall_thru, In_hell, In_quest, assign_level, at_dgn_entrance, ceiling, depth, dunlev, dunlevs_in_dungeon, find_hell, get_level, has_ceiling, level_difficulty, on_level, single_level_branch, surface, u_on_newpos, update_lastseentyp } from './dungeon.js';
import { is_fainted, reset_faint } from './eat.js';
import { done } from './end.js';
import { can_reach_floor, del_engr_at } from './engrave.js';
import { losexp, more_experienced, newexplevel } from './exper.js';
import { scatter } from './explode.js';
import { bad_rock, calc_capacity, check_capacity, crawl_destination, in_rooms, inv_cnt, inv_weight, losehp, movobj, near_capacity, nomul, set_uinwater, spot_checks, spoteffects, test_move, u_locomotion, unmul, weight_cap } from './hack.js';
import { copynchars, dist2, distmin, eos, lcase, ordin, s_suffix, strsubst, upstart } from './hacklib.js';
import { carrying, consume_obj_charge, currency, delobj, getobj, nxtobj, prinv, sobj_at, stackobj, update_inventory, useup, useupall } from './invent.js';
import { stumble_on_door_mimic } from './lock.js';
import { makemon, set_malign } from './makemon.js';
import { sleep_monst } from './mhitm.js';
import { set_levltyp } from './mkmaze.js';
import { add_to_container, add_to_migration, costly_alteration, dealloc_obj, is_flammable, is_rottable, mkcorpstat, mksobj, obj_extract_self, obj_ice_effects, place_object, rndmonnum_adj, splitobj, weight } from './mkobj.js';
import { killed, m_in_air, maybe_unhide_at, mlifesaver, mon_to_stone, mongone, monkilled, monstone, newcham, seemimic, set_ustuck, setmangry, shieldeff_mon, vamp_stone, wake_nearby, wake_nearto, wakeup, xkilled } from './mon.js';
import { Resists_Elem, attacktype, defended, dmgtype_fromattack, mon_knows_traps, mon_learns_traps, mons_see_trap, monstseesu, monstunseesu, poly_when_stoned, resists_blnd, resists_magm, stagger, sticks } from './mondata.js';
import { closed_door } from './monmove.js';
import { hits_bars, linedup, m_carrying, ohitmon, thitu } from './mthrowu.js';
import { AIR, ALTAR, ANTIMAGIC, ANTI_MAGIC, ARM, ARMOR_CLASS, ARROW, ARROW_TRAP, ART_EYES_OF_THE_OVERWORLD, ART_MAGICBANE, ART_STING, A_CHA, A_CON, A_DEX, A_STR, A_WIS, BAG_OF_TRICKS, BEARTRAP, BEAR_TRAP, BLINDED, BOULDER, BURNING, CAN_OF_GREASE, CHEST, CLOUD, CONFUSION, COPPER, CORPSE, CORR, COST_BURN, COST_CORRODE, COST_CRACK, COST_DECHNT, COST_ROT, COST_RUST, DART, DART_TRAP, DBWALL, DEAF, DIR_ERR, DISMOUNT_FELL, DISMOUNT_GENERIC, DISMOUNT_POLY, DISSOLVED, DOOR, DRAGON_HIDE, DRAIN_RES, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, DROWNING, FINGER, FIRE_HORN, FIRE_RES, FIRE_TRAP, FIRST_OBJECT, FIRST_REAL_GEM, FIRST_SPELL, FLYING, FOOT, FREE_ACTION, FUMBLING, GEMSTONE, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_SUGGEST, GLASS, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, HALF_PHDAM, HALF_SPDAM, HALLUC, HALLUC_RES, HAND, HEAD, HOLE, HVY_ENCUMBER, ICE_BOX, INVIS, IRON, IRONBARS, IRON_SHOES, KICKING_BOOTS, LADDER, LANDMINE, LAND_MINE, LARGE_BOX, LAST_GLASS_GEM, LAST_SPELL, LEG, LEVEL_TELEP, LEVITATION, LIFESAVED, LOADSTONE, LOW_PM, MAGICAL_BREATHING, MAGIC_PORTAL, MAGIC_TRAP, MELT_ICE_AWAY, MINERAL, MS_GUARDIAN, M_AP_FURNITURE, M_AP_OBJECT, M_SEEN_ELEC, M_SEEN_FIRE, M_SEEN_SLEEP, NO_PART, NO_TRAP, NUMMONS, NUM_OBJECTS, N_DIRS_Z, OILSKIN_SACK, PASSES_WALLS, PIT, PLNMSG_BACK_ON_GROUND, PM_AIR_ELEMENTAL, PM_ARCHEOLOGIST, PM_BALROG, PM_BALUCHITHERIUM, PM_BLACK_LIGHT, PM_BUGBEAR, PM_CAVE_SPIDER, PM_CHICKATRICE, PM_COCKATRICE, PM_CYCLOPS, PM_DOPPELGANGER, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLESH_GOLEM, PM_FOG_CLOUD, PM_GELATINOUS_CUBE, PM_GIANT_SPIDER, PM_GREMLIN, PM_IRON_GOLEM, PM_JABBERWOCK, PM_KRAKEN, PM_LEATHER_GOLEM, PM_LORD_SURTUR, PM_MANES, PM_MASTODON, PM_NORN, PM_ORION, PM_OWLBEAR, PM_PAPER_GOLEM, PM_PIT_FIEND, PM_PIT_VIPER, PM_PURPLE_WORM, PM_RANGER, PM_ROGUE, PM_SALAMANDER, PM_STALKER, PM_STEAM_VORTEX, PM_STONE_GOLEM, PM_STRAW_GOLEM, PM_TITANOTHERE, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WATER_ELEMENTAL, PM_WOOD_GOLEM, POLY_NOFLAGS, POLY_TRAP, POOL, POTION_CLASS, POT_ACID, POT_OIL, POT_WATER, P_BASIC, P_DAGGER, P_RIDING, P_SABER, RING_CLASS, ROCK, ROCKTRAP, ROLLING_BOULDER_TRAP, ROOM, RUST_TRAP, SADDLE, SCORR, SCROLL_CLASS, SCR_BLANK_PAPER, SCR_FIRE, SCR_MAIL, SDOOR, SEE_INVIS, SHOCK_RES, SHOPBASE, SLEEP_RES, SLIMED, SLP_GAS_TRAP, SLT_ENCUMBER, SPBOOK_CLASS, SPE_BLANK_PAPER, SPE_BOOK_OF_THE_DEAD, SPE_FIREBALL, SPE_NOVEL, SPE_REMOVE_CURSE, SPIKED_PIT, SPINE, SQKY_BOARD, STAIRS, STATUE, STATUE_TRAP, STONE, STONE_RES, STONING, STUNNED, SWIMMING, S_DRAGON, S_EYE, S_GIANT, S_GOLEM, S_HUMAN, S_LIGHT, S_MIMIC, S_UNICORN, S_VORTEX, S_arrow_trap, S_bear_trap, S_pit, S_web, TELEPORT, TELEPORT_CONTROL, TELEP_TRAP, TOOL_CLASS, TOWEL, TRAPDOOR, TRAPNUM, TRAPPED_CHEST, TRAPPED_DOOR, TRAP_CLEARLY_IMMUNE, TRAP_HIDDEN_IMMUNE, TRAP_NOT_IMMUNE, TREE, TT_BEARTRAP, TT_BURIEDBALL, TT_INFLOOR, TT_LAVA, TT_NONE, TT_PIT, TT_WEB, Trap_Caught_Mon, Trap_Effect_Finished, Trap_Is_Gone, Trap_Killed_Mon, Trap_Moved_Mon, UNCHANGING, UNENCUMBERED, UTOTYPE_FALLING, UTOTYPE_NONE, VIBRATING_SQUARE, WAND_CLASS, WAN_FIRE, WATER, WEAPON_CLASS, WEB, WOOD, WT_ELF, WT_TOOMUCH_DIAGONAL, WWALKING, se_squeak_A, se_squeak_B, se_squeak_B_flat, se_squeak_C, se_squeak_D, se_squeak_D_flat, se_squeak_E, se_squeak_E_flat, se_squeak_F, se_squeak_F_sharp, se_squeak_G, se_squeak_G_sharp } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { The, Tobjnam, Yname2, Yobjnam2, an, ansimpleoname, aobjnam, bare_artifactname, cloak_simple_name, corpse_xname, cxname, doname, erosion_matters, gloves_simple_name, helm_simple_name, just_an, makeplural, otense, safe_qbuf, simpleonames, suit_simple_name, the, vtense, xname, yname } from './objnam.js';
import { ice_descr, waterbody_name } from './pager.js';
import { encumber_msg, pickup } from './pickup.js';
import { Norep, There, livelog_printf, pline_mon, pline_xy, set_msg_xy, urgent_pline } from './pline.js';
import { body_part, float_vs_flight, mbodypart, polymon, polyself } from './polyself.js';
import { incr_itimeout, make_blinded, make_hallucinated, make_stunned, self_invis_message, set_itimeout, split_mon } from './potion.js';
import { is_quest_artifact, quest_info } from './questpgr.js';
import { cant_revive, seffects, unpunish } from './read.js';
import { create_gas_cloud } from './region.js';
import { d, rn2, rn2_on_display_rng, rnd, rnl } from './rnd.js';
import { add_damage, costly_spot, delete_contents, inside_shop, make_angry_shk, obfree, sellobj, shk_your, shop_keeper, shopdig, stolen_value } from './shk.js';
import { mpickobj, remove_worn_item } from './steal.js';
import { dismount_steed, rider_cant_reach } from './steed.js';
import { domagicportal, dotele, goodpos, level_tele_trap, mlevel_tele_trap, mtele_trap, noteleport_level, random_teleport_level, rloco, safe_teleds, tele_trap, teleds } from './teleport.js';
import { burn_away_slime, fall_asleep, spot_stop_timers } from './timeout.js';
import { stumble_onto_mimic } from './uhitm.js';
import { recalc_block_point, unblock_point, vision_recalc } from './vision.js';
import { dmgval, dry_a_towel, mwepgone, wet_a_towel } from './weapon.js';
import { uswapwepgone, uwepgone, welded } from './wield.js';
import { mon_has_amulet } from './wizard.js';
import { count_wsegs } from './worm.js';
import { extract_from_minvent, find_mac, m_dowear, mon_adjust_speed, setnotworn, update_mon_extrinsics, which_armor } from './worn.js';
import { blank_novel, burn_floor_objects, destroy_items, destroy_strings, fracture_rock, get_obj_location, inventory_resistance_check, melt_ice, montraits, obj_resists, poly_obj, resist } from './zap.js';

/* from zap.c */
const a_your = ["a", "your"];
const A_Your = ["A", "Your"];
const tower_of_flame = "tower of flame";
const A_gush_of_water_hits = "A gush of water hits";
const blindgas = ["humid", "odorless", "pungent", "chilling", "acrid", "biting"];
/* called when you're hit by fire (dofiretrap,buzz,zapyourself,explode);
   returns TRUE if hit on torso */
export async function burnarmor(victim) {
    let item = null;
    let buf = '';
    let mat_idx = 0;
    let oldspe = 0;
    let hitting_u = 0;
    if (!victim) {
        /*  chance per item of sustaining damage:
            *   max luck:               10%
            *   avg luck (Luck==0):     75%
            *   awful luck (Luck<-4):  100%
            */
        return 0;
    }
    hitting_u = (victim == game.youmonst);
    /* burning damage may dry wet towel */
    item = hitting_u ? carrying(TOWEL) : m_carrying(victim, TOWEL);
    while (item) {
        if (((item).otyp == TOWEL && (item).spe > 0)) {
            oldspe = item.spe;
            await dry_a_towel(item, rn2(oldspe + 1), (1));
            if (item.spe != oldspe) {
                break;
            }
        }
        item = item.nobj;
    }
    while (1) {
        switch (rn2(5)) {
            /* stop once one towel has been affected */
            /* True: different feedback if otmp destroyed */
            /* Unlike monsters, traps cannot aim their rust attacks at
         * you, so instead of looping through and taking either the
         * first rustable one or the body, we take whatever we get,
         * even if it is not rustable.
         */
            case 0:
                item = hitting_u ? game.uarmh : await which_armor(victim, 4);
                if (item) {
                    mat_idx = game.objects[item.otyp].oc_material;
                    buf = sprintf(buf, "%s %s", materialnm[mat_idx], helm_simple_name(item));
                }
                if (!await erode_obj(item, item ? buf : "helmet", 0, 1)) {
                    continue;
                }
                break;
            case 1:
                item = hitting_u ? game.uarmc : await which_armor(victim, 2);
                if (item) {
                    await erode_obj(item, cloak_simple_name(item), 0, 1);
                    return (1);
                }
                item = hitting_u ? game.uarm : await which_armor(victim, 1);
                if (item) {
                    await erode_obj(item, await xname(item), 0, 1);
                    return (1);
                }
                item = hitting_u ? game.uarmu : await which_armor(victim, 64);
                if (item) {
                    await erode_obj(item, "shirt", 0, 1);
                }
                return (1);
            case 2:
                item = hitting_u ? game.uarms : await which_armor(victim, 8);
                if (!await erode_obj(item, "wooden shield", 0, 1)) {
                    continue;
                }
                break;
            case 3:
                item = hitting_u ? game.uarmg : await which_armor(victim, 16);
                if (!await erode_obj(item, "gloves", 0, 1)) {
                    continue;
                }
                break;
            case 4:
                item = hitting_u ? game.uarmf : await which_armor(victim, 32);
                if (!await erode_obj(item, "boots", 0, 1)) {
                    continue;
                }
                break;
        }
        break;
    }
    return (0);
}
/* Generic erode-item function.
 * "ostr", if non-null, is an alternate string to print instead of the
 *   object's name.
 * "type" is an ERODE_* value for the erosion type
 * "flags" is an or-ed list of EF_* flags
 *
 * Returns an erosion return value (ER_*)
 */
const __erode_obj_action = ["smoulder", "rust", "rot", "corrode", "crack"];
const __erode_obj_msg = ["burnt", "rusted", "rotten", "corroded", "cracked"];
const __erode_obj_bythe = ["heat", "oxidation", "decay", "corrosion", "impact"];
export async function erode_obj(otmp, ostr, type, ef_flags) {
    /* this could use improvement... */
    let vulnerable = (0);
    let is_primary = (1);
    let check_grease = (ef_flags & 1) ? (1) : (0);
    let print = (ef_flags & 4) ? (1) : (0);
    let crackers = (0);
    let uvictim = 0;
    let vismon = 0;
    let visobj = 0;
    let erosion = 0;
    let cost_type = 0;
    /* Scrolls but not spellbooks can be erased by acid. */
    let victim = null;
    if (!otmp) {
        return 0;
    }
    victim = ((otmp).where == 3) ? game.youmonst : ((otmp).where == 4) ? otmp.v.v_ocarry : null;
    uvictim = (victim == game.youmonst);
    vismon = victim && (victim != game.youmonst) && canseemon(victim);
    /* Is gb.bhitpos correct here? Ugh. */
    visobj = (!victim && ((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0) && (!is_pool(game.bhitpos.x, game.bhitpos.y) || ((dist2(((game.bhitpos.x)), ((game.bhitpos.y)), game.u.ux, game.u.uy) <= 2) && (game.u.uinwater))));
    switch (type) {
        case 0:
            if (uvictim && inventory_resistance_check(2)) {
                return 0;
            }
            vulnerable = is_flammable(otmp);
            check_grease = (0);
            cost_type = COST_BURN;
            break;
        case 1:
            vulnerable = (game.objects[otmp.otyp].oc_material == IRON);
            cost_type = COST_RUST;
            break;
        case 2:
            vulnerable = is_rottable(otmp);
            check_grease = (0);
            is_primary = (0);
            cost_type = COST_ROT;
            break;
        case 3:
            if (uvictim && inventory_resistance_check(8)) {
                return 0;
            }
            vulnerable = (game.objects[otmp.otyp].oc_material == COPPER || game.objects[otmp.otyp].oc_material == IRON);
            is_primary = (0);
            cost_type = COST_CORRODE;
            break;
        case 4:
            vulnerable = (game.objects[(otmp).otyp].oc_material == GLASS && (otmp).oclass == ARMOR_CLASS);
            is_primary = (1);
            crackers = (1);
            cost_type = COST_CRACK;
            break;
        default:
            await impossible("Invalid erosion type in erode_obj");
            return 0;
    }
    erosion = is_primary ? otmp.oeroded : otmp.oeroded2;
    if (!ostr) {
        ostr = await cxname(otmp);
    }
    /* 'visobj' messages insert "the"; probably ought to switch to the() */
    if (visobj && !(uvictim || vismon) && !strncmpi(ostr, "the ", 4)) {
        ostr = __nh_advance_str(ostr, 4);
    }
    if (check_grease && otmp.greased) {
        await grease_protect(otmp, ostr, victim);
        return 1;
    } else if (!erosion_matters(otmp)) {
        return 0;
    } else if (!vulnerable || (otmp.oerodeproof && otmp.rknown)) {
        if (game.flags.verbose && print && (uvictim || vismon)) {
            await pline("%s %s %s not affected by %s.", uvictim ? "Your" : s_suffix(await Monnam(victim)), ostr, await vtense(ostr, "are"), __erode_obj_bythe[type]);
        }
        return 0;
    } else if (otmp.oerodeproof || (otmp.blessed && !rnl(4))) {
        if (game.flags.verbose && (print || otmp.oerodeproof) && (uvictim || vismon || visobj)) {
            await pline("Somehow, %s %s %s not affected by the %s.", uvictim ? "your" : !vismon ? "the" : s_suffix(await mon_nam(victim)), ostr, await vtense(ostr, "are"), __erode_obj_bythe[type]);
        }
        if (otmp.oerodeproof) {
            /* We assume here that if the object is protected because it
         * is blessed, it still shows some minor signs of wear, and
         * the hero can distinguish this from an object that is
         * actually proof against damage.
         */
            otmp.rknown = (1);
            if (victim == game.youmonst) {
                update_inventory();
            }
        }
        return 0;
    } else if (erosion < 3) {
        let adverb = (erosion + 1 == 3) ? " completely" : erosion ? " further" : "";
        if (uvictim || vismon || visobj) {
            await pline("%s %s %s%s!", uvictim ? "Your" : !vismon ? "The" : s_suffix(await Monnam(victim)), ostr, await vtense(ostr, __erode_obj_action[type]), adverb);
        }
        if (ef_flags & 8) {
            await costly_alteration(otmp, cost_type);
        }
        if (is_primary) {
            otmp.oeroded++;
        } else {
            otmp.oeroded2++;
        }
        if (victim == game.youmonst) {
            update_inventory();
        }
        /* not actually damaged, but because we /didn't/ get the "water
           gets into!" message, the player now has more information and
           thus we need to waste any potion they may have used (also,
           flavourwise the water is now on the floor) */
        return 2;
    } else if (ef_flags & 2) {
        /* in case of hangup during message w/ --More-- */
        otmp.in_use = 1;
        if (uvictim || vismon || visobj) {
            let actbuf = '';
            if (!crackers) {
                actbuf = sprintf(actbuf, "%s away", await vtense(ostr, __erode_obj_action[type]));
            } else {
                actbuf = sprintf(actbuf, "shatters");
            }
            await pline("%s %s %s!", uvictim ? "Your" : !vismon ? "The" : s_suffix(await Monnam(victim)), ostr, actbuf);
        }
        if (ef_flags & 8) {
            await costly_alteration(otmp, cost_type);
        }
        if (otmp.owornmask) {
            if (((otmp).where == 3)) {
                await remove_worn_item(otmp, (1));
            } else if (((otmp).where == 4)) {
                await extract_from_minvent(otmp.v.v_ocarry, otmp, (1), (0));
            } else {
                await impossible("erode_obj(%d): destroying strangely worn item [%d, 0x%08lx: %s]", type, otmp.where, otmp.owornmask, await simpleonames(otmp));
                /* otherwise a second complaint (about
                                       * deleting a worn item) will ensue */
                otmp.owornmask = 0;
            }
        }
        await delobj(otmp);
        return 3;
    } else {
        if (game.flags.verbose && print) {
            if (uvictim) {
                await Your("%s %s completely %s.", ostr, await vtense(ostr, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "look"), __erode_obj_msg[type]);
            } else if (vismon || visobj) {
                await pline("%s %s %s completely %s.", !vismon ? "The" : s_suffix(await Monnam(victim)), ostr, await vtense(ostr, "look"), __erode_obj_msg[type]);
            }
        }
        return 0;
    }
}
/* Protect an item from erosion with grease. Returns TRUE if the grease
 * wears off.
 */
const __grease_protect_txt = "protected by the layer of grease!";
export async function grease_protect(otmp, ostr, victim) {
    let vismon = victim && (victim != game.youmonst) && canseemon(victim);
    if (ostr) {
        if (victim == game.youmonst) {
            await Your("%s %s %s", ostr, await vtense(ostr, "are"), __grease_protect_txt);
        } else if (vismon) {
            await pline("%s's %s %s %s", await Monnam(victim), ostr, await vtense(ostr, "are"), __grease_protect_txt);
        }
    } else if (victim == game.youmonst || vismon) {
        await pline("%s %s", await Yobjnam2(otmp, "are"), __grease_protect_txt);
    }
    if (!rn2(2)) {
        otmp.greased = 0;
        if (((otmp).where == 3)) {
            await pline_The("grease dissolves.");
            update_inventory();
        }
        return (1);
    }
    return (0);
}
/* create a "living" statue at x,y */
export async function mk_trap_statue(x, y) {
    let mtmp = null;
    let otmp = null;
    let statue = null;
    let mptr = null;
    let trycount = 10;
    do {
        mptr = game.mons[await rndmonnum_adj(3, 6)];
    } while (--trycount > 0 && ((mptr).mlet == S_UNICORN && (((mptr).mflags2 & 536870912) != 0)) && sgn(game.u.ualign.type) == sgn(mptr.maligntyp));
    statue = await mkcorpstat(STATUE, null, mptr, x, y, 0);
    mtmp = await makemon(game.mons[statue.corpsenm], 0, 0, 4 | 131072);
    if (!mtmp) {
        return;
    }
    while (mtmp.minvent) {
        otmp = mtmp.minvent;
        otmp.owornmask = 0;
        await obj_extract_self(otmp);
        await add_to_container(statue, otmp);
    }
    statue.owt = await weight(statue);
    await mongone(mtmp);
}
/* find "bottom" level of specified dungeon, stopping at quest locate */
export function dng_bottom(lev) {
    let bottom = dunlevs_in_dungeon(lev);
    if (In_quest(lev)) {
        /* when in the upper half of the quest, don't fall past the
       middle "quest locate" level if hero hasn't been there yet */
        let qlocate_depth = (game.dungeon_topology.d_qlocate_level).dlevel;
        /* deepest reached < qlocate implies current < qlocate */
        if ((game.dungeons[(lev).dnum].dunlev_ureached) < qlocate_depth) {
            bottom = qlocate_depth;
        }
    } else if (In_hell(lev)) {
        /* if the invocation hasn't been performed yet, the vibrating square
           level is effectively the bottom of Gehennom; the sanctum level is
           out of reach until after the invocation */
        if (!game.u.uevent.invoked) {
            bottom -= 1;
        }
    }
    return bottom;
}
/* destination dlevel for holes or trapdoors */
export function hole_destination(dst) {
    let bottom = dng_bottom(game.u.uz);
    dst.dnum = game.u.uz.dnum;
    dst.dlevel = dunlev(game.u.uz);
    while (dst.dlevel < bottom) {
        dst.dlevel++;
        if (rn2(4)) {
            break;
        }
    }
}
let __maketrap_zero_vl = { v_launch_otyp: 0, v_launch2: { x: 0, y: 0 }, v_conjoined: 0, v_tnote: 0 };
__nh_register_static(() => { __maketrap_zero_vl = { v_launch_otyp: 0, v_launch2: { x: 0, y: 0 }, v_conjoined: 0, v_tnote: 0 }; });
export async function maketrap(x, y, typ) {
    let oldplace = 0;
    let was_ice = 0;
    let clear_flags = 0;
    let ttmp = null;
    let lev = game.level.locations[x][y];
    if (typ == TRAPPED_DOOR || typ == TRAPPED_CHEST) {
        /* no trap on top of furniture (caller usually screens the
           location to inhibit this, but wizard mode wishing doesn't)
           and no level teleporter in branch with only one level */
        return null;
    }
    if ((ttmp = t_at(x, y)) != null) {
        if (((ttmp.ttyp) == MAGIC_PORTAL || (ttmp.ttyp) == VIBRATING_SQUARE)) {
            return null;
        }
        oldplace = (1);
        /* old <tx,ty> remain valid */
        if (game.u.utrap && ((x) == game.u.ux && (y) == game.u.uy) && ((game.u.utraptype == TT_BEARTRAP && typ != BEAR_TRAP) || (game.u.utraptype == TT_WEB && typ != WEB) || (game.u.utraptype == TT_PIT && !((typ) == PIT || (typ) == SPIKED_PIT)) || (game.u.utraptype == TT_LAVA && !is_lava(x, y)))) {
            await reset_utrap((0));
        }
    } else if (!(game.iflags.debug_overwrite_stairs || !((lev.typ) == LADDER || (lev.typ) == STAIRS)) || is_pool_or_lava(x, y) || (((lev.typ) >= STAIRS && (lev.typ) <= ALTAR) && (typ != PIT && typ != HOLE)) || (lev.typ == DRAWBRIDGE_UP && typ == MAGIC_PORTAL) || (((lev.typ) == AIR || (lev.typ) == CLOUD) && typ != MAGIC_PORTAL) || (typ == LEVEL_TELEP && single_level_branch(game.u.uz))) {
        return null;
    } else {
        oldplace = (0);
        ttmp = alloc(1 /* sizeof(struct trap) */);
        memset(ttmp, 0, 1 /* sizeof(struct trap) */);
        ttmp.ntrap = null;
        ttmp.tx = x;
        ttmp.ty = y;
    }
    /* [re-]initialize all fields except ntrap (handled below) and <tx,ty> */
    Object.assign(ttmp.vl, __maketrap_zero_vl);
    /* force error if used before set */
    ttmp.launch.x = ttmp.launch.y = -1;
    ttmp.dst.dnum = ttmp.dst.dlevel = -1;
    ttmp.madeby_u = 0;
    ttmp.once = 0;
    ttmp.tseen = ((typ) == HOLE);
    ttmp.ttyp = typ;
    switch (typ) {
        case SQKY_BOARD:
            ttmp.vl.v_tnote = choose_trapnote(ttmp);
            break;
        /* create a "living" statue */
        case STATUE_TRAP:
            await mk_trap_statue(x, y);
            break;
        /* boulder will roll towards trigger */
        case ROLLING_BOULDER_TRAP:
            await mkroll_launch(ttmp, x, y, BOULDER, 1);
            break;
        case PIT:
        case SPIKED_PIT:
            ttmp.vl.v_conjoined = 0;
            ;
        case HOLE:
        case TRAPDOOR:
            if (((typ) == HOLE || (typ) == TRAPDOOR)) {
                hole_destination((ttmp.dst));
            }
            if (in_rooms(x, y, SHOPBASE) && (((typ) == HOLE || (typ) == TRAPDOOR) || ((lev.typ) == DOOR) || ((lev.typ) && (lev.typ) <= DBWALL))) {
                await add_damage(x, y, ((((lev.typ) == DOOR) || ((lev.typ) && (lev.typ) <= DBWALL)) && !game.context.mon_moving) ? 200 : 0);
            }
            /* assume lev->flags needs to be reset */
            clear_flags = (1);
            if (lev.typ == DRAWBRIDGE_UP) {
                /* DRAWBRIDGE_UP passes the IS_ROOM() test so check it first;
           it also needs to retain lev->drawbridgemask */
                /* bridge is closed and we're putting a hole or pit at the span
               spot; this trap will be deleted if/when the bridge is opened;
               terrain becomes room floor even if it was moat, lava, or ice */
                /* keep lev->drawbridgemask */
                clear_flags = (0);
                was_ice = (lev.flags & 28) == 8;
                lev.flags &= ~28;
                lev.flags |= 16;
                if (was_ice) {
                    await obj_ice_effects(x, y, (1));
                    spot_stop_timers(x, y, MELT_ICE_AWAY);
                }
            } else if (((lev.typ) >= ROOM)) {
                await set_levltyp(x, y, ROOM);
            } else if (lev.typ == STONE || lev.typ == SCORR) {
                await set_levltyp(x, y, CORR);
            } else if (((lev.typ) && (lev.typ) <= DBWALL) || lev.typ == SDOOR) {
                await set_levltyp(x, y, game.level.flags.is_maze_lev ? ROOM : game.level.flags.is_cavernous_lev ? CORR : DOOR);
            }
            if (clear_flags) {
                lev.flags = 0;
            }
            await unearth_objs(x, y);
            recalc_block_point(x, y);
            break;
        case TELEP_TRAP:
            if (isok(game.launchplace.x, game.launchplace.y)) {
                ttmp.launch.x = game.xstart + game.launchplace.x;
                ttmp.launch.y = game.ystart + game.launchplace.y;
                if (ttmp.launch.x == x && ttmp.launch.y == y) {
                    await impossible("making fixed-dest tele trap pointing to itself");
                }
            }
            break;
    }
    if (!oldplace) {
        ttmp.ntrap = game.ftrap;
        game.ftrap = ttmp;
    } else {
        /* oldplace;
           it shouldn't be possible to override a sokoban pit or hole
           with some other trap, but we'll check just to be safe */
        if (game.level.flags.sokoban_rules) {
            maybe_finish_sokoban();
        }
    }
    return ttmp;
}
/* limit the destination of a hole or trapdoor to the furthest level you
   should be able to fall to */
export function clamp_hole_destination(dlev) {
    let bottom = dng_bottom(dlev);
    dlev.dlevel = ((dlev.dlevel) < (bottom) ? (dlev.dlevel) : (bottom));
    return dlev;
}
/* td == TRUE : trap door or hole */
export async function fall_through(td, ftflags) {
    let dtmp = { dnum: 0, dlevel: 0 };
    let msgbuf = '';
    let dont_fall = null;
    let newlevel = 0;
    /* otherwise left with its previous value intact */
    let t = null;
    let controlled_flight = (0);
    /* we'll fall even while levitating in Sokoban; otherwise, if we
       won't fall and won't be told that we aren't falling, give up now */
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !game.level.flags.sokoban_rules) {
        return;
    }
    newlevel = dunlev(game.u.uz);
    newlevel++;
    if (td) {
        t = t_at(game.u.ux, game.u.uy);
        await feeltrap(t);
        if (!game.level.flags.sokoban_rules && !(ftflags & 16)) {
            if (t.ttyp == TRAPDOOR) {
                await pline("A trap door opens up under you!");
            } else {
                await pline("There's a gaping hole under you!");
            }
        }
    } else {
        await pline_The("%s opens up under you!", surface(game.u.ux, game.u.uy));
    }
    if (game.level.flags.sokoban_rules && Can_fall_thru(game.u.uz)) {
        ;
    } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || game.u.ustuck || (!Can_fall_thru(game.u.uz) && !game.level.locations[game.u.ux][game.u.uy].candig) || ((((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || (((game.youmonst.data).mflags1 & 16) != 0) || (((((game.youmonst.data).mflags1 & 256) != 0) && (((((game.youmonst.data).mflags1 & 16) != 0) && (game.youmonst.data).mlet != S_MIMIC) || (((game.youmonst.data).mflags1 & 1) != 0))) && game.u.uundetected)) && !(ftflags & 16))) {
        /* KMH -- You can't escape the Sokoban level traps */
        dont_fall = "don't fall in.";
    } else if (game.youmonst.data.msize >= 4) {
        dont_fall = "don't fit through.";
    } else if (!await next_to_u()) {
        dont_fall = "are jerked back by your pet!";
    }
    if (dont_fall) {
        await You("%s", dont_fall);
        await impact_drop(null, game.u.ux, game.u.uy, 0);
        if (!td) {
            await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
            await pline_The("opening under you closes up.");
        }
        return;
    }
    if ((((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || (((game.youmonst.data).mflags1 & 16) != 0)) && (ftflags & 16) && td && t) {
        if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            controlled_flight = (1);
        }
        await You("%s down %s!", ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) ? "swoop" : "deliberately drop", (t.ttyp == TRAPDOOR) ? "through the trap door" : "into the gaping hole");
    }
    if (game.u.ushops) {
        await shopdig(1);
    }
    if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
        find_hell(dtmp);
    } else {
        let dist = 0;
        if (t) {
            assign_level(dtmp, t.dst);
            /* don't fall beyond the bottom, in case this came from a bones
               file with different dungeon size  */
            clamp_hole_destination(dtmp);
        } else {
            dtmp.dnum = game.u.uz.dnum;
            dtmp.dlevel = newlevel;
        }
        dist = depth(dtmp) - depth(game.u.uz);
        if (dist > 1) {
            await You("%s down a %s%sshaft!", controlled_flight ? "fly" : "fall", dist > 3 ? "very " : "", dist > 2 ? "deep " : "");
        }
    }
    if (!td) {
        msgbuf = sprintf(msgbuf, "The hole in the %s above you closes up.", ceiling(game.u.ux, game.u.uy));
    }
    schedule_goto(dtmp, !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) ? UTOTYPE_FALLING : UTOTYPE_NONE, null, !td ? msgbuf : null);
}
/*
 * Animate the given statue.  May have been via shatter attempt, trap,
 * or stone to flesh spell.  Return a monster if successfully animated.
 * If the monster is animated, the object is deleted.  If fail_reason
 * is non-null, then fill in the reason for failure (or success).
 *
 * The cause of animation is:
 *
 *      ANIMATE_NORMAL  - hero "finds" the monster
 *      ANIMATE_SHATTER - hero tries to destroy the statue
 *      ANIMATE_SPELL   - stone to flesh spell hits the statue
 *
 * Perhaps x, y is not needed if we can use get_obj_location() to find
 * the statue's location... ???
 *
 * Sequencing matters:
 *      create monster; if it fails, give up with statue intact;
 *      give "statue comes to life" message;
 *      if statue belongs to shop, have shk give "you owe" message;
 *      transfer statue contents to monster (after stolen_value());
 *      delete statue.
 *      [This ordering means that if the statue ends up wearing a cloak of
 *       invisibility or a mummy wrapping, the visibility checks might be
 *       wrong, but to avoid that we'd have to clone the statue contents
 *       first in order to give them to the monster before checking their
 *       shop status--it's not worth the hassle.]
 */
const __animate_statue_historic_statue_is_gone = "that the historic statue is now gone";
export async function animate_statue(statue, x, y, cause, fail_reason) {
    let mnum = statue.corpsenm;
    let mptr = game.mons[mnum];
    let mon = null;
    let shkp = null;
    let item = null;
    let cc = { x: 0, y: 0 };
    let historic = ((game.urole.mnum == (PM_ARCHEOLOGIST)) && (statue.spe & 4) != 0);
    let golem_xform = (0);
    let use_saved_traits = 0;
    let comes_to_life = null;
    let statuename = '';
    let tmpbuf = '';
    if (cant_revive({ get value() { return mnum; }, set value(_v) { mnum = _v; } }, (1), statue)) {
        /* mnum has changed; we won't be animating this statue as itself */
        if (mnum != PM_DOPPELGANGER) {
            mptr = game.mons[mnum];
        }
        use_saved_traits = (0);
    } else if (((mptr).mlet == S_GOLEM) && cause == 2) {
        /* statue of any golem hit by stone-to-flesh becomes flesh golem */
        golem_xform = (mptr != game.mons[PM_FLESH_GOLEM]);
        mnum = PM_FLESH_GOLEM;
        mptr = game.mons[PM_FLESH_GOLEM];
        use_saved_traits = (((statue).oextra && ((statue).oextra.omonst)) && !golem_xform);
    } else {
        use_saved_traits = ((statue).oextra && ((statue).oextra.omonst));
    }
    if (use_saved_traits) {
        /* restore a petrified monster */
        cc.x = x , cc.y = y;
        mon = await montraits(statue, cc, (cause == 2));
        if (mon && mon.mtame && !mon.isminion) {
            await wary_dog(mon, (1));
        }
    } else {
        let sgend = (statue.spe & 3);
        let mmflags = (1 | 131072 | ((sgend == 2) ? 32768 : 0) | ((sgend == 1) ? 65536 : 0));
        if ((mnum == PM_DOPPELGANGER && mptr != game.mons[PM_DOPPELGANGER]) || (mptr.msound == MS_GUARDIAN && await quest_info(MS_GUARDIAN) != mnum)) {
            /* statues of unique monsters from bones or wishing end
           up here (cant_revive() sets mnum to be doppelganger;
           mptr reflects the original form for use by newcham()) */
            /* block quest guards from other roles */
            mmflags |= 4 | 16;
            mon = await makemon(game.mons[PM_DOPPELGANGER], x, y, mmflags);
            /* if hero has protection from shape changers, cham field will
               be NON_PM; otherwise, set form to match the statue */
            if (mon && ((mon.cham) >= LOW_PM && (mon.cham) < NUMMONS)) {
                await newcham(mon, mptr, 0);
            }
        } else {
            if (cause == 2) {
                mmflags |= 16;
            }
            mon = await makemon(mptr, x, y, mmflags);
        }
    }
    if (!mon) {
        if (fail_reason) {
            fail_reason.value = (((game.mons[statue.corpsenm]).geno & 4096) != 0) ? 2 : 1;
        }
        return null;
    }
    /* if statue has been named, give same name to the monster */
    if (((statue).oextra && ((statue).oextra.oname)) && !(((mon.data).geno & 4096) != 0)) {
        mon = christen_monst(mon, ((statue).oextra.oname));
    }
    if (((mon).m_ap_type & 7)) {
        await seemimic(mon);
    /* mimic statue becomes seen mimic; other hiders won't be hidden */
    } else {
        mon.mundetected = (0);
    }
    mon.msleeping = 0;
    if (cause == 0 || cause == 1) {
        /* trap always releases hostile monster */
        /* (might be petrified pet tossed onto trap) */
        mon.mtame = 0;
        mon.mpeaceful = 0;
        set_malign(mon);
    }
    comes_to_life = !(canseemon(mon) || sensemon(mon)) ? "disappears" : golem_xform ? "turns into flesh" : (((((mon.data).mflags2 & 2) != 0) || (mon.data) == game.mons[PM_MANES] || (((mon.data).mlet == S_GOLEM) || (mon.data).mlet == S_VORTEX)) || ((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) ? "moves" : "comes to life";
    if (((x) == game.u.ux && (y) == game.u.uy) || cause == 2) {
        shkp = await shop_keeper(in_rooms(mon.mx, mon.my, SHOPBASE));
        statuename = sprintf(statuename, "%s%s", await shk_your(tmpbuf, statue), (cause == 2 && (mon != shkp || ((statue).where == 3))) ? await xname(statue) : "statue");
        await pline("%s %s!", upstart(statuename), comes_to_life);
    } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        await pline_The("%s suddenly seems more animated.", await rndmonnam(null));
    } else if (cause == 1) {
        /* dstage@u.washington.edu -- Delay only if hero sees it */
        if (((game.viz_array[y][x] & 2) != 0)) {
            statuename = sprintf(statuename, "%s%s", await shk_your(tmpbuf, statue), await xname(statue));
        } else {
            statuename = strcpy(statuename, "a statue");
        }
        await pline("Instead of shattering, %s suddenly %s!", statuename, comes_to_life);
    } else {
        set_msg_xy(x, y);
        await You("find %s posing as a statue.", (canseemon(mon) || sensemon(mon)) ? await a_monnam(mon) : c_common_strings.c_something);
        if (!(canseemon(mon) || sensemon(mon)) && ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await map_invisible(x, y);
        }
        await stop_occupation();
    }
    if (!game.context.mon_moving) {
        if (cause != 0 && await costly_spot(x, y) && (((statue).where == 3) ? statue.unpaid : !statue.no_charge) && (shkp = await shop_keeper(in_rooms(x, y, SHOPBASE))) != null && mon != shkp) {
            await stolen_value(statue, x, y, shkp.mpeaceful, (0));
        }
        if (historic) {
            await You_feel("guilty %s.", __animate_statue_historic_statue_is_gone);
            adjalign(-1);
        }
    } else {
        if (historic && ((game.viz_array[y][x] & 2) != 0)) {
            await You_feel("regret %s.", __animate_statue_historic_statue_is_gone);
        }
    }
    while ((item = statue.cobj) != null) {
        await obj_extract_self(item);
        await mpickobj(mon, item);
    }
    await m_dowear(mon, (1));
    if (statue.owornmask) {
        await remove_worn_item(statue, (1));
    }
    await delobj(statue);
    /* avoid hiding under nothing */
    if (((x) == game.u.ux && (y) == game.u.uy) && (game.u.umonnum != game.u.umonster) && (((game.youmonst.data).mflags1 & 128) != 0) && !(game.level.objects[x][y] != null)) {
        game.u.uundetected = 0;
    }
    if (fail_reason) {
        fail_reason.value = 0;
    }
    return mon;
}
/*
 * You've either stepped onto a statue trap's location or you've triggered a
 * statue trap by searching next to it or by trying to break it with a wand
 * or pick-axe.
 */
export async function activate_statue_trap(trap, x, y, shatter) {
    let mtmp = null;
    let otmp = sobj_at(STATUE, x, y);
    let fail_reason = 0;
    await deltrap(trap);
    while (otmp) {
        mtmp = await animate_statue(otmp, x, y, shatter ? 1 : 0, { get value() { return fail_reason; }, set value(_v) { fail_reason = _v; } });
        if (mtmp || fail_reason != 2) {
            break;
        }
        otmp = nxtobj(otmp, STATUE, (1));
    }
    await feel_newsym(x, y);
    return mtmp;
}
export async function keep_saddle_with_steedcorpse(steed_mid, objchn, saddle) {
    if (!saddle) {
        /*  chance per item of sustaining damage:
          *     max luck (Luck==13):    10%
          *     avg luck (Luck==0):     75%
          *     awful luck (Luck<-4):  100%
          */
        return (0);
    }
    while (objchn) {
        if (objchn.otyp == CORPSE && ((objchn).oextra && ((objchn).oextra.omonst))) {
            let mtmp = ((objchn).oextra.omonst);
            if (mtmp.m_id == steed_mid) {
                let x = 0;
                let y = 0;
                if (get_obj_location(objchn, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0)) {
                    await obj_extract_self(saddle);
                    await place_object(saddle, x, y);
                    await stackobj(saddle);
                }
                return (1);
            }
        }
        if (((objchn).cobj != null) && await keep_saddle_with_steedcorpse(steed_mid, objchn.cobj, saddle)) {
            return (1);
        }
        objchn = objchn.nobj;
    }
    return (0);
}
/* monster or you go through and possibly destroy a web.
   return TRUE if could go through. */
export async function mu_maybe_destroy_web(mtmp, domsg, trap) {
    let isyou = (mtmp == game.youmonst);
    let mptr = mtmp.data;
    if ((((mptr).mflags1 & 4) != 0) || ((mptr).mlet == S_VORTEX || (mptr) == game.mons[PM_AIR_ELEMENTAL]) || ((mptr) == game.mons[PM_FIRE_VORTEX] || (mptr) == game.mons[PM_FLAMING_SPHERE] || (mptr) == game.mons[PM_FIRE_ELEMENTAL] || (mptr) == game.mons[PM_SALAMANDER]) || (((mptr).mflags1 & 1048576) != 0) || mptr == game.mons[PM_GELATINOUS_CUBE]) {
        let x = trap.tx;
        let y = trap.ty;
        if (((mptr) == game.mons[PM_FIRE_VORTEX] || (mptr) == game.mons[PM_FLAMING_SPHERE] || (mptr) == game.mons[PM_FIRE_ELEMENTAL] || (mptr) == game.mons[PM_SALAMANDER]) || (((mptr).mflags1 & 134217728) != 0)) {
            if (domsg) {
                if (isyou) {
                    await You("%s %s spider web!", (((mptr) == game.mons[PM_FIRE_VORTEX] || (mptr) == game.mons[PM_FLAMING_SPHERE] || (mptr) == game.mons[PM_FIRE_ELEMENTAL] || (mptr) == game.mons[PM_SALAMANDER])) ? "burn" : "dissolve", a_your[trap.madeby_u]);
                } else {
                    await pline_mon(mtmp, "%s %s %s spider web!", await Monnam(mtmp), (((mptr) == game.mons[PM_FIRE_VORTEX] || (mptr) == game.mons[PM_FLAMING_SPHERE] || (mptr) == game.mons[PM_FIRE_ELEMENTAL] || (mptr) == game.mons[PM_SALAMANDER])) ? "burns" : "dissolves", a_your[trap.madeby_u]);
                }
            }
            await deltrap(trap);
            await newsym(x, y);
            return (1);
        }
        if (domsg) {
            if (isyou) {
                await You("flow through %s spider web.", a_your[trap.madeby_u]);
            } else {
                await pline_mon(mtmp, "%s flows through %s spider web.", await Monnam(mtmp), a_your[trap.madeby_u]);
                await seetrap(trap);
            }
        }
        return (1);
    }
    return (0);
}
/* make a single arrow/dart/rock for a trap to shoot or drop */
export async function t_missile(otyp, trap) {
    let otmp = await mksobj(otyp, (1), (0));
    otmp.quan = 1;
    otmp.owt = await weight(otmp);
    /* trap is one-shot; clear flag first in case
                         * chest kills you and ends up in bones file */
    otmp.otrapped = 0;
    otmp.ox = trap.tx , otmp.oy = trap.ty;
    return otmp;
}
export function set_utrap(tim, typ) {
    /* if we get here through reset_utrap(), the caller of that might
       have already set u.utrap to 0 so this check won't be sufficient
       in that situation; caller will need to set context.botl itself */
    if (!game.u.utrap ^ !tim) {
        game.disp.botl = (1);
    }
    game.u.utrap = tim;
    game.u.utraptype = tim ? typ : TT_NONE;
    /* maybe block Lev and/or Fly */
    /* set BFlying, also BLevitation if still trapped */
    float_vs_flight();
}
export async function reset_utrap(msg) {
    let was_Lev = (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) != 0);
    let was_Fly = (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) != 0);
    set_utrap(0, 0);
    if (msg) {
        if (!was_Lev && ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            await float_up();
        }
        if (!was_Fly && ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            await You("can fly.");
        }
    }
}
/* is trap type ttyp triggered by touching the floor? */
export function floor_trigger(ttyp) {
    switch (ttyp) {
        case ARROW_TRAP:
        case DART_TRAP:
        case ROCKTRAP:
        case SQKY_BOARD:
        case BEAR_TRAP:
        case LANDMINE:
        case ROLLING_BOULDER_TRAP:
        case SLP_GAS_TRAP:
        case RUST_TRAP:
        /* can always destroy items being carried */
        case FIRE_TRAP:
        case PIT:
        case SPIKED_PIT:
        case HOLE:
        case TRAPDOOR:
            return (1);
        default:
            return (0);
    }
}
/* return TRUE if monster mtmp is up in the air, considering trap flags */
export function check_in_air(mtmp, trflags) {
    let is_you = mtmp == game.youmonst;
    let plunged = (trflags & (16 | 32)) != 0;
    return ((trflags & 128) != 0 || (is_you ? ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) : ((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)) || ((is_you ? ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) : (((mtmp.data).mflags1 & 1) != 0)) && !plunged));
}
/* return TRUE if mtmp is wearing shoes made of iron (iron/kicking) */
export async function wearing_iron_shoes(mtmp) {
    let armf = await which_armor(mtmp, 32);
    return armf && game.objects[armf.otyp].oc_material == IRON;
}
/* is trap ttmp harmless to monster mtmp? */
export async function m_harmless_trap(mtmp, ttmp) {
    let mdat = mtmp.data;
    /* this handles most of the traps, but those are still included
       in the switch case below for completeness */
    if (!game.level.flags.sokoban_rules && floor_trigger(ttmp.ttyp) && check_in_air(mtmp, 0)) {
        return (1);
    }
    switch (ttmp.ttyp) {
        case ARROW_TRAP:
            break;
        case DART_TRAP:
            break;
        case ROCKTRAP:
            break;
        case SQKY_BOARD:
            break;
        case BEAR_TRAP:
            if (mdat.msize <= 1 || (((mdat).mflags1 & 4) != 0) || ((mdat).mlet == S_VORTEX || (mdat) == game.mons[PM_AIR_ELEMENTAL]) || (((mdat).mflags1 & 1048576) != 0)) {
                return (1);
            }
            break;
        case LANDMINE:
            break;
        case ROLLING_BOULDER_TRAP:
            break;
        case SLP_GAS_TRAP:
            if (await Resists_Elem(mtmp, SLEEP_RES) || await defended(mtmp, 4)) {
                return (1);
            }
            break;
        case RUST_TRAP:
            if (mdat != game.mons[PM_IRON_GOLEM]) {
                return (1);
            }
            break;
        case FIRE_TRAP:
            if (await Resists_Elem(mtmp, FIRE_RES) || await defended(mtmp, 2)) {
                return (1);
            }
            break;
        case PIT:
            ;
        case SPIKED_PIT:
            ;
        case HOLE:
            ;
        case TRAPDOOR:
            if ((((mdat).mflags1 & 16) != 0) && !game.level.flags.sokoban_rules) {
                return (1);
            }
            break;
        case TELEP_TRAP:
            break;
        case LEVEL_TELEP:
            break;
        case MAGIC_PORTAL:
            break;
        case WEB:
            if ((((mdat).mflags1 & 4) != 0) || ((mdat) == game.mons[PM_CAVE_SPIDER] || (mdat) == game.mons[PM_GIANT_SPIDER]) || ((mdat).mlet == S_VORTEX || (mdat) == game.mons[PM_AIR_ELEMENTAL]) || (((mdat).mflags1 & 1048576) != 0)) {
                return (1);
            }
            break;
        case STATUE_TRAP:
            return (1);
        case MAGIC_TRAP:
            return (1);
        case ANTI_MAGIC:
            if (resists_magm(mtmp) || await defended(mtmp, 1)) {
                return (1);
            }
            break;
        case POLY_TRAP:
            break;
        case VIBRATING_SQUARE:
            return (1);
        default:
            await impossible("m_harmless_trap: unknown trap %i", ttmp.ttyp);
            break;
    }
    return (0);
}
export async function trapeffect_arrow_trap(mtmp, trap, trflags) {
    let otmp = null;
    let dam = 0;
    if (mtmp == game.youmonst) {
        if (trap.once && trap.tseen && !rn2(15)) {
            ;
            await You_hear("a loud click!");
            await deltrap(trap);
            await newsym(game.u.ux, game.u.uy);
            return Trap_Is_Gone;
        }
        trap.once = 1;
        await seetrap(trap);
        await pline("An arrow shoots out at you!");
        otmp = await t_missile(ARROW, trap);
        dam = await dmgval(otmp, game.youmonst);
        if (game.u.usteed && !rn2(2) && await steedintrap(trap, otmp)) {
            ;
        } else if (await thitu(8, (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam)), { get value() { return otmp; }, set value(_v) { otmp = _v; } }, "arrow")) {
            if (otmp) {
                await obfree(otmp, null);
            }
        } else {
            await place_object(otmp, game.u.ux, game.u.uy);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await observe_object(otmp);
            }
            await stackobj(otmp);
            await newsym(game.u.ux, game.u.uy);
        }
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let see_it = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
        let trapkilled = (0);
        if (trap.once && trap.tseen && !rn2(15)) {
            if (in_sight && see_it) {
                await pline_mon(mtmp, "%s triggers a trap but nothing happens.", await Monnam(mtmp));
            }
            await deltrap(trap);
            await newsym(mtmp.mx, mtmp.my);
            return Trap_Is_Gone;
        }
        trap.once = 1;
        otmp = await t_missile(ARROW, trap);
        if (in_sight) {
            await seetrap(trap);
        }
        if (await thitm(8, mtmp, otmp, 0, (0))) {
            /* explosion might have destroyed a drawbridge; don't
           dish out more damage if monster is already dead */
            trapkilled = (1);
        }
        return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_dart_trap(mtmp, trap, trflags) {
    let otmp = null;
    let dam = 0;
    if (mtmp == game.youmonst) {
        let oldumort = game.u.umortality;
        if (trap.once && trap.tseen && !rn2(15)) {
            ;
            await You_hear("a soft click.");
            await deltrap(trap);
            await newsym(game.u.ux, game.u.uy);
            return Trap_Is_Gone;
        }
        trap.once = 1;
        await seetrap(trap);
        await pline("A little dart shoots out at you!");
        otmp = await t_missile(DART, trap);
        if (!rn2(6)) {
            otmp.otrapped = 1;
        }
        dam = await dmgval(otmp, game.youmonst);
        if (game.u.usteed && !rn2(2) && await steedintrap(trap, otmp)) {
            ;
        } else if (await thitu(7, (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam)), { get value() { return otmp; }, set value(_v) { otmp = _v; } }, "little dart")) {
            if (otmp) {
                if (otmp.otrapped) {
                    await poisoned("dart", A_CON, "little dart", (game.u.umortality > oldumort) ? 0 : 10, (1));
                }
                await obfree(otmp, null);
            }
        } else {
            await place_object(otmp, game.u.ux, game.u.uy);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await observe_object(otmp);
            }
            await stackobj(otmp);
            await newsym(game.u.ux, game.u.uy);
        }
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let see_it = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
        let trapkilled = (0);
        if (trap.once && trap.tseen && !rn2(15)) {
            if (in_sight && see_it) {
                await pline_mon(mtmp, "%s triggers a trap but nothing happens.", await Monnam(mtmp));
            }
            await deltrap(trap);
            await newsym(mtmp.mx, mtmp.my);
            return Trap_Is_Gone;
        }
        trap.once = 1;
        otmp = await t_missile(DART, trap);
        if (!rn2(6)) {
            otmp.otrapped = 1;
        }
        if (in_sight) {
            await seetrap(trap);
        }
        if (await thitm(7, mtmp, otmp, 0, (0))) {
            trapkilled = (1);
        }
        return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_rocktrap(mtmp, trap, trflags) {
    let otmp = null;
    let harmless = (0);
    if (mtmp == game.youmonst) {
        if (trap.once && trap.tseen && !rn2(15)) {
            await pline("A trap door in %s opens, but nothing falls out!", await the(ceiling(game.u.ux, game.u.uy)));
            await deltrap(trap);
            await newsym(game.u.ux, game.u.uy);
        } else {
            let dmg = d(2, 6);
            trap.once = 1;
            await feeltrap(trap);
            otmp = await t_missile(ROCK, trap);
            await place_object(otmp, game.u.ux, game.u.uy);
            await pline("A trap door in %s opens and %s falls on your %s!", await the(ceiling(game.u.ux, game.u.uy)), await an(await xname(otmp)), await body_part(HEAD));
            if (game.uarmh) {
                if (((((game.youmonst.data).mflags1 & 8) != 0) && !(((game.youmonst.data).mflags1 & 1048576) != 0))) {
                    await pline("Unfortunately, you are wearing %s.", await an(helm_simple_name(game.uarmh)));
                    dmg = 2;
                } else if (hard_helmet(game.uarmh)) {
                    await pline("Fortunately, you are wearing a hard helmet.");
                    dmg = 2;
                } else if (game.flags.verbose) {
                    await pline("%s does not protect you.", await Yname2(game.uarmh));
                }
            } else if (((((game.youmonst.data).mflags1 & 8) != 0) && !(((game.youmonst.data).mflags1 & 1048576) != 0))) {
                await pline("It passes harmlessly through you.");
                harmless = (1);
            }
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await observe_object(otmp);
            }
            await stackobj(otmp);
            await newsym(game.u.ux, game.u.uy);
            if (!harmless) {
                await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "falling rock", 0);
                await exercise(A_STR, (0));
            }
        }
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let see_it = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
        let trapkilled = (0);
        if (trap.once && trap.tseen && !rn2(15)) {
            if (in_sight && see_it) {
                await pline_mon(mtmp, "A trap door above %s opens, but nothing falls out!", await mon_nam(mtmp));
            }
            await deltrap(trap);
            await newsym(mtmp.mx, mtmp.my);
            return Trap_Is_Gone;
        }
        trap.once = 1;
        otmp = await t_missile(ROCK, trap);
        if (in_sight) {
            await seetrap(trap);
        }
        if (await thitm(0, mtmp, otmp, d(2, 6), (0))) {
            trapkilled = (1);
        }
        return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_sqky_board(mtmp, trap, trflags) {
    let tsnds = [se_squeak_C, se_squeak_D_flat, se_squeak_D, se_squeak_E_flat, se_squeak_E, se_squeak_F, se_squeak_F_sharp, se_squeak_G, se_squeak_G_sharp, se_squeak_A, se_squeak_B_flat, se_squeak_B];
    let forcetrap = ((trflags & 1) != 0 || (trflags & 64) != 0 || (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && (trflags & 32) != 0));
    if (mtmp == game.youmonst) {
        if ((((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) && !forcetrap) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await seetrap(trap);
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    await You("notice a crease in the linoleum.");
                } else {
                    await You("notice a loose board below you.");
                }
            }
        } else {
            await seetrap(trap);
            if (((trap.vl.v_tnote) >= 0 && (trap.vl.v_tnote) < (Math.trunc(12 /* sizeof(enum sound_effect_entries [12]) */ / 1 /* sizeof(enum sound_effect_entries) */)))) {
                ;
            }
            await pline("A board beneath you %s%s%s.", (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "vibrates" : "squeaks ", (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "" : trapnote(trap, (0)), (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "" : " loudly");
            await wake_nearby((0));
        }
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        if (m_in_air(mtmp)) {
            /* don't activate it after all */
            return Trap_Effect_Finished;
        }
        if (in_sight) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                /* stepped on a squeaky board */
                if (((trap.vl.v_tnote) >= 0 && (trap.vl.v_tnote) < (Math.trunc(12 /* sizeof(enum sound_effect_entries [12]) */ / 1 /* sizeof(enum sound_effect_entries) */)))) {
                    ;
                }
                await pline_mon(mtmp, "A board beneath %s squeaks %s loudly.", await mon_nam(mtmp), trapnote(trap, (0)));
                await seetrap(trap);
            } else if (!(((mtmp.data).mflags1 & 65536) != 0)) {
                await pline_mon(mtmp, "%s stops momentarily and appears to cringe.", await Monnam(mtmp));
            }
        } else {
            /* same near/far threshold as mzapmsg() */
            let range = ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) ? (8 + 1) : (8 - 3);
            if (((trap.vl.v_tnote) >= 0 && (trap.vl.v_tnote) < (Math.trunc(12 /* sizeof(enum sound_effect_entries [12]) */ / 1 /* sizeof(enum sound_effect_entries) */)))) {
                ;
            }
            await You_hear("%s squeak %s.", trapnote(trap, (0)), (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= range * range) ? "nearby" : "in the distance");
        }
        await wake_nearto(mtmp.mx, mtmp.my, 40);
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_bear_trap(mtmp, trap, trflags) {
    let is_you = mtmp == game.youmonst;
    let forcetrap = ((trflags & 1) != 0 || (trflags & 64) != 0 || (is_you && (trflags & 32) != 0));
    if (is_you) {
        let dmg = d(2, 4);
        if ((((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) && !forcetrap) {
            return Trap_Effect_Finished;
        }
        await feeltrap(trap);
        if ((((game.youmonst.data).mflags1 & 4) != 0) || ((game.youmonst.data).mlet == S_VORTEX || (game.youmonst.data) == game.mons[PM_AIR_ELEMENTAL]) || (((game.youmonst.data).mflags1 & 1048576) != 0)) {
            await pline("%s bear trap closes harmlessly through you.", A_Your[trap.madeby_u]);
            return Trap_Effect_Finished;
        }
        if (!game.u.usteed && game.youmonst.data.msize <= 1) {
            await pline("%s bear trap closes harmlessly over you.", A_Your[trap.madeby_u]);
            return Trap_Effect_Finished;
        }
        set_utrap((rn2(4) + (4)), TT_BEARTRAP);
        if (game.u.usteed) {
            await pline("%s bear trap closes on %s %s!", A_Your[trap.madeby_u], s_suffix(await mon_nam(game.u.usteed)), await mbodypart(game.u.usteed, FOOT));
            if (await thitm(0, game.u.usteed, null, dmg, (0))) {
                await reset_utrap((1));
            }
        } else {
            await pline("%s bear trap closes on your %s!", A_Your[trap.madeby_u], await body_part(FOOT));
            if (game.u.umonnum == PM_OWLBEAR || game.u.umonnum == PM_BUGBEAR) {
                await You("howl in anger!");
            }
            if (await wearing_iron_shoes(mtmp)) {
                await pline("%s protects your leg.", await Yname2(game.uarmf));
            } else {
                await set_wounded_legs(rn2(2) ? 262144 : 131072, (rn2(10) + (10)));
                await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "bear trap", 0);
            }
        }
        await exercise(A_DEX, (0));
    } else {
        let mptr = mtmp.data;
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let trapkilled = (0);
        if (mptr.msize > 1 && !(((mptr).mflags1 & 4) != 0) && !m_in_air(mtmp) && !((mptr).mlet == S_VORTEX || (mptr) == game.mons[PM_AIR_ELEMENTAL]) && !(((mptr).mflags1 & 1048576) != 0)) {
            mtmp.mtrapped = 1;
            if (in_sight) {
                await pline_mon(mtmp, "%s is caught in %s bear trap!", await Monnam(mtmp), a_your[trap.madeby_u]);
                await seetrap(trap);
            } else {
                if (mptr == game.mons[PM_OWLBEAR] || mptr == game.mons[PM_BUGBEAR]) {
                    ;
                    await You_hear("the roaring of an angry bear!");
                }
            }
        } else if (forcetrap) {
            if (in_sight) {
                await pline_mon(mtmp, "%s evades %s bear trap!", await Monnam(mtmp), a_your[trap.madeby_u]);
                await seetrap(trap);
            }
        }
        if (mtmp.mtrapped && !await wearing_iron_shoes(mtmp)) {
            trapkilled = await thitm(0, mtmp, null, d(2, 4), (0));
        }
        return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_slp_gas_trap(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        await seetrap(trap);
        if ((game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic) || (((game.youmonst.data).mflags1 & 1024) != 0)) {
            await You("are enveloped in a cloud of gas!");
            monstseesu(M_SEEN_SLEEP);
        } else {
            await pline("A cloud of gas puts you to sleep!");
            await fall_asleep(-rnd(25), (1));
            monstunseesu(M_SEEN_SLEEP);
        }
        await steedintrap(trap, null);
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        if (!await Resists_Elem(mtmp, SLEEP_RES) && !(((mtmp.data).mflags1 & 1024) != 0) && !((mtmp).msleeping || !(mtmp).mcanmove)) {
            if (await sleep_monst(mtmp, rnd(25), -1) && in_sight) {
                await pline_mon(mtmp, "%s suddenly falls asleep!", await Monnam(mtmp));
                await seetrap(trap);
            }
        }
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_rust_trap(mtmp, trap, trflags) {
    let otmp = null;
    let nextobj = null;
    if (mtmp == game.youmonst) {
        await seetrap(trap);
        switch (rn2(5)) {
            case 0:
                await pline("%s you on the %s!", A_gush_of_water_hits, await body_part(HEAD));
                await water_damage(game.uarmh, helm_simple_name(game.uarmh), (1));
                break;
            case 1:
                await pline("%s your left %s!", A_gush_of_water_hits, await body_part(ARM));
                if (await water_damage(game.uarms, "shield", (1)) != 0) {
                    /* set tknown and return False */
                    break;
                }
                if (game.u.twoweap || (game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big))) {
                    await water_damage(game.u.twoweap ? game.uswapwep : game.uwep, null, (1));
                }
                await water_damage(game.uarmg, gloves_simple_name(game.uarmg), (1));
                break;
            case 2:
                await pline("%s your right %s!", A_gush_of_water_hits, await body_part(ARM));
                await water_damage(game.uwep, null, (1));
                await water_damage(game.uarmg, gloves_simple_name(game.uarmg), (1));
                break;
            default:
                await pline("%s you!", A_gush_of_water_hits);
                for (otmp = game.invent; otmp; otmp = nextobj) {
                    /* note: exclude primary and secondary weapons from splashing
               because cases 1 and 2 target them [via water_damage()] */
                    nextobj = otmp.nobj;
                    if (otmp.lamplit && otmp != game.uwep && (otmp != game.uswapwep || !game.u.twoweap)) {
                        await splash_lit(otmp);
                    }
                }
                if (game.uarmc) {
                    await water_damage(game.uarmc, cloak_simple_name(game.uarmc), (1));
                } else if (game.uarm) {
                    await water_damage(game.uarm, suit_simple_name(game.uarm), (1));
                } else if (game.uarmu) {
                    await water_damage(game.uarmu, "shirt", (1));
                }
        }
        update_inventory();
        if (game.u.umonnum == PM_IRON_GOLEM) {
            let dam = game.u.mhmax;
            await You("are covered with rust!");
            await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam)), "rusting away", 1);
        } else if (game.u.umonnum == PM_GREMLIN && rn2(3)) {
            await split_mon(game.youmonst, null);
        }
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let trapkilled = (0);
        let mptr = mtmp.data;
        let target = null;
        if (in_sight) {
            await seetrap(trap);
        }
        switch (rn2(5)) {
            case 0:
                if (in_sight) {
                    await pline_mon(mtmp, "%s %s on the %s!", A_gush_of_water_hits, await mon_nam(mtmp), await mbodypart(mtmp, HEAD));
                }
                target = await which_armor(mtmp, 4);
                await water_damage(target, helm_simple_name(target), (1));
                break;
            case 1:
                if (in_sight) {
                    await pline_mon(mtmp, "%s %s's left %s!", A_gush_of_water_hits, await mon_nam(mtmp), await mbodypart(mtmp, ARM));
                }
                target = await which_armor(mtmp, 8);
                if (await water_damage(target, "shield", (1)) != 0) {
                    break;
                }
                target = ((mtmp).mw);
                if (target && ((target.oclass == WEAPON_CLASS || target.oclass == TOOL_CLASS) && game.objects[target.otyp].oc_big)) {
                    await water_damage(target, null, (1));
                }
                target = await which_armor(mtmp, 16);
                await water_damage(target, gloves_simple_name(target), (1));
                break;
            case 2:
                if (in_sight) {
                    await pline_mon(mtmp, "%s %s's right %s!", A_gush_of_water_hits, await mon_nam(mtmp), await mbodypart(mtmp, ARM));
                }
                await water_damage(((mtmp).mw), null, (1));
                target = await which_armor(mtmp, 16);
                await water_damage(target, gloves_simple_name(target), (1));
                break;
            default:
                if (in_sight) {
                    await pline("%s %s!", A_gush_of_water_hits, await mon_nam(mtmp));
                }
                /* monster without its inventory isn't too heavy; if it carries
       anything, include that minvent weight and check again */
                for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
                    if (otmp.lamplit && (otmp.owornmask & (256 | 1024)) == 0) {
                        await splash_lit(otmp);
                    }
                }
                if ((target = await which_armor(mtmp, 2)) != null) {
                    await water_damage(target, cloak_simple_name(target), (1));
                } else if ((target = await which_armor(mtmp, 1)) != null) {
                    await water_damage(target, suit_simple_name(target), (1));
                } else if ((target = await which_armor(mtmp, 64)) != null) {
                    await water_damage(target, "shirt", (1));
                }
        }
        if (((mptr) == game.mons[PM_IRON_GOLEM])) {
            if (in_sight) {
                await pline_mon(mtmp, "%s %s to pieces!", await Monnam(mtmp), !await mlifesaver(mtmp) ? "falls" : "starts to fall");
            }
            await monkilled(mtmp, null, 24);
            if (((mtmp).mhp < 1)) {
                trapkilled = (1);
            }
        } else if (mptr == game.mons[PM_GREMLIN] && rn2(3)) {
            await split_mon(mtmp, null);
        }
        return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_fire_trap(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        await seetrap(trap);
        await dofiretrap(null);
    } else {
        let tx = trap.tx;
        let ty = trap.ty;
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let see_it = ((game.viz_array[ty][tx] & 2) != 0);
        let trapkilled = (0);
        let mptr = mtmp.data;
        let orig_dmg = d(2, 4);
        if (in_sight) {
            await pline_mon(mtmp, "A %s erupts from the %s under %s!", tower_of_flame, surface(mtmp.mx, mtmp.my), await mon_nam(mtmp));
        } else if (see_it) {
            /* evidently `mtmp' is invisible */
            set_msg_xy(mtmp.mx, mtmp.my);
            await You_see("a %s erupt from the %s!", tower_of_flame, surface(mtmp.mx, mtmp.my));
        }
        if (await Resists_Elem(mtmp, FIRE_RES)) {
            if (in_sight) {
                await shieldeff(mtmp.mx, mtmp.my);
                await pline("%s is uninjured.", await Monnam(mtmp));
            }
        } else {
            let num = orig_dmg;
            let alt = 0;
            let immolate = (0);
            switch (((mptr).pmidx)) {
                /* paper burns very fast, assume straw is tightly packed
               and burns a bit slower
               (note: this is inconsistent with mattackm()'s AD_FIRE
               damage where completelyburns() includes straw golem) */
                case PM_PAPER_GOLEM:
                    immolate = (1);
                    alt = mtmp.mhpmax;
                    break;
                case PM_STRAW_GOLEM:
                    alt = Math.trunc(mtmp.mhpmax / 2);
                    break;
                case PM_WOOD_GOLEM:
                    alt = Math.trunc(mtmp.mhpmax / 4);
                    break;
                case PM_LEATHER_GOLEM:
                    alt = Math.trunc(mtmp.mhpmax / 8);
                    break;
                default:
                    alt = 0;
                    break;
            }
            if (alt > num) {
                num = alt;
            }
            if (await thitm(0, mtmp, null, num, immolate)) {
                trapkilled = (1);
            } else {
                mtmp.mhpmax -= rn2(num + 1);
                if (mtmp.mhp > mtmp.mhpmax) {
                    mtmp.mhp = mtmp.mhpmax;
                }
            }
        }
        if (await burnarmor(mtmp) || rn2(3)) {
            let xtradmg = await destroy_items(mtmp, 2, orig_dmg);
            await ignite_items(mtmp.minvent);
            if (!((mtmp).mhp < 1)) {
                mtmp.mhp -= xtradmg;
                if (((mtmp).mhp < 1)) {
                    await monkilled(mtmp, "", 2);
                    trapkilled = (1);
                }
            }
        }
        if (await burn_floor_objects(tx, ty, see_it, (0)) && !see_it && dist2((tx), (ty), game.u.ux, game.u.uy) <= 3 * 3) {
            await You("smell smoke.");
        }
        if (is_ice(tx, ty)) {
            await melt_ice(tx, ty, null);
        }
        if (((mtmp).mhp < 1)) {
            trapkilled = (1);
        }
        if (see_it && t_at(tx, ty)) {
            await seetrap(t_at(tx, ty));
        }
        return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_pit(mtmp, trap, trflags) {
    let ttype = trap.ttyp;
    /* relevant_spikes is initially always true for spiked pits, but
       set to false if the spikes are found to not be relevant */
    let relevant_spikes = ttype == SPIKED_PIT;
    if (mtmp == game.youmonst) {
        let plunged = (trflags & 16) != 0;
        let viasitting = (trflags & 32) != 0;
        let conj_pit = conjoined_pits(trap, t_at(game.u.ux0, game.u.uy0), (1));
        let adj_pit = adj_nonconjoined_pit(trap);
        let already_known = trap.tseen ? (1) : (0);
        let deliberate = (0);
        let steed_article = 1;
        /* suppress article in various steed messages when using its
           name (which won't occur when hallucinating) */
        if (game.u.usteed && ((game.u.usteed).mextra && ((game.u.usteed).mextra.mgivenname)) && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            steed_article = 0;
        }
        if (!game.level.flags.sokoban_rules && (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && !plunged && !viasitting))) {
            return Trap_Effect_Finished;
        }
        await feeltrap(trap);
        if (!game.level.flags.sokoban_rules && (((game.youmonst.data).mflags1 & 16) != 0) && !plunged) {
            if (already_known) {
                await You_see("%s %spit below you.", a_your[trap.madeby_u], ttype == SPIKED_PIT ? "spiked " : "");
            } else {
                await pline("%s pit %sopens up under you!", A_Your[trap.madeby_u], ttype == SPIKED_PIT ? "full of spikes " : "");
                await You("don't fall in!");
            }
            return Trap_Effect_Finished;
        }
        if (!game.level.flags.sokoban_rules) {
            let verbbuf = '';
            verbbuf = '';
            if (game.u.usteed) {
                if ((trflags & 8) != 0) {
                    verbbuf = sprintf(verbbuf, "and %s fall", await x_monnam(game.u.usteed, steed_article, null, 8, (0)));
                } else {
                    verbbuf = sprintf(verbbuf, "lead %s", await x_monnam(game.u.usteed, steed_article, "poor", 8, (0)));
                }
            } else if (game.iflags.menu_requested && already_known) {
                await You("carefully %s into the pit.", u_locomotion("lower yourself"));
                deliberate = (1);
            } else if (conj_pit) {
                await You("move into an adjacent pit.");
            } else if (adj_pit) {
                await You("stumble over debris%s.", !rn2(5) ? " between the pits" : "");
            } else {
                verbbuf = strcpy(verbbuf, !plunged ? "fall" : (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) ? "dive" : "plunge"));
            }
            if (verbbuf) {
                await You("%s into %s pit!", verbbuf, a_your[trap.madeby_u]);
            }
        }
        if ((game.urole.mnum == (PM_RANGER)) && !trap.madeby_u && !trap.once && In_quest(game.u.uz) && (((((game.dungeon_topology.d_qlocate_level)).dlevel || ((game.dungeon_topology.d_qlocate_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qlocate_level))))) {
            await pline("Fortunately it has a bottom after all...");
            trap.once = 1;
        } else if (game.u.umonnum == PM_PIT_VIPER || game.u.umonnum == PM_PIT_FIEND) {
            await pline("How pitiful.  Isn't that the pits?");
        }
        if (relevant_spikes && await wearing_iron_shoes(mtmp)) {
            await pline("%s protects you from the sharp iron spikes.", await Yname2(game.uarmf));
            relevant_spikes = (0);
        } else if (relevant_spikes) {
            let predicament = "on a set of sharp iron spikes";
            if (game.u.usteed) {
                await pline("%s %s %s!", upstart(await x_monnam(game.u.usteed, steed_article, "poor", 8, (0))), conj_pit ? "steps" : "lands", predicament);
            } else {
                await You("%s %s!", conj_pit ? "step" : "land", predicament);
            }
        }
        /* FIXME:
         * if hero gets killed here, setting u.utrap in advance will
         * show "you were trapped in a pit" during disclosure's display
         * of enlightenment, but hero is dying *before* becoming trapped.
         */
        set_utrap((rn2(6) + (2)), TT_PIT);
        if (!await steedintrap(trap, null)) {
            if (relevant_spikes) {
                let oldumort = game.u.umortality;
                await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(conj_pit ? 4 : adj_pit ? 6 : 10)) + 1) / 2)) : (rnd(conj_pit ? 4 : adj_pit ? 6 : 10))), plunged ? "deliberately plunged into a pit of iron spikes" : (conj_pit || deliberate) ? "stepped into a pit of iron spikes" : adj_pit ? "stumbled into a pit of iron spikes" : "fell into a pit of iron spikes", 2);
                if (!rn2(6)) {
                    await poisoned("spikes", A_STR, (conj_pit || adj_pit || deliberate) ? "stepping on poison spikes" : "fall onto poison spikes", (game.u.umortality > oldumort) ? 0 : 8, (0));
                }
            } else {
                /* plunging flyers take spike damage but not pit damage */
                if (!conj_pit && !deliberate && !(plunged && (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || (((game.youmonst.data).mflags1 & 16) != 0)))) {
                    await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(adj_pit ? 3 : 6)) + 1) / 2)) : (rnd(adj_pit ? 3 : 6))), plunged ? "deliberately plunged into a pit" : "fell into a pit", 2);
                }
            }
            if ((game.uball != null) && !((game.uball).where == 3)) {
                await unplacebc();
                await ballfall();
                await placebc();
            }
            if (!conj_pit) {
                await selftouch("Falling, you");
            }
            /* might float up if Levitation is being unblocked */
            /* vision limits can change (pit escape) */
            game.vision_full_recalc = 1;
            await exercise(A_STR, (0));
            await exercise(A_DEX, (0));
        }
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let trapkilled = (0);
        let forcetrap = ((trflags & 1) != 0);
        let inescapable = (forcetrap || (game.level.flags.sokoban_rules && !trap.madeby_u));
        let mptr = mtmp.data;
        let fallverb = null;
        fallverb = "falls";
        if (!(!(((mptr).mflags1 & 1) != 0) && !((mptr).mlet == S_EYE || (mptr).mlet == S_LIGHT) && (!(((mptr).mflags1 & 16) != 0) || !has_ceiling(game.u.uz))) || (mtmp.wormno && count_wsegs(mtmp) > 5)) {
            if (forcetrap && !game.level.flags.sokoban_rules) {
                if (in_sight) {
                    await seetrap(trap);
                    await pline_mon(mtmp, "%s doesn't fall into the pit.", await Monnam(mtmp));
                }
                /* true when called from dotrap, inescapable is not an option */
                /* nothing here, the trap effects will handle messaging */
                return Trap_Effect_Finished;
            }
            if (!inescapable) {
                return Trap_Effect_Finished;
            }
            fallverb = "is dragged";
        }
        if (!(((mptr).mflags1 & 8) != 0)) {
            mtmp.mtrapped = 1;
        }
        if (in_sight) {
            await pline_mon(mtmp, "%s %s into %s pit!", await Monnam(mtmp), fallverb, a_your[trap.madeby_u]);
            if (mptr == game.mons[PM_PIT_VIPER] || mptr == game.mons[PM_PIT_FIEND]) {
                await pline("How pitiful.  Isn't that the pits?");
            }
            await seetrap(trap);
        }
        await mselftouch(mtmp, "Falling, ", (0));
        if (await wearing_iron_shoes(mtmp)) {
            relevant_spikes = (0);
        }
        if (((mtmp).mhp < 1) || await thitm(0, mtmp, null, rnd(relevant_spikes ? 10 : 6), (0))) {
            trapkilled = (1);
        }
        return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_hole(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        if (!Can_fall_thru(game.u.uz)) {
            await seetrap(trap);
            await impossible("dotrap: %ss cannot exist on this level.", trapname(trap.ttyp, (1)));
            return Trap_Effect_Finished;
        }
        await fall_through((1), (trflags & 16));
    } else {
        let tt = trap.ttyp;
        let mptr = mtmp.data;
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let forcetrap = ((trflags & 1) != 0);
        let inescapable = (forcetrap || (game.level.flags.sokoban_rules && !trap.madeby_u));
        if (!Can_fall_thru(game.u.uz)) {
            await impossible("mintrap: %ss cannot exist on this level.", trapname(tt, (1)));
            return Trap_Effect_Finished;
        }
        if (!(!(((mptr).mflags1 & 1) != 0) && !((mptr).mlet == S_EYE || (mptr).mlet == S_LIGHT) && (!(((mptr).mflags1 & 16) != 0) || !has_ceiling(game.u.uz))) || (mtmp.wormno && count_wsegs(mtmp) > 5) || mptr.msize >= 4) {
            if (forcetrap && !game.level.flags.sokoban_rules) {
                if (in_sight) {
                    await seetrap(trap);
                    if (tt == TRAPDOOR) {
                        await pline_mon(mtmp, "A trap door opens, but %s doesn't fall through.", await mon_nam(mtmp));
                    } else {
                        await pline_mon(mtmp, "%s doesn't fall through the hole.", await Monnam(mtmp));
                    }
                }
                return Trap_Effect_Finished;
            }
            if (inescapable) {
                if (in_sight) {
                    await pline_mon(mtmp, "%s seems to be yanked down!", await Monnam(mtmp));
                    await seetrap(trap);
                }
            } else {
                return Trap_Effect_Finished;
            }
        }
        return await trapeffect_level_telep(mtmp, trap, trflags);
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_telep_trap(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        await seetrap(trap);
        await tele_trap(trap);
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        await mtele_trap(mtmp, trap, in_sight);
        return Trap_Moved_Mon;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_level_telep(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        await seetrap(trap);
        await level_tele_trap(trap, trflags);
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let forcetrap = ((trflags & 1) != 0);
        return await mlevel_tele_trap(mtmp, trap, forcetrap, in_sight);
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_web(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        let webmsgok = (trflags & 2) == 0;
        let forcetrap = ((trflags & 1) != 0 || (trflags & 64) != 0);
        let viasitting = (trflags & 32) != 0;
        let steed_article = 1;
        if (game.u.usteed && ((game.u.usteed).mextra && ((game.u.usteed).mextra.mgivenname)) && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            steed_article = 0;
        }
        await feeltrap(trap);
        if (await mu_maybe_destroy_web(game.youmonst, webmsgok, trap)) {
            return Trap_Effect_Finished;
        }
        if (((game.youmonst.data) == game.mons[PM_CAVE_SPIDER] || (game.youmonst.data) == game.mons[PM_GIANT_SPIDER])) {
            if (webmsgok) {
                await pline(trap.madeby_u ? "You take a walk on your web." : "There is a spider web here.");
            }
            return Trap_Effect_Finished;
        }
        if (webmsgok) {
            let verbbuf = '';
            if (forcetrap || viasitting) {
                verbbuf = strcpy(verbbuf, "are caught by");
            } else if (game.u.usteed) {
                verbbuf = sprintf(verbbuf, "lead %s into", await x_monnam(game.u.usteed, steed_article, "poor", 8, (0)));
            } else {
                verbbuf = sprintf(verbbuf, "%s into", u_locomotion("stumble"));
            }
            await You("%s %s spider web!", verbbuf, a_your[trap.madeby_u]);
        }
        /* time will be adjusted below */
        set_utrap(1, TT_WEB);
{
            let tim = 0;
            let str = (acurr(A_STR));
            if (game.u.usteed && webmsgok) {
                /* Time stuck in the web depends on your/steed's strength. */
                /* If mounted, the steed gets trapped.  Use mintrap
             * to do all the work.  If mtrapped is set as a result,
             * unset it and set utrap instead.  In the case of a
             * strongmonst and mintrap said it's trapped, use a
             * short but non-zero trap time.  Otherwise, monsters
             * have no specific strength, so use player strength.
             * This gets skipped for webmsgok, which implies that
             * the steed isn't a factor.
             */
                /* mtmp location might not be up to date */
                game.u.usteed.mx = game.u.ux;
                game.u.usteed.my = game.u.uy;
                if (await mintrap(game.u.usteed, trflags) != Trap_Effect_Finished) {
                    /* mintrap currently does not return Trap_Killed_Mon
                   (mon died) for webs */
                    game.u.usteed.mtrapped = 0;
                    if ((((game.u.usteed.data).mflags2 & 67108864) != 0)) {
                        str = 17;
                    }
                } else {
                    await reset_utrap((0));
                    return Trap_Effect_Finished;
                }
                /* mintrap printed the messages */
                webmsgok = (0);
            }
            if (str <= 3) {
                tim = (rn2(6) + (6));
            } else if (str < 6) {
                tim = (rn2(6) + (4));
            } else if (str < 9) {
                tim = (rn2(4) + (4));
            } else if (str < 12) {
                tim = (rn2(4) + (2));
            } else if (str < 15) {
                tim = (rn2(2) + (2));
            } else if (str < 18) {
                tim = rnd(2);
            } else if (str < 69) {
                tim = 1;
            } else {
                tim = 0;
                if (webmsgok) {
                    await You("tear through %s web!", a_your[trap.madeby_u]);
                }
                await deltrap(trap);
                await newsym(game.u.ux, game.u.uy);
            }
            set_utrap(tim, TT_WEB);
        }
    } else {
        let tear_web = 0;
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let forcetrap = ((trflags & 1) != 0);
        let mptr = mtmp.data;
        if (((mptr) == game.mons[PM_CAVE_SPIDER] || (mptr) == game.mons[PM_GIANT_SPIDER])) {
            return Trap_Effect_Finished;
        }
        if (await mu_maybe_destroy_web(mtmp, in_sight, trap)) {
            return Trap_Effect_Finished;
        }
        tear_web = (0);
        switch (((mptr).pmidx)) {
            case PM_OWLBEAR:
            case PM_BUGBEAR:
                if (!in_sight) {
                    ;
                    await You_hear("the roaring of a confused bear!");
                    mtmp.mtrapped = 1;
                    break;
                }
                ;
            default:
                if (mptr.mlet == S_GIANT || (mptr.mlet == S_DRAGON && (((mptr).mflags2 & 33554432) != 0)) || (mtmp.wormno && count_wsegs(mtmp) > 5)) {
                    /* exclude baby dragons and relatively short worms */
                    tear_web = (1);
                } else if (in_sight) {
                    await pline_mon(mtmp, "%s is caught in %s spider web.", await Monnam(mtmp), a_your[trap.madeby_u]);
                    await seetrap(trap);
                }
                mtmp.mtrapped = tear_web ? 0 : 1;
                break;
            /* this list is fairly arbitrary; it deliberately
               excludes wumpus & giant/ettin zombies/mummies */
            case PM_TITANOTHERE:
            case PM_BALUCHITHERIUM:
            case PM_PURPLE_WORM:
            case PM_JABBERWOCK:
            case PM_IRON_GOLEM:
            case PM_BALROG:
            case PM_KRAKEN:
            case PM_MASTODON:
            case PM_ORION:
            case PM_NORN:
            case PM_CYCLOPS:
            case PM_LORD_SURTUR:
                tear_web = (1);
                break;
        }
        if (tear_web) {
            if (in_sight) {
                await pline_mon(mtmp, "%s tears through %s spider web!", await Monnam(mtmp), a_your[trap.madeby_u]);
            }
            await deltrap(trap);
            await newsym(mtmp.mx, mtmp.my);
        } else if (forcetrap && !mtmp.mtrapped) {
            if (in_sight) {
                await pline_mon(mtmp, "%s avoids %s spider web!", await Monnam(mtmp), a_your[trap.madeby_u]);
                await seetrap(trap);
            }
        }
        return mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_statue_trap(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        await activate_statue_trap(trap, game.u.ux, game.u.uy, (0));
    } else { /* monsters don't trigger statue traps */ }
    return Trap_Effect_Finished;
}
export async function trapeffect_magic_trap(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        await seetrap(trap);
        if (!rn2(30)) {
            await deltrap(trap);
            await newsym(game.u.ux, game.u.uy);
            await You("are caught in a magical explosion!");
            await losehp(rnd(10), "magical explosion", 0);
            await Your("body absorbs some of the magical energy!");
            game.u.uen = (game.u.uenmax += 2);
            if (game.u.uenmax > game.u.uenpeak) {
                game.u.uenpeak = game.u.uenmax;
            }
            return Trap_Effect_Finished;
        } else {
            await domagictrap();
        }
        await steedintrap(trap, null);
    } else {
        if (!rn2(21)) {
            return await trapeffect_fire_trap(mtmp, trap, trflags);
        }
    }
    return Trap_Effect_Finished;
}
/* monster, possibly youmonst */
/* trap->ttyp == ANTI_MAGIC */
export async function trapeffect_anti_magic(mtmp, trap, trflags) {
    if (await wearing_iron_shoes(mtmp)) {
        let shoes = await which_armor(mtmp, 32);
        if (shoes.spe > 0) {
            if (mtmp == game.youmonst) {
                await seetrap(trap);
                await pline("A lethargic aura surrounds %s.", await yname(shoes));
                await costly_alteration(shoes, COST_DECHNT);
            }
            shoes.spe -= 1;
            update_inventory();
            return Trap_Effect_Finished;
        }
    }
    if (mtmp == game.youmonst) {
        let drain = 0;
        let halfd = 0;
        let exclaim_it = (0);
        await seetrap(trap);
        if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
            let otmp = null;
            let dmgval2 = rnd(4);
            let hp = (game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp;
            /* Half_XXX_damage has opposite its usual effect (approx)
               but isn't cumulative if hero has more than one */
            if ((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic) || (game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
                dmgval2 += rnd(4);
            }
            /* give Magicbane wielder dose of own medicine */
            if (is_art(game.uwep, ART_MAGICBANE)) {
                dmgval2 += rnd(4);
            }
            /* having an artifact--other than own quest one--which
               confers magic resistance simply by being carried
               also increases the effect */
            for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                if (otmp.oartifact && !is_quest_artifact(otmp) && defends_when_carried(1, otmp)) {
                    break;
                }
            }
            if (otmp) {
                dmgval2 += rnd(4);
            }
            if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
                dmgval2 = Math.trunc((dmgval2 + 3) / 4);
            }
            await You_feel((dmgval2 >= hp) ? "unbearably torpid!" : (dmgval2 >= Math.trunc(hp / 4)) ? "very lethargic." : "sluggish.");
            await losehp(dmgval2, "anti-magic implosion", 0);
        }
        /* if the drain amount is more than hero's maximum energy then up
           to half of the amount comes directly out of maximum, the rest
           comes out of current energy; drain_en() lowers the current
           amount and when doing so it will take even more from maximum
           if the new current value would drop below zero */
        drain = d(2, 6);
        halfd = rnd(Math.trunc(drain / 2));
        if (game.u.uenmax > drain) {
            /* note: since 'halfd' is no more than half, 'drain -= halfd'
               is at least as big, so drain_en() is never asked to remove
               less from current than what we're removing from maximum;
               however, it might do that anyway (via its throttle check) so
               it needs to make sure uen doesn't end up exceeding uenmax */
            /* drain_en() will set context.botl */
            game.u.uenmax -= halfd;
            drain -= halfd;
            exclaim_it = (1);
        }
        await drain_en(drain, exclaim_it);
    } else {
        let trapkilled = (0);
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let see_it = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
        let mptr = mtmp.data;
        if (!resists_magm(mtmp)) {
            if (!mtmp.mcan && (attacktype(mptr, 255) || attacktype(mptr, 12))) {
                /* similar to hero's case, more or less */
                mtmp.mspec_used += d(2, 6);
                if (in_sight) {
                    await seetrap(trap);
                    await pline_mon(mtmp, "%s seems lethargic.", await Monnam(mtmp));
                }
            }
        } else {
            let otmp = null;
            let dmgval2 = rnd(4);
            if ((otmp = ((mtmp).mw)) != null && is_art(otmp, ART_MAGICBANE)) {
                dmgval2 += rnd(4);
            }
            for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
                if (otmp.oartifact && defends_when_carried(1, otmp)) {
                    break;
                }
            }
            if (otmp) {
                dmgval2 += rnd(4);
            }
            if ((((mptr).mflags1 & 8) != 0)) {
                dmgval2 = Math.trunc((dmgval2 + 3) / 4);
            }
            if (in_sight) {
                await seetrap(trap);
            }
            mtmp.mhp -= dmgval2;
            if (((mtmp).mhp < 1)) {
                await monkilled(mtmp, in_sight ? "compression from an anti-magic field" : null, -1);
            }
            if (((mtmp).mhp < 1)) {
                trapkilled = (1);
            }
            if (see_it) {
                await newsym(trap.tx, trap.ty);
            }
        }
        return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_poly_trap(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        let viasitting = (trflags & 32) != 0;
        let steed_article = 1;
        let verbbuf = '';
        if (game.u.usteed && ((game.u.usteed).mextra && ((game.u.usteed).mextra.mgivenname)) && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            steed_article = 0;
        }
        await seetrap(trap);
        if (viasitting) {
            verbbuf = strcpy(verbbuf, "trigger");
        } else if (game.u.usteed) {
            verbbuf = sprintf(verbbuf, "lead %s onto", await x_monnam(game.u.usteed, steed_article, null, 8, (0)));
        } else {
            verbbuf = sprintf(verbbuf, "%s onto", u_locomotion("step"));
        }
        await You("%s a polymorph trap!", verbbuf);
        if (await wearing_iron_shoes(mtmp)) {
            await deltrap(trap);
            await pline("%s warps strangely.", await Yname2(game.uarmf));
            await poly_obj(game.uarmf, game.uarmf.otyp == IRON_SHOES ? KICKING_BOOTS : IRON_SHOES);
            update_inventory();
            if (game.uarmf) {
                await prinv(null, game.uarmf, 0);
            }
        } else if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) || (game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
            await shieldeff(game.u.ux, game.u.uy);
            await You_feel("momentarily different.");
        } else {
            await steedintrap(trap, null);
            await deltrap(trap);
            await newsym(game.u.ux, game.u.uy);
            await You_feel("a change coming over you.");
            await polyself(POLY_NOFLAGS);
        }
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        if (await wearing_iron_shoes(mtmp)) {
            let shoes = await which_armor(mtmp, 32);
            await extract_from_minvent(mtmp, shoes, (1), (1));
            if (await mpickobj(mtmp, shoes)) {
                await impossible("re-equipping iron shoes destroyed them?");
                return Trap_Effect_Finished;
            }
            shoes = await poly_obj(shoes, shoes.otyp == IRON_SHOES ? KICKING_BOOTS : IRON_SHOES);
            if (shoes) {
                mtmp.misc_worn_check |= 32;
                shoes.owornmask = 32;
                await update_mon_extrinsics(mtmp, shoes, (1), (1));
            }
        } else if (resists_magm(mtmp)) {
            await shieldeff_mon(mtmp);
        } else if (!await resist(mtmp, WAND_CLASS, 0, 0)) {
            await newcham(mtmp, null, 1);
            if (in_sight) {
                await seetrap(trap);
            }
        }
    }
    return Trap_Effect_Finished;
}
let __trapeffect_landmine_recursive_mine = (0);
__nh_register_static(() => { __trapeffect_landmine_recursive_mine = (0); });
export async function trapeffect_landmine(mtmp, trap, trflags) {
    let damage = rnd(16);
    if (await wearing_iron_shoes(mtmp)) {
        damage = Math.trunc((damage + 3) / 4);
    }
    if (mtmp == game.youmonst) {
        let already_seen = trap.tseen;
        let forcetrap = ((trflags & 1) != 0 || (trflags & 64) != 0);
        let forcebungle = (trflags & 4) != 0;
        let steed_mid = 0;
        let saddle = null;
        if ((((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) && !forcetrap) {
            if (!already_seen && rn2(3)) {
                return Trap_Effect_Finished;
            }
            await feeltrap(trap);
            await pline("%s %s in a pile of soil below you.", already_seen ? "There is" : "You discover", trap.madeby_u ? "the trigger of your mine" : "a trigger");
            if (already_seen && rn2(3)) {
                return Trap_Effect_Finished;
            }
            ;
            await pline("KAABLAMM!!!  %s %s%s off!", forcebungle ? "Your inept attempt sets" : "The air currents set", already_seen ? a_your[trap.madeby_u] : "", already_seen ? " land mine" : "it");
        } else {
            /* prevent landmine from killing steed, throwing you to
             * the ground, and then that same landmine affecting you
             * again because it hasn't been deleted yet
             */
            if (__trapeffect_landmine_recursive_mine) {
                return Trap_Effect_Finished;
            }
            await feeltrap(trap);
            await pline("KAABLAMM!!!  You triggered %s land mine!", a_your[trap.madeby_u]);
            if (game.u.usteed) {
                steed_mid = game.u.usteed.m_id;
            }
            __trapeffect_landmine_recursive_mine = (1);
            await steedintrap(trap, null);
            __trapeffect_landmine_recursive_mine = (0);
            saddle = sobj_at(SADDLE, game.u.ux, game.u.uy);
            await set_wounded_legs(131072, (rn2(35) + (41)));
            await set_wounded_legs(262144, (rn2(35) + (41)));
            await exercise(A_DEX, (0));
        }
        /* add a pit before calling losehp so bones won't keep the landmine;
           blow_up_landmine() will remove pit afterwards if inappropriate */
        trap.ttyp = PIT;
        trap.madeby_u = (0);
        await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((damage) + 1) / 2)) : (damage)), "land mine", 0);
        await blow_up_landmine(trap);
        if (steed_mid && saddle && !game.u.usteed) {
            await keep_saddle_with_steedcorpse(steed_mid, game.level.objlist, saddle);
        }
        await newsym(game.u.ux, game.u.uy);
        /* fall recursively into the pit... */
        if ((trap = t_at(game.u.ux, game.u.uy)) != null) {
            await dotrap(trap, 8);
        }
        await fill_pit(game.u.ux, game.u.uy);
    } else {
        let trapkilled = (0);
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let tx = trap.tx;
        let ty = trap.ty;
        /* heavier monsters are more likely to set off a land mine; on the
           other hand, any mon lighter than the trigger weight is immune */
        if (rn2(mtmp.data.cwt + 1) < (Math.trunc(WT_ELF / 2))) {
            return Trap_Effect_Finished;
        }
        if (m_in_air(mtmp)) {
            let already_seen = trap.tseen;
            if (in_sight && !already_seen) {
                await pline_mon(mtmp, "A trigger appears in a pile of soil below %s.", await mon_nam(mtmp));
                await seetrap(trap);
            }
            if (rn2(3)) {
                return Trap_Effect_Finished;
            }
            if (in_sight) {
                await newsym(mtmp.mx, mtmp.my);
                await pline_The("air currents set %s off!", already_seen ? "a land mine" : "it");
            }
        } else if (in_sight) {
            await newsym(mtmp.mx, mtmp.my);
            await pline_mon(mtmp, "%s%s triggers %s land mine!", !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "KAABLAMM!!!  " : "", await Monnam(mtmp), a_your[trap.madeby_u]);
        }
        if (!in_sight && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await pline("Kaablamm!  %s an explosion in the distance!", "You hear");
        }
        await blow_up_landmine(trap);
        if (((mtmp).mhp < 1) || await thitm(0, mtmp, null, damage, (0))) {
            trapkilled = (1);
        } else {
            if (await mintrap(mtmp, trflags | 1) == Trap_Killed_Mon) {
                trapkilled = (1);
            }
        }
        await fill_pit(tx, ty);
        if (((mtmp).mhp < 1)) {
            trapkilled = (1);
        }
        if (unconscious()) {
            game.multi = -1;
            game.nomovemsg = "The explosion awakens you!";
        }
        return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_rolling_boulder_trap(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        let style = 1 | (trap.tseen ? 128 : 0);
        await feeltrap(trap);
        await pline("%sYou trigger a rolling boulder trap!", !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "Click!  " : "");
        if (!await launch_obj(BOULDER, trap.launch.x, trap.launch.y, trap.vl.v_launch2.x, trap.vl.v_launch2.y, style)) {
            if (style & 128) {
                await pline("No boulder was released.");
            } else {
                await pline("Fortunately for you, no boulder was released.");
            }
        }
    } else {
        if (!m_in_air(mtmp)) {
            let in_sight = (mtmp == game.u.usteed || (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0) && (canseemon(mtmp) || sensemon(mtmp))));
            let style = 1 | (in_sight ? 0 : 64);
            let trapkilled = (0);
            await newsym(mtmp.mx, mtmp.my);
            if (in_sight) {
                await pline_mon(mtmp, "%s%s triggers %s.", !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "Click!  " : "", await Monnam(mtmp), trap.tseen ? "a rolling boulder trap" : c_common_strings.c_something);
            }
            if (await launch_obj(BOULDER, trap.launch.x, trap.launch.y, trap.vl.v_launch2.x, trap.vl.v_launch2.y, style)) {
                if (in_sight) {
                    trap.tseen = (1);
                }
                if (((mtmp).mhp < 1)) {
                    trapkilled = (1);
                }
            }
            return trapkilled ? Trap_Killed_Mon : mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
        }
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_magic_portal(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        await feeltrap(trap);
        await domagicportal(trap);
    } else {
        return await trapeffect_level_telep(mtmp, trap, trflags);
    }
    return Trap_Effect_Finished;
}
export async function trapeffect_vibrating_square(mtmp, trap, trflags) {
    if (mtmp == game.youmonst) {
        await feeltrap(trap);
    } else {
        let in_sight = canseemon(mtmp) || (mtmp == game.u.usteed);
        let see_it = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
        if (see_it && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await seetrap(trap);
            if (in_sight) {
                let buf = '';
                let p = null;
                let monnm = await mon_nam(mtmp);
                if ((((mtmp.data).mflags1 & 24576) == 24576) || m_in_air(mtmp)) {
                    buf = strcpy(buf, monnm);
                } else {
                    buf = strcpy(buf, s_suffix(monnm));
                    p = eos(strcat(buf, " "));
                    p = strcpy(p, await makeplural(await mbodypart(mtmp, FOOT)));
                    /* avoid "beneath 'rear paws'" or 'rear hooves' */
                    p = strsubst(p, "rear ", "");
                }
                await You_see("a strange vibration beneath %s.", buf);
            } else {
                await You_see("the ground vibrate %s.", (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2 * 2) ? "nearby" : "in the distance");
            }
        }
    }
    return Trap_Effect_Finished;
}
/*
 * for PR#259 - paranoid_confirm:trap
 *
 * Will a monster suffer any adverse effects from a certain trap?
 * Note: does NOT mean "will a monster trigger a trap in the first place",
 * though if it won't that does imply that they'll not suffer adverse effects.
 * For example, an elf is considered immune to sleeping gas traps even though
 * they'll set the trap off.
 * Return value:
 *  TRAP_NOT_IMMUNE = not immune at the moment;
 *  TRAP_CLEARLY_IMMUNE = obviously immune (if player is polymorphed, assume
 *    they know which traps they are immune to in their current form);
 *  TRAP_HIDDEN_IMMUNE = immune but in non-obvious way such as an unidentified
 *    item or hidden intrinsic providing a resistance; the player should still
 *    be warned of this trap, while monsters implicitly know they're immune.
 */
export async function immune_to_trap(mon, ttype) {
    let pm = null;
    let obj = null;
    let is_you = 0;
    if (!mon) {
        await impossible("immune_to_trap: null monster");
        return TRAP_NOT_IMMUNE;
    }
    pm = mon.data;
    is_you = (mon == game.youmonst);
    switch (ttype) {
        case ARROW_TRAP:
        case DART_TRAP:
        case ROCKTRAP:
            return TRAP_NOT_IMMUNE;
        case BEAR_TRAP:
            if (pm.msize <= 1 || (((pm).mflags1 & 4) != 0) || ((pm).mlet == S_VORTEX || (pm) == game.mons[PM_AIR_ELEMENTAL]) || (((pm).mflags1 & 1048576) != 0)) {
                /* player won't lose HP and can't lose more Pw */
                return TRAP_CLEARLY_IMMUNE;
            }
            ;
        case SQKY_BOARD:
        case LANDMINE:
        case ROLLING_BOULDER_TRAP:
        case HOLE:
        case TRAPDOOR:
        case PIT:
        case SPIKED_PIT:
            if (game.level.flags.sokoban_rules && (((ttype) == PIT || (ttype) == SPIKED_PIT) || ((ttype) == HOLE || (ttype) == TRAPDOOR))) {
                return TRAP_NOT_IMMUNE;
            }
            if (((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) && ttype == ROLLING_BOULDER_TRAP) {
                return TRAP_CLEARLY_IMMUNE;
            }
            /* not dangerous in Sokoban */
            if (((pm).mlet == S_EYE || (pm).mlet == S_LIGHT) || (((pm).mflags1 & 1) != 0) || ((((pm).mflags1 & 16) != 0) && has_ceiling(game.u.uz))) {
                return TRAP_CLEARLY_IMMUNE;
            } else if (is_you && (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked))) {
                return TRAP_CLEARLY_IMMUNE;
            }
            return TRAP_NOT_IMMUNE;
        case SLP_GAS_TRAP:
            if ((((pm).mflags1 & 1024) != 0)) {
                return TRAP_CLEARLY_IMMUNE;
            } else if (!is_you && await Resists_Elem(mon, SLEEP_RES)) {
                return TRAP_CLEARLY_IMMUNE;
            } else if (is_you && (game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                return TRAP_HIDDEN_IMMUNE;
            }
            return TRAP_NOT_IMMUNE;
        case LEVEL_TELEP:
        case TELEP_TRAP:
            if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) || mon_has_amulet(mon)) {
                return TRAP_CLEARLY_IMMUNE;
            }
            return TRAP_NOT_IMMUNE;
        case POLY_TRAP:
            if (resists_magm(mon)) {
                return (is_you ? TRAP_HIDDEN_IMMUNE : TRAP_CLEARLY_IMMUNE);
            }
            return TRAP_NOT_IMMUNE;
        case STATUE_TRAP:
            if (!is_you) {
                return TRAP_CLEARLY_IMMUNE;
            }
            return TRAP_NOT_IMMUNE;
        case WEB:
            if (((pm) == game.mons[PM_CAVE_SPIDER] || (pm) == game.mons[PM_GIANT_SPIDER]) || (((pm).mflags1 & 4) != 0) || ((pm).mlet == S_VORTEX || (pm) == game.mons[PM_AIR_ELEMENTAL]) || ((pm) == game.mons[PM_FIRE_VORTEX] || (pm) == game.mons[PM_FLAMING_SPHERE] || (pm) == game.mons[PM_FIRE_ELEMENTAL] || (pm) == game.mons[PM_SALAMANDER]) || (((pm).mflags1 & 1048576) != 0) || pm == game.mons[PM_GELATINOUS_CUBE]) {
                return TRAP_CLEARLY_IMMUNE;
            }
            return TRAP_NOT_IMMUNE;
        case ANTI_MAGIC:
            if (is_you) {
                /* consider unintended teleporting to be an adverse effect; if in
           the endgame or carrying the Amulet, the teleport trap won't work
           anyway, so anything hitting it is immune. */
                /* covers Antimagic for player */
                /* no effect on monsters, only affects players; only trap detection
           can let player know that this is a statue trap there ahead of time;
           in the rare case this happens, do consider it an adverse effect */
                /* most of this code is lifted from mu_maybe_destroy_web */
                /* doesn't hurt any non-magic-resistant monster with no magic */
                /* following conditional lifted from mintrap ANTI_MAGIC logic */
                if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                    return TRAP_NOT_IMMUNE;
                } else if (game.u.uenmax == 0) {
                    return TRAP_HIDDEN_IMMUNE;
                }
            } else if (!resists_magm(mon) && (mon.mcan || (!attacktype(pm, 255) && !attacktype(pm, 12)))) {
                return TRAP_CLEARLY_IMMUNE;
            }
            return TRAP_NOT_IMMUNE;
        case RUST_TRAP:
            if (pm == game.mons[PM_IRON_GOLEM]) {
                return TRAP_NOT_IMMUNE;
            }
            for (obj = is_you ? game.invent : mon.minvent; obj; obj = obj.nobj) {
                if ((game.objects[obj.otyp].oc_material == IRON) && obj.owornmask) {
                    /* harmful if wearing anything rustable or if mon is an iron golem */
                    /* rust traps can currently hit only worn armor and weapons */
                    if (is_you && (obj == game.uquiver || (obj == game.uswapwep && !game.u.twoweap))) {
                        continue;
                    }
                    return TRAP_NOT_IMMUNE;
                }
            }
            return TRAP_CLEARLY_IMMUNE;
        case MAGIC_TRAP:
            if (is_you) {
                return TRAP_NOT_IMMUNE;
            }
            ;
        case FIRE_TRAP:
            if (is_you ? !(game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) : !await Resists_Elem(mon, FIRE_RES)) {
                return TRAP_NOT_IMMUNE;
            }
            for (obj = is_you ? game.invent : mon.minvent; obj; obj = obj.nobj) {
                if (obj.oclass == SCROLL_CLASS || obj.oclass == POTION_CLASS || obj.oclass == SPBOOK_CLASS || (obj.owornmask && is_flammable(obj))) {
                    /* for player, any number of bad effects;
           for monsters, only replicates fire trap, so fall through */
                    /* harmful if not resistant or if carrying anything that could burn */
                    if ((obj.otyp == SCR_FIRE || obj.otyp == SPE_FIREBALL) && (!is_you || (obj.dknown && game.objects[obj.otyp].oc_name_known))) {
                        continue;
                    }
                    return TRAP_NOT_IMMUNE;
                }
            }
            return (is_you ? TRAP_HIDDEN_IMMUNE : TRAP_CLEARLY_IMMUNE);
        case MAGIC_PORTAL:
            if (!is_you) {
                return TRAP_CLEARLY_IMMUNE;
            }
            return TRAP_NOT_IMMUNE;
        case VIBRATING_SQUARE:
            return TRAP_CLEARLY_IMMUNE;
        default:
            await impossible("immune_to_trap: bad ttype %u", ttype);
            break;
    }
    return TRAP_NOT_IMMUNE;
}
export async function trapeffect_selector(mtmp, trap, trflags) {
    switch (trap.ttyp) {
        case ARROW_TRAP:
            return await trapeffect_arrow_trap(mtmp, trap, trflags);
        case DART_TRAP:
            return await trapeffect_dart_trap(mtmp, trap, trflags);
        case ROCKTRAP:
            return await trapeffect_rocktrap(mtmp, trap, trflags);
        case SQKY_BOARD:
            return await trapeffect_sqky_board(mtmp, trap, trflags);
        case BEAR_TRAP:
            return await trapeffect_bear_trap(mtmp, trap, trflags);
        case SLP_GAS_TRAP:
            return await trapeffect_slp_gas_trap(mtmp, trap, trflags);
        case RUST_TRAP:
            return await trapeffect_rust_trap(mtmp, trap, trflags);
        case FIRE_TRAP:
            return await trapeffect_fire_trap(mtmp, trap, trflags);
        case PIT:
        case SPIKED_PIT:
            return await trapeffect_pit(mtmp, trap, trflags);
        case HOLE:
        case TRAPDOOR:
            return await trapeffect_hole(mtmp, trap, trflags);
        case LEVEL_TELEP:
            return await trapeffect_level_telep(mtmp, trap, trflags);
        case MAGIC_PORTAL:
            return await trapeffect_magic_portal(mtmp, trap, trflags);
        case TELEP_TRAP:
            return await trapeffect_telep_trap(mtmp, trap, trflags);
        case WEB:
            return await trapeffect_web(mtmp, trap, trflags);
        case STATUE_TRAP:
            return await trapeffect_statue_trap(mtmp, trap, trflags);
        case MAGIC_TRAP:
            return await trapeffect_magic_trap(mtmp, trap, trflags);
        case ANTI_MAGIC:
            return await trapeffect_anti_magic(mtmp, trap, trflags);
        case LANDMINE:
            return await trapeffect_landmine(mtmp, trap, trflags);
        case POLY_TRAP:
            return await trapeffect_poly_trap(mtmp, trap, trflags);
        case ROLLING_BOULDER_TRAP:
            return await trapeffect_rolling_boulder_trap(mtmp, trap, trflags);
        case VIBRATING_SQUARE:
            return await trapeffect_vibrating_square(mtmp, trap, trflags);
        default:
            await impossible("%s encountered a strange trap of type %d.", (mtmp == game.youmonst) ? "You" : "Some monster", trap.ttyp);
    }
    return Trap_Effect_Finished;
}
export async function dotrap(trap, trflags) {
    let ttype = trap.ttyp;
    let already_seen = trap.tseen;
    let forcetrap = ((trflags & 1) != 0 || (trflags & 64) != 0);
    let forcebungle = (trflags & 4) != 0;
    let plunged = (trflags & 16) != 0;
    let conj_pit = conjoined_pits(trap, t_at(game.u.ux0, game.u.uy0), (1));
    let adj_pit = adj_nonconjoined_pit(trap);
    nomul(0);
    if (((trap).ttyp == TELEP_TRAP && isok((trap).launch.x, (trap).launch.y))) {
        trflags |= 1;
        forcetrap = (1);
    }
    if (game.level.flags.sokoban_rules && (((ttype) == PIT || (ttype) == SPIKED_PIT) || ((ttype) == HOLE || (ttype) == TRAPDOOR))) {
        await pline("Air currents pull you down into %s %s!", a_your[trap.madeby_u], trapname(ttype, (1)));
    } else if (!forcetrap) {
        if (floor_trigger(ttype) && check_in_air(game.youmonst, trflags)) {
            if (already_seen) {
                await You("%s over %s %s.", u_locomotion("step"), (ttype == ARROW_TRAP && !trap.madeby_u) ? "an" : a_your[trap.madeby_u], trapname(ttype, (0)));
            }
            return;
        }
        if (already_seen && !(game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) && !((ttype) == MAGIC_PORTAL || (ttype) == VIBRATING_SQUARE) && ttype != ANTI_MAGIC && !forcebungle && !plunged && !conj_pit && !adj_pit && (!rn2(5) || (((ttype) == PIT || (ttype) == SPIKED_PIT) && (((game.youmonst.data).mflags1 & 16) != 0)))) {
            await You("escape %s %s.", (ttype == ARROW_TRAP && !trap.madeby_u) ? "an" : a_your[trap.madeby_u], trapname(ttype, (0)));
            return;
        }
    }
    if (game.u.usteed) {
        mon_learns_traps(game.u.usteed, ttype);
    }
    mons_see_trap(trap);
    await trapeffect_selector(game.youmonst, trap, trflags);
}
const __trapnote_tnnames = ["C note", "D flat", "D note", "E flat", "E note", "F note", "F sharp", "G note", "G sharp", "A note", "B flat", "B note"];
let __trapnote_tnbuf = '';
__nh_register_static(() => { __trapnote_tnbuf = ''; });
export function trapnote(trap, noprefix) {
    let tn = null;
    __trapnote_tnbuf = '';
    tn = __trapnote_tnnames[trap.vl.v_tnote];
    if (!noprefix) {
        __trapnote_tnbuf = just_an(__trapnote_tnbuf, tn);
    }
    return strcat(__trapnote_tnbuf, tn);
}
/* choose a note not used by any trap on current level,
   ignoring ttmp; if all are in use, pick a random one */
export function choose_trapnote(ttmp) {
    let tavail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tpick = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tcnt = 0;
    let k = 0;
    let t = null;
    for (k = 0; k < 12; ++k) {
        (tpick[k] = 0, tavail[k] = 0);
    }
    for (t = game.ftrap; t; t = t.ntrap) {
        if (t.ttyp == SQKY_BOARD && t != ttmp) {
            tavail[t.vl.v_tnote] = 1;
        }
    }
    /* now populate tpick[] with the available indices */
    for (k = 0; k < 12; ++k) {
        if (tavail[k] == 0) {
            tpick[tcnt++] = k;
        }
    }
    /* choose an unused note; if all are in use, pick a random one */
    return ((tcnt > 0) ? tpick[rn2(tcnt)] : rn2(12));
}
export async function steedintrap(trap, otmp) {
    let steed = game.u.usteed;
    let tt = 0;
    let trapkilled = 0;
    let steedhit = 0;
    if (!steed || !trap) {
        return Trap_Effect_Finished;
    }
    tt = trap.ttyp;
    steed.mx = game.u.ux;
    steed.my = game.u.uy;
    trapkilled = steedhit = (0);
    switch (tt) {
        case ARROW_TRAP:
            if (!otmp) {
                await impossible("steed hit by non-existent arrow?");
                return Trap_Effect_Finished;
            }
            trapkilled = await thitm(8, steed, otmp, 0, (0));
            steedhit = (1);
            break;
        case DART_TRAP:
            if (!otmp) {
                await impossible("steed hit by non-existent dart?");
                return Trap_Effect_Finished;
            }
            trapkilled = await thitm(7, steed, otmp, 0, (0));
            steedhit = (1);
            break;
        case SLP_GAS_TRAP:
            if (!await Resists_Elem(steed, SLEEP_RES) && !(((steed.data).mflags1 & 1024) != 0) && !((steed).msleeping || !(steed).mcanmove)) {
                if (await sleep_monst(steed, rnd(25), -1)) {
                    await pline("%s suddenly falls asleep!", await Monnam(steed));
                }
            }
            steedhit = (1);
            break;
        case LANDMINE:
            trapkilled = await thitm(0, steed, null, rnd(16), (0));
            steedhit = (1);
            break;
        case PIT:
        case SPIKED_PIT:
            trapkilled = (((steed).mhp < 1) || await thitm(0, steed, null, rnd((tt == PIT) ? 6 : 10), (0)));
            steedhit = (1);
            break;
        case POLY_TRAP:
            if (!resists_magm(steed) && !await resist(steed, WAND_CLASS, 0, 0)) {
                await newcham(steed, null, 1);
            }
            steedhit = (1);
            break;
        default:
            break;
    }
    if (trapkilled) {
        await dismount_steed(DISMOUNT_POLY);
        return Trap_Killed_Mon;
    }
    return steedhit ? 1 : 0;
}
/* some actions common to both player and monsters for triggered landmine */
export async function blow_up_landmine(trap) {
    let x = trap.tx;
    let y = trap.ty;
    let dbx = 0;
    let dby = 0;
    let lev = game.level.locations[x][y];
    let old_typ = 0;
    let typ = 0;
    old_typ = lev.typ;
    await scatter(x, y, 4, 8 | (2 | 4) | 16 | 1, null);
    await del_engr_at(x, y);
    await wake_nearto(x, y, 400);
    if (((lev.typ) == DOOR)) {
        lev.flags = 1;
    }
    if (lev.typ == DRAWBRIDGE_DOWN || is_drawbridge_wall(x, y) >= 0) {
        /* destroy drawbridge if present */
        dbx = x , dby = y;
        /* if under the portcullis, the bridge is adjacent */
        if (find_drawbridge({ get value() { return dbx; }, set value(_v) { dbx = _v; } }, { get value() { return dby; }, set value(_v) { dby = _v; } })) {
            await destroy_drawbridge(dbx, dby);
        }
    }
    /* expected to be null after destruction */
    trap = t_at(x, y);
    if (trap) {
        if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
            await deltrap(trap);
        } else {
            /* fill pit with water, if applicable */
            typ = fillholetyp(x, y, (0));
            if (typ != ROOM) {
                lev.typ = typ;
                await liquid_flow(x, y, typ, trap, ((game.viz_array[y][x] & 2) != 0) ? "The hole fills with %s!" : null);
            } else {
                trap.ttyp = PIT;
                /* resulting pit isn't yours */
                trap.madeby_u = (0);
                await seetrap(trap);
            }
        }
    }
    await fill_pit(x, y);
    await maybe_dunk_boulders(x, y);
    recalc_block_point(x, y);
    await spot_checks(x, y, old_typ);
}
export function launch_drop_spot(obj, x, y) {
    if (!obj) {
        game.launchplace.obj = null;
        game.launchplace.x = 0;
        game.launchplace.y = 0;
    } else {
        game.launchplace.obj = obj;
        game.launchplace.x = x;
        game.launchplace.y = y;
    }
}
export function launch_in_progress() {
    if (game.launchplace.obj) {
        return (1);
    }
    return (0);
}
export async function force_launch_placement() {
    if (game.launchplace.obj) {
        game.launchplace.obj.otrapped = 0;
        await place_object(game.launchplace.obj, game.launchplace.x, game.launchplace.y);
    }
}
/*
 * Move obj from (x1,y1) to (x2,y2)
 *
 * Return 0 if no object was launched.
 *        1 if an object was launched and placed somewhere.
 *        2 if an object was launched, but used up.
 */
export async function launch_obj(otyp, x1, y1, x2, y2, style) {
    let mtmp = null;
    let otmp = null;
    let otmp2 = null;
    let dx = 0;
    let dy = 0;
    let x = 0;
    let y = 0;
    let singleobj = null;
    let used_up = (0);
    let otherside = (0);
    let dist = 0;
    let tmp = 0;
    let delaycnt = 0;
    otmp = sobj_at(otyp, x1, y1);
    if (!otmp && otyp == BOULDER) {
        /* Try the other side too, for rolling boulder traps */
        otherside = (1);
        otmp = sobj_at(otyp, x2, y2);
    }
    if (!otmp) {
        return 0;
    }
    if (otherside) {
        let tx = 0;
        let ty = 0;
        tx = x1;
        ty = y1;
        x1 = x2;
        y1 = y2;
        x2 = tx;
        y2 = ty;
    }
    if (otmp.quan == 1) {
        await obj_extract_self(otmp);
        await maybe_unhide_at(otmp.ox, otmp.oy);
        singleobj = otmp;
        otmp = null;
    } else {
        singleobj = await splitobj(otmp, 1);
        await obj_extract_self(singleobj);
    }
    await newsym(x1, y1);
    /* in case you're using a pick-axe to chop the boulder that's being
       launched (perhaps a monster triggered it), destroy context so that
       the next dig attempt never thinks that you're resuming
       the previous effort */
    if ((otyp == BOULDER || otyp == STATUE) && singleobj.ox == game.context.digging.pos.x && singleobj.oy == game.context.digging.pos.y) {
        memset(game.context.digging, 0, 1 /* sizeof(struct dig_info) */);
    }
    dist = distmin(x1, y1, x2, y2);
    x = game.bhitpos.x = x1;
    y = game.bhitpos.y = y1;
    dx = sgn(x2 - x1);
    dy = sgn(y2 - y1);
    switch (style) {
        case 1 | 64:
            if (otyp == BOULDER) {
                if (((game.viz_array[y1][x1] & 2) != 0)) {
                    await You_see("%s start to roll.", await an(await xname(singleobj)));
                } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    ;
                    await You_hear("someone bowling.");
                } else {
                    ;
                    await You_hear("rumbling %s.", (dist2((x1), (y1), game.u.ux, game.u.uy) <= 4 * 4) ? "nearby" : "in the distance");
                }
            }
            style &= ~64;
            delaycnt = 2;
            if (!((game.viz_array[y][x] & 2) != 0)) {
                await curs_on_u();
            }
            await tmp_at((-4), (((singleobj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((singleobj).corpsenm + ((((singleobj).spe & 3) == 1) ? (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((singleobj).otyp == CORPSE) ? (((singleobj).corpsenm + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(singleobj).dknown && ((singleobj).oclass == POTION_CLASS || ((singleobj).otyp >= FIRST_REAL_GEM && ((singleobj).otyp <= LAST_GLASS_GEM)) || ((singleobj).otyp >= FIRST_SPELL && ((singleobj).otyp <= LAST_SPELL)))) ? (((singleobj).oclass + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((singleobj).otyp + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
            await tmp_at(x, y);
            break;
        case 1 | 128:
            singleobj.otrapped = 1;
            style &= ~128;
            ;
        case 1:
            delaycnt = 2;
            ;
        default:
            if (!delaycnt) {
                delaycnt = 1;
            }
            if (!((game.viz_array[y][x] & 2) != 0)) {
                await curs_on_u();
            }
            await tmp_at((-4), (((singleobj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((singleobj).corpsenm + ((((singleobj).spe & 3) == 1) ? (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((singleobj).otyp == CORPSE) ? (((singleobj).corpsenm + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(singleobj).dknown && ((singleobj).oclass == POTION_CLASS || ((singleobj).otyp >= FIRST_REAL_GEM && ((singleobj).otyp <= LAST_GLASS_GEM)) || ((singleobj).otyp >= FIRST_SPELL && ((singleobj).otyp <= LAST_SPELL)))) ? (((singleobj).oclass + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((singleobj).otyp + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
            await tmp_at(x, y);
    }
    /* Mark a spot to place object in bones files to prevent
     * loss of object. Use the starting spot to ensure that
     * a rolling boulder will still launch, which it wouldn't
     * do if left midstream. Unfortunately we can't use the
     * target resting spot, because there are some things/situations
     * that would prevent it from ever getting there (bars), and we
     * can't tell that yet.
     */
    launch_drop_spot(singleobj, x, y);
    while (dist-- > 0 && !used_up) {
        /* Set the object in motion */
        let t = null;
        await tmp_at(x, y);
        tmp = delaycnt;
        if (((game.viz_array[y][x] & 2) != 0)) {
            while (tmp-- > 0) {
                (game.windowprocs.win_delay_output)();
            }
        }
        if (!isok(game.bhitpos.x + dx, game.bhitpos.y + dy)) {
            /*
         * TEMPORARY?  github issue #1490 by BartekCupial reports a
         * segfault when boulder rolls out of bounds.  That should be
         * impossible because trap creation validates the path that
         * the boulder will traverse.
         *
         * The suggested fix increments bhitpos, verifies with isok(),
         * then undoes the increment if not ok.  This is simpler.
         */
            /* use current spot for final boulder placement */
            x2 = x , y2 = y;
            break;
        }
        /*
         * end TEMPORARY?
         */
        x = (game.bhitpos.x += dx);
        y = (game.bhitpos.y += dy);
        if ((mtmp = (game.level.monsters[x][y])) != null) {
            if (otyp == BOULDER && (((mtmp.data).mflags2 & 134217728) != 0)) {
                if (rn2(3)) {
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        await pline_mon(mtmp, "%s snatches the boulder.", await Monnam(mtmp));
                    }
                    singleobj.otrapped = 0;
                    await mpickobj(mtmp, singleobj);
                    used_up = (1);
                    launch_drop_spot(null, 0, 0);
                    break;
                }
            }
            if (await ohitmon(mtmp, singleobj, (style == 1) ? -1 : dist, (0))) {
                used_up = (1);
                launch_drop_spot(null, 0, 0);
                break;
            }
        } else if (((x) == game.u.ux && (y) == game.u.uy)) {
            let dam = await dmgval(singleobj, game.youmonst);
            if (game.multi) {
                nomul(0);
            }
            if (await thitu(9 + singleobj.spe, (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam)), { get value() { return singleobj; }, set value(_v) { singleobj = _v; } }, null)) {
                await stop_occupation();
            }
        }
        if (style == 1) {
            if (await down_gate(x, y) != -1) {
                if (await ship_object(singleobj, x, y, (0))) {
                    used_up = (1);
                    launch_drop_spot(null, 0, 0);
                    break;
                }
            }
            if ((t = t_at(x, y)) != null && otyp == BOULDER) {
                let newlev = 0;
                let dest = { dnum: 0, dlevel: 0 };
                switch (t.ttyp) {
                    case LANDMINE:
                        if (rn2(10) > 2) {
                            if (((game.viz_array[y][x] & 2) != 0)) {
                                set_msg_xy(x, y);
                            }
                            await pline("KAABLAMM!!!%s", ((game.viz_array[y][x] & 2) != 0) ? "  The rolling boulder triggers a land mine." : "");
                            await deltrap(t);
                            await del_engr_at(x, y);
                            await place_object(singleobj, x, y);
                            singleobj.otrapped = 0;
                            await fracture_rock(singleobj);
                            await scatter(x, y, 4, 8 | (2 | 4) | 16 | 1, null);
                            if (((game.viz_array[y][x] & 2) != 0)) {
                                await newsym(x, y);
                            }
                            /* the boulder won't be used up if there is a
                       monster in the trap; stop rolling anyway */
                            used_up = (1);
                            launch_drop_spot(null, 0, 0);
                        }
                        break;
                    case LEVEL_TELEP:
                        newlev = random_teleport_level();
                        /* if trap doesn't work, skip "disappears" message */
                        if (newlev == depth(game.u.uz)) {
                            break;
                        }
                        ;
                    case TELEP_TRAP:
                        if (((game.viz_array[y][x] & 2) != 0)) {
                            await pline_xy(x, y, "Suddenly the rolling boulder disappears!");
                        } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                            await You_hear("a rumbling stop abruptly.");
                        }
                        singleobj.otrapped = 0;
                        if (t.ttyp == TELEP_TRAP) {
                            await rloco(singleobj);
                        } else {
                            await add_to_migration(singleobj);
                            await get_level(dest, newlev);
                            singleobj.ox = dest.dnum;
                            singleobj.oy = dest.dlevel;
                            singleobj.owornmask = 0;
                        }
                        await seetrap(t);
                        used_up = (1);
                        launch_drop_spot(null, 0, 0);
                        break;
                    case PIT:
                    case SPIKED_PIT:
                    case HOLE:
                    case TRAPDOOR:
                        x2 = x , y2 = y;
                        if (await flooreffects(singleobj, x2, y2, "fall")) {
                            used_up = (1);
                            launch_drop_spot(null, 0, 0);
                        }
                        /* stop rolling immediately */
                        dist = -1;
                        break;
                    default:
                        break;
                }
                if (used_up || dist == -1) {
                    break;
                }
            }
            if (await flooreffects(singleobj, x, y, "fall")) {
                used_up = (1);
                launch_drop_spot(null, 0, 0);
                break;
            }
            if (otyp == BOULDER && (otmp2 = sobj_at(BOULDER, x, y)) != null) {
                let bmsg = " as one boulder sets another in motion";
                let fx = x + dx;
                let fy = y + dy;
                if (!isok(fx, fy) || !dist || ((game.level.locations[fx][fy].typ) < POOL)) {
                    bmsg = " as one boulder hits another";
                }
                ;
                await You_hear("a loud crash%s!", ((game.viz_array[y][x] & 2) != 0) ? bmsg : "");
                await obj_extract_self(otmp2);
                /* pass off the otrapped flag to the next boulder */
                otmp2.otrapped = singleobj.otrapped;
                singleobj.otrapped = 0;
                await place_object(singleobj, x, y);
                singleobj = otmp2;
                otmp2 = null;
                await wake_nearto(x, y, 10 * 10);
            }
        }
        if (otyp == BOULDER && closed_door(x, y)) {
            if (((game.viz_array[y][x] & 2) != 0)) {
                set_msg_xy(x, y);
                await pline_The("boulder crashes through a door.");
            }
            game.level.locations[x][y].flags = 1;
            if (dist) {
                recalc_block_point(x, y);
            }
        }
        if (dist > 0 && isok(x + dx, y + dy)) {
            /* if about to hit something, do so now */
            let fx = x + dx;
            let fy = y + dy;
            let typ = game.level.locations[fx][fy].typ;
            if (typ == IRONBARS) {
                x2 = x , y2 = y;
                if (await hits_bars(singleobj, x2, y2, fx, fy, !rn2(20), 0)) {
                    if (!singleobj) {
                        used_up = (1);
                        launch_drop_spot(null, 0, 0);
                    }
                    break;
                }
            } else if (((typ) <= DBWALL) || ((typ) == TREE || (game.level.flags.arboreal && (typ) == STONE))) {
                x2 = x , y2 = y;
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    await pline("Thump!");
                }
                await wake_nearto(x2, y2, 16);
                break;
            }
        }
    }
    await tmp_at((-7), 0);
    launch_drop_spot(null, 0, 0);
    if (!used_up) {
        singleobj.otrapped = 0;
        await place_object(singleobj, x2, y2);
        await newsym(x2, y2);
        return 1;
    }
    return 2;
}
export async function seetrap(trap) {
    if (!trap.tseen) {
        trap.tseen = 1;
        await newsym(trap.tx, trap.ty);
    }
}
/* like seetrap() but overrides vision */
export async function feeltrap(trap) {
    trap.tseen = 1;
    await map_trap(trap, 1);
    await newsym(trap.tx, trap.ty);
}
/* try to find a random coordinate where launching a rolling boulder
   could work. return TRUE if found, with coordinate in cc. */
export function find_random_launch_coord(ttmp, cc) {
    let tmp = 0;
    let success = (0);
    let bcc = { x: 0, y: 0 };
    let distance = 0;
    let mindist = 4;
    let trycount = 0;
    let dx = 0;
    let dy = 0;
    let x = 0;
    let y = 0;
    if (!ttmp || !cc || game.level.flags.sokoban_rules) {
        return (0);
    }
    x = ttmp.tx;
    y = ttmp.ty;
    bcc.x = ttmp.tx + game.launchplace.x;
    bcc.y = ttmp.ty + game.launchplace.y;
    if (isok(bcc.x, bcc.y) && linedup(ttmp.tx, ttmp.ty, bcc.x, bcc.y, 1)) {
        cc.x = bcc.x;
        cc.y = bcc.y;
        return (1);
    }
    if (ttmp.ttyp == ROLLING_BOULDER_TRAP) {
        mindist = 2;
    }
    distance = (rn2(5) + (4));
    /* randomly pick a direction to try first */
    tmp = rn2((N_DIRS_Z - 2));
    while (distance >= mindist) {
        dx = xdir[tmp];
        dy = ydir[tmp];
        /* create the trap without any ammo, launch pt at trap location */
        cc.x = x;
        cc.y = y;
        if (ttmp.ttyp == ROLLING_BOULDER_TRAP && is_pool_or_lava(x + distance * dx, y + distance * dy)) {
            success = (0);
        /* Prevent boulder from being placed on water */
        } else {
            success = isclearpath(cc, distance, dx, dy);
        }
        if (ttmp.ttyp == ROLLING_BOULDER_TRAP) {
            let success_otherway = 0;
            bcc.x = x;
            bcc.y = y;
            success_otherway = isclearpath(bcc, distance, -(dx), -(dy));
            if (!success_otherway) {
                success = (0);
            }
        }
        if (success) {
            break;
        }
        if (++tmp > 7) {
            tmp = 0;
        }
        if ((++trycount % 8) == 0) {
            --distance;
        }
    }
    return success;
}
export async function mkroll_launch(ttmp, x, y, otyp, ocount) {
    let otmp = null;
    let cc = { x: 0, y: 0 };
    let success = (0);
    success = find_random_launch_coord(ttmp, cc);
    if (!success) {
        cc.x = x;
        cc.y = y;
    } else {
        otmp = await mksobj(otyp, (1), (0));
        otmp.quan = ocount;
        otmp.owt = await weight(otmp);
        await place_object(otmp, cc.x, cc.y);
        await stackobj(otmp);
    }
    ttmp.launch.x = cc.x;
    ttmp.launch.y = cc.y;
    if (ttmp.ttyp == ROLLING_BOULDER_TRAP) {
        ttmp.vl.v_launch2.x = x - (cc.x - x);
        ttmp.vl.v_launch2.y = y - (cc.y - y);
    } else {
        ttmp.vl.v_launch_otyp = otyp;
    }
    await newsym(ttmp.launch.x, ttmp.launch.y);
    return 1;
}
export function isclearpath(cc, distance, dx, dy) {
    let t = null;
    let typ = 0;
    let x = 0;
    let y = 0;
    x = cc.x;
    y = cc.y;
    while (distance-- > 0) {
        x += dx;
        y += dy;
        /* happily wading in the same contiguous pool */
        /* water effects on objects every now and then */
        if (!isok(x, y)) {
            return (0);
        }
        typ = game.level.locations[x][y].typ;
        if (!((typ) >= POOL) || closed_door(x, y)) {
            return (0);
        }
        if ((t = t_at(x, y)) != null && (((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT) || ((t.ttyp) == HOLE || (t.ttyp) == TRAPDOOR) || ((t.ttyp) >= TELEP_TRAP && (t.ttyp) <= MAGIC_PORTAL))) {
            return (0);
        }
    }
    cc.x = x;
    cc.y = y;
    return (1);
}
/* can monster escape from a pit easily */
export function m_easy_escape_pit(mtmp) {
    return (mtmp.data == game.mons[PM_PIT_FIEND] || mtmp.data.msize >= 4);
}
export async function mintrap(mtmp, mintrapflags) {
    let trap = t_at(mtmp.mx, mtmp.my);
    let mptr = mtmp.data;
    let trap_result = Trap_Effect_Finished;
    if (!trap) {
        /* untrap the monster, if any.
       There's no need for a cockatrice test, only the trap is touched */
        mtmp.mtrapped = 0;
    } else if (mtmp.mtrapped) {
        if (!trap.tseen && ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0) && canseemon(mtmp) && (((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT) || trap.ttyp == BEAR_TRAP || trap.ttyp == HOLE || trap.ttyp == WEB)) {
            await seetrap(trap);
        }
        if (!rn2(40) || (((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT) && m_easy_escape_pit(mtmp))) {
            if (sobj_at(BOULDER, mtmp.mx, mtmp.my) && ((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT)) {
                if (!rn2(2)) {
                    mtmp.mtrapped = 0;
                    if (canseemon(mtmp)) {
                        await pline_mon(mtmp, "%s pulls free...", await Monnam(mtmp));
                    }
                    await fill_pit(mtmp.mx, mtmp.my);
                }
            } else {
                if (canseemon(mtmp)) {
                    set_msg_xy(mtmp.mx, mtmp.my);
                    if (((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT)) {
                        await pline("%s climbs %sout of the pit.", await Monnam(mtmp), m_easy_escape_pit(mtmp) ? "easily " : "");
                    } else if (trap.ttyp == BEAR_TRAP || trap.ttyp == WEB) {
                        await pline("%s pulls free of the %s.", await Monnam(mtmp), trapname(trap.ttyp, (0)));
                    }
                }
                mtmp.mtrapped = 0;
            }
        } else if ((((mptr).mflags1 & 2147483648) != 0)) {
            if (trap.ttyp == BEAR_TRAP) {
                if (canseemon(mtmp)) {
                    await pline_mon(mtmp, "%s eats a bear trap!", await Monnam(mtmp));
                }
                await deltrap(trap);
                mtmp.meating = 5;
                mtmp.mtrapped = 0;
            } else if (trap.ttyp == SPIKED_PIT) {
                if (canseemon(mtmp)) {
                    await pline_mon(mtmp, "%s munches on some spikes!", await Monnam(mtmp));
                }
                trap.ttyp = PIT;
                mtmp.meating = 5;
            }
        }
        trap_result = mtmp.mtrapped ? Trap_Caught_Mon : Trap_Effect_Finished;
    } else {
        let tt = trap.ttyp;
        let forcetrap = ((mintrapflags & 1) != 0);
        let forcebungle = (mintrapflags & 4) != 0;
        /* monster has seen such a trap before */
        let already_seen = (mon_knows_traps(mtmp, tt) || (tt == HOLE && !(((mptr).mflags1 & 65536) != 0)));
        if (((trap).ttyp == TELEP_TRAP && isok((trap).launch.x, (trap).launch.y))) {
            mintrapflags |= 1;
            forcetrap = (1);
        }
        if (mtmp == game.u.usteed) {
            ;
        } else if (game.level.flags.sokoban_rules && (((tt) == PIT || (tt) == SPIKED_PIT) || ((tt) == HOLE || (tt) == TRAPDOOR)) && !trap.madeby_u) {
            ;
        } else if (!forcetrap) {
            if (floor_trigger(tt) && check_in_air(mtmp, mintrapflags)) {
                return Trap_Effect_Finished;
            }
            if (already_seen && rn2(4) && !forcebungle) {
                return Trap_Effect_Finished;
            }
        }
        mon_learns_traps(mtmp, tt);
        mons_see_trap(trap);
        if (trap.madeby_u && rnl(5)) {
            await setmangry(mtmp, (0));
        }
        trap_result = await trapeffect_selector(mtmp, trap, mintrapflags);
        if (!((mtmp).mhp < 1) && mtmp.mtrapped) {
            /* mtmp can't stay hiding under an object if trapped in non-pit
           (mtmp hiding under object at armed bear trap location, hero
           zaps wand of locking or spell of wizard lock at spot triggering
           the trap and trapping mtmp there) */
            let alreadyspotted = (canseemon(mtmp) || sensemon(mtmp));
            await maybe_unhide_at(mtmp.mx, mtmp.my);
            if (!alreadyspotted && canseemon(mtmp)) {
                await pline_mon(mtmp, "%s appears.", await Amonnam(mtmp));
            }
        }
    }
    return trap_result;
}
/* Combine cockatrice checks into single functions to avoid repeating code. */
export async function instapetrify(str) {
    if ((game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        return;
    }
    if (poly_when_stoned(game.youmonst.data) && await polymon(PM_STONE_GOLEM)) {
        return;
    }
    await urgent_pline("You turn to stone...");
    game.killer.format = 1;
    if (str != game.killer.name) {
        game.killer.name = strcpy(game.killer.name, str ? str : "");
    }
    await done(STONING);
}
export async function minstapetrify(mon, byplayer) {
    if (await Resists_Elem(mon, STONE_RES)) {
        return;
    }
    if (poly_when_stoned(mon.data)) {
        await mon_to_stone(mon);
        return;
    }
    if (!await vamp_stone(mon)) {
        return;
    }
    await mon_adjust_speed(mon, -3, null);
    if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
        await pline_mon(mon, "%s turns to stone.", await Monnam(mon));
    }
    if (byplayer) {
        game.stoned = (1);
        await xkilled(mon, 1);
    } else {
        await monstone(mon);
    }
}
export async function selftouch(arg) {
    let kbuf = '';
    let corpse_pmname = null;
    if (game.uwep && game.uwep.otyp == CORPSE && ((game.mons[game.uwep.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[game.uwep.corpsenm]) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        corpse_pmname = await obj_pmname(game.uwep);
        await pline("%s touch the %s corpse.", arg, corpse_pmname);
        kbuf = sprintf(kbuf, "%s corpse", await an(corpse_pmname));
        await instapetrify(kbuf);
        /* life-saved; unwield the corpse if we can't handle it */
        /* life-saved; unwield the corpse */
        if (!game.uarmg && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
            await uwepgone();
        }
    }
    if (game.u.twoweap && game.uswapwep && game.uswapwep.otyp == CORPSE && ((game.mons[game.uswapwep.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[game.uswapwep.corpsenm]) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        corpse_pmname = await obj_pmname(game.uswapwep);
        await pline("%s touch the %s corpse.", arg, corpse_pmname);
        kbuf = sprintf(kbuf, "%s corpse", await an(corpse_pmname));
        await instapetrify(kbuf);
        if (!game.uarmg && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
            await uswapwepgone();
        }
    }
}
export async function mselftouch(mon, arg, byplayer) {
    let mwep = ((mon).mw);
    if (mwep && mwep.otyp == CORPSE && ((game.mons[mwep.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[mwep.corpsenm]) == game.mons[PM_CHICKATRICE]) && !await Resists_Elem(mon, STONE_RES)) {
        if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
            await pline_mon(mon, "%s%s touches %s.", arg ? arg : "", arg ? await mon_nam(mon) : await Monnam(mon), await corpse_xname(mwep, null, 4));
        }
        await minstapetrify(mon, byplayer);
        if (!((mon).mhp < 1) && !await which_armor(mon, 16) && !await Resists_Elem(mon, STONE_RES)) {
            await mwepgone(mon);
        }
    }
}
/* start levitating */
export async function float_up() {
    game.disp.botl = (1);
    if (game.u.utrap) {
        if (game.u.utraptype == TT_PIT) {
            await reset_utrap((0));
            await You("float up, out of the %s!", trapname(PIT, (0)));
            game.vision_full_recalc = 1;
            await fill_pit(game.u.ux, game.u.uy);
        } else if (game.u.utraptype == TT_LAVA || game.u.utraptype == TT_INFLOOR) {
            await Your("body pulls upward, but your %s are still stuck.", await makeplural(await body_part(LEG)));
        } else if (game.u.utraptype == TT_BURIEDBALL) {
            let cc = { x: 0, y: 0 };
            cc.x = game.u.ux , cc.y = game.u.uy;
            /* caveat: this finds the first buried iron ball within
               one step of the specified location, not necessarily the
               buried [former] uball at the original anchor point */
            buried_ball(cc);
            await You("feel lighter, but your %s is still chained to the %s.", await body_part(LEG), ((game.level.locations[cc.x][cc.y].typ) >= ROOM) ? "floor" : "ground");
        } else if (game.u.utraptype == WEB) {
            await You("float up slightly, but you are still stuck in the %s.", trapname(WEB, (0)));
        } else {
            await You("float up slightly, but your %s is still stuck.", await body_part(LEG));
        }
    } else if (game.u.uinwater) {
        await spoteffects((1));
    } else if (game.u.uswallow) {
        if ((((game.u.ustuck.data).mflags1 & 262144) != 0)) {
            await You("float away from the %s.", surface(game.u.ux, game.u.uy));
        } else {
            await You("spiral up into %s.", await mon_nam(game.u.ustuck));
        }
    } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        await pline("Up, up, and awaaaay!  You're walking on air!");
    } else if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
        await You("gain control over your movements.");
    } else {
        await You("start to float in the air!");
    }
    if (game.u.usteed && !((game.u.usteed.data).mlet == S_EYE || (game.u.usteed.data).mlet == S_LIGHT) && !(((game.u.usteed.data).mflags1 & 1) != 0)) {
        if ((((game.u.uprops[LEVITATION].intrinsic & 536870912) != 0 || (game.u.uprops[LEVITATION].extrinsic & 8192) != 0) && (game.u.uprops[LEVITATION].intrinsic & ~(536870912 | 16777215)) == 0 && (game.u.uprops[LEVITATION].extrinsic & ~8192) == 0)) {
            await pline("%s magically floats up!", await Monnam(game.u.usteed));
        } else {
            await You("cannot stay on %s.", await mon_nam(game.u.usteed));
            await dismount_steed(DISMOUNT_GENERIC);
        }
    }
    if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
        await You("are no longer able to control your flight.");
    }
    float_vs_flight();
    await encumber_msg();
    return;
}
/* a boulder fills a pit or a hole at x,y */
export async function fill_pit(x, y) {
    let otmp = null;
    let t = null;
    if ((t = t_at(x, y)) != null && (((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT) || ((t.ttyp) == HOLE || (t.ttyp) == TRAPDOOR)) && (otmp = sobj_at(BOULDER, x, y)) != null) {
        await obj_extract_self(otmp);
        await flooreffects(otmp, x, y, "settle");
    }
}
/* stop levitating */
/* might cancel timeout */
export async function float_down(hmask, emask) {
    let trap = null;
    let current_dungeon_level = { dnum: 0, dlevel: 0 };
    let no_msg = (0);
    game.u.uprops[LEVITATION].intrinsic &= ~hmask;
    game.u.uprops[LEVITATION].extrinsic &= ~emask;
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        return 0;
    }
    if (game.u.uprops[LEVITATION].blocked) {
        /* maybe another ring/potion/boots */
        /* if blocked by terrain, we haven't actually been levitating so
           we don't give any end-of-levitation feedback or side-effects,
           but if blocking is solely due to being trapped in/on floor,
           do give some feedback but skip other float_down() effects */
        let trapped = (game.u.uprops[LEVITATION].blocked == 536870912);
        /* controlled flight no longer overridden by levitation */
        /* clears BFlying & I_SPECIAL
                            * unless hero is stuck in floor */
        float_vs_flight();
        if (trapped && game.u.utrap) {
            await You("are no longer trying to float up from the %s.", (game.u.utraptype == TT_BEARTRAP) ? "trap's jaws" : (game.u.utraptype == TT_WEB) ? "web" : (game.u.utraptype == TT_BURIEDBALL) ? "chain" : (game.u.utraptype == TT_LAVA) ? "lava" : "ground");
        }
        await encumber_msg();
        return 0;
    }
    game.disp.botl = (1);
    nomul(0);
    if (game.u.uprops[FLYING].blocked) {
        float_vs_flight();
        if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            await You("have stopped levitating and are now flying.");
            await encumber_msg();
            return 1;
        }
    }
    if (game.u.uswallow) {
        await You("float down, but you are still %s.", (dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null) ? "swallowed" : "engulfed");
        await encumber_msg();
        return 1;
    }
    if ((game.uball != null) && !((game.uball).where == 3) && !(game.level.monsters[game.uball.ox][game.uball.oy]) && (is_pool(game.uball.ox, game.uball.oy) || ((trap = t_at(game.uball.ox, game.uball.oy)) && (((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT) || ((trap.ttyp) == HOLE || (trap.ttyp) == TRAPDOOR))))) {
        game.u.ux0 = game.u.ux;
        game.u.uy0 = game.u.uy;
        game.u.ux = game.uball.ox;
        game.u.uy = game.uball.oy;
        await movobj(game.uchain, game.uball.ox, game.uball.oy);
        await newsym(game.u.ux0, game.u.uy0);
        game.vision_full_recalc = 1;
    }
    if (!((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
        if (!game.u.uswallow && game.u.ustuck) {
            if (sticks(game.youmonst.data)) {
                await You("aren't able to maintain your hold on %s.", await mon_nam(game.u.ustuck));
            } else {
                await pline("Startled, %s can no longer hold you!", await mon_nam(game.u.ustuck));
            }
            await set_ustuck(null);
        }
        /* kludge alert:
         * drown() and lava_effects() print various messages almost
         * every time they're called which conflict with the "fall
         * into" message below.  Thus, we want to avoid printing
         * confusing, duplicate or out-of-order messages.
         * Use knowledge of the two routines as a hack -- this
         * should really be handled differently -dlc
         */
        if (is_pool(game.u.ux, game.u.uy) && !((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) && !(game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) && !game.u.uinwater) {
            no_msg = await drown();
        }
        if (is_lava(game.u.ux, game.u.uy) && !game.iflags.in_lava_effects) {
            await lava_effects();
            no_msg = (1);
        }
    }
    if (!trap) {
        trap = t_at(game.u.ux, game.u.uy);
        if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
            await You("begin to tumble in place.");
        } else if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !no_msg) {
            await You_feel("heavier.");
        } else if (!game.u.uinwater && !no_msg) {
            if (!(emask & 1048576)) {
                if (game.level.flags.sokoban_rules && trap) {
                    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                        await pline("Bummer!  You've crashed.");
                    } else {
                        await You("fall over.");
                    }
                    await losehp(rnd(2), "dangerous winds", 1);
                    if (game.u.usteed) {
                        await dismount_steed(DISMOUNT_FELL);
                    }
                    await selftouch("As you fall, you");
                } else if (game.u.usteed && (((game.u.usteed.data).mlet == S_EYE || (game.u.usteed.data).mlet == S_LIGHT) || (((game.u.usteed.data).mflags1 & 1) != 0))) {
                    await You("settle more firmly in the saddle.");
                } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    await pline("Bummer!  You've %s.", is_pool(game.u.ux, game.u.uy) ? "splashed down" : "hit the ground");
                } else {
                    await You("float gently to the %s.", surface(game.u.ux, game.u.uy));
                }
            }
        }
    }
    await encumber_msg();
    /* can't rely on u.uz0 for detecting trap door-induced level change;
       it gets changed to reflect the new level before we can check it */
    assign_level(current_dungeon_level, game.u.uz);
    if (trap) {
        switch (trap.ttyp) {
            case STATUE_TRAP:
                break;
            case HOLE:
            case TRAPDOOR:
                if (!Can_fall_thru(game.u.uz) || game.u.ustuck) {
                    break;
                }
                ;
            default:
                if (!game.u.utrap) {
                    await dotrap(trap, 0);
                }
        }
    }
    if (!(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !game.u.uswallow && on_level(game.u.uz, current_dungeon_level)) {
        await pickup(1);
    }
    return 1;
}
/* shared code for climbing out of a pit */
export async function climb_pit() {
    let pitname = null;
    if (!game.u.utrap || game.u.utraptype != TT_PIT) {
        return;
    }
    pitname = trapname(PIT, (0));
    if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
        await You("ascend from the %s.", pitname);
        await reset_utrap((0));
        await fill_pit(game.u.ux, game.u.uy);
        game.vision_full_recalc = 1;
    } else if (!rn2(2) && sobj_at(BOULDER, game.u.ux, game.u.uy)) {
        await Your("%s gets stuck in a crevice.", await body_part(LEG));
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
        await You("free your %s.", await body_part(LEG));
    } else if ((((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || (((game.youmonst.data).mflags1 & 16) != 0)) && !game.level.flags.sokoban_rules) {
        await You("%s from the %s.", u_locomotion("climb"), pitname);
        await reset_utrap((0));
        await fill_pit(game.u.ux, game.u.uy);
        game.vision_full_recalc = 1;
    } else if (!(--game.u.utrap) || m_easy_escape_pit(game.youmonst)) {
        await reset_utrap((0));
        await You("%s to the edge of the %s.", (game.level.flags.sokoban_rules && ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) ? "struggle against the air currents and float" : game.u.usteed ? "ride" : "crawl", pitname);
        await fill_pit(game.u.ux, game.u.uy);
        game.vision_full_recalc = 1;
    } else if (game.u.dz || game.flags.verbose) {
        if (game.u.usteed) {
            await Norep("%s is still in a pit.", await YMonnam(game.u.usteed));
        } else {
            await Norep(((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !rn2(5)) ? "You've fallen, and you can't get up." : "You are still in a pit.");
        }
    }
}
/* null for floor trap */
export async function dofiretrap(box) {
    let see_it = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
    let orig_dmg = 0;
    let num = 0;
    let alt = 0;
    orig_dmg = num = d(2, 4);
    if ((box && !((box).where == 3)) ? is_pool(box.ox, box.oy) : (game.u.uinwater)) {
        await pline("A cascade of steamy bubbles erupts from %s!", await the(box ? await xname(box) : surface(game.u.ux, game.u.uy)));
        if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
            await You("are uninjured.");
        } else {
            await losehp(rnd(3), "boiling water", 1);
        }
        return;
    }
    await pline("A %s %s from %s!", tower_of_flame, box ? "bursts" : "erupts", await the(box ? await xname(box) : surface(game.u.ux, game.u.uy)));
    if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
        await shieldeff(game.u.ux, game.u.uy);
        monstseesu(M_SEEN_FIRE);
        num = rn2(2);
    } else if ((game.u.umonnum != game.u.umonster)) {
        switch (game.u.umonnum) {
            case PM_PAPER_GOLEM:
                alt = game.u.mhmax;
                break;
            case PM_STRAW_GOLEM:
                alt = Math.trunc(game.u.mhmax / 2);
                break;
            case PM_WOOD_GOLEM:
                alt = Math.trunc(game.u.mhmax / 4);
                break;
            case PM_LEATHER_GOLEM:
                alt = Math.trunc(game.u.mhmax / 8);
                break;
            default:
                alt = 0;
                break;
        }
        if (alt > num) {
            num = alt;
        }
        if (game.u.mhmax > game.mons[game.u.umonnum].mlevel) {
            game.u.mhmax -= rn2(((game.u.mhmax) < (num + 1) ? (game.u.mhmax) : (num + 1))) , game.disp.botl = (1);
        }
        if (game.u.mh > game.u.mhmax) {
            game.u.mh = game.u.mhmax , game.disp.botl = (1);
        }
        monstunseesu(M_SEEN_FIRE);
    } else {
        let uhpmin = minuhpmax(1);
        let olduhpmax = game.u.uhpmax;
        num = d(2, 4);
        if (game.u.uhpmax > uhpmin) {
            game.u.uhpmax -= rn2(((game.u.uhpmax) < (num + 1) ? (game.u.uhpmax) : (num + 1))) , game.disp.botl = (1);
        }
        if (game.u.uhpmax < uhpmin) {
            setuhpmax(((olduhpmax) < (uhpmin) ? (olduhpmax) : (uhpmin)), (0));
            if (!(game.u.uprops[DRAIN_RES].intrinsic || game.u.uprops[DRAIN_RES].extrinsic)) {
                await losexp(null);
            }
        }
        if (game.u.uhp > game.u.uhpmax) {
            game.u.uhp = game.u.uhpmax , game.disp.botl = (1);
        }
        monstunseesu(M_SEEN_FIRE);
    }
    if (!num) {
        await You("are uninjured.");
    } else {
        await losehp(num, tower_of_flame, 0);
    }
    await burn_away_slime();
    if (await burnarmor(game.youmonst) || rn2(3)) {
        await destroy_items(game.youmonst, 2, orig_dmg);
        await ignite_items(game.invent);
    }
    if (!box && await burn_floor_objects(game.u.ux, game.u.uy, see_it, (1)) && !see_it) {
        await You("smell paper burning.");
    }
    if (is_ice(game.u.ux, game.u.uy)) {
        await melt_ice(game.u.ux, game.u.uy, null);
    }
}
export async function domagictrap() {
    let fate = rnd(20);
    if (fate < 10) {
        /* What happened to the poor sucker? */
        /* Most of the time, it creates some monsters. */
        let cnt = rnd(4);
        if (!await resists_blnd(game.youmonst)) {
            await You("are momentarily blinded by a flash of light!");
            await make_blinded((rn2(5) + (10)), (0));
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await Your("%s", c_common_strings.c_vision_clears);
            }
        } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await You_see("a flash of light!");
        }
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            ;
            await You_hear("a deafening roar!");
            incr_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, (rn2(20) + (30)));
            game.disp.botl = (1);
        } else {
            await You_feel("rankled.");
            incr_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, (rn2(5) + (15)));
            game.disp.botl = (1);
        }
        while (cnt--) {
            await makemon(null, game.u.ux, game.u.uy, 0);
        }
        await wake_nearto(game.u.ux, game.u.uy, 7 * 7);
    } else {
        switch (fate) {
            case 10:
                break;
            /* toggle intrinsic invisibility */
            case 11:
                ;
                await You_hear("a low hum.");
                if (!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked)) {
                    /* sometimes nothing happens */
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await self_invis_message();
                    }
                } else if (!game.u.uprops[INVIS].extrinsic && !((game.youmonst.data) == game.mons[PM_STALKER] || (game.youmonst.data) == game.mons[PM_BLACK_LIGHT])) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        if (!(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
                            await You("can see yourself again!");
                        } else {
                            await You_cant("see through yourself anymore.");
                        }
                    }
                } else {
                    await You_feel("a little more %s now.", game.u.uprops[INVIS].intrinsic ? "obvious" : "hidden");
                }
                game.u.uprops[INVIS].intrinsic = game.u.uprops[INVIS].intrinsic ? 0 : game.u.uprops[INVIS].intrinsic | 67108864;
                await newsym(game.u.ux, game.u.uy);
                break;
            /* trap went off, but good luck prevents damage */
            case 12:
                await dofiretrap(null);
                break;
            case 13:
                await pline("A shiver runs up and down your %s!", await body_part(SPINE));
                break;
            case 14:
                await You_hear((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "the moon howling at you." : "distant howling.");
                break;
            case 15:
                if (on_level(game.u.uz, (game.dungeon_topology.d_qstart_level))) {
                    await You_feel("%slike the prodigal son.", (game.flags.female || ((game.u.umonnum != game.u.umonster) && (((game.youmonst.data).mflags2 & 262144) != 0))) ? "oddly " : "");
                } else {
                    await You("suddenly yearn for %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "Cleveland" : (In_quest(game.u.uz) || await at_dgn_entrance("The Quest")) ? "your nearby homeland" : "your distant homeland");
                }
                break;
            case 16:
                await Your("pack shakes violently!");
                break;
            case 17:
                await You((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "smell hamburgers." : "smell charred flesh.");
                break;
            case 18:
                await You_feel("tired.");
                break;
            case 19:
{
                    /* very occasionally something nice happens. */
                    let i = 0;
                    let j = 0;
                    /* some of these are arbitrary -dlc */
                    let mtmp = null;
                    await adjattrib(A_CHA, 1, (0));
                    for (i = -1; i <= 1; i++) {
                        for (j = -1; j <= 1; j++) {
                            if (!isok(game.u.ux + i, game.u.uy + j)) {
                                continue;
                            }
                            mtmp = (game.level.monsters[game.u.ux + i][game.u.uy + j]);
                            if (mtmp) {
                                await tamedog(mtmp, null, (1));
                            }
                        }
                    }
                    break;
                }
            case 20:
{
                    let pseudo = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
                    let save_conf = game.u.uprops[CONFUSION].intrinsic;
                    /* force 'uncursed' and zero out oextra */
                    Object.assign(pseudo, cg.zeroobj);
                    /* used to be SCR_REMOVE_CURSE but that could cause seffects()
               to have hero discover scroll of remove curse */
                    pseudo.otyp = SPE_REMOVE_CURSE;
                    pseudo.oclass = SPBOOK_CLASS;
                    game.u.uprops[CONFUSION].intrinsic = 0;
                    await seffects(pseudo);
                    game.u.uprops[CONFUSION].intrinsic = save_conf;
                    break;
                }
            default:
                break;
        }
    }
}
/* Set an item on fire.  Return whether the object was destroyed. */
/* if True, skip luck-based protection check */
/* where to place contents of burned up container */
export async function fire_damage(obj, force, x, y) {
    let chance = 0;
    let otmp = null;
    let ncobj = null;
    let in_sight = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && ((game.viz_array[y][x] & 1) != 0);
    let dindx = 0;
    if (await catch_lit(obj)) {
        return (0);
    }
    if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) || obj.otyp == STATUE) {
        switch (obj.otyp) {
            case STATUE:
            case ICE_BOX:
                return (0);
            case CHEST:
                chance = 40;
                break;
            case LARGE_BOX:
                chance = 30;
                break;
            default:
                chance = 20;
                break;
        }
        if ((!force && ((game.u.uluck + game.u.moreluck) + 5) > rn2(chance))) {
            return (0);
        }
        if (in_sight) {
            await pline("%s catches fire and burns.", await Yname2(obj));
        }
        if (((obj).cobj != null)) {
            if (in_sight) {
                await pline("Its contents fall out.");
            }
            for (otmp = obj.cobj; otmp; otmp = ncobj) {
                ncobj = otmp.nobj;
                await obj_extract_self(otmp);
                if (!await flooreffects(otmp, x, y, "")) {
                    await place_object(otmp, x, y);
                }
            }
        }
        await setnotworn(obj);
        await delobj(obj);
        return (1);
    } else if (!force && ((game.u.uluck + game.u.moreluck) + 5) > rn2(20)) {
        return (0);
    } else if (obj.oclass == SCROLL_CLASS || obj.oclass == SPBOOK_CLASS) {
        if (obj.otyp == SCR_FIRE || obj.otyp == SPE_FIREBALL) {
            return (0);
        }
        if (obj.otyp == SPE_BOOK_OF_THE_DEAD) {
            if (in_sight) {
                await pline("Smoke rises from %s.", await the(await xname(obj)));
            }
            return (0);
        }
        dindx = (obj.oclass == SCROLL_CLASS) ? 3 : 4;
        if (in_sight) {
            await pline("%s %s.", await Yname2(obj), destroy_strings[dindx][(obj.quan > 1)]);
        }
        await setnotworn(obj);
        await delobj(obj);
        return (1);
    } else if (obj.oclass == POTION_CLASS) {
        dindx = (obj.otyp != POT_OIL) ? 1 : 2;
        if (in_sight) {
            await pline("%s %s.", await Yname2(obj), destroy_strings[dindx][(obj.quan > 1)]);
        }
        await setnotworn(obj);
        await delobj(obj);
        return (1);
    } else if (await erode_obj(obj, null, 0, 2) == 3) {
        return (1);
    }
    return (0);
}
/*
 * Apply fire_damage() to an entire chain.
 *
 * Return number of objects destroyed. --ALI
 */
export async function fire_damage_chain(chain, force, here, x, y) {
    let obj = null;
    let nobj = null;
    let num = 0;
    /* erode_obj() relies on bhitpos if target objects aren't carried by
       the hero or a monster, to check visibility controlling feedback */
    game.bhitpos.x = x , game.bhitpos.y = y;
    for (obj = chain; obj; obj = nobj) {
        nobj = here ? obj.v.v_nexthere : obj.nobj;
        if (await fire_damage(obj, force, x, y)) {
            ++num;
        }
    }
    if (num && (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !((game.viz_array[y][x] & 1) != 0))) {
        await You("smell smoke.");
    }
    return num;
}
/* obj has been thrown or dropped into lava; damage is worse than mere fire */
export async function lava_damage(obj, x, y) {
    let otyp = obj.otyp;
    let ocls = obj.oclass;
    /* the Amulet, invocation items, and Rider corpses are never destroyed
       (let Book of the Dead fall through to fire_damage() to get feedback) */
    if (obj_resists(obj, 0, 0) && otyp != SPE_BOOK_OF_THE_DEAD) {
        return (0);
    }
    if (game.objects[otyp].oc_material < DRAGON_HIDE && ocls != SCROLL_CLASS && ocls != SPBOOK_CLASS && game.objects[otyp].oc_oprop != FIRE_RES && otyp != WAN_FIRE && otyp != FIRE_HORN && !obj.oerodeproof && !((obj).cobj != null)) {
        if (((game.viz_array[y][x] & 2) != 0)) {
            /* destroy liquid (venom), wax, veggy, flesh, paper (except for scrolls
       and books--let fire damage deal with them), cloth, leather, wood, bone
       unless it's inherently or explicitly fireproof or contains something;
       note: potions are glass so fall through to fire_damage() and boil */
            /* assumes oerodeproof isn't overloaded for some other purpose on
           non-eroding items */
            /* fire_damage() knows how to deal with containers and contents */
            /* this feedback is pretty clunky and can become very verbose
               when former contents of a burned container get here via
               flooreffects() */
            if (obj == game.thrownobj || obj == game.kickedobj) {
                await pline("%s %s up!", ((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "They" : "It", await otense(obj, "burn"));
            } else {
                await You_see("%s hit lava and burn up!", await doname(obj));
            }
        }
        if (((obj).where == 3)) {
            await remove_worn_item(obj, (1));
            await useupall(obj);
        } else {
            await delobj(obj);
        }
        return (1);
    }
    return await fire_damage(obj, (1), x, y);
}
export async function acid_damage(obj) {
    let victim = null;
    let vismon = 0;
    if (!obj) {
        return;
    }
    victim = ((obj).where == 3) ? game.youmonst : ((obj).where == 4) ? obj.v.v_ocarry : null;
    vismon = victim && (victim != game.youmonst) && canseemon(victim);
    if (victim == game.youmonst && inventory_resistance_check(8)) {
        return;
    }
    if (obj.greased) {
        await grease_protect(obj, null, victim);
    } else if (obj.oclass == SCROLL_CLASS && obj.otyp != SCR_BLANK_PAPER) {
        if (obj.otyp != SCR_BLANK_PAPER && obj.otyp != SCR_MAIL) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                if (victim == game.youmonst) {
                    await Your("%s.", await aobjnam(obj, "fade"));
                } else if (vismon) {
                    await pline("%s %s.", s_suffix(await Monnam(victim)), await aobjnam(obj, "fade"));
                }
            }
        }
        obj.otyp = SCR_BLANK_PAPER;
        obj.spe = 0;
        obj.dknown = 0;
    } else {
        await erode_obj(obj, null, 3, 1 | 4);
    }
}
export async function pot_acid_damage(obj, in_invent, described) {
    let bufp = null;
    let one = 0;
    let exploded = 0;
    one = (obj.quan == 1);
    exploded = (0);
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !in_invent) {
        obj.dknown = 0;
    }
    if (game.acid_ctx.ctx_valid) {
        exploded = ((obj.dknown ? game.acid_ctx.dkn_boom : game.acid_ctx.unk_boom) > 0);
    }
    if (described) {
        await pline_The("potion%s %s!", (((obj.quan) == 1) ? "" : "s"), await otense(obj, "explode"));
    } else {
        bufp = await simpleonames(obj);
        await pline("%s%s %s!", !exploded ? (one ? "A " : "Some ") : (one ? "Another " : "More "), bufp, await vtense(bufp, "explode"));
    }
    if (game.acid_ctx.ctx_valid) {
        if (obj.dknown) {
            game.acid_ctx.dkn_boom++;
        } else {
            game.acid_ctx.unk_boom++;
        }
    }
    await setnotworn(obj);
    await delobj(obj);
    if (in_invent) {
        update_inventory();
    }
}
/* Get an object wet and damage it appropriately.
   Returns an erosion return value (ER_*). */
/* might be Null; return ER_NOTHING if so */
/* if non-Null, use instead of cxname() in messages */
/* if True, skip luck-based protection check */
export async function water_damage(obj, ostr, force) {
    let in_invent = obj && ((obj).where == 3);
    let described = (0);
    if (!obj) {
        return 0;
    }
    if (await splash_lit(obj)) {
        return 2;
    }
    if (!ostr) {
        ostr = await cxname(obj);
    }
    if (obj.otyp == CAN_OF_GREASE && obj.spe > 0) {
        return 0;
    } else if (obj.otyp == TOWEL && obj.spe < 7) {
        await wet_a_towel(obj, -rnd(7 - obj.spe), (1));
        return 0;
    } else if (obj.greased) {
        if (!rn2(2)) {
            obj.greased = 0;
            if (in_invent) {
                await pline_The("grease on %s washes off.", await yname(obj));
                /* used to modify potion feedback */
                described = (1);
                update_inventory();
            }
            if (obj.otyp == POT_ACID) {
                await pot_acid_damage(obj, in_invent, described);
                return 3;
            }
        }
        return 1;
    } else if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) && (!((obj).otyp == OILSKIN_SACK || (obj).otyp == ICE_BOX || ((obj).otyp == LARGE_BOX || (obj).otyp == CHEST)) || (obj.cursed && !rn2(3)))) {
        if (in_invent) {
            await pline("Some %s gets into your %s!", hliquid("water"), ostr);
            game.mentioned_water = !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic));
        }
        await water_damage_chain(obj.cobj, (0));
        return 2;
    } else if (((obj).otyp == OILSKIN_SACK || (obj).otyp == ICE_BOX || ((obj).otyp == LARGE_BOX || (obj).otyp == CHEST))) {
        if (in_invent && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uinwater)) {
            await pline_The("%s cannot get into your %s.", hliquid("water"), ostr);
            game.mentioned_water = !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic));
            await discover_object((obj.otyp), (1), (1), (1));
        }
        return 2;
    } else if (!force && ((game.u.uluck + game.u.moreluck) + 5) > rn2(20)) {
        return 0;
    } else if (obj.oclass == SCROLL_CLASS) {
        if (obj.otyp == SCR_BLANK_PAPER || obj.otyp == SCR_MAIL) {
            return 0;
        }
        if (in_invent) {
            await Your("%s %s.", ostr, await vtense(ostr, "fade"));
        }
        obj.otyp = SCR_BLANK_PAPER;
        obj.dknown = 0;
        obj.spe = 0;
        if (in_invent) {
            update_inventory();
        }
        return 2;
    } else if (obj.oclass == SPBOOK_CLASS) {
        let otyp = obj.otyp;
        if (otyp == SPE_BOOK_OF_THE_DEAD) {
            let ox = 0;
            let oy = 0;
            /* note: The Book of the Dead can't be contained or buried */
            if (get_obj_location(obj, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 1 | 2)) {
                obj.ox = ox , obj.oy = oy;
            }
            if (isok(ox, oy) && ((game.viz_array[oy][ox] & 2) != 0)) {
                await pline("Steam rises from %s.", await the(await xname(obj)));
            }
            return 0;
        } else if (otyp == SPE_BLANK_PAPER) {
            return 0;
        }
        if (in_invent) {
            await Your("%s %s.", ostr, await vtense(ostr, "fade"));
        }
        obj.otyp = SPE_BLANK_PAPER;
        /* same re-init as over-reading or polymorph; matters if it gets
           polymorphed into non-blank; doesn't matter if eventually written
           on since that replaces it with new book and studied count of 0 */
        if (obj.usecount) {
            obj.usecount = rn2(obj.usecount);
        }
        obj.dknown = 0;
        if (otyp == SPE_NOVEL) {
            await blank_novel(obj);
        }
        if (in_invent) {
            update_inventory();
        }
        return 2;
    } else if (obj.oclass == POTION_CLASS) {
        if (obj.otyp == POT_ACID) {
            await pot_acid_damage(obj, in_invent, described);
            return 3;
        } else if (obj.oeroded) {
            if (in_invent) {
                await Your("%s %s further.", ostr, await vtense(ostr, "dilute"));
            }
            obj.otyp = POT_WATER;
            obj.dknown = 0;
            obj.blessed = obj.cursed = 0;
            obj.oeroded = 0;
            if (in_invent) {
                update_inventory();
            }
            return 2;
        } else if (obj.otyp != POT_WATER) {
            if (in_invent) {
                await Your("%s %s.", ostr, await vtense(ostr, "dilute"));
            }
            obj.oeroded++;
            if (in_invent) {
                update_inventory();
            }
            return 2;
        }
    } else {
        return await erode_obj(obj, ostr, 1, 0);
    }
    return 0;
}
export async function water_damage_chain(obj, here) {
    let otmp = null;
    let x = 0;
    let y = 0;
    let save_bhitpos = { x: 0, y: 0 };
    if (!obj) {
        return;
    }
    /* initialize acid context: so far, neither seen (dknown) potions of
       acid nor unseen have exploded during this water damage sequence */
    /* reset acid context and bhitpos */
    game.acid_ctx.dkn_boom = game.acid_ctx.unk_boom = 0;
    game.acid_ctx.ctx_valid = (1);
    /* we don't want to permanently overwrite bhitpos below, since we can get
       here from scenarios where it was in use up the call stack (e.g. thrown
       item hurtling the levitating hero into a wall of water) */
    Object.assign(save_bhitpos, game.bhitpos);
    if (get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1)) {
        game.bhitpos.x = x , game.bhitpos.y = y;
    }
    for (; obj; obj = otmp) {
        otmp = here ? obj.v.v_nexthere : obj.nobj;
        await water_damage(obj, null, (0));
    }
    game.acid_ctx.dkn_boom = game.acid_ctx.unk_boom = 0;
    game.acid_ctx.ctx_valid = (0);
    Object.assign(game.bhitpos, save_bhitpos);
}
/*
 * This function is potentially expensive - rolling
 * inventory list multiple times.  Luckily it's seldom needed.
 * Returns TRUE if disrobing made player unencumbered enough to
 * crawl out of the current predicament.
 */
export async function emergency_disrobe(lostsome) {
    let invc = inv_cnt((1));
    while (near_capacity() > ((game.uball != null) ? UNENCUMBERED : SLT_ENCUMBER)) {
        let obj = null;
        let nextobj = null;
        let otmp = null;
        let i = 0;
        if (invc > 0) {
            i = rn2(invc);
            for (obj = game.invent; obj; obj = nextobj) {
                /*
     * A timely interrupt might manage to salvage your life
     * but not your gear.  For scrolls and potions this
     * will destroy whole stacks, where fire resistant hero
     * survivor only loses partial stacks via destroy_items().
     *
     * Flag items to be destroyed before any messages so
     * that player causing hangup at --More-- won't get an
     * emergency save file created before item destruction.
     */
                nextobj = obj.nobj;
                /*
                 * Undroppables are: body armor, boots, gloves,
                 * amulets, and rings because of the time and effort
                 * in removing them + loadstone and other cursed stuff
                 * for obvious reasons.  Also, any item in the midst
                 * of being taken off or stolen.
                 */
                if (!((obj.otyp == LOADSTONE && obj.cursed) || obj == game.uamul || obj == game.uleft || obj == game.uright || obj == game.ublindf || obj == game.uarm || obj == game.uarmc || obj == game.uarmg || obj == game.uarmf || obj == game.uarmu || (obj.cursed && (obj == game.uarmh || obj == game.uarms)) || welded(obj) || obj.o_id == game.stealoid || obj.in_use)) {
                    otmp = obj;
                }
                /* reached the mark and found some stuff to drop? */
                if (--i < 0 && otmp) {
                    break;
                }
            }
        }
        if (!otmp) {
            return (0);
        }
        if (otmp.owornmask) {
            await remove_worn_item(otmp, (0));
        }
        lostsome.value = (1);
        await dropx(otmp);
        invc--;
    }
    return (1);
}
/* pick a random goodpos() next to x,y for monster mtmp.
   mtmp could be &gy.youmonst, uses then crawl_destination().
   returns TRUE if any good position found, with the coord in x,y */
export async function rnd_nextto_goodpos(x, y, mtmp) {
    let i = 0;
    let j = 0;
    let is_u = (mtmp == game.youmonst);
    let nx = 0;
    let ny = 0;
    let k = 0;
    let dirs = [0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < (N_DIRS_Z - 2); ++i) {
        dirs[i] = i;
    }
    for (i = (N_DIRS_Z - 2); i > 0; --i) {
        j = rn2(i);
        k = dirs[j];
        dirs[j] = dirs[i - 1];
        dirs[i - 1] = k;
    }
    for (i = 0; i < (N_DIRS_Z - 2); ++i) {
        nx = x.value + xdir[dirs[i]];
        ny = y.value + ydir[dirs[i]];
        if (is_u ? await crawl_destination(nx, ny) : goodpos(nx, ny, mtmp, 0)) {
            /* crawl_destination and goodpos both include an isok() check */
            x.value = nx;
            y.value = ny;
            return (1);
        }
    }
    return (0);
}
/* print a message about being back on the ground after leaving a pool */
export async function back_on_ground(rescued) {
    let preposit = (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) ? "over" : "on";
    let surf = surface(game.u.ux, game.u.uy);
    let you_are_back = null;
    let icebuf = '';
    if (is_ice(game.u.ux, game.u.uy)) {
        surf = ice_descr(game.u.ux, game.u.uy, icebuf);
    } else if (!strncmpi((surf), ("floor"), -1) || !strncmpi((surf), ("ground"), -1)) {
        surf = "solid ground";
    } else if (!strncmpi((surf), ("bridge"), -1) || !strncmpi((surf), ("altar"), -1) || !strncmpi((surf), ("headstone"), -1)) {
        surf = await an(surf);
    } else if (!strncmpi((surf), ("stairs"), -1) || !strncmpi((surf), ("lava"), -1) || !strncmpi((surf), ("bottom"), -1)) {
        surf = await the(surf);
    } else {
        surf = !strcmp(surf, "air") ? await the(surf) : await an(surf);
        preposit = "in";
    }
    if (rescued) {
        you_are_back = "You find yourself";
    } else {
        you_are_back = game.flags.verbose ? "You are back" : "Back";
    }
    await pline("%s %s %s.", you_are_back, preposit, surf);
    game.iflags.last_msg = PLNMSG_BACK_ON_GROUND;
}
/* life-saving or divine rescue has attempted to get the hero out of hostile
   terrain and put hero in an unexpected spot or failed due to overfull level
   and just prevented death so "back on solid ground" may be inappropriate */
const __rescued_from_terrain_find_yourself = "find yourself";
export async function rescued_from_terrain(how) {
    let lev = game.level.locations[game.u.ux][game.u.uy];
    let mesggiven = (0);
    switch (how) {
        case DROWNING:
            if (is_pool(game.u.ux, game.u.uy)) {
                await You("%s %s of %s.", __rescued_from_terrain_find_yourself, ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || ((lev.typ) == WATER)) ? "in the midst" : "on top", hliquid("water"));
                mesggiven = (1);
            } else if (((lev.typ) == AIR || (lev.typ) == CLOUD)) {
                await You("%s in %s.", __rescued_from_terrain_find_yourself, (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? "an air bubble" : "mid air");
                mesggiven = (1);
            }
            break;
        case BURNING:
        case DISSOLVED:
            if (is_pool(game.u.ux, game.u.uy)) {
                await You("%s %s %s.", __rescued_from_terrain_find_yourself, game.u.uinwater ? "in" : "on", hliquid("water"));
                mesggiven = (1);
            } else if (is_lava(game.u.ux, game.u.uy)) {
                await You("%s on top of %s.", __rescued_from_terrain_find_yourself, hliquid("molten lava"));
                mesggiven = (1);
            }
            break;
        default:
            break;
    }
    if (!mesggiven) {
        await back_on_ground((1));
    }
    game.iflags.last_msg = PLNMSG_BACK_ON_GROUND;
    /* feedback just disclosed this */
    update_lastseentyp(game.u.ux, game.u.uy);
    game.iflags.prev_decor = game.lastseentyp[game.u.ux][game.u.uy];
}
/* return TRUE iff player relocated */
export async function drown() {
    let pool_of_water = null;
    let inpool_ok = (0);
    let i = 0;
    let x = 0;
    let y = 0;
    let is_solid = is_waterwall(game.u.ux, game.u.uy);
    await feel_newsym(game.u.ux, game.u.uy);
    if (game.u.uinwater && is_pool(game.u.ux - game.u.dx, game.u.uy - game.u.dy) && ((game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0)) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)))) {
        if (!rn2(5)) {
            inpool_ok = (1);
        } else {
            return (0);
        }
    }
    if (!game.u.uinwater) {
        await You("%s into the %s%c", is_solid ? "plunge" : "fall", waterbody_name(game.u.ux, game.u.uy), ((game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0)) || (game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))) ? 46 : 33);
        if (!(game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) && !is_solid) {
            await You("sink like %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "the Titanic" : "a rock");
        }
    }
    await water_damage_chain(game.invent, (0));
    if (game.u.umonnum == PM_GREMLIN && rn2(3)) {
        await split_mon(game.youmonst, null);
    } else if (game.u.umonnum == PM_IRON_GOLEM) {
        await You("rust!");
        i = (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((d(2, 6)) + 1) / 2)) : (d(2, 6)));
        if (game.u.mhmax > i) {
            game.u.mhmax -= i;
        }
        await losehp(i, "rusting away", 1);
    }
    if (inpool_ok) {
        return (0);
    }
    if ((i = number_leashed()) > 0) {
        await pline_The("leash%s slip%s loose.", (i > 1) ? "es" : "", (i > 1) ? "" : "s");
        unleash_all();
    }
    if ((game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0)) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)) || (game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0)))) {
        if ((game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0)) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))) {
            if (game.flags.verbose) {
                await pline("But you aren't drowning.");
            }
            if (!(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    await Your("keel hits the bottom.");
                } else {
                    await You("touch bottom.");
                }
            }
        }
        if ((game.uball != null)) {
            await unplacebc();
            await placebc();
        }
        await vision_recalc(2);
        await set_uinwater(1);
        await under_water(1);
        game.vision_full_recalc = 1;
        return (0);
    }
    if (((game.u.uprops[TELEPORT].intrinsic || game.u.uprops[TELEPORT].extrinsic) || (((game.youmonst.data).mflags1 & 33554432) != 0)) && !(game.multi < 0 && (unconscious() || is_fainted())) && ((game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic) || rn2(3) < (game.u.uluck + game.u.moreluck) + 2)) {
        await You("attempt a teleport spell.");
        if (!await noteleport_level(game.youmonst)) {
            await dotele((0));
            if (!is_pool(game.u.ux, game.u.uy)) {
                return (1);
            }
        } else {
            await pline_The("attempted teleport spell fails.");
        }
    }
    if (game.u.usteed) {
        await dismount_steed(DISMOUNT_GENERIC);
        if (!is_pool(game.u.ux, game.u.uy)) {
            return (1);
        }
    }
    if (game.u.usleep) {
        await unmul("Suddenly you wake up!");
    }
    if (is_fainted()) {
        await reset_faint();
    }
    x = game.u.ux , y = game.u.uy;
    if (game.multi >= 0 && game.youmonst.data.mmove && await rnd_nextto_goodpos({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, game.youmonst)) {
        /* have to be able to move in order to crawl */
        let lost = (0);
        let succ = (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? (1) : await emergency_disrobe({ get value() { return lost; }, set value(_v) { lost = _v; } });
        await You("try to crawl out of the %s.", hliquid("water"));
        if (lost) {
            await You("dump some of your gear to lose weight...");
        }
        if (succ) {
            await pline("Pheew!  That was close.");
            await teleds(x, y, 1);
            return (1);
        }
        await pline("But in vain.");
    }
    await set_uinwater(1);
    await urgent_pline("You drown.");
    for (i = 0; i < 2; i++) {
        /* first pass is survivable by using up an amulet of life-saving or by
       answering no to "Die?" in explore|wizard mode; second pass can only
       be survivable via the latter */
        /* killer format and name are reconstructed every iteration
           because lifesaving resets them */
        pool_of_water = waterbody_name(game.u.ux, game.u.uy);
        game.killer.format = 0;
        /* avoid "drowned in [a] water" */
        if (!strcmp(pool_of_water, "water")) {
            pool_of_water = "deep water" , game.killer.format = 1;
        } else if (!strcmp(pool_of_water, "limitless water")) {
            game.killer.format = 1;
        }
        game.killer.name = strcpy(game.killer.name, pool_of_water);
        await done(DROWNING);
        if (await safe_teleds(1 | 2)) {
            break;
        }
        await pline("You're still drowning.");
    }
    if (game.u.uinwater) {
        await set_uinwater(0);
    }
    await rescued_from_terrain(DROWNING);
    return (1);
}
export async function drain_en(n, max_already_drained) {
    let mesg = null;
    let punct = max_already_drained ? 33 : 46;
    if (game.u.uenmax < 1) {
        if (game.u.uen || game.u.uenmax) {
            /*
     * FIXME?
     *  u.uenmax should probably have a higher minimum than 0;
     *  perhaps u.ulevel or (u.ulevel + 1) / 2
     */
            /* energy is completely gone */
            game.u.uen = game.u.uenmax = 0;
            game.disp.botl = (1);
        }
        mesg = "momentarily lethargic";
    } else {
        /* throttle further loss a bit when there's not much left to lose */
        if (n > Math.trunc((game.u.uen + game.u.uenmax) / 3)) {
            n = rnd(n);
        }
        mesg = "your magical energy drain away";
        if (n > game.u.uen) {
            punct = 33;
        }
        game.u.uen -= n;
        if (game.u.uen < 0) {
            game.u.uenmax -= rnd(-game.u.uen);
            if (game.u.uenmax < 0) {
                game.u.uenmax = 0;
            }
            game.u.uen = 0;
        } else if (game.u.uen > game.u.uenmax) {
            /* uen might be greater than uenmax if caller reduced uenmax
               and then we throttled the loss being applied to current */
            game.u.uen = game.u.uenmax;
        }
        game.disp.botl = (1);
    }
    await You_feel("%s%c", mesg, punct);
}
/* the #untrap command - disarm a trap */
export async function dountrap() {
    if (!await could_untrap((1), (0))) {
        return 0;
    }
    return await untrap((0), 0, 0, null) ? 1 : 0;
}
/* preliminary checks for dountrap(); also used for autounlock */
export async function could_untrap(verbosely, check_floor) {
    let buf = '';
    buf = '';
    if (near_capacity() >= HVY_ENCUMBER) {
        buf = strcpy(buf, "You're too strained to do that.");
    } else if (((((game.youmonst.data).mflags1 & 8192) != 0) && !((game.youmonst.data) == game.mons[PM_CAVE_SPIDER] || (game.youmonst.data) == game.mons[PM_GIANT_SPIDER])) || !game.youmonst.data.mmove) {
        buf = strcpy(buf, "And just how do you expect to do that?");
    } else if (game.u.ustuck && sticks(game.youmonst.data)) {
        buf = sprintf(buf, "You'll have to let go of %s first.", await mon_nam(game.u.ustuck));
    } else if (game.u.ustuck || (welded(game.uwep) && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big))) {
        buf = sprintf(buf, "Your %s seem to be too busy for that.", await makeplural(await body_part(HAND)));
    } else if (check_floor && !can_reach_floor((0))) {
        buf = sprintf(buf, "You can't reach the %s.", surface(game.u.ux, game.u.uy));
    }
    if (__nh_char_at0(buf)) {
        if (verbosely) {
            await pline("%s", buf);
        }
        return 0;
    }
    return 1;
}
/* Probability of disabling a trap.  Helge Hafting;
   Returns 0 for success, non-0 for failure. */
/* must not be Null */
export function untrap_prob(ttmp) {
    let chance = 3;
    if (ttmp.ttyp == WEB) {
        /* non-spiders are less adept at dealing with webs */
        /* this assumes that all fiery artifacts are blades; no need to
           make it more complicated unless/until that changes */
        let wep = (game.uwep && (game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_DAGGER && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER)) ? game.uwep : (game.uswapwep && game.u.twoweap && (game.uswapwep.oclass == WEAPON_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp >= P_DAGGER && game.objects[game.uswapwep.otyp].oc_subtyp <= P_SABER)) ? game.uswapwep : null;
        if (wep && !(game.level.monsters[ttmp.tx][ttmp.ty])) {
            /* FIXME? Forcefight of adjacent web works with bare-handed and
           martial arts but #untrap of same resorts to !webmaker() chance */
            /* primary or secondary weapon is a blade (which includes
               daggers but not axes or bladed polearms) */
            if (is_art(game.uwep, ART_STING) || attacks(2, wep)) {
                chance = 1;
            }
        } else if (!((game.youmonst.data) == game.mons[PM_CAVE_SPIDER] || (game.youmonst.data) == game.mons[PM_GIANT_SPIDER])) {
            chance = 7;
        }
    }
    if (game.u.uprops[CONFUSION].intrinsic || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        chance++;
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        chance++;
    }
    if (game.u.uprops[STUNNED].intrinsic) {
        chance += 2;
    }
    if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) {
        chance *= 2;
    }
    /* Your own traps are better known than others. */
    if (ttmp.madeby_u) {
        chance--;
    }
    if ((game.urole.mnum == (PM_RANGER)) && ttmp.ttyp == BEAR_TRAP && chance <= 3) {
        return 0;
    }
    if ((game.urole.mnum == (PM_ROGUE))) {
        if (rn2(2 * 30) < game.u.ulevel) {
            chance--;
        }
        if (game.u.uhave.questart && chance > 1) {
            chance--;
        }
    } else if ((game.urole.mnum == (PM_RANGER)) && chance > 1) {
        chance--;
    }
    if (chance < 1) {
        chance = 1;
    }
    return rn2(chance);
}
/* Replace trap with object(s).  Helge Hafting */
export async function cnv_trap_obj(otyp, cnt, ttmp, bury_it) {
    let otmp = await mksobj(otyp, (1), (0));
    let mtmp = null;
    otmp.quan = cnt;
    otmp.owt = await weight(otmp);
    /* Only dart traps are capable of being poisonous */
    if (otyp != DART) {
        otmp.otrapped = 0;
    }
    await place_object(otmp, ttmp.tx, ttmp.ty);
    if (bury_it) {
        await bury_an_obj(otmp, null);
    } else {
        if (ttmp.madeby_u) {
            await sellobj(otmp, ttmp.tx, ttmp.ty);
        }
        await stackobj(otmp);
    }
    await newsym(ttmp.tx, ttmp.ty);
    if (game.u.utrap && ((ttmp.tx) == game.u.ux && (ttmp.ty) == game.u.uy)) {
        await reset_utrap((1));
    }
    if (((mtmp = (game.level.monsters[ttmp.tx][ttmp.ty])) != null) && mtmp.mtrapped) {
        mtmp.mtrapped = 0;
    }
    await deltrap(ttmp);
}
/* whether moving to a trap location is moving "into" the trap or "onto" it */
export function into_vs_onto(traptype) {
    switch (traptype) {
        case BEAR_TRAP:
        case PIT:
        case SPIKED_PIT:
        case HOLE:
        case TELEP_TRAP:
        case LEVEL_TELEP:
        case MAGIC_PORTAL:
        case WEB:
            return (1);
    }
    return (0);
}
/* while attempting to disarm an adjacent trap, we've fallen into it */
export async function move_into_trap(ttmp) {
    let bc = 0;
    let x = ttmp.tx;
    let y = ttmp.ty;
    let bx = 0;
    let by = 0;
    let cx = 0;
    let cy = 0;
    let unused = 0;
    bx = by = cx = cy = 0;
    if (await test_move(game.u.ux, game.u.uy, sgn(x - game.u.ux), sgn(y - game.u.uy), 1) && (!(game.uball != null) || await drag_ball(x, y, { get value() { return bc; }, set value(_v) { bc = _v; } }, { get value() { return bx; }, set value(_v) { bx = _v; } }, { get value() { return by; }, set value(_v) { by = _v; } }, { get value() { return cx; }, set value(_v) { cx = _v; } }, { get value() { return cy; }, set value(_v) { cy = _v; } }, { get value() { return unused; }, set value(_v) { unused = _v; } }, (1)))) {
        /* we know there's no monster in the way and we're not trapped, but
       need to make sure the move is not diagonally into or out of a
       doorway; the sgn() calls are redundant since ttmp is adjacent */
        /* move hero and update map */
        game.u.ux0 = game.u.ux , game.u.uy0 = game.u.uy;
        await u_on_newpos(x, y);
        game.u.umoved = (1);
        await newsym(game.u.ux0, game.u.uy0);
        await vision_recalc(1);
        await check_leash(game.u.ux0, game.u.uy0);
        if ((game.uball != null)) {
            await move_bc(0, bc, bx, by, cx, cy);
        }
        /* marking the trap unseen forces dotrap() to treat it like a new
           discovery and prevents pickup() -> look_here() -> check_here()
           from giving a redundant "there is a <trap> here" message when
           there are objects covering this trap */
        ttmp.tseen = 0;
        /* spoteffects() -> dotrap(,FAILEDUNTRAP) */
        game.iflags.failing_untrap++;
        await spoteffects((1));
        game.iflags.failing_untrap--;
        /* this should no longer be necessary; before the failing_untrap
           hack, Flying hero would not trigger an unseen bear trap and
           setting it not-yet-seen above resulted in leaving it hidden */
        if ((ttmp = t_at(game.u.ux, game.u.uy)) != null) {
            ttmp.tseen = 1;
        }
        await exercise(A_WIS, (0));
    } else {
        await pline("Fortunately, you don't move %s it.", into_vs_onto(ttmp.ttyp) ? "into" : "onto");
    }
}
/* 0: doesn't even try; 1: tries and fails; 2: succeeds */
export async function try_disarm(ttmp, force_failure) {
    let mtmp = (game.level.monsters[ttmp.tx][ttmp.ty]);
    let ttype = ttmp.ttyp;
    let under_u = (!game.u.dx && !game.u.dy);
    let holdingtrap = (ttype == BEAR_TRAP || ttype == WEB);
    if (mtmp && (!mtmp.mtrapped || !holdingtrap)) {
        await pline("%s is in the way.", await Monnam(mtmp));
        return 0;
    }
    if (sobj_at(BOULDER, ttmp.tx, ttmp.ty) && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && !under_u) {
        await There("is a boulder in your way.");
        return 0;
    }
    if (game.u.dx && game.u.dy && bad_rock(game.youmonst.data, game.u.ux, ttmp.ty) && bad_rock(game.youmonst.data, ttmp.tx, game.u.uy)) {
        if ((game.invent && (inv_weight() + weight_cap() > WT_TOOMUCH_DIAGONAL)) || ((game.youmonst.data).msize >= 3)) {
            await You("are unable to reach the %s!", trapname(ttype, (0)));
            return 0;
        }
    }
    if (!can_reach_floor(under_u)) {
        if (game.u.usteed && (game.u.weapon_skills[P_RIDING].skill) < P_BASIC) {
            await rider_cant_reach();
        } else {
            await You("are unable to reach the %s!", trapname(ttype, (0)));
        }
        return 0;
    }
    if (force_failure || untrap_prob(ttmp)) {
        if (rnl(5)) {
            await pline("Whoops...");
            if (mtmp) {
                if (ttype == BEAR_TRAP) {
                    if (mtmp.mtame) {
                        await abuse_dog(mtmp);
                    }
                    mtmp.mhp -= rnd(4);
                    if (((mtmp).mhp < 1)) {
                        await killed(mtmp);
                    }
                } else if (ttype == WEB) {
                    let ttmp2 = t_at(game.u.ux, game.u.uy);
                    if (!((game.youmonst.data) == game.mons[PM_CAVE_SPIDER] || (game.youmonst.data) == game.mons[PM_GIANT_SPIDER]) && !rn2(3) && (ttmp2 ? (ttmp2.ttyp == WEB) : (ttmp2 = await maketrap(game.u.ux, game.u.uy, WEB)) != null)) {
                        await pline_The("web sticks to you.  You're caught too!");
                        await dotrap(ttmp2, 2);
                        if (game.u.usteed && game.u.utrap) {
                            await dismount_steed(DISMOUNT_FELL);
                        }
                    }
                    if (mtmp.mtrapped) {
                        await pline("%s remains entangled.", await Monnam(mtmp));
                    }
                }
            } else if (under_u) {
                await dotrap(ttmp, 64);
            } else {
                await move_into_trap(ttmp);
            }
        } else {
            await pline("%s %s is difficult to %s.", ttmp.madeby_u ? "Your" : under_u ? "This" : "That", trapname(ttype, (0)), (ttype == WEB) ? "remove" : "disarm");
        }
        return 1;
    }
    return 2;
}
export async function reward_untrap(ttmp, mtmp) {
    if (!ttmp.madeby_u) {
        if (rnl(10) < 8 && !mtmp.mpeaceful && !((mtmp).msleeping || !(mtmp).mcanmove) && !mtmp.mfrozen && !(((mtmp.data).mflags1 & 65536) != 0) && !(((mtmp.data).geno & 4096) != 0) && mtmp.data.mlet != S_HUMAN) {
            mtmp.mpeaceful = 1;
            set_malign(mtmp);
            await pline("%s is grateful.", await Monnam(mtmp));
        }
        if (!rn2(3) && !rnl(8) && game.u.ualign.type == 1) {
            /* Helping someone out of a trap is a nice thing to do.
           A lawful may be rewarded, but not too often.  */
            adjalign(1);
            await You_feel("that you did the right thing.");
        }
    }
}
/* Help a monster out of a bear trap or web, or if no monster is
   present, disarm a bear trap or destroy a web.  Helge Hafting */
export async function disarm_holdingtrap(ttmp) {
    let mtmp = null;
    let which = c_common_strings.c_the_your[ttmp.madeby_u];
    let fails = await try_disarm(ttmp, (0));
    if (fails < 2) {
        return fails;
    }
    if ((mtmp = (game.level.monsters[ttmp.tx][ttmp.ty])) != null) {
        mtmp.mtrapped = 0;
        await You("extract %s from %s %s.", await mon_nam(mtmp), which, (ttmp.ttyp == BEAR_TRAP) ? "bear trap" : "web");
        await reward_untrap(ttmp, mtmp);
    } else if (ttmp.ttyp == BEAR_TRAP) {
        await You("disarm %s bear trap.", which);
        await cnv_trap_obj(BEARTRAP, 1, ttmp, (0));
    } else if (ttmp.ttyp == WEB) {
        let wep = (game.uwep && (game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_DAGGER && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER)) ? game.uwep : (game.uswapwep && game.u.twoweap && (game.uswapwep.oclass == WEAPON_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp >= P_DAGGER && game.objects[game.uswapwep.otyp].oc_subtyp <= P_SABER)) ? game.uswapwep : null;
        if (wep && wep.oartifact && (is_art(game.uwep, ART_STING) || attacks(2, wep))) {
            await pline("%s %s through %s web!", await bare_artifactname(game.uwep), is_art(game.uwep, ART_STING) ? "cuts" : "burns", which);
        } else if (wep) {
            await You("cut through %s web.", which);
        } else {
            await You("succeed in removing %s web.", which);
        }
        await deltrap(ttmp);
    }
    await newsym(game.u.ux + game.u.dx, game.u.uy + game.u.dy);
    return 1;
}
/* Helge Hafting */
export async function disarm_landmine(ttmp) {
    let fails = await try_disarm(ttmp, (0));
    if (fails < 2) {
        return fails;
    }
    await You("disarm %s land mine.", c_common_strings.c_the_your[ttmp.madeby_u]);
    await cnv_trap_obj(LAND_MINE, 1, ttmp, (0));
    return 1;
}
/* getobj callback for object to disarm a squeaky board with */
export function unsqueak_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    if (obj.otyp == CAN_OF_GREASE) {
        return GETOBJ_SUGGEST;
    }
    if (obj.otyp == POT_OIL && obj.dknown && game.objects[POT_OIL].oc_name_known) {
        return GETOBJ_SUGGEST;
    }
    /* downplay all other potions, including unidentified oil
     * Potential extension: if oil is known, skip this and exclude all other
     * potions. */
    if (obj.oclass == POTION_CLASS) {
        return GETOBJ_DOWNPLAY;
    }
    return GETOBJ_EXCLUDE;
}
/* it may not make much sense to use grease on floor boards, but so what? */
export async function disarm_squeaky_board(ttmp) {
    let obj = null;
    let bad_tool = 0;
    let fails = 0;
    obj = await getobj("untrap with", unsqueak_ok, 2);
    if (!obj) {
        return 0;
    }
    bad_tool = (obj.cursed || ((obj.otyp != POT_OIL || obj.lamplit) && (obj.otyp != CAN_OF_GREASE || !obj.spe)));
    fails = await try_disarm(ttmp, bad_tool);
    if (fails < 2) {
        return fails;
    }
    if (obj.otyp == CAN_OF_GREASE) {
        await consume_obj_charge(obj, (1));
    } else {
        await useup(obj);
        await discover_object((POT_OIL), (1), (1), (1));
    }
    await You("repair the squeaky board.");
    await deltrap(ttmp);
    await newsym(game.u.ux + game.u.dx, game.u.uy + game.u.dy);
    await more_experienced(1, 5);
    await newexplevel();
    return 1;
}
/* removes traps that shoot arrows, darts, etc. */
export async function disarm_shooting_trap(ttmp, otyp) {
    let fails = await try_disarm(ttmp, (0));
    if (fails < 2) {
        return fails;
    }
    await You("disarm %s trap.", c_common_strings.c_the_your[ttmp.madeby_u]);
    await cnv_trap_obj(otyp, 50 - rnl(50), ttmp, (0));
    return 1;
}
/* trying to #untrap a monster from a pit; is the weight too heavy? */
/* trapped monster */
/* pit, possibly made by hero, or spiked pit */
/* monster (corpse weight) + (stuff ? minvent weight : 0) */
/* False: monster w/o minvent; True: w/ minvent */
export async function try_lift(mtmp, ttmp, xtra_wt, stuff) {
    if (calc_capacity(xtra_wt) >= HVY_ENCUMBER) {
        await pline("%s is %s for you to lift.", await Monnam(mtmp), stuff ? "carrying too much" : "too heavy");
        if (!ttmp.madeby_u && !mtmp.mpeaceful && mtmp.mcanmove && !(((mtmp.data).mflags1 & 65536) != 0) && mtmp.data.mlet != S_HUMAN && rnl(10) < 3) {
            mtmp.mpeaceful = 1;
            set_malign(mtmp);
            await pline("%s thinks it was nice of you to try.", await Monnam(mtmp));
        }
        return 0;
    }
    return 1;
}
/* Help trapped monster (out of a (spiked) pit) */
export async function help_monster_out(mtmp, ttmp) {
    let xtra_wt = 0;
    let otmp = null;
    let uprob = 0;
    if (!mtmp.mtrapped) {
        await pline("%s isn't trapped.", await Monnam(mtmp));
        return 0;
    }
    if (await check_capacity(null)) {
        return 1;
    }
    if ((uprob = untrap_prob(ttmp)) != 0 && !((mtmp).msleeping || !(mtmp).mcanmove)) {
        await You("try to reach out your %s, but %s backs away skeptically.", await makeplural(await body_part(ARM)), await mon_nam(mtmp));
        return 1;
    }
    if (((mtmp.data) == game.mons[PM_COCKATRICE] || (mtmp.data) == game.mons[PM_CHICKATRICE]) && !game.uarmg && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        let mtmp_pmname = mon_pmname(mtmp);
        await You("grab the trapped %s using your bare %s.", mtmp_pmname, await makeplural(await body_part(HAND)));
        if (poly_when_stoned(game.youmonst.data) && await polymon(PM_STONE_GOLEM)) {
            await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        } else {
            let kbuf = '';
            kbuf = sprintf(kbuf, "trying to help %s out of a pit", await an(mtmp_pmname));
            await instapetrify(kbuf);
            return 1;
        }
    }
    if (uprob) {
        await You("try to grab %s, but cannot get a firm grasp.", await mon_nam(mtmp));
        if (mtmp.msleeping) {
            mtmp.msleeping = 0;
            await pline("%s awakens.", await Monnam(mtmp));
        }
        return 1;
    }
    await You("reach out your %s and grab %s.", await makeplural(await body_part(ARM)), await mon_nam(mtmp));
    if (mtmp.msleeping) {
        mtmp.msleeping = 0;
        await pline("%s awakens.", await Monnam(mtmp));
    } else if (mtmp.mfrozen && !rn2(mtmp.mfrozen)) {
        /* After such manhandling, perhaps the effect wears off */
        mtmp.mcanmove = 1;
        mtmp.mfrozen = 0;
        await pline("%s stirs.", await Monnam(mtmp));
    }
    /* is the monster too heavy? */
    xtra_wt = mtmp.data.cwt;
    if (!await try_lift(mtmp, ttmp, xtra_wt, (0))) {
        return 1;
    }
    if (mtmp.minvent) {
        for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
            xtra_wt += otmp.owt;
        }
        if (!await try_lift(mtmp, ttmp, xtra_wt, (1))) {
            return 1;
        }
    }
    await You("pull %s out of the pit.", await mon_nam(mtmp));
    mtmp.mtrapped = 0;
    await reward_untrap(ttmp, mtmp);
    await fill_pit(mtmp.mx, mtmp.my);
    return 1;
}
export async function disarm_box(box, force, confused) {
    if (box.otrapped) {
        let ch = (acurr(A_DEX)) + game.u.ulevel;
        if ((game.urole.mnum == (PM_ROGUE))) {
            ch *= 2;
        }
        if (!force && (confused || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || rnd(75 + Math.trunc(await level_difficulty() / 2)) > ch)) {
            await chest_trap(box, FINGER, (1));
        } else {
            await You("disarm it!");
            box.otrapped = 0;
            box.tknown = 1;
            await more_experienced(8, 0);
            await newexplevel();
        }
        await exercise(A_DEX, (1));
    } else {
        await pline("That %s was not trapped.", await xname(box));
        box.tknown = 0;
    }
}
/* check a particular container for a trap and optionally disarm it */
export async function untrap_box(box, force, confused) {
    if ((box.otrapped && (force || (!confused && rn2(30 + 1 - game.u.ulevel) < 10))) || box.tknown || (!force && confused && !rn2(3))) {
        if (!(box.tknown && box.dknown)) {
            await You("find a trap on %s!", await the(await xname(box)));
        } else {
            await pline("There's a trap on %s.", await the(await xname(box)));
        }
        box.tknown = 1;
        await observe_object(box);
        if (!confused) {
            await exercise(A_WIS, (1));
        }
        if (await yn_function("Disarm it?", ynqchars, 113, (1)) == 121) {
            await disarm_box(box, force, confused);
        }
    } else {
        await You("find no traps on %s.", await the(await xname(box)));
    }
}
/* hero is able to attempt untrap, so do so */
export async function untrap(force, rx, ry, container) {
    let otmp = null;
    let x = 0;
    let y = 0;
    let ch = 0;
    let ttmp = null;
    let mtmp = null;
    let trapdescr = null;
    let here = 0;
    let useplural = 0;
    let deal_with_floor_trap = 0;
    let confused = (game.u.uprops[CONFUSION].intrinsic || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)));
    let trap_skipped = (0);
    let autounlock_door = (0);
    let boxcnt = 0;
    let the_trap = '';
    let qbuf = '';
    /* 'force' is true for #invoke; if carrying MKoT, make it be true
       for #untrap or autounlock */
    if (!force && has_magic_key(game.youmonst)) {
        force = (1);
    }
    if (!rx && !container) {
        if (!await getdir(null)) {
            return 0;
        }
        x = game.u.ux + game.u.dx;
        y = game.u.uy + game.u.dy;
    } else {
        if (container) {
            await untrap_box(container, force, confused);
            return 1;
        }
        /* levl[rx][ry] is a locked or trapped door */
        x = rx , y = ry;
        autounlock_door = (1);
    }
    if (!isok(x, y)) {
        await pline_The("perils lurking there are beyond your grasp.");
        return 0;
    }
    ttmp = t_at(x, y);
    if (ttmp && !ttmp.tseen) {
        ttmp = null;
    }
    trapdescr = ttmp ? trapname(ttmp.ttyp, (0)) : null;
    here = ((x) == game.u.ux && (y) == game.u.uy);
    if (here) {
        for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
            if (((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST)) {
                /* are there are one or more containers here? */
                if (++boxcnt > 1) {
                    break;
                }
            }
        }
    }
    deal_with_floor_trap = can_reach_floor((0));
    if (autounlock_door) {
        ;
    } else if (!deal_with_floor_trap) {
        the_trap = '';
        if (ttmp) {
            the_trap = strcat(the_trap, await an(trapdescr));
        }
        if (ttmp && boxcnt) {
            the_trap = strcat(the_trap, " and ");
        }
        if (boxcnt) {
            the_trap = strcat(the_trap, (boxcnt == 1) ? "a container" : "containers");
        }
        useplural = ((ttmp && boxcnt > 0) || boxcnt > 1);
        if (ttmp || boxcnt) {
            await There("%s %s %s but you can't reach %s%s.", useplural ? "are" : "is", the_trap, here ? "here" : "there", useplural ? "them" : "it", game.u.usteed ? " while mounted" : "");
        }
        trap_skipped = (ttmp != null);
    } else {
        if (ttmp) {
            the_trap = strcpy(the_trap, await the(trapdescr));
            if (boxcnt) {
                if (((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT)) {
                    await You_cant("do much about %s%s.", the_trap, game.u.utrap ? " that you're stuck in" : " while standing on the edge of it");
                    trap_skipped = (1);
                    deal_with_floor_trap = (0);
                } else {
                    qbuf = nh_snprintf("untrap", 5942, qbuf, 128 /* sizeof(char [128]) */, "There %s and %s here.  %s %s?", (boxcnt == 1) ? "is a container" : "are containers", await an(trapdescr), (ttmp.ttyp == WEB) ? "Remove" : "Disarm", the_trap);
                    switch (await yn_function(qbuf, ynqchars, 113, (1))) {
                        case 113:
                            return 0;
                        case 110:
                            trap_skipped = (1);
                            deal_with_floor_trap = (0);
                            break;
                    }
                }
            }
            if (deal_with_floor_trap) {
                if (game.u.utrap) {
                    await You("cannot deal with %s while trapped%s!", the_trap, ((x) == game.u.ux && (y) == game.u.uy) ? " in it" : "");
                    return 1;
                }
                if ((mtmp = (game.level.monsters[x][y])) != null && (((mtmp).m_ap_type & 7) == M_AP_FURNITURE || ((mtmp).m_ap_type & 7) == M_AP_OBJECT)) {
                    await stumble_onto_mimic(mtmp);
                    return 1;
                }
                switch (ttmp.ttyp) {
                    case BEAR_TRAP:
                    case WEB:
                        return await disarm_holdingtrap(ttmp);
                    case LANDMINE:
                        return await disarm_landmine(ttmp);
                    case SQKY_BOARD:
                        return await disarm_squeaky_board(ttmp);
                    case DART_TRAP:
                        return await disarm_shooting_trap(ttmp, DART);
                    case ARROW_TRAP:
                        return await disarm_shooting_trap(ttmp, ARROW);
                    case PIT:
                    case SPIKED_PIT:
                        if (here) {
                            await You("are already on the edge of the pit.");
                            return 0;
                        }
                        if (!mtmp) {
                            await pline("Try filling the pit instead.");
                            return 0;
                        }
                        return await help_monster_out(mtmp, ttmp);
                    default:
                        await You("cannot disable %s trap.", !here ? "that" : "this");
                        return 0;
                }
            }
        }
        if (boxcnt) {
            for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
                /* 5.0: this used to allow searching for traps on multiple
               containers on the same move and needed to keep track of
               whether any had been found but not attempted to untrap;
               now at most one per move may be checked and we only
               continue on to door handling if they are all declined */
                if (!((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST)) {
                    continue;
                }
                if (otmp.tknown && otmp.dknown) {
                    await safe_qbuf(qbuf, "Disarm this ", null, otmp, xname, ansimpleoname, "a box");
                } else {
                    await safe_qbuf(qbuf, "There is ", " here.  Check it for traps?", otmp, doname, ansimpleoname, "a box");
                }
                switch (await yn_function(qbuf, ynqchars, 113, (1))) {
                    case 113:
                        return 0;
                    case 121:
                        if (otmp.tknown && otmp.dknown) {
                            await disarm_box(otmp, force, confused);
                        } else {
                            await untrap_box(otmp, force, confused);
                        }
                        /* even for 'no' at "Disarm it?" prompt */
                        return 1;
                }
            }
            await There("are no other chests or boxes here.");
        }
        if (await stumble_on_door_mimic(x, y)) {
            return 1;
        }
    }
    if (!((game.level.locations[x][y].typ) == DOOR)) {
        if (!trap_skipped) {
            await You("know of no traps there.");
        }
        return 0;
    }
    switch (game.level.locations[x][y].flags) {
        case 0:
            await You("%s no door there.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "see");
            return 0;
        case 2:
            await pline("This door is safely open.");
            return 0;
        case 1:
            await pline("This door is broken.");
            return 0;
    }
    if (((game.level.locations[x][y].flags & 16) != 0 && (force || (!confused && rn2(30 - game.u.ulevel + 11) < 10))) || (!force && confused && !rn2(3))) {
        await You("find a trap on the door!");
        await exercise(A_WIS, (1));
        if (await yn_function("Disarm it?", ynqchars, 113, (1)) != 121) {
            return 1;
        }
        if (game.level.locations[x][y].flags & 16) {
            ch = 15 + ((game.urole.mnum == (PM_ROGUE)) ? game.u.ulevel * 3 : game.u.ulevel);
            await exercise(A_DEX, (1));
            if (!force && (confused || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || rnd(75 + Math.trunc(await level_difficulty() / 2)) > ch)) {
                await You("set it off!");
                await b_trapped("door", FINGER);
                game.level.locations[x][y].flags = 0;
                unblock_point(x, y);
                await newsym(x, y);
                if (in_rooms(x, y, SHOPBASE)) {
                    await add_damage(x, y, 0);
                }
            } else {
                await You("disarm it!");
                game.level.locations[x][y].flags &= ~16;
                await more_experienced(8, 0);
                await newexplevel();
            }
        } else {
            await pline("This door was not trapped.");
        }
        return 1;
    } else {
        await You("find no traps on the door.");
        return 1;
    }
}
/* for magic unlocking; returns true if targeted monster (which might
   be hero) gets untrapped; the trap remains intact */
/* set to true iff hero notices the effect;
                       * otherwise left with its previous value intact */
export async function openholdingtrap(mon, noticed) {
    let t = null;
    let tdummy = { ntrap: null, tx: 0, ty: 0, dst: { dnum: 0, dlevel: 0 }, launch: { x: 0, y: 0 }, ttyp: 0, tseen: 0, once: 0, madeby_u: 0, vl: { v_launch_otyp: 0, v_launch2: { x: 0, y: 0 }, v_conjoined: 0, v_tnote: 0 } };
    let buf = '';
    let whichbuf = '';
    let trapdescr = null;
    let which = null;
    let ishero = (mon == game.youmonst);
    if (!mon) {
        return (0);
    }
    if (mon == game.u.usteed) {
        ishero = (1);
    }
    t = t_at(ishero ? game.u.ux : mon.mx, ishero ? game.u.uy : mon.my);
    if (ishero && game.u.utrap) {
        if (!t) {
            /* all u.utraptype values are holding traps */
            /* there might not be any trap at hero's spot for tt_buriedball;
           conversely, there might be an unrelated trap at that spot */
            t = tdummy;
            /* fallback 't' is now nonNull, t->tseen and t->madeby_u are 0 */
            memset(t, 0, 1 /* sizeof(struct trap) */) , t.ntrap = null;
        }
        which = c_common_strings.c_the_your[(!t || !t.tseen || !t.madeby_u) ? 0 : 1];
        switch (game.u.utraptype) {
            case TT_LAVA:
                trapdescr = "molten lava";
                break;
            case TT_INFLOOR:
                trapdescr = "ground";
                break;
            case TT_BURIEDBALL:
                trapdescr = "your anchor";
                which = "";
                break;
            case TT_BEARTRAP:
            case TT_PIT:
            case TT_WEB:
                trapdescr = defsyms[(game.u.utraptype == TT_WEB) ? S_web : (game.u.utraptype == TT_PIT) ? S_pit : S_bear_trap].explanation;
                break;
            default:
                trapdescr = "trap";
                break;
        }
    } else {
        /* if no trap here or it's not a holding trap, we're done */
        if (!t || (t.ttyp != BEAR_TRAP && t.ttyp != WEB)) {
            return (0);
        }
        trapdescr = trapname(t.ttyp, (0));
    }
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    if (!which) {
        which = t.tseen ? c_common_strings.c_the_your[t.madeby_u] : strchr(vowels, __nh_char_at0(trapdescr)) ? "an" : "a";
    }
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    if (__nh_char_at0(which)) {
        which = strcat(strcpy(whichbuf, which), " ");
    }
    if (ishero) {
        if (!game.u.utrap) {
            return (0);
        }
        noticed.value = (1);
        if (!game.u.usteed) {
            buf = strcpy(buf, "You are");
        } else if (game.u.utraptype == TT_BURIEDBALL) {
            buf = sprintf(buf, "You and %s are", await y_monnam(game.u.usteed));
        } else {
            buf = sprintf(buf, "%s is", await noit_Monnam(game.u.usteed));
        }
        await pline("%s released from %s%s.", buf, which, trapdescr);
        game.vision_full_recalc = 1;
        await reset_utrap((1));
        if (game.vision_full_recalc) {
            await vision_recalc(0);
        }
    } else {
        if (!mon.mtrapped) {
            return (0);
        }
        mon.mtrapped = 0;
        if ((canseemon(mon) || sensemon(mon))) {
            noticed.value = (1);
            await pline("%s is released from %s%s.", await Monnam(mon), which, trapdescr);
        } else if (((game.viz_array[t.ty][t.tx] & 2) != 0) && t.tseen) {
            noticed.value = (1);
            if (t.ttyp == WEB) {
                await pline("%s is released from %s%s.", c_common_strings.c_Something, which, trapdescr);
            } else {
                await pline("%s%s opens.", upstart(strcpy(buf, which)), trapdescr);
            }
        }
        /* might pacify monster if adjacent */
        if (rn2(2) && (dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 2)) {
            await reward_untrap(t, mon);
        }
    }
    return (1);
}
/* for magic locking; returns true if targeted monster (which might
   be hero) gets hit by a trap (might avoid actually becoming trapped) */
/* set to true iff hero notices the effect;
                       * otherwise left with its previous value intact */
export async function closeholdingtrap(mon, noticed) {
    let t = null;
    let dotrapflags = 0;
    let ishero = (mon == game.youmonst);
    let result = 0;
    if (!mon) {
        return (0);
    }
    if (mon == game.u.usteed) {
        ishero = (1);
    }
    t = t_at(ishero ? game.u.ux : mon.mx, ishero ? game.u.uy : mon.my);
    if (!t || (t.ttyp != BEAR_TRAP && t.ttyp != WEB)) {
        return (0);
    }
    if (ishero) {
        if (game.u.utrap) {
            return (0);
        }
        noticed.value = (1);
        dotrapflags = 1;
        /* dotrap calls mintrap when mounted hero encounters a web */
        if (game.u.usteed) {
            dotrapflags |= 2;
        }
        await dotrap(t, dotrapflags | 1);
        result = (game.u.utrap != 0);
    } else {
        if (mon.mtrapped) {
            return (0);
        }
        /* you notice it if you see the trap close/tremble/whatever
           or if you sense the monster who becomes trapped */
        noticed.value = ((game.viz_array[t.ty][t.tx] & 2) != 0) || (canseemon(mon) || sensemon(mon));
        result = (await mintrap(mon, 1) != Trap_Effect_Finished);
    }
    return result;
}
/* for magic unlocking; returns true if targeted monster (which might
   be hero) gets hit by a trap (target might avoid its effect) */
/* set to true iff hero notices the effect; */
export async function openfallingtrap(mon, trapdoor_only, noticed) {
    let t = null;
    let ishero = (mon == game.youmonst);
    let result = 0;
    if (!mon) {
        return (0);
    }
    if (mon == game.u.usteed) {
        ishero = (1);
    }
    t = t_at(ishero ? game.u.ux : mon.mx, ishero ? game.u.uy : mon.my);
    /* if no trap here or it's not a falling trap, we're done
       (note: falling rock traps have a trapdoor in the ceiling) */
    if (!t || ((t.ttyp != TRAPDOOR && t.ttyp != ROCKTRAP) && (trapdoor_only || (t.ttyp != HOLE && !((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT))))) {
        return (0);
    }
    if (ishero) {
        if (game.u.utrap) {
            return (0);
        }
        noticed.value = (1);
        await dotrap(t, 1);
        result = (game.u.utrap != 0);
    } else {
        if (mon.mtrapped) {
            return (0);
        }
        noticed.value = ((game.viz_array[t.ty][t.tx] & 2) != 0) || (canseemon(mon) || sensemon(mon));
        await wakeup(mon, (1));
        result = (await mintrap(mon, 1) != Trap_Effect_Finished);
    }
    return result;
}
/* only called when the player is doing something to the chest directly;
   returns True if chest is destroyed, False if it remains in play */
export async function chest_trap(obj, bodypart, disarm) {
    let otmp = obj;
    let otmp2 = null;
    let buf = '';
    let msg = null;
    let cc = { x: 0, y: 0 };
    if (get_obj_location(obj, { get value() { return cc.x; }, set value(_v) { cc.x = _v; } }, { get value() { return cc.y; }, set value(_v) { cc.y = _v; } }, 0)) {
        obj.ox = cc.x , obj.oy = cc.y;
    }
    /* for xname(); will be set to 1 below */
    otmp.tknown = 0;
    otmp.otrapped = 0;
    await You(disarm ? "set it off!" : "trigger a trap!");
    await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
    if ((game.u.uluck + game.u.moreluck) > -13 && rn2(13 + (game.u.uluck + game.u.moreluck)) > 7) {
        switch (rn2(13)) {
            case 12:
            case 11:
                msg = "explosive charge is a dud";
                break;
            case 10:
            case 9:
                msg = "electric charge is grounded";
                break;
            case 8:
            case 7:
                msg = "flame fizzles out";
                break;
            case 6:
            case 5:
            case 4:
                msg = "poisoned needle misses";
                break;
            case 3:
            case 2:
            case 1:
            case 0:
                msg = "gas cloud blows away";
                break;
            default:
                await impossible("chest disarm bug");
                msg = null;
                break;
        }
        if (msg) {
            await pline("But luckily the %s!", msg);
        }
    } else {
        switch (rn2(20) ? (((game.u.uluck + game.u.moreluck) >= 13) ? 0 : rn2(13 - (game.u.uluck + game.u.moreluck))) : rn2(26)) {
            case 25:
            case 24:
            case 23:
            case 22:
            case 21:
{
                    let shkp = null;
                    let loss = 0;
                    let costly = 0;
                    let insider = 0;
                    let chestgone = 0;
                    let ox = obj.ox;
                    let oy = obj.oy;
                    costly = (await costly_spot(ox, oy) && (shkp = await shop_keeper(in_rooms(ox, oy, SHOPBASE))) != null);
                    insider = (game.u.ushops && inside_shop(game.u.ux, game.u.uy) && in_rooms(ox, oy, SHOPBASE) == game.u.ushops);
                    await pline("%s!", await Tobjnam(obj, "explode"));
                    buf = sprintf(buf, "exploding %s", await xname(obj));
                    if (costly) {
                        loss += await stolen_value(obj, ox, oy, shkp.mpeaceful, (1));
                    }
                    await delete_contents(obj);
                    /*
             * Note:  the explosion is taking place at the chest's
             * location, not necessarily at the hero's.  (Simplest
             * case: kicking it from one step away and getting the
             * chest_trap() outcome.)
             */
                    /* unpunish() in advance if either ball or chain (or both)
               is going to be destroyed */
                    if ((game.uball != null) && ((game.uchain.ox == ox && game.uchain.oy == oy) || (game.uball.where == 1 && game.uball.ox == ox && game.uball.oy == oy))) {
                        await unpunish();
                    }
                    /* destroy everything at the spot (the Amulet, the
               invocation tools, and Rider corpses will remain intact);
               usually the chest will be destroyed along with the stuff at
               this spot, but not if it is being carried */
                    chestgone = (0);
                    for (otmp = game.level.objects[ox][oy]; otmp; otmp = otmp2) {
                        otmp2 = otmp.v.v_nexthere;
                        if (costly) {
                            loss += await stolen_value(otmp, otmp.ox, otmp.oy, shkp.mpeaceful, (1));
                        }
                        if (otmp == obj) {
                            chestgone = (1);
                        }
                        await delobj(otmp);
                    }
                    await wake_nearby((0));
                    await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((d(6, 6)) + 1) / 2)) : (d(6, 6))), buf, 0);
                    await exercise(A_STR, (0));
                    if (costly && loss) {
                        if (insider) {
                            await You("owe %ld %s for objects destroyed.", loss, await currency(loss));
                        } else {
                            await You("caused %ld %s worth of damage!", loss, await currency(loss));
                            await make_angry_shk(shkp, ox, oy);
                        }
                    }
                    if (chestgone) {
                        return (1);
                    }
                    break;
                }
            case 20:
            case 19:
            case 18:
            case 17:
                await pline("A cloud of noxious gas billows from %s.", await the(await xname(obj)));
                if (rn2(3)) {
                    await poisoned("gas cloud", A_STR, "cloud of poison gas", 15, (0));
                } else {
                    await create_gas_cloud(obj.ox, obj.oy, 1, 8);
                }
                await exercise(A_CON, (0));
                break;
            case 16:
            case 15:
            case 14:
            case 13:
                await You_feel("a needle prick your %s.", await body_part(bodypart));
                await poisoned("needle", A_CON, "poisoned needle", 10, (0));
                await exercise(A_CON, (0));
                break;
            case 12:
            case 11:
            case 10:
            case 9:
                await dofiretrap(obj);
                break;
            case 8:
            case 7:
            case 6:
{
                    let dmg = d(4, 4);
                    let orig_dmg = dmg;
                    await You("are jolted by a surge of electricity!");
                    if ((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
                        await shieldeff(game.u.ux, game.u.uy);
                        await You("don't seem to be affected.");
                        monstseesu(M_SEEN_ELEC);
                        dmg = 0;
                    } else {
                        monstunseesu(M_SEEN_ELEC);
                    }
                    await destroy_items(game.youmonst, 6, orig_dmg);
                    if (dmg) {
                        await losehp(dmg, "electric shock", 0);
                    }
                    break;
                }
            case 5:
            case 4:
            case 3:
                if (!game.u.uprops[FREE_ACTION].extrinsic) {
                    await pline("Suddenly you are frozen in place!");
                    nomul(-d(5, 6));
                    game.multi_reason = "frozen by a trap";
                    await exercise(A_DEX, (0));
                    game.nomovemsg = c_common_strings.c_You_can_move_again;
                } else {
                    await You("momentarily stiffen.");
                }
                break;
            case 2:
            case 1:
            case 0:
                await pline("A cloud of %s gas billows from %s.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? blindgas[rn2((Math.trunc(6 /* sizeof(const char *const [6]) */ / 1 /* sizeof(const char *const) */)))] : rndcolor(), await the(await xname(obj)));
                if (!game.u.uprops[STUNNED].intrinsic) {
                    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                        await pline("What a groovy feeling!");
                    } else {
                        await You("%s%s...", stagger(game.youmonst.data, "stagger"), (game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic) ? "" : ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? " and get dizzy" : " and your vision blurs");
                    }
                }
                await make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + (rn2(7) + (16)), (0));
                await make_hallucinated((game.u.uprops[HALLUC].intrinsic & 16777215) + (rn2(5) + (16)), (0), 0);
                break;
            default:
                await impossible("bad chest trap");
                break;
        }
        await bot();
    }
    /* hero knows chest is no longer trapped */
    obj.tknown = 1;
    return (0);
}
export function t_at(x, y) {
    let trap = game.ftrap;
    while (trap) {
        if (trap.tx == x && trap.ty == y) {
            return trap;
        }
        trap = trap.ntrap;
    }
    return null;
}
/* return number of traps of type ttyp on this level */
export function count_traps(ttyp) {
    let ret = 0;
    let trap = game.ftrap;
    while (trap) {
        if (trap.ttyp == ttyp) {
            ret++;
        }
        trap = trap.ntrap;
    }
    return ret;
}
export async function deltrap(trap) {
    let ttmp = null;
    clear_conjoined_pits(trap);
    if (trap == game.ftrap) {
        game.ftrap = game.ftrap.ntrap;
    } else {
        for (ttmp = game.ftrap; ttmp; ttmp = ttmp.ntrap) {
            if (ttmp.ntrap == trap) {
                break;
            }
        }
        if (!ttmp) {
            await panic("deltrap: no preceding trap!");
        }
        ttmp.ntrap = trap.ntrap;
    }
    if (game.level.flags.sokoban_rules && (trap.ttyp == PIT || trap.ttyp == HOLE)) {
        maybe_finish_sokoban();
    }
    free((trap));
}
export function conjoined_pits(trap2, trap1, u_entering_trap2) {
    let dx = 0;
    let dy = 0;
    let diridx = 0;
    let adjidx = 0;
    if (!trap1 || !trap2) {
        return (0);
    }
    if (!isok(trap2.tx, trap2.ty) || !isok(trap1.tx, trap1.ty) || !((trap2.ttyp) == PIT || (trap2.ttyp) == SPIKED_PIT) || !((trap1.ttyp) == PIT || (trap1.ttyp) == SPIKED_PIT) || (u_entering_trap2 && !(game.u.utrap && game.u.utraptype == TT_PIT))) {
        return (0);
    }
    dx = sgn(trap2.tx - trap1.tx);
    dy = sgn(trap2.ty - trap1.ty);
    diridx = xytodir(dx, dy);
    if (diridx != DIR_ERR) {
        adjidx = (((diridx) + 4) % (N_DIRS_Z - 2));
        if ((trap1.vl.v_conjoined & (1 << diridx)) && (trap2.vl.v_conjoined & (1 << adjidx))) {
            return (1);
        }
    }
    return (0);
}
export function clear_conjoined_pits(trap) {
    let diridx = 0;
    let adjidx = 0;
    let x = 0;
    let y = 0;
    let t = null;
    if (trap && ((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT)) {
        for (diridx = 0; diridx < (N_DIRS_Z - 2); ++diridx) {
            if (trap.vl.v_conjoined & (1 << diridx)) {
                x = trap.tx + xdir[diridx];
                y = trap.ty + ydir[diridx];
                if (isok(x, y) && (t = t_at(x, y)) != null && ((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT)) {
                    adjidx = (((diridx) + 4) % (N_DIRS_Z - 2));
                    t.vl.v_conjoined &= ~(1 << adjidx);
                }
                trap.vl.v_conjoined &= ~(1 << diridx);
            }
        }
    }
}
export function adj_nonconjoined_pit(adjtrap) {
    let trap_with_u = t_at(game.u.ux0, game.u.uy0);
    if (trap_with_u && adjtrap && game.u.utrap && game.u.utraptype == TT_PIT && ((trap_with_u.ttyp) == PIT || (trap_with_u.ttyp) == SPIKED_PIT) && ((adjtrap.ttyp) == PIT || (adjtrap.ttyp) == SPIKED_PIT)) {
        if (xytodir(game.u.dx, game.u.dy) != DIR_ERR) {
            return (1);
        }
    }
    return (0);
}
/*
 * Mark all neighboring pits as conjoined pits.
 * (currently not called from anywhere)
 */
/*0*/
/*
 * Returns TRUE if you escaped a pit and are standing on the precipice.
 */
export function uteetering_at_seen_pit(trap) {
    return (trap && ((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT) && trap.tseen && ((trap.tx) == game.u.ux && (trap.ty) == game.u.uy) && !(game.u.utrap && game.u.utraptype == TT_PIT));
}
/*
 * Returns TRUE if you didn't fall through a hole or didn't
 * release a trap door
 */
export function uescaped_shaft(trap) {
    return (trap && ((trap.ttyp) == HOLE || (trap.ttyp) == TRAPDOOR) && trap.tseen && ((trap.tx) == game.u.ux && (trap.ty) == game.u.uy));
}
/* Destroy a trap that emanates from the floor. */
export async function delfloortrap(ttmp) {
    if (ttmp && ((ttmp.ttyp == SQKY_BOARD) || (ttmp.ttyp == BEAR_TRAP) || (ttmp.ttyp == LANDMINE) || (ttmp.ttyp == FIRE_TRAP) || ((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT) || ((ttmp.ttyp) == HOLE || (ttmp.ttyp) == TRAPDOOR) || (ttmp.ttyp == TELEP_TRAP) || (ttmp.ttyp == LEVEL_TELEP) || (ttmp.ttyp == WEB) || (ttmp.ttyp == MAGIC_TRAP) || (ttmp.ttyp == ANTI_MAGIC))) {
        let mtmp = null;
        if (((ttmp.tx) == game.u.ux && (ttmp.ty) == game.u.uy)) {
            if (game.u.utraptype != TT_BURIEDBALL) {
                await reset_utrap((1));
            }
        } else if ((mtmp = (game.level.monsters[ttmp.tx][ttmp.ty])) != null) {
            mtmp.mtrapped = 0;
        }
        await deltrap(ttmp);
        return (1);
    }
    return (0);
}
/* used for doors (also tins).  can be used for anything else that opens. */
export async function b_trapped(item, bodypart) {
    let lvl = await level_difficulty();
    let dmg = rnd(5 + (lvl < 5 ? lvl : 2 + Math.trunc(lvl / 2)));
    ;
    await pline("KABOOM!!  %s was booby-trapped!", await The(item));
    await wake_nearby((0));
    await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "explosion", 0);
    await exercise(A_STR, (0));
    if (bodypart != NO_PART) {
        await exercise(A_CON, (0));
    }
    await make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + dmg, (1));
}
/* Monster is hit by trap. */
/* missile's attack level */
/* target */
/* missile; might be Null */
/* non-zero: force hit for this amount of damage */
/* True: a trap is completely burning up the target */
export async function thitm(tlev, mon, obj, d_override, nocorpse) {
    let strike = 0;
    let trapkilled = (0);
    if (d_override) {
        strike = 1;
    } else if (obj) {
        strike = (find_mac(mon) + tlev + obj.spe <= rnd(20));
    } else {
        strike = (find_mac(mon) + tlev <= rnd(20));
    }
    if (!strike) {
        /* Actually more accurate than thitu, which doesn't take
     * obj->spe into account.
     */
        if (obj && ((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
            await pline_mon(mon, "%s is almost hit by %s!", await Monnam(mon), await doname(obj));
        }
    } else {
        let dam = 1;
        let harmless = (obj && ((game.objects[(obj).otyp].oc_material == GEMSTONE || (game.objects[(obj).otyp].oc_material == MINERAL)) && (obj).oclass != RING_CLASS) && ((((mon.data).mflags1 & 8) != 0) && !(((mon.data).mflags1 & 1048576) != 0)));
        if (obj && ((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
            await pline_mon(mon, "%s is hit by %s%s", await Monnam(mon), await doname(obj), harmless ? " but is not harmed." : "!");
        }
        if (d_override) {
            dam = d_override;
        } else if (obj) {
            dam = await dmgval(obj, mon);
            if (dam < 1) {
                dam = 1;
            }
        }
        if (!harmless) {
            mon.mhp -= dam;
            if (mon.mhp <= 0) {
                let xx = mon.mx;
                let yy = mon.my;
                await monkilled(mon, "", nocorpse ? -242 : 0);
                if (((mon).mhp < 1)) {
                    await newsym(xx, yy);
                    trapkilled = (1);
                }
            }
        } else {
            /* harmless; don't use up the missile */
            strike = 0;
        }
    }
    if (obj && (!strike || d_override)) {
        await place_object(obj, mon.mx, mon.my);
        await stackobj(obj);
    } else if (obj) {
        await dealloc_obj(obj);
    }
    return trapkilled;
}
export function unconscious() {
    if (game.multi >= 0) {
        return (0);
    }
    return (game.u.usleep || (game.nomovemsg && (!strncmp(game.nomovemsg, "You awake", 9) || !strncmp(game.nomovemsg, "You regain con", 14) || !strncmp(game.nomovemsg, "You are consci", 14))));
}
const lava_killer = "molten lava";
/* hero enters pool of molten lava; returns True if hero is killed and
   then life-saved (with teleport to safe spot), False for other survival;
   no return at all if hero dies and isn't life-saved */
export async function lava_effects() {
    let obj = null;
    let obj2 = null;
    let nextobj = null;
    let usurvive = 0;
    let boil_away = 0;
    let protect_oid = 0;
    let burncount = 0;
    let burnmesgcount = 0;
    let dmg = 0;
    burn_stuff: {
        protect_oid = 0;
        burncount = 0;
        burnmesgcount = 0;
        /* only applicable for water walking */
        dmg = d(6, 6);
        if (game.iflags.in_lava_effects) {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/trap.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    await pline("Skipping recursive lava_effects().");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            return (0);
        }
        await feel_newsym(game.u.ux, game.u.uy);
        await burn_away_slime();
        if ((game.youmonst.data == game.mons[PM_FIRE_ELEMENTAL] || game.youmonst.data == game.mons[PM_SALAMANDER])) {
            return (0);
        }
        usurvive = (game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) || (((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) && dmg < game.u.uhp);
        if (!usurvive) {
            for (obj = game.invent; obj; obj = nextobj) {
                nextobj = obj.nobj;
                if (obj.in_use) {
                    if (!protect_oid) {
                        /* remove_worn_item() sets in_use */
                        /* one item can be protected from burning up [accommodates
                   steal(AMULET_OF_FLYING) -> remove_worn_item() -> fall
                   into lava (which happens before item is transferred
                   from invent to thief->minvent)]; item will still be in
                   inventory when we return to caller or save bones (or
                   perform hangup save if that occurs) */
                        protect_oid = obj.o_id;
                        obj.in_use = 0;
                    } else {
                        await impossible("lava_effects: '%s' (#%u) is already in use; so is #%u.", await simpleonames(obj), obj.o_id, protect_oid);
                    }
                    continue;
                }
                /* set obj->in_use for items which will be destroyed below */
                if (((game.objects[obj.otyp].oc_material <= WOOD) || obj.oclass == POTION_CLASS) && !obj.oerodeproof && game.objects[obj.otyp].oc_oprop != FIRE_RES && obj.otyp != SCR_FIRE && obj.otyp != SPE_FIREBALL && !obj_resists(obj, 0, 0)) {
                    /* skip protected item; caller expects to retain access */
                    /* was cleared when setting protect_oid */
                    obj.in_use = 1;
                }
            }
        }
        if (game.uarmf && (game.uarmf.in_use || ((game.objects[game.uarmf.otyp].oc_material <= WOOD) && !game.uarmf.oerodeproof))) {
            /* Check whether we should burn away boots *first* so we know whether to
     * make the player sink into the lava. Assumption: water walking only
     * comes from boots.
     * (5.0: that assumption is no longer true, but having boots be the first
     * thing to come into contact with lava makes sense.)
     */
            obj = game.uarmf;
            await pline("%s into flame!", await Yobjnam2(obj, "burst"));
            ++burnmesgcount;
            /* prevent remove_worn_item() -> Boots_off(WATER_WALKING_BOOTS) ->
           spoteffects() -> lava_effects() recursion which would
           successfully delete (via useupall) the no-longer-worn boots;
           once recursive call returned, we would try to delete them again
           here in the outer call (and access stale memory, probably panic) */
            game.iflags.in_lava_effects++;
            await Boots_off();
            if (obj.o_id != protect_oid) {
                await useup(obj);
            }
            game.iflags.in_lava_effects--;
            ++burncount;
        }
        /* ordinarily we'd have to be fire resistant to survive long
           enough to become stuck in lava, but it can happen without
           resistance if water walking boots allow survival and then
           get burned up; u.utrap time will be quite short in that case */
        if (!(game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
            if (((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) {
                await pline_The("%s here burns you!", hliquid("lava"));
                if (usurvive) {
                    await losehp(dmg, lava_killer, 1);
                    break burn_stuff;
                }
            } else {
                await You("fall into the %s!", waterbody_name(game.u.ux, game.u.uy));
            }
            usurvive = game.u.uprops[LIFESAVED].extrinsic || game.flags.explore;
            if (game.flags.debug) {
                usurvive = (1);
            }
            game.iflags.in_lava_effects++;
            for (obj = game.invent; obj; obj = obj2) {
                obj2 = obj.nobj;
                if (obj.o_id == protect_oid) {
                    obj.in_use = 1;
                } else if (obj.otyp == SPE_BOOK_OF_THE_DEAD) {
                    if (usurvive && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await pline("%s glows a strange %s, but remains intact.", await The(await xname(obj)), hcolor("dark red"));
                    }
                } else if (obj.in_use) {
                    if (obj.owornmask) {
                        if (usurvive) {
                            await pline("%s into flame!", await Yobjnam2(obj, "burst"));
                            ++burnmesgcount;
                        }
                        await remove_worn_item(obj, (1));
                    }
                    await useupall(obj);
                    ++burncount;
                }
            }
            if (usurvive && burncount > burnmesgcount) {
                await pline("%s item%s in your inventory %s been destroyed.", (burnmesgcount > 0) ? ((burncount - burnmesgcount == 1) ? "Another" : "Other") : ((burncount == 1) ? "An" : "Some"), (((burncount - burnmesgcount) == 1) ? "" : "s"), (burncount - burnmesgcount == 1) ? "has" : "have");
            }
            boil_away = (game.u.umonnum == PM_WATER_ELEMENTAL || game.u.umonnum == PM_STEAM_VORTEX || game.u.umonnum == PM_FOG_CLOUD);
            for (burncount = 0; burncount < 2; ++burncount) {
                /* burn to death; if hero is life-saved on the first pass, try
           to teleport to safety; if that fails, burn all over again */
                game.u.uhp = -1;
                /* killer format and name are reconstructed every iteration
               because lifesaving resets them */
                game.killer.format = 1;
                game.killer.name = strcpy(game.killer.name, lava_killer);
                await urgent_pline("You %s...", boil_away ? "boil away" : "burn to a crisp");
                await done(BURNING);
                if (await safe_teleds(1 | 2)) {
                    break;
                }
                await pline("You're still burning.");
            }
            game.iflags.in_lava_effects--;
            if (burncount == 2) {
                /* life-saved twice (second time must have been due to declining
               to die in wizard|explore mode) and failed to be teleported
               to safety both times; moveloop() will just drop the hero into
               the lava again on next move so take countermeasures to give
               the player--or the debug fuzzer--a chance to try something
               else instead of just immediately burning up all over again */
                if (!(game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                    set_itimeout({ get value() { return game.u.uprops[FIRE_RES].intrinsic; }, set value(_v) { game.u.uprops[FIRE_RES].intrinsic = _v; } }, 5);
                }
                if (!((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) {
                    set_itimeout({ get value() { return game.u.uprops[WWALKING].intrinsic; }, set value(_v) { game.u.uprops[WWALKING].intrinsic = _v; } }, 5);
                }
                break burn_stuff;
            }
            await rescued_from_terrain(BURNING);
            await spoteffects((0));
            return (1);
        } else if (!((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) && (!game.u.utrap || game.u.utraptype != TT_LAVA)) {
            boil_away = !(game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic);
            /* if not fire resistant, sink_into_lava() will quickly be fatal;
           hero needs to escape immediately */
            set_utrap(((rn2(4) + (4)) + ((boil_away ? 2 : (rn2(4) + (12))) << 8)), TT_LAVA);
            await You("sink into the %s%s!", waterbody_name(game.u.ux, game.u.uy), !boil_away ? ", but it only burns slightly" : " and are about to be immolated");
            if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                monstseesu(M_SEEN_FIRE);
            } else {
                monstunseesu(M_SEEN_FIRE);
            }
            if (game.u.uhp > 1) {
                await losehp(!boil_away ? 1 : (Math.trunc(game.u.uhp / 2)), lava_killer, 1);
            }
        }
    }
    await destroy_items(game.youmonst, 2, dmg);
    await ignite_items(game.invent);
    return (0);
}
/* called each turn when trapped in lava */
const __sink_into_lava_sink_deeper = "You sink deeper into the lava.";
export async function sink_into_lava() {
    if (!game.u.utrap || game.u.utraptype != TT_LAVA) {
        ;
    } else if (!is_lava(game.u.ux, game.u.uy)) {
        await reset_utrap((0));
    } else if (!game.u.uinvulnerable) {
        if (!(game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
            game.u.uhp = Math.trunc((game.u.uhp + 2) / 3);
        }
        game.u.utrap -= (1 << 8);
        if (game.u.utrap < (1 << 8)) {
            game.killer.format = 1;
            game.killer.name = strcpy(game.killer.name, "molten lava");
            await urgent_pline("You sink below the surface and die.");
            await burn_away_slime();
            await done(DISSOLVED);
            await reset_utrap((1));
            /* levitation or flight have become unblocked, otherwise Tport */
            if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
                await safe_teleds(1 | 2);
            }
        } else if (!game.u.umoved) {
            if (game.u.uprops[SLIMED].intrinsic && rnd(10 - 1) >= (game.u.uprops[SLIMED].intrinsic & 16777215)) {
                await pline(__sink_into_lava_sink_deeper);
                await burn_away_slime();
            } else {
                await Norep(__sink_into_lava_sink_deeper);
            }
            game.u.utrap += rnd(4);
        }
    }
}
/* called when something has been done (breaking a boulder, for instance)
   which entails a luck penalty if performed on a sokoban level */
export function sokoban_guilt() {
    if (game.level.flags.sokoban_rules) {
        game.u.uconduct.sokocheat++;
        /*
         * TODO:
         *  Issue some feedback so that player can learn that whatever
         *  he/she just did is a naughty thing to do in sokoban and
         *  should probably be avoided in future....
         *
         *  Caveat:  doing this might introduce message sequencing
         *  issues, depending upon feedback during the various actions
         *  which trigger Sokoban luck penalties.
         */
        change_luck(-1);
    }
}
/* called when a trap has been deleted or had its ttyp replaced */
export function maybe_finish_sokoban() {
    let t = null;
    if (game.level.flags.sokoban_rules && !game.in_mklev) {
        for (t = game.ftrap; t; t = t.ntrap) {
            /* scan all remaining traps, ignoring any created by the hero;
           if this level has no more pits or holes, the current sokoban
           puzzle has been solved */
            if (t.madeby_u) {
                continue;
            }
            if (t.ttyp == PIT || t.ttyp == HOLE) {
                break;
            }
        }
        if (!t) {
            /* for livelog to report the sokoban depth in the way that
               players tend to think about it: 1 for entry level, 4 for top */
            let sokonum = game.dungeons[game.u.uz.dnum].entry_lev - game.u.uz.dlevel + 1;
            game.level.flags.sokoban_rules = 0;
            /* we've passed the last trap without finding a pit or hole;
               clear the sokoban_rules flag so that luck penalties for
               things like breaking boulders or jumping will no longer
               be given, and restrictions on diagonal moves are lifted */
            /* clear svl.level.flags.sokoban_rules */
            /*
             * TODO: give some feedback about solving the sokoban puzzle
             * (perhaps say "congratulations" in Japanese?).
             */
            /* log the completion event regardless of whether or not
               any normal in-game feedback has just been given */
            livelog_printf(4096 | 16384, "completed %d%s Sokoban level", sokonum, ordin(sokonum));
        }
    }
}
/* Return the string name of the trap type passed in, unless the player is
   hallucinating, in which case return a random or hallucinatory trap name. */
/* if True, ignore Hallucination */
/* riffs on actual nethack traps */
/* some traps found in nethack variants */
/* plausible real-life traps */
/* miscellaneous suggestions */
const __trapname_halu_trapnames = ["bottomless pit", "polymorphism trap", "devil teleporter", "falling boulder trap", "anti-anti-magic field", "weeping gas trap", "queasy board", "electrified web", "owlbear trap", "sand mine", "vacillating triangle", "death trap", "disintegration trap", "ice trap", "monochrome trap", "axeblade trap", "pool of boiling oil", "pool of quicksand", "field of caltrops", "buzzsaw trap", "spiked floor", "revolving wall", "uneven floor", "finger trap", "jack-in-a-box", "yellow snow", "booby trap", "rat trap", "poisoned nail", "snare", "whirlpool", "trip wire", "roach motel (tm)", "negative space", "tensor field", "singularity", "imperial fleet", "black hole", "thermal detonator", "event horizon", "entoptic phenomenon", "sweet-smelling gas vent", "phone booth", "exploding runes", "never-ending elevator", "slime pit", "warp zone", "illusory floor", "pile of poo", "honey trap", "tourist trap", "banana peel", "garden rake", "whoopie cushion", "box and stick trap", "fly trap", "legal trap", "pit of snakes", "pollywog trap", "slippery slope", "thirst trap", "suntrap"];
let __trapname_roletrap = '';
__nh_register_static(() => { __trapname_roletrap = ''; });
export function trapname(ttyp, override) {
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !override) {
        /* [17 + 5 + 1] should suffice */
        let total_names = TRAPNUM + (Math.trunc(62 /* sizeof(const char *const [62]) */ / 1 /* sizeof(const char *const) */));
        let nameidx = rn2_on_display_rng(total_names + 1);
        if (nameidx == total_names) {
            let fem = (game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female;
            /* inspired by "tourist trap" */
            __trapname_roletrap = copynchars(__trapname_roletrap, rn2(3) ? ((fem && game.urole.name.f) ? game.urole.name.f : game.urole.name.m) : rank_of(game.u.ulevel, (game.urole.mnum), fem), (33 /* sizeof(char [33]) */ - 6 /* sizeof(char [6]) */));
            __trapname_roletrap = strcat(__trapname_roletrap, " trap");
            return lcase(__trapname_roletrap);
        } else if (nameidx >= TRAPNUM) {
            nameidx -= TRAPNUM;
            return __trapname_halu_trapnames[nameidx];
        }
        /* else use an actual trap type */
        if (nameidx != NO_TRAP) {
            ttyp = nameidx;
        }
    }
    return defsyms[(S_arrow_trap + (ttyp) - 1)].explanation;
}
/* Ignite ignitable items (limited to light sources) in the given object
   chain, due to some external source of fire.  The object chain should
   be somewhere exposed, like someone's open inventory or the floor. */
export async function ignite_items(objchn) {
    let obj = null;
    let nextobj = null;
    let bynexthere = (objchn && objchn.where == 1);
    for (obj = objchn; obj; obj = bynexthere ? obj.v.v_nexthere : nextobj) {
        nextobj = obj.nobj;
        if (!obj.lamplit && !obj.in_use) {
            await catch_lit(obj);
        }
    }
}
export async function trap_ice_effects(x, y, ice_is_melting) {
    let ttmp = t_at(x, y);
    if (ttmp && ice_is_melting) {
        let mtmp = null;
        if (((mtmp = (game.level.monsters[x][y])) != null) && mtmp.mtrapped) {
            mtmp.mtrapped = 0;
        }
        if (ttmp.ttyp == LANDMINE || ttmp.ttyp == BEAR_TRAP) {
            /* landmine or bear trap set on top of the ice falls
               into the water */
            let otyp = (ttmp.ttyp == LANDMINE) ? LAND_MINE : BEARTRAP;
            await cnv_trap_obj(otyp, 1, ttmp, (1));
        } else {
            if (!((ttmp.ttyp) == MAGIC_PORTAL || (ttmp.ttyp) == VIBRATING_SQUARE)) {
                await deltrap(ttmp);
            }
        }
    }
}
/* sanity check traps */
export async function trap_sanity_check() {
    let ttmp = game.ftrap;
    while (ttmp) {
        if (!isok(ttmp.tx, ttmp.ty)) {
            await impossible("trap sanity: location (%i,%i)", ttmp.tx, ttmp.ty);
        }
        if (ttmp.ttyp <= NO_TRAP || ttmp.ttyp >= TRAPNUM) {
            await impossible("trap sanity: type (%i)", ttmp.ttyp);
        }
        ttmp = ttmp.ntrap;
    }
}
/*trap.c*/
/* unwear otmp before deleting it */
/* otmp remains in hero's invent; if we get here because
                   it is being burned up by lava, we don't need to worry
                   about unwearing levitation boots and having that
                   trigger float_down to then fall in again; if such
                   were being worn, they wouldn't be in the lava now */
/* results in otmp->where==OBJ_FREE; delobj() doesn't care */
/* worn but not in hero invent or monster minvent ? */
/* avoid ultimately hostile co-aligned unicorn */
/* subset of set_levltyp() after changing ice to floor;
                   frozen corpses resume rotting, no more ice to melt away */
/*
         * some cases which can happen when digging
         * down while phasing thru solid areas
         */
/* set_levltyp doesn't take care of this [yet?] */
/* hero didn't fall through, but any objects here might */
/* "the|your|Manlobbi's statue [of a wombat]" */
/* avoid "of a shopkeeper" if it's Manlobbi himself
                    (if carried, it can't be unpaid--hence won't be
                    described as "Manlobbi's statue"--because there
                    wasn't any living shk when statue was picked up) */
/* They don't know it's a statue */
/* if this isn't caused by a monster using a wand of striking,
       there might be consequences for the hero */
/* if statue is owned by a shop, hero will have to pay for it;
           stolen_value gives a message (about debt or use of credit)
           which refers to "it" so needs to follow a message describing
           the object ("the statue comes to life" one above) */
/* avoid charging for Manlobbi's statue of Manlobbi
               if stone-to-flesh is used on petrified shopkeep */
/* transfer any statue contents to monster's inventory */
/* in case statue is wielded and hero zaps stone-to-flesh at self */
/*
     * Try to animate the first valid statue.  Stop the loop when we
     * actually create something or the failure cause is not because
     * the mon was unique.
     */
/* if damage triggered life-saving,
                                poison is limited to attrib loss */
/* normally passes_rocks() would protect against a falling
                   rock, but not when wearing a helmet */
/* steed died, hero not trapped */
/* exclude weapon(s) because cases 1 and 2 do them */
/* note: these don't need locomotion() handling;
                          if fatal while poly'd and Unchanging, the
                          death reason will be overridden with
                          "killed while stuck in creature form" */
/* openfallingtrap; not inescapable here */
/* normally done in fall_through */
/* A magic trap.  Monsters usually immune. */
/* iron shoes protect against antimagic traps only if
           positively enchanted; the trap drains the enchantment
           rather than the wearer */
/* no message if a monster does this, it isn't visible enough */
/* opposite of magical explosion */
/* Trap did nothing; don't remove it --KAA */
/* delete trap before polymorph */
/* remove and readd the shoes to forcibly unwear them */
/* iron shoes protect against much of the damage from the
       explosion, but you still take some damage (and wound legs)
       because they can't fully block the blast */
/* monsters recursively fall into new pit */
/* a boulder may fill the new pit, crushing monster */
/* thitm may have already destroyed the trap */
/* if this is a known trap, the player may have known there wasn't
               a lined up boulder, so use a shorter message to avoid --More--
               spam */
/* messages handled elsewhere; the trap symbol is merely to mark the
           square for future reference */
/* notice something (hearing uses a larger threshold
                   for 'nearby') */
/* can hit anything; even noncorporeal monsters might get a blessed
           projectile */
/* ground-based traps, which can be evaded by levitation, flying, or
           hanging to the ceiling */
/* mon knows scroll of fire or spellbook of fireball
                       won't be affected; hero knows iff this one has been
                       seen and its type has been discovered */
/* never hurts anything, but player is considered non-immune so they
           can be asked about entering it */
/* The "air currents" message is still appropriate -- even when
         * the hero isn't flying or levitating -- because it conveys the
         * reason why the player cannot escape the trap with a dexterity
         * check, clinging to the ceiling, etc.
         */
/* then proceed to normal trap effect */
/* do force "pit" while hallucinating */
/*
     * Note:
     *  Most references to trap types here don't use trapname() for
     *  hallucination.  This could be considered to be a bug but doing
     *  that would hide the actual trap situation from the player which
     *  would be somewhat harsh for what's usually a minor impairment.
     */
/* no in_sight check here; you can feel it even if blind */
/* newcham() will probably end up calling poly_steed() */
/* or could be null if scatter blew up oil which melted ice */
/* convert landmine into pit */
/* use otrapped as a flag to ohitmon */
/* 20% chance of picking current level; 100% chance for
                       that if in single-level branch (Knox) or in endgame */
/* in case it's beneath something, redisplay the something */
/* is currently in the trap */
/* If you come upon an obviously trapped monster, then
               you must be able to see the trap it's in too. */
/* Monster is aggravated by being trapped by you.
           Recognizing who made the trap isn't completely
           unreasonable; everybody has their own style. */
/* give a "<mon> is slowing down" message and also remove
       intrinsic speed (comparable to similar effect on the hero) */
/* Or your secondary weapon, if wielded [hypothetical; we don't
       allow two-weapon combat when either weapon is a corpse] */
/* if life-saved, might not be able to continue wielding */
/* being chained to the floor blocks levitation from floating
               above that floor but not from enhancing carrying capacity */
/* when still trapped, float_vs_flight() below will block levitation */
/* FIXME: this isn't correct for trapper/lurker above */
/* levitation gives maximum carrying capacity, so encumbrance
       state might be reduced */
/* carrying capacity might have changed */
/* check for falling into pool - added by GAN 10/20/86 */
/* u.uinwater msgs already in spoteffects()/drown() */
/* Justification elsewhere for Sokoban traps is based
                     * on air currents.  This is consistent with that.
                     * The unexpected additional force of the air currents
                     * once levitation ceases knocks you off your feet.
                     */
/* levitation gives maximum carrying capacity, so having it end
       potentially triggers greater encumbrance; do this after
       'come down' messages, before trap activation or autopickup */
/* falling through trap door calls goto_level,
           and goto_level does its own pickup() call */
/* marked as trapped so they can pick things up */
/* eg fell in pit, then poly'd to a flying monster;
           or used '>' to deliberately enter it */
/* these should use 'pitname' rather than "pit" for hallucination
           but that would nullify Norep (this message can be repeated
           many times without further user intervention by using a run
           attempt to keep retrying to escape from the pit) */
/* Bug: for box case, the equivalent of burn_floor_objects() ought
     * to be done upon its contents.
     */
/* never fatal when 'drainer' is Null */
/* magic vibrations still hit you */
/* roar: wake monsters in vicinity, after placing trap-created ones */
/* [flash: should probably also hit nearby gremlins with light] */
/* If we're invisible from another source */
/* object might light in a controlled manner */
/* Container is burnt up - dump contents out */
/* note: containers aren't subject to erosion so are never
               marked fireproof/corrodeproof/&c */
/*|| (is_flammable(obj) && obj->oerodeproof)*/
/* just gave "The grease washes off your potion of acid."
            or "...your <color> potion." (or just "...your potion.");
            don't re-describe potion here; if we used "It explodes!"
            then "it" might be misconstrued as applying to "grease" */
/* First message is
            * "a [potion|<color> potion|potion of acid] explodes"
            * depending on obj->dknown (potion has been seen) and
            * objects[POT_ACID].oc_name_known (fully discovered),
            * or "some {plural version} explode" when relevant.
            * Second and subsequent messages for same chain and
            * matching dknown status are
            * "another [potion|<color> &c] explodes" or plural
            * variant.
            */
/* a negative change induces a reverse increment, adding abs(change);
           spe starts 0..6, arg passed to rnd() is 1..7, change is -7..-1,
           final spe is 1..7 and always greater than its starting value */
/* ungreased potions of acid will always be destroyed by water */
/* if an oilskin sack, discover it; doesn't
                                   * matter for chest, large box, ice box */
/* blanking a novel is more involved than blanking a spellbook */
/* "cloud", "air", "air bubble", "wall", "fountain", "doorway" */
/* "in a cloud", "in the air" */
/* moved onto lava without fire resistance */
/* sunk into lava while fire resistant */
/* in case Blind, map the water here */
/* if sleeping, wake up now so that we don't crawl out of water
       while still asleep; we can't do that the same way that waking
       due to combat is handled; note unmul() clears u.usleep */
/* being doused will revive from fainting */
/* time to do some strip-tease... */
/* avoid "drowned in _a_ limitless water" on Plane of Water */
/* oops, we're still alive.  better get out of the water. */
/* nowhere safe to land; repeat drowning loop... */
/* after manipulating u.uen,uenmax and setting context.botl, so
       that You_feel() -> pline() will update status before the message */
/* only checked here for autounlock of chest/box and that will
           be !verbosely so precise details of the message don't matter */
/* magical digging first disarms this trap, then will unearth it */
/* Sell your own traps only... */
/* set u.ux,u.uy and u.usteed->mx,my plus handle CLIPPING */
/* caller has just printed "Whoops..." so if hero is prevented from
           moving, a followup message is needed */
/* Test for monster first, monsters are displayed instead of trap. */
/* We might be forced to move onto the trap's location. */
/* duplicate tight-space checks from test_move */
/* don't allow untrap if they can't get thru to it */
/* untrappable traps are located on the ground. */
/* must be a trap that holds monsters */
/* don't always try to spread the web */
/* is there already a trap at hero's spot?
                           if so, don't clobber it with spreading web */
/* make a new web to trap hero in */
/* you, not steed, are trapped */
/* [don't need the iflags.failing_untrap hack here] */
/* successfully used oil or grease to fix squeaky board */
/*
     * This works when levitating too -- consistent with the ability
     * to hit monsters while levitating.
     *
     * Should perhaps check that our hero has arms/hands at the
     * moment.  Helping can also be done by engulfing...
     *
     * Test the monster first - monsters are displayed before traps.
     */
/* Do you have the necessary capacity to lift anything? */
/* need to do cockatrice check first if sleeping or paralyzed */
/* autounlock's untrap; skip most prompting */
/* note: boxcnt and useplural will always be 0 for !here case */
/* 'n' => continue to next box */
/*
     * Doors can be manipulated even while levitating/unskilled riding.
     *
     * Ordinarily there won't be a closed or locked door at the same
     * location as a floor trap or a container.  However, there could
     * be a container at a closed/locked door spot if it was dropped
     * there by a monster or poly'd hero with Passes_walls capability,
     * and poly'd hero could move onto that spot and attempt #untrap
     * in direction '.' or '>'.  We'll get here for that situation if
     * player declines to check all containers for traps.
     *
     * The usual situation is #untrap toward an adjacent closed door.
     * No floor trap would be present and any containers would be
     * ignored because they're only checked when direction is '.'/'>'.
     */
/* (probably ought to charge for this damage...) */
/* solidified lava, so not "floor" even if within a room */
/* lint suppression in case 't' is unexpectedly Null
               or u.utraptype has new value we don't know about yet */
/* give release message before untrap in case it triggers a message */
/* monster will be angered; mintrap doesn't handle that */
/* mon might now be on the migrating monsters list */
/* the obj location need not be that of player */
/* to get immediate botl re-display */
/* in case Blind, map the lava here */
/* nowhere safe to land; repeat burning loop */
/* normally done via safe_teleds() -> teleds() -> spoteffects() but
           spoteffects() was no-op when called with nonzero in_lava_effects */
/* suppress auto-pickup for this landing... */
/* do nothing; this usually won't happen but could after
           * polymorphing from a flier into a ceiling hider and then hiding;
           * allmain() only checks whether the hero is at a lava location,
           * not whether he or she is currently sinking */
/* this shouldn't happen either */
/* can only get here via life-saving; try to get away from lava */
/* can't fully turn into slime while in lava, but might not
               have it be burned away until you've come awfully close */
/* ignitable items like lamps and candles will catch fire */
