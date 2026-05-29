/* NetHack 5.0	attrib.c	$NHDT-Date: 1777000050 2026/04/23 19:07:30 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.137 $ */
/*      Copyright 1988, 1989, 1990, 1992, M. Stephenson           */
/* NetHack may be freely redistributed.  See license for details. */
/*  attribute modification routines. */
/* part of the output on gain or loss of attribute */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { nh_strchr_truncate, strcmp, strcpy, strlen, strncmpi, strstri } from '../c2js-runtime/string.js';
import { confers_luck, is_art, retouch_equipment, what_gives } from './artifact.js';
import { c_common_strings } from './decl.js';
import { see_monsters, shieldeff } from './display.js';
import { on_level } from './dungeon.js';
import { done } from './end.js';
import { losehp, near_capacity } from './hack.js';
import { copynchars } from './hacklib.js';
import { carrying } from './invent.js';
import { summon_furies } from './makemon.js';
import { adj_erinys } from './mon.js';
import { name_to_mon } from './mondata.js';
import { ART_EYES_OF_THE_OVERWORLD, ART_OGRESMASHER, A_CG_CONVERT, A_CG_HELM_OFF, A_CG_HELM_ON, A_CHA, A_CON, A_DEX, A_INT, A_MAX, A_STR, A_WIS, BLINDED, BLND_RES, CLAIRVOYANT, COLD_RES, CONFUSION, DEAF, DIED, DRAIN_RES, DUNCE_CAP, EXT_ENCUMBER, FACE, FAINTED, FAINTING, FAST, FIRE_RES, FIXED_ABIL, FUMBLING, GAUNTLETS_OF_POWER, HALLUC, HALLUC_RES, HELM_OF_OPPOSITE_ALIGNMENT, HUNGRY, HVY_ENCUMBER, INFRAVISION, INVIS, JUMPING, LOW_PM, LUCKSTONE, MOD_ENCUMBER, NOT_HUNGRY, NUMMONS, PM_AMOROUS_DEMON, PM_ARCHEOLOGIST, PM_BARBARIAN, PM_CAVE_DWELLER, PM_CLERIC, PM_DWARF, PM_ELF, PM_GNOME, PM_HEALER, PM_HUMAN, PM_KNIGHT, PM_MONK, PM_ORC, PM_RANGER, PM_ROGUE, PM_SAMURAI, PM_TOURIST, PM_VALKYRIE, PM_WIZARD, POISONING, POISON_RES, REGENERATION, SATIATED, SEARCHING, SEE_INVIS, SHOCK_RES, SICK, SLEEP_RES, STEALTH, STRANGLED, STUNNED, S_NYMPH, TELEPORT_CONTROL, TOWEL, VOMITING, WARNING, WEAK, WOUNDED_LEGS, _ISupper } from './nh-constants.js';
import { bare_artifactname, the, ysimple_name } from './objnam.js';
import { encumber_msg } from './pickup.js';
import { livelog_printf } from './pline.js';
import { body_part, uasmon_maxStr } from './polyself.js';
import { make_confused } from './potion.js';
import { d, rn2, rnd } from './rnd.js';
import { aligns } from './role.js';
import { add_weapon_skill, lose_weapon_skill } from './weapon.js';

