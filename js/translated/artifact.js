/* NetHack 5.0	artifact.c	$NHDT-Date: 1715889721 2024/05/16 20:02:01 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.236 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2013. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * Note:  both artilist[] and artiexist[] have a dummy element #0,
 *        so loops over them should normally start at #1.  The primary
 *        exception is the save & restore code, which doesn't care about
 *        the contents, just the total size.
 */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { free, memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { getrumor } from '../c2js-runtime/rumors.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, strcat, strcmp, strcpy, strncmpi } from '../c2js-runtime/string.js';
import { do_blinding_ray, next_to_u } from './apply.js';
import { exercise } from './attrib.js';
import { getdir, isok } from './cmd.js';
import { clr2colorname } from './coloratt.js';
import { c_color_names, c_common_strings, cg } from './decl.js';
import { use_crystal_ball } from './detect.js';
import { canseemon, glyph_at, map_invisible, newsym, nul_glyphinfo, see_monsters, sensemon, shieldeff } from './display.js';
import { dropx, goto_level, maybe_lvltport_feedback } from './do.js';
import { Monnam, hcolor, mon_nam, oname } from './do_name.js';
import { hitfloor, throwit } from './dothrow.js';
import { In_hell, In_quest, depth, dunlevs_in_dungeon, find_hell, ledger_no, surface } from './dungeon.js';
import { losexp } from './exper.js';
import { invocation_pos, losehp, nomul, spoteffects } from './hack.js';
import { fuzzymatch, s_suffix, upstart } from './hacklib.js';
import { align_str, enlightenment } from './insight.js';
import { freeinv, getobj, hold_another_object, nxtobj, update_inventory } from './invent.js';
import { monhp_per_lvl } from './makemon.js';
import { bcsign, mksobj, obj_extract_self, uncurse, weight } from './mkobj.js';
import { healmon, migrate_mon, set_ustuck, wake_nearto } from './mon.js';
import { Resists_Elem, attacktype, defended, hates_silver, resists_drli, sticks } from './mondata.js';
import { monflee } from './monmove.js';
import { ACID_VENOM, AFTER_LAST_ARTIFACT, ALTAR, ANTIMAGIC, ARROW, ART_EXCALIBUR, ART_GRIMTOOTH, ART_MASTER_KEY_OF_THIEVERY, ART_NONARTIFACT, ART_ORCRIST, ART_STING, ART_STORMBRINGER, ART_SUNSWORD, ART_TSURUGI_OF_MURAMASA, ART_VORPAL_BLADE, A_CON, A_WIS, BAG_OF_TRICKS, BANISH, BELL_OF_OPENING, BLACK_DRAGON_SCALES, BLINDED, BLINDING_RAY, BLINDING_VENOM, BLND_RES, BLUE_DRAGON_SCALES, CHARGE_OBJ, COLD_RES, CONFLICT, CONFUSION, CREATE_AMMO, CREATE_PORTAL, CRYSTAL_BALL, DISINT_RES, DISMOUNT_THROWN, DOOR, DRAIN_RES, ENERGY_BOOST, ENERGY_REGENERATION, ENLIGHTENING, FAKE_AMULET_OF_YENDOR, FIRESTORM, FIRE_RES, FLING_POISON, GETOBJ_EXCLUDE, GETOBJ_SUGGEST, GLYPH_CMAP_B_OFF, GOLD_DRAGON_SCALES, GOLD_DRAGON_SCALE_MAIL, GRAY_DRAGON_SCALES, GRAY_DRAGON_SCALE_MAIL, GREEN_DRAGON_SCALES, HALF_PHDAM, HALF_SPDAM, HALLUC, HALLUC_RES, HEALING, INVIS, LARGE_BOX, LAST_PROP, LEASH, LEVITATION, LEV_TELE, LOW_PM, LUCKSTONE, MS_NEMESIS, NECK, NON_PM, NROFARTIFACTS, NUMMONS, NUM_OBJECTS, ORANGE_DRAGON_SCALES, PM_ARCHEOLOGIST, PM_CLAY_GOLEM, PM_GREMLIN, PM_JABBERWOCK, PM_KNIGHT, PM_MANES, PM_ROGUE, PM_WATER_ELEMENTAL, PM_WIZARD, POISON_RES, PROTECTION, P_BASIC, P_EXPERT, P_SKILLED, RED_DRAGON_SCALES, REFLECTING, REGENERATION, RING_CLASS, RIN_INCREASE_DAMAGE, SCR_TAMING, SEARCHING, SHOCK_RES, SICK, SILVER, SLIMED, SNOWSTORM, SPE_CONE_OF_COLD, SPE_FIREBALL, STEALTH, STONE_RES, STUNNED, S_GHOST, S_GOLEM, S_IMP, S_VORTEX, S_arrow_trap, S_grave, TAMING, TELEPAT, TELEPORT_CONTROL, TOOL_CLASS, TRAPNUM, UNTRAP, WAND_CLASS, WARNING, WARN_OF_MON, WEAPON_CLASS, WHITE_DRAGON_SCALES, YELLOW_DRAGON_SCALES, YELLOW_DRAGON_SCALE_MAIL } from './nh-constants.js';
import { obj_shuffle_range, observe_object } from './o_init.js';
import { The, Tobjnam, aobjnam, bare_artifactname, distant_name, killer_xname, otense, simple_typename, the, vtense, xname, yname } from './objnam.js';
import { livelog_printf } from './pline.js';
import { body_part, mbodypart } from './polyself.js';
import { healup, make_blinded, make_confused, make_hallucinated, make_sick, make_slimed, make_stunned } from './potion.js';
import { mon_aligntyp } from './priest.js';
import { charge_ok, litroom, recharge, seffects } from './read.js';
import { d, rn2, rnd, rnz } from './rnd.js';
import { aligns } from './role.js';
import { sfi_arti_info, sfi_short, sfo_arti_info, sfo_xint16 } from './sfbase.js';
import { inside_shop, obfree } from './shk.js';
import { spell_skilltype, spelleffects } from './spell.js';
import { On_stairs } from './stairs.js';
import { remove_worn_item } from './steal.js';
import { dismount_steed } from './steed.js';
import { level_tele, u_teleport_mon } from './teleport.js';
import { burn_away_slime } from './timeout.js';
import { float_down, float_up, ignite_items, selftouch, t_at, untrap } from './trap.js';
import { add_menu, select_menu } from './windows.js';
import { bypass_obj, clear_bypasses, nxt_unbypassed_obj, recalc_telepat_range, which_armor } from './worn.js';
import { cancel_monst, destroy_items, flashburn, lightdamage, probe_monster, resist } from './zap.js';

const artilist = (() => {
  const ent = () => ({ name: "", otyp: 0, spfx: 0, cspfx: 0, defn: 0,
    attk: { aatyp: 0, adtyp: 0, damn: 0, damd: 0 },
    defense: { aatyp: 0, adtyp: 0, damn: 0, damd: 0 },
    carry: { aatyp: 0, adtyp: 0, damn: 0, damd: 0 },
    inv_prop: 0, alignment: 0, role: 0, race: 0,
    acost: 0, gift_value: 0, cost: 0, color: 0, aflags: 0 });
  const arr = []; for (let i = 0; i < 34; i++) arr.push(ent()); return arr;
})();

/* #define get_artifact(o) \
    (((o) && ((o)->artifact > 0 && (o)->artifact < AFTER_LAST_ARTIFACT)) \
                             ? &artilist[(int) (o)->oartifact] \
                             : &artilist[ART_NONARTIFACT]) */
/* The amount added to the victim's total hit points to insure that the
   victim will be killed even after damage bonus/penalty adjustments.
   Most such penalties are small, and 200 is plenty; the exception is
   half physical damage.  3.3.1 and previous versions tried to use a very
   large number to account for this case; now, we just compute the fatal
   damage by adding it to 2 times the total hit points instead of 1 time.
   Note: this will still break if they have more than about half the number
   of hit points that will fit in a 15 bit integer. */
/* SFCTOOL */
/* arti_info struct definition moved to artifact.h */
/* array of flags tracking which artifacts exist, indexed by ART_xx;
   ART_xx values are 1..N, element [0] isn't used; no terminator needed */
game.artiexist = [{ exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }, { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 }];
/* discovery list; for N discovered artifacts, the first N entries are ART_xx
   values in discovery order, the remaining (NROFARTIFACTS-N) slots are 0 */
game.artidisco = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
/* note: artiexist[] and artidisco[] don't need to be in struct ga; they
 * get explicitly initialized at game start so don't need to be part of
 * bulk re-init if game restart ever gets implemented.  They are saved
 * and restored but that is done through this file so they can be local.
 */
const zero_artiexist = { exists: 0, found: 0, gift: 0, wish: 0, named: 0, viadip: 0, lvldef: 0, bones: 0, rndm: 0 };
/* all bits zero */
/* handle some special cases; must be called after u_init() */
export function hack_artifacts() {
    let art = null;
    let alignmnt = aligns[game.flags.initalign].value;
    /* Fix up the alignments of "gift" artifacts */
    for (let __nhi_art = 1; (art = artilist[__nhi_art]) && (art.otyp); __nhi_art++) {
        if (art.role == (game.urole.mnum) && art.alignment != (-128)) {
            art.alignment = alignmnt;
        }
    }
    /* Excalibur can be used by any lawful character, not just knights */
    if (!(game.urole.mnum == (PM_KNIGHT))) {
        artilist[ART_EXCALIBUR].role = NON_PM;
    }
    if (game.urole.questarti) {
        /* Fix up the quest artifact */
        artilist[game.urole.questarti].alignment = alignmnt;
        artilist[game.urole.questarti].role = (game.urole.mnum);
    }
    return;
}
/* zero out the artifact existence list */
export function init_artifacts() {
    memset(game.artiexist, 0, 34 /* sizeof(struct arti_info [34]) */);
    memset(game.artidisco, 0, 33 /* sizeof(xint16 [33]) */);
    /* redo non-saved special cases */
    hack_artifacts();
}
export function save_artifacts(nhfp) {
    let i = 0;
    for (i = 0; i < (NROFARTIFACTS + 1); ++i) {
        sfo_arti_info(nhfp, game.artiexist[i], "artiexist");
    }
    for (i = 0; i < NROFARTIFACTS; ++i) {
        sfo_xint16(nhfp, { get value() { return game.artidisco[i]; }, set value(_v) { game.artidisco[i] = _v; } }, "artidisco");
    }
}
/* SFCTOOL */
export function restore_artifacts(nhfp) {
    let i = 0;
    for (i = 0; i < (NROFARTIFACTS + 1); ++i) {
        sfi_arti_info(nhfp, game.artiexist[i], "artiexist");
    }
    for (i = 0; i < NROFARTIFACTS; ++i) {
        sfi_short(nhfp, { get value() { return game.artidisco[i]; }, set value(_v) { game.artidisco[i] = _v; } }, "artidisco");
    }
    hack_artifacts();
}
export function artiname(artinum) {
    if (artinum <= 0 || artinum > NROFARTIFACTS) {
        return "";
    }
    return artilist[artinum].name;
}
/*
   Make an artifact.  If a specific alignment is specified, then an object of
   the appropriate alignment is created from scratch, or 0 is returned if
   none is available.  (If at least one aligned artifact has already been
   given, then unaligned ones also become eligible for this.)
   If no alignment is given, then 'otmp' is converted
   into an artifact of matching type, or returned as-is if that's not
   possible.
   For the 2nd case, caller should use ``obj = mk_artifact(obj, A_NONE, 99);''
   For the 1st, ``obj = mk_artifact((struct obj *) 0, some_alignment, ...);''.
   The max_giftvalue is the value of the sacrifice, for an artifact obtained
   by sacrificing, or 99 otherwise.
 */
/* existing object; ignored and disposed of
                          * if alignment specified */
/* target alignment, or A_NONE */
/* cap on generated giftvalue */
/* whether to add spe to situational artifacts */
export function mk_artifact(otmp, alignment, max_giftvalue, adjust_spe) {
    let a = null;
    let m = 0;
    let n = 0;
    let altn = 0;
    let by_align = (alignment != (-128));
    let o_typ = (by_align || !otmp) ? 0 : otmp.otyp;
    let unique = !by_align && otmp && game.objects[o_typ].oc_unique;
    let eligible = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let skill_compatibility = 0;
    n = altn = 0;
    eligible[0] = 0;
    for (m = 1; m < artilist.length && (a = artilist[m]).otyp; m++) {
        /* gather eligible artifacts */
        if (game.artiexist[m].exists) {
            /* move on to next possibility */
            continue;
        }
        if ((a.spfx & 1) || unique) {
            continue;
        }
        if (a.gift_value > max_giftvalue && !(game.urole.mnum == (a.role))) {
            continue;
        }
        if (!by_align) {
            /* looking for a particular type of item; not producing a
               divine gift so we don't care about role's first choice */
            if (a.otyp == o_typ) {
                /* found something to consider for random selection */
                /* right alignment, or non-aligned with at least 1
                   previous gift bestowed, makes this one viable;
                   unaligned artifacts are possible even as the first
                   gift, but less likely; if it's a bad weapon type
                   for the role that also makes it less likely */
                eligible[n++] = m;
            }
            continue;
        }
        if ((a.alignment == alignment || a.alignment == (-128)) && (a.race == NON_PM || !(((game.mons[a.race]).mflags2 & game.urace.hatemask) != 0))) {
            if ((game.urole.mnum == (a.role))) {
                /* we're looking for an alignment-specific item
           suitable for hero's role+race */
                /* avoid enemies' equipment */
                /* when a role-specific first choice is available, use it */
                /* make this be the only possibility in the list */
                eligible[0] = m;
                n = 1;
                /* skip all other candidates */
                break;
            }
            /* check if this is skill-compatible */
            skill_compatibility = P_SKILLED;
            if (game.objects[a.otyp].oc_class == WEAPON_CLASS) {
                let skill = game.objects[a.otyp].oc_subtyp;
                if (skill < 0) {
                    skill_compatibility = (game.u.weapon_skills[-skill].max_skill);
                } else {
                    skill_compatibility = (game.u.weapon_skills[skill].max_skill);
                }
            }
            if ((a.alignment != (-128) || game.u.ugifts > 0 || !rn2(3)) && (!rn2(4) || skill_compatibility >= P_SKILLED || (skill_compatibility >= P_BASIC && rn2(2)))) {
                eligible[n++] = m;
            } else {
                /* if no candidates have been found yet, record
                   this one as a[nother] fallback possibility in
                   case all aligned candidates have been used up
                   (via wishing, naming, bones, random generation)
                   or failed the randomized compatibility checks */
                /* [once a regular candidate is found, the list
                   is overwritten and `altn' becomes irrelevant] */
                if (!n) {
                    eligible[altn++] = m;
                }
            }
        }
    }
    /* resort to fallback list if main list was empty */
    if (!n) {
        n = altn;
    }
    if (n) {
        /* found at least one candidate; pick one at random */
        m = eligible[rn2(n)];
        a = artilist[m];
        if (by_align) {
            /* make an appropriate object if necessary, then christen it */
            /* 'by_align' indicates that an alignment was passed as
             * an argument, but also that the 'otmp' argument is not
             * relevant */
            let artiobj = mksobj(a.otyp, (1), (0));
            /* nonnull value of 'otmp' is unexpected. Cope. */
            /* just in case; avoid orphaning */
            if (otmp) {
                /* nothing appropriate could be found; return original object */
                /* (there shouldn't have been an original object). Deal with it.
             * The callers that passed an alignment and a NULL otmp are
             * prepared to get a potential NULL return value, so this is okay */
                dispose_of_orig_obj(otmp);
            }
            otmp = artiobj;
        }
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        /*
         * otmp should be nonnull at this point:
         * either the passed argument (if !by_align == A_NONE), or
         * the result of mksobj() just above if by_align is an alignment. */
        /* prevent erosion from generating */
        otmp.oeroded = otmp.oeroded2 = 0;
        otmp = oname(otmp, a.name, 0);
        /* probably already set by this point, but */
        otmp.oartifact = m;
        /* set existence and reason for creation bits */
        artifact_origin(otmp, 128);
        if (adjust_spe) {
            let new_spe = 0;
            /* Adjust artiobj->spe by a->gen_spe. (This is a no-op for
               non-weapons, which always have a gen_spe of 0, and for many
               weapons, too.) The result is clamped into the "normal" range to
               prevent an outside chance of +12 artifacts generating. */
            new_spe = otmp.spe + a.gen_spe;
            if (new_spe >= -10 && new_spe < 10) {
                otmp.spe = new_spe;
            }
        }
    } else {
        if (by_align && otmp) {
            dispose_of_orig_obj(otmp);
            otmp = null;
        }
    }
    if (otmp && permapoisoned(otmp)) {
        otmp.otrapped = 1;
    }
    return otmp;
}
export function dispose_of_orig_obj(obj) {
    if (!obj) {
        return;
    }
    obj_extract_self(obj);
    obfree(obj, null);
}
/*
 * Returns the full name (with articles and correct capitalization) of an
 * artifact named "name" if one exists, or NULL, it not.
 * The given name must be rather close to the real name for it to match.
 * The object type of the artifact is returned in otyp if the return value
 * is non-NULL.
 */
/* string from player that might be an artifact name */
/* secondary output */
/* whether to allow extra or omitted spaces or dashes */
export function artifact_name(name, otyp_p, fuzzy) {
    let a = null;
    let aname = null;
    if (!strncmpi(name, "the ", 4)) {
        name = __nh_advance_str(name, 4);
    }
    for (let __nhi_a = 1; (a = artilist[__nhi_a]) && (a.otyp); __nhi_a++) {
        aname = a.name;
        if (!strncmpi(aname, "the ", 4)) {
            aname = __nh_advance_str(aname, 4);
        }
        if (!fuzzy ? !strncmpi((name), (aname), -1) : fuzzymatch(name, aname, " -", (1))) {
            if (otyp_p) {
                otyp_p.value = a.otyp;
            }
            return a.name;
        }
    }
    return null;
}
export function exist_artifact(otyp, name) {
    let a = null;
    let arex = null;
    if (otyp && __nh_char_at0(name)) {
        for (let __nhi_a = 1; (arex = game.artiexist[__nhi_a], a = artilist[__nhi_a]) && (a.otyp); __nhi_a++) {
            if (a.otyp == otyp && !strcmp(a.name, name)) {
                return arex.exists ? (1) : (0);
            }
        }
    }
    /* [if there was anything with special bonus against noncorporeals,
       it would be effective too] */
    /* otherwise, harmless to shades */
    return (0);
}
/* an artifact has just been created or is being "un-created" for a chance
   to be created again later */
/* True: exists, False: being un-created */
/* ONAME_xyz flags; not relevant if !mod */
export function artifact_exists(otmp, name, mod, flgs) {
    let a = null;
    if (otmp && __nh_char_at0(name)) {
        for (let __nhi_a = 1; (a = artilist[__nhi_a]) && (a.otyp); __nhi_a++) {
            if (a.otyp == otmp.otyp && !strcmp(a.name, name)) {
                let m = (artilist.indexOf(a));
                otmp.oartifact = (mod ? m : 0);
                otmp.age = 0;
                if (otmp.otyp == RIN_INCREASE_DAMAGE) {
                    otmp.spe = 0;
                }
                if (mod) {
                    /* means being created rather than un-created */
                    /* one--and only one--of these should always be set */
                    if ((flgs & (2 | 4 | 8 | 16 | 32 | 64 | 128)) == 0) {
                        flgs |= 128;
                    }
                    /* 'exists' bit will become set (in artifact_origin();
                       there's no ONAME_ flag) and flgs might also contain
                       the know_arti bit (hero knows that artifact exists) */
                    artifact_origin(otmp, flgs);
                } else {
                    Object.assign(game.artiexist[m], zero_artiexist);
                }
                break;
            }
        }
    }
    return;
}
/* mark an artifact as 'found' */
export function found_artifact(a) {
    if (a < 1 || a > NROFARTIFACTS) {
        impossible("found_artifact: invalid artifact index! (%d)", a);
    } else if (!game.artiexist[a].exists) {
        impossible("found_artifact: artifact doesn't exist yet? (%d)", a);
    } else {
        game.artiexist[a].found = 1;
    }
}
/* if an artifact hasn't already been designated 'found', do that now
   and generate a livelog event about finding it */
export function find_artifact(otmp) {
    let a = otmp.oartifact;
    if (a && !game.artiexist[a].found) {
        let where = null;
        found_artifact(a);
        /*
         * Unlike costly_spot(), inside_shop() includes the "free spot"
         * in front of the door.  And it doesn't care whether or not
         * there is a shopkeeper present.
         *
         * If hero sees a monster pick up a not-yet-found artifact, it
         * will have its dknown flag set even if far away and will be
         * described as 'found on the floor'.  Similarly for dropping
         * (possibly upon monster's death), dknown will be set and the
         * artifact will be described as 'carried by a monster'.
         * That's handled by caller:  dog_invent(), mpickstuff(), or
         * mdrop_obj() so that we get called before obj->where changes.
         */
        where = ((otmp.where == 1) ? ((inside_shop(otmp.ox, otmp.oy) != 0) ? " in a shop" : " on the floor") : (otmp.where == 2) ? " in a container" : (otmp.where == 4) ? " carried by a monster" : "");
        livelog_printf(64, "found %s%s", bare_artifactname(otmp), where);
    }
}
export function nartifact_exist() {
    let i = 0;
    let a = 0;
    for (i = 1; i <= NROFARTIFACTS; ++i) {
        if (game.artiexist[i].exists) {
            ++a;
        }
    }
    return a;
}
/* set artifact tracking flags;
   calling sequence: oname() -> artifact_exists() -> artifact_origin() or
   mksobj(),others -> mk_artifact() -> artifact_origin(random) possibly
   followed by mksobj(),others -> artifact_origin(non-random origin) */
/* new artifact */
/* ONAME_xxx flags, shared by artifact_exists() */
export function artifact_origin(arti, aflags) {
    let ct = 0;
    let a = arti.oartifact;
    if (a) {
        /* start by clearing all bits; most are mutually exclusive */
        Object.assign(game.artiexist[a], zero_artiexist);
        /* set 'exists' bit back on; not specified via flag bit in aflags */
        game.artiexist[a].exists = 1;
        /* 'hero knows it exists' is expected for wish, gift, viadip, or
           named and could eventually become set for any of the others */
        if ((aflags & 256) != 0) {
            game.artiexist[a].found = 1;
        }
        /* should be exactly one of wish, gift, via_dip, via_naming,
           level_def (quest), bones, and random (floor or monst's minvent) */
        ct = 0;
        if ((aflags & 4) != 0) {
            game.artiexist[a].wish = 1 , ++ct;
        }
        if ((aflags & 8) != 0) {
            game.artiexist[a].gift = 1 , ++ct;
        }
        if ((aflags & 16) != 0) {
            game.artiexist[a].viadip = 1 , ++ct;
        }
        if ((aflags & 2) != 0) {
            game.artiexist[a].named = 1 , ++ct;
        }
        if ((aflags & 32) != 0) {
            game.artiexist[a].lvldef = 1 , ++ct;
        }
        if ((aflags & 64) != 0) {
            game.artiexist[a].bones = 1 , ++ct;
        }
        if ((aflags & 128) != 0) {
            game.artiexist[a].rndm = 1 , ++ct;
        }
        if (ct != 1) {
            impossible("invalid artifact origin: %4o", aflags);
        }
    }
}
export function spec_ability(otmp, abil) {
    let arti = get_artifact(otmp);
    return (arti != artilist[ART_NONARTIFACT] && (arti.spfx & abil) != 0);
}
/* used so that callers don't need to known about SPFX_ codes */
export function confers_luck(obj) {
    /* might as well check for this too */
    if (obj.otyp == LUCKSTONE) {
        return (1);
    }
    return (obj.oartifact && spec_ability(obj, 524288));
}
/* used to check whether a monster is getting reflection from an artifact */
export function arti_reflects(obj) {
    let arti = get_artifact(obj);
    if (arti != artilist[ART_NONARTIFACT]) {
        if ((obj.owornmask & ~4096) && (arti.spfx & 67108864)) {
            return (1);
        }
        if (arti.cspfx & 67108864) {
            return (1);
        }
    }
    return (0);
}
/* decide whether this obj is effective when attacking against shades;
   does not consider the bonus for blessed objects versus undead */
export function shade_glare(obj) {
    let arti = null;
    /* any silver object is effective */
    if (game.objects[obj.otyp].oc_material == SILVER) {
        return (1);
    }
    /* non-silver artifacts with bonus against undead also are effective */
    arti = get_artifact(obj);
    if (arti != artilist[ART_NONARTIFACT] && (arti.spfx & 8388608) && arti.mtype == 2) {
        return (1);
    }
    return (0);
}
/* returns 1 if name is restricted for otmp->otyp */
export function restrict_name(otmp, name) {
    let a = null;
    let aname = null;
    let odesc = null;
    let other = null;
    let sametype = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    let lo = 0;
    let hi = 0;
    let otyp = otmp.otyp;
    let ocls = game.objects[otyp].oc_class;
    if (!__nh_char_at0(name)) {
        /* since damage bonus didn't apply, nothing more to do;
           no further attacks have side-effects on inventory */
        return (0);
    }
    if (!strncmpi(name, "the ", 4)) {
        name = __nh_advance_str(name, 4);
    }
    /* decide what types of objects are the same as otyp;
       if it's been discovered, then only itself matches;
       otherwise, include all other undiscovered objects
       of the same class which have the same description
       or share the same pool of shuffled descriptions */
    memset(sametype, 0, 481 /* sizeof(boolean [481]) */);
    sametype[otyp] = (1);
    if (!game.objects[otyp].oc_name_known && (odesc = (game.obj_descr[(game.objects[otyp]).oc_descr_idx].oc_descr)) != null) {
        obj_shuffle_range(otyp, { get value() { return lo; }, set value(_v) { lo = _v; } }, { get value() { return hi; }, set value(_v) { hi = _v; } });
        for (i = game.bases[ocls]; i < NUM_OBJECTS; i++) {
            if (game.objects[i].oc_class != ocls) {
                break;
            }
            if (!game.objects[i].oc_name_known && (other = (game.obj_descr[(game.objects[i]).oc_descr_idx].oc_descr)) != null && (!strcmp(odesc, other) || (i >= lo && i <= hi))) {
                sametype[i] = (1);
            }
        }
    }
    for (let __nhi_a = 1; (a = artilist[__nhi_a]) && (a.otyp); __nhi_a++) {
        /* Since almost every artifact is SPFX_RESTR, it doesn't cost
       us much to do the string comparison before the spfx check.
       Bug fix:  don't name multiple elven daggers "Sting".
     */
        if (!sametype[a.otyp]) {
            continue;
        }
        aname = a.name;
        if (!strncmpi(aname, "the ", 4)) {
            aname = __nh_advance_str(aname, 4);
        }
        if (!strcmp(aname, name)) {
            return ((a.spfx & (1 | 2)) != 0 || otmp.quan > 1);
        }
    }
    return (0);
}
export function attacks(adtyp, otmp) {
    let weap = null;
    if ((weap = get_artifact(otmp)) != artilist[ART_NONARTIFACT]) {
        return (weap.attk.adtyp == adtyp);
    }
    return (0);
}
export function defends(adtyp, otmp) {
    let weap = null;
    if (!otmp) {
        return (0);
    }
    if ((weap = get_artifact(otmp)) != artilist[ART_NONARTIFACT]) {
        return (weap.defn.adtyp == adtyp);
    }
    if ((((otmp).otyp >= GRAY_DRAGON_SCALES && (otmp).otyp <= YELLOW_DRAGON_SCALES) || ((otmp).otyp >= GRAY_DRAGON_SCALE_MAIL && (otmp).otyp <= YELLOW_DRAGON_SCALE_MAIL))) {
        let otyp = otmp.otyp;
        /* convert mail to scales to simplify testing */
        if (((otmp).otyp >= GRAY_DRAGON_SCALE_MAIL && (otmp).otyp <= YELLOW_DRAGON_SCALE_MAIL)) {
            otyp += GRAY_DRAGON_SCALES - GRAY_DRAGON_SCALE_MAIL;
        }
        switch (adtyp) {
            /* magic missiles => general magic resistance */
            case 1:
                return (otyp == GRAY_DRAGON_SCALES);
            /* confers hallucination resistance */
            case 36:
                return (otyp == GOLD_DRAGON_SCALES);
            case 2:
                return (otyp == RED_DRAGON_SCALES);
            case 3:
                return (otyp == WHITE_DRAGON_SCALES);
            /* drain strength => poison */
            case 7:
            case 33:
                return (otyp == GREEN_DRAGON_SCALES);
            case 4:
            case 14:
                return (otyp == ORANGE_DRAGON_SCALES);
            case 5:
            case 15:
                return (otyp == BLACK_DRAGON_SCALES);
            /* electricity == lightning */
            case 6:
            case 13:
                return (otyp == BLUE_DRAGON_SCALES);
            case 8:
            case 18:
                return (otyp == YELLOW_DRAGON_SCALES);
            default:
                break;
        }
    }
    return (0);
}
/* used for monsters */
export function defends_when_carried(adtyp, otmp) {
    let weap = null;
    if ((weap = get_artifact(otmp)) != artilist[ART_NONARTIFACT]) {
        return (weap.cary.adtyp == adtyp);
    }
    return (0);
}
/* determine whether an item confers Protection */
export function protects(otmp, being_worn) {
    let arti = null;
    if (being_worn && game.objects[otmp.otyp].oc_oprop == PROTECTION) {
        return (1);
    }
    arti = get_artifact(otmp);
    if (arti == artilist[ART_NONARTIFACT]) {
        return (0);
    }
    return ((arti.cspfx & 134217728) != 0 || (being_worn && (arti.spfx & 134217728) != 0));
}
/*
 * a potential artifact has just been worn/wielded/picked-up or
 * unworn/unwielded/dropped.  Pickup/drop only set/reset the W_ART mask.
 */
export function set_artifact_intrinsic(otmp, on, wp_mask) {
    let mask = null;
    let art = null;
    let oart = get_artifact(otmp);
    let obj = null;
    let dtyp = 0;
    let spfx = 0;
    if (oart == artilist[ART_NONARTIFACT]) {
        return;
    }
    /* effects from the defn field */
    dtyp = (wp_mask != 4096) ? oart.defn.adtyp : oart.cary.adtyp;
    if (dtyp == 2) {
        mask = game.u.uprops[FIRE_RES].extrinsic;
    } else if (dtyp == 3) {
        mask = game.u.uprops[COLD_RES].extrinsic;
    } else if (dtyp == 6) {
        mask = game.u.uprops[SHOCK_RES].extrinsic;
    } else if (dtyp == 1) {
        mask = game.u.uprops[ANTIMAGIC].extrinsic;
    } else if (dtyp == 5) {
        mask = game.u.uprops[DISINT_RES].extrinsic;
    } else if (dtyp == 7) {
        mask = game.u.uprops[POISON_RES].extrinsic;
    } else if (dtyp == 15) {
        mask = game.u.uprops[DRAIN_RES].extrinsic;
    }
    if (mask && wp_mask == 4096 && !on) {
        for (obj = game.invent; obj; obj = obj.nobj) {
            if (obj != otmp && obj.oartifact) {
                /* find out if some other artifact also confers this intrinsic;
           if so, leave the mask alone */
                /* don't change any spfx also conferred by other artifacts */
                art = get_artifact(obj);
                if (art != artilist[ART_NONARTIFACT] && art.cary.adtyp == dtyp) {
                    mask = null;
                    /* count the first one in a pile     */
                    break;
                }
            }
        }
    }
    if (mask) {
        if (on) {
            mask |= wp_mask;
        } else {
            mask &= ~wp_mask;
        }
    }
    /* intrinsics from the spfx field; there could be more than one */
    spfx = (wp_mask != 4096) ? oart.spfx : oart.cspfx;
    if (spfx && wp_mask == 4096 && !on) {
        for (obj = game.invent; obj; obj = obj.nobj) {
            if (obj != otmp && obj.oartifact) {
                art = get_artifact(obj);
                if (art != artilist[ART_NONARTIFACT]) {
                    spfx &= ~art.cspfx;
                }
            }
        }
    }
    if (spfx & 512) {
        if (on) {
            game.u.uprops[SEARCHING].extrinsic |= wp_mask;
        } else {
            game.u.uprops[SEARCHING].extrinsic &= ~wp_mask;
        }
    }
    if (spfx & 2048) {
        /* make_hallucinated must (re)set the mask itself to get
         * the display right */
        /* restoring needed because this is the only artifact intrinsic
         * that can print a message--need to guard against being printed
         * when restoring a game
         */
        make_hallucinated(!on, game.program_state.restoring ? (0) : (1), wp_mask);
    }
    if (spfx & 4096) {
        if (on) {
            game.u.uprops[TELEPAT].extrinsic |= wp_mask;
        } else {
            game.u.uprops[TELEPAT].extrinsic &= ~wp_mask;
        }
        recalc_telepat_range();
        see_monsters();
    }
    if (spfx & 8192) {
        if (on) {
            game.u.uprops[STEALTH].extrinsic |= wp_mask;
        } else {
            game.u.uprops[STEALTH].extrinsic &= ~wp_mask;
        }
    }
    if (spfx & 16384) {
        if (on) {
            game.u.uprops[REGENERATION].extrinsic |= wp_mask;
        } else {
            game.u.uprops[REGENERATION].extrinsic &= ~wp_mask;
        }
    }
    if (spfx & 262144) {
        if (on) {
            game.u.uprops[TELEPORT_CONTROL].extrinsic |= wp_mask;
        } else {
            game.u.uprops[TELEPORT_CONTROL].extrinsic &= ~wp_mask;
        }
    }
    if (spfx & 32) {
        if (spec_m2(otmp)) {
            if (on) {
                game.u.uprops[WARN_OF_MON].extrinsic |= wp_mask;
                game.context.warntype.obj |= spec_m2(otmp);
            } else {
                game.u.uprops[WARN_OF_MON].extrinsic &= ~wp_mask;
                game.context.warntype.obj &= ~spec_m2(otmp);
            }
            see_monsters();
        } else {
            if (on) {
                game.u.uprops[WARNING].extrinsic |= wp_mask;
            } else {
                game.u.uprops[WARNING].extrinsic &= ~wp_mask;
            }
        }
    }
    if (spfx & 32768) {
        if (on) {
            game.u.uprops[ENERGY_REGENERATION].extrinsic |= wp_mask;
        } else {
            game.u.uprops[ENERGY_REGENERATION].extrinsic &= ~wp_mask;
        }
    }
    if (spfx & 65536) {
        if (on) {
            game.u.uprops[HALF_SPDAM].extrinsic |= wp_mask;
        } else {
            game.u.uprops[HALF_SPDAM].extrinsic &= ~wp_mask;
        }
    }
    if (spfx & 131072) {
        if (on) {
            game.u.uprops[HALF_PHDAM].extrinsic |= wp_mask;
        } else {
            game.u.uprops[HALF_PHDAM].extrinsic &= ~wp_mask;
        }
    }
    if (spfx & 33554432) {
        if (on) {
            game.u.xray_range = 3;
        /* this assumes that no one else is using xray_range */
        } else {
            game.u.xray_range = -1;
        }
        game.vision_full_recalc = 1;
    }
    if ((spfx & 67108864) && (wp_mask & 256)) {
        if (on) {
            game.u.uprops[REFLECTING].extrinsic |= wp_mask;
        } else {
            game.u.uprops[REFLECTING].extrinsic &= ~wp_mask;
        }
    }
    if (spfx & 134217728) {
        if (on) {
            game.u.uprops[PROTECTION].extrinsic |= wp_mask;
        } else {
            game.u.uprops[PROTECTION].extrinsic &= ~wp_mask;
        }
    }
    if (wp_mask == 4096 && !on && oart.inv_prop) {
        /* might have to turn off invoked power too */
        if (oart.inv_prop <= LAST_PROP && (game.u.uprops[oart.inv_prop].extrinsic & 8192)) {
            arti_invoke(otmp);
        }
    }
    if (wp_mask == 256 && is_art(otmp, ART_SUNSWORD)) {
        if (on) {
            game.u.uprops[BLND_RES].extrinsic |= wp_mask;
        } else {
            game.u.uprops[BLND_RES].extrinsic &= ~wp_mask;
        }
    }
}
/* touch_artifact()'s return value isn't sufficient to tell whether it
   dished out damage, and tracking changes to u.uhp, u.mh, Lifesaved
   when trying to avoid second wounding is too cumbersome */
game.touch_blasted = 0;
/* for retouch_object() */
/*
 * creature (usually hero) tries to touch (pick up or wield) an artifact obj.
 * Returns 0 if the object refuses to be touched.
 * This routine does not change any object chains.
 * Ignores such things as gauntlets, assuming the artifact is not
 * fooled by such trappings.
 */
export function touch_artifact(obj, mon) {
    let oart = get_artifact(obj);
    let badclass = 0;
    let badalign = 0;
    let self_willed = 0;
    let yours = 0;
    game.touch_blasted = (0);
    if (oart == artilist[ART_NONARTIFACT]) {
        /* allow hero in silver-hating form to try to perform invocation ritual */
        return 1;
    }
    yours = (mon == game.youmonst);
    /* all quest artifacts are self-willed; if this ever changes, `badclass'
       will have to be extended to explicitly include quest artifacts */
    self_willed = ((oart.spfx & 4) != 0);
    if (yours) {
        badclass = self_willed && ((oart.role != NON_PM && !(game.urole.mnum == (oart.role))) || (oart.race != NON_PM && !(game.urace.mnum == (oart.race))));
        badalign = ((oart.spfx & 2) != 0 && oart.alignment != (-128) && (oart.alignment != game.u.ualign.type || game.u.ualign.record < 0));
    } else if (!(((mon.data).mflags3 & 31)) && !(((mon.data).pmidx >= PM_ARCHEOLOGIST) && ((mon.data).pmidx <= PM_WIZARD))) {
        badclass = self_willed && oart.role != NON_PM && oart != artilist[ART_EXCALIBUR];
        badalign = (oart.spfx & 2) && oart.alignment != (-128) && (oart.alignment != mon_aligntyp(mon));
    } else {
        /* an M3_WANTSxxx monster or a fake player */
        /* special monsters trying to take the Amulet, invocation tools or
           quest item can touch anything except `spec_applies' artifacts */
        badclass = badalign = (0);
    }
    /* weapons which attack specific categories of monsters are
       bad for them even if their alignments happen to match */
    if (!badalign) {
        badalign = bane_applies(oart, mon);
    }
    if (((badclass || badalign) && self_willed) || (badalign && (!yours || !rn2(4)))) {
        let dmg = 0;
        let tmp = 0;
        let buf = '';
        if (!yours) {
            return 0;
        }
        You("are blasted by %s power!", s_suffix(the(xname(obj))));
        game.touch_blasted = (1);
        dmg = d(((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) ? 2 : 4), (self_willed ? 10 : 4));
        /* add half (maybe quarter) of the usual silver damage bonus */
        if (game.objects[obj.otyp].oc_material == SILVER && (game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data))) {
            tmp = rnd(10) , dmg += (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((tmp) + 1) / 2)) : (tmp));
        }
        buf = sprintf(buf, "touching %s", oart.name);
        /* magic damage, not physical */
        losehp(dmg, buf, 1);
        exercise(A_WIS, (0));
    }
    if (badclass && badalign && self_willed) {
        if (yours) {
            if (!((obj).where == 3)) {
                pline("%s your grasp!", Tobjnam(obj, "evade"));
            /* can pick it up unless you're totally non-synch'd with the artifact */
            } else {
                pline("%s beyond your control!", Tobjnam(obj, "are"));
            }
        }
        return 0;
    }
    return 1;
}
/* decide whether an artifact itself is vulnerable to a particular type
   of erosion damage, independent of the properties of its bearer */
