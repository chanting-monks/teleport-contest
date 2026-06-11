/* NetHack 5.0	do_wear.c	$NHDT-Date: 1737343372 2025/01/19 19:22:52 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.201 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { free } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strcmp, strcpy, strncmp, strncpy } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { artifact_light, retouch_object } from './artifact.js';
import { acurr, change_luck, extremeattr, uchangealign } from './attrib.js';
import { set_bc } from './ball.js';
import { cmdq_clear, cmdq_peek, cmdq_pop, paranoid_ynq, set_occupation, yn_function } from './cmd.js';
import { is_lava, is_pool, is_pool_or_lava } from './dbridge.js';
import { c_color_names, c_common_strings, cg, rightleftchars } from './decl.js';
import { newsym, see_monsters, set_mimic_blocking } from './display.js';
import { canletgo, dropx, trycall } from './do.js';
import { hcolor, hliquid, obj_pmname, x_monnam } from './do_name.js';
import { has_ceiling, on_level, surface } from './dungeon.js';
import { nomul, spoteffects, unmul } from './hack.js';
import { strsubst } from './hacklib.js';
import { carrying_stoning_corpse, getobj, ggetobj, is_worn, prinv, silly_thing, update_inventory, useup, wearing_armor } from './invent.js';
import { arti_light_description } from './light.js';
import { gulp_blnd_check } from './mhitu.js';
import { curse, is_flammable, is_rottable, set_bknown } from './mkobj.js';
import { rescham, restartcham } from './mon.js';
import { breakarm, can_be_strangled, num_horns, sliparm } from './mondata.js';
import { ACID_RES, AKLYS, ALCHEMY_SMOCK, AMULET_CLASS, AMULET_OF_CHANGE, AMULET_OF_ESP, AMULET_OF_FLYING, AMULET_OF_GUARDING, AMULET_OF_LIFE_SAVING, AMULET_OF_MAGICAL_BREATHING, AMULET_OF_REFLECTION, AMULET_OF_RESTFUL_SLEEP, AMULET_OF_STRANGULATION, AMULET_OF_UNCHANGING, AMULET_OF_YENDOR, AMULET_VERSUS_POISON, ARMOR_CLASS, ARM_BOOTS, ARM_CLOAK, ARM_GLOVES, ARM_HELM, ARM_SHIELD, ARM_SHIRT, ARM_SUIT, A_CG_HELM_OFF, A_CG_HELM_ON, A_CHA, A_CON, A_DEX, A_INT, A_STR, A_WIS, BATTLE_AXE, BLACK_DRAGON_SCALES, BLACK_DRAGON_SCALE_MAIL, BLINDED, BLINDFOLD, BLUE_DRAGON_SCALES, BLUE_DRAGON_SCALE_MAIL, CLOAK_OF_DISPLACEMENT, CLOAK_OF_INVISIBILITY, CLOAK_OF_MAGIC_RESISTANCE, CLOAK_OF_PROTECTION, CMDQ_KEY, COPPER, CORNUTHAUM, CORPSE, CQ_CANNED, DENTED_POT, DETECT_MONSTERS, DISPLACED, DRAIN_RES, DUNCE_CAP, DWARVISH_CLOAK, DWARVISH_IRON_HELM, DWARVISH_ROUNDSHIELD, ELVEN_BOOTS, ELVEN_CLOAK, ELVEN_LEATHER_HELM, ELVEN_SHIELD, FACE, FAKE_AMULET_OF_YENDOR, FAST, FEDORA, FINGER, FLYING, FOOT, FREE_ACTION, FUMBLE_BOOTS, FUMBLING, GAUNTLETS_OF_DEXTERITY, GAUNTLETS_OF_FUMBLING, GAUNTLETS_OF_POWER, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_EXCLUDE_INACCESS, GETOBJ_SUGGEST, GLASS, GLIB, GOLD_DRAGON_SCALES, GOLD_DRAGON_SCALE_MAIL, GRAY_DRAGON_SCALES, GREEN_DRAGON_SCALES, GREEN_DRAGON_SCALE_MAIL, HALLUC, HALLUC_RES, HAND, HAWAIIAN_SHIRT, HEAD, HELMET, HELM_OF_BRILLIANCE, HELM_OF_CAUTION, HELM_OF_OPPOSITE_ALIGNMENT, HELM_OF_TELEPATHY, HIGH_BOOTS, INFRAVISION, INVIS, IRON, IRON_SHOES, JUMPING_BOOTS, KICKING_BOOTS, LARGE_SHIELD, LEATHER, LEATHER_CLOAK, LEATHER_GLOVES, LEG, LENSES, LEVITATION, LEVITATION_BOOTS, LOW_BOOTS, MAGICAL_BREATHING, MEAT_RING, MITHRIL, MUMMY_WRAPPING, NECK, OILSKIN_CLOAK, ORANGE_DRAGON_SCALES, ORANGE_DRAGON_SCALE_MAIL, ORCISH_CLOAK, ORCISH_HELM, ORCISH_SHIELD, PM_ARCHEOLOGIST, PM_CHICKATRICE, PM_CLERIC, PM_COCKATRICE, PM_MARILITH, PM_WINGED_GARGOYLE, PM_WIZARD, PROTECTION, PROT_FROM_SHAPE_CHANGERS, P_SABER, P_SHORT_SWORD, RED_DRAGON_SCALES, RED_DRAGON_SCALE_MAIL, RING_CLASS, RIN_ADORNMENT, RIN_AGGRAVATE_MONSTER, RIN_COLD_RESISTANCE, RIN_CONFLICT, RIN_FIRE_RESISTANCE, RIN_FREE_ACTION, RIN_GAIN_CONSTITUTION, RIN_GAIN_STRENGTH, RIN_HUNGER, RIN_INCREASE_ACCURACY, RIN_INCREASE_DAMAGE, RIN_INVISIBILITY, RIN_LEVITATION, RIN_POISON_RESISTANCE, RIN_POLYMORPH, RIN_POLYMORPH_CONTROL, RIN_PROTECTION, RIN_PROTECTION_FROM_SHAPE_CHAN, RIN_REGENERATION, RIN_SEARCHING, RIN_SEE_INVISIBLE, RIN_SHOCK_RESISTANCE, RIN_SLOW_DIGESTION, RIN_STEALTH, RIN_SUSTAIN_ABILITY, RIN_TELEPORTATION, RIN_TELEPORT_CONTROL, RIN_WARNING, ROBE, RUBBER_HOSE, SEE_INVIS, SHIELD_OF_DRAIN_RESISTANCE, SHIELD_OF_REFLECTION, SHIELD_OF_SHOCK_RESISTANCE, SICK_RES, SLEEPY, SLIMED, SLOW_DIGESTION, SMALL_SHIELD, SPEED_BOOTS, STEALTH, STONE_RES, STRANGLED, SWIMMING, S_CENTAUR, S_GHOST, TELEPAT, TOOL_CLASS, TOWEL, TT_BEARTRAP, TT_BURIEDBALL, TT_INFLOOR, TT_LAVA, T_SHIRT, UNCHANGING, URUK_HAI_SHIELD, WATER_WALKING_BOOTS, WEAPON_CLASS, WHITE_DRAGON_SCALES, WHITE_DRAGON_SCALE_MAIL, YELLOW_DRAGON_SCALES, YELLOW_DRAGON_SCALE_MAIL, bl_bareh, st_corpse, st_petrifies } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { Tobjnam, Yname2, an, ansimpleoname, boots_simple_name, cloak_simple_name, corpse_xname, doname, erosion_matters, gloves_simple_name, helm_simple_name, killer_xname, makeplural, makesingular, obj_is_pname, otense, safe_typename, shield_simple_name, shirt_simple_name, simpleonames, suit_simple_name, the, thesimpleoname, vtense, xname, yname } from './objnam.js';
import { add_valid_menu_class, encumber_msg, is_worn_by_type, menu_class_present, query_category, query_objlist, u_safe_from_fatal_corpse } from './pickup.js';
import { There, urgent_pline } from './pline.js';
import { body_part, change_sex, float_vs_flight, livelog_newform, poly_gender } from './polyself.js';
import { incr_itimeout, make_glib, make_hallucinated, make_slimed, self_invis_message, toggle_blindness } from './potion.js';
import { region_danger } from './region.js';
import { rn2, rnd } from './rnd.js';
import { shk_your } from './shk.js';
import { remove_worn_item } from './steal.js';
import { begin_burn, end_burn } from './timeout.js';
import { drown, erode_obj, float_down, float_up, instapetrify, selftouch } from './trap.js';
import { weapon_descr } from './weapon.js';
import { empty_handed, setuqwep, setuswapwep, setuwep, welded } from './wield.js';
import { racial_exception, setnotworn, setworn, which_armor } from './worn.js';
import { obj_resists } from './zap.js';

const see_yourself = "see yourself";
const unknown_type = "Unknown type of %s (%d)";
const c_armor = "armor";
const c_suit = "suit";
const c_shirt = "shirt";
const c_cloak = "cloak";
const c_gloves = "gloves";
const c_boots = "boots";
const c_helmet = "helmet";
const c_shield = "shield";
const c_weapon = "weapon";
const c_sword = "sword";
const c_axe = "axe";
const c_that_ = "that";
const takeoff_order = [524288, 256, 8, 16, 131072, 262144, 2, 4, 65536, 1, 64, 32, 1024, 512, 0];
/* int Boots_on(void); -- moved to extern.h */
/* maybe_destroy_armor() may return NULL */
/* plural "fingers" or optionally "gloves" */
export function fingers_or_gloves(check_gloves) {
    return ((check_gloves && game.uarmg) ? gloves_simple_name(game.uarmg) : makeplural(body_part(FINGER)));
}
export function off_msg(otmp) {
    if (game.flags.verbose) {
        You("were wearing %s.", doname(otmp));
    }
}
/* for items that involve no delay */
export function on_msg(otmp) {
    if ((otmp.owornmask & ((131072 | 262144) | 65536)) != 0 || ((otmp.owornmask & 524288) != 0 && !game.flags.verbose)) {
        /* on_msg() for rings and amulets just shows add-to-invent feedback
       [after caller calls setworn(), for suffix: "(on {left|right} hand)"
       or "(being worn)"]; eyewear too unless giving verbose message below */
        prinv((null), otmp, 0);
        return;
    }
    if (game.flags.verbose) {
        let how = '';
        /* call xname() before obj_is_pname(); formatting obj's name
           might set obj->dknown and that affects the pname test */
        let otmp_name = xname(otmp);
        how = '';
        if (otmp.otyp == TOWEL) {
            how = sprintf(how, " around your %s", body_part(HEAD));
        }
        You("are now wearing %s%s.", obj_is_pname(otmp) ? the(otmp_name) : an(otmp_name), how);
    }
}
/* putting on or taking off an item which confers stealth;
   give feedback and discover it iff stealth state is changing;
   stealth is blocked by riding unless hero+steed fly (handled with
   BStealth by mount and dismount routines) */
/* prop[].extrinsic, with obj->owornmask pre-stripped */
export function toggle_stealth(obj, oldprop, on) {
    if (on ? game.initial_don : game.context.takeoff.cancelled_don) {
        return;
    }
    if (!oldprop && !game.u.uprops[STEALTH].intrinsic && !game.u.uprops[STEALTH].blocked) {
        /* extrinsic stealth from something else */
        /* stealth blocked by something */
        if (obj.otyp == RIN_STEALTH) {
            learnring(obj, (1));
        } else {
            discover_object((obj.otyp), (1), (1), (1));
        }
        if (on) {
            if (!(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_BOOTS)) {
                You("move very quietly.");
            } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
                You("float imperceptibly.");
            /* discover elven cloak or elven boots */
            } else {
                You("walk very quietly.");
            }
        } else {
            let riding = (game.u.usteed != (null));
            You("%s%s are noisy.", riding ? "and " : "sure", riding ? x_monnam(game.u.usteed, 3, (null), (8 | 4), (0)) : "");
        }
    }
}
/* putting on or taking off an item which confers displacement, or gaining
   or losing timed displacement after eating a displacer beast corpse or tin;
   give feedback and discover it iff displacement state is changing *and*
   hero is able to see self (or sense monsters); for timed, 'obj' is Null
   and this is only called for the message */
/* prop[].extrinsic, with obj->owornmask
                     stripped by caller */
