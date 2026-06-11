/* NetHack 5.0	shk.c	$NHDT-Date: 1736516428 2025/01/10 05:40:28 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.306 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * FIXME:
 *  The normal shop messages are verbal.  There are a lot of cases
 *  where an alternate message is given if the hero is deaf or shk
 *  is mute (when poly'd), but that is usually visual-based.  It is
 *  possible for hero to pay for items while blind (only if adjacent
 *  to shk) and the alternate messages fail to account for that.
 */
/* too poor */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { qsort } from '../c2js-runtime/qsort.js';
import { __nh_buf_append, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strcat, strchr, strcmp, strcpy, strlen, strncmp, strncmpi, strncpy } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { o_unleash, um_dist, unleash_all } from './apply.js';
import { arti_cost } from './artifact.js';
import { acurr, adjalign, exercise } from './attrib.js';
import { placebc, unplacebc } from './ball.js';
import { drop_upon_death } from './bones.js';
import { bot } from './botl.js';
import { isok, yn_function } from './cmd.js';
import { c_common_strings, cg, ynaqchars, ynchars } from './decl.js';
import { holetime } from './dig.js';
import { canseemon, map_invisible, newsym, nul_glyphinfo, sensemon } from './display.js';
import { dropy } from './do.js';
import { Monnam, a_monnam, mon_nam, x_monnam, y_monnam } from './do_name.js';
import { migrate_to_level } from './dog.js';
import { assign_level, depth, ledger_no, on_level } from './dungeon.js';
import { food_disappears, intrinsic_possible } from './eat.js';
import { del_engr_at } from './engrave.js';
import { getpos } from './getpos.js';
import { check_special_room, in_rooms, inv_cnt, money_cnt } from './hack.js';
import { dist2, highc, online2, s_suffix, upstart } from './hacklib.js';
import { record_achievement } from './insight.js';
import { addinv, carrying, count_contents, count_unpaid, currency, freeinv, merge_choice, o_on, sobj_at, update_inventory, xprname } from './invent.js';
import { maybe_reset_pick, picking_at } from './lock.js';
import { makemon } from './makemon.js';
import { mattacku } from './mhitu.js';
import { add_to_minv, bill_dummy_object, dealloc_obj, mksobj, newomid, next_ident, obj_extract_self, place_object, remove_object, splitobj, weight } from './mkobj.js';
import { search_special } from './mkroom.js';
import { angry_guards, mnearto, mnexto, mongone, pacify_guards, wake_nearto } from './mon.js';
import { locomotion, pronoun_gender, resist_conflict } from './mondata.js';
import { closed_door, dochug } from './monmove.js';
import { ACH_SHOP, ACID_RES, AGATE, AMBER, AMETHYST, AMULET_CLASS, AQUAMARINE, ARM, ARMOR_CLASS, A_CHA, A_WIS, BAG_OF_TRICKS, BALL_CLASS, BEARTRAP, BEAR_TRAP, BLACK_OPAL, BLINDED, BOULDER, BRASS_LANTERN, CANDELABRUM_OF_INVOCATION, CANDLESHOP, CAN_OF_GREASE, CHAIN_CLASS, CHRYSOBERYL, CITRINE, COIN_CLASS, COLD_RES, CONFLICT, CORPSE, COST_CONTENTS, COST_SINGLEOBJ, CRYSTAL_BALL, DBWALL, DEAF, DETECT_MONSTERS, DIAMOND, DISINT_RES, DISPLACED, DOOR, DRUM_OF_EARTHQUAKE, DUNCE_CAP, DWARVISH_MATTOCK, EGG, EMERALD, EXPENSIVE_CAMERA, EYE, FAST, FIRE_RES, FIRST_GLASS_GEM, FIRST_REAL_GEM, FLUORITE, FOOD_CLASS, GEMSTONE, GEM_CLASS, GLASS, GOLD_SYM, HAND, HEAD, HOLE, HORN_OF_PLENTY, HUNGRY, INVIS, JACINTH, JADE, JASPER, JET, LANDMINE, LAND_MINE, LARGE_BOX, LEASH, LOW_PM, MAGIC_FLUTE, MAGIC_LAMP, MAGIC_MARKER, MIRROR, MS_ANIMAL, MS_HUMANOID, MS_SILENT, M_AP_MONSTER, M_AP_NOTHING, NECK, NUMMONS, OIL_LAMP, OPAL, PASSES_WALLS, PICK_AXE, PIT, PM_ELF, PM_GRID_BUG, PM_KEYSTONE_KOP, PM_KNIGHT, PM_KOP_KAPTAIN, PM_KOP_LIEUTENANT, PM_KOP_SERGEANT, PM_ROGUE, PM_TOURIST, POISON_RES, POOL, POTION_CLASS, POT_OIL, POT_WATER, P_PICK_AXE, RING_CLASS, ROCK, ROOM, RUBY, SAPPHIRE, SCROLL_CLASS, SHOCK_RES, SHOPBASE, SLEEP_RES, SPBOOK_CLASS, SPIKED_PIT, STONE_RES, STRANGE_OBJECT, S_KOP, S_VAMPIRE, TALLOW_CANDLE, TELEPAT, TELEPORT, TELEPORT_CONTROL, TIN, TINNING_KIT, TOOL_CLASS, TOPAZ, TT_PIT, WAND_CLASS, WAX_CANDLE, WEAPON_CLASS, invlet_basic } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { Doname2, The, ansimpleoname, doname, makeplural, obj_typename, paydoname, safe_qbuf, simpleonames, the, the_unique_pm, thesimpleoname, xname } from './objnam.js';
import { Norep, There, livelog_printf } from './pline.js';
import { body_part, mbodypart, poly_gender } from './polyself.js';
import { move_special } from './priest.js';
import { rn2, rnd } from './rnd.js';
import { Hello, genders } from './role.js';
import { Shknam, is_izchak, saleable, shkname, shtypes } from './shknam.js';
import { growl, set_voice, yelp } from './sounds.js';
import { book_disappears } from './spell.js';
import { findgold, mdrop_special_objs, mpickobj, remove_worn_item } from './steal.js';
import { enexto } from './teleport.js';
import { obj_stop_timers } from './timeout.js';
import { deltrap, t_at, trapname } from './trap.js';
import { hidden_gold } from './vault.js';
import { block_point } from './vision.js';
import { add_menu, add_menu_heading, select_menu } from './windows.js';
import { choose_stairs } from './wizard.js';
import { setnotworn } from './worn.js';
import { get_obj_location } from './zap.js';

export const FullyUsedUp = 1;
export const PartlyUsedUp = 2;
export const PartlyIntact = 3;
export const FullyIntact = 4;
export const KnownContainer = 5;
export const UndisclosedContainer = 6;
/* completely used up; obj->where==OBJ_ONBILL */
/* partly used up; obj->where==OBJ_INVENT or similar */
/* intact portion of partly used up item */
/* normal unpaid item */
/* container->cknown==1, holding unpaid item(s) */
/* container->cknown==0 */
/* this is similar to sortloot; the shop bill gets converted into an array of
   struct sortbill_item so that sorting and traversal don't need to access
   the original bill or even the shk; the array gets sorted by usedup vs
   unpaid and by cost within each of those two categories */
// struct sortbill_item: { obj, cost, quan, bidx, usedup, queuedpay }
/* full amount for current quantity, not per-unit amount */
/* count for this entry; subset if this is partly used or
                  * partly intact */
/* index into ESHK(shkp)->bill_p[]; hero-owned container,
                  * which isn't in bill_p[], uses bidx == -1 */
/* billitem_status, small but needs to be signed for qsort()
                  * [for an earlier edition; 'signed' no longer necessary] */
/* buy without asking when containers are involved
                        * or purchase targets have been picked via menu */
/* defined in shknam.c */
const and_its_contents = " and its contents";
const the_contents_of = "the contents of ";
/*
        invariants: obj->unpaid iff onbill(obj) [unless bp->useup]
                    obj->quan <= bp->bquan
 */
const angrytexts = ["quite upset", "ticked off", "furious"];
/*
 *  Transfer money from inventory to monster when paying
 *  shopkeepers, priests, oracle, succubus, and other demons.
 *  Simple with only gold coins.
 *  This routine will handle money changing when multiple
 *  coin types is implemented, only appropriate
 *  monsters will pay change.  (Peaceful shopkeepers, priests
 *  and the oracle try to maintain goodwill while selling
 *  their wares or services.  Angry monsters and all demons
 *  will keep anything they get their hands on.
 *  Returns the amount actually paid, so we can know
 *  if the monster kept the change.
 */
export function money2mon(mon, amount) {
    let ygold = findgold(game.invent);
    if (amount <= 0) {
        impossible("%s payment in money2mon!", amount ? "negative" : "zero");
        return 0;
    }
    if (!ygold || ygold.quan < amount) {
        impossible("Paying without %s gold?", ygold ? "enough" : "");
        return 0;
    }
    if (ygold.quan > amount) {
        ygold = splitobj(ygold, amount);
    } else if (ygold.owornmask) {
        remove_worn_item(ygold, (0));
    }
    freeinv(ygold);
    add_to_minv(mon, ygold);
    game.disp.botl = (1);
    return amount;
}
/*
 *  Transfer money from monster to inventory.
 *  Used when the shopkeeper pay for items, and when
 *  the priest gives you money for an ale.
 */
export function money2u(mon, amount) {
    let mongold = findgold(mon.minvent);
    if (amount <= 0) {
        impossible("%s payment in money2u!", amount ? "negative" : "zero");
        /* change to obj->where==OBJ_DELETED */
        /* [Perhaps we ought to check whether this conversation
           is taking place inside an untended shop, but a shopless
           shk can probably be expected to be rather disoriented.] */
        /**************************************************************
     * Scenario 4. player_owned glob merging into player_owned glob
     **************************************************************/
        return;
    }
    if (!mongold || mongold.quan < amount) {
        impossible("%s paying without %s gold?", a_monnam(mon), mongold ? "enough" : "");
        return;
    }
    if (mongold.quan > amount) {
        mongold = splitobj(mongold, amount);
    }
    obj_extract_self(mongold);
    if (!merge_choice(game.invent, mongold) && inv_cnt((0)) >= invlet_basic) {
        You("have no room for the gold!");
        dropy(mongold);
    } else {
        addinv(mongold);
        game.disp.botl = (1);
    }
}
export function next_shkp(shkp, withbill) {
    for (; shkp; shkp = shkp.nmon) {
        if (((shkp).mhp < 1)) {
            continue;
        }
        if (shkp.isshk && (((shkp).mextra.eshk).billct || !withbill)) {
            break;
        }
    }
    if (shkp) {
        if ((!((shkp).mpeaceful))) {
            if (!((shkp).mextra.eshk).surcharge) {
                rile_shk(shkp);
            }
        }
    }
    return shkp;
}
/* called in mon.c */
export function shkgone(mtmp) {
    let eshk = ((mtmp).mextra.eshk);
    let sroom = game.rooms[eshk.shoproom - 3];
    let otmp = null;
    let p = null;
    let sx = 0;
    let sy = 0;
    if (on_level(eshk.shoplevel, game.u.uz)) {
        /* [BUG: some of this should be done on the shop level */
        /*       even when the shk dies on a different level.] */
        discard_damage_owned_by(mtmp);
        sroom.resident = null;
        if (!search_special((-2))) {
            game.level.flags.has_shop = 0;
        }
        /* items on shop floor revert to ordinary objects */
        for (sx = sroom.lx; sx <= sroom.hx; sx++) {
            for (sy = sroom.ly; sy <= sroom.hy; sy++) {
                for (otmp = game.level.objects[sx][sy]; otmp; otmp = otmp.v.v_nexthere) {
                    otmp.no_charge = 0;
                }
            }
        }
        if ((p = strchr(game.u.ushops, eshk.shoproom)) != null) {
            /* Make sure bill is set only when the
           dead shk is the resident shk. */
            setpaid(mtmp);
            eshk.bill_p = null;
            /* remove eshk->shoproom from u.ushops */
            do {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = __nh_char_at0((__nh_advance_str(p, 1)))) */;
            } while ((p = __nh_advance_str(p, 1)));
        }
    }
}
export function set_residency(shkp, zero_out) {
    if (on_level((((shkp).mextra.eshk).shoplevel), game.u.uz)) {
        game.rooms[((shkp).mextra.eshk).shoproom - 3].resident = (zero_out) ? null : shkp;
    }
}
export function replshk(mtmp, mtmp2) {
    game.rooms[((mtmp2).mextra.eshk).shoproom - 3].resident = mtmp2;
    if (inhishop(mtmp) && game.u.ushops == ((mtmp).mextra.eshk).shoproom) {
        ((mtmp2).mextra.eshk).bill_p = (((mtmp2).mextra.eshk).bill[0]);
    }
}
/* do shopkeeper specific structure munging -dlc */
export function restshk(shkp, ghostly) {
    if (game.u.uz.dlevel) {
        let eshkp = ((shkp).mextra.eshk);
        if (eshkp.bill_p != -1000) {
            /* reset bill_p, need to re-calc player's occupancy too */
            eshkp.bill_p = eshkp.bill[0];
        }
        if (ghostly) {
            /* shoplevel can change as dungeons move around */
            /* savebones guarantees that non-homed shk's will be gone */
            assign_level(eshkp.shoplevel, game.u.uz);
            if ((!((shkp).mpeaceful)) && strncmpi(eshkp.customer, game.plname, 32)) {
                pacify_shk(shkp, (1));
            }
        }
    }
}
/* clear the unpaid bit on a single object and its contents */
export function clear_unpaid_obj(shkp, otmp) {
    if (((otmp).cobj != null)) {
        clear_unpaid(shkp, otmp.cobj);
    }
    if (onbill(otmp, shkp, (1))) {
        otmp.unpaid = 0;
    }
}
/* clear the unpaid bit on all of the objects in the list */
export function clear_unpaid(shkp, list) {
    while (list) {
        clear_unpaid_obj(shkp, list);
        /* move on to next element of list */
        list = list.nobj;
    }
}
/* clear the no_charge bit on a single object and its contents */
/* if null, clear regardless of shop */
export function clear_no_charge_obj(shkp, otmp) {
    if (((otmp).cobj != null)) {
        clear_no_charge(shkp, otmp.cobj);
    }
    if (otmp.no_charge) {
        let rm_shkp = null;
        let rno = 0;
        let x = 0;
        let y = 0;
        /*
         * Clear no_charge if
         *  shkp is Null (clear all items on specified list)
         *  or not located somewhere that we expect no_charge (which is
         *    floor [of shop] or inside container [on shop floor])
         *  or can't find object's map coordinates (should never happen
         *    for floor or contained; conceivable if on shop bill somehow
         *    but would have failed the floor-or-contained test since
         *    containers get emptied before going onto bill)
         *  or fails location sanity check (should always be good when
         *    location successfully found)
         *  or not inside any room
         *  or the room isn't a shop
         *  or the shop has no shopkeeper (deserted)
         *  or shopkeeper is the current one (to avoid clearing no_charge
         *    for items located in some rival's shop).
         *
         * no_charge items in a shop which is only temporarily deserted
         * become owned by the shop now and will be for-sale once the shk
         * returns.
         */
        if (!shkp || (otmp.where != 1 && otmp.where != 2 && otmp.where != 6) || !get_obj_location(otmp, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 2 | 6) || !isok(x, y) || (rno = game.level.locations[x][y].roomno) < 3 || !(game.rooms[rno - 3].rtype >= SHOPBASE) || (rm_shkp = game.rooms[rno - 3].resident) == null || rm_shkp == shkp) {
            otmp.no_charge = 0;
        }
    }
}
/* clear the no_charge bit on all of the objects in the list */
export function clear_no_charge(shkp, list) {
    while (list) {
        /* handle first element of list and any contents it may have */
        clear_no_charge_obj(shkp, list);
        list = list.nobj;
    }
}
/* clear no_charge from objects in pets' inventories belonging to shkp */
export function clear_no_charge_pets(shkp) {
    let mtmp = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (mtmp.mtame && mtmp.minvent) {
            clear_no_charge(shkp, mtmp.minvent);
        }
    }
}
/* either you paid or left the shop or the shopkeeper died */
export function setpaid(shkp) {
    let obj = null;
    let mtmp = null;
    clear_unpaid(shkp, game.invent);
    clear_unpaid(shkp, game.level.objlist);
    if (game.level.buriedobjlist) {
        clear_unpaid(shkp, game.level.buriedobjlist);
    }
    if (game.thrownobj) {
        clear_unpaid_obj(shkp, game.thrownobj);
    }
    if (game.kickedobj) {
        clear_unpaid_obj(shkp, game.kickedobj);
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (mtmp.minvent) {
            clear_unpaid(shkp, mtmp.minvent);
        }
    }
    for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
        if (mtmp.minvent) {
            clear_unpaid(shkp, mtmp.minvent);
        }
    }
    /* clear obj->no_charge for all obj in shkp's shop */
    clear_no_charge(shkp, game.level.objlist);
    clear_no_charge(shkp, game.level.buriedobjlist);
    while ((obj = game.billobjs) != null) {
        obj_extract_self(obj);
        dealloc_obj(obj);
    }
    if (shkp) {
        ((shkp).mextra.eshk).billct = 0;
        ((shkp).mextra.eshk).credit = 0;
        ((shkp).mextra.eshk).debit = 0;
        ((shkp).mextra.eshk).loan = 0;
    }
}
/* Remembers that a shopkeeper has quoted a particular price for a
   particular type of object. */
export function record_price_quote(otyp, price, buyprice) {
    let oc = game.objects[otyp];
    if (buyprice) {
        if (price > oc.oc_buy_maxseen) {
            oc.oc_buy_maxseen = price;
        }
        if (price < oc.oc_buy_minseen) {
            oc.oc_buy_minseen = price;
        }
    } else {
        if (price > oc.oc_sell_maxseen) {
            oc.oc_sell_maxseen = price;
        }
        if (price < oc.oc_sell_minseen) {
            oc.oc_sell_minseen = price;
        }
    }
}
/* Appends price-quote information to the given buffer, updating the
   given end of string position. *eos mut be buf + strlen(buf). If the
   update would make bug longer than BUFSZ, instead does nothing. */
export function append_price_quote(buf, eos, otyp) {
    let buf2 = '';
    let eos2 = buf2;
    let sep = "";
    let len = eos - buf;
    let len2 = 0;
    if (game.objects[otyp].oc_sell_minseen > game.objects[otyp].oc_sell_maxseen && game.objects[otyp].oc_buy_minseen > game.objects[otyp].oc_buy_maxseen) {
        return;
    }
    eos2 = __nh_advance_str(eos2, sprintf(eos2, " {"));
    if (game.objects[otyp].oc_buy_minseen < game.objects[otyp].oc_buy_maxseen) {
        eos2 = __nh_advance_str(eos2, sprintf(eos2, "buy %lu-%lu", game.objects[otyp].oc_buy_minseen, game.objects[otyp].oc_buy_maxseen));
        sep = " ";
    } else if (game.objects[otyp].oc_buy_minseen == game.objects[otyp].oc_buy_maxseen) {
        eos2 = __nh_advance_str(eos2, sprintf(eos2, "buy %lu", game.objects[otyp].oc_buy_minseen));
        sep = " ";
    }
    if (game.objects[otyp].oc_sell_minseen < game.objects[otyp].oc_sell_maxseen) {
        eos2 = __nh_advance_str(eos2, sprintf(eos2, "%ssell %lu-%lu", sep, game.objects[otyp].oc_sell_minseen, game.objects[otyp].oc_sell_maxseen));
    } else if (game.objects[otyp].oc_sell_minseen == game.objects[otyp].oc_sell_maxseen) {
        eos2 = __nh_advance_str(eos2, sprintf(eos2, "%ssell %lu", sep, game.objects[otyp].oc_sell_minseen));
    }
    eos2 = __nh_advance_str(eos2, sprintf(eos2, "}"));
    len2 = (buf2.length - eos2.length);
    if (len2 < 256 - len - 1) {
        strcpy(eos, buf2);
        eos += len2;
    }
}
export function addupbill(shkp) {
    let ct = ((shkp).mextra.eshk).billct;
    let bp = ((shkp).mextra.eshk).bill_p;
    let total = 0;
    const __nhi_bp_arr = bp;
    for (let __nhi_bp = 0; (bp = __nhi_bp_arr[__nhi_bp]) && (ct--); __nhi_bp++) {
        total += bp.price * bp.bquan;
    }
    return total;
}
export function call_kops(shkp, nearshop) {
    let nokops = 0;
    if (!shkp) {
        return;
    }
    ;
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        pline("An alarm sounds!");
    }
    nokops = ((game.mvitals[PM_KEYSTONE_KOP].mvflags & (2 | 1)) && (game.mvitals[PM_KOP_SERGEANT].mvflags & (2 | 1)) && (game.mvitals[PM_KOP_LIEUTENANT].mvflags & (2 | 1)) && (game.mvitals[PM_KOP_KAPTAIN].mvflags & (2 | 1)));
    if (!angry_guards(!!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) && nokops) {
        if (game.flags.verbose && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            pline("But no one seems to respond to it.");
        }
        return;
    }
    if (nokops) {
        return;
    }
{
        let mm = { x: 0, y: 0 };
        let sx = 0;
        let sy = 0;
        choose_stairs({ get value() { return sx; }, set value(_v) { sx = _v; } }, { get value() { return sy; }, set value(_v) { sy = _v; } }, (1));
        if (nearshop) {
            /* Create swarm around you, if you merely "stepped out" */
            if (game.flags.verbose) {
                pline_The("Keystone Kops appear!");
            }
            mm.x = game.u.ux;
            mm.y = game.u.uy;
            makekops(mm);
            return;
        }
        if (game.flags.verbose) {
            pline_The("Keystone Kops are after you!");
        }
        if (isok(sx, sy)) {
            /* Create swarm near down staircase (hinders return to level) */
            mm.x = sx;
            mm.y = sy;
            makekops(mm);
        }
        /* Create swarm near shopkeeper (hinders return to shop) */
        mm.x = shkp.mx;
        mm.y = shkp.my;
        makekops(mm);
    }
}
/* x,y is strictly inside shop */
export function inside_shop(x, y) {
    let rno = 0;
    rno = game.level.locations[x][y].roomno;
    if ((rno < 3) || game.level.locations[x][y].edge || !(game.rooms[rno - 3].rtype >= SHOPBASE)) {
        rno = 0;
    }
    return rno;
}
export function u_left_shop(leavestring, newlev) {
    let shkp = null;
    let eshkp = null;
    /*
     * IF player
     * ((didn't leave outright) AND
     *  ((he is now strictly-inside the shop) OR
     *   (he wasn't strictly-inside last turn anyway)))
     * THEN (there's nothing to do, so just return)
     */
    if (!__nh_char_at0(leavestring) && (!game.level.locations[game.u.ux][game.u.uy].edge || game.level.locations[game.u.ux0][game.u.uy0].edge)) {
        return;
    }
    shkp = shop_keeper(__nh_char_at0(leavestring) ? __nh_char_at0(leavestring) : game.u.ushops0);
    /* caller has verified that there is a shopkeeper, but the static
       analyzer doesn't realize it */
    if (!shkp || !inhishop(shkp)) {
        return;
    }
    /* shk died, teleported, changed levels... */
    eshkp = ((shkp).mextra.eshk);
    if (!eshkp.billct && !eshkp.debit) {
        return;
    }
    if (!__nh_char_at0(leavestring) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
        /*
         * Player just stepped onto shop-boundary (known from above logic).
         * Try to intimidate him into paying his bill
         */
        let not_upset = !eshkp.surcharge;
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            ;
            verbalize(not_upset ? "%s!  Please pay before leaving." : "%s!  Don't you leave without paying!", game.plname);
        } else {
            pline("%s %s that you need to pay before leaving%s", Shknam(shkp), not_upset ? "points out" : "makes it clear", not_upset ? "." : "!");
        }
        return;
    }
    if (rob_shop(shkp)) {
        call_kops(shkp, (!newlev && game.level.locations[game.u.ux0][game.u.uy0].edge));
    }
}
let __credit_report_credit_snap = [[0, 0, 0], [0, 0, 0]];
export function credit_report(shkp, idx, silent) {
    let eshkp = ((shkp).mextra.eshk);
    if (!idx) {
        (__credit_report_credit_snap[1][0] = 0, __credit_report_credit_snap[0][0] = 0);
        (__credit_report_credit_snap[1][1] = 0, __credit_report_credit_snap[0][1] = 0);
        (__credit_report_credit_snap[1][2] = 0, __credit_report_credit_snap[0][2] = 0);
    } else {
        idx = 1;
    }
    __credit_report_credit_snap[idx][0] = eshkp.credit;
    __credit_report_credit_snap[idx][1] = eshkp.debit;
    __credit_report_credit_snap[idx][2] = eshkp.loan;
    if (idx && !silent) {
        let amt = 0;
        let msg = "debt has increased";
        if (__credit_report_credit_snap[1][0] < __credit_report_credit_snap[0][0]) {
            amt = __credit_report_credit_snap[0][0] - __credit_report_credit_snap[1][0];
            msg = "credit has been reduced";
        } else if (__credit_report_credit_snap[1][1] > __credit_report_credit_snap[0][1]) {
            amt = __credit_report_credit_snap[1][1] - __credit_report_credit_snap[0][1];
        } else if (__credit_report_credit_snap[1][2] > __credit_report_credit_snap[0][2]) {
            amt = __credit_report_credit_snap[1][2] - __credit_report_credit_snap[0][2];
        }
        if (amt) {
            Your("%s by %ld %s.", msg, amt, currency(amt));
        }
    }
}
/* robbery from outside the shop via telekinesis or grappling hook */
export function remote_burglary(x, y) {
    let shkp = null;
    let eshkp = null;
    /* shkp is guaranteed to exist after successful costly_spot(), but
       the static analyzer isn't smart enough to realize that, so follow
       the shkp assignment with a redundant test that will always fail */
    shkp = shop_keeper(in_rooms(x, y, SHOPBASE));
    if (!shkp || !inhishop(shkp)) {
        return;
    }
    eshkp = ((shkp).mextra.eshk);
    if (!eshkp.billct && !eshkp.debit) {
        return;
    }
    if (rob_shop(shkp)) {
        /*[might want to set 2nd arg based on distance from shop doorway]*/
        call_kops(shkp, (0));
    }
}
/* shop merchandise has been taken; pay for it with any credit available;
   return false if the debt is fully covered by credit, true otherwise */