export function arti_immune(obj, dtyp) {
    let weap = get_artifact(obj);
    if (weap == artilist[ART_NONARTIFACT]) {
        return (0);
    }
    if (dtyp == 0) {
        return (0);
    }
    /* nothing is immune to phys dmg */
    return (weap.attk.adtyp == dtyp || weap.defn.adtyp == dtyp || weap.cary.adtyp == dtyp);
}
export function bane_applies(oart, mon) {
    let atmp = { otyp: 0, name: null, spfx: 0, cspfx: 0, mtype: 0, attk: { aatyp: 0, adtyp: 0, damn: 0, damd: 0 }, defn: { aatyp: 0, adtyp: 0, damn: 0, damd: 0 }, cary: { aatyp: 0, adtyp: 0, damn: 0, damd: 0 }, inv_prop: 0, alignment: 0, role: 0, race: 0, gen_spe: 0, gift_value: 0, cost: 0, acolor: 0 };
    if (oart != artilist[ART_NONARTIFACT] && (oart.spfx & 32505856) != 0) {
        Object.assign(atmp, oart);
        atmp.spfx &= 32505856;
        if (spec_applies(atmp, mon)) {
            return (1);
        }
    }
    return (0);
}
/* decide whether an artifact's special attacks apply against mtmp */
export function spec_applies(weap, mtmp) {
    let ptr = null;
    let yours = 0;
    if (!(weap.spfx & (32505856 | 64))) {
        return (weap.attk.adtyp == 0);
    }
    yours = (mtmp == game.youmonst);
    ptr = mtmp.data;
    if (weap.spfx & 1048576) {
        return (ptr == game.mons[weap.mtype]);
    } else if (weap.spfx & 2097152) {
        return (weap.mtype == ptr.mlet);
    } else if (weap.spfx & 4194304) {
        return ((ptr.mflags1 & weap.mtype) != 0);
    } else if (weap.spfx & 8388608) {
        return ((ptr.mflags2 & weap.mtype) || (yours && ((!(game.u.umonnum != game.u.umonster) && (game.urace.selfmask & weap.mtype)) || ((weap.mtype & 4) && ((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS)))));
    } else if (weap.spfx & 16777216) {
        return yours ? (game.u.ualign.type != weap.alignment) : (ptr.maligntyp == (-128) || sgn(ptr.maligntyp) != weap.alignment);
    } else if (weap.spfx & 64) {
        if (defended(mtmp, weap.attk.adtyp)) {
            return (0);
        }
        switch (weap.attk.adtyp) {
            case 2:
                return !(yours ? (game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) : Resists_Elem(mtmp, FIRE_RES));
            case 3:
                return !(yours ? (game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic) : Resists_Elem(mtmp, COLD_RES));
            case 6:
                return !(yours ? (game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic) : Resists_Elem(mtmp, SHOCK_RES));
            case 1:
            case 12:
                return !(yours ? (game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) : (rn2(100) < ptr.mr));
            case 7:
                return !(yours ? (game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic) : Resists_Elem(mtmp, POISON_RES));
            case 15:
                return !(yours ? (game.u.uprops[DRAIN_RES].intrinsic || game.u.uprops[DRAIN_RES].extrinsic) : resists_drli(mtmp));
            case 18:
                return !(yours ? (game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) : Resists_Elem(mtmp, STONE_RES));
            default:
                impossible("Weird weapon special attack.");
        }
    }
    return 0;
}
/* return the M2 flags of monster that an artifact's special attacks apply
 * against */
export function spec_m2(otmp) {
    let artifact = get_artifact(otmp);
    if (artifact != artilist[ART_NONARTIFACT]) {
        return artifact.mtype;
    }
    return 0;
}
/* special attack bonus */
export function spec_abon(otmp, mon) {
    let weap = get_artifact(otmp);
    /* no need for an extra check for `NO_ATTK' because this will
       always return 0 for any artifact which has that attribute */
    if (weap != artilist[ART_NONARTIFACT] && weap.attk.damn && spec_applies(weap, mon)) {
        return rnd(weap.attk.damn);
    }
    return 0;
}
/* special damage bonus */
export function spec_dbon(otmp, mon, tmp) {
    let weap = get_artifact(otmp);
    if ((weap == artilist[ART_NONARTIFACT]) || (weap.attk.adtyp == 0 && weap.attk.damn == 0 && weap.attk.damd == 0)) {
        game.spec_dbon_applies = (0);
    } else if (is_art(otmp, ART_GRIMTOOTH)) {
        game.spec_dbon_applies = (1);
    /* Grimtooth has SPFX settings to warn against elves but we want its
           damage bonus to apply to all targets, so bypass spec_applies() */
    } else {
        game.spec_dbon_applies = spec_applies(weap, mon);
    }
    if (game.spec_dbon_applies) {
        return weap.attk.damd ? rnd(weap.attk.damd) : ((tmp) > (1) ? (tmp) : (1));
    }
    return 0;
}
/* add identified artifact to discoveries list */
export function discover_artifact(m) {
    let i = 0;
    for (i = 0; i < NROFARTIFACTS; i++) {
        if (game.artidisco[i] == 0 || game.artidisco[i] == m) {
            /* look for this artifact in the discoveries list;
       if we hit an empty slot then it's not present, so add it */
            game.artidisco[i] = m;
            return;
        }
    }
    /* there is one slot per artifact, so we should never reach the
       end without either finding the artifact or an empty slot... */
    impossible("couldn't discover artifact (%d)", m);
}
/* used to decide whether an artifact has been fully identified */
export function undiscovered_artifact(m) {
    let i = 0;
    /* look for this artifact in the discoveries list;
       if we hit an empty slot then it's undiscovered */
    for (i = 0; i < NROFARTIFACTS; i++) {
        if (game.artidisco[i] == m) {
            return (0);
        } else if (game.artidisco[i] == 0) {
            break;
        }
    }
    return (1);
}
/* display a list of discovered artifacts; return their count */
/* supplied by dodiscover(); type is NHW_TEXT */
export function disp_artifact_discoveries(tmpwin) {
    let i = 0;
    let m = 0;
    let otyp = 0;
    let algnstr = null;
    let buf = '';
    for (i = 0; i < NROFARTIFACTS; i++) {
        if (game.artidisco[i] == 0) {
            break;
        }
        /* empty slot implies end of list */
        if (tmpwin == (-1)) {
            continue;
        }
        /* for WIN_ERR, we just count */
        if (i == 0) {
            (game.windowprocs.win_putstr)(tmpwin, game.iflags.menu_headings.attr, "Artifacts");
        }
        m = game.artidisco[i];
        otyp = artilist[m].otyp;
        algnstr = align_str(artilist[m].alignment);
        if (!strcmp(algnstr, "unaligned")) {
            algnstr = "non-aligned";
        }
        buf = sprintf(buf, "  %s [%s %s]", artiname(m), algnstr, simple_typename(otyp));
        (game.windowprocs.win_putstr)(tmpwin, 0, buf);
    }
    return i;
}
/* (wizard mode only) show all artifacts and their flags */
export function dump_artifact_info(tmpwin) {
    let m = 0;
    let buf = '';
    let buf2 = '';
    (game.windowprocs.win_putstr)(tmpwin, game.iflags.menu_headings.attr, "Artifacts");
    /* not a menu, but header uses same bold or whatever attribute as such */
    for (m = 1; m <= NROFARTIFACTS; ++m) {
        buf2 = nh_snprintf("dump_artifact_info", 1197, buf2, 256 /* sizeof(char [256]) */, "[%s%s%s%s%s%s%s%s%s]", game.artiexist[m].exists ? "exists;" : "", game.artiexist[m].found ? " hero knows;" : "", game.artiexist[m].gift ? " gift" : "", game.artiexist[m].wish ? " wish" : "", game.artiexist[m].named ? " named" : "", game.artiexist[m].viadip ? " viadip" : "", game.artiexist[m].lvldef ? " lvldef" : "", game.artiexist[m].bones ? " bones" : "", game.artiexist[m].rndm ? " random" : "");
        buf = nh_snprintf("dump_artifact_info", 1204, buf, 256 /* sizeof(char [256]) */, "  %-36.36s%s", artiname(m), buf2);
        (game.windowprocs.win_putstr)(tmpwin, 0, buf);
    }
    return;
}
/*
 * Magicbane's intrinsic magic is incompatible with normal
 * enchantment magic.  Thus, its effects have a negative
 * dependence on spe.  Against low mr victims, it typically
 * does "double athame" damage, 2d4.  Occasionally, it will
 * cast unbalancing magic which effectively averages out to
 * 4d4 damage (3d4 against high mr victims), for spe = 0.
 *
 * Prior to 3.4.1, the cancel (aka purge) effect always
 * included the scare effect too; now it's one or the other.
 * Likewise, the stun effect won't be combined with either
 * of those two; it will be chosen separately or possibly
 * used as a fallback when scare or cancel fails.
 *
 * [Historical note: a change to artifact_hit() for 3.4.0
 * unintentionally made all of Magicbane's special effects
 * be blocked if the defender successfully saved against a
 * stun attack.  As of 3.4.1, those effects can occur but
 * will be slightly less likely than they were in 3.3.x.]
 */
export const MB_INDEX_PROBE = 0;
export const MB_INDEX_STUN = 1;
export const MB_INDEX_SCARE = 2;
export const MB_INDEX_CANCEL = 3;
export const NUM_MB_INDICES = 4;
/* rolls above this aren't magical */
const mb_verb = [["probe", "stun", "scare", "cancel"], ["prod", "amaze", "tickle", "purge"]];
/* called when someone is being hit by Magicbane */
/* attacker */
/* defender */
/* Magicbane */
/* extra damage target will suffer */
/* d20 that has already scored a hit */
/* whether the action can be seen */
/* target's name: "you" or mon_nam(mdef) */
export function Mb_hit(magr, mdef, mb, dmgptr, dieroll, vis, hittee) {
    let old_mdat = null;
    let verb = null;
    let youattack = (magr == game.youmonst);
    let youdefend = (mdef == game.youmonst);
    let resisted = (0);
    let do_stun = 0;
    let do_confuse = 0;
    let result = 0;
    let attack_indx = 0;
    let fakeidx = 0;
    let scare_dieroll = Math.trunc(8 / 2);
    result = (0);
    /* the most severe effects are less likely at higher enchantment */
    if (mb.spe >= 3) {
        scare_dieroll = Math.trunc(scare_dieroll / (1 << (Math.trunc(mb.spe / 3))));
    }
    /* if target successfully resisted the artifact damage bonus,
       reduce overall likelihood of the assorted special effects */
    if (!game.spec_dbon_applies) {
        dieroll += 1;
    }
    /* might stun even when attempting a more severe effect, but
       in that case it will only happen if the other effect fails;
       extra damage will apply regardless; 3.4.1: sometimes might
       just probe even when it hasn't been enchanted */
    do_stun = (((mb.spe) > (0) ? (mb.spe) : (0)) < rn2(game.spec_dbon_applies ? 11 : 7));
    /* the special effects also boost physical damage; increments are
       generally cumulative, but since the stun effect is based on a
       different criterium its damage might not be included; the base
       damage is either 1d4 (athame) or 2d4 (athame+spec_dbon) depending
       on target's resistance check against AD_STUN (handled by caller)
       [note that a successful save against AD_STUN doesn't actually
       prevent the target from ending up stunned] */
    attack_indx = MB_INDEX_PROBE;
    dmgptr.value += rnd(4);
    if (do_stun) {
        attack_indx = MB_INDEX_STUN;
        dmgptr.value += rnd(4);
    }
    if (dieroll <= scare_dieroll) {
        attack_indx = MB_INDEX_SCARE;
        dmgptr.value += rnd(4);
    }
    if (dieroll <= (Math.trunc(scare_dieroll / 2))) {
        attack_indx = MB_INDEX_CANCEL;
        dmgptr.value += rnd(4);
    }
    /* give the hit message prior to inflicting the effects */
    verb = mb_verb[!!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))][attack_indx];
    if (youattack || youdefend || vis) {
        result = (1);
        pline_The("magic-absorbing blade %s %s!", vtense(null, verb), hittee);
        /* assume probing has some sort of noticeable feedback
           even if it is being done by one monster to another */
        if (attack_indx == MB_INDEX_PROBE && !(canseemon(mdef) || sensemon(mdef))) {
            map_invisible(mdef.mx, mdef.my);
        }
    }
    switch (attack_indx) {
        /* now perform special effects */
        case MB_INDEX_CANCEL:
            old_mdat = youdefend ? game.youmonst.data : mdef.data;
            if (!cancel_monst(mdef, mb, youattack, (0), (0))) {
                /* No mdef->mcan check: even a cancelled monster can be polymorphed
         * into a golem, and the "cancel" effect acts as if some magical
         * energy remains in spellcasting defenders to be absorbed later.
         */
                resisted = (1);
            } else {
                do_stun = (0);
                if (youdefend) {
                    if (game.youmonst.data != old_mdat) {
                        dmgptr.value = 0;
                    }
                    if (game.u.uenmax > 0) {
                        /* rehumanized, so no more damage */
                        game.u.uenmax--;
                        if (game.u.uen > 0) {
                            game.u.uen--;
                        }
                        game.disp.botl = (1);
                        You("lose magical energy!");
                    }
                } else {
                    /* canceled shapeshifter/vamp may have changed forms, so
                   update its name if necessary */
                    if (mdef.data != old_mdat) {
                        hittee = strcpy(hittee, mon_nam(mdef));
                    }
                    if (mdef.data == game.mons[PM_CLAY_GOLEM]) {
                        mdef.mhp = 1;
                    }
                    if (youattack && attacktype(mdef.data, 255)) {
                        /* cancelled clay golems will die */
                        game.u.uenmax++;
                        if (game.u.uenmax > game.u.uenpeak) {
                            game.u.uenpeak = game.u.uenmax;
                        }
                        game.u.uen++;
                        game.disp.botl = (1);
                        You("absorb magical energy!");
                    }
                }
            }
            break;
        case MB_INDEX_SCARE:
            if (youdefend) {
                if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                    resisted = (1);
                } else {
                    nomul(-3);
                    game.multi_reason = "being scared stiff";
                    game.nomovemsg = "";
                    if (magr && magr == game.u.ustuck && sticks(game.youmonst.data)) {
                        set_ustuck(null);
                        You("release %s!", mon_nam(magr));
                    }
                }
            } else {
                if (rn2(2) && resist(mdef, WEAPON_CLASS, 0, 0)) {
                    resisted = (1);
                } else {
                    monflee(mdef, 3, (0), (mdef.mhp > dmgptr.value));
                }
            }
            if (!resisted) {
                do_stun = (0);
            }
            break;
        case MB_INDEX_STUN:
            do_stun = (1);
            break;
        case MB_INDEX_PROBE:
            if (youattack && (mb.spe == 0 || !rn2(3 * abs(mb.spe)))) {
                pline_The("%s is insightful.", verb);
                probe_monster(mdef);
            }
            break;
    }
    if (do_stun) {
        if (youdefend) {
            make_stunned(((game.u.uprops[STUNNED].intrinsic & 16777215) + 3), (0));
        /* stun if that was selected and a worse effect didn't occur */
        } else {
            mdef.mstun = 1;
        }
        /* avoid extra stun message below if we used mb_verb["stun"] above */
        if (attack_indx == MB_INDEX_STUN) {
            do_stun = (0);
        }
    }
    /* lastly, all this magic can be confusing... */
    do_confuse = !rn2(12);
    if (do_confuse) {
        if (youdefend) {
            make_confused((game.u.uprops[CONFUSION].intrinsic & 16777215) + 4, (0));
        } else {
            mdef.mconf = 1;
        }
    }
    /* now give message(s) describing side-effects; Use fakename
       so vtense() won't be fooled by assigned name ending in 's' */
    fakeidx = youdefend ? 1 : 0;
    if (youattack || youdefend || vis) {
        hittee = upstart(hittee);
        if (resisted) {
            pline("%s %s!", hittee, vtense(c_common_strings.c_fakename[fakeidx], "resist"));
            shieldeff(youdefend ? game.u.ux : mdef.mx, youdefend ? game.u.uy : mdef.my);
        }
        if ((do_stun || do_confuse) && game.flags.verbose) {
            let buf = '';
            buf = '';
            if (do_stun) {
                buf = strcat(buf, "stunned");
            }
            if (do_stun && do_confuse) {
                buf = strcat(buf, " and ");
            }
            if (do_confuse) {
                buf = strcat(buf, "confused");
            }
            pline("%s %s %s%c", hittee, vtense(c_common_strings.c_fakename[fakeidx], "are"), buf, (do_stun && do_confuse) ? 33 : 46);
        }
    }
    return result;
}
/* Function used when someone attacks someone else with an artifact
 * weapon.  Only adds the special (artifact) damage, and returns a 1 if it
 * did something special (in which case the caller won't print the normal
 * hit message).  This should be called once upon every artifact attack;
 * dmgval() no longer takes artifact bonuses into account.  Possible
 * extension: change the killer so that when an orc kills you with
 * Stormbringer it's "killed by Stormbringer" instead of "killed by an orc".
 */
