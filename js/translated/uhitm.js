/* NetHack 5.0	uhitm.c	$NHDT-Date: 1752823766 2025/07/17 23:29:26 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.477 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_feel, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strcmp, strcpy, strlen, strncat, strncmp, strstri } from '../c2js-runtime/string.js';
import { snuff_lit } from './apply.js';
import { artifact_hit, artifact_light, defends, find_artifact, is_art, permapoisoned, retouch_equipment, shade_glare, undiscovered_artifact } from './artifact.js';
import { acurr, adjalign, adjattrib, change_luck, exercise, poisoned } from './attrib.js';
import { night } from './calendar.js';
import { isok, paranoid_query, xytodir } from './cmd.js';
import { is_pool, is_waterwall } from './dbridge.js';
import { c_color_names, c_common_strings, xdir, ydir } from './decl.js';
import { canseemon, glyph_at, is_safemon, map_invisible, map_location, newsym, sensemon, shieldeff, tmp_at, tp_sensemon, unmap_invisible } from './display.js';
import { dropy, set_wounded_legs } from './do.js';
import { Adjmonnam, Mgender, Monnam, Some_Monnam, a_monnam, hcolor, hliquid, l_monnam, mon_nam, mon_nam_too, pmname, some_mon_nam, x_monnam, y_monnam } from './do_name.js';
import { some_armor } from './do_wear.js';
import { abuse_dog, tamedog } from './dog.js';
import { dog_nutrition } from './dogmove.js';
import { breaktest, hurtle, mhurtle, release_camera_demon, will_hurtle } from './dothrow.js';
import { defsyms } from './drawing.js';
import { on_level } from './dungeon.js';
import { Finish_digestion, eat_brains, eating_conducts, is_fainted, morehungry, newuhs } from './eat.js';
import { delayed_killer, done, done_in_by } from './end.js';
import { u_wipe_engr } from './engrave.js';
import { losexp } from './exper.js';
import { adtyp_to_expltype, explode } from './explode.js';
import { glyph_to_cmap } from './glyphs.js';
import { check_capacity, doorless_door, end_running, in_rooms, inv_cnt, near_capacity, nomul, overexertion, test_move } from './hack.js';
import { dist2, eos, highc, ing_suffix, s_suffix, strNsubst, upstart } from './hacklib.js';
import { addinv, carrying, freeinv, hold_another_object, merge_choice, update_inventory, useup, useupall } from './invent.js';
import { clone_mon, grow_up, makemon } from './makemon.js';
import { touch_of_death } from './mcastu.js';
import { attk_protection, engulf_target, failed_grab, mon_poly, paralyze_monst, rustm, sleep_monst, slept_monst, xdrainenergym } from './mhitm.js';
import { cloneu, could_seduce, diseasemu, doseduce, getmattk, hitmsg, magic_negation, mdamageu, mpoisons_subj, mtrapped_in_pit, u_slip_free, u_slow_down } from './mhitu.js';
import { ndemon } from './minion.js';
import { add_to_minv, dealloc_obj, mksobj, obj_extract_self, place_object, set_corpsenm, splitobj, weight } from './mkobj.js';
import { angry_guards, corpse_chance, golemeffects, healmon, killed, mlifesaver, mon_give_prop, mon_to_stone, mondied, mongone, monkilled, monnear, monstone, newcham, seemimic, set_ustuck, setmangry, unstuck, wake_nearto, wakeup, xkilled } from './mon.js';
import { Resists_Elem, attacktype, can_be_strangled, can_blnd, defended, dmgtype, dmgtype_fromattack, gender, hates_silver, locomotion, mon_hates_blessings, mon_hates_light, mon_hates_silver, monstseesu, monstunseesu, noattacks, on_fire, poly_when_stoned, pronoun_gender, resists_blnd, resists_blnd_by_arti, resists_drli, stagger, sticks } from './mondata.js';
import { m_move, monflee, set_apparxy } from './monmove.js';
import { m_carrying, m_useup, m_useupall } from './mthrowu.js';
import { munslime, munstone, ureflects } from './muse.js';
import { ACID_RES, ACID_VENOM, AMULET_OF_LIFE_SAVING, ANTIMAGIC, ARMOR_CLASS, ARM_SHIELD, ART_CLEAVER, ART_EYES_OF_THE_OVERWORLD, ART_GIANTSLAYER, ART_OGRESMASHER, ART_SNICKERSNEE, ART_STORMBRINGER, ART_TROLLSBANE, A_CON, A_DEX, A_INT, A_STR, A_WIS, BLINDED, BLINDING_VENOM, BOOMERANG, BOULDER, CLOVE_OF_GARLIC, COIN_CLASS, COLD_RES, CONFUSION, CORPSE, CREAM_PIE, DEAF, DETECT_MONSTERS, DIED, DIR_ERR, DISMOUNT_KNOCKED, DISMOUNT_POLY, DOOR, DRAIN_RES, DROWNING, DUNCE_CAP, EGG, ELVEN_ARROW, ELVEN_BOW, EXPENSIVE_CAMERA, EXPL_FIERY, FACE, FAST, FIRE_RES, FIRST_OBJECT, FLYING, FREE_ACTION, FUMBLING, GAUNTLETS_OF_POWER, GEMSTONE, GEM_CLASS, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GLYPH_WARNING_OFF, HALF_PHDAM, HALLUC, HALLUC_RES, HAND, HEAVY_IRON_BALL, HMON_APPLIED, HMON_KICKED, HMON_MELEE, HMON_THROWN, INVIS, IRON, IRON_CHAIN, IRON_SHOES, KATANA, LEATHER, LEG, LEVITATION, LOADSTONE, LOW_BOOTS, LOW_PM, MAGICAL_BREATHING, MAXOCLASSES, METAL, MINERAL, MIRROR, M_AP_FURNITURE, M_AP_MONSTER, M_AP_NOTHING, M_AP_OBJECT, M_SEEN_ACID, M_SEEN_COLD, M_SEEN_ELEC, M_SEEN_FIRE, M_SEEN_MAGR, M_SEEN_SLEEP, NEED_WEAPON, NEUTRAL, NON_PM, NO_MATERIAL, NUMMONS, NUM_OBJECTS, N_DIRS_Z, OILSKIN_CLOAK, PAPER, PM_AIR_ELEMENTAL, PM_AMOROUS_DEMON, PM_ARCHON, PM_BABY_LONG_WORM, PM_BALROG, PM_BARBARIAN, PM_BARBED_DEVIL, PM_BLACK_PUDDING, PM_BROWN_PUDDING, PM_CHICKATRICE, PM_CLAY_GOLEM, PM_COCKATRICE, PM_DEATH, PM_ELF, PM_FAMINE, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLOATING_EYE, PM_FOG_CLOUD, PM_GHOUL, PM_GREEN_SLIME, PM_GREMLIN, PM_GRID_BUG, PM_HEALER, PM_IRON_GOLEM, PM_KNIGHT, PM_LEATHER_GOLEM, PM_LONG_WORM, PM_LONG_WORM_TAIL, PM_MANES, PM_MEDUSA, PM_MONK, PM_PAPER_GOLEM, PM_PESTILENCE, PM_PURPLE_WORM, PM_PYROLISK, PM_ROGUE, PM_ROPE_GOLEM, PM_SALAMANDER, PM_SAMURAI, PM_SHADE, PM_SHRIEKER, PM_STEAM_VORTEX, PM_STONE_GOLEM, PM_STRAW_GOLEM, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WATCHMAN, PM_WATCH_CAPTAIN, PM_WOOD_GOLEM, POISON_RES, POOL, POTION_CLASS, PROT_FROM_SHAPE_CHANGERS, P_AXE, P_BARE_HANDED_COMBAT, P_BASIC, P_BOOMERANG, P_BOW, P_CROSSBOW, P_DAGGER, P_DART, P_ISRESTRICTED, P_KNIFE, P_LANCE, P_NONE, P_POLEARMS, P_SABER, P_SHURIKEN, P_SKILLED, P_TWO_WEAPON_COMBAT, P_UNSKILLED, P_WHIP, RING_CLASS, ROCK, RUBBER_HOSE, SEE_INVIS, SHOCK_RES, SHOPBASE, SICK, SICK_RES, SILVER, SLEEP_RES, SLIMED, SLOW_DIGESTION, SPBOOK_CLASS, STOMACH, STONED, STONE_RES, STONING, STRANGE_OBJECT, STUNNED, SWIMMING, S_BLOB, S_EEL, S_EYE, S_FUNGUS, S_GHOST, S_GNOME, S_GOLEM, S_HUMAN, S_KOBOLD, S_LEPRECHAUN, S_LICH, S_LIGHT, S_MIMIC, S_MUMMY, S_NAGA, S_NYMPH, S_ORC, S_SNAKE, S_TROLL, S_VORTEX, S_ZOMBIE, S_digbeam, S_goodpos, S_trapped_chest, TELEPAT, TELEPORT_CONTROL, TOOL_CLASS, TOWEL, UNCHANGING, VEGGY, WAN_LIGHT, WEAPON_CLASS, YA, YUMI, invlet_basic } from './nh-constants.js';
import { observe_object } from './o_init.js';
import { An, The, Yname2, Yobjnam2, an, bare_artifactname, cloak_simple_name, corpse_xname, cxname, doname, helm_simple_name, makeplural, mshot_xname, obj_is_pname, otense, simpleonames, singular, the, vtense, xname, yname, ysimple_name } from './objnam.js';
import { mhidden_description, object_from_map } from './pager.js';
import { livelog_printf, pline_mon, urgent_pline } from './pline.js';
import { body_part, mbodypart, polymon, rehumanize, ugolemeffects, uunstick } from './polyself.js';
import { make_blinded, make_confused, make_sick, make_slimed, make_stoned, make_stunned, potionhit, split_mon } from './potion.js';
import { ghod_hitsu } from './priest.js';
import { d, rn2, rn2_on_display_rng, rnd, rnl } from './rnd.js';
import { genders } from './role.js';
import { dopay, obfree, tended_shop } from './shk.js';
import { attrcurse } from './sit.js';
import { losespells } from './spell.js';
import { findgold, mpickobj, steal, stealamulet, stealgold } from './steal.js';
import { dismount_steed } from './steed.js';
import { rloc, tele, tele_restrict, u_teleport_mon } from './teleport.js';
import { burn_away_slime, fall_asleep, obj_stop_timers } from './timeout.js';
import { acid_damage, drain_en, erode_obj, ignite_items, instapetrify, minstapetrify, mintrap, mselftouch, unconscious } from './trap.js';
import { abon, dbon, dmgval, drain_weapon_skill, dry_a_towel, hitval, possibly_unwield, setmnotwielded, silver_sears, special_dmgval, use_skill, uwep_skill_type, weapon_dam_bonus, weapon_hit_bonus, weapon_type } from './weapon.js';
import { set_ulycn, were_change } from './were.js';
import { can_twoweapon, drop_uswapwep, set_twoweap, setuwep, untwoweapon, uwepgone } from './wield.js';
import { cutworm } from './worm.js';
import { extract_from_minvent, find_mac, mon_adjust_speed, which_armor } from './worn.js';
import { destroy_items, drain_item, exclam, hit, obj_resists, resist } from './zap.js';

const brief_feeling = "have a %s feeling for a moment, then it passes.";
/* hitum_cleave() has contradictory information. There's a comment
 * beside the 1st arg 'target' stating non-null, but later on there
 * is a test for 'target' being null */
/* give mesg if magical cancellation prevents damage */
export function mhitm_mgc_atk_negated(magr, mdef, verbosely) {
    let armpro = 0;
    let negated = 0;
    /* mcan doesn't apply to youmonst; hero can't be cancelled */
    if (magr != game.youmonst && magr.mcan) {
        /* target hasn't been killed */
        /* apparently wasn't fatal after all... */
        return (1);
    }
    /* no message if attacker has been cancelled */
    armpro = magic_negation(mdef);
    negated = !(rn2(10) >= 3 * armpro);
    if (negated) {
        if (verbosely) {
            /* attack has been thwarted by negation, aka magical cancellation */
            if (mdef == game.youmonst) {
                You("avoid harm.");
            } else if (game.vis && canseemon(mdef)) {
                pline_mon(mdef, "%s avoids harm.", Monnam(mdef));
            }
        }
        return (1);
    }
    /* dmgval handles those first three */
    /* silver in the reflective surface */
    return (0);
}
/* multi_reason is usually a literal string; here we generate one that
   has the causing monster's type included */
export function dynamic_multi_reason(mon, verb, by_gaze) {
    /* combination of noname_monnam() and m_monnam(), more or less;
       accurate regardless of visibility or hallucination (only seen
       if game ends) and without personal name (M2_PNAME excepted) */
    let who = x_monnam(mon, 2, null, (1 | 2 | 4 | 8 | 32), (0));
    let p = game.multireasonbuf;
    p = sprintf(p, "%u:", mon.m_id);
    /* prefix info for done_in_by() */
    p = eos(p);
    p = sprintf(p, "%s by %s%s", verb, !by_gaze ? who : s_suffix(who), !by_gaze ? "" : " gaze");
    game.multi_reason = p;
}
export function erode_armor(mdef, hurt) {
    let target = null;
    while (1) {
        switch (rn2(5)) {
            /* What the following code does: it keeps looping until it
     * finds a target for the rust monster.
     * Head, feet, etc... not covered by metal, or covered by
     * rusty metal, are not targets.  However, your body always
     * is, no matter what covers it.
     */
            /* copy silverhit info back into struct _hitmon_data *hmd */
            /* only one hit being attempted; a silver ring on either hand
             * applies but having silver rings on both is same as just one */
            case 0:
                target = which_armor(mdef, 4);
                if (!target || erode_obj(target, xname(target), hurt, 1) == 0) {
                    continue;
                }
                /* don't proceed with additional attacks */
                break;
            /* first of two or more hit attempts; right ring applies */
            case 1:
                target = which_armor(mdef, 2);
                if (target) {
                    erode_obj(target, xname(target), hurt, 1 | 4);
                    break;
                }
                if ((target = which_armor(mdef, 1)) != null) {
                    erode_obj(target, xname(target), hurt, 1 | 4);
                } else if ((target = which_armor(mdef, 64)) != null) {
                    erode_obj(target, xname(target), hurt, 1 | 4);
                }
                break;
            /* second of two or more hit attempts; left ring applies */
            case 2:
                target = which_armor(mdef, 8);
                if (!target || erode_obj(target, xname(target), hurt, 1) == 0) {
                    continue;
                }
                break;
            case 3:
                target = which_armor(mdef, 16);
                if (!target || erode_obj(target, xname(target), hurt, 1) == 0) {
                    continue;
                }
                break;
            case 4:
                target = which_armor(mdef, 32);
                if (!target || erode_obj(target, xname(target), hurt, 1) == 0) {
                    continue;
                }
                break;
        }
        break;
    }
}
/* FALSE means it's OK to attack */
/* target */
/* uwep for do_attack(), null for kick_monster() */
export function attack_checks(mtmp, wep) {
    let glyph = 0;
    /* if you're close enough to attack, alert any waiting monster */
    mtmp.mstrategy &= ~(268435456 | 536870912);
    if ((game.u.uswallow && (game.u.ustuck == (mtmp)))) {
        /* Do this in the caller, after we have checked that the monster
         * didn't die from the blow.  Reason: putting the 'I' there
         * causes the hero to forget the square's contents since
         * both 'I' and remembered contents are stored in .glyph.
         * If the monster dies immediately from the blow, the 'I' will
         * not stay there, so the player will have suddenly forgotten
         * the square's contents for no apparent reason.
        if (!canspotmon(mtmp)
            && !glyph_is_invisible(levl[gb.bhitpos.x][gb.bhitpos.y].glyph))
            map_invisible(gb.bhitpos.x, gb.bhitpos.y);
         */
        return (0);
    }
    if (game.context.forcefight) {
        return (0);
    }
    /* cache the shown glyph;
       cases which might change it (by placing or removing
       'remembered, unseen monster' glyph or revealing a mimic)
       always return without further reference to this */
    glyph = glyph_at(game.bhitpos.x, game.bhitpos.y);
    if (!(canseemon(mtmp) || sensemon(mtmp)) && !((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6)) && !((glyph) == GLYPH_INVIS_OFF) && !(!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && mtmp.mundetected && (((mtmp.data).mflags1 & 128) != 0))) {
        /* Put up an invisible monster marker, but with exceptions for
     * monsters that hide and monsters you've been warned about.
     * The former already prints a warning message and
     * prevents you from hitting the monster just via the hidden monster
     * code below; if we also did that here, similar behavior would be
     * happening two turns in a row.  The latter shows a glyph on
     * the screen, so you know something is there.
     */
        pline("Wait!  There's %s there you can't see!", c_common_strings.c_something);
        map_invisible(game.bhitpos.x, game.bhitpos.y);
        if (((mtmp).m_ap_type & 7) && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
            /* if it was an invisible mimic, treat it as if we stumbled
         * onto a visible mimic
         */
            if (!game.u.ustuck && !mtmp.mflee && dmgtype(mtmp.data, 19) && (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
                set_ustuck(mtmp);
            }
        }
        /* #H7329 - if hero is on engraved "Elbereth", this will end up
         * assessing an alignment penalty and removing the engraving
         * even though no attack actually occurs.  Since it also angers
         * peacefuls, we're operating as if an attack attempt did occur
         * and the Elbereth behavior is consistent.
         */
        /* always necessary; also un-mimics mimics */
        wakeup(mtmp, (1));
        return (1);
    }
    if (((mtmp).m_ap_type & 7) && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && !sensemon(mtmp) && !((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6))) {
        if (((glyph) == GLYPH_INVIS_OFF)) {
            /* applied pole-arm attack is too far to get stuck */
            /* If a hidden mimic was in a square where a player remembers
         * some (probably different) unseen monster, the player is in
         * luck--he attacks it even though it's hidden.
         */
            seemimic(mtmp);
            return (0);
        }
        stumble_onto_mimic(mtmp);
        return (1);
    }
    if (mtmp.mundetected && !canseemon(mtmp) && !((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6)) && ((((mtmp.data).mflags1 & 128) != 0) || mtmp.data.mlet == S_EEL)) {
        mtmp.mundetected = mtmp.msleeping = 0;
        newsym(mtmp.mx, mtmp.my);
        if (((glyph) == GLYPH_INVIS_OFF)) {
            seemimic(mtmp);
            return (0);
        }
        if (!tp_sensemon(mtmp) && !(game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic)) {
            let obj = null;
            let lmonbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let notseen = 0;
            lmonbuf = strcpy(lmonbuf, l_monnam(mtmp));
            /* might be unseen if invisible and hero can't see invisible */
            notseen = !strcmp(lmonbuf, "it");
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                pline("A %s %s %s!", mtmp.mtame ? "tame" : "wild", notseen ? "creature" : lmonbuf, notseen ? "is present" : "appears");
            } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (is_pool(mtmp.mx, mtmp.my) && !(game.u.uinwater))) {
                pline("Wait!  There's a hidden monster there!");
            } else if ((obj = game.level.objects[mtmp.mx][mtmp.my]) != null) {
                pline("Wait!  There's %s hiding under %s!", notseen ? c_common_strings.c_something : an(lmonbuf), doname(obj));
            }
            return (1);
        }
    }
    if ((mtmp.mundetected || ((mtmp).m_ap_type & 7)) && sensemon(mtmp)) {
        /*
     * make sure to wake up a monster from the above cases if the
     * hero can sense that the monster is there.
     */
        mtmp.mundetected = 0;
        wakeup(mtmp, (1));
    }
    if (game.flags.confirm && mtmp.mpeaceful && !game.u.uprops[CONFUSION].intrinsic && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !game.u.uprops[STUNNED].intrinsic) {
        if (is_art(wep, ART_STORMBRINGER)) {
            /* Intelligent chaotic weapons (Stormbringer) want blood */
            game.override_confirmation = (1);
            return (0);
        }
        if ((canseemon(mtmp) || sensemon(mtmp))) {
            let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            qbuf = sprintf(qbuf, "Really attack %s?", mon_nam(mtmp));
            if (!paranoid_query(((game.flags.paranoia_bits & 16) != 0), qbuf)) {
                game.context.move = 0;
                return (1);
            }
        }
    }
    return (0);
}
/* it is unchivalrous for a knight to attack the defenseless or from behind */
export function check_caitiff(mtmp) {
    if (game.u.ualign.record <= -10) {
        return;
    }
    if ((game.urole.mnum == (PM_KNIGHT)) && game.u.ualign.type == 1 && !(((mtmp.data).mflags2 & 2) != 0) && (((mtmp).msleeping || !(mtmp).mcanmove) || (mtmp.mflee && !mtmp.mavenge))) {
        You("caitiff!");
        adjalign(-1);
    } else if ((game.urole.mnum == (PM_SAMURAI)) && mtmp.mpeaceful) {
        /* attacking peaceful creatures is bad for the samurai's giri */
        You("dishonorably attack the innocent!");
        adjalign(-1);
    }
}
/* maybe unparalyze monster */
export function mon_maybe_unparalyze(mtmp) {
    if (!mtmp.mcanmove) {
        if (!rn2(10)) {
            mtmp.mcanmove = 1;
            mtmp.mfrozen = 0;
        }
    }
}
/* how easy it is for hero to hit a monster,
   using attack type aatyp and/or weapon.
   larger value == easier to hit */
/* usually AT_WEAP or AT_KICK */
/* uwep or uswapwep or NULL */
export function find_roll_to_hit(mtmp, aatyp, weapon, attk_count, role_roll_penalty) {
    let tmp = 0;
    let tmp2 = 0;
    role_roll_penalty.value = 0;
    tmp = 1 + abon() + find_mac(mtmp) + game.u.uhitinc + (sgn((game.u.uluck + game.u.moreluck)) * (Math.trunc((abs((game.u.uluck + game.u.moreluck)) + 2) / 3))) + ((game.u.umonnum != game.u.umonster) ? (game.youmonst.data.mlevel) : (game.u.ulevel));
    if (!(attk_count.value)++) {
        /* some actions should occur only once during multiple attacks */
        /* knight's chivalry or samurai's giri */
        check_caitiff(mtmp);
    }
    /* adjust vs. monster state */
    if (mtmp.mstun) {
        tmp += 2;
    }
    if (mtmp.mflee) {
        tmp += 2;
    }
    if (mtmp.msleeping) {
        tmp += 2;
    }
    if (!mtmp.mcanmove) {
        tmp += 4;
    }
    if ((game.urole.mnum == (PM_MONK)) && !(game.u.umonnum != game.u.umonster)) {
        if (game.uarm) {
            tmp -= (role_roll_penalty.value = game.urole.spelarmr);
        } else if (!game.uwep && !game.uarms) {
            tmp += (Math.trunc(game.u.ulevel / 3)) + 2;
        }
    }
    if ((((mtmp.data).mflags2 & 128) != 0) && ((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 16) != 0)) : ((game.urace.mnum == (PM_ELF))))) {
        tmp++;
    }
    /* encumbrance: with a lot of luggage, your agility diminishes */
    if ((tmp2 = near_capacity()) != 0) {
        tmp -= (tmp2 * 2) - 1;
    }
    if (game.u.utrap) {
        tmp -= 3;
    }
    if (aatyp == 254 || aatyp == 1) {
        /*
     * hitval applies if making a weapon attack while wielding a weapon;
     * weapon_hit_bonus applies if doing a weapon attack even bare-handed
     * or if kicking as martial artist
     */
        if (weapon) {
            tmp += hitval(weapon, mtmp);
        }
        tmp += weapon_hit_bonus(weapon);
    } else if (aatyp == 3 && ((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))) {
        tmp += weapon_hit_bonus(null);
    }
    return tmp;
}
/* temporarily override 'safepet' (by faking use of 'F' prefix) when possibly
   unintentionally attacking peaceful monsters and optionally pets */
export function force_attack(mtmp, pets_too) {
    let attacked = 0;
    let save_Forcefight = 0;
    save_Forcefight = game.context.forcefight;
    /* always set forcefight On for hostiles and peacefuls, maybe for pets */
    if (pets_too || !mtmp.mtame) {
        game.context.forcefight = (1);
    }
    attacked = do_attack(mtmp);
    game.context.forcefight = save_Forcefight;
    return attacked;
}
/* try to attack; return False if monster evaded;
   u.dx and u.dy must be set */
export function do_attack(mtmp) {
    let mdat = null;
    atk_done: {
        mdat = mtmp.data;
        if (is_safemon(mtmp) && !game.context.forcefight) {
            if (!is_art(game.uwep, ART_STORMBRINGER)) {
                /* This section of code provides protection against accidentally
     * hitting peaceful (like '@') and tame (like 'd') monsters.
     * Protection is provided as long as player is not: blind, confused,
     * hallucinating or stunned.
     * changes by wwp 5/16/85
     * More changes 12/90, -dkh-. if its tame and safepet, (and protected
     * 07/92) then we assume that you're not trying to attack. Instead,
     * you'll usually just swap places if this is a movement command
     */
                /* There are some additional considerations: this won't work
             * if in a shop or Punished or you miss a random roll or
             * if you can walk thru walls and your pet cannot (KAA) or
             * if your pet is a long worm with a tail.
             * There's also a chance of displacing a "frozen" monster:
             * sleeping monsters might magically walk in their sleep.
             * This block of code used to only be called for pets; now
             * that it also applies to peacefuls, non-pets mustn't be
             * forced to flee.
             */
                let foo = ((game.uball != null) || !rn2(7) || ((((mtmp.data) == game.mons[PM_BABY_LONG_WORM]) || ((mtmp.data) == game.mons[PM_LONG_WORM]) || ((mtmp.data) == game.mons[PM_LONG_WORM_TAIL])) && mtmp.wormno) || (((game.level.locations[game.u.ux][game.u.uy].typ) < POOL) && !(((mtmp.data).mflags1 & 8) != 0)));
                let inshop = (0);
                let p = null;
                if (!foo) {
                    const __rooms = in_rooms(mtmp.mx, mtmp.my, SHOPBASE);
                    const __rs = (typeof __rooms === 'string') ? __rooms : '';
                    for (let __ri = 0; __ri < __rs.length; __ri++) {
                        if (tended_shop(game.rooms[__rs.charCodeAt(__ri) - 3])) {
                            /* only check for in-shop if don't already have reason to stop */
                            inshop = (1);
                            /*  These only affect you if they still live.
     */
                            break;
                        }
                    }
                }
                if (inshop || foo) {
                    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    if (!game.context.travel && !game.context.run) {
                        if ((canseemon(mtmp) || sensemon(mtmp)) && mtmp.isshk) {
                            return 1 | dopay();
                        }
                    }
                    /* see 'additional considerations' above */
                    if (mtmp.mtame) {
                        monflee(mtmp, rnd(6), (0), (0));
                    }
                    /* C ref uhitm.c — capitalize the y_monnam result */
                    let __ynm = y_monnam(mtmp);
                    __ynm = __ynm ? __ynm.charAt(0).toUpperCase() + __ynm.slice(1) : __ynm;
                    You("stop.  %s is in the way!", __ynm);
                    end_running((1));
                    return (1);
                } else if (mtmp.mfrozen || ((mtmp).msleeping || !(mtmp).mcanmove) || (mtmp.data.mmove == 0 && rn2(6))) {
                    pline("%s doesn't seem to move!", Monnam(mtmp));
                    end_running((1));
                    return (1);
                } else {
                    return (0);
                }
            }
        }
        /* possibly set in attack_checks;
       examined in known_hitum, called via hitum or hmonas below */
        game.override_confirmation = (0);
        /* attack_checks() used to use <u.ux+u.dx,u.uy+u.dy> directly, now
       it uses gb.bhitpos instead; it might map an invisible monster there */
        game.bhitpos.x = game.u.ux + game.u.dx;
        game.bhitpos.y = game.u.uy + game.u.dy;
        game.notonhead = (game.bhitpos.x != mtmp.mx || game.bhitpos.y != mtmp.my);
        if (attack_checks(mtmp, game.uwep)) {
            return (1);
        }
        if ((game.u.umonnum != game.u.umonster) && noattacks(game.youmonst.data)) {
            /* certain "pacifist" monsters don't attack */
            You("have no way to attack monsters physically.");
            mtmp.mstrategy &= ~(268435456 | 536870912);
            break atk_done;
        }
        if (check_capacity("You cannot fight while so heavily loaded.") || overexertion()) {
            break atk_done;
        }
        if (game.u.twoweap && !can_twoweapon()) {
            untwoweapon();
        }
        if (game.unweapon) {
            /* consume extra nutrition during combat; maybe pass out */
            game.unweapon = (0);
            if (game.flags.verbose) {
                if (game.uwep) {
                    You("begin bashing monsters with %s.", yname(game.uwep));
                } else if (!((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1))) {
                    You("begin %s monsters with your %s %s.", ing_suffix((game.urole.mnum == (PM_MONK)) ? "strike" : "bash"), game.uarmg ? "gloved" : "bare", makeplural(body_part(HAND)));
                }
            }
        }
        /* you're exercising muscles */
        exercise(A_STR, (1));
        /* andrew@orca: prevent unlimited pick-axe attacks */
        u_wipe_engr(3);
        if (mdat.mlet == S_LEPRECHAUN && !mtmp.mfrozen && !((mtmp).msleeping || !(mtmp).mcanmove) && !mtmp.mconf && mtmp.mcansee && !rn2(7) && (m_move(mtmp, 0) == 2 || mtmp.mx != game.u.ux + game.u.dx || mtmp.my != game.u.uy + game.u.dy)) {
            /* Is the "it died" check actually correct? */
            You("miss wildly and stumble forwards.");
            return (0);
        }
        if ((game.u.umonnum != game.u.umonster)) {
            hmonas(mtmp);
        } else {
            hitum(mtmp, game.youmonst.data.mattk);
        }
        mtmp.mstrategy &= ~(268435456 | 536870912);
    }
    /* see comment in attack_checks() */
    /* we only need to check for this if we did an attack_checks()
     * and it returned 0 (it's okay to attack), and the monster didn't
     * evade.
     */
    if (game.context.forcefight && !((mtmp).mhp < 1) && !(canseemon(mtmp) || sensemon(mtmp)) && !((game.level.locations[game.u.ux + game.u.dx][game.u.uy + game.u.dy].glyph) == GLYPH_INVIS_OFF) && !(game.u.uswallow && (game.u.ustuck == (mtmp)))) {
        map_invisible(game.u.ux + game.u.dx, game.u.uy + game.u.dy);
    }
    return (1);
}
/* really hit target monster; returns TRUE if it still lives */
/* target */
/* uwep or uswapwep */
/* *mhit is 1 or 0; hit (1) gets changed to miss (0)
                         * for decapitation attack against headless target */