const plusattr = ["strong", "smart", "wise", "agile", "tough", "charismatic"];
const minusattr = ["weak", "stupid", "foolish", "clumsy", "fragile", "repulsive"];
/* also used by enlightenment in insight.c for non-abbreviated status info */
export const attrname = ["strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma"];
// struct innate: { ulevel, ability, gainstr, losestr }
const arc_abil = [{ ulevel: 1, ability: () => game.u.uprops[SEARCHING], gainstr: "", losestr: "" }, { ulevel: 5, ability: () => game.u.uprops[STEALTH], gainstr: "stealthy", losestr: "" }, { ulevel: 10, ability: () => game.u.uprops[FAST], gainstr: "quick", losestr: "slow" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const bar_abil = [{ ulevel: 1, ability: () => game.u.uprops[POISON_RES], gainstr: "", losestr: "" }, { ulevel: 7, ability: () => game.u.uprops[FAST], gainstr: "quick", losestr: "slow" }, { ulevel: 15, ability: () => game.u.uprops[STEALTH], gainstr: "stealthy", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const cav_abil = [{ ulevel: 7, ability: () => game.u.uprops[FAST], gainstr: "quick", losestr: "slow" }, { ulevel: 15, ability: () => game.u.uprops[WARNING], gainstr: "sensitive", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const hea_abil = [{ ulevel: 1, ability: () => game.u.uprops[POISON_RES], gainstr: "", losestr: "" }, { ulevel: 15, ability: () => game.u.uprops[WARNING], gainstr: "sensitive", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const kni_abil = [{ ulevel: 7, ability: () => game.u.uprops[FAST], gainstr: "quick", losestr: "slow" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const mon_abil = [{ ulevel: 1, ability: () => game.u.uprops[FAST], gainstr: "", losestr: "" }, { ulevel: 1, ability: () => game.u.uprops[SLEEP_RES], gainstr: "", losestr: "" }, { ulevel: 1, ability: () => game.u.uprops[SEE_INVIS], gainstr: "", losestr: "" }, { ulevel: 3, ability: () => game.u.uprops[POISON_RES], gainstr: "healthy", losestr: "" }, { ulevel: 5, ability: () => game.u.uprops[STEALTH], gainstr: "stealthy", losestr: "" }, { ulevel: 7, ability: () => game.u.uprops[WARNING], gainstr: "sensitive", losestr: "" }, { ulevel: 9, ability: () => game.u.uprops[SEARCHING], gainstr: "perceptive", losestr: "unaware" }, { ulevel: 11, ability: () => game.u.uprops[FIRE_RES], gainstr: "cool", losestr: "warmer" }, { ulevel: 13, ability: () => game.u.uprops[COLD_RES], gainstr: "warm", losestr: "cooler" }, { ulevel: 15, ability: () => game.u.uprops[SHOCK_RES], gainstr: "insulated", losestr: "conductive" }, { ulevel: 17, ability: () => game.u.uprops[TELEPORT_CONTROL], gainstr: "controlled", losestr: "uncontrolled" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const pri_abil = [{ ulevel: 15, ability: () => game.u.uprops[WARNING], gainstr: "sensitive", losestr: "" }, { ulevel: 20, ability: () => game.u.uprops[FIRE_RES], gainstr: "cool", losestr: "warmer" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const ran_abil = [{ ulevel: 1, ability: () => game.u.uprops[SEARCHING], gainstr: "", losestr: "" }, { ulevel: 7, ability: () => game.u.uprops[STEALTH], gainstr: "stealthy", losestr: "" }, { ulevel: 15, ability: () => game.u.uprops[SEE_INVIS], gainstr: "", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const rog_abil = [{ ulevel: 1, ability: () => game.u.uprops[STEALTH], gainstr: "", losestr: "" }, { ulevel: 10, ability: () => game.u.uprops[SEARCHING], gainstr: "perceptive", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const sam_abil = [{ ulevel: 1, ability: () => game.u.uprops[FAST], gainstr: "", losestr: "" }, { ulevel: 15, ability: () => game.u.uprops[STEALTH], gainstr: "stealthy", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const tou_abil = [{ ulevel: 10, ability: () => game.u.uprops[SEARCHING], gainstr: "perceptive", losestr: "" }, { ulevel: 20, ability: () => game.u.uprops[POISON_RES], gainstr: "hardy", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const val_abil = [{ ulevel: 1, ability: () => game.u.uprops[COLD_RES], gainstr: "", losestr: "" }, { ulevel: 3, ability: () => game.u.uprops[STEALTH], gainstr: "stealthy", losestr: "" }, { ulevel: 7, ability: () => game.u.uprops[FAST], gainstr: "quick", losestr: "slow" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const wiz_abil = [{ ulevel: 15, ability: () => game.u.uprops[WARNING], gainstr: "sensitive", losestr: "" }, { ulevel: 17, ability: () => game.u.uprops[TELEPORT_CONTROL], gainstr: "controlled", losestr: "uncontrolled" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
/* Intrinsics conferred by race */
const dwa_abil = [{ ulevel: 1, ability: () => game.u.uprops[INFRAVISION], gainstr: "", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const elf_abil = [{ ulevel: 1, ability: () => game.u.uprops[INFRAVISION], gainstr: "", losestr: "" }, { ulevel: 4, ability: () => game.u.uprops[SLEEP_RES], gainstr: "awake", losestr: "tired" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const gno_abil = [{ ulevel: 1, ability: () => game.u.uprops[INFRAVISION], gainstr: "", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const orc_abil = [{ ulevel: 1, ability: () => game.u.uprops[INFRAVISION], gainstr: "", losestr: "" }, { ulevel: 1, ability: () => game.u.uprops[POISON_RES], gainstr: "", losestr: "" }, { ulevel: 0, ability: null, gainstr: null, losestr: null }];
const hum_abil = [{ ulevel: 0, ability: null, gainstr: null, losestr: null }];
/* adjust an attribute; return TRUE if change is made, FALSE otherwise */
/* which characteristic */
/* amount of change */
/* positive => no message, zero => message, and */
export function adjattrib(ndx, incr, msgflg) {
    /* negative => conditional (msg if change made) */
    let old_acurr = 0;
    let old_abase = 0;
    let old_amax = 0;
    let decr = 0;
    let abonflg = 0;
    let attrstr = null;
    if (game.u.uprops[FIXED_ABIL].extrinsic || !incr) {
        return (0);
    }
    if ((ndx == A_INT || ndx == A_WIS) && game.uarmh && game.uarmh.otyp == DUNCE_CAP) {
        if (msgflg == 0) {
            Your("cap constricts briefly, then relaxes again.");
        }
        return (0);
    }
    old_acurr = (acurr(ndx));
    old_abase = (game.u.acurr.a[ndx]);
    old_amax = (game.u.amax.a[ndx]);
    (game.u.acurr.a[ndx]) += incr;
    if (incr > 0) {
        if ((game.u.acurr.a[ndx]) > (game.u.amax.a[ndx])) {
            (game.u.amax.a[ndx]) = (game.u.acurr.a[ndx]);
            /* when incr is negative, this reduces ABASE() */
            if ((game.u.amax.a[ndx]) > ((ndx == A_STR && (game.u.umonnum != game.u.umonster)) ? uasmon_maxStr() : game.urace.attrmax[ndx])) {
                (game.u.acurr.a[ndx]) = (game.u.amax.a[ndx]) = ((ndx == A_STR && (game.u.umonnum != game.u.umonster)) ? uasmon_maxStr() : game.urace.attrmax[ndx]);
            }
        }
        attrstr = plusattr[ndx];
        abonflg = ((game.u.abon.a[ndx]) < 0);
    } else {
        if ((game.u.acurr.a[ndx]) < (game.urace.attrmin[ndx])) {
            /*
             * If base value has dropped so low that it is trying to be
             * taken below the minimum, reduce max value (peak reached)
             * instead.  That means that restore ability and repeated
             * applications of unicorn horn will not be able to recover
             * all the lost value.  As of 3.6.2, we only take away
             * some (average half, possibly zero) of the excess from max
             * instead of all of it, but without intervening recovery, it
             * can still eventually drop to the minimum allowed.  After
             * that, it can't be recovered, only improved with new gains.
             *
             * This used to assign a new negative value to incr and then
             * add it, but that could affect messages below, possibly
             * making a large decrease be described as a small one.
             *
             * decr = rn2(-(ABASE - ATTRMIN) + 1);
             */
            decr = rn2((game.urace.attrmin[ndx]) - (game.u.acurr.a[ndx]) + 1);
            (game.u.acurr.a[ndx]) = (game.urace.attrmin[ndx]);
            (game.u.amax.a[ndx]) -= decr;
            if ((game.u.amax.a[ndx]) < (game.urace.attrmin[ndx])) {
                (game.u.amax.a[ndx]) = (game.urace.attrmin[ndx]);
            }
        }
        attrstr = minusattr[ndx];
        abonflg = ((game.u.abon.a[ndx]) > 0);
    }
    if ((acurr(ndx)) == old_acurr) {
        if (msgflg == 0 && game.flags.verbose) {
            if ((game.u.acurr.a[ndx]) == old_abase && (game.u.amax.a[ndx]) == old_amax) {
                pline("You're %s as %s as you can get.", abonflg ? "currently" : "already", attrstr);
            } else {
                /* current stayed the same but base value changed, or
                   base is at minimum and reduction caused max to drop */
                Your("innate %s has %s.", attrname[ndx], (incr > 0) ? "improved" : "declined");
            }
        }
        return (0);
    }
    (game.u.aexe.a[ndx]) = 0;
    /* Any successful change also resets abuse / exercise level */
    /* You/Your/pline message with call flush_screen(), triggering bot(),
       so the actual data change needs to come before the message */
    /* status line needs updating */
    game.disp.botl = (1);
    if (msgflg <= 0) {
        You_feel("%s%s!", (incr > 1 || incr < -1) ? "very " : "", attrstr);
    }
    if (game.program_state.in_moveloop && (ndx == A_STR || ndx == A_CON)) {
        encumber_msg();
    }
    return (1);
}
/* strength gain */
export function gainstr(otmp, incr, givemsg) {
    let num = incr;
    if (!num) {
        if ((game.u.acurr.a[A_STR]) < 18) {
            num = (rn2(4) ? 1 : rnd(6));
        } else if ((game.u.acurr.a[A_STR]) < (18 + (85))) {
            num = rnd(10);
        } else {
            num = 1;
        }
    }
    adjattrib(A_STR, (otmp && otmp.cursed) ? -num : num, givemsg ? -1 : 1);
}
/* strength loss, may kill you; cause may be poison or monster like 'a' */
export function losestr(num, knam, k_format) {
    let uhpmin = minuhpmax(1);
    let olduhpmax = game.u.uhpmax;
    let ustr = (game.u.acurr.a[A_STR]) - num;
    let amt = 0;
    let dmg = 0;
    let waspolyd = (game.u.umonnum != game.u.umonster);
    if (num <= 0 || (game.u.acurr.a[A_STR]) < (game.urace.attrmin[A_STR])) {
        impossible("losestr: %d - %d", (game.u.acurr.a[A_STR]), num);
        return;
    }
    dmg = 0;
    while (ustr < (game.urace.attrmin[A_STR])) {
        ++ustr;
        --num;
        /* (0..(4-1))+3 => 3..6; used to use flat 6 here */
        amt = (rn2(4) + (3));
        dmg += amt;
    }
    if (dmg) {
        /* Translator-bug fix: C tests `!*knam` (empty C-string). */
        if (!knam || (typeof knam === 'string' ? knam.length === 0
                    : Array.isArray(knam) ? !knam[0]
                    : !knam.value)) {
            /* in case damage is fatal and caller didn't supply killer reason */
            knam = "terminal frailty";
            k_format = 1;
        }
        losehp(dmg, knam, k_format);
        if ((game.u.umonnum != game.u.umonster)) {
            /* when still poly'd, reduce you-as-monst maxHP; never below 1 */
            setuhpmax(((game.u.mhmax - dmg) > (1) ? (game.u.mhmax - dmg) : (1)), (0));
        } else if (!waspolyd) {
            /* not polymorphed now and didn't rehumanize when taking damage;
               reduce max HP, but not below uhpmin */
            if (game.u.uhpmax > uhpmin) {
                setuhpmax(((game.u.uhpmax - dmg) > (uhpmin) ? (game.u.uhpmax - dmg) : (uhpmin)), (0));
            }
        }
        game.disp.botl = (1);
    }
    ((olduhpmax));
    /* only possible if uhpmax was already less than uhpmin */
    /* won't be fatal when no 'drainer' is supplied */
    /* 'num' could have been reduced to 0 in the minimum strength loop;
       '(Upolyd || !waspolyd)' is True unless damage caused rehumanization */
    if (num > 0 && ((game.u.umonnum != game.u.umonster) || !waspolyd)) {
        adjattrib(A_STR, -num, 1);
    }
}
/* combined strength loss and damage from some poisons */
export function poison_strdmg(strloss, dmg, knam, k_format) {
    losestr(strloss, knam, k_format);
    losehp(dmg, knam, k_format);
}
// struct poison_effect_message: { delivery_func, effect_msg }
const poiseff = [{ delivery_func: You_feel, effect_msg: "weaker" }, { delivery_func: Your, effect_msg: "brain is on fire" }, { delivery_func: Your, effect_msg: "judgement is impaired" }, { delivery_func: Your, effect_msg: "muscles won't obey you" }, { delivery_func: You_feel, effect_msg: "very sick" }, { delivery_func: You, effect_msg: "break out in hives" }];
/* A_STR */
/* A_INT */
/* A_WIS */
/* A_DEX */
/* A_CON */
/* A_CHA */
/* feedback for attribute loss due to poisoning */
/* which attribute */
/* emphasis */
export function poisontell(typ, exclaim) {
    let func = poiseff[typ].delivery_func;
    let msg_txt = poiseff[typ].effect_msg;
    /*
     * "You feel weaker" or "you feel very sick" aren't appropriate when
     * wearing or wielding something (gauntlets of power, Ogresmasher)
     * which forces the attribute to maintain its maximum value.
     * Phrasing for other attributes which might have fixed values
     * (dunce cap) is such that we don't need message fixups for them.
     */
    if (typ == A_STR && (acurr(A_STR)) == (100 + (25))) {
        msg_txt = "innately weaker";
    } else if (typ == A_CON && (acurr(A_CON)) == 25) {
        msg_txt = "sick inside";
    }
    (func)("%s%c", msg_txt, exclaim ? 33 : 46);
}
/* called when an attack or trap has poisoned hero (used to be in mon.c) */
/* controls what messages we display */
/* for score+log file if fatal */
/* if fatal is 0, limit damage to adjattrib */
/* thrown weapons are less deadly */
export function poisoned(reason, typ, pkiller, fatal, thrown_weapon) {
    let i = 0;
    let loss = 0;
    let kprefix = 0;
    let blast = !strcmp(reason, "blast");
    if (!blast && !strstri(reason, "poison")) {
        /* inform player about being poisoned unless that's already been done;
       "blast" has given a "blast of poison gas" message; "poison arrow",
       "poison dart", etc have implicitly given poison messages too... */
        let plural = (reason[strlen(reason) - 1] == 115) ? 1 : 0;
        /* avoid "The" Orcus's sting was poisoned... */
        pline("%s%s %s poisoned!", ((__ctype_b_loc())[((reason.value))] & _ISupper) ? "" : "The ", reason, plural ? "were" : "was");
    }
    if ((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
        if (blast) {
            shieldeff(game.u.ux, game.u.uy);
        }
        pline_The("poison doesn't seem to affect you.");
        return;
    }
    /* suppress killer prefix if it already has one */
    i = name_to_mon(pkiller, null);
    if (((i) >= LOW_PM && (i) < NUMMONS) && (game.mons[i].geno & 4096)) {
        /*[ does this need a plural check too? ]*/
        kprefix = 1;
        if (!(((game.mons[i]).mflags2 & 524288) != 0)) {
            pkiller = the(pkiller);
        }
    } else if (!strncmpi(pkiller, "the ", 4) || !strncmpi(pkiller, "an ", 3) || !strncmpi(pkiller, "a ", 2)) {
        kprefix = 1;
    }
    /*
     * FIXME:
     *  this operates on u.uhp[max] even when hero is polymorphed....
     */
    i = !fatal ? 1 : rn2(fatal + (thrown_weapon ? 20 : 0));
    if (i == 0 && typ != A_CHA) {
        /* sometimes survivable instant kill */
        loss = 6 + d(4, 6);
        if (game.u.uhp <= loss) {
            game.u.uhp = -1;
            game.disp.botl = (1);
            pline_The("poison was deadly...");
        } else {
            /* survived, but with severe reaction */
            let olduhp = game.u.uhp;
            let newuhpmax = game.u.uhpmax - (Math.trunc(loss / 2));
            setuhpmax(((newuhpmax) > (minuhpmax(3)) ? (newuhpmax) : (minuhpmax(3))), (1));
            loss = adjuhploss(loss, olduhp);
            losehp(loss, pkiller, kprefix);
            if (adjattrib(A_CON, (typ != A_CON) ? -1 : -3, (1))) {
                poisontell(A_CON, (1));
            }
            if (typ != A_CON && adjattrib(typ, -3, 1)) {
                poisontell(typ, (1));
            }
        }
    } else if (i > 5) {
        let cloud = !strcmp(reason, "gas cloud");
        /* HP damage; more likely--but less severe--with missiles */
        loss = thrown_weapon ? rnd(6) : (rn2(10) + (6));
        if ((blast || cloud) && (game.ublindf && game.ublindf.otyp == TOWEL && game.ublindf.spe > 0)) {
            loss = Math.trunc((loss + 1) / 2);
        }
        losehp(loss, pkiller, kprefix);
    } else {
        /* attribute loss; if typ is A_STR, reduction in current and
           maximum HP will occur once strength has dropped down to 3 */
        loss = (thrown_weapon || !fatal) ? 1 : d(2, 2);
        /* check that a stat change was made */
        if (adjattrib(typ, -loss, 1)) {
            poisontell(typ, (1));
        }
    }
    if (game.u.uhp < 1) {
        game.killer.format = kprefix;
        game.killer.name = strcpy(game.killer.name, pkiller);
        /* "Poisoned by a poisoned ___" is redundant */
        done(strstri(pkiller, "poison") ? DIED : POISONING);
    }
    encumber_msg();
}
export function change_luck(n) {
    game.u.uluck += n;
    if (game.u.uluck < 0 && game.u.uluck < (-10)) {
        game.u.uluck = (-10);
    }
    if (game.u.uluck > 0 && game.u.uluck > 10) {
        game.u.uluck = 10;
    }
}
/* decide whether there are more blessed luckstones (plus luck-conferring
   artifacts) than cursed ones; optionally combine uncursed with blessed */
export function stone_luck(include_uncursed) {
    let otmp = null;
    let bonchance = 0;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (confers_luck(otmp)) {
            if (otmp.cursed) {
                bonchance -= otmp.quan;
            } else if (otmp.blessed || include_uncursed) {
                bonchance += otmp.quan;
            }
        }
    }
    return sgn(bonchance);
}
/* there has just been an inventory change affecting a luck-granting item */
export function set_moreluck() {
    let luckbon = stone_luck((1));
    if (!luckbon && !carrying(LUCKSTONE)) {
        game.u.moreluck = 0;
    } else if (luckbon >= 0) {
        game.u.moreluck = 3;
    } else {
        game.u.moreluck = -3;
    }
}
/* (not used) */
export function restore_attrib() {
    let i = 0;
    let equilibrium = 0;
    ;
    for (i = 0; i < A_MAX; i++) {
        /*
     * Note:  this used to get called by moveloop() on every turn but
     * ATIME() is never set to non-zero anywhere so didn't do anything.
     * Presumably it once supported something like potion of heroism
     * which conferred temporary characteristics boost(s).
     *
     * ATEMP() is used for strength loss from hunger, which doesn't
     * time out, and for dexterity loss from wounded legs, which has
     * its own timeout routine.
     */
        /* all temporary losses/gains */
        equilibrium = ((i == A_STR && game.u.uhs >= WEAK) || (i == A_DEX && (game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic))) ? -1 : 0;
        if ((game.u.atemp.a[i]) != equilibrium && (game.u.atime.a[i]) != 0) {
            if (!(--((game.u.atime.a[i])))) {
                (game.u.atemp.a[i]) += ((game.u.atemp.a[i]) > 0) ? -1 : 1;
                game.disp.botl = (1);
                if ((game.u.atemp.a[i])) {
                    (game.u.atime.a[i]) = Math.trunc(100 / (acurr(A_CON)));
                }
            }
        }
    }
    if (game.disp.botl) {
        encumber_msg();
    }
}
/* tune value for exercise gains */
export function exercise(i, inc_or_dec) {
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("Exercise:");
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    if (i == A_INT || i == A_CHA) {
        return;
    }
    /* no physical exercise while polymorphed; the body's temporary */
    if ((game.u.umonnum != game.u.umonster) && i != A_WIS) {
        return;
    }
    if (abs((game.u.aexe.a[i])) < 50) {
        (game.u.aexe.a[i]) += (inc_or_dec) ? (rn2(19) > (acurr(i))) : -rn2(2);
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("%s, %s AEXE = %d", (i == A_STR) ? "Str" : (i == A_WIS) ? "Wis" : (i == A_DEX) ? "Dex" : "Con", (inc_or_dec) ? "inc" : "dec", (game.u.aexe.a[i]));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
    if (game.moves > 0 && (i == A_STR || i == A_CON)) {
        encumber_msg();
    }
}
export function exerper() {
    if (!(game.moves % 10)) {
        let hs = (game.u.uhunger > 1000) ? SATIATED : (game.u.uhunger > 150) ? NOT_HUNGRY : (game.u.uhunger > 50) ? HUNGRY : (game.u.uhunger > 0) ? WEAK : FAINTING;
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("exerper: Hunger checks");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        switch (hs) {
            case SATIATED:
                exercise(A_DEX, (0));
                if ((game.urole.mnum == (PM_MONK))) {
                    exercise(A_WIS, (0));
                }
                break;
            case NOT_HUNGRY:
                exercise(A_CON, (1));
                break;
            case WEAK:
                exercise(A_STR, (0));
                if ((game.urole.mnum == (PM_MONK))) {
                    exercise(A_WIS, (1));
                }
                break;
            case FAINTING:
            case FAINTED:
                exercise(A_CON, (0));
                break;
        }
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("exerper: Encumber checks");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        switch (near_capacity()) {
            case MOD_ENCUMBER:
                exercise(A_STR, (1));
                break;
            case HVY_ENCUMBER:
                exercise(A_STR, (1));
                exercise(A_DEX, (0));
                break;
            case EXT_ENCUMBER:
                exercise(A_DEX, (0));
                exercise(A_CON, (0));
                break;
        }
    }
    if (!(game.moves % 5)) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("exerper: Status checks");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        if ((game.u.uprops[CLAIRVOYANT].intrinsic & ((67108864 | 33554432 | 16777216) | 16777215)) && !game.u.uprops[CLAIRVOYANT].blocked) {
            exercise(A_WIS, (1));
        }
        if (game.u.uprops[REGENERATION].intrinsic) {
            exercise(A_STR, (1));
        }
        if (game.u.uprops[SICK].intrinsic || game.u.uprops[VOMITING].intrinsic) {
            exercise(A_CON, (0));
        }
        if (game.u.uprops[CONFUSION].intrinsic || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            exercise(A_WIS, (0));
        }
        if (((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) && !game.u.usteed) || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || game.u.uprops[STUNNED].intrinsic) {
            exercise(A_DEX, (0));
        }
    }
}
/* exercise/abuse text (must be in attribute order, not botl order);
   phrased as "You must have been [][0]." or "You haven't been [][1]." */
const exertext = [["exercising diligently", "exercising properly"], [null, null], ["very observant", "paying attention"], ["working on your reflexes", "working on reflexes lately"], ["leading a healthy life-style", "watching your health"], [null, null]];
/* Str */
/* Int */
/* Wis */
/* Dex */
/* Con */
/* Cha */
export function exerchk() {
    let i = 0;
    let ax = 0;
    let mod_val = 0;
    let lolim = 0;
    let hilim = 0;
    /*  Check out the periodic accumulations */
    exerper();
    if (game.moves >= game.context.next_attrib_check) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("exerchk: ready to test. multi = %ld.", game.multi);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
    if (game.moves >= game.context.next_attrib_check && !game.multi) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("exerchk: testing.");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        for (i = 0; i < A_MAX; ++i) {
            nextattrib: {
                /*  Are we ready for a test? */
                /*
         *      Law of diminishing returns (Part II):
         *
         *      The effects of "exercise" and "abuse" wear
         *      off over time.  Even if you *don't* get an
         *      increase/decrease, you lose some of the
         *      accumulated effects.
         */
                ax = (game.u.aexe.a[i]);
                /* nothing to do here if no exercise or abuse has occurred
               (Int and Cha always fall into this category) */
                if (!ax) {
                    continue;
                }
                mod_val = sgn(ax);
                /* no further effect for exercise if at max or abuse if at min;
               can't exceed 18 via exercise even if actual max is higher */
                /* usually 3; might be higher */
                lolim = (game.urace.attrmin[i]);
                /* usually 18; maybe lower or higher */
                hilim = ((i == A_STR && (game.u.umonnum != game.u.umonster)) ? uasmon_maxStr() : game.urace.attrmax[i]);
                if (hilim > 18) {
                    hilim = 18;
                }
                if ((ax < 0) ? ((game.u.acurr.a[i]) <= lolim) : ((game.u.acurr.a[i]) >= hilim)) {
                    break nextattrib;
                }
                /* can't exercise non-Wisdom while polymorphed; previous
               exercise/abuse gradually wears off without impact then */
                if ((game.u.umonnum != game.u.umonster) && i != A_WIS) {
                    break nextattrib;
                }
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        pline("exerchk: testing %s (%d).", (i == A_STR) ? "Str" : (i == A_INT) ? "Int?" : (i == A_WIS) ? "Wis" : (i == A_DEX) ? "Dex" : (i == A_CON) ? "Con" : (i == A_CHA) ? "Cha?" : "???", ax);
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                /*
             *  Law of diminishing returns (Part III):
             *
             *  You don't *always* gain by exercising.
             *  [MRS 92/10/28 - Treat Wisdom specially for balance.]
             */
                if (rn2(50) > ((i != A_WIS) ? (Math.trunc(abs(ax) * 2 / 3)) : abs(ax))) {
                    break nextattrib;
                }
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        pline("exerchk: changing %d.", i);
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                if (adjattrib(i, mod_val, -1)) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("exerchk: changed %d.", i);
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                    (game.u.aexe.a[i]) = ax = 0;
                    /* if you actually changed an attrib - zero accumulation */
                    /* then print an explanation */
                    You("%s %s.", (mod_val > 0) ? "must have been" : "haven't been", exertext[i][(mod_val > 0) ? 0 : 1]);
                }
            }
            (game.u.aexe.a[i]) = (Math.trunc(abs(ax) / 2)) * mod_val;
        }
        game.context.next_attrib_check += (rn2(200) + (800));
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/attrib.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("exerchk: next check at %ld.", game.context.next_attrib_check);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
}
/* return random hero attribute (by role's attr distribution).
   returns A_MAX if failed. */
export function rnd_attr() {
    let i = 0;
    let x = rn2(100);
    /* 5.0: the x -= ... calculation used to have an off by 1 error that
       resulted in the values being biased toward Str and away from Cha */
    for (i = 0; i < A_MAX; ++i) {
        if ((x -= game.urole.attrdist[i]) < 0) {
            break;
        }
    }
    return i;
}
/* add or subtract np points from random attributes,
   adjusting the base and maximum values of the attributes.
   if subtracting, np must be negative.
   returns the left over points. */
export function init_attr_role_redist(np, addition) {
    let tryct = 0;
    let adj = addition ? 1 : -1;
    while ((addition ? (np > 0) : (np < 0)) && tryct < 100) {
        let i = rnd_attr();
        if (i >= A_MAX || (addition ? ((game.u.acurr.a[i]) >= ((i == A_STR && (game.u.umonnum != game.u.umonster)) ? uasmon_maxStr() : game.urace.attrmax[i])) : ((game.u.acurr.a[i]) <= (game.urace.attrmin[i])))) {
            tryct++;
            continue;
        }
        tryct = 0;
        (game.u.acurr.a[i]) += adj;
        (game.u.amax.a[i]) += adj;
        np -= adj;
    }
    return np;
}
/* allocate hero's initial characteristics */
export function init_attr(np) {
    let i = 0;
    for (i = 0; i < A_MAX; i++) {
        (game.u.acurr.a[i]) = (game.u.amax.a[i]) = game.urole.attrbase[i];
        (game.u.atemp.a[i]) = (game.u.atime.a[i]) = 0;
        np -= game.urole.attrbase[i];
    }
    /* distribute leftover points */
    np = init_attr_role_redist(np, (1));
    /* if we went over, remove points */
    np = init_attr_role_redist(np, (0));
}
export function redist_attr() {
    let i = 0;
    let tmp = 0;
    /* encumber_msg(); -- caller needs to do this */
    for (i = 0; i < A_MAX; i++) {
        if (i == A_INT || i == A_WIS) {
            continue;
        }
        /* Polymorphing doesn't change your mind */
        tmp = (game.u.amax.a[i]);
        (game.u.amax.a[i]) += (rn2(5) - 2);
        if ((game.u.amax.a[i]) > ((i == A_STR && (game.u.umonnum != game.u.umonster)) ? uasmon_maxStr() : game.urace.attrmax[i])) {
            (game.u.amax.a[i]) = ((i == A_STR && (game.u.umonnum != game.u.umonster)) ? uasmon_maxStr() : game.urace.attrmax[i]);
        }
        if ((game.u.amax.a[i]) < (game.urace.attrmin[i])) {
            (game.u.amax.a[i]) = (game.urace.attrmin[i]);
        }
        (game.u.acurr.a[i]) = Math.trunc((game.u.acurr.a[i]) * (game.u.amax.a[i]) / tmp);
        /* ABASE(i) > ATTRMAX(i) is impossible */
        if ((game.u.acurr.a[i]) < (game.urace.attrmin[i])) {
            (game.u.acurr.a[i]) = (game.urace.attrmin[i]);
        }
    }
}
/* apply minor variation to attributes */
export function vary_init_attr() {
    let i = 0;
    for (i = 0; i < A_MAX; i++) {
        if (!rn2(20)) {
            let xd = rn2(7) - 2;
            adjattrib(i, xd, (1));
            if ((game.u.acurr.a[i]) < (game.u.amax.a[i])) {
                (game.u.amax.a[i]) = (game.u.acurr.a[i]);
            }
        }
    }
}
export function postadjabil(slot) {
    /* initializing hero; don't attempt screen update yet */
    if (!game.u.ulevel) {
        return;
    }
    if (slot === game.u.uprops[WARNING] || slot === game.u.uprops[SEE_INVIS]) {
        see_monsters();
    }
}
export function role_abil(r) {
    let roleabils = [{ role: PM_ARCHEOLOGIST, abil: arc_abil }, { role: PM_BARBARIAN, abil: bar_abil }, { role: PM_CAVE_DWELLER, abil: cav_abil }, { role: PM_HEALER, abil: hea_abil }, { role: PM_KNIGHT, abil: kni_abil }, { role: PM_MONK, abil: mon_abil }, { role: PM_CLERIC, abil: pri_abil }, { role: PM_RANGER, abil: ran_abil }, { role: PM_ROGUE, abil: rog_abil }, { role: PM_SAMURAI, abil: sam_abil }, { role: PM_TOURIST, abil: tou_abil }, { role: PM_VALKYRIE, abil: val_abil }, { role: PM_WIZARD, abil: wiz_abil }, { role: 0, abil: null }];
    let i = 0;
    for (i = 0; roleabils[i].abil && roleabils[i].role != r; i++) {
        continue;
    }
    return roleabils[i].abil;
}
export function check_innate_abil(ability, frommask) {
    let abil = null;
    if (frommask == 16777216) {
        abil = role_abil((game.urole.mnum));
    } else if (frommask == 33554432) {
        switch ((game.urace.mnum)) {
            case PM_DWARF:
                abil = dwa_abil;
                break;
            case PM_ELF:
                abil = elf_abil;
                break;
            case PM_GNOME:
                abil = gno_abil;
                break;
            case PM_ORC:
                abil = orc_abil;
                break;
            case PM_HUMAN:
                abil = hum_abil;
                break;
            default:
                break;
        }
    }
    const __nhi_abil_arr = abil;
    for (let __nhi_abil = 0; (abil = __nhi_abil_arr[__nhi_abil]) && (abil && abil.ability); __nhi_abil++) {
        if ((abil.ability() === ability) && (game.u.ulevel >= abil.ulevel)) {
            return abil;
        }
    }
    return null;
}
/* reasons for innate ability */
/* from experience at level 1 */
/* intrinsically (eating some corpse or prayer reward) */
/* from experience for some level > 1 */
/* check whether particular ability has been obtained via innate attribute */
export function innately(ability) {
    let iptr = null;
    if ((iptr = check_innate_abil(ability, 16777216)) != null) {
        return (iptr.ulevel == 1) ? 1 : 4;
    }
    if ((iptr = check_innate_abil(ability, 33554432)) != null) {
        return 2;
    }
    if ((ability.value & 67108864) != 0) {
        return 3;
    }
    if ((ability.value & 268435456) != 0) {
        return 5;
    }
    return 0;
}
export function is_innate(propidx) {
    let innateness = 0;
    /* innately() would report FROM_FORM for this; caller wants specificity */
    if (propidx == DRAIN_RES && ((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS)) {
        return 6;
    }
    if (propidx == FAST && ((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic)) {
        return 0;
    }
    /* can't become very fast innately */
    if ((innateness = innately({ get value() { return game.u.uprops[propidx].intrinsic; }, set value(_v) { game.u.uprops[propidx].intrinsic = _v; } })) != 0) {
        return innateness;
    }
    if (propidx == JUMPING && (game.urole.mnum == (PM_KNIGHT)) && !game.u.uprops[propidx].extrinsic) {
        return 1;
    }
    /* knight has intrinsic jumping, but extrinsic is more versatile so
           ignore innateness if equipment is going to claim responsibility */
    if ((propidx == BLINDED && !(((game.youmonst.data).mflags1 & 4096) == 0)) || (propidx == BLND_RES && (game.u.uprops[BLND_RES].intrinsic & 268435456) != 0)) {
        return 5;
    }
    return 0;
}
/* special cases can have negative values */
let __from_what_buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const __from_what_because_of = " because of %s";
export function from_what(propidx) {
    __from_what_buf[0] = 0;
    if (game.flags.debug) {
        if (propidx >= 0) {
            /*
     * Restrict the source of the attributes just to debug mode for now
     */
            let p = null;
            let obj = null;
            let innateness = is_innate(propidx);
            /*
             * Properties can be obtained from multiple sources and we
             * try to pick the most significant one.  Classification
             * priority is not set in stone; current precedence is:
             * "from the start" (from role or race at level 1),
             * "from outside" (eating corpse, divine reward, blessed potion),
             * "from experience" (from role or race at level 2+),
             * "from current form" (while polymorphed),
             * "from timed effect" (potion or spell),
             * "from worn/wielded equipment" (Firebrand, elven boots, &c),
             * "from carried equipment" (mainly quest artifacts).
             * There are exceptions.  Versatile jumping from spell or boots
             * takes priority over knight's innate but limited jumping.
             */
            if ((propidx == BLINDED && game.u.uroleplay.blind) || (propidx == DEAF && game.u.uroleplay.deaf)) {
                __from_what_buf = sprintf(__from_what_buf, " from birth");
            } else if (innateness == 1 || innateness == 2) {
                __from_what_buf = strcpy(__from_what_buf, " innately");
            } else if (innateness == 3) {
                __from_what_buf = strcpy(__from_what_buf, " intrinsically");
            } else if (innateness == 4) {
                __from_what_buf = strcpy(__from_what_buf, " because of your experience");
            } else if (innateness == 6) {
                __from_what_buf = strcpy(__from_what_buf, " due to your lycanthropy");
            } else if (innateness == 5) {
                __from_what_buf = strcpy(__from_what_buf, " from your creature form");
            } else if (propidx == FAST && ((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic)) {
                __from_what_buf = sprintf(__from_what_buf, __from_what_because_of, ((game.u.uprops[FAST].intrinsic & 16777215) != 0) ? "a potion or spell" : ((game.u.uprops[FAST].extrinsic & 32) != 0 && game.uarmf.dknown && game.objects[game.uarmf.otyp].oc_name_known) ? ysimple_name(game.uarmf) : game.u.uprops[FAST].extrinsic ? "worn equipment" : c_common_strings.c_something);
            } else if (game.flags.debug && (obj = what_gives({ get value() { return game.u.uprops[propidx].extrinsic; }, set value(_v) { game.u.uprops[propidx].extrinsic = _v; } })) != null) {
                __from_what_buf = sprintf(__from_what_buf, __from_what_because_of, obj.oartifact ? bare_artifactname(obj) : ysimple_name(obj));
            } else if (propidx == BLINDED && (game.u.uprops[BLINDED].extrinsic && !(game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked))) {
                __from_what_buf = sprintf(__from_what_buf, __from_what_because_of, ysimple_name(game.ublindf));
            } else if (propidx == BLINDED && game.u.ucreamed && (game.u.uprops[BLINDED].intrinsic & 16777215) == game.u.ucreamed && !game.u.uprops[BLINDED].extrinsic && !(game.u.uprops[BLINDED].intrinsic & ~16777215)) {
                __from_what_buf = sprintf(__from_what_buf, "due to goop covering your %s", body_part(FACE));
            }
            /* remove some verbosity and/or redundancy */
            if ((p = strstri(__from_what_buf, " pair of ")) != null) {
                copynchars(p + 1, p + 9, 256);
            } else if (propidx == STRANGLED && (p = strstri(__from_what_buf, " of strangulation")) != null) {
                __from_what_buf = nh_strchr_truncate(__from_what_buf, " of strangulation", 'stri');
            }
        } else {
            switch (-propidx) {
                /* if more blocking capabilities get implemented we'll need to
               replace this with what_blocks() comparable to what_gives() */
                case BLINDED:
                    if (game.u.uprops[BLINDED].blocked && is_art(game.ublindf, ART_EYES_OF_THE_OVERWORLD)) {
                        __from_what_buf = sprintf(__from_what_buf, __from_what_because_of, bare_artifactname(game.ublindf));
                    }
                    break;
                case INVIS:
                    if (game.u.uprops[INVIS].blocked & 2) {
                        __from_what_buf = sprintf(__from_what_buf, __from_what_because_of, ysimple_name(game.uarmc));
                    }
                    break;
                case CLAIRVOYANT:
                    if (game.flags.debug && (game.u.uprops[CLAIRVOYANT].blocked & 4)) {
                        __from_what_buf = sprintf(__from_what_buf, __from_what_because_of, ysimple_name(game.uarmh));
                    }
                    break;
            }
        }
    }
    return __from_what_buf;
}
export function adjabil(oldlevel, newlevel) {
    let prevabil = 0;
    let mask = 16777216;
    let abilArr = role_abil((game.urole.mnum));
    let rabilArr = null;
    switch ((game.urace.mnum)) {
        case PM_ELF:
            rabilArr = elf_abil;
            break;
        case PM_ORC:
            rabilArr = orc_abil;
            break;
        case PM_HUMAN:
        case PM_DWARF:
        case PM_GNOME:
        default:
            rabilArr = null;
            break;
    }
    let abilIdx = 0;
    while (true) {
        let entry = abilArr ? abilArr[abilIdx] : null;
        if (!entry || !entry.ability) {
            if (!rabilArr) break;
            abilArr = rabilArr;
            rabilArr = null;
            abilIdx = 0;
            mask = 33554432;
            entry = abilArr[abilIdx];
            if (!entry || !entry.ability) break;
        }
        const slot = entry.ability();
        prevabil = slot.intrinsic;
        if (oldlevel < entry.ulevel && newlevel >= entry.ulevel) {
            if (entry.ulevel == 1) {
                slot.intrinsic |= (mask | 67108864);
            } else {
                slot.intrinsic |= mask;
            }
            if (!(slot.intrinsic & (67108864 | 33554432 | 16777216) & ~mask)) {
                if (entry.gainstr) {
                    You_feel("%s!", entry.gainstr);
                }
            }
        } else if (oldlevel >= entry.ulevel && newlevel < entry.ulevel) {
            slot.intrinsic &= ~mask;
            if (!(slot.intrinsic & (67108864 | 33554432 | 16777216))) {
                if (entry.losestr) {
                    You_feel("%s!", entry.losestr);
                } else if (entry.gainstr) {
                    You_feel("less %s!", entry.gainstr);
                }
            }
        }
        if (prevabil != slot.intrinsic) {
            postadjabil(slot);
        }
        abilIdx++;
    }
    if (oldlevel > 0) {
        if (newlevel > oldlevel) {
            add_weapon_skill(newlevel - oldlevel);
        } else {
            lose_weapon_skill(oldlevel - newlevel);
        }
    }
}
/* called when gaining a level (before u.ulevel gets incremented);
   also called with u.ulevel==0 during hero initialization or for
   re-init if hero turns into a "new man/woman/elf/&c" */
export function newhp() {
    let hp = 0;
    let conplus = 0;
    if (game.u.ulevel == 0) {
        hp = game.urole.hpadv.infix + game.urace.hpadv.infix;
        if (game.urole.hpadv.inrnd > 0) {
            hp += rnd(game.urole.hpadv.inrnd);
        }
        if (game.urace.hpadv.inrnd > 0) {
            hp += rnd(game.urace.hpadv.inrnd);
        }
        if (game.moves == 0) {
            /* initial hero; skip for polyself to new man */
            /* Initialize alignment stuff */
            game.u.ualign.type = aligns[game.flags.initalign].value;
            game.u.ualign.record = game.urole.initrecord;
        }
    } else {
        if (game.u.ulevel < game.urole.xlev) {
            hp = game.urole.hpadv.lofix + game.urace.hpadv.lofix;
            if (game.urole.hpadv.lornd > 0) {
                hp += rnd(game.urole.hpadv.lornd);
            }
            if (game.urace.hpadv.lornd > 0) {
                hp += rnd(game.urace.hpadv.lornd);
            }
        } else {
            hp = game.urole.hpadv.hifix + game.urace.hpadv.hifix;
            if (game.urole.hpadv.hirnd > 0) {
                hp += rnd(game.urole.hpadv.hirnd);
            }
            if (game.urace.hpadv.hirnd > 0) {
                hp += rnd(game.urace.hpadv.hirnd);
            }
        }
        if ((acurr(A_CON)) <= 3) {
            conplus = -2;
        } else if ((acurr(A_CON)) <= 6) {
            conplus = -1;
        } else if ((acurr(A_CON)) <= 14) {
            conplus = 0;
        } else if ((acurr(A_CON)) <= 16) {
            conplus = 1;
        } else if ((acurr(A_CON)) == 17) {
            conplus = 2;
        } else if ((acurr(A_CON)) == 18) {
            conplus = 3;
        } else {
            conplus = 4;
        }
        hp += conplus;
    }
    if (hp <= 0) {
        hp = 1;
    }
    if (game.u.ulevel < 30) {
        /* remember increment; future level drain could take it away again */
        game.u.uhpinc[game.u.ulevel] = hp;
    } else {
        /* after level 30, throttle hit point gains from extra experience;
           once max reaches 1200, further increments will be just 1 more */
        let lim = 5 - Math.trunc(game.u.uhpmax / 300);
        lim = ((lim) > (1) ? (lim) : (1));
        if (hp > lim) {
            hp = lim;
        }
    }
    return hp;
}
/* minimum value for uhpmax is ulevel but for life-saving it is always at
   least 10 if ulevel is less than that */
export function minuhpmax(altmin) {
    if (altmin < 1) {
        altmin = 1;
    }
    return ((game.u.ulevel) > (altmin) ? (game.u.ulevel) : (altmin));
}
/* update u.uhpmax or u.mhmax and values of other things that depend upon
   whichever of them is relevant */
export function setuhpmax(newmax, even_when_polyd) {
    if (!(game.u.umonnum != game.u.umonster) || even_when_polyd) {
        if (newmax != game.u.uhpmax) {
            game.u.uhpmax = newmax;
            if (game.u.uhpmax > game.u.uhppeak) {
                game.u.uhppeak = game.u.uhpmax;
            }
            game.disp.botl = (1);
        }
        if (game.u.uhp > game.u.uhpmax) {
            game.u.uhp = game.u.uhpmax , game.disp.botl = (1);
        }
    } else {
        if (newmax != game.u.mhmax) {
            game.u.mhmax = newmax;
            game.disp.botl = (1);
        }
        if (game.u.mh > game.u.mhmax) {
            game.u.mh = game.u.mhmax , game.disp.botl = (1);
        }
    }
}
/* called after setuhpmax() when damage is pending;
   if uhpmax (or mhmax) has been reduced, it might have caused uhp (or mh)
   to be reduced too; if so, recalculate pending loss to account for that */
/* pending hp loss */
/* does double duty as oldmh when Upolyd */
export function adjuhploss(loss, olduhp) {
    if (!(game.u.umonnum != game.u.umonster)) {
        if (game.u.uhp < olduhp) {
            loss -= (olduhp - game.u.uhp);
        }
    } else {
        if (game.u.mh < olduhp) {
            loss -= (olduhp - game.u.mh);
        }
    }
    return ((loss) > (1) ? (loss) : (1));
}
/* return the current effective value of a specific characteristic
   (the 'a' in 'acurr()' comes from outdated use of "attribute" for the
   six Str/Dex/&c characteristics; likewise for u.abon, u.atemp, u.acurr) */
export function acurr(chridx) {
    /* 'result' will always be reset to positive value */
    let tmp = 0;
    let result = 0;
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    tmp = game.u.abon.a[chridx] + game.u.atemp.a[chridx] + game.u.acurr.a[chridx];
    if (chridx == A_STR) {
        if (tmp >= (100 + (25)) || (game.uarmg && game.uarmg.otyp == GAUNTLETS_OF_POWER)) {
            result = (100 + (25));
        /* for Strength:  3 <= result <= 125;
       for all others:  3 <= result <= 25 */
        /* strength value is encoded:  3..18 normal, 19..118 for 18/xx (with
           1 <= xx <= 100), and 119..125 for other characteristics' 19..25;
           STR18(x) yields 18 + x (intended for 0 <= x <= 100; not used here);
           STR19(y) yields 100 + y (intended for 19 <= y <= 25) */
        /* need non-zero here to avoid 'if(result==0)' below because
               that doesn't deal with Str encoding; the cap of 25 applied
               there would limit Str to 18/07 [18 + 7] */
        } else {
            result = ((tmp) > (3) ? (tmp) : (3));
        }
    } else if (chridx == A_CHA) {
        if (tmp < 18 && (game.youmonst.data.mlet == S_NYMPH || game.u.umonnum == PM_AMOROUS_DEMON)) {
            result = 18;
        }
    } else if (chridx == A_CON) {
        if (is_art(game.uwep, ART_OGRESMASHER)) {
            result = 25;
        }
    } else if (chridx == A_INT || chridx == A_WIS) {
        /* Yes, this may raise Int and/or Wis if hero is sufficiently
           stupid.  There are lower levels of cognition than "dunce". */
        /* this exception is hypothetical; the only other worn item affecting
       Int or Wis is another helmet so can't be in use at the same time */
        if (game.uarmh && game.uarmh.otyp == DUNCE_CAP) {
            result = 6;
        }
    } else if (chridx == A_DEX) {
        ;
    }
    /* none of the special cases applied */
    if (result == 0) {
        result = (tmp >= 25) ? 25 : (tmp <= 3) ? 3 : tmp;
    }
    return result;
}
/* condense clumsy ACURR(A_STR) value into value that fits into formulas */
export function acurrstr() {
    /* 3..125 after massaging by acurr() */
    let str = (acurr(A_STR));
    let result = 0;
    if (str <= (18 + (0))) {
        result = ((str) > (3) ? (str) : (3));
    } else if (str <= (100 + (21))) {
        result = 19 + Math.trunc(str / 50);
    /* <= 18; max(,3) here is redundant */
    /* this converts
           18/01..18/31 into 19,
           18/32..18/81 into 20,
           18/82..18/100 and 19..21 into 21 */
    /* convert 122..125; min(,125) here is redundant */
    } else {
        result = ((str) < (125) ? (str) : (125)) - 100;
    }
    return result;
}
/* when wearing (or taking off) an unID'd item, this routine is used
   to distinguish between observable +0 result and no-visible-effect
   due to an attribute not being able to exceed maximum or minimum */
/* does attrindx's value match its max or min? */
export function extremeattr(attrindx) {
    /* Fixed_abil and racial MINATTR/MAXATTR aren't relevant here */
    let lolimit = 3;
    let hilimit = 25;
    let curval = (acurr(attrindx));
    if (attrindx == A_STR) {
        /* upper limit for Str is 25 but its value is encoded differently */
        hilimit = (100 + (25));
        /* lower limit for Str can also be 25 */
        if (game.uarmg && game.uarmg.otyp == GAUNTLETS_OF_POWER) {
            lolimit = hilimit;
        }
    } else if (attrindx == A_CON) {
        if (is_art(game.uwep, ART_OGRESMASHER)) {
            lolimit = hilimit;
        }
    }
    if (attrindx == A_INT || attrindx == A_WIS) {
        if (game.uarmh && game.uarmh.otyp == DUNCE_CAP) {
            hilimit = lolimit = 6;
        }
    }
    /* are we currently at either limit? */
    return (curval == lolimit || curval == hilimit) ? (1) : (0);
}
/* avoid possible problems with alignment overflow, and provide a centralized
   location for any future alignment limits */
export function adjalign(n) {
    let newalign = game.u.ualign.record + n;
    if (n < 0) {
        let newabuse = game.u.ualign.abuse - n;
        if (newalign < game.u.ualign.record) {
            game.u.ualign.record = newalign;
        }
        if (newabuse > game.u.ualign.abuse) {
            game.u.ualign.abuse = newabuse;
            adj_erinys(newabuse);
        }
    } else if (newalign > game.u.ualign.record) {
        game.u.ualign.record = newalign;
        if (game.u.ualign.record > (10 + (Math.trunc(game.moves / 200)))) {
            game.u.ualign.record = (10 + (Math.trunc(game.moves / 200)));
        }
    }
}
/* change hero's alignment type, possibly losing use of artifacts */
/* A_CG_CONVERT, A_CG_HELM_ON, or A_CG_HELM_OFF */
export function uchangealign(newalign, reason) {
    let oldalign = game.u.ualign.type;
    game.u.ublessed = 0;
    game.disp.botl = (1);
    if (reason == A_CG_CONVERT) {
        livelog_printf(512, "permanently converted to %s", aligns[1 - newalign].adj);
        game.u.ualignbase[0] = newalign;
        /* worn helm of opposite alignment might block change */
        if (!game.uarmh || game.uarmh.otyp != HELM_OF_OPPOSITE_ALIGNMENT) {
            game.u.ualign.type = game.u.ualignbase[0];
        }
        You("have a %ssense of a new direction.", (game.u.ualign.type != oldalign) ? "sudden " : "");
    } else {
        /* putting on or taking off a helm of opposite alignment */
        game.u.ualign.type = newalign;
        if (reason == A_CG_HELM_ON) {
            /* for abuse -- record will be cleared shortly */
            adjalign(-7);
            Your("mind oscillates %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "wildly" : "briefly");
            make_confused((rn2(2) + (3)), (0));
            if ((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) || (rn2(50) < game.u.ualign.abuse)) {
                summon_furies((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) ? 0 : 1);
            }
            /* don't livelog taking it back off */
            livelog_printf(512, "used a helm to turn %s", aligns[1 - newalign].adj);
        } else if (reason == A_CG_HELM_OFF) {
            Your("mind is %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "much of a muchness" : "back in sync with your body");
        }
    }
    if (game.u.ualign.type != oldalign) {
        game.u.ualign.record = 0;
        retouch_equipment(0);
    }
}
/*attrib.c*/
/*
         *      Law of diminishing returns (Part I):
         *
         *      Gain is harder at higher attribute values.
         *      79% at "3" --> 0% at "18"
         *      Loss is even at all levels (50%).
         *
         *      Note: *YES* ACURR is the right one to use.
         */
/* this used to be ``AEXE(i) /= 2'' but that would produce
               platform-dependent rounding/truncation for negative vals */
/* wearing the Eyes of the Overworld overrides blindness */
/* [].intrinsic & FROMOUTSIDE */
/* Have we finished with the intrinsics list? */
/* Abilities gained at level 1 can never be lost
             * via level loss, only via means that remove _any_
             * sort of ability.  A "gain" of such an ability from
             * an outside source is devoid of meaning, so we set
             * FROMOUTSIDE to avoid such gains.
             */
/* no Con adjustment for initial hit points */
/* there aren't any special cases for dexterity */