/* attacker; might be Null if 'mdef' is youmonst */
/* defender */
/* artifact weapon */
/* output */
/* needed for Magicbane and vorpal blades */
const __artifact_hit_you = "you";
const __artifact_hit_behead_msg = ["%s beheads %s!", "%s decapitates %s!"];
export function artifact_hit(magr, mdef, otmp, dmgptr, dieroll) {
    let youattack = (magr == game.youmonst);
    let youdefend = (mdef == game.youmonst);
    let vis = (!youattack && magr && ((game.viz_array[magr.my][magr.mx] & 2) != 0)) || (!youdefend && ((game.viz_array[mdef.my][mdef.mx] & 2) != 0)) || (youattack && (game.u.uswallow && (game.u.ustuck == (mdef))) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked));
    let realizes_damage = 0;
    let wepdesc = null;
    let hittee = '';
    hittee = strcpy(hittee, youdefend ? __artifact_hit_you : mon_nam(mdef));
    /* The following takes care of most of the damage, but not all--
     * the exception being for level draining, which is specially
     * handled.  Messages are done in this function, however.
     */
    dmgptr.value += spec_dbon(otmp, mdef, dmgptr.value);
    if (youattack && youdefend) {
        impossible("attacking yourself with weapon?");
        return (0);
    }
    realizes_damage = (youdefend || vis || (youattack && mdef == game.u.ustuck));
    if (attacks(2, otmp)) {
        /* feel the effect even if not seen */
        /* the four basic attacks: fire, cold, shock and missiles */
        if (realizes_damage) {
            pline_The("fiery blade %s %s%c", !game.spec_dbon_applies ? "hits" : (mdef.data == game.mons[PM_WATER_ELEMENTAL]) ? "vaporizes part of" : "burns", hittee, !game.spec_dbon_applies ? 46 : 33);
        }
        if (!rn2(4)) {
            let itemdmg = destroy_items(mdef, 2, dmgptr.value);
            if (!youdefend) {
                dmgptr.value += itemdmg;
            }
            ignite_items(mdef.minvent);
        }
        if (youdefend && game.u.uprops[SLIMED].intrinsic) {
            burn_away_slime();
        }
        return realizes_damage;
    }
    if (attacks(3, otmp)) {
        if (realizes_damage) {
            pline_The("ice-cold blade %s %s%c", !game.spec_dbon_applies ? "hits" : "freezes", hittee, !game.spec_dbon_applies ? 46 : 33);
        }
        if (!rn2(4)) {
            let itemdmg = destroy_items(mdef, 3, dmgptr.value);
            if (!youdefend) {
                dmgptr.value += itemdmg;
            }
        }
        return realizes_damage;
    }
    if (attacks(6, otmp)) {
        if (realizes_damage) {
            pline_The("massive hammer hits%s %s%c", !game.spec_dbon_applies ? "" : "!  Lightning strikes", hittee, !game.spec_dbon_applies ? 46 : 33);
        }
        if (game.spec_dbon_applies) {
            wake_nearto(mdef.mx, mdef.my, 4 * 4);
        }
        if (!rn2(5)) {
            let itemdmg = destroy_items(mdef, 6, dmgptr.value);
            if (!youdefend) {
                dmgptr.value += itemdmg;
            }
        }
        return realizes_damage;
    }
    if (attacks(1, otmp)) {
        if (realizes_damage) {
            pline_The("imaginary widget hits%s %s%c", !game.spec_dbon_applies ? "" : "!  A hail of magic missiles strikes", hittee, !game.spec_dbon_applies ? 46 : 33);
        }
        return realizes_damage;
    }
    if (attacks(12, otmp) && dieroll <= 8) {
        /* Magicbane's special attacks (possibly modifies hittee[]) */
        return Mb_hit(magr, mdef, otmp, dmgptr, dieroll, vis, hittee);
    }
    if (!game.spec_dbon_applies) {
        return (0);
    }
    if (spec_ability(otmp, 1024)) {
        if (is_art(otmp, ART_TSURUGI_OF_MURAMASA) && dieroll == 1) {
            /* We really want "on a natural 20" but Nethack does it in */
            wepdesc = "The razor-sharp blade";
            if (youattack && (game.u.uswallow && (game.u.ustuck == (mdef)))) {
                /* not really beheading, but so close, why add another SPFX */
                You("slice %s wide open!", mon_nam(mdef));
                /* losing a level when at 0 is fatal */
                dmgptr.value = 2 * mdef.mhp + 200;
                /* Should amulets fall off? */
                return (1);
            }
            if (!youdefend) {
                /* allow normal cutworm() call to add extra damage */
                if (game.notonhead) {
                    return (0);
                }
                if (((mdef.data).msize >= 3)) {
                    if (youattack) {
                        You("slice deeply into %s!", mon_nam(mdef));
                    } else if (vis) {
                        pline("%s cuts deeply into %s!", Monnam(magr), hittee);
                    }
                    dmgptr.value *= 2;
                    return (1);
                }
                dmgptr.value = 2 * mdef.mhp + 200;
                pline("%s cuts %s in half!", wepdesc, mon_nam(mdef));
                observe_object(otmp);
                return (1);
            } else {
                if (((game.youmonst.data).msize >= 3)) {
                    pline("%s cuts deeply into you!", magr ? Monnam(magr) : wepdesc);
                    dmgptr.value *= 2;
                    return (1);
                }
                /* Players with negative AC's take less damage instead
                 * of just not getting hit.  We must add a large enough
                 * value to the damage so that this reduction in
                 * damage does not prevent death.
                 */
                dmgptr.value = 2 * ((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp) + 200;
                pline("%s cuts you in half!", wepdesc);
                observe_object(otmp);
                return (1);
            }
        } else if (is_art(otmp, ART_VORPAL_BLADE) && (dieroll == 1 || mdef.data == game.mons[PM_JABBERWOCK])) {
            if (youattack && (game.u.uswallow && (game.u.ustuck == (mdef)))) {
                return (0);
            }
            wepdesc = artilist[ART_VORPAL_BLADE].name;
            if (!youdefend) {
                if (!(((mdef.data).mflags1 & 32768) == 0) || game.notonhead || game.u.uswallow) {
                    if (youattack) {
                        pline("Somehow, you miss %s wildly.", mon_nam(mdef));
                    } else if (vis) {
                        pline("Somehow, %s misses wildly.", mon_nam(magr));
                    }
                    dmgptr.value = 0;
                    return (youattack || vis);
                }
                if (((mdef.data).mlet == S_GHOST) || (((mdef.data).mflags1 & 4) != 0)) {
                    pline("%s slices through %s %s.", wepdesc, s_suffix(mon_nam(mdef)), mbodypart(mdef, NECK));
                    return (1);
                }
                dmgptr.value = 2 * mdef.mhp + 200;
                pline(__artifact_hit_behead_msg[rn2((Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */)))], wepdesc, mon_nam(mdef));
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !game.flags.female) {
                    pline("Good job Henry, but that wasn't Anne.");
                }
                observe_object(otmp);
                return (1);
            } else {
                if (!(((game.youmonst.data).mflags1 & 32768) == 0)) {
                    pline("Somehow, %s misses you wildly.", magr ? mon_nam(magr) : wepdesc);
                    dmgptr.value = 0;
                    return (1);
                }
                if (((game.youmonst.data).mlet == S_GHOST) || (((game.youmonst.data).mflags1 & 4) != 0)) {
                    pline("%s slices through your %s.", wepdesc, body_part(NECK));
                    return (1);
                }
                dmgptr.value = 2 * ((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp) + 200;
                pline(__artifact_hit_behead_msg[rn2((Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */)))], wepdesc, "you");
                observe_object(otmp);
                return (1);
            }
        }
    }
    if (spec_ability(otmp, 256)) {
        /* some non-living creatures (golems, vortices) are vulnerable to
           life drain effects so can get "<Arti> draws the <life>" feedback */
        let life = ((((mdef.data).mflags2 & 2) != 0) || (mdef.data) == game.mons[PM_MANES] || (((mdef.data).mlet == S_GOLEM) || (mdef.data).mlet == S_VORTEX)) ? "animating force" : "life";
        if (!youdefend) {
            let m_lev = mdef.m_lev;
            let mhpmax = mdef.mhpmax;
            let drain = monhp_per_lvl(mdef);
            /* note: DRLI attack uses 2d6, attacker doesn't get healed */
            /* stop draining HP if it drops too low (still drains level;
               also caller still inflicts regular weapon damage) */
            if (mhpmax - drain <= m_lev) {
                drain = (mhpmax > m_lev) ? (mhpmax - (m_lev + 1)) : 0;
            }
            if (vis) {
                /* call distant_name() for possible side-effects even if
                   the result won't be printed */
                let otmpname = distant_name(otmp, xname);
                if (is_art(otmp, ART_STORMBRINGER)) {
                    pline_The("%s blade draws the %s from %s!", hcolor(c_color_names.c_black), life, mon_nam(mdef));
                } else {
                    pline("%s draws the %s from %s!", The(otmpname), life, mon_nam(mdef));
                }
            }
            if (mdef.m_lev == 0) {
                dmgptr.value = 2 * mdef.mhp + 200;
            } else {
                dmgptr.value += drain;
                mdef.mhpmax -= drain;
                mdef.m_lev--;
            }
            if (drain > 0) {
                /* drain: was target's damage, now heal attacker by half */
                drain = Math.trunc((drain + 1) / 2);
                if (youattack) {
                    healup(drain, 0, (0), (0));
                } else {
                    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                    healmon(magr, drain, 0);
                }
            }
            return vis;
        } else {
            let oldhpmax = game.u.uhpmax;
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                You_feel("an %s drain your %s!", is_art(otmp, ART_STORMBRINGER) ? "unholy blade" : "object", life);
            } else {
                let otmpname = distant_name(otmp, xname);
                if (is_art(otmp, ART_STORMBRINGER)) {
                    pline_The("%s blade drains your %s!", hcolor(c_color_names.c_black), life);
                } else {
                    pline("%s drains your %s!", The(otmpname), life);
                }
            }
            losexp("life drainage");
            if (magr && magr.mhp < magr.mhpmax) {
                healmon(magr, Math.trunc((abs(oldhpmax - game.u.uhpmax) + 1) / 2), 0);
            }
            return (1);
        }
    }
    return (0);
}
/* getobj callback for object to be invoked */
export function invoke_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    /* artifacts and other special items */
    if (obj.oartifact || game.objects[obj.otyp].oc_unique || (obj.otyp == FAKE_AMULET_OF_YENDOR && !obj.known)) {
        return GETOBJ_SUGGEST;
    }
    /* synonym for apply, though actually invoking it will do different things
     * depending if it's a regular crystal ball, an artifact one that has an
     * invoke power, and a (theoretical) artifact one that doesn't have an
     * invoke power */
    if (obj.otyp == CRYSTAL_BALL) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_EXCLUDE;
}
/* the #invoke command */
export function doinvoke() {
    let obj = null;
    obj = getobj("invoke", invoke_ok, 2);
    if (!obj) {
        return 2;
    }
    if (!retouch_object({ get value() { return obj; }, set value(_v) { obj = _v; } }, (0))) {
        return 1;
    }
    return arti_invoke(obj);
}
export function nothing_special(obj) {
    if (((obj).where == 3)) {
        You_feel("a surge of power, but nothing seems to happen.");
    }
}
export function invoke_taming(obj) {
    let pseudo = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    /* neither cursed nor blessed, zero oextra too */
    Object.assign(pseudo, cg.zeroobj);
    pseudo.otyp = SCR_TAMING;
    seffects(pseudo);
    return 1;
}
export function invoke_healing(obj) {
    let healamt = Math.trunc((game.u.uhpmax + 1 - game.u.uhp) / 2);
    let creamed = game.u.ucreamed;
    if ((game.u.umonnum != game.u.umonster)) {
        healamt = Math.trunc((game.u.mhmax + 1 - game.u.mh) / 2);
    }
    if (healamt || game.u.uprops[SICK].intrinsic || game.u.uprops[SLIMED].intrinsic || (game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked) > creamed) {
        You_feel("better.");
    }
    if (healamt || game.u.uprops[SICK].intrinsic || game.u.uprops[SLIMED].intrinsic || (game.u.uprops[BLINDED].intrinsic & 16777215) > creamed) {
        You_feel("%sbetter.", (!healamt && !game.u.uprops[SICK].intrinsic && !game.u.uprops[SLIMED].intrinsic && (game.u.uprops[BLINDED].intrinsic & ~16777215) != 0) ? "slightly " : "");
    } else {
        nothing_special(obj);
        return 1;
    }
    if (healamt > 0) {
        if ((game.u.umonnum != game.u.umonster)) {
            game.u.mh += healamt;
        /* when healing temporary blindness (aside from
                     goop covering face), might still be blind
                     due to PermaBlind or eyeless polymorph;
                     vary the message in that situation */
        } else {
            game.u.uhp += healamt;
        }
    }
    if (game.u.uprops[SICK].intrinsic) {
        make_sick(0, null, (0), 3);
    }
    if (game.u.uprops[SLIMED].intrinsic) {
        make_slimed(0, null);
    }
    if ((game.u.uprops[BLINDED].intrinsic & 16777215) > creamed) {
        make_blinded(creamed, (0));
    }
    game.disp.botl = (1);
    return 1;
}
export function invoke_energy_boost(obj) {
    let epboost = Math.trunc((game.u.uenmax + 1 - game.u.uen) / 2);
    if (epboost > 120) {
        epboost = 120;
    } else if (epboost < 12) {
        epboost = game.u.uenmax - game.u.uen;
    }
    if (epboost) {
        game.u.uen += epboost;
        game.disp.botl = (1);
        You_feel("re-energized.");
    } else {
        nothing_special(obj);
        return 1;
    }
    return 1;
}
export function invoke_untrap(obj) {
    if (!untrap((1), 0, 0, null)) {
        /* don't charge for changing their mind */
        obj.age = 0;
        return 2;
    }
    return 1;
}
export function invoke_charge_obj(obj) {
    let oart = get_artifact(obj);
    let otmp = getobj("charge", charge_ok, 2 | 1);
    let b_effect = 0;
    if (!otmp) {
        obj.age = 0;
        return 2;
    }
    b_effect = (obj.blessed && (oart.role == (game.urole.mnum) || oart.role == NON_PM));
    recharge(otmp, b_effect ? 1 : obj.cursed ? -1 : 0);
    update_inventory();
    return 1;
}
export function invoke_create_portal(obj) {
    let i = 0;
    let num_ok_dungeons = 0;
    let last_ok_dungeon = 0;
    let newlev = { dnum: 0, dlevel: 0 };
    let tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    let any = 0;
    let clr = 8;
    any = cg.zeroany;
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    for (i = num_ok_dungeons = 0; i < game.n_dgns; i++) {
        /* use index+1 (can't use 0) as identifier */
        if (!game.dungeons[i].dunlev_ureached) {
            continue;
        }
        /* can't portal into tutorial */
        if (i == (game.dungeon_topology.d_tutorial_dnum)) {
            continue;
        }
        any.a_int = i + 1;
        add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, game.dungeons[i].dname, 0);
        num_ok_dungeons++;
        last_ok_dungeon = i;
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Open a portal to which dungeon?");
    if (num_ok_dungeons > 1) {
        /* more than one entry; display menu for choices */
        let selected = null;
        let n = 0;
        n = select_menu(tmpwin, 1, selected);
        if (n <= 0) {
            (game.windowprocs.win_destroy_nhwindow)(tmpwin);
            /* you had the property from some other source too */
            nothing_special(obj);
            return 1;
        }
        i = selected[0].item.a_int - 1;
        free(selected);
    /* also first & only OK dungeon */
    } else {
        i = last_ok_dungeon;
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    /*
     * i is now index into dungeon structure for the new dungeon.
     * Find the closest level in the given dungeon, open
     * a use-once portal to that dungeon and go there.
     * The closest level is either the entry or dunlev_ureached.
     */
    newlev.dnum = i;
    if (game.dungeons[i].depth_start >= depth(game.u.uz)) {
        newlev.dlevel = game.dungeons[i].entry_lev;
    } else {
        newlev.dlevel = game.dungeons[i].dunlev_ureached;
    }
    if (game.u.uhave.amulet || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) || ((newlev).dnum == (game.dungeon_topology.d_astral_level).dnum) || newlev.dnum == game.u.uz.dnum || !next_to_u()) {
        You_feel("very disoriented for a moment.");
    } else {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            You("are surrounded by a shimmering sphere!");
        } else {
            You_feel("weightless for a moment.");
        }
        goto_level(newlev, (0), (0), (0));
    }
    return 1;
}
export function invoke_create_ammo(obj) {
    let otmp = mksobj(ARROW, (1), (0));
    if (!otmp) {
        nothing_special(obj);
        return 1;
    }
    otmp.blessed = obj.blessed;
    otmp.cursed = obj.cursed;
    otmp.bknown = obj.bknown;
    otmp.oeroded = otmp.oeroded2 = 0;
    if (obj.blessed) {
        if (otmp.spe < 0) {
            otmp.spe = 0;
        }
        otmp.quan += rnd(10);
    } else if (obj.cursed) {
        if (otmp.spe > 0) {
            otmp.spe = 0;
        }
    } else {
        otmp.quan += rnd(5);
    }
    otmp.owt = weight(otmp);
    otmp = hold_another_object(otmp, "Suddenly %s out.", aobjnam(otmp, "fall"), null);
    ((otmp));
    return 1;
}
export function invoke_banish(obj) {
    let nvanished = 0;
    let nstayed = 0;
    let mtmp = null;
    let mtmp2 = null;
    let dest = { dnum: 0, dlevel: 0 };
    find_hell(dest);
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp2) {
        let chance = 1;
        mtmp2 = mtmp.nmon;
        if (((mtmp).mhp < 1) || !isok(mtmp.mx, mtmp.my)) {
            continue;
        }
        if (!(((mtmp.data).mflags2 & 256) != 0) && mtmp.data.mlet != S_IMP) {
            continue;
        }
        if (!((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
            continue;
        }
        if (mtmp.data.msound == MS_NEMESIS) {
            continue;
        }
        if (In_quest(game.u.uz) && !game.quest_status.killed_nemesis) {
            chance += 10;
        }
        if (((((mtmp.data).mflags2 & 256) != 0) && (((mtmp.data).mflags2 & 2048) != 0))) {
            chance += 2;
        }
        if (((((mtmp.data).mflags2 & 256) != 0) && (((mtmp.data).mflags2 & 1024) != 0))) {
            chance++;
        }
        mtmp.msleeping = mtmp.mtame = mtmp.mpeaceful = 0;
        if (chance <= 1 || !rn2(chance)) {
            if (!In_hell(game.u.uz)) {
                nvanished++;
                /* banish to a random level in Gehennom */
                dest.dlevel = rn2(dunlevs_in_dungeon(dest));
                migrate_mon(mtmp, ledger_no(dest), 0);
            } else {
                u_teleport_mon(mtmp, (0));
            }
        } else {
            nstayed++;
        }
    }
    if (nvanished) {
        let subject = "demons";
        if (nvanished == 1) {
            subject = "demon";
        }
        pline("%s %s %s in a cloud of brimstone!", nstayed ? ((nvanished > nstayed) ? "Most of the" : "Some of the") : "The", subject, vtense(subject, "disappear"));
    }
    return 1;
}
export function invoke_fling_poison(obj) {
    if (getdir(null)) {
        let venom = rn2(2) ? BLINDING_VENOM : ACID_VENOM;
        let otmp = mksobj(venom, (1), (0));
        otmp.spe = 1;
        throwit(otmp, 0, (0), null);
    } else {
        pline("%s", c_common_strings.c_Never_mind);
        obj.age = game.moves;
        return 2;
    }
    return 1;
}
export function invoke_storm_spell(obj) {
    let oart = get_artifact(obj);
    let storm = oart.inv_prop == SNOWSTORM ? SPE_CONE_OF_COLD : SPE_FIREBALL;
    let skill = spell_skilltype(storm);
    let expertise = (game.u.weapon_skills[skill].skill);
    (game.u.weapon_skills[skill].skill) = P_EXPERT;
    spelleffects(storm, (0), (1));
    (game.u.weapon_skills[skill].skill) = expertise;
    return 1;
}
export function invoke_blinding_ray(obj) {
    if (getdir(null)) {
        if (game.u.dx || game.u.dy) {
            do_blinding_ray(obj);
        } else if (game.u.dz) {
            /* up or down => light this map spot; litroom() uses
               radius 0 for Sunsword, except on Rogue level where
               whole room gets lit and corridor spots remain unlit */
            litroom((1), obj);
            pline("%s", ((!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && game.level.locations[game.u.ux][game.u.uy].lit && !game.level.locations[game.u.ux][game.u.uy].waslit) ? "It is lit here now." : c_common_strings.c_nothing_seems_to_happen));
        } else {
            let vulnerable = (game.u.umonnum == PM_GREMLIN);
            let damg = obj.blessed ? 15 : !obj.cursed ? 10 : 5;
            /* could be fatal if Unchanging */
            if (vulnerable) {
                lightdamage(obj, (1), 2 * damg);
            }
            if (!flashburn((damg + rnd(damg)), (0)) && !vulnerable) {
                pline("%s", c_common_strings.c_nothing_seems_to_happen);
            }
        }
    } else {
        pline("%s", c_common_strings.c_Never_mind);
        obj.age = game.moves;
        return 2;
    }
    return 1;
}
/* return the amount of Pw invoking an object costs.
   return a negative value, if obj invoking cannot be paid with Pw */
export function arti_invoke_cost_pw(obj) {
    let oart = get_artifact(obj);
    if (oart.inv_prop == FLING_POISON || oart.inv_prop == BLINDING_RAY) {
        /* pretend it's a level 5 spell */
        return ((5) * 5);
    }
    return -1;
}
/* return TRUE if artifact object's invoke cost can be paid (and pay it) */
export function arti_invoke_cost(obj) {
    if (obj.age > game.moves) {
        let pw_cost = arti_invoke_cost_pw(obj);
        if (pw_cost < 0 || game.u.uen < pw_cost) {
            /* the artifact is tired :-) */
            You_feel("that %s %s ignoring you.", the(xname(obj)), otense(obj, "are"));
            /* and just got more so; patience is essential... */
            /* can't just keep repeatedly trying */
            obj.age += d(3, 10);
            return (0);
        } else {
            /* you pay invoke cost with your own magic */
            You_feel("drained...");
            game.u.uen -= pw_cost;
            game.disp.botl = (1);
        }
    } else {
        obj.age = game.moves + rnz(100);
    }
    return (1);
}
export function arti_invoke(obj) {
    let oart = null;
    let res = 0;
    if (!obj) {
        impossible("arti_invoke without obj");
        return 0;
    }
    oart = get_artifact(obj);
    if (oart == artilist[ART_NONARTIFACT] || !oart.inv_prop) {
        if (obj.otyp == CRYSTAL_BALL) {
            use_crystal_ball({ get value() { return obj; }, set value(_v) { obj = _v; } });
        } else {
            pline("%s", c_common_strings.c_nothing_happens);
        }
        return 1;
    }
    if (oart.inv_prop > LAST_PROP) {
        /* It's a special power, not "just" a property */
        if (!arti_invoke_cost(obj)) {
            return 1;
        }
        switch (oart.inv_prop) {
            case TAMING:
                res = invoke_taming(obj);
                break;
            case HEALING:
                res = invoke_healing(obj);
                break;
            case ENERGY_BOOST:
                res = invoke_energy_boost(obj);
                break;
            case UNTRAP:
                res = invoke_untrap(obj);
                break;
            case CHARGE_OBJ:
                res = invoke_charge_obj(obj);
                break;
            case LEV_TELE:
                level_tele();
                res = 1;
                break;
            case CREATE_PORTAL:
                res = invoke_create_portal(obj);
                break;
            case ENLIGHTENING:
                enlightenment(2, 0);
                res = 1;
                break;
            case CREATE_AMMO:
                res = invoke_create_ammo(obj);
                break;
            case BANISH:
                res = invoke_banish(obj);
                break;
            case FLING_POISON:
                res = invoke_fling_poison(obj);
                break;
            case SNOWSTORM:
            case FIRESTORM:
                res = invoke_storm_spell(obj);
                break;
            case BLINDING_RAY:
                res = invoke_blinding_ray(obj);
                break;
            default:
                impossible("Unknown invoke power %d.", oart.inv_prop);
                break;
        }
        return res;
    } else {
        let eprop = (game.u.uprops[oart.inv_prop].extrinsic ^= 8192);
        let iprop = game.u.uprops[oart.inv_prop].intrinsic;
        let on = (eprop & 8192) != 0;
        if (on && obj.age > game.moves) {
            game.u.uprops[oart.inv_prop].extrinsic ^= 8192;
            You_feel("that %s %s ignoring you.", the(xname(obj)), otense(obj, "are"));
            obj.age += d(3, 10);
            return 1;
        } else if (!on) {
            /* when turning off property, determine downtime */
            /* arbitrary for now until we can tune this -dlc */
            obj.age = game.moves + rnz(100);
        }
        if ((eprop & ~8192) || iprop) {
            nothing_special(obj);
            return 1;
        }
        switch (oart.inv_prop) {
            case CONFLICT:
                if (on) {
                    You_feel("like a rabble-rouser.");
                } else {
                    You_feel("the tension decrease around you.");
                }
                break;
            case LEVITATION:
                if (on) {
                    float_up();
                    spoteffects((0));
                } else {
                    float_down(536870912 | 16777215, 8192);
                }
                break;
            case INVIS:
                if (game.u.uprops[INVIS].blocked || ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    nothing_special(obj);
                    return 1;
                }
                newsym(game.u.ux, game.u.uy);
                if (on) {
                    Your("body takes on a %s transparency...", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "normal" : "strange");
                } else {
                    Your("body seems to unfade...");
                }
                break;
        }
    }
    return 1;
}
/* will freeing this object from inventory cause levitation to end? */
export function finesse_ahriman(obj) {
    let oart = null;
    let save_Lev = { extrinsic: 0, blocked: 0, intrinsic: 0 };
    let result = 0;
    /* if we aren't levitating or this isn't an artifact which confers
       levitation via #invoke then freeinv() won't toggle levitation */
    if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (oart = get_artifact(obj)) == artilist[ART_NONARTIFACT] || oart.inv_prop != LEVITATION || !(game.u.uprops[LEVITATION].extrinsic & 8192)) {
        return (0);
    }
    /* arti_invoke(off) -> float_down() clears I_SPECIAL|TIMEOUT & W_ARTI;
       probe ahead to see whether that actually results in floating down;
       (this assumes that there aren't two simultaneously invoked artifacts
       both conferring levitation--safe, since if there were two of them,
       invoking the 2nd would negate the 1st rather than stack with it) */
    Object.assign(save_Lev, game.u.uprops[LEVITATION]);
    game.u.uprops[LEVITATION].intrinsic &= ~(536870912 | 16777215);
    game.u.uprops[LEVITATION].extrinsic &= ~8192;
    result = !((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked);
    Object.assign(game.u.uprops[LEVITATION], save_Lev);
    return result;
}
/* WAC return TRUE if artifact is always lit */
export function artifact_light(obj) {
    /* not artifacts but treat them as if they were because they emit
       light without burning */
    if (obj && (obj.otyp == GOLD_DRAGON_SCALE_MAIL || obj.otyp == GOLD_DRAGON_SCALES) && (obj.owornmask & 1) != 0) {
        return (1);
    }
    return ((get_artifact(obj) != artilist[ART_NONARTIFACT]) && is_art(obj, ART_SUNSWORD));
}
/* KMH -- Talking artifacts are finally implemented */
export function arti_speak(obj) {
    let oart = get_artifact(obj);
    let line = null;
    let buf = '';
    /* Is this a speaking artifact? */
    if (oart == artilist[ART_NONARTIFACT] || !(oart.spfx & 8)) {
        return 0;
    }
    line = getrumor(bcsign(obj), buf, (1));
    if (!__nh_char_at0(line)) {
        line = "NetHack rumors file closed for renovation.";
    }
    pline("%s:", Tobjnam(obj, "whisper"));
    ;
    verbalize("%s", line);
    return 1;
}
export function artifact_has_invprop(otmp, inv_prop) {
    let arti = get_artifact(otmp);
    return ((arti != artilist[ART_NONARTIFACT]) && (arti.inv_prop == inv_prop));
}
/* Return the price sold to the hero of a given artifact or unique item */
export function arti_cost(otmp) {
    if (!otmp.oartifact) {
        return game.objects[otmp.otyp].oc_cost;
    } else if (artilist[otmp.oartifact].cost) {
        return artilist[otmp.oartifact].cost;
    } else {
        return (100 * game.objects[otmp.otyp].oc_cost);
    }
}
export function abil_to_adtyp(abil) {
    let abil2adtyp = [{ abil: game.u.uprops[FIRE_RES].extrinsic, adtyp: 2 }, { abil: game.u.uprops[COLD_RES].extrinsic, adtyp: 3 }, { abil: game.u.uprops[SHOCK_RES].extrinsic, adtyp: 6 }, { abil: game.u.uprops[ANTIMAGIC].extrinsic, adtyp: 1 }, { abil: game.u.uprops[DISINT_RES].extrinsic, adtyp: 5 }, { abil: game.u.uprops[POISON_RES].extrinsic, adtyp: 7 }, { abil: game.u.uprops[DRAIN_RES].extrinsic, adtyp: 15 }];
    let k = 0;
    for (k = 0; k < (Math.trunc(7 /* sizeof(struct abil2adtyp_tag [7]) */ / 1 /* sizeof(struct abil2adtyp_tag) */)); k++) {
        if (abil2adtyp[k].abil == abil) {
            return abil2adtyp[k].adtyp;
        }
    }
    return 0;
}
const __abil_to_spfx_abil2spfx = [{ abil: game.u.uprops[SEARCHING].extrinsic, spfx: 512 }, { abil: game.u.uprops[HALLUC_RES].extrinsic, spfx: 2048 }, { abil: game.u.uprops[TELEPAT].extrinsic, spfx: 4096 }, { abil: game.u.uprops[STEALTH].extrinsic, spfx: 8192 }, { abil: game.u.uprops[REGENERATION].extrinsic, spfx: 16384 }, { abil: game.u.uprops[TELEPORT_CONTROL].extrinsic, spfx: 262144 }, { abil: game.u.uprops[WARN_OF_MON].extrinsic, spfx: 32 }, { abil: game.u.uprops[WARNING].extrinsic, spfx: 32 }, { abil: game.u.uprops[ENERGY_REGENERATION].extrinsic, spfx: 32768 }, { abil: game.u.uprops[HALF_SPDAM].extrinsic, spfx: 65536 }, { abil: game.u.uprops[HALF_PHDAM].extrinsic, spfx: 131072 }, { abil: game.u.uprops[REFLECTING].extrinsic, spfx: 67108864 }];
export function abil_to_spfx(abil) {
    let k = 0;
    for (k = 0; k < (Math.trunc(12 /* sizeof(const struct abil2spfx_tag [12]) */ / 1 /* sizeof(const struct abil2spfx_tag) */)); k++) {
        if (__abil_to_spfx_abil2spfx[k].abil == abil) {
            return __abil_to_spfx_abil2spfx[k].spfx;
        }
    }
    return 0;
}
/*
 * Return the first item that is conveying a particular intrinsic.
 */
export function what_gives(abil) {
    let obj = null;
    let dtyp = 0;
    let spfx = 0;
    let wornbits = 0;
    let wornmask = (1 | 2 | 4 | 8 | 16 | 32 | 64 | 65536 | 131072 | 262144 | 524288 | 4096 | 8192);
    if (game.u.twoweap) {
        wornmask |= 1024;
    }
    dtyp = abil_to_adtyp(abil);
    spfx = abil_to_spfx(abil);
    wornbits = (wornmask & abil.value);
    for (obj = game.invent; obj; obj = obj.nobj) {
        if (obj.oartifact && (abil != game.u.uprops[WARN_OF_MON].extrinsic || game.context.warntype.obj)) {
            let art = get_artifact(obj);
            if (art != artilist[ART_NONARTIFACT]) {
                if (dtyp) {
                    if (art.cary.adtyp == dtyp || (art.defn.adtyp == dtyp && (obj.owornmask & ~(4096 | 8192)))) {
                        return obj;
                    }
                }
                if (spfx) {
                    /* property conferred when carried */
                    if ((art.cspfx & spfx) == spfx) {
                        return obj;
                    }
                    /* property conferred when wielded or worn */
                    if ((art.spfx & spfx) == spfx && obj.owornmask) {
                        return obj;
                    }
                }
                if (obj == game.uwep && abil == game.u.uprops[BLND_RES].extrinsic && (abil.value & 256) != 0) {
                    return obj;
                }
            }
        } else {
            if (wornbits && wornbits == (wornmask & obj.owornmask)) {
                return obj;
            }
        }
    }
    return null;
}
export function glow_color(arti_indx) {
    let colornum = artilist[arti_indx].acolor;
    let colorstr = clr2colorname(colornum);
    return hcolor(colorstr);
}
/* glow verb; [0] holds the value used when blind */
const glow_verbs = ["quiver", "flicker", "glimmer", "gleam"];
/* relative strength that Sting is glowing (0..3), to select verb */
export function glow_strength(count) {
    /* glow strength should also be proportional to proximity and
       probably difficulty, but we don't have that information and
       gathering it is more trouble than this would be worth */
    return (count > 12) ? 3 : (count > 4) ? 2 : (count > 0);
}
/* 0 means blind rather than no applicable creatures */
let __glow_verb_resbuf = '';
export function glow_verb(count, ingsfx) {
    __glow_verb_resbuf = strcpy(__glow_verb_resbuf, glow_verbs[glow_strength(count)]);
    /* ing_suffix() will double the last consonant for all the words
       we're using and none of them should have that, so bypass it */
    if (ingsfx) {
        __glow_verb_resbuf = strcat(__glow_verb_resbuf, "ing");
    }
    return __glow_verb_resbuf;
}
/* use for warning "glow" for Sting, Orcrist, and Grimtooth */
/* new count (warn_obj_cnt is old count);
                    * -1 is a flag value */
export function Sting_effects(orc_count) {
    if (is_art(game.uwep, ART_STING) || is_art(game.uwep, ART_ORCRIST) || is_art(game.uwep, ART_GRIMTOOTH)) {
        let oldstr = glow_strength(game.warn_obj_cnt);
        let newstr = glow_strength(orc_count);
        if (orc_count == -1 && game.warn_obj_cnt > 0) {
            /* -1 means that blindness has just been toggled; give a
               'continue' message that eventual 'stop' message will match */
            pline("%s is %s.", bare_artifactname(game.uwep), glow_verb(((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? 0 : game.warn_obj_cnt, (1)));
        } else if (newstr > 0 && newstr != oldstr) {
            /* goto_level() -> docrt() -> see_monsters() -> Sting_effects();
               if "you materialize on a different level" is pending, give
               it now so that start-glowing message comes after it */
            /* usually called by goto_level() */
            maybe_lvltport_feedback();
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s %s %s%c", bare_artifactname(game.uwep), otense(game.uwep, glow_verb(orc_count, (0))), glow_color(game.uwep.oartifact), (newstr > oldstr) ? 33 : 46);
            } else if (oldstr == 0) {
                pline("%s %s slightly.", bare_artifactname(game.uwep), otense(game.uwep, glow_verb(0, (0))));
            }
        } else if (orc_count == 0 && game.warn_obj_cnt > 0) {
            pline("%s stops %s.", bare_artifactname(game.uwep), glow_verb(((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? 0 : game.warn_obj_cnt, (1)));
        }
    }
}
/* called when hero is wielding/applying/invoking a carried item, or
   after undergoing a transformation (alignment change, lycanthropy,
   polymorph) which might affect item access */
/* might be destroyed or unintentionally dropped */
/* whether to drop it if hero can longer touch it */
export function retouch_object(objp, loseit) {
    let obj = objp.value;
    if (obj.otyp == BELL_OF_OPENING && invocation_pos(game.u.ux, game.u.uy) && !On_stairs(game.u.ux, game.u.uy)) {
        return 1;
    }
    if (touch_artifact(obj, game.youmonst)) {
        let buf = '';
        let dmg = 0;
        let tmp = 0;
        let ag = (game.objects[obj.otyp].oc_material == SILVER && (game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data)));
        let bane = bane_applies(get_artifact(obj), game.youmonst);
        /* nothing else to do if hero can successfully handle this object */
        if (!ag && !bane) {
            return 1;
        }
        /* hero can't handle this object, but didn't get touch_artifact()'s
           "<obj> evades your grasp|control" message; give an alternate one */
        You_cant("handle %s%s!", yname(obj), obj.owornmask ? " anymore" : "");
        if (!game.touch_blasted) {
            /* also inflict damage unless touch_artifact() already did so */
            let what = killer_xname(obj);
            if (ag && !obj.oartifact && !bane) {
                /* 'obj' is silver; for rings and wands it ended up that
                   way due to randomization at start of game; showing this
                   game's silver item without stating that it is silver
                   potentially leads to confusion about cause of death */
                /* for anything else, stick with killer_xname() */
                if (obj.oclass == RING_CLASS) {
                    what = "a silver ring";
                } else if (obj.oclass == WAND_CLASS) {
                    what = "a silver wand";
                }
            }
            /* damage is somewhat arbitrary; half the usual 1d20 physical
               for silver, 1d10 magical for <foo>bane, potentially both */
            if (ag) {
                tmp = rnd(10) , dmg += (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((tmp) + 1) / 2)) : (tmp));
            }
            if (bane) {
                dmg += rnd(10);
            }
            buf = sprintf(buf, "handling %s", what);
            losehp(dmg, buf, 1);
            exercise(A_CON, (0));
        }
    }
    if (obj.owornmask) {
        /* removing a worn item might result in loss of levitation,
       dropping the hero onto a polymorph trap or into water or
       lava and potentially dropping or destroying the item */
        let otmp = null;
        remove_worn_item(obj, (0));
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if (otmp == obj) {
                break;
            }
        }
        if (!otmp) {
            objp.value = obj = null;
        }
    }
    if (loseit && obj) {
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            /* if we still have it and caller wants us to drop it, do so now */
            freeinv(obj);
            hitfloor(obj, (1));
        } else {
            /* dropx gives a message if a dropped item lands on an altar;
               we provide one for other terrain */
            if (!((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR)) {
                pline("%s to the %s.", Tobjnam(obj, "fall"), surface(game.u.ux, game.u.uy));
            }
            dropx(obj);
        }
        objp.value = obj = null;
    }
    return 0;
}
/* hero has changed form or alignment; an item which is worn/wielded
   or an artifact which conveys something via being carried or which
   has an #invoke effect currently in operation undergoes a touch test;
   if it fails, it will be unworn/unwielded and maybe dropped */
