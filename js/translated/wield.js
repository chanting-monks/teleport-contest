/* NetHack 5.0	wield.c	$NHDT-Date: 1707525193 2024/02/10 00:33:13 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.110 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2009. */
/* NetHack may be freely redistributed.  See license for details. */
/* KMH -- Differences between the three weapon slots.
 *
 * The main weapon (uwep):
 * 1.  Is filled by the (w)ield command.
 * 2.  Can be filled with any type of item.
 * 3.  May be carried in one or both hands.
 * 4.  Is used as the melee weapon and as the launcher for
 *     ammunition.
 * 5.  Only conveys intrinsics when it is a weapon, weapon-tool,
 *     or artifact.
 * 6.  Certain cursed items will weld to the hand and cannot be
 *     unwielded or dropped.  See erodeable_wep() and will_weld()
 *     below for the list of which items apply.
 *
 * The secondary weapon (uswapwep):
 * 1.  Is filled by the e(x)change command, which swaps this slot
 *     with the main weapon.  If the "pushweapon" option is set,
 *     the (w)ield command will also store the old weapon in the
 *     secondary slot.
 * 2.  Can be filled with anything that will fit in the main weapon
 *     slot; that is, any type of item.
 * 3.  Is usually NOT considered to be carried in the hands.
 *     That would force too many checks among the main weapon,
 *     second weapon, shield, gloves, and rings; and it would
 *     further be complicated by bimanual weapons.  A special
 *     exception is made for two-weapon combat.
 * 4.  Is used as the second weapon for two-weapon combat, and as
 *     a convenience to swap with the main weapon.
 * 5.  Never conveys intrinsics.
 * 6.  Cursed items never weld (see #3 for reasons), but they also
 *     prevent two-weapon combat.
 *
 * The quiver (uquiver):
 * 1.  Is filled by the (Q)uiver command.
 * 2.  Can be filled with any type of item.
 * 3.  Is considered to be carried in a special part of the pack.
 * 4.  Is used as the item to throw with the (f)ire command.
 *     This is a convenience over the normal (t)hrow command.
 * 5.  Never conveys intrinsics.
 * 6.  Cursed items never weld; their effect is handled by the normal
 *     throwing code.
 * 7.  The autoquiver option will fill it with something deemed
 *     suitable if (f)ire is used when it's empty.
 *
 * No item may be in more than one of these slots.
 */
import { game } from '../gstate.js';
import { You, You_cant, Your, pline } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcmp, strcpy, strncmp, strstri } from '../c2js-runtime/string.js';
import { arti_speak, artifact_light, is_art, restrict_name, retouch_object, undiscovered_artifact } from './artifact.js';
import { acurr, exercise } from './attrib.js';
import { yn_function } from './cmd.js';
import { c_color_names, ynqchars } from './decl.js';
import { dropx } from './do.js';
import { hcolor } from './do_name.js';
import { reset_remarm } from './do_wear.js';
import { inv_cnt } from './hack.js';
import { addinv_nomerge, freeinv, getobj, prinv, splittable, update_inventory, useupall } from './invent.js';
import { arti_light_description } from './light.js';
import { clear_splitobjs, costly_alteration, set_bknown, splitobj, uncurse, unsplitobj, weight } from './mkobj.js';
import { AKLYS, ARMOR_CLASS, ARM_BOOTS, ARM_GLOVES, ART_EYES_OF_THE_OVERWORLD, ART_MAGICBANE, ART_OGRESMASHER, ART_SNICKERSNEE, A_DEX, BATTLE_AXE, BLINDED, COIN_CLASS, CORPSE, COST_DECHNT, COST_DEGRD, CRYSKNIFE, ELVEN_ARROW, ELVEN_BOW, ELVEN_BROADSWORD, ELVEN_DAGGER, ELVEN_SHORT_SWORD, ELVEN_SPEAR, GEM_CLASS, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_SUGGEST, GLIB, HALLUC, HALLUC_RES, HAND, HEAVY_IRON_BALL, IRON_CHAIN, LENSES, PM_CHICKATRICE, PM_COCKATRICE, P_BOOMERANG, P_BOW, P_CROSSBOW, P_DART, P_LANCE, P_NONE, P_POLEARMS, P_SABER, P_SHORT_SWORD, SCROLL_CLASS, STONE_RES, STRANGE_OBJECT, TIN_OPENER, TOOL_CLASS, TOWEL, WEAPON_CLASS, WORM_TOOTH, bl_bareh, invlet_basic } from './nh-constants.js';
import { discover_object } from './o_init.js';
import { The, Tobjnam, Yname2, Yobjnam2, an, aobjnam, corpse_xname, doname, killer_xname, makeplural, otense, simpleonames, vtense, xname, yname, yobjnam } from './objnam.js';
import { encumber_msg } from './pickup.js';
import { body_part } from './polyself.js';
import { strange_feeling } from './potion.js';
import { rn2, rnd } from './rnd.js';
import { Shk_Your, alter_cost, inside_shop, shop_keeper } from './shk.js';
import { shkname } from './shknam.js';
import { begin_burn, end_burn } from './timeout.js';
import { instapetrify } from './trap.js';
import { setworn } from './worn.js';

/* used by will_weld() */
/* probably should be renamed */
/* used by welded(), and also while wielding */
/* to dual-wield, 'obj' must be a weapon or a weapon-tool, and not a bow
   or arrow or missile (dart, shuriken, boomerang), so not matching the
   one-handed weapons which yield "you begin bashing" if used for melee;
   empty hands and two-handed weapons have to be handled separately */
