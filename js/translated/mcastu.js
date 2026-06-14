/* NetHack 5.0	mcastu.c	$NHDT-Date: 1770949988 2026/02/12 18:33:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.111 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { strcpy } from '../c2js-runtime/string.js';
import { acurr, adjuhploss, losestr, minuhpmax, setuhpmax } from './attrib.js';
import { is_waterwall } from './dbridge.js';
import { c_common_strings } from './decl.js';
import { canseemon, map_invisible, sensemon, shieldeff, tp_sensemon } from './display.js';
import { Mgender, Monnam, bogusmon, mon_nam, noit_Monnam, pmname } from './do_name.js';
import { destroy_arm } from './do_wear.js';
import { is_fainted } from './eat.js';
import { done } from './end.js';
import { losehp, nomul } from './hack.js';
import { upstart } from './hacklib.js';
import { makemon, mkclass, set_malign } from './makemon.js';
import { mdamageu } from './mhitu.js';
import { monster_census } from './minion.js';
import { healmon } from './mon.js';
import { cvt_adtyp_to_mseenres, monstseesu, monstunseesu, pronoun_gender } from './mondata.js';
import { lined_up } from './mthrowu.js';
import { ureflects } from './muse.js';
import { ANTIMAGIC, A_DEX, BLINDED, COLD_RES, CONFUSION, DEAF, DETECT_MONSTERS, DIED, DISPLACED, EYE, FIRE_RES, FREE_ACTION, HALF_PHDAM, HALF_SPDAM, HALLUC, HALLUC_RES, HEAD, INVIS, LOW_PM, M_AP_OBJECT, M_SEEN_COLD, M_SEEN_ELEC, M_SEEN_FIRE, M_SEEN_MAGR, M_SEEN_REFL, NUMMONS, PM_CYCLOPS, PM_FLOATING_EYE, PM_MANES, SEE_INVIS, SHOCK_RES, STRANGE_OBJECT, STUNNED, S_ANT, S_GOLEM, S_SNAKE, S_VORTEX } from './nh-constants.js';
import { an, makeplural, makesingular, the_unique_pm, vtense } from './objnam.js';
import { Norep, pline_mon, set_msg_xy } from './pline.js';
import { body_part, rehumanize } from './polyself.js';
import { make_blinded, make_confused, make_stunned } from './potion.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { rndcurse } from './sit.js';
import { enexto } from './teleport.js';
import { burn_away_slime } from './timeout.js';
import { burnarmor, ignite_items, unconscious } from './trap.js';
import { aggravate, clonewiz, has_aggravatables, nasty } from './wizard.js';
import { mon_adjust_speed, mon_set_minvis } from './worn.js';
import { buzz, destroy_items, flash_str, flashburn, mon_spell_hits_spot } from './zap.js';

export const MCAST_PSI_BOLT = 0;
export const MCAST_OPEN_WOUNDS = 1;
export const MCAST_CURE_SELF = 2;
export const MCAST_HASTE_SELF = 3;
export const MCAST_CONFUSE_YOU = 4;
export const MCAST_STUN_YOU = 5;
export const MCAST_DISAPPEAR = 6;
export const MCAST_PARALYZE = 7;
export const MCAST_BLIND_YOU = 8;
export const MCAST_WEAKEN_YOU = 9;
export const MCAST_DESTRY_ARMR = 10;
export const MCAST_INSECTS = 11;
export const MCAST_CURSE_ITEMS = 12;
export const MCAST_LIGHTNING = 13;
export const MCAST_FIRE_PILLAR = 14;
export const MCAST_GEYSER = 15;
export const MCAST_AGGRAVATION = 16;
export const MCAST_SUMMON_MONS = 17;
export const MCAST_CLONE_WIZ = 18;
export const MCAST_DEATH_TOUCH = 19;
// struct _mcast_data: { level, flags }
game.mcast_data = [{ level: 0, flags: 4 | 2 }, { level: 0, flags: 4 | 2 }, { level: 1, flags: 1 }, { level: 2, flags: 1 }, { level: 2, flags: 4 | 2 }, { level: 3, flags: 4 | 2 }, { level: 4, flags: 1 }, { level: 4, flags: 4 | 2 }, { level: 6, flags: 4 | 2 }, { level: 6, flags: 4 | 2 }, { level: 8, flags: 4 | 2 }, { level: 8, flags: 4 | 1 | 2 }, { level: 10, flags: 4 | 2 }, { level: 11, flags: 4 | 2 }, { level: 12, flags: 4 | 2 }, { level: 13, flags: 4 | 2 }, { level: 13, flags: 1 | 4 | 2 }, { level: 15, flags: 4 | 1 | 2 }, { level: 18, flags: 4 | 1 | 2 }, { level: 20, flags: 4 | 2 }];
/* spell lists for specific monster casters */
/* the spells in the list should be in ascending level order */
game.mon_cleric_spells = [MCAST_OPEN_WOUNDS, MCAST_CURE_SELF, MCAST_CONFUSE_YOU, MCAST_PARALYZE, MCAST_BLIND_YOU, MCAST_INSECTS, MCAST_CURSE_ITEMS, MCAST_LIGHTNING, MCAST_FIRE_PILLAR, MCAST_GEYSER];
game.mon_wizard_spells = [MCAST_PSI_BOLT, MCAST_CURE_SELF, MCAST_HASTE_SELF, MCAST_STUN_YOU, MCAST_DISAPPEAR, MCAST_WEAKEN_YOU, MCAST_DESTRY_ARMR, MCAST_CURSE_ITEMS, MCAST_AGGRAVATION, MCAST_SUMMON_MONS, MCAST_CLONE_WIZ, MCAST_DEATH_TOUCH];
/* feedback when frustrated monster couldn't cast a spell */
export async function cursetxt(mtmp, undirected) {
    if (canseemon(mtmp) && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
        /* spellcasting monsters are impolite */
        let point_msg = null;
        if (undirected) {
            point_msg = "all around, then curses";
        } else if ((((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mtmp.data).mflags1 & 16777216) != 0) && (mtmp.mux != game.u.ux || mtmp.muy != game.u.uy)) || (((game.youmonst).m_ap_type & 7) == M_AP_OBJECT && (game.youmonst).mappearance == (STRANGE_OBJECT)) || game.u.uundetected) {
            point_msg = "and curses in your general direction";
        } else if ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic) && (mtmp.mux != game.u.ux || mtmp.muy != game.u.uy)) {
            point_msg = "and curses at your displaced image";
        } else {
            point_msg = "at you, then curses";
        }
        await pline_mon(mtmp, "%s points %s.", await Monnam(mtmp), point_msg);
    } else if ((!(game.moves % 4) || !rn2(4))) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await Norep("You hear a mumbled curse.");
        }
    }
}
/* choose a spell for monster to cast */
export async function choose_monster_spell(mtmp, adtyp) {
    let list = null;
    let i = 0;
    let spellval = 0;
    let len = 0;
    let maxlev = 0;
    if (adtyp == 241) {
        /* which spell list to use? */
        list = game.mon_wizard_spells;
        len = (Math.trunc(48 /* sizeof(int [12]) */ / 4 /* sizeof(int) */));
    } else if (adtyp == 240) {
        list = game.mon_cleric_spells;
        len = (Math.trunc(40 /* sizeof(int [10]) */ / 4 /* sizeof(int) */));
    }
    if (!list || len < 1) {
        return MCAST_PSI_BOLT;
    }
    /* max spell level in this monster spell list */
    maxlev = game.mcast_data[list[len - 1]].level;
    /* which level spell to cast? */
    spellval = rn2(mtmp.m_lev);
    if (spellval > maxlev && rn2(maxlev)) {
        spellval = rn2(maxlev);
    }
    for (i = len - 1; i >= 0; i--) {
        if (game.mcast_data[list[i]].level <= spellval && !await spell_would_be_useless(mtmp, list[i])) {
            return list[i];
        }
    }
    /* or return the first spell in the list */
    return list[0];
}
/* return values:
 * 1: successful spell
 * 0: unsuccessful spell
 */
