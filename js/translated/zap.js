/* NetHack 5.0	zap.c	$NHDT-Date: 1770949988 2026/02/12 18:33:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.584 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2013. */
/* NetHack may be freely redistributed.  See license for details. */
/* Disintegration rays have special treatment; corpses are never left.
 * But the routine which calculates the damage is separate from the routine
 * which kills the monster.  The damage routine returns this cookie to
 * indicate that the monster should be disintegrated.
 */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_feel, You_hear, Your, pline, pline_The, pline_dir } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strchr, strcpy, strlen, strncmpi } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { o_unleash } from './apply.js';
import { artifact_origin, defends, defends_when_carried, permapoisoned } from './artifact.js';
import { acurr, adjalign, exercise, poisoned } from './attrib.js';
import { bot } from './botl.js';
import { getdir, isok, xytodir } from './cmd.js';
import { close_drawbridge, db_under_typ, destroy_drawbridge, find_drawbridge, is_db_wall, is_drawbridge_wall, is_ice, is_lava, is_moat, is_pool, is_pool_or_lava, open_drawbridge } from './dbridge.js';
import { c_common_strings, cg, xdir, ydir } from './decl.js';
import { cvt_sdoor_to_door, findit, show_map_spot } from './detect.js';
import { bury_objs, draft_message, unearth_objs, zap_dig } from './dig.js';
import { canseemon, docrt, glyph_at, knowninvisible, map_invisible, newsym, newsym_force, nul_glyphinfo, sensemon, shieldeff, tmp_at, unmap_invisible, unmap_object, zapdir_to_glyph } from './display.js';
import { boulder_hits_pool } from './do.js';
import { Amonnam, Monnam, a_monnam, christen_monst, free_oname, hcolor, hliquid, mon_nam, mon_pmname, noit_Monnam, noname_monnam, rndmonnam } from './do_name.js';
import { Ring_gone, disintegrate_arm, find_ac, hard_helmet, set_wear } from './do_wear.js';
import { abuse_dog, tamedog, wary_dog } from './dog.js';
import { ship_object } from './dokick.js';
import { breakobj, breaks, endmultishot, hero_breaks, mhurtle, throwit_mon_hit } from './dothrow.js';
import { defsyms } from './drawing.js';
import { In_hell, In_mines, Invocation_lev, ceiling, on_level, surface, update_mapseen_for } from './dungeon.js';
import { cant_finish_meal, eaten_stat, fix_petrification } from './eat.js';
import { done } from './end.js';
import { del_engr, engr_at, make_engr_at, random_engraving, rloc_engr, wipe_engr_at } from './engrave.js';
import { losexp, more_experienced, newexplevel } from './exper.js';
import { explode } from './explode.js';
import { dryup } from './fountain.js';
import { check_capacity, in_rooms, long_to_any, losehp, nomul, obj_to_any, set_uinwater, spoteffects, test_move } from './hack.js';
import { dist2, eos, mungspaces, s_suffix, strsubst, upstart } from './hacklib.js';
import { enlightenment, mstatusline, ustatusline } from './insight.js';
import { addinv_core1, addinv_core2, delobj, delobj_core, display_binventory, display_cinventory, display_minventory, freeinv_core, getobj, hold_another_object, merged, set_cknown_lknown, sobj_at, stackobj, update_inventory, useup, useupall, useupf } from './invent.js';
import { find_mid, show_transient_light, transient_light_cleanup } from './light.js';
import { boxlock, doorlock, picking_at, reset_pick } from './lock.js';
import { create_critters, makemon, monhp_per_lvl, newmcorpsenm, set_mimic_sym } from './makemon.js';
import { death_inflicted_by } from './mcastu.js';
import { sleep_monst, slept_monst } from './mhitm.js';
import { expels, u_slow_down } from './mhitu.js';
import { fix_wall_spines } from './mkmaze.js';
import { add_to_minv, container_weight, corpse_revive_type, costly_alteration, dealloc_oextra, fixup_oil, free_omid, free_omonst, get_mtraits, is_flammable, is_rottable, mkobj, mksobj, mksobj_at, obj_extract_self, obj_ice_effects, place_object, recreate_pile_at, replace_object, set_corpsenm, splitobj, stone_furniture_type, stone_object_type, unbless, uncurse, weight } from './mkobj.js';
import { can_be_hatched, check_gear_next_turn, dead_species, dealloc_monst, healmon, hideunder, killed, m_respond, maybe_unhide_at, mimic_hit_msg, minliquid, mlifesaver, mongone, monkilled, newcham, normal_shape, replmon, restore_cham, seemimic, set_ustuck, shieldeff_mon, unstuck, wake_nearto, wakeup, xkilled } from './mon.js';
import { Resists_Elem, defended, dmgtype, dmgtype_fromattack, monstseesu, monstunseesu, resists_blnd, resists_blnd_by_arti, resists_drli, resists_magm, sticks } from './mondata.js';
import { closed_door, dissolve_bars, monflee } from './monmove.js';
import { hits_bars, m_useup, rnd_hallublast, thitu } from './mthrowu.js';
import { mcureblindness, mon_reflects, ureflects } from './muse.js';
import { ACID_RES, ALTAR, AMULET_OF_UNCHANGING, AMULET_OF_YENDOR, ANTIMAGIC, ANTI_MAGIC, ARM, ARMOR_CLASS, A_CHA, A_CON, A_DEX, A_INT, A_STR, A_WIS, BAG_OF_HOLDING, BAG_OF_TRICKS, BELL_OF_OPENING, BLINDED, BONE, BOULDER, CANDELABRUM_OF_INVOCATION, CHEST, CLOTH, COIN_CLASS, COLD_RES, COPPER, CORPSE, CORR, COST_CANCEL, COST_DRAIN, COST_UNBLSS, COST_UNCURS, CRYSTAL_BALL, DBWALL, DEAF, DIED, DISINT_RES, DOOR, DRAIN_RES, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, DWARVISH_CLOAK, EGG, ENORMOUS_MEATBALL, EXPENSIVE_CAMERA, EXPL_FIERY, EXPL_MAGICAL, EYE, FACE, FAST, FIGURINE, FIRE_HORN, FIRE_RES, FIRST_OBJECT, FIRST_REAL_GEM, FIRST_SPELL, FLASHED_LIGHT, FLESH, FLYING, FOOD_CLASS, FOOT, FOUNTAIN, FROST_HORN, FUMBLING, GAUNTLETS_OF_DEXTERITY, GEMSTONE, GEM_CLASS, GETOBJ_EXCLUDE, GETOBJ_SUGGEST, GLASS, GLOB_OF_GREEN_SLIME, GLYPH_ALTAR_OFF, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GLYPH_WARNING_OFF, GOLD, GRAVE, HALF_PHDAM, HALF_SPDAM, HALLUC, HALLUC_RES, HEAD, HEAVY_IRON_BALL, HELM_OF_BRILLIANCE, HOLE, HWALL, ICE, INVIS, INVIS_BEAM, IRON, IRONBARS, KICKED_WEAPON, LARGE_BOX, LAST_GLASS_GEM, LAST_SPELL, LAVAWALL, LEASH, LEATHER, LEVEL_TELEP, LEVITATION, LOW_BOOTS, LOW_PM, MAGIC_LAMP, MAGIC_MARKER, MAGIC_PORTAL, MAGIC_TRAP, MAXOCLASSES, MAX_GLYPH, MEATBALL, MEAT_RING, MEAT_STICK, MELT_ICE_AWAY, METAL, MINERAL, MITHRIL, MOAT, MUMMY_WRAPPING, M_AP_FURNITURE, M_AP_NOTHING, M_AP_OBJECT, M_SEEN_ACID, M_SEEN_COLD, M_SEEN_DISINT, M_SEEN_ELEC, M_SEEN_FIRE, M_SEEN_MAGR, M_SEEN_REFL, M_SEEN_SLEEP, NON_PM, NUMMONS, NUM_OBJECTS, N_DIRS_Z, OIL_LAMP, PAPER, PASSES_WALLS, PIT, PLATINUM, PLNMSG_ENVELOPED_IN_GAS, PLNMSG_OBJ_GLOWS, PM_AIR_ELEMENTAL, PM_ARCHEOLOGIST, PM_BLACK_PUDDING, PM_CLAY_GOLEM, PM_CROCODILE, PM_CYCLOPS, PM_DEATH, PM_DOPPELGANGER, PM_FAMINE, PM_FLESH_GOLEM, PM_FLOATING_EYE, PM_GHOST, PM_GLASS_GOLEM, PM_GOLD_GOLEM, PM_GREMLIN, PM_HEALER, PM_IRON_GOLEM, PM_KNIGHT, PM_LEATHER_GOLEM, PM_LONG_WORM, PM_MANES, PM_MONK, PM_PAPER_GOLEM, PM_PESTILENCE, PM_ROPE_GOLEM, PM_SKELETON, PM_STALKER, PM_STONE_GOLEM, PM_STRAW_GOLEM, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WIZARD, PM_WOOD_GOLEM, POISON_RES, POLY_NOFLAGS, POLY_TRAP, POOL, POTION_CLASS, POT_ACID, POT_FRUIT_JUICE, POT_GAIN_ABILITY, POT_OIL, POT_POLYMORPH, POT_SEE_INVISIBLE, POT_SICKNESS, POT_WATER, P_BASIC, P_BOW, P_EXPERT, P_ISRESTRICTED, P_NONE, P_PICK_AXE, P_SHURIKEN, P_SKILLED, P_UNSKILLED, REFLECTING, REVIVE_MON, RING_CLASS, RIN_ADORNMENT, RIN_GAIN_CONSTITUTION, RIN_GAIN_STRENGTH, RIN_INCREASE_ACCURACY, RIN_INCREASE_DAMAGE, RIN_PROTECTION, RIN_SHOCK_RESISTANCE, ROCK, ROCK_CLASS, ROOM, ROT_CORPSE, SCORR, SCROLL_CLASS, SCR_BLANK_PAPER, SCR_FIRE, SCR_MAIL, SDOOR, SHOCK_RES, SHOPBASE, SILVER, SINK, SLEEP_RES, SPBOOK_CLASS, SPE_BLANK_PAPER, SPE_BOOK_OF_THE_DEAD, SPE_CANCELLATION, SPE_CONE_OF_COLD, SPE_CURE_SICKNESS, SPE_DETECT_UNSEEN, SPE_DIG, SPE_DRAIN_LIFE, SPE_EXTRA_HEALING, SPE_FINGER_OF_DEATH, SPE_FIREBALL, SPE_FORCE_BOLT, SPE_HEALING, SPE_KNOCK, SPE_LIGHT, SPE_MAGIC_MISSILE, SPE_NOVEL, SPE_POLYMORPH, SPE_SLEEP, SPE_SLOW_MONSTER, SPE_STONE_TO_FLESH, SPE_TELEPORT_AWAY, SPE_TURN_UNDEAD, SPE_WIZARD_LOCK, SPIKED_PIT, STAIRS, STATUE, STATUE_TRAP, STONE, STONED, STRANGE_OBJECT, STUNNED, S_BLOB, S_EEL, S_ELEMENTAL, S_FUNGUS, S_GHOST, S_GOLEM, S_JELLY, S_LIGHT, S_MIMIC, S_PUDDING, S_TROLL, S_VORTEX, S_ZOMBIE, S_altar, S_arrow_trap, S_bars, S_boomleft, S_boomright, S_digbeam, S_flashbeam, S_goodpos, S_grave, S_hcdoor, S_ndoor, S_stone, S_trwall, S_vodoor, S_vwall, TELEPORT_CONTROL, TELEP_TRAP, THROWN_TETHERED_WEAPON, THROWN_WEAPON, TIMER_LEVEL, TIMER_OBJECT, TIN, TOOL_CLASS, TRAPDOOR, TRAPNUM, TT_INFLOOR, TT_LAVA, UNCHANGING, UNICORN_HORN, VIBRATING_SQUARE, VWALL, WAND_CLASS, WAN_CANCELLATION, WAN_COLD, WAN_CREATE_MONSTER, WAN_DEATH, WAN_DIGGING, WAN_ENLIGHTENMENT, WAN_FIRE, WAN_LIGHT, WAN_LIGHTNING, WAN_LOCKING, WAN_MAGIC_MISSILE, WAN_MAKE_INVISIBLE, WAN_NOTHING, WAN_OPENING, WAN_POLYMORPH, WAN_PROBING, WAN_SECRET_DOOR_DETECTION, WAN_SLEEP, WAN_SLOW_MONSTER, WAN_SPEED_MONSTER, WAN_STASIS, WAN_STRIKING, WAN_TELEPORTATION, WAN_UNDEAD_TURNING, WAN_WISHING, WATER, WEAPON_CLASS, WEB, WOOD, ZAPPED_WAND, actual_text, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned, st_all } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { An, The, Tobjnam, Yname2, an, ansimpleoname, aobjnam, bare_artifactname, boots_simple_name, cloak_simple_name, corpse_xname, cxname_singular, distant_name, doname, erosion_matters, gloves_simple_name, helm_simple_name, killer_xname, makeplural, otense, readobjnam, rnd_class, shield_simple_name, shirt_simple_name, simpleonames, suit_simple_name, the, vtense, xname, yname } from './objnam.js';
import { waterbody_name } from './pager.js';
import { encumber_msg, force_decor, u_safe_from_fatal_corpse } from './pickup.js';
import { Norep, livelog_printf, set_msg_xy, urgent_pline } from './pline.js';
import { body_part, polymon, polyself, rehumanize, ugolemeffects } from './polyself.js';
import { healup, incr_itimeout, make_blinded, make_stunned, potionbreathe, self_invis_message, speed_up } from './potion.js';
import { ok_to_quest } from './quest.js';
import { is_quest_artifact } from './questpgr.js';
import { cant_revive, litroom, recharge, unpunish } from './read.js';
import { create_gas_cloud } from './region.js';
import { d, rn2, rn2_on_display_rng, rnd } from './rnd.js';
import { genders } from './role.js';
import { Shk_Your, add_damage, addtobill, billable, check_unpaid, contained_cost, costly_spot, delete_contents, hot_pursuit, inhishop, inside_shop, make_angry_shk, obfree, pay_for_damage, shk_your, shkcatch, shop_keeper, stolen_value } from './shk.js';
import { Shknam, neweshk, shkname } from './shknam.js';
import { spell_skilltype } from './spell.js';
import { mdrop_obj, remove_worn_item } from './steal.js';
import { enexto, rloco, tele, u_teleport_mon } from './teleport.js';
import { attach_egg_hatch_timeout, burn_away_slime, fall_asleep, kill_egg, obj_stop_timers, peek_timer, spot_stop_timers, spot_time_left, start_timer, stop_timer } from './timeout.js';
import { acid_damage, activate_statue_trap, animate_statue, burnarmor, closeholdingtrap, delfloortrap, deltrap, dotrap, fill_pit, ignite_items, maketrap, mintrap, openfallingtrap, openholdingtrap, reset_utrap, set_utrap, sokoban_guilt, t_at, trap_ice_effects, trapname } from './trap.js';
import { disguised_as_mon, disguised_as_non_mon, erode_armor, flash_hits_mon, m_is_steadfast, shade_miss, that_is_a_mimic } from './uhitm.js';
import { block_point, does_block, recalc_block_point, unblock_point, vision_recalc } from './vision.js';
import { dmgval } from './weapon.js';
import { set_twoweap, setuqwep, setuswapwep, setuwep } from './wield.js';
import { add_menu, getlin, select_menu } from './windows.js';
import { bypass_obj, bypass_objlist, extract_from_minvent, find_mac, mon_adjust_speed, mon_set_minvis, nxt_unbypassed_obj, setnotworn, setworn, wearmask_to_obj, wearslot, which_armor } from './worn.js';

/* all callers of boxlock_invent() pass a NONNULL obj, and boxlock
 * boxlock_invent() calls boxlock() which has nonnull arg. */
/* or disintegration */
/* 8 and 9 are currently unassigned */
const are_blinded_by_the_flash = "are blinded by the flash!";
/*
 * A positive index means zapped/cast/breathed by hero.
 * A negative index means zapped/cast/breathed by a monster, with value
 * index fixup beyond abs() needed for wand zaps.  Wand zaps for monster
 * use -39..-30 rather than -9..-0 because -0 is ambiguous (same as 0).
 */
const flash_types = ["magic missile", "bolt of fire", "bolt of cold", "sleep ray", "death ray", "bolt of lightning", "", "", "", "", "magic missile", "fireball", "cone of cold", "sleep ray", "finger of death", "bolt of lightning", "", "", "", "", "blast of missiles", "blast of fire", "blast of frost", "blast of sleep gas", "blast of disintegration", "blast of lightning", "blast of poison gas", "blast of acid", "", ""];
/* Wands must be 0-9 */
/* Spell equivalents must be 10-19 */
/* there is no spell, used for retribution */
/* Dragon breath equivalents 20-29*/
/* convert monster zap/spell/breath value to hero zap/spell/breath value */
export function zaptype(type) {
    if (type <= -30 && -39 <= type) {
        type += 30;
    }
    /* first convert -39..-30 to -9..0 so that abs()
                     * will yield 0..9 (hero wand zap) for it */
    type = abs(type);
    return type;
}
/*
 * Recognizing unseen wands by zapping:  in 3.4.3 and earlier, zapping
 * most wand types while blind would add that type to the discoveries
 * list even if it had never been seen (ie, picked up while blinded
 * and shown in inventory as simply "a wand").  This behavior has been
 * changed; now such wands won't be discovered.  But if the type is
 * already discovered, then the individual wand whose effect was just
 * observed will be flagged as if seen.  [You already know wands of
 * striking; you zap "a wand" and observe striking effect (presumably
 * by sound or touch); it'll become shown in inventory as "a wand of
 * striking".]
 *
 * Unfortunately, the new behavior isn't really correct either.  There
 * should be an `eknown' bit for "effect known" added for wands (and
 * for potions since quaffing one of a stack is similar) so that the
 * particular wand which has been zapped would have its type become
 * known (it would change from "a wand" to "a wand of striking", for
 * example) without the type becoming discovered or other unknown wands
 * of that type showing additional information.  When blindness ends,
 * all objects in inventory with the eknown bit set would be discovered
 * and other items of the same type would become known as such.
 */
/* wand discovery gets special handling when hero is blinded */
export async function learnwand(obj) {
    if (obj.oclass != SPBOOK_CLASS) {
        if (game.objects[obj.otyp].oc_name_known) {
            await observe_object(obj);
        } else {
            /* in case it was picked up while blind and then zapped without
               examining inventory after regaining sight (bypassing xname) */
            /* make him pay for knowing !NODIR */
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await observe_object(obj);
            }
            if (obj.dknown) {
                await discover_object((obj.otyp), (1), (1), (1));
            }
        }
        update_inventory();
    }
}
/*
 * Routines for IMMEDIATE wands and spells.
 * Also RAY or NODIR for wands that are being broken rather than zapped.
 */
/* bhitm: monster mtmp was hit by the effect of wand or spell otmp */
export async function bhitm(mtmp, otmp) {
    let ret = 0;
    /* Most 'zaps' should wake monster */
    let wake = (1);
    let reveal_invis = (0);
    let learn_it = (0);
    let dbldam = (game.urole.mnum == (PM_KNIGHT)) && game.u.uhave.questart;
    let skilled_spell = 0;
    let helpful_gesture = (0);
    let dmg = 0;
    let otyp = otmp.otyp;
    let zap_type_text = "spell";
    let obj = null;
    let disguised_mimic = (mtmp.data.mlet == S_MIMIC && ((mtmp).m_ap_type & 7) != M_AP_NOTHING);
    /* box_or_door(): mimic appearances that have locks */
    /* is_cmap_door() tests S_symbol values, and            */
    /* mon->mappearance for furniture contains one of those */
    if ((game.u.uswallow && (game.u.ustuck == (mtmp)))) {
        reveal_invis = (0);
    }
    game.notonhead = (mtmp.mx != game.bhitpos.x || mtmp.my != game.bhitpos.y);
    skilled_spell = (otmp.oclass == SPBOOK_CLASS && otmp.blessed);
    switch (otyp) {
        case WAN_STRIKING:
            zap_type_text = "wand";
            ;
        case SPE_FORCE_BOLT:
            reveal_invis = (1);
            learn_it = ((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0);
            if (resists_magm(mtmp)) {
                if (disguised_mimic && !disguised_as_mon(mtmp)) {
                    await seemimic(mtmp);
                }
                await shieldeff(mtmp.mx, mtmp.my);
                await pline("Boing!");
            } else if (game.u.uswallow || rnd(20) < 10 + find_mac(mtmp)) {
                if (disguised_mimic) {
                    await seemimic(mtmp);
                }
                dmg = d(2, 12);
                if (dbldam) {
                    dmg *= 2;
                }
                if (otyp == SPE_FORCE_BOLT) {
                    dmg = spell_damage_bonus(dmg);
                }
                await hit(zap_type_text, mtmp, exclam(dmg));
                await resist(mtmp, otmp.oclass, dmg, 1);
            } else {
                if (!disguised_mimic) {
                    await miss(zap_type_text, mtmp);
                }
                learn_it = (0);
            }
            /* !mx => migrating monster */
            /* for floor, also calls newsym() */
            /* don't care about the recharge count of other tools */
            break;
        case WAN_SLOW_MONSTER:
        case SPE_SLOW_MONSTER:
            if (!await resist(mtmp, otmp.oclass, 0, 0)) {
                if (disguised_mimic) {
                    await seemimic(mtmp);
                }
                await mon_adjust_speed(mtmp, -1, otmp);
                check_gear_next_turn(mtmp);
                if ((game.u.uswallow && (game.u.ustuck == (mtmp))) && ((mtmp.data).mlet == S_VORTEX || (mtmp.data) == game.mons[PM_AIR_ELEMENTAL])) {
                    await You("disrupt %s!", await mon_nam(mtmp));
                    await pline("A huge hole opens up...");
                    await expels(mtmp, mtmp.data, (1));
                }
            }
            break;
        case WAN_SPEED_MONSTER:
            if (!await resist(mtmp, otmp.oclass, 0, 0)) {
                if (disguised_mimic) {
                    await seemimic(mtmp);
                }
                await mon_adjust_speed(mtmp, 1, otmp);
                check_gear_next_turn(mtmp);
            }
            /* wake but don't anger a peaceful target */
            helpful_gesture = (1);
            break;
        case WAN_UNDEAD_TURNING:
        case SPE_TURN_UNDEAD:
            /* don't want immediate counterattack */
            wake = (0);
            if (await unturn_dead(mtmp)) {
                wake = (1);
            }
            if ((((mtmp.data).mflags2 & 2) != 0) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) {
                reveal_invis = (1);
                wake = (1);
                dmg = rnd(8);
                if (dbldam) {
                    dmg *= 2;
                }
                if (otyp == SPE_TURN_UNDEAD) {
                    dmg = spell_damage_bonus(dmg);
                }
                game.context.bypasses = (1);
                if (!await resist(mtmp, otmp.oclass, dmg, 0)) {
                    if (!((mtmp).mhp < 1)) {
                        await monflee(mtmp, 0, (0), (1));
                    }
                }
            }
            break;
        case WAN_POLYMORPH:
        case SPE_POLYMORPH:
        case POT_POLYMORPH:
            if (mtmp.data == game.mons[PM_LONG_WORM] && ((mtmp).mextra && ((mtmp).mextra.mcorpsenm) != NON_PM)) {
                ;
            } else if (resists_magm(mtmp)) {
                await shieldeff_mon(mtmp);
            } else if (!await resist(mtmp, otmp.oclass, 0, 0)) {
                let polyspot = (otyp != POT_POLYMORPH);
                let give_msg = (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && (canseemon(mtmp) || (game.u.uswallow && (game.u.ustuck == (mtmp)))));
                /* dropped inventory (due to death by system shock,
               or loss of wielded weapon and/or worn armor due to
               limitations of new shape) won't be hit by this zap */
                if (polyspot) {
                    for (obj = mtmp.minvent; obj; obj = obj.nobj) {
                        bypass_obj(obj);
                    }
                }
                if (mtmp.cham == NON_PM && !rn2(25)) {
                    if (canseemon(mtmp)) {
                        await pline("%s shudders!", await Monnam(mtmp));
                        /* zap which hits steed will only release saddle if it
           doesn't hit a holding or falling trap; playability
           here overrides the more logical target ordering */
                        /* (no effect for spells...) */
                        /* !drawbridge_up: not spot in front of raised bridge,
                   so either span of lowered bridge or portcullis */
                        /* TODO: ought to give some message */
                        /* if on or over ice, describe it ("solid ice", "thin ice", &c);
           likewise for furniture in case hero is levitating while blind */
                        learn_it = (1);
                    }
                    await xkilled(mtmp, 0 | 2);
                } else {
                    let ncflags = 0;
                    if (polyspot) {
                        ncflags |= 2;
                    }
                    if (give_msg) {
                        ncflags |= 1;
                    }
                    if (await newcham(mtmp, null, ncflags) != 0 || (((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS) && await newcham(mtmp, game.mons[mtmp.cham], ncflags) != 0)) {
                        /* if shapechange failed because there aren't
                              enough eligible candidates (most likely for
                              vampshifter), try reverting to original form */
                        if (give_msg && ((canseemon(mtmp) || sensemon(mtmp)) || (game.u.uswallow && (game.u.ustuck == (mtmp))))) {
                            learn_it = (1);
                        }
                    }
                }
                if (!((mtmp).mhp < 1) && mtmp.data == game.mons[PM_LONG_WORM]) {
                    /* do this even if polymorphed failed (otherwise using
               flags.mon_polycontrol prompting to force mtmp to remain
               'long worm' would prompt again if zap hit another segment) */
                    if (!((mtmp).mextra && ((mtmp).mextra.mcorpsenm) != NON_PM)) {
                        newmcorpsenm(mtmp);
                    }
                    ((mtmp).mextra.mcorpsenm) = PM_LONG_WORM;
                    /* flag to indicate that mtmp became a long worm
                   on current zap, so further hits (on mtmp's new
                   tail) don't do further transforms */
                    /* flag to indicate that cleanup is needed; object
                   bypass cleanup also clears mon->mextra->mcorpsenm
                   for all long worms on the level */
                    game.context.bypasses = (1);
                }
            }
            break;
        case WAN_CANCELLATION:
        case SPE_CANCELLATION:
            if (disguised_mimic) {
                await seemimic(mtmp);
            }
            await cancel_monst(mtmp, otmp, (1), (1), (0));
            break;
        case WAN_TELEPORTATION:
        case SPE_TELEPORT_AWAY:
            if (disguised_mimic) {
                await seemimic(mtmp);
            }
            reveal_invis = !await u_teleport_mon(mtmp, (1));
            learn_it = (canseemon(mtmp) || sensemon(mtmp));
            break;
        case WAN_MAKE_INVISIBLE:
{
                let oldinvis = mtmp.minvis;
                let couldsee = canseemon(mtmp);
                let nambuf = '';
                if (disguised_mimic) {
                    await seemimic(mtmp);
                }
                nambuf = strcpy(nambuf, await Monnam(mtmp));
                await mon_set_minvis(mtmp, (0));
                if (!oldinvis && knowninvisible(mtmp)) {
                    await pline("%s turns transparent!", nambuf);
                    reveal_invis = (1);
                    learn_it = (1);
                } else if (couldsee && !canseemon(mtmp)) {
                    await pline("%s vanishes!", nambuf);
                }
                /* mtmp might now be on the migrating monsters list */
                break;
            }
        case WAN_LOCKING:
        case SPE_WIZARD_LOCK:
            if (disguised_mimic && ((((mtmp).m_ap_type & 7) == M_AP_OBJECT && ((mtmp).mappearance == CHEST || (mtmp).mappearance == LARGE_BOX)) || (((mtmp).m_ap_type & 7) == M_AP_FURNITURE && (((mtmp).mappearance) >= S_vodoor && ((mtmp).mappearance) <= S_hcdoor)))) {
                await that_is_a_mimic(mtmp, 1);
            }
            wake = await closeholdingtrap(mtmp, { get value() { return learn_it; }, set value(_v) { learn_it = _v; } });
            break;
        /*
     * Wands that are allowed to hit the steed
     * Carefully test the results of any that are
     * moved here from the bottom section.
     */
        case WAN_PROBING:
            wake = (0);
            reveal_invis = (1);
            await probe_monster(mtmp);
            learn_it = (1);
            break;
        case WAN_OPENING:
        case SPE_KNOCK:
            if (disguised_mimic && ((((mtmp).m_ap_type & 7) == M_AP_OBJECT && ((mtmp).mappearance == CHEST || (mtmp).mappearance == LARGE_BOX)) || (((mtmp).m_ap_type & 7) == M_AP_FURNITURE && (((mtmp).mappearance) >= S_vodoor && ((mtmp).mappearance) <= S_hcdoor)))) {
                await that_is_a_mimic(mtmp, 1);
            }
            wake = (0);
            if (mtmp == game.u.ustuck) {
                await release_hold();
                learn_it = (1);
            } else if (await openholdingtrap(mtmp, { get value() { return learn_it; }, set value(_v) { learn_it = _v; } })) {
                break;
            } else if (await openfallingtrap(mtmp, (1), { get value() { return learn_it; }, set value(_v) { learn_it = _v; } })) {
                break;
            } else if (otyp == SPE_KNOCK) {
                wake = (1);
                ret = 1;
                if (mtmp.data.msize < 2 && !m_is_steadfast(mtmp)) {
                    if (canseemon(mtmp)) {
                        await pline("%s is knocked back!", await Monnam(mtmp));
                    }
                    await mhurtle(mtmp, mtmp.mx - game.u.ux, mtmp.my - game.u.uy, rnd(2));
                } else {
                    if (canseemon(mtmp)) {
                        await pline("%s doesn't budge.", await Monnam(mtmp));
                    }
                }
                if (!((mtmp).mhp < 1)) {
                    await wakeup(mtmp, !(((mtmp.data).mflags1 & 65536) != 0));
                    await abuse_dog(mtmp);
                }
            } else if ((obj = await which_armor(mtmp, 1048576)) != null) {
                let buf = '';
                buf = sprintf(buf, "%s %s", s_suffix(await Monnam(mtmp)), await distant_name(obj, xname));
                if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                    if (!(canseemon(mtmp) || sensemon(mtmp))) {
                        buf = strcpy(buf, await An(await distant_name(obj, xname)));
                    }
                    await pline("%s falls to the %s.", buf, surface(mtmp.mx, mtmp.my));
                } else if ((canseemon(mtmp) || sensemon(mtmp))) {
                    await pline("%s falls off.", buf);
                }
                await mdrop_obj(mtmp, obj, (0));
            }
            break;
        case SPE_HEALING:
        case SPE_EXTRA_HEALING:
{
                let healamt = d(6, otyp == SPE_EXTRA_HEALING ? 8 : 4);
                reveal_invis = (1);
                if (mtmp.data != game.mons[PM_PESTILENCE]) {
                    let delta = mtmp.mhpmax - mtmp.mhp;
                    /* wakeup() makes the target angry */
                    wake = (0);
                    await healmon(mtmp, healamt, 0);
                    /* plain healing must be blessed to cure blindness; extra
               healing only needs to not be cursed, so spell always cures
               [potions quaffed by monsters behave slightly differently;
               we use the rules for the hero here...] */
                    if (skilled_spell || otyp == SPE_EXTRA_HEALING) {
                        await mcureblindness(mtmp, canseemon(mtmp));
                    }
                    if (canseemon(mtmp)) {
                        if (disguised_mimic) {
                            if ((((mtmp).m_ap_type & 7) == M_AP_OBJECT && (mtmp).mappearance == (STRANGE_OBJECT))) {
                                await set_mimic_sym(mtmp);
                                await newsym(mtmp.mx, mtmp.my);
                            } else {
                                await mimic_hit_msg(mtmp, otyp);
                            }
                        } else {
                            await pline("%s looks%s better.", await Monnam(mtmp), otyp == SPE_EXTRA_HEALING ? " much" : "");
                        }
                    }
                    if (mtmp.mtame && (game.urole.mnum == (PM_HEALER)) && (delta > 0)) {
                        await more_experienced(((delta) < (healamt) ? (delta) : (healamt)), 0);
                        await newexplevel();
                    }
                    if (mtmp.mtame || mtmp.mpeaceful) {
                        adjalign((game.urole.mnum == (PM_HEALER)) ? 1 : sgn(game.u.ualign.type));
                    }
                } else {
                    await resist(mtmp, otmp.oclass, Math.trunc(healamt / 2), 1);
                }
                break;
            }
        case WAN_LIGHT:
            if (await flash_hits_mon(mtmp, otmp)) {
                learn_it = (1);
                reveal_invis = (1);
            }
            break;
        case WAN_SLEEP:
            reveal_invis = (1);
            if (await sleep_monst(mtmp, d(1 + otmp.spe, 12), WAND_CLASS)) {
                await slept_monst(mtmp);
            }
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                learn_it = (1);
            }
            break;
        case SPE_STONE_TO_FLESH:
            if (mtmp.data.mlet == S_GOLEM) {
                let mesg = null;
                let name = await Monnam(mtmp);
                if (((mtmp.data).pmidx) == PM_STONE_GOLEM && await newcham(mtmp, game.mons[PM_FLESH_GOLEM], 0)) {
                    mesg = "turns to flesh!";
                } else if (((mtmp.data).pmidx) == PM_FLESH_GOLEM) {
                    mesg = "seems fleshier...";
                /* turn stone golem into flesh golem */
                } else {
                    mesg = "looks rather fleshy for a moment.";
                }
                if (canseemon(mtmp)) {
                    await pline("%s %s", name, mesg);
                }
            } else if (mtmp.data.mlet == S_MIMIC && ((((mtmp).m_ap_type & 7) == M_AP_FURNITURE && stone_furniture_type(mtmp.mappearance)) || (((mtmp).m_ap_type & 7) == M_AP_OBJECT && stone_object_type(mtmp.mappearance)))) {
                if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                    /* note: if that_is_a_mimic() doesn't get called to reveal the
               mimic, wakeup() below will call seemimic() */
                    set_msg_xy(mtmp.mx, mtmp.my);
                    await that_is_a_mimic(mtmp, 1 | 2);
                }
            } else {
                wake = (0);
            }
            break;
        case SPE_DRAIN_LIFE:
            if (disguised_mimic) {
                await seemimic(mtmp);
            }
            dmg = monhp_per_lvl(mtmp);
            if (dbldam) {
                dmg *= 2;
            }
            if (otyp == SPE_DRAIN_LIFE) {
                dmg = spell_damage_bonus(dmg);
            }
            if (await resists_drli(mtmp)) {
                await shieldeff_mon(mtmp);
            } else if (!await resist(mtmp, otmp.oclass, dmg, 0) && !((mtmp).mhp < 1)) {
                mtmp.mhp -= dmg;
                mtmp.mhpmax -= dmg;
                if (((mtmp).mhp < 1) || mtmp.mhpmax <= 0 || mtmp.m_lev < 1) {
                    await killed(mtmp);
                } else {
                    mtmp.m_lev--;
                    if (canseemon(mtmp)) {
                        await pline("%s suddenly seems weaker!", await Monnam(mtmp));
                    }
                }
            }
            break;
        case WAN_NOTHING:
            wake = (0);
            break;
        default:
            await impossible("What an interesting effect (%d)", otyp);
            break;
    }
    if (wake && !((mtmp).mhp < 1)) {
        await wakeup(mtmp, helpful_gesture ? (0) : (1));
        await m_respond(mtmp);
        if (mtmp.isshk && !game.u.ushops) {
            hot_pursuit(mtmp);
        }
    }
    if (reveal_invis && !((mtmp).mhp < 1)) {
        /* note: gb.bhitpos won't be set if swallowed, but that's okay since
     * reveal_invis will be false.  We can't use mtmp->mx, my since it
     * might be an invisible worm hit on the tail.
     */
        if (((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0) && !(canseemon(mtmp) || sensemon(mtmp))) {
            await map_invisible(game.bhitpos.x, game.bhitpos.y);
        }
    }
    if (learn_it) {
        await learnwand(otmp);
    }
    return ret;
}
/* hero is held by a monster or engulfed or holding a monster and has zapped
   opening/unlocking magic at holder/engulfer/holdee or at self */
