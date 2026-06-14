/* NetHack 5.0	mthrowu.c	$NHDT-Date: 1737392015 2025/01/20 08:53:35 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.173 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Pasi Kallinen, 2016. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_hear, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strcpy, strncmpi } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { snuff_candle } from './apply.js';
import { artifact_hit, is_art, permapoisoned, spec_abon } from './artifact.js';
import { acurr, acurrstr, exercise, poisoned } from './attrib.js';
import { isok } from './cmd.js';
import { is_lava, is_pool, is_waterwall } from './dbridge.js';
import { c_common_strings } from './decl.js';
import { canseemon, newsym, sensemon, tmp_at } from './display.js';
import { dropy, flooreffects } from './do.js';
import { Monnam, hliquid, mon_nam, some_mon_nam } from './do_name.js';
import { down_gate, ship_object } from './dokick.js';
import { breaks, harmless_missile, hero_breaks, multishot_class_bonus, omon_adj, should_mulch_missile } from './dothrow.js';
import { freehand } from './engrave.js';
import { calc_capacity, losehp, nomul, rounddiv } from './hack.js';
import { dist2, distmin, s_suffix, upstart } from './hacklib.js';
import { delobj, hold_another_object, sobj_at, stackobj } from './invent.js';
import { obj_sheds_light } from './light.js';
import { mswings_verb } from './mhitu.js';
import { add_to_minv, clear_dknown, is_flammable, mksobj, obj_extract_self, place_object, splitobj, weight } from './mkobj.js';
import { mondied, monkilled, seemimic, setmangry, wake_nearto, xkilled } from './mon.js';
import { Resists_Elem, can_blnd, cvt_adtyp_to_mseenres, get_atkdam_type, hates_silver, mon_hates_silver, monstseesu, monstunseesu, poly_when_stoned, pronoun_gender } from './mondata.js';
import { closed_door, dissolve_bars } from './monmove.js';
import { munstone } from './muse.js';
import { ACID_RES, ACID_VENOM, ARM, ARMOR_CLASS, ARM_GLOVES, ART_SNICKERSNEE, A_CON, A_DEX, A_STR, BALL_CLASS, BLINDED, BLINDING_VENOM, BOULDER, CHAIN_CLASS, COIN_CLASS, CONFUSION, CORPSE, CREAM_PIE, CREDIT_CARD, CROSSBOW, CROSSBOW_BOLT, DEAF, EGG, ELVEN_ARROW, ELVEN_BOW, ENORMOUS_MEATBALL, EYE, FACE, FIRST_GLASS_GEM, FIRST_OBJECT, FIRST_REAL_GEM, FIRST_SPELL, FOOD_CLASS, FOOT, FUMBLING, GEMSTONE, GEM_CLASS, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GOLD, HALF_PHDAM, HALLUC, HALLUC_RES, HAND, HEAVY_IRON_BALL, IRONBARS, LAST_GLASS_GEM, LAST_SPELL, LAVAWALL, LEATHER, LENSES, LOCK_PICK, LOW_PM, MAGIC_WHISTLE, MEAT_STICK, MINERAL, M_AP_MONSTER, M_AP_NOTHING, M_SEEN_ACID, M_SEEN_REFL, NEED_RANGED_WEAPON, NEED_WEAPON, NEUTRAL, NUMMONS, NUM_OBJECTS, ORCISH_ARROW, ORCISH_BOW, PM_ARCHEOLOGIST, PM_CHICKATRICE, PM_COCKATRICE, PM_CYCLOPS, PM_FLOATING_EYE, PM_MANES, PM_MONK, PM_ROGUE, PM_STONE_GOLEM, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WIZARD, POISON_RES, POOL, POTION_CLASS, POT_ACID, P_BOW, P_CROSSBOW, P_DART, P_KNIFE, P_LANCE, P_POLEARMS, P_SHURIKEN, P_SPEAR, RING_CLASS, ROCK_CLASS, RUBBER_HOSE, SILVER, SINK, SKELETON_KEY, SLEEP_RES, SLT_ENCUMBER, SPBOOK_CLASS, STATUE, STONED, STONE_RES, STRANGE_OBJECT, STUNNED, S_GHOST, S_GOLEM, S_UNICORN, S_VORTEX, TALLOW_CANDLE, TIN_WHISTLE, TOOL_CLASS, VENOM_CLASS, WAND_CLASS, WAN_STRIKING, WAR_HAMMER, WAX_CANDLE, WEAPON_CLASS, WT_IRON_BALL_INCR, se_bars_clink, se_bars_clonk, se_bars_flapp, se_bars_whang, se_bars_whap, se_zero_invalid } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { The, Tobjnam, an, distant_name, doname, killer_xname, makeplural, mshot_xname, obj_is_pname, otense, simpleonames, singular, the, vtense, xname } from './objnam.js';
import { pline_mon, set_msg_xy } from './pline.js';
import { body_part, mbodypart, polymon } from './polyself.js';
import { make_blinded, make_stoned, potionhit } from './potion.js';
import { rn2, rn2_on_display_rng, rnd } from './rnd.js';
import { genders } from './role.js';
import { obfree } from './shk.js';
import { minstapetrify } from './trap.js';
import { passive_obj, shade_miss } from './uhitm.js';
import { clear_path } from './vision.js';
import { autoreturn_weapon, dmgval, mon_wield_item, select_rwep, setmnotwielded } from './weapon.js';
import { mwelded } from './wield.js';
import { extract_from_minvent, find_mac } from './worn.js';
import { dobuzz, exclam, hit, miss } from './zap.js';

/*
 * Keep consistent with breath weapons in zap.c, and AD_* in monattk.h.
 */