const are_no_longer_twoweap = "are no longer using two weapons at once";
const can_no_longer_twoweap = "can no longer wield two weapons at once";
/*** Functions that place a given item in a slot ***/
/* Proper usage includes:
 * 1.  Initializing the slot during character generation or a
 *     restore.
 * 2.  Setting the slot due to a player's actions.
 * 3.  If one of the objects in the slot is split off, these
 *     functions can be used to put the remainder back in the slot.
 * 4.  Putting an item that was thrown and returned back into the slot.
 * 5.  Emptying the slot, by passing a null object.  NEVER pass
 *     cg.zeroobj!
 *
 * If the item is being moved from another slot, it is the caller's
 * responsibility to handle that.  It's also the caller's responsibility
 * to print the appropriate messages.
 */
export async function setuwep(obj) {
    let olduwep = game.uwep;
    if (obj == game.uwep) {
        /* no extra handling needed; this used to include a call to
       update_inventory() but that's already performed by setworn() */
        return;
    }
    await setworn(obj, 256);
    /* handle Ogresmasher before Sunsword; even though they can't be happening
       at the same time, botl flag update should come before pline message */
    if (game.uwep == obj && ((game.uwep && game.uwep.oartifact == ART_OGRESMASHER) || (olduwep && olduwep.oartifact == ART_OGRESMASHER))) {
        game.disp.botl = (1);
    }
    if (game.uwep == obj && artifact_light(olduwep) && olduwep.lamplit) {
        await end_burn(olduwep, (0));
        /* there is a (soft) upper and lower limit to uwep->spe */
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await pline("%s shining.", await Tobjnam(olduwep, "stop"));
        }
    }
    if (game.uwep == obj && (is_art(game.uwep, ART_OGRESMASHER) || is_art(olduwep, ART_OGRESMASHER))) {
        game.disp.botl = (1);
    }
    if (obj) {
        /* Note: Explicitly wielding a pick-axe will not give a "bashing"
     * message.  Wielding one via 'a'pplying it will.
     * 3.2.2:  Wielding arbitrary objects will give bashing message too.
     */
        game.unweapon = (obj.oclass == WEAPON_CLASS) ? (obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp >= P_BOW && game.objects[obj.otyp].oc_subtyp <= P_CROSSBOW) || ((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[obj.otyp].oc_subtyp <= -P_DART) || (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && (game.objects[obj.otyp].oc_subtyp == P_POLEARMS || game.objects[obj.otyp].oc_subtyp == P_LANCE || is_art(obj, ART_SNICKERSNEE))) && !game.u.usteed && !is_art(obj, ART_SNICKERSNEE)) : !((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) && !((obj).otyp == TOWEL && (obj).spe > 0);
    /* for "bare hands" message */
    } else {
        game.unweapon = (1);
    }
}
export async function cant_wield_corpse(obj) {
    let kbuf = '';
    if (game.uarmg || obj.otyp != CORPSE || !((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE]) || (game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        return (0);
    }
    await You("wield %s in your bare %s.", await corpse_xname(obj, null, 4), await makeplural(await body_part(HAND)));
    kbuf = sprintf(kbuf, "wielding %s bare-handed", await killer_xname(obj));
    await instapetrify(kbuf);
    return (1);
}
/* description of hands when not wielding anything; also used
   by #seeweapon (')'), #attributes (^X), and #takeoffall ('A') */
export function empty_handed() {
    return game.uarmg ? "empty handed" : (((game.youmonst.data).mflags1 & 131072) != 0) ? "bare handed" : "not wielding anything";
}
export async function ready_weapon(wep) {
    /* Separated function so swapping works easily */
    let res = 0;
    let was_twoweap = game.u.twoweap;
    let had_wep = (game.uwep != null);
    if (!wep) {
        if (game.uwep) {
            await You("are %s.", empty_handed());
            await setuwep(null);
            /* hero must have been life-saved to get here; use a turn */
            /* takes a turn even though it doesn't get wielded */
            /* Weapon WILL be wielded after this point */
            res = 1;
        } else {
            await You("are already %s.", empty_handed());
        }
    } else if (wep.otyp == CORPSE && await cant_wield_corpse(wep)) {
        res = 1;
    } else if (game.uarms && ((wep.oclass == WEAPON_CLASS || wep.oclass == TOOL_CLASS) && game.objects[wep.otyp].oc_big)) {
        await You("cannot wield a two-handed %s while wearing a shield.", (wep.oclass == WEAPON_CLASS && game.objects[wep.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[wep.otyp].oc_subtyp <= P_SABER) ? "sword" : wep.otyp == BATTLE_AXE ? "axe" : "weapon");
        res = 4;
    } else if (!await retouch_object({ get value() { return wep; }, set value(_v) { wep = _v; } }, (0))) {
        res = 1;
    } else {
        res = 1;
        if (((wep).cursed && (((wep).oclass == WEAPON_CLASS || ((wep).oclass == TOOL_CLASS && game.objects[(wep).otyp].oc_subtyp != P_NONE) || (wep).otyp == HEAVY_IRON_BALL || (wep).otyp == IRON_CHAIN) || (wep).otyp == TIN_OPENER))) {
            let tmp = await xname(wep);
            let thestr = "The ";
            if (strncmp(tmp, thestr, 4) && !strncmp(await The(tmp), thestr, 4)) {
                tmp = thestr;
            } else {
                tmp = "";
            }
            await pline("%s%s %s to your %s%s!", tmp, await aobjnam(wep, "weld"), (wep.quan == 1) ? "itself" : "themselves", ((wep.oclass == WEAPON_CLASS || wep.oclass == TOOL_CLASS) && game.objects[wep.otyp].oc_big) ? "" : ((game.u.uhandedness == 0) ? "dominant right " : "dominant left "), ((wep.oclass == WEAPON_CLASS || wep.oclass == TOOL_CLASS) && game.objects[wep.otyp].oc_big) ? await makeplural(await body_part(HAND)) : await body_part(HAND));
            set_bknown(wep, 1);
        } else {
            /* The message must be printed before setuwep (since
             * you might die and be revived from changing weapons),
             * and the message must be before the death message and
             * Lifesaved rewielding.  Yet we want the message to
             * say "weapon in hand", thus this kludge.
             * [That comment is obsolete.  It dates from the days (3.0)
             * when unwielding Firebrand could cause hero to be burned
             * to death in Hell due to loss of fire resistance.
             * "Lifesaved re-wielding or re-wearing" is ancient history.]
             */
            let dummy = wep.owornmask;
            wep.owornmask |= 256;
            if (wep.otyp == AKLYS && (wep.owornmask & 256) != 0) {
                await You("secure the tether.");
            }
            await prinv(null, wep, 0);
            wep.owornmask = dummy;
        }
        await setuwep(wep);
        if (was_twoweap && !game.u.twoweap && game.flags.verbose) {
            if (game.uwep) {
                await You("%s.", (((((game.uwep).oclass == WEAPON_CLASS) ? !((game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_BOW && game.objects[game.uwep.otyp].oc_subtyp <= P_CROSSBOW) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == GEM_CLASS) && game.objects[game.uwep.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uwep.otyp].oc_subtyp <= -P_BOW) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[game.uwep.otyp].oc_subtyp <= -P_DART)) : ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)) && !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) ? are_no_longer_twoweap : can_no_longer_twoweap));
            }
        }
        if (wep.oartifact) {
            res |= await arti_speak(wep);
        }
        if (artifact_light(wep) && !wep.lamplit) {
            await begin_burn(wep, (0));
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("%s to shine %s!", await Tobjnam(wep, "begin"), arti_light_description(wep));
            }
        }
        if (wep.unpaid) {
            /* we'll get back to this someday, but it's not balanced yet */
            /* Elves are averse to wielding cold iron */
            let this_shkp = null;
            if ((this_shkp = await shop_keeper(inside_shop(game.u.ux, game.u.uy))) != null) {
                await pline("%s says \"You be careful with my %s!\"", await shkname(this_shkp), await xname(wep));
            }
        }
    }
    if ((had_wep != (game.uwep != null)) && game.condtests[bl_bareh].enabled) {
        game.disp.botl = (1);
    }
    return res;
}
export async function setuqwep(obj) {
    await setworn(obj, 512);
    return;
}
export async function setuswapwep(obj) {
    await setworn(obj, 1024);
    return;
}
/* getobj callback for object to ready for throwing/shooting;
   this filter lets worn items through so that caller can reject them */
