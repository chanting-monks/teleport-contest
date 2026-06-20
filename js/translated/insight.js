/* NetHack 5.0	insight.c	$NHDT-Date: 1777004419 2026/04/23 20:20:19 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.134 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * Enlightenment and Conduct+Achievements and Vanquished+Extinct+Geno'd
 * and stethoscope/probing feedback.
 *
 * Most code used to reside in cmd.c, presumably because ^X was originally
 * a wizard mode command and the majority of those are in that file.
 * Some came from end.c where it is used during end of game disclosure.
 * And some came from priest.c that had once been in pline.c.
 */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { free, memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, pline } from '../c2js-runtime/pline.js';
import { qsort , qsort_async } from '../c2js-runtime/qsort.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, strcat, strchr, strcmp, strcpy, strlen, strncmp, strncmpi, strstri } from '../c2js-runtime/string.js';
import { timet_delta } from './allmain.js';
import { is_art } from './artifact.js';
import { acurr, from_what, stone_luck } from './attrib.js';
import { enc_stat, rank_of, rank_to_xlev } from './botl.js';
import { getnow, midnight, night } from './calendar.js';
import { yn_function } from './cmd.js';
import { is_lava, is_pool, is_pool_or_lava } from './dbridge.js';
import { c_common_strings, cg, ynaqchars, ynqchars } from './decl.js';
import { nul_glyphinfo } from './display.js';
import { a_monnam, hliquid, pmname, x_monnam } from './do_name.js';
import { find_ac, fingers_or_gloves, stuck_ring } from './do_wear.js';
import { def_monsyms } from './drawing.js';
import { In_quest, ceiling, depth, dunlev, endgamelevelname, has_ceiling, on_level, surface } from './dungeon.js';
import { hu_stat, temp_resist } from './eat.js';
import { newuexp } from './exper.js';
import { dxdy_to_dist_descr } from './getpos.js';
import { inv_weight, money_cnt, near_capacity } from './hack.js';
import { digit, eos, lcase, mungspaces, ordin, s_suffix, strsubst, upstart } from './hacklib.js';
import { carrying, currency } from './invent.js';
import { magic_negation } from './mhitu.js';
import { defended, dmgtype, dmgtype_fromattack, hates_silver, sticks } from './mondata.js';
import { ACH_AMUL, ACH_ASTR, ACH_BELL, ACH_BGRM, ACH_BLND, ACH_BOOK, ACH_CNDL, ACH_ENDG, ACH_HELL, ACH_INVK, ACH_MEDU, ACH_MINE, ACH_MINE_PRIZE, ACH_NOVL, ACH_NUDE, ACH_ORCL, ACH_RNK1, ACH_RNK2, ACH_RNK3, ACH_RNK4, ACH_RNK5, ACH_RNK6, ACH_RNK7, ACH_RNK8, ACH_SHOP, ACH_SOKO, ACH_SOKO_PRIZE, ACH_TMPL, ACH_TOWN, ACH_TUNE, ACH_UWIN, ACID_RES, ADORNED, AGGRAVATE_MONSTER, AMULET_OF_GUARDING, ANTIMAGIC, ART_OGRESMASHER, A_CHA, A_CON, A_DEX, A_INT, A_STR, A_WIS, BLINDED, BLND_RES, CLAIRVOYANT, COLD_RES, CONFLICT, CONFUSION, DEAF, DETECT_MONSTERS, DISINT_RES, DISPLACED, DRAIN_RES, DUNCE_CAP, EXT_ENCUMBER, FAST, FEMALE, FIRE_RES, FIXED_ABIL, FLYING, FREE_ACTION, FUMBLING, GAUNTLETS_OF_POWER, GEM_CLASS, GLIB, HALF_PHDAM, HALF_SPDAM, HALLUC, HALLUC_RES, HANDED, HUNGER, HVY_ENCUMBER, INFRAVISION, INVIS, INVULNERABLE, IRON, JUMPING, LEG, LEVITATION, LIFESAVED, LOW_PM, LUCKSTONE, MAGICAL_BREATHING, MALE, MITHRIL, MOD_ENCUMBER, M_AP_FURNITURE, M_AP_MONSTER, M_AP_NOTHING, M_AP_OBJECT, NEUTRAL, NUMMONS, N_ACH, OVERLOADED, PASSES_WALLS, PM_DEATH, PM_FAMINE, PM_GREEN_SLIME, PM_HIGH_CLERIC, PM_LONG_WORM, PM_PESTILENCE, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, POISON_RES, POLYMORPH, POLYMORPH_CONTROL, PROTECTION, PROT_FROM_SHAPE_CHANGERS, P_BOW, P_CROSSBOW, P_ISRESTRICTED, P_NONE, P_SKILLED, P_TWO_WEAPON_COMBAT, P_UNSKILLED, REFLECTING, REGENERATION, RIN_ADORNMENT, RIN_PROTECTION, RIN_SUSTAIN_ABILITY, ROBE, SEARCHING, SEE_INVIS, SHIELD_OF_REFLECTION, SHOCK_RES, SICK, SICK_RES, SLEEPY, SLEEP_RES, SLIMED, SLOW_DIGESTION, SLT_ENCUMBER, SPIKED_PIT, STEALTH, STONED, STONE_RES, STRANGLED, STUNNED, SWIMMING, S_DEMON, S_EEL, S_GHOST, S_GOLEM, S_HUMAN, S_LIZARD, S_VAMPIRE, S_ZOMBIE, TELEPAT, TELEPORT, TELEPORT_CONTROL, TOWEL, TT_BURIEDBALL, TT_INFLOOR, TT_LAVA, TT_PIT, UNCHANGING, UNENCUMBERED, VANQ_ALPHA_MIX, VANQ_ALPHA_SEP, VANQ_COUNT_H_L, VANQ_COUNT_L_H, VANQ_MCLS_HTOL, VANQ_MCLS_LTOH, VANQ_MLVL_MNDX, VANQ_MSTR_MNDX, VOMITING, WARNING, WARN_OF_MON, WARN_UNDEAD, WEAPON_CLASS, WOUNDED_LEGS, WWALKING } from './nh-constants.js';
import { an, ansimpleoname, just_an, makeplural, reorder_fruit, shield_simple_name, simple_typename, simpleonames, suit_simple_name, the } from './objnam.js';
import { oc_to_str } from './options.js';
import { mhidden_description, waterbody_name } from './pager.js';
import { livelog_printf } from './pline.js';
import { body_part, mbodypart, uasmon_maxStr, udeadinside, ugenocided } from './polyself.js';
import { align_gname, can_pray, u_gname } from './pray.js';
import { mon_aligntyp } from './priest.js';
import { reg_damg, visible_region_at } from './region.js';
import { genders } from './role.js';
import { costly_spot } from './shk.js';
import { observable_depth } from './topten.js';
import { t_at, trapname } from './trap.js';
import { hidden_gold } from './vault.js';
import { can_advance, skill_level_name, skill_name, weapon_descr, weapon_type } from './weapon.js';
import { empty_handed } from './wield.js';
import { add_menu, add_menu_str, select_menu } from './windows.js';
import { count_wsegs, wseg_at } from './worm.js';
import { find_mac, which_armor } from './worn.js';
import { item_what, u_adtyp_resistance_obj } from './zap.js';

/* hunger status from eat.c */
/* encumbrance status from botl.c */
const You_ = "You ";
const are = "are ";
const were = "were ";
const have = "have ";
const had = "had ";
const can = "can ";
const could = "could ";
const have_been = "have been ";
const have_never = "have never ";
const never = "never ";
/* for livelogging: */
// struct ll_achieve_msg: { llflag, msg }
/* ordered per 'enum achievements' in you.h */
/* take care to keep them in sync! */
game.achieve_msg = [{ llflag: 0, msg: "" }, { llflag: 2, msg: "acquired the Bell of Opening" }, { llflag: 2, msg: "entered Gehennom" }, { llflag: 2, msg: "acquired the Candelabrum of Invocation" }, { llflag: 2, msg: "acquired the Book of the Dead" }, { llflag: 2, msg: "performed the invocation" }, { llflag: 2, msg: "acquired The Amulet of Yendor" }, { llflag: 2, msg: "entered the Elemental Planes" }, { llflag: 2, msg: "entered the Astral Plane" }, { llflag: 2, msg: "ascended" }, { llflag: 2 | 8192, msg: "acquired the Mines' End" }, { llflag: 2 | 8192, msg: "acquired the Sokoban" }, { llflag: 2 | 4, msg: "killed Medusa" }, { llflag: 0, msg: "hero was always blond, no, blind" }, { llflag: 0, msg: "hero never wore armor" }, { llflag: 4096 | 16384, msg: "entered the Gnomish Mines" }, { llflag: 2, msg: "reached Mine Town" }, { llflag: 4096, msg: "entered a shop" }, { llflag: 4096, msg: "entered a temple" }, { llflag: 2, msg: "consulted the Oracle" }, { llflag: 4096 | 16384, msg: "read a Discworld novel" }, { llflag: 2, msg: "entered Sokoban" }, { llflag: 2, msg: "entered the Bigroom" }, { llflag: 4096 | 16384, msg: "" }, { llflag: 4096 | 16384, msg: "" }, { llflag: 4096 | 16384, msg: "" }, { llflag: 2, msg: "" }, { llflag: 2, msg: "" }, { llflag: 2, msg: "" }, { llflag: 2, msg: "" }, { llflag: 2, msg: "" }, { llflag: 4096, msg: "learned castle drawbridge's tune" }, { llflag: 0, msg: "" }];
/* actual achievements are numbered from 1 */
/* if the type of item isn't discovered yet, disclosing the event
       via #chronicle would be a spoiler (particularly for gray stone);
       the ID'd name for the type of item will be appended to the next
       two messages, for display via livelog and/or dumplog */
/* " luckstone" */
/* " <item>" */
/* these two are not logged */
/* */
/* probably minor, but dnh logs it */
/* minor, but rare enough */
/* even more so */
/* keep as major for turn comparison
                                        * with completed sokoban */
/* The following 8 are for advancing through the ranks
       and messages differ by role so are created on the fly;
       rank 0 (Xp 1 and 2) isn't an achievement */
/* Xp 3 */
/* Xp 6 */
/* Xp 10 */
/* Xp 14, so able to attempt the quest */
/* Xp 18 */
/* Xp 22 */
/* Xp 26 */
/* Xp 30 */
/* achievement #31 */
/* keep this one at the end */
/* macros to simplify output of enlightenment messages; also used by
   conduct and achievements */
