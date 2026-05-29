/* NetHack 5.0	eat.c	$NHDT-Date: 1740534854 2025/02/25 17:54:14 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.344 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strcmp, strcpy, strlen, strncmpi } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { o_unleash, tinnable } from './apply.js';
import { retouch_equipment, retouch_object, touch_artifact } from './artifact.js';
import { acurr, acurrstr, adjalign, adjattrib, change_luck, exercise, gainstr, poison_strdmg, setuhpmax } from './attrib.js';
import { bot } from './botl.js';
import { paranoid_query, set_occupation, yn_function } from './cmd.js';
import { is_ice, is_pool_or_lava } from './dbridge.js';
import { c_color_names, c_common_strings, sa_victual, ynchars, ynqchars } from './decl.js';
import { canseemon, curs_on_u, newsym, see_monsters, sensemon, set_mimic_blocking } from './display.js';
import { donull, dropx, dropy, heal_legs, revive_corpse, trycall } from './do.js';
import { Mgender, Monnam, hcolor, mon_nam, pmname, rndmonnam } from './do_name.js';
import { Ring_gone, fingers_or_gloves, toggle_displacement } from './do_wear.js';
import { on_level, surface } from './dungeon.js';
import { delayed_killer, done } from './end.js';
import { can_reach_floor } from './engrave.js';
import { more_experienced, newexplevel, pluslvl } from './exper.js';
import { explode } from './explode.js';
import { check_capacity, end_running, inv_cnt, losehp, near_capacity, nomul, rounddiv, still_chewing, unmul } from './hack.js';
import { dist2, eos, s_suffix } from './hacklib.js';
import { addinv_nomerge, carrying, feel_cockatrice, freeinv, g_at, getobj, obj_here, stackobj, useup, useupall, useupf, will_feel_cockatrice } from './invent.js';
import { bcsign, costly_alteration, is_flammable, is_rottable, mksobj, obj_extract_self, peek_at_iced_corpse_age, set_bknown, splitobj, weight } from './mkobj.js';
import { iter_mons, mondied, monstone, pm_to_cham, rescham } from './mon.js';
import { attacktype, attacktype_fordmg, cantvomit, defended, dmgtype, olfaction, poly_when_stoned, same_race } from './mondata.js';
import { monflee } from './monmove.js';
import { ACID_RES, AGGRAVATE_MONSTER, ALTAR, AMULET_CLASS, AMULET_OF_CHANGE, AMULET_OF_FLYING, AMULET_OF_GUARDING, AMULET_OF_LIFE_SAVING, AMULET_OF_REFLECTION, AMULET_OF_RESTFUL_SLEEP, AMULET_OF_STRANGULATION, AMULET_OF_UNCHANGING, AMULET_OF_YENDOR, APPLE, ART_ORB_OF_DETECTION, ATHAME, AXE, A_CHA, A_CON, A_DEX, A_INT, A_STR, A_WIS, BALL_CLASS, BEARTRAP, BEAR_TRAP, BLINDED, BONE, CANDY_BAR, CARROT, CHAIN_CLASS, CHOKING, CLOVE_OF_GARLIC, COIN_CLASS, COLD_RES, CONFLICT, CONFUSION, CORPSE, COST_BITE, COST_DSTROY, COST_OPEN, CRAM_RATION, CREAM_PIE, CRYSKNIFE, C_RATION, DAGGER, DEAF, DIED, DISINT_RES, DISMOUNT_FELL, DISPLACED, DRAGON_HIDE, EGG, ELVEN_DAGGER, ENORMOUS_MEATBALL, EUCALYPTUS_LEAF, EXPL_FIERY, FAINTED, FAINTING, FAKE_AMULET_OF_YENDOR, FAST, FIRE_RES, FIXED_ABIL, FLESH, FLINT, FLYING, FOOD_CLASS, FOOD_RATION, FORTUNE_COOKIE, GEM_CLASS, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_EXCLUDE_NONINVENT, GETOBJ_EXCLUDE_SELECTABLE, GETOBJ_SUGGEST, GLASS, GLIB, GLOB_OF_GREEN_SLIME, GOLD_PIECE, HALLUC, HALLUC_RES, HUNGER, HUNGRY, INVIS, IRON, IRONBARS, KNIFE, K_RATION, LAST_PROP, LEASH, LEATHER, LEMBAS_WAFER, LEVITATION, LIFESAVED, LIGHT_HEADED, LOW_PM, LUMP_OF_ROYAL_JELLY, MAGICAL_BREATHING, MEATBALL, MEAT_RING, MEAT_STICK, MITHRIL, M_AP_NOTHING, M_AP_OBJECT, NEUTRAL, NON_PM, NOSE, NOT_HUNGRY, NO_PART, NUMMONS, ORANGE, ORCISH_DAGGER, PANCAKE, PAPER, PEAR, PICK_AXE, PM_ACID_BLOB, PM_BAT, PM_BLACK_PUDDING, PM_CAVE_DWELLER, PM_CHAMELEON, PM_CHICKATRICE, PM_COCKATRICE, PM_DEATH, PM_DISENCHANTER, PM_DISPLACER_BEAST, PM_DOG, PM_DOPPELGANGER, PM_DWARF, PM_ELF, PM_FAMINE, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLESH_GOLEM, PM_FLOATING_EYE, PM_GELATINOUS_CUBE, PM_GENETIC_ENGINEER, PM_GHOUL, PM_GIANT_BAT, PM_GIANT_MIMIC, PM_GREEN_SLIME, PM_HOUSECAT, PM_HUMAN_WEREJACKAL, PM_HUMAN_WERERAT, PM_HUMAN_WEREWOLF, PM_KILLER_BEE, PM_KITTEN, PM_KNIGHT, PM_LARGE_CAT, PM_LARGE_DOG, PM_LARGE_MIMIC, PM_LEATHER_GOLEM, PM_LICHEN, PM_LITTLE_DOG, PM_LIZARD, PM_MASTER_MIND_FLAYER, PM_MEDUSA, PM_MIND_FLAYER, PM_MONK, PM_NEWT, PM_NURSE, PM_ORC, PM_PESTILENCE, PM_PYROLISK, PM_QUANTUM_MECHANIC, PM_QUEEN_BEE, PM_RAVEN, PM_RUST_MONSTER, PM_SALAMANDER, PM_SANDESTIN, PM_SCORPION, PM_SMALL_MIMIC, PM_STALKER, PM_STONE_GOLEM, PM_TIGER, PM_VALKYRIE, PM_VIOLET_FUNGUS, PM_WEREJACKAL, PM_WERERAT, PM_WEREWOLF, PM_WIZARD, PM_WRAITH, PM_YELLOW_LIGHT, POISONING, POISON_RES, POLY_NOFLAGS, POTION_CLASS, PROTECTION, REGENERATION, RING_CLASS, RIN_ADORNMENT, RIN_FREE_ACTION, RIN_GAIN_CONSTITUTION, RIN_GAIN_STRENGTH, RIN_INCREASE_ACCURACY, RIN_INCREASE_DAMAGE, RIN_INVISIBILITY, RIN_LEVITATION, RIN_PROTECTION, RIN_PROTECTION_FROM_SHAPE_CHAN, RIN_SEE_INVISIBLE, RIN_SLOW_DIGESTION, RIN_SUSTAIN_ABILITY, SATIATED, SCROLL_CLASS, SCR_MAIL, SCR_SCARE_MONSTER, SEE_INVIS, SHOCK_RES, SICK, SICK_RES, SILVER_DAGGER, SLEEPY, SLEEP_RES, SLIMED, SLIME_MOLD, SLOW_DIGESTION, SLT_ENCUMBER, SPRIG_OF_WOLFSBANE, STARVED, STARVING, STILETTO, STOMACH, STONED, STONE_RES, STONING, STRANGLED, STUNNED, S_BLOB, S_ELEMENTAL, S_FUNGUS, S_GHOST, S_GOLEM, S_JELLY, S_LIGHT, S_MIMIC, S_PUDDING, S_VORTEX, TELEPAT, TELEPORT, TELEPORT_CONTROL, TIN, TIN_OPENER, TRIDENT, TRIPE_RATION, TT_BEARTRAP, UNCHANGING, VOMITING, WAX, WEAK, WEAPON_CLASS, WOOD, WWALKING, invlet_basic } from './nh-constants.js';
import { discover_object, objdescr_is, observe_object } from './o_init.js';
import { Tobjnam, an, ansimpleoname, corpse_xname, doname, killer_xname, makeplural, obj_is_pname, otense, safe_qbuf, singular, the, the_unique_pm, thesimpleoname, xname, yobjnam } from './objnam.js';
import { encumber_msg } from './pickup.js';
import { livelog_printf } from './pline.js';
import { body_part, change_sex, polymon, polyself, rehumanize, uasmon_maxStr } from './polyself.js';
import { dopotion, incr_itimeout, make_blinded, make_confused, make_deaf, make_glib, make_hallucinated, make_sick, make_slimed, make_stoned, make_stunned, make_vomiting, self_invis_message, set_itimeout } from './potion.js';
import { altar_wrath } from './pray.js';
import { unpunish } from './read.js';
import { d, rn2, rnd } from './rnd.js';
import { outrumor } from './rumors.js';
import { costly_spot, sellobj_state } from './shk.js';
import { attrcurse } from './sit.js';
import { remove_worn_item } from './steal.js';
import { dismount_steed } from './steed.js';
import { Strlen_ } from './strutil.js';
import { fall_asleep, obj_stop_timers } from './timeout.js';
import { b_trapped, deltrap, float_up, reset_utrap, selftouch, t_at, unconscious } from './trap.js';
import { vault_gd_watching } from './vault.js';
import { set_ulycn, were_beastie, you_unwere } from './were.js';
import { uqwepgone, uswapwepgone, uwepgone, welded, wield_tool } from './wield.js';
import { melt_ice, ubreatheu } from './zap.js';

/* also used to see if you're allowed to eat cats and dogs */
/* Rider corpses are treated as non-rotting so that attempting to eat one
   will be sure to reach the stage of eating where that meal is fatal;
   acid blob corpses eventually rot away to nothing but before that happens
   they can be sacrificed regardless of age which implies that they never
   become rotten */
/* non-rotting non-corpses; unlike lizard corpses, these items will behave
   as if rotten if they are cursed (fortune cookies handled elsewhere) */
/* see hunger states in hack.h - texts used on bottom line
   Also used in botl.c and insight.c  */
export const hu_stat = ["Satiated", "        ", "Hungry  ", "Weak    ", "Fainting", "Fainted ", "Starved "];
const zero_victual = { piece: null, o_id: 0, usedtime: 0, reqtime: 0, nmod: 0, canchoke: 0, fullwarn: 0, eating: 0, doreset: 0 };
/* used by getobj() callback routines eat_ok()/offer_ok()/tin_ok() to
   indicate whether player was given an opportunity to eat or offer or
   tin an item on the floor and declined, in order to insert "else"
   into the "you don't have anything [else] to {eat | offer | tin}"
   feedback if hero lacks any suitable items in inventory
   [reinitialized every time it's used so does not need to be placed
   in struct instance_globals g for potential bulk reinitialization] */
game.getobj_else = 0;
/*
 * Decide whether a particular object can be eaten by the possibly
 * polymorphed character.  Not used for monster checks.
 */
export function is_edible(obj) {
    /* protect invocation tools but not Rider corpses (handled elsewhere)*/
    /* if (obj->oclass != FOOD_CLASS && obj_resists(obj, 0, 0)) */
    if (game.objects[obj.otyp].oc_unique) {
        return (0);
    }
    /* above also prevents the Amulet from being eaten, so we must never
       allow fake amulets to be eaten either [which is already the case] */
    if (game.youmonst.data == game.mons[PM_FIRE_ELEMENTAL] && is_flammable(obj)) {
        return (1);
    }
    if ((((game.youmonst.data).mflags1 & 2147483648) != 0) && (game.objects[obj.otyp].oc_material >= IRON && game.objects[obj.otyp].oc_material <= MITHRIL) && (game.youmonst.data != game.mons[PM_RUST_MONSTER] || (game.objects[obj.otyp].oc_material == IRON))) {
        return (1);
    }
    /* Ghouls only eat non-veggy corpses or eggs (see dogfood()) */
    if (game.u.umonnum == PM_GHOUL) {
        return ((obj.otyp == CORPSE && !((game.mons[obj.corpsenm]).mlet == S_BLOB || (game.mons[obj.corpsenm]).mlet == S_JELLY || (game.mons[obj.corpsenm]).mlet == S_FUNGUS || (game.mons[obj.corpsenm]).mlet == S_VORTEX || (game.mons[obj.corpsenm]).mlet == S_LIGHT || ((game.mons[obj.corpsenm]).mlet == S_ELEMENTAL && (game.mons[obj.corpsenm]) != game.mons[PM_STALKER]) || ((game.mons[obj.corpsenm]).mlet == S_GOLEM && (game.mons[obj.corpsenm]) != game.mons[PM_FLESH_GOLEM] && (game.mons[obj.corpsenm]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[obj.corpsenm]).mlet == S_GHOST))) || (obj.otyp == EGG));
    }
    if (game.u.umonnum == PM_GELATINOUS_CUBE && (game.objects[obj.otyp].oc_material <= WOOD) && !((obj).cobj != null)) {
        return (1);
    }
    /* [g-cubes can eat containers and retain all contents
            as engulfed items, but poly'd player can't do that] */
    return (obj.oclass == FOOD_CLASS);
}
/* used for hero init, life saving (if choking), and prayer results of fix
   starving, fix weak from hunger, or golden glow boon (if u.uhunger < 900) */
export function init_uhunger() {
    game.disp.botl = (game.u.uhs != NOT_HUNGRY || (game.u.atemp.a[A_STR]) < 0);
    game.u.uhunger = 900;
    game.u.uhs = NOT_HUNGRY;
    if ((game.u.atemp.a[A_STR]) < 0) {
        (game.u.atemp.a[A_STR]) = 0;
        encumber_msg();
    }
}
/* tin types [SPINACH_TIN = -1, overrides corpsenm, nut==600] */
/* description */
/* nutrition */
/* stocked by health food shops */
/* causes slippery fingers */
/* ROTTEN_TIN = 0 */
const tintxts = [{ txt: "rotten", nut: -50, fodder: 0, greasy: 0 }, { txt: "homemade", nut: 50, fodder: 1, greasy: 0 }, { txt: "soup made from", nut: 20, fodder: 1, greasy: 0 }, { txt: "french fried", nut: 40, fodder: 0, greasy: 1 }, { txt: "pickled", nut: 40, fodder: 1, greasy: 0 }, { txt: "boiled", nut: 50, fodder: 1, greasy: 0 }, { txt: "smoked", nut: 50, fodder: 1, greasy: 0 }, { txt: "dried", nut: 55, fodder: 1, greasy: 0 }, { txt: "deep fried", nut: 60, fodder: 0, greasy: 1 }, { txt: "szechuan", nut: 70, fodder: 1, greasy: 0 }, { txt: "broiled", nut: 80, fodder: 0, greasy: 0 }, { txt: "stir fried", nut: 80, fodder: 0, greasy: 1 }, { txt: "sauteed", nut: 95, fodder: 0, greasy: 0 }, { txt: "candied", nut: 100, fodder: 1, greasy: 0 }, { txt: "pureed", nut: 500, fodder: 1, greasy: 0 }, { txt: "", nut: 0, fodder: 0, greasy: 0 }];
/* HOMEMADE_TIN = 1 */
/* called after mimicking is over */
export function eatmdone() {
    if (game.eatmbuf) {
        if (game.nomovemsg == game.eatmbuf) {
            game.nomovemsg = null;
        }
        free(game.eatmbuf) , game.eatmbuf = null;
    }
    if ((game.youmonst.m_ap_type & 7)) {
        game.youmonst.m_ap_type = M_AP_NOTHING;
        newsym(game.u.ux, game.u.uy);
    }
    return 0;
}
/* called when hallucination is toggled */
export function eatmupdate() {
    let altmsg = null;
    let altapp = 0;
    if (!game.eatmbuf || game.nomovemsg != game.eatmbuf) {
        return;
    }
    if ((((game.youmonst).m_ap_type & 7) == M_AP_OBJECT && (game.youmonst).mappearance == (ORANGE)) && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        /* revert from hallucinatory to "normal" mimicking */
        altmsg = "You now prefer mimicking yourself.";
        altapp = GOLD_PIECE;
    } else if ((((game.youmonst).m_ap_type & 7) == M_AP_OBJECT && (game.youmonst).mappearance == (GOLD_PIECE)) && (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        /* won't happen; anything which might make immobilized
           hero begin hallucinating (black light attack, theft
           of Grayswandir) will terminate the mimicry first */
        altmsg = "Your rind escaped intact.";
        altapp = ORANGE;
    }
    if (altmsg) {
        /* replace end-of-mimicking message */
        let amlen = Strlen_(altmsg, "eatmupdate", 203);
        if (amlen > Strlen_(game.eatmbuf, "eatmupdate", 204)) {
            free(game.eatmbuf);
            game.eatmbuf = alloc(amlen + 1);
        }
        game.nomovemsg = strcpy(game.eatmbuf, altmsg);
        game.youmonst.mappearance = altapp;
        newsym(game.u.ux, game.u.uy);
    }
}
/* ``[the(] singular(food, xname) [)]'' */
export function food_xname(food, the_pfx) {
    let result = null;
    if (food.otyp == CORPSE) {
        result = corpse_xname(food, null, 1 | (the_pfx ? 4 : 0));
        /* not strictly needed since pname values are capitalized
           and the() is a no-op for them */
        if ((((game.mons[food.corpsenm]).mflags2 & 524288) != 0)) {
            the_pfx = (0);
        }
    } else {
        result = singular(food, xname);
    }
    if (the_pfx) {
        result = the(result);
    }
    return result;
}
/* Created by GAN 01/28/87
 * Amended by AKP 09/22/87: if not hard, don't choke, just vomit.
 * Amended by 3.  06/12/89: if not hard, sometimes choke anyway, to keep risk.
 *                11/10/89: if hard, rarely vomit anyway, for slim chance.
 *
 * To a full belly all food is bad. (It.)
 */
export function choke(food) {
    if (game.u.uhs != SATIATED) {
        /* only happens if you were satiated */
        if (!food || food.otyp != AMULET_OF_STRANGULATION) {
            /* metallivorous hero ate the tin itself */
            /* rider revived, or hero died and was lifesaved */
            /* if we return, we lifesaved, and that calls newuhs */
            return;
        }
    } else if ((game.urole.mnum == (PM_KNIGHT)) && game.u.ualign.type == 1) {
        /* gluttony is unchivalrous */
        adjalign(-1);
        You_feel("like a glutton!");
    }
    exercise(A_CON, (0));
    if ((game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)) || (game.u.uprops[HUNGER].intrinsic || game.u.uprops[HUNGER].extrinsic) || (!game.u.uprops[STRANGLED].intrinsic && !rn2(20))) {
        if (food && food.otyp == AMULET_OF_STRANGULATION) {
            /* choking by eating AoS doesn't involve stuffing yourself */
            You("choke, but recover your composure.");
            return;
        }
        You("stuff yourself and then vomit voluminously.");
        morehungry((game.u.uprops[HUNGER].intrinsic || game.u.uprops[HUNGER].extrinsic) ? (game.u.uhunger - 60) : 1000);
        vomit();
    } else {
        game.killer.format = 0;
        if (food) {
            /*
         * Note all "killer"s below read "Choked on %s" on the
         * high score list & tombstone.  So plan accordingly.
         */
            You("choke over your %s.", foodword(food));
            if (food.oclass == COIN_CLASS) {
                game.killer.name = strcpy(game.killer.name, "very rich meal");
            } else {
                /*
         * monster mind flayer is eating hero's brain
         */
                /* no such thing as mindless players */
                game.killer.format = 1;
                game.killer.name = strcpy(game.killer.name, killer_xname(food));
            }
        } else {
            You("choke over it.");
            game.killer.name = strcpy(game.killer.name, "quick snack");
        }
        You("die...");
        done(CHOKING);
    }
}
/* modify victual.piece->owt depending on time spent consuming it */
export function recalc_wt() {
    let piece = game.context.victual.piece;
    if (!piece) {
        impossible("recalc_wt without piece");
        return;
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("Old weight = %d", piece.owt);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("Used time = %d, Req'd time = %d", game.context.victual.usedtime, game.context.victual.reqtime);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    piece.owt = weight(piece);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("New weight = %d", piece.owt);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
}
/* called when eating interrupted by an event */
export function reset_eat() {
    if (game.context.victual.eating && !game.context.victual.doreset) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("reset_eat...");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        /* we only set a flag here - the actual reset process is done after
     * the round is spent eating.
     */
        game.context.victual.doreset = 1;
    }
    return;
}
/* base nutrition of a food-class object; this used to include a variation
   of the code that is now in adj_victual_nutrition() and was moved due to
   its affect on weight() */