/* rollneeded and armorpenalty are used for monks  +*/
/*+ wearing suits so miss message can vary for missed
                         *  because of penalty vs would have missed anyway  */
export function known_hitum(mon, weapon, mhit, rollneeded, armorpenalty, uattk, dieroll) {
    let malive = (1);
    let slice_or_chop = (weapon && ((weapon.oclass == WEAPON_CLASS && game.objects[weapon.otyp].oc_subtyp >= P_DAGGER && game.objects[weapon.otyp].oc_subtyp <= P_SABER) || ((weapon.oclass == WEAPON_CLASS || weapon.oclass == TOOL_CLASS) && game.objects[weapon.otyp].oc_subtyp == P_AXE)));
    if (game.override_confirmation) {
        /* hmon() might destroy weapon; remember aspect for cutworm */
        /* this may need to be generalized if weapons other than
           Stormbringer acquire similar anti-social behavior... */
        if (game.flags.verbose) {
            Your("bloodthirsty blade attacks!");
        }
    }
    if (!mhit.value) {
        missum(mon, uattk, (rollneeded + armorpenalty > dieroll));
    } else {
        let oldhp = mon.mhp;
        let oldweaphit = game.u.uconduct.weaphit;
        if (weapon && (weapon.oclass == WEAPON_CLASS || ((weapon).oclass == TOOL_CLASS && game.objects[(weapon).otyp].oc_subtyp != P_NONE))) {
            game.u.uconduct.weaphit++;
        }
        /* we hit the monster; be careful: it might die or
           be knocked into a different location */
        game.notonhead = (mon.mx != game.bhitpos.x || mon.my != game.bhitpos.y);
        malive = hmon(mon, weapon, HMON_MELEE, dieroll);
        if (malive) {
            if (!rn2(25) && mon.mhp < Math.trunc(mon.mhpmax / 2) && !(game.u.uswallow && (game.u.ustuck == (mon)))) {
                /* maybe should regurgitate if swallowed? */
                monflee(mon, !rn2(3) ? rnd(100) : 0, (0), (1));
                if (game.u.ustuck == mon && !game.u.uswallow && !sticks(game.youmonst.data)) {
                    set_ustuck(null);
                }
            }
            if (mon.mhp == oldhp) {
                /* Vorpal Blade hit converted to miss */
                /* could be headless monster or worm tail */
                mhit.value = 0;
                /* a miss does not break conduct */
                game.u.uconduct.weaphit = oldweaphit;
            }
            if (mon.wormno && mhit.value) {
                cutworm(mon, game.bhitpos.x, game.bhitpos.y, slice_or_chop);
            }
        }
    }
    return malive;
}
/* hit the monster next to you and the monsters to the left and right of it;
   return False if the primary target is killed, True otherwise */
/* non-Null; forcefight at nothing doesn't cleave +*/
/*+ but we don't enforce that here; Null works ok */
let __hitum_cleave_clockwise = (0);
export function hitum_cleave(target, uattk) {
    /* swings will be delivered in alternate directions; with consecutive
       attacks it will simulate normal swing and backswing; when swings
       are non-consecutive, hero will sometimes start a series of attacks
       with a backswing--that doesn't impact actual play, just spoils the
       simulation attempt a bit */
    let i = 0;
    let save_bhitpos = { x: 0, y: 0 };
    let save_notonhead = 0;
    let count = 0;
    let umort = 0;
    let x = game.u.ux;
    let y = game.u.uy;
    /* find the direction toward primary target */
    i = xytodir(game.u.dx, game.u.dy);
    if (i == DIR_ERR) {
        impossible("hitum_cleave: unknown target direction [%d,%d,%d]?", game.u.dx, game.u.dy, game.u.dz);
        return (1);
    }
    /* adjust direction by two so that loop's increment (for clockwise)
       or decrement (for counter-clockwise) will point at the spot next
       to primary target */
    i = __hitum_cleave_clockwise ? (((i) + 6) % (N_DIRS_Z - 2)) : (((i) + 2) % (N_DIRS_Z - 2));
    /* used to detect life-saving */
    umort = game.u.umortality;
    Object.assign(save_bhitpos, game.bhitpos);
    save_notonhead = game.notonhead;
    for (count = 3; count > 0; --count) {
        /*
     * Three attacks:  adjacent to primary, primary, adjacent on other
     * side.  Primary target must be present or we wouldn't have gotten
     * here (forcefight at thin air won't 'cleave').  However, the
     * first attack might kill it (gas spore explosion, weak long worm
     * occupying both spots) so we don't assume that it's still present
     * on the second attack.
     */
        let mtmp = null;
        let tx = 0;
        let ty = 0;
        let tmp = 0;
        let dieroll = 0;
        let mhit = 0;
        let attknum = 0;
        let armorpenalty = 0;
        /* ++i, wrap 8 to i=0 /or/ --i, wrap -1 to i=7 */
        i = __hitum_cleave_clockwise ? (((i) + 1) % (N_DIRS_Z - 2)) : (((i) + 7) % (N_DIRS_Z - 2));
        tx = x + xdir[i] , ty = y + ydir[i];
        if (!isok(tx, ty)) {
            continue;
        }
        mtmp = (game.level.monsters[tx][ty]);
        if (!mtmp) {
            if (((game.level.locations[tx][ty].glyph) == GLYPH_INVIS_OFF)) {
                unmap_invisible(tx, ty);
            }
            continue;
        }
        tmp = find_roll_to_hit(mtmp, uattk.aatyp, game.uwep, { get value() { return attknum; }, set value(_v) { attknum = _v; } }, { get value() { return armorpenalty; }, set value(_v) { armorpenalty = _v; } });
        mon_maybe_unparalyze(mtmp);
        dieroll = rnd(20);
        mhit = (tmp > dieroll);
        /* normally set by do_attack() */
        game.bhitpos.x = tx , game.bhitpos.y = ty;
        game.notonhead = (mtmp.mx != tx || mtmp.my != ty);
        known_hitum(mtmp, game.uwep, { get value() { return mhit; }, set value(_v) { mhit = _v; } }, tmp, armorpenalty, uattk, dieroll);
        passive(mtmp, game.uwep, mhit, !((mtmp).mhp < 1), 254, !game.uwep);
        /* stop attacking if weapon is gone or hero got paralyzed or
           killed (and then life-saved) by passive counter-attack */
        if (!game.uwep || game.multi < 0 || game.u.umortality > umort) {
            break;
        }
    }
    __hitum_cleave_clockwise = !__hitum_cleave_clockwise;
    /* in case somebody relies on bhitpos
                                * designating the primary target */
    game.bhitpos = save_bhitpos;
    game.notonhead = save_notonhead;
    /* return False if primary target died, True otherwise; note: if 'target'
       was nonNull upon entry then it's still nonNull even if *target died */
    return (target && ((target).mhp < 1)) ? (0) : (1);
}
/* returns True if hero is fighting without a weapon and without a shield and
   has sufficient skill in bare-handed/martial arts to attack twice */
