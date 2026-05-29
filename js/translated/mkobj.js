import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';
/* NetHack 5.0	mkobj.c	$NHDT-Date: 1764044196 2025/11/24 20:16:36 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.326 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Derek S. Ray, 2015. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free, memcpy } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You_hear, You_see, Your, pline, verbalize } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strchr, strcpy, strlen, strncmp, strstri } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { artifact_exists, confers_luck, mk_artifact, nartifact_exist, permapoisoned } from './artifact.js';
import { set_moreluck } from './attrib.js';
import { isok } from './cmd.js';
import { is_ice, is_pool, is_pool_or_lava } from './dbridge.js';
import { c_common_strings, cg } from './decl.js';
import { newsym } from './display.js';
import { doaltarobj, dropy, obj_no_longer_held } from './do.js';
import { Mgender, mon_pmname, noveltitle, oname, pmname, safe_oname, x_monnam } from './do_name.js';
import { reset_remarm } from './do_wear.js';
import { hitfloor } from './dothrow.js';
import { def_oc_syms } from './drawing.js';
import { In_hell, In_quest, depth, level_difficulty, on_level, surface } from './dungeon.js';
import { eaten_stat, eating_glob, set_tin_variety } from './eat.js';
import { can_reach_floor } from './engrave.js';
import { in_rooms, near_capacity, obj_to_any } from './hack.js';
import { copynchars, eos, s_suffix, strsubst } from './hacklib.js';
import { consume_obj_charge, freeinv, g_at, hold_another_object, mergable, merged, nxtobj, sobj_at, update_inventory, useupall } from './invent.js';
import { arti_light_radius, del_light_source, find_mid, obj_adjust_light_radius, obj_sheds_light, obj_split_light_source } from './light.js';
import { maybe_reset_pick } from './lock.js';
import { rndmonst_adj } from './makemon.js';
import { can_be_hatched, copy_mextra, dead_species, dealloc_mextra, maybe_unhide_at, undead_to_corpse, zombie_form } from './mon.js';
import { pronoun_gender } from './mondata.js';
import { ALTAR, AMULET_CLASS, AMULET_OF_CHANGE, AMULET_OF_RESTFUL_SLEEP, AMULET_OF_STRANGULATION, AMULET_OF_YENDOR, APPLE, ARMOR_CLASS, BAG_OF_HOLDING, BAG_OF_TRICKS, BALL_CLASS, BANANA, BELL_OF_OPENING, BLINDED, BLINDFOLD, BOULDER, BRASS_LANTERN, CANDELABRUM_OF_INVOCATION, CANDY_BAR, CAN_OF_GREASE, CHAIN_CLASS, CHEST, COIN_CLASS, COPPER, CORPSE, COST_SINGLEOBJ, COST_UNBLSS, COST_UNCURS, CRYSTAL_BALL, DILITHIUM_CRYSTAL, DRAGON_HIDE, DRUM_OF_EARTHQUAKE, EGG, ELVEN_SHIELD, EUCALYPTUS_LEAF, EXPENSIVE_CAMERA, FIGURINE, FIG_TRANSFORM, FIRE_HORN, FIRE_RES, FOOD_CLASS, FOOD_RATION, FROST_HORN, FUMBLE_BOOTS, GAUNTLETS_OF_FUMBLING, GEM_CLASS, GLASS, GLOB_OF_BLACK_PUDDING, GLOB_OF_BROWN_PUDDING, GLOB_OF_GRAY_OOZE, GLOB_OF_GREEN_SLIME, GOLD_PIECE, GRAY_DRAGON_SCALES, HALLUC, HALLUC_RES, HATCH_EGG, HEAVY_IRON_BALL, HELM_OF_OPPOSITE_ALIGNMENT, HORN_OF_PLENTY, ICE, ICE_BOX, IRON, IRONBARS, KELP_FROND, LARGE_BOX, LEASH, LENSES, LEVITATION_BOOTS, LIQUID, LOADSTONE, LOW_PM, LS_OBJECT, LUCKSTONE, LUMP_OF_ROYAL_JELLY, MAGIC_FLUTE, MAGIC_HARP, MAGIC_LAMP, MAGIC_MARKER, MEAT_RING, NON_PM, NUMMONS, OILSKIN_SACK, OIL_LAMP, ORANGE, ORCISH_SHIELD, PEAR, PLASTIC, PLNMSG_OBJ_GLOWS, PM_ARCHEOLOGIST, PM_DEATH, PM_FAMINE, PM_GRAY_OOZE, PM_HUMAN, PM_LICHEN, PM_LIZARD, PM_PESTILENCE, PM_SAMURAI, PM_WIZARD, POTION_CLASS, POT_BOOZE, POT_OIL, POT_SICKNESS, POT_WATER, P_BOW, P_SHURIKEN, RANDOM_CLASS, REVIVE_MON, RING_CLASS, RIN_AGGRAVATE_MONSTER, RIN_HUNGER, RIN_POLYMORPH, RIN_TELEPORTATION, ROCK, ROCK_CLASS, ROT_CORPSE, SACK, SADDLE, SCROLL_CLASS, SCR_MAIL, SHIELD_OF_REFLECTION, SHOPBASE, SHRINK_GLOB, SLIME_MOLD, SPBOOK_CLASS, SPECIAL_PM, SPE_BLANK_PAPER, SPE_NOVEL, SPLINT_MAIL, STATUE, S_TROLL, S_altar, S_brdnstair, S_brupstair, S_dnstair, S_sink, S_throne, S_trwall, S_upstair, S_vwall, TALLOW_CANDLE, TIMER_OBJECT, TIN, TINNING_KIT, TOOL_CLASS, TOWEL, UNICORN_HORN, VENOM_CLASS, WAND_CLASS, WAN_CANCELLATION, WAN_FIRE, WAN_LIGHT, WAN_LIGHTNING, WAN_STASIS, WAN_WISHING, WAX_CANDLE, WEAPON_CLASS, WOOD, WORM_TOOTH, YELLOW_DRAGON_SCALES, ZOMBIFY_MON } from './nh-constants.js';
import { discover_object } from './o_init.js';
import { Doname2, The, Yname2, aobjnam, doname, erosion_matters, makeplural, makesingular, obj_typename, otense, rnd_class, safe_typename, simpleonames, vtense, xname } from './objnam.js';
import { encumber_msg } from './pickup.js';
import { forget_temple_entry } from './priest.js';
import { assign_candy_wrapper } from './read.js';
import { rn2, rnd, rne, rnz } from './rnd.js';
import { genders } from './role.js';
import { addtobill, alter_cost, billable, costly_adjacent, costly_spot, find_objowner, globby_bill_fixup, obfree, oid_price_adjustment, onshopbill, shop_keeper, splitbill, stolen_value, subfrombill, unpaid_cost } from './shk.js';
import { book_cursed } from './spell.js';
import { remove_worn_item } from './steal.js';
import { rloco } from './teleport.js';
import { attach_egg_hatch_timeout, attach_fig_transform_timeout, obj_split_timers, obj_stop_timers, start_timer, stop_timer } from './timeout.js';
import { tt_oname } from './topten.js';
import { block_point, recalc_block_point } from './vision.js';
import { setmnotwielded } from './weapon.js';
import { drop_uswapwep } from './wield.js';
import { extract_from_minvent } from './worn.js';
import { get_obj_location } from './zap.js';

// struct icp: { iprob, iclass }
/* probability of an item type */
/* item class */
const mkobjprobs = [{ iprob: 10, iclass: WEAPON_CLASS }, { iprob: 11, iclass: ARMOR_CLASS }, { iprob: 20, iclass: FOOD_CLASS }, { iprob: 8, iclass: TOOL_CLASS }, { iprob: 7, iclass: GEM_CLASS }, { iprob: 16, iclass: POTION_CLASS }, { iprob: 16, iclass: SCROLL_CLASS }, { iprob: 4, iclass: SPBOOK_CLASS }, { iprob: 4, iclass: WAND_CLASS }, { iprob: 3, iclass: RING_CLASS }, { iprob: 1, iclass: AMULET_CLASS }];
const boxiprobs = [{ iprob: 18, iclass: GEM_CLASS }, { iprob: 15, iclass: FOOD_CLASS }, { iprob: 18, iclass: POTION_CLASS }, { iprob: 18, iclass: SCROLL_CLASS }, { iprob: 12, iclass: SPBOOK_CLASS }, { iprob: 7, iclass: COIN_CLASS }, { iprob: 6, iclass: WAND_CLASS }, { iprob: 5, iclass: RING_CLASS }, { iprob: 1, iclass: AMULET_CLASS }];
const rogueprobs = [{ iprob: 12, iclass: WEAPON_CLASS }, { iprob: 12, iclass: ARMOR_CLASS }, { iprob: 22, iclass: FOOD_CLASS }, { iprob: 22, iclass: POTION_CLASS }, { iprob: 22, iclass: SCROLL_CLASS }, { iprob: 5, iclass: WAND_CLASS }, { iprob: 5, iclass: RING_CLASS }];
const hellprobs = [{ iprob: 20, iclass: WEAPON_CLASS }, { iprob: 20, iclass: ARMOR_CLASS }, { iprob: 16, iclass: FOOD_CLASS }, { iprob: 12, iclass: TOOL_CLASS }, { iprob: 10, iclass: GEM_CLASS }, { iprob: 1, iclass: POTION_CLASS }, { iprob: 1, iclass: SCROLL_CLASS }, { iprob: 8, iclass: WAND_CLASS }, { iprob: 8, iclass: RING_CLASS }, { iprob: 4, iclass: AMULET_CLASS }];
const zerooextra = { oname: null, omonst: null, omailcmd: null, omid: 0 };
export function init_oextra(oex) {
    Object.assign(oex, zerooextra);
}
export function newoextra() {
    let oextra = null;
    oextra = alloc(1 /* sizeof(struct oextra) */);
    init_oextra(oextra);
    return oextra;
}
export function dealloc_oextra(o) {
    let x = o.oextra;
    if (x) {
        if (x.oname) {
            free(x.oname) , x.oname = null;
        }
        if (x.omonst) {
            free_omonst(o);
        }
        /* note: pass 'o' rather than 'x' */
        if (x.omailcmd) {
            free(x.omailcmd) , x.omailcmd = null;
        }
        free(x);
        o.oextra = null;
    }
}
export function newomonst(otmp) {
    if (!otmp.oextra) {
        otmp.oextra = newoextra();
    }
    if (!((otmp).oextra.omonst)) {
        let m = alloc(1 /* sizeof(struct monst) */);
        Object.assign(m, cg.zeromonst);
        ((otmp).oextra.omonst) = m;
    }
}
export function free_omonst(otmp) {
    if (otmp.oextra) {
        let m = ((otmp).oextra.omonst);
        if (m) {
            if (m.mextra) {
                dealloc_mextra(m);
            }
            free(m);
            ((otmp).oextra.omonst) = null;
        }
    }
}
export function newomid(otmp) {
    if (!otmp.oextra) {
        otmp.oextra = newoextra();
    }
    ((otmp).oextra.omid) = 0;
}
export function free_omid(otmp) {
    ((otmp).oextra.omid) = 0;
}
export function new_omailcmd(otmp, response_cmd) {
    if (!otmp.oextra) {
        otmp.oextra = newoextra();
    }
    if (((otmp).oextra.omailcmd)) {
        free_omailcmd(otmp);
    }
    ((otmp).oextra.omailcmd) = dupstr(response_cmd);
}
export function free_omailcmd(otmp) {
    if (otmp.oextra && ((otmp).oextra.omailcmd)) {
        free(((otmp).oextra.omailcmd));
        ((otmp).oextra.omailcmd) = null;
    }
}
/* can object be generated eroded? */
export function may_generate_eroded(otmp) {
    if (game.moves <= 1 && !game.in_mklev) {
        return (0);
    }
    /* already erodeproof or cannot be eroded */
    if (otmp.oerodeproof || !erosion_matters(otmp) || !((game.objects[otmp.otyp].oc_material == IRON) || is_flammable(otmp) || is_rottable(otmp) || (game.objects[otmp.otyp].oc_material == COPPER || game.objects[otmp.otyp].oc_material == IRON) || (game.objects[(otmp).otyp].oc_material == GLASS && (otmp).oclass == ARMOR_CLASS))) {
        return (0);
    }
    /* part of a monster's body and produced when it dies */
    if (otmp.otyp == WORM_TOOTH || otmp.otyp == UNICORN_HORN) {
        return (0);
    }
    /* artifacts cannot be generated eroded  */
    if (otmp.oartifact) {
        return (0);
    }
    return (1);
}
/* random chance of applying erosions/grease to object */
export function mkobj_erosions(otmp) {
    if (may_generate_eroded(otmp)) {
        if (!rn2(100)) {
            /* A small fraction of non-artifact items will generate eroded or
         * possibly erodeproof. An item that generates eroded will never be
         * erodeproof, and vice versa. */
            otmp.oerodeproof = 1;
        } else {
            if (!rn2(80) && (is_flammable(otmp) || (game.objects[otmp.otyp].oc_material == IRON) || (game.objects[(otmp).otyp].oc_material == GLASS && (otmp).oclass == ARMOR_CLASS))) {
                do {
                    otmp.oeroded++;
                } while (otmp.oeroded < 3 && !rn2(9));
            }
            if (!rn2(80) && (is_rottable(otmp) || (game.objects[otmp.otyp].oc_material == COPPER || game.objects[otmp.otyp].oc_material == IRON))) {
                do {
                    otmp.oeroded2++;
                } while (otmp.oeroded2 < 3 && !rn2(9));
            }
        }
        /* and an extremely small fraction of the time, erodable items
         * will generate greased */
        if (!rn2(1000)) {
            otmp.greased = 1;
        }
    }
}
/* make a random object of class 'let' at a specific location;
   'let' might be random class; place_object() will validate <x,y> */
export function mkobj_at(let_, x, y, artif) {
    let otmp = null;
    otmp = mkobj(let_, artif);
    place_object(otmp, x, y);
    return otmp;
}
/* make a specific object at a specific location */
export function mksobj_at(otyp, x, y, init, artif) {
    traceCheckpoint('mksobj_at.call', { otyp, x, y, init: init|0 });
    let otmp = null;
    otmp = mksobj(otyp, init, artif);
    place_object(otmp, x, y);
    return otmp;
}
/* used for extra orctown loot */
export function mksobj_migr_to_species(otyp, mflags2, init, artif) {
    let otmp = null;
    otmp = mksobj(otyp, init, artif);
    add_to_migration(otmp);
    otmp.owornmask = 4096;
    otmp.corpsenm = mflags2;
    return otmp;
}
/* mkobj(): select a type of item from a class, use mksobj() to create it;
   result is always non-Null */
