/* NetHack 5.0	mhitu.c	$NHDT-Date: 1775259433 2026/04/03 15:37:13 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.341 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcmp, strcpy } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { number_leashed, snuff_lit, um_dist, unleash_all } from './apply.js';
import { is_art, protects } from './artifact.js';
import { acurr, adjalign, adjattrib, exercise, minuhpmax } from './attrib.js';
import { placebc, unplacebc } from './ball.js';
import { bot } from './botl.js';
import { getyear, midnight, night, yyyymmdd } from './calendar.js';
import { reset_occupations, yn_function } from './cmd.js';
import { is_pool, is_waterwall } from './dbridge.js';
import { c_common_strings, ynchars } from './decl.js';
import { canseemon, flush_screen, map_invisible, mon_visible, newsym, sensemon, shieldeff, swallowed, tp_sensemon } from './display.js';
import { Amonnam, Mgender, Monnam, Some_Monnam, christen_monst, hliquid, m_monnam, mon_nam, noit_Monnam, noit_mon_nam, pmname } from './do_name.js';
import { Ring_gone, Ring_on, hard_helmet, stop_donning } from './do_wear.js';
import { initedog } from './dog.js';
import { In_hell, ceiling, on_level } from './dungeon.js';
import { is_fainted } from './eat.js';
import { done, done_in_by } from './end.js';
import { losexp, pluslvl } from './exper.js';
import { mon_explodes } from './explode.js';
import { losehp, money_cnt, nomul, showdamage, spoteffects, unmul } from './hack.js';
import { dist2, s_suffix, upstart } from './hacklib.js';
import { currency, freeinv, prinv, sobj_at, u_carried_gloves, update_inventory } from './invent.js';
import { is_home_elemental, makemon } from './makemon.js';
import { buzzmu, castmu } from './mcastu.js';
import { attk_protection, engulf_target, failed_grab, mattackm, paralyze_monst } from './mhitm.js';
import { msummon } from './minion.js';
import { golemeffects, killed, mnexto, mon_to_stone, mondead, monnear, set_ustuck, unstuck, wake_nearto, xkilled } from './mon.js';
import { Resists_Elem, attacktype_fordmg, can_blnd, cvt_adtyp_to_mseenres, defended, dmgtype, dmgtype_fromattack, gender, get_atkdam_type, mon_hates_blessings, monstseesu, monstunseesu, poly_when_stoned, pronoun_gender, resists_blnd, resists_drli, stagger, sticks } from './mondata.js';
import { set_apparxy } from './monmove.js';
import { breamu, spitmu, thrwmu } from './mthrowu.js';
import { find_offensive, mon_reflects, ureflects, use_offensive } from './muse.js';
import { ACID_RES, AMULET_OF_GUARDING, ART_SNICKERSNEE, ART_STORMBRINGER, ART_VORPAL_BLADE, A_CHA, A_CON, A_DEX, A_INT, A_STR, A_WIS, BLINDED, BOULDER, COLD_RES, CONFLICT, CONFUSION, CORPSE, DEAF, DETECT_MONSTERS, DIED, DISMOUNT_ENGULFED, DISPLACED, EGG, FAST, FEMALE, FIRE_RES, GOLD_PIECE, HAIR, HALF_PHDAM, HALLUC, HALLUC_RES, HAND, INVIS, MAGICAL_BREATHING, MALE, M_AP_NOTHING, M_AP_OBJECT, M_SEEN_ACID, M_SEEN_COLD, M_SEEN_ELEC, M_SEEN_FIRE, NEED_HTH_WEAPON, NEED_WEAPON, NEUTRAL, NON_PM, OILSKIN_CLOAK, PIT, PM_AIR_ELEMENTAL, PM_ALIGNED_CLERIC, PM_AMOROUS_DEMON, PM_ARCHON, PM_BALROG, PM_BLACK_LIGHT, PM_CHICKATRICE, PM_CLERIC, PM_COCKATRICE, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLOATING_EYE, PM_FOG_CLOUD, PM_HIGH_CLERIC, PM_LEPRECHAUN, PM_MEDUSA, PM_SALAMANDER, PM_SHADE, PM_STONE_GOLEM, PM_TRAPPER, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VIOLET_FUNGUS, PM_VLAD_THE_IMPALER, PROTECTION, PROT_FROM_SHAPE_CHANGERS, P_LANCE, P_NONE, P_POLEARMS, P_WHIP, REFLECTING, RIN_ADORNMENT, SEE_INVIS, SHOCK_RES, SICK, SICK_RES, SLOW_DIGESTION, SPIKED_PIT, STONE_RES, STONING, STUNNED, S_EEL, S_MIMIC, S_NYMPH, S_PIERCER, S_VORTEX, TOOL_CLASS, TOWEL, TT_PIT, TT_WEB, WEAPON_CLASS } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { an, cloak_simple_name, doname, helm_simple_name, makeplural, mimic_obj_name, safe_qbuf, simpleonames, suit_simple_name, the, vtense, xname, yname } from './objnam.js';
import { pline_mon, set_msg_xy, urgent_pline } from './pline.js';
import { body_part, poly_gender, polymon, rehumanize, ugolemeffects } from './polyself.js';
import { incr_itimeout, make_blinded, make_confused, make_hallucinated, make_sick, make_stunned, split_mon } from './potion.js';
import { is_quest_artifact } from './questpgr.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { money2mon } from './shk.js';
import { growl_sound } from './sounds.js';
import { mpickobj, remove_worn_item, unresponsive } from './steal.js';
import { dismount_steed, place_monster } from './steed.js';
import { enexto, rloc, tele_restrict, teleds } from './teleport.js';
import { burn_away_slime } from './timeout.js';
import { acid_damage, burnarmor, drain_en, ignite_items, minstapetrify, reset_utrap, t_at, unconscious } from './trap.js';
import { erode_armor, mhitm_adtyping, mhitm_knockback } from './uhitm.js';
import { vision_recalc } from './vision.js';
import { hitval, mon_wield_item } from './weapon.js';
import { new_were, were_summon } from './were.js';
import { welded } from './wield.js';
import { worm_move } from './worm.js';
import { find_mac, setworn, which_armor } from './worn.js';
import { destroy_items, drain_item } from './zap.js';

game.mon_currwep = null;
/* monster hits hero (most callers have been moved to uthim.c) */
export function hitmsg(mtmp, mattk) {
    let compat = 0;
    let verb = null;
    let again = null;
    let punct = "!";
    let Monst_name = Monnam(mtmp);
    if ((compat = could_seduce(mtmp, game.youmonst, mattk)) != 0 && !mtmp.mcan && !mtmp.mspec_used) {
        /* Note: if opposite gender, "seductively";
       if same gender, "engagingly" for nymph, normal msg for others. */
        pline_mon(mtmp, "%s %s you %s.", Monst_name, !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "smiles at" : !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "talks to" : "touches", (compat == 2) ? "engagingly" : "seductively");
    } else {
        switch (mattk.aatyp) {
            case 2:
                verb = "bites";
                /* Note: breamu takes care of displacement */
                /* Note: spitmu takes care of displacement */
                break;
            case 3:
                if ((((game.youmonst.data).mflags1 & 2097152) != 0)) {
                    punct = ".";
                }
                verb = "kicks";
                break;
            case 6:
                verb = "stings";
                break;
            case 4:
                verb = "butts";
                break;
            case 5:
                verb = "touches you";
                break;
            case 16:
                verb = "tentacles suck your brain";
                Monst_name = s_suffix(Monst_name);
                break;
            /* automatic hit if next to, and aimed at you */
            case 13:
            case 14:
                verb = "explodes";
                break;
            default:
                verb = "hits";
        }
        /* if a monster hits more than once with similar attack, say so */
        again = (mtmp.m_id == game.hitmsg_mid && game.hitmsg_prev != (null) && mattk == game.hitmsg_prev + 1 && mattk.aatyp == game.hitmsg_prev.aatyp) ? " again" : "";
        pline_mon(mtmp, "%s %s%s%s", Monst_name, verb, again, punct);
    }
    game.hitmsg_mid = mtmp.m_id;
    game.hitmsg_prev = mattk;
}
/* monster missed you */
export function missmu(mtmp, nearmiss, mattk) {
    game.hitmsg_mid = 0;
    game.hitmsg_prev = null;
    if (!(canseemon(mtmp) || sensemon(mtmp))) {
        map_invisible(mtmp.mx, mtmp.my);
    }
    if (could_seduce(mtmp, game.youmonst, mattk) && !mtmp.mcan) {
        pline_mon(mtmp, "%s pretends to be friendly.", Monnam(mtmp));
    } else {
        pline_mon(mtmp, "%s %smisses!", Monnam(mtmp), (nearmiss && game.flags.verbose) ? "just " : "");
    }
    stop_occupation();
}
/* strike types P|S|B: Pierce (pointed: stab) => "thrusts",
   Slash (edged: slice) or whack (blunt: Bash) => "swings" */
/* attacker's weapon */
/* True: using polearm while too close */
export function mswings_verb(mwep, bash) {
    let verb = null;
    let otyp = mwep.otyp;
    let lash = (game.objects[otyp].oc_subtyp == P_WHIP || ((mwep).otyp == TOWEL && (mwep).spe > 0));
    let thrust = ((game.objects[otyp].oc_dir & 1) != 0 && ((game.objects[otyp].oc_dir & ~1) == 0 || !rn2(2)));
    verb = bash ? "bashes with" : lash ? "lashes" : thrust ? "thrusts" : "swings";
    /* (might have caller also pass attacker's formatted name so that
       if hallucination makes that be plural, we could use vtense() to
       adjust the result to match) */
    return verb;
}
/* monster swings obj */
/* attacker */
/* attacker's weapon */
/* True: polearm used at too close range */
export function mswings(mtmp, otemp, bash) {
    if (game.flags.verbose && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && mon_visible(mtmp)) {
        pline_mon(mtmp, "%s %s %s%s %s.", Monnam(mtmp), mswings_verb(otemp, bash), (otemp.quan > 1) ? "one of " : "", (genders[pronoun_gender(mtmp, 2)].his), xname(otemp));
    }
}
/* return how a poison attack was delivered */
export function mpoisons_subj(mtmp, mattk) {
    if (mattk.aatyp == 254) {
        let mwep = (mtmp == game.youmonst) ? game.uwep : ((mtmp).mw);
        /* "Foo's attack was poisoned." is pretty lame, but at least
           it's better than "sting" when not a stinging attack... */
        return (!mwep || !mwep.otrapped) ? "attack" : "weapon";
    } else {
        return (mattk.aatyp == 5) ? "contact" : (mattk.aatyp == 15) ? "gaze" : (mattk.aatyp == 2) ? "bite" : "sting";
    }
}
/* called when your intrinsic speed is taken away */
export function u_slow_down() {
    game.u.uprops[FAST].intrinsic = 0;
    if (!(game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic)) {
        You("slow down.");
    } else {
        Your("quickness feels less natural.");
    }
    exercise(A_DEX, (0));
}
/* monster attacked wrong location due to monster blindness, hero
   invisibility, hero displacement, or hero being underwater */