export async function enlght_out(buf) {
    if (game.en_via_menu) {
        await add_menu_str(game.en_win, buf);
    } else {
        (game.windowprocs.win_putstr)(game.en_win, 0, buf);
    }
}
const __enlght_line_contra = [{ twowords: " are not ", contrctn: " aren't " }, { twowords: " were not ", contrctn: " weren't " }, { twowords: " have not ", contrctn: " haven't " }, { twowords: " had not ", contrctn: " hadn't " }, { twowords: " can not ", contrctn: " can't " }, { twowords: " could not ", contrctn: " couldn't " }];
export async function enlght_line(start, middle, end, ps) {
    let i = 0;
    let buf = '';
    buf = sprintf(buf, " %s%s%s%s.", start, middle, end, ps);
    if (strstri(buf, " not ")) {
        /* TODO: switch to libc strstr() */
        for (i = 0; i < (Math.trunc(6 /* sizeof(const struct contrctn [6]) */ / 1 /* sizeof(const struct contrctn) */)); ++i) {
            buf = strsubst(buf, __enlght_line_contra[i].twowords, __enlght_line_contra[i].contrctn);
        }
    }
    await enlght_out(buf);
}
/* format increased chance to hit or damage or defense (Protection) */
/* "to hit" or "damage" or "defense" */
/* amount of increment (negative if decrement) */
/* ENL_{GAMEINPROGRESS,GAMEOVERALIVE,GAMEOVERDEAD} */
export async function enlght_combatinc(inctyp, incamt, final, outbuf) {
    let modif = null;
    let bonus = null;
    let invrt = 0;
    let absamt = 0;
    absamt = abs(incamt);
    /* Protection amount is typically larger than damage or to-hit;
       reduce magnitude by a third in order to stretch modifier ranges
       (small:1..5, moderate:6..10, large:11..19, huge:20+) */
    if (!strcmp(inctyp, "defense")) {
        absamt = Math.trunc((absamt * 2) / 3);
    }
    if (absamt <= 3) {
        modif = "small";
    } else if (absamt <= 6) {
        modif = "moderate";
    } else if (absamt <= 12) {
        modif = "large";
    } else {
        modif = "huge";
    }
    modif = !incamt ? "no" : await an(modif);
    bonus = (incamt >= 0) ? "bonus" : "penalty";
    /* "bonus <foo>" (to hit) vs "<bar> bonus" (damage, defense) */
    invrt = strcmp(inctyp, "to hit") ? (1) : (0);
    outbuf = sprintf(outbuf, "%s %s %s", modif, invrt ? inctyp : bonus, invrt ? bonus : inctyp);
    if (final || game.flags.debug) {
        outbuf = __nh_buf_append(outbuf, sprintf('', " (%s%d)", (incamt > 0) ? "+" : "", incamt));
    }
    return outbuf;
}
/* report half physical or half spell damage */
export async function enlght_halfdmg(category, final) {
    let category_name = null;
    let buf = '';
    switch (category) {
        case HALF_PHDAM:
            category_name = "physical";
            break;
        case HALF_SPDAM:
            category_name = "spell";
            break;
        /* TT_BEARTRAP, TT_PIT, or TT_WEB */
        default:
            category_name = "unknown";
            break;
    }
    buf = sprintf(buf, " %s %s damage", (final || game.flags.debug) ? "half" : "reduced", category_name);
    await enlght_line((You_), final ? ("took") : ("take"), (buf), (await from_what(category)));
}
/* is hero actively using water walking capability on water (or lava)? */
export function walking_on_water() {
    if (game.u.uinwater || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
        return (0);
    }
    return (((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) && is_pool_or_lava(game.u.ux, game.u.uy));
}
/* describe u.utraptype; used by status_enlightenment() and self_lookat() */
export async function trap_predicament(outbuf, final, wizxtra) {
    let t = null;
    /* caller has verified u.utrap */
    outbuf.value = 0;
    switch (game.u.utraptype) {
        case TT_BURIEDBALL:
            outbuf = strcpy(outbuf, "tethered to something buried");
            break;
        case TT_LAVA:
            outbuf = sprintf(outbuf, "sinking into %s", final ? "lava" : hliquid("lava"));
            break;
        case TT_INFLOOR:
            outbuf = sprintf(outbuf, "stuck in %s", await the(surface(game.u.ux, game.u.uy)));
            break;
        default:
            outbuf = strcpy(outbuf, "trapped");
            if ((t = t_at(game.u.ux, game.u.uy)) != null) {
                outbuf = __nh_buf_append(outbuf, sprintf('', " in %s", await an(trapname(t.ttyp, (0)))));
            }
            break;
    }
    /* give extra information for wizard mode enlightenment */
    if (wizxtra) {
        outbuf = __nh_buf_append(outbuf, sprintf('', " {%u}", game.u.utrap));
    }
    return outbuf;
}
/* check whether hero is wearing something that player definitely knows
   confers the target property; item must have been seen and its type
   discovered but it doesn't necessarily have to be fully identified */
/* index of a property which can be conveyed by worn item */
export function cause_known(propindx) {
    let o = null;
    let mask = (1 | 2 | 4 | 8 | 16 | 32 | 64) | 65536 | (131072 | 262144) | 524288;
    for (o = game.invent; o; o = o.nobj) {
        /* simpler than from_what()/what_gives(); we don't attempt to
       handle artifacts and we deliberately ignore wielded items */
        if (!(o.owornmask & mask)) {
            continue;
        }
        if (game.objects[o.otyp].oc_oprop == propindx && game.objects[o.otyp].oc_name_known && o.dknown) {
            return (1);
        }
    }
    return (0);
}
/* format a characteristic value, accommodating Strength's strangeness */
/* should be at least [7] to hold "18/100\0" */
export function attrval(attrindx, attrvalue, resultbuf) {
    if (attrindx != A_STR || attrvalue <= 18) {
        resultbuf = sprintf(resultbuf, "%d", attrvalue);
    } else if (attrvalue > (18 + (100))) {
        resultbuf = sprintf(resultbuf, "%d", attrvalue - 100);
    } else {
        resultbuf = sprintf(resultbuf, "18/%02d", attrvalue - 18);
    }
    return resultbuf;
}
/* format urealtime.realtime as
      " D days, H hours, M minutes and S seconds"
   with any fields having a value of 0 omitted:
      0-00:00:20 => " 20 seconds"
      0-00:15:05 => " 15 minutes and 5 seconds"
      0-00:16:00 => " 16 minutes"
      0-01:15:10 => " 1 hour, 15 minutes and 10 seconds"
      0-02:00:01 => " 2 hours and 1 second"
      3-00:25:40 => " 3 days, 25 minutes and 40 seconds"
   (note: for a list of more than two entries, nethack usually includes the
   [style-wise] optional comma before "and" but in this instance it does not)
 */
export function fmt_elapsed_time(outbuf, final) {
    let fieldcnt = 0;
    let edays = 0;
    let ehours = 0;
    let eminutes = 0;
    let eseconds = 0;
    /* for a game that's over, reallydone() has updated urealtime.realtime
       to its final value before calling us during end of game disclosure;
       for a game that's still in progress, it holds the amount of elapsed
       game time from previous sessions up through most recent save/restore
       (or up through latest level change when 'checkpoint' is On);
       '.start_timing' has a non-zero value even if '.realtime' is 0 */
    let etim = game.urealtime.realtime;
    if (!final) {
        etim += timet_delta(getnow(), game.urealtime.start_timing);
    }
    /* we could use localtime() to convert the value into a 'struct tm'
       to get date and time fields but this is simple and straightforward */
    eseconds = etim % 60 , etim = Math.trunc(etim / 60);
    eminutes = etim % 60 , etim = Math.trunc(etim / 60);
    ehours = etim % 24;
    edays = Math.trunc(etim / 24);
    fieldcnt = !!edays + !!ehours + !!eminutes + !!eseconds;
    outbuf = strcpy(outbuf, fieldcnt ? "" : " none");
    if (edays) {
        outbuf = __nh_buf_append(outbuf, sprintf('', " %ld day%s", edays, (((edays) == 1) ? "" : "s")));
        /* 'none' should never happen */
        /* hours and/or minutes and/or seconds to follow */
        /* minutes and/or seconds to follow */
        if (fieldcnt > 1) {
            outbuf = strcat(outbuf, (fieldcnt == 2) ? " and" : ",");
        }
        /* edays has been processed */
        /* ehours has been processed */
        --fieldcnt;
    }
    if (ehours) {
        outbuf = __nh_buf_append(outbuf, sprintf('', " %ld hour%s", ehours, (((ehours) == 1) ? "" : "s")));
        if (fieldcnt > 1) {
            outbuf = strcat(outbuf, (fieldcnt == 2) ? " and" : ",");
        }
        --fieldcnt;
    }
    if (eminutes) {
        outbuf = __nh_buf_append(outbuf, sprintf('', " %ld minute%s", eminutes, (((eminutes) == 1) ? "" : "s")));
        /* eminutes has been processed but no need to decrement fieldcnt */
        if (fieldcnt > 1) {
            outbuf = strcat(outbuf, " and");
        }
    }
    if (eseconds) {
        outbuf = __nh_buf_append(outbuf, sprintf('', " %ld second%s", eseconds, (((eseconds) == 1) ? "" : "s")));
    }
    return outbuf;
}
/* "once" vs "twice" vs "17 times", used in several places */
export function N_times(n, outbuf) {
    switch (n) {
        case 0:
        default:
            outbuf = sprintf(outbuf, "%ld times", n);
            break;
        case 1:
            outbuf = strcpy(outbuf, "once");
            break;
        case 2:
            outbuf = strcpy(outbuf, "twice");
            break;
        case 3:
            outbuf = strcpy(outbuf, "thrice");
            break;
    }
    return outbuf;
}
/* BASICENLIGHTENMENT | MAGICENLIGHTENMENT (| both) */
/* ENL_GAMEINPROGRESS:0, ENL_GAMEOVERALIVE, ENL_GAMEOVERDEAD */
export async function enlightenment(mode, final) {
    let buf = '';
    let tmpbuf = '';
    /* Create the conduct window */
    game.en_win = (game.windowprocs.win_create_nhwindow)(4);
    game.en_via_menu = !final;
    if (game.en_via_menu) {
        (game.windowprocs.win_start_menu)(game.en_win, 0);
    }
    tmpbuf = strcpy(tmpbuf, game.plname);
    /* same adjustment as bottom line */
    tmpbuf = (() => { const __s = tmpbuf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    buf = nh_snprintf("enlightenment", 401, buf, 256 /* sizeof(char [256]) */, "%s the %s's attributes:", tmpbuf, (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) && game.urole.name.f) ? game.urole.name.f : game.urole.name.m);
    await enlght_out(buf);
    if (mode & 1) {
        await background_enlightenment(mode, final);
        await basics_enlightenment(mode, final);
        await characteristics_enlightenment(mode, final);
    }
    await status_enlightenment(mode, final);
    if (mode & 2) {
        await attributes_enlightenment(mode, final);
    }
    await enlght_out("");
    await enlght_out("Miscellaneous:");
    if ((mode & 1) != 0 && (game.flags.debug || game.flags.explore || final)) {
        /* reminder to player and/or information for dumplog */
        /* show more--as if final disclosure--for wizard and explore modes */
        if (game.flags.debug || game.flags.explore) {
            buf = sprintf(buf, "running in %s mode", game.flags.debug ? "debug" : "explore");
            await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
        }
        if (!game.flags.bones) {
            buf = sprintf(buf, "disabled loading%s of bones levels", (final == 2) ? " and storing" : "");
            await enlght_line((You_), final ? ("") : (have), ((buf)), (""));
        } else if (!game.u.uroleplay.numbones) {
            await enlght_line((You_), final ? ("didn't encounter") : ("haven't encountered"), (" any bones levels"), (""));
        } else {
            buf = sprintf(buf, "encountered %ld bones level%s", game.u.uroleplay.numbones, (((game.u.uroleplay.numbones) == 1) ? "" : "s"));
            await enlght_line((You_), final ? ("") : (have), ((buf)), (""));
        }
    }
    fmt_elapsed_time(buf, final);
    await enlght_line(("Total elapsed playing time "), final ? ("was") : ("is"), (buf), (""));
    if (!game.en_via_menu) {
        await (game.windowprocs.win_display_nhwindow)(game.en_win, (1));
    } else {
        let selected = null;
        (game.windowprocs.win_end_menu)(game.en_win, null);
        if (await select_menu(game.en_win, 0, selected) > 0) {
            free(selected);
        }
        game.en_via_menu = (0);
    }
    (game.windowprocs.win_destroy_nhwindow)(game.en_win);
    /* Pop up the window and wait for a key */
    game.en_win = (-1);
}
/*ARGSUSED*/
/* display role, race, alignment and such to en_win */
export async function background_enlightenment(unused_mode, final) {
    let role_titl = null;
    let rank_titl = null;
    let innategend = 0;
    let difgend = 0;
    let difalgn = 0;
    let buf = '';
    let tmpbuf = '';
    /* note that if poly'd, we need to use u.mfemale instead of flags.female
       to access hero's saved gender-as-human/elf/&c rather than current */
    innategend = ((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0;
    role_titl = (innategend && game.urole.name.f) ? game.urole.name.f : game.urole.name.m;
    rank_titl = rank_of(game.u.ulevel, (game.urole.mnum), innategend);
    await enlght_out("");
    await enlght_out("Background:");
    if ((game.u.umonnum != game.u.umonster)) {
        /* if polymorphed, report current shape before underlying role;
       will be repeated as first status: "you are transformed" and also
       among various attributes: "you are in beast form" (after being
       told about lycanthropy) or "you are polymorphed into <a foo>"
       (with countdown timer appended for wizard mode); we really want
       the player to know he's not a samurai at the moment... */
        /* includes trailing space; [4] suffices */
        let anbuf = '';
        let uasmon = game.youmonst.data;
        let altphrasing = ((((game.youmonst)).cham == PM_VAMPIRE || ((game.youmonst)).cham == PM_VAMPIRE_LEADER || ((game.youmonst)).cham == PM_VLAD_THE_IMPALER) && !(((game.youmonst).data).mlet == S_VAMPIRE));
        /* report role; omit gender if it's redundant (eg, "female priestess") */
        tmpbuf = '';
        /* here we always use current gender, not saved role gender */
        if (!(((uasmon).mflags2 & 65536) != 0) && !(((uasmon).mflags2 & 131072) != 0) && !(((uasmon).mflags2 & 262144) != 0)) {
            tmpbuf = sprintf(tmpbuf, "%s ", genders[game.flags.female ? 1 : 0].adj);
        }
        if (altphrasing) {
            tmpbuf = __nh_buf_append(tmpbuf, sprintf('', "%s in ", pmname(game.mons[game.youmonst.cham], game.flags.female ? FEMALE : MALE)));
        }
        buf = nh_snprintf("background_enlightenment", 506, buf, 256 /* sizeof(char [256]) */, "%s%s%s%s form", !final ? "currently " : "", altphrasing ? just_an(anbuf, tmpbuf) : "in ", tmpbuf, pmname(uasmon, game.flags.female ? FEMALE : MALE));
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    tmpbuf = '';
    if (!game.urole.name.f && ((game.urole.allow & 61440) == (4096 | 8192) || innategend != game.flags.initgend)) {
        tmpbuf = sprintf(tmpbuf, "%s ", genders[innategend].adj);
    }
    buf = '';
    if ((game.u.umonnum != game.u.umonster)) {
        buf = strcpy(buf, "actually ");
    }
    /* "You are actually a ..." */
    if (!strncmpi((rank_titl), (role_titl), -1)) {
        buf = __nh_buf_append(buf, sprintf('', "%s, level %d %s%s", await an(rank_titl), game.u.ulevel, tmpbuf, game.urace.noun));
    } else {
        buf = __nh_buf_append(buf, sprintf('', "%s, a level %d %s%s %s", await an(rank_titl), game.u.ulevel, tmpbuf, game.urace.adj, role_titl));
    }
    await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    buf = sprintf(buf, " %s%s%s, %son a mission for %s", You_, !final ? are : were, align_str(game.u.ualign.type), (game.u.ualign.type != game.u.ualignbase[0]) ? (!final ? "currently " : "temporarily ") : (game.u.ualign.type != game.u.ualignbase[1]) ? (!final ? "now " : "belatedly ") : (!game.u.uconduct.gnostic && game.moves > 1000) ? "nominally " : "", await u_gname());
    await enlght_out(buf);
    buf = sprintf(buf, " who %s opposed by", !final ? "is" : "was");
    if (game.u.ualign.type != 1) {
        buf = __nh_buf_append(buf, sprintf('', " %s (%s) and", await align_gname(1), align_str(1)));
    }
    if (game.u.ualign.type != 0) {
        buf = __nh_buf_append(buf, sprintf('', " %s (%s)%s", await align_gname(0), align_str(0), (game.u.ualign.type != (-1)) ? " and" : ""));
    }
    if (game.u.ualign.type != (-1)) {
        buf = __nh_buf_append(buf, sprintf('', " %s (%s)", await align_gname((-1)), align_str((-1))));
    }
    buf = strcat(buf, ".");
    await enlght_out(buf);
    /* show original alignment,gender,race,role if any have been changed;
       giving separate message for temporary alignment change bypasses need
       for tricky phrasing otherwise necessitated by possibility of having
       helm of opposite alignment mask a permanent alignment conversion */
    difgend = (innategend != game.flags.initgend);
    difalgn = (((game.u.ualign.type != game.u.ualignbase[0]) ? 1 : 0) + ((game.u.ualignbase[0] != game.u.ualignbase[1]) ? 2 : 0));
    if (difalgn & 1) {
        buf = sprintf(buf, "actually %s", align_str(game.u.ualignbase[0]));
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
        /* have temporary alignment so report permanent one */
        /* suppress helm from "started out <foo>" message */
        difalgn &= ~1;
    }
    /* sex change or perm align change or both */
    if (difgend || difalgn) {
        buf = sprintf(buf, " You started out %s%s%s.", difgend ? genders[game.flags.initgend].adj : "", (difgend && difalgn) ? " and " : "", difalgn ? align_str(game.u.ualignbase[1]) : "");
        await enlght_out(buf);
    }
    buf = sprintf(buf, "%s%s-handed", !strcmp(await body_part(HANDED), "handed") ? "" : "normally ", (game.u.uhandedness == 0) ? "right" : "left");
    await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    /* As of 3.6.2: dungeon level, so that ^X really has all status info as
       claimed by the comment below; this reveals more information than
       the basic status display, but that's one of the purposes of ^X;
       similar information is revealed by #overview; the "You died in
       <location>" given by really_done() is more rudimentary than this */
    (tmpbuf = '', buf = '');
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        /* "You are left-handed." won't work well if polymorphed into something
       without hands; use "You are normally left-handed." in that situation */
        let egdepth = observable_depth(game.u.uz);
        endgamelevelname(tmpbuf, egdepth);
        buf = nh_snprintf("background_enlightenment", 609, buf, 256 /* sizeof(char [256]) */, "in the endgame, on the %s%s", !strncmp(tmpbuf, "Plane", 5) ? "Elemental " : "", tmpbuf);
    } else if ((((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level))))) {
        buf = sprintf(buf, "on the %s level", game.dungeons[game.u.uz.dnum].dname);
    } else {
        let dgnbuf = '';
        dgnbuf = strcpy(dgnbuf, game.dungeons[game.u.uz.dnum].dname);
        if (!strncmpi(dgnbuf, "The ", 4)) {
            dgnbuf = (() => { const __s = dgnbuf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toLowerCase() + __t.slice(1) : __s; })();
        }
        tmpbuf = sprintf(tmpbuf, "level %d", In_quest(game.u.uz) ? dunlev(game.u.uz) : depth(game.u.uz));
        /* TODO? maybe extend this bit to include various other automatic
           annotations from the dungeon overview code */
        if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
            tmpbuf = strcat(tmpbuf, ", a primitive area");
        } else if ((((((game.dungeon_topology.d_bigroom_level)).dlevel || ((game.dungeon_topology.d_bigroom_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_bigroom_level)))) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            tmpbuf = strcat(tmpbuf, ", a very big room");
        }
        buf = nh_snprintf("background_enlightenment", 629, buf, 256 /* sizeof(char [256]) */, "in %s, on %s", dgnbuf, tmpbuf);
    }
    await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    if (game.moves == 1) {
        await enlght_line((You_), final ? (had) : (have), (("just started your adventure")), (("")));
    } else {
        buf = sprintf(buf, "the dungeon %ld turn%s ago", game.moves, (((game.moves) == 1) ? "" : "s"));
        await enlght_line(You_, "entered ", buf, "");
    }
    /* for gameover, these have been obtained in really_done() so that they
       won't vary if user leaves a disclosure prompt or --More-- unanswered
       long enough for the dynamic value to change between then and now */
    if (final ? game.iflags.at_midnight : midnight()) {
        await enlght_line(("It "), final ? ("was ") : ("is "), ("the midnight hour"), (""));
    } else if (final ? game.iflags.at_night : night()) {
        await enlght_line(("It "), final ? ("was ") : ("is "), ("nighttime"), (""));
    }
    /* other environmental factors */
    if (game.flags.moonphase == 4 || game.flags.moonphase == 0) {
        buf = sprintf(buf, "a %s moon in effect%s", (game.flags.moonphase == 4) ? "full" : (game.flags.moonphase == 0) ? "new" : (game.flags.moonphase < 4) ? "first quarter" : "last quarter", final ? " when your adventure ended" : "");
        await enlght_line(("There "), final ? ("was ") : ("is "), (buf), (""));
    }
    if (game.flags.friday13) {
        buf = sprintf(buf, " Bad things %s on Friday the 13th.", !final ? "can happen" : (final == 1) ? "could have happened" : "happened");
        await enlght_out(buf);
    }
    /* describes what's shown on status line, which is an approximation;
           only show it here if player has the 'showscore' option enabled */
    if (!(game.u.umonnum != game.u.umonster)) {
        /* showing these would probably just lead to confusion
                     since they have no effect on game play... */
        /* we don't have access to 'how' here--aside from survived
                   vs died--so settle for general platitude */
        /* let player know that friday13 penalty is/was in effect;
           we don't say "it is/was Friday the 13th" because that was at
           the start of the session and it might be past midnight (or
           days later if the game has been paused without save/restore),
           so phrase this similar to the start up message */
        /* there's no may to tell whether -1 Luck made a
                     difference but hero has died... */
        let ulvl = game.u.ulevel;
        buf = sprintf(buf, "%-1ld experience point%s", game.u.uexp, (((game.u.uexp) == 1) ? "" : "s"));
        if (ulvl < 30 && (final || game.flags.debug)) {
            /* [flags.showexp currently does not matter; should it?] */
            /* experience level is already shown above */
            /* TODO?
         *  Remove wizard-mode restriction since patient players can
         *  determine the numbers needed without resorting to spoilers
         *  (even before this started being disclosed for 'final';
         *  just enable 'showexp' and look at normal status lines
         *  after drinking gain level potions or eating wraith corpses
         *  or being level-drained by vampires).
         */
            let nxtlvl = newuexp(ulvl);
            let delta = nxtlvl - game.u.uexp;
            buf = __nh_buf_append(buf, sprintf('', ", %ld %s%sneeded %s level %d", delta, (game.u.uexp > 0) ? "more " : "", !final ? "" : (delta == 1) ? "was " : "were ", (ulvl < 18) ? "to attain" : "for", (ulvl + 1)));
        }
        await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
    }
}
/* hit points, energy points, armor class -- essential information which
   doesn't fit very well in other categories */
/*ARGSUSED*/
let __basics_enlightenment_Power = "energy points (spell power)";
__nh_register_static(() => { __basics_enlightenment_Power = "energy points (spell power)"; });
export async function basics_enlightenment(mode, final) {
    let buf = '';
    let pw = game.u.uen;
    let hp = ((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp);
    let pwmax = game.u.uenmax;
    let hpmax = ((game.u.umonnum != game.u.umonster) ? game.u.mhmax : game.u.uhpmax);
    await enlght_out("");
    await enlght_out("Basics:");
    if (hp < 0) {
        hp = 0;
    }
    /* "1 out of 1" rather than "all" if max is only 1; should never happen */
    if (hp == hpmax && hpmax > 1) {
        buf = sprintf(buf, "all %d hit points", hpmax);
    } else {
        buf = sprintf(buf, "%d out of %d hit point%s", hp, hpmax, (((hpmax) == 1) ? "" : "s"));
    }
    await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
    /* low max energy is feasible, so handle couple of extra special cases */
    if (pwmax == 0 || (pw == pwmax && pwmax == 2)) {
        buf = sprintf(buf, "%s %s", !pwmax ? "no" : "both", __basics_enlightenment_Power);
    } else if (pw == pwmax && pwmax > 2) {
        buf = sprintf(buf, "all %d %s", pwmax, __basics_enlightenment_Power);
    } else {
        buf = sprintf(buf, "%d out of %d %s", pw, pwmax, __basics_enlightenment_Power);
    }
    await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
    if ((game.u.umonnum != game.u.umonster)) {
        switch (game.mons[game.u.umonnum].mlevel) {
            case 0:
                buf = strcpy(buf, "0 hit dice (actually 1/2)");
                /* alternate phrasing for present vs past and also for
               possessing the item vs once held it */
                /* alternate wording for ascended (always past tense) since
               hero had it until #offer forced it to be relinquished */
                break;
            case 1:
                buf = strcpy(buf, "1 hit die");
                break;
            default:
                buf = sprintf(buf, "%d hit dice", game.mons[game.u.umonnum].mlevel);
                break;
        }
        await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
    }
    find_ac();
    buf = sprintf(buf, "%d", game.u.uac);
    if (abs(game.u.uac) == 99) {
        buf = __nh_buf_append(buf, sprintf('', ", the %s possible", (game.u.uac < 0) ? "best" : "worst"));
    }
    await enlght_line(("Your armor class "), final ? ("was ") : ("is "), (buf), (""));
/* gold; similar to doprgold (#showgold) but without shop billing info;
       includes container contents, unlike status line but like doprgold */
{
        let umoney = money_cnt(game.invent);
        let hmoney = hidden_gold(final);
        if (!umoney) {
            buf = sprintf(buf, " Your wallet %s empty", !final ? "is" : "was");
        } else {
            buf = sprintf(buf, " Your wallet contain%s %ld %s", !final ? "s" : "ed", umoney, await currency(umoney));
        }
        buf = strcat(buf, !hmoney ? "." : !umoney ? ", but" : ", and");
        await enlght_out(buf);
        if (hmoney) {
            buf = sprintf(buf, "%ld %s stashed away in your pack", hmoney, umoney ? "more" : await currency(hmoney));
            await enlght_line(("you "), final ? ("had ") : ("have "), (buf), (""));
        }
    }
    if (game.flags.pickup) {
        let ocl = '';
        buf = strcpy(buf, "on");
        if (await costly_spot(game.u.ux, game.u.uy)) {
            buf = strcat(buf, ", but temporarily disabled while inside the shop");
        } else {
            await oc_to_str(game.flags.pickup_types, ocl);
            buf = __nh_buf_append(buf, sprintf('', " for %s%s%s", ocl ? "'" : "", ocl ? ocl : "all types", ocl ? "'" : ""));
            if (game.flags.pickup_thrown && ocl) {
                buf = strcat(buf, " plus thrown");
            }
            /* show when not 'all types' */
            if (game.apelist) {
                buf = strcat(buf, ", with exceptions");
            }
        }
    } else {
        buf = strcpy(buf, "off");
    }
    await enlght_line(("Autopickup "), final ? ("was ") : ("is "), (buf), (""));
}
/* characteristics: expanded version of bottom line strength, dexterity, &c */
export async function characteristics_enlightenment(mode, final) {
    let buf = '';
    await enlght_out("");
    buf = sprintf(buf, "%sCharacteristics:", !final ? "" : "Final ");
    await enlght_out(buf);
    await one_characteristic(mode, final, A_STR);
    await one_characteristic(mode, final, A_DEX);
    await one_characteristic(mode, final, A_CON);
    await one_characteristic(mode, final, A_INT);
    await one_characteristic(mode, final, A_WIS);
    await one_characteristic(mode, final, A_CHA);
}
/* display one attribute value for characteristics_enlightenment() */
export async function one_characteristic(mode, final, attrindx) {
    let hide_innate_value = (0);
    let interesting_alimit = 0;
    let acurrent = 0;
    let abase = 0;
    let apeak = 0;
    let alimit = 0;
    let paren_pfx = null;
    let subjbuf = '';
    let valubuf = '';
    let valstring = '';
    if ((game.u.umonnum != game.u.umonster)) {
        /* being polymorphed or wearing certain cursed items prevents
       hero from reliably tracking changes to characteristics so
       we don't show base & peak values then; when the items aren't
       cursed, hero could take them off to check underlying values
       and we show those in such case so that player doesn't need
       to actually resort to doing that */
        hide_innate_value = (1);
    } else if (game.u.uprops[FIXED_ABIL].extrinsic) {
        if (await stuck_ring(game.uleft, RIN_SUSTAIN_ABILITY) || await stuck_ring(game.uright, RIN_SUSTAIN_ABILITY)) {
            hide_innate_value = (1);
        }
    }
    switch (attrindx) {
        case A_STR:
            if (game.uarmg && game.uarmg.otyp == GAUNTLETS_OF_POWER && game.uarmg.cursed) {
                hide_innate_value = (1);
            }
            break;
        case A_DEX:
            break;
        case A_CON:
            if (is_art(game.uwep, ART_OGRESMASHER) && game.uwep.cursed) {
                hide_innate_value = (1);
            }
            break;
        case A_INT:
            if (game.uarmh && game.uarmh.otyp == DUNCE_CAP && game.uarmh.cursed) {
                hide_innate_value = (1);
            }
            break;
        case A_WIS:
            if (game.uarmh && game.uarmh.otyp == DUNCE_CAP && game.uarmh.cursed) {
                hide_innate_value = (1);
            }
            break;
        case A_CHA:
            break;
        default:
            return;
    }
    ;
    /* note: final disclosure includes MAGICENLIGHTENTMENT */
    if ((mode & 2) && !(game.u.umonnum != game.u.umonster)) {
        hide_innate_value = (0);
    }
    acurrent = (acurr(attrindx));
    attrval(attrindx, acurrent, valubuf);
    subjbuf = sprintf(subjbuf, "Your %s ", attrname[attrindx]);
    if (!hide_innate_value) {
        /* show abase, amax, and/or attrmax if acurr doesn't match abase
           (a magic bonus or penalty is in effect) or abase doesn't match
           amax (some points have been lost to poison or exercise abuse
           and are restorable) or attrmax is different from normal human
           (while game is in progress; trying to reduce dependency on
           spoilers to keep track of such stuff) or attrmax was different
           from abase (at end of game; this attribute wasn't maxed out) */
        abase = (game.u.acurr.a[attrindx]);
        apeak = (game.u.amax.a[attrindx]);
        alimit = ((attrindx == A_STR && (game.u.umonnum != game.u.umonster)) ? uasmon_maxStr() : game.urace.attrmax[attrindx]);
        /* criterium for whether the limit is interesting varies */
        interesting_alimit = final ? (1) : (alimit != (attrindx != A_STR ? 18 : (18 + (100))));
        paren_pfx = final ? " (" : " (current; ";
        if (acurrent != abase) {
            valubuf = __nh_buf_append(valubuf, sprintf('', "%sbase:%s", paren_pfx, attrval(attrindx, abase, valstring)));
            paren_pfx = ", ";
        }
        if (abase != apeak) {
            valubuf = __nh_buf_append(valubuf, sprintf('', "%speak:%s", paren_pfx, attrval(attrindx, apeak, valstring)));
            paren_pfx = ", ";
        }
        if (interesting_alimit) {
            valubuf = __nh_buf_append(valubuf, sprintf('', "%s%slimit:%s", paren_pfx, (acurrent > alimit) ? "innate " : "", attrval(attrindx, alimit, valstring)));
        }
        if (acurrent != abase || abase != apeak || interesting_alimit) {
            valubuf = strcat(valubuf, ")");
        }
    }
    await enlght_line((subjbuf), final ? ("was ") : ("is "), (valubuf), (""));
}
/* status: selected obvious capabilities, assorted troubles */
export async function status_enlightenment(mode, final) {
    let magic = (mode & 2) ? (1) : (0);
    let cap = 0;
    let buf = '';
    let youtoo = '';
    let heldmon = '';
    let Riding = (game.u.usteed && !(final == 2 && !strcmp(game.killer.name, "riding accident")));
    let steedname = (!Riding ? null : await x_monnam(game.u.usteed, game.u.usteed.mtame ? 3 : 1, null, (8 | 4), (0)));
    await enlght_out("");
    await enlght_out(final ? "Final Status:" : "Status:");
    youtoo = strcpy(youtoo, You_);
    if ((game.u.umonnum != game.u.umonster)) {
        buf = strcpy(buf, "transformed");
        /* if hero dies while dismounting, u.usteed will still
                         be set; we want to ignore steed in that situation */
        /* not a traditional status but inherently obvious to player; more
       detail given below (attributes section) for magic enlightenment */
        if (ugenocided()) {
            buf = __nh_buf_append(buf, sprintf('', " and %s %s inside", final ? "felt" : "feel", udeadinside()));
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    /* not a trouble, but we want to display riding status before maybe
       reporting steed as trapped or hero stuck to cursed saddle */
    if (Riding) {
        buf = sprintf(buf, "riding %s", steedname);
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
        youtoo = __nh_buf_append(youtoo, sprintf('', "and %s ", steedname));
    }
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        /* other movement situations that hero should always know */
        if ((((game.u.uprops[LEVITATION].intrinsic & 536870912) != 0 || (game.u.uprops[LEVITATION].extrinsic & 8192) != 0) && (game.u.uprops[LEVITATION].intrinsic & ~(536870912 | 16777215)) == 0 && (game.u.uprops[LEVITATION].extrinsic & ~8192) == 0) && magic) {
            await enlght_line((You_), final ? (were) : (are), (("levitating, at will")), (("")));
        } else {
            await enlght_line((youtoo), final ? (were) : (are), ("levitating"), (await from_what(LEVITATION)));
        }
    } else if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
        await enlght_line((youtoo), final ? (were) : (are), ("flying"), (await from_what(FLYING)));
    }
    if ((game.u.uinwater)) {
        await enlght_line((You_), final ? (were) : (are), (("underwater")), (("")));
    } else if (game.u.uinwater) {
        await enlght_line((You_), final ? (were) : (are), (((game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) ? "swimming" : "in water")), ((await from_what(SWIMMING))));
    } else if (walking_on_water()) {
        buf = sprintf(buf, "walking on %s", is_pool(game.u.ux, game.u.uy) ? "water" : is_lava(game.u.ux, game.u.uy) ? "lava" : surface(game.u.ux, game.u.uy));
        await enlght_line((You_), final ? (were) : (are), ((buf)), ((await from_what(WWALKING))));
    }
    if ((game.u.umonnum != game.u.umonster) && (game.u.uundetected || (game.youmonst.m_ap_type & 7) != M_AP_NOTHING)) {
        await youhiding((1), final);
    }
    if (game.u.uprops[STONED].intrinsic) {
        /* can only fly when not levitating */
        /* show active Wwalking here, potential Wwalking elsewhere */
        /* catchall; shouldn't happen */
        /* internal troubles, mostly in the order that prayer ranks them */
        if (final && (game.u.uprops[STONED].intrinsic & 536870912)) {
            await enlght_out(" You turned into stone.");
        } else {
            await enlght_line((You_), final ? (were) : (are), (("turning to stone")), (("")));
        }
    }
    if (game.u.uprops[SLIMED].intrinsic) {
        if (final && (game.u.uprops[SLIMED].intrinsic & 536870912)) {
            await enlght_out(" You turned into slime.");
        } else {
            await enlght_line((You_), final ? (were) : (are), (("turning into slime")), (("")));
        }
    }
    if (game.u.uprops[STRANGLED].intrinsic) {
        if (game.u.uburied) {
            await enlght_line((You_), final ? (were) : (are), (("buried")), (("")));
        } else {
            if (final && (game.u.uprops[STRANGLED].intrinsic & 536870912)) {
                await enlght_out(" You died from strangulation.");
            } else {
                buf = strcpy(buf, "being strangled");
                if (game.flags.debug) {
                    buf = __nh_buf_append(buf, sprintf('', " (%ld)", (game.u.uprops[STRANGLED].intrinsic & 16777215)));
                }
                await enlght_line((You_), final ? (were) : (are), ((buf)), ((await from_what(STRANGLED))));
            }
        }
    }
    if (game.u.uprops[SICK].intrinsic) {
        /* the two types of sickness are lumped together; hero can be
           afflicted by both but there is only one timeout; botl status
           puts TermIll before FoodPois and death due to timeout reports
           terminal illness if both are in effect, so do the same here */
        if (final && (game.u.uprops[SICK].intrinsic & 536870912)) {
            buf = sprintf(buf, " %sdied from %s.", You_, (game.u.usick_type & 2) ? "terminal illness" : "food poisoning");
            await enlght_out(buf);
        } else {
            if (game.u.usick_type & 2) {
                await enlght_line((You_), final ? (were) : (are), (("terminally sick from illness")), (("")));
            }
            if (game.u.usick_type & 1) {
                await enlght_line((You_), final ? (were) : (are), (("terminally sick from food poisoning")), (("")));
            }
        }
    }
    if (game.u.uprops[VOMITING].intrinsic) {
        await enlght_line((You_), final ? (were) : (are), (("nauseated")), (("")));
    }
    if (game.u.uprops[STUNNED].intrinsic) {
        await enlght_line((You_), final ? (were) : (are), (("stunned")), (("")));
    }
    if (game.u.uprops[CONFUSION].intrinsic) {
        await enlght_line((You_), final ? (were) : (are), (("confused")), (("")));
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        await enlght_line((You_), final ? (were) : (are), (("hallucinating")), (("")));
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        buf = sprintf(buf, "%s blind", (game.u.uprops[BLINDED].intrinsic & 67108864) != 0 ? "permanently" : (game.u.uprops[BLINDED].intrinsic & 268435456) ? "innately" : (game.u.uprops[BLINDED].extrinsic && !(game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked)) ? "deliberately" : "temporarily");
        if (game.flags.debug && (game.u.uprops[BLINDED].intrinsic == (game.u.uprops[BLINDED].intrinsic & 16777215) && !game.u.uprops[BLINDED].extrinsic)) {
            buf = __nh_buf_append(buf, sprintf('', " (%ld)", (game.u.uprops[BLINDED].intrinsic & 16777215)));
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? "" : await from_what(BLINDED))));
    }
    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        await enlght_line((You_), final ? (were) : (are), (("deaf")), ((await from_what(DEAF))));
    }
    if ((game.uball != null)) {
        if (game.uball) {
            buf = sprintf(buf, "chained to %s", await ansimpleoname(game.uball));
        } else {
            await impossible("Punished without uball?");
            buf = strcpy(buf, "punished");
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    if (game.u.utrap) {
        let predicament = '';
        let anchored = (game.u.utraptype == TT_BURIEDBALL);
        await trap_predicament(predicament, final, game.flags.debug);
        if (game.u.usteed) {
            buf = sprintf(buf, "%s%s ", anchored ? "you and " : "", steedname);
            buf = (() => { const __s = buf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
            await enlght_line((buf), final ? ((anchored ? "were " : "was ")) : ((anchored ? "are " : "is ")), (predicament), (""));
        } else {
            await enlght_line((You_), final ? (were) : (are), ((predicament)), (("")));
        }
    }
    heldmon = '';
    if (game.u.ustuck) {
        heldmon = strcpy(heldmon, await a_monnam(game.u.ustuck));
        if (!strcmp(heldmon, "it") && (!((game.u.ustuck).mextra && ((game.u.ustuck).mextra.mgivenname)) || strcmp(((game.u.ustuck).mextra.mgivenname), "it") != 0)) {
            heldmon = strcpy(heldmon, "an unseen creature");
        }
    }
    if (game.u.uswallow) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        buf = nh_snprintf("status_enlightenment", 1111, buf, 256 /* sizeof(char [256]) */, "%s by %s", (dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null) ? "swallowed" : "engulfed", heldmon);
        if (dmgtype(game.u.ustuck.data, 26)) {
            /* if final, death via digestion can be deduced by u.uswallow
               still being True and u.uswldtim having been decremented to 0 */
            if (final && !game.u.uswldtim) {
                buf = strcat(buf, " and got totally digested");
            } else {
                buf = __nh_buf_append(buf, sprintf('', " and %s being digested", final ? "were" : "are"));
            }
        }
        if (game.flags.debug) {
            buf = __nh_buf_append(buf, sprintf('', " (%u)", game.u.uswldtim));
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    } else if (game.u.ustuck) {
        let ustick = ((game.u.umonnum != game.u.umonster) && sticks(game.youmonst.data));
        let dx = game.u.ustuck.mx - game.u.ux;
        let dy = game.u.ustuck.my - game.u.uy;
        buf = nh_snprintf("status_enlightenment", 1130, buf, 256 /* sizeof(char [256]) */, "%s %s (%s)", ustick ? "holding" : "held by", heldmon, dxdy_to_dist_descr(dx, dy, (1)));
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    if (Riding) {
        let saddle = await which_armor(game.u.usteed, 1048576);
        if (saddle && saddle.cursed) {
            buf = sprintf(buf, "stuck to %s %s", s_suffix(steedname), await simpleonames(saddle));
            await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
        }
    }
    if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic)) {
        /* EWounded_legs is used to track left/right/both rather than some
           form of extrinsic impairment; HWounded_legs is used for timeout;
           both apply to steed instead of hero when mounted */
        let whichleg = (game.u.uprops[WOUNDED_LEGS].extrinsic & (131072 | 262144));
        let bp = game.u.usteed ? await mbodypart(game.u.usteed, LEG) : await body_part(LEG);
        let article = "a ";
        let leftright = "";
        if (whichleg == (131072 | 262144)) {
            bp = await makeplural(bp) , article = "";
        /* precedes "wounded", so never "an " */
        } else {
            leftright = (whichleg == 131072) ? "left " : "right ";
        }
        buf = sprintf(buf, "%swounded %s%s", article, leftright, bp);
        if (game.u.usteed) {
            if (game.flags.debug && steedname) {
                /* when mounted, Wounded_legs applies to steed rather than to
           hero; we only report steed's wounded legs in wizard mode */
                let steednambuf = '';
                steednambuf = strcpy(steednambuf, steedname);
                steednambuf = (() => { const __s = steednambuf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
                await enlght_line((steednambuf), final ? (" had ") : (" has "), (buf), (""));
            }
        } else {
            await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
        }
    }
    if (game.u.uprops[GLIB].intrinsic) {
        buf = sprintf(buf, "slippery %s", await fingers_or_gloves((1)));
        if (game.flags.debug) {
            buf = __nh_buf_append(buf, sprintf('', " (%ld)", (game.u.uprops[GLIB].intrinsic & 16777215)));
        }
        await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
    }
    if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) {
        if (magic || cause_known(FUMBLING)) {
            await enlght_line((You_), final ? ("fumbled") : ("fumble"), (""), (await from_what(FUMBLING)));
        }
    }
    if ((game.u.uprops[SLEEPY].intrinsic || game.u.uprops[SLEEPY].extrinsic)) {
        if (magic || cause_known(SLEEPY)) {
            buf = strcpy(buf, await from_what(SLEEPY));
            if (game.flags.debug) {
                buf = __nh_buf_append(buf, sprintf('', " (%ld)", (game.u.uprops[SLEEPY].intrinsic & 16777215)));
            }
            await enlght_line(("You "), final ? ("fell") : ("fall"), (" asleep uncontrollably"), (buf));
        }
    }
    if ((game.u.uprops[HUNGER].intrinsic || game.u.uprops[HUNGER].extrinsic)) {
        if (magic || cause_known(HUNGER)) {
            await enlght_line((You_), final ? ("hungered") : ("hunger"), (" rapidly"), (await from_what(HUNGER)));
        }
    }
    buf = strcpy(buf, hu_stat[game.u.uhs]);
    /* hunger status; omitted if "normal" */
    buf = mungspaces(buf);
    /* status line doesn't show hunger when state is "not hungry", we do;
       needed for wizard mode's reveal of u.uhunger but add it for everyone */
    if (!buf) {
        buf = strcpy(buf, "not hungry");
    }
    if (buf) {
        /* (since "not hungry" was added, this will always be True) */
        buf = (() => { const __s = buf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toLowerCase() + __t.slice(1) : __s; })();
        if (!strcmp(buf, "weak")) {
            buf = strcat(buf, " from severe hunger");
        } else if (!strncmp(buf, "faint", 5)) {
            buf = strcat(buf, " due to starvation");
        }
        if (game.flags.debug) {
            buf = __nh_buf_append(buf, sprintf('', " <%d>", game.u.uhunger));
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    if ((cap = near_capacity()) > UNENCUMBERED) {
        /* (should always get overridden) */
        let adj = "?_?";
        buf = strcpy(buf, enc_stat[cap]);
        buf = (() => { const __s = buf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toLowerCase() + __t.slice(1) : __s; })();
        switch (cap) {
            case SLT_ENCUMBER:
                adj = "slightly";
                break;
            case MOD_ENCUMBER:
                adj = "moderately";
                break;
            case HVY_ENCUMBER:
                adj = "very";
                break;
            case EXT_ENCUMBER:
                adj = "extremely";
                break;
            case OVERLOADED:
                adj = "not possible";
                break;
        }
        /* last resort entry, guarantees Status section is non-empty
           (no longer needed for that purpose since weapon status added;
           still useful though) */
        if (game.flags.debug) {
            buf = __nh_buf_append(buf, sprintf('', " <%d>", inv_weight()));
        }
        buf = __nh_buf_append(buf, sprintf('', "; movement %s %s%s", !final ? "is" : "was", adj, (cap < OVERLOADED) ? " slowed" : ""));
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    } else {
        buf = strcpy(buf, "unencumbered");
        if (game.flags.debug) {
            buf = __nh_buf_append(buf, sprintf('', " <%d>", inv_weight()));
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    await weapon_insight(final);
    if (game.iflags.tux_penalty && !(game.u.umonnum != game.u.umonster)) {
        await enlght_combatinc("to hit", -game.urole.spelarmr, final, buf);
        buf = __nh_buf_append(buf, sprintf('', " due to your %s", suit_simple_name(game.uarm)));
        await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
    }
    if (!game.uarm && !game.uarmu && !game.uarmc && !game.uarms && !game.uarmg && !game.uarmf && !game.uarmh) {
        if (game.u.uroleplay.nudist) {
            await enlght_line((You_), final ? ("did") : ("do"), (" not wear any armor"), (""));
        } else {
            await enlght_line((You_), final ? (were) : (are), (("not wearing any armor")), (("")));
        }
    }
}
/* extracted from status_enlightenment() to reduce clutter there */
const __weapon_insight_also_ = "also ";
const __weapon_insight_also_wik_ = " and also with ";
export async function weapon_insight(final) {
    let buf = '';
    let wtype = 0;
    if (!game.uwep) {
        await enlght_line((You_), final ? (were) : (are), ((empty_handed())), (("")));
    } else if (game.u.twoweap) {
        await enlght_line((You_), final ? (were) : (are), (("wielding two weapons at once")), (("")));
    } else {
        let what = await weapon_descr(game.uwep);
        /* [what about other silver items?] */
        if (game.uwep.otyp == SHIELD_OF_REFLECTION) {
            what = shield_simple_name(game.uwep);
        } else if (((game.uwep).otyp == TOWEL && (game.uwep).spe > 0)) {
            what = "wet towel";
        }
        /* (uwep->spe < 3) ? "moist towel" : */
        if (!strncmpi((what), ("armor"), -1) || !strncmpi((what), ("food"), -1) || !strncmpi((what), ("venom"), -1)) {
            buf = sprintf(buf, "wielding some %s", what);
        } else {
            buf = sprintf(buf, "wielding %s", (game.uwep.quan == 1) ? await an(what) : await makeplural(what));
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    if ((wtype = weapon_type(game.uwep)) != P_NONE && (!game.uwep || !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == GEM_CLASS) && game.objects[game.uwep.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uwep.otyp].oc_subtyp <= -P_BOW))) {
        /* two-weaponing implies hands and
       a weapon or wep-tool (not other odd stuff) in each hand */
        /* report most weapons by their skill class (so a katana will be
       described as a long sword, for instance; mattock, hook, and aklys
       are exceptions), or wielded non-weapon item by its object class */
        /*
     * Skill with current weapon.  Might help players who've never
     * noticed #enhance or decided that it was pointless.
     */
        let sklvlbuf = '';
        let sklvl = (game.u.weapon_skills[wtype].skill);
        let hav = (sklvl != P_UNSKILLED && sklvl != P_SKILLED);
        if (sklvl == P_ISRESTRICTED) {
            sklvlbuf = strcpy(sklvlbuf, "no");
        } else {
            lcase(skill_level_name(wtype, sklvlbuf));
        }
        buf = sprintf(buf, "%s %s %s", sklvlbuf, hav ? "skill with" : "in", skill_name(wtype));
        if (!game.u.twoweap) {
            /* "you have no/basic/expert/master/grand-master skill with <skill>"
           or "you are unskilled/skilled in <skill>" */
            if (can_advance(wtype, (0))) {
                buf = __nh_buf_append(buf, sprintf('', " and %s that", !final ? "can enhance" : "could have enhanced"));
            }
            if (hav) {
                await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
            } else {
                await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
            }
        } else {
            let pfx = '';
            let sfx = '';
            let sknambuf2 = '';
            let sklvlbuf2 = '';
            let twobuf = '';
            let also = "";
            let also2 = "";
            let also3 = null;
            let verb_present = null;
            let verb_past = null;
            let wtype2 = weapon_type(game.uswapwep);
            let sklvl2 = (game.u.weapon_skills[wtype2].skill);
            let twoskl = (game.u.weapon_skills[P_TWO_WEAPON_COMBAT].skill);
            let a1 = 0;
            let a2 = 0;
            let ab = 0;
            let hav2 = (sklvl2 != P_UNSKILLED && sklvl2 != P_SKILLED);
            if (twoskl == P_ISRESTRICTED) {
                /* normally hero must have access to two-weapon skill in
               order to initiate u.twoweap, but not if polymorphed into
               a form which has multiple weapon attacks, so we need to
               avoid getting bitten by unexpected skill value */
                twoskl = P_UNSKILLED;
                /* restricted is the same as unskilled as far as bonus
                   or penalty goes, and it isn't ordinarily seen so
                   skill_level_name() returns "Unknown" for it */
                twobuf = strcpy(twobuf, "restricted");
            } else {
                lcase(skill_level_name(P_TWO_WEAPON_COMBAT, twobuf));
            }
            /* keep buf[] from above in case skill levels match */
            (sfx = '', pfx = '');
            if (twoskl < sklvl) {
                pfx = sprintf(pfx, "Your skill in %s ", skill_name(wtype));
                sfx = sprintf(sfx, " limited by being %s with two weapons", twobuf);
                /* twoskil won't be restricted so sklvl is at least basic */
                also = __weapon_insight_also_;
            } else if (twoskl > sklvl) {
                pfx = strcpy(pfx, "Your two weapon skill ");
                sfx = strcpy(sfx, " limited by ");
                /* sklvl might be restricted */
                if (sklvl > P_ISRESTRICTED) {
                    sfx = __nh_buf_append(sfx, sprintf('', "being %s", sklvlbuf));
                } else {
                    sfx = __nh_buf_append(sfx, sprintf('', "having no skill"));
                }
                sfx = __nh_buf_append(sfx, sprintf('', " with %s", skill_name(wtype)));
                also2 = __weapon_insight_also_;
            } else {
                buf = strcat(buf, " and two weapons");
                also3 = __weapon_insight_also_;
            }
            if (pfx) {
                await enlght_line((pfx), final ? ("was") : ("is"), (sfx), (""));
            } else if (hav) {
                await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
            } else {
                await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
            }
            if (wtype2 != wtype) {
                sknambuf2 = strcpy(sknambuf2, skill_name(wtype2));
                /* skip comparison between secondary and two-weapons if it is
               identical to the comparison between primary and twoweap */
                lcase(skill_level_name(wtype2, sklvlbuf2));
                verb_present = "is" , verb_past = "was";
                ((buf = '', sfx = ''), pfx = '');
                if (twoskl < sklvl2) {
                    pfx = sprintf(pfx, "Your skill in %s ", sknambuf2);
                    sfx = sprintf(sfx, " %slimited by being %s with two weapons", also, twobuf);
                } else if (twoskl > sklvl2) {
                    pfx = strcpy(pfx, "Your two weapon skill ");
                    sfx = sprintf(sfx, " %slimited by ", also2);
                    /* twoskil is at least unskilled, sklvl2 at least basic */
                    /* sklvl2 might be restricted */
                    if (sklvl2 > P_ISRESTRICTED) {
                        sfx = __nh_buf_append(sfx, sprintf('', "being %s", sklvlbuf2));
                    } else {
                        sfx = __nh_buf_append(sfx, "having no skill");
                    }
                    sfx = __nh_buf_append(sfx, sprintf('', " with %s", sknambuf2));
                } else {
                    buf = sprintf(buf, "%s %s %s", sklvlbuf2, hav2 ? "skill with" : "in", sknambuf2);
                    buf = strcat(buf, " and two weapons");
                    if (also3) {
                        pfx = strcpy(pfx, "You also ");
                        nh_snprintf("weapon_insight", 1419, sfx, 128 /* sizeof(char [128]) */, " %s", buf) , buf = '';
                        /* equal; two-weapon is at least unskilled, so sklvl2 is
                       too; "you [also] have basic/expert/master/grand-master
                       skill with <skill>" or "you [also] are unskilled/
                       skilled in <skill> */
                        verb_present = hav2 ? "have" : "are";
                        verb_past = hav2 ? "had" : "were";
                    }
                }
                if (pfx) {
                    await enlght_line((pfx), final ? (verb_past) : (verb_present), (sfx), (""));
                } else if (hav2) {
                    await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
                } else {
                    await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
                }
            }
            /* if training and available skill credits already allow
               #enhance for any of primary, secondary, or two-weapon,
               tell the player; avoid attempting figure out whether
               spending skill credits enhancing one might make either
               or both of the others become ineligible for enhancement */
            a1 = can_advance(wtype, (0));
            a2 = (wtype2 != wtype) ? can_advance(wtype2, (0)) : (0);
            ab = can_advance(P_TWO_WEAPON_COMBAT, (0));
            if (a1 || a2 || ab) {
                sfx = sprintf(sfx, " skill%s with %s%s%s%s%s", (a1 + a2 + ab > 1) ? "s" : "", a1 ? skill_name(wtype) : "", ((a1 && a2 && ab) ? ", " : (a1 && (a2 || ab)) ? __weapon_insight_also_wik_ : ""), a2 ? skill_name(wtype2) : "", ((a1 && a2 && ab) ? ", and " : (a2 && ab) ? __weapon_insight_also_wik_ : ""), ab ? "two weapons" : "");
                await enlght_line((You_), final ? ("could have enhanced") : ("can enhance"), (sfx), (""));
            }
        }
    }
}
export async function item_resistance_message(adtyp, prot_message, final) {
    let protection = u_adtyp_resistance_obj(adtyp);
    if (protection) {
        let somewhat = protection < 99;
        await enlght_line(("Your items "), final ? (somewhat ? "were somewhat" : "were") : (somewhat ? "are somewhat" : "are"), (prot_message), (await item_what(adtyp)));
    }
}
/* attributes: intrinsics and the like, other non-obvious capabilities */
const __attributes_enlightenment_if_surroundings_permitted = " if surroundings permitted";
const __attributes_enlightenment_hofe_titles = ["the Hand of Elbereth", "the Envoy of Balance", "the Glory of Arioch"];
const __attributes_enlightenment_mc_types = ["", "warded", "guarded", "protected"];
export async function attributes_enlightenment(unused_mode, final) {
    let ltmp = 0;
    let armpro = 0;
    let warnspecies = 0;
    let buf = '';
    await enlght_out("");
    await enlght_out(final ? "Final Attributes:" : "Attributes:");
    if (game.u.uevent.uhand_of_elbereth) {
        await enlght_line((You_), final ? (were) : (are), ((__attributes_enlightenment_hofe_titles[game.u.uevent.uhand_of_elbereth - 1])), (("")));
    }
    buf = sprintf(buf, "%s", piousness((1), "aligned"));
    if (game.u.ualign.record >= 0) {
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    } else {
        await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
    }
    if (game.flags.debug) {
        buf = sprintf(buf, " %d", game.u.ualign.record);
        await enlght_line(("Your alignment "), final ? ("was") : ("is"), (buf), (""));
    }
    /*** Resistances to troubles ***/
    if (game.u.uprops[INVULNERABLE].intrinsic) {
        await enlght_line((You_), final ? (were) : (are), (("invulnerable")), ((await from_what(INVULNERABLE))));
    }
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("magic-protected")), ((await from_what(ANTIMAGIC))));
    }
    if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("fire resistant")), ((await from_what(FIRE_RES))));
    }
    await item_resistance_message(2, " protected from fire", final);
    if ((game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("cold resistant")), ((await from_what(COLD_RES))));
    }
    await item_resistance_message(3, " protected from cold", final);
    if ((game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("sleep resistant")), ((await from_what(SLEEP_RES))));
    }
    if ((game.u.uprops[DISINT_RES].intrinsic || game.u.uprops[DISINT_RES].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("disintegration resistant")), ((await from_what(DISINT_RES))));
    }
    await item_resistance_message(5, " protected from disintegration", final);
    if ((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("shock resistant")), ((await from_what(SHOCK_RES))));
    }
    await item_resistance_message(6, " protected from electric shocks", final);
    if ((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("poison resistant")), ((await from_what(POISON_RES))));
    }
    if ((game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
        buf = sprintf(buf, "%.20s%.30s", temp_resist(ACID_RES) ? "temporarily " : "", "acid resistant");
        await enlght_line((You_), final ? (were) : (are), ((buf)), ((await from_what(ACID_RES))));
    }
    await item_resistance_message(8, " protected from acid", final);
    if ((game.u.uprops[DRAIN_RES].intrinsic || game.u.uprops[DRAIN_RES].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("level-drain resistant")), ((await from_what(DRAIN_RES))));
    }
    if ((game.u.uprops[SICK_RES].intrinsic || game.u.uprops[SICK_RES].extrinsic || await defended(game.youmonst, 33))) {
        await enlght_line((You_), final ? (were) : (are), (("immune to sickness")), ((await from_what(SICK_RES))));
    }
    if ((game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        buf = sprintf(buf, "%.20s%.30s", temp_resist(STONE_RES) ? "temporarily " : "", "petrification resistant");
        await enlght_line((You_), final ? (were) : (are), ((buf)), ((await from_what(STONE_RES))));
    }
    if ((game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) {
        await enlght_line((You_), final ? ("resisted") : ("resist"), (" hallucinations"), (await from_what(HALLUC_RES)));
    }
    if (game.u.uedibility) {
        await enlght_line((You_), final ? (could) : (can), (("recognize detrimental food")), (("")));
    }
    /* blind w/ blindness blocked */
    if ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && game.u.uprops[BLINDED].blocked) {
        await enlght_line((You_), final ? (could) : (can), (("see")), ((await from_what(-BLINDED))));
    }
    /* skip if no eyes or blindfolded */
    if ((game.u.uprops[BLND_RES].intrinsic || game.u.uprops[BLND_RES].extrinsic) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        await enlght_line((You_), final ? (were) : (are), (("not subject to light-induced blindness")), ((await from_what(BLND_RES))));
    }
    if ((game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await enlght_line((You_), final ? ("saw") : ("see"), (" invisible"), (await from_what(SEE_INVIS)));
        } else if (!((game.u.uprops[BLINDED].intrinsic & 67108864) != 0)) {
            await enlght_line((You_), final ? ("would have seen") : ("will see"), (" invisible when not blind"), (""));
        } else {
            await enlght_line((You_), final ? ("would have seen") : ("would see"), (" invisible if not blind"), (""));
        }
    }
    if ((game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("telepathic")), ((await from_what(TELEPAT))));
    }
    if ((game.u.uprops[WARNING].intrinsic || game.u.uprops[WARNING].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("warned")), ((await from_what(WARNING))));
    }
    if ((game.u.uprops[WARN_OF_MON].intrinsic || game.u.uprops[WARN_OF_MON].extrinsic) && game.context.warntype.obj) {
        buf = sprintf(buf, "aware of the presence of %s", (game.context.warntype.obj & 128) ? "orcs" : (game.context.warntype.obj & 16) ? "elves" : (game.context.warntype.obj & 256) ? "demons" : c_common_strings.c_something);
        await enlght_line((You_), final ? (were) : (are), ((buf)), ((await from_what(WARN_OF_MON))));
    }
    if ((game.u.uprops[WARN_OF_MON].intrinsic || game.u.uprops[WARN_OF_MON].extrinsic) && game.context.warntype.polyd) {
        buf = sprintf(buf, "aware of the presence of %s", ((game.context.warntype.polyd & (8 | 16)) == (8 | 16)) ? "humans and elves" : (game.context.warntype.polyd & 8) ? "humans" : (game.context.warntype.polyd & 16) ? "elves" : (game.context.warntype.polyd & 128) ? "orcs" : (game.context.warntype.polyd & 256) ? "demons" : "certain monsters");
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    warnspecies = game.context.warntype.speciesidx;
    if ((game.u.uprops[WARN_OF_MON].intrinsic || game.u.uprops[WARN_OF_MON].extrinsic) && ((warnspecies) >= LOW_PM && (warnspecies) < NUMMONS)) {
        buf = sprintf(buf, "aware of the presence of %s", await makeplural(game.mons[warnspecies].pmnames[NEUTRAL]));
        await enlght_line((You_), final ? (were) : (are), ((buf)), ((await from_what(WARN_OF_MON))));
    }
    if ((game.u.uprops[WARN_UNDEAD].intrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("warned of undead")), ((await from_what(WARN_UNDEAD))));
    }
    if ((game.u.uprops[SEARCHING].intrinsic || game.u.uprops[SEARCHING].extrinsic)) {
        await enlght_line((You_), final ? (had) : (have), (("automatic searching")), ((await from_what(SEARCHING))));
    }
    if (((game.u.uprops[CLAIRVOYANT].intrinsic || game.u.uprops[CLAIRVOYANT].extrinsic) && !game.u.uprops[CLAIRVOYANT].blocked)) {
        await enlght_line((You_), final ? (were) : (are), (("clairvoyant")), ((await from_what(CLAIRVOYANT))));
    } else if ((game.u.uprops[CLAIRVOYANT].intrinsic || game.u.uprops[CLAIRVOYANT].extrinsic) && game.u.uprops[CLAIRVOYANT].blocked) {
        buf = strcpy(buf, await from_what(-CLAIRVOYANT));
        buf = strsubst(buf, " because of ", " if not for ");
        await enlght_line((You_), final ? ("could have been") : ("could be"), (" clairvoyant"), (buf));
    }
    if ((game.u.uprops[INFRAVISION].intrinsic || game.u.uprops[INFRAVISION].extrinsic)) {
        await enlght_line((You_), final ? (had) : (have), (("infravision")), ((await from_what(INFRAVISION))));
    }
    if ((game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic)) {
        buf = strcpy(buf, "sensing the presence of monsters");
        if (game.flags.debug) {
            let detectmon_timeout = (game.u.uprops[DETECT_MONSTERS].intrinsic & 16777215);
            if (detectmon_timeout) {
                buf = __nh_buf_append(buf, sprintf('', " (%ld)", detectmon_timeout));
            }
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    if (game.u.umconf) {
        buf = strcpy(buf, " monsters when hitting them");
        if (game.flags.debug && !final) {
            /* 'u.umconf' is a counter rather than a timeout */
            if (game.u.umconf == 1) {
                buf = strcat(buf, " (next hit only)");
            } else {
                buf = __nh_buf_append(buf, sprintf('', " (next %u hits)", game.u.umconf));
            }
        }
        await enlght_line((You_), final ? ("would have confused") : ("will confuse"), (buf), (""));
    }
    if (game.u.uprops[ADORNED].extrinsic) {
        /*** Appearance and behavior ***/
        let adorn = 0;
        if (game.uleft && game.uleft.otyp == RIN_ADORNMENT) {
            adorn += game.uleft.spe;
        }
        if (game.uright && game.uright.otyp == RIN_ADORNMENT) {
            adorn += game.uright.spe;
        }
        buf = sprintf(buf, "%scharismatic", (adorn > 0) ? "more " : (adorn < 0) ? "less " : "");
        await enlght_line((You_), final ? (were) : (are), ((buf)), ((await from_what(ADORNED))));
    }
    if ((((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic))) {
        await enlght_line((You_), final ? (were) : (are), (("invisible")), ((await from_what(INVIS))));
    } else if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked)) {
        await enlght_line((You_), final ? (were) : (are), (("invisible to others")), ((await from_what(INVIS))));
    } else if ((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && game.u.uprops[INVIS].blocked) {
        await enlght_line((You_), final ? (were) : (are), (("visible")), ((await from_what(-INVIS))));
    }
    /* ordinarily "visible" is redundant; this is a special case for
       the situation when invisibility would be an expected attribute */
    if ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("displaced")), ((await from_what(DISPLACED))));
    }
    if (((game.u.uprops[STEALTH].intrinsic || game.u.uprops[STEALTH].extrinsic) && !game.u.uprops[STEALTH].blocked)) {
        await enlght_line((You_), final ? (were) : (are), (("stealthy")), ((await from_what(STEALTH))));
    } else if (game.u.uprops[STEALTH].blocked && (game.u.uprops[STEALTH].intrinsic || game.u.uprops[STEALTH].extrinsic)) {
        buf = sprintf(buf, " stealthy%s", (game.u.uprops[STEALTH].blocked == 67108864) ? " if not mounted" : "");
        await enlght_line((You_), final ? ("would have been") : ("would be"), (buf), (""));
    }
    if ((game.u.uprops[AGGRAVATE_MONSTER].intrinsic || game.u.uprops[AGGRAVATE_MONSTER].extrinsic)) {
        await enlght_line(("You aggravate"), final ? ("d") : (""), (" monsters"), (await from_what(AGGRAVATE_MONSTER)));
    }
    if ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic)) {
        await enlght_line(("You cause"), final ? ("d") : (""), (" conflict"), (await from_what(CONFLICT)));
    }
    if ((game.u.uprops[JUMPING].intrinsic || game.u.uprops[JUMPING].extrinsic)) {
        await enlght_line((You_), final ? (could) : (can), (("jump")), ((await from_what(JUMPING))));
    }
    if ((game.u.uprops[TELEPORT].intrinsic || game.u.uprops[TELEPORT].extrinsic)) {
        await enlght_line((You_), final ? (could) : (can), (("teleport")), ((await from_what(TELEPORT))));
    }
    if ((game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic)) {
        await enlght_line((You_), final ? (had) : (have), (("teleport control")), ((await from_what(TELEPORT_CONTROL))));
    }
    if (game.u.uprops[LEVITATION].blocked) {
        /* actively levitating handled earlier as a status condition */
        let save_BLev = game.u.uprops[LEVITATION].blocked;
        game.u.uprops[LEVITATION].blocked = 0;
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            /* either trapped in the floor or inside solid rock
               (or both if chained to buried iron ball and have
               moved one step into solid rock somehow) */
            let trapped = (save_BLev & 536870912) != 0;
            let terrain = (save_BLev & 67108864) != 0;
            buf = sprintf(buf, "%s%s%s", trapped ? " if not trapped" : "", (trapped && terrain) ? " and" : "", terrain ? __attributes_enlightenment_if_surroundings_permitted : "");
            await enlght_line((You_), final ? ("would have levitated") : ("would levitate"), (buf), (""));
        }
        game.u.uprops[LEVITATION].blocked = save_BLev;
    }
    if (game.u.uprops[FLYING].blocked) {
        /* actively flying handled earlier as a status condition */
        let save_BFly = game.u.uprops[FLYING].blocked;
        game.u.uprops[FLYING].blocked = 0;
        if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            await enlght_line((You_), final ? ("would have flown") : ("would fly"), (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) ? " if you weren't levitating" : (save_BFly == 536870912) ? " if you weren't trapped" : (save_BFly == 67108864) ? __attributes_enlightenment_if_surroundings_permitted : " if circumstances permitted"), (""));
        }
        game.u.uprops[FLYING].blocked = save_BFly;
    }
    if ((((game.youmonst.data).mflags1 & 16) != 0)) {
        /* wording quibble: for past tense, "hadn't been"
                       would sound better than "weren't" (and
                       "had permitted" better than "permitted"), but
                       "weren't" and "permitted" are adequate so the
                       extra complexity to handle that isn't worth it */
        /* this is an oversimplification; being trapped
                             might also be blocking levitation so flight
                             would still be blocked after escaping trap */
        /* two or more of levitation, surroundings,
                                and being trapped in the floor */
        /* including this might bring attention to the fact that ceiling
       clinging has inconsistencies... */
        let has_lid = has_ceiling(game.u.uz);
        if (has_lid && !game.u.uinwater) {
            await enlght_line((You_), final ? (could) : (can), (("cling to the ceiling")), (("")));
        } else {
            buf = sprintf(buf, " to the ceiling if %s%s%s", !has_lid ? "there was one" : "", (!has_lid && game.u.uinwater) ? " and " : "", game.u.uinwater ? ((game.u.uinwater) ? "you weren't underwater" : "you weren't in the water") : "");
            await enlght_line((You_), final ? ("could have clung") : ("could cling"), (buf), (""));
        }
    }
    /* actively walking on water handled earlier as a status condition */
    if (((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) && !walking_on_water()) {
        await enlght_line((You_), final ? (could) : (can), (("walk on water")), ((await from_what(WWALKING))));
    }
    /* actively swimming (in water but not under it) handled earlier */
    if ((game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) && ((game.u.uinwater) || !game.u.uinwater)) {
        await enlght_line((You_), final ? (could) : (can), (("swim")), ((await from_what(SWIMMING))));
    }
    if ((game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))) {
        await enlght_line((You_), final ? (could) : (can), (("survive without air")), ((await from_what(MAGICAL_BREATHING))));
    } else if ((game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0))) {
        await enlght_line((You_), final ? (could) : (can), (("breathe water")), ((await from_what(MAGICAL_BREATHING))));
    }
    if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
        await enlght_line((You_), final ? (could) : (can), (("walk through walls")), ((await from_what(PASSES_WALLS))));
    }
    if ((game.u.uprops[REGENERATION].intrinsic || game.u.uprops[REGENERATION].extrinsic)) {
        await enlght_line(("You regenerate"), final ? ("d") : (""), (""), (await from_what(REGENERATION)));
    }
    if ((game.u.uprops[SLOW_DIGESTION].intrinsic || game.u.uprops[SLOW_DIGESTION].extrinsic)) {
        await enlght_line((You_), final ? (had) : (have), (("slower digestion")), ((await from_what(SLOW_DIGESTION))));
    }
    if (game.u.uhitinc) {
        await enlght_combatinc("to hit", game.u.uhitinc, final, buf);
        if (game.iflags.tux_penalty && !(game.u.umonnum != game.u.umonster)) {
            buf = __nh_buf_append(buf, sprintf('', " %s your suit's penalty", (game.u.uhitinc < 0) ? "increasing" : (game.u.uhitinc < Math.trunc(4 * game.urole.spelarmr / 5)) ? "partly offsetting" : (game.u.uhitinc < game.urole.spelarmr) ? "nearly offsetting" : "overcoming"));
        }
        await enlght_line((You_), final ? (had) : (have), ((buf)), (("")));
    }
    if (game.u.udaminc) {
        await enlght_line((You_), final ? (had) : (have), ((await enlght_combatinc("damage", game.u.udaminc, final, buf))), (("")));
    }
    if (game.u.uspellprot || (game.u.uprops[PROTECTION].intrinsic || game.u.uprops[PROTECTION].extrinsic)) {
        let prot = 0;
        if (game.uleft && game.uleft.otyp == RIN_PROTECTION) {
            prot += game.uleft.spe;
        }
        if (game.uright && game.uright.otyp == RIN_PROTECTION) {
            prot += game.uright.spe;
        }
        if (game.uamul && game.uamul.otyp == AMULET_OF_GUARDING) {
            prot += 2;
        }
        if (game.u.uprops[PROTECTION].intrinsic & (67108864 | 33554432 | 16777216)) {
            prot += game.u.ublessed;
        }
        prot += game.u.uspellprot;
        if (prot) {
            await enlght_line((You_), final ? (had) : (have), ((await enlght_combatinc("defense", prot, final, buf))), (("")));
        }
    }
    if ((armpro = magic_negation(game.youmonst)) > 0) {
        /* magic cancellation factor, conferred by worn armor */
        if (armpro >= (Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */))) {
            armpro = (Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)) - 1;
        }
        await enlght_line((You_), final ? (were) : (are), ((__attributes_enlightenment_mc_types[armpro])), (("")));
    }
    if ((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) {
        await enlght_halfdmg(HALF_PHDAM, final);
    }
    if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
        await enlght_halfdmg(HALF_SPDAM, final);
    }
    if ((game.ublindf && game.ublindf.otyp == TOWEL && game.ublindf.spe > 0)) {
        await enlght_line((You_), final ? ("took") : ("take"), (" reduced poison gas damage"), (""));
    }
    if (game.spl_book[0].sp_id > 0) {
        /* skip if no spells are known yet */
        /* greatly simplified edition of percent_success(spell.c)--may need
           to be suppressed if oversimplification leads to player confusion */
        let cast_adj = '';
        let suit = game.uarm && (game.objects[game.uarm.otyp].oc_material >= IRON && game.objects[game.uarm.otyp].oc_material <= MITHRIL);
        let robe = game.uarmc && game.uarmc.otyp == ROBE;
        cast_adj = '';
        /* omit "wearing" to shorten the text */
        if (suit) {
            cast_adj = sprintf(cast_adj, " impaired by metallic armor%s", robe ? ", mitigated by your robe" : "");
        } else if (robe) {
            cast_adj = strcpy(cast_adj, " enhanced by wearing a robe");
        }
        if (cast_adj) {
            await enlght_line(("Your spell casting "), final ? ("was") : ("is"), (cast_adj), (""));
        }
    }
    /* polymorph and other shape change */
    if ((game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("protected from shape changers")), ((await from_what(PROT_FROM_SHAPE_CHANGERS))));
    }
    if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
        let what = null;
        /* Upolyd handled below after current form */
        if (!(game.u.umonnum != game.u.umonster)) {
            await enlght_line((You_), final ? (could) : (can), (("not change from your current form")), ((await from_what(UNCHANGING))));
        }
        if ((game.u.uprops[POLYMORPH].intrinsic || game.u.uprops[POLYMORPH].extrinsic)) {
            what = !final ? "polymorph" : "have polymorphed";
        } else if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS)) {
            what = !final ? "change shape" : "have changed shape";
        }
        if (what) {
            buf = sprintf(buf, "would %s periodically", what);
            await enlght_line((You_), final ? (buf) : (buf), (" if not locked into your current form"), (""));
        }
    } else if ((game.u.uprops[POLYMORPH].intrinsic || game.u.uprops[POLYMORPH].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), (("polymorphing periodically")), ((await from_what(POLYMORPH))));
    }
    if ((game.u.uprops[POLYMORPH_CONTROL].intrinsic || game.u.uprops[POLYMORPH_CONTROL].extrinsic)) {
        await enlght_line((You_), final ? (had) : (have), (("polymorph control")), ((await from_what(POLYMORPH_CONTROL))));
    }
    if ((game.u.umonnum != game.u.umonster) && game.u.umonnum != game.u.ulycn && !(final == 2 && game.u.umonnum == PM_GREEN_SLIME && !(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic))) {
        /* omit from_what(UNCHANGING); too verbose */
        /* if we've died from turning into slime, we're polymorphed
           right now but don't want to list it as a temporary attribute
           [we need a more reliable way to detect this situation] */
        /* foreign shape (except were-form which is handled below) */
        if (!((((game.youmonst)).cham == PM_VAMPIRE || ((game.youmonst)).cham == PM_VAMPIRE_LEADER || ((game.youmonst)).cham == PM_VLAD_THE_IMPALER) && !(((game.youmonst).data).mlet == S_VAMPIRE))) {
            buf = sprintf(buf, "polymorphed into %s", await an(pmname(game.youmonst.data, game.flags.female ? FEMALE : MALE)));
        } else {
            buf = sprintf(buf, "polymorphed into %s in %s form", await an(pmname(game.mons[game.youmonst.cham], game.flags.female ? FEMALE : MALE)), pmname(game.youmonst.data, game.flags.female ? FEMALE : MALE));
        }
        if (game.flags.debug) {
            buf = __nh_buf_append(buf, sprintf('', " (%d)", game.u.mtimedone));
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    if ((((game.youmonst.data).mflags1 & 4194304) != 0) && game.flags.female) {
        await enlght_line((You_), final ? (could) : (can), (("lay eggs")), (("")));
    }
    if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS)) {
        buf = strcpy(buf, await an(pmname(game.mons[game.u.ulycn], game.flags.female ? FEMALE : MALE)));
        if (game.u.umonnum == game.u.ulycn) {
            buf = strcat(buf, " in beast form");
            /* "you are a werecreature [in beast form]" */
            if (game.flags.debug) {
                buf = __nh_buf_append(buf, sprintf('', " (%d)", game.u.mtimedone));
            }
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    }
    if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && (game.u.umonnum != game.u.umonster)) {
        await enlght_line((You_), final ? (could) : (can), (("not change from your current form")), ((await from_what(UNCHANGING))));
    }
    if ((game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data))) {
        await enlght_line((You_), final ? (were) : (are), (("harmed by silver")), (("")));
    }
    /* movement and non-armor-based protection */
    if ((game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic)) {
        await enlght_line((You_), final ? (were) : (are), ((((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic) ? "very fast" : "fast")), ((await from_what(FAST))));
    }
    if ((game.u.uprops[REFLECTING].intrinsic || game.u.uprops[REFLECTING].extrinsic)) {
        await enlght_line((You_), final ? (had) : (have), (("reflection")), ((await from_what(REFLECTING))));
    }
    if (game.u.uprops[FREE_ACTION].extrinsic) {
        await enlght_line((You_), final ? (had) : (have), (("free action")), ((await from_what(FREE_ACTION))));
    }
    if (game.u.uprops[FIXED_ABIL].extrinsic) {
        await enlght_line((You_), final ? (had) : (have), (("fixed abilities")), ((await from_what(FIXED_ABIL))));
    }
    if (game.u.uprops[LIFESAVED].extrinsic) {
        await enlght_line(("Your life "), final ? ("would have been") : ("will be"), (" saved"), (""));
    }
    if ((game.u.uluck + game.u.moreluck)) {
        ltmp = abs((game.u.uluck + game.u.moreluck));
        buf = sprintf(buf, "%s%slucky", ltmp >= 10 ? "extremely " : ltmp >= 5 ? "very " : "", (game.u.uluck + game.u.moreluck) < 0 ? "un" : "");
        if (game.flags.debug) {
            buf = __nh_buf_append(buf, sprintf('', " (%d)", (game.u.uluck + game.u.moreluck)));
        }
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    } else if (game.flags.debug) {
        await enlght_line(("Your luck "), final ? ("was") : ("is"), (" zero"), (""));
    }
    if (game.u.moreluck > 0) {
        await enlght_line((You_), final ? (had) : (have), (("extra luck")), (("")));
    } else if (game.u.moreluck < 0) {
        await enlght_line((You_), final ? (had) : (have), (("reduced luck")), (("")));
    }
    if (carrying(LUCKSTONE) || stone_luck((1))) {
        ltmp = stone_luck((0));
        if (ltmp <= 0) {
            await enlght_line(("Bad luck "), final ? ("did") : ("does"), (" not time out for you"), (""));
        }
        if (ltmp >= 0) {
            await enlght_line(("Good luck "), final ? ("did") : ("does"), (" not time out for you"), (""));
        }
    }
    if (game.u.ugangr) {
        buf = sprintf(buf, " %sangry with you", game.u.ugangr > 6 ? "extremely " : game.u.ugangr > 3 ? "very " : "");
        if (game.flags.debug) {
            buf = __nh_buf_append(buf, sprintf('', " (%d)", game.u.ugangr));
        }
        await enlght_line((await u_gname()), final ? (" was") : (" is"), (buf), (""));
    } else {
        if (!final) {
            buf = sprintf(buf, "%ssafely pray", await can_pray((0)) ? "" : "not ");
            /*
         * We need to suppress this when the game is over, because death
         * can change the value calculated by can_pray(), potentially
         * resulting in a false claim that you could have prayed safely.
         */
            /* "can [not] safely pray" vs "could [not] have safely prayed" */
            if (game.flags.debug) {
                buf = __nh_buf_append(buf, sprintf('', " (%d)", game.u.ublesscnt));
            }
            await enlght_line((You_), final ? (could) : (can), ((buf)), (("")));
        }
    }
    if (game.flags.debug && debugcore("fruit", (0))) {
        /* named fruit debugging (doesn't really belong here...); to enable,
       include 'fruit' in DEBUGFILES list (even though it isn't a file...) */
        let f = null;
        await reorder_fruit((1));
        for (f = game.ffruit; f; f = f.nextf) {
            buf = sprintf(buf, "Fruit #%d ", f.fid);
            await enlght_line((buf), final ? ("was ") : ("is "), (f.fname), (""));
        }
        await enlght_line(("The current fruit "), final ? ("was ") : ("is "), (game.pl_fruit), (""));
        buf = sprintf(buf, "%d", game.flags.made_fruit);
        await enlght_line(("The made fruit flag "), final ? ("was ") : ("is "), (buf), (""));
    }
{
        let p = null;
        buf = '';
        if (final < 2) {
            /* still in progress, or quit/escaped/ascended */
            p = "survived after being killed ";
            if (!game.u.umortality) {
                p = !final ? null : "survived";
            } else {
                N_times(game.u.umortality, buf);
            }
        } else {
            /* game ended in character's death */
            p = "are dead";
            switch (game.u.umortality) {
                case 0:
                    await impossible("dead without dying?");
                    ;
                case 1:
                    break;
                default:
                    buf = sprintf(buf, " (%d%s time!)", game.u.umortality, ordin(game.u.umortality));
                    break;
            }
        }
        if (p) {
            await enlght_line((You_), final ? (p) : ("have been killed "), (buf), (""));
        }
    }
}
/* ^X command */
export async function doattributes() {
    let mode = 1;
    if (game.flags.debug || game.flags.explore) {
        mode |= 2;
    }
    await enlightenment(mode, 0);
    return 0;
}
/* enlightenment line vs topl message */
/* for variant message phrasing */
export async function youhiding(via_enlghtmt, msgflag) {
    let bp = null;
    let buf = '';
    buf = strcpy(buf, "hiding");
    if ((game.youmonst.m_ap_type & 7) != M_AP_NOTHING) {
        /* mimic; hero is only able to mimic a strange object or gold
           or hallucinatory alternative to gold, so we skip the details
           for the hypothetical furniture and monster cases */
        bp = eos(strcpy(buf, "mimicking"));
        if ((game.youmonst.m_ap_type & 7) == M_AP_OBJECT) {
            bp = sprintf(bp, " %s", await an(await simple_typename(game.youmonst.mappearance)));
        } else if ((game.youmonst.m_ap_type & 7) == M_AP_FURNITURE) {
            bp = strcpy(bp, " something");
        } else if ((game.youmonst.m_ap_type & 7) == M_AP_MONSTER) {
            bp = strcpy(bp, " someone");
        } else {
            ;
        }
    } else if (game.u.uundetected) {
        bp = eos(buf);
        if (game.youmonst.data.mlet == S_EEL) {
            if (is_pool(game.u.ux, game.u.uy)) {
                bp = sprintf(bp, " in the %s", waterbody_name(game.u.ux, game.u.uy));
            }
        } else if ((((game.youmonst.data).mflags1 & 128) != 0)) {
            let o = game.level.objects[game.u.ux][game.u.uy];
            if (o) {
                bp = sprintf(bp, " underneath %s", await ansimpleoname(o));
            }
        } else if ((((game.youmonst.data).mflags1 & 16) != 0) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            bp = sprintf(bp, " on the %s", ceiling(game.u.ux, game.u.uy));
        } else {
            if (game.u.utrap && game.u.utraptype == TT_PIT) {
                /* Flying: 'lurker above' hides on ceiling but doesn't cling */
                /* on floor; is_hider() but otherwise not special: 'trapper' */
                let t = t_at(game.u.ux, game.u.uy);
                bp = sprintf(bp, " in a %spit", (t && t.ttyp == SPIKED_PIT) ? "spiked " : "");
            } else {
                bp = sprintf(bp, " on the %s", surface(game.u.ux, game.u.uy));
            }
        }
    } else {
        ;
    }
    if (via_enlghtmt) {
        /* 'final' is used by you_are() macro */
        let final = msgflag;
        await enlght_line((You_), final ? (were) : (are), ((buf)), (("")));
    } else {
        await You("are %s %s.", msgflag ? "already" : "now", buf);
    }
}
/* #conduct command [KMH]; shares enlightenment's tense handling */
export async function doconduct() {
    await show_conduct(0);
    return 0;
}
/* display conducts; for doconduct(), also disclose() and dump_everything() */
export async function show_conduct(final) {
    let buf = '';
    let bufN = '';
    let ngenocided = 0;
    game.en_win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_putstr)(game.en_win, 0, "Voluntary challenges:");
    /* rerolling; "You <this or that>" is about the character, rerolling
       is about the player so phrase it differently;
       also, always use past tense since the chance to do something with it
       is gone by time player can issue #conduct command or see disclosure */
    if (!game.u.uroleplay.reroll) {
        buf = strcpy(buf, " Character rerolling was not enabled.");
    } else if (!game.u.uroleplay.numrerolls) {
        buf = strcpy(buf, " Your character was not rerolled.");
    } else {
        buf = sprintf(buf, " Your character was rerolled %s.", N_times(game.u.uroleplay.numrerolls, bufN));
    }
    await enlght_out(buf);
    if (game.u.uroleplay.blind) {
        await enlght_line((You_), final ? (were) : (have_been), (("blind from birth")), (""));
    }
    if (game.u.uroleplay.deaf) {
        await enlght_line((You_), final ? (were) : (have_been), (("deaf from birth")), (""));
    }
    if (game.u.uroleplay.pauper) {
        await enlght_line((You_), final ? ("started out") : (game.invent ? "started" : "are"), (" without possessions"), (""));
    }
    if (game.u.uroleplay.nudist) {
        await enlght_line((You_), final ? (were) : (have_been), (("faithfully nudist")), (""));
    }
    if (!game.u.uconduct.food) {
        await enlght_line((You_), final ? ("went") : ("have gone"), (" without food"), (""));
    } else if (!game.u.uconduct.unvegan) {
        await enlght_line((You_), final ? ("") : (have), (("followed a strict vegan diet")), (""));
    } else if (!game.u.uconduct.unvegetarian) {
        await enlght_line((You_), final ? (were) : (have_been), (("vegetarian")), (""));
    }
    if (!game.u.uconduct.gnostic) {
        await enlght_line((You_), final ? (were) : (have_been), (("an atheist")), (""));
    }
    if (!game.u.uconduct.weaphit) {
        await enlght_line((You_), final ? (never) : (have_never), (("hit with a wielded weapon")), (""));
    } else if (game.flags.debug) {
        buf = sprintf(buf, "hit with a wielded weapon %ld time%s", game.u.uconduct.weaphit, (((game.u.uconduct.weaphit) == 1) ? "" : "s"));
        await enlght_line((You_), final ? ("") : (have), ((buf)), (""));
    }
    if (!game.u.uconduct.killer) {
        await enlght_line((You_), final ? (were) : (have_been), (("a pacifist")), (""));
    }
    if (!game.u.uconduct.literate) {
        await enlght_line((You_), final ? (were) : (have_been), (("illiterate")), (""));
    } else if (game.flags.debug) {
        buf = sprintf(buf, "read items or engraved %ld time%s", game.u.uconduct.literate, (((game.u.uconduct.literate) == 1) ? "" : "s"));
        await enlght_line((You_), final ? ("") : (have), ((buf)), (""));
    }
    if (!game.u.uconduct.pets) {
        await enlght_line((You_), final ? (never) : (have_never), (("had a pet")), (""));
    }
    ngenocided = await num_genocides();
    if (ngenocided == 0) {
        await enlght_line((You_), final ? (never) : (have_never), (("genocided any monsters")), (""));
    } else {
        buf = sprintf(buf, "genocided %d type%s of monster%s", ngenocided, (((ngenocided) == 1) ? "" : "s"), (((ngenocided) == 1) ? "" : "s"));
        await enlght_line((You_), final ? ("") : (have), ((buf)), (""));
    }
    if (!game.u.uconduct.polypiles) {
        await enlght_line((You_), final ? (never) : (have_never), (("polymorphed an object")), (""));
    } else if (game.flags.debug) {
        buf = sprintf(buf, "polymorphed %ld item%s", game.u.uconduct.polypiles, (((game.u.uconduct.polypiles) == 1) ? "" : "s"));
        await enlght_line((You_), final ? ("") : (have), ((buf)), (""));
    }
    if (!game.u.uconduct.polyselfs) {
        await enlght_line((You_), final ? (never) : (have_never), (("changed form")), (""));
    } else if (game.flags.debug) {
        buf = sprintf(buf, "changed form %ld time%s", game.u.uconduct.polyselfs, (((game.u.uconduct.polyselfs) == 1) ? "" : "s"));
        await enlght_line((You_), final ? ("") : (have), ((buf)), (""));
    }
    if (!game.u.uconduct.wishes) {
        await enlght_line((You_), final ? ("") : (have), (("used no wishes")), (""));
    } else {
        buf = sprintf(buf, "used %ld wish%s", game.u.uconduct.wishes, (game.u.uconduct.wishes > 1) ? "es" : "");
        if (game.u.uconduct.wisharti) {
            /* if wisharti == wishes
             *  1 wish (for an artifact)
             *  2 wishes (both for artifacts)
             *  N wishes (all for artifacts)
             * else (N is at least 2 in order to get here; M < N)
             *  N wishes (1 for an artifact)
             *  N wishes (M for artifacts)
             */
            if (game.u.uconduct.wisharti == game.u.uconduct.wishes) {
                buf = __nh_buf_append(buf, sprintf('', " (%s", (game.u.uconduct.wisharti > 2) ? "all " : (game.u.uconduct.wisharti == 2) ? "both " : ""));
            } else {
                buf = __nh_buf_append(buf, sprintf('', " (%ld ", game.u.uconduct.wisharti));
            }
            buf = __nh_buf_append(buf, sprintf('', "for %s)", (game.u.uconduct.wisharti == 1) ? "an artifact" : "artifacts"));
        }
        await enlght_line((You_), final ? ("") : (have), ((buf)), (""));
        if (!game.u.uconduct.wisharti) {
            await enlght_line((You_), final ? ("did not wish") : ("have not wished"), (" for any artifacts"), (""));
        }
    }
    if (sokoban_in_play()) {
        /* only report Sokoban conduct if the Sokoban branch has been entered */
        let presentverb = "have violated";
        let pastverb = "violated";
        if (!game.u.uconduct.sokocheat) {
            presentverb = "have not violated";
            pastverb = "did not violate";
            buf = strcpy(buf, " any of the special Sokoban rules");
        } else {
            buf = strcpy(buf, " the special Sokoban rules ");
            buf = strcat(buf, N_times(game.u.uconduct.sokocheat, bufN));
        }
        await enlght_line((You_), final ? (pastverb) : (presentverb), (buf), (""));
    }
    await show_achievements(final);
    await (game.windowprocs.win_display_nhwindow)(game.en_win, (1));
    (game.windowprocs.win_destroy_nhwindow)(game.en_win);
    game.en_win = (-1);
}
/*
 *      Achievements (see 'enum achievements' in you.h).
 */