/* object to test; in invent or is steed's saddle */
/* whether to drop it if it can't be touched */
export function untouchable(obj, drop_untouchable) {
    let art = null;
    let beingworn = 0;
    let carryeffect = 0;
    let invoked = 0;
    let wearmask = ~(512 | (game.u.twoweap ? 0 : 1024) | 2097152);
    /* never Null; this pacifies static analysis when
                      * the get_artifact() macro tests 'obj' for Null */
    beingworn = (obj && ((obj.owornmask & wearmask) != 0 || (obj.oclass == TOOL_CLASS && (obj.lamplit || (obj.otyp == LEASH && obj.corpsenm) || (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) && ((obj).cobj != null))))));
    if ((art = get_artifact(obj)) != artilist[ART_NONARTIFACT]) {
        /* some items in use don't have any wornmask setting */
        carryeffect = (art.cary.adtyp || art.cspfx);
        invoked = (art.inv_prop > 0 && art.inv_prop <= LAST_PROP && (game.u.uprops[art.inv_prop].extrinsic & 8192) != 0);
    } else {
        carryeffect = invoked = (0);
    }
    if (beingworn || carryeffect || invoked) {
        if (!retouch_object({ get value() { return obj; }, set value(_v) { obj = _v; } }, drop_untouchable)) {
            /* "<artifact> is beyond your control" or "you can't handle
               <object>" has been given and it is now unworn/unwielded
               and possibly dropped (depending upon caller); if dropped,
               carried effect was turned off, else we leave that alone;
               we turn off invocation property here if still carried */
            if (invoked && obj) {
                arti_invoke(obj);
            }
            return (1);
        }
    }
    return (0);
}
/* check all items currently in use (mostly worn) for touchability */
/* 0==don't drop, 1==drop all, 2==drop weapon */
let __retouch_equipment_nesting = 0;
export function retouch_equipment(dropflag) {
    let obj = null;
    let dropit = 0;
    let had_gloves = (game.uarmg != null);
    let had_rings = (!!game.uleft + !!game.uright);
    /*
     * We can potentially be called recursively if losing/unwearing
     * an item causes worn helm of opposite alignment to come off or
     * be destroyed.
     *
     * BUG: if the initial call was due to putting on a helm of
     * opposite alignment and it does come off to trigger recursion,
     * after the inner call executes, the outer call will finish
     * using the non-helm alignment rather than the helm alignment
     * which triggered this in the first place.
     */
    if (!__retouch_equipment_nesting++) {
        clear_bypasses();
    }
    dropit = (dropflag > 0);
    if (game.u.twoweap) {
        /* check secondary weapon first, before possibly unwielding primary */
        /* so loop below won't process it again */
        bypass_obj(game.uswapwep);
        untouchable(game.uswapwep, dropit);
    }
    if (game.uwep) {
        /* check primary weapon next so that they're handled together */
        bypass_obj(game.uwep);
        untouchable(game.uwep, dropit);
    }
    if (game.u.usteed && (obj = which_armor(game.u.usteed, 1048576)) != null) {
        /* in case someone is daft enough to add artifact or silver saddle */
        /* untouchable() calls retouch_object() which expects an object in
           hero's inventory, but remove_worn_item() will be harmless for
           saddle and we're suppressing drop, so this works as intended */
        if (untouchable(obj, (0))) {
            dismount_steed(DISMOUNT_THROWN);
        }
    }
    /*
     * TODO?  Force off gloves if either or both rings are going to
     * become unworn; force off cloak [suit] before suit [shirt].
     * The torso handling is hypothetical; the case for gloves is
     * not, due to the possibility of unwearing silver rings.
     */
    dropit = (dropflag == 1);
    /* loss of levitation (silver ring, or Heart of Ahriman invocation)
       might cause hero to lose inventory items (by dropping into lava,
       for instance), so inventory traversal needs to rescan the whole
       gi.invent chain each time it moves on to another object; we use bypass
       handling to keep track of which items have already been processed */
    while ((obj = nxt_unbypassed_obj(game.invent)) != null) {
        untouchable(obj, dropit);
    }
    if (had_rings != (!!game.uleft + !!game.uright) && game.uarmg && game.uarmg.cursed) {
        uncurse(game.uarmg);
    }
    /* temporary? hack for ring removal plausibility */
    if (had_gloves && !game.uarmg) {
        selftouch("After losing your gloves, you");
    }
    if (!--__retouch_equipment_nesting) {
        clear_bypasses();
    }
}
export function count_surround_traps(x, y) {
    let levp = null;
    let o = null;
    let dx = 0;
    let dy = 0;
    let glyph = 0;
    let ret = 0;
    for (dx = x - 1; dx < x + 2; ++dx) {
        for (dy = y - 1; dy < y + 2; ++dy) {
            if (!isok(dx, dy)) {
                continue;
            }
            /* If a trap is shown here, don't count it; the hero
             * should be expecting it.  But if there is a trap here
             * that's not shown, either undiscovered or covered by
             * something, do count it.
             */
            glyph = glyph_at(dx, dy);
            if (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1)))) {
                continue;
            }
            if (t_at(dx, dy)) {
                ++ret;
                continue;
            }
            levp = game.level.locations[dx][dy];
            if (((levp.typ) == DOOR) && (levp.flags & 16) != 0) {
                ++ret;
                continue;
            }
            for (o = game.level.objects[dx][dy]; o; o = o.v.v_nexthere) {
                if (((o).otyp >= LARGE_BOX && (o).otyp <= BAG_OF_TRICKS) && o.otrapped) {
                    /* we're counting locations, so just */
                    ++ret;
                    break;
                }
            }
        }
    }
    /*
     * [Shouldn't we also check inventory for a trapped container?
     * Even if its trap has already been found, there's no 'tknown'
     * flag to help hero remember that so we have nothing comparable
     * to a shown glyph to justify skipping it.]
     */
    return ret;
}
/* sense adjacent traps if wielding MKoT without wearing gloves */
const __mkot_trap_warn_heat = ["cool", "slightly warm", "warm", "very warm", "hot", "very hot", "like fire"];
export function mkot_trap_warn() {
    if (!game.uarmg && is_art(game.uwep, ART_MASTER_KEY_OF_THIEVERY)) {
        let idx = 0;
        let ntraps = count_surround_traps(game.u.ux, game.u.uy);
        if (ntraps != game.mkot_trap_warn_count) {
            idx = ((ntraps) < ((Math.trunc(7 /* sizeof(const char *const [7]) */ / 1 /* sizeof(const char *const) */)) - 1) ? (ntraps) : ((Math.trunc(7 /* sizeof(const char *const [7]) */ / 1 /* sizeof(const char *const) */)) - 1));
            pline_The("Key feels %s%c", __mkot_trap_warn_heat[idx], (ntraps > 3) ? 33 : 46);
        }
        game.mkot_trap_warn_count = ntraps;
    } else {
        game.mkot_trap_warn_count = 0;
    }
}
/* Master Key is magic key if its bless/curse state meets our criteria:
   not cursed for rogues or blessed for non-rogues */