export function wildmiss(mtmp, mattk) {
    let compat = 0;
    /* Monnam(), deferred until after early returns */
    let Monst_name = null;
    /* expected reasons for wildmiss() */
    let unotseen = (!mtmp.mcansee || (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mtmp.data).mflags1 & 16777216) != 0)));
    let unotthere = ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic) != 0);
    let usubmerged = ((game.u.uinwater) != 0);
    if (!unotseen && !unotthere && !usubmerged) {
        /* the reasons for wildmiss end up getting checked twice so that the
       impossible can be given, if warranted, before the early returns */
        /* this used to be the 'else' case below */
        impossible("%s attacks you without knowing your location?", Some_Monnam(mtmp));
        /* no such thing as a demon were creature, so we're done */
        return;
    }
    /* no map_invisible() -- no way to tell where _this_ is coming from */
    if (!game.flags.verbose) {
        return;
    }
    /* no feedback if hero doesn't see the monster's spot */
    if (!((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
        return;
    }
    /* maybe it's attacking an image around the corner? */
    compat = ((mattk.adtyp == 22 || mattk.adtyp == 35) ? could_seduce(mtmp, game.youmonst, mattk) : 0);
    Monst_name = Monnam(mtmp);
    set_msg_xy(mtmp.mx, mtmp.my);
    if (unotseen) {
        /* !mtmp->cansee || (Invis && !perceives(mtmp->data)) */
        let swings = (mattk.aatyp == 2) ? "snaps" : (mattk.aatyp == 3) ? "kicks" : (mattk.aatyp == 6 || mattk.aatyp == 4 || (((mtmp.data).mflags1 & 24576) == 24576)) ? "lunges" : "swings";
        if (compat) {
            pline("%s tries to touch you and misses!", Monst_name);
        } else {
            switch (rn2(3)) {
                case 0:
                    pline("%s %s wildly and misses!", Monst_name, swings);
                    break;
                case 1:
                    pline("%s attacks a spot beside you.", Monst_name);
                    break;
                case 2:
                    pline("%s strikes at %s!", Monst_name, is_waterwall(mtmp.mux, mtmp.muy) ? "empty water" : "thin air");
                    break;
                default:
                    pline("%s %s wildly!", Monst_name, swings);
                    break;
            }
        }
    } else if (unotthere) {
        /* give 'displaced' message even if hero is Blind */
        if (compat) {
            pline("%s smiles %s at your %sdisplaced image...", Monst_name, (compat == 2) ? "engagingly" : "seductively", ((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) ? "invisible " : "");
        } else {
            pline("%s strikes at your %sdisplaced image and misses you!", Monst_name, ((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) ? "invisible " : "");
        }
    } else if (usubmerged) {
        if (compat) {
            pline("%s reaches towards your distorted image.", Monst_name);
        /* Note:  if you're both invisible and displaced, only
                   * monsters which see invisible will attack your displaced
                   * image, since the displaced image is also invisible. */
        /* monsters may miss especially on water level where
           bubbles shake the player here and there */
        } else {
            pline("%s is fooled by water reflections and misses!", Monst_name);
        }
    } else {
        ;
    }
}
/* if mtmp is polymorphed, mdat != mtmp->data */
export function expels(mtmp, mdat, message) {
    game.disp.botl = (1);
    if (message) {
        if ((dmgtype_fromattack((mdat), 26, 11) != null)) {
            You("get regurgitated!");
        } else if ((dmgtype_fromattack((mdat), 28, 11) != null)) {
            pline_mon(mtmp, "%s unfolds and you are released!", Monnam(mtmp));
        } else {
            let blast = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let attk = attacktype_fordmg(mdat, 11, (-1));
            blast[0] = 0;
            if (!attk) {
                impossible("Swallower has no engulfing attack?");
            } else {
                if (((mdat).mlet == S_VORTEX || (mdat) == game.mons[PM_AIR_ELEMENTAL])) {
                    switch (attk.adtyp) {
                        case 6:
                            blast = strcpy(blast, " in a shower of sparks");
                            break;
                        case 3:
                            blast = strcpy(blast, " in a blast of frost");
                            break;
                    }
                } else {
                    blast = strcpy(blast, " with a squelch");
                }
                You("get expelled from %s%s!", mon_nam(mtmp), blast);
            }
        }
    }
    /* ball&chain returned in unstuck() */
    unstuck(mtmp);
    mnexto(mtmp, 4);
    newsym(game.u.ux, game.u.uy);
    /* to cover for a case where mtmp is not in a next square */
    if (um_dist(mtmp.mx, mtmp.my, 1)) {
        pline("Brrooaa...  You land hard at some distance.");
    }
    spoteffects((1));
}
/* select a monster's next attack, possibly substituting for its usual one */
export function getmattk(magr, mdef, indx, prev_result, alt_attk_buf) {
    let mptr = magr.data;
    let attk = mptr.mattk[indx];
    let weap = (magr == game.youmonst) ? game.uwep : ((magr).mw);
    let udefend = mdef == game.youmonst;
    if (!game.sysopt.seduce) {
        let c_sa_no = [{ aatyp: 0, adtyp: 0, damn: 0, damd: 0 }, { aatyp: 0, adtyp: 0, damn: 0, damd: 0 }, { aatyp: 0, adtyp: 0, damn: 0, damd: 0 }, { aatyp: 0, adtyp: 0, damn: 0, damd: 0 }, { aatyp: 0, adtyp: 0, damn: 0, damd: 0 }, { aatyp: 0, adtyp: 0, damn: 0, damd: 0 }];
        if (mptr.mattk[0].adtyp == 35) {
            /* if the first attack is for SSEX damage, all six attacks will be
           substituted (expected succubus/incubus handling); if it isn't
           but another one is, only that other one will be substituted */
            Object.assign(alt_attk_buf, c_sa_no[indx]);
            attk = alt_attk_buf;
        } else if (attk.adtyp == 35) {
            /* prevent a monster with two consecutive disease or hunger attacks
       from hitting with both of them on the same turn; if the first has
       already hit, switch to a stun attack for the second */
            /* can't re-engulf or re-grab yet; switch to simpler attack */
            /* don't substitute if target is immune to normal damage */
            /* elementals on their home plane do double damage */
            Object.assign(alt_attk_buf, attk);
            attk = alt_attk_buf;
            attk.adtyp = 15;
        }
    }
    if (indx > 0 && prev_result[indx - 1] > 0 && (attk.adtyp == 33 || attk.adtyp == 38 || attk.adtyp == 39) && attk.adtyp == mptr.mattk[indx - 1].adtyp) {
        Object.assign(alt_attk_buf, attk);
        attk = alt_attk_buf;
        /* make drain-energy damage be somewhat in proportion to energy */
        attk.adtyp = 12;
    } else if (attk.adtyp == 16 && udefend) {
        let ulev = ((game.u.ulevel) > (6) ? (game.u.ulevel) : (6));
        Object.assign(alt_attk_buf, attk);
        attk = alt_attk_buf;
        /* holders/engulfers who release the hero have mspec_used set to rnd(2)
       and can't re-hold/re-engulf until it has been decremented to zero;
       likewise for transformation by genetic engineer */
        if (game.u.uen <= 5 * ulev && attk.damn > 1) {
            /* 3.6.0 used 4d6 but since energy drain came out of max energy
           once current energy was gone, that tended to have a severe
           effect on low energy characters; it's now 2d6 with adjustments */
            attk.damn -= 1;
            if (game.u.uenmax <= 2 * ulev && attk.damd > 3) {
                attk.damd -= 3;
            }
        } else if (game.u.uen > 12 * ulev) {
            /* very low energy: 1d6 -> 1d3 */
            attk.damn += 1;
            /* note: 3d9 is slightly higher than previous 4d6 */
            if (game.u.uenmax > 20 * ulev) {
                attk.damd += 3;
            }
        }
    } else if (magr.mspec_used && (attk.aatyp == 11 || attk.aatyp == 7 || attk.adtyp == 19 || attk.adtyp == 43)) {
        /* very high energy: 3d6 -> 3d9 */
        let wimpy = (attk.damd == 0);
        Object.assign(alt_attk_buf, attk);
        attk = alt_attk_buf;
        if (attk.adtyp == 8 || attk.adtyp == 6 || attk.adtyp == 3 || attk.adtyp == 2) {
            attk.aatyp = 5;
        } else {
            /* attack message will be "<foo> hits" */
            attk.aatyp = 1;
            /* liches have a touch attack for cold damage and also a spell attack;
       they won't use the spell for monster vs monster so become impotent
       against cold resistant foes; change the touch damage from cold to
       physical if target will resist */
            attk.adtyp = 0;
        }
        attk.damn = 1;
        attk.damd = 6;
        /* barrow wight, Nazgul, erinys have weapon attack for non-physical
       damage; force physical damage if attacker has been cancelled or
       if weapon is sufficiently interesting; a few unique creatures
       have two weapon attacks where one does physical damage and other
       doesn't--avoid forcing physical damage for those */
        if (wimpy && attk.aatyp == 1) {
            attk.aatyp = 5;
            attk.damn = attk.damd = 0;
        }
    } else if (indx == 0 && magr != game.youmonst && attk.aatyp == 254 && attk.adtyp != 0 && !(mptr.mattk[1].aatyp == 254 && mptr.mattk[1].adtyp == 0) && (magr.mcan || (weap && ((weap.otyp == CORPSE && ((game.mons[weap.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[weap.corpsenm]) == game.mons[PM_CHICKATRICE])) || is_art(weap, ART_STORMBRINGER) || is_art(weap, ART_VORPAL_BLADE))))) {
        Object.assign(alt_attk_buf, attk);
        attk = alt_attk_buf;
        attk.adtyp = 0;
    } else if (indx == 0 && attk.aatyp == 5 && attk.adtyp == 3 && (udefend ? (game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic) : Resists_Elem(mdef, COLD_RES)) && mdef.data != game.mons[PM_SHADE]) {
        Object.assign(alt_attk_buf, attk);
        attk = alt_attk_buf;
        attk.adtyp = 0;
        /* lessen new physical damage compared to old cold damage:
         *        before  after
         * lich:    1d10  1d6
         * demi:    3d4   2d4
         * master:  3d6   2d6
         * arch-:   5d6   3d6
         */
        attk.damn = Math.trunc((attk.damn + 1) / 2);
        if (attk.damd == 10) {
            attk.damd = 6;
        }
    }
    if (attk != alt_attk_buf && is_home_elemental(mptr)) {
        Object.assign(alt_attk_buf, attk);
        attk = alt_attk_buf;
        attk.damn *= 2;
    }
    return attk;
}
/* calc some variables needed for mattacku() */
export function calc_mattacku_vars(mtmp, ranged, range2, foundyou, youseeit) {
    ranged.value = (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) > 3);
    range2.value = !monnear(mtmp, mtmp.mux, mtmp.muy);
    foundyou.value = ((mtmp.mux) == game.u.ux && (mtmp.muy) == game.u.uy);
    youseeit.value = canseemon(mtmp);
    /* do_attack() uses bhitpos to set/clear notonhead; do likewise here */
    game.bhitpos.x = game.u.ux , game.bhitpos.y = game.u.uy;
    /* hero poly'd into a long worm isn't allowed to grow a tail, so
       hitting tail instead of head can't happen */
    game.notonhead = (0);
}
/* return TRUE iff monster or hero is trapped in a (spiked) pit */
export function mtrapped_in_pit(mtmp) {
    let ttmp = null;
    if (mtmp == game.youmonst) {
        ttmp = (game.u.utrap && game.u.utraptype == TT_PIT) ? t_at(game.u.ux, game.u.uy) : null;
    } else {
        ttmp = mtmp.mtrapped ? t_at(mtmp.mx, mtmp.my) : null;
    }
    if (ttmp && ((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT)) {
        return (1);
    }
    return (0);
}
/*
 * mattacku: monster attacks you
 *      returns 1 if monster dies (e.g. "yellow light"), 0 otherwise
 *      Note: if you're displaced or invisible the monster might attack the
 *              wrong position...
 *      Assumption: it's attacking you or an empty square; if there's another
 *              monster which it attacks by mistake, the caller had better
 *              take care of it...
 */
export function mattacku(mtmp) {
    let mattk = null;
    let alt_attk = { aatyp: 0, adtyp: 0, damn: 0, damd: 0 };
    let i = 0;
    let j = 0;
    let tmp = 0;
    let sum = [0, 0, 0, 0, 0, 0];
    let mdat = mtmp.data;
    /*
     * ranged: Is it near you?  Affects your actions.
     * range2: Does it think it's near you?  Affects its actions.
     * foundyou: Is it attacking you or your image?
     * youseeit: Can you observe the attack?  It might be attacking your
     *     image around the corner, or invisible, or you might be blind.
     * skipnonmagc: Are further physical attack attempts useless?  (After
     *     a wild miss--usually due to attacking displaced image.  Avoids
     *     excessively verbose miss feedback when monster can do multiple
     *     attacks and would miss the same wrong spot each time.)
     */
    let ranged = 0;
    let range2 = 0;
    let foundyou = 0;
    let firstfoundyou = 0;
    let youseeit = 0;
    let skipnonmagc = (0);
    calc_mattacku_vars(mtmp, { get value() { return ranged; }, set value(_v) { ranged = _v; } }, { get value() { return range2; }, set value(_v) { range2 = _v; } }, { get value() { return foundyou; }, set value(_v) { foundyou = _v; } }, { get value() { return youseeit; }, set value(_v) { youseeit = _v; } });
    if (!ranged) {
        nomul(0);
    }
    if (((mtmp).mhp < 1)) {
        return 1;
    }
    if ((game.u.uinwater) && !(((mtmp.data).mflags1 & 2) != 0)) {
        return 0;
    }
    if (game.u.uswallow) {
        /* If swallowed, can only be affected by u.ustuck */
        if (mtmp != game.u.ustuck) {
            return 0;
        }
        game.u.ustuck.mux = game.u.ux;
        game.u.ustuck.muy = game.u.uy;
        if (game.u.uinvulnerable) {
            return 0;
        }
        /* stomachs can't hurt you! */
        range2 = 0;
        foundyou = 1;
    } else if (game.u.usteed) {
        if (mtmp == game.u.usteed) {
            return 0;
        }
        if (!rn2((((mtmp.data).mflags2 & 128) != 0) ? 2 : 4) && (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
            /* Your steed won't attack you */
            /* Orcs like to steal and eat horses and the like */
            /* attack your steed instead; 'bhitpos' and 'notonhead' are
               already set from targeting hero */
            i = mattackm(mtmp, game.u.usteed);
            if ((i & 4) != 0) {
                return 1;
            }
            /* make sure steed is still alive and within range */
            if ((i & 2) != 0 || !game.u.usteed || !(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
                return 0;
            }
            /* Let your steed retaliate */
            game.bhitpos.x = mtmp.mx , game.bhitpos.y = mtmp.my;
            game.notonhead = (0);
            return !!(mattackm(game.u.usteed, mtmp) & 2);
        }
    }
    if (game.u.uundetected && !range2 && foundyou && !game.u.uswallow) {
        /* non-mimic hero might be mimicking an object after eating m corpse */
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            map_invisible(mtmp.mx, mtmp.my);
        }
        game.u.uundetected = 0;
        if ((((game.youmonst.data).mflags1 & 256) != 0) && game.u.umonnum != PM_TRAPPER) {
            /* maybe we need a unexto() function? */
            let cc = { x: 0, y: 0 };
            let obj = null;
            You("fall from the %s!", ceiling(game.u.ux, game.u.uy));
            game.level.monsters[mtmp.mx][mtmp.my] = null;
            if (!enexto(cc, game.u.ux, game.u.uy, game.youmonst.data) || (mtmp.data.mlet == S_EEL && is_pool(mtmp.mx, mtmp.my) && !is_pool(game.u.ux, game.u.uy))) {
                /* take monster off map now so that its location
               is eligible for placing hero; we assume that a
               removed monster remembers its old spot <mx,my> */
                /* a fish won't voluntarily swap positions
                   when it's in water and hero is over land */
                /* couldn't find any spot for hero; this used to
                   kill off attacker, but now we just give a "miss"
                   message and keep both mtmp and hero at their
                   original positions; hero has become unconcealed
                   so mtmp's next move will be a regular attack */
                place_monster(mtmp, mtmp.mx, mtmp.my);
                /* u.uundetected was toggled */
                newsym(game.u.ux, game.u.uy);
                pline_mon(mtmp, "%s draws back as you drop!", Monnam(mtmp));
                return 0;
            }
            /* put mtmp at hero's spot and move hero to <cc.x,.y> */
            newsym(mtmp.mx, mtmp.my);
            place_monster(mtmp, game.u.ux, game.u.uy);
            if (mtmp.wormno) {
                worm_move(mtmp);
                /* tail hasn't grown, so if it now occupies <cc.x,.y>
                   then one of its original spots must be free */
                if ((game.level.monsters[cc.x][cc.y])) {
                    enexto(cc, game.u.ux, game.u.uy, game.youmonst.data);
                }
            }
            teleds(cc.x, cc.y, 1);
            set_apparxy(mtmp);
            newsym(game.u.ux, game.u.uy);
            if (game.youmonst.data.mlet != S_PIERCER) {
                return 0;
            }
            obj = which_armor(mtmp, 4);
            if (hard_helmet(obj)) {
                Your("blow glances off %s %s.", s_suffix(mon_nam(mtmp)), helm_simple_name(obj));
            } else {
                if (3 + find_mac(mtmp) <= rnd(20)) {
                    pline("%s is hit by a falling piercer (you)!", Monnam(mtmp));
                    if ((mtmp.mhp -= d(3, 6)) < 1) {
                        killed(mtmp);
                    }
                } else {
                    pline("%s is almost hit by a falling piercer (you)!", Monnam(mtmp));
                }
            }
        } else {
            if (!youseeit) {
                pline("It tries to move where you are hiding.");
            } else {
                /* Ugly kludge for eggs.  The message is phrased so as
                 * to be directed at the monster, not the player,
                 * which makes "laid by you" wrong.  For the
                 * parallelism to work, we can't rephrase it, so we
                 * zap the "laid by you" momentarily instead.
                 */
                let obj = game.level.objects[game.u.ux][game.u.uy];
                if (obj || game.u.umonnum == PM_TRAPPER || (game.youmonst.data.mlet == S_EEL && is_pool(game.u.ux, game.u.uy))) {
                    let save_spe = 0;
                    if (obj) {
                        save_spe = obj.spe;
                        if (obj.otyp == EGG) {
                            obj.spe = 0;
                        }
                    }
                    /* note that m_monnam() overrides hallucination, which is
                       what we want when message is from mtmp's perspective */
                    if (game.youmonst.data.mlet == S_EEL || game.u.umonnum == PM_TRAPPER) {
                        pline("Wait, %s!  There's a hidden %s named %s there!", m_monnam(mtmp), pmname(game.youmonst.data, (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)), game.plname);
                    } else {
                        pline("Wait, %s!  There's a %s named %s hiding under %s!", m_monnam(mtmp), pmname(game.youmonst.data, (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)), game.plname, doname(game.level.objects[game.u.ux][game.u.uy]));
                    }
                    if (obj) {
                        obj.spe = save_spe;
                    }
                } else {
                    impossible("hiding under nothing?");
                }
            }
            newsym(game.u.ux, game.u.uy);
        }
        return 0;
    }
    if (game.youmonst.data.mlet == S_MIMIC && (game.youmonst.m_ap_type & 7) && !range2 && foundyou && !game.u.uswallow) {
        /* hero might be a mimic, concealed via #monster */
        let sticky = sticks(game.youmonst.data);
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            map_invisible(mtmp.mx, mtmp.my);
        }
        if (sticky && !youseeit) {
            pline("It gets stuck on you.");
        /* see note about m_monnam() above */
        } else {
            pline("Wait, %s!  That's a %s named %s!", m_monnam(mtmp), pmname(game.youmonst.data, (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)), game.plname);
        }
        if (sticky) {
            set_ustuck(mtmp);
        }
        game.youmonst.m_ap_type = M_AP_NOTHING;
        game.youmonst.mappearance = 0;
        newsym(game.u.ux, game.u.uy);
        return 0;
    }
    if ((game.youmonst.m_ap_type & 7) == M_AP_OBJECT && !range2 && foundyou && !game.u.uswallow) {
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            map_invisible(mtmp.mx, mtmp.my);
        }
        if (!youseeit) {
            pline("%s %s!", c_common_strings.c_Something, ((((mtmp.data).mflags2 & 268435456) != 0) && game.youmonst.mappearance == GOLD_PIECE) ? "tries to pick you up" : "disturbs you");
        } else {
            pline("Wait, %s!  That %s is really %s named %s!", m_monnam(mtmp), mimic_obj_name(game.youmonst), an(pmname(game.mons[game.u.umonnum], (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0))), game.plname);
        }
        if (game.multi < 0) {
            /* this should always be the case */
            /* 5.0: dismount for all engulfers, not just for purple worms */
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            buf = sprintf(buf, "You appear to be %s again.", (game.u.umonnum != game.u.umonster) ? an(pmname(game.youmonst.data, game.flags.female)) : "yourself");
            /* immediately stop mimicking */
            unmul(buf);
        }
        return 0;
    }
    /*  Work out the armor class differential   */
    tmp = ((game.u.uac) >= 0 ? (game.u.uac) : -rnd(-(game.u.uac))) + 10;
    tmp += mtmp.m_lev;
    if (game.multi < 0) {
        tmp += 4;
    }
    if ((((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mdat).mflags1 & 16777216) != 0)) || !mtmp.mcansee) {
        tmp -= 2;
    }
    if (mtmp.mtrapped) {
        tmp -= 2;
    }
    if (tmp <= 0) {
        tmp = 1;
    }
    if (mdat.mlet == S_EEL && mtmp.minvis && ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
        /* make eels visible the moment they hit/miss us */
        mtmp.minvis = 0;
        newsym(mtmp.mx, mtmp.my);
    }
    if (mtmp.cham == NON_PM && !mtmp.mcan && !range2 && ((((mdat).mflags2 & 256) != 0) || (((mdat).mflags2 & 4) != 0))) {
        /* when not cancelled and not in current form due to shapechange, many
       demons can summon more demons and were creatures can summon critters;
       also, were creature might change from human to animal or vice versa */
        let already_fleeing = mtmp.mflee != 0;
        summonmu(mtmp, youseeit);
        /* were-creature might have changed to beast form; if that has
           caused it to become afraid (due to non-human reacting to scroll
           of scare monster or engraved "Elbereth" which was being ignored
           while in human form), don't continue this attack */
        if (mtmp.mflee && !already_fleeing) {
            return 0;
        }
        /* update cached value in case of were change */
        /* form change invalidates cached value */
        mdat = mtmp.data;
    }
    if (game.u.uinvulnerable) {
        if (mtmp == game.u.ustuck) {
            /* in the midst of successful prayer */
            /* monsters won't attack you */
            pline_mon(mtmp, "%s loosens its grip slightly.", Monnam(mtmp));
        } else if (!range2) {
            if (youseeit || sensemon(mtmp)) {
                pline("%s starts to attack you, but pulls back.", Monnam(mtmp));
            } else {
                You_feel("%s move nearby.", c_common_strings.c_something);
            }
        }
        return 0;
    }
    if (find_offensive(mtmp)) {
        /* Unlike defensive stuff, don't let them use item _and_ attack. */
        let offended = use_offensive(mtmp);
        if (offended != 0) {
            return (offended == 1);
        }
    }
    game.skipdrin = (0);
    firstfoundyou = foundyou;
    for (i = 0; i < 6; i++) {
        sum[i] = 0;
        /* counterattack against attack [i-1] might have been fatal */
        if (((mtmp).mhp < 1)) {
            return 1;
        }
        if (i > 0) {
            /* recalc in case prior attack moved hero; mtmp doesn't make
               another attempt to guess your location but might have
               accidentally knocked you to where it thought you were
               [not sure whether that's actually possible] */
            calc_mattacku_vars(mtmp, { get value() { return ranged; }, set value(_v) { ranged = _v; } }, { get value() { return range2; }, set value(_v) { range2 = _v; } }, { get value() { return foundyou; }, set value(_v) { foundyou = _v; } }, { get value() { return youseeit; }, set value(_v) { youseeit = _v; } });
            /* if hero was found but isn't anymore, avoid wildmiss now */
            if (firstfoundyou && !foundyou) {
                continue;
            }
            /* set sum[i] to 'miss' but skip other actions */
            if (!((game.bhitpos.x) == game.u.ux && (game.bhitpos.y) == game.u.uy)) {
                continue;
            }
        }
        game.mon_currwep = null;
        mattk = getmattk(mtmp, game.youmonst, i, sum, alt_attk);
        if ((game.u.uswallow && mattk.aatyp != 11) || (skipnonmagc && mattk.aatyp != 255) || (game.skipdrin && mattk.aatyp == 16 && mattk.adtyp == 32)) {
            continue;
        }
        switch (mattk.aatyp) {
            case 1:
            case 3:
            case 2:
            case 6:
            case 5:
            case 4:
            case 16:
                if (mattk.aatyp == 3 && mtrapped_in_pit(mtmp)) {
                    continue;
                }
                if (!range2 && (!((mtmp).mw) || mtmp.mconf || (game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) || !((game.youmonst.data) == game.mons[PM_COCKATRICE] || (game.youmonst.data) == game.mons[PM_CHICKATRICE]))) {
                    if (foundyou) {
                        if (tmp > (j = rnd(20 + i))) {
                            if ((((game.youmonst.data).mflags1 & 1048576) != 0) && failed_grab(mtmp, game.youmonst, mattk)) {
                                continue;
                            }
                            if (mattk.aatyp != 3 || !(((game.youmonst.data).mflags1 & 2097152) != 0)) {
                                sum[i] = hitmu(mtmp, mattk);
                            }
                        } else {
                            missmu(mtmp, (tmp == j), mattk);
                        }
                    } else {
                        wildmiss(mtmp, mattk);
                        /* skip any remaining non-spell attacks */
                        skipnonmagc = (1);
                    }
                }
                break;
            case 7:
                if ((!range2 && i >= 2 && sum[i - 1] && sum[i - 2]) || mtmp == game.u.ustuck) {
                    /* automatic if prev two attacks succeed */
                    /* Note: if displaced, prev attacks never succeeded */
                    if (!failed_grab(mtmp, game.youmonst, mattk)) {
                        sum[i] = hitmu(mtmp, mattk);
                    }
                }
                break;
            /* can affect you either ranged or not */
            case 15:
                if (mdat != game.mons[PM_MEDUSA]) {
                    sum[i] = gazemu(mtmp, mattk);
                }
                break;
            case 13:
                if (!range2) {
                    sum[i] = explmu(mtmp, mattk, foundyou);
                }
                break;
            case 11:
                if (!range2) {
                    if (foundyou) {
                        if (game.u.uswallow || (!mtmp.mspec_used && tmp > (j = rnd(20 + i)))) {
                            /* Medusa gaze already operated through m_respond in
               dochug(); don't gaze more than once per round. */
                            /* force swallowing monster to be displayed
                           even when hero is moving away */
                            flush_screen(1);
                            sum[i] = gulpmu(mtmp, mattk);
                        } else {
                            missmu(mtmp, (tmp == j), mattk);
                        }
                    } else if ((dmgtype_fromattack((mtmp.data), 26, 11) != null)) {
                        pline_mon(mtmp, "%s gulps some air!", Monnam(mtmp));
                    } else {
                        if (youseeit) {
                            pline_mon(mtmp, "%s lunges forward and recoils!", Monnam(mtmp));
                        } else {
                            if (((mtmp.data).mlet == S_VORTEX || (mtmp.data) == game.mons[PM_AIR_ELEMENTAL])) {
                                ;
                            }
                            You_hear("a %s nearby.", ((mtmp.data).mlet == S_VORTEX || (mtmp.data) == game.mons[PM_AIR_ELEMENTAL]) ? "rushing noise" : "splat");
                        }
                    }
                }
                break;
            case 12:
                if (range2) {
                    sum[i] = breamu(mtmp, mattk);
                }
                break;
            case 10:
                if (range2) {
                    sum[i] = spitmu(mtmp, mattk);
                }
                break;
            case 254:
                if (range2) {
                    if (!(((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                        thrwmu(mtmp);
                    }
                } else {
                    let hittmp = 0;
                    if (mtmp.weapon_check == NEED_WEAPON || !((mtmp).mw)) {
                        /* Rare but not impossible.  Normally the monster
                 * wields when 2 spaces away, but it can be
                 * teleported or whatever....
                 */
                        mtmp.weapon_check = NEED_HTH_WEAPON;
                        /* mon_wield_item resets weapon_check as appropriate */
                        if (mon_wield_item(mtmp) != 0) {
                            break;
                        }
                    }
                    if (foundyou) {
                        game.mon_currwep = ((mtmp).mw);
                        if (game.mon_currwep) {
                            let bash = (((game.mon_currwep.oclass == WEAPON_CLASS || game.mon_currwep.oclass == TOOL_CLASS) && (game.objects[game.mon_currwep.otyp].oc_subtyp == P_POLEARMS || game.objects[game.mon_currwep.otyp].oc_subtyp == P_LANCE || is_art(game.mon_currwep, ART_SNICKERSNEE))) && !is_art(game.mon_currwep, ART_SNICKERSNEE) && (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2));
                            hittmp = hitval(game.mon_currwep, game.youmonst);
                            tmp += hittmp;
                            mswings(mtmp, game.mon_currwep, bash);
                        }
                        if (tmp > (j = game.mhitu_dieroll = rnd(20 + i))) {
                            sum[i] = hitmu(mtmp, mattk);
                        } else {
                            missmu(mtmp, (tmp == j), mattk);
                        }
                        /* KMH -- Don't accumulate to-hit bonuses */
                        if (game.mon_currwep) {
                            tmp -= hittmp;
                        }
                    } else {
                        wildmiss(mtmp, mattk);
                        skipnonmagc = (1);
                    }
                }
                break;
            case 255:
                if (range2) {
                    sum[i] = buzzmu(mtmp, mattk);
                } else {
                    sum[i] = castmu(mtmp, mattk, (1), foundyou);
                }
                break;
            default:
                break;
        }
        if (game.disp.botl) {
            bot();
        }
        if (sum[i] == 1) {
            if (game.u.usleep && game.u.usleep < game.moves && !rn2(10)) {
                /* give player a chance of waking up before dying -kaa */
                game.multi = -1;
                game.nomovemsg = "The combat suddenly awakens you.";
            }
        }
        if ((sum[i] & 4)) {
            return 1;
        }
        /* sum[i] == 0: unsuccessful attack */
        if ((sum[i] & 8)) {
            break;
        }
    }
    return 0;
}
/* monster summons help for its fight against hero */
export function summonmu(mtmp, youseeit) {
    let mdat = mtmp.data;
    if ((((mdat).mflags2 & 256) != 0)) {
        if (mdat != game.mons[PM_BALROG] && mdat != game.mons[PM_AMOROUS_DEMON]) {
            /*
     * Extracted from mattacku() to reduce clutter there.
     * Caller has verified that 'mtmp' hasn't been cancelled
     * and isn't a shapechanger.
     */
            if (!rn2(In_hell(game.u.uz) ? 10 : 16)) {
                msummon(mtmp);
            }
        }
        return;
    }
    if ((((mdat).mflags2 & 4) != 0)) {
        if ((((mdat).mflags2 & 8) != 0)) {
            /* if hero has Protection_from_shape_changers, new_were() will work
           in the critter-to-human direction but be a no-op the other way;
           we repeat the criteria here for clarity */
            /* maybe switch to animal form */
            if (!(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && !rn2(5 - (night() * 2))) {
                new_were(mtmp);
            }
        } else {
            /* maybe switch to back human form */
            if ((game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) || !rn2(30)) {
                new_were(mtmp);
            }
        }
        mdat = mtmp.data;
        if (!rn2(10)) {
            /* maybe summon compatible critters;
           not blocked by Protection_from_shape_changers */
            let numseen = 0;
            let numhelp = 0;
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let genericwere = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            genericwere = strcpy(genericwere, "creature");
            if (youseeit) {
                pline_mon(mtmp, "%s summons help!", Monnam(mtmp));
            }
            numhelp = were_summon(mdat, (0), { get value() { return numseen; }, set value(_v) { numseen = _v; } }, genericwere);
            if (youseeit) {
                if (numhelp > 0) {
                    if (numseen == 0) {
                        You_feel("hemmed in.");
                    }
                } else {
                    pline("But none comes.");
                }
            } else {
                let from_nowhere = null;
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    pline("%s %s!", c_common_strings.c_Something, makeplural(growl_sound(mtmp)));
                    from_nowhere = "";
                } else {
                    from_nowhere = " from nowhere";
                }
                if (numhelp > 0) {
                    if (numseen < 1) {
                        You_feel("hemmed in.");
                    } else {
                        if (numseen == 1) {
                            buf = sprintf(buf, "%s appears", an(genericwere));
                        } else {
                            buf = sprintf(buf, "%s appear", makeplural(genericwere));
                        }
                        pline("%s%s!", upstart(buf), from_nowhere);
                    }
                }
            }
        }
        return;
    }
}
export function diseasemu(mdat) {
    if ((game.u.uprops[SICK_RES].intrinsic || game.u.uprops[SICK_RES].extrinsic || defended(game.youmonst, 33))) {
        You_feel("a slight illness.");
        return (0);
    } else {
        make_sick(game.u.uprops[SICK].intrinsic ? Math.trunc(game.u.uprops[SICK].intrinsic / 3) + 1 : (rn2((acurr(A_CON))) + (20)), mdat.pmnames[NEUTRAL], (1), 2);
        return (1);
    }
}
/* check whether slippery clothing protects from hug or wrap attack */
export function u_slip_free(mtmp, mattk) {
    let obj = null;
    /* greased armor does not protect against AT_ENGL+AD_WRAP */
    if (mattk.aatyp == 11) {
        return (0);
    }
    obj = (game.uarmc ? game.uarmc : game.uarm);
    if (!obj) {
        obj = game.uarmu;
    }
    if (mattk.adtyp == 32) {
        obj = game.uarmh;
    }
    if (obj && (obj.greased || obj.otyp == OILSKIN_CLOAK) && (!obj.cursed || rn2(3))) {
        /* if your cloak/armor is greased, monster slips off; this
       protection might fail (33% chance) when the armor is cursed */
        pline_mon(mtmp, "%s %s your %s %s!", Monnam(mtmp), (mattk.adtyp == 28) ? "slips off of" : "grabs you, but cannot hold onto", obj.greased ? "greased" : "slippery", (obj.greased || game.objects[obj.otyp].oc_name_known) ? xname(obj) : cloak_simple_name(obj));
        if (obj.greased && !rn2(2)) {
            /* avoid "slippery slippery cloak"
                 for undiscovered oilskin cloak */
            pline_The("grease wears off.");
            obj.greased = 0;
            update_inventory();
        }
        return (1);
    }
    return (0);
}
/* armor that sufficiently covers the body might be able to block magic */
export function magic_negation(mon) {
    let o = null;
    let wearmask = 0;
    let armpro = 0;
    let mc = 0;
    let is_you = (mon == game.youmonst);
    let via_amul = (0);
    let gotprot = is_you ? (game.u.uprops[PROTECTION].extrinsic != 0) : (mon.data == game.mons[PM_HIGH_CLERIC]);
    for (o = is_you ? game.invent : mon.minvent; o; o = o.nobj) {
        if ((o.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) != 0) {
            /* high priests have innate protection */
            /* a_can field is only applicable for armor (which must be worn) */
            armpro = game.objects[o.otyp].oc_oc2;
            if (armpro > mc) {
                mc = armpro;
            }
        } else if ((o.owornmask & 65536) != 0) {
            via_amul = (o.otyp == AMULET_OF_GUARDING);
        }
        /* if we've already confirmed Protection, skip additional checks */
        if (is_you || gotprot) {
            continue;
        }
        /* omit W_SWAPWEP+W_QUIVER; W_ART+W_ARTI handled by protects() */
        wearmask = (1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288);
        if (o.oclass == WEAPON_CLASS || ((o).oclass == TOOL_CLASS && game.objects[(o).otyp].oc_subtyp != P_NONE)) {
            wearmask |= 256;
        }
        if (protects(o, ((o.owornmask & wearmask) != 0) ? (1) : (0))) {
            gotprot = (1);
        }
    }
    if (gotprot) {
        /* extrinsic Protection increases mc by 1 (2 for amulet of guarding);
           multiple sources don't provide multiple increments */
        mc += via_amul ? 2 : 1;
        if (mc > 3) {
            mc = 3;
        }
    } else if (mc < 1) {
        /* intrinsic Protection is weaker (play balance; obtaining divine
           protection is too easy); it confers minimum mc 1 instead of 0 */
        if ((is_you && ((game.u.uprops[PROTECTION].intrinsic && game.u.ublessed > 0) || game.u.uspellprot)) || (mon.data == game.mons[PM_ALIGNED_CLERIC] || (((mon.data).mflags2 & 4096) != 0))) {
            mc = 1;
        }
    }
    return mc;
}
/*
 * hitmu: monster hits you
 * returns MM_ flags
*/
export function hitmu(mtmp, mattk) {
    let mdat = mtmp.data;
    let olduasmon = game.youmonst.data;
    let res = 0;
    let mhm = { damage: 0, hitflags: 0, done: 0, permdmg: 0, specialdmg: 0, dieroll: 0 };
    mhm.hitflags = 0;
    mhm.permdmg = 0;
    mhm.specialdmg = 0;
    mhm.done = (0);
    if (!(canseemon(mtmp) || sensemon(mtmp))) {
        map_invisible(mtmp.mx, mtmp.my);
    }
    if (mtmp.mundetected && ((((mdat).mflags1 & 128) != 0) || mdat.mlet == S_EEL)) {
        /*  If the monster is undetected & hits you, you should know where
     *  the attack came from.
     */
        mtmp.mundetected = 0;
        if (!tp_sensemon(mtmp) && !(game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic)) {
            let obj = null;
            let what = null;
            let Amonbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            if ((obj = game.level.objects[mtmp.mx][mtmp.my]) != null) {
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !obj.dknown) {
                    what = c_common_strings.c_something;
                } else if (is_pool(mtmp.mx, mtmp.my) && !(game.u.uinwater)) {
                    what = "the water";
                } else {
                    what = doname(obj);
                }
                Amonbuf = strcpy(Amonbuf, Amonnam(mtmp));
                /* mtmp might be invisible with hero unable to see same */
                if (!strcmp(Amonbuf, "It")) {
                    Amonbuf = strcpy(Amonbuf, c_common_strings.c_Something);
                }
                pline("%s was hidden under %s!", Amonbuf, what);
            }
            newsym(mtmp.mx, mtmp.my);
        }
    }
    /*  First determine the base damage done */
    mhm.damage = d(mattk.damn, mattk.damd);
    if (((((mdat).mflags2 & 2) != 0) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) && midnight()) {
        mhm.damage += d(mattk.damn, mattk.damd);
    }
    mhitm_adtyping(mtmp, mattk, game.youmonst, mhm);
    mhitm_knockback(mtmp, game.youmonst, mattk, { get value() { return mhm.hitflags; }, set value(_v) { mhm.hitflags = _v; } }, (((mtmp).mw) != null));
    if (mhm.done) {
        return mhm.hitflags;
    }
    if (((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp) < 1) {
        /* already dead? call rehumanize() or done_in_by() as appropriate */
        mdamageu(mtmp, 1);
        mhm.damage = 0;
    }
    if (mhm.damage && game.u.uac < 0) {
        /*  Negative armor class reduces damage done instead of fully protecting
     *  against hits.
     */
        mhm.damage -= rnd(-game.u.uac);
        if (mhm.damage < 1) {
            mhm.damage = 1;
        }
    }
    if (mhm.damage > 0) {
        /* [Half_physical_damage isn't applied to mhm.permdmg] */
        if ((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic) || ((game.urole.mnum == (PM_CLERIC)) && game.uarmh && is_quest_artifact(game.uarmh) && mon_hates_blessings(mtmp))) {
            mhm.damage = Math.trunc((mhm.damage + 1) / 2);
        }
        if (mhm.permdmg) {
            /* Mitre of Holiness, even if not currently blessed */
            /* Death's life force drain */
            let lowerlimit = 0;
            let hpmax_p = null;
            /*
             * Apply some of the damage to permanent hit points:
             *  polymorphed         100% against poly'd hpmax
             *  hpmax > 25*lvl      100% against normal hpmax
             *  hpmax > 10*lvl  50..100%
             *  hpmax >  5*lvl  25..75%
             *  otherwise        0..50%
             * Never reduces hpmax below 1 hit point per level.
             */
            mhm.permdmg = rn2(Math.trunc(mhm.damage / 2) + 1);
            if ((game.u.umonnum != game.u.umonster) || game.u.uhpmax > 25 * game.u.ulevel) {
                mhm.permdmg = mhm.damage;
            } else if (game.u.uhpmax > 10 * game.u.ulevel) {
                mhm.permdmg += Math.trunc(mhm.damage / 2);
            } else if (game.u.uhpmax > 5 * game.u.ulevel) {
                mhm.permdmg += Math.trunc(mhm.damage / 4);
            }
            if ((game.u.umonnum != game.u.umonster)) {
                hpmax_p = { get value() { return game.u.mhmax; }, set value(v) { game.u.mhmax = v; } };
                /* [can't use gy.youmonst.m_lev] */
                lowerlimit = ((game.youmonst.data.mlevel) < (game.u.ulevel) ? (game.youmonst.data.mlevel) : (game.u.ulevel));
            } else {
                hpmax_p = { get value() { return game.u.uhpmax; }, set value(v) { game.u.uhpmax = v; } };
                lowerlimit = minuhpmax(1);
            }
            if (hpmax_p.value - mhm.permdmg > lowerlimit) {
                hpmax_p.value -= mhm.permdmg;
            } else if (hpmax_p.value > lowerlimit) {
                hpmax_p.value = lowerlimit;
            }
            /* else unlikely...
             * already at or below minimum threshold, do nothing to hpmax */
            game.disp.botl = (1);
        }
        mdamageu(mtmp, mhm.damage);
    }
    if (mhm.damage) {
        res = passiveum(olduasmon, mtmp, mattk);
    } else {
        res = 1;
    }
    stop_occupation();
    return res;
}
/* An interface for use when taking a blindfold off, for example,
 * to see if an engulfing attack should immediately take affect, like
 * a passive attack. TRUE if engulfing blindness occurred */
export function gulp_blnd_check() {
    let mattk = null;
    if (!(game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked) && game.u.uswallow && (mattk = attacktype_fordmg(game.u.ustuck.data, 11, 11)) && can_blnd(game.u.ustuck, game.youmonst, mattk.aatyp, null)) {
        /* compensate for gulpmu change */
        ++game.u.uswldtim;
        gulpmu(game.u.ustuck, mattk);
        return (1);
    }
    return (0);
}
/* monster swallows you, or damage if already swallowed (u.uswallow != 0) */
export function gulpmu(mtmp, mattk) {
    let t = t_at(game.u.ux, game.u.uy);
    let tmp = d(mattk.damn, mattk.damd);
    let tim_tmp = 0;
    let otmp2 = null;
    let nextobj = null;
    let i = 0;
    let physical_damage = (0);
    if (!game.u.uswallow) {
        let omx = mtmp.mx;
        let omy = mtmp.my;
        if (!engulf_target(mtmp, game.youmonst)) {
            return 0;
        }
        if ((t && ((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT)) && sobj_at(BOULDER, game.u.ux, game.u.uy)) {
            return 0;
        }
        if (failed_grab(mtmp, game.youmonst, mattk)) {
            return 0;
        }
        if ((game.uball != null)) {
            unplacebc();
        }
        game.level.monsters[omx][omy] = null;
        mtmp.mtrapped = 0;
        place_monster(mtmp, game.u.ux, game.u.uy);
        set_ustuck(mtmp);
        newsym(mtmp.mx, mtmp.my);
        if (game.u.usteed) {
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            buf = strcpy(buf, mon_nam(game.u.usteed));
            urgent_pline("%s %s forward and plucks you off %s!", Some_Monnam(mtmp), (((mtmp.data).mflags1 & 262144) != 0) ? "lunges" : ((mtmp.data).mlet == S_VORTEX || (mtmp.data) == game.mons[PM_AIR_ELEMENTAL]) ? "whirls" : (((mtmp.data).mflags1 & 1048576) != 0) ? "flows" : (((mtmp.data).mflags1 & 4) != 0) ? "oozes" : "surges", buf);
            dismount_steed(DISMOUNT_ENGULFED);
        } else {
            urgent_pline("%s %s!", Monnam(mtmp), (dmgtype_fromattack((mtmp.data), 26, 11) != null) ? "swallows you whole" : (dmgtype_fromattack((mtmp.data), 28, 11) != null) ? "folds itself around you" : "engulfs you");
        }
        stop_occupation();
        /* behave as if you had moved */
        reset_occupations();
        if (game.u.utrap) {
            /* none (some 'v', already whirling) */
            /* none (all AT_ENGL are already covered) */
            You("are released from the %s!", (game.u.utraptype == TT_WEB) ? "web" : "trap");
            reset_utrap((0));
        }
        i = number_leashed();
        if (i > 0) {
            let s = (i > 1) ? "leashes" : "leash";
            pline_The("%s %s loose.", s, vtense(s, "snap"));
            unleash_all();
        }
        if (((game.youmonst.data) == game.mons[PM_COCKATRICE] || (game.youmonst.data) == game.mons[PM_CHICKATRICE]) && !Resists_Elem(mtmp, STONE_RES)) {
            game.level.monsters[mtmp.mx][mtmp.my] = null;
            /* put the attacker back where it started;
               the resulting statue will end up there
               [note: if poly'd hero could ride or non-poly'd hero could
               acquire touch_petrifies() capability somehow, this code
               would need to deal with possibility of steed having taken
               engulfer's previous spot when hero was forcibly dismounted] */
            place_monster(mtmp, omx, omy);
            minstapetrify(mtmp, (1));
            /* normally unstuck() would do this, but we're not
               fully swallowed yet so that won't work here */
            if ((game.uball != null)) {
                placebc();
            }
            set_ustuck(null);
            return (!((mtmp).mhp < 1)) ? 0 : 4;
        }
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        vision_recalc(2);
        game.u.uswallow = 1;
        if (mattk.adtyp == 26) {
            /* for digestion, shorter time is more dangerous;
           for other swallowings, longer time means more
           chances for the swallower to attack */
            /* having good armor & high constitution makes
               it take longer for you to be digested, but
               you'll end up trapped inside for longer too */
            tim_tmp = (acurr(A_CON)) + 10 - game.u.uac + rn2(20);
            if (tim_tmp < 0) {
                tim_tmp = 0;
            }
            tim_tmp = Math.trunc(tim_tmp / mtmp.m_lev);
            tim_tmp += 3;
        } else {
            /* higher level attacker takes longer to eject hero */
            tim_tmp = rnd(mtmp.m_lev + Math.trunc(10 / 2));
        }
        /* u.uswldtim always set > 1 */
        game.u.uswldtim = ((tim_tmp < 2) ? 2 : tim_tmp);
        /* update the map display, shows hero swallowed */
        swallowed(1);
        if (!((mtmp.data) == game.mons[PM_FIRE_VORTEX] || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_SALAMANDER])) {
            for (otmp2 = game.invent; otmp2; otmp2 = nextobj) {
                nextobj = otmp2.nobj;
                snuff_lit(otmp2);
            }
        }
    }
    if (mtmp != game.u.ustuck) {
        return 0;
    }
    if ((game.uball != null)) {
        /* ball&chain are in limbo while swallowed; update their internal
           location to be at swallower's spot */
        if (game.uchain.where == 0) {
            game.uchain.ox = mtmp.mx , game.uchain.oy = mtmp.my;
        }
        if (game.uball.where == 0) {
            game.uball.ox = mtmp.mx , game.uball.oy = mtmp.my;
        }
    }
    if (game.u.uswldtim > 0) {
        game.u.uswldtim -= 1;
    }
    switch (mattk.adtyp) {
        case 26:
            physical_damage = (1);
            if ((game.u.uprops[SLOW_DIGESTION].intrinsic || game.u.uprops[SLOW_DIGESTION].extrinsic)) {
                /* Messages are handled below */
                game.u.uswldtim = 0;
                tmp = 0;
            } else if (game.u.uswldtim == 0) {
                pline("%s totally digests you!", Monnam(mtmp));
                tmp = game.u.uhp;
                if ((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) {
                    tmp *= 2;
                }
            } else {
                pline("%s%s digests you!", Monnam(mtmp), (game.u.uswldtim == 2) ? " thoroughly" : (game.u.uswldtim == 1) ? " utterly" : "");
                exercise(A_STR, (0));
            }
            break;
        case 0:
            physical_damage = (1);
            if (mtmp.data == game.mons[PM_FOG_CLOUD]) {
                You("are laden with moisture and %s", ((game.youmonst.data) == game.mons[PM_FIRE_VORTEX] || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_SALAMANDER]) ? "are smoldering out!" : (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)) ? "find it mildly uncomfortable." : (((game.youmonst.data).mflags1 & 512) != 0) ? "feel comforted." : "can barely breathe!");
                if (((game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0)) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))) && !((game.youmonst.data) == game.mons[PM_FIRE_VORTEX] || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_SALAMANDER])) {
                    tmp = 0;
                }
            } else {
                You("are %s!", (dmgtype_fromattack((mtmp.data), 28, 11) != null) ? "being squashed" : "pummeled with debris");
                exercise(A_STR, (0));
            }
            break;
        case 8:
            if ((game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
                You("are covered with a seemingly harmless goo.");
                /* NB: the monst[un]seesu calls in gulpmu are no-ops since the
               hero must be currently swallowed for the attack to hit... */
                monstseesu(M_SEEN_ACID);
                tmp = 0;
            } else {
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    pline("Ouch!  You've been slimed!");
                } else {
                    You("are covered in slime!  It burns!");
                }
                exercise(A_STR, (0));
                monstunseesu(M_SEEN_ACID);
            }
            break;
        case 11:
            if (can_blnd(mtmp, game.youmonst, mattk.aatyp, null)) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    let was_blinded = (game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked);
                    if (!(game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked)) {
                        You_cant("see in here!");
                    }
                    make_blinded(tmp, (0));
                    if (!was_blinded && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        Your("%s", c_common_strings.c_vision_clears);
                    }
                /* keep him blind until disgorged */
                } else {
                    incr_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, 1);
                }
            }
            tmp = 0;
            break;
        case 6:
            if (!mtmp.mcan && rn2(2)) {
                pline_The("air around you crackles with electricity.");
                if ((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
                    shieldeff(game.u.ux, game.u.uy);
                    You("seem unhurt.");
                    monstseesu(M_SEEN_ELEC);
                    ugolemeffects(6, tmp);
                    tmp = 0;
                } else {
                    monstunseesu(M_SEEN_ELEC);
                }
            } else {
                tmp = 0;
            }
            break;
        case 3:
            if (!mtmp.mcan && rn2(2)) {
                if ((game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic)) {
                    shieldeff(game.u.ux, game.u.uy);
                    You_feel("mildly chilly.");
                    monstseesu(M_SEEN_COLD);
                    ugolemeffects(3, tmp);
                    tmp = 0;
                } else {
                    You("are freezing to death!");
                    monstunseesu(M_SEEN_COLD);
                }
            } else {
                tmp = 0;
            }
            break;
        case 2:
            if (!mtmp.mcan && rn2(2)) {
                if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                    shieldeff(game.u.ux, game.u.uy);
                    You_feel("mildly hot.");
                    monstseesu(M_SEEN_FIRE);
                    ugolemeffects(2, tmp);
                    tmp = 0;
                } else {
                    You("are burning to a crisp!");
                    monstunseesu(M_SEEN_FIRE);
                }
                burn_away_slime();
            } else {
                tmp = 0;
            }
            break;
        case 33:
            if (!diseasemu(mtmp.data)) {
                tmp = 0;
            }
            break;
        case 16:
            if (!mtmp.mcan && rn2(4)) {
                drain_en(tmp, (0));
            }
            tmp = 0;
            break;
        default:
            physical_damage = (1);
            tmp = 0;
            break;
    }
    if (physical_damage) {
        /* same damage reduction for AC as in hitmu */
        if (game.u.uac < 0) {
            tmp -= rnd(-game.u.uac);
        }
        if (tmp < 0) {
            tmp = 1;
        }
        tmp = (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((tmp) + 1) / 2)) : (tmp));
    }
    game.mswallower = mtmp;
    mdamageu(mtmp, tmp);
    game.mswallower = null;
    if (tmp) {
        stop_occupation();
    }
    if (!game.u.uswallow) {
        ;
    } else if (((game.youmonst.data) == game.mons[PM_COCKATRICE] || (game.youmonst.data) == game.mons[PM_CHICKATRICE]) && !Resists_Elem(mtmp, STONE_RES)) {
        /* life-saving has already expelled swallowed hero */
        pline("%s very hurriedly %s you!", Monnam(mtmp), (dmgtype_fromattack((mtmp.data), 26, 11) != null) ? "regurgitates" : (dmgtype_fromattack((mtmp.data), 28, 11) != null) ? "releases" : "expels");
        expels(mtmp, mtmp.data, (0));
    } else if (!game.u.uswldtim || game.youmonst.data.msize >= 4) {
        /* As of 3.6.2: u.uswldtim used to be set to 0 by life-saving but it
           expels now so the !u.uswldtim case is no longer possible;
           however, polymorphing into a huge form while already
           swallowed is still possible */
        You("get %s!", (dmgtype_fromattack((mtmp.data), 26, 11) != null) ? "regurgitated" : (dmgtype_fromattack((mtmp.data), 28, 11) != null) ? "released" : "expelled");
        if (game.flags.verbose && ((dmgtype_fromattack((mtmp.data), 26, 11) != null) && (game.u.uprops[SLOW_DIGESTION].intrinsic || game.u.uprops[SLOW_DIGESTION].extrinsic))) {
            pline("Obviously %s doesn't like your taste.", mon_nam(mtmp));
        }
        expels(mtmp, mtmp.data, (0));
    }
    return 1;
}
/* monster explodes in your face */
export function explmu(mtmp, mattk, ufound) {
    let kill_agr = (1);
    let not_affected = 0;
    let tmp = 0;
    if (mtmp.mcan) {
        return 0;
    }
    tmp = d(mattk.damn, mattk.damd);
    not_affected = defended(mtmp, mattk.adtyp);
    if (!ufound) {
        pline("%s explodes at a spot in %s!", canseemon(mtmp) ? Monnam(mtmp) : "It", is_waterwall(mtmp.mux, mtmp.muy) ? "empty water" : "thin air");
    } else {
        hitmsg(mtmp, mattk);
    }
    switch (mattk.adtyp) {
        case 3:
        case 2:
        case 6:
            mon_explodes(mtmp, mattk);
            if (!((mtmp).mhp < 1)) {
                /* already killed (maybe lifesaved) */
                kill_agr = (0);
            }
            break;
        case 11:
            not_affected = resists_blnd(game.youmonst);
            if (ufound && !not_affected) {
                if (mon_visible(mtmp) || (rnd(tmp = Math.trunc(tmp / 2)) > game.u.ulevel)) {
                    /* sometimes you're affected even if it's invisible */
                    You("are blinded by a blast of light!");
                    make_blinded(tmp, (0));
                    /* not blind at this point implies you're wearing
                   the Eyes of the Overworld; make them block this
                   particular stun attack too */
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        Your("%s", c_common_strings.c_vision_clears);
                    }
                } else if (game.flags.verbose) {
                    You("get the impression it was not terribly bright.");
                }
            }
            break;
        case 36:
            not_affected |= ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.umonnum == PM_BLACK_LIGHT || game.u.umonnum == PM_VIOLET_FUNGUS || dmgtype(game.youmonst.data, 12));
            if (ufound && !not_affected) {
                let chg = 0;
                if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    You("are caught in a blast of kaleidoscopic light!");
                }
                /* avoid hallucinating the black light as it dies */
                mondead(mtmp);
                kill_agr = (0);
                chg = make_hallucinated(game.u.uprops[HALLUC].intrinsic + tmp, (0), 0);
                You("%s.", chg ? "are freaked out" : "seem unaffected");
            }
            break;
        default:
            impossible("unknown exploder damage type %d", mattk.adtyp);
            break;
    }
    if (not_affected) {
        You("seem unaffected by it.");
        ugolemeffects(mattk.adtyp, tmp);
    }
    if (kill_agr && !((mtmp).mhp < 1)) {
        mondead(mtmp);
    }
    wake_nearto(mtmp.mx, mtmp.my, 7 * 7);
    return (!((mtmp).mhp < 1)) ? 0 : 4;
}
/* monster gazes at you */
const __gazemu_reactions = ["confused", "stunned", "puzzled", "dazzled", "irritated", "inflamed", "tired", "dulled"];
export function gazemu(mtmp, mattk) {
    let react = -1;
    let is_medusa = 0;
    let reflectable = 0;
    let cancelled = (mtmp.mcan != 0);
    let already = (0);
    let mcanseeu = (canseemon(mtmp) && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) && mtmp.mcansee);
    if (((mtmp).seen_resistance & (cvt_adtyp_to_mseenres(mattk.adtyp)))) {
        return 0;
    }
    is_medusa = (mtmp.data == game.mons[PM_MEDUSA]);
    reflectable = ((game.u.uprops[REFLECTING].intrinsic || game.u.uprops[REFLECTING].extrinsic) && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) && is_medusa);
    /* assumes that hero has to see monster's gaze in order to be
       affected, rather than monster just having to look at hero;
       Unaware:  asleep or unconscious => not blind but won't see;
       when hallucinating, hero's brain doesn't register what
       it's seeing correctly so the gaze is usually ineffective
       [this could be taken a lot farther and select a gaze effect
       appropriate to what's currently being displayed, giving
       ordinary monsters a gaze attack when hero thinks he or she
       is facing a gazing creature, but let's not go that far...] */
    if (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && rn2(4)) || ((game.multi < 0 && (unconscious() || is_fainted())) && !reflectable)) {
        cancelled = (1);
    }
    switch (mattk.adtyp) {
        case 18:
            if (cancelled || !mtmp.mcansee) {
                /* note: Medusa is the only monster with stoning gaze, so
           'is_medusa' will always be True here */
                if (!canseemon(mtmp)) {
                    break;
                }
                if ((game.multi < 0 && (unconscious() || is_fainted()))) {
                    /* can't see attacker even though not blind */
                    react = is_medusa ? 4 : 2;
                    break;
                }
                if (is_medusa && (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !rn2(3)) {
                    pline("Someone seems overdue for a serpent cut.");
                } else {
                    pline_mon(mtmp, "%s %s.", Monnam(mtmp), (is_medusa && mtmp.mcan && !react) ? "doesn't look all that ugly" : "gazes ineffectually");
                }
                break;
            }
            if (reflectable) {
                /* hero has line of sight to Medusa and she's not blind */
                let useeit = canseemon(mtmp);
                if (useeit) {
                    ureflects("%s gaze is reflected by your %s.", s_suffix(Monnam(mtmp)));
                }
                if (mon_reflects(mtmp, !useeit ? null : "The gaze is reflected away by %s %s!")) {
                    break;
                }
                if (!((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0))) {
                    /* probably you're invisible */
                    if (useeit) {
                        pline("%s doesn't seem to notice that %s gaze was reflected.", Monnam(mtmp), (genders[pronoun_gender(mtmp, 2)].his));
                    }
                    break;
                }
                if (useeit) {
                    pline_mon(mtmp, "%s is turned to stone!", Monnam(mtmp));
                }
                game.stoned = (1);
                killed(mtmp);
                if (!((mtmp).mhp < 1)) {
                    break;
                }
                return 4;
            }
            if (canseemon(mtmp) && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(game.multi < 0 && (unconscious() || is_fainted()))) {
                You("meet %s gaze.", s_suffix(mon_nam(mtmp)));
                stop_occupation();
                if (poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM)) {
                    break;
                }
                urgent_pline("You turn to stone...");
                game.killer.format = 1;
                game.killer.name = strcpy(game.killer.name, pmname(mtmp.data, Mgender(mtmp)));
                done(STONING);
            }
            break;
        case 25:
            if (mcanseeu && !mtmp.mspec_used && rn2(5)) {
                if (cancelled) {
                    react = 0;
                    already = (mtmp.mconf != 0);
                } else {
                    let conf = d(3, 4);
                    mtmp.mspec_used = mtmp.mspec_used + (conf + rn2(6));
                    if (!game.u.uprops[CONFUSION].intrinsic) {
                        pline_mon(mtmp, "%s gaze confuses you!", s_suffix(Monnam(mtmp)));
                    } else {
                        You("are getting more and more confused.");
                    }
                    make_confused(game.u.uprops[CONFUSION].intrinsic + conf, (0));
                    stop_occupation();
                }
            }
            break;
        case 12:
            if (mcanseeu && !mtmp.mspec_used && rn2(5)) {
                if (cancelled) {
                    react = 1;
                    already = (mtmp.mstun != 0);
                } else {
                    let stun = d(2, 6);
                    mtmp.mspec_used = mtmp.mspec_used + (stun + rn2(6));
                    pline_mon(mtmp, "%s stares piercingly at you!", Monnam(mtmp));
                    make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + stun, (1));
                    stop_occupation();
                }
            }
            break;
        case 11:
            if (canseemon(mtmp) && !resists_blnd(game.youmonst) && dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 8 * 8) {
                if (cancelled) {
                    react = (rn2(2) + (2));
                    already = (mtmp.mcansee == 0);
                    /* Archons gaze every round; we don't want cancelled ones
                   giving the "seems puzzled/dazzled" message that often */
                    if (mtmp.mcan && mtmp.data == game.mons[PM_ARCHON] && rn2(5)) {
                        react = -1;
                    }
                } else {
                    let blnd = d(mattk.damn, mattk.damd);
                    You("are blinded by %s radiance!", s_suffix(mon_nam(mtmp)));
                    make_blinded(blnd, (0));
                    stop_occupation();
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        Your("%s", c_common_strings.c_vision_clears);
                    } else {
                        let oldstun = (game.u.uprops[STUNNED].intrinsic & 16777215);
                        let newstun = rnd(3);
                        /* we don't want to increment stun duration every time
                       or sighted hero will become incapacitated */
                        make_stunned(((oldstun) > (newstun) ? (oldstun) : (newstun)), (1));
                    }
                }
            }
            break;
        case 2:
            if (mcanseeu && !mtmp.mspec_used && rn2(5)) {
                if (cancelled) {
                    /* "irritated" || "inflamed" */
                    react = (rn2(2) + (4));
                } else {
                    let dmg = d(2, 6);
                    let orig_dmg = dmg;
                    let lev = mtmp.m_lev;
                    pline_mon(mtmp, "%s attacks you with a fiery gaze!", Monnam(mtmp));
                    stop_occupation();
                    if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                        shieldeff(game.u.ux, game.u.uy);
                        pline_The("fire doesn't feel hot!");
                        monstseesu(M_SEEN_FIRE);
                        ugolemeffects(2, d(12, 6));
                        dmg = 0;
                    } else {
                        monstunseesu(M_SEEN_FIRE);
                    }
                    burn_away_slime();
                    if (lev > rn2(20)) {
                        burnarmor(game.youmonst);
                    }
                    if (lev > rn2(20)) {
                        destroy_items(game.youmonst, 2, orig_dmg);
                        ignite_items(game.invent);
                    }
                    if (dmg) {
                        mdamageu(mtmp, dmg);
                    }
                }
            }
            break;
        default:
            impossible("Gaze attack %d?", mattk.adtyp);
            break;
    }
    if (react >= 0) {
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && rn2(3)) {
            react = rn2((Math.trunc(8 /* sizeof(const char *const [8]) */ / 1 /* sizeof(const char *const) */)));
        }
        /* cancelled/hallucinatory feedback; monster might look "confused",
           "stunned",&c but we don't actually set corresponding attribute */
        pline_mon(mtmp, "%s looks %s%s.", Monnam(mtmp), !rn2(3) ? "" : already ? "quite " : (!rn2(2) ? "a bit " : "somewhat "), __gazemu_reactions[react]);
    }
    return 0;
}
/* mtmp hits you for n points damage */
export function mdamageu(mtmp, n) {
    if (n < 0) {
        impossible("mdamageu for negative damage? (%d)", n);
        n = 0;
    }
    game.disp.botl = (1);
    if ((game.u.umonnum != game.u.umonster)) {
        game.u.mh -= n;
        showdamage(n);
        /* caller might have reduced mhmax before calling mdamageu() */
        if (game.u.mh > game.u.mhmax) {
            game.u.mh = game.u.mhmax;
        }
        if (game.u.mh < 1) {
            rehumanize();
        }
    } else {
        game.u.uhp -= n;
        showdamage(n);
        /* caller might have reduced uhpmax before calling mdamageu() */
        if (game.u.uhp > game.u.uhpmax) {
            game.u.uhp = game.u.uhpmax;
        }
        if (game.u.uhp < 1) {
            done_in_by(mtmp, DIED);
        }
    }
}
/* returns 0 if seduction impossible,
 *         1 if fine,
 *         2 if wrong gender for nymph
 */