/* 'final' is used "behind the curtain" by enl_foo() macros */
export async function show_achievements(final) {
    let i = 0;
    let achidx = 0;
    let absidx = 0;
    let acnt = 0;
    let title = '';
    let buf = '';
    let awin = (-1);
    /* unfortunately we can't show the achievements (at least not all of
       them) while the game is in progress because it would give away the
       ID of luckstone (at Mine's End) and of real Amulet of Yendor */
    if (!final && !game.flags.debug) {
        return;
    }
    /* first, figure whether any achievements have been accomplished
       so that we don't show the header for them if the resulting list
       below it would be empty */
    if ((acnt = count_achievements()) == 0) {
        return;
    }
    if (game.en_win != (-1)) {
        /* end of game disclosure window */
        awin = game.en_win;
        (game.windowprocs.win_putstr)(awin, 0, "");
    } else {
        awin = (game.windowprocs.win_create_nhwindow)(4);
    }
    title = sprintf(title, "Achievement%s:", (((acnt) == 1) ? "" : "s"));
    (game.windowprocs.win_putstr)(awin, 0, title);
    if (remove_achievement(ACH_UWIN)) {
        if (remove_achievement(ACH_AMUL)) {
            await record_achievement(ACH_AMUL);
        }
        await record_achievement(ACH_UWIN);
    }
    for (i = 0; i < acnt; ++i) {
        achidx = game.u.uachieved[i];
        absidx = abs(achidx);
        switch (absidx) {
            case ACH_BLND:
                await enlght_line((You_), final ? ("explored") : ("are exploring"), (" without being able to see"), (""));
                break;
            case ACH_NUDE:
                await enlght_line((You_), final ? ("went") : ("have gone"), (" without any armor"), (""));
                break;
            case ACH_MINE:
                await enlght_line((You_), final ? ("") : (have), (("entered the Gnomish Mines")), (""));
                break;
            case ACH_TOWN:
                await enlght_line((You_), final ? ("") : (have), (("entered Minetown")), (""));
                break;
            case ACH_SHOP:
                await enlght_line((You_), final ? ("") : (have), (("entered a shop")), (""));
                break;
            case ACH_TMPL:
                await enlght_line((You_), final ? ("") : (have), (("entered a temple")), (""));
                break;
            case ACH_ORCL:
                await enlght_line((You_), final ? ("") : (have), (("consulted the Oracle of Delphi")), (""));
                break;
            case ACH_NOVL:
                await enlght_line((You_), final ? ("") : (have), (("read from a Discworld novel")), (""));
                break;
            case ACH_SOKO:
                await enlght_line((You_), final ? ("") : (have), (("entered Sokoban")), (""));
                break;
            /* hard to reach guaranteed bag or amulet */
            case ACH_SOKO_PRIZE:
                await enlght_line((You_), final ? ("") : (have), (("completed Sokoban")), (""));
                break;
            /* hidden guaranteed luckstone */
            case ACH_MINE_PRIZE:
                await enlght_line((You_), final ? ("") : (have), (("completed the Gnomish Mines")), (""));
                break;
            case ACH_BGRM:
                await enlght_line((You_), final ? ("") : (have), (("entered the Big Room")), (""));
                break;
            case ACH_MEDU:
                await enlght_line((You_), final ? ("") : (have), (("defeated Medusa")), (""));
                break;
            case ACH_TUNE:
                await enlght_line((You_), final ? ("") : (have), (("learned the tune to open and close the Castle's drawbridge")), (""));
                break;
            case ACH_BELL:
                await enlght_line((You_), final ? (game.u.uhave.bell ? "had" : "handled") : (game.u.uhave.bell ? "have" : "have handled"), (" the Bell of Opening"), (""));
                break;
            case ACH_HELL:
                await enlght_line((You_), final ? ("") : ("have "), ("entered Gehennom"), (""));
                break;
            case ACH_CNDL:
                await enlght_line((You_), final ? (game.u.uhave.menorah ? "had" : "handled") : (game.u.uhave.menorah ? "have" : "have handled"), (" the Candelabrum of Invocation"), (""));
                break;
            case ACH_BOOK:
                await enlght_line((You_), final ? (game.u.uhave.book ? "had" : "handled") : (game.u.uhave.book ? "have" : "have handled"), (" the Book of the Dead"), (""));
                break;
            case ACH_INVK:
                await enlght_line((You_), final ? ("") : (have), (("gained access to Moloch's Sanctum")), (""));
                break;
            case ACH_AMUL:
                await enlght_line((You_), final ? (game.u.uevent.ascended ? "delivered" : game.u.uhave.amulet ? "had" : "had obtained") : (game.u.uhave.amulet ? "have" : "have obtained"), (" the Amulet of Yendor"), (""));
                break;
            /* reaching Astral makes feedback about reaching the Planes
           be redundant and ascending makes both be redundant, but
           we display all that apply */
            case ACH_ENDG:
                await enlght_line((You_), final ? ("") : (have), (("reached the Elemental Planes")), (""));
                break;
            case ACH_ASTR:
                await enlght_line((You_), final ? ("") : (have), (("reached the Astral Plane")), (""));
                break;
            case ACH_UWIN:
                await enlght_out(" You ascended!");
                break;
            /* rank 0 is the starting condition, not an achievement; 8 is Xp 30 */
            case ACH_RNK1:
            case ACH_RNK2:
            case ACH_RNK3:
            case ACH_RNK4:
            case ACH_RNK5:
            case ACH_RNK6:
            case ACH_RNK7:
            case ACH_RNK8:
                buf = sprintf(buf, "attained the rank of %s", rank_of(rank_to_xlev(absidx - (ACH_RNK1 - 1)), (game.urole.mnum), (achidx < 0) ? (1) : (0)));
                await enlght_line((You_), final ? ("") : (have), ((buf)), (""));
                break;
            default:
                buf = sprintf(buf, " [Unexpected achievement #%d.]", achidx);
                await enlght_out(buf);
                break;
        }
    }
    if (awin != game.en_win) {
        await (game.windowprocs.win_display_nhwindow)(awin, (1));
        (game.windowprocs.win_destroy_nhwindow)(awin);
    }
}
/* record an achievement (add at end of list unless already present) */
export async function record_achievement(achidx) {
    let i = 0;
    let absidx = 0;
    let repeat_achievement = 0;
    absidx = abs(achidx);
    if ((achidx < 1 && (absidx < ACH_RNK1 || absidx > ACH_RNK8)) || achidx >= N_ACH) {
        await impossible("Achievement #%d is out of range.", achidx);
        return;
    }
    for (i = 0; game.u.uachieved[i]; ++i) {
        if (abs(game.u.uachieved[i]) == absidx) {
            /* the list has an extra slot so there is always at least one 0 at
       its end (more than one unless all N_ACH-1 possible achievements
       have been recorded); find first empty slot or achievement #achidx;
       an attempt to duplicate an achievement can happen if any of Bell,
       Candelabrum, Book, or Amulet is dropped then picked up again */
            repeat_achievement = 1;
            break;
        }
    }
    ;
    /*
     * We do the sound for an achievement, even if it has already been
     * achieved before. Some players might have set up level-based
     * theme music or something. We do let the sound interface know
     * that it's not the original achievement though.
     */
    if (repeat_achievement) {
        return;
    }
    /* already recorded, don't duplicate it */
    game.u.uachieved[i] = achidx;
    /* avoid livelog for achievements recorded during final disclosure:
       nudist and blind-from-birth; also ascension which is suppressed
       by this gets logged separately in really_done() */
    if (game.program_state.gameover) {
        return;
    }
    if (absidx >= ACH_RNK1 && absidx <= ACH_RNK8) {
        livelog_printf(game.achieve_msg[absidx].llflag, "attained the rank of %s (level %d)", rank_of(rank_to_xlev(absidx - (ACH_RNK1 - 1)), (game.urole.mnum), (achidx < 0) ? (1) : (0)), game.u.ulevel);
    } else if (achidx == ACH_SOKO_PRIZE || achidx == ACH_MINE_PRIZE) {
        /* need to supply extra information for these two */
        let otyp = ((achidx == ACH_SOKO_PRIZE) ? game.context.achieveo.soko_prize_otyp : game.context.achieveo.mines_prize_otyp);
        /* note: OBJ_NAME() works here because both "bag of holding" and
           "amulet of reflection" are fully named in their objects[] entry
           but that's not true in the general case */
        livelog_printf(game.achieve_msg[achidx].llflag, "%s %s", game.achieve_msg[achidx].msg, (game.obj_descr[(game.objects[otyp]).oc_name_idx].oc_name));
    } else {
        livelog_printf(game.achieve_msg[absidx].llflag, "%s", game.achieve_msg[absidx].msg);
    }
}
/* discard a recorded achievement; return True if removed, False otherwise */
export function remove_achievement(achidx) {
    let i = 0;
    for (i = 0; game.u.uachieved[i]; ++i) {
        if (abs(game.u.uachieved[i]) == abs(achidx)) {
            break;
        }
    }
    if (!game.u.uachieved[i]) {
        return (0);
    }
    /* list is 0 terminated so any beyond the removed one move up a slot */
    do {
        game.u.uachieved[i] = game.u.uachieved[i + 1];
    } while (game.u.uachieved[++i]);
    return (1);
}
/* used to decide whether there are any achievements to display */
export function count_achievements() {
    let i = 0;
    let acnt = 0;
    for (i = 0; game.u.uachieved[i]; ++i) {
        ++acnt;
    }
    return acnt;
}
/* convert a rank index to an achievement number; encode it when female
   in order to subsequently report gender-specific ranks accurately */