export async function release_hold() {
    let mtmp = game.u.ustuck;
    if (!mtmp) {
        await impossible("release_hold when not held?");
    } else if (game.u.uswallow) {
        if ((dmgtype_fromattack((mtmp.data), 26, 11) != null)) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("%s opens its mouth!", await Monnam(mtmp));
            } else {
                await You_feel("a sudden rush of air!");
            }
        }
        await expels(mtmp, mtmp.data, (1));
    } else if (sticks(game.youmonst.data)) {
        await set_ustuck(null);
        await You("release %s.", await mon_nam(mtmp));
    } else {
        let relbuf = '';
        await unstuck(game.u.ustuck);
        if (!(((mtmp.data).mflags1 & 8192) != 0)) {
            relbuf = sprintf(relbuf, "from %s grasp", s_suffix(await mon_nam(mtmp)));
        } else {
            relbuf = sprintf(relbuf, "by %s", await mon_nam(mtmp));
        }
        await You("are released %s.", relbuf);
    }
}
export async function probe_objchain(otmp) {
    for (; otmp; otmp = otmp.nobj) {
        await observe_object(otmp);
        if (((otmp).otyp >= LARGE_BOX && (otmp).otyp <= BAG_OF_TRICKS) || otmp.otyp == STATUE) {
            otmp.lknown = 1;
            if (!((otmp).otyp == LARGE_BOX && (otmp).spe == 1)) {
                otmp.cknown = 1;
            }
        } else if (otmp.otyp == TIN) {
            otmp.known = 1;
        }
    }
}
export async function probe_monster(mtmp) {
    await mstatusline(mtmp);
    if (game.notonhead) {
        return;
    }
    if (mtmp.minvent) {
        await probe_objchain(mtmp.minvent);
        await display_minventory(mtmp, 8 | 4 | 0, null);
    } else {
        await pline("%s is not carrying anything%s.", await noit_Monnam(mtmp), (game.u.uswallow && (game.u.ustuck == (mtmp))) ? " besides you" : "");
    }
}
/*
 * Return the object's physical location.  This only makes sense for
 * objects that are currently on the level (i.e. migrating objects
 * are nowhere).  By default, only things that can be seen (in hero's
 * inventory, monster's inventory, or on the ground) are reported.
 * By adding BURIED_TOO and/or CONTAINED_TOO flags, you can also get
 * the location of buried and contained objects.  Note that if an
 * object is carried by a monster, its reported position may change
 * from turn to turn.  This function returns FALSE if the position
 * is not available or subject to the constraints above.
 */
export function get_obj_location(obj, xp, yp, locflags) {
    switch (obj.where) {
        /* finally, get rid of the corpse--it's gone now */
        case 3:
            xp.value = game.u.ux;
            yp.value = game.u.uy;
            /* we've done our own bhitpile */
            /* non-water potions don't freeze and shatter */
            /* electric-magic items are immune */
            return (1);
        case 1:
            xp.value = obj.ox;
            yp.value = obj.oy;
            return (1);
        case 4:
            if (obj.v.v_ocarry.mx) {
                xp.value = obj.v.v_ocarry.mx;
                yp.value = obj.v.v_ocarry.my;
                return (1);
            }
            break;
        case 6:
            if (locflags & 2) {
                xp.value = obj.ox;
                yp.value = obj.oy;
                return (1);
            }
            break;
        case 2:
            if (locflags & 1) {
                return get_obj_location(obj.v.v_ocontainer, xp, yp, locflags);
            }
            break;
    }
    xp.value = yp.value = 0;
    return (0);
}
/* non-zero means get location even if monster is buried */
export function get_mon_location(mon, xp, yp, locflags) {
    if (mon == game.youmonst || (game.u.usteed && mon == game.u.usteed)) {
        xp.value = game.u.ux;
        yp.value = game.u.uy;
        return (1);
    } else if (mon.mx > 0 && (!mon.mburied || locflags)) {
        xp.value = mon.mx;
        yp.value = mon.my;
        return (1);
    } else {
        xp.value = yp.value = 0;
        /* not available for destroying */
        return (0);
    }
}
/* used by revive() and animate_statue() */
/* False: at obj's spot only,
                         * True: nearby is allowed */
export async function montraits(obj, cc, adjacentok) {
    let mtmp = null;
    let mtmp2 = ((obj).oextra && ((obj).oextra.omonst)) ? get_mtraits(obj, (1)) : null;
    if (mtmp2) {
        /* save_mtraits() validated mtmp2->mnum */
        mtmp2.data = game.mons[mtmp2.mnum];
        if (mtmp2.mhpmax > 0 || ((mtmp2.data) == game.mons[PM_DEATH] || (mtmp2.data) == game.mons[PM_FAMINE] || (mtmp2.data) == game.mons[PM_PESTILENCE])) {
            mtmp = await makemon(mtmp2.data, cc.x, cc.y, (1 | 2 | 4 | 16384 | 131072 | (adjacentok ? 16 : 0)));
        }
        if (!mtmp) {
            await dealloc_monst(mtmp2);
            return null;
        }
        if (mtmp.m_lev < mtmp.data.mlevel) {
            /* heal the monster; lower than normal level might come from
           adj_lev() but we assume it has come from 'mtmp' being level
           drained before finally killed; give a chance to restore
           some levels so that trolls and Riders can't be drained to
           level 0 and then trivially killed repeatedly */
            let ltmp = rnd(mtmp.data.mlevel + 1);
            if (ltmp > mtmp.m_lev) {
                while (mtmp.m_lev < ltmp) {
                    mtmp.m_lev++;
                    mtmp.mhpmax += monhp_per_lvl(mtmp);
                }
                mtmp2.m_lev = mtmp.m_lev;
            }
        }
        if (mtmp.mhpmax > mtmp2.mhpmax) {
            mtmp2.mhpmax = mtmp.mhpmax;
        }
        mtmp2.mhp = mtmp2.mhpmax;
        /* Get these ones from mtmp */
        mtmp2.minvent = mtmp.minvent;
        if (mtmp.m_id) {
            /* monster ID is available if the monster died in the current
           game, but will be zero if the corpse was in a bones level
           (we cleared it when loading bones) */
            mtmp2.m_id = mtmp.m_id;
            /* might be bringing quest leader back to life */
            /* leader_is_dead implies leader_m_id is valid */
            if (game.quest_status.leader_is_dead && mtmp2.m_id == game.quest_status.leader_m_id) {
                game.quest_status.leader_is_dead = (0);
            }
        }
        mtmp2.mx = mtmp.mx;
        mtmp2.my = mtmp.my;
        mtmp2.mux = mtmp.mux;
        mtmp2.muy = mtmp.muy;
        mtmp2.mw = mtmp.mw;
        mtmp2.wormno = mtmp.wormno;
        mtmp2.misc_worn_check = mtmp.misc_worn_check;
        mtmp2.weapon_check = mtmp.weapon_check;
        mtmp2.mtrapseen = mtmp.mtrapseen;
        mtmp2.mflee = mtmp.mflee;
        mtmp2.mburied = mtmp.mburied;
        mtmp2.mundetected = mtmp.mundetected;
        mtmp2.mfleetim = mtmp.mfleetim;
        mtmp2.mlstmv = mtmp.mlstmv;
        mtmp2.m_ap_type = mtmp.m_ap_type;
        /* set these ones explicitly */
        mtmp2.mrevived = 1;
        mtmp2.mavenge = 0;
        mtmp2.meating = 0;
        mtmp2.mleashed = 0;
        mtmp2.mtrapped = 0;
        mtmp2.msleeping = 0;
        mtmp2.mfrozen = 0;
        mtmp2.mcanmove = 1;
        /* most cancelled monsters return to normal,
           but some need to stay cancelled */
        if (!dmgtype(mtmp2.data, 22) && (!game.sysopt.seduce || !dmgtype(mtmp2.data, 35))) {
            mtmp2.mcan = 0;
        }
        mtmp2.mcansee = 1;
        mtmp2.mblinded = 0;
        mtmp2.mstun = 0;
        mtmp2.mconf = 0;
        if (mtmp2.isshk) {
            /* when traits are for a shopkeeper, dummy monster 'mtmp' won't
           have necessary eshk data for replmon() -> replshk() */
            neweshk(mtmp);
            Object.assign((mtmp).mextra.eshk, (mtmp2).mextra.eshk);
            if (((mtmp2).mextra.eshk).bill_p != null && ((mtmp2).mextra.eshk).bill_p != -1000) {
                ((mtmp).mextra.eshk).bill_p = (((mtmp).mextra.eshk).bill[0]);
            }
            mtmp.isshk = 1;
        }
        await replmon(mtmp, mtmp2);
        await newsym(mtmp2.mx, mtmp2.my);
        await restore_cham(mtmp2);
    }
    return mtmp2;
}
/*
 * get_container_location() returns the following information
 * about the outermost container:
 * loc argument gets set to:
 *      OBJ_INVENT      if in hero's inventory; return 0.
 *      OBJ_FLOOR       if on the floor; return 0.
 *      OBJ_BURIED      if buried; return 0.
 *      OBJ_MINVENT     if in monster's inventory; return monster.
 * container_nesting is updated with the nesting depth of the containers
 * if applicable.
 */
export function get_container_location(obj, loc, container_nesting) {
    if (container_nesting) {
        container_nesting.value = 0;
    }
    while (obj && obj.where == 2) {
        if (container_nesting) {
            container_nesting.value += 1;
        }
        obj = obj.v.v_ocontainer;
    }
    if (obj) {
        /* outermost container's location */
        loc.value = obj.where;
        if (obj.where == 4) {
            return obj.v.v_ocarry;
        }
    }
    return null;
}
/* can zombie dig the location at x,y */
export function zombie_can_dig(x, y) {
    if (isok(x, y)) {
        let typ = game.level.locations[x][y].typ;
        let ttmp = null;
        if ((ttmp = t_at(x, y)) != null) {
            /* fire-magic items are immune */
            return (0);
        }
        if (typ == ROOM || typ == CORR || typ == GRAVE) {
            return (1);
        }
    }
    return (0);
}
/*
 * Attempt to revive the given corpse, return the revived monster if
 * successful.  Note: this does NOT use up the corpse if it fails.
 * If corpse->quan is more than 1, only one corpse will be affected
 * and only one monster will be resurrected.
 */
export async function revive(corpse, by_hero) {
    let mtmp = null;
    let mptr = null;
    let container = null;
    let xy = { x: 0, y: 0 };
    let x = 0;
    let y = 0;
    let one_of = 0;
    let mmflags = 1 | 2 | 131072;
    let montype = 0;
    let cgend = 0;
    let container_nesting = 0;
    let is_zomb = 0;
    if (corpse.otyp != CORPSE) {
        await impossible("Attempting to revive %s?", await xname(corpse));
        return null;
    }
    montype = corpse.corpsenm;
    /* treat buried auto-reviver (troll, Rider?) like a zombie
       so that it can dig itself out of the ground if it revives */
    is_zomb = game.mons[montype].mlet == S_ZOMBIE || (corpse.where == 6 && (((game.mons[montype]) == game.mons[PM_DEATH] || (game.mons[montype]) == game.mons[PM_FAMINE] || (game.mons[montype]) == game.mons[PM_PESTILENCE]) || (game.mons[montype]).mlet == S_TROLL));
    await cant_finish_meal(corpse);
    x = y = 0;
    if (corpse.where != 2) {
        let locflags = is_zomb ? 2 : 0;
        /* only for invent, minvent, or floor, or if zombie, buried */
        container = null;
        get_obj_location(corpse, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, locflags);
    } else {
        /* deal with corpses in [possibly nested] containers */
        let carrier = null;
        let holder = 0;
        container = corpse.v.v_ocontainer;
        carrier = get_container_location(container, { get value() { return holder; }, set value(_v) { holder = _v; } }, { get value() { return container_nesting; }, set value(_v) { container_nesting = _v; } });
        switch (holder) {
            case 4:
                x = carrier.mx , y = carrier.my;
                break;
            case 3:
                x = game.u.ux , y = game.u.uy;
                break;
            case 1:
                get_obj_location(corpse, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1);
                break;
            default:
                break;
        }
    }
    /* update corpse's location now that we're sure where it is */
    if (x) {
        corpse.ox = x , corpse.oy = y;
    }
    if (!x || (container && (container.olocked || container_nesting > 2 || container.otyp == STATUE || (container.otyp == BAG_OF_HOLDING && rn2(40)))) || (is_zomb && corpse.where == 6 && !zombie_can_dig(x, y))) {
        return null;
    }
    mptr = game.mons[montype];
    if ((game.level.monsters[x][y] != null)) {
        if (await enexto(xy, x, y, mptr)) {
            x = xy.x , y = xy.y;
        }
    }
    if (corpse.oeroded2 || (game.mons[montype].mlet == S_EEL && !((game.level.locations[x][y].typ) >= POOL && (game.level.locations[x][y].typ) <= DRAWBRIDGE_UP))) {
        if (((game.viz_array[y][x] & 2) != 0)) {
            await pline("%s twitches feebly.", upstart(await corpse_xname(corpse, null, 4)));
        }
        return null;
    }
    /* applicable when montraits/corpse->oextra->omonst aren't used */
    cgend = (corpse.spe & 3);
    if (cgend == 2) {
        mmflags |= 32768;
    } else if (cgend == 1) {
        mmflags |= 65536;
    }
    if (cant_revive({ get value() { return montype; }, set value(_v) { montype = _v; } }, (1), corpse)) {
        mtmp = await makemon(game.mons[montype], x, y, mmflags);
        if (mtmp) {
            if (((corpse).oextra && ((corpse).oextra.omid))) {
                free_omid(corpse);
            }
            if (((corpse).oextra && ((corpse).oextra.omonst))) {
                free_omonst(corpse);
            }
            if (mtmp.cham == PM_DOPPELGANGER) {
                await newcham(mtmp, mptr, 0);
            } else if (mtmp.data.mlet == S_ZOMBIE) {
                mtmp.mhp = mtmp.mhpmax = 100;
                await mon_adjust_speed(mtmp, 2, null);
            }
        }
    } else if (((corpse).oextra && ((corpse).oextra.omonst))) {
        xy.x = x , xy.y = y;
        mtmp = await montraits(corpse, xy, (0));
        if (mtmp && mtmp.mtame && !mtmp.isminion) {
            await wary_dog(mtmp, (1));
        }
    } else {
        mtmp = await makemon(mptr, x, y, mmflags | 4);
    }
    if (!mtmp) {
        return null;
    }
    if (mtmp.mundetected) {
        /* hiders shouldn't already be re-hidden when they revive */
        mtmp.mundetected = 0;
        await newsym(mtmp.mx, mtmp.my);
    }
    if (((mtmp).m_ap_type & 7)) {
        await seemimic(mtmp);
    }
    one_of = (corpse.quan > 1);
    if (one_of) {
        corpse = await splitobj(corpse, 1);
    }
    if (by_hero) {
        /* if this is caused by the hero there might be a shop charge */
        let shkp = null;
        x = corpse.ox , y = corpse.oy;
        if (await costly_spot(x, y) && (((corpse).where == 3) ? corpse.unpaid : !corpse.no_charge)) {
            shkp = await shop_keeper(in_rooms(x, y, SHOPBASE));
        }
        if (((game.viz_array[y][x] & 2) != 0)) {
            let buf = '';
            buf = strcpy(buf, one_of ? "one of " : "");
            await shk_your(eos(buf), corpse);
            if (one_of) {
                corpse.quan++;
            }
            buf = strcat(buf, await corpse_xname(corpse, null, 2));
            /* could be simplified to ''corpse->quan = 1L;'' */
            if (one_of) {
                corpse.quan--;
            }
            await pline("%s glows iridescently.", upstart(buf));
            game.iflags.last_msg = PLNMSG_OBJ_GLOWS;
        } else if (shkp) {
            await pline("A corpse is resuscitated.");
        }
        if (shkp && mtmp != shkp) {
            await stolen_value(corpse, x, y, shkp.mpeaceful, (0));
        }
    }
    if (((corpse).oextra && ((corpse).oextra.omid))) {
        /* handle recorporealization of an active ghost */
        let m_id = 0;
        let ghost = null;
        /* will be set during each iteration */
        let otmp = null;
        m_id = ((corpse).oextra.omid);
        ghost = find_mid(m_id, 1);
        if (ghost && ghost.data == game.mons[PM_GHOST]) {
            if (canseemon(ghost)) {
                await pline("%s is suddenly drawn into its former body!", await Monnam(ghost));
            }
            while ((otmp = ghost.minvent) != null) {
                await obj_extract_self(otmp);
                await add_to_minv(mtmp, otmp);
            }
            if (ghost.mtame && !mtmp.mtame) {
                if (await tamedog(mtmp, null, (0))) {
                    /* tame the revived monster if its ghost was tame */
                    /* ghost's edog data is ignored */
                    mtmp.mtame = ghost.mtame;
                }
            }
            /* was ghost, now alive, it's all very confusing */
            mtmp.mconf = 1;
            await mongone(ghost);
        }
        free_omid(corpse);
    }
    /* monster retains its name */
    if (((corpse).oextra && ((corpse).oextra.oname)) && !(((mtmp.data).geno & 4096) != 0)) {
        mtmp = christen_monst(mtmp, ((corpse).oextra.oname));
    }
    if (corpse.oeaten) {
        mtmp.mhp = await eaten_stat(mtmp.mhp, corpse);
    }
    /* track that this monster was revived at least once */
    mtmp.mrevived = 1;
    switch (corpse.where) {
        case 3:
            await useup(corpse);
            break;
        case 1:
            await delobj_core(corpse, (1));
            break;
        case 4:
            await m_useup(corpse.v.v_ocarry, corpse);
            break;
        case 2:
            await obj_extract_self(corpse);
            await obfree(corpse, null);
            break;
        case 6:
            if (is_zomb) {
                await obj_extract_self(corpse);
                await obfree(corpse, null);
                break;
            }
            ;
        case 0:
        case 5:
        case 7:
        case 8:
        default:
            await panic("revive default case %d", corpse.where);
    }
    return mtmp;
}
/* nonnull */
export async function revive_egg(obj) {
    /*
     * Note: generic eggs with corpsenm set to NON_PM will never hatch.
     */
    if (obj.otyp != EGG) {
        return;
    }
    if (obj.corpsenm != NON_PM && !dead_species(obj.corpsenm, (1))) {
        await attach_egg_hatch_timeout(obj, 0);
    }
}
/* try to revive all corpses and eggs carried by `mon' */
export async function unturn_dead(mon) {
    let otmp = null;
    let otmp2 = null;
    let mtmp2 = null;
    let owner = '';
    let corpse = '';
    let save_norevive = 0;
    let youseeit = 0;
    let different_type = 0;
    let is_u = (mon == game.youmonst);
    let corpsenm = 0;
    let res = 0;
    youseeit = is_u ? (1) : canseemon(mon);
    otmp2 = is_u ? game.invent : mon.minvent;
    (corpse = '', owner = '');
    while ((otmp = otmp2) != null) {
        /* note: worn amulet of life saving must be preserved in order to operate */
        otmp2 = otmp.nobj;
        if (otmp.otyp == EGG) {
            await revive_egg(otmp);
        }
        if (otmp.otyp != CORPSE) {
            /* random index was too high; mollify analyzer by including < 0 */
            continue;
        }
        if (youseeit) {
            corpse = strcpy(corpse, await corpse_xname(otmp, null, 0));
            if (otmp.quan > 1) {
                owner = strcpy(owner, "One of ");
                await shk_your(eos(owner), otmp);
            } else {
                await Shk_Your(owner, otmp);
            }
        }
        /* for a stack, only one is revived; if is_u, revive() calls
           useup() which calls update_inventory() but not encumber_msg() */
        corpsenm = otmp.corpsenm;
        /* norevive applies to revive timer, not to explicit unturn_dead() */
        save_norevive = otmp.oeroded2;
        otmp.oeroded2 = 0;
        if ((mtmp2 = await revive(otmp, !game.context.mon_moving)) != null) {
            ++res;
            /* might get revived as a zombie rather than corpse's monster */
            different_type = (mtmp2.data != game.mons[corpsenm]);
            if (game.iflags.last_msg == PLNMSG_OBJ_GLOWS) {
                corpse = strcpy(corpse, "It");
                /* when hero zaps undead turning at self (or breaks
                   non-empty wand), revive() reports "[one of] your <mon>
                   corpse[s] glows iridescently"; override saved corpse
                   and owner names to say "It comes alive" [note: we did
                   earlier setup because corpse gets used up but need to
                   do the override here after revive() sets 'last_msg'] */
                owner = '';
            }
            if (youseeit) {
                await pline("%s%s suddenly %s%s%s!", owner, corpse, ((((mtmp2.data).mflags2 & 2) != 0) || (mtmp2.data) == game.mons[PM_MANES] || (((mtmp2.data).mlet == S_GOLEM) || (mtmp2.data).mlet == S_VORTEX)) ? "reanimates" : "comes alive", different_type ? " as " : "", different_type ? await an(mon_pmname(mtmp2)) : "");
            } else if (canseemon(mtmp2)) {
                await pline("%s suddenly appears!", await Amonnam(mtmp2));
            }
        } else {
            /* revival failed; corpse 'otmp' is intact */
            otmp.oeroded2 = save_norevive ? 1 : 0;
        }
    }
    if (is_u && res) {
        await encumber_msg();
    }
    return res;
}
export async function unturn_you() {
    await unturn_dead(game.youmonst);
    if ((((game.youmonst.data).mflags2 & 2) != 0)) {
        await You_feel("frightened and %sstunned.", game.u.uprops[STUNNED].intrinsic ? "even more " : "");
        await make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + rnd(30), (0));
    } else {
        await You("shudder in dread.");
    }
}
/* cancel obj, possibly carried by you or a monster */
export async function cancel_item(obj) {
    let otyp = obj.otyp;
    if (((obj).where == 3)) {
        switch (otyp) {
            case RIN_GAIN_STRENGTH:
                if ((obj.owornmask & (131072 | 262144)) != 0) {
                    (game.u.abon.a[A_STR]) -= obj.spe;
                    /* handle items being worn by hero */
                    game.disp.botl = (1);
                }
                break;
            case RIN_GAIN_CONSTITUTION:
                if ((obj.owornmask & (131072 | 262144)) != 0) {
                    (game.u.abon.a[A_CON]) -= obj.spe;
                    game.disp.botl = (1);
                }
                break;
            case RIN_ADORNMENT:
                if ((obj.owornmask & (131072 | 262144)) != 0) {
                    (game.u.abon.a[A_CHA]) -= obj.spe;
                    game.disp.botl = (1);
                }
                break;
            case RIN_INCREASE_ACCURACY:
                if ((obj.owornmask & (131072 | 262144)) != 0) {
                    game.u.uhitinc -= obj.spe;
                }
                break;
            case RIN_INCREASE_DAMAGE:
                if ((obj.owornmask & (131072 | 262144)) != 0) {
                    game.u.udaminc -= obj.spe;
                }
                break;
            case RIN_PROTECTION:
                if ((obj.owornmask & (131072 | 262144)) != 0) {
                    game.disp.botl = (1);
                }
                break;
            case GAUNTLETS_OF_DEXTERITY:
                if ((obj.owornmask & 16) != 0) {
                    (game.u.abon.a[A_DEX]) -= obj.spe;
                    game.disp.botl = (1);
                }
                break;
            case HELM_OF_BRILLIANCE:
                if ((obj.owornmask & 4) != 0) {
                    (game.u.abon.a[A_INT]) -= obj.spe;
                    (game.u.abon.a[A_WIS]) -= obj.spe;
                    game.disp.botl = (1);
                }
                break;
            default:
                if ((obj.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) != 0) {
                    game.disp.botl = (1);
                }
                break;
        }
    }
    if (game.objects[otyp].oc_magic || (obj.spe && (obj.oclass == ARMOR_CLASS || obj.oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE))) || otyp == POT_ACID || otyp == POT_SICKNESS || (otyp == POT_WATER && (obj.blessed || obj.cursed)) || otyp == SPE_NOVEL) {
        /* cancelled item might not be in hero's possession but
       cancellation is presumed to be instigated by hero */
        /* not magic; cancels to blank spellbook */
        let cancelled_spe = (obj.oclass == WAND_CLASS || otyp == CRYSTAL_BALL) ? -1 : 0;
        if (obj.spe != cancelled_spe && otyp != WAN_CANCELLATION && otyp != MAGIC_LAMP && otyp != CANDELABRUM_OF_INVOCATION) {
            await costly_alteration(obj, COST_CANCEL);
            obj.spe = cancelled_spe;
        }
        switch (obj.oclass) {
            case SCROLL_CLASS:
                await costly_alteration(obj, COST_CANCEL);
                obj.otyp = SCR_BLANK_PAPER;
                obj.spe = 0;
                break;
            case SPBOOK_CLASS:
                if (otyp != SPE_CANCELLATION && otyp != SPE_BOOK_OF_THE_DEAD) {
                    await costly_alteration(obj, COST_CANCEL);
                    obj.otyp = SPE_BLANK_PAPER;
                    if (otyp == SPE_NOVEL) {
                        await blank_novel(obj);
                    }
                }
                break;
            case POTION_CLASS:
                await costly_alteration(obj, (otyp != POT_WATER) ? COST_CANCEL : obj.cursed ? COST_UNCURS : COST_UNBLSS);
                if (otyp == POT_SICKNESS || otyp == POT_SEE_INVISIBLE) {
                    /* sickness is "biologically contaminated" fruit juice;
                   cancel it and it just becomes fruit juice...
                   whereas see invisible tastes like "enchanted" fruit
                   juice, it similarly cancels */
                    obj.otyp = POT_FRUIT_JUICE;
                } else {
                    obj.otyp = POT_WATER;
                    obj.oeroded = 0;
                }
                break;
        }
    }
    if (obj.otyp == CORPSE && obj.timed && !((game.mons[obj.corpsenm]) == game.mons[PM_DEATH] || (game.mons[obj.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[obj.corpsenm]) == game.mons[PM_PESTILENCE])) {
        /* cancelling a troll's corpse prevents it from reviving (on its own;
       does not affect undead turning induced revival) */
        let a = obj_to_any(obj);
        let timout = peek_timer(REVIVE_MON, a);
        if (timout) {
            stop_timer(REVIVE_MON, a);
            await start_timer(timout, TIMER_OBJECT, ROT_CORPSE, a);
        }
    }
    await unbless(obj);
    await uncurse(obj);
    return;
}
/* soaking or cancelling a novel converts it into a blank spellbook but
   needs more than just changing its otyp (caller is responsible for that) */
export async function blank_novel(obj) {
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    /* novelidx overloads corpsenm, not used for spellbooks */
    obj.corpsenm = 0;
    /* get rid of [former] novel's title */
    free_oname(obj);
    await container_weight(obj);
}
/* Remove a positive enchantment or charge from obj,
 * possibly carried by you or a monster
 */