export function mkobj(oclass, artif) {
    fnEnter("mkobj", "mkobj.c", 0);
    let tprob = 0;
    let i = 0;
    let prob = 0;
    if (oclass == RANDOM_CLASS) {
        const _iprobs_arr = (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) ? rogueprobs : In_hell(game.u.uz) ? hellprobs : mkobjprobs;
        let _iprobs_i = 0;
        let iprobs = _iprobs_arr[0];
        for (tprob = rnd(100); (tprob -= iprobs.iprob) > 0; iprobs = _iprobs_arr[++_iprobs_i]) ;
        oclass = iprobs.iclass;
    }
    if (oclass == (0 - SPBOOK_CLASS)) {
        i = rnd_class(game.bases[SPBOOK_CLASS], SPE_BLANK_PAPER);
        oclass = SPBOOK_CLASS;
    } else {
        prob = rnd(game.oclass_prob_totals[oclass]);
        i = game.bases[oclass];
        while ((prob -= game.objects[i].oc_prob) > 0) {
            ++i;
        }
    }
    if (game.objects[i].oc_class != oclass || !(game.obj_descr[(game.objects[i]).oc_name_idx].oc_name)) {
        impossible("probtype error, oclass=%d i=%d", oclass, i);
        i = game.bases[oclass];
    }
    return mksobj(i, (1), artif);
}
export function mkbox_cnts(box) {
    let n = 0;
    let otmp = null;
    box.cobj = null;
    switch (box.otyp) {
        case ICE_BOX:
            n = 20;
            /* boulder init'd below in the 'regardless of !init' code */
            /* overloads corpsenm, which was set to NON_PM */
            break;
        case CHEST:
            n = box.olocked ? 7 : 5;
            break;
        case LARGE_BOX:
            n = box.olocked ? 5 : 3;
            break;
        case SACK:
        case OILSKIN_SACK:
            if (game.moves <= 1 && !game.in_mklev) {
                /* initial inventory: sack starts out empty */
                n = 0;
                break;
            }
            ;
        case BAG_OF_HOLDING:
            n = 1;
            break;
        /* stone sink is iffy; metal might be more appropriate */
        default:
            n = 0;
            break;
    }
    /* caller will update box->owt */
    for (n = rn2(n + 1); n > 0; n--) {
        if (box.otyp == ICE_BOX) {
            otmp = mksobj(CORPSE, (1), (0));
            /* Note: setting age to 0 is correct.  Age has a different
             * from usual meaning for objects stored in ice boxes. -KAA
             */
            otmp.age = 0;
            if (otmp.timed) {
                stop_timer(ROT_CORPSE, obj_to_any(otmp));
                stop_timer(REVIVE_MON, obj_to_any(otmp));
                stop_timer(SHRINK_GLOB, obj_to_any(otmp));
            }
        } else {
            let tprob = 0;
            const _iprobs_arr = boxiprobs;
            let _iprobs_i = 0;
            let iprobs = _iprobs_arr[0];
            for (tprob = rnd(100); (tprob -= iprobs.iprob) > 0; iprobs = _iprobs_arr[++_iprobs_i]) ;
            if (!(otmp = mkobj(iprobs.iclass, (0)))) {
                continue;
            }
            if (otmp.oclass == COIN_CLASS) {
                /* handle a couple of special cases */
                /* 2.5 x level's usual amount; weight adjusted below */
                otmp.quan = (rnd(level_difficulty() + 2) * rnd(75));
                otmp.owt = weight(otmp);
            } else {
                while (otmp.otyp == ROCK) {
                    otmp.otyp = rnd_class(DILITHIUM_CRYSTAL, LOADSTONE);
                    if (otmp.quan > 2) {
                        /* for emphasis; glob quantity is always 1 and weight varies
               when other globs coalesce with it or this one shrinks */
                        otmp.quan = 1;
                    }
                    otmp.owt = weight(otmp);
                }
            }
            if (box.otyp == BAG_OF_HOLDING) {
                if (((otmp).otyp == BAG_OF_HOLDING || (otmp).otyp == BAG_OF_TRICKS)) {
                    otmp.otyp = SACK;
                    otmp.spe = 0;
                    otmp.owt = weight(otmp);
                } else {
                    while (otmp.otyp == WAN_CANCELLATION) {
                        otmp.otyp = rnd_class(WAN_LIGHT, WAN_LIGHTNING);
                    }
                }
            }
        }
        add_to_container(box, otmp);
    }
}
/* select a random, common monster type */
export function rndmonnum() {
    return rndmonnum_adj(0, 0);
}
/* select a random, common monster type, with adjusted difficulty */
export function rndmonnum_adj(minadj, maxadj) {
    let ptr = null;
    let i = 0;
    let excludeflags = 0;
    /* Plan A: get a level-appropriate common monster */
    ptr = rndmonst_adj(minadj, maxadj);
    if (ptr) {
        return ((ptr).pmidx);
    }
    /* Plan B: get any common monster */
    excludeflags = 4096 | 512 | (In_hell(game.u.uz) ? 2048 : 1024);
    do {
        i = (rn2(SPECIAL_PM - LOW_PM) + (LOW_PM));
        ptr = game.mons[i];
    } while ((ptr.geno & excludeflags) != 0);
    return i;
}
export function copy_oextra(obj2, obj1) {
    if (!obj2 || !obj1 || !obj1.oextra) {
        /* old timer is gone, don't start a new one */
        return;
    }
    if (!obj2.oextra) {
        obj2.oextra = newoextra();
    }
    if (((obj1).oextra && ((obj1).oextra.oname))) {
        oname(obj2, ((obj1).oextra.oname), 512);
    }
    if (((obj1).oextra && ((obj1).oextra.omonst))) {
        if (!((obj2).oextra.omonst)) {
            newomonst(obj2);
        }
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        memcpy(((obj2).oextra.omonst), ((obj1).oextra.omonst), 1 /* sizeof(struct monst) */);
        ((obj2).oextra.omonst).mextra = null;
        ((obj2).oextra.omonst).nmon = null;
        if (((obj1).oextra.omonst).mextra) {
            copy_mextra(((obj2).oextra.omonst), ((obj1).oextra.omonst));
        }
    }
    if (((obj1).oextra && ((obj1).oextra.omailcmd))) {
        new_omailcmd(obj2, ((obj1).oextra.omailcmd));
    }
    if (((obj1).oextra && ((obj1).oextra.omid))) {
        if (!((obj2).oextra.omid)) {
            newomid(obj2);
        }
        ((obj2).oextra.omid) = ((obj1).oextra.omid);
    }
}
/*
 * Split stack so that its size gets reduced by num.  The quantity num is
 * put in the object structure delivered by this call.  The returned object
 * has its wornmask cleared and is positioned just following the original
 * in the nobj chain (and nexthere chain when on the floor).
 */
export function splitobj(obj, num) {
    let otmp = null;
    if (obj.cobj || num <= 0 || obj.quan <= num) {
        panic("splitobj [cobj=%s num=%ld quan=%ld]", obj.cobj ? "non-empty container" : "(null)", num, obj.quan);
    }
    otmp = Object.assign(alloc(1), { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null });
    Object.assign(otmp, obj);
    otmp.v = { v_nexthere: obj.v.v_nexthere, v_ocontainer: obj.v.v_ocontainer, v_ocarry: obj.v.v_ocarry };
    otmp.oextra = null;
    otmp.o_id = nextoid(obj, otmp);
    otmp.timed = 0;
    otmp.lamplit = 0;
    otmp.owornmask = 0;
    obj.quan -= num;
    obj.owt = weight(obj);
    otmp.quan = num;
    otmp.owt = weight(otmp);
    otmp.lua_ref_cnt = 0;
    otmp.pickup_prev = 0;
    game.context.objsplit.parent_oid = obj.o_id;
    game.context.objsplit.child_oid = otmp.o_id;
    obj.nobj = otmp;
    /* Only set nexthere when on the floor; nexthere is also used
       as a back pointer to the container object when contained.
       For either case, otmp's nexthere pointer is already pointing
       at the right thing. */
    if (obj.where == 1) {
        obj.v.v_nexthere = otmp;
    }
    /* insert into chain: obj -> otmp -> next */
    /* lua isn't tracking the split off portion even if it happens to
       be tracking the original */
    if (otmp.where == 8) {
        otmp.where = 0;
    }
    if (obj.unpaid) {
        splitbill(obj, otmp);
    }
    copy_oextra(otmp, obj);
    if (((otmp).oextra && ((otmp).oextra.omid))) {
        free_omid(otmp);
    }
    /* only one association with m_id */
    if (obj.timed) {
        obj_split_timers(obj, otmp);
    }
    if (obj_sheds_light(obj)) {
        obj_split_light_source(obj, otmp);
    }
    return otmp;
}
/* return the value of context.ident and then increment it to be ready for
   its next use; used to be simple += 1 so that every value from 1 to N got
   used but now has a random increase that skips half of potential values */
export function next_ident() {
    let res = game.context.ident;
    /* +rnd(2): originally just +1; changed to rnd() to avoid potential
       exploit of player using #adjust to split an object stack in a manner
       that makes most recent ident%2 known; since #adjust takes no time,
       no intervening activity like random creation of a new monster will
       take place before next user command; with former +1, o_id%2 of the
       next object to be created was knowable and player could make a wish
       under controlled circumstances for an item that is affected by the
       low bits of its obj->o_id [particularly helm of opposite alignment] */
    /* ready for next new object or monster */
    game.context.ident += rnd(2);
    /* if ident has wrapped to 0, force it to be non-zero; if/when it
       ever wraps past 0 (unlikely, but possible on a configuration which
       uses 16-bit 'int'), just live with that and hope no o_id conflicts
       between objects or m_id conflicts between monsters arise */
    if (!game.context.ident) {
        game.context.ident = rnd(2) + 1;
    }
    return res;
}
/* when splitting a stack that has o_id-based shop prices, pick an
   o_id value for the new stack that will maintain the same price */
export function nextoid(oldobj, newobj) {
    /* limit of 4 suffices at present */
    let olddif = 0;
    let newdif = 0;
    let trylimit = 256;
    /* loop increment will reverse -1 */
    let oid = game.context.ident - 1;
    olddif = oid_price_adjustment(oldobj, oldobj.o_id);
    do {
        ++oid;
        /* avoid using 0 (in case value wrapped) */
        if (!oid) {
            ++oid;
        }
        newdif = oid_price_adjustment(newobj, oid);
    } while (newdif != olddif && --trylimit >= 0);
    /* update 'last ident used' */
    game.context.ident = oid;
    /* increment context.ident for next use */
    next_ident();
    /* caller will use this ident */
    return oid;
}
/* try to find the stack obj was split from, then merge them back together;
   returns the combined object if unsplit is successful, null otherwise */
export function unsplitobj(obj) {
    let target_oid = 0;
    let oparent = null;
    let ochild = null;
    let list = null;
    switch (obj.where) {
        /*
     * We don't operate on floor objects (we're following o->nobj rather
     * than o->nexthere), on free objects (don't know which list to use when
     * looking for obj's parent or child), on bill objects (too complicated,
     * not needed), or on buried or migrating objects (not needed).
     * [This could be improved, but at present additional generality isn't
     * necessary.]
     */
        case 0:
        case 1:
        case 7:
        case 5:
        case 6:
        default:
            return null;
        case 3:
            list = game.invent;
            break;
        case 4:
            list = obj.v.v_ocarry.minvent;
            break;
        case 2:
            list = obj.v.v_ocontainer.cobj;
            break;
    }
    if (obj.o_id == game.context.objsplit.child_oid) {
        /* first try the expected case; obj is split from another stack */
        /* parent probably precedes child and will require list traversal */
        ochild = obj;
        target_oid = game.context.objsplit.parent_oid;
        if (obj.nobj && obj.nobj.o_id == target_oid) {
            oparent = obj.nobj;
        }
    } else if (obj.o_id == game.context.objsplit.parent_oid) {
        /* alternate scenario: another stack was split from obj;
           child probably follows parent and will be found here */
        oparent = obj;
        target_oid = game.context.objsplit.child_oid;
        if (obj.nobj && obj.nobj.o_id == target_oid) {
            ochild = obj.nobj;
        }
    }
    if (ochild && !oparent) {
        for (obj = list; obj; obj = obj.nobj) {
            if (obj.o_id == target_oid) {
                /* if we have only half the split, scan obj's list to find other half */
                oparent = obj;
                break;
            }
        }
    } else if (oparent && !ochild) {
        for (obj = list; obj; obj = obj.nobj) {
            if (obj.o_id == target_oid) {
                ochild = obj;
                break;
            }
        }
    }
    /* if we have both parent and child, try to merge them;
       if successful, return the combined stack, otherwise return null */
    return (oparent && ochild && merged({ get value() { return oparent; }, set value(_v) { oparent = _v; } }, ochild)) ? oparent : null;
}
/* reset splitobj()/unsplitobj() context */
export function clear_splitobjs() {
    game.context.objsplit.parent_oid = game.context.objsplit.child_oid = 0;
}
/*
 * Insert otmp right after obj in whatever chain(s) it is on.  Then extract
 * obj from the chain(s).  This function does a literal swap.  It is up to
 * the caller to provide a valid context for the swap.  When done, obj will
 * still exist, but not on any chain.
 *
 * Note:  Don't use obj_extract_self() -- we are doing an in-place swap,
 * not actually moving something.
 */
export function replace_object(obj, otmp) {
    otmp.where = obj.where;
    switch (obj.where) {
        case 0:
            break;
        case 3:
            otmp.nobj = obj.nobj;
            obj.nobj = otmp;
            extract_nobj(obj, { get value() { return game.invent; }, set value(_v) { game.invent = _v; } });
            break;
        case 2:
            otmp.nobj = obj.nobj;
            otmp.v.v_ocontainer = obj.v.v_ocontainer;
            obj.nobj = otmp;
            extract_nobj(obj, { get value() { return obj.v.v_ocontainer.cobj; }, set value(_v) { obj.v.v_ocontainer.cobj = _v; } });
            break;
        case 4:
            otmp.nobj = obj.nobj;
            otmp.v.v_ocarry = obj.v.v_ocarry;
            obj.nobj = otmp;
            extract_nobj(obj, { get value() { return obj.v.v_ocarry.minvent; }, set value(_v) { obj.v.v_ocarry.minvent = _v; } });
            break;
        case 1:
            otmp.nobj = obj.nobj;
            otmp.v.v_nexthere = obj.v.v_nexthere;
            otmp.ox = obj.ox;
            otmp.oy = obj.oy;
            obj.nobj = otmp;
            obj.v.v_nexthere = otmp;
            extract_nobj(obj, { get value() { return game.level.objlist; }, set value(_v) { game.level.objlist = _v; } });
            extract_nexthere(obj, { get value() { return game.level.objects[obj.ox][obj.oy]; }, set value(_v) { game.level.objects[obj.ox][obj.oy] = _v; } });
            break;
        default:
            panic("replace_object: obj position");
            break;
    }
}
/* is 'obj' inside a container whose contents aren't known?
   if so, return the outermost container meeting that criterium */
export function unknwn_contnr_contents(obj) {
    let result = null;
    let parent = null;
    while (obj.where == 2) {
        parent = obj.v.v_ocontainer;
        if (!parent.cknown) {
            result = parent;
        }
        obj = parent;
    }
    return result;
}
/*
 * Create a dummy duplicate to put on shop bill.  The duplicate exists
 * only in the billobjs chain.  This function is used when a shop object
 * is being altered, and a copy of the original is needed for billing
 * purposes.  For example, when eating, where an interruption will yield
 * an object which is different from what it started out as; the "I x"
 * command needs to display the original object.
 *
 * The caller is responsible for checking otmp->unpaid and
 * costly_spot(u.ux, u.uy).  This function will make otmp no charge.
 *
 * Note that check_unpaid_usage() should be used instead for partial
 * usage of an object.
 */
export function bill_dummy_object(otmp) {
    let dummy = null;
    let cost = 0;
    if (otmp.unpaid) {
        cost = unpaid_cost(otmp, COST_SINGLEOBJ);
        subfrombill(otmp, shop_keeper(game.u.ushops));
    }
    dummy = Object.assign(alloc(1), { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null });
    Object.assign(dummy, otmp);
    dummy.oextra = null;
    dummy.where = 0;
    dummy.o_id = nextoid(otmp, dummy);
    dummy.timed = 0;
    copy_oextra(dummy, otmp);
    if (((dummy).oextra && ((dummy).oextra.omid))) {
        free_omid(dummy);
    }
    if ((dummy.otyp == TALLOW_CANDLE || dummy.otyp == WAX_CANDLE)) {
        dummy.lamplit = 0;
    }
    /* dummy object is not worn */
    dummy.owornmask = 0;
    addtobill(dummy, (0), (1), (1));
    if (cost && dummy.where != 9) {
        alter_cost(dummy, -cost);
    }
    /* no_charge is only valid for some locations */
    otmp.no_charge = (otmp.where == 1 || otmp.where == 2) ? 1 : 0;
    otmp.unpaid = 0;
    return;
}
/* alteration types; must match COST_xxx macros in hack.h */
const alteration_verbs = ["cancel", "drain", "uncharge", "unbless", "uncurse", "disenchant", "degrade", "dilute", "erase", "burn", "neutralize", "destroy", "splatter", "bite", "open", "break the lock on", "rust", "rot", "tarnish", "crack"];
/* possibly bill for an object which the player has just modified */
export function costly_alteration(obj, alter_type) {
    /* coordinates for the glob that goes away */
    let ox = 0;
    let oy = 0;
    let objroom = 0;
    let learn_bknown = 0;
    let those = null;
    let them = null;
    let shkp = null;
    if (alter_type < 0 || alter_type >= (Math.trunc(20 /* sizeof(const char *const [20]) */ / 1 /* sizeof(const char *const) */))) {
        impossible("invalid alteration type (%d)", alter_type);
        alter_type = 0;
    }
    ox = oy = 0;
    objroom = 0;
    if (((obj).where == 3) || obj.where == 0) {
        /* OBJ_FREE catches obj_no_longer_held()'s transformation
           of crysknife back into worm tooth; the object has been
           removed from inventory but not necessarily placed at
           its new location yet--the unpaid flag will still be set
           if this item is owned by a shop */
        if (!obj.unpaid) {
            return;
        }
    } else {
        /* this get_obj_location shouldn't fail, but if it does,
           use hero's location */
        if (!get_obj_location(obj, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 1)) {
            ox = game.u.ux , oy = game.u.uy;
        }
        if (!costly_spot(ox, oy)) {
            return;
        }
        objroom = in_rooms(ox, oy, SHOPBASE);
        /* if no shop cares about it, we're done */
        if (!billable({ get value() { return shkp; }, set value(_v) { shkp = _v; } }, obj, objroom, (0))) {
            return;
        }
    }
    if (obj.quan == 1) {
        those = "that" , them = "it";
    } else {
        those = "those" , them = "them";
    }
    /* when shopkeeper describes the object as being uncursed or unblessed
       hero will know that it is now uncursed; will also make the feedback
       from `I x' after bill_dummy_object() be more specific for this item */
    learn_bknown = (alter_type == COST_UNCURS || alter_type == COST_UNBLSS);
    switch (obj.where) {
        case 0:
        case 3:
            if (learn_bknown) {
                set_bknown(obj, 1);
            }
            if (shkp) {
                ;
            }
            verbalize("You %s %s %s, you pay for %s!", alteration_verbs[alter_type], those, simpleonames(obj), them);
            bill_dummy_object(obj);
            break;
        case 1:
            if (learn_bknown) {
                obj.bknown = 1;
            }
            if (costly_spot(game.u.ux, game.u.uy) && objroom == game.u.ushops) {
                /* ok to bypass set_bknown() here */
                if (shkp) {
                    ;
                }
                verbalize("You %s %s, you pay for %s!", alteration_verbs[alter_type], those, them);
                bill_dummy_object(obj);
            } else {
                stolen_value(obj, ox, oy, (0), (0));
            }
            break;
    }
}
const dknowns = [WAND_CLASS, RING_CLASS, POTION_CLASS, SCROLL_CLASS, GEM_CLASS, SPBOOK_CLASS, WEAPON_CLASS, TOOL_CLASS, VENOM_CLASS, 0];
/* set obj->dknown to 0 for most types of objects, to 1 otherwise;
   split off from unknow_object() */