/* 1..8 */
export function achieve_rank(rank) {
    let achidx = ((rank - 1) + ACH_RNK1);
    if (game.flags.female) {
        achidx = -achidx;
    }
    return achidx;
}
/* return True if sokoban branch has been entered, False otherwise */
export function sokoban_in_play() {
    let achidx = 0;
    /* TODO? move this to dungeon.c and test furthest level reached of the
       sokoban branch instead of relying on the entered-sokoban achievement */
    for (achidx = 0; game.u.uachieved[achidx]; ++achidx) {
        if (game.u.uachieved[achidx] == ACH_SOKO) {
            return (1);
        }
    }
    return (0);
}
/* #chronicle command */
export async function do_gamelog() {
    if (game.gamelog) {
        await show_gamelog(0);
    } else {
        await pline("No chronicled events.");
    }
    return 0;
}
/* 'major' events for dumplog; inclusion or exclusion here may need tuning */
/* explicitly for dumplog */
/* #chronicle details */
export async function show_gamelog(final) {
    let llmsg = null;
    let win = 0;
    let buf = '';
    let eventcnt = 0;
    win = (game.windowprocs.win_create_nhwindow)(5);
    buf = sprintf(buf, "%s events:", final ? "Major" : "Logged");
    (game.windowprocs.win_putstr)(win, 0, buf);
    for (llmsg = game.gamelog; llmsg; llmsg = llmsg.next) {
        if (final && !(((llmsg).flags & (0 | 1 | 2 | 4 | 8 | 16 | 64 | 128 | 16384)) != 0)) {
            continue;
        }
        if (!final && !game.flags.debug && (((llmsg).flags & 8192) != 0)) {
            continue;
        }
        if (!eventcnt++) {
            (game.windowprocs.win_putstr)(win, 0, " Turn");
        }
        buf = nh_snprintf("show_gamelog", 2579, buf, 256 /* sizeof(char [256]) */, "%5ld: %s", llmsg.turn, llmsg.text);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    /* since start of game is logged as a major event, 'eventcnt' should
       never end up as 0; for 'final', end of game is a major event too */
    if (!eventcnt) {
        (game.windowprocs.win_putstr)(win, 0, " none");
    }
    await (game.windowprocs.win_display_nhwindow)(win, (1));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return;
}
/*
 *      Vanquished monsters.
 */
/* the two uppercase choices are implemented but suppressed from menu.
   also used in options.c */
export const vanqorders = [["t", "traditional: by monster level", "traditional: by monster level, by internal monster index"], ["d", "by monster difficulty rating", "by monster difficulty rating, by internal monster index"], ["a", "alphabetically, unique monsters separate", "alphabetically, first unique monsters, then others"], ["A", "alphabetically, unique monsters intermixed", "alphabetically, unique monsters and others intermixed"], ["C", "by monster class, high to low level in class", "by monster class, high to low level within class"], ["c", "by monster class, low to high level in class", "by monster class, low to high level within class"], ["n", "by count, high to low", "by count, high to low, by internal index within tied count"], ["z", "by count, low to high", "by count, low to high, by internal index within tied count"]];
const __vanqsort_cmp_punctclasses = [S_LIZARD, S_EEL, S_GOLEM, S_GHOST, S_DEMON, S_HUMAN, 0];
export function vanqsort_cmp(vptr1, vptr2) {
    let indx1 = vptr1;
    let indx2 = vptr2;
    let mlev1 = 0;
    let mlev2 = 0;
    let mstr1 = 0;
    let mstr2 = 0;
    let uniq1 = 0;
    let uniq2 = 0;
    let died1 = 0;
    let died2 = 0;
    let res = 0;
    let name1 = null;
    let name2 = null;
    let punct = null;
    let mcls1 = 0;
    let mcls2 = 0;
    switch (game.flags.vanq_sortmode) {
        default:
        case VANQ_MLVL_MNDX:
            mlev1 = game.mons[indx1].mlevel;
            mlev2 = game.mons[indx2].mlevel;
            res = mlev2 - mlev1;
            break;
        case VANQ_MSTR_MNDX:
            mstr1 = game.mons[indx1].difficulty;
            mstr2 = game.mons[indx2].difficulty;
            res = mstr2 - mstr1;
            break;
        case VANQ_ALPHA_SEP:
            uniq1 = ((game.mons[indx1].geno & 4096) && indx1 != PM_HIGH_CLERIC);
            uniq2 = ((game.mons[indx2].geno & 4096) && indx2 != PM_HIGH_CLERIC);
            if (uniq1 ^ uniq2) {
                /* sort by monster toughness */
                /* one or other uniq, but not both */
                res = uniq2 - uniq1;
                break;
            }
            ;
        case VANQ_ALPHA_MIX:
            name1 = game.mons[indx1].pmnames[NEUTRAL];
            name2 = game.mons[indx2].pmnames[NEUTRAL];
            /* caseblind alpha, low to high */
            res = strncmpi((name1), (name2), -1);
            break;
        case VANQ_MCLS_HTOL:
        case VANQ_MCLS_LTOH:
            mcls1 = game.mons[indx1].mlet;
            mcls2 = game.mons[indx2].mlet;
            if (mcls1 > S_ZOMBIE && mcls2 > S_ZOMBIE) {
                /* else both unique or neither unique */
                /* mons[].mlet is a small integer, 1..N, of type plain char;
           if 'char' happens to be unsigned, (mlet1 - mlet2) would yield
           an inappropriate result when mlet2 is greater than mlet1,
           so force our copies (mcls1, mcls2) to be signed */
                /* S_ANT through S_ZRUTY correspond to lowercase monster classes,
           S_ANGEL through S_ZOMBIE correspond to uppercase, and various
           punctuation characters are used for classes beyond those */
                /* force a specific order to the punctuation classes that's
               different from the internal order;
               internal order is ok if neither or just one is punctuation
               since letters have lower values so come out before punct */
                if ((punct = strchr(__vanqsort_cmp_punctclasses, mcls1)) != null) {
                    mcls1 = (S_ZOMBIE + 1 + ((__vanqsort_cmp_punctclasses.length - punct.length)));
                }
                if ((punct = strchr(__vanqsort_cmp_punctclasses, mcls2)) != null) {
                    mcls2 = (S_ZOMBIE + 1 + ((__vanqsort_cmp_punctclasses.length - punct.length)));
                }
            }
            res = mcls1 - mcls2;
            if (res == 0) {
                /* Riders are in the same class as major demons, yielding res==0
               above when both mcls1 and mcls2 are either Riders or demons or
               one of each; force Riders to be sorted before demons */
                res = ((game.mons[indx2]) == game.mons[PM_DEATH] || (game.mons[indx2]) == game.mons[PM_FAMINE] || (game.mons[indx2]) == game.mons[PM_PESTILENCE]) - ((game.mons[indx1]) == game.mons[PM_DEATH] || (game.mons[indx1]) == game.mons[PM_FAMINE] || (game.mons[indx1]) == game.mons[PM_PESTILENCE]);
                /* res -1 => #1 is a Rider, #2 isn't;
                    0 => both Riders or neither;
                   +1 => #2 is a Rider, #1 isn't */
                if (res) {
                    break;
                }
                mlev1 = game.mons[indx1].mlevel;
                mlev2 = game.mons[indx2].mlevel;
                res = mlev1 - mlev2;
                if (game.flags.vanq_sortmode == VANQ_MCLS_HTOL) {
                    res = -res;
                }
            }
            break;
        case VANQ_COUNT_H_L:
        case VANQ_COUNT_L_H:
            died1 = game.mvitals[indx1].died;
            died2 = game.mvitals[indx2].died;
            res = died2 - died1;
            if (game.flags.vanq_sortmode == VANQ_COUNT_L_H) {
                res = -res;
            }
            break;
    }
    /* tiebreaker: internal mons[] index */
    if (res == 0) {
        res = indx1 - indx2;
    }
    return res;
}
/* returns -1 if cancelled via ESC */
export async function set_vanq_order(for_vanq) {
    let tmpwin = 0;
    let selected = null;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let buf = '';
    let desc = null;
    let i = 0;
    let n = 0;
    let choice = 0;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(8 /* sizeof(const char *const [8][3]) */ / 3 /* sizeof(const char *const [3]) */)); i++) {
        if (i == VANQ_ALPHA_MIX || i == VANQ_MCLS_HTOL) {
            continue;
        }
        /* suppress some orderings if this menu if for 'm #genocided' */
        if (!for_vanq && (i == VANQ_COUNT_H_L || i == VANQ_COUNT_L_H)) {
            continue;
        }
        desc = vanqorders[i][2];
        /* unique monsters can't be genocided so "alpha, unique separate"
           and "alpha, unique intermixed" are confusing descriptions when
           this menu is for #genocided rather than for #vanquished */
        if (!for_vanq && i == VANQ_ALPHA_SEP) {
            desc = "alphabetically";
        }
        any.a_int = i + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, vanqorders[i][0], 0, 0, clr, desc, (i == game.flags.vanq_sortmode) ? 1 : 0);
    }
    buf = sprintf(buf, "Sort order for %s", for_vanq ? "vanquished monster counts (also genocided types)" : "genocided monster types (also vanquished counts)");
    (game.windowprocs.win_end_menu)(tmpwin, buf);
    { const __selbox = { value: null }; n = await select_menu(tmpwin, 1, __selbox); selected = __selbox.value; }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (n > 0) {
        choice = selected[0].item.a_int - 1;
        /* skip preselected entry if we have more than one item chosen */
        if (n > 1 && choice == game.flags.vanq_sortmode) {
            choice = selected[1].item.a_int - 1;
        }
        free(selected);
        game.flags.vanq_sortmode = choice;
    }
    return (n < 0) ? -1 : game.flags.vanq_sortmode;
}
/* #vanquished command */
export async function dovanquished() {
    await list_vanquished(game.iflags.menu_requested ? 65 : 121, (0));
    game.iflags.menu_requested = (0);
    return 0;
}
/* high priests aren't unique but are flagged as such to simplify something */
/* used for #vanquished and end of game disclosure and end of game dumplog */
export async function list_vanquished(defquery, ask) {
    let i = 0;
    let pfx = 0;
    let nkilled = 0;
    let ntypes = 0;
    let ni = 0;
    let total_killed = 0;
    let klwin = 0;
    let mindx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let c = 0;
    let buf = '';
    let buftoo = '';
    /* 'A' is only supplied by 'm #vanquished'; 'd' is only supplied by
       dump_everything() when writing dumplog, so won't happen if built
       without '#define DUMPLOG' but there's no need for conditionals here */
    let force_sort = (defquery == 65);
    let dumping = (defquery == 100);
    if (force_sort) {
        await set_vanq_order((1));
    }
    if (dumping || force_sort) {
        /* switch from 'A' or 'd' to 'y'; 'ask' is already False for the
           cases that might supply 'A' or 'd' */
        defquery = 121;
        ask = (0);
    }
    ntypes = 0;
    for (i = LOW_PM; i < NUMMONS; i++) {
        if ((nkilled = game.mvitals[i].died) == 0) {
            continue;
        }
        mindx[ntypes++] = i;
        total_killed += nkilled;
    }
    if (ntypes != 0) {
        /* vanquished creatures list;
     * includes all dead monsters, not just those killed by the player
     */
        /* used as small integer, not character */
        let mlet = 0;
        let prev_mlet = 0;
        let class_header = 0;
        let uniq_header = 0;
        let Rider = 0;
        let was_uniq = (0);
        let special_hdr = (0);
        if (ask) {
            let allow_yn = '';
            if (ntypes > 1) {
                allow_yn = strcpy(allow_yn, ynaqchars);
            } else {
                allow_yn = strcpy(allow_yn, ynqchars);
                allow_yn = strcat(allow_yn, "\x1ba");
                /* allow user to answer 'a' */
                /* potential default from 'disclose' */
                if (defquery == 97) {
                    defquery = 121;
                }
            }
            c = await yn_function("Do you want an account of creatures vanquished?", allow_yn, defquery, (1));
        } else {
            c = defquery;
        }
        if (c == 113) {
            game.program_state.stopprint++;
        }
        /*
     * For end-of-game disclosure, we're only called when some monsters
     * were vanquished and won't reach these 'else-if's.
     *
     * If no monsters have been vanquished, we're either called for game
     * still in progress, so use present tense via pline(), or for dumplog
     * which needs putstr() and past tense.
     */
        if (c == 121 || c == 97) {
            if (c == 97 && ntypes > 1) {
                if (await set_vanq_order((1)) < 0) {
                    return;
                }
            }
            uniq_header = (game.flags.vanq_sortmode == VANQ_ALPHA_SEP);
            class_header = ((game.flags.vanq_sortmode == VANQ_MCLS_LTOH || game.flags.vanq_sortmode == VANQ_MCLS_HTOL) && ntypes > 1);
            klwin = (game.windowprocs.win_create_nhwindow)(4);
            (game.windowprocs.win_putstr)(klwin, 0, "Vanquished creatures:");
            if (!dumping) {
                (game.windowprocs.win_putstr)(klwin, 0, "");
            }
            await qsort_async(mindx, ntypes, 2 /* sizeof(short) */, vanqsort_cmp);
            for (ni = 0; ni < ntypes; ni++) {
                i = mindx[ni];
                nkilled = game.mvitals[i].died;
                Rider = ((game.mons[i]) == game.mons[PM_DEATH] || (game.mons[i]) == game.mons[PM_FAMINE] || (game.mons[i]) == game.mons[PM_PESTILENCE]);
                mlet = game.mons[i].mlet;
                if (class_header && (mlet != prev_mlet || (special_hdr && !Rider))) {
                    if (!Rider) {
                        buf = strcpy(buf, def_monsyms[mlet].explain);
                        special_hdr = (0);
                    } else {
                        buf = strcpy(buf, "Rider");
                        special_hdr = (1);
                    }
                    (game.windowprocs.win_putstr)(klwin, ask ? 0 : game.iflags.menu_headings.attr, upstart(buf));
                    prev_mlet = mlet;
                }
                /* uniques can't be genocided but can become extinct;
           however, they're never reported as extinct, so skip them */
                if (((game.mons[i].geno & 4096) != 0 && i != PM_HIGH_CLERIC)) {
                    buf = sprintf(buf, "%s%s", !(((game.mons[i]).mflags2 & 524288) != 0) ? "the " : "", game.mons[i].pmnames[NEUTRAL]);
                    if (nkilled > 1) {
                        buf = __nh_buf_append(buf, sprintf('', " (%s)", N_times(nkilled, buftoo)));
                    }
                    was_uniq = (1);
                } else {
                    if (uniq_header && was_uniq) {
                        (game.windowprocs.win_putstr)(klwin, 0, "");
                        /* 'ask' implies final disclosure, where highlighting
                       of various header lines is suppressed */
                        was_uniq = (0);
                    }
                    if (nkilled == 1) {
                        buf = strcpy(buf, await an(game.mons[i].pmnames[NEUTRAL]));
                    } else {
                        buf = sprintf(buf, "%3d %s", nkilled, await makeplural(game.mons[i].pmnames[NEUTRAL]));
                    }
                }
                /* number of leading spaces to match 3 digit prefix */
                pfx = !strncmpi(buf, "the ", 4) ? 0 : !strncmpi(buf, "an ", 3) ? 1 : !strncmpi(buf, "a ", 2) ? 2 : !digit(__nh_char_at0(__nh_advance_str(buf, 2))) ? 4 : 0;
                if (class_header) {
                    ++pfx;
                }
                buftoo = nh_snprintf("list_vanquished", 2916, buftoo, 256 /* sizeof(char [256]) */, "%*s%s", pfx, "", buf);
                (game.windowprocs.win_putstr)(klwin, 0, buftoo);
            }
            if (ntypes > 1) {
                /*
             * if (Hallucination)
             *     putstr(klwin, 0, "and a partridge in a pear tree");
             */
                if (!dumping) {
                    (game.windowprocs.win_putstr)(klwin, 0, "");
                }
                buf = sprintf(buf, "%ld creatures vanquished.", total_killed);
                (game.windowprocs.win_putstr)(klwin, 0, buf);
            }
            await (game.windowprocs.win_display_nhwindow)(klwin, (1));
            (game.windowprocs.win_destroy_nhwindow)(klwin);
        }
    } else if (!game.program_state.gameover) {
        await pline("No creatures have been vanquished.");
    }
}
/* number of monster species which have been genocided */
export async function num_genocides() {
    let i = 0;
    let n = 0;
    for (i = LOW_PM; i < NUMMONS; ++i) {
        if (game.mvitals[i].mvflags & 2) {
            ++n;
            if (((game.mons[i].geno & 4096) != 0 && i != PM_HIGH_CLERIC)) {
                await impossible("unique creature '%d: %s' genocided?", i, game.mons[i].pmnames[NEUTRAL]);
            }
        }
    }
    return n;
}
/* return a count of the number of extinct species */
export function num_extinct() {
    let i = 0;
    let n = 0;
    for (i = LOW_PM; i < NUMMONS; ++i) {
        if (((game.mons[i].geno & 4096) != 0 && i != PM_HIGH_CLERIC)) {
            continue;
        }
        if ((game.mvitals[i].mvflags & (2 | 1)) == 1) {
            ++n;
        }
    }
    return n;
}
/* collect both genocides and extinctions, skipping uniques */
export function num_gone(mvflags, mindx) {
    let mflg = mvflags;
    let i = 0;
    let n = 0;
    memset(mindx, 0, NUMMONS * 4 /* sizeof(int) */);
    for (i = LOW_PM; i < NUMMONS; ++i) {
        if (((game.mons[i].geno & 4096) != 0 && i != PM_HIGH_CLERIC)) {
            continue;
        }
        if ((game.mvitals[i].mvflags & mflg) != 0) {
            mindx[n++] = i;
        }
    }
    return n;
}
/* show genocided and extinct monster types for final disclosure/dumplog
   or for the #genocided command */
