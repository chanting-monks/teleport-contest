/* NetHack 5.0	apply.c	$NHDT-Date: 1769342601 2026/01/25 04:03:21 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.475 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, You_see, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcpy, strlen, strstri } from '../c2js-runtime/string.js';
import { arti_speak, is_art, retouch_object } from './artifact.js';
import { acurr, change_luck } from './attrib.js';
import { bot } from './botl.js';
import { cmdq_add_ec, cmdq_add_key, confdir, get_adjacent_loc, getdir, isok, paranoid_query, set_occupation, yn_function } from './cmd.js';
import { is_lava, is_pool, is_pool_or_lava } from './dbridge.js';
import { c_color_names, c_common_strings, c_obj_colors, cg, xdir, ydir, ynchars } from './decl.js';
import { cvt_sdoor_to_door, findit, openit, use_crystal_ball } from './detect.js';
import { buried_ball_to_freedom, dig_check, digactualhole, fillholetyp, liquid_flow, use_pick_axe, watch_dig } from './dig.js';
import { canseemon, feel_newsym, glyph_at, map_invisible, map_object, newsym, nul_glyphinfo, sensemon, tmp_at, unmap_invisible } from './display.js';
import { boulder_hits_pool, dropx, legs_in_no_shape, obj_no_longer_held, revive_corpse, set_wounded_legs } from './do.js';
import { Amonnam, Mgender, Monnam, YMonnam, a_monnam, hcolor, hliquid, l_monnam, m_monnam, mon_nam, monverbself, noit_mon_nam, obj_pmname, pmname, x_monnam, y_monnam } from './do_name.js';
import { Blindf_off, Blindf_on, cursed, fingers_or_gloves, inaccessible_equipment } from './do_wear.js';
import { make_familiar } from './dog.js';
import { hurtle, hurtle_jump, thitmonst, walk_path } from './dothrow.js';
import { defsyms } from './drawing.js';
import { Can_dig_down, In_hell, In_mines, ceiling, on_level, surface } from './dungeon.js';
import { floorfood, morehungry, set_tin_variety, use_tin_opener, vomit } from './eat.js';
import { can_reach_floor, cant_reach_floor, freehand, u_wipe_engr } from './engrave.js';
import { explode } from './explode.js';
import { getpos, getpos_sethilite } from './getpos.js';
import { glyph_to_cmap } from './glyphs.js';
import { check_capacity, in_rooms, invocation_pos, losehp, may_passwall, near_capacity, nomul, obj_to_any, overexertion, spoteffects } from './hack.js';
import { copynchars, dist2, eos, isqrt, s_suffix, upstart } from './hacklib.js';
import { mstatusline, ustatusline } from './insight.js';
import { addinv, addinv_nomerge, any_obj_ok, carrying, consume_obj_charge, delobj, freeinv, getobj, hold_another_object, nxtobj, prinv, sobj_at, stackobj, update_inventory, useup, useupall, useupf } from './invent.js';
import { find_mid, obj_merge_light_sources, transient_light_cleanup } from './light.js';
import { pick_lock } from './lock.js';
import { bagotricks, makemon, mkclass } from './makemon.js';
import { paralyze_monst } from './mhitm.js';
import { gulp_blnd_check } from './mhitu.js';
import { bill_dummy_object, costly_alteration, get_mtraits, hornoplenty, init_dummyobj, mksobj, obj_extract_self, place_object, set_bknown, splitobj, unbless, unsplitobj, weight } from './mkobj.js';
import { mkundead } from './mkroom.js';
import { get_iter_mons, killed, mnexto, see_monster_closeup, seemimic, set_ustuck, wake_nearby, wake_nearto, wakeup, xkilled } from './mon.js';
import { attacktype_fordmg, big_to_little, can_blnd, can_blow, dmgtype_fromattack, little_to_big, locomotion, poly_when_stoned, pronoun_gender } from './mondata.js';
import { accessible, closed_door, monflee } from './monmove.js';
import { mon_reflects } from './muse.js';
import { do_play_instrument } from './music.js';
import { AIR, ALTAR, ARMOR_CLASS, ARM_BOOTS, ARM_GLOVES, ART_SNICKERSNEE, A_CHA, A_CON, A_DEX, A_STR, BAG_OF_HOLDING, BAG_OF_TRICKS, BANANA, BEARTRAP, BEAR_TRAP, BELL, BELL_OF_OPENING, BLINDED, BLINDFOLD, BOULDER, BRASS_LANTERN, BUGLE, BULLWHIP, CANDELABRUM_OF_INVOCATION, CAN_OF_GREASE, CHEST, CLOTH, CLOUD, COIN_CLASS, CONFLICT, CONFUSION, CORPSE, CORR, COST_DSTROY, COST_SPLAT, CQ_CANNED, CREAM_PIE, CREDIT_CARD, CRYSTAL_BALL, DBWALL, DEAF, DIGCHECK_FAILED, DIGCHECK_FAIL_BOULDER, DOOR, DRUM_OF_EARTHQUAKE, DWARVISH_MATTOCK, EGG, EUCALYPTUS_LEAF, EXPENSIVE_CAMERA, EXPL_FIERY, EXPL_FROSTY, EXPL_MAGICAL, FACE, FIGURINE, FIG_TRANSFORM, FIRE_HORN, FIRST_OBJECT, FIRST_REAL_GEM, FIRST_SPELL, FLASHED_LIGHT, FLINT, FLYING, FOOD_CLASS, FOOT, FREE_ACTION, FROST_HORN, FUMBLING, GEMSTONE, GEM_CLASS, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_EXCLUDE_INACCESS, GETOBJ_EXCLUDE_SELECTABLE, GETOBJ_SUGGEST, GLASS, GLIB, GLYPH_ALTAR_OFF, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GOLD, GRAPPLING_HOOK, HALF_PHDAM, HALLUC, HALLUC_RES, HAND, HEAD, HOLE, HORN_OF_PLENTY, ICE, ICE_BOX, INVIS, INVIS_BEAM, JUMPING, LANDMINE, LAND_MINE, LARGE_BOX, LAST_GLASS_GEM, LAST_SPELL, LAVAWALL, LEASH, LEATHER, LEATHER_DRUM, LEG, LENSES, LEVITATION, LIQUID, LOADSTONE, LOCK_PICK, LUCKSTONE, LUMP_OF_ROYAL_JELLY, MAGIC_FLUTE, MAGIC_HARP, MAGIC_LAMP, MAGIC_MARKER, MAGIC_WHISTLE, MAX_GLYPH, MELT_ICE_AWAY, MINERAL, MIRROR, MS_SILENT, M_AP_FURNITURE, M_AP_MONSTER, M_AP_NOTHING, M_AP_OBJECT, NON_PM, NOSE, NUMMONS, NUM_OBJECTS, N_DIRS_Z, OILSKIN_SACK, OIL_LAMP, PASSES_WALLS, PICK_AXE, PIT, PLNMSG_enum, PM_AIR_ELEMENTAL, PM_AMOROUS_DEMON, PM_ARCHEOLOGIST, PM_CHICKATRICE, PM_COCKATRICE, PM_DEATH, PM_FAMINE, PM_FLOATING_EYE, PM_GNOME, PM_HEALER, PM_HORSE, PM_KILLER_BEE, PM_LONG_WORM, PM_MEDUSA, PM_MOUNTAIN_NYMPH, PM_PESTILENCE, PM_QUEEN_BEE, PM_STONE_GOLEM, PM_UMBER_HULK, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WATER_NYMPH, PM_WOOD_NYMPH, POOL, POTION_CLASS, POT_OIL, PROT_FROM_SHAPE_CHANGERS, P_AXE, P_BASIC, P_LANCE, P_NONE, P_PICK_AXE, P_POLEARMS, P_RIDING, P_SKILLED, RANDOM_CLASS, REVIVE_MON, RING_CLASS, ROOM, RUBBER_HOSE, SACK, SADDLE, SCORR, SDOOR, SEE_INVIS, SHOPBASE, SICK, SILVER, SKELETON_KEY, SLIMED, SLIME_MOLD, SPBOOK_CLASS, SPE_BLANK_PAPER, SPE_BOOK_OF_THE_DEAD, SPE_JUMPING, SPE_NOVEL, STAIRS, STATUE, STATUE_TRAP, STETHOSCOPE, STOMACH, STONE, STONED, STONE_RES, STRANGLED, STUNNED, S_EEL, S_EYE, S_GHOST, S_LIGHT, S_MIMIC, S_NYMPH, S_UNICORN, S_VAMPIRE, S_VORTEX, S_altar, S_arrow_trap, S_digbeam, S_goodpos, S_grave, S_ndoor, S_stone, S_trwall, S_vwall, TALLOW_CANDLE, TIMER_OBJECT, TIN, TINNING_KIT, TIN_OPENER, TIN_WHISTLE, TOOLED_HORN, TOOL_CLASS, TOUCHSTONE, TOWEL, TRAPNUM, TREE, TT_BEARTRAP, TT_BURIEDBALL, TT_INFLOOR, TT_LAVA, TT_PIT, TT_WEB, Trap_Killed_Mon, UNENCUMBERED, UNICORN_HORN, VOMITING, WAND_CLASS, WAN_CANCELLATION, WAN_COLD, WAN_CREATE_MONSTER, WAN_DEATH, WAN_DIGGING, WAN_ENLIGHTENMENT, WAN_FIRE, WAN_LIGHT, WAN_LIGHTNING, WAN_LOCKING, WAN_MAGIC_MISSILE, WAN_NOTHING, WAN_OPENING, WAN_POLYMORPH, WAN_PROBING, WAN_SECRET_DOOR_DETECTION, WAN_STASIS, WAN_STRIKING, WAN_TELEPORTATION, WAN_UNDEAD_TURNING, WAN_WISHING, WATER, WAX, WAX_CANDLE, WEAK, WEAPON_CLASS, WOOD, WOODEN_FLUTE, WOODEN_HARP, WOUNDED_LEGS, WWALKING, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned, spe_Fresh } from './nh-constants.js';
import { discover_object, objdescr_is, observe_object } from './o_init.js';
import { The, Tobjnam, Yname2, Yobjnam2, an, cxname, doname, gloves_simple_name, makeplural, otense, safe_qbuf, simple_typename, simpleonames, singular, the, thesimpleoname, vtense, xname, yname, ysimple_name } from './objnam.js';
import { pickup_object, use_container } from './pickup.js';
import { There, pline_mon, set_msg_xy } from './pline.js';
import { body_part, mbodypart, poly_gender, polymon } from './polyself.js';
import { djinni_from_bottle, incr_itimeout, make_blinded, make_confused, make_deaf, make_glib, make_hallucinated, make_sick, make_stunned, make_vomiting, set_itimeout } from './potion.js';
import { litroom, unpunish } from './read.js';
import { d, rn2, rnd, rnl, shuffle_int_array } from './rnd.js';
import { genders } from './role.js';
import { Shk_Your, add_damage, check_unpaid, check_unpaid_usage, costly_spot, obfree, pay_for_damage, shk_your, shop_keeper, use_unpaid_trapobj } from './shk.js';
import { growl, whimper, yelp } from './sounds.js';
import { known_spell, spelleffects } from './spell.js';
import { On_stairs, stairway_at } from './stairs.js';
import { mpickobj } from './steal.js';
import { kick_steed, stucksteed, use_saddle } from './steed.js';
import { enexto, noteleport_level, rloc, rloc_to, tele_restrict, tele_to_rnd_pet, teleds } from './teleport.js';
import { attach_egg_hatch_timeout, begin_burn, end_burn, kill_egg, obj_has_timer, spot_stop_timers, start_timer, stop_timer } from './timeout.js';
import { activate_statue_trap, deltrap, dotrap, feeltrap, fill_pit, fire_damage, instapetrify, maketrap, mintrap, reset_utrap, t_at, trapname } from './trap.js';
import { attack_checks, check_caitiff, flash_hits_mon, force_attack, stumble_onto_mimic } from './uhitm.js';
import { vault_summon_gd } from './vault.js';
import { howmonseen, recalc_block_point, unblock_point } from './vision.js';
import { dbon, dry_a_towel, possibly_unwield, setmnotwielded, uwep_skill_type } from './weapon.js';
import { mwelded, wield_tool } from './wield.js';
import { add_menu, select_menu } from './windows.js';
import { mon_has_amulet } from './wizard.js';
import { mon_adjust_speed, setnotworn } from './worn.js';
import { dowrite } from './write.js';
import { bhit, bhitm, bhito, bhitpile, get_obj_location, obj_resists, release_hold, zappable, zapsetup, zapwrapup, zapyourself } from './zap.js';

/* occupation callback */
const no_elbow_room = "don't have enough elbow-room to maneuver.";
export function do_blinding_ray(obj) {
    let mtmp = bhit(game.u.dx, game.u.dy, 80, FLASHED_LIGHT, null, null, obj);
    /* flash_hits_mon() wants this */
    obj.ox = game.u.ux , obj.oy = game.u.uy;
    if (mtmp) {
        flash_hits_mon(mtmp, obj);
        if (obj.otyp == EXPENSIVE_CAMERA) {
            see_monster_closeup(mtmp, (1));
        }
    }
    /* normally bhit() would do this but for FLASHED_LIGHT we want it
       to be deferred until after flash_hits_mon() */
    transient_light_cleanup();
}
export function use_camera(obj) {
    if ((game.u.uinwater)) {
        pline("Using your camera underwater would void the warranty.");
        /* if steed is immobile, can't do physical jump but can do spell one */
        /* stucksteed gave "<steed> won't move" message */
        return 0;
    }
    if (!getdir(null)) {
        return 2;
    }
    if (obj.spe <= 0) {
        pline("%s", c_common_strings.c_nothing_happens);
        return 1;
    }
    consume_obj_charge(obj, (1));
    if (obj.cursed && !rn2(2)) {
        /* TODO:  we ought to have a "selfie" joke here... */
        zapyourself(obj, (1));
    } else if (game.u.uswallow) {
        You("take a picture of %s %s.", s_suffix(mon_nam(game.u.ustuck)), mbodypart(game.u.ustuck, STOMACH));
    } else if (game.u.dz) {
        You("take a picture of the %s.", (game.u.dz > 0) ? surface(game.u.ux, game.u.uy) : ceiling(game.u.ux, game.u.uy));
    } else if (!game.u.dx && !game.u.dy) {
        zapyourself(obj, (1));
    } else {
        do_blinding_ray(obj);
    }
    return 1;
}
export function use_towel(obj) {
    let drying_feedback = (obj == game.uwep);
    if (!freehand()) {
        You("have no free %s!", body_part(HAND));
        return 0;
    } else if (obj == game.ublindf) {
        You("cannot use it while you're wearing it!");
        return 0;
    } else if (obj.cursed) {
        let old = 0;
        switch (rn2(3)) {
            case 2:
                old = (game.u.uprops[GLIB].intrinsic & 16777215);
                make_glib(old + (rn2(10) + (3)));
                Your("%s %s!", makeplural(body_part(HAND)), (old ? "are filthier than ever" : "get slimy"));
                if (((obj).otyp == TOWEL && (obj).spe > 0)) {
                    dry_a_towel(obj, -1, drying_feedback);
                }
                return 1;
            case 1:
                if (!game.ublindf) {
                    old = game.u.ucreamed;
                    game.u.ucreamed += (rn2(10) + (3));
                    pline("Yecch!  Your %s %s gunk on it!", body_part(FACE), (old ? "has more" : "now has"));
                    make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + game.u.ucreamed - old, (1));
                } else {
                    let what = null;
                    what = (game.ublindf.otyp == LENSES) ? "lenses" : (obj.otyp == game.ublindf.otyp) ? "other towel" : "blindfold";
                    if (game.ublindf.cursed) {
                        You("push your %s %s.", what, rn2(2) ? "cock-eyed" : "crooked");
                    } else {
                        let saved_ublindf = game.ublindf;
                        You("push your %s off.", what);
                        Blindf_off(game.ublindf);
                        dropx(saved_ublindf);
                    }
                }
                if (((obj).otyp == TOWEL && (obj).spe > 0)) {
                    dry_a_towel(obj, -1, drying_feedback);
                }
                return 1;
            /* case 6 is half as likely as the others */
            case 0:
                /* not gone yet but behave as if it was */
                break;
        }
    }
    if (game.u.uprops[GLIB].intrinsic) {
        make_glib(0);
        You("wipe off your %s.", !game.uarmg ? makeplural(body_part(HAND)) : gloves_simple_name(game.uarmg));
        if (((obj).otyp == TOWEL && (obj).spe > 0)) {
            dry_a_towel(obj, -1, drying_feedback);
        }
        return 1;
    } else if (game.u.ucreamed) {
        incr_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, (-1 * game.u.ucreamed));
        game.u.ucreamed = 0;
        if (!(game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked)) {
            pline("You've got the glop off.");
            if (!gulp_blnd_check()) {
                set_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, 1);
                make_blinded(0, (1));
            }
        } else {
            Your("%s feels clean now.", body_part(FACE));
        }
        if (((obj).otyp == TOWEL && (obj).spe > 0)) {
            dry_a_towel(obj, -1, drying_feedback);
        }
        return 1;
    }
    Your("%s and %s are already clean.", body_part(FACE), makeplural(body_part(HAND)));
    return 0;
}
/* maybe give a stethoscope message based on floor objects */
export function its_dead(rx, ry, resp) {
    let buf = '';
    let more_corpses = 0;
    let mptr = null;
    let corpse = sobj_at(CORPSE, rx, ry);
    let statue = sobj_at(STATUE, rx, ry);
    if (!can_reach_floor((1))) {
        /* levitation or unskilled riding */
        /* can't reach corpse on floor */
        corpse = null;
        /* you can't reach tiny statues (even though you can fight
           tiny monsters while levitating--consistency, what's that?) */
        while (statue && game.mons[statue.corpsenm].msize == 0) {
            statue = nxtobj(statue, STATUE, (1));
        }
    }
    if (corpse && statue) {
        if (nxtobj(statue, CORPSE, (1)) == corpse) {
            corpse = null;
        /* when both corpse and statue are present, pick the uppermost one */
        /* corpse follows statue; ignore it */
        /* corpse precedes statue; ignore statue */
        } else {
            statue = null;
        }
    }
    more_corpses = (corpse && nxtobj(corpse, CORPSE, (1)));
    if (!corpse && !statue) {
        ;
    } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        if (!corpse) {
            buf = strcpy(buf, "You're both stoned");
        } else if (corpse.quan == 1 && !more_corpses) {
            /* additional stethoscope messages from jyoung@apanix.apana.org.au */
            let gndr = 2;
            let mtmp = get_mtraits(corpse, (0));
            if (mtmp) {
                /* (most corpses don't retain the monster's sex, so
               we're usually forced to use generic pronoun here) */
                mtmp.data = game.mons[mtmp.mnum];
                gndr = pronoun_gender(mtmp, 1);
            } else {
                mptr = game.mons[corpse.corpsenm];
                if ((((mptr).mflags2 & 131072) != 0)) {
                    gndr = 1;
                } else if ((((mptr).mflags2 & 65536) != 0)) {
                    gndr = 0;
                }
            }
            buf = sprintf(buf, "%s's dead", genders[gndr].he);
            buf = (() => { const __s = buf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
        } else {
            buf = strcpy(buf, "They're dead");
        }
        /* variations on "He's dead, Jim." (Star Trek's Dr McCoy) */
        You_hear("a voice say, \"%s, Jim.\"", buf);
        resp.value = 1;
        return (1);
    } else if (corpse) {
        let here = ((rx) == game.u.ux && (ry) == game.u.uy);
        let one = (corpse.quan == 1 && !more_corpses);
        let reviver = (0);
        let visglyph = 0;
        let corpseglyph = 0;
        visglyph = glyph_at(rx, ry);
        corpseglyph = (((corpse).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2)(NUMMONS))) + ((!(rn2)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((corpse).corpsenm + ((((corpse).spe & 3) == 1) ? (((corpse).where == 1 && ((game.otg_otmp = game.level.objects[(corpse).ox][(corpse).oy].v.v_nexthere) != null) && ((corpse).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((corpse).where == 1 && ((game.otg_otmp = game.level.objects[(corpse).ox][(corpse).oy].v.v_nexthere) != null) && ((corpse).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((corpse).otyp == CORPSE) ? (((corpse).corpsenm + (((corpse).where == 1 && ((game.otg_otmp = game.level.objects[(corpse).ox][(corpse).oy].v.v_nexthere) != null) && ((corpse).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(corpse).dknown && ((corpse).oclass == POTION_CLASS || ((corpse).otyp >= FIRST_REAL_GEM && ((corpse).otyp <= LAST_GLASS_GEM)) || ((corpse).otyp >= FIRST_SPELL && ((corpse).otyp <= LAST_SPELL)))) ? (((corpse).oclass + (((corpse).where == 1 && ((game.otg_otmp = game.level.objects[(corpse).ox][(corpse).oy].v.v_nexthere) != null) && ((corpse).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((corpse).otyp + (((corpse).where == 1 && ((game.otg_otmp = game.level.objects[(corpse).ox][(corpse).oy].v.v_nexthere) != null) && ((corpse).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))));
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && (visglyph != corpseglyph)) {
            map_object(corpse, (1));
        }
        if ((game.urole.mnum == (PM_HEALER))) {
            do {
                if (obj_has_timer(corpse, REVIVE_MON)) {
                    reviver = (1);
                /* ok to reset `corpse' here; we're done with it */
                } else {
                    corpse = nxtobj(corpse, CORPSE, (1));
                }
            } while (corpse && !reviver);
        }
        You("determine that %s unfortunate being%s %s%s dead.", one ? (here ? "this" : "that") : (here ? "these" : "those"), one ? "" : "s", one ? "is" : "are", reviver ? " mostly" : "");
        return (1);
    } else {
        let what = null;
        let how = null;
        mptr = game.mons[statue.corpsenm];
        /* ignore statue->dknown; it'll always be set */
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            buf = sprintf(buf, "%s %s", ((rx) == game.u.ux && (ry) == game.u.uy) ? "This" : "That", (((mptr).mflags1 & 131072) != 0) ? "person" : "creature");
            what = buf;
        } else {
            what = obj_pmname(statue);
            if (!(((mptr).mflags2 & 524288) != 0)) {
                what = The(what);
            }
        }
        how = "fine";
        if ((game.urole.mnum == (PM_HEALER))) {
            let ttmp = t_at(rx, ry);
            if (ttmp && ttmp.ttyp == STATUE_TRAP) {
                how = "extraordinary";
            } else if (((statue).cobj != null)) {
                how = "remarkable";
            }
        }
        pline("%s is in %s health for a statue.", what, how);
        return (1);
    }
    return (0);
}
const hollow_str = "a hollow sound.  This must be a secret %s!";
/* Strictly speaking it makes no sense for usage of a stethoscope to
   not take any time; however, unless it did, the stethoscope would be
   almost useless.  As a compromise, one use per turn is free, another
   uses up the turn; this makes curse status have a tangible effect. */
export function use_stethoscope(obj) {
    let mtmp = null;
    let lev = null;
    let res = 0;
    let rx = 0;
    let ry = 0;
    let interference = (game.u.uswallow && ((game.u.ustuck.data).mlet == S_VORTEX || (game.u.ustuck.data) == game.mons[PM_AIR_ELEMENTAL]) && !rn2((game.urole.mnum == (PM_HEALER)) ? 10 : 3));
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        You("have no hands!");
        return 0;
    } else if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        You_cant("hear anything!");
        return 0;
    } else if (!freehand()) {
        You("have no free %s.", body_part(HAND));
        return 0;
    }
    if (!getdir(null)) {
        return 2;
    }
    res = (game.hero_seq == game.context.stethoscope_seq) ? 1 : 0;
    game.context.stethoscope_seq = game.hero_seq;
    game.bhitpos.x = game.u.ux , game.bhitpos.y = game.u.uy;
    game.notonhead = game.u.uswallow;
    if (game.u.usteed && game.u.dz > 0) {
        if (interference) {
            pline("%s interferes.", Monnam(game.u.ustuck));
            mstatusline(game.u.ustuck);
        } else {
            mstatusline(game.u.usteed);
        }
        /* 3 is the minimum possible */
        return res;
    } else if (game.u.uswallow && (game.u.dx || game.u.dy || game.u.dz)) {
        mstatusline(game.u.ustuck);
        return res;
    } else if (game.u.uswallow && interference) {
        pline("%s interferes.", Monnam(game.u.ustuck));
        mstatusline(game.u.ustuck);
        return res;
    } else if (game.u.dz) {
        if ((game.u.uinwater)) {
            ;
            You_hear("faint splashing.");
        } else if (game.u.dz < 0 || !can_reach_floor((1))) {
            cant_reach_floor(game.u.ux, game.u.uy, (game.u.dz < 0), (1), (0));
        } else if (its_dead(game.u.ux, game.u.uy, { get value() { return res; }, set value(_v) { res = _v; } })) {
            ;
        } else if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
            ;
            You_hear("the crackling of hellfire.");
        } else {
            pline_The("%s seems healthy enough.", surface(game.u.ux, game.u.uy));
        }
        return res;
    } else if (obj.cursed && !rn2(2)) {
        ;
        You_hear("your heart beat.");
        return res;
    }
    confdir((0));
    if (!game.u.dx && !game.u.dy) {
        ustatusline();
        return res;
    }
    rx = game.u.ux + game.u.dx;
    ry = game.u.uy + game.u.dy;
    if (!isok(rx, ry)) {
        ;
        You_hear("a faint typing noise.");
        return 0;
    }
    if ((mtmp = (game.level.monsters[rx][ry])) != null) {
        let mnm = x_monnam(mtmp, 2, null, 1 | 2, (0));
        /* gb.bhitpos needed by mstatusline() iff mtmp is a long worm */
        game.bhitpos.x = rx , game.bhitpos.y = ry;
        game.notonhead = (mtmp.mx != rx || mtmp.my != ry);
        if (mtmp.mundetected) {
            if (!(canseemon(mtmp) || sensemon(mtmp))) {
                There("is %s hidden there.", mnm);
            }
            /* bring non-mimic hider out of hiding */
            mtmp.mundetected = 0;
            newsym(mtmp.mx, mtmp.my);
        } else if (mtmp.mappearance) {
            let what = "thing";
            let use_plural = (0);
            let dummyobj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
            let odummy = null;
            switch (((mtmp).m_ap_type & 7)) {
                case M_AP_OBJECT:
                    odummy = init_dummyobj(dummyobj, mtmp.mappearance, 1);
                    if (odummy.otyp == SLIME_MOLD && ((mtmp).mextra && ((mtmp).mextra.mcorpsenm) != NON_PM)) {
                        /* FIXME?
                 *  we should probably be using object_from_map() here
                 */
                        /* simple_typename() yields "fruit" for any named fruit;
                   we want the same thing '//' or ';' shows: "slime mold"
                   or "grape" or "slice of pizza" */
                        odummy.spe = ((mtmp).mextra.mcorpsenm);
                        what = simpleonames(odummy);
                    } else {
                        what = simple_typename(odummy.otyp);
                    }
                    use_plural = ((odummy.oclass == ARMOR_CLASS && game.objects[odummy.otyp].oc_subtyp == ARM_BOOTS) || (odummy.oclass == ARMOR_CLASS && game.objects[odummy.otyp].oc_subtyp == ARM_GLOVES) || odummy.otyp == LENSES);
                    /* okay even if not touchstone */
                    break;
                /* ignore Hallucination here */
                case M_AP_MONSTER:
                    what = pmname(game.mons[mtmp.mappearance], Mgender(mtmp));
                    break;
                case M_AP_FURNITURE:
                    what = defsyms[mtmp.mappearance].explanation;
                    break;
            }
            seemimic(mtmp);
            pline("%s %s %s really %s.", use_plural ? "Those" : "That", what, use_plural ? "are" : "is", mnm);
        } else if (game.flags.verbose && !(canseemon(mtmp) || sensemon(mtmp))) {
            There("is %s there.", mnm);
        }
        mstatusline(mtmp);
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            map_invisible(rx, ry);
        }
        return res;
    }
    if (unmap_invisible(rx, ry)) {
        pline_The("invisible monster must have moved.");
    }
    lev = game.level.locations[rx][ry];
    switch (lev.typ) {
        case SDOOR:
            ;
            You_hear(hollow_str, "door");
            cvt_sdoor_to_door(lev);
            recalc_block_point(rx, ry);
            feel_newsym(rx, ry);
            return res;
        case SCORR:
            You_hear(hollow_str, "passage");
            lev.typ = CORR , lev.flags = 0;
            unblock_point(rx, ry);
            feel_newsym(rx, ry);
            return res;
    }
    if (!its_dead(rx, ry, { get value() { return res; }, set value(_v) { res = _v; } })) {
        You("hear nothing special.");
    }
    return res;
}
const whistle_str = "produce a %s whistling sound.";
const alt_whistle_str = "produce a %s, sharp vibration.";
export function use_whistle(obj) {
    if (!can_blow(game.youmonst)) {
        You("are incapable of using the whistle.");
    } else if ((game.u.uinwater)) {
        You("blow bubbles through %s.", yname(obj));
    } else {
        if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            You_feel("rushing air tickle your %s.", body_part(NOSE));
        } else {
            You(whistle_str, obj.cursed ? "shrill" : "high");
        }
        ;
        wake_nearby((1));
        if (obj.cursed) {
            vault_summon_gd();
        }
    }
}
export function use_magic_whistle(obj) {
    if (!can_blow(game.youmonst)) {
        You("are incapable of using the whistle.");
    } else if (obj.cursed && !rn2(2)) {
        You("produce a %shigh-%s.", (game.u.uinwater) ? "very " : "", (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "frequency vibration" : "pitched humming noise");
        wake_nearby((1));
        if (!rn2(2) && !noteleport_level(game.youmonst)) {
            tele_to_rnd_pet();
        }
    } else {
        /* it's magic!  it works underwater too (at a higher pitch) */
        You((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? alt_whistle_str : whistle_str, (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "normal" : ((game.u.uinwater) && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "strange, high-pitched" : "strange");
        ;
        magic_whistled(obj);
    }
}
/* 'obj' is assumed to be a magic whistle */
export function magic_whistled(obj) {
    let mtmp = null;
    let nextmon = null;
    let buf = '';
    let mnam = null;
    let shiftbuf = '';
    let appearbuf = '';
    let disappearbuf = '';
    let oseen = 0;
    let nseen = 0;
    let already_discovered = game.objects[obj.otyp].oc_name_known != 0;
    let omx = 0;
    let omy = 0;
    let shift = 0;
    let appear = 0;
    let disappear = 0;
    let trapped = 0;
    /* stasis prevents magic-whistling */
    if (game.level.flags.stasis_until >= game.moves) {
        return;
    }
    /* need to copy (up to 3) names as they're collected rather than just
       save pointers to them, otherwise churning through every mbuf[] might
       clobber the ones we care about */
    ((disappearbuf = '', appearbuf = ''), shiftbuf = '');
    for (mtmp = game.level.monlist; mtmp; mtmp = nextmon) {
        nextmon = mtmp.nmon;
        if (((mtmp).mhp < 1)) {
            continue;
        }
        /* only tame monsters are affected;
           steed is already at your location, so not affected;
           this avoids trap issues if you're on a trap location */
        if (!mtmp.mtame || mtmp == game.u.usteed) {
            continue;
        }
        if (mtmp.mtrapped) {
            /* no longer in previous trap (affects mintrap) */
            mtmp.mtrapped = 0;
            fill_pit(mtmp.mx, mtmp.my);
        }
        oseen = (canseemon(mtmp) || sensemon(mtmp));
        /* get name in case it's one we'll remember */
        if (oseen) {
            mnam = y_monnam(mtmp);
        }
        /* before mnexto(); it might disappear */
        /* mimic must be revealed before we know whether it
           actually moves because line-of-sight may change */
        if (((mtmp).m_ap_type & 7)) {
            seemimic(mtmp);
        }
        omx = mtmp.mx , omy = mtmp.my;
        mnexto(mtmp, !already_discovered ? 2 : 0);
        if (mtmp.mx != omx || mtmp.my != omy) {
            if (mtmp.mundetected) {
                /* reveal non-mimic hider that moved */
                mtmp.mundetected = 0;
                newsym(mtmp.mx, mtmp.my);
            }
            /*
             * FIXME:
             *  All relocated monsters should change positions essentially
             *  simultaneously but we're dealing with them sequentially.
             *  That could kill some off in the process, each time leaving
             *  their target position (which should be occupied at least
             *  momentarily) available as a potential death trap for others.
             *
             *  Also, teleporting onto a trap introduces message sequencing
             *  issues.  We try to avoid the most obvious non sequiturs by
             *  checking whether pline() got called during mintrap().
             *  iflags.last_msg will be changed from the value we set here
             *  to PLNMSG_UNKNOWN in that situation.
             */
            game.iflags.last_msg = PLNMSG_enum;
            if (mintrap(mtmp, 0) == Trap_Killed_Mon) {
                change_luck(-1);
            }
            if (game.iflags.last_msg != PLNMSG_enum) {
                ++trapped;
                continue;
            }
            /* dying while seen would have issued a message and not get here;
               being sent to an unseen location and dying there should be
               included in the disappeared case */
            nseen = ((mtmp).mhp < 1) ? (0) : (canseemon(mtmp) || sensemon(mtmp));
            if (nseen) {
                mnam = y_monnam(mtmp);
                if (oseen) {
                    if (++shift == 1) {
                        shiftbuf = sprintf(shiftbuf, "%s shifts location", mnam);
                    }
                } else {
                    if (++appear == 1) {
                        appearbuf = sprintf(appearbuf, "%s appears", mnam);
                    }
                }
            } else if (oseen) {
                if (++disappear == 1) {
                    disappearbuf = sprintf(disappearbuf, "%s disappears", mnam);
                }
            }
        }
    }
    /*
     * If any pets changed location, (1) they might have been in view
     * before and still in view after, (2) out of view before but in
     * view after, (3) in view before but out of view after (perhaps
     * on the far side of a boulder/door/wall), or (4) out of view
     * before and still out of view after.  The first two cases are
     * the usual ones; the fourth will happen if the hero can't see.
     *
     * If the magic whistle hasn't been discovered yet, rloc() issued
     * any applicable vanishing and/or appearing messages, and we make
     * it become discovered now if any pets moved within or into view.
     * If it has already been discovered, we told rloc() not to issue
     * messages and will issue one cumulative message now (for any of
     * the first three cases, not the fourth) to reduce verbosity for
     * the first case of a single pet (avoid "vanishes and reappears")
     * and greatly reduce verbosity for multiple pets regardless of
     * each one's case.
     */
    buf = '';
    if (!already_discovered) {
        /* message(s) were handled by rloc(); if only noticeable change was
           pet(s) disappearing, the magic whistle won't become discovered */
        if (shift + appear + trapped > 0) {
            discover_object((obj.otyp), (1), (1), (1));
        }
    } else {
        if (shift > 0) {
            /* could use array of cardinal number names like wishcmdassist() but
           extra precision above 3 or 4 seems pedantic; not used for 0 or 1 */
            /* magic whistle is already discovered so rloc() message(s)
           were suppressed above; if any discernible relocation occurred,
           construct a message now and issue it below */
            if (shift > 1) {
                shiftbuf = sprintf(shiftbuf, "%s creatures shift locations", (((shift) < 2) ? "sqrt(-1)" : ((shift) == 2) ? "two" : ((shift) == 3) ? "three" : ((shift) == 4) ? "four" : ((shift) <= 7) ? "several" : "many"));
            }
            buf = copynchars(buf, upstart(shiftbuf), 256 /* sizeof(char [256]) */ - 1);
        }
        if (appear > 0) {
            if (appear > 1) {
                appearbuf = sprintf(appearbuf, "%s %s appear", (((appear) < 2) ? "sqrt(-1)" : ((appear) == 2) ? "two" : ((appear) == 3) ? "three" : ((appear) == 4) ? "four" : ((appear) <= 7) ? "several" : "many"), (shift == 0) ? "creatures" : (shift == 1) ? "other creatures" : "others");
            }
            /* to get here:  appear > 0 and shift != 0,
                            so "shifters, appearers" if disappear != 0
                            with ", and disappearers" yet to be appended,
                            or "shifters and appearers" otherwise */
            if (shift == 0) {
                buf = copynchars(buf, upstart(appearbuf), 256 /* sizeof(char [256]) */ - 1);
            } else {
                nh_snprintf("magic_whistled", 669, eos(buf), 256 /* sizeof(char [256]) */ - strlen(buf), "%s %s", disappear ? "," : " and", appearbuf);
            }
        }
        if (disappear > 0) {
            /* shift==0: N creatures appear;
                   shift==1: Foo shifts location and N other creatures appear;
                   shift >1: M creatures shift locations and N others appear */
            if (disappear > 1) {
                disappearbuf = sprintf(disappearbuf, "%s %s disappear", (((disappear) < 2) ? "sqrt(-1)" : ((disappear) == 2) ? "two" : ((disappear) == 3) ? "three" : ((disappear) == 4) ? "four" : ((disappear) <= 7) ? "several" : "many"), (shift == 0 && appear == 0) ? "creatures" : (shift < 2 && appear < 2) ? "other creatures" : "others");
            }
            if (shift + appear == 0) {
                buf = copynchars(buf, upstart(disappearbuf), 256 /* sizeof(char [256]) */ - 1);
            } else {
                nh_snprintf("magic_whistled", 681, eos(buf), 256 /* sizeof(char [256]) */ - strlen(buf), "%s and %s", (shift && appear) ? "," : "", disappearbuf);
            }
        }
    }
    if (buf) {
        pline("%s.", buf);
    }
    return;
}
export function um_dist(x, y, n) {
    return (abs(game.u.ux - x) > n || abs(game.u.uy - y) > n);
}
export function number_leashed() {
    let i = 0;
    let obj = null;
    for (obj = game.invent; obj; obj = obj.nobj) {
        if (obj.otyp == LEASH && obj.corpsenm != 0) {
            i++;
        }
    }
    return i;
}
/* otmp is about to be destroyed or stolen */
export function o_unleash(otmp) {
    let mtmp = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (mtmp.m_id == otmp.corpsenm) {
            mtmp.mleashed = 0;
            break;
        }
    }
    otmp.corpsenm = 0;
    update_inventory();
}
/* mtmp is about to die, or become untame */
export function m_unleash(mtmp, feedback) {
    let otmp = null;
    if (feedback) {
        if (canseemon(mtmp)) {
            pline_mon(mtmp, "%s pulls free of %s leash!", Monnam(mtmp), (genders[pronoun_gender(mtmp, 2)].his));
        } else {
            Your("leash falls slack.");
        }
    }
    if ((otmp = get_mleash(mtmp)) != null) {
        otmp.corpsenm = 0;
        update_inventory();
    }
    mtmp.mleashed = 0;
}
/* player is about to die (for bones) */
export function unleash_all() {
    let otmp = null;
    let mtmp = null;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == LEASH) {
            otmp.corpsenm = 0;
        }
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        mtmp.mleashed = 0;
    }
}
export function leashable(mtmp) {
    return (mtmp.mnum != PM_LONG_WORM && !(((mtmp.data).mflags1 & 1048576) != 0) && (!(((mtmp.data).mflags1 & 24576) == 24576) || (((mtmp.data).mflags1 & 32768) == 0)));
}
export function use_leash(obj) {
    let cc = { x: 0, y: 0 };
    let mtmp = null;
    if (game.u.uswallow) {
        /* if the leash isn't in use, assume we're trying to leash
           the engulfer; if it is use, distinguish between removing
           it from the engulfer versus from some other creature
           (note: the two in-use cases can't actually occur; all
           leashes are released when the hero gets engulfed) */
        You_cant((!obj.corpsenm ? "leash %s from inside." : (obj.corpsenm == game.u.ustuck.m_id) ? "unleash %s from inside." : "unleash anything from inside %s."), noit_mon_nam(game.u.ustuck));
        return 0;
    }
    if (!obj.corpsenm && number_leashed() >= 2) {
        You("cannot leash any more pets.");
        return 0;
    }
    if (!get_adjacent_loc(null, null, game.u.ux, game.u.uy, cc)) {
        return 0;
    }
    if (((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
        if (game.u.usteed && game.u.dz > 0) {
            mtmp = game.u.usteed;
            use_leash_core(obj, mtmp, cc, 1);
            return 1;
        }
        pline("Leash yourself?  Very funny...");
        return 0;
    }
    if (!(mtmp = (game.level.monsters[cc.x][cc.y]))) {
        /*
     * From here on out, return value is 1 == a move is used.
     */
        There("is no creature there.");
        unmap_invisible(cc.x, cc.y);
        return 1;
    }
    use_leash_core(obj, mtmp, cc, (canseemon(mtmp) || sensemon(mtmp)));
    return 1;
}
export function use_leash_core(obj, mtmp, cc, spotmon) {
    if (!spotmon && !((game.level.locations[cc.x][cc.y].glyph) == GLYPH_INVIS_OFF)) {
        /* for the unleash case, we don't verify whether this unseen
           monster is the creature attached to the current leash */
        You("fail to %sleash something.", obj.corpsenm ? "un" : "");
        /* trying again will work provided the monster is tame
           (and also that it doesn't change location by retry time) */
        map_invisible(cc.x, cc.y);
    } else if (!mtmp.mtame) {
        pline("%s %s leashed!", Monnam(mtmp), (!obj.corpsenm) ? "cannot be" : "is not");
    } else if (!obj.corpsenm) {
        if (mtmp.mleashed) {
            /* applying a leash which isn't currently in use */
            pline("This %s is already leashed.", spotmon ? l_monnam(mtmp) : "creature");
        } else if ((((mtmp.data).mflags1 & 1048576) != 0)) {
            pline("The leash would just fall off.");
        } else if ((((mtmp.data).mflags1 & 24576) == 24576) && !(((mtmp.data).mflags1 & 32768) == 0)) {
            pline("%s has no extremities the leash would fit.", Monnam(mtmp));
        } else if (!leashable(mtmp)) {
            let lmonbuf = '';
            let lmonnam = l_monnam(mtmp);
            if (cc.x != mtmp.mx || cc.y != mtmp.my) {
                lmonbuf = sprintf(lmonbuf, "%s tail", s_suffix(lmonnam));
                lmonnam = lmonbuf;
            }
            pline("The leash won't fit onto %s%s.", spotmon ? "your " : "", lmonnam);
        } else {
            You("slip the leash around %s%s.", spotmon ? "your " : "", l_monnam(mtmp));
            mtmp.mleashed = 1;
            obj.corpsenm = mtmp.m_id;
            mtmp.msleeping = 0;
            update_inventory();
        }
    } else {
        if (obj.corpsenm != mtmp.m_id) {
            /* applying a leash which is currently in use */
            pline("This leash is not attached to that creature.");
        } else if (obj.cursed) {
            pline_The("leash would not come off!");
            set_bknown(obj, 1);
        } else {
            mtmp.mleashed = 0;
            obj.corpsenm = 0;
            update_inventory();
            You("remove the leash from %s%s.", spotmon ? "your " : "", l_monnam(mtmp));
        }
    }
}
/* assuming mtmp->mleashed has been checked */
export function get_mleash(mtmp) {
    let otmp = null;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == LEASH && otmp.corpsenm == mtmp.m_id) {
            break;
        }
    }
    return otmp;
}
export function mleashed_next2u(mtmp) {
    if (mtmp.mleashed) {
        if (!(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
            mnexto(mtmp, 4);
        }
        if (!(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
            let otmp = get_mleash(mtmp);
            if (!otmp) {
                impossible("leashed-unleashed mon?");
                return (1);
            }
            if (otmp.cursed) {
                return (1);
            }
            mtmp.mleashed = 0;
            otmp.corpsenm = 0;
            update_inventory();
            You_feel("%s leash go slack.", (number_leashed() > 1) ? "a" : "the");
        }
    }
    return (0);
}
export function next_to_u() {
    if (get_iter_mons(mleashed_next2u)) {
        return (0);
    }
    /* no pack mules for the Amulet */
    if (game.u.usteed && mon_has_amulet(game.u.usteed)) {
        return (0);
    }
    return (1);
}
export function check_leash(x, y) {
    let otmp = null;
    let mtmp = null;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp != LEASH || otmp.corpsenm == 0) {
            continue;
        }
        mtmp = find_mid(otmp.corpsenm, 1);
        if (!mtmp) {
            impossible("leash in use isn't attached to anything?");
            otmp.corpsenm = 0;
            continue;
        }
        if (dist2(game.u.ux, game.u.uy, mtmp.mx, mtmp.my) > dist2(x, y, mtmp.mx, mtmp.my)) {
            if (!um_dist(mtmp.mx, mtmp.my, 3)) {
                ;
            } else if (otmp.cursed && !(((mtmp.data).mflags1 & 1024) != 0)) {
                if (um_dist(mtmp.mx, mtmp.my, 5) || (mtmp.mhp -= rnd(2)) <= 0) {
                    let save_pacifism = game.u.uconduct.killer;
                    Your("leash chokes %s to death!", mon_nam(mtmp));
                    /* hero might not have intended to kill pet, but
                       that's the result of his actions; gain experience,
                       lose pacifism, take alignment and luck hit, make
                       corpse less likely to remain tame after revival */
                    xkilled(mtmp, 1);
                    /* life-saving doesn't ordinarily reset this */
                    if (!((mtmp).mhp < 1)) {
                        game.u.uconduct.killer = save_pacifism;
                    }
                } else {
                    pline_mon(mtmp, "%s is choked by the leash!", Monnam(mtmp));
                    /* tameness eventually drops to 1 here (never 0) */
                    if (mtmp.mtame && rn2(mtmp.mtame)) {
                        mtmp.mtame--;
                    }
                }
            } else {
                if (um_dist(mtmp.mx, mtmp.my, 5)) {
                    pline("%s leash snaps loose!", s_suffix(Monnam(mtmp)));
                    m_unleash(mtmp, (0));
                } else {
                    You("pull on the leash.");
                    if (mtmp.data.msound != MS_SILENT) {
                        switch (rn2(3)) {
                            case 0:
                                growl(mtmp);
                                break;
                            case 1:
                                yelp(mtmp);
                                break;
                            default:
                                whimper(mtmp);
                                break;
                        }
                    }
                }
            }
        }
    }
}
/* charisma is supposed to include qualities like leadership and personal
   magnetism rather than just appearance, but it has devolved to this... */
export function beautiful() {
    let res = null;
    let cha = (acurr(A_CHA));
    /* don't bother complaining about the sexism; NetHack is not real life */
    /* 25 is the maximum possible */
    res = ((cha >= 25) ? "sublime" : (cha >= 19) ? "splendorous" : (cha >= 16) ? ((poly_gender() == 1) ? "beautiful" : "handsome") : (cha >= 14) ? ((poly_gender() == 1) ? "winsome" : "amiable") : (cha >= 11) ? "cute" : (cha >= 9) ? "plain" : (cha >= 6) ? "homely" : (cha >= 4) ? "ugly" : "hideous");
    return res;
}
const look_str = "look %s.";
export function use_mirror(obj) {
    let mirror = null;
    let uvisage = null;
    let mtmp = null;
    let how_seen = 0;
    let mlet = 0;
    let vis = 0;
    let invis_mirror = 0;
    let useeit = 0;
    let monable = 0;
    if (!getdir(null)) {
        return 2;
    }
    invis_mirror = ((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked);
    useeit = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && (!invis_mirror || (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic));
    uvisage = beautiful();
    /* "mirror" or "looking glass" */
    mirror = simpleonames(obj);
    if (obj.cursed && !rn2(2)) {
        /* in case it was acquired while blinded */
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline_The("%s fogs up and doesn't reflect!", mirror);
        } else {
            pline("%s", c_common_strings.c_nothing_seems_to_happen);
        }
        return 1;
    }
    if (!game.u.dx && !game.u.dy && !game.u.dz) {
        if (!useeit) {
            You_cant("see your %s %s.", uvisage, body_part(FACE));
        } else {
            if (game.u.umonnum == PM_FLOATING_EYE) {
                if (game.u.uprops[FREE_ACTION].extrinsic) {
                    You("stiffen momentarily under your gaze.");
                } else {
                    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                        pline("Yow!  The %s stares back!", mirror);
                    } else {
                        pline("Yikes!  You've frozen yourself!");
                    }
                    if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || !rn2(4)) {
                        nomul(-rnd(30 + 6 - game.u.ulevel));
                        game.multi_reason = "gazing into a mirror";
                    }
                    /* default, "you can move again" */
                    game.nomovemsg = null;
                }
            } else if (((game.youmonst.data).mlet == S_VAMPIRE) || ((game.youmonst).cham == PM_VAMPIRE || (game.youmonst).cham == PM_VAMPIRE_LEADER || (game.youmonst).cham == PM_VLAD_THE_IMPALER)) {
                You("don't have a reflection.");
            } else if (game.u.umonnum == PM_UMBER_HULK) {
                pline("Huh?  That doesn't look like you!");
                make_confused(game.u.uprops[CONFUSION].intrinsic + d(3, 4), (0));
            } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                You(look_str, hcolor(null));
            } else if (game.u.uprops[SICK].intrinsic) {
                You(look_str, "peaked");
            } else if (game.u.uhs >= WEAK) {
                You(look_str, "undernourished");
            } else if ((game.u.umonnum != game.u.umonster)) {
                You("look like %s.", an(pmname(game.mons[game.u.umonnum], (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0))));
            } else {
                You("look as %s as ever.", uvisage);
            }
        }
        return 1;
    }
    if (game.u.uswallow) {
        if (useeit) {
            You("reflect %s %s.", s_suffix(mon_nam(game.u.ustuck)), mbodypart(game.u.ustuck, STOMACH));
        }
        return 1;
    }
    if ((game.u.uinwater)) {
        if (useeit) {
            You("%s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "give the fish a chance to fix their makeup" : "reflect the murky water");
        }
        return 1;
    }
    if (game.u.dz) {
        if (useeit) {
            You("reflect the %s.", (game.u.dz > 0) ? surface(game.u.ux, game.u.uy) : ceiling(game.u.ux, game.u.uy));
        }
        return 1;
    }
    mtmp = bhit(game.u.dx, game.u.dy, 80, INVIS_BEAM, null, null, obj);
    if (!mtmp || !(((mtmp.data).mflags1 & 4096) == 0) || game.notonhead) {
        return 1;
    }
    /* couldsee(mtmp->mx, mtmp->my) is implied by the fact that bhit()
       targeted it, so we can ignore possibility of X-ray vision */
    vis = canseemon(mtmp);
    /* ways to directly see monster (excludes X-ray vision, telepathy,
       extended detection, type-specific warning) */
    how_seen = vis ? howmonseen(mtmp) : 0;
    /* whether monster is able to use its vision-based capabilities */
    monable = !mtmp.mcan && (!mtmp.minvis || (((mtmp.data).mflags1 & 16777216) != 0));
    mlet = mtmp.data.mlet;
    if (mtmp.msleeping) {
        if (vis) {
            pline("%s is too tired to look at your %s.", Monnam(mtmp), mirror);
        }
    } else if (!mtmp.mcansee) {
        if (vis) {
            pline("%s can't see anything right now.", Monnam(mtmp));
        }
    } else if (invis_mirror && !(((mtmp.data).mflags1 & 16777216) != 0)) {
        /* infravision doesn't produce an image in the mirror */
        if (vis) {
            pline("%s fails to notice your %s.", Monnam(mtmp), mirror);
        }
    } else if ((how_seen & (1 | 2 | 4)) == 4) {
        /* some monsters do special things */
        if (vis) {
            pline("%s in the dark.", monverbself(mtmp, Monnam(mtmp), "are", "too far away to see"));
        }
    } else if (mlet == S_VAMPIRE || mlet == S_GHOST || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) {
        if (vis) {
            pline("%s doesn't have a reflection.", Monnam(mtmp));
        }
    } else if (monable && mtmp.data == game.mons[PM_MEDUSA]) {
        if (mon_reflects(mtmp, "The gaze is reflected away by %s %s!")) {
            return 1;
        }
        if (vis) {
            pline("%s is turned to stone!", Monnam(mtmp));
        }
        game.stoned = (1);
        killed(mtmp);
    } else if (monable && mtmp.data == game.mons[PM_FLOATING_EYE]) {
        let tmp = d(mtmp.m_lev, mtmp.data.mattk[0].damd);
        if (!rn2(4)) {
            tmp = 120;
        }
        if (vis) {
            pline("%s is frozen by its reflection.", Monnam(mtmp));
        } else {
            You_hear("%s stop moving.", c_common_strings.c_something);
        }
        paralyze_monst(mtmp, mtmp.mfrozen + tmp);
    } else if (monable && mtmp.data == game.mons[PM_UMBER_HULK]) {
        if (vis) {
            pline("%s confuses itself!", Monnam(mtmp));
        }
        mtmp.mconf = 1;
    } else if (monable && (mlet == S_NYMPH || mtmp.data == game.mons[PM_AMOROUS_DEMON])) {
        if (vis) {
            let buf = '';
            /* "<mon> admires self in your mirror " */
            pline("%s in your %s.", monverbself(mtmp, Monnam(mtmp), "admire", null), mirror);
            pline("%s takes it!", upstart(strcpy(buf, (genders[pronoun_gender(mtmp, 2)].he))));
        } else {
            pline("It steals your %s!", mirror);
        }
        /* in case mirror was wielded */
        /* so we need to do this ourselves */
        setnotworn(obj);
        /* remove from inventory so that it won't be offered as a choice
       to rub on itself */
        /* hide it from destroy_items instead... */
        freeinv(obj);
        mpickobj(mtmp, obj);
        if (!tele_restrict(mtmp)) {
            rloc(mtmp, 2);
        }
    } else if (!((mtmp.data).mlet == S_UNICORN && (((mtmp.data).mflags2 & 536870912) != 0)) && !(((mtmp.data).mflags1 & 131072) != 0) && !(((mtmp.data).mflags2 & 256) != 0) && (!mtmp.minvis || (((mtmp.data).mflags1 & 16777216) != 0)) && rn2(5)) {
        let do_react = (1);
        if (mtmp.mfrozen) {
            if (vis) {
                You("discern no obvious reaction from %s.", mon_nam(mtmp));
            } else {
                You_feel("a bit silly gesturing the mirror in that direction.");
            }
            do_react = (0);
        }
        if (do_react) {
            if (vis) {
                pline("%s is frightened by its reflection.", Monnam(mtmp));
            }
            monflee(mtmp, d(2, 4), (0), (0));
        }
    } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        if (mtmp.minvis && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
            ;
        } else if ((mtmp.minvis && !(((mtmp.data).mflags1 & 16777216) != 0)) || !(((mtmp.data).mflags1 & 4096) == 0) || game.notonhead || !mtmp.mcansee) {
            pline("%s doesn't seem to notice %s reflection.", Monnam(mtmp), (genders[pronoun_gender(mtmp, 2)].his));
        } else {
            pline("%s ignores %s reflection.", Monnam(mtmp), (genders[pronoun_gender(mtmp, 2)].his));
        }
    }
    return 1;
}
export function use_bell(optr) {
    let obj = optr.value;
    let mtmp = null;
    let wakem = (0);
    let learno = (0);
    let ordinary = (obj.otyp != BELL_OF_OPENING || !obj.spe);
    let invoking = (obj.otyp == BELL_OF_OPENING && invocation_pos(game.u.ux, game.u.uy) && !On_stairs(game.u.ux, game.u.uy));
    ;
    You("ring %s.", the(xname(obj)));
    if ((game.u.uinwater) || (game.u.uswallow && ordinary)) {
        pline("But the sound is muffled.");
    } else if (invoking && ordinary) {
        /* needs to be recharged... */
        pline("But it makes no sound.");
        /* help player figure out why */
        learno = (1);
    } else if (ordinary) {
        if (obj.cursed && !rn2(4) && !(game.mvitals[PM_WOOD_NYMPH].mvflags & (2 | 1)) && !(game.mvitals[PM_WATER_NYMPH].mvflags & (2 | 1)) && !(game.mvitals[PM_MOUNTAIN_NYMPH].mvflags & (2 | 1)) && (mtmp = makemon(mkclass(S_NYMPH, 0), game.u.ux, game.u.uy, 1 | 131072)) != null) {
            /* note: once any of them are gone, we stop all of them */
            You("summon %s!", a_monnam(mtmp));
            if (!obj_resists(obj, 93, 100)) {
                pline("%s shattered!", Tobjnam(obj, "have"));
                useup(obj);
                optr.value = null;
            } else {
                switch (rn2(3)) {
                    default:
                        break;
                    case 1:
                        mon_adjust_speed(mtmp, 2, null);
                        break;
                    /* no explanation; it just happens... */
                    case 2:
                        game.nomovemsg = "";
                        game.multi_reason = null;
                        nomul(-rnd(2));
                        break;
                }
            }
        }
        wakem = (1);
    } else {
        consume_obj_charge(obj, (1));
        if (game.u.uswallow) {
            if (!obj.cursed) {
                openit();
            } else {
                pline("%s", c_common_strings.c_nothing_happens);
            }
        } else if (obj.cursed) {
            let mm = { x: 0, y: 0 };
            mm.x = game.u.ux;
            mm.y = game.u.uy;
            mkundead(mm, (0), 1);
            wakem = (1);
        } else if (invoking) {
            pline("%s an unsettling shrill sound...", Tobjnam(obj, "issue"));
            obj.age = game.moves;
            learno = (1);
            wakem = (1);
        } else if (obj.blessed) {
            let res = 0;
            if (game.uchain) {
                unpunish();
                res = 1;
            } else if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
                buried_ball_to_freedom();
                res = 1;
            }
            res += openit();
            switch (res) {
                case 0:
                    pline("%s", c_common_strings.c_nothing_happens);
                    break;
                case 1:
                    pline("%s opens...", c_common_strings.c_Something);
                    learno = (1);
                    break;
                default:
                    pline("Things open around you...");
                    learno = (1);
                    break;
            }
        } else {
            if (findit() != 0) {
                learno = (1);
            } else {
                pline("%s", c_common_strings.c_nothing_happens);
            }
        }
    }
    if (learno) {
        discover_object((BELL_OF_OPENING), (1), (1), (1));
        obj.known = 1;
    }
    if (wakem) {
        wake_nearby((1));
    }
}
export function use_candelabrum(obj) {
    let s = (obj.spe != 1) ? "candles" : "candle";
    if (obj.lamplit) {
        You("snuff the %s.", s);
        end_burn(obj, (1));
        return;
    }
    if (obj.spe <= 0) {
        let otmp = null;
        pline("This %s has no %s.", xname(obj), s);
        /* only output tip if candles are in inventory */
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if ((otmp.otyp == TALLOW_CANDLE || otmp.otyp == WAX_CANDLE)) {
                break;
            }
        }
        if (otmp) {
            pline("To attach candles, apply them instead of the %s.", xname(obj));
        }
        return;
    }
    if ((game.u.uinwater)) {
        You("cannot make fire under water.");
        return;
    }
    if (game.u.uswallow || obj.cursed) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline_The("%s %s for a moment, then %s.", s, vtense(s, "flicker"), vtense(s, "die"));
        }
        return;
    }
    if (obj.spe < 7) {
        There("%s only %d %s in %s.", vtense(s, "are"), obj.spe, s, the(xname(obj)));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s lit.  %s dimly.", obj.spe == 1 ? "It is" : "They are", Tobjnam(obj, "shine"));
        }
    } else {
        pline("%s's %s burn%s", The(xname(obj)), s, (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "." : " brightly!"));
    }
    if (!invocation_pos(game.u.ux, game.u.uy) || On_stairs(game.u.ux, game.u.uy)) {
        pline_The("%s %s being rapidly consumed!", s, vtense(s, "are"));
        /* this used to be obj->age /= 2, rounding down; an age of
           1 would yield 0, confusing begin_burn() and producing an
           unlightable, unrefillable candelabrum; round up instead */
        obj.age = Math.trunc((obj.age + 1) / 2);
        if (obj.age == 0) {
            /* to make absolutely sure the game doesn't become unwinnable as
           a consequence of a broken candelabrum */
            impossible("Candelabrum with candles but no fuel?");
            obj.age = 1;
        }
    } else {
        if (obj.spe == 7) {
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s a strange warmth!", Tobjnam(obj, "radiate"));
            } else {
                pline("%s with a strange light!", Tobjnam(obj, "glow"));
            }
        }
        obj.known = 1;
    }
    begin_burn(obj, (0));
}
export function use_candle(optr) {
    let obj = optr.value;
    let otmp = null;
    let s = (obj.quan != 1) ? "candles" : "candle";
    let qbuf = '';
    let qsfx = '';
    let q = null;
    let was_lamplit = 0;
    if (game.u.uswallow) {
        You(no_elbow_room);
        return;
    }
    /* obj is the candle; otmp is the candelabrum */
    otmp = carrying(CANDELABRUM_OF_INVOCATION);
    if (!otmp || otmp.spe == 7) {
        /* last, format final "attach candles to candelabrum?" query */
        use_lamp(obj);
        return;
    }
    qsfx = sprintf(qsfx, " to\x1b%s?", thesimpleoname(otmp));
    /* first, minimal candelabrum suffix for formatting candles */
    /* next, format the candles as a prefix for the candelabrum */
    safe_qbuf(qbuf, "Attach ", qsfx, obj, yname, thesimpleoname, s);
    /* strip temporary candelabrum suffix */
    if ((q = strstri(qbuf, " to\x1b")) != null) {
        q = strcpy(q, " to ");
    }
    if (yn_function(safe_qbuf(qbuf, qbuf, "?", otmp, yname, thesimpleoname, "it"), ynchars, 110, (1)) == 110) {
        use_lamp(obj);
        return;
    } else {
        if (otmp.spe + obj.quan > 7) {
            obj = splitobj(obj, 7 - otmp.spe);
            /* avoid a grammatical error if obj->quan gets
               reduced to 1 candle from more than one */
            s = (obj.quan != 1) ? "candles" : "candle";
        } else {
            optr.value = null;
        }
        /* The candle's age field doesn't correctly reflect the amount
           of fuel in it while it's lit, because the fuel is measured
           by the timer. So to get accurate age updating, we need to
           end the burn temporarily while attaching the candle. */
        was_lamplit = obj.lamplit;
        if (was_lamplit) {
            end_burn(obj, (1));
        }
        You("attach %ld%s %s to %s.", obj.quan, !otmp.spe ? "" : " more", s, the(xname(otmp)));
        if (!otmp.spe || otmp.age > obj.age) {
            otmp.age = obj.age;
        }
        otmp.spe += obj.quan;
        if (otmp.lamplit && !was_lamplit) {
            pline_The("new %s magically %s!", s, vtense(s, "ignite"));
        } else if (!otmp.lamplit && was_lamplit) {
            pline("%s out.", (obj.quan > 1) ? "They go" : "It goes");
        }
        if (obj.unpaid) {
            /* "catches light!" or "feels warm." */
            let shkp = shop_keeper(in_rooms(game.u.ux, game.u.uy, SHOPBASE));
            ;
            verbalize("You %s %s, you bought %s!", otmp.lamplit ? "burn" : "use", (obj.quan > 1) ? "them" : "it", (obj.quan > 1) ? "them" : "it");
        }
        if (obj.quan < 7 && otmp.spe == 7) {
            pline("%s now has seven%s candles attached.", The(xname(otmp)), otmp.lamplit ? " lit" : "");
        }
        /* candelabrum's light range might increase */
        if (otmp.lamplit) {
            obj_merge_light_sources(otmp, otmp);
        }
        /* candles are no longer a separate light source */
        useupall(obj);
        /* candelabrum's weight is changing */
        otmp.owt = weight(otmp);
        update_inventory();
    }
}
/* call in drop, throw, and put in box, etc. */
export function snuff_candle(otmp) {
    let candle = (otmp.otyp == TALLOW_CANDLE || otmp.otyp == WAX_CANDLE);
    if ((candle || otmp.otyp == CANDELABRUM_OF_INVOCATION) && otmp.lamplit) {
        let buf = '';
        let x = 0;
        let y = 0;
        let many = candle ? (otmp.quan > 1) : (otmp.spe > 1);
        get_obj_location(otmp, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0);
        if (otmp.where == 4 ? ((game.viz_array[y][x] & 2) != 0) : !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s%scandle%s flame%s extinguished.", Shk_Your(buf, otmp), (candle ? "" : "candelabrum's "), (many ? "s'" : "'s"), (many ? "s are" : " is"));
        }
        end_burn(otmp, (1));
        return (1);
    }
    return (0);
}
/* called when lit lamp is hit by water or put into a container or
   you've been swallowed by a monster; obj might be in transit while
   being thrown or dropped so don't assume that its location is valid */
export function snuff_lit(obj) {
    let x = 0;
    let y = 0;
    if (obj.lamplit) {
        if (obj.otyp == OIL_LAMP || obj.otyp == MAGIC_LAMP || obj.otyp == BRASS_LANTERN || obj.otyp == POT_OIL) {
            get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0);
            if (obj.where == 4 ? ((game.viz_array[y][x] & 2) != 0) : !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s %s out!", Yname2(obj), otense(obj, "go"));
            }
            end_burn(obj, (1));
            return (1);
        }
        if (snuff_candle(obj)) {
            return (1);
        }
    }
    return (0);
}
/* called when lit object is hit by water */
export function splash_lit(obj) {
    let result = 0;
    let dunk = (0);
    if (obj.lamplit && obj.otyp == BRASS_LANTERN) {
        /* lantern won't be extinguished by a rust trap or rust monster attack
       but will be if submerged or placed into a container or swallowed by
       a monster (for mobile light source handling, not because it ought
       to stop being lit in all those situations...) */
        let mtmp = null;
        let useeit = (0);
        let uhearit = (0);
        let snuff = (1);
        if (obj.where == 3) {
            useeit = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
            uhearit = !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf);
            /* underwater light sources aren't allowed but if hero
               is just entering water, Underwater won't be set yet */
            dunk = (is_pool(game.u.ux, game.u.uy) && ((!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && !((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))));
            snuff = (0);
        } else if (obj.where == 4 && ((mtmp = obj.v.v_ocarry) , (((mtmp.data).mflags1 & 131072) != 0))) {
            /* don't assume that lit lantern has been swallowed;
                      a nymph might have stolen it or picked it up */
            let x = 0;
            let y = 0;
            useeit = get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0) && ((game.viz_array[y][x] & 2) != 0);
            uhearit = ((game.viz_array[y][x] & 1) != 0) && dist2((x), (y), game.u.ux, game.u.uy) < 5 * 5;
            dunk = (is_pool(mtmp.mx, mtmp.my) && ((!(((mtmp.data).mflags1 & 1) != 0) && !((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))));
            snuff = (0);
            if (useeit) {
                set_msg_xy(x, y);
            }
        }
        if (useeit || uhearit) {
            pline("%s %s%s%s.", Yname2(obj), uhearit ? "crackles" : "", (uhearit && useeit) ? " and " : "", useeit ? "flickers" : "");
        }
        if (!dunk && !snuff) {
            return (0);
        }
    }
    result = snuff_lit(obj);
    if (dunk) {
        /* this is simpler when we wait until after lantern has been snuffed */
        /* drain some of the battery but don't short it out entirely */
        obj.age -= (obj.age > 200) ? 100 : (Math.trunc(obj.age / 2));
    }
    return result;
}
/* Called when potentially lightable object is affected by fire_damage().
   Return TRUE if object becomes lit and FALSE otherwise --ALI */
export function catch_lit(obj) {
    let x = 0;
    let y = 0;
    if (!obj.lamplit && ((obj).otyp == BRASS_LANTERN || (obj).otyp == OIL_LAMP || ((obj).otyp == MAGIC_LAMP && (obj).spe > 0) || (obj).otyp == CANDELABRUM_OF_INVOCATION || (obj).otyp == TALLOW_CANDLE || (obj).otyp == WAX_CANDLE || (obj).otyp == POT_OIL) && get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0)) {
        /* spe==0 => no djinni inside */
        if (((obj.otyp == MAGIC_LAMP || obj.otyp == CANDELABRUM_OF_INVOCATION) && obj.spe == 0) || (((obj).otyp == BRASS_LANTERN || (obj).otyp == OIL_LAMP || (obj).otyp == CANDELABRUM_OF_INVOCATION || (obj).otyp == TALLOW_CANDLE || (obj).otyp == WAX_CANDLE || (obj).otyp == POT_OIL) && obj.age == 0) || obj.otyp == BRASS_LANTERN) {
            return (0);
        }
        /* spe==0 => no candles attached */
        /* age_is_relative && age==0 && still-exists means out of fuel */
        /* lantern is classified as ignitable() but not by fire */
        if (obj.otyp == CANDELABRUM_OF_INVOCATION && obj.cursed) {
            return (0);
        }
        if ((obj.otyp == OIL_LAMP || obj.otyp == MAGIC_LAMP) && obj.cursed && !rn2(2)) {
            return (0);
        }
        if (obj.where == 3 || ((game.viz_array[y][x] & 2) != 0)) {
            /* once lit, cursed lamp is as good as non-cursed one, so failure
               to light is a minor inconvenience to make cursed be worse */
            if (obj.where == 1 && ((game.viz_array[y][x] & 2) != 0)) {
                set_msg_xy(x, y);
            }
            pline("%s %s %s", Yname2(obj), otense(obj, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "catch"), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "warm." : "light!");
        }
        if (obj.otyp == POT_OIL) {
            discover_object((obj.otyp), (1), (1), (1));
        }
        if (((obj).where == 3) && obj.unpaid && costly_spot(game.u.ux, game.u.uy)) {
            let shkp = shop_keeper(in_rooms(game.u.ux, game.u.uy, SHOPBASE));
            /* if it catches while you have it, then it's your tough luck */
            /* Normally, we shouldn't both partially and fully charge
         * for an item, but (Yendorian Fuel) Taxes are inevitable...
         */
            /* [ALI] Do this first so that wand is removed from bill. Otherwise,
     * the freeinv() below also hides it from setpaid() which causes problems.
     */
            check_unpaid(obj);
            ;
            verbalize("That's in addition to the cost of %s %s, of course.", yname(obj), (obj.quan == 1) ? "itself" : "themselves");
            bill_dummy_object(obj);
        }
        begin_burn(obj, (0));
        return (1);
    }
    return (0);
}
/* light a lamp or candle */
export function use_lamp(obj) {
    let buf = '';
    let lamp = (obj.otyp == OIL_LAMP || obj.otyp == MAGIC_LAMP) ? "lamp" : (obj.otyp == BRASS_LANTERN) ? "lantern" : null;
    if (obj.lamplit) {
        if (lamp) {
            pline("%s%s is now off.", Shk_Your(buf, obj), lamp);
        /*
     * When blind, lamps' and candles' on/off state can be distinguished
     * by heat.  For brass lantern assume that there is an on/off switch
     * that can be felt.
     */
        } else {
            You("snuff out %s.", yname(obj));
        }
        end_burn(obj, (1));
        return;
    }
    if ((game.u.uinwater)) {
        pline("%s.", !(obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE) ? "This is not a diving lamp" : "Sorry, fire and water don't mix");
        return;
    }
    if ((!(obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE) && obj.age == 0) || (obj.otyp == MAGIC_LAMP && obj.spe == 0)) {
        if (obj.otyp == BRASS_LANTERN) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                Your("lantern is out of power.");
            /* magic lamps with an spe == 0 (wished for) cannot be lit */
            } else {
                pline("%s", c_common_strings.c_nothing_seems_to_happen);
            }
        } else {
            pline("This %s has no oil.", xname(obj));
        }
        return;
    }
    if (obj.cursed && !rn2(2)) {
        if ((obj.otyp == OIL_LAMP || obj.otyp == MAGIC_LAMP) && !rn2(3)) {
            pline_The("lamp spills and covers your %s with oil.", fingers_or_gloves((1)));
            make_glib((game.u.uprops[GLIB].intrinsic & 16777215) + d(2, 10));
        } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s for a moment, then %s.", Tobjnam(obj, "flicker"), otense(obj, "die"));
        } else {
            pline("%s", c_common_strings.c_nothing_seems_to_happen);
        }
    } else {
        if (lamp) {
            check_unpaid(obj);
            pline("%s%s is now on.", Shk_Your(buf, obj), lamp);
        } else {
            pline("%s flame%s %s%s", s_suffix(Yname2(obj)), (((obj.quan) == 1) ? "" : "s"), otense(obj, "burn"), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "." : " brightly!");
            if (obj.unpaid && costly_spot(game.u.ux, game.u.uy) && obj.age == 20 * game.objects[obj.otyp].oc_cost) {
                let ithem = (obj.quan > 1) ? "them" : "it";
                let shkp = shop_keeper(in_rooms(game.u.ux, game.u.uy, SHOPBASE));
                ;
                verbalize("You burn %s, you bought %s!", ithem, ithem);
                bill_dummy_object(obj);
            }
        }
        begin_burn(obj, (0));
    }
}
export function light_cocktail(optr) {
    let obj = optr.value;
    let buf = '';
    let split1off = 0;
    if (game.u.uswallow) {
        You(no_elbow_room);
        return;
    }
    if (obj.lamplit) {
        You("snuff the lit potion.");
        end_burn(obj, (1));
        if (!obj.owornmask) {
            /*
         * Free & add to re-merge potion.  This will average the
         * age of the potions.  Not exactly the best solution,
         * but its easy.  Don't do that unless obj is not worn (uwep,
         * uswapwep, or uquiver) because if wielded and other oil is
         * quivered a "null obj after quiver merge" panic will occur.
         */
            freeinv(obj);
            optr.value = addinv(obj);
        }
        return;
    } else if ((game.u.uinwater)) {
        There("is not enough oxygen to sustain a fire.");
        return;
    }
    split1off = (obj.quan > 1);
    if (split1off) {
        obj = splitobj(obj, 1);
    }
    You("light %spotion.%s", shk_your(buf, obj), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : "  It gives off a dim light.");
    if (obj.unpaid && costly_spot(game.u.ux, game.u.uy)) {
        let shkp = shop_keeper(in_rooms(game.u.ux, game.u.uy, SHOPBASE));
        check_unpaid(obj);
        ;
        verbalize("That's in addition to the cost of the potion, of course.");
        bill_dummy_object(obj);
    }
    discover_object((obj.otyp), (1), (1), (1));
    begin_burn(obj, (0));
    if (split1off) {
        obj_extract_self(obj);
        obj.nomerge = 1;
        obj = hold_another_object(obj, "You drop %s!", doname(obj), null);
        if (obj) {
            obj.nomerge = 0;
        }
    }
    optr.value = obj;
}
/* getobj callback for object to be rubbed - not selecting a secondary object
   to rub on a gray stone or rub jelly on */