/* non-Null: current atk; Null: genrl capability */
export function could_seduce(magr, mdef, mattk) {
    let pagr = null;
    let agrinvis = 0;
    let defperc = 0;
    let genagr = 0;
    let gendef = 0;
    let adtyp = 0;
    if ((((magr.data).mflags1 & 262144) != 0)) {
        return 0;
    }
    if (magr == game.youmonst) {
        pagr = game.youmonst.data;
        agrinvis = (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) != 0);
        genagr = poly_gender();
    } else {
        pagr = magr.data;
        agrinvis = magr.minvis;
        genagr = gender(magr);
    }
    if (mdef == game.youmonst) {
        defperc = ((game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) != 0);
        gendef = poly_gender();
    } else {
        defperc = (((mdef.data).mflags1 & 16777216) != 0);
        gendef = gender(mdef);
    }
    adtyp = mattk ? mattk.adtyp : dmgtype(pagr, 35) ? 35 : dmgtype(pagr, 22) ? 22 : 0;
    if (adtyp == 35 && !game.sysopt.seduce) {
        adtyp = 22;
    }
    if (agrinvis && !defperc && adtyp == 22) {
        return 0;
    }
    /* nymphs have two attacks, one for steal-item damage and the other
       for seduction, both pass the could_seduce() test;
       incubi/succubi have three attacks, their claw attacks for damage
       don't pass the test */
    if ((pagr.mlet != S_NYMPH && pagr != game.mons[PM_AMOROUS_DEMON]) || (adtyp != 22 && adtyp != 35 && adtyp != 21)) {
        return 0;
    }
    return (genagr == 1 - gendef) ? 1 : (pagr.mlet == S_NYMPH) ? 2 : 0;
}
/* returns 1 if monster teleported (or hero leaves monster's vicinity) */
export function doseduce(mon) {
    let ring = null;
    let nring = null;
    let fem = (mon.data == game.mons[PM_AMOROUS_DEMON] && Mgender(mon) == FEMALE);
    let seewho = 0;
    let naked = 0;
    let attr_tot = 0;
    let tried_gloves = 0;
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let Who = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (mon.mcan || mon.mspec_used) {
        pline_mon(mon, "%s acts as though %s has got a %sheadache.", Monnam(mon), (genders[pronoun_gender(mon, 2)].he), mon.mcan ? "severe " : "");
        return 0;
    }
    if (unresponsive()) {
        pline_mon(mon, "%s seems dismayed at your lack of response.", Monnam(mon));
        return 0;
    }
    seewho = canseemon(mon);
    if (!seewho) {
        pline("Someone caresses you...");
    } else {
        You_feel("very attracted to %s.", mon_nam(mon));
    }
    Who = strcpy(Who, (!seewho ? (fem ? "She" : "He") : Monnam(mon)));
    /* cache the seducer's name in a local buffer */
    /* if in the process of putting armor on or taking armor off,
       interrupt that activity now */
    stop_donning(null);
    /* don't try to take off gloves if cursed weapon blocks them */
    if (welded(game.uwep)) {
        tried_gloves = 1;
    }
    for (ring = game.invent; ring; ring = nring) {
        nring = ring.nobj;
        if (ring.otyp != RIN_ADORNMENT) {
            continue;
        }
        if (fem) {
            if (ring.owornmask && game.uarmg) {
                /* don't take off worn ring if gloves are in the way */
                /* don't put on ring if gloves are in the way */
                if (!tried_gloves++) {
                    mayberem(mon, Who, game.uarmg, "gloves");
                }
                if (game.uarmg) {
                    continue;
                }
            }
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && rn2(20) < (acurr(A_CHA))) {
                /* next ring might not be worn */
                /* confirmation prompt when charisma is high bypassed if deaf */
                safe_qbuf(qbuf, "\"That ", " looks pretty.  May I have it?\"", ring, xname, simpleonames, "ring");
                discover_object((RIN_ADORNMENT), (1), (1), (1));
                ;
                if (yn_function(qbuf, ynchars, 110, (1)) == 110) {
                    continue;
                }
            } else {
                pline("%s decides she'd like %s, and takes it.", Who, yname(ring));
            }
            discover_object((RIN_ADORNMENT), (1), (1), (1));
            /* might be in left or right ring slot or weapon/alt-wep/quiver */
            if (ring.owornmask) {
                remove_worn_item(ring, (0));
            }
            freeinv(ring);
            mpickobj(mon, ring);
        } else {
            if (game.uleft && game.uright && game.uleft.otyp == RIN_ADORNMENT && game.uright.otyp == RIN_ADORNMENT) {
                break;
            }
            if (ring == game.uleft || ring == game.uright) {
                continue;
            }
            if (game.uarmg) {
                if (!tried_gloves++) {
                    mayberem(mon, Who, game.uarmg, "gloves");
                }
                if (game.uarmg) {
                    break;
                }
            }
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && rn2(20) < (acurr(A_CHA))) {
                /* no point trying further rings */
                safe_qbuf(qbuf, "\"That ", " looks pretty.  Would you wear it for me?\"", ring, xname, simpleonames, "ring");
                discover_object((RIN_ADORNMENT), (1), (1), (1));
                ;
                if (yn_function(qbuf, ynchars, 110, (1)) == 110) {
                    continue;
                }
            } else {
                pline("%s decides you'd look prettier wearing %s,", Who, yname(ring));
                pline("and puts it on your finger.");
            }
            discover_object((RIN_ADORNMENT), (1), (1), (1));
            if (!game.uright) {
                pline("%s puts %s on your right %s.", Who, the(xname(ring)), body_part(HAND));
                setworn(ring, 262144);
            } else if (!game.uleft) {
                pline("%s puts %s on your left %s.", Who, the(xname(ring)), body_part(HAND));
                setworn(ring, 131072);
            } else if (game.uright && game.uright.otyp != RIN_ADORNMENT) {
                /* note: the "replaces" message might be inaccurate if
                   hero's location changes and the process gets interrupted,
                   but trying to figure that out in advance in order to use
                   alternate wording is not worth the effort */
                pline("%s replaces %s with %s.", Who, yname(game.uright), yname(ring));
                Ring_gone(game.uright);
                /* ring removal might cause loss of levitation which could
                   drop hero onto trap that transports hero somewhere else */
                /* removing armor (levitation boots, or levitation ring to make
       room for adornment ring with incubus case) might result in the
       hero falling through a trap door or landing on a teleport trap
       and changing location, so hero might not be adjacent to seducer
       any more (mayberem() has its own adjacency test so we don't need
       to check after each potential removal) */
                /* removal of a previous item might have sent the hero elsewhere
       (loss of levitation that leads to landing on a transport trap) */
                if (game.u.utotype || !(dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 2)) {
                    return 1;
                }
                setworn(ring, 262144);
            } else if (game.uleft && game.uleft.otyp != RIN_ADORNMENT) {
                /* see "replaces" note above */
                pline("%s replaces %s with %s.", Who, yname(game.uleft), yname(ring));
                Ring_gone(game.uleft);
                if (game.u.utotype || !(dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 2)) {
                    return 1;
                }
                setworn(ring, 131072);
            } else {
                impossible("ring replacement");
            }
            Ring_on(ring);
            prinv(null, ring, 0);
        }
    }
    naked = (!game.uarmc && !game.uarmf && !game.uarmg && !game.uarms && !game.uarmh && !game.uarmu);
    urgent_pline("%s %s%s.", Who, (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "seems to murmur into your ear" : naked ? "murmurs sweet nothings into your ear" : "murmurs in your ear", naked ? "" : ", while helping you undress");
    mayberem(mon, Who, game.uarmc, cloak_simple_name(game.uarmc));
    if (!game.uarmc) {
        mayberem(mon, Who, game.uarm, suit_simple_name(game.uarm));
    }
    mayberem(mon, Who, game.uarmf, "boots");
    if (!tried_gloves) {
        mayberem(mon, Who, game.uarmg, "gloves");
    }
    mayberem(mon, Who, game.uarms, "shield");
    mayberem(mon, Who, game.uarmh, helm_simple_name(game.uarmh));
    if (!game.uarmc && !game.uarm) {
        mayberem(mon, Who, game.uarmu, "shirt");
    }
    if (game.u.utotype || !(dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 2)) {
        return 1;
    }
    if (game.uarm || game.uarmc) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            if (!(((yyyymmdd(0) - (getyear() * 10000)) == 229) && mon.female)) {
                ;
                verbalize("You're such a %s; I wish...", game.flags.female ? "sweet lady" : "nice guy");
            } else {
                let yourgloves = u_carried_gloves();
                /* have her call your gloves by their correct
                   name, possibly revealing them to you */
                if (yourgloves) {
                    observe_object(yourgloves);
                }
                verbalize("Well, then you owe me %s%s!", yourgloves ? yname(yourgloves) : "twelve pairs of gloves", yourgloves ? " and eleven more pairs of gloves" : "");
            }
        } else if (seewho) {
            pline_mon(mon, "%s appears to sigh.", Monnam(mon));
        }
        /* else no regret message if can't see or hear seducer */
        if (!tele_restrict(mon)) {
            rloc(mon, 2);
        }
        return 1;
    }
    if (game.u.ualign.type == (-1)) {
        adjalign(1);
    }
    /* by this point you have discovered mon's identity, blind or not... */
    urgent_pline("Time stands still while you and %s lie in each other's arms...", noit_mon_nam(mon));
    /* 3.6.1: a combined total for charisma plus intelligence of 35-1
       used to guarantee successful outcome; now total maxes out at 32
       as far as deciding what will happen; chance for bad outcome when
       Cha+Int is 32 or more is 2/35, a bit over 5.7% */
    attr_tot = (acurr(A_CHA)) + (acurr(A_INT));
    if (rn2(35) > ((attr_tot) < (32) ? (attr_tot) : (32))) {
        /* Don't bother with mspec_used here... it didn't get tired! */
        pline("%s seems to have enjoyed it more than you...", noit_Monnam(mon));
        switch (rn2(5)) {
            case 0:
                You_feel("drained of energy.");
                game.u.uen = 0;
                game.u.uenmax -= rnd((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic) ? 5 : 10);
                exercise(A_CON, (0));
                if (game.u.uenmax < 0) {
                    game.u.uenmax = 0;
                }
                break;
            case 1:
                You("are down in the dumps.");
                adjattrib(A_CON, -1, (1));
                exercise(A_CON, (0));
                game.disp.botl = (1);
                break;
            case 2:
                Your("senses are dulled.");
                adjattrib(A_WIS, -1, (1));
                exercise(A_WIS, (0));
                game.disp.botl = (1);
                break;
            case 3:
                if (!resists_drli(game.youmonst)) {
                    You_feel("out of shape.");
                    losexp("overexertion");
                } else {
                    You("have a curious feeling...");
                }
                exercise(A_CON, (0));
                exercise(A_DEX, (0));
                exercise(A_WIS, (0));
                break;
            case 4:
{
                    let tmp = 0;
                    You_feel("exhausted.");
                    exercise(A_STR, (0));
                    tmp = (rn2(10) + (6));
                    losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((tmp) + 1) / 2)) : (tmp)), "exhaustion", 1);
                    break;
                }
        }
    } else {
        mon.mspec_used = rnd(100);
        You("seem to have enjoyed it more than %s...", noit_mon_nam(mon));
        switch (rn2(5)) {
            case 0:
                You_feel("raised to your full potential.");
                exercise(A_CON, (1));
                game.u.uen = (game.u.uenmax += rnd(5));
                if (game.u.uenmax > game.u.uenpeak) {
                    game.u.uenpeak = game.u.uenmax;
                }
                break;
            case 1:
                You_feel("good enough to do it again.");
                adjattrib(A_CON, 1, (1));
                exercise(A_CON, (1));
                game.disp.botl = (1);
                break;
            case 2:
                You("will always remember %s...", noit_mon_nam(mon));
                adjattrib(A_WIS, 1, (1));
                exercise(A_WIS, (1));
                game.disp.botl = (1);
                break;
            case 3:
                pline("That was a very educational experience.");
                pluslvl((0));
                exercise(A_WIS, (1));
                break;
            case 4:
                You_feel("restored to health!");
                game.u.uhp = game.u.uhpmax;
                if ((game.u.umonnum != game.u.umonster)) {
                    game.u.mh = game.u.mhmax;
                }
                exercise(A_STR, (1));
                game.disp.botl = (1);
                break;
        }
    }
    if (mon.mtame) {
        ;
    } else if (rn2(20) < (acurr(A_CHA))) {
        pline("%s demands that you pay %s, but you refuse...", noit_Monnam(mon), (genders[pronoun_gender(mon, (1 | 2))].him));
    } else if (game.u.umonnum == PM_LEPRECHAUN) {
        pline_mon(mon, "%s tries to take your gold, but fails...", noit_Monnam(mon));
    } else {
        let cost = 0;
        let umoney = money_cnt(game.invent);
        if (umoney > 32767 - 10) {
            cost = rnd(32767) + 500;
        } else {
            cost = rnd(umoney + 10) + 500;
        }
        if (mon.mpeaceful) {
            cost = Math.trunc(cost / 5);
            if (!cost) {
                cost = 1;
            }
        }
        if (cost > umoney) {
            cost = umoney;
        }
        if (!cost) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                verbalize("It's on the house!");
            } else {
                pline("No charge.");
            }
        } else {
            pline_mon(mon, "%s takes %ld %s for services rendered!", noit_Monnam(mon), cost, currency(cost));
            money2mon(mon, cost);
            game.disp.botl = (1);
        }
    }
    if (!rn2(25)) {
        mon.mcan = 1;
    }
    if (!tele_restrict(mon)) {
        rloc(mon, 2);
    }
    return 1;
}
/* 'mon' tries to remove a piece of hero's armor */
/* only used for alternate message */
export function mayberem(mon, seducer, obj, str) {
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!obj || !obj.owornmask) {
        return;
    }
    if (game.u.utotype || !(dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 2)) {
        return;
    }
    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        /* being deaf overrides confirmation prompt for high charisma */
        pline("%s takes off your %s.", seducer, str);
    } else if (rn2(20) < (acurr(A_CHA))) {
        ;
        qbuf = sprintf(qbuf, "\"Shall I remove your %s, %s?\"", str, (!rn2(2) ? "lover" : !rn2(2) ? "dear" : "sweetheart"));
        if (yn_function(qbuf, ynchars, 110, (1)) == 110) {
            return;
        }
    } else {
        let hairbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        hairbuf = sprintf(hairbuf, "let me run my fingers through your %s", body_part(HAIR));
        ;
        verbalize("Take off your %s; %s.", str, (obj == game.uarm) ? "let's get a little closer" : (obj == game.uarmc || obj == game.uarms) ? "it's in the way" : (obj == game.uarmf) ? "let me rub your feet" : (obj == game.uarmg) ? "they're too clumsy" : (obj == game.uarmu) ? "let me massage you" : hairbuf);
    }
    remove_worn_item(obj, (1));
}
export function assess_dmg(mtmp, tmp) {
    if ((mtmp.mhp -= tmp) <= 0) {
        pline_mon(mtmp, "%s dies!", Monnam(mtmp));
        xkilled(mtmp, 1);
        if (!((mtmp).mhp < 1)) {
            return 1;
        }
        return 4;
    }
    return 1;
}
/* returns True if monster has a range attack in its repertoire
   that it will actually utilize. Caller provides the assessment
   callback (optional). Callback returns 0 if the attack is
   active */