export async function list_genocided(defquery, ask) {
    let i = 0;
    let mndx = 0;
    let ngenocided = 0;
    let nextinct = 0;
    let ngone = 0;
    let mvflags = 0;
    let mindx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let c = 0;
    let klwin = 0;
    let buf = '';
    /* prompting for genocide or class genocide */
    let genoing = 0;
    let dumping = 0;
    /* for DUMPLOG; doesn't need to be conditional */
    let both = (game.program_state.gameover || game.flags.debug || game.flags.explore);
    dumping = (defquery == 100);
    genoing = (defquery == 103);
    if (dumping || genoing) {
        defquery = 121;
    }
    if (genoing) {
        both = (0);
    }
    ngenocided = await num_genocides();
    nextinct = both ? num_extinct() : 0;
    mvflags = 2 | (both ? 1 : 0);
    ngone = num_gone(mvflags, mindx);
    if (ngone > 0) {
        buf = sprintf(buf, "Do you want a list of %sspecies%s%s?", (nextinct && !ngenocided) ? "extinct " : "", (ngenocided) ? " genocided" : "", (nextinct && ngenocided) ? " and extinct" : "");
        c = ask ? await yn_function(buf, (ngone > 1) ? "ynaq" : "ynq\x1ba", defquery, (1)) : defquery;
        if (c == 113) {
            game.program_state.stopprint++;
        }
        if (c == 121 || c == 97) {
            /* genocided or extinct species list */
            let save_sortmode = 0;
            let mlet = 0;
            let prev_mlet = 0;
            let class_header = (0);
            if (ngone > 1) {
                if (c == 97) {
                    if (await set_vanq_order((0)) < 0) {
                        return;
                    }
                }
                /* sort orderings count-high-to-low or count-low-to-high
                   don't make sense for genocides; if the preferred order
                   to set to either of those, use alphabetical instead;
                   note: the tie breaker for by-class is level-high-to-low
                   or level-low-to-high rather than count so is ok as-is */
                save_sortmode = game.flags.vanq_sortmode;
                if (game.flags.vanq_sortmode == VANQ_COUNT_H_L || game.flags.vanq_sortmode == VANQ_COUNT_L_H) {
                    game.flags.vanq_sortmode = VANQ_ALPHA_MIX;
                }
                await qsort_async(mindx, ngone, 4 /* sizeof(int) */, vanqsort_cmp);
                class_header = (game.flags.vanq_sortmode == VANQ_MCLS_LTOH || game.flags.vanq_sortmode == VANQ_MCLS_HTOL);
                game.flags.vanq_sortmode = save_sortmode;
            }
            klwin = (game.windowprocs.win_create_nhwindow)(4);
            buf = sprintf(buf, "%s%s species:", (ngenocided) ? "Genocided" : "Extinct", (nextinct && ngenocided) ? " or extinct" : "");
            (game.windowprocs.win_putstr)(klwin, 0, buf);
            if (!dumping) {
                (game.windowprocs.win_putstr)(klwin, 0, "");
            }
            for (i = 0; i < ngone; ++i) {
                mndx = mindx[i];
                mlet = game.mons[mndx].mlet;
                if (class_header && mlet != prev_mlet) {
                    buf = strcpy(buf, def_monsyms[mlet].explain);
                    (game.windowprocs.win_putstr)(klwin, ask ? 0 : game.iflags.menu_headings.attr, upstart(buf));
                    prev_mlet = mlet;
                }
                buf = sprintf(buf, " %s", await makeplural(game.mons[mndx].pmnames[NEUTRAL]));
                /*
                 * "Extinct" is unfortunate terminology.  A species
                 * is marked extinct when its birth limit is reached,
                 * but there might be members of the species still
                 * alive, contradicting the meaning of the word.
                 *
                 * We only append "(extinct)" if the G_GENOD bit is
                 * clear.  During normal play, 'mndx' won't be in the
                 * collected list unless that bit is set.
                 */
                if ((game.mvitals[mndx].mvflags & (2 | 1)) == 1) {
                    buf = strcat(buf, " (extinct)");
                }
                (game.windowprocs.win_putstr)(klwin, 0, buf);
            }
            if (!dumping) {
                (game.windowprocs.win_putstr)(klwin, 0, "");
            }
            if (ngenocided > 0) {
                buf = sprintf(buf, "%d species genocided.", ngenocided);
                (game.windowprocs.win_putstr)(klwin, 0, buf);
            }
            if (nextinct > 0) {
                buf = sprintf(buf, "%d species extinct.", nextinct);
                (game.windowprocs.win_putstr)(klwin, 0, buf);
            }
            await (game.windowprocs.win_display_nhwindow)(klwin, (1));
            (game.windowprocs.win_destroy_nhwindow)(klwin);
        }
    } else if (!game.program_state.gameover) {
        await pline("No creatures have been genocided%s.", genoing ? " yet" : "");
    }
}
/* M-g - #genocided command */
export async function dogenocided() {
    await list_genocided(game.iflags.menu_requested ? 97 : 121, (0));
    return 0;
}
/* #wizborn extended command */
const __doborn_fmt = "%4i %4i %c %-30s";
export async function doborn() {
    let i = 0;
    let datawin = (game.windowprocs.win_create_nhwindow)(5);
    let buf = '';
    let nborn = 0;
    let ndied = 0;
    (game.windowprocs.win_putstr)(datawin, 0, "died born");
    for (i = LOW_PM; i < NUMMONS; i++) {
        if (game.mvitals[i].born || game.mvitals[i].died || (game.mvitals[i].mvflags & (2 | 1)) != 0) {
            buf = sprintf(buf, __doborn_fmt, game.mvitals[i].died, game.mvitals[i].born, ((game.mvitals[i].mvflags & (2 | 1)) == 1) ? 69 : ((game.mvitals[i].mvflags & (2 | 1)) == 2) ? 71 : ((game.mvitals[i].mvflags & (2 | 1)) != 0) ? 88 : 32, game.mons[i].pmnames[NEUTRAL]);
            (game.windowprocs.win_putstr)(datawin, 0, buf);
            nborn += game.mvitals[i].born;
            ndied += game.mvitals[i].died;
        }
    }
    (game.windowprocs.win_putstr)(datawin, 0, "");
    buf = sprintf(buf, __doborn_fmt, ndied, nborn, 32, "");
    await (game.windowprocs.win_display_nhwindow)(datawin, (0));
    (game.windowprocs.win_destroy_nhwindow)(datawin);
    return 0;
}
/*
 * align_str(), piousness(), mstatusline() and ustatusline() once resided
 * in pline.c, then got moved to priest.c just to be out of there.  They
 * fit better here.
 */