export function rub_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    if (obj.otyp == OIL_LAMP || obj.otyp == MAGIC_LAMP || obj.otyp == BRASS_LANTERN || ((obj).otyp == LUCKSTONE || (obj).otyp == LOADSTONE || (obj).otyp == FLINT || (obj).otyp == TOUCHSTONE) || obj.otyp == LUMP_OF_ROYAL_JELLY) {
        /* Possible extension: don't suggest greasing objects which are already
     * greased. */
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_EXCLUDE;
}
/* the #rub command */
export function dorub() {
    let obj = null;
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        You("aren't able to rub anything without hands.");
        return 0;
    }
    obj = getobj("rub", rub_ok, 0);
    if (!obj) {
        return 2;
    }
    if (obj.oclass == GEM_CLASS || obj.oclass == FOOD_CLASS) {
        if (((obj).otyp == LUCKSTONE || (obj).otyp == LOADSTONE || (obj).otyp == FLINT || (obj).otyp == TOUCHSTONE)) {
            return use_stone(obj);
        } else if (obj.otyp == LUMP_OF_ROYAL_JELLY) {
            return use_royal_jelly({ get value() { return obj; }, set value(_v) { obj = _v; } });
        } else {
            pline("Sorry, I don't know how to use that.");
            return 0;
        }
    }
    if (obj != game.uwep) {
        if (wield_tool(obj, "rub")) {
            cmdq_add_ec(CQ_CANNED, dorub);
            cmdq_add_key(CQ_CANNED, obj.invlet);
            return 1;
        }
        return 0;
    }
    if (game.uwep.otyp == MAGIC_LAMP) {
        if (game.uwep.spe > 0 && !rn2(3)) {
            check_unpaid_usage(game.uwep, (1));
            /* bones preparation:  perform the lamp transformation
               before releasing the djinni in case the latter turns out
               to be fatal (a hostile djinni has no chance to attack yet,
               but an indebted one who grants a wish might bestow an
               artifact which blasts the hero with lethal results) */
            game.uwep.otyp = OIL_LAMP;
            game.uwep.spe = 0;
            game.uwep.age = (rn2(500) + (1000));
            if (game.uwep.lamplit) {
                begin_burn(game.uwep, (1));
            }
            djinni_from_bottle(game.uwep);
            discover_object((MAGIC_LAMP), (1), (1), (1));
            update_inventory();
        } else if (rn2(2)) {
            You("%s smoke.", !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "see a puff of" : "smell");
        } else {
            pline("%s", c_common_strings.c_nothing_happens);
        }
    } else if (obj.otyp == BRASS_LANTERN) {
        pline("Rubbing the electric lamp is not particularly rewarding.");
        pline("Anyway, nothing exciting happens.");
    } else {
        pline("%s", c_common_strings.c_nothing_happens);
    }
    return 1;
}
/* the #jump command */
export function dojump() {
    return jump(0);
}
export const jAny = 0;
export const jHorz = 1;
export const jVert = 2;
export const jDiag = 3;
/* any direction => magical jump */
/* jHorz|jVert */
/* callback routine for walk_path() */
export function check_jump(arg, x, y) {
    let traj = arg;
    let lev = game.level.locations[x][y];
    if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
        return (1);
    }
    if (((lev.typ) <= DBWALL)) {
        return (0);
    }
    if (((lev.typ) == DOOR)) {
        if (closed_door(x, y)) {
            return (0);
        }
        /* reject diagonal jump into or out-of or through open door */
        /* reject horizontal jump through horizontal open door
                   and non-horizontal (ie, vertical) jump through
                   non-horizontal (vertical) open door */
        /* empty doorways aren't restricted */
        if ((lev.flags & 2) != 0 && traj != jAny && (traj == jDiag || ((traj & jHorz) != 0) == (lev.horizontal != 0))) {
            return (0);
        }
    }
    /* let giants jump over boulders (what about Flying?
       and is there really enough head room for giants to jump
       at all, let alone over something tall?) */
    if (sobj_at(BOULDER, x, y) && !(((game.youmonst.data).mflags2 & 134217728) != 0)) {
        return (0);
    }
    return (1);
}
export function is_valid_jump_pos(x, y, magic, showmsg) {
    if (!magic && !(game.u.uprops[JUMPING].intrinsic & ~(67108864 | 33554432 | 16777216)) && !game.u.uprops[JUMPING].extrinsic && dist2((x), (y), game.u.ux, game.u.uy) != 5) {
        /* The Knight jumping restriction still applies when riding a
         * horse.  After all, what shape is the knight piece in chess?
         */
        if (showmsg) {
            pline("Illegal move!");
        }
        return (0);
    } else if (dist2((x), (y), game.u.ux, game.u.uy) > (magic ? 6 + magic * 3 : 9)) {
        if (showmsg) {
            /* ESC; uses turn iff polearm became wielded */
            /* ESC; uses turn iff grapnel became wielded */
            pline("Too far!");
        }
        return (0);
    } else if (!isok(x, y)) {
        if (showmsg) {
            You("cannot jump there!");
        }
        return (0);
    } else if (!((game.viz_array[y][x] & 2) != 0)) {
        if (showmsg) {
            You("cannot see where to land!");
        }
        return (0);
    } else {
        let uc = { x: 0, y: 0 };
        let tc = { x: 0, y: 0 };
        let lev = game.level.locations[game.u.ux][game.u.uy];
        /* we want to categorize trajectory for use in determining
           passage through doorways: horizontal, vertical, or diagonal;
           since knight's jump and other irregular directions are
           possible, we flatten those out to simplify door checks */
        let diag = 0;
        let traj = 0;
        let dx = x - game.u.ux;
        let dy = y - game.u.uy;
        let ax = abs(dx);
        let ay = abs(dy);
        /* diag: any non-orthogonal destination classified as diagonal */
        diag = (magic || (game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) || (!dx && !dy)) ? jAny : !dy ? jHorz : !dx ? jVert : jDiag;
        /* traj: flatten out the trajectory => some diagonals re-classified */
        if (ax >= 2 * ay) {
            ay = 0;
        } else if (ay >= 2 * ax) {
            ax = 0;
        }
        traj = (magic || (game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) || (!ax && !ay)) ? jAny : !ay ? jHorz : !ax ? jVert : jDiag;
        if (diag == jDiag && ((lev.typ) == DOOR) && (lev.flags & 2) != 0 && (traj == jDiag || ((traj & jHorz) != 0) == (lev.horizontal != 0))) {
            /* walk_path doesn't process the starting spot;
           this is iffy:  if you're starting on a closed door spot,
           you _can_ jump diagonally from doorway (without needing
           Passes_walls); that's intentional but is it correct? */
            if (showmsg) {
                You_cant("jump diagonally out of a doorway.");
            }
            return (0);
        }
        uc.x = game.u.ux , uc.y = game.u.uy;
        tc.x = x , tc.y = y;
        if (!walk_path(uc, tc, check_jump, traj)) {
            if (showmsg) {
                There("is an obstacle preventing that jump.");
            }
            return (0);
        }
    }
    return (1);
}
export function get_valid_jump_position(x, y) {
    return (isok(x, y) && (((game.level.locations[x][y].typ) >= DOOR) || (game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) && is_valid_jump_pos(x, y, game.jumping_is_magic, (0)));
}
export function display_jump_positions(on_off) {
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = 0;
    if (on_off) {
        tmp_at((-1), (((S_goodpos) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_goodpos) <= S_trwall) ? ((S_goodpos) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_goodpos) < S_altar) ? (((S_goodpos) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_goodpos) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_goodpos) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_goodpos) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_goodpos) <= S_goodpos) ? (((S_goodpos) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        for (dx = -4; dx <= 4; dx++) {
            for (dy = -4; dy <= 4; dy++) {
                x = dx + game.u.ux;
                y = dy + game.u.uy;
                if (get_valid_jump_position(x, y) && !((x) == game.u.ux && (y) == game.u.uy)) {
                    tmp_at(x, y);
                }
            }
        }
    } else {
        tmp_at((-7), 0);
    }
}
/* 0=Physical, otherwise skill level */
export function jump(magic) {
    let cc = { x: 0, y: 0 };
    /* attempt "jumping" spell if hero has no innate jumping ability */
    if (!magic && !(game.u.uprops[JUMPING].intrinsic || game.u.uprops[JUMPING].extrinsic) && known_spell(SPE_JUMPING) >= spe_Fresh) {
        return spelleffects(SPE_JUMPING, (0), (0));
    }
    if (!magic && ((((game.youmonst.data).mflags1 & 24576) == 24576) || (((game.youmonst.data).mflags1 & 524288) != 0))) {
        /* normally (nolimbs || slithy) implies !Jumping,
           but that isn't necessarily the case for knights */
        You_cant("jump; you have no legs!");
        return 0;
    } else if (!magic && !(game.u.uprops[JUMPING].intrinsic || game.u.uprops[JUMPING].extrinsic)) {
        You_cant("jump very far.");
        return 0;
    } else if (!magic && game.u.usteed && stucksteed((0))) {
        return 0;
    } else if (game.u.uswallow) {
        if (magic) {
            You("bounce around a little.");
            return 1;
        }
        pline("You've got to be kidding!");
        return 0;
    } else if (game.u.uinwater) {
        if (magic) {
            You("swish around a little.");
            return 1;
        }
        pline("This calls for swimming, not jumping!");
        return 0;
    } else if (game.u.ustuck) {
        if (game.u.ustuck.mtame && !(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !game.u.ustuck.mconf) {
            let mtmp = game.u.ustuck;
            set_ustuck(null);
            You("pull free from %s.", mon_nam(mtmp));
            return 1;
        }
        if (magic) {
            You("writhe a little in the grasp of %s!", mon_nam(game.u.ustuck));
            return 1;
        }
        You("cannot escape from %s!", mon_nam(game.u.ustuck));
        return 0;
    } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        if (magic) {
            You("flail around a little.");
            return 1;
        }
        You("don't have enough traction to jump.");
        return 0;
    } else if (!magic && near_capacity() > UNENCUMBERED) {
        You("are carrying too much to jump!");
        return 0;
    } else if (!magic && (game.u.uhunger <= 100 || (acurr(A_STR)) < 6)) {
        You("lack the strength to jump!");
        return 0;
    } else if (!magic && (game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic)) {
        legs_in_no_shape("jumping", game.u.usteed != null);
        return 0;
    } else if (game.u.usteed && game.u.utrap) {
        pline("%s is stuck in a trap.", Monnam(game.u.usteed));
        return 0;
    }
    pline("Where do you want to jump?");
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    game.jumping_is_magic = magic;
    getpos_sethilite(display_jump_positions, get_valid_jump_position);
    if (getpos(cc, (1), "the desired position") < 0) {
        return 2;
    }
    if (!is_valid_jump_pos(cc.x, cc.y, magic, (1))) {
        return 4;
    } else if (game.u.usteed && ((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
        pline("%s isn't capable of jumping in place.", YMonnam(game.u.usteed));
        return 4;
    } else {
        let uc = { x: 0, y: 0 };
        let side = 0;
        let range = 0;
        let temp = 0;
        let wastrapped = (0);
        if (game.u.utrap) {
            wastrapped = (1);
            switch (game.u.utraptype) {
                case TT_BEARTRAP:
                    side = rn2(3) ? 131072 : 262144;
                    You("rip yourself free of the bear trap!  Ouch!");
                    losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(10)) + 1) / 2)) : (rnd(10))), "jumping out of a bear trap", 1);
                    set_wounded_legs(side, (rn2(1000) + (500)));
                    break;
                case TT_PIT:
                    You("leap from the pit!");
                    break;
                case TT_WEB:
                    You("tear the web apart as you pull yourself free!");
                    deltrap(t_at(game.u.ux, game.u.uy));
                    break;
                case TT_LAVA:
                    You("pull yourself above the %s!", hliquid("lava"));
                    cc.x = game.u.ux , cc.y = game.u.uy;
                    break;
                case TT_BURIEDBALL:
                case TT_INFLOOR:
                    You("strain your %s, but you're still %s.", makeplural(body_part(LEG)), (game.u.utraptype == TT_INFLOOR) ? "stuck in the floor" : "attached to the buried ball");
                    set_wounded_legs(131072, (rn2(10) + (11)));
                    set_wounded_legs(262144, (rn2(10) + (11)));
                    return 1;
                default:
                    impossible("Jumping out of strange trap (%d)?", game.u.utraptype);
                    break;
            }
            /* if we reach here, hero is no longer trapped */
            reset_utrap((1));
        }
        if (((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
            /* jumping on hero's same spot doesn't use walk_path() and isn't
           allowed when riding (handled above) */
            let t = null;
            if (wastrapped) {
                /* escaping from a trap takes precedence over jumping in place */
                morehungry(rnd(10));
                return 1;
            }
            if ((t = t_at(cc.x, cc.y)) != null) {
                /* jumping in place on a trap will trigger it */
                You("jump up and %s back down.", !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) ? "come" : "fly");
                dotrap(t, 1 | 16);
                return 1;
            }
            /* jumping in place takes no time and doesn't exercise anything */
            You("%s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "hop up and down a bit" : "decide not to jump after all");
            return 0;
        }
        /*
         * Check the path from uc to cc, calling hurtle_step at each
         * location.  The final position actually reached will be
         * in cc.
         */
        uc.x = game.u.ux;
        uc.y = game.u.uy;
        /* calculate max(abs(dx), abs(dy)) as the range */
        range = cc.x - uc.x;
        if (range < 0) {
            range = -range;
        }
        temp = cc.y - uc.y;
        if (temp < 0) {
            temp = -temp;
        }
        if (range < temp) {
            range = temp;
        }
        walk_path(uc, cc, hurtle_jump, range);
        /* hurtle_jump -> hurtle_step results in <u.ux,u.uy> == <cc.x,cc.y>
         * and usually moves the ball if punished, but does not handle all
         * the effects of landing on the final position.
         */
        teleds(cc.x, cc.y, 0);
        nomul(-1);
        game.multi_reason = "jumping around";
        game.nomovemsg = "";
        morehungry(rnd(25));
        return 1;
    }
}
export function tinnable(corpse) {
    if (corpse.oeaten) {
        return 0;
    }
    if (!game.mons[corpse.corpsenm].cnutrit) {
        return 0;
    }
    return 1;
}
const __use_tinning_kit_you_buy_it = "You tin it, you bought it!";
export function use_tinning_kit(obj) {
    let corpse = null;
    let can = null;
    let mptr = null;
    if (obj.spe <= 0) {
        /* This takes only 1 move.  If this is to be changed to take many
     * moves, we've got to deal with decaying corpses...
     */
        You("seem to be out of tins.");
        return;
    }
    if (!(corpse = floorfood("tin", 2))) {
        return;
    }
    if (corpse.oeaten) {
        You("cannot tin %s which is partly eaten.", c_common_strings.c_something);
        return;
    }
    mptr = game.mons[corpse.corpsenm];
    if (((mptr) == game.mons[PM_COCKATRICE] || (mptr) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !game.uarmg) {
        let kbuf = '';
        let corpse_name = an(cxname(corpse));
        if (poly_when_stoned(game.youmonst.data)) {
            You("tin %s without wearing gloves.", corpse_name);
            kbuf = '';
        } else {
            pline("Tinning %s without wearing gloves is a fatal mistake...", corpse_name);
            kbuf = sprintf(kbuf, "trying to tin %s without gloves", corpse_name);
        }
        instapetrify(kbuf);
    }
    if (((mptr) == game.mons[PM_DEATH] || (mptr) == game.mons[PM_FAMINE] || (mptr) == game.mons[PM_PESTILENCE])) {
        if (revive_corpse(corpse)) {
            verbalize("Yes...  But War does not preserve its enemies...");
        } else {
            pline_The("corpse evades your grasp.");
        }
        return;
    }
    if (mptr.cnutrit == 0) {
        pline("That's too insubstantial to tin.");
        return;
    }
    consume_obj_charge(obj, (1));
    if ((can = mksobj(TIN, (0), (0))) != null) {
        can.corpsenm = corpse.corpsenm;
        can.cursed = obj.cursed;
        can.blessed = obj.blessed;
        can.owt = weight(can);
        can.known = 1;
        /* Mark tinned tins. No spinach allowed... */
        set_tin_variety(can, 1);
        if (((corpse).where == 3)) {
            if (corpse.unpaid) {
                let shkp = shop_keeper(in_rooms(game.u.ux, game.u.uy, SHOPBASE));
                ;
                verbalize(__use_tinning_kit_you_buy_it);
            }
            useup(corpse);
        } else {
            if (costly_spot(corpse.ox, corpse.oy) && !corpse.no_charge) {
                let shkp = shop_keeper(in_rooms(corpse.ox, corpse.oy, SHOPBASE));
                ;
                verbalize(__use_tinning_kit_you_buy_it);
            }
            useupf(corpse, 1);
        }
        hold_another_object(can, "You make, but cannot pick up, %s.", doname(can), null);
    } else {
        impossible("Tinning failed.");
    }
}
export function use_unicorn_horn(optr) {
    /* number of properties we're dealing with */
    let idx = 0;
    let val = 0;
    let val_limit = 0;
    let trouble_count = 0;
    let unfixable_trbl = 0;
    let did_prop = 0;
    let trouble_list = [0, 0, 0, 0, 0, 0, 0];
    let obj = (optr ? optr : null);
    if (obj && obj.cursed) {
        let lcount = (rn2(90) + (10));
        switch (Math.trunc(rn2(13) / 2)) {
            case 0:
                make_sick((game.u.uprops[SICK].intrinsic & 16777215) ? Math.trunc((game.u.uprops[SICK].intrinsic & 16777215) / 3) + 1 : (rn2((acurr(A_CON))) + (20)), xname(obj), (1), 2);
                break;
            case 1:
                make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + lcount, (1));
                break;
            case 2:
                if (!game.u.uprops[CONFUSION].intrinsic) {
                    You("suddenly feel %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "trippy" : "confused");
                }
                make_confused((game.u.uprops[CONFUSION].intrinsic & 16777215) + lcount, (1));
                break;
            case 3:
                make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + lcount, (1));
                break;
            case 4:
                if (game.u.uprops[VOMITING].intrinsic) {
                    vomit();
                } else {
                    make_vomiting(14, (0));
                }
                break;
            case 5:
                make_hallucinated((game.u.uprops[HALLUC].intrinsic & 16777215) + lcount, (1), 0);
                break;
            case 6:
                if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    pline("%s", c_common_strings.c_nothing_seems_to_happen);
                }
                make_deaf((game.u.uprops[DEAF].intrinsic & 16777215) + lcount, (1));
                break;
        }
        return;
    }
    trouble_count = unfixable_trbl = did_prop = 0;
    /* collect property troubles */
    if ((((game.u.uprops[SICK].intrinsic) && !((game.u.uprops[SICK].intrinsic) & ~16777215)) ? ((game.u.uprops[SICK].intrinsic) & 16777215) : 0)) {
        trouble_list[trouble_count++] = (SICK);
    }
    if ((((game.u.uprops[BLINDED].intrinsic) && !((game.u.uprops[BLINDED].intrinsic) & ~16777215)) ? ((game.u.uprops[BLINDED].intrinsic) & 16777215) : 0) > game.u.ucreamed && !(game.u.uswallow && attacktype_fordmg(game.u.ustuck.data, 11, 11))) {
        trouble_list[trouble_count++] = (BLINDED);
    }
    if ((((game.u.uprops[HALLUC].intrinsic) && !((game.u.uprops[HALLUC].intrinsic) & ~16777215)) ? ((game.u.uprops[HALLUC].intrinsic) & 16777215) : 0)) {
        trouble_list[trouble_count++] = (HALLUC);
    }
    if ((((game.u.uprops[VOMITING].intrinsic) && !((game.u.uprops[VOMITING].intrinsic) & ~16777215)) ? ((game.u.uprops[VOMITING].intrinsic) & 16777215) : 0)) {
        trouble_list[trouble_count++] = (VOMITING);
    }
    if ((((game.u.uprops[CONFUSION].intrinsic) && !((game.u.uprops[CONFUSION].intrinsic) & ~16777215)) ? ((game.u.uprops[CONFUSION].intrinsic) & 16777215) : 0)) {
        trouble_list[trouble_count++] = (CONFUSION);
    }
    if ((((game.u.uprops[STUNNED].intrinsic) && !((game.u.uprops[STUNNED].intrinsic) & ~16777215)) ? ((game.u.uprops[STUNNED].intrinsic) & 16777215) : 0)) {
        trouble_list[trouble_count++] = (STUNNED);
    }
    if ((((game.u.uprops[DEAF].intrinsic) && !((game.u.uprops[DEAF].intrinsic) & ~16777215)) ? ((game.u.uprops[DEAF].intrinsic) & 16777215) : 0)) {
        trouble_list[trouble_count++] = (DEAF);
    }
    if (trouble_count == 0) {
        pline("%s", c_common_strings.c_nothing_happens);
        return;
    } else if (trouble_count > 1) {
        shuffle_int_array(trouble_list, trouble_count);
    }
    /*
     *  Chances for number of troubles to be fixed
     *               0      1      2      3      4      5      6      7
     *   blessed:  22.7%  22.7%  19.5%  15.4%  10.7%   5.7%   2.6%   0.8%
     *  uncursed:  35.4%  35.4%  22.9%   6.3%    0      0      0      0
     */
    val_limit = rn2(d(2, (obj && obj.blessed) ? 4 : 2));
    if (val_limit > trouble_count) {
        val_limit = trouble_count;
    }
    for (val = 0; val < val_limit; val++) {
        /* fix [some of] the troubles */
        idx = trouble_list[val];
        switch (idx) {
            case SICK:
                make_sick(0, null, (1), 3);
                did_prop++;
                break;
            case BLINDED:
                make_blinded(game.u.ucreamed, (1));
                did_prop++;
                break;
            case HALLUC:
                make_hallucinated(0, (1), 0);
                did_prop++;
                break;
            case VOMITING:
                make_vomiting(0, (1));
                did_prop++;
                break;
            case CONFUSION:
                make_confused(0, (1));
                did_prop++;
                break;
            case STUNNED:
                make_stunned(0, (1));
                did_prop++;
                break;
            case DEAF:
                make_deaf(0, (1));
                did_prop++;
                break;
            default:
                impossible("use_unicorn_horn: bad trouble? (%d)", idx);
                break;
        }
    }
    if (did_prop) {
        game.disp.botl = (1);
    } else {
        pline("%s", c_common_strings.c_nothing_seems_to_happen);
    }
}
/*
 * Timer callback routine: turn figurine into monster
 */