export function rob_shop(shkp) {
    let eshkp = null;
    let total = 0;
    eshkp = ((shkp).mextra.eshk);
    /* you dropped something of your own - probably want to sell it */
    /* wake up sleeping or paralyzed shk */
    rouse_shk(shkp, (1));
    total = (addupbill(shkp) + eshkp.debit);
    if (eshkp.credit >= total) {
        Your("credit of %ld %s is used to cover your shopping bill.", eshkp.credit, currency(eshkp.credit));
        /* credit gets cleared by setpaid() */
        total = 0;
    } else {
        You("escaped the shop without paying!");
        total -= eshkp.credit;
    }
    setpaid(shkp);
    if (!total) {
        return (0);
    }
    /* by this point, we know an actual robbery has taken place */
    eshkp.robbed += total;
    You("stole %ld %s worth of merchandise.", total, currency(total));
    livelog_printf(2, "stole %ld %s worth of merchandise from %s %s", total, currency(total), s_suffix(shkname(shkp)), shtypes[eshkp.shoptype - SHOPBASE].name);
    if (!(game.urole.mnum == (PM_ROGUE))) {
        adjalign(-sgn(game.u.ualign.type));
    }
    hot_pursuit(shkp);
    return (1);
}
/* give a message when entering an untended shop (caller has verified that) */
/*const*/
export function deserted_shop(enterstring) {
    let mtmp = null;
    let r = game.rooms[__nh_char_at0(enterstring) - 3];
    let x = 0;
    let y = 0;
    let m = 0;
    let n = 0;
    for (x = r.lx; x <= r.hx; ++x) {
        for (y = r.ly; y <= r.hy; ++y) {
            if (((x) == game.u.ux && (y) == game.u.uy)) {
                continue;
            }
            if ((mtmp = (game.level.monsters[x][y])) != null) {
                ++n;
                if (sensemon(mtmp) || ((((mtmp).m_ap_type & 7) == M_AP_NOTHING || ((mtmp).m_ap_type & 7) == M_AP_MONSTER) && canseemon(mtmp))) {
                    ++m;
                }
            }
        }
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !((game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic) || (game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic))) {
        ++n;
    }
    /* force feedback to be less specific */
    pline("This shop %s %s.", (m < n) ? "seems to be" : "is", !n ? "deserted" : "untended");
}
/* called from check_special_room(hack.c) */
let __u_entered_shop_empty_shops = '';
export function u_entered_shop(enterstring) {
    let shkp = null;
    let eshkp = null;
    let rt = 0;
    if (!__nh_char_at0(enterstring)) {
        return;
    }
    shkp = shop_keeper(__nh_char_at0(enterstring));
    if (!shkp) {
        if (!strchr(__u_entered_shop_empty_shops, __nh_char_at0(enterstring)) && (in_rooms(game.u.ux, game.u.uy, SHOPBASE) != in_rooms(game.u.ux0, game.u.uy0, SHOPBASE))) {
            deserted_shop(enterstring);
        }
        __u_entered_shop_empty_shops = strcpy(__u_entered_shop_empty_shops, game.u.ushops);
        game.u.ushops[0] = 0;
        return;
    }
    eshkp = ((shkp).mextra.eshk);
    if (!inhishop(shkp)) {
        /* dump core when referenced */
        eshkp.bill_p = -1000;
        if (!strchr(__u_entered_shop_empty_shops, __nh_char_at0(enterstring))) {
            deserted_shop(enterstring);
        }
        __u_entered_shop_empty_shops = strcpy(__u_entered_shop_empty_shops, game.u.ushops);
        game.u.ushops[0] = 0;
        return;
    }
    record_achievement(ACH_SHOP);
    eshkp.bill_p = (eshkp.bill[0]);
    if ((!eshkp.visitct || eshkp.customer) && strncmpi(eshkp.customer, game.plname, 32)) {
        eshkp.visitct = 0;
        eshkp.following = 0;
        eshkp.customer = strncpy(eshkp.customer, game.plname, 32);
        pacify_shk(shkp, (1));
    }
    if ((((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL) || eshkp.following) {
        return;
    }
    if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked)) {
        pline("%s senses your presence.", Shknam(shkp));
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            ;
            verbalize("Invisible customers are not welcome!");
        } else {
            pline("%s stands firm as if %s knows you are there.", Shknam(shkp), (genders[pronoun_gender(shkp, (1 | 2))].he));
        }
        return;
    }
    rt = game.rooms[__nh_char_at0(enterstring) - 3].rtype;
    if ((!((shkp).mpeaceful))) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            ;
            verbalize("So, %s, you dare return to %s %s?!", game.plname, s_suffix(shkname(shkp)), shtypes[rt - SHOPBASE].name);
        } else {
            pline("%s seems %s over your return to %s %s!", Shknam(shkp), angrytexts[rn2((Math.trunc(3 /* sizeof(const char *const [3]) */ / 1 /* sizeof(const char *const) */)))], (genders[pronoun_gender(shkp, (1 | 2))].his), shtypes[rt - SHOPBASE].name);
        }
    } else if (eshkp.surcharge) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            ;
            verbalize("Back again, %s?  I've got my %s on you.", game.plname, mbodypart(shkp, EYE));
        } else {
            pline_The("atmosphere at %s %s seems unwelcoming.", s_suffix(shkname(shkp)), shtypes[rt - SHOPBASE].name);
        }
    } else if (eshkp.robbed) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            ;
            pline("%s mutters imprecations against shoplifters.", Shknam(shkp));
        } else {
            pline("%s is combing through %s inventory list.", Shknam(shkp), (genders[pronoun_gender(shkp, (1 | 2))].his));
        }
    } else {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            set_voice(shkp, 0, 80, 0);
            verbalize("%s, %s!  Welcome%s to %s %s!", Hello(shkp), game.plname, eshkp.visitct++ ? " again" : "", s_suffix(shkname(shkp)), shtypes[rt - SHOPBASE].name);
        } else {
            You("enter %s %s%s!", s_suffix(shkname(shkp)), shtypes[rt - SHOPBASE].name, eshkp.visitct++ ? " again" : "");
        }
    }
    if (!inside_shop(game.u.ux, game.u.uy)) {
        /* can't do anything about blocking if teleported in */
        let should_block = 0;
        let not_upset = !eshkp.surcharge;
        let cnt = 0;
        let tool = null;
        let pick = carrying(PICK_AXE);
        let mattock = carrying(DWARVISH_MATTOCK);
        if (pick || mattock) {
            cnt = 1;
            if (pick && mattock) {
                tool = "digging tool";
                /* `more than 1' is all that matters */
                cnt = 2;
            } else if (pick) {
                tool = "pick-axe";
                /* hack: `pick' already points somewhere into inventory */
                while ((pick = pick.nobj) != null) {
                    if (pick.otyp == PICK_AXE) {
                        ++cnt;
                    }
                }
            } else {
                tool = "mattock";
                while ((mattock = mattock.nobj) != null) {
                    if (mattock.otyp == DWARVISH_MATTOCK) {
                        ++cnt;
                    }
                }
                /* [ALI] Shopkeeper identifies mattock(s) */
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    discover_object((DWARVISH_MATTOCK), (1), (1), (1));
                }
            }
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                ;
                verbalize(not_upset ? "Will you please leave your %s%s outside?" : "Leave the %s%s outside.", tool, (((cnt) == 1) ? "" : "s"));
            } else {
                pline("%s %s to let you in with your %s%s.", Shknam(shkp), not_upset ? "is hesitant" : "refuses", tool, (((cnt) == 1) ? "" : "s"));
            }
            should_block = (1);
        } else if (game.u.usteed) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                ;
                verbalize(not_upset ? "Will you please leave %s outside?" : "Leave %s outside.", y_monnam(game.u.usteed));
            } else {
                pline("%s %s to let you in while you're riding %s.", Shknam(shkp), not_upset ? "doesn't want" : "refuses", y_monnam(game.u.usteed));
            }
            should_block = (1);
        } else {
            should_block = ((game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic) && (sobj_at(PICK_AXE, game.u.ux, game.u.uy) || sobj_at(DWARVISH_MATTOCK, game.u.ux, game.u.uy)));
        }
        if (should_block) {
            dochug(shkp);
        }
    }
    return;
}
/* called when removing a pick-axe or mattock from a container */
let __pick_pick_pickmovetime = 0;
export function pick_pick(obj) {
    let shkp = null;
    if (obj.unpaid || !((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_PICK_AXE)) {
        return;
    }
    shkp = shop_keeper(game.u.ushops);
    if (shkp && inhishop(shkp)) {
        if (game.moves != __pick_pick_pickmovetime) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                ;
                /* if you bring a sack of N picks into a shop to sell,
           don't repeat this N times when they're taken out */
                verbalize("You sneaky %s!  Get out of here with that pick!", cad((0)));
            } else {
                pline("%s %s your pick!", Shknam(shkp), (((shkp.data).mflags1 & 4096) == 0) ? "glares at" : "is dismayed because of");
            }
        }
        __pick_pick_pickmovetime = game.moves;
    }
}
/*
   Decide whether two unpaid items are mergeable; caller is responsible for
   making sure they're unpaid and the same type of object; we check the price
   quoted by the shopkeeper and also that they both belong to the same shk.
 */
export function same_price(obj1, obj2) {
    let shkp1 = null;
    let shkp2 = null;
    let bp1 = null;
    let bp2 = null;
    let are_mergable = (0);
    /* look up the first object by finding shk whose bill it's on */
    for (shkp1 = next_shkp(game.level.monlist, (1)); shkp1; shkp1 = next_shkp(shkp1.nmon, (1))) {
        if ((bp1 = onbill(obj1, shkp1, (1))) != null) {
            break;
        }
    }
    if (shkp1 && (bp2 = onbill(obj2, shkp1, (1))) != null) {
        /* second object is probably owned by same shk; if not, look harder */
        shkp2 = shkp1;
    } else {
        for (shkp2 = next_shkp(game.level.monlist, (1)); shkp2; shkp2 = next_shkp(shkp2.nmon, (1))) {
            if ((bp2 = onbill(obj2, shkp2, (1))) != null) {
                break;
            }
        }
    }
    if (!bp1 || !bp2) {
        impossible("same_price: object wasn't on any bill!");
    } else {
        are_mergable = (shkp1 == shkp2 && bp1.price == bp2.price);
    }
    return are_mergable;
}
/*
 * Figure out how much is owed to a given shopkeeper.
 * At present, we ignore any amount robbed from the shop, to avoid
 * turning the `$' command into a way to discover that the current
 * level is bones data which has a shk on the warpath.
 */
export function shop_debt(eshkp) {
    /* otmp has been split off from obj */
    let bp = null;
    let ct = 0;
    let debt = eshkp.debit;
    for (ct = eshkp.billct; ct > 0; ct--) {
        bp = eshkp.bill_p[ct];
        debt += bp.price * bp.bquan;
    }
    return debt;
}
/* called in response to the `$' command */
export function shopper_financial_report() {
    let shkp = null;
    let this_shkp = shop_keeper(inside_shop(game.u.ux, game.u.uy));
    let eshkp = null;
    let amt = 0;
    let pass = 0;
    eshkp = this_shkp ? ((this_shkp).mextra.eshk) : null;
    if (eshkp && !(eshkp.credit || shop_debt(eshkp))) {
        You("have no credit or debt in here.");
        this_shkp = null;
    }
    for (pass = this_shkp ? 0 : 1; pass <= 1; pass++) {
        for (shkp = next_shkp(game.level.monlist, (0)); shkp; shkp = next_shkp(shkp.nmon, (0))) {
            /* pass 0: report for the shop we're currently in, if any;
       pass 1: report for all other shops on this level. */
            if ((shkp != this_shkp) ^ pass) {
                continue;
            }
            eshkp = ((shkp).mextra.eshk);
            if ((amt = eshkp.credit) != 0) {
                You("have %ld %s credit at %s %s.", amt, currency(amt), s_suffix(shkname(shkp)), shtypes[eshkp.shoptype - SHOPBASE].name);
            } else if (shkp == this_shkp) {
                You("have no credit in here.");
            }
            if ((amt = shop_debt(eshkp)) != 0) {
                You("owe %s %ld %s.", shkname(shkp), amt, currency(amt));
            } else if (shkp == this_shkp) {
                You("don't owe any gold here.");
            }
        }
    }
}
/* 1: shopkeeper is currently in her shop or its boundary; 0: not */
export function inhishop(shkp) {
    let shkrooms = null;
    let eshkp = ((shkp).mextra.eshk);
    if (!on_level(eshkp.shoplevel, game.u.uz)) {
        return (0);
    }
    shkrooms = in_rooms(shkp.mx, shkp.my, SHOPBASE);
    return (strchr(shkrooms, eshkp.shoproom) != null);
}
/* return the shopkeeper for rooms[rmno-2]; returns Null if there isn't one */
export function shop_keeper(rmno) {
    let shkp = null;
    if (typeof rmno === 'string') {
        rmno = rmno.length ? rmno.charCodeAt(0) : 0;
    }
    shkp = (rmno >= 3) ? game.rooms[rmno - 3].resident : null;
    if (shkp) {
        if (((shkp).mextra && ((shkp).mextra.eshk))) {
            if ((!((shkp).mpeaceful))) {
                if (!((shkp).mextra.eshk).surcharge) {
                    rile_shk(shkp);
                }
            }
        } else {
            /* would have segfaulted on ESHK dereference previously */
            impossible("%s? (rmno=%d, rtype=%d, mnum=%d, \"%s\")", shkp.isshk ? "shopkeeper career change" : "shop resident not shopkeeper", rmno, game.rooms[rmno - 3].rtype, shkp.mnum, ((shkp).mextra && ((shkp).mextra.mgivenname)) ? ((shkp).mextra.mgivenname) : "anonymous");
            /* not sure if this is appropriate, because it does nothing to
               correct the underlying svr.rooms[].resident issue but... */
            return null;
        }
    }
    return shkp;
}
/* find the shopkeeper who owns 'obj'; needed to handle shared shop walls */
/* caller passes obj's location since obj->ox,oy
                           * might be stale; don't update coordinates here
                           * because if we're called during sanity checking
                           * they shouldn't be modified */
export function find_objowner(obj, x, y) {
    let shkp = null;
    let deflt_shkp = null;
    if (obj.where == 7) {
        /* used up item; bill obj coordinates are useless and so are x,y */
        /* look for a shopkeeper who owns this object */
        for (shkp = next_shkp(game.level.monlist, (1)); shkp; shkp = next_shkp(shkp.nmon, (1))) {
            if (onshopbill(obj, shkp, (1))) {
                return shkp;
            }
        }
    } else {
        let __nh_roomindx_idx = 0;
        let where = in_rooms(x, y, SHOPBASE);
        for (__nh_roomindx_idx = 0; where[__nh_roomindx_idx]; ++__nh_roomindx_idx) {
            if ((shkp = shop_keeper(where[__nh_roomindx_idx])) != null) {
                /* conceptually object could be inside up to 4 rooms simultaneously;
           in practice it will usually be one room but can sometimes be two;
           check shk and bill for each room rather than just the first;
           fallback to the first shk if obj isn't on the relevant bill(s) */
                if (onshopbill(obj, shkp, (1))) {
                    return shkp;
                }
                if (!deflt_shkp) {
                    deflt_shkp = shkp;
                }
            }
        }
    }
    return deflt_shkp;
}
export function tended_shop(sroom) {
    let mtmp = sroom.resident;
    return !mtmp ? (0) : inhishop(mtmp);
}
export function noisy_shop(sroom) {
    let mtmp = sroom.resident;
    if (mtmp && inhishop(mtmp)) {
        wake_nearto(mtmp.mx, mtmp.my, 11 * 11);
    }
}
export function onbill(obj, shkp, silent) {
    if (shkp) {
        let bp = null;
        let ct = 0;
        for (ct = ((shkp).mextra.eshk).billct; ct > 0; --ct) {
            bp = ((shkp).mextra.eshk).bill_p[ct];
            if (bp.bo_id == obj.o_id) {
                if (!obj.unpaid) {
                    impossible("onbill: paid obj on bill?");
                }
                return bp;
            }
        }
    }
    if (obj.unpaid && !silent) {
        impossible("onbill: unpaid obj %s?", !shkp ? "without shopkeeper" : "not on shk's bill");
    }
    return null;
}
/* used outside of shk.c when caller wants to know whether item is on bill
   but doesn't need to know any details about the bill itself */
export function onshopbill(obj, shkp, silent) {
    return onbill(obj, shkp, silent) ? (1) : (0);
}
/* check whether an object or any of its contents belongs to a shop */
export function is_unpaid(obj) {
    return (obj.unpaid || (((obj).cobj != null) && count_unpaid(obj.cobj)));
}
/* Delete the contents of the given object. */
export function delete_contents(obj) {
    let curr = null;
    while ((curr = obj.cobj) != null) {
        obj_extract_self(curr);
        obfree(curr, null);
    }
}
/* called with two args on merge */
export function obfree(obj, merge) {
    let bp = null;
    let bpm = null;
    let shkp = null;
    if (obj.otyp == LEASH && obj.corpsenm) {
        o_unleash(obj);
    }
    if (obj.oclass == FOOD_CLASS) {
        food_disappears(obj);
    }
    if (obj.oclass == SPBOOK_CLASS) {
        book_disappears(obj);
    }
    if (((obj).cobj != null)) {
        delete_contents(obj);
    }
    if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS)) {
        maybe_reset_pick(obj);
    }
    if (obj.otyp == BOULDER) {
        obj.corpsenm = 0;
    }
    shkp = null;
    if (obj.unpaid) {
        for (shkp = next_shkp(game.level.monlist, (1)); shkp; shkp = next_shkp(shkp.nmon, (1))) {
            if (onbill(obj, shkp, (1))) {
                break;
            }
        }
    }
    /* sanity check, in case obj is on bill but not marked 'unpaid' */
    if (!shkp) {
        shkp = shop_keeper(game.u.ushops);
    }
    if ((bp = onbill(obj, shkp, (0))) != null) {
        if (!merge) {
            /*
     * Note:  `shkp = shop_keeper(*u.ushops)' used to be
     *    unconditional.  But obfree() is used all over
     *    the place, so making its behavior be dependent
     *    upon player location doesn't make much sense.
     */
            /* (expected to be set already) */
            /* a dummy object must be inserted into  */
            /* the gb.billobjs chain here.  crucial for */
            bp.useup = (1);
            obj.unpaid = 0;
            /* for used up glob, put back original weight in case it gets
               formatted ('I x' or itemized billing) with 'wizweight' On */
            if (obj.globby && !obj.owt && ((obj).oextra && ((obj).oextra.omid))) {
                obj.owt = ((obj).oextra.omid);
            }
            /* eating floorfood in shop.  see eat.c  */
            add_to_billobjs(obj);
            return;
        }
        bpm = onbill(merge, shkp, (0));
        if (!bpm) {
            /* this used to be a rename */
            impossible("obfree: not on bill, %s = (%d,%d,%ld,%d) (%d,%d,%ld,%d)?", "otyp,where,quan,unpaid", obj.otyp, obj.where, obj.quan, obj.unpaid ? 1 : 0, merge.otyp, merge.where, merge.quan, merge.unpaid ? 1 : 0);
            return;
        } else {
            let eshkp = ((shkp).mextra.eshk);
            bpm.bquan += bp.bquan;
            eshkp.billct--;
            Object.assign(bp, eshkp.bill_p[eshkp.billct]);
        }
    } else {
        /* not on bill; if the item is being merged away rather than
           just deleted and has a higher price adjustment than the stack
           being merged into, give the latter the former's obj->o_id so
           that the merged stack takes on higher price; matters if hero
           eventually buys them from a shop, but doesn't matter if hero
           owns them and intends to sell (unless he subsequently buys
           them back) or if no shopping activity ever involves them */
        if (merge && (oid_price_adjustment(obj, obj.o_id) > oid_price_adjustment(merge, merge.o_id))) {
            merge.o_id = obj.o_id;
        }
    }
    if (obj.owornmask) {
        impossible("obfree: deleting worn obj (%d: %ld)", obj.otyp, obj.owornmask);
        /* unfortunately at this point we don't know whether worn mask
           applied to hero or a monster or perhaps something bogus, so
           can't call remove_worn_item() to get <X>_off() side-effects */
        setnotworn(obj);
    }
    dealloc_obj(obj);
}
export function check_credit(tmp, shkp) {
    let credit = ((shkp).mextra.eshk).credit;
    if (credit == 0) {
        ;
    } else if (credit >= tmp) {
        /* nothing to do; just 'return tmp;' */
        pline_The("price is deducted from your credit.");
        ((shkp).mextra.eshk).credit -= tmp;
        tmp = 0;
    } else {
        pline_The("price is partially covered by your credit.");
        ((shkp).mextra.eshk).credit = 0;
        tmp -= credit;
    }
    /* (no adjustment for angry shk here) */
    return tmp;
}
export function pay(tmp, shkp) {
    let robbed = ((shkp).mextra.eshk).robbed;
    let balance = ((tmp <= 0) ? tmp : check_credit(tmp, shkp));
    if (balance > 0) {
        money2mon(shkp, balance);
    } else if (balance < 0) {
        money2u(shkp, -balance);
    }
    game.disp.botl = (1);
    if (robbed) {
        robbed -= tmp;
        if (robbed < 0) {
            robbed = 0;
        }
        ((shkp).mextra.eshk).robbed = robbed;
    }
}
/* return shkp to home position */
export function home_shk(shkp, killkops) {
    let x = ((shkp).mextra.eshk).shk.x;
    let y = ((shkp).mextra.eshk).shk.y;
    mnearto(shkp, x, y, (1), 4);
    game.level.flags.has_shop = 1;
    if (killkops) {
        kops_gone((1));
        pacify_guards();
    }
    after_shk_move(shkp);
}
export function angry_shk_exists() {
    let shkp = null;
    for (shkp = next_shkp(game.level.monlist, (0)); shkp; shkp = next_shkp(shkp.nmon, (0))) {
        if ((!((shkp).mpeaceful))) {
            return (1);
        }
    }
    return (0);
}
/* remove previously applied surcharge from all billed items */
export function pacify_shk(shkp, clear_surcharge) {
    ((shkp).mpeaceful) = (1);
    if (clear_surcharge && ((shkp).mextra.eshk).surcharge) {
        let bp = ((shkp).mextra.eshk).bill_p;
        let ct = ((shkp).mextra.eshk).billct;
        ((shkp).mextra.eshk).surcharge = (0);
        const __nhi_bp_arr = bp;
        for (let __nhi_bp = 0; (bp = __nhi_bp_arr[__nhi_bp]) && (ct-- > 0); __nhi_bp++) {
            let reduction = Math.trunc((bp.price + 3) / 4);
            bp.price -= reduction;
        }
    }
}
/* add aggravation surcharge to all billed items */
export function rile_shk(shkp) {
    ((shkp).mpeaceful) = (0);
    if (!((shkp).mextra.eshk).surcharge) {
        let surcharge = 0;
        let bp = ((shkp).mextra.eshk).bill_p;
        let ct = ((shkp).mextra.eshk).billct;
        ((shkp).mextra.eshk).surcharge = (1);
        const __nhi_bp_arr = bp;
        for (let __nhi_bp = 0; (bp = __nhi_bp_arr[__nhi_bp]) && (ct-- > 0); __nhi_bp++) {
            surcharge = Math.trunc((bp.price + 2) / 3);
            bp.price += surcharge;
        }
    }
}
/* wakeup and/or unparalyze shopkeeper */
export function rouse_shk(shkp, verbosely) {
    if (((shkp).msleeping || !(shkp).mcanmove)) {
        /* greed induced recovery... */
        if (verbosely && (canseemon(shkp) || sensemon(shkp))) {
            pline("%s %s.", Shknam(shkp), shkp.msleeping ? "wakes up" : "can move again");
        }
        shkp.msleeping = 0;
        shkp.mfrozen = 0;
        shkp.mcanmove = 1;
    }
}
export function make_happy_shk(shkp, silentkops) {
    let wasmad = (!((shkp).mpeaceful));
    let eshkp = ((shkp).mextra.eshk);
    pacify_shk(shkp, (0));
    eshkp.following = 0;
    eshkp.robbed = 0;
    if (!(game.urole.mnum == (PM_ROGUE))) {
        adjalign(sgn(game.u.ualign.type));
    }
    if (!inhishop(shkp)) {
        let shk_nam = '';
        let vanished = canseemon(shkp);
        shk_nam = strcpy(shk_nam, shkname(shkp));
        if (on_level(eshkp.shoplevel, game.u.uz)) {
            /* move shk back to his home loc */
            home_shk(shkp, (0));
            if ((canseemon(shkp) || sensemon(shkp))) {
                pline("%s returns to %s shop.", Shknam(shkp), (genders[pronoun_gender(shkp, (1 | 2))].his));
                /* don't give 'Shk disappears' message */
                vanished = (0);
            }
        } else {
            /* if sensed, does disappear regardless whether seen */
            if (sensemon(shkp)) {
                vanished = (1);
            }
            /* can't act as porter for the Amulet, even if shk
               happens to be going farther down rather than up */
            mdrop_special_objs(shkp);
            migrate_to_level(shkp, ledger_no(eshkp.shoplevel), 1, eshkp.shd);
            /* dismiss kops on that level when shk arrives */
            eshkp.dismiss_kops = (1);
        }
        if (vanished) {
            pline("Satisfied, %s suddenly disappears!", shk_nam);
        }
    } else if (wasmad) {
        pline("%s calms down.", Shknam(shkp));
    }
    make_happy_shoppers(silentkops);
}
/* called by make_happy_shk() and also by losedogs() for migrating shk */
export function make_happy_shoppers(silentkops) {
    if (!angry_shk_exists()) {
        kops_gone(silentkops);
        pacify_guards();
    }
}
export function hot_pursuit(shkp) {
    if (!shkp.isshk) {
        return;
    }
    rile_shk(shkp);
    /* not the best introduction to the shk... */
    ((shkp).mextra.eshk).customer = strncpy(((shkp).mextra.eshk).customer, game.plname, 32);
    ((shkp).mextra.eshk).following = 1;
    /* shopkeeper networking:  clear obj->no_charge for all obj on the
       floor of this level (including inside containers on floor), even
       those that are in other shopkeepers' shops */
    clear_no_charge((null), game.level.objlist);
    clear_no_charge_pets(shkp);
}
/* Used when the shkp is teleported or falls (ox == 0) out of his shop, or
   when the player is not on a costly_spot and he damages something inside
   the shop.  These conditions must be checked by the calling function. */