export async function drain_item(obj, by_you) {
    let u_ring = 0;
    /* Is this a charged/enchanted object? */
    if (!obj || (!game.objects[obj.otyp].oc_charged && obj.oclass != WEAPON_CLASS && obj.oclass != ARMOR_CLASS && !((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE)) || obj.spe <= 0) {
        return (0);
    }
    if (defends(15, obj) || defends_when_carried(15, obj) || obj_resists(obj, 10, 90)) {
        return (0);
    }
    if (by_you) {
        await costly_alteration(obj, COST_DRAIN);
    }
    /* Drain the object and any implied effects */
    obj.spe--;
    u_ring = (obj == game.uleft) || (obj == game.uright);
    switch (obj.otyp) {
        case RIN_GAIN_STRENGTH:
            if ((obj.owornmask & (131072 | 262144)) && u_ring) {
                (game.u.abon.a[A_STR])--;
                game.disp.botl = (1);
            }
            break;
        case RIN_GAIN_CONSTITUTION:
            if ((obj.owornmask & (131072 | 262144)) && u_ring) {
                (game.u.abon.a[A_CON])--;
                game.disp.botl = (1);
            }
            break;
        case RIN_ADORNMENT:
            if ((obj.owornmask & (131072 | 262144)) && u_ring) {
                (game.u.abon.a[A_CHA])--;
                game.disp.botl = (1);
            }
            break;
        case RIN_INCREASE_ACCURACY:
            if ((obj.owornmask & (131072 | 262144)) && u_ring) {
                game.u.uhitinc--;
            }
            break;
        case RIN_INCREASE_DAMAGE:
            if ((obj.owornmask & (131072 | 262144)) && u_ring) {
                game.u.udaminc--;
            }
            break;
        case RIN_PROTECTION:
            if (u_ring) {
                game.disp.botl = (1);
            }
            break;
        case HELM_OF_BRILLIANCE:
            if ((obj.owornmask & 4) && (obj == game.uarmh)) {
                (game.u.abon.a[A_INT])--;
                (game.u.abon.a[A_WIS])--;
                game.disp.botl = (1);
            }
            break;
        case GAUNTLETS_OF_DEXTERITY:
            if ((obj.owornmask & 16) && (obj == game.uarmg)) {
                (game.u.abon.a[A_DEX])--;
                game.disp.botl = (1);
            }
            break;
        default:
            break;
    }
    if (game.disp.botl) {
        await bot();
    }
    if (((obj).where == 3)) {
        update_inventory();
    }
    return (1);
}
/* percent chance for ordinary objects */
/* percent chance for artifacts */
export function obj_resists(obj, ochance, achance) {
    if (obj.otyp == AMULET_OF_YENDOR || obj.otyp == SPE_BOOK_OF_THE_DEAD || obj.otyp == CANDELABRUM_OF_INVOCATION || obj.otyp == BELL_OF_OPENING || (obj.otyp == CORPSE && ((game.mons[obj.corpsenm]) == game.mons[PM_DEATH] || (game.mons[obj.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[obj.corpsenm]) == game.mons[PM_PESTILENCE]))) {
        return (1);
    } else {
        let chance = rn2(100);
        return (chance < (obj.oartifact ? achance : ochance));
    }
}
export function obj_shudders(obj) {
    let zap_odds = 0;
    if (game.context.bypasses && obj.bypass) {
        return (0);
    }
    if (obj.oclass == WAND_CLASS) {
        zap_odds = 3;
    } else if (obj.cursed) {
        zap_odds = 3;
    } else if (obj.blessed) {
        zap_odds = 12;
    } else {
        zap_odds = 8;
    }
    /* adjust for "large" quantities of identical things */
    if (obj.quan > 4) {
        zap_odds = Math.trunc(zap_odds / 2);
    }
    return !rn2(zap_odds);
}
/* Use up at least minwt number of things made of material mat.
 * There's also a chance that other stuff will be used up.  Finally,
 * there's a random factor here to keep from always using the stuff
 * at the top of the pile.
 */
export async function polyuse(objhdr, mat, minwt) {
    let otmp = null;
    let otmp2 = null;
    for (otmp = objhdr; minwt > 0 && otmp; otmp = otmp2) {
        otmp2 = otmp.v.v_nexthere;
        if (game.context.bypasses && otmp.bypass) {
            continue;
        }
        if (otmp == game.uball || otmp == game.uchain) {
            continue;
        }
        if (obj_resists(otmp, 0, 0)) {
            continue;
        }
        if (otmp.otyp == SCR_MAIL) {
            continue;
        }
        if ((game.objects[otmp.otyp].oc_material == mat) == (rn2(minwt + 1) != 0)) {
            if (await costly_spot(otmp.ox, otmp.oy)) {
                if (game.u.ushops) {
                    await addtobill(otmp, (0), (0), (0));
                } else {
                    await stolen_value(otmp, otmp.ox, otmp.oy, (0), (0));
                }
            }
            if (otmp.quan < 32767) {
                minwt -= otmp.quan;
            } else {
                minwt = 0;
            }
            await delobj(otmp);
        }
    }
}
/*
 * Polymorph some of the stuff in this pile into a monster, preferably
 * a golem of the kind okind.
 */
export async function create_polymon(obj, okind) {
    let mdat = null;
    let mtmp = null;
    let material = null;
    let pm_index = 0;
    if (game.context.bypasses) {
        /* this is approximate because the "no golems" !obj->nexthere
           check below doesn't understand bypassed objects; but it
           should suffice since bypassed objects always end up as a
           consecutive group at the top of their pile */
        while (obj && obj.bypass) {
            obj = obj.v.v_nexthere;
        }
    }
    /* no golems if you zap only one object -- not enough stuff */
    if (!obj || (!obj.v.v_nexthere && obj.quan == 1)) {
        return;
    }
    switch (okind) {
        /* some of these choices are arbitrary */
        case IRON:
        case METAL:
        case MITHRIL:
            pm_index = PM_IRON_GOLEM;
            material = "metal ";
            break;
        case COPPER:
        case SILVER:
        case PLATINUM:
        case GEMSTONE:
        case MINERAL:
            pm_index = rn2(2) ? PM_STONE_GOLEM : PM_CLAY_GOLEM;
            material = "lithic ";
            break;
        case 0:
        case FLESH:
            pm_index = PM_FLESH_GOLEM;
            material = "organic ";
            break;
        case WOOD:
            pm_index = PM_WOOD_GOLEM;
            material = "wood ";
            break;
        case LEATHER:
            pm_index = PM_LEATHER_GOLEM;
            material = "leather ";
            break;
        case CLOTH:
            pm_index = PM_ROPE_GOLEM;
            material = "cloth ";
            break;
        case BONE:
            pm_index = PM_SKELETON;
            /* nearest thing to "bone golem" */
            material = "bony ";
            break;
        case GOLD:
            pm_index = PM_GOLD_GOLEM;
            material = "gold ";
            break;
        case GLASS:
            pm_index = PM_GLASS_GOLEM;
            material = "glassy ";
            break;
        case PAPER:
            pm_index = PM_PAPER_GOLEM;
            material = "paper ";
            break;
        default:
            pm_index = PM_STRAW_GOLEM;
            material = "";
            break;
    }
    if (!(game.mvitals[pm_index].mvflags & 2)) {
        mdat = game.mons[pm_index];
    }
    mtmp = await makemon(mdat, obj.ox, obj.oy, 131072);
    await polyuse(obj, okind, game.mons[pm_index].cwt);
    if (mtmp && ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
        await pline("Some %sobjects meld, and %s arises from the pile!", material, await a_monnam(mtmp));
    }
}
/* Assumes obj is on the floor. */
export async function do_osshock(obj) {
    let i = 0;
    if (obj.otyp == SCR_MAIL) {
        return;
    }
    game.obj_zapped = (1);
    if (game.poly_zapped < 0) {
        for (i = obj.quan; i; i--) {
            if (!rn2((game.u.uluck + game.u.moreluck) + 45)) {
                game.poly_zapped = game.objects[obj.otyp].oc_material;
                break;
            }
        }
    }
    if (obj.quan > 1) {
        if (obj.quan > 32767) {
            obj = await splitobj(obj, rnd(30000));
        } else {
            obj = await splitobj(obj, rnd(obj.quan - 1));
        }
    }
    if (await costly_spot(obj.ox, obj.oy)) {
        if (game.u.ushops) {
            await addtobill(obj, (0), (0), (0));
        } else {
            await stolen_value(obj, obj.ox, obj.oy, (0), (0));
        }
    }
    await delobj(obj);
}
/* Returns TRUE if obj resists polymorphing */
export function obj_unpolyable(obj) {
    return (((obj).otyp == WAN_POLYMORPH || (obj).otyp == SPE_POLYMORPH || (obj).otyp == POT_POLYMORPH || (obj).otyp == AMULET_OF_UNCHANGING) || obj == game.uball || obj == game.uskin || obj_resists(obj, 5, 95));
}
/* classes of items whose current charge count carries over across polymorph
 */
export const charged_objs = [WAND_CLASS, WEAPON_CLASS, ARMOR_CLASS, 0];
/*
 * Polymorph the object to the given object ID.  If the ID is STRANGE_OBJECT
 * then pick random object from the source's class (this is the standard
 * "polymorph" case).  If ID is set to a specific object, inhibit fusing
 * n objects into 1.  This could have been added as a flag, but currently
 * it is tied to not being the standard polymorph case. The new polymorphed
 * object replaces obj in its link chains.  Return value is a pointer to
 * the new object.
 *
 * This should be safe to call for an object anywhere.
 */
export async function poly_obj(obj, id) {
    let otmp = null;
    let ox = 0;
    let oy = 0;
    let old_wornmask = 0;
    let new_wornmask = 0;
    let can_merge = (id == STRANGE_OBJECT);
    let obj_location = obj.where;
    if (obj.otyp == BOULDER) {
        sokoban_guilt();
    }
    if (id == STRANGE_OBJECT) {
        let try_limit = 3;
        let magic_obj = game.objects[obj.otyp].oc_magic;
        if (obj.otyp == UNICORN_HORN && obj.obroken) {
            magic_obj = 0;
        }
        /* Try up to 3 times to make the magic-or-not status of
           the new item the same as the old item. */
        otmp = null;
        do {
            if (otmp) {
                await delobj(otmp);
            }
            otmp = await mkobj(obj.oclass, (0));
        } while (--try_limit > 0 && game.objects[otmp.otyp].oc_magic != magic_obj);
    } else {
        otmp = await mksobj(id, (0), (0));
        /* Actually more things use corpsenm but they polymorph differently */
        if (((obj.otyp) == CORPSE || (obj.otyp) == STATUE || (obj.otyp) == FIGURINE) && ((id) == CORPSE || (id) == STATUE || (id) == FIGURINE)) {
            await set_corpsenm(otmp, obj.corpsenm);
        }
    }
    otmp.quan = obj.quan;
    /* preserve the shopkeeper's (lack of) interest */
    otmp.no_charge = obj.no_charge;
    /* preserve inventory letter if in inventory */
    if (obj_location == 3) {
        otmp.invlet = obj.invlet;
    }
    if (obj.otyp == SCR_MAIL) {
        /* You can't send yourself 100 mail messages and then
     * polymorph them into useful scrolls
     */
        otmp.otyp = SCR_MAIL;
        otmp.spe = 1;
    }
    if (obj.otyp == EGG && obj.spe) {
        /* avoid abusing eggs laid by you */
        let mnum = 0;
        let tryct = 100;
        if (otmp.otyp == EGG) {
            kill_egg(otmp);
        /* first, turn into a generic egg */
        } else {
            otmp.otyp = EGG;
            otmp.owt = await weight(otmp);
        }
        otmp.corpsenm = NON_PM;
        otmp.spe = 0;
        while (tryct--) {
            /* now change it into something laid by the hero */
            mnum = can_be_hatched(((rn2)(NUMMONS)));
            if (mnum != NON_PM && !dead_species(mnum, (1))) {
                otmp.spe = 1;
                await set_corpsenm(otmp, mnum);
                break;
            }
        }
    }
    /* keep special fields (including charges on wands) */
    if (strchr(charged_objs, otmp.oclass)) {
        otmp.spe = obj.spe;
    }
    otmp.recharged = obj.recharged;
    otmp.cursed = obj.cursed;
    otmp.blessed = obj.blessed;
    if (erosion_matters(otmp)) {
        if (is_flammable(otmp) || (game.objects[otmp.otyp].oc_material == IRON) || (game.objects[(otmp).otyp].oc_material == GLASS && (otmp).oclass == ARMOR_CLASS)) {
            otmp.oeroded = obj.oeroded;
        }
        if ((game.objects[otmp.otyp].oc_material == COPPER || game.objects[otmp.otyp].oc_material == IRON) || is_rottable(otmp)) {
            otmp.oeroded2 = obj.oeroded2;
        }
        if (((game.objects[otmp.otyp].oc_material == IRON) || is_flammable(otmp) || is_rottable(otmp) || (game.objects[otmp.otyp].oc_material == COPPER || game.objects[otmp.otyp].oc_material == IRON) || (game.objects[(otmp).otyp].oc_material == GLASS && (otmp).oclass == ARMOR_CLASS))) {
            otmp.oerodeproof = obj.oerodeproof;
        }
    }
    /* Keep chest/box traps and poisoned ammo if we may */
    if (obj.otrapped && ((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST)) {
        otmp.otrapped = 1;
    }
    if (obj.otrapped && ((otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp >= -P_SHURIKEN && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) || permapoisoned(otmp))) {
        otmp.otrapped = 1;
    }
    if (id == STRANGE_OBJECT && obj.otyp == CORPSE) {
        if (obj.corpsenm == PM_CROCODILE) {
            /* turn crocodile corpses into shoes */
            otmp.otyp = LOW_BOOTS;
            otmp.oclass = ARMOR_CLASS;
            otmp.spe = 0;
            otmp.oeroded = 0;
            otmp.oerodeproof = (1);
            otmp.quan = 1;
            otmp.cursed = (0);
        }
    }
    if (obj.otyp == LEASH && obj.corpsenm != 0) {
        if (otmp.otyp == LEASH) {
            otmp.corpsenm = obj.corpsenm;
            /* clear m_id before delobj(), to avoid o_unleash() by obfree() */
            obj.corpsenm = 0;
        } else {
            /* obfree() would do this if we didn't do it here */
            o_unleash(obj);
        }
    }
    if (((otmp).cobj != null)) {
        await delete_contents(otmp);
    }
    /* 'n' merged objects may be fused into 1 object */
    if (otmp.quan > 1 && (!game.objects[otmp.otyp].oc_merge || (can_merge && otmp.quan > rn2(1000)))) {
        otmp.quan = 1;
    }
    switch (otmp.oclass) {
        case TOOL_CLASS:
            if (otmp.otyp == MAGIC_LAMP) {
                otmp.otyp = OIL_LAMP;
                /* "best" oil lamp possible */
                otmp.age = 1500;
            } else if (otmp.otyp == MAGIC_MARKER) {
                otmp.recharged = 1;
            }
            break;
        case WAND_CLASS:
            while (otmp.otyp == WAN_WISHING || otmp.otyp == WAN_POLYMORPH) {
                otmp.otyp = rnd_class(WAN_LIGHT, WAN_LIGHTNING);
            }
            /* altering the object tends to degrade its quality
           (analogous to spellbook `read count' handling) */
            if (otmp.recharged < rn2(7)) {
                otmp.recharged++;
            }
            break;
        case POTION_CLASS:
            while (otmp.otyp == POT_POLYMORPH) {
                otmp.otyp = rnd_class(POT_GAIN_ABILITY, POT_WATER);
            }
            /* potions of oil use obj->age field differently from other potions */
            if (otmp.otyp == POT_OIL || obj.otyp == POT_OIL) {
                fixup_oil(otmp, obj);
            }
            break;
        case SPBOOK_CLASS:
            while (otmp.otyp == SPE_POLYMORPH) {
                otmp.otyp = rnd_class(game.bases[SPBOOK_CLASS], SPE_BLANK_PAPER);
            }
            if (otmp.otyp != SPE_BLANK_PAPER && otmp.otyp != SPE_NOVEL) {
                /* reduce spellbook abuse; non-blank books degrade;
           5.0: novels don't use spestudied so shouldn't degrade to blank
           (but don't force spestudied to zero for them since a non-zero
           value could get passed along to a future polymorph) */
                otmp.usecount = obj.usecount + 1;
                if (otmp.usecount > 3) {
                    otmp.otyp = SPE_BLANK_PAPER;
                    /* writing a new book over it will yield an unstudied
                   one; re-polymorphing this one as-is may or may not
                   get something non-blank */
                    otmp.usecount = rn2(otmp.usecount);
                }
            }
            break;
        case GEM_CLASS:
            if (otmp.quan > rnd(4) && game.objects[obj.otyp].oc_material == MINERAL && game.objects[otmp.otyp].oc_material != MINERAL) {
                otmp.otyp = ROCK;
                /* some material has been lost */
                otmp.quan = Math.trunc(otmp.quan / 2);
            }
            break;
    }
    otmp.owt = await weight(otmp);
    /*
     * ** we are now done adjusting the object (except possibly wearing it) **
     */
    get_obj_location(obj, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 2 | 1);
    old_wornmask = obj.owornmask & ~(4096 | 8192);
    await replace_object(obj, otmp);
    if (obj_location == 3) {
        await freeinv_core(obj);
        await addinv_core1(otmp);
        await addinv_core2(otmp);
        if (old_wornmask) {
            /*
         * Handle polymorph of worn item.  Stone-to-flesh cast on self can
         * affect multiple objects at once, but their new forms won't
         * produce any side-effects.  A single worn item dipped into potion
         * of polymorph can produce side-effects but those won't yield out
         * of sequence messages because current polymorph is finished.
         */
            let was_twohanded = ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_big);
            let was_twoweap = game.u.twoweap;
            /* wearslot() expects us to deal with wielded/alt-wep/quivered
               items in case they're not weapons; for other slots it might
               return multiple bits (ring left|right); narrow that down to
               the bit(s) currently in use */
            new_wornmask = ((old_wornmask & (256 | 1024 | 512)) != 0) ? old_wornmask : (wearslot(otmp) & old_wornmask);
            await remove_worn_item(obj, (1));
            if ((new_wornmask & 256) != 0) {
                /* if the new form can be worn in the same slot, make it so */
                if (was_twohanded || !((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_big) || !game.uarms) {
                    await setuwep(otmp);
                }
                if (was_twoweap && game.uwep && !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
                    set_twoweap((1));
                }
            } else if ((new_wornmask & 1024) != 0) {
                if (was_twohanded || !((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_big)) {
                    await setuswapwep(otmp);
                }
                if (was_twoweap && game.uswapwep) {
                    set_twoweap((1));
                }
            } else if ((new_wornmask & 512) != 0) {
                await setuqwep(otmp);
            } else if (new_wornmask) {
                await setworn(otmp, new_wornmask);
                await set_wear(otmp);
                otmp = wearmask_to_obj(new_wornmask);
            }
        }
    } else if (obj_location == 1) {
        if (obj.otyp == BOULDER && otmp.otyp != BOULDER) {
            if (!does_block(ox, oy, game.level.locations[ox][oy])) {
                unblock_point(ox, oy);
            }
        } else if (obj.otyp != BOULDER && otmp.otyp == BOULDER) {
            if (is_pool_or_lava(ox, oy)) {
                await fracture_rock(otmp);
            }
            if (does_block(ox, oy, game.level.locations[ox][oy])) {
                block_point(ox, oy);
            }
        }
    }
    if (((otmp && !((otmp).where == 3)) || obj.unpaid) && await costly_spot(ox, oy)) {
        let shkp = await shop_keeper(in_rooms(ox, oy, SHOPBASE));
        if ((!obj.no_charge || (((obj).cobj != null) && (await contained_cost(obj, shkp, 0, (0), (0)) != 0))) && inhishop(shkp)) {
            if (shkp.mpeaceful) {
                if (game.u.ushops && (in_rooms(game.u.ux, game.u.uy, 0) == in_rooms(shkp.mx, shkp.my, 0)) && !await costly_spot(game.u.ux, game.u.uy)) {
                    await make_angry_shk(shkp, ox, oy);
                } else {
                    await pline("%s gets angry!", await Shknam(shkp));
                    hot_pursuit(shkp);
                }
            } else {
                await Norep("%s is furious!", await Shknam(shkp));
            }
        }
    }
    await delobj(obj);
    return otmp;
}
/* stone-to-flesh spell hits and maybe transforms or animates obj */
/* nonnull */
export async function stone_to_flesh_obj(obj) {
    let ptr = null;
    let mon = null;
    let shkp = null;
    let item = null;
    let oox = 0;
    let ooy = 0;
    let smell = (0);
    let golem_xform = (0);
    /* affected object by default */
    let res = 1;
    if (game.objects[obj.otyp].oc_material != MINERAL && game.objects[obj.otyp].oc_material != GEMSTONE) {
        return 0;
    }
    /* Heart of Ahriman usually resists; ordinary items rarely do */
    if (obj_resists(obj, 2, 98)) {
        return 0;
    }
    get_obj_location(obj, { get value() { return oox; }, set value(_v) { oox = _v; } }, { get value() { return ooy; }, set value(_v) { ooy = _v; } }, 0);
    switch (game.objects[obj.otyp].oc_class) {
        case ROCK_CLASS:
        case TOOL_CLASS:
            if (obj.otyp == BOULDER) {
                obj = await poly_obj(obj, ENORMOUS_MEATBALL);
                smell = (1);
            } else if (obj.otyp == STATUE || obj.otyp == FIGURINE) {
                ptr = game.mons[obj.corpsenm];
                if (((ptr).mlet == S_GOLEM)) {
                    golem_xform = (ptr != game.mons[PM_FLESH_GOLEM]);
                } else if ((((ptr).mlet == S_BLOB || (ptr).mlet == S_JELLY || (ptr).mlet == S_FUNGUS || (ptr).mlet == S_VORTEX || (ptr).mlet == S_LIGHT || ((ptr).mlet == S_ELEMENTAL && (ptr) != game.mons[PM_STALKER]) || ((ptr).mlet == S_GOLEM && (ptr) != game.mons[PM_FLESH_GOLEM] && (ptr) != game.mons[PM_LEATHER_GOLEM]) || ((ptr).mlet == S_GHOST)) || ((ptr).mlet == S_PUDDING && (ptr) != game.mons[PM_BLACK_PUDDING]))) {
                    obj = await poly_obj(obj, MEATBALL);
                    smell = (1);
                    /* fireballs explode before the obstacle */
                    break;
                }
                if (obj.otyp == STATUE) {
                    mon = await animate_statue(obj, oox, ooy, 2, null);
                } else {
                    if (golem_xform) {
                        ptr = game.mons[PM_FLESH_GOLEM];
                    }
                    mon = await makemon(ptr, oox, ooy, 1 | 131072);
                    if (mon) {
                        if (await costly_spot(oox, ooy) && (((obj).where == 3) ? obj.unpaid : !obj.no_charge)) {
                            shkp = await shop_keeper(in_rooms(oox, ooy, SHOPBASE));
                            await stolen_value(obj, oox, ooy, (shkp && shkp.mpeaceful), (0));
                        }
                        if (obj.timed) {
                            obj_stop_timers(obj);
                        }
                        if (((obj).where == 3)) {
                            await useup(obj);
                        } else {
                            await delobj(obj);
                        }
                        if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
                            await pline_The("figurine %sanimates!", golem_xform ? "turns to flesh and " : "");
                        }
                    }
                }
                if (mon) {
                    ptr = mon.data;
                    /* this golem handling is redundant... */
                    if (((ptr).mlet == S_GOLEM) && ptr != game.mons[PM_FLESH_GOLEM]) {
                        await newcham(mon, game.mons[PM_FLESH_GOLEM], 2);
                    }
                } else if ((ptr.geno & (16 | 4096)) != 0) {
                    /* didn't revive but can't leave corpse either */
                    /* miscellaneous tool or unexpected rock... */
                    res = 0;
                } else {
                    while ((item = obj.cobj) != null) {
                        /* unlikely to get here since genociding monsters also
                   sets the G_NOCORPSE flag; drop statue's contents */
                        /* make stone-to-flesh miss it */
                        bypass_obj(item);
                        await obj_extract_self(item);
                        await place_object(item, oox, ooy);
                    }
                    obj = await poly_obj(obj, CORPSE);
                }
            } else {
                res = 0;
            }
            break;
        /* maybe add weird things to become? */
        /* some of the rings are stone */
        case RING_CLASS:
            obj = await poly_obj(obj, MEAT_RING);
            smell = (1);
            break;
        case WAND_CLASS:
            obj = await poly_obj(obj, MEAT_STICK);
            smell = (1);
            break;
        case GEM_CLASS:
            obj = await poly_obj(obj, MEATBALL);
            smell = (1);
            break;
        case WEAPON_CLASS:
            ;
        default:
            res = 0;
            break;
    }
    ((obj));
    if (smell) {
        if ((game.urole.mnum == (PM_MONK)) || !game.u.uconduct.unvegetarian || !(((game.youmonst.data).mflags1 & 536870912) != 0)) {
            await Norep("You smell the odor of meat.");
        } else {
            await Norep("You smell a delicious smell.");
        }
    }
    await newsym(oox, ooy);
    return res;
}
/*
 * Object obj was hit by the effect of the wand/spell otmp.  Return
 * non-zero if the wand/spell had any effect.
 */
export async function bhito(obj, otmp) {
    let res = 1;
    let learn_it = (0);
    let maybelearnit = 0;
    /* fundamental: a wand effect hitting itself doesn't do anything;
       otherwise we need to guard against accessing otmp after something
       strange has happened to it (along the lines of polymorph or
       stone-to-flesh [which aren't good examples since polymorph wands
       aren't affected by polymorph zaps and stone-to-flesh isn't
       available in wand form, but the concept still applies...]) */
    if (obj == otmp) {
        return 0;
    }
    if (obj.bypass) {
        if (game.context.bypasses) {
            /* The bypass bit is currently only used as follows:
         *
         * POLYMORPH - When a monster being polymorphed drops something
         *             from its inventory as a result of the change.
         *             If the items fall to the floor, they are not
         *             subject to direct subsequent polymorphing
         *             themselves on that same zap.  This makes it
         *             consistent with items that remain in the monster's
         *             inventory.  They are not polymorphed either.
         * UNDEAD_TURNING - When an undead creature gets killed via
         *             undead turning, prevent its corpse from being
         *             immediately revived by the same effect.
         * STONE_TO_FLESH - If a statue can't be revived, its
         *             contents get dropped before turning it into
         *             meat; prevent those contents from being hit.
         * retouch_equipment() - bypass flag is used to track which
         *             items have been handled (bhito isn't involved).
         * menu_drop(), askchain() - inventory traversal where multiple
         *             Drop can alter the invent chain while traversal
         *             is in progress (bhito isn't involved).
         * destroy_items() - inventory traversal where item destruction can
         *             trigger drop or destruction of other item(s) and alter
         *             the invent or mon->minvent chain, possibly recursively.
         *
         * The bypass bit on all objects is reset each turn, whenever
         * svc.context.bypasses is set.
         *
         * We check the obj->bypass bit above AND svc.context.bypasses
         * as a safeguard against any stray occurrence left in an obj
         * struct someplace, although that should never happen.
         */
            return 0;
        } else {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/zap.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    await pline("%s for a moment.", await Tobjnam(obj, "pulsate"));
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            obj.bypass = 0;
        }
    }
    /*
     * Some parts of this function expect the object to be on the floor
     * obj->{ox,oy} to be valid.  The exception to this (so far) is
     * for the STONE_TO_FLESH spell.
     */
    if (!(obj.where == 1 || otmp.otyp == SPE_STONE_TO_FLESH)) {
        await impossible("bhito: obj is not floor or Stone To Flesh spell");
    }
    if (obj == game.uball) {
        res = 0;
    } else if (obj == game.uchain) {
        if (otmp.otyp == WAN_OPENING || otmp.otyp == SPE_KNOCK) {
            learn_it = (1);
            await unpunish();
        } else {
            res = 0;
        }
    } else {
        switch (otmp.otyp) {
            case WAN_POLYMORPH:
            case SPE_POLYMORPH:
                if (obj_unpolyable(obj)) {
                    res = 0;
                    break;
                }
                if (!game.u.uconduct.polypiles++) {
                    livelog_printf(32, "polymorphed %s first object", (genders[game.flags.female ? 1 : 0].his));
                }
                /* any saved lock context will be dangerously obsolete */
                if (((obj).otyp == LARGE_BOX || (obj).otyp == CHEST)) {
                    await boxlock(obj, otmp);
                }
                if (obj_shudders(obj)) {
                    let cover = ((obj == game.level.objects[game.u.ux][game.u.uy]) && game.u.uundetected && (((game.youmonst.data).mflags1 & 128) != 0));
                    if (((game.viz_array[obj.oy][obj.ox] & 2) != 0)) {
                        learn_it = (1);
                    }
                    await do_osshock(obj);
                    if (cover) {
                        await hideunder(game.youmonst);
                    }
                    break;
                }
                obj = await poly_obj(obj, STRANGE_OBJECT);
                await newsym(obj.ox, obj.oy);
                break;
            case WAN_PROBING:
                res = !obj.dknown;
                await observe_object(obj);
                if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) || obj.otyp == STATUE) {
                    obj.cknown = obj.lknown = 1;
                    if (((obj).otyp == LARGE_BOX || (obj).otyp == CHEST) && !obj.tknown) {
                        if (obj.otrapped) {
                            await pline("%s trapped!", await Tobjnam(obj, "are"));
                        }
                        obj.tknown = 1;
                    }
                    if (!obj.cobj) {
                        await pline("%s empty.", await Tobjnam(obj, "are"));
                    } else if (((obj).otyp == LARGE_BOX && (obj).spe == 1)) {
                        await You("aren't sure whether %s has %s or its corpse inside.", await the(await xname(obj)), await an((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? await rndmonnam(null) : "cat"));
                        obj.cknown = 0;
                    } else {
                        let o = null;
                        for (o = obj.cobj; o; o = o.nobj) {
                            await observe_object(o);
                        }
                        await display_cinventory(obj);
                    }
                    res = 1;
                } else if (obj.otyp == TIN) {
                    /* unfortunately, we can't tell whether rndmonnam()
                           picks a form which can't leave a corpse */
                    /* don't learn wand if tin is already known */
                    if (!obj.known || !obj.cknown) {
                        res = 1;
                    }
                    /* [should this call learn_egg_type()?] */
                    obj.known = 1;
                    set_cknown_lknown(obj);
                } else if (obj.otyp == EGG) {
                    /* if egg is unhatchable, probing it won't learn wand
                   because even when flagged as known, it's just "an egg" */
                    if (!obj.known && obj.corpsenm != NON_PM) {
                        res = 1;
                    }
                    obj.known = 1;
                }
                if (res) {
                    learn_it = (1);
                }
                break;
            case WAN_STRIKING:
            case SPE_FORCE_BOLT:
                maybelearnit = ((game.viz_array[obj.oy][obj.ox] & 2) != 0) || !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf);
                if (obj.otyp == BOULDER) {
                    ;
                    if (((game.viz_array[obj.oy][obj.ox] & 2) != 0)) {
                        await pline_The("boulder falls apart.");
                    } else {
                        await You_hear("a crumbling sound.");
                    }
                    await fracture_rock(obj);
                } else if (obj.otyp == STATUE) {
                    if (await break_statue(obj)) {
                        if (((game.viz_array[obj.oy][obj.ox] & 2) != 0)) {
                            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                                await pline_The("%s shatters.", await rndmonnam(null));
                            } else {
                                await pline_The("statue shatters.");
                            }
                        } else {
                            await You_hear("a crumbling sound.");
                        }
                    }
                } else {
                    let oox = obj.ox;
                    let ooy = obj.oy;
                    if (game.context.mon_moving ? !await breaks(obj, oox, ooy) : !await hero_breaks(obj, oox, ooy, 0)) {
                        maybelearnit = (0);
                    } else {
                        await newsym_force(oox, ooy);
                    }
                    res = 0;
                }
                if (maybelearnit) {
                    learn_it = (1);
                }
                break;
            case WAN_CANCELLATION:
            case SPE_CANCELLATION:
                await cancel_item(obj);
                await newsym(obj.ox, obj.oy);
                break;
            case SPE_DRAIN_LIFE:
                await drain_item(obj, (1));
                break;
            case WAN_TELEPORTATION:
            case SPE_TELEPORT_AWAY:
{
                    let ox = obj.ox;
                    let oy = obj.oy;
                    await rloco(obj);
                    await maybe_unhide_at(ox, oy);
                }
                break;
            case WAN_MAKE_INVISIBLE:
                break;
            case WAN_UNDEAD_TURNING:
            case SPE_TURN_UNDEAD:
                if (obj.otyp == EGG) {
                    await revive_egg(obj);
                } else if (obj.otyp == CORPSE) {
                    let mtmp = null;
                    let ox = 0;
                    let oy = 0;
                    let save_norevive = 0;
                    let by_u = !game.context.mon_moving;
                    let corpsenm = corpse_revive_type(obj);
                    let corpsname = await cxname_singular(obj);
                    /* get corpse's location before revive() uses it up */
                    if (!get_obj_location(obj, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 0)) {
                        ox = obj.ox , oy = obj.oy;
                    }
                    /* explicit revival magic overrides timer-based no-revive */
                    save_norevive = obj.oeroded2;
                    obj.oeroded2 = 0;
                    mtmp = await revive(obj, (1));
                    if (!mtmp) {
                        obj.oeroded2 = save_norevive;
                        /* no monster implies corpse was left intact */
                        res = 0;
                    } else {
                        if (((game.viz_array[oy][ox] & 2) != 0)) {
                            if ((canseemon(mtmp) || sensemon(mtmp))) {
                                await pline("%s is resurrected!", upstart(await noname_monnam(mtmp, 1)));
                                learn_it = by_u ? (1) : game.zap_oseen;
                            } else {
                                /* saw corpse but don't see monster: maybe
                               mtmp is invisible, or has been placed at
                               a different spot than <ox,oy> */
                                /* couldn't see corpse's location */
                                if (!(((game.mons[corpsenm]).mflags2 & 524288) != 0)) {
                                    corpsname = await The(corpsname);
                                }
                                await pline("%s disappears.", corpsname);
                            }
                        } else {
                            if ((game.urole.mnum == (PM_HEALER)) && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !((((game.mons[corpsenm]).mflags2 & 2) != 0) || (game.mons[corpsenm]) == game.mons[PM_MANES] || (((game.mons[corpsenm]).mlet == S_GOLEM) || (game.mons[corpsenm]).mlet == S_VORTEX))) {
                                if (!(((game.mons[corpsenm]).mflags2 & 524288) != 0)) {
                                    corpsname = await an(corpsname);
                                }
                                if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                                    await You_hear("%s reviving.", corpsname);
                                } else {
                                    await You_hear("a defibrillator.");
                                }
                                learn_it = by_u ? (1) : game.zap_oseen;
                            }
                            if ((canseemon(mtmp) || sensemon(mtmp))) {
                                await pline("%s appears.", await Monnam(mtmp));
                            }
                        }
                        if (learn_it) {
                            await exercise(A_WIS, (1));
                        }
                    }
                }
                break;
            case WAN_OPENING:
            case SPE_KNOCK:
            case WAN_LOCKING:
            case SPE_WIZARD_LOCK:
                if (((obj).otyp == LARGE_BOX || (obj).otyp == CHEST)) {
                    res = await boxlock(obj, otmp);
                } else {
                    res = 0;
                }
                if (res) {
                    learn_it = (1);
                }
                break;
            case WAN_SLOW_MONSTER:
            case SPE_SLOW_MONSTER:
            case WAN_SPEED_MONSTER:
            case WAN_NOTHING:
            case SPE_HEALING:
            case SPE_EXTRA_HEALING:
                res = 0;
                break;
            case SPE_STONE_TO_FLESH:
                res = await stone_to_flesh_obj(obj);
                break;
            default:
                await impossible("What an interesting effect (%d)", otmp.otyp);
                break;
        }
    }
    if (learn_it) {
        await learnwand(otmp);
    }
    return res;
}
/* returns nonzero if something was hit */
/* wand or fake spellbook for type of zap */
/* callback for each object being hit */
/* target location */
/* direction for up/down zaps */
export async function bhitpile(obj, fhito, tx, ty, zz) {
    let otmp = null;
    let next_obj = null;
    let hidingunder = 0;
    let first = 0;
    let prevotyp = 0;
    let hitanything = 0;
    if (!game.level.objects[tx][ty]) {
        return 0;
    }
    /* if hiding underneath an object and zapping up or down, the top item
       is either the only thing hit (up) or is skipped (down) */
    hidingunder = (zz != 0 && game.u.uundetected && (((game.youmonst.data).mflags1 & 128) != 0));
    first = (1);
    if (obj.otyp == SPE_FORCE_BOLT || obj.otyp == WAN_STRIKING) {
        let t = t_at(tx, ty);
        let topofpile = game.level.objects[tx][ty];
        if (t && t.ttyp == STATUE_TRAP && await activate_statue_trap(t, tx, ty, (1))) {
            await learnwand(obj);
        }
        /* assume zapping up or down while hiding under the top item can
           still activate the trap even if it's below (when zapping up)
           or above (when zapping down) */
        /* top item was statue which activated */
        if (game.level.objects[tx][ty] != topofpile) {
            first = (0);
        }
    }
    game.poly_zapped = -1;
    for (otmp = game.level.objects[tx][ty]; otmp; otmp = next_obj) {
        next_obj = otmp.v.v_nexthere;
        if (hidingunder) {
            if (first) {
                first = (0);
                /* down when hiding-under skips first item */
                if (zz > 0) {
                    continue;
                }
            } else {
                /* up when hiding-under skips rest of pile */
                if (zz < 0) {
                    continue;
                }
            }
        }
        if (otmp.where != 1 || otmp.ox != tx || otmp.oy != ty) {
            continue;
        }
        hitanything += (fhito)(otmp, obj);
    }
    if (game.poly_zapped >= 0) {
        await create_polymon(game.level.objects[tx][ty], game.poly_zapped);
    }
    /* when boulders are present they're expected to be on top; with
       multiple boulders it's possible for some to have been changed into
       non-boulders (polymorph, stone-to-flesh) while ones beneath resist,
       so re-stack pile if there are any non-boulders above boulders */
    prevotyp = BOULDER;
    for (otmp = game.level.objects[tx][ty]; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp.otyp == BOULDER && prevotyp != BOULDER) {
            await recreate_pile_at(tx, ty);
            break;
        }
        prevotyp = otmp.otyp;
    }
    if (hidingunder) {
        await maybe_unhide_at(tx, ty);
    }
    await fill_pit(tx, ty);
    return hitanything;
}
/*
 * zappable - returns 1 if zap is available, 0 otherwise.
 *            it removes a charge from the wand if zappable.
 * added by GAN 11/03/86
 */