export function obj_nutrition(otmp) {
    let nut = (otmp.otyp == CORPSE) ? game.mons[otmp.corpsenm].cnutrit : otmp.globby ? otmp.owt : game.objects[otmp.otyp].oc_nutrition;
    return nut;
}
/* nutrition increment for next byte; this used to be factored into
   victual.piece->oeaten but that produced weight change if hero
   polymorphed to or from one of the races which has nutrition adjusted */
export function adj_victual_nutrition() {
    let otyp = game.context.victual.piece.otyp;
    /* note: adj_victual_nutrition() is only called when 'nmod' is negative */
    /* convert 'nmod' to positive */
    let nut = -game.context.victual.nmod;
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    if (otyp == LEMBAS_WAFER) {
        if (((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 16) != 0)) : ((game.urace.mnum == (PM_ELF))))) {
            nut += Math.trunc((nut + 2) / 4);
        } else if (((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 128) != 0)) : ((game.urace.mnum == (PM_ORC))))) {
            nut -= Math.trunc((nut + 2) / 4);
        }
    } else if (otyp == CRAM_RATION) {
        if (((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 32) != 0)) : ((game.urace.mnum == (PM_DWARF))))) {
            nut += Math.trunc((nut + 3) / 6);
        }
    }
    nut = ((nut) > (1) ? (nut) : (1));
    return nut;
}
/* might destroy otmp if hero drops it */
export function touchfood(otmp) {
    if (otmp.quan > 1) {
        if (!((otmp).where == 3)) {
            splitobj(otmp, otmp.quan - 1);
        } else {
            otmp = splitobj(otmp, 1);
        }
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("split food,");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
    if (!otmp.oeaten) {
        costly_alteration(otmp, COST_BITE);
        otmp.oeaten = obj_nutrition(otmp);
    }
    if (((otmp).where == 3)) {
        freeinv(otmp);
        if (inv_cnt((0)) >= invlet_basic) {
            sellobj_state((2));
            dropy(otmp);
            sellobj_state((0));
            if (otmp.where == 9) {
                otmp = (null);
            }
        } else {
            otmp = addinv_nomerge(otmp);
        }
    }
    return otmp;
}
/* When food decays, in the middle of your meal, we don't want to dereference
 * any dangling pointers, so set it to null (which should still trigger
 * do_reset_eat() at the beginning of eatfood()) and check for null pointers
 * in do_reset_eat().
 */
export function food_disappears(obj) {
    if (obj == game.context.victual.piece) {
        /* in case stop_occupation() was called on previous meal */
        /*
     * When a corpse gets resurrected, the makemon() for that might
     * call stop_occupation().  If that happens, prevent it from using
     * up the corpse via maybe_finished_meal() when there's not enough
     * left for another bite.  revive() needs continued access to the
     * corpse and will delete it when done.
     */
        /* normally performed by done_eating() */
        game.context.victual = zero_victual;
    }
    /* victual.piece = 0, .o_id = 0 */
    if (obj.timed) {
        obj_stop_timers(obj);
    }
}
/* renaming an object used to result in it having a different address,
   so the sequence start eating/opening, get interrupted, name the food,
   resume eating/opening would restart from scratch */
export function food_substitution(old_obj, new_obj) {
    if (old_obj == game.context.victual.piece) {
        game.context.victual.piece = new_obj;
        game.context.victual.o_id = new_obj.o_id;
    }
    if (old_obj == game.context.tin.tin) {
        game.context.tin.tin = new_obj;
        game.context.tin.o_id = new_obj.o_id;
    }
}
export function do_reset_eat() {
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("do_reset_eat...");
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    if (game.context.victual.piece) {
        let otmp = null;
        game.context.victual.o_id = 0;
        otmp = touchfood(game.context.victual.piece);
        game.context.victual.piece = otmp;
        if (otmp) {
            game.context.victual.o_id = otmp.o_id;
            recalc_wt();
        }
    }
    game.context.victual.fullwarn = game.context.victual.eating = game.context.victual.doreset = 0;
    /* Do not set canchoke to FALSE; if we continue eating the same object
     * we need to know if canchoke was set when they started eating it the
     * previous time.  And if we don't continue eating the same object
     * canchoke always gets recalculated anyway.
     */
    stop_occupation();
    newuhs((0));
}
/* if 'prop' is only set because of a timed value (so not an intrinsic
   attribute or because of polymorph shape or worn or carried gear), return
   its timeout, otherwise return 0; used by enlightenment */
export function temp_resist(prop) {
    let p = game.u.uprops[prop];
    let timeout = p.intrinsic & 16777215;
    if (timeout && (p.intrinsic & ~16777215) == 0 && !p.extrinsic && !p.blocked) {
        /* and if not also protected by polymorph form */
        /* and not by worn gear (dragon armor) */
        /* and property is not blocked; we don't expect this, but if it
           is then the timeout doesn't matter so we won't extend that */
        return timeout;
    }
    return 0;
}
/* if temporary acid or stoning resistance is timing out while eating
   something which that resistance is protecting against, caller will
   extend resistance's duration so that it times out after meal finishes */
export function eating_dangerous_corpse(res) {
    let food = null;
    let mnum = 0;
    if (game.occupation == eatfood && (food = game.context.victual.piece) != null && food.otyp == CORPSE && (mnum = food.corpsenm) >= LOW_PM && (((food).where == 3) || obj_here(food, game.u.ux, game.u.uy))) {
        if (res == ACID_RES && (((game.mons[mnum]).mflags1 & 134217728) != 0)) {
            return (1);
        }
        /* flesh_petrifies() includes Medusa as well as touch_petrifies() */
        if (res == STONE_RES && (((game.mons[mnum]) == game.mons[PM_COCKATRICE] || (game.mons[mnum]) == game.mons[PM_CHICKATRICE]) || (game.mons[mnum]) == game.mons[PM_MEDUSA])) {
            return (1);
        }
    }
    return (0);
}
/* no longer used */
/* if temp resist against 'prop' is about to timeout, extend it slightly */
/* if hero is being protected from nasty effects of current meal by
       temporary resistance (timed acid resist or timed stoning resist),
       prevent expiration from occurring while the meal is in progress
       so that player doesn't get feedback about becoming more vulnerable
       and then have the hero stay unharmed; has a minor side-effect of
       also extending the protection against other attacks of the sort
       being resisted */
/* called each move during eating process */
export function eatfood() {
    let food = game.context.victual.piece;
    if (food && !((food).where == 3) && !obj_here(food, game.u.ux, game.u.uy)) {
        food = null;
    }
    if (!food) {
        do_reset_eat();
        /* side-effects can't occur */
        return 0;
    }
    if (!game.context.victual.eating) {
        return 0;
    }
    if (++game.context.victual.usedtime <= game.context.victual.reqtime) {
        if (bite()) {
            /* all done; no extra harm inflicted upon target */
            return 0;
        }
        /* got blasted so use a turn */
        return 1;
    } else {
        done_eating((1));
        return 0;
    }
}
export function done_eating(message) {
    let piece = game.context.victual.piece;
    piece.in_use = (1);
    /* do this early, so newuhs() knows we're done */
    game.occupation = null;
    newuhs((0));
    if (game.nomovemsg) {
        if (message) {
            pline("%s", game.nomovemsg);
        }
        game.nomovemsg = null;
    } else if (message) {
        You("finish %s %s.", (game.youmonst.data == game.mons[PM_FIRE_ELEMENTAL]) ? "consuming" : "eating", food_xname(piece, (1)));
    }
    if (piece.otyp == CORPSE || piece.globby) {
        cpostfx(piece.corpsenm);
    } else {
        fpostfx(piece);
    }
    if (((piece).where == 3)) {
        useup(piece);
    } else {
        useupf(piece, 1);
    }
    game.context.victual = zero_victual;
}
export function eating_conducts(pd) {
    let ll_conduct = 0;
    if (!game.u.uconduct.food++) {
        livelog_printf(32, "ate for the first time - %s", pd.pmnames[NEUTRAL]);
        ll_conduct++;
    }
    if (!((pd).mlet == S_BLOB || (pd).mlet == S_JELLY || (pd).mlet == S_FUNGUS || (pd).mlet == S_VORTEX || (pd).mlet == S_LIGHT || ((pd).mlet == S_ELEMENTAL && (pd) != game.mons[PM_STALKER]) || ((pd).mlet == S_GOLEM && (pd) != game.mons[PM_FLESH_GOLEM] && (pd) != game.mons[PM_LEATHER_GOLEM]) || ((pd).mlet == S_GHOST))) {
        if (!game.u.uconduct.unvegan++ && !ll_conduct) {
            livelog_printf(32, "consumed animal products (%s) for the first time", pd.pmnames[NEUTRAL]);
            ll_conduct++;
        }
    }
    if (!(((pd).mlet == S_BLOB || (pd).mlet == S_JELLY || (pd).mlet == S_FUNGUS || (pd).mlet == S_VORTEX || (pd).mlet == S_LIGHT || ((pd).mlet == S_ELEMENTAL && (pd) != game.mons[PM_STALKER]) || ((pd).mlet == S_GOLEM && (pd) != game.mons[PM_FLESH_GOLEM] && (pd) != game.mons[PM_LEATHER_GOLEM]) || ((pd).mlet == S_GHOST)) || ((pd).mlet == S_PUDDING && (pd) != game.mons[PM_BLACK_PUDDING]))) {
        if (!game.u.uconduct.unvegetarian && !ll_conduct) {
            livelog_printf(32, "tasted meat (%s) for the first time", pd.pmnames[NEUTRAL]);
        }
        violated_vegetarian();
    }
}
/* handle side-effects of mind flayer's tentacle attack */
/* for dishing out extra damage in lieu of Int loss */
const __eat_brains_brainlessness = "brainlessness";
export function eat_brains(magr, mdef, visflag, dmg_p) {
    let pd = mdef.data;
    let give_nutrit = (0);
    let result = 1;
    let xtra_dmg = rnd(10);
    if (magr != game.youmonst && ((magr).mhp < 1)) {
        /* previous tentacle attack might have triggered fatal passive
       counterattack [callers ought to be updated to avoid this situation] */
        return 4;
    }
    if (((pd).mlet == S_GHOST)) {
        if (visflag) {
            pline("%s brain is unharmed.", (mdef == game.youmonst) ? "Your" : s_suffix(Monnam(mdef)));
        }
        return 0;
    } else if (magr == game.youmonst) {
        You("eat %s brain!", s_suffix(mon_nam(mdef)));
    } else if (mdef == game.youmonst) {
        Your("brain is eaten!");
    } else {
        if (visflag && (canseemon(mdef) || sensemon(mdef))) {
            pline("%s brain is eaten!", s_suffix(Monnam(mdef)));
        }
    }
    if ((((pd) == game.mons[PM_COCKATRICE] || (pd) == game.mons[PM_CHICKATRICE]) || (pd) == game.mons[PM_MEDUSA])) {
        if (magr == game.youmonst) {
            /* mind flayer has attempted to eat the brains of a petrification
           inducing critter (most likely Medusa; attacking a cockatrice via
           tentacle-touch should have been caught before reaching this far) */
            if (!(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !game.u.uprops[STONED].intrinsic) {
                make_stoned(5, null, 0, pmname(pd, Mgender(mdef)));
            }
        } else {
            /* no need to check for poly_when_stoned or Stone_resistance;
               mind flayers don't have those capabilities */
            if (visflag && canseemon(magr)) {
                pline("%s turns to stone!", Monnam(magr));
            }
            monstone(magr);
            if (!((magr).mhp < 1)) {
                /* life-saved; don't continue eating the brains */
                return 0;
            } else {
                if (magr.mtame && !visflag) {
                    You("have a sad thought for a moment, then it passes.");
                }
                return 4;
            }
        }
    }
    if (magr == game.youmonst) {
        /*
         * player mind flayer is eating something's brain
         */
        eating_conducts(pd);
        if ((((pd).mflags1 & 65536) != 0)) {
            /* (cannibalism not possible here) */
            pline("%s doesn't notice.", Monnam(mdef));
            return 0;
        } else if (((pd) == game.mons[PM_DEATH] || (pd) == game.mons[PM_FAMINE] || (pd) == game.mons[PM_PESTILENCE])) {
            pline("Ingesting that is fatal.");
            game.killer.name = sprintf(game.killer.name, "unwisely ate the brain of %s", pmname(pd, Mgender(mdef)));
            game.killer.format = 2;
            done(DIED);
            /* life-saving needed to reach here */
            /* caller handles Int and memory loss */
            exercise(A_WIS, (0));
            /* Rider takes extra damage */
            /* Rider takes extra damage regardless of whether attacker dies */
            dmg_p.value += xtra_dmg;
        } else {
            morehungry(-rnd(30));
            if ((game.u.acurr.a[A_INT]) < (game.u.amax.a[A_INT])) {
                (game.u.acurr.a[A_INT]) += rnd(4);
                /* recover lost Int; won't increase current max */
                if ((game.u.acurr.a[A_INT]) > (game.u.amax.a[A_INT])) {
                    (game.u.acurr.a[A_INT]) = (game.u.amax.a[A_INT]);
                }
                game.disp.botl = (1);
            }
            exercise(A_WIS, (1));
            dmg_p.value += xtra_dmg;
        }
        /* targeting another mind flayer or your own underlying species
           is cannibalism */
        maybe_cannibal(((pd).pmidx), (1));
    } else if (mdef == game.youmonst) {
        if ((game.u.acurr.a[A_INT]) <= (game.urace.attrmin[A_INT])) {
            if (game.u.uprops[LIFESAVED].extrinsic) {
                game.killer.name = strcpy(game.killer.name, __eat_brains_brainlessness);
                game.killer.format = 1;
                done(DIED);
                /* amulet of life saving has now been used up */
                pline("Unfortunately your brain is still gone.");
                /* sanity check against adding other forms of life-saving */
                game.u.uprops[LIFESAVED].extrinsic = game.u.uprops[LIFESAVED].intrinsic = 0;
            } else {
                Your("last thought fades away.");
            }
            game.killer.name = strcpy(game.killer.name, __eat_brains_brainlessness);
            game.killer.format = 1;
            done(DIED);
            (game.u.acurr.a[A_INT]) = (game.urace.attrmin[A_INT]) + 2;
            /* can only get here when in wizard or explore mode and user has
               explicitly chosen not to die; arbitrarily boost intelligence */
            You_feel("like a scarecrow.");
        }
        /* in case a conflicted pet is doing this */
        give_nutrit = (1);
        exercise(A_WIS, (0));
    } else {
        if ((((pd).mflags1 & 65536) != 0)) {
            /*
         * monster mind flayer is eating another monster's brain
         */
            if (visflag && (canseemon(mdef) || sensemon(mdef))) {
                pline("%s doesn't notice.", Monnam(mdef));
            }
            return 0;
        } else if (((pd) == game.mons[PM_DEATH] || (pd) == game.mons[PM_FAMINE] || (pd) == game.mons[PM_PESTILENCE])) {
            mondied(magr);
            if (((magr).mhp < 1)) {
                result = 4;
            }
            dmg_p.value += xtra_dmg;
        } else {
            dmg_p.value += xtra_dmg;
            give_nutrit = (1);
            if (dmg_p.value >= mdef.mhp && visflag && (canseemon(mdef) || sensemon(mdef))) {
                pline("%s last thought fades away...", s_suffix(Monnam(mdef)));
            }
        }
    }
    if (give_nutrit && magr.mtame && !magr.isminion) {
        ((magr).mextra.edog).hungrytime += rnd(60);
        magr.mconf = 0;
    }
    return result;
}
/* eating a corpse or egg of one's own species is usually naughty */
let __maybe_cannibal_ate_brains = 0;
export function maybe_cannibal(pm, allowmsg) {
    let fptr = game.mons[pm];
    /* when poly'd into a mind flayer, multiple tentacle hits in one
       turn cause multiple digestion checks to occur; avoid giving
       multiple luck penalties for the same attack */
    if (game.moves == __maybe_cannibal_ate_brains) {
        return (0);
    }
    /* ate_anything, not just brains... */
    __maybe_cannibal_ate_brains = game.moves;
    if (!((game.urole.mnum == (PM_CAVE_DWELLER)) || (game.urace.mnum == (PM_ORC))) && ((((fptr).mflags2 & game.urace.selfmask) != 0) || ((game.u.umonnum != game.u.umonster) && same_race(game.youmonst.data, fptr)) || (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS) && were_beastie(pm) == game.u.ulycn))) {
        if (allowmsg) {
            /* non-cannibalistic heroes shouldn't eat own species ever
           and also shouldn't eat current species when polymorphed
           (even if having the form of something which doesn't care
           about cannibalism--hero's innate traits aren't altered) */
            if ((game.u.umonnum != game.u.umonster) && (((fptr).mflags2 & game.urace.selfmask) != 0)) {
                You("have a bad feeling deep inside.");
            }
            You("cannibal!  You will regret this!");
        }
        game.u.uprops[AGGRAVATE_MONSTER].intrinsic |= 67108864;
        change_luck(-(rn2(4) + (2)));
        return (1);
    }
    return (0);
}
export function cprefx(pm) {
    maybe_cannibal(pm, (1));
    if ((((game.mons[pm]) == game.mons[PM_COCKATRICE] || (game.mons[pm]) == game.mons[PM_CHICKATRICE]) || (game.mons[pm]) == game.mons[PM_MEDUSA])) {
        if (!(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM))) {
            /* if food was a tin, use it up early to keep it out of bones */
            if (game.context.tin.tin) {
                use_up_tin(game.context.tin.tin);
            }
            game.killer.name = sprintf(game.killer.name, "tasting %s meat", game.mons[pm].pmnames[NEUTRAL]);
            game.killer.format = 1;
            You("turn to stone.");
            done(STONING);
            if (game.context.victual.piece) {
                game.context.victual.eating = 0;
            }
            return;
        }
    }
    switch (pm) {
        case PM_LITTLE_DOG:
        case PM_DOG:
        case PM_LARGE_DOG:
        case PM_KITTEN:
        case PM_HOUSECAT:
        case PM_LARGE_CAT:
            if (!((game.urole.mnum == (PM_CAVE_DWELLER)) || (game.urace.mnum == (PM_ORC)))) {
                /* cannibals are allowed to eat domestic animals without penalty */
                You_feel("that eating the %s was a bad idea.", game.mons[pm].pmnames[NEUTRAL]);
                game.u.uprops[AGGRAVATE_MONSTER].intrinsic |= 67108864;
            }
            /* [satiation message may be inaccurate if eating gets interrupted] */
            break;
        case PM_LIZARD:
            if (game.u.uprops[STONED].intrinsic) {
                fix_petrification();
            }
            break;
        case PM_DEATH:
        case PM_PESTILENCE:
        case PM_FAMINE:
{
                pline("Eating that is instantly fatal.");
                game.killer.name = sprintf(game.killer.name, "unwisely ate the body of %s", game.mons[pm].pmnames[NEUTRAL]);
                game.killer.format = 2;
                done(DIED);
                exercise(A_WIS, (0));
                /* revive an actual corpse; can't do that if it was a tin;
           5.0: this used to assume that such tins were impossible but
           they can be wished for in wizard mode; they can't make it
           to normal play though because bones creation empties them */
                if (game.context.victual.piece && game.context.victual.piece.otyp == CORPSE && revive_corpse(game.context.victual.piece)) {
                    game.context.victual = zero_victual;
                }
                /* victual.piece=0, .o_id=0 */
                return;
            }
        case PM_GREEN_SLIME:
            if (!game.u.uprops[SLIMED].intrinsic && !(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && !((game.youmonst.data) == game.mons[PM_GREEN_SLIME] || ((game.youmonst.data) == game.mons[PM_FIRE_VORTEX] || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_SALAMANDER]) || ((game.youmonst.data).mlet == S_GHOST))) {
                You("don't feel very well.");
                make_slimed(10, null);
                delayed_killer(SLIMED, 0, "");
            }
            ;
        default:
            if ((((game.mons[pm]).mflags1 & 134217728) != 0) && game.u.uprops[STONED].intrinsic) {
                fix_petrification();
            }
            break;
    }
}
export function fix_petrification() {
    /* Blessed food detection grants hero a one-use
     * ability to detect food that is unfit for consumption
     * or dangerous and avoid it.
     */
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        buf = sprintf(buf, "What a pity--you just ruined a future piece of %sart!", (acurr(A_CHA)) > 15 ? "fine " : "");
    } else {
        buf = strcpy(buf, "You feel limber!");
    }
    make_stoned(0, buf, 0, null);
}
/*
 * If you add an intrinsic that can be gotten by eating a monster, add it
 * to intrinsic_possible() and givit().  (It must already be in prop.h to
 * be an intrinsic property.)
 * It would be very easy to make the intrinsics not try to give you one
 * that you already had by checking to see if you have it in
 * intrinsic_possible() instead of givit(), but we're not that nice.
 */
