/* NetHack 5.0	worn.c	$NHDT-Date: 1770949988 2026/02/12 18:33:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.119 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2013. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_hear, pline } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcpy, strncmpi } from '../c2js-runtime/string.js';
import { artifact_light, is_art, set_artifact_intrinsic } from './artifact.js';
import { c_color_names, c_common_strings } from './decl.js';
import { canseemon, newsym } from './display.js';
import { obj_no_longer_held } from './do.js';
import { Mgender, Monnam, hcolor, mon_nam, pmname } from './do_name.js';
import { cancel_doff } from './do_wear.js';
import { surface } from './dungeon.js';
import { s_suffix, strsubst } from './hacklib.js';
import { update_inventory } from './invent.js';
import { arti_light_description } from './light.js';
import { curse, obj_extract_self, place_object } from './mkobj.js';
import { check_gear_next_turn } from './mon.js';
import { breakarm, cvt_prop_to_mseenres, monstunseesu, num_horns, pronoun_gender, raceptr, sliparm } from './mondata.js';
import { m_useup } from './mthrowu.js';
import { ACID_RES, ALCHEMY_SMOCK, AMULET_CLASS, AMULET_OF_GUARDING, AMULET_OF_LIFE_SAVING, AMULET_OF_REFLECTION, ANTIMAGIC, ARMOR_CLASS, ARM_BOOTS, ARM_CLOAK, ARM_GLOVES, ARM_HELM, ARM_SHIELD, ARM_SHIRT, ARM_SUIT, ART_EYES_OF_THE_OVERWORLD, BALL_CLASS, BLINDED, BLINDFOLD, CHAIN_CLASS, CLAIRVOYANT, COLD_RES, CORNUTHAUM, DISINT_RES, DISMOUNT_FELL, DISPLACED, DUNCE_CAP, ELVEN_BOOTS, ELVEN_CLOAK, ELVEN_LEATHER_HELM, ELVEN_MITHRIL_COAT, ELVEN_SHIELD, FAST, FIRE_RES, FLYING, FOOD_CLASS, FUMBLING, GEM_CLASS, GRAY_DRAGON_SCALES, GRAY_DRAGON_SCALE_MAIL, HELM_OF_OPPOSITE_ALIGNMENT, INVIS, JUMPING, LEATHER, LENSES, LEVITATION, MEAT_RING, MUMMY_WRAPPING, NON_PM, PM_AIR_ELEMENTAL, PM_CHICKATRICE, PM_COCKATRICE, PM_GRAY_DRAGON, PM_HOBBIT, PM_LONG_WORM, PM_MARILITH, PM_MONK, PM_SKELETON, PM_WINGED_GARGOYLE, PM_WIZARD, POISON_RES, PROTECTION, P_NONE, REFLECTING, RING_CLASS, RUBBER_HOSE, SADDLE, SEE_INVIS, SHOCK_RES, SLEEP_RES, SPEED_BOOTS, STEALTH, STONE_RES, S_CENTAUR, S_GHOST, S_MUMMY, S_VORTEX, TELEPAT, TIN_OPENER, TOOL_CLASS, TOWEL, WEAPON_CLASS, WWALKING, YELLOW_DRAGON_SCALES, YELLOW_DRAGON_SCALE_MAIL } from './nh-constants.js';
import { discover_object } from './o_init.js';
import { Yname2, an, cloak_simple_name, distant_name, doname, otense, simpleonames } from './objnam.js';
import { pline_mon } from './pline.js';
import { rnl } from './rnd.js';
import { genders } from './role.js';
import { can_ride, can_saddle, dismount_steed } from './steed.js';
import { begin_burn, end_burn } from './timeout.js';
import { instapetrify } from './trap.js';
import { vision_recalc } from './vision.js';
import { mwepgone } from './weapon.js';
import { set_twoweap } from './wield.js';
import { see_wsegs } from './worm.js';
import { learnwand } from './zap.js';

// struct worn: { w_mask, w_obj, w_what }
/* for failing sanity check's feedback */
const worn = [{ w_mask: 1, w_obj: game.uarm, w_what: "suit" }, { w_mask: 2, w_obj: game.uarmc, w_what: "cloak" }, { w_mask: 4, w_obj: game.uarmh, w_what: "helmet" }, { w_mask: 8, w_obj: game.uarms, w_what: "shield" }, { w_mask: 16, w_obj: game.uarmg, w_what: "gloves" }, { w_mask: 32, w_obj: game.uarmf, w_what: "boots" }, { w_mask: 64, w_obj: game.uarmu, w_what: "shirt" }, { w_mask: 131072, w_obj: game.uleft, w_what: "left ring" }, { w_mask: 262144, w_obj: game.uright, w_what: "right ring" }, { w_mask: 256, w_obj: game.uwep, w_what: "weapon" }, { w_mask: 1024, w_obj: game.uswapwep, w_what: "alternate weapon" }, { w_mask: 512, w_obj: game.uquiver, w_what: "quiver" }, { w_mask: 65536, w_obj: game.uamul, w_what: "amulet" }, { w_mask: 524288, w_obj: game.ublindf, w_what: "facewear" }, { w_mask: 2097152, w_obj: game.uball, w_what: "chained ball" }, { w_mask: 4194304, w_obj: game.uchain, w_what: "attached chain" }, { w_mask: 0, w_obj: null, w_what: null }];
/* blindfold|towel|lenses */
/* This only allows for one blocking item per property */
/* note: monsters don't have clairvoyance, so dependency on hero's role here
   has no significant effect on their use of w_blocks() */