/* caster */
/* caster's current attack */
/* might be mistaken if displaced */
/* knows hero's precise location */
export async function castmu(mtmp, mattk, thinks_it_foundyou, foundyou) {
    let dmg = 0;
    let ml = mtmp.m_lev;
    let ret = 0;
    let spellnum = 0;
    if ((mattk.adtyp == 241 || mattk.adtyp == 240) && ml) {
        /* Three cases:
     * -- monster is attacking you.  Search for a useful spell.
     * -- monster thinks it's attacking you.  Search for a useful spell,
     *    without checking for undirected.  If the spell found is directed,
     *    it fails with cursetxt() and loss of mspec_used.
     * -- monster isn't trying to attack.  Select a spell once.  Don't keep
     *    searching; if that spell is not useful (or if it's directed),
     *    return and do something else.
     * Since most spells are directed, this means that a monster that isn't
     * attacking casts spells only a small portion of the time that an
     * attacking monster does.
     */
        let cnt = 40;
        do {
            spellnum = await choose_monster_spell(mtmp, mattk.adtyp);
            if (!thinks_it_foundyou) {
                if (!is_undirected_spell(spellnum) || await spell_would_be_useless(mtmp, spellnum)) {
                    if (foundyou) {
                        await impossible("spellcasting monster found you and doesn't know it?");
                    }
                    return 0;
                }
                /* only the Wizard is allowed to clone himself */
                /* aggravation (global wakeup) when everyone is already active */
                /* if nothing needs to be awakened then this spell is useless
           but caster might not realize that [chance to pick it then
           must be very small otherwise caller's many retry attempts
           will eventually end up picking it too often] */
                /* haste self when already fast */
                /* healing when already healed */
                break;
            }
        } while (--cnt > 0 && await spell_would_be_useless(mtmp, spellnum));
        if (cnt == 0) {
            return 0;
        }
    }
    if (mtmp.mcan || mtmp.mspec_used || !ml || ((mtmp).seen_resistance & (cvt_adtyp_to_mseenres(mattk.adtyp)))) {
        await cursetxt(mtmp, is_undirected_spell(spellnum));
        return 0;
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mcastu.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            await pline("castmu:%s,lvl:%i,spell:%i", await noit_Monnam(mtmp), ml, spellnum);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    if (mattk.adtyp == 241 || mattk.adtyp == 240) {
        /* monst->m_lev is unsigned (uchar), monst->mspec_used is int */
        mtmp.mspec_used = ((mtmp.m_lev < 8) ? (10 - mtmp.m_lev) : 2);
    }
    if (!foundyou && thinks_it_foundyou && !is_undirected_spell(spellnum)) {
        await pline_mon(mtmp, "%s casts a spell at %s!", canseemon(mtmp) ? await Monnam(mtmp) : "Something", is_waterwall(mtmp.mux, mtmp.muy) ? "empty water" : "thin air");
        return 0;
    }
    nomul(0);
    if (rn2(ml * 10) < (mtmp.mconf ? 100 : 20)) {
        ;
        if (canseemon(mtmp) && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            set_msg_xy(mtmp.mx, mtmp.my);
            await pline_The("air crackles around %s.", await mon_nam(mtmp));
        }
        return 0;
    }
    if ((canseemon(mtmp) || sensemon(mtmp)) || !is_undirected_spell(spellnum)) {
        await pline_mon(mtmp, "%s casts a spell%s!", (canseemon(mtmp) || sensemon(mtmp)) ? await Monnam(mtmp) : "Something", is_undirected_spell(spellnum) ? "" : (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mtmp.data).mflags1 & 16777216) != 0) && !((mtmp.mux) == game.u.ux && (mtmp.muy) == game.u.uy)) ? " at a spot near you" : ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic) && !((mtmp.mux) == game.u.ux && (mtmp.muy) == game.u.uy)) ? " at your displaced image" : " at you");
    }
    if (!foundyou) {
        /*
     * As these are spells, the damage is related to the level
     * of the monster casting the spell.
     */
        dmg = 0;
        if (mattk.adtyp != 241 && mattk.adtyp != 240) {
            await impossible("%s casting non-hand-to-hand version of hand-to-hand spell %d?", await Monnam(mtmp), mattk.adtyp);
            return 0;
        }
    } else if (mattk.damd) {
        dmg = d(((Math.trunc(ml / 2)) + mattk.damn), mattk.damd);
    } else {
        dmg = d(((Math.trunc(ml / 2)) + 1), 6);
    }
    if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
        dmg = Math.trunc((dmg + 1) / 2);
    }
    ret = 1;
    switch (mattk.adtyp) {
        /*
     * FIXME: none of these hit the steed when hero is riding, nor do
     *  they inflict damage on carried items.
     */
        case 2:
            await pline("You're enveloped in flames.");
            if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                await shieldeff(game.u.ux, game.u.uy);
                await pline("But you resist the effects.");
                monstseesu(M_SEEN_FIRE);
                /* done by the spell casting functions */
                dmg = 0;
            } else {
                monstunseesu(M_SEEN_FIRE);
            }
            await burn_away_slime();
            await mon_spell_hits_spot(mtmp, 2, game.u.ux, game.u.uy);
            break;
        case 3:
            await pline("You're covered in frost.");
            if ((game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic)) {
                await shieldeff(game.u.ux, game.u.uy);
                await pline("But you resist the effects.");
                monstseesu(M_SEEN_COLD);
                dmg = 0;
            } else {
                monstunseesu(M_SEEN_COLD);
            }
            await mon_spell_hits_spot(mtmp, 3, game.u.ux, game.u.uy);
            break;
        case 1:
            await You("are hit by a shower of missiles!");
            if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                await shieldeff(game.u.ux, game.u.uy);
                await pline_The("missiles bounce off!");
                monstseesu(M_SEEN_MAGR);
                dmg = 0;
            } else {
                dmg = d(Math.trunc(mtmp.m_lev / 2) + 1, 6);
                /* monsters only realize you aren't magic-protected if armor is
           actually destroyed */
                monstunseesu(M_SEEN_MAGR);
            }
            await mon_spell_hits_spot(mtmp, 1, game.u.ux, game.u.uy);
            break;
        case 241:
        case 240:
            await mcast_spell(mtmp, dmg, spellnum);
            dmg = 0;
            break;
    }
    if (dmg) {
        await mdamageu(mtmp, dmg);
    }
    return ret;
}
export async function m_cure_self(mtmp, dmg) {
    if (mtmp.mhp < mtmp.mhpmax) {
        if (canseemon(mtmp)) {
            await pline_mon(mtmp, "%s looks better.", await Monnam(mtmp));
        }
        await healmon(mtmp, d(3, 6), 0);
        dmg = 0;
    }
    /* since inventory items aren't affected, don't include this */
    return dmg;
}
/* unlike the finger of death spell which behaves like a wand of death,
   this monster spell only attacks the hero */