/* if null, non-rogue is assumed */
export function is_magic_key(mon, obj) {
    if (is_art(obj, ART_MASTER_KEY_OF_THIEVERY)) {
        if ((mon == game.youmonst) ? (game.urole.mnum == (PM_ROGUE)) : (mon && mon.data == game.mons[PM_ROGUE])) {
            return !obj.cursed;
        }
        /* a rogue; non-cursed suffices for magic */
        /* not a rogue; key must be blessed to behave as a magic one */
        return obj.blessed;
    }
    return (0);
}
/* figure out whether 'mon' (usually youmonst) is carrying the magic key */
/* if null, hero assumed */
export function has_magic_key(mon) {
    let o = null;
    let key = artilist[ART_MASTER_KEY_OF_THIEVERY].otyp;
    if (!mon) {
        mon = game.youmonst;
    }
    for (o = ((mon == game.youmonst) ? game.invent : mon.minvent); o; o = nxtobj(o, key, (0))) {
        if (is_magic_key(mon, o)) {
            return o;
        }
    }
    return null;
}
/* #define is_art(o,art) ((o) && (o)->oartifact == (art)) */
export function is_art(obj, art) {
    if (obj && obj.oartifact == art) {
        return (1);
    }
    return (0);
}
/* #define get_artifact(o) \
    (((o) && ((o)->artifact > 0 && (o)->artifact < AFTER_LAST_ARTIFACT)) \
                             ? &artilist[(int) (o)->oartifact] \
                             : &artilist[ART_NONARTIFACT]) */
