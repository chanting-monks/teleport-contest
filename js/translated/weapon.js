/* NetHack 5.0	weapon.c	$NHDT-Date: 1725227810 2024/09/01 21:56:50 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.128 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 *      This module contains code for calculation of "to hit" and damage
 *      bonuses for any given weapon used, as well as weapons selection
 *      code for monsters.
 */
import { game } from '../gstate.js';
import { free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_feel, Your, pline } from '../c2js-runtime/pline.js';
import { __nh_buf_append, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strchr, strcpy } from '../c2js-runtime/string.js';
import { artifact_light, is_art, shade_glare, spec_abon, spec_dbon, touch_artifact, undiscovered_artifact } from './artifact.js';
import { acurr } from './attrib.js';
import { yn_function } from './cmd.js';
import { is_pool } from './dbridge.js';
import { cg, ynchars } from './decl.js';
import { canseemon, newsym, nul_glyphinfo } from './display.js';
import { flooreffects } from './do.js';
import { Monnam, mon_nam } from './do_name.js';
import { def_oc_syms } from './drawing.js';
import { handle_tip } from './hack.js';
import { dist2, s_suffix } from './hacklib.js';
import { stackobj, update_inventory } from './invent.js';
import { arti_light_description } from './light.js';
import { adj_lev } from './makemon.js';
import { obj_extract_self, place_object } from './mkobj.js';
import { can_touch_safely } from './mon.js';
import { Resists_Elem, attacktype, mon_hates_blessings, mon_hates_silver, pronoun_gender } from './mondata.js';
import { m_carrying } from './mthrowu.js';
import { ACID_VENOM, AKLYS, ARROW, ART_EYES_OF_THE_OVERWORLD, ART_SNICKERSNEE, ATHAME, AXE, A_DEX, A_STR, BALL_CLASS, BARDICHE, BATTLE_AXE, BEC_DE_CORBIN, BILL_GUISARME, BOOMERANG, BOULDER, BOW, BROADSWORD, BULLWHIP, CHAIN_CLASS, CLUB, CORPSE, CREAM_PIE, CROSSBOW, CROSSBOW_BOLT, CRYSKNIFE, DAGGER, DART, DWARVISH_MATTOCK, DWARVISH_SHORT_SWORD, DWARVISH_SPEAR, EGG, ELVEN_ARROW, ELVEN_BOW, ELVEN_BROADSWORD, ELVEN_DAGGER, ELVEN_SHORT_SWORD, ELVEN_SPEAR, FAUCHARD, FLAIL, FLINT, GEM_CLASS, GLAIVE, GRAPPLING_HOOK, GUISARME, HALBERD, HAND, HEAVY_IRON_BALL, IRON_CHAIN, JAVELIN, KATANA, KNIFE, LANCE, LEATHER, LOADSTONE, LONG_SWORD, LUCERN_HAMMER, LUCKSTONE, MACE, MORNING_STAR, NEED_AXE, NEED_HTH_WEAPON, NEED_PICK_AXE, NEED_PICK_OR_AXE, NEED_RANGED_WEAPON, NEED_WEAPON, NON_PM, NO_WEAPON_WANTED, ORCISH_ARROW, ORCISH_BOW, ORCISH_DAGGER, ORCISH_SHORT_SWORD, ORCISH_SPEAR, PARTISAN, PICK_AXE, PM_BALROG, PM_CHICKATRICE, PM_CLERIC, PM_COCKATRICE, PM_GREMLIN, PM_HEALER, PM_MONK, PM_PONY, PM_SAMURAI, PM_SHADE, PM_WIZARD, PM_WOOD_GOLEM, P_ATTACK_SPELL, P_AXE, P_BARE_HANDED_COMBAT, P_BASIC, P_BOW, P_CLERIC_SPELL, P_CROSSBOW, P_DAGGER, P_ENCHANTMENT_SPELL, P_EXPERT, P_FLAIL, P_GRAND_MASTER, P_HEALING_SPELL, P_ISRESTRICTED, P_MASTER, P_MATTER_SPELL, P_NONE, P_NUM_SKILLS, P_PICK_AXE, P_RIDING, P_SKILLED, P_SLING, P_SPEAR, P_TWO_WEAPON_COMBAT, P_UNICORN_HORN, P_UNSKILLED, QUARTERSTAFF, RANSEUR, ROCK, RUBBER_HOSE, RUNESWORD, SCALPEL, SCIMITAR, SHORT_SWORD, SHURIKEN, SILVER, SILVER_ARROW, SILVER_DAGGER, SILVER_MACE, SILVER_SABER, SILVER_SPEAR, SLING, SPEAR, SPETUM, STATUE, STONE_RES, STRANGE_OBJECT, S_DRAGON, S_EEL, S_GIANT, S_JABBERWOCK, S_KOP, S_NAGA, S_SNAKE, S_XORN, TIN, TIN_OPENER, TIP_ENHANCE, TOOL_CLASS, TOUCHSTONE, TOWEL, TRIDENT, TSURUGI, TWO_HANDED_SWORD, UNICORN_HORN, VOULGE, WAR_HAMMER, WEAPON_CLASS, WORM_TOOTH, WT_IRON_BALL_INCR, YA, YUMI } from './nh-constants.js';
import { The, Tobjnam, Yname2, Yobjnam2, distant_name, doname, makeplural, makesingular, otense, the, vtense, xname } from './objnam.js';
import { pline_mon } from './pline.js';
import { mbodypart } from './polyself.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { skill_based_spellbook_id, spell_skilltype } from './spell.js';
import { Strlen_ } from './strutil.js';
import { begin_burn, end_burn } from './timeout.js';
import { mwelded } from './wield.js';
import { add_menu, add_menu_heading, add_menu_str, select_menu } from './windows.js';
import { bypass_obj, which_armor } from './worn.js';

/* Categories whose names don't come from OBJ_NAME(objects[type])
 */
/* includes martial arts */
const skill_names_indices = [0, DAGGER, KNIFE, AXE, PICK_AXE, SHORT_SWORD, BROADSWORD, LONG_SWORD, TWO_HANDED_SWORD, (-5), CLUB, MACE, MORNING_STAR, FLAIL, (-6), QUARTERSTAFF, (-4), SPEAR, TRIDENT, LANCE, BOW, SLING, CROSSBOW, DART, SHURIKEN, BOOMERANG, (-7), UNICORN_HORN, (-8), (-9), (-10), (-11), (-12), (-13), (-14), (-1), (-2), (-3)];
/* Weapon */
/* Spell */
/* Other */
/* note: entry [0] isn't used */
const odd_skill_names = ["no skill", "bare hands", "two weapon combat", "riding", "polearms", "saber", "hammer", "whip", "attack spells", "healing spells", "divination spells", "enchantment spells", "clerical spells", "escape spells", "matter spells"];
/* use barehands_or_martial[] instead */
/* indexed via is_martial() */
const barehands_or_martial = ["bare handed combat", "martial arts"];
/* targets that provide attacker with small to-hit bonus when using a spear */
const kebabable = [S_XORN, S_DRAGON, S_JABBERWOCK, S_NAGA, S_GIANT, 0];
export function give_may_advance_msg(skill) {
    You_feel("more confident in your %sskills.", (skill == P_NONE) ? "" : (skill <= P_UNICORN_HORN) ? "weapon " : (skill <= P_MATTER_SPELL) ? "spell casting " : "fighting ");
    handle_tip(TIP_ENHANCE);
}
/* weapon's skill category name for use as generalized description of weapon;
   mostly used to shorten "you drop your <weapon>" messages when slippery
   fingers or polymorph causes hero to involuntarily drop wielded weapon(s) */
export function weapon_descr(obj) {
    let skill = weapon_type(obj);
    let descr = ((skill_names_indices[skill] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[skill]]).oc_name_idx].oc_name) : (skill == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[skill]]);
    switch (skill) {
        case P_NONE:
            descr = (obj.otyp == CORPSE || obj.otyp == TIN || obj.otyp == EGG || obj.otyp == STATUE || obj.otyp == BOULDER || obj.otyp == TOWEL || obj.otyp == TIN_OPENER) ? (game.obj_descr[(game.objects[obj.otyp]).oc_name_idx].oc_name) : obj.globby ? "glob" : def_oc_syms[obj.oclass].name;
            break;
        case P_SLING:
            /* Set skill for all weapons in inventory to be basic */
            /* don't give skill just because of carried ammo, wait until
           we see the relevant launcher (prevents an archeologist's
           touchstone from inadvertently providing skill in sling) */
            if (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW)) {
                descr = (obj.otyp == ROCK || ((obj).otyp == LUCKSTONE || (obj).otyp == LOADSTONE || (obj).otyp == FLINT || (obj).otyp == TOUCHSTONE)) ? "stone" : (obj.oclass == GEM_CLASS) ? "gem" : def_oc_syms[obj.oclass].name;
            }
            break;
        case P_BOW:
            if (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW)) {
                descr = "arrow";
            }
            break;
        case P_CROSSBOW:
            if (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW)) {
                descr = "bolt";
            }
            break;
        case P_FLAIL:
            if (obj.otyp == GRAPPLING_HOOK) {
                descr = "hook";
            }
            break;
        case P_PICK_AXE:
            if (obj.otyp == DWARVISH_MATTOCK) {
                descr = "mattock";
            }
            break;
        default:
            break;
    }
    return makesingular(descr);
}
/*
 *      hitval returns an integer representing the "to hit" bonuses
 *      of "otmp" against the monster.
 */