/*ARGSUSED*/
/* <ox,oy> predate 'noit_Monnam()', let alone Shknam() */
export function make_angry_shk(shkp, ox, oy) {
    let eshkp = ((shkp).mextra.eshk);
    if (eshkp.billct || eshkp.debit || eshkp.loan || eshkp.credit) {
        /* all pending shop transactions are now "past due" */
        eshkp.robbed += (addupbill(shkp) + eshkp.debit + eshkp.loan);
        eshkp.robbed -= eshkp.credit;
        if (eshkp.robbed < 0) {
            eshkp.robbed = 0;
        }
        /* billct, debit, loan, and credit will be cleared by setpaid */
        setpaid(shkp);
    }
    pline("%s %s!", Shknam(shkp), !(!((shkp).mpeaceful)) ? "gets angry" : "is furious");
    hot_pursuit(shkp);
}
const no_money = "Moreover, you%s have no gold.";
const not_enough_money = "Besides, you don't have enough to interest %s.";
/* if one item is used-up and the other isn't, the used-up one comes first;
   otherwise, if their costs differ, the more expensive one comes first;
   if costs are the same, use internal index as tie-breaker for stable sort */
export function sortbill_cmp(vptr1, vptr2) {
    let sbi1 = vptr1;
    let sbi2 = vptr2;
    let cost1 = sbi1.cost;
    let cost2 = sbi2.cost;
    let bidx1 = sbi1.bidx;
    let bidx2 = sbi2.bidx;
    let used1 = sbi1.usedup <= PartlyUsedUp;
    let used2 = sbi2.usedup <= PartlyUsedUp;
    if (used1 != used2) {
        return (used2 - used1);
    }
    /* bigger comes before smaller here */
    if (cost1 != cost2) {
        return (cost2 - cost1);
    }
    /* bigger comes before smaller here too */
    /* index into eshkp->bill_p[] isn't unique (an item that is partly
       used and partly intact will have two ibill[] entries indexing same
       bill_p[] element) but duplicates won't reach here (used1 vs used2) */
    return (bidx1 - bidx2);
}
/* delivers the cheapest item on the list */
export function cheapest_item(ibillct, ibill) {
    let i = 0;
    let gmin = ibill[0].cost;
    /*
     * 5.0: old version didn't determine cheapest item correctly if it
     * was either the partly used or partly intact portion of a partially
     * used stack.  Rather than modify it to use bp_to_obj() in order to
     * obtain quanities for every entry on eshkp->bill_p[], switch to
     * ibill[] which has already split such items into separate entries.
     */
    for (i = 1; i < ibillct; ++i) {
        if (ibill[i].cost < gmin) {
            gmin = ibill[i].cost;
        }
    }
    return gmin;
}
/* for itemized purchasing, create an alternate shop bill that hides
   container contents */
/* returns number of entries */
/* output, augmented bill similar to a 'sortloot array' */
let __make_itemized_bill_zerosbi = { obj: null, cost: 0, quan: 0, bidx: 0, usedup: 0, queuedpay: 0 };
export function make_itemized_bill(shkp, ibill_p) {
    let ibill = null;
    let bp = null;
    let otmp = null;
    let eshkp = ((shkp).mextra.eshk);
    let i = 0;
    let n = 0;
    let bidx = 0;
    let ebillct = eshkp.billct;
    let used = 0;
    let quan = 0;
    let cost = 0;
    /* this overallocates unless there happens to be a used-up portion
       and an intact potion for every object on the bill; doing it this
       way avoids the need to look up every object on the bill an extra
       time; (the +1 for a terminator isn't actually needed) */
    n = 2 * ebillct + 1;
    ibill = ibill_p.value = alloc(n * 1 /* sizeof(Bill) */);
    for (i = 0; i < n; ++i) {
        Object.assign(ibill[i], __make_itemized_bill_zerosbi);
    }
    /* number of entries in ibill[]; won't necessary match ebillct */
    n = 0;
    for (i = 0; i < ebillct; ++i) {
        /* give feedback just for container+contents rather
                             than for individiual contents even when those
                             contents are known */
        /* message given by insufficent_funds() */
        /* check for partly intact portion of a not-yet-paid partly used item */
        bp = eshkp.bill_p[i];
        /* find the object on the bill */
        /* ibill[bidx].obj is the container */
        otmp = bp_to_obj(bp);
        if (!otmp) {
            impossible("Can't find shop bill entry for #%d", bp.bo_id);
            continue;
        }
        /* index into bill_p[], except for hero-owner container */
        bidx = i;
        if (otmp.quan == 0 || otmp.where == 7) {
            /* item is completely used up; restore quantity from when it
               was first unpaid; otmp is on billobjs list where it can
               only be seen via Ix and itemized billing while paying shk */
            otmp.quan = bp.bquan;
            bp.useup = (1);
        } else if (otmp.quan < bp.bquan) {
            /* item is partly used up; we will create two entries in the
               augmented bill: one for the used up part here, another for
               the intact part (which might be inside a container if put in
               after using part of a stack; used up part isn't) below */
            ibill[n].obj = otmp;
            ibill[n].quan = bp.bquan - otmp.quan;
            ibill[n].cost = bp.price * ibill[n].quan;
            /* duplicate index into eshkp->bill_p[] */
            ibill[n].bidx = bidx;
            ibill[n].usedup = PartlyUsedUp;
            ++n;
        }
        if (otmp.where == 7) {
            /* intact portion will be a separate entry, next */
            /* either completely used up (simple), or split needed */
            quan = bp.bquan;
            cost = bp.price * quan;
            used = FullyUsedUp;
        } else if (otmp.where == 2 || ((otmp).cobj != null)) {
            let j = 0;
            let item = otmp;
            /* assume container contents are known */
            let cknown = (1);
            while (otmp.where == 2) {
                /* when it's in a container, put the container rather than the
               specific object into ibill[]; find outermost container */
                otmp = otmp.v.v_ocontainer;
                if (!otmp.cknown) {
                    cknown = (0);
                }
            }
            /* this container might already be in ibill[] if it is unpaid
               itself or if it holds more than one unpaid item and another
               besides this one has already been processed; only include
               first instance */
            for (j = 0; j < n; ++j) {
                if (otmp == ibill[j].obj) {
                    break;
                }
            }
            if (j < n) {
                /* when already on bill as FullyIntact, update; the cost
                   saved in ibill[j] is based on the container even if the
                   entry was initially created for an item of its contents */
                if (ibill[j].usedup == FullyIntact) {
                    ibill[j].usedup = cknown ? KnownContainer : UndisclosedContainer;
                }
                continue;
            }
            /* include 1 container containing unpaid item(s) */
            quan = 1;
            cost = unpaid_cost(otmp, COST_CONTENTS);
            if (!otmp.unpaid) {
                bidx = -1;
            }
            /* an unpaid container without any unpaid contents is classified
               as 'FullyIntact'; a container with unpaid contents will be
               '*Container' regardless of whether it is unpaid itself */
            used = (otmp == item) ? FullyIntact : cknown ? KnownContainer : UndisclosedContainer;
        } else {
            /* ordinary unpaid; when partly used, these are values for the
               intact portion; might be an empty shop-owned container */
            quan = otmp.quan;
            cost = bp.price * quan;
            used = (quan < bp.bquan) ? PartlyIntact : FullyIntact;
        }
        ibill[n].obj = otmp;
        ibill[n].quan = quan;
        ibill[n].cost = cost;
        ibill[n].bidx = bidx;
        ibill[n].usedup = used;
        ++n;
    }
    /* end of list; not strictly needed */
    ibill[n].bidx = -1;
    /* ibill[0..n-1] contains data, ibill[n] has Null obj and -1 bidx and
       is excluded from the sort */
    if (n > 1) {
        qsort(ibill, n, 1 /* sizeof(Bill) */, sortbill_cmp);
    }
    return n;
}
/* show items on your bill in a menu, and ask which to pay.
   returns the number of entries selected. */
/* number of entries in ibill[] */
/* all used up items, if any, precede all intact items */
export function menu_pick_pay_items(ibillct, ibill) {
    let otmp = null;
    let win = 0;
    let any = 0;
    let pick_list = null;
    let p = null;
    let buf = '';
    let amt = 0;
    let largest_amt = 0;
    let save_quan = 0;
    let i = 0;
    let j = 0;
    let n = 0;
    let amt_width = 0;
    any = cg.zeroany;
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    /* we go through ibill[] twice, first time to control price formatting
       during the second */
    largest_amt = 0;
    for (i = 0; i < ibillct; ++i) {
        if (ibill[i].cost > largest_amt) {
            largest_amt = ibill[i].cost;
        }
    }
    buf = sprintf(buf, "%ld", largest_amt);
    amt_width = strlen(buf);
    /* show the "used up items" header if there are any used up items on
       the bill, no matter whether there are also any intact items;
       note: ibill[] has been sorted to hold used-up items first */
    if (ibill[0].usedup <= PartlyUsedUp) {
        buf = sprintf(buf, "Used up item%s:", (ibillct > 1 && ibill[1].usedup <= PartlyUsedUp) ? "s" : "");
        add_menu_heading(win, buf);
    }
    for (i = 0; i < ibillct; ++i) {
        if (i > 0 && ibill[i - 1].usedup <= PartlyUsedUp && ibill[i].usedup >= PartlyIntact) {
            buf = sprintf(buf, "Unpaid item%s:", (i < ibillct - 1) ? "s" : "");
            /* the "unpaid items" header is only shown if the "used up items"
           one was shown before the first menu entry */
            add_menu_heading(win, buf);
        }
        otmp = ibill[i].obj;
        save_quan = otmp.quan;
        /* in case it's partly used */
        otmp.quan = ibill[i].quan;
        p = paydoname(otmp);
        otmp.quan = save_quan;
        amt = ibill[i].cost;
        buf = nh_snprintf("menu_pick_pay_items", 1717, buf, 256 /* sizeof(char [256]) */, "%*ld Zm, %s", amt_width, amt, p);
        /* this doesn't support hallucinatory currency because shopkeeper
           isn't hallucinating; also, that would mess up the alignment */
        any.a_int = i + 1;
        add_menu(win, nul_glyphinfo, any, 0, 0, 0, 8, buf, 0);
    }
    (game.windowprocs.win_end_menu)(win, "Pay for which items?");
    n = select_menu(win, 2, pick_list);
    (game.windowprocs.win_destroy_nhwindow)(win);
    for (j = 0; j < n; ++j) {
        /*
         * FIXME:
         *  The menu will accept a subset count for each entry but buying
         *  doesn't have any support for that.
         */
        i = pick_list[j].item.a_int - 1;
        ibill[i].queuedpay = (1);
    }
    free(pick_list);
    /* for ESC, return 0 instead of usual -1 */
    return ((n) > (0) ? (n) : (0));
}
/* the #pay command */
export function dopay() {
    let eshkp = null;
    let shkp = null;
    let nxtm = null;
    let resident = null;
    let ibill = null;
    let ltmp = 0;
    let umoney = 0;
    let sk = 0;
    let seensk = 0;
    let nexttosk = 0;
    let paid = 0;
    let stashed_gold = 0;
    let pay_done = 0;
    proceed: {
        ibill = (null);
        sk = 0;
        seensk = 0;
        nexttosk = 0;
        paid = (0);
        stashed_gold = (hidden_gold((1)) > 0);
        game.multi = 0;
        /* Find how many shk's there are, how many are in
     * sight, and are you in a shop room with one.
     */
        nxtm = resident = null;
        for (shkp = next_shkp(game.level.monlist, (0)); shkp; shkp = next_shkp(shkp.nmon, (0))) {
            sk++;
            if ((dist2(((shkp).mx), ((shkp).my), game.u.ux, game.u.uy) <= 2)) {
                /* next to an irate shopkeeper? prioritize that */
                if (nxtm && (!((nxtm).mpeaceful))) {
                    continue;
                }
                nexttosk++;
                nxtm = shkp;
            }
            if ((canseemon(shkp) || sensemon(shkp))) {
                seensk++;
            }
            if (inhishop(shkp) && (game.u.ushops == ((shkp).mextra.eshk).shoproom)) {
                resident = shkp;
            }
        }
        if (nxtm && nexttosk == 1) {
            shkp = nxtm;
            break proceed;
        }
        if ((!sk && (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic))) || (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !seensk)) {
            There("appears to be no shopkeeper here to receive your payment.");
            return 0;
        }
        if (!seensk) {
            You_cant("see...");
            return 0;
        }
        if (sk == 1 && resident) {
            /* The usual case.  Allow paying at a distance when
     * inside a tended shop.  Should we change that?
     */
            shkp = resident;
            break proceed;
        }
        if (seensk == 1) {
            for (shkp = next_shkp(game.level.monlist, (0)); shkp; shkp = next_shkp(shkp.nmon, (0))) {
                if ((canseemon(shkp) || sensemon(shkp))) {
                    break;
                }
            }
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            if (shkp != resident && !(dist2(((shkp).mx), ((shkp).my), game.u.ux, game.u.uy) <= 2)) {
                /* seensk==1 =>  traversal will spot one shk */
                pline("%s is not near enough to receive your payment.", Shknam(shkp));
                return 0;
            }
        } else {
            let mtmp = null;
            let cc = { x: 0, y: 0 };
            let cx = 0;
            let cy = 0;
            pline("Pay whom?");
            cc.x = game.u.ux;
            cc.y = game.u.uy;
            if (getpos(cc, (1), "the creature you want to pay") < 0) {
                /* failure; have caller give a generic message */
                return 2;
            }
            cx = cc.x;
            cy = cc.y;
            if (cx < 0) {
                pline("Try again...");
                return 0;
            }
            if (((cx) == game.u.ux && (cy) == game.u.uy)) {
                You("are generous to yourself.");
                return 0;
            }
            mtmp = (game.level.monsters[cx][cy]);
            if (!((game.viz_array[cy][cx] & 2) != 0) && (!mtmp || !(canseemon(mtmp) || sensemon(mtmp)))) {
                You("can't %s anyone there.", !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "see" : "sense");
                return 0;
            }
            if (!mtmp) {
                There("is no one there to receive your payment.");
                return 0;
            }
            if (!mtmp.isshk) {
                pline("%s is not interested in your payment.", Monnam(mtmp));
                return 0;
            }
            if (mtmp != resident && !(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
                pline("%s is too far to receive your payment.", Shknam(mtmp));
                return 0;
            }
            shkp = mtmp;
        }
        if (!shkp) {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/shk.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("dopay: null shkp.");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            return 0;
        }
    }
    eshkp = ((shkp).mextra.eshk);
    ltmp = eshkp.robbed;
    /* wake sleeping shk when someone who owes money offers payment */
    if (ltmp || eshkp.billct || eshkp.debit) {
        rouse_shk(shkp, (1));
    }
    if (((shkp).msleeping || !(shkp).mcanmove)) {
        pline("%s %s.", Shknam(shkp), rn2(2) ? "seems to be napping" : "doesn't respond");
        return 0;
    }
    if (shkp != resident && ((shkp).mpeaceful)) {
        /* ltmp is still eshkp->robbed here */
        umoney = money_cnt(game.invent);
        if (!ltmp) {
            You("do not owe %s anything.", shkname(shkp));
        } else if (!umoney) {
            You("%shave no gold.", stashed_gold ? "seem to " : "");
            if (stashed_gold) {
                pline("But you have some gold stashed away.");
            }
        } else {
            if (umoney > ltmp) {
                You("give %s the %ld gold piece%s %s asked for.", shkname(shkp), ltmp, (((ltmp) == 1) ? "" : "s"), (genders[pronoun_gender(shkp, (1 | 2))].he));
                pay(ltmp, shkp);
            } else {
                You("give %s all your%s gold.", shkname(shkp), stashed_gold ? " openly kept" : "");
                pay(umoney, shkp);
                if (stashed_gold) {
                    pline("But you have hidden gold!");
                }
            }
            if ((umoney < Math.trunc(ltmp / 2)) || (umoney < ltmp && stashed_gold)) {
                pline("Unfortunately, %s doesn't look satisfied.", (genders[pronoun_gender(shkp, (1 | 2))].he));
            } else {
                make_happy_shk(shkp, (0));
            }
        }
        return 1;
    }
    if (!eshkp.billct && !eshkp.debit) {
        umoney = money_cnt(game.invent);
        if (!ltmp && ((shkp).mpeaceful)) {
            You("do not owe %s anything.", shkname(shkp));
            if (!umoney) {
                pline(no_money, stashed_gold ? " seem to" : "");
            }
        } else if (ltmp) {
            pline("%s is after blood, not gold!", shkname(shkp));
            if (umoney < Math.trunc(ltmp / 2) || (umoney < ltmp && stashed_gold)) {
                if (!umoney) {
                    pline(no_money, stashed_gold ? " seem to" : "");
                } else {
                    pline(not_enough_money, (genders[pronoun_gender(shkp, (1 | 2))].him));
                }
                /* message given by reject_purchase() */
                return 1;
            }
            pline("But since %s shop has been robbed recently,", (genders[pronoun_gender(shkp, (1 | 2))].his));
            pline("you %scompensate %s for %s losses.", (umoney < ltmp) ? "partially " : "", shkname(shkp), (genders[pronoun_gender(shkp, (1 | 2))].his));
            pay(umoney < ltmp ? umoney : ltmp, shkp);
            make_happy_shk(shkp, (0));
        } else {
            /* shopkeeper is angry, but has not been robbed --
             * door broken, attacked, etc. */
            pline("%s is after your hide, not your gold!", Shknam(shkp));
            if (umoney < 1000) {
                if (!umoney) {
                    pline(no_money, stashed_gold ? " seem to" : "");
                } else {
                    pline(not_enough_money, (genders[pronoun_gender(shkp, (1 | 2))].him));
                }
                return 1;
            }
            You("try to appease %s by giving %s 1000 gold pieces.", (canseemon(shkp) || sensemon(shkp)) ? x_monnam(shkp, 1, "angry", 0, (0)) : shkname(shkp), (genders[pronoun_gender(shkp, (1 | 2))].him));
            pay(1000, shkp);
            if (strncmp(eshkp.customer, game.plname, 32) || rn2(3)) {
                make_happy_shk(shkp, (0));
            } else {
                pline("But %s is as angry as ever.", shkname(shkp));
            }
        }
        return 1;
    }
    if (shkp != resident) {
        impossible("dopay: not to shopkeeper?");
        if (resident) {
            setpaid(resident);
        }
        return 0;
    }
    if (eshkp.debit) {
        let dtmp = eshkp.debit;
        let loan = eshkp.loan;
        let sbuf = '';
        umoney = money_cnt(game.invent);
        sbuf = sprintf(sbuf, "You owe %s %ld %s ", shkname(shkp), dtmp, currency(dtmp));
        if (loan) {
            if (loan == dtmp) {
                sbuf = strcat(sbuf, "you picked up in the store.");
            } else {
                sbuf = strcat(sbuf, "for gold picked up and the use of merchandise.");
            }
        } else {
            sbuf = strcat(sbuf, "for the use of merchandise.");
        }
        pline("%s", sbuf);
        if (umoney + eshkp.credit < dtmp) {
            pline("But you don't%s have enough gold%s.", stashed_gold ? " seem to" : "", eshkp.credit ? " or credit" : "");
            return 1;
        } else {
            if (eshkp.credit >= dtmp) {
                eshkp.credit -= dtmp;
                eshkp.debit = 0;
                eshkp.loan = 0;
                Your("debt is covered by your credit.");
            } else if (!eshkp.credit) {
                money2mon(shkp, dtmp);
                eshkp.debit = 0;
                eshkp.loan = 0;
                You("pay that debt.");
                game.disp.botl = (1);
            } else {
                dtmp -= eshkp.credit;
                eshkp.credit = 0;
                money2mon(shkp, dtmp);
                eshkp.debit = 0;
                eshkp.loan = 0;
                pline("That debt is partially offset by your credit.");
                You("pay the remainder.");
                game.disp.botl = (1);
            }
            paid = (1);
        }
    }
    pay_done = (1);
    if (eshkp.billct) {
        let ibillct = make_itemized_bill(shkp, { get value() { return ibill; }, set value(_v) { ibill = _v; } });
        if (!pay_billed_items(shkp, ibillct, ibill, stashed_gold, { get value() { return paid; }, set value(_v) { paid = _v; } })) {
            pay_done = (0);
        }
    }
    if (pay_done && !(!((shkp).mpeaceful)) && paid) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            ;
            /* {mute shk,deaf hero}-aware thank you message */
            verbalize("Thank you for shopping in %s %s%s", s_suffix(shkname(shkp)), shtypes[eshkp.shoptype - SHOPBASE].name, !eshkp.surcharge ? "!" : ".");
        } else {
            pline("%s nods%s at you for shopping in %s %s%s", Shknam(shkp), !eshkp.surcharge ? " appreciatively" : "", (genders[pronoun_gender(shkp, (1 | 2))].his), shtypes[eshkp.shoptype - SHOPBASE].name, !eshkp.surcharge ? "!" : ".");
        }
    }
    if (paid) {
        update_inventory();
    }
    game.iflags.menu_requested = (0);
    if (ibill) {
        /* free the sortbill array used for itemized billing */
        free(ibill) , ibill = null;
        ((ibill));
    }
    return paid ? 1 : 0;
}
/* for menustyle=Traditional, choose between paying for everything (by
   declining to itemize), asking item-by-item (by accepting itemization),
   or switch to selecting via menu (special 'm' answer at "Itemize? [ynq m]"
   prompt); for other menustyles, always select via menu;
   player can use 'm' prefix before 'p' command to invert those behaviors;
   once the method is chosen, actually pay for the selected items, item by
   item for as long as hero has enough credit+cash */
/* output */
export function pay_billed_items(shkp, ibillct, ibill, stashed_gold, paid_p) {
    let bp = null;
    let otmp = null;
    let umoney = 0;
    let itemize = 0;
    let more_than_one = 0;
    let queuedpay = (0);
    let via_menu = 0;
    let buy = 0;
    let indx = 0;
    let bidx = 0;
    let pass = 0;
    let iprompt = 0;
    let ebillct = 0;
    let eshkp = ((shkp).mextra.eshk);
    umoney = money_cnt(game.invent);
    if (!umoney && !eshkp.credit) {
        You("%shave no gold or credit%s.", stashed_gold ? "seem to " : "", paid_p.value ? " left" : "");
        return (1);
    }
    bp = eshkp.bill_p;
    otmp = bp_to_obj(bp);
    ebillct = eshkp.billct;
    more_than_one = (ebillct > 1 || otmp.quan < bp.bquan || ibill[0].usedup == UndisclosedContainer);
    if ((umoney + eshkp.credit) < cheapest_item(ibillct, ibill)) {
        /* note: will only get here for a single item, so
                        we can deduce that it is ibill[0] */
        You("don't have enough gold to buy%s the item%s %s.", more_than_one ? " any of" : "", (((more_than_one ? 2 : 1) == 1) ? "" : "s"), (ebillct > 1) ? "you've picked" : "on your bill");
        if (stashed_gold) {
            pline("Maybe you have some gold stashed away?");
        }
        return (1);
    }
    via_menu = (game.flags.menu_style != 0);
    /* allow 'm p' to request a menu for menustyle:traditional;
       for other styles, it will do the opposite; that doesn't make
       a whole lot of sense for a 'request-menu' prefix, but otherwise
       it would simply be redundant and there wouldn't be any way to
       skip the menu when hero owes for multiple items */
    if (game.iflags.menu_requested) {
        via_menu = !via_menu;
    }
    do {
        if (via_menu) {
            /* this will loop for a second iteration iff not initially using a
       menu and player answers 'm' at custom ynq prompt */
            if (!menu_pick_pay_items(ibillct, ibill)) {
                return (1);
            }
            queuedpay = (1);
            itemize = (0);
            /* reset so that we don't loop */
            via_menu = (0);
        } else {
            iprompt = !more_than_one ? 121 : yn_function("Itemized billing?", "ynq m", 113, (1));
            if (iprompt == 113) {
                return (1);
            }
            itemize = (iprompt == 121);
            via_menu = (iprompt == 109);
        }
    } while (via_menu);
    for (indx = 0; indx < ibillct; ++indx) {
        /*
     * 5.0:  this used to make two passes through eshkp->bill_p[],
     * the first for used up items and the second for unpaid ones.
     * Items which were partly used were processed on both passes.
     *
     * Now it makes one pass through ibill[], which has all used up
     * items sorted to the beginning and unpaid ones sorted to the end.
     * Partly used items have two entries for same base item, one in
     * each section.
     */
        if (queuedpay && !ibill[indx].queuedpay) {
            continue;
        }
        /* ordinary object or outermost container */
        otmp = ibill[indx].obj;
        if (ibill[indx].usedup >= KnownContainer) {
            /* when successfull, buy_container() will call both
               dopayobj() and update_bill(), possibly multiple times */
            let boxbag_result = buy_container(shkp, indx, ibillct, ibill);
            if (boxbag_result == 0) {
                /* flag; if changed then return early */
                buy = 1;
            } else {
                /* buy_container() failed... */
                /* ... but didn't explain why */
                if (boxbag_result == 2) {
                    verbalize("You need to remove any unpaid items from that %s and buy them separately.", simpleonames(otmp));
                }
                buy = 0;
            }
        } else {
            bidx = ibill[indx].bidx;
            bp = eshkp.bill_p[bidx];
            pass = (ibill[indx].usedup <= PartlyUsedUp) ? 0 : 1;
            buy = dopayobj(shkp, bp, otmp, pass, itemize, (0));
            if (buy == 1) {
                update_bill(indx, ibillct, ibill, eshkp, bp, otmp);
            }
        }
        switch (buy) {
            case 0:
                return (0);
            case (-2):
                paid_p.value = (1);
                return (1);
            case (-1):
                continue;
            /* case PAY_SOME: //no longer used */
            case 1:
                paid_p.value = (1);
                if (itemize || queuedpay) {
                    update_inventory();
                    bot();
                }
                break;
        }
    }
    return (1);
}
/* update shk's bill and augmented bill after an item has been purchased */
/* index into ibill[]; -1 for unpaid contained item */
export function update_bill(indx, ibillct, ibill, eshkp, bp, paiditem) {
    let j = 0;
    let newebillct = 0;
    if (indx >= 0 && ibill[indx].usedup == PartlyUsedUp) {
        /* remove from eshkp->bill_p[] unless this was the used up portion
       of partly used item (since removal would take out both; note:
       can't buy PartlyIntact until PartlyUsedUp has been paid for) */
        /* 'paiditem' points to the partly intact portion still in invent or
           inside a container (ibill[indx].obj points to the container) */
        bp.bquan = paiditem.quan;
        for (j = 0; j < ibillct; ++j) {
            if (ibill[j].obj == paiditem && ibill[j].usedup == PartlyIntact) {
                ibill[j].usedup = FullyIntact;
                break;
            }
        }
    } else {
        /* if we get here, something was bought and needs to be removed
           from shop bill; if it was used up, remove it from the billobjs
           list and delete it; update shop's bill by moving last bill_p[]
           entry into vacated slot; also update ibill[] indices for that */
        /* clear before maybe deallocating */
        paiditem.unpaid = 0;
        if (paiditem.where == 7) {
            obj_extract_self(paiditem);
            dealloc_obj(paiditem);
        }
        newebillct = eshkp.billct - 1;
        Object.assign(bp, eshkp.bill_p[newebillct]);
        for (j = 0; j < ibillct; ++j) {
            if (ibill[j].bidx == newebillct) {
                ibill[j].bidx = (bp - eshkp.bill_p);
            }
        }
        eshkp.billct = newebillct;
    }
    return;
}
/* return 2 if used-up portion paid
 *        1 if paid successfully
 *        0 if not enough money
 *       -1 if skip this object
 *       -2 if no money/credit left
 */