export function ready_ok(obj) {
    /* '-', will empty quiver slot if chosen */
    if (!obj) {
        return game.uquiver ? GETOBJ_SUGGEST : GETOBJ_DOWNPLAY;
    }
    /* downplay when wielded, unless more than one */
    if (obj == game.uwep || (obj == game.uswapwep && game.u.twoweap)) {
        return (obj.quan == 1) ? GETOBJ_DOWNPLAY : GETOBJ_SUGGEST;
    }
    if (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW)) {
        return ((game.uwep && (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) || (game.uswapwep && (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uswapwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uswapwep).otyp].oc_subtyp)))) ? GETOBJ_SUGGEST : GETOBJ_DOWNPLAY;
    } else if ((obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp >= P_BOW && game.objects[obj.otyp].oc_subtyp <= P_CROSSBOW)) {
        /* part of 'possible extension' below */
        /* superseded by ammo_and_launcher handling above */
        /* Include gems/stones as likely candidates if either primary
       or secondary weapon is a sling. */
        return GETOBJ_DOWNPLAY;
    } else {
        /* Possible extension: exclude weapons that make no sense to throw,
           such as whips, bows, slings, rubber hoses. */
        if (obj.oclass == WEAPON_CLASS || obj.oclass == COIN_CLASS) {
            return GETOBJ_SUGGEST;
        }
    }
    return GETOBJ_DOWNPLAY;
}
/* getobj callback for object to wield */
export function wield_ok(obj) {
    if (!obj) {
        return GETOBJ_SUGGEST;
    }
    if (obj.oclass == COIN_CLASS) {
        return GETOBJ_EXCLUDE;
    }
    if (obj.oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE)) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_DOWNPLAY;
}
export async function finish_splitting(obj) {
    await freeinv(obj);
    await addinv_nomerge(obj);
}
/* the #wield command - wield a weapon */
export async function dowield() {
    let qbuf = '';
    let wep = null;
    let oldwep = null;
    let result = 0;
    wielding: {
        /* Since the quiver isn't in your hands, don't check cantwield(),
       will_weld(), touch_petrifies(), etc. */
        game.multi = 0;
        if (((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1))) {
            await pline("Don't be ridiculous!");
            return 4;
        }
        /* Keep going even if inventory is completely empty, since wielding '-'
       to wield nothing can be construed as a positive act even when done
       so redundantly. */
        /* forget last splitobj() before calling getobj() with GETOBJ_ALLOWCNT */
        clear_splitobjs();
        if (!(wep = await getobj("wield", wield_ok, 2 | 1))) {
            return 2;
        } else if (wep == game.uwep) {
            already_wielded: {
            }
            await You("are already wielding that!");
            if (((wep).oclass == TOOL_CLASS && game.objects[(wep).otyp].oc_subtyp != P_NONE) || ((wep).otyp == TOWEL && (wep).spe > 0)) {
                game.unweapon = (0);
            }
            return 4;
        } else if (welded(game.uwep)) {
            await weldmsg(game.uwep);
            /* previously interrupted armor removal mustn't be resumed */
            reset_remarm();
            /* if player chose a partial stack but can't wield it, undo split */
            if (wep.o_id && wep.o_id == game.context.objsplit.child_oid) {
                await unsplitobj(wep);
            }
            return 4;
        } else if (wep.o_id && wep.o_id == game.context.objsplit.child_oid) {
            if (game.uwep && game.uwep.o_id == game.context.objsplit.parent_oid) {
                await unsplitobj(wep);
                /* wep was merged back to uwep, already_wielded uses wep */
                wep = game.uwep;
                await You("are already wielding that!");
                if (((wep).oclass == TOOL_CLASS && game.objects[(wep).otyp].oc_subtyp != P_NONE) || ((wep).otyp == TOWEL && (wep).spe > 0)) {
                    game.unweapon = (0);
                }
                return 4;
            }
            await finish_splitting(wep);
            break wielding;
        }
        if (wep == game.hands_obj) {
            /* Handle no object, or object in other slot */
            wep = null;
        } else if (wep == game.uswapwep) {
            return await doswapweapon();
        } else if (wep == game.uquiver) {
            if (game.uquiver.quan > 1 && inv_cnt((0)) < invlet_basic && splittable(game.uquiver)) {
                qbuf = sprintf(qbuf, "You have %ld %s readied.  Wield one?", game.uquiver.quan, await simpleonames(game.uquiver));
                switch (await yn_function(qbuf, ynqchars, 113, (1))) {
                    /* offer to split stack if multiple are quivered */
                    /* offer to split stack if wielding more than 1 */
                    case 113:
                        return 0;
                    case 121:
                        wep = await splitobj(game.uquiver, 1);
                        await finish_splitting(wep);
                        break wielding;
                    default:
                        break;
                }
                qbuf = strcpy(qbuf, "Wield all of them instead?");
            } else {
                let use_plural = (((game.uquiver).quan != 1 || ((game.uquiver).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) || ((game.uquiver).otyp == LENSES || (game.uquiver.oclass == ARMOR_CLASS && game.objects[game.uquiver.otyp].oc_subtyp == ARM_GLOVES) || (game.uquiver.oclass == ARMOR_CLASS && game.objects[game.uquiver.otyp].oc_subtyp == ARM_BOOTS)));
                qbuf = sprintf(qbuf, "You have %s readied.  Wield %s instead?", !use_plural ? "that" : "those", !use_plural ? "it" : "them");
            }
            if (await yn_function(qbuf, ynqchars, 113, (1)) != 121) {
                await Shk_Your(qbuf, game.uquiver);
                await pline("%s%s %s readied.", qbuf, await simpleonames(game.uquiver), await otense(game.uquiver, "remain"));
                return 0;
            }
            await setuqwep(null);
        } else if (wep.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288) | 1048576)) {
            await You("cannot wield that!");
            return 4;
        }
    }
    /* Unwield your current secondary weapon */
    oldwep = game.uwep;
    result = await ready_weapon(wep);
    if (game.flags.pushweapon && oldwep && game.uwep != oldwep) {
        await setuswapwep(oldwep);
    }
    await untwoweapon();
    return result;
}
/* the #swap command - swap wielded and secondary weapons */
export async function doswapweapon() {
    let oldwep = null;
    let oldswap = null;
    let result = 0;
    game.multi = 0;
    if (((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1))) {
        await pline("Don't be ridiculous!");
        return 4;
    }
    if (welded(game.uwep)) {
        await weldmsg(game.uwep);
        return 4;
    }
    oldwep = game.uwep;
    oldswap = game.uswapwep;
    await setuswapwep(null);
    result = await ready_weapon(oldswap);
    if (game.uwep == oldwep) {
        await setuswapwep(oldswap);
    } else {
        await setuswapwep(oldwep);
        if (game.uswapwep) {
            await prinv(null, game.uswapwep, 0);
        } else {
            await You("have no secondary weapon readied.");
        }
    }
    if (game.u.twoweap && !await can_twoweapon()) {
        await untwoweapon();
    }
    return result;
}
/* the #quiver command */
export async function dowieldquiver() {
    return await doquiver_core("ready");
}
/* guts of #quiver command; also used by #fire when refilling empty quiver */
/* "ready" or "fire" */
export async function doquiver_core(verb) {
    let qbuf = '';
    let newquiver = null;
    let res = 0;
    let was_uwep = 0;
    let was_twoweap = 0;
    quivering: {
        was_uwep = (0);
        was_twoweap = game.u.twoweap;
        game.multi = 0;
        if (!game.invent) {
            await You("have nothing to ready for firing.");
            return 0;
        }
        clear_splitobjs();
        newquiver = await getobj(verb, ready_ok, 2 | 1);
        if (!newquiver) {
            return 2;
        } else if (newquiver == game.hands_obj) {
            if (game.uquiver) {
                await You("now have no ammunition readied.");
                await setuqwep(null);
            } else {
                await You("already have no ammunition readied!");
            }
            return 0;
        } else if (newquiver.o_id == game.context.objsplit.child_oid) {
            if (game.uquiver && game.uquiver.o_id == game.context.objsplit.parent_oid) {
                await unsplitobj(newquiver);
                await pline("That ammunition is already readied!");
                return 0;
            } else if (newquiver.oclass == COIN_CLASS) {
                await You("can't ready only part of your gold.");
                await unsplitobj(newquiver);
                return 0;
            }
            await finish_splitting(newquiver);
        } else if (newquiver == game.uquiver) {
            already_quivered: {
            }
            await pline("That ammunition is already readied!");
            return 0;
        } else if (newquiver.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288) | 1048576)) {
            await You("cannot %s that!", verb);
            return 0;
        } else if (newquiver == game.uwep) {
            let weld_res = !game.uwep.bknown;
            if (welded(game.uwep)) {
                await weldmsg(game.uwep);
                reset_remarm();
                return weld_res ? 1 : 0;
            }
            if (game.uwep.quan > 1 && inv_cnt((0)) < invlet_basic && splittable(game.uwep)) {
                qbuf = sprintf(qbuf, "You are wielding %ld %s.  Ready %ld of them?", game.uwep.quan, await simpleonames(game.uwep), game.uwep.quan - 1);
                switch (await yn_function(qbuf, ynqchars, 113, (1))) {
                    case 113:
                        return 0;
                    case 121:
                        newquiver = await splitobj(game.uwep, game.uwep.quan - 1);
                        await finish_splitting(newquiver);
                        break quivering;
                    default:
                        break;
                }
                qbuf = strcpy(qbuf, "Ready all of them instead?");
            } else {
                let use_plural = (((game.uwep).quan != 1 || ((game.uwep).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) || ((game.uwep).otyp == LENSES || (game.uwep.oclass == ARMOR_CLASS && game.objects[game.uwep.otyp].oc_subtyp == ARM_GLOVES) || (game.uwep.oclass == ARMOR_CLASS && game.objects[game.uwep.otyp].oc_subtyp == ARM_BOOTS)));
                qbuf = sprintf(qbuf, "You are wielding %s.  Ready %s instead?", !use_plural ? "that" : "those", !use_plural ? "it" : "them");
            }
            if (await yn_function(qbuf, ynqchars, 113, (1)) != 121) {
                await Shk_Your(qbuf, game.uwep);
                await pline("%s%s %s wielded.", qbuf, await simpleonames(game.uwep), await otense(game.uwep, "remain"));
                return 0;
            }
            await setuwep(null);
            await untwoweapon();
            was_uwep = (1);
        } else if (newquiver == game.uswapwep) {
            if (game.uswapwep.quan > 1 && inv_cnt((0)) < invlet_basic && splittable(game.uswapwep)) {
                qbuf = sprintf(qbuf, "%s %ld %s.  Ready %ld of them?", game.u.twoweap ? "You are dual wielding" : "Your alternate weapon is", game.uswapwep.quan, await simpleonames(game.uswapwep), game.uswapwep.quan - 1);
                switch (await yn_function(qbuf, ynqchars, 113, (1))) {
                    case 113:
                        return 0;
                    case 121:
                        newquiver = await splitobj(game.uswapwep, game.uswapwep.quan - 1);
                        await finish_splitting(newquiver);
                        break quivering;
                    default:
                        break;
                }
                qbuf = strcpy(qbuf, "Ready all of them instead?");
            } else {
                let use_plural = (((game.uswapwep).quan != 1 || ((game.uswapwep).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) || ((game.uswapwep).otyp == LENSES || (game.uswapwep.oclass == ARMOR_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp == ARM_GLOVES) || (game.uswapwep.oclass == ARMOR_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp == ARM_BOOTS)));
                qbuf = sprintf(qbuf, "%s your %s weapon.  Ready %s instead?", !use_plural ? "That is" : "Those are", game.u.twoweap ? "second" : "alternate", !use_plural ? "it" : "them");
            }
            if (await yn_function(qbuf, ynqchars, 113, (1)) != 121) {
                await Shk_Your(qbuf, game.uswapwep);
                await pline("%s%s %s %s.", qbuf, await simpleonames(game.uswapwep), await otense(game.uswapwep, "remain"), game.u.twoweap ? "wielded" : "as secondary weapon");
                return 0;
            }
            await setuswapwep(null);
            await untwoweapon();
        }
    }
    if (!strcmp(verb, "ready")) {
        await setuqwep(newquiver);
        await prinv(null, newquiver, 0);
    } else {
        await prinv("You ready:", newquiver, 0);
        await setuqwep(newquiver);
    }
    /* quiver is a convenience slot and manipulating it ordinarily
       consumes no time, but unwielding primary or secondary weapon
       should take time (perhaps we're adjacent to a rust monster
       or disenchanter and want to hit it immediately, but not with
       something we're wielding that's vulnerable to its damage) */
    res = 0;
    if (was_uwep) {
        await You("are now %s.", empty_handed());
        res = 1;
    } else if (was_twoweap && !game.u.twoweap) {
        await You("%s.", are_no_longer_twoweap);
        res = 1;
    }
    return res ? 1 : 0;
}
/* used for #rub and for applying pick-axe, whip, grappling hook or polearm */
/* "rub",&c */
export async function wield_tool(obj, verb) {
    let what = null;
    let more_than_1 = 0;
    if (game.uwep && obj == game.uwep) {
        return (1);
    }
    /* nothing to do if already wielding it */
    if (!verb) {
        verb = "wield";
    }
    what = await xname(obj);
    more_than_1 = (obj.quan > 1 || strstri(what, "pair of ") != null || strstri(what, "s of ") != null);
    if (obj.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288))) {
        await You_cant("%s %s while wearing %s.", verb, await yname(obj), more_than_1 ? "them" : "it");
        return (0);
    }
    if (game.uwep && welded(game.uwep)) {
        if (game.flags.verbose) {
            let hand = await body_part(HAND);
            if (((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
                hand = await makeplural(hand);
            }
            if (strstri(what, "pair of ") != null) {
                more_than_1 = (0);
            }
            await pline("Since your weapon is welded to your %s, you cannot %s %s %s.", hand, verb, more_than_1 ? "those" : "that", await xname(obj));
        } else {
            await You_cant("do that.");
        }
        return (0);
    }
    if (((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1))) {
        await You_cant("hold %s strongly enough.", more_than_1 ? "them" : "it");
        return (0);
    }
    if (game.uarms && ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_big)) {
        await You("cannot %s a two-handed %s while wearing a shield.", verb, (obj.oclass == WEAPON_CLASS) ? "weapon" : "tool");
        return (0);
    }
    if (game.uquiver == obj) {
        await setuqwep(null);
    }
    if (game.uswapwep == obj) {
        await doswapweapon();
        if (game.uswapwep == obj) {
            return (0);
        }
    } else {
        let oldwep = game.uwep;
        if (((obj).cursed && (((obj).oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) || (obj).otyp == HEAVY_IRON_BALL || (obj).otyp == IRON_CHAIN) || (obj).otyp == TIN_OPENER))) {
            await ready_weapon(obj);
        } else {
            await You("now wield %s.", await doname(obj));
            await setuwep(obj);
        }
        if (game.flags.pushweapon && oldwep && game.uwep != oldwep) {
            await setuswapwep(oldwep);
        }
    }
    if (game.uwep && game.uwep != obj) {
        return (0);
    }
    if (game.u.twoweap) {
        await untwoweapon();
    }
    if (obj.oclass != WEAPON_CLASS) {
        game.unweapon = (1);
    }
    return (1);
}
export async function can_twoweapon() {
    let otmp = null;
    if (!((((game.youmonst.data).mattk[0].aatyp == 254) + ((game.youmonst.data).mattk[1].aatyp == 254) + ((game.youmonst.data).mattk[2].aatyp == 254)) > 1)) {
        if ((game.u.umonnum != game.u.umonster)) {
            await You_cant("use two weapons in your current form.");
        } else {
            await pline("%s aren't able to use two weapons at once.", await makeplural((game.flags.female && game.urole.name.f) ? game.urole.name.f : game.urole.name.m));
        }
    } else if (!game.uwep || !game.uswapwep) {
        let hand_s = await body_part(HAND);
        if (!game.uwep && !game.uswapwep) {
            hand_s = await makeplural(hand_s);
        }
        await Your("%s%s %s empty.", game.uwep ? "left " : game.uswapwep ? "right " : "", hand_s, await vtense(hand_s, "are"));
    } else if (!(((game.uwep).oclass == WEAPON_CLASS) ? !((game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_BOW && game.objects[game.uwep.otyp].oc_subtyp <= P_CROSSBOW) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == GEM_CLASS) && game.objects[game.uwep.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uwep.otyp].oc_subtyp <= -P_BOW) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[game.uwep.otyp].oc_subtyp <= -P_DART)) : ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)) || !(((game.uswapwep).oclass == WEAPON_CLASS) ? !((game.uswapwep.oclass == WEAPON_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp >= P_BOW && game.objects[game.uswapwep.otyp].oc_subtyp <= P_CROSSBOW) || ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == GEM_CLASS) && game.objects[game.uswapwep.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uswapwep.otyp].oc_subtyp <= -P_BOW) || ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == TOOL_CLASS) && game.objects[game.uswapwep.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[game.uswapwep.otyp].oc_subtyp <= -P_DART)) : ((game.uswapwep).oclass == TOOL_CLASS && game.objects[(game.uswapwep).otyp].oc_subtyp != P_NONE))) {
        otmp = !(((game.uwep).oclass == WEAPON_CLASS) ? !((game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_BOW && game.objects[game.uwep.otyp].oc_subtyp <= P_CROSSBOW) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == GEM_CLASS) && game.objects[game.uwep.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uwep.otyp].oc_subtyp <= -P_BOW) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[game.uwep.otyp].oc_subtyp <= -P_DART)) : ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)) ? game.uwep : game.uswapwep;
        await pline("%s %s suitable %s weapon%s.", await Yname2(otmp), ((otmp).quan != 1 || ((otmp).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "aren't" : "isn't a", (otmp == game.uwep) ? "primary" : "secondary", (((otmp.quan) == 1) ? "" : "s"));
    } else if (((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big) || ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == TOOL_CLASS) && game.objects[game.uswapwep.otyp].oc_big)) {
        otmp = ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big) ? game.uwep : game.uswapwep;
        await pline("%s isn't one-handed.", await Yname2(otmp));
    } else if (game.uarms) {
        await You_cant("use two weapons while wearing a shield.");
    } else if (game.uswapwep.oartifact) {
        await pline("%s being held second to another weapon!", await Yobjnam2(game.uswapwep, "resist"));
    } else if (game.uswapwep.otyp == CORPSE && await cant_wield_corpse(game.uswapwep)) {
        ;
    } else if (game.u.uprops[GLIB].intrinsic || game.uswapwep.cursed) {
        /* [Note: !TWOWEAPOK() check prevents ever getting here...] */
        /* must be life-saved to reach here; return FALSE */
        if (!game.u.uprops[GLIB].intrinsic) {
            set_bknown(game.uswapwep, 1);
        }
        await drop_uswapwep();
    } else {
        return (1);
    }
    return (0);
}
/* uswapwep has become cursed while in two-weapon combat mode or hero is
   attempting to dual-wield when it is already cursed or hands are slippery */