export function double_punch() {
    /* note: P_BARE_HANDED_COMBAT and P_MARTIAL_ARTS are equivalent */
    let skl_lvl = (game.u.weapon_skills[P_BARE_HANDED_COMBAT].skill);
    /*
     * Chance to attempt a second bare-handed or martial arts hit:
     *  restricted  (0),        [not applicable; no one is restricted]
     *  unskilled   (1) :  0%
     *  basic       (2) :  0%
     *  skilled     (3) : 20%
     *  expert      (4) : 40%
     *  master      (5) : 60%
     *  grandmaster (6) : 80%
     */
    if (!game.uwep && !game.uarms && skl_lvl > P_BASIC) {
        return (skl_lvl - P_BASIC) > rn2(5);
    }
    return (0);
}
/* hit target monster; returns TRUE if it still lives */
export function hitum(mon, uattk) {
    let malive = 0;
    let wep_was_destroyed = (0);
    let wepbefore = game.uwep;
    let secondwep = game.u.twoweap ? game.uswapwep : null;
    let tmp = 0;
    let dieroll = 0;
    let mhit = 0;
    let armorpenalty = 0;
    let attknum = 0;
    let x = game.u.ux + game.u.dx;
    let y = game.u.uy + game.u.dy;
    let oldumort = game.u.umortality;
    /* Cleaver attacks three spots, 'mon' and one on either side of 'mon';
       it can't be part of dual-wielding but we guard against that anyway;
       cleave return value reflects status of primary target ('mon') */
    if (is_art(game.uwep, ART_CLEAVER) && !game.u.twoweap && !game.u.uswallow && !game.u.ustuck && !((game.u.umonnum) == PM_GRID_BUG)) {
        return hitum_cleave(mon, uattk);
    }
    /* 0: single hit, 1: first of two hits; affects strength bonus and
       silver rings; known_hitum() -> hmon() -> hmon_hitmon() will copy
       gt.twohits into struct _hitmon_data hmd.twohits */
    game.twohits = (game.uwep ? game.u.twoweap : double_punch()) ? 1 : 0;
    tmp = find_roll_to_hit(mon, uattk.aatyp, game.uwep, { get value() { return attknum; }, set value(_v) { attknum = _v; } }, { get value() { return armorpenalty; }, set value(_v) { armorpenalty = _v; } });
    mon_maybe_unparalyze(mon);
    dieroll = rnd(20);
    mhit = (tmp > dieroll || game.u.uswallow);
    if (tmp > dieroll) {
        exercise(A_DEX, (1));
    }
    /* gb.bhitpos is set up by caller */
    malive = known_hitum(mon, game.uwep, { get value() { return mhit; }, set value(_v) { mhit = _v; } }, tmp, armorpenalty, uattk, dieroll);
    if (wepbefore && !game.uwep) {
        wep_was_destroyed = (1);
    }
    passive(mon, game.uwep, mhit, malive, 254, wep_was_destroyed);
    if (game.twohits && !(game.override_confirmation || game.multi < 0 || game.u.umortality > oldumort || !malive || (game.level.monsters[x][y]) != mon)) {
        /* second attack for two-weapon combat or skilled unarmed combat;
       won't occur if Stormbringer overrode confirmation (assumes
       Stormbringer is primary weapon), or if hero became paralyzed by
       passive counter-attack, or if hero was killed by passive
       counter-attack and got life-saved, or if monster was killed or
       knocked to different location */
        game.twohits = 2;
        tmp = find_roll_to_hit(mon, uattk.aatyp, game.uswapwep, { get value() { return attknum; }, set value(_v) { attknum = _v; } }, { get value() { return armorpenalty; }, set value(_v) { armorpenalty = _v; } });
        mon_maybe_unparalyze(mon);
        dieroll = rnd(20);
        mhit = (tmp > dieroll || game.u.uswallow);
        malive = known_hitum(mon, secondwep, { get value() { return mhit; }, set value(_v) { mhit = _v; } }, tmp, armorpenalty, uattk, dieroll);
        /* second passive counter-attack only occurs if second attack hits */
        if (mhit) {
            passive(mon, secondwep, mhit, malive, 254, secondwep && !game.uswapwep);
        }
    }
    game.twohits = 0;
    return malive;
}
/* general "damage monster" routine; return True if mon still alive */
/* HMON_xxx (0 => hand-to-hand, other => ranged) */
export function hmon(mon, obj, thrown, dieroll) {
    let result = 0;
    let anger_guards = 0;
    anger_guards = (mon.mpeaceful && (mon.ispriest || mon.isshk || ((mon.data) == game.mons[PM_WATCHMAN] || (mon.data) == game.mons[PM_WATCH_CAPTAIN])));
    result = hmon_hitmon(mon, obj, thrown, dieroll);
    if (mon.ispriest && !rn2(2)) {
        ghod_hitsu(mon);
    }
    if (anger_guards) {
        angry_guards(!!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf));
    }
    return result;
}
/* hero hits monster bare handed */
export function hmon_hitmon_barehands(hmd, mon) {
    let spcdmgflg = 0;
    let silverhit = 0;
    if (hmd.mdat == game.mons[PM_SHADE]) {
        hmd.dmg = 0;
    } else {
        /* note: 1..2 or 1..4 can be substantially increased by
           strength bonus or skill bonus, usually both... */
        hmd.dmg = rnd(!((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) ? 2 : 4);
        hmd.use_weapon_skill = (1);
        /* a minimal hit doesn't exercise proficiency */
        hmd.train_weapon_skill = (hmd.dmg > 1);
    }
    /* Blessed gloves give bonuses when fighting 'bare-handed'.  So do
       silver rings.  Note:  rings are worn under gloves, so you don't
       get both bonuses, and two silver rings don't give double bonus.
       When making only one hit, both rings are checked (backwards
       compatibility => playability), but when making two hits, only the
       ring on the hand making the attack is checked. */
    spcdmgflg = game.uarmg ? 16 : (((hmd.twohits == 0 || hmd.twohits == 1) ? 262144 : 0) | ((hmd.twohits == 0 || hmd.twohits == 2) ? 131072 : 0));
    hmd.dmg += special_dmgval(game.youmonst, mon, spcdmgflg, { get value() { return silverhit; }, set value(_v) { silverhit = _v; } });
    switch (hmd.twohits) {
        case 0:
            hmd.barehand_silver_rings = (silverhit & (262144 | 131072)) ? 1 : 0;
            break;
        case 1:
            hmd.barehand_silver_rings = (silverhit & 262144) ? 1 : 0;
            break;
        case 2:
            hmd.barehand_silver_rings = (silverhit & 131072) ? 1 : 0;
            break;
        /* third or later of more than two hit attempts (poly'd hero);
              * rings were applied on first and second hits */
        default:
            hmd.barehand_silver_rings = 0;
            break;
    }
    if (hmd.barehand_silver_rings > 0) {
        hmd.silvermsg = (1);
    }
}
/* obj is not NULL */
export function hmon_hitmon_weapon_ranged(hmd, mon, obj) {
    if (hmd.mdat == game.mons[PM_SHADE] && !shade_glare(obj)) {
        hmd.dmg = 0;
    /* then do only 1-2 points of damage and don't use or
       train weapon's skill */
    } else {
        hmd.dmg = rnd(2);
    }
    if (hmd.material == SILVER && mon_hates_silver(mon)) {
        hmd.silvermsg = hmd.silverobj = (1);
        /* if it will already inflict dmg, make it worse */
        hmd.dmg += rnd((hmd.dmg) ? 20 : 10);
    }
    if (!hmd.thrown && obj == game.uwep && obj.otyp == BOOMERANG && rnl(4) == 4 - 1) {
        let more_than_1 = (obj.quan > 1);
        pline("As you hit %s, %s%s breaks into splinters.", mon_nam(mon), more_than_1 ? "one of " : "", yname(obj));
        if (!more_than_1) {
            uwepgone();
        }
        /* minor side-effect: broken lance won't split puddings */
        useup(obj);
        if (!more_than_1) {
            obj = null;
        }
        hmd.hittxt = (1);
        if (hmd.mdat != game.mons[PM_SHADE]) {
            hmd.dmg++;
        }
    }
}
/* can monster be stabbed in the back? */
export function backstabbable(mon) {
    return !(((mon.data).mflags1 & 4) != 0) && !((mon.data).mlet == S_VORTEX || (mon.data) == game.mons[PM_AIR_ELEMENTAL]) && !((mon.data).mlet == S_GHOST) && mon.data.mlet != S_BLOB && mon.data.mlet != S_EYE && mon.data.mlet != S_FUNGUS && canseemon(mon) && (mon.mflee || ((mon).msleeping || !(mon).mcanmove));
}
/* obj is not NULL */
const __hmon_hitmon_weapon_melee_from_your_blow = " from the force of your blow!";
export function hmon_hitmon_weapon_melee(hmd, mon, obj) {
    let wtype = 0;
    let monwep = null;
    hmd.use_weapon_skill = (1);
    hmd.dmg = dmgval(obj, mon);
    hmd.train_weapon_skill = (hmd.dmg > 1);
    /* Healer with anatomy knowledge */
    if ((game.urole.mnum == (PM_HEALER)) && hmd.hand_to_hand && obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp == P_KNIFE) {
        hmd.dmg += ((3) < (Math.trunc(game.mvitals[((mon.data).pmidx)].died / 6)) ? (3) : (Math.trunc(game.mvitals[((mon.data).pmidx)].died / 6)));
    }
    if (!hmd.train_weapon_skill || mon == game.u.ustuck || game.u.twoweap || (hmd.hand_to_hand && is_art(obj, ART_CLEAVER))) {
        ;
    } else if ((game.urole.mnum == (PM_ROGUE)) && backstabbable(mon) && !(game.u.umonnum != game.u.umonster) && hmd.hand_to_hand) {
        /* Cleaver can hit up to three targets at once so don't
           let it also hit from behind or shatter foes' weapons */
        /* multi-shot throwing is too powerful here */
        You("strike %s from behind!", mon_nam(mon));
        hmd.dmg += rnd(game.u.ulevel);
        hmd.hittxt = (1);
    } else if (hmd.dieroll == 2 && obj == game.uwep && obj.oclass == WEAPON_CLASS && (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_big) || ((game.urole.mnum == (PM_SAMURAI)) && obj.otyp == KATANA && !game.uarms)) && ((wtype = uwep_skill_type()) != P_NONE && (game.u.weapon_skills[wtype].skill) >= P_SKILLED) && ((monwep = ((mon).mw)) != null && !(game.objects[(monwep).otyp].oc_material <= LEATHER || (monwep).otyp == RUBBER_HOSE) && !obj_resists(monwep, 50 + 15 * (((obj).oeroded > (obj).oeroded2 ? (obj).oeroded : (obj).oeroded2) - ((monwep).oeroded > (monwep).oeroded2 ? (monwep).oeroded : (monwep).oeroded2)), 100))) {
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        /*
         * 2.5% chance of shattering defender's weapon when
         * using a two-handed weapon; less if uwep is rusted.
         * [dieroll == 2 is most successful non-beheading or
         * -bisecting hit, in case of special artifact damage;
         * the percentage chance is (1/20)*(50/100).]
         * If attacker's weapon is rustier than defender's,
         * the obj_resists chance is increased so the shatter
         * chance is decreased; if less rusty, then vice versa.
         */
        setmnotwielded(mon, monwep);
        mon.weapon_check = NEED_WEAPON;
        if (canseemon(mon)) {
            buf = strcpy(buf, Yobjnam2(monwep, "shatter"));
        } else {
            buf = sprintf(buf, "%s weapon%s %s", s_suffix(Monnam(mon)), (((monwep.quan) == 1) ? "" : "s"), otense(monwep, "shatter"));
        }
        buf[256 /* sizeof(char [256]) */ - 30 /* sizeof(const char [30]) */] = 0;
        pline("%s%s", buf, __hmon_hitmon_weapon_melee_from_your_blow);
        m_useupall(mon, monwep);
        if (rn2(4)) {
            /* Yobjnam2(X,"shatter") yields "Shk's X shatters" if X is owned
               by a shop or "Mon's X shatters" if X is carried by a monster
               (or "{Your|The} X shatters" if {carried by hero|last resort})*/
            /* hero is blind or can't see invisible mon */
            /* construct "Its weapon shatters"; not an exact replacement
               for Yobjnam2() if an unseen mon other than the shopkeeper
               is wielding a shop-owned weapon; telepathy or extended
               monster detection will name mon but not its weapon */
            /* If someone just shattered MY weapon, I'd flee! */
            monflee(mon, d(2, 3), (1), (1));
        }
        hmd.hittxt = (1);
    }
    if (obj.oartifact && artifact_hit(game.youmonst, mon, obj, { get value() { return hmd.dmg; }, set value(_v) { hmd.dmg = _v; } }, hmd.dieroll)) {
        if (((mon).mhp < 1)) {
            /* artifact_hit updates 'tmp' but doesn't inflict any
           damage; however, it might cause carried items to be
           destroyed and they might do so */
            /* perhaps artifact tried to behead a headless monster */
            hmd.doreturn = (1);
            hmd.retval = (0);
            /* Don't return yet; keep hp<1 and mhm.damage=0 for pet msg */
            /* Not clear what to do for green slimes */
            return;
        }
        if (hmd.dmg == 0) {
            hmd.doreturn = (1);
            hmd.retval = (1);
            return;
        }
        hmd.hittxt = (1);
    }
    if (hmd.material == SILVER && mon_hates_silver(mon)) {
        hmd.silvermsg = hmd.silverobj = (1);
    }
    if (artifact_light(obj) && obj.lamplit && mon_hates_light(mon)) {
        hmd.lightobj = (1);
    }
    if (game.u.usteed && !hmd.thrown && hmd.dmg > 0 && weapon_type(obj) == P_LANCE && mon != game.u.ustuck) {
        hmd.jousting = joust(mon, obj);
        /* exercise skill even for minimal damage hits */
        if (hmd.jousting) {
            hmd.train_weapon_skill = (1);
        }
    }
    if (hmd.thrown == HMON_THROWN && (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[obj.otyp].oc_subtyp <= -P_DART))) {
        if ((((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) {
            /* elves and samurai do extra damage using their own
               bows with their own arrows; they're highly trained */
            if ((game.urole.mnum == (PM_SAMURAI)) && obj.otyp == YA && game.uwep.otyp == YUMI) {
                hmd.dmg++;
            } else if ((game.urace.mnum == (PM_ELF)) && obj.otyp == ELVEN_ARROW && game.uwep.otyp == ELVEN_BOW) {
                hmd.dmg++;
            }
            hmd.train_weapon_skill = (hmd.dmg > 0);
        }
        if (obj.otrapped && ((obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp >= -P_SHURIKEN && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || permapoisoned(obj))) {
            hmd.ispoisoned = (1);
        }
    }
    /* permapoisoned is non-ammo/missile, limit the poison */
    if (permapoisoned(obj) && hmd.dieroll <= 5) {
        hmd.ispoisoned = (1);
    }
}
/* obj is not NULL */
export function hmon_hitmon_weapon(hmd, mon, obj) {
    if ((obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp >= P_BOW && game.objects[obj.otyp].oc_subtyp <= P_CROSSBOW) || (!hmd.thrown && (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[obj.otyp].oc_subtyp <= -P_DART) || ((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW))) || (!hmd.thrown && !game.u.usteed && ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && (game.objects[obj.otyp].oc_subtyp == P_POLEARMS || game.objects[obj.otyp].oc_subtyp == P_LANCE || is_art(obj, ART_SNICKERSNEE))) && !is_art(obj, ART_SNICKERSNEE)) || (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && (hmd.thrown != HMON_THROWN || !(((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))))) {
        /* is it not a melee weapon? */
        /* if you strike with a bow... */
        /* or strike with a missile in your hand... */
        /* or use a pole at short range and not mounted... */
        /* or throw a missile without the proper bow... */
        hmon_hitmon_weapon_ranged(hmd, mon, obj);
    } else {
        hmon_hitmon_weapon_melee(hmd, mon, obj);
        if (hmd.doreturn) {
            return;
        }
    }
}
/* obj is not NULL */
export function hmon_hitmon_potion(hmd, mon, obj) {
    if (obj.quan > 1) {
        obj = splitobj(obj, 1);
    } else {
        setuwep(null);
    }
    freeinv(obj);
    potionhit(mon, obj, hmd.hand_to_hand ? 0 : 1);
    if (((mon).mhp < 1)) {
        hmd.doreturn = (1);
        hmd.retval = (0);
        return;
    }
    hmd.hittxt = (1);
    /* in case potion effect causes transformation */
    hmd.mdat = mon.data;
    hmd.dmg = (hmd.mdat == game.mons[PM_SHADE]) ? 0 : 1;
}
/* obj is not NULL */
export function hmon_hitmon_misc_obj(hmd, mon, obj) {
    switch (obj.otyp) {
        case BOULDER:
        case HEAVY_IRON_BALL:
        case IRON_CHAIN:
            hmd.dmg = dmgval(obj, mon);
            break;
        case MIRROR:
            if (breaktest(obj)) {
                You("break %s.  That's bad luck!", ysimple_name(obj));
                change_luck(-2);
                useup(obj);
                obj = null;
                hmd.unarmed = (0);
                hmd.get_dmg_bonus = (0);
                hmd.hittxt = (1);
            }
            hmd.dmg = 1;
            break;
        case EXPENSIVE_CAMERA:
            You("succeed in destroying %s.  Congratulations!", ysimple_name(obj));
            release_camera_demon(obj, game.u.ux, game.u.uy);
            useup(obj);
            hmd.doreturn = (1);
            hmd.retval = (1);
            return;
        case CORPSE:
            if (((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE])) {
                /* fixed by polder@cs.vu.nl */
                hmd.dmg = 1;
                hmd.hittxt = (1);
                You("hit %s with %s.", mon_nam(mon), corpse_xname(obj, null, obj.dknown ? 4 : 8));
                observe_object(obj);
                if (!munstone(mon, (1))) {
                    minstapetrify(mon, (1));
                }
                if (Resists_Elem(mon, STONE_RES)) {
                    break;
                }
                /* note: hp may be <= 0 even if munstoned==TRUE */
                hmd.doreturn = (1);
                hmd.retval = !((mon).mhp < 1);
                /*return (boolean) !DEADMONSTER(mon);*/
                /* maybe turn the corpse into a statue? */
                return;
            }
            hmd.dmg = (((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS) ? game.mons[obj.corpsenm].msize : 0) + 1;
            break;
        case EGG:
{
                let cnt = obj.quan;
                hmd.dmg = 1;
                hmd.get_dmg_bonus = (0);
                hmd.hittxt = (1);
                /* egg is always either used up or transformed, so next
           hand-to-hand attack should yield a "bashing" mesg */
                if (obj == game.uwep) {
                    game.unweapon = (1);
                }
                if (obj.spe && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS)) {
                    if (obj.quan < 5) {
                        change_luck(-(obj.quan));
                    } else {
                        change_luck(-5);
                    }
                }
                if (((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS) && ((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE])) {
                    /*learn_egg_type(obj->corpsenm);*/
                    pline("Splat!  You hit %s with %s %s egg%s!", mon_nam(mon), obj.known ? "the" : cnt > 1 ? "some" : "a", obj.known ? game.mons[obj.corpsenm].pmnames[NEUTRAL] : "petrifying", (((cnt) == 1) ? "" : "s"));
                    obj.known = 1;
                    do {
                        if (hmd.thrown) {
                            obfree(obj, null);
                        } else {
                            useupall(obj);
                        }
                        obj = null;
                    } while (0);
                    if (!munstone(mon, (1))) {
                        minstapetrify(mon, (1));
                    }
                    if (Resists_Elem(mon, STONE_RES)) {
                        break;
                    }
                    hmd.doreturn = (1);
                    hmd.retval = !((mon).mhp < 1);
                    /*return (boolean) (!DEADMONSTER(mon));*/
                    return;
                } else {
                    let mnum = obj.corpsenm;
                    let eggp = (((mnum) >= LOW_PM && (mnum) < NUMMONS) && obj.known) ? the(game.mons[mnum].pmnames[NEUTRAL]) : (cnt > 1) ? "some" : "an";
                    You("hit %s with %s egg%s.", mon_nam(mon), eggp, (((cnt) == 1) ? "" : "s"));
                    if (((hmd.mdat) == game.mons[PM_COCKATRICE] || (hmd.mdat) == game.mons[PM_CHICKATRICE]) && !((game.moves - (obj).age) > (2 * 200))) {
                        pline_The("egg%s %s alive any more...", (((cnt) == 1) ? "" : "s"), (cnt == 1) ? "isn't" : "aren't");
                        if (obj.timed) {
                            obj_stop_timers(obj);
                        }
                        obj.otyp = ROCK;
                        obj.oclass = GEM_CLASS;
                        obj.oartifact = 0;
                        obj.spe = 0;
                        obj.known = obj.dknown = obj.bknown = 0;
                        obj.owt = weight(obj);
                        if (hmd.thrown) {
                            place_object(obj, mon.mx, mon.my);
                        }
                    } else if (obj.corpsenm == PM_PYROLISK) {
                        do {
                            if (hmd.thrown) {
                                obfree(obj, null);
                            } else {
                                useupall(obj);
                            }
                            obj = null;
                        } while (0);
                        explode(mon.mx, mon.my, -11, d(3, 6), 0, EXPL_FIERY);
                        hmd.doreturn = (1);
                        hmd.retval = !((mon).mhp < 1);
                        return;
                    } else {
                        pline("Splat!");
                        do {
                            if (hmd.thrown) {
                                obfree(obj, null);
                            } else {
                                useupall(obj);
                            }
                            obj = null;
                        } while (0);
                        exercise(A_WIS, (0));
                    }
                }
                break;
            }
        case CLOVE_OF_GARLIC:
            if ((((hmd.mdat).mflags2 & 2) != 0) || ((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) {
                /* no effect against demons */
                monflee(mon, d(2, 4), (0), (1));
            }
            hmd.dmg = 1;
            break;
        case CREAM_PIE:
        case BLINDING_VENOM:
            mon.msleeping = 0;
            if (can_blnd(game.youmonst, mon, ((obj.otyp == BLINDING_VENOM) ? 10 : 254), obj)) {
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    pline(obj.otyp == CREAM_PIE ? "Splat!" : "Splash!");
                } else if (obj.otyp == BLINDING_VENOM) {
                    pline_The("venom blinds %s%s!", mon_nam(mon), mon.mcansee ? "" : " further");
                } else {
                    let whom = mon_nam(mon);
                    let what = The(xname(obj));
                    if (!hmd.thrown && obj.quan > 1) {
                        what = An(singular(obj, xname));
                    }
                    /* note: s_suffix returns a modifiable buffer */
                    if ((((hmd.mdat).mflags1 & 4096) == 0) && hmd.mdat != game.mons[PM_FLOATING_EYE]) {
                        whom = strcat(strcat(s_suffix(whom), " "), mbodypart(mon, FACE));
                    }
                    pline("%s %s over %s!", what, vtense(what, "splash"), whom);
                }
                setmangry(mon, (1));
                mon.mcansee = 0;
                hmd.dmg = (rn2(25) + (21));
                if ((mon.mblinded + hmd.dmg) > 127) {
                    mon.mblinded = 127;
                } else {
                    mon.mblinded += hmd.dmg;
                }
            } else {
                pline(obj.otyp == CREAM_PIE ? "Splat!" : "Splash!");
                setmangry(mon, (1));
            }
{
                let more_than_1 = (obj.quan > 1);
                if (hmd.thrown) {
                    obfree(obj, null);
                } else {
                    useup(obj);
                }
                if (!more_than_1) {
                    obj = null;
                }
            }
            hmd.hittxt = (1);
            hmd.get_dmg_bonus = (0);
            hmd.dmg = 0;
            break;
        case ACID_VENOM:
            if (Resists_Elem(mon, ACID_RES)) {
                Your("venom hits %s harmlessly.", mon_nam(mon));
                /* vegetables (and similar) do no damage, because they
               aren't rigid enough; paper objects also do no damage,
               except for books */
                hmd.dmg = 0;
            } else {
                Your("venom burns %s!", mon_nam(mon));
                hmd.dmg = dmgval(obj, mon);
            }
{
                let more_than_1 = (obj.quan > 1);
                if (hmd.thrown) {
                    obfree(obj, null);
                } else {
                    useup(obj);
                }
                if (!more_than_1) {
                    obj = null;
                }
            }
            hmd.hittxt = (1);
            hmd.get_dmg_bonus = (0);
            break;
        default:
            if ((game.objects[obj.otyp].oc_material == VEGGY || game.objects[obj.otyp].oc_material == PAPER) && obj.oclass != SPBOOK_CLASS) {
                hmd.dmg = 0;
                hmd.get_dmg_bonus = (0);
                break;
            }
            /* non-weapons can damage because of their weight */
            hmd.dmg = Math.trunc((obj.owt + 99) / 100);
            hmd.dmg = (hmd.dmg <= 1) ? 1 : rnd(hmd.dmg);
            if (hmd.dmg > 6) {
                hmd.dmg = 6;
            }
            if (((obj).otyp == TOWEL && (obj).spe > 0)) {
                /* wet towel has modest damage bonus beyond its weight,
           based on its wetness */
                let doubld = (mon.data == game.mons[PM_IRON_GOLEM]);
                /* wielded wet towel should probably use whip skill
               (but not by setting objects[TOWEL].oc_skill==P_WHIP
               because that would turn towel into a weptool);
               due to low weight, tmp always starts at 1 here, and
               due to wet towel's definition, obj->spe is 1..7 */
                hmd.dmg += obj.spe * (doubld ? 2 : 1);
                /* wet towel damage not capped at 6 */
                hmd.dmg = rnd(hmd.dmg);
                /* usually lose some wetness but defer doing so
               until after hit message */
                hmd.dryit = (rn2(obj.spe + 1) > 0);
            }
            if (hmd.material == SILVER && mon_hates_silver(mon)) {
                /* things like silver wands can arrive here so we
           need another silver check; blessed check too */
                hmd.dmg += rnd(20);
                hmd.silvermsg = hmd.silverobj = (1);
            }
            if (obj.blessed && mon_hates_blessings(mon)) {
                hmd.dmg += rnd(4);
            }
    }
}
/* do the actual hitting monster with obj/fists */
/* obj can be NULL */
export function hmon_hitmon_do_hit(hmd, mon, obj) {
    if (!obj) {
        hmon_hitmon_barehands(hmd, mon);
    } else {
        if ((hmd.thrown == HMON_THROWN || hmd.thrown == HMON_KICKED) && ((game.objects[(obj).otyp].oc_material == GEMSTONE || (game.objects[(obj).otyp].oc_material == MINERAL)) && (obj).oclass != RING_CLASS) && ((((hmd.mdat).mflags1 & 8) != 0) && !(((hmd.mdat).mflags1 & 1048576) != 0))) {
            /* obj is not NULL here because of the !obj check in this if block,
         , so no guard is needed ahead of stone_missile(obj) */
            /* stone missile does not hurt xorn or earth elemental, but doesn't
           pass all the way through and continue on to some further target */
            hit(mshot_xname(obj), mon, " but does no harm.");
            wakeup(mon, (1));
            hmd.doreturn = (1);
            hmd.retval = (1);
            return;
        }
        /* remember obj's name since it might end up being destroyed and
           we'll want to use it after that */
        if (!(artifact_light(obj) && obj.lamplit)) {
            hmd.saved_oname = strcpy(hmd.saved_oname, cxname(obj));
        } else {
            hmd.saved_oname = strcpy(hmd.saved_oname, bare_artifactname(obj));
        }
        if (obj.oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) || obj.oclass == GEM_CLASS) {
            hmon_hitmon_weapon(hmd, mon, obj);
            /* attacking with non-weapons */
            if (hmd.doreturn) {
                return;
            }
        } else if (obj.oclass == POTION_CLASS) {
            hmon_hitmon_potion(hmd, mon, obj);
            if (hmd.doreturn) {
                return;
            }
        } else {
            if (hmd.mdat == game.mons[PM_SHADE] && !shade_aware(obj)) {
                hmd.dmg = 0;
            } else {
                hmon_hitmon_misc_obj(hmd, mon, obj);
            }
        }
    }
}
export function hmon_hitmon_dmg_recalc(hmd, obj) {
    let dmgbonus = 0;
    let strbonus = 0;
    let absbonus = 0;
    if (hmd.get_dmg_bonus) {
        /*
     * Potential bonus (or penalty) from worn ring of increase damage
     * (or intrinsic bonus from eating same) or from strength.  Strength
     * bonus is increased for melee with two-handed weapons and decreased
     * for dual attacks (but when both hit, the total for the two is more
     * than the bonus for a regular single hit).
     */
        /* for dual attacks, udaminc applies to both, and two-handed
           weapons use it as-is */
        dmgbonus = game.u.udaminc;
        if (hmd.thrown != HMON_THROWN || !obj || !game.uwep || !(((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) {
            /* throwing using a propellor gets an increase-damage bonus
           but not a strength one; other attacks get both;
           for dual attacks, 3/4 of the strength bonus is used; when
           both attacks hit, overall bonus is 3/2 rather than doubled;
           melee hit with two-handed weapon uses 3/2 strength bonus to
           approximately match double hit with two-weapon ('approximate'
           because udaminc skews in favor of two-weapon); the 3/2 factor
           for two-handed strength does not apply to polearms unless
           hero is simply bashing with one of those and does not apply
           to jousting because lances are one-handed */
            strbonus = dbon();
            absbonus = abs(strbonus);
            if (hmd.twohits) {
                strbonus = (Math.trunc((3 * absbonus + 2) / 4)) * sgn(strbonus);
            } else if (hmd.thrown == HMON_MELEE && game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
                strbonus = (Math.trunc((3 * absbonus + 1) / 2)) * sgn(strbonus);
            }
            dmgbonus += strbonus;
        }
    }
    if (hmd.use_weapon_skill) {
        /*
     * Potential bonus (or penalty) from weapon skill.
     * 'use_weapon_skill' is True for hand-to-hand ordinary weapon,
     * applied or jousting polearm or lance, thrown missile (dart,
     * shuriken, boomerang), or shot ammo (arrow, bolt, rock/gem when
     * wielding corresponding launcher).
     * It is False for hand-to-hand or thrown non-weapon, hand-to-hand
     * polearm or lance when not mounted, hand-to-hand missile or ammo
     * or launcher, thrown non-missile, or thrown ammo (including rocks)
     * when not wielding corresponding launcher.
     */
        let skillwep = obj;
        if (((obj) && ((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW)) && (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) {
            skillwep = game.uwep;
        }
        dmgbonus += weapon_dam_bonus(skillwep);
        if (hmd.train_weapon_skill) {
            /* hit for more than minimal damage (before being adjusted
           for damage or skill bonus) trains the skill toward future
           enhancement */
            /* [this assumes that `!thrown' implies wielded...] */
            let wtype = hmd.thrown ? weapon_type(skillwep) : uwep_skill_type();
            use_skill(wtype, 1);
        }
    }
    /* apply combined damage+strength and skill bonuses */
    hmd.dmg += dmgbonus;
    /* don't let penalty, if bonus is negative, turn a hit into a miss */
    if (hmd.dmg < 1) {
        hmd.dmg = 1;
    }
}
/* obj is not NULL */
export function hmon_hitmon_poison(hmd, mon, obj) {
    let nopoison = (10 - (Math.trunc(obj.owt / 10)));
    if (nopoison < 2) {
        nopoison = 2;
    }
    if ((game.urole.mnum == (PM_SAMURAI))) {
        You("dishonorably use a poisoned weapon!");
        adjalign(-sgn(game.u.ualign.type));
    } else if (game.u.ualign.type == 1 && game.u.ualign.record > -10) {
        You_feel("like an evil coward for using a poisoned weapon.");
        adjalign(-1);
    }
    if (!permapoisoned(obj) && !rn2(nopoison)) {
        /* remove poison now in case obj ends up in a bones file */
        obj.otrapped = (0);
        /* defer "obj is no longer poisoned" until after hit message */
        hmd.unpoisonmsg = (1);
    }
    if (Resists_Elem(mon, POISON_RES)) {
        hmd.needpoismsg = (1);
    } else if (rn2(10)) {
        hmd.dmg += rnd(6);
    } else {
        hmd.poiskilled = (1);
    }
}
/* target */
/* lance; obj is not NULL */
export function hmon_hitmon_jousting(hmd, mon, obj) {
    hmd.dmg += d(2, (obj == game.uwep) ? 10 : 2);
    You("joust %s%s", mon_nam(mon), canseemon(mon) ? exclam(hmd.dmg) : ".");
    /* if this hit just broke the never-hit-with-wielded-weapon conduct
       (handled by caller...), give a livelog message for that now */
    if (game.u.uconduct.weaphit <= 1) {
        first_weapon_hit(obj);
    }
    if (hmd.jousting < 0) {
        /* (must be either primary or secondary weapon to get here) */
        /* sets u.twoweap = FALSE;
                             * untwoweapon() is too verbose here */
        set_twoweap((0));
        if (obj == game.uwep) {
            uwepgone();
        }
        pline("%s shatters on impact!", Yname2(obj));
        useup(obj);
        obj = null;
    }
    if (mhurtle_to_doom(mon, hmd.dmg, { get value() { return hmd.mdat; }, set value(_v) { hmd.mdat = _v; } })) {
        hmd.already_killed = (1);
    }
    hmd.hittxt = (1);
}
export function hmon_hitmon_stagger(hmd, mon, obj) {
    if (rnd(100) < (game.u.weapon_skills[P_BARE_HANDED_COMBAT].skill) && !((hmd.mdat).msize >= 3) && !(((hmd.mdat).mflags1 & 2097152) != 0)) {
        /* VERY small chance of stunning opponent if unarmed. */
        if ((canseemon(mon) || sensemon(mon))) {
            pline("%s %s from your powerful strike!", Monnam(mon), makeplural(stagger(mon.data, "stagger")));
        }
        if (mhurtle_to_doom(mon, hmd.dmg, { get value() { return hmd.mdat; }, set value(_v) { hmd.mdat = _v; } })) {
            hmd.already_killed = (1);
        }
        hmd.hittxt = (1);
    }
}
export function hmon_hitmon_pet(hmd, mon, obj) {
    if (mon.mtame && hmd.dmg > 0) {
        /* do this even if the pet is being killed or migrating (affects revival) */
        abuse_dog(mon);
        /* flee if still alive and still tame; if already suffering from
           untimed fleeing, no effect, otherwise increases timed fleeing */
        if (mon.mtame && !hmd.destroyed) {
            monflee(mon, 10 * rnd(hmd.dmg), (0), (0));
        }
    }
}
/* obj can be NULL but guards are in place below */
export function hmon_hitmon_splitmon(hmd, mon, obj) {
    if ((hmd.mdat == game.mons[PM_BLACK_PUDDING] || hmd.mdat == game.mons[PM_BROWN_PUDDING]) && mon.mhp > 1 && !mon.mcan && !hmd.offmap && obj && (obj == game.uwep || (game.u.twoweap && obj == game.uswapwep)) && ((hmd.material == IRON || hmd.material == METAL) && !(((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[obj.otyp].oc_subtyp <= -P_DART))) && hmd.hand_to_hand) {
        /* pudding is alive and healthy enough to split */
        /* iron weapon using melee or polearm hit [3.6.1: metal weapon too;
           also allow either or both weapons to cause split when twoweap] */
        /* allow scalpel and tsurugi to split puddings */
        /* but not bashing with darts, arrows or ya */
        let mclone = null;
        let withwhat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        if ((mclone = clone_mon(mon, 0, 0)) != null) {
            withwhat[0] = 0;
            if (game.u.twoweap && game.flags.verbose) {
                withwhat = sprintf(withwhat, " with %s", yname(obj));
            }
            pline("%s divides as you hit it%s!", Monnam(mon), withwhat);
            hmd.hittxt = (1);
            mintrap(mclone, 0);
        }
    }
}
/* obj can be NULL for hand_to_hand; otherwise not */
export function hmon_hitmon_msg_hit(hmd, mon, obj) {
    if (!hmd.hittxt && (!hmd.destroyed || (hmd.thrown && game.m_shot.n > 1 && game.m_shot.o == obj.otyp))) {
        if (hmd.thrown) {
            hit(mshot_xname(obj), mon, exclam(hmd.dmg));
        } else if (!game.flags.verbose) {
            You("hit it.");
        } else {
            You("%s %s%s", (obj && ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_SHIELD) || obj.otyp == HEAVY_IRON_BALL)) ? "bash" : (obj && (game.objects[obj.otyp].oc_subtyp == P_WHIP || ((obj).otyp == TOWEL && (obj).spe > 0))) ? "lash" : (game.urole.mnum == (PM_BARBARIAN)) ? "smite" : "hit", mon_nam(mon), canseemon(mon) ? exclam(hmd.dmg) : ".");
        }
    }
}
export function hmon_hitmon_msg_silver(hmd, mon, obj) {
    let fmt = null;
    let whom = mon_nam(mon);
    let silverobjbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if ((canseemon(mon) || sensemon(mon))) {
        if (hmd.barehand_silver_rings == 1) {
            fmt = "Your silver ring sears %s!";
        } else if (hmd.barehand_silver_rings == 2) {
            fmt = "Your silver rings sear %s!";
        } else if (hmd.silverobj && hmd.saved_oname[0]) {
            nh_snprintf("hmon_hitmon_msg_silver", 1682, silverobjbuf, 256 /* sizeof(char [256]) */, "Your %s%s %s", strstri(hmd.saved_oname, "silver") ? "" : "silver ", hmd.saved_oname, vtense(hmd.saved_oname, "sear"));
            /* guard constructed format string against '%' in
               saved_oname[] from xname(via cxname()) */
            strNsubst(silverobjbuf, "%", "%%", 0);
            silverobjbuf = strncat(silverobjbuf, " %s!", 256 /* sizeof(char [256]) */ - (strlen(silverobjbuf) + 1));
            fmt = silverobjbuf;
        } else {
            fmt = "The silver sears %s!";
        }
    } else {
        whom = (() => { const __s = whom; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
        fmt = "%s is seared!";
    }
    if (!((hmd.mdat).mlet == S_GHOST) && !(((hmd.mdat).mflags1 & 4) != 0)) {
        whom = strcat(s_suffix(whom), " flesh");
    }
    pline(fmt, whom);
}
export function hmon_hitmon_msg_lightobj(hmd, mon, obj) {
    let fmt = null;
    let whom = mon_nam(mon);
    let emitlightobjbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if ((canseemon(mon) || sensemon(mon))) {
        if (hmd.saved_oname[0]) {
            emitlightobjbuf = sprintf(emitlightobjbuf, "%s radiance penetrates deep into", s_suffix(hmd.saved_oname));
            emitlightobjbuf = strcat(emitlightobjbuf, " %s!");
            fmt = emitlightobjbuf;
        } else {
            fmt = "The light sears %s!";
        }
    } else {
        whom = (() => { const __s = whom; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
        fmt = "%s is seared!";
    }
    if (!((hmd.mdat).mlet == S_GHOST) && !(((hmd.mdat).mflags1 & 4) != 0)) {
        whom = strcat(s_suffix(whom), " flesh");
    }
    pline(fmt, whom);
}
/*
 * These will segfault if passed a NULL obj pointer:
 *       hmon_hitmon_weapon_ranged,
 *       hmon_hitmon_weapon_melee,
 *       hmon_hitmon_weapon,
 *       hmon_hitmon_potion,
 *       hmon_hitmon_misc_obj,
 *       hmon_hitmon_poison,
 *       hmon_hitmon_jousting,
 *
 * These are equipped to handle a NULL obj pointer:
 *       hmon_hitmon_stagger,       - obj arg is unused
 *       hmon_hitmon_pet,           - obj arg is unused
 *       hmon_hitmon_msg_silver,    - obj arg is unused
 *       hmon_hitmon_msg_lightobj,  - obj arg is unused
 *       hmon_hitmon_do_hit,        - has obj and !obj code paths
 *       hmon_hitmon_splitmon,      - has !obj guards
 *       hmon_hitmon_msg_hit,       - has !obj guards exc. thrown which is ok
 */
/* guts of hmon(); returns True if 'mon' survives */
/* HMON_xxx (0 => hand-to-hand, other => ranged) */
export function hmon_hitmon(mon, obj, thrown, dieroll) {
    let hmd = { dmg: 0, thrown: 0, twohits: 0, dieroll: 0, mdat: null, use_weapon_skill: 0, train_weapon_skill: 0, barehand_silver_rings: 0, silvermsg: 0, silverobj: 0, lightobj: 0, material: 0, jousting: 0, hittxt: 0, get_dmg_bonus: 0, unarmed: 0, hand_to_hand: 0, ispoisoned: 0, unpoisonmsg: 0, needpoismsg: 0, poiskilled: 0, already_killed: 0, offmap: 0, destroyed: 0, dryit: 0, doreturn: 0, retval: 0, saved_oname: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    let maybe_knockback = (0);
    hmd.dmg = 0;
    hmd.thrown = thrown;
    hmd.twohits = thrown ? 0 : game.twohits;
    hmd.dieroll = dieroll;
    hmd.mdat = mon.data;
    hmd.use_weapon_skill = (0);
    hmd.train_weapon_skill = (0);
    hmd.barehand_silver_rings = 0;
    hmd.silvermsg = (0);
    hmd.silverobj = (0);
    hmd.lightobj = (0);
    hmd.material = obj ? game.objects[obj.otyp].oc_material : NO_MATERIAL;
    hmd.jousting = 0;
    hmd.hittxt = (0);
    hmd.get_dmg_bonus = (1);
    hmd.unarmed = !game.uwep && !game.uarm && !game.uarms;
    hmd.hand_to_hand = (thrown == HMON_MELEE || (thrown == HMON_APPLIED && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && (game.objects[game.uwep.otyp].oc_subtyp == P_POLEARMS || game.objects[game.uwep.otyp].oc_subtyp == P_LANCE || is_art(game.uwep, ART_SNICKERSNEE)))));
    hmd.ispoisoned = (0);
    hmd.unpoisonmsg = (0);
    hmd.needpoismsg = (0);
    hmd.poiskilled = (0);
    hmd.already_killed = (0);
    hmd.offmap = (0);
    hmd.destroyed = (0);
    hmd.dryit = (0);
    hmd.doreturn = (0);
    hmd.retval = (0);
    hmd.saved_oname[0] = 0;
    hmon_hitmon_do_hit(hmd, mon, obj);
    if (hmd.doreturn) {
        return hmd.retval;
    }
    /*
     ***** NOTE: perhaps obj is undefined! (if !thrown && BOOMERANG)
     *      *OR* if attacking bare-handed!
     * Note too: the cases where obj might get destroyed do not
     *      set 'use_weapon_skill', bare-handed does.
     */
    if (hmd.dmg > 0) {
        hmon_hitmon_dmg_recalc(hmd, obj);
    }
    if (hmd.ispoisoned) {
        hmon_hitmon_poison(hmd, mon, obj);
    }
    if (hmd.dmg < 1) {
        /* not grapnels; applied implies uwep */
        let mon_is_shade = (mon.data == game.mons[PM_SHADE]);
        /* make sure that negative damage adjustment can't result
           in inadvertently boosting the victim's hit points */
        hmd.dmg = (hmd.get_dmg_bonus && !mon_is_shade) ? 1 : 0;
        if (mon_is_shade && !hmd.hittxt && thrown != HMON_THROWN && thrown != HMON_KICKED) {
            hmd.hittxt = shade_miss(game.youmonst, mon, obj, (0), (1));
        }
    }
    if (hmd.jousting) {
        /* this gives "harmlessly passes through" feedback even when
               hero doesn't see it happen; presumably sensed by touch? */
        hmon_hitmon_jousting(hmd, mon, obj);
    } else if (hmd.unarmed && hmd.dmg > 1 && !thrown && !obj && !(game.u.umonnum != game.u.umonster)) {
        hmon_hitmon_stagger(hmd, mon, obj);
    } else if (!hmd.unarmed && hmd.dmg > 1 && !thrown && !(game.u.umonnum != game.u.umonster) && !game.u.twoweap && game.uwep) {
        maybe_knockback = (1);
    }
    if (!hmd.already_killed) {
        if (obj && (obj == game.uwep || (obj == game.uswapwep && game.u.twoweap)) && (obj.oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE)) && (thrown == HMON_MELEE || thrown == HMON_APPLIED) && !hmd.jousting && hmd.dmg > 0 && game.u.uconduct.weaphit <= 1) {
            first_weapon_hit(obj);
        }
        mon.mhp -= hmd.dmg;
    }
    /* adjustments might have made tmp become less than what
       a level-draining artifact has already done to max HP */
    if (mon.mhp > mon.mhpmax) {
        mon.mhp = mon.mhpmax;
    }
    if (mon.mx == 0) {
        /* known_hitum 'what counts as a weapon' criteria */
        /* if jousting, the hit was already logged */
        /* note: caller has already incremented u.uconduct.weaphit
               so we test for 1; 0 shouldn't be able to happen here... */
        /*
         * jousting can lead to:
         *     mhurtle_to_doom()
         *      mhurtle()
         *       mintrap()
         *        trapeffect_hole()
         *         trapeffect_level_telep()
         *          migrate_to_level()
         * Set offmap in that situation so code to follow can test for it.*/
        hmd.offmap = (1);
    }
    if (((mon).mhp < 1)) {
        hmd.destroyed = (1);
    }
    hmon_hitmon_pet(hmd, mon, obj);
    hmon_hitmon_splitmon(hmd, mon, obj);
    hmon_hitmon_msg_hit(hmd, mon, obj);
    if (hmd.dryit) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        /* dryit implies wet towel, so 'obj' is still intact */
        dry_a_towel(obj, -1, (1));
    }
    if (hmd.silvermsg) {
        hmon_hitmon_msg_silver(hmd, mon, obj);
    }
    if (hmd.lightobj) {
        hmon_hitmon_msg_lightobj(hmd, mon, obj);
    }
    /* if a "no longer poisoned" message is coming, it will be last;
       obj->opoisoned was cleared above and any message referring to
       "poisoned <obj>" has now been given; we want just "<obj>" for
       last message, so reformat while obj is still accessible */
    if (hmd.unpoisonmsg) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        hmd.saved_oname = strcpy(hmd.saved_oname, cxname(obj));
    }
    /* [note: thrown obj might go away during killed()/xkilled() call
       (via 'thrownobj'; if swallowed, it gets added to engulfer's
       minvent and might merge with a stack that's already there)] */
    /* already_killed and poiskilled won't apply for Trollsbane */
    if (hmd.needpoismsg) {
        pline_The("poison doesn't seem to affect %s.", mon_nam(mon));
    }
    if (hmd.poiskilled) {
        pline_The("poison was deadly...");
        if (!hmd.already_killed) {
            xkilled(mon, 1);
        }
        hmd.destroyed = (1);
    } else if (hmd.destroyed) {
        if (!hmd.already_killed) {
            if (((mon).data.mlet == S_TROLL && (obj) && (obj).oartifact == ART_TROLLSBANE)) {
                game.mkcorpstat_norevive = (1);
            }
            /* takes care of most messages */
            killed(mon);
            game.mkcorpstat_norevive = (0);
        }
    } else if (game.u.umconf && hmd.hand_to_hand) {
        nohandglow(mon);
        if (!mon.mconf && !resist(mon, SPBOOK_CLASS, 0, 0)) {
            mon.mconf = 1;
            if (!mon.mstun && !((mon).msleeping || !(mon).mcanmove) && canseemon(mon)) {
                pline("%s appears confused.", Monnam(mon));
            }
        }
    }
    if (hmd.unpoisonmsg) {
        Your("%s %s no longer poisoned.", hmd.saved_oname, vtense(hmd.saved_oname, "are"));
    }
    if (!hmd.destroyed && !hmd.offmap) {
        let hitflags = 1;
        wakeup(mon, (1));
        if (maybe_knockback && mhitm_knockback(game.youmonst, mon, game.youmonst.data.mattk, { get value() { return hitflags; }, set value(_v) { hitflags = _v; } }, (1))) {
            if ((hitflags & 2) != 0) {
                hmd.destroyed = (1);
            }
        }
    }
    return hmd.destroyed ? (0) : (1);
}
/* joust or martial arts punch is knocking the target back; that might
   kill 'mon' (via trap) before known_hitum() has a chance to do so;
   return True if we kill mon, False otherwise */
/* target monster */
/* amount of pending damage */
/* caller's cached copy of mon->data */
export function mhurtle_to_doom(mon, tmp, mptr) {
    if (tmp < mon.mhp) {
        /* only hurtle if pending physical damage (tmp) isn't going to kill mon */
        mhurtle(mon, game.u.dx, game.u.dy, 1);
        /* update caller's cached mon->data in case mon was pushed into
           a polymorph trap or is a vampshifter whose current form has
           been killed by a trap so that it reverted to original form */
        mptr.value = mon.data;
        if (((mon).mhp < 1)) {
            return (1);
        }
    }
    return (0);
}
/* gamelog version of "you've broken never-hit-with-wielded-weapon conduct;
   the conduct is tracked in known_hitum(); we're called by hmon_hitmon() */
export function first_weapon_hit(weapon) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* avoid xname() since that includes "named <foo>" and we don't want
       player-supplied <foo> in livelog */
    buf[0] = 0;
    /* include "cursed" if known but don't bother with blessed */
    if (weapon.cursed && weapon.bknown) {
        buf = strcat(buf, "cursed ");
    }
    /* normally supplied by doname() */
    if (obj_is_pname(weapon)) {
        buf = strcat(buf, ((weapon).oextra.oname));
    } else {
        buf = strcat(buf, simpleonames(weapon));
        if (weapon.oartifact && weapon.dknown) {
            buf = (buf || '') + sprintf('', " named %s", bare_artifactname(weapon));
        }
    }
    /* when a hit breaks the never-hit-with-wielded-weapon conduct
       (handled by caller) we need to log the message about that before
       monster is possibly killed; otherwise getting log entry sequence
         N : killed for the first time
         N : hit with a wielded weapon for the first time
       reported on the same turn (N) looks "suboptimal" */
    livelog_printf(32, "hit with a wielded weapon (%s) for the first time", buf);
}
export function shade_aware(obj) {
    if (!obj) {
        return (0);
    }
    /*
     * The things in this list either
     * 1) affect shades.
     *  OR
     * 2) are dealt with properly by other routines
     *    when it comes to shades.
     */
    if (obj.otyp == BOULDER || obj.otyp == HEAVY_IRON_BALL || obj.otyp == IRON_CHAIN || obj.otyp == MIRROR || obj.otyp == CLOVE_OF_GARLIC || game.objects[obj.otyp].oc_material == SILVER) {
        return (1);
    }
    return (0);
}
/* used for hero vs monster and monster vs monster; also handles
   monster vs hero but that won't happen because hero can't be a shade */
const __shade_miss_harmlessly_thru = " harmlessly through ";
export function shade_miss(magr, mdef, obj, thrown, verbose) {
    let what = null;
    let whose = null;
    let target = null;
    let youagr = (magr == game.youmonst);
    let youdef = (mdef == game.youmonst);
    /* we're using dmgval() for zero/not-zero, not for actual damage amount */
    if (mdef.data != game.mons[PM_SHADE] || (obj && dmgval(obj, mdef))) {
        return (0);
    }
    if (verbose && ((youdef || ((game.viz_array[mdef.my][mdef.mx] & 2) != 0) || sensemon(mdef)) || (magr == game.youmonst && (dist2(((mdef).mx), ((mdef).my), game.u.ux, game.u.uy) <= 2)))) {
        what = (!obj || shade_aware(obj)) ? "attack" : cxname(obj);
        target = youdef ? "you" : mon_nam(mdef);
        if (!thrown) {
            whose = youagr ? "Your" : s_suffix(Monnam(magr));
            pline("%s %s %s%s%s.", whose, what, vtense(what, "pass"), __shade_miss_harmlessly_thru, target);
        } else {
            pline("%s %s%s%s.", The(what), vtense(what, "pass"), __shade_miss_harmlessly_thru, target);
        }
        if (!youdef && !(canseemon(mdef) || sensemon(mdef))) {
            map_invisible(mdef.mx, mdef.my);
        }
    }
    if (!youdef) {
        mdef.msleeping = 0;
    }
    return (1);
}
/* check whether slippery clothing protects from hug or wrap attack */
/* [currently assumes that you are the attacker] */
export function m_slips_free(mdef, mattk) {
    let obj = null;
    if (mattk.adtyp == 32) {
        /* intelligence drain attacks the head */
        obj = which_armor(mdef, 4);
    } else {
        /* grabbing attacks the body */
        obj = which_armor(mdef, 2);
        if (!obj) {
            obj = which_armor(mdef, 1);
        }
        if (!obj) {
            obj = which_armor(mdef, 64);
        }
    }
    if (obj && (obj.greased || obj.otyp == OILSKIN_CLOAK) && (!obj.cursed || rn2(3))) {
        /* if monster's cloak/armor is greased, your grab slips off; this
       protection might fail (33% chance) when the armor is cursed */
        You("%s %s %s %s!", (mattk.adtyp == 28) ? "slip off of" : "grab, but cannot hold onto", s_suffix(mon_nam(mdef)), obj.greased ? "greased" : "slippery", (obj.greased || game.objects[obj.otyp].oc_name_known) ? xname(obj) : cloak_simple_name(obj));
        if (obj.greased && !rn2(2)) {
            /* avoid "slippery slippery cloak"
               for undiscovered oilskin cloak */
            pline_The("grease wears off.");
            obj.greased = 0;
        }
        return (1);
    }
    return (0);
}
/* used when hitting a monster with a lance while mounted;
   1: joust hit; 0: ordinary hit; -1: joust but break lance */
/* target */
/* weapon */
export function joust(mon, obj) {
    let skill_rating = 0;
    let joust_dieroll = 0;
    if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || game.u.uprops[STUNNED].intrinsic) {
        /* no joust bonus; revert to ordinary attack */
        return 0;
    }
    /* sanity check; lance must be wielded in order to joust */
    if (obj != game.uwep && (obj != game.uswapwep || !game.u.twoweap)) {
        return 0;
    }
    /* can't joust while trapped--not enough room to maneuver;
     * TODO? if the steed is trapped in a pit, perhaps the hero ought to be
     * able to joust against a monster that's in a conjoined pit */
    if (game.u.utrap) {
        return 0;
    }
    /* if using two weapons, use worse of lance and two-weapon skills */
    skill_rating = (game.u.weapon_skills[weapon_type(obj)].skill);
    if (game.u.twoweap && (game.u.weapon_skills[P_TWO_WEAPON_COMBAT].skill) < skill_rating) {
        skill_rating = (game.u.weapon_skills[P_TWO_WEAPON_COMBAT].skill);
    }
    if (skill_rating == P_ISRESTRICTED) {
        skill_rating = P_UNSKILLED;
    }
    if ((joust_dieroll = rn2(5)) < skill_rating) {
        /* odds to joust are expert:80%, skilled:60%, basic:40%, unskilled:20% */
        if (joust_dieroll == 0 && rnl(50) == (50 - 1) && !(((mon.data).mflags1 & 1048576) != 0) && !obj_resists(obj, 0, 100)) {
            return -1;
        }
        /* done_in_by(mtmp, STONING); */
        return 1;
    }
    return 0;
}
/* send in a demon pet for the hero; exercise wisdom */
export function demonpet() {
    let i = 0;
    let pm = null;
    let dtmp = null;
    pline("Some hell-p has arrived!");
    i = !rn2(6) ? ndemon(game.u.ualign.type) : NON_PM;
    pm = i != NON_PM ? game.mons[i] : game.youmonst.data;
    if ((dtmp = makemon(pm, game.u.ux, game.u.uy, 0)) != null) {
        tamedog(dtmp, null, (0));
    }
    exercise(A_WIS, (1));
}
export function theft_petrifies(otmp) {
    if (game.uarmg || otmp.otyp != CORPSE || !((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) || (game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        return (0);
    }
    /* no poly_when_stoned() critter has theft capability */
    /* stealing this corpse is fatal... */
    instapetrify(corpse_xname(otmp, "stolen", 8));
    return (1);
}
/*
 * Player uses theft attack against monster.
 *
 * If the target is wearing body armor, take all of its possessions;
 * otherwise, take one object.  [Is this really the behavior we want?]
 */
export function steal_it(mdef, mattk) {
    let otmp = null;
    let gold = null;
    let ustealo = null;
    let minvent_ptr__parent = null;
    let minvent_ptr__field = null;
    let unwornmask = 0;
    otmp = mdef.minvent;
    if (!otmp || (otmp.oclass == COIN_CLASS && !otmp.nobj)) {
        return;
    }
    /* look for worn body armor */
    ustealo = null;
    if (could_seduce(game.youmonst, mdef, mattk) && mdef.mcanmove) {
        /* find armor, and move it to end of inventory in the process */
        (minvent_ptr__parent = mdef, minvent_ptr__field = "minvent");
        while ((otmp = minvent_ptr__parent[minvent_ptr__field]) != null) {
            if (otmp.owornmask & 1) {
                if (ustealo) {
                    panic("steal_it: multiple worn suits");
                }
                /* take armor out of minvent */
                minvent_ptr__parent[minvent_ptr__field] = otmp.nobj;
                ustealo = otmp;
                ustealo.nobj = null;
            } else {
                (minvent_ptr__parent = otmp, minvent_ptr__field = "nobj");
            }
        }
        /* put armor back into minvent */
        minvent_ptr__parent[minvent_ptr__field] = ustealo;
    }
    gold = findgold(mdef.minvent);
    if (ustealo) {
        /* we will be taking everything */
        let heshe = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        /* 5.0: this uses hero's base gender rather than nymph femininity
           but was using hardcoded pronouns She/her for target monster;
           switch to dynamic pronoun */
        if (gender(mdef) == game.u.mfemale && game.youmonst.data.mlet == S_NYMPH) {
            You("charm %s.  %s gladly hands over %s%s possessions.", mon_nam(mdef), upstart(strcpy(heshe, (genders[pronoun_gender(mdef, 2)].he))), !gold ? "" : "most of ", (genders[pronoun_gender(mdef, 2)].his));
        } else {
            You("seduce %s and %s starts to take off %s clothes.", mon_nam(mdef), (genders[pronoun_gender(mdef, 2)].he), (genders[pronoun_gender(mdef, 2)].his));
        }
    }
    /* prevent gold from being stolen so that steal-item isn't a superset
       of steal-gold; shuffling it out of minvent before selecting next
       item, and then back in case hero or monster dies (hero touching
       stolen c'trice corpse or monster wielding one and having gloves
       stolen) is less bookkeeping than skipping it within the loop or
       taking it out once and then trying to figure out how to put it back */
    if (gold) {
        obj_extract_self(gold);
    }
    while ((otmp = mdef.minvent) != null) {
        /* put 'mdef's gold back after remembering mdef->minvent */
        if (gold) {
            mpickobj(mdef, gold) , gold = null;
        }
        if (!(game.u.umonnum != game.u.umonster)) {
            break;
        }
        /* no longer have ability to steal */
        unwornmask = otmp.owornmask;
        /* this would take place when doname() formats the object for
           the hold_another_object() call, but we want to do it before
           otmp gets removed from mdef's inventory */
        if (otmp.oartifact && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            find_artifact(otmp);
        }
        /* take the object away from the monster */
        extract_from_minvent(mdef, otmp, (1), (0));
        /* special message for final item; no need to check owornmask because
         * ustealo is only set on objects with (owornmask & W_ARM) */
        if (otmp == ustealo) {
            pline("%s finishes taking off %s suit.", Monnam(mdef), (genders[pronoun_gender(mdef, 2)].his));
        }
        /* give the object to the character */
        otmp = hold_another_object(otmp, "You snatched but dropped %s.", doname(otmp), "You steal: ");
        /* might have dropped otmp, and it might have broken or left level */
        if (!otmp || otmp.where != 3) {
            continue;
        }
        if (theft_petrifies(otmp)) {
            break;
        }
        if (unwornmask & 256) {
            /* stop thieving even though hero survived */
            /* more take-away handling, after theft message */
            possibly_unwield(mdef, (0));
        } else if (unwornmask & 16) {
            mselftouch(mdef, null, (1));
            if (((mdef).mhp < 1)) {
                break;
            }
        }
        if (!ustealo) {
            break;
        }
        /* take gold out of minvent before making next selection; if it
           is the only thing left, the loop will terminate and it will be
           put back below */
        if ((gold = findgold(mdef.minvent)) != null) {
            obj_extract_self(gold);
        }
    }
    /* put gold back; won't happen if either hero or 'mdef' dies because
       gold will be back in monster's inventory at either of those times
       (so will be present in mdef's minvent for bones, or in its statue
       now if it has just been turned into one) */
    if (gold) {
        mpickobj(mdef, gold);
    }
}
export function mhitm_ad_rust(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        if (((pd) == game.mons[PM_IRON_GOLEM])) {
            /* note: the life-saved case is hypothetical because
               life-saving doesn't work for golems */
            /* wood golem or leather golem */
            pline("%s %s to pieces!", Monnam(mdef), !mlifesaver(mdef) ? "falls" : "starts to fall");
            xkilled(mdef, 1);
            mhm.hitflags |= 2;
        }
        erode_armor(mdef, 1);
        /* don't inflict a second dose below */
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (magr.mcan) {
            return;
        }
        if (((pd) == game.mons[PM_IRON_GOLEM])) {
            You("rust!");
            /* KMH -- this is okay with unchanging */
            rehumanize();
            return;
        }
        erode_armor(game.youmonst, 1);
    } else {
        if (magr.mcan) {
            return;
        }
        if (((pd) == game.mons[PM_IRON_GOLEM])) {
            /* PM_WOOD_GOLEM || PM_LEATHER_GOLEM */
            if (game.vis && canseemon(mdef)) {
                pline_mon(mdef, "%s %s to pieces!", Monnam(mdef), !mlifesaver(mdef) ? "falls" : "starts to fall");
            }
            monkilled(mdef, null, 24);
            if (!((mdef).mhp < 1)) {
                mhm.hitflags = 0;
                mhm.done = (1);
                return;
            }
            mhm.hitflags = (2 | (grow_up(magr, mdef) ? 0 : 4));
            mhm.done = (1);
            return;
        }
        erode_armor(mdef, 1);
        /* in case player is very fast */
        mdef.mstrategy &= ~536870912;
        mhm.damage = 0;
    }
}
export function mhitm_ad_corr(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        erode_armor(mdef, 3);
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (magr.mcan) {
            return;
        }
        erode_armor(mdef, 3);
    } else {
        if (magr.mcan) {
            return;
        }
        erode_armor(mdef, 3);
        mdef.mstrategy &= ~536870912;
        mhm.damage = 0;
    }
}
export function mhitm_ad_dcay(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        if (((pd) == game.mons[PM_WOOD_GOLEM] || (pd) == game.mons[PM_LEATHER_GOLEM])) {
            pline("%s %s to pieces!", Monnam(mdef), !mlifesaver(mdef) ? "falls" : "starts to fall");
            xkilled(mdef, 1);
        }
        erode_armor(mdef, 2);
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (magr.mcan) {
            return;
        }
        if (((pd) == game.mons[PM_WOOD_GOLEM] || (pd) == game.mons[PM_LEATHER_GOLEM])) {
            You("rot!");
            rehumanize();
            return;
        }
        erode_armor(mdef, 2);
    } else {
        if (magr.mcan) {
            return;
        }
        if (((pd) == game.mons[PM_WOOD_GOLEM] || (pd) == game.mons[PM_LEATHER_GOLEM])) {
            if (game.vis && canseemon(mdef)) {
                pline_mon(mdef, "%s %s to pieces!", Monnam(mdef), !mlifesaver(mdef) ? "falls" : "starts to fall");
            }
            monkilled(mdef, null, 34);
            if (!((mdef).mhp < 1)) {
                mhm.done = (1);
                mhm.hitflags = 0;
                return;
            }
            mhm.done = (1);
            mhm.hitflags = (2 | (grow_up(magr, mdef) ? 0 : 4));
            return;
        }
        erode_armor(mdef, 2);
        mdef.mstrategy &= ~536870912;
        mhm.damage = 0;
    }
}
export function mhitm_ad_dren(magr, mattk, mdef, mhm) {
    let negated = mhitm_mgc_atk_negated(magr, mdef, (0));
    if (magr == game.youmonst) {
        if (!negated && !rn2(4)) {
            xdrainenergym(mdef, (1));
        }
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!negated && !rn2(4)) {
            drain_en(mhm.damage, (0));
        }
        mhm.damage = 0;
    } else {
        if (!negated && !rn2(4)) {
            xdrainenergym(mdef, (game.vis && (canseemon(mdef) || sensemon(mdef)) && mattk.aatyp != 11));
        }
        mhm.damage = 0;
    }
}
export function mhitm_ad_drli(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        if (!rn2(3) && !(resists_drli(mdef) || defended(mdef, 15)) && !mhitm_mgc_atk_negated(magr, mdef, (1))) {
            /* Stormbringer uses monhp_per_lvl
                                    * (usually 1d8) */
            mhm.damage = d(2, 6);
            pline("%s becomes weaker!", Monnam(mdef));
            if (mdef.mhpmax - mhm.damage > mdef.m_lev) {
                mdef.mhpmax -= mhm.damage;
            } else {
                /* limit floor of mhpmax reduction to current m_lev + 1;
                   avoid increasing it if somehow already less than that */
                if (mdef.mhpmax > mdef.m_lev) {
                    mdef.mhpmax = mdef.m_lev + 1;
                }
            }
            mdef.mhp -= mhm.damage;
            if (((mdef).mhp < 1) || !mdef.m_lev) {
                /* !m_lev: level 0 monster is killed regardless of hit points
               rather than drop to level -1; note: some non-living creatures
               (golems, vortices) are subject to life-drain */
                pline("%s %s!", Monnam(mdef), ((((mdef.data).mflags2 & 2) != 0) || (mdef.data) == game.mons[PM_MANES] || (((mdef.data).mlet == S_GOLEM) || (mdef.data).mlet == S_VORTEX)) ? "expires" : "dies");
                xkilled(mdef, 1);
            /* automatic kill if drained past level 0 */
            } else {
                mdef.m_lev--;
            }
            /* damage has already been inflicted */
            /* unlike hitting with Stormbringer, wounded hero doesn't
               heal any from the drained life */
            /* hmonas() uses known_hitum() to deal physical damage,
               then also damageum() for non-AD_PHYS; don't inflict
               extra physical damage for unusual damage types */
            /* [no 'kicking boots' check needed; monsters with kick attacks
               can't wear boots and monsters that wear boots don't kick] */
            mhm.damage = 0;
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!rn2(3) && !(game.u.uprops[DRAIN_RES].intrinsic || game.u.uprops[DRAIN_RES].extrinsic) && !mhitm_mgc_atk_negated(magr, mdef, (1))) {
            /* unlike hitting with Stormbringer, wounded attacker doesn't
               heal any from the drained life */
            losexp("life drainage");
        }
    } else {
        /* mhitm_ad_deth gets redirected here for Death's touch */
        let is_death = (mattk.adtyp == 37);
        if (is_death || (!rn2(3) && !(resists_drli(mdef) || defended(mdef, 15)) && !mhitm_mgc_atk_negated(magr, mdef, (1)))) {
            /* Stormbringer uses monhp_per_lvl (1d8) */
            if (!is_death) {
                mhm.damage = d(2, 6);
            }
            if (game.vis && (canseemon(mdef) || sensemon(mdef))) {
                pline_mon(mdef, "%s becomes weaker!", Monnam(mdef));
            }
            if (mdef.mhpmax - mhm.damage > mdef.m_lev) {
                mdef.mhpmax -= mhm.damage;
            } else {
                if (mdef.mhpmax > mdef.m_lev) {
                    mdef.mhpmax = mdef.m_lev + 1;
                }
            }
            if (mdef.m_lev == 0) {
                mhm.damage = mdef.mhp;
            } else {
                mdef.m_lev--;
            }
        }
    }
}
export function mhitm_ad_fire(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    /* damage coming into the function */
    let orig_dmg = mhm.damage;
    if (magr == game.youmonst) {
        if (mhitm_mgc_atk_negated(magr, mdef, (1))) {
            mhm.damage = 0;
            return;
        }
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s is %s!", Monnam(mdef), on_fire(pd, mattk));
        }
        if (((pd) == game.mons[PM_PAPER_GOLEM] || (pd) == game.mons[PM_STRAW_GOLEM])) {
            /* paper golem or straw golem */
            /* note: the life-saved case is hypothetical because
                   life-saving doesn't work for golems */
            /* => Eyes of the Overworld */
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s %s!", Monnam(mdef), !mlifesaver(mdef) ? "burns completely" : "is totally engulfed in flames");
            } else {
                You("smell burning%s.", (pd == game.mons[PM_PAPER_GOLEM]) ? " paper" : (pd == game.mons[PM_STRAW_GOLEM]) ? " straw" : "");
            }
            xkilled(mdef, 1 | 2);
            mhm.damage = 0;
            return;
        }
        if (Resists_Elem(mdef, FIRE_RES) || defended(mdef, 2)) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline_The("fire doesn't heat %s!", mon_nam(mdef));
            }
            golemeffects(mdef, 2, mhm.damage);
            shieldeff(mdef.mx, mdef.my);
            mhm.damage = 0;
        }
        mhm.damage += destroy_items(mdef, 2, orig_dmg);
        ignite_items(mdef.minvent);
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!mhitm_mgc_atk_negated(magr, mdef, (1))) {
            pline("You're %s!", on_fire(pd, mattk));
            if (((pd) == game.mons[PM_PAPER_GOLEM] || (pd) == game.mons[PM_STRAW_GOLEM])) {
                You("go up in flames!");
                monstunseesu(M_SEEN_FIRE);
                rehumanize();
                return;
            } else if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                pline_The("fire doesn't feel hot!");
                monstseesu(M_SEEN_FIRE);
                mhm.damage = 0;
            } else {
                monstunseesu(M_SEEN_FIRE);
            }
            if (magr.m_lev > rn2(20)) {
                destroy_items(game.youmonst, 2, orig_dmg);
                ignite_items(game.invent);
            }
            burn_away_slime();
        } else {
            mhm.damage = 0;
        }
    } else {
        if (mhitm_mgc_atk_negated(magr, mdef, (1))) {
            mhm.damage = 0;
            return;
        }
        if (game.vis && canseemon(mdef)) {
            pline_mon(mdef, "%s is %s!", Monnam(mdef), on_fire(pd, mattk));
        }
        if (((pd) == game.mons[PM_PAPER_GOLEM] || (pd) == game.mons[PM_STRAW_GOLEM])) {
            if (game.vis && canseemon(mdef)) {
                pline_mon(mdef, "%s %s!", Monnam(mdef), !mlifesaver(mdef) ? "burns completely" : "is totally engulfed in flames");
            }
            monkilled(mdef, null, 2);
            if (!((mdef).mhp < 1)) {
                mhm.hitflags = 0;
                mhm.done = (1);
                return;
            }
            mhm.hitflags = (2 | (grow_up(magr, mdef) ? 0 : 4));
            mhm.done = (1);
            return;
        }
        if (Resists_Elem(mdef, FIRE_RES) || defended(mdef, 2)) {
            if (game.vis && canseemon(mdef)) {
                pline_The("fire doesn't seem to burn %s!", mon_nam(mdef));
            }
            shieldeff(mdef.mx, mdef.my);
            golemeffects(mdef, 2, mhm.damage);
            mhm.damage = 0;
        }
        mhm.damage += destroy_items(mdef, 2, orig_dmg);
        ignite_items(mdef.minvent);
    }
}
export function mhitm_ad_cold(magr, mattk, mdef, mhm) {
    let orig_dmg = mhm.damage;
    if (magr == game.youmonst) {
        if (mhitm_mgc_atk_negated(magr, mdef, (1))) {
            mhm.damage = 0;
            return;
        }
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s is covered in frost!", Monnam(mdef));
        }
        if (Resists_Elem(mdef, COLD_RES) || defended(mdef, 3)) {
            shieldeff(mdef.mx, mdef.my);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline_The("frost doesn't chill %s!", mon_nam(mdef));
            }
            golemeffects(mdef, 3, mhm.damage);
            mhm.damage = 0;
        }
        mhm.damage += destroy_items(mdef, 3, orig_dmg);
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!mhitm_mgc_atk_negated(magr, mdef, (1))) {
            pline("You're covered in frost!");
            if ((game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic)) {
                pline_The("frost doesn't seem cold!");
                monstseesu(M_SEEN_COLD);
                mhm.damage = 0;
            } else {
                monstunseesu(M_SEEN_COLD);
            }
            if (magr.m_lev > rn2(20)) {
                destroy_items(game.youmonst, 3, orig_dmg);
            }
        } else {
            mhm.damage = 0;
        }
    } else {
        if (mhitm_mgc_atk_negated(magr, mdef, (1))) {
            mhm.damage = 0;
            return;
        }
        if (game.vis && canseemon(mdef)) {
            pline_mon(mdef, "%s is covered in frost!", Monnam(mdef));
        }
        if (Resists_Elem(mdef, COLD_RES) || defended(mdef, 3)) {
            if (game.vis && canseemon(mdef)) {
                pline_The("frost doesn't seem to chill %s!", mon_nam(mdef));
            }
            shieldeff(mdef.mx, mdef.my);
            golemeffects(mdef, 3, mhm.damage);
            mhm.damage = 0;
        }
        mhm.damage += destroy_items(mdef, 3, orig_dmg);
    }
}
export function mhitm_ad_elec(magr, mattk, mdef, mhm) {
    let orig_dmg = mhm.damage;
    if (magr == game.youmonst) {
        if (mhitm_mgc_atk_negated(magr, mdef, (1))) {
            mhm.damage = 0;
            return;
        }
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s is zapped!", Monnam(mdef));
        }
        if (Resists_Elem(mdef, SHOCK_RES) || defended(mdef, 6)) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline_The("zap doesn't shock %s!", mon_nam(mdef));
            }
            golemeffects(mdef, 6, mhm.damage);
            shieldeff(mdef.mx, mdef.my);
            mhm.damage = 0;
        }
        mhm.damage += destroy_items(mdef, 6, orig_dmg);
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!mhitm_mgc_atk_negated(magr, mdef, (1))) {
            You("get zapped!");
            if ((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
                pline_The("zap doesn't shock you!");
                monstseesu(M_SEEN_ELEC);
                mhm.damage = 0;
            } else {
                monstunseesu(M_SEEN_ELEC);
            }
            if (magr.m_lev > rn2(20)) {
                destroy_items(game.youmonst, 6, orig_dmg);
            }
        } else {
            mhm.damage = 0;
        }
    } else {
        if (mhitm_mgc_atk_negated(magr, mdef, (1))) {
            mhm.damage = 0;
            return;
        }
        if (game.vis && canseemon(mdef)) {
            pline_mon(mdef, "%s gets zapped!", Monnam(mdef));
        }
        if (Resists_Elem(mdef, SHOCK_RES) || defended(mdef, 6)) {
            if (game.vis && canseemon(mdef)) {
                pline_The("zap doesn't shock %s!", mon_nam(mdef));
            }
            shieldeff(mdef.mx, mdef.my);
            golemeffects(mdef, 6, mhm.damage);
            mhm.damage = 0;
        }
        mhm.damage += destroy_items(mdef, 6, orig_dmg);
    }
}
export function mhitm_ad_acid(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        if (Resists_Elem(mdef, ACID_RES) || defended(mdef, 8)) {
            mhm.damage = 0;
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!magr.mcan && !rn2(3)) {
            if ((game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
                pline("You're covered in %s, but it seems harmless.", hliquid("acid"));
                monstseesu(M_SEEN_ACID);
                mhm.damage = 0;
            } else {
                pline("You're covered in %s!  It burns!", hliquid("acid"));
                exercise(A_STR, (0));
                monstunseesu(M_SEEN_ACID);
            }
        } else {
            mhm.damage = 0;
        }
    } else {
        if (magr.mcan) {
            mhm.damage = 0;
            return;
        }
        if (Resists_Elem(mdef, ACID_RES) || defended(mdef, 8)) {
            if (game.vis && canseemon(mdef)) {
                pline("%s is covered in %s, but it seems harmless.", Monnam(mdef), hliquid("acid"));
            }
            mhm.damage = 0;
        } else if (game.vis && canseemon(mdef)) {
            pline_mon(mdef, "%s is covered in %s!", Monnam(mdef), hliquid("acid"));
            pline("It burns %s!", mon_nam(mdef));
        }
        if (!rn2(30)) {
            erode_armor(mdef, 3);
        }
        if (!rn2(6)) {
            acid_damage(((mdef).mw));
        }
    }
}
/* steal gold */
export function mhitm_ad_sgld(magr, mattk, mdef, mhm) {
    let pa = magr.data;
    let pd = mdef.data;
    if (magr == game.youmonst) {
        let mongold = findgold(mdef.minvent);
        if (mongold) {
            obj_extract_self(mongold);
            if (merge_choice(game.invent, mongold) || inv_cnt((0)) < invlet_basic) {
                addinv(mongold);
                Your("purse feels heavier.");
            } else {
                You("grab %s's gold, but find no room in your knapsack.", mon_nam(mdef));
                dropy(mongold);
            }
        }
        exercise(A_DEX, (1));
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (pd.mlet == pa.mlet) {
            return;
        }
        if (!magr.mcan) {
            stealgold(magr);
        }
    } else {
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        mhm.damage = 0;
        if (magr.mcan) {
            return;
        }
/* technically incorrect; no check for stealing gold from
         * between mdef's feet...
         */
{
            let gold = findgold(mdef.minvent);
            if (!gold) {
                return;
            }
            obj_extract_self(gold);
            add_to_minv(magr, gold);
        }
        mdef.mstrategy &= ~536870912;
        buf = strcpy(buf, Monnam(magr));
        if (game.vis && canseemon(mdef)) {
            pline("%s steals some gold from %s.", buf, mon_nam(mdef));
        }
        if (!tele_restrict(magr)) {
            let couldspot = (canseemon(magr) || sensemon(magr));
            mhm.hitflags = 8;
            rloc(magr, 4);
            /* TODO: use RLOC_MSG instead? */
            if (game.vis && couldspot && !(canseemon(magr) || sensemon(magr))) {
                pline("%s suddenly disappears!", buf);
            }
        }
    }
}
export function mhitm_ad_tlpt(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        if (mhm.damage <= 0) {
            mhm.damage = 1;
        }
        if (mhitm_mgc_atk_negated(magr, mdef, (1))) {
            pline("%s is not affected.", Monnam(mdef));
        } else {
            let nambuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let u_saw_mon = (canseemon(mdef) || (game.u.uswallow && (game.u.ustuck == (mdef))));
            nambuf = strcpy(nambuf, Monnam(mdef));
            /* record the name before losing sight of monster */
            if (u_teleport_mon(mdef, (0)) && u_saw_mon && !(canseemon(mdef) || (game.u.uswallow && (game.u.ustuck == (mdef))))) {
                pline("%s suddenly disappears!", nambuf);
            }
            if (mhm.damage >= mdef.mhp) {
                if (mdef.mhp == 1) {
                    ++mdef.mhp;
                }
                mhm.damage = mdef.mhp - 1;
            }
        }
    } else if (mdef == game.youmonst) {
        let tmphp = 0;
        hitmsg(magr, mattk);
        if (mhitm_mgc_atk_negated(magr, mdef, (0))) {
            You("are not affected.");
        } else {
            if (game.flags.verbose) {
                Your("position suddenly seems %suncertain!", ((game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic) && !game.u.uprops[STUNNED].intrinsic && !unconscious()) ? "" : "very ");
            }
            tele();
            if (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic) ? Math.trunc((mhm.damage - 1) / 2) : mhm.damage) >= (tmphp = ((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp))) {
                /* As of 3.6.2:  make sure damage isn't fatal; previously, it
               was possible to be teleported and then drop dead at
               the destination when QM's 1d4 damage gets applied below;
               even though that wasn't "wrong", it seemed strange,
               particularly if the teleportation had been controlled
               [applying the damage first and not teleporting if fatal
               is another alternative but it has its own complications] */
                mhm.damage = tmphp - 1;
                /* negative armor class doesn't reduce this damage */
                if ((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) {
                    mhm.damage *= 2;
                }
                if (mhm.damage < 1) {
                    /* doesn't actually increase damage;
                                       * we only get here if half the
                                       * original damage would have
                                       * been fatal, so double reduced
                                       * damage will be less than original */
                    mhm.damage = 1;
                    /* this might increase current HP beyond maximum HP but it
                       will be immediately reduced by caller, so that should
                       be indistinguishable from zero damage; we don't drop
                       damage all the way to zero because that inhibits any
                       passive counterattack if poly'd hero has one */
                    /* [don't set context.botl here] */
                    if ((game.u.umonnum != game.u.umonster) && game.u.mh == 1) {
                        ++game.u.mh;
                    } else if (!(game.u.umonnum != game.u.umonster) && game.u.uhp == 1) {
                        ++game.u.uhp;
                    }
                }
            }
        }
    } else {
        if (magr.mcan || mhm.damage >= mdef.mhp || tele_restrict(mdef)) {
            ;
        } else if (mhitm_mgc_atk_negated(magr, mdef, (1))) {
            if (game.vis) {
                pline_mon(mdef, "%s is not affected.", Monnam(mdef));
            }
        } else {
            let mdef_Monnam = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let wasseen = (canseemon(mdef) || sensemon(mdef));
            /* save the name before monster teleports, otherwise
               we'll get "it" in the suddenly disappears message */
            if (game.vis && wasseen) {
                mdef_Monnam = strcpy(mdef_Monnam, Monnam(mdef));
            }
            mdef.mstrategy &= ~536870912;
            rloc(mdef, 4);
            if (game.vis && wasseen && !(canseemon(mdef) || sensemon(mdef)) && mdef != game.u.usteed) {
                pline("%s suddenly disappears!", mdef_Monnam);
            }
            if (mhm.damage >= mdef.mhp) {
                if (mdef.mhp == 1) {
                    ++mdef.mhp;
                }
                mhm.damage = mdef.mhp - 1;
            }
        }
    }
}
/* attacker */
/* magr's attack */
/* defender */
/* optional for monster vs monster */
export function mhitm_ad_blnd(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        if (can_blnd(magr, mdef, mattk.aatyp, null)) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && mdef.mcansee) {
                pline("%s is blinded.", Monnam(mdef));
            }
            mdef.mcansee = 0;
            mhm.damage += mdef.mblinded;
            if (mhm.damage > 127) {
                mhm.damage = 127;
            }
            mdef.mblinded = mhm.damage;
        }
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        if (can_blnd(magr, mdef, mattk.aatyp, null)) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s blinds you!", Monnam(magr));
            }
            make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + mhm.damage, (0));
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                Your("%s", c_common_strings.c_vision_clears);
            }
        }
        mhm.damage = 0;
    } else {
        if (can_blnd(magr, mdef, mattk.aatyp, null)) {
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let rnd_tmp = 0;
            if (game.vis && mdef.mcansee && (canseemon(mdef) || sensemon(mdef))) {
                nh_snprintf("mhitm_ad_blnd", 2996, buf, 256 /* sizeof(char [256]) */, "%s is blinded", Monnam(mdef));
                /* feedback for becoming blinded is given if observed
                   telepathically (canspotmon suffices) but additional
                   info about archon's glow is only given if seen */
                if (mdef.data == game.mons[PM_ARCHON] && canseemon(mdef)) {
                    nh_snprintf("mhitm_ad_blnd", 2999, eos(buf), 256 /* sizeof(char [256]) */ - strlen(buf), " by %s radiance", s_suffix(mon_nam(magr)));
                }
                pline("%s.", buf);
            }
            rnd_tmp = d(mattk.damn, mattk.damd);
            if ((rnd_tmp += mdef.mblinded) > 127) {
                rnd_tmp = 127;
            }
            mdef.mblinded = rnd_tmp;
            mdef.mcansee = 0;
            mdef.mstrategy &= ~536870912;
        }
        if (mhm) {
            mhm.damage = 0;
        }
    }
}
export function mhitm_ad_curs(magr, mattk, mdef, mhm) {
    let pa = magr.data;
    let pd = mdef.data;
    if (magr == game.youmonst) {
        if (night() && !rn2(10) && !mdef.mcan) {
            if (pd == game.mons[PM_CLAY_GOLEM]) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    pline("Some writing vanishes from %s head!", s_suffix(mon_nam(mdef)));
                }
                xkilled(mdef, 1);
            } else {
                /* cancelled regardless of lifesave */
                mdef.mcan = 1;
                You("chuckle.");
            }
        }
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!night() && pa == game.mons[PM_GREMLIN]) {
            return;
        }
        if (!magr.mcan && !rn2(10)) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    You_hear("laughter.");
                } else {
                    pline_mon(magr, "%s chuckles.", Monnam(magr));
                }
            }
            if (game.u.umonnum == PM_CLAY_GOLEM) {
                pline("Some writing vanishes from your head!");
                rehumanize();
                return;
            }
            mon_give_prop(magr, attrcurse());
        }
    } else {
        if (!night() && (pa == game.mons[PM_GREMLIN])) {
            return;
        }
        if (!magr.mcan && !rn2(10)) {
            mdef.mcan = 1;
            mdef.mstrategy &= ~536870912;
            if ((((pd).mflags2 & 4) != 0) && pd.mlet != S_HUMAN) {
                were_change(mdef);
            }
            if (pd == game.mons[PM_CLAY_GOLEM]) {
                if (game.vis && canseemon(mdef)) {
                    pline("Some writing vanishes from %s head!", s_suffix(mon_nam(mdef)));
                    pline_mon(mdef, "%s is destroyed!", Monnam(mdef));
                }
                mondied(mdef);
                if (!((mdef).mhp < 1)) {
                    mhm.hitflags = 0;
                    mhm.done = (1);
                    return;
                } else if (mdef.mtame && !game.vis) {
                    You(brief_feeling, "strangely sad");
                }
                mhm.hitflags = (2 | (grow_up(magr, mdef) ? 0 : 4));
                mhm.done = (1);
                return;
            }
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                if (!game.vis) {
                    You_hear("laughter.");
                } else if (canseemon(magr)) {
                    pline_mon(magr, "%s chuckles.", Monnam(magr));
                }
            }
        }
    }
}
/* Helper for mhitm_ad_drst(), containing some code that is also called from
 * mhitm_ad_phys (for poisoned weapons) and shouldn't be subject to magic
 * cancellation or a 1/8 chance roll.
 * In this specific case, the "mhitm" in the name ACTUALLY means just that -
 * this should be called only for monster versus monster situations. */