/* calc the range of hero's unblind telepathy */
export function recalc_telepat_range() {
    let wp = null;
    let nobjs = 0;
    for (let __nhi_wp = 0; (wp = worn[__nhi_wp]) && (wp.w_mask); __nhi_wp++) {
        let oobj = (wp.w_obj);
        if (oobj && game.objects[oobj.otyp].oc_oprop == TELEPAT) {
            nobjs++;
        }
    }
    /* count all artifacts with SPFX_ESP as one */
    if (game.u.uprops[TELEPAT].extrinsic & 4096) {
        nobjs++;
    }
    if (nobjs) {
        game.u.unblind_telepat_range = (8 * 8) * nobjs;
    } else {
        game.u.unblind_telepat_range = -1;
    }
}
/* Updated to use the extrinsic and blocked fields. */
export function setworn(obj, mask) {
    let wp = null;
    let oobj = null;
    let p = 0;
    if ((mask & (1 | 536870912)) == (1 | 536870912)) {
        /* restoring saved game; no properties are conferred via skin */
        game.uskin = obj;
    } else {
        for (let __nhi_wp = 0; (wp = worn[__nhi_wp]) && (wp.w_mask); __nhi_wp++) {
            if (wp.w_mask & mask) {
                oobj = (wp.w_obj);
                if (oobj && !(oobj.owornmask & wp.w_mask)) {
                    impossible("Setworn: mask=0x%08lx.", wp.w_mask);
                }
                if (oobj) {
                    if (game.u.twoweap && (oobj.owornmask & (256 | 1024))) {
                        set_twoweap((0));
                    }
                    oobj.owornmask &= ~wp.w_mask;
                    if (wp.w_mask & ~(1024 | 512)) {
                        /* leave as "x = x <op> y", here and below, for broken
                         * compilers */
                        p = game.objects[oobj.otyp].oc_oprop;
                        game.u.uprops[p].extrinsic = game.u.uprops[p].extrinsic & ~wp.w_mask;
                        monstunseesu(cvt_prop_to_mseenres(p));
                        /* if the hero removed an extrinsic-granting item,
                           nearby monsters will notice and attempt attacks of
                           that type again */
                        if ((p = ((oobj.otyp == MUMMY_WRAPPING && ((mask) & 2) != 0) ? INVIS : (oobj.otyp == CORNUTHAUM && ((mask) & 4) != 0 && !(game.urole.mnum == (PM_WIZARD))) ? CLAIRVOYANT : (is_art(oobj, ART_EYES_OF_THE_OVERWORLD) && ((mask) & 524288) != 0) ? BLINDED : 0)) != 0) {
                            game.u.uprops[p].blocked &= ~wp.w_mask;
                        }
                        if (oobj.oartifact) {
                            set_artifact_intrinsic(oobj, 0, mask);
                        }
                    }
                    /* in case wearing or removal is in progress or removal
                       is pending (via 'A' command for multiple items) */
                    cancel_doff(oobj, wp.w_mask);
                }
                { const __f = ({1:"uarm",2:"uarmc",4:"uarmh",8:"uarms",16:"uarmg",32:"uarmf",64:"uarmu",131072:"uleft",262144:"uright",256:"uwep",1024:"uswapwep",512:"uquiver",65536:"uamul",524288:"ublindf",2097152:"uball",4194304:"uchain"})[wp.w_mask]; if (__f) game[__f] = obj; }
                if (obj) {
                    obj.owornmask |= wp.w_mask;
                    if (wp.w_mask & ~(1024 | 512)) {
                        if (obj.oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) || mask != 256) {
                            /* Prevent getting/blocking intrinsics from wielding
                     * potions, through the quiver, etc.
                     * Allow weapon-tools, too.
                     * wp_mask should be same as mask at this point.
                     */
                            p = game.objects[obj.otyp].oc_oprop;
                            game.u.uprops[p].extrinsic = game.u.uprops[p].extrinsic | wp.w_mask;
                            if ((p = ((obj.otyp == MUMMY_WRAPPING && ((mask) & 2) != 0) ? INVIS : (obj.otyp == CORNUTHAUM && ((mask) & 4) != 0 && !(game.urole.mnum == (PM_WIZARD))) ? CLAIRVOYANT : (is_art(obj, ART_EYES_OF_THE_OVERWORLD) && ((mask) & 524288) != 0) ? BLINDED : 0)) != 0) {
                                game.u.uprops[p].blocked |= wp.w_mask;
                            }
                        }
                        if (obj.oartifact) {
                            set_artifact_intrinsic(obj, 1, mask);
                        }
                    }
                }
            }
        }
        if (obj && (obj.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) != 0) {
            game.u.uroleplay.nudist = (0);
        }
        /* tux -> tuxedo -> "monkey suit" -> monk's suit */
        game.iflags.tux_penalty = (game.uarm && (game.urole.mnum == (PM_MONK)) && game.urole.spelarmr);
    }
    if ((game.flags.weaponstatus && (mask & 256) != 0) || (game.flags.armorstatus && (mask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) != 0)) {
        game.disp.botl = (1);
    }
    update_inventory();
    recalc_telepat_range();
}
/* called e.g. when obj is destroyed */
/* Updated to use the extrinsic and blocked fields. */
export function setnotworn(obj) {
    let wp = null;
    let p = 0;
    let unworn = 0;
    if (!obj) {
        /* dual wielding: not a slot but lots of things to verify */
        return;
    }
    if (game.u.twoweap && (obj == game.uwep || obj == game.uswapwep)) {
        set_twoweap((0));
    }
    for (let __nhi_wp = 0; (wp = worn[__nhi_wp]) && (wp.w_mask); __nhi_wp++) {
        if (obj == (wp.w_obj)) {
            /* in case wearing or removal is in progress or removal
               is pending (via 'A' command for multiple items) */
            cancel_doff(obj, wp.w_mask);
            { const __f = ({1:"uarm",2:"uarmc",4:"uarmh",8:"uarms",16:"uarmg",32:"uarmf",64:"uarmu",131072:"uleft",262144:"uright",256:"uwep",1024:"uswapwep",512:"uquiver",65536:"uamul",524288:"ublindf",2097152:"uball",4194304:"uchain"})[wp.w_mask]; if (__f) game[__f] = null; }
            unworn |= wp.w_mask;
            p = game.objects[obj.otyp].oc_oprop;
            game.u.uprops[p].extrinsic = game.u.uprops[p].extrinsic & ~wp.w_mask;
            monstunseesu(cvt_prop_to_mseenres(p));
            /* remove this extrinsic from seenres */
            obj.owornmask &= ~wp.w_mask;
            if (obj.oartifact) {
                set_artifact_intrinsic(obj, 0, wp.w_mask);
            }
            if ((p = ((obj.otyp == MUMMY_WRAPPING && ((wp.w_mask) & 2) != 0) ? INVIS : (obj.otyp == CORNUTHAUM && ((wp.w_mask) & 4) != 0 && !(game.urole.mnum == (PM_WIZARD))) ? CLAIRVOYANT : (is_art(obj, ART_EYES_OF_THE_OVERWORLD) && ((wp.w_mask) & 524288) != 0) ? BLINDED : 0)) != 0) {
                game.u.uprops[p].blocked &= ~wp.w_mask;
            }
        }
    }
    if (!game.uarm) {
        game.iflags.tux_penalty = (0);
    }
    if ((game.flags.weaponstatus && (unworn & 256) != 0) || (game.flags.armorstatus && (unworn & (1 | 2 | 4 | 8 | 16 | 32 | 64)) != 0)) {
        game.disp.botl = (1);
    }
    update_inventory();
    recalc_telepat_range();
}
/* called when saving with FREEING flag set has just discarded inventory */
export function allunworn() {
    let wp = null;
    /* uwep and uswapwep are going away */
    game.u.twoweap = 0;
    for (let __nhi_wp = 0; (wp = worn[__nhi_wp]) && (wp.w_mask); __nhi_wp++) {
        { const __f = ({1:"uarm",2:"uarmc",4:"uarmh",8:"uarms",16:"uarmg",32:"uarmf",64:"uarmu",131072:"uleft",262144:"uright",256:"uwep",1024:"uswapwep",512:"uquiver",65536:"uamul",524288:"ublindf",2097152:"uball",4194304:"uchain"})[wp.w_mask]; if (__f) game[__f] = null; }
    }
}
/* return item worn in slot indicated by wornmask; needed by poly_obj() */
export function wearmask_to_obj(wornmask) {
    let wp = null;
    for (let __nhi_wp = 0; (wp = worn[__nhi_wp]) && (wp.w_mask); __nhi_wp++) {
        if (wp.w_mask & wornmask) {
            return wp.w_obj;
        }
    }
    return null;
}
/* convert an armor wornmask to corresponding category */
export function wornmask_to_armcat(mask) {
    let cat = 0;
    switch (mask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) {
        case 1:
            cat = ARM_SUIT;
            break;
        case 2:
            cat = ARM_CLOAK;
            break;
        case 4:
            cat = ARM_HELM;
            break;
        case 8:
            cat = ARM_SHIELD;
            break;
        case 16:
            cat = ARM_GLOVES;
            break;
        case 32:
            cat = ARM_BOOTS;
            break;
        case 64:
            cat = ARM_SHIRT;
            break;
    }
    return cat;
}
/* convert an armor category to corresponding wornmask */
export function armcat_to_wornmask(cat) {
    let mask = 0;
    switch (cat) {
        case ARM_SUIT:
            mask = 1;
            break;
        case ARM_CLOAK:
            mask = 2;
            break;
        case ARM_HELM:
            mask = 4;
            break;
        case ARM_SHIELD:
            mask = 8;
            break;
        case ARM_GLOVES:
            mask = 16;
            break;
        case ARM_BOOTS:
            mask = 32;
            break;
        case ARM_SHIRT:
            mask = 64;
            break;
    }
    return mask;
}
/* return a bitmask of the equipment slot(s) a given item might be worn in */
export function wearslot(obj) {
    let otyp = obj.otyp;
    /* practically any item can be wielded or quivered; it's up to
       our caller to handle such things--we assume "normal" usage */
    /* default: can't be worn anywhere */
    let res = 0;
    switch (obj.oclass) {
        case AMULET_CLASS:
            res = 65536;
            break;
        case RING_CLASS:
            res = 131072 | 262144;
            break;
        case ARMOR_CLASS:
            switch (game.objects[otyp].oc_subtyp) {
                case ARM_SUIT:
                    res = 1;
                    break;
                case ARM_SHIELD:
                    res = 8;
                    break;
                case ARM_HELM:
                    res = 4;
                    break;
                case ARM_GLOVES:
                    res = 16;
                    break;
                case ARM_BOOTS:
                    res = 32;
                    break;
                case ARM_CLOAK:
                    res = 2;
                    break;
                case ARM_SHIRT:
                    res = 64;
                    break;
            }
            break;
        case WEAPON_CLASS:
            res = 256 | 1024;
            if (game.objects[otyp].oc_merge) {
                res |= 512;
            }
            break;
        case TOOL_CLASS:
            if (otyp == BLINDFOLD || otyp == TOWEL || otyp == LENSES) {
                res = 524288;
            } else if (((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) || otyp == TIN_OPENER) {
                res = 256 | 1024;
            } else if (otyp == SADDLE) {
                res = 1048576;
            }
            break;
        case FOOD_CLASS:
            if (obj.otyp == MEAT_RING) {
                res = 131072 | 262144;
            }
            break;
        case GEM_CLASS:
            res = 512;
            break;
        case BALL_CLASS:
            res = 2097152;
            break;
        case CHAIN_CLASS:
            res = 4194304;
            break;
        default:
            break;
    }
    return res;
}
/* for 'sanity_check' option, called by you_sanity_check() */
export function check_wornmask_slots() {
    /* we'll skip ball and chain here--they warrant separate sanity check */
    let whybuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let wp = null;
    let o = null;
    let otmp = null;
    let m = 0;
    for (let __nhi_wp = 0; (wp = worn[__nhi_wp]) && (wp.w_mask); __nhi_wp++) {
        m = wp.w_mask;
        if ((m & (4096 | 8192 | 1048576 | 2097152 | 4194304)) != 0 && (m & ~(4096 | 8192 | 1048576 | 2097152 | 4194304)) == 0) {
            continue;
        }
        if ((o = wp.w_obj) != null) {
            whybuf[0] = 0;
            /* slot pointer (uarm, uwep, &c) is populated; check that object
               is in inventory and has the relevant owornmask bit set */
            for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                if (otmp == o) {
                    break;
                }
            }
            if (!otmp) {
                whybuf = sprintf(whybuf, "%s (%s) not found in invent", wp.w_what, fmt_ptr(o));
            } else if ((o.owornmask & m) == 0) {
                whybuf = sprintf(whybuf, "%s bit not set in owornmask [0x%08lx]", wp.w_what, o.owornmask);
            } else if ((o.owornmask & ~(m | (4096 | 8192 | 1048576 | 2097152 | 4194304))) != 0) {
                whybuf = sprintf(whybuf, "%s wrong bit set in owornmask [0x%08lx]", wp.w_what, o.owornmask);
            }
            if (whybuf[0]) {
                impossible("Worn-slot insanity: %s.", whybuf);
            }
        }
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            /* check whether any item other than the one in the slot pointer
           claims to be worn/wielded in this slot; make this test whether
           'o' is Null or not; [sanity_check_worn(mkobj.c) for object by
           object checking will most likely have already caught this] */
            if (otmp != o && (otmp.owornmask & m) != 0 && (m != 1 || otmp != game.uskin || (otmp.owornmask & 536870912) == 0)) {
                whybuf = sprintf(whybuf, "%s [0x%08lx] has %s mask 0x%08lx bit set", simpleonames(otmp), otmp.owornmask, wp.w_what, m);
                impossible("Worn-slot insanity: %s.", whybuf);
            }
        }
    }
    return;
}
export function mon_set_minvis(mon, cursed_potion) {
    mon.perminvis = !cursed_potion ? 1 : 0;
    if (!mon.invis_blkd) {
        mon.minvis = mon.perminvis;
        /* call stackobj() if we ever drop anything that can merge */
        newsym(mon.mx, mon.my);
        if (mon.wormno) {
            see_wsegs(mon);
        }
    }
}
/* positive => increase speed, negative => decrease */
/* item to make known if effect can be seen */
export function mon_adjust_speed(mon, adjust, obj) {
    let otmp = null;
    let give_msg = !game.in_mklev;
    let petrify = (0);
    let oldspeed = mon.mspeed;
    switch (adjust) {
        case 2:
            mon.permspeed = 2;
            /* special-case monster creation */
            give_msg = (0);
            break;
        case 1:
            if (mon.permspeed == 1) {
                mon.permspeed = 0;
            } else {
                mon.permspeed = 2;
            }
            break;
        /* just check for worn speed boots */
        case 0:
            break;
        case -1:
            if (mon.permspeed == 2) {
                mon.permspeed = 0;
            } else {
                mon.permspeed = 1;
            }
            break;
        case -2:
            mon.permspeed = 1;
            give_msg = (0);
            break;
        case -3:
            if (mon.permspeed == 2) {
                mon.permspeed = 0;
            }
            petrify = (1);
            break;
        case -4:
            if (mon.permspeed == 2) {
                mon.permspeed = 0;
            }
            give_msg = (0);
            break;
    }
    for (otmp = mon.minvent; otmp; otmp = otmp.nobj) {
        if (otmp.owornmask && game.objects[otmp.otyp].oc_oprop == FAST) {
            break;
        }
    }
    if (otmp) {
        mon.mspeed = 2;
    } else {
        mon.mspeed = mon.permspeed;
    }
    if (give_msg && (mon.mspeed != oldspeed || petrify) && mon.data.mmove && !(mon.mfrozen || mon.msleeping) && canseemon(mon)) {
        /* no message if monster is immobile (temp or perm) or unseen */
        /* fast to slow (skipping intermediate state) or vice versa */
        let howmuch = (mon.mspeed + oldspeed == 2 + 1) ? "much " : "";
        if (petrify) {
            /* mimic the player's petrification countdown; "slowing down"
               even if fast movement rate retained via worn speed boots */
            if (game.flags.verbose) {
                pline_mon(mon, "%s is slowing down.", Monnam(mon));
            }
        } else if (adjust > 0 || mon.mspeed == 2) {
            pline_mon(mon, "%s is suddenly moving %sfaster.", Monnam(mon), howmuch);
        } else {
            pline_mon(mon, "%s seems to be moving %sslower.", Monnam(mon), howmuch);
        }
        /* might discover an object if we see the speed change happen */
        if (obj != null) {
            learnwand(obj);
        }
    }
}
/* alchemy smock confers two properties, poison and acid resistance
   but objects[ALCHEMY_SMOCK].oc_oprop can only describe one of them;
   if it is poison resistance, alternate property is acid resistance;
   if someone changes it to acid resistance, alt becomes poison resist;
   if someone changes it to hallucination resistance, all bets are off
   [TODO: handle alternate properties conferred by dragon scales/mail] */