export async function drop_uswapwep() {
    let left_hand = '';
    let obj = game.uswapwep;
    left_hand = sprintf(left_hand, "left %s", await body_part(HAND));
    if (!obj.cursed) {
        await pline("%s from your %s!", await Yobjnam2(obj, "slip"), left_hand);
    } else if (!game.u.twoweap) {
        await pline("%s your grasp and %s from your %s!", await Yobjnam2(obj, "evade"), await otense(obj, "drop"), left_hand);
    } else {
        await Your("%s spasms and drops %s!", left_hand, await yobjnam(obj, null));
    }
    await dropx(obj);
}
export function set_twoweap(on_off) {
    if (on_off != game.u.twoweap) {
        game.u.twoweap = on_off;
        if (game.flags.weaponstatus) {
            game.disp.botl = (1);
        }
    }
}
/* the #twoweapon command */
export async function dotwoweapon() {
    if (game.u.twoweap) {
        await You("switch to your primary weapon.");
        set_twoweap((0));
        update_inventory();
        return 0;
    }
    if (await can_twoweapon()) {
        await You("begin two-weapon combat.");
        set_twoweap((1));
        update_inventory();
        return (rnd(20) > (acurr(A_DEX))) ? 1 : 0;
    }
    return 0;
}
/*** Functions to empty a given slot ***/
/* These should be used only when the item can't be put back in
 * the slot by life saving.  Proper usage includes:
 * 1.  The item has been eaten, stolen, burned away, or rotted away.
 * 2.  Making an item disappear for a bones pile.
 */