const breathwep = ["fragments", "fire", "frost", "sleep gas", "a disintegration blast", "lightning", "poison gas", "acid", "strange breath #8", "strange breath #9"];
/* hallucinatory ray types */
const hallublasts = ["asteroids", "beads", "bubbles", "butterflies", "champagne", "chaos", "coins", "cotton candy", "crumbs", "dark matter", "darkness", "data", "dust specks", "emoticons", "emotions", "entropy", "flowers", "foam", "fog", "gamma rays", "gelatin", "gemstones", "ghosts", "glass shards", "glitter", "good vibes", "gravel", "gravity", "gravy", "grawlixes", "holy light", "hornets", "hot air", "hyphens", "hypnosis", "infrared", "insects", "jargon", "laser beams", "leaves", "lightening", "logic gates", "magma", "marbles", "mathematics", "megabytes", "metal shavings", "metapatterns", "meteors", "mist", "mud", "music", "nanites", "needles", "noise", "nostalgia", "oil", "paint", "photons", "pixels", "plasma", "polarity", "powder", "powerups", "prismatic light", "pure logic", "purple", "radio waves", "rainbows", "rock music", "rocket fuel", "rope", "sadness", "salt", "sand", "scrolls", "sludge", "smileys", "snowflakes", "sparkles", "specularity", "spores", "stars", "steam", "tetrahedrons", "text", "the past", "tornadoes", "toxic waste", "ultraviolet light", "viruses", "water", "waveforms", "wind", "X-rays", "zorkmids"];
/* Return a random hallucinatory blast. */
export function rnd_hallublast() {
    return hallublasts[rn2((Math.trunc(96 /* sizeof(const char *const [96]) */ / 1 /* sizeof(const char *const) */)))];
}
export function m_has_launcher_and_ammo(mtmp) {
    let mwep = ((mtmp).mw);
    if (mwep && (mwep.oclass == WEAPON_CLASS && game.objects[mwep.otyp].oc_subtyp >= P_BOW && game.objects[mwep.otyp].oc_subtyp <= P_CROSSBOW)) {
        let otmp = null;
        for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
            if ((((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((mwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(mwep).otyp].oc_subtyp))) {
                return (1);
            }
        }
    }
    return (0);
}
/* hero is hit by something other than a monster (though it could be a
   missile thrown or shot by a monster) */
/* pseudo-level used when deciding whether to hit hero's AC */
/* if null, then format `*objp' */
export async function thitu(tlev, dam, objp, name) {
    let obj = objp ? objp.value : null;
    let onm = null;
    let knm = null;
    let is_acid = 0;
    let named = (name != null);
    let kprefix = 0;
    let dieroll = 0;
    let onmbuf = '';
    let knmbuf = '';
    if (!name) {
        if (!obj) {
            await panic("thitu: name & obj both null?");
        }
        name = strcpy(onmbuf, (obj.quan > 1) ? await doname(obj) : await mshot_xname(obj));
        knm = strcpy(knmbuf, await killer_xname(obj));
        /* killer_name supplies "an" if warranted */
        kprefix = 1;
    } else {
        knm = name;
        /* [perhaps ought to check for plural here too] */
        if (!strncmpi(name, "the ", 4) || !strncmpi(name, "an ", 3) || !strncmpi(name, "a ", 2)) {
            kprefix = 1;
        }
    }
    onm = (obj && obj_is_pname(obj)) ? await the(name) : (obj && obj.quan > 1) ? name : await an(name);
    is_acid = (obj && obj.otyp == ACID_VENOM);
    if (game.u.uac + tlev <= (dieroll = rnd(20))) {
        ++game.mesg_given;
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || !game.flags.verbose) {
            await pline("It misses.");
        } else if (game.u.uac + tlev <= dieroll - 2) {
            if (onm != onmbuf) {
                onmbuf = strcpy(onmbuf, onm);
            }
            await pline("%s %s you.", upstart(onmbuf), await vtense(onmbuf, "miss"));
        } else {
            await You("are almost hit by %s.", onm);
        }
        return 0;
    } else {
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || !game.flags.verbose) {
            await You("are hit%s", exclam(dam));
        } else {
            await You("are hit by %s%s", onm, exclam(dam));
        }
        if (is_acid && (game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
            await pline("It doesn't seem to hurt you.");
            monstseesu(M_SEEN_ACID);
        } else if (obj && ((game.objects[(obj).otyp].oc_material == GEMSTONE || (game.objects[(obj).otyp].oc_material == MINERAL)) && (obj).oclass != RING_CLASS) && ((((game.youmonst.data).mflags1 & 8) != 0) && !(((game.youmonst.data).mflags1 & 1048576) != 0))) {
            await pline("It %s you.", named ? "passes harmlessly through" : "doesn't harm");
        } else if (obj && obj.oclass == POTION_CLASS) {
            await potionhit(game.youmonst, obj, 3);
            /* potionhit() uses up the potion */
            objp.value = obj = null;
        } else {
            if (obj && game.objects[obj.otyp].oc_material == SILVER && (game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data))) {
                await pline_The("silver sears your flesh!");
                await exercise(A_CON, (0));
            }
            if (is_acid) {
                await pline("It burns!");
                monstunseesu(M_SEEN_ACID);
            }
            await losehp(dam, knm, kprefix);
            await exercise(A_STR, (0));
        }
        return 1;
    }
}
/* Be sure this corresponds with what happens to player-thrown objects in
 * dothrow.c (for consistency). --KAA
 * Returns FALSE if object still exists (not destroyed).
 */
export async function drop_throw(obj, ohit, x, y) {
    let broken = 0;
    if (obj.otyp == CREAM_PIE || obj.oclass == VENOM_CLASS || (ohit && obj.otyp == EGG)) {
        broken = (1);
    } else {
        broken = (ohit && should_mulch_missile(obj));
    }
    if (broken) {
        await delobj(obj);
    } else {
        if (await down_gate(x, y) != -1) {
            broken = await ship_object(obj, x, y, (0));
        }
        if (!broken) {
            let mtmp = (game.level.monsters[x][y]);
            if (!(broken = await flooreffects(obj, x, y, "fall"))) {
                await place_object(obj, x, y);
                if (!mtmp && ((x) == game.u.ux && (y) == game.u.uy)) {
                    mtmp = game.youmonst;
                }
                if (mtmp && ohit) {
                    await passive_obj(mtmp, obj, null);
                }
                await stackobj(obj);
            }
        }
    }
    /* note: all early returns follow drop_throw() which clears thrownobj */
    game.thrownobj = null;
    return broken;
}
/* calculate multishot volley count for mtmp throwing otmp (if not ammo) or
   shooting otmp with mwep (if otmp is ammo and mwep appropriate launcher) */