/* intrinsic_possible() returns TRUE iff a monster can give an intrinsic. */
export function intrinsic_possible(type, ptr) {
    let res = 0;
    switch (type) {
        case FIRE_RES:
            res = (ptr.mconveys & 1) != 0;
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get fire resistance");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        case SLEEP_RES:
            res = (ptr.mconveys & 4) != 0;
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get sleep resistance");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        case COLD_RES:
            res = (ptr.mconveys & 2) != 0;
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get cold resistance");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        case DISINT_RES:
            res = (ptr.mconveys & 8) != 0;
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get disintegration resistance");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        /* shock (electricity) resistance */
        case SHOCK_RES:
            res = (ptr.mconveys & 16) != 0;
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get shock resistance");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        case POISON_RES:
            res = (ptr.mconveys & 32) != 0;
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get poison resistance");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        case ACID_RES:
            res = (ptr.mconveys & 64) != 0;
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get acid resistance temporarily");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        case STONE_RES:
            res = (ptr.mconveys & 128) != 0;
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get stoning resistance temporarily");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        case TELEPORT:
            res = (((ptr).mflags1 & 33554432) != 0);
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get teleport");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        case TELEPORT_CONTROL:
            res = (((ptr).mflags1 & 67108864) != 0);
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get teleport control");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        case TELEPAT:
            res = ((ptr) == game.mons[PM_FLOATING_EYE] || (ptr) == game.mons[PM_MIND_FLAYER] || (ptr) == game.mons[PM_MASTER_MIND_FLAYER]);
            do {
                if (res) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("can get telepathy");
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            } while (0);
            break;
        default:
            break;
    }
    return res;
}
/* The "do we or do we not give the intrinsic" logic from givit(), extracted
 * into its own function. Depends on the monster's level and the type of
 * intrinsic it is trying to give you.
 */
export function should_givit(type, ptr) {
    let chance = 0;
    switch (type) {
        case POISON_RES:
            if ((ptr == game.mons[PM_KILLER_BEE] || ptr == game.mons[PM_SCORPION]) && !rn2(4)) {
                chance = 1;
            /* some intrinsics are easier to get than others */
            } else {
                chance = 15;
            }
            break;
        case TELEPORT:
            chance = 10;
            break;
        case TELEPORT_CONTROL:
            chance = 12;
            break;
        case TELEPAT:
            chance = 1;
            break;
        default:
            chance = 15;
            break;
    }
    return (ptr.mlevel > rn2(chance));
}
export function temp_givit(type, ptr) {
    let chance = (type == STONE_RES) ? 6 : (type == ACID_RES) ? 3 : 0;
    return chance ? (ptr.mlevel > rn2(chance)) : (0);
}
/* givit() tries to give you an intrinsic based on the monster's level
 * and what type of intrinsic it is trying to give you.
 */
export function givit(type, ptr) {
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("Attempting to give intrinsic %d", type);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    if (!should_givit(type, ptr) && !temp_givit(type, ptr)) {
        return;
    }
    switch (type) {
        case FIRE_RES:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Trying to give fire resistance");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[FIRE_RES].intrinsic & 67108864)) {
                You((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "be chillin'." : "feel a momentary chill.");
                game.u.uprops[FIRE_RES].intrinsic |= 67108864;
            }
            break;
        case SLEEP_RES:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Trying to give sleep resistance");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[SLEEP_RES].intrinsic & 67108864)) {
                You_feel("wide awake.");
                game.u.uprops[SLEEP_RES].intrinsic |= 67108864;
            }
            break;
        case COLD_RES:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Trying to give cold resistance");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[COLD_RES].intrinsic & 67108864)) {
                You_feel("full of hot air.");
                game.u.uprops[COLD_RES].intrinsic |= 67108864;
            }
            break;
        case DISINT_RES:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Trying to give disintegration resistance");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[DISINT_RES].intrinsic & 67108864)) {
                You_feel((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "totally together, man." : "very firm.");
                game.u.uprops[DISINT_RES].intrinsic |= 67108864;
            }
            break;
        case SHOCK_RES:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Trying to give shock resistance");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[SHOCK_RES].intrinsic & 67108864)) {
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    You_feel("grounded in reality.");
                } else {
                    Your("health currently feels amplified!");
                }
                game.u.uprops[SHOCK_RES].intrinsic |= 67108864;
            }
            break;
        case POISON_RES:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Trying to give poison resistance");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[POISON_RES].intrinsic & 67108864)) {
                You_feel((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic) ? "especially healthy." : "healthy.");
                game.u.uprops[POISON_RES].intrinsic |= 67108864;
            }
            break;
        case TELEPORT:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Trying to give teleport");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[TELEPORT].intrinsic & 67108864)) {
                You_feel((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "diffuse." : "very jumpy.");
                game.u.uprops[TELEPORT].intrinsic |= 67108864;
            }
            break;
        case TELEPORT_CONTROL:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Trying to give teleport control");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[TELEPORT_CONTROL].intrinsic & 67108864)) {
                You_feel((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "centered in your personal space." : "in control of yourself.");
                game.u.uprops[TELEPORT_CONTROL].intrinsic |= 67108864;
            }
            break;
        case TELEPAT:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Trying to give telepathy");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[TELEPAT].intrinsic & 67108864)) {
                You_feel((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "in touch with the cosmos." : "a strange mental acuity.");
                game.u.uprops[TELEPAT].intrinsic |= 67108864;
                /* If blind, make sure monsters show up. */
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    see_monsters();
                }
            }
            break;
        case ACID_RES:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Giving timed acid resistance");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
                You_feel("%s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "secure from flashbacks" : "less concerned about being harmed by acid");
            }
            incr_itimeout({ get value() { return game.u.uprops[ACID_RES].intrinsic; }, set value(_v) { game.u.uprops[ACID_RES].intrinsic = _v; } }, d(3, 6));
            break;
        case STONE_RES:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Giving timed stoning resistance");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (!(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
                You_feel("%s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "unusually limber" : "less concerned about becoming petrified");
            }
            incr_itimeout({ get value() { return game.u.uprops[STONE_RES].intrinsic; }, set value(_v) { game.u.uprops[STONE_RES].intrinsic = _v; } }, d(3, 6));
            break;
        default:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Tried to give an impossible intrinsic");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            break;
    }
}
export function eye_of_newt_buzz() {
    if (rn2(3) || 3 * game.u.uen <= 2 * game.u.uenmax) {
        /* MRKR: "eye of newt" may give small magical energy boost */
        let old_uen = game.u.uen;
        game.u.uen += rnd(3);
        if (game.u.uen > game.u.uenmax) {
            if (!rn2(3)) {
                game.u.uenmax++;
                if (game.u.uenmax > game.u.uenpeak) {
                    game.u.uenpeak = game.u.uenmax;
                }
            }
            game.u.uen = game.u.uenmax;
        }
        if (old_uen != game.u.uen) {
            You_feel("a mild buzz.");
            game.disp.botl = (1);
        }
    }
}
/* called after completely consuming a corpse */
export function cpostfx(pm) {
    let tmp = 0;
    let catch_lycanthropy = NON_PM;
    let check_intrinsics = (0);
    /* in case `afternmv' didn't get called for previously mimicking
       gold, clean up now to avoid `eatmbuf' memory leak */
    if (game.eatmbuf) {
        eatmdone();
    }
    switch (pm) {
        case PM_WRAITH:
            pluslvl((0));
            break;
        case PM_HUMAN_WERERAT:
            catch_lycanthropy = PM_WERERAT;
            break;
        case PM_HUMAN_WEREJACKAL:
            catch_lycanthropy = PM_WEREJACKAL;
            break;
        case PM_HUMAN_WEREWOLF:
            catch_lycanthropy = PM_WEREWOLF;
            break;
        case PM_NURSE:
            if ((game.u.umonnum != game.u.umonster)) {
                game.u.mh = game.u.mhmax;
            } else {
                game.u.uhp = game.u.uhpmax;
            }
            make_blinded(0, !game.u.ucreamed);
            game.disp.botl = (1);
            /* might also convey poison resistance */
            /* might convey temporary stoning resist */
            check_intrinsics = (1);
            break;
        case PM_STALKER:
            if (!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked)) {
                set_itimeout({ get value() { return game.u.uprops[INVIS].intrinsic; }, set value(_v) { game.u.uprops[INVIS].intrinsic = _v; } }, (rn2(100) + (50)));
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !game.u.uprops[INVIS].blocked) {
                    self_invis_message();
                }
            } else {
                if (!(game.u.uprops[INVIS].intrinsic & (67108864 | 33554432 | 16777216))) {
                    You_feel("hidden!");
                }
                game.u.uprops[INVIS].intrinsic |= 67108864;
                game.u.uprops[SEE_INVIS].intrinsic |= 67108864;
            }
            newsym(game.u.ux, game.u.uy);
            ;
        case PM_YELLOW_LIGHT:
        case PM_GIANT_BAT:
            make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + 30, (0));
            ;
        case PM_BAT:
            make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + 30, (0));
            break;
        case PM_GIANT_MIMIC:
            tmp += 10;
            ;
        case PM_LARGE_MIMIC:
            tmp += 20;
            ;
        case PM_SMALL_MIMIC:
            tmp += 20;
            if (game.youmonst.data.mlet != S_MIMIC && !(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
                let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let tempshape = !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "a pile of gold" : "an orange";
                if (!game.u.uconduct.polyselfs++) {
                    livelog_printf(32, "changed form for the first time by mimicking %s", tempshape);
                }
                You_cant("resist the temptation to mimic %s.", tempshape);
                /* A pile of gold can't ride. */
                if (game.u.usteed) {
                    dismount_steed(DISMOUNT_FELL);
                }
                nomul(-tmp);
                game.multi_reason = "pretending to be a pile of gold";
                buf = sprintf(buf, (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "You suddenly dread being peeled and mimic %s again!" : "You now prefer mimicking %s again.", an((game.u.umonnum != game.u.umonster) ? pmname(game.youmonst.data, (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)) : game.urace.noun));
                game.eatmbuf = dupstr(buf);
                game.nomovemsg = game.eatmbuf;
                game.afternmv = eatmdone;
                /* ??? what if this was set before? */
                game.youmonst.m_ap_type = M_AP_OBJECT;
                game.youmonst.mappearance = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ORANGE : GOLD_PIECE;
                newsym(game.u.ux, game.u.uy);
                curs_on_u();
                /* make gold symbol show up now */
                (game.windowprocs.win_display_nhwindow)(game.WIN_MAP, (1));
            }
            break;
        case PM_QUANTUM_MECHANIC:
            Your("velocity suddenly seems very uncertain!");
            if (game.u.uprops[FAST].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[FAST].intrinsic &= ~(67108864 | 33554432 | 16777216);
                You("seem slower.");
            } else {
                game.u.uprops[FAST].intrinsic |= 67108864;
                You("seem faster.");
            }
            break;
        case PM_LIZARD:
            if ((game.u.uprops[STUNNED].intrinsic & 16777215) > 2) {
                make_stunned(2, (0));
            }
            if ((game.u.uprops[CONFUSION].intrinsic & 16777215) > 2) {
                make_confused(2, (0));
            }
            check_intrinsics = (1);
            break;
        case PM_CHAMELEON:
        case PM_DOPPELGANGER:
        case PM_SANDESTIN:
        case PM_GENETIC_ENGINEER:
            if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
                /* moot--they don't leave corpses */
                You_feel("momentarily different.");
            } else {
                if (game.context.tin.tin) {
                    /* polyself() is potentially fatal; if food is a tin, use it up
               early to keep it out of bones */
                    use_up_tin(game.context.tin.tin);
                    /* most tin effects end up being skipped */
                    lesshungry(200 + ((((game.youmonst.data).mflags1 & 2147483648) != 0) ? 5 : 0));
                }
                You("%s.", (pm == PM_GENETIC_ENGINEER) ? "undergo a freakish metamorphosis" : "feel a change coming over you");
                polyself(POLY_NOFLAGS);
            }
            break;
        case PM_DISPLACER_BEAST:
            if (!(game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic)) {
                toggle_displacement(null, 0, (1));
            }
            incr_itimeout({ get value() { return game.u.uprops[DISPLACED].intrinsic; }, set value(_v) { game.u.uprops[DISPLACED].intrinsic = _v; } }, d(6, 6));
            break;
        case PM_DISENCHANTER:
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("using attrcurse to strip an intrinsic");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            /* picks an intrinsic at random and removes it; there's
           no feedback if hero already lacks the chosen ability */
            attrcurse();
            break;
        case PM_DEATH:
        case PM_PESTILENCE:
        case PM_FAMINE:
            break;
        case PM_MIND_FLAYER:
        case PM_MASTER_MIND_FLAYER:
            if ((game.u.acurr.a[A_INT]) < ((A_INT == A_STR && (game.u.umonnum != game.u.umonster)) ? uasmon_maxStr() : game.urace.attrmax[A_INT])) {
                if (!rn2(2)) {
                    /* give a message (before setting the timeout) */
                    /* life-saved; don't attempt to confer any intrinsics */
                    pline("Yum!  That was real brain food!");
                    adjattrib(A_INT, 1, (0));
                    /* don't give them telepathy, too */
                    /* default case of outer switch */
                    break;
                }
            } else {
                pline("For some reason, that tasted bland.");
            }
            ;
        default:
            check_intrinsics = (1);
            break;
    }
    if (check_intrinsics) {
        /* possibly convey an intrinsic */
        let ptr = game.mons[pm];
        if (dmgtype(ptr, 12) || dmgtype(ptr, 36) || pm == PM_VIOLET_FUNGUS) {
            pline("Oh wow!  Great stuff!");
            make_hallucinated((game.u.uprops[HALLUC].intrinsic & 16777215) + 200, (0), 0);
        }
        /* Eating magical monsters can give you some magical energy. */
        if (attacktype(ptr, 255) || pm == PM_NEWT) {
            eye_of_newt_buzz();
        }
        tmp = corpse_intrinsic(ptr);
        /* if something was chosen, give it now (givit() might fail) */
        if (tmp == -1) {
            gainstr(null, 0, (1));
        } else if (tmp > 0) {
            givit(tmp, ptr);
        }
    }
    if (((catch_lycanthropy) >= LOW_PM && (catch_lycanthropy) < NUMMONS)) {
        set_ulycn(catch_lycanthropy);
        retouch_equipment(2);
    }
    return;
}
/* Choose (one of) the intrinsics granted by a corpse, and return it.
 * If this corpse gives no intrinsics, return 0.
 * For the special not-real-prop cases of strength gain from giants
 * return fake prop value of -1.
 * Non-deterministic; should only be called once per corpse.
 */
export function corpse_intrinsic(ptr) {
    /* Check the monster for all of the intrinsics.  If this
     * monster can give more than one, pick one to try to give
     * from among all it can give.
     */
    let conveys_STR = (((ptr).mflags2 & 8192) != 0);
    let i = 0;
    /* number of possible intrinsics */
    let count = 0;
    /* which one we will try to give */
    let prop = 0;
    if (conveys_STR) {
        count = 1;
        /* use -1 as fake prop index for STR */
        prop = -1;
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("\"Intrinsic\" strength, %d", prop);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
    for (i = 1; i <= LAST_PROP; i++) {
        if (!intrinsic_possible(i, ptr)) {
            continue;
        }
        ++count;
        if (!rn2(count)) {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Intrinsic %d replacing %d", i, prop);
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            /* a 1 in count chance of replacing the old choice
           with this one, and a count-1 in count chance
           of keeping the old choice (note that 1 in 1 and
           0 in 1 are what we want for the first candidate) */
            prop = i;
        }
    }
    /* if strength is the only candidate, give it 50% chance */
    if (conveys_STR && count == 1 && !rn2(2)) {
        prop = 0;
    }
    return prop;
}
export function violated_vegetarian() {
    game.u.uconduct.unvegetarian++;
    if ((game.urole.mnum == (PM_MONK))) {
        You_feel("guilty.");
        adjalign(-1);
    }
    return;
}
/* common code to check and possibly charge for 1 svc.context.tin.tin,
 * will split() svc.context.tin.tin if necessary */
/* COST_xxx */
export function costly_tin(alter_type) {
    let tin = game.context.tin.tin;
    if (((tin).where == 3) ? tin.unpaid : (costly_spot(tin.ox, tin.oy) && !tin.no_charge)) {
        if (tin.quan > 1) {
            tin = game.context.tin.tin = splitobj(tin, 1);
            game.context.tin.o_id = tin.o_id;
        }
        costly_alteration(tin, alter_type);
    }
    return tin;
}
export function tin_variety_txt(s, tinvariety) {
    let k = 0;
    let l = 0;
    if (s && tinvariety) {
        tinvariety.value = -1;
        for (k = 0; k < (Math.trunc(16 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14) [16]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14)) */)) - 1; ++k) {
            l = strlen(tintxts[k].txt);
            if (!strncmpi(s, tintxts[k].txt, l) && (strlen(s) > l) && s[l] == 32) {
                tinvariety.value = k;
                return (l + 1);
            }
        }
    }
    return 0;
}
/*
 * This assumes that buf already contains the word "tin",
 * as is the case with caller xname().
 */