export async function uwepgone() {
    if (game.uwep) {
        if (artifact_light(game.uwep) && game.uwep.lamplit) {
            await end_burn(game.uwep, (0));
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("%s shining.", await Tobjnam(game.uwep, "stop"));
            }
        }
        await setworn(null, 256);
        game.unweapon = (1);
        update_inventory();
    }
}
export async function uswapwepgone() {
    if (game.uswapwep) {
        await setworn(null, 1024);
        update_inventory();
    }
}
export async function uqwepgone() {
    if (game.uquiver) {
        await setworn(null, 512);
        update_inventory();
    }
}
export async function untwoweapon() {
    if (game.u.twoweap) {
        await You("%s.", can_no_longer_twoweap);
        set_twoweap((0));
        update_inventory();
    }
    return;
}
/* enchant wielded weapon */
export async function chwepon(otmp, amount) {
    let color = hcolor((amount < 0) ? c_color_names.c_black : c_color_names.c_blue);
    let xtime = null;
    let wepname = "";
    let multiple = 0;
    let otyp = STRANGE_OBJECT;
    if (!game.uwep || (game.uwep.oclass != WEAPON_CLASS && !((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE))) {
        let buf = '';
        if (amount >= 0 && game.uwep && ((game.uwep).cursed && (((game.uwep).oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE) || (game.uwep).otyp == HEAVY_IRON_BALL || (game.uwep).otyp == IRON_CHAIN) || (game.uwep).otyp == TIN_OPENER))) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                buf = sprintf(buf, "%s with %s aura.", await Yobjnam2(game.uwep, "glow"), await an(hcolor(c_color_names.c_amber)));
                /* ok to bypass set_bknown() */
                game.uwep.bknown = !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic));
            } else {
                buf = sprintf(buf, "Your right %s tingles.", await body_part(HAND));
            }
            await uncurse(game.uwep);
            update_inventory();
        } else {
            buf = sprintf(buf, "Your %s %s.", await makeplural(await body_part(HAND)), (amount >= 0) ? "twitch" : "itch");
        }
        await strange_feeling(otmp, buf);
        await exercise(A_DEX, (amount >= 0));
        return 0;
    }
    if (otmp && otmp.oclass == SCROLL_CLASS) {
        otyp = otmp.otyp;
    }
    if (game.uwep.otyp == WORM_TOOTH && amount >= 0) {
        multiple = (game.uwep.quan > 1);
        await Your("%s %s much sharper now.", await simpleonames(game.uwep), multiple ? "fuse, and become" : "is");
        game.uwep.otyp = CRYSKNIFE;
        game.uwep.oerodeproof = 0;
        if (multiple) {
            game.uwep.quan = 1;
            game.uwep.owt = await weight(game.uwep);
        }
        if (game.uwep.cursed) {
            await uncurse(game.uwep);
        }
        if (game.uwep.unpaid) {
            await alter_cost(game.uwep, 0);
        }
        if (otyp != STRANGE_OBJECT) {
            await discover_object((otyp), (1), (1), (1));
        }
        if (multiple) {
            await encumber_msg();
        }
        return 1;
    } else if (game.uwep.otyp == CRYSKNIFE && amount < 0) {
        multiple = (game.uwep.quan > 1);
        await Your("%s %s much duller now.", await simpleonames(game.uwep), multiple ? "fuse, and become" : "is");
        await costly_alteration(game.uwep, COST_DEGRD);
        game.uwep.otyp = WORM_TOOTH;
        game.uwep.oerodeproof = 0;
        if (multiple) {
            game.uwep.quan = 1;
            game.uwep.owt = await weight(game.uwep);
        }
        if (otyp != STRANGE_OBJECT && otmp.bknown) {
            await discover_object((otyp), (1), (1), (1));
        }
        if (multiple) {
            await encumber_msg();
        }
        return 1;
    }
    if (((game.uwep).oextra && ((game.uwep).oextra.oname))) {
        wepname = ((game.uwep).oextra.oname);
    }
    if (amount < 0 && game.uwep.oartifact && restrict_name(game.uwep, wepname)) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await pline("%s %s.", await Yobjnam2(game.uwep, "faintly glow"), color);
        }
        return 1;
    }
    if (((game.uwep.spe > 5 && amount >= 0) || (game.uwep.spe < -5 && amount < 0)) && rn2(3)) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await pline("%s %s for a while and then %s.", await Yobjnam2(game.uwep, "violently glow"), color, await otense(game.uwep, "evaporate"));
        } else {
            await pline("%s.", await Yobjnam2(game.uwep, "evaporate"));
        }
        await useupall(game.uwep);
        return 1;
    }
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        xtime = (amount * amount == 1) ? "moment" : "while";
        await pline("%s %s for a %s.", await Yobjnam2(game.uwep, amount == 0 ? "violently glow" : "glow"), color, xtime);
        if (otyp != STRANGE_OBJECT && game.uwep.known && (amount > 0 || (amount < 0 && otmp.bknown))) {
            await discover_object((otyp), (1), (1), (1));
        }
    }
    if (amount < 0) {
        await costly_alteration(game.uwep, COST_DECHNT);
    }
    game.uwep.spe += amount;
    if (amount > 0) {
        if (game.uwep.cursed) {
            await uncurse(game.uwep);
        }
        if (game.uwep.unpaid) {
            await alter_cost(game.uwep, 0);
        }
    }
    if (is_art(game.uwep, ART_MAGICBANE) && game.uwep.spe >= 0) {
        await Your("right %s %sches!", await body_part(HAND), (((amount > 1) && (game.uwep.spe > 1)) ? "flin" : "it"));
    }
    /* an elven magic clue, cookie@keebler */
    /* elven weapons vibrate warningly when enchanted beyond a limit */
    if ((game.uwep.spe > 5) && (((game.uwep).otyp == ELVEN_ARROW || (game.uwep).otyp == ELVEN_SPEAR || (game.uwep).otyp == ELVEN_DAGGER || (game.uwep).otyp == ELVEN_SHORT_SWORD || (game.uwep).otyp == ELVEN_BROADSWORD || (game.uwep).otyp == ELVEN_BOW) || game.uwep.oartifact || !rn2(7))) {
        await pline("%s unexpectedly.", await Yobjnam2(game.uwep, "suddenly vibrate"));
    }
    return 1;
}
export function welded(obj) {
    if (obj && obj == game.uwep && ((obj).cursed && (((obj).oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) || (obj).otyp == HEAVY_IRON_BALL || (obj).otyp == IRON_CHAIN) || (obj).otyp == TIN_OPENER))) {
        set_bknown(obj, 1);
        return 1;
    }
    return 0;
}
export async function weldmsg(obj) {
    let savewornmask = 0;
    let hand = await body_part(HAND);
    if (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_big)) {
        hand = await makeplural(hand);
    }
    savewornmask = obj.owornmask;
    /* suppress doname()'s "(weapon in hand)";
                          * Yobjnam2() doesn't actually need this because
                          * it is based on xname() rather than doname() */
    obj.owornmask = 0;
    await pline("%s welded to your %s!", await Yobjnam2(obj, "are"), hand);
    obj.owornmask = savewornmask;
}
/* test whether monster's wielded weapon is stuck to hand/paw/whatever */
export function mwelded(obj) {
    /* caller is responsible for making sure this is a monster's item */
    if (obj && (obj.owornmask & 256) && ((obj).cursed && (((obj).oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) || (obj).otyp == HEAVY_IRON_BALL || (obj).otyp == IRON_CHAIN) || (obj).otyp == TIN_OPENER))) {
        return (1);
    }
    return (0);
}
/*wield.c*/
/* necessary to not set gu.unweapon */
/* gaining or losing Con bonus */
/* This message isn't printed in the caller because it happens
     * *whenever* Sunsword is unwielded, from whatever cause. */