export function fig_transform(arg, timeout) {
    let figurine = arg.a_obj;
    let mtmp = null;
    let cc = { x: 0, y: 0 };
    let cansee_spot = 0;
    let silent = 0;
    let okay_spot = 0;
    let redraw = (0);
    let suppress_see = (0);
    let monnambuf = '';
    let carriedby = '';
    if (!figurine) {
        impossible("null figurine in fig_transform()");
        return;
    }
    silent = (timeout != game.moves);
    okay_spot = get_obj_location(figurine, { get value() { return cc.x; }, set value(_v) { cc.x = _v; } }, { get value() { return cc.y; }, set value(_v) { cc.y = _v; } }, 0);
    if (figurine.where == 3 || figurine.where == 4) {
        okay_spot = enexto(cc, cc.x, cc.y, game.mons[figurine.corpsenm]);
    }
    if (!okay_spot || !figurine_location_checks(figurine, cc, (1))) {
        /* reset the timer to try again later */
        start_timer(rnd(5000), TIMER_OBJECT, FIG_TRANSFORM, obj_to_any(figurine));
        return;
    }
    cansee_spot = ((game.viz_array[cc.y][cc.x] & 2) != 0);
    mtmp = make_familiar(figurine, cc.x, cc.y, (1));
    if (mtmp) {
        let and_vanish = '';
        let mshelter = game.level.objects[mtmp.mx][mtmp.my];
        monnambuf = sprintf(monnambuf, "%s", an(m_monnam(mtmp)));
        /* [m_monnam() yields accurate mon type, overriding hallucination] */
        and_vanish = '';
        if ((mtmp.minvis && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) || (mtmp.data.mlet == S_MIMIC && ((mtmp).m_ap_type & 7) != M_AP_NOTHING)) {
            suppress_see = (1);
        }
        if (mtmp.mundetected) {
            if ((((mtmp.data).mflags1 & 128) != 0) && mshelter) {
                and_vanish = sprintf(and_vanish, " and %s under %s", locomotion(mtmp.data, "crawl"), doname(mshelter));
            } else if (mtmp.data.mlet == S_MIMIC || mtmp.data.mlet == S_EEL) {
                suppress_see = (1);
            } else {
                and_vanish = strcpy(and_vanish, " and vanish");
            }
        }
        switch (figurine.where) {
            case 3:
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || suppress_see) {
                    You_feel("%s %s from your pack!", c_common_strings.c_something, locomotion(mtmp.data, "drop"));
                } else {
                    You_see("%s %s out of your pack%s!", monnambuf, locomotion(mtmp.data, "drop"), and_vanish);
                }
                break;
            case 1:
                if (cansee_spot && !silent) {
                    set_msg_xy(cc.x, cc.y);
                    if (suppress_see) {
                        pline("%s suddenly vanishes!", an(xname(figurine)));
                    } else {
                        You_see("a figurine transform into %s%s!", monnambuf, and_vanish);
                    }
                    /* update figurine's map location */
                    redraw = (1);
                }
                break;
            case 4:
                if (cansee_spot && !silent && !suppress_see) {
                    let mon = null;
                    mon = figurine.v.v_ocarry;
                    /* figurine carrying monster might be invisible */
                    if (canseemon(figurine.v.v_ocarry) && (!mon.wormno || ((game.viz_array[mon.my][mon.mx] & 2) != 0))) {
                        carriedby = sprintf(carriedby, "%s pack", s_suffix(a_monnam(mon)));
                    } else if (is_pool(mon.mx, mon.my)) {
                        carriedby = strcpy(carriedby, "empty water");
                    } else {
                        carriedby = strcpy(carriedby, "thin air");
                    }
                    You_see("%s %s out of %s%s!", monnambuf, locomotion(mtmp.data, "drop"), carriedby, and_vanish);
                }
                break;
            default:
                impossible("figurine came to life where? (%d)", figurine.where);
                break;
        }
    }
    if (((figurine).where == 3)) {
        useup(figurine);
    } else {
        obj_extract_self(figurine);
        obfree(figurine, null);
    }
    if (redraw) {
        newsym(cc.x, cc.y);
    }
}
export function figurine_location_checks(obj, cc, quietly) {
    let x = 0;
    let y = 0;
    if (((obj).where == 3) && game.u.uswallow) {
        if (!quietly) {
            You("don't have enough room in here.");
        }
        return (0);
    }
    x = cc ? cc.x : game.u.ux;
    y = cc ? cc.y : game.u.uy;
    if (!isok(x, y)) {
        if (!quietly) {
            You("cannot put the figurine there.");
        }
        return (0);
    }
    if (((game.level.locations[x][y].typ) < POOL) && !((((game.mons[obj.corpsenm]).mflags1 & 8) != 0) && may_passwall(x, y))) {
        if (!quietly) {
            You("cannot place a figurine in %s!", ((game.level.locations[x][y].typ) == TREE || (game.level.flags.arboreal && (game.level.locations[x][y].typ) == STONE)) ? "a tree" : "solid rock");
        }
        return (0);
    }
    if (sobj_at(BOULDER, x, y) && !(((game.mons[obj.corpsenm]).mflags1 & 8) != 0) && !(((game.mons[obj.corpsenm]).mflags2 & 134217728) != 0)) {
        if (!quietly) {
            You("cannot fit the figurine on the boulder.");
        }
        return (0);
    }
    return (1);
}
export function use_figurine(optr) {
    let obj = optr.value;
    let x = 0;
    let y = 0;
    let cc = { x: 0, y: 0 };
    if (game.u.uswallow) {
        /* can't activate a figurine while swallowed */
        if (!figurine_location_checks(obj, null, (0))) {
            return 0;
        }
    }
    if (!getdir(null)) {
        game.context.move = game.multi = 0;
        return 2;
    }
    x = game.u.ux + game.u.dx;
    y = game.u.uy + game.u.dy;
    cc.x = x;
    cc.y = y;
    /* Passing FALSE arg here will result in messages displayed */
    if (!figurine_location_checks(obj, cc, (0))) {
        return 1;
    }
    You("%s and it %stransforms.", (game.u.dx || game.u.dy) ? "set the figurine beside you" : ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || is_pool(cc.x, cc.y)) ? "release the figurine" : (game.u.dz < 0 ? "toss the figurine into the air" : "set the figurine on the ground"), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "supposedly " : "");
    make_familiar(obj, cc.x, cc.y, (0));
    stop_timer(FIG_TRANSFORM, obj_to_any(obj));
    useup(obj);
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        map_invisible(cc.x, cc.y);
    }
    optr.value = null;
    return 1;
}
/* getobj callback for object to apply grease to */
export function grease_ok(obj) {
    if (!obj) {
        return GETOBJ_SUGGEST;
    }
    /* note: if changing the list of ungreasable objects, also change
       special_throne_effect in sit.c */
    if (obj.oclass == COIN_CLASS) {
        return GETOBJ_EXCLUDE;
    }
    if (inaccessible_equipment(obj, null, (0))) {
        return GETOBJ_EXCLUDE_INACCESS;
    }
    return GETOBJ_SUGGEST;
}
export function use_grease(obj) {
    let otmp = null;
    if (game.u.uprops[GLIB].intrinsic) {
        pline("%s from your %s.", Tobjnam(obj, "slip"), fingers_or_gloves((0)));
        dropx(obj);
        return 1;
    }
    if (obj.spe > 0) {
        let oldglib = 0;
        if ((obj.cursed || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) && !rn2(2)) {
            consume_obj_charge(obj, (1));
            pline("%s from your %s.", Tobjnam(obj, "slip"), fingers_or_gloves((0)));
            dropx(obj);
            return 1;
        }
        otmp = getobj("grease", grease_ok, 2);
        if (!otmp) {
            return 2;
        }
        if (inaccessible_equipment(otmp, "grease", (0))) {
            return 0;
        }
        consume_obj_charge(obj, (1));
        oldglib = (game.u.uprops[GLIB].intrinsic & 16777215);
        if (otmp != game.hands_obj) {
            You("cover %s with a thick layer of grease.", yname(otmp));
            otmp.greased = 1;
            if (obj.cursed && !(((game.youmonst.data).mflags1 & 8192) != 0)) {
                make_glib(oldglib + (rn2(6) + (10)));
                pline("Some of the grease gets all over your %s.", fingers_or_gloves((1)));
            }
        } else {
            make_glib(oldglib + (rn2(11) + (5)));
            You("coat your %s with grease.", fingers_or_gloves((1)));
        }
    } else {
        if (obj.known) {
            pline("%s empty.", Tobjnam(obj, "are"));
        } else {
            pline("%s to be empty.", Tobjnam(obj, "seem"));
        }
    }
    update_inventory();
    return 1;
}
/* getobj callback for object to rub on a known touchstone */
export function touchstone_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    /* Gold being suggested as a rub target is questionable - it fits the
     * real-world historic use of touchstones, but doesn't do anything
     * significant in the game. */
    if (obj.oclass == COIN_CLASS) {
        return GETOBJ_SUGGEST;
    }
    /* don't suggest identified gems */
    if (obj.oclass == GEM_CLASS && !(obj.dknown && game.objects[obj.otyp].oc_name_known)) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_DOWNPLAY;
}
/* touchstones - by Ken Arnold */
const __use_stone_scritch = "\"scritch, scritch\"";
export function use_stone(tstone) {
    let obj = null;
    let do_scratch = 0;
    let streak_color = null;
    let stonebuf = '';
    let oclass = 0;
    let known = 0;
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        observe_object(tstone);
    }
    known = (tstone.otyp == TOUCHSTONE && tstone.dknown && game.objects[TOUCHSTONE].oc_name_known);
    stonebuf = sprintf(stonebuf, "rub on the stone%s", (((tstone.quan) == 1) ? "" : "s"));
    /* when the touchstone is fully known, don't bother listing extra
       junk as likely candidates for rubbing */
    if ((obj = getobj(stonebuf, known ? touchstone_ok : any_obj_ok, 2)) == null) {
        return 2;
    }
    if (obj == tstone && obj.quan == 1) {
        You_cant("rub %s on itself.", the(xname(obj)));
        return 0;
    }
    if (tstone.otyp == TOUCHSTONE && tstone.cursed && obj.oclass == GEM_CLASS && !((obj).otyp == LUCKSTONE || (obj).otyp == LOADSTONE || (obj).otyp == FLINT || (obj).otyp == TOUCHSTONE) && !obj_resists(obj, 80, 100)) {
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            You_feel("something shatter.");
        } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            pline("Oh, wow, look at the pretty shards.");
        } else {
            pline("A sharp crack shatters %s%s.", (obj.quan > 1) ? "one of " : "", the(xname(obj)));
        }
        useup(obj);
        return 1;
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        pline(__use_stone_scritch);
        return 1;
    } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        pline("Oh wow, man: Fractals!");
        return 1;
    }
    do_scratch = (0);
    streak_color = null;
    oclass = obj.oclass;
    /* prevent non-gemstone rings from being treated like gems */
    if (oclass == RING_CLASS && game.objects[obj.otyp].oc_material != GEMSTONE && game.objects[obj.otyp].oc_material != MINERAL) {
        oclass = RANDOM_CLASS;
    }
    switch (oclass) {
        case GEM_CLASS:
        case RING_CLASS:
            if (tstone.otyp != TOUCHSTONE) {
                /* something that's neither gem nor ring */
                /* these have class-specific handling below */
                do_scratch = (1);
            } else if (obj.oclass == GEM_CLASS && (tstone.blessed || (!tstone.cursed && ((game.urole.mnum == (PM_ARCHEOLOGIST)) || (game.urace.mnum == (PM_GNOME)))))) {
                discover_object((TOUCHSTONE), (1), (1), (1));
                discover_object((obj.otyp), (1), (1), (1));
                prinv(null, obj, 0);
                return 1;
            } else {
                if (game.objects[obj.otyp].oc_material == GLASS) {
                    /* either a ring or the touchstone was not effective */
                    do_scratch = (1);
                    break;
                }
            }
            streak_color = c_obj_colors[game.objects[obj.otyp].oc_color];
            break;
        default:
            switch (game.objects[obj.otyp].oc_material) {
                case CLOTH:
                    pline("%s a little more polished now.", Tobjnam(tstone, "look"));
                    return 1;
                case LIQUID:
                    if (!obj.known) {
                        You("must think this is a wetstone, do you?");
                    } else {
                        pline("%s a little wetter now.", Tobjnam(tstone, "are"));
                    }
                    return 1;
                case WAX:
                    streak_color = "waxy";
                    break;
                case WOOD:
                    streak_color = "wooden";
                    break;
                case GOLD:
                    do_scratch = (1);
                    streak_color = "golden";
                    break;
                case SILVER:
                    do_scratch = (1);
                    streak_color = "silvery";
                    break;
                default:
                    if ((game.objects[(obj).otyp].oc_material <= LEATHER || (obj).otyp == RUBBER_HOSE)) {
                        streak_color = c_obj_colors[game.objects[obj.otyp].oc_color];
                    /* Objects passing the is_flimsy() test will not
               scratch a stone.  They will leave streaks on
               non-touchstones and touchstones alike. */
                    } else {
                        do_scratch = (tstone.otyp != TOUCHSTONE);
                    }
                    break;
            }
            break;
    }
    stonebuf = sprintf(stonebuf, "stone%s", (((tstone.quan) == 1) ? "" : "s"));
    if (do_scratch) {
        You("make %s%sscratch marks on the %s.", streak_color ? streak_color : "", streak_color ? " " : "", stonebuf);
    } else if (streak_color) {
        You_see("%s streaks on the %s.", streak_color, stonebuf);
    } else {
        pline(__use_stone_scritch);
    }
    return 1;
}
export function reset_trapset() {
    game.trapinfo.tobj = null;
    game.trapinfo.force_bungle = 0;
}
/* Place a landmine/bear trap.  Helge Hafting */
export function use_trap(otmp) {
    let ttyp = 0;
    let tmp = 0;
    let what = null;
    let buf = '';
    let levtyp = game.level.locations[game.u.ux][game.u.uy].typ;
    let occutext = "setting the trap";
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        what = "without hands";
    } else if (game.u.uprops[STUNNED].intrinsic) {
        what = "while stunned";
    } else if (game.u.uswallow) {
        what = (dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null) ? "while swallowed" : "while engulfed";
    } else if ((game.u.uinwater)) {
        what = "underwater";
    } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        what = "while levitating";
    } else if (is_pool(game.u.ux, game.u.uy)) {
        what = "in water";
    } else if (is_lava(game.u.ux, game.u.uy)) {
        what = "in lava";
    } else if (On_stairs(game.u.ux, game.u.uy)) {
        let stway = stairway_at(game.u.ux, game.u.uy);
        what = stway.isladder ? "on the ladder" : "on the stairs";
    } else if (((levtyp) >= STAIRS && (levtyp) <= ALTAR) || ((levtyp) < POOL) || closed_door(game.u.ux, game.u.uy) || t_at(game.u.ux, game.u.uy)) {
        what = "here";
    } else if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        what = (levtyp == AIR) ? "in midair" : (levtyp == CLOUD) ? "in a cloud" : "in this place";
    }
    if (what) {
        /* Air/Water Plane catch-all */
        You_cant("set a trap %s!", what);
        /* trap object might have been stolen or hero teleported */
        reset_trapset();
        return;
    }
    ttyp = (otmp.otyp == LAND_MINE) ? LANDMINE : BEAR_TRAP;
    if (otmp == game.trapinfo.tobj && ((game.trapinfo.tx) == game.u.ux && (game.trapinfo.ty) == game.u.uy)) {
        You("resume setting %s%s.", shk_your(buf, otmp), trapname(ttyp, (0)));
        set_occupation(set_trap, occutext, 0);
        return;
    }
    game.trapinfo.tobj = otmp;
    game.trapinfo.tx = game.u.ux , game.trapinfo.ty = game.u.uy;
    tmp = (acurr(A_DEX));
    game.trapinfo.time_needed = (tmp > 17) ? 2 : (tmp > 12) ? 3 : (tmp > 7) ? 4 : 5;
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        game.trapinfo.time_needed *= 2;
    }
    tmp = (acurr(A_STR));
    if (ttyp == BEAR_TRAP && tmp < 18) {
        game.trapinfo.time_needed += (tmp > 12) ? 1 : (tmp > 7) ? 2 : 4;
    }
    if (game.u.usteed && (game.u.weapon_skills[P_RIDING].skill) < P_BASIC) {
        /*[fumbling and/or confusion and/or cursed object check(s)
       should be incorporated here instead of in set_trap]*/
        let chance = 0;
        if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || otmp.cursed) {
            chance = (rnl(10) > 3);
        } else {
            chance = (rnl(10) > 5);
        }
        You("aren't very skilled at reaching from %s.", mon_nam(game.u.usteed));
        buf = sprintf(buf, "Continue your attempt to set %s?", the(trapname(ttyp, (0))));
        if (yn_function(buf, ynchars, 110, (1)) == 121) {
            if (chance) {
                switch (ttyp) {
                    case LANDMINE:
                        game.trapinfo.time_needed = 0;
                        game.trapinfo.force_bungle = (1);
                        break;
                    /* drop it without arming it */
                    case BEAR_TRAP:
                        reset_trapset();
                        You("drop %s!", the(trapname(ttyp, (0))));
                        dropx(otmp);
                        return;
                }
            }
        } else {
            reset_trapset();
            return;
        }
    }
    You("begin setting %s%s.", shk_your(buf, otmp), trapname(ttyp, (0)));
    use_unpaid_trapobj(otmp, game.u.ux, game.u.uy);
    set_occupation(set_trap, occutext, 0);
    return;
}
/* occupation routine called each turn while arming a beartrap or landmine */
export function set_trap() {
    let otmp = game.trapinfo.tobj;
    let ttmp = null;
    let ttyp = 0;
    if (!otmp || !((otmp).where == 3) || !((game.trapinfo.tx) == game.u.ux && (game.trapinfo.ty) == game.u.uy)) {
        reset_trapset();
        return 0;
    }
    if (--game.trapinfo.time_needed > 0) {
        return 1;
    }
    ttyp = (otmp.otyp == LAND_MINE) ? LANDMINE : BEAR_TRAP;
    ttmp = maketrap(game.u.ux, game.u.uy, ttyp);
    if (ttmp) {
        ttmp.madeby_u = 1;
        feeltrap(ttmp);
        if (in_rooms(game.u.ux, game.u.uy, SHOPBASE)) {
            add_damage(game.u.ux, game.u.uy, 0);
        }
        if (!game.trapinfo.force_bungle) {
            You("finish arming %s.", the(trapname(ttyp, (0))));
        }
        if (((otmp.cursed || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) && (rnl(10) > 5)) || game.trapinfo.force_bungle) {
            dotrap(ttmp, (game.trapinfo.force_bungle ? 4 : 0));
        }
    } else {
        Your("trap setting attempt fails.");
    }
    useup(otmp);
    reset_trapset();
    return 0;
}
export function use_whip(obj) {
    let buf = '';
    let mtmp = null;
    let otmp = null;
    let rx = 0;
    let ry = 0;
    let proficient = 0;
    let res = 0;
    let msg_slipsfree = "The bullwhip slips free.";
    let msg_snap = "Snap!";
    if (obj != game.uwep) {
        if (wield_tool(obj, "lash")) {
            /* "cast": grappling hook evolved from slash'em's fishing pole */
            cmdq_add_ec(CQ_CANNED, doapply);
            cmdq_add_key(CQ_CANNED, obj.invlet);
            return 1;
        }
        return 0;
    }
    if (!getdir(null)) {
        return (res | 2);
    }
    if (game.u.uswallow) {
        mtmp = game.u.ustuck;
        rx = mtmp.mx;
        ry = mtmp.my;
    } else {
        confdir((0));
        rx = game.u.ux + game.u.dx;
        ry = game.u.uy + game.u.dy;
        if (!isok(rx, ry)) {
            You("miss.");
            return res;
        }
        mtmp = (game.level.monsters[rx][ry]);
    }
    /* fake some proficiency checks */
    proficient = 0;
    if ((game.urole.mnum == (PM_ARCHEOLOGIST))) {
        ++proficient;
    }
    if ((acurr(A_DEX)) < 6) {
        proficient--;
    } else if ((acurr(A_DEX)) >= 14) {
        proficient += ((acurr(A_DEX)) - 14);
    }
    if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) {
        --proficient;
    }
    if (proficient > 3) {
        proficient = 3;
    }
    if (proficient < 0) {
        proficient = 0;
    }
    const __whipattack = () => {
        otmp = null;
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            /* if monster is unseen, can't attempt to disarm it */
            let spotitnow = 0;
            mtmp.mundetected = 0;
            /* check visibility again after mundetected=0 in case being
               brought out of hiding has exposed it (might not if hero is
               blind or formerly hidden monster is also invisible) */
            spotitnow = (canseemon(mtmp) || sensemon(mtmp));
            if (spotitnow || !((game.level.locations[rx][ry].glyph) == GLYPH_INVIS_OFF)) {
                pline("%s is there that you %s.", !spotitnow ? "A monster" : Amonnam(mtmp), !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "couldn't see" : "hadn't noticed");
                if (!spotitnow) {
                    map_invisible(rx, ry);
                } else {
                    newsym(rx, ry);
                }
            }
        } else {
            /* monster is known so if it is wielding something, try to
               disarm it rather than make a direct attack */
            otmp = ((mtmp).mw);
        }
        if (otmp) {
            let onambuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let mon_hand = null;
            let gotit = proficient && (!(game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || !rn2(10));
            onambuf = strcpy(onambuf, cxname(otmp));
            if (gotit) {
                mon_hand = mbodypart(mtmp, HAND);
                if (((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_big)) {
                    mon_hand = makeplural(mon_hand);
                }
            } else {
                mon_hand = null;
            }
            You("wrap your bullwhip around %s.", yname(otmp));
            if (gotit && mwelded(otmp)) {
                pline("%s welded to %s %s%c", (otmp.quan == 1) ? "It is" : "They are", (genders[pronoun_gender(mtmp, 2)].his), mon_hand, !otmp.bknown ? 33 : 46);
                set_bknown(otmp, 1);
                gotit = (0);
            }
            if (gotit) {
                obj_extract_self(otmp);
                possibly_unwield(mtmp, (0));
                setmnotwielded(mtmp, otmp);
                switch (rn2(proficient + 1)) {
                    case 2:
                        You("yank %s to the %s!", yname(otmp), surface(game.u.ux, game.u.uy));
                        place_object(otmp, game.u.ux, game.u.uy);
                        stackobj(otmp);
                        break;
                    case 3:
                        You("snatch %s!", yname(otmp));
                        if (otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) && !game.uarmg && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM))) {
                            let kbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            kbuf = strcpy(kbuf, (otmp.quan == 1) ? an(onambuf) : onambuf);
                            pline("Snatching %s is a fatal mistake.", kbuf);
                            /* corpse probably has a rot timer but is now
                           OBJ_FREE; end of game cleanup will panic if
                           it isn't part of current level; plus it would
                           be missing from bones, so put it on the floor */
                            place_object(otmp, game.u.ux, game.u.uy);
                            instapetrify(kbuf);
                            /* life-saved; free the corpse again */
                            obj_extract_self(otmp);
                        }
                        hold_another_object(otmp, "You drop %s!", doname(otmp), null);
                        break;
                    default:
                        You("yank %s from %s %s!", the(onambuf), s_suffix(mon_nam(mtmp)), mon_hand);
                        obj_no_longer_held(otmp);
                        place_object(otmp, mtmp.mx, mtmp.my);
                        stackobj(otmp);
                        break;
                }
            } else {
                pline("%s", msg_slipsfree);
            }
        } else {
            /* mtmp isn't wielding a weapon; attack it */
            let do_snap = (1);
            if (((mtmp).m_ap_type & 7) && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && !sensemon(mtmp)) {
                stumble_onto_mimic(mtmp);
                do_snap = (0);
            } else {
                You("flick your bullwhip towards %s.", mon_nam(mtmp));
            }
            if (proficient && force_attack(mtmp, (0))) {
                return 'early_return';
            }
            if (do_snap) {
                pline("%s", msg_snap);
            }
        }
        /* regardless of mtmp's weapon or hero's proficiency */
        wakeup(mtmp, (1));
        return 'normal';
    };
    if (game.u.uswallow) {
        There("is not enough room to flick your bullwhip.");
    } else if ((game.u.uinwater)) {
        There("is too much resistance to flick your bullwhip.");
    } else if (game.u.dz < 0) {
        You("flick a bug off of the %s.", ceiling(game.u.ux, game.u.uy));
    } else if (!game.u.dz && (((game.level.locations[rx][ry].typ) == WATER) || game.level.locations[rx][ry].typ == LAVAWALL)) {
        You("cause a small splash.");
        if (game.level.locations[rx][ry].typ == LAVAWALL) {
            fire_damage(game.uwep, (0), rx, ry);
        }
        return 1;
    } else if ((!game.u.dx && !game.u.dy) || (game.u.dz > 0)) {
        let dam = 0;
        if (game.u.usteed && !rn2(proficient + 2)) {
            /* Sometimes you hit your steed by mistake */
            You("whip %s!", mon_nam(game.u.usteed));
            kick_steed();
            return 1;
        }
        if (is_pool_or_lava(game.u.ux, game.u.uy) || ((game.level.locations[rx][ry].typ) == WATER) || game.level.locations[rx][ry].typ == LAVAWALL) {
            You("cause a small splash.");
            if (is_lava(game.u.ux, game.u.uy)) {
                fire_damage(game.uwep, (0), game.u.ux, game.u.uy);
            }
            return 1;
        }
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || game.u.usteed || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            /* Have a shot at snaring something on the floor.  A flyer
               can reach the floor so could just pick an item up, but
               allow snagging by whip too. */
            otmp = game.level.objects[game.u.ux][game.u.uy];
            if (otmp && otmp.otyp == CORPSE && (otmp.corpsenm == PM_HORSE || otmp.corpsenm == little_to_big(PM_HORSE) || otmp.corpsenm == big_to_little(PM_HORSE))) {
                pline("Why beat a dead horse?");
                return 1;
            }
            if (otmp && proficient) {
                You("wrap your bullwhip around %s on the %s.", an(singular(otmp, xname)), surface(game.u.ux, game.u.uy));
                if (rnl(6) || pickup_object(otmp, 1, (1)) < 1) {
                    pline("%s", msg_slipsfree);
                }
                return 1;
            }
        }
        dam = rnd(2) + dbon() + obj.spe;
        if (dam <= 0) {
            dam = 1;
        }
        You("hit your %s with your bullwhip.", body_part(FOOT));
        buf = sprintf(buf, "killed %sself with %s bullwhip", (genders[game.flags.female ? 1 : 0].him), (genders[game.flags.female ? 1 : 0].his));
        losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam)), buf, 2);
        return 1;
    } else if (((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || game.u.uprops[GLIB].intrinsic) && !rn2(5)) {
        pline_The("bullwhip slips out of your %s.", body_part(HAND));
        dropx(obj);
    } else if (game.u.utrap && game.u.utraptype == TT_PIT) {
        /*
         * Assumptions:
         *
         * if you're in a pit
         *    - you are attempting to get out of the pit
         *    - if there is no suitable boulder or furniture to target,
         *      target a big monster for that, or if a small or medium
         *      monster is present, attack it
         *      [if both boulder and furniture are present, target the
         *      former because it is on top of the latter]
         * else if you are applying it towards a monster
         *    - if monster is concealed, reveal it and proceed;
         *    - if it was not concealed and is wielding a weapon, attempt
         *      to disarm it;
         *    - otherwise attack it.
         *
         * if you're confused (and thus off the mark)
         *    - you only end up hitting.
         */
        let wrapped_what = sobj_at(BOULDER, rx, ry) ? "a boulder" : ((game.level.locations[rx][ry].typ) >= STAIRS && (game.level.locations[rx][ry].typ) <= ALTAR) ? c_common_strings.c_something : null;
        if (mtmp) {
            /* if a big monster is known to be present, target it in
               preference to boulder or furniture; if any small or medium
               monster is present, or an unseen big one, use the boulder
               or furniture if available, otherwise attack */
            if (((mtmp.data).msize >= 3) && (canseemon(mtmp) || sensemon(mtmp))) {
                wrapped_what = strcpy(buf, mon_nam(mtmp));
            }
            if (!wrapped_what) {
                const __r = __whipattack();
                if (__r === 'early_return') return 1;
                return 1;
            }
        }
        if (wrapped_what) {
            let cc = { x: 0, y: 0 };
            cc.x = rx;
            cc.y = ry;
            You("wrap your bullwhip around %s.", wrapped_what);
            if (proficient && rn2(proficient + 2)) {
                if (!mtmp || enexto(cc, rx, ry, game.youmonst.data)) {
                    You("yank yourself out of the pit!");
                    /* [was after teleds(); do this before
                                        * in case it has no alternative other
                                        * than to put hero in another trap] */
                    reset_utrap((1));
                    teleds(cc.x, cc.y, 1);
                    game.vision_full_recalc = 1;
                }
            } else {
                pline("%s", msg_slipsfree);
            }
            if (mtmp) {
                wakeup(mtmp, (1));
            }
        } else {
            pline("%s", msg_snap);
        }
    } else if (mtmp) {
        const __r = __whipattack();
        if (__r === 'early_return') return 1;
    } else if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        /* it must be air -- water checked above */
        You("snap your whip through thin air.");
    } else {
        pline("%s", msg_snap);
    }
    return 1;
}
const not_enough_room = "There's not enough room here to use that.";
const where_to_hit = "Where do you want to hit?";
const cant_see_spot = "won't hit anything if you can't see that spot.";
const cant_reach = "can't reach that spot from here.";
/* find pos of monster in range, if only one monster */
export function find_poleable_mon(pos) {
    let mtmp = null;
    /* no candidate location yet */
    let mpos = { x: 0, y: 0 };
    let impaired = 0;
    let x = 0;
    let y = 0;
    let lo_x = 0;
    let hi_x = 0;
    let lo_y = 0;
    let hi_y = 0;
    let rt = 0;
    let glyph = 0;
    impaired = (game.u.uprops[CONFUSION].intrinsic || game.u.uprops[STUNNED].intrinsic || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)));
    rt = isqrt(game.polearm_range_max);
    lo_x = ((game.u.ux - rt) > (1) ? (game.u.ux - rt) : (1)) , hi_x = ((game.u.ux + rt) < (80 - 1) ? (game.u.ux + rt) : (80 - 1));
    lo_y = ((game.u.uy - rt) > (0) ? (game.u.uy - rt) : (0)) , hi_y = ((game.u.uy + rt) < (21 - 1) ? (game.u.uy + rt) : (21 - 1));
    for (x = lo_x; x <= hi_x; ++x) {
        for (y = lo_y; y <= hi_y; ++y) {
            if (!get_valid_polearm_position(x, y)) {
                continue;
            }
            glyph = glyph_at(x, y);
            if (!impaired && ((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) && (mtmp = (game.level.monsters[x][y])) != null && (mtmp.mtame || (mtmp.mpeaceful && game.flags.confirm))) {
                continue;
            }
            if ((((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) || ((glyph) == GLYPH_INVIS_OFF) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS)))))) && (!(((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || impaired)) {
                if (mpos.x) {
                    return (0);
                }
                /* more than one candidate location */
                mpos.x = x , mpos.y = y;
            }
        }
    }
    if (!mpos.x) {
        return (0);
    }
    pos.x = mpos.x;
    pos.y = mpos.y;
    return (1);
}
export function get_valid_polearm_position(x, y) {
    let glyph = 0;
    glyph = glyph_at(x, y);
    return (isok(x, y) && dist2((x), (y), game.u.ux, game.u.uy) >= game.polearm_range_min && dist2((x), (y), game.u.ux, game.u.uy) <= game.polearm_range_max && (((game.viz_array[y][x] & 2) != 0) || (((game.viz_array[y][x] & 1) != 0) && (((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) || ((glyph) == GLYPH_INVIS_OFF) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS)))))))));
}
export function display_polearm_positions(on_off) {
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = 0;
    if (on_off) {
        tmp_at((-1), (((S_goodpos) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_goodpos) <= S_trwall) ? ((S_goodpos) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_goodpos) < S_altar) ? (((S_goodpos) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_goodpos) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_goodpos) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_goodpos) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_goodpos) <= S_goodpos) ? (((S_goodpos) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        for (dx = -3; dx <= 3; dx++) {
            for (dy = -3; dy <= 3; dy++) {
                x = dx + game.u.ux;
                y = dy + game.u.uy;
                if (get_valid_polearm_position(x, y)) {
                    tmp_at(x, y);
                }
            }
        }
    } else {
        tmp_at((-7), 0);
    }
}
/*
 * Calculate allowable range (pole's reach is always 2 steps):
 *  unskilled and basic: orthogonal direction, 4..4;
 *  skilled: as basic, plus knight's jump position, 4..5;
 *  expert: as skilled, plus diagonal, 4..8.
 *      ...9...
 *      .85458.
 *      .52125.
 *      9410149
 *      .52125.
 *      .85458.
 *      ...9...
 *  (Note: no roles in NetHack can become expert or better
 *  for polearm skill; Yeoman in slash'em can become expert.)
 */