export function tin_details(obj, mnum, buf) {
    let buf2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!obj || !buf) {
        return;
    }
    let r = tin_variety(obj, (1));
    if (r == (-1)) {
        buf = strcat(buf, " of spinach");
    } else if (mnum == NON_PM) {
        buf = strcpy(buf, "empty tin");
    } else {
        if ((obj.cknown || game.iflags.override_ID) && obj.spe < 0) {
            if (r == 0 || r == 1) {
                buf2 = sprintf(buf2, "%s %s of ", tintxts[r].txt, buf);
                buf = strcpy(buf, buf2);
            } else {
                buf = (buf || '') + sprintf('', " of %s ", tintxts[r].txt);
            }
        } else {
            strcpy(eos(buf), " of ");
        }
        if ((((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST)) || ((game.mons[mnum]).mlet == S_PUDDING && (game.mons[mnum]) != game.mons[PM_BLACK_PUDDING]))) {
            buf = (buf || '') + sprintf('', "%s", game.mons[mnum].pmnames[NEUTRAL]);
        } else {
            buf = (buf || '') + sprintf('', "%s meat", game.mons[mnum].pmnames[NEUTRAL]);
        }
    }
}
export function set_tin_variety(obj, forcetype) {
    let r = 0;
    let mnum = obj.corpsenm;
    if (forcetype == (-1) || (forcetype == (-3) && (mnum == NON_PM || !(((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST)) || ((game.mons[mnum]).mlet == S_PUDDING && (game.mons[mnum]) != game.mons[PM_BLACK_PUDDING]))))) {
        /* empty or already spinach */
        /* not based on any monster */
        obj.corpsenm = NON_PM;
        obj.spe = 1;
        return;
    } else if (forcetype == (-3)) {
        r = tin_variety(obj, (0));
        if (r < 0 || r >= (Math.trunc(16 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14) [16]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14)) */))) {
            r = 0;
        }
        while ((r == 0 && !obj.cursed) || !tintxts[r].fodder) {
            r = rn2((Math.trunc(16 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14) [16]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14)) */)) - 1);
        }
    } else if (forcetype >= 0 && forcetype < (Math.trunc(16 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14) [16]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14)) */)) - 1) {
        r = forcetype;
    } else {
        r = rn2((Math.trunc(16 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14) [16]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14)) */)) - 1);
        /* some homemade tins go bad */
        if (r == 0 && (((mnum) >= LOW_PM && (mnum) < NUMMONS) && ((mnum) == PM_LIZARD || (mnum) == PM_LICHEN || ((game.mons[mnum]) == game.mons[PM_DEATH] || (game.mons[mnum]) == game.mons[PM_FAMINE] || (game.mons[mnum]) == game.mons[PM_PESTILENCE]) || (mnum) == PM_ACID_BLOB))) {
            r = 1;
        }
    }
    /* offset by 1 to allow index 0 */
    obj.spe = -(r + 1);
}
/* we're just displaying so leave things alone */
export function tin_variety(obj, displ) {
    let r = 0;
    let mnum = obj.corpsenm;
    if (obj.spe == 1) {
        r = (-1);
    } else if (obj.cursed) {
        r = 0;
    } else if (obj.spe < 0) {
        r = -(obj.spe);
        --r;
    } else {
        r = rn2((Math.trunc(16 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14) [16]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c:138:14)) */)) - 1);
    }
    if (!displ && r == 1 && !obj.blessed && !rn2(7)) {
        r = 0;
    }
    if (r == 0 && (((mnum) >= LOW_PM && (mnum) < NUMMONS) && ((mnum) == PM_LIZARD || (mnum) == PM_LICHEN || ((game.mons[mnum]) == game.mons[PM_DEATH] || (game.mons[mnum]) == game.mons[PM_FAMINE] || (game.mons[mnum]) == game.mons[PM_PESTILENCE]) || (mnum) == PM_ACID_BLOB))) {
        r = 1;
    }
    return r;
}
/* finish consume_tin(); also potentially used by cprefx() and cpostfx() */
export function use_up_tin(tin) {
    if (((tin).where == 3)) {
        useup(tin);
    } else {
        useupf(tin, 1);
    }
    game.context.tin.tin = (null);
    game.context.tin.o_id = 0;
}
export function consume_tin(mesg) {
    let what = null;
    let which = 0;
    let mnum = 0;
    let r = 0;
    let nutamt = 0;
    /* if you've eaten tin itself, chance to not eat contents gets bypassed */
    let always_eat = (((game.youmonst.data).mflags1 & 2147483648) != 0);
    let tin = game.context.tin.tin;
    r = tin_variety(tin, (0));
    if (tin.otrapped || (tin.cursed && r != 1 && !rn2(8))) {
        b_trapped("tin", NO_PART);
        tin = costly_tin(COST_DSTROY);
        use_up_tin(tin);
        return;
    }
    pline("%s", mesg);
    if (r != (-1)) {
        /* "You succeed in opening the tin." */
        mnum = tin.corpsenm;
        if (mnum == NON_PM) {
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                pline("It's full of %s.", rn2(2) ? "air elemental souffle" : "dehydrated water");
            } else {
                pline("It turns out to be empty.");
            }
            observe_object(tin);
            tin.known = 1;
            tin = costly_tin(COST_OPEN);
            use_up_tin(tin);
            if (always_eat) {
                lesshungry(5);
            }
            return;
        }
        /* 0=>plural, 1=>as-is, 2=>"the" prefix */
        which = 0;
        if ((mnum == PM_COCKATRICE || mnum == PM_CHICKATRICE) && ((game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))) {
            what = "chicken";
            which = 1;
        } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            what = rndmonnam(null);
        } else {
            what = game.mons[mnum].pmnames[NEUTRAL];
            if (the_unique_pm(game.mons[mnum])) {
                which = 2;
            } else if ((((game.mons[mnum]).mflags2 & 524288) != 0)) {
                which = 1;
            }
        }
        if (which == 0) {
            what = makeplural(what);
        } else if (which == 2) {
            what = the(what);
        }
        if (!always_eat) {
            pline("It smells like %s.", what);
            if (yn_function("Eat it?", ynchars, 110, (1)) == 110) {
                if (game.flags.verbose) {
                    You("discard the open tin.");
                }
                if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    observe_object(tin);
                    tin.known = 1;
                }
                tin = costly_tin(COST_OPEN);
                use_up_tin(tin);
                return;
            }
        }
        game.context.victual = zero_victual;
        You("consume %s %s.", tintxts[r].txt, game.mons[mnum].pmnames[NEUTRAL]);
        eating_conducts(game.mons[mnum]);
        observe_object(tin);
        tin.known = 1;
        /* charge for one at pre-eating cost */
        tin = game.context.tin.tin = costly_tin(COST_OPEN);
        /* cprefx() or cpostfx() might use up tin to keep it out of bones */
        cprefx(mnum);
        if (game.context.tin.tin) {
            cpostfx(mnum);
        }
        if (!game.context.tin.tin) {
            return;
        }
        if (tintxts[r].nut < 0) {
            make_vomiting((rn2(15) + (10)), (0));
        } else {
            nutamt = tintxts[r].nut;
            /* nutrition from a homemade tin (made from a single corpse)
               shouldn't be more than nutrition from the corresponding
               corpse; other tinning modes might use more than one corpse
               or add extra ingredients so aren't similarly restricted */
            if (r == 1 && nutamt > game.mons[mnum].cnutrit) {
                nutamt = game.mons[mnum].cnutrit;
            }
            if (always_eat) {
                nutamt += 5;
            }
            /* use up tin now; lesshungry() could be fatal and produce bones */
            /* metallivorous hero also eats the tin itself */
            /* use up tin first; lesshungry() could be fatal and produce bones */
            use_up_tin(tin) , tin = null;
            lesshungry(nutamt);
        }
        if (tintxts[r].greasy) {
            /* normal hero is !Glib, because you can't open tins when Glib,
               but one poly'd into metallivorous form might already be Glib;
               it's debatable whether a rock mole should have its paws made
               slippery when eating a greasy tin, but we'll go with that... */
            let alreadyglib = (game.u.uprops[GLIB].intrinsic & 16777215);
            make_glib(alreadyglib + (rn2(11) + (5)));
            pline("Eating %s food made your %s %s slippery.", tintxts[r].txt, fingers_or_gloves((1)), alreadyglib ? "even more" : "very");
        }
    } else {
        if (tin.cursed) {
            pline("It contains some decaying%s%s substance.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : " ", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : hcolor(c_color_names.c_green));
        } else {
            pline("It contains spinach.");
            observe_object(tin);
            tin.known = 1;
        }
        if (!always_eat && yn_function("Eat it?", ynchars, 110, (1)) == 110) {
            if (game.flags.verbose) {
                You("discard the open tin.");
            }
            tin = costly_tin(COST_OPEN);
            use_up_tin(tin);
            return;
        }
        /*
         * Same order as with non-spinach above:
         * conduct update, side-effects, shop handling, and nutrition.
         */
        /* don't need vegetarian checks for spinach */
        if (!game.u.uconduct.food++) {
            livelog_printf(32, "ate for the first time (spinach)");
        }
        if (!tin.cursed) {
            pline("This makes you feel like %s!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "Swee'pea" : !game.u.uprops[FIXED_ABIL].extrinsic ? "Popeye" : (game.flags.female ? "Olive Oyl" : "Bluto"));
        }
        gainstr(tin, 0, (0));
        tin = game.context.tin.tin = costly_tin(COST_OPEN);
        nutamt = (tin.blessed ? 600 : !tin.cursed ? (400 + rnd(200)) : (200 + rnd(400)));
        if (always_eat) {
            nutamt += 5;
        }
        use_up_tin(tin) , tin = null;
        lesshungry(nutamt);
    }
    if (tin) {
        use_up_tin(tin);
    }
    return;
}
/* called during each move whilst opening a tin */
export function opentin() {
    /* perhaps it was stolen (although that should cause interruption) */
    if (!((game.context.tin.tin).where == 3) && (!obj_here(game.context.tin.tin, game.u.ux, game.u.uy) || !can_reach_floor((1)))) {
        return 0;
    }
    if (game.context.tin.usedtime++ >= 50) {
        /* %% probably we should use tinoid */
        You("give up your attempt to open the tin.");
        return 0;
    }
    if (game.context.tin.usedtime < game.context.tin.reqtime) {
        return 1;
    }
    consume_tin("You succeed in opening the tin.");
    return 0;
}
/* called when starting to open a tin */
export function start_tin(otmp) {
    let mesg = null;
    let tmp = 0;
    if ((((game.youmonst.data).mflags1 & 2147483648) != 0)) {
        mesg = "You bite right into the metal tin...";
        tmp = 0;
    } else if (((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1))) {
        You("cannot handle the tin properly to open it.");
        return;
    } else if (otmp.blessed) {
        /* 50/50 chance for immediate access vs 1 turn delay (unless
           wielding blessed tin opener which always yields immediate
           access); 1 turn delay case is non-deterministic:  getting
           interrupted and retrying might yield another 1 turn delay
           or might open immediately on 2nd (or 3rd, 4th, ...) try */
        tmp = (game.uwep && game.uwep.blessed && game.uwep.otyp == TIN_OPENER) ? 0 : rn2(2);
        if (!tmp) {
            mesg = "The tin opens like magic!";
        } else {
            pline_The("tin seems easy to open.");
        }
    } else {
        let __no_opener = !game.uwep || !((game.uwep.otyp == TIN_OPENER) || (game.uwep.otyp == DAGGER || game.uwep.otyp == SILVER_DAGGER || game.uwep.otyp == ELVEN_DAGGER || game.uwep.otyp == ORCISH_DAGGER || game.uwep.otyp == ATHAME || game.uwep.otyp == KNIFE || game.uwep.otyp == STILETTO || game.uwep.otyp == CRYSKNIFE) || (game.uwep.otyp == PICK_AXE || game.uwep.otyp == AXE));
        if (game.uwep && !__no_opener) {
            switch (game.uwep.otyp) {
                case TIN_OPENER:
                    mesg = "You easily open the tin.";
                    tmp = rn2(game.uwep.cursed ? 3 : !game.uwep.blessed ? 2 : 1);
                    break;
                case DAGGER:
                case SILVER_DAGGER:
                case ELVEN_DAGGER:
                case ORCISH_DAGGER:
                case ATHAME:
                case KNIFE:
                case STILETTO:
                case CRYSKNIFE:
                    tmp = 3;
                    break;
                case PICK_AXE:
                case AXE:
                    tmp = 6;
                    break;
            }
            pline("Using %s you try to open the tin.", yobjnam(game.uwep, null));
        } else {
            pline("It is not so easy to open this tin.");
            if (game.u.uprops[GLIB].intrinsic) {
                pline_The("tin slips from your %s.", fingers_or_gloves((0)));
                if (otmp.quan > 1) {
                    otmp = splitobj(otmp, 1);
                }
                if (((otmp).where == 3)) {
                    dropx(otmp);
                } else {
                    stackobj(otmp);
                }
                return;
            }
            tmp = (rn2(1 + Math.trunc(500 / (((acurr(A_DEX)) + (acurrstr()))))) + (10));
        }
    }
    game.context.tin.tin = otmp;
    game.context.tin.o_id = otmp.o_id;
    if (!tmp) {
        consume_tin(mesg);
    } else {
        game.context.tin.reqtime = tmp;
        game.context.tin.usedtime = 0;
        set_occupation(opentin, "opening the tin", 0);
    }
    return;
}
/* called when waking up after fainting */
export function Hear_again() {
    if (!rn2(2)) {
        /* Chance of deafness going away while fainted/sleeping/etc. */
        make_deaf(0, (0));
        game.disp.botl = (1);
    }
    return 0;
}
/* called on the "first bite" of rotten food */
export function rottenfood(obj) {
    pline("Blecch!  %s %s!", is_rottable(obj) ? "Rotten" : "Awful", foodword(obj));
    if (!rn2(4)) {
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            You_feel("rather trippy.");
        } else {
            You_feel("rather %s.", body_part(LIGHT_HEADED));
        }
        make_confused(game.u.uprops[CONFUSION].intrinsic + d(2, 4), (0));
    } else if (!rn2(4) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        pline("Everything suddenly goes dark.");
        /* hero is not Blind, but Blinded timer might be nonzero if
           blindness is being overridden by the Eyes of the Overworld */
        make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + d(2, 10), (0));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            Your("%s", c_common_strings.c_vision_clears);
        }
    } else if (!rn2(3)) {
        let what = null;
        let where = null;
        let duration = rnd(10);
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            what = "goes" , where = "dark";
        } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
            what = "you lose control of" , where = "yourself";
        } else {
            what = "you slap against the" , where = (game.u.usteed) ? "saddle" : surface(game.u.ux, game.u.uy);
        }
        pline_The("world spins and %s %s.", what, where);
        incr_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, duration);
        game.disp.botl = (1);
        nomul(-duration);
        game.multi_reason = "unconscious from rotten food";
        game.nomovemsg = "You are conscious again.";
        game.afternmv = Hear_again;
        return 1;
    }
    return 0;
}
/* called when a corpse is selected as food */
/* first char: T = tastes ... , I = is ... */
/* veggies are always just "okay" */
const __eatcorpse_palatable_msgs = ["Tokay", "Istringy", "Igamey", "Ifatty", "Itough"];
export function eatcorpse(otmp) {
    let retcode = 0;
    let tp = 0;
    let mnum = otmp.corpsenm;
    let rotted = 0;
    let ll_conduct = 0;
    let stoneable = 0;
    let slimeable = (mnum == PM_GREEN_SLIME && !game.u.uprops[SLIMED].intrinsic && !(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && !((game.youmonst.data) == game.mons[PM_GREEN_SLIME] || ((game.youmonst.data) == game.mons[PM_FIRE_VORTEX] || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_SALAMANDER]) || ((game.youmonst.data).mlet == S_GHOST)));
    let glob = otmp.globby ? (1) : (0);
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    stoneable = ((((game.mons[mnum]) == game.mons[PM_COCKATRICE] || (game.mons[mnum]) == game.mons[PM_CHICKATRICE]) || (game.mons[mnum]) == game.mons[PM_MEDUSA]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !poly_when_stoned(game.youmonst.data));
    if (!((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST))) {
        if (!game.u.uconduct.unvegan++) {
            livelog_printf(32, "consumed animal products for the first time, by eating %s", an(food_xname(otmp, (0))));
            ll_conduct++;
        }
    }
    if (!(((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST)) || ((game.mons[mnum]).mlet == S_PUDDING && (game.mons[mnum]) != game.mons[PM_BLACK_PUDDING]))) {
        if (!game.u.uconduct.unvegetarian && !ll_conduct) {
            livelog_printf(32, "tasted meat for the first time, by eating %s", an(food_xname(otmp, (0))));
        }
        violated_vegetarian();
    }
    if (!((mnum) == PM_LIZARD || (mnum) == PM_LICHEN || ((game.mons[mnum]) == game.mons[PM_DEATH] || (game.mons[mnum]) == game.mons[PM_FAMINE] || (game.mons[mnum]) == game.mons[PM_PESTILENCE]) || (mnum) == PM_ACID_BLOB)) {
        let age = peek_at_iced_corpse_age(otmp);
        rotted = Math.trunc((game.moves - age) / (10 + rn2(20)));
        if (otmp.cursed) {
            rotted += 2;
        } else if (otmp.blessed) {
            rotted -= 2;
        }
    }
    if (!glob && !stoneable && !slimeable && rotted > 5) {
        /* 5.0: globs don't become tainted, they shrink away */
        let cannibal = maybe_cannibal(mnum, (0));
        /* tp++; -- early return makes this unnecessary */
        pline("Ulch - that %s was tainted%s!", (game.mons[mnum].mlet == S_FUNGUS) ? "fungoid vegetation" : (((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST)) || ((game.mons[mnum]).mlet == S_PUDDING && (game.mons[mnum]) != game.mons[PM_BLACK_PUDDING])) ? "protoplasm" : "meat", cannibal ? ", you cannibal" : "");
        if ((game.u.uprops[SICK_RES].intrinsic || game.u.uprops[SICK_RES].extrinsic || defended(game.youmonst, 33))) {
            pline("It doesn't seem at all sickening, though...");
        } else {
            let sick_time = 0;
            sick_time = (rn2(10) + (10));
            /* make sure new ill doesn't result in improvement */
            if (game.u.uprops[SICK].intrinsic && (sick_time > game.u.uprops[SICK].intrinsic)) {
                sick_time = (game.u.uprops[SICK].intrinsic > 1) ? game.u.uprops[SICK].intrinsic - 1 : 1;
            }
            make_sick(sick_time, corpse_xname(otmp, "rotted", 0), (1), 1);
            pline("(It must have died too long ago to be safe to eat.)");
        }
        if (((otmp).where == 3)) {
            useup(otmp);
        } else {
            useupf(otmp, 1);
        }
        return 2;
    } else if ((((game.mons[mnum]).mflags1 & 134217728) != 0) && !(game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
        tp++;
        You("have a very bad case of stomach acid.");
        losehp(rnd(15), !glob ? "acidic corpse" : "acidic glob", 0);
    } else if ((((game.mons[mnum]).mflags1 & 268435456) != 0) && rn2(5)) {
        tp++;
        pline("Ecch - that must have been poisonous!");
        /* now any corpse left too long will make you mildly ill */
        if (!(game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
            poison_strdmg(rnd(4), rnd(15), !glob ? "poisonous corpse" : "poisonous glob", 0);
        } else {
            You("seem unaffected by the poison.");
        }
    } else if ((rotted > 5 || (rotted > 3 && rn2(5))) && !(game.u.uprops[SICK_RES].intrinsic || game.u.uprops[SICK_RES].extrinsic || defended(game.youmonst, 33))) {
        tp++;
        You_feel("%ssick.", (game.u.uprops[SICK].intrinsic) ? "very " : "");
        losehp(rnd(8), !glob ? "cadaver" : "rotted glob", 0);
    }
    /* delay is weight dependent */
    game.context.victual.reqtime = 3 + ((!glob ? game.mons[mnum].cwt : otmp.owt) >> 6);
    if (!tp && !((mnum) == PM_LIZARD || (mnum) == PM_LICHEN || ((game.mons[mnum]) == game.mons[PM_DEATH] || (game.mons[mnum]) == game.mons[PM_FAMINE] || (game.mons[mnum]) == game.mons[PM_PESTILENCE]) || (mnum) == PM_ACID_BLOB) && (otmp.oeroded || !rn2(7))) {
        if (rottenfood(otmp)) {
            otmp.oeroded = (1);
            otmp = touchfood(otmp);
            if (!otmp) {
                return 1;
            }
            retcode = 1;
        }
        if (!game.mons[otmp.corpsenm].cnutrit) {
            /* no nutrition: rots away, no message if you passed out */
            if (!retcode) {
                pline_The("corpse rots away completely.");
            }
            if (((otmp).where == 3)) {
                useup(otmp);
            } else {
                useupf(otmp, 1);
            }
            retcode = 2;
        }
        if (!retcode) {
            consume_oeaten(otmp, 2);
        }
    } else if ((mnum == PM_COCKATRICE || mnum == PM_CHICKATRICE) && ((game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))) {
        pline("This tastes just like chicken!");
    } else if (mnum == PM_FLOATING_EYE && game.u.umonnum == PM_RAVEN) {
        You("peck the eyeball with delight.");
    } else if (tp) {
        ;
    } else {
        /* yummy is always False for omnivores, palatable always True */
        let yummy = (((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST)) ? (!(((game.youmonst.data).mflags1 & 536870912) != 0) && (((game.youmonst.data).mflags1 & 1073741824) != 0)) : ((((game.youmonst.data).mflags1 & 536870912) != 0) && !(((game.youmonst.data).mflags1 & 1073741824) != 0)));
        let palatable = (((((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST)) || ((game.mons[mnum]).mlet == S_PUDDING && (game.mons[mnum]) != game.mons[PM_BLACK_PUDDING])) ? (((game.youmonst.data).mflags1 & 1073741824) != 0) : (((game.youmonst.data).mflags1 & 536870912) != 0)) && rn2(10) && (rotted < 1 || !rn2(rotted + 1)));
        let pmxnam = food_xname(otmp, (0));
        let idx = (((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST)) || ((game.mons[mnum]).mlet == S_PUDDING && (game.mons[mnum]) != game.mons[PM_BLACK_PUDDING])) ? 0 : rn2((Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */)));
        let palat_msg = __eatcorpse_palatable_msgs[idx];
        let use_is = ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || (palatable && palat_msg == 73));
        if (!strncmpi(pmxnam, "the ", 4)) {
            /* Translator gap: C `pmxnam += 4` advances past "the ".
               In JS strings, += is concat — corrupts pmxnam by
               appending the number 4.  Use slice(4). */
            pmxnam = (typeof pmxnam === 'string') ? pmxnam.slice(4) : pmxnam + 4;
        }
        pline("%s%s %s %s%c", (((game.mons[mnum]).mflags2 & 524288) != 0) ? "" : the_unique_pm(game.mons[mnum]) ? "The " : "This ", pmxnam, use_is ? "is" : "tastes", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? (yummy ? ((game.u.umonnum == PM_TIGER) ? "gr-r-reat" : "gnarly") : palatable ? "copacetic" : "grody") : (yummy ? "delicious" : palatable ? palat_msg[1] : "terrible"), (yummy || !palatable) ? 33 : 46);
    }
    return retcode;
}
/* called as you start to eat */
let __start_eating_msgbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function start_eating(otmp, already_partly_eaten) {
    let old_nomovemsg = null;
    let save_nomovemsg = null;
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("start_eating: %s (victual = %s)", fmt_ptr(otmp), fmt_ptr(game.context.victual.piece));
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("reqtime = %d", game.context.victual.reqtime);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("(original reqtime = %d)", game.objects[otmp.otyp].oc_delay);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("nmod = %d", game.context.victual.nmod);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("oeaten = %d", otmp.oeaten);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    /* note: fmt_ptr() returns a static buffer but supports
                   several such so we don't need to copy the first result
                   before calling it a second time */
    game.context.victual.fullwarn = game.context.victual.doreset = 0;
    game.context.victual.eating = 1;
    if (otmp.otyp == CORPSE || otmp.globby) {
        cprefx(game.context.victual.piece.corpsenm);
        if (!game.context.victual.piece || !game.context.victual.eating) {
            return;
        }
    }
    old_nomovemsg = game.nomovemsg;
    if (bite()) {
        if (++game.context.victual.usedtime >= game.context.victual.reqtime) {
            /* survived choking, finish off food that's nearly done;
           need this to handle cockatrice eggs, fortune cookies, etc */
            /* don't want done_eating() to issue gn.nomovemsg if it
               is due to vomit() called by bite() */
            save_nomovemsg = game.nomovemsg;
            if (!old_nomovemsg) {
                game.nomovemsg = null;
            }
            done_eating((0));
            if (!old_nomovemsg) {
                game.nomovemsg = save_nomovemsg;
            }
        }
        return;
    }
    if (++game.context.victual.usedtime >= game.context.victual.reqtime) {
        /* print "finish eating" message if they just resumed -dlc */
        done_eating((game.context.victual.reqtime > 1 || already_partly_eaten) ? (1) : (0));
        return;
    }
    __start_eating_msgbuf = sprintf(__start_eating_msgbuf, "eating %s", food_xname(otmp, (1)));
    set_occupation(eatfood, __start_eating_msgbuf, 0);
}
/* used by shrink_glob() timer routine */
export function eating_glob(glob) {
    return (game.occupation == eatfood && glob == game.context.victual.piece);
}
/* scare nearby monster when hero eats garlic */
export function garlic_breath(mtmp) {
    if (olfaction(mtmp.data) && dist2((mtmp.mx), (mtmp.my), game.u.ux, game.u.uy) < 7) {
        monflee(mtmp, 0, (0), (0));
    }
}
/*
 * Called on "first bite" of (non-corpse) food, after touchfood() has
 * marked it 'partly eaten'.  Used for non-rotten non-tin non-corpse food.
 * Messages should use present tense since multi-turn food won't be
 * finishing at the time they're issued.
 * Returns FALSE if eating should not succeed for whatever reason.
 */
export function fprefx(otmp) {
    switch (otmp.otyp) {
        case EGG:
            if (otmp.corpsenm == PM_PYROLISK) {
                if (((otmp).where == 3)) {
                    useup(otmp);
                } else {
                    useupf(otmp, 1);
                }
                explode(game.u.ux, game.u.uy, -11, d(3, 6), 0, EXPL_FIERY);
                return (0);
            } else if (((game.moves - (otmp).age) > (2 * 200))) {
                pline("Ugh.  Rotten egg.");
                /* increasing existing nausea means that it will take longer
               before eventual vomit, but also means that constitution
               will be abused more times before illness completes */
                make_vomiting((game.u.uprops[VOMITING].intrinsic & 16777215) + d(10, 4), (1));
            } else {
                pline("This %s is %s", singular(otmp, xname), otmp.cursed ? ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "grody!" : "terrible!") : (otmp.otyp == CRAM_RATION || otmp.otyp == K_RATION || otmp.otyp == C_RATION) ? "bland." : (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "gnarly!" : "delicious!");
            }
            break;
        case FOOD_RATION:
            if (game.u.uhunger <= 200) {
                pline("%s!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "Oh wow, like, superior, man" : "This food really hits the spot");
            } else if (game.u.uhunger < 700) {
                pline("This satiates your %s!", body_part(STOMACH));
            }
            break;
        case TRIPE_RATION:
            if ((((game.youmonst.data).mflags1 & 536870912) != 0) && !(((game.youmonst.data).mflags1 & 131072) != 0)) {
                /* 200+800 remains below 1000+1, the satiation threshold */
                /* 700-1+800 remains below 1500, the choking threshold which
           triggers "you're having a hard time getting it down" feedback */
                pline("This tripe ration is surprisingly good!");
            } else if (((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 128) != 0)) : ((game.urace.mnum == (PM_ORC))))) {
                pline((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "Tastes great!  Less filling!" : "Mmm, tripe... not bad!");
            } else {
                pline("Yak - dog food!");
                more_experienced(1, 0);
                newexplevel();
                /* not cannibalism, but we use similar criteria
               for deciding whether to be sickened by this meal */
                if (rn2(2) && !((game.urole.mnum == (PM_CAVE_DWELLER)) || (game.urace.mnum == (PM_ORC)))) {
                    make_vomiting((rn2(game.context.victual.reqtime) + (14)), (0));
                }
            }
            break;
        case LEMBAS_WAFER:
            if (((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 128) != 0)) : ((game.urace.mnum == (PM_ORC))))) {
                pline("%s", "!#?&* elf kibble!");
                break;
            } else if (((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 16) != 0)) : ((game.urace.mnum == (PM_ELF))))) {
                pline("A little goes a long way.");
                break;
            }
            pline("This %s is %s", singular(otmp, xname), otmp.cursed ? ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "grody!" : "terrible!") : (otmp.otyp == CRAM_RATION || otmp.otyp == K_RATION || otmp.otyp == C_RATION) ? "bland." : (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "gnarly!" : "delicious!");
            break;
        case MEATBALL:
        case MEAT_STICK:
        case ENORMOUS_MEATBALL:
        case MEAT_RING:
            pline("This %s is %s", singular(otmp, xname), otmp.cursed ? ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "grody!" : "terrible!") : (otmp.otyp == CRAM_RATION || otmp.otyp == K_RATION || otmp.otyp == C_RATION) ? "bland." : (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "gnarly!" : "delicious!");
            break;
        case CLOVE_OF_GARLIC:
            if ((((game.youmonst.data).mflags2 & 2) != 0)) {
                make_vomiting((rn2(game.context.victual.reqtime) + (5)), (0));
                break;
            }
            iter_mons(garlic_breath);
            ;
        default:
            if (otmp.otyp == SLIME_MOLD && !otmp.cursed && otmp.spe == game.context.current_fruit) {
                pline("My, this is a %s %s!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "primo" : "yummy", singular(otmp, xname));
            } else if (otmp.otyp == APPLE && otmp.cursed && !(game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                ;
            } else if (otmp.otyp == APPLE || otmp.otyp == PEAR) {
                if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    /* skip core joke; feedback deferred til fpostfx() */
                    /* KMH -- Why should Unix have all the fun?
           We check MACOS before UNIX to get the Apple-specific apple
           message; the '#if UNIX' code will still kick in for pear. */
                    pline("Core dumped.");
                } else {
                    /* based on an old Usenet joke, a fake a.out manual page */
                    let x = rnd(100);
                    pline("%s -- core dumped.", (x <= 75) ? "Segmentation fault" : (x <= 99) ? "Bus error" : "Yo' mama");
                }
            } else {
                give_feedback: {
                }
                pline("This %s is %s", singular(otmp, xname), otmp.cursed ? ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "grody!" : "terrible!") : (otmp.otyp == CRAM_RATION || otmp.otyp == K_RATION || otmp.otyp == C_RATION) ? "bland." : (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "gnarly!" : "delicious!");
            }
            break;
    }
    return (1);
}
/* increment a combat intrinsic with limits on its growth */
export function bounded_increase(old, inc, typ) {
    let absold = 0;
    let absinc = 0;
    let sgnold = 0;
    let sgninc = 0;
    /* don't include any amount coming from worn rings (caller handles
       'protection' differently) */
    /* put amount from worn rings back */
    if (game.uright && game.uright.otyp == typ && typ != RIN_PROTECTION) {
        old -= game.uright.spe;
    }
    if (game.uleft && game.uleft.otyp == typ && typ != RIN_PROTECTION) {
        old -= game.uleft.spe;
    }
    absold = abs(old) , absinc = abs(inc);
    sgnold = sgn(old) , sgninc = sgn(inc);
    if (absinc == 0 || sgnold != sgninc || absold + absinc < 10) {
        ;
    } else if (absold + absinc < 20) {
        absinc = rnd(absinc);
        if (absold + absinc < 10) {
            absinc = 10 - absold;
        }
        inc = sgninc * absinc;
    } else if (absold + absinc < 40) {
        absinc = rn2(absinc) ? 1 : 0;
        if (absold + absinc < 20) {
            absinc = rnd(20 - absold);
        }
        inc = sgninc * absinc;
    } else {
        /* no further increase allowed via this method */
        inc = 0;
    }
    if (game.uright && game.uright.otyp == typ && typ != RIN_PROTECTION) {
        old += game.uright.spe;
    }
    if (game.uleft && game.uleft.otyp == typ && typ != RIN_PROTECTION) {
        old += game.uleft.spe;
    }
    return old + inc;
}
export function accessory_has_effect(otmp) {
    pline("Magic spreads through your body as you digest the %s.", (otmp.oclass == RING_CLASS) ? "ring" : "amulet");
}
export function eataccessory(otmp) {
    let typ = otmp.otyp;
    let oldprop = 0;
    /* Note: rings are not so common that this is unbalancing. */
    /* (How often do you even _find_ 3 rings of polymorph in a game?) */
    oldprop = game.u.uprops[game.objects[typ].oc_oprop].intrinsic;
    if (otmp == game.uleft || otmp == game.uright) {
        Ring_gone(otmp);
        if (game.u.uhp <= 0) {
            return;
        }
    }
    observe_object(otmp);
    otmp.known = 1;
    if (!rn2(otmp.oclass == RING_CLASS ? 3 : 5)) {
        switch (otmp.otyp) {
            default:
                if (!game.objects[typ].oc_oprop) {
                    break;
                }
                if (!(game.u.uprops[game.objects[typ].oc_oprop].intrinsic & 67108864)) {
                    /* Give sleep resistance instead */
                    accessory_has_effect(otmp);
                }
                game.u.uprops[game.objects[typ].oc_oprop].intrinsic |= 67108864;
                switch (typ) {
                    case RIN_SEE_INVISIBLE:
                        set_mimic_blocking();
                        see_monsters();
                        if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !oldprop && !game.u.uprops[SEE_INVIS].extrinsic && !(((game.youmonst.data).mflags1 & 16777216) != 0) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            newsym(game.u.ux, game.u.uy);
                            pline("Suddenly you can see yourself.");
                            discover_object((typ), (1), (1), (1));
                        }
                        break;
                    case RIN_INVISIBILITY:
                        if (!oldprop && !game.u.uprops[INVIS].extrinsic && !game.u.uprops[INVIS].blocked && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            newsym(game.u.ux, game.u.uy);
                            Your("body takes on a %s transparency...", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "normal" : "strange");
                            discover_object((typ), (1), (1), (1));
                        }
                        break;
                    case RIN_PROTECTION_FROM_SHAPE_CHAN:
                        rescham();
                        break;
                    case RIN_LEVITATION:
                        game.u.uprops[LEVITATION].intrinsic = oldprop;
                        if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
                            /* undo the `.intrinsic |= FROMOUTSIDE' done above */
                            float_up();
                            incr_itimeout({ get value() { return game.u.uprops[LEVITATION].intrinsic; }, set value(_v) { game.u.uprops[LEVITATION].intrinsic = _v; } }, d(10, 20));
                            discover_object((typ), (1), (1), (1));
                        }
                        break;
                }
                break;
            case RIN_ADORNMENT:
                accessory_has_effect(otmp);
                if (adjattrib(A_CHA, otmp.spe, -1)) {
                    discover_object((typ), (1), (1), (1));
                }
                break;
            case RIN_GAIN_STRENGTH:
                accessory_has_effect(otmp);
                if (adjattrib(A_STR, otmp.spe, -1)) {
                    discover_object((typ), (1), (1), (1));
                }
                break;
            case RIN_GAIN_CONSTITUTION:
                accessory_has_effect(otmp);
                if (adjattrib(A_CON, otmp.spe, -1)) {
                    discover_object((typ), (1), (1), (1));
                }
                break;
            case RIN_INCREASE_ACCURACY:
                accessory_has_effect(otmp);
                game.u.uhitinc = bounded_increase(game.u.uhitinc, otmp.spe, RIN_INCREASE_ACCURACY);
                break;
            case RIN_INCREASE_DAMAGE:
                accessory_has_effect(otmp);
                game.u.udaminc = bounded_increase(game.u.udaminc, otmp.spe, RIN_INCREASE_DAMAGE);
                break;
            case RIN_PROTECTION:
            case AMULET_OF_GUARDING:
                accessory_has_effect(otmp);
                game.u.uprops[PROTECTION].intrinsic |= 67108864;
                game.u.ublessed = bounded_increase(game.u.ublessed, (typ == RIN_PROTECTION) ? otmp.spe : 2, typ);
                game.disp.botl = (1);
                break;
            case RIN_FREE_ACTION:
                if (!(game.u.uprops[SLEEP_RES].intrinsic & 67108864)) {
                    accessory_has_effect(otmp);
                }
                if (!(game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                    You_feel("wide awake.");
                }
                game.u.uprops[SLEEP_RES].intrinsic |= 67108864;
                break;
            case AMULET_OF_CHANGE:
                accessory_has_effect(otmp);
                discover_object((typ), (1), (1), (1));
                change_sex();
                You("are suddenly very %s!", game.flags.female ? "feminine" : "masculine");
                game.disp.botl = (1);
                break;
            case AMULET_OF_UNCHANGING:
                if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && (game.u.umonnum != game.u.umonster)) {
                    accessory_has_effect(otmp);
                    discover_object((typ), (1), (1), (1));
                    rehumanize();
                }
                break;
            case AMULET_OF_STRANGULATION:
                choke(otmp);
                break;
            case AMULET_OF_RESTFUL_SLEEP:
{
                    /* no message--this gives no permanent effect */
                    let newnap = rnd(100);
                    let oldnap = (game.u.uprops[SLEEPY].intrinsic & 16777215);
                    if (!(game.u.uprops[SLEEPY].intrinsic & 67108864)) {
                        accessory_has_effect(otmp);
                    }
                    game.u.uprops[SLEEPY].intrinsic |= 67108864;
                    /* might also be wearing one; use shorter of two timeouts */
                    if (newnap < oldnap || oldnap == 0) {
                        game.u.uprops[SLEEPY].intrinsic = (game.u.uprops[SLEEPY].intrinsic & ~16777215) | newnap;
                    }
                    break;
                }
            case RIN_SUSTAIN_ABILITY:
            case AMULET_OF_LIFE_SAVING:
            case AMULET_OF_FLYING:
            case AMULET_OF_REFLECTION:
                break;
        }
    }
}
/* called after eating non-food */
export function eatspecial() {
    let otmp = game.context.victual.piece;
    /* lesshungry wants an occupation to handle choke messages correctly */
    set_occupation(eatfood, "eating non-food", 0);
    lesshungry(game.context.victual.nmod);
    game.occupation = null;
    game.context.victual = zero_victual;
    if (otmp.oclass == COIN_CLASS) {
        if (((otmp).where == 3)) {
            useupall(otmp);
        } else {
            useupf(otmp, otmp.quan);
        }
        vault_gd_watching(1);
        return;
    }
    if (game.objects[otmp.otyp].oc_material == PAPER) {
        if (otmp.otyp == SCR_MAIL) {
            pline("This junk mail is less than satisfying.");
        } else if (otmp.otyp == SCR_SCARE_MONSTER) {
            pline("Yuck%c", otmp.blessed ? 33 : 46);
        } else if (otmp.oclass == SCROLL_CLASS && objdescr_is(otmp, "YUM YUM")) {
            pline("Yum%c", otmp.blessed ? 33 : 46);
        /* to eat scroll, hero is currently polymorphed into a monster */
        /* check description after checking for specific scrolls */
        } else {
            pline("Needs salt...");
        }
    }
    if (otmp.oclass == POTION_CLASS) {
        /* dopotion() does a useup() */
        otmp.quan++;
        dopotion(otmp);
    } else if (otmp.oclass == RING_CLASS || otmp.oclass == AMULET_CLASS) {
        eataccessory(otmp);
    } else if (otmp.otyp == LEASH && otmp.corpsenm) {
        o_unleash(otmp);
    }
    if (otmp.otyp == TRIDENT && !otmp.cursed) {
        /* KMH -- idea by "Tommy the Terrorist" */
        /* sugarless chewing gum which used to be heavily advertised on TV */
        pline((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "Four out of five dentists agree." : "That was pure chewing satisfaction!");
        exercise(A_WIS, (1));
    }
    if (otmp.otyp == FLINT && !otmp.cursed) {
        /* chewable vitamin for kids based on "The Flintstones" TV cartoon */
        pline("Yabba-dabba delicious!");
        exercise(A_CON, (1));
    }
    if (otmp == game.uwep && otmp.quan == 1) {
        uwepgone();
    }
    if (otmp == game.uquiver && otmp.quan == 1) {
        uqwepgone();
    }
    if (otmp == game.uswapwep && otmp.quan == 1) {
        uswapwepgone();
    }
    if (otmp == game.uball) {
        unpunish();
    }
    if (otmp == game.uchain) {
        unpunish();
    } else if (((otmp).where == 3)) {
        useup(otmp);
    } else {
        useupf(otmp, 1);
    }
}
/* NOTE: the order of these words exactly corresponds to the
   order of oc_material values #define'd in objclass.h. */
const foodwords = ["meal", "liquid", "wax", "food", "meat", "paper", "cloth", "leather", "wood", "bone", "scale", "metal", "metal", "metal", "silver", "gold", "platinum", "mithril", "plastic", "glass", "rich food", "stone"];
export function foodword(otmp) {
    if (otmp.oclass == FOOD_CLASS) {
        return "food";
    }
    if (otmp.oclass == GEM_CLASS && game.objects[otmp.otyp].oc_material == GLASS && otmp.dknown) {
        discover_object((otmp.otyp), (1), (1), (1));
    }
    return foodwords[game.objects[otmp.otyp].oc_material];
}
/* called after consuming (non-corpse) food */
export function fpostfx(otmp) {
    switch (otmp.otyp) {
        case SPRIG_OF_WOLFSBANE:
            if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS) || (((game.youmonst.data).mflags2 & 4) != 0)) {
                you_unwere((1));
            }
            break;
        case CARROT:
            if (!game.u.uswallow || !attacktype_fordmg(game.u.ustuck.data, 11, 11)) {
                make_blinded(game.u.ucreamed, (1));
            }
            break;
        case FORTUNE_COOKIE:
            outrumor(bcsign(otmp), 1);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                if (!game.u.uconduct.literate++) {
                    livelog_printf(32, "became literate by reading the fortune inside a cookie");
                }
            }
            break;
        case LUMP_OF_ROYAL_JELLY:
            if (game.youmonst.data == game.mons[PM_KILLER_BEE] && !(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && polymon(PM_QUEEN_BEE)) {
                break;
            }
            /* This stuff seems to be VERY healthy! */
            gainstr(otmp, 1, (1));
            if ((game.u.umonnum != game.u.umonster)) {
                game.u.mh += otmp.cursed ? -rnd(20) : rnd(20) , game.disp.botl = (1);
                if (game.u.mh > game.u.mhmax) {
                    if (!rn2(17)) {
                        setuhpmax(game.u.mhmax + 1, (0));
                    }
                    game.u.mh = game.u.mhmax;
                } else if (game.u.mh <= 0) {
                    rehumanize();
                }
            } else {
                game.u.uhp += otmp.cursed ? -rnd(20) : rnd(20) , game.disp.botl = (1);
                if (game.u.uhp > game.u.uhpmax) {
                    if (!rn2(17)) {
                        setuhpmax(game.u.uhpmax + 1, (0));
                    }
                    game.u.uhp = game.u.uhpmax;
                } else if (game.u.uhp <= 0) {
                    game.killer.format = 0;
                    game.killer.name = strcpy(game.killer.name, "rotten lump of royal jelly");
                    done(POISONING);
                }
            }
            if (!otmp.cursed) {
                heal_legs(0);
            }
            break;
        case EGG:
            if (((otmp.corpsenm) >= LOW_PM && (otmp.corpsenm) < NUMMONS) && (((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) || (game.mons[otmp.corpsenm]) == game.mons[PM_MEDUSA])) {
                /* note: no "tastes like chicken" message for eggs */
                if (!(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM))) {
                    if (!game.u.uprops[STONED].intrinsic) {
                        game.killer.name = sprintf(game.killer.name, "%s egg", game.mons[otmp.corpsenm].pmnames[NEUTRAL]);
                        make_stoned(5, null, 0, game.killer.name);
                    }
                }
            }
            break;
        case EUCALYPTUS_LEAF:
            if (game.u.uprops[SICK].intrinsic && !otmp.cursed) {
                make_sick(0, null, (1), 3);
            }
            if (game.u.uprops[VOMITING].intrinsic && !otmp.cursed) {
                make_vomiting(0, (1));
            }
            break;
        case APPLE:
            if (otmp.cursed && !(game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                if ((game.urace.mnum == (PM_DWARF)) && (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    /* Snow White; 'poisoned' applies to [a subset of] weapons,
               not food, so we substitute cursed; fortunately our hero
               won't have to wait for a prince to be rescued/revived */
                    verbalize("Heigh-ho, ho-hum, I think I'll skip work today.");
                } else if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) || !game.flags.acoustics) {
                    You("fall asleep.");
                } else {
                    ;
                    You_hear("sinister laughter as you fall asleep...");
                }
                fall_asleep(-(rn2(11) + (20)), (1));
            }
            break;
    }
    return;
}
/* intended for eating a spellbook while polymorphed, but not used;
   "leather" applied to appearance, not composition, and has been
   changed to "leathery" to reflect that */
