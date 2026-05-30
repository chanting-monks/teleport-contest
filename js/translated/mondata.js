/* NetHack 5.0	mondata.c	$NHDT-Date: 1738638877 2025/02/03 19:14:37 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.140 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 *      These routines provide basic data for any type of monster.
 */
/* set up an individual monster's base type (initial creation, shapechange) */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { strcmp, strcpy, strlen, strncmp, strncmpi, strstri } from '../c2js-runtime/string.js';
import { defends, defends_when_carried, is_art } from './artifact.js';
import { acurr } from './attrib.js';
import { title_to_mon } from './botl.js';
import { cg } from './decl.js';
import { canseemon, sensemon } from './display.js';
import { def_char_to_monclass, def_monsyms } from './drawing.js';
import { is_fainted } from './eat.js';
import { dist2, highc } from './hacklib.js';
import { ACID_RES, ALCHEMY_SMOCK, ALL_TRAPS, AMULET_OF_MAGICAL_BREATHING, ANTIMAGIC, ARMOR_CLASS, ART_EXCALIBUR, A_CHA, BLINDED, BLINDING_VENOM, BLND_RES, COLD_RES, CREAM_PIE, DEF_INVISIBLE, DISINT_RES, DRAIN_RES, FEMALE, FIRE_RES, GRAY_DRAGON_SCALES, GRAY_DRAGON_SCALE_MAIL, HALLUC, HALLUC_RES, INVIS, LOW_PM, MAGICAL_BREATHING, MALE, MAXMCLASSES, MS_BURBLE, MS_BUZZ, MS_SILENT, M_SEEN_ACID, M_SEEN_COLD, M_SEEN_DISINT, M_SEEN_ELEC, M_SEEN_FIRE, M_SEEN_MAGR, M_SEEN_NOTHING, M_SEEN_POISON, M_SEEN_REFL, M_SEEN_SLEEP, NEUTRAL, NON_PM, NO_TRAP, NUMMONS, NUM_MGENDERS, PM_ACOLYTE, PM_AIR_ELEMENTAL, PM_ALIGNED_CLERIC, PM_AMOROUS_DEMON, PM_ANGEL, PM_APPRENTICE, PM_ARCHEOLOGIST, PM_ARCH_LICH, PM_ASMODEUS, PM_ATTENDANT, PM_BABY_BLACK_DRAGON, PM_BABY_BLUE_DRAGON, PM_BABY_CROCODILE, PM_BABY_GOLD_DRAGON, PM_BABY_GRAY_DRAGON, PM_BABY_GREEN_DRAGON, PM_BABY_LONG_WORM, PM_BABY_ORANGE_DRAGON, PM_BABY_PURPLE_WORM, PM_BABY_RED_DRAGON, PM_BABY_SILVER_DRAGON, PM_BABY_WHITE_DRAGON, PM_BABY_YELLOW_DRAGON, PM_BALROG, PM_BALUCHITHERIUM, PM_BAT, PM_BLACK_DRAGON, PM_BLACK_NAGA, PM_BLACK_NAGA_HATCHLING, PM_BLACK_UNICORN, PM_BLUE_DRAGON, PM_CAPTAIN, PM_CAVE_DWELLER, PM_CAVE_SPIDER, PM_CHICKATRICE, PM_CLAY_GOLEM, PM_CLERIC, PM_COCKATRICE, PM_CROCODILE, PM_DEATH, PM_DEMILICH, PM_DJINNI, PM_DOG, PM_DUST_VORTEX, PM_DWARF, PM_DWARF_LEADER, PM_DWARF_RULER, PM_EARTH_ELEMENTAL, PM_ELF, PM_ELF_NOBLE, PM_ELVEN_MONARCH, PM_ENERGY_VORTEX, PM_ERINYS, PM_FAMINE, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FOG_CLOUD, PM_FREEZING_SPHERE, PM_GARGOYLE, PM_GIANT_BAT, PM_GIANT_MIMIC, PM_GIANT_RAT, PM_GIANT_SPIDER, PM_GLASS_GOLEM, PM_GNOME, PM_GNOME_LEADER, PM_GNOME_RULER, PM_GOLDEN_NAGA, PM_GOLDEN_NAGA_HATCHLING, PM_GOLD_DRAGON, PM_GOLD_GOLEM, PM_GRAY_DRAGON, PM_GRAY_OOZE, PM_GRAY_UNICORN, PM_GREEN_DRAGON, PM_GREEN_ELF, PM_GREMLIN, PM_GREY_ELF, PM_GUARDIAN_NAGA, PM_GUARDIAN_NAGA_HATCHLING, PM_HEALER, PM_HELL_HOUND, PM_HELL_HOUND_PUP, PM_HIGH_CLERIC, PM_HILL_ORC, PM_HOBBIT, PM_HOMUNCULUS, PM_HORNED_DEVIL, PM_HORSE, PM_HOUSECAT, PM_HUMAN_WEREJACKAL, PM_HUMAN_WERERAT, PM_HUMAN_WEREWOLF, PM_ICE_VORTEX, PM_IRON_GOLEM, PM_KEYSTONE_KOP, PM_KILLER_BEE, PM_KITTEN, PM_KI_RIN, PM_KNIGHT, PM_KOBOLD, PM_KOBOLD_LEADER, PM_KOBOLD_MUMMY, PM_KOBOLD_ZOMBIE, PM_KOP_KAPTAIN, PM_KOP_LIEUTENANT, PM_KOP_SERGEANT, PM_LARGE_CAT, PM_LARGE_DOG, PM_LARGE_KOBOLD, PM_LARGE_MIMIC, PM_LEATHER_GOLEM, PM_LEMURE, PM_LICH, PM_LIEUTENANT, PM_LITTLE_DOG, PM_LONG_WORM, PM_LONG_WORM_TAIL, PM_LURKER_ABOVE, PM_MANES, PM_MARILITH, PM_MASTER_ASSASSIN, PM_MASTER_LICH, PM_MASTER_MIND_FLAYER, PM_MASTER_OF_THIEVES, PM_MIND_FLAYER, PM_MINOTAUR, PM_MORDOR_ORC, PM_MUMAK, PM_OGRE, PM_OGRE_LEADER, PM_OGRE_TYRANT, PM_OLOG_HAI, PM_ORANGE_DRAGON, PM_ORC, PM_ORC_CAPTAIN, PM_PAGE, PM_PAPER_GOLEM, PM_PESTILENCE, PM_PONY, PM_PURPLE_WORM, PM_QUEEN_BEE, PM_RAVEN, PM_RED_DRAGON, PM_RED_NAGA, PM_RED_NAGA_HATCHLING, PM_ROCK_MOLE, PM_SALAMANDER, PM_SERGEANT, PM_SEWER_RAT, PM_SHADE, PM_SHOCKING_SPHERE, PM_SILVER_DRAGON, PM_SMALL_MIMIC, PM_SOLDIER, PM_STALKER, PM_STEAM_VORTEX, PM_STONE_GOLEM, PM_STRAW_GOLEM, PM_STUDENT, PM_TENGU, PM_URUK_HAI, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VIOLET_FUNGUS, PM_VLAD_THE_IMPALER, PM_WARHORSE, PM_WATCHMAN, PM_WATCH_CAPTAIN, PM_WATER_DEMON, PM_WATER_ELEMENTAL, PM_WEREJACKAL, PM_WERERAT, PM_WEREWOLF, PM_WHITE_DRAGON, PM_WHITE_UNICORN, PM_WINGED_GARGOYLE, PM_WINTER_WOLF, PM_WINTER_WOLF_CUB, PM_WIZARD, PM_WOODCHUCK, PM_WOODLAND_ELF, PM_WOOD_GOLEM, PM_WOOD_NYMPH, PM_YELLOW_DRAGON, PM_YELLOW_LIGHT, POISON_RES, POT_BLINDNESS, P_NONE, REFLECTING, SHOCK_RES, SLEEP_RES, STONE_RES, STRANGLED, S_ANGEL, S_BLOB, S_CENTAUR, S_DEMON, S_DRAGON, S_EEL, S_ELEMENTAL, S_EYE, S_FUNGUS, S_GHOST, S_GOLEM, S_IMP, S_JELLY, S_KOBOLD, S_LICH, S_LIGHT, S_MIMIC, S_MIMIC_DEF, S_MUMMY, S_NAGA, S_NYMPH, S_OGRE, S_PUDDING, S_RODENT, S_UNICORN, S_VAMPIRE, S_VORTEX, S_WORM, S_WORM_TAIL, S_WRAITH, S_XAN, S_ZOMBIE, S_invisible, TOOL_CLASS, WEAPON_CLASS, YELLOW_DRAGON_SCALES, YELLOW_DRAGON_SCALE_MAIL } from './nh-constants.js';
import { objdescr_is } from './o_init.js';
import { makesingular } from './objnam.js';
import { rn2, rnd } from './rnd.js';
import { is_fshk } from './shk.js';
import { unconscious } from './trap.js';
import { clear_path } from './vision.js';
import { mon_has_amulet } from './wizard.js';
import { which_armor } from './worn.js';