export async function touch_of_death(mtmp) {
    let kbuf = '';
    let dmg = 50 + d(8, 6);
    let drain = Math.trunc(dmg / 2);
    await You_feel("drained...");
    await death_inflicted_by(kbuf, "the touch of death", mtmp);
    if ((game.u.umonnum != game.u.umonster)) {
        game.u.mh = 0;
        await rehumanize();
    } else if (drain >= game.u.uhpmax) {
        game.killer.format = 1;
        game.killer.name = strcpy(game.killer.name, kbuf);
        await done(DIED);
    } else {
        /* HP manipulation similar to poisoned(attrib.c) */
        let olduhp = game.u.uhp;
        let uhpmin = minuhpmax(3);
        let newuhpmax = game.u.uhpmax - drain;
        setuhpmax(((newuhpmax) > (uhpmin) ? (newuhpmax) : (uhpmin)), (0));
        /* reduce pending damage if uhp has
                                        * already been reduced due to drop
                                        * in uhpmax */
        dmg = adjuhploss(dmg, olduhp);
        await losehp(dmg, kbuf, 1);
    }
    /* not killed if we get here... */
    game.killer.name = '';
}
/* give a reason for death by some monster spells */
/* assumed big enough; pm_names are short */
/* cause of death */
/* monster who caused it */
export async function death_inflicted_by(outbuf, deathreason, mtmp) {
    outbuf = strcpy(outbuf, deathreason);
    if (mtmp) {
        let mptr = mtmp.data;
        let champtr = (((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS)) ? game.mons[mtmp.cham] : mptr;
        let realnm = pmname(champtr, Mgender(mtmp));
        let fakenm = pmname(mptr, Mgender(mtmp));
        /* greatly simplified extract from done_in_by(), primarily for
           reason for death due to 'touch of death' spell; if mtmp is
           shape changed, it won't be a vampshifter or mimic since they
           can't cast spells */
        if (!(((champtr).mflags2 & 524288) != 0) && !the_unique_pm(mptr)) {
            realnm = await an(realnm);
        }
        outbuf = __nh_buf_append(outbuf, sprintf('', " inflicted by %s%s", the_unique_pm(mptr) ? "the " : "", realnm));
        if (champtr != mptr) {
            outbuf = __nh_buf_append(outbuf, sprintf('', " imitating %s", await an(fakenm)));
        }
    }
    return outbuf;
}
/*
 * Monster wizard and cleric spellcasting functions.
 */
export async function mcast_death_touch(mtmp) {
    await pline("Oh no, %s's using the touch of death!", (genders[pronoun_gender(mtmp, 2)].he));
    if (((((game.youmonst.data).mflags2 & 2) != 0) || (game.youmonst.data) == game.mons[PM_MANES] || (((game.youmonst.data).mlet == S_GOLEM) || (game.youmonst.data).mlet == S_VORTEX)) || (((game.youmonst.data).mflags2 & 256) != 0)) {
        await You("seem no deader than before.");
    } else if (!(game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) && rn2(mtmp.m_lev) > 12) {
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            await You("have an out of body experience.");
        } else {
            await touch_of_death(mtmp);
        }
        monstunseesu(M_SEEN_MAGR);
    } else {
        if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
            await shieldeff(game.u.ux, game.u.uy);
            monstseesu(M_SEEN_MAGR);
        }
        await pline("Lucky for you, it didn't work!");
    }
}
export async function mcast_clone_wiz(mtmp) {
    if (mtmp.iswiz && game.context.no_of_wizards == 1) {
        await pline("Double Trouble...");
        await clonewiz();
    } else {
        await impossible("bad wizard cloning?");
    }
}
export async function mcast_summon_mons(mtmp) {
    let count = await nasty(mtmp);
    if (!count) {
        ;
    } else if (mtmp.iswiz) {
        ;
        await verbalize("Destroy the thief, my pet%s!", (((count) == 1) ? "" : "s"));
    } else {
        let one = (count == 1);
        let mappear = one ? "A monster appears" : "Monsters appear";
        /* messages not quite right if plural monsters created but
           only a single monster is seen */
        if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mtmp.data).mflags1 & 16777216) != 0) && (mtmp.mux != game.u.ux || mtmp.muy != game.u.uy)) {
            await pline("%s %s a spot near you!", mappear, one ? "at" : "around");
        } else if ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic) && (mtmp.mux != game.u.ux || mtmp.muy != game.u.uy)) {
            await pline("%s %s your displaced image!", mappear, one ? "by" : "around");
        } else {
            await pline("%s from nowhere!", mappear);
        }
    }
}
export async function mcast_destroy_armor() {
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
        await shieldeff(game.u.ux, game.u.uy);
        monstseesu(M_SEEN_MAGR);
        await pline("A field of force surrounds you!");
    } else if (!await destroy_arm()) {
        await Your("skin itches.");
    } else {
        monstunseesu(M_SEEN_MAGR);
    }
}
export async function mcast_weaken_you(mtmp, dmg) {
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
        await shieldeff(game.u.ux, game.u.uy);
        monstseesu(M_SEEN_MAGR);
        await You_feel("momentarily weakened.");
    } else {
        let kbuf = '';
        await You("suddenly feel weaker!");
        dmg = mtmp.m_lev - 6;
        /* paranoia since only chosen when m_lev is high */
        if (dmg < 1) {
            /* to produce nomul(-1), not actual damage */
            dmg = 1;
        }
        if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
            dmg = Math.trunc((dmg + 1) / 2);
        }
        await losestr(rnd(dmg), await death_inflicted_by(kbuf, "strength loss", mtmp), 1);
        game.killer.name = '';
        monstunseesu(M_SEEN_MAGR);
    }
}
export async function mcast_disappear(mtmp) {
    if (!mtmp.minvis && !mtmp.invis_blkd) {
        if (canseemon(mtmp)) {
            await pline_mon(mtmp, "%s suddenly %s!", await Monnam(mtmp), !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? "disappears" : "becomes transparent");
        }
        await mon_set_minvis(mtmp, (0));
        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0) && !(canseemon(mtmp) || sensemon(mtmp))) {
            await map_invisible(mtmp.mx, mtmp.my);
        }
    } else {
        await impossible("no reason for monster to cast disappear spell?");
    }
}
export async function mcast_stun_you(dmg) {
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) || game.u.uprops[FREE_ACTION].extrinsic) {
        await shieldeff(game.u.ux, game.u.uy);
        monstseesu(M_SEEN_MAGR);
        if (!game.u.uprops[STUNNED].intrinsic) {
            await You_feel("momentarily disoriented.");
        }
        await make_stunned(1, (0));
    } else {
        await You(game.u.uprops[STUNNED].intrinsic ? "struggle to keep your balance." : "reel...");
        dmg = d((acurr(A_DEX)) < 12 ? 6 : 4, 4);
        if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
            dmg = Math.trunc((dmg + 1) / 2);
        }
        await make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + dmg, (0));
        monstunseesu(M_SEEN_MAGR);
    }
}
export async function mcast_geyser(dmg) {
    await pline("A sudden geyser slams into you from nowhere!");
    dmg = d(8, 6);
    if ((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) {
        dmg = Math.trunc((dmg + 1) / 2);
    }
    return dmg;
}
export async function mcast_fire_pillar(mtmp, dmg) {
    let orig_dmg = 0;
    await pline("A pillar of fire strikes all around you!");
    orig_dmg = dmg = d(8, 6);
    if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
        await shieldeff(game.u.ux, game.u.uy);
        monstseesu(M_SEEN_FIRE);
        dmg = 0;
    } else {
        monstunseesu(M_SEEN_FIRE);
    }
    if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
        dmg = Math.trunc((dmg + 1) / 2);
    }
    await burn_away_slime();
    await burnarmor(game.youmonst);
    await destroy_items(game.youmonst, 2, orig_dmg);
    await ignite_items(game.invent);
    await mon_spell_hits_spot(mtmp, 2, game.u.ux, game.u.uy);
    return dmg;
}
export async function mcast_lightning(mtmp, dmg) {
    let orig_dmg = 0;
    let reflects = 0;
    ;
    await pline("A bolt of lightning strikes down at you from above!");
    reflects = await ureflects("It bounces off your %s%s.", "");
    orig_dmg = dmg = d(8, 6);
    if (reflects || (game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
        await shieldeff(game.u.ux, game.u.uy);
        dmg = 0;
        if (reflects) {
            monstseesu(M_SEEN_REFL);
            return dmg;
        }
        monstunseesu(M_SEEN_REFL);
        monstseesu(M_SEEN_ELEC);
    } else {
        monstunseesu(M_SEEN_ELEC | M_SEEN_REFL);
    }
    if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
        dmg = Math.trunc((dmg + 1) / 2);
    }
    await destroy_items(game.youmonst, 6, orig_dmg);
    await mon_spell_hits_spot(mtmp, 6, game.u.ux, game.u.uy);
    await flashburn(rnd(100), (1));
    return dmg;
}
export async function mcast_psi_bolt(dmg) {
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
        await shieldeff(game.u.ux, game.u.uy);
        monstseesu(M_SEEN_MAGR);
        dmg = Math.trunc((dmg + 1) / 2);
    } else {
        monstunseesu(M_SEEN_MAGR);
    }
    if (dmg <= 5) {
        await You("get a slight %sache.", await body_part(HEAD));
    } else if (dmg <= 10) {
        await Your("brain is on fire!");
    } else if (dmg <= 20) {
        await Your("%s suddenly aches painfully!", await body_part(HEAD));
    } else {
        await Your("%s suddenly aches very painfully!", await body_part(HEAD));
    }
    return dmg;
}
export async function mcast_open_wounds(dmg) {
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
        await shieldeff(game.u.ux, game.u.uy);
        monstseesu(M_SEEN_MAGR);
        dmg = Math.trunc((dmg + 1) / 2);
    } else {
        monstunseesu(M_SEEN_MAGR);
    }
    if (dmg <= 5) {
        await Your("skin itches badly for a moment.");
    } else if (dmg <= 10) {
        await pline("Wounds appear on your body!");
    } else if (dmg <= 20) {
        await pline("Severe wounds appear on your body!");
    } else {
        await Your("body is covered with painful wounds!");
    }
    return dmg;
}
export async function mcast_insects(mtmp) {
    let pm = await mkclass(S_ANT, 0);
    let mtmp2 = null;
    let whatbuf = '';
    let let_ = (pm ? S_ANT : S_SNAKE);
    let success = (0);
    let seecaster = 0;
    let i = 0;
    let quan = 0;
    let oldseen = 0;
    let newseen = 0;
    let bypos = { x: 0, y: 0 };
    let fmt = null;
    let what = null;
    oldseen = monster_census((1));
    quan = (mtmp.m_lev < 2) ? 1 : rnd(Math.trunc(mtmp.m_lev / 2));
    if (quan < 3) {
        quan = 3;
    }
    for (i = 0; i <= quan; i++) {
        if (!await enexto(bypos, mtmp.mux, mtmp.muy, mtmp.data)) {
            return;
        }
        if ((pm = await mkclass(let_, 0)) != null && (mtmp2 = await makemon(pm, bypos.x, bypos.y, 32 | 131072)) != null) {
            success = (1);
            mtmp2.msleeping = mtmp2.mpeaceful = mtmp2.mtame = 0;
            set_malign(mtmp2);
        }
    }
    newseen = monster_census((1));
    /* not canspotmon() which includes unseen things sensed via warning */
    seecaster = canseemon(mtmp) || tp_sensemon(mtmp) || (game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic);
    what = (let_ == S_SNAKE) ? "snakes" : "insects";
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        what = await makeplural(await bogusmon(whatbuf, null));
    }
    fmt = null;
    if (!seecaster) {
        /* seen caster, possibly producing unseen--or just one--critters;
           hero is told what the caster is doing and doesn't necessarily
           observe complete accuracy of that caster's results (in other
           words, no need to fuss with visibility or singularization;
           player is told what's happening even if hero is unconscious) */
        if (newseen <= oldseen || (game.multi < 0 && (unconscious() || is_fainted()))) {
            await You_hear("someone summoning %s.", what);
        } else {
            let arg = null;
            if (what != whatbuf) {
                what = strcpy(whatbuf, what);
            }
            arg = (newseen == oldseen + 1) ? await an(await makesingular(what)) : whatbuf;
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                await You_hear("someone summoning something, and %s %s.", arg, await vtense(arg, "appear"));
            } else {
                await pline("%s %s.", upstart(arg), await vtense(arg, "appear"));
            }
        }
    } else if (!success) {
        fmt = "%s casts at a clump of sticks, but nothing happens.%s";
        what = "";
    } else if (let_ == S_SNAKE) {
        fmt = "%s transforms a clump of sticks into %s!";
    } else if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mtmp.data).mflags1 & 16777216) != 0) && (mtmp.mux != game.u.ux || mtmp.muy != game.u.uy)) {
        fmt = "%s summons %s around a spot near you!";
    } else if ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic) && (mtmp.mux != game.u.ux || mtmp.muy != game.u.uy)) {
        fmt = "%s summons %s around your displaced image!";
    } else {
        fmt = "%s summons %s!";
    }
    if (fmt) {
        ;
        await pline_mon(mtmp, fmt, await Monnam(mtmp), what);
        ;
    }
}
export async function mcast_blind_you() {
    if (!(game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked)) {
        /* note: resists_blnd() doesn't apply here */
        let num_eyes = (!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2);
        await pline("Scales cover your %s!", (num_eyes == 1) ? await body_part(EYE) : await makeplural(await body_part(EYE)));
        await make_blinded((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic) ? 100 : 200, (0));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await Your("%s", c_common_strings.c_vision_clears);
        }
    } else {
        await impossible("no reason for monster to cast blindness spell?");
    }
}
export async function mcast_paralyze(mtmp) {
    let dmg = 0;
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) || game.u.uprops[FREE_ACTION].extrinsic) {
        await shieldeff(game.u.ux, game.u.uy);
        monstseesu(M_SEEN_MAGR);
        if (game.multi >= 0) {
            await You("stiffen briefly.");
        }
        dmg = 1;
    } else {
        if (game.multi >= 0) {
            await You("are frozen in place!");
        }
        dmg = 4 + mtmp.m_lev;
        if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
            dmg = Math.trunc((dmg + 1) / 2);
        }
        monstunseesu(M_SEEN_MAGR);
    }
    nomul(-dmg);
    game.multi_reason = "paralyzed by a monster";
    game.nomovemsg = null;
    return dmg;
}
export async function mcast_confuse_you(mtmp) {
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
        await shieldeff(game.u.ux, game.u.uy);
        monstseesu(M_SEEN_MAGR);
        await You_feel("momentarily dizzy.");
    } else {
        let oldprop = !!game.u.uprops[CONFUSION].intrinsic;
        let dmg = mtmp.m_lev;
        if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
            dmg = Math.trunc((dmg + 1) / 2);
        }
        await make_confused(game.u.uprops[CONFUSION].intrinsic + dmg, (1));
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            await You_feel("%s!", oldprop ? "trippier" : "trippy");
        } else {
            await You_feel("%sconfused!", oldprop ? "more " : "");
        }
        monstunseesu(M_SEEN_MAGR);
    }
}
/*
   If dmg is zero, then the monster is not casting at you.
   If the monster is intentionally not casting at you, we have previously
   called spell_would_be_useless() and spellnum should always be a valid
   undirected spell.
   If you modify either of these, be sure to change is_undirected_spell()
   and spell_would_be_useless().
 */