export function hitval(otmp, mon) {
    let tmp = 0;
    let ptr = mon.data;
    let Is_weapon = (otmp.oclass == WEAPON_CLASS || ((otmp).oclass == TOOL_CLASS && game.objects[(otmp).otyp].oc_subtyp != P_NONE));
    if (Is_weapon) {
        tmp += otmp.spe;
    }
    /* Put weapon-specific "to hit" bonuses in below: */
    tmp += game.objects[otmp.otyp].oc_oc1;
    /* Put weapon vs. monster type "to hit" bonuses in below: */
    /* Blessed weapons used against undead or demons */
    if (Is_weapon && otmp.blessed && mon_hates_blessings(mon)) {
        tmp += 2;
    }
    if ((otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp == P_SPEAR) && strchr(kebabable, ptr.mlet)) {
        tmp += 2;
    }
    if (otmp.otyp == TRIDENT && (((ptr).mflags1 & 2) != 0)) {
        /* trident is highly effective against swimmers */
        if (is_pool(mon.mx, mon.my)) {
            tmp += 4;
        } else if (ptr.mlet == S_EEL || ptr.mlet == S_SNAKE) {
            tmp += 2;
        }
    }
    /* Picks used against xorns and earth elementals */
    if (((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_subtyp == P_PICK_AXE) && ((((ptr).mflags1 & 8) != 0) && (((ptr).mflags1 & 2097152) != 0))) {
        tmp += 2;
    }
    /* Check specially named weapon "to hit" bonuses */
    if (otmp.oartifact) {
        tmp += spec_abon(otmp, mon);
    }
    return tmp;
}
/* Historical note: The original versions of Hack used a range of damage
 * which was similar to, but not identical to, the damage used in Advanced
 * Dungeons and Dragons.  I figured that since it was so close, I may as well
 * make it exactly the same as AD&D, adding some more weapons in the process.
 * This has the advantage that it is at least possible that the player would
 * already know the damage of at least some of the weapons.  This was circa
 * 1987 and I used the table from Unearthed Arcana until I got tired of typing
 * them in (leading to something of an imbalance towards weapons early in
 * alphabetical order).  The data structure still doesn't include fields that
 * fully allow the appropriate damage to be described (there's no way to say
 * 3d6 or 1d6+1) so we add on the extra damage in dmgval() if the weapon
 * doesn't do an exact die of damage.
 *
 * Of course new weapons were added later in the development of Nethack.  No
 * AD&D consistency was kept, but most of these don't exist in AD&D anyway.
 *
 * Second edition AD&D came out a few years later; luckily it used the same
 * table.  As of this writing (1999), third edition is in progress but not
 * released.  Let's see if the weapon table stays the same.  --KAA
 * October 2000: It didn't.  Oh, well.
 */
/*
 *      dmgval returns an integer representing the damage bonuses
 *      of "otmp" against the monster.
 */
export function dmgval(otmp, mon) {
    let tmp = 0;
    let otyp = otmp.otyp;
    let ptr = mon.data;
    let Is_weapon = (otmp.oclass == WEAPON_CLASS || ((otmp).oclass == TOOL_CLASS && game.objects[(otmp).otyp].oc_subtyp != P_NONE));
    if (otyp == CREAM_PIE) {
        return 0;
    }
    if (((ptr).msize >= 3)) {
        if (game.objects[otyp].oc_wldam) {
            tmp = rnd(game.objects[otyp].oc_wldam);
        }
        switch (otyp) {
            case IRON_CHAIN:
            case CROSSBOW_BOLT:
            case MORNING_STAR:
            case PARTISAN:
            case RUNESWORD:
            case ELVEN_BROADSWORD:
            case BROADSWORD:
                tmp++;
                break;
            case FLAIL:
            case RANSEUR:
            case VOULGE:
                tmp += rnd(4);
                break;
            case ACID_VENOM:
            case HALBERD:
            case SPETUM:
                tmp += rnd(6);
                break;
            case BATTLE_AXE:
            case BARDICHE:
            case TRIDENT:
                tmp += d(2, 4);
                break;
            case TSURUGI:
            case DWARVISH_MATTOCK:
            case TWO_HANDED_SWORD:
                tmp += d(2, 6);
                break;
        }
    } else {
        if (game.objects[otyp].oc_wsdam) {
            tmp = rnd(game.objects[otyp].oc_wsdam);
        }
        switch (otyp) {
            case IRON_CHAIN:
            case CROSSBOW_BOLT:
            case MACE:
            case SILVER_MACE:
            case WAR_HAMMER:
            case FLAIL:
            case SPETUM:
            case TRIDENT:
                tmp++;
                break;
            case BATTLE_AXE:
            case BARDICHE:
            case BILL_GUISARME:
            case GUISARME:
            case LUCERN_HAMMER:
            case MORNING_STAR:
            case RANSEUR:
            case BROADSWORD:
            case ELVEN_BROADSWORD:
            case RUNESWORD:
            case VOULGE:
                tmp += rnd(4);
                break;
            case ACID_VENOM:
                tmp += rnd(6);
                break;
        }
    }
    if (Is_weapon) {
        tmp += otmp.spe;
        /* negative enchantment mustn't produce negative damage */
        if (tmp < 0) {
            tmp = 0;
        }
    }
    if (game.objects[otyp].oc_material <= LEATHER && (((ptr).mflags1 & 2097152) != 0)) {
        tmp = 0;
    }
    if (ptr == game.mons[PM_SHADE] && !shade_glare(otmp)) {
        tmp = 0;
    }
    if (otyp == HEAVY_IRON_BALL && tmp > 0) {
        /* thick-skinned or scaled creatures don't feel it */
        /* "very heavy iron ball"; weight increase is in increments */
        let wt = game.objects[HEAVY_IRON_BALL].oc_weight;
        if (otmp.owt > wt) {
            wt = Math.trunc((otmp.owt - wt) / WT_IRON_BALL_INCR);
            tmp += rnd(4 * wt);
            if (tmp > 25) {
                tmp = 25;
            }
        }
    }
    if (Is_weapon || otmp.oclass == GEM_CLASS || otmp.oclass == BALL_CLASS || otmp.oclass == CHAIN_CLASS) {
        /* Put weapon vs. monster type damage bonuses in below: */
        let bonus = 0;
        if (otmp.blessed && mon_hates_blessings(mon)) {
            bonus += rnd(4);
        }
        if (((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_subtyp == P_AXE) && ((ptr) == game.mons[PM_WOOD_GOLEM])) {
            bonus += rnd(4);
        }
        if (game.objects[otyp].oc_material == SILVER && mon_hates_silver(mon)) {
            /* the only silver armor is shield of reflection (silver dragon
           scales refer to color, not material) and the only way to hit
           with one--aside from throwing--is to wield it and perform a
           weapon hit, but we include a general check here */
            bonus += rnd(20);
        }
        if (artifact_light(otmp) && otmp.lamplit && ((ptr) == game.mons[PM_GREMLIN])) {
            bonus += rnd(8);
        }
        /* if the weapon is going to get a double damage bonus, adjust
           this bonus so that effectively it's added after the doubling */
        if (bonus > 1 && otmp.oartifact && spec_dbon(otmp, mon, 25) >= 25) {
            bonus = Math.trunc((bonus + 1) / 2);
        }
        tmp += bonus;
    }
    if (tmp > 0) {
        /* It's debatable whether a rusted blunt instrument
           should do less damage than a pristine one, since
           it will hit with essentially the same impact, but
           there ought to some penalty for using damaged gear
           so always subtract erosion even for blunt weapons. */
        tmp -= ((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2);
        if (tmp < 1) {
            tmp = 1;
        }
    }
    return tmp;
}
/* check whether blessed and/or silver damage applies for *non-weapon* hit;
   return value is the amount of the extra damage */
/* attacker */
/* defender */
/* armor mask, multiple bits accepted for
                         * W_ARMC|W_ARM|W_ARMU or
                         * W_ARMG|W_RINGL|W_RINGR only */
/* output flag mask for silver bonus */
export function special_dmgval(magr, mdef, armask, silverhit_p) {
    let obj = null;
    let left_ring = (armask & 131072) ? (1) : (0);
    let right_ring = (armask & 262144) ? (1) : (0);
    let silverhit = 0;
    let bonus = 0;
    obj = null;
    if (armask & (2 | 1 | 64)) {
        if ((armask & 2) != 0 && (obj = which_armor(magr, 2)) != null) {
            armask = 2;
        } else if ((armask & 1) != 0 && (obj = which_armor(magr, 1)) != null) {
            armask = 1;
        } else if ((armask & 64) != 0 && (obj = which_armor(magr, 64)) != null) {
            armask = 64;
        } else {
            armask = 0;
        }
    } else if (armask & (16 | 131072 | 262144)) {
        armask = ((obj = which_armor(magr, 16)) != null) ? 16 : 0;
    } else {
        obj = which_armor(magr, armask);
    }
    if (obj) {
        if (obj.blessed && mon_hates_blessings(mdef)) {
            bonus += rnd(4);
        }
        /* when no gloves we check for silver rings (blessed rings ignored) */
        if (game.objects[obj.otyp].oc_material == SILVER && mon_hates_silver(mdef)) {
            bonus += rnd(20);
            silverhit |= armask;
        }
    } else if ((left_ring || right_ring) && magr == game.youmonst) {
        if (left_ring && game.uleft) {
            if (game.objects[game.uleft.otyp].oc_material == SILVER && mon_hates_silver(mdef)) {
                bonus += rnd(20);
                silverhit |= 131072;
            }
        }
        if (right_ring && game.uright) {
            if (game.objects[game.uright.otyp].oc_material == SILVER && mon_hates_silver(mdef)) {
                /* two silver rings don't give double silver damage
                   but 'silverhit' messages might be adjusted for them */
                if (!(silverhit & 131072)) {
                    bonus += rnd(20);
                }
                silverhit |= 262144;
            }
        }
    }
    if (silverhit_p) {
        silverhit_p.value = silverhit;
    }
    return bonus;
}
/* give a "silver <item> sears <target>" message;
   not used for weapon hit, so we only handle rings */
export function silver_sears(magr, mdef, silverhit) {
    /* plenty of room for "rings" */
    let rings = '';
    let ltyp = ((game.uleft && (silverhit & 131072) != 0) ? game.uleft.otyp : STRANGE_OBJECT);
    let rtyp = ((game.uright && (silverhit & 262144) != 0) ? game.uright.otyp : STRANGE_OBJECT);
    let both = 0;
    let l_dknown = (game.uleft && game.uleft.dknown);
    let r_dknown = (game.uright && game.uright.dknown);
    let l_ag = (game.objects[ltyp].oc_material == SILVER && l_dknown);
    let r_ag = (game.objects[rtyp].oc_material == SILVER && r_dknown);
    if ((silverhit & (131072 | 262144)) != 0) {
        /* plural if both the same type (so not multi_claw and both rings
           are non-Null) and either both known or neither known, or both
           silver (in case there is ever more than one type of silver ring)
           and both known; singular if multi_claw (where one of ltyp or
           rtyp will always be STRANGE_OBJECT) even if both rings are known
           silver [see hmonas(uhitm.c) for explanation of 'multi_claw'] */
        both = ((ltyp == rtyp && l_dknown == r_dknown) || (l_ag && r_ag));
        rings = sprintf(rings, "ring%s", both ? "s" : "");
        Your("%s%s %s %s!", (l_ag || r_ag) ? "silver " : both ? "" : ((silverhit & 131072) != 0) ? "left " : "right ", rings, vtense(rings, "sear"), mon_nam(mdef));
    }
}
export function oselect(mtmp, type) {
    let otmp = null;
    for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp != type) {
            continue;
        }
        /* never select non-cockatrice corpses */
        if ((type == CORPSE || type == EGG) && (otmp.corpsenm == NON_PM || !((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]))) {
            continue;
        }
        if (!can_touch_safely(mtmp, otmp)) {
            continue;
        }
        return otmp;
    }
    return null;
}
const rwep = [DWARVISH_SPEAR, SILVER_SPEAR, ELVEN_SPEAR, SPEAR, ORCISH_SPEAR, JAVELIN, SHURIKEN, YA, SILVER_ARROW, ELVEN_ARROW, ARROW, ORCISH_ARROW, CROSSBOW_BOLT, SILVER_DAGGER, ELVEN_DAGGER, DAGGER, ORCISH_DAGGER, KNIFE, FLINT, ROCK, LOADSTONE, LUCKSTONE, DART, CREAM_PIE];
/* polearms */
const pwep = [HALBERD, BARDICHE, SPETUM, BILL_GUISARME, VOULGE, RANSEUR, GUISARME, GLAIVE, LUCERN_HAMMER, BEC_DE_CORBIN, FAUCHARD, PARTISAN, LANCE];
/* throw-and-return weapons */
const arwep = [{ otyp: AKLYS, range: (Math.trunc(8 / 2)) * (Math.trunc(8 / 2)), tethered: 1 }];
/* { BOOMERANG, 5, 0 }, */
export function autoreturn_weapon(otmp) {
    let i = 0;
    for (i = 0; i < (Math.trunc(1 /* sizeof(const struct throw_and_return_weapon [1]) */ / 1 /* sizeof(const struct throw_and_return_weapon) */)); i++) {
        if (otmp.otyp == arwep[i].otyp) {
            return arwep[i];
        }
    }
    return null;
}
/* select a ranged weapon for the monster */
export function select_rwep(mtmp) {
    let otmp = null;
    let mwep = null;
    let mweponly = 0;
    let i = 0;
    let mlet = mtmp.data.mlet;
    game.propellor = game.hands_obj;
    do {
        if ((otmp = oselect(mtmp, EGG)) != null) {
            return otmp;
        }
    } while (0);
    /* pies are first choice for Kops */
    if (mlet == S_KOP) {
        do {
            if ((otmp = oselect(mtmp, CREAM_PIE)) != null) {
                return otmp;
            }
        } while (0);
    }
    if ((((mtmp.data).mflags2 & 134217728) != 0)) {
        do {
            if ((otmp = oselect(mtmp, BOULDER)) != null) {
                return otmp;
            }
        } while (0);
    }
    /* Select polearms first; they do more damage and aren't expendable.
       But don't pick one if monster's weapon is welded, because then
       we'd never have a chance to throw non-wielding missiles. */
    /* The limit of 13 here is based on the monster polearm range limit
     * (defined as 5 in mthrowu.c).  5 corresponds to a distance of 2 in
     * one direction and 1 in another; one space beyond that would be 3 in
     * one direction and 2 in another; 3^2+2^2=13.
     */
    mwep = ((mtmp).mw);
    /* NO_WEAPON_WANTED means we already tried to wield and failed */
    mweponly = (mwelded(mwep) && mtmp.weapon_check == NO_WEAPON_WANTED);
    if (dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) <= 13 && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
        if (is_art(mwep, ART_SNICKERSNEE)) {
            game.propellor = mwep;
            return mwep;
        }
        for (i = 0; i < (Math.trunc(52 /* sizeof(const int [13]) */ / 4 /* sizeof(const int) */)); i++) {
            if ((((((mtmp.data).mflags2 & 67108864) != 0) && (mtmp.misc_worn_check & 8) == 0) || !game.objects[pwep[i]].oc_big) && (game.objects[pwep[i]].oc_material != SILVER || !mon_hates_silver(mtmp))) {
                if ((otmp = oselect(mtmp, pwep[i])) != null && (otmp == mwep || !mweponly)) {
                    /* Only strong monsters can wield big (esp. long) weapons.
             * Big weapon is basically the same as bimanual.
             * All monsters can wield the remaining weapons.
             */
                    /* force the monster to wield it */
                    game.propellor = otmp;
                    return otmp;
                }
            }
        }
    }
    for (i = 0; i < (Math.trunc(1 /* sizeof(const struct throw_and_return_weapon [1]) */ / 1 /* sizeof(const struct throw_and_return_weapon) */)); i++) {
        /* Next, try to select a throw-and-return weapon, since they are
     * also not as expendable. Again, don't pick one if monster's
     * weapon is welded.
     */
        let arw = arwep[i];
        if (!(((mtmp.data).mflags1 & 65536) != 0) && !(((mtmp.data).mflags1 & 262144) != 0) && !mweponly && dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) <= arw.range && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
            if ((((mtmp.misc_worn_check & 8) == 0) || !game.objects[arw.otyp].oc_big) && (game.objects[arw.otyp].oc_material != SILVER || !mon_hates_silver(mtmp))) {
                if ((otmp = oselect(mtmp, arw.otyp)) != null && (otmp == mwep || !mweponly)) {
                    game.propellor = otmp;
                    return otmp;
                }
            }
        }
    }
    for (i = 0; i < (Math.trunc(96 /* sizeof(const int [24]) */ / 4 /* sizeof(const int) */)); i++) {
        /*
     * other than the specific cases above, always select the
     * most potent ranged weapon to hand.
     */
        let prop = 0;
        if (rwep[i] == DART && !(((mtmp.data).mflags2 & 536870912) != 0) && m_carrying(mtmp, SLING)) {
            for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
                if (otmp.oclass == GEM_CLASS && (otmp.otyp != LOADSTONE || !otmp.cursed)) {
                    /* shooting gems from slings; this goes just before the darts */
                    /* (shooting rocks is already handled via the rwep[] ordering) */
                    game.propellor = m_carrying(mtmp, SLING);
                    return otmp;
                }
            }
        }
        /* KMH -- This belongs here so darts will work */
        game.propellor = game.hands_obj;
        prop = game.objects[rwep[i]].oc_subtyp;
        if (prop < 0) {
            switch (-prop) {
                case P_BOW:
                    game.propellor = oselect(mtmp, YUMI);
                    if (!game.propellor) {
                        game.propellor = oselect(mtmp, ELVEN_BOW);
                    }
                    if (!game.propellor) {
                        game.propellor = oselect(mtmp, BOW);
                    }
                    if (!game.propellor) {
                        game.propellor = oselect(mtmp, ORCISH_BOW);
                    }
                    break;
                case P_SLING:
                    game.propellor = oselect(mtmp, SLING);
                    break;
                case P_CROSSBOW:
                    game.propellor = oselect(mtmp, CROSSBOW);
            }
            if ((otmp = ((mtmp).mw)) && mwelded(otmp) && otmp != game.propellor && mtmp.weapon_check == NO_WEAPON_WANTED) {
                game.propellor = null;
            }
        }
        if (game.propellor != null) {
            if (rwep[i] != LOADSTONE) {
                /* propellor = obj, propellor to use
         * propellor = &hands_obj, doesn't need a propellor
         * propellor = 0, needed one and didn't have one
         */
                /* Note: cannot use m_carrying for loadstones, since it will
             * always select the first object of a type, and maybe the
             * monster is carrying two but only the first is unthrowable.
             */
                /* Don't throw a cursed weapon-in-hand or an artifact */
                if ((otmp = oselect(mtmp, rwep[i])) && !otmp.oartifact && !(otmp == ((mtmp).mw) && mwelded(otmp))) {
                    return otmp;
                }
            } else {
                for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
                    if (otmp.otyp == LOADSTONE && !otmp.cursed) {
                        return otmp;
                    }
                }
            }
        }
    }
    return null;
}
/* is 'obj' a type of weapon that any monster knows how to throw? */
export function monmightthrowwep(obj) {
    let idx = 0;
    for (idx = 0; idx < (Math.trunc(96 /* sizeof(const int [24]) */ / 4 /* sizeof(const int) */)); ++idx) {
        if (obj.otyp == rwep[idx]) {
            return (1);
        }
    }
    return (0);
}
/* Weapons in order of preference */
const hwep = [CORPSE, TSURUGI, RUNESWORD, DWARVISH_MATTOCK, TWO_HANDED_SWORD, BATTLE_AXE, KATANA, UNICORN_HORN, CRYSKNIFE, TRIDENT, LONG_SWORD, ELVEN_BROADSWORD, BROADSWORD, SCIMITAR, SILVER_SABER, MORNING_STAR, ELVEN_SHORT_SWORD, DWARVISH_SHORT_SWORD, SHORT_SWORD, ORCISH_SHORT_SWORD, SILVER_MACE, MACE, AXE, DWARVISH_SPEAR, SILVER_SPEAR, ELVEN_SPEAR, SPEAR, ORCISH_SPEAR, FLAIL, BULLWHIP, QUARTERSTAFF, JAVELIN, AKLYS, CLUB, PICK_AXE, RUBBER_HOSE, WAR_HAMMER, SILVER_DAGGER, ELVEN_DAGGER, DAGGER, ORCISH_DAGGER, ATHAME, SCALPEL, KNIFE, WORM_TOOTH];
/* cockatrice corpse */
/* select a hand to hand weapon for the monster */
export function select_hwep(mtmp) {
    let otmp = null;
    let i = 0;
    let strong = (((mtmp.data).mflags2 & 67108864) != 0);
    let wearing_shield = (mtmp.misc_worn_check & 8) != 0;
    for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
        /* prefer artifacts to everything else */
        if (otmp.oclass == WEAPON_CLASS && otmp.oartifact && touch_artifact(otmp, mtmp) && ((strong && !wearing_shield) || !game.objects[otmp.otyp].oc_big)) {
            return otmp;
        }
    }
    /* giants just love to use clubs */
    if ((((mtmp.data).mflags2 & 8192) != 0)) {
        do {
            if ((otmp = oselect(mtmp, CLUB)) != null) {
                return otmp;
            }
        } while (0);
    } else if (mtmp.data == game.mons[PM_BALROG] && game.uwep) {
        do {
            if ((otmp = oselect(mtmp, BULLWHIP)) != null) {
                return otmp;
            }
        } while (0);
    }
    for (i = 0; i < (Math.trunc(90 /* sizeof(const short [45]) */ / 2 /* sizeof(const short) */)); i++) {
        /* only strong monsters can wield big (esp. long) weapons */
        /* big weapon is basically the same as bimanual */
        /* all monsters can wield the remaining weapons */
        if (hwep[i] == CORPSE && !(mtmp.misc_worn_check & 16) && !Resists_Elem(mtmp, STONE_RES)) {
            continue;
        }
        if (((strong && !wearing_shield) || !game.objects[hwep[i]].oc_big) && (game.objects[hwep[i]].oc_material != SILVER || !mon_hates_silver(mtmp))) {
            do {
                if ((otmp = oselect(mtmp, hwep[i])) != null) {
                    return otmp;
                }
            } while (0);
        }
    }
    return null;
}
/* Called after polymorphing a monster, robbing it, etc....  Monsters
 * otherwise never unwield stuff on their own.  Might print message.
 */