/* 0 => used-up item, 1 => other (unpaid or lost) */
export function dopayobj(shkp, bp, obj, which, itemize, unseen) {
    let ltmp = 0;
    let quan = 0;
    let save_quan = 0;
    let buy = 0;
    let consumed = (which == 0);
    if (!obj.unpaid && !bp.useup && !(((obj).cobj != null) && unpaid_cost(obj, COST_CONTENTS))) {
        impossible("Paid object on bill??");
        return 1;
    }
    if (itemize && insufficient_funds(shkp, obj, 0)) {
        return (-2);
    }
    /* we may need to temporarily adjust the object, if part of the
       original quantity has been used up but part remains unpaid; [note:
       this predates 'ibill[]' and feels redundant but still works] */
    save_quan = obj.quan;
    if (consumed) {
        quan = bp.bquan;
        /* difference is amount used up */
        if (quan > obj.quan) {
            quan -= obj.quan;
        }
    } else {
        /* dealing with ordinary unpaid item */
        quan = obj.quan;
    }
    ltmp = bp.price * quan;
    obj.quan = quan;
    game.iflags.suppress_price++;
    buy = 1;
    if (itemize) {
        let qbuf = '';
        let qsfx = '';
        qsfx = sprintf(qsfx, " for %ld %s.  Pay?", ltmp, currency(ltmp));
        /*
         * TODO:
         *  This should also accept 'a' and 'q' to end itemized paying:
         *  'a' to buy the rest without asking, 'q' to just stop.
         */
        safe_qbuf(qbuf, null, qsfx, obj, (quan == 1) ? Doname2 : doname, ansimpleoname, (quan == 1) ? "that" : "those");
        if (yn_function(qbuf, ynchars, 110, (1)) == 110) {
            buy = (-1);
        }
    }
    if (quan < bp.bquan && !consumed) {
        /* shk won't sell the intact portion until the used up portion has
           been paid for (once it has been, bp->bquan will match quan) */
        reject_purchase(shkp, obj, bp.bquan);
        buy = (-1);
    }
    if (buy == 1 && insufficient_funds(shkp, obj, ltmp)) {
        buy = itemize ? (-1) : 0;
    }
    if (buy == 1) {
        pay(ltmp, shkp);
        if (!unseen) {
            shk_names_obj(shkp, obj, consumed ? "paid for %s at a cost of %ld gold piece%s.%s" : "bought %s for %ld gold piece%s.%s", ltmp, "");
        }
    }
    /* restore obj to original state */
    obj.quan = save_quan;
    game.iflags.suppress_price--;
    return buy;
}
/* pay for the unpaid contents of a container without itemizing,
   and for the container itself if it is unpaid too;
   returns 0==successfully bought; 1==rejected, message given here;
   2=rejected, caller should issue message */
export function buy_container(shkp, indx, ibillct, ibill) {
    let boid = 0;
    let boids = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    let j = 0;
    let buy = 0;
    let buycount = 0;
    let boidsct = 0;
    let eshkp = ((shkp).mextra.eshk);
    let ebillct = eshkp.billct;
    let bp = null;
    let otmp = null;
    let otop = null;
    let container = ibill[indx].obj;
    let unpaidcontainer = container.unpaid;
    let totalcost = ibill[indx].cost;
    let sightunseen = ibill[indx].usedup == UndisclosedContainer || ibill[indx].usedup == KnownContainer;
    /* check for no-gold first, then for not-enough-gold; feedback is
       different for the two cases */
    if (insufficient_funds(shkp, container, 0) || insufficient_funds(shkp, container, totalcost)) {
        return 1;
    }
    for (i = 0; i < ebillct; ++i) {
        bp = eshkp.bill_p[i];
        otmp = bp_to_obj(bp);
        if (!otmp) {
            impossible("Can't find contained item on shop bill (#%d).", bp.bo_id);
            return 2;
        }
        if (otmp.where != 2 && !((otmp).cobj != null)) {
            continue;
        }
        /* otmp is contained, but possibly inside a different container */
        for (otop = otmp; otop.where == 2; otop = otop.v.v_ocontainer) {
            continue;
        }
        /* where==OBJ_CONTAINED loop */
        if (otop != container) {
            continue;
        }
        if (otmp.quan < bp.bquan) {
            /* now check for partly intact portion of partly used item */
            reject_purchase(shkp, otmp, bp.bquan);
            return 1;
        }
        /* record this for the second pass; unless it's the container--that
           will be deferred until after the loop so that it will be last */
        if (bp.bo_id != container.o_id) {
            boids[boidsct++] = bp.bo_id;
        }
    }
    if (unpaidcontainer) {
        boids[boidsct++] = container.o_id;
    }
    for (j = 0; j < boidsct; ++j) {
        /* now make the actual purchasing pass; we've collected a set of
       o_id values in order to avoid traversing the shk's bill while it
       undergoes updates */
        boid = boids[j];
        for (i = 0; i < ebillct; ++i) {
            bp = eshkp.bill_p[i];
            if (bp.bo_id == boid) {
                break;
            }
        }
        if (i == ebillct) {
            impossible("Buying %s contents: item #%u disappeared from bill.", simpleonames(container), boid);
            return 2;
        }
        otmp = bp_to_obj(bp);
        buy = dopayobj(shkp, bp, otmp, 1, (0), sightunseen);
        if (buy != 1) {
            impossible("Buying %s contents failed unexpectedly (#%u %d).", simpleonames(container), otmp.o_id, buy);
            continue;
        }
        /* [updating cost here is not necessary but useful when debugging] */
        ibill[indx].cost -= (bp.price * bp.bquan);
        update_bill((boid == container.o_id) ? indx : -1, ibillct, ibill, eshkp, bp, otmp);
        ++buycount;
    }
    if (buycount && sightunseen) {
        /* if the container was unpaid, the hero has just purchased it;
           normally paydoname()--called by shk_names_obj()--would give
           "contents of your <container>" when it's hero-owned but we
           want it to reflect container's state before purchase;
           since paydoname() isn't called for no_charge items, we use
           obj->no_charge as a hack to avoid that phrasing in favor of
           "a/an <container> and its contents"; temporarily set
           obj->unpaid to reflect the before-purchase state too */
        if (unpaidcontainer) {
            container.unpaid = container.no_charge = 1;
        }
        shk_names_obj(shkp, container, "bought %s for %ld gold piece%s.%s", totalcost, "");
        container.unpaid = container.no_charge = 0;
    }
    /* we don't expect buycount to be 0 */
    return buycount ? 0 : 2;
}
/* called if an item on shop bill is partly used up and partly intact and
   player tries to buy the intact portion before paying for used up portion
   (not actually very effective since player can just drop the unpaid
   portion then pick it back up to have it get its own distinct bill entry;
   the former partly used up portion becomes a fully used up separate item) */
export function reject_purchase(shkp, obj, billed_quan) {
    let intact_quan = obj.quan;
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    /* temporarily change obj to refer to the used up portion */
    obj.quan = billed_quan - intact_quan;
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
        let which = '';
        if (obj.where == 2) {
            which = nh_snprintf("reject_purchase", 2434, which, 256 /* sizeof(char [256]) */, "the one%s in %s", (((intact_quan) == 1) ? "" : "s"), thesimpleoname(obj.v.v_ocontainer));
        } else {
            which = sprintf(which, "%s", (intact_quan > 1) ? "these" : "this one");
        }
        ;
        verbalize("%s for the other %s before buying %s.", (!((shkp).mpeaceful)) ? "Pay" : "Please pay", simpleonames(obj), which);
    } else {
        pline("%s %s%s your bill for the other %s first.", Shknam(shkp), (!((shkp).mpeaceful)) ? "angrily " : "", (((shkp.data).mflags1 & 24576) == 24576) ? "motions to" : "points out", simpleonames(obj));
    }
    obj.quan = intact_quan;
}
/* gold+credit checking+feedback common to dopayobj() and buy_container() */
/* 0: check for no-gold; >0: check for specified amount */
export function insufficient_funds(shkp, item, cost) {
    let stashed_gold = 0;
    let umoney = money_cnt(game.invent);
    let ecredit = ((shkp).mextra.eshk).credit;
    if (!cost && umoney + ecredit == 0) {
        /* dopayobj() checks for no-gold early and not-enough-gold later;
       buy_container() checks for both early but uses separate calls to us */
        stashed_gold = hidden_gold((1));
        You("%shave no gold or credit left.", (stashed_gold > 0) ? "seem to " : "");
        return (1);
    }
    if (cost && umoney + ecredit < cost) {
        stashed_gold = hidden_gold((1));
        You("don't%s have gold%s enough to pay for %s.", (stashed_gold > 0) ? " seem to" : "", (ecredit > 0) ? " or credit" : "", paydoname(item));
        return (1);
    }
    return (0);
}
/* routine called after dying (or quitting) */
/* -1: escaped dungeon; 0: quit; 1: died */
/* maybe avoid messages */
export function paybill(croaked, silently) {
    let mtmp = null;
    let mtmp2 = null;
    let firstshk = null;
    let resident = null;
    let creditor = null;
    let hostile = null;
    let localshk = null;
    let eshkp = null;
    let taken = (0);
    let local = 0;
    let numsk = 0;
    /* if we escaped from the dungeon, shopkeepers can't reach us;
       shops don't occur on level 1, but this could happen if hero
       level teleports out of the dungeon and manages not to die */
    if (croaked < 0) {
        return (0);
    }
    /* [should probably also return false when dead hero has been
        petrified since shk shouldn't be able to grab inventory
        which has been shut inside a statue] */
    /* this is where inventory will end up if any shk takes it */
    game.repo.location.x = game.repo.location.y = 0;
    game.repo.shopkeeper = null;
    /*
     * Scan all shopkeepers on the level, to prioritize them:
     * 1) keeper of shop hero is inside and who is owed money,
     * 2) keeper of shop hero is inside who isn't owed any money,
     * 3) other shk who is owed money, 4) other shk who is angry,
     * 5) any shk local to this level, and if none is found,
     * 6) first shk on monster list (last resort; unlikely, since
     * any nonlocal shk will probably be in the owed category
     * and almost certainly be in the angry category).
     */
    resident = creditor = hostile = localshk = null;
    for (mtmp = next_shkp(game.level.monlist, (0)); mtmp; mtmp = next_shkp(mtmp2, (0))) {
        mtmp2 = mtmp.nmon;
        eshkp = ((mtmp).mextra.eshk);
        local = on_level(eshkp.shoplevel, game.u.uz);
        if (local && strchr(game.u.ushops, eshkp.shoproom)) {
            /* inside this shk's shop [there might be more than one
               resident shk if hero is standing in a breech of a shared
               wall, so give priority to one who's also owed money] */
            if (!resident || eshkp.billct || eshkp.debit || eshkp.robbed) {
                resident = mtmp;
            }
        } else if (eshkp.billct || eshkp.debit || eshkp.robbed) {
            /* owe this shopkeeper money (might also owe others) */
            if (!creditor) {
                creditor = mtmp;
            }
        } else if (eshkp.following || (!((mtmp).mpeaceful))) {
            /* this shopkeeper is antagonistic (others might be too) */
            if (!hostile) {
                hostile = mtmp;
            }
        } else if (local) {
            /* this shopkeeper's shop is on current level */
            if (!localshk) {
                localshk = mtmp;
            }
        }
    }
    /* give highest priority shopkeeper first crack */
    firstshk = resident ? resident : creditor ? creditor : hostile ? hostile : localshk;
    if (firstshk) {
        numsk++;
        taken = inherits(firstshk, numsk, croaked, silently);
    }
    for (mtmp = next_shkp(game.level.monlist, (0)); mtmp; mtmp = next_shkp(mtmp2, (0))) {
        mtmp2 = mtmp.nmon;
        eshkp = ((mtmp).mextra.eshk);
        local = on_level(eshkp.shoplevel, game.u.uz);
        if (mtmp != firstshk) {
            numsk++;
            taken |= inherits(mtmp, numsk, croaked, silently);
        }
        /* for bones: we don't want a shopless shk around */
        if (!local) {
            mongone(mtmp);
        }
    }
    return taken;
}
/* decide whether a shopkeeper will take possession of dying hero's invent;
   when this returns True, it should call set_repo_loc() before returning;
   when it returns False, it should not do such because that might have
   already been called for some shopkeeper */
export function inherits(shkp, numsk, croaked, silently) {
    let loss = 0;
    let umoney = 0;
    let eshkp = null;
    let take = 0;
    let taken = 0;
    let uinshop = 0;
    let takes = '';
    clear: {
        loss = 0;
        eshkp = ((shkp).mextra.eshk);
        take = (0);
        taken = (0);
        uinshop = (strchr(game.u.ushops, eshkp.shoproom) != null);
        /* not strictly consistent; affects messages and prevents next player
       (if bones are saved) from blundering into or being ambushed by an
       invisible shopkeeper */
        shkp.minvis = shkp.perminvis = 0;
        if (numsk > 1) {
            if (((game.viz_array[shkp.my][shkp.mx] & 2) != 0) && croaked && !silently) {
                /* The simplifying principle is that first-come
       already took everything you had. */
                takes = '';
                if ((((shkp.data).mflags1 & 32768) == 0) && !rn2(2)) {
                    takes = sprintf(takes, ", shakes %s %s,", (genders[pronoun_gender(shkp, (1 | 2))].his), mbodypart(shkp, HEAD));
                }
                pline("%s %slooks at your corpse%s and %s.", Shknam(shkp), ((shkp).msleeping || !(shkp).mcanmove) ? "wakes up, " : "", takes, !inhishop(shkp) ? "disappears" : "sighs");
            }
            taken = uinshop;
            rouse_shk(shkp, (0));
            if (!inhishop(shkp)) {
                home_shk(shkp, (0));
            }
            break clear;
        }
        if (uinshop && inhishop(shkp) && !eshkp.billct && !eshkp.robbed && !eshkp.debit && ((shkp).mpeaceful) && !eshkp.following && game.u.ugrave_arise < LOW_PM) {
            /* get one case out of the way: you die in the shop, the
       shopkeeper is peaceful, nothing stolen, nothing owed */
            taken = (game.invent != null);
            if (taken && !silently) {
                pline("%s gratefully inherits all your possessions.", Shknam(shkp));
            }
            break clear;
        }
        if (eshkp.billct || eshkp.debit || eshkp.robbed) {
            if (uinshop && inhishop(shkp)) {
                loss = addupbill(shkp) + eshkp.debit;
            }
            if (loss < eshkp.robbed) {
                loss = eshkp.robbed;
            }
            take = (1);
        }
        if (eshkp.following || (!((shkp).mpeaceful)) || take) {
            skip: {
                if (!game.invent) {
                    break skip;
                }
                umoney = money_cnt(game.invent);
                takes = '';
                if (((shkp).msleeping || !(shkp).mcanmove)) {
                    takes = strcat(takes, "wakes up and ");
                }
                if (!(dist2(((shkp).mx), ((shkp).my), game.u.ux, game.u.uy) <= 2)) {
                    takes = strcat(takes, "comes and ");
                }
                takes = strcat(takes, "takes");
                if (loss > umoney || !loss || uinshop) {
                    eshkp.robbed -= umoney;
                    if (eshkp.robbed < 0) {
                        eshkp.robbed = 0;
                    }
                    if (umoney > 0) {
                        money2mon(shkp, umoney);
                        game.disp.botl = (1);
                    }
                    if (!silently) {
                        pline("%s %s all your possessions.", Shknam(shkp), takes);
                    }
                    taken = (1);
                } else {
                    money2mon(shkp, loss);
                    game.disp.botl = (1);
                    if (!silently) {
                        pline("%s %s the %ld %s %sowed %s.", Shknam(shkp), takes, loss, currency(loss), strncmp(eshkp.customer, game.plname, 32) ? "" : "you ", (genders[pronoun_gender(shkp, (1 | 2))].him));
                    }
                    /* shopkeeper has now been paid in full */
                    pacify_shk(shkp, (0));
                    eshkp.following = 0;
                    eshkp.robbed = 0;
                }
            }
            rouse_shk(shkp, (0));
            if (!inhishop(shkp)) {
                home_shk(shkp, (0));
            }
        }
    }
    setpaid(shkp);
    /* where to put player's invent (after disclosure) */
    if (taken) {
        set_repo_loc(shkp);
    }
    return taken;
}
export function set_repo_loc(shkp) {
    let ox = 0;
    let oy = 0;
    let eshkp = ((shkp).mextra.eshk);
    /* when multiple shopkeepers are present, we might get called more
       than once; don't override previous setting */
    if (game.repo.shopkeeper) {
        return;
    }
    /* savebones() sets u.ux,u.uy to 0,0 to remove hero from map but that
       takes place after finish_paybill() has been called so we expect
       u.ux,u.uy to be valid; however, there has been a report of
       impossible "place_object: \"<item>\" off map <0,0>" when hero died
       in a gap in a shop's wall (in Minetown, so multiple shopkeepers in
       play, and prior to adding 'if (gr.repo.shopkeeper) return' above) */
    ox = game.u.ux ? game.u.ux : game.u.ux0;
    /* [testing u.ux when setting oy is correct] */
    oy = game.u.ux ? game.u.uy : game.u.uy0;
    if (!strchr(game.u.ushops, eshkp.shoproom) || costly_adjacent(shkp, ox, oy)) {
        /* if you're not in this shk's shop room, or if you're in its doorway
       or entry spot or one of its walls (temporary gap or Passes_walls),
       then your gear gets dumped all the way inside */
        /* shk.x,shk.y is the position immediately in front of the door;
           move in one more space */
        ox = eshkp.shk.x;
        oy = eshkp.shk.y;
        ox += sgn(ox - eshkp.shd.x);
        oy += sgn(oy - eshkp.shd.y);
    } else {
        ;
    }
    /* finish_paybill will deposit invent here */
    game.repo.location.x = ox;
    game.repo.location.y = oy;
    game.repo.shopkeeper = shkp;
}
/* called at game exit, after inventory disclosure but before making bones;
   shouldn't issue any messages */
export function finish_paybill() {
    let shkp = game.repo.shopkeeper;
    let ox = game.repo.location.x;
    let oy = game.repo.location.y;
    if (!isok(ox, oy)) {
        /*
     * If set_repo_loc() didn't get called for some reason (good luck
     * untangling inherits() to figure out why...), ox,oy will be 0,0
     * and shkp will be Null.  Fix coordinates if that happens.
     */
        /* this used to be suppressed as "don't bother" (too late to matter)
           but that led to "place_object: \"<item>\" off map <0,0>" warning */
        if (shkp) {
            impossible("finish_paybill: bad location <%d,%d>.", ox, oy);
        }
        ox = game.u.ux ? game.u.ux : game.u.ux0;
        /* [note: testing u.ux when setting oy
                                   *  is correct here]*/
        oy = game.u.ux ? game.u.uy : game.u.uy0;
    }
    /* normally done by savebones(), but that's too late in this case */
    unleash_all();
    if (shkp) {
        /* if hero has any gold left, take it into shopkeeper's possession */
        let umoney = money_cnt(game.invent);
        if (umoney) {
            money2mon(shkp, umoney);
        }
    }
    /* transfer rest of the character's inventory to the shop floor */
    drop_upon_death(null, null, ox, oy);
}
/* find obj on one of the lists */
export function bp_to_obj(bp) {
    let obj = null;
    let id = bp.bo_id;
    if (bp.useup) {
        obj = o_on(id, game.billobjs);
    } else {
        obj = find_oid(id);
    }
    return obj;
}
/*
 * Look for o_id on all lists but billobj.  Return obj or NULL if not found.
 * Its OK for restore_timers() to call this function, there should not
 * be any timeouts on the gb.billobjs chain.
 */
export function find_oid(id) {
    let obj = null;
    let mon = null;
    let mmtmp = [null, null, null];
    let i = 0;
    /* first check various obj lists directly */
    if ((obj = o_on(id, game.invent)) != null) {
        return obj;
    }
    if ((obj = o_on(id, game.level.objlist)) != null) {
        return obj;
    }
    if ((obj = o_on(id, game.level.buriedobjlist)) != null) {
        return obj;
    }
    if ((obj = o_on(id, game.migrating_objs)) != null) {
        return obj;
    }
    /* not found yet; check inventory for members of various monst lists */
    mmtmp[0] = game.level.monlist;
    mmtmp[1] = game.migrating_mons;
    /* for use during level changes */
    mmtmp[2] = game.mydogs;
    for (i = 0; i < 3; i++) {
        for (mon = mmtmp[i]; mon; mon = mon.nmon) {
            if ((obj = o_on(id, mon.minvent)) != null) {
                return obj;
            }
        }
    }
    return null;
}
/* Returns the price of an arbitrary item in the shop,
   0 if the item doesn't belong to a shopkeeper or hero is not in the shop. */
/* alternate return value: 1: no charge, 0: shop owned,
                  * -1: not in a shop (so don't format as "no charge") */
export function get_cost_of_shop_item(obj, nochrg) {
    let shkp = null;
    let top = null;
    let x = 0;
    let y = 0;
    let freespot = 0;
    let cost = 0;
    nochrg.value = -1;
    if (game.u.ushops && obj.oclass != COIN_CLASS && obj != game.uball && obj != game.uchain && get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1) && in_rooms(x, y, SHOPBASE) == game.u.ushops && (shkp = shop_keeper(inside_shop(x, y))) != null && inhishop(shkp)) {
        for (top = obj; top.where == 2; top = top.v.v_ocontainer) {
            continue;
        }
        freespot = (top.where == 1 && x == ((shkp).mextra.eshk).shk.x && y == ((shkp).mextra.eshk).shk.y);
        /* no_charge is only set for floor items inside shop proper;
           items on freespot are implicitly 'no charge' */
        nochrg.value = (top.where == 1 && (obj.no_charge || freespot));
        if (((top).where == 3) ? obj.unpaid : !nochrg.value) {
            let per_unit_cost = get_cost(obj, shkp);
            cost = get_pricing_units(obj) * per_unit_cost;
        }
        if (((obj).cobj != null) && !freespot) {
            cost += contained_cost(obj, shkp, 0, (0), (1));
        }
    }
    return cost;
}
export function get_pricing_units(obj) {
    let units = obj.quan;
    if (obj.globby) {
        /* globs must be sold by weight not by volume */
        let unit_weight = game.objects[obj.otyp].oc_weight;
        let wt = (obj.owt > 0) ? obj.owt : weight(obj);
        if (unit_weight) {
            units = Math.trunc((wt + unit_weight - 1) / unit_weight);
        }
    }
    return units;
}
/* decide whether to apply a surcharge (or hypothetically, a discount) to obj
   if it had ID number 'oid'; returns 1: increase, 0: normal, -1: decrease */