export function mhitm_really_poison(magr, mattk, mdef, mhm) {
    if (game.vis && (canseemon(magr) || sensemon(magr))) {
        pline("%s %s was poisoned!", s_suffix(Monnam(magr)), mpoisons_subj(magr, mattk));
    }
    if (Resists_Elem(mdef, POISON_RES)) {
        if (game.vis && (canseemon(mdef) || sensemon(mdef)) && (canseemon(magr) || sensemon(magr))) {
            pline_The("poison doesn't seem to affect %s.", mon_nam(mdef));
        }
    } else {
        mhm.damage += (rn2(10) + (6));
        if (mhm.damage >= mdef.mhp && game.vis && (canseemon(mdef) || sensemon(mdef))) {
            pline_The("poison was deadly...");
        }
    }
}
export function mhitm_ad_drst(magr, mattk, mdef, mhm) {
    let negated = mhitm_mgc_atk_negated(magr, mdef, (0));
    let pa = magr.data;
    if (magr == game.youmonst) {
        if (!negated && !rn2(8)) {
            Your("%s was poisoned!", mpoisons_subj(magr, mattk));
            if (Resists_Elem(mdef, POISON_RES)) {
                pline_The("poison doesn't seem to affect %s.", mon_nam(mdef));
            } else {
                if (!rn2(10)) {
                    Your("poison was deadly...");
                    mhm.damage = mdef.mhp;
                } else {
                    mhm.damage += (rn2(10) + (6));
                }
            }
        }
    } else if (mdef == game.youmonst) {
        let ptmp = A_STR;
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        switch (mattk.adtyp) {
            case 7:
                ptmp = A_STR;
                break;
            case 30:
                ptmp = A_DEX;
                break;
            case 31:
                ptmp = A_CON;
                break;
        }
        hitmsg(magr, mattk);
        if (!negated && !rn2(8)) {
            buf = sprintf(buf, "%s %s", s_suffix(Monnam(magr)), mpoisons_subj(magr, mattk));
            poisoned(buf, ptmp, pmname(pa, Mgender(magr)), 30, (0));
        }
    } else {
        if (!negated && !rn2(8)) {
            mhitm_really_poison(magr, mattk, mdef, mhm);
        }
    }
}
export function mhitm_ad_drin(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    let amu = null;
    let lifsav = 0;
    if (magr == game.youmonst) {
        /*
     * Mind flayers have multiple AD_DRIN attacks (3 for plain mind flayer,
     * 5 for master mind flayer).  If one of those kills the target, skip
     * the others (for rest of attacker's current move).  To check whether
     * hero has been killed, we check mortality counter.  For a monster,
     * we check whether it was wearing an amulet of life-saving before the
     * attack and no longer wearing any amulet after the attack.
     */
        let helmet = null;
        if (game.notonhead || !(((pd).mflags1 & 32768) == 0)) {
            pline("%s doesn't seem harmed.", Monnam(mdef));
            /* hero should skip remaining AT_TENT+AD_DRIN attacks
               because they'll be just as harmless as this one (and also
               to reduce verbosity) */
            /* attacker should skip remaining AT_TENT+AD_DRIN attacks */
            /* don't bother with additional DRIN attacks since they wouldn't
               be able to hit target on head either */
            /* affects mattackm()'s attack loop */
            game.skipdrin = (1);
            mhm.damage = 0;
            if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && pd == game.mons[PM_GREEN_SLIME]) {
                if (!game.u.uprops[SLIMED].intrinsic) {
                    You("suck in some slime and don't feel very well.");
                    make_slimed(10, null);
                }
            }
            return;
        }
        if (m_slips_free(mdef, mattk)) {
            return;
        }
        if ((helmet = which_armor(mdef, 4)) != null && rn2(8)) {
            pline("%s %s blocks your attack to %s head.", s_suffix(Monnam(mdef)), helm_simple_name(helmet), (genders[pronoun_gender(mdef, 2)].his));
            return;
        }
        amu = which_armor(mdef, 65536);
        lifsav = amu && amu.otyp == AMULET_OF_LIFE_SAVING;
        eat_brains(game.youmonst, mdef, (1), { get value() { return mhm.damage; }, set value(_v) { mhm.damage = _v; } });
        /* skip further AD_DRIN if amulet of life-saving got used up */
        if (lifsav && !which_armor(mdef, 65536)) {
            game.skipdrin = (1);
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (defends(32, game.uwep) || !(((pd).mflags1 & 32768) == 0)) {
            You("don't seem harmed.");
            game.skipdrin = (1);
            return;
        }
        if (u_slip_free(magr, mattk)) {
            return;
        }
        if (game.uarmh && rn2(8)) {
            Your("%s blocks the attack to your head.", helm_simple_name(game.uarmh));
            return;
        }
        if ((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) {
            mhm.damage = Math.trunc((mhm.damage + 1) / 2);
        }
        mdamageu(magr, mhm.damage);
        mhm.damage = 0;
        if (!game.uarmh || game.uarmh.otyp != DUNCE_CAP) {
            let oldmort = game.u.umortality;
            let mhitu = eat_brains(magr, mdef, (1), null);
            /* skip further AD_DRIN if hero's number of deaths went up */
            if (game.u.umortality > oldmort) {
                game.skipdrin = (1);
            }
            /* eat_brains() will miss if target is mindless (won't
               happen here--hero is considered to retain his mind
               regardless of current shape) or is noncorporeal
               (can't happen here--no one can poly into a ghost
               or shade) so this check for missing is academic */
            if (mhitu == 0) {
                return;
            }
        }
        /* adjattrib gives dunce cap message when appropriate */
        adjattrib(A_INT, -rnd(2), (0));
        if (!rn2(5)) {
            losespells();
            game.skipdrin = (1);
        }
        if (!rn2(5)) {
            drain_weapon_skill(rnd(2));
            game.skipdrin = (1);
        }
    } else {
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        if (game.notonhead || !(((pd).mflags1 & 32768) == 0)) {
            if (game.vis && (canseemon(mdef) || sensemon(mdef))) {
                pline_mon(mdef, "%s doesn't seem harmed.", Monnam(mdef));
            }
            mhm.damage = 0;
            game.skipdrin = (1);
            return;
        }
        if ((mdef.misc_worn_check & 4) && rn2(8)) {
            if (game.vis && (canseemon(magr) || sensemon(magr)) && canseemon(mdef)) {
                buf = strcpy(buf, s_suffix(Monnam(mdef)));
                pline("%s helmet blocks %s attack to %s head.", buf, s_suffix(mon_nam(magr)), (genders[pronoun_gender(mdef, 2)].his));
            }
            return;
        }
        amu = which_armor(mdef, 65536);
        lifsav = amu && amu.otyp == AMULET_OF_LIFE_SAVING;
        mhm.hitflags = eat_brains(magr, mdef, game.vis, { get value() { return mhm.damage; }, set value(_v) { mhm.damage = _v; } });
        if (lifsav && !which_armor(mdef, 65536)) {
            game.skipdrin = (1);
        }
    }
}
export function mhitm_ad_stck(magr, mattk, mdef, mhm) {
    let negated = mhitm_mgc_atk_negated(magr, mdef, (0));
    let pd = mdef.data;
    let barbs = (magr.data == game.mons[PM_BARBED_DEVIL]);
    if (magr == game.youmonst) {
        if (!negated && !sticks(pd) && (dist2(((mdef).mx), ((mdef).my), game.u.ux, game.u.uy) <= 2)) {
            set_ustuck(mdef);
            if (barbs) {
                Your("barbs stick to %s!", y_monnam(mdef));
            }
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!negated && !game.u.ustuck && !sticks(pd)) {
            set_ustuck(magr);
            if (barbs) {
                pline("The barbs stick to you!");
            }
        }
    } else {
        if (negated) {
            mhm.damage = 0;
        }
    }
}
export function mhitm_ad_wrap(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    let pa = magr.data;
    let coil = (((pa).mflags1 & 524288) != 0) && (pa.mlet == S_SNAKE || pa.mlet == S_NAGA);
    if (magr == game.youmonst) {
        if (!sticks(pd)) {
            let tailmiss = !game.notonhead;
            if (!game.u.ustuck && !tailmiss && !rn2(10)) {
                if (m_slips_free(mdef, mattk)) {
                    /* don't inflict more damage below */
                    mhm.damage = 0;
                } else {
                    You("%s yourself around %s!", coil ? "coil" : "swing", mon_nam(mdef));
                    set_ustuck(mdef);
                }
            } else if (game.u.ustuck == mdef && !tailmiss) {
                if (is_pool(game.u.ux, game.u.uy) && !((((pd).mflags1 & 2) != 0) || (((pd).mflags1 & 512) != 0) || (((pd).mflags1 & 1024) != 0))) {
                    /* Monsters don't wear amulets of magical breathing */
                    You("drown %s...", mon_nam(mdef));
                    mhm.damage = mdef.mhp;
                } else if (mattk.aatyp == 7) {
                    pline("%s is being crushed.", Monnam(mdef));
                }
            } else {
                mhm.damage = 0;
                if (game.flags.verbose) {
                    if (coil && !tailmiss) {
                        You("brush against %s.", mon_nam(mdef));
                    } else {
                        You("brush against %s %s.", s_suffix(mon_nam(mdef)), tailmiss ? "tail" : mbodypart(mdef, LEG));
                    }
                }
            }
        } else {
            mhm.damage = 0;
        }
    } else if (mdef == game.youmonst) {
        if ((!magr.mcan || game.u.ustuck == magr) && !sticks(pd)) {
            if (!game.u.ustuck && !rn2(10)) {
                if (u_slip_free(magr, mattk)) {
                    mhm.damage = 0;
                } else {
                    /* before message, for botl update */
                    set_ustuck(magr);
                    urgent_pline("%s %s itself around you!", Some_Monnam(magr), coil ? "coils" : "swings");
                }
            } else if (game.u.ustuck == magr) {
                if (is_pool(magr.mx, magr.my) && !(game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) && !(game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0)) && !(game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))) {
                    let moat = (game.level.locations[magr.mx][magr.my].typ != POOL) && !is_waterwall(magr.mx, magr.my) && !(((((game.dungeon_topology.d_medusa_level)).dlevel || ((game.dungeon_topology.d_medusa_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_medusa_level)))) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))));
                    urgent_pline("%s drowns you...", Monnam(magr));
                    game.killer.format = 0;
                    game.killer.name = sprintf(game.killer.name, "%s by %s", moat ? "moat" : "pool of water", an(pmname(magr.data, Mgender(magr))));
                    done(DROWNING);
                } else if (mattk.aatyp == 7) {
                    You("are being crushed.");
                }
            } else {
                mhm.damage = 0;
                if (game.flags.verbose) {
                    if (coil) {
                        pline_mon(magr, "%s brushes against you.", Monnam(magr));
                    } else {
                        pline_mon(magr, "%s brushes against your %s.", Monnam(magr), body_part(LEG));
                    }
                }
            }
        } else {
            mhm.damage = 0;
        }
    } else {
        if (magr.mcan) {
            mhm.damage = 0;
        }
        if (!mhm.damage && (canseemon(magr) || canseemon(mdef))) {
            pline("%s brushes against %s.", Some_Monnam(magr), some_mon_nam(mdef));
        }
    }
}
export function mhitm_ad_plys(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        if (!rn2(3) && mhm.damage < mdef.mhp && !mhitm_mgc_atk_negated(magr, mdef, (1))) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s is frozen by you!", Monnam(mdef));
            }
            paralyze_monst(mdef, rnd(10));
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (game.multi >= 0 && !rn2(3) && !mhitm_mgc_atk_negated(magr, mdef, (1))) {
            if (game.u.uprops[FREE_ACTION].extrinsic) {
                You("momentarily stiffen.");
            } else {
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    You("are frozen!");
                } else {
                    You("are frozen by %s!", mon_nam(magr));
                }
                game.nomovemsg = c_common_strings.c_You_can_move_again;
                nomul(-rnd(10));
                /* set gm.multi_reason;
                   3.6.x used "paralyzed by a monster"; be more specific */
                dynamic_multi_reason(magr, "paralyzed", (0));
                exercise(A_DEX, (0));
            }
        }
    } else {
        if (mdef.mcanmove && !rn2(3) && !mhitm_mgc_atk_negated(magr, mdef, (1))) {
            if (game.vis && (canseemon(mdef) || sensemon(mdef))) {
                let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                buf = strcpy(buf, Monnam(mdef));
                pline("%s is frozen by %s.", buf, mon_nam(magr));
            }
            paralyze_monst(mdef, rnd(10));
        }
    }
}
export function mhitm_ad_slee(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        if (!mdef.msleeping && !mhitm_mgc_atk_negated(magr, mdef, (0)) && sleep_monst(mdef, rnd(10), -1)) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s is put to sleep by you!", Monnam(mdef));
            }
            slept_monst(mdef);
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (game.multi >= 0 && !rn2(5) && !mhitm_mgc_atk_negated(magr, mdef, (1))) {
            if ((game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                monstseesu(M_SEEN_SLEEP);
                return;
            }
            monstunseesu(M_SEEN_SLEEP);
            fall_asleep(-rnd(10), (1));
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                You("are put to sleep!");
            } else {
                You("are put to sleep by %s!", mon_nam(magr));
            }
        }
    } else {
        if (!mdef.msleeping && sleep_monst(mdef, rnd(10), -1) && sleep_monst(mdef, rnd(10), -1)) {
            if (game.vis && (canseemon(mdef) || sensemon(mdef))) {
                let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                buf = strcpy(buf, Monnam(mdef));
                pline("%s is put to sleep by %s.", buf, mon_nam(magr));
            }
            mdef.mstrategy &= ~536870912;
            slept_monst(mdef);
        }
    }
}
/* slime */
export function mhitm_ad_slim(magr, mattk, mdef, mhm) {
    let negated = mhitm_mgc_atk_negated(magr, mdef, (0));
    let pd = mdef.data;
    if (magr == game.youmonst) {
        if (negated) {
            return;
        }
        if (!rn2(4) && !((pd) == game.mons[PM_GREEN_SLIME] || ((pd) == game.mons[PM_FIRE_VORTEX] || (pd) == game.mons[PM_FLAMING_SPHERE] || (pd) == game.mons[PM_FIRE_ELEMENTAL] || (pd) == game.mons[PM_SALAMANDER]) || ((pd).mlet == S_GHOST))) {
            if (!munslime(mdef, (1)) && !((mdef).mhp < 1)) {
                /* this assumes newcham() won't fail; since hero has
                   a slime attack, green slimes haven't been geno'd */
                You("turn %s into slime.", mon_nam(mdef));
                if (newcham(mdef, game.mons[PM_GREEN_SLIME], 0)) {
                    pd = mdef.data;
                }
            }
            if (((mdef).mhp < 1)) {
                /* munslime attempt could have been fatal */
                mhm.hitflags = 2;
                mhm.done = (1);
                return;
            }
            mhm.damage = 0;
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (negated) {
            if (!magr.mcan) {
                You("escape harm.");
            }
            return;
        }
        if (((pd) == game.mons[PM_FIRE_VORTEX] || (pd) == game.mons[PM_FLAMING_SPHERE] || (pd) == game.mons[PM_FIRE_ELEMENTAL] || (pd) == game.mons[PM_SALAMANDER])) {
            pline_The("slime burns away!");
            mhm.damage = 0;
        } else if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) || ((pd).mlet == S_GHOST) || pd == game.mons[PM_GREEN_SLIME]) {
            You("are unaffected.");
            mhm.damage = 0;
        } else if (!game.u.uprops[SLIMED].intrinsic) {
            You("don't feel very well.");
            make_slimed(10, null);
            delayed_killer(SLIMED, 0, pmname(magr.data, Mgender(magr)));
        } else {
            pline("Yuck!");
        }
    } else {
        if (negated) {
            return;
        }
        if (!rn2(4) && !((pd) == game.mons[PM_GREEN_SLIME] || ((pd) == game.mons[PM_FIRE_VORTEX] || (pd) == game.mons[PM_FLAMING_SPHERE] || (pd) == game.mons[PM_FIRE_ELEMENTAL] || (pd) == game.mons[PM_SALAMANDER]) || ((pd).mlet == S_GHOST))) {
            if (!munslime(mdef, (0)) && !((mdef).mhp < 1)) {
                let ncflags = 0;
                if (game.vis && canseemon(mdef)) {
                    ncflags |= 1;
                }
                if (newcham(mdef, game.mons[PM_GREEN_SLIME], ncflags)) {
                    pd = mdef.data;
                }
                mdef.mstrategy &= ~536870912;
                mhm.hitflags = 1;
            }
            /* munslime attempt could have been fatal,
               potentially to multiple monsters (SCR_FIRE) */
            if (((magr).mhp < 1)) {
                mhm.hitflags |= 4;
            }
            if (((mdef).mhp < 1)) {
                mhm.hitflags |= 2;
            }
            mhm.damage = 0;
        }
    }
    ((pd));
}
export function mhitm_ad_ench(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {} else if (mdef == game.youmonst) {
        let negated = mhitm_mgc_atk_negated(magr, mdef, (0));
        hitmsg(magr, mattk);
        if (!negated) {
            /* uncancelled is sufficient enough; please
           don't make this attack less frequent */
            let obj = some_armor(mdef);
            if (!obj) {
                switch (rn2(5)) {
                    /* some rings are susceptible;
                   amulets and blindfolds aren't (at present) */
                    case 0:
                        break;
                    case 1:
                        obj = game.uright;
                        break;
                    case 2:
                        obj = game.uleft;
                        break;
                    case 3:
                        obj = game.uamul;
                        break;
                    case 4:
                        obj = game.ublindf;
                        break;
                }
            }
            if (obj && drain_item(obj, (0))) {
                pline("%s less effective.", Yobjnam2(obj, "seem"));
            }
        }
    } else { /* there's no msomearmor() function, so just do damage */ }
}
export function mhitm_ad_slow(magr, mattk, mdef, mhm) {
    let negated = mhitm_mgc_atk_negated(magr, mdef, (0));
    if (defended(mdef, 13)) {
        return;
    }
    if (magr == game.youmonst) {
        if (!negated && mdef.mspeed != 1) {
            let oldspeed = mdef.mspeed;
            mon_adjust_speed(mdef, -1, null);
            if (mdef.mspeed != oldspeed && canseemon(mdef)) {
                pline("%s slows down.", Monnam(mdef));
            }
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!negated && game.u.uprops[FAST].intrinsic && !rn2(4)) {
            u_slow_down();
        }
    } else {
        if (!negated && mdef.mspeed != 1) {
            let oldspeed = mdef.mspeed;
            mon_adjust_speed(mdef, -1, null);
            mdef.mstrategy &= ~536870912;
            if (mdef.mspeed != oldspeed && game.vis && (canseemon(mdef) || sensemon(mdef))) {
                pline_mon(mdef, "%s slows down.", Monnam(mdef));
            }
        }
    }
}
export function mhitm_ad_conf(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        if (!mdef.mconf) {
            if (canseemon(mdef)) {
                pline("%s looks confused.", Monnam(mdef));
            }
            mdef.mconf = 1;
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!magr.mcan && !rn2(4) && !magr.mspec_used) {
            magr.mspec_used = magr.mspec_used + (mhm.damage + rn2(6));
            if (game.u.uprops[CONFUSION].intrinsic) {
                You("are getting even more confused.");
            } else {
                You("are getting confused.");
            }
            make_confused(game.u.uprops[CONFUSION].intrinsic + mhm.damage, (0));
        }
        mhm.damage = 0;
    } else {
        if (!magr.mcan && !mdef.mconf && !magr.mspec_used) {
            /* Since confusing another monster doesn't have a real time
         * limit, setting spec_used would not really be right (though
         * we still should check for it).
         */
            if (game.vis && canseemon(mdef)) {
                pline_mon(mdef, "%s looks confused.", Monnam(mdef));
            }
            mdef.mconf = 1;
            mdef.mstrategy &= ~536870912;
        }
    }
}
export function mhitm_ad_poly(magr, mattk, mdef, mhm) {
    let negated = (mhitm_mgc_atk_negated(magr, mdef, (0)) || magr.mspec_used);
    if (magr == game.youmonst) {
        if (!game.uwep && mhm.damage < mdef.mhp) {
            if (negated) {
                /* require weaponless attack in order to honor AD_POLY */
                /* assume that you can tell by touch if blinded */
                pline("%s is not transformed.", Monnam(mdef));
            } else {
                mhm.damage = mon_poly(game.youmonst, mdef, mhm.damage);
                if (((mdef).mhp < 1)) {
                    mhm.hitflags |= 2;
                }
                mhm.hitflags |= 1;
                mhm.done = (1);
            }
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if ((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((mhm.damage) + 1) / 2)) : (mhm.damage)) < ((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp)) {
            if (negated) {
                if (magr.mcan) {
                    You("aren't transformed.");
                }
            } else {
                mhm.damage = mon_poly(magr, game.youmonst, mhm.damage);
                mhm.hitflags |= 1;
                mhm.done = (1);
            }
        }
    } else {
        if (mhm.damage < mdef.mhp && !negated) {
            mhm.damage = mon_poly(magr, mdef, mhm.damage);
            if (((mdef).mhp < 1)) {
                mhm.hitflags |= 2;
            }
            mhm.hitflags |= 1;
            mhm.done = (1);
        }
    }
}
export function mhitm_ad_famn(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        /* mhitm; it's possible for Famine to hit another monster;
           if target is something that doesn't eat, it won't be harmed;
           otherwise, just inflict the normal damage */
        if (!((((pd).mflags1 & 536870912) != 0) || (((pd).mflags1 & 1073741824) != 0) || (((pd).mflags1 & 2147483648) != 0))) {
            mhm.damage = 0;
        }
        return;
    } else if (mdef == game.youmonst) {
        pline_mon(magr, "%s reaches out, and your body shrivels.", Monnam(magr));
        exercise(A_CON, (0));
        if (!is_fainted()) {
            morehungry((rn2(40) + (40)));
        }
    } else {
        mhitm_famn: {
        }
        if (!((((pd).mflags1 & 536870912) != 0) || (((pd).mflags1 & 1073741824) != 0) || (((pd).mflags1 & 2147483648) != 0))) {
            mhm.damage = 0;
        }
    }
}
export function mhitm_ad_pest(magr, mattk, mdef, mhm) {
    let alt_attk = { aatyp: 0, adtyp: 0, damn: 0, damd: 0 };
    let pa = magr.data;
    if (magr == game.youmonst) {
        Object.assign(alt_attk, mattk);
        /* mhitm; it's possible for Pestilence to hit another monster;
           treat it the same as an attack for AD_DISE damage */
        alt_attk.adtyp = 33;
        mhitm_ad_dise(magr, alt_attk, mdef, mhm);
        return;
    } else if (mdef == game.youmonst) {
        pline_mon(magr, "%s reaches out, and you feel fever and chills.", Monnam(magr));
        diseasemu(pa);
    } else {
        mhitm_pest: {
        }
        Object.assign(alt_attk, mattk);
        alt_attk.adtyp = 33;
        mhitm_ad_dise(magr, alt_attk, mdef, mhm);
    }
}
export function mhitm_ad_deth(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        /* mhitm; it's possible for Death to hit another monster;
           if target is undead, it will take some damage but less than an
           undead hero would; otherwise, just inflict the normal damage */
        if ((((pd).mflags2 & 2) != 0) && mhm.damage > 1) {
            mhm.damage = rnd(Math.trunc(mhm.damage / 2));
        }
        /* simulate Death's touch with drain life attack */
        mhitm_ad_drli(magr, mattk, mdef, mhm);
        return;
    } else if (mdef == game.youmonst) {
        pline_mon(magr, "%s reaches out with its deadly touch.", Monnam(magr));
        if ((((pd).mflags2 & 2) != 0)) {
            mhm.damage = Math.trunc((mhm.damage + 1) / 2);
            pline("Was that the touch of death?");
            return;
        }
        switch (rn2(20)) {
            case 19:
            case 18:
            case 17:
                if (!(game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                    touch_of_death(magr);
                    mhm.damage = 0;
                    return;
                }
                ;
            default:
                You_feel("your life force draining away...");
                /* actual damage done by caller */
                mhm.permdmg = 1;
                return;
            case 4:
            case 3:
            case 2:
            case 1:
            case 0:
                if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                    /* wrath of gods for attacking Oracle */
                    shieldeff(game.u.ux, game.u.uy);
                }
                pline("Lucky for you, it didn't work!");
                mhm.damage = 0;
                return;
        }
    } else {
        mhitm_deth: {
        }
        if ((((pd).mflags2 & 2) != 0) && mhm.damage > 1) {
            mhm.damage = rnd(Math.trunc(mhm.damage / 2));
        }
        mhitm_ad_drli(magr, mattk, mdef, mhm);
    }
}
export function mhitm_ad_halu(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        mhm.damage = 0;
    } else {
        if (!magr.mcan && (((pd).mflags1 & 4096) == 0) && mdef.mcansee) {
            if (game.vis && canseemon(mdef)) {
                pline_mon(mdef, "%s looks %sconfused.", Monnam(mdef), mdef.mconf ? "more " : "");
            }
            mdef.mconf = 1;
            mdef.mstrategy &= ~536870912;
        }
        mhm.damage = 0;
    }
}
export function do_stone_u(mtmp) {
    if (!game.u.uprops[STONED].intrinsic && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM))) {
        let kformat = 0;
        let kname = pmname(mtmp.data, Mgender(mtmp));
        if (mtmp.data.geno & 4096) {
            if (!(((mtmp.data).mflags2 & 524288) != 0)) {
                kname = the(kname);
            }
            kformat = 1;
        }
        make_stoned(5, null, kformat, kname);
        return 1;
    }
    return 0;
}
export function do_stone_mon(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (munstone(mdef, (0))) {
        if (!((mdef).mhp < 1)) {
            mhm.hitflags = 0;
            mhm.done = (1);
            return;
        } else if (mdef.mtame && !game.vis) {
            You(brief_feeling, "peculiarly sad");
        }
        mhm.hitflags = (2 | (grow_up(magr, mdef) ? 0 : 4));
        mhm.done = (1);
        return;
    }
    if (poly_when_stoned(pd)) {
        mon_to_stone(mdef);
        mhm.damage = 0;
        return;
    }
    if (!Resists_Elem(mdef, STONE_RES)) {
        post_stone: {
            if (game.vis && canseemon(mdef)) {
                pline_mon(mdef, "%s turns to stone!", Monnam(mdef));
            }
            monstone(mdef);
        }
        if (!((mdef).mhp < 1)) {
            mhm.hitflags = 0;
            mhm.done = (1);
            return;
        } else if (mdef.mtame && !game.vis) {
            You(brief_feeling, "peculiarly sad");
        }
        mhm.hitflags = (2 | (grow_up(magr, mdef) ? 0 : 4));
        mhm.done = (1);
        return;
    }
    mhm.damage = (mattk.adtyp == 18 ? 0 : 1);
}
export function mhitm_ad_phys(magr, mattk, mdef, mhm) {
    let pa = magr.data;
    let pd = mdef.data;
    if (magr == game.youmonst) {
        if (pd == game.mons[PM_SHADE]) {
            mhm.damage = 0;
            if (!mhm.specialdmg) {
                impossible("bad shade attack function flow?");
            }
        }
        mhm.damage += mhm.specialdmg;
        if (mattk.aatyp == 254) {
            mhm.damage = 0;
        } else if (mattk.aatyp == 3 || mattk.aatyp == 1 || mattk.aatyp == 5 || mattk.aatyp == 7) {
            if ((((pd).mflags1 & 2097152) != 0)) {
                mhm.damage = (mattk.aatyp == 3) ? 0 : Math.trunc((mhm.damage + 1) / 2);
            }
            if (game.u.udaminc > 0) {
                /* add ring(s) of increase damage */
                /* applies even if damage was 0 */
                /* ring(s) might be negative; avoid converting
                   0 to non-0 or positive to non-positive */
                mhm.damage += game.u.udaminc;
            } else if (mhm.damage > 0) {
                mhm.damage += game.u.udaminc;
                if (mhm.damage < 1) {
                    mhm.damage = 1;
                }
            }
        }
    } else if (mdef == game.youmonst) {
        if (mattk.aatyp == 7 && !sticks(pd)) {
            if (!game.u.ustuck && rn2(2)) {
                if (u_slip_free(magr, mattk)) {
                    mhm.damage = 0;
                    mhm.hitflags |= 0;
                } else {
                    set_ustuck(magr);
                    pline_mon(magr, "%s grabs you!", Monnam(magr));
                    mhm.hitflags |= 1;
                }
            } else if (game.u.ustuck == magr) {
                exercise(A_STR, (0));
                You("are being %s.", (pa == game.mons[PM_ROPE_GOLEM]) ? "choked" : "crushed");
            }
        } else {
            let otmp = ((magr).mw);
            if (mattk.aatyp == 254 && otmp) {
                /* non-Null 'mwep' implies AT_WEAP || AT_CLAW */
                let marmg = null;
                let tmp = 0;
                let was_poisoned = (otmp.otrapped || permapoisoned(otmp));
                if (otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE])) {
                    mhm.damage = 1;
                    pline_mon(magr, "%s hits you with the %s corpse.", Monnam(magr), game.mons[otmp.corpsenm].pmnames[NEUTRAL]);
                    if (!game.u.uprops[STONED].intrinsic) {
                        if (do_stone_u(magr)) {
                            /*
                 * 5.0:  New moon is no longer overridden by carrying a
                 * lizard corpse.  Having the moon's impact on terrestrial
                 * activity be affected by carrying a dead critter felt
                 * silly.
                 *
                 * That behavior dated to when there were no corpse objects
                 * yet; "dead lizard" was a distinct item.  With a lizard
                 * corpse, hero can eat it to survive petrification and
                 * probably retain a partly eaten corpse for future use.
                 *
                 * Maintaining foodless conduct during a new moon might
                 * become a little harder.  Clearing out cockatrice nests
                 * during a new moon could become quite a bit harder.
                 */
                            mhm.hitflags = 1;
                            mhm.done = 1;
                            return;
                        }
                    }
                }
                mhm.damage += dmgval(otmp, mdef);
                if ((marmg = which_armor(magr, 16)) != null && marmg.otyp == GAUNTLETS_OF_POWER) {
                    mhm.damage += (rn2(4) + (3));
                }
                if (mhm.damage <= 0) {
                    mhm.damage = 1;
                }
                if (!otmp.oartifact || !artifact_hit(magr, mdef, otmp, { get value() { return mhm.damage; }, set value(_v) { mhm.damage = _v; } }, game.mhitu_dieroll)) {
                    /* similar to mhitm_really_poison, but we don't use the
                     * exact same values, nor do we want same 1/8 chance of
                     * poison taking (use 1/4, same as in the mhitm case). */
                    /* a cancelled nurse is just an ordinary monster,
         * nurses don't heal those that cause petrification */
                    hitmsg(magr, mattk);
                    mhm.hitflags |= 1;
                }
                if (!mhm.damage) {
                    return;
                }
                if (game.objects[otmp.otyp].oc_material == SILVER && (game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data))) {
                    pline_The("silver sears your flesh!");
                    exercise(A_CON, (0));
                }
                /* this redundancy necessary because you have
                   to take the damage _before_ being cloned;
                   need to have at least 2 hp left to split */
                tmp = mhm.damage;
                if (game.u.uac < 0) {
                    tmp -= rnd(-game.u.uac);
                }
                if (tmp < 1) {
                    tmp = 1;
                }
                if ((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) {
                    tmp = Math.trunc((tmp + 1) / 2);
                }
                if (game.u.mh - tmp > 1 && (game.objects[otmp.otyp].oc_material == IRON || game.objects[otmp.otyp].oc_material == METAL) && (game.u.umonnum == PM_BLACK_PUDDING || game.u.umonnum == PM_BROWN_PUDDING)) {
                    /* relevant 'metal' objects are scalpel and tsurugi */
                    if (tmp > 1) {
                        exercise(A_STR, (0));
                    }
                    /* inflict damage now; we know it can't be fatal */
                    game.u.mh -= tmp;
                    game.disp.botl = (1);
                    mhm.damage = 0;
                    if (cloneu()) {
                        You("divide as %s hits you!", mon_nam(magr));
                    }
                }
                rustm(game.youmonst, otmp);
                if (was_poisoned && game.mhitu_dieroll <= 5) {
                    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    buf = sprintf(buf, "%s %s", s_suffix(Monnam(magr)), mpoisons_subj(magr, mattk));
                    /* arbitrary, but most poison sources in the game are
                     * strength-based. With hpdamchance = 10, HP damage occurs
                     * 1/2 of the time and it will hit Str rest of the time.
                     * (This is the same as poisoned ammo.) */
                    poisoned(buf, A_STR, pmname(magr.data, Mgender(magr)), 10, (0));
                }
            } else if (mattk.aatyp != 5 || mhm.damage != 0 || magr != game.u.ustuck) {
                hitmsg(magr, mattk);
                mhm.hitflags |= 1;
            }
        }
    } else {
        let mwep = ((magr).mw);
        let vis = canseemon(magr) && canseemon(mdef);
        if (mattk.aatyp != 254 && mattk.aatyp != 1) {
            mwep = null;
        }
        if (shade_miss(magr, mdef, mwep, (0), vis)) {
            mhm.damage = 0;
        } else if (mattk.aatyp == 3 && (((pd).mflags1 & 2097152) != 0)) {
            mhm.damage = 0;
        } else if (mwep) {
            let marmg = null;
            if (mwep.otyp == CORPSE && ((game.mons[mwep.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[mwep.corpsenm]) == game.mons[PM_CHICKATRICE])) {
                do_stone_mon(magr, mattk, mdef, mhm);
                if (mhm.done) {
                    return;
                }
            }
            mhm.damage += dmgval(mwep, mdef);
            if ((marmg = which_armor(magr, 16)) != null && marmg.otyp == GAUNTLETS_OF_POWER) {
                mhm.damage += (rn2(4) + (3));
            }
            /* is this necessary?  mhitu.c has it... */
            if (mhm.damage < 1) {
                mhm.damage = 1;
            }
            if (mwep.oartifact) {
                if (!artifact_hit(magr, mdef, mwep, { get value() { return mhm.damage; }, set value(_v) { mhm.damage = _v; } }, mhm.dieroll)) {
                    /* when magr's weapon is an artifact, caller suppressed its
                   usual 'hit' message in case artifact_hit() delivers one;
                   now we'll know and might need to deliver skipped message
                   (note: if there's no message there'll be no auxiliary
                   damage so the message here isn't coming too late) */
                    if (game.vis) {
                        pline_mon(magr, "%s hits %s.", Monnam(magr), mon_nam_too(mdef, magr));
                    }
                    mhm.hitflags |= 1;
                }
                if (((mdef).mhp < 1)) {
                    /* artifact_hit updates 'tmp' but doesn't inflict any
                   damage; however, it might cause carried items to be
                   destroyed and they might do so */
                    mhm.hitflags = (2 | (grow_up(magr, mdef) ? 0 : 4));
                    mhm.done = (1);
                    return;
                }
            }
            if (mhm.damage) {
                rustm(mdef, mwep);
            }
            if ((mwep.otrapped || permapoisoned(mwep)) && !rn2(4)) {
                /* 1/4 chance of weapon poison applying is the same as in
                 * uhitm and mhitu cases. But since we don't need to call
                 * any special functions or go through tangled hmon_hitmon
                 * code, we can just jump straight to the poisoning. */
                mhitm_really_poison(magr, mattk, mdef, mhm);
            }
        } else if (pa == game.mons[PM_PURPLE_WORM] && pd == game.mons[PM_SHRIEKER]) {
            /* hack to enhance mm_aggression(); we don't want purple
               worm's bite attack to kill a shrieker because then it
               won't swallow the corpse; but if the target survives,
               the subsequent engulf attack should accomplish that */
            if (mhm.damage >= mdef.mhp && mdef.mhp > 1) {
                mhm.damage = mdef.mhp - 1;
            }
        }
    }
}
export function mhitm_ad_ston(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        if (!munstone(mdef, (1))) {
            minstapetrify(mdef, (1));
        }
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!rn2(3)) {
            if (magr.mcan) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    You_hear("a cough from %s!", mon_nam(magr));
                }
            } else {
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    ;
                    /* You_hear() deals with Deaf */
                    You_hear("hissing.");
                    pline("%s appears to be blowing you a kiss...", Monnam(magr));
                } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    You_hear("%s hissing!", s_suffix(mon_nam(magr)));
                } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    pline("%s seems to grimace.", Monnam(magr));
                }
                if (!rn2(10) || game.flags.moonphase == 0) {
                    if (do_stone_u(magr)) {
                        mhm.hitflags = 1;
                        mhm.done = (1);
                        return;
                    }
                }
            }
        }
    } else {
        if (magr.mcan) {
            return;
        }
        do_stone_mon(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    }
}
export function mhitm_ad_were(magr, mattk, mdef, mhm) {
    let pa = magr.data;
    if (magr == game.youmonst) {
        mhitm_ad_phys(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!rn2(4) && game.u.ulycn == NON_PM && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && !defends(29, game.uwep) && !mhitm_mgc_atk_negated(magr, mdef, (1))) {
            urgent_pline("You feel feverish.");
            exercise(A_CON, (0));
            set_ulycn(((pa).pmidx));
            retouch_equipment(2);
        }
    } else {
        mhitm_ad_phys(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    }
}
export function mhitm_ad_heal(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        mhitm_ad_phys(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    } else if (mdef == game.youmonst) {
        if (magr.mcan || ((game.u.umonnum != game.u.umonster) && ((pd) == game.mons[PM_COCKATRICE] || (pd) == game.mons[PM_CHICKATRICE]))) {
            hitmsg(magr, mattk);
            return;
        }
        if (!(game.uwep && (game.uwep.oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE))) && !game.uarmu && !game.uarm && !game.uarmc && !game.uarms && !game.uarmg && !game.uarmf && !game.uarmh) {
            /* weapon check should match the one in sounds.c for MS_NURSE */
            let goaway = (0);
            pline_mon(magr, "%s hits!  (I hope you don't mind.)", Monnam(magr));
            if ((game.u.umonnum != game.u.umonster)) {
                game.u.mh += rnd(7);
                if (!rn2(7)) {
                    /* no upper limit necessary; effect is temporary */
                    game.u.mhmax++;
                    if (!rn2(13)) {
                        goaway = (1);
                    }
                }
                if (game.u.mh > game.u.mhmax) {
                    game.u.mh = game.u.mhmax;
                }
            } else {
                game.u.uhp += rnd(7);
                if (!rn2(7)) {
                    if (game.u.uhpmax < 5 * game.u.ulevel + d(2 * game.u.ulevel, 10)) {
                        /* hard upper limit via nurse care: 25 * ulevel */
                        game.u.uhpmax++;
                        if (game.u.uhpmax > game.u.uhppeak) {
                            game.u.uhppeak = game.u.uhpmax;
                        }
                    }
                    if (!rn2(13)) {
                        goaway = (1);
                    }
                }
                if (game.u.uhp > game.u.uhpmax) {
                    game.u.uhp = game.u.uhpmax;
                }
            }
            if (!rn2(3)) {
                exercise(A_STR, (1));
            }
            if (!rn2(3)) {
                exercise(A_CON, (1));
            }
            if (game.u.uprops[SICK].intrinsic) {
                make_sick(0, null, (0), 3);
            }
            game.disp.botl = (1);
            if (goaway) {
                mongone(magr);
                mhm.done = (1);
                mhm.hitflags = 2;
                return;
            } else if (!rn2(33)) {
                if (!tele_restrict(magr)) {
                    rloc(magr, 2);
                }
                monflee(magr, d(3, 6), (1), (0));
                mhm.done = (1);
                mhm.hitflags = 1 | 2;
                return;
            }
            mhm.damage = 0;
        } else {
            if ((game.urole.mnum == (PM_HEALER))) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(game.moves % 5)) {
                    ;
                    verbalize("Doc, I can't help you unless you cooperate.");
                }
                mhm.damage = 0;
            } else {
                hitmsg(magr, mattk);
            }
        }
    } else {
        mhitm_ad_phys(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    }
}
export function mhitm_ad_stun(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s %s for a moment.", Monnam(mdef), makeplural(stagger(pd, "stagger")));
        }
        mdef.mstun = 1;
        mhitm_ad_phys(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!magr.mcan && !rn2(4)) {
            make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + mhm.damage, (1));
            mhm.damage = Math.trunc(mhm.damage / 2);
        }
    } else {
        if (magr.mcan) {
            return;
        }
        if (canseemon(mdef)) {
            pline_mon(mdef, "%s %s for a moment.", Monnam(mdef), makeplural(stagger(pd, "stagger")));
        }
        mdef.mstun = 1;
        mhitm_ad_phys(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    }
}
export function mhitm_ad_legs(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        mhitm_ad_phys(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    } else if (mdef == game.youmonst) {
        let side = rn2(2) ? 262144 : 131072;
        let sidestr = (side == 262144) ? "right" : "left";
        let Monst_name = Monnam(magr);
        let leg = body_part(LEG);
        if ((game.u.usteed || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) && !(((magr.data).mflags1 & 1) != 0)) {
            /* This case is too obvious to ignore, but Nethack is not in
         * general very good at considering height--most short monsters
         * still _can_ attack you when you're flying or mounted.
         */
            pline("%s tries to reach your %s %s!", Monst_name, sidestr, leg);
            mhm.damage = 0;
        } else if (magr.mcan) {
            pline_mon(magr, "%s nuzzles against your %s %s!", Monnam(magr), sidestr, leg);
            mhm.damage = 0;
        } else {
            if (game.uarmf) {
                if (rn2(2) && (game.uarmf.otyp == LOW_BOOTS || game.uarmf.otyp == IRON_SHOES)) {
                    pline("%s pricks the exposed part of your %s %s!", Monst_name, sidestr, leg);
                } else if (!rn2(5)) {
                    pline("%s pricks through your %s boot!", Monst_name, sidestr);
                } else {
                    pline("%s scratches your %s boot!", Monst_name, sidestr);
                    mhm.damage = 0;
                    return;
                }
            } else {
                pline("%s pricks your %s %s!", Monst_name, sidestr, leg);
            }
            set_wounded_legs(side, rnd(60 - (acurr(A_DEX))));
            exercise(A_STR, (0));
            exercise(A_DEX, (0));
        }
    } else {
        if (magr.mcan) {
            mhm.damage = 0;
            return;
        }
        mhitm_ad_phys(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    }
}
export function mhitm_ad_dgst(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        mhm.damage = 0;
    } else {
        let num = 0;
        let obj = null;
        if (((pd) == game.mons[PM_DEATH] || (pd) == game.mons[PM_FAMINE] || (pd) == game.mons[PM_PESTILENCE])) {
            /* eating a Rider or its corpse is fatal */
            if (game.vis && canseemon(magr)) {
                pline_mon(magr, "%s %s!", Monnam(magr), (pd == game.mons[PM_FAMINE]) ? "belches feebly, shrivels up and dies" : (pd == game.mons[PM_PESTILENCE]) ? "coughs spasmodically and collapses" : "vomits violently and drops dead");
            }
            mondied(magr);
            if (!((magr).mhp < 1)) {
                mhm.hitflags = 0;
                mhm.done = (1);
                return;
            } else if (magr.mtame && !game.vis) {
                You(brief_feeling, "queasy");
            }
            mhm.hitflags = 4;
            mhm.done = (1);
            return;
        }
        if (game.flags.verbose && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            ;
            verbalize("Burrrrp!");
        }
        wake_nearto(magr.mx, magr.my, 2 * 2);
        mhm.damage = mdef.mhp;
        /* Use up amulet of life saving */
        if ((obj = mlifesaver(mdef)) != null) {
            m_useup(mdef, obj);
        }
        /* Is a corpse for nutrition possible?  It may kill magr */
        if (!corpse_chance(mdef, magr, (1)) || ((magr).mhp < 1)) {
            return;
        }
        /* Pets get nutrition from swallowing monster whole.
         * No nutrition from G_NOCORPSE monster, eg, undead.
         * DGST monsters don't die from undead corpses
         */
        num = ((pd).pmidx);
        if (magr.mtame && !magr.isminion && !(game.mvitals[num].mvflags & 16)) {
            let virtualcorpse = mksobj(CORPSE, (0), (0));
            let nutrit = 0;
            set_corpsenm(virtualcorpse, num);
            nutrit = dog_nutrition(magr, virtualcorpse);
            dealloc_obj(virtualcorpse);
            /* only 50% nutrition, 25% of normal eating time */
            if (magr.meating > 1) {
                magr.meating = Math.trunc((magr.meating + 3) / 4);
            }
            if (nutrit > 1) {
                nutrit = Math.trunc(nutrit / 2);
            }
            ((magr).mextra.edog).hungrytime += nutrit;
        }
    }
}
export function mhitm_ad_samu(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        /* when the Wizard or quest nemesis hits, there's a 1/20 chance
           to steal a quest artifact (any, not just the one for the hero's
           own role) or the Amulet or one of the invocation tools */
        if (!rn2(20)) {
            stealamulet(magr);
        }
    } else {
        mhm.damage = 0;
    }
}
/* disease */
export function mhitm_ad_dise(magr, mattk, mdef, mhm) {
    let pa = magr.data;
    let pd = mdef.data;
    if (magr == game.youmonst) {
        /* mhitm; protected monsters use the same criteria as for poly'd
           hero gaining sick resistance combined with any hero wielding a
           weapon or wearing dragon scales/mail that guards against disease */
        if (pd.mlet == S_FUNGUS || pd == game.mons[PM_GHOUL] || defended(mdef, 33)) {
            mhm.damage = 0;
        }
        return;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!diseasemu(pa)) {
            mhm.damage = 0;
        }
    } else {
        mhitm_dise: {
        }
        if (pd.mlet == S_FUNGUS || pd == game.mons[PM_GHOUL] || defended(mdef, 33)) {
            mhm.damage = 0;
        }
    }
}
/* seduce and also steal item */
export function mhitm_ad_sedu(magr, mattk, mdef, mhm) {
    let pa = magr.data;
    if (magr == game.youmonst) {
        steal_it(mdef, mattk);
        mhm.damage = 0;
    } else if (mdef == game.youmonst) {
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        if ((((magr.data).mflags1 & 262144) != 0)) {
            hitmsg(magr, mattk);
            if (magr.mcan) {
                return;
            }
        } else if (dmgtype(game.youmonst.data, 22) || dmgtype(game.youmonst.data, 35)) {
            /* !SYSOPT_SEDUCE: when hero is attacking and AD_SSEX
                      is disabled, it would be changed to another damage
                      type, but when defending, it remains as-is */
            pline_mon(magr, "%s %s.", Monnam(magr), (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "says something but you can't hear it" : magr.minvent ? "brags about the goods some dungeon explorer provided" : "makes some remarks about how difficult theft is lately");
            if (!tele_restrict(magr)) {
                rloc(magr, 2);
            }
            mhm.hitflags = 8;
            mhm.done = (1);
            return;
        } else if (magr.mcan) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s tries to %s you, but you seem %s.", Adjmonnam(magr, "plain"), game.flags.female ? "charm" : "seduce", game.flags.female ? "unaffected" : "uninterested");
            }
            if (rn2(3)) {
                if (!tele_restrict(magr)) {
                    rloc(magr, 2);
                }
                mhm.hitflags = 8;
                mhm.done = (1);
                return;
            }
            return;
        }
        buf[0] = 0;
        switch (steal(magr, buf)) {
            case -1:
                mhm.hitflags = 4;
                mhm.done = (1);
                return;
            case 0:
                return;
            default:
                if (!(((magr.data).mflags1 & 262144) != 0) && !tele_restrict(magr)) {
                    rloc(magr, 2);
                }
                if ((((magr.data).mflags1 & 262144) != 0) && buf) {
                    if (canseemon(magr)) {
                        pline_mon(magr, "%s tries to %s away with %s.", Monnam(magr), locomotion(magr.data, "run"), buf);
                    }
                }
                monflee(magr, 0, (0), (0));
                mhm.hitflags = 8;
                mhm.done = (1);
                return;
        }
    } else {
        let obj = null;
        if (magr.mcan) {
            return;
        }
        /* find an object to steal, non-cursed if magr is tame */
        for (obj = mdef.minvent; obj; obj = obj.nobj) {
            if (!magr.mtame || !obj.cursed) {
                break;
            }
        }
        if (obj) {
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let onambuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let mdefnambuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            mdefnambuf = strcpy(mdefnambuf, x_monnam(mdef, 1, null, 0, (0)));
            if (game.u.usteed == mdef && obj == which_armor(mdef, 1048576)) {
                dismount_steed(DISMOUNT_POLY);
            }
            extract_from_minvent(mdef, obj, (1), (0));
            /* add_to_minv() might free 'obj' [if it merges] */
            if (game.vis) {
                onambuf = strcpy(onambuf, doname(obj));
            }
            add_to_minv(magr, obj);
            buf = strcpy(buf, Monnam(magr));
            if (game.vis && canseemon(mdef)) {
                /* make a special x_monnam() call that never omits
               the saddle, and save it for later messages */
                /* "You can no longer ride <steed>." */
                pline("%s steals %s from %s!", buf, onambuf, mdefnambuf);
            }
            possibly_unwield(mdef, (0));
            mdef.mstrategy &= ~536870912;
            mselftouch(mdef, null, (0));
            if (((mdef).mhp < 1)) {
                mhm.hitflags = (2 | (grow_up(magr, mdef) ? 0 : 4));
                mhm.done = (1);
                return;
            }
            if (pa.mlet == S_NYMPH && !tele_restrict(magr)) {
                let couldspot = (canseemon(magr) || sensemon(magr));
                mhm.hitflags = 8;
                rloc(magr, 4);
                if (game.vis && couldspot && !(canseemon(magr) || sensemon(magr))) {
                    pline("%s suddenly disappears!", buf);
                }
            }
        }
        mhm.damage = 0;
    }
}
export function mhitm_ad_ssex(magr, mattk, mdef, mhm) {
    if (magr == game.youmonst) {
        mhitm_ad_sedu(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    } else if (mdef == game.youmonst) {
        if (game.sysopt.seduce) {
            if (could_seduce(magr, mdef, mattk) == 1 && !magr.mcan) {
                if (doseduce(magr)) {
                    mhm.hitflags = 8;
                    mhm.done = (1);
                    return;
                }
            }
            return;
        }
        mhitm_ad_sedu(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    } else {
        mhitm_ad_sedu(magr, mattk, mdef, mhm);
        if (mhm.done) {
            return;
        }
    }
}
export function mhitm_adtyping(magr, mattk, mdef, mhm) {
    switch (mattk.adtyp) {
        case 12:
            mhitm_ad_stun(magr, mattk, mdef, mhm);
            break;
        case 17:
            mhitm_ad_legs(magr, mattk, mdef, mhm);
            break;
        case 29:
            mhitm_ad_were(magr, mattk, mdef, mhm);
            break;
        case 27:
            mhitm_ad_heal(magr, mattk, mdef, mhm);
            break;
        case 0:
            mhitm_ad_phys(magr, mattk, mdef, mhm);
            break;
        case 2:
            mhitm_ad_fire(magr, mattk, mdef, mhm);
            break;
        case 3:
            mhitm_ad_cold(magr, mattk, mdef, mhm);
            break;
        case 6:
            mhitm_ad_elec(magr, mattk, mdef, mhm);
            break;
        case 8:
            mhitm_ad_acid(magr, mattk, mdef, mhm);
            break;
        case 18:
            mhitm_ad_ston(magr, mattk, mdef, mhm);
            break;
        case 35:
            mhitm_ad_ssex(magr, mattk, mdef, mhm);
            break;
        case 21:
        case 22:
            mhitm_ad_sedu(magr, mattk, mdef, mhm);
            break;
        case 20:
            mhitm_ad_sgld(magr, mattk, mdef, mhm);
            break;
        case 23:
            mhitm_ad_tlpt(magr, mattk, mdef, mhm);
            break;
        case 11:
            mhitm_ad_blnd(magr, mattk, mdef, mhm);
            break;
        case 253:
            mhitm_ad_curs(magr, mattk, mdef, mhm);
            break;
        case 15:
            mhitm_ad_drli(magr, mattk, mdef, mhm);
            break;
        case 24:
            mhitm_ad_rust(magr, mattk, mdef, mhm);
            break;
        case 42:
            mhitm_ad_corr(magr, mattk, mdef, mhm);
            break;
        case 34:
            mhitm_ad_dcay(magr, mattk, mdef, mhm);
            break;
        case 16:
            mhitm_ad_dren(magr, mattk, mdef, mhm);
            break;
        case 7:
        case 30:
        case 31:
            mhitm_ad_drst(magr, mattk, mdef, mhm);
            break;
        case 32:
            mhitm_ad_drin(magr, mattk, mdef, mhm);
            break;
        case 19:
            mhitm_ad_stck(magr, mattk, mdef, mhm);
            break;
        case 28:
            mhitm_ad_wrap(magr, mattk, mdef, mhm);
            break;
        case 14:
            mhitm_ad_plys(magr, mattk, mdef, mhm);
            break;
        case 4:
            mhitm_ad_slee(magr, mattk, mdef, mhm);
            break;
        case 40:
            mhitm_ad_slim(magr, mattk, mdef, mhm);
            break;
        case 41:
            mhitm_ad_ench(magr, mattk, mdef, mhm);
            break;
        case 13:
            mhitm_ad_slow(magr, mattk, mdef, mhm);
            break;
        case 25:
            mhitm_ad_conf(magr, mattk, mdef, mhm);
            break;
        case 43:
            mhitm_ad_poly(magr, mattk, mdef, mhm);
            break;
        case 33:
            mhitm_ad_dise(magr, mattk, mdef, mhm);
            break;
        case 252:
            mhitm_ad_samu(magr, mattk, mdef, mhm);
            break;
        case 37:
            mhitm_ad_deth(magr, mattk, mdef, mhm);
            break;
        case 38:
            mhitm_ad_pest(magr, mattk, mdef, mhm);
            break;
        case 39:
            mhitm_ad_famn(magr, mattk, mdef, mhm);
            break;
        case 26:
            mhitm_ad_dgst(magr, mattk, mdef, mhm);
            break;
        case 36:
            mhitm_ad_halu(magr, mattk, mdef, mhm);
            break;
        default:
            mhm.damage = 0;
    }
}
/* target */
/* hero's attack */
/* blessed and/or silver bonus against various things */
export function damageum(mdef, mattk, specialdmg) {
    let mhm = { damage: 0, hitflags: 0, done: 0, permdmg: 0, specialdmg: 0, dieroll: 0 };
    mhm.damage = d(mattk.damn, mattk.damd);
    mhm.hitflags = 0;
    mhm.permdmg = 0;
    mhm.specialdmg = specialdmg;
    mhm.done = (0);
    if ((((game.youmonst.data).mflags2 & 256) != 0) && !rn2(13) && !game.uwep && game.u.umonnum != PM_AMOROUS_DEMON && game.u.umonnum != PM_BALROG) {
        demonpet();
        return 0;
    }
    mhitm_adtyping(game.youmonst, mattk, mdef, mhm);
    if (mhm.done) {
        return mhm.hitflags;
    }
    mdef.mstrategy &= ~536870912;
    mdef.mhp -= mhm.damage;
    if (((mdef).mhp < 1)) {
        /* troll killed by Trollsbane won't auto-revive; FIXME? same when
           Trollsbane is wielded as primary and two-weaponing kills with
           secondary, which matches monster vs monster behavior but is
           different from the non-poly'd hero vs monster behavior */
        if (mattk.aatyp == 254 || mattk.aatyp == 1) {
            game.mkcorpstat_norevive = ((mdef).data.mlet == S_TROLL && (game.uwep) && (game.uwep).oartifact == ART_TROLLSBANE) ? (1) : (0);
        }
        if (mdef.mtame && !((game.viz_array[mdef.my][mdef.mx] & 2) != 0)) {
            /* (DEADMONSTER(mdef) and !mhm.damage => already killed) */
            You_feel("embarrassed for a moment.");
            if (mhm.damage) {
                xkilled(mdef, 1);
            }
        } else if (!game.flags.verbose) {
            You("destroy it!");
            if (mhm.damage) {
                xkilled(mdef, 1);
            }
        } else if (mhm.damage) {
            /* regular "you kill <mdef>" message */
            killed(mdef);
        }
        game.mkcorpstat_norevive = (0);
        return 2;
    }
    return 1;
}
/* Hero, as a monster which is capable of an exploding attack mattk, is
 * exploding at a target monster mdef, or just exploding at nothing (e.g. with
 * forcefight) if mdef is null.
 */
export function explum(mdef, mattk) {
    let tmp = d(mattk.damn, mattk.damd);
    switch (mattk.adtyp) {
        case 11:
            if (mdef && !resists_blnd(mdef)) {
                pline("%s is blinded by your flash of light!", Monnam(mdef));
                mdef.mblinded = ((mdef.mblinded + tmp) < (127) ? (mdef.mblinded + tmp) : (127));
                mdef.mcansee = 0;
            }
            break;
        case 36:
            if (mdef && (((mdef.data).mflags1 & 4096) == 0) && mdef.mcansee) {
                pline("%s is affected by your flash of light!", Monnam(mdef));
                mdef.mconf = 1;
            }
            break;
        case 3:
        case 2:
        case 6:
            explode(game.u.ux, game.u.uy, (mattk.adtyp - 1) + 20, tmp, (MAXOCLASSES + 2), adtyp_to_expltype(mattk.adtyp));
            if (mdef && ((mdef).mhp < 1)) {
                /* See comment in mon_explodes() and in zap.c for an explanation
           of this math.  Here, the player is causing the explosion, so it
           should be in the +20 to +29 range instead of negative. */
                /* Other monsters may have died too, but return this if the actual
               target died. */
                return 2;
            }
            break;
        default:
            break;
    }
    /* same radius as exploding monster */
    wake_nearto(game.u.ux, game.u.uy, 7 * 7);
    return 1;
}
export function start_engulf(mdef) {
    let u_digest = (dmgtype_fromattack((game.youmonst.data), 26, 11) != null);
    let u_enfold = (dmgtype_fromattack((game.youmonst.data), 28, 11) != null);
    if (!(((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic))) {
        map_location(game.u.ux, game.u.uy, (1));
        tmp_at((-5), (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((game.youmonst).data).pmidx)) + (((game.youmonst).female == 0) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)));
        tmp_at(mdef.mx, mdef.my);
    }
    You("%s %s%s!", u_digest ? "swallow" : u_enfold ? "enclose" : "engulf", mon_nam(mdef), u_digest ? " whole" : "");
    (game.windowprocs.win_delay_output)();
    (game.windowprocs.win_delay_output)();
}
export function end_engulf() {
    if (!(((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic))) {
        tmp_at((-7), 0);
        newsym(game.u.ux, game.u.uy);
    }
}
let __gulpum_msgbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function gulpum(mdef, mattk) {
    let tmp = 0;
    let dam = d(mattk.damn, mattk.damd);
    let fatal_gulp = 0;
    let u_digest = (dmgtype_fromattack((game.youmonst.data), 26, 11) != null);
    let u_enfold = (dmgtype_fromattack((game.youmonst.data), 28, 11) != null);
    let otmp = null;
    let pd = mdef.data;
    let expel_verb = u_digest ? "regurgitate" : u_enfold ? "release" : "expel";
    /* Not totally the same as for real monsters.  Specifically, these
     * don't take multiple moves.  (It's just too hard, for too little
     * result, to program monsters which attack from inside you, which
     * would be necessary if done accurately.)  Instead, we arbitrarily
     * kill the monster immediately for AD_DGST and we regurgitate them
     * after exactly 1 round of attack otherwise.  -KAA
     */
    if (!engulf_target(game.youmonst, mdef)) {
        return 0;
    }
    if (!(u_digest && game.u.uhunger >= 1500) && !game.u.uswallow) {
        if (!((game.youmonst.data) == game.mons[PM_FIRE_VORTEX] || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_SALAMANDER])) {
            for (otmp = mdef.minvent; otmp; otmp = otmp.nobj) {
                snuff_lit(otmp);
            }
        }
        if (((mdef).cham == PM_VAMPIRE || (mdef).cham == PM_VAMPIRE_LEADER || (mdef).cham == PM_VLAD_THE_IMPALER) && newcham(mdef, game.mons[mdef.cham], 0)) {
            /* force vampire in bat, cloud, or wolf form to revert back to
           vampire form now instead of dealing with that when it dies */
            You("%s it, then %s it.", u_digest ? "swallow" : u_enfold ? "enclose" : "engulf", expel_verb);
            if ((canseemon(mdef) || sensemon(mdef))) {
                /* Avoiding a_monnam here: if the target is named, it gives us
                   a sequence like "You bite Dracula.  You swallow it, then
                   regurgitate it.  It turns into Dracula." */
                pline("It turns into %s.", x_monnam(mdef, 2, null, (32 | 1 | 2), (0)));
            } else {
                map_invisible(mdef.mx, mdef.my);
            }
            return 1;
        }
        /* engulfing a cockatrice or digesting a Rider or Medusa */
        fatal_gulp = (((pd) == game.mons[PM_COCKATRICE] || (pd) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) || (mattk.adtyp == 26 && (((pd) == game.mons[PM_DEATH] || (pd) == game.mons[PM_FAMINE] || (pd) == game.mons[PM_PESTILENCE]) || (pd == game.mons[PM_MEDUSA] && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic))));
        if (mattk.adtyp == 26 && (!(game.u.uprops[SLOW_DIGESTION].intrinsic || game.u.uprops[SLOW_DIGESTION].extrinsic) || fatal_gulp)) {
            eating_conducts(pd);
        }
        if (fatal_gulp && !((pd) == game.mons[PM_DEATH] || (pd) == game.mons[PM_FAMINE] || (pd) == game.mons[PM_PESTILENCE])) {
            let kbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let mnam = pmname(pd, Mgender(mdef));
            if (!(((pd).mflags2 & 524288) != 0)) {
                mnam = an(mnam);
            }
            You("%s %s.", u_digest ? "englut" : "engulf", mon_nam(mdef));
            kbuf = sprintf(kbuf, "%s %s%s", u_digest ? "swallowing" : u_enfold ? "enclosing" : "engulfing", mnam, u_digest ? " whole" : "");
            instapetrify(kbuf);
        } else {
            start_engulf(mdef);
            switch (mattk.adtyp) {
                case 26:
                    if (((pd) == game.mons[PM_DEATH] || (pd) == game.mons[PM_FAMINE] || (pd) == game.mons[PM_PESTILENCE])) {
                        pline("Unfortunately, digesting any of it is fatal.");
                        end_engulf();
                        game.killer.name = sprintf(game.killer.name, "unwisely tried to eat %s", pmname(pd, Mgender(mdef)));
                        game.killer.format = 2;
                        done(DIED);
                        return 0;
                    }
                    if ((game.u.uprops[SLOW_DIGESTION].intrinsic || game.u.uprops[SLOW_DIGESTION].extrinsic)) {
                        dam = 0;
                        break;
                    }
                    if ((otmp = mlifesaver(mdef)) != null) {
                        m_useup(mdef, otmp);
                    }
                    newuhs((0));
                    /* start_engulf() issues "you engulf <mdef>" above; this
                   used to specify XKILL_NOMSG but we need "you kill <mdef>"
                   in case we're also going to get "welcome to level N+1";
                   "you totally digest <mdef>" will be coming soon (after
                   several turns) but the level-gain message seems out of
                   order if the kill message is left implicit */
                    game.mswallower = game.youmonst;
                    xkilled(mdef, 0 | 2);
                    if (!((mdef).mhp < 1)) {
                        You("hurriedly regurgitate the sizzling in your %s.", body_part(STOMACH));
                    } else {
                        tmp = 1 + (pd.cwt >> 8);
                        if (corpse_chance(mdef, game.youmonst, (1)) && !(game.mvitals[((pd).pmidx)].mvflags & 16)) {
                            /* nutrition only if there can be a corpse */
                            game.u.uhunger += Math.trunc((pd.cnutrit + 1) / 2);
                        } else {
                            tmp = 0;
                        }
                        __gulpum_msgbuf = sprintf(__gulpum_msgbuf, "You totally digest %s.", mon_nam(mdef));
                        if (tmp != 0) {
                            /* setting afternmv = end_engulf is tempting,
                         * but will cause problems if the player is
                         * attacked (which uses his real location) or
                         * if his See_invisible wears off
                         */
                            You("digest %s.", mon_nam(mdef));
                            if ((game.u.uprops[SLOW_DIGESTION].intrinsic || game.u.uprops[SLOW_DIGESTION].extrinsic)) {
                                tmp *= 2;
                            }
                            nomul(-tmp);
                            game.multi_reason = "digesting something";
                            game.nomovemsg = __gulpum_msgbuf;
                            /* possible intrinsic once totally digested */
                            game.corpsenm_digested = ((pd).pmidx);
                            game.afternmv = Finish_digestion;
                        } else {
                            pline("%s", __gulpum_msgbuf);
                        }
                        if (pd == game.mons[PM_GREEN_SLIME]) {
                            __gulpum_msgbuf = sprintf(__gulpum_msgbuf, "%s isn't sitting well with you.", The(pmname(pd, Mgender(mdef))));
                            if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
                                make_slimed(5, null);
                            }
                        } else {
                            exercise(A_CON, (1));
                        }
                    }
                    game.mswallower = null;
                    end_engulf();
                    return 2;
                case 0:
                    if (game.youmonst.data == game.mons[PM_FOG_CLOUD]) {
                        pline("%s is laden with your moisture.", Monnam(mdef));
                        if (((((pd).mflags1 & 1024) != 0) || (((pd).mflags1 & 512) != 0)) && !((pd) == game.mons[PM_FIRE_VORTEX] || (pd) == game.mons[PM_FLAMING_SPHERE] || (pd) == game.mons[PM_FIRE_ELEMENTAL] || (pd) == game.mons[PM_SALAMANDER])) {
                            dam = 0;
                            pline("%s seems unharmed.", Monnam(mdef));
                        }
                    } else {
                        pline("%s is %s!", Monnam(mdef), (dmgtype_fromattack((game.youmonst.data), 28, 11) != null) ? "being squashed" : "pummeled with your debris");
                    }
                    break;
                case 8:
                    pline("%s is covered with your goo!", Monnam(mdef));
                    if (Resists_Elem(mdef, ACID_RES)) {
                        pline("It seems harmless to %s.", mon_nam(mdef));
                        dam = 0;
                    }
                    break;
                case 11:
                    if (can_blnd(game.youmonst, mdef, mattk.aatyp, null)) {
                        if (mdef.mcansee) {
                            pline("%s can't see in there!", Monnam(mdef));
                        }
                        mdef.mcansee = 0;
                        dam += mdef.mblinded;
                        if (dam > 127) {
                            dam = 127;
                        }
                        mdef.mblinded = dam;
                    }
                    dam = 0;
                    break;
                case 6:
                    if (rn2(2)) {
                        pline_The("air around %s crackles with electricity.", mon_nam(mdef));
                        if (Resists_Elem(mdef, SHOCK_RES)) {
                            pline("%s seems unhurt.", Monnam(mdef));
                            dam = 0;
                        }
                        golemeffects(mdef, mattk.adtyp, dam);
                    } else {
                        dam = 0;
                    }
                    break;
                case 3:
                    if (rn2(2)) {
                        if (Resists_Elem(mdef, COLD_RES)) {
                            pline("%s seems mildly chilly.", Monnam(mdef));
                            dam = 0;
                        } else {
                            pline("%s is freezing to death!", Monnam(mdef));
                        }
                        golemeffects(mdef, mattk.adtyp, dam);
                    } else {
                        dam = 0;
                    }
                    break;
                case 2:
                    if (rn2(2)) {
                        if (Resists_Elem(mdef, FIRE_RES)) {
                            pline("%s seems mildly hot.", Monnam(mdef));
                            dam = 0;
                        } else {
                            pline("%s is burning to a crisp!", Monnam(mdef));
                        }
                        golemeffects(mdef, mattk.adtyp, dam);
                    } else {
                        dam = 0;
                    }
                    break;
                case 16:
                    if (!rn2(4)) {
                        xdrainenergym(mdef, (1));
                    }
                    dam = 0;
                    break;
            }
            end_engulf();
            mdef.mhp -= dam;
            if (((mdef).mhp < 1)) {
                killed(mdef);
                if (((mdef).mhp < 1)) {
                    return 2;
                }
            }
            You("%s %s!", expel_verb, mon_nam(mdef));
            if (((game.u.uprops[SLOW_DIGESTION].intrinsic || game.u.uprops[SLOW_DIGESTION].extrinsic) || (((game.youmonst.data).mflags1 & 262144) != 0)) && u_digest) {
                pline("Obviously, you didn't like %s taste.", s_suffix(mon_nam(mdef)));
            }
        }
    }
    return 0;
}
export function missum(mdef, mattk, wouldhavehit) {
    /* monk is missing due to penalty for wearing suit */
    if (wouldhavehit) {
        Your("armor is rather cumbersome...");
    }
    if (could_seduce(game.youmonst, mdef, mattk)) {
        You("pretend to be friendly to %s.", mon_nam(mdef));
    } else if ((canseemon(mdef) || sensemon(mdef)) && game.flags.verbose) {
        You("miss %s.", mon_nam(mdef));
    } else {
        You("miss it.");
    }
    if (!((mdef).msleeping || !(mdef).mcanmove)) {
        wakeup(mdef, (1));
    }
}
/* check whether equipment protects against knockback */
export function m_is_steadfast(mtmp) {
    let is_u = (mtmp == game.youmonst);
    let otmp = is_u ? game.uwep : ((mtmp).mw);
    /* must be on the ground (or in water) */
    if ((is_u ? (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) : ((((mtmp.data).mflags1 & 1) != 0) || ((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT))) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !is_pool(game.u.ux, game.u.uy))) {
        return (0);
    }
    if (is_art(otmp, ART_GIANTSLAYER)) {
        return (1);
    }
    /* steadfast if carrying any loadstone (and not floating or flying);
       'is_u' test not needed here; m_carrying() is 'youmonst' aware */
    if (m_carrying(mtmp, LOADSTONE)) {
        return (1);
    }
    /* when mounted and steed is target of knockback, check the rider for
       a loadstone too (Giantslayer's protection doesn't extend to steed) */
    if (game.u.usteed && mtmp == game.u.usteed && carrying(LOADSTONE)) {
        return (1);
    }
    return (0);
}
/* monster hits another monster hard enough to knock it back? */
/* attacker; might be hero */
/* defender; might be hero (only if magr isn't)  */
/* attack type and damage info */
/* modified if magr or mdef dies */
/* True: via weapon hit */
export function mhitm_knockback(magr, mdef, mattk, hitflags, weapon_used) {
    let magrbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let mdefbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let otmp = null;
    let knockedhow = null;
    let dx = 0;
    let dy = 0;
    let defx = 0;
    let defy = 0;
    /* 67%: 1 step, 33%: 2 steps */
    let knockdistance = rn2(3) ? 1 : 2;
    /* 1/6 chance of attack knocking back a monster */
    let chance = 6;
    let u_agr = (magr == game.youmonst);
    let u_def = (mdef == game.youmonst);
    let was_u = (0);
    let dismount = (0);
    let wep = weapon_used ? (u_agr ? game.uwep : ((magr).mw)) : null;
    if (wep && is_art(wep, ART_OGRESMASHER)) {
        chance = 2;
    }
    if (rn2(chance)) {
        return (0);
    }
    /* only certain attacks qualify for knockback */
    if (!((mattk.adtyp == 0) && (mattk.aatyp == 1 || mattk.aatyp == 3 || mattk.aatyp == 4 || mattk.aatyp == 254))) {
        return (0);
    }
    /* don't knockback if attacker also wants to grab or engulf */
    if (attacktype(magr.data, 11) || attacktype(magr.data, 7) || sticks(magr.data)) {
        return (0);
    }
    /* decide where the first step will place the target; not accurate
       for being knocked out of saddle but doesn't need to be; used for
       test_move() and for message before actual hurtle */
    defx = u_def ? game.u.ux : mdef.mx;
    defy = u_def ? game.u.uy : mdef.my;
    dx = sgn(defx - (u_agr ? game.u.ux : magr.mx));
    dy = sgn(defy - (u_agr ? game.u.uy : magr.my));
    if (u_def) {
        /* can't move most targets into or out of a doorway diagonally */
        if (!test_move(defx, defy, dx, dy, 1)) {
            return (0);
        }
    } else {
        if (!isok(defx + dx, defy + dy)) {
            return (0);
        }
        if (((game.level.locations[defx][defy].typ) == DOOR) && (defx - magr.mx && defy - magr.my) && !doorless_door(defx, defy)) {
            return (0);
        }
    }
    if (u_def && game.u.usteed) {
        if ((otmp = which_armor(game.u.usteed, 1048576)) != null && otmp.cursed) {
            /* if hero is stuck to a cursed saddle, knock the steed back */
            mdef = game.u.usteed;
            was_u = (1);
            u_def = (0);
        } else {
            /* saddle is not cursed; knock hero out of it */
            dismount = (1);
        }
    }
    if ((!u_agr && ((magr).mhp < 1)) || (!u_def && ((mdef).mhp < 1))) {
        return (0);
    }
    /* attacker must be much larger than defender */
    if (!(magr.data.msize > (mdef.data.msize + 1))) {
        return (0);
    }
    /* no knockback with a flimsy or non-blunt weapon */
    if (wep && ((game.objects[(wep).otyp].oc_material <= LEATHER || (wep).otyp == RUBBER_HOSE) || !(((wep).oclass == WEAPON_CLASS || ((wep).oclass == TOOL_CLASS && game.objects[(wep).otyp].oc_subtyp != P_NONE)) && ((game.objects[(wep).otyp].oc_dir & 4) != 0)))) {
        return (0);
    }
    /* needs a solid physical hit */
    if ((((magr.data).mflags1 & 1048576) != 0)) {
        return (0);
    }
    /* the attack must have hit */
    /* mon-vs-mon code path doesn't set up hitflags */
    if ((u_agr || u_def) && !(hitflags.value & 1)) {
        return (0);
    }
    if (m_is_steadfast(mdef)) {
        if (u_def || (game.u.usteed && mdef == game.u.usteed)) {
            /* steadfast defender cannot be pushed around */
            mdefbuf[0] = 0;
            if (game.u.usteed) {
                nh_snprintf("mhitm_knockback", 5347, mdefbuf, 256 /* sizeof(char [256]) */, "and %s ", y_monnam(game.u.usteed));
            }
            You("%sdon't budge.", mdefbuf);
        } else if (canseemon(mdef)) {
            pline("%s doesn't budge.", Monnam(mdef));
        }
        return (0);
    }
    /* subtly vary the message text if monster won't actually move */
    knockedhow = dismount ? "out of your saddle" : will_hurtle(mdef, defx + dx, defy + dy) ? "backward" : "back";
    if (u_def || canseemon(mdef)) {
        magrbuf = strcpy(magrbuf, u_agr ? "You" : Monnam(magr));
        mdefbuf = strcpy(mdefbuf, (u_def || was_u) ? "you" : y_monnam(mdef));
        if (was_u) {
            nh_snprintf("mhitm_knockback", 5366, eos(mdefbuf), 256 /* sizeof(char [256]) */ - strlen(mdefbuf), " and %s", y_monnam(game.u.usteed));
        }
        /*
         * uhitm: You knock the gnome back with a powerful blow!
         * mhitu: The red dragon knocks you back with a forceful blow!
         * mhitm: The fire giant knocks the gnome back with a forceful strike!
         */
        pline("%s %s %s %s with a %s %s!", magrbuf, vtense(magrbuf, "knock"), mdefbuf, knockedhow, rn2(2) ? "forceful" : "powerful", rn2(2) ? "blow" : "strike");
    } else if (u_agr) {
        /* hero knocks unseen foe back; noticed by touch */
        You_feel("%s be knocked %s!", some_mon_nam(mdef), knockedhow);
    }
    if (game.u.ustuck && (u_def || u_agr)) {
        unstuck(game.u.ustuck);
    }
    if (u_def) {
        if (dismount) {
            /* do the actual knockback effect */
            /* normally u.dx,u.dy indicates the direction hero is throwing,
               zapping, &c but here it is used to pass preferred direction
               for dismount to dismount_steed (for DISMOUNT_KNOCKED only) */
            game.u.dx = dx;
            game.u.dy = dy;
            dismount_steed(DISMOUNT_KNOCKED);
        } else {
            hurtle(dx, dy, knockdistance, (0));
            hitflags.value |= 1;
        }
        /* update magr's idea of where you are */
        set_apparxy(magr);
        if (!game.u.uprops[STUNNED].intrinsic && !rn2(4)) {
            make_stunned((knockdistance + 1), (1));
        }
    } else {
        mhurtle(mdef, dx, dy, knockdistance);
        if (!u_agr) {
            hitflags.value |= 1;
        }
        if (((mdef).mhp < 1)) {
            if (!was_u) {
                hitflags.value |= 2;
            }
        } else if (!rn2(4)) {
            mdef.mstun = 1;
            /* if steed and hero were knocked back, update attacker's idea
               of where hero is */
            if (mdef == game.u.usteed) {
                set_apparxy(magr);
            }
        }
    }
    if (!u_agr) {
        if (((magr).mhp < 1)) {
            hitflags.value |= 4;
        }
    }
    return (1);
}
/* attack monster as a monster; returns True if mon survives */
export function hmonas(mon) {
    let mattk = null;
    let alt_attk = { aatyp: 0, adtyp: 0, damn: 0, damd: 0 };
    let weapon = null;
    let originalweapon = null;
    let altwep = (0);
    let weapon_used = (0);
    let odd_claw = (1);
    let i = 0;
    let tmp = 0;
    let dieroll = 0;
    let armorpenalty = 0;
    let sum = [0, 0, 0, 0, 0, 0];
    let dhit = 0;
    let attknum = 0;
    let multi_claw = 0;
    let multi_weap = 0;
    let monster_survived = 0;
    /* not used here but umpteen mhitm_ad_xxxx() need this */
    game.vis = (canseemon(mon) || (dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 2));
    for (i = 0; i < 6; i++) {
        /* with just one touch/claw/weapon attack, both rings matter;
       with more than one, alternate right and left when checking
       whether silver ring causes successful hit */
        sum[i] = 0;
        mattk = getmattk(game.youmonst, mon, i, sum, alt_attk);
        if (mattk.aatyp == 254) {
            ++multi_weap;
        }
        if (mattk.aatyp == 254 || mattk.aatyp == 1 || mattk.aatyp == 5) {
            ++multi_claw;
        }
    }
    /* switch from count to yes/no */
    multi_claw = (multi_claw > 1);
    game.twohits = 0;
    game.skipdrin = (0);
    const __use_weapon_attack = () => {
        odd_claw = !odd_claw;
        if (weapon_used && (sum[i - 1] > 0) && game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
            return 'continue_for';
        }
        weapon_used = (1);
        originalweapon = (altwep && game.uswapwep) ? game.uswapwep : game.uwep;
        if (game.uswapwep && game.uwep && (game.uwep.oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)) && !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big) && !game.uarms && !game.uswapwep.oartifact && (game.uswapwep.oclass == WEAPON_CLASS || ((game.uswapwep).oclass == TOOL_CLASS && game.objects[(game.uswapwep).otyp].oc_subtyp != P_NONE)) && !((game.uswapwep.oclass == WEAPON_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp >= P_BOW && game.objects[game.uswapwep.otyp].oc_subtyp <= P_CROSSBOW) || ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == GEM_CLASS) && game.objects[game.uswapwep.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uswapwep.otyp].oc_subtyp <= -P_BOW) || ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == TOOL_CLASS) && game.objects[game.uswapwep.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[game.uswapwep.otyp].oc_subtyp <= -P_DART)) && !((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == TOOL_CLASS) && game.objects[game.uswapwep.otyp].oc_big) && !(game.objects[game.uswapwep.otyp].oc_material == SILVER && (game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data)))) {
            altwep = !altwep;
        }
        weapon = originalweapon;
        if (!weapon) {
            originalweapon = game.uarmg;
        }
        tmp = find_roll_to_hit(mon, 254, weapon, { get value() { return attknum; }, set value(_v) { attknum = _v; } }, { get value() { return armorpenalty; }, set value(_v) { armorpenalty = _v; } });
        mon_maybe_unparalyze(mon);
        dieroll = rnd(20);
        dhit = (tmp > dieroll || game.u.uswallow);
        if (multi_weap > 1) {
            ++game.twohits;
        }
        monster_survived = known_hitum(mon, weapon, { get value() { return dhit; }, set value(_v) { dhit = _v; } }, tmp, armorpenalty, mattk, dieroll);
        weapon = originalweapon;
        if (!monster_survived) {
            sum[i] = 2;
            return 'break_switch';
        } else {
            sum[i] = dhit ? 1 : 0;
        }
        if ((game.level.monsters[game.u.ux + game.u.dx][game.u.uy + game.u.dy]) != mon) {
            i = 6;
            return 'break_passivedone';
        }
        if (dhit && mattk.adtyp != 241 && mattk.adtyp != 0) {
            sum[i] = damageum(mon, mattk, 0);
        }
        return 'break_switch';
    };
    for (i = 0; i < 6; i++) {
        passivedone: {
            /* sum[i] = M_ATTK_MISS; -- now done above */
            /* target might have been knocked back so no longer in range, or an
           engulfing vampshifted fog cloud killed and reverted to vampire
           that's placed at another spot (hero occupies mon's first spot) */
            if (i > 0 && ((game.level.monsters[game.bhitpos.x][game.bhitpos.y]) != mon || ((mon).mhp < 1))) {
                continue;
            }
            mattk = getmattk(game.youmonst, mon, i, sum, alt_attk);
            if (game.skipdrin && mattk.aatyp == 16 && mattk.adtyp == 32) {
                continue;
            }
            weapon = null;
            switch (mattk.aatyp) {
                case 254: {
                    const __r = __use_weapon_attack();
                    if (__r === 'continue_for') continue;
                    if (__r === 'break_passivedone') break passivedone;
                    break;
                }
                case 1:
                    if (game.uwep && !((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1)) && !weapon_used) {
                        const __r = __use_weapon_attack();
                        if (__r === 'continue_for') continue;
                        if (__r === 'break_passivedone') break passivedone;
                        break;
                    }
                    ;
                case 5:
                    if (game.uwep && game.youmonst.data.mlet == S_LICH && !weapon_used) {
                        const __r = __use_weapon_attack();
                        if (__r === 'continue_for') continue;
                        if (__r === 'break_passivedone') break passivedone;
                        break;
                    }
                    ;
                case 3:
                    if (mattk.aatyp == 3 && mtrapped_in_pit(game.youmonst)) {
                        continue;
                    }
                    ;
                case 2:
                case 6:
                case 4:
                case 16:
                    tmp = find_roll_to_hit(mon, mattk.aatyp, null, { get value() { return attknum; }, set value(_v) { attknum = _v; } }, { get value() { return armorpenalty; }, set value(_v) { armorpenalty = _v; } });
                    mon_maybe_unparalyze(mon);
                    dieroll = rnd(20);
                    dhit = (tmp > dieroll || game.u.uswallow);
                    if (dhit) {
                        let compat = 0;
                        let specialdmg = 0;
                        let silverhit = 0;
                        let verb = null;
                        if (!game.u.uswallow && (compat = could_seduce(game.youmonst, mon, mattk)) != 0) {
                            You("%s %s %s.", (mon.mcansee && (((mon.data).mflags1 & 4096) == 0)) ? "smile at" : "talk to", mon_nam(mon), (compat == 2) ? "engagingly" : "seductively");
                            /* doesn't anger it; no wakeup() */
                            sum[i] = damageum(mon, mattk, 0);
                            break;
                        }
                        wakeup(mon, (1));
                        /* blessed and/or silver bonus */
                        specialdmg = 0;
                        switch (mattk.aatyp) {
                            case 1:
                            case 5:
                                verb = (mattk.aatyp == 5) ? "touch" : "claws";
                                /* decide if silver-hater will be hit by silver ring(s);
                       for 'multi_claw' where attacks alternate right/left,
                       assume 'even' claw or touch attacks use dominant hand
                       or paw, 'odd' ones use non-dominant hand for ring
                       interaction; even vs odd is based on actual attacks
                       rather than on index into mon->dat->mattk[] so that
                       {bite,claw,claw} instead of {claw,claw,bite} doesn't
                       make poly'd hero mysteriously switch handedness */
                                odd_claw = !odd_claw;
                                specialdmg = special_dmgval(game.youmonst, mon, 16 | ((odd_claw || !multi_claw) ? 131072 : 0) | ((!odd_claw || !multi_claw) ? 262144 : 0), { get value() { return silverhit; }, set value(_v) { silverhit = _v; } });
                                break;
                            case 16:
                                verb = "tentacles";
                                break;
                            case 3:
                                verb = "kick";
                                specialdmg = special_dmgval(game.youmonst, mon, 32, { get value() { return silverhit; }, set value(_v) { silverhit = _v; } });
                                break;
                            case 4:
                                verb = "head butt";
                                /* mbodypart(mon,HEAD)=="head" */
                                /* hypothetical; if any form with a head-butt attack
                       could wear a helmet, it would hit shades when
                       wearing a blessed (or silver) one */
                                specialdmg = special_dmgval(game.youmonst, mon, 4, { get value() { return silverhit; }, set value(_v) { silverhit = _v; } });
                                break;
                            case 2:
                                verb = "bite";
                                break;
                            case 6:
                                verb = "sting";
                                break;
                            default:
                                verb = "hit";
                                break;
                        }
                        if (mon.data == game.mons[PM_SHADE] && !specialdmg) {
                            if (!strcmp(verb, "hit") || (mattk.aatyp == 1 && (((mon.data).mflags1 & 131072) != 0))) {
                                verb = "attack";
                            }
                            Your("%s %s harmlessly through %s.", verb, vtense(verb, "pass"), mon_nam(mon));
                        } else {
                            /* either not a shade or no special silver/blessed damage,
                       other unsolid monsters are immune to AT_TUCH+AD_WRAP */
                            /* can't grab unsolid creatures (checked after shade handling) */
                            if (failed_grab(game.youmonst, mon, mattk)) {
                                break;
                            }
                            if (mattk.aatyp == 16) {
                                /* miss; message already given */
                                Your("tentacles suck %s.", mon_nam(mon));
                            } else {
                                if (mattk.aatyp == 1) {
                                    verb = "hit";
                                }
                                You("%s %s.", verb, mon_nam(mon));
                                if (silverhit && game.flags.verbose) {
                                    silver_sears(game.youmonst, mon, silverhit);
                                }
                            }
                            sum[i] = damageum(mon, mattk, specialdmg);
                        }
                    } else {
                        missum(mon, mattk, (tmp + armorpenalty > dieroll));
                    }
                    break;
                case 7:
{
                        let specialdmg = 0;
                        let silverhit = 0;
                        let byhand = ((game.mons[game.u.umonnum]) == game.mons[PM_ROPE_GOLEM]);
                        let unconcerned = (byhand && !can_be_strangled(mon));
                        if (sticks(mon.data) || game.u.uswallow || game.notonhead || (byhand && (game.uwep || !(((mon.data).mflags1 & 32768) == 0)))) {
                            /* can't hold a holder due to subsequent ambiguity over
                   who is holding whom; can't hug engulfer from inside;
                   can't hug a worm tail (would immobilize entire worm!);
                   byhand: can't choke something that lacks a head;
                   not allowed to make a choking hug if wielding a weapon
                   (but might have grabbed w/o weapon, then wielded one,
                   and may even be attacking a different monster now) */
                            if (byhand && game.uwep && game.u.ustuck && !(sticks(game.u.ustuck.data) || game.u.uswallow)) {
                                uunstick();
                            }
                            /* not 'break'; bypass passive counter-attack */
                            continue;
                        }
                        /* automatic if prev two attacks succeed, or if
               already grabbed in a previous attack */
                        dhit = 1;
                        wakeup(mon, (1));
                        /* choking hug/throttling grab uses hands (gloves or rings);
               normal hug uses outermost of cloak/suit/shirt */
                        specialdmg = special_dmgval(game.youmonst, mon, byhand ? (16 | 131072 | 262144) : (2 | 1 | 64), { get value() { return silverhit; }, set value(_v) { silverhit = _v; } });
                        if (unconcerned) {
                            if (mattk != alt_attk) {
                                /* strangling something which can't be strangled */
                                Object.assign(alt_attk, mattk);
                                mattk = alt_attk;
                            }
                            /* change damage to 1d1; not strangling but still
                   doing [minimal] physical damage to victim's body */
                            mattk.damn = mattk.damd = 1;
                            /* don't give 'unconcerned' feedback if there is extra damage
                   or if it is nearly destroyed or if creature doesn't have
                   the mental ability to be concerned in the first place */
                            if (specialdmg || (((mon.data).mflags1 & 65536) != 0) || mon.mhp <= 1 + ((game.u.udaminc) > (1) ? (game.u.udaminc) : (1))) {
                                unconcerned = (0);
                            }
                        }
                        if (mon.data == game.mons[PM_SHADE]) {
                            let verb = byhand ? "grasp" : "hug";
                            if (specialdmg) {
                                /* hugging a shade; successful if blessed outermost armor
                   for normal hug, or blessed gloves or silver ring(s) for
                   choking hug; deals damage but never grabs hold */
                                You("%s %s%s", verb, mon_nam(mon), exclam(specialdmg));
                                if (silverhit && game.flags.verbose) {
                                    silver_sears(game.youmonst, mon, silverhit);
                                }
                                sum[i] = damageum(mon, mattk, specialdmg);
                            } else {
                                Your("%s passes harmlessly through %s.", verb, mon_nam(mon));
                            }
                            break;
                        }
                        if (failed_grab(game.youmonst, mon, mattk)) {
                            break;
                        }
                        if (mon == game.u.ustuck) {
                            /* hug attack against ordinary foe */
                            pline("%s is being %s%s.", Monnam(mon), byhand ? "throttled" : "crushed", unconcerned ? " but doesn't seem concerned" : "");
                            if (silverhit && game.flags.verbose) {
                                silver_sears(game.youmonst, mon, silverhit);
                            }
                            sum[i] = damageum(mon, mattk, specialdmg);
                        } else if (i >= 2 && (sum[i - 1] > 0) && (sum[i - 2] > 0)) {
                            /* extra feedback for non-breather being choked */
                            /* in case we're hugging a new target while already
                   holding something else; yields feedback
                   "<u.ustuck> is no longer in your clutches" */
                            if (game.u.ustuck && game.u.ustuck != mon) {
                                uunstick();
                            }
                            You("grab %s!", mon_nam(mon));
                            set_ustuck(mon);
                            if (silverhit && game.flags.verbose) {
                                silver_sears(game.youmonst, mon, silverhit);
                            }
                            sum[i] = damageum(mon, mattk, specialdmg);
                        }
                        break;
                    }
                /* automatic hit if next to */
                case 13:
                    dhit = -1;
                    wakeup(mon, (1));
                    You("explode!");
                    sum[i] = explum(mon, mattk);
                    break;
                case 11:
                    tmp = find_roll_to_hit(mon, mattk.aatyp, null, { get value() { return attknum; }, set value(_v) { attknum = _v; } }, { get value() { return armorpenalty; }, set value(_v) { armorpenalty = _v; } });
                    mon_maybe_unparalyze(mon);
                    if ((dhit = (tmp > rnd(20 + i)))) {
                        wakeup(mon, (1));
                        if (mon.data == game.mons[PM_SHADE]) {
                            /* can't engulf unsolid creatures */
                            /* no specialdmg check needed */
                            Your("attempt to surround %s is harmless.", mon_nam(mon));
                        } else if (failed_grab(game.youmonst, mon, mattk)) {
                            ;
                        } else {
                            sum[i] = gulpum(mon, mattk);
                            if (sum[i] == 2 && (mon.data.mlet == S_ZOMBIE || mon.data.mlet == S_MUMMY) && rn2(5) && !(game.u.uprops[SICK_RES].intrinsic || game.u.uprops[SICK_RES].extrinsic || defended(game.youmonst, 33))) {
                                /* non-shade miss; message already given */
                                You_feel("%ssick.", (game.u.uprops[SICK].intrinsic) ? "very " : "");
                                mdamageu(mon, rnd(8));
                            }
                        }
                    } else {
                        missum(mon, mattk, (0));
                    }
                    break;
                case 255:
                    if ((game.youmonst.data.mlet == S_KOBOLD || game.youmonst.data.mlet == S_ORC || game.youmonst.data.mlet == S_GNOME) && !weapon_used) {
                        const __r = __use_weapon_attack();
                        if (__r === 'continue_for') continue;
                        if (__r === 'break_passivedone') break passivedone;
                        break;
                    }
                    ;
                case 0:
                case 14:
                    continue;
                /* Not break--avoid passive attacks from enemy */
                /* specifically yellow mold */
                case 12:
                case 10:
                case 15:
                    dhit = 0;
                    break;
                default:
                    impossible("strange attack of yours (%d)", mattk.aatyp);
            }
            if (dhit == -1) {
                /* dead in the current form */
                game.u.mh = -1;
                rehumanize();
            }
            if (sum[i] == 2) {
                passive(mon, weapon, 1, 0, mattk.aatyp, (0));
            } else {
                passive(mon, weapon, (sum[i] != 0), 1, mattk.aatyp, (0));
            }
            if (mhitm_knockback(game.youmonst, mon, mattk, { get value() { return sum[i]; }, set value(_v) { sum[i] = _v; } }, weapon_used)) {
                break;
            }
        }
        if (game.uswapwep && weapon == game.uswapwep && weapon.cursed) {
            /* don't use sum[i] beyond this point;
           'i' will be out of bounds if we get here via 'goto' */
            /* when using dual weapons, cursed secondary weapon doesn't weld,
           it gets dropped; do the same when multiple AT_WEAP attacks
           simulate twoweap */
            drop_uswapwep();
            break;
        }
        /* stop attacking if defender has died;
           needed to defer this until after uswapwep->cursed check */
        if (((mon).mhp < 1)) {
            break;
        }
        if (!(game.u.umonnum != game.u.umonster)) {
            break;
        }
        /* No extra attacks if no longer a monster */
        if (game.multi < 0) {
            break;
        }
    }
    game.vis = (0);
    game.twohits = 0;
    /* return value isn't used, but make it match hitum()'s */
    return !((mon).mhp < 1);
}
/*      Special (passive) attacks on you by monsters done here.
 */