export function possibly_unwield(mon, polyspot) {
    let obj = null;
    let mw_tmp = null;
    if (!(mw_tmp = ((mon).mw))) {
        return;
    }
    for (obj = mon.minvent; obj; obj = obj.nobj) {
        if (obj == mw_tmp) {
            break;
        }
    }
    if (!obj) {
        ((mon).mw = null);
        /* The weapon was stolen or destroyed */
        mon.weapon_check = NEED_WEAPON;
        return;
    }
    if (!attacktype(mon.data, 254)) {
        setmnotwielded(mon, mw_tmp);
        mon.weapon_check = NO_WEAPON_WANTED;
        if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
            /* if we're going to call distant_name(), do so before extract_self */
            pline_mon(mon, "%s drops %s.", Monnam(mon), distant_name(obj, doname));
            newsym(mon.mx, mon.my);
        }
        obj_extract_self(obj);
        if (!flooreffects(obj, mon.mx, mon.my, "drop")) {
            /* might be dropping object into water or lava */
            if (polyspot) {
                bypass_obj(obj);
            }
            place_object(obj, mon.mx, mon.my);
            stackobj(obj);
        }
        return;
    }
    /* The remaining case where there is a change is where a monster
     * is polymorphed into a stronger/weaker monster with a different
     * choice of weapons.  This has no parallel for players.  It can
     * be handled by waiting until mon_wield_item is actually called.
     * Though the monster still wields the wrong weapon until then,
     * this is OK since the player can't see it.  (FIXME: Not okay since
     * probing can reveal it.)
     * Note that if there is no change, setting the check to NEED_WEAPON
     * is harmless.
     * Possible problem: big monster with big cursed weapon gets
     * polymorphed into little monster.  But it's not quite clear how to
     * handle this anyway....
     */
    if (!(mwelded(mw_tmp) && mon.weapon_check == NO_WEAPON_WANTED)) {
        mon.weapon_check = NEED_WEAPON;
    }
    return;
}
/* Let a monster try to wield a weapon, based on mon->weapon_check.
 * Returns 1 if the monster took time to do it, 0 if it did not.
 */