/* armor put on or taken off; might be magical variety */
/* armor being worn or taken off */
export function update_mon_extrinsics(mon, obj, on, silently) {
    let __goto_maybe_blocks = (0);
    let unseen = 0;
    let mask = 0;
    let otmp = null;
    let which = game.objects[obj.otyp].oc_oprop;
    let altwhich = (((obj).otyp == ALCHEMY_SMOCK) ? (POISON_RES + ACID_RES - game.objects[(obj).otyp].oc_oprop) : 0);
    unseen = !canseemon(mon);
    if (!which && !altwhich) {
        __goto_maybe_blocks = (1);
    }
    again: while (true) {
        if (!__goto_maybe_blocks) {
            if (on) {
                switch (which) {
                    /* obj->owornmask has been cleared by this point, so we can't use it.
       However, since monsters don't wield armor, we don't have to guard
       against that and can get away with a blanket worn-mask value. */
                    case INVIS:
                        mon.minvis = !mon.invis_blkd;
                        break;
                    case FAST:
{
                            let save_in_mklev = game.in_mklev;
                            if (silently) {
                                game.in_mklev = (1);
                            }
                            mon_adjust_speed(mon, 0, obj);
                            game.in_mklev = save_in_mklev;
                            break;
                        }
                    /* properties handled elsewhere */
                    case ANTIMAGIC:
                    case REFLECTING:
                    case PROTECTION:
                        break;
                    /* properties which have no effect for monsters */
                    case CLAIRVOYANT:
                    case STEALTH:
                    case TELEPAT:
                        break;
                    /* properties which should have an effect but aren't implemented */
                    case LEVITATION:
                    case FLYING:
                    case WWALKING:
                        break;
                    /* properties which maybe should have an effect but don't */
                    case DISPLACED:
                    case FUMBLING:
                    case JUMPING:
                        break;
                    default:
                        mon.mextrinsics |= ((FIRE_RES <= (which) && (which) <= STONE_RES) ? (1 << ((which) - 1)) : 0);
                        break;
                }
            } else {
                switch (which) {
                    case INVIS:
                        mon.minvis = mon.perminvis;
                        break;
                    case FAST:
{
                            let save_in_mklev = game.in_mklev;
                            if (silently) {
                                game.in_mklev = (1);
                            }
                            mon_adjust_speed(mon, 0, obj);
                            game.in_mklev = save_in_mklev;
                            break;
                        }
                    case FIRE_RES:
                    case COLD_RES:
                    case SLEEP_RES:
                    case DISINT_RES:
                    case SHOCK_RES:
                    case POISON_RES:
                    case ACID_RES:
                    case STONE_RES:
                        mask = ((FIRE_RES <= (which) && (which) <= STONE_RES) ? (1 << ((which) - 1)) : 0);
                        for (otmp = mon.minvent; otmp; otmp = otmp.nobj) {
                            /*
             * Update monster's extrinsics (for worn objects only;
             * 'obj' itself might still be worn or already unworn).
             *
             * If an alchemy smock is being taken off, this code will
             * be run twice (via 'goto again') and other worn gear
             * gets tested for conferring poison resistance on the
             * first pass and acid resistance on the second.
             *
             * If some other item is being taken off, there will be
             * only one pass but a worn alchemy smock will be an
             * alternate source for either of those two resistances.
             */
                            if (otmp == obj || !otmp.owornmask) {
                                /* skip post-switch armor handling */
                                continue;
                            }
                            if (game.objects[otmp.otyp].oc_oprop == which) {
                                break;
                            }
                            /* check whether 'otmp' confers target property as an extra
                   one rather than as the one specified for it in objects[] */
                            if ((((otmp).otyp == ALCHEMY_SMOCK) ? (POISON_RES + ACID_RES - game.objects[(otmp).otyp].oc_oprop) : 0) == which) {
                                break;
                            }
                        }
                        if (!otmp) {
                            mon.mextrinsics &= ~(mask);
                        }
                        break;
                    default:
                        break;
                }
            }
            if (altwhich && which != altwhich) {
                /* worn alchemy smock/apron confers both poison resistance and acid
       resistance to the hero so do likewise for monster who wears one */
                which = altwhich;
                continue again;
            }
        }
        __goto_maybe_blocks = (0);
        switch (((obj.otyp == MUMMY_WRAPPING && ((~0) & 2) != 0) ? INVIS : (obj.otyp == CORNUTHAUM && ((~0) & 4) != 0 && !(game.urole.mnum == (PM_WIZARD))) ? CLAIRVOYANT : (is_art(obj, ART_EYES_OF_THE_OVERWORLD) && ((~0) & 524288) != 0) ? BLINDED : 0)) {
            case INVIS:
                mon.invis_blkd = on ? 1 : 0;
                mon.minvis = on ? 0 : mon.perminvis;
                break;
            default:
                break;
        }
        if (!on && mon == game.u.usteed && obj.otyp == SADDLE) {
            dismount_steed(DISMOUNT_FELL);
        }
        /* if couldn't see it but now can, or vice versa, update display */
        if (!silently && (unseen ^ !canseemon(mon))) {
            newsym(mon.mx, mon.my);
        }
        break;
    }
}
export function find_mac(mon) {
    let obj = null;
    let base = mon.data.ac;
    let mwflags = mon.misc_worn_check;
    for (obj = mon.minvent; obj; obj = obj.nobj) {
        if (obj.owornmask & mwflags) {
            /* since ARM_BONUS is positive, subtracting it increases AC */
            if (obj.otyp == AMULET_OF_GUARDING) {
                base -= 2;
            /* fixed amount, not impacted by erosion */
            } else {
                base -= (game.objects[(obj).otyp].oc_oc1 + (obj).spe - ((((obj).oeroded > (obj).oeroded2 ? (obj).oeroded : (obj).oeroded2)) < (game.objects[(obj).otyp].oc_oc1) ? (((obj).oeroded > (obj).oeroded2 ? (obj).oeroded : (obj).oeroded2)) : (game.objects[(obj).otyp].oc_oc1)));
            }
        }
    }
    /* same cap as for hero [find_ac(do_wear.c)] */
    if (abs(base) > 99) {
        base = sgn(base) * 99;
    }
    return base;
}
/*
 * weapons are handled separately;
 * rings and eyewear aren't used by monsters
 */