export function clear_dknown(obj) {
    /* note: this is an unobserving not an observing, so don't call
       observe_object even if dknown is being set to 1 */
    obj.dknown = strchr(dknowns, obj.oclass) ? 0 : 1;
    if ((obj.otyp >= ELVEN_SHIELD && obj.otyp <= ORCISH_SHIELD) || obj.otyp == SHIELD_OF_REFLECTION || game.objects[obj.otyp].oc_merge) {
        obj.dknown = 0;
    }
    /* globs always have dknown flag set (to maximize merging) but for new
       object, globby flag won't be set yet so isn't available to check */
    if ((obj.otyp == GLOB_OF_GRAY_OOZE || obj.otyp == GLOB_OF_BROWN_PUDDING || obj.otyp == GLOB_OF_GREEN_SLIME || obj.otyp == GLOB_OF_BLACK_PUDDING)) {
        obj.dknown = 1;
    }
}
/* some init for a brand new object, or partial re-init when hero loses
   potentially known info about an object (called when an unseen monster
   picks up or uses it); moved from invent.c to here for access to dknowns */
export function unknow_object(obj) {
    clear_dknown(obj);
    obj.bknown = obj.rknown = 0;
    obj.cknown = obj.lknown = 0;
    obj.tknown = 0;
    /* for an existing object, awareness of charges or enchantment has
       gone poof...  [object types which don't use the known flag have
       it set True for some reason] */
    obj.known = game.objects[obj.otyp].oc_uses_known ? 0 : 1;
}
/* do some initialization to newly created object; otyp must already be set */
export function mksobj_init(obj, artif) {
    fnEnter("mksobj_init", "mkobj.c", 0);
    let mndx = 0;
    let tryct = 0;
    let otmp = obj.value;
    let let_ = game.objects[otmp.otyp].oc_class;
    switch (let_) {
        case WEAPON_CLASS:
            otmp.quan = (otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp >= -P_SHURIKEN && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) ? (rn2(6) + (6)) : 1;
            if (!rn2(11)) {
                otmp.spe = rne(3);
                otmp.blessed = rn2(2);
            } else if (!rn2(10)) {
                curse(otmp);
                otmp.spe = -rne(3);
            } else {
                blessorcurse(otmp, 10);
            }
            if (((otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp >= -P_SHURIKEN && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) || permapoisoned(otmp)) && !rn2(100)) {
                otmp.otrapped = 1;
            }
            if (artif && !rn2(20 + (10 * nartifact_exist()))) {
                /* mk_artifact() with otmp and A_NONE will never return NULL */
                otmp = mk_artifact(otmp, (-128), 99, (1));
                obj.value = otmp;
            }
            break;
        case FOOD_CLASS:
            otmp.oeaten = 0;
            switch (otmp.otyp) {
                case CORPSE:
                    tryct = 50;
                    do {
                        /* some things must get done (corpsenm, timers) even if init = 0 */
                        otmp.corpsenm = undead_to_corpse(rndmonnum());
                    } while ((game.mvitals[otmp.corpsenm].mvflags & 16) && (--tryct > 0));
                    if (tryct == 0) {
                        /* possibly overridden by mkcorpstat() */
                        /* perhaps rndmonnum() only wants to make G_NOCORPSE
                   monsters on this svl.level; create an adventurer's
                   corpse instead, then */
                        otmp.corpsenm = PM_HUMAN;
                    }
                    break;
                case EGG:
                    otmp.corpsenm = NON_PM;
                    if (!rn2(3)) {
                        for (tryct = 200; tryct > 0; --tryct) {
                            mndx = can_be_hatched(rndmonnum());
                            if (mndx != NON_PM && !dead_species(mndx, (1))) {
                                otmp.corpsenm = mndx;
                                break;
                            }
                        }
                    }
                    break;
                case TIN:
                    otmp.corpsenm = NON_PM;
                    if (!rn2(6)) {
                        set_tin_variety(otmp, (-1));
                    } else {
                        for (tryct = 200; tryct > 0; --tryct) {
                            mndx = undead_to_corpse(rndmonnum());
                            if (game.mons[mndx].cnutrit && !(game.mvitals[mndx].mvflags & 16)) {
                                otmp.corpsenm = mndx;
                                set_tin_variety(otmp, (-2));
                                break;
                            }
                        }
                    }
                    blessorcurse(otmp, 10);
                    break;
                case SLIME_MOLD:
                    otmp.spe = game.context.current_fruit;
                    game.flags.made_fruit = (1);
                    break;
                case KELP_FROND:
                    otmp.quan = rnd(2);
                    break;
                case CANDY_BAR:
                    assign_candy_wrapper(otmp);
                    break;
                default:
                    break;
            }
            if ((otmp.otyp == GLOB_OF_GRAY_OOZE || otmp.otyp == GLOB_OF_BROWN_PUDDING || otmp.otyp == GLOB_OF_GREEN_SLIME || otmp.otyp == GLOB_OF_BLACK_PUDDING)) {
                otmp.globby = 1;
                otmp.quan = 1;
                /* 5.0: globs in 3.6.x left owt as 0 and let weight() fix
               that up during 'obj->owt = weight(obj)' below, but now
               we initialize glob->owt explicitly so weight() doesn't
               need to perform any fix up and returns glob->owt as-is */
                otmp.owt = game.objects[otmp.otyp].oc_weight;
                /* dknown, but not observed */
                otmp.known = otmp.dknown = 1;
                otmp.corpsenm = PM_GRAY_OOZE + (otmp.otyp - GLOB_OF_GRAY_OOZE);
                start_glob_timeout(otmp, 0);
            } else {
                if (otmp.otyp != CORPSE && otmp.otyp != MEAT_RING && otmp.otyp != KELP_FROND && !rn2(6)) {
                    otmp.quan = 2;
                }
            }
            break;
        case GEM_CLASS:
            otmp.corpsenm = 0;
            if (otmp.otyp == LOADSTONE) {
                curse(otmp);
            } else if (otmp.otyp == ROCK) {
                otmp.quan = (rn2(6) + (6));
            } else if (otmp.otyp != LUCKSTONE && !rn2(6)) {
                otmp.quan = 2;
            } else {
                otmp.quan = 1;
            }
            break;
        case TOOL_CLASS:
            switch (otmp.otyp) {
                case TALLOW_CANDLE:
                case WAX_CANDLE:
                    otmp.spe = 1;
                    otmp.age = 20 * game.objects[otmp.otyp].oc_cost;
                    otmp.lamplit = 0;
                    otmp.quan = 1 + (rn2(2) ? rn2(7) : 0);
                    blessorcurse(otmp, 5);
                    break;
                case BRASS_LANTERN:
                case OIL_LAMP:
                    otmp.spe = 1;
                    otmp.age = (rn2(500) + (1000));
                    otmp.lamplit = 0;
                    blessorcurse(otmp, 5);
                    break;
                case MAGIC_LAMP:
                    otmp.spe = 1;
                    otmp.lamplit = 0;
                    blessorcurse(otmp, 2);
                    break;
                case CHEST:
                case LARGE_BOX:
                    otmp.olocked = !!(rn2(5));
                    otmp.otrapped = !(rn2(10));
                    otmp.tknown = otmp.otrapped && !rn2(100);
                    ;
                case ICE_BOX:
                case SACK:
                case OILSKIN_SACK:
                case BAG_OF_HOLDING:
                    mkbox_cnts(otmp);
                    break;
                case EXPENSIVE_CAMERA:
                case TINNING_KIT:
                case MAGIC_MARKER:
                    otmp.spe = (rn2(70) + (30));
                    break;
                case CAN_OF_GREASE:
                    otmp.spe = (rn2(21) + (5));
                    blessorcurse(otmp, 10);
                    break;
                case CRYSTAL_BALL:
                    otmp.spe = (rn2(5) + (3));
                    blessorcurse(otmp, 2);
                    break;
                case HORN_OF_PLENTY:
                case BAG_OF_TRICKS:
                    otmp.spe = (rn2(18) + (3));
                    break;
                case FIGURINE:
                    tryct = 0;
                    /* figurines are slightly harder monsters */
                    do {
                        otmp.corpsenm = rndmonnum_adj(5, 10);
                    } while ((((game.mons[otmp.corpsenm]).mflags2 & 8) != 0) && tryct++ < 30);
                    blessorcurse(otmp, 4);
                    break;
                case BELL_OF_OPENING:
                    otmp.spe = 3;
                    break;
                case MAGIC_FLUTE:
                case MAGIC_HARP:
                case FROST_HORN:
                case FIRE_HORN:
                case DRUM_OF_EARTHQUAKE:
                    otmp.spe = (rn2(5) + (4));
                    break;
            }
            break;
        case AMULET_CLASS:
            if (otmp.otyp == AMULET_OF_YENDOR) {
                game.context.made_amulet = (1);
            }
            if (rn2(10) && (otmp.otyp == AMULET_OF_STRANGULATION || otmp.otyp == AMULET_OF_CHANGE || otmp.otyp == AMULET_OF_RESTFUL_SLEEP)) {
                curse(otmp);
            } else {
                blessorcurse(otmp, 10);
            }
            break;
        case VENOM_CLASS:
        case CHAIN_CLASS:
        case BALL_CLASS:
            break;
        /* note: potions get some additional init below */
        case POTION_CLASS:
        case SCROLL_CLASS:
            if (otmp.otyp != SCR_MAIL) {
                blessorcurse(otmp, 4);
            }
            break;
        case SPBOOK_CLASS:
            otmp.usecount = 0;
            blessorcurse(otmp, 17);
            break;
        case ARMOR_CLASS:
            if (rn2(10) && (otmp.otyp == FUMBLE_BOOTS || otmp.otyp == LEVITATION_BOOTS || otmp.otyp == HELM_OF_OPPOSITE_ALIGNMENT || otmp.otyp == GAUNTLETS_OF_FUMBLING || !rn2(11))) {
                curse(otmp);
                otmp.spe = -rne(3);
            } else if (!rn2(10)) {
                otmp.blessed = rn2(2);
                otmp.spe = rne(3);
            } else {
                blessorcurse(otmp, 10);
            }
            if (artif && !rn2(40 + (10 * nartifact_exist()))) {
                otmp = mk_artifact(otmp, (-128), 99, (1));
                obj.value = otmp;
            }
            if ((game.urole.mnum == (PM_SAMURAI)) && otmp.otyp == SPLINT_MAIL && (game.moves <= 1 || In_quest(game.u.uz))) {
                /* simulate lacquered armor for samurai */
                otmp.oerodeproof = otmp.rknown = 1;
            }
            break;
        case WAND_CLASS:
            if (otmp.otyp == WAN_WISHING) {
                otmp.spe = 1;
            } else if (otmp.otyp == WAN_STASIS) {
                otmp.spe = (rn2(4) + (3));
            /* just as easy to recharge as other NODIR wands, but starts with
               fewer charges */
            } else {
                otmp.spe = (rn2(5) + ((game.objects[otmp.otyp].oc_dir == 1) ? 11 : 4));
            }
            blessorcurse(otmp, 17);
            /* used to control recharging */
            otmp.recharged = 0;
            break;
        case RING_CLASS:
            if (game.objects[otmp.otyp].oc_charged) {
                blessorcurse(otmp, 3);
                if (rn2(10)) {
                    if (rn2(10) && bcsign(otmp)) {
                        otmp.spe = bcsign(otmp) * rne(3);
                    } else {
                        otmp.spe = rn2(2) ? rne(3) : -rne(3);
                    }
                }
                /* make useless +0 rings much less common */
                if (otmp.spe == 0) {
                    otmp.spe = rn2(4) - rn2(3);
                }
                /* negative rings are usually cursed */
                if (otmp.spe < 0 && rn2(5)) {
                    curse(otmp);
                }
            } else if (rn2(10) && (otmp.otyp == RIN_TELEPORTATION || otmp.otyp == RIN_POLYMORPH || otmp.otyp == RIN_AGGRAVATE_MONSTER || otmp.otyp == RIN_HUNGER || !rn2(9))) {
                curse(otmp);
            }
            break;
        case ROCK_CLASS:
            if (otmp.otyp == STATUE) {
                otmp.corpsenm = rndmonnum();
                if (!((game.mons[otmp.corpsenm]).msize < 1) && rn2(Math.trunc(level_difficulty() / 2) + 10) > 10) {
                    add_to_container(otmp, mkobj((0 - SPBOOK_CLASS), (0)));
                }
            }
            break;
        case COIN_CLASS:
            break;
        default:
            panic("mksobj tried to make type %d, class %d.", otmp.otyp, game.objects[otmp.otyp].oc_class);
    }
    mkobj_erosions(otmp);
    if (permapoisoned(otmp)) {
        otmp.otrapped = 1;
    }
}
/* mksobj(): create a specific type of object; result is always non-Null */
export function mksobj(otyp, init, artif) {
    fnEnter("mksobj", "mkobj.c", 0);
    let otmp = null;
    let let_ = game.objects[otyp].oc_class;
    otmp = Object.assign(alloc(1), { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null });
    Object.assign(otmp, cg.zeroobj);
    otmp.v = { v_nexthere: null, v_ocontainer: null, v_ocarry: null };
    otmp.age = ((game.moves) > (1) ? (game.moves) : (1));
    otmp.o_id = next_ident();
    otmp.quan = 1;
    otmp.oclass = let_;
    otmp.otyp = otyp;
    otmp.where = 0;
    /* set up dknown and known: non-0 for some things */
    unknow_object(otmp);
    otmp.corpsenm = NON_PM;
    otmp.lua_ref_cnt = 0;
    otmp.pickup_prev = 0;
    if (init) {
        mksobj_init({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, artif);
    }
    switch ((otmp.oclass == POTION_CLASS && otmp.otyp != POT_OIL) ? POT_WATER : otmp.otyp) {
        case CORPSE:
            if (otmp.corpsenm == NON_PM) {
                otmp.corpsenm = undead_to_corpse(rndmonnum());
                if (game.mvitals[otmp.corpsenm].mvflags & (16 | (2 | 1))) {
                    otmp.corpsenm = game.urole.mnum;
                }
            }
            ;
        case STATUE:
        case FIGURINE:
            if (otmp.corpsenm == NON_PM) {
                otmp.corpsenm = rndmonnum();
            }
            if (otmp.corpsenm != NON_PM) {
                let ptr = game.mons[otmp.corpsenm];
                otmp.spe = ((((ptr).mflags2 & 262144) != 0) ? 3 : (((ptr).mflags2 & 131072) != 0) ? 1 : (((ptr).mflags2 & 65536) != 0) ? 2 : rn2(2) ? 1 : 2);
            }
            ;
        case EGG:
            set_corpsenm(otmp, otmp.corpsenm);
            break;
        case BOULDER:
            otmp.corpsenm = 0;
            break;
        case POT_OIL:
            otmp.age = 400;
            ;
        case POT_WATER:
            otmp.corpsenm = 0;
            break;
        case LEASH:
            otmp.corpsenm = 0;
            break;
        case SPE_NOVEL:
            otmp.corpsenm = -1;
            /* "none of the above"; will be changed */
            otmp = oname(otmp, noveltitle({ get value() { return otmp.corpsenm; }, set value(_v) { otmp.corpsenm = _v; } }), 0);
            break;
    }
    if (game.objects[otyp].oc_unique && !otmp.oartifact) {
        /* unique objects may have an associated artifact entry */
        otmp = mk_artifact(otmp, (-128), 99, (0));
    }
    otmp.owt = weight(otmp);
    return otmp;
}
/* potential mimic shapes that should be undone by stone-to-flesh;
   not used for objects that will be transformed when hit by stone-to-flesh */
export function stone_object_type(mappearance) {
    let otyp = mappearance;
    /* we exclude wands, rings, and gems even though some qualify as stone;
       there aren't any weapons or armor classified as made out of stone */
    return (otyp == BOULDER || otyp == STATUE || otyp == FIGURINE);
}
/* possible mimic shapes that are affected by stone-to-flesh;
   mappearance for furniture is a display symbol rather than a terrain type */
export function stone_furniture_type(mappearance) {
    let sym = mappearance;
    switch (sym) {
        case S_upstair:
        case S_dnstair:
        case S_brupstair:
        case S_brdnstair:
        case S_altar:
        case S_throne:
        case S_sink:
            return (1);
        default:
            if (sym >= S_vwall && sym <= S_trwall) {
                return (1);
            }
            break;
    }
    return (0);
}
/*
 * Several areas of the code made direct reassignments
 * to obj->corpsenm.  Because some special handling is
 * required in certain cases, place that handling here
 * and call this routine in place of the direct assignment.
 *
 * If the object was a lizard or lichen corpse:
 *     - ensure that you don't end up with some
 *       other corpse type which has no rot-away timer.
 *
 * If the object was a troll corpse:
 *     - ensure that you don't end up with some other
 *       corpse type which resurrects from the dead.
 *
 * Re-calculates the weight of figurines and corpses to suit the
 * new species.
 *
 * Existing timeout value for egg hatch is preserved.
 *
 */
export function set_corpsenm(obj, id) {
    let old_id = obj.corpsenm;
    let when = 0;
    if (obj.timed) {
        if (obj.otyp == EGG) {
            when = stop_timer(HATCH_EGG, obj_to_any(obj));
        } else {
            when = 0;
            obj_stop_timers(obj);
        }
    }
    if (obj.otyp == CORPSE && obj.oeaten != 0 && game.mons[old_id].cnutrit != game.mons[id].cnutrit) {
        /* oeaten is used to determine how much nutrition is left in
       multiple-bite food and also used to derive how many hit points
       a creature resurrected from a partly eaten corpse gets; latter
       is of interest when a <foo> corpse revives as a <foo> zombie
       in case they are defined with different mons[].cnutrit values */
        /* when oeaten is non-zero, index old_id can't be NON_PM
           and divisor mons[old_id].cnutrit can't be zero */
        /* oeaten and cnutrit are unsigned; theoretically that could
           be 16 bits and the calculation might overflow, so force long */
        obj.oeaten = (Math.trunc(obj.oeaten * game.mons[id].cnutrit / game.mons[old_id].cnutrit));
    }
    obj.corpsenm = id;
    switch (obj.otyp) {
        case CORPSE:
            start_corpse_timeout(obj);
            obj.owt = weight(obj);
            break;
        case FIGURINE:
            if (obj.corpsenm != NON_PM && !dead_species(obj.corpsenm, (1)) && (((obj).where == 3) || ((obj).where == 4))) {
                attach_fig_transform_timeout(obj);
            }
            obj.owt = weight(obj);
            break;
        case EGG:
            if (obj.corpsenm != NON_PM && !dead_species(obj.corpsenm, (1))) {
                attach_egg_hatch_timeout(obj, when);
            }
            break;
        default:
            obj.owt = weight(obj);
            break;
    }
}
/* Return the number of turns after which a Rider corpse revives */
export function rider_revival_time(body, retry) {
    let when = 0;
    let minturn = retry ? 3 : (body.corpsenm == PM_DEATH) ? 6 : 12;
    /* Riders have a 1/3 chance per turn of reviving after 12, 6, or 3 turns.
       Always revive by 67. */
    for (when = minturn; when < 67; when++) {
        if (!rn2(3)) {
            break;
        }
    }
    return when;
}
/*
 * Start a corpse decay or revive timer.
 * This takes the age of the corpse into consideration as of 3.4.0.
 */
export function start_corpse_timeout(body) {
    let when = 0;
    let age = 0;
    let rot_adjust = 0;
    let action = 0;
    /*
     * Note:
     *      if body->norevive is set, the corpse will rot away instead
     *      of revive when its REVIVE_MON timer finishes.
     */
    /* lizards and lichen don't rot or revive */
    if (body.corpsenm == PM_LIZARD || body.corpsenm == PM_LICHEN) {
        return;
    }
    /* default action: rot away */
    action = ROT_CORPSE;
    rot_adjust = game.in_mklev ? 25 : 10;
    age = ((game.moves) > (1) ? (game.moves) : (1)) - body.age;
    if (age > (250)) {
        when = rot_adjust;
    } else {
        when = (250) - age;
    }
    when += (rnz(rot_adjust) - rot_adjust);
    if (((game.mons[body.corpsenm]) == game.mons[PM_DEATH] || (game.mons[body.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[body.corpsenm]) == game.mons[PM_PESTILENCE])) {
        action = REVIVE_MON;
        when = rider_revival_time(body, (0));
    } else if (game.mons[body.corpsenm].mlet == S_TROLL) {
        for (age = 2; age <= (50); age++) {
            if (!rn2(37)) {
                action = REVIVE_MON;
                when = age;
                break;
            }
        }
    } else if (game.zombify && zombie_form(game.mons[body.corpsenm]) != NON_PM && !body.oeroded2) {
        action = ZOMBIFY_MON;
        when = (rn2(15) + (5));
    }
    start_timer(when, TIMER_OBJECT, action, obj_to_any(body));
}
/* used by item_on_ice() and shrink_glob() */
export const NOT_ON_ICE = 0;
export const SET_ON_ICE = 1;
export const BURIED_UNDER_ICE = 2;
/* used by shrink_glob(); is 'item' or enclosing container on or under ice? */
export function item_on_ice(item) {
    let otmp = null;
    let ox = 0;
    let oy = 0;
    otmp = item;
    /* if in a container, it might be nested so find outermost one since
       that's the item whose location needs to be checked */
    while (otmp.where == 2) {
        otmp = otmp.v.v_ocontainer;
    }
    if (get_obj_location(otmp, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 2)) {
        switch (otmp.where) {
            /* verify that obj in hero's invent (or ball/chain elsewhere)
           with owornmask of W_foo is the object pointed to by ufoo */
            case 1:
                if (is_ice(ox, oy)) {
                    return SET_ON_ICE;
                }
                break;
            case 6:
                if (is_ice(ox, oy)) {
                    return BURIED_UNDER_ICE;
                }
                break;
            default:
                break;
        }
    }
    return NOT_ON_ICE;
}
/* schedule a timer that will shrink the target glob by 1 unit of weight */
/* glob */
/* when to shrink; if 0L, use random value close to 25 */
export function start_glob_timeout(obj, when) {
    if (!obj.globby) {
        impossible("start_glob_timeout for non-glob [%d: %s]?", obj.otyp, simpleonames(obj));
        return;
    }
    if (obj.timed) {
        stop_timer(SHRINK_GLOB, obj_to_any(obj));
    }
    /* caller usually passes 0L; should never be negative */
    if (when < 1) {
        when = 25 + rn2(5) - 2;
    }
    /* 25+[0..4]-2 => 23..27, avg 25 */
    /* 1 new glob weighs 20 units and loses 1 unit every 25 turns,
       so lasts for 500 turns, twice as long as the average corpse */
    start_timer(when, TIMER_OBJECT, SHRINK_GLOB, obj_to_any(obj));
}
/* globs have quantity 1 and size which varies by multiples of 20 in owt;
   they don't become tainted with age, but every 25 turns this timer runs
   and reduces owt by 1; when it hits 0, destroy the glob (if some other
   part of the program destroys it, the timer will be cancelled);
   note: timer keeps going if an object gets buried or scheduled to
   migrate to another level and can delete the glob in those states */
/* glob (in arg->a_obj) */
/* turn the timer should have gone off; if less than
                       * current 'moves', we're making up for lost time
                       * after leaving and then returning to this level */
export function shrink_glob(arg, expire_time) {
    let globnambuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let obj = arg.a_obj;
    let globloc = item_on_ice(obj);
    let ininv = (obj.where == 3);
    let shrink = (0);
    let gone = (0);
    let updinv = (0);
    let contnr = (obj.where == 2) ? obj.v.v_ocontainer : null;
    let topcontnr = null;
    let old_top_owt = 0;
    if (!obj.globby) {
        impossible("shrink_glob for non-glob [%d: %s]?", obj.otyp, simpleonames(obj));
        return;
    }
    /* note: if check_glob() complains about a problem, the " obj " here
       will be replaced in the feedback with info about this glob */
    check_glob(obj, "shrink obj ");
    if (expire_time < game.moves && globloc != BURIED_UNDER_ICE) {
        /*
     * If shrinkage occurred while we were on another level, catch up now.
     */
        /* number of units of weight to remove */
        let delta = Math.trunc((game.moves - expire_time + 24) / 25);
        let moddelta = 25 - (delta % 25);
        if (globloc == SET_ON_ICE) {
            delta = Math.trunc((delta + 2) / 3);
        }
        if (delta >= obj.owt) {
            /* leftover amount to use for new timer */
            /* gone; no newsym() or message here--forthcoming map update for
               level arrival is all that's needed */
            /* not required; accurately reflects obj's state */
            obj.owt = 0;
            /* weight has been reduced to 0 so destroy the glob */
            shrinking_glob_gone(obj);
        } else {
            /* shrank but not gone; reduce remaining weight */
            obj.owt -= delta;
            /* when contained, update container's weight (recursively if
               nested); won't be in a container carried by hero (since
               catching up for lost time never applies in that situation)
               but might be in one on floor or one carried by a monster */
            if (contnr) {
                /* update those weights now; recursively updates nested containers */
                container_weight(contnr);
            }
            /* resume regular shrinking */
            start_glob_timeout(obj, moddelta);
        }
        return;
    }
    if (eating_glob(obj) || globloc == BURIED_UNDER_ICE || (globloc == SET_ON_ICE && (game.moves % 3) == 1)) {
        /*
     * When on ice, only shrink every third try.  If buried under ice,
     * don't shrink at all, similar to being contained in an ice box
     * except that the timer remains active.  [FIXME:  stop the timer
     * for obj in pool that becomes frozen, restart it if/when unburied.]
     *
     * If the glob is actively being eaten by hero, skip weight reduction
     * to avoid messing up the context.victual data (if/when eaten by a
     * monster, timer won't have a chance to run before meal is finished).
     */
        /* schedule next shrink attempt; for the being eaten case, the
           glob and its timer might be deleted before this kicks in */
        /* schedule next shrink ~25 turns from now */
        start_glob_timeout(obj, 0);
        return;
    }
    /* format "Your/Shk's/The [partly eaten] glob of <goo>" into
       globnambuf[] before shrinking the glob; Yname2() calls yname()
       which calls xname() which ordinarily leaves "partly eaten" to
       doname() rather than inserting that itself; ask xname() to add
       that when appropriate */
    game.iflags.partly_eaten_hack = (1);
    globnambuf = strcpy(globnambuf, Yname2(obj));
    game.iflags.partly_eaten_hack = (0);
    if (obj.owt > 0) {
        /* globs start out weighing 20 units; give two messages per glob,
           when going from 20 to 19 and from 10 to 9; a different message
           is given for going from 1 to 0 (gone) */
        let basewt = game.objects[obj.otyp].oc_weight;
        let msgwt = Math.trunc((((basewt) > (1) ? (basewt) : (1)) + 1) / 2);
        shrink = (obj.owt % msgwt) == 0;
        obj.owt -= 1;
        /* if glob is partly eaten, reduce the amount still available (but
           not all the way to 0 which would change it back to untouched) */
        if (obj.oeaten > 1) {
            obj.oeaten -= 1;
        }
    }
    gone = !obj.owt;
    if (ininv) {
        /* timer might go off when the glob is migrating to another level and
       possibly delete it; messages are only given for in-open-inventory,
       inside-container-in-invent, and going away when can-see-on-floor */
        if (shrink || gone) {
            pline("%s %s.", globnambuf, gone ? "dissolves completely" : "shrinks");
        }
        updinv = (1);
    } else if (contnr) {
        /* globs always have quantity 1 so we don't need otense()
                     because the verb always references a singular item */
        /* when in a container, it might be nested so find outermost one */
        topcontnr = contnr;
        while (topcontnr.where == 2) {
            topcontnr = topcontnr.v.v_ocontainer;
        }
        /* obj's weight has been reduced, but weight(s) of enclosing
           container(s) haven't been adjusted for that yet */
        old_top_owt = topcontnr.owt;
        container_weight(contnr);
        if (topcontnr.where == 3) {
            /* for regular containers, the weight will always be reduced
               when glob's weight has been reduced but we only say so
               when shrinking beneath a particular threshold (N*20 to
               (N-1)*20 + 19 or (N-1)*20 + 10 to (N-1)*20 + 9), or
               if we're going to report a change in carrying capacity;
               for a non-cursed bag of holding the total weight might not
               change because only a fraction of glob's weight is counted;
               however, always say the bag is lighter for the 'gone' case */
            if (gone || (shrink && topcontnr.owt != old_top_owt) || near_capacity() != game.oldcap) {
                pline("%s %s%s lighter.", Yname2(topcontnr), (topcontnr.owt != old_top_owt) ? "becomes" : "seems", !gone ? " slightly" : "");
            }
            updinv = (1);
        }
    }
    if (gone) {
        /* containers also always have quantity 1 */
        /* TODO?  maybe also skip "slightly" if description
                         is changing (from "very large" to "large",
                         "large" to "medium", or "medium to "small") */
        let ox = 0;
        let oy = 0;
        /* check location for visibility before destroying obj */
        let seeit = (obj.where == 1 && get_obj_location(obj, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 0) && ((game.viz_array[oy][ox] & 2) != 0));
        shrinking_glob_gone(obj);
        if (seeit) {
            newsym(ox, oy);
            if ((ox != game.u.ux || oy != game.u.uy) && !strncmp(globnambuf, "The ", 4)) {
                globnambuf = strsubst(globnambuf, "The ", "A ");
            }
            /* again, quantity is always 1 so no need for otense()/vtense() */
            pline("%s fades away.", globnambuf);
        }
    } else {
        start_glob_timeout(obj, 0);
    }
    if (updinv) {
        /* fortunately none of the glob adjectives warrant "An " */
        update_inventory();
        encumber_msg();
    }
}
/* a glob has shrunk away to nothing; handle owornmask, then delete glob */
export function shrinking_glob_gone(obj) {
    let owhere = obj.where;
    if (owhere == 3) {
        if (obj.owornmask) {
            remove_worn_item(obj, (0));
            stop_occupation();
        }
        useupall(obj);
    } else {
        if (owhere == 5) {
            /* destination flag overloads owornmask; clear it so obfree()'s
               check for freeing a worn object doesn't get a false hit */
            obj.owornmask = 0;
        } else if (owhere == 4) {
            /* monsters don't wield globs so this isn't strictly needed */
            if (obj.owornmask && obj == ((obj.v.v_ocarry).mw)) {
                setmnotwielded(obj.v.v_ocarry, obj);
            }
        }
        /* remove the glob from whatever list it's on and then delete it;
           if it's contained, obj_extract_self() will update the container's
           weight and if nested, the enclosing containers' weights too */
        obj_extract_self(obj);
        if (owhere == 1) {
            maybe_unhide_at(obj.ox, obj.oy);
        }
        obfree(obj, null);
    }
}
export function maybe_adjust_light(obj, old_range) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ox = 0;
    let oy = 0;
    let new_range = arti_light_radius(obj);
    let delta = new_range - old_range;
    if (delta) {
        /* radius of light emitting artifact varies by curse/bless state
       so will change after blessing or cursing */
        obj_adjust_light_radius(obj, new_range);
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && get_obj_location(obj, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 0)) {
            /* simplifying assumptions:  hero is wielding or wearing this object;
           artifacts have to be in use to emit light and monsters' gear won't
           change bless or curse state */
            buf = '';
            if (game.iflags.last_msg == PLNMSG_OBJ_GLOWS) {
                buf = strcpy(buf, (obj.quan == 1) ? "It" : "They");
            } else if (((obj).where == 3) || ((game.viz_array[oy][ox] & 2) != 0)) {
                buf = strcpy(buf, Yname2(obj));
            }
            if (buf) {
                /* we just saw "The <obj> glows <color>." from dipping */
                /* initial activation says "dimly" if cursed,
                   "brightly" if uncursed, and "brilliantly" if blessed;
                   when changing intensity, using "less brightly" is
                   straightforward for dimming, but we need "brighter"
                   rather than "more brightly" for brightening; ugh */
                pline("%s %s %s%s.", buf, otense(obj, "shine"), (abs(delta) > 1) ? "much " : "", (delta > 0) ? "brighter" : "less brightly");
            }
        }
    }
}
/*
 *      bless(), curse(), unbless(), uncurse() -- any relevant message
 *      about glowing amber/black/&c should be delivered prior to calling
 *      these routines to make the actual curse/bless state change.
 */