export function mon_wield_item(mon) {
    let obj = null;
    /* assume mon is planning to attack */
    let exclaim = (1);
    /* This case actually should never happen */
    if (mon.weapon_check == NO_WEAPON_WANTED) {
        return 0;
    }
    switch (mon.weapon_check) {
        case NEED_HTH_WEAPON:
            obj = select_hwep(mon);
            break;
        case NEED_RANGED_WEAPON:
            select_rwep(mon);
            obj = game.propellor;
            break;
        case NEED_PICK_AXE:
            obj = m_carrying(mon, PICK_AXE);
            /* KMH -- allow other picks */
            if (!obj && !which_armor(mon, 8)) {
                obj = m_carrying(mon, DWARVISH_MATTOCK);
            }
            /* mon is just planning to dig */
            exclaim = (0);
            break;
        case NEED_AXE:
            obj = m_carrying(mon, BATTLE_AXE);
            if (!obj || which_armor(mon, 8)) {
                obj = m_carrying(mon, AXE);
            }
            exclaim = (0);
            break;
        case NEED_PICK_OR_AXE:
            obj = m_carrying(mon, DWARVISH_MATTOCK);
            if (!obj) {
                obj = m_carrying(mon, BATTLE_AXE);
            }
            if (!obj || which_armor(mon, 8)) {
                /* currently, only 2 types of axe */
                /* prefer pick for fewer switches on most levels */
                obj = m_carrying(mon, PICK_AXE);
                if (!obj) {
                    obj = m_carrying(mon, AXE);
                }
            }
            exclaim = (0);
            break;
        default:
            impossible("weapon_check %d for %s?", mon.weapon_check, mon_nam(mon));
            return 0;
    }
    if (obj && obj != game.hands_obj) {
        let mw_tmp = ((mon).mw);
        if (mw_tmp && mw_tmp.otyp == obj.otyp) {
            mon.weapon_check = NEED_WEAPON;
            return 0;
        }
        if (mw_tmp && mwelded(mw_tmp)) {
            if (canseemon(mon)) {
                /* Actually, this isn't necessary--as soon as the monster
         * wields the weapon, the weapon welds itself, so the monster
         * can know it's cursed and needn't even bother trying.
         * Still....
         */
                let welded_buf = '';
                let mon_hand = mbodypart(mon, HAND);
                if (((mw_tmp.oclass == WEAPON_CLASS || mw_tmp.oclass == TOOL_CLASS) && game.objects[mw_tmp.otyp].oc_big)) {
                    mon_hand = makeplural(mon_hand);
                }
                welded_buf = sprintf(welded_buf, "%s welded to %s %s", otense(mw_tmp, "are"), (genders[pronoun_gender(mon, 2)].his), mon_hand);
                if (obj.otyp == PICK_AXE) {
                    pline("Since %s weapon%s %s,", s_suffix(mon_nam(mon)), (((mw_tmp.quan) == 1) ? "" : "s"), welded_buf);
                    pline("%s cannot wield that %s.", mon_nam(mon), xname(obj));
                } else {
                    pline_mon(mon, "%s tries to wield %s.", Monnam(mon), doname(obj));
                    pline("%s %s!", Yname2(mw_tmp), welded_buf);
                }
                mw_tmp.bknown = 1;
            }
            mon.weapon_check = NO_WEAPON_WANTED;
            return 1;
        }
        mon.mw = obj;
        setmnotwielded(mon, mw_tmp);
        mon.weapon_check = NEED_WEAPON;
        if (canseemon(mon)) {
            let newly_welded = 0;
            let arw = null;
            pline_mon(mon, "%s wields %s%c", Monnam(mon), doname(obj), exclaim ? 33 : 46);
            if ((arw = autoreturn_weapon(obj)) != null && arw.tethered != 0) {
                pline_mon(mon, "%s secures the tether on %s.", Monnam(mon), the(xname(obj)));
            }
            /* 3.6.3: mwelded() predicate expects the object to have its
               W_WEP bit set in owormmask, but the pline here and for
               artifact_light don't want that because they'd have '(weapon
               in hand/claw)' appended; so we set it for the mwelded test
               and then clear it, until finally setting it for good below */
            obj.owornmask |= 256;
            newly_welded = mwelded(obj);
            obj.owornmask &= ~256;
            if (newly_welded) {
                let mon_hand = mbodypart(mon, HAND);
                if (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_big)) {
                    mon_hand = makeplural(mon_hand);
                }
                pline("%s %s to %s %s!", Tobjnam(obj, "weld"), ((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "themselves" : "itself", s_suffix(mon_nam(mon)), mon_hand);
                obj.bknown = 1;
            }
        }
        if (artifact_light(obj) && !obj.lamplit) {
            begin_burn(obj, (0));
            if (canseemon(mon)) {
                pline("%s %s in %s %s!", Tobjnam(obj, "shine"), arti_light_description(obj), s_suffix(mon_nam(mon)), mbodypart(mon, HAND));
            } else if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
                pline("Light begins shining %s.", (dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 5 * 5) ? "nearby" : "in the distance");
            }
        }
        obj.owornmask = 256;
        return 1;
    }
    mon.weapon_check = NEED_WEAPON;
    return 0;
}
/* force monster to stop wielding current weapon, if any */
export function mwepgone(mon) {
    let mwep = ((mon).mw);
    if (mwep) {
        setmnotwielded(mon, mwep);
        mon.weapon_check = NEED_WEAPON;
    }
}
/* attack bonus for strength & dexterity */
export function abon() {
    let sbon = 0;
    let str = (acurr(A_STR));
    let dex = (acurr(A_DEX));
    if ((game.u.umonnum != game.u.umonster)) {
        return (adj_lev(game.mons[game.u.umonnum]) - 3);
    }
    if (str < 6) {
        sbon = -2;
    } else if (str < 8) {
        sbon = -1;
    } else if (str < 17) {
        sbon = 0;
    } else if (str < (18 + (50))) {
        sbon = 1;
    } else if (str < (18 + (100))) {
        sbon = 2;
    /* this used to be '<= 18/50' for bonus of 1 but got changed to '< 18/50'
       so that '18/50' gives a bonus of 2; gnome and orc player characters
       have max Str of 18/50 and giving an extra bonus at that break point
       provides an incentive for them to max out that characteristic */
    } else {
        sbon = 3;
    }
    /* Game tuning kludge: make it a bit easier for a low level character to
     * hit */
    sbon += (game.u.ulevel < 3) ? 1 : 0;
    if (dex < 4) {
        return (sbon - 3);
    } else if (dex < 6) {
        return (sbon - 2);
    } else if (dex < 8) {
        return (sbon - 1);
    } else if (dex < 14) {
        return sbon;
    } else {
        return (sbon + dex - 14);
    }
}
/* damage bonus for strength */
export function dbon() {
    let str = (acurr(A_STR));
    if ((game.u.umonnum != game.u.umonster)) {
        return 0;
    }
    if (str < 6) {
        return -1;
    } else if (str < 16) {
        return 0;
    } else if (str < 18) {
        return 1;
    } else if (str == 18) {
        return 2;
    } else if (str <= (18 + (75))) {
        return 3;
    } else if (str <= (18 + (90))) {
        return 4;
    } else if (str < (18 + (100))) {
        return 5;
    } else {
        return 6;
    }
}
/* called when wet_a_towel() or dry_a_towel() is changing a towel's wetness */
export function finish_towel_change(obj, newspe) {
    /* towel wetness is always between 0 (dry) and 7, inclusive */
    newspe = ((newspe) < (7) ? (newspe) : (7));
    obj.spe = ((newspe) > (0) ? (newspe) : (0));
    /* if hero is wielding this towel, don't give "you begin bashing with
       your [wet] towel" message if it's wet, do give one if it's dry */
    if (obj == game.uwep) {
        game.unweapon = !((obj).otyp == TOWEL && (obj).spe > 0);
    }
    /* description might change: "towel" vs "moist towel" vs "wet towel" */
    if (((obj).where == 3)) {
        update_inventory();
    }
}
/* increase a towel's wetness */
/* positive: new val; negative: increment by -amt; zero: no-op */
export function wet_a_towel(obj, amt, verbose) {
    let newspe = (amt <= 0) ? obj.spe - amt : amt;
    if (newspe > obj.spe) {
        if (verbose) {
            /* new state is only reported if it's an increase */
            let wetness = (newspe < 3) ? (!obj.spe ? "damp" : "damper") : (!obj.spe ? "wet" : "wetter");
            if (((obj).where == 3)) {
                pline("%s gets %s.", Yobjnam2(obj, null), wetness);
            } else if (((obj).where == 4) && canseemon(obj.v.v_ocarry)) {
                pline("%s %s gets %s.", s_suffix(Monnam(obj.v.v_ocarry)), xname(obj), wetness);
            }
        }
    }
    if (newspe != obj.spe) {
        finish_towel_change(obj, newspe);
    }
}
/* decrease a towel's wetness; unlike when wetting, 0 is not a no-op */
/* positive or zero: new value; negative: decrement by abs(amt) */
export function dry_a_towel(obj, amt, verbose) {
    let newspe = (amt < 0) ? obj.spe + amt : amt;
    if (newspe < obj.spe) {
        if (verbose) {
            /* new state is only reported if it's a decrease */
            if (((obj).where == 3)) {
                pline("%s dries%s.", Yobjnam2(obj, null), !newspe ? " out" : "");
            } else if (((obj).where == 4) && canseemon(obj.v.v_ocarry)) {
                pline("%s %s dries%s.", s_suffix(Monnam(obj.v.v_ocarry)), xname(obj), !newspe ? " out" : "");
            }
        }
    }
    if (newspe != obj.spe) {
        finish_towel_change(obj, newspe);
    }
}
/* copy the skill level name into the given buffer */
export function skill_level_name(skill, buf) {
    let ptr = null;
    switch ((game.u.weapon_skills[skill].skill)) {
        case P_UNSKILLED:
            ptr = "Unskilled";
            break;
        case P_BASIC:
            ptr = "Basic";
            break;
        case P_SKILLED:
            ptr = "Skilled";
            break;
        case P_EXPERT:
            ptr = "Expert";
            break;
        /* these are for unarmed combat/martial arts only */
        case P_MASTER:
            ptr = "Master";
            break;
        case P_GRAND_MASTER:
            ptr = "Grand Master";
            break;
        default:
            ptr = "Unknown";
            break;
    }
    buf = strcpy(buf, ptr);
    return buf;
}
export function skill_name(skill) {
    return ((skill_names_indices[skill] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[skill]]).oc_name_idx].oc_name) : (skill == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[skill]]);
}
/* return the # of slots required to advance the skill */
export function slots_required(skill) {
    let tmp = (game.u.weapon_skills[skill].skill);
    /* The more difficult the training, the more slots it takes.
     *  unskilled -> basic      1
     *  basic -> skilled        2
     *  skilled -> expert       3
     */
    if (skill <= P_UNICORN_HORN || skill == P_TWO_WEAPON_COMBAT) {
        return tmp;
    }
    /* Fewer slots used up for unarmed or martial.
     *  unskilled -> basic      1
     *  basic -> skilled        1
     *  skilled -> expert       2
     *  expert -> master        2
     *  master -> grand master  3
     */
    return Math.trunc((tmp + 1) / 2);
}
/* return true if this skill can be advanced */
export function can_advance(skill, speedy) {
    if ((game.u.weapon_skills[skill].skill == P_ISRESTRICTED) || (game.u.weapon_skills[skill].skill) >= (game.u.weapon_skills[skill].max_skill) || game.u.skills_advanced >= 60) {
        return (0);
    }
    if (game.flags.debug && speedy) {
        return (1);
    }
    return ((game.u.weapon_skills[skill].advance) >= (((game.u.weapon_skills[skill].skill)) * ((game.u.weapon_skills[skill].skill)) * 20) && game.u.weapon_slots >= slots_required(skill));
}
/* return true if this skill could be advanced if more slots were available */
export function could_advance(skill) {
    if ((game.u.weapon_skills[skill].skill == P_ISRESTRICTED) || (game.u.weapon_skills[skill].skill) >= (game.u.weapon_skills[skill].max_skill) || game.u.skills_advanced >= 60) {
        return (0);
    }
    return ((game.u.weapon_skills[skill].advance) >= (((game.u.weapon_skills[skill].skill)) * ((game.u.weapon_skills[skill].skill)) * 20));
}
/* return true if this skill has reached its maximum and there's been enough
   practice to become eligible for the next step if that had been possible */