export function set_mon_data(mon, ptr) {
    let new_speed = 0;
    let old_speed = mon.data ? mon.data.mmove : 0;
    let movement_p = (mon == game.youmonst) ? game.u.umovement : mon.movement;
    mon.data = ptr;
    mon.mnum = ((ptr).pmidx);
    if (movement_p) {
        /* used to adjust poly'd hero as well as monsters */
        new_speed = ptr.mmove;
        if (new_speed < old_speed) {
            /* prorate unused movement if new form is slower so that
           it doesn't get extra moves leftover from previous form;
           if new form is faster, leave unused movement as is */
            /*
             * Some static analysis warns that this might divide by 0
               mon->movement = new_speed * mon->movement / old_speed;
             * so add a redundant test to suppress that.
             */
            movement_p *= new_speed;
            /* old > new and new >= 0, so always True */
            if (old_speed > 0) {
                movement_p = Math.trunc(movement_p / old_speed);
            }
        }
    }
    return;
}
/* does monster-type have any attack for a specific type of damage? */
export function attacktype_fordmg(ptr, atyp, dtyp) {
    let a = null;
    for (let __nhi_a = 0; __nhi_a < 6 && (a = ptr.mattk[__nhi_a]); __nhi_a++) {
        if (a.aatyp == atyp && (dtyp == (-1) || a.adtyp == dtyp)) {
            return a;
        }
    }
    return null;
}
/* does monster-type have a particular type of attack */
export function attacktype(ptr, atyp) {
    return attacktype_fordmg(ptr, atyp, (-1)) ? (1) : (0);
}
/* returns True if monster doesn't attack, False if it does */
export function noattacks(ptr) {
    /* Be careful.  We must check the entire string in case it was
     * something such as "ettin zombie corpse".  The calling routine
     * doesn't know about the "corpse" until the monster name has
     * already been taken off the front, so we have to be able to
     * read the name with extraneous stuff such as "corpse" stuck on
     * the end.
     * This causes a problem for names which prefix other names such
     * as "ettin" on "ettin zombie".  In this case we want the _longest_
     * name which exists.
     * This also permits plurals created by adding suffixes such as 's'
     * or 'es'.  Other plurals must still be handled explicitly.
     */
    let i = 0;
    let mattk = ptr.mattk;
    for (i = 0; i < 6; i++) {
        /* AT_BOOM "passive attack" (gas spore's explosion upon death)
           isn't an attack as far as our callers are concerned */
        if (mattk[i].aatyp == 14) {
            continue;
        }
        if (mattk[i].aatyp) {
            /* worn apron confers a pair of resistances but
                   objects[ALCHEMY_SMOCK].oc_oprop can only represent one;
                   we check both so won't need to know which one that is */
            /* omit this; the Eyes of the Overworld have no carry property and
         * their worn property is magic resistance rather than blindness
         * resistance; wearing them blocks blindness without actually
         * preventing it, so don't classify them as providing resistance */
            /* [currently there's no reason to bother matching up
        assorted bugs and blobs with their closest variants] */
            /* neither grows up to become the other; no match */
            return (0);
        }
    }
    return (1);
}
/* does monster-type transform into something else when petrified? */
export function poly_when_stoned(ptr) {
    /* non-stone golems turn into stone golems unless latter is genocided */
    return (((ptr).mlet == S_GOLEM) && ptr != game.mons[PM_STONE_GOLEM] && !(game.mvitals[PM_STONE_GOLEM].mvflags & 2));
}
/* is 'mon' (possibly youmonst) protected against damage type 'adtype' via
   wielded weapon or worn dragon scales? [or by virtue of being a dragon?] */
export function defended(mon, adtyp) {
    let o = null;
    let otemp = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let mndx = 0;
    let is_you = (mon == game.youmonst);
    /* is 'mon' wielding an artifact that protects against 'adtyp'? */
    /* check for resistance granted by wielded weapon */
    /* check for magic resistance granted by wielded weapon */
    o = is_you ? game.uwep : ((mon).mw);
    if (o && o.oartifact && defends(adtyp, o)) {
        return (1);
    }
    /* if 'mon' is an adult dragon, treat it as if it was wearing scales
       so that it has the same benefit as a hero wearing dragon scales */
    mndx = ((mon.data).pmidx);
    if (mndx >= PM_GRAY_DRAGON && mndx <= PM_YELLOW_DRAGON) {
        /* a dragon is its own suit...  if mon is poly'd hero, we don't
           care about embedded scales (uskin) because being a dragon with
           embedded scales is no better than just being a dragon */
        Object.assign(otemp, cg.zeroobj);
        otemp.oclass = ARMOR_CLASS;
        otemp.otyp = GRAY_DRAGON_SCALES + (mndx - PM_GRAY_DRAGON);
        /* defends() and Is_dragon_armor() only care about otyp so ignore
           the rest of otemp's fields */
        o = otemp;
    } else {
        /* ordinary case: not an adult dragon */
        o = is_you ? game.uarm : which_armor(mon, 1);
    }
    /* is 'mon' wearing dragon scales that protect against 'adtyp'? */
    if (o && (((o).otyp >= GRAY_DRAGON_SCALES && (o).otyp <= YELLOW_DRAGON_SCALES) || ((o).otyp >= GRAY_DRAGON_SCALE_MAIL && (o).otyp <= YELLOW_DRAGON_SCALE_MAIL)) && defends(adtyp, o)) {
        return (1);
    }
    return (0);
}
/* returns True if monster resists particular elemental damage;
   handles 'carry' effects of artifacts as well as worn/wielded items */
export function Resists_Elem(mon, propindx) {
    let o = null;
    let slotmask = 0;
    let is_you = (mon == game.youmonst);
    let u_resist = 0;
    let damgtype = 0;
    let rsstmask = 0;
    switch (propindx) {
        /*
     * Main damage/resistance types, mostly matching dragon breath values.
     *  propindx = property index, fire (1), cold, (2) through stone (8);
     *  damgtype = damage type, 2 through 9 (0 and 1 aren't used here);
     *  rsstmask = resistance mask, 1, 2, 4, ..., 64, 128.
     */
        case FIRE_RES:
        case COLD_RES:
        case SLEEP_RES:
        case DISINT_RES:
        case SHOCK_RES:
        case POISON_RES:
        case ACID_RES:
        case STONE_RES:
            damgtype = propindx + 1;
            /* valid for propindx 1..8, damgtype 2..9 */
            rsstmask = 1 << (propindx - 1);
            u_resist = game.u.uprops[propindx].intrinsic || game.u.uprops[propindx].extrinsic;
            /* can't affect eyes while inside monster */
            /* some physical, blind-inducing attacks can be cancelled */
            break;
        /* accept these, but we expect callers to use their routines directly */
        case ANTIMAGIC:
            return resists_magm(mon);
        case DRAIN_RES:
            return resists_drli(mon);
        case BLND_RES:
            return resists_blnd(mon);
        /* M_SEEN_REFL has no corresponding AD_foo type */
        default:
            impossible("Resists_Elem(%d), unexpected property type", propindx);
            return (0);
    }
    if (is_you ? u_resist : ((((mon).data.mresists | (mon).mextrinsics | (mon).mintrinsics) & rsstmask) != 0)) {
        return (1);
    }
    o = is_you ? game.uwep : ((mon).mw);
    if (o && o.oartifact && defends(damgtype, o)) {
        return (1);
    }
    /* check for resistance granted by worn or carried items */
    /* check for magic resistance granted by worn or carried items */
    o = is_you ? game.invent : mon.minvent;
    slotmask = (1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288);
    /* assumes monsters don't wield non-weapons */
    if (!is_you || (game.uwep && (game.uwep.oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)))) {
        slotmask |= 256;
    }
    if (is_you && game.u.twoweap) {
        slotmask |= 1024;
    }
    for (; o; o = o.nobj) {
        if (((o.owornmask & slotmask) != 0 && game.objects[o.otyp].oc_oprop == propindx) || ((o.owornmask & 2) == 2 && o.otyp == ALCHEMY_SMOCK && (propindx == POISON_RES || propindx == ACID_RES)) || (o.oartifact && defends_when_carried(damgtype, o))) {
            return (1);
        }
    }
    return (0);
}
/* returns True if monster is drain-life resistant */
export function resists_drli(mon) {
    let ptr = mon.data;
    if ((((ptr).mflags2 & 2) != 0) || (((ptr).mflags2 & 256) != 0) || (((ptr).mflags2 & 4) != 0) || (mon == game.youmonst && game.u.ulycn >= LOW_PM) || ptr == game.mons[PM_DEATH] || ((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) {
        return (1);
    }
    /* is_were() doesn't handle hero in human form */
    return defended(mon, 15);
}
/* True if monster is magic-missile (actually, general magic) resistant */
export function resists_magm(mon) {
    let ptr = mon.data;
    let is_you = (mon == game.youmonst);
    let slotmask = 0;
    let o = null;
    /* as of 3.2.0:  gray dragons, Angels, Oracle, Yeenoghu */
    if (dmgtype(ptr, 1) || ptr == game.mons[PM_BABY_GRAY_DRAGON] || dmgtype(ptr, 242)) {
        return (1);
    }
    o = is_you ? game.uwep : ((mon).mw);
    if (o && o.oartifact && defends(1, o)) {
        return (1);
    }
    o = is_you ? game.invent : mon.minvent;
    slotmask = (1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288);
    if (!is_you || (game.uwep && (game.uwep.oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)))) {
        slotmask |= 256;
    }
    if (is_you && game.u.twoweap) {
        slotmask |= 1024;
    }
    for (; o; o = o.nobj) {
        if (((o.owornmask & slotmask) != 0 && game.objects[o.otyp].oc_oprop == ANTIMAGIC) || (o.oartifact && defends_when_carried(1, o))) {
            return (1);
        }
    }
    return (0);
}
/* True if monster is resistant to light-induced blindness */
export function resists_blnd(mon) {
    let ptr = mon.data;
    let is_you = (mon == game.youmonst);
    if (is_you ? (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.multi < 0 && (unconscious() || is_fainted()))) : (mon.mblinded || !mon.mcansee || !(((ptr).mflags1 & 4096) == 0) || mon.msleeping)) {
        return (1);
    }
    /* BUG: temporary sleep sets mfrozen, but since
                          paralysis does too, we can't check it */
    /* yellow light, Archon; !dust vortex, !cobra, !raven */
    if (dmgtype_fromattack(ptr, 11, 13) || dmgtype_fromattack(ptr, 11, 15)) {
        return (1);
    }
    if (resists_blnd_by_arti(mon)) {
        return (1);
    }
    if (is_you && (game.u.uprops[BLND_RES].intrinsic || game.u.uprops[BLND_RES].extrinsic)) {
        impossible("'Blnd_resist' but not resists_blnd()?");
        return (1);
    }
    return (0);
}
/* True iff monster is resistant to light-induced blindness due to worn
   or wielded magical equipment (used to decide whether to show sparkle
   animation when resisting) */