export async function monmulti(mtmp, otmp, mwep) {
    let multishot = 1;
    if (otmp.quan > 1 && (((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) ? ((mwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(mwep).otyp].oc_subtyp) : otmp.oclass == WEAPON_CLASS) && !mtmp.mconf) {
        /* no point checking if there's only 1 */
        /* ammo requires corresponding launcher be wielded */
        /* otherwise any stackable (non-ammo) weapon */
        /* Assumes lords are skilled, princes are expert */
        if ((((mtmp.data).mflags2 & 2048) != 0)) {
            multishot += 2;
        } else if ((((mtmp.data).mflags2 & 1024) != 0)) {
            multishot++;
        } else if ((((mtmp.data).pmidx >= PM_ARCHEOLOGIST) && ((mtmp.data).pmidx <= PM_WIZARD))) {
            multishot++;
        }
        /* this portion is different from hero multishot; from slash'em?
         */
        /* Elven Craftsmanship makes for light, quick bows */
        if (otmp.otyp == ELVEN_ARROW && !otmp.cursed) {
            multishot++;
        }
        /* for arrow, we checked bow&arrow when entering block, but for
           bow, so far we've only validated that otmp is a weapon stack;
           need to verify that it's a stack of arrows rather than darts */
        if (mwep && mwep.otyp == ELVEN_BOW && (((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((mwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(mwep).otyp].oc_subtyp)) && !mwep.cursed) {
            multishot++;
        }
        /* 1/3 of launcher enchantment */
        if ((((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((mwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(mwep).otyp].oc_subtyp)) && mwep.spe > 1) {
            multishot += await rounddiv(mwep.spe, 3);
        }
        multishot = rnd(multishot);
        multishot += multishot_class_bonus(((mtmp.data).pmidx), otmp, mwep);
        if (((((mtmp.data).mflags2 & 16) != 0) && otmp.otyp == ELVEN_ARROW && mwep && mwep.otyp == ELVEN_BOW) || ((((mtmp.data).mflags2 & 128) != 0) && otmp.otyp == ORCISH_ARROW && mwep && mwep.otyp == ORCISH_BOW) || ((((mtmp.data).mflags2 & 64) != 0) && otmp.otyp == CROSSBOW_BOLT && mwep && mwep.otyp == CROSSBOW)) {
            multishot++;
        }
    }
    if (otmp.quan < multishot) {
        multishot = otmp.quan;
    }
    if (multishot < 1) {
        multishot = 1;
    }
    return multishot;
}
/* mtmp throws otmp, or shoots otmp with mwep, at hero or at monster mtarg */
export async function monshoot(mtmp, otmp, mwep) {
    let mtarg = game.mtarget;
    let dm = distmin(mtmp.mx, mtmp.my, mtarg ? mtarg.mx : mtmp.mux, mtarg ? mtarg.my : mtmp.muy);
    let multishot = await monmulti(mtmp, otmp, mwep);
    if (canseemon(mtmp)) {
        /*
     * Caller must have called linedup() to set up <gt.tbx, gt.tby>.
     */
        let onm = null;
        let onmbuf = '';
        let trgbuf = '';
        if (multishot > 1) {
            onmbuf = sprintf(onmbuf, "%d %s", multishot, await xname(otmp));
            /* "N arrows"; multishot > 1 implies otmp->quan > 1, so
               xname()'s result will already be pluralized */
            onm = onmbuf;
        } else {
            onm = await singular(otmp, xname);
            onm = obj_is_pname(otmp) ? await the(onm) : await an(onm);
        }
        game.m_shot.s = (((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((mwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(mwep).otyp].oc_subtyp)) ? (1) : (0);
        trgbuf = strcpy(trgbuf, mtarg ? await some_mon_nam(mtarg) : "");
        set_msg_xy(mtmp.mx, mtmp.my);
        await pline("%s %s %s%s%s!", await Monnam(mtmp), game.m_shot.s ? "shoots" : "throws", onm, mtarg ? " at " : "", trgbuf);
        game.m_shot.o = otmp.otyp;
    } else {
        /* don't give multishot feedback */
        game.m_shot.o = STRANGE_OBJECT;
    }
    game.m_shot.n = multishot;
    for (game.m_shot.i = 1; game.m_shot.i <= game.m_shot.n; game.m_shot.i++) {
        await m_throw(mtmp, mtmp.mx, mtmp.my, sgn(game.tbx), sgn(game.tby), dm, otmp);
        /* conceptually all N missiles are in flight at once, but
           if mtmp gets killed (shot kills adjacent gas spore and
           triggers explosion, perhaps), inventory will be dropped
           and otmp might go away via merging into another stack */
        if (((mtmp).mhp < 1) && game.m_shot.i < game.m_shot.n) {
            break;
        }
    }
    game.m_shot.n = game.m_shot.i = 0;
    game.m_shot.o = STRANGE_OBJECT;
    game.m_shot.s = (0);
}
/* an object launched by someone/thing other than player attacks a monster;
   return 1 if the object has stopped moving (hit or its range used up);
   can anger the monster, if this happened due to hero (eg. exploding
   bag of holding throwing the items) */
/* accidental target, located at <gb.bhitpos.x,.y> */
/* missile; might be destroyed by drop_throw */
/* how much farther will object travel if it misses;
                         * use -1 to signify to keep going even after hit,
                         * unless it's gone (for rolling_boulder_traps) */
/* give messages even when you can't see what happened */
export async function ohitmon(mtmp, otmp, range, verbose) {
    let damage = 0;
    let tmp = 0;
    let vis = 0;
    let ismimic = 0;
    let objgone = 0;
    let mon_launcher = game.marcher ? ((game.marcher).mw) : null;
    game.notonhead = (game.bhitpos.x != mtmp.mx || game.bhitpos.y != mtmp.my);
    ismimic = ((mtmp).m_ap_type & 7) && ((mtmp).m_ap_type & 7) != M_AP_MONSTER;
    vis = ((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0);
    if (vis) {
        await observe_object(otmp);
    }
    tmp = 5 + find_mac(mtmp) + await omon_adj(mtmp, otmp, (0));
    if (game.marcher && game.mtarget == mtmp) {
        /* High level monsters will be more likely to hit */
        /* This check applies only if this monster is the target
     * the archer was aiming at. */
        if (game.marcher.m_lev > 5) {
            tmp += game.marcher.m_lev - 5;
        }
        if (mon_launcher && mon_launcher.oartifact) {
            tmp += await spec_abon(mon_launcher, mtmp);
        }
    }
    if (tmp < rnd(20)) {
        if (!ismimic) {
            if (vis) {
                await miss(await distant_name(otmp, mshot_xname), mtmp);
            } else if (verbose && !game.mtarget) {
                await pline("It is missed.");
            }
        }
        if (!range) {
            await drop_throw(otmp, 0, mtmp.mx, mtmp.my);
            return 1;
        }
    } else if (otmp.oclass == POTION_CLASS) {
        if (ismimic) {
            await seemimic(mtmp);
        }
        mtmp.msleeping = 0;
        await potionhit(mtmp, otmp, 3);
        return 1;
    } else {
        let material = game.objects[otmp.otyp].oc_material;
        let harmless = (((game.objects[(otmp).otyp].oc_material == GEMSTONE || (game.objects[(otmp).otyp].oc_material == MINERAL)) && (otmp).oclass != RING_CLASS) && ((((mtmp.data).mflags1 & 8) != 0) && !(((mtmp.data).mflags1 & 1048576) != 0)));
        damage = await dmgval(otmp, mtmp);
        if (otmp.otyp == ACID_VENOM && await Resists_Elem(mtmp, ACID_RES)) {
            damage = 0;
        }
        if (ismimic) {
            await seemimic(mtmp);
        }
        mtmp.msleeping = 0;
        ;
        if (vis) {
            if (otmp.otyp == EGG) {
                await pline("Splat!  %s is hit with %s egg!", await Monnam(mtmp), otmp.known ? await an(game.mons[otmp.corpsenm].pmnames[NEUTRAL]) : "an");
            } else {
                let how = '';
                if (!harmless) {
                    how = strcpy(how, exclam(damage));
                } else {
                    how = sprintf(how, " but passes harmlessly through %.9s.", (genders[pronoun_gender(mtmp, 2)].him));
                }
                await hit(await distant_name(otmp, mshot_xname), mtmp, how);
            }
        } else if (verbose && !game.mtarget) {
            await pline("%s%s is hit%s", (otmp.otyp == EGG) ? "Splat!  " : "", await Monnam(mtmp), exclam(damage));
        }
        if (otmp.otrapped && ((otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp >= -P_SHURIKEN && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) || permapoisoned(otmp))) {
            if (await Resists_Elem(mtmp, POISON_RES)) {
                if (vis) {
                    await pline_The("poison doesn't seem to affect %s.", await mon_nam(mtmp));
                }
            } else {
                if (rn2(30)) {
                    damage += rnd(6);
                } else {
                    if (vis) {
                        await pline_The("poison was deadly...");
                    }
                    damage = mtmp.mhp;
                }
            }
        }
        if (material == SILVER && mon_hates_silver(mtmp)) {
            let flesh = (!((mtmp.data).mlet == S_GHOST) && !(((mtmp.data).mflags1 & 4) != 0));
            if (vis) {
                let m_name = await mon_nam(mtmp);
                /* s_suffix returns a modifiable buffer */
                if (flesh) {
                    m_name = strcat(s_suffix(m_name), " flesh");
                }
                await pline_The("silver sears %s!", m_name);
            } else if (verbose && !game.mtarget) {
                await pline("%s is seared!", flesh ? "Its flesh" : "It");
            }
        }
        if (otmp.otyp == ACID_VENOM && ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
            if (await Resists_Elem(mtmp, ACID_RES)) {
                if (vis || (verbose && !game.mtarget)) {
                    await pline("%s is unaffected.", await Monnam(mtmp));
                }
            } else {
                if (vis) {
                    await pline_The("%s burns %s!", hliquid("acid"), await mon_nam(mtmp));
                } else if (verbose && !game.mtarget) {
                    await pline("It is burned!");
                }
            }
        }
        if (otmp.otyp == EGG && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE])) {
            if (!await munstone(mtmp, (0))) {
                await minstapetrify(mtmp, (0));
            }
            if (await Resists_Elem(mtmp, STONE_RES)) {
                damage = 0;
            }
        }
        if (!harmless && !((mtmp).mhp < 1)) {
            /* might already be dead (if petrified) */
            mtmp.mhp -= damage;
            if (((mtmp).mhp < 1)) {
                if (vis || (verbose && !game.mtarget)) {
                    await pline("%s is %s!", await Monnam(mtmp), (((((mtmp.data).mflags2 & 2) != 0) || (mtmp.data) == game.mons[PM_MANES] || (((mtmp.data).mlet == S_GOLEM) || (mtmp.data).mlet == S_VORTEX)) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER) || !(canseemon(mtmp) || sensemon(mtmp))) ? "destroyed" : "killed");
                }
                if (!game.context.mon_moving && (otmp.otyp != BOULDER || range >= 0 || otmp.otrapped)) {
                    await xkilled(mtmp, 1);
                } else {
                    await mondied(mtmp);
                }
            }
        }
        if (!((mtmp).mhp < 1) && await can_blnd(null, mtmp, ((otmp.otyp == BLINDING_VENOM) ? 10 : 254), otmp)) {
            if (vis && mtmp.mcansee) {
                await pline("%s is blinded by %s.", await Monnam(mtmp), await the((otmp.oclass == VENOM_CLASS) ? "venom" : (otmp.otyp == CREAM_PIE) ? "pie" : await xname(otmp)));
            }
            mtmp.mcansee = 0;
            tmp = mtmp.mblinded + rnd(25) + 20;
            if (tmp > 127) {
                tmp = 127;
            }
            mtmp.mblinded = tmp;
        }
        if (!((mtmp).mhp < 1) && !game.context.mon_moving) {
            await setmangry(mtmp, (1));
        }
        objgone = await drop_throw(otmp, 1, game.bhitpos.x, game.bhitpos.y);
        if (!objgone && range == -1) {
            await obj_extract_self(otmp);
            return (0);
        }
        return (1);
    }
    return (0);
}
/* hero catches gem thrown by mon iff poly'd into unicorn; might drop it */
/* caller has verified gem->oclass */
export async function ucatchgem(gem, mon) {
    if (gem.otyp <= LAST_GLASS_GEM && ((game.youmonst.data).mlet == S_UNICORN && (((game.youmonst.data).mflags2 & 536870912) != 0))) {
        let gem_xname = await xname(gem);
        let mon_s_name = s_suffix(await mon_nam(mon));
        if (gem.otyp >= FIRST_GLASS_GEM) {
            await You("catch the %s.", gem_xname);
            await You("are not interested in %s junk.", mon_s_name);
            await discover_object((gem.otyp), (1), (1), (1));
            await dropy(gem);
        } else {
            await You("accept %s gift in the spirit in which it was intended.", mon_s_name);
            await hold_another_object(gem, "You catch, but drop, %s.", gem_xname, "You catch:");
        }
        return (1);
    }
    return (0);
}
/* hero may catch thrown obj. it is added to inventory, if possible */
export async function u_catch_thrown_obj(otmp) {
    let catch_chance = 100 - (acurr(A_DEX)) - (((game.urole.mnum == (PM_MONK)) || (game.urole.mnum == (PM_ROGUE))) ? 20 : 0);
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !game.u.uprops[CONFUSION].intrinsic && !game.u.uprops[STUNNED].intrinsic && !(game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) && otmp.oclass != VENOM_CLASS && !(((game.youmonst.data).mflags1 & 8192) != 0) && freehand() && calc_capacity(otmp.owt) <= SLT_ENCUMBER && !rn2(catch_chance)) {
        let buf = '';
        buf = nh_snprintf("u_catch_thrown_obj", 544, buf, 256, "You catch the %s!", await simpleonames(otmp));
        await hold_another_object(otmp, "You catch, but drop, the %s.", await simpleonames(otmp), buf);
        return (1);
    }
    return (0);
}
/* missile hits edge of screen */
/* missile hits the wall */
/* missile hit closed door */
/* missile might hit iron bars */
/* the random chance for small objects hitting bars is */
/* skipped when reaching them at point blank range */
/* Thrown objects "sink" */
/* launching monster */
/* launch point */
/* direction */
/* maximum distance */
/* missile (or stack providing it) */
export async function m_throw(mon, x, y, dx, dy, range, obj) {
    let mtmp = null;
    let singleobj = null;
    let forcehit = 0;
    let sym = obj.oclass;
    let hitu = 0;
    let oldumort = 0;
    let blindinc = 0;
    let arw = autoreturn_weapon(obj);
    let tethered_weapon = (obj == ((mon).mw) && arw && arw.tethered != 0);
    let return_flightpath = (0);
    game.bhitpos.x = x;
    game.bhitpos.y = y;
    /* reset potentially stale value */
    game.notonhead = (0);
    if (obj.quan == 1) {
        if (((mon).mw) == obj) {
            await setmnotwielded(mon, obj);
        }
        await obj_extract_self(obj);
        singleobj = obj;
        obj = null;
    } else {
        singleobj = await splitobj(obj, 1);
        await obj_extract_self(singleobj);
    }
    /* global pointer for missile object in OBJ_FREE state */
    game.thrownobj = singleobj;
    /* threw one of multiple weapons in hand? */
    singleobj.owornmask = 0;
    if (!canseemon(mon)) {
        clear_dknown(singleobj);
    }
    if ((singleobj.cursed || singleobj.greased) && (dx || dy) && !rn2(7)) {
        if (canseemon(mon) && game.flags.verbose) {
            if (((singleobj.oclass == WEAPON_CLASS || singleobj.oclass == GEM_CLASS) && game.objects[singleobj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[singleobj.otyp].oc_subtyp <= -P_BOW)) {
                await pline("%s misfires!", await Monnam(mon));
            } else {
                await pline("%s as %s throws it!", await Tobjnam(singleobj, "slip"), await mon_nam(mon));
            }
        }
        dx = rn2(3) - 1;
        dy = rn2(3) - 1;
        if (!dx && !dy) {
            await drop_throw(singleobj, 0, game.bhitpos.x, game.bhitpos.y);
            return;
        }
    }
    if ((!isok(game.bhitpos.x + dx, game.bhitpos.y + dy) || ((game.level.locations[game.bhitpos.x + dx][game.bhitpos.y + dy].typ) < POOL) || closed_door(game.bhitpos.x + dx, game.bhitpos.y + dy) || (game.level.locations[game.bhitpos.x + dx][game.bhitpos.y + dy].typ == IRONBARS && await hits_bars(singleobj, game.bhitpos.x, game.bhitpos.y, game.bhitpos.x + dx, game.bhitpos.y + dy, (((1)) ? 0 : 0), 0)) || (!((1)) && ((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) == SINK)))) {
        await drop_throw(singleobj, 0, game.bhitpos.x, game.bhitpos.y);
        return;
    }
    /* a 'missile misses' message has not yet been shown */
    game.mesg_given = 0;
    if (sym) {
        if (!tethered_weapon) {
            await tmp_at((-4), (((singleobj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((singleobj).corpsenm + ((((singleobj).spe & 3) == 1) ? (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((singleobj).otyp == CORPSE) ? (((singleobj).corpsenm + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(singleobj).dknown && ((singleobj).oclass == POTION_CLASS || ((singleobj).otyp >= FIRST_REAL_GEM && ((singleobj).otyp <= LAST_GLASS_GEM)) || ((singleobj).otyp >= FIRST_SPELL && ((singleobj).otyp <= LAST_SPELL)))) ? (((singleobj).oclass + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((singleobj).otyp + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
        } else {
            await tmp_at((-3), (((singleobj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((singleobj).corpsenm + ((((singleobj).spe & 3) == 1) ? (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((singleobj).otyp == CORPSE) ? (((singleobj).corpsenm + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(singleobj).dknown && ((singleobj).oclass == POTION_CLASS || ((singleobj).otyp >= FIRST_REAL_GEM && ((singleobj).otyp <= LAST_GLASS_GEM)) || ((singleobj).otyp >= FIRST_SPELL && ((singleobj).otyp <= LAST_SPELL)))) ? (((singleobj).oclass + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((singleobj).otyp + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
        }
    }
    while (range-- > 0) {
        /* Actually the loop is always exited by break */
        singleobj.ox = game.bhitpos.x += dx;
        singleobj.oy = game.bhitpos.y += dy;
        if (((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0)) {
            await observe_object(singleobj);
        }
        mtmp = (game.level.monsters[game.bhitpos.x][game.bhitpos.y]);
        if (mtmp && await shade_miss(mon, mtmp, singleobj, (1), (1))) {
            /* if mtmp is a shade and missile passes harmlessly through it,
               give message and skip it in order to keep going */
            mtmp = null;
        } else if (mtmp) {
            if (await ohitmon(mtmp, singleobj, range, (1))) {
                break;
            }
        } else if (((game.bhitpos.x) == game.u.ux && (game.bhitpos.y) == game.u.uy)) {
            if (game.multi) {
                nomul(0);
            }
            if (singleobj.oclass == GEM_CLASS && await ucatchgem(singleobj, mon)) {
                break;
            }
            if (!tethered_weapon && await u_catch_thrown_obj(singleobj)) {
                break;
            }
            if (singleobj.oclass == POTION_CLASS) {
                await potionhit(game.youmonst, singleobj, 2);
                break;
            }
            oldumort = game.u.umortality;
            switch (singleobj.otyp) {
                case EGG:
                    if (!((game.mons[singleobj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[singleobj.corpsenm]) == game.mons[PM_CHICKATRICE])) {
                        await impossible("monster throwing egg type %d", singleobj.corpsenm);
                        hitu = 0;
                        break;
                    }
                    ;
                case CREAM_PIE:
                case BLINDING_VENOM:
                    hitu = await thitu(8, 0, { get value() { return singleobj; }, set value(_v) { singleobj = _v; } }, null);
                    break;
                default:
{
                        let dam = 0;
                        let hitv = 0;
                        dam = await dmgval(singleobj, game.youmonst);
                        hitv = 3 - distmin(game.u.ux, game.u.uy, mon.mx, mon.my);
                        if (hitv < -4) {
                            hitv = -4;
                        }
                        if ((((mon.data).mflags2 & 16) != 0) && game.objects[singleobj.otyp].oc_subtyp == -P_BOW) {
                            /* [elves get a shooting bonus, orcs don't...] */
                            hitv++;
                            if (((mon).mw) && ((mon).mw).otyp == ELVEN_BOW) {
                                hitv++;
                            }
                            if (singleobj.otyp == ELVEN_ARROW) {
                                dam++;
                            }
                        }
                        if (((game.youmonst.data).msize >= 3)) {
                            hitv++;
                        }
                        hitv += 8 + singleobj.spe;
                        if (dam < 1) {
                            dam = 1;
                        }
                        if (singleobj.otyp != ACID_VENOM) {
                            dam = (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam));
                        }
                        hitu = await thitu(hitv, dam, { get value() { return singleobj; }, set value(_v) { singleobj = _v; } }, null);
                    }
            }
            if (hitu && singleobj.otrapped && ((singleobj.oclass == WEAPON_CLASS && game.objects[singleobj.otyp].oc_subtyp >= -P_SHURIKEN && game.objects[singleobj.otyp].oc_subtyp <= -P_BOW) || permapoisoned(singleobj))) {
                let onmbuf = '';
                let knmbuf = '';
                onmbuf = strcpy(onmbuf, await xname(singleobj));
                knmbuf = strcpy(knmbuf, await killer_xname(singleobj));
                await poisoned(onmbuf, A_STR, knmbuf, (game.u.umortality > oldumort) ? 0 : 10, (1));
            }
            if (hitu && await can_blnd(null, game.youmonst, ((singleobj.otyp == BLINDING_VENOM) ? 10 : 254), singleobj)) {
                /* if damage triggered life-saving,
                            poison is limited to attrib loss */
                blindinc = rnd(25);
                if (singleobj.otyp == CREAM_PIE) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await pline("Yecch!  You've been creamed.");
                    } else {
                        await pline("There's %s sticky all over your %s.", c_common_strings.c_something, await body_part(FACE));
                    }
                } else if (singleobj.otyp == BLINDING_VENOM) {
                    let eyes = await body_part(EYE);
                    if ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2) != 1) {
                        eyes = await makeplural(eyes);
                    }
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await pline_The("venom blinds you.");
                    } else {
                        await Your("%s %s.", eyes, await vtense(eyes, "sting"));
                    }
                }
            }
            if (hitu && singleobj.otyp == EGG) {
                if (!game.u.uprops[STONED].intrinsic && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && await polymon(PM_STONE_GOLEM))) {
                    await make_stoned(5, null, 1, "");
                }
            }
            await stop_occupation();
            if (hitu) {
                if (!tethered_weapon) {
                    await drop_throw(singleobj, hitu, game.u.ux, game.u.uy);
                } else {
                    /* ready for return journey */
                    return_flightpath = (1);
                }
                break;
            }
        }
        forcehit = !rn2(5);
        if (!range || (!isok(game.bhitpos.x + dx, game.bhitpos.y + dy) || ((game.level.locations[game.bhitpos.x + dx][game.bhitpos.y + dy].typ) < POOL) || closed_door(game.bhitpos.x + dx, game.bhitpos.y + dy) || (game.level.locations[game.bhitpos.x + dx][game.bhitpos.y + dy].typ == IRONBARS && await hits_bars(singleobj, game.bhitpos.x, game.bhitpos.y, game.bhitpos.x + dx, game.bhitpos.y + dy, (((0)) ? 0 : forcehit), 0)) || (!((0)) && ((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) == SINK)))) {
            if (singleobj) {
                /* hits_bars might have destroyed it */
                /* note: pline(The(missile)) rather than pline_The(missile)
                   in order to get "Grimtooth" rather than "The Grimtooth" */
                if (range && ((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0) && ((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) == SINK)) {
                    await pline("%s %s onto the sink.", await The(await mshot_xname(singleobj)), await otense(singleobj, (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "plop" : "drop"));
                } else if (game.m_shot.n > 1 && (!game.mesg_given || game.bhitpos.x != game.u.ux || game.bhitpos.y != game.u.uy) && (((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0) || (game.marcher && canseemon(game.marcher)))) {
                    await pline("%s misses.", await The(await mshot_xname(singleobj)));
                }
                if (!tethered_weapon) {
                    await drop_throw(singleobj, 0, game.bhitpos.x, game.bhitpos.y);
                } else {
                    return_flightpath = (1);
                }
            }
            break;
        }
        await tmp_at(game.bhitpos.x, game.bhitpos.y);
        (game.windowprocs.win_delay_output)();
    }
    await tmp_at(game.bhitpos.x, game.bhitpos.y);
    (game.windowprocs.win_delay_output)();
    if (arw && return_flightpath) {
        await return_from_mtoss(mon, singleobj, tethered_weapon);
    } else {
        await tmp_at((-7), 0);
    }
    game.mesg_given = 0;
    if (blindinc) {
        game.u.ucreamed += blindinc;
        await make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + blindinc, (0));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await Your("%s", c_common_strings.c_vision_clears);
        }
    }
    game.thrownobj = null;
    return;
}
let __return_from_mtoss_do_not_annoy = 0;
__nh_register_static(() => { __return_from_mtoss_do_not_annoy = 0; });
export async function return_from_mtoss(magr, otmp, tethered_weapon) {
    let impaired = (magr.mconf || magr.mstun || magr.mblinded);
    let notcaught = (0);
    let hits_thrower = (0);
    let x = game.bhitpos.x;
    let y = game.bhitpos.y;
    let made_it_back = rn2(100);
    let dmg = 0;
    if (otmp && made_it_back) {
        if (tethered_weapon) {
            await tmp_at((-7), (-1));
        } else {
            let dx = sgn(x - magr.mx);
            let dy = sgn(y - magr.my);
            if (x != magr.mx || y != magr.my) {
                await tmp_at((-4), (((otmp).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((otmp).corpsenm + ((((otmp).spe & 3) == 1) ? (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((otmp).otyp == CORPSE) ? (((otmp).corpsenm + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(otmp).dknown && ((otmp).oclass == POTION_CLASS || ((otmp).otyp >= FIRST_REAL_GEM && ((otmp).otyp <= LAST_GLASS_GEM)) || ((otmp).otyp >= FIRST_SPELL && ((otmp).otyp <= LAST_SPELL)))) ? (((otmp).oclass + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((otmp).otyp + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
                while (isok(x, y) && (x != magr.mx || y != magr.my)) {
                    await tmp_at(x, y);
                    (game.windowprocs.win_delay_output)();
                    x -= dx;
                    y -= dy;
                }
                await tmp_at((-7), 0);
            }
        }
        x = magr.mx;
        y = magr.my;
        if (!impaired && rn2(100)) {
            if (!__return_from_mtoss_do_not_annoy || (game.moves - __return_from_mtoss_do_not_annoy) > 500) {
                await pline("%s to %s %s!", await Tobjnam(otmp, "return"), s_suffix(await mon_nam(magr)), await mbodypart(magr, HAND));
                __return_from_mtoss_do_not_annoy = game.moves;
            }
            if (otmp) {
                await add_to_minv(magr, otmp);
                if (tethered_weapon) {
                    magr.mw = otmp;
                    otmp.owornmask |= 256;
                }
            }
            if (((game.viz_array[y][x] & 2) != 0)) {
                await newsym(x, y);
            }
        } else {
            /* msg future-proofing only */
            let mlevitating = (0);
            dmg = rn2(2);
            if (!dmg) {
                if (canseemon(magr)) {
                    await pline("%s back to %s, landing %s %s %s.", await Tobjnam(otmp, "return"), await mon_nam(magr), mlevitating ? "beneath" : "at", (genders[pronoun_gender(magr, 2)].his), await makeplural(await mbodypart(magr, FOOT)));
                } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    await You_hear("%s land near %s.", c_common_strings.c_Something, await mon_nam(magr));
                }
            } else {
                dmg += rnd(3);
                if (canseemon(magr)) {
                    await pline("%s back toward %s, hitting %s %s!", await Tobjnam(otmp, "fly"), await mon_nam(magr), (genders[pronoun_gender(magr, 2)].his), await body_part(ARM));
                } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    await You_hear("%s hit %s with a thud!", c_common_strings.c_something, await mon_nam(magr));
                }
                hits_thrower = (1);
            }
            notcaught = (1);
        }
    } else {
        if (tethered_weapon) {
            await tmp_at((-7), 0);
        }
        await You_hear("a loud snap!");
        notcaught = (1);
    }
    if (otmp) {
        if (hits_thrower) {
            if (otmp.oartifact) {
                await artifact_hit(null, magr, otmp, { get value() { return dmg; }, set value(_v) { dmg = _v; } }, 0);
            }
            magr.mhp -= dmg;
            if (((magr).mhp < 1)) {
                await monkilled(magr, (canseemon(magr) || sensemon(magr)) ? "" : null, 0);
            }
        }
        if (notcaught) {
            await snuff_candle(otmp);
            if (!await ship_object(otmp, x, y, (0))) {
                if (await flooreffects(otmp, x, y, "drop")) {
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        await newsym(x, y);
                    }
                    return;
                }
                await place_object(otmp, x, y);
                await stackobj(otmp);
            }
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(game.u.uinwater)) {
                if (is_pool(x, y) || (is_lava(x, y) && !is_flammable(otmp))) {
                    ;
                    await pline((await weight(otmp) > 9) ? "Splash!" : "Plop!");
                }
            }
            if (obj_sheds_light(otmp)) {
                game.vision_full_recalc = 1;
            }
        }
    }
    if (((game.viz_array[y][x] & 2) != 0)) {
        await newsym(x, y);
    }
}
/* Monster throws item at another monster */
export async function thrwmm(mtmp, mtarg) {
    let otmp = null;
    let mwep = null;
    let x = 0;
    let y = 0;
    let ispole = 0;
    if (mtmp.weapon_check == NEED_WEAPON || !((mtmp).mw)) {
        /* Polearms won't be applied by monsters against other monsters */
        /* Rearranged beginning so monsters can use polearms not in a line */
        mtmp.weapon_check = NEED_RANGED_WEAPON;
        if (await mon_wield_item(mtmp) != 0) {
            return 0;
        }
    }
    otmp = await select_rwep(mtmp);
    if (!otmp) {
        return 0;
    }
    ispole = ((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && (game.objects[otmp.otyp].oc_subtyp == P_POLEARMS || game.objects[otmp.otyp].oc_subtyp == P_LANCE || is_art(otmp, ART_SNICKERSNEE)));
    x = mtmp.mx;
    y = mtmp.my;
    mwep = ((mtmp).mw);
    if (!ispole && m_lined_up(mtarg, mtmp)) {
        let chance = ((8 - distmin(x, y, mtarg.mx, mtarg.my)) > (1) ? (8 - distmin(x, y, mtarg.mx, mtarg.my)) : (1));
        if (!mtarg.mflee || !rn2(chance)) {
            if ((((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((mwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(mwep).otyp].oc_subtyp)) && dist2(mtmp.mx, mtmp.my, mtarg.mx, mtarg.my) > 36) {
                return 0;
            }
            game.mtarget = mtarg;
            game.marcher = mtmp;
            await monshoot(mtmp, otmp, mwep);
            game.marcher = game.mtarget = null;
            nomul(0);
            return 1;
        }
    }
    return 0;
}
/* monster spits substance at monster */
export async function spitmm(mtmp, mattk, mtarg) {
    let otmp = null;
    if (mtmp.mcan) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) < 8 * 8) {
            if ((canseemon(mtmp) || sensemon(mtmp))) {
                await pline("A dry rattle comes from %s throat.", s_suffix(await mon_nam(mtmp)));
            } else {
                ;
                await You_hear("a dry rattle nearby.");
            }
        }
        return 0;
    }
    if (m_lined_up(mtarg, mtmp)) {
        let utarg = (mtarg == game.youmonst);
        let tx = utarg ? mtmp.mux : mtarg.mx;
        let ty = utarg ? mtmp.muy : mtarg.my;
        switch (mattk.adtyp) {
            case 11:
            case 7:
                otmp = await mksobj(BLINDING_VENOM, (1), (0));
                break;
            default:
                await impossible("bad attack type in spitmm");
                ;
            case 8:
                otmp = await mksobj(ACID_VENOM, (1), (0));
                break;
        }
        if (!rn2(8 - distmin(mtmp.mx, mtmp.my, tx, ty))) {
            if (canseemon(mtmp)) {
                await pline("%s spits venom!", await Monnam(mtmp));
            }
            if (!utarg) {
                game.mtarget = mtarg;
            }
            await m_throw(mtmp, mtmp.mx, mtmp.my, sgn(game.tbx), sgn(game.tby), distmin(mtmp.mx, mtmp.my, tx, ty), otmp);
            game.mtarget = null;
            nomul(0);
            if (mtmp.mtame && !mtmp.isminion) {
                /* If this is a pet, it'll get hungry. Minions and
             * spell beings won't hunger */
                let dog = ((mtmp).mextra.edog);
                /* Hunger effects will catch up next move */
                if (dog.hungrytime > 1) {
                    dog.hungrytime -= 5;
                }
            }
            return 1;
        } else {
            await obj_extract_self(otmp);
            await obfree(otmp, null);
        }
    }
    return 0;
}
/* Return the name of a breath weapon. If the player is hallucinating, return
 * a silly name instead.
 * typ is AD_MAGM, AD_FIRE, etc */
export function breathwep_name(typ) {
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        return rnd_hallublast();
    }
    return breathwep[(abs((typ) - 1) % 10)];
}
/* monster breathes at monster (ranged) */
export async function breamm(mtmp, mattk, mtarg) {
    let typ = get_atkdam_type(mattk.adtyp);
    let utarget = (mtarg == game.youmonst);
    if (m_lined_up(mtarg, mtmp)) {
        if (mtmp.mcan) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                if (canseemon(mtmp)) {
                    await pline("%s coughs.", await Monnam(mtmp));
                } else {
                    ;
                    await You_hear("a cough.");
                }
            }
            return 0;
        }
        /* if we've seen the actual resistance, don't bother, or
           if we're close by and they reflect, just jump the player */
        if (utarget && (((mtmp).seen_resistance & (cvt_adtyp_to_mseenres(typ))) || ((mtmp).seen_resistance & (M_SEEN_REFL)))) {
            return 1;
        }
        if (!mtmp.mspec_used && rn2(3)) {
            if (((typ) >= 1 && (typ) <= 10)) {
                if (canseemon(mtmp)) {
                    await pline("%s breathes %s!", await Monnam(mtmp), breathwep_name(typ));
                }
                game.buzzer = mtmp;
                await dobuzz((-20 - ((abs((typ) - 1) % 10))), mattk.damn, mtmp.mx, mtmp.my, sgn(game.tbx), sgn(game.tby), utarget, utarget, (0));
                game.buzzer = null;
                nomul(0);
                /* breath runs out sometimes. Also, give monster some
                 * cunning; don't breath if the target fell asleep.
                 */
                if (!utarget || !rn2(3)) {
                    mtmp.mspec_used = 8 + rn2(18);
                }
                if (utarget && typ == 4 && !(game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                    mtmp.mspec_used += rnd(20);
                }
                if (mtmp.mtame && !mtmp.isminion) {
                    /* If this is a pet, it'll get hungry. Minions and
                 * spell beings won't hunger */
                    let dog = ((mtmp).mextra.edog);
                    if (dog.hungrytime >= 10) {
                        dog.hungrytime -= 10;
                    }
                }
            } else {
                await impossible("Breath weapon %d used", typ - 1);
            }
        } else {
            return 0;
        }
    }
    return 1;
}
/* remove an entire item from a monster's inventory; destroy that item */
export async function m_useupall(mon, obj) {
    await extract_from_minvent(mon, obj, (1), (0));
    await obfree(obj, null);
}
/* remove one instance of an item from a monster's inventory */
export async function m_useup(mon, obj) {
    if (obj.quan > 1) {
        obj.quan--;
        obj.owt = await weight(obj);
    } else {
        await m_useupall(mon, obj);
    }
}
/* monster attempts ranged weapon attack against player */
export async function thrwmu(mtmp) {
    let otmp = null;
    let mwep = null;
    let x = 0;
    let y = 0;
    let onm = null;
    let rang = 0;
    let arw = null;
    let always_toss = (0);
    if (mtmp.weapon_check == NEED_WEAPON || !((mtmp).mw)) {
        mtmp.weapon_check = NEED_RANGED_WEAPON;
        if (await mon_wield_item(mtmp) != 0) {
            return;
        }
    }
    otmp = await select_rwep(mtmp);
    if (!otmp) {
        return;
    }
    if (((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && (game.objects[otmp.otyp].oc_subtyp == P_POLEARMS || game.objects[otmp.otyp].oc_subtyp == P_LANCE || is_art(otmp, ART_SNICKERSNEE)))) {
        let dam = 0;
        let hitv = 0;
        if (otmp != ((mtmp).mw)) {
            return;
        }
        /* polearm, aklys must be wielded */
        /*
         * MON_POLE_DIST encompasses knight's move range (5): two spots
         * away provided it's not on a straight diagonal, same as skilled
         * hero.  Using polearm while adjacent is allowed but the verb
         * is adjusted from "thrusts" to "bashes", where the hero would
         * have to switch from applying a polearm to ordinary melee attack
         * to accomplish that.
         *
         *  .545.
         *  52125
         *  41014
         *  52125
         *  .545.
         */
        /* "thrusts" or "swings", or "bashes with" if adjacent */
        rang = dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy);
        if (rang > 5 || !((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
            return;
        }
        if (canseemon(mtmp)) {
            onm = await xname(otmp);
            await pline_mon(mtmp, "%s %s %s.", await Monnam(mtmp), mswings_verb(otmp, (rang <= 2) ? (1) : (0)), obj_is_pname(otmp) ? await the(onm) : await an(onm));
        }
        dam = await dmgval(otmp, game.youmonst);
        hitv = 3 - distmin(game.u.ux, game.u.uy, mtmp.mx, mtmp.my);
        if (hitv < -4) {
            hitv = -4;
        }
        if (((game.youmonst.data).msize >= 3)) {
            hitv++;
        }
        hitv += 8 + otmp.spe;
        if (dam < 1) {
            dam = 1;
        }
        await thitu(hitv, (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam)), { get value() { return otmp; }, set value(_v) { otmp = _v; } }, null);
        await stop_occupation();
        return;
    } else if ((arw = autoreturn_weapon(otmp)) != null && !mwelded(otmp)) {
        rang = dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy);
        if (rang > arw.range || !((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
            return;
        }
        always_toss = (1);
    }
    x = mtmp.mx;
    y = mtmp.my;
    /* If you are coming toward the monster, the monster
     * should try to soften you up with missiles.  If you are
     * going away, you are probably hurt or running.  Give
     * chase, but if you are getting too far away, throw.
     */
    if (!lined_up(mtmp) || ((distmin(game.u.ux, game.u.uy, x, y) > distmin(game.u.ux0, game.u.uy0, x, y)) && (!always_toss && rn2(8 - distmin(x, y, mtmp.mux, mtmp.muy))))) {
        return;
    }
    mwep = ((mtmp).mw);
    await monshoot(mtmp, otmp, mwep);
    nomul(0);
}
/* monster spits substance at you */
export async function spitmu(mtmp, mattk) {
    return await spitmm(mtmp, mattk, game.youmonst);
}
/* monster breathes at you (ranged) */
export async function breamu(mtmp, mattk) {
    return await breamm(mtmp, mattk, game.youmonst);
}
/* return TRUE if terrain at x,y blocks linedup checks */
export function blocking_terrain(x, y) {
    if (!isok(x, y) || ((game.level.locations[x][y].typ) < POOL) || closed_door(x, y) || is_waterwall(x, y) || game.level.locations[x][y].typ == LAVAWALL) {
        return (1);
    }
    return (0);
}
/* Move from (ax,ay) to (bx,by), but only if distance is up to BOLT_LIM
   and only in straight line or diagonal, calling fnc for each step.
   Stops if fnc return TRUE, or if step was blocked by wall or closed door.
   Returns TRUE if fnc returned TRUE. */
export function linedup_callback(ax, ay, bx, by, fnc) {
    let dx = 0;
    let dy = 0;
    /* These two values are set for use after successful return. */
    game.tbx = ax - bx;
    game.tby = ay - by;
    /* sometimes displacement makes a monster think that you're at its
       own location; prevent it from throwing and zapping in that case */
    if (!game.tbx && !game.tby) {
        return (0);
    }
    if ((!game.tbx || !game.tby || abs(game.tbx) == abs(game.tby)) && distmin(game.tbx, game.tby, 0, 0) < 8) {
        /* straight line, orthogonal to the map or diagonal */
        dx = sgn(ax - bx) , dy = sgn(ay - by);
        do {
            /* <bx,by> is guaranteed to eventually converge with <ax,ay> */
            bx += dx , by += dy;
            if (blocking_terrain(bx, by)) {
                return (0);
            }
            if ((fnc)(bx, by)) {
                return (1);
            }
        } while (bx != ax || by != ay);
    }
    return (0);
}
/* 0=block, 1=ignore, 2=conditionally block */
export function linedup(ax, ay, bx, by, boulderhandling) {
    let dx = 0;
    let dy = 0;
    let boulderspots = 0;
    game.tbx = ax - bx;
    game.tby = ay - by;
    if (!game.tbx && !game.tby) {
        return (0);
    }
    if ((!game.tbx || !game.tby || abs(game.tbx) == abs(game.tby)) && distmin(game.tbx, game.tby, 0, 0) < 8) {
        if (((ax) == game.u.ux && (ay) == game.u.uy) ? ((game.viz_array[by][bx] & 1) != 0) : clear_path(ax, ay, bx, by)) {
            return (1);
        }
        /* don't have line of sight, but might still be lined up
           if that lack of sight is due solely to boulders */
        if (boulderhandling == 0) {
            return (0);
        }
        dx = sgn(ax - bx) , dy = sgn(ay - by);
        boulderspots = 0;
        do {
            bx += dx , by += dy;
            if (blocking_terrain(bx, by)) {
                return (0);
            }
            if (sobj_at(BOULDER, bx, by)) {
                ++boulderspots;
            }
        } while (bx != ax || by != ay);
        /* reached target position without encountering obstacle */
        if (boulderhandling == 1 || rn2(2 + boulderspots) < 2) {
            return (1);
        }
    }
    return (0);
}
export function m_lined_up(mtarg, mtmp) {
    let utarget = (mtarg == game.youmonst);
    let tx = utarget ? mtmp.mux : mtarg.mx;
    let ty = utarget ? mtmp.muy : mtarg.my;
    let ignore_boulders = utarget && ((((mtmp.data).mflags2 & 134217728) != 0) || m_carrying(mtmp, WAN_STRIKING));
    /* hero concealment usually trumps monst awareness of being lined up */
    if (utarget && (game.u.umonnum != game.u.umonster) && rn2(25) && (game.u.uundetected || ((game.youmonst.m_ap_type & 7) != M_AP_NOTHING && (game.youmonst.m_ap_type & 7) != M_AP_MONSTER))) {
        return (0);
    }
    /* [no callers care about the 1 vs 2 situation any more] */
    return linedup(tx, ty, mtmp.mx, mtmp.my, utarget ? (ignore_boulders ? 1 : 2) : 0);
}
/* is mtmp in position to use ranged attack on hero? */
export function lined_up(mtmp) {
    return m_lined_up(game.youmonst, mtmp) ? (1) : (0);
}
/* check if a monster is carrying an item of a particular type */
export function m_carrying(mtmp, type) {
    let otmp = null;
    for (otmp = (mtmp == game.youmonst) ? game.invent : mtmp.minvent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == type) {
            break;
        }
    }
    return otmp;
}
/* *objp will be set to NULL if object breaks */
/* hero's (when wielded) or missile's spot */
/* adjacent spot where bars are located */
/* breakage control */
let __hit_bars_se = [se_zero_invalid, se_bars_whang, se_bars_whap, se_bars_flapp, se_bars_clink, se_bars_clonk];
__nh_register_static(() => { __hit_bars_se = [se_zero_invalid, se_bars_whang, se_bars_whap, se_bars_flapp, se_bars_clink, se_bars_clonk]; });
const __hit_bars_barsounds = ["", "Whang", "Whap", "Flapp", "Clink", "Clonk"];
export async function hit_bars(objp, objx, objy, barsx, barsy, breakflags) {
    let otmp = objp.value;
    let obj_type = otmp.otyp;
    let nodissolve = (game.level.locations[barsx][barsy].flags & 8) != 0;
    let your_fault = (breakflags & 1) != 0;
    let melee_attk = (breakflags & 16) != 0;
    let noise = 0;
    if (your_fault ? await hero_breaks(otmp, objx, objy, breakflags) : await breaks(otmp, objx, objy)) {
        objp.value = null;
        if (obj_type == POT_ACID) {
            if (((game.viz_array[barsy][barsx] & 2) != 0) && !nodissolve) {
                await pline_The("iron bars are dissolved!");
            } else {
                ;
                await You_hear((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "angry snakes!" : "a hissing noise.");
            }
            if (!nodissolve) {
                await dissolve_bars(barsx, barsy);
            }
        }
    } else {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            let bsindx = (obj_type == BOULDER || obj_type == HEAVY_IRON_BALL) ? 1 : harmless_missile(otmp) ? 2 : (game.objects[(otmp).otyp].oc_material <= LEATHER || (otmp).otyp == RUBBER_HOSE) ? 3 : (otmp.oclass == COIN_CLASS || game.objects[obj_type].oc_material == GOLD || game.objects[obj_type].oc_material == SILVER) ? 4 : (Math.trunc(6 /* sizeof(const char *const [6]) */ / 1 /* sizeof(const char *const) */)) - 1;
            ;
            await pline("%s!", __hit_bars_barsounds[bsindx]);
            ((__hit_bars_se[bsindx]));
        }
        if (!(harmless_missile(otmp) || (game.objects[(otmp).otyp].oc_material <= LEATHER || (otmp).otyp == RUBBER_HOSE))) {
            noise = 4 * 4;
        }
        if (your_fault && (otmp.otyp == WAR_HAMMER || otmp.otyp == HEAVY_IRON_BALL)) {
            /* iron ball isn't a weapon or wep-tool so doesn't use obj->spe;
               weight is normally 480 but can be increased by increments
               of 160 (scrolls of punishment read while already punished) */
            let spe = ((otmp.otyp == HEAVY_IRON_BALL) ? (Math.trunc(otmp.owt / WT_IRON_BALL_INCR)) : otmp.spe);
            /* chance: used in saving throw for the bars; more likely to
               break those when 'chance' is _lower_; acurrstr(): 3..25 */
            let chance = (melee_attk ? 40 : 60) - acurrstr() - spe;
            if (!rn2(((2) > (chance) ? (2) : (chance)))) {
                await You("break the bars apart!");
                await dissolve_bars(barsx, barsy);
                noise = noise * 2;
            }
        }
        if (noise) {
            await wake_nearto(barsx, barsy, noise);
        }
    }
}
/* TRUE iff thrown/kicked/rolled object doesn't pass through iron bars */
/* *obj_p will be set to NULL if object breaks */
/* caller can force a hit for items which would
                           * fit through */
/* 1==hero, 0=other, -1==just check whether it
                           * will pass through */
export async function hits_bars(obj_p, x, y, barsx, barsy, always_hit, whodidit) {
    let otmp = obj_p;
    let obj_type = otmp.otyp;
    let hits = always_hit;
    if (!hits) {
        switch (otmp.oclass) {
            case WEAPON_CLASS:
{
                    let oskill = game.objects[obj_type].oc_subtyp;
                    hits = (oskill != -P_BOW && oskill != -P_CROSSBOW && oskill != -P_DART && oskill != -P_SHURIKEN && oskill != P_SPEAR && oskill != P_KNIFE);
                    break;
                }
            case ARMOR_CLASS:
                hits = (game.objects[obj_type].oc_subtyp != ARM_GLOVES);
                break;
            case TOOL_CLASS:
                hits = (obj_type != SKELETON_KEY && obj_type != LOCK_PICK && obj_type != CREDIT_CARD && obj_type != TALLOW_CANDLE && obj_type != WAX_CANDLE && obj_type != LENSES && obj_type != TIN_WHISTLE && obj_type != MAGIC_WHISTLE);
                break;
            case ROCK_CLASS:
                if (obj_type != STATUE || game.mons[otmp.corpsenm].msize > 0) {
                    hits = (1);
                }
                break;
            case FOOD_CLASS:
                if (obj_type == CORPSE && game.mons[otmp.corpsenm].msize > 0) {
                    hits = (1);
                } else {
                    hits = (obj_type == MEAT_STICK || obj_type == ENORMOUS_MEATBALL);
                }
                break;
            case SPBOOK_CLASS:
            case WAND_CLASS:
            case BALL_CLASS:
            case CHAIN_CLASS:
                hits = (1);
                break;
            default:
                break;
        }
    }
    if (hits && whodidit != -1) {
        await hit_bars(obj_p, x, y, barsx, barsy, (whodidit == 1) ? 1 : 0);
    }
    return hits;
}
/*mthrowu.c*/
/* [modifiable buffer for upstart()] */
/* use 'named' as an approximation for "hitting from above";
               we avoid "passes through you" for horizontal flight path
               because missile stops and that wording would suggest that
               it should keep going */
/* an explosion which scatters objects might hit hero with one
               (potions deliberately thrown at hero are handled by m_throw) */
/* extra damage already applied by dmgval() */
/* fake players treated as skilled (regardless of role limits) */
/* cancel pending shots (perhaps ought to give a message here
               since we gave one above about throwing/shooting N missiles) */
/* Last position; object drops */
/* probably thrown by a monster rather than 'other', but the
           distinction only matters when hitting the hero */
/* can't use this because we don't have the attacker */
/* note: extra silver damage is handled by dmgval() */
/* don't blame hero for unknown rolling boulder trap */
/* blinding venom and cream pie do 0 damage, but verify
           that the target is still alive anyway */
/* shorten object name to reduce redundancy in the
                   two message [first via hit() above] sequence:
                   "The {splash of venom,cream pie} hits <mon>."
                   "<Mon> is blinded by the {venom,pie}." */
/* free it for motion again */
/* won't catch rock or gray stone; catch (then drop) worthless glass */
/*
         * Remove object from minvent.  This cannot be done later on;
         * what if the player dies before then, leaving the monster
         * with 0 daggers?  (This caused the infamous 2^32-1 orcish
         * dagger bug).
         *
         * VENOM is not in minvent--it should already be OBJ_FREE.
         * The extract below does nothing.
         */
/* not possibly_unwield(), which checks the object's location,
           not its existence */
/* check validity of new direction */
/* Note: drop_throw may destroy singleobj.  Since obj must be destroyed
     * early to avoid the dagger bug, anyone who modifies this code should
     * be careful not to use either one after it's been freed.
     */
/*
             * Considerations for a tethered object based on throwit()/bhit() :
             * - wall of water/lava will stop items, and triggers return.
             * - iron bars will stop items, and triggers return.
             * - pass harmlessly through shades.
             * X stops forward motion at hit monster/hero, triggers return.
             * - closed door will stop item's forward motion, triggers return.
             * - sinks stop forward motion, triggers fall, then return.
             * - object can get tangled in a web, no return (tether snaps?).
             * On return:
             * X rn2(100) chance of returning to thrower's location.
             * X if impaired and rn2(100) == 0,
             *      -50/50 chance of landing on the ground.
             *      -50/50 chance of hitting the thrower and causing
             *       rnd(3) damage.
             *
             */
/* hero might be poly'd into a unicorn */
/* mon could be DEADMONSTER now */
/* it made it back to thrower's location */
/* FIXME: this should be moved to struct g (gd these days) */
/* it didn't make it back to thrower's location */
/* Some sound effects when item lands in water or lava */
/* mon_wield_item resets weapon_check as appropriate */
/* multishot shooting or throwing */
/* Out of range, or intervening wall */
/* breakage makes its own noises */