/* can be used as ranged_attk_assessed() callback.
   Returns TRUE if monster is avoiding use of this attack */
export function mon_avoiding_this_attack(mtmp, attkidx) {
    let ptr = mtmp.data;
    let typ = -1;
    if (attkidx >= 0 && (typ = get_atkdam_type(ptr.mattk[attkidx].adtyp)) >= 0 && ((mtmp).seen_resistance & (cvt_adtyp_to_mseenres(typ)))) {
        return (1);
    }
    return (0);
}
/*
 * This would be equivalent to:
 *     ranged_attk_assessed(mtmp, mon_avoiding_this_attack)
 * but without the added assessment function call overhead.
 */
export function ranged_attk_available(mtmp) {
    let i = 0;
    let typ = -1;
    let ptr = mtmp.data;
    for (i = 0; i < 6; i++) {
        if (((ptr.mattk[i].aatyp) == 10 || (ptr.mattk[i].aatyp) == 12 || (ptr.mattk[i].aatyp) == 255 || (ptr.mattk[i].aatyp) == 15) && (typ = get_atkdam_type(ptr.mattk[i].adtyp)) >= 0 && ((mtmp).seen_resistance & (cvt_adtyp_to_mseenres(typ))) == 0) {
            return (1);
        }
    }
    return (0);
}
/* FIXME:
 *  sequencing issue:  a monster's attack might cause poly'd hero
 *  to revert to normal form.  The messages for passive counterattack
 *  would look better if they came before reverting form, but we need
 *  to know whether hero reverted in order to decide whether passive
 *  damage applies.
 */
