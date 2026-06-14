/* NetHack 5.0	timeout.c	$NHDT-Date: 1776080125 2026/04/13 03:35:25 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.207 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2018. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_feel, You_hear, You_see, Your, pline, verbalize } from '../c2js-runtime/pline.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { strchr, strcpy, strlen, strstri } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { fig_transform } from './apply.js';
import { artifact_light } from './artifact.js';
import { acurr, adjattrib, exercise, stone_luck } from './attrib.js';
import { confdir, isok } from './cmd.js';
import { is_ice, is_pool, is_pool_or_lava } from './dbridge.js';
import { c_color_names, c_common_strings, cg } from './decl.js';
import { rot_corpse, rot_organic } from './dig.js';
import { canseemon, newsym, see_monsters, set_mimic_blocking } from './display.js';
import { heal_legs, revive_mon, zombify_mon } from './do.js';
import { Monnam, a_monnam, hcolor, m_monnam, rndmonnam, x_monnam } from './do_name.js';
import { find_ac, toggle_displacement, wielding_corpse } from './do_wear.js';
import { tamedog } from './dog.js';
import { hurtle } from './dothrow.js';
import { on_level, surface } from './dungeon.js';
import { Popeye, eating_dangerous_corpse, is_fainted, morehungry, vomit } from './eat.js';
import { dealloc_killer, done, find_delayed_killer } from './end.js';
import { inv_weight, monst_to_any, nomul, obj_to_any, spoteffects } from './hack.js';
import { ing_suffix, s_suffix, strsubst, upstart } from './hacklib.js';
import { carrying, sobj_at, update_inventory, useup, useupall } from './invent.js';
import { arti_light_radius, candle_light_range, del_light_source, new_light_source } from './light.js';
import { makemon } from './makemon.js';
import { container_weight, obj_extract_self, shrink_glob, weight } from './mkobj.js';
import { hideunder, maybe_unhide_at, restartcham, wake_nearby } from './mon.js';
import { big_to_little, cantvomit, little_to_big, locomotion, name_to_mon, pronoun_gender } from './mondata.js';
import { ACID_RES, ADORNED, AGGRAVATE_MONSTER, AMULET_OF_STRANGULATION, ANTIMAGIC, A_CON, A_DEX, A_STR, BLINDED, BLND_RES, BRASS_LANTERN, BURN_OBJECT, CANDELABRUM_OF_INVOCATION, CLAIRVOYANT, CLOUD, COLD_RES, CONFLICT, CONFUSION, CORPSE, DEAF, DETECT_MONSTERS, DIED, DISINT_RES, DISMOUNT_FELL, DISPLACED, DOOR, DRAIN_RES, DRAWBRIDGE_DOWN, ENERGY_REGENERATION, FAINTING, FAST, FEDORA, FIG_TRANSFORM, FIRE_RES, FIXED_ABIL, FLYING, FOOT, FREE_ACTION, FUMBLING, GENOCIDED, GLIB, HALF_PHDAM, HALF_SPDAM, HALLUC, HALLUC_RES, HATCH_EGG, HUNGER, INFRAVISION, INVIS, INVULNERABLE, JUMPING, LEVITATION, LIFESAVED, LOW_PM, LS_MONSTER, LS_OBJECT, LUCKSTONE, MAGICAL_BREATHING, MAGIC_LAMP, MELT_ICE_AWAY, MS_SILENT, M_AP_MONSTER, NECK, NEUTRAL, NON_PM, NUM_TIMER_KINDS, NUM_TIME_FUNCS, OIL_LAMP, PASSES_WALLS, PLNMSG_OK_DONT_DIE, PLNMSG_ONE_ITEM_HERE, PM_ARCHEOLOGIST, PM_BABY_GOLD_DRAGON, PM_CHICKATRICE, PM_COCKATRICE, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_GOLD_DRAGON, PM_GREEN_SLIME, PM_GRID_BUG, PM_SHOCKING_SPHERE, POISONING, POISON_RES, POLYMORPH, POLYMORPH_CONTROL, POT_OIL, PROTECTION, PROT_FROM_SHAPE_CHANGERS, REFLECTING, REGENERATION, ROCK, SEARCHING, SEE_INVIS, SHOCK_RES, SICK, SICK_RES, SLEEPY, SLEEP_RES, SLIMED, SLOW_DIGESTION, STEALTH, STONED, STONE_RES, STONING, STRANGLED, STUNNED, SWIMMING, S_DRAGON, S_LIGHT, TALLOW_CANDLE, TELEPAT, TELEPORT, TELEPORT_CONTROL, TIMER_GLOBAL, TIMER_LEVEL, TIMER_MONSTER, TIMER_NONE, TIMER_OBJECT, TURNED_SLIME, UNCHANGING, VOMITING, WARNING, WARN_OF_MON, WARN_UNDEAD, WAX_CANDLE, WOUNDED_LEGS, WT_NOISY_INV, WWALKING } from './nh-constants.js';
import { Yname2, an, doname, makeplural, the, vtense, xname } from './objnam.js';
import { deferred_decor } from './pickup.js';
import { Norep, urgent_pline } from './pline.js';
import { body_part, polymon, rehumanize } from './polyself.js';
import { incr_itimeout, make_blinded, make_confused, make_deaf, make_glib, make_hallucinated, make_sick, make_slimed, make_stoned, make_stunned, make_vomiting, set_itimeout } from './potion.js';
import { stuck_in_wall } from './pray.js';
import { any_visible_region, region_danger, visible_region_summary } from './region.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { sfi_fe, sfi_int, sfi_ulong, sfo_fe, sfo_int, sfo_ulong } from './sfbase.js';
import { Shk_Your, find_oid, obfree } from './shk.js';
import { cry_sound } from './sounds.js';
import { dismount_steed } from './steed.js';
import { enexto } from './teleport.js';
import { float_down, instapetrify, unconscious } from './trap.js';
import { you_unwere } from './were.js';
import { which_armor } from './worn.js';
import { buzz, get_obj_location, melt_ice_away } from './zap.js';

/* used by wizard mode #timeout and #wizintrinsic; order by 'interest'
   for timeout countdown, where most won't occur in normal play */
// struct propname: { prop_num, prop_name }
const propertynames = [{ prop_num: INVULNERABLE, prop_name: "invulnerable" }, { prop_num: STONED, prop_name: "petrifying" }, { prop_num: SLIMED, prop_name: "becoming slime" }, { prop_num: STRANGLED, prop_name: "strangling" }, { prop_num: SICK, prop_name: "fatally sick" }, { prop_num: STUNNED, prop_name: "stunned" }, { prop_num: CONFUSION, prop_name: "confused" }, { prop_num: HALLUC, prop_name: "hallucinating" }, { prop_num: BLINDED, prop_name: "blinded" }, { prop_num: DEAF, prop_name: "deafness" }, { prop_num: VOMITING, prop_name: "vomiting" }, { prop_num: GLIB, prop_name: "slippery fingers" }, { prop_num: WOUNDED_LEGS, prop_name: "wounded legs" }, { prop_num: SLEEPY, prop_name: "sleepy" }, { prop_num: TELEPORT, prop_name: "teleporting" }, { prop_num: POLYMORPH, prop_name: "polymorphing" }, { prop_num: LEVITATION, prop_name: "levitating" }, { prop_num: FAST, prop_name: "very fast" }, { prop_num: CLAIRVOYANT, prop_name: "clairvoyant" }, { prop_num: DETECT_MONSTERS, prop_name: "monster detection" }, { prop_num: SEE_INVIS, prop_name: "see invisible" }, { prop_num: INVIS, prop_name: "invisible" }, { prop_num: ACID_RES, prop_name: "acid resistance" }, { prop_num: STONE_RES, prop_name: "stoning resistance" }, { prop_num: DISPLACED, prop_name: "displaced" }, { prop_num: PASSES_WALLS, prop_name: "pass thru walls" }, { prop_num: MAGICAL_BREATHING, prop_name: "magical breathing" }, { prop_num: WWALKING, prop_name: "water walking" }, { prop_num: FIRE_RES, prop_name: "fire resistance" }, { prop_num: COLD_RES, prop_name: "cold resistance" }, { prop_num: SLEEP_RES, prop_name: "sleep resistance" }, { prop_num: DISINT_RES, prop_name: "disintegration resistance" }, { prop_num: SHOCK_RES, prop_name: "shock resistance" }, { prop_num: POISON_RES, prop_name: "poison resistance" }, { prop_num: DRAIN_RES, prop_name: "drain resistance" }, { prop_num: SICK_RES, prop_name: "sickness resistance" }, { prop_num: ANTIMAGIC, prop_name: "magic resistance" }, { prop_num: HALLUC_RES, prop_name: "hallucination resistance" }, { prop_num: BLND_RES, prop_name: "light-induced blindness resistance" }, { prop_num: FUMBLING, prop_name: "fumbling" }, { prop_num: HUNGER, prop_name: "voracious hunger" }, { prop_num: TELEPAT, prop_name: "telepathic" }, { prop_num: WARNING, prop_name: "warning" }, { prop_num: WARN_OF_MON, prop_name: "warn: monster type or class" }, { prop_num: WARN_UNDEAD, prop_name: "warn: undead" }, { prop_num: SEARCHING, prop_name: "searching" }, { prop_num: INFRAVISION, prop_name: "infravision" }, { prop_num: ADORNED, prop_name: "adorned (+/- Cha)" }, { prop_num: STEALTH, prop_name: "stealthy" }, { prop_num: AGGRAVATE_MONSTER, prop_name: "monster aggravation" }, { prop_num: CONFLICT, prop_name: "conflict" }, { prop_num: JUMPING, prop_name: "jumping" }, { prop_num: TELEPORT_CONTROL, prop_name: "teleport control" }, { prop_num: FLYING, prop_name: "flying" }, { prop_num: SWIMMING, prop_name: "swimming" }, { prop_num: SLOW_DIGESTION, prop_name: "slow digestion" }, { prop_num: HALF_SPDAM, prop_name: "half spell damage" }, { prop_num: HALF_PHDAM, prop_name: "half physical damage" }, { prop_num: REGENERATION, prop_name: "HP regeneration" }, { prop_num: ENERGY_REGENERATION, prop_name: "energy regeneration" }, { prop_num: PROTECTION, prop_name: "extra protection" }, { prop_num: PROT_FROM_SHAPE_CHANGERS, prop_name: "protection from shape changers" }, { prop_num: POLYMORPH_CONTROL, prop_name: "polymorph control" }, { prop_num: UNCHANGING, prop_name: "unchanging" }, { prop_num: REFLECTING, prop_name: "reflecting" }, { prop_num: FREE_ACTION, prop_name: "free action" }, { prop_num: FIXED_ABIL, prop_name: "fixed abilities" }, { prop_num: LIFESAVED, prop_name: "life will be saved" }, { prop_num: 0, prop_name: null }];
/* timed 'FAST' is very fast */
/* temporary acid resistance and stone resistance can come from eating */
/* timed displacement is possible via eating a displacer beast corpse */
/* timed pass-walls is a potential prayer result if surrounded by stone
       with nowhere to be safely teleported to */
/* likewise for magical breathing vs poison gas regions */
/* timed fire resistance and water walking are possible in explore mode
       (as well as in wizard mode) after life-saving in lava if it fails to
       teleport the hero to safety and player declines to die */
/*
     * Properties beyond here don't have timed values during normal play,
     * so there's not much point in trying to order them sensibly.
     * They're either on or off based on equipment, role, actions, &c,
     * but in wizard mode, #wizintrinsic can give them as timed effects.
     */