export function bless(otmp) {
    fnEnter("bless", "mkobj.c", 0);
    let old_light = 0;
    if (otmp.oclass == COIN_CLASS) {
        return;
    }
    if (otmp.lamplit) {
        old_light = arti_light_radius(otmp);
    }
    otmp.cursed = 0;
    otmp.blessed = 1;
    if (((otmp).where == 3) && confers_luck(otmp)) {
        /* some cursed items need immediate updating */
        set_moreluck();
    } else if (otmp.otyp == BAG_OF_HOLDING) {
        otmp.owt = weight(otmp);
    } else if (otmp.otyp == FIGURINE && otmp.timed) {
        stop_timer(FIG_TRANSFORM, obj_to_any(otmp));
    }
    if (otmp.lamplit) {
        maybe_adjust_light(otmp, old_light);
    }
    return;
}
export function unbless(otmp) {
    let old_light = 0;
    if (otmp.lamplit) {
        old_light = arti_light_radius(otmp);
    }
    otmp.blessed = 0;
    if (((otmp).where == 3) && confers_luck(otmp)) {
        set_moreluck();
    } else if (otmp.otyp == BAG_OF_HOLDING) {
        otmp.owt = weight(otmp);
    }
    if (otmp.lamplit) {
        maybe_adjust_light(otmp, old_light);
    }
}
export function curse(otmp) {
    fnEnter("curse", "mkobj.c", 0);
    let already_cursed = 0;
    let old_light = 0;
    if (otmp.oclass == COIN_CLASS) {
        return;
    }
    if (otmp.lamplit) {
        old_light = arti_light_radius(otmp);
    }
    already_cursed = otmp.cursed;
    otmp.blessed = 0;
    otmp.cursed = 1;
    /* welded two-handed weapon interferes with some armor removal */
    if (otmp == game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
        reset_remarm();
    }
    /* rules at top of wield.c state that twoweapon cannot be done
       with cursed alternate weapon */
    if (otmp == game.uswapwep && game.u.twoweap) {
        drop_uswapwep();
    }
    if (((otmp).where == 3) && confers_luck(otmp)) {
        set_moreluck();
    } else if (otmp.otyp == BAG_OF_HOLDING) {
        otmp.owt = weight(otmp);
    } else if (otmp.otyp == FIGURINE) {
        if (otmp.corpsenm != NON_PM && !dead_species(otmp.corpsenm, (1)) && (((otmp).where == 3) || ((otmp).where == 4))) {
            attach_fig_transform_timeout(otmp);
        }
    } else if (otmp.oclass == SPBOOK_CLASS) {
        /* if book hero is reading becomes cursed, interrupt */
        if (!already_cursed) {
            book_cursed(otmp);
        }
    }
    if (otmp.lamplit) {
        maybe_adjust_light(otmp, old_light);
    }
    return;
}
export function uncurse(otmp) {
    let old_light = 0;
    if (otmp.lamplit) {
        old_light = arti_light_radius(otmp);
    }
    otmp.cursed = 0;
    if (((otmp).where == 3) && confers_luck(otmp)) {
        set_moreluck();
    } else if (otmp.otyp == BAG_OF_HOLDING) {
        otmp.owt = weight(otmp);
    } else if (otmp.otyp == FIGURINE && otmp.timed) {
        stop_timer(FIG_TRANSFORM, obj_to_any(otmp));
    }
    if (otmp.lamplit) {
        maybe_adjust_light(otmp, old_light);
    }
    return;
}
export function blessorcurse(otmp, chance) {
    fnEnter("blessorcurse", "mkobj.c", 0);
    if (otmp.blessed || otmp.cursed) {
        return;
    }
    if (!rn2(chance)) {
        if (!rn2(2)) {
            curse(otmp);
        } else {
            bless(otmp);
        }
    }
    return;
}
export function bcsign(otmp) {
    return (!!otmp.blessed - !!otmp.cursed);
}
/* set the object's bless/curse-state known flag */
/* 1 or 0 */
export function set_bknown(obj, onoff) {
    if (obj.bknown != onoff) {
        obj.bknown = onoff;
        if (obj.where == 3 && game.moves > 1) {
            update_inventory();
        }
    }
}
/*
 *  Calculate the weight of the given object.  This will recursively follow
 *  and calculate the weight of any containers.
 *
 *  Note:  It is possible to end up with an incorrect weight if some part
 *         of the code messes with a contained object and doesn't update the
 *         container's weight.
 *
 *  Note too: obj->owt is an unsigned int and objects[].oc_weight an
 *         unsigned short int, so weight() should probably be changed to
 *         use and return unsigned int instead of signed int.
 */