/*
 * return 0 if the food was not dangerous.
 * return 1 if the food was dangerous and you chose to stop.
 * return 2 if the food was dangerous and you chose to eat it anyway.
 */
export function edibility_prompts(otmp) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let foodsmell = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let it_or_they = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* 5.0: decaying globs don't become tainted anymore; in 3.6, they did */
    let cadaver = (otmp.otyp == CORPSE);
    let stoneorslime = (0);
    let material = game.objects[otmp.otyp].oc_material;
    let mnum = otmp.corpsenm;
    let rotted = 0;
    foodsmell = strcpy(foodsmell, Tobjnam(otmp, "smell"));
    it_or_they = strcpy(it_or_they, (otmp.quan == 1) ? "it" : "they");
    if (cadaver || otmp.otyp == EGG || otmp.otyp == TIN || otmp.otyp == GLOB_OF_GREEN_SLIME) {
        /* These checks must match those in eatcorpse() */
        stoneorslime = (((mnum) >= LOW_PM && (mnum) < NUMMONS) && (((game.mons[mnum]) == game.mons[PM_COCKATRICE] || (game.mons[mnum]) == game.mons[PM_CHICKATRICE]) || (game.mons[mnum]) == game.mons[PM_MEDUSA]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !poly_when_stoned(game.youmonst.data));
        if (mnum == PM_GREEN_SLIME || otmp.otyp == GLOB_OF_GREEN_SLIME) {
            stoneorslime = (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && !((game.youmonst.data) == game.mons[PM_GREEN_SLIME] || ((game.youmonst.data) == game.mons[PM_FIRE_VORTEX] || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_SALAMANDER]) || ((game.youmonst.data).mlet == S_GHOST)));
        }
        if (cadaver && !((mnum) == PM_LIZARD || (mnum) == PM_LICHEN || ((game.mons[mnum]) == game.mons[PM_DEATH] || (game.mons[mnum]) == game.mons[PM_FAMINE] || (game.mons[mnum]) == game.mons[PM_PESTILENCE]) || (mnum) == PM_ACID_BLOB)) {
            let age = peek_at_iced_corpse_age(otmp);
            /* worst case rather than random
               in this calculation to force prompt */
            rotted = Math.trunc((game.moves - age) / (10 + 0));
            if (otmp.cursed) {
                rotted += 2;
            } else if (otmp.blessed) {
                rotted -= 2;
            }
        }
    }
    /*
     * These problems with food should be checked in
     * order from most detrimental to least detrimental.
     */
    buf[0] = 0;
    if (cadaver && rotted > 5 && !(game.u.uprops[SICK_RES].intrinsic || game.u.uprops[SICK_RES].extrinsic || defended(game.youmonst, 33))) {
        nh_snprintf("edibility_prompts", 2675, buf, 256 /* sizeof(char [256]) */, "%s like %s could be tainted!", foodsmell, it_or_they);
    } else if (stoneorslime) {
        nh_snprintf("edibility_prompts", 2679, buf, 256 /* sizeof(char [256]) */, "%s like %s could be something very dangerous!", foodsmell, it_or_they);
    } else if (cadaver && rotted > 5 && (game.u.uprops[SICK_RES].intrinsic || game.u.uprops[SICK_RES].extrinsic || defended(game.youmonst, 33))) {
        nh_snprintf("edibility_prompts", 2686, buf, 256 /* sizeof(char [256]) */, "%s like %s could be tainted.", foodsmell, it_or_they);
    } else if (otmp.oeroded || (cadaver && rotted > 3)) {
        nh_snprintf("edibility_prompts", 2690, buf, 256 /* sizeof(char [256]) */, "%s like %s could be rotten!", foodsmell, it_or_they);
    } else if (cadaver && (((game.mons[mnum]).mflags1 & 268435456) != 0) && !(game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
        nh_snprintf("edibility_prompts", 2694, buf, 256 /* sizeof(char [256]) */, "%s like %s might be poisonous!", foodsmell, it_or_they);
    } else if (otmp.otyp == APPLE && otmp.cursed && !(game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
        nh_snprintf("edibility_prompts", 2698, buf, 256 /* sizeof(char [256]) */, "%s like %s might have been poisoned.", foodsmell, it_or_they);
    } else if (cadaver && !(((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST)) || ((game.mons[mnum]).mlet == S_PUDDING && (game.mons[mnum]) != game.mons[PM_BLACK_PUDDING])) && !game.u.uconduct.unvegetarian && (game.urole.mnum == (PM_MONK))) {
        nh_snprintf("edibility_prompts", 2701, buf, 256 /* sizeof(char [256]) */, "%s unhealthy.", foodsmell);
    } else if (cadaver && (((game.mons[mnum]).mflags1 & 134217728) != 0) && !(game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
        nh_snprintf("edibility_prompts", 2703, buf, 256 /* sizeof(char [256]) */, "%s rather acidic.", foodsmell);
    } else if ((game.u.umonnum != game.u.umonster) && game.u.umonnum == PM_RUST_MONSTER && (game.objects[otmp.otyp].oc_material >= IRON && game.objects[otmp.otyp].oc_material <= MITHRIL) && otmp.oerodeproof) {
        nh_snprintf("edibility_prompts", 2707, buf, 256 /* sizeof(char [256]) */, "%s disgusting to you right now.", foodsmell);
    } else if (!game.u.uconduct.unvegan && ((material == LEATHER || material == BONE || material == DRAGON_HIDE || material == WAX) || (cadaver && !((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST))))) {
        nh_snprintf("edibility_prompts", 2717, buf, 256 /* sizeof(char [256]) */, "%s foul and unfamiliar to you.", foodsmell);
    } else if (!game.u.uconduct.unvegetarian && ((material == LEATHER || material == BONE || material == DRAGON_HIDE) || (cadaver && !(((game.mons[mnum]).mlet == S_BLOB || (game.mons[mnum]).mlet == S_JELLY || (game.mons[mnum]).mlet == S_FUNGUS || (game.mons[mnum]).mlet == S_VORTEX || (game.mons[mnum]).mlet == S_LIGHT || ((game.mons[mnum]).mlet == S_ELEMENTAL && (game.mons[mnum]) != game.mons[PM_STALKER]) || ((game.mons[mnum]).mlet == S_GOLEM && (game.mons[mnum]) != game.mons[PM_FLESH_GOLEM] && (game.mons[mnum]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[mnum]).mlet == S_GHOST)) || ((game.mons[mnum]).mlet == S_PUDDING && (game.mons[mnum]) != game.mons[PM_BLACK_PUDDING]))))) {
        nh_snprintf("edibility_prompts", 2722, buf, 256 /* sizeof(char [256]) */, "%s unfamiliar to you.", foodsmell);
    }
    if (buf) {
        nh_snprintf("edibility_prompts", 2727, eos(buf), 256 /* sizeof(char [256]) */ - strlen(buf), "  Eat %s anyway?", (otmp.quan == 1) ? "it" : "one");
        /* causes sleep, for long enough to be dangerous */
        /*
     * Breaks conduct, but otherwise safe.
     */
        return (yn_function(buf, ynchars, 110, (1)) == 110) ? 1 : 2;
    }
    return 0;
}
export function doeat_nonfood(otmp) {
    let basenutrit = 0;
    let ll_conduct = 0;
    let nodelicious = (0);
    let material = 0;
    game.context.victual.reqtime = 1;
    game.context.victual.piece = otmp;
    game.context.victual.o_id = otmp.o_id;
    /* Don't split it, we don't need to if it's 1 move */
    game.context.victual.usedtime = 0;
    game.context.victual.canchoke = (game.u.uhs == SATIATED);
    if (otmp.oclass == COIN_CLASS) {
        basenutrit = ((otmp.quan > 200000) ? 2000 : (Math.trunc(otmp.quan / 100)));
    } else if (otmp.oclass == BALL_CLASS || otmp.oclass == CHAIN_CLASS) {
        basenutrit = weight(otmp);
    /* Note: gold weighs 1 pt. for each 1000 pieces (see
       pickup.c) so gold and non-gold is consistent. */
    /* oc_nutrition is usually weight anyway */
    } else {
        basenutrit = game.objects[otmp.otyp].oc_nutrition;
    }
    if (otmp.otyp == SCR_MAIL) {
        basenutrit = 0;
        nodelicious = (1);
    }
    game.context.victual.nmod = basenutrit;
    game.context.victual.eating = 1;
    if (!game.u.uconduct.food++) {
        ll_conduct++;
        livelog_printf(32, "ate for the first time (%s)", food_xname(otmp, (0)));
    }
    material = game.objects[otmp.otyp].oc_material;
    if (material == LEATHER || material == BONE || material == DRAGON_HIDE || material == WAX) {
        if (!game.u.uconduct.unvegan++ && !ll_conduct) {
            livelog_printf(32, "consumed animal products for the first time, by eating %s", an(food_xname(otmp, (0))));
            ll_conduct++;
        }
        if (material != WAX) {
            if (!game.u.uconduct.unvegetarian && !ll_conduct) {
                livelog_printf(32, "tasted meat by-products for the first time, by eating %s", an(food_xname(otmp, (0))));
            }
            violated_vegetarian();
        }
    }
    if (otmp.cursed) {
        rottenfood(otmp);
        nodelicious = (1);
    } else if (game.objects[otmp.otyp].oc_material == PAPER) {
        nodelicious = (1);
    }
    if (otmp.oclass == WEAPON_CLASS && otmp.otrapped) {
        pline("Ecch - that must have been poisonous!");
        if (!(game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
            poison_strdmg(rnd(4), rnd(15), xname(otmp), 0);
        } else {
            You("seem unaffected by the poison.");
        }
    } else if (!nodelicious) {
        pline("%s%s is delicious!", (obj_is_pname(otmp) && otmp.oartifact < ART_ORB_OF_DETECTION) ? "" : "This ", (otmp.oclass == COIN_CLASS) ? foodword(otmp) : singular(otmp, xname));
    }
    eatspecial();
    return 1;
}
/* the #eat command */
export function doeat() {
    let otmp = null;
    let basenutrit = 0;
    let dont_start = (0);
    let already_partly_eaten = 0;
    let ll_conduct = 0;
    if (game.u.uprops[STRANGLED].intrinsic) {
        pline("If you can't breathe air, how can you consume solids?");
        return 0;
    }
    if (!(otmp = floorfood("eat", 0))) {
        return 0;
    }
    if (check_capacity(null)) {
        return 0;
    }
    if (game.u.uedibility) {
        let res = edibility_prompts(otmp);
        if (res) {
            Your("%s stops tingling and your sense of smell returns to normal.", body_part(NOSE));
            game.u.uedibility = 0;
            if (res == 1) {
                return 0;
            }
        }
    }
    if (otmp == game.hands_obj) {
        if (still_chewing(game.u.ux, game.u.uy) && game.level.locations[game.u.ux][game.u.uy].typ == IRONBARS) {
            /* from floorfood(), &hands_obj means iron bars at current spot */
            /* hero in metallivore form is eating [diggable] iron bars
           at current location so skip the other assorted checks;
           operates as if digging rather than via the eat occupation */
            /* this is verbose, but player will see the hero rather than the
               bars so wouldn't know that more turns of eating are required */
            You("pause to swallow.");
        }
        return 1;
    }
    if (!is_edible(otmp)) {
        /* We have to make non-foods take 1 move to eat, unless we want to
     * do ridiculous amounts of coding to deal with partly eaten plate
     * mails, players who polymorph back to human in the middle of their
     * metallic meal, etc....
     */
        You("cannot eat that!");
        return 0;
    } else if ((otmp.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | 524288 | 65536 | 1048576)) != 0) {
        You_cant("eat %s you're wearing.", c_common_strings.c_something);
        return 0;
    } else if (!(((otmp).where == 3) ? retouch_object({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, (0)) : touch_artifact(otmp, game.youmonst))) {
        return 1;
    }
    if ((game.objects[otmp.otyp].oc_material >= IRON && game.objects[otmp.otyp].oc_material <= MITHRIL) && game.u.umonnum == PM_RUST_MONSTER && otmp.oerodeproof) {
        otmp.rknown = (1);
        if (otmp.quan > 1) {
            if (!((otmp).where == 3)) {
                splitobj(otmp, otmp.quan - 1);
            } else {
                otmp = splitobj(otmp, 1);
            }
        }
        pline("Ulch - that %s was rustproofed!", xname(otmp));
        /* The regurgitated object's rustproofing is gone now */
        otmp.oerodeproof = 0;
        make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + rn2(10), (1));
        if (welded(otmp) || (otmp.cursed && (otmp.owornmask & (131072 | 262144)))) {
            /*
         * We don't expect rust monsters to be wielding welded weapons
         * or wearing cursed rings which were rustproofed, but guard
         * against the possibility just in case.
         */
            /* for ring; welded() does this for weapon */
            set_bknown(otmp, 1);
            You("spit out %s.", the(xname(otmp)));
        } else {
            You("spit %s out onto the %s.", the(xname(otmp)), surface(game.u.ux, game.u.uy));
            if (((otmp).where == 3)) {
                /* no need to check for leash in use; it's not metallic */
                if (otmp.owornmask) {
                    remove_worn_item(otmp, (0));
                }
                freeinv(otmp);
                dropy(otmp);
            }
            stackobj(otmp);
        }
        return 1;
    }
    if (otmp.otyp == RIN_SLOW_DIGESTION) {
        /* KMH -- Slow digestion is... indigestible */
        pline("This ring is indigestible!");
        rottenfood(otmp);
        if (otmp.dknown) {
            trycall(otmp);
        }
        return 1;
    }
    if (otmp.oclass != FOOD_CLASS) {
        return doeat_nonfood(otmp);
    }
    if (otmp == game.context.victual.piece) {
        let one_bite_left = (game.context.victual.usedtime + 1 >= game.context.victual.reqtime);
        /* If they weren't able to choke, they don't suddenly become able to
         * choke just because they were interrupted.  On the other hand, if
         * they were able to choke before, if they lost food it's possible
         * they shouldn't be able to choke now.
         */
        if (game.u.uhs != SATIATED) {
            game.context.victual.canchoke = 0;
        }
        game.context.victual.o_id = 0;
        otmp = touchfood(otmp);
        if (otmp) {
            game.context.victual.piece = otmp;
            game.context.victual.o_id = otmp.o_id;
        } else {
            do_reset_eat();
        }
        /* if there's only one bite left, there sometimes won't be any
           "you finish eating" message when done; use different wording
           for resuming with one bite remaining instead of trying to
           determine whether or not "you finish" is going to be given */
        You("%s your meal.", !one_bite_left ? "resume" : "consume the last bite of");
        if (otmp) {
            start_eating(otmp, (0));
        }
        return 1;
    }
    if (otmp.otyp == TIN) {
        /* nothing in progress - so try to find something. */
        /* tins must also check conduct separately in case they're discarded */
        start_tin(otmp);
        return 1;
    }
    if (!game.u.uconduct.food++) {
        livelog_printf(32, "ate for the first time - %s", food_xname(otmp, (0)));
        ll_conduct++;
    }
    already_partly_eaten = otmp.oeaten ? (1) : (0);
    otmp = touchfood(otmp);
    if (otmp) {
        game.context.victual.piece = otmp;
        game.context.victual.o_id = otmp.o_id;
        game.context.victual.usedtime = 0;
    } else {
        do_reset_eat();
        return 1;
    }
    if (otmp.otyp == CORPSE || otmp.globby) {
        /* Now we need to calculate delay and nutritional info.
     * The base nutrition calculated here and in eatcorpse() accounts
     * for normal vs. rotten food.  The reqtime and nutrit values are
     * then adjusted in accordance with the amount of food left.
     */
        let tmp = eatcorpse(otmp);
        /* if not used up, eatcorpse sets up reqtime and may modify oeaten */
        if (tmp == 2) {
            game.context.victual = zero_victual;
            return 1;
        } else if (tmp) {
            dont_start = (1);
        }
    } else {
        switch (game.objects[otmp.otyp].oc_material) {
            case FLESH:
                if (!game.u.uconduct.unvegan++ && !ll_conduct) {
                    /* No checks for WAX, LEATHER, BONE, DRAGON_HIDE.  These are
         * all handled in the != FOOD_CLASS case, above.
         */
                    livelog_printf(32, "consumed animal products for the first time, by eating %s", an(food_xname(otmp, (0))));
                    ll_conduct++;
                }
                if (otmp.otyp != EGG) {
                    if (!game.u.uconduct.unvegetarian && !ll_conduct) {
                        livelog_printf(32, "tasted meat for the first time, by eating %s", an(food_xname(otmp, (0))));
                    }
                    violated_vegetarian();
                }
                break;
            default:
                if (otmp.otyp == PANCAKE || otmp.otyp == FORTUNE_COOKIE || otmp.otyp == CREAM_PIE || otmp.otyp == CANDY_BAR || otmp.otyp == LUMP_OF_ROYAL_JELLY) {
                    if (!game.u.uconduct.unvegan++ && !ll_conduct) {
                        livelog_printf(32, "consumed animal products (%s) for the first time", food_xname(otmp, (0)));
                    }
                }
                break;
        }
        game.context.victual.reqtime = game.objects[otmp.otyp].oc_delay;
        if (otmp.otyp != FORTUNE_COOKIE && (otmp.cursed || (!((otmp.otyp) == LEMBAS_WAFER || (otmp.otyp) == CRAM_RATION) && (game.moves - otmp.age) > (otmp.blessed ? 50 : 30) && (otmp.oeroded || !rn2(7))))) {
            if (rottenfood(otmp)) {
                otmp.oeroded = (1);
                dont_start = (1);
            }
            consume_oeaten(otmp, 1);
        } else if (!already_partly_eaten) {
            if (!fprefx(otmp)) {
                do_reset_eat();
                return 1;
            }
        } else {
            You("%s %s.", (game.context.victual.reqtime == 1) ? "eat" : "begin eating", doname(otmp));
        }
    }
    basenutrit = obj_nutrition(otmp);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("before rounddiv: victual.reqtime == %d, oeaten == %d, basenutrit == %d", game.context.victual.reqtime, otmp.oeaten, basenutrit);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    game.context.victual.reqtime = (basenutrit == 0) ? 0 : rounddiv(game.context.victual.reqtime * otmp.oeaten, basenutrit);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("after rounddiv: victual.reqtime == %d", game.context.victual.reqtime);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    /*
     * calculate the modulo value (nutrit. units per round eating)
     * note: this isn't exact - you actually lose a little nutrition due
     *       to this method.
     * TODO: add in a "remainder" value to be given at the end of the meal.
     */
    if (game.context.victual.reqtime == 0 || otmp.oeaten == 0) {
        game.context.victual.nmod = 0;
    } else if (otmp.oeaten >= game.context.victual.reqtime) {
        game.context.victual.nmod = -(Math.trunc(otmp.oeaten / game.context.victual.reqtime));
    } else {
        game.context.victual.nmod = game.context.victual.reqtime % otmp.oeaten;
    }
    game.context.victual.canchoke = (game.u.uhs == SATIATED);
    if (!dont_start) {
        start_eating(otmp, already_partly_eaten);
    /* possible if most has been eaten before */
    } else {
        otmp.owt = weight(otmp);
    }
    return 1;
}
/* getobj callback for object to be opened with a tin opener */
export function tinopen_ok(obj) {
    if (obj && obj.otyp == TIN) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_EXCLUDE;
}
export function use_tin_opener(obj) {
    let otmp = null;
    let res = 0;
    if (!carrying(TIN)) {
        You("have no tin to open.");
        return 0;
    }
    if (obj != game.uwep) {
        if (obj.cursed && obj.bknown) {
            let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            if (yn_function(safe_qbuf(qbuf, "Really wield ", "?", obj, doname, thesimpleoname, "that"), ynqchars, 113, (1)) != 121) {
                return 0;
            }
        }
        if (!wield_tool(obj, "use")) {
            return 0;
        }
        res = 1;
    }
    otmp = getobj("open", tinopen_ok, 0);
    if (!otmp) {
        return (res | 2);
    }
    start_tin(otmp);
    return 1;
}
/* Take a single bite from a piece of food, checking for choking and
 * modifying usedtime.  Returns 1 if they choked and survived, 0 otherwise.
 */
export function bite() {
    /* hack to pacify static analyzer incorporated into gcc 12.2 */
    sa_victual(game.context.victual);
    if (game.context.victual.canchoke && game.u.uhunger >= 2000) {
        choke(game.context.victual.piece);
        return 1;
    }
    if (game.context.victual.doreset) {
        do_reset_eat();
        return 0;
    }
    game.force_save_hs = (1);
    if (game.context.victual.nmod < 0) {
        lesshungry(adj_victual_nutrition());
        consume_oeaten(game.context.victual.piece, game.context.victual.nmod);
    } else if (game.context.victual.nmod > 0 && (game.context.victual.usedtime % game.context.victual.nmod)) {
        lesshungry(1);
        consume_oeaten(game.context.victual.piece, -1);
    }
    game.force_save_hs = (0);
    recalc_wt();
    return 0;
}
/* as time goes by - called by moveloop(every move) & domove(melee attack) */
export function gethungry() {
    let accessorytime = 0;
    if (game.u.uinvulnerable || game.iflags.debug_hunger) {
        return;
    }
    /* being polymorphed into a creature which doesn't eat prevents
       this first uhunger decrement, but to stay in such form the hero
       will need to wear an Amulet of Unchanging so still burn a small
       amount of nutrition in the 'moves % 20' ring/amulet check below */
    /* slow metabolic rate while asleep */
    if ((!(game.multi < 0 && (unconscious() || is_fainted())) || !rn2(10)) && ((((game.youmonst.data).mflags1 & 536870912) != 0) || (((game.youmonst.data).mflags1 & 1073741824) != 0) || (((game.youmonst.data).mflags1 & 2147483648) != 0)) && !(game.u.uprops[SLOW_DIGESTION].intrinsic || game.u.uprops[SLOW_DIGESTION].extrinsic)) {
        game.u.uhunger--;
    }
    /* ordinary food consumption */
    /*
     * 5.0:  trigger is randomized instead of (moves % N).  Makes
     * ring juggling (using the 'time' option to see the turn counter
     * in order to time swapping of a pair of rings of slow digestion,
     * wearing one on one hand, then putting on the other and taking
     * off the first, then vice versa, over and over and over and ...
     * to avoid any hunger from wearing a ring) become ineffective.
     * Also causes melee-induced hunger to vary from turn-based hunger
     * instead of just replicating that.
     */
    /* rn2(20) replaces (int) (svm.moves % 20L) */
    accessorytime = rn2(20);
    if (accessorytime % 2) {
        /* Regeneration uses up food, unless due to an artifact */
        if ((game.u.uprops[REGENERATION].intrinsic & ~268435456) || (game.u.uprops[REGENERATION].extrinsic & ~(8192 | 256))) {
            game.u.uhunger--;
        }
        if (near_capacity() > SLT_ENCUMBER) {
            game.u.uhunger--;
        }
    } else {
        if ((game.u.uprops[HUNGER].intrinsic || game.u.uprops[HUNGER].extrinsic)) {
            game.u.uhunger--;
        }
        /* Conflict uses up food too */
        if (game.u.uprops[CONFLICT].intrinsic || (game.u.uprops[CONFLICT].extrinsic & (~8192))) {
            game.u.uhunger--;
        }
        switch (accessorytime) {
            /*
         * +0 charged rings don't do anything, so don't affect hunger.
         * Slow digestion cancels movement and melee hunger but still
         * causes ring hunger.
         * Possessing the real Amulet imposes a separate hunger penalty
         * from wearing an amulet (so gets a double penalty when worn).
         *
         * 5.0.0:  Worn meat rings don't affect hunger.
         * Same with worn cheap plastic imitation of the Amulet.
         * +0 ring of protection might do something (enhanced "magical
         * cancellation") if hero doesn't have protection from some
         * other source (cloak or second ring).
         *
         * [If wearing duplicate rings whose effects don't stack,
         * should they both consume nutrition, or just one of them?
         * Two +0 rings of protection are treated as if only one,
         * but this could apply to most rings.]
         */
            /* note: use even cases among 0..19 only */
            case 0:
                if ((game.u.uprops[SLOW_DIGESTION].intrinsic || game.u.uprops[SLOW_DIGESTION].extrinsic) && (!game.uright || game.uright.otyp != RIN_SLOW_DIGESTION) && (!game.uleft || game.uleft.otyp != RIN_SLOW_DIGESTION)) {
                    game.u.uhunger--;
                }
                break;
            case 4:
                if (game.uleft && game.uleft.otyp != MEAT_RING && (game.uleft.spe || !game.objects[game.uleft.otyp].oc_charged || (game.uleft.otyp == RIN_PROTECTION && ((game.u.uprops[PROTECTION].extrinsic & ~131072) == 0 || ((game.u.uprops[PROTECTION].extrinsic & ~131072) == 262144 && game.uright && game.uright.otyp == RIN_PROTECTION && !game.uright.spe))))) {
                    game.u.uhunger--;
                }
                break;
            case 8:
                if (game.uamul && game.uamul.otyp != FAKE_AMULET_OF_YENDOR) {
                    game.u.uhunger--;
                }
                break;
            case 12:
                if (game.uright && game.uright.otyp != MEAT_RING && (game.uright.spe || !game.objects[game.uright.otyp].oc_charged || (game.uright.otyp == RIN_PROTECTION && (game.u.uprops[PROTECTION].extrinsic & ~262144) == 0))) {
                    game.u.uhunger--;
                }
                break;
            case 16:
                if (game.u.uhave.amulet) {
                    game.u.uhunger--;
                }
                break;
            default:
                break;
        }
    }
    newuhs((1));
}
/* called after vomiting and after performing feats of magic */
export function morehungry(num) {
    game.u.uhunger -= num;
    newuhs((1));
}
/* called after eating (and after drinking fruit juice) */
export function lesshungry(num) {
    /* See comments in newuhs() for discussion on force_save_hs */
    let iseating = (game.occupation == eatfood) || game.force_save_hs;
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/eat.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("lesshungry(%d)", num);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    game.u.uhunger += num;
    if (game.u.uhunger >= 2000) {
        if (!iseating || game.context.victual.canchoke) {
            if (iseating) {
                choke(game.context.victual.piece);
                reset_eat();
            } else {
                choke((game.occupation == opentin) ? game.context.tin.tin : null);
            }
        }
    } else {
        if (game.u.uhunger >= 1500 && !(game.u.uprops[HUNGER].intrinsic || game.u.uprops[HUNGER].extrinsic) && (!game.context.victual.eating || (game.context.victual.eating && !game.context.victual.fullwarn))) {
            /* Have lesshungry() report when you're nearly full so all eating
         * warns when you're about to choke.
         */
            pline("You're having a hard time getting all of it down.");
            game.nomovemsg = "You're finally finished.";
            if (!game.context.victual.eating) {
                game.multi = -2;
            } else {
                game.context.victual.fullwarn = 1;
                if (game.context.victual.canchoke && (game.context.victual.reqtime - game.context.victual.usedtime) > 1) {
                    if (!paranoid_query(((game.flags.paranoia_bits & 512) != 0), "Continue eating?")) {
                        /* food with one bite left will not survive a stop */
                        reset_eat();
                        game.nomovemsg = null;
                    }
                }
            }
        }
    }
    newuhs((0));
}
export function unfaint() {
    Hear_again();
    if (game.u.uhs > FAINTING) {
        game.u.uhs = FAINTING;
    }
    stop_occupation();
    game.disp.botl = (1);
    return 0;
}
export function is_fainted() {
    return (game.u.uhs == FAINTED);
}
/* call when a faint must be prematurely terminated */
export function reset_faint() {
    if (game.afternmv == unfaint) {
        unmul("You revive.");
    }
}
/* compute and comment on your (new?) hunger status */
let __newuhs_save_hs = 0;
let __newuhs_saved_hs = (0);
export function newuhs(incr) {
    let newhs = 0;
    let h = game.u.uhunger;
    newhs = (h > 1000) ? SATIATED : (h > 150) ? NOT_HUNGRY : (h > 50) ? HUNGRY : (h > 0) ? WEAK : FAINTING;
    if (game.occupation == eatfood || game.force_save_hs) {
        if (!__newuhs_saved_hs) {
            /* While you're eating, you may pass from WEAK to HUNGRY to NOT_HUNGRY.
     * This should not produce the message "you only feel hungry now";
     * that message should only appear if HUNGRY is an endpoint.  Therefore
     * we check to see if we're in the middle of eating.  If so, we save
     * the first hunger status, and at the end of eating we decide what
     * message to print based on the _entire_ meal, not on each little bit.
     */
            /* It is normally possible to check if you are in the middle of a meal
     * by checking occupation == eatfood, but there is one special case:
     * start_eating() can call bite() for your first bite before it
     * sets the occupation.
     * Anyone who wants to get that case to work _without_ an ugly static
     * force_save_hs variable, feel free.
     */
            /* Note: If you become a certain hunger status in the middle of the
     * meal, and still have that same status at the end of the meal,
     * this will incorrectly print the associated message at the end of
     * the meal instead of the middle.  Such a case is currently
     * impossible, but could become possible if a message for SATIATED
     * were added or if HUNGRY and WEAK were separated by a big enough
     * gap to fit two bites.
     */
            __newuhs_save_hs = game.u.uhs;
            __newuhs_saved_hs = (1);
        }
        game.u.uhs = newhs;
        return;
    } else {
        if (__newuhs_saved_hs) {
            game.u.uhs = __newuhs_save_hs;
            __newuhs_saved_hs = (0);
        }
    }
    if (newhs == FAINTING) {
        /* u,uhunger is likely to be negative at this point */
        let uhunger_div_by_10 = sgn(game.u.uhunger) * (Math.trunc((abs(game.u.uhunger) + 5) / 10));
        if (is_fainted()) {
            newhs = FAINTED;
        }
        if (game.u.uhs <= WEAK || rn2(20 - uhunger_div_by_10) >= 19) {
            /* this used to be -(200 + 20 * Con) but that was when being asleep
           suppressed per-turn uhunger decrement but being fainted didn't;
           now uhunger becomes more negative at a slower rate */
            if (!is_fainted() && game.multi >= 0) {
                let duration = 10 - uhunger_div_by_10;
                /* stop what you're doing, then faint */
                stop_occupation();
                You("faint from lack of food.");
                incr_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, duration);
                game.disp.botl = (1);
                nomul(-duration);
                game.multi_reason = "fainted from lack of food";
                game.nomovemsg = "You regain consciousness.";
                game.afternmv = unfaint;
                newhs = FAINTED;
                if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
                    selftouch("Falling, you");
                }
            }
        } else if (game.u.uhunger < -(100 + 10 * (acurr(A_CON)))) {
            game.u.uhs = STARVED;
            game.disp.botl = (1);
            bot();
            You("die from starvation.");
            game.killer.format = 1;
            game.killer.name = strcpy(game.killer.name, "starvation");
            done(STARVING);
            return;
        }
    }
    if (newhs != game.u.uhs) {
        if (newhs >= WEAK && game.u.uhs < WEAK) {
            (game.u.atemp.a[A_STR]) = -1;
        } else if (newhs < WEAK && game.u.uhs >= WEAK) {
            (game.u.atemp.a[A_STR]) = 0;
        }
        switch (newhs) {
            case HUNGRY:
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    /* this used to be losestr(1) which had the potential to
               be fatal (still handled below) by reducing HP if it
               tried to take base strength below minimum of 3 */
                    /* temporary loss overrides Fixed_abil */
                    /* defer context.botl status update until after hunger message */
                    /* this used to be losestr(-1) which could be abused by
               becoming weak while wearing ring of sustain ability,
               removing ring, eating to 'restore' strength which boosted
               strength by a point each time the cycle was performed;
               substituting "while polymorphed" for sustain ability and
               "rehumanize" for ring removal might have done that too */
                    /* repair of loss also overrides Fixed_abil */
                    You(!incr ? "now have a lesser case of the munchies." : "are getting the munchies.");
                } else {
                    You("%s.", !incr ? "only feel hungry now" : (game.u.uhunger < 145) ? "feel hungry" : "are beginning to feel hungry");
                }
                if (incr && game.occupation && (game.occupation != eatfood && game.occupation != opentin)) {
                    stop_occupation();
                }
                end_running((1));
                break;
            case WEAK:
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    pline(!incr ? "You still have the munchies." : "The munchies are interfering with your motor capabilities.");
                } else if (incr && ((game.urole.mnum == (PM_WIZARD)) || (game.urace.mnum == (PM_ELF)) || (game.urole.mnum == (PM_VALKYRIE)))) {
                    pline("%s needs food, badly!", ((game.urole.mnum == (PM_WIZARD)) || (game.urole.mnum == (PM_VALKYRIE))) ? game.urole.name.m : "Elf");
                } else {
                    You("%s weak.", !incr ? "are still" : (game.u.uhunger < 45) ? "feel" : "are beginning to feel");
                }
                if (incr && game.occupation && (game.occupation != eatfood && game.occupation != opentin)) {
                    stop_occupation();
                }
                end_running((1));
                break;
        }
        game.u.uhs = newhs;
        game.disp.botl = (1);
        bot();
        if (((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp) < 1) {
            You("die from hunger and exhaustion.");
            game.killer.format = 1;
            game.killer.name = strcpy(game.killer.name, "exhaustion");
            done(STARVING);
            return;
        }
    }
}
/* getobj callback for object to eat - effectively just wraps is_edible() */
export function eat_ok(obj) {
    /* 'getobj_else' will be non-zero if floor food is present and
       player declined to eat that; used to insert "else" into
       "you don't have anything [else] to eat" if not carrying any food */
    if (!obj) {
        return game.getobj_else ? GETOBJ_EXCLUDE_NONINVENT : GETOBJ_EXCLUDE;
    }
    if (is_edible(obj)) {
        return GETOBJ_SUGGEST;
    }
    /* make sure to exclude, not downplay, gold (if not is_edible) in order to
     * produce the "You cannot eat gold" message in getobj */
    if (obj.oclass == COIN_CLASS) {
        return GETOBJ_EXCLUDE;
    }
    return GETOBJ_EXCLUDE_SELECTABLE;
}
/* getobj callback for object to be offered (corpses and things that look like
 * the Amulet only */