export function toggle_displacement(obj, oldprop, on) {
    if (on ? game.initial_don : game.context.takeoff.cancelled_don) {
        return;
    }
    if (!oldprop && !(game.u.uprops[DISPLACED].intrinsic) && !(game.u.uprops[DISPLACED].blocked) && ((!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !game.u.uswallow && !(((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic))) || ((game.u.uprops[TELEPAT].extrinsic) || ((game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic) && ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) || (game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic)))) {
        /* extrinsic displacement from something else */
        /* we don't use canseeself() here because it augments vision
           with touch, which isn't appropriate for deciding whether
           we'll notice that monsters have trouble spotting the hero */
        /* actively sensing nearby monsters via telepathy or extended
               monster detection overrides vision considerations because
               hero also senses self in this situation */
        if (obj) {
            discover_object((obj.otyp), (1), (1), (1));
        }
        You_feel("that monsters%s have difficulty pinpointing your location.", on ? "" : " no longer");
    }
}
/*
 * The Type_on() functions should be called *after* setworn().
 * The Type_off() functions call setworn() themselves.
 * [Blindf_on() is an exception and calls setworn() itself.]
 */
export function Boots_on() {
    let oldprop = game.u.uprops[game.objects[game.uarmf.otyp].oc_oprop].extrinsic & ~32;
    switch (game.uarmf.otyp) {
        case LOW_BOOTS:
        case IRON_SHOES:
        case HIGH_BOOTS:
        case JUMPING_BOOTS:
        case KICKING_BOOTS:
            /* (we don't need a lava check here since boots can't be
           put on while feet are stuck) */
            break;
        case WATER_WALKING_BOOTS:
            if (game.u.uinwater) {
                /* check for lava since fireproofed boots make it viable */
                /* avoid recursive call to lava_effects() */
                /* make boots known in case you survive the drowning */
                spoteffects((1));
            }
            if (game.wasinwater) {
                /*
         * Sequencing issue?  If underwater (perhaps via magical breathing),
         * putting on water walking boots produces "you slowly rise above
         * the surface" then "you finish your dressing maneuver".
         */
                /* spoteffects() doesn't get called here; pooleffects() is called
           during movement and u.uinwater is already False after setworn() */
                /* init'd in accessory_or_armor_on() and only used here */
                if (!game.u.uinwater) {
                    discover_object((WATER_WALKING_BOOTS), (1), (1), (1));
                }
                game.wasinwater = 0;
            }
            break;
        case SPEED_BOOTS:
            if (!oldprop && !(game.u.uprops[FAST].intrinsic & 16777215)) {
                discover_object((game.uarmf.otyp), (1), (1), (1));
                /* Speed boots are still better than intrinsic speed, */
                /* though not better than potion speed */
                You_feel("yourself speed up%s.", (oldprop || game.u.uprops[FAST].intrinsic) ? " a bit more" : "");
            }
            break;
        case ELVEN_BOOTS:
            toggle_stealth(game.uarmf, oldprop, (1));
            break;
        case FUMBLE_BOOTS:
            if (!oldprop && !(game.u.uprops[FUMBLING].intrinsic & ~16777215)) {
                incr_itimeout({ get value() { return game.u.uprops[FUMBLING].intrinsic; }, set value(_v) { game.u.uprops[FUMBLING].intrinsic = _v; } }, rnd(20));
            }
            break;
        case LEVITATION_BOOTS:
            if (!oldprop && !game.u.uprops[LEVITATION].intrinsic && !(game.u.uprops[LEVITATION].blocked & 67108864)) {
                /* might come off if putting on over a sink,
                               * so uarmf could be Null below; status line
                               * gets updated during brief interval they're
                               * worn so hero and player learn enchantment */
                /* uarmf could be Null here (levitation boots put on over a sink) */
                /* boots' +/- evident because of status line AC */
                game.uarmf.known = 1;
                /* status hilites might mark AC changed */
                /* reveal new alignment or INT & WIS */
                /* taken care of in attrib.c */
                /* note: might already be Strangled (via #wizintrinsic) */
                /* for AC after zeroing u.ublessed */
                /* these could conceivably be achieved out of order (by being near
           threshold and putting on +N dragon scale mail from bones, for
           instance), but if that happens, that's the order it happened;
           also, testing for these in the usual order would result in more
           record_achievement() attempts and rejects for duplication */
                game.disp.botl = (1);
                discover_object((game.uarmf.otyp), (1), (1), (1));
                float_up();
                if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
                    spoteffects((0));
                }
            } else {
                /* maybe toggle BFlying's I_SPECIAL */
                /* maybe toggle (BFlying & I_SPECIAL) */
                /* probably not needed here */
                float_vs_flight();
            }
            break;
        default:
            impossible(unknown_type, c_boots, game.uarmf.otyp);
    }
    if (game.uarmf && !game.uarmf.known) {
        game.uarmf.known = 1;
        update_inventory();
    }
    /* The time to perform the command is already completely accounted for
     * in take_off(); if we return 1, that would add an extra turn to each
     * disrobe.
     */
    return 0;
}
export function Boots_off() {
    let otmp = game.uarmf;
    let otyp = otmp.otyp;
    let oldprop = game.u.uprops[game.objects[otyp].oc_oprop].extrinsic & ~32;
    game.context.takeoff.mask &= ~32;
    /* For levitation, float_down() returns if Levitation, so we
     * must do a setworn() _before_ the levitation case.
     */
    setworn(null, 32);
    switch (otyp) {
        case SPEED_BOOTS:
            if (!((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic) && !game.context.takeoff.cancelled_don) {
                discover_object((otyp), (1), (1), (1));
                You_feel("yourself slow down%s.", (game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic) ? " a bit" : "");
            }
            break;
        case WATER_WALKING_BOOTS:
            if ((is_pool(game.u.ux, game.u.uy) || is_lava(game.u.ux, game.u.uy)) && !((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && !((((game.youmonst.data).mflags1 & 16) != 0) && has_ceiling(game.u.uz)) && !game.context.takeoff.cancelled_don && !game.iflags.in_lava_effects) {
                discover_object((otyp), (1), (1), (1));
                spoteffects((1));
            }
            break;
        case ELVEN_BOOTS:
            toggle_stealth(otmp, oldprop, (0));
            break;
        case FUMBLE_BOOTS:
            if (!oldprop && !(game.u.uprops[FUMBLING].intrinsic & ~16777215)) {
                game.u.uprops[FUMBLING].intrinsic = game.u.uprops[FUMBLING].extrinsic = 0;
            }
            break;
        case LEVITATION_BOOTS:
            if (!oldprop && !game.u.uprops[LEVITATION].intrinsic && !(game.u.uprops[LEVITATION].blocked & 67108864) && !game.context.takeoff.cancelled_don) {
                /* lava_effects() sets in_lava_effects and calls Boots_off()
               so hero is already in midst of floating down */
                if (!game.iflags.in_lava_effects) {
                    float_down(0, 0);
                }
                discover_object((otyp), (1), (1), (1));
            } else {
                float_vs_flight();
            }
            break;
        case LOW_BOOTS:
        case IRON_SHOES:
        case HIGH_BOOTS:
        case JUMPING_BOOTS:
        case KICKING_BOOTS:
            break;
        default:
            impossible(unknown_type, c_boots, otyp);
    }
    game.context.takeoff.cancelled_don = (0);
    return 0;
}
export function Cloak_on() {
    let oldprop = game.u.uprops[game.objects[game.uarmc.otyp].oc_oprop].extrinsic & ~2;
    switch (game.uarmc.otyp) {
        case ORCISH_CLOAK:
        case DWARVISH_CLOAK:
        case CLOAK_OF_MAGIC_RESISTANCE:
        case ROBE:
        case LEATHER_CLOAK:
            break;
        case CLOAK_OF_PROTECTION:
            discover_object((game.uarmc.otyp), (1), (1), (1));
            break;
        case ELVEN_CLOAK:
            toggle_stealth(game.uarmc, oldprop, (1));
            break;
        case CLOAK_OF_DISPLACEMENT:
            toggle_displacement(game.uarmc, oldprop, (1));
            break;
        case MUMMY_WRAPPING:
            if ((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                /* Note: it's already being worn, so we have to cheat here. */
                /* since cloak of invisibility was worn, we know mummy wrapping
           wasn't, so no need to check `oldprop' against blocked */
                /* wearing a meat ring does not affect vegan conduct */
                /* can now see invisible monsters */
                newsym(game.u.ux, game.u.uy);
                You("can %s!", (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? "no longer see through yourself" : see_yourself);
            }
            break;
        case CLOAK_OF_INVISIBILITY:
            if (!oldprop && !game.u.uprops[INVIS].intrinsic && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                discover_object((game.uarmc.otyp), (1), (1), (1));
                newsym(game.u.ux, game.u.uy);
                pline("Suddenly you can%s yourself.", (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? " see through" : "not see");
            }
            break;
        case OILSKIN_CLOAK:
            pline("%s very tightly.", Tobjnam(game.uarmc, "fit"));
            break;
        /* Alchemy smock gives poison _and_ acid resistance */
        case ALCHEMY_SMOCK:
            game.u.uprops[ACID_RES].extrinsic |= 2;
            break;
        default:
            impossible(unknown_type, c_cloak, game.uarmc.otyp);
    }
    if (game.uarmc && !game.uarmc.known) {
        /* no known instance of !uarmc here */
        /* cloak's +/- evident because of status line AC */
        game.uarmc.known = 1;
        update_inventory();
    }
    return 0;
}
export function Cloak_off() {
    let otmp = game.uarmc;
    let otyp = otmp.otyp;
    let oldprop = game.u.uprops[game.objects[otyp].oc_oprop].extrinsic & ~2;
    game.context.takeoff.mask &= ~2;
    /* For mummy wrapping, taking it off first resets `Invisible'. */
    setworn(null, 2);
    switch (otyp) {
        case ORCISH_CLOAK:
        case DWARVISH_CLOAK:
        case CLOAK_OF_PROTECTION:
        case CLOAK_OF_MAGIC_RESISTANCE:
        case OILSKIN_CLOAK:
        case ROBE:
        case LEATHER_CLOAK:
            break;
        case ELVEN_CLOAK:
            toggle_stealth(otmp, oldprop, (0));
            break;
        case CLOAK_OF_DISPLACEMENT:
            toggle_displacement(otmp, oldprop, (0));
            break;
        case MUMMY_WRAPPING:
            if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                newsym(game.u.ux, game.u.uy);
                You("can %s.", (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? "see through yourself" : "no longer see yourself");
            }
            break;
        case CLOAK_OF_INVISIBILITY:
            if (!oldprop && !game.u.uprops[INVIS].intrinsic && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                discover_object((CLOAK_OF_INVISIBILITY), (1), (1), (1));
                newsym(game.u.ux, game.u.uy);
                pline("Suddenly you can %s.", (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? "no longer see through yourself" : see_yourself);
            }
            break;
        case ALCHEMY_SMOCK:
            game.u.uprops[ACID_RES].extrinsic &= ~2;
            break;
        default:
            impossible(unknown_type, c_cloak, otyp);
    }
    return 0;
}
export function Helmet_on() {
    switch (game.uarmh.otyp) {
        case FEDORA:
            if ((game.urole.mnum == (PM_ARCHEOLOGIST))) {
                change_luck(1);
            }
            break;
        case HELMET:
        case DENTED_POT:
        case ELVEN_LEATHER_HELM:
        case DWARVISH_IRON_HELM:
        case ORCISH_HELM:
        case HELM_OF_TELEPATHY:
            break;
        case HELM_OF_CAUTION:
            /* do special mimic handling */
            see_monsters();
            break;
        case HELM_OF_BRILLIANCE:
            adj_abon(game.uarmh, game.uarmh.spe);
            break;
        case CORNUTHAUM:
            (game.u.abon.a[A_CHA]) += ((game.urole.mnum == (PM_WIZARD)) ? 1 : -1);
            game.disp.botl = (1);
            discover_object((game.uarmh.otyp), (1), (1), (1));
            break;
        case HELM_OF_OPPOSITE_ALIGNMENT:
            /* uarmh could be Null due to uchangealign() */
            /* helmet's +/- evident because of status line AC */
            game.uarmh.known = 1;
            /* do this here because uarmh could get cleared */
            /* changing alignment can toggle off active artifact properties,
           including levitation; uarmh could get dropped or destroyed here
           by hero falling onto a polymorph trap or into water (emergency
           disrobe) or maybe lava (probably not, helm isn't 'organic') */
            uchangealign((game.u.ualign.type != 0) ? -game.u.ualign.type : (game.uarmh.o_id % 2) ? (-1) : 1, A_CG_HELM_ON);
            ;
        case DUNCE_CAP:
            if (game.uarmh && !game.uarmh.cursed) {
                /* curse() doesn't touch bknown so doesn't update persistent
               inventory; do so now [set_bknown() calls update_inventory()] */
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    pline("%s for a moment.", Tobjnam(game.uarmh, "vibrate"));
                /* people think marked wizards know what they're talking about,
           but it takes trained arrogance to pull it off, and the actual
           enchantment of the hat is irrelevant */
                /* makeknown(HELM_OF_OPPOSITE_ALIGNMENT); -- below, after Tobjnam() */
                } else {
                    pline("%s %s for a moment.", Tobjnam(game.uarmh, "glow"), hcolor(c_color_names.c_black));
                }
                curse(game.uarmh);
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    set_bknown(game.uarmh, 0);
                } else if ((game.urole.mnum == (PM_CLERIC))) {
                    set_bknown(game.uarmh, 1);
                } else if (game.uarmh.bknown) {
                    update_inventory();
                }
            }
            game.disp.botl = (1);
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                /* lose bknown if previously set */
                /* (bknown should already be set) */
                /* keep bknown as-is; display the curse */
                /* Monty Python's Flying Circus */
                pline("My brain hurts!");
            } else if (game.uarmh && game.uarmh.otyp == DUNCE_CAP) {
                /* track INT change; ignore WIS */
                You_feel("%s.", (acurr(A_INT)) <= ((game.u.acurr.a[A_INT]) + (game.u.abon.a[A_INT]) + (game.u.atemp.a[A_INT])) ? "like sitting in a corner" : "giddy");
            } else {
                /* [message formerly given here moved to uchangealign()] */
                discover_object((HELM_OF_OPPOSITE_ALIGNMENT), (1), (1), (1));
            }
            break;
        default:
            impossible(unknown_type, c_helmet, game.uarmh.otyp);
    }
    if (game.uarmh && !game.uarmh.known) {
        game.uarmh.known = 1;
        update_inventory();
    }
    return 0;
}
export function Helmet_off() {
    game.context.takeoff.mask &= ~4;
    switch (game.uarmh.otyp) {
        case FEDORA:
            if ((game.urole.mnum == (PM_ARCHEOLOGIST))) {
                change_luck(-1);
            }
            break;
        case HELMET:
        case DENTED_POT:
        case ELVEN_LEATHER_HELM:
        case DWARVISH_IRON_HELM:
        case ORCISH_HELM:
            break;
        case DUNCE_CAP:
            game.disp.botl = (1);
            break;
        case CORNUTHAUM:
            if (!game.context.takeoff.cancelled_don) {
                (game.u.abon.a[A_CHA]) += ((game.urole.mnum == (PM_WIZARD)) ? -1 : 1);
                game.disp.botl = (1);
            }
            break;
        case HELM_OF_TELEPATHY:
        case HELM_OF_CAUTION:
            setworn(null, 4);
            see_monsters();
            /* could not destroy anything */
            return 0;
        case HELM_OF_BRILLIANCE:
            if (!game.context.takeoff.cancelled_don) {
                adj_abon(game.uarmh, -game.uarmh.spe);
            }
            break;
        case HELM_OF_OPPOSITE_ALIGNMENT:
            uchangealign(game.u.ualignbase[0], A_CG_HELM_OFF);
            break;
        default:
            impossible(unknown_type, c_helmet, game.uarmh.otyp);
    }
    setworn(null, 4);
    game.context.takeoff.cancelled_don = (0);
    return 0;
}
/* hard helms provide better protection against falling rocks */
export function hard_helmet(obj) {
    if (!obj || !(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_HELM)) {
        /* item is not inaccessible */
        return (0);
    }
    return ((game.objects[obj.otyp].oc_material >= IRON && game.objects[obj.otyp].oc_material <= MITHRIL) || (game.objects[(obj).otyp].oc_material == GLASS && (obj).oclass == ARMOR_CLASS)) ? (1) : (0);
}
export function Gloves_on() {
    let oldprop = game.u.uprops[game.objects[game.uarmg.otyp].oc_oprop].extrinsic & ~16;
    switch (game.uarmg.otyp) {
        case LEATHER_GLOVES:
            break;
        case GAUNTLETS_OF_FUMBLING:
            if (!oldprop && !(game.u.uprops[FUMBLING].intrinsic & ~16777215)) {
                incr_itimeout({ get value() { return game.u.uprops[FUMBLING].intrinsic; }, set value(_v) { game.u.uprops[FUMBLING].intrinsic = _v; } }, rnd(20));
            }
            break;
        case GAUNTLETS_OF_POWER:
            discover_object((game.uarmg.otyp), (1), (1), (1));
            game.disp.botl = (1);
            break;
        case GAUNTLETS_OF_DEXTERITY:
            adj_abon(game.uarmg, game.uarmg.spe);
            break;
        default:
            impossible(unknown_type, c_gloves, game.uarmg.otyp);
    }
    if (!game.uarmg.known) {
        /* gloves' +/- evident because of status line AC */
        game.uarmg.known = 1;
        update_inventory();
    }
    return 0;
}
/* check for wielding cockatrice corpse after taking off gloves or yellow
   dragon scales/mail or having temporary stoning resistance time out */
/* uwep, potentially a wielded cockatrice corpse */
/* gloves or dragon armor or Null (resist timeout) */
/* True: taking protective armor off on purpose */
export function wielding_corpse(obj, how, voluntary) {
    if (!obj || obj.otyp != CORPSE || game.uarmg) {
        return;
    }
    /* note: can't dual-wield with non-weapons/weapon-tools so u.twoweap
       will always be false if uswapwep happens to be a corpse */
    if (obj != game.uwep && (obj != game.uswapwep || !game.u.twoweap)) {
        return;
    }
    if (((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        let kbuf = '';
        let hbuf = '';
        You("%s %s in your bare %s.", (how && (how.oclass == ARMOR_CLASS && game.objects[how.otyp].oc_subtyp == ARM_GLOVES)) ? "now wield" : "are wielding", corpse_xname(obj, null, 8), makeplural(body_part(HAND)));
        /* "removing" ought to be "taking off" but that makes the
           tombstone text more likely to be truncated */
        if (how) {
            hbuf = sprintf(hbuf, "%s %s", voluntary ? "removing" : "losing", (how.oclass == ARMOR_CLASS && game.objects[how.otyp].oc_subtyp == ARM_GLOVES) ? gloves_simple_name(how) : strsubst(simpleonames(how), "set of ", ""));
        } else {
            hbuf = strcpy(hbuf, "resistance timing out");
        }
        kbuf = nh_snprintf("wielding_corpse", 636, kbuf, 256 /* sizeof(char [256]) */, "%s while wielding %s", hbuf, killer_xname(obj));
        instapetrify(kbuf);
        /* life-saved or got poly'd into a stone golem; can't continue
           wielding cockatrice corpse unless have now become resistant */
        if (!(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
            remove_worn_item(obj, (0));
        }
    }
}
export function Gloves_off() {
    /* needed after uarmg has been set to Null */
    let gloves = game.uarmg;
    let oldprop = game.u.uprops[game.objects[game.uarmg.otyp].oc_oprop].extrinsic & ~16;
    let on_purpose = !game.context.mon_moving && !game.uarmg.in_use;
    game.context.takeoff.mask &= ~16;
    switch (game.uarmg.otyp) {
        case LEATHER_GLOVES:
            break;
        case GAUNTLETS_OF_FUMBLING:
            if (!oldprop && !(game.u.uprops[FUMBLING].intrinsic & ~16777215)) {
                game.u.uprops[FUMBLING].intrinsic = game.u.uprops[FUMBLING].extrinsic = 0;
            }
            break;
        case GAUNTLETS_OF_POWER:
            discover_object((game.uarmg.otyp), (1), (1), (1));
            game.disp.botl = (1);
            break;
        case GAUNTLETS_OF_DEXTERITY:
            if (!game.context.takeoff.cancelled_don) {
                adj_abon(game.uarmg, -game.uarmg.spe);
            }
            break;
        default:
            impossible(unknown_type, c_gloves, game.uarmg.otyp);
    }
    setworn(null, 16);
    game.context.takeoff.cancelled_don = (0);
    /* immediate feedback for GoP */
    encumber_msg();
    /* usually can't remove gloves when they're slippery but it can
       be done by having them fall off (polymorph), stolen, or
       destroyed (scroll, overenchantment, monster spell); if that
       happens, 'cure' slippery fingers so that it doesn't transfer
       from gloves to bare hands */
    if (game.u.uprops[GLIB].intrinsic) {
        make_glib(0);
    }
    /* prevent wielding cockatrice when not wearing gloves */
    if (game.uwep && game.uwep.otyp == CORPSE) {
        wielding_corpse(game.uwep, gloves, on_purpose);
    }
    /* KMH -- ...or your secondary weapon when you're wielding it
       [This case can't actually happen; twoweapon mode won't engage
       if a corpse has been set up as either the primary or alternate
       weapon.  If it could happen and /both/ uwep and uswapwep could
       be cockatrice corpses, life-saving for the first would need to
       prevent the second from being fatal since conceptually they'd
       be being touched simultaneously.] */
    if (game.u.twoweap && game.uswapwep && game.uswapwep.otyp == CORPSE) {
        wielding_corpse(game.uswapwep, gloves, on_purpose);
    }
    if (game.condtests[bl_bareh].enabled) {
        game.disp.botl = (1);
    }
    return 0;
}
export function Shield_on() {
    switch (game.uarms.otyp) {
        /* no shield currently requires special handling when put on, but we
       keep this uncommented in case somebody adds a new one which does
       [the magical shields are handled by setting u.uprops[*].extrinsic
       in setworn() called by armor_or_accessory_on() before Shield_on()] */
        /* no shield currently requires special handling when taken off, but we
       keep this uncommented in case somebody adds a new one which does */
        case SMALL_SHIELD:
        case SHIELD_OF_DRAIN_RESISTANCE:
        case SHIELD_OF_SHOCK_RESISTANCE:
        case ELVEN_SHIELD:
        case URUK_HAI_SHIELD:
        case ORCISH_SHIELD:
        case DWARVISH_ROUNDSHIELD:
        case LARGE_SHIELD:
        case SHIELD_OF_REFLECTION:
            break;
        default:
            impossible(unknown_type, c_shield, game.uarms.otyp);
    }
    if (!game.uarms.known) {
        /* shield's +/- evident because of status line AC */
        game.uarms.known = 1;
        update_inventory();
    }
    return 0;
}
export function Shield_off() {
    game.context.takeoff.mask &= ~8;
    switch (game.uarms.otyp) {
        case SMALL_SHIELD:
        case SHIELD_OF_DRAIN_RESISTANCE:
        case SHIELD_OF_SHOCK_RESISTANCE:
        case ELVEN_SHIELD:
        case URUK_HAI_SHIELD:
        case ORCISH_SHIELD:
        case DWARVISH_ROUNDSHIELD:
        case LARGE_SHIELD:
        case SHIELD_OF_REFLECTION:
            break;
        default:
            impossible(unknown_type, c_shield, game.uarms.otyp);
    }
    setworn(null, 8);
    return 0;
}
export function Shirt_on() {
    switch (game.uarmu.otyp) {
        /* no shirt currently requires special handling when put on, but we
       keep this uncommented in case somebody adds a new one which does */
        /* no shirt currently requires special handling when taken off, but we
       keep this uncommented in case somebody adds a new one which does */
        case HAWAIIAN_SHIRT:
        case T_SHIRT:
            break;
        default:
            impossible(unknown_type, c_shirt, game.uarmu.otyp);
    }
    if (!game.uarmu.known) {
        /* shirt's +/- evident because of status line AC */
        game.uarmu.known = 1;
        update_inventory();
    }
    return 0;
}
export function Shirt_off() {
    game.context.takeoff.mask &= ~64;
    switch (game.uarmu.otyp) {
        case HAWAIIAN_SHIRT:
        case T_SHIRT:
            break;
        default:
            impossible(unknown_type, c_shirt, game.uarmu.otyp);
    }
    setworn(null, 64);
    return 0;
}
/* handle extra abilities for hero wearing dragon scale armor */
/* armor being put on or taken off */
/* True: on, False: off */
/* voluntary removal; not applicable for putting on */
export function dragon_armor_handling(otmp, puton, on_purpose) {
    if (!otmp) {
        return;
    }
    switch (otmp.otyp) {
        case BLACK_DRAGON_SCALES:
        case BLACK_DRAGON_SCALE_MAIL:
            if (puton) {
                game.u.uprops[DRAIN_RES].extrinsic |= 1;
            } else {
                game.u.uprops[DRAIN_RES].extrinsic &= ~1;
            }
            break;
        case BLUE_DRAGON_SCALES:
        case BLUE_DRAGON_SCALE_MAIL:
            if (puton) {
                if (!((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic)) {
                    You("speed up%s.", (game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic) ? " a bit more" : "");
                }
                game.u.uprops[FAST].extrinsic |= 1;
            } else {
                game.u.uprops[FAST].extrinsic &= ~1;
                if (!((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic) && !game.context.takeoff.cancelled_don) {
                    You("slow down.");
                }
            }
            break;
        case GREEN_DRAGON_SCALES:
        case GREEN_DRAGON_SCALE_MAIL:
            if (puton) {
                game.u.uprops[SICK_RES].extrinsic |= 1;
            } else {
                game.u.uprops[SICK_RES].extrinsic &= ~1;
            }
            break;
        case RED_DRAGON_SCALES:
        case RED_DRAGON_SCALE_MAIL:
            if (puton) {
                game.u.uprops[INFRAVISION].extrinsic |= 1;
            } else {
                game.u.uprops[INFRAVISION].extrinsic &= ~1;
            }
            see_monsters();
            break;
        case GOLD_DRAGON_SCALES:
        case GOLD_DRAGON_SCALE_MAIL:
            make_hallucinated(!puton, game.program_state.restoring ? (0) : (1), 1);
            break;
        case ORANGE_DRAGON_SCALES:
        case ORANGE_DRAGON_SCALE_MAIL:
            if (puton) {
                game.u.uprops[FREE_ACTION].extrinsic |= 1;
            } else {
                game.u.uprops[FREE_ACTION].extrinsic &= ~1;
            }
            break;
        case YELLOW_DRAGON_SCALES:
        case YELLOW_DRAGON_SCALE_MAIL:
            if (puton) {
                game.u.uprops[STONE_RES].extrinsic |= 1;
            } else {
                game.u.uprops[STONE_RES].extrinsic &= ~1;
                /* prevent wielding cockatrice after losing stoning resistance
               when not wearing gloves; the uswapwep case is always a no-op */
                wielding_corpse(game.uwep, otmp, on_purpose);
                wielding_corpse(game.uswapwep, otmp, on_purpose);
            }
            break;
        case WHITE_DRAGON_SCALES:
        case WHITE_DRAGON_SCALE_MAIL:
            if (puton) {
                game.u.uprops[SLOW_DIGESTION].extrinsic |= 1;
            } else {
                game.u.uprops[SLOW_DIGESTION].extrinsic &= ~1;
            }
            break;
        default:
            break;
    }
}
export function Armor_on() {
    /* no known instances of !uarm here but play it safe */
    if (!game.uarm) {
        return 0;
    }
    if (!game.uarm.known) {
        /* suit's +/- evident because of status line AC */
        game.uarm.known = 1;
        update_inventory();
    }
    dragon_armor_handling(game.uarm, (1), (1));
    if (artifact_light(game.uarm) && !game.uarm.lamplit) {
        /* gold DSM requires extra handling since it emits light when worn;
       do that after the special armor handling */
        begin_burn(game.uarm, (0));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s %s to shine %s!", Yname2(game.uarm), otense(game.uarm, "begin"), arti_light_description(game.uarm));
        }
    }
    return 0;
}
export function Armor_off() {
    let otmp = game.uarm;
    let was_arti_light = otmp && otmp.lamplit && artifact_light(otmp);
    game.context.takeoff.mask &= ~1;
    setworn(null, 1);
    game.context.takeoff.cancelled_don = (0);
    if (was_arti_light && !artifact_light(otmp)) {
        /* taking off yellow dragon scales/mail might be fatal; arti_light
       comes from gold dragon scales/mail so they don't overlap, but
       conceptually the non-fatal change should be done before the
       potentially fatal change in case the latter results in bones */
        /* losing yellow dragon scales/mail might be fatal; arti_light
       comes from gold dragon scales/mail so they don't overlap, but
       conceptually the non-fatal change should be done before the
       potentially fatal change in case the latter results in bones */
        end_burn(otmp, (0));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s shining.", Tobjnam(otmp, "stop"));
        }
    }
    dragon_armor_handling(otmp, (0), (1));
    return 0;
}
/* The gone functions differ from the off functions in that if you die from
 * taking it off and have life saving, you still die.  [Obsolete reference
 * to lack of fire resistance being fatal in hell (nethack 3.0) and life
 * saving putting a removed item back on to prevent that from immediately
 * repeating.]
 */
export function Armor_gone() {
    let otmp = game.uarm;
    let was_arti_light = otmp && otmp.lamplit && artifact_light(otmp);
    game.context.takeoff.mask &= ~1;
    setnotworn(game.uarm);
    game.context.takeoff.cancelled_don = (0);
    if (was_arti_light && !artifact_light(otmp)) {
        end_burn(otmp, (0));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s shining.", Tobjnam(otmp, "stop"));
        }
    }
    dragon_armor_handling(otmp, (0), (0));
    return 0;
}
export function Amulet_on(amul) {
    let on_msg_done = (0);
    /* make sure amulet isn't wielded/alt-wielded/quivered, before wearing */
    remove_worn_item(amul, (0));
    setworn(amul, 65536);
    switch (game.uamul.otyp) {
        case AMULET_OF_ESP:
        case AMULET_OF_LIFE_SAVING:
        case AMULET_VERSUS_POISON:
        case AMULET_OF_REFLECTION:
        case FAKE_AMULET_OF_YENDOR:
            break;
        case AMULET_OF_MAGICAL_BREATHING:
{
                let was_in_poison_gas = 0;
                game.u.uprops[MAGICAL_BREATHING].extrinsic &= ~65536;
                /* amulet is already on; we need to check hero's gas-cloud status
           when it was off */
                was_in_poison_gas = region_danger();
                game.u.uprops[MAGICAL_BREATHING].extrinsic |= 65536;
                if (was_in_poison_gas) {
                    discover_object((AMULET_OF_MAGICAL_BREATHING), (1), (1), (1));
                    /* show 'z - amulet of change (being worn)' */
                    on_msg(game.uamul);
                    on_msg_done = (1);
                    You("are no longer bothered by the poison gas.");
                }
                /* no need to check for becoming able to breathe underwater;
           if we are underwater, we already can or we would have drowned */
                break;
            }
        case AMULET_OF_UNCHANGING:
            if (game.u.uprops[SLIMED].intrinsic) {
                make_slimed(0, null);
            }
            break;
        case AMULET_OF_CHANGE:
{
                let call_it = (0);
                let new_sex = 0;
                let orig_sex = poly_gender();
                /* in normal play it's not possible to put on an amulet of change
           while already wearing an amulet of unchanging, but in wizard
           mode the Unchanging attribute can be set via #wizintrinsic */
                if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
                    change_sex();
                }
                new_sex = poly_gender();
                if (new_sex != orig_sex) {
                    discover_object((AMULET_OF_CHANGE), (1), (1), (1));
                }
                on_msg(game.uamul);
                on_msg_done = (1);
                if (new_sex != orig_sex) {
                    /* Don't use same message as polymorph */
                    /* glyphmon flag and tile have changed */
                    newsym(game.u.ux, game.u.uy);
                    /* role name or rank title might have changed */
                    game.disp.botl = (1);
                    You("are suddenly very %s!", game.flags.female ? "feminine" : "masculine");
                } else {
                    /* already polymorphed into single-gender monster; only
               changed the character's base sex */
                    You("don't feel like yourself.");
                    /* checking dknown is redundant--amulets always have dknown set */
                    call_it = (game.uamul.dknown != 0);
                }
                livelog_newform((0), orig_sex, new_sex);
                pline_The("amulet disintegrates!");
                if (call_it) {
                    trycall(game.uamul);
                }
                useup(game.uamul);
                break;
            }
        case AMULET_OF_STRANGULATION:
            if (can_be_strangled(game.youmonst) && !game.u.uprops[STRANGLED].intrinsic) {
                discover_object((AMULET_OF_STRANGULATION), (1), (1), (1));
                game.u.uprops[STRANGLED].intrinsic = 6;
                game.disp.botl = (1);
                on_msg(game.uamul);
                on_msg_done = (1);
                pline("It constricts your throat!");
            }
            break;
        case AMULET_OF_RESTFUL_SLEEP:
{
                let newnap = rnd(98) + 2;
                let oldnap = (game.u.uprops[SLEEPY].intrinsic & 16777215);
                if (newnap < oldnap || oldnap == 0) {
                    game.u.uprops[SLEEPY].intrinsic = (game.u.uprops[SLEEPY].intrinsic & ~16777215) | newnap;
                }
                break;
            }
        case AMULET_OF_FLYING:
            float_vs_flight();
            if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
                /* avoid clobbering FROMOUTSIDE bit, which might have
               gotten set by previously eating one of these amulets */
                /* setworn() has already set extrinsic flying */
                /* block flying if levitating */
                let already_flying = 0;
                game.u.uprops[FLYING].extrinsic &= ~65536;
                /* to determine whether this flight is new we have to muck
               about in the Flying intrinsic (actually extrinsic) */
                already_flying = !!((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked);
                game.u.uprops[FLYING].extrinsic |= 65536;
                if (!already_flying) {
                    discover_object((AMULET_OF_FLYING), (1), (1), (1));
                    on_msg(game.uamul);
                    on_msg_done = (1);
                    game.disp.botl = (1);
                    You("are now in flight.");
                }
            }
            break;
        case AMULET_OF_GUARDING:
            discover_object((AMULET_OF_GUARDING), (1), (1), (1));
            find_ac();
            break;
        case AMULET_OF_YENDOR:
            break;
    }
    if (!on_msg_done) {
        on_msg(game.uamul);
    }
}
export function Amulet_off() {
    /* for off_msg() after setworn(NULL,W_AMUL) */
    let amul = game.uamul;
    let mkn = (0);
    let early_off_msg = (0);
    game.context.takeoff.mask &= ~65536;
    switch (game.uamul.otyp) {
        case AMULET_OF_ESP:
            setworn(null, 65536);
            /* 'uamul' has been set to Null */
            off_msg(amul);
            early_off_msg = (1);
            see_monsters();
            break;
        case AMULET_OF_LIFE_SAVING:
        case AMULET_VERSUS_POISON:
        case AMULET_OF_REFLECTION:
        case AMULET_OF_CHANGE:
        case AMULET_OF_UNCHANGING:
        case FAKE_AMULET_OF_YENDOR:
            break;
        case AMULET_OF_MAGICAL_BREATHING:
            setworn(null, 65536);
            off_msg(amul);
            early_off_msg = (1);
            if ((game.u.uinwater)) {
                if (!((((game.youmonst.data).mflags1 & 2) != 0) || (((game.youmonst.data).mflags1 & 512) != 0) || (((game.youmonst.data).mflags1 & 1024) != 0)) && !(game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0)))) {
                    /* amulet is currently still on; take it off before calling drown()
           and region_danger(); call off_msg() before specific messages */
                    You("suddenly inhale an unhealthy amount of %s!", hliquid("water"));
                    /* makeknown(AMULET_OF_FLYING) */
                    mkn = (1);
                    drown();
                }
            }
            if (region_danger()) {
                /* "breathing": wouldn't get here otherwise */
                You("are breathing poison gas!");
                mkn = (1);
            }
            break;
        case AMULET_OF_STRANGULATION:
            setworn(null, 65536);
            off_msg(amul);
            early_off_msg = (1);
            if (game.u.uprops[STRANGLED].intrinsic) {
                game.u.uprops[STRANGLED].intrinsic = 0;
                game.disp.botl = (1);
                if ((game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))) {
                    Your("%s is no longer constricted!", body_part(NECK));
                } else {
                    You("can breathe more easily!");
                }
                mkn = (1);
            }
            break;
        case AMULET_OF_RESTFUL_SLEEP:
            setworn(null, 65536);
            /* HSleepy = 0L; -- avoid clobbering FROMOUTSIDE bit */
            if (!game.u.uprops[SLEEPY].extrinsic && !(game.u.uprops[SLEEPY].intrinsic & ~16777215)) {
                game.u.uprops[SLEEPY].intrinsic &= ~16777215;
            }
            break;
        case AMULET_OF_FLYING:
{
                let was_flying = !!((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked);
                /* remove amulet 'early' to determine whether Flying changes;
           also in case spoteffects() does something with the amulet */
                setworn(null, 65536);
                off_msg(amul);
                early_off_msg = (1);
                float_vs_flight();
                if (was_flying && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
                    game.disp.botl = (1);
                    You("%s.", (is_pool_or_lava(game.u.ux, game.u.uy) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) ? "stop flying" : "land");
                    mkn = (1);
                    spoteffects((1));
                }
                break;
            }
        case AMULET_OF_GUARDING:
            find_ac();
            break;
        case AMULET_OF_YENDOR:
            break;
    }
    setworn(null, 65536);
    if (!early_off_msg) {
        off_msg(amul);
    }
    /* (not 'uamul'; it's Null now) */
    if (mkn) {
        discover_object((amul.otyp), (1), (1), (1));
    }
    return;
}
/* handle ring discovery; comparable to learnwand() */
export function learnring(ring, observed) {
    let ringtype = ring.otyp;
    if (observed) {
        /* if effect was observable then we usually discover the type */
        /* if we already know the ring type which accomplishes this
           effect (assumes there is at most one type for each effect),
           mark this ring as having been seen (no need for makeknown);
           otherwise if we have seen this ring, discover its type */
        if (game.objects[ringtype].oc_name_known) {
            observe_object(ring);
        } else if (ring.dknown) {
            discover_object((ringtype), (1), (1), (1));
        }
    }
    if (ring.dknown && game.objects[ringtype].oc_name_known) {
        /* make enchantment of charged ring known (might be +0) and update
       perm invent window if we've seen this ring and know its type */
        if (game.objects[ringtype].oc_charged) {
            ring.known = 1;
        }
        update_inventory();
    }
}
export function adjust_attrib(obj, which, val) {
    let old_attrib = 0;
    let observable = 0;
    old_attrib = (acurr(which));
    (game.u.abon.a[which]) += val;
    observable = (old_attrib != (acurr(which)));
    /* if didn't change, usually means ring is +0 but might
        be because nonzero couldn't go below min or above max;
        learn +0 enchantment if attribute value is not stuck
        at a limit [and ring has been seen and its type is
        already discovered, both handled by learnring()] */
    if (observable || !extremeattr(which)) {
        learnring(obj, observable);
    }
    game.disp.botl = (1);
}
export function Ring_on(obj) {
    let oldprop = game.u.uprops[game.objects[obj.otyp].oc_oprop].extrinsic;
    let observable = 0;
    /* make sure ring isn't wielded; can't use remove_worn_item()
       here because it has already been set worn in a ring slot */
    if (obj == game.uwep) {
        setuwep(null);
    } else if (obj == game.uswapwep) {
        setuswapwep(null);
    } else if (obj == game.uquiver) {
        setuqwep(null);
    }
    /* only mask out W_RING when we don't have both
       left and right rings of the same type */
    if ((oldprop & (131072 | 262144)) != (131072 | 262144)) {
        oldprop &= ~(131072 | 262144);
    }
    switch (obj.otyp) {
        case RIN_TELEPORTATION:
        case RIN_REGENERATION:
        case RIN_SEARCHING:
        case RIN_HUNGER:
        case RIN_AGGRAVATE_MONSTER:
        case RIN_POISON_RESISTANCE:
        case RIN_FIRE_RESISTANCE:
        case RIN_COLD_RESISTANCE:
        case RIN_SHOCK_RESISTANCE:
        case RIN_CONFLICT:
        case RIN_TELEPORT_CONTROL:
        case RIN_POLYMORPH:
        case RIN_POLYMORPH_CONTROL:
        case RIN_FREE_ACTION:
        case RIN_SLOW_DIGESTION:
        case RIN_SUSTAIN_ABILITY:
            break;
        case MEAT_RING:
            break;
        case RIN_STEALTH:
            toggle_stealth(obj, oldprop, (1));
            break;
        case RIN_WARNING:
            see_monsters();
            break;
        case RIN_SEE_INVISIBLE:
            set_mimic_blocking();
            see_monsters();
            if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !oldprop && !game.u.uprops[SEE_INVIS].intrinsic && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                newsym(game.u.ux, game.u.uy);
                pline("Suddenly you are transparent, but there!");
                learnring(obj, (1));
            }
            break;
        case RIN_INVISIBILITY:
            if (!oldprop && !game.u.uprops[INVIS].intrinsic && !game.u.uprops[INVIS].blocked && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                learnring(obj, (1));
                newsym(game.u.ux, game.u.uy);
                self_invis_message();
            }
            break;
        case RIN_LEVITATION:
            if (!oldprop && !game.u.uprops[LEVITATION].intrinsic && !(game.u.uprops[LEVITATION].blocked & 67108864)) {
                float_up();
                learnring(obj, (1));
                if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
                    spoteffects((0));
                }
            } else {
                float_vs_flight();
            }
            break;
        case RIN_GAIN_STRENGTH:
            adjust_attrib(obj, A_STR, obj.spe);
            break;
        case RIN_GAIN_CONSTITUTION:
            adjust_attrib(obj, A_CON, obj.spe);
            break;
        case RIN_ADORNMENT:
            adjust_attrib(obj, A_CHA, obj.spe);
            break;
        case RIN_INCREASE_ACCURACY:
            game.u.uhitinc += obj.spe;
            break;
        case RIN_INCREASE_DAMAGE:
            game.u.udaminc += obj.spe;
            break;
        case RIN_PROTECTION_FROM_SHAPE_CHAN:
            rescham();
            break;
        case RIN_PROTECTION:
            observable = (obj.spe != 0);
            learnring(obj, observable);
            if (obj.spe) {
                find_ac();
            }
            break;
    }
}
export function Ring_off_or_gone(obj, gone) {
    let mask = (obj.owornmask & (131072 | 262144));
    let observable = 0;
    game.context.takeoff.mask &= ~mask;
    if (!(game.u.uprops[game.objects[obj.otyp].oc_oprop].extrinsic & mask)) {
        impossible("Strange... I didn't know you had that ring.");
    }
    if (gone) {
        setnotworn(obj);
    } else {
        setworn(null, obj.owornmask);
    }
    switch (obj.otyp) {
        case RIN_TELEPORTATION:
        case RIN_REGENERATION:
        case RIN_SEARCHING:
        case RIN_HUNGER:
        case RIN_AGGRAVATE_MONSTER:
        case RIN_POISON_RESISTANCE:
        case RIN_FIRE_RESISTANCE:
        case RIN_COLD_RESISTANCE:
        case RIN_SHOCK_RESISTANCE:
        case RIN_CONFLICT:
        case RIN_TELEPORT_CONTROL:
        case RIN_POLYMORPH:
        case RIN_POLYMORPH_CONTROL:
        case RIN_FREE_ACTION:
        case RIN_SLOW_DIGESTION:
        case RIN_SUSTAIN_ABILITY:
        case MEAT_RING:
            break;
        case RIN_STEALTH:
            toggle_stealth(obj, (game.u.uprops[STEALTH].extrinsic & ~mask), (0));
            break;
        case RIN_WARNING:
            see_monsters();
            break;
        case RIN_SEE_INVISIBLE:
            if (!(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
                /* Make invisible monsters go away */
                set_mimic_blocking();
                see_monsters();
            }
            if ((((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                newsym(game.u.ux, game.u.uy);
                pline("Suddenly you cannot see yourself.");
                learnring(obj, (1));
            }
            break;
        case RIN_INVISIBILITY:
            if (!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !game.u.uprops[INVIS].blocked && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                newsym(game.u.ux, game.u.uy);
                Your("body seems to unfade%s.", (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? " completely" : "..");
                learnring(obj, (1));
            }
            break;
        case RIN_LEVITATION:
            if (!(game.u.uprops[LEVITATION].blocked & 67108864)) {
                float_down(0, 0);
                if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
                    learnring(obj, (1));
                }
            } else {
                float_vs_flight();
            }
            break;
        case RIN_GAIN_STRENGTH:
            adjust_attrib(obj, A_STR, -obj.spe);
            break;
        case RIN_GAIN_CONSTITUTION:
            adjust_attrib(obj, A_CON, -obj.spe);
            break;
        case RIN_ADORNMENT:
            adjust_attrib(obj, A_CHA, -obj.spe);
            break;
        case RIN_INCREASE_ACCURACY:
            game.u.uhitinc -= obj.spe;
            break;
        case RIN_INCREASE_DAMAGE:
            game.u.udaminc -= obj.spe;
            break;
        case RIN_PROTECTION:
            observable = (obj.spe != 0);
            learnring(obj, observable);
            if (obj.spe) {
                find_ac();
            }
            break;
        case RIN_PROTECTION_FROM_SHAPE_CHAN:
            if (!(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
                restartcham();
            }
            break;
    }
}
export function Ring_off(obj) {
    Ring_off_or_gone(obj, (0));
}
export function Ring_gone(obj) {
    Ring_off_or_gone(obj, (1));
}
export function Blindf_on(otmp) {
    let already_blind = ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
    let changed = (0);
    /* blindfold might be wielded; release it for wearing */
    remove_worn_item(otmp, (0));
    setworn(otmp, 524288);
    on_msg(otmp);
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !already_blind) {
        changed = (1);
        if (game.flags.verbose) {
            You_cant("see any more.");
        }
        /* set ball&chain variables before the hero goes blind */
        if ((game.uball != null)) {
            set_bc(0);
        }
    } else if (already_blind && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        changed = (1);
        if (game.u.uroleplay.blind) {
            /* "You are now wearing the Eyes of the Overworld." */
            /* this can only happen by putting on the Eyes of the Overworld;
               that shouldn't actually produce a permanent cure, but we
               can't let the "blind from birth" conduct remain intact */
            pline("For the first time in your life, you can see!");
            game.u.uroleplay.blind = (0);
        } else {
            You("can see!");
        }
    }
    if (changed) {
        toggle_blindness();
    }
}
export function Blindf_off(otmp) {
    let was_blind = ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
    let changed = (0);
    let nooffmsg = !otmp;
    if (!otmp) {
        otmp = game.ublindf;
    }
    if (!otmp) {
        impossible("Blindf_off without eyewear?");
        return;
    }
    game.context.takeoff.mask &= ~524288;
    setworn(null, otmp.owornmask);
    if (!nooffmsg) {
        /* We want off_msg() after removing the item to
           avoid "You were wearing ____ (being worn)." */
        off_msg(otmp);
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        if (was_blind) {
            /* "still cannot see" makes no sense when removing lenses
               since they can't have been the cause of your blindness */
            if (otmp.otyp != LENSES) {
                You("still cannot see.");
            }
        } else {
            changed = (1);
            /* "You were wearing the Eyes of the Overworld." */
            You_cant("see anything now!");
            if ((game.uball != null)) {
                set_bc(0);
            }
        }
    } else if (was_blind) {
        if (!gulp_blnd_check()) {
            changed = (1);
            You("can see again.");
        }
    }
    if (changed) {
        toggle_blindness();
    }
}
/* called in moveloop()'s prologue to set side-effects of worn start-up items;
   also used by poly_obj() when a worn item gets transformed */
/* if Null, do all worn items; otherwise just obj */
export function set_wear(obj) {
    game.initial_don = !obj;
    if (!obj ? game.ublindf != null : (obj == game.ublindf)) {
        Blindf_on(game.ublindf);
    }
    if (!obj ? game.uright != null : (obj == game.uright)) {
        Ring_on(game.uright);
    }
    if (!obj ? game.uleft != null : (obj == game.uleft)) {
        Ring_on(game.uleft);
    }
    if (!obj ? game.uamul != null : (obj == game.uamul)) {
        Amulet_on(game.uamul);
    }
    if (!obj ? game.uarmu != null : (obj == game.uarmu)) {
        Shirt_on();
    }
    if (!obj ? game.uarm != null : (obj == game.uarm)) {
        Armor_on();
    }
    if (!obj ? game.uarmc != null : (obj == game.uarmc)) {
        Cloak_on();
    }
    if (!obj ? game.uarmf != null : (obj == game.uarmf)) {
        Boots_on();
    }
    if (!obj ? game.uarmg != null : (obj == game.uarmg)) {
        Gloves_on();
    }
    if (!obj ? game.uarmh != null : (obj == game.uarmh)) {
        Helmet_on();
    }
    if (!obj ? game.uarms != null : (obj == game.uarms)) {
        Shield_on();
    }
    game.initial_don = (0);
}
/* check whether the target object is currently being put on (or taken off--
   also checks for doffing--[why?]) */
export function donning(otmp) {
    let result = (0);
    /* 'W' (or 'P' used for armor) sets ga.afternmv */
    if (doffing(otmp)) {
        result = (1);
    } else if (otmp == game.uarm) {
        result = (game.afternmv == Armor_on);
    } else if (otmp == game.uarmu) {
        result = (game.afternmv == Shirt_on);
    } else if (otmp == game.uarmc) {
        result = (game.afternmv == Cloak_on);
    } else if (otmp == game.uarmf) {
        result = (game.afternmv == Boots_on);
    } else if (otmp == game.uarmh) {
        result = (game.afternmv == Helmet_on);
    } else if (otmp == game.uarmg) {
        result = (game.afternmv == Gloves_on);
    } else if (otmp == game.uarms) {
        result = (game.afternmv == Shield_on);
    }
    return result;
}
/* check whether the target object is currently being taken off,
   so that stop_donning() and steal() can vary messages and doname()
   can vary "(being worn)" suffix */
export function doffing(otmp) {
    let what = game.context.takeoff.what;
    let result = (0);
    /* 'T' (or 'R' used for armor) sets ga.afternmv, 'A' sets takeoff.what */
    if (otmp == game.uarm) {
        result = (game.afternmv == Armor_off || what == 1);
    } else if (otmp == game.uarmu) {
        result = (game.afternmv == Shirt_off || what == 64);
    } else if (otmp == game.uarmc) {
        result = (game.afternmv == Cloak_off || what == 2);
    } else if (otmp == game.uarmf) {
        result = (game.afternmv == Boots_off || what == 32);
    } else if (otmp == game.uarmh) {
        result = (game.afternmv == Helmet_off || what == 4);
    } else if (otmp == game.uarmg) {
        result = (game.afternmv == Gloves_off || what == 16);
    } else if (otmp == game.uarms) {
        result = (game.afternmv == Shield_off || what == 8);
    } else if (otmp == game.uamul) {
        result = (what == 65536);
    } else if (otmp == game.uleft) {
        result = (what == 131072);
    } else if (otmp == game.uright) {
        result = (what == 262144);
    } else if (otmp == game.ublindf) {
        result = (what == 524288);
    } else if (otmp == game.uwep) {
        result = (what == 256);
    } else if (otmp == game.uswapwep) {
        result = (what == 1024);
    } else if (otmp == game.uquiver) {
        result = (what == 512);
    }
    return result;
}
/* despite their names, cancel_don() and cancel_doff() both apply to both
   donning and doffing... */
export function cancel_doff(obj, slotmask) {
    /* Called by setworn() for old item in specified slot or by setnotworn()
     * for specified item.  We don't want to call cancel_don() if we got
     * here via <X>_off() -> setworn((struct obj *) 0) -> cancel_doff()
     * because that would stop the 'A' command from continuing with next
     * selected item.  So do_takeoff() sets a flag in takeoff.mask for us.
     * [For taking off an individual item with 'T'/'R'/'w-', it doesn't
     * matter whether cancel_don() gets called here--the item has already
     * been removed by now.]
     */
    if (!(game.context.takeoff.mask & 536870912) && donning(obj)) {
        /* cancel_don() looks at afternmv; it can also cancel doffing */
        cancel_don();
    }
    game.context.takeoff.mask &= ~slotmask;
}
/* despite their names, cancel_don() and cancel_doff() both apply to both
   donning and doffing... */
export function cancel_don() {
    /* the piece of armor we were donning/doffing has vanished, so stop
     * wasting time on it (and don't dereference it when donning would
     * otherwise finish); afternmv never has some of these values because
     * every item of the corresponding armor category takes 1 turn to wear,
     * but check all of them anyway
     */
    game.context.takeoff.cancelled_don = (game.afternmv == Cloak_on || game.afternmv == Armor_on || game.afternmv == Shirt_on || game.afternmv == Helmet_on || game.afternmv == Gloves_on || game.afternmv == Boots_on || game.afternmv == Shield_on);
    /* don't want <armor>_on() or <armor>_off() being called
       by unmul() since the on or off action isn't completing */
    game.afternmv = null;
    game.nomovemsg = null;
    game.multi = 0;
    game.context.takeoff.delay = 0;
    game.context.takeoff.what = 0;
}
/* called by steal() during theft from hero; interrupt donning/doffing */
/* no mesg if stolenobj is already being doffed */
export function stop_donning(stolenobj) {
    let buf = '';
    let otmp = null;
    let putting_on = 0;
    let result = 0;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if ((otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) && donning(otmp)) {
            break;
        }
    }
    /* at most one item will pass donning() test at any given time */
    if (!otmp) {
        return 0;
    }
    /* donning() returns True when doffing too; doffing() is more specific */
    putting_on = !doffing(otmp);
    cancel_don();
    game.afternmv = null;
    if (putting_on || otmp != stolenobj) {
        buf = sprintf(buf, "You stop %s %s.", putting_on ? "putting on" : "taking off", thesimpleoname(otmp));
    } else {
        /* silently stop doffing stolenobj */
        buf = '';
        /* remember this before calling unmul() */
        result = -game.multi;
    }
    unmul(buf);
    /* while putting on, item becomes worn immediately but side-effects are
       deferred until the delay expires; when interrupted, make it unworn
       (while taking off, item stays worn until the delay expires; when
       interrupted, leave it worn) */
    if (putting_on) {
        remove_worn_item(otmp, (0));
    }
    return result;
}
game.Narmorpieces = 0;
game.Naccessories = 0;
/* assign values to Narmorpieces and Naccessories */
/* caller wants this when count is 1 */
export function count_worn_stuff(which, accessorizing) {
    let otmp = null;
    game.Narmorpieces = game.Naccessories = 0;
    /* default item iff Narmorpieces is 1 */
    otmp = null;
    do {
        if (game.uarmh) {
            game.Narmorpieces++;
            otmp = game.uarmh;
        }
    } while (0);
    do {
        if (game.uarms) {
            game.Narmorpieces++;
            otmp = game.uarms;
        }
    } while (0);
    do {
        if (game.uarmg) {
            game.Narmorpieces++;
            otmp = game.uarmg;
        }
    } while (0);
    do {
        if (game.uarmf) {
            game.Narmorpieces++;
            otmp = game.uarmf;
        }
    } while (0);
    /* for cloak/suit/shirt, we only count the outermost item so that it
       can be taken off without confirmation if final count ends up as 1 */
    if (game.uarmc) {
        do {
            if (game.uarmc) {
                game.Narmorpieces++;
                otmp = game.uarmc;
            }
        } while (0);
    } else if (game.uarm) {
        do {
            if (game.uarm) {
                game.Narmorpieces++;
                otmp = game.uarm;
            }
        } while (0);
    } else if (game.uarmu) {
        do {
            if (game.uarmu) {
                game.Narmorpieces++;
                otmp = game.uarmu;
            }
        } while (0);
    }
    if (!accessorizing) {
        which.value = otmp;
    }
    otmp = null;
    do {
        if (game.uleft) {
            game.Naccessories++;
            otmp = game.uleft;
        }
    } while (0);
    do {
        if (game.uright) {
            game.Naccessories++;
            otmp = game.uright;
        }
    } while (0);
    do {
        if (game.uamul) {
            game.Naccessories++;
            otmp = game.uamul;
        }
    } while (0);
    do {
        if (game.ublindf) {
            game.Naccessories++;
            otmp = game.ublindf;
        }
    } while (0);
    if (accessorizing) {
        which.value = otmp;
    }
}
/* take off one piece or armor or one accessory;
   shared by dotakeoff('T') and doremring('R') */
export function armor_or_accessory_off(obj) {
    if (!(obj.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288)))) {
        You("are not wearing that.");
        return 0;
    }
    if (obj == game.uskin || ((obj == game.uarm) && game.uarmc) || ((obj == game.uarmu) && (game.uarmc || game.uarm))) {
        let why = '';
        let what = '';
        why[0] = what = '';
        if (obj != game.uskin) {
            if (game.uarmc) {
                what = strcat(what, cloak_simple_name(game.uarmc));
            }
            if ((obj == game.uarmu) && game.uarm) {
                if (game.uarmc) {
                    what = strcat(what, " and ");
                }
                what = strcat(what, suit_simple_name(game.uarm));
            }
            why = nh_snprintf("armor_or_accessory_off", 1792, why, 128 /* sizeof(char [128]) */, " without taking off your %s first", what);
        } else {
            why = strcpy(why, "; it's embedded");
        }
        You_cant("take that off%s.", why);
        return 0;
    }
    /* clear context.takeoff.mask and context.takeoff.what */
    /* none of armoroff()/Ring_/Amulet/Blindf_off() use context.takeoff.mask */
    reset_remarm();
    select_off(obj);
    if (!game.context.takeoff.mask) {
        return 0;
    }
    reset_remarm();
    if (obj.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) {
        armoroff(obj);
    } else if (obj == game.uright || obj == game.uleft) {
        /* Sometimes we want to give the off_msg before removing and
         * sometimes after; for instance, "you were wearing a moonstone
         * ring (on right hand)" is desired but "you were wearing a
         * square amulet (being worn)" is not because of the redundant
         * "being worn".
         */
        off_msg(obj);
        Ring_off(obj);
    } else if (obj == game.uamul) {
        Amulet_off();
    } else if (obj == game.ublindf) {
        Blindf_off(obj);
    } else {
        impossible("removing strange accessory: %s", safe_typename(obj.otyp));
        if (obj.owornmask) {
            remove_worn_item(obj, (0));
        }
    }
    return 1;
}
/* the #takeoff command - remove worn armor */
export function dotakeoff() {
    let otmp = null;
    count_worn_stuff({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, (0));
    if (!game.Narmorpieces && !game.Naccessories) {
        /* assert( GRAY_DRAGON_SCALES > YELLOW_DRAGON_SCALE_MAIL ); */
        if (game.uskin) {
            pline_The("%s merged with your skin!", game.uskin.otyp >= GRAY_DRAGON_SCALES ? "dragon scales are" : "dragon scale mail is");
        } else {
            pline("Not wearing any armor or accessories.");
        }
        return 0;
    }
    if (game.Narmorpieces != 1 || ((game.flags.paranoia_bits & 64) != 0) || game.item_action_in_progress) {
        otmp = getobj("take off", takeoff_ok, 0);
    }
    if (!otmp) {
        return 2;
    }
    return armor_or_accessory_off(otmp);
}
/* 'i' or 'I[' followed by <invlet> and then 'T';
   plain dotakeoff() would not give any feedback when picking suit
   covered by cloak, or shirt covered by suit and/or cloak, due to the
   default behavior of equip_ok() (skipping inaccessible items) */
export function ia_dotakeoff() {
    let res = 0;
    game.item_action_in_progress = (1);
    res = dotakeoff();
    game.item_action_in_progress = (0);
    return res;
}
/* the #remove command - take off ring or other accessory */
export function doremring() {
    let otmp = null;
    count_worn_stuff({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, (1));
    if (!game.Naccessories && !game.Narmorpieces) {
        pline("Not wearing any accessories or armor.");
        return 0;
    }
    if (game.Naccessories != 1 || ((game.flags.paranoia_bits & 64) != 0) || cmdq_peek(CQ_CANNED)) {
        otmp = getobj("remove", remove_ok, 0);
    }
    if (!otmp) {
        return 2;
    }
    return armor_or_accessory_off(otmp);
}
/* Check if something worn is cursed _and_ unremovable. */
export function cursed(otmp) {
    if (!otmp) {
        impossible("cursed without otmp");
        return 0;
    }
    if ((otmp == game.uwep) ? welded(otmp) : otmp.cursed) {
        /* Curses, like chickens, come home to roost. */
        let use_plural = ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_BOOTS) || (otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_GLOVES) || otmp.otyp == LENSES || otmp.quan > 1);
        /* might be trying again after applying grease to hands */
        if (game.u.uprops[GLIB].intrinsic && otmp.bknown && (game.uarmg ? (otmp == game.uwep) : ((otmp.owornmask & (256 | (131072 | 262144))) != 0))) {
            pline("Despite your slippery %s, you can't.", fingers_or_gloves((1)));
        } else {
            You("can't.  %s cursed.", use_plural ? "They are" : "It is");
        }
        set_bknown(otmp, 1);
        return 1;
    }
    return 0;
}
let __armoroff_offdelaybuf = '';
export function armoroff(otmp) {
    let delay = -game.objects[otmp.otyp].oc_delay;
    let what = null;
    if (cursed(otmp)) {
        return 0;
    }
    if (delay) {
        /* this used to make assumptions about which types of armor had
       delays and which didn't; now both are handled for all types */
        nomul(delay);
        game.multi_reason = "disrobing";
        switch (game.objects[otmp.otyp].oc_subtyp) {
            /* no delay so no '(*afternmv)()' or 'nomovemsg' */
            case ARM_SUIT:
                what = suit_simple_name(otmp);
                game.afternmv = Armor_off;
                break;
            case ARM_SHIELD:
                what = shield_simple_name(otmp);
                game.afternmv = Shield_off;
                break;
            case ARM_HELM:
                what = helm_simple_name(otmp);
                game.afternmv = Helmet_off;
                break;
            case ARM_GLOVES:
                what = gloves_simple_name(otmp);
                game.afternmv = Gloves_off;
                break;
            case ARM_BOOTS:
                what = boots_simple_name(otmp);
                game.afternmv = Boots_off;
                break;
            case ARM_CLOAK:
                what = cloak_simple_name(otmp);
                game.afternmv = Cloak_off;
                break;
            case ARM_SHIRT:
                what = shirt_simple_name(otmp);
                game.afternmv = Shirt_off;
                break;
            default:
                impossible("Taking off unknown armor (%d: %d), delay %d", otmp.otyp, game.objects[otmp.otyp].oc_subtyp, delay);
                break;
        }
        if (what) {
            __armoroff_offdelaybuf = nh_snprintf("armoroff", 1970, __armoroff_offdelaybuf, 60 /* sizeof(char [60]) */, "You finish taking off your %s.", what);
            /* sizeof offdelaybuf == 60; increase it if this becomes longer */
            game.nomovemsg = __armoroff_offdelaybuf;
        }
    } else {
        switch (game.objects[otmp.otyp].oc_subtyp) {
            case ARM_SUIT:
                Armor_off();
                break;
            case ARM_SHIELD:
                Shield_off();
                break;
            case ARM_HELM:
                Helmet_off();
                break;
            case ARM_GLOVES:
                Gloves_off();
                break;
            case ARM_BOOTS:
                Boots_off();
                break;
            case ARM_CLOAK:
                Cloak_off();
                break;
            case ARM_SHIRT:
                Shirt_off();
                break;
            default:
                impossible("Taking off unknown armor (%d: %d), no delay", otmp.otyp, game.objects[otmp.otyp].oc_subtyp);
                break;
        }
        off_msg(otmp);
    }
    game.context.takeoff.mask = game.context.takeoff.what = 0;
    return 1;
}
export function already_wearing(cc) {
    You("are already wearing %s%c", cc, (cc == c_that_) ? 33 : 46);
}
export function already_wearing2(cc1, cc2) {
    You_cant("wear %s because you're wearing %s there already.", cc1, cc2);
}
/*
 * canwearobj checks to see whether the player can wear a piece of armor
 *
 * inputs: otmp (the piece of armor)
 *         noisy (if TRUE give error messages, otherwise be quiet about it)
 * output: mask (otmp's armor type)
 */
export function canwearobj(otmp, mask, noisy) {
    let err = 0;
    let which = null;
    if (((game.youmonst.data).msize < 1) || (((game.youmonst.data).mflags1 & 8192) != 0)) {
        /* this is the same check as for 'W' (dowear), but different message,
       in case we get here via 'P' (doputon) */
        if (noisy) {
            You("can't wear any armor in your current form.");
        }
        return 0;
    }
    which = (otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_CLOAK) ? c_cloak : (otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_SHIRT) ? c_shirt : (otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_SUIT) ? c_suit : null;
    if (which && (breakarm(game.youmonst.data) || sliparm(game.youmonst.data)) && (which != c_cloak || ((otmp.otyp != MUMMY_WRAPPING) ? game.youmonst.data.msize != 1 : !((((game.youmonst.data).mflags1 & 131072) != 0) && (game.youmonst.data).msize >= 1 && (game.youmonst.data).msize <= 4 && !((game.youmonst.data).mlet == S_GHOST) && (game.youmonst.data).mlet != S_CENTAUR && (game.youmonst.data) != game.mons[PM_WINGED_GARGOYLE] && (game.youmonst.data) != game.mons[PM_MARILITH]))) && (racial_exception(game.youmonst, otmp) < 1)) {
        /* same exception for cloaks as used in m_dowear() */
        if (noisy) {
            pline_The("%s will not fit on your body.", which);
        }
        return 0;
    } else if (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) {
        if (noisy) {
            already_wearing(c_that_);
        }
        return 0;
    }
    if (welded(game.uwep) && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big) && ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_SUIT) || (otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_SHIRT))) {
        if (noisy) {
            You("cannot do that while holding your %s.", (game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER) ? c_sword : c_weapon);
        }
        return 0;
    }
    if ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_HELM)) {
        if (game.uarmh) {
            if (noisy) {
                already_wearing(an(helm_simple_name(game.uarmh)));
            }
            err++;
        } else if ((game.u.umonnum != game.u.umonster) && (num_horns(game.youmonst.data) > 0) && !(game.objects[(otmp).otyp].oc_material <= LEATHER || (otmp).otyp == RUBBER_HOSE)) {
            /* (flimsy exception matches polyself handling) */
            if (noisy) {
                pline_The("%s won't fit over your horn%s.", helm_simple_name(otmp), (((num_horns(game.youmonst.data)) == 1) ? "" : "s"));
            }
            err++;
        } else {
            mask.value = 4;
        }
    } else if ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_SHIELD)) {
        if (game.uarms) {
            if (noisy) {
                already_wearing(an(c_shield));
            }
            err++;
        } else if (game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
            if (noisy) {
                You("cannot wear a shield while wielding a two-handed %s.", (game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER) ? c_sword : (game.uwep.otyp == BATTLE_AXE) ? c_axe : c_weapon);
            }
            err++;
        } else if (game.u.twoweap) {
            if (noisy) {
                You("cannot wear a shield while wielding two weapons.");
            }
            err++;
        } else {
            mask.value = 8;
        }
    } else if ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_BOOTS)) {
        if (game.uarmf) {
            if (noisy) {
                already_wearing(c_boots);
            }
            err++;
        } else if ((game.u.umonnum != game.u.umonster) && (((game.youmonst.data).mflags1 & 524288) != 0)) {
            if (noisy) {
                You("have no feet...");
            }
            err++;
        } else if ((game.u.umonnum != game.u.umonster) && game.youmonst.data.mlet == S_CENTAUR) {
            /* break_armor() pushes boots off for centaurs, so don't let
               dowear() put them back on;
               makeplural(body_part(FOOT)) would yield "rear hooves" here,
               which sounds odd, so use hard-coded "hooves" */
            if (noisy) {
                You("have too many hooves to wear %s.", c_boots);
            }
            err++;
        } else if (game.u.utrap && (game.u.utraptype == TT_BEARTRAP || game.u.utraptype == TT_INFLOOR || game.u.utraptype == TT_LAVA || game.u.utraptype == TT_BURIEDBALL)) {
            if (game.u.utraptype == TT_BEARTRAP) {
                if (noisy) {
                    Your("%s is trapped!", body_part(FOOT));
                }
            } else if (game.u.utraptype == TT_INFLOOR || game.u.utraptype == TT_LAVA) {
                if (noisy) {
                    Your("%s are stuck in the %s!", makeplural(body_part(FOOT)), surface(game.u.ux, game.u.uy));
                }
            } else {
                if (noisy) {
                    Your("%s is attached to the buried ball!", body_part(LEG));
                }
            }
            err++;
        } else {
            mask.value = 32;
        }
    } else if ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_GLOVES)) {
        if (game.uarmg) {
            if (noisy) {
                already_wearing(c_gloves);
            }
            err++;
        } else if (welded(game.uwep)) {
            if (noisy) {
                You("cannot wear gloves over your %s.", (game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER) ? c_sword : c_weapon);
            }
            err++;
        } else if (game.u.uprops[GLIB].intrinsic) {
            /* prevent slippery bare fingers from transferring to
               gloved fingers */
            if (noisy) {
                Your("%s are too slippery to pull on %s.", fingers_or_gloves((0)), gloves_simple_name(otmp));
            }
            err++;
        } else {
            mask.value = 16;
        }
    } else if ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_SHIRT)) {
        if (game.uarm || game.uarmc || game.uarmu) {
            if (game.uarmu) {
                if (noisy) {
                    already_wearing(an(c_shirt));
                }
            } else {
                if (noisy) {
                    You_cant("wear that over your %s.", (game.uarm && !game.uarmc) ? c_armor : cloak_simple_name(game.uarmc));
                }
            }
            err++;
        } else {
            mask.value = 64;
        }
    } else if ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_CLOAK)) {
        if (game.uarmc) {
            if (noisy) {
                already_wearing(an(cloak_simple_name(game.uarmc)));
            }
            err++;
        } else {
            mask.value = 2;
        }
    } else if ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_SUIT)) {
        if (game.uarmc) {
            if (noisy) {
                You("cannot wear armor over a %s.", cloak_simple_name(game.uarmc));
            }
            err++;
        } else if (game.uarm) {
            if (noisy) {
                already_wearing("some armor");
            }
            err++;
        } else {
            mask.value = 1;
        }
    } else {
        /* getobj can't do this after setting its allow_all flag; that
           happens if you have armor for slots that are covered up or
           extra armor for slots that are filled */
        if (noisy) {
            silly_thing("wear", otmp);
        }
        err++;
    }
    /* Unnecessary since now only weapons and special items like pick-axes get
     * welded to your hand, not armor
        if (welded(otmp)) {
            if (!err++) {
                if (noisy) weldmsg(otmp);
            }
        }
     */
    return !err;
}
export function accessory_or_armor_on(obj) {
    let mask = 0;
    let armor = 0;
    let ring = 0;
    let amulet = 0;
    let eyewear = 0;
    if (obj.owornmask & (((131072 | 262144) | 65536 | 524288) | (1 | 2 | 4 | 8 | 16 | 32 | 64))) {
        already_wearing(c_that_);
        return 0;
    }
    armor = (obj.oclass == ARMOR_CLASS);
    ring = (obj.oclass == RING_CLASS || obj.otyp == MEAT_RING);
    amulet = (obj.oclass == AMULET_CLASS);
    eyewear = (obj.otyp == BLINDFOLD || obj.otyp == TOWEL || obj.otyp == LENSES);
    if (armor) {
        /* checks which are performed prior to actually touching the item */
        if (!canwearobj(obj, { get value() { return mask; }, set value(_v) { mask = _v; } }, (1))) {
            return 0;
        }
        if (obj.otyp == HELM_OF_OPPOSITE_ALIGNMENT && (game.dungeon_topology.d_qstart_level).dnum == game.u.uz.dnum) {
            if (game.u.ualignbase[0] == game.u.ualignbase[1]) {
                You("narrowly avoid losing all chance at your goal.");
            } else {
                You("are suddenly overcome with shame and change your mind.");
            }
            /* lose your god's protection */
            game.u.ublessed = 0;
            discover_object((obj.otyp), (1), (1), (1));
            game.disp.botl = (1);
            return 1;
        }
    } else {
        if (ring) {
            /*
         * FIXME:
         *  except for the rings/nolimbs case, this allows you to put on
         *  accessories without having any hands to manipulate them, and
         *  to put them on when poly'd into a tiny or huge form where
         *  they shouldn't fit.  [If the latter situation changes, make
         *  comparable change to break_armor(polyself.c).]
         */
            let answer = 0;
            let qbuf = '';
            let res = 0;
            if ((((game.youmonst.data).mflags1 & 24576) == 24576)) {
                You("cannot make the ring stick to your body.");
                return 0;
            }
            if (game.uleft && game.uright) {
                There("are no more %s%s to fill.", (((game.youmonst.data).mflags1 & 131072) != 0) ? "ring-" : "", fingers_or_gloves((0)));
                return 0;
            }
            if (game.uleft) {
                mask = 262144;
            } else if (game.uright) {
                mask = 131072;
            } else {
                do {
                    qbuf = sprintf(qbuf, "Which %s%s, Right or Left?", (((game.youmonst.data).mflags1 & 131072) != 0) ? "ring-" : "", body_part(FINGER));
                    answer = yn_function(qbuf, rightleftchars, 0, (1));
                    switch (answer) {
                        case 0:
                        case 27:
                            return 0;
                        case 108:
                        case 76:
                            mask = 131072;
                            break;
                        case 114:
                        case 82:
                            mask = 262144;
                            break;
                    }
                } while (!mask);
            }
            /* normally outermost layer is processed first, but slippery gloves
           wears off quickly so uncurse ring itself before handling those */
            if (game.uarmg && game.u.uprops[GLIB].intrinsic) {
                Your("%s are too slippery to remove, so you cannot put on the ring.", gloves_simple_name(game.uarmg));
                return 1;
            }
            if (game.uarmg && game.uarmg.cursed) {
                res = !game.uarmg.bknown;
                set_bknown(game.uarmg, 1);
                You("cannot remove your %s to put on the ring.", c_gloves);
                /* uses move iff we learned gloves are cursed */
                return res ? 1 : 0;
            }
            if (game.uwep) {
                /* check this before calling welded() */
                res = !game.uwep.bknown;
                if (((mask == 262144 && (game.u.uhandedness == 0)) || (mask == 131072 && (game.u.uhandedness == 1)) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) && welded(game.uwep)) {
                    let hand = body_part(HAND);
                    if (((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
                        hand = makeplural(hand);
                    }
                    You("cannot free your weapon %s to put on the ring.", hand);
                    /* uses move iff we learned weapon is cursed */
                    return res ? 1 : 0;
                }
            }
        } else if (amulet) {
            if (game.uamul) {
                already_wearing("an amulet");
                return 0;
            }
        } else if (eyewear) {
            if (!(((game.youmonst.data).mflags1 & 32768) == 0)) {
                You("have no head to wear %s on.", ansimpleoname(obj));
                return 0;
            }
            if (game.ublindf) {
                if (game.ublindf.otyp == TOWEL) {
                    Your("%s is already covered by a towel.", body_part(FACE));
                } else if (game.ublindf.otyp == BLINDFOLD) {
                    if (obj.otyp == LENSES) {
                        already_wearing2("lenses", "a blindfold");
                    } else {
                        already_wearing("a blindfold");
                    }
                } else if (game.ublindf.otyp == LENSES) {
                    if (obj.otyp == BLINDFOLD) {
                        already_wearing2("a blindfold", "some lenses");
                    } else {
                        already_wearing("some lenses");
                    }
                } else {
                    already_wearing(c_common_strings.c_something);
                }
                return 0;
            }
        } else {
            /* neither armor nor accessory */
            You_cant("wear that!");
            return 0;
        }
    }
    if (!retouch_object({ get value() { return obj; }, set value(_v) { obj = _v; } }, (0))) {
        return 1;
    }
    if (armor) {
        /* costs a turn even though it didn't get worn */
        let delay = 0;
        /* if the armor is wielded, release it for wearing (won't be
           welded even if cursed; that only happens for weapons/weptools) */
        if (obj.owornmask & (256 | 1024 | 512)) {
            remove_worn_item(obj, (0));
        }
        /*
         * Setting obj->known=1 is done because setworn() causes hero's AC
         * to change so armor's +/- value is evident via the status line.
         * We used to set it here because of that, but then it would stick
         * if a nymph stole the armor before it was fully worn.  Delay it
         * until the afternmv action.  The player may still know this armor's
         * +/- amount if donning gets interrupted, but the hero won't.
         *
        obj->known = 1;
         */
        /* for WWALKING; Boots_on() is too late */
        game.wasinwater = game.u.uinwater;
        setworn(obj, mask);
        if (obj == game.uarm) {
            game.afternmv = Armor_on;
        } else if (obj == game.uarmh) {
            game.afternmv = Helmet_on;
        } else if (obj == game.uarmg) {
            game.afternmv = Gloves_on;
        } else if (obj == game.uarmf) {
            game.afternmv = Boots_on;
        } else if (obj == game.uarms) {
            game.afternmv = Shield_on;
        } else if (obj == game.uarmc) {
            game.afternmv = Cloak_on;
        } else if (obj == game.uarmu) {
            game.afternmv = Shirt_on;
        /* if there's no delay, we'll execute 'afternmv' immediately */
        } else {
            panic("wearing armor not worn as armor? [%08lx]", obj.owornmask);
        }
        delay = -game.objects[obj.otyp].oc_delay;
        if (delay) {
            nomul(delay);
            game.multi_reason = "dressing up";
            game.nomovemsg = "You finish your dressing maneuver.";
        } else {
            /* call afternmv, clear it+nomovemsg+multi_reason */
            unmul("");
            on_msg(obj);
        }
        /* gw.wasinwater = 0U; // can't clear this yet; Boots_on() needs it
         * and gets called via afternmv() after this routine has returned */
        game.context.takeoff.mask = game.context.takeoff.what = 0;
    } else {
        if (ring) {
            /* Ring_on() expects ring to already be worn as uleft or uright */
            setworn(obj, mask);
            Ring_on(obj);
            /* is_worn(): 'obj' will always be worn here except when putting
               on a ring of levitation while at a sink location */
            if (is_worn(obj)) {
                on_msg(obj);
            }
        } else if (amulet) {
            /* setworn() and on_msg() handled by Amulet_on() */
            Amulet_on(obj);
        } else if (eyewear) {
            /* setworn() and on_msg() handled by Blindf_on() */
            Blindf_on(obj);
        } else {
            impossible("putting on unexpected type of accessory: %s", safe_typename(obj.otyp));
        }
    }
    return 1;
}
/* the #wear command */
export function dowear() {
    let otmp = null;
    if (((game.youmonst.data).msize < 1) || (((game.youmonst.data).mflags1 & 8192) != 0)) {
        /* cantweararm() checks for suits of armor, not what we want here;
       verysmall() or nohands() checks for shields, gloves, etc... */
        pline("Don't even bother.");
        return 0;
    }
    if (game.uarm && game.uarmu && game.uarmc && game.uarmh && game.uarms && game.uarmg && game.uarmf && game.uleft && game.uright && game.uamul && game.ublindf) {
        /* 'W' message doesn't mention accessories */
        You("are already wearing a full complement of armor.");
        return 0;
    }
    otmp = getobj("wear", wear_ok, 0);
    return otmp ? accessory_or_armor_on(otmp) : 2;
}
/* the #puton command */
export function doputon() {
    let otmp = null;
    if (game.uleft && game.uright && game.uamul && game.ublindf && game.uarm && game.uarmu && game.uarmc && game.uarmh && game.uarms && game.uarmg && game.uarmf) {
        /* 'P' message doesn't mention armor */
        Your("%s%s are full, and you're already wearing an amulet and %s.", (((game.youmonst.data).mflags1 & 131072) != 0) ? "ring-" : "", fingers_or_gloves((0)), (game.ublindf.otyp == LENSES) ? "some lenses" : "a blindfold");
        return 0;
    }
    otmp = getobj("put on", puton_ok, 0);
    return otmp ? accessory_or_armor_on(otmp) : 2;
}
/* calculate current armor class */
export function find_ac() {
    /* base armor class for current form */
    let uac = game.mons[game.u.umonnum].ac;
    /* armor class from worn gear */
    if (game.uarm) {
        uac -= (game.objects[(game.uarm).otyp].oc_oc1 + (game.uarm).spe - ((((game.uarm).oeroded > (game.uarm).oeroded2 ? (game.uarm).oeroded : (game.uarm).oeroded2)) < (game.objects[(game.uarm).otyp].oc_oc1) ? (((game.uarm).oeroded > (game.uarm).oeroded2 ? (game.uarm).oeroded : (game.uarm).oeroded2)) : (game.objects[(game.uarm).otyp].oc_oc1)));
    }
    if (game.uarmc) {
        uac -= (game.objects[(game.uarmc).otyp].oc_oc1 + (game.uarmc).spe - ((((game.uarmc).oeroded > (game.uarmc).oeroded2 ? (game.uarmc).oeroded : (game.uarmc).oeroded2)) < (game.objects[(game.uarmc).otyp].oc_oc1) ? (((game.uarmc).oeroded > (game.uarmc).oeroded2 ? (game.uarmc).oeroded : (game.uarmc).oeroded2)) : (game.objects[(game.uarmc).otyp].oc_oc1)));
    }
    if (game.uarmh) {
        uac -= (game.objects[(game.uarmh).otyp].oc_oc1 + (game.uarmh).spe - ((((game.uarmh).oeroded > (game.uarmh).oeroded2 ? (game.uarmh).oeroded : (game.uarmh).oeroded2)) < (game.objects[(game.uarmh).otyp].oc_oc1) ? (((game.uarmh).oeroded > (game.uarmh).oeroded2 ? (game.uarmh).oeroded : (game.uarmh).oeroded2)) : (game.objects[(game.uarmh).otyp].oc_oc1)));
    }
    if (game.uarmf) {
        uac -= (game.objects[(game.uarmf).otyp].oc_oc1 + (game.uarmf).spe - ((((game.uarmf).oeroded > (game.uarmf).oeroded2 ? (game.uarmf).oeroded : (game.uarmf).oeroded2)) < (game.objects[(game.uarmf).otyp].oc_oc1) ? (((game.uarmf).oeroded > (game.uarmf).oeroded2 ? (game.uarmf).oeroded : (game.uarmf).oeroded2)) : (game.objects[(game.uarmf).otyp].oc_oc1)));
    }
    if (game.uarms) {
        uac -= (game.objects[(game.uarms).otyp].oc_oc1 + (game.uarms).spe - ((((game.uarms).oeroded > (game.uarms).oeroded2 ? (game.uarms).oeroded : (game.uarms).oeroded2)) < (game.objects[(game.uarms).otyp].oc_oc1) ? (((game.uarms).oeroded > (game.uarms).oeroded2 ? (game.uarms).oeroded : (game.uarms).oeroded2)) : (game.objects[(game.uarms).otyp].oc_oc1)));
    }
    if (game.uarmg) {
        uac -= (game.objects[(game.uarmg).otyp].oc_oc1 + (game.uarmg).spe - ((((game.uarmg).oeroded > (game.uarmg).oeroded2 ? (game.uarmg).oeroded : (game.uarmg).oeroded2)) < (game.objects[(game.uarmg).otyp].oc_oc1) ? (((game.uarmg).oeroded > (game.uarmg).oeroded2 ? (game.uarmg).oeroded : (game.uarmg).oeroded2)) : (game.objects[(game.uarmg).otyp].oc_oc1)));
    }
    if (game.uarmu) {
        uac -= (game.objects[(game.uarmu).otyp].oc_oc1 + (game.uarmu).spe - ((((game.uarmu).oeroded > (game.uarmu).oeroded2 ? (game.uarmu).oeroded : (game.uarmu).oeroded2)) < (game.objects[(game.uarmu).otyp].oc_oc1) ? (((game.uarmu).oeroded > (game.uarmu).oeroded2 ? (game.uarmu).oeroded : (game.uarmu).oeroded2)) : (game.objects[(game.uarmu).otyp].oc_oc1)));
    }
    if (game.uleft && game.uleft.otyp == RIN_PROTECTION) {
        uac -= game.uleft.spe;
    }
    if (game.uright && game.uright.otyp == RIN_PROTECTION) {
        uac -= game.uright.spe;
    }
    if (game.uamul && game.uamul.otyp == AMULET_OF_GUARDING) {
        uac -= 2;
    }
    /* fixed amount; main benefit is to MC */
    /* armor class from other sources */
    if (game.u.uprops[PROTECTION].intrinsic & (67108864 | 33554432 | 16777216)) {
        uac -= game.u.ublessed;
    }
    uac -= game.u.uspellprot;
    /* put a cap on armor class [5.0: was +127,-128, now reduced to +/- 99 */
    if (abs(uac) > 99) {
        uac = sgn(uac) * 99;
    }
    if (uac != game.u.uac) {
        game.u.uac = uac;
        game.disp.botl = (1);
    }
}
export function glibr() {
    let otmp = null;
    let xfl = 0;
    let leftfall = 0;
    let rightfall = 0;
    let wastwoweap = (0);
    let otherwep = null;
    let thiswep = null;
    let which = null;
    let hand = null;
    leftfall = (game.uleft && !game.uleft.cursed && (!game.uwep || !(welded(game.uwep) && (game.u.uhandedness == 1)) || !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)));
    rightfall = (game.uright && !game.uright.cursed && (!game.uwep || !(welded(game.uwep) && (game.u.uhandedness == 0)) || !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)));
    if (!game.uarmg && (leftfall || rightfall) && !(((game.youmonst.data).mflags1 & 24576) == 24576)) {
        /*
    leftfall = (uleft && !uleft->cursed
                && (!uwep || !welded(uwep) || !bimanual(uwep)));
    rightfall = (uright && !uright->cursed && (!welded(uwep)));
*/
        /* changed so cursed rings don't fall off, GAN 10/30/86 */
        Your("%s off your %s.", (leftfall && rightfall) ? "rings slip" : "ring slips", (leftfall && rightfall) ? fingers_or_gloves((0)) : body_part(FINGER));
        xfl++;
        if (leftfall) {
            otmp = game.uleft;
            Ring_off(game.uleft);
            dropx(otmp);
            cmdq_clear(CQ_CANNED);
        }
        if (rightfall) {
            otmp = game.uright;
            Ring_off(game.uright);
            dropx(otmp);
            cmdq_clear(CQ_CANNED);
        }
    }
    otmp = game.uswapwep;
    if (game.u.twoweap && otmp) {
        /* secondary weapon doesn't need nearly as much handling as
           primary; when in two-weapon mode, we know it's one-handed
           with something else in the other hand and also that it's
           a weapon or weptool rather than something unusual, plus
           we don't need to compare its type with the primary */
        otherwep = (otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[otmp.otyp].oc_subtyp <= P_SABER) ? c_sword : weapon_descr(otmp);
        if (otmp.quan > 1) {
            otherwep = makeplural(otherwep);
        }
        hand = body_part(HAND);
        which = (game.u.uhandedness == 0) ? "left " : "right ";
        Your("%s %s%s from your %s%s.", otherwep, xfl ? "also " : "", otense(otmp, "slip"), which, hand);
        xfl++;
        wastwoweap = (1);
        setuswapwep(null);
        cmdq_clear(CQ_CANNED);
        if (canletgo(otmp, "")) {
            dropx(otmp);
        }
    }
    otmp = game.uwep;
    if (otmp && otmp.otyp != AKLYS && !welded(otmp)) {
        let savequan = otmp.quan;
        /* nice wording if both weapons are the same type */
        thiswep = (otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[otmp.otyp].oc_subtyp <= P_SABER) ? c_sword : weapon_descr(otmp);
        if (otherwep && strcmp(thiswep, makesingular(otherwep))) {
            otherwep = null;
        }
        if (otmp.quan > 1) {
            if (!strcmp(thiswep, "food")) {
                otmp.quan = 1;
            /* most class names for unconventional wielded items
               are ok, but if wielding multiple apples or rations
               we don't want "your foods slip", so force non-corpse
               food to be singular; skipping makeplural() isn't
               enough--we need to fool otense() too */
            } else {
                thiswep = makeplural(thiswep);
            }
        }
        hand = body_part(HAND);
        which = "";
        if (((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_big)) {
            hand = makeplural(hand);
        } else if (wastwoweap) {
            /* preceding msg was about non-dominant hand */
            which = (game.u.uhandedness == 0) ? "right " : "left ";
        }
        pline("%s %s%s %s%s from your %s%s.", !strncmp(thiswep, "corpse", 6) ? "The" : "Your", otherwep ? "other " : "", thiswep, xfl ? "also " : "", otense(otmp, "slip"), which, hand);
        otmp.quan = savequan;
        setuwep(null);
        cmdq_clear(CQ_CANNED);
        if (canletgo(otmp, "")) {
            dropx(otmp);
        }
    }
}
export function some_armor(victim) {
    let otmph = null;
    let otmp = null;
    otmph = (victim == game.youmonst) ? game.uarmc : which_armor(victim, 2);
    if (!otmph) {
        otmph = (victim == game.youmonst) ? game.uarm : which_armor(victim, 1);
    }
    if (!otmph) {
        otmph = (victim == game.youmonst) ? game.uarmu : which_armor(victim, 64);
    }
    otmp = (victim == game.youmonst) ? game.uarmh : which_armor(victim, 4);
    if (otmp && (!otmph || !rn2(4))) {
        otmph = otmp;
    }
    otmp = (victim == game.youmonst) ? game.uarmg : which_armor(victim, 16);
    if (otmp && (!otmph || !rn2(4))) {
        otmph = otmp;
    }
    otmp = (victim == game.youmonst) ? game.uarmf : which_armor(victim, 32);
    if (otmp && (!otmph || !rn2(4))) {
        otmph = otmp;
    }
    otmp = (victim == game.youmonst) ? game.uarms : which_armor(victim, 8);
    if (otmp && (!otmph || !rn2(4))) {
        otmph = otmp;
    }
    return otmph;
}
/* used for praying to check and fix levitation trouble */
export function stuck_ring(ring, otyp) {
    if (ring != game.uleft && ring != game.uright) {
        impossible("stuck_ring: neither left nor right?");
        /* either no ring or not right type or nothing prevents its removal */
        return null;
    }
    if (ring && ring.otyp == otyp) {
        /* reasons ring can't be removed match those checked by select_off();
           limbless case has extra checks because ordinarily it's temporary */
        if ((((game.youmonst.data).mflags1 & 24576) == 24576) && game.uamul && game.uamul.otyp == AMULET_OF_UNCHANGING && game.uamul.cursed) {
            return game.uamul;
        }
        if (welded(game.uwep) && ((ring == ((game.u.uhandedness == 1) ? game.uleft : game.uright)) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big))) {
            return game.uwep;
        }
        if (game.uarmg && game.uarmg.cursed) {
            return game.uarmg;
        }
        if (ring.cursed) {
            return ring;
        }
        if (game.uarmg && game.u.uprops[GLIB].intrinsic) {
            return game.uarmg;
        }
    }
    return null;
}
/* also for praying; find worn item that confers "Unchanging" attribute */
export function unchanger() {
    if (game.uamul && game.uamul.otyp == AMULET_OF_UNCHANGING) {
        return game.uamul;
    }
    return null;
}
export function select_off(otmp) {
    let why = null;
    let buf = '';
    if (!otmp) {
        return 0;
    }
    buf = '';
    if (otmp == game.uright || otmp == game.uleft) {
        let glibdummy = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
        if ((((game.youmonst.data).mflags1 & 24576) == 24576)) {
            pline_The("ring is stuck.");
            return 0;
        }
        Object.assign(glibdummy, cg.zeroobj);
        /* the item which prevents ring removal */
        /* special suit and shirt checks */
        /* the item which prevents disrobing */
        why = null;
        if (welded(game.uwep) && ((otmp == ((game.u.uhandedness == 1) ? game.uleft : game.uright)) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big))) {
            buf = sprintf(buf, "free a weapon %s", body_part(HAND));
            why = game.uwep;
        } else if (game.uarmg && (game.uarmg.cursed || game.u.uprops[GLIB].intrinsic)) {
            buf = sprintf(buf, "take off your %s%s", game.u.uprops[GLIB].intrinsic ? "slippery " : "", gloves_simple_name(game.uarmg));
            why = !game.u.uprops[GLIB].intrinsic ? game.uarmg : glibdummy;
        }
        if (why) {
            You("cannot %s to remove the ring.", buf);
            set_bknown(why, 1);
            return 0;
        }
    }
    if (otmp == game.uarmg) {
        if (welded(game.uwep)) {
            You("are unable to take off your %s while wielding that %s.", c_gloves, (game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER) ? c_sword : c_weapon);
            set_bknown(game.uwep, 1);
            return 0;
        } else if (game.u.uprops[GLIB].intrinsic) {
            pline("%s %s are too slippery to take off.", game.uarmg.unpaid ? "The" : "Your", gloves_simple_name(game.uarmg));
            return 0;
        }
        if (better_not_take_that_off(otmp)) {
            return 0;
        }
    }
    if (otmp == game.uarmf) {
        if (game.u.utrap && game.u.utraptype == TT_BEARTRAP) {
            pline_The("bear trap prevents you from pulling your %s out.", body_part(FOOT));
            return 0;
        } else if (game.u.utrap && game.u.utraptype == TT_INFLOOR) {
            You("are stuck in the %s, and cannot pull your %s out.", surface(game.u.ux, game.u.uy), makeplural(body_part(FOOT)));
            return 0;
        }
    }
    if (otmp == game.uarm || otmp == game.uarmu) {
        why = null;
        if (game.uarmc && game.uarmc.cursed) {
            buf = sprintf(buf, "remove your %s", cloak_simple_name(game.uarmc));
            why = game.uarmc;
        } else if (otmp == game.uarmu && game.uarm && game.uarm.cursed) {
            buf = sprintf(buf, "remove your %s", c_suit);
            why = game.uarm;
        } else if (welded(game.uwep) && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
            buf = sprintf(buf, "release your %s", (game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER) ? c_sword : (game.uwep.otyp == BATTLE_AXE) ? c_axe : c_weapon);
            why = game.uwep;
        }
        if (why) {
            You("cannot %s to take off %s.", buf, the(xname(otmp)));
            set_bknown(why, 1);
            return 0;
        }
    }
    if (otmp == game.uquiver || (otmp == game.uswapwep && !game.u.twoweap)) {
        ;
    } else {
        /* otherwise, this is fundamental */
        if (cursed(otmp)) {
            return 0;
        }
    }
    if (otmp == game.uarm) {
        game.context.takeoff.mask |= 1;
    } else if (otmp == game.uarmc) {
        game.context.takeoff.mask |= 2;
    } else if (otmp == game.uarmf) {
        game.context.takeoff.mask |= 32;
    } else if (otmp == game.uarmg) {
        game.context.takeoff.mask |= 16;
    } else if (otmp == game.uarmh) {
        game.context.takeoff.mask |= 4;
    } else if (otmp == game.uarms) {
        game.context.takeoff.mask |= 8;
    } else if (otmp == game.uarmu) {
        game.context.takeoff.mask |= 64;
    } else if (otmp == game.uleft) {
        game.context.takeoff.mask |= 131072;
    } else if (otmp == game.uright) {
        game.context.takeoff.mask |= 262144;
    } else if (otmp == game.uamul) {
        game.context.takeoff.mask |= 65536;
    } else if (otmp == game.ublindf) {
        game.context.takeoff.mask |= 524288;
    } else if (otmp == game.uwep) {
        game.context.takeoff.mask |= 256;
    } else if (otmp == game.uswapwep) {
        game.context.takeoff.mask |= 1024;
    } else if (otmp == game.uquiver) {
        game.context.takeoff.mask |= 512;
    } else {
        impossible("select_off: %s???", doname(otmp));
    }
    return 0;
}
export function do_takeoff() {
    let otmp = null;
    let was_twoweap = game.u.twoweap;
    let doff = game.context.takeoff;
    /* set flag for cancel_doff() */
    game.context.takeoff.mask |= 536870912;
    if (doff.what == 256) {
        if (!cursed(game.uwep)) {
            setuwep(null);
            if (was_twoweap) {
                You("are no longer wielding either weapon.");
            } else {
                You("are %s.", empty_handed());
            }
        }
    } else if (doff.what == 1024) {
        setuswapwep(null);
        You("%sno longer %s.", was_twoweap ? "are " : "", was_twoweap ? "wielding two weapons at once" : "have a second weapon readied");
    } else if (doff.what == 512) {
        setuqwep(null);
        You("no longer have ammunition readied.");
    } else if (doff.what == 1) {
        otmp = game.uarm;
        if (!cursed(otmp)) {
            Armor_off();
        }
    } else if (doff.what == 2) {
        otmp = game.uarmc;
        if (!cursed(otmp)) {
            Cloak_off();
        }
    } else if (doff.what == 32) {
        otmp = game.uarmf;
        if (!cursed(otmp)) {
            Boots_off();
        }
    } else if (doff.what == 16) {
        otmp = game.uarmg;
        if (!cursed(otmp)) {
            Gloves_off();
        }
    } else if (doff.what == 4) {
        otmp = game.uarmh;
        if (!cursed(otmp)) {
            Helmet_off();
        }
    } else if (doff.what == 8) {
        otmp = game.uarms;
        if (!cursed(otmp)) {
            Shield_off();
        }
    } else if (doff.what == 64) {
        otmp = game.uarmu;
        if (!cursed(otmp)) {
            Shirt_off();
        }
    } else if (doff.what == 65536) {
        otmp = game.uamul;
        if (!cursed(otmp)) {
            Amulet_off();
        }
    } else if (doff.what == 131072) {
        otmp = game.uleft;
        if (!cursed(otmp)) {
            Ring_off(game.uleft);
        }
    } else if (doff.what == 262144) {
        otmp = game.uright;
        if (!cursed(otmp)) {
            Ring_off(game.uright);
        }
    } else if (doff.what == 524288) {
        if (!cursed(game.ublindf)) {
            Blindf_off(game.ublindf);
        }
    } else {
        impossible("do_takeoff: taking off %lx", doff.what);
    }
    /* clear cancel_doff() flag */
    game.context.takeoff.mask &= ~536870912;
    return otmp;
}
/* occupation callback for 'A' */
export function take_off() {
    let i = 0;
    let otmp = null;
    let doff = game.context.takeoff;
    if (doff.what) {
        if (doff.delay > 0) {
            doff.delay--;
            return 1;
        }
        if ((otmp = do_takeoff()) != null) {
            off_msg(otmp);
        }
        doff.mask &= ~doff.what;
        doff.what = 0;
    }
    for (i = 0; takeoff_order[i]; i++) {
        if (doff.mask & takeoff_order[i]) {
            doff.what = takeoff_order[i];
            break;
        }
    }
    otmp = null;
    doff.delay = 0;
    if (doff.what == 0) {
        You("finish %s.", doff.disrobing);
        return 0;
    } else if (doff.what == 256) {
        /* [this used to be 2, but 'R' (and 'T') only require 1 turn to
           remove a blindfold, so 'A' shouldn't have been requiring 2] */
        doff.delay = 1;
    } else if (doff.what == 1024) {
        doff.delay = 1;
    } else if (doff.what == 512) {
        doff.delay = 1;
    } else if (doff.what == 1) {
        otmp = game.uarm;
        /* If a cloak is being worn, add the time to take it off and put
         * it back on again.  Kludge alert! since that time is 0 for all
         * known cloaks, add 1 so that it actually matters...
         */
        if (game.uarmc) {
            doff.delay += 2 * game.objects[game.uarmc.otyp].oc_delay + 1;
        }
    } else if (doff.what == 2) {
        otmp = game.uarmc;
    } else if (doff.what == 32) {
        otmp = game.uarmf;
    } else if (doff.what == 16) {
        otmp = game.uarmg;
    } else if (doff.what == 4) {
        otmp = game.uarmh;
    } else if (doff.what == 8) {
        otmp = game.uarms;
    } else if (doff.what == 64) {
        otmp = game.uarmu;
        /* add the time to take off and put back on armor and/or cloak */
        if (game.uarm) {
            doff.delay += 2 * game.objects[game.uarm.otyp].oc_delay;
        }
        if (game.uarmc) {
            doff.delay += 2 * game.objects[game.uarmc.otyp].oc_delay + 1;
        }
    } else if (doff.what == 65536) {
        doff.delay = 1;
    } else if (doff.what == 131072) {
        doff.delay = 1;
    } else if (doff.what == 262144) {
        doff.delay = 1;
    } else if (doff.what == 524288) {
        doff.delay = 1;
    } else {
        impossible("take_off: taking off %lx", doff.what);
        return 0;
    }
    if (otmp) {
        doff.delay += game.objects[otmp.otyp].oc_delay;
    }
    /* Since setting the occupation now starts the counter next move, that
     * would always produce a delay 1 too big per item unless we subtract
     * 1 here to account for it.
     */
    if (doff.delay > 0) {
        doff.delay--;
    }
    set_occupation(take_off, doff.disrobing, 0);
    return 1;
}
export function better_not_take_that_off(otmp) {
    let corpse = carrying_stoning_corpse();
    let buf = '';
    if (corpse && !u_safe_from_fatal_corpse(corpse, st_corpse | st_petrifies)) {
        buf = nh_snprintf("better_not_take_that_off", 3006, buf, 256 /* sizeof(char [256]) */, "Take off your %s despite carrying a dead %s?", gloves_simple_name(otmp), obj_pmname(corpse));
        /* u_safe_from_fatal_corpse() with
       (st_corpse | st_petrifies | st_resists) instead of
       (st_corpse | st_petrifies)
       would also check for no stoning resistance before
       bothering to prompt, but losing stoning resistance
       later, without the gloves on could prove dangerous,
       so we won't factor that in */
        return (paranoid_ynq((1), buf, (0)) != 121);
    }
    return (0);
}
/* clear saved context to avoid inappropriate resumption of interrupted 'A' */
export function reset_remarm() {
    game.context.takeoff.what = game.context.takeoff.mask = 0;
    game.context.takeoff.disrobing[0] = 0;
}
/* the #takeoffall command -- remove multiple worn items */
export function doddoremarm() {
    let result = 0;
    if (game.context.takeoff.what || game.context.takeoff.mask) {
        You("continue %s.", game.context.takeoff.disrobing);
        set_occupation(take_off, game.context.takeoff.disrobing, 0);
        return 0;
    } else if (!game.uwep && !game.uswapwep && !game.uquiver && !game.uamul && !game.ublindf && !game.uleft && !game.uright && !wearing_armor()) {
        You("are not wearing anything.");
        return 0;
    }
    add_valid_menu_class(0);
    if (game.flags.menu_style != 0 || (result = ggetobj("take off", select_off, 0, (0), null)) < -1) {
        menu_remarm(result);
    }
    if (game.context.takeoff.mask) {
        game.context.takeoff.disrobing = strncpy(game.context.takeoff.disrobing, (((game.context.takeoff.mask & ~(256 | 1024 | 512)) != 0) ? "disrobing" : "disarming"), 30);
        take_off();
    }
    return 0;
}
/* #altunwield - just unwield alternate weapon, item-action '-' when picking
   uswapwep from context-sensitive inventory */