export function weight(obj) {
    let wt = game.objects[obj.otyp].oc_weight;
    if (obj.quan < 1) {
        impossible("Calculating weight of %ld %s?", obj.quan, simpleonames(obj));
        /* obj on mon's inventory chain */
        return 0;
    }
    if (obj.globby) {
        /* glob absorption means that merging globs combines their weight
       while quantity stays 1; mksobj(), obj_absorb(), and shrink_glob()
       manage glob->owt and there is nothing for weight() to do except
       return the current value as-is */
        /* 5.0: in 3.6.x this checked for owt==0 and then used
           owt as-is when non-zero or objects[].oc_weight if zero;
           we don't do that anymore because it confused calculating
           the weight of a container when a glob inside shrank down
           to 0 and was about to be deleted [mksobj() now initializes
           owt for globs sooner and the subsequent o->owt = weight(o)
           general initialization is benignly redundant for globs] */
        /* kludge for "very" heavy iron ball */
        return obj.owt;
    }
    if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) || obj.otyp == STATUE) {
        let contents = null;
        let cwt = 0;
        if (obj.otyp == STATUE && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS)) {
            let msize = game.mons[obj.corpsenm].msize;
            let minwt = (msize + msize + 1) * 100;
            /* default statue weight is 1.5 times corpse weight */
            wt = Math.trunc(3 * game.mons[obj.corpsenm].cwt / 2);
            /* some monsters that never leave a corpse when they die have
               corpse weight defined as 0; statues resembling them need to
               have non-zero weight; others are so tiny (killer bee) that
               they weigh barely more than nothing or so insubstantial
               (wraith) that they actually weigh nothing; statues of such
               need more heft */
            if (wt < minwt) {
                wt = minwt;
            }
            /* this has no effect because statues don't stack */
            wt *= obj.quan;
        }
        cwt = 0;
        for (contents = obj.cobj; contents; contents = contents.nobj) {
            cwt += weight(contents);
        }
        /*
         *  The weight of bags of holding is calculated as the weight
         *  of the bag plus the weight of the bag's contents modified
         *  as follows:
         *
         *      Bag status      Weight of contents
         *      ----------      ------------------
         *      cursed                  2x
         *      blessed                 x/4 [rounded up: (x+3)/4]
         *      otherwise               x/2 [rounded up: (x+1)/2]
         *
         *  The macro DELTA_CWT in pickup.c also implements these
         *  weight equations.
         */
        if (obj.otyp == BAG_OF_HOLDING) {
            cwt = obj.cursed ? (cwt * 2) : obj.blessed ? (Math.trunc((cwt + 3) / 4)) : (Math.trunc((cwt + 1) / 2));
        }
        return wt + cwt;
    }
    if (obj.otyp == CORPSE && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS)) {
        let long_wt = obj.quan * game.mons[obj.corpsenm].cwt;
        wt = (long_wt > 32767) ? 32767 : long_wt;
        if (obj.oeaten) {
            wt = eaten_stat(wt, obj);
        }
        return wt;
    } else if (obj.oclass == FOOD_CLASS && obj.oeaten) {
        return eaten_stat(obj.quan * wt, obj);
    } else if (obj.oclass == COIN_CLASS) {
        /* 5.0: always weigh at least 1 unit; used to yield 0 for 1..49 */
        wt = (Math.trunc((obj.quan + 50) / 100));
        return ((wt) > (1) ? (wt) : (1));
    } else if (obj.otyp == HEAVY_IRON_BALL && obj.owt != 0) {
        return obj.owt;
    } else if (obj.otyp == CANDELABRUM_OF_INVOCATION && obj.spe) {
        return wt + obj.spe * game.objects[TALLOW_CANDLE].oc_weight;
    }
    return (wt ? wt * obj.quan : (obj.quan + 1) >> 1);
}
const treefruits = [APPLE, ORANGE, PEAR, BANANA, EUCALYPTUS_LEAF];
/* called when a tree is kicked; never returns Null */
export function rnd_treefruit_at(x, y) {
    return mksobj_at(treefruits[rn2((Math.trunc(20 /* sizeof(const int [5]) */ / 4 /* sizeof(const int) */)))], x, y, (1), (0));
}
/* for describing objects embedded in trees */
export function is_treefruit(otmp) {
    let fruitidx = 0;
    for (fruitidx = 0; fruitidx < (Math.trunc(20 /* sizeof(const int [5]) */ / 4 /* sizeof(const int) */)); ++fruitidx) {
        if (treefruits[fruitidx] == otmp.otyp) {
            return (1);
        }
    }
    return (0);
}
/* create a stack of N gold pieces; never returns Null */
export function mkgold(amount, x, y) {
    let gold = g_at(x, y);
    if (amount <= 0) {
        let mul = rnd(Math.trunc(30 / ((12 - depth(game.u.uz)) > (2) ? (12 - depth(game.u.uz)) : (2))));
        amount = (1 + rnd(level_difficulty() + 2) * mul);
    }
    if (gold) {
        gold.quan += amount;
    } else {
        gold = mksobj_at(GOLD_PIECE, x, y, (1), (0));
        gold.quan = amount;
    }
    gold.owt = weight(gold);
    return gold;
}
/* potions of oil use their obj->age field differently from other potions
   so changing potion type to or from oil needs to have that fixed up */
/* potion that just had its otyp changed */
/* item used to create potion; might be Null */
export function fixup_oil(potion, source) {
    if (potion.otyp == POT_OIL) {
        if (source && source.otyp == POT_OIL) {
            /* potion of oil being used to set potion's otyp to oil;
               source might be partly used */
            potion.age = source.age;
        } else {
            /* non-oil is being turned into oil; change absolute age
               (turn created) into relative age (amount remaining /
               burn time available) */
            potion.age = 400;
        }
    } else if (source && source.otyp == POT_OIL) {
        /* potion is no longer oil, being turned into non-oil */
        if (potion.age == source.age) {
            potion.age = game.moves;
        }
        /* when source is a partly used oil, mark potion as diluted */
        if (source.age < 400) {
            potion.oeroded = 1;
        }
    }
}
/* return TRUE if the corpse has special timing;
   lizards and lichen don't rot, trolls and Riders auto-revive */
/* mkcorpstat: make a corpse or statue; never returns Null.
 *
 * OEXTRA note: Passing mtmp causes mtraits to be saved
 * even if ptr passed as well, but ptr is always used for
 * the corpse type (corpsenm). That allows the corpse type
 * to be different from the original monster,
 *      i.e.  vampire -> human corpse
 * yet still allow restoration of the original monster upon
 * resurrection.
 */
/* CORPSE or STATUE */
/* dead monster, might be Null */
/* if non-Null, overrides mtmp->mndx */
/* where to place corpse; <0,0> => random */
export function mkcorpstat(objtype, mtmp, ptr, x, y, corpstatflags) {
    let otmp = null;
    let init = ((corpstatflags & 8) != 0);
    if (objtype != CORPSE && objtype != STATUE) {
        impossible("making corpstat type %d", objtype);
    }
    if (x == 0 && y == 0) {
        /* special case - random placement */
        otmp = mksobj(objtype, init, (0));
        rloco(otmp);
    } else {
        otmp = mksobj_at(objtype, x, y, init, (0));
    }
    /* record gender and 'historic statue' in overloaded enchantment field */
    otmp.spe = (corpstatflags & 7);
    /* via envrmt rather than flags */
    otmp.oeroded2 = game.mkcorpstat_norevive;
    if (mtmp) {
        /* when 'mtmp' is non-null save the monster's details with the
       corpse or statue; it will also force the 'ptr' override below */
        /* save_mtraits updates otmp->oextra->omonst in place */
        save_mtraits(otmp, mtmp);
        if (!ptr) {
            ptr = mtmp.data;
        }
        /* don't give a revive timer to a cancelled troll's corpse */
        if (mtmp.mcan && !((ptr) == game.mons[PM_DEATH] || (ptr) == game.mons[PM_FAMINE] || (ptr) == game.mons[PM_PESTILENCE])) {
            otmp.oeroded2 = 1;
        }
    }
    if (ptr) {
        /* when 'ptr' is non-null it comes from our caller or from 'mtmp';
       override mkobjs()'s initialization of a random monster type */
        let old_corpsenm = otmp.corpsenm;
        otmp.corpsenm = ((ptr).pmidx);
        otmp.owt = weight(otmp);
        if (otmp.otyp == CORPSE && (game.zombify || (((old_corpsenm) == PM_LIZARD || (old_corpsenm) == PM_LICHEN) || (game.mons[old_corpsenm].mlet == S_TROLL || ((game.mons[old_corpsenm]) == game.mons[PM_DEATH] || (game.mons[old_corpsenm]) == game.mons[PM_FAMINE] || (game.mons[old_corpsenm]) == game.mons[PM_PESTILENCE]))) || (((otmp.corpsenm) == PM_LIZARD || (otmp.corpsenm) == PM_LICHEN) || (game.mons[otmp.corpsenm].mlet == S_TROLL || ((game.mons[otmp.corpsenm]) == game.mons[PM_DEATH] || (game.mons[otmp.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[otmp.corpsenm]) == game.mons[PM_PESTILENCE]))))) {
            obj_stop_timers(otmp);
            start_corpse_timeout(otmp);
        }
    }
    return otmp;
}
/*
 * Return the type of monster that this corpse will
 * revive as, even if it has a monster structure
 * attached to it. In that case, you can't just
 * use obj->corpsenm, because the stored monster
 * type can, and often is, different.
 * The return value is an index into mons[].
 */
export function corpse_revive_type(obj) {
    let revivetype = obj.corpsenm;
    let mtmp = null;
    if (((obj).oextra && ((obj).oextra.omonst)) && ((mtmp = get_mtraits(obj, (0))) != null)) {
        /* mtmp is a temporary pointer to a monster's stored
        attributes, not a real monster */
        revivetype = mtmp.mnum;
    }
    return revivetype;
}
/*
 * Attach a monster id to an object, to provide
 * a lasting association between the two.
 */
export function obj_attach_mid(obj, mid) {
    if (!mid || !obj) {
        return null;
    }
    newomid(obj);
    ((obj).oextra.omid) = mid;
    return obj;
}
export function save_mtraits(obj, mtmp) {
    if (mtmp.ispriest) {
        forget_temple_entry(mtmp);
    }
    if (!((obj).oextra && ((obj).oextra.omonst))) {
        newomonst(obj);
    }
    if (((obj).oextra && ((obj).oextra.omonst))) {
        let baselevel = mtmp.data.mlevel;
        let mtmp2 = ((obj).oextra.omonst);
        Object.assign(mtmp2, mtmp);
        mtmp2.mextra = null;
        mtmp2.mnum = ((mtmp.data).pmidx);
        /* m_id is needed to know if this is a revived quest leader */
        /* but m_id must be cleared when loading bones */
        mtmp2.nmon = null;
        mtmp2.data = null;
        mtmp2.minvent = null;
        ((mtmp2).mw = null);
        /* mtmp2->mw = (struct obj *) 0; */
        if (mtmp.mextra) {
            copy_mextra(mtmp2, mtmp);
        }
        /* if mtmp is a long worm with segments, its saved traits will
           be one without any segments */
        mtmp2.wormno = 0;
        /* mtmp might have been killed by repeated life draining; make sure
           mtmp2 can survive if revived ('baselevel' will be 0 for 1d4 mon) */
        if (mtmp2.mhpmax <= baselevel) {
            mtmp2.mhpmax = baselevel + 1;
        }
        /* mtmp is assumed to be dead but we don't kill it or its saved
           traits, just force those to have a sane value for current HP */
        if (mtmp2.mhp > mtmp2.mhpmax) {
            mtmp2.mhp = mtmp2.mhpmax;
        }
        if (mtmp2.mhp < 1) {
            mtmp2.mhp = 0;
        }
        mtmp2.mstate &= ~2;
    }
    return obj;
}
/* returns a pointer to a new monst structure based on
 * the one contained within the obj.
 */
export function get_mtraits(obj, copyof) {
    let mtmp = null;
    let mnew = null;
    if (((obj).oextra && ((obj).oextra.omonst))) {
        mtmp = ((obj).oextra.omonst);
    }
    if (mtmp) {
        if (copyof) {
            mnew = alloc(1 /* sizeof(struct monst) */);
            Object.assign(mnew, mtmp);
            mnew.mextra = null;
            if (mtmp.mextra) {
                copy_mextra(mnew, mtmp);
            }
        } else {
            /* Never insert this returned pointer into mon chains! */
            mnew = mtmp;
        }
        mnew.data = game.mons[mnew.mnum];
    }
    return mnew;
}
/* make an object named after someone listed in the scoreboard file;
   never returns Null */
/* CORPSE or STATUE */
export function mk_tt_object(objtype, x, y) {
    let otmp = null;
    let initialize_it = 0;
    /* player statues never contain books */
    initialize_it = (objtype != STATUE);
    otmp = mksobj_at(objtype, x, y, initialize_it, (0));
    if (!tt_oname(otmp)) {
        /* tt_oname() will return null if the scoreboard is empty, which in
       turn leaves the random corpsenm value; force it to match a player */
        let pm = (rn2(PM_WIZARD - PM_ARCHEOLOGIST + 1) + (PM_ARCHEOLOGIST));
        /* update weight for either, force timer sanity for corpses */
        set_corpsenm(otmp, pm);
    }
    return otmp;
}
/* make a new corpse or statue, uninitialized if a statue (i.e. no books);
   never returns Null */
/* CORPSE or STATUE */
export function mk_named_object(objtype, ptr, x, y, nm) {
    let otmp = null;
    let corpstatflags = (objtype != STATUE) ? 8 : 0;
    otmp = mkcorpstat(objtype, null, ptr, x, y, corpstatflags);
    if (nm) {
        otmp = oname(otmp, nm, 0);
    }
    return otmp;
}
export function is_flammable(otmp) {
    let otyp = otmp.otyp;
    let omat = game.objects[otyp].oc_material;
    /* Candles can be burned, but they're not flammable in the sense that
     * they can't get fire damage and it makes no sense for them to be
     * fireproofed.
     */
    if ((otmp.otyp == TALLOW_CANDLE || otmp.otyp == WAX_CANDLE)) {
        return (0);
    }
    if (game.objects[otyp].oc_oprop == FIRE_RES || otyp == WAN_FIRE) {
        return (0);
    }
    return ((omat <= WOOD && omat != LIQUID) || omat == PLASTIC);
}
export function is_rottable(otmp) {
    let otyp = otmp.otyp;
    return ((game.objects[otyp].oc_material <= WOOD && game.objects[otyp].oc_material != LIQUID) || game.objects[otyp].oc_material == DRAGON_HIDE);
}
/*
 * These routines maintain the single-linked lists headed in level.objects[][]
 * and threaded through the nexthere fields in the object-instance structure.
 */
/* put the object at the given location */
export function place_object(otmp, x, y) {
    let otmp2 = null;
    if (!isok(x, y)) {
        let func = null;
        func = (x < 0 || y < 0 || x > 80 - 1 || y > 21 - 1) ? panic : impossible;
        /* we'll only get to here if we've issued a warning (and fuzzer
           is not running since it escalates impossible to panic), so
           x,y has failed isok() but is within array bounds for the map;
           in other words, x specifies column 0 which should not happen
           but we let the game keep going */
        (func)("place_object: \"%s\" [%d] off map <%d,%d>", safe_typename(otmp.otyp), otmp.where, x, y);
    }
    if (otmp.where != 0) {
        panic("place_object: obj \"%s\" [%d] not free", safe_typename(otmp.otyp), otmp.where);
    }
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    otmp2 = game.level.objects[x][y];
    obj_no_longer_held(otmp);
    if (otmp.otyp == BOULDER) {
        if (!otmp2 || otmp2.otyp != BOULDER) {
            block_point(x, y);
        }
    }
    if (otmp2 && otmp2.otyp == BOULDER && otmp.otyp != BOULDER) {
        /* non-boulder object goes under boulders so that map will show boulder
       here without display code needing to traverse pile chain to find one */
        /* 3.6.3: put otmp under last consecutive boulder rather than under
           just the first one */
        while (otmp2.v.v_nexthere && otmp2.v.v_nexthere.otyp == BOULDER) {
            otmp2 = otmp2.v.v_nexthere;
        }
        otmp.v.v_nexthere = otmp2.v.v_nexthere;
        otmp2.v.v_nexthere = otmp;
    } else {
        /* put on top of current pile */
        otmp.v.v_nexthere = otmp2;
        game.level.objects[x][y] = otmp;
    }
    /* set the object's new location */
    otmp.ox = x;
    otmp.oy = y;
    otmp.where = 1;
    /* if placed outside of shop, no_charge is no longer applicable */
    if (otmp.no_charge && !costly_spot(x, y) && !costly_adjacent(find_objowner(otmp, x, y), x, y)) {
        otmp.no_charge = 0;
    }
    otmp.nobj = game.level.objlist;
    game.level.objlist = otmp;
    if (otmp.timed) {
        obj_timer_checks(otmp, x, y, 0);
    }
}
/* tear down the object pile at <x,y> and create it again, so that any
   boulders which are present get forced to the top */
export function recreate_pile_at(x, y) {
    let otmp = null;
    let next_obj = null;
    let reversed = null;
    for (otmp = game.level.objects[x][y]; otmp; otmp = next_obj) {
        /* remove all objects at <x,y>, saving a reversed temporary list */
        next_obj = otmp.v.v_nexthere;
        /* obj_extract_self() for floor */
        remove_object(otmp);
        otmp.nobj = reversed;
        reversed = otmp;
    }
    for (otmp = reversed; otmp; otmp = next_obj) {
        /* pile at <tx,ty> is now empty; create new one, re-reversing to restore
       original order; place_object() handles making boulders be on top */
        next_obj = otmp.nobj;
        otmp.nobj = null;
        place_object(otmp, x, y);
    }
}
/* rotting on ice takes 2 times as long */
/* If ice was affecting any objects correct that now
 * Also used for starting ice effects too. [zap.c]
 */
export function obj_ice_effects(x, y, do_buried) {
    let otmp = null;
    for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp.timed) {
            obj_timer_checks(otmp, x, y, 0);
        }
    }
    if (do_buried) {
        for (otmp = game.level.buriedobjlist; otmp; otmp = otmp.nobj) {
            if (otmp.ox == x && otmp.oy == y) {
                if (otmp.timed) {
                    obj_timer_checks(otmp, x, y, 0);
                }
            }
        }
    }
}
/*
 * Returns an obj->age for a corpse object on ice, that would be the
 * actual obj->age if the corpse had just been lifted from the ice.
 * This is useful when just using obj->age in a check or calculation because
 * rot timers pertaining to the object don't have to be stopped and
 * restarted etc.
 */