/* uwep or uswapwep or uarmg or uarmf or Null */
export function passive(mon, weapon, mhitb, maliveb, aatyp, wep_was_destroyed) {
    let ptr = mon.data;
    let i = 0;
    let tmp = 0;
    let mhit = mhitb ? 1 : 0;
    let malive = maliveb ? 1 : 0;
    for (i = 0; ; i++) {
        if (i >= 6) {
            return (malive | mhit);
        }
        if (ptr.mattk[i].aatyp == 0) {
            break;
        }
    }
    if (ptr.mattk[i].damn) {
        tmp = d(ptr.mattk[i].damn, ptr.mattk[i].damd);
    } else if (ptr.mattk[i].damd) {
        tmp = d(mon.m_lev + 1, ptr.mattk[i].damd);
    /* Note: tmp not always used */
    } else {
        tmp = 0;
    }
    switch (ptr.mattk[i].adtyp) {
        case 2:
            if (mhitb && !mon.mcan && weapon) {
                if (aatyp == 3) {
                    /*  These affect you even if they just died.
     */
                    if (game.uarmf && !rn2(6)) {
                        erode_obj(game.uarmf, xname(game.uarmf), 0, 1 | 4);
                    }
                } else if (aatyp == 254 || aatyp == 1 || aatyp == 255 || aatyp == 5) {
                    passive_obj(mon, weapon, (ptr.mattk[i]));
                }
            }
            break;
        case 8:
            if (mhitb && rn2(2)) {
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || !game.flags.verbose) {
                    You("are splashed!");
                } else {
                    You("are splashed by %s %s!", s_suffix(mon_nam(mon)), hliquid("acid"));
                }
                if (!(game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
                    mdamageu(mon, tmp);
                    monstunseesu(M_SEEN_ACID);
                } else {
                    monstseesu(M_SEEN_ACID);
                }
                if (!rn2(30)) {
                    erode_armor(game.youmonst, 3);
                }
            }
            if (mhitb && weapon) {
                if (aatyp == 3) {
                    if (game.uarmf && !rn2(6)) {
                        erode_obj(game.uarmf, xname(game.uarmf), 3, 1 | 4);
                    }
                } else if (aatyp == 254 || aatyp == 1 || aatyp == 255 || aatyp == 5) {
                    passive_obj(mon, weapon, (ptr.mattk[i]));
                }
            }
            exercise(A_STR, (0));
            break;
        case 18:
            if (mhitb) {
                let protector = attk_protection(aatyp);
                /* hero using monsters' AT_MAGC attack is hitting hand to
               hand rather than casting a spell */
                if (aatyp == 255) {
                    protector = 16;
                }
                if (protector == 0 || (protector == 16 && !game.uarmg && !game.uwep && !wep_was_destroyed) || (protector == 32 && !game.uarmf) || (protector == 4 && !game.uarmh) || (protector == (2 | 16) && (!game.uarmc || !game.uarmg))) {
                    if (!(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM))) {
                        done_in_by(mon, STONING);
                        return 2;
                    }
                }
            }
            break;
        case 24:
            if (mhitb && !mon.mcan && weapon) {
                if (aatyp == 3) {
                    if (game.uarmf) {
                        erode_obj(game.uarmf, xname(game.uarmf), 1, 1 | 4);
                    }
                } else if (aatyp == 254 || aatyp == 1 || aatyp == 255 || aatyp == 5) {
                    passive_obj(mon, weapon, (ptr.mattk[i]));
                }
            }
            break;
        case 42:
            if (mhitb && !mon.mcan && weapon) {
                if (aatyp == 3) {
                    if (game.uarmf) {
                        erode_obj(game.uarmf, xname(game.uarmf), 3, 1 | 4);
                    }
                } else if (aatyp == 254 || aatyp == 1 || aatyp == 255 || aatyp == 5) {
                    passive_obj(mon, weapon, (ptr.mattk[i]));
                }
            }
            break;
        case 1:
            if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                shieldeff(game.u.ux, game.u.uy);
                monstseesu(M_SEEN_MAGR);
                pline("A hail of magic missiles narrowly misses you!");
            } else {
                You("are hit by magic missiles appearing from thin air!");
                mdamageu(mon, tmp);
                monstunseesu(M_SEEN_MAGR);
            }
            break;
        case 41:
            if (mhitb) {
                if (aatyp == 3) {
                    /* KMH -- remove enchantment (disenchanter) */
                    if (!weapon) {
                        break;
                    }
                } else if (aatyp == 2 || aatyp == 4 || (aatyp >= 6 && aatyp < 254)) {
                    break;
                } else {
                    ;
                }
                passive_obj(mon, weapon, (ptr.mattk[i]));
            }
            break;
        default:
            break;
    }
    if (malive && !mon.mcan && rn2(3)) {
        switch (ptr.mattk[i].adtyp) {
            case 14:
                if (ptr == game.mons[PM_FLOATING_EYE]) {
                    if (!canseemon(mon)) {
                        break;
                    }
                    if (mon.mcansee) {
                        if (ureflects("%s gaze is reflected by your %s.", s_suffix(Monnam(mon)))) {
                            ;
                        } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && rn2(4)) {
                            /* [it's the hero who should be getting paralyzed
                           and isn't; this message describes the monster's
                           reaction rather than the hero's escape] */
                            pline("%s looks %s%s.", Monnam(mon), !rn2(2) ? "" : "rather ", !rn2(2) ? "numb" : "stupefied");
                        } else if (game.u.uprops[FREE_ACTION].extrinsic) {
                            You("momentarily stiffen under %s gaze!", s_suffix(mon_nam(mon)));
                        } else {
                            You("are frozen by %s gaze!", s_suffix(mon_nam(mon)));
                            nomul(((acurr(A_WIS)) > 12 || rn2(4)) ? -tmp : -127);
                            /* set gm.multi_reason;
                           3.6.x used "frozen by a monster's gaze" */
                            dynamic_multi_reason(mon, "frozen", (1));
                            game.nomovemsg = null;
                        }
                    } else {
                        pline("%s cannot defend itself.", Adjmonnam(mon, "blind"));
                        if (!rn2(500)) {
                            change_luck(-1);
                        }
                    }
                } else if (game.u.uprops[FREE_ACTION].extrinsic) {
                    You("momentarily stiffen.");
                } else {
                    You("are frozen by %s!", mon_nam(mon));
                    game.nomovemsg = c_common_strings.c_You_can_move_again;
                    nomul(-tmp);
                    /* set gm.multi_reason;
                   3.6.x used "frozen by a monster"; be more specific */
                    dynamic_multi_reason(mon, "frozen", (0));
                    exercise(A_DEX, (0));
                }
                break;
            case 3:
                if (monnear(mon, game.u.ux, game.u.uy)) {
                    if ((game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic)) {
                        /* brown mold or blue jelly */
                        shieldeff(game.u.ux, game.u.uy);
                        You_feel("a mild chill.");
                        monstseesu(M_SEEN_COLD);
                        ugolemeffects(3, tmp);
                        break;
                    }
                    monstunseesu(M_SEEN_COLD);
                    You("are suddenly very cold!");
                    mdamageu(mon, tmp);
                    /* monster gets stronger with your heat! */
                    healmon(mon, Math.trunc((tmp + rn2(2)) / 2), Math.trunc((tmp + 1) / 2));
                    /* at a certain point, the monster will reproduce! */
                    if (mon.mhpmax > ((mon.m_lev) + 1) * 8) {
                        split_mon(mon, game.youmonst);
                    }
                }
                break;
            case 12:
                if (!game.u.uprops[STUNNED].intrinsic) {
                    make_stunned(tmp, (1));
                }
                break;
            case 2:
                if (monnear(mon, game.u.ux, game.u.uy)) {
                    if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                        shieldeff(game.u.ux, game.u.uy);
                        You_feel("mildly warm.");
                        monstseesu(M_SEEN_FIRE);
                        ugolemeffects(2, tmp);
                        break;
                    }
                    monstunseesu(M_SEEN_FIRE);
                    You("are suddenly very hot!");
                    mdamageu(mon, tmp);
                }
                break;
            case 6:
                if ((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
                    shieldeff(game.u.ux, game.u.uy);
                    You_feel("a mild tingle.");
                    monstseesu(M_SEEN_ELEC);
                    ugolemeffects(6, tmp);
                    break;
                }
                monstunseesu(M_SEEN_ELEC);
                You("are jolted with electricity!");
                mdamageu(mon, tmp);
                break;
            default:
                break;
        }
    }
    return (malive | mhit);
}
/*
 * Special (passive) attacks on an attacking object by monsters done here.
 * Assumes the attack was successful.
 */