export async function zappable(wand) {
    if (wand.spe < 0 || (wand.spe == 0 && rn2(121))) {
        return 0;
    }
    if (wand.spe == 0) {
        await You("wrest one last charge from the worn-out wand.");
    }
    wand.spe--;
    return 1;
}
export async function do_enlightenment_effect() {
    await You_feel("self-knowledgeable...");
    await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
    await enlightenment(2, 0);
    await pline_The("feeling subsides.");
    await exercise(A_WIS, (1));
}
/*
 * zapnodir - zaps a NODIR wand/spell.
 * Won't get here if wand has no charges (unless wresting 1 last charge).
 */
export async function zapnodir(obj) {
    let known = (0);
    switch (obj.otyp) {
        case WAN_LIGHT:
        case SPE_LIGHT:
            known = (obj.dknown && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked));
            await litroom((1), obj);
            await lightdamage(obj, (1), 5);
            break;
        case WAN_SECRET_DOOR_DETECTION:
        case SPE_DETECT_UNSEEN:
            known = !!obj.dknown;
            await findit();
            break;
        case WAN_STASIS:
{
                /* FIXME? wand of light becoming discovered should be contingent upon
           seeing at least one previously unlit spot become lit */
                /* findit() gives sufficient feedback to discover the wand even when
           blinded or when it fails to find anything */
                let tmp_until = game.moves + (rn2(21) + (10));
                /* no immediately obvious effect, and no message so that it isn't
           distinguishable from other NODIR wands that produce no message;
           for multiple zaps, keep the longest duration rather than latest */
                if (tmp_until > game.level.flags.stasis_until) {
                    game.level.flags.stasis_until = tmp_until;
                }
                break;
            }
        case WAN_CREATE_MONSTER:
            if (await create_critters(rn2(23) ? 1 : (rn2(7) + (2)), null, (0))) {
                known = !!obj.dknown;
            }
            break;
        case WAN_WISHING:
            if ((game.u.uluck + game.u.moreluck) + rn2(5) < 0) {
                await pline("Unfortunately, nothing happens.");
                known = (0);
            } else {
                known = !!obj.dknown;
                await makewish();
            }
            break;
        case WAN_ENLIGHTENMENT:
            known = !!obj.dknown;
            await do_enlightenment_effect();
            break;
        default:
            break;
    }
    if (known) {
        if (!game.objects[obj.otyp].oc_name_known) {
            await more_experienced(0, 10);
        }
        await learnwand(obj);
    }
}
export async function backfire(otmp) {
    let dmg = 0;
    /* in case losehp() is fatal */
    otmp.in_use = (1);
    await pline("%s suddenly explodes!", await The(await xname(otmp)));
    dmg = d(otmp.spe + 2, 6);
    await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "exploding wand", 0);
    await useupall(otmp);
}
/* getobj callback for object to zap */
export function zap_ok(obj) {
    if (obj && obj.oclass == WAND_CLASS) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_EXCLUDE;
}
/* #zap command, 'z' (or 'y' if numbed_pad==-1) */
export async function dozap() {
    let obj = null;
    let damage = 0;
    let need_dir = 0;
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        await You("aren't able to zap anything in your current form.");
        return 0;
    }
    if (await check_capacity(null)) {
        return 0;
    }
    obj = await getobj("zap", zap_ok, 0);
    if (!obj) {
        return 2;
    }
    await check_unpaid(obj);
    need_dir = game.objects[obj.otyp].oc_dir != 1;
    if (!await zappable(obj)) {
        await pline("%s", c_common_strings.c_nothing_happens);
    } else if (obj.cursed && !rn2(100)) {
        await backfire(obj);
        await exercise(A_STR, (0));
        /* 'obj' is gone; skip update_inventory() because
           backfire() -> useupall() -> freeinv() did it */
        return 1;
    } else if (need_dir && !await getdir(null)) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await pline("%s glows and fades.", await The(await xname(obj)));
        }
    } else if (need_dir && !game.u.dx && !game.u.dy && !game.u.dz) {
        if ((damage = await zapyourself(obj, (1))) != 0) {
            let buf = '';
            buf = sprintf(buf, "zapped %sself with %s", (genders[game.flags.female ? 1 : 0].him), await killer_xname(obj));
            await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((damage) + 1) / 2)) : (damage)), buf, 2);
        }
    } else {
        /*      Are we having fun yet?
         * weffects -> buzz(obj->otyp) -> zhitm (temple priest) ->
         * attack -> hitum -> known_hitum -> ghod_hitsu ->
         * buzz(AD_ELEC) -> destroy_items(AD_ELEC) ->
         * useup -> obfree -> dealloc_obj -> free(obj)
         */
        game.current_wand = obj;
        await weffects(obj);
        obj = game.current_wand;
        game.current_wand = null;
    }
    if (obj && obj.spe < 0) {
        await pline("%s to dust.", await Tobjnam(obj, "turn"));
        await useupall(obj);
    } else {
        update_inventory();
    }
    return 1;
}
/* Lock or unlock all boxes in inventory */
export async function boxlock_invent(obj) {
    let otmp = null;
    let nextobj = null;
    let boxing = (0);
    for (otmp = game.invent; otmp; otmp = nextobj) {
        nextobj = otmp.nobj;
        if (((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST)) {
            await boxlock(otmp, obj);
            boxing = (1);
        }
    }
    if (boxing) {
        update_inventory();
    }
}
export async function zapyourself(obj, ordinary) {
    let learn_it = (0);
    let damage = 0;
    /* for passing to destroy_items() */
    let orig_dmg = 0;
    switch (obj.otyp) {
        case WAN_STRIKING:
        case SPE_FORCE_BOLT:
            learn_it = (1);
            if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                await shieldeff(game.u.ux, game.u.uy);
                await pline("Boing!");
                monstseesu(M_SEEN_MAGR);
            } else {
                if (ordinary) {
                    await You("bash yourself!");
                    damage = d(2, 12);
                } else {
                    damage = d(1 + obj.spe, 6);
                }
                await exercise(A_STR, (0));
                monstunseesu(M_SEEN_MAGR);
            }
            break;
        case WAN_LIGHTNING:
            learn_it = (1);
            orig_dmg = d(12, 6);
            if (!(game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
                await You("shock yourself!");
                damage = orig_dmg;
                await exercise(A_CON, (0));
                monstunseesu(M_SEEN_ELEC);
            } else {
                await shieldeff(game.u.ux, game.u.uy);
                await You("zap yourself, but seem unharmed.");
                monstseesu(M_SEEN_ELEC);
                await ugolemeffects(6, orig_dmg);
            }
            await destroy_items(game.youmonst, 6, orig_dmg);
            await flashburn(rnd(100), (1));
            break;
        case SPE_FIREBALL:
            await You("explode a fireball on top of yourself!");
            await explode(game.u.ux, game.u.uy, 11, d(6, 6), WAND_CLASS, EXPL_FIERY);
            break;
        case WAN_FIRE:
        case FIRE_HORN:
            learn_it = (1);
            orig_dmg = d(12, 6);
            if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                await shieldeff(game.u.ux, game.u.uy);
                await You_feel("rather warm.");
                monstseesu(M_SEEN_FIRE);
                await ugolemeffects(2, orig_dmg);
            } else {
                await pline("You've set yourself afire!");
                damage = orig_dmg;
                monstunseesu(M_SEEN_FIRE);
            }
            await burn_away_slime();
            await burnarmor(game.youmonst);
            await destroy_items(game.youmonst, 2, orig_dmg);
            await ignite_items(game.invent);
            break;
        case WAN_COLD:
        case SPE_CONE_OF_COLD:
        case FROST_HORN:
            learn_it = (1);
            orig_dmg = d(12, 6);
            if ((game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic)) {
                await shieldeff(game.u.ux, game.u.uy);
                await You_feel("a little chill.");
                monstseesu(M_SEEN_COLD);
                await ugolemeffects(3, orig_dmg);
            } else {
                await You("imitate a popsicle!");
                damage = orig_dmg;
                monstunseesu(M_SEEN_COLD);
            }
            await destroy_items(game.youmonst, 3, orig_dmg);
            break;
        case WAN_MAGIC_MISSILE:
        case SPE_MAGIC_MISSILE:
            learn_it = (1);
            if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                await shieldeff(game.u.ux, game.u.uy);
                await pline_The("missiles bounce!");
                monstseesu(M_SEEN_MAGR);
            } else {
                damage = d(4, 6);
                await pline("Idiot!  You've shot yourself!");
                monstunseesu(M_SEEN_MAGR);
            }
            break;
        case WAN_POLYMORPH:
        case SPE_POLYMORPH:
            if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
                learn_it = (1);
                await polyself(POLY_NOFLAGS);
            }
            break;
        case WAN_CANCELLATION:
        case SPE_CANCELLATION:
            await cancel_monst(game.youmonst, obj, (1), (1), (1));
            break;
        case SPE_DRAIN_LIFE:
            if (!(game.u.uprops[DRAIN_RES].intrinsic || game.u.uprops[DRAIN_RES].extrinsic)) {
                learn_it = (1);
                await losexp("life drainage");
            }
            damage = 0;
            break;
        case WAN_MAKE_INVISIBLE:
{
                /* have to test before changing HInvis but must change
         * HInvis before doing newsym().
         */
                let msg = !((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !game.u.uprops[INVIS].blocked;
                if (game.u.uprops[INVIS].blocked && game.uarmc.otyp == MUMMY_WRAPPING) {
                    await You_feel("rather itchy under %s.", await yname(game.uarmc));
                    break;
                }
                incr_itimeout({ get value() { return game.u.uprops[INVIS].intrinsic; }, set value(_v) { game.u.uprops[INVIS].intrinsic = _v; } }, (rn2(15) + (31)));
                if (msg) {
                    learn_it = (1);
                    await newsym(game.u.ux, game.u.uy);
                    await self_invis_message();
                }
                break;
            }
        case WAN_SPEED_MONSTER:
            await speed_up((rn2(25) + (50)));
            learn_it = (1);
            break;
        case WAN_SLEEP:
        case SPE_SLEEP:
            learn_it = (1);
            if ((game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                await shieldeff(game.u.ux, game.u.uy);
                await You("don't feel sleepy!");
                monstseesu(M_SEEN_SLEEP);
            } else {
                if (ordinary) {
                    await pline_The("sleep ray hits you!");
                } else {
                    await You("fall asleep!");
                }
                monstunseesu(M_SEEN_SLEEP);
                await fall_asleep(-rnd(50), (1));
            }
            break;
        case WAN_SLOW_MONSTER:
        case SPE_SLOW_MONSTER:
            if (game.u.uprops[FAST].intrinsic & (16777215 | (67108864 | 33554432 | 16777216))) {
                learn_it = (1);
                await u_slow_down();
            }
            break;
        case WAN_TELEPORTATION:
        case SPE_TELEPORT_AWAY:
            await tele();
            /* same criteria as when mounted (zap_steed) */
            /* same criteria as when unmounted (zapyourself) */
            if (((game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic) && !game.u.uprops[STUNNED].intrinsic) || !((game.viz_array[game.u.uy0][game.u.ux0] & 1) != 0) || dist2((game.u.ux0), (game.u.uy0), game.u.ux, game.u.uy) >= 16) {
                learn_it = (1);
            }
            break;
        case WAN_DEATH:
        case SPE_FINGER_OF_DEATH:
            if (((((game.youmonst.data).mflags2 & 2) != 0) || (game.youmonst.data) == game.mons[PM_MANES] || (((game.youmonst.data).mlet == S_GOLEM) || (game.youmonst.data).mlet == S_VORTEX)) || (((game.youmonst.data).mflags2 & 256) != 0)) {
                await pline((obj.otyp == WAN_DEATH) ? "The wand shoots an apparently harmless beam at you." : "You seem no deader than before.");
                break;
            }
            learn_it = (1);
            game.killer.name = sprintf(game.killer.name, "shot %sself with a death ray", (genders[game.flags.female ? 1 : 0].him));
            game.killer.format = 2;
            await urgent_pline("You irradiate yourself with pure energy!");
            await urgent_pline("You die.");
            await done(DIED);
            break;
        case WAN_UNDEAD_TURNING:
        case SPE_TURN_UNDEAD:
            learn_it = (1);
            await unturn_you();
            break;
        case SPE_HEALING:
        case SPE_EXTRA_HEALING:
            learn_it = (1);
            await healup(d(6, obj.otyp == SPE_EXTRA_HEALING ? 8 : 4), 0, (0), (obj.blessed || obj.otyp == SPE_EXTRA_HEALING));
            await You_feel("%sbetter.", obj.otyp == SPE_EXTRA_HEALING ? "much " : "");
            break;
        case WAN_LIGHT:
            damage = d(obj.spe, 25);
            ;
        case EXPENSIVE_CAMERA:
            if (!damage) {
                damage = 5;
            }
            damage = await lightdamage(obj, ordinary, damage);
            damage += rnd(25);
            if (await flashburn(damage, (0))) {
                learn_it = (1);
            }
            damage = 0;
            break;
        case WAN_OPENING:
        case SPE_KNOCK:
            if (game.u.ustuck) {
                await release_hold();
                learn_it = (1);
            }
            if ((game.uball != null)) {
                learn_it = (1);
                await unpunish();
            }
            if (!game.u.utrap || !await openholdingtrap(game.youmonst, { get value() { return learn_it; }, set value(_v) { learn_it = _v; } })) {
                await boxlock_invent(obj);
                await openfallingtrap(game.youmonst, (1), { get value() { return learn_it; }, set value(_v) { learn_it = _v; } });
            }
            break;
        case WAN_LOCKING:
        case SPE_WIZARD_LOCK:
            if (game.u.utrap || !await closeholdingtrap(game.youmonst, { get value() { return learn_it; }, set value(_v) { learn_it = _v; } })) {
                await boxlock_invent(obj);
            }
            break;
        case WAN_DIGGING:
        case SPE_DIG:
        case SPE_DETECT_UNSEEN:
        case WAN_NOTHING:
            break;
        case WAN_PROBING:
            await probe_objchain(game.invent);
            update_inventory();
            learn_it = (1);
            await ustatusline();
            break;
        case SPE_STONE_TO_FLESH:
{
                let otmp = null;
                let onxt = null;
                let didmerge = 0;
                if (game.u.umonnum == PM_STONE_GOLEM) {
                    learn_it = (1);
                    await polymon(PM_FLESH_GOLEM);
                }
                if (game.u.uprops[STONED].intrinsic) {
                    learn_it = (1);
                    await fix_petrification();
                }
                for (otmp = game.invent; otmp; otmp = onxt) {
                    onxt = otmp.nobj;
                    if (await bhito(otmp, obj)) {
                        learn_it = (1);
                    }
                }
                do {
                    didmerge = (0);
                    for (otmp = game.invent; !didmerge && otmp; otmp = otmp.nobj) {
                        /*
         * It is possible that we can now merge some inventory.
         * Do a highly paranoid merge.  Restart from the beginning until
         * no merges.  Don't merge worn items (in case of stone-to-flesh
         * of rocks wielded in differing weapon/alt-wep/quiver slot).
         */
                        if (otmp.owornmask) {
                            continue;
                        }
                        for (onxt = otmp.nobj; onxt; onxt = onxt.nobj) {
                            if (await merged({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, onxt)) {
                                didmerge = (1);
                                break;
                            }
                        }
                    }
                } while (didmerge);
                break;
            }
        default:
            await impossible("zapyourself: object %d used?", obj.otyp);
            break;
    }
    if (learn_it) {
        await learnwand(obj);
    }
    return damage;
}
/* called when poly'd hero uses breath attack against self */
export async function ubreatheu(mattk) {
    let dtyp = 20 + mattk.adtyp - 1;
    await zhitu(dtyp, mattk.damn, flash_str(dtyp, (1)), game.u.ux, game.u.uy);
}
/* light damages hero in gremlin form */
/* item making light (fake book if spell) */
/* wand/camera zap vs wand destruction */
/* pseudo-damage used to determine blindness duration */
export async function lightdamage(obj, ordinary, amt) {
    let buf = '';
    let how = null;
    let dmg = amt;
    if (dmg && game.youmonst.data == game.mons[PM_GREMLIN]) {
        /* reduce high values (from destruction of wand with many charges) */
        dmg = rnd(dmg);
        if (dmg > 10) {
            dmg = 10 + rnd(dmg - 10);
        }
        if (dmg > 20) {
            dmg = 20;
        }
        await pline("Ow, that light hurts%c", (dmg > 2 || game.u.mh <= 5) ? 33 : 46);
        /* [composing killer/reason is superfluous here; if fatal, cause
           of death will always be "killed while stuck in creature form"] */
        if (obj.oclass == SCROLL_CLASS || obj.oclass == SPBOOK_CLASS) {
            ordinary = (0);
        }
        how = (obj.oclass == SPBOOK_CLASS) ? "spell of light" : (!obj.oartifact) ? await ansimpleoname(obj) : await bare_artifactname(obj);
        buf = sprintf(buf, "%s %sself with %s", ordinary ? "zapped" : "blasted", (genders[game.flags.female ? 1 : 0].him), how);
        await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), buf, 2);
    }
    return dmg;
}
/* light[ning] causes blindness */
export async function flashburn(duration, via_lightning) {
    if (!await resists_blnd(game.youmonst)) {
        await You(are_blinded_by_the_flash);
        await make_blinded(duration, (0));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await Your("%s", c_common_strings.c_vision_clears);
        }
        return (1);
    }
    if (!via_lightning && resists_blnd_by_arti(game.youmonst)) {
        await shieldeff(game.u.ux, game.u.uy);
        return (1);
    }
    return (0);
}
/* you've zapped a wand downwards while riding
 * Return TRUE if the steed was hit by the wand.
 * Return FALSE if the steed was not hit by the wand.
 */
/* wand or spell */
export async function zap_steed(obj) {
    let steedhit = (0);
    game.bhitpos.x = game.u.usteed.mx , game.bhitpos.y = game.u.usteed.my;
    game.notonhead = (0);
    switch (obj.otyp) {
        case WAN_PROBING:
            await probe_monster(game.u.usteed);
            await learnwand(obj);
            steedhit = (1);
            break;
        case WAN_TELEPORTATION:
        case SPE_TELEPORT_AWAY:
            await tele();
            if (((game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic) && !game.u.uprops[STUNNED].intrinsic) || !((game.viz_array[game.u.uy0][game.u.ux0] & 1) != 0) || dist2((game.u.ux0), (game.u.uy0), game.u.ux, game.u.uy) >= 16) {
                await learnwand(obj);
            }
            steedhit = (1);
            break;
        /* Default processing via bhitm() for these */
        case SPE_CURE_SICKNESS:
        case WAN_MAKE_INVISIBLE:
        case WAN_CANCELLATION:
        case SPE_CANCELLATION:
        case WAN_POLYMORPH:
        case SPE_POLYMORPH:
        case WAN_STRIKING:
        case SPE_FORCE_BOLT:
        case WAN_SLOW_MONSTER:
        case SPE_SLOW_MONSTER:
        case WAN_SPEED_MONSTER:
        case SPE_HEALING:
        case SPE_EXTRA_HEALING:
        case SPE_DRAIN_LIFE:
        case WAN_OPENING:
        case SPE_KNOCK:
            await bhitm(game.u.usteed, obj);
            steedhit = (1);
            break;
        default:
            steedhit = (0);
            break;
    }
    return steedhit;
}
/*
 * cancel a monster (possibly the hero).  inventory is cancelled only
 * if the monster is zapping itself directly, since otherwise the
 * effect is too strong.  currently non-hero monsters do not zap
 * themselves with cancellation.
 */