/* Wear the best object of each type that the monster has.  During creation,
 * the monster can put everything on at once; otherwise, wearing takes time.
 * This doesn't affect monster searching for objects--a monster may very well
 * search for objects it would not want to wear, because we don't want to
 * check which_armor() each round.
 *
 * We'll let monsters put on shirts and/or suits under worn cloaks, but
 * not shirts under worn suits.  This is somewhat arbitrary, but it's
 * too tedious to have them remove and later replace outer garments,
 * and preventing suits under cloaks makes it a little bit too easy for
 * players to influence what gets worn.  Putting on a shirt underneath
 * already worn body armor is too obviously buggy...
 */
export function m_dowear(mon, creation) {
    let can_wear_armor = 0;
    /* Note the restrictions here are the same as in dowear in do_wear.c
     * except for the additional restriction on intelligence.  (Players
     * are always intelligent, even if polymorphed).
     */
    if (((mon.data).msize < 1) || (((mon.data).mflags1 & 8192) != 0) || (((mon.data).mflags1 & 262144) != 0)) {
        return;
    }
    /* give mummies a chance to wear their wrappings
     * and let skeletons wear their initial armor */
    if ((((mon.data).mflags1 & 65536) != 0) && (!creation || (mon.data.mlet != S_MUMMY && mon.data != game.mons[PM_SKELETON]))) {
        return;
    }
    m_dowear_type(mon, 65536, creation, (0));
    can_wear_armor = !(breakarm(mon.data) || sliparm(mon.data));
    /* can't put on shirt if already wearing suit */
    if (can_wear_armor && !(mon.misc_worn_check & 1)) {
        m_dowear_type(mon, 64, creation, (0));
    }
    /* WrappingAllowed() makes any size between small and huge eligible;
       treating small as a special case allows hobbits, gnomes, and
       kobolds to wear all cloaks; large and huge allows giants and such
       to wear mummy wrappings but not other cloaks */
    if (can_wear_armor || ((((mon.data).mflags1 & 131072) != 0) && (mon.data).msize >= 1 && (mon.data).msize <= 4 && !((mon.data).mlet == S_GHOST) && (mon.data).mlet != S_CENTAUR && (mon.data) != game.mons[PM_WINGED_GARGOYLE] && (mon.data) != game.mons[PM_MARILITH])) {
        m_dowear_type(mon, 2, creation, (0));
    }
    m_dowear_type(mon, 4, creation, (0));
    if (!((mon).mw) || !((((mon).mw).oclass == WEAPON_CLASS || ((mon).mw).oclass == TOOL_CLASS) && game.objects[((mon).mw).otyp].oc_big)) {
        m_dowear_type(mon, 8, creation, (0));
    }
    m_dowear_type(mon, 16, creation, (0));
    if (!(((mon.data).mflags1 & 524288) != 0) && mon.data.mlet != S_CENTAUR) {
        m_dowear_type(mon, 32, creation, (0));
    }
    if (can_wear_armor) {
        m_dowear_type(mon, 1, creation, (0));
    } else {
        m_dowear_type(mon, 1, creation, (1));
    }
}
/* wornmask value */
/* no wear messages when mon is being created */
/* small monsters that are allowed for player
                              * races (gnomes) can wear suits */