/* null means pick uwep, uswapwep or uarmg */
/* null means we find one internally */
export function passive_obj(mon, obj, mattk) {
    let ptr = mon.data;
    let i = 0;
    if (!obj) {
        /* [this first bit is obsolete; we're not called with Null anymore] */
        /* if caller hasn't specified an object, use uwep, uswapwep or uarmg */
        obj = (game.u.twoweap && game.uswapwep && !rn2(2)) ? game.uswapwep : game.uwep;
        if (!obj && mattk.adtyp == 41) {
            obj = game.uarmg;
        }
        /* no weapon? then must be gloves */
        if (!obj) {
            return;
        }
    }
    if (!mattk) {
        for (i = 0; ; i++) {
            /* if caller hasn't specified an attack, find one */
            if (i >= 6) {
                return;
            }
            if (ptr.mattk[i].aatyp == 0) {
                break;
            }
        }
        mattk = (ptr.mattk[i]);
    }
    switch (mattk.adtyp) {
        case 2:
            if (!rn2(6) && !mon.mcan && mon.data != game.mons[PM_STEAM_VORTEX]) {
                /* steam vortex: fire resist applies, fire damage doesn't */
                erode_obj(obj, null, 0, 0);
            }
            break;
        case 8:
            if (!rn2(6)) {
                erode_obj(obj, null, 3, 1);
            }
            break;
        case 24:
            if (!mon.mcan) {
                erode_obj(obj, null, 1, 1);
            }
            break;
        case 42:
            if (!mon.mcan) {
                erode_obj(obj, null, 3, 1);
            }
            break;
        case 41:
            if (!mon.mcan) {
                if (drain_item(obj, (1)) && ((obj).where == 3) && (obj.known || obj.oclass == ARMOR_CLASS)) {
                    pline("%s less effective.", Yobjnam2(obj, "seem"));
                }
                break;
            }
            ;
        default:
            break;
    }
    if (((obj).where == 3)) {
        update_inventory();
    }
}
/* used by stumble_onto_mimic() and bhitm() cases WAN_LOCKING, WAN_OPENING */
/* a hidden mimic (nonnull) */
/* 0, MIM_REVEAL, MIM_OMIT_WAIT, REVEAL+OMIT */
let __that_is_a_mimic_generic = "a monster";
export function that_is_a_mimic(mtmp, mimic_flags) {
    let fmtbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let what = null;
    let reveal_it = (mimic_flags & 1) != 0;
    let omit_wait = (mimic_flags & 2) != 0;
    fmtbuf = strcpy(fmtbuf, "Wait!  That's %s!");
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        if (!(game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic)) {
            what = __that_is_a_mimic_generic;
        /* cloned Wiz starts out mimicking some other monster and
           might make himself invisible before being revealed */
        /* BUG: this will misclassify a paralyzed mimic as sleeping */
        } else if (((mtmp).m_ap_type & 7) == M_AP_MONSTER) {
            what = a_monnam(mtmp);
        }
    } else {
        let x = mtmp.mx;
        let y = mtmp.my;
        let glyph = glyph_at(x, y);
        if (((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1)))) {
            /* differs from what was sensed */
            let sym = glyph_to_cmap(glyph);
            if (((mtmp).m_ap_type & 7) == M_AP_FURNITURE || (((mtmp).m_ap_type & 7) == M_AP_OBJECT && sym == S_trapped_chest)) {
                nh_snprintf("that_is_a_mimic", 6227, fmtbuf, 256 /* sizeof(char [256]) */, "That %s actually is %%s!", defsyms[sym].explanation);
            }
        } else if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
            let fakeobj = 0;
            let otmp_name = null;
            let otmp = null;
            fakeobj = object_from_map(glyph, x, y, { get value() { return otmp; }, set value(_v) { otmp = _v; } });
            otmp_name = (otmp && otmp.otyp != STRANGE_OBJECT) ? simpleonames(otmp) : "strange object";
            nh_snprintf("that_is_a_mimic", 6238, fmtbuf, 256 /* sizeof(char [256]) */, "%s %s %s %%s!", (otmp && ((otmp).quan != 1 || ((otmp).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD)))) ? "Those" : "That", otmp_name, otmp ? otense(otmp, "are") : "is");
            if (fakeobj && otmp) {
                /* object_from_map set to OBJ_FLOOR */
                otmp.where = 0;
                dealloc_obj(otmp);
            }
        } else if (((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS))))) {
            let mtmp_name = null;
            let mndx = (((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_FEM_OFF) : ((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_MALE_OFF) : ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_FEM_OFF) : ((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_MALE_OFF) : ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_FEM_OFF) : ((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_MALE_OFF) : ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_FEM_OFF) : ((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_MALE_OFF) : NUMMONS);
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            mtmp_name = pmname(game.mons[mndx], Mgender(mtmp));
            nh_snprintf("that_is_a_mimic", 6250, fmtbuf, 256 /* sizeof(char [256]) */, "Wait!  That %s is really %%s!", mtmp_name);
        }
        if (mtmp.minvis && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
            what = __that_is_a_mimic_generic;
        } else if (((mtmp).m_ap_type & 7) == M_AP_MONSTER) {
            what = x_monnam(mtmp, 2, (null), 31, (1));
        } else if (mtmp.data.mlet == S_MIMIC && (((mtmp).m_ap_type & 7) == M_AP_OBJECT || ((mtmp).m_ap_type & 7) == M_AP_FURNITURE) && (mtmp.msleeping || mtmp.mfrozen)) {
            what = x_monnam(mtmp, 2, "sleeping", 0, (0));
        } else {
            what = a_monnam(mtmp);
        }
    }
    if (what) {
        let i = (omit_wait && !strncmp(fmtbuf, "Wait!  ", 7)) ? 7 : 0;
        pline({ get value() { return fmtbuf[i]; }, set value(_v) { fmtbuf[i] = _v; } }, what);
    }
    if (reveal_it) {
        seemimic(mtmp);
    }
}
/* Note: caller must ascertain mtmp is mimicking... */
export function stumble_onto_mimic(mtmp) {
    that_is_a_mimic(mtmp, 1);
    if (!game.u.ustuck && !mtmp.mflee && dmgtype(mtmp.data, 19) && (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
        set_ustuck(mtmp);
    }
    wakeup(mtmp, (0));
    /* if hero is blind, wakeup() won't display the monster even though
       it's no longer concealed */
    if (!(canseemon(mtmp) || sensemon(mtmp)) && !((game.level.locations[mtmp.mx][mtmp.my].glyph) == GLYPH_INVIS_OFF)) {
        map_invisible(mtmp.mx, mtmp.my);
    }
}
export function disguised_as_non_mon(mtmp) {
    return (!sensemon(mtmp) && ((mtmp).m_ap_type & 7) && ((mtmp).m_ap_type & 7) != M_AP_MONSTER);
}
export function disguised_as_mon(mtmp) {
    return (((mtmp).m_ap_type & 7) && ((mtmp).m_ap_type & 7) == M_AP_MONSTER);
}
export function nohandglow(mon) {
    let hands = null;
    let altfeedback = 0;
    if (!game.u.umconf || mon.mconf) {
        return;
    }
    hands = makeplural(body_part(HAND));
    /* Invisible == Invis && !See_invis */
    altfeedback = (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)));
    if (game.u.umconf == 1) {
        if (altfeedback) {
            Your("%s stop tingling.", hands);
        } else {
            Your("%s stop glowing %s.", hands, hcolor(c_color_names.c_red));
        }
    } else {
        if (altfeedback) {
            pline_The("tingling in your %s lessens.", hands);
        } else {
            Your("%s no longer glow so brightly %s.", hands, hcolor(c_color_names.c_red));
        }
    }
    game.u.umconf--;
}
/* returns 1 if light flash has noticeable effect on 'mtmp', 0 otherwise */
/* source of flash */
export function flash_hits_mon(mtmp, otmp) {
    let lev = null;
    let mx = mtmp.mx;
    let my = mtmp.my;
    let tmp = 0;
    let amt = 0;
    let useeit = 0;
    let res = 0;
    if (game.notonhead) {
        return 0;
    }
    lev = game.level.locations[mx][my];
    useeit = canseemon(mtmp);
    if (((mtmp).m_ap_type & 7) != M_AP_NOTHING) {
        let whatbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let oldglyph = glyph_at(mx, my);
        /* 'altmon' probably doesn't matter here because 'whatbuf' will
           only be shown if the glyph changes and wakeup() doesn't call
           seemimic() for M_AP_MONSTER */
        mhidden_description(mtmp, 4, whatbuf);
        /* -> seemimic() -> newsym(); also calls
                              * finish_meating() to end quickmimic */
        wakeup(mtmp, (0));
        if (glyph_at(mx, my) != oldglyph) {
            /* if glyph has changed then hero saw something happen */
            pline("That %s is really %s%c", whatbuf, x_monnam(mtmp, mtmp.mtame ? 3 : 2, null, 0, (0)), mtmp.mtame ? 46 : 33);
            res = 1;
        }
    }
    if (mtmp.msleeping && (((mtmp.data).mflags1 & 4096) == 0)) {
        mtmp.msleeping = 0;
        if (useeit) {
            pline_The("flash awakens %s.", mon_nam(mtmp));
            res = 1;
        }
    } else if (mtmp.data.mlet != S_LIGHT) {
        if (!resists_blnd(mtmp)) {
            tmp = dist2(otmp.ox, otmp.oy, mx, my);
            if (useeit) {
                pline("%s is blinded by the flash!", Monnam(mtmp));
                res = 1;
            }
            if (mtmp.data == game.mons[PM_GREMLIN]) {
                /* Rule #1: Keep them out of the light. */
                amt = (otmp.otyp == WAN_LIGHT) ? d(1 + otmp.spe, 4) : rnd(((mtmp.mhp) < (4) ? (mtmp.mhp) : (4)));
                light_hits_gremlin(mtmp, amt);
            }
            if (!((mtmp).mhp < 1)) {
                if (!game.context.mon_moving) {
                    setmangry(mtmp, (1));
                }
                if (tmp < 9 && !mtmp.isshk && rn2(4)) {
                    monflee(mtmp, rn2(4) ? rnd(100) : 0, (0), (1));
                }
                mtmp.mcansee = 0;
                mtmp.mblinded = (tmp < 3) ? 0 : rnd(1 + Math.trunc(50 / tmp));
            }
        } else if (useeit) {
            if (resists_blnd_by_arti(mtmp)) {
                shieldeff(mx, my);
            }
            if (game.flags.verbose) {
                if (lev.lit) {
                    pline("The flash of light shines on %s.", mon_nam(mtmp));
                } else {
                    pline("%s is illuminated.", Monnam(mtmp));
                }
                /* 'message has been given' temporary value */
                res = 2;
            }
        }
    }
    if (res) {
        if (!lev.lit) {
            (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
        }
        /* change temporary 2 back to 0 */
        res &= 1;
    }
    return res;
}
export function light_hits_gremlin(mon, dmg) {
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 90) {
        /* cry of pain can be heard somewhat farther than the waking radius */
        pline_mon(mon, "%s %s!", Monnam(mon), (dmg > Math.trunc(mon.mhp / 2)) ? "wails in agony" : "cries out in pain");
    } else if (canseemon(mon)) {
        pline_mon(mon, "%s recoils from the light!", Monnam(mon));
    }
    mon.mhp -= dmg;
    wake_nearto(mon.mx, mon.my, 30);
    if (((mon).mhp < 1)) {
        if (game.context.mon_moving) {
            monkilled(mon, null, 11);
        } else {
            killed(mon);
        }
    } else if (((game.viz_array[mon.my][mon.mx] & 2) != 0) && !(canseemon(mon) || sensemon(mon))) {
        map_invisible(mon.mx, mon.my);
    }
}
/*uhitm.c*/
/* uhitm; hero can't polymorph into anything with this attack
           so this won't happen; if it could, it would be the same as
           the mhitm case except for messaging */