export function remarm_swapwep() {
    let cq = { typ: 0, key: 0, dirx: 0, diry: 0, dirz: 0, intval: 0, ec_entry: null, next: null };
    let cmdq = null;
    let oldbknown = 0;
    if ((cmdq = cmdq_pop()) != null) {
        /* '-' uswapwep item-action picked from context-sensitive invent */
        Object.assign(cq, cmdq);
        free(cmdq);
    } else {
        cq.typ = CMDQ_KEY;
        /* something other than '-' */
        cq.key = 0;
    }
    if (cq.typ != CMDQ_KEY || cq.key != 45 || !game.uswapwep) {
        return 4;
    }
    /* when deciding whether this command
                                   * has done something that takes time,
                                   * behave as if a cursed secondary weapon
                                   * can't be unwielded even though things
                                   * don't work that way... */
    oldbknown = game.uswapwep.bknown;
    reset_remarm();
    game.context.takeoff.what = game.context.takeoff.mask = 1024;
    do_takeoff();
    return (!game.uswapwep || game.uswapwep.bknown != oldbknown) ? 1 : 0;
}
export function menu_remarm(retry) {
    let n = 0;
    let i = 0;
    let pick_list = null;
    let all_worn_categories = (1);
    if (retry) {
        all_worn_categories = (retry == -2);
    } else if (game.flags.menu_style == 2) {
        all_worn_categories = (0);
        n = query_category("What type of things do you want to take off?", game.invent, (16 | 32 | 4 | ((256 | 512 | 1024) | 2048)), { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2);
        if (!n) {
            return 0;
        }
        for (i = 0; i < n; i++) {
            if (pick_list[i].item.a_int == -2) {
                all_worn_categories = (1);
            } else {
                add_valid_menu_class(pick_list[i].item.a_int);
            }
        }
        free(pick_list);
    } else if (game.flags.menu_style == 1) {
        let ggofeedback = 0;
        i = ggetobj("take off", select_off, 0, (1), { get value() { return ggofeedback; }, set value(_v) { ggofeedback = _v; } });
        if (ggofeedback & 1) {
            return 0;
        }
        all_worn_categories = (i == -2);
    }
    if (menu_class_present(117) || menu_class_present(66) || menu_class_present(85) || menu_class_present(67) || menu_class_present(88)) {
        all_worn_categories = (0);
    }
    n = query_objlist("What do you want to take off?", game.invent, (32 | 8 | 16), { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2, all_worn_categories ? is_worn : is_worn_by_type);
    if (n > 0) {
        for (i = 0; i < n; i++) {
            select_off(pick_list[i].item.a_obj);
        }
        free(pick_list);
    } else if (n < 0 && game.flags.menu_style != 1) {
        There("is nothing else you can remove or unwield.");
    }
    return 0;
}
/* take off the specific worn object and if it still exists after that,
   destroy it (taking off the item might already destroy it by dunking
   hero into lava) */
export function wornarm_destroyed(wornarm) {
    let invobj = null;
    let nextobj = null;
    let wornoid = wornarm.o_id;
    /* cancel_don() resets 'afternmv' when appropriate but doesn't reset
       uarmc/uarm/&c so doing this now won't interfere with the tests in
       'if (wornarm==uarmc) ... else if (wornarm==uarm) ... else ...' */
    if (donning(wornarm)) {
        cancel_don();
    }
    if (wornarm == game.uarmc) {
        Cloak_off();
    } else if (wornarm == game.uarm) {
        Armor_off();
    } else if (wornarm == game.uarmu) {
        Shirt_off();
    } else if (wornarm == game.uarmh) {
        Helmet_off();
    } else if (wornarm == game.uarmg) {
        Gloves_off();
    } else if (wornarm == game.uarmf) {
        Boots_off();
    } else if (wornarm == game.uarms) {
        Shield_off();
    }
    for (invobj = game.invent; invobj; invobj = nextobj) {
        /* 'wornarm' might be destroyed as a side-effect of xxx_off() so
       using carried() to check wornarm->where==OBJ_INVENT is not viable;
       scan invent instead; if already freed it shouldn't be possible to
       have re-used the stale memory for a new item yet but verify o_id
       just in case */
        nextobj = invobj.nobj;
        if (invobj == wornarm && invobj.o_id == wornoid) {
            useup(wornarm);
            break;
        }
    }
}
/*
 * returns impacted armor with its in_use bit set,
 * or Null. *resisted is updated to reflect whether
 * it resisted or not */
export function maybe_destroy_armor(armor, atmp, resisted) {
    if ((armor != null) && (!atmp || atmp == armor) && ((resisted.value = obj_resists(armor, 0, 90)) == (0))) {
        armor.in_use = 1;
        return armor;
    }
    return null;
}
/* hit by destroy armor scroll/black dragon breath */
export function disintegrate_arm(atmp) {
    let otmp = null;
    let losing_gloves = (0);
    let resisted = (0);
    let resistedc = (0);
    let resistedsuit = (0);
    if ((otmp = maybe_destroy_armor(game.uarmc, atmp, { get value() { return resistedc; }, set value(_v) { resistedc = _v; } })) != null) {
        /*
     * Note: if the cloak resisted, then the suit or shirt underneath
     * wouldn't be impacted either. Likewise, if the suit resisted, the
     * shirt underneath wouldn't be impacted. Since there are no artifact
     * cloaks or suits right now, this is unlikely to come into effect,
     * but it should behave appropriately if/when the situation changes.
     */
        urgent_pline("Your %s crumbles and turns to dust!", cloak_simple_name(otmp));
    } else if (!resistedc && (otmp = maybe_destroy_armor(game.uarm, atmp, { get value() { return resistedsuit; }, set value(_v) { resistedsuit = _v; } })) != null) {
        /* cloak/robe/apron/smock (ID'd apron)/wrapping */
        let suit = suit_simple_name(otmp);
        /* for gold DSM, we don't want Armor_gone() to report that it
           stops shining _after_ we've been told that it is destroyed */
        if (otmp.lamplit) {
            end_burn(otmp, (0));
        }
        urgent_pline("Your %s %s to dust and %s to the %s!", suit, vtense(suit, "turn"), vtense(suit, "fall"), surface(game.u.ux, game.u.uy));
    } else if (!resistedc && !resistedsuit && (otmp = maybe_destroy_armor(game.uarmu, atmp, { get value() { return resisted; }, set value(_v) { resisted = _v; } })) != null) {
        /* suit might be "dragon scales" so vtense() is needed */
        urgent_pline("Your %s crumbles into tiny threads and falls apart!", shirt_simple_name(otmp));
    } else if ((otmp = maybe_destroy_armor(game.uarmh, atmp, { get value() { return resisted; }, set value(_v) { resisted = _v; } })) != null) {
        urgent_pline("Your %s turns to dust and is blown away!", helm_simple_name(otmp));
    } else if ((otmp = maybe_destroy_armor(game.uarmg, atmp, { get value() { return resisted; }, set value(_v) { resisted = _v; } })) != null) {
        urgent_pline("Your %s vanish!", gloves_simple_name(otmp));
        losing_gloves = (1);
    } else if ((otmp = maybe_destroy_armor(game.uarmf, atmp, { get value() { return resisted; }, set value(_v) { resisted = _v; } })) != null) {
        urgent_pline("Your %s disintegrate!", boots_simple_name(otmp));
    } else if ((otmp = maybe_destroy_armor(game.uarms, atmp, { get value() { return resisted; }, set value(_v) { resisted = _v; } })) != null) {
        urgent_pline("Your %s crumbles away!", shield_simple_name(otmp));
    } else {
        return 0;
    }
    /* cancel_don() if applicable, Cloak_off()/Armor_off()/&c, and useup() */
    wornarm_destroyed(otmp);
    /* glove loss means wielded weapon will be touched */
    if (losing_gloves) {
        selftouch("You");
    }
    stop_occupation();
    return 1;
}
/* return ERODE_foo erosion type which can apply to object */
export function obj_erode_type(otmp) {
    if (is_flammable(otmp)) {
        return 0;
    } else if ((game.objects[otmp.otyp].oc_material == IRON)) {
        return 1;
    } else if ((game.objects[(otmp).otyp].oc_material == GLASS && (otmp).oclass == ARMOR_CLASS)) {
        return 4;
    } else if (is_rottable(otmp)) {
        return 2;
    } else if ((game.objects[otmp.otyp].oc_material == COPPER || game.objects[otmp.otyp].oc_material == IRON)) {
        return 3;
    }
    return -1;
}
/* erode a number of worn armor(s).
   if the armor is hit when max eroded, destroys it. */
export function destroy_arm() {
    let armors = [null, null, null, null, null, null, null];
    let otmp = null;
    let i = 0;
    let idx = 0;
    let hits = rn2(4) + 1;
    let ret = 0;
    /* gather worn armor; include non-erodeable ones */
    if (game.uarm) {
        armors[idx++] = game.uarm;
    }
    if (game.uarmc) {
        armors[idx++] = game.uarmc;
    }
    if (game.uarmh) {
        armors[idx++] = game.uarmh;
    }
    if (game.uarms) {
        armors[idx++] = game.uarms;
    }
    if (game.uarmg) {
        armors[idx++] = game.uarmg;
    }
    if (game.uarmf) {
        armors[idx++] = game.uarmf;
    }
    if (game.uarmu) {
        armors[idx++] = game.uarmu;
    }
    if (!idx) {
        return 0;
    }
    for (i = 0; i < hits; i++) {
        otmp = armors[rn2(idx)];
        if (erosion_matters(otmp) && ((game.objects[otmp.otyp].oc_material == IRON) || is_flammable(otmp) || is_rottable(otmp) || (game.objects[otmp.otyp].oc_material == COPPER || game.objects[otmp.otyp].oc_material == IRON) || (game.objects[(otmp).otyp].oc_material == GLASS && (otmp).oclass == ARMOR_CLASS)) && !otmp.oerodeproof) {
            let erosion = obj_erode_type(otmp);
            if (erosion != -1) {
                let r = erode_obj(otmp, xname(otmp), erosion, 8 | 2);
                if (r != 0) {
                    ret = 1;
                }
                if (r == 3) {
                    break;
                }
            }
        }
    }
    if (ret) {
        stop_occupation();
    }
    return ret;
}
export function adj_abon(otmp, delta) {
    if (game.uarmg && game.uarmg == otmp && otmp.otyp == GAUNTLETS_OF_DEXTERITY) {
        if (delta) {
            discover_object((game.uarmg.otyp), (1), (1), (1));
            (game.u.abon.a[A_DEX]) += (delta);
        }
        game.disp.botl = (1);
    }
    if (game.uarmh && game.uarmh == otmp && otmp.otyp == HELM_OF_BRILLIANCE) {
        if (delta) {
            discover_object((game.uarmh.otyp), (1), (1), (1));
            (game.u.abon.a[A_INT]) += (delta);
            (game.u.abon.a[A_WIS]) += (delta);
        }
        game.disp.botl = (1);
    }
}
/* decide whether a worn item is covered up by some other worn item,
   used for dipping into liquid and applying grease and takeoff_ok();
   some criteria are different than select_off()'s */
/* "dip" or "grease", or null to avoid messages */
/* ignore covering unless it is known to
                                   * be cursed */
const __inaccessible_equipment_need_to_take_off_outer_armor = "need to take off %s to %s %s.";
export function inaccessible_equipment(obj, verb, only_if_known_cursed) {
    let buf = '';
    let anycovering = !only_if_known_cursed;
    if (!obj || !obj.owornmask) {
        return (0);
    }
    if (obj == game.uarm && game.uarmc && (anycovering || ((game.uarmc).cursed && (game.uarmc).bknown))) {
        if (verb) {
            buf = strcpy(buf, yname(game.uarmc));
            /* check for suit covered by cloak */
            /* check for ring covered by gloves */
            You(__inaccessible_equipment_need_to_take_off_outer_armor, buf, verb, yname(obj));
        }
        return (1);
    }
    if (obj == game.uarmu && ((game.uarm && (anycovering || ((game.uarm).cursed && (game.uarm).bknown))) || (game.uarmc && (anycovering || ((game.uarmc).cursed && (game.uarmc).bknown))))) {
        if (verb) {
            /* check for shirt covered by suit and/or cloak */
            let cloaktmp = '';
            let suittmp = '';
            /* if sameprefix, use yname and xname to get "your cloak and suit"
               or "Manlobbi's cloak and suit"; otherwise, use yname and yname
               to get "your cloak and Manlobbi's suit" or vice versa */
            let sameprefix = (game.uarm && game.uarmc && !strcmp(shk_your(cloaktmp, game.uarmc), shk_your(suittmp, game.uarm)));
            buf = '';
            if (game.uarmc) {
                buf = strcat(buf, yname(game.uarmc));
            }
            if (game.uarm && game.uarmc) {
                buf = strcat(buf, " and ");
            }
            if (game.uarm) {
                buf = strcat(buf, sameprefix ? xname(game.uarm) : yname(game.uarm));
            }
            You(__inaccessible_equipment_need_to_take_off_outer_armor, buf, verb, yname(obj));
        }
        return (1);
    }
    if ((obj == game.uleft || obj == game.uright) && game.uarmg && (anycovering || ((game.uarmg).cursed && (game.uarmg).bknown))) {
        if (verb) {
            buf = strcpy(buf, yname(game.uarmg));
            You(__inaccessible_equipment_need_to_take_off_outer_armor, buf, verb, yname(obj));
        }
        return (1);
    }
    return (0);
}
/* not a getobj callback - unifies code among the other 4 getobj callbacks */
export function equip_ok(obj, removing, accessory) {
    let is_worn = 0;
    let dummymask = 0;
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    /* ignore for putting on if already worn, or removing if not worn */
    is_worn = ((obj.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288))) != 0);
    if (removing ^ is_worn) {
        return GETOBJ_EXCLUDE_INACCESS;
    }
    if (obj.oclass != ARMOR_CLASS && obj.oclass != RING_CLASS && obj.oclass != AMULET_CLASS) {
        /* exclude most object classes outright */
        /* ... except for a few wearable exceptions outside these classes */
        if (obj.otyp != MEAT_RING && obj.otyp != BLINDFOLD && obj.otyp != TOWEL && obj.otyp != LENSES) {
            return GETOBJ_EXCLUDE;
        }
    }
    /* armor with 'P' or 'R' or accessory with 'W' or 'T' */
    if (accessory ^ (obj.oclass != ARMOR_CLASS)) {
        return GETOBJ_DOWNPLAY;
    }
    /* armor we can't wear, e.g. from polyform */
    if (obj.oclass == ARMOR_CLASS && !removing && !canwearobj(obj, { get value() { return dummymask; }, set value(_v) { dummymask = _v; } }, (0))) {
        return GETOBJ_DOWNPLAY;
    }
    if (removing && !game.item_action_in_progress) {
        /* Possible extension: downplay items (both accessories and armor) which
     * can't be worn because the slot is filled with something else. */
        /* removing inaccessible equipment */
        if (inaccessible_equipment(obj, null, (obj.oclass == RING_CLASS))) {
            return GETOBJ_EXCLUDE_INACCESS;
        }
    }
    return GETOBJ_SUGGEST;
}
/* getobj callback for P command */
export function puton_ok(obj) {
    return equip_ok(obj, (0), (1));
}
/* getobj callback for R command */
export function remove_ok(obj) {
    return equip_ok(obj, (1), (1));
}
/* getobj callback for W command */
export function wear_ok(obj) {
    return equip_ok(obj, (0), (0));
}
/* getobj callback for T command */
export function takeoff_ok(obj) {
    return equip_ok(obj, (1), (0));
}
/* getobj callback for blessed destroy armor.
   suggest any worn armor, even if covered by other armor */