export function peaked_skill(skill) {
    if ((game.u.weapon_skills[skill].skill == P_ISRESTRICTED)) {
        return (0);
    }
    return ((game.u.weapon_skills[skill].skill) >= (game.u.weapon_skills[skill].max_skill) && ((game.u.weapon_skills[skill].advance) >= (((game.u.weapon_skills[skill].skill)) * ((game.u.weapon_skills[skill].skill)) * 20)));
}
export function skill_advance(skill) {
    game.u.weapon_slots -= slots_required(skill);
    (game.u.weapon_skills[skill].skill)++;
    game.u.skill_record[game.u.skills_advanced++] = skill;
    /* subtly change the advance message to indicate no more advancement */
    You("are now %s skilled in %s.", (game.u.weapon_skills[skill].skill) >= (game.u.weapon_skills[skill].max_skill) ? "most" : "more", ((skill_names_indices[skill] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[skill]]).oc_name_idx].oc_name) : (skill == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[skill]]));
    /* wizards discover spellbook IDs depending on spell 'school' skill limits;
       this allows them to successfully write books for unknown spells without
       the Luck bias they used to have over other roles */
    if (skill >= P_ATTACK_SPELL && skill <= P_MATTER_SPELL) {
        skill_based_spellbook_id();
    }
}
// struct skill_range: { first, last, name }
const skill_ranges = [{ first: P_BARE_HANDED_COMBAT, last: P_RIDING, name: "Fighting Skills" }, { first: P_DAGGER, last: P_UNICORN_HORN, name: "Weapon Skills" }, { first: P_ATTACK_SPELL, last: P_MATTER_SPELL, name: "Spellcasting Skills" }];
/* write a list of skills onto the given menu

   if selectable is set, give selection letters for skills that can be
   advanced and leave room for them on skills that can't be advanced */