export function peek_at_iced_corpse_age(otmp) {
    let age = 0;
    let retval = otmp.age;
    if (otmp.otyp == CORPSE && otmp.recharged) {
        /* Adjust the age; must be same as obj_timer_checks() for off ice*/
        age = game.moves - otmp.age;
        retval += Math.trunc(age * (2 - 1) / 2);
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkobj.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("The %s age has ice modifications: otmp->age = %ld, returning %ld.", s_suffix(doname(otmp)), otmp.age, retval);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkobj.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("Effective age of corpse: %ld.", game.moves - retval);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
    return retval;
}
/* 0 = no force so do checks, <0 = force off, >0 force on */
export function obj_timer_checks(otmp, x, y, force) {
    let tleft = 0;
    let action = ROT_CORPSE;
    let restart_timer = (0);
    let on_floor = (otmp.where == 1);
    let buried = (otmp.where == 6);
    if (otmp.otyp == CORPSE && (on_floor || buried) && is_ice(x, y)) {
        /* Check for corpses just placed on or in ice */
        tleft = stop_timer(action, obj_to_any(otmp));
        if (tleft == 0) {
            action = REVIVE_MON;
            tleft = stop_timer(action, obj_to_any(otmp));
        }
        /* Check for corpses coming off ice */
        if (tleft != 0) {
            let age = 0;
            /* mark the corpse as being on ice */
            otmp.recharged = 1;
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkobj.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("%s is now on ice at <%d,%d>.", The(xname(otmp)), x, y);
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            /* Adjust the time remaining */
            tleft *= 2;
            restart_timer = (1);
            /* Adjust the age; time spent off ice needs to be multiplied
               by the ice adjustment and subtracted from the age so that
               later calculations behave as if it had been on ice during
               that time (longwinded way of saying this is the inverse
               of removing it from the ice and of peeking at its age). */
            age = game.moves - otmp.age;
            otmp.age = game.moves - (age * 2);
        }
    } else if (force < 0 || (otmp.otyp == CORPSE && otmp.recharged && !((on_floor || buried) && is_ice(x, y)))) {
        tleft = stop_timer(action, obj_to_any(otmp));
        if (tleft == 0) {
            action = REVIVE_MON;
            tleft = stop_timer(action, obj_to_any(otmp));
        }
        if (tleft != 0) {
            let age = 0;
            otmp.recharged = 0;
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkobj.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("%s is no longer on ice at <%d,%d>.", The(xname(otmp)), x, y);
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            /* Adjust the remaining time */
            tleft = Math.trunc(tleft / 2);
            restart_timer = (1);
            age = game.moves - otmp.age;
            otmp.age += Math.trunc(age * (2 - 1) / 2);
        }
    }
    /* now re-start the timer with the appropriate modifications */
    if (restart_timer) {
        start_timer(tleft, TIMER_OBJECT, action, obj_to_any(otmp));
    }
}
export function remove_object(otmp) {
    let x = otmp.ox;
    let y = otmp.oy;
    if (otmp.where != 1) {
        panic("remove_object: obj where=%d, not on floor", otmp.where);
    }
    extract_nexthere(otmp, { get value() { return game.level.objects[x][y]; }, set value(_v) { game.level.objects[x][y] = _v; } });
    extract_nobj(otmp, { get value() { return game.level.objlist; }, set value(_v) { game.level.objlist = _v; } });
    if (otmp.otyp == BOULDER) {
        recalc_block_point(x, y);
    }
    if (otmp.timed) {
        obj_timer_checks(otmp, x, y, 0);
    }
}
/* throw away all of a monster's inventory */
export function discard_minvent(mtmp, uncreate_artifacts) {
    let otmp = null;
    while ((otmp = mtmp.minvent) != null) {
        /* this has now become very similar to m_useupall()... */
        extract_from_minvent(mtmp, otmp, (1), (1));
        if (uncreate_artifacts && otmp.oartifact) {
            artifact_exists(otmp, safe_oname(otmp), (0), 0);
        }
        /* dealloc_obj() isn't sufficient */
        obfree(otmp, null);
    }
}
/*
 * Free obj from whatever list it is on in preparation for deleting it
 * or moving it elsewhere; obj->where will end up set to OBJ_FREE unless
 * it is already OBJ_LUAFREE or OBJ_DELETED.
 * Doesn't handle unwearing of objects in hero's or monsters' inventories.
 *
 * Object positions:
 *      OBJ_FREE        not on any list
 *      OBJ_FLOOR       fobj, level.locations[][] chains (use remove_object)
 *      OBJ_CONTAINED   cobj chain of container object
 *      OBJ_INVENT      hero's invent chain (use freeinv)
 *      OBJ_MINVENT     monster's invent chain
 *      OBJ_MIGRATING   migrating chain
 *      OBJ_BURIED      level.buriedobjs chain
 *      OBJ_ONBILL      on gb.billobjs chain
 *      OBJ_LUAFREE     obj is dealloc'd from core, but still used by lua
 *      OBJ_DELETED     obj has been deleted from play but not yet deallocated
 */
export function obj_extract_self(obj) {
    switch (obj.where) {
        case 0:
        case 8:
        case 9:
            break;
        case 1:
            remove_object(obj);
            break;
        case 2:
            extract_nobj(obj, { get value() { return obj.v.v_ocontainer.cobj; }, set value(_v) { obj.v.v_ocontainer.cobj = _v; } });
            container_weight(obj.v.v_ocontainer);
            obj.v.v_ocontainer = null;
            break;
        case 3:
            freeinv(obj);
            break;
        case 4:
            extract_nobj(obj, { get value() { return obj.v.v_ocarry.minvent; }, set value(_v) { obj.v.v_ocarry.minvent = _v; } });
            obj.v.v_ocarry = null;
            break;
        case 5:
            extract_nobj(obj, { get value() { return game.migrating_objs; }, set value(_v) { game.migrating_objs = _v; } });
            break;
        case 6:
            extract_nobj(obj, { get value() { return game.level.buriedobjlist; }, set value(_v) { game.level.buriedobjlist = _v; } });
            break;
        case 7:
            extract_nobj(obj, { get value() { return game.billobjs; }, set value(_v) { game.billobjs = _v; } });
            break;
        default:
            panic("obj_extract_self, where=%d", obj.where);
            break;
    }
}
/* Extract the given object from the chain, following nobj chain. */
export function extract_nobj(obj, head_ptr) {
    let curr = null;
    let prev = null;
    curr = head_ptr.value;
    for (prev = null; curr; prev = curr , curr = curr.nobj) {
        if (curr == obj) {
            if (prev) {
                prev.nobj = curr.nobj;
            } else {
                head_ptr.value = curr.nobj;
            }
            break;
        }
    }
    if (!curr) {
        panic("extract_nobj: object lost");
    }
    obj.where = 0;
    obj.nobj = null;
}
/*
 * Extract the given object from the chain, following nexthere chain.
 *
 * This does not set obj->where, this function is expected to be called
 * in tandem with extract_nobj, which does set it.
 */
export function extract_nexthere(obj, head_ptr) {
    let curr = null;
    let prev = null;
    curr = head_ptr.value;
    for (prev = null; curr; prev = curr , curr = curr.v.v_nexthere) {
        if (curr == obj) {
            if (prev) {
                prev.v.v_nexthere = curr.v.v_nexthere;
            } else {
                head_ptr.value = curr.v.v_nexthere;
            }
            break;
        }
    }
    if (!curr) {
        panic("extract_nexthere: object lost");
    }
    obj.v.v_nexthere = null;
}
/*
 * Add obj to mon's inventory.  If obj is able to merge with something already
 * in the inventory, then the passed obj is deleted and 1 is returned.
 * Otherwise 0 is returned.
 */
export function add_to_minv(mon, obj) {
    let otmp = null;
    if (obj.where != 0) {
        panic("add_to_minv: obj where=%d, not free", obj.where);
    }
    for (otmp = mon.minvent; otmp; otmp = otmp.nobj) {
        if (merged({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, obj)) {
            return 1;
        }
    }
    /* obj merged and then free'd */
    /* else insert; don't bother forcing it to end of chain */
    obj.where = 4;
    obj.v.v_ocarry = mon;
    obj.nobj = mon.minvent;
    mon.minvent = obj;
    return 0;
}
/*
 * Add obj to container, make sure obj is "free".  Returns (merged) obj.
 * The input obj may be deleted in the process.
 *
 * Caveat:  this does not update the container's weight [possibly to
 * prevent that from being recalculated repeatedly when adding multiple
 * items].
 */
export function add_to_container(container, obj) {
    let otmp = null;
    if (obj.where != 0) {
        panic("add_to_container: obj where=%d, not free", obj.where);
    }
    if (container.where != 3 && container.where != 4) {
        obj_no_longer_held(obj);
    }
    for (otmp = container.cobj; otmp; otmp = otmp.nobj) {
        if (merged({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, obj)) {
            return otmp;
        }
    }
    obj.where = 2;
    obj.v.v_ocontainer = container;
    obj.nobj = container.cobj;
    container.cobj = obj;
    return obj;
}
export function add_to_migration(obj) {
    if (obj.where != 0) {
        panic("add_to_migration: obj where=%d, not free", obj.where);
    }
    /* caller should have changed unpaid item to stolen */
    if (obj.unpaid) {
        impossible("unpaid object migrating to another level? [%s]", simpleonames(obj));
    }
    /* was only relevant while inside a shop */
    obj.no_charge = 0;
    /* lock picking context becomes stale if it's for this object */
    if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS)) {
        maybe_reset_pick(obj);
    }
    obj.where = 5;
    obj.nobj = game.migrating_objs;
    obj.omigr_from_dnum = game.u.uz.dnum;
    obj.omigr_from_dlevel = game.u.uz.dlevel;
    game.migrating_objs = obj;
}
export function add_to_buried(obj) {
    if (obj.where != 0) {
        panic("add_to_buried: obj where=%d, not free", obj.where);
    }
    obj.where = 6;
    obj.nobj = game.level.buriedobjlist;
    game.level.buriedobjlist = obj;
}
/* recalculate weight of object, which doesn't have to be a container
   itself; if it is contained, recursively handle _its_ container(s) */
export function container_weight(object) {
    object.owt = weight(object);
    if (object.where == 2) {
        container_weight(object.v.v_ocontainer);
    }
}
/*
 * Mark object to be deallocated.  _All_ objects should be run through here
 * for them to be deallocated.
 */
export function dealloc_obj(obj) {
    if (obj.otyp == BOULDER) {
        obj.corpsenm = 0;
    }
    if (obj.where == 9) {
        impossible("dealloc_obj: obj already deleted (type=%d)", obj.otyp);
        return;
    } else if (obj.where != 0 && obj.where != 8) {
        panic("dealloc_obj: obj not free (type=%d, where=%d)", obj.otyp, obj.where);
    }
    if (obj.nobj) {
        panic("dealloc_obj with nobj");
    }
    if (obj.cobj) {
        panic("dealloc_obj with cobj");
    }
    if (obj == game.hands_obj) {
        impossible("dealloc_obj with hands_obj");
        return;
    }
    /* free up any timers attached to the object */
    if (obj.timed) {
        obj_stop_timers(obj);
    }
    if (obj_sheds_light(obj)) {
        /*
     * Free up any light sources attached to the object.
     *
     * We may want to just call del_light_source() without any
     * checks (requires a code change there).  Otherwise this
     * list must track all objects that can have a light source
     * attached to it (and also requires lamplit to be set).
     */
        del_light_source(LS_OBJECT, obj_to_any(obj));
        obj.lamplit = 0;
    }
    if (obj == game.thrownobj) {
        game.thrownobj = null;
    }
    if (obj == game.kickedobj) {
        game.kickedobj = null;
    }
    if (obj == game.context.tin.tin) {
        game.context.tin.tin = null;
        game.context.tin.o_id = 0;
    }
    /* if obj came from the most recent splitobj(), it's no longer eligible
       for unsplitobj(); perform inline clear_splitobjs() */
    if (obj.o_id == game.context.objsplit.parent_oid || obj.o_id == game.context.objsplit.child_oid) {
        game.context.objsplit.parent_oid = game.context.objsplit.child_oid = 0;
    }
    if (obj.lua_ref_cnt) {
        /* obj is referenced from a lua script, let lua gc free it */
        obj.where = 8;
        return;
    }
    if (!game.program_state.freeingdata) {
        /* mark object as deleted, put it into queue to be freed */
        obj.where = 9;
        obj.nobj = game.objs_deleted;
        game.objs_deleted = obj;
    } else {
        /* when saving, there's no need to stage deletions on objs_deleted */
        dealloc_obj_real(obj);
    }
}
/* actually deallocate the object */
export function dealloc_obj_real(obj) {
    if (obj.oextra) {
        dealloc_oextra(obj);
    }
    /* clear out of date information contained in the about-to-become
       stale memory so that potential used-after-freed bugs (should never
       happen) might trigger an object lost panic instead of continuing;
       linking with a debugging malloc library is likely to do something
       similar so this is mainly useful for ordinary malloc/free */
    Object.assign(obj, cg.zeroobj);
    free(obj);
}
/* free all the objects marked for deletion */
export function dobjsfree() {
    let otmp = null;
    while (game.objs_deleted) {
        otmp = game.objs_deleted;
        game.objs_deleted = otmp.nobj;
        if (otmp.where != 9) {
            panic("dobjsfree: obj where=%d, not OBJ_DELETED", otmp.where);
        }
        obj_extract_self(otmp);
        dealloc_obj_real(otmp);
    }
}
/* create an object from a horn of plenty; mirrors bagotricks(makemon.c) */
/* caller emptying entire contents; affects shop mesgs */
/* if non-Null, container to tip into */
export function hornoplenty(horn, tipping, targetbox) {
    let objcount = 0;
    if (!horn || horn.otyp != HORN_OF_PLENTY) {
        impossible("bad horn o' plenty");
    } else if (horn.spe < 1) {
        pline("%s", c_common_strings.c_nothing_happens);
        if (!horn.cknown) {
            horn.cknown = 1;
            update_inventory();
        }
    } else {
        let obj = null;
        let what = null;
        consume_obj_charge(horn, !tipping);
        if (!rn2(13)) {
            obj = mkobj(POTION_CLASS, (0));
            if (game.objects[obj.otyp].oc_magic) {
                do {
                    obj.otyp = rnd_class(POT_BOOZE, POT_WATER);
                } while (obj.otyp == POT_SICKNESS);
                /* oil uses obj->age field differently from other potions */
                if (obj.otyp == POT_OIL) {
                    fixup_oil(obj, (null));
                }
            }
            what = (obj.quan > 1) ? "Some potions" : "A potion";
        } else {
            obj = mkobj(FOOD_CLASS, (0));
            if (obj.otyp == FOOD_RATION && !rn2(7)) {
                obj.otyp = LUMP_OF_ROYAL_JELLY;
            }
            what = "Some food";
        }
        ++objcount;
        pline("%s %s out.", what, vtense(what, "spill"));
        obj.blessed = horn.blessed;
        obj.cursed = horn.cursed;
        obj.owt = weight(obj);
        /* using a shop's horn of plenty entails a usage fee and also
           confers ownership of the created item to the shopkeeper */
        if (horn.unpaid) {
            addtobill(obj, (0), (0), tipping);
        }
        /* if it ended up on bill, we don't want "(unpaid, N zorkmids)"
           being included in its formatted name during next message */
        game.iflags.suppress_price++;
        if (!tipping) {
            obj = hold_another_object(obj, game.u.uswallow ? "Oops!  %s out of your reach!" : ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || game.level.locations[game.u.ux][game.u.uy].typ < IRONBARS || game.level.locations[game.u.ux][game.u.uy].typ >= ICE) ? "Oops!  %s away from you!" : "Oops!  %s to the floor!", The(aobjnam(obj, "slip")), null);
            ((obj));
        } else if (targetbox) {
            add_to_container(targetbox, obj);
            /* add to container doesn't update the weight */
            targetbox.owt = weight(targetbox);
            if (((targetbox).where == 3)) {
                /* item still in magic horn was weightless; when it's now in
               a carried container, hero's encumbrance could change */
                encumber_msg();
                /* for contents count or wizweight */
                update_inventory();
            }
        } else {
            if (!can_reach_floor((1))) {
                /* assumes this is taking place at hero's location */
                /* does altar check, message, drop */
                hitfloor(obj, (1));
            } else {
                if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR)) {
                    doaltarobj(obj);
                /* does its own drop message */
                } else {
                    pline("%s %s to the %s.", Doname2(obj), otense(obj, "drop"), surface(game.u.ux, game.u.uy));
                }
                dropy(obj);
            }
        }
        game.iflags.suppress_price--;
        if (horn.dknown) {
            discover_object((HORN_OF_PLENTY), (1), (1), (1));
        }
    }
    return objcount;
}
/* support for wizard-mode's `sanity_check' option */
/* pline formats for insane_object() */
const ofmt0 = "%s obj %s %s: %s";
const ofmt3 = "%s [not null] %s %s: %s";
/* " held by mon %p (%s)" will be appended, filled by M,mon_nam(M) */
const mfmt1 = "%s obj %s %s (%s)";
const mfmt2 = "%s obj %s %s (%s) *not*";
/* Check all object lists for consistency. */
export function obj_sanity_check() {
    let x = 0;
    let y = 0;
    let obj = null;
    let otop = null;
    let prevo = null;
    objlist_sanity(game.level.objlist, 1, "floor sanity");
    for (x = 0; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            /* check that the map's record of floor objects is consistent;
       those objects should have already been sanity checked via
       the floor list so container contents are skipped here */
            let at_fmt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            otop = game.level.objects[x][y];
            prevo = null;
            for (obj = otop; obj; prevo = obj , obj = prevo.v.v_nexthere) {
                if (obj.where != 1 || x == 0 || obj.ox != x || obj.oy != y) {
                    at_fmt = sprintf(at_fmt, "%%s obj@<%d,%d> %%s %%s: %%s@<%d,%d>", x, y, obj.ox, obj.oy);
                    /* when one or more boulders are present, they should always
                   be at the top of their pile; also never in water or lava */
                    insane_object(obj, at_fmt, "location sanity", null);
                } else if (obj.otyp == BOULDER) {
                    /* <ox,oy> should match <x,y>; <0,*> should always be empty */
                    if (prevo && prevo.otyp != BOULDER) {
                        at_fmt = sprintf(at_fmt, "%%s boulder@<%d,%d> %%s %%s: not on top", x, y);
                        insane_object(obj, at_fmt, "boulder sanity", null);
                    }
                    if (is_pool_or_lava(x, y)) {
                        at_fmt = sprintf(at_fmt, "%%s boulder@<%d,%d> %%s %%s: on/in %s", x, y, is_pool(x, y) ? "water" : "lava");
                        insane_object(obj, at_fmt, "boulder sanity", null);
                    }
                }
            }
        }
    }
    objlist_sanity(game.invent, 3, "invent sanity");
    objlist_sanity(game.migrating_objs, 5, "migrating sanity");
    objlist_sanity(game.level.buriedobjlist, 6, "buried sanity");
    objlist_sanity(game.billobjs, 7, "bill sanity");
    objlist_sanity(game.objs_deleted, 9, "deleted object sanity");
    mon_obj_sanity(game.level.monlist, "minvent sanity");
    mon_obj_sanity(game.migrating_mons, "migrating minvent sanity");
    if (game.mydogs) {
        /* monsters temporarily in transit;
       they should have arrived with hero by the time we get called */
        impossible("gm.mydogs sanity [not empty]");
        mon_obj_sanity(game.mydogs, "mydogs minvent sanity");
    }
    /* objects temporarily freed from invent/floor lists;
       they should have arrived somewhere by the time we get called */
    if (game.thrownobj) {
        insane_object(game.thrownobj, ofmt3, "thrownobj sanity", null);
    }
    if (game.kickedobj) {
        insane_object(game.kickedobj, ofmt3, "kickedobj sanity", null);
    }
    /* returning_missile temporarily remembers thrownobj and should be
       Null in between moves */
    if (game.iflags.returning_missile) {
        insane_object(game.kickedobj, ofmt3, "returning_missile sanity", null);
    }
    /* gc.current_wand isn't removed from invent while in use, but should
       be Null between moves when we're called */
    if (game.current_wand) {
        insane_object(game.current_wand, ofmt3, "current_wand sanity", null);
    }
}
/* sanity check for objects on specified list (fobj, &c) */
export function objlist_sanity(objlist, wheretype, mesg) {
    let obj = null;
    for (obj = objlist; obj; obj = obj.nobj) {
        if (obj.where != wheretype) {
            insane_object(obj, ofmt0, mesg, null);
        }
        if (obj.where == 3 && obj.how_lost != 0) {
            let lostbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            lostbuf = sprintf(lostbuf, "how_lost=%d obj in inventory!", obj.how_lost);
            /* %d: bitfield is unsigned but narrow, so promotes to int */
            insane_object(obj, ofmt0, lostbuf, null);
        }
        if (((obj).cobj != null)) {
            if (wheretype == 7) {
                insane_object(obj, "%s obj contains something! %s %s: %s", mesg, null);
            }
            check_contained(obj, mesg);
        }
        if (obj.unpaid || obj.no_charge) {
            /* containers on shop bill should always be empty */
            shop_obj_sanity(obj, mesg);
        }
        if (obj.owornmask) {
            let maskbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let bc_ok = (0);
            switch (obj.where) {
                case 3:
                case 4:
                    sanity_check_worn(obj);
                    break;
                case 5:
                    break;
                case 1:
                    bc_ok = (1);
                    ;
                default:
                    if ((obj != game.uchain && obj != game.uball) || !bc_ok) {
                        maskbuf = sprintf(maskbuf, "worn mask 0x%08lx", obj.owornmask);
                        /* migrating objects overload the owornmask field
                   with a destination code; skip attempt to check it */
                        /* note: ball and chain can also be OBJ_FREE, but not across
                   turns so this sanity check shouldn't encounter that */
                        /* discovered an object not in inventory which
                       erroneously has worn mask set */
                        insane_object(obj, ofmt0, maskbuf, null);
                    }
                    break;
            }
        }
        if (obj.otyp == LEASH && obj.corpsenm) {
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let mtmp = find_mid(obj.corpsenm, 1);
            if (obj.where == 3) {
                /* found leash with phantom mon */
                /* have to explicitly exclude migrating_objs because the
               obj->migr_species field overlays obj->corpsenm just like
               obj->leashmon does, so obj->leashmon and consequently 'mtmp'
               might be inaccurate for any leash found on migrating_objs */
                if (!mtmp) {
                    buf = sprintf(buf, "leashmon=%u no monst,", obj.corpsenm);
                    insane_object(obj, ofmt0, buf, null);
                } else if (!mtmp.mleashed) {
                    buf = sprintf(buf, "leashmon=%u %s not leashed,", obj.corpsenm, mon_pmname(mtmp));
                    insane_object(obj, ofmt0, buf, null);
                }
            } else if (obj.where != 5) {
                /* found leashed mon
                                               * not flagged as leashed */
                let mtmp2 = (obj.where == 4) ? obj.v.v_ocarry : null;
                /* found monst leashed by non-invent leash */
                if (mtmp) {
                    buf = sprintf(buf, "leashmon:%u %s leashed by %s leash,", obj.corpsenm, mon_pmname(mtmp), where_name(obj));
                    insane_object(obj, ofmt0, buf, mtmp2);
                /* found non-invent leash with m_id of phantom mon */
                } else {
                    buf = sprintf(buf, "leashmon:%u no monst for %s leash,", obj.corpsenm, where_name(obj));
                    insane_object(obj, ofmt0, buf, mtmp2);
                }
            }
        }
        if (obj.globby) {
            check_glob(obj, mesg);
        }
        /* temporary flags that might have been set but which should
           be clear by the time this sanity check is taking place */
        if (obj.in_use || obj.bypass || obj.nomerge || (obj.otyp == BOULDER && obj.corpsenm)) {
            insane_obj_bits(obj, null);
        }
    }
}
/* check obj->unpaid and obj->no_charge for shop sanity; caller has
   verified that at least one of them is set */