export function oid_price_adjustment(obj, oid) {
    let res = 0;
    let otyp = obj.otyp;
    if (!(obj.dknown && game.objects[otyp].oc_name_known) && (obj.oclass != GEM_CLASS || game.objects[otyp].oc_material != GLASS)) {
        /* id%4 ==0 -> +1, ==1..3 -> 0 */
        res = ((oid % 4) == 0);
    }
    return res;
}
/* calculate the value that the shk will charge for [one of] an object */
/* if angry, impose a surcharge */
export function get_cost(obj, shkp) {
    /*
     * FIXME:
     *  If this obj is already on the shop's bill, use the price which
     *  has been set there.  Otherwise, the amount could be different
     *  (if billed while undiscovered and now become discovered or
     *  hero's charisma and/or visible worn gear have changed).
     */
    let tmp = getprice(obj, (0));
    let multiplier = 1;
    let divisor = 1;
    if (!tmp) {
        tmp = 5;
    }
    if (!obj.dknown || !game.objects[obj.otyp].oc_name_known) {
        if (obj.oclass == GEM_CLASS && game.objects[obj.otyp].oc_material == GLASS) {
            /* used to perform a single calculation even when multiple
            adjustments (unID'd, dunce/tourist, charisma) are made */
            /* shopkeeper may notice if the player isn't very knowledgeable -
       especially when gem prices are concerned */
            let i = 0;
            /* get a value that's 'random' from game to game, but the
               same within the same game */
            let pseudorand = ((game.ubirthday % obj.otyp) >= Math.trunc(obj.otyp / 2));
            switch (obj.otyp - FIRST_GLASS_GEM) {
                /* all gems are priced high - real or not */
                case 0:
                    i = pseudorand ? DIAMOND : OPAL;
                    break;
                case 1:
                    i = pseudorand ? SAPPHIRE : AQUAMARINE;
                    break;
                case 2:
                    i = pseudorand ? RUBY : JASPER;
                    break;
                case 3:
                    i = pseudorand ? AMBER : TOPAZ;
                    break;
                case 4:
                    i = pseudorand ? JACINTH : AGATE;
                    break;
                case 5:
                    i = pseudorand ? CITRINE : CHRYSOBERYL;
                    break;
                case 6:
                    i = pseudorand ? BLACK_OPAL : JET;
                    break;
                case 7:
                    i = pseudorand ? EMERALD : JADE;
                    break;
                case 8:
                    i = pseudorand ? AMETHYST : FLUORITE;
                    break;
                default:
                    impossible("bad glass gem %d?", obj.otyp);
                    i = STRANGE_OBJECT;
                    break;
            }
            tmp = game.objects[i].oc_cost;
        } else if (oid_price_adjustment(obj, obj.o_id) > 0) {
            /* unid'd, arbitrarily impose surcharge: tmp *= 4/3 */
            multiplier *= 4;
            divisor *= 3;
        }
    }
    if (game.uarmh && game.uarmh.otyp == DUNCE_CAP) {
        multiplier *= 4 , divisor *= 3;
    } else if (((game.urole.mnum == (PM_TOURIST)) && game.u.ulevel < (Math.trunc(30 / 2))) || (game.uarmu && !game.uarm && !game.uarmc)) {
        multiplier *= 4 , divisor *= 3;
    }
    if ((acurr(A_CHA)) > 18) {
        divisor *= 2;
    } else if ((acurr(A_CHA)) == 18) {
        multiplier *= 2 , divisor *= 3;
    } else if ((acurr(A_CHA)) >= 16) {
        multiplier *= 3 , divisor *= 4;
    } else if ((acurr(A_CHA)) <= 5) {
        multiplier *= 2;
    } else if ((acurr(A_CHA)) <= 7) {
        multiplier *= 3 , divisor *= 2;
    } else if ((acurr(A_CHA)) <= 10) {
        multiplier *= 4 , divisor *= 3;
    }
    /* tmp = (tmp * multiplier) / divisor [with roundoff tweak] */
    tmp *= multiplier;
    if (divisor > 1) {
        /* tmp = (((tmp * 10) / divisor) + 5) / 10 */
        tmp *= 10;
        tmp = Math.trunc(tmp / divisor);
        tmp += 5;
        tmp = Math.trunc(tmp / 10);
    }
    if (tmp <= 0) {
        tmp = 1;
    }
    /* the artifact prices in artilist[] are also used as a score bonus;
       inflate their shop price here without affecting score calculation */
    if (obj.oartifact) {
        tmp *= 4;
    }
    /* anger surcharge should match rile_shk's, so we do it separately
       from the multiplier/divisor calculation */
    if (shkp && ((shkp).mextra.eshk).surcharge) {
        tmp += Math.trunc((tmp + 2) / 3);
    }
    return tmp;
}
/* returns the price of a container's content.  the price
 * of the "top" container is added in the calling functions.
 * a different price quoted for selling as vs. buying.
 */
export function contained_cost(obj, shkp, price, usell, unpaid_only) {
    let otmp = null;
    let top = null;
    let x = 0;
    let y = 0;
    let on_floor = 0;
    let freespot = 0;
    for (top = obj; top.where == 2; top = top.v.v_ocontainer) {
        continue;
    }
    /* pick_obj() removes item from floor, adds it to shop bill, then
       puts it in inventory; behave as if it is still on the floor
       during the add-to-bill portion of that situation */
    on_floor = (top.where == 1 || top.where == 0);
    if (top.where == 0 || !get_obj_location(top, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0)) {
        x = game.u.ux , y = game.u.uy;
    }
    freespot = (on_floor && x == ((shkp).mextra.eshk).shk.x && y == ((shkp).mextra.eshk).shk.y);
    /* accumulate contained gold */
    for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
        /* price of contained objects; "top" container handled by caller */
        /* the "top" container is treated in the calling fn */
        /* the price of contained objects; caller handles top container */
        if (otmp.oclass == COIN_CLASS) {
            continue;
        }
        if (usell) {
            if (saleable(shkp, otmp) && !otmp.unpaid && otmp.oclass != BALL_CLASS && !(otmp.oclass == FOOD_CLASS && otmp.oeaten) && !((otmp.otyp == TALLOW_CANDLE || otmp.otyp == WAX_CANDLE) && otmp.age < 20 * game.objects[otmp.otyp].oc_cost)) {
                price += set_cost(otmp, shkp);
            }
        } else {
            /* no_charge is only set for floor items (including
               contents of floor containers) inside shop proper;
               items on freespot are implicitly 'no charge' */
            if (on_floor ? (!otmp.no_charge && !freespot) : (otmp.unpaid || !unpaid_only)) {
                price += get_cost(otmp, shkp) * get_pricing_units(otmp);
            }
        }
        if (((otmp).cobj != null)) {
            price = contained_cost(otmp, shkp, price, usell, unpaid_only);
        }
    }
    return price;
}
/* count amount of gold inside container 'obj' and any nested containers */
/* T: all gold; F: limit to known contents */
export function contained_gold(obj, even_if_unknown) {
    let otmp = null;
    let value = 0;
    for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
        if (otmp.oclass == COIN_CLASS) {
            value += otmp.quan;
        } else if (((otmp).cobj != null) && (otmp.cknown || even_if_unknown)) {
            value += contained_gold(otmp, even_if_unknown);
        }
    }
    return value;
}
export function dropped_container(obj, shkp, sale) {
    let otmp = null;
    for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
        if (otmp.oclass == COIN_CLASS) {
            continue;
        }
        if (!otmp.unpaid && !(sale && saleable(shkp, otmp))) {
            otmp.no_charge = 1;
        }
        if (((otmp).cobj != null)) {
            dropped_container(otmp, shkp, sale);
        }
    }
}
export function picked_container(obj) {
    let otmp = null;
    for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
        if (otmp.oclass == COIN_CLASS) {
            continue;
        }
        if (otmp.no_charge) {
            otmp.no_charge = 0;
        }
        if (((otmp).cobj != null)) {
            picked_container(otmp);
        }
    }
}
export function special_stock(obj, shkp, quietly) {
    if (((shkp).mextra.eshk).shoptype == CANDLESHOP && obj.otyp == CANDELABRUM_OF_INVOCATION) {
        if (!quietly) {
            if (is_izchak(shkp, (1)) && !game.u.uevent.invoked) {
                if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) || (((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                    pline("%s seems %s that you want to sell that.", Shknam(shkp), (obj.spe < 7) ? "horrified" : "concerned");
                } else {
                    ;
                    verbalize("No thanks, I'd hang onto that if I were you.");
                    /* [what if hero is already carrying enough candles?
                       should Izchak explain how to attach them instead?] */
                    if (obj.spe < 7) {
                        ;
                        verbalize("You'll need %d%s candle%s to go along with it.", (7 - obj.spe), (obj.spe > 0) ? " more" : "", (((7 - obj.spe) == 1) ? "" : "s"));
                    }
                }
            } else {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                    ;
                    verbalize("I won't stock that.  Take it out of here!");
                } else {
                    pline("%s shakes %s %s in refusal.", Shknam(shkp), (genders[pronoun_gender(shkp, (1 | 2))].his), mbodypart(shkp, HEAD));
                }
            }
        }
        return (1);
    }
    return (0);
}
/* calculate how much the shk will pay when buying [all of] an object */
export function set_cost(obj, shkp) {
    let tmp = 0;
    let unit_price = getprice(obj, (1));
    let multiplier = 1;
    let divisor = 1;
    tmp = get_pricing_units(obj) * unit_price;
    if (game.uarmh && game.uarmh.otyp == DUNCE_CAP) {
        divisor *= 3;
    } else if (((game.urole.mnum == (PM_TOURIST)) && game.u.ulevel < (Math.trunc(30 / 2))) || (game.uarmu && !game.uarm && !game.uarmc)) {
        divisor *= 3;
    } else {
        divisor *= 2;
    }
    if (!obj.dknown || !game.objects[obj.otyp].oc_name_known) {
        if (obj.oclass == GEM_CLASS) {
            if (game.objects[obj.otyp].oc_material == GEMSTONE || game.objects[obj.otyp].oc_material == GLASS) {
                /* different shop keepers give different prices */
                tmp = ((obj.otyp - FIRST_REAL_GEM) % (6 - shkp.m_id % 3));
                tmp = (tmp + 3) * obj.quan;
                divisor = 1;
            }
        } else if (tmp > 1 && !(shkp.m_id % 4)) {
            multiplier *= 3 , divisor *= 4;
        }
    }
    if (tmp >= 1) {
        tmp *= multiplier;
        if (divisor > 1) {
            tmp *= 10;
            tmp = Math.trunc(tmp / divisor);
            tmp += 5;
            tmp = Math.trunc(tmp / 10);
        }
        /* avoid adjusting nonzero to zero */
        if (tmp < 1) {
            tmp = 1;
        }
    }
    return tmp;
}
/* unlike alter_cost() which operates on a specific item, identifying or
   forgetting a gem causes all unpaid gems of its type to change value */
export function gem_learned(oindx) {
    let obj = null;
    let shkp = null;
    let bp = null;
    let ct = 0;
    for (shkp = next_shkp(game.level.monlist, (1)); shkp; shkp = next_shkp(shkp.nmon, (1))) {
        /*
     * Unfortunately, shop bill doesn't have object type included,
     * just obj->oid for each unpaid stack, so we have to go through
     * every bill and every item on that bill and match up against
     * every unpaid stack on the level....
     *
     * Fortunately, there's no need to catch up when changing dungeon
     * levels even if we ID'd or forget some gems while gone from a
     * level.  There won't be any shop bills when arriving; they were
     * either paid before leaving or got treated as robbery and it's
     * too late to adjust pricing.
     */
        ct = ((shkp).mextra.eshk).billct;
        bp = ((shkp).mextra.eshk).bill_p;
        const __nhi_bp_arr = bp;
        for (let __nhi_bp = 0; (bp = __nhi_bp_arr[__nhi_bp]) && (--ct >= 0); __nhi_bp++) {
            obj = find_oid(bp.bo_id);
            if (!obj) {
                continue;
            }
            if ((oindx != STRANGE_OBJECT) ? (obj.otyp == oindx) : (obj.oclass == GEM_CLASS)) {
                bp.price = get_cost(obj, shkp);
            }
        }
    }
}
/* called when an item's value has been enhanced; if it happens to be
   on any shop bill, update that bill to reflect the new higher price
   [if the new price drops for some reason, keep the old one in place] */
/* if 0, use regular shop pricing, otherwise force amount;
                 if negative, use abs(amt) even if it's less than old cost */
export function alter_cost(obj, amt) {
    let bp = null;
    let shkp = null;
    let new_price = 0;
    for (shkp = next_shkp(game.level.monlist, (1)); shkp; shkp = next_shkp(shkp, (1))) {
        if ((bp = onbill(obj, shkp, (1))) != null) {
            new_price = !amt ? get_cost(obj, shkp) : (amt < 0) ? -amt : amt;
            if (new_price > bp.price || amt < 0) {
                bp.price = new_price;
                update_inventory();
            }
            break;
        }
    }
    return;
}
/* called from doinv(invent.c) for inventory of unpaid objects */
/* known to be unpaid or contain unpaid */
/* COST_NOCONTENTS, COST_CONTENTS, or COST_SINGLEOBJ */
export function unpaid_cost(unp_obj, cost_type) {
    let bp = null;
    let shkp = null;
    let shop = null;
    let amt = 0;
    for (shop = game.u.ushops; __nh_char_at0(shop); (shop = __nh_advance_str(shop, 1))) {
        if ((shkp = shop_keeper(__nh_char_at0(shop))) != null) {
            if ((bp = onbill(unp_obj, shkp, (1)))) {
                /* if two shops share a wall, this might find wrong shk */
                /* didn't find shk?  try searching bills */
                amt = bp.price;
                if (cost_type != COST_SINGLEOBJ) {
                    /* use quan rather than get_pricing_units -- glob weight
                       should already be factored into bp->price */
                    amt *= unp_obj.quan;
                }
            }
            if (cost_type == COST_CONTENTS && ((unp_obj).cobj != null)) {
                amt = contained_cost(unp_obj, shkp, amt, (0), (1));
            }
            if (bp || (!unp_obj.unpaid && amt)) {
                break;
            }
        }
    }
    /* onbill() gave no message if unexpected problem occurred */
    if (!shkp || (unp_obj.unpaid && !bp)) {
        impossible("unpaid_cost: object wasn't on any bill.");
    }
    return amt;
}
/* add 'obj' to 'shkp's bill */
/* True: obj is used up so goes on bill differently */
export function add_one_tobill(obj, dummy, shkp) {
    let eshkp = null;
    let bp = null;
    let bct = 0;
    let unbilled = (0);
    eshkp = ((shkp).mextra.eshk);
    /* normally bill_p gets set up whenever you enter the shop, but obj
       might be going onto the bill because hero just snagged it with
       a grappling hook from outside without ever having been inside */
    if (!eshkp.bill_p) {
        eshkp.bill_p = eshkp.bill[0];
    }
    if (!billable({ get value() { return shkp; }, set value(_v) { shkp = _v; } }, obj, game.u.ushops, (1))) {
        unbilled = (1);
    } else if (eshkp.billct == 200) {
        /* shk's bill is completely full */
        You("got that for free!");
        unbilled = (1);
    }
    if (unbilled) {
        /* if not on any list (probably from bill_dummy_object() which creates
       a new OBJ_FREE object), don't leave unmanaged object hanging around */
        if (obj.where == 0) {
            dealloc_obj(obj);
        }
        return;
    }
    bct = eshkp.billct;
    bp = eshkp.bill_p[bct];
    bp.bo_id = obj.o_id;
    bp.bquan = obj.quan;
    if (dummy) {
        bp.useup = (1);
        add_to_billobjs(obj);
    } else {
        bp.useup = (0);
    }
    bp.price = get_cost(obj, shkp);
    if (obj.globby) {
        /* for globs, the amt charged for quan 1 depends on owt */
        bp.price *= get_pricing_units(obj);
        /* remember the weight this glob had when it was added to bill;
           glob oextra_owt field overlays corpse omid field */
        newomid(obj);
        ((obj).oextra.omid) = obj.owt;
    }
    eshkp.billct++;
    obj.unpaid = 1;
    record_price_quote(obj.otyp, bp.price, (1));
}
export function add_to_billobjs(obj) {
    if (obj.where != 0) {
        panic("add_to_billobjs: obj not free");
    }
    if (obj.timed) {
        obj_stop_timers(obj);
    }
    obj.nobj = game.billobjs;
    game.billobjs = obj;
    obj.where = 7;
    /* if hero drinks a shop-owned potion, it will have been flagged
       in_use by dodrink/dopotion but isn't being used up yet because
       it stays on the bill; only object sanity checking actually cares */
    obj.in_use = 0;
    /* ... same for bypass by destroy_items */
    obj.bypass = 0;
}
/* recursive billing of objects within containers. */
export function bill_box_content(obj, ininv, dummy, shkp) {
    let otmp = null;
    if (((obj).otyp == LARGE_BOX && (obj).spe == 1)) {
        return;
    }
    for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
        if (otmp.oclass == COIN_CLASS) {
            continue;
        }
        /* the "top" box is added in addtobill() */
        if (!otmp.no_charge) {
            add_one_tobill(otmp, dummy, shkp);
        }
        if (((otmp).cobj != null)) {
            bill_box_content(otmp, ininv, dummy, shkp);
        }
    }
}
/* shopkeeper tells you what you bought or sold, sometimes partly IDing it */
/* "%s %ld %s %s", doname(obj), amt, plur(amt), arg */
export function shk_names_obj(shkp, obj, fmt, amt, arg) {
    let obj_name = null;
    let fmtbuf = '';
    let was_unknown = !obj.dknown;
    observe_object(obj);
    if (!game.objects[obj.otyp].oc_magic && saleable(shkp, obj) && (obj.oclass == WEAPON_CLASS || obj.oclass == ARMOR_CLASS || obj.oclass == SCROLL_CLASS || obj.oclass == SPBOOK_CLASS || obj.otyp == MIRROR)) {
        /* Use real name for ordinary weapons/armor, and spell-less
     * scrolls/books (that is, blank and mail), but only if the
     * object is within the shk's area of interest/expertise.
     */
        was_unknown |= !game.objects[obj.otyp].oc_name_known;
        discover_object((obj.otyp), (1), (1), (1));
    }
    obj_name = paydoname(obj);
    if (was_unknown) {
        fmtbuf = sprintf(fmtbuf, "%%s; you %s", fmt);
        /* Use an alternate message when extra information is being provided */
        obj_name = (() => { const __s = obj_name; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
        pline(fmtbuf, obj_name, (obj.quan > 1) ? "them" : "it", amt, (((amt) == 1) ? "" : "s"), arg);
    } else {
        You(fmt, obj_name, amt, (((amt) == 1) ? "" : "s"), arg);
    }
}
/* decide whether a shopkeeper thinks an item belongs to her */
/* in: non-null if shk has been validated;
                           * out: shk */
export function billable(shkpp, obj, roomno, reset_nocharge) {
    let shkp = shkpp.value;
    if (!shkp) {
        /* if caller hasn't supplied a shopkeeper, look one up now */
        if (!roomno) {
            return (0);
        }
        shkp = shop_keeper(roomno);
        if (!shkp || !inhishop(shkp)) {
            return (0);
        }
        shkpp.value = shkp;
    }
    /* perhaps we threw it away earlier */
    if (onbill(obj, shkp, (0)) || (obj.oclass == FOOD_CLASS && obj.oeaten)) {
        return (0);
    }
    if (obj.no_charge) {
        /* outer container might be marked no_charge but still have contents
       which should be charged for; clear no_charge when picking things up */
        if (!((obj).cobj != null) || (contained_gold(obj, (1)) == 0 && contained_cost(obj, shkp, 0, (0), !reset_nocharge) == 0)) {
            shkp = null;
        }
        if (reset_nocharge && !shkp && obj.oclass != COIN_CLASS) {
            obj.no_charge = 0;
            if (((obj).cobj != null)) {
                /* reset contained obj->no_charge */
                picked_container(obj);
            }
        }
    }
    return shkp ? (1) : (0);
}
export function addtobill(obj, ininv, dummy, silent) {
    let shkp = null;
    let ltmp = 0;
    let cltmp = 0;
    let gltmp = 0;
    let contentscount = 0;
    let container = 0;
    if (!billable({ get value() { return shkp; }, set value(_v) { shkp = _v; } }, obj, game.u.ushops, (1))) {
        return;
    }
    if (obj.oclass == COIN_CLASS) {
        costly_gold(obj.ox, obj.oy, obj.quan, silent);
        return;
    } else if (((shkp).mextra.eshk).billct == 200) {
        if (!silent) {
            You("got that for free!");
        }
        return;
    }
    ltmp = cltmp = gltmp = 0;
    container = ((obj).cobj != null);
    if (!obj.no_charge) {
        ltmp = get_cost(obj, shkp);
        if (obj.globby) {
            ltmp *= get_pricing_units(obj);
        }
    }
    if (obj.no_charge && !container) {
        obj.no_charge = 0;
        return;
    }
    if (container) {
        cltmp = contained_cost(obj, shkp, cltmp, (0), (0));
        gltmp = contained_gold(obj, (1));
        if (ltmp) {
            add_one_tobill(obj, dummy, shkp);
        }
        if (cltmp) {
            bill_box_content(obj, ininv, dummy, shkp);
        }
        picked_container(obj);
        ltmp += cltmp;
        if (gltmp) {
            costly_gold(obj.ox, obj.oy, gltmp, silent);
            if (!ltmp) {
                return;
            }
        }
        if (obj.no_charge) {
            obj.no_charge = 0;
        }
        contentscount = count_unpaid(obj.cobj);
    } else {
        add_one_tobill(obj, dummy, shkp);
        contentscount = 0;
    }
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL) && !silent) {
        let buf = '';
        if (!ltmp) {
            /* no need to update price quotes here; it was done by
           add_one_tobill above */
            pline("%s has no interest in %s.", Shknam(shkp), the(xname(obj)));
            return;
        }
        if (!ininv) {
            pline("%s will cost you %ld %s%s.", The(xname(obj)), ltmp, currency(ltmp), (obj.quan > 1) ? " each" : "");
        } else {
            let save_quan = obj.quan;
            buf = strcpy(buf, "\"For you,");
            if ((!((shkp).mpeaceful))) {
                buf = strcat(buf, " scum;");
            } else if (!((shkp).mextra.eshk).surcharge) {
                buf = strcat(buf, " ");
                append_honorific(buf);
                buf = strcat(buf, "; only");
            }
            /* fool xname() into giving singular */
            obj.quan = 1;
            set_voice(shkp, 0, 80, 0);
            pline("%s %ld %s %s %s%s.\"", buf, ltmp, currency(ltmp), (save_quan > 1) ? "per" : (contentscount && !obj.unpaid) ? "for the contents of this" : "for this", xname(obj), (contentscount && obj.unpaid) ? and_its_contents : "");
            obj.quan = save_quan;
        }
    } else if (!silent) {
        if (ltmp) {
            set_voice(shkp, 0, 80, 0);
            pline_The("list price of %s%s%s is %ld %s%s.", (contentscount && !obj.unpaid) ? the_contents_of : "", the(xname(obj)), (contentscount && obj.unpaid) ? and_its_contents : "", ltmp, currency(ltmp), (obj.quan > 1) ? " each" : "");
        } else {
            pline("%s does not notice.", Shknam(shkp));
        }
    }
}
const __append_honorific_honored = ["good", "honored", "most gracious", "esteemed", "most renowned and sacred"];
export function append_honorific(buf) {
    buf = strcat(buf, __append_honorific_honored[rn2((Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */)) - 1) + game.u.uevent.udemigod]);
    /* (chooses among [0]..[3] normally; [1]..[4] after the
       Wizard has been killed or invocation ritual performed) */
    if (((game.youmonst.data).mlet == S_VAMPIRE)) {
        buf = strcat(buf, (game.flags.female) ? " dark lady" : " dark lord");
    } else if (((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 16) != 0)) : ((game.urace.mnum == (PM_ELF))))) {
        buf = strcat(buf, (game.flags.female) ? " hiril" : " hir");
    } else {
        buf = strcat(buf, !(((game.youmonst.data).mflags2 & 8) != 0) ? " creature" : (game.flags.female) ? " lady" : " sir");
    }
}
export function splitbill(obj, otmp) {
    let bp = null;
    let tmp = 0;
    let shkp = shop_keeper(game.u.ushops);
    if (!shkp || !inhishop(shkp)) {
        impossible("splitbill: no resident shopkeeper??");
        return;
    }
    bp = onbill(obj, shkp, (0));
    if (!bp) {
        impossible("splitbill: not on bill?");
        return;
    }
    if (bp.bquan < otmp.quan) {
        impossible("Negative quantity on bill??");
    }
    if (bp.bquan == otmp.quan) {
        impossible("Zero quantity on bill??");
    }
    bp.bquan -= otmp.quan;
    if (((shkp).mextra.eshk).billct == 200) {
        otmp.unpaid = 0;
    } else {
        tmp = bp.price;
        bp = (((shkp).mextra.eshk).bill_p[((shkp).mextra.eshk).billct]);
        bp.bo_id = otmp.o_id;
        bp.bquan = otmp.quan;
        bp.useup = (0);
        bp.price = tmp;
        ((shkp).mextra.eshk).billct++;
    }
}
export function sub_one_frombill(obj, shkp) {
    let bp = null;
    let eshkp = null;
    if ((bp = onbill(obj, shkp, (0))) != null) {
        let otmp = null;
        obj.unpaid = 0;
        if (bp.bquan > obj.quan) {
            otmp = Object.assign(alloc(1), { nobj: null, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null });
            Object.assign(otmp, obj);
            otmp.v = { v_nexthere: obj.v?.v_nexthere ?? null, v_ocontainer: obj.v?.v_ocontainer ?? null, v_ocarry: obj.v?.v_ocarry ?? null };
            otmp.oextra = null;
            bp.bo_id = otmp.o_id = next_ident();
            otmp.where = 0;
            otmp.quan = (bp.bquan -= obj.quan);
            otmp.owt = 0;
            bp.useup = (1);
            add_to_billobjs(otmp);
            return;
        }
        eshkp = ((shkp).mextra.eshk);
        eshkp.billct--;
        Object.assign(bp, eshkp.bill_p[eshkp.billct]);
        return;
    } else if (obj.unpaid) {
        impossible("sub_one_frombill: unpaid object not on bill");
        obj.unpaid = 0;
    }
}
/* recursive check of unpaid objects within nested containers. */
export function subfrombill(obj, shkp) {
    let otmp = null;
    sub_one_frombill(obj, shkp);
    if (((obj).cobj != null)) {
        for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
            if (otmp.oclass == COIN_CLASS) {
                continue;
            }
            if (((otmp).cobj != null)) {
                subfrombill(otmp, shkp);
            } else {
                sub_one_frombill(otmp, shkp);
            }
        }
    }
}
export function stolen_container(obj, shkp, price, ininv) {
    let otmp = null;
    let bp = null;
    let billamt = 0;
    for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
        if (otmp.oclass == COIN_CLASS) {
            continue;
        }
        billamt = 0;
        if (!billable({ get value() { return shkp; }, set value(_v) { shkp = _v; } }, otmp, ((shkp).mextra.eshk).shoproom, (1))) {
            /* billable() returns false for objects already on bill */
            if ((bp = onbill(otmp, shkp, (0))) == null) {
                continue;
            }
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            /* onbill() found shkp so it's not Null */
            /* this assumes that we're being called by stolen_value()
               (or by a recursive call to self on behalf of it) where
               the cost of this object is about to be added to shop
               debt in place of having it remain on the current bill */
            /* things already on the bill yield a not-billable result, so
           we need to check bill before deciding that shk doesn't care */
            /* shk does care; take obj off bill to avoid double billing */
            billamt = bp.bquan * bp.price;
            sub_one_frombill(otmp, shkp);
        }
        if (billamt) {
            price += billamt;
        } else if (ininv ? otmp.unpaid : !otmp.no_charge) {
            price += get_pricing_units(otmp) * get_cost(otmp, shkp);
        }
        if (((otmp).cobj != null)) {
            price = stolen_container(otmp, shkp, price, ininv);
        }
    }
    return price;
}
export function stolen_value(obj, x, y, peaceful, silent) {
    let value = 0;
    let gvalue = 0;
    let billamt = 0;
    let roomno = 0;
    let bp = null;
    let shkp = null;
    let was_unpaid = 0;
    let c_count = 0;
    let u_count = 0;
    if ((shkp = find_objowner(obj, x, y)) != null) {
        roomno = ((shkp).mextra.eshk).shoproom;
    } else {
        roomno = in_rooms(x, y, SHOPBASE);
    }
    /* gather information for message(s) prior to manipulating bill */
    was_unpaid = obj.unpaid ? (1) : (0);
    if (((obj).cobj != null)) {
        c_count = count_contents(obj, (1), (0), (1), (0));
        u_count = count_contents(obj, (1), (0), (0), (0));
    }
    shkp = null;
    if (!billable({ get value() { return shkp; }, set value(_v) { shkp = _v; } }, obj, roomno, (1))) {
        if ((bp = onbill(obj, shkp, (0))) != null) {
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            billamt = bp.bquan * bp.price;
            sub_one_frombill(obj, shkp);
        }
        if (!bp && !u_count) {
            return 0;
        }
    }
    if (obj.oclass == COIN_CLASS) {
        gvalue += obj.quan;
    } else {
        if (billamt) {
            value += billamt;
        } else if (!obj.no_charge) {
            value += get_pricing_units(obj) * get_cost(obj, shkp);
        }
        if (((obj).cobj != null)) {
            let ininv = (obj.where == 3 || obj.where == 0);
            value += stolen_container(obj, shkp, 0, ininv);
            if (!ininv) {
                gvalue += contained_gold(obj, (1));
            }
        }
    }
    if (gvalue + value == 0) {
        return 0;
    }
    value += gvalue;
    if (peaceful) {
        let credit_use = !!((shkp).mextra.eshk).credit;
        value = check_credit(value, shkp);
        /* 'peaceful' affects general treatment, but doesn't affect
         * the fact that other code expects that all charges after the
         * shopkeeper is angry are included in robbed, not debit */
        if ((!((shkp).mpeaceful))) {
            ((shkp).mextra.eshk).robbed += value;
        } else {
            ((shkp).mextra.eshk).debit += value;
        }
        if (!silent) {
            let buf = '';
            let still = "";
            if (credit_use) {
                if (((shkp).mextra.eshk).credit) {
                    You("have %ld %s credit remaining.", ((shkp).mextra.eshk).credit, currency(((shkp).mextra.eshk).credit));
                    return value;
                } else if (!value) {
                    You("have no credit remaining.");
                    return 0;
                }
                still = "still ";
            }
            buf = sprintf(buf, "%sowe %s %ld %s", still, shkname(shkp), value, currency(value));
            /* u_count > 0 implies Has_contents(obj) */
            if (u_count) {
                buf = __nh_buf_append(buf, sprintf('', " for %s%sits contents", was_unpaid ? "it and " : "", (c_count > u_count) ? "some of " : ""));
            } else if (obj.oclass != COIN_CLASS) {
                buf = __nh_buf_append(buf, sprintf('', " for %s", (obj.quan > 1) ? "them" : "it"));
            }
            /* "You owe <shk> N zorkmids for it!" */
            You("%s!", buf);
        }
    } else {
        ((shkp).mextra.eshk).robbed += value;
        if (!silent) {
            if (canseemon(shkp)) {
                Norep("%s booms: \"%s, you are a thief!\"", Shknam(shkp), game.plname);
            } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                Norep("You hear a scream, \"Thief!\"");
            }
        }
        /* if the shk is already on the war path, be sure it's all out */
        hot_pursuit(shkp);
        angry_guards((0));
    }
    return value;
}
/* opposite of costly_gold(); hero has dropped gold in a shop;
   called from sellobj(); ought to be called from subfrombill() too */