export function align_str(alignment) {
    switch (alignment) {
        case (-1):
            return "chaotic";
        case 0:
            return "neutral";
        case 1:
            return "lawful";
        case (-128):
            return "unaligned";
    }
    return "unknown";
}
let __size_str_outbuf = '';
__nh_register_static(() => { __size_str_outbuf = ''; });
export function size_str(msize) {
    switch (msize) {
        case 0:
            __size_str_outbuf = strcpy(__size_str_outbuf, "tiny");
            break;
        case 1:
            __size_str_outbuf = strcpy(__size_str_outbuf, "small");
            break;
        case 2:
            __size_str_outbuf = strcpy(__size_str_outbuf, "medium");
            break;
        case 3:
            __size_str_outbuf = strcpy(__size_str_outbuf, "large");
            break;
        case 4:
            __size_str_outbuf = strcpy(__size_str_outbuf, "huge");
            break;
        case 7:
            __size_str_outbuf = strcpy(__size_str_outbuf, "gigantic");
            break;
        default:
            __size_str_outbuf = sprintf(__size_str_outbuf, "unknown size (%d)", msize);
            break;
    }
    return __size_str_outbuf;
}
/* used for self-probing */
let __piousness_buf = '';
__nh_register_static(() => { __piousness_buf = ''; });
export function piousness(showneg, suffix) {
    /* bigger than "insufficiently neutral" */
    let pio = null;
    if (game.u.ualign.record >= 20) {
        pio = "piously";
    } else if (game.u.ualign.record > 13) {
        pio = "devoutly";
    } else if (game.u.ualign.record > 8) {
        pio = "fervently";
    } else if (game.u.ualign.record > 3) {
        pio = "stridently";
    } else if (game.u.ualign.record == 3) {
        pio = "";
    } else if (game.u.ualign.record > 0) {
        pio = "haltingly";
    } else if (game.u.ualign.record == 0) {
        pio = "nominally";
    } else if (!showneg) {
        pio = "insufficiently";
    } else if (game.u.ualign.record >= -3) {
        pio = "strayed";
    } else if (game.u.ualign.record >= -8) {
        pio = "sinned";
    /* note: piousness 20 matches MIN_QUEST_ALIGN (quest.h) */
    } else {
        pio = "transgressed";
    }
    __piousness_buf = sprintf(__piousness_buf, "%s", pio);
    if (suffix && (!showneg || game.u.ualign.record >= 0)) {
        if (game.u.ualign.record != 3) {
            __piousness_buf = strcat(__piousness_buf, " ");
        }
        __piousness_buf = strcat(__piousness_buf, suffix);
    }
    return __piousness_buf;
}
/* stethoscope or probing applied to monster -- one-line feedback */
export async function mstatusline(mtmp) {
    let alignment = mon_aligntyp(mtmp);
    let info = '';
    let monnambuf = '';
    info = '';
    if (mtmp.mtame) {
        info = strcat(info, ", tame");
        if (game.flags.debug) {
            info = __nh_buf_append(info, sprintf('', " (%d", mtmp.mtame));
            if (!mtmp.isminion) {
                info = __nh_buf_append(info, sprintf('', "; hungry %ld; apport %d", ((mtmp).mextra.edog).hungrytime, ((mtmp).mextra.edog).apport));
            }
            info = strcat(info, ")");
        }
    } else if (mtmp.mpeaceful) {
        info = strcat(info, ", peaceful");
    }
    if (mtmp.data == game.mons[PM_LONG_WORM]) {
        let segndx = 0;
        let nsegs = count_wsegs(mtmp);
        /* the worm code internals don't consider the head to be one of
           the worm's segments, but we count it as such when presenting
           worm feedback to the player */
        if (!nsegs) {
            info = strcat(info, ", single segment");
        } else {
            /* include head in the segment count */
            ++nsegs;
            segndx = wseg_at(mtmp, game.bhitpos.x, game.bhitpos.y);
            info = __nh_buf_append(info, sprintf('', ", %d%s of %d segments", segndx, ordin(segndx), nsegs));
        }
    }
    if (((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS) && mtmp.data != game.mons[mtmp.cham]) {
        info = strcat(info, ", shapechanger");
    }
    /* pets eating mimic corpses mimic while eating, so this comes first */
    if (mtmp.meating) {
        info = strcat(info, ", eating");
    }
    /* a stethoscope exposes mimic before getting here so this
       won't be relevant for it, but wand of probing doesn't */
    if (mtmp.mundetected || mtmp.m_ap_type || visible_region_at(game.bhitpos.x, game.bhitpos.y)) {
        await mhidden_description(mtmp, 1 | 2 | 4 | 8, eos(info));
    }
    if (mtmp.mcan) {
        info = strcat(info, ", cancelled");
    }
    if (mtmp.mconf) {
        info = strcat(info, ", confused");
    }
    if (mtmp.mblinded || !mtmp.mcansee) {
        info = strcat(info, ", blind");
    }
    if (mtmp.mstun) {
        info = strcat(info, ", stunned");
    }
    if (mtmp.msleeping) {
        info = strcat(info, ", asleep");
    } else if (mtmp.mfrozen || !mtmp.mcanmove) {
        info = strcat(info, ", can't move");
    } else if ((mtmp.mstrategy & (268435456 | 536870912)) != 0) {
        info = strcat(info, ", meditating");
    }
    if (mtmp.mflee) {
        info = strcat(info, ", scared");
    }
    if (mtmp.mtrapped) {
        info = strcat(info, ", trapped");
    }
    if (mtmp.mspeed) {
        info = strcat(info, (mtmp.mspeed == 2) ? ", fast" : (mtmp.mspeed == 1) ? ", slow" : ", [? speed]");
    }
    if (mtmp.minvis) {
        info = strcat(info, ", invisible");
    }
    if (mtmp == game.u.ustuck) {
        /* unfortunately mfrozen covers temporary sleep and being busy
       * (donning armor, for instance) as well as paralysis */
        /* [arbitrary reason why it isn't moving] */
        let pm = game.u.ustuck.data;
        info = strcat(info, game.u.uswallow ? ((dmgtype_fromattack((pm), 26, 11) != null) ? ", digesting you" : ((((pm).mflags1 & 262144) != 0) && !(dmgtype_fromattack((pm), 28, 11) != null)) ? ", swallowing you" : ", engulfing you") : (!sticks(game.youmonst.data) ? ", holding you" : ", held by you"));
    }
    if (mtmp == game.u.usteed) {
        info = strcat(info, ", carrying you");
        if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic)) {
            /* being swallowed/engulfed takes priority over sticks(youmonst);
           this used to have that backwards and checked sticks() first */
            /* note: the "swallowing you" case won't
                                      happen because all animal engulfers
                                      either digest their victims (purple
                                      worm) or enfold them (trappers and
                                      lurkers above) */
            /* !u.uswallow; if both youmonst and ustuck are holders,
                        youmonst wins */
            /* EWounded_legs is used to track left/right/both rather than
               some form of extrinsic impairment; HWounded_legs is used for
               timeout; both apply to steed instead of hero when mounted */
            /* note: "goop" == "glop"; variation is intentional */
            let legs = (game.u.uprops[WOUNDED_LEGS].extrinsic & (131072 | 262144));
            let what = await mbodypart(mtmp, LEG);
            if (legs == (131072 | 262144)) {
                what = await makeplural(what);
            }
            /* when it's just one leg, ^X reports which, left or right;
           ustatusline() doesn't, in order to keep the output a bit shorter */
            info = __nh_buf_append(info, sprintf('', ", injured %s", what));
        }
    }
    if (mtmp.mleashed) {
        info = strcat(info, ", leashed");
    }
    monnambuf = strcpy(monnambuf, await x_monnam(mtmp, 3, null, (1 | 2), (0)));
    await pline("Status of %s (%s, %s):  Level %d  HP %d(%d)  AC %d%s.", monnambuf, align_str(alignment), size_str(mtmp.data.msize), mtmp.m_lev, mtmp.mhp, mtmp.mhpmax, find_mac(mtmp), info);
}
/* stethoscope or probing applied to hero -- one-line feedback */
export async function ustatusline() {
    let reg = null;
    let info = '';
    let ln = 0;
    info = '';
    if (game.u.uprops[SICK].intrinsic) {
        info = strcat(info, ", dying from");
        if (game.u.usick_type & 1) {
            info = strcat(info, " food poisoning");
        }
        if (game.u.usick_type & 2) {
            if (game.u.usick_type & 1) {
                info = strcat(info, " and");
            }
            info = strcat(info, " illness");
        }
    }
    if (game.u.uprops[STONED].intrinsic) {
        info = strcat(info, ", solidifying");
    }
    if (game.u.uprops[SLIMED].intrinsic) {
        info = strcat(info, ", becoming slimy");
    }
    if (game.u.uprops[STRANGLED].intrinsic) {
        info = strcat(info, ", being strangled");
    }
    if (game.u.uprops[VOMITING].intrinsic) {
        info = strcat(info, ", nauseated");
    }
    if (game.u.uprops[CONFUSION].intrinsic) {
        info = strcat(info, ", confused");
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        info = strcat(info, ", blind");
        if (game.u.ucreamed) {
            if (game.u.ucreamed < (game.u.uprops[BLINDED].intrinsic & 16777215) || game.u.uprops[BLINDED].extrinsic || !(((game.youmonst.data).mflags1 & 4096) == 0)) {
                info = strcat(info, ", cover");
            }
            info = strcat(info, "ed by sticky goop");
        }
    }
    if (game.u.uprops[STUNNED].intrinsic) {
        info = strcat(info, ", stunned");
    }
    if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) && !game.u.usteed) {
        let legs = (game.u.uprops[WOUNDED_LEGS].extrinsic & (131072 | 262144));
        let what = await body_part(LEG);
        if (legs == (131072 | 262144)) {
            what = await makeplural(what);
        }
        info = __nh_buf_append(info, sprintf('', ", injured %s", what));
    }
    if (game.u.uprops[GLIB].intrinsic) {
        info = __nh_buf_append(info, sprintf('', ", slippery %s", await fingers_or_gloves((1))));
    }
    if (game.u.utrap) {
        info = strcat(info, ", trapped");
    }
    if ((game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic)) {
        info = strcat(info, ((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic) ? ", very fast" : ", fast");
    }
    if (game.u.uundetected) {
        info = strcat(info, ", concealed");
    } else if ((game.youmonst.m_ap_type & 7) != M_AP_NOTHING) {
        info = strcat(info, ", disguised");
    }
    if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked)) {
        info = strcat(info, ", invisible");
    }
    if (game.u.ustuck) {
        if (game.u.uswallow) {
            info = strcat(info, (dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null) ? ", being digested by " : ", engulfed by ");
        } else if (!sticks(game.youmonst.data)) {
            info = strcat(info, ", held by ");
        } else {
            info = strcat(info, ", holding ");
        }
        info = strcat(info, await a_monnam(game.u.ustuck));
    }
    if (!game.u.uswallow && (reg = visible_region_at(game.u.ux, game.u.uy)) != null && (ln = strlen(info)) < 256 /* sizeof(char [256]) */) {
        nh_snprintf("ustatusline", 3483, eos(info), 256 /* sizeof(char [256]) */ - ln, ", in a cloud of %s", reg_damg(reg) ? "poison gas" : "vapor");
    }
    await pline("Status of %s (%s):  Level %d  HP %d(%d)  AC %d%s.", game.plname, piousness((0), align_str(game.u.ualign.type)), (game.u.umonnum != game.u.umonster) ? game.mons[game.u.umonnum].mlevel : game.u.ulevel, (game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp, (game.u.umonnum != game.u.umonster) ? game.u.mhmax : game.u.uhpmax, game.u.uac, info);
}
/* for 'onefile' processing where end of this file isn't necessarily the
   end of the source code seen by the compiler */