export function property_by_index(idx, propertynum) {
    if (!((idx) >= 0 && (idx) < ((Math.trunc(69 /* sizeof(const struct propname [69]) */ / 1 /* sizeof(const struct propname) */)) - 1))) {
        idx = (Math.trunc(69 /* sizeof(const struct propname [69]) */ / 1 /* sizeof(const struct propname) */)) - 1;
    }
    if (propertynum) {
        propertynum.value = propertynames[idx].prop_num;
    }
    return propertynames[idx].prop_name;
}
/* He is being petrified - dialogue by inmet!tower */
const stoned_texts = ["You are slowing down.", "Your limbs are stiffening.", "Your limbs have turned to stone.", "You have turned to stone.", "You are a statue."];
/* 5 */
/* 4 */
/* 3 */
/* 2 */
/* 1 */
export async function stoned_dialogue() {
    let i = (game.u.uprops[STONED].intrinsic & 16777215);
    if (i > 0 && i <= (Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */))) {
        let buf = '';
        buf = strcpy(buf, stoned_texts[(Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */)) - i]);
        if ((((game.youmonst.data).mflags1 & 24576) == 24576) && strstri(buf, "limbs")) {
            buf = strsubst(buf, "limbs", "extremities");
        }
        await urgent_pline("%s", buf);
    }
    switch (i) {
        case 5:
            game.u.uprops[FAST].intrinsic = 0;
            if (game.multi > 0) {
                nomul(0);
            }
            /* case [otyp ==] candelabrum|tallow_candle|wax_candle */
            /* assume no pointers in arg */
            break;
        case 4:
            if (!Popeye(STONED)) {
                await stop_occupation();
            }
            if (game.multi > 0) {
                nomul(0);
            }
            break;
        case 3:
            await stop_occupation();
            nomul(-3);
            game.multi_reason = "getting stoned";
            game.nomovemsg = c_common_strings.c_You_can_move_again;
            /* "your limbs have turned to stone" so terminate wounded legs */
            if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) && !game.u.usteed) {
                await heal_legs(2);
            }
            break;
        case 2:
            if ((game.u.uprops[DEAF].intrinsic & 16777215) > 0 && (game.u.uprops[DEAF].intrinsic & 16777215) < 5) {
                set_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, 5);
            }
            /* avoid Hear_again at tail end */
            /* if also vomiting or turning into slime, stop those (no messages) */
            if (game.u.uprops[VOMITING].intrinsic) {
                await make_vomiting(0, (0));
            }
            if (game.u.uprops[SLIMED].intrinsic) {
                await make_slimed(0, null);
            }
            break;
        default:
            break;
    }
    await exercise(A_DEX, (0));
}
/* hero is getting sicker and sicker prior to vomiting */
const vomiting_texts = ["are feeling mildly nauseated.", "feel slightly confused.", "can't seem to think straight.", "feel incredibly sick.", "are about to vomit."];
/* 14 */
/* 11 */
/* 8 */
/* 5 */
/* 2 */
export async function vomiting_dialogue() {
    let txt = null;
    let buf = '';
    let v = (game.u.uprops[VOMITING].intrinsic & 16777215);
    switch ((v - 1)) {
        /* note: nhtimeout() hasn't decremented timed properties for the
       current turn yet, so we use Vomiting-1 here */
        case 14:
            txt = vomiting_texts[0];
            break;
        case 11:
            txt = vomiting_texts[1];
            if (strstri(txt, " confused") && game.u.uprops[CONFUSION].intrinsic) {
                txt = strsubst(strcpy(buf, txt), " confused", " more confused");
            }
            break;
        case 6:
            await make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + d(2, 4), (0));
            if (!Popeye(VOMITING)) {
                await stop_occupation();
            }
            ;
        case 9:
            await make_confused((game.u.uprops[CONFUSION].intrinsic & 16777215) + d(2, 4), (0));
            if (game.multi > 0) {
                nomul(0);
            }
            break;
        case 8:
            txt = vomiting_texts[2];
            if (strstri(txt, " think") && game.u.uprops[STUNNED].intrinsic) {
                txt = strsubst(strcpy(buf, txt), "can't seem to ", "can't ");
            }
            break;
        case 5:
            txt = vomiting_texts[3];
            break;
        case 2:
            txt = vomiting_texts[4];
            if (cantvomit(game.youmonst.data)) {
                txt = "gag uncontrollably.";
            } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                txt = "are about to hurl!";
            }
            break;
        case 0:
            await stop_occupation();
            if (!cantvomit(game.youmonst.data)) {
                await morehungry(20);
                if (game.u.uhs < FAINTING) {
                    await You("%s!", !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "vomit" : "hurl chunks");
                }
            }
            await vomit();
            break;
        default:
            break;
    }
    if (txt) {
        await You("%s", txt);
    }
    await exercise(A_CON, (0));
}
export async function sleep_dialogue() {
    let i = (game.u.uprops[SLEEPY].intrinsic & 16777215);
    if (i == 4) {
        await You("yawn.");
    }
}
/* RESTORE is after slime_dialogue */
const choke_texts = ["You find it hard to breathe.", "You're gasping for air.", "You can no longer breathe.", "You're turning %s.", "You suffocate."];
const choke_texts2 = ["Your %s is becoming constricted.", "Your blood is having trouble reaching your brain.", "The pressure on your %s increases.", "Your consciousness is fading.", "You suffocate."];
export async function choke_dialogue() {
    let i = (game.u.uprops[STRANGLED].intrinsic & 16777215);
    if (i > 0 && i <= (Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */))) {
        if ((game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)) || !rn2(50)) {
            await urgent_pline(choke_texts2[(Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */)) - i], await body_part(NECK));
        } else {
            let str = choke_texts[(Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */)) - i];
            if (strchr(str, 37)) {
                await urgent_pline(str, hcolor(c_color_names.c_blue));
            } else {
                await urgent_pline("%s", str);
            }
            await stop_occupation();
        }
    }
    await exercise(A_STR, (0));
}
const sickness_texts = ["Your illness feels worse.", "Your illness is severe.", "You are at Death's door."];
export async function sickness_dialogue() {
    let j = (game.u.uprops[SICK].intrinsic & 16777215);
    let i = Math.trunc(j / 2);
    if (i > 0 && i <= (Math.trunc(3 /* sizeof(const char *const [3]) */ / 1 /* sizeof(const char *const) */)) && (j % 2) != 0) {
        let buf = '';
        let pronounbuf = '';
        buf = strcpy(buf, sickness_texts[(Math.trunc(3 /* sizeof(const char *const [3]) */ / 1 /* sizeof(const char *const) */)) - i]);
        /* change the message slightly for food poisoning */
        if ((game.u.usick_type & 2) == 0) {
            buf = strsubst(buf, "illness", "sickness");
        }
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && strstri(buf, "Death's door")) {
            pronounbuf = strcpy(pronounbuf, (genders[pronoun_gender(game.youmonst, 2)].he));
            buf = __nh_buf_append(buf, sprintf('', "  %s %s inviting you in.", upstart(pronounbuf), await vtense(pronounbuf, "are")));
        }
        await urgent_pline("%s", buf);
    }
    await exercise(A_CON, (0));
}
const levi_texts = ["You float slightly lower.", "You wobble unsteadily %s the %s."];
export async function levitation_dialogue() {
    /* -1 because the last message comes via float_down() */
    let i = (Math.trunc(((game.u.uprops[LEVITATION].intrinsic & 16777215) - 1) / 2));
    if (game.u.uprops[LEVITATION].extrinsic) {
        return;
    }
    if (!((game.level.locations[game.u.ux][game.u.uy].typ) >= DOOR) && !is_pool_or_lava(game.u.ux, game.u.uy)) {
        return;
    }
    if (((game.u.uprops[LEVITATION].intrinsic & 16777215) % 2) && i > 0 && i <= (Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */))) {
        let s = levi_texts[(Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */)) - i];
        if (strchr(s, 37)) {
            let danger = (is_pool_or_lava(game.u.ux, game.u.uy) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))));
            await urgent_pline(s, danger ? "over" : "in", danger ? surface(game.u.ux, game.u.uy) : "air");
        } else {
            await pline("%s", s);
        }
        await stop_occupation();
    }
}
const slime_texts = ["You are turning a little %s.", "Your limbs are getting oozy.", "Your skin begins to peel away.", "You are turning into %s.", "You have become %s."];
/* 5 */
/* 4 */
/* 3 */
/* 2 */
/* 1 */
export async function slime_dialogue() {
    let t = (game.u.uprops[SLIMED].intrinsic & 16777215);
    let i = Math.trunc(t / 2);
    if (t == 1) {
        /* display as green slime during "You have become green slime."
           but don't worry about not being able to see self; if already
           mimicking something else at the time, implicitly be revealed */
        game.youmonst.m_ap_type = M_AP_MONSTER;
        game.youmonst.mappearance = PM_GREEN_SLIME;
        await newsym(game.u.ux, game.u.uy);
    }
    if ((t % 2) != 0 && i >= 0 && i < (Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */))) {
        let buf = '';
        buf = strcpy(buf, slime_texts[(Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */)) - i - 1]);
        if ((((game.youmonst.data).mflags1 & 24576) == 24576) && strstri(buf, "limbs")) {
            buf = strsubst(buf, "limbs", "extremities");
        }
        if (strchr(buf, 37)) {
            if (i == 4) {
                /* [what if you're already green?] */
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await urgent_pline(buf, hcolor(c_color_names.c_green));
                }
            } else {
                await urgent_pline(buf, await an((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? await rndmonnam(null) : "green slime"));
            }
        } else {
            await urgent_pline("%s", buf);
        }
    }
    switch (i) {
        case 3:
            game.u.uprops[FAST].intrinsic = 0;
            if (!Popeye(SLIMED)) {
                await stop_occupation();
            }
            if (game.multi > 0) {
                nomul(0);
            }
            break;
        case 2:
            if ((game.u.uprops[DEAF].intrinsic & 16777215) > 0 && (game.u.uprops[DEAF].intrinsic & 16777215) < 5) {
                set_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, 5);
            }
            break;
        case 1:
            if (game.u.uprops[STONED].intrinsic) {
                await make_stoned(0, null, 0, null);
            }
            break;
    }
    await exercise(A_DEX, (0));
}
export async function burn_away_slime() {
    if (game.u.uprops[SLIMED].intrinsic) {
        await make_slimed(0, "The slime that covers you is burned away!");
    }
}
/* countdown timer for turning into green slime has run out; kill our hero */
export async function slimed_to_death(kptr) {
    let save_mvflags = 0;
    if ((game.u.umonnum != game.u.umonster) && game.youmonst.data == game.mons[PM_GREEN_SLIME]) {
        await dealloc_killer(kptr);
        return;
    }
    if (kptr && kptr.name[0]) {
        /* more sure killer reason is set up */
        game.killer.format = kptr.format;
        game.killer.name = strcpy(game.killer.name, kptr.name);
    } else {
        game.killer.format = 2;
        game.killer.name = strcpy(game.killer.name, "turned into green slime");
    }
    await dealloc_killer(kptr);
    /*
     * Polymorph into a green slime, which might destroy some worn armor
     * (potentially affecting bones) and dismount from steed.
     * Can't be Unchanging; wouldn't have turned into slime if we were.
     * Despite lack of Unchanging, neither done() nor savelife() calls
     * rehumanize() if hero dies while polymorphed.
     * polymon() undoes the slime countdown's mimick-green-slime hack
     * but does not perform polyself()'s light source bookkeeping.
     * No longer need to manually increment uconduct.polyselfs to reflect
     * [formerly implicit] change of form; polymon() takes care of that.
     * Temporarily ungenocide if necessary.
     */
    if ((((game.youmonst.data).mlet == S_LIGHT || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_SHOCKING_SPHERE] || (game.youmonst.data) == game.mons[PM_BABY_GOLD_DRAGON] || (game.youmonst.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
        await del_light_source(LS_MONSTER, monst_to_any(game.youmonst));
    }
    save_mvflags = game.mvitals[PM_GREEN_SLIME].mvflags;
    game.mvitals[PM_GREEN_SLIME].mvflags = save_mvflags & ~2;
    await polymon(PM_GREEN_SLIME);
    game.mvitals[PM_GREEN_SLIME].mvflags = save_mvflags;
    await done_timeout(TURNED_SLIME, SLIMED);
    if ((game.mvitals[PM_GREEN_SLIME].mvflags & 2) != 0) {
        /* life-saved; even so, hero still has turned into green slime;
       player may have genocided green slimes after being infected */
        let slimebuf = '';
        game.killer.format = 1;
        game.killer.name = strcpy(game.killer.name, "slimicide");
        slimebuf = strcpy(slimebuf, "green slime has been genocided...");
        if (game.iflags.last_msg == PLNMSG_OK_DONT_DIE) {
            await urgent_pline("Yes, you do.  %s", upstart(slimebuf));
        } else {
            await urgent_pline("Unfortunately, %s", slimebuf);
        }
        await done(GENOCIDED);
    }
    return;
}
/* Intrinsic Passes_walls is temporary when your god is trying to fix
   all troubles and then TROUBLE_STUCK_IN_WALL calls safe_teleds() but
   it can't find anywhere to place you.  If that happens you get a small
   value for (HPasses_walls & TIMEOUT) to move somewhere yourself.
   Message given is "you feel much slimmer" as a joke hint that you can
   move between things which are closely packed--like the substance of
   solid rock! */
const phaze_texts = ["You start to feel bloated.", "You are feeling rather flabby."];
export async function phaze_dialogue() {
    let i = (Math.trunc((game.u.uprops[PASSES_WALLS].intrinsic & 16777215) / 2));
    if (game.u.uprops[PASSES_WALLS].extrinsic || (game.u.uprops[PASSES_WALLS].intrinsic & ~16777215)) {
        return;
    }
    if (((game.u.uprops[PASSES_WALLS].intrinsic & 16777215) % 2) && i > 0 && i <= (Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */))) {
        await pline("%s", phaze_texts[(Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */)) - i]);
    }
}
/* Similar to Passes_walls, if prayer tries to save hero from a poison
   gas region but can't, (HMagical_breathing & TIMEOUT) will be set to
   a small value.  Unlike Passes_walls, there's no joke message. */