/* Prevent wielding cockatrice when not wearing gloves --KAA */
/* hands but no weapon and no gloves */
/* alternate phrasing for paws or lack of hands */
/* skip this message if we already got "empty handed" one above;
               also, Null is not safe for neither TWOWEAPOK() or bimanual() */
/* KMH -- Talking artifacts are finally implemented */
/* sets ECMD_TIME bit if artifact speaks */
/* obj was split off from something; give it its own invlet */
/* if wep is the result of supplying a count to getobj()
           we don't want to split something already wielded; for
           any other item, we need to give it its own inventory slot */
/* leave N-1 quivered, split off 1 to wield */
/* require confirmation to wield the quivered weapon */
/* wielding whole readied stack, so no longer quivered */
/* Set your new primary weapon */
/* Set your new secondary weapon */
/* Wield failed for some reason */
/* could accept '-' to empty quiver, but there's no point since
           inventory is empty so uquiver is already Null */
/* Prompt for a new quiver: "What do you want to {ready|fire}?" */
/* skip 'quivering: prinv()' */
/* if newquiver is the result of supplying a count to getobj()
           we don't want to split something already in the quiver;
           for any other item, we need to give it its own inventory slot */
/* don't allow splitting a stack of coins into quiver */
/* leave 1 wielded, split rest off and put into quiver */
/* require confirmation to ready the main weapon */
/* quivering main weapon, so no longer wielding it */
/* leave 1 alt-wielded, split rest off and put into quiver */
/* require confirmation to ready the alternate weapon */
/* quivering alternate weapon, so no more uswapwep */
/* place item in quiver before printing so that inventory feedback
           includes "(at the ready)" */
/* verb=="fire", manually refilling quiver during 'f'ire */
/* prefix item with description of action, so don't want that to
           include "(at the ready)" */
/* hope none of ready_weapon()'s early returns apply here... */
/* rewielded old object after dying */
/* applying weapon or tool that gets wielded ends two-weapon combat */
/* "your hands are empty" or "your {left|right} hand is empty" */
/* already two-weaponing but can't anymore because uswapwep has
           become cursed */
/* this used to use makeplural(body_part(HAND)) but in order to be
       dual-wielded, or to get this far attempting to achieve that,
       uswapwep must be one-handed; since it's secondary, the hand must
       be the left one */
/* attempting to two-weapon while Glib */
/* attempting to two-weapon when uswapwep is cursed */
/* You can always toggle it off */
/* cursed tin opener is wielded in right hand */
/* pline()+docall()+useup() */
/* order: message, transformation, shop handling */
/* update shop bill to reflect new higher value */
/* order matters: message, shop handling, transformation */
/* let all of them disappear */
/* update shop bill to reflect new higher price */
/*
     * Enchantment, which normally improves a weapon, has an
     * additional adverse reaction on Magicbane whose effects are
     * spe dependent.  Give an obscure clue here.
     */