export function resists_blnd_by_arti(mon) {
    let o = null;
    let is_you = (mon == game.youmonst);
    o = is_you ? game.uwep : ((mon).mw);
    if (o && o.oartifact && defends(11, o)) {
        return (1);
    }
    o = is_you ? game.invent : mon.minvent;
    for (; o; o = o.nobj) {
        if (defends_when_carried(11, o)) {
            return (1);
        }
    }
    return (0);
}
/* True iff monster can be blinded by the given attack;
   note: may return True when mdef is blind (e.g. new cream-pie attack)
   magr can be NULL.
*/
/* NULL == no specific aggressor */
/* aatyp == AT_WEAP, AT_SPIT */
export function can_blnd(magr, mdef, aatyp, obj) {
    let is_you = (mdef == game.youmonst);
    let check_visor = (0);
    let o = null;
    /* no eyes protect against all attacks for now */
    if (!(((mdef.data).mflags1 & 4096) == 0)) {
        return (0);
    }
    /* if monster has been permanently blinded, the deed is already done */
    if (!is_you && (!mdef.mcansee && !mdef.mblinded)) {
        return (0);
    }
    /* /corvus oculum corvi non eruit/
       a saying expressed in Latin rather than a zoological observation:
       "a crow will not pluck out the eye of another crow"
       so prevent ravens from blinding each other */
    if (magr && magr.data == game.mons[PM_RAVEN] && mdef.data == game.mons[PM_RAVEN]) {
        return (0);
    }
    switch (aatyp) {
        case 13:
        case 14:
        case 15:
        case 255:
        case 12:
            /* other objects cannot cause blindness yet */
            if (magr && magr.mcan) {
                return (0);
            }
            /* light-based attacks may be cancelled or resisted */
            return !resists_blnd(mdef);
        case 254:
        case 10:
        case 0:
            if (obj && (obj.otyp == CREAM_PIE)) {
                /* an object is used (thrown/spit/other) */
                if (is_you && game.u.uprops[BLINDED].extrinsic) {
                    return (0);
                }
            } else if (obj && (obj.otyp == BLINDING_VENOM)) {
                /* all ublindf, including LENSES, protect, cream-pies too */
                if (is_you && (game.ublindf || game.u.ucreamed)) {
                    return (0);
                }
                check_visor = (1);
            } else if (obj && (obj.otyp == POT_BLINDNESS)) {
                return (1);
            } else {
                return (0);
            }
            /* e.g. raven: all ublindf, including LENSES, protect */
            if ((magr == game.youmonst) && game.u.uswallow) {
                return (0);
            }
            break;
        case 11:
            if (is_you && (game.u.uprops[BLINDED].extrinsic || (game.multi < 0 && (unconscious() || is_fainted())) || game.u.ucreamed)) {
                return (0);
            }
            if (!is_you && mdef.msleeping) {
                return (0);
            }
            break;
        case 1:
            if (is_you && game.ublindf) {
                return (0);
            }
            if ((magr == game.youmonst) && game.u.uswallow) {
                return (0);
            }
            check_visor = (1);
            break;
        case 5:
        case 6:
            if (magr && magr.mcan) {
                return (0);
            }
            break;
        default:
            break;
    }
    if (check_visor) {
        /* check if wearing a visor (only checked if visor might help) */
        o = (mdef == game.youmonst) ? game.invent : mdef.minvent;
        for (; o; o = o.nobj) {
            if ((o.owornmask & 4) && objdescr_is(o, "visored helmet")) {
                return (0);
            }
        }
    }
    return (1);
}
/* returns True if monster can attack at range */
export function ranged_attk(ptr) {
    let i = 0;
    for (i = 0; i < 6; i++) {
        if (((ptr.mattk[i].aatyp) == 10 || (ptr.mattk[i].aatyp) == 12 || (ptr.mattk[i].aatyp) == 255 || (ptr.mattk[i].aatyp) == 15)) {
            return (1);
        }
    }
    return (0);
}
/*
 * If adding a new monster, include a guestimate for difficulty,
 * build the program, then run it in wizard mode and use the
 * #mondifficulty command.  If it reports a discrepancy, update
 * the monsters array with the more accurate value (or possibly
 * modify the 'mstrength()' algorithm to generate the guessed one).
 */
/* This routine is designed to return an integer value which represents
   an approximation of monster strength.  It uses a similar method of
   determination as "experience()" to arrive at the strength. */