export function offer_ok(obj) {
    if (!obj) {
        return game.getobj_else ? GETOBJ_EXCLUDE_NONINVENT : GETOBJ_EXCLUDE;
    }
    if (obj.oclass != FOOD_CLASS && obj.oclass != AMULET_CLASS) {
        return GETOBJ_EXCLUDE;
    }
    if (obj.otyp != CORPSE && obj.otyp != AMULET_OF_YENDOR && obj.otyp != FAKE_AMULET_OF_YENDOR) {
        return GETOBJ_EXCLUDE_SELECTABLE;
    }
    /* suppress corpses on astral, amulets elsewhere
     * (!astral && amulet) || (astral && !amulet) */
    if ((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) ^ (obj.oclass == AMULET_CLASS)) {
        return GETOBJ_DOWNPLAY;
    }
    return GETOBJ_SUGGEST;
}
/* getobj callback for object to be tinned */
export function tin_ok(obj) {
    if (!obj) {
        return game.getobj_else ? GETOBJ_EXCLUDE_NONINVENT : GETOBJ_EXCLUDE;
    }
    if (obj.oclass != FOOD_CLASS) {
        return GETOBJ_EXCLUDE;
    }
    if (obj.otyp != CORPSE || !tinnable(obj)) {
        return GETOBJ_EXCLUDE_SELECTABLE;
    }
    return GETOBJ_SUGGEST;
}
/* Returns an object representing food.
 * Object may be either on floor or in inventory.
 */