export function shop_obj_sanity(obj, mesg) {
    let otop = null;
    let shkp = null;
    let why = null;
    let costly = 0;
    let costlytoo = 0;
    let x = 0;
    let y = 0;
    /* if contained, get top-most container; we needs its location */
    otop = obj;
    while (otop.where == 2) {
        otop = otop.v.v_ocontainer;
    }
    /* get obj's or its container's location; do not update obj->ox,oy
       or otop->ox,oy because that would cause sanity checking to
       produce side-effects that won't occur when not sanity checking;
       no need for CONTAINED_TOO because we have a top level container */
    get_obj_location(otop, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 2);
    /* these will always be needed for the normal case, so don't bother
       waiting until we find an insanity to fetch them */
    shkp = find_objowner(obj, x, y);
    if (shkp && obj.where == 7) {
        x = shkp.mx , y = shkp.my;
    }
    costly = costly_spot(x, y);
    costlytoo = costly_adjacent(shkp, x, y);
    why = null;
    if (obj.no_charge && obj.unpaid) {
        why = "%s obj both unpaid and no_charge! %s %s: %s";
    } else if (obj.unpaid) {
        /* unpaid is only applicable for directly carried objects, for
           objects inside carried containers, for used up items on the
           billobjs list, and for floor items outside the shop proper
           but within the shop boundary (walls, door, "free spot") and
           for objects moved from such spots into the shop proper by
           repair of shop walls or items buried while on boundary */
        if (otop.where != 3 && obj.where != 7 && ((otop.where != 1 && obj.where != 6) || !(costly || costlytoo))) {
            why = "%s unpaid obj not carried! %s %s: %s";
        } else if (!costly && !costlytoo) {
            why = "%s unpaid obj not inside tended shop! %s %s: %s";
        } else if (!shkp) {
            why = "%s unpaid obj inside untended shop! %s %s: %s";
        } else if (!onshopbill(obj, shkp, (1))) {
            why = "%s unpaid obj not on shop bill! %s %s: %s";
        }
    } else if (obj.no_charge) {
        /* no_charge is only applicable for floor objects in shops, for
           objects inside floor containers in shops, and for objects buried
           beneath the shop floor or carried by a monster (usually pet) */
        if (otop.where != 1 && otop.where != 6 && otop.where != 4) {
            why = "%s no_charge obj not on floor! %s %s: %s";
        } else if (!costly && !costlytoo) {
            why = "%s no_charge obj not inside tended shop! %s %s: %s";
        } else if (!shkp) {
            why = "%s no_charge obj inside untended shop! %s %s: %s";
        } else if (onshopbill(obj, shkp, (1))) {
            why = "%s no_charge obj on shop bill! %s %s: %s";
        }
    }
    if (why) {
        insane_object(obj, why, mesg, ((otop).where == 4) ? otop.v.v_ocarry : null);
    }
    return;
}
/* sanity check for objects carried by all monsters in specified list */
export function mon_obj_sanity(monlist, mesg) {
    let mon = null;
    let obj = null;
    let mwep = null;
    for (mon = monlist; mon; mon = mon.nmon) {
        if (((mon).mhp < 1)) {
            continue;
        }
        mwep = ((mon).mw);
        if (mwep) {
            if (!((mwep).where == 4)) {
                insane_object(mwep, mfmt1, mesg, mon);
            }
            if (mwep.v.v_ocarry != mon) {
                insane_object(mwep, mfmt2, mesg, mon);
            }
        }
        for (obj = mon.minvent; obj; obj = obj.nobj) {
            if (obj.where != 4) {
                insane_object(obj, mfmt1, mesg, mon);
            }
            if (obj.v.v_ocarry != mon) {
                insane_object(obj, mfmt2, mesg, mon);
            }
            if (obj.globby) {
                check_glob(obj, mesg);
            }
            check_contained(obj, mesg);
            if (obj.unpaid || obj.no_charge) {
                shop_obj_sanity(obj, mesg);
            }
            if (obj.in_use || obj.bypass || obj.nomerge || (obj.otyp == BOULDER && obj.corpsenm)) {
                insane_obj_bits(obj, mon);
            }
            if (obj == mwep) {
                mwep = null;
            }
        }
        if (mwep) {
            /* this is a monster check rather than an object check, but doing
               it here avoids making an extra pass through mon's minvent;
               if the full pass through that list hasn't reset mwep to Null,
               then mwep isn't in that list where it should be */
            impossible("monst (%s: %u) wielding %s (%u) not in %s inventory", pmname(mon.data, Mgender(mon)), mon.m_id, safe_typename(mwep.otyp), mwep.o_id, (genders[pronoun_gender(mon, 2)].his));
        }
    }
}
export function insane_obj_bits(obj, mon) {
    let o_in_use = 0;
    let o_bypass = 0;
    let o_nomerge = 0;
    let o_boulder = 0;
    if (obj.where == 9) {
        return;
    }
    /* skip bit checking for deleted objects */
    o_in_use = obj.in_use;
    o_bypass = obj.bypass;
    /* having obj->nomerge be set might be intentional */
    o_nomerge = (obj.nomerge && !nomerge_exception(obj));
    /* next_boulder is only for object name formatting when pushing
       boulders and should be reset by time of next sanity check */
    o_boulder = (obj.otyp == BOULDER && obj.corpsenm);
    if (o_in_use || o_bypass || o_nomerge || o_boulder) {
        let infobuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        infobuf = sprintf(infobuf, "flagged%s%s%s%s", o_in_use ? " in_use" : "", o_bypass ? " bypass" : "", o_nomerge ? " nomerge" : "", o_boulder ? " nxtbldr" : "");
        insane_object(obj, ofmt0, infobuf, mon);
    }
}
/* does 'obj' use the 'nomerge' flag persistently? */
export function nomerge_exception(obj) {
    /* special prize objects for achievement tracking are set 'nomerge'
       until they get picked up by the hero */
    if (((obj).o_id == game.context.achieveo.mines_prize_oid) || ((obj).o_id == game.context.achieveo.soko_prize_oid)) {
        return (1);
    }
    return (0);
}
/* This must stay consistent with the defines in obj.h. */
const obj_state_names = ["free", "floor", "contained", "invent", "minvent", "migrating", "buried", "onbill", "luafree", "deleted"];
let __where_name_unknown = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function where_name(obj) {
    /* big enough to handle rogue 64-bit int */
    let where = 0;
    if (!obj) {
        return "nowhere";
    }
    where = obj.where;
    if (where < 0 || where >= 10 || !obj_state_names[where]) {
        __where_name_unknown = sprintf(__where_name_unknown, "unknown[%d]", where);
        return __where_name_unknown;
    }
    return obj_state_names[where];
}
export function insane_object(obj, fmt, mesg, mon) {
    let objnm = null;
    let monnm = null;
    let altfmt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    objnm = monnm = "null!";
    if (obj) {
        game.iflags.override_ID++;
        objnm = doname(obj);
        game.iflags.override_ID--;
    }
    if (mon || (strstri(mesg, "minvent") && !strstri(mesg, "contained"))) {
        strcat(strcpy(altfmt, fmt), " held by mon %s (%s)");
        if (mon) {
            monnm = x_monnam(mon, 2, null, 31, (1));
        }
        impossible(altfmt, mesg, fmt_ptr(obj), where_name(obj), objnm, fmt_ptr(mon), monnm);
    } else {
        impossible(fmt, mesg, fmt_ptr(obj), where_name(obj), objnm);
    }
}
/* initialize a dummy obj with just enough info to allow some of the tests in
   obj.h that take an obj pointer to work; used when applying a stethoscope
   toward a mimic mimicking an object */