export function add_skills_to_menu(win, selectable, speedy) {
    let pass = 0;
    let i = 0;
    let len = 0;
    let longest = 0;
    let any = 0;
    let buf = '';
    let sklnambuf = '';
    let prefix = null;
    let clr = 8;
    for (longest = 0 , i = 0; i < P_NUM_SKILLS; i++) {
        /* Find the longest skill name. */
        if ((game.u.weapon_skills[i].skill == P_ISRESTRICTED)) {
            continue;
        }
        if ((len = Strlen_(((skill_names_indices[i] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[i]]).oc_name_idx].oc_name) : (i == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[i]]), "add_skills_to_menu", 1241)) > longest) {
            longest = len;
        }
    }
    for (pass = 0; pass < (Math.trunc(3 /* sizeof(const struct skill_range [3]) */ / 1 /* sizeof(const struct skill_range) */)); pass++) {
        for (i = skill_ranges[pass].first; i <= skill_ranges[pass].last; i++) {
            /* List the skills, making ones that could be advanced selectable if
       selectable is set.  List the miscellaneous skills first.  Possible
       future enhancement: list spell skills before weapon skills for
       spellcaster roles. */
            /* Print headings for skill types */
            any = cg.zeroany;
            if (i == skill_ranges[pass].first) {
                add_menu_heading(win, skill_ranges[pass].name);
            }
            if ((game.u.weapon_skills[i].skill == P_ISRESTRICTED)) {
                continue;
            }
            if (!selectable) {
                prefix = "";
            } else if (can_advance(i, speedy)) {
                prefix = "";
            } else if (could_advance(i)) {
                prefix = "  * ";
            } else if (peaked_skill(i)) {
                prefix = "  # ";
            /*
             * Sigh, this assumes a monospaced font unless
             * iflags.menu_tab_sep is set in which case it puts
             * tabs between columns.
             * The 12 is the longest skill level name.
             * The "    " is room for a selection letter and dash, "a - ".
             */
            /* will be preceded by menu choice */
            } else {
                prefix = "    ";
            }
            skill_level_name(i, sklnambuf);
            if (game.flags.debug) {
                if (!game.iflags.menu_tab_sep) {
                    buf = nh_snprintf("add_skills_to_menu", 1282, buf, 256 /* sizeof(char [256]) */, " %s%-*s %-12s %5d(%4d)", prefix, longest, ((skill_names_indices[i] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[i]]).oc_name_idx].oc_name) : (i == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[i]]), sklnambuf, (game.u.weapon_skills[i].advance), (((game.u.weapon_skills[i].skill)) * ((game.u.weapon_skills[i].skill)) * 20));
                } else {
                    buf = nh_snprintf("add_skills_to_menu", 1287, buf, 256 /* sizeof(char [256]) */, " %s%s\t%s\t%5d(%4d)", prefix, ((skill_names_indices[i] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[i]]).oc_name_idx].oc_name) : (i == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[i]]), sklnambuf, (game.u.weapon_skills[i].advance), (((game.u.weapon_skills[i].skill)) * ((game.u.weapon_skills[i].skill)) * 20));
                }
            } else {
                if (!game.iflags.menu_tab_sep) {
                    buf = nh_snprintf("add_skills_to_menu", 1292, buf, 256 /* sizeof(char [256]) */, " %s %-*s [%s]", prefix, longest, ((skill_names_indices[i] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[i]]).oc_name_idx].oc_name) : (i == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[i]]), sklnambuf);
                } else {
                    buf = nh_snprintf("add_skills_to_menu", 1296, buf, 256 /* sizeof(char [256]) */, " %s%s\t[%s]", prefix, ((skill_names_indices[i] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[i]]).oc_name_idx].oc_name) : (i == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[i]]), sklnambuf);
                }
            }
            any.a_int = selectable && can_advance(i, speedy) ? i + 1 : 0;
            add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        }
    }
}
/* Displays a skill list for dumplog purposes. */
export function show_skills() {
    let win = 0;
    let selected = null;
    pline("Skills:");
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    add_skills_to_menu(win, (0), (0));
    (game.windowprocs.win_end_menu)(win, "");
    ((select_menu(win, 0, selected)));
    (game.windowprocs.win_destroy_nhwindow)(win);
}
/*
 * The `#enhance' extended command.  What we _really_ would like is
 * to keep being able to pick things to advance until we couldn't any
 * more.  This is currently not possible -- the menu code has no way
 * to call us back for instant action.  Even if it did, we would also need
 * to be able to update the menu since selecting one item could make
 * others unselectable.
 */