/* T: dropped in shop; F: kicked and landed in shop */
export function donate_gold(gltmp, shkp, selling) {
    let eshkp = ((shkp).mextra.eshk);
    if (eshkp.debit >= gltmp) {
        if (eshkp.loan) {
            if (eshkp.loan > gltmp) {
                eshkp.loan -= gltmp;
            } else {
                eshkp.loan = 0;
            }
        }
        eshkp.debit -= gltmp;
        Your("debt is %spaid off.", eshkp.debit ? "partially " : "");
    } else {
        let delta = gltmp - eshkp.debit;
        eshkp.credit += delta;
        if (eshkp.debit) {
            eshkp.debit = 0;
            eshkp.loan = 0;
            Your("debt is paid off.");
        }
        if (eshkp.credit == delta) {
            You("have %sestablished %ld %s credit.", !selling ? "re-" : "", delta, currency(delta));
        } else {
            pline("%ld %s added%s to your credit; total is now %ld %s.", delta, currency(delta), !selling ? " back" : "", eshkp.credit, currency(eshkp.credit));
        }
    }
}
export function sellobj_state(deliberate) {
    /* If we're deliberately dropping something, there's no automatic
       response to the shopkeeper's "want to sell" query; however, if we
       accidentally drop anything, the shk will buy it/them without asking.
       This retains the old pre-query risk that slippery fingers while in
       shops entailed:  you drop it, you've lost it.
     */
    game.sell_response = (deliberate != (0)) ? 0 : 97;
    game.sell_how = deliberate;
    game.auto_credit = (0);
}
export function sellobj(obj, x, y) {
    let shkp = null;
    let eshkp = null;
    let ltmp = 0;
    let cltmp = 0;
    let gltmp = 0;
    let offer = 0;
    let shkmoney = 0;
    let saleitem = 0;
    let cgold = (0);
    let container = ((obj).cobj != null);
    let isgold = (obj.oclass == COIN_CLASS);
    let only_partially_your_contents = (0);
    /* do cheapest exclusion test first */
    if (!game.u.ushops) {
        return;
    }
    shkp = shop_keeper(in_rooms(x, y, SHOPBASE));
    if (!shkp || !inhishop(shkp)) {
        return;
    }
    if (!costly_spot(x, y)) {
        return;
    }
    if (obj.unpaid && !container && !isgold) {
        sub_one_frombill(obj, shkp);
        return;
    }
    if (container) {
        /* find the price of content before subfrombill */
        cltmp = contained_cost(obj, shkp, cltmp, (1), (0));
        /* find the value of contained gold */
        gltmp += contained_gold(obj, (1));
        cgold = (gltmp > 0);
    }
    saleitem = saleable(shkp, obj);
    if (!isgold && !obj.unpaid && saleitem) {
        ltmp = set_cost(obj, shkp);
    }
    offer = ltmp + cltmp;
    rouse_shk(shkp, (1));
    eshkp = ((shkp).mextra.eshk);
    if ((!((shkp).mpeaceful))) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            ;
            /* they become shop-objects, no pay */
            verbalize("Thank you, scum!");
        } else {
            pline("%s smirks with satisfaction.", Shknam(shkp));
        }
        subfrombill(obj, shkp);
        return;
    }
    if (!(isgold || cgold) && ((offer + gltmp) == 0 || game.sell_how == (2))) {
        /* get one case out of the way: nothing to sell, and no gold */
        let unpaid = is_unpaid(obj);
        if (container) {
            dropped_container(obj, shkp, (0));
            if (!obj.unpaid) {
                obj.no_charge = 1;
            }
            if (unpaid) {
                subfrombill(obj, shkp);
            }
        } else {
            obj.no_charge = 1;
        }
        if (!unpaid && (game.sell_how != (2)) && !special_stock(obj, shkp, (0))) {
            pline("%s seems uninterested.", Shknam(shkp));
        }
        return;
    }
    if (eshkp.robbed) {
        /* bones; shop robbed by previous customer */
        if (isgold) {
            offer = obj.quan;
        } else if (cgold) {
            offer += cgold;
        }
        if ((eshkp.robbed -= offer < 0)) {
            eshkp.robbed = 0;
        }
        if (offer && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            ;
            verbalize("Thank you for your contribution to restock this recently plundered shop.");
        }
        subfrombill(obj, shkp);
        return;
    }
    if (isgold || cgold) {
        if (!cgold) {
            gltmp = obj.quan;
        }
        donate_gold(gltmp, shkp, (1));
        if (!offer || game.sell_how == (2)) {
            if (!isgold) {
                if (container) {
                    dropped_container(obj, shkp, (0));
                }
                if (!obj.unpaid) {
                    obj.no_charge = 1;
                }
                subfrombill(obj, shkp);
            }
            return;
        }
    }
    if ((!saleitem && !(container && cltmp > 0)) || eshkp.billct == 200 || obj.oclass == BALL_CLASS || obj.oclass == CHAIN_CLASS || offer == 0 || (obj.oclass == FOOD_CLASS && obj.oeaten) || ((obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE) && obj.age < 20 * game.objects[obj.otyp].oc_cost)) {
        pline("%s seems uninterested%s.", Shknam(shkp), cgold ? " in the rest" : "");
        if (container) {
            dropped_container(obj, shkp, (0));
        }
        obj.no_charge = 1;
        return;
    }
    shkmoney = money_cnt(shkp.minvent);
    if (!shkmoney) {
        let c = 0;
        let qbuf = '';
        let tmpcr = (Math.trunc((offer * 9) / 10)) + (offer <= 1);
        if (game.sell_how == (0) || game.auto_credit) {
            c = game.sell_response = 121;
        } else if (game.sell_response != 110) {
            pline("%s cannot pay you at present.", Shknam(shkp));
            qbuf = sprintf(qbuf, "Will you accept %ld %s in credit for ", tmpcr, currency(tmpcr));
            record_price_quote(obj.otyp, Math.trunc(tmpcr / obj.quan), (0));
            c = yn_function(safe_qbuf(qbuf, qbuf, "?", obj, doname, thesimpleoname, (obj.quan == 1) ? "that" : "those"), ynaqchars, 121, (1));
            if (c == 97) {
                c = 121;
                game.auto_credit = (1);
            }
        /* previously specified "quit" */
        } else {
            c = 110;
        }
        if (c == 121) {
            shk_names_obj(shkp, obj, ((game.sell_how != (0)) ? "traded %s for %ld zorkmid%s in %scredit." : "relinquish %s and acquire %ld zorkmid%s in %scredit."), tmpcr, (eshkp.credit > 0) ? "additional " : "");
            eshkp.credit += tmpcr;
            if (container) {
                dropped_container(obj, shkp, (1));
            }
            subfrombill(obj, shkp);
        } else {
            if (c == 113) {
                game.sell_response = 110;
            }
            if (container) {
                dropped_container(obj, shkp, (0));
            }
            if (!obj.unpaid) {
                obj.no_charge = 1;
            }
            subfrombill(obj, shkp);
        }
    } else {
        let qbuf = '';
        let qsfx = '';
        let short_funds = (offer > shkmoney);
        let one = 0;
        if (short_funds) {
            offer = shkmoney;
        }
        if (!game.sell_response) {
            let yourc = 0;
            let shksc = 0;
            if (container) {
                /* number of items owned by shk */
                shksc = count_contents(obj, (1), (1), (0), (1));
                /* number of items owned by you (total - shksc) */
                yourc = count_contents(obj, (1), (1), (1), (1)) - shksc;
                only_partially_your_contents = shksc && yourc;
            }
            qbuf = sprintf(qbuf, "%s offers%s %ld gold piece%s for %s%s ", Shknam(shkp), short_funds ? " only" : "", offer, (((offer) == 1) ? "" : "s"), (cltmp && !ltmp) ? ((yourc == 1) ? "your item in " : "your items in ") : "", obj.unpaid ? "the" : "your");
            one = !ltmp ? (yourc == 1) : (obj.quan == 1 && !cltmp);
            qsfx = sprintf(qsfx, "%s.  Sell %s?", (cltmp && ltmp) ? (only_partially_your_contents ? ((yourc == 1) ? " and item inside" : " and items inside") : and_its_contents) : "", one ? "it" : "them");
            record_price_quote(obj.otyp, Math.trunc(offer / obj.quan), (0));
            safe_qbuf(qbuf, qbuf, qsfx, obj, xname, simpleonames, one ? "that" : "those");
        } else {
            qbuf = '';
        }
        switch (game.sell_response ? game.sell_response : yn_function(qbuf, ynaqchars, 110, (1))) {
            case 113:
                game.sell_response = 110;
                ;
            case 110:
                if (container) {
                    dropped_container(obj, shkp, (0));
                }
                if (!obj.unpaid) {
                    obj.no_charge = 1;
                }
                subfrombill(obj, shkp);
                break;
            case 97:
                game.sell_response = 121;
                ;
            case 121:
                if (container) {
                    dropped_container(obj, shkp, (1));
                }
                if (!obj.unpaid && !saleitem) {
                    obj.no_charge = 1;
                }
                subfrombill(obj, shkp);
                pay(-offer, shkp);
                shk_names_obj(shkp, obj, (game.sell_how != (0)) ? ((!ltmp && cltmp && only_partially_your_contents) ? "sold some items inside %s for %ld gold piece%s.%s" : "sold %s for %ld gold piece%s.%s") : "relinquish %s and receive %ld gold piece%s in compensation.%s", offer, "");
                break;
            default:
                impossible("invalid sell response");
        }
    }
}
/* 0: deliver count 1: paged */
export function doinvbill(mode) {
    let shkp = null;
    let eshkp = null;
    let bp = null;
    let end_bp = null;
    let obj = null;
    let totused = 0;
    let buf_p = null;
    let datawin = 0;
    quit: {
        shkp = shop_keeper(game.u.ushops);
        if (!shkp || !inhishop(shkp)) {
            if (mode != 0) {
                impossible("doinvbill: no shopkeeper?");
            }
            return 0;
        }
        eshkp = ((shkp).mextra.eshk);
        if (mode == 0) {
            /* count expended items, so that the `I' command can decide
           whether to include 'x' in its prompt string */
            let cnt = !eshkp.debit ? 0 : 1;
            for (let __nhi_bp = 0; __nhi_bp < eshkp.billct && (bp = eshkp.bill_p[__nhi_bp]); __nhi_bp++) {
                if (bp.useup || ((obj = bp_to_obj(bp)) != null && obj.quan < bp.bquan)) {
                    cnt++;
                }
            }
            return cnt;
        }
        datawin = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_putstr)(datawin, 0, "Unpaid articles already used up:");
        (game.windowprocs.win_putstr)(datawin, 0, "");
        totused = 0;
        for (let __nhi_bp = 0; __nhi_bp < eshkp.billct && (bp = eshkp.bill_p[__nhi_bp]); __nhi_bp++) {
            obj = bp_to_obj(bp);
            if (!obj) {
                impossible("Bad shopkeeper administration.");
                break quit;
            }
            if (bp.useup || bp.bquan > obj.quan) {
                let oquan = 0;
                let uquan = 0;
                let thisused = 0;
                oquan = obj.quan;
                uquan = (bp.useup ? bp.bquan : bp.bquan - oquan);
                thisused = bp.price * uquan;
                totused += thisused;
                /* suppress "(unpaid)" suffix */
                game.iflags.suppress_price++;
                /* Why 'x'?  To match `I x', more or less. */
                buf_p = xprname(obj, null, 120, (0), thisused, uquan);
                game.iflags.suppress_price--;
                (game.windowprocs.win_putstr)(datawin, 0, buf_p);
            }
        }
        if (eshkp.debit) {
            /* additional shop debt which has no itemization available */
            if (totused) {
                (game.windowprocs.win_putstr)(datawin, 0, "");
            }
            totused += eshkp.debit;
            buf_p = xprname(null, "usage charges and/or other fees", GOLD_SYM, (0), eshkp.debit, 0);
            (game.windowprocs.win_putstr)(datawin, 0, buf_p);
        }
        buf_p = xprname(null, "Total:", 42, (0), totused, 0);
        (game.windowprocs.win_putstr)(datawin, 0, "");
        (game.windowprocs.win_putstr)(datawin, 0, buf_p);
        (game.windowprocs.win_display_nhwindow)(datawin, (0));
    }
    (game.windowprocs.win_destroy_nhwindow)(datawin);
    return 0;
}
/* adjust tin, egg, or corpse price based on monster data */
export function corpsenm_price_adj(obj) {
    let val = 0;
    if ((obj.otyp == TIN || obj.otyp == EGG || obj.otyp == CORPSE) && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS)) {
        let i = 0;
        let tmp = 1;
        let ptr = game.mons[obj.corpsenm];
        let icost = [{ trinsic: FIRE_RES, cost: 2 }, { trinsic: SLEEP_RES, cost: 3 }, { trinsic: COLD_RES, cost: 2 }, { trinsic: DISINT_RES, cost: 5 }, { trinsic: SHOCK_RES, cost: 4 }, { trinsic: POISON_RES, cost: 2 }, { trinsic: ACID_RES, cost: 1 }, { trinsic: STONE_RES, cost: 3 }, { trinsic: TELEPORT, cost: 2 }, { trinsic: TELEPORT_CONTROL, cost: 3 }, { trinsic: TELEPAT, cost: 5 }];
        for (i = 0; i < (Math.trunc(11 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/shk.c:4284:9) [11]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/shk.c:4284:9)) */)); i++) {
            if (intrinsic_possible(icost[i].trinsic, ptr)) {
                tmp += icost[i].cost;
            }
        }
        if ((((ptr).geno & 4096) != 0)) {
            tmp += 50;
        }
        val = ((1) > (((ptr.mlevel - 1) * 2)) ? (1) : (((ptr.mlevel - 1) * 2)));
        if (obj.otyp == CORPSE) {
            val += ((1) > ((Math.trunc(ptr.cnutrit / 30))) ? (1) : ((Math.trunc(ptr.cnutrit / 30))));
        }
        val = val * tmp;
    }
    return val;
}
export function getprice(obj, shk_buying) {
    let tmp = game.objects[obj.otyp].oc_cost;
    if (obj.oartifact) {
        tmp = arti_cost(obj);
        if (shk_buying) {
            tmp = Math.trunc(tmp / 4);
        }
    }
    switch (obj.oclass) {
        case FOOD_CLASS:
            tmp += corpsenm_price_adj(obj);
            /* simpler hunger check, (2-4)*cost */
            if (game.u.uhs >= HUNGRY && !shk_buying) {
                tmp *= game.u.uhs;
            }
            if (obj.oeaten) {
                tmp = 0;
            }
            break;
        case WAND_CLASS:
            if (obj.spe == -1) {
                tmp = 0;
            }
            break;
        case POTION_CLASS:
            if (obj.otyp == POT_WATER && !obj.blessed && !obj.cursed) {
                tmp = 0;
            }
            break;
        case ARMOR_CLASS:
        case WEAPON_CLASS:
            if (obj.spe > 0) {
                tmp += 10 * obj.spe;
            }
            break;
        case TOOL_CLASS:
            if ((obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE) && obj.age < 20 * game.objects[obj.otyp].oc_cost) {
                /* No way to determine in advance how many charges will be
         * wasted.  So, arbitrarily, one half of the price per use.
         */
                tmp = Math.trunc(tmp / 2);
            }
            break;
    }
    return tmp;
}
/* shk catches thrown pick-axe */
export function shkcatch(obj, x, y) {
    let shkp = null;
    shkp = shop_keeper(inside_shop(x, y));
    if (!shkp || !inhishop(shkp)) {
        return null;
    }
    if (!((shkp).msleeping || !(shkp).mcanmove) && (game.u.ushops != ((shkp).mextra.eshk).shoproom || !inside_shop(game.u.ux, game.u.uy)) && dist2(shkp.mx, shkp.my, x, y) < 3 && (shkp.mx != x || shkp.my != y)) {
        if (mnearto(shkp, x, y, (1), 4) == 2 && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            ;
            /* if it is the shk's pos, you hit and anger him */
            verbalize("Out of my way, scum!");
        }
        /* If player saw damage, display walls post-repair as walls, not stone */
        if (((game.viz_array[y][x] & 2) != 0)) {
            pline("%s nimbly%s catches %s.", Shknam(shkp), (x == shkp.mx && y == shkp.my) ? "" : " reaches over and", the(xname(obj)));
            if (!(canseemon(shkp) || sensemon(shkp))) {
                map_invisible(x, y);
            }
            (game.windowprocs.win_delay_output)();
            (game.windowprocs.win_mark_synch)();
        }
        subfrombill(obj, shkp);
        mpickobj(shkp, obj);
        return shkp;
    }
    return null;
}
export function add_damage(x, y, cost) {
    let tmp_dam = null;
    let shops = null;
    if (((game.level.locations[x][y].typ) == DOOR)) {
        let mtmp = null;
        /* Don't schedule for repair unless it's a real shop entrance */
        for (shops = in_rooms(x, y, SHOPBASE); __nh_char_at0(shops); (shops = __nh_advance_str(shops, 1))) {
            if ((mtmp = shop_keeper(__nh_char_at0(shops))) != null && x == ((mtmp).mextra.eshk).shd.x && y == ((mtmp).mextra.eshk).shd.y) {
                break;
            }
        }
        if (!__nh_char_at0(shops)) {
            return;
        }
    }
    for (tmp_dam = game.level.damagelist; tmp_dam; tmp_dam = tmp_dam.next) {
        if (tmp_dam.place.x == x && tmp_dam.place.y == y) {
            tmp_dam.cost += cost;
            /* needed by pay_for_damage() */
            tmp_dam.when = game.moves;
            return;
        }
    }
    tmp_dam = alloc(1 /* sizeof(struct damage) */);
    memset(tmp_dam, 0, 1 /* sizeof(struct damage) */);
    tmp_dam.when = game.moves;
    tmp_dam.place.x = x;
    tmp_dam.place.y = y;
    tmp_dam.cost = cost;
    tmp_dam.typ = game.level.locations[x][y].typ;
    tmp_dam.flags = game.level.locations[x][y].flags;
    tmp_dam.next = game.level.damagelist;
    game.level.damagelist = tmp_dam;
    if (((game.viz_array[y][x] & 2) != 0)) {
        game.level.locations[x][y].seenv = (255);
    }
}
/* is shopkeeper impaired, so they cannot act? */
export function shk_impaired(shkp) {
    if (!shkp || !shkp.isshk || !inhishop(shkp)) {
        return (1);
    }
    if (((shkp).msleeping || !(shkp).mcanmove) || ((shkp).mextra.eshk).following) {
        return (1);
    }
    return (0);
}
/* is damage dam repairable by shopkeeper shkp? */
export function repairable_damage(dam, shkp) {
    let x = 0;
    let y = 0;
    let ttmp = null;
    let mtmp = null;
    if (!dam || shk_impaired(shkp)) {
        return (0);
    }
    x = dam.place.x;
    y = dam.place.y;
    if ((game.moves - dam.when) < 5) {
        return (0);
    }
    if (!((dam.typ) >= ROOM)) {
        /* is it a wall? don't fix if anyone is in the way */
        if ((((x) == game.u.ux && (y) == game.u.uy) && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) || (x == shkp.mx && y == shkp.my) || ((mtmp = (game.level.monsters[x][y])) != null && !(((mtmp.data).mflags1 & 8) != 0))) {
            return (0);
        }
    }
    /* is it a trap? don't fix if hero or monster is in it */
    ttmp = t_at(x, y);
    if (ttmp) {
        if (((x) == game.u.ux && (y) == game.u.uy)) {
            return (0);
        }
        if ((mtmp = (game.level.monsters[x][y])) != null && mtmp.mtrapped) {
            return (0);
        }
    }
    if (!strchr(in_rooms(x, y, SHOPBASE), ((shkp).mextra.eshk).shoproom)) {
        return (0);
    }
    return (1);
}
/* find any damage shopkeeper shkp could repair. returns NULL is none found */
export function find_damage(shkp) {
    let dam = game.level.damagelist;
    if (shk_impaired(shkp)) {
        return null;
    }
    while (dam) {
        if (repairable_damage(dam, shkp)) {
            return dam;
        }
        dam = dam.next;
    }
    return null;
}
export function discard_damage_struct(dam) {
    if (!dam) {
        return;
    }
    if (dam == game.level.damagelist) {
        game.level.damagelist = dam.next;
    } else {
        let prev = game.level.damagelist;
        while (prev && prev.next != dam) {
            prev = prev.next;
        }
        if (prev) {
            prev.next = dam.next;
        }
    }
    memset(dam, 0, 1 /* sizeof(struct damage) */);
    free(dam);
}
/* discard all damage structs owned by shopkeeper */
export function discard_damage_owned_by(shkp) {
    let dam = game.level.damagelist;
    let dam2 = null;
    let prevdam = null;
    while (dam) {
        let x = dam.place.x;
        let y = dam.place.y;
        if (strchr(in_rooms(x, y, SHOPBASE), ((shkp).mextra.eshk).shoproom)) {
            dam2 = dam.next;
            if (prevdam) {
                prevdam.next = dam2;
            }
            if (dam == game.level.damagelist) {
                game.level.damagelist = dam2;
            }
            memset(dam, 0, 1 /* sizeof(struct damage) */);
            free(dam) , dam = (null);
        } else {
            prevdam = dam;
            dam2 = dam.next;
        }
        dam = dam2;
    }
}
/* Shopkeeper tries to repair damage belonging to them */
export function shk_fixes_damage(shkp) {
    let dam = find_damage(shkp);
    let shk_closeby = 0;
    if (!dam) {
        return;
    }
    shk_closeby = (dist2(((shkp).mx), ((shkp).my), game.u.ux, game.u.uy) <= (Math.trunc(8 / 2)) * (Math.trunc(8 / 2)));
    if (canseemon(shkp)) {
        pline("%s whispers %s.", Shknam(shkp), shk_closeby ? "an incantation" : "something");
    } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && shk_closeby) {
        ;
        You_hear("someone muttering an incantation.");
    }
    repair_damage(shkp, dam, (0));
    discard_damage_struct(dam);
}
/* find eligible spots to move items from a gap in a shop's wall that is
   being repaired; this guarantees that items will end up inside shkp's
   shop (possibly in the "free spot" or even in doorway or an adjacent
   wall gap), but if they are in a gap in a wall shared by two shops
   they might have started in the other shop */