export function m_dowear_type(mon, flag, creation, racialexception) {
    let old = null;
    let best = null;
    let obj = null;
    let oldmask = 0;
    let m_delay = 0;
    let sawmon = 0;
    let sawloc = 0;
    let autocurse = 0;
    let nambuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    outer_break: {
        oldmask = 0;
        m_delay = 0;
        sawmon = canseemon(mon);
        sawloc = ((game.viz_array[mon.my][mon.mx] & 2) != 0);
        if (mon.mfrozen) {
            return;
        }
        nambuf = strcpy(nambuf, (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? Monnam(mon) : mon_nam(mon));
        /* probably putting previous item on */
        /* Get a copy of monster's name before altering its visibility */
        old = which_armor(mon, flag);
        if (old && old.cursed) {
            return;
        }
        if (old && flag == 65536 && old.otyp != AMULET_OF_GUARDING) {
            return;
        }
        /* no amulet better than life-saving or reflection */
        best = old;
        for (obj = mon.minvent; obj; obj = obj.nobj) {
            switch (flag) {
                case 65536:
                    if (obj.oclass != AMULET_CLASS || (obj.otyp != AMULET_OF_LIFE_SAVING && obj.otyp != AMULET_OF_REFLECTION && obj.otyp != AMULET_OF_GUARDING)) {
                        continue;
                    }
                    if (!best || obj.otyp != AMULET_OF_GUARDING) {
                        /* for 'best' to be non-Null, it must be an amulet of guarding;
               life-saving and reflection don't get here due to early return
               and other amulets of guarding can't be any better */
                        best = obj;
                        if (best.otyp != AMULET_OF_GUARDING) {
                            break outer_break;
                        }
                    }
                    continue;
                case 64:
                    if (!(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_SHIRT)) {
                        continue;
                    }
                    break;
                case 2:
                    if (!(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_CLOAK)) {
                        continue;
                    }
                    /* mummy wrapping is only cloak allowed when bigger than human */
                    if (mon.data.msize > 2 && obj.otyp != MUMMY_WRAPPING) {
                        continue;
                    }
                    /* avoid mummy wrapping if it will allow hero to see mon (unless
               this is a new mummy; an invisible one is feasible via ^G) */
                    if (mon.minvis && ((obj.otyp == MUMMY_WRAPPING && ((2) & 2) != 0) ? INVIS : (obj.otyp == CORNUTHAUM && ((2) & 4) != 0 && !(game.urole.mnum == (PM_WIZARD))) ? CLAIRVOYANT : (is_art(obj, ART_EYES_OF_THE_OVERWORLD) && ((2) & 524288) != 0) ? BLINDED : 0) == INVIS && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) && !creation) {
                        continue;
                    }
                    break;
                case 4:
                    if (!(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_HELM)) {
                        continue;
                    }
                    /* changing alignment is not implemented for monsters;
               priests and minions could change alignment but wouldn't
               want to, so they reject helms of opposite alignment */
                    if (obj.otyp == HELM_OF_OPPOSITE_ALIGNMENT && (mon.ispriest || mon.isminion)) {
                        continue;
                    }
                    /* (flimsy exception matches polyself handling) */
                    if ((num_horns(mon.data) > 0) && !(game.objects[(obj).otyp].oc_material <= LEATHER || (obj).otyp == RUBBER_HOSE)) {
                        continue;
                    }
                    break;
                case 8:
                    if (!(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_SHIELD)) {
                        continue;
                    }
                    break;
                case 16:
                    if (!(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_GLOVES)) {
                        continue;
                    }
                    break;
                case 32:
                    if (!(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_BOOTS)) {
                        continue;
                    }
                    break;
                case 1:
                    if (!(obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_SUIT)) {
                        continue;
                    }
                    if (racialexception && (racial_exception(mon, obj) < 1)) {
                        continue;
                    }
                    break;
            }
            if (obj.owornmask) {
                continue;
            }
            /* I'd like to define a VISIBLE_ARM_BONUS which doesn't assume the
         * monster knows obj->spe, but if I did that, a monster would keep
         * switching forever between two -2 caps since when it took off one
         * it would forget spe and once again think the object is better
         * than what it already has.
         */
            if (best && ((game.objects[(best).otyp].oc_oc1 + (best).spe - ((((best).oeroded > (best).oeroded2 ? (best).oeroded : (best).oeroded2)) < (game.objects[(best).otyp].oc_oc1) ? (((best).oeroded > (best).oeroded2 ? (best).oeroded : (best).oeroded2)) : (game.objects[(best).otyp].oc_oc1))) + extra_pref(mon, best) >= (game.objects[(obj).otyp].oc_oc1 + (obj).spe - ((((obj).oeroded > (obj).oeroded2 ? (obj).oeroded : (obj).oeroded2)) < (game.objects[(obj).otyp].oc_oc1) ? (((obj).oeroded > (obj).oeroded2 ? (obj).oeroded : (obj).oeroded2)) : (game.objects[(obj).otyp].oc_oc1))) + extra_pref(mon, obj))) {
                continue;
            }
            best = obj;
        }
    }
    if (!best || best == old) {
        return;
    }
    /* same auto-cursing behavior as for hero */
    autocurse = ((best.otyp == HELM_OF_OPPOSITE_ALIGNMENT || best.otyp == DUNCE_CAP) && !best.cursed);
    /* if wearing a cloak, account for the time spent removing
       and re-wearing it when putting on a suit or shirt */
    if ((flag == 1 || flag == 64) && (mon.misc_worn_check & 2)) {
        m_delay += 2;
    }
    if (old) {
        /* when upgrading a piece of armor, account for time spent
       taking off current one */
        m_delay += game.objects[old.otyp].oc_delay;
        /* needed later by artifact_light() */
        oldmask = old.owornmask;
        /* avoid doname() showing "(being worn)" */
        old.owornmask = 0;
    }
    if (!creation) {
        if (sawmon) {
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let oldarm = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let newarm = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            /* "<Mon> [removes <oldarm> and ]puts on <newarm>."
               uses accessory verbs for armor but we can live with that */
            if (old) {
                oldarm = strcpy(oldarm, distant_name(old, doname));
                nh_snprintf("m_dowear_type", 932, buf, 256 /* sizeof(char [256]) */, " removes %s and", oldarm);
            } else {
                buf[0] = oldarm[0] = 0;
            }
            newarm = strcpy(newarm, distant_name(best, doname));
            if (!strncmpi((newarm), (oldarm), -1)) {
                /* a monster will swap an item of the same type as the one it
               is replacing when the enchantment is better;
               if newarm and oldarm have identical descriptions, substitute
               "another <newarm>" for "a|an <newarm>" */
                /* size of newarm[] has been overallocated to guarantee
                   enough room to insert "another " */
                if (!strncmpi(newarm, "a ", 2)) {
                    newarm = strsubst(newarm, "a ", "another ");
                } else if (!strncmpi(newarm, "an ", 3)) {
                    newarm = strsubst(newarm, "an ", "another ");
                }
                newarm[256 - 1] = 0;
            }
            pline_mon(mon, "%s%s puts on %s.", Monnam(mon), buf, newarm);
            if (autocurse) {
                pline("%s %s %s %s for a moment.", s_suffix(Monnam(mon)), simpleonames(best), otense(best, "glow"), hcolor(c_color_names.c_black));
            }
        }
        m_delay += game.objects[best.otyp].oc_delay;
        mon.mfrozen = m_delay;
        if (mon.mfrozen) {
            mon.mcanmove = 0;
        }
    }
    if (old) {
        update_mon_extrinsics(mon, old, (0), creation);
        /* owornmask was cleared above but artifact_light() expects it */
        old.owornmask = oldmask;
        if (old.lamplit && artifact_light(old)) {
            end_burn(old, (0));
        }
        old.owornmask = 0;
    }
    mon.misc_worn_check |= flag;
    best.owornmask |= flag;
    if (autocurse) {
        curse(best);
    }
    if (artifact_light(best) && !best.lamplit) {
        begin_burn(best, (0));
        vision_recalc(1);
        if (!creation && best.lamplit && ((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
            let adesc = arti_light_description(best);
            if (sawmon) {
                pline("%s %s to shine %s.", Yname2(best), otense(best, "begin"), adesc);
            } else if (canseemon(mon)) {
                pline("%s %s shining %s.", Yname2(best), otense(best, "are"), adesc);
            } else if (sawloc) {
                pline("%s begins to shine %s.", c_common_strings.c_Something, adesc);
            /* could already see monster */
            /* didn't see it until new light */
            /* saw location but not invisible monster */
            /* didn't see location until new light */
            } else {
                pline("%s is shining %s.", c_common_strings.c_Something, adesc);
            }
        }
    }
    update_mon_extrinsics(mon, best, (1), creation);
    if (!creation && (sawmon ^ canseemon(mon))) {
        if (mon.minvis && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
            /* if couldn't see it but now can, or vice versa */
            pline("Suddenly you cannot see %s.", nambuf);
            /* } else if (!mon->minvis) {
         *     pline("%s suddenly appears!", Amonnam(mon)); */
            discover_object((best.otyp), (1), (1), (1));
        }
    }
}
export function which_armor(mon, flag) {
    if (mon == game.youmonst) {
        switch (flag) {
            case 1:
                return game.uarm;
            case 2:
                return game.uarmc;
            case 4:
                return game.uarmh;
            case 8:
                return game.uarms;
            case 16:
                return game.uarmg;
            case 32:
                return game.uarmf;
            case 64:
                return game.uarmu;
            default:
                impossible("bad flag in which_armor");
                return null;
        }
    } else {
        let obj = null;
        for (obj = mon.minvent; obj; obj = obj.nobj) {
            if (obj.owornmask & flag) {
                return obj;
            }
        }
        return null;
    }
}
/* remove an item of armor and then drop it */
export function m_lose_armor(mon, obj, polyspot) {
    extract_from_minvent(mon, obj, (1), (0));
    place_object(obj, mon.mx, mon.my);
    if (polyspot) {
        bypass_obj(obj);
    }
    newsym(mon.mx, mon.my);
}
/* clear bypass bits for an object chain, plus contents if applicable */
export function clear_bypass(objchn) {
    let o = null;
    for (o = objchn; o; o = o.nobj) {
        o.bypass = 0;
        if (((o).cobj != null)) {
            clear_bypass(o.cobj);
        }
    }
}
/* all objects with their bypass bit set should now be reset to normal;
   this can be a relatively expensive operation so is only called if
   svc.context.bypasses is set */
export function clear_bypasses() {
    let mtmp = null;
    /*
     * 'Object' bypass is also used for one monster function:
     * polymorph control of long worms.  Activated via setting
     * svc.context.bypasses even if no specific object has been
     * bypassed.
     */
    clear_bypass(game.level.objlist);
    clear_bypass(game.invent);
    clear_bypass(game.migrating_objs);
    clear_bypass(game.level.buriedobjlist);
    clear_bypass(game.billobjs);
    clear_bypass(game.objs_deleted);
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        /* no MCORPSENM(mtmp)==PM_LONG_WORM check here; long worms can't
           be just created by polymorph and migrating at the same time */
        clear_bypass(mtmp.minvent);
        /* long worm created by polymorph has mon->mextra->mcorpsenm set
           to PM_LONG_WORM to flag it as not being subject to further
           polymorph (so polymorph zap won't hit monster to transform it
           into a long worm, then hit that worm's tail and transform it
           again on same zap); clearing mcorpsenm reverts worm to normal */
        if (mtmp.data == game.mons[PM_LONG_WORM] && ((mtmp).mextra && ((mtmp).mextra.mcorpsenm) != NON_PM)) {
            ((mtmp).mextra.mcorpsenm) = NON_PM;
        }
    }
    for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
        clear_bypass(mtmp.minvent);
    }
    /* this is a no-op since mydogs is only non-Null during level change or
       final ascension and we aren't called at those times, but be thorough */
    for (mtmp = game.mydogs; mtmp; mtmp = mtmp.nmon) {
        clear_bypass(mtmp.minvent);
    }
    /* ball and chain can be "floating", not on any object chain (when
       hero is swallowed by an engulfing monster, for instance) */
    if (game.uball) {
        game.uball.bypass = 0;
    }
    if (game.uchain) {
        game.uchain.bypass = 0;
    }
    game.context.bypasses = (0);
}
export function bypass_obj(obj) {
    obj.bypass = 1;
    game.context.bypasses = (1);
}
/* set or clear the bypass bit in a list of objects */
/* TRUE => set, FALSE => clear */
export function bypass_objlist(objchain, on) {
    if (on && objchain) {
        game.context.bypasses = (1);
    }
    while (objchain) {
        objchain.bypass = on ? 1 : 0;
        objchain = objchain.nobj;
    }
}
/* return the first object without its bypass bit set; set that bit
   before returning so that successive calls will find further objects */