export function enhance_weapon_skill() {
    let i = 0;
    let n = 0;
    let to_advance = 0;
    let eventually_advance = 0;
    let maxxed_cnt = 0;
    let buf = '';
    let selected = null;
    let win = 0;
    let speedy = (0);
    /* player knows about #enhance, don't show tip anymore */
    game.context.tips |= (1 << TIP_ENHANCE);
    if (game.flags.debug && yn_function("Advance skills without practice?", ynchars, 110, (1)) == 121) {
        speedy = (1);
    }
    do {
        /* count advanceable skills */
        to_advance = eventually_advance = maxxed_cnt = 0;
        for (i = 0; i < P_NUM_SKILLS; i++) {
            if ((game.u.weapon_skills[i].skill == P_ISRESTRICTED)) {
                continue;
            }
            if (can_advance(i, speedy)) {
                to_advance++;
            } else if (could_advance(i)) {
                eventually_advance++;
            } else if (peaked_skill(i)) {
                maxxed_cnt++;
            }
        }
        win = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(win, 0);
        if (eventually_advance > 0 || maxxed_cnt > 0) {
            /* start with a legend if any entries will be annotated
           with "*" or "#" below */
            if (eventually_advance > 0) {
                buf = sprintf(buf, "(Skill%s flagged by \"*\" may be enhanced %s.)", (((eventually_advance) == 1) ? "" : "s"), (game.u.ulevel < 30) ? "when you're more experienced" : "if skill slots become available");
                add_menu_str(win, buf);
            }
            if (maxxed_cnt > 0) {
                buf = sprintf(buf, "(Skill%s flagged by \"#\" cannot be enhanced any further.)", (((maxxed_cnt) == 1) ? "" : "s"));
                add_menu_str(win, buf);
            }
            add_menu_str(win, "");
        }
        add_skills_to_menu(win, to_advance + eventually_advance + maxxed_cnt > 0, speedy);
        buf = strcpy(buf, (to_advance > 0) ? "Pick a skill to advance:" : "Current skills:");
        if (game.flags.debug && !speedy) {
            buf = __nh_buf_append(buf, sprintf('', "  (%d slot%s available)", game.u.weapon_slots, (((game.u.weapon_slots) == 1) ? "" : "s")));
        }
        (game.windowprocs.win_end_menu)(win, buf);
        n = select_menu(win, to_advance ? 1 : 0, selected);
        (game.windowprocs.win_destroy_nhwindow)(win);
        if (n > 0) {
            n = selected[0].item.a_int - 1;
            free(selected);
            skill_advance(n);
            for (n = i = 0; i < P_NUM_SKILLS; i++) {
                if (can_advance(i, speedy)) {
                    /* check for more skills able to advance; if so, then... */
                    if (!speedy) {
                        You_feel("you could be more dangerous!");
                    }
                    n++;
                    break;
                }
            }
        }
    } while (speedy && n > 0);
    return 0;
}
/*
 * Change from restricted to unrestricted, allowing P_BASIC as max.  This
 * function may be called with with P_NONE.  Used in pray.c as well as below.
 */
export function unrestrict_weapon_skill(skill) {
    if (skill < P_NUM_SKILLS && (game.u.weapon_skills[skill].skill == P_ISRESTRICTED)) {
        (game.u.weapon_skills[skill].skill) = P_UNSKILLED;
        (game.u.weapon_skills[skill].max_skill) = P_BASIC;
        (game.u.weapon_skills[skill].advance) = 0;
    }
}
export function use_skill(skill, degree) {
    let advance_before = 0;
    if (skill != P_NONE && !(game.u.weapon_skills[skill].skill == P_ISRESTRICTED)) {
        advance_before = can_advance(skill, (0));
        (game.u.weapon_skills[skill].advance) += degree;
        if (!advance_before && can_advance(skill, (0))) {
            give_may_advance_msg(skill);
        }
    }
}
/* number of slots to gain; normally one */
export function add_weapon_skill(n) {
    let i = 0;
    let before = 0;
    let after = 0;
    for (i = 0 , before = 0; i < P_NUM_SKILLS; i++) {
        if (can_advance(i, (0))) {
            before++;
        }
    }
    game.u.weapon_slots += n;
    for (i = 0 , after = 0; i < P_NUM_SKILLS; i++) {
        if (can_advance(i, (0))) {
            after++;
        }
    }
    if (before < after) {
        give_may_advance_msg(P_NONE);
    }
}
/* number of slots to lose; normally one */
export function lose_weapon_skill(n) {
    let skill = 0;
    while (--n >= 0) {
        if (game.u.weapon_slots) {
            /* deduct first from unused slots then from last placed one, if any */
            game.u.weapon_slots--;
        } else if (game.u.skills_advanced) {
            skill = game.u.skill_record[--game.u.skills_advanced];
            if ((game.u.weapon_skills[skill].skill) <= P_UNSKILLED) {
                panic("lose_weapon_skill (%d)", skill);
            }
            (game.u.weapon_skills[skill].skill)--;
            /* Lost skill might have taken more than one slot; refund rest. */
            /* It might now be possible to advance some other pending
               skill by using the refunded slots, but giving a message
               to that effect would seem pretty confusing.... */
            game.u.weapon_slots = slots_required(skill) - 1;
        }
    }
}
/* number of skills to drain */
export function drain_weapon_skill(n) {
    let skill = 0;
    let i = 0;
    let curradv = 0;
    let prevadv = 0;
    let tmpskills = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    memset(tmpskills, 0, 152 /* sizeof(int [38]) */);
    while (--n >= 0) {
        if (game.u.skills_advanced) {
            /* Pick a random skill, deleting it from the list. */
            i = rn2(game.u.skills_advanced);
            skill = game.u.skill_record[i];
            tmpskills[skill] = 1;
            for (; i < game.u.skills_advanced - 1; i++) {
                game.u.skill_record[i] = game.u.skill_record[i + 1];
            }
            game.u.skills_advanced--;
            if ((game.u.weapon_skills[skill].skill) <= P_UNSKILLED) {
                panic("drain_weapon_skill (%d)", skill);
            }
            (game.u.weapon_skills[skill].skill)--;
            /* refund slots used for skill */
            game.u.weapon_slots += slots_required(skill);
            /* drain skill training to a value appropriate for new level */
            curradv = (((game.u.weapon_skills[skill].skill)) * ((game.u.weapon_skills[skill].skill)) * 20);
            prevadv = (((game.u.weapon_skills[skill].skill) - 1) * ((game.u.weapon_skills[skill].skill) - 1) * 20);
            if ((game.u.weapon_skills[skill].advance) >= curradv) {
                (game.u.weapon_skills[skill].advance) = prevadv + rn2(curradv - prevadv);
            }
        }
    }
    /* initialize skill array; by default, everything is restricted */
    for (skill = 0; skill < P_NUM_SKILLS; skill++) {
        if (tmpskills[skill]) {
            You("forget %syour training in %s.", (game.u.weapon_skills[skill].skill) >= P_BASIC ? "some of " : "", ((skill_names_indices[skill] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[skill]]).oc_name_idx].oc_name) : (skill == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[skill]]));
        }
    }
}
export function weapon_type(obj) {
    /* KMH -- now uses the object table */
    let type = 0;
    if (!obj) {
        return P_BARE_HANDED_COMBAT;
    }
    if (obj.oclass != WEAPON_CLASS && obj.oclass != TOOL_CLASS && obj.oclass != GEM_CLASS) {
        return P_NONE;
    }
    /* Not a weapon, weapon-tool, or ammo */
    type = game.objects[obj.otyp].oc_subtyp;
    return (type < 0) ? -type : type;
}
export function uwep_skill_type() {
    if (game.u.twoweap) {
        return P_TWO_WEAPON_COMBAT;
    }
    return weapon_type(game.uwep);
}
/*
 * Return hit bonus/penalty based on skill of weapon.
 * weapon can be null, meaning bare-handed combat.
 * Treat restricted weapons as unskilled.
 */