/* may die from the acid if it eats a stone-curing corpse */
/* uhitm; hero can't polymorph into anything with this attack so
           this won't happen; if it could, it would be the same as the
           mhitm case except for messaging */
/* else does ordinary damage */
/* see case AT_CLAW,AT_TUCH below */
/* if we've already hit with a two-handed weapon, we don't
               get to make another weapon attack (note:  monsters who
               use weapons do not have this restriction, but they also
               never have the opportunity to use two weapons) */
/* Certain monsters don't use weapons when encountered as enemies,
             * but players who polymorph into them have hands or claws and
             * thus should be able to use weapons.  This shouldn't prohibit
             * the use of most special abilities, either.
             * If monster has multiple claw attacks, only one can use weapon.
             */
/* Potential problem: if the monster gets multiple weapon attacks,
             * we currently allow the player to get each of these as a weapon
             * attack.  Is this really desirable?
             */
/* approximate two-weapon mode; known_hitum() -> hmon() -> &c
               might destroy the weapon argument, but it might also already
               be Null, and we want to track that for passive() */
/* set up 'altwep' flag for next iteration */
/* no need to go beyond no-gloves to rings; not ...*/
/*... subject to erosion damage */
/* caller must set gb.bhitpos */
/* originalweapon points to an equipment slot which might
               now be empty if the weapon was destroyed during the hit;
               passive(,weapon,...) won't call passive_obj() in that case */