/* 0, no check, 1, corpses, 2, tinnable corpses */
export function floorfood(verb, corpsecheck) {
    let otmp = null;
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let c = 0;
    let uptr = null;
    let feeding = 0;
    let offering = 0;
    skipfloor: {
        uptr = game.youmonst.data;
        feeding = !strcmp(verb, "eat");
        offering = !strcmp(verb, "sacrifice");
        /* haven't asked about floor food; is used to vary
                      * "you don't have anything [else] to eat" when
                      * floor food has been declined and inventory lacks
                      * any suitable items */
        /* resetting 'getobj_else' here isn't essential; it will be cleared the
       next time it needs to be used */
        game.getobj_else = 0;
        /* if we can't touch floor objects then use invent food only;
       same when 'm' prefix is used--for #eat, it means "skip floor food" */
        if (game.iflags.menu_requested || !can_reach_floor((1)) || (feeding && game.u.usteed) || (is_pool_or_lava(game.u.ux, game.u.uy) && (((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) || (((uptr).mflags1 & 16) != 0) || (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && !(game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)))))) {
            break skipfloor;
        }
        if (feeding && (((uptr).mflags1 & 2147483648) != 0)) {
            let gold = null;
            let ttmp = t_at(game.u.ux, game.u.uy);
            if (ttmp && ttmp.tseen && ttmp.ttyp == BEAR_TRAP) {
                let u_in_beartrap = (game.u.utrap && game.u.utraptype == TT_BEARTRAP);
                qbuf = sprintf(qbuf, "There is a bear trap here (%s); eat it?", u_in_beartrap ? "holding you" : "armed");
                if ((c = yn_function(qbuf, ynqchars, 110, (1))) == 121) {
                    /* If not already stuck in the trap, perhaps there should
               be a chance to becoming trapped?  Probably not, because
               then the trap would just get eaten on the _next_ turn... */
                    let beartrap = null;
                    deltrap(ttmp);
                    if (u_in_beartrap) {
                        reset_utrap((1));
                    }
                    beartrap = mksobj(BEARTRAP, (1), (0));
                    qbuf = sprintf(qbuf, "You only manage to %s the bear trap.", u_in_beartrap ? "free yourself from" : "disarm");
                    if (check_capacity(qbuf) && beartrap) {
                        obj_extract_self(beartrap);
                        dropy(beartrap);
                        /* if life-saved (or poly'd into stone golem), terminate
                   attempt to eat off floor */
                        return null;
                    }
                    return beartrap;
                } else if (c == 113) {
                    return null;
                }
                ++game.getobj_else;
            }
            if (game.level.locations[game.u.ux][game.u.uy].typ == IRONBARS) {
                /* already verified that hero is metallivorous above */
                let nodig = (game.level.locations[game.u.ux][game.u.uy].flags & 8) != 0;
                c = 110;
                qbuf = strcpy(qbuf, "There are iron bars here");
                if (nodig || game.u.uhunger > 1500) {
                    pline("%s but you %s eat them.", qbuf, nodig ? "cannot" : "are too full to");
                } else {
                    qbuf = strcat(qbuf, (!game.context.digging.chew || !((game.context.digging.pos.x) == game.u.ux && (game.context.digging.pos.y) == game.u.uy) || !on_level(game.context.digging.level, game.u.uz)) ? "; eat them?" : "; resume eating them?");
                    c = yn_function(qbuf, ynqchars, 110, (1));
                }
                if (c == 121) {
                    return game.hands_obj;
                } else if (c == 113) {
                    return null;
                }
                ++game.getobj_else;
            }
            if (uptr != game.mons[PM_RUST_MONSTER] && (gold = g_at(game.u.ux, game.u.uy)) != null) {
                if (gold.quan == 1) {
                    qbuf = sprintf(qbuf, "There is 1 gold piece here; eat it?");
                } else {
                    qbuf = sprintf(qbuf, "There are %ld gold pieces here; eat them?", gold.quan);
                }
                if ((c = yn_function(qbuf, ynqchars, 110, (1))) == 121) {
                    return gold;
                } else if (c == 113) {
                    return null;
                }
                ++game.getobj_else;
            }
        }
        for (otmp = game.level.objects[game.u.ux][game.u.uy]; otmp; otmp = otmp.v.v_nexthere) {
            if (corpsecheck ? (otmp.otyp == CORPSE && (corpsecheck == 1 || tinnable(otmp))) : feeding ? (otmp.oclass != COIN_CLASS && is_edible(otmp)) : otmp.oclass == FOOD_CLASS) {
                /* Is there some food (probably a heavy corpse) here on the ground? */
                let qsfx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let one = (otmp.quan == 1);
                if (otmp.otyp == CORPSE && will_feel_cockatrice(otmp, (0))) {
                    /* if blind and without gloves, attempting to eat (or tin or
               offer) a cockatrice corpse is fatal before asking whether
               or not to use it; otherwise, 'm<dir>' followed by 'e' could
               be used to locate cockatrice corpses without touching them */
                    feel_cockatrice(otmp, (0));
                    return null;
                }
                qbuf = sprintf(qbuf, "There %s ", otense(otmp, "are"));
                qsfx = sprintf(qsfx, " here; %s %s?", verb, one ? "it" : "one");
                /* "There is <an object> here; <verb> it?" or
               "There are <N objects> here; <verb> one?" */
                safe_qbuf(qbuf, qbuf, qsfx, otmp, doname, ansimpleoname, one ? c_common_strings.c_something : "things");
                if ((c = yn_function(qbuf, ynqchars, 110, (1))) == 121) {
                    return otmp;
                } else if (c == 113) {
                    return null;
                }
                ++game.getobj_else;
            }
        }
    }
    if (feeding) {
        /* We cannot use GETOBJ_PROMPT since we don't want a prompt in the case
       where nothing edible is being carried. */
        otmp = getobj("eat", eat_ok, 0);
    } else if (offering) {
        otmp = getobj("sacrifice", offer_ok, 0);
    } else if (corpsecheck == 2) {
        otmp = getobj(verb, tin_ok, 0);
    } else {
        impossible("floorfood: unknown request (%s)", verb);
        otmp = null;
    }
    if (otmp && corpsecheck && !(offering && otmp.oclass == AMULET_CLASS)) {
        if (otmp.otyp != CORPSE || (corpsecheck == 2 && !tinnable(otmp))) {
            You_cant("%s that!", verb);
            otmp = null;
        }
    }
    game.getobj_else = 0;
    return otmp;
}
/* Side effects of vomiting */
/* added nomul (MRS) - it makes sense, you're too busy being sick! */
/* A good idea from David Neves */
export function vomit() {
    let spewed = (0);
    if (cantvomit(game.youmonst.data)) {
        /* doesn't cure food poisoning; message assumes that we aren't
           dealing with some esoteric body_part() */
        Your("jaw gapes convulsively.");
    } else {
        if (game.u.uprops[SICK].intrinsic && (game.u.usick_type & 1) != 0) {
            make_sick(0, null, (1), 1);
        }
        if (game.u.uhs >= FAINTING) {
            Your("%s heaves convulsively!", body_part(STOMACH));
        /* if not enough in stomach to actually vomit then dry heave;
           vomiting_dialog() gives a vomit message when its countdown
           reaches 0, but only if u.uhs < FAINTING (and !cantvomit()) */
        } else {
            spewed = (1);
        }
    }
    if (game.multi >= -2) {
        /* nomul()/You_can_move_again used to be unconditional, which was
       viable while eating but not for Vomiting countdown where hero might
       be immobilized for some other reason at the time vomit() is called */
        nomul(-2);
        game.multi_reason = "vomiting";
        game.nomovemsg = c_common_strings.c_You_can_move_again;
    }
    if (spewed) {
        let mattk = attacktype_fordmg(game.youmonst.data, 12, 8);
        if (mattk) {
            /* currently, only yellow dragons can breathe acid */
            You("breathe acid on yourself...");
            ubreatheu(mattk);
        }
        /* vomiting on an altar is, all things considered, rather impolite */
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR)) {
            altar_wrath(game.u.ux, game.u.uy);
        }
        if ((((game.youmonst.data).mflags1 & 134217728) != 0)) {
            /* if poly'd into acidic form, stomach acid is stronger than normal */
            /* TODO: if there's a web here, destroy that too (before ice) */
            if (is_ice(game.u.ux, game.u.uy)) {
                melt_ice(game.u.ux, game.u.uy, "Your stomach acid melts straight through the ice!");
            }
        }
    }
}
export function eaten_stat(base, obj) {
    let uneaten_amt = 0;
    let full_amount = 0;
    /* get full_amount first; obj_nutrition() might modify obj->oeaten */
    full_amount = obj_nutrition(obj);
    uneaten_amt = obj.oeaten;
    if (uneaten_amt > full_amount) {
        impossible("partly eaten food (%ld) more nutritious than untouched food (%ld)", uneaten_amt, full_amount);
        uneaten_amt = full_amount;
    }
    base = (full_amount ? Math.trunc(base * uneaten_amt / full_amount) : 0);
    return (base < 1) ? 1 : base;
}
/* reduce obj's oeaten field, making sure it never hits or passes 0 */
export function consume_oeaten(obj, amt) {
    if (!obj_nutrition(obj)) {
        let itembuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let otyp = obj.otyp;
        if (otyp == CORPSE || otyp == EGG || otyp == TIN) {
            itembuf = strcpy(itembuf, (otyp == CORPSE) ? "corpse" : (otyp == EGG) ? "egg" : (otyp == TIN) ? "tin" : "other?");
            itembuf = (itembuf || '') + sprintf('', " [%d]", obj.corpsenm);
        } else {
            itembuf = sprintf(itembuf, "%d", otyp);
        }
        impossible("oeaten: attempting to set 0 nutrition food (%s) partially eaten", itembuf);
        return;
    }
    if (amt > 0) {
        /*
     * This is a hack to try to squelch several long standing mystery
     * food bugs.  A better solution would be to rewrite the entire
     * victual handling mechanism from scratch using a less complex
     * model.  Alternatively, this routine could call done_eating()
     * or food_disappears() but its callers would need revisions to
     * cope with svc.context.victual.piece unexpectedly going away.
     *
     * Multi-turn eating operates by setting the food's oeaten field
     * to its full nutritional value and then running a counter which
     * independently keeps track of whether there is any food left.
     * The oeaten field can reach exactly zero on the last turn, and
     * the object isn't removed from inventory until the next turn
     * when the "you finish eating" message gets delivered, so the
     * food would be restored to the status of untouched during that
     * interval.  This resulted in unexpected encumbrance messages
     * at the end of a meal (if near enough to a threshold) and would
     * yield full food if there was an interruption on the critical
     * turn.  Also, there have been reports over the years of food
     * becoming massively heavy or producing unlimited satiation;
     * this would occur if reducing oeaten via subtraction attempted
     * to drop it below 0 since its unsigned type would produce a
     * huge positive value instead.  So far, no one has figured out
     * _why_ that inappropriate subtraction might sometimes happen.
     */
        /* bit shift to divide the remaining amount of food */
        obj.oeaten >>= amt;
    } else {
        if (obj.oeaten > -amt) {
            obj.oeaten += amt;
        /* simple decrement; value is negative so we actually add it */
        } else {
            obj.oeaten = 0;
        }
    }
    if (obj.oeaten == 0) {
        /* mustn't let partly-eaten drop all the way to 0 or the item would
       become restored to untouched; set to no bites left */
        /* always true unless wishing */
        if (obj == game.context.victual.piece) {
            game.context.victual.reqtime = game.context.victual.usedtime;
        }
        /* smallest possible positive value */
        obj.oeaten = 1;
    }
}
/* called when eatfood occupation has been interrupted,
   or in the case of theft, is about to be interrupted */