const __weapon_hit_bonus_bad_skill = "weapon_hit_bonus: bad skill %d";
export function weapon_hit_bonus(weapon) {
    let type = 0;
    let wep_type = 0;
    let skill = 0;
    let bonus = 0;
    wep_type = weapon_type(weapon);
    /* use two weapon skill only if attacking with one of the wielded weapons
     */
    type = (game.u.twoweap && (weapon == game.uwep || weapon == game.uswapwep)) ? P_TWO_WEAPON_COMBAT : wep_type;
    if (type == P_NONE) {
        bonus = 0;
    } else if (type <= P_UNICORN_HORN) {
        switch ((game.u.weapon_skills[type].skill)) {
            default:
                impossible(__weapon_hit_bonus_bad_skill, (game.u.weapon_skills[type].skill));
                ;
            /* KMH -- It's harder to hit while you are riding */
            /* KMH -- Riding gives some thrusting damage */
            case P_ISRESTRICTED:
            case P_UNSKILLED:
                bonus = -4;
                break;
            case P_BASIC:
                bonus = 0;
                break;
            case P_SKILLED:
                bonus = 2;
                break;
            case P_EXPERT:
                bonus = 3;
                break;
        }
    } else if (type == P_TWO_WEAPON_COMBAT) {
        skill = (game.u.weapon_skills[P_TWO_WEAPON_COMBAT].skill);
        if ((game.u.weapon_skills[wep_type].skill) < skill) {
            skill = (game.u.weapon_skills[wep_type].skill);
        }
        switch (skill) {
            default:
                impossible(__weapon_hit_bonus_bad_skill, skill);
                ;
            case P_ISRESTRICTED:
            case P_UNSKILLED:
                bonus = -9;
                break;
            case P_BASIC:
                bonus = -7;
                break;
            case P_SKILLED:
                bonus = -5;
                break;
            case P_EXPERT:
                bonus = -3;
                break;
        }
    } else if (type == P_BARE_HANDED_COMBAT) {
        /*
         *        b.h. m.a.
         * unskl:  +1  n/a
         * basic:  +1   +3
         * skild:  +2   +4
         * exprt:  +2   +5
         * mastr:  +3   +6
         * grand:  +3   +7
         */
        /*
         *        b.h. m.a.
         * unskl:   0  n/a
         * basic:  +1   +3
         * skild:  +1   +4
         * exprt:  +2   +6
         * mastr:  +2   +7
         * grand:  +3   +9
         */
        bonus = (game.u.weapon_skills[type].skill);
        bonus = ((bonus) > (P_UNSKILLED) ? (bonus) : (P_UNSKILLED)) - 1;
        bonus = Math.trunc(((bonus + 2) * (((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) ? 2 : 1)) / 2);
    }
    if (game.u.usteed) {
        switch ((game.u.weapon_skills[P_RIDING].skill)) {
            case P_ISRESTRICTED:
            case P_UNSKILLED:
                bonus -= 2;
                break;
            case P_BASIC:
                bonus -= 1;
                break;
            case P_SKILLED:
                break;
            case P_EXPERT:
                break;
        }
        if (game.u.twoweap) {
            bonus -= 2;
        }
    }
    return bonus;
}
/*
 * Return damage bonus/penalty based on skill of weapon.
 * weapon can be null, meaning bare-handed combat.
 * Treat restricted weapons as unskilled.
 */
export function weapon_dam_bonus(weapon) {
    let type = 0;
    let wep_type = 0;
    let skill = 0;
    let bonus = 0;
    wep_type = weapon_type(weapon);
    type = (game.u.twoweap && (weapon == game.uwep || weapon == game.uswapwep)) ? P_TWO_WEAPON_COMBAT : wep_type;
    if (type == P_NONE) {
        bonus = 0;
    } else if (type <= P_UNICORN_HORN) {
        switch ((game.u.weapon_skills[type].skill)) {
            default:
                impossible("weapon_dam_bonus: bad skill %d", (game.u.weapon_skills[type].skill));
                ;
            case P_ISRESTRICTED:
            case P_UNSKILLED:
                bonus = -2;
                break;
            case P_BASIC:
                bonus = 0;
                break;
            case P_SKILLED:
                bonus = 1;
                break;
            case P_EXPERT:
                bonus = 2;
                break;
        }
    } else if (type == P_TWO_WEAPON_COMBAT) {
        skill = (game.u.weapon_skills[P_TWO_WEAPON_COMBAT].skill);
        if ((game.u.weapon_skills[wep_type].skill) < skill) {
            skill = (game.u.weapon_skills[wep_type].skill);
        }
        switch (skill) {
            default:
            case P_ISRESTRICTED:
            case P_UNSKILLED:
                bonus = -3;
                break;
            case P_BASIC:
                bonus = -1;
                break;
            case P_SKILLED:
                bonus = 0;
                break;
            case P_EXPERT:
                bonus = 1;
                break;
        }
    } else if (type == P_BARE_HANDED_COMBAT) {
        bonus = (game.u.weapon_skills[type].skill);
        bonus = ((bonus) > (P_UNSKILLED) ? (bonus) : (P_UNSKILLED)) - 1;
        bonus = Math.trunc(((bonus + 1) * (((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK))) ? 3 : 1)) / 2);
    }
    if (game.u.usteed && type != P_TWO_WEAPON_COMBAT) {
        switch ((game.u.weapon_skills[P_RIDING].skill)) {
            case P_ISRESTRICTED:
            case P_UNSKILLED:
                break;
            case P_BASIC:
                break;
            case P_SKILLED:
                bonus += 1;
                break;
            case P_EXPERT:
                bonus += 2;
                break;
        }
    }
    return bonus;
}
/*
 * Initialize weapon skill array for the game.  Start by setting all
 * skills to restricted, then set the skill for every weapon the
 * hero is holding, finally reading the given array that sets
 * maximums.
 */
export function skill_init(class_skill) {
    let obj = null;
    let skmax = 0;
    let skill = 0;
    for (skill = 0; skill < P_NUM_SKILLS; skill++) {
        (game.u.weapon_skills[skill].skill) = P_ISRESTRICTED;
        (game.u.weapon_skills[skill].max_skill) = P_ISRESTRICTED;
        (game.u.weapon_skills[skill].advance) = 0;
    }
    for (obj = game.invent; obj; obj = obj.nobj) {
        if (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW)) {
            continue;
        }
        skill = weapon_type(obj);
        if (skill != P_NONE) {
            (game.u.weapon_skills[skill].skill) = P_BASIC;
        }
    }
    if ((game.urole.mnum == (PM_HEALER)) || (game.urole.mnum == (PM_MONK))) {
        (game.u.weapon_skills[P_HEALING_SPELL].skill) = P_BASIC;
    } else if ((game.urole.mnum == (PM_CLERIC))) {
        (game.u.weapon_skills[P_CLERIC_SPELL].skill) = P_BASIC;
    } else if ((game.urole.mnum == (PM_WIZARD))) {
        (game.u.weapon_skills[P_ATTACK_SPELL].skill) = P_BASIC;
        (game.u.weapon_skills[P_ENCHANTMENT_SPELL].skill) = P_BASIC;
    }
    const __nhi_class_skill_arr = class_skill;
    for (let __nhi_class_skill = 0; (class_skill = __nhi_class_skill_arr[__nhi_class_skill]) && (class_skill.skill != P_NONE); __nhi_class_skill++) {
        /* walk through array to set skill maximums */
        skmax = class_skill.skmax;
        skill = class_skill.skill;
        (game.u.weapon_skills[skill].max_skill) = skmax;
        if ((game.u.weapon_skills[skill].skill) == P_ISRESTRICTED) {
            (game.u.weapon_skills[skill].skill) = P_UNSKILLED;
        }
    }
    /* High potential fighters already know how to use their hands. */
    if ((game.u.weapon_skills[P_BARE_HANDED_COMBAT].max_skill) > P_EXPERT) {
        (game.u.weapon_skills[P_BARE_HANDED_COMBAT].skill) = P_BASIC;
    }
    /* Roles that start with a horse know how to ride it */
    if (game.urole.petnum == PM_PONY) {
        (game.u.weapon_skills[P_RIDING].skill) = P_BASIC;
    }
    for (skill = 0; skill < P_NUM_SKILLS; skill++) {
        if (!(game.u.weapon_skills[skill].skill == P_ISRESTRICTED)) {
            if ((game.u.weapon_skills[skill].max_skill) < (game.u.weapon_skills[skill].skill)) {
                /*
     * Make sure we haven't missed setting the max on a skill
     * & set advance
     */
                impossible("skill_init: curr > max: %s", ((skill_names_indices[skill] > 0) ? (game.obj_descr[(game.objects[skill_names_indices[skill]]).oc_name_idx].oc_name) : (skill == P_BARE_HANDED_COMBAT) ? barehands_or_martial[((game.urole.mnum == (PM_SAMURAI)) || (game.urole.mnum == (PM_MONK)))] : odd_skill_names[-skill_names_indices[skill]]));
                (game.u.weapon_skills[skill].max_skill) = (game.u.weapon_skills[skill].skill);
            }
            (game.u.weapon_skills[skill].advance) = (((game.u.weapon_skills[skill].skill) - 1) * ((game.u.weapon_skills[skill].skill) - 1) * 20);
        }
    }
    /* each role has a special spell; allow at least basic for its type
       (despite the function name, this works for spell skills too) */
    unrestrict_weapon_skill(spell_skilltype(game.urole.spelspec));
    /* paupers lack advanced access to books */
    if (!game.u.uroleplay.pauper) {
        skill_based_spellbook_id();
    }
}
export function setmnotwielded(mon, obj) {
    if (!obj) {
        return;
    }
    if (artifact_light(obj) && obj.lamplit) {
        end_burn(obj, (0));
        if (canseemon(mon)) {
            pline("%s in %s %s %s shining.", The(xname(obj)), s_suffix(mon_nam(mon)), mbodypart(mon, HAND), otense(obj, "stop"));
        }
    }
    if (((mon).mw) == obj) {
        ((mon).mw = null);
    }
    obj.owornmask &= ~256;
}
/*weapon.c*/
/* not a weapon or weptool: use item class name;
           override class name for things where it sounds strange and
           for things that aren't unexpected to find being wielded:
           corpses, tins, eggs, and globs avoid "food",
           statues and boulders avoid "large rock",
           and towels and tin openers avoid "tool" */
/* avoid "rock"; what about known glass? */
/* in case somebody adds odd sling ammo */
/* even if "dwarvish mattock" hasn't been discovered yet */
/* 3.6.3: artifact might be getting wielded by invisible monst */