const region_texts = ["You seem to have some trouble breathing.", "The air here seems foul."];
export async function region_dialogue() {
    let no_need_to_breathe = 0;
    let in_poison_gas_cloud = 0;
    let r = (game.u.uprops[MAGICAL_BREATHING].intrinsic & 16777215);
    let i = Math.trunc(r / 2);
    game.u.uprops[MAGICAL_BREATHING].intrinsic &= ~16777215;
    /* might have poly'd into non-breather or moved out of gas cloud */
    no_need_to_breathe = (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0));
    in_poison_gas_cloud = region_danger();
    game.u.uprops[MAGICAL_BREATHING].intrinsic |= r;
    if (no_need_to_breathe || !in_poison_gas_cloud) {
        return;
    }
    if ((r % 2) && i > 0 && i <= (Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */))) {
        await pline("%s", region_texts[(Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */)) - i]);
    }
}
/* when a status timeout is fatal, keep the status line indicator shown
   during end of game rundown (and potential dumplog);
   timeout has already counted down to 0 by the time we get here */
export async function done_timeout(how, which) {
    let intrinsic_p = game.u.uprops[which].intrinsic;
    /* affects final disclosure */
    intrinsic_p |= 536870912;
    await done(how);
    intrinsic_p &= ~536870912;
    game.disp.botl = (1);
}
export async function nh_timeout() {
    let upp = null;
    let kptr = null;
    let was_flying = 0;
    let sleeptime = 0;
    let m_idx = 0;
    let baseluck = (game.flags.moonphase == 4) ? 1 : 0;
    if (game.flags.friday13) {
        baseluck -= 1;
    }
    if (game.quest_status.killed_leader) {
        baseluck -= 4;
    }
    if ((game.urole.mnum == (PM_ARCHEOLOGIST)) && game.uarmh && game.uarmh.otyp == FEDORA) {
        baseluck += 1;
    }
    if (game.u.uluck != baseluck && game.moves % ((game.u.uhave.amulet || game.u.ugangr) ? 300 : 600) == 0) {
        /* Cursed luckstones stop bad luck from timing out; blessed luckstones
         * stop good luck from timing out; normal luckstones stop both;
         * neither is stopped if you don't have a luckstone.
         * Luck is based at 0 usually, +1 if a full moon and -1 on Friday 13th
         */
        let time_luck = stone_luck((0));
        let nostone = !carrying(LUCKSTONE) && !stone_luck((1));
        if (game.u.uluck > baseluck && (nostone || time_luck < 0)) {
            game.u.uluck--;
        } else if (game.u.uluck < baseluck && (nostone || time_luck > 0)) {
            game.u.uluck++;
        }
    }
    if (game.u.uinvulnerable) {
        return;
    }
    if (game.u.uprops[STONED].intrinsic) {
        await stoned_dialogue();
    }
    if (game.u.uprops[SLIMED].intrinsic) {
        await slime_dialogue();
    }
    if (game.u.uprops[VOMITING].intrinsic) {
        await vomiting_dialogue();
    }
    if (game.u.uprops[STRANGLED].intrinsic) {
        await choke_dialogue();
    }
    if (game.u.uprops[SICK].intrinsic) {
        await sickness_dialogue();
    }
    if (game.u.uprops[LEVITATION].intrinsic & 16777215) {
        await levitation_dialogue();
    }
    if (game.u.uprops[PASSES_WALLS].intrinsic & 16777215) {
        await phaze_dialogue();
    }
    if (game.u.uprops[MAGICAL_BREATHING].intrinsic & 16777215) {
        await region_dialogue();
    }
    if (game.u.uprops[SLEEPY].intrinsic & 16777215) {
        await sleep_dialogue();
    }
    if (game.u.mtimedone && !--game.u.mtimedone) {
        if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
            game.u.mtimedone = rnd(100 * game.youmonst.data.mlevel + 1);
        } else if ((((game.youmonst.data).mflags2 & 4) != 0)) {
            await you_unwere((0));
        } else {
            await rehumanize();
        }
    }
    if (game.u.ucreamed) {
        game.u.ucreamed--;
    }
    if (game.u.usptime) {
        if (--game.u.usptime == 0 && game.u.uspellprot) {
            /* Dissipate spell-based protection. */
            game.u.usptime = game.u.uspmtime;
            game.u.uspellprot--;
            find_ac();
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await Norep("The %s haze around you %s.", hcolor(c_color_names.c_golden), game.u.uspellprot ? "becomes less dense" : "disappears");
            }
        }
    }
    if (game.u.ugallop) {
        if (--game.u.ugallop == 0 && game.u.usteed) {
            await pline("%s stops galloping.", await Monnam(game.u.usteed));
        }
    }
    was_flying = ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked);
    for (let __nhi_upp = 0; (upp = game.u.uprops[__nhi_upp]) && (upp < game.u.uprops + (Math.trunc(69 /* sizeof(struct prop [69]) */ / 1 /* sizeof(struct prop) */))); __nhi_upp++) {
        if ((upp.intrinsic & 16777215) && !(--upp.intrinsic & 16777215)) {
            kptr = find_delayed_killer((upp - game.u.uprops));
            switch (upp - game.u.uprops) {
                case STONED:
                    if (kptr && kptr.name[0]) {
                        game.killer.format = kptr.format;
                        game.killer.name = strcpy(game.killer.name, kptr.name);
                    } else {
                        game.killer.format = 2;
                        game.killer.name = strcpy(game.killer.name, "killed by petrification");
                    }
                    await dealloc_killer(kptr);
                    await done_timeout(STONING, STONED);
                    /* done_timeout(TURNED_SLIME,SLIMED) */
                    /* might update persistent inventory */
                    break;
                case SLIMED:
                    await slimed_to_death(kptr);
                    break;
                case VOMITING:
                    await make_vomiting(0, (1));
                    break;
                case SICK:
                    if ((game.u.usick_type & 2) == 0 && rn2(100) < (acurr(A_CON))) {
                        await You("have recovered from your illness.");
                        await make_sick(0, null, (0), 3);
                        await exercise(A_CON, (0));
                        await adjattrib(A_CON, -1, 1);
                        break;
                    }
                    await urgent_pline("You die from your illness.");
                    if (kptr && kptr.name[0]) {
                        game.killer.format = kptr.format;
                        game.killer.name = strcpy(game.killer.name, kptr.name);
                    } else {
                        game.killer.format = 0;
                        game.killer.name = '';
                    }
                    await dealloc_killer(kptr);
                    if ((m_idx = await name_to_mon(game.killer.name, null)) >= LOW_PM) {
                        if ((((game.mons[m_idx]).mflags2 & 524288) != 0)) {
                            game.killer.format = 1;
                        } else if (game.mons[m_idx].geno & 4096) {
                            game.killer.name = strcpy(game.killer.name, await the(game.killer.name));
                            game.killer.format = 1;
                        }
                    }
                    await done_timeout(POISONING, SICK);
                    game.u.usick_type = 0;
                    break;
                case FAST:
                    if (!((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic)) {
                        await You_feel("yourself slow down%s.", (game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic) ? " a bit" : "");
                    }
                    break;
                case CONFUSION:
                    set_itimeout({ get value() { return game.u.uprops[CONFUSION].intrinsic; }, set value(_v) { game.u.uprops[CONFUSION].intrinsic = _v; } }, 1);
                    await make_confused(0, (1));
                    if (!game.u.uprops[CONFUSION].intrinsic) {
                        await stop_occupation();
                    }
                    break;
                case STUNNED:
                    set_itimeout({ get value() { return game.u.uprops[STUNNED].intrinsic; }, set value(_v) { game.u.uprops[STUNNED].intrinsic = _v; } }, 1);
                    await make_stunned(0, (1));
                    if (!game.u.uprops[STUNNED].intrinsic) {
                        await stop_occupation();
                    }
                    break;
                case BLINDED:
{
                        /* So make_confused works properly */
                        let was_blind = !!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
                        set_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, 1);
                        await make_blinded(0, (1));
                        if (was_blind && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            await stop_occupation();
                        }
                        break;
                    }
                case DEAF:
                    set_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, 1);
                    await make_deaf(0, (1));
                    game.disp.botl = (1);
                    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                        await stop_occupation();
                    }
                    break;
                case INVIS:
                    await newsym(game.u.ux, game.u.uy);
                    if (!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !game.u.uprops[INVIS].blocked && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await You(!(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? "are no longer invisible." : "can no longer see through yourself.");
                        await stop_occupation();
                    }
                    break;
                case SEE_INVIS:
                    await set_mimic_blocking();
                    await see_monsters();
                    await newsym(game.u.ux, game.u.uy);
                    await stop_occupation();
                    break;
                case WOUNDED_LEGS:
                    await heal_legs(0);
                    await stop_occupation();
                    break;
                case HALLUC:
                    set_itimeout({ get value() { return game.u.uprops[HALLUC].intrinsic; }, set value(_v) { game.u.uprops[HALLUC].intrinsic = _v; } }, 1);
                    await make_hallucinated(0, (1), 0);
                    if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                        await stop_occupation();
                    }
                    break;
                case SLEEPY:
                    if (unconscious() || (game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                        incr_itimeout({ get value() { return game.u.uprops[SLEEPY].intrinsic; }, set value(_v) { game.u.uprops[SLEEPY].intrinsic = _v; } }, rnd(100));
                    } else if ((game.u.uprops[SLEEPY].intrinsic || game.u.uprops[SLEEPY].extrinsic)) {
                        await You("fall asleep.");
                        sleeptime = rnd(20);
                        await fall_asleep(-sleeptime, (1));
                        incr_itimeout({ get value() { return game.u.uprops[SLEEPY].intrinsic; }, set value(_v) { game.u.uprops[SLEEPY].intrinsic = _v; } }, sleeptime + rnd(100));
                    }
                    break;
                case LEVITATION:
                    if ((game.u.uprops[FLYING].intrinsic & 16777215) == 1) {
                        set_itimeout({ get value() { return game.u.uprops[FLYING].intrinsic; }, set value(_v) { game.u.uprops[FLYING].intrinsic = _v; } }, 0);
                    }
                    await float_down(536870912 | 16777215, 0);
                    break;
                case FLYING:
                    if (was_flying && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
                        /* timed Levitation is ordinary, timed Flying is via
                   #wizintrinsic only; still, we want to avoid float_down()
                   reporting "you have stopped levitating and are now flying"
                   when both are timing out together; if that is about to
                   happen, end Flying early to skip feedback about it;
                   assumes Levitation is handled before Flying */
                        /* timed Flying is via #wizintrinsic only */
                        game.disp.botl = (1);
                        await You("land.");
                        await spoteffects((1));
                    }
                    break;
                case ACID_RES:
                    if (!(game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
                        if (eating_dangerous_corpse(ACID_RES)) {
                            /* extend temporary acid resistance if in midst
                           of eating an acidic corpse; this will repeat
                           until eating is finished or interrupted */
                            set_itimeout({ get value() { return game.u.uprops[ACID_RES].intrinsic; }, set value(_v) { game.u.uprops[ACID_RES].intrinsic = _v; } }, 1);
                            break;
                        }
                        if (!(game.multi < 0 && (unconscious() || is_fainted()))) {
                            await You("no longer feel safe from acid.");
                        }
                    }
                    break;
                case STONE_RES:
                    if (!(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
                        if (eating_dangerous_corpse(STONE_RES)) {
                            /* extend temporary stoning resistance if in midst
                           of eating a stoning corpse; this will repeat
                           until eating is finished or interrupted */
                            set_itimeout({ get value() { return game.u.uprops[STONE_RES].intrinsic; }, set value(_v) { game.u.uprops[STONE_RES].intrinsic = _v; } }, 1);
                            break;
                        }
                        if (!(game.multi < 0 && (unconscious() || is_fainted()))) {
                            await You("no longer feel secure from petrification.");
                        }
                        await wielding_corpse(game.uwep, null, (0));
                        await wielding_corpse(game.uswapwep, null, (0));
                    }
                    break;
                case FIRE_RES:
                    if (!(game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                        await Your("temporary ability to survive burning has ended.");
                    }
                    break;
                case WWALKING:
                    if (!((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) {
                        await Your("temporary ability to walk on liquid has ended.");
                    }
                    break;
                case DISPLACED:
                    if (!(game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic)) {
                        await toggle_displacement(null, 0, (0));
                    }
                    break;
                case WARN_OF_MON:
                    if (!(game.u.uprops[WARN_OF_MON].intrinsic || game.u.uprops[WARN_OF_MON].extrinsic)) {
                        /* timed fire resistance and timed water walking combine
                   as a way to survive lava after multiple life-saving
                   attempts fail to relocate hero; skip timeout message
                   if hero has acquired fire resistance in the meantime */
                        /* timed Warn_of_mon is via #wizintrinsic only */
                        let wptr = game.context.warntype.species;
                        game.context.warntype.species = null;
                        game.context.warntype.speciesidx = NON_PM;
                        if (wptr) {
                            await You("are no longer warned about %s.", await makeplural(wptr.pmnames[NEUTRAL]));
                        }
                    }
                    break;
                case PASSES_WALLS:
                    if (!(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
                        if (stuck_in_wall()) {
                            await You_feel("hemmed in again.");
                        } else {
                            await pline("You're back to your %s self again.", !(game.u.umonnum != game.u.umonster) ? "normal" : "unusual");
                        }
                    }
                    break;
                case MAGICAL_BREATHING:
                    if (!(game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))) {
                        if (region_danger()) {
                            await You("cough%s", (game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic) ? "." : " and spit blood!");
                        }
                    }
                    break;
                case STRANGLED:
                    game.killer.format = 1;
                    game.killer.name = strcpy(game.killer.name, (game.u.uburied) ? "suffocation" : "strangulation");
                    await done_timeout(DIED, STRANGLED);
                    if (game.uamul && game.uamul.otyp == AMULET_OF_STRANGULATION) {
                        await Your("amulet vanishes!");
                        await useup(game.uamul);
                    }
                    break;
                case FUMBLING:
                    if (game.u.umoved && !(((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked))) {
                        await slip_or_trip();
                        nomul(-2);
                        game.multi_reason = "fumbling";
                        game.nomovemsg = "";
                        if ((inv_weight() > (WT_NOISY_INV * -1))) {
                            /* The more you are carrying the more likely you
                     * are to make noise when you fumble.  Adjustments
                     * to this number must be thoroughly play tested.
                     */
                            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                                await You("make a lot of noise!");
                            }
                            await wake_nearby((0));
                        }
                    }
                    game.u.uprops[FUMBLING].intrinsic &= ~67108864;
                    /* from outside means slippery ice; don't reset
                   counter if that's the only fumble reason */
                    if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) {
                        incr_itimeout({ get value() { return game.u.uprops[FUMBLING].intrinsic; }, set value(_v) { game.u.uprops[FUMBLING].intrinsic = _v; } }, rnd(20));
                    }
                    if (game.iflags.defer_decor) {
                        await deferred_decor((0));
                    }
                    break;
                case DETECT_MONSTERS:
                    await see_monsters();
                    break;
                case GLIB:
                    make_glib(0);
                    break;
                case PROT_FROM_SHAPE_CHANGERS:
                    if (!(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
                        await restartcham();
                    }
                    break;
            }
        }
    }
    await run_timers();
}
export async function fall_asleep(how_long, wakeup_msg) {
    await stop_occupation();
    nomul(how_long);
    game.multi_reason = "sleeping";
    /* this was broken; the fix for 'how_long' will result in changed
         * behavior for sounds that don't go through You_hear() so needs
         * testing */
    /* You_hear() produces "You dream that you hear ..." when sleeping;
       other sound messages will either honor or ignore Deaf */
    /* caller can follow with a direct call to Hear_again() if
           there's a need to override this when wakeup_msg is true */
    /* 5.0: how_long is negative so wasn't actually incrementing the
           deafness timeout when it used to be passed as-is */
    /* this won't give any messages */
    /* early wakeup from combat won't be possible until next monster turn */
    game.u.usleep = game.moves;
    game.nomovemsg = wakeup_msg ? "You wake up." : c_common_strings.c_You_can_move_again;
}
/* Attach an egg hatch timeout to the given egg.
 *      when = Time to hatch, usually only passed if re-creating an
 *             existing hatch timer. Pass 0L for random hatch time.
 */
export async function attach_egg_hatch_timeout(egg, when) {
    let i = 0;
    /* stop previous timer, if any */
    stop_timer(HATCH_EGG, obj_to_any(egg));
    if (!when) {
        for (i = (200 - 50) + 1; i <= 200; i++) {
            if (rnd(i) > 150) {
                /*
     * Decide if and when to hatch the egg.  The old hatch_it() code tried
     * once a turn from age 151 to 200 (inclusive), hatching if it rolled
     * a number x, 1<=x<=age, where x>150.  This yields a chance of
     * hatching > 99.9993%.  Mimic that here.
     */
                when = i;
                break;
            }
        }
    }
    if (when) {
        await start_timer(when, TIMER_OBJECT, HATCH_EGG, obj_to_any(egg));
    }
}
/* prevent an egg from ever hatching */
export function kill_egg(egg) {
    stop_timer(HATCH_EGG, obj_to_any(egg));
}
/* timer callback routine: hatch the given egg */
export async function hatch_egg(arg, timeout) {
    let egg = null;
    let mon = null;
    let mon2 = null;
    let cc = { x: 0, y: 0 };
    let x = 0;
    let y = 0;
    let yours = 0;
    let silent = 0;
    let knows_egg = (0);
    let cansee_hatchspot = (0);
    let i = 0;
    let mnum = 0;
    let hatchcount = 0;
    egg = arg.a_obj;
    /* sterilized while waiting */
    if (egg.corpsenm == NON_PM) {
        return;
    }
    mon = mon2 = null;
    mnum = big_to_little(egg.corpsenm);
    /* The identity of one's father is learned, not innate */
    yours = (egg.spe || (!game.flags.female && ((egg).where == 3) && !rn2(2)));
    silent = (timeout != game.moves);
    if (get_obj_location(egg, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0)) {
        /* only can hatch when in INVENT, FLOOR, MINVENT;
       get_obj_location() will fail for MIGRATING, also for CONTAINED
       and BURIED when the flags for those aren't included in the call */
        hatchcount = rnd(egg.quan);
        cansee_hatchspot = ((game.viz_array[y][x] & 2) != 0) && !silent;
        /*
     * We could possibly hatch while migrating, but the code isn't
     * set up for it...
     */
        /*
         * We can do several things.  The first ones that come to
         * mind are:
         * + Create the hatched monster then place it on the migrating
         *   mons list.  This is tough because all makemon() is made
         *   to place the monster as well. Makemon() also doesn't lend
         *   itself well to splitting off a "not yet placed" subroutine.
         * + Mark the egg as hatched, then place the monster when we
         *   place the migrating objects.
         * + Or just kill any egg which gets sent to another level.
         *   Falling is the usual reason such transportation occurs.
         */
        if (!(game.mons[mnum].geno & 4096) && !(game.mvitals[mnum].mvflags & (2 | 1))) {
            for (i = hatchcount; i > 0; i--) {
                if (!await enexto(cc, x, y, game.mons[mnum]) || !(mon = await makemon(game.mons[mnum], cc.x, cc.y, 1 | 131072))) {
                    break;
                }
                if ((yours && !silent) || (((egg).where == 3) && mon.data.mlet == S_DRAGON)) {
                    if (await tamedog(mon, null, (0))) {
                        /* tame if your own egg hatches while you're on the
                   same dungeon level, or any dragon egg which hatches
                   while it's in your inventory */
                        if (((egg).where == 3) && mon.data.mlet != S_DRAGON) {
                            mon.mtame = 20;
                        }
                    }
                }
                if (game.mvitals[mnum].mvflags & 1) {
                    break;
                }
                /* in case makemon() fails on 2nd egg */
                mon2 = mon;
            }
            if (!mon) {
                mon = mon2;
            }
            hatchcount -= i;
            egg.quan -= hatchcount;
        }
    }
    if (mon) {
        let monnambuf = '';
        let carriedby = '';
        let siblings = (hatchcount > 1);
        let redraw = (0);
        if (cansee_hatchspot) {
            monnambuf = sprintf(monnambuf, "%s%s", siblings ? "some " : "", siblings ? await makeplural(await m_monnam(mon)) : await an(await m_monnam(mon)));
        }
        switch (egg.where) {
            /* [bug?  m_monnam() yields accurate monster type
               regardless of hallucination] */
            case 3:
                knows_egg = (1);
                if (!cansee_hatchspot) {
                    await You_feel("%s %s from your pack!", c_common_strings.c_something, locomotion(mon.data, "drop"));
                } else {
                    await You_see("%s %s out of your pack!", monnambuf, locomotion(mon.data, "drop"));
                }
                if (yours) {
                    await pline("%s %s %s like \"%s%s\"", siblings ? "Their" : "Its", ing_suffix(cry_sound(mon)), (((mon.data).msound == MS_SILENT) || (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "seems" : "sounds", game.flags.female ? "mommy" : "daddy", egg.spe ? "." : "?");
                } else if (mon.data.mlet == S_DRAGON && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    ;
                    await verbalize("Gleep!");
                }
                break;
            case 1:
                if (cansee_hatchspot) {
                    knows_egg = (1);
                    await You_see("%s hatch.", monnambuf);
                    /* update egg's map location */
                    redraw = (1);
                }
                break;
            case 4:
                if (cansee_hatchspot) {
                    /* egg carrying monster might be invisible */
                    mon2 = egg.v.v_ocarry;
                    if (canseemon(mon2) && (!mon2.wormno || ((game.viz_array[mon2.my][mon2.mx] & 2) != 0))) {
                        carriedby = sprintf(carriedby, "%s pack", s_suffix(await a_monnam(mon2)));
                        knows_egg = (1);
                    } else if (is_pool(mon.mx, mon.my)) {
                        carriedby = strcpy(carriedby, "empty water");
                    } else {
                        carriedby = strcpy(carriedby, "thin air");
                    }
                    await You_see("%s %s out of %s!", monnambuf, locomotion(mon.data, "drop"), carriedby);
                }
                break;
            default:
                await impossible("egg hatched where? (%d)", egg.where);
                break;
        }
        if (cansee_hatchspot && knows_egg) {
            learn_egg_type(mnum);
        }
        if (egg.quan > 0) {
            await attach_egg_hatch_timeout(egg, rnd(12));
            await container_weight(egg);
        } else if (((egg).where == 3)) {
            await useup(egg);
        } else {
            await obj_extract_self(egg);
            await obfree(egg, null);
            if ((mon = (game.level.monsters[x][y])) && !await hideunder(mon) && ((game.viz_array[y][x] & 2) != 0)) {
                redraw = (1);
            }
        }
        if (redraw) {
            await newsym(x, y);
        }
    }
}
/* Learn to recognize eggs of the given type. */
export function learn_egg_type(mnum) {
    /* baby monsters hatch from grown-up eggs */
    mnum = little_to_big(mnum);
    game.mvitals[mnum].mvflags |= 8;
    /* we might have just learned about other eggs being carried */
    update_inventory();
}
/* Attach a fig_transform timeout to the given figurine. */
export async function attach_fig_transform_timeout(figurine) {
    let i = 0;
    stop_timer(FIG_TRANSFORM, obj_to_any(figurine));
    /*
     * Decide when to transform the figurine.
     */
    i = rnd(9000) + 200;
    await start_timer(i, TIMER_OBJECT, FIG_TRANSFORM, obj_to_any(figurine));
}
/* give a fumble message */
export async function slip_or_trip() {
    let otmp = (game.level.objects[game.u.ux][game.u.uy]);
    let otmp2 = null;
    let saddle = null;
    let what = null;
    let buf = '';
    let on_foot = !game.u.usteed;
    if (otmp && on_foot && !game.u.uinwater && is_pool(game.u.ux, game.u.uy)) {
        otmp = null;
    }
    if (otmp && on_foot) {
        what = (game.iflags.last_msg == PLNMSG_ONE_ITEM_HERE) ? ((otmp.quan == 1) ? "it" : (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "they" : "them") : (otmp.dknown || !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? await doname(otmp) : ((otmp2 = sobj_at(ROCK, game.u.ux, game.u.uy)) == null ? c_common_strings.c_something : (otmp2.quan == 1 ? "a rock" : "some rocks"));
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            what = strcpy(buf, what);
            buf = (() => { const __s = buf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
            await pline("Egads!  %s bite%s your %s!", what, (!otmp || otmp.quan == 1) ? "s" : "", await body_part(FOOT));
        } else {
            await You("trip over %s.", what);
        }
        if (!game.uarmf && otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
            game.killer.name = sprintf(game.killer.name, "tripping over %s corpse", await an(game.mons[otmp.corpsenm].pmnames[NEUTRAL]));
            await instapetrify(game.killer.name);
        }
    } else if ((game.u.uprops[FUMBLING].intrinsic & 67108864) || (is_ice(game.u.ux, game.u.uy) && !rn2(3))) {
        /* is fumbling from ice alone? */
        let ice_only = !(game.u.uprops[FUMBLING].extrinsic || (game.u.uprops[FUMBLING].intrinsic & ~67108864));
        await pline("%s %s %s the ice.", game.u.usteed ? upstart(await x_monnam(game.u.usteed, 1, null, 8, (0))) : "You", await vtense(game.u.usteed ? "steed" : "you", rn2(2) ? "slip" : "slide"), is_ice(game.u.ux, game.u.uy) ? "on" : "off");
        if (!on_foot && ((saddle = await which_armor(game.u.usteed, 1048576)) == null || !saddle.cursed) && (!ice_only || !rn2(3))) {
            await You("lose your balance.");
            await dismount_steed(DISMOUNT_FELL);
        } else if (!rn2(10 + (acurr(A_DEX)))) {
            /* Maybe slip in a random direction.  This takes place after
               the hero has already changed location.  If the hero is
               in grid bug form, only allow forward hurtle, otherwise a
               90 degree orthogonal one after the step would make the
               combined move appear to be a single diagonal step. */
            if (!((game.u.umonnum) == PM_GRID_BUG)) {
                confdir((1));
            }
            /* Only hurtle if the random direction won't move hero back
               to same spot where this move started. */
            if (game.u.ux + game.u.dx != game.u.ux0 || game.u.uy + game.u.dy != game.u.uy0) {
                await hurtle(game.u.dx, game.u.dy, 1, (0));
            }
        }
    } else {
        if (on_foot) {
            /* mounted; saddle should never end up being Null here;
           don't fall off when it happens to be cursed */
            switch (rn2(4)) {
                case 1:
                    await You("trip over your own %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "elbow" : await makeplural(await body_part(FOOT)));
                    break;
                case 2:
                    await You("slip %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "on a banana peel" : "and nearly fall");
                    break;
                case 3:
                    await You("flounder.");
                    break;
                default:
                    await You("stumble.");
                    break;
            }
        } else if ((saddle = await which_armor(game.u.usteed, 1048576)) == null || !saddle.cursed) {
            switch (rn2(4)) {
                case 1:
                    await Your("%s slip out of the stirrups.", await makeplural(await body_part(FOOT)));
                    break;
                case 2:
                    await You("let go of the reins.");
                    break;
                case 3:
                    await You("bang into the saddle-horn.");
                    break;
                default:
                    await You("slide to one side of the saddle.");
                    break;
            }
            await dismount_steed(DISMOUNT_FELL);
        }
    }
}
/* Print a lamp flicker message with tailer.  Only called if seen. */
export async function see_lamp_flicker(obj, tailer) {
    switch (obj.where) {
        case 3:
        case 4:
            await pline("%s flickers%s.", await Yname2(obj), tailer);
            break;
        case 1:
            await You_see("%s flicker%s.", await an(await xname(obj)), tailer);
            break;
    }
}
/* Print a dimming message for brass lanterns.  Only called if seen. */
export async function lantern_message(obj) {
    switch (obj.where) {
        case 3:
            await Your("lantern is getting dim.");
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                await pline("Batteries have not been invented yet.");
            }
            break;
        case 1:
            await You_see("a lantern getting dim.");
            break;
        case 4:
            await pline("%s lantern is getting dim.", s_suffix(await Monnam(obj.v.v_ocarry)));
            break;
    }
}
/*
 * Timeout callback for objects that are burning. E.g. lamps, candles.
 * See begin_burn() for meanings of obj->age and obj->spe.
 */
export async function burn_object(arg, timeout) {
    let obj = arg.a_obj;
    let canseeit = 0;
    let many = 0;
    let menorah = 0;
    let need_newsym = 0;
    let need_invupdate = 0;
    let bytouch = 0;
    let x = 0;
    let y = 0;
    let whose = '';
    menorah = obj.otyp == CANDELABRUM_OF_INVOCATION;
    many = menorah ? obj.spe > 1 : obj.quan > 1;
    if (timeout != game.moves) {
        let how_long = game.moves - timeout;
        if (how_long >= obj.age) {
            obj.age = 0;
            await end_burn(obj, (0));
            if (menorah) {
                obj.spe = 0;
                obj.owt = await weight(obj);
            } else if ((obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE) || obj.otyp == POT_OIL) {
                let mtmp = null;
                if (obj.where == 1) {
                    mtmp = (game.level.monsters[obj.ox][obj.oy]);
                }
                await obj_extract_self(obj);
                await obfree(obj, null);
                obj = null;
                if (mtmp) {
                    await maybe_unhide_at(mtmp.mx, mtmp.my);
                }
            }
        } else {
            obj.age -= how_long;
            await begin_burn(obj, (1));
        }
        return;
    }
    if (get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0)) {
        /* only interested in INVENT, FLOOR, and MINVENT */
        canseeit = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && ((game.viz_array[y][x] & 2) != 0);
        await Shk_Your(whose, obj);
    } else {
        canseeit = (0);
    }
    /* when carrying the light source, you can feel the heat from lit lamp
       or candle so you'll be notified when it burns out even if blind at
       the time; brass lantern doesn't radiate sufficient heat for that
       (however, inventory formatting drops "(lit)" so player can tell) */
    bytouch = (obj.where == 3 && obj.otyp != BRASS_LANTERN);
    need_newsym = need_invupdate = (0);
    switch (obj.otyp) {
        case POT_OIL:
            if (canseeit) {
                switch (obj.where) {
                    /* obj->age is the age remaining at this point.  */
                    /* this should only be called when we run out */
                    case 3:
                        need_invupdate = (1);
                        ;
                    case 4:
                        await pline("%spotion of oil has burnt away.", whose);
                        break;
                    case 1:
                        await You_see("a burning potion of oil go out.");
                        need_newsym = (1);
                        break;
                }
            }
            await end_burn(obj, (0));
            if (((obj).where == 3)) {
                await useupall(obj);
            } else {
                /* clear migrating obj's destination code before obfree
               to avoid false complaint of deleting worn item */
                if (obj.where == 5) {
                    obj.owornmask = 0;
                }
                await obj_extract_self(obj);
                await obfree(obj, null);
            }
            obj = null;
            break;
        case BRASS_LANTERN:
        case OIL_LAMP:
            switch (obj.age) {
                case 150:
                case 100:
                case 50:
                    if (canseeit) {
                        if (obj.otyp == BRASS_LANTERN) {
                            await lantern_message(obj);
                        } else {
                            await see_lamp_flicker(obj, obj.age == 50 ? " considerably" : "");
                        }
                    }
                    break;
                case 25:
                    if (canseeit) {
                        if (obj.otyp == BRASS_LANTERN) {
                            await lantern_message(obj);
                        } else {
                            switch (obj.where) {
                                /* even if blind you'll know if holding it */
                                /* we know even if blind and in our inventory */
                                case 3:
                                case 4:
                                    await pline("%s seems about to go out.", await Yname2(obj));
                                    break;
                                case 1:
                                    await You_see("%s about to go out.", await an(await xname(obj)));
                                    break;
                            }
                        }
                    }
                    break;
                case 0:
                    if (canseeit || bytouch) {
                        switch (obj.where) {
                            case 3:
                                need_invupdate = (1);
                                ;
                            case 4:
                                if (obj.otyp == BRASS_LANTERN) {
                                    await pline("%slantern has run out of power.", whose);
                                } else {
                                    await pline("%s has gone out.", await Yname2(obj));
                                }
                                break;
                            case 1:
                                if (obj.otyp == BRASS_LANTERN) {
                                    await You_see("a lantern run out of power.");
                                } else {
                                    await You_see("%s go out.", await an(await xname(obj)));
                                }
                                break;
                        }
                    }
                    await end_burn(obj, (0));
                    break;
                default:
                    break;
            }
            if (obj.age) {
                await begin_burn(obj, (1));
            }
            break;
        case CANDELABRUM_OF_INVOCATION:
        case TALLOW_CANDLE:
        case WAX_CANDLE:
            switch (obj.age) {
                case 75:
                    if (canseeit) {
                        switch (obj.where) {
                            case 3:
                            case 4:
                                await pline("%s%scandle%s getting short.", whose, menorah ? "candelabrum's " : "", many ? "s are" : " is");
                                break;
                            case 1:
                                await You_see("%scandle%s getting short.", menorah ? "a candelabrum's " : many ? "some " : "a ", many ? "s" : "");
                                break;
                        }
                    }
                    break;
                case 15:
                    if (canseeit) {
                        switch (obj.where) {
                            case 3:
                            case 4:
                                await pline("%s%scandle%s flame%s flicker%s low!", whose, menorah ? "candelabrum's " : "", many ? "s'" : "'s", many ? "s" : "", many ? "" : "s");
                                break;
                            case 1:
                                await You_see("%scandle%s flame%s flicker low!", menorah ? "a candelabrum's " : many ? "some " : "a ", many ? "s'" : "'s", many ? "s" : "");
                                break;
                        }
                    }
                    break;
                case 0:
                    if (canseeit || bytouch) {
                        if (menorah) {
                            switch (obj.where) {
                                case 3:
                                    need_invupdate = (1);
                                    ;
                                case 4:
                                    await pline("%scandelabrum's flame%s.", whose, many ? "s die" : " dies");
                                    break;
                                case 1:
                                    await You_see("a candelabrum's flame%s die.", many ? "s" : "");
                                    break;
                            }
                        } else {
                            switch (obj.where) {
                                case 3:
                                    ;
                                case 4:
                                    await pline("%s %s consumed!", await Yname2(obj), many ? "are" : "is");
                                    break;
                                case 1:
                                    await You_see("%s%s consumed!", many ? "some " : "", many ? await xname(obj) : await an(await xname(obj)));
                                    need_newsym = (1);
                                    break;
                            }
                            await pline((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? (many ? "They shriek!" : "It shrieks!") : ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : (many ? "Their flames die." : "Its flame dies."));
                        }
                    }
                    await end_burn(obj, (0));
                    if (menorah) {
                        obj.spe = 0;
                        obj.owt = await weight(obj);
                        if (((obj).where == 3)) {
                            need_invupdate = (1);
                        }
                    } else {
                        if (((obj).where == 3)) {
                            await useupall(obj);
                        } else {
                            let onfloor = (obj.where == 1);
                            /* clear migrating obj's destination code
                       so obfree won't think this item is worn */
                            if (obj.where == 5) {
                                obj.owornmask = 0;
                            }
                            await obj_extract_self(obj);
                            if (onfloor) {
                                await maybe_unhide_at(x, y);
                            }
                            await obfree(obj, null);
                        }
                        obj = null;
                    }
                    break;
                default:
                    break;
            }
            if (obj && obj.age) {
                await begin_burn(obj, (1));
            }
            break;
        default:
            await impossible("burn_object: unexpected obj %s", await xname(obj));
            break;
    }
    if (need_newsym) {
        await newsym(x, y);
    }
    if (need_invupdate) {
        update_inventory();
    }
}
/*
 * Start a burn timeout on the given object. If not "already lit" then
 * create a light source for the vision system.  There had better not
 * be a burn already running on the object.
 *
 * Magic lamps stay lit as long as there's a genie inside, so don't start
 * a timer.
 *
 * Burn rules:
 *      potions of oil, lamps & candles:
 *              age = # of turns of fuel left
 *              spe = <unused>
 *      magic lamps:
 *              age = <unused>
 *              spe = 0 not lightable, 1 lightable forever
 *      candelabrum:
 *              age = # of turns of fuel left
 *              spe = # of candles
 *
 * Once the burn begins, the age will be set to the amount of fuel
 * remaining _once_the_burn_finishes_.  If the burn is terminated
 * early then fuel is added back.
 *
 * This use of age differs from the use of age for corpses and eggs.
 * For the latter items, age is when the object was created, so we
 * know when it becomes "bad".
 *
 * This is a "silent" routine - it should not print anything out.
 */
export async function begin_burn(obj, already_lit) {
    let radius = 3;
    let turns = 0;
    let do_timer = (1);
    if (obj.age == 0 && obj.otyp != MAGIC_LAMP && !artifact_light(obj)) {
        return;
    }
    switch (obj.otyp) {
        case MAGIC_LAMP:
            obj.lamplit = 1;
            do_timer = (0);
            break;
        case POT_OIL:
            turns = obj.age;
            if (obj.oeroded) {
                turns = Math.trunc((3 * turns + 2) / 4);
            }
            radius = 1;
            break;
        case BRASS_LANTERN:
        case OIL_LAMP:
            if (obj.age > 150) {
                turns = obj.age - 150;
            } else if (obj.age > 100) {
                turns = obj.age - 100;
            } else if (obj.age > 50) {
                turns = obj.age - 50;
            } else if (obj.age > 25) {
                turns = obj.age - 25;
            /* magic times are 150, 100, 50, 25, and 0 */
            /* magic times are 75, 15, and 0 */
            } else {
                turns = obj.age;
            }
            break;
        case CANDELABRUM_OF_INVOCATION:
        case TALLOW_CANDLE:
        case WAX_CANDLE:
            if (obj.age > 75) {
                turns = obj.age - 75;
            } else if (obj.age > 15) {
                turns = obj.age - 15;
            } else {
                turns = obj.age;
            }
            radius = candle_light_range(obj);
            break;
        default:
            if (artifact_light(obj)) {
                /* [ALI] Support artifact light sources */
                obj.lamplit = 1;
                do_timer = (0);
                radius = arti_light_radius(obj);
            } else {
                await impossible("begin burn: unexpected %s", await xname(obj));
                turns = obj.age;
            }
            break;
    }
    if (do_timer) {
        if (await start_timer(turns, TIMER_OBJECT, BURN_OBJECT, obj_to_any(obj))) {
            obj.lamplit = 1;
            obj.age -= turns;
            if (((obj).where == 3) && !already_lit) {
                update_inventory();
            }
        } else {
            obj.lamplit = 0;
        }
    } else {
        if (((obj).where == 3) && !already_lit) {
            update_inventory();
        }
    }
    if (obj.lamplit && !already_lit) {
        let x = 0;
        let y = 0;
        if (get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1 | 2)) {
            await new_light_source(x, y, radius, LS_OBJECT, obj_to_any(obj));
        } else {
            await impossible("begin_burn: can't get obj position");
        }
    }
}
/*
 * Stop a burn timeout on the given object if timer attached.  Darken
 * light source.
 */
export async function end_burn(obj, timer_attached) {
    if (!obj.lamplit) {
        await impossible("end_burn: obj %s not lit", await xname(obj));
        return;
    }
    if (obj.otyp == MAGIC_LAMP || artifact_light(obj)) {
        timer_attached = (0);
    }
    if (!timer_attached) {
        await del_light_source(LS_OBJECT, obj_to_any(obj));
        obj.lamplit = 0;
        if (obj.where == 3) {
            update_inventory();
        }
    } else if (!stop_timer(BURN_OBJECT, obj_to_any(obj))) {
        await impossible("end_burn: obj %s not timed!", await xname(obj));
    }
}
/*
 * Cleanup a burning object if timer stopped.
 */
export async function cleanup_burn(arg, expire_time) {
    let obj = arg.a_obj;
    if (!obj.lamplit) {
        await impossible("cleanup_burn: obj %s not lit", await xname(obj));
        return;
    }
    await del_light_source(LS_OBJECT, obj_to_any(obj));
    obj.age += expire_time - game.moves;
    obj.lamplit = 0;
    if (obj.where == 3) {
        update_inventory();
    }
}
export async function do_storms() {
    let nstrike = 0;
    let x = 0;
    let y = 0;
    let dirx = 0;
    let diry = 0;
    let count = 0;
    /* no lightning if not stormy level or too often, even then */
    if (!game.level.flags.stormy || rn2(8)) {
        return;
    }
    for (nstrike = rnd(64); nstrike <= 64; nstrike *= 2) {
        /* the number of strikes is 8-log2(nstrike) */
        count = 0;
        do {
            x = rnd(80 - 1);
            y = rn2(21);
        } while (++count < 100 && game.level.locations[x][y].typ != CLOUD);
        if (count < 100) {
            dirx = rn2(3) - 1;
            diry = rn2(3) - 1;
            if (dirx != 0 || diry != 0) {
                /* BZ_M_SPELL(BZ_OFS_AD(AD_ELEC)): monster LIGHTNING spell */
                game.buzzer = null;
                await buzz((-10 - ((abs((6) - 1) % 10))), 8, x, y, dirx, diry);
            }
        }
    }
    if (game.level.locations[game.u.ux][game.u.uy].typ == CLOUD) {
        ;
        await pline("Kaboom!!!  Boom!!  Boom!!");
        incr_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, (rn2(20) + (30)));
        game.disp.botl = (1);
        if (!game.u.uinvulnerable) {
            await stop_occupation();
            nomul(-3);
            game.multi_reason = "hiding from thunderstorm";
            game.nomovemsg = null;
        }
    } else {
        await You_hear("a rumbling noise.");
    }
}
/* -------------------------------------------------------------------------
 */
/*
 * Generic Timeout Functions.
 *
 * Interface:
 *
 * General:
 *  boolean start_timer(long timeout,short kind,short func_index,
 *                      anything *arg)
 *      Start a timer of kind 'kind' that will expire at time
 *      svm.moves+'timeout'.  Call the function at 'func_index'
 *      in the timeout table using argument 'arg'.  Return TRUE if
 *      a timer was started.  This places the timer on a list ordered
 *      "sooner" to "later".  If an object, increment the object's
 *      timer count.
 *
 *  long stop_timer(short func_index, anything *arg)
 *      Stop a timer specified by the (func_index, arg) pair.  This
 *      assumes that such a pair is unique.  Return the time the
 *      timer would have gone off.  If no timer is found, return 0.
 *      If an object, decrement the object's timer count.
 *
 *  long peek_timer(short func_index, anything *arg)
 *      Return time specified timer will go off (0 if no such timer).
 *
 *  void run_timers(void)
 *      Call timers that have timed out.
 *
 * Save/Restore:
 *  void save_timers(NHFILE *, int range)
 *      Save all timers of range 'range'.  Range is either global
 *      or local.  Global timers follow game play, local timers
 *      are saved with a level.  Object and monster timers are
 *      saved using their respective ids instead of pointers.
 *
 *  void restore_timers(NHFILE *, int range, long adjust)
 *      Restore timers of range 'range'.  If from a ghost pile,
 *      adjust the timeout by 'adjust'.  The object and monster
 *      ids are not restored until later.
 *
 *  void relink_timers(boolean ghostly)
 *      Relink all object and monster timers that had been saved
 *      using their object's or monster's id number.
 *
 * Object Specific:
 *  void obj_move_timers(struct obj *src, struct obj *dest)
 *      Reassign all timers from src to dest.
 *
 *  void obj_split_timers(struct obj *src, struct obj *dest)
 *      Duplicate all timers assigned to src and attach them to dest.
 *
 *  void obj_stop_timers(struct obj *obj)
 *      Stop all timers attached to obj.
 *
 *  boolean obj_has_timer(struct obj *object, short timer_type)
 *      Check whether object has a timer of type timer_type.
 */
/* If defined, then include names when printing out the timer queue */
/* ignore c for !VERBOSE_TIMER */
/*
 * Table of timeout functions, listed in order of enum timeout_types:
 */
const timeout_funcs = [{ f: rot_organic, cleanup: null, name: "rot_organic" }, { f: rot_corpse, cleanup: null, name: "rot_corpse" }, { f: revive_mon, cleanup: null, name: "revive_mon" }, { f: zombify_mon, cleanup: null, name: "zombify_mon" }, { f: burn_object, cleanup: cleanup_burn, name: "burn_object" }, { f: hatch_egg, cleanup: null, name: "hatch_egg" }, { f: fig_transform, cleanup: null, name: "fig_transform" }, { f: shrink_glob, cleanup: null, name: "shrink_glob" }, { f: melt_ice_away, cleanup: null, name: "melt_ice_away" }];
/* object timers */
/* level timers */
/* currently no monster or global timers */
export async function kind_name(kind) {
    switch (kind) {
        case TIMER_NONE:
            await impossible("no timer type");
            return "none";
        case TIMER_LEVEL:
            return "level";
        case TIMER_GLOBAL:
            return "global";
        case TIMER_OBJECT:
            return "object";
        case TIMER_MONSTER:
            return "monster";
    }
    return "unknown";
}
export async function print_queue(win, base) {
    let curr = null;
    let buf = '';
    if (!base) {
        (game.windowprocs.win_putstr)(win, 0, " <empty>");
    } else {
        (game.windowprocs.win_putstr)(win, 0, "timeout  id   kind   call");
        for (curr = base; curr; curr = curr.next) {
            buf = sprintf(buf, " %4ld   %4ld  %-6s %s(%s)", curr.timeout, curr.tid, await kind_name(curr.kind), timeout_funcs[curr.func_index].name, fmt_ptr(curr.arg.a_void));
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
    }
}
/* the #timeout command */
export async function wiz_timeout_queue() {
    let win = 0;
    let buf = '';
    let propname = null;
    let intrinsic = 0;
    let i = 0;
    let p = 0;
    let count = 0;
    let longestlen = 0;
    let ln = 0;
    let specindx = 0;
    win = (game.windowprocs.win_create_nhwindow)(4);
    if (win == (-1)) {
        return 0;
    }
    buf = sprintf(buf, "Current time = %ld.", game.moves);
    (game.windowprocs.win_putstr)(win, 0, buf);
    (game.windowprocs.win_putstr)(win, 0, "");
    (game.windowprocs.win_putstr)(win, 0, "Active timeout queue:");
    (game.windowprocs.win_putstr)(win, 0, "");
    await print_queue(win, game.timer_base);
    /* Timed properties:
     * check every one; the majority can't obtain temporary timeouts in
     * normal play but those can be forced via the #wizintrinsic command.
     */
    count = longestlen = 0;
    for (i = 0; (propname = propertynames[i].prop_name) != null; ++i) {
        p = propertynames[i].prop_num;
        intrinsic = game.u.uprops[p].intrinsic;
        if (intrinsic & 16777215) {
            ++count;
            if ((ln = strlen(propname)) > longestlen) {
                longestlen = ln;
            }
        }
        /* was FIRE_RES but has changed */
        if (specindx == 0 && p == COLD_RES) {
            specindx = i;
        }
    }
    (game.windowprocs.win_putstr)(win, 0, "");
    if (!count) {
        (game.windowprocs.win_putstr)(win, 0, "No timed properties.");
    } else {
        (game.windowprocs.win_putstr)(win, 0, "Timed properties:");
        (game.windowprocs.win_putstr)(win, 0, "");
        for (i = 0; (propname = propertynames[i].prop_name) != null; ++i) {
            p = propertynames[i].prop_num;
            intrinsic = game.u.uprops[p].intrinsic;
            if (intrinsic & 16777215) {
                if (specindx > 0 && i >= specindx) {
                    (game.windowprocs.win_putstr)(win, 0, " -- settable via #wizintrinsic only --");
                    specindx = 0;
                }
                buf = sprintf(buf, " %*s %4ld", -longestlen, propname, (intrinsic & 16777215));
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
        }
    }
    if (game.u.uswldtim) {
        (game.windowprocs.win_putstr)(win, 0, "");
        buf = sprintf(buf, "Swallow countdown is %u.", game.u.uswldtim);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    if (game.u.uinvault) {
        (game.windowprocs.win_putstr)(win, 0, "");
        buf = sprintf(buf, "Vault counter is %d.", game.u.uinvault);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    if (any_visible_region()) {
        /* decremented when engulfer makes a move, so can last longer than
           the number of turns reported if engulfer is slow */
        visible_region_summary(win);
    }
    if (game.level.flags.stasis_until >= game.moves) {
        (game.windowprocs.win_putstr)(win, 0, "");
        buf = sprintf(buf, "Level is no-teleport for %ld %s.", game.level.flags.stasis_until - game.moves + 1, (game.level.flags.stasis_until - game.moves > 0) ? "turns" : "more turn");
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    await (game.windowprocs.win_display_nhwindow)(win, (0));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
export async function timer_sanity_check() {
    let curr = null;
    let t_id = 0;
    let x = 0;
    let y = 0;
    for (curr = game.timer_base; curr; curr = curr.next) {
        t_id = curr.tid;
        switch (curr.kind) {
            case TIMER_OBJECT:
{
                    /* TODO? verify that the timer type is attached to applicable
               object (egg for hatch, glob for shrink, and so forth) */
                    let obj = curr.arg.a_obj;
                    let top = null;
                    let obj_adr = fmt_ptr(obj);
                    let owhere = obj.where;
                    if (obj.timed == 0) {
                        await impossible("timer sanity: untimed obj %s, timer %lu", obj_adr, t_id);
                    }
                    x = y = 0;
                    /* if obj is in a container, possibly a nested one, figure out
               where the outermost container is */
                    for (top = obj; top; top = top.v.v_ocontainer) {
                        if ((owhere = top.where) != 2) {
                            break;
                        }
                    }
                    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                    if (owhere == 5 || (owhere == 4 && !mon_is_local(top.v.v_ocarry))) {
                        ;
                    } else if (!get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1 | 2)) {
                        await impossible("timer sanity: can't locate obj %s [where=%d], timer %lu", obj_adr, obj.where, t_id);
                    } else if (!isok(x, y)) {
                        await impossible("timer sanity: obj %s [where=%d] located at <%d,%d>, timer %lu", obj_adr, obj.where, x, y, t_id);
                    }
                    break;
                }
            case TIMER_MONSTER:
                await impossible("timer sanity: unexpected monster timer %lu", t_id);
                break;
            case TIMER_LEVEL:
{
                    let lwhere = curr.arg.a_long;
                    x = ((lwhere >> 16) & 65535);
                    y = (lwhere & 65535);
                    if (isok(x, y)) {
                        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                        /* replicate isok() in order to convince static analysis
                   that the decoding via '& 0xFFFF' hasn't produced a value
                   too big for levl[][] and that the cast to a narrower type
                   hasn't intruded on the sign bit to yield a negative value;
                   the analyzer isn't aware that isok() filters such things */
                        if (curr.func_index == MELT_ICE_AWAY && !is_ice(x, y) && !(game.level.locations[x][y].typ == DRAWBRIDGE_DOWN && (game.level.locations[x][y].flags & 28) == 8)) {
                            await impossible("timer sanity: melt timer %lu on non-ice %d <%d,%d>", t_id, game.level.locations[x][y].typ, x, y);
                        }
                    } else {
                        await impossible("timer sanity: spot timer %lu at <%d,%d>", t_id, x, y);
                    }
                    break;
                }
            case TIMER_GLOBAL:
                await impossible("timer sanity: unexpected global timer %lu", t_id);
                break;
            default:
                await impossible("timer sanity: unknown timer %lu, type: %d", t_id, curr.kind);
                break;
        }
    }
}
/*
 * Pick off timeout elements from the global queue and call their functions.
 * Do this until their time is less than or equal to the move count.
 */
export async function run_timers() {
    let curr = null;
    while (game.timer_base && game.timer_base.timeout <= game.moves) {
        /*
     * Always use the first element.  Elements may be added or deleted at
     * any time.  The list is ordered; we are done when the first element
     * is in the future.
     */
        curr = game.timer_base;
        game.timer_base = curr.next;
        if (curr.kind == TIMER_OBJECT) {
            (curr.arg.a_obj).timed--;
        }
        await (timeout_funcs[curr.func_index].f)(curr.arg, curr.timeout);
        /* C poison-before-free dropped: JS memset would recurse into arg.a_obj and destroy the live object (see build-engine note) */
        free(curr);
    }
}
/*
 * Start a timer.  Return TRUE if successful.
 */
export async function start_timer(when, kind, func_index, arg) {
    let gnu = null;
    let dup = null;
    if (kind <= TIMER_NONE || kind >= NUM_TIMER_KINDS || func_index < 0 || func_index >= NUM_TIME_FUNCS) {
        await panic("start_timer (%s: %d)", await kind_name(kind), func_index);
    }
    /* fail if <arg> already has a <func_index> timer running */
    for (dup = game.timer_base; dup; dup = dup.next) {
        if (dup.kind == kind && dup.func_index == func_index && dup.arg.a_void == arg.a_void) {
            break;
        }
    }
    if (dup) {
        let idbuf = '';
        idbuf = sprintf(idbuf, "%s timer", timeout_funcs[func_index].name);
        await impossible("Attempted to start duplicate %s, aborted.", idbuf);
        return (0);
    }
    gnu = alloc(1 /* sizeof(timer_element) */);
    memset(gnu, 0, 1 /* sizeof(timer_element) */);
    gnu.next = null;
    gnu.tid = game.timer_id++;
    gnu.timeout = game.moves + when;
    gnu.kind = kind;
    gnu.needs_fixup = 0;
    gnu.func_index = func_index;
    Object.assign(gnu.arg, arg);
    insert_timer(gnu);
    /* increment object's timed count */
    if (kind == TIMER_OBJECT) {
        (arg.a_obj).timed++;
    }
    return (1);
}
/*
 * Remove the timer from the current list and free it up.  Return the time
 * remaining until it would have gone off, 0 if not found.
 */
export function stop_timer(func_index, arg) {
    let cleanup_func = 0;
    let doomed = null;
    let timeout = 0;
    doomed = remove_timer({ get value() { return game.timer_base; }, set value(_v) { game.timer_base = _v; } }, func_index, arg);
    if (doomed) {
        timeout = doomed.timeout;
        if (doomed.kind == TIMER_OBJECT) {
            (arg.a_obj).timed--;
        }
        if ((cleanup_func = timeout_funcs[doomed.func_index].cleanup) != null) {
            (cleanup_func)(arg, timeout);
        }
        /* C poison-before-free dropped (see timer-element note above) */
        free(doomed);
        return (timeout - game.moves);
    }
    return 0;
}
/*
 * Find the timeout of specified timer; return 0 if none.
 */
export function peek_timer(type, arg) {
    let curr = null;
    for (curr = game.timer_base; curr; curr = curr.next) {
        if (curr.func_index == type && curr.arg.a_void == arg.a_void) {
            return curr.timeout;
        }
    }
    return 0;
}
/*
 * Move all object timers from src to dest, leaving src untimed.
 */
export async function obj_move_timers(src, dest) {
    let count = 0;
    let curr = null;
    for (count = 0 , curr = game.timer_base; curr; curr = curr.next) {
        if (curr.kind == TIMER_OBJECT && curr.arg.a_obj == src) {
            curr.arg.a_obj = dest;
            dest.timed++;
            count++;
        }
    }
    if (count != src.timed) {
        await panic("obj_move_timers");
    }
    src.timed = 0;
}
/*
 * Find all object timers and duplicate them for the new object "dest".
 */
export async function obj_split_timers(src, dest) {
    let curr = null;
    let next_timer = null;
    for (curr = game.timer_base; curr; curr = next_timer) {
        next_timer = curr.next;
        if (curr.kind == TIMER_OBJECT && curr.arg.a_obj == src) {
            await start_timer(curr.timeout - game.moves, TIMER_OBJECT, curr.func_index, obj_to_any(dest));
        }
    }
}
/*
 * Stop all timers attached to this object.  We can get away with this because
 * all object pointers are unique.
 */
export function obj_stop_timers(obj) {
    let cleanup_func = 0;
    let curr = null;
    let prev = null;
    let next_timer = null;
    for (prev = null , curr = game.timer_base; curr; curr = next_timer) {
        next_timer = curr.next;
        if (curr.kind == TIMER_OBJECT && curr.arg.a_obj == obj) {
            if (prev) {
                prev.next = curr.next;
            } else {
                game.timer_base = curr.next;
            }
            if ((cleanup_func = timeout_funcs[curr.func_index].cleanup) != null) {
                (cleanup_func)(curr.arg, curr.timeout);
            }
            /* C poison-before-free dropped: JS memset would recurse into arg.a_obj and destroy the live object (see build-engine note) */
            free(curr);
        } else {
            prev = curr;
        }
    }
    obj.timed = 0;
}
/*
 * Check whether object has a timer of type timer_type.
 */
export function obj_has_timer(object, timer_type) {
    let timeout = peek_timer(timer_type, obj_to_any(object));
    return (timeout != 0);
}
/*
 * Stop all timers of index func_index at this spot.
 *
 */
export function spot_stop_timers(x, y, func_index) {
    let cleanup_func = 0;
    let curr = null;
    let prev = null;
    let next_timer = null;
    let where = ((x << 16) | (y));
    for (prev = null , curr = game.timer_base; curr; curr = next_timer) {
        next_timer = curr.next;
        if (curr.kind == TIMER_LEVEL && curr.func_index == func_index && curr.arg.a_long == where) {
            if (prev) {
                prev.next = curr.next;
            } else {
                game.timer_base = curr.next;
            }
            if ((cleanup_func = timeout_funcs[curr.func_index].cleanup) != null) {
                (cleanup_func)(curr.arg, curr.timeout);
            }
            /* C poison-before-free dropped: JS memset would recurse into arg.a_obj and destroy the live object (see build-engine note) */
            free(curr);
        } else {
            prev = curr;
        }
    }
}
/*
 * When is the spot timer of type func_index going to expire?
 * Returns 0L if no such timer.
 */
export function spot_time_expires(x, y, func_index) {
    let curr = null;
    let where = ((x << 16) | (y));
    for (curr = game.timer_base; curr; curr = curr.next) {
        if (curr.kind == TIMER_LEVEL && curr.func_index == func_index && curr.arg.a_long == where) {
            return curr.timeout;
        }
    }
    return 0;
}
export function spot_time_left(x, y, func_index) {
    let expires = spot_time_expires(x, y, func_index);
    return (expires > 0) ? expires - game.moves : 0;
}
/* Insert timer into the global queue */
export function insert_timer(gnu) {
    let curr = null;
    let prev = null;
    for (prev = null , curr = game.timer_base; curr; prev = curr , curr = curr.next) {
        if (curr.timeout >= gnu.timeout) {
            break;
        }
    }
    gnu.next = curr;
    if (prev) {
        prev.next = gnu;
    } else {
        game.timer_base = gnu;
    }
}
export function remove_timer(base, func_index, arg) {
    let prev = null;
    let curr = null;
    for (prev = null , curr = base.value; curr; prev = curr , curr = curr.next) {
        if (curr.func_index == func_index && curr.arg.a_void == arg.a_void) {
            break;
        }
    }
    if (curr) {
        if (prev) {
            prev.next = curr.next;
        } else {
            base.value = curr.next;
        }
    }
    return curr;
}
export async function write_timer(nhfp, timer) {
    let arg_save = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    Object.assign(arg_save, cg.zeroany);
    switch (timer.kind) {
        case TIMER_GLOBAL:
        case TIMER_LEVEL:
            sfo_fe(nhfp, timer, "timer");
            break;
        case TIMER_OBJECT:
            if (timer.needs_fixup) {
                sfo_fe(nhfp, timer, "timer");
            } else {
                /* replace object pointer with id */
                arg_save.a_obj = timer.arg.a_obj;
                Object.assign(timer.arg, cg.zeroany);
                timer.arg.a_uint = (arg_save.a_obj).o_id;
                timer.needs_fixup = 1;
                sfo_fe(nhfp, timer, "timer");
                timer.arg.a_obj = arg_save.a_obj;
                timer.needs_fixup = 0;
            }
            break;
        case TIMER_MONSTER:
            if (timer.needs_fixup) {
                sfo_fe(nhfp, timer, "timer");
            } else {
                /* replace monster pointer with id */
                arg_save.a_monst = timer.arg.a_monst;
                Object.assign(timer.arg, cg.zeroany);
                timer.arg.a_uint = (arg_save.a_monst).m_id;
                timer.needs_fixup = 1;
                sfo_fe(nhfp, timer, "timer");
                timer.arg.a_monst = arg_save.a_monst;
                timer.needs_fixup = 0;
            }
            break;
        default:
            await panic("write_timer");
            break;
    }
}
/*
 * Return TRUE if the object will stay on the level when the level is
 * saved.
 */
export async function obj_is_local(obj) {
    switch (obj.where) {
        case 3:
        case 5:
            return (0);
        case 1:
        case 6:
            return (1);
        case 2:
            return await obj_is_local(obj.v.v_ocontainer);
        case 4:
            return mon_is_local(obj.v.v_ocarry);
    }
    await panic("obj_is_local");
    return (0);
}
/*
 * Return TRUE if the given monster will stay on the level when the
 * level is saved.
 */
export function mon_is_local(mon) {
    let curr = null;
    for (curr = game.migrating_mons; curr; curr = curr.nmon) {
        if (curr == mon) {
            return (0);
        }
    }
    /* `gm.mydogs' is used during level changes, never saved and restored */
    for (curr = game.mydogs; curr; curr = curr.nmon) {
        if (curr == mon) {
            return (0);
        }
    }
    return (1);
}
/*
 * Return TRUE if the timer is attached to something that will stay on the
 * level when the level is saved.
 */
export async function timer_is_local(timer) {
    switch (timer.kind) {
        case TIMER_LEVEL:
            return (1);
        case TIMER_GLOBAL:
            return (0);
        case TIMER_OBJECT:
            return await obj_is_local(timer.arg.a_obj);
        case TIMER_MONSTER:
            return mon_is_local(timer.arg.a_monst);
    }
    await panic("timer_is_local");
    return (0);
}
/*
 * Part of the save routine.  Count up the number of timers that would
 * be written.  If write_it is true, actually write the timer.
 */
export async function maybe_write_timer(nhfp, range, write_it) {
    let count = 0;
    let curr = null;
    for (curr = game.timer_base; curr; curr = curr.next) {
        if (range == 1) {
            if (!await timer_is_local(curr)) {
                count++;
                if (write_it) {
                    await write_timer(nhfp, curr);
                }
            }
        } else {
            if (await timer_is_local(curr)) {
                count++;
                if (write_it) {
                    await write_timer(nhfp, curr);
                }
            }
        }
    }
    return count;
}
/*
 * Save part of the timer list.  The parameter 'range' specifies either
 * global or level timers to save.  The timer ID is saved with the global
 * timers.
 *
 * Global range:
 *      + timeouts that follow the hero (global)
 *      + timeouts that follow obj & monst that are migrating
 *
 * Level range:
 *      + timeouts that are level-specific (e.g. storms)
 *      + timeouts that stay with the level (obj & monst)
 */
export async function save_timers(nhfp, range) {
    let curr = null;
    let prev = null;
    let next_timer = null;
    let count = 0;
    if (((nhfp).mode & (1 | 2))) {
        if (range == 1) {
            sfo_ulong(nhfp, { get value() { return game.timer_id; }, set value(_v) { game.timer_id = _v; } }, "timer-timer_id");
            ;
        }
        count = await maybe_write_timer(nhfp, range, (0));
        sfo_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "timer-timer_count");
        await maybe_write_timer(nhfp, range, (1));
    }
    if (((nhfp).mode & 4)) {
        for (prev = null , curr = game.timer_base; curr; curr = next_timer) {
            next_timer = curr.next;
            if (!(!!(range == 0) ^ !!await timer_is_local(curr))) {
                if (prev) {
                    prev.next = curr.next;
                } else {
                    game.timer_base = curr.next;
                }
                /* C poison-before-free dropped: JS memset would recurse into arg.a_obj and destroy the live object (see build-engine note) */
                free(curr);
            } else {
                prev = curr;
            }
        }
    }
}
/* !SFCTOOL */
/*
 * Pull in the structures from disk, but don't recalculate the object and
 * monster pointers.
 */
export function restore_timers(nhfp, range, adjust) {
    let count = 0;
    let curr = null;
    let ghostly = (nhfp.ftype == 3);
    if (range == 1) {
        sfi_ulong(nhfp, { get value() { return game.timer_id; }, set value(_v) { game.timer_id = _v; } }, "timer-timer_id");
        ;
    }
    sfi_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "timer-timer_count");
    ;
    while (count-- > 0) {
        curr = alloc(1 /* sizeof(timer_element) */);
        sfi_fe(nhfp, curr, "timer");
        if (ghostly) {
            curr.timeout += adjust;
        }
        insert_timer(curr);
    }
}
/* to support '#stats' wizard-mode command */
export function timer_stats(hdrfmt, hdrbuf, count, size) {
    let te = null;
    hdrbuf = sprintf(hdrbuf, hdrfmt, 1 /* sizeof(timer_element) */);
    count.value = size.value = 0;
    for (te = game.timer_base; te; te = te.next) {
        ++count.value;
        size.value += 1 /* sizeof(timer_element) */;
    }
}
/* reset all timers that are marked for resetting */
export async function relink_timers(ghostly) {
    let curr = null;
    let nid = 0;
    for (curr = game.timer_base; curr; curr = curr.next) {
        if (curr.needs_fixup) {
            if (curr.kind == TIMER_OBJECT) {
                if (ghostly) {
                    if (!lookup_id_mapping(curr.arg.a_uint, { get value() { return nid; }, set value(_v) { nid = _v; } })) {
                        await panic("relink_timers 1");
                    }
                } else {
                    nid = curr.arg.a_uint;
                }
                curr.arg.a_obj = find_oid(nid);
                if (!curr.arg.a_obj) {
                    await panic("can't find o_id %d", nid);
                }
                curr.needs_fixup = 0;
            } else if (curr.kind == TIMER_MONSTER) {
                await panic("relink_timers: no monster timer implemented");
            } else {
                await panic("relink_timers 2");
            }
        }
    }
}
/* !SFCTOOL */
/*timeout.c*/
/* just one move left to save oneself so quit fiddling around;
           don't stop attempt to eat tin--might be lizard or acidic */
/* "hurl" is short for "hurl chunks" which is slang for
               relatively violent vomiting... */
/* case 2 used to be "You suddenly vomit!" but it wasn't sudden
               since you've just been through the earlier messages of the
               countdown, and it was still possible to move around between
               that message and "You can move again." (from vomit()'s
               nomul(-2)) with no intervening message; give one here to
               have more specific point at which hero became unable to move
               [vomit() issues its own message for the cantvomit() case
               and for the FAINTING-or-worse case where stomach is empty] */
/* youmonst: for Hallucination, mhe()'s mon argument isn't used */
/* upstart() modifies its argument but vtense() doesn't
                       care whether or not that has already happened */
/* no message given when 't' is odd, so no automatic update of
           self; force one */
/* if also turning to stone, stop doing that (no message) */
/* redundant: polymon() cures sliming when polying into green slime */
/* become a green slime; also resets youmonst.m_ap_type+.mappearance */
/* vary the message depending upon whether life-save was due to
           amulet or due to declining to die in explore or wizard mode */
/* follows "OK, so you don't die." and arg is second sentence */
/* follows "The medallion crumbles to dust." */
/* die again; no possibility of amulet this time */
/* [should it be done_timeout(GENOCIDED, SLIMED)?] */
/* could be life-saved again (only in explore or wizard mode)
           but green slimes are gone; just stay in current form */
/* things past this point could kill you */
/* if polycontrl, asks whether to rehumanize */
/* (unlike sliming, you aren't changing form here) */
/* hero might be able to bounce back from food poisoning,
                   but not other forms of illness */
/* do special mimic handling */
/* no-op if not wielding a cockatrice corpse;
                       uswapwep case is always a no-op because two-weapon
                       combat is only possible with two one-handed weapons
                       or weapon tools, not corpses */
/* must be declining to die in explore|wizard mode;
                   treat like being cured of strangulation by prayer */
/* call this only when a move took place.  */
/* otherwise handle fumbling msgs locally. */
/* 'mention_decor' was deferred for message sequencing
                       reasons; catch up now */
/* timed Protection_from_shape_changers is via
                   #wizintrinsic only */
/* we don't learn the egg type here because learning
               an egg type requires either seeing the egg hatch
               or being familiar with the egg already,
               as well as being able to see the resulting
               monster, checked below
            */
/* true even if you are blind */
/* still some eggs left; we didn't split the stack, just
               subtracted from quantity so weight needs to be updated;
               for remainder of stack, add a new, short hatch timer */
/* container_weight(arg) updates arg->owt, and if contained,
               its enclosing container arg->ocontainer (recursively)
               [egg won't be contained due to conditions imposed above] */
/* free egg here because we use it above */
/* trip over something in particular */
/*
          If there is only one item, it will have just been named
          during the move, so refer to it by pronoun; otherwise,
          if the top item has been or can be seen, refer to it by
          name; if not, look for rocks to trip over; trip over
          anonymous "something" if there aren't any rocks.
        */
/* "steed": arbitrary value that will use third person verb
                 regardless of what u.usteed might be named, as opposed to
                 "you" (second person, which won't have final 's' added) */
/* sometimes slipping due to ice occurs during turn that hero
                 has just moved off the ice; phrase things differently then */
/* fumbling outside of ice while mounted always causes the hero to
           fall from the saddle (unless it is cursed), so to avoid a
           counterintuitive effect where ice makes riding _less_ hazardous,
           unconditionally dismount if fumbling is from a non-ice source */
/* get rid of candles and burning oil potions;
                   we know this object isn't carried by hero,
                   nor is it migrating */
/* set `whose[]' to be "Your " or "Fred's " or "The goblin's " */
/*
             * Someone added fuel to the lamp while it was
             * lit. Just fall through and let begin_burn()
             * handle the new age.
             */
/* no need_invupdate for update_inventory() necessary;
                           useupall() -> freeinv() handles it */
/*
                          You see some wax candles consumed!
                          You see a wax candle consumed!
                         */
/*
             * Someone added fuel (candles) to the menorah while
             * it was lit. Just fall through and let begin_burn()
             * handle the new age.
             */
/* [DS] Cleanup explicitly, since timer cleanup won't happen */
/* Inside a cloud during a thunderstorm is deafening. */
/* Even if already deaf, we sense the thunder's vibrations. */
/* timeout value can be up to 16777215 (0x00ffffff) but
                   width of 4 digits should result in values lining up
                   almost all the time (if/when they don't, it won't
                   look nice but the information will still be accurate) */
/* migrating directly or carried by migrating monster */
/* not able to validate location so skip checks */
/* free? or on a shop's used-up bill? */
/* the terrain under the span of an open drawbridge might
                       be frozen moat; is_ice() only checks for that when
                       the drawbridge is closed (and terrain here would be
                       DRAWBRIGE_UP) */