export function calc_pole_range(min_range, max_range) {
    let typ = uwep_skill_type();
    min_range.value = 4;
    if (typ == P_NONE || (game.u.weapon_skills[typ].skill) <= P_BASIC) {
        max_range.value = 4;
    } else if ((game.u.weapon_skills[typ].skill) == P_SKILLED) {
        max_range.value = 5;
    /* (P_SKILL(typ) >= P_EXPERT) */
    } else {
        max_range.value = 8;
    }
    game.polearm_range_min = min_range.value;
    game.polearm_range_max = max_range.value;
}
/* return TRUE if hero is wielding a polearm and there's
   at least one monster they could hit with it */
export function could_pole_mon() {
    let min_range = 0;
    let max_range = 0;
    let cc = { x: 0, y: 0 };
    let hitm = game.context.polearm.hitmon;
    if (!game.uwep || !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && (game.objects[game.uwep.otyp].oc_subtyp == P_POLEARMS || game.objects[game.uwep.otyp].oc_subtyp == P_LANCE || is_art(game.uwep, ART_SNICKERSNEE)))) {
        return (0);
    }
    calc_pole_range({ get value() { return min_range; }, set value(_v) { min_range = _v; } }, { get value() { return max_range; }, set value(_v) { max_range = _v; } });
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    if (!find_poleable_mon(cc)) {
        if (hitm && !((hitm).mhp < 1) && sensemon(hitm) && dist2(((hitm).mx), ((hitm).my), game.u.ux, game.u.uy) <= max_range && dist2(((hitm).mx), ((hitm).my), game.u.ux, game.u.uy) >= min_range) {
            return (1);
        }
    } else {
        return (1);
    }
    return (0);
}
/* was Snickersnee used to attack at distance this turn already? */
export function snickersnee_used_dist_attk(obj) {
    if (obj && obj == game.uwep && is_art(game.uwep, ART_SNICKERSNEE) && game.context.snickersnee_turn == game.moves) {
        return (1);
    }
    return (0);
}
/* Distance attacks by pole-weapons */
export function use_pole(obj, autohit) {
    let thump = "Thump!  Your blow bounces harmlessly off the %s.";
    let res = 0;
    let max_range = 0;
    let min_range = 0;
    let glyph = 0;
    let cc = { x: 0, y: 0 };
    let mtmp = null;
    let hitm = game.context.polearm.hitmon;
    let freehit = (0);
    if (game.u.uswallow) {
        /* Are you allowed to use the pole? */
        /* Are you allowed to use the hook? */
        pline(not_enough_room);
        return 0;
    }
    if (obj != game.uwep) {
        if (wield_tool(obj, "swing")) {
            cmdq_add_ec(CQ_CANNED, doapply);
            cmdq_add_key(CQ_CANNED, obj.invlet);
            return 1;
        }
        return 0;
    }
    calc_pole_range({ get value() { return min_range; }, set value(_v) { min_range = _v; } }, { get value() { return max_range; }, set value(_v) { max_range = _v; } });
    if (!autohit) {
        pline(where_to_hit);
    }
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    if (!find_poleable_mon(cc) && hitm && !((hitm).mhp < 1) && sensemon(hitm) && dist2(((hitm).mx), ((hitm).my), game.u.ux, game.u.uy) <= max_range && dist2(((hitm).mx), ((hitm).my), game.u.ux, game.u.uy) >= min_range) {
        cc.x = hitm.mx;
        cc.y = hitm.my;
    }
    if (!autohit) {
        getpos_sethilite(display_polearm_positions, get_valid_polearm_position);
        if (getpos(cc, (1), "the spot to hit") < 0) {
            return (res | 2);
        }
    }
    glyph = glyph_at(cc.x, cc.y);
    if (dist2((cc.x), (cc.y), game.u.ux, game.u.uy) > max_range) {
        pline("Too far!");
        return 4;
    } else if (dist2((cc.x), (cc.y), game.u.ux, game.u.uy) < min_range) {
        if (autohit && ((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
            pline("Don't know what to hit.");
        } else {
            pline("Too close!");
        }
        return 4;
    } else if (!((game.viz_array[cc.y][cc.x] & 2) != 0) && !(((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) || ((glyph) == GLYPH_INVIS_OFF) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))))) {
        You(cant_see_spot);
        return 4;
    } else if (!((game.viz_array[cc.y][cc.x] & 1) != 0)) {
        You(cant_reach);
        return 4;
    }
    game.context.polearm.hitmon = null;
    /* Attack the monster there */
    game.bhitpos = cc;
    if ((mtmp = (game.level.monsters[game.bhitpos.x][game.bhitpos.y])) != null) {
        if (attack_checks(mtmp, game.uwep)) {
            return res | (game.context.move ? 1 : 0);
        }
        if (overexertion()) {
            return 1;
        }
        /* burn nutrition; maybe pass out */
        game.context.polearm.hitmon = mtmp;
        if (snickersnee_used_dist_attk(obj)) {
            /* no, abort the attack attempt; result depends on
               res: 1 => polearm became wielded, 0 => already wielded;
               svc.context.move: 1 => discovered hidden monster at target spot,
               0 => answered 'n' to "Really attack?" prompt */
            pline_The("blade doesn't reach there!");
            return 4;
        }
        check_caitiff(mtmp);
        game.notonhead = (game.bhitpos.x != mtmp.mx || game.bhitpos.y != mtmp.my);
        if (obj == game.uwep && is_art(game.uwep, ART_SNICKERSNEE)) {
            /* Snickersnee allows one free hit from a distance per turn */
            freehit = (game.moves != game.context.snickersnee_turn);
            game.context.snickersnee_turn = game.moves;
            if (freehit && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                pline("Shkinng!");
            }
        }
        thitmonst(mtmp, game.uwep);
    } else if ((((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) && sobj_at(STATUE, game.bhitpos.x, game.bhitpos.y)) {
        let t = t_at(game.bhitpos.x, game.bhitpos.y);
        if (t && t.ttyp == STATUE_TRAP && activate_statue_trap(t, t.tx, t.ty, (0))) {
            ;
        } else {
            /* Since statues look like monsters now, we say something
               different from "you miss" or "there's nobody there".
               Note:  we only do this when a statue is displayed here,
               because the player is probably attempting to attack it;
               other statues obscured by anything are just ignored. */
            pline(thump, "statue");
            wake_nearto(game.bhitpos.x, game.bhitpos.y, 25);
        }
    } else {
        /* no monster here and no statue seen or remembered here */
        unmap_invisible(game.bhitpos.x, game.bhitpos.y);
        if ((((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))) ? CORPSE : (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) ? STATUE : (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) ? ((glyph) - (((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : ((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) ? ((glyph) - (((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS))) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : NUM_OBJECTS) == BOULDER && sobj_at(BOULDER, game.bhitpos.x, game.bhitpos.y)) {
            /* feedback has been give by animate_statue() */
            pline(thump, "boulder");
            wake_nearto(game.bhitpos.x, game.bhitpos.y, 25);
        } else if (!accessible(game.bhitpos.x, game.bhitpos.y) || ((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) >= STAIRS && (game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) <= ALTAR)) {
            /* similar to 'F'orcefight with a melee weapon; we know that
               the spot can be seen or we wouldn't have gotten this far */
            You("uselessly attack %s.", (game.level.locations[game.bhitpos.x][game.bhitpos.y].typ == STONE || game.level.locations[game.bhitpos.x][game.bhitpos.y].typ == SCORR) ? "stone" : ((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) ? the(defsyms[glyph_to_cmap(glyph)].explanation) : "an unknown obstacle");
        } else {
            You("miss; there is no one there to hit.");
        }
    }
    /* same as for melee or throwing */
    u_wipe_engr(2);
    return freehit ? 0 : 1;
}
export function use_cream_pie(obj) {
    let wasblind = ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
    let wascreamed = game.u.ucreamed;
    let several = (0);
    if (obj.quan > 1) {
        several = (1);
        obj = splitobj(obj, 1);
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        You("give yourself a facial.");
    } else {
        You("immerse your %s in %s%s.", body_part(FACE), several ? "one of " : "", several ? makeplural(the(xname(obj))) : the(xname(obj)));
    }
    if (can_blnd(null, game.youmonst, 254, obj)) {
        let blindinc = rnd(25);
        game.u.ucreamed += blindinc;
        make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + blindinc, (0));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && wasblind)) {
            pline("There's %ssticky goop all over your %s.", wascreamed ? "more " : "", body_part(FACE));
        } else {
            You_cant("see through all the sticky goop on your %s.", body_part(FACE));
        }
    }
    setnotworn(obj);
    /* useup() is appropriate, but we want costly_alteration()'s message */
    costly_alteration(obj, COST_SPLAT);
    obj_extract_self(obj);
    delobj(obj);
    return 0;
}
/* getobj callback for object to rub royal jelly on */
export function jelly_ok(obj) {
    if (obj && obj.otyp == EGG) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_EXCLUDE;
}
export function use_royal_jelly(optr) {
    let oldcorpsenm = 0;
    let was_timed = 0;
    let eobj = null;
    let obj = null;
    let splitit = 0;
    useup_jelly: {
        obj = optr.value;
        splitit = (obj.quan > 1);
        if (splitit) {
            obj = splitobj(obj, 1);
        }
        freeinv(obj);
        /* right now you can rub one royal jelly on an entire stack of eggs */
        eobj = getobj("rub the royal jelly on", jelly_ok, 2);
        if (!eobj) {
            if (splitit) {
                unsplitobj(obj);
                /* freeinv() updated perminv w/ obj omitted */
                update_inventory();
            } else {
                /* this lump was already separate; pervent merge */
                /* put unused lump back; updates perminv */
                addinv_nomerge(obj);
            }
            return 2;
        }
        You("smear royal jelly all over %s.", yname(eobj));
        if (eobj.otyp != EGG) {
            pline("%s", c_common_strings.c_nothing_happens);
            break useup_jelly;
        }
        oldcorpsenm = eobj.corpsenm;
        if (eobj.corpsenm == PM_KILLER_BEE) {
            eobj.corpsenm = PM_QUEEN_BEE;
        }
        if (obj.cursed) {
            if (eobj.timed || eobj.corpsenm != oldcorpsenm) {
                pline("The %s %s feebly.", xname(eobj), otense(eobj, "quiver"));
            } else {
                pline("%s", c_common_strings.c_nothing_seems_to_happen);
            }
            kill_egg(eobj);
            break useup_jelly;
        }
        was_timed = eobj.timed;
        if (eobj.corpsenm != NON_PM) {
            if (!eobj.timed) {
                attach_egg_hatch_timeout(eobj, 0);
            }
            /* blessed royal jelly will make the hatched creature think
           you're the parent - but has no effect if you laid the egg */
            if (obj.blessed && !eobj.spe) {
                eobj.spe = 2;
            }
        }
        if ((eobj.timed && !was_timed) || eobj.spe == 2 || eobj.corpsenm != oldcorpsenm) {
            pline("The %s %s briefly.", xname(eobj), otense(eobj, "quiver"));
        } else {
            pline("%s", c_common_strings.c_nothing_seems_to_happen);
        }
    }
    setnotworn(obj);
    /* not useup() because we've already done freeinv() */
    obfree(obj, null);
    optr.value = null;
    return 1;
}
export function grapple_range() {
    let typ = uwep_skill_type();
    let max_range = 4;
    if (typ == P_NONE || (game.u.weapon_skills[typ].skill) <= P_BASIC) {
        max_range = 4;
    } else if ((game.u.weapon_skills[typ].skill) == P_SKILLED) {
        max_range = 5;
    } else {
        max_range = 8;
    }
    return max_range;
}
export function can_grapple_location(x, y) {
    return (isok(x, y) && ((game.viz_array[y][x] & 2) != 0) && dist2((x), (y), game.u.ux, game.u.uy) <= grapple_range());
}
export function display_grapple_positions(on_off) {
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = 0;
    if (on_off) {
        tmp_at((-1), (((S_goodpos) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_goodpos) <= S_trwall) ? ((S_goodpos) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_goodpos) < S_altar) ? (((S_goodpos) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_goodpos) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_goodpos) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_goodpos) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_goodpos) <= S_goodpos) ? (((S_goodpos) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        for (dx = -3; dx <= 3; dx++) {
            for (dy = -3; dy <= 3; dy++) {
                x = dx + game.u.ux;
                y = dy + game.u.uy;
                if (can_grapple_location(x, y) && !((x) == game.u.ux && (y) == game.u.uy)) {
                    tmp_at(x, y);
                }
            }
        }
    } else {
        tmp_at((-7), 0);
    }
}
export function use_grapple(obj) {
    let res = 0;
    let typ = 0;
    let tohit = 0;
    let save_confirm = 0;
    let cc = { x: 0, y: 0 };
    let mtmp = null;
    let otmp = null;
    if (game.u.uswallow) {
        pline(not_enough_room);
        return 0;
    }
    if (obj != game.uwep) {
        if (wield_tool(obj, "cast")) {
            cmdq_add_ec(CQ_CANNED, doapply);
            cmdq_add_key(CQ_CANNED, obj.invlet);
            return 1;
        }
        return 0;
    }
    pline(where_to_hit);
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    getpos_sethilite(display_grapple_positions, can_grapple_location);
    if (getpos(cc, (1), "the spot to hit") < 0) {
        return (res | 2);
    }
    /* Calculate range; unlike use_pole(), there's no minimum for range */
    typ = uwep_skill_type();
    if (dist2((cc.x), (cc.y), game.u.ux, game.u.uy) > grapple_range()) {
        pline("Too far!");
        return res;
    } else if (!((game.viz_array[cc.y][cc.x] & 2) != 0)) {
        You(cant_see_spot);
        return res;
    } else if (!((game.viz_array[cc.y][cc.x] & 1) != 0)) {
        You(cant_reach);
        return res;
    }
    /* What do you want to hit? */
    tohit = rn2(5);
    if (typ != P_NONE && (game.u.weapon_skills[typ].skill) >= P_SKILLED) {
        let tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        let any = 0;
        let buf = '';
        let selected = null;
        let clr = 8;
        any = cg.zeroany;
        /* use index+1 (can't use 0) as identifier */
        any.a_int = 1;
        (game.windowprocs.win_start_menu)(tmpwin, 0);
        any.a_int++;
        buf = sprintf(buf, "an object on the %s", surface(cc.x, cc.y));
        add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        any.a_int++;
        add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, "a monster", 0);
        any.a_int++;
        buf = sprintf(buf, "the %s", surface(cc.x, cc.y));
        add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        (game.windowprocs.win_end_menu)(tmpwin, "Aim for what?");
        tohit = rn2(4);
        if (select_menu(tmpwin, 1, selected) > 0 && rn2((game.u.weapon_skills[typ].skill) > P_SKILLED ? 20 : 2)) {
            tohit = selected[0].item.a_int - 1;
        }
        free(selected);
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    }
    /* possibly scuff engraving at your feet;
       any engraving at the target location is unaffected */
    if (tohit == 2 || !rn2(2)) {
        u_wipe_engr(rnd(2));
    }
    switch (tohit) {
        case 0:
            break;
        case 1:
            if ((otmp = game.level.objects[cc.x][cc.y]) != null) {
                /* FIXME -- untrap needs to deal with non-adjacent traps */
                You("snag an object from the %s!", surface(cc.x, cc.y));
                pickup_object(otmp, 1, (0));
                /* If pickup fails, leave it alone */
                newsym(cc.x, cc.y);
                return 1;
            }
            break;
        case 2:
            game.bhitpos = cc;
            if ((mtmp = (game.level.monsters[cc.x][cc.y])) == null) {
                break;
            }
            game.notonhead = (game.bhitpos.x != mtmp.mx || game.bhitpos.y != mtmp.my);
            save_confirm = game.flags.confirm;
            if (((mtmp.data).msize < 1) && !rn2(4) && enexto(cc, game.u.ux, game.u.uy, null)) {
                game.flags.confirm = (0);
                attack_checks(mtmp, game.uwep);
                game.flags.confirm = save_confirm;
                /* despite fact there's no damage */
                check_caitiff(mtmp);
                You("pull in %s!", mon_nam(mtmp));
                mtmp.mundetected = 0;
                rloc_to(mtmp, cc.x, cc.y);
                return 1;
            } else if ((!((mtmp.data).msize >= 3) && !(((mtmp.data).mflags2 & 67108864) != 0)) || rn2(4)) {
                game.flags.confirm = (0);
                attack_checks(mtmp, game.uwep);
                game.flags.confirm = save_confirm;
                check_caitiff(mtmp);
                thitmonst(mtmp, game.uwep);
                return 1;
            }
            ;
        case 3:
            if (((game.level.locations[cc.x][cc.y].typ) == AIR || (game.level.locations[cc.x][cc.y].typ) == CLOUD) || is_pool(cc.x, cc.y)) {
                pline_The("hook slices through the %s.", surface(cc.x, cc.y));
            } else {
                You("are yanked toward the %s!", surface(cc.x, cc.y));
                hurtle(sgn(cc.x - game.u.ux), sgn(cc.y - game.u.uy), 1, (0));
                spoteffects((1));
            }
            return 1;
        default:
            if ((game.u.weapon_skills[typ].skill) <= P_BASIC) {
                You("hook yourself!");
                losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc((((rn2(10) + (10))) + 1) / 2)) : ((rn2(10) + (10)))), "a grappling hook", 1);
                return 1;
            }
            break;
    }
    pline("%s", c_common_strings.c_nothing_happens);
    return 1;
}
export function discard_broken_wand() {
    let obj = null;
    /* [see dozap() and destroy_items()] */
    obj = game.current_wand;
    game.current_wand = null;
    if (obj) {
        delobj(obj);
    }
    nomul(0);
}
export function broken_wand_explode(obj, dmg, expltype) {
    explode(game.u.ux, game.u.uy, -(obj.otyp), dmg, WAND_CLASS, expltype);
    discover_object((obj.otyp), (1), (1), (1));
    /* explode describes the effect */
    /* only needs to be done once */
    discard_broken_wand();
}
/* if x,y has lava or water, dunk any boulders at that location into it */
export function maybe_dunk_boulders(x, y) {
    let otmp = null;
    while (is_pool_or_lava(x, y) && (otmp = sobj_at(BOULDER, x, y)) != null) {
        obj_extract_self(otmp);
        boulder_hits_pool(otmp, x, y, (0));
    }
}
/* return 1 if the wand is broken, hence some time elapsed */
const __do_break_wand_nothing_else_happens = "But nothing else happens...";
export function do_break_wand(obj) {
    let i = 0;
    let x = 0;
    let y = 0;
    let mon = null;
    let dmg = 0;
    let damage = 0;
    let affects_objects = 0;
    let shop_damage = (0);
    let fillmsg = (0);
    let confirm = '';
    let buf = '';
    let is_fragile = (objdescr_is(obj, "balsa") || objdescr_is(obj, "glass"));
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        You_cant("break %s without hands!", yname(obj));
        return 0;
    } else if (!freehand()) {
        Your("%s are occupied!", makeplural(body_part(HAND)));
        return 0;
    } else if ((acurr(A_STR)) < (is_fragile ? 5 : 10)) {
        You("don't have the strength to break %s!", yname(obj));
        return 0;
    }
    if (!paranoid_query(((game.flags.paranoia_bits & 128) != 0), safe_qbuf(confirm, "Are you really sure you want to break ", "?", obj, yname, ysimple_name, "the wand"))) {
        return 0;
    }
    pline("Raising %s high above your %s, you %s it in two!", yname(obj), body_part(HEAD), is_fragile ? "snap" : "break");
    if (obj.unpaid) {
        check_unpaid(obj);
        costly_alteration(obj, COST_DSTROY);
    }
    /* destroy_items might reset this */
    game.current_wand = obj;
    freeinv(obj);
    setnotworn(obj);
    if (!zappable(obj)) {
        pline(__do_break_wand_nothing_else_happens);
        discard_broken_wand();
        return 1;
    }
    /* successful call to zappable() consumes a charge; put it back */
    obj.spe++;
    /* might have "wrested" a final charge, taking it from 0 to -1;
       if so, we just brought it back up to 0, which wouldn't do much
       below so give it 1..3 charges now, usually making it stronger
       than an ordinary last charge (the wand is already gone from
       inventory, so perm_invent can't accidentally reveal this) */
    if (!obj.spe) {
        obj.spe = rnd(3);
    }
    obj.ox = game.u.ux;
    obj.oy = game.u.uy;
    dmg = obj.spe * 4;
    affects_objects = (0);
    switch (obj.otyp) {
        case WAN_OPENING:
            if (game.u.ustuck) {
                release_hold();
                if (obj.dknown) {
                    discover_object((WAN_OPENING), (1), (1), (1));
                }
                discard_broken_wand();
                return 1;
            }
            ;
        case WAN_WISHING:
        case WAN_NOTHING:
        case WAN_LOCKING:
        case WAN_PROBING:
        case WAN_ENLIGHTENMENT:
        case WAN_SECRET_DOOR_DETECTION:
        case WAN_STASIS:
            pline(__do_break_wand_nothing_else_happens);
            discard_broken_wand();
            return 1;
        case WAN_DEATH:
        case WAN_LIGHTNING:
            broken_wand_explode(obj, dmg * 4, EXPL_MAGICAL);
            return 1;
        case WAN_FIRE:
            broken_wand_explode(obj, dmg * 2, EXPL_FIERY);
            return 1;
        case WAN_COLD:
            broken_wand_explode(obj, dmg * 2, EXPL_FROSTY);
            return 1;
        case WAN_MAGIC_MISSILE:
            broken_wand_explode(obj, dmg, EXPL_MAGICAL);
            return 1;
        case WAN_STRIKING:
            ;
            pline("A wall of force smashes down around you!");
            dmg = d(1 + obj.spe, 6);
            ;
        case WAN_CANCELLATION:
        case WAN_POLYMORPH:
        case WAN_TELEPORTATION:
        case WAN_UNDEAD_TURNING:
            affects_objects = (1);
            break;
        default:
            break;
    }
    /* magical explosion and its visual effect occur before specific effects
     */
    /* [TODO?  This really ought to prevent the explosion from being
       fatal so that we never leave a bones file where none of the
       surrounding targets (or underlying objects) got affected yet.] */
    explode(obj.ox, obj.oy, -(obj.otyp), rnd(dmg), WAND_CLASS, EXPL_MAGICAL);
    /* prepare for potential feedback from polymorph... */
    zapsetup();
    for (i = 0; i <= (N_DIRS_Z - 2); i++) {
        /* this makes it hit us last, so that we can see the action first */
        game.bhitpos.x = x = obj.ox + xdir[i];
        game.bhitpos.y = y = obj.oy + ydir[i];
        if (!isok(x, y)) {
            continue;
        }
        if (obj.otyp == WAN_DIGGING) {
            let typ = 0;
            let dcres = dig_check((null), x, y);
            if (dcres < DIGCHECK_FAILED || dcres == DIGCHECK_FAIL_BOULDER) {
                if (((game.level.locations[x][y].typ) && (game.level.locations[x][y].typ) <= DBWALL) || ((game.level.locations[x][y].typ) == DOOR)) {
                    /* normally, pits and holes don't anger guards, but they
                     * do if it's a wall or door that's being dug */
                    watch_dig(null, x, y, (1));
                    if (in_rooms(x, y, SHOPBASE)) {
                        shop_damage = (1);
                    }
                }
                if (game.level.locations[x][y].typ == ICE) {
                    spot_stop_timers(x, y, MELT_ICE_AWAY);
                }
                /*
                 * Let liquid flow into the newly created pits.
                 * Adjust corresponding code in music.c for
                 * drum of earthquake if you alter this sequence.
                 */
                typ = fillholetyp(x, y, (0));
                if (typ != ROOM) {
                    game.level.locations[x][y].typ = typ , game.level.locations[x][y].flags = 0;
                    liquid_flow(x, y, typ, t_at(x, y), fillmsg ? null : "Some holes are quickly filled with %s!");
                    fillmsg = (1);
                } else {
                    digactualhole(x, y, (null), (rn2(obj.spe) < 3 || (!Can_dig_down(game.u.uz) && !game.level.locations[x][y].candig)) ? PIT : HOLE);
                }
            }
            fill_pit(x, y);
            maybe_dunk_boulders(x, y);
            recalc_block_point(x, y);
            continue;
        } else if (obj.otyp == WAN_CREATE_MONSTER) {
            /* u.ux,u.uy creates it near you--x,y might create it in rock */
            makemon(null, game.u.ux, game.u.uy, 0);
            continue;
        } else if (x != game.u.ux || y != game.u.uy) {
            if ((mon = (game.level.monsters[x][y])) != null) {
                /*
             * Wand breakage is targeting a square adjacent to the hero,
             * which might contain a monster or a pile of objects or both.
             * Handle objects last; avoids having undead turning raise an
             * undead's corpse and then attack resulting undead monster.
             * obj->bypass in bhitm() prevents the polymorphing of items
             * dropped due to monster's polymorph and prevents undead
             * turning that kills an undead from raising resulting corpse.
             */
                bhitm(mon, obj);
            }
            if (affects_objects && game.level.objects[x][y]) {
                /*
             * Wand breakage is targeting the hero.  Using xdir[]+ydir[]
             * deltas for location selection causes this case to happen
             * after all the surrounding squares have been handled.
             * Process objects first, in case damage is fatal and leaves
             * bones, or teleportation sends one or more of the objects to
             * same destination as hero (lookhere/autopickup); also avoids
             * the polymorphing of gear dropped due to hero's transformation.
             * (Unlike with monsters being hit by zaps, we can't rely on use
             * of obj->bypass in the zap code to accomplish that last case
             * since it's also used by retouch_equipment() for polyself.)
             */
                bhitpile(obj, bhito, x, y, 0);
                if (game.disp.botl) {
                    bot();
                }
            }
        } else {
            if (affects_objects && game.level.objects[x][y]) {
                bhitpile(obj, bhito, x, y, 0);
                if (game.disp.botl) {
                    bot();
                }
            }
            damage = zapyourself(obj, (0));
            if (damage) {
                buf = sprintf(buf, "killed %sself by breaking a wand", (genders[game.flags.female ? 1 : 0].him));
                losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((damage) + 1) / 2)) : (damage)), buf, 2);
            }
            if (game.disp.botl) {
                bot();
            }
        }
    }
    /* potentially give post zap/break feedback */
    zapwrapup();
    /* Note: if player fell thru, this call is a no-op.
       Damage is handled in digactualhole in that case */
    if (shop_damage) {
        pay_for_damage("dig into", (0));
    }
    if (obj.otyp == WAN_LIGHT) {
        litroom((1), obj);
    }
    discard_broken_wand();
    return 1;
}
/* getobj callback for object to apply - this is more complex than most other
 * callbacks because there are a lot of appliables */