/* array of 9 uint8's */
export function litter_getpos(litter, x, y, shkp) {
    let i = 0;
    let ix = 0;
    let iy = 0;
    /* number of adjacent shop spots */
    let k = 0;
    memset(litter, 0, 9 * 1 /* sizeof(uint8) */);
    if (game.level.objects[x][y] && !((game.level.locations[x][y].typ) >= ROOM)) {
        for (i = 0; i < 9; i++) {
            ix = x + ((i % 3) - 1);
            iy = y + ((Math.trunc(i / 3)) - 1);
            if (i == 4 || !isok(ix, iy) || !((game.level.locations[ix][iy].typ) >= POOL)) {
                continue;
            }
            litter[i] = 2;
            if (inside_shop(ix, iy) == ((shkp).mextra.eshk).shoproom) {
                litter[i] |= 4;
                ++k;
            }
        }
    }
    return k;
}
/* move items from a gap in a shop's wall that is being repaired;
   litter[] guarantees that items will end up inside shkp's shop, but
   if the wall being repaired is shared by two shops the items might
   have started in the other shop */
export function litter_scatter(litter, x, y, shkp) {
    let otmp = null;
{
        if ((game.uball != null) && !game.u.uswallow && ((game.uchain.ox == x && game.uchain.oy == y) || (game.uball.where == 1 && game.uball.ox == x && game.uball.oy == y))) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                ;
                /* placement below assumes there is always at least one adjacent spot
       that's inside the shop; caller guarantees that */
                /* Scatter objects haphazardly into the shop */
                /*
             * Either the ball or chain is in the repair location.
             * Take the easy way out and put ball&chain under hero.
             *
             * FIXME: message should be reworded; this might be the
             * shop's doorway rather than a wall, there might be some
             * other stuff here which isn't junk, and "your junk" has
             * a slang connotation which could be applicable if hero
             * has Passes_walls ability.
             */
                verbalize("Get your junk out of my wall!");
            }
            unplacebc();
            placebc();
        }
        while ((otmp = game.level.objects[x][y]) != null) {
            if (otmp.otyp == BOULDER || otmp.otyp == ROCK) {
                /* Don't mess w/ boulders -- just merge into wall */
                obj_extract_self(otmp);
                obfree(otmp, null);
            } else {
                let trylimit = 10;
                let i = rn2(9);
                let ix = 0;
                let iy = 0;
                /* otmp must be moved otherwise svl.level.objects[x][y] will
                   never become Null and while-loop won't terminate */
                do {
                    i = (i + 1) % 9;
                } while (--trylimit && !(litter[i] & 4));
                if ((litter[i] & (2 | 4)) != 0) {
                    ix = x + ((i % 3) - 1);
                    iy = y + ((Math.trunc(i / 3)) - 1);
                } else {
                    /* we know shk isn't at <x,y> because repair
                       is deferred in that situation */
                    ix = shkp.mx;
                    iy = shkp.my;
                }
                if (otmp.unpaid) {
                    /* if the wall being repaired is shared by two adjacent
                   shops, <ix,iy> might be in a different shop than the
                   one that is billing for otmp or decided it was free;
                   control of the item goes to the shk repairing the wall
                   but otmp->no_charge isn't recalculated for new shop */
                    let oshk = shkp;
                    /* !costly_spot() happens if otmp is moved from wall
                       to shop's "free spot", still costly_adjacent() and
                       still unpaid/on-bill; otherwise, it is being moved
                       all the way into the shop so take it off the bill */
                    if (costly_spot(ix, iy) && ((onbill(otmp, oshk, (1)) || ((oshk = find_objowner(otmp, ix, iy)) != null && onbill(otmp, oshk, (0)))))) {
                        subfrombill(otmp, oshk);
                    }
                }
                if (otmp.no_charge) {
                    /* not strictly necessary; destination is inside a
                       shop so existing no_charge remains relevant */
                    if (!costly_spot(ix, iy) && !costly_adjacent(shkp, ix, iy)) {
                        otmp.no_charge = 0;
                    }
                }
                remove_object(otmp);
                place_object(otmp, ix, iy);
                litter[i] |= 1;
            }
        }
    }
}
export function litter_newsyms(litter, x, y) {
    let i = 0;
    for (i = 0; i < 9; i++) {
        if (litter[i] & 1) {
            newsym(x + ((i % 3) - 1), y + ((Math.trunc(i / 3)) - 1));
        }
    }
}
/*
 * 0: repair postponed, 1: silent repair (no messages), 2: normal repair
 * 3: untrap
 */
export function repair_damage(shkp, tmp_dam, catchup) {
    let x = 0;
    let y = 0;
    let litter = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let otmp = null;
    let ttmp = null;
    let disposition = 1;
    let seeit = 0;
    let stop_picking = (0);
    if (!repairable_damage(tmp_dam, shkp)) {
        return 0;
    }
    x = tmp_dam.place.x;
    y = tmp_dam.place.y;
    seeit = ((game.viz_array[y][x] & 2) != 0);
    ttmp = t_at(x, y);
    if (ttmp) {
        switch (ttmp.ttyp) {
            case LANDMINE:
            case BEAR_TRAP:
                otmp = mksobj((ttmp.ttyp == LANDMINE) ? LAND_MINE : BEARTRAP, (1), (0));
                otmp.quan = 1;
                otmp.owt = weight(otmp);
                if (!catchup) {
                    if (canseemon(shkp) && dist2(x, y, shkp.mx, shkp.my) <= 2) {
                        pline("%s untraps %s.", Shknam(shkp), ansimpleoname(otmp));
                    } else if (ttmp.tseen && ((game.viz_array[ttmp.ty][ttmp.tx] & 2) != 0)) {
                        pline("The %s vanishes.", trapname(ttmp.ttyp, (1)));
                    }
                }
                mpickobj(shkp, otmp);
                break;
            case HOLE:
            case PIT:
            case SPIKED_PIT:
                if (!catchup && ttmp.tseen && ((game.viz_array[ttmp.ty][ttmp.tx] & 2) != 0)) {
                    pline("The %s is filled in.", trapname(ttmp.ttyp, (1)));
                }
                break;
            default:
                if (!catchup && ttmp.tseen && ((game.viz_array[ttmp.ty][ttmp.tx] & 2) != 0)) {
                    pline("The %s vanishes.", trapname(ttmp.ttyp, (1)));
                }
                break;
        }
        deltrap(ttmp);
        del_engr_at(x, y);
        if (seeit) {
            newsym(x, y);
        }
        if (!catchup) {
            disposition = 3;
        }
    }
    if (((tmp_dam.typ) >= ROOM) || (tmp_dam.typ == game.level.locations[x][y].typ && (!((tmp_dam.typ) == DOOR) || game.level.locations[x][y].flags > 1))) {
        return disposition;
    }
    if (closed_door(x, y)) {
        stop_picking = picking_at(x, y);
    }
    game.level.locations[x][y].typ = tmp_dam.typ;
    /* door or wall repair; trap, if any, is now gone;
       restore original terrain type and move any items away;
       rm.doormask and rm.wall_info are both overlaid on rm.flags
       so the new flags value needs to match the restored typ */
    if (((tmp_dam.typ) == DOOR)) {
        game.level.locations[x][y].flags = 4;
    } else {
        game.level.locations[x][y].flags = tmp_dam.flags;
    }
    if (litter_getpos(litter, x, y, shkp)) {
        litter_scatter(litter, x, y, shkp);
    }
    del_engr_at(x, y);
    /* needed if hero has line-of-sight to the former gap from outside
       the shop but is farther than one step away; once the light inside
       the shop is blocked, the other newsym() below won't redraw the
       spot showing its repaired wall */
    if (seeit) {
        newsym(x, y);
    }
    block_point(x, y);
    if (catchup) {
        return 1;
    }
    if (seeit) {
        /* no terrain fix necessary (trap removal or manually repaired) */
        if (((tmp_dam.typ) && (tmp_dam.typ) <= DBWALL)) {
            game.level.locations[x][y].seenv = (255);
            /* not a door; set rm.wall_info or whatever old flags are relevant */
            /* repair occurred while off level so no messages */
            /* player sees actual repair process, so KNOWS it's a wall */
            pline("Suddenly, a section of the wall closes up!");
        } else if (((tmp_dam.typ) == DOOR)) {
            pline("Suddenly, the shop door reappears!");
        }
        newsym(x, y);
    } else if (((tmp_dam.typ) && (tmp_dam.typ) <= DBWALL)) {
        if (inside_shop(game.u.ux, game.u.uy) == ((shkp).mextra.eshk).shoproom) {
            You_feel("more claustrophobic than before.");
        } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !rn2(10)) {
            Norep("The dungeon acoustics noticeably change.");
        }
    }
    if (stop_picking) {
        stop_occupation();
    }
    litter_newsyms(litter, x, y);
    if (disposition < 3) {
        disposition = 2;
    }
    return disposition;
}
/* normally repair is done when a shopkeeper moves, but we also try to
   catch up for lost time when reloading a previously visited level */
export function fix_shop_damage() {
    let shkp = null;
    let damg = null;
    let nextdamg = null;
    /* if this level has no shop damage, there's nothing to do */
    if (!game.level.damagelist) {
        return;
    }
    for (shkp = next_shkp(game.level.monlist, (0)); shkp; shkp = next_shkp(shkp.nmon, (0))) {
        /* go through all shopkeepers on the level */
        /* if this shopkeeper isn't in his shop or can't move, skip */
        if (shk_impaired(shkp)) {
            continue;
        }
        for (damg = game.level.damagelist; damg; damg = nextdamg) {
            /* go through all damage data trying to have this shopkeeper
           fix it; repair_damage() will only make repairs for damage
           matching shop controlled by specified shopkeeper */
            nextdamg = damg.next;
            if (repair_damage(shkp, damg, (1))) {
                discard_damage_struct(damg);
            }
        }
    }
}
/*
 * shk_move: return 1: moved  0: didn't  -1: let m_move do it  -2: died
 */
export function shk_move(shkp) {
    let gtx = 0;
    let gty = 0;
    let omx = 0;
    let omy = 0;
    let udist = 0;
    let appr = 0;
    let eshkp = ((shkp).mextra.eshk);
    let z = 0;
    let uondoor = (0);
    let satdoor = 0;
    let avoid = (0);
    let badinv = 0;
    omx = shkp.mx;
    omy = shkp.my;
    if (inhishop(shkp)) {
        shk_fixes_damage(shkp);
    }
    if ((udist = dist2((omx), (omy), game.u.ux, game.u.uy)) < 3 && (shkp.data != game.mons[PM_GRID_BUG] || (omx == game.u.ux || omy == game.u.uy))) {
        if ((!((shkp).mpeaceful)) || ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !resist_conflict(shkp))) {
            if ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic)) {
                Your("displaced image doesn't fool %s!", shkname(shkp));
            }
            mattacku(shkp);
            return 0;
        }
        if (eshkp.following) {
            if (strncmp(eshkp.customer, game.plname, 32)) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                    ;
                    verbalize("%s, %s!  I was looking for %s.", Hello(shkp), game.plname, eshkp.customer);
                }
                eshkp.following = 0;
                return 0;
            }
            if (game.moves > game.followmsg + 4) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                    ;
                    verbalize("%s, %s!  Didn't you forget to pay?", Hello(shkp), game.plname);
                } else {
                    pline("%s holds out %s upturned %s.", Shknam(shkp), (genders[pronoun_gender(shkp, (1 | 2))].his), mbodypart(shkp, HAND));
                }
                game.followmsg = game.moves;
                if (!rn2(9)) {
                    pline("%s doesn't like customers who don't pay.", Shknam(shkp));
                    rile_shk(shkp);
                }
            }
            if (udist < 2) {
                return 0;
            }
        }
    }
    appr = 1;
    gtx = eshkp.shk.x;
    gty = eshkp.shk.y;
    satdoor = (gtx == omx && gty == omy);
    if (eshkp.following || ((z = holetime()) >= 0 && z * z <= udist)) {
        /* [This distance check used to apply regardless of
            whether the shk was following, but that resulted in
            m_move() sometimes taking the shk out of the shop if
            the player had fenced him in with boulders or traps.
            Such voluntary abandonment left unpaid objects in
            invent, triggering billing impossibilities on the
            next level once the character fell through the hole.] */
        if (udist > 4 && eshkp.following && !eshkp.billct) {
            return -1;
        }
        gtx = game.u.ux;
        gty = game.u.uy;
    } else if ((!((shkp).mpeaceful))) {
        if (shkp.mcansee && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((shkp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(shkp).my][(shkp).mx] & 1) != 0))) {
            /* Move towards the hero if the shopkeeper can see him. */
            gtx = game.u.ux;
            gty = game.u.uy;
        }
        avoid = (0);
    } else {
        if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || game.u.usteed) {
            avoid = (0);
        } else {
            uondoor = ((eshkp.shd.x) == game.u.ux && (eshkp.shd.y) == game.u.uy);
            if (uondoor) {
                badinv = (carrying(PICK_AXE) || carrying(DWARVISH_MATTOCK) || ((game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic) && (sobj_at(PICK_AXE, game.u.ux, game.u.uy) || sobj_at(DWARVISH_MATTOCK, game.u.ux, game.u.uy))));
                if (satdoor && badinv) {
                    return 0;
                }
                avoid = !badinv;
            } else {
                avoid = (game.u.ushops && dist2((gtx), (gty), game.u.ux, game.u.uy) > 8);
                badinv = (0);
            }
            if (((!eshkp.robbed && !eshkp.billct && !eshkp.debit) || avoid) && (dist2(omx, omy, gtx, gty)) < 3) {
                if (!badinv && !online2((omx), (omy), game.u.ux, game.u.uy)) {
                    return 0;
                }
                if (satdoor) {
                    appr = gtx = gty = 0;
                }
            }
        }
    }
    z = move_special(shkp, inhishop(shkp), appr, uondoor, avoid, omx, omy, gtx, gty);
    if (z > 0) {
        after_shk_move(shkp);
    }
    return z;
}
/* called after shopkeeper moves, in case move causes re-entry into shop */
export function after_shk_move(shkp) {
    let eshkp = ((shkp).mextra.eshk);
    if (eshkp.bill_p == -1000 && inhishop(shkp)) {
        eshkp.bill_p = eshkp.bill[0];
        /* only re-check occupancy if game hasn't just ended */
        if (!game.program_state.gameover) {
            check_special_room((0));
        }
    }
}
/* for use in levl_follower (mondata.c) */
export function is_fshk(mtmp) {
    return (mtmp.isshk && ((mtmp).mextra.eshk).following);
}
/* You are digging in the shop. */
export function shopdig(fall) {
    let shkp = shop_keeper(game.u.ushops);
    let lang = 0;
    let grabs = "grabs";
    if (!shkp) {
        return;
    }
    if (!inhishop(shkp)) {
        if ((game.urole.mnum == (PM_KNIGHT))) {
            You_feel("like a common thief.");
            adjalign(-sgn(game.u.ualign.type));
        }
        return;
    }
    /* 0 == can't speak, 1 == makes animal noises, 2 == speaks */
    lang = 0;
    if (((shkp).msleeping || !(shkp).mcanmove) || ((shkp.data).msound == MS_SILENT)) {
        ;
    } else if (shkp.data.msound <= MS_ANIMAL) {
        lang = 1;
    } else if (shkp.data.msound >= MS_HUMANOID) {
        lang = 2;
    }
    if (!fall) {
        if (lang == 2) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                ;
                if (game.u.utraptype == TT_PIT) {
                    verbalize("Be careful, %s, or you might fall through the floor.", game.flags.female ? "madam" : "sir");
                } else {
                    verbalize("%s, do not damage the floor here!", game.flags.female ? "Madam" : "Sir");
                }
            }
        }
        if ((game.urole.mnum == (PM_KNIGHT))) {
            You_feel("like a common thief.");
            adjalign(-sgn(game.u.ualign.type));
        }
    } else if (!um_dist(shkp.mx, shkp.my, 5) && !((shkp).msleeping || !(shkp).mcanmove) && (((shkp).mextra.eshk).billct || ((shkp).mextra.eshk).debit)) {
        let obj = null;
        let obj2 = null;
        if ((((shkp.data).mflags1 & 24576) == 24576)) {
            /* This is what should happen, but for balance
             * reasons, it isn't currently.
             */
            grabs = "knocks off";
        }
        if (!(dist2(((shkp).mx), ((shkp).my), game.u.ux, game.u.uy) <= 2)) {
            mnexto(shkp, 2);
            if (!(dist2(((shkp).mx), ((shkp).my), game.u.ux, game.u.uy) <= 2)) {
                /* for some reason the shopkeeper can't come next to you */
                if (lang == 2) {
                    pline("%s curses you in anger and frustration!", Shknam(shkp));
                } else if (lang == 1) {
                    growl(shkp);
                }
                rile_shk(shkp);
                return;
            } else {
                pline("%s %s, and %s your backpack!", Shknam(shkp), makeplural(locomotion(shkp.data, "leap")), grabs);
            }
        } else {
            pline("%s %s your backpack!", Shknam(shkp), grabs);
        }
        for (obj = game.invent; obj; obj = obj2) {
            obj2 = obj.nobj;
            if ((obj.owornmask & ~(1024 | 512)) != 0 || (obj == game.uswapwep && game.u.twoweap) || (obj.otyp == LEASH && obj.corpsenm)) {
                continue;
            }
            if (obj == game.current_wand) {
                continue;
            }
            setnotworn(obj);
            freeinv(obj);
            subfrombill(obj, shkp);
            add_to_minv(shkp, obj);
        }
    }
}
const __makekops_k_mndx = [PM_KEYSTONE_KOP, PM_KOP_SERGEANT, PM_KOP_LIEUTENANT, PM_KOP_KAPTAIN];
export function makekops(mm) {
    let k_cnt = [0, 0, 0, 0];
    let cnt = 0;
    let mndx = 0;
    let k = 0;
    k_cnt[0] = cnt = abs(depth(game.u.uz)) + rnd(5);
    k_cnt[1] = (Math.trunc(cnt / 3)) + 1;
    k_cnt[2] = (Math.trunc(cnt / 6));
    k_cnt[3] = (Math.trunc(cnt / 9));
    for (k = 0; k < 4; k++) {
        if ((cnt = k_cnt[k]) == 0) {
            break;
        }
        mndx = __makekops_k_mndx[k];
        if (game.mvitals[mndx].mvflags & (2 | 1)) {
            continue;
        }
        while (cnt--) {
            if (enexto(mm, mm.x, mm.y, game.mons[mndx])) {
                makemon(game.mons[mndx], mm.x, mm.y, 131072);
            }
        }
    }
}
export function getcad(shkp, dmgstr, x, y, uinshp, animal, pursue) {
    let dugwall = (!strcmp(dmgstr, "dig into") || !strcmp(dmgstr, "damage"));
    if ((((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
        if (animal && !((shkp).msleeping || !(shkp).mcanmove)) {
            yelp(shkp);
        }
    } else if (pursue || uinshp || !um_dist(x, y, 1)) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            ;
            verbalize("How dare you %s my %s?", dmgstr, dugwall ? "shop" : "door");
        } else {
            pline("%s is %s that you decided to %s %s %s!", Shknam(shkp), angrytexts[rn2((Math.trunc(3 /* sizeof(const char *const [3]) */ / 1 /* sizeof(const char *const) */)))], dmgstr, (genders[pronoun_gender(shkp, (1 | 2))].his), dugwall ? "shop" : "door");
        }
    } else {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            pline("%s shouts:", Shknam(shkp));
            ;
            verbalize("Who dared %s my %s?", dmgstr, dugwall ? "shop" : "door");
        } else {
            pline("%s is %s that someone decided to %s %s %s!", Shknam(shkp), angrytexts[rn2((Math.trunc(3 /* sizeof(const char *const [3]) */ / 1 /* sizeof(const char *const) */)))], dmgstr, (genders[pronoun_gender(shkp, (1 | 2))].his), dugwall ? "shop" : "door");
        }
    }
    hot_pursuit(shkp);
}
export function pay_for_damage(dmgstr, cant_mollify) {
    let shkp = null;
    let shops_affected = '';
    let uinshp = (game.u.ushops != 0);
    let qbuf = '';
    let x = 0;
    let y = 0;
    let animal = 0;
    let pursue = 0;
    let tmp_dam = null;
    let appear_here = null;
    let cost_of_damage = 0;
    let nearest_shk = (21 * 21) + (80 * 80);
    let nearest_damage = nearest_shk;
    let picks = 0;
    for (tmp_dam = game.level.damagelist; tmp_dam; tmp_dam = tmp_dam.next) {
        let __nh_shp_idx = 0;
        if (tmp_dam.when != game.moves || !tmp_dam.cost) {
            continue;
        }
        cost_of_damage += tmp_dam.cost;
        shops_affected = strcpy(shops_affected, in_rooms(tmp_dam.place.x, tmp_dam.place.y, SHOPBASE));
        for (__nh_shp_idx = 0; shops_affected[__nh_shp_idx]; __nh_shp_idx++) {
            let tmp_shk = null;
            let shk_distance = 0;
            if (!(tmp_shk = shop_keeper(shops_affected[__nh_shp_idx]))) {
                continue;
            }
            if (tmp_shk == shkp) {
                let damage_distance = dist2((tmp_dam.place.x), (tmp_dam.place.y), game.u.ux, game.u.uy);
                if (damage_distance < nearest_damage) {
                    nearest_damage = damage_distance;
                    appear_here = tmp_dam;
                }
                continue;
            }
            if (!inhishop(tmp_shk)) {
                continue;
            }
            shk_distance = dist2(((tmp_shk).mx), ((tmp_shk).my), game.u.ux, game.u.uy);
            if (shk_distance > nearest_shk) {
                continue;
            }
            if ((shk_distance == nearest_shk) && picks) {
                if (rn2(++picks)) {
                    continue;
                }
            } else {
                picks = 1;
            }
            shkp = tmp_shk;
            nearest_shk = shk_distance;
            appear_here = tmp_dam;
            nearest_damage = dist2((tmp_dam.place.x), (tmp_dam.place.y), game.u.ux, game.u.uy);
        }
    }
    if (!cost_of_damage || !shkp) {
        return;
    }
    animal = (shkp.data.msound <= MS_ANIMAL);
    pursue = (0);
    x = appear_here.place.x;
    y = appear_here.place.y;
    ((shkp).mextra.eshk).customer = strncpy(((shkp).mextra.eshk).customer, game.plname, 32);
    if ((!((shkp).mpeaceful)) || ((shkp).mextra.eshk).following) {
        hot_pursuit(shkp);
        return;
    }
    if (!in_rooms(shkp.mx, shkp.my, SHOPBASE)) {
        /* if the shk is not in their shop.. */
        if (!((game.viz_array[shkp.my][shkp.mx] & 2) != 0)) {
            return;
        }
        pursue = (1);
        getcad(shkp, dmgstr, x, y, uinshp, animal, pursue);
        return;
    }
    if (uinshp) {
        if (um_dist(shkp.mx, shkp.my, 1) && !um_dist(shkp.mx, shkp.my, 3)) {
            pline("%s leaps towards you!", Shknam(shkp));
            mnexto(shkp, 4);
        }
        pursue = um_dist(shkp.mx, shkp.my, 1);
        if (pursue) {
            getcad(shkp, dmgstr, x, y, uinshp, animal, pursue);
            return;
        }
    } else {
        if ((game.level.monsters[x][y] != null)) {
            if (!animal) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                    /*
         * Make shkp show up at the door.  Effect:  If there is a monster
         * in the doorway, have the hero hear the shopkeeper yell a bit,
         * pause, then have the shopkeeper appear at the door, having
         * yanked the hapless critter out of the way.
         */
                    /* Soundeffect(se_angry_voice, 75); */
                    You_hear("an angry voice:");
                    ;
                    verbalize("Out of my way, scum!");
                }
                (game.windowprocs.win_wait_synch)();
                sleep(1);
            } else {
                growl(shkp);
            }
        }
        mnearto(shkp, x, y, (1), 2);
    }
    if ((um_dist(x, y, 1) && !uinshp) || cant_mollify || (money_cnt(game.invent) + ((shkp).mextra.eshk).credit) < cost_of_damage || !rn2(50)) {
        getcad(shkp, dmgstr, x, y, uinshp, animal, pursue);
        return;
    }
    if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked)) {
        Your("invisibility does not fool %s!", shkname(shkp));
    }
    qbuf = sprintf(qbuf, "%sYou did %ld %s worth of damage!%s  Pay?", !animal ? cad((1)) : "", cost_of_damage, currency(cost_of_damage), !animal ? "\"" : "");
    if (yn_function(qbuf, ynchars, 110, (1)) != 110) {
        let is_seen = 0;
        let was_seen = canseemon(shkp);
        let was_outside = !inhishop(shkp);
        let sx = shkp.mx;
        let sy = shkp.my;
        cost_of_damage = check_credit(cost_of_damage, shkp);
        if (cost_of_damage > 0) {
            money2mon(shkp, cost_of_damage);
            game.disp.botl = (1);
        }
        pline("Mollified, %s accepts your restitution.", shkname(shkp));
        home_shk(shkp, (0));
        pacify_shk(shkp, (0));
        if (shkp.mx != sx || shkp.my != sy) {
            /* home_shk() suppresses rloc()'s vanish/appear messages */
            if (was_outside && (canseemon(shkp) || sensemon(shkp))) {
                pline("%s returns to %s shop.", Shknam(shkp), (genders[pronoun_gender(shkp, (1 | 2))].his));
            } else if ((is_seen = canseemon(shkp)) == (1) || was_seen) {
                pline("%s %s.", Shknam(shkp), !was_seen ? "appears" : is_seen ? "shifts location" : "disappears");
            }
        }
    } else {
        if (!animal) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                ;
                verbalize("Oh, yes!  You'll pay!");
            } else {
                pline("%s lunges %s %s toward your %s!", Shknam(shkp), (genders[pronoun_gender(shkp, (1 | 2))].his), mbodypart(shkp, HAND), body_part(NECK));
            }
        } else {
            growl(shkp);
        }
        hot_pursuit(shkp);
        adjalign(-sgn(game.u.ualign.type));
    }
}
/* called in dokick.c when we kick an object that might be in a store */
export function costly_spot(x, y) {
    let shkp = null;
    let eshkp = null;
    if (!game.level.flags.has_shop) {
        return (0);
    }
    shkp = shop_keeper(in_rooms(x, y, SHOPBASE));
    if (!shkp || !inhishop(shkp)) {
        return (0);
    }
    eshkp = ((shkp).mextra.eshk);
    return (inside_shop(x, y) && !(x == eshkp.shk.x && y == eshkp.shk.y));
}
/* called by sanity checking when an unpaid or no_charge item is not at a
   costly_spot; it might still be within the boundary of the shop; if so,
   those flags are still valid */