export function passiveum(olduasmon, mtmp, mattk) {
    let i = 0;
    let tmp = 0;
    let oldu_mattk = null;
    for (i = 0; !oldu_mattk; i++) {
        /*
     * mattk      == mtmp's attack that hit you;
     * oldu_mattk == your passive counterattack (even if mtmp's attack
     *               has already caused you to revert to normal form).
     */
        if (i >= 6) {
            return 1;
        }
        if (olduasmon.mattk[i].aatyp == 0 || olduasmon.mattk[i].aatyp == 14) {
            oldu_mattk = olduasmon.mattk[i];
        }
    }
    if (oldu_mattk.damn) {
        tmp = d(oldu_mattk.damn, oldu_mattk.damd);
    } else if (oldu_mattk.damd) {
        tmp = d(olduasmon.mlevel + 1, oldu_mattk.damd);
    } else {
        tmp = 0;
    }
    switch (oldu_mattk.adtyp) {
        case 8:
            if (!rn2(2)) {
                /* These affect the enemy even if you were "killed" (rehumanized) */
                pline_mon(mtmp, "%s is splashed by %s%s!", Monnam(mtmp), !(game.u.umonnum != game.u.umonster) ? "" : "your ", hliquid("acid"));
                if (Resists_Elem(mtmp, ACID_RES)) {
                    /* temporary? hack for sequencing issue:  "your acid"
                     looks strange coming immediately after player has
                     been told that hero has reverted to normal form */
                    pline_mon(mtmp, "%s is not affected.", Monnam(mtmp));
                    tmp = 0;
                }
            } else {
                tmp = 0;
            }
            if (!rn2(30)) {
                erode_armor(mtmp, 3);
            }
            if (!rn2(6)) {
                acid_damage(((mtmp).mw));
            }
            return assess_dmg(mtmp, tmp);
        case 18:
{
                let protector = attk_protection(mattk.aatyp);
                let wornitems = mtmp.misc_worn_check;
                /* wielded weapon gives same protection as gloves here */
                if (((mtmp).mw) != null) {
                    wornitems |= 16;
                }
                if (!Resists_Elem(mtmp, STONE_RES) && (protector == 0 || (protector != ~0 && (wornitems & protector) != protector))) {
                    if (poly_when_stoned(mtmp.data)) {
                        mon_to_stone(mtmp);
                        return 1;
                    }
                    pline_mon(mtmp, "%s turns to stone!", Monnam(mtmp));
                    game.stoned = 1;
                    xkilled(mtmp, 1);
                    if (!((mtmp).mhp < 1)) {
                        return 1;
                    }
                    return 4;
                }
                return 1;
            }
        case 41:
            if (game.mon_currwep) {
                /* KMH -- remove enchantment (disenchanter) */
                /* by_you==True: passive counterattack to hero's action
               is hero's fault */
                drain_item(game.mon_currwep, (1));
            }
            return 1;
        default:
            break;
    }
    if (!(game.u.umonnum != game.u.umonster)) {
        return 1;
    }
    if (rn2(3)) {
        switch (oldu_mattk.adtyp) {
            case 0:
                if (oldu_mattk.aatyp == 14) {
                    /* These affect the enemy only if you are still a monster */
                    You("explode!");
                    /* KMH, balance patch -- this is okay with unchanging */
                    rehumanize();
                    return assess_dmg(mtmp, tmp);
                }
                break;
            case 14:
                if (tmp > 127) {
                    tmp = 127;
                }
                if (game.u.umonnum == PM_FLOATING_EYE) {
                    if (!rn2(4)) {
                        tmp = 127;
                    }
                    if (mtmp.mcansee && (((mtmp.data).mflags1 & 4096) == 0) && rn2(3) && ((((mtmp.data).mflags1 & 16777216) != 0) || !((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked))) {
                        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            pline("As a blind %s, you cannot defend yourself.", pmname(game.youmonst.data, game.flags.female ? FEMALE : MALE));
                        } else {
                            if (mon_reflects(mtmp, "Your gaze is reflected by %s %s.")) {
                                return 1;
                            }
                            pline_mon(mtmp, "%s is frozen by your gaze!", Monnam(mtmp));
                            paralyze_monst(mtmp, tmp);
                            return 8;
                        }
                    }
                } else {
                    pline_mon(mtmp, "%s is frozen by you.", Monnam(mtmp));
                    paralyze_monst(mtmp, tmp);
                    return 8;
                }
                return 1;
            case 3:
                if (Resists_Elem(mtmp, COLD_RES)) {
                    /* Brown mold or blue jelly */
                    shieldeff(mtmp.mx, mtmp.my);
                    pline_mon(mtmp, "%s is mildly chilly.", Monnam(mtmp));
                    golemeffects(mtmp, 3, tmp);
                    tmp = 0;
                    break;
                }
                pline_mon(mtmp, "%s is suddenly very cold!", Monnam(mtmp));
                game.u.mh += Math.trunc((tmp + rn2(2)) / 2);
                if (game.u.mhmax < game.u.mh) {
                    game.u.mhmax = game.u.mh;
                }
                if (game.u.mhmax > ((game.youmonst.data.mlevel + 1) * 8)) {
                    split_mon(game.youmonst, mtmp);
                }
                break;
            case 12:
                if (!mtmp.mstun) {
                    mtmp.mstun = 1;
                    pline_mon(mtmp, "%s %s.", Monnam(mtmp), makeplural(stagger(mtmp.data, "stagger")));
                }
                tmp = 0;
                break;
            case 2:
                if (Resists_Elem(mtmp, FIRE_RES)) {
                    shieldeff(mtmp.mx, mtmp.my);
                    pline_mon(mtmp, "%s is mildly warm.", Monnam(mtmp));
                    golemeffects(mtmp, 2, tmp);
                    tmp = 0;
                    break;
                }
                pline_mon(mtmp, "%s is suddenly very hot!", Monnam(mtmp));
                break;
            case 6:
                if (Resists_Elem(mtmp, SHOCK_RES)) {
                    shieldeff(mtmp.mx, mtmp.my);
                    pline_mon(mtmp, "%s is slightly tingled.", Monnam(mtmp));
                    golemeffects(mtmp, 6, tmp);
                    tmp = 0;
                    break;
                }
                pline_mon(mtmp, "%s is jolted with your electricity!", Monnam(mtmp));
                break;
            default:
                tmp = 0;
                break;
        }
    } else {
        tmp = 0;
    }
    return assess_dmg(mtmp, tmp);
}
export function cloneu() {
    let mon = null;
    let mndx = ((game.youmonst.data).pmidx);
    if (game.u.mh <= 1) {
        return null;
    }
    if (game.mvitals[mndx].mvflags & 1) {
        return null;
    }
    mon = makemon(game.youmonst.data, game.u.ux, game.u.uy, 1 | 2048 | 131072);
    if (!mon) {
        return null;
    }
    mon.mcloned = 1;
    mon = christen_monst(mon, game.plname);
    initedog(mon, (1));
    mon.m_lev = game.youmonst.data.mlevel;
    mon.mhpmax = game.u.mhmax;
    mon.mhp = Math.trunc(game.u.mh / 2);
    game.u.mh -= mon.mhp;
    game.disp.botl = (1);
    return mon;
}
/*mhitu.c*/
/* (monsters don't actually wield towels, wet or otherwise) */
/* some weapons can have more than one strike type; for those,
           give a mix of thrust and swing (caller doesn't care either way) */
/* attacker teleported, no more attacks */
/* else no help came; but you didn't know it tried */
/* aligned priests and angels have innate intrinsic Protection */
/* AC magic cancellation doesn't help when engulfed */
/* y_n aka yn_function is set up for this */