export function mstrength(ptr) {
    let i = 0;
    let tmp2 = 0;
    let n = 0;
    let tmp = ptr.mlevel;
    /* special fixed hp monster */
    if (tmp > 49) {
        tmp = Math.trunc(2 * (tmp - 6) / 4);
    }
    n = (!!(ptr.geno & 128));
    n += (!!(ptr.geno & 64)) << 1;
    if (mstrength_ranged_attk(ptr)) {
        n++;
    }
    n += (ptr.ac < 4);
    n += (ptr.ac < 0);
    n += (ptr.mmove >= 18);
    for (i = 0; i < 6; i++) {
        /* for each attack and "special" attack */
        tmp2 = ptr.mattk[i].aatyp;
        n += (tmp2 > 0);
        n += (tmp2 == 255);
        n += (tmp2 == 254 && (ptr.mflags2 & 67108864));
        if (tmp2 == 13) {
            let tmp3 = ptr.mattk[i].adtyp;
            /* {freezing,flaming,shocking} spheres are fairly weak but
               can destroy equipment; {yellow,black} lights can't */
            n += ((tmp3 == 3 || tmp3 == 2) ? 3 : (tmp3 == 6) ? 5 : 0);
        }
    }
    for (i = 0; i < 6; i++) {
        /* for each "special" damage type */
        tmp2 = ptr.mattk[i].adtyp;
        if ((tmp2 == 15) || (tmp2 == 18) || (tmp2 == 7) || (tmp2 == 30) || (tmp2 == 31) || (tmp2 == 29)) {
            n += 2;
        } else if (strcmp(ptr.pmnames[NEUTRAL], "grid bug")) {
            n += (tmp2 != 0);
        }
        n += ((ptr.mattk[i].damd * ptr.mattk[i].damn) > 23);
    }
    /* Leprechauns are a special case.  They have many hit dice so they can
       hit and are hard to kill, but they don't really do much damage. */
    if (!strcmp(ptr.pmnames[NEUTRAL], "leprechaun")) {
        n -= 2;
    }
    /* despite group and poison increments, soldier ants and killer bees are
       underestimated by the formula, so have an artificial +1 difficulty */
    if (!strcmp(ptr.pmnames[NEUTRAL], "killer bee") || !strcmp(ptr.pmnames[NEUTRAL], "soldier ant")) {
        n += 2;
    }
    if (n == 0) {
        tmp -= 1;
    } else if (n < 6) {
        tmp += (Math.trunc(n / 3) + 1);
    /* +1 after 'tmp += n/2' below */
    /* finally, adjust the monster level  0 <= n <= 24 (approx.) */
    } else {
        tmp += (Math.trunc(n / 2));
    }
    return (tmp >= 0) ? tmp : 0;
}
/* returns True if monster can attack at range */
export function mstrength_ranged_attk(ptr) {
    let i = 0;
    let j = 0;
    let atk_mask = (1 << 12) | (1 << 10) | (1 << 15);
    for (i = 0; i < 6; i++) {
        if ((j = ptr.mattk[i].aatyp) >= 254 || (j < 32 && (atk_mask & (1 << j)) != 0)) {
            return (1);
        }
    }
    return (0);
}
/* (NH_DEVEL_STATUS != NH_STATUS_RELEASED) || DEBUG || MAKEDEFS_C */
/* True if specific monster is especially affected by silver weapons */
export function mon_hates_silver(mon) {
    return (((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER) || hates_silver(mon.data));
}
/* True if monster-type is especially affected by silver weapons */
export function hates_silver(ptr) {
    return ((((ptr).mflags2 & 4) != 0) || ptr.mlet == S_VAMPIRE || (((ptr).mflags2 & 256) != 0) || ptr == game.mons[PM_SHADE] || (ptr.mlet == S_IMP && ptr != game.mons[PM_TENGU]));
}
/* True if specific monster is especially affected by blessed objects */
export function mon_hates_blessings(mon) {
    return (((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER) || hates_blessings(mon.data));
}
/* True if monster-type is especially affected by blessed objects */
export function hates_blessings(ptr) {
    return ((((ptr).mflags2 & 2) != 0) || (((ptr).mflags2 & 256) != 0));
}
/* True if specific monster is especially affected by light-emitting weapons */
export function mon_hates_light(mon) {
    return ((mon.data) == game.mons[PM_GREMLIN]);
}
/* True iff the type of monster pass through iron bars */
export function passes_bars(mptr) {
    return ((((mptr).mflags1 & 8) != 0) || (((mptr).mflags1 & 4) != 0) || (((mptr).mflags1 & 1048576) != 0) || ((mptr).mlet == S_VORTEX || (mptr) == game.mons[PM_AIR_ELEMENTAL]) || ((mptr).msize < 1) || dmgtype(mptr, 24) || dmgtype(mptr, 42) || (((mptr).mflags1 & 2147483648) != 0) || ((((mptr).mflags1 & 524288) != 0) && !((mptr).msize >= 3)));
}
/* returns True if monster can blow (whistle, etc) */
export function can_blow(mtmp) {
    if ((((mtmp.data).msound == MS_SILENT) || mtmp.data.msound == MS_BUZZ) && ((((mtmp.data).mflags1 & 1024) != 0) || ((mtmp.data).msize < 1) || !(((mtmp.data).mflags1 & 32768) == 0) || mtmp.data.mlet == S_EEL)) {
        return (0);
    }
    if ((mtmp == game.youmonst) && game.u.uprops[STRANGLED].intrinsic) {
        return (0);
    }
    return (1);
}
/* for casting spells and reading scrolls while blind */
export function can_chant(mtmp) {
    if ((mtmp == game.youmonst && game.u.uprops[STRANGLED].intrinsic) || ((mtmp.data).msound == MS_SILENT) || !(((mtmp.data).mflags1 & 32768) == 0) || mtmp.data.msound == MS_BUZZ || mtmp.data.msound == MS_BURBLE) {
        return (0);
    }
    return (1);
}
/* True if mon is vulnerable to strangulation */
export function can_be_strangled(mon) {
    let mamul = null;
    let nonbreathing = 0;
    let nobrainer = 0;
    /* For amulet of strangulation support:  here we're considering
       strangulation to be loss of blood flow to the brain due to
       constriction of the arteries in the neck, so all headless
       creatures are immune (no neck) as are mindless creatures
       who don't need to breathe (brain, if any, doesn't care).
       Mindless creatures who do need to breath are vulnerable, as
       are non-breathing creatures which have higher brain function. */
    if (!(((mon.data).mflags1 & 32768) == 0)) {
        return (0);
    }
    if (mon == game.youmonst) {
        /* hero can't be mindless but poly'ing into mindless form can
           confer strangulation protection */
        nobrainer = (((game.youmonst.data).mflags1 & 65536) != 0);
        nonbreathing = (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0));
    } else {
        nobrainer = (((mon.data).mflags1 & 65536) != 0);
        /* monsters don't wear amulets of magical breathing,
           so second part doesn't achieve anything useful... */
        nonbreathing = ((((mon.data).mflags1 & 1024) != 0) || ((mamul = which_armor(mon, 65536)) != null && (mamul.otyp == AMULET_OF_MAGICAL_BREATHING)));
    }
    return (!nobrainer || !nonbreathing);
}
/* returns True if monster can track well */
export function can_track(ptr) {
    if (is_art(game.uwep, ART_EXCALIBUR)) {
        return (1);
    }
    return (((ptr).mflags1 & 4096) == 0);
}
/* creature will slide out of armor */
export function sliparm(ptr) {
    return (((ptr).mlet == S_VORTEX || (ptr) == game.mons[PM_AIR_ELEMENTAL]) || ptr.msize <= 1 || ((ptr).mlet == S_GHOST));
}
/* creature will break out of armor */
export function breakarm(ptr) {
    if (sliparm(ptr)) {
        return (0);
    }
    return (((ptr).msize >= 3) || (ptr.msize > 1 && !(((ptr).mflags1 & 131072) != 0)) || ptr == game.mons[PM_MARILITH] || ptr == game.mons[PM_WINGED_GARGOYLE]);
}
/* creature sticks other creatures it hits */
export function sticks(ptr) {
    return (dmgtype(ptr, 19) || (dmgtype(ptr, 28) && !attacktype(ptr, 11)) || attacktype(ptr, 7));
}
/* some monster-types can't vomit */
export function cantvomit(ptr) {
    /* rats and mice are incapable of vomiting; likewise with horses;
       which other creatures have the same limitation? */
    if (ptr.mlet == S_RODENT && ptr != game.mons[PM_ROCK_MOLE] && ptr != game.mons[PM_WOODCHUCK]) {
        return (1);
    }
    if (ptr == game.mons[PM_WARHORSE] || ptr == game.mons[PM_HORSE] || ptr == game.mons[PM_PONY]) {
        return (1);
    }
    return (0);
}
/* number of horns this type of monster has on its head */
export function num_horns(ptr) {
    switch (((ptr).pmidx)) {
        case PM_HORNED_DEVIL:
        case PM_MINOTAUR:
        case PM_ASMODEUS:
        case PM_BALROG:
            return 2;
        case PM_WHITE_UNICORN:
        case PM_GRAY_UNICORN:
        case PM_BLACK_UNICORN:
        case PM_KI_RIN:
            return 1;
        default:
            break;
    }
    return 0;
}
/* does monster-type deal out a particular type of damage from a particular
   type of attack? */
export function dmgtype_fromattack(ptr, dtyp, atyp) {
    let a = null;
    for (let __nhi_a = 0; __nhi_a < 6 && (a = ptr.mattk[__nhi_a]); __nhi_a++) {
        if (a.adtyp == dtyp && (atyp == (-1) || a.aatyp == atyp)) {
            return a;
        }
    }
    return null;
}
/* does monster-type deal out a particular type of damage from any attack */
export function dmgtype(ptr, dtyp) {
    return dmgtype_fromattack(ptr, dtyp, (-1)) ? (1) : (0);
}
/* returns the maximum damage a defender can do to the attacker via
   a passive defense */
export function max_passive_dmg(mdef, magr) {
    let i = 0;
    let dmg = 0;
    let multi2 = 0;
    let adtyp = 0;
    for (i = 0; i < 6; i++) {
        switch (magr.data.mattk[i].aatyp) {
            /* each attack by magr can result in passive damage */
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 11:
            case 16:
            case 254:
                multi2++;
                break;
            default:
                break;
        }
    }
    dmg = 0;
    for (i = 0; i < 6; i++) {
        if (mdef.data.mattk[i].aatyp == 0 || mdef.data.mattk[i].aatyp == 14) {
            adtyp = mdef.data.mattk[i].adtyp;
            if ((adtyp == 2 && ((magr.data) == game.mons[PM_PAPER_GOLEM] || (magr.data) == game.mons[PM_STRAW_GOLEM])) || (adtyp == 34 && ((magr.data) == game.mons[PM_WOOD_GOLEM] || (magr.data) == game.mons[PM_LEATHER_GOLEM])) || (adtyp == 24 && ((magr.data) == game.mons[PM_IRON_GOLEM]))) {
                dmg = magr.mhp;
            } else if ((adtyp == 8 && !Resists_Elem(magr, ACID_RES)) || (adtyp == 3 && !Resists_Elem(magr, COLD_RES)) || (adtyp == 2 && !Resists_Elem(magr, FIRE_RES)) || (adtyp == 6 && !Resists_Elem(magr, SHOCK_RES)) || adtyp == 0) {
                dmg = mdef.data.mattk[i].damn;
                if (!dmg) {
                    dmg = mdef.data.mlevel + 1;
                }
                dmg *= mdef.data.mattk[i].damd;
            }
            dmg *= multi2;
            break;
        }
    }
    return dmg;
}
/* determine whether two monster types are from the same species */
export function same_race(pm1, pm2) {
    let let1 = pm1.mlet;
    let let2 = pm2.mlet;
    if (pm1 == pm2) {
        return (1);
    }
    /* player races have their own predicates */
    if ((((pm1).mflags2 & 8) != 0)) {
        return (((pm2).mflags2 & 8) != 0);
    }
    if ((((pm1).mflags2 & 16) != 0)) {
        return (((pm2).mflags2 & 16) != 0);
    }
    if ((((pm1).mflags2 & 32) != 0)) {
        return (((pm2).mflags2 & 32) != 0);
    }
    if ((((pm1).mflags2 & 64) != 0)) {
        return (((pm2).mflags2 & 64) != 0);
    }
    if ((((pm1).mflags2 & 128) != 0)) {
        return (((pm2).mflags2 & 128) != 0);
    }
    /* other creatures are less precise */
    if ((((pm1).mflags2 & 8192) != 0)) {
        return (((pm2).mflags2 & 8192) != 0);
    }
    if (((pm1).mlet == S_GOLEM)) {
        return ((pm2).mlet == S_GOLEM);
    }
    if (((pm1) == game.mons[PM_MIND_FLAYER] || (pm1) == game.mons[PM_MASTER_MIND_FLAYER])) {
        return ((pm2) == game.mons[PM_MIND_FLAYER] || (pm2) == game.mons[PM_MASTER_MIND_FLAYER]);
    }
    if (let1 == S_KOBOLD || pm1 == game.mons[PM_KOBOLD_ZOMBIE] || pm1 == game.mons[PM_KOBOLD_MUMMY]) {
        return (let2 == S_KOBOLD || pm2 == game.mons[PM_KOBOLD_ZOMBIE] || pm2 == game.mons[PM_KOBOLD_MUMMY]);
    }
    if (let1 == S_OGRE) {
        return (let2 == S_OGRE);
    }
    if (let1 == S_NYMPH) {
        return (let2 == S_NYMPH);
    }
    if (let1 == S_CENTAUR) {
        return (let2 == S_CENTAUR);
    }
    if (((pm1).mlet == S_UNICORN && (((pm1).mflags2 & 536870912) != 0))) {
        return ((pm2).mlet == S_UNICORN && (((pm2).mflags2 & 536870912) != 0));
    }
    if (let1 == S_DRAGON) {
        return (let2 == S_DRAGON);
    }
    if (let1 == S_NAGA) {
        return (let2 == S_NAGA);
    }
    /* other critters get steadily messier */
    if (((pm1) == game.mons[PM_DEATH] || (pm1) == game.mons[PM_FAMINE] || (pm1) == game.mons[PM_PESTILENCE])) {
        return ((pm2) == game.mons[PM_DEATH] || (pm2) == game.mons[PM_FAMINE] || (pm2) == game.mons[PM_PESTILENCE]);
    }
    if ((((pm1).mflags2 & 4096) != 0)) {
        return (((pm2).mflags2 & 4096) != 0);
    }
    /* tengu don't match imps (first test handled case of both being tengu) */
    if (pm1 == game.mons[PM_TENGU] || pm2 == game.mons[PM_TENGU]) {
        return (0);
    }
    if (let1 == S_IMP) {
        return (let2 == S_IMP);
    } else if (let2 == S_IMP) {
        return (0);
    }
    /* and minor demons (imps) don't match major demons */
    if ((((pm1).mflags2 & 256) != 0)) {
        return (((pm2).mflags2 & 256) != 0);
    }
    if ((((pm1).mflags2 & 2) != 0)) {
        if (let1 == S_ZOMBIE) {
            return (let2 == S_ZOMBIE);
        }
        if (let1 == S_MUMMY) {
            return (let2 == S_MUMMY);
        }
        if (let1 == S_VAMPIRE) {
            return (let2 == S_VAMPIRE);
        }
        if (let1 == S_LICH) {
            return (let2 == S_LICH);
        }
        if (let1 == S_WRAITH) {
            return (let2 == S_WRAITH);
        }
        if (let1 == S_GHOST) {
            return (let2 == S_GHOST);
        }
    } else if ((((pm2).mflags2 & 2) != 0)) {
        return (0);
    }
    if (let1 == let2) {
        /* check for monsters which grow into more mature forms */
        let m1 = ((pm1).pmidx);
        let m2 = ((pm2).pmidx);
        let prv = 0;
        let nxt = 0;
        /* we know m1 != m2 (very first check above); test all smaller
           forms of m1 against m2, then all larger ones; don't need to
           make the corresponding tests for variants of m2 against m1 */
        for (prv = m1 , nxt = big_to_little(m1); nxt != prv; prv = nxt , nxt = big_to_little(nxt)) {
            if (nxt == m2) {
                return (1);
            }
        }
        for (prv = m1 , nxt = little_to_big(m1); nxt != prv; prv = nxt , nxt = little_to_big(nxt)) {
            if (nxt == m2) {
                return (1);
            }
        }
    }
    /* not caught by little/big handling */
    if (pm1 == game.mons[PM_GARGOYLE] || pm1 == game.mons[PM_WINGED_GARGOYLE]) {
        return (pm2 == game.mons[PM_GARGOYLE] || pm2 == game.mons[PM_WINGED_GARGOYLE]);
    }
    if (pm1 == game.mons[PM_KILLER_BEE] || pm1 == game.mons[PM_QUEEN_BEE]) {
        return (pm2 == game.mons[PM_KILLER_BEE] || pm2 == game.mons[PM_QUEEN_BEE]);
    }
    if ((((pm1) == game.mons[PM_BABY_LONG_WORM]) || ((pm1) == game.mons[PM_LONG_WORM]) || ((pm1) == game.mons[PM_LONG_WORM_TAIL]))) {
        return (((pm2) == game.mons[PM_BABY_LONG_WORM]) || ((pm2) == game.mons[PM_LONG_WORM]) || ((pm2) == game.mons[PM_LONG_WORM_TAIL]));
    }
    return (0);
}
/* for handling alternate spellings */
// struct alt_spl: { name, pm_val, genderhint }
/* figure out what type of monster a user-supplied string is specifying;
   ignore anything past the monster name */
export function name_to_mon(in_str, gender_name_var) {
    return name_to_monplus(in_str, null, gender_name_var);
}
/* figure out what type of monster a user-supplied string is specifying;
   return a pointer to whatever is past the monster name--necessary if
   caller wants to strip off the name and it matches one of the alternate
   names rather the canonical mons[].mname */
/* More alternates; priest and priestess are separate monster
               types but that isn't the case for {aligned,high} priests */
/* Inappropriate singularization by -ves check above */
/* Potential misspellings where we want to avoid falling back
               to the rank title prefix (input has been singularized) */
/* PM_HIGH_ELF is
                                                        * obsolete */
/* other misspellings or incorrect words */
/* potential guess for
                                                    * polyself */
/* potential guess for
                                              * ^G/#wizgenesis */
/* prefix used to workaround duplicate monster names for
               monsters with alternate forms */
/* Hyphenated names -- it would be nice to handle these via
               fuzzymatch() but it isn't able to ignore trailing stuff */
const __name_to_monplus_names = [{ name: "grey dragon", pm_val: PM_GRAY_DRAGON, genderhint: NEUTRAL }, { name: "baby grey dragon", pm_val: PM_BABY_GRAY_DRAGON, genderhint: NEUTRAL }, { name: "grey unicorn", pm_val: PM_GRAY_UNICORN, genderhint: NEUTRAL }, { name: "grey ooze", pm_val: PM_GRAY_OOZE, genderhint: NEUTRAL }, { name: "gray-elf", pm_val: PM_GREY_ELF, genderhint: NEUTRAL }, { name: "mindflayer", pm_val: PM_MIND_FLAYER, genderhint: NEUTRAL }, { name: "master mindflayer", pm_val: PM_MASTER_MIND_FLAYER, genderhint: NEUTRAL }, { name: "aligned priest", pm_val: PM_ALIGNED_CLERIC, genderhint: MALE }, { name: "aligned priestess", pm_val: PM_ALIGNED_CLERIC, genderhint: FEMALE }, { name: "high priest", pm_val: PM_HIGH_CLERIC, genderhint: MALE }, { name: "high priestess", pm_val: PM_HIGH_CLERIC, genderhint: FEMALE }, { name: "master of thief", pm_val: PM_MASTER_OF_THIEVES, genderhint: NEUTRAL }, { name: "master thief", pm_val: PM_MASTER_OF_THIEVES, genderhint: NEUTRAL }, { name: "master of assassin", pm_val: PM_MASTER_ASSASSIN, genderhint: NEUTRAL }, { name: "master-lich", pm_val: PM_MASTER_LICH, genderhint: NEUTRAL }, { name: "masterlich", pm_val: PM_MASTER_LICH, genderhint: NEUTRAL }, { name: "invisible stalker", pm_val: PM_STALKER, genderhint: NEUTRAL }, { name: "high-elf", pm_val: PM_ELVEN_MONARCH, genderhint: NEUTRAL }, { name: "wood-elf", pm_val: PM_WOODLAND_ELF, genderhint: NEUTRAL }, { name: "wood elf", pm_val: PM_WOODLAND_ELF, genderhint: NEUTRAL }, { name: "woodland nymph", pm_val: PM_WOOD_NYMPH, genderhint: NEUTRAL }, { name: "halfling", pm_val: PM_HOBBIT, genderhint: NEUTRAL }, { name: "genie", pm_val: PM_DJINNI, genderhint: NEUTRAL }, { name: "human wererat", pm_val: PM_HUMAN_WERERAT, genderhint: NEUTRAL }, { name: "human werejackal", pm_val: PM_HUMAN_WEREJACKAL, genderhint: NEUTRAL }, { name: "human werewolf", pm_val: PM_HUMAN_WEREWOLF, genderhint: NEUTRAL }, { name: "rat wererat", pm_val: PM_WERERAT, genderhint: NEUTRAL }, { name: "jackal werejackal", pm_val: PM_WEREJACKAL, genderhint: NEUTRAL }, { name: "wolf werewolf", pm_val: PM_WEREWOLF, genderhint: NEUTRAL }, { name: "ki rin", pm_val: PM_KI_RIN, genderhint: NEUTRAL }, { name: "kirin", pm_val: PM_KI_RIN, genderhint: NEUTRAL }, { name: "uruk hai", pm_val: PM_URUK_HAI, genderhint: NEUTRAL }, { name: "orc captain", pm_val: PM_ORC_CAPTAIN, genderhint: NEUTRAL }, { name: "woodland elf", pm_val: PM_WOODLAND_ELF, genderhint: NEUTRAL }, { name: "green elf", pm_val: PM_GREEN_ELF, genderhint: NEUTRAL }, { name: "grey elf", pm_val: PM_GREY_ELF, genderhint: NEUTRAL }, { name: "gray elf", pm_val: PM_GREY_ELF, genderhint: NEUTRAL }, { name: "elf lady", pm_val: PM_ELF_NOBLE, genderhint: FEMALE }, { name: "elf lord", pm_val: PM_ELF_NOBLE, genderhint: MALE }, { name: "elf noble", pm_val: PM_ELF_NOBLE, genderhint: NEUTRAL }, { name: "olog hai", pm_val: PM_OLOG_HAI, genderhint: NEUTRAL }, { name: "arch lich", pm_val: PM_ARCH_LICH, genderhint: NEUTRAL }, { name: "archlich", pm_val: PM_ARCH_LICH, genderhint: NEUTRAL }, { name: "incubi", pm_val: PM_AMOROUS_DEMON, genderhint: MALE }, { name: "succubi", pm_val: PM_AMOROUS_DEMON, genderhint: FEMALE }, { name: "violet fungi", pm_val: PM_VIOLET_FUNGUS, genderhint: NEUTRAL }, { name: "homunculi", pm_val: PM_HOMUNCULUS, genderhint: NEUTRAL }, { name: "baluchitheria", pm_val: PM_BALUCHITHERIUM, genderhint: NEUTRAL }, { name: "lurkers above", pm_val: PM_LURKER_ABOVE, genderhint: NEUTRAL }, { name: "cavemen", pm_val: PM_CAVE_DWELLER, genderhint: MALE }, { name: "cavewomen", pm_val: PM_CAVE_DWELLER, genderhint: FEMALE }, { name: "watchmen", pm_val: PM_WATCHMAN, genderhint: NEUTRAL }, { name: "djinn", pm_val: PM_DJINNI, genderhint: NEUTRAL }, { name: "mumakil", pm_val: PM_MUMAK, genderhint: NEUTRAL }, { name: "erinyes", pm_val: PM_ERINYS, genderhint: NEUTRAL }, { name: null, pm_val: NON_PM, genderhint: NEUTRAL }];
export function name_to_monplus(in_str, remainder_p, gender_name_var) {
    let i = 0;
    let mntmp = NON_PM;
    let s = null;
    let str = null;
    let term = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let len = 0;
    let mgend = 0;
    let matchgend = -1;
    let slen = 0;
    let exact_match = (0);
    if (remainder_p) {
        remainder_p.value = null;
    }
    str = strcpy(buf, in_str);
    /* Translator gap: C `str += N` advances past leading
       article ("a ", "an ", "the ").  In JS strings,
       string += N is concat — corrupts str.  Use slice(N). */
    if (!strncmp(str, "a ", 2)) {
        str = (typeof str === 'string') ? str.slice(2) : str + 2;
    } else if (!strncmp(str, "an ", 3)) {
        str = (typeof str === 'string') ? str.slice(3) : str + 3;
    } else if (!strncmp(str, "the ", 4)) {
        str = (typeof str === 'string') ? str.slice(4) : str + 4;
    }
    /* length possibly needs recomputing */
    slen = strlen(str);
    /* Translator gap: C `term = str + slen` is a pointer to the end
       of str; subsequent `term - N` / `strcpy(s+N, ...)` use C
       pointer-arith which in JS string-land would corrupt str via
       concat.  The three branches singularize plural forms by
       overwriting the trailing chars with shorter chars (strcpy
       null-terminates so the tail is truncated):
         vortices → vortex   (replace "ices" at s+4 with "ex\0")
         <X>ies   → <X>y     (replace trailing "ies" with "y\0",
                              unless it's "zombies" which keeps its
                              plural treatment elsewhere)
         <X>ves   → <X>f     (replace trailing "ves" with "f\0")
       JS equivalent uses slice + concat to avoid pointer-arith. */
    if (typeof str === 'string') {
        const lc = str.toLowerCase();
        const vIdx = lc.indexOf('vortices');
        if (vIdx >= 0) {
            str = str.slice(0, vIdx + 4) + 'ex';
        } else if (slen > 3 && lc.slice(-3) === 'ies'
                   && (slen < 7 || lc.slice(-7) !== 'zombies')) {
            str = str.slice(0, -3) + 'y';
        } else if (slen > 3 && lc.slice(-3) === 'ves') {
            str = str.slice(0, -3) + 'f';
        }
    } else {
        /* Translated path retains the original pointer-arith for the
           char-array fallback used by callers that didn't go through
           the JS string fast-path. */
        term = str + slen;
        if ((s = strstri(str, "vortices")) != null) {
            strcpy(s + 4, "ex");
        } else if (slen > 3 && !strncmpi((term - 3), ("ies"), -1) && (slen < 7 || strncmpi((term - 7), ("zombies"), -1))) {
            strcpy(term - 3, "y");
        } else if (slen > 3 && !strncmpi((term - 3), ("ves"), -1)) {
            strcpy(term - 3, "f");
        }
    }
    slen = strlen(str);
{
        let namep = null;
        for (let __nhi_namep = 0; (namep = __name_to_monplus_names[__nhi_namep]) && (namep.name); __nhi_namep++) {
            len = strlen(namep.name);
            if (!strncmpi(str, namep.name, len) && (!str[len] || str[len] == 32 || str[len] == 39)) {
                /* force full word (which could conceivably be possessive) */
                if (remainder_p) {
                    /* Translator gap: C `*remainder_p = in_str +
                       (&str[len] - buf)` computes pointer-offset
                       from buf start, then advances in_str by
                       that offset (= len + leading-prefix-skip).
                       Translator emitted `in_str + (str[len] - buf)`
                       which is string + (char_code - array) = NaN
                       concat producing "...NaN" — corrupts
                       remainder_p.  Compute the slice offset
                       directly from in_str's length minus the
                       buf's remaining length at the match. */
                    if (typeof in_str === 'string') {
                        /* slen_remaining = strlen(str) - len: chars
                           after the matched monster name in the
                           normalized buf.  The same chars exist at
                           in_str's tail. */
                        const __slenRemaining = strlen(str) - len;
                        remainder_p.value = in_str.slice(in_str.length - __slenRemaining);
                    } else {
                        remainder_p.value = in_str + (str[len] - buf);
                    }
                }
                if (gender_name_var) {
                    gender_name_var.value = namep.genderhint;
                }
                return namep.pm_val;
            }
        }
    }
    for (len = 0 , i = LOW_PM; i < NUMMONS; i++) {
        for (mgend = MALE; mgend < NUM_MGENDERS; mgend++) {
            let m_i_len = 0;
            if (!game.mons[i].pmnames[mgend]) {
                continue;
            }
            m_i_len = strlen(game.mons[i].pmnames[mgend]);
            if (m_i_len > len && !strncmpi(game.mons[i].pmnames[mgend], str, m_i_len)) {
                if (m_i_len == slen) {
                    mntmp = i;
                    len = m_i_len;
                    matchgend = mgend;
                    exact_match = (1);
                    break;
                /* Translator gap: C `str[m_i_len] == 32` (byte compare
                   to ' ') doesn't work for JS strings — `str[N]` is a
                   1-char STRING, and `'X' == 32` is false.  Use a
                   char-code accessor that works for both string and
                   array.  Without this, name_to_monplus failed to
                   recognize "gray dragon" inside "gray dragon scale
                   mail" (seed0360 wish "blessed +3 gray dragon scale
                   mail" — div at rn2(67) C vs rn2(1) JS at
                   rnd_otyp_by_namedesc). */
                } else if (slen > m_i_len && (((typeof str === 'string') ? str.charCodeAt(m_i_len) : str[m_i_len]) == 32 || !strncmpi((str[m_i_len]), ("s"), -1) || !strncmpi(str[m_i_len], "s ", 2) || !strncmpi((str[m_i_len]), ("'"), -1) || !strncmpi(str[m_i_len], "' ", 2) || !strncmpi((str[m_i_len]), ("'s"), -1) || !strncmpi(str[m_i_len], "'s ", 3) || !strncmpi((str[m_i_len]), ("es"), -1) || !strncmpi(str[m_i_len], "es ", 3))) {
                    mntmp = i;
                    len = m_i_len;
                    matchgend = mgend;
                }
            }
        }
        if (exact_match) {
            break;
        }
    }
    /* FIXME: some titles have gender; title_to_mon() doesn't propagate it */
    if (mntmp == NON_PM) {
        mntmp = title_to_mon(str, null, { get value() { return len; }, set value(_v) { len = _v; } });
    }
    if (len && remainder_p) {
        /* Translator gap (same as line 898 above): C `in_str +
           (&str[len] - buf)` computes pointer-offset from buf start.
           Translator emitted `in_str + (str[len] - buf)` which is
           string + (char_code - array) = NaN concat.  Compute slice
           offset directly from in_str's tail length. */
        if (typeof in_str === 'string') {
            const __slenRemaining = strlen(str) - len;
            remainder_p.value = in_str.slice(in_str.length - __slenRemaining);
        } else {
            remainder_p.value = in_str + (str[len] - buf);
        }
    }
    if (gender_name_var && matchgend != -1) {
        /* don't override with neuter if caller has already specified male
           or female and we've matched the neuter name */
        if (gender_name_var.value == -1 || matchgend != NEUTRAL) {
            gender_name_var.value = matchgend;
        }
    }
    return mntmp;
}
/* monster class from user input; used for genocide and controlled polymorph;
   returns 0 rather than MAXMCLASSES if no match is found */
/* multiple-letter input which matches any of these gets rejected */
const __name_to_monclass_falsematch = ["an", "the", "or", "other", "or other", null];
/* "long worm" won't match "worm" class but would accidentally match
           "long worm tail" class before the comparison with monster types */
/* matches wrong--or at least suboptimal--class */
/* hits "imp or minor demon" */
/* matches specific monster (overly restrictive) */
/* some plausible guesses which need help */
const __name_to_monclass_truematch = [{ name: "long worm", pm_val: PM_LONG_WORM, genderhint: NEUTRAL }, { name: "demon", pm_val: -S_DEMON, genderhint: NEUTRAL }, { name: "devil", pm_val: -S_DEMON, genderhint: NEUTRAL }, { name: "bug", pm_val: -S_XAN, genderhint: NEUTRAL }, { name: "fish", pm_val: -S_EEL, genderhint: NEUTRAL }, { name: null, pm_val: NON_PM, genderhint: NEUTRAL }];
export function name_to_monclass(in_str, mndx_p) {
    /* Single letters are matched against def_monsyms[].sym; words
       or phrases are first matched against def_monsyms[].explain
       to check class description; if not found there, then against
       mons[].pmnames[] to test individual monster types.  Input can be a
       substring of the full description or pmname, but to be accepted,
       such partial matches must start at beginning of a word.  Some
       class descriptions include "foo or bar" and "foo or other foo"
       so we don't want to accept "or", "other", "or other" there. */
    /* positive pm_val => specific monster; negative => class */
    let p = null;
    let x = null;
    let i = 0;
    let len = 0;
    if (mndx_p) {
        mndx_p.value = NON_PM;
    }
    if (!in_str || !in_str[0]) {
        /* haven't [yet] matched a specific type */
        return 0;
    } else if (!in_str[1]) {
        i = def_char_to_monclass(in_str.value);
        if (i == S_MIMIC_DEF) {
            i = S_MIMIC;
        } else if (i == S_WORM_TAIL) {
            i = S_WORM;
            if (mndx_p) {
                mndx_p.value = PM_LONG_WORM;
            }
        } else if (i == MAXMCLASSES) {
            i = (in_str.value == DEF_INVISIBLE) ? S_invisible : 0;
        }
        return i;
    } else {
        /* not enough to match "long worm" */
        if (!strncmpi((in_str), ("long"), -1)) {
            return 0;
        }
        /* avoid false whole-word match with "long worm tail" */
        in_str = makesingular(in_str);
        for (i = 0; __name_to_monclass_falsematch[i]; i++) {
            if (!strncmpi((in_str), (__name_to_monclass_falsematch[i]), -1)) {
                return 0;
            }
        }
        for (i = 0; __name_to_monclass_truematch[i].name; i++) {
            if (!strncmpi((in_str), (__name_to_monclass_truematch[i].name), -1)) {
                i = __name_to_monclass_truematch[i].pm_val;
                if (i < 0) {
                    return -i;
                }
                if (mndx_p) {
                    mndx_p.value = i;
                }
                return game.mons[i].mlet;
            }
        }
        /* check monster class descriptions */
        len = strlen(in_str);
        for (i = 1; i < MAXMCLASSES; i++) {
            x = def_monsyms[i].explain;
            if ((p = strstri(x, in_str)) != null && (p == x || (p - 1) == 32) && (strlen(p) >= len && (p[len] == 0 || p[len] == 32))) {
                return i;
            }
        }
        /* check individual species names */
        i = name_to_mon(in_str, null);
        if (i != NON_PM) {
            if (mndx_p) {
                mndx_p.value = i;
            }
            return game.mons[i].mlet;
        }
    }
    return 0;
}
/* returns 3 values (0=male, 1=female, 2=none) */
export function gender(mtmp) {
    if ((((mtmp.data).mflags2 & 262144) != 0)) {
        return 2;
    }
    return mtmp.female;
}
/* Like gender(), but unseen humanoids are "it" rather than "he" or "she"
   and lower animals and such are "it" even when seen; hallucination might
   yield "they".  This is the one we want to use when printing messages. */
/* flags&1: 'no it' unless neuter,
                        * flags&2: random if hallucinating */
export function pronoun_gender(mtmp, pg_flags) {
    let override_vis = (pg_flags & 1) ? (1) : (0);
    let hallu_rand = (pg_flags & 2) ? (1) : (0);
    if (hallu_rand && (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        return rn2(4);
    }
    if (!override_vis && !(canseemon(mtmp) || sensemon(mtmp))) {
        return 2;
    }
    if ((((mtmp.data).mflags2 & 262144) != 0)) {
        return 2;
    }
    return ((((mtmp.data).mflags1 & 131072) != 0) || (mtmp.data.geno & 4096) || (((mtmp.data).mflags2 & 524288) != 0)) ? mtmp.female : 2;
}
/* used for nearby monsters when you go to another level */
export function levl_follower(mtmp) {
    if (mtmp == game.u.usteed) {
        return (1);
    }
    /* Wizard with Amulet won't bother trying to follow across levels */
    if (mtmp.iswiz && mon_has_amulet(mtmp)) {
        return (0);
    }
    /* some monsters will follow even while intending to flee from you */
    if (mtmp.mtame || mtmp.iswiz || is_fshk(mtmp)) {
        return (1);
    }
    /* stalking types follow, but won't when fleeing unless you hold
       the Amulet */
    return ((mtmp.data.mflags2 & 16777216) && (!mtmp.mflee || game.u.uhave.amulet));
}
const grownups = [[PM_CHICKATRICE, PM_COCKATRICE], [PM_LITTLE_DOG, PM_DOG], [PM_DOG, PM_LARGE_DOG], [PM_HELL_HOUND_PUP, PM_HELL_HOUND], [PM_WINTER_WOLF_CUB, PM_WINTER_WOLF], [PM_KITTEN, PM_HOUSECAT], [PM_HOUSECAT, PM_LARGE_CAT], [PM_PONY, PM_HORSE], [PM_HORSE, PM_WARHORSE], [PM_KOBOLD, PM_LARGE_KOBOLD], [PM_LARGE_KOBOLD, PM_KOBOLD_LEADER], [PM_GNOME, PM_GNOME_LEADER], [PM_GNOME_LEADER, PM_GNOME_RULER], [PM_DWARF, PM_DWARF_LEADER], [PM_DWARF_LEADER, PM_DWARF_RULER], [PM_MIND_FLAYER, PM_MASTER_MIND_FLAYER], [PM_ORC, PM_ORC_CAPTAIN], [PM_HILL_ORC, PM_ORC_CAPTAIN], [PM_MORDOR_ORC, PM_ORC_CAPTAIN], [PM_URUK_HAI, PM_ORC_CAPTAIN], [PM_SEWER_RAT, PM_GIANT_RAT], [PM_CAVE_SPIDER, PM_GIANT_SPIDER], [PM_OGRE, PM_OGRE_LEADER], [PM_OGRE_LEADER, PM_OGRE_TYRANT], [PM_ELF, PM_ELF_NOBLE], [PM_WOODLAND_ELF, PM_ELF_NOBLE], [PM_GREEN_ELF, PM_ELF_NOBLE], [PM_GREY_ELF, PM_ELF_NOBLE], [PM_ELF_NOBLE, PM_ELVEN_MONARCH], [PM_LICH, PM_DEMILICH], [PM_DEMILICH, PM_MASTER_LICH], [PM_MASTER_LICH, PM_ARCH_LICH], [PM_VAMPIRE, PM_VAMPIRE_LEADER], [PM_BAT, PM_GIANT_BAT], [PM_BABY_GRAY_DRAGON, PM_GRAY_DRAGON], [PM_BABY_GOLD_DRAGON, PM_GOLD_DRAGON], [PM_BABY_SILVER_DRAGON, PM_SILVER_DRAGON], [PM_BABY_RED_DRAGON, PM_RED_DRAGON], [PM_BABY_WHITE_DRAGON, PM_WHITE_DRAGON], [PM_BABY_ORANGE_DRAGON, PM_ORANGE_DRAGON], [PM_BABY_BLACK_DRAGON, PM_BLACK_DRAGON], [PM_BABY_BLUE_DRAGON, PM_BLUE_DRAGON], [PM_BABY_GREEN_DRAGON, PM_GREEN_DRAGON], [PM_BABY_YELLOW_DRAGON, PM_YELLOW_DRAGON], [PM_RED_NAGA_HATCHLING, PM_RED_NAGA], [PM_BLACK_NAGA_HATCHLING, PM_BLACK_NAGA], [PM_GOLDEN_NAGA_HATCHLING, PM_GOLDEN_NAGA], [PM_GUARDIAN_NAGA_HATCHLING, PM_GUARDIAN_NAGA], [PM_SMALL_MIMIC, PM_LARGE_MIMIC], [PM_LARGE_MIMIC, PM_GIANT_MIMIC], [PM_BABY_LONG_WORM, PM_LONG_WORM], [PM_BABY_PURPLE_WORM, PM_PURPLE_WORM], [PM_BABY_CROCODILE, PM_CROCODILE], [PM_SOLDIER, PM_SERGEANT], [PM_SERGEANT, PM_LIEUTENANT], [PM_LIEUTENANT, PM_CAPTAIN], [PM_WATCHMAN, PM_WATCH_CAPTAIN], [PM_ALIGNED_CLERIC, PM_HIGH_CLERIC], [PM_STUDENT, PM_ARCHEOLOGIST], [PM_ATTENDANT, PM_HEALER], [PM_PAGE, PM_KNIGHT], [PM_ACOLYTE, PM_CLERIC], [PM_APPRENTICE, PM_WIZARD], [PM_MANES, PM_LEMURE], [PM_KEYSTONE_KOP, PM_KOP_SERGEANT], [PM_KOP_SERGEANT, PM_KOP_LIEUTENANT], [PM_KOP_LIEUTENANT, PM_KOP_KAPTAIN], [NON_PM, NON_PM]];
/* DEFERRED */
export function little_to_big(montype) {
    let i = 0;
    for (i = 0; grownups[i][0] >= LOW_PM; i++) {
        if (montype == grownups[i][0]) {
            montype = grownups[i][1];
            break;
        }
    }
    return montype;
}
export function big_to_little(montype) {
    let i = 0;
    for (i = 0; grownups[i][0] >= LOW_PM; i++) {
        if (montype == grownups[i][1]) {
            montype = grownups[i][0];
            break;
        }
    }
    return montype;
}
/* determine whether two permonst indices are part of the same progression;
   existence of progressions with more than one step makes it a bit tricky */
export function big_little_match(montyp1, montyp2) {
    let l = 0;
    let b = 0;
    /* simplest case: both are same pm */
    if (montyp1 == montyp2) {
        return (1);
    }
    /* assume it isn't possible to grow from one class letter to another */
    if (game.mons[montyp1].mlet != game.mons[montyp2].mlet) {
        return (0);
    }
    /* check whether montyp1 can grow up into montyp2 */
    for (l = montyp1; (b = little_to_big(l)) != l; l = b) {
        if (b == montyp2) {
            return (1);
        }
    }
    /* check whether montyp2 can grow up into montyp1 */
    for (l = montyp2; (b = little_to_big(l)) != l; l = b) {
        if (b == montyp1) {
            return (1);
        }
    }
    return (0);
}
/*
 * Return the permonst ptr for the race of the monster.
 * Returns correct pointer for non-polymorphed and polymorphed
 * player.  It does not return a pointer to player role character.
 */
export function raceptr(mtmp) {
    if (mtmp == game.youmonst && !(game.u.umonnum != game.u.umonster)) {
        return game.mons[game.urace.mnum];
    }
    return mtmp.data;
}
game.levitate = ["float", "Float", "wobble", "Wobble"];
game.flys = ["fly", "Fly", "flutter", "Flutter"];
game.flyl = ["fly", "Fly", "stagger", "Stagger"];
game.slither = ["slither", "Slither", "falter", "Falter"];
/* it would be useful to incorporate "swim" but we lack
                  * sufficient information to know whether water is involved
                 swim = { "swim", "Swim", "flop", "Flop" },
                  */
game.ooze = ["ooze", "Ooze", "tremble", "Tremble"];
game.immobile = ["wiggle", "Wiggle", "pulsate", "Pulsate"];
game.crawl = ["crawl", "Crawl", "falter", "Falter"];
export function locomotion(ptr, def) {
    let locoindx = (def.value != highc(def.value)) ? 0 : 1;
    return (((ptr).mlet == S_EYE || (ptr).mlet == S_LIGHT) ? game.levitate[locoindx] : ((((ptr).mflags1 & 1) != 0) && ptr.msize <= 1) ? game.flys[locoindx] : ((((ptr).mflags1 & 1) != 0) && ptr.msize > 1) ? game.flyl[locoindx] : (((ptr).mflags1 & 524288) != 0) ? game.slither[locoindx] : (((ptr).mflags1 & 4) != 0) ? game.ooze[locoindx] : !ptr.mmove ? game.immobile[locoindx] : (((ptr).mflags1 & 24576) == 24576) ? game.crawl[locoindx] : def);
}
export function stagger(ptr, def) {
    let locoindx = (def.value != highc(def.value)) ? 2 : 3;
    return (((ptr).mlet == S_EYE || (ptr).mlet == S_LIGHT) ? game.levitate[locoindx] : ((((ptr).mflags1 & 1) != 0) && ptr.msize <= 1) ? game.flys[locoindx] : ((((ptr).mflags1 & 1) != 0) && ptr.msize > 1) ? game.flyl[locoindx] : (((ptr).mflags1 & 524288) != 0) ? game.slither[locoindx] : (((ptr).mflags1 & 4) != 0) ? game.ooze[locoindx] : !ptr.mmove ? game.immobile[locoindx] : (((ptr).mflags1 & 24576) == 24576) ? game.crawl[locoindx] : def);
}
/* return phrase describing the effect of fire attack on a type of monster */
export function on_fire(mptr, mattk) {
    let what = null;
    switch (((mptr).pmidx)) {
        case PM_FLAMING_SPHERE:
        case PM_FIRE_VORTEX:
        case PM_FIRE_ELEMENTAL:
        case PM_SALAMANDER:
            what = "already on fire";
            break;
        case PM_WATER_ELEMENTAL:
        case PM_FOG_CLOUD:
        case PM_STEAM_VORTEX:
            what = "boiling";
            break;
        case PM_ICE_VORTEX:
        case PM_GLASS_GOLEM:
            what = "melting";
            break;
        case PM_STONE_GOLEM:
        case PM_CLAY_GOLEM:
        case PM_GOLD_GOLEM:
        case PM_AIR_ELEMENTAL:
        case PM_EARTH_ELEMENTAL:
        case PM_DUST_VORTEX:
        case PM_ENERGY_VORTEX:
            what = "heating up";
            break;
        default:
            what = (mattk.aatyp == 7) ? "being roasted" : "on fire";
            break;
    }
    return what;
}
/* similar to on_fire(); creature is summoned in a cloud of <something> */
export function msummon_environ(mptr, cloud) {
    let what = null;
    let mndx = ((mptr.mlet == S_ANGEL) ? PM_ANGEL : (mptr.mlet == S_LIGHT) ? PM_YELLOW_LIGHT : ((mptr).pmidx));
    /* default is "cloud of <something>" */
    cloud.value = "cloud";
    switch (mndx) {
        case PM_WATER_DEMON:
        case PM_AIR_ELEMENTAL:
        case PM_WATER_ELEMENTAL:
        case PM_FOG_CLOUD:
        case PM_ICE_VORTEX:
        case PM_FREEZING_SPHERE:
            what = "vapor";
            break;
        case PM_STEAM_VORTEX:
            what = "steam";
            break;
        case PM_ENERGY_VORTEX:
        case PM_SHOCKING_SPHERE:
            cloud.value = "shower";
            /* "shower of sparks" instead of "cloud of..." */
            what = "sparks";
            break;
        case PM_EARTH_ELEMENTAL:
        case PM_DUST_VORTEX:
            what = "dust";
            break;
        case PM_FIRE_ELEMENTAL:
        case PM_FIRE_VORTEX:
        case PM_FLAMING_SPHERE:
            cloud.value = "ball";
            /* "ball of flame" instead of "cloud of..." */
            what = "flame";
            break;
        case PM_ANGEL:
        case PM_YELLOW_LIGHT:
            cloud.value = "flash";
            /* "flash of light" instead of "cloud of..." */
            what = "light";
            break;
        default:
            what = "smoke";
            break;
    }
    return what;
}
/*
 * Returns:
 *      True if monster is presumed to have a sense of smell.
 *      False if monster definitely does not have a sense of smell.
 *
 * Do not base this on presence of a head or nose, since many
 * creatures sense smells other ways (feelers, forked-tongues, etc).
 * We're assuming all insects can smell at a distance too.
 */
export function olfaction(mdat) {
    if (((mdat).mlet == S_GOLEM) || mdat.mlet == S_EYE || mdat.mlet == S_JELLY || mdat.mlet == S_PUDDING || mdat.mlet == S_BLOB || mdat.mlet == S_VORTEX || mdat.mlet == S_ELEMENTAL || mdat.mlet == S_FUNGUS || mdat.mlet == S_LIGHT) {
        return (0);
    }
    return (1);
}
/* Convert attack damage type AD_foo to M_SEEN_bar */
export function cvt_adtyp_to_mseenres(adtyp) {
    switch (adtyp) {
        case 1:
            return M_SEEN_MAGR;
        case 2:
            return M_SEEN_FIRE;
        case 3:
            return M_SEEN_COLD;
        case 4:
            return M_SEEN_SLEEP;
        case 5:
            return M_SEEN_DISINT;
        case 6:
            return M_SEEN_ELEC;
        case 7:
            return M_SEEN_POISON;
        case 8:
            return M_SEEN_ACID;
        default:
            return M_SEEN_NOTHING;
    }
}
/* Convert property resistance to M_SEEN_bar */
export function cvt_prop_to_mseenres(prop) {
    switch (prop) {
        case ANTIMAGIC:
            return M_SEEN_MAGR;
        case FIRE_RES:
            return M_SEEN_FIRE;
        case COLD_RES:
            return M_SEEN_COLD;
        case SLEEP_RES:
            return M_SEEN_SLEEP;
        case DISINT_RES:
            return M_SEEN_DISINT;
        case POISON_RES:
            return M_SEEN_POISON;
        case SHOCK_RES:
            return M_SEEN_ELEC;
        case ACID_RES:
            return M_SEEN_ACID;
        case REFLECTING:
            return M_SEEN_REFL;
        default:
            return M_SEEN_NOTHING;
    }
}
/* Monsters in line of sight remember hero resisting effect M_SEEN_foo */
export function monstseesu(seenres) {
    let mtmp = null;
    if (seenres == M_SEEN_NOTHING || game.u.uswallow) {
        return;
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (!((mtmp).mhp < 1) && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0))) {
            ((mtmp).seen_resistance |= (seenres));
        }
    }
}
/* Monsters in line of sight forget hero resistance to M_SEEN_foo */
export function monstunseesu(seenres) {
    let mtmp = null;
    if (seenres == M_SEEN_NOTHING || game.u.uswallow) {
        return;
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (!((mtmp).mhp < 1) && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0))) {
            ((mtmp).seen_resistance &= ~(seenres));
        }
    }
}
/* give monster mtmp the same intrinsics hero has */
export function give_u_to_m_resistances(mtmp) {
    let intr = 0;
    for (intr = FIRE_RES; intr <= STONE_RES; intr++) {
        if ((game.u.uprops[intr].intrinsic & (67108864 | 33554432 | 16777216)) != 0) {
            /* convert the hero's current set of intrinsics to their monster
       equivalents -- FIRE_RES to MR_FIRE, COLD_RES to MR_COLD, etc -- and
       add each to the mintrinsics field for the given monster */
            mtmp.mintrinsics |= ((FIRE_RES <= (intr) && (intr) <= STONE_RES) ? (1 << ((intr) - 1)) : 0);
        }
    }
}
/* Can monster resist conflict caused by hero?

   High-CHA heroes will be able to 'convince' monsters
   (through the magic of the ring, of course) to fight
   for them much more easily than low-CHA ones.
*/
export function resist_conflict(mtmp) {
    /* always a small chance at 19 */
    let resist_chance = ((19) < (((acurr(A_CHA)) - mtmp.m_lev + game.u.ulevel)) ? (19) : (((acurr(A_CHA)) - mtmp.m_lev + game.u.ulevel)));
    return (rnd(20) > resist_chance);
}
/* does monster mtmp know traps of type ttyp */
export function mon_knows_traps(mtmp, ttyp) {
    if (ttyp == ALL_TRAPS) {
        return (mtmp.mtrapseen);
    } else if (ttyp == NO_TRAP) {
        return !(mtmp.mtrapseen);
    } else {
        return ((mtmp.mtrapseen & (1 << (ttyp - 1))) != 0);
    }
}
/* monster mtmp learns all traps of type ttyp */
export function mon_learns_traps(mtmp, ttyp) {
    if (ttyp == ALL_TRAPS) {
        mtmp.mtrapseen = ~0;
    } else if (ttyp == NO_TRAP) {
        mtmp.mtrapseen = 0;
    } else {
        mtmp.mtrapseen |= (1 << (ttyp - 1));
    }
}
/* monsters see a trap trigger, and remember it */
export function mons_see_trap(ttmp) {
    let mtmp = null;
    let tx = ttmp.tx;
    let ty = ttmp.ty;
    let maxdist = game.level.locations[tx][ty].lit ? 7 * 7 : 2;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if ((((mtmp.data).mflags1 & 262144) != 0) || (((mtmp.data).mflags1 & 65536) != 0) || !(((mtmp.data).mflags1 & 4096) == 0) || !mtmp.mcansee) {
            continue;
        }
        if (dist2(mtmp.mx, mtmp.my, tx, ty) > maxdist) {
            continue;
        }
        if (!clear_path((mtmp).mx, (mtmp).my, (tx), (ty))) {
            continue;
        }
        mon_learns_traps(mtmp, ttmp.ttyp);
    }
}
const __get_atkdam_type_rnd_breath_typ = [1, 2, 3, 4, 5, 6, 7, 8];
export function get_atkdam_type(adtyp) {
    if (adtyp == 242) {
        return __get_atkdam_type_rnd_breath_typ[rn2((Math.trunc(32 /* sizeof(const int [8]) */ / 4 /* sizeof(const int) */)))];
    }
    return adtyp;
}
/*mondata.c*/
/* rust monsters and some puddings can destroy bars */
/* special cases of humanoids that cannot wear suits */
/* be careful with "ies"; "priest", "zombies" */
/* luckily no monster names end in fe or ve with ves plurals */