/* might receive passive erosion */
/* only switch to uswapwep if it's a weapon */
/* only switch if uswapwep is not bow, arrows, or darts */
/* dart, shuriken, boomerang */
/* and not two-handed and not incapable of being wielded */
/* enemy dead, before any special abilities used */
/* might be a worm that gets cut in half; if so, early return */
/* proceed with uswapwep->cursed check, then exit loop */
/* Do not print "You hit" message; known_hitum already did it. */
/* verb=="claws" may be overridden below */
/* assumes mind flayer's tentacles-on-head rather
                       than sea monster's tentacle-as-arm */
/* if (!uwep) goto weaponless; */
/* only consider secondary when wielding one-handed primary */
/* only switch if not wearing shield and not at artifact;
                   shield limitation is iffy since still get extra swings
                   if polyform has them, but it matches twoweap behavior;
                   twoweap also only allows primary to be an artifact, so
                   if alternate weapon is one, don't use it */
/* No check for uwep; if wielding nothing we want to
             * do the normal 1-2 points bare hand damage...
             */
/* all done using #monster command */
/* If paralyzed while attacking, i.e. floating eye */
/*
                 * TODO:  #H2668 - if hitting with a ring that has a
                 * positive enchantment, it ought to be subject to
                 * having that enchantment reduced.  But we don't have
                 * sufficient information here to know which hand/ring
                 * has delivered a weaponless blow.
                 */
/* must be adjacent; attack via polearm could be from farther away */