const __cancel_monst_writing_vanishes = "Some writing vanishes from %s head!";
const __cancel_monst_your = "your";
export async function cancel_monst(mdef, obj, youattack, allow_cancel_kill, self_cancel) {
    let youdefend = (mdef == game.youmonst);
    if (youdefend ? (!youattack && (game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) : await resist(mdef, obj.oclass, 0, 0)) {
        return (0);
    }
    if (self_cancel) {
        let otmp = null;
        for (otmp = (youdefend ? game.invent : mdef.minvent); otmp; otmp = otmp.nobj) {
            await cancel_item(otmp);
        }
        if (youdefend) {
            game.disp.botl = (1);
            /* update_inventory(); -- handled by caller */
            find_ac();
        }
    }
    if (youdefend) {
        if ((game.u.umonnum != game.u.umonster)) {
            if (game.u.umonnum == PM_CLAY_GOLEM) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline(__cancel_monst_writing_vanishes, __cancel_monst_your);
                } else {
                    await You_feel("%s headed.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "dark" : "light");
                }
                /* fatal; death handled by rehumanize() */
                game.u.mh = 0;
            }
            if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && game.u.mh > 0) {
                await Your("amulet grows hot for a moment, then cools.");
            } else {
                await rehumanize();
            }
        }
    } else {
        mdef.mcan = 1;
        await normal_shape(mdef);
        if (mdef.data == game.mons[PM_CLAY_GOLEM]) {
            if (canseemon(mdef)) {
                await pline(__cancel_monst_writing_vanishes, s_suffix(await mon_nam(mdef)));
            }
            if (allow_cancel_kill) {
                if (youattack) {
                    await killed(mdef);
                } else {
                    await monkilled(mdef, "", 241);
                }
            }
        }
    }
    return (1);
}
/* you've zapped an immediate type wand up or down */
/* wand or spell, nonnull */
export async function zap_updown(obj) {
    let striking = (0);
    let disclose = (0);
    let map_zapped = (0);
    let x = 0;
    let y = 0;
    let xx = 0;
    let yy = 0;
    let ptmp = 0;
    let otmp = null;
    let e = null;
    let ttmp = null;
    let stway = game.stairs;
    /* some wands have special effects other than normal bhitpile */
    /* drawbridge might change <u.ux,u.uy> */
    x = xx = game.u.ux;
    /* <xx,yy> is drawbridge (portcullis) position */
    y = yy = game.u.uy;
    /* refresh in case trap was altered or is gone */
    ttmp = t_at(x, y);
    switch (obj.otyp) {
        case WAN_PROBING:
            ptmp = 0;
            if (game.u.dz < 0) {
                await You("probe towards the %s.", ceiling(x, y));
            } else {
                let surf = null;
                /*
         * Probing, either up/down or lateral.
         */
                let ltyp = 0;
                let rememberedltyp = await update_mapseen_for(x, y);
                ptmp += await bhitpile(obj, bhito, x, y, game.u.dz);
                /* sequencing: zap_map() calls force_decor() for ice or furniture;
               we need to call it before probing for buried objects */
                ltyp = ((game.level.locations[x][y].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[x][y].flags) : game.level.locations[x][y].typ);
                await zap_map(x, y, obj);
                if (ltyp == ICE || ((ltyp) >= STAIRS && (ltyp) <= ALTAR)) {
                    /*map_zapped = TRUE; // not needed due to early return*/
                    surf = "it";
                    if (game.lastseentyp[x][y] != rememberedltyp) {
                        ptmp += 1;
                    }
                } else {
                    surf = await the(surface(x, y));
                }
                await You("probe beneath %s.", surf);
                ptmp += await display_binventory(x, y, (1));
            }
            if (!ptmp) {
                await Your("probe reveals nothing.");
            }
            return (1);
        case WAN_OPENING:
        case SPE_KNOCK:
            while (stway) {
                if (!stway.isladder && !stway.up && stway.tolev.dnum == game.u.uz.dnum) {
                    break;
                }
                stway = stway.next;
            }
            if (is_db_wall(x, y) && find_drawbridge({ get value() { return xx; }, set value(_v) { xx = _v; } }, { get value() { return yy; }, set value(_v) { yy = _v; } })) {
                await open_drawbridge(xx, yy);
                disclose = (1);
            } else if (game.u.dz > 0 && stway && stway.sx == x && stway.sy == y && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level)) && !await ok_to_quest()) {
                await pline_The("stairs seem to ripple momentarily.");
                disclose = (1);
            }
            if (game.u.dz > 0 && game.u.utrap) {
                await openholdingtrap(game.youmonst, { get value() { return disclose; }, set value(_v) { disclose = _v; } });
            } else if (game.u.dz > 0 && !game.u.utrap) {
                await openfallingtrap(game.youmonst, (0), { get value() { return disclose; }, set value(_v) { disclose = _v; } });
            }
            break;
        case WAN_STRIKING:
        case SPE_FORCE_BOLT:
            striking = (1);
            ;
        case WAN_LOCKING:
        case SPE_WIZARD_LOCK:
            if (((game.level.locations[x][y].typ == DRAWBRIDGE_DOWN) ? (game.u.dz > 0) : (is_drawbridge_wall(x, y) >= 0 && !is_db_wall(x, y))) && find_drawbridge({ get value() { return xx; }, set value(_v) { xx = _v; } }, { get value() { return yy; }, set value(_v) { yy = _v; } })) {
                if (!striking) {
                    await close_drawbridge(xx, yy);
                } else {
                    await destroy_drawbridge(xx, yy);
                }
                disclose = (1);
            } else if (striking && game.u.dz < 0 && rn2(3) && !(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !(game.u.uinwater) && !(((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level))))) {
                let dmg = 0;
                await pline("A rock is dislodged from the %s and falls on your %s.", ceiling(x, y), await body_part(HEAD));
                dmg = rnd(hard_helmet(game.uarmh) ? 2 : 6);
                await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "falling rock", 0);
                if ((otmp = await mksobj_at(ROCK, x, y, (0), (0))) != null) {
                    await xname(otmp);
                    await stackobj(otmp);
                }
                await newsym(x, y);
            } else if (game.u.dz > 0 && ttmp) {
                if (!striking && await closeholdingtrap(game.youmonst, { get value() { return disclose; }, set value(_v) { disclose = _v; } })) {
                    ;
                } else if (striking && ttmp.ttyp == TRAPDOOR) {
                    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !ttmp.tseen) {
                        await pline("%s beneath you shatters.", c_common_strings.c_Something);
                    } else if (!ttmp.tseen) {
                        await pline("There's a trapdoor beneath you; it shatters.");
                    } else {
                        await pline("The trapdoor beneath you shatters.");
                        disclose = (1);
                    }
                    ttmp.ttyp = HOLE;
                    /* should probably be changed to use sense_trap(detect.c)
               so that trap can temporarily be forced to be shown and
               map browsing can take place before it reverts to being
               covered by monster or object(s) */
                    ttmp.tseen = 1;
                    await newsym(x, y);
                    await dotrap(ttmp, 0);
                } else if (!striking && ttmp.ttyp == HOLE) {
                    /* locking transforms hole into trapdoor */
                    ttmp.ttyp = TRAPDOOR;
                    /* hadn't fallen down hole; won't fall now */
                    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || !ttmp.tseen) {
                        await pline("Some %s swirls beneath you.", is_ice(x, y) ? "frost" : "dust");
                    } else {
                        ttmp.tseen = 1;
                        await newsym(x, y);
                        await pline("A trapdoor appears beneath you.");
                        disclose = (1);
                    }
                }
            }
            break;
        case SPE_STONE_TO_FLESH:
            if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || (game.u.uinwater) || ((((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level)))) && game.u.dz < 0)) {
                await pline("%s", c_common_strings.c_nothing_happens);
            } else if (game.u.dz < 0) {
                await pline("Blood drips on your %s.", await body_part(FACE));
            } else if (game.u.dz > 0 && !(game.level.objects[game.u.ux][game.u.uy] != null)) {
                /*
            Print this message only if there wasn't an engraving
            affected here.  If water or ice, act like waterlevel case.
            */
                e = engr_at(game.u.ux, game.u.uy);
                if (!(e && e.engr_type == 2)) {
                    if (is_pool(game.u.ux, game.u.uy) || is_ice(game.u.ux, game.u.uy)) {
                        await pline("%s", c_common_strings.c_nothing_happens);
                    } else {
                        await pline("Blood %ss %s your %s.", is_lava(game.u.ux, game.u.uy) ? "boil" : "pool", ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) ? "beneath" : "at", await makeplural(await body_part(FOOT)));
                    }
                }
            }
            break;
        default:
            break;
    }
    if (game.u.dz > 0) {
        await bhitpile(obj, bhito, x, y, game.u.dz);
        if (!map_zapped) {
            await zap_map(x, y, obj);
        }
    } else if (game.u.dz < 0) {
        if (game.u.uundetected && (((game.youmonst.data).mflags1 & 128) != 0)) {
            /* game flavor: if you're hiding under "something"
         * a zap upward should hit that "something".
         */
            let hitit = 0;
            otmp = game.level.objects[game.u.ux][game.u.uy];
            if (otmp) {
                hitit = await bhito(otmp, obj);
            }
            if (hitit) {
                await hideunder(game.youmonst);
                disclose = (1);
            }
        }
    }
    return disclose;
}
/* used by do_break_wand() was well as by weffects() */
export function zapsetup() {
    game.obj_zapped = (0);
}
export async function zapwrapup() {
    if (game.obj_zapped) {
        await You_feel("shuddering vibrations.");
    }
    game.obj_zapped = (0);
}
/* called for various wand and spell effects - M. Stephenson */
export async function weffects(obj) {
    let otyp = obj.otyp;
    let disclose = (0);
    let was_unkn = !game.objects[otyp].oc_name_known;
    await exercise(A_WIS, (1));
    if (game.u.usteed && (game.objects[otyp].oc_dir != 1) && !game.u.dx && !game.u.dy && (game.u.dz > 0) && await zap_steed(obj)) {
        disclose = (1);
    } else if (game.objects[otyp].oc_dir == 2) {
        zapsetup();
        if (game.u.uswallow) {
            await bhitm(game.u.ustuck, obj);
        } else if (game.u.dz) {
            disclose = await zap_updown(obj);
        } else {
            await bhit(game.u.dx, game.u.dy, (rn2(8) + (6)), ZAPPED_WAND, bhitm, bhito, obj);
        }
        await zapwrapup();
    } else if (game.objects[otyp].oc_dir == 1) {
        await zapnodir(obj);
    } else {
        /* neither immediate nor directionless */
        if (otyp == WAN_DIGGING || otyp == SPE_DIG) {
            await zap_dig();
        } else if (otyp >= SPE_MAGIC_MISSILE && otyp <= SPE_FINGER_OF_DEATH) {
            await ubuzz((10 + ((abs((otyp) - SPE_MAGIC_MISSILE) % 10))), Math.trunc(game.u.ulevel / 2) + 1);
        } else if (otyp >= WAN_MAGIC_MISSILE && otyp <= WAN_LIGHTNING) {
            await ubuzz((0 + ((abs((otyp) - WAN_MAGIC_MISSILE) % 10))), (otyp == WAN_MAGIC_MISSILE) ? 2 : 6);
        } else {
            await impossible("weffects: unexpected spell or wand");
        }
        disclose = (1);
    }
    if (disclose) {
        await learnwand(obj);
        if (was_unkn) {
            await more_experienced(0, 10);
        }
    }
    return;
}
/* augment damage for a spell based on the hero's intelligence (and level) */
/* base amount to be adjusted by bonus or penalty */
export function spell_damage_bonus(dmg) {
    let intell = (acurr(A_INT));
    if (intell <= 9) {
        /* Punish low intelligence before low level else low intelligence
       gets punished only when high level */
        /* -3 penalty, but never reduce combined amount below 1
           (if dmg is 0 for some reason, we're careful to leave it there) */
        if (dmg > 1) {
            dmg = (dmg <= 3) ? 1 : dmg - 3;
        }
    } else if (intell <= 13 || game.u.ulevel < 5) {
        ;
    } else if (intell <= 18) {
        dmg += 1;
    } else if (intell <= 24 || game.u.ulevel < 14) {
        dmg += 2;
    /* no bonus or penalty; dmg remains same */
    } else {
        dmg += 3;
    }
    return dmg;
}
/*
 * Generate the to-hit bonus for a spell.  Based on the hero's skill in
 * spell class and dexterity.
 */