export function costly_adjacent(shkp, x, y) {
    let eshkp = null;
    if (!shkp || !inhishop(shkp) || !isok(x, y)) {
        return (0);
    }
    eshkp = ((shkp).mextra.eshk);
    /* adjacent if <x,y> is a shop wall spot, including door;
       also treat "free spot" one step inside the door as adjacent */
    return (game.level.locations[x][y].edge || (x == eshkp.shk.x && y == eshkp.shk.y));
}
/* called by dotalk(sounds.c) when #chatting; returns obj if location
   contains shop goods and shopkeeper is willing & able to speak */
export function shop_object(x, y) {
    let otmp = null;
    let shkp = null;
    shkp = shop_keeper(in_rooms(x, y, SHOPBASE));
    if (!shkp || !inhishop(shkp)) {
        return null;
    }
    for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp.oclass != COIN_CLASS) {
            break;
        }
    }
    /* note: otmp might have ->no_charge set, but that's ok */
    return (otmp && costly_spot(x, y) && ((shkp).mpeaceful) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) ? otmp : null;
}
/* give price quotes for all objects linked to this one (ie, on this spot) */
export function price_quote(first_obj) {
    let otmp = null;
    let buf = '';
    let price = '';
    let cost = 0;
    let cnt = 0;
    let contentsonly = (0);
    let tmpwin = 0;
    let shkp = null;
    shkp = shop_keeper(inside_shop(game.u.ux, game.u.uy));
    if (!shkp || !inhishop(shkp)) {
        return;
    }
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_putstr)(tmpwin, 0, "Fine goods for sale:");
    (game.windowprocs.win_putstr)(tmpwin, 0, "");
    for (otmp = first_obj; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp.oclass == COIN_CLASS) {
            continue;
        }
        cost = (otmp.no_charge || otmp == game.uball || otmp == game.uchain) ? 0 : get_cost(otmp, shkp);
        contentsonly = !cost;
        if (((otmp).cobj != null)) {
            cost += contained_cost(otmp, shkp, 0, (0), (0));
        }
        if (otmp.globby) {
            cost *= get_pricing_units(otmp);
        }
        if (!cost) {
            price = strcpy(price, "no charge");
            /* always quan 1, vary by wt */
            contentsonly = (0);
        } else {
            price = sprintf(price, "%ld %s%s", cost, currency(cost), (otmp.quan) > 1 ? " each" : "");
        }
        buf = sprintf(buf, "%s%s, %s", contentsonly ? the_contents_of : "", doname(otmp), price);
        (game.windowprocs.win_putstr)(tmpwin, 0, buf) , cnt++;
    }
    if (cnt > 1) {
        (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
    } else if (cnt == 1) {
        if (!cost) {
            ;
            /* "<doname(obj)>, no charge" */
            verbalize("%s!", upstart(buf));
        } else {
            buf = sprintf(buf, "%s%s", contentsonly ? the_contents_of : "", doname(first_obj));
            ;
            verbalize("%s, price %ld %s%s%s", upstart(buf), cost, currency(cost), (first_obj.quan > 1) ? " each" : "", contentsonly ? "." : shk_embellish(first_obj, cost));
        }
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
}
export function shk_embellish(itm, cost) {
    if (!rn2(3)) {
        let o = 0;
        let choice = rn2(5);
        if (choice == 0) {
            choice = (cost < 100 ? 1 : cost < 500 ? 2 : 3);
        }
        switch (choice) {
            case 4:
                if (cost < 10) {
                    break;
                } else {
                    o = itm.oclass;
                }
                if (o == FOOD_CLASS) {
                    return ", gourmets' delight!";
                }
                if (game.objects[itm.otyp].oc_name_known ? game.objects[itm.otyp].oc_magic : (o == AMULET_CLASS || o == RING_CLASS || o == WAND_CLASS || o == POTION_CLASS || o == SCROLL_CLASS || o == SPBOOK_CLASS)) {
                    return ", painstakingly developed!";
                }
                return ", superb craftsmanship!";
            case 3:
                return ", finest quality.";
            case 2:
                return ", an excellent choice.";
            case 1:
                return ", a real bargain.";
            default:
                break;
        }
    } else if (itm.oartifact) {
        return ", one of a kind!";
    }
    return ".";
}
/* First 4 supplied by Ronen and Tamar, remainder by development team */
const Izchak_speaks = ["%s says: 'These shopping malls give me a headache.'", "%s says: 'Slow down.  Think clearly.'", "%s says: 'You need to take things one at a time.'", "%s says: 'I don't like poofy coffee... give me Colombian Supremo.'", "%s says that getting the devteam's agreement on anything is difficult.", "%s says that he has noticed those who serve their deity will prosper.", "%s says: 'Don't try to steal from me - I have friends in high places!'", "%s says: 'You may well need something from this shop in the future.'", "%s comments about the Valley of the Dead as being a gateway."];
export function shk_chat(shkp) {
    let eshk = null;
    let shkmoney = 0;
    if (!shkp.isshk) {
        /* The monster type is shopkeeper, but this monster is
           not actually a shk, which could happen if someone
           wishes for a shopkeeper statue and then animates it.
           (Note: shkname() would be "" in a case like this.) */
        pline("%s asks whether you've seen any untended shops recently.", Monnam(shkp));
        return;
    }
    eshk = ((shkp).mextra.eshk);
    if ((!((shkp).mpeaceful))) {
        pline("%s %s how much %s dislikes %s customers.", Shknam(shkp), (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) ? "mentions" : "indicates", (genders[pronoun_gender(shkp, (1 | 2))].he), eshk.robbed ? "non-paying" : "rude");
    } else if (eshk.following) {
        if (strncmp(eshk.customer, game.plname, 32)) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                ;
                verbalize("%s %s!  I was looking for %s.", Hello(shkp), game.plname, eshk.customer);
            }
            eshk.following = 0;
        } else {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                ;
                verbalize("%s %s!  Didn't you forget to pay?", Hello(shkp), game.plname);
            } else {
                pline("%s taps you on the %s.", Shknam(shkp), body_part(ARM));
            }
        }
    } else if (eshk.billct) {
        let total = addupbill(shkp) + eshk.debit;
        pline("%s %s that your bill comes to %ld %s.", Shknam(shkp), (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) ? "says" : "indicates", total, currency(total));
    } else if (eshk.debit) {
        pline("%s %s that you owe %s %ld %s.", Shknam(shkp), (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) ? "reminds you" : "indicates", (genders[pronoun_gender(shkp, (1 | 2))].him), eshk.debit, currency(eshk.debit));
    } else if (eshk.credit) {
        pline("%s encourages you to use your %ld %s of credit.", Shknam(shkp), eshk.credit, currency(eshk.credit));
    } else if (eshk.robbed) {
        pline("%s %s about a recent robbery.", Shknam(shkp), (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) ? "complains" : "indicates concern");
    } else if (eshk.surcharge) {
        pline("%s %s that %s is watching you carefully.", Shknam(shkp), (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) ? "warns you" : "indicates", (genders[pronoun_gender(shkp, (1 | 2))].he));
    } else if ((shkmoney = money_cnt(shkp.minvent)) < 50) {
        pline("%s %s that business is bad.", Shknam(shkp), (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) ? "complains" : "indicates");
    } else if (shkmoney > 4000) {
        pline("%s %s that business is good.", Shknam(shkp), (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) ? "says" : "indicates");
    } else if (is_izchak(shkp, (0))) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            pline(Izchak_speaks[rn2((Math.trunc(72 /* sizeof(const char *[9]) */ / 8 /* sizeof(const char *) */)))], shkname(shkp));
        }
    } else {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
            pline("%s talks about the problem of shoplifters.", Shknam(shkp));
        }
    }
}
export function kops_gone(silent) {
    let cnt = 0;
    let mtmp = null;
    let mtmp2 = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp2) {
        mtmp2 = mtmp.nmon;
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (mtmp.data.mlet == S_KOP) {
            if ((canseemon(mtmp) || sensemon(mtmp))) {
                cnt++;
            }
            mongone(mtmp);
        }
    }
    if (cnt && !silent) {
        pline_The("Kop%s (disappointed) vanish%s into thin air.", (((cnt) == 1) ? "" : "s"), (cnt == 1) ? "es" : "");
    }
}
/* some items have "alternate" use with different cost */
export function cost_per_charge(shkp, otmp, altusage) {
    let tmp = 0;
    if (!shkp || !inhishop(shkp)) {
        return 0;
    }
    tmp = get_cost(otmp, shkp);
    if (otmp.otyp == MAGIC_LAMP) {
        if (!altusage) {
            tmp = game.objects[OIL_LAMP].oc_cost;
        /* The idea is to make the exhaustive use of an unpaid item
     * more expensive than buying it outright.
     */
        /* normal use (ie, as light source) of a magic lamp never
           degrades its value, but not charging anything would make
           identification too easy; charge an amount comparable to
           what is charged for an ordinary lamp (don't bother with
           angry shk surcharge) */
        /* djinni is being released */
        } else {
            tmp += Math.trunc(tmp / 3);
        }
    } else if (otmp.otyp == MAGIC_MARKER) {
        tmp = Math.trunc(tmp / 2);
    } else if (otmp.otyp == BAG_OF_TRICKS || otmp.otyp == HORN_OF_PLENTY) {
        /* altusage: emptying of all the contents at once */
        if (!altusage) {
            tmp = Math.trunc(tmp / 5);
        }
    } else if (otmp.otyp == CRYSTAL_BALL || otmp.otyp == OIL_LAMP || otmp.otyp == BRASS_LANTERN || (otmp.otyp >= MAGIC_FLUTE && otmp.otyp <= DRUM_OF_EARTHQUAKE) || otmp.oclass == WAND_CLASS) {
        if (otmp.spe > 1) {
            tmp = Math.trunc(tmp / 4);
        }
    } else if (otmp.oclass == SPBOOK_CLASS) {
        tmp -= Math.trunc(tmp / 5);
    } else if (otmp.otyp == CAN_OF_GREASE || otmp.otyp == TINNING_KIT || otmp.otyp == EXPENSIVE_CAMERA) {
        tmp = Math.trunc(tmp / 10);
    } else if (otmp.otyp == POT_OIL) {
        tmp = Math.trunc(tmp / 5);
    }
    return tmp;
}
/* Charge the player for partial use of an unpaid object.
 *
 * Note that bill_dummy_object() should be used instead
 * when an object is completely used.
 */
export function check_unpaid_usage(otmp, altusage) {
    let shkp = null;
    let fmt = null;
    let arg1 = null;
    let arg2 = null;
    let buf = '';
    let tmp = 0;
    if (!otmp.unpaid || !game.u.ushops || (otmp.spe <= 0 && game.objects[otmp.otyp].oc_charged)) {
        return;
    }
    shkp = shop_keeper(game.u.ushops);
    if (!shkp || !inhishop(shkp)) {
        return;
    }
    if ((tmp = cost_per_charge(shkp, otmp, altusage)) == 0) {
        return;
    }
    arg1 = arg2 = "";
    if (otmp.oclass == SPBOOK_CLASS) {
        fmt = "%sYou owe%s %ld %s.";
        buf = sprintf(buf, "This is no free library, %s!  ", cad((0)));
        arg1 = rn2(2) ? buf : "";
        arg2 = ((shkp).mextra.eshk).debit > 0 ? " an additional" : "";
    } else if (otmp.otyp == POT_OIL) {
        fmt = "%s%sThat will cost you %ld %s (Yendorian Fuel Tax).";
    } else if (altusage && (otmp.otyp == BAG_OF_TRICKS || otmp.otyp == HORN_OF_PLENTY)) {
        fmt = "%s%sEmptying that will cost you %ld %s.";
        if (!rn2(3)) {
            arg1 = "Whoa!  ";
        }
        if (!rn2(3)) {
            arg1 = "Watch it!  ";
        }
    } else {
        fmt = "%s%sUsage fee, %ld %s.";
        if (!rn2(3)) {
            arg1 = "Hey!  ";
        }
        if (!rn2(3)) {
            arg2 = "Ahem.  ";
        }
    }
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
        ;
        verbalize(fmt, arg1, arg2, tmp, currency(tmp));
        exercise(A_WIS, (1));
    }
    ((shkp).mextra.eshk).debit += tmp;
}
/* for using charges of unpaid objects "used in the normal manner" */
export function check_unpaid(otmp) {
    check_unpaid_usage(otmp, (0));
}
export function costly_gold(x, y, amount, silent) {
    let delta = 0;
    let shkp = null;
    let eshkp = null;
    if (!costly_spot(x, y)) {
        return;
    }
    shkp = shop_keeper(in_rooms(x, y, SHOPBASE));
    if (!shkp) {
        return;
    }
    eshkp = ((shkp).mextra.eshk);
    if (eshkp.credit >= amount) {
        if (!silent) {
            if (eshkp.credit > amount) {
                Your("credit is reduced by %ld %s.", amount, currency(amount));
            } else {
                Your("credit is erased.");
            }
        }
        eshkp.credit -= amount;
    } else {
        delta = amount - eshkp.credit;
        if (!silent) {
            if (eshkp.credit) {
                Your("credit is erased.");
            }
            if (eshkp.debit) {
                Your("debt increases by %ld %s.", delta, currency(delta));
            } else {
                You("owe %s %ld %s.", shkname(shkp), delta, currency(delta));
            }
        }
        eshkp.debit += delta;
        eshkp.loan += delta;
        eshkp.credit = 0;
    }
}
/* used in domove to block diagonal shop-exit */
/* x,y should always be a door */
export function block_door(x, y) {
    let __rs = in_rooms(x, y, SHOPBASE);
    let roomno = (typeof __rs === 'string')
        ? (__rs.length ? __rs.charCodeAt(0) : 0)
        : (__rs | 0);
    let shkp = null;
    if (roomno < 3 || !game.rooms[roomno - 3] || !(game.rooms[roomno - 3].rtype >= SHOPBASE)) {
        return (0);
    }
    if (!((game.level.locations[x][y].typ) == DOOR)) {
        return (0);
    }
    let __uroom = (Array.isArray(game.u.ushops) && game.u.ushops.length)
        ? (game.u.ushops[0] | 0)
        : (game.u.ushops | 0);
    if (roomno != __uroom) {
        return (0);
    }
    shkp = shop_keeper(roomno);
    if (!shkp || !inhishop(shkp)) {
        return (0);
    }
    if (shkp.mx == ((shkp).mextra.eshk).shk.x && shkp.my == ((shkp).mextra.eshk).shk.y && ((shkp).mextra.eshk).shd.x == x && ((shkp).mextra.eshk).shd.y == y && !((shkp).msleeping || !(shkp).mcanmove) && (((shkp).mextra.eshk).debit || ((shkp).mextra.eshk).billct || ((shkp).mextra.eshk).robbed)) {
        /* Actually, the shk should be made to block _any_
         * door, including a door the player digs, if the
         * shk is within a 'jumping' distance.
         */
        pline("%s%s blocks your way!", Shknam(shkp), ((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) ? " senses your motion and" : "");
        return (1);
    }
    return (0);
}
/* used in domove to block diagonal shop-entry;
   u.ux, u.uy should always be a door */
export function block_entry(x, y) {
    let sx = 0;
    let sy = 0;
    let roomno = 0;
    let shkp = null;
    if (!(((game.level.locations[game.u.ux][game.u.uy].typ) == DOOR) && game.level.locations[game.u.ux][game.u.uy].flags == 1)) {
        return (0);
    }
    roomno = in_rooms(x, y, SHOPBASE);
    if (roomno < 0 || !(game.rooms[roomno].rtype >= SHOPBASE)) {
        return (0);
    }
    shkp = shop_keeper(roomno);
    if (!shkp || !inhishop(shkp)) {
        return (0);
    }
    if (((shkp).mextra.eshk).shd.x != game.u.ux || ((shkp).mextra.eshk).shd.y != game.u.uy) {
        return (0);
    }
    sx = ((shkp).mextra.eshk).shk.x;
    sy = ((shkp).mextra.eshk).shk.y;
    if (shkp.mx == sx && shkp.my == sy && !((shkp).msleeping || !(shkp).mcanmove) && (x == sx - 1 || x == sx + 1 || y == sy - 1 || y == sy + 1) && (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || carrying(PICK_AXE) || carrying(DWARVISH_MATTOCK) || game.u.usteed)) {
        pline("%s%s blocks your way!", Shknam(shkp), ((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) ? " senses your motion and" : "");
        return (1);
    }
    return (0);
}
/* "your " or "Foobar's " (note the trailing space) */
export function shk_your(buf, obj) {
    let chk_pm = obj.otyp == CORPSE && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS);
    buf = __nh_char_write(buf, 0, 0);
    if (chk_pm && (((game.mons[obj.corpsenm]).mflags2 & 524288) != 0)) {
        return buf;
    } else if (chk_pm && the_unique_pm(game.mons[obj.corpsenm])) {
        buf = strcpy(buf, "the");
    } else if (!shk_owns(buf, obj) && !mon_owns(buf, obj)) {
        buf = strcpy(buf, c_common_strings.c_the_your[((obj).where == 3) ? 1 : 0]);
    }
    return strcat(buf, " ");
}
export function Shk_Your(buf, obj) {
    shk_your(buf, obj);
    buf.value = highc(buf.value);
    return buf;
}
export function shk_owns(buf, obj) {
    let shkp = null;
    let x = 0;
    let y = 0;
    if (get_obj_location(obj, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0) && (obj.unpaid || (obj.where == 1 && !obj.no_charge && costly_spot(x, y)))) {
        shkp = shop_keeper(inside_shop(x, y));
        return strcpy(buf, shkp ? s_suffix(shkname(shkp)) : c_common_strings.c_the_your[0]);
    }
    return null;
}
export function mon_owns(buf, obj) {
    if (obj.where == 4) {
        return strcpy(buf, s_suffix(y_monnam(obj.v.v_ocarry)));
    }
    return null;
}
/* used as a verbalized exclamation:  \"Cad! ...\" */
export function cad(altusage) {
    let res = null;
    switch ((((game.youmonst.data).mflags2 & 256) != 0) ? 3 : poly_gender()) {
        case 0:
            res = "cad";
            break;
        case 1:
            res = "minx";
            break;
        case 2:
            res = "beast";
            break;
        case 3:
            res = "fiend";
            break;
        default:
            impossible("cad: unknown gender");
            res = "thing";
            break;
    }
    if (altusage) {
        let cadbuf = mon_nam(game.youmonst);
        cadbuf = sprintf(cadbuf, "\"%s!  ", res);
        /* alternate usage adds a leading double quote and trailing
           exclamation point plus sentence separating spaces */
        cadbuf = __nh_char_write(cadbuf, 1, highc(__nh_char_at0(__nh_advance_str(cadbuf, 1))));
        res = cadbuf;
    }
    return res;
}
/*
 * The caller is about to make obj_absorbed go away.
 *
 * There's no way for you (or a shopkeeper) to prevent globs
 * from merging with each other on the floor due to the
 * inherent nature of globs so it irretrievably becomes part
 * of the floor glob mass. When one glob is absorbed by another
 * glob, the two become indistinguishable and the remaining
 * glob object grows in mass, the product of both.
 *
 * billing admin, player compensation, shopkeeper compensation
 * all need to be considered.
 *
 * Any original billed item is lost to the absorption so the
 * original billed amount for the object being absorbed must
 * get added to the cost owing for the absorber, and the
 * separate cost for the object being absorbed goes away.
 *
 * There are four scenarios to deal with:
 *     1. shop_owned glob merging into shop_owned glob
 *     2. player_owned glob merging into shop_owned glob
 *     3. shop_owned glob merging into player_owned glob
 *     4. player_owned glob merging into player_owned glob
 */
export function globby_bill_fixup(obj_absorber, obj_absorbed) {
    let x = 0;
    let y = 0;
    let bp = null;
    let bp_absorber = null;
    let shkp = null;
    let eshkp = null;
    let amount = 0;
    let per_unit_cost = 0;
    let floor_absorber = (obj_absorber.where == 1);
    if (!obj_absorber.globby) {
        impossible("globby_bill_fixup called for non-globby object");
    }
    if (floor_absorber) {
        x = obj_absorber.ox , y = obj_absorber.oy;
    }
    if (obj_absorber.unpaid) {
        for (shkp = next_shkp(game.level.monlist, (1)); shkp; shkp = next_shkp(shkp.nmon, (1))) {
            if (onbill(obj_absorber, shkp, (1))) {
                break;
            }
        }
    } else if (obj_absorbed.unpaid) {
        if (obj_absorbed.where == 0 && floor_absorber && costly_spot(x, y)) {
            shkp = shop_keeper(in_rooms(x, y, SHOPBASE));
        }
    }
    if (!shkp) {
        shkp = shop_keeper(game.u.ushops);
    }
    if (!shkp) {
        return;
    }
    bp_absorber = onbill(obj_absorber, shkp, (0));
    bp = onbill(obj_absorbed, shkp, (0));
    eshkp = ((shkp).mextra.eshk);
    per_unit_cost = set_cost(obj_absorbed, shkp);
    if (bp && (!obj_absorber.no_charge || billable({ get value() { return shkp; }, set value(_v) { shkp = _v; } }, obj_absorber, eshkp.shoproom, (0)))) {
        /**************************************************************
     * Scenario 1. Shop-owned glob absorbing into shop-owned glob
     **************************************************************/
        /* the glob being absorbed has a billing record */
        /**************************************************************
     * Scenario 3. shop_owned glob merging into player_owned glob
     **************************************************************/
        amount = bp.price;
        eshkp.billct--;
        Object.assign(bp, eshkp.bill_p[eshkp.billct]);
        clear_unpaid_obj(shkp, obj_absorbed);
        if (bp_absorber) {
            /* the absorber has a billing record */
            bp_absorber.price += amount;
        } else {
            ;
        }
        return;
    }
    if (!bp_absorber && !bp && !obj_absorber.no_charge) {
        /**************************************************************
     * Scenario 2. Player-owned glob absorbing into shop-owned glob
     **************************************************************/
        /* there are no billing records */
        amount = get_pricing_units(obj_absorbed) * per_unit_cost;
        if (saleable(shkp, obj_absorbed)) {
            if (eshkp.debit >= amount) {
                if (eshkp.loan) {
                    if (eshkp.loan >= amount) {
                        eshkp.loan -= amount;
                    } else {
                        eshkp.loan = 0;
                    }
                }
                eshkp.debit -= amount;
                pline_The("donated %s %spays off your debt.", obj_typename(obj_absorbed.otyp), eshkp.debit ? "partially " : "");
            } else {
                let delta = amount - eshkp.debit;
                eshkp.credit += delta;
                if (eshkp.debit) {
                    eshkp.debit = 0;
                    eshkp.loan = 0;
                    Your("debt is paid off.");
                }
                if (eshkp.credit == delta) {
                    pline_The("%s established %ld %s credit.", obj_typename(obj_absorbed.otyp), delta, currency(delta));
                } else {
                    pline_The("%s added %ld %s %s %ld %s.", obj_typename(obj_absorbed.otyp), delta, currency(delta), "to your credit; total is now", eshkp.credit, currency(eshkp.credit));
                }
            }
        }
        return;
    } else if (bp_absorber) {
        /* absorber has a billing record */
        bp_absorber.price += per_unit_cost * get_pricing_units(obj_absorbed);
        return;
    }
    if (bp && (obj_absorber.no_charge || (floor_absorber && !costly_spot(x, y)))) {
        amount = bp.price;
        bill_dummy_object(obj_absorbed);
        ;
        verbalize("You owe me %ld %s for my %s that you %s with your%s", amount, currency(amount), obj_typename(obj_absorbed.otyp), (!((shkp).mpeaceful)) ? "had the audacity to mix" : "just mixed", (!((shkp).mpeaceful)) ? " stinking batch!" : "s.");
        return;
    }
    return;
}
/* Shopkeeper bills for use of a land mine or bear trap they own */
export function use_unpaid_trapobj(otmp, x, y) {
    if (otmp.unpaid) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            let shkp = find_objowner(otmp, x, y);
            if (shkp && !(((shkp).msleeping || !(shkp).mcanmove) || (shkp).data.msound <= MS_ANIMAL)) {
                ;
                verbalize("You set it, you buy it!");
            }
        }
        bill_dummy_object(otmp);
    }
}
/*shk.c*/
/* [real shopkeeper name is kept in ESHK,
                          not MGIVENNAME] */
/* sort such that FullyUsedUp and PartlyUsedUp come before
            PartlyIntact, FullyIntact, KnownContainer, UndisclosedContainer */
/* already inside this shk's shop so use ox,oy as-is */
/*
               "<shk> offers * for ..." query formatting.
               Normal item(s):
                "... your <object>.  Sell it?"
                "... your <objects>.  Sell them?"
               A container is either owned by the hero, or already
               owned by the shk (!ltmp), or the shk isn't interested
               in buying it (also !ltmp).  It's either empty (!cltmp)
               or it has contents owned by the hero or it has some
               contents owned by the hero and others by the shk.
               (The case where it has contents already entirely owned
               by the shk is treated the same was if it were empty
               since the hero isn't selling any of those contents.)
               Your container and shk is willing to buy it:
                "... your <empty bag>.  Sell it?"
                "... your <bag> and its contents.  Sell them?"
                "... your <bag> and item inside.  Sell them?"
                "... your <bag> and items inside.  Sell them?"
               Your container but shk only cares about the contents:
                "... your item in your <bag>.  Sell it?"
                "... your items in your <bag>.  Sell them?"
               Shk's container:
                "... your item in the <bag>.  Sell it?"
                "... your items in the <bag>.  Sell them?"
              FIXME:
               "your items" should sometimes be "some of your items"
               (when container has some stuff the shk is willing to buy
               and other stuff he or she doesn't care about); likewise,
               "your item" should sometimes be "one of your items".
               That would make the prompting even more verbose so
               living without it might be a good thing.
              FIXME too:
               when container's contents are unknown, plural "items"
               should be used to not give away information.
             */
/* while level.objects[x][y] != 0 */
/* print cost in slightly different format, so can't reuse buf;
               cost and contentsonly are already set up */
/* skip ownership prefix and space: "Medusa's corpse" */
/* override ownership: "the Oracle's corpse" */
/* the absorber has no billing record */