export function apply_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    /* all tools, all wands (breaking), all spellbooks (flipping through -
       including blank/novel/Book of the Dead) */
    if (obj.oclass == TOOL_CLASS || obj.oclass == WAND_CLASS || obj.oclass == SPBOOK_CLASS) {
        return GETOBJ_SUGGEST;
    }
    /* applying coins to flip them is a minor easter egg, so do not suggest
       coin application to the player */
    if (obj.oclass == COIN_CLASS) {
        return GETOBJ_DOWNPLAY;
    }
    if (obj.oclass == WEAPON_CLASS && (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_PICK_AXE) || ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_AXE) || ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && (game.objects[obj.otyp].oc_subtyp == P_POLEARMS || game.objects[obj.otyp].oc_subtyp == P_LANCE || is_art(obj, ART_SNICKERSNEE))) || obj.otyp == BULLWHIP)) {
        return GETOBJ_SUGGEST;
    }
    if (obj.oclass == POTION_CLASS) {
        /* permit applying unknown potions, but don't suggest them */
        if (!obj.dknown || !game.objects[obj.otyp].oc_name_known) {
            return GETOBJ_DOWNPLAY;
        }
        /* only applicable potion is oil, and it will only be suggested as a
           choice when already discovered */
        if (obj.otyp == POT_OIL) {
            return GETOBJ_SUGGEST;
        }
    }
    if (obj.otyp == CREAM_PIE || obj.otyp == EUCALYPTUS_LEAF || obj.otyp == LUMP_OF_ROYAL_JELLY) {
        return GETOBJ_SUGGEST;
    }
    if (obj.otyp == BANANA && (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        return GETOBJ_DOWNPLAY;
    }
    if (((obj).otyp == LUCKSTONE || (obj).otyp == LOADSTONE || (obj).otyp == FLINT || (obj).otyp == TOUCHSTONE)) {
        /* The only case where we don't suggest a gray stone is if we KNOW it
           isn't a touchstone. */
        if (!obj.dknown) {
            return GETOBJ_SUGGEST;
        }
        if (obj.otyp != TOUCHSTONE && (game.objects[TOUCHSTONE].oc_name_known || game.objects[obj.otyp].oc_name_known)) {
            /* item can't be applied; if picked anyway,
       _EXCLUDE would yield "That is a silly thing to apply.",
       _EXCLUDE_SELECTABLE yields "Sorry, I don't know how to use that." */
            return GETOBJ_EXCLUDE_SELECTABLE;
        }
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_EXCLUDE_SELECTABLE;
}
/* the #apply command, 'a' */
export function doapply() {
    let obj = null;
    let res = 1;
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        You("aren't able to use or apply tools in your current form.");
        return 0;
    }
    if (check_capacity(null)) {
        return 0;
    }
    obj = getobj("use or apply", apply_ok, 0);
    if (!obj) {
        return 2;
    }
    if (!retouch_object({ get value() { return obj; }, set value(_v) { obj = _v; } }, (0))) {
        return 1;
    }
    /* evading your grasp costs a turn; just be
                             grateful that you don't drop it as well */
    if (obj.oclass == WAND_CLASS) {
        return do_break_wand(obj);
    }
    if (obj.oclass == SPBOOK_CLASS) {
        return flip_through_book(obj);
    }
    if (obj.oclass == COIN_CLASS) {
        return flip_coin(obj);
    }
    switch (obj.otyp) {
        case BLINDFOLD:
        case LENSES:
            if (obj == game.ublindf) {
                if (!cursed(obj)) {
                    Blindf_off(obj);
                }
            } else if (!game.ublindf) {
                Blindf_on(obj);
            } else {
                You("are already %s.", (game.ublindf.otyp == TOWEL) ? "covered by a towel" : (game.ublindf.otyp == BLINDFOLD) ? "wearing a blindfold" : "wearing lenses");
            }
            break;
        case CREAM_PIE:
            res = use_cream_pie(obj);
            obj = null;
            break;
        case LUMP_OF_ROYAL_JELLY:
            res = use_royal_jelly({ get value() { return obj; }, set value(_v) { obj = _v; } });
            break;
        case BULLWHIP:
            res = use_whip(obj);
            break;
        case GRAPPLING_HOOK:
            res = use_grapple(obj);
            break;
        case LARGE_BOX:
        case CHEST:
        case ICE_BOX:
        case SACK:
        case BAG_OF_HOLDING:
        case OILSKIN_SACK:
            res = use_container({ get value() { return obj; }, set value(_v) { obj = _v; } }, (1), (0));
            break;
        case BAG_OF_TRICKS:
            bagotricks(obj, (0), null);
            break;
        case CAN_OF_GREASE:
            res = use_grease(obj);
            break;
        case LOCK_PICK:
        case CREDIT_CARD:
        case SKELETON_KEY:
            res = (pick_lock(obj, 0, 0, null) != 0) ? 1 : 0;
            break;
        case PICK_AXE:
        case DWARVISH_MATTOCK:
            res = use_pick_axe(obj);
            break;
        case TINNING_KIT:
            use_tinning_kit(obj);
            break;
        case LEASH:
            res = use_leash(obj);
            break;
        case SADDLE:
            res = use_saddle(obj);
            break;
        case MAGIC_WHISTLE:
            use_magic_whistle(obj);
            break;
        case TIN_WHISTLE:
            use_whistle(obj);
            break;
        case EUCALYPTUS_LEAF:
            if (obj.blessed) {
                /* MRKR: Every Australian knows that a gum leaf makes an excellent
         * whistle, especially if your pet is a tame kangaroo named Skippy.
         */
                use_magic_whistle(obj);
                if (!rn2(49)) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        /* sometimes the blessing will be worn off */
                        pline("%s %s.", Yobjnam2(obj, "glow"), hcolor("brown"));
                        set_bknown(obj, 1);
                    }
                    unbless(obj);
                }
            } else {
                use_whistle(obj);
            }
            break;
        case STETHOSCOPE:
            res = use_stethoscope(obj);
            break;
        case MIRROR:
            res = use_mirror(obj);
            break;
        case BELL:
        case BELL_OF_OPENING:
            use_bell({ get value() { return obj; }, set value(_v) { obj = _v; } });
            break;
        case CANDELABRUM_OF_INVOCATION:
            use_candelabrum(obj);
            break;
        case WAX_CANDLE:
        case TALLOW_CANDLE:
            use_candle({ get value() { return obj; }, set value(_v) { obj = _v; } });
            break;
        case OIL_LAMP:
        case MAGIC_LAMP:
        case BRASS_LANTERN:
            use_lamp(obj);
            break;
        case POT_OIL:
            light_cocktail({ get value() { return obj; }, set value(_v) { obj = _v; } });
            break;
        case EXPENSIVE_CAMERA:
            res = use_camera(obj);
            break;
        case TOWEL:
            res = use_towel(obj);
            break;
        case CRYSTAL_BALL:
            use_crystal_ball({ get value() { return obj; }, set value(_v) { obj = _v; } });
            break;
        case MAGIC_MARKER:
            res = dowrite(obj);
            break;
        case TIN_OPENER:
            res = use_tin_opener(obj);
            break;
        case FIGURINE:
            res = use_figurine({ get value() { return obj; }, set value(_v) { obj = _v; } });
            break;
        case UNICORN_HORN:
            use_unicorn_horn(obj);
            break;
        case WOODEN_FLUTE:
        case MAGIC_FLUTE:
        case TOOLED_HORN:
        case FROST_HORN:
        case FIRE_HORN:
        case WOODEN_HARP:
        case MAGIC_HARP:
        case BUGLE:
        case LEATHER_DRUM:
        case DRUM_OF_EARTHQUAKE:
            res = do_play_instrument(obj);
            break;
        /* not a musical instrument */
        case HORN_OF_PLENTY:
            hornoplenty(obj, (0), null);
            break;
        case LAND_MINE:
        case BEARTRAP:
            use_trap(obj);
            if (game.occupation == set_trap) {
                obj = null;
            }
            break;
        case FLINT:
        case LUCKSTONE:
        case LOADSTONE:
        case TOUCHSTONE:
            res = use_stone(obj);
            break;
        case BANANA:
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                pline("It rings! ... But no-one answers.");
                break;
            }
            ;
        default:
            if (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && (game.objects[obj.otyp].oc_subtyp == P_POLEARMS || game.objects[obj.otyp].oc_subtyp == P_LANCE || is_art(obj, ART_SNICKERSNEE)))) {
                /* Pole-weapons can strike at a distance */
                res = use_pole(obj, (0));
                break;
            } else if (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_PICK_AXE) || ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_AXE)) {
                res = use_pick_axe(obj);
                break;
            }
            pline("Sorry, I don't know how to use that.");
            return 4;
    }
    if (obj && obj.oartifact) {
        /* This assumes that anything that potentially destroyed obj has kept
     * track of it and set obj to null before this point. */
        /* sets ECMD_TIME bit if artifact speaks */
        res |= arti_speak(obj);
    }
    return res;
}
/* Keep track of unfixable troubles for purposes of messages saying you feel
 * great.
 */