export function get_artifact(obj) {
    if (obj) {
        let artidx = obj.oartifact;
        /* skip 0, 1st artifact at 1 */
        /* SIZE(artilist) would include the terminator,
           so use AFTER_LAST_ARTIFACT instead */
        if (artidx > 0 && artidx < AFTER_LAST_ARTIFACT) {
            return artilist[artidx];
        }
    }
    return artilist[ART_NONARTIFACT];
}
/* is object permanently poisoned? (currently only Grimtooth) */
export function permapoisoned(obj) {
    return (obj && is_art(obj, ART_GRIMTOOTH));
}
/* SFCTOOL */
/*artifact.c*/
/* otherwise, otmp has not changed; just fallthrough to return it */
/* artifacts aren't created in containers but could be
                    inside one if it comes from a bones level */
/* perhaps probing, or seeing monster wield artifact */
/* catchall: probably in inventory, picked up while
                        blind but now seen; there's no previous_where to
                        figure out how it got here */
/*case AD_BLND: -- gives infravision but does not prevent blindness */
/*case AD_FAMN: -- slows digestion but does not override Famine */
/* blocks disease but not slime */
/* paralysis => free action */
/* confers speed so blocks speed removal */
/* petrification resistance */
/* SILVER_DRAGON_SCALES don't resist any particular attack type */
/* .exists and .found have different punctuation because
                   they're expected to be combined with one of these */
/* 'tmpwin' here is a text window, not a menu */
/* "The Platinum Yendorian Express Card" is 35 characters */