export async function mcast_spell(mtmp, dmg, spellnum) {
    if (dmg < 0) {
        await impossible("monster cast spell (%d) with negative dmg (%d)?", spellnum, dmg);
        return;
    }
    if (dmg == 0 && !is_undirected_spell(spellnum)) {
        await impossible("cast directed wizard spell (%d) with dmg=0?", spellnum);
        return;
    }
    switch (spellnum) {
        case MCAST_DEATH_TOUCH:
            await mcast_death_touch(mtmp);
            dmg = 0;
            break;
        case MCAST_CLONE_WIZ:
            await mcast_clone_wiz(mtmp);
            dmg = 0;
            break;
        case MCAST_SUMMON_MONS:
            await mcast_summon_mons(mtmp);
            dmg = 0;
            break;
        case MCAST_AGGRAVATION:
            await You_feel("that monsters are aware of your presence.");
            await aggravate();
            dmg = 0;
            break;
        case MCAST_CURSE_ITEMS:
            await You_feel("as if you need some help.");
            await rndcurse();
            dmg = 0;
            break;
        case MCAST_DESTRY_ARMR:
            await mcast_destroy_armor();
            dmg = 0;
            break;
        case MCAST_WEAKEN_YOU:
            await mcast_weaken_you(mtmp, dmg);
            dmg = 0;
            break;
        case MCAST_DISAPPEAR:
            await mcast_disappear(mtmp);
            dmg = 0;
            break;
        case MCAST_STUN_YOU:
            await mcast_stun_you(dmg);
            dmg = 0;
            break;
        case MCAST_HASTE_SELF:
            await mon_adjust_speed(mtmp, 1, null);
            dmg = 0;
            break;
        case MCAST_CURE_SELF:
            dmg = await m_cure_self(mtmp, dmg);
            break;
        case MCAST_PSI_BOLT:
            dmg = await mcast_psi_bolt(dmg);
            break;
        case MCAST_GEYSER:
            dmg = await mcast_geyser(dmg);
            break;
        case MCAST_FIRE_PILLAR:
            dmg = await mcast_fire_pillar(mtmp, dmg);
            break;
        case MCAST_LIGHTNING:
            dmg = await mcast_lightning(mtmp, dmg);
            break;
        case MCAST_INSECTS:
            await mcast_insects(mtmp);
            dmg = 0;
            break;
        case MCAST_BLIND_YOU:
            await mcast_blind_you();
            dmg = 0;
            break;
        case MCAST_PARALYZE:
            dmg = await mcast_paralyze(mtmp);
            break;
        case MCAST_CONFUSE_YOU:
            await mcast_confuse_you(mtmp);
            dmg = 0;
            break;
        case MCAST_OPEN_WOUNDS:
            dmg = await mcast_open_wounds(dmg);
            break;
        default:
            await impossible("mcastu: invalid magic spell (%d)", spellnum);
            dmg = 0;
            break;
    }
    if (dmg) {
        await mdamageu(mtmp, dmg);
    }
}
export function is_undirected_spell(spellnum) {
    if ((game.mcast_data[spellnum].flags & 1) != 0) {
        return (1);
    }
    return (0);
}
/* Some spells are useless under some circumstances. */
export async function spell_would_be_useless(mtmp, spellnum) {
    if ((game.mcast_data[spellnum].flags & 4) != 0) {
        /* Some spells don't require the player to really be there and can be cast
     * by the monster when you're invisible, yet still shouldn't be cast when
     * the monster doesn't even think you're there.
     * This check isn't quite right because it always uses your real position.
     * We really want something like "if the monster could see mux, muy".
     */
        /* spell is only cast by hostile monsters */
        if (mtmp.mpeaceful) {
            return (1);
        }
    }
    if ((game.mcast_data[spellnum].flags & 2) != 0) {
        /* spell needs the monster to see hero */
        let mcouldseeu = ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0);
        if (!mcouldseeu) {
            return (1);
        }
    }
    switch (spellnum) {
        case MCAST_DEATH_TOUCH:
            if (((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) && !rn2(2)) {
                return (1);
            }
            break;
        case MCAST_GEYSER:
            if (!rn2(5)) {
                return (1);
            }
            break;
        case MCAST_CLONE_WIZ:
            if (!mtmp.iswiz || game.context.no_of_wizards > 1) {
                return (1);
            }
            break;
        case MCAST_AGGRAVATION:
            if (!await has_aggravatables(mtmp)) {
                return rn2(100) ? (1) : (0);
            }
            break;
        case MCAST_HASTE_SELF:
            if (mtmp.permspeed == 2) {
                return (1);
            }
            break;
        case MCAST_DISAPPEAR:
            if (mtmp.minvis || mtmp.invis_blkd) {
                return (1);
            }
            /* invisibility when already invisible */
            /* peaceful monster won't cast invisibility if you can't see
           invisible,
           same as when monsters drink potions of invisibility.  This doesn't
           really make a lot of sense, but lets the player avoid hitting
           peaceful monsters by mistake */
            if (mtmp.mpeaceful && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
                return (1);
            }
            break;
        case MCAST_CURE_SELF:
            if (mtmp.mhp == mtmp.mhpmax) {
                return (1);
            }
            break;
        case MCAST_BLIND_YOU:
            if ((game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked)) {
                return (1);
            }
            break;
        default:
            break;
    }
    return (0);
}
/* monster uses spell (ranged) */
export async function buzzmu(mtmp, mattk) {
    /* don't print constant stream of curse messages for 'normal'
       spellcasting monsters at range */
    if (!((mattk.adtyp) >= 1 && (mattk.adtyp) <= 10)) {
        return 0;
    }
    if (mtmp.mcan || ((mtmp).seen_resistance & (cvt_adtyp_to_mseenres(mattk.adtyp)))) {
        await cursetxt(mtmp, (0));
        return 0;
    }
    if (lined_up(mtmp) && rn2(3)) {
        nomul(0);
        if (canseemon(mtmp)) {
            await pline_mon(mtmp, "%s zaps you with a %s!", await Monnam(mtmp), flash_str((abs((mattk.adtyp) - 1) % 10), (0)));
        }
        game.buzzer = mtmp;
        await buzz((-10 - ((abs((mattk.adtyp) - 1) % 10))), mattk.damn, mtmp.mx, mtmp.my, sgn(game.tbx), sgn(game.tby));
        game.buzzer = null;
        return 1;
    }
    return 0;
}
/*mcastu.c*/
/* find the highest spell in the list we could cast */
/* not trying to attack?  don't allow directed spells */
/* monster unable to cast spells? */
/* Monster can cast spells, but is casting a directed spell at the
     * wrong place?  If so, give a message, and return.
     * Do this *after* penalizing mspec_used.
     *
     * FIXME?
     *  Shouldn't wall of lava have a case similar to wall of water?
     *  And should cold damage hit water or lava instead of missing
     *  even when the caster has targeted the wrong spot?  Likewise
     *  for fire mis-aimed at ice.
     */
/* burn up flammable items on the floor, melt ice terrain */
/* freeze water or lava terrain */
/* FIXME: mon_spell_hits_spot() uses zap_over_floor(); unlike with
         * fire, it does not target susceptible floor items with cold */
/* shower of magic missiles scuffs an engraving */
/* note: player healing does 6d4; this used to do 1d8 */
/* if we get here, we know that hero isn't magic resistant and isn't
       poly'd into an undead or demon */
/* this is physical damage (force not heat),
     * not magical damage or fire damage
     */
/* lightning might destroy iron bars if hero is on such a spot;
       reflection protects terrain here [execution won't get here due
       to 'if (reflects) break' above] but hero resistance doesn't;
       do this before maybe blinding the hero via flashburn() */
/* blind hero; no effect if already blind */
/* prior to 3.4.0 Antimagic was setting the damage to 1--this
       made the spell virtually harmless to players with magic res. */
/* Try for insects, and if there are none
       left, go for (sticks to) snakes.  -3. */
/* unseen caster fails or summons unseen critters,
               or unconscious hero ("You dream that you hear...") */
/* unseen caster summoned seen critter(s) */