export function unfixable_trouble_count(is_horn) {
    let unfixable_trbl = 0;
    if (game.u.uprops[STONED].intrinsic) {
        unfixable_trbl++;
    }
    if (game.u.uprops[SLIMED].intrinsic) {
        unfixable_trbl++;
    }
    if (game.u.uprops[STRANGLED].intrinsic) {
        unfixable_trbl++;
    }
    if ((game.u.atemp.a[A_DEX]) < 0 && (game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic)) {
        unfixable_trbl++;
    }
    if ((game.u.atemp.a[A_STR]) < 0 && game.u.uhs >= WEAK) {
        unfixable_trbl++;
    }
    /* lycanthropy is undesirable, but it doesn't actually make you feel bad
       so don't count it as a trouble which can't be fixed */
    /*
     * Unicorn horn can fix these when they're timed but not when
     * they aren't.  Potion of restore ability doesn't touch them,
     * so they're always unfixable for the not-unihorn case.
     * [Most of these are timed only, so always curable via horn.
     * An exception is Stunned, which can be forced On by certain
     * polymorph forms (stalker, bats).]
     */
    if (game.u.uprops[SICK].intrinsic && (!is_horn || (game.u.uprops[SICK].intrinsic & ~16777215) != 0)) {
        unfixable_trbl++;
    }
    if (game.u.uprops[STUNNED].intrinsic && (!is_horn || (game.u.uprops[STUNNED].intrinsic & ~16777215) != 0)) {
        unfixable_trbl++;
    }
    if (game.u.uprops[CONFUSION].intrinsic && (!is_horn || (game.u.uprops[CONFUSION].intrinsic & ~16777215) != 0)) {
        unfixable_trbl++;
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && (!is_horn || (game.u.uprops[HALLUC].intrinsic & ~16777215) != 0)) {
        unfixable_trbl++;
    }
    if (game.u.uprops[VOMITING].intrinsic && (!is_horn || (game.u.uprops[VOMITING].intrinsic & ~16777215) != 0)) {
        unfixable_trbl++;
    }
    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && (!is_horn || (game.u.uprops[DEAF].intrinsic & ~16777215) != 0)) {
        unfixable_trbl++;
    }
    return unfixable_trbl;
}
const __flip_through_book_fadeness = ["fresh", "slightly faded", "very faded", "extremely faded", "barely visible"];
export function flip_through_book(obj) {
    if ((game.u.uinwater)) {
        You("don't want to get the pages even more soggy, do you?");
        return 0;
    }
    You("flip through the pages of %s.", thesimpleoname(obj));
    if (obj.otyp == SPE_BOOK_OF_THE_DEAD) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                ;
            }
            You_hear("the pages make an unpleasant %s sound.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "chuckling" : "rustling");
        } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            You_see("the pages glow faintly %s.", hcolor(c_color_names.c_red));
        } else {
            You_feel("the pages tremble.");
        }
    } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        pline("The pages feel %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "freshly picked" : "rough and dry");
    } else if (obj.otyp == SPE_BLANK_PAPER) {
        pline("This spellbook %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "doesn't have much of a plot" : "has nothing written in it");
        discover_object((obj.otyp), (1), (1), (1));
    } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        You("enjoy the animated initials.");
    } else if (obj.otyp == SPE_NOVEL) {
        pline("This looks like it might be interesting to read.");
    } else {
        let findx = ((obj.usecount) < (3) ? (obj.usecount) : (3));
        pline("The%s ink in this spellbook is %s.", game.objects[obj.otyp].oc_magic ? " magical" : "", __flip_through_book_fadeness[findx]);
    }
    return 1;
}
export function flip_coin(obj) {
    let otmp = obj;
    let lose_coin = (0);
    You("flip %s.", an(singular(obj, xname)));
    if ((game.u.uinwater)) {
        pline("It tumbles away.");
        lose_coin = (1);
    } else if (game.u.uprops[GLIB].intrinsic || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || ((acurr(A_DEX)) < 10 && !rn2((acurr(A_DEX))))) {
        pline("It slips between your %s.", fingers_or_gloves((0)));
        lose_coin = (1);
    }
    if (lose_coin) {
        if (otmp.quan > 1) {
            otmp = splitobj(otmp, 1);
        }
        dropx(otmp);
        return 1;
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        pline(rn2(100) ? "Wow, a double header!" : "The coin miraculously lands on its edge!");
    } else {
        pline("It comes up %s.", rn2(2) ? "heads" : "tails");
    }
    return 1;
}
/*apply.c*/
/* note: not "splendiferous" */
/* redundant: can't get here if these are true */
/* make_deaf() won't give feedback when already deaf */
/* proficient with whip, but maybe not
                           so proficient at catching weapons */
/* right into your inventory */
/* we want this before the explosion instead of at the very end */