export function any_worn_armor_ok(obj) {
    if (obj && (obj.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64))) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_EXCLUDE;
}
/* number of armor pieces worn by hero */
export function count_worn_armor() {
    let ret = 0;
    if (game.uarm) {
        ret++;
    }
    if (game.uarmc) {
        ret++;
    }
    if (game.uarmh) {
        ret++;
    }
    if (game.uarms) {
        ret++;
    }
    if (game.uarmg) {
        ret++;
    }
    if (game.uarmf) {
        ret++;
    }
    if (game.uarmu) {
        ret++;
    }
    return ret;
}
/*do_wear.c*/
/* need to update ability before calling see_monsters() */
/* changing alignment can toggle off active artifact
           properties, including levitation; uarmh could get
           dropped or destroyed here */
/* usually learn enchantment and discover type;
           won't happen if ring is unseen or if it's +0
           and the type hasn't been discovered yet */
/* might have been put on while blind and we can now see
           or perhaps been forgotten due to amnesia */
/* if you're no longer protected, let the chameleons change
           shape again; however, might still be protected if wearing
           2nd ring of this type (or via #wizintrinsic) */
/* these 1-turn items don't need 'ga.afternmv' checks */
/* default item iff Naccessories is 1 */
/* for weapon, we'll only get here via 'A )' */
/* some items can be removed even when cursed */
/* default activity for armor and/or accessories,
                           possibly combined with weapons */
/* specific activity when handling weapons only */