export function maybe_finished_meal(stopping) {
    if (game.occupation == eatfood && game.context.victual.usedtime >= game.context.victual.reqtime) {
        /* in case consume_oeaten() has decided that the food is all gone */
        if (stopping) {
            game.occupation = null;
        }
        /* eatfood() calls done_eating() to use up svc.context.victual.piece */
        eatfood();
        return (1);
    }
    return (0);
}
/* called by revive(); sort of the opposite of maybe_finished_meal() */
export function cant_finish_meal(corpse) {
    if (game.occupation == eatfood && game.context.victual.piece == corpse) {
        game.context.victual = zero_victual;
        if (!corpse.oeaten) {
            corpse.oeaten = 1;
        }
        /* any non-Null other than eatfood() */
        game.occupation = donull;
        stop_occupation();
        newuhs((0));
    }
}
/* Tin of <something> to the rescue?  Decide whether current occupation
   is an attempt to eat a tin of something capable of saving hero's life.
   We don't care about consumption of non-tinned food here because special
   effects there take place on first bite rather than at end of occupation.
   [Popeye the Sailor gets out of trouble by eating tins of spinach. :-] */
export function Popeye(threat) {
    let otin = null;
    let mndx = 0;
    if (game.occupation != opentin) {
        return (0);
    }
    otin = game.context.tin.tin;
    /* make sure hero still has access to tin */
    if (!((otin).where == 3) && (!obj_here(otin, game.u.ux, game.u.uy) || !can_reach_floor((1)))) {
        return (0);
    }
    /* unknown tin is assumed to be helpful */
    if (!otin.known) {
        return (1);
    }
    /* known tin is helpful if it will stop life-threatening problem */
    mndx = otin.corpsenm;
    switch (threat) {
        /* note: not used; hunger code bypasses stop_occupation() when eating */
        case HUNGER:
            return (mndx != NON_PM || otin.spe == 1);
        /* flesh from lizards and acidic critters stops petrification */
        case STONED:
            return (((mndx) >= LOW_PM && (mndx) < NUMMONS) && (mndx == PM_LIZARD || (((game.mons[mndx]).mflags1 & 134217728) != 0)));
        /* polymorph into a fiery monster */
        case SLIMED:
            return (((otin).otyp == CORPSE || (otin).otyp == EGG || (otin).otyp == TIN) && (otin).corpsenm >= LOW_PM && (pm_to_cham((otin).corpsenm) != NON_PM || dmgtype(game.mons[(otin).corpsenm], 43)));
        /* no tins can cure these (yet?) */
        case SICK:
        case VOMITING:
            break;
        default:
            break;
    }
    return (0);
}
/* the hero has swallowed a monster whole as a purple worm or similar, and has
   finished digesting its corpse (called via ga.afternmv) */
export function Finish_digestion() {
    if (game.corpsenm_digested != NON_PM) {
        cpostfx(game.corpsenm_digested);
        game.corpsenm_digested = NON_PM;
    }
    return 0;
}
/*eat.c*/
/* parallels mhitm.c's brief_feeling */
/* put these before the word tin */
/* "Swee'pea" is a character from the Popeye cartoons */
/* "feel like Popeye" unless sustain ability suppresses
                     any attribute change; this slightly oversimplifies
                     things:  we want "Popeye" if no strength increase
                     occurs due to already being at maximum, but we won't
                     get it if at-maximum and fixed-abil both apply */
/* no gain, feel like another character from Popeye */
/* tiger reference is to TV ads for "Frosted Flakes",
                     breakfast cereal targeted at kids by "Tony the tiger" */
/* we've already delivered a message; don't add "it tastes okay" */
/* can't eat Amulet of Yendor or fakes,
             * and no oc_prop even if you could -3.
             */
/* Tainted meat with Sick_resistance (testing for that is
           redundant; we don't get this far for !Sick_resistance)
           needs to be done now even though there is no danger because
           it can't match after the rotten (cadaver && rotted > 3) test */
/* 5.0: if not wearing a ring of slow digestion, obtaining
               that property from worn armor (white dragon scales/mail)
               causes the armor to burn nutrition; since it's not
               actually a ring, we don't check for it on the ring
               turns; because of that, wearing two (non-slow digestion)
               rings plus the armor consumes more nutrition that one
               non-slow digestion ring plus ring of slow digestion */
/* more hungry if +/- is nonzero or +/- doesn't apply or
                   +0 ring of protection is only source of protection;
                   need to check whether both rings are +0 protection or
                   they'd both slip by the "is there another source?" test,
                   but don't do that for both rings or they will both be
                   treated as supplying "MC" when only one matters;
                   note: amulet of guarding overrides both +0 rings and
                   is caught by the (EProtection & ~W_RINGx) == 0L tests */