/*insight.c*/
/* ("no" case shouldn't happen) */
/* curly braces: u.utrap is an escape attempt counter rather than a
           turn timer so use different ornamentation than usual parentheses */
/* simplify "18/\**" to be "18/100" */
/* as in background_enlightenment, when poly'd we need to use the saved
       gender in u.mfemale rather than the current you-as-monster gender */
/* "Conan the Archeologist's attributes:" */
/* background and characteristics; ^X or end-of-game disclosure */
/* role, race, alignment, deities, dungeon level, time, experience */
/* hit points, energy points, armor class, gold */
/* expanded status line information, including things which aren't
       included there due to space considerations;
       shown for both basic and magic enlightenment */
/* remaining attributes; shown for potion,&c or wizard mode and
       explore mode ^X or end of game disclosure */
/* intrinsics and other traditional enlightenment feedback */
/* mention not saving bones iff hero just died */
/* show the rest of this game's pantheon (finishes previous sentence)
       [appending "also Moloch" at the end would allow for straightforward
       trailing "and" on all three aligned entries but looks too verbose] */
/* same phrasing for current and final: "entered" is unconditional */
/* 'turns' grates on the nerves in this context... */
/* this is shown even if the 'time' option is off */
/* omit role when rank title matches it */
/* report alignment (bypass you_are() in order to omit ending period);
       adverb is used to distinguish between temporary change (helm of opp.
       alignment), permanent change (one-time conversion), and original */