export function init_dummyobj(obj, otyp, oquan) {
    if (obj) {
        Object.assign(obj, cg.zeroobj);
        obj.v = { v_nexthere: null, v_ocontainer: null, v_ocarry: null };
        obj.otyp = otyp;
        obj.oclass = game.objects[otyp].oc_class;
        /* suppress known except for amulets (needed for fakes & real AoY) */
        obj.known = (obj.oclass == AMULET_CLASS) ? obj.known : !game.objects[otyp].oc_uses_known;
        obj.quan = oquan ? oquan : 1;
        /* suppress statue and figurine details */
        obj.corpsenm = NON_PM;
        if (obj.otyp == LEASH) {
            obj.corpsenm = 0;
        }
        /* overloads corpsenm, avoid NON_PM */
        if (obj.otyp == BOULDER) {
            obj.corpsenm = 0;
        }
        /* but suppressing fruit details leads to "bad fruit #0" */
        if (obj.otyp == SLIME_MOLD) {
            obj.spe = game.context.current_fruit;
        }
    }
    return obj;
}
/* obj sanity check: check objects inside container */
export function check_contained(container, mesg) {
    let obj = null;
    /* big enough to work with, not too big to blow out stack in recursion */
    let mesgbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let nestedmesg = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!((container).cobj != null)) {
        return;
    }
    /* change "invent sanity" to "contained invent sanity"
       but leave "nested contained invent sanity" as is */
    if (!strstri(mesg, "contained")) {
        mesg = strcat(strcpy(mesgbuf, "contained "), mesg);
    }
    for (obj = container.cobj; obj; obj = obj.nobj) {
        /* catch direct cycle to avoid unbounded recursion */
        if (obj == container) {
            panic("failed sanity check: container holds itself");
        }
        if (obj.where != 2) {
            insane_object(obj, "%s obj %s %s: %s", mesg, null);
        } else if (obj.v.v_ocontainer != container) {
            impossible("%s obj %s in container %s, not %s", mesg, fmt_ptr(obj), fmt_ptr(obj.v.v_ocontainer), fmt_ptr(container));
        }
        if (obj.globby) {
            check_glob(obj, mesg);
        }
        if (((obj).cobj != null)) {
            /* catch most likely indirect cycle; we won't notice if
               parent is present when something comes before it, or
               notice more deeply embedded cycles (grandparent, &c) */
            if (obj.cobj == container) {
                panic("failed sanity check: container holds its parent");
            }
            nestedmesg = strcpy(nestedmesg, "nested ");
            /* change "contained... sanity" to "nested contained... sanity"
               and "nested contained..." to "nested nested contained..." */
            copynchars(eos(nestedmesg), mesg, 120 /* sizeof(char [120]) */ - strlen(nestedmesg) - 1);
            /* recursively check contents */
            check_contained(obj, nestedmesg);
        }
    }
}
/* called when 'obj->globby' is set so we don't recheck it here */
export function check_glob(obj, mesg) {
    if (obj.quan != 1 || obj.owt == 0 || obj.otyp < GLOB_OF_GRAY_OOZE || obj.otyp > GLOB_OF_BLACK_PUDDING) {
        let mesgbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let globbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        globbuf = sprintf(globbuf, " glob %d,quan=%ld,owt=%u ", obj.otyp, obj.quan, obj.owt);
        mesg = strsubst(strcpy(mesgbuf, mesg), " obj ", globbuf);
        insane_object(obj, ofmt0, mesg, (obj.where == 4) ? obj.v.v_ocarry : null);
    }
}
/* check an object in hero's or monster's inventory which has worn mask set */
/* [W_ART,W_ARTI are property bits for items which aren't worn] */
let __sanity_check_worn_wearbits = [1, 2, 4, 8, 16, 32, 64, 256, 512, 1024, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 0];
export function sanity_check_worn(obj) {
    let maskbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let what = null;
    let owornmask = 0;
    let allmask = 0;
    let embedded = (0);
    let i = 0;
    let n = 0;
    /* use owornmask for testing and bit twiddling, but use original
       obj->owornmask for printing */
    owornmask = obj.owornmask;
    for (i = 0; __sanity_check_worn_wearbits[i]; ++i) {
        /* figure out how many bits are set, and also which are viable */
        if ((owornmask & __sanity_check_worn_wearbits[i]) != 0) {
            ++n;
        }
        allmask |= __sanity_check_worn_wearbits[i];
    }
    if (obj == game.uskin) {
        /* embedded dragon scales have an extra bit set;
           make sure it's set, then suppress it */
        embedded = (1);
        if ((owornmask & (1 | 536870912)) == (1 | 536870912)) {
            owornmask &= ~536870912;
        /* force insane_object("bogus") below */
        } else {
            n = 0 , owornmask = ~0;
        }
    }
    if (n == 2 && ((obj).where == 3) && obj == game.uball && (owornmask & 2097152) != 0 && (owornmask & (256 | 1024 | 512)) != 0) {
        /* chained ball can be wielded/alt-wielded/quivered; if so,
          pretend it's not chained in order to check the weapon pointer
          (we've already verified the ball pointer by successfully passing
          the if-condition to get here...) */
        owornmask &= ~2097152;
        n = 1;
    }
    if (n > 1) {
        maskbuf = sprintf(maskbuf, "worn mask (multiple) 0x%08lx", obj.owornmask);
        insane_object(obj, ofmt0, maskbuf, null);
    }
    if ((owornmask & ~allmask) != 0 || (((obj).where == 3) && (owornmask & 1048576) != 0)) {
        maskbuf = sprintf(maskbuf, "worn mask (bogus)) 0x%08lx", obj.owornmask);
        insane_object(obj, ofmt0, maskbuf, null);
    }
    if (n == 1 && (((obj).where == 3) || (owornmask & (2097152 | 4194304)) != 0)) {
        /* check for items worn in invalid slots; practically anything can
           be wielded/alt-wielded/quivered, so tests on those are limited */
        what = null;
        switch (owornmask) {
            case 1:
                if (obj != (embedded ? game.uskin : game.uarm)) {
                    what = embedded ? "skin" : "suit";
                }
                break;
            case 2:
                if (obj != game.uarmc) {
                    what = "cloak";
                }
                break;
            case 4:
                if (obj != game.uarmh) {
                    what = "helm";
                }
                break;
            case 8:
                if (obj != game.uarms) {
                    what = "shield";
                }
                break;
            case 16:
                if (obj != game.uarmg) {
                    what = "gloves";
                }
                break;
            case 32:
                if (obj != game.uarmf) {
                    what = "boots";
                }
                break;
            case 64:
                if (obj != game.uarmu) {
                    what = "shirt";
                }
                break;
            case 256:
                if (obj != game.uwep) {
                    what = "primary weapon";
                }
                break;
            case 512:
                if (obj != game.uquiver) {
                    what = "quiver";
                }
                break;
            case 1024:
                if (obj != game.uswapwep) {
                    what = game.u.twoweap ? "secondary weapon" : "alternate weapon";
                }
                break;
            case 65536:
                if (obj != game.uamul) {
                    what = "amulet";
                }
                break;
            case 131072:
                if (obj != game.uleft) {
                    what = "left ring";
                }
                break;
            case 262144:
                if (obj != game.uright) {
                    what = "right ring";
                }
                break;
            case 524288:
                if (obj != game.ublindf) {
                    what = "blindfold";
                }
                break;
            case 2097152:
                if (obj != game.uball) {
                    what = "ball";
                }
                break;
            case 4194304:
                if (obj != game.uchain) {
                    what = "chain";
                }
                break;
            default:
                break;
        }
        if (what) {
            maskbuf = sprintf(maskbuf, "worn mask 0x%08lx != %s", obj.owornmask, what);
            insane_object(obj, ofmt0, maskbuf, null);
        }
    }
    /* not (NH_DEVEL_STATUS != NH_STATUS_RELEASED) || DEBUG) */
    /* dummy use of obj to avoid "arg not used" complaint */
    if (n == 1 && (((obj).where == 3) || (owornmask & (2097152 | 4194304)) != 0 || ((obj).where == 4))) {
        what = null;
        if (owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) {
            if (obj.oclass != ARMOR_CLASS) {
                what = "armor";
            }
            /* 3.6: dragon scale mail reverts to dragon scales when
               becoming embedded in poly'd hero's skin */
            if (embedded && !((obj).otyp >= GRAY_DRAGON_SCALES && (obj).otyp <= YELLOW_DRAGON_SCALES)) {
                what = "skin";
            }
        } else if (owornmask & (256 | 1024 | 512)) {
            /* monsters don't maintain alternate weapon or quiver */
            if (((obj).where == 4) && (owornmask & (1024 | 512)) != 0) {
                what = (owornmask & 1024) != 0 ? "monst alt weapon?" : "monst quiver?";
            } else if (obj.oclass == COIN_CLASS && (owornmask & (256 | 1024)) != 0) {
                what = (owornmask & 256) != 0 ? "weapon" : "alt weapon";
            }
        } else if (owornmask & 65536) {
            /* hero can quiver gold but not wield it (hence not alt-wield
               it either); also catches monster wielding gold */
            if (obj.oclass != AMULET_CLASS) {
                what = "amulet";
            }
        } else if (owornmask & (131072 | 262144)) {
            if (obj.oclass != RING_CLASS && obj.otyp != MEAT_RING) {
                what = "ring";
            }
        } else if (owornmask & 524288) {
            if (obj.otyp != BLINDFOLD && obj.otyp != TOWEL && obj.otyp != LENSES) {
                what = "blindfold";
            }
        } else if (owornmask & 2097152) {
            if (obj.oclass != BALL_CLASS) {
                what = "chained ball";
            }
        } else if (owornmask & 4194304) {
            if (obj.oclass != CHAIN_CLASS) {
                what = "chain";
            }
        } else if (owornmask & 1048576) {
            if (obj.otyp != SADDLE) {
                what = "saddle";
            }
        }
        if (what) {
            let oclassname = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let mon = ((obj).where == 4) ? obj.v.v_ocarry : null;
            oclassname = strcpy(oclassname, def_oc_syms[obj.oclass].name);
            maskbuf = sprintf(maskbuf, "worn (%s %s)", makesingular(oclassname), what);
            /* if we've found a potion worn in the amulet slot,
               this yields "worn (potion amulet)" */
            insane_object(obj, ofmt0, maskbuf, mon);
        }
    }
}
/*
 * wrapper to make "near this object" convenient
 */
export function obj_nexto(otmp) {
    if (!otmp) {
        impossible("obj_nexto: wasn't given an object to check");
        return null;
    }
    return obj_nexto_xy(otmp, otmp.ox, otmp.oy, (1));
}
/*
 * looks for objects of a particular type next to x, y
 * skips over oid if found (lets us avoid ourselves if
 * we're looking for a second type of an existing object)
 *
 * TODO: return a list of all objects near us so we can more
 * reliably predict which one we want to 'find' first
 */
export function obj_nexto_xy(obj, x, y, recurs) {
    let otmp = null;
    let fx = 0;
    let fy = 0;
    let ex = 0;
    let ey = 0;
    let otyp = obj.otyp;
    let dx = 0;
    let dy = 0;
    /* check under our "feet" first */
    otmp = sobj_at(otyp, x, y);
    while (otmp) {
        /* don't be clever and find ourselves */
        if (otmp != obj && mergable(otmp, obj)) {
            return otmp;
        }
        otmp = nxtobj(otmp, otyp, (1));
    }
    if (!recurs) {
        return null;
    }
    /* search in a random order */
    dx = (rn2(2) ? -1 : 1);
    dy = (rn2(2) ? -1 : 1);
    ex = x - dx;
    ey = y - dy;
    for (fx = ex; abs(fx - ex) < 3; fx += dx) {
        for (fy = ey; abs(fy - ey) < 3; fy += dy) {
            if (isok(fx, fy) && (fx != x || fy != y)) {
                if ((otmp = obj_nexto_xy(obj, fx, fy, (0))) != null) {
                    return otmp;
                }
            }
        }
    }
    return null;
}
/*
 * Causes one object to absorb another, increasing weight
 * accordingly.  Frees obj2; obj1 remains and is returned.
 */
export function obj_absorb(obj1, obj2) {
    let otmp1 = null;
    let otmp2 = null;
    let o1wt = 0;
    let o2wt = 0;
    let agetmp = 0;
    if (obj1 && obj2) {
        /* don't let people dumb it up */
        otmp1 = obj1;
        otmp2 = obj2.value;
        if (otmp1 && otmp2 && otmp1 != otmp2) {
            globby_bill_fixup(otmp1, otmp2);
            if (otmp1.bknown != otmp2.bknown) {
                otmp1.bknown = otmp2.bknown = 0;
            }
            if (otmp1.rknown != otmp2.rknown) {
                otmp1.rknown = otmp2.rknown = 0;
            }
            if (otmp1.greased != otmp2.greased) {
                otmp1.greased = otmp2.greased = 0;
            }
            if (otmp1.oeroded || otmp2.oeroded) {
                otmp1.oeroded = otmp2.oeroded = 1;
            }
            o1wt = otmp1.oeaten ? otmp1.oeaten : otmp1.owt;
            o2wt = otmp2.oeaten ? otmp2.oeaten : otmp2.owt;
            /* averaging the relative ages is less likely to overflow
               than averaging the absolute ages directly */
            agetmp = (Math.trunc(((game.moves - otmp1.age) * o1wt + (game.moves - otmp2.age) * o2wt) / (o1wt + o2wt)));
            /* convert relative age back to absolute age */
            otmp1.age = game.moves - agetmp;
            otmp1.owt += o2wt;
            if (otmp1.oeaten || otmp2.oeaten) {
                otmp1.oeaten = o1wt + o2wt;
            }
            otmp1.quan = 1;
            if (otmp1.globby && otmp2.globby) {
                /* average (not weighted, no pun intended) the two globs'
                   shrink timers and use that to give otmp1 a new timer */
                let tm1 = stop_timer(SHRINK_GLOB, obj_to_any(otmp1));
                let tm2 = stop_timer(SHRINK_GLOB, obj_to_any(otmp2));
                tm1 = Math.trunc(((tm1 ? tm1 : 25) + (tm2 ? tm2 : 25) + 1) / 2);
                start_glob_timeout(otmp1, tm1);
            }
            /* get rid of second glob, return augmented first one */
            obj_extract_self(otmp2);
            dealloc_obj(otmp2);
            obj2.value = null;
            return otmp1;
        }
    }
    impossible("obj_absorb: not called with two actual objects");
    return null;
}
/*
 * Causes the heavier object to absorb the lighter object in
 * most cases, but if one object is OBJ_FREE and the other is
 * on the floor, the floor object goes first.  Note that when
 * a globby monster dies, its corpse (new glob) will be created
 * on the floor; when a glob is dropped, thrown, or kicked it
 * will be free at the time obj_meld() gets called.
 *
 * Wrapper for obj_absorb() so that floor_effects works more
 * cleanly (since we don't know which we want to stay around).
 */
export function obj_meld(obj1, obj2) {
    let otmp1 = null;
    let otmp2 = null;
    let result = null;
    let ox = 0;
    let oy = 0;
    if (obj1 && obj2) {
        otmp1 = obj1;
        otmp2 = obj2;
        if (otmp1 && otmp2 && otmp1 != otmp2) {
            ox = oy = 0;
            if (!(otmp2.where == 1 && otmp1.where == 0) && (otmp1.owt > otmp2.owt || (otmp1.owt == otmp2.owt && rn2(2)))) {
                /*
             * FIXME?
             *  If one of the objects is free because it's being dropped,
             *  we should really finish a full drop and then absorb/meld
             *  if it survives the flooreffects().  Then lighter-melds-into-
             *  heavier will be true even when heavier is the one dropped.
             *
             *  [Also, what about when one of the globs is on the shore
             *  and we drop the other into adjacent pool or vice versa?]
             */
                if (otmp2.where == 1) {
                    ox = otmp2.ox , oy = otmp2.oy;
                }
                result = obj_absorb(obj1, obj2);
            } else {
                if (otmp1.where == 1) {
                    ox = otmp1.ox , oy = otmp1.oy;
                }
                result = obj_absorb(obj2, obj1);
            }
            if (ox) {
                /* callers really ought to take care of this; glob melding is
               a bookkeeping issue rather than a display one */
                if (((game.viz_array[oy][ox] & 2) != 0)) {
                    newsym(ox, oy);
                }
                /* and this; a hides-under monster might be hiding under
                   the glob that went away; if there's nothing else there
                   to hide under, force it out of hiding */
                maybe_unhide_at(ox, oy);
            }
        }
    } else {
        impossible("obj_meld: not called with two actual objects");
    }
    return result;
}
/* give a message if hero notices two globs merging [used to be in pline.c] */
export function pudding_merge_message(otmp, otmp2) {
    let visible = (((game.viz_array[otmp.oy][otmp.ox] & 2) != 0) || ((game.viz_array[otmp2.oy][otmp2.ox] & 2) != 0));
    let onfloor = (otmp.where == 1 || otmp2.where == 1);
    let inpack = (((otmp).where == 3) || ((otmp2).where == 3));
    if ((!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && visible) || inpack) {
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            if (onfloor) {
                /* the player will know something happened inside his own inventory */
                You_see("parts of the floor melting!");
            } else if (inpack) {
                Your("pack reaches out and grabs something!");
            }
        } else if (onfloor || inpack) {
            let adj = ((otmp.ox != game.u.ux || otmp.oy != game.u.uy) && (otmp2.ox != game.u.ux || otmp2.oy != game.u.uy));
            pline("The %s%s coalesce%s.", (onfloor && adj) ? "adjacent " : "", makeplural(obj_typename(otmp.otyp)), inpack ? " inside your pack" : "");
        }
    } else {
        ;
        You_hear("a faint sloshing sound.");
    }
}
/*mkobj.c*/
/* 3.6.3: this used to be impossible() followed by return 0
           but most callers aren't prepared to deal with Null result
           and cluttering them up to do so is pointless */
/* next_boulder overloads corpsenm so the default value is NON_PM;
           since that is non-zero, the "next boulder" case in xname() would
           happen when it shouldn't; explicitly set it to 0 */
/* default is "on" for types which don't use it */
/*
         * This was relevant before the shrink_glob timer was adopted but
         * now any glob could have a weight that isn't a multiple of 20.
         */
/* a partially eaten glob could have any non-zero weight but an
           intact one should weigh an exact multiple of base weight (20) */
/* even though we can see where they should be,
             * they'll be out of our view (minvent or container)
             * so don't actually show anything */