export function spell_hit_bonus(skill) {
    let hit_bon = 0;
    let dex = (acurr(A_DEX));
    switch ((game.u.weapon_skills[spell_skilltype(skill)].skill)) {
        case P_ISRESTRICTED:
        case P_UNSKILLED:
            hit_bon = -4;
            break;
        case P_BASIC:
            hit_bon = 0;
            break;
        case P_SKILLED:
            hit_bon = 2;
            break;
        case P_EXPERT:
            hit_bon = 3;
            break;
    }
    if (dex < 4) {
        hit_bon -= 3;
    } else if (dex < 6) {
        hit_bon -= 2;
    } else if (dex < 8) {
        hit_bon -= 1;
    } else if (dex < 14) {
        hit_bon -= 0;
    /* Will change when print stuff below removed */
    /* Even increment for dexterous heroes (see weapon.c abon) */
    } else {
        hit_bon += dex - 14;
    }
    return hit_bon;
}
export function exclam(force) {
    /* force == 0 occurs e.g. with sleep ray */
    /* note that large force is usual with wands so that !! would
            require information about hand/weapon/wand */
    return ((force < 0) ? "?" : (force <= 4) ? "." : "!");
}
/* zap text or missile name */
/* target; for missile, might be hero */
/* usually either "." or "!" via exclam() */
export async function hit(str, mtmp, force) {
    let verbosely = (mtmp == game.youmonst || (game.flags.verbose && (((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0) || (canseemon(mtmp) || sensemon(mtmp)) || (game.u.uswallow && (game.u.ustuck == (mtmp))))));
    await pline("%s %s %s%s", await The(str), await vtense(str, "hit"), verbosely ? await mon_nam(mtmp) : "it", force);
}
export async function miss(str, mtmp) {
    await pline("%s %s %s.", await The(str), await vtense(str, "miss"), ((((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0) || (canseemon(mtmp) || sensemon(mtmp))) && game.flags.verbose) ? await mon_nam(mtmp) : "it");
}
export function skiprange(range, skipstart, skipend) {
    let tr = (Math.trunc(range / 4));
    let tmp = range - ((tr > 0) ? rnd(tr) : 0);
    skipstart.value = tmp;
    skipend.value = tmp - ((Math.trunc(tmp / 4)) * rnd(3));
    if (skipend.value >= tmp) {
        skipend.value = tmp - 1;
    }
}
/* Maybe explode a trap hit by object otmp's effect;
   cancellation beam hitting a magical trap causes an explosion.
   Might delete the trap; won't destroy otmp. */
export async function maybe_explode_trap(ttmp, otmp, learn_it) {
    if (!ttmp || !otmp) {
        return;
    }
    if (otmp.otyp == WAN_CANCELLATION || otmp.otyp == SPE_CANCELLATION) {
        let x = ttmp.tx;
        let y = ttmp.ty;
        if (((ttmp.ttyp) == MAGIC_PORTAL || (ttmp.ttyp) == VIBRATING_SQUARE)) {
            await shieldeff(x, y);
            /* secret corridor likewise, although only ones within view will
           still be secret; for the !cansee(x,y) case, show_map_spot()
           above has already converted the spot to regular corridor */
            if (((game.viz_array[y][x] & 2) != 0)) {
                ttmp.tseen = 1;
                await newsym(x, y);
                learn_it.value = (1);
            }
        } else if (((ttmp.ttyp) == TELEP_TRAP || (ttmp.ttyp) == LEVEL_TELEP || (ttmp.ttyp) == MAGIC_TRAP || (ttmp.ttyp) == ANTI_MAGIC || (ttmp.ttyp) == POLY_TRAP)) {
            let seeit = ((game.viz_array[y][x] & 2) != 0);
            await explode(x, y, -WAN_CANCELLATION, 20 + d(3, 6), (MAXOCLASSES + 3), EXPL_MAGICAL);
            await deltrap(ttmp);
            await newsym(x, y);
            if (seeit) {
                learn_it.value = (1);
            }
        }
    }
}
/* zap_map() occurs before hitting monsters or objects and handles wands or
   spells that don't dish out 'elemental' damage */
/* zapped wand, or book for cast spell */
export async function zap_map(x, y, obj) {
    let ttmp = t_at(x, y);
    /* might be changed by drawbridge handling */
    let dbx = x;
    let dby = y;
    let learn_it = (0);
    await maybe_explode_trap(ttmp, obj, { get value() { return learn_it; }, set value(_v) { learn_it = _v; } });
    ttmp = t_at(x, y);
    if (game.u.dz > 0) {
        let ebuf = '';
        let pristinebuf = '';
        let etxt = null;
        let e = engr_at(x, y);
        if (e && e.engr_type != 6) {
            switch (obj.otyp) {
                /* subset of engraving effects; none sets `disclose' */
                case WAN_POLYMORPH:
                case SPE_POLYMORPH:
                    await del_engr(e);
                    etxt = await random_engraving(ebuf, pristinebuf);
                    await make_engr_at(x, y, etxt, pristinebuf, game.moves, 0);
                    break;
                case WAN_CANCELLATION:
                case SPE_CANCELLATION:
                case WAN_MAKE_INVISIBLE:
                    await del_engr(e);
                    break;
                case WAN_TELEPORTATION:
                case SPE_TELEPORT_AWAY:
                    await rloc_engr(e);
                    break;
                case SPE_STONE_TO_FLESH:
                    if (e.engr_type == 2) {
                        await pline_The((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "floor runs like butter!" : "edges on the floor get smoother.");
                        await wipe_engr_at(x, y, d(2, 4), (1));
                    }
                    break;
                case WAN_STRIKING:
                case SPE_FORCE_BOLT:
                    await wipe_engr_at(x, y, d(2, 4), (1));
                    break;
                default:
                    break;
            }
        }
    } else if (!game.u.dz) {
        let ltyp = game.level.locations[x][y].typ;
        if (find_drawbridge({ get value() { return dbx; }, set value(_v) { dbx = _v; } }, { get value() { return dby; }, set value(_v) { dby = _v; } })) {
            switch (obj.otyp) {
                case WAN_OPENING:
                case SPE_KNOCK:
                    if (is_db_wall(x, y)) {
                        /* dbwall: 'closed door' of raised drawbridge */
                        if (((game.viz_array[dby][dbx] & 2) != 0) || ((game.viz_array[y][x] & 2) != 0)) {
                            learn_it = (1);
                        }
                        await open_drawbridge(dbx, dby);
                    }
                    break;
                case WAN_LOCKING:
                case SPE_WIZARD_LOCK:
                    if ((((game.viz_array[dby][dbx] & 2) != 0) || ((game.viz_array[y][x] & 2) != 0)) && game.level.locations[dbx][dby].typ == DRAWBRIDGE_DOWN) {
                        learn_it = (1);
                    }
                    await close_drawbridge(dbx, dby);
                    break;
                case WAN_STRIKING:
                case SPE_FORCE_BOLT:
                    if (ltyp != DRAWBRIDGE_UP) {
                        learn_it = (1);
                        await destroy_drawbridge(dbx, dby);
                    }
                    break;
            }
        }
    }
    if (obj.otyp == WAN_PROBING) {
        let ltyp = 0;
        let oldtyp = 0;
        let oldglyph = 0;
        /* map terrain; might reveal a special room which is already within
           view that hasn't been entered yet */
        oldtyp = game.lastseentyp[x][y];
        oldglyph = glyph_at(x, y);
        await show_map_spot(x, y, (0));
        if (oldtyp != game.lastseentyp[x][y] || oldglyph != glyph_at(x, y)) {
            learn_it = (1);
        }
        ltyp = ((game.level.locations[x][y].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[x][y].flags) : game.level.locations[x][y].typ);
        if (ltyp == SDOOR) {
            /* secret door gets revealed, converted into regular door */
            cvt_sdoor_to_door(game.level.locations[x][y]);
            recalc_block_point(x, y);
            await newsym(x, y);
            if (((game.viz_array[y][x] & 2) != 0)) {
                await pline("Probing reveals a secret door.");
                learn_it = (1);
            } else if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                await draft_message((0));
            }
        } else if (ltyp == SCORR) {
            game.level.locations[x][y].typ = CORR;
            unblock_point(x, y);
            await newsym(x, y);
            await pline("Probing exposes a secret corridor.");
            learn_it = (1);
        } else if (ltyp == ICE || ((ltyp) >= STAIRS && (ltyp) <= ALTAR)) {
            if (game.u.dz > 0) {
                await force_decor((1));
                learn_it = (1);
            }
        }
        if (ttmp) {
            /*
         * Probing reveals undiscovered traps.
         *
         * FIXME?  This finds floor traps even when zapping up and
         * ceiling traps even when zapping down.
         */
            let ttmpname = null;
            let t_already_seen = ttmp.tseen;
            let use_the = 0;
            let hallu = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) != 0;
            ttmp.tseen = 1;
            await newsym(x, y);
            if (!t_already_seen || hallu) {
                ttmpname = trapname(ttmp.ttyp, (0));
                use_the = !hallu ? (ttmp.ttyp == VIBRATING_SQUARE && Invocation_lev(game.u.uz)) : !rn2(4);
                await You("find %s%c", use_the ? await the(ttmpname) : await an(ttmpname), use_the ? 33 : 46);
                learn_it = !hallu;
            }
        }
    }
    if (learn_it) {
        await learnwand(obj);
    }
    return;
}
/*
 *  Called for the following distance effects:
 *      when a weapon is thrown (weapon == THROWN_WEAPON)
 *      when an object is kicked (KICKED_WEAPON)
 *      when an IMMEDIATE wand is zapped (ZAPPED_WAND)
 *      when a light beam is flashed (FLASHED_LIGHT)
 *      when a mirror is applied (INVIS_BEAM)
 *  A thrown/kicked object falls down at end of its range or when a monster
 *  is hit.  The variable 'gb.bhitpos' is set to the final position of the
 *  weapon thrown/zapped.  The ray of a wand may affect (by calling a provided
 *  function) several objects and monsters on its path.  The return value
 *  is the monster hit (weapon != ZAPPED_WAND), or a null monster pointer.
 *
 *  Thrown and kicked objects (THROWN_WEAPON or KICKED_WEAPON) may be
 *  destroyed and *pobj set to NULL to indicate this.
 *
 *  Check !u.uswallow before calling bhit().
 *  This function reveals the absence of a remembered invisible monster in
 *  necessary cases (throwing or kicking weapons).  The presence of a real
 *  one is revealed for a weapon, but if not a weapon is left up to fhitm().
 *
 *  If fhitm returns non-zero value, stops the beam and returns the monster
 */
/* direction and range */
/* defined in hack.h */
/* fns called when mon/obj hit */
/* object tossed/used, set to NULL
                                   * if object is destroyed */
export async function bhit(ddx, ddy, range, weapon, fhitm, fhito, pobj) {
    let mtmp = null;
    let result = null;
    let obj = null;
    let ttmp = null;
    let typ = 0;
    let shopdoor = 0;
    let point_blank = 0;
    let in_skip = 0;
    let allow_skip = 0;
    let tethered_weapon = 0;
    let skiprange_start = 0;
    let skiprange_end = 0;
    let skipcount = 0;
    let was_returning = null;
    bhit_done: {
        result = null;
        obj = pobj;
        shopdoor = (0);
        point_blank = (1);
        in_skip = (0);
        allow_skip = (0);
        tethered_weapon = (0);
        skiprange_start = 0;
        skiprange_end = 0;
        skipcount = 0;
        was_returning = (game.iflags.returning_missile == obj) ? obj : null;
        if (weapon == KICKED_WEAPON) {
            /* object starts one square in front of player */
            game.bhitpos.x = game.u.ux + ddx;
            game.bhitpos.y = game.u.uy + ddy;
            range--;
        } else {
            /* counterclockwise traversal patterns, from @ to 1 then on through to 9
     *  ..........................54.................................
     *  ..................43.....6..3....765.........................
     *  ..........32.....5..2...7...2...8...4....87..................
     *  .........4..1....6..1...8..1....9...3...9..6.....98..........
     *  ..21@....5...@...7..@....9@......@12....@...5...@..7.....@9..
     *  .3...9....6..9....89.....................1..4...1..6....1..8.
     *  .4...8.....78.............................23....2..5...2...7.
     *  ..567............................................34....3..6..
     *  ........................................................45...
     * (invert rows for corresponding clockwise patterns)
     */
            game.bhitpos.x = game.u.ux;
            game.bhitpos.y = game.u.uy;
        }
        if (weapon == THROWN_WEAPON && obj && obj.otyp == ROCK) {
            skiprange(range, { get value() { return skiprange_start; }, set value(_v) { skiprange_start = _v; } }, { get value() { return skiprange_end; }, set value(_v) { skiprange_end = _v; } });
            allow_skip = !rn2(3);
        }
        if (weapon == FLASHED_LIGHT) {
            await tmp_at((-1), (((S_flashbeam) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_flashbeam) <= S_trwall) ? ((S_flashbeam) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_flashbeam) < S_altar) ? (((S_flashbeam) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_flashbeam) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_flashbeam) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_flashbeam) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_flashbeam) <= S_goodpos) ? (((S_flashbeam) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        } else if (weapon == THROWN_TETHERED_WEAPON && obj) {
            tethered_weapon = (1);
            /* simplify 'if's that follow below */
            weapon = THROWN_WEAPON;
            await tmp_at((-3), (((obj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((obj).corpsenm + ((((obj).spe & 3) == 1) ? (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((obj).otyp == CORPSE) ? (((obj).corpsenm + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(obj).dknown && ((obj).oclass == POTION_CLASS || ((obj).otyp >= FIRST_REAL_GEM && ((obj).otyp <= LAST_GLASS_GEM)) || ((obj).otyp >= FIRST_SPELL && ((obj).otyp <= LAST_SPELL)))) ? (((obj).oclass + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((obj).otyp + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
        } else if (weapon != ZAPPED_WAND && weapon != INVIS_BEAM) {
            await tmp_at((-4), (((obj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((obj).corpsenm + ((((obj).spe & 3) == 1) ? (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((obj).otyp == CORPSE) ? (((obj).corpsenm + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(obj).dknown && ((obj).oclass == POTION_CLASS || ((obj).otyp >= FIRST_REAL_GEM && ((obj).otyp <= LAST_GLASS_GEM)) || ((obj).otyp >= FIRST_SPELL && ((obj).otyp <= LAST_SPELL)))) ? (((obj).oclass + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((obj).otyp + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
        }
        while (range-- > 0) {
            let x = 0;
            let y = 0;
            let xyglyph = 0;
            game.bhitpos.x += ddx;
            game.bhitpos.y += ddy;
            x = game.bhitpos.x;
            y = game.bhitpos.y;
            if (!isok(x, y)) {
                game.bhitpos.x -= ddx;
                game.bhitpos.y -= ddy;
                break;
            }
            if (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_PICK_AXE) && inside_shop(x, y) && (mtmp = await shkcatch(obj, x, y)) != null) {
                await tmp_at((-7), 0);
                result = mtmp;
                break bhit_done;
            }
            typ = game.level.locations[x][y].typ;
            if (((typ) == WATER) || typ == LAVAWALL) {
                /* WATER aka "wall of water" stops items */
                /* note: for FLASHED_LIGHT, _caller_ must call transient_light_cleanup()
       after possibly calling flash_hits_mon() */
                if (weapon == THROWN_WEAPON || weapon == KICKED_WEAPON) {
                    break;
                }
            }
            if (weapon == THROWN_WEAPON || weapon == KICKED_WEAPON) {
                /* iron bars will block anything big enough and break some things */
                if (obj.lamplit && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await show_transient_light(obj, x, y);
                }
                if (typ == IRONBARS && await hits_bars(pobj, x - ddx, y - ddy, x, y, point_blank ? 0 : !rn2(5), 1)) {
                    /* caveat: obj might now be null... */
                    /* not currently needed due to 'break'; keep */
                    obj = pobj;
                    ((obj));
                    /* in case usage gets added after the loop   */
                    game.bhitpos.x -= ddx;
                    game.bhitpos.y -= ddy;
                    break;
                }
            } else if (weapon == FLASHED_LIGHT) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await show_transient_light(null, x, y);
                }
            }
            if (weapon == ZAPPED_WAND) {
                await zap_map(x, y, obj);
                /* terrain might have changed (exposed secret door|corridor) */
                typ = game.level.locations[x][y].typ;
            }
            mtmp = (game.level.monsters[x][y]);
            ttmp = t_at(x, y);
            if (!mtmp && ttmp && (ttmp.ttyp == WEB) && (weapon == THROWN_WEAPON || weapon == KICKED_WEAPON) && !rn2(3)) {
                if (((game.viz_array[y][x] & 2) != 0)) {
                    await pline("%s gets stuck in a web!", await Yname2(obj));
                    ttmp.tseen = (1);
                    await newsym(x, y);
                }
                if (was_returning) {
                    game.iflags.returning_missile = null;
                }
                break;
            }
            if (skiprange_start && (range == skiprange_start) && allow_skip) {
                if (is_pool(x, y) && !mtmp) {
                    /*
         * skipping rocks
         *
         * skiprange_start is only set if this is a thrown rock
         */
                    in_skip = (1);
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await pline("%s %s%s.", await Yname2(obj), await otense(obj, "skip"), skipcount ? " again" : "");
                    } else {
                        await You_hear("%s skip.", await yname(obj));
                    }
                    skipcount++;
                } else if (skiprange_start > skiprange_end + 1) {
                    --skiprange_start;
                }
            }
            if (in_skip) {
                if (range <= skiprange_end) {
                    in_skip = (0);
                    if (range > 3) {
                        skiprange(range, { get value() { return skiprange_start; }, set value(_v) { skiprange_start = _v; } }, { get value() { return skiprange_end; }, set value(_v) { skiprange_end = _v; } });
                    }
                } else if (mtmp && ((mtmp.data).mlet == S_EEL || ((((mtmp.data).mflags1 & 2) != 0) || (((mtmp.data).mflags1 & 512) != 0) || (((mtmp.data).mflags1 & 1024) != 0)))) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && (canseemon(mtmp) || sensemon(mtmp))) {
                        await pline("%s %s over %s.", await Yname2(obj), await otense(obj, "pass"), await mon_nam(mtmp));
                    }
                    mtmp = null;
                }
            }
            /* if mtmp is a shade and missile passes harmlessly through it,
           give message and skip it in order to keep going;
           if attack is light and mtmp is a mimic pretending to be an
           object, behave as if there is no monster here (if pretending
           to be furniture, it will be revealed by flash_hits_mon());
           thrown objects don't hit mimics pretending to be objects (both
           because the hero is likely aiming to throw over what seems to
           be an object rather than at it, and for balance because
           otherwise mimics are too easy to identify by throwing gold at
           them); exception: if the hero knows there is a monster there,
           they will be aiming at the monster */
            xyglyph = glyph_at(x, y);
            if (mtmp && (((weapon == THROWN_WEAPON || weapon == KICKED_WEAPON) && (await shade_miss(game.youmonst, mtmp, obj, (1), (1)) || (((mtmp).m_ap_type & 7) == M_AP_OBJECT && !((((xyglyph) >= GLYPH_MON_MALE_OFF && (xyglyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((xyglyph) >= GLYPH_MON_FEM_OFF && (xyglyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((xyglyph) >= GLYPH_PET_MALE_OFF && (xyglyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((xyglyph) >= GLYPH_PET_FEM_OFF && (xyglyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((xyglyph) >= GLYPH_RIDDEN_MALE_OFF && (xyglyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((xyglyph) >= GLYPH_RIDDEN_FEM_OFF && (xyglyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((xyglyph) >= GLYPH_DETECT_MALE_OFF && (xyglyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((xyglyph) >= GLYPH_DETECT_FEM_OFF && (xyglyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) && !((xyglyph) >= GLYPH_WARNING_OFF && (xyglyph) < (GLYPH_WARNING_OFF + 6)) && !((xyglyph) == GLYPH_INVIS_OFF)))) || (weapon == FLASHED_LIGHT && ((mtmp).m_ap_type & 7) == M_AP_OBJECT))) {
                mtmp = null;
            }
            if (mtmp) {
                game.notonhead = (x != mtmp.mx || y != mtmp.my);
                if (weapon == FLASHED_LIGHT) {
                    if (mtmp.minvis) {
                        /* FLASHED_LIGHT hitting invisible monster should pass
                   through instead of stop so we call flash_hits_mon()
                   directly rather than returning mtmp back to caller.
                   That allows the flash to keep on going.  Note that we
                   use mtmp->minvis, not canspotmon(), because it makes no
                   difference whether hero can see the monster or not. */
                        obj.ox = game.u.ux , obj.oy = game.u.uy;
                        await flash_hits_mon(mtmp, obj);
                    } else {
                        await tmp_at((-7), 0);
                        /* caller will call flash_hits_mon() */
                        /* Like FLASHED_LIGHT, INVIS_BEAM should continue
                   through invisible targets; unlike it, we aren't
                   prepared for multiple hits so just get first one
                   that's either visible or could see its invisible
                   self.  [No tmp_at() cleanup is needed here.] */
                        result = mtmp;
                        /* result == (struct monst *) 0 */
                        break bhit_done;
                    }
                } else if (weapon == INVIS_BEAM) {
                    if (!mtmp.minvis || (((mtmp.data).mflags1 & 16777216) != 0)) {
                        result = mtmp;
                        break bhit_done;
                    }
                } else if (weapon != ZAPPED_WAND) {
                    if (!tethered_weapon) {
                        await tmp_at((-7), 0);
                    }
                    if (((game.viz_array[y][x] & 2) != 0) && !(canseemon(mtmp) || sensemon(mtmp))) {
                        await map_invisible(x, y);
                    }
                    result = mtmp;
                    break bhit_done;
                } else {
                    if ((fhitm)(mtmp, obj)) {
                        result = mtmp;
                        break bhit_done;
                    }
                    range -= 3;
                }
            } else {
                if (weapon == ZAPPED_WAND && obj.otyp == WAN_PROBING && ((game.level.locations[x][y].glyph) == GLYPH_INVIS_OFF)) {
                    await unmap_object(x, y);
                    await newsym(x, y);
                }
            }
            if (fhito) {
                if (await bhitpile(obj, fhito, x, y, 0)) {
                    range--;
                }
            } else {
                if (weapon == KICKED_WEAPON && ((obj.oclass == COIN_CLASS && (game.level.objects[x][y] != null)) || await ship_object(obj, x, y, await costly_spot(x, y)))) {
                    await tmp_at((-7), 0);
                    break bhit_done;
                }
            }
            if (weapon == ZAPPED_WAND && (((typ) == DOOR) || typ == SDOOR)) {
                switch (obj.otyp) {
                    case WAN_OPENING:
                    case WAN_LOCKING:
                    case WAN_STRIKING:
                    case SPE_KNOCK:
                    case SPE_WIZARD_LOCK:
                    case SPE_FORCE_BOLT:
                        if (await doorlock(obj, x, y)) {
                            if (((game.viz_array[y][x] & 2) != 0) || (obj.otyp == WAN_STRIKING && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf))) {
                                await learnwand(obj);
                            }
                            if (game.level.locations[x][y].flags == 1 && in_rooms(x, y, SHOPBASE)) {
                                shopdoor = (1);
                                await add_damage(x, y, 400);
                            }
                        }
                        break;
                }
            }
            if (!((typ) >= POOL) || closed_door(x, y)) {
                game.bhitpos.x -= ddx;
                game.bhitpos.y -= ddy;
                break;
            }
            if (weapon != ZAPPED_WAND && weapon != INVIS_BEAM) {
                if (((game.level.locations[x][y].glyph) == GLYPH_INVIS_OFF) && ((game.viz_array[y][x] & 2) != 0)) {
                    await unmap_object(x, y);
                    await newsym(x, y);
                }
                await tmp_at(x, y);
                (game.windowprocs.win_delay_output)();
                /* kicked objects fall in pools */
                if ((weapon == KICKED_WEAPON) && is_pool_or_lava(x, y)) {
                    break;
                }
                if (((typ) == SINK) && weapon != FLASHED_LIGHT) {
                    break;
                }
            }
            if (weapon == THROWN_WEAPON && range > 0 && obj.otyp == HEAVY_IRON_BALL) {
                /* physical objects fall onto sink */
                /* limit range of ball so hero won't make an invalid move */
                let bobj = null;
                let t = null;
                if ((bobj = sobj_at(BOULDER, x, y)) != null) {
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        await pline("%s hits %s.", await The(await distant_name(obj, xname)), await an(await xname(bobj)));
                    }
                    range = 0;
                } else if (obj == game.uball) {
                    if (!await test_move(x - ddx, y - ddy, ddx, ddy, 1)) {
                        /* nb: it didn't hit anything directly */
                        if (((game.viz_array[y][x] & 2) != 0)) {
                            await pline("%s jerks to an abrupt halt.", await The(await distant_name(obj, xname)));
                        }
                        /* hero falls into the trap, so ball stops */
                        range = 0;
                    } else if (game.level.flags.sokoban_rules && (t = t_at(x, y)) != null && (((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT) || ((t.ttyp) == HOLE || (t.ttyp) == TRAPDOOR))) {
                        range = 0;
                    }
                }
            }
            /* thrown/kicked missile has moved away from its starting spot */
            /* affects passing through iron bars */
            point_blank = (0);
        }
        if ((weapon != ZAPPED_WAND && weapon != INVIS_BEAM && !tethered_weapon) || (was_returning && was_returning != game.iflags.returning_missile)) {
            await tmp_at((-7), 0);
        }
        if (shopdoor) {
            await pay_for_damage("destroy", (0));
        }
    }
    if (weapon == THROWN_WEAPON || weapon == KICKED_WEAPON) {
        await transient_light_cleanup();
    }
    return result;
}
/* process thrown boomerang, which travels a curving path...
 * A multi-shot volley ought to have all missiles in flight at once,
 * but we're called separately for each one.  We terminate the volley
 * early on a failed catch since continuing to throw after being hit
 * is too obviously silly.
 */
export async function boomhit(obj, dx, dy) {
    let i = 0;
    let ct = 0;
    let boom = 0;
    let mtmp = null;
    let counterclockwise = (game.u.uhandedness == 0);
    let nhits = ((1) > (obj.spe + 1) ? (1) : (obj.spe + 1));
    game.bhitpos.x = game.u.ux;
    game.bhitpos.y = game.u.uy;
    boom = counterclockwise ? S_boomleft : S_boomright;
    i = xytodir(dx, dy);
    await tmp_at((-4), (((boom) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((boom) <= S_trwall) ? ((boom) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((boom) < S_altar) ? (((boom) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((boom) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((boom) < S_arrow_trap + (TRAPNUM - 1)) ? (((boom) - S_grave) + GLYPH_CMAP_B_OFF) : ((boom) <= S_goodpos) ? (((boom) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
    for (ct = 0; ct < 10; ct++) {
        i = (((i) + (N_DIRS_Z - 2)) % (N_DIRS_Z - 2));
        boom = (S_boomleft + S_boomright - boom);
        await tmp_at((-6), (((boom) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((boom) <= S_trwall) ? ((boom) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((boom) < S_altar) ? (((boom) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((boom) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((boom) < S_arrow_trap + (TRAPNUM - 1)) ? (((boom) - S_grave) + GLYPH_CMAP_B_OFF) : ((boom) <= S_goodpos) ? (((boom) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        dx = xdir[i];
        dy = ydir[i];
        game.bhitpos.x += dx;
        game.bhitpos.y += dy;
        if (!isok(game.bhitpos.x, game.bhitpos.y)) {
            game.bhitpos.x -= dx;
            game.bhitpos.y -= dy;
            break;
        }
        if ((mtmp = (game.level.monsters[game.bhitpos.x][game.bhitpos.y])) != null) {
            await m_respond(mtmp);
            if (nhits-- < 0) {
                await tmp_at((-7), 0);
                return mtmp;
            } else if (await throwit_mon_hit(obj, mtmp) || !game.thrownobj) {
                break;
            }
        }
        if (!((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) >= POOL) || closed_door(game.bhitpos.x, game.bhitpos.y)) {
            game.bhitpos.x -= dx;
            game.bhitpos.y -= dy;
            break;
        }
        if (((game.bhitpos.x) == game.u.ux && (game.bhitpos.y) == game.u.uy)) {
            if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || rn2(20) >= (acurr(A_DEX))) {
                let dam = await dmgval(obj, game.youmonst);
                await thitu(10 + obj.spe, (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam)), { get value() { return obj; }, set value(_v) { obj = _v; } }, "boomerang");
                await endmultishot((1));
                break;
            } else {
                await tmp_at((-7), 0);
                await You("skillfully catch the boomerang.");
                return game.youmonst;
            }
        }
        await tmp_at(game.bhitpos.x, game.bhitpos.y);
        (game.windowprocs.win_delay_output)();
        if (((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) == SINK)) {
            ;
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                await pline("Klonk!");
            }
            await wake_nearto(game.bhitpos.x, game.bhitpos.y, 20);
            break;
        }
        /* ct==0, initial position, we want next delta to be same;
           ct==5, opposite position, repeat delta undoes first one */
        if (ct % 5 != 0) {
            i = counterclockwise ? (((i) + 7) % (N_DIRS_Z - 2)) : (((i) + 1) % (N_DIRS_Z - 2));
        }
    }
    await tmp_at((-7), 0);
    return null;
}
/* used by buzz(); also used by munslime(muse.c); returns damage applied
   to mon; note: caller is responsible for killing mon if damage is fatal */
/* monster being hit */
/* zap or breath type */
/* number of hit dice to use */
/* to return worn armor for caller to disintegrate */
export async function zhitm(mon, type, nd, ootmp) {
    let tmp = 0;
    let orig_dmg = 0;
    let damgtype = zaptype(type) % 10;
    let sho_shieldeff = (0);
    let spellcaster = ((type) >= 10 && (type) < 20);
    ootmp.value = null;
    switch (damgtype) {
        case (1 - 1):
            if (resists_magm(mon) || await defended(mon, 1)) {
                sho_shieldeff = (1);
                break;
            }
            tmp = d(nd, 6);
            if (spellcaster) {
                tmp = spell_damage_bonus(tmp);
            }
            break;
        case (2 - 1):
            if (await Resists_Elem(mon, FIRE_RES) || await defended(mon, 2)) {
                sho_shieldeff = (1);
                break;
            }
            tmp = d(nd, 6);
            if (spellcaster) {
                tmp = spell_damage_bonus(tmp);
            }
            /* includes spell bonus but not monster vuln to fire */
            /* includes spell bonus but not monster vuln to cold */
            orig_dmg = tmp;
            if (await Resists_Elem(mon, COLD_RES)) {
                tmp += 7;
            }
            if (await burnarmor(mon)) {
                if (!rn2(3)) {
                    tmp += await destroy_items(mon, 2, orig_dmg);
                    await ignite_items(mon.minvent);
                }
            }
            break;
        case (3 - 1):
            if (await Resists_Elem(mon, COLD_RES) || await defended(mon, 3)) {
                sho_shieldeff = (1);
                break;
            }
            tmp = d(nd, 6);
            if (spellcaster) {
                tmp = spell_damage_bonus(tmp);
            }
            orig_dmg = tmp;
            if (await Resists_Elem(mon, FIRE_RES)) {
                tmp += d(nd, 3);
            }
            if (!rn2(3)) {
                tmp += await destroy_items(mon, 3, orig_dmg);
            }
            break;
        case (4 - 1):
            tmp = 0;
            await sleep_monst(mon, d(nd, 25), type == ((4 - 1)) ? WAND_CLASS : 0);
            break;
        case (5 - 1):
            if (abs(type) != (20 + ((5 - 1)))) {
                if (mon.data == game.mons[PM_DEATH]) {
                    await healmon(mon, Math.trunc(mon.mhpmax * 3 / 2), Math.trunc(mon.mhpmax / 2));
                    if (mon.mhpmax >= 1000) {
                        mon.mhpmax = 1000 - 1;
                    }
                    /* can still blind the monster */
                    tmp = 0;
                    break;
                }
                if (((((mon.data).mflags2 & 2) != 0) || (mon.data) == game.mons[PM_MANES] || (((mon.data).mlet == S_GOLEM) || (mon.data).mlet == S_VORTEX)) || (((mon.data).mflags2 & 256) != 0) || ((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER) || resists_magm(mon)) {
                    sho_shieldeff = (1);
                    break;
                }
                /* so they don't get saving throws */
                type = -1;
            } else {
                let otmp2 = null;
                if (await Resists_Elem(mon, DISINT_RES) || await defended(mon, 5)) {
                    sho_shieldeff = (1);
                } else if (mon.misc_worn_check & 8) {
                    ootmp.value = await which_armor(mon, 8);
                } else if (mon.misc_worn_check & 1) {
                    ootmp.value = await which_armor(mon, 1);
                    if ((otmp2 = await which_armor(mon, 2)) != null) {
                        await m_useup(mon, otmp2);
                    }
                } else {
                    /* no suit, victim dies; destroy cloak
                   and shirt now in case target gets life-saved */
                    tmp = 1000;
                    if ((otmp2 = await which_armor(mon, 2)) != null) {
                        await m_useup(mon, otmp2);
                    }
                    if ((otmp2 = await which_armor(mon, 64)) != null) {
                        await m_useup(mon, otmp2);
                    }
                }
                type = -1;
                break;
            }
            tmp = mon.mhp + 1;
            break;
        case (6 - 1):
            tmp = d(nd, 6);
            if (spellcaster) {
                tmp = spell_damage_bonus(tmp);
            }
            orig_dmg = tmp;
            if (await Resists_Elem(mon, SHOCK_RES) || await defended(mon, 6)) {
                sho_shieldeff = (1);
                tmp = 0;
            }
            if (!await resists_blnd(mon) && !(type > 0 && (game.u.uswallow && (game.u.ustuck == (mon)))) && nd > 2) {
                /* sufficiently powerful lightning blinds monsters */
                let rnd_tmp = rnd(50);
                mon.mcansee = 0;
                if ((mon.mblinded + rnd_tmp) > 127) {
                    mon.mblinded = 127;
                } else {
                    mon.mblinded += rnd_tmp;
                }
            }
            if (!rn2(3)) {
                tmp += await destroy_items(mon, 6, orig_dmg);
            }
            break;
        case (7 - 1):
            if (await Resists_Elem(mon, POISON_RES) || await defended(mon, 7)) {
                sho_shieldeff = (1);
                break;
            }
            tmp = d(nd, 6);
            break;
        case (8 - 1):
            if (await Resists_Elem(mon, ACID_RES) || await defended(mon, 8)) {
                sho_shieldeff = (1);
                break;
            }
            tmp = d(nd, 6);
            if (!rn2(6)) {
                await acid_damage(((mon).mw));
            }
            if (!rn2(6)) {
                await erode_armor(mon, 3);
            }
            break;
    }
    if (sho_shieldeff) {
        await shieldeff(mon.mx, mon.my);
    }
    if (((type) >= 10 && (type) < 20) && ((game.urole.mnum == (PM_KNIGHT)) && game.u.uhave.questart)) {
        tmp *= 2;
    }
    if (tmp > 0 && type >= 0 && await resist(mon, type < (10 + (0)) ? WAND_CLASS : 0, 0, 0)) {
        tmp = Math.trunc(tmp / 2);
    }
    if (tmp < 0) {
        tmp = 0;
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/zap.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            await pline("zapped monster hp = %d (= %d - %d)", mon.mhp - tmp, mon.mhp, tmp);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    /* don't allow negative damage */
    mon.mhp -= tmp;
    return tmp;
}
export async function zhitu(type, nd, fltxt, sx, sy) {
    let dam = 0;
    let abstyp = zaptype(type);
    let orig_dam = 0;
    switch (abstyp % 10) {
        case (1 - 1):
            if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                await shieldeff(sx, sy);
                await pline_The("missiles bounce off!");
                monstseesu(M_SEEN_MAGR);
            } else {
                dam = d(nd, 6);
                await exercise(A_STR, (0));
                monstunseesu(M_SEEN_MAGR);
            }
            break;
        case (2 - 1):
            orig_dam = d(nd, 6);
            if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                await shieldeff(sx, sy);
                await You("don't feel hot!");
                monstseesu(M_SEEN_FIRE);
                await ugolemeffects(2, orig_dam);
            } else {
                dam = orig_dam;
                monstunseesu(M_SEEN_FIRE);
            }
            await burn_away_slime();
            if (await burnarmor(game.youmonst)) {
                if (!rn2(3)) {
                    await destroy_items(game.youmonst, 2, orig_dam);
                }
                if (!rn2(3)) {
                    await ignite_items(game.invent);
                }
            }
            break;
        case (3 - 1):
            orig_dam = d(nd, 6);
            if ((game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic)) {
                await shieldeff(sx, sy);
                await You("don't feel cold.");
                monstseesu(M_SEEN_COLD);
                await ugolemeffects(3, orig_dam);
            } else {
                dam = orig_dam;
                monstunseesu(M_SEEN_COLD);
            }
            if (!rn2(3)) {
                await destroy_items(game.youmonst, 3, orig_dam);
            }
            break;
        case (4 - 1):
            if ((game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                await shieldeff(game.u.ux, game.u.uy);
                await You("don't feel sleepy.");
                monstseesu(M_SEEN_SLEEP);
            } else {
                monstunseesu(M_SEEN_SLEEP);
                await fall_asleep(-d(nd, 25), (1));
            }
            break;
        case (5 - 1):
            if (abstyp == (20 + ((5 - 1)))) {
                let disn_prot = inventory_resistance_check(5);
                if ((game.u.uprops[DISINT_RES].intrinsic || game.u.uprops[DISINT_RES].extrinsic)) {
                    await You("are not disintegrated.");
                    monstseesu(M_SEEN_DISINT);
                    break;
                } else if (disn_prot) {
                    break;
                }
                monstunseesu(M_SEEN_DISINT);
                if (game.uarms) {
                    await disintegrate_arm(game.uarms);
                    break;
                } else if (game.uarm) {
                    if (game.uarmc) {
                        await disintegrate_arm(game.uarmc);
                    }
                    await disintegrate_arm(game.uarm);
                    break;
                }
                if (game.uarmc) {
                    await disintegrate_arm(game.uarmc);
                }
                if (game.uarmu) {
                    await disintegrate_arm(game.uarmu);
                }
            } else if (((((game.youmonst.data).mflags2 & 2) != 0) || (game.youmonst.data) == game.mons[PM_MANES] || (((game.youmonst.data).mlet == S_GOLEM) || (game.youmonst.data).mlet == S_VORTEX)) || (((game.youmonst.data).mflags2 & 256) != 0)) {
                await shieldeff(sx, sy);
                await You("seem unaffected.");
                break;
            } else if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                await shieldeff(sx, sy);
                monstseesu(M_SEEN_MAGR);
                await You("aren't affected.");
                break;
            }
            monstunseesu(M_SEEN_MAGR);
            game.killer.format = 0;
            game.killer.name = strcpy(game.killer.name, fltxt ? fltxt : "");
            /* when killed by disintegration breath, don't leave corpse */
            game.u.ugrave_arise = (type == -(20 + ((5 - 1)))) ? -3 : NON_PM;
            await done(DIED);
            /* wizard mode terrain wish: skip livelogging, etc */
            return;
        case (6 - 1):
            orig_dam = d(nd, 6);
            if ((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
                await shieldeff(sx, sy);
                await You("aren't affected.");
                monstseesu(M_SEEN_ELEC);
                await ugolemeffects(6, orig_dam);
            } else {
                dam = orig_dam;
                await exercise(A_CON, (0));
                monstunseesu(M_SEEN_ELEC);
            }
            if (!rn2(3)) {
                await destroy_items(game.youmonst, 6, orig_dam);
            }
            break;
        case (7 - 1):
            await poisoned("blast", A_DEX, "poisoned blast", 15, (0));
            break;
        case (8 - 1):
            if ((game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
                await pline_The("%s doesn't hurt.", hliquid("acid"));
                monstseesu(M_SEEN_ACID);
                dam = 0;
            } else {
                await pline_The("%s burns!", hliquid("acid"));
                dam = d(nd, 6);
                await exercise(A_STR, (0));
                monstunseesu(M_SEEN_ACID);
            }
            if (!rn2(game.u.twoweap ? 3 : 6)) {
                await acid_damage(game.uwep);
            }
            if (game.u.twoweap && !rn2(3)) {
                await acid_damage(game.uswapwep);
            }
            if (!rn2(6)) {
                await erode_armor(game.youmonst, 3);
            }
            break;
    }
{
        let kbuf = '';
        let otmp = game.current_wand;
        /* fire horn and frost horn get handled as wands by caller */
        let verb = (abstyp < 10) ? ((otmp && otmp.oclass == TOOL_CLASS) ? "played" : "zapped") : (abstyp < 20) ? "cast" : (abstyp < 30) ? "exhaled" : "imagined";
        if (type < 0 || (type == 0 && game.buzzer != null)) {
            await death_inflicted_by(kbuf, fltxt, game.buzzer);
            /* change "death inflicted by mon" to "death <verb> by mon" */
            if (game.buzzer) {
                kbuf = strsubst(kbuf, "inflicted", verb);
            }
        } else {
            /* FIXME: "zapped by herself" is suitable for a rebound;
               "zapped at herself" would be better if player explicitly
               targeted hero */
            kbuf = sprintf(kbuf, "%s %s by %sself", fltxt, verb, (genders[game.flags.female ? 1 : 0].him));
        }
        /* Half_spell_damage protection yields half-damage for wands & spells,
           including hero's own ricochets; breath attacks do full damage */
        if (dam && (game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic) && abstyp < 20) {
            dam = Math.trunc((dam + 1) / 2);
        }
        await losehp(dam, kbuf, 0);
    }
    return;
}
/*
 * burn objects (such as scrolls and spellbooks) on floor
 * at position x,y; return the number of objects burned
 */
/* caller needs to decide about visibility checks */
export async function burn_floor_objects(x, y, give_feedback, u_caused) {
    let obj = null;
    let obj2 = null;
    let i = 0;
    let scrquan = 0;
    let delquan = 0;
    let buf1 = '';
    let buf2 = '';
    let cnt = 0;
    for (obj = game.level.objects[x][y]; obj; obj = obj2) {
        obj2 = obj.v.v_nexthere;
        if (obj.oclass == SCROLL_CLASS || obj.oclass == SPBOOK_CLASS || (obj.oclass == FOOD_CLASS && obj.otyp == GLOB_OF_GREEN_SLIME)) {
            if (obj.otyp == SCR_FIRE || obj.otyp == SPE_FIREBALL || obj_resists(obj, 2, 100)) {
                continue;
            }
            scrquan = obj.quan;
            delquan = 0;
            for (i = scrquan; i > 0; i--) {
                if (!rn2(3)) {
                    delquan++;
                }
            }
            if (delquan) {
                if (give_feedback) {
                    /* save name before potential delobj() */
                    obj.quan = 1;
                    buf1 = strcpy(buf1, ((x) == game.u.ux && (y) == game.u.uy) ? await xname(obj) : await distant_name(obj, xname));
                    obj.quan = 2;
                    buf2 = strcpy(buf2, ((x) == game.u.ux && (y) == game.u.uy) ? await xname(obj) : await distant_name(obj, xname));
                    obj.quan = scrquan;
                }
                if (u_caused) {
                    await useupf(obj, delquan);
                } else if (delquan < scrquan) {
                    /* useupf(), which charges, only if hero caused damage */
                    obj.quan -= delquan;
                    obj.owt = await weight(obj);
                } else {
                    await delobj(obj);
                }
                cnt += delquan;
                if (give_feedback) {
                    if (delquan > 1) {
                        await pline("%ld %s burn.", delquan, buf2);
                    } else {
                        await pline("%s burns.", await An(buf1));
                    }
                }
            }
        }
    }
    await ignite_items(game.level.objects[x][y]);
    return cnt;
}
/* which direction a ray bounces.
   current location is sx,sy, direction is ddx, ddy.
   bounceback is 1/n chance of bouncing back.
   caller must ensure sx,sy is a bouncing location: !ZAP_POS or closed_door
 */
export function bounce_dir(sx, sy, ddx, ddy, bounceback) {
    if (!ddx.value || !ddy.value || (bounceback > 0 && !rn2(bounceback))) {
        ddx.value = -(ddx.value);
        ddy.value = -(ddy.value);
    } else {
        let rmn = 0;
        let bounce = 0;
        let lsy = sy - ddy.value;
        let lsx = sx - ddx.value;
        if (isok(sx, lsy) && ((rmn = game.level.locations[sx][lsy].typ) >= POOL) && !closed_door(sx, lsy) && (((rmn) >= ROOM) || (isok(sx + ddx.value, lsy) && ((game.level.locations[sx + ddx.value][lsy].typ) >= POOL)))) {
            bounce = 1;
        }
        if (isok(lsx, sy) && ((rmn = game.level.locations[lsx][sy].typ) >= POOL) && !closed_door(lsx, sy) && (((rmn) >= ROOM) || (isok(lsx, sy + ddy.value) && ((game.level.locations[lsx][sy + ddy.value].typ) >= POOL)))) {
            if (!bounce || rn2(2)) {
                bounce = 2;
            }
        }
        switch (bounce) {
            case 0:
                ddx.value = -(ddx.value);
                ;
            case 1:
                ddy.value = -(ddy.value);
                break;
            case 2:
                ddx.value = -(ddx.value);
                break;
        }
    }
}
/* will zap/spell/breath attack score a hit against armor class `ac'? */
/* either hero cast spell type or 0 */
export function zap_hit(ac, type) {
    let chance = rn2(20);
    let spell_bonus = type ? spell_hit_bonus(type) : 0;
    /* small chance for naked target to avoid being hit */
    if (!chance) {
        return rnd(10) < ac + spell_bonus;
    }
    /* very high armor protection does not achieve invulnerability */
    ac = ((ac) >= 0 ? (ac) : -rnd(-(ac)));
    return (3 - chance < ac + spell_bonus);
}
/* hero vs other */
export async function disintegrate_mon(mon, type, fltxt) {
    let otmp = null;
    let otmp2 = null;
    let m_amulet = await mlifesaver(mon);
    if (canseemon(mon)) {
        if (!m_amulet) {
            await pline("%s is disintegrated!", await Monnam(mon));
        } else {
            await hit(fltxt, mon, "!");
        }
    }
    for (otmp = mon.minvent; otmp; otmp = otmp2) {
        otmp2 = otmp.nobj;
        if (!(game.objects[otmp.otyp].oc_oprop == DISINT_RES || obj_resists(otmp, 5, 50) || is_quest_artifact(otmp) || otmp == m_amulet)) {
            await extract_from_minvent(mon, otmp, (1), (1));
            await obfree(otmp, null);
        }
    }
    if (type < 0) {
        await monkilled(mon, null, -242);
    } else {
        await xkilled(mon, 1 | 2);
    }
}
export async function ubuzz(type, nd) {
    await dobuzz(type, nd, game.u.ux, game.u.uy, game.u.dx, game.u.dy, (1), (0), (0));
}
export async function buzz(type, nd, sx, sy, dx, dy) {
    await dobuzz(type, nd, sx, sy, dx, dy, (1), (0), (0));
}
/*
 * type ==   0 to   9 : you zapping a wand
 * type ==  10 to  19 : you casting a spell
 * type ==  20 to  29 : you breathing as a monster
 * type == -10 to -19 : monster casting spell
 * type == -20 to -29 : monster breathing at you
 * type == -30 to -39 : monster zapping a wand
 * called with dx = dy = 0 for vertical bolts
 */
/* 0..29 (by hero) or -39..-10 (by monster) */
/* damage strength ('number of dice') */
/* starting point */
/* direction delta */
/* report out of sight hit/miss events */
export async function dobuzz(type, nd, sx, sy, dx, dy, sayhit, saymiss, forcemiss) {
    let range = 0;
    let fltyp = zaptype(type);
    let damgtype = fltyp % 10;
    let lsx = 0;
    let lsy = 0;
    let mon = null;
    let save_bhitpos = { x: 0, y: 0 };
    let shopdamage = (0);
    let fireball = (type == (10 + ((2 - 1))));
    let gas_hit = (0);
    let otmp = null;
    let spell_type = 0;
    let hdmgtype = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? rn2(6) : damgtype;
    /* if it's a hero spell then get its SPE_TYPE */
    spell_type = ((type) >= 10 && (type) < 20) ? SPE_MAGIC_MISSILE + damgtype : 0;
    if (game.u.uswallow) {
        let tmp = 0;
        if (type < 0) {
            return;
        }
        tmp = await zhitm(game.u.ustuck, type, nd, { get value() { return otmp; }, set value(_v) { otmp = _v; } });
        if (!game.u.ustuck) {
            game.u.uswallow = 0;
        } else {
            await pline("%s rips into %s%s", await The(flash_str(fltyp, (0))), await mon_nam(game.u.ustuck), exclam(tmp));
            /* Using disintegration from the inside only makes a hole... */
            if (tmp == 1000) {
                game.u.ustuck.mhp = 0;
            }
            if (((game.u.ustuck).mhp < 1)) {
                await killed(game.u.ustuck);
            }
        }
        return;
    }
    if (type < 0) {
        await newsym(game.u.ux, game.u.uy);
    }
    range = (rn2(7) + (7));
    if (dx == 0 && dy == 0) {
        range = 1;
    }
    Object.assign(save_bhitpos, game.bhitpos);
    await tmp_at((-1), await zapdir_to_glyph(dx, dy, hdmgtype));
    while (range-- > 0) {
        lsx = sx;
        sx += dx;
        lsy = sy;
        sy += dy;
        let __skip_to_bounce = false;
        if (!isok(sx, sy) || game.level.locations[sx][sy].typ == STONE) {
            __skip_to_bounce = true;
        }
        if (!__skip_to_bounce) {
        mon = (game.level.monsters[sx][sy]);
        if (((game.viz_array[sy][sx] & 2) != 0)) {
            /* reveal/unreveal invisible monsters before tmp_at() */
            if (mon && !(canseemon(mon) || sensemon(mon))) {
                await map_invisible(sx, sy);
            } else if (!mon) {
                await unmap_invisible(sx, sy);
            }
            if (((game.level.locations[sx][sy].typ) >= POOL) || (isok(lsx, lsy) && ((game.viz_array[lsy][lsx] & 2) != 0))) {
                await tmp_at(sx, sy);
            }
            (game.windowprocs.win_delay_output)();
        }
        /* hit() and miss() need gb.bhitpos to match the target */
        game.bhitpos.x = sx , game.bhitpos.y = sy;
        gas_hit = (damgtype == (7 - 1));
        if (!fireball && !gas_hit) {
            range += await zap_over_floor(sx, sy, type, { get value() { return shopdamage; }, set value(_v) { shopdamage = _v; } }, (1), 0);
            /* zap with fire -> melt ice -> drown monster, so monster
               found and cached above might not be here any more */
            mon = (game.level.monsters[sx][sy]);
        }
        /* buzzmonst-steed-redirect fix — C `goto buzzmonst` from the
           player-on-steed branch jumps INTO the if(mon) body with
           mon = u.usteed.  Translator emitted it as a TODO no-op.
           Reverse the if/else order: check player-at-sx-sy first
           (with !mon guard to preserve original mutual exclusion);
           set __steed_redirect + mon = u.usteed there; then if(mon)
           catches both the original mon AND the steed-redirect mon. */
        let __steed_redirect = (0);
        if (!mon && ((sx) == game.u.ux && (sy) == game.u.uy) && range >= 0) {
            nomul(0);
            if (game.u.usteed && !rn2(3) && !await mon_reflects(game.u.usteed, null)) {
                mon = game.u.usteed;
                __steed_redirect = (1);
            } else if (!forcemiss && zap_hit(game.u.uac, 0)) {
                range -= 2;
                await pline_dir(xytodir(-dx, -dy), "%s hits you!", await The(flash_str(fltyp, (0))));
                if ((game.u.uprops[REFLECTING].intrinsic || game.u.uprops[REFLECTING].extrinsic)) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await ureflects("But %s reflects from your %s!", "it");
                    } else {
                        await pline("For some reason you are not affected.");
                    }
                    monstseesu(M_SEEN_REFL);
                    dx = -dx;
                    dy = -dy;
                    await shieldeff(sx, sy);
                    gas_hit = (0);
                } else {
                    await zhitu(type, nd, flash_str(fltyp, (1)), sx, sy);
                    monstunseesu(M_SEEN_REFL);
                }
            } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("%s whizzes by you!", await The(flash_str(fltyp, (0))));
            } else if (damgtype == (6 - 1)) {
                await Your("%s tingles.", await body_part(ARM));
            }
            if (!__steed_redirect) {
                if (damgtype == (6 - 1)) {
                    await flashburn(d(nd, 50), (1));
                }
                await stop_occupation();
                nomul(0);
            }
        }
        if (mon) {
            if (fireball) {
                break;
            }
            if (type >= 0) {
                mon.mstrategy &= ~(268435456 | 536870912);
            }
            game.notonhead = (mon.mx != game.bhitpos.x || mon.my != game.bhitpos.y);
            if (!forcemiss && zap_hit(find_mac(mon), spell_type)) {
                if (await mon_reflects(mon, null)) {
                    if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
                        await hit(flash_str(fltyp, (0)), mon, exclam(0));
                        await shieldeff(mon.mx, mon.my);
                        await mon_reflects(mon, "But it reflects from %s %s!");
                        gas_hit = (0);
                    }
                    dx = -dx;
                    dy = -dy;
                } else {
                    let mon_could_move = mon.mcanmove;
                    let tmp = await zhitm(mon, type, nd, { get value() { return otmp; }, set value(_v) { otmp = _v; } });
                    if (((mon.data) == game.mons[PM_DEATH] || (mon.data) == game.mons[PM_FAMINE] || (mon.data) == game.mons[PM_PESTILENCE]) && abs(type) == (20 + ((5 - 1)))) {
                        if (canseemon(mon)) {
                            await hit(flash_str(fltyp, (0)), mon, ".");
                            await pline("%s disintegrates.", await Monnam(mon));
                            await pline("%s body reintegrates before your %s!", s_suffix(await Monnam(mon)), ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2) == 1) ? await body_part(EYE) : await makeplural(await body_part(EYE)));
                            await pline("%s resurrects!", await Monnam(mon));
                        }
                        mon.mhp = mon.mhpmax;
                        break;
                    }
                    if (mon.data == game.mons[PM_DEATH] && damgtype == (5 - 1)) {
                        if (canseemon(mon)) {
                            await hit(flash_str(fltyp, (0)), mon, ".");
                            await pline("%s absorbs the deadly %s!", await Monnam(mon), type == (20 + ((5 - 1))) ? "blast" : "ray");
                            await pline("It seems even stronger than before.");
                        }
                        break;
                    }
                    if (tmp == 1000) {
                        await disintegrate_mon(mon, type, flash_str(fltyp, (0)));
                    } else if (((mon).mhp < 1)) {
                        if (type < 0) {
                            await monkilled(mon, flash_str(fltyp, (0)), 242);
                        } else {
                            let xkflags = 0;
                            /* killed by hero; we know 'type' isn't negative;
                               if it's fire, highly flammable monsters leave
                               no corpse; don't bother reporting that they
                               "burn completely" -- unnecessary verbosity */
                            if (damgtype == (2 - 1) && ((mon.data) == game.mons[PM_PAPER_GOLEM] || (mon.data) == game.mons[PM_STRAW_GOLEM])) {
                                xkflags |= 2;
                            }
                            await xkilled(mon, xkflags);
                        }
                    } else {
                        if (!otmp) {
                            if (sayhit || canseemon(mon)) {
                                await hit(flash_str(fltyp, (0)), mon, exclam(tmp));
                            }
                        } else {
                            if (canseemon(mon)) {
                                await pline("%s %s is disintegrated!", s_suffix(await Monnam(mon)), await distant_name(otmp, xname));
                            }
                            await m_useup(mon, otmp);
                        }
                        if (mon_could_move && !mon.mcanmove) {
                            await slept_monst(mon);
                        }
                        if (damgtype != (4 - 1)) {
                            await wakeup(mon, (type >= 0) ? (1) : (0));
                        }
                    }
                }
                range -= 2;
            } else {
                if (saymiss || (canseemon(mon) && !disguised_as_non_mon(mon))) {
                    await miss(flash_str(fltyp, (0)), mon);
                }
            }
        }
        if (gas_hit) {
            await zap_over_floor(sx, sy, type, { get value() { return shopdamage; }, set value(_v) { shopdamage = _v; } }, (1), 0);
        }
        }
        if (__skip_to_bounce || !((game.level.locations[sx][sy].typ) >= POOL) || (closed_door(sx, sy) && range >= 0)) {
            let bchance = 0;
            bchance = (!isok(sx, sy) || game.level.locations[sx][sy].typ == STONE) ? 10 : (In_mines(game.u.uz) && ((game.level.locations[sx][sy].typ) && (game.level.locations[sx][sy].typ) <= DBWALL)) ? 20 : 75;
            if ((--range > 0 && isok(lsx, lsy) && ((game.viz_array[lsy][lsx] & 2) != 0)) || fireball) {
                if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
                    await pline_The("%s vanishes into the aether!", flash_str(fltyp, (0)));
                    if (fireball) {
                        type = ((2 - 1));
                    }
                    break;
                } else if (fireball) {
                    sx = lsx;
                    sy = lsy;
                    break;
                } else {
                    await pline_The("%s bounces!", flash_str(fltyp, (0)));
                }
            }
            bounce_dir(sx, sy, { get value() { return dx; }, set value(_v) { dx = _v; } }, { get value() { return dy; }, set value(_v) { dy = _v; } }, bchance);
            await tmp_at((-6), await zapdir_to_glyph(dx, dy, hdmgtype));
        }
    }
    await tmp_at((-7), 0);
    if (fireball) {
        await explode(sx, sy, type, d(12, 6), 0, EXPL_FIERY);
    }
    if (shopdamage) {
        await pay_for_damage(damgtype == (2 - 1) ? "burn away" : damgtype == (3 - 1) ? "shatter" : damgtype == (8 - 1) ? "damage" : damgtype == (5 - 1) ? "disintegrate" : "destroy", (0));
    }
    Object.assign(game.bhitpos, save_bhitpos);
}
export async function melt_ice(x, y, msg) {
    let lev = game.level.locations[x][y];
    let otmp = null;
    let mtmp = null;
    if (!msg) {
        msg = "The ice crackles and melts.";
    }
    if (lev.typ == DRAWBRIDGE_UP || lev.typ == DRAWBRIDGE_DOWN) {
        lev.flags &= ~8;
    } else {
        lev.typ = (lev.flags == 8 ? POOL : MOAT);
        lev.flags = 0;
    }
    /* no more ice to melt away */
    spot_stop_timers(x, y, MELT_ICE_AWAY);
    if (t_at(x, y)) {
        await trap_ice_effects(x, y, (1));
    }
    await obj_ice_effects(x, y, (0));
    await unearth_objs(x, y);
    if ((game.u.uinwater)) {
        await vision_recalc(1);
    }
    await newsym(x, y);
    if (((game.viz_array[y][x] & 2) != 0) || ((x) == game.u.ux && (y) == game.u.uy)) {
        await Norep("%s", msg);
    }
    if ((otmp = sobj_at(BOULDER, x, y)) != null) {
        if (((game.viz_array[y][x] & 2) != 0)) {
            await pline("%s settles...", await An(await xname(otmp)));
        }
        do {
            await obj_extract_self(otmp);
            if (!await boulder_hits_pool(otmp, x, y, (0))) {
                await impossible("melt_ice: no pool?");
            }
        } while (is_pool(x, y) && (otmp = sobj_at(BOULDER, x, y)) != null);
        await newsym(x, y);
    }
    if (((x) == game.u.ux && (y) == game.u.uy)) {
        await spoteffects((1));
    } else if (is_pool(x, y) && (mtmp = (game.level.monsters[x][y])) != null) {
        await minliquid(mtmp);
    }
}
/*
 * Usually start a melt_ice timer; sometimes the ice will become
 * permanent instead.
 */
/* <x,y>'s old melt timeout (deleted by time we get here) */
export async function start_melt_ice_timeout(x, y, min_time) {
    let when = 0;
    let where = 0;
    when = min_time;
    if (when < 50 - 1) {
        when = 50 - 1;
    }
    /* random timeout; surrounding ice locations ought to be a factor... */
    while (++when <= 2000) {
        if (!rn2((2000 - when) + 50)) {
            break;
        }
    }
    if (when <= 2000) {
        /* if we're within MAX_ICE_TIME, install a melt timer;
       otherwise, omit it to leave this ice permanent */
        where = (x << 16) | y;
        await start_timer(when, TIMER_LEVEL, MELT_ICE_AWAY, long_to_any(where));
    }
}
/*
 * Called when ice has melted completely away.
 */
export async function melt_ice_away(arg, timeout) {
    let x = 0;
    let y = 0;
    let where = arg.a_long;
    let save_mon_moving = game.context.mon_moving;
    /* melt_ice -> minliquid -> mondead|xkilled shouldn't credit/blame hero */
    /* hero isn't causing this ice to melt */
    game.context.mon_moving = (1);
    y = (where & 65535);
    x = ((where >> 16) & 65535);
    await melt_ice(x, y, "Some ice melts away.");
    game.context.mon_moving = save_mon_moving;
}
/* Burn floor scrolls, evaporate pools, etc... in a single square.
 * Used both for normal bolts of fire, cold, etc... and for fireballs.
 * Sets shopdamage to TRUE if a shop door is destroyed, and returns the
 * amount by which range is reduced (value is negative and will be added
 * to remaining range by caller; ignored by fireballs and poison gas).
 */
/* location */
/* damage type plus {wand|spell|breath} info */
/* extra output if shop door is destroyed */
/* ignore any monster here */
/* supplied when breaking a wand; or POT_OIL
                               * when a lit potion of oil explodes */
export async function zap_over_floor(x, y, type, shopdamage, ignoremon, exploding_wand_typ) {
    let zapverb = null;
    let mon = null;
    let t = null;
    let lev = game.level.locations[x][y];
    let see_it = ((game.viz_array[y][x] & 2) != 0);
    let yourzap = 0;
    let rangemod = 0;
    let damgtype = zaptype(type) % 10;
    let lavawall = (lev.typ == LAVAWALL);
    if (type == -1) {
        /* this won't have any effect on the floor */
        /* not a zap anyway, shouldn't matter */
        return -1000;
    }
    switch (damgtype) {
        case (2 - 1):
            t = t_at(x, y);
            if (t && t.ttyp == WEB) {
                if (see_it) {
                    await Norep("A web bursts into flames!");
                }
                await delfloortrap(t) , t = null;
                if (see_it) {
                    await newsym(x, y);
                }
            }
            if (is_ice(x, y)) {
                await melt_ice(x, y, null);
            } else if (is_pool(x, y)) {
                let on_water_level = (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))));
                let msggiven = (0);
                let msgtxt = (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "You hear hissing gas." : (type >= 0) ? "That seemed remarkably uneventful." : null;
                if (!on_water_level) {
                    await create_gas_cloud(x, y, rnd(5), 0);
                    if (game.iflags.last_msg == PLNMSG_ENVELOPED_IN_GAS) {
                        msggiven = (1);
                    }
                }
                if (lev.typ != POOL) {
                    /* MOAT or DRAWBRIDGE_UP or WATER */
                    t = null;
                    if (on_water_level) {
                        msgtxt = (see_it || !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "Some water boils." : null;
                    } else if (see_it) {
                        msgtxt = "Some water evaporates.";
                    }
                } else {
                    rangemod -= 3;
                    lev.typ = ROOM , lev.flags = 0;
                    t = await maketrap(x, y, PIT);
                    /*if (t) -- this was before the vapor cloud was added --
                      t->tseen = 1;*/
                    if (see_it) {
                        msgtxt = "The water evaporates.";
                    }
                }
                if (msgtxt && !msggiven) {
                    await Norep("%s", msgtxt);
                }
                if (lev.typ == ROOM) {
                    if ((mon = (game.level.monsters[x][y])) != null) {
                        if ((((mon.data).mflags1 & 2) != 0) && mon.mundetected) {
                            /* POOL changed to ROOM above */
                            /* probably ought to do some hefty damage to any
                       creature caught in boiling water;
                       at a minimum, eels are forced out of hiding */
                            /* probably ought to do some hefty damage to any
                       non-ice creature caught in freezing water;
                       at a minimum, eels are forced out of hiding */
                            mon.mundetected = 0;
                        }
                    }
                    await newsym(x, y);
                    if (t) {
                        /* if water walking/swimming/magical breathing, maybe fall
                       into the new pit (after the water evaporation message);
                       if flying or levitating, nothing will happen */
                        if (((x) == game.u.ux && (y) == game.u.uy)) {
                            await dotrap(t, 0);
                        } else if (mon) {
                            await mintrap(mon, 0);
                        }
                    }
                }
            } else if (((lev.typ) == FOUNTAIN)) {
                await create_gas_cloud(x, y, rnd(3), 0);
                if (see_it) {
                    await pline("Steam billows from the fountain.");
                }
                rangemod -= 1;
                await dryup(x, y, type > 0);
            }
            break;
        case (3 - 1):
            if (is_pool(x, y) || is_lava(x, y) || lavawall) {
                let lava = (is_lava(x, y) || lavawall);
                let moat = is_moat(x, y);
                let chance = ((2) > (5 + game.level.flags.temperature * 10) ? (2) : (5 + game.level.flags.temperature * 10));
                if (((lev.typ) == WATER) || (lavawall && rn2(chance))) {
                    ;
                    if (see_it) {
                        await pline_The("%s freezes for a moment.", hliquid(lavawall ? "lava" : "water"));
                    } else {
                        await You_hear("a soft crackling.");
                    }
                    rangemod -= 1000;
                } else {
                    let buf = '';
                    buf = strcpy(buf, waterbody_name(x, y));
                    rangemod -= 3;
                    if (lev.typ == DRAWBRIDGE_UP) {
                        lev.flags &= ~28;
                        lev.flags |= (lava ? 16 : 8);
                    } else {
                        lev.flags = lava ? 0 : (lev.typ == POOL) ? 8 : 16;
                        if (lavawall) {
                            if ((isok(x, y - 1) && ((game.level.locations[x][y - 1].typ) && (game.level.locations[x][y - 1].typ) <= DBWALL)) || (isok(x, y + 1) && ((game.level.locations[x][y + 1].typ) && (game.level.locations[x][y + 1].typ) <= DBWALL))) {
                                lev.typ = VWALL;
                            } else {
                                lev.typ = HWALL;
                            }
                            await fix_wall_spines(((0) > (x - 1) ? (0) : (x - 1)), ((0) > (y - 1) ? (0) : (y - 1)), ((80 - 1) < (x + 1) ? (80 - 1) : (x + 1)), ((21 - 1) < (y + 1) ? (21 - 1) : (y + 1)));
                        } else {
                            lev.typ = lava ? ROOM : ICE;
                        }
                    }
                    await bury_objs(x, y);
                    if (!lava) {
                        ;
                    }
                    if (see_it) {
                        if (lava) {
                            await Norep("The %s cools and solidifies.", hliquid("lava"));
                        } else if (moat) {
                            await Norep("The %s is bridged with ice!", buf);
                        } else {
                            await Norep("The %s freezes.", hliquid("water"));
                        }
                        await newsym(x, y);
                    } else if (!lava) {
                        await You_hear("a crackling sound.");
                    }
                    if (((x) == game.u.ux && (y) == game.u.uy)) {
                        if (game.u.uinwater) {
                            await set_uinwater(0);
                            game.u.uundetected = 0;
                            await docrt();
                            game.vision_full_recalc = 1;
                        } else if (game.u.utrap && game.u.utraptype == TT_LAVA) {
                            if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
                                await You("pass through the now-solid rock.");
                                await reset_utrap((1));
                            } else {
                                set_utrap((rn2(50) + (20)), TT_INFLOOR);
                                await You("are firmly stuck in the cooling rock.");
                            }
                        }
                    } else if ((mon = (game.level.monsters[x][y])) != null) {
                        if ((((mon.data).mflags1 & 2) != 0) && mon.mundetected) {
                            mon.mundetected = 0;
                            await newsym(x, y);
                        }
                    }
                    if (!lava) {
                        await start_melt_ice_timeout(x, y, 0);
                        await obj_ice_effects(x, y, (1));
                    }
                }
            } else if (is_ice(x, y)) {
                let melt_time = 0;
                if ((melt_time = spot_time_left(x, y, MELT_ICE_AWAY)) != 0) {
                    /* Already ice here, so just firm it up. */
                    /* Now ensure that only ice that is already timed is affected */
                    spot_stop_timers(x, y, MELT_ICE_AWAY);
                    await start_melt_ice_timeout(x, y, melt_time);
                }
            }
            break;
        case (7 - 1):
            if (((lev.typ) >= POOL)) {
                await create_gas_cloud(x, y, 1, 8);
            }
            break;
        case (6 - 1):
            ;
        case (8 - 1):
            if (lev.typ == IRONBARS) {
                /* poison gas with range 1: green dragon/iron golem breath (AD_DRST);
           caller is placing a series of 1x1 clouds along the zap's path;
           <x,y> for wall locations might be included--reject those */
                if (damgtype == (6 - 1) && rn2(10)) {
                    break;
                }
                if ((lev.flags & 8) != 0) {
                    if (see_it) {
                        await Norep("The %s %s somewhat but remain intact.", defsyms[S_bars].explanation, (damgtype == (8 - 1)) ? "corrode" : "melt");
                    }
                } else {
                    rangemod -= 3;
                    if (see_it) {
                        await Norep("The %s %s.", defsyms[S_bars].explanation, (damgtype == (8 - 1)) ? "corrode away" : "melt");
                    }
                    await dissolve_bars(x, y);
                    if (in_rooms(x, y, SHOPBASE)) {
                        await add_damage(x, y, (type >= 0) ? 300 : 0);
                        if (type >= 0) {
                            shopdamage.value = (1);
                        }
                    }
                }
            }
            break;
        default:
            break;
    }
    /* set up zap text for possible door feedback; for exploding wand, we
       want "the blast" rather than "your blast" even if hero caused it */
    yourzap = (type >= 0 && !exploding_wand_typ);
    /* breath attack or wand explosion */
    zapverb = "blast";
    if (!exploding_wand_typ) {
        /* 0..29 for both hero and monsters */
        let ztype = zaptype(type);
        if (ztype < (10 + (0))) {
            zapverb = "bolt";
        } else if (ztype < (20 + (0))) {
            zapverb = "spell";
        }
    } else if (exploding_wand_typ == POT_OIL || exploding_wand_typ == SCR_FIRE) {
        /* breakobj() -> explode_oil() -> splatter_burning_oil()
           -> explode(ZT_SPELL(ZT_FIRE), BURNING_OIL)
           -> zap_over_floor(ZT_SPELL(ZT_FIRE), POT_OIL) */
        /* leave zapverb as "blast"; exploding_wand_typ was nonzero, so
           'yourzap' is FALSE and the result will be "the blast" */
        /* not actually an exploding wand */
        exploding_wand_typ = 0;
    }
    if (game.level.locations[x][y].typ == SDOOR) {
        cvt_sdoor_to_door(game.level.locations[x][y]);
        recalc_block_point(x, y);
        await newsym(x, y);
        if (see_it) {
            await pline("%s %s reveals a secret door.", yourzap ? "Your" : "The", zapverb);
        } else if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
            await draft_message((0));
        }
    }
    if (closed_door(x, y)) {
        /* regular door absorbs remaining zap range, possibly gets destroyed */
        let new_doormask = -1;
        let see_txt = null;
        let sense_txt = null;
        let hear_txt = null;
        rangemod = -1000;
        switch (damgtype) {
            case (2 - 1):
                new_doormask = 0;
                see_txt = "The door is consumed in flames!";
                sense_txt = "smell smoke.";
                break;
            case (3 - 1):
                new_doormask = 0;
                see_txt = "The door freezes and shatters!";
                hear_txt = "a deep cracking sound.";
                break;
            case (5 - 1):
                if (abs(type) != (20 + ((5 - 1)))) {
                    if (exploding_wand_typ > 0) {
                        if (exploding_wand_typ == WAN_STRIKING) {
                            new_doormask = 1;
                            see_txt = "The door crashes open!";
                            sense_txt = "feel a burst of cool air.";
                            break;
                        }
                    }
                    if (see_it) {
                        if (exploding_wand_typ) {
                            await pline_The("door remains intact.");
                        } else {
                            await pline_The("door absorbs %s %s!", yourzap ? "your" : "the", zapverb);
                        }
                    } else {
                        await You_feel("vibrations.");
                    }
                    break;
                }
                new_doormask = 0;
                see_txt = "The door disintegrates!";
                hear_txt = "crashing wood.";
                break;
            case (6 - 1):
                new_doormask = 1;
                see_txt = "The door splinters!";
                hear_txt = "crackling.";
                break;
            default:
                if (exploding_wand_typ > 0) {
                    if (exploding_wand_typ == WAN_STRIKING) {
                        new_doormask = 1;
                        see_txt = "The door crashes open!";
                        sense_txt = "feel a burst of cool air.";
                        break;
                    }
                }
                if (see_it) {
                    if (exploding_wand_typ) {
                        await pline_The("door remains intact.");
                    } else {
                        await pline_The("door absorbs %s %s!", yourzap ? "your" : "the", zapverb);
                    }
                } else {
                    await You_feel("vibrations.");
                }
                break;
        }
        if (new_doormask >= 0) {
            if (in_rooms(x, y, SHOPBASE)) {
                if (type >= 0) {
                    await add_damage(x, y, 400);
                    shopdamage.value = (1);
                } else {
                    await add_damage(x, y, 0);
                }
            }
            lev.flags = new_doormask;
            recalc_block_point(x, y);
            if (see_it) {
                await pline("%s", see_txt);
                await newsym(x, y);
            } else if (sense_txt) {
                await You("%s", sense_txt);
            } else if (hear_txt) {
                await You_hear("%s", hear_txt);
            }
            if (picking_at(x, y)) {
                await stop_occupation();
                reset_pick();
            }
        }
    }
    if ((game.level.objects[x][y] != null) && damgtype == (2 - 1)) {
        if (await burn_floor_objects(x, y, (0), type > 0) && ((game.viz_array[y][x] & 1) != 0)) {
            await newsym(x, y);
            await You("%s of smoke.", !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "see a puff" : "smell a whiff");
        }
    }
    if (!ignoremon && (mon = (game.level.monsters[x][y])) != null) {
        await wakeup(mon, (type >= 0) ? (1) : (0));
    }
    return rangemod;
}
/* monster has cast flames or frost at target on <x,y>; called by mcastu() */
/* canonical damage type */
/* so far, only used for targeting <u.ux,u.uy> */
export async function mon_spell_hits_spot(caster, adtyp, x, y) {
    if (adtyp == 1 || adtyp == 8) {
        /* "shower of missiles" or [hypothetical] "acid rain" attack:
       thoroughly clobber an engraving (unless its type makes it be
       scuff-protected); zap_over_floor() doesn't handle this */
        let ep = engr_at(x, y);
        let etext = ep ? ep.engr_txt[actual_text] : null;
        if (etext) {
            await wipe_engr_at(x, y, strlen(etext) + d(6, 6), (1));
        }
    }
    if (adtyp >= 1 && adtyp <= 8) {
        /* hit items and/or terrain; only matters for AD_FIRE and AD_COLD but
       accept any basic damage type that zap_over_floor() might handle */
        /* zap_over_floor() requires this even
                                    * though it's only used when zapdmgtyp
                                    * is non-negative (hero's fault) */
        let shopdummy = (0);
        /* convert AD_xxxx to ZT_xxxx */
        let zt_typ = adtyp - 1;
        let zapdmgtyp = -(10 + (zt_typ));
        await zap_over_floor(x, y, zapdmgtyp, { get value() { return shopdummy; }, set value(_v) { shopdummy = _v; } }, (1), 0);
    } else {
        await impossible("Unsupported damage type (%d) for mon_spell_hits_spot.", adtyp);
    }
}
/* fractured by pick-axe or wand of striking or by vault guard or shopkeeper */
/* no texts here! */
export async function fracture_rock(obj) {
    let x = 0;
    let y = 0;
    let by_you = !game.context.mon_moving;
    if (by_you && get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0) && await costly_spot(x, y)) {
        let shkp = null;
        let objroom = in_rooms(x, y, SHOPBASE);
        if (await billable({ get value() { return shkp; }, set value(_v) { shkp = _v; } }, obj, objroom, (0))) {
            await You("fracture %s %s.", s_suffix(await shkname(shkp)), await xname(obj));
            await breakobj(obj, x, y, (1), (0));
        }
    }
    if (by_you && obj.otyp == BOULDER) {
        sokoban_guilt();
    }
    obj.otyp = ROCK;
    obj.oclass = GEM_CLASS;
    obj.quan = (rn2(60) + (7));
    obj.owt = await weight(obj);
    obj.dknown = obj.bknown = obj.rknown = 0;
    obj.known = game.objects[obj.otyp].oc_uses_known ? 0 : 1;
    dealloc_oextra(obj);
    if (obj.where == 1) {
        await obj_extract_self(obj);
        await place_object(obj, obj.ox, obj.oy);
        if (!does_block(obj.ox, obj.oy, game.level.locations[obj.ox][obj.oy])) {
            unblock_point(obj.ox, obj.oy);
            await vision_recalc(0);
        }
        if (((game.viz_array[obj.oy][obj.ox] & 2) != 0)) {
            await newsym(obj.ox, obj.oy);
        }
    }
}
/* handle statue hit by striking/force bolt/pick-axe */
export async function break_statue(obj) {
    /* [obj is assumed to be on floor, so no get_obj_location() needed] */
    let trap = t_at(obj.ox, obj.oy);
    let item = null;
    let by_you = !game.context.mon_moving;
    if (trap && trap.ttyp == STATUE_TRAP && await activate_statue_trap(trap, obj.ox, obj.oy, (1))) {
        return (0);
    }
    while ((item = obj.cobj) != null) {
        await obj_extract_self(item);
        await place_object(item, obj.ox, obj.oy);
    }
    if (by_you && (game.urole.mnum == (PM_ARCHEOLOGIST)) && (obj.spe & 4)) {
        await You_feel("guilty about damaging such a historic statue.");
        adjalign(-1);
    }
    obj.spe = 0;
    await fracture_rock(obj);
    return (1);
}
/* Return TRUE if obj is eligible to pass to maybe_destroy_item given
 * the type of elemental damage it's being subjected to.
 * Note that things like the Book of the Dead are eligible even though they
 * won't get destroyed, because it will attempt to be destroyed but print a
 * special message instead. */
export function destroyable(obj, adtyp) {
    if (obj.oartifact) {
        return (0);
    }
    if (obj.in_use && obj.quan == 1) {
        return (0);
    }
    if (adtyp == 2) {
        if (obj.otyp == SCR_FIRE || obj.otyp == SPE_FIREBALL) {
            return (0);
        }
        if (obj.otyp == GLOB_OF_GREEN_SLIME || obj.oclass == POTION_CLASS || obj.oclass == SCROLL_CLASS || obj.oclass == SPBOOK_CLASS) {
            return (1);
        }
    } else if (adtyp == 3) {
        if (obj.oclass == POTION_CLASS && obj.otyp != POT_OIL) {
            return (1);
        }
    } else if (adtyp == 6) {
        if (obj.oclass != RING_CLASS && obj.oclass != WAND_CLASS) {
            return (0);
        }
        /* There used to be a commented out bit of code that would exclude
         * gc.current_wand, but it wasn't used, so it wasn't moved into this
         * function. */
        if (obj.otyp != RIN_SHOCK_RESISTANCE && obj.otyp != WAN_LIGHTNING) {
            return (1);
        }
    }
    return (0);
}
/* convert attack damage AD_foo to property resistance */
export function adtyp_to_prop(dmgtyp) {
    switch (dmgtyp) {
        case 3:
            return COLD_RES;
        case 2:
            return FIRE_RES;
        case 6:
            return SHOCK_RES;
        case 8:
            return ACID_RES;
        case 5:
            return DISINT_RES;
        default:
            break;
    }
    return 0;
}
/* Is hero wearing or wielding an object with resistance to attack
   damage type? Returns the percentage protection that the object gives. */
export function u_adtyp_resistance_obj(dmgtyp) {
    let prop = adtyp_to_prop(dmgtyp);
    if (!prop) {
        return 0;
    }
    /* FIXME? these percentages (99 and 90) seem too high... */
    /* items that give an extrinsic resistance when worn or wielded or
       carried give 99% protection to your items */
    if ((game.u.uprops[prop].extrinsic & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288) | 256 | 4096)) != 0) {
        return 99;
    }
    /* worn dwarvish cloaks give 90% protection against heat and cold to
       carried items */
    if (game.uarmc && game.uarmc.otyp == DWARVISH_CLOAK && (dmgtyp == 3 || dmgtyp == 2)) {
        return 90;
    }
    return 0;
}
/* Rolls to see whether an object in inventory resists damage from the
   given damage type, due to an equipped item protecting it. Use
   u_adtyp_resistance_obj to discover whether objects are protected in
   general (e.g. for enlightenment) and this function to actually do
   the roll to see whether a specific object is protected.

   This function doesn't check for other reasons why an object might
   be protected; you will usually need to do an obj_resists() call
   too. */
export function inventory_resistance_check(dmgtyp) {
    let prob = u_adtyp_resistance_obj(dmgtyp);
    if (!prob) {
        return (0);
    }
    return rn2(100) < prob;
}
/* for enlightenment; currently only useful in wizard mode; cf from_what() */
let __item_what_whatbuf = '';
__nh_register_static(() => { __item_what_whatbuf = ''; });
export async function item_what(dmgtyp) {
    let what = null;
    let prop = adtyp_to_prop(dmgtyp);
    let xtrinsic = game.u.uprops[prop].extrinsic;
    __item_what_whatbuf = '';
    if (game.flags.debug) {
        if (!prop || !xtrinsic) {
            ;
        } else if (xtrinsic & 2) {
            what = cloak_simple_name(game.uarmc);
        } else if (xtrinsic & 1) {
            what = suit_simple_name(game.uarm);
        } else if (xtrinsic & 64) {
            what = shirt_simple_name(game.uarmu);
        } else if (xtrinsic & 4) {
            what = helm_simple_name(game.uarmh);
        } else if (xtrinsic & 16) {
            what = gloves_simple_name(game.uarmg);
        } else if (xtrinsic & 32) {
            what = boots_simple_name(game.uarmf);
        } else if (xtrinsic & 8) {
            what = shield_simple_name(game.uarms);
        } else if (xtrinsic & (65536 | 524288)) {
            what = await simpleonames((xtrinsic & 65536) ? game.uamul : game.ublindf);
        } else if (xtrinsic & (131072 | 262144)) {
            if ((xtrinsic & (131072 | 262144)) == (131072 | 262144)) {
                what = "rings";
            } else {
                what = await simpleonames((xtrinsic & 131072) ? game.uleft : game.uright);
            }
        } else if (xtrinsic & 256) {
            what = await simpleonames(game.uwep);
        }
        /* format the output to be ready for enl_msg() to append it to
           "Your items {are,were} protected against <damage-type>" */
        /* strlen(what) will be less than 30 */
        if (what) {
            __item_what_whatbuf = sprintf(__item_what_whatbuf, " by your %.40s", what);
        }
    }
    return __item_what_whatbuf;
}
/*
 * destroy_strings[dindx][0:singular,1:plural,2:killer_reason]
 *      [0] freezing potion
 *      [1] boiling potion other than oil
 *      [2] boiling potion of oil
 *      [3] burning scroll
 *      [4] burning spellbook
 *      [5] shocked ring
 *      [6] shocked wand
 * (books, rings, and wands don't stack so don't need plural form;
 *  crumbling ring doesn't do damage so doesn't need killer reason)
 * externally referenced from trap.c.
 */
export const destroy_strings = [["freezes and shatters", "freeze and shatter", "shattered potion"], ["boils and explodes", "boil and explode", "boiling potion"], ["ignites and explodes", "ignite and explode", "exploding potion"], ["catches fire and burns", "catch fire and burn", "burning scroll"], ["catches fire and burns", "", "burning book"], ["turns to dust and vanishes", "", ""], ["breaks apart and explodes", "", "exploding wand"]];
/* also used in trap.c */
/* guts of destroy_items();
   caller must decide whether obj is eligible, though there's one case (Book
   of the Dead) in which an eligible item shouldn't be destroyed (it prints a
   special message instead).
   Returns the amount of damage done, but it's used differently depending on
   whether it's the player or a monster having an item destroyed: players lose
   the HP and possibly die in this function, and the return value is unused,
   whereas monsters return the damage to their caller to be taken off later */
export async function maybe_destroy_item(carrier, obj, dmgtyp) {
    let i = 0;
    let cnt = 0;
    let quan = 0;
    let dmg = 0;
    let xresist = 0;
    let skip = 0;
    let dindx = 0;
    let mult = null;
    let u_carry = (carrier == game.youmonst);
    let vis = !u_carry && canseemon(carrier);
    let chargeit = (0);
    xresist = skip = 0;
    dmg = dindx = 0;
    quan = 0;
    /* external worn item protects inventory? */
    if (u_carry && inventory_resistance_check(dmgtyp)) {
        return 0;
    }
    switch (dmgtyp) {
        case 3:
            quan = obj.quan;
            dindx = 0;
            dmg = rnd(4);
            break;
        case 2:
            xresist = (obj.oclass != POTION_CLASS && obj.otyp != GLOB_OF_GREEN_SLIME && (u_carry ? (game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) : await Resists_Elem(carrier, FIRE_RES)));
            if (obj.otyp == SPE_BOOK_OF_THE_DEAD) {
                skip = 1;
                if (u_carry ? !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) : vis) {
                    await pline("%s glows a strange %s, but remains intact.", await The(u_carry ? await xname(obj) : await distant_name(obj, xname)), hcolor("dark red"));
                }
                break;
            }
            quan = obj.quan;
            switch (obj.oclass) {
                case POTION_CLASS:
                    dindx = (obj.otyp != POT_OIL) ? 1 : 2;
                    dmg = rnd(6);
                    break;
                case SCROLL_CLASS:
                    dindx = 3;
                    dmg = 1;
                    break;
                case SPBOOK_CLASS:
                    dindx = 4;
                    dmg = 1;
                    break;
                /* only GLOB_OF_GREEN_SLIME */
                case FOOD_CLASS:
                    dindx = 1;
                    dmg = Math.trunc((obj.owt + 19) / 20);
                    break;
            }
            break;
        case 6:
            xresist = (obj.oclass != RING_CLASS && (u_carry ? (game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic) : await Resists_Elem(carrier, SHOCK_RES)));
            quan = obj.quan;
            switch (obj.oclass) {
                case RING_CLASS:
                    if (((obj.owornmask & (131072 | 262144)) && game.uarmg && !(game.objects[game.uarmg.otyp].oc_material >= IRON && game.objects[game.uarmg.otyp].oc_material <= MITHRIL)) || obj.otyp == RIN_SHOCK_RESISTANCE) {
                        skip++;
                        break;
                    } else if (game.objects[obj.otyp].oc_charged && rn2(3)) {
                        chargeit = (1);
                        break;
                    }
                    dindx = 5;
                    dmg = 0;
                    break;
                case WAND_CLASS:
                    dindx = 6;
                    dmg = rnd(10);
                    break;
            }
            break;
        default:
            skip = 1;
            await impossible("maybe_destroy_item with unexpected dmgtyp %d", dmgtyp);
            break;
    }
    if (chargeit) {
        if (u_carry) {
            await recharge(obj, 0);
        }
    } else if (!skip) {
        /* for checking glob of slime after it's
                                       destroyed */
        let osym = obj.oclass;
        if (obj.in_use) {
            --quan;
        }
        /* one will be used up elsewhere */
        for (i = cnt = 0; i < quan; i++) {
            if (!rn2(3)) {
                cnt++;
            }
        }
        if (!cnt) {
            return 0;
        }
        if (u_carry || vis) {
            mult = (cnt == 1) ? ((quan == 1) ? "" : "One of ") : ((cnt < quan) ? "Some of " : (quan == 2) ? "Both of " : "All of ");
            await pline("%s%s %s!", mult, (cnt == 1 && quan == 1) ? await Yname2(obj) : await yname(obj), destroy_strings[dindx][(cnt > 1)]);
        }
        if (u_carry) {
            if (osym == POTION_CLASS && dmgtyp != 3 && (!(((game.youmonst.data).mflags1 & 1024) != 0) || (((game.youmonst.data).mflags1 & 4096) == 0))) {
                await potionbreathe(obj);
            }
            if (obj.owornmask) {
                if (obj.owornmask & (131072 | 262144)) {
                    await Ring_gone(obj);
                } else {
                    await setnotworn(obj);
                }
            }
            if (obj == game.current_wand) {
                game.current_wand = null;
            }
        }
        for (i = 0; i < cnt; i++) {
            if (u_carry) {
                await useup(obj);
            } else {
                await m_useup(carrier, obj);
            }
        }
        if (dmg) {
            if (!u_carry) {
                return xresist ? 0 : dmg;
            }
            if (xresist) {
                await You("aren't hurt!");
            } else {
                let how = destroy_strings[dindx][2];
                let one = (cnt == 1);
                if (dmgtyp == 2 && osym == FOOD_CLASS) {
                    how = "exploding glob of slime";
                }
                await losehp(dmg, one ? how : await makeplural(how), one ? 0 : 1);
                await exercise(A_STR, (0));
            }
        }
    }
    return dmg;
}
/* scaling factor; dmg/5 stacks will be subjected to destroy_items() */
/* largest amount of stacks that will be destroyed in a single call */
/* target items of specified class in mon's inventory for possible destruction
   return total amount of damage inflicted, though this is unused if mon is
   the player */
/* monster whose invent is being subjected to
                        * destruction */
/* AD_**** - currently only cold, fire, elec */
/* the amount of HP damage the attack dealt */
export async function destroy_items(mon, dmgtyp, dmg_in) {
    let obj = null;
    let i = 0;
    let defer = 0;
    /* max amount of item stacks destroyed, based on damage */
    let limit = 0;
    let items_to_destroy = [{ oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }, { oid: 0, otmp: null, deferred: 0 }];
    /* number of destroyable objects found so far */
    let elig_stacks = 0;
    let u_carry = (mon == game.youmonst);
    /* this is a struct obj** because we might destroy the first item in it */
    let objchn__parent = (u_carry) ? game : mon; let objchn__field = (u_carry) ? "invent" : "minvent";
    /* damage caused by items getting destroyed */
    let dmg_out = 0;
    let where = 10;
    for (i = 0; i < 20; ++i) {
        /* initialize items_to_destroy */
        /* 0 should not be a valid o_id for anything */
        items_to_destroy[i].oid = 0;
        items_to_destroy[i].otmp = null;
        items_to_destroy[i].deferred = (0);
    }
    /* don't straight up destroy all items with an equal chance; limit it
       based on the amount of damage being dealt by the source of the item
       destruction */
    limit = Math.trunc(dmg_in / 5);
    if (dmg_in % 5 > rn2(5)) {
        /* dmg = 9: 20% chance of limit=1, 80% of limit=2, etc */
        limit++;
    }
    if (limit > 20) {
        /* in case of incredibly high damage, prevent from overflowing
         * items_to_destroy */
        limit = 20;
    }
    if (limit < 1) {
        return 0;
    }
    /* Sometimes destroying an item can change inventory aside from
     * the item itself (cited case was a potion of unholy water; when
     * boiled, potionbreathe() caused hero to transform into were-beast
     * form and that resulted in dropping or destroying some worn armor).
     *
     * Unlike other uses of the object bypass mechanism, destroy_items()
     * can be called multiple times for the same event.  So we have to
     * explicitly clear it before each use and hope no other section of
     * code expects it to retain previous value.
     *
     * Destruction of a ring of levitation or form change which pushes
     * off levitation boots could drop hero onto a fire trap that
     * could destroy other items and we'll get called recursively.  Or
     * onto a trap which transports hero elsewhere, which won't disrupt
     * traversal but could yield message sequencing issues.  So we
     * defer handling such things until after rest of inventory has
     * been processed.  If some other combination of items and events
     * triggers a recursive call, rest of inventory after the triggering
     * item will be skipped by the outer call since the inner one will
     * have set the bypass bits of the whole list.
     *
     * [Unfortunately, death while poly'd into flyer and subsequent
     * rehumanization could also drop hero onto a trap, and there's no
     * straightforward way to defer that.  Things could be improved by
     * redoing this to use two passes, first to collect a list or array
     * of o_id and quantity of what is targeted for destruction,
     * second pass to handle the destruction.]
     */
    /* clear bypass bit for invent */
    /* almost certainly not everything was destroyed; clear bypass bit after
       it was set earlier */
    bypass_objlist(objchn__parent[objchn__field], (0));
    while ((obj = nxt_unbypassed_obj(objchn__parent[objchn__field])) != null) {
        if (!destroyable(obj, dmgtyp)) {
            continue;
        }
        /* this dmg type can't destroy this obj */
        /* obj is eligible; maybe add it to items_to_destroy */
        i = (elig_stacks < limit) ? elig_stacks : rn2(elig_stacks);
        /* do this afterwards to avoid not filling items_to_destroy[0] */
        elig_stacks++;
        if (i < 0 || i >= limit) {
            continue;
        }
        items_to_destroy[i].oid = obj.o_id;
        items_to_destroy[i].otmp = obj;
        if (where == 10) {
            where = obj.where;
        } else if (where != obj.where) {
            await impossible("destroy_item: items in multiple chains");
        }
        if (u_carry && ((obj.owornmask != 0 && (game.objects[obj.otyp].oc_oprop == LEVITATION || game.objects[obj.otyp].oc_oprop == FLYING)) || (obj.otyp == POT_WATER && ((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS) && ((game.u.umonnum != game.u.umonster) ? obj.blessed : obj.cursed)))) {
            /* if loss of this item might dump us onto a trap, hold off
           until later because potential recursive destroy_items() will
           result in setting bypass bits on whole chain--we would skip
           the rest as already processed once control returns here */
            /* destroyed wands and potions of polymorph don't trigger
                   polymorph so don't need to be deferred */
            items_to_destroy[i].deferred = (1);
        } else {
            items_to_destroy[i].deferred = (0);
        }
    }
    if (elig_stacks > limit) {
        /* so we can loop up to elig_stacks */
        elig_stacks = limit;
    }
    for (defer = 0; defer <= 1; ++defer) {
        for (i = 0; i < elig_stacks; ++i) {
            /* if we saved some items for later (most likely just a worn ring
           of levitation) and they're still in inventory, handle them on the
           second iteration of the loop */
            obj = items_to_destroy[i].otmp;
            if (obj && obj.o_id == items_to_destroy[i].oid && obj.where == where && (items_to_destroy[i].deferred == (defer == 1))) {
                dmg_out += await maybe_destroy_item(mon, obj, dmgtyp);
                items_to_destroy[i].otmp = null;
            }
        }
    }
    bypass_objlist(objchn__parent[objchn__field], (0));
    return dmg_out;
}
export async function resist(mtmp, oclass, damage, tell) {
    let resisted = 0;
    let alev = 0;
    let dlev = 0;
    /* fake players always pass resistance test against Conflict
       (this doesn't guarantee that they're never affected by it) */
    if (oclass == RING_CLASS && !damage && !tell && (((mtmp.data).pmidx >= PM_ARCHEOLOGIST) && ((mtmp.data).pmidx <= PM_WIZARD))) {
        return 1;
    }
    switch (oclass) {
        case WAND_CLASS:
            alev = 12;
            break;
        case TOOL_CLASS:
            alev = 10;
            break;
        case WEAPON_CLASS:
            alev = 10;
            break;
        case SCROLL_CLASS:
            alev = 9;
            break;
        case POTION_CLASS:
            alev = 6;
            break;
        case RING_CLASS:
            alev = 5;
            break;
        default:
            alev = game.u.ulevel;
            break;
    }
    dlev = mtmp.m_lev;
    if (dlev > 50) {
        dlev = 50;
    } else if (dlev < 1) {
        dlev = (((mtmp.data).pmidx >= PM_ARCHEOLOGIST) && ((mtmp.data).pmidx <= PM_WIZARD)) ? game.u.ulevel : 1;
    }
    resisted = rn2(100 + alev - dlev) < mtmp.data.mr;
    if (resisted) {
        if (tell) {
            await shieldeff_mon(mtmp);
        }
        damage = Math.trunc((damage + 1) / 2);
    }
    if (damage) {
        mtmp.mhp -= damage;
        if (((mtmp).mhp < 1)) {
            if (game.m_using) {
                await monkilled(mtmp, "", 242);
            } else {
                await killed(mtmp);
            }
        }
    }
    return resisted;
}
const __wishcmdassist_wishinfo = ["Wish details:", "", "Enter the name of an object, such as \"potion of monster detection\",", "\"scroll labeled README\", \"elven mithril-coat\", or \"Grimtooth\"", "(without the quotes).", "", "For object types which come in stacks, you may specify a plural name", "such as \"potions of healing\", or specify a count, such as \"1000 gold", "pieces\", although that aspect of your wish might not be granted.", "", "You may also specify various prefix values which might be used to", "modify the item, such as \"uncursed\" or \"rustproof\" or \"+1\".", "Most modifiers shown when viewing your inventory can be specified.", "", "You may specify 'nothing' to explicitly decline this wish.", null];
const __wishcmdassist_preserve_wishless = "Doing so will preserve 'wishless' conduct.";
const __wishcmdassist_retry_info = "If you specify an unrecognized object name %s%s time%s,";
const __wishcmdassist_retry_too = "a randomly chosen item will be granted.";
const __wishcmdassist_suppress_cmdassist = "(Suppress this assistance with !cmdassist in your config file.)";
const __wishcmdassist_cardinals = ["zero", "one", "two", "three", "four", "five"];
const __wishcmdassist_too_many = "too many";
export async function wishcmdassist(triesleft) {
    let i = 0;
    let win = 0;
    let buf = '';
    win = (game.windowprocs.win_create_nhwindow)(5);
    if (!win) {
        return;
    }
    for (i = 0; i < (Math.trunc(128 /* sizeof(const char *[16]) */ / 8 /* sizeof(const char *) */)) - 1; ++i) {
        (game.windowprocs.win_putstr)(win, 0, __wishcmdassist_wishinfo[i]);
    }
    if (!game.u.uconduct.wishes) {
        (game.windowprocs.win_putstr)(win, 0, __wishcmdassist_preserve_wishless);
    }
    (game.windowprocs.win_putstr)(win, 0, "");
    buf = sprintf(buf, __wishcmdassist_retry_info, (triesleft >= 0 && triesleft < (Math.trunc(48 /* sizeof(const char *[6]) */ / 8 /* sizeof(const char *) */))) ? __wishcmdassist_cardinals[triesleft] : __wishcmdassist_too_many, (triesleft < 5) ? " more" : "", (((triesleft) == 1) ? "" : "s"));
    (game.windowprocs.win_putstr)(win, 0, buf);
    (game.windowprocs.win_putstr)(win, 0, __wishcmdassist_retry_too);
    (game.windowprocs.win_putstr)(win, 0, "");
    if (game.iflags.cmdassist) {
        (game.windowprocs.win_putstr)(win, 0, __wishcmdassist_suppress_cmdassist);
    }
    await (game.windowprocs.win_display_nhwindow)(win, (1));
    (game.windowprocs.win_destroy_nhwindow)(win);
}
game.wish_history = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
game.wish_history_idx = 0;
/* add string to wish history list */
export function wish_history_add(buf) {
    let i = 0;
    if (!game.flags.debug) {
        return;
    }
    for (i = 0; i < 20; i++) {
        let idx = (game.wish_history_idx + i) % 20;
        if (!game.wish_history[idx]) {
            continue;
        }
        if (!strncmpi(game.wish_history[idx], buf, strlen(game.wish_history[idx]))) {
            break;
        }
    }
    if (i == 20) {
        let idx = (game.wish_history_idx + i) % 20;
        if (game.wish_history[idx]) {
            free(game.wish_history[idx]);
        }
        game.wish_history[idx] = alloc(strlen(buf) + 1);
        game.wish_history[idx] = strcpy(game.wish_history[idx], buf);
        game.wish_history_idx = (game.wish_history_idx + 1) % 20;
    }
}
/* release any old wish text; called from freedynamicdata(save.c) */
export function wish_history_flush() {
    let idx = 0;
    for (idx = 0; idx < 20; ++idx) {
        if (game.wish_history[idx]) {
            free(game.wish_history[idx]) , game.wish_history[idx] = null;
        }
    }
    game.wish_history_idx = 0;
}
/* shows menu of previous wishes, copies selected into buf, max BUFSZ len.
   buf is not modified, if nothing was selected. */
export async function wish_history_menu(buf) {
    let win = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let npick = 0;
    let picks = null;
    let idx = 0;
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    Object.assign(any, cg.zeroany);
    for (i = 20 - 1; i >= 0; i--) {
        idx = (game.wish_history_idx + i) % 20;
        if (game.wish_history[idx]) {
            any.a_int = (i + 1);
            await add_menu(win, nul_glyphinfo, any, 0, 0, 0, 8, game.wish_history[idx], 0);
        }
    }
    (game.windowprocs.win_end_menu)(win, "Wish what?");
    npick = await select_menu(win, 1, picks);
    (game.windowprocs.win_destroy_nhwindow)(win);
    if (npick > 0) {
        i = picks.item.a_int;
        i--;
        idx = (game.wish_history_idx + i) % 20;
        if (game.wish_history[idx]) {
            buf = strcpy(buf, game.wish_history[idx]);
        }
    }
}
export async function makewish() {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let bufcpy = '';
    let wish = '';
    let promptbuf = '';
    let otmp = null;
    let nothing = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let maybe_LL_arti = 0;
    let tries = 0;
    let oldwisharti = game.u.uconduct.wisharti;
    game.context.resume_wish = 0;
    promptbuf = '';
    /* lint suppression; only its address matters */
    Object.assign(nothing, cg.zeroobj);
    if (game.flags.verbose) {
        await You("may wish for an object.");
    }
    retry: while (true) {
        promptbuf = strcpy(promptbuf, "For what do you wish");
        if (game.iflags.cmdassist && tries > 0) {
            promptbuf = strcat(promptbuf, " (enter 'help' for assistance)");
        }
        promptbuf = strcat(promptbuf, "?");
        if (game.iflags.menu_requested && game.wish_history[0] && (tries == 0)) {
            await wish_history_menu(buf);
        } else {
            buf = await getlin(promptbuf, buf);
        }
        if (game.iflags.term_gone) {
            if (!game.iflags.debug_fuzzer) {
                game.context.resume_wish = 1;
            }
            return;
        }
        buf = mungspaces(buf);
        if (buf[0] == 27) {
            buf[0] = 0;
        } else if (!strncmpi((buf), ("help"), -1)) {
            await wishcmdassist(5 - tries);
            buf[0] = 0;
            continue retry;
        }
        /*
     *  Note: if they wished for and got a non-object successfully,
     *  otmp == &hands_obj.  That includes an artifact which has been
     *  denied. Wishing for "nothing" requires a separate value to remain
     *  distinct.
     */
        bufcpy = strcpy(bufcpy, buf);
        otmp = await readobjnam(buf, nothing);
        if (!otmp) {
            await pline("Nothing fitting that description exists in the game.");
            if (++tries < 5) {
                continue retry;
            }
            await pline("%s", c_common_strings.c_thats_enough_tries);
            otmp = await readobjnam(null, null);
            if (!otmp) {
                return;
            }
        } else if (otmp == nothing) {
            /* for safety; should never happen */
            /* explicitly wished for "nothing", presumably attempting
           to retain wishless conduct */
            livelog_printf(1, "declined to make a wish");
            return;
        } else if (otmp == game.hands_obj) {
            wish_history_add(bufcpy);
            return;
        }
        wish_history_add(bufcpy);
        if (otmp.oartifact) {
            await artifact_origin(otmp, 4 | 256);
        }
        /* wisharti conduct handled in readobjnam() */
        maybe_LL_arti = ((oldwisharti < game.u.uconduct.wisharti) ? 64 : 0);
        wish = nh_snprintf("makewish", 6388, wish, 256 /* sizeof(char [256]) */, "\"%s\", got \"%s\"", bufcpy, await doname(otmp));
        if (!game.u.uconduct.wishes++) {
            livelog_printf((32 | 1 | maybe_LL_arti), "made %s first wish - %s", (genders[game.flags.female ? 1 : 0].his), wish);
        } else if (!oldwisharti && game.u.uconduct.wisharti) {
            livelog_printf((32 | 1 | 64), "made %s first artifact wish - %s", (genders[game.flags.female ? 1 : 0].his), wish);
        } else {
            livelog_printf((1 | maybe_LL_arti), "wished for %s", wish);
        }
        /* TODO? maybe generate a second event describing what was received since
       these just echo player's request rather than show actual result */
        if (otmp.otyp == CORPSE && !u_safe_from_fatal_corpse(otmp, st_all)) {
            otmp.usecount = 1;
        }
        let verb = (((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || game.u.uinwater) ? "slip" : (otmp.otyp == CORPSE && otmp.usecount) ? "materialize" : "drop");
        let oops_msg = (game.u.uswallow ? "Oops!  %s out of your reach!" : ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || game.level.locations[game.u.ux][game.u.uy].typ < IRONBARS || game.level.locations[game.u.ux][game.u.uy].typ >= ICE) ? "Oops!  %s away from you!" : !(otmp.otyp == CORPSE && otmp.usecount) ? "Oops!  %s to the floor!" : "Careful! %s on the floor!");
        await hold_another_object(otmp, oops_msg, await The(await aobjnam(otmp, verb)), null);
        game.u.ublesscnt += (rn2(100) + (50));
        break;
    }
}
/* Fills buf with the appropriate string for this ray.
 * In the hallucination case, insert "blast of <silly thing>".
 * Assumes that the caller will specify typ in the appropriate range for
 * wand/spell/breath weapon. */
/* suppress hallucination (for death reasons) */
let __flash_str_fltxt = '';
__nh_register_static(() => { __flash_str_fltxt = ''; });
export function flash_str(typ, nohallu) {
    typ = zaptype(typ);
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !nohallu) {
        __flash_str_fltxt = sprintf(__flash_str_fltxt, "blast of %s", rnd_hallublast());
    } else {
        __flash_str_fltxt = strcpy(__flash_str_fltxt, flash_types[typ]);
    }
    return __flash_str_fltxt;
}
/*zap.c*/
/* For a wand (or wand-like tool) zapped by the player, if the
       effect was observable (determined by caller; usually seen, but
       possibly heard or felt if the hero is blinded) then discover the
       object type provided that the object itself is known (as more
       than just "a wand").  If object type is already discovered and
       we observed the effect, mark the individual wand as having been
       seen.  Suppress spells (which use fake spellbook object for `obj')
       so that casting a spell won't re-discover its forgotten book. */
/* if type already discovered, treat this item has having been seen
           even if hero is currently blinded (skips redundant makeknown) */
/* will usually be dknown already */
/* otherwise discover it if item itself has been or can be seen */
/* make the discovery iff we know what we're manipulating */
/* 5.0: used to 'break' to avoid setting learn_it here */
/* if a long worm has mcorpsenm set, it was polymorphed by
               the current zap and shouldn't be affected if hit again */
/* magic resistance protects from polymorph traps, so make
               it guard against involuntary polymorph attacks too... */
/* natural shapechangers aren't affected by system shock
               (unless protection from shapechangers is interfering
               with their metabolism...) */
/* svc.context.bypasses = TRUE; ## for make_corpse() */
/* no corpse after system shock */
/* format monster's name before altering its visibility */
/* keep the immediate effects of make invisible and teleportation
               ambiguous by using the same message that's used if we
               teleported mtmp (and it ended up somewhere you can't see) */
/* zapping either holder/holdee or self [zapyourself()] will
               release hero from holder's grasp or holdee from hero's grasp */
/* Pestilence will always resist; damage is half of (healamt/2) */
/* [wakeup() doesn't rouse victims of temporary sleep,
           so it's okay to leave `wake' set to TRUE here;
           revealing concealed mimic is handled by sleep_monst()] */
/* before possible polymorph */
/* die if already level 0, regardless of hit points */
/* seemimic() is done by wakeup() and might unblock vision */
/* if effect was observable then discover the wand type provided
       that the wand itself has been seen */
/* possible for sticky hero to be swallowed */
/* gives "you get regurgitated" or "you get expelled from <mon>" */
/* order matters if 'holding' status condition is enabled;
           set_ustuck() will set flag for botl update, You() pline will
           trigger a status update with "UHold" removed */
/* don't show minvent for long worm tail */
/* in case mtmp2 is a long worm; saved traits for
                               long worm don't include tail segments so don't
                               give mtmp any; it will be given a new 'wormno'
                               though (unless those are exhausted) so be able
                               to grow new tail segments */
/* mtmp2 is a copy of obj's object->oextra->omonst extension
               and is not on the map or on any monst lists */
/* in case Protection_from_shape_changers is different
           now than it was when the traits were stored */
/* if this corpse is being eaten, stop doing that; this should be done
       after makemon() succeeds and skipped if it fails, but waiting until
       we know the result for that would be too late */
/* Rules for revival from containers:
         *  - the container cannot be locked
         *  - the container cannot be heavily nested (>2 is arbitrary)
         *  - the container cannot be a statue or bag of holding
         *    (except in very rare cases for the latter)
         */
/* if buried zombie cannot dig itself out, do not revive */
/* [should probably handle recorporealization first; if corpse and
       ghost are at same location, revived creature shouldn't be bumped
       to an adjacent spot by ghost which joins with it] */
/* make a zombie or doppelganger instead */
/* note: montype has changed; mptr keeps old value for newcham() */
/* change shape to match the corpse */
/* shk_your: "the " or "your " or "<mon>'s " or "<Shk>'s ".
               If the result is "Shk's " then it will be ambiguous:
               is Shk the mon carrying it, or does Shk's shop own it?
               Let's not worry about that... */
/* need some prior description of the corpse since
               stolen_value() will refer to the object as "it" */
/* don't charge for shopkeeper's own corpse if we just revived him */
/* [we don't give any comparable message about the corpse for
           the !by_hero case because caller might have already done so] */
/* transfer the ghost's inventory along with it */
/* separate ghost monster no longer exists */
/* partially eaten corpse yields wounded monster */
/* not useupf(), which charges;
           delobj() won't use up a Rider's corpse, delobj_core(,TRUE) will */
/* obj_extract_self() will update corpse->ocontainer->owt */
/* save the name; the object is liable to go away */
/* shk_your/Shk_Your produces a value with a trailing space */
/* hit carried corpses and eggs */
/* can't cancel cancellation */
/* cancelling doesn't remove djinni */
/* cancelling a novel is more involved than a spellbook */
/* a blank spellbook weighs more than a novel; update obj's weight and
       recursively the weight of any container holding it */
/* Charge for the cost of the object */
/* appropriately add damage to bill */
/* there is no flesh type, but all food is type 0, so we use it */
/* if quan > 1 then some will survive intact */
/* literally replace obj with this new thing */
/*
         * We may need to do extra adjustments for the hero if we're
         * messing with the hero's inventory.  The following calls are
         * equivalent to calling freeinv() on obj and addinv_nomerge()
         * on otmp, while doing an in-place swap of the actual objects.
         */
/* set_wear() might result in otmp being destroyed if
                   worn amulet has been turned into an amulet of change */
/* leaving boulder in liquid would trigger sanity_check warning */
/* note: if otmp is gone, billing for it was handled by useup() */
/* add more if stone objects are added... */
/* Don't animate monsters that aren't flesh */
/* animate_statue() forces all golems to become flesh golems */
/* avoid 'assigned value not used' for poly_obj() calls */
/* non-meat eaters smell meat, meat eaters smell its flavor;
           monks are considered non-meat eaters regardless of behavior;
           other roles are non-meat eaters if they haven't broken
           vegetarian conduct yet (or if poly'd into non-carnivorous/
           non-omnivorous form, regardless of whether it's herbivorous,
           non-eating, or something stranger) */
/* eek - your cover might have been blown */
/* target object has now been "seen (up close)" */
/* obj->tknown applies to boxes and chests, not bags or
                       statues; plural handling here and the "empty" case
                       below are superfluous because containers don't stack */
/* we don't want to force alive vs dead
                       determination for Schroedinger's Cat here,
                       so just make probing be inconclusive for it */
/* view contents (not recursively) */
/* learn the type if you see or hear something break
               (the sound could be implicit) */
/* obj broke; force redisplay in case it was the only--
                       or last--item under non-breaking pile-top; top item
                       here might now be a lone object rather than a pile */
/* didn't see corpse but do see monster: it
                               has been placed somewhere other than <ox,oy>
                               or blind hero spots it with ESP */
/* We can't settle for the default calling sequence of
           bhito(otmp) -> break_statue(otmp) -> activate_statue_trap(ox,oy)
           because that last call might end up operating on our `next_obj'
           (below), rather than on the current object, if it happens to
           encounter a statue which mustn't become animated. */
/* pile might have been destroyed or dispersed */
/* create_critters() returns True iff hero sees a new monster appear */
/* wand of wishing asks player what to wish for so always becomes
               discovered (unless it hasn't been seen) */
/* do_enlightenmnt_effect() always describes enlightenment */
/* effect was observable; discover the wand type provided
           that the wand itself has been seen */
/* the wand blows up in your face! */
/* calls freeinv() -> update_inventory() */
/* in case any box->lknown has changed */
/* A mummy wrapping absorbs it and protects you */
/* no longer gives intrinsic, but gives very fast speed instead */
/* probably don't need these to be urgent; player just gave input
           without subsequent opportunity to dismiss --More-- with ESC */
/* They might survive with an amulet of life saving */
/* zapping either self or holder/holdee [bhitm()] will release
               holder's grasp from the hero or hero's grasp from holdee */
/* invent is hit iff hero doesn't escape from a trap */
/* trigger previously escaped trapdoor */
/* similar logic to opening; invent is hit iff no trap triggered */
/* say blasted rather than zapped */
/* might rehumanize(); could be fatal, but only for Unchanging */
/* if blinding is resisted due to magical equipment (Sunsword), give
       a sparkle animation (even if also resisted due to being blind)
       _unless_ this is lightning-induced; we don't want a double sparkle
       if hero is both lightning resistant and blindness resistant, or
       worse, have a single sparkle where the player confuses blindness
       resistance for lightning resistance */
/* now handle special cases */
/* includes lycanthrope in creature form */
/*
             * Return to normal form unless Unchanging.
             * Hero in clay golem form dies if Unchanging.
             * Does not cure lycanthropy or stop timed random polymorph.
             */
/* note: "dark" rather than "heavy" is intentional... */
/* force shapeshifter into its base form or mimic to unhide */
/* !allow_cancel_kill is for Magicbane, where clay golem
               will be killed somewhere back up the call/return chain... */
/* up or down, but at closed portcullis only */
/* can't use the stairs down to quest level 2 until
                      leader "unlocks" them; give feedback if you try */
/* down will release you from bear trap or web */
/* down will trigger trapdoor, hole, or [spiked-] pit */
/* down at open bridge or up or down at open portcullis */
/* set dknown, maybe bknown */
/* now stuck in web or bear trap */
/* striking transforms trapdoor into hole */
/* note: engraving handling that used to be here has been moved
           to zap_map() */
/* if do_osshock() set obj_zapped while polying, give a message now */
/* [how about `bhitpile(u.ustuck->minvent)' effect?] */
/* give feedback for obj_zapped */
/* note: this explosion mustn't destroy otmp */
/*
     * We handle drawbridge for lateral zaps; zap_updown() handles up/down.
     * Engravings only get hit by down zaps and we handle that here.
     */
/* only affects things in stone */
/* drawbridge_down: span of lowered drawbridge */
/* "You feel a draft." (open doorway) */
/* down, which also means x,y == u.ux,u.uy */
/* cancellation/opening/locking/striking/probing */
/* THROWN_WEAPON, KICKED_WEAPON */
/* 'I' present but no monster: erase; do this before tmp_at() */
/* do not leave last symbol */
/* resistance and shield effect and revealing concealed mimic are
           handled by sleep_monst() */
/* destroy shield; victim survives */
/* destroy suit, also cloak if present */
/* destroy shield; other possessions are safe */
/* destroy suit; if present, cloak goes too */
/* no shield or suit, you're dead; wipe out cloak
               and/or shirt in case of life-saving or bones */
/* using two weapons at once makes both of them more vulnerable */
/*
     * 5.0: when fatal, this used to yield "Killed by <fltxt>." without any
     * information about who was responsible.  Now 'buzzer' is used to try
     * to supply "zapped/cast/breathed by <mon> [imitating <other_mon>]."
     *
     * Room for improvement:  there is no monster available when player is
     * hit by divine lighting or by Plane of Air thunderstorm so cause of
     * death remains "killed by a bolt of lightning" w/o extra explanation.
     *
     * Wand of death, spell of finger of death, and disintegration breath
     * don't use this routine so don't include 'inflicted by'.
     */
/* if gb.buzzer is Null, kbuf[] will end up with just <fltxt> */
/* This also ignites floor items, but does not change cnt
       because they weren't consumed. */
/* fireballs only damage when they explode; poison gas leaves
           a trail of 1x1 clouds via zap_over_floor(), but that gets
           skipped for a hit that is reflected so is deferred until we
           know whether reflection is happening */
/* mon has just been killed by another monster */
/* paper golem or straw golem */
/* some armor was destroyed; no damage done */
/* flash_str here only used for killer; suppress
                     * hallucination */
/* gas that missed or that hit without being reflected will leave
           a 1x1 cloud here; the earlier zap_over_floor() was deferred */
/* nothing to bounce off of */
/* "damage" indicates wall rather than door */
/* TRUE because ice_is_melting */
/* boulder isn't being pushed */
/* try again if there's another boulder and pool didn't fill */
/* possibly drown, notice objects */
/* melt_ice does newsym when appropriate */
/* a burning web is too flimsy to notice if you can't see it */
/* don't create steam clouds on Plane of Water; air bubble
               movement and gas regions don't understand each other */
/* For now, don't let WATER freeze. */
/* not just `if (Underwater)' */
/* leave the no longer existent water */
/* but nothing actually happens... */
/* target spot will now pass closed_door() test below
           (except on rogue level) */
/* death spells/wands don't disintegrate */
/* Magical explosion from misc exploding wand */
/* "the door absorbs the blast" would be
                   inaccurate for an exploding wand since
                   other adjacent locations still get hit */
/* hero and player will still remember prior text until the spot
           is re-examined (lookhere or move off and back on) */
/* damage is from monster spell */
/* shop message says "you owe <shk> <$> for it!" so we need
               to precede that with a message explaining what "it" is */
/* breakobj won't destroy fracturing statue or boulder but
               will charge for shop goods */
/* need immediate update in case this is a striking/force bolt
               zap that is about hit more things */
/* drop any objects contained inside the statue */
/* just in case ineligible damage type gets through... */
/* FIXME: recharge only handles items in hero's inventory */
/* effects that happen only to the player */
/* m_useup handles these for monster */
/* update artifact bookkeeping; doesn't produce a livelog event */
/* The(aobjnam()) is safe since otmp is unidentified -dlc */
/* always return "blast of foo" for simplicity;
           this could be extended with hallucinatory rays, but probably
           not worth it at this time */