/* helm of opposite alignment (might hide conversion) */
/* what's the past tense of "currently"? if we used "formerly"
                  it would sound like a reference to the original alignment */
/* and what's the past tense of "now"? certainly not "then"
                     in a context like this...; "belatedly" == weren't that
                     way sooner (in other words, didn't start that way) */
/* atheist (ignored in very early game) */
/* this gives away the fact that the knox branch is only 1 level */
/* TODO? maybe phrase it differently when actually inside the fort,
           if we're able to determine that (not trivial) */
/* [This had "tonight" but has been changed to "in effect".
           There is a similar issue to Friday the 13th--it's the value
           at the start of the current session but that session might
           have dragged on for an arbitrary amount of time.  We want to
           report the values that currently affect play--or affected
           play when game ended--rather than actual outside situation.] */
/* present tense=="needed", past tense=="were needed" */
/* "for": grammatically iffy but less likely to wrap */
/* separator after background */
/* status line currently being explained shows "HD:0" */
/* terminate the wallet line if appropriate, otherwise add an
           introduction to subsequent continuation; output now either way */
/* put contained gold on its own line to avoid excessive width; it's
           phrased as a continuation of the wallet line so not capitalized */
/* being in a shop inhibits autopickup, even 'pickup_thrown' */
/* was originally `(abase != alimit)' */
/* more verbose if exceeding 'limit' due to magic bonus */
/*\
     * Status (many are abbreviated on bottom line; others are or
     *     should be discernible to the hero hence to the player)
    \*/
/* separator after title or characteristics */
/* unlike death due to sickness, report the two cases separately
               because it is possible to cure one without curing the other */
/* !haseyes: avoid "you are innately blind innately" */
/* check the reasons in same order as from_what() */
/* better phrasing desperately wanted... */
/* timed, possibly combined with blindfold */
/* external troubles, more or less */
/* current weapon(s) and corresponding skill level(s) */
/* unlike ring of increase accuracy's effect, the monk's suit penalty
       is too blatant to be restricted to magical enlightenment */
/* if from_what() ever gets extended from wizard mode to normal
           play, it could be adapted to handle this */
/* [maybe include known blessed?] */
/* report being weaponless; distinguish whether gloves are worn
       [perhaps mention silver ring(s) when not wearing gloves?] */
/* for just one, the conditionals yield
                   1) "skill with <that one>"; for more than one:
                   2) "skills with <primary> and also with <secondary>" or
                   3) "skills with <primary> and also with two-weapons" or
                   4) "skills with <secondary> and also with two-weapons" or
                   5) "skills with <primary>, <secondary>, and two-weapons"
                   (no 'also's or extra 'with's for case 5); when primary
                   and secondary use the same skill, only cases 1 and 3 are
                   possible because 'a2' gets forced to False above */
/*\
     *  Attributes
    \*/
/* past tense is applicable for death while Unchanging */
/* sort by fruit index, from low to high;
                              * this modifies the gf.ffruit chain, so could
                              * possibly mask or even introduce a problem,
                              * but it does useful sanity checking */
/* the sum might be 0 (+0 ring or two which negate each other);
           that yields "you are charismatic" (which isn't pointless
           because it potentially impacts seduction attacks) */
/* something unexpected; leave 'buf' as-is */
/* shouldn't happen; will result in generic "you are hiding" */
/* for dohide(), when player uses '#monster' command */
/* note: we don't report "you are without possessions" unless the
       game started with the pauper option set */
/* nudist is far more than a subset of possessionless, and a much
       more impressive accomplishment, but showing "started out without
       possessions" before "faithfully nudist" looks more logical */
/* display achievements in the order in which they were recorded;
       lone exception is to defer the Amulet if we just ascended;
       it warrants alternate wording when given away during ascension,
       but the Amulet achievement is always attained before entering
       endgame and the alternate wording looks strange if shown before
       "reached endgame" and "reached Astral" */
/* for ascension, force it to be last and Amulet next to last
           by taking them out and then adding them back */
/* should always be True here */
/* the ultimate achievement... */
/* valid achievements range from 1 to N_ACH-1; however, ranks can be
       stored as the complement (ie, negative) to track gender */
/* normally we don't ask about sort order for the vanquished list unless
       it contains at least two entries; however, if player has used explicit
       'm #vanquished', choose order no matter what it contains so far */
/* iflags.menu_requested via dovanquished() */
/* choose value for vanq_sortmode via menu; ESC cancels choosing
           sort order but continues with vanquishd monsters display */
/* ask user to choose sort order */
/* choose value for vanq_sortmode via menu; ESC cancels list
                   of vanquished monsters but does not set 'done_stopprint' */
/* trolls or undead might have come back,
                       but we don't keep track of that */
/* #vanquished rather than final disclosure, so pline() is ok */
/* genocides only, not extinctions */
/* this goes through the whole monster list up to three times but will
       happen rarely and is simpler than a more general single pass check;
       extinctions are only revealed during end of game disclosure or when
       running in wizard or explore mode */
/* ask player to choose sort order */
/* #genocided shares #vanquished's sort order */
/* See the comment for similar code near the end of list_vanquished(). */
/* #genocided rather than final disclosure, so pline() is ok and
           extinction has been ignored */
/* 'gameover' is True if we make it here */
/* don't reveal the innate form (chameleon, vampire, &c),
           just expose the fact that this current form isn't it */
/* avoid "Status of the invisible newt ..., invisible" */
/* and unlike a normal mon_nam, use "saddled" even if it has a name */
/* FIXME? a_monnam() uses x_monnam() which has a special case that
           forces "the" instead of "a" when formatting u.ustuck while hero
           is swallowed; we don't really want that here but it isn't worth
           fiddling with just for self-probing while engulfed */