export function nxt_unbypassed_obj(objchain) {
    while (objchain) {
        if (!objchain.bypass) {
            bypass_obj(objchain);
            break;
        }
        objchain = objchain.nobj;
    }
    return objchain;
}
/* like nxt_unbypassed_obj() but operates on sortloot_item array rather
   than an object linked list; the array contains obj==Null terminator;
   there's an added complication that the array may have stale pointers
   for deleted objects (see Multiple-Drop case in askchain(invent.c)) */
export function nxt_unbypassed_loot(lootarray, listhead) {
    let o = null;
    let obj = null;
    const __nhi_lootarray_arr = lootarray;
    for (let __nhi_lootarray = 0; (lootarray = __nhi_lootarray_arr[__nhi_lootarray]) && ((obj = lootarray.obj) != null); __nhi_lootarray++) {
        for (o = listhead; o; o = o.nobj) {
            if (o == obj) {
                break;
            }
        }
        if (o && !obj.bypass) {
            bypass_obj(obj);
            break;
        }
    }
    return obj;
}
export function mon_break_armor(mon, polyspot) {
    let otmp = null;
    let mdat = mon.data;
    let vis = ((game.viz_array[mon.my][mon.mx] & 2) != 0);
    let handless_or_tiny = ((((mdat).mflags1 & 8192) != 0) || ((mdat).msize < 1));
    let noride = (0);
    let pronoun = (genders[pronoun_gender(mon, 2)].him);
    let ppronoun = (genders[pronoun_gender(mon, 2)].his);
    if (breakarm(mdat)) {
        if ((otmp = which_armor(mon, 1)) != null) {
            if ((((otmp).otyp >= GRAY_DRAGON_SCALES && (otmp).otyp <= YELLOW_DRAGON_SCALES) && mdat == game.mons[PM_GRAY_DRAGON + (otmp).otyp - GRAY_DRAGON_SCALES]) || (((otmp).otyp >= GRAY_DRAGON_SCALE_MAIL && (otmp).otyp <= YELLOW_DRAGON_SCALE_MAIL) && mdat == game.mons[PM_GRAY_DRAGON + (otmp).otyp - GRAY_DRAGON_SCALE_MAIL])) {
                ;
            } else {
                ;
                if (vis) {
                    pline_mon(mon, "%s breaks out of %s armor!", Monnam(mon), ppronoun);
                } else {
                    You_hear("a cracking sound.");
                }
            }
            m_useup(mon, otmp);
        }
        if ((otmp = which_armor(mon, 2)) != null && (otmp.otyp != MUMMY_WRAPPING || !((((mdat).mflags1 & 131072) != 0) && (mdat).msize >= 1 && (mdat).msize <= 4 && !((mdat).mlet == S_GHOST) && (mdat).mlet != S_CENTAUR && (mdat) != game.mons[PM_WINGED_GARGOYLE] && (mdat) != game.mons[PM_MARILITH]))) {
            if (otmp.oartifact) {
                /* no message here;
                     "the dragon merges with his scaly armor" is odd
                     and the monster's previous form is already gone */
                /* mummy wrapping adapts to small and very big sizes */
                if (vis) {
                    pline_mon(mon, "%s %s falls off!", s_suffix(Monnam(mon)), cloak_simple_name(otmp));
                }
                m_lose_armor(mon, otmp, polyspot);
            } else {
                ;
                if (vis) {
                    pline_mon(mon, "%s %s tears apart!", s_suffix(Monnam(mon)), cloak_simple_name(otmp));
                } else {
                    You_hear("a ripping sound.");
                }
                m_useup(mon, otmp);
            }
        }
        if ((otmp = which_armor(mon, 64)) != null) {
            if (vis) {
                pline_mon(mon, "%s shirt rips to shreds!", s_suffix(Monnam(mon)));
            } else {
                You_hear("a ripping sound.");
            }
            m_useup(mon, otmp);
        }
    } else if (sliparm(mdat)) {
        /* sliparm checks whirly, noncorporeal, and small or under */
        let passes_thru_clothes = !(mdat.msize <= 1);
        if ((otmp = which_armor(mon, 1)) != null) {
            ;
            if (vis) {
                pline_mon(mon, "%s armor falls around %s!", s_suffix(Monnam(mon)), pronoun);
            } else {
                You_hear("a thud.");
            }
            m_lose_armor(mon, otmp, polyspot);
        }
        if ((otmp = which_armor(mon, 2)) != null && (otmp.otyp != MUMMY_WRAPPING || !((((mdat).mflags1 & 131072) != 0) && (mdat).msize >= 1 && (mdat).msize <= 4 && !((mdat).mlet == S_GHOST) && (mdat).mlet != S_CENTAUR && (mdat) != game.mons[PM_WINGED_GARGOYLE] && (mdat) != game.mons[PM_MARILITH]))) {
            if (vis) {
                if (((mon.data).mlet == S_VORTEX || (mon.data) == game.mons[PM_AIR_ELEMENTAL])) {
                    pline_mon(mon, "%s %s falls, unsupported!", s_suffix(Monnam(mon)), cloak_simple_name(otmp));
                } else {
                    pline_mon(mon, "%s shrinks out of %s %s!", Monnam(mon), ppronoun, cloak_simple_name(otmp));
                }
            }
            m_lose_armor(mon, otmp, polyspot);
        }
        if ((otmp = which_armor(mon, 64)) != null) {
            if (vis) {
                if (passes_thru_clothes) {
                    pline_mon(mon, "%s seeps right through %s shirt!", Monnam(mon), ppronoun);
                } else {
                    pline_mon(mon, "%s becomes much too small for %s shirt!", Monnam(mon), ppronoun);
                }
            }
            m_lose_armor(mon, otmp, polyspot);
        }
    }
    if (handless_or_tiny) {
        if ((otmp = which_armor(mon, 16)) != null) {
            /* [caller needs to handle weapon checks] */
            if (vis) {
                pline_mon(mon, "%s drops %s gloves%s!", Monnam(mon), ppronoun, ((mon).mw) ? " and weapon" : "");
            }
            m_lose_armor(mon, otmp, polyspot);
        }
        if ((otmp = which_armor(mon, 8)) != null) {
            ;
            if (vis) {
                pline_mon(mon, "%s can no longer hold %s shield!", Monnam(mon), ppronoun);
            } else {
                You_hear("a clank.");
            }
            m_lose_armor(mon, otmp, polyspot);
        }
    }
    if (handless_or_tiny || (num_horns(mdat) > 0)) {
        if ((otmp = which_armor(mon, 4)) != null && (handless_or_tiny || !(game.objects[(otmp).otyp].oc_material <= LEATHER || (otmp).otyp == RUBBER_HOSE))) {
            /* flimsy test for horns matches polyself handling */
            if (vis) {
                pline_mon(mon, "%s helmet falls to the %s!", s_suffix(Monnam(mon)), surface(mon.mx, mon.my));
            } else {
                You_hear("a clank.");
            }
            m_lose_armor(mon, otmp, polyspot);
        }
    }
    if (handless_or_tiny || (((mdat).mflags1 & 524288) != 0) || mdat.mlet == S_CENTAUR) {
        if ((otmp = which_armor(mon, 32)) != null) {
            if (vis) {
                if (((mon.data).mlet == S_VORTEX || (mon.data) == game.mons[PM_AIR_ELEMENTAL])) {
                    pline_mon(mon, "%s boots fall away!", s_suffix(Monnam(mon)));
                } else {
                    pline_mon(mon, "%s boots %s off %s feet!", s_suffix(Monnam(mon)), ((mdat).msize < 1) ? "slide" : "are pushed", ppronoun);
                }
            }
            m_lose_armor(mon, otmp, polyspot);
        }
    }
    if (!can_saddle(mon)) {
        if ((otmp = which_armor(mon, 1048576)) != null) {
            m_lose_armor(mon, otmp, polyspot);
            if (vis) {
                pline_mon(mon, "%s saddle falls off.", s_suffix(Monnam(mon)));
            }
        }
        if (mon == game.u.usteed) {
            noride = (1);
        }
    }
    if (noride || (mon == game.u.usteed && !can_ride(mon))) {
        You("can no longer ride %s.", mon_nam(mon));
        if (((game.u.usteed.data) == game.mons[PM_COCKATRICE] || (game.u.usteed.data) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && rnl(3)) {
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            You("touch %s.", mon_nam(game.u.usteed));
            buf = sprintf(buf, "falling off %s", an(pmname(game.u.usteed.data, Mgender(game.u.usteed))));
            instapetrify(buf);
        }
        dismount_steed(DISMOUNT_FELL);
    }
    return;
}
/* bias a monster's preferences towards armor that has special benefits. */
export function extra_pref(mon, obj) {
    if (obj) {
        /* currently only does speed boots, but might be expanded if monsters
     * get to use more armor abilities
     */
        if (obj.otyp == SPEED_BOOTS && mon.permspeed != 2) {
            return 20;
        }
    }
    /* Unacceptable Exceptions: */
    /* Checks for object that certain races should never use go here */
    return 0;
}
/*
 * Exceptions to things based on race.
 * Correctly checks polymorphed player race.
 * Returns:
 *       0 No exception, normal rules apply.
 *       1 If the race/object combination is acceptable.
 *      -1 If the race/object combination is unacceptable.
 */
export function racial_exception(mon, obj) {
    let ptr = raceptr(mon);
    /* Allow hobbits to wear elven armor - LoTR */
    if (ptr == game.mons[PM_HOBBIT] && ((obj).otyp == ELVEN_LEATHER_HELM || (obj).otyp == ELVEN_MITHRIL_COAT || (obj).otyp == ELVEN_CLOAK || (obj).otyp == ELVEN_SHIELD || (obj).otyp == ELVEN_BOOTS)) {
        return 1;
    }
    return 0;
}
/* Remove an object from a monster's inventory. */
/* whether to call update_mon_extrinsics */
/* doesn't affect all possible messages,
                             * just update_mon_extrinsics's */
export function extract_from_minvent(mon, obj, do_extrinsics, silently) {
    let unwornmask = obj.owornmask;
    if (obj.where != 4) {
        /*
     * At its core this is just obj_extract_self(), but it also handles
     * any updates that need to happen if the gear is equipped or in
     * some other sort of state that needs handling.
     * Note that like obj_extract_self(), this leaves obj free.
     */
        impossible("extract_from_minvent called on object not in minvent");
        return;
    }
    /* handle gold dragon scales/scale-mail (lit when worn) before clearing
       obj->owornmask because artifact_light() expects that to be W_ARM */
    if ((unwornmask & 1) != 0 && obj.lamplit && artifact_light(obj)) {
        end_burn(obj, (0));
    }
    obj_extract_self(obj);
    obj.owornmask = 0;
    if (unwornmask) {
        if (!((mon).mhp < 1) && do_extrinsics) {
            update_mon_extrinsics(mon, obj, (0), silently);
        }
        mon.misc_worn_check &= ~unwornmask;
        /* give monster a chance to wear other equipment on its next
           move instead of waiting until it picks something up */
        check_gear_next_turn(mon);
    }
    obj_no_longer_held(obj);
    if (unwornmask & 256) {
        /* unwields and sets weapon_check to NEED_WEAPON */
        mwepgone(mon);
    }
}
/*worn.c*/
/* remove stale pointers; called after the objects have been freed
       (without first being unworn) while saving invent during game save;
       note: uball and uchain might not be freed yet but we clear them
       here anyway (savegamestate() and its callers deal with them) */
/* object is already gone so we don't/can't update is owornmask */
/* embedded scales owornmask is W_ARM|I_SPECIAL so would
                   give a false complaint about item other than uarm having
                   W_ARM bit set if we didn't screen it out here */
/* take away intrinsic speed but don't reduce normal speed */
/* life-saving or reflection; use it */
