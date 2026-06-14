/* NetHack 5.0	pickup.c	$NHDT-Date: 1773373633 2026/03/12 19:47:13 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.386 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 *      Contains code for picking objects up, and container use.
 */
/* from invent.c */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_cant, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strcat, strchr, strcmp, strcpy, strncmp } from '../c2js-runtime/string.js';
import { snuff_lit } from './apply.js';
import { touch_artifact } from './artifact.js';
import { exercise } from './attrib.js';
import { fix_ghostly_obj } from './bones.js';
import { bot } from './botl.js';
import { cmdq_add_ec, get_adjacent_loc, isok, paranoid_ynq, yn_function } from './cmd.js';
import { db_under_typ, is_lava, is_pool } from './dbridge.js';
import { c_common_strings, cg, ynNaqchars, ynaqchars, ynqchars } from './decl.js';
import { canseemon, flush_screen, map_glyphinfo, newsym, newsym_force, nul_glyphinfo, sensemon } from './display.js';
import { doaltarobj, dropx, dropy, revive_corpse, trycall } from './do.js';
import { Monnam, christen_monst, hliquid, mon_nam, oname, rndmonnam, x_monnam } from './do_name.js';
import { hitfloor } from './dothrow.js';
import { def_char_to_objclass, def_oc_syms } from './drawing.js';
import { ceiling, surface } from './dungeon.js';
import { container_contents } from './end.js';
import { can_reach_floor, cant_reach_floor, freehand, read_engr_at } from './engrave.js';
import { more_experienced, newexplevel } from './exper.js';
import { scatter } from './explode.js';
import { calc_capacity, check_capacity, in_rooms, inv_cnt, losehp, max_capacity, money_cnt, near_capacity, nomul, obj_to_any } from './hack.js';
import { dist2, strkitten, upstart } from './hacklib.js';
import { addinv, askchain, carrying, consume_obj_charge, count_buc, count_unpaid, currency, dfeature_at, display_inventory, feel_cockatrice, freeinv, g_at, getobj, hold_another_object, is_worn, let_to_name, look_here, merge_choice, nxtobj, obj_here, prinv, sobj_at, sortloot, tally_BUCX, unsortloot, update_inventory, useup, useupf, will_feel_cockatrice } from './invent.js';
import { obj_is_burning } from './light.js';
import { autokey, boxlock, doforce, pick_lock, u_have_forceable_weapon } from './lock.js';
import { bagotricks, makemon, set_malign } from './makemon.js';
import { add_to_container, add_to_minv, get_mtraits, hornoplenty, obj_extract_self, set_bknown, set_corpsenm, splitobj, start_corpse_timeout, start_glob_timeout, unbless, unsplitobj, weight } from './mkobj.js';
import { courtmon } from './mkroom.js';
import { hideunder } from './mon.js';
import { dmgtype_fromattack, poly_when_stoned, stagger } from './mondata.js';
import { ALTAR, AMULET_OF_YENDOR, A_WIS, BAG_OF_HOLDING, BAG_OF_TRICKS, BELL_OF_OPENING, BLINDED, BOULDER, BRASS_LANTERN, CANDELABRUM_OF_INVOCATION, CAN_OF_GREASE, CHEST, COIN_CLASS, CONFUSION, CORPSE, CQ_CANNED, CRAM_RATION, DRAWBRIDGE_UP, EXT_ENCUMBER, FIRST_OBJECT, FIRST_REAL_GEM, FIRST_SPELL, FOOD_RATION, FOOT, FUMBLING, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_EXCLUDE_SELECTABLE, GETOBJ_SUGGEST, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GOLD_PIECE, GRAVE, HALF_PHDAM, HALLUC, HALLUC_RES, HAND, HORN_OF_PLENTY, HVY_ENCUMBER, ICE, ICE_BOX, LARGE_BOX, LAST_GLASS_GEM, LAST_SPELL, LAVAPOOL, LAVAWALL, LEASH, LEMBAS_WAFER, LOADSTONE, MAGIC_LAMP, MOD_ENCUMBER, NUMMONS, NUM_OBJECTS, OIL_LAMP, PIT, PLNMSG_BACK_ON_GROUND, PLNMSG_OBJNAM_ONLY, PM_CHICKATRICE, PM_CLERIC, PM_COCKATRICE, PM_DEATH, PM_FAMINE, PM_HOUSECAT, PM_ICE_TROLL, PM_PESTILENCE, PM_STONE_GOLEM, POOL, POTION_CLASS, POT_OIL, P_BASIC, P_PICK_AXE, P_RIDING, REVIVE_MON, ROT_CORPSE, SCR_SCARE_MONSTER, SHOPBASE, SHRINK_GLOB, SLT_ENCUMBER, SPE_BOOK_OF_THE_DEAD, SPE_WIZARD_LOCK, SPIKED_PIT, STAIRS, STATUE, STONE, STONE_RES, STUNNED, TALLOW_CANDLE, THRONE, TOOL_CLASS, VENOM_CLASS, WAN_CANCELLATION, WAX_CANDLE, WEAPON_CLASS, invlet_basic, st_all, st_corpse, st_gloves, st_petrifies, st_resists } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { Doname2, The, Tobjnam, Yname2, Ysimple_name2, an, ansimpleoname, corpse_xname, doname, doname_with_price, killer_xname, makesingular, otense, safe_qbuf, the, thesimpleoname, vtense, xname, yname, ysimple_name } from './objnam.js';
import { self_lookat, waterbody_name } from './pager.js';
import { Norep, There, livelog_printf, urgent_pline } from './pline.js';
import { body_part, polymon } from './polyself.js';
import { d, rn2, rn2_on_display_rng, rnd } from './rnd.js';
import { genders } from './role.js';
import { Shk_Your, addtobill, check_unpaid_usage, costly_spot, obfree, pick_pick, remote_burglary, sellobj, sellobj_state, shop_keeper, stolen_value, subfrombill } from './shk.js';
import { tiphat } from './sounds.js';
import { remove_worn_item } from './steal.js';
import { rider_cant_reach } from './steed.js';
import { stop_timer } from './timeout.js';
import { back_on_ground, chest_trap, instapetrify, t_at, uescaped_shaft, unconscious, uteetering_at_seen_pit } from './trap.js';
import { setuqwep, setuswapwep, setuwep, welded, weldmsg } from './wield.js';
import { add_menu, add_menu_heading, add_menu_str, getlin, select_menu } from './windows.js';
import { extract_from_minvent, which_armor } from './worn.js';
import { get_obj_location } from './zap.js';

/* not used */
/* define for query_objlist() and autopickup() */
/* if you can figure this out, give yourself a hearty pat on the back... */
const slightloadpfx = "You have a little trouble";
const moderateloadpfx = "You have trouble";
const nearloadpfx = "You have much trouble";
const overloadpfx = "You have extreme difficulty";
/* BUG: this lets you look at cockatrice corpses while blind without
   touching them */
/* much simpler version of the look-here code; used by query_classes() */
/* list of objects */
/* flag for type of obj list linkage */
export async function simple_look(otmp, here) {
    if (!otmp) {
        await impossible("simple_look(null)");
    } else if (!(here ? otmp.v.v_nexthere : otmp.nobj)) {
        await pline("%s", await doname(otmp));
    } else {
        let tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_putstr)(tmpwin, 0, "");
        do {
            (game.windowprocs.win_putstr)(tmpwin, 0, await doname(otmp));
            otmp = here ? otmp.v.v_nexthere : otmp.nobj;
        } while (otmp);
        await (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    }
}
export function collect_obj_classes(ilets, otmp, here, filter, itemcount) {
    let iletct = 0;
    let c = 0;
    itemcount.value = 0;
    /* terminate ilets so that strchr() will work */
    ilets = __nh_char_write(ilets, iletct, 0);
    while (otmp) {
        c = def_oc_syms[otmp.oclass].sym;
        if (!strchr(ilets, c) && (!filter || (filter)(otmp))) {
            ilets = __nh_char_write(ilets, iletct++, c) , ilets = __nh_char_write(ilets, iletct, 0);
        }
        itemcount.value += 1;
        otmp = here ? otmp.v.v_nexthere : otmp.nobj;
    }
    return iletct;
}
/*
 * For menustyle:Traditional and menustyle:Combination.
 *
 * Suppose some '?' and '!' objects are present, but '/' objects aren't:
 *      "a" picks all items without further prompting;
 *      "A" steps through all items, asking one by one;
 *      "?" steps through '?' items, asking, and ignores '!' ones;
 *      "/" becomes 'A', since no '/' present;
 *      "?a" or "a?" picks all '?' without further prompting;
 *      "/a" or "a/" becomes 'A' since there aren't any '/'
 *          (bug fix:  3.1.0 thru 3.1.3 treated it as "a");
 *      "?/a" or "a?/" or "/a?",&c picks all '?' even though no '/'
 *          (ie, treated as if it had just been "?a").
 *
 * Note: the behavior and meaning of 'a' vs 'A' is effectively reversed
 * when using menustyle:Full.  For Traditional, the choice is based on
 * ease of typing (using 'a' is much more common than 'A'); for Full,
 * it was changed to enhance menu entry ordering ('A' stands out, but
 * some players complain that it is too easy to choose accidentally).
 */
/* selected classes */
/* to tell caller that user picked 'A' */
/* to tell caller that user picked 'a' */
/* verb for what activity needs objects */
/* invent or container->cobj or level.objects[x][y] */
/* True: traverse by obj->nexthere; False: by obj->nobj */
/* to tell caller that user picked 'm' */
export async function query_classes(oclasses, one_at_a_time, everything, action, objs, here, menu_on_demand) {
    /* FIXME: hardcoded ilets[] length */
    let ilets = '';
    let inbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let iletct = 0;
    let oclassct = 0;
    let not_everything = 0;
    let filtered = 0;
    let qbuf = '';
    let m_seen = 0;
    let itemcount = 0;
    let bcnt = 0;
    let ucnt = 0;
    let ccnt = 0;
    let xcnt = 0;
    let ocnt = 0;
    let jcnt = 0;
    oclasses = __nh_char_write(oclasses, oclassct = 0, 0);
    one_at_a_time.value = everything.value = m_seen = (0);
    if (menu_on_demand) {
        menu_on_demand.value = 0;
    }
    iletct = collect_obj_classes(ilets, objs, here, null, { get value() { return itemcount; }, set value(_v) { itemcount = _v; } });
    if (iletct == 0) {
        return (0);
    }
    if (iletct == 1) {
        oclasses = __nh_char_write(oclasses, 0, def_char_to_objclass(__nh_char_at0(ilets)));
        oclasses = __nh_char_write(oclasses, 1, 0);
    } else {
        /* more than one choice available */
        ilets = __nh_char_write(ilets, iletct++, 32);
        ilets = __nh_char_write(ilets, iletct++, 97);
        ilets = __nh_char_write(ilets, iletct++, 65);
        ilets = __nh_char_write(ilets, iletct++, (objs == game.invent ? 105 : 58));
    }
    if (itemcount && menu_on_demand) {
        ilets = __nh_char_write(ilets, iletct++, 109);
    }
    if (count_unpaid(objs)) {
        ilets = __nh_char_write(ilets, iletct++, 117);
    }
    tally_BUCX(objs, here, { get value() { return bcnt; }, set value(_v) { bcnt = _v; } }, { get value() { return ucnt; }, set value(_v) { ucnt = _v; } }, { get value() { return ccnt; }, set value(_v) { ccnt = _v; } }, { get value() { return xcnt; }, set value(_v) { xcnt = _v; } }, { get value() { return ocnt; }, set value(_v) { ocnt = _v; } }, { get value() { return jcnt; }, set value(_v) { jcnt = _v; } });
    if (bcnt) {
        ilets = __nh_char_write(ilets, iletct++, 66);
    }
    if (ucnt) {
        ilets = __nh_char_write(ilets, iletct++, 85);
    }
    if (ccnt) {
        ilets = __nh_char_write(ilets, iletct++, 67);
    }
    if (xcnt) {
        ilets = __nh_char_write(ilets, iletct++, 88);
    }
    if (jcnt) {
        ilets = __nh_char_write(ilets, iletct++, 80);
    }
    ilets = __nh_char_write(ilets, iletct, 0);
    if (iletct > 1) {
        let where = null;
        let sym = 0;
        let oc_of_sym = 0;
        let __nh_p_idx = 0;
        ask_again: while (true) {
            oclasses = __nh_char_write(oclasses, oclassct = 0, 0);
            one_at_a_time.value = everything.value = (0);
            not_everything = filtered = (0);
            qbuf = sprintf(qbuf, "What kinds of thing do you want to %s? [%s]", action, ilets);
            inbuf = await getlin(qbuf, inbuf);
            if (inbuf == 27) {
                return (0);
            }
            for (__nh_p_idx = 0; (sym = __nh_char_at0(__nh_advance_str(inbuf, __nh_p_idx++))) != 0; ) {
                if (sym == 32) {
                    continue;
                } else if (sym == 65) {
                    /* didn't pick anything,
               or tried to pick something that's not present */
                    one_at_a_time.value = (1);
                } else if (sym == 97) {
                    everything.value = (1);
                } else if (sym == 58) {
                    await simple_look(objs, here);
                    /* if we just scanned the contents of a container
                   then mark it as having known contents */
                    if (objs.where == 2) {
                        objs.v.v_ocontainer.cknown = 1;
                    }
                    continue ask_again;
                } else if (sym == 105) {
                    await display_inventory(null, (1));
                    continue ask_again;
                } else if (sym == 109) {
                    m_seen = (1);
                } else if (strchr("uBUCXP", sym)) {
                    /* 'u' or 'B','U','C','X','P' */
                    add_valid_menu_class(sym);
                    filtered = (1);
                } else {
                    oc_of_sym = def_char_to_objclass(sym);
                    if (strchr(ilets, sym)) {
                        add_valid_menu_class(oc_of_sym);
                        oclasses = __nh_char_write(oclasses, oclassct++, oc_of_sym);
                        oclasses = __nh_char_write(oclasses, oclassct, 0);
                    } else {
                        if (!where) {
                            where = !strcmp(action, "pick up") ? "here" : !strcmp(action, "take out") ? "inside" : "";
                        }
                        if (__nh_char_at0(where)) {
                            await There("are no %c's %s.", sym, where);
                        } else {
                            await You("have no %c's.", sym);
                        }
                        not_everything = (1);
                    }
                }
            }
            if (m_seen && menu_on_demand) {
                menu_on_demand.value = (((everything.value || !oclassct) && !filtered) ? -2 : -3);
                return (0);
            }
            if (!oclassct && (!everything.value || not_everything)) {
                one_at_a_time.value = (1);
                everything.value = (0);
            }
            break;
        }
    }
    /* obj didn't fail any of the filter checks, so accept */
    return (1);
}
/*
 * tests:
 *  st_gloves      wearing gloves?
 *  st_corpse      is it a corpse obj?
 *  st_petrifies   does the corpse petrify on touch?
 *  st_resists     does hero have stoning resistance?
 *  st_all         st_gloves | st_corpse | st_petrifies | st_resists
 */
export function u_safe_from_fatal_corpse(obj, tests) {
    if (((tests & st_gloves) && game.uarmg) || ((tests & st_corpse) && obj.otyp != CORPSE) || ((tests & st_petrifies) && !((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE])) || ((tests & st_resists) && (game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic))) {
        return (1);
    }
    return (0);
}
/* check whether hero is bare-handedly touching a cockatrice corpse */
export async function fatal_corpse_mistake(obj, remotely) {
    if (u_safe_from_fatal_corpse(obj, st_all) || remotely) {
        return (0);
    }
    if (poly_when_stoned(game.youmonst.data) && await polymon(PM_STONE_GOLEM)) {
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        return (0);
    }
    await pline("Touching %s is a fatal mistake.", await corpse_xname(obj, null, 1 | 8));
    await instapetrify(await killer_xname(obj));
    return (1);
}
/* attempting to manipulate a Rider's corpse triggers its revival */
export async function rider_corpse_revival(obj, remotely) {
    if (!obj || obj.otyp != CORPSE || !((game.mons[obj.corpsenm]) == game.mons[PM_DEATH] || (game.mons[obj.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[obj.corpsenm]) == game.mons[PM_PESTILENCE])) {
        return (0);
    }
    await pline("At your %s, the corpse suddenly moves...", remotely ? "attempted acquisition" : "touch");
    await revive_corpse(obj);
    await exercise(A_WIS, (0));
    return (1);
}
/* wand of probing zapped down; perhaps hero is levitating while blind */
export async function force_decor(via_probing) {
    /* we don't want describe_decor() to defer feedback if hero is fumbling
       with 1 turn left until next slip_or_trip(), or for ice_descr() to
       omit thawing details if hero is probing when levitating while blind
       (those will be skipped for look_here() and farlook() or autodescribe);
       we can't control that by temporarily tweaking properties because that
       could become noticeable if status gets updated while decor feedback
       is being delivered */
    game.decor_fumble_override = (1);
    game.decor_levitate_override = via_probing;
    /* force current terrain to be different from previous location, or
       uninteresting if previous location was actually inside solid stone */
    game.iflags.prev_decor = STONE;
    await describe_decor();
    game.decor_fumble_override = game.decor_levitate_override = (0);
    game.lastseentyp[game.u.ux][game.u.uy] = game.level.locations[game.u.ux][game.u.uy].typ;
}
/* True: deferring, False: catching up */
export async function deferred_decor(setup) {
    if (!game.flags.mention_decor) {
        game.iflags.defer_decor = (0);
    } else if (setup) {
        game.iflags.defer_decor = (1);
    } else {
        await describe_decor();
        game.iflags.defer_decor = (0);
    }
}
/* handle 'mention_decor' (when walking onto a dungeon feature such as
   stairs or altar, describe it even if it isn't covered up by an object) */
export async function describe_decor() {
    let outbuf = '';
    let fbuf = '';
    let doorhere = 0;
    let waterhere = 0;
    let res = (1);
    let dfeature = null;
    let ltyp = 0;
    if ((game.u.uprops[FUMBLING].intrinsic & 16777215) == 1 && !game.iflags.defer_decor && !game.decor_fumble_override) {
        await deferred_decor((1));
        return (0);
    }
    ltyp = ((game.level.locations[game.u.ux][game.u.uy].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[game.u.ux][game.u.uy].flags) : game.level.locations[game.u.ux][game.u.uy].typ);
    dfeature = await dfeature_at(game.u.ux, game.u.uy, fbuf);
    /* we don't mention "ordinary" doors but do mention broken ones (and
       closed ones, which will only happen for Passes_walls) */
    doorhere = dfeature && (!strcmp(dfeature, "open door") || !strcmp(dfeature, "doorway"));
    waterhere = dfeature && !strcmp(dfeature, "pool of water");
    if (doorhere || (game.u.uinwater) || (ltyp == ICE && ((game.iflags.prev_decor) >= POOL && (game.iflags.prev_decor) <= DRAWBRIDGE_UP))) {
        dfeature = null;
    }
    if (ltyp == game.iflags.prev_decor && !((ltyp) >= STAIRS && (ltyp) <= ALTAR)) {
        /*
     * TODO: if on ice, report moving between thicker and thinner ice (based
     * on ice_descr()'s classification) as if moving onto different terrain.
     */
        res = (0);
    } else if (dfeature) {
        if (waterhere) {
            dfeature = strcpy(fbuf, waterbody_name(game.u.ux, game.u.uy));
        }
        if (strcmp(dfeature, "swamp") && ltyp != ICE) {
            dfeature = await an(dfeature);
        }
        if (game.flags.verbose) {
            outbuf = sprintf(outbuf, "There is %s here.", dfeature);
        } else {
            if (dfeature != fbuf) {
                fbuf = strcpy(fbuf, dfeature);
            }
            outbuf = sprintf(outbuf, "%s.", upstart(fbuf));
        }
        if (ltyp == ICE && game.flags.mention_decor) {
            await Norep("%s", outbuf);
        } else {
            await pline("%s", outbuf);
        }
    } else if (!(game.u.uinwater)) {
        if (((game.iflags.prev_decor) >= POOL && (game.iflags.prev_decor) <= DRAWBRIDGE_UP) || ((game.iflags.prev_decor) == LAVAPOOL || (game.iflags.prev_decor) == LAVAWALL) || game.iflags.prev_decor == ICE) {
            if (game.iflags.last_msg != PLNMSG_BACK_ON_GROUND) {
                await back_on_ground((0));
            }
        }
    }
    /* describe_decor() is normally called when moving onto a different
       type of terrain, but it is also called by pickup() even when
       mention_decor is Off if hero can't reach floor; only adapt the next
       describe_decor() by what has just occurred in this one when it's On */
    game.iflags.prev_decor = game.flags.mention_decor ? ltyp : STONE;
    return res;
}
/* look at the objects at our location, unless there are too many of them */
export async function check_here(picked_some) {
    let obj = null;
    let ct = 0;
    let lhflags = picked_some ? 1 : 0;
    if (game.flags.mention_decor) {
        if (await describe_decor()) {
            lhflags |= 2;
        }
    }
    for (obj = game.level.objects[game.u.ux][game.u.uy]; obj; obj = obj.v.v_nexthere) {
        if (obj != game.uchain) {
            ct++;
        }
    }
    if (ct) {
        /* If there are objects here, take a look. */
        if (game.context.run) {
            nomul(0);
        }
        await flush_screen(1);
        await look_here(ct, lhflags);
    } else {
        await read_engr_at(game.u.ux, game.u.uy);
    }
}
/* query_objlist callback: return TRUE if obj's count is >= reference value */
export function n_or_more(obj) {
    if (obj == game.uchain) {
        return (0);
    }
    return (obj.quan >= game.val_for_n_or_more);
}
/* check valid_menu_classes[] for an entry; also used by askchain() */
export function menu_class_present(c) {
    return (c && strchr(game.valid_menu_classes, c)) ? (1) : (0);
}
let __add_valid_menu_class_vmc_count = 0;
__nh_register_static(() => { __add_valid_menu_class_vmc_count = 0; });
export function add_valid_menu_class(c) {
    if (c == 0) {
        __add_valid_menu_class_vmc_count = 0;
        game.class_filter = game.bucx_filter = game.shop_filter = (0);
        game.picked_filter = (0);
    } else if (!menu_class_present(c)) {
        game.valid_menu_classes[__add_valid_menu_class_vmc_count++] = c;
        switch (c) {
            /* categorize the new class */
            case 66:
            case 85:
            case 67:
            case 88:
                game.bucx_filter = (1);
                break;
            case 80:
                game.picked_filter = (1);
                break;
            case 117:
                game.shop_filter = (1);
                break;
            default:
                game.class_filter = (1);
                break;
        }
    }
    game.valid_menu_classes[__add_valid_menu_class_vmc_count] = 0;
}
/* query_objlist callback: return TRUE if not uchain */
export function all_but_uchain(obj) {
    return (obj != game.uchain);
}
/* query_objlist callback: return TRUE */
/*ARGUSED*/
export function allow_all(obj) {
    return (1);
}
export function allow_category(obj) {
    /* If no filters are active, nothing will match unless
       paranoid_confirm:A is set. */
    if (!game.class_filter && !game.shop_filter && !game.bucx_filter && !game.picked_filter && !((game.flags.paranoia_bits & 4096) != 0)) {
        return (0);
    }
    /* For coins, if any class filter is specified, accept if coins
     * are included regardless of whether either unpaid or BUC-status
     * is also specified since player has explicitly requested coins.
     */
    if (obj.oclass == COIN_CLASS && game.class_filter) {
        return strchr(game.valid_menu_classes, COIN_CLASS) ? (1) : (0);
    }
    if ((game.urole.mnum == (PM_CLERIC)) && !obj.bknown) {
        set_bknown(obj, 1);
    }
    /*
     * Version 3.6 had three types of filters possible and the first
     * and third can have more than one entry:
     *  1) object class (armor, potion, &c);
     *  2) unpaid shop item;
     *  3) bless/curse state (blessed, uncursed, cursed, BUC-unknown).
     * Version 5.0 added a fourth:
     *  4) 'novelty' ('P' for just picked up items).
     * When only one type is present, the situation is simple:
     * to be accepted, obj's status must match one of the entries.
     * When more than one type is present, the obj will now only
     * be accepted when it matches one entry of each type.
     * So ?!B will accept blessed scrolls or potions, and [u will
     * accept unpaid armor.  (In 3.4.3, an object was accepted by
     * this filter if it met any entry of any type, so ?!B resulted
     * in accepting all scrolls and potions regardless of bless/curse
     * state plus all blessed non-scroll, non-potion objects.)
     */
    /* if class is expected but obj's class is not in the list, reject */
    if (game.class_filter && !strchr(game.valid_menu_classes, obj.oclass)) {
        return (0);
    }
    /* if unpaid is expected and obj isn't unpaid, reject (treat a container
       holding any unpaid object as unpaid even if isn't unpaid itself) */
    if (game.shop_filter && !obj.unpaid && !(((obj).cobj != null) && count_unpaid(obj.cobj) > 0)) {
        return (0);
    }
    if (game.bucx_filter) {
        /* check for particular bless/curse state */
        /* first categorize this object's bless/curse state */
        let bucx = 0;
        if (obj.oclass == COIN_CLASS) {
            /* If no class filtering is specified but bless/curse state is,
               coins are treated as either unknown or uncursed based on an
               option setting. */
            bucx = game.flags.goldX ? 88 : 85;
        } else {
            bucx = !obj.bknown ? 88 : obj.blessed ? 66 : obj.cursed ? 67 : 85;
        }
        /* if its category is not in the list, reject */
        if (!strchr(game.valid_menu_classes, bucx)) {
            return (0);
        }
    }
    if (game.picked_filter && !obj.pickup_prev) {
        return (0);
    }
    return (1);
}
/* not used */
/* query_objlist callback: return TRUE if valid category (class), no uchain */
/* query_objlist callback: return TRUE if valid class and worn */
export function is_worn_by_type(otmp) {
    return (is_worn(otmp) && allow_category(otmp)) ? (1) : (0);
}
/* reset last-picked-up flags */
export function reset_justpicked(olist) {
    let otmp = null;
    /*
     * TODO?  Possible enhancement: don't reset if hero is still at same
     *  spot where most recent pickup took place.  Not resetting will be
     *  the correct behavior for autopickup immediately followed by manual
     *  pickup.  It would probably be correct for either or both pickups
     *  followed by manual pickup of a newly arrived missile after some
     *  time has elapsed.  Things becomes murkier for other activity.
     *  Taking anything out of a container ought to be treated as if
     *  having moved to another spot.
     */
    for (otmp = olist; otmp; otmp = otmp.nobj) {
        otmp.pickup_prev = 0;
    }
}
export function count_justpicked(olist) {
    let otmp = null;
    let cnt = 0;
    for (otmp = olist; otmp; otmp = otmp.nobj) {
        if (otmp.pickup_prev) {
            cnt++;
        }
    }
    return cnt;
}
export function find_justpicked(olist) {
    let otmp = null;
    for (otmp = olist; otmp; otmp = otmp.nobj) {
        if (otmp.pickup_prev) {
            return otmp;
        }
    }
    return null;
}
/*
 * Have the hero pick things from the ground
 * or a monster's inventory if swallowed.
 *
 * Arg what:
 *      >0  autopickup
 *      =0  interactive
 *      <0  pickup count of something
 *
 * Returns 1 if tried to pick something up, whether
 * or not it succeeded.
 */
/* should be a long */
export async function pickup(what) {
    let i = 0;
    let n = 0;
    let res = 0;
    let count = 0;
    let n_tried = 0;
    let n_picked = 0;
    let pick_list = null;
    let autopickup = 0;
    let objchain_p = null;
    let traverse_how = 0;
    pickupdone: {
        n_tried = 0;
        n_picked = 0;
        pick_list = null;
        autopickup = what > 0;
        if (autopickup && game.multi < 0 && unconscious()) {
            /* we might have arrived here while fainted or sleeping, via
       random teleport or levitation timeout; if so, skip check_here
       and read_engr_at in addition to bypassing autopickup itself
       [probably ought to check whether hero is using a cockatrice
       corpse for a pillow here... (also at initial faint/sleep)] */
            game.iflags.prev_decor = STONE;
            /* do not pick up attached chain */
            /* "Can't do that while carrying so much stuff." */
            return 0;
        }
        /* used by pickup_object() for encumbrance feedback */
        /* used by out_container(); no harm in
                                * zeroing it if about to use in_container() */
        game.pickup_encumbrance = 0;
        if (what < 0) {
            count = -what;
        } else {
            count = 0;
        }
        if (!game.u.uswallow) {
            let t = null;
            if (autopickup && (game.context.nopick || !(game.level.objects[game.u.ux][game.u.uy] != null) || (is_pool(game.u.ux, game.u.uy) && !(game.u.uinwater)) || is_lava(game.u.ux, game.u.uy))) {
                if (game.flags.mention_decor) {
                    await describe_decor();
                }
                await read_engr_at(game.u.ux, game.u.uy);
                return 0;
            }
            /* no pickup if levitating & not on air or water level */
            t = t_at(game.u.ux, game.u.uy);
            if (!can_reach_floor(t && ((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT))) {
                await describe_decor();
                if ((game.multi && !game.context.run) || (autopickup && !game.flags.pickup) || (t && (uteetering_at_seen_pit(t) || uescaped_shaft(t)))) {
                    await read_engr_at(game.u.ux, game.u.uy);
                }
                return 0;
            }
            if ((game.multi && !game.context.run) || (autopickup && !game.flags.pickup) || (((game.youmonst.data).mflags1 & 2048) != 0)) {
                await check_here((0));
                if ((((game.youmonst.data).mflags1 & 2048) != 0) && (game.level.objects[game.u.ux][game.u.uy] != null) && (autopickup || game.flags.pickup)) {
                    await You("are physically incapable of picking anything up.");
                }
                return 0;
            }
            /* if there's anything here, stop running */
            if ((game.level.objects[game.u.ux][game.u.uy] != null) && game.context.run && game.context.run != 8 && !game.context.nopick) {
                nomul(0);
            }
        }
        add_valid_menu_class(0);
        if (!game.u.uswallow) {
            objchain_p = game.level.objects[game.u.ux][game.u.uy];
            traverse_how = 1;
        } else {
            objchain_p = game.u.ustuck.minvent;
            traverse_how = 0;
        }
        let __do_pickup_processing = false;
        if (autopickup) {
            n = await autopick(objchain_p, traverse_how, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } });
            __do_pickup_processing = true;
        }
        if (!__do_pickup_processing && (game.flags.menu_style != 0 || game.iflags.menu_requested)) {
            traverse_how |= 4 | (game.flags.sortpack ? 16 : 0);
            if (count) {
                let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                qbuf = sprintf(qbuf, "Pick %d of what?", count);
                game.val_for_n_or_more = count;
                n = await query_objlist(qbuf, objchain_p, traverse_how, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 1, n_or_more);
                for (i = 0; i < n; i++) {
                    pick_list[i].count = count;
                }
            } else {
                n = await query_objlist("Pick up what?", objchain_p, (traverse_how | 128), { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2, all_but_uchain);
            }
            __do_pickup_processing = true;
        } else if (!__do_pickup_processing) {
            let ct = 0;
            let lcount = 0;
            let all_of_a_type = 0;
            let selective = 0;
            let bycat = 0;
            let oclasses = '';
            let obj = null;
            let obj2 = null;
            end_query: {
                ct = 0;
                /* +10: room for B,U,C,X plus slop */
                /* types to consider (empty for all) */
                oclasses = '';
                /* take all of considered types */
                all_of_a_type = (1);
                selective = (0);
                /* check for more than one object */
                for (obj = objchain_p; obj; obj = (((traverse_how) & 1) ? (obj).v.v_nexthere : (obj).nobj)) {
                    ct++;
                }
                if (ct == 1 && count) {
                    /* if only one thing, then pick it */
                    obj = objchain_p;
                    lcount = ((obj.quan) < (count) ? (obj.quan) : (count));
                    n_tried++;
                    reset_justpicked(game.invent);
                    if (await pickup_object(obj, lcount, (0)) > 0) {
                        n_picked++;
                    }
                    break end_query;
                } else if (ct >= 2) {
                    let via_menu = 0;
                    await There("are %s objects here.", (ct <= 10) ? "several" : "many");
                    if (!await query_classes(oclasses, { get value() { return selective; }, set value(_v) { selective = _v; } }, { get value() { return all_of_a_type; }, set value(_v) { all_of_a_type = _v; } }, "pick up", objchain_p, (traverse_how & 1) ? (1) : (0), { get value() { return via_menu; }, set value(_v) { via_menu = _v; } })) {
                        if (!via_menu) {
                            break pickupdone;
                        }
                        if (selective) {
                            traverse_how |= 16;
                        }
                        n = await query_objlist("Pick up what?", objchain_p, traverse_how, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2, (via_menu == -2) ? allow_all : allow_category);
                        __do_pickup_processing = true;
                        break end_query;
                    }
                }
                bycat = (menu_class_present(66) || menu_class_present(85) || menu_class_present(67) || menu_class_present(88));
                for (obj = objchain_p; obj; obj = obj2) {
                    obj2 = (((traverse_how) & 1) ? (obj).v.v_nexthere : (obj).nobj);
                    if (bycat ? !allow_category(obj) : (!selective && __nh_char_at0(oclasses) && !strchr(oclasses, obj.oclass))) {
                        continue;
                    }
                    lcount = -1;
                    if (!all_of_a_type) {
                        /* looking for N of something */
                        let qbuf = '';
                        await safe_qbuf(qbuf, "Pick up ", "?", obj, doname, ansimpleoname, c_common_strings.c_something);
                        switch ((obj.quan < 2) ? await yn_function(qbuf, ynaqchars, 121, (1)) : await yn_function(qbuf, ynNaqchars, 121, (1))) {
                            case 113:
                                break end_query;
                            case 110:
                                continue;
                            case 97:
                                all_of_a_type = (1);
                                if (selective) {
                                    selective = (0);
                                    oclasses = __nh_char_write(oclasses, 0, obj.oclass);
                                    oclasses = __nh_char_write(oclasses, 1, 0);
                                }
                                /* from for => goto query_done; */
                                break;
                            case 35:
                                if (!game.yn_number) {
                                    continue;
                                }
                                lcount = game.yn_number;
                                if (lcount > obj.quan) {
                                    lcount = obj.quan;
                                }
                                ;
                            default:
                                break;
                        }
                    }
                    if (lcount == -1) {
                        lcount = obj.quan;
                    }
                    /* reset just before the first item picked */
                    if (!n_tried) {
                        reset_justpicked(game.invent);
                    }
                    n_tried++;
                    if ((res = await pickup_object(obj, lcount, (0))) < 0) {
                        break;
                    }
                    n_picked += res;
                }
            }
        }
        if (__do_pickup_processing) {
            if (n > 0) {
                reset_justpicked(game.invent);
            }
            n_tried = n;
            for (n_picked = i = 0; i < n; i++) {
                res = await pickup_object(pick_list[i].item.a_obj, pick_list[i].count, (0));
                if (res < 0) {
                    break;
                }
                n_picked += res;
            }
            if (pick_list) {
                free(pick_list);
            }
        }
        if (!game.u.uswallow) {
            /* statement required after label */
            if ((((game.youmonst.data).mflags1 & 128) != 0)) {
                await hideunder(game.youmonst);
            }
            if (n_picked) {
                await newsym_force(game.u.ux, game.u.uy);
            }
            if (autopickup) {
                await check_here(n_picked > 0);
            }
        }
    }
    game.pickup_encumbrance = 0;
    add_valid_menu_class(0);
    return (n_tried > 0);
}
export async function check_autopickup_exceptions(obj) {
    /*
     *  Does the text description of this match an exception?
     */
    let ape = game.apelist;
    if (ape) {
        let objdesc = await makesingular(await doname(obj));
        while (ape && !regex_match(objdesc, ape.regex)) {
            ape = ape.next;
        }
    }
    return ape;
}
let __autopick_testobj_costly = (0);
__nh_register_static(() => { __autopick_testobj_costly = (0); });
export async function autopick_testobj(otmp, calc_costly) {
    let ape = null;
    let otypes = game.flags.pickup_types;
    let pickit = 0;
    if (calc_costly) {
        __autopick_testobj_costly = (otmp.where == 1 && await costly_spot(otmp.ox, otmp.oy));
    }
    /* first check: reject if an unpaid item in a shop */
    if (__autopick_testobj_costly && !otmp.no_charge) {
        return (0);
    }
    /* pickup_thrown/pickup_stolen/nopick_dropped override pickup_types and
       exceptions */
    if ((game.flags.pickup_thrown && otmp.how_lost == 1) || (game.flags.pickup_stolen && otmp.how_lost == 3)) {
        return (1);
    }
    if (game.flags.nopick_dropped && otmp.how_lost == 2) {
        return (0);
    }
    if (otmp.how_lost == 4) {
        return (0);
    }
    pickit = (!__nh_char_at0(otypes) || strchr(otypes, otmp.oclass));
    ape = await check_autopickup_exceptions(otmp);
    if (ape) {
        pickit = ape.grab;
    }
    return pickit;
}
/*
 * Pick from the given list using flags.pickup_types.  Return the number
 * of items picked (not counts).  Create an array that returns pointers
 * and counts of the items to be picked up.  If the number of items
 * picked is zero, the pickup list is left alone.  The caller of this
 * function must free the pickup list.
 */
/* the object list */
/* how to follow the object list */
/* list of objects and counts to pick up */
export async function autopick(olist, follow, pick_list) {
    let pi = null;
    let curr = null;
    let n = 0;
    let check_costly = (1);
    for (n = 0 , curr = olist; curr; curr = (((follow) & 1) ? (curr).v.v_nexthere : (curr).nobj)) {
        if (await autopick_testobj(curr, check_costly)) {
            ++n;
        }
        /* only need to check once per autopickup */
        check_costly = (0);
    }
    if (n) {
        pick_list.value = pi = alloc(1 /* sizeof(menu_item) */ * n);
        for (n = 0 , curr = olist; curr; curr = (((follow) & 1) ? (curr).v.v_nexthere : (curr).nobj)) {
            if (await autopick_testobj(curr, (0))) {
                pi[n].item.a_obj = curr;
                pi[n].count = curr.quan;
                n++;
            }
        }
    }
    return n;
}
/*
 * Put up a menu using the given object list.  Only those objects on the
 * list that meet the approval of the allow function are displayed.  Return
 * a count of the number of items selected, as well as an allocated array of
 * menu_items, containing pointers to the objects selected and counts.  The
 * returned counts are guaranteed to be in bounds and non-zero.
 *
 * Query flags:
 *      BY_NEXTHERE       - Follow object list via nexthere instead of nobj.
 *      AUTOSELECT_SINGLE - Don't ask if only 1 object qualifies - just
 *                          use it.
 *      USE_INVLET        - Use object's invlet.
 *      INVORDER_SORT     - Use hero's pack order.
 *      INCLUDE_HERO      - Showing engulfer's invent; show hero too.
 *      SIGNAL_NOMENU     - Return -1 rather than 0 if nothing passes "allow".
 *      SIGNAL_ESCAPE     - Return -1 rather than 0 if player uses ESC to
 *                          pick nothing.
 *      FEEL_COCKATRICE   - touch corpse.
 */
/* query string */
/* the list to pick from */
/* options to control the query */
/* return list of items picked */
/* type of query */
/* allow function */
export async function query_objlist(qstr, olist_p, qflags, pick_list, how, allow) {
    let i = 0;
    let n = 0;
    let tmpglyph = 0;
    /* underscore is not a choice; it's used to skip element [0] */
    let win = 0;
    let curr = null;
    let last = null;
    let fake_hero_object = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let olist = olist_p;
    let pack = null;
    let packbuf = '';
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let printed_type_name = 0;
    let first = 0;
    let sorted = (qflags & 16) != 0;
    let engulfer = (qflags & 256) != 0;
    let engulfer_minvent = 0;
    let sortflags = 0;
    let tmpglyphinfo = nul_glyphinfo;
    let sortedolist = null;
    let srtoli = null;
    let clr = 8;
    pick_list.value = null;
    if (!olist && !engulfer) {
        return 0;
    }
    for (n = 0 , last = null , curr = olist; curr; curr = (((qflags) & 1) ? (curr).v.v_nexthere : (curr).nobj)) {
        if ((allow)(curr)) {
            /* count the number of items allowed */
            last = curr;
            n++;
        }
    }
    /* can't depend upon 'engulfer' because that's used to indicate whether
       hero should be shown as an extra, fake item */
    engulfer_minvent = (olist && olist.where == 4 && (game.u.uswallow && (game.u.ustuck == (olist.v.v_ocarry))));
    if (engulfer_minvent && n == 1 && olist.owornmask != 0) {
        /* don't autoselect swallowed hero if it's the only choice */
        qflags &= ~4;
    }
    if (engulfer) {
        ++n;
        qflags &= ~4;
    }
    if (n == 0) {
        return (qflags & 32) ? -1 : 0;
    }
    if (n == 1 && (qflags & 4)) {
        pick_list.value = alloc(1 /* sizeof(menu_item) */);
        (pick_list.value)[0].item.a_obj = last;
        (pick_list.value)[0].count = last.quan;
        /* something [useless] happened */
        return 1;
    }
    sortflags = (((game.flags.sortloot == 102 || (game.flags.sortloot == 108 && !(qflags & 8))) ? 4 : ((qflags & 8) ? 2 : 0)) | (game.flags.sortpack ? 1 : 0) | ((qflags & 128) ? 32 : 0));
    sortedolist = await sortloot(olist, sortflags, (qflags & 1) ? (1) : (0), allow);
    /* [skip potential early return so that menu response is needed
         *  regardless of whether other containers are being carried] */
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    Object.assign(any, cg.zeroany);
    if (game.this_title) {
        await add_menu_str(win, game.this_title);
    }
    /*
     * Run through the list and add the objects to the menu.  If
     * INVORDER_SORT is set, we'll run through the list once for
     * each type so we can group them.  The allow function was
     * called by sortloot() and will be called once per item here.
     */
    pack = strcpy(packbuf, game.flags.inv_order);
    if (qflags & 2) {
        pack = strkitten(pack, VENOM_CLASS);
    }
    /* venom is not in inv_order */
    first = (1);
    do {
        printed_type_name = (0);
        for (let __nhi_srtoli = 0; (srtoli = sortedolist[__nhi_srtoli]) && (((curr = srtoli.obj) != null)); __nhi_srtoli++) {
            if (sorted && curr.oclass != __nh_char_at0(pack)) {
                continue;
            }
            if ((qflags & 128) && curr.otyp == CORPSE && will_feel_cockatrice(curr, (0))) {
                (game.windowprocs.win_destroy_nhwindow)(win);
                await look_here(0, 0);
                unsortloot({ get value() { return sortedolist; }, set value(_v) { sortedolist = _v; } });
                return 0;
            }
            if ((allow)(curr)) {
                if (sorted && !printed_type_name) {
                    /* if sorting, print type name (once only) */
                    let with_oc_sym = (how != 0 && game.iflags.menu_head_objsym);
                    Object.assign(any, cg.zeroany);
                    await add_menu_heading(win, await let_to_name(__nh_char_at0(pack), (0), with_oc_sym));
                    printed_type_name = (1);
                }
                any.a_obj = curr;
                tmpglyph = (((curr).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((curr).corpsenm + ((((curr).spe & 3) == 1) ? (((curr).where == 1 && ((game.otg_otmp = game.level.objects[(curr).ox][(curr).oy].v.v_nexthere) != null) && ((curr).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((curr).where == 1 && ((game.otg_otmp = game.level.objects[(curr).ox][(curr).oy].v.v_nexthere) != null) && ((curr).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((curr).otyp == CORPSE) ? (((curr).corpsenm + (((curr).where == 1 && ((game.otg_otmp = game.level.objects[(curr).ox][(curr).oy].v.v_nexthere) != null) && ((curr).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(curr).dknown && ((curr).oclass == POTION_CLASS || ((curr).otyp >= FIRST_REAL_GEM && ((curr).otyp <= LAST_GLASS_GEM)) || ((curr).otyp >= FIRST_SPELL && ((curr).otyp <= LAST_SPELL)))) ? (((curr).oclass + (((curr).where == 1 && ((game.otg_otmp = game.level.objects[(curr).ox][(curr).oy].v.v_nexthere) != null) && ((curr).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((curr).otyp + (((curr).where == 1 && ((game.otg_otmp = game.level.objects[(curr).ox][(curr).oy].v.v_nexthere) != null) && ((curr).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))));
                map_glyphinfo(0, 0, tmpglyph, 0, tmpglyphinfo);
                await add_menu(win, tmpglyphinfo, any, (qflags & 8) ? curr.invlet : (first && curr.oclass == COIN_CLASS) ? 36 : 0, def_oc_syms[game.objects[curr.otyp].oc_class].sym, 0, clr, await doname_with_price(curr), 0);
                first = (0);
            }
        }
        (pack = __nh_advance_str(pack, 1));
    } while (sorted && __nh_char_at0(pack));
    unsortloot({ get value() { return sortedolist; }, set value(_v) { sortedolist = _v; } });
    if (engulfer) {
        let buf = '';
        Object.assign(any, cg.zeroany);
        if (sorted && n > 1) {
            buf = sprintf(buf, "%s Creatures", (dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null) ? "Swallowed" : "Engulfed");
            await add_menu_heading(win, buf);
        }
        Object.assign(fake_hero_object, cg.zeroobj);
        /* not strictly necessary... */
        fake_hero_object.quan = 1;
        any.a_obj = fake_hero_object;
        tmpglyph = (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((game.youmonst).data).pmidx)) + (((game.youmonst).female == 0) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF));
        map_glyphinfo(0, 0, tmpglyph, 0, tmpglyphinfo);
        await add_menu(win, tmpglyphinfo, any, 62, 0, 0, clr, await an(await self_lookat(buf)), 0);
    }
    (game.windowprocs.win_end_menu)(win, qstr);
    n = await select_menu(win, how, pick_list);
    (game.windowprocs.win_destroy_nhwindow)(win);
    if (n > 0) {
        /* fake inventory letter, no group accelerator */
        let mi = null;
        let k = 0;
        for (i = k = 0; i < n; i++) {
            mi = pick_list.value[i];
            /* fix up counts:  -1 means no count used => pick all;
           if fake_hero_object was picked, discard that choice */
            curr = mi.item.a_obj;
            if (curr == fake_hero_object) {
                await You_cant("pick yourself up!");
                continue;
            }
            if (engulfer_minvent && curr.owornmask != 0) {
                await You_cant("pick %s up.", await ysimple_name(curr));
                continue;
            }
            if (mi.count == -1 || mi.count > curr.quan) {
                mi.count = curr.quan;
            }
            if (k < i) {
                Object.assign((pick_list.value)[k], mi);
            }
            ++k;
        }
        if (!k) {
            /* fake_hero was only choice so discard whole list */
            free(pick_list.value);
            pick_list.value = null;
            /* without paranoid_confirm:A, choosing 'A' by itself is rejected */
            n = 0;
        } else if (k < n) {
            while (n > k) {
                --n;
                /* other stuff plus fake_hero; last slot is now unused
               (could be more than one if player tried to pick items
               worn by engulfer) */
                Object.assign((pick_list.value)[n].item, cg.zeroany);
                (pick_list.value)[n].count = 0;
            }
        }
    } else if (n < 0) {
        /* -1 is used for SIGNAL_NOMENU, so callers don't expect it
           to indicate that the player declined to make a choice */
        n = (qflags & 64) ? -2 : 0;
    }
    return n;
}
/*
 * For menustyle:Full.
 *
 * allow menu-based category (class) selection (for Drop,take off etc.)
 *
 * If ParanoidAutoAll, requires confirmation when 'A' has been picked.
 */
/* query string */
/* the list to pick from */
/* behavior modification flags */
/* return list of items picked */
/* type of query */
export async function query_category(qstr, olist, qflags, pick_list, how) {
    let n = 0;
    let win = 0;
    let curr = null;
    let pack = null;
    let packbuf = '';
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let collected_type_name = 0;
    let invlet = 0;
    let ccount = 0;
    let ofilter = null;
    let show_a = 0;
    let do_unpaid = 0;
    let do_usedup = 0;
    let do_blessed = 0;
    let do_cursed = 0;
    let do_uncursed = 0;
    let do_buc_unknown = 0;
    let do_worn = 0;
    let verify_All = 0;
    let num_buc_types = 0;
    let num_justpicked = 0;
    let clr = 0;
    query_done: {
        ofilter = null;
        do_unpaid = (0);
        do_usedup = (0);
        do_blessed = (0);
        do_cursed = (0);
        do_uncursed = (0);
        do_buc_unknown = (0);
        do_worn = (0);
        verify_All = (0);
        num_buc_types = 0;
        num_justpicked = 0;
        clr = 8;
        pick_list.value = null;
        if (!olist) {
            return 0;
        }
        if ((qflags & 4) != 0 && count_unpaid(olist)) {
            do_unpaid = (1);
        }
        /* caller only passes BILLED_TYPES when there are some used up items
       on shop's bill */
        if ((qflags & 64) != 0) {
            do_usedup = (1);
        }
        if ((qflags & 16) != 0) {
            /* for the 'A' command to remove worn/wielded */
            do_worn = (1);
            ofilter = is_worn;
        }
        if ((qflags & 256) != 0 && count_buc(olist, 256, ofilter)) {
            do_blessed = (1);
            num_buc_types++;
        }
        if ((qflags & 512) != 0 && count_buc(olist, 512, ofilter)) {
            do_cursed = (1);
            num_buc_types++;
        }
        if ((qflags & 1024) != 0 && count_buc(olist, 1024, ofilter)) {
            do_uncursed = (1);
            num_buc_types++;
        }
        if ((qflags & 2048) != 0 && count_buc(olist, 2048, ofilter)) {
            do_buc_unknown = (1);
            num_buc_types++;
        }
        if ((qflags & 4096) != 0) {
            num_justpicked = count_justpicked(olist);
        }
        ccount = count_categories(olist, qflags);
        if (ccount == 1 && !do_unpaid && !do_usedup && num_buc_types <= 1) {
            for (curr = olist; curr; curr = (((qflags) & 1) ? (curr).v.v_nexthere : (curr).nobj)) {
                /* no point in actually showing a menu for a single category */
                if (ofilter && !(ofilter)(curr)) {
                    continue;
                }
                break;
            }
            if (curr) {
                pick_list.value = alloc(1 /* sizeof(menu_item) */);
                (pick_list.value)[0].item.a_int = curr.oclass;
                n = 1;
            } else {
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/pickup.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        await pline("query_category: no single object match");
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                n = 0;
            }
            /* early return is ok; there's no temp window yet */
            return n;
        }
        win = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(win, 0);
        pack = strcpy(packbuf, game.flags.inv_order);
        if ((qflags & 2) != 0) {
            pack = strkitten(pack, VENOM_CLASS);
        }
        show_a = ((qflags & 32) != 0 && ccount > 1);
        if ((qflags & 128) != 0) {
            invlet = 65;
            Object.assign(any, cg.zeroany);
            any.a_int = 65;
            await add_menu(win, nul_glyphinfo, any, invlet, 0, 0, clr, do_worn ? "Auto-select every item being worn or wielded" : "Auto-select every relevant item", 2);
            verify_All = (how == 2) && ((game.flags.paranoia_bits & 4096) != 0);
            if (!verify_All) {
                /* note: menu_remarm() doesn't pass the CHOOSE_ALL flag,
                    so do_worn handling here is moot */
                if (!game.A_first_hint++ || game.iflags.cmdassist) {
                    await add_menu_str(win, "    (ignored unless some other choices are also picked)");
                }
            } else if (show_a) {
                if (!game.A_second_hint++ || game.iflags.cmdassist) {
                    await add_menu_str(win, "    (if no other choices are picked, 'a' is implied)");
                }
            }
            await add_menu_str(win, "");
        }
        invlet = 97;
        if (show_a) {
            Object.assign(any, cg.zeroany);
            any.a_int = -2;
            await add_menu(win, nul_glyphinfo, any, invlet, 0, 0, clr, do_worn ? "All worn and wielded types" : "All types", 2);
            ++invlet;
        }
        do {
            collected_type_name = (0);
            for (curr = olist; curr; curr = (((qflags) & 1) ? (curr).v.v_nexthere : (curr).nobj)) {
                if (curr.oclass == __nh_char_at0(pack)) {
                    if (ofilter && !(ofilter)(curr)) {
                        continue;
                    }
                    if (!collected_type_name) {
                        let oclass = curr.oclass;
                        Object.assign(any, cg.zeroany);
                        any.a_int = oclass;
                        await add_menu(win, nul_glyphinfo, any, invlet++, def_oc_syms[oclass].sym, 0, clr, await let_to_name(__nh_char_at0(pack), (0), (how != 0 && game.iflags.menu_head_objsym)), 0);
                        collected_type_name = (1);
                    }
                }
            }
            (pack = __nh_advance_str(pack, 1));
            if (invlet >= 117) {
                await impossible("query_category: too many categories");
                n = 0;
                break query_done;
            }
        } while (__nh_char_at0(pack));
        if (do_unpaid || do_usedup || do_blessed || do_cursed || do_uncursed || do_buc_unknown || num_justpicked) {
            await add_menu_str(win, "");
        }
        if (do_unpaid) {
            /* unpaid items if there are any */
            invlet = 117;
            Object.assign(any, cg.zeroany);
            any.a_int = 117;
            await add_menu(win, nul_glyphinfo, any, invlet, 0, 0, clr, "Unpaid items", 2);
        }
        if (do_usedup) {
            /* billed items: checked by caller, so always include if BILLED_TYPES */
            invlet = 120;
            Object.assign(any, cg.zeroany);
            any.a_int = 120;
            await add_menu(win, nul_glyphinfo, any, invlet, 0, 0, clr, "Unpaid items already used up", 2);
        }
        if (do_blessed) {
            /* items with b/u/c/unknown if there are any;
       this cluster of menu entries is in alphabetical order,
       reversing the usual sequence of 'U' and 'C' in BUCX */
            invlet = 66;
            Object.assign(any, cg.zeroany);
            any.a_int = 66;
            await add_menu(win, nul_glyphinfo, any, invlet, 0, 0, clr, "Items known to be Blessed", 2);
        }
        if (do_cursed) {
            invlet = 67;
            Object.assign(any, cg.zeroany);
            any.a_int = 67;
            await add_menu(win, nul_glyphinfo, any, invlet, 0, 0, clr, "Items known to be Cursed", 2);
        }
        if (do_uncursed) {
            invlet = 85;
            Object.assign(any, cg.zeroany);
            any.a_int = 85;
            await add_menu(win, nul_glyphinfo, any, invlet, 0, 0, clr, "Items known to be Uncursed", 2);
        }
        if (do_buc_unknown) {
            invlet = 88;
            Object.assign(any, cg.zeroany);
            any.a_int = 88;
            await add_menu(win, nul_glyphinfo, any, invlet, 0, 0, clr, "Items of unknown Bless/Curse status", 2);
        }
        if (num_justpicked) {
            let tmpbuf = '';
            if (num_justpicked == 1) {
                tmpbuf = sprintf(tmpbuf, "Just picked up: %s", await doname(find_justpicked(olist)));
            } else {
                tmpbuf = strcpy(tmpbuf, "Items you just picked up");
            }
            invlet = 80;
            Object.assign(any, cg.zeroany);
            any.a_int = 80;
            await add_menu(win, nul_glyphinfo, any, invlet, 0, 0, clr, tmpbuf, 2);
        }
        (game.windowprocs.win_end_menu)(win, qstr);
        n = await select_menu(win, how, pick_list);
        if (n > 0) {
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        }
        if (n > 0 && verify_All) {
            /* handle ParanoidAutoAll by confirming 'A' choice if present */
            let i = 0;
            let j = 0;
            for (i = 0; i < n; ++i) {
                if ((pick_list.value)[i].item.a_int == 65) {
                    switch (await paranoid_ynq(((game.flags.paranoia_bits & 1) != 0), "Really autoselect All?", (1))) {
                        /* ParanoidAutoAll is set (otherwise verify_All is false);
                   if ParanoidConfirm is also set, require "yes" rather than
                   just "y" to accept (and "no" rather than "n" to decline;
                   accepts "quit" and ESC without converting them to 'n') */
                        case 121:
                            break;
                        case 110:
                            if (n > 1) {
                                /* yes => honor Auto-select All */
                                /* no => remove 'A' from the list; if that would make
                       it empty then replace with 'a' */
                                for (j = i + 1; j < n; ++j) {
                                    Object.assign((pick_list.value)[j - 1], (pick_list.value)[j]);
                                }
                                --n;
                                break;
                            } else if ((qflags & 32) != 0) {
                                /* 'A' was the only choice; convert it to 'a' and
                           then let the next menu offer a choice of all */
                                (pick_list.value)[0].item.a_int = -2;
                                break;
                            }
                            ;
                        case 113:
                        default:
                            n = 0;
                            free(pick_list.value) , pick_list.value = null;
                            break;
                    }
                    break;
                }
            }
        } else if (n == 1 && !verify_All && (pick_list.value)[0].item.a_int == 65) {
            n = 0;
            free(pick_list.value) , pick_list.value = null;
            await pline("No relevant items selected.");
        }
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
    if (n < 0) {
        n = 0;
    }
    return n;
}
export function count_categories(olist, qflags) {
    let pack = null;
    let counted_category = 0;
    let ccount = 0;
    let curr = null;
    let do_worn = (qflags & 16) != 0;
    pack = game.flags.inv_order;
    do {
        counted_category = (0);
        for (curr = olist; curr; curr = (((qflags) & 1) ? (curr).v.v_nexthere : (curr).nobj)) {
            if (curr.oclass == __nh_char_at0(pack)) {
                if (do_worn && !(curr.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288) | (256 | 1024 | 512)))) {
                    continue;
                }
                if (!counted_category) {
                    ccount++;
                    counted_category = (1);
                }
            }
        }
        (pack = __nh_advance_str(pack, 1));
    } while (__nh_char_at0(pack));
    return ccount;
}
/*
 *  How much the weight of the given container will change when the given
 *  object is removed from it.  Use before and after weight amounts rather
 *  than trying to match the calculation used by weight() in mkobj.c.
 */
export async function delta_cwt(container, obj) {
    let prev__parent = null;
    let prev__field = null;
    let owt = 0;
    let nwt = 0;
    if (container.otyp != BAG_OF_HOLDING) {
        return obj.owt;
    }
    owt = nwt = container.owt;
    /* find the object so that we can remove it */
    for ((prev__parent = container, prev__field = "cobj"); prev__parent[prev__field]; (prev__parent = (prev__parent[prev__field]), prev__field = "nobj")) {
        if (prev__parent[prev__field] == obj) {
            break;
        }
    }
    if (!prev__parent[prev__field]) {
        await panic("delta_cwt: obj not inside container?");
    } else {
        /* temporarily remove the object and calculate resulting weight */
        prev__parent[prev__field] = obj.nobj;
        nwt = await weight(container);
        /* put the object back; obj->nobj is still valid */
        prev__parent[prev__field] = obj;
    }
    return owt - nwt;
}
/* could we carry `obj'? if not, could we carry some of it/them? */
/* object to pick up... */
/* ...bag it is coming out of */
export async function carry_count(obj, container, count, telekinesis, wt_before, wt_after) {
    let adjust_wt = container && ((container).where == 3);
    let is_gold = obj.oclass == COIN_CLASS;
    let wt = 0;
    let iw = 0;
    let ow = 0;
    let oow = 0;
    let qq = 0;
    let savequan = 0;
    let umoney = 0;
    let saveowt = 0;
    let verb = null;
    let prefx1 = null;
    let prefx2 = null;
    let suffx = null;
    let obj_nambuf = '';
    let where = '';
    savequan = obj.quan;
    saveowt = obj.owt;
    umoney = money_cnt(game.invent);
    iw = max_capacity();
    if (count != savequan) {
        obj.quan = count;
        obj.owt = await weight(obj);
    }
    wt = iw + obj.owt;
    if (adjust_wt) {
        wt -= await delta_cwt(container, obj);
    }
    /* This will go with silver+copper & new gold weight */
    /* merged gold might affect cumulative weight */
    if (is_gold) {
        wt -= ((Math.trunc(((umoney) + 50) / 100)) + (Math.trunc(((count) + 50) / 100)) - (Math.trunc(((umoney + count) + 50) / 100)));
    }
    if (count != savequan) {
        obj.quan = savequan;
        obj.owt = saveowt;
    }
    wt_before.value = iw;
    wt_after.value = wt;
    if (wt < 0) {
        return count;
    }
    if (is_gold) {
        /* see how many we can lift */
        iw -= (Math.trunc(((umoney) + 50) / 100));
        if (!adjust_wt) {
            qq = (((iw) * -100) - ((umoney) + 50) - 1);
        } else {
            oow = 0;
            qq = 50 - (umoney % 100) - 1;
            if (qq < 0) {
                qq += 100;
            }
            for (; qq <= count; qq += 100) {
                /*
         * Ugh. Calc num to lift by changing the quan of the
         * object and calling weight.
         *
         * This works for containers only because containers
         * don't merge.  -dean
         */
                obj.quan = qq;
                obj.owt = (Math.trunc(((qq) + 50) / 100));
                ow = (Math.trunc(((umoney + qq) + 50) / 100));
                ow -= await delta_cwt(container, obj);
                if (iw + ow >= 0) {
                    break;
                }
                oow = ow;
            }
            iw -= oow;
            qq -= 100;
        }
        if (qq < 0) {
            /* there's only one, and we can't lift it */
            qq = 0;
        } else if (qq > count) {
            qq = count;
        }
        wt = iw + (Math.trunc(((umoney + qq) + 50) / 100));
    } else if (count > 1 || count < obj.quan) {
        for (qq = 1; qq <= count; qq++) {
            obj.quan = qq;
            obj.owt = (ow = await weight(obj));
            if (adjust_wt) {
                ow -= await delta_cwt(container, obj);
            }
            if (iw + ow >= 0) {
                break;
            }
            wt = iw + ow;
        }
        --qq;
    } else {
        qq = 0;
    }
    obj.quan = savequan;
    obj.owt = saveowt;
    if (qq < count) {
        obj_nambuf = strcpy(obj_nambuf, await doname(obj));
        if (container) {
            where = sprintf(where, "in %s", await the(await xname(container)));
            /* some message will be given */
            verb = "carry";
        } else {
            where = strcpy(where, "lying here");
            verb = telekinesis ? "acquire" : "lift";
        }
    } else {
        (where = '', obj_nambuf = '');
        verb = "";
    }
    if (qq > 0) {
        if (qq < count) {
            await You("can only %s %s of the %s %s.", verb, (qq == 1) ? "one" : "some", obj_nambuf, where);
        }
        wt_after.value = wt;
        return qq;
    }
    if (!container) {
        where = strcpy(where, "here");
    }
    if (game.invent || umoney) {
        prefx1 = "you cannot ";
        prefx2 = "";
        suffx = " any more";
    } else {
        prefx1 = (obj.quan == 1) ? "it " : "even one ";
        prefx2 = "is too heavy for you to ";
        suffx = "";
    }
    await There("%s %s %s, but %s%s%s%s.", await otense(obj, "are"), obj_nambuf, where, prefx1, prefx2, verb, suffx);
    return 0;
}
/* determine whether character is able and player is willing to carry `obj' */
/* object to pick up... */
/* ...bag it's coming out of */
export async function lift_object(obj, container, cnt_p, telekinesis) {
    let result = 0;
    let old_wt = 0;
    let new_wt = 0;
    let prev_encumbr = 0;
    let next_encumbr = 0;
    if (obj.otyp == BOULDER && game.level.flags.sokoban_rules) {
        await You("cannot get your %s around this %s.", await body_part(HAND), await xname(obj));
        return -1;
    }
    if (obj.otyp == LOADSTONE || (obj.otyp == BOULDER && (((game.youmonst.data).mflags2 & 134217728) != 0))) {
        if (inv_cnt((0)) < invlet_basic || !carrying(obj.otyp) || await merge_choice(game.invent, obj)) {
            /* tried to pick something up and failed, but
                         don't want to terminate pickup loop yet   */
            return 1;
        }
        await You("are carrying too much stuff to pick up %s %s.", (obj.quan == 1) ? "another" : "more", await xname(obj));
        return -1;
    }
    cnt_p.value = await carry_count(obj, container, cnt_p.value, telekinesis, { get value() { return old_wt; }, set value(_v) { old_wt = _v; } }, { get value() { return new_wt; }, set value(_v) { new_wt = _v; } });
    if (cnt_p.value < 1) {
        result = -1;
    } else if (obj.oclass != COIN_CLASS && inv_cnt((0)) >= invlet_basic && !await merge_choice(game.invent, obj)) {
        await Your("knapsack cannot accommodate any more items%s.", nxtobj(obj, GOLD_PIECE, (obj.where == 1)) ? " (except gold)" : "");
        result = -1;
    } else {
        result = 1;
        prev_encumbr = near_capacity();
        if (prev_encumbr < game.flags.pickup_burden) {
            prev_encumbr = game.flags.pickup_burden;
        }
        next_encumbr = calc_capacity(new_wt - old_wt);
        if (next_encumbr > prev_encumbr) {
            if (telekinesis) {
                /* floor follows by nexthere, otherwise container so by nobj */
                result = 0;
            } else {
                let qbuf = '';
                let savequan = obj.quan;
                obj.quan = cnt_p.value;
                qbuf = sprintf(qbuf, "%s %s ", (next_encumbr >= EXT_ENCUMBER) ? overloadpfx : (next_encumbr >= HVY_ENCUMBER) ? nearloadpfx : (next_encumbr >= MOD_ENCUMBER) ? moderateloadpfx : slightloadpfx, !container ? "lifting" : "removing");
                await safe_qbuf(qbuf, qbuf, ".  Continue?", obj, doname, ansimpleoname, c_common_strings.c_something);
                obj.quan = savequan;
                switch (await yn_function(qbuf, ynqchars, 113, (1))) {
                    case 113:
                        result = -1;
                        break;
                    case 110:
                        result = 0;
                        break;
                    default:
                        break;
                }
                (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
            }
        }
    }
    if (obj.otyp == SCR_SCARE_MONSTER && result <= 0 && !container) {
        obj.spe = 0;
    }
    return result;
}
/*
 * Pick up <count> of obj from the ground and add it to the hero's inventory.
 * Returns -1 if caller should break out of its loop, 0 if nothing picked
 * up, 1 if otherwise.
 */
/* if non-zero, pick up a subset of this amount */
/* not picking it up directly by hand */
export async function pickup_object(obj, count, telekinesis) {
    let res = 0;
    if (obj.quan < count) {
        await impossible("pickup_object: count %ld > quan %ld?", count, obj.quan);
        return 0;
    }
    /* In case of auto-pickup, where we haven't had a chance
       to look at it yet; affects docall(SCR_SCARE_MONSTER). */
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        await observe_object(obj);
    }
    if (obj == game.uchain) {
        return 0;
    } else if (obj.where == 4 && obj.owornmask != 0 && (game.u.uswallow && (game.u.ustuck == (obj.v.v_ocarry)))) {
        await You_cant("pick %s up.", await ysimple_name(obj));
        return 0;
    } else if (obj.oartifact && !await touch_artifact(obj, game.youmonst)) {
        return 0;
    } else if (obj.otyp == CORPSE) {
        if (await fatal_corpse_mistake(obj, telekinesis) || await rider_corpse_revival(obj, telekinesis)) {
            return -1;
        }
    } else if (obj.otyp == SCR_SCARE_MONSTER) {
        let old_wt = 0;
        let new_wt = 0;
        if ((count = await carry_count(obj, null, count ? count : obj.quan, (0), { get value() { return old_wt; }, set value(_v) { old_wt = _v; } }, { get value() { return new_wt; }, set value(_v) { new_wt = _v; } })) < 1) {
            return -1;
        }
        if (count > 0 && count < obj.quan) {
            obj = await splitobj(obj, count);
        }
        if (obj.blessed) {
            await unbless(obj);
        } else if (!obj.spe && !obj.cursed) {
            obj.spe = 1;
        } else {
            await pline_The("scroll%s %s to dust as you %s %s up.", (((obj.quan) == 1) ? "" : "s"), await otense(obj, "turn"), telekinesis ? "raise" : "pick", (obj.quan == 1) ? "it" : "them");
            await trycall(obj);
            await useupf(obj, obj.quan);
            return 1;
        }
    }
    res = await lift_object(obj, null, { get value() { return count; }, set value(_v) { count = _v; } }, telekinesis);
    if (res <= 0) {
        return res;
    }
    /* What's left of the special case for gold :-) */
    if (obj.oclass == COIN_CLASS) {
        game.disp.botl = (1);
    }
    if (obj.quan != count && obj.otyp != LOADSTONE) {
        obj = await splitobj(obj, count);
    }
    obj = await pick_obj(obj);
    if (game.uwep && game.uwep == obj) {
        game.mrg_to_wielded = (1);
    }
    await pickup_prinv(obj, count, "lifting");
    if (obj.ghostly) {
        await fix_ghostly_obj(obj);
    }
    game.mrg_to_wielded = (0);
    return 1;
}
/*
 * Do the actual work of picking otmp from the floor or monster's interior
 * and putting it in the hero's inventory.  Take care of billing.  Return a
 * pointer to the object where otmp ends up.  This may be different
 * from otmp because of merging.
 */
export async function pick_obj(otmp) {
    let result = null;
    let ox = 0;
    let oy = 0;
    let robshop = 0;
    let fromfloor = otmp.where == 1;
    /* otmp is either on the floor or in an engulfer's inventory; for the
       latter, its <ox,oy> probably won't be set */
    get_obj_location(otmp, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 0);
    robshop = (!game.u.uswallow && otmp != game.uball && await costly_spot(ox, oy));
    await obj_extract_self(otmp);
    if (fromfloor) {
        await newsym(ox, oy);
    }
    if (robshop) {
        /* for shop items, addinv() needs to be after addtobill() (so that
       object merger can take otmp->unpaid into account) but before
       remote_robbery() (which calls rob_shop() which calls setpaid()
       after moving costs of unpaid items to shop debt; setpaid()
       calls clear_unpaid() for lots of object chains, but 'otmp' isn't
       on any of those between obj_extract_self() and addinv(); for
       3.6.0, 'otmp' remained flagged as an unpaid item in inventory
       and triggered impossible() every time inventory was examined) */
        let saveushops = '';
        let fakeshop = '';
        saveushops = strcpy(saveushops, game.u.ushops);
        /* addtobill cares about your location rather than the object's;
           usually they'll be the same, but not when using telekinesis
           (if ever implemented) or a grappling hook */
        fakeshop = __nh_char_write(fakeshop, 0, in_rooms(ox, oy, SHOPBASE));
        fakeshop = __nh_char_write(fakeshop, 1, 0);
        game.u.ushops = strcpy(game.u.ushops, fakeshop);
        await addtobill(otmp, (1), (0), (0));
        game.u.ushops = strcpy(game.u.ushops, saveushops);
        robshop = otmp.unpaid && !strchr(game.u.ushops, fakeshop);
    }
    result = await addinv(otmp);
    if (robshop) {
        await remote_burglary(ox, oy);
    }
    return result;
}
/* pickup_object()/out_container() helper;
   print an added-to-invent message for current object, limiting feedback
   about encumbrance to the first item which causes that to change */
export async function pickup_prinv(obj, count, verb) {
    let pbuf = '';
    let prefix = null;
    let nearload = near_capacity();
    pbuf = '';
    if (nearload == game.pickup_encumbrance) {
        prefix = null;
    } else {
        prefix = (nearload >= EXT_ENCUMBER) ? overloadpfx : (nearload >= HVY_ENCUMBER) ? nearloadpfx : (nearload >= MOD_ENCUMBER) ? moderateloadpfx : (nearload >= SLT_ENCUMBER) ? slightloadpfx : null;
        game.pickup_encumbrance = nearload;
    }
    if (prefix) {
        pbuf = sprintf(pbuf, "%s %s", prefix, verb);
    }
    await prinv(pbuf, obj, count);
}
/*
 * prints a message if encumbrance changed since the last check
 */
export async function encumber_msg() {
    let newcap = near_capacity();
    if (game.oldcap < newcap) {
        switch (newcap) {
            case 1:
                await Your("movements are slowed slightly because of your load.");
                break;
            case 2:
                await You("rebalance your load.  Movement is difficult.");
                break;
            case 3:
                await You("%s under your heavy load.  Movement is very hard.", stagger(game.youmonst.data, "stagger"));
                break;
            default:
                await You("%s move a handspan with this load!", newcap == 4 ? "can barely" : "can't even");
                break;
        }
        game.disp.botl = (1);
    } else if (game.oldcap > newcap) {
        switch (newcap) {
            case 0:
                await Your("movements are now unencumbered.");
                break;
            case 1:
                await Your("movements are only slowed slightly by your load.");
                break;
            case 2:
                await You("rebalance your load.  Movement is still difficult.");
                break;
            case 3:
                await You("%s under your load.  Movement is still very hard.", stagger(game.youmonst.data, "stagger"));
                break;
        }
        game.disp.botl = (1);
    }
    game.oldcap = newcap;
}
/* Is there a container at x,y. Optional: return count of containers at x,y */
export function container_at(x, y, countem) {
    let cobj = null;
    let nobj = null;
    let container_count = 0;
    for (cobj = game.level.objects[x][y]; cobj; cobj = nobj) {
        nobj = cobj.v.v_nexthere;
        if (((cobj).otyp >= LARGE_BOX && (cobj).otyp <= BAG_OF_TRICKS)) {
            container_count++;
            if (!countem) {
                break;
            }
        }
    }
    return container_count;
}
/* loot vs tip */
export async function able_to_loot(x, y, looting) {
    let verb = looting ? "loot" : "tip";
    let t = t_at(x, y);
    if (!can_reach_floor(t && ((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT))) {
        if (game.u.usteed && (game.u.weapon_skills[P_RIDING].skill) < P_BASIC) {
            await rider_cant_reach();
        } else {
            await cant_reach_floor(x, y, (0), (1), (0));
        }
        return (0);
    } else if ((is_pool(x, y) && (looting || !(game.u.uinwater))) || is_lava(x, y)) {
        await You("cannot %s things that are deep in the %s.", verb, hliquid(is_lava(x, y) ? "lava" : "water"));
        return (0);
    } else if ((((game.youmonst.data).mflags1 & 24576) == 24576)) {
        await pline("Without limbs, you cannot %s anything.", verb);
        return (0);
    } else if (looting && !freehand()) {
        await pline("Without a free %s, you cannot loot anything.", await body_part(HAND));
        return (0);
    }
    return (1);
}
export function mon_beside(x, y) {
    let i = 0;
    let j = 0;
    let nx = 0;
    let ny = 0;
    for (i = -1; i <= 1; i++) {
        for (j = -1; j <= 1; j++) {
            nx = x + i;
            ny = y + j;
            if (isok(nx, ny) && (game.level.monsters[nx][ny] != null)) {
                return (1);
            }
        }
    }
    return (0);
}
/* index of this container (1..N)... */
/* ...number of them (N) */
export async function do_loot_cont(cobjp, cindex, ccount) {
    let cobj = cobjp.value;
    if (!cobj) {
        return 0;
    }
    if (cobj.olocked) {
        let res = 0;
        if (cobj.lknown) {
            await pline("%s is locked.", await The(await xname(cobj)));
        } else {
            await pline("Hmmm, %s turns out to be locked.", await the(await xname(cobj)));
        }
        /* floor container, so no need for update_inventory() */
        cobj.lknown = 1;
        if (game.flags.autounlock) {
            /* odds: 1/1, 2/2, 3/4, 4/8, 5/16, 6/32, 7/64, 8/128, 9/128, 10/128,... */
            let otmp = null;
            let unlocktool = null;
            let ox = cobj.ox;
            let oy = cobj.oy;
            /* might be non-zero from previous command since
                       * #loot isn't a move command; pick_lock() cares */
            game.u.dz = 0;
            if (((game.flags.autounlock & 2) != 0 && (unlocktool = autokey((1))) != null) || (game.flags.autounlock & 1) != 0) {
                if (await pick_lock(unlocktool, ox, oy, cobj)) {
                    res = 1;
                }
                /* attempting to untrap or unlock might trigger a trap
                   which destroys 'cobj'; inform caller if that happens */
                for (otmp = game.level.objects[ox][oy]; otmp; otmp = otmp.v.v_nexthere) {
                    if (otmp == cobj) {
                        break;
                    }
                }
                if (!otmp) {
                    cobjp.value = null;
                }
                return res;
            }
            if ((game.flags.autounlock & 8) != 0 && res != 1 && ccount == 1 && u_have_forceable_weapon()) {
                /* single container, and we could #force it open... */
                /* note: doforce asks for confirmation */
                cmdq_add_ec(CQ_CANNED, doforce);
                game.abort_looting = (1);
            }
        }
        return res;
    }
    cobj.lknown = 1;
    if (cobj.otyp == BAG_OF_TRICKS) {
        let tmp = 0;
        await You("carefully open %s...", await the(await xname(cobj)));
        await pline("It develops a huge set of teeth and bites you!");
        tmp = rnd(10);
        await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((tmp) + 1) / 2)) : (tmp)), "carnivorous bag", 0);
        await discover_object((BAG_OF_TRICKS), (1), (1), (1));
        game.abort_looting = (1);
        return 1;
    }
    return await use_container(cobjp, (0), (cindex < ccount));
}
/* #loot extended command */
export async function doloot() {
    let res = 0;
    game.loot_reset_justpicked = (1);
    res = await doloot_core();
    game.loot_reset_justpicked = (0);
    return res;
}
/* loot a container on the floor or loot saddle from mon. */
export async function doloot_core() {
    let __goto_lootmon = (0);
    let cobj = null;
    let nobj = null;
    let c = -1;
    let timepassed = 0;
    let cc = { x: 0, y: 0 };
    let underfoot = (1);
    let dont_find_anything = "don't find anything";
    let mtmp = null;
    let prev_inquiry = 0;
    let prev_loot = (0);
    let num_conts = 0;
    let clr = 8;
    game.abort_looting = (0);
    if (await check_capacity(null)) {
        return 0;
    }
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        await You("have no hands!");
        return 0;
    }
    if (game.u.uprops[CONFUSION].intrinsic) {
        if (rn2(6) && await reverse_loot()) {
            return 1;
        }
        if (rn2(2)) {
            await pline("Being confused, you find nothing to loot.");
            return 1;
        }
    }
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    if (game.iflags.menu_requested) {
        __goto_lootmon = (1);
    }
    lootcont: while (true) {
        if (!__goto_lootmon) {
            if ((num_conts = container_at(cc.x, cc.y, (1))) > 0) {
                /* else fallthrough to normal looting */
                let anyfound = (0);
                if (!await able_to_loot(cc.x, cc.y, (1))) {
                    return 0;
                }
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !game.uarmg) {
                    for (nobj = sobj_at(CORPSE, cc.x, cc.y); nobj; nobj = nxtobj(nobj, CORPSE, (1))) {
                        if (will_feel_cockatrice(nobj, (0))) {
                            await feel_cockatrice(nobj, (0));
                            /* if life-saved (or poly'd into stone golem),
                       terminate attempt to loot */
                            /* the attempt costs you time */
                            /* can only tip one container at a time */
                            return 1;
                        }
                    }
                }
                if (num_conts > 1) {
                    /* use a menu to loot many containers */
                    let n = 0;
                    let i = 0;
                    let win = 0;
                    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
                    let pick_list = null;
                    any.a_void = null;
                    win = (game.windowprocs.win_create_nhwindow)(4);
                    (game.windowprocs.win_start_menu)(win, 0);
                    for (cobj = game.level.objects[cc.x][cc.y]; cobj; cobj = cobj.v.v_nexthere) {
                        if (((cobj).otyp >= LARGE_BOX && (cobj).otyp <= BAG_OF_TRICKS)) {
                            any.a_obj = cobj;
                            await add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, await doname(cobj), 0);
                        }
                    }
                    (game.windowprocs.win_end_menu)(win, "Loot which containers?");
                    n = await select_menu(win, 2, pick_list);
                    (game.windowprocs.win_destroy_nhwindow)(win);
                    if (n > 0) {
                        for (i = 1; i <= n; i++) {
                            cobj = pick_list[i - 1].item.a_obj;
                            timepassed |= await do_loot_cont({ get value() { return cobj; }, set value(_v) { cobj = _v; } }, i, n);
                            if (game.abort_looting) {
                                /* chest trap or magic bag explosion or <esc> */
                                free(pick_list);
                                return (timepassed ? 1 : 0);
                            }
                        }
                        free(pick_list);
                    }
                    if (n != 0) {
                        c = 121;
                    }
                } else {
                    for (cobj = game.level.objects[cc.x][cc.y]; cobj; cobj = nobj) {
                        nobj = cobj.v.v_nexthere;
                        if (((cobj).otyp >= LARGE_BOX && (cobj).otyp <= BAG_OF_TRICKS)) {
                            anyfound = (1);
                            timepassed |= await do_loot_cont({ get value() { return cobj; }, set value(_v) { cobj = _v; } }, 1, 1);
                            if (game.abort_looting) {
                                return (timepassed ? 1 : 0);
                            }
                        }
                    }
                    if (anyfound) {
                        c = 121;
                    }
                }
            } else if (((game.level.locations[cc.x][cc.y].typ) == GRAVE)) {
                await You("need to dig up the grave to effectively loot it...");
            }
        }
        __goto_lootmon = (0);
        if (c != 121 && (mon_beside(game.u.ux, game.u.uy) || game.iflags.menu_requested)) {
            /*
     * 3.3.1 introduced directional looting for some things.
     */
            let looted_mon = (0);
            if (!await get_adjacent_loc("Loot in what direction?", "Invalid loot location", game.u.ux, game.u.uy, cc)) {
                return 0;
            }
            underfoot = ((cc.x) == game.u.ux && (cc.y) == game.u.uy);
            if (underfoot && container_at(cc.x, cc.y, (0))) {
                continue lootcont;
            }
            if (game.u.dz < 0) {
                await You("%s to loot on the %s.", dont_find_anything, ceiling(cc.x, cc.y));
                return 1;
            }
            mtmp = (game.level.monsters[cc.x][cc.y]);
            if (mtmp) {
                timepassed = await loot_mon(mtmp, { get value() { return prev_inquiry; }, set value(_v) { prev_inquiry = _v; } }, { get value() { return prev_loot; }, set value(_v) { prev_loot = _v; } });
                if (timepassed) {
                    looted_mon = (1);
                }
            }
            /* always use a turn when choosing a direction is impaired,
           even if you've successfully targeted a saddled creature
           and then answered "no" to the "remove its saddle?" prompt */
            if (game.u.uprops[CONFUSION].intrinsic || game.u.uprops[STUNNED].intrinsic) {
                timepassed = 1;
            }
            if (!looted_mon) {
                if (!underfoot && container_at(cc.x, cc.y, (0))) {
                    if (mtmp) {
                        await You_cant("loot anything %sthere with %s in the way.", prev_inquiry ? "else " : "", await mon_nam(mtmp));
                        return (timepassed ? 1 : 0);
                    } else {
                        await You("have to be at a container to loot it.");
                    }
                } else {
                    await You("%s %s%shere to loot.", dont_find_anything, (prev_inquiry || prev_loot) ? "else " : "", !underfoot ? "t" : "");
                    return (timepassed ? 1 : 0);
                }
            }
        } else if (c != 121 && c != 110) {
            await You("%s %s to loot.", dont_find_anything, underfoot ? "here" : "there");
        }
        return (timepassed ? 1 : 0);
        break;
    }
}
/* called when attempting to #loot while confused */
export async function reverse_loot() {
    let goldob = null;
    let coffers = null;
    let otmp = null;
    let boxdummy = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let mon = null;
    let contribution = 0;
    let n = 0;
    let x = game.u.ux;
    let y = game.u.uy;
    if (!rn2(3)) {
        for (n = inv_cnt((1)) , otmp = game.invent; otmp; --n , otmp = otmp.nobj) {
            if (!rn2(n + 1)) {
                await prinv("You find old loot:", otmp, 0);
                return (1);
            }
        }
        return (0);
    }
    for (goldob = game.invent; goldob; goldob = goldob.nobj) {
        if (goldob.oclass == COIN_CLASS) {
            /* find a money object to mess with */
            contribution = Math.trunc((rnd(5) * goldob.quan + 4) / 5);
            if (contribution < goldob.quan) {
                goldob = await splitobj(goldob, contribution);
            }
            break;
        }
    }
    if (!goldob) {
        return (0);
    }
    await remove_worn_item(goldob, (0));
    if (!((game.level.locations[x][y].typ) == THRONE)) {
        await dropx(goldob);
        if (g_at(x, y)) {
            await pline("Ok, now there is loot here.");
        }
    } else {
        /* find original coffers chest if present, otherwise use nearest */
        otmp = null;
        for (coffers = game.level.objlist; coffers; coffers = coffers.nobj) {
            if (coffers.otyp == CHEST) {
                if (coffers.spe == 2) {
                    break;
                }
                if (!otmp || (dist2((coffers.ox), (coffers.oy), game.u.ux, game.u.uy) < dist2((otmp.ox), (otmp.oy), game.u.ux, game.u.uy))) {
                    otmp = coffers;
                }
            }
        }
        if (!coffers) {
            coffers = otmp;
        }
        if (coffers) {
            ;
            await verbalize("Thank you for your contribution to reduce the debt.");
            await freeinv(goldob);
            await add_to_container(coffers, goldob);
            coffers.owt = await weight(coffers);
            coffers.cknown = 0;
            if (!coffers.olocked) {
                Object.assign(boxdummy, cg.zeroobj) , boxdummy.otyp = SPE_WIZARD_LOCK;
                await boxlock(coffers, boxdummy);
            }
        } else if (game.level.locations[x][y].flags != 1 && (mon = await makemon(await courtmon(), x, y, 0)) != null) {
            await freeinv(goldob);
            await add_to_minv(mon, goldob);
            await pline("The exchequer accepts your contribution.");
            if (!rn2(10)) {
                game.level.locations[x][y].flags = 1;
            }
        } else {
            await You("drop %s.", await doname(goldob));
            await dropx(goldob);
        }
    }
    return (1);
}
/* loot_mon() returns amount of time passed.
 */
export async function loot_mon(mtmp, passed_info, prev_loot) {
    let c = -1;
    let timepassed = 0;
    let otmp = null;
    let qbuf = '';
    if (mtmp && mtmp != game.u.usteed && (otmp = await which_armor(mtmp, 1048576))) {
        /* 3.3.1 introduced the ability to remove saddle from a steed.
     *  *passed_info is set to TRUE if a loot query was given.
     *  *prev_loot is set to TRUE if something was actually acquired in here.
     */
        if (passed_info) {
            passed_info.value = 1;
        }
        qbuf = sprintf(qbuf, "Do you want to remove the saddle from %s?", await x_monnam(mtmp, 1, null, 8, (0)));
        if ((c = await yn_function(qbuf, ynqchars, 110, (1))) == 121) {
            if ((((game.youmonst.data).mflags1 & 24576) == 24576)) {
                await You_cant("do that without limbs.");
                return 0;
            }
            if (otmp.cursed) {
                await You("can't.  The saddle seems to be stuck to %s.", await x_monnam(mtmp, 1, null, 8, (0)));
                return 1;
            }
            await extract_from_minvent(mtmp, otmp, (1), (0));
            if (game.flags.verbose) {
                await You("take %s off of %s.", await thesimpleoname(otmp), await mon_nam(mtmp));
            }
            otmp = await hold_another_object(otmp, "You drop %s!", await doname(otmp), null);
            ((otmp));
            timepassed = rnd(3);
            if (prev_loot) {
                prev_loot.value = (1);
            }
        } else if (c == 113) {
            return 0;
        }
    }
    if (game.u.uswallow) {
        /* 3.4.0 introduced ability to pick things up from swallower's stomach */
        let count = passed_info ? passed_info.value : 0;
        timepassed = await pickup(count);
    }
    return timepassed;
}
/*
 * Decide whether an object being placed into a magic bag will cause
 * it to explode.  If the object is a bag itself, check recursively.
 */
export function mbag_explodes(obj, depthin) {
    /* these won't cause an explosion when they're empty */
    if ((obj.otyp == WAN_CANCELLATION || obj.otyp == BAG_OF_TRICKS) && obj.spe <= 0) {
        return (0);
    }
    if ((((obj).otyp == BAG_OF_HOLDING || (obj).otyp == BAG_OF_TRICKS) || obj.otyp == WAN_CANCELLATION) && (rn2(1 << (depthin > 7 ? 7 : depthin)) <= depthin)) {
        return (1);
    } else if (((obj).cobj != null)) {
        let otmp = null;
        for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
            if (mbag_explodes(otmp, depthin + 1)) {
                return (1);
            }
        }
    }
    return (0);
}
export function is_boh_item_gone() {
    return (!rn2(13));
}
/* Scatter most of Bag of holding contents around.  Some items will be
   destroyed with the same chance as looting a cursed bag. */
export async function do_boh_explosion(boh, on_floor) {
    let otmp = null;
    let nobj = null;
    /* in case scatter() leads to bones creation */
    boh.in_use = 1;
    /* boh is about to be deleted so no need to reset its in_use flag here */
    for (otmp = boh.cobj; otmp; otmp = nobj) {
        nobj = otmp.nobj;
        if (is_boh_item_gone()) {
            await obj_extract_self(otmp);
            await mbag_item_gone(!on_floor, otmp, (1));
        } else {
            otmp.ox = game.u.ux , otmp.oy = game.u.uy;
            await scatter(game.u.ux, game.u.uy, 4, (2 | 4) | 8, otmp);
        }
    }
}
export async function boh_loss(container, held) {
    if (((container).otyp == BAG_OF_HOLDING || (container).otyp == BAG_OF_TRICKS) && container.cursed && ((container).cobj != null)) {
        /* sometimes toss objects if a cursed magic bag */
        let loss = 0;
        let curr = null;
        let otmp = null;
        for (curr = container.cobj; curr; curr = otmp) {
            otmp = curr.nobj;
            if (is_boh_item_gone()) {
                await obj_extract_self(curr);
                loss += await mbag_item_gone(held, curr, (0));
            }
        }
        return loss;
    }
    return 0;
}
/* Returns: -1 to stop, 1 item was inserted, 0 item was not inserted. */
export async function in_container(obj) {
    let floor_container = !((game.current_container).where == 3);
    let was_unpaid = (0);
    let buf = '';
    if (!game.current_container) {
        await impossible("<in> no gc.current_container?");
        return 0;
    } else if (obj == game.uball || obj == game.uchain) {
        await You("must be kidding.");
        return 0;
    } else if (obj == game.current_container) {
        await pline("That would be an interesting topological exercise.");
        return 0;
    } else if (obj.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288))) {
        await Norep("You cannot %s %s you are wearing.", (game.current_container.otyp == ICE_BOX) ? "refrigerate" : "stash", c_common_strings.c_something);
        return 0;
    } else if ((obj.otyp == LOADSTONE) && obj.cursed) {
        set_bknown(obj, 1);
        await pline_The("stone%s won't leave your person.", (((obj.quan) == 1) ? "" : "s"));
        return 0;
    } else if (obj.otyp == AMULET_OF_YENDOR || obj.otyp == CANDELABRUM_OF_INVOCATION || obj.otyp == BELL_OF_OPENING || obj.otyp == SPE_BOOK_OF_THE_DEAD) {
        await pline("%s cannot be confined in such trappings.", await The(await xname(obj)));
        return 0;
    } else if (obj.otyp == LEASH && obj.corpsenm != 0) {
        await pline("%s attached to your pet.", await Tobjnam(obj, "are"));
        return 0;
    } else if (obj == game.uwep) {
        if (welded(obj)) {
            await weldmsg(obj);
            return 0;
        }
        await setuwep(null);
        /* This uwep check is obsolete.  It dates to 3.0 and earlier when
         * unwielding Firebrand would be fatal in hell if hero had no other
         * fire resistance.  Life-saving would force it to be re-wielded.
         */
        if (game.uwep) {
            return 0;
        }
    } else if (obj == game.uswapwep) {
        await setuswapwep(null);
    } else if (obj == game.uquiver) {
        await setuqwep(null);
    }
    if (await fatal_corpse_mistake(obj, (0))) {
        return -1;
    }
    if (obj.otyp == ICE_BOX || ((obj).otyp == LARGE_BOX || (obj).otyp == CHEST) || obj.otyp == BOULDER || (obj.otyp == STATUE && ((game.mons[obj.corpsenm]).msize >= 3))) {
        buf = strcpy(buf, await the(await xname(obj)));
        await You("cannot fit %s into %s.", buf, await the(await xname(game.current_container)));
        return 0;
    }
    await freeinv(obj);
    if (obj_is_burning(obj)) {
        await snuff_lit(obj);
    }
    if (floor_container && await costly_spot(game.u.ux, game.u.uy)) {
        if (obj.oclass != COIN_CLASS) {
            /* defer gold until after put-in message */
            /* sellobj() will take an unpaid item off the shop bill */
            was_unpaid = obj.unpaid ? (1) : (0);
            if (game.sellobj_first) {
                /* don't sell when putting the item into your own container,
                   but handle billing correctly */
                sellobj_state(game.current_container.no_charge ? (2) : (1));
                game.sellobj_first = (0);
            }
            await sellobj(obj, game.u.ux, game.u.uy);
        }
    }
    if ((game.current_container.otyp == ICE_BOX) && !((obj).otyp == BRASS_LANTERN || (obj).otyp == OIL_LAMP || (obj).otyp == CANDELABRUM_OF_INVOCATION || (obj).otyp == TALLOW_CANDLE || (obj).otyp == WAX_CANDLE || (obj).otyp == POT_OIL)) {
        obj.age = game.moves - obj.age;
        if (obj.otyp == CORPSE) {
            if (obj.timed) {
                /* stop any corpse timeouts when frozen */
                stop_timer(ROT_CORPSE, obj_to_any(obj));
                stop_timer(REVIVE_MON, obj_to_any(obj));
            }
            /* if this is the corpse of a cancelled ice troll, uncancel it */
            if (obj.corpsenm == PM_ICE_TROLL && ((obj).oextra && ((obj).oextra.omonst))) {
                ((obj).oextra.omonst).mcan = 0;
            }
        } else if (obj.globby && obj.timed) {
            stop_timer(SHRINK_GLOB, obj_to_any(obj));
        }
    } else if (((game.current_container).otyp == BAG_OF_HOLDING || (game.current_container).otyp == BAG_OF_TRICKS) && mbag_explodes(obj, 0)) {
        livelog_printf(2, "just blew up %s bag of holding", (genders[game.flags.female ? 1 : 0].his));
        await urgent_pline("As you put %s inside, you are blasted by a magical explosion!", await doname(obj));
        if (was_unpaid) {
            await addtobill(obj, (0), (0), (1));
        }
        if (obj.otyp == BAG_OF_HOLDING) {
            await do_boh_explosion(obj, (obj.where == 1));
        }
        await obfree(obj, null);
        if (floor_container && await costly_spot(game.current_container.ox, game.current_container.oy)) {
            /* if carried, shop goods will be flagged 'unpaid' and obfree() will
           handle bill issues, but if on floor, we need to put them on bill
           before deleting them (non-shop items will be flagged 'no_charge')*/
            let save_no_charge = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
            save_no_charge.no_charge = game.current_container.no_charge;
            await addtobill(game.current_container, (0), (0), (0));
            /* addtobill() clears no charge; we need to set it back
               so that useupf() doesn't double bill */
            game.current_container.no_charge = save_no_charge.no_charge;
        }
        await do_boh_explosion(game.current_container, floor_container);
        if (!floor_container) {
            await useup(game.current_container);
        } else if (obj_here(game.current_container, game.u.ux, game.u.uy)) {
            await useupf(game.current_container, game.current_container.quan);
        } else {
            await panic("in_container:  bag not found.");
        }
        await losehp(d(6, 6), "magical explosion", 0);
        game.current_container = null;
    }
    if (game.current_container) {
        buf = strcpy(buf, await the(await xname(game.current_container)));
        await You("put %s into %s.", await doname(obj), buf);
        /* gold in container always needs to be added to credit */
        if (floor_container && obj.oclass == COIN_CLASS) {
            await sellobj(obj, game.current_container.ox, game.current_container.oy);
        }
        await add_to_container(game.current_container, obj);
        game.current_container.owt = await weight(game.current_container);
    }
    await bot();
    return (game.current_container ? 1 : -1);
}
/* askchain() filter used by in_container();
 * returns True if the container is intact and 'obj' isn't it, False if
 * container is gone (magic bag explosion) or 'obj' is the container itself;
 * also used by getobj() when picking a single item to stash
 */
export function ck_bag(obj) {
    return (game.current_container && obj != game.current_container);
}
/* Returns: -1 to stop, 1 item was removed, 0 item was not removed. */
export async function out_container(obj) {
    let otmp = null;
    let res = 0;
    let count = 0;
    let is_gold = (obj.oclass == COIN_CLASS);
    if (!game.current_container) {
        await impossible("<out> no gc.current_container?");
        return -1;
    } else if (is_gold) {
        obj.owt = await weight(obj);
    }
    if (obj.oartifact && !await touch_artifact(obj, game.youmonst)) {
        return 0;
    }
    if (await fatal_corpse_mistake(obj, (0))) {
        return -1;
    }
    count = obj.quan;
    if ((res = await lift_object(obj, game.current_container, { get value() { return count; }, set value(_v) { count = _v; } }, (0))) <= 0) {
        return res;
    }
    if (obj.quan != count && obj.otyp != LOADSTONE) {
        obj = await splitobj(obj, count);
    }
    await obj_extract_self(obj);
    game.current_container.owt = await weight(game.current_container);
    if ((game.current_container.otyp == ICE_BOX)) {
        await removed_from_icebox(obj);
    }
    if (!obj.unpaid && !((game.current_container).where == 3) && await costly_spot(game.current_container.ox, game.current_container.oy)) {
        obj.ox = game.current_container.ox;
        obj.oy = game.current_container.oy;
        await addtobill(obj, (0), (0), (0));
    }
    if (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_PICK_AXE)) {
        await pick_pick(obj);
    }
    otmp = await addinv(obj);
    await pickup_prinv(otmp, count, "removing");
    if (is_gold) {
        await bot();
    }
    return 1;
}
/* taking a corpse out of an ice box needs a couple of adjustments */
export async function removed_from_icebox(obj) {
    if (!((obj).otyp == BRASS_LANTERN || (obj).otyp == OIL_LAMP || (obj).otyp == CANDELABRUM_OF_INVOCATION || (obj).otyp == TALLOW_CANDLE || (obj).otyp == WAX_CANDLE || (obj).otyp == POT_OIL)) {
        obj.age = game.moves - obj.age;
        if (obj.otyp == CORPSE) {
            let m = get_mtraits(obj, (0));
            let iceT = m ? (m.data == game.mons[PM_ICE_TROLL]) : (obj.corpsenm == PM_ICE_TROLL);
            /* start a revive timer if this corpse is for an ice troll,
               otherwise start a rot-away timer (even for other trolls) */
            obj.oeroded2 = iceT ? 0 : 1;
            await start_corpse_timeout(obj);
        } else if (obj.globby) {
            await start_glob_timeout(obj, 0);
        }
    }
}
/* an object inside a cursed bag of holding is being destroyed */
export async function mbag_item_gone(held, item, silent) {
    let shkp = null;
    let loss = 0;
    if (!silent) {
        if (item.dknown) {
            await pline("%s %s vanished!", await Doname2(item), await otense(item, "have"));
        } else {
            await You("%s %s disappear!", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "notice" : "see", await doname(item));
        }
    }
    if (game.u.ushops && (shkp = await shop_keeper(game.u.ushops)) != null) {
        if (held ? item.unpaid : await costly_spot(game.u.ux, game.u.uy)) {
            loss = await stolen_value(item, game.u.ux, game.u.uy, shkp.mpeaceful, (1));
        }
    }
    await obfree(item, null);
    return loss;
}
/* used for #loot/apply, #tip, and final disclosure */
const __observe_quantum_cat_sc = "Schroedinger's Cat";
export async function observe_quantum_cat(box, makecat, givemsg) {
    let deadcat = null;
    let livecat = null;
    let ox = 0;
    let oy = 0;
    let itsalive = !rn2(2);
    /* box is either held or on floor at hero's spot; no need to check for
       nesting; when held, we need to update its location to match hero's;
       for floor, the coordinate updating is redundant */
    if (get_obj_location(box, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 0)) {
        box.ox = ox , box.oy = oy;
    }
    /* in case it's being carried */
    /* this isn't really right, since any form of observation
       (telepathic or monster/object/food detection) ought to
       force the determination of alive vs dead state; but basing it
       just on opening or disclosing the box is much simpler to cope with */
    /* SchroedingersBox already has a cat corpse in it */
    deadcat = box.cobj;
    if (itsalive) {
        if (makecat) {
            livecat = await makemon(game.mons[PM_HOUSECAT], box.ox, box.oy, 1 | 16 | 131072);
        }
        if (livecat) {
            livecat.mpeaceful = 1;
            set_malign(livecat);
            if (givemsg) {
                if (!(canseemon(livecat) || sensemon(livecat))) {
                    await You("think %s brushed your %s.", c_common_strings.c_something, await body_part(FOOT));
                } else {
                    await pline("%s inside the box is still alive!", await Monnam(livecat));
                }
            }
            christen_monst(livecat, __observe_quantum_cat_sc);
            if (deadcat) {
                await obj_extract_self(deadcat);
                await obfree(deadcat, null) , deadcat = null;
            }
            box.owt = await weight(box);
            /* now an ordinary box (with a cat corpse inside) */
            box.spe = 0;
            if (!game.context.mon_moving) {
                await more_experienced(10, 20);
                await newexplevel();
            }
        }
    } else {
        box.spe = 0;
        if (givemsg) {
            await pline_The("%s inside the box is dead!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? await rndmonnam(null) : "housecat");
        }
        if (deadcat) {
            /* set_corpsenm() will start the rot timer that was removed
               when makemon() created SchroedingersBox; start it from
               now rather than from when this special corpse got created */
            deadcat.age = game.moves;
            await set_corpsenm(deadcat, PM_HOUSECAT);
            deadcat = await oname(deadcat, __observe_quantum_cat_sc, 0);
            if (!game.context.mon_moving) {
                await more_experienced(20, 10);
                await newexplevel();
            }
        }
    }
    ((deadcat));
    return;
}
/* used by askchain() to check for magic bag explosion */
export function container_gone(fn) {
    /* result is only meaningful while use_container() is executing */
    return ((fn == in_container || fn == out_container) && !game.current_container);
}
const __explain_container_prompt_explaintext = ["Container actions:", "", " : -- Look: examine contents", " o -- Out: take things out", " i -- In: put things in", " b -- Both: first take things out, then put things in", " r -- Reversed: put things in, then take things out", " s -- Stash: put one item in", "", " n -- Next: loot next selected container", " q -- Quit: finished", " ? -- Help: display this text.", "", null];
export async function explain_container_prompt(more_containers) {
    let __nh_txtpp_idx = 0;
    let win = 0;
    if ((win = (game.windowprocs.win_create_nhwindow)(5)) != (-1)) {
        for (__nh_txtpp_idx = 0; __nh_char_at0(__nh_advance_str(__explain_container_prompt_explaintext, __nh_txtpp_idx)); ++__nh_txtpp_idx) {
            /* "Do what with <container>? [:oibrsq or ?] (q)" */
            if (!more_containers && !strncmp(__nh_char_at0(__nh_advance_str(__explain_container_prompt_explaintext, __nh_txtpp_idx)), " n ", 3)) {
                continue;
            }
            (game.windowprocs.win_putstr)(win, 0, __nh_char_at0(__nh_advance_str(__explain_container_prompt_explaintext, __nh_txtpp_idx)));
        }
        await (game.windowprocs.win_display_nhwindow)(win, (0));
        (game.windowprocs.win_destroy_nhwindow)(win);
    }
}
export async function u_handsy() {
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        await You("have no hands!");
        return (0);
    } else if (!freehand()) {
        await You("have no free %s.", await body_part(HAND));
        return (0);
    }
    return (1);
}
/* getobj callback for object to be stashed into a container */
export function stash_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    /* downplay the container being stashed into */
    if (!ck_bag(obj)) {
        return GETOBJ_EXCLUDE_SELECTABLE;
    }
    /* Possible extension: downplay things too big to fit into containers (in
     * which case extract in_container()'s logic.) */
    return GETOBJ_SUGGEST;
}
/* True iff #loot multiple and this isn't last */
export async function use_container(objp, held, more_containers) {
    let otmp = null;
    let obj = null;
    let quantum_cat = 0;
    let cursed_mbag = 0;
    let loot_out = 0;
    let loot_in = 0;
    let loot_in_first = 0;
    let stash_one = 0;
    let inokay = 0;
    let outokay = 0;
    let outmaybe = 0;
    let c = 0;
    let emptymsg = '';
    let qbuf = '';
    let pbuf = '';
    let xbuf = '';
    let used = 0;
    let loss = 0;
    containerdone: {
        obj = objp.value;
        used = 0;
        game.abort_looting = (0);
        /* in_container() should call sellobj_state() */
        game.sellobj_first = (1);
        emptymsg = '';
        if (!await u_handsy()) {
            return 0;
        }
        if (!obj.lknown) {
            obj.lknown = 1;
            if (held) {
                update_inventory();
            }
        }
        if (obj.olocked) {
            await pline("%s locked.", await Tobjnam(obj, "are"));
            if (held) {
                await You("must put it down to unlock.");
            }
            return 0;
        } else if (obj.otrapped) {
            if (held) {
                await You("open %s...", await the(await xname(obj)));
            }
            await chest_trap(obj, HAND, (0));
            if (game.multi >= 0) {
                /* even if the trap fails, you've used up this turn */
                /* in case we didn't become paralyzed */
                nomul(-1);
                game.multi_reason = "opening a container";
                game.nomovemsg = "";
            }
            game.abort_looting = (1);
            return 1;
        }
        /* for use by in/out_container */
        game.current_container = obj;
        /*
     * From here on out, all early returns go through 'containerdone:'.
     */
        /* check for Schroedinger's Cat */
        quantum_cat = ((game.current_container).otyp == LARGE_BOX && (game.current_container).spe == 1);
        if (quantum_cat) {
            await observe_quantum_cat(game.current_container, (1), (1));
            used = 1;
        }
        cursed_mbag = ((game.current_container).otyp == BAG_OF_HOLDING || (game.current_container).otyp == BAG_OF_TRICKS) && game.current_container.cursed && ((game.current_container).cobj != null);
        if (cursed_mbag && (loss = await boh_loss(game.current_container, held)) != 0) {
            used = 1;
            await You("owe %ld %s for lost merchandise.", loss, await currency(loss));
            game.current_container.owt = await weight(game.current_container);
        }
        /* might put something in if carrying anything other than just the
       container itself (invent is not the container or has a next object) */
        inokay = (game.invent != null && (game.invent != game.current_container || game.invent.nobj));
        /* might take something out if container isn't empty */
        outokay = ((game.current_container).cobj != null);
        if (!outokay) {
            emptymsg = sprintf(emptymsg, "%s is %sempty.", await Ysimple_name2(game.current_container), (quantum_cat || cursed_mbag) ? "now " : "");
        }
        for (; ; ) {
            /* repeats iff '?' or ':' gets chosen */
            outmaybe = (outokay || !game.current_container.cknown);
            if (!outmaybe) {
                await safe_qbuf(qbuf, null, " is empty.  Do what with it?", game.current_container, Yname2, Ysimple_name2, "This");
            } else {
                await safe_qbuf(qbuf, "Do what with ", "?", game.current_container, yname, ysimple_name, "it");
            }
            if (game.flags.menu_style == 3 || game.flags.menu_style == 2) {
                if (!inokay && !outmaybe) {
                    /* ask player about what to do with this container */
                    /* nothing to take out, nothing to put in;
                   trying to do both will yield proper feedback */
                    c = 98;
                } else {
                    c = await in_or_out_menu(qbuf, game.current_container, outmaybe, inokay, (used != 0), more_containers);
                }
            } else {
                /* TRADITIONAL or COMBINATION */
                /* list of extra acceptable responses */
                xbuf = '';
                pbuf = strcpy(pbuf, ":");
                strcat(outmaybe ? pbuf : xbuf, "o");
                strcat(inokay ? pbuf : xbuf, "i");
                strcat(outmaybe ? pbuf : xbuf, "b");
                strcat(inokay ? pbuf : xbuf, "rs");
                pbuf = strcat(pbuf, " ");
                strcat(more_containers ? pbuf : xbuf, "n");
                pbuf = strcat(pbuf, "q");
                if (game.iflags.cmdassist) {
                    pbuf = strcat(pbuf, " or ?");
                } else {
                    xbuf = strcat(xbuf, "?");
                }
                if (xbuf) {
                    strcat(strcat(pbuf, "\x1b"), xbuf);
                }
                c = await yn_function(qbuf, pbuf, more_containers ? 110 : 113, (1));
            }
            if (c == 63) {
                await explain_container_prompt(more_containers);
            } else if (c == 58) {
                /* note: will set obj->cknown */
                /* out-only or out before in */
                if (!game.current_container.cknown) {
                    /* put one item into container */
                    used = 1;
                }
                await container_contents(game.current_container, (0), (0), (1));
            } else {
                break;
            }
        }
        /* loop until something other than '?' or ':' is picked */
        if (c == 113) {
            game.abort_looting = (1);
        }
        /* [not strictly needed; falling thru works] */
        if (c == 110 || c == 113) {
            break containerdone;
        }
        loot_out = (c == 111 || c == 98 || c == 114);
        loot_in = (c == 105 || c == 98 || c == 114);
        loot_in_first = (c == 114);
        stash_one = (c == 115);
        if (loot_out && !loot_in_first) {
            if (!((game.current_container).cobj != null)) {
                await pline("%s", emptymsg);
                if (!game.current_container.cknown) {
                    used = 1;
                }
                game.current_container.cknown = 1;
            } else {
                /*
     * Gone: being nice about only selecting food if we know we are
     * putting things in an ice chest.
     */
                add_valid_menu_class(0);
                if (game.flags.menu_style == 0) {
                    used |= await traditional_loot((0));
                } else {
                    used |= (await menu_loot(0, (0)) > 0);
                }
                add_valid_menu_class(0);
            }
            /* recalculate 'inokay' in case something was just taken out and
           inventory is no longer empty or no longer just the container */
            inokay = (game.invent && (game.invent != game.current_container || game.invent.nobj));
        }
        if ((loot_in || stash_one) && !inokay) {
            await You("don't have anything%s to %s.", game.invent ? " else" : "", stash_one ? "stash" : "put in");
            loot_in = stash_one = (0);
        }
        if (loot_in) {
            add_valid_menu_class(0);
            if (game.flags.menu_style == 0) {
                used |= await traditional_loot((1));
            } else {
                used |= (await menu_loot(0, (1)) > 0);
            }
            add_valid_menu_class(0);
        } else if (stash_one) {
            if ((otmp = await getobj("stash", stash_ok, 2 | 1)) != null) {
                if (await in_container(otmp)) {
                    used = 1;
                } else {
                    await unsplitobj(otmp);
                }
            }
        }
        /* putting something in might have triggered magic bag explosion */
        if (!game.current_container) {
            loot_out = (0);
        }
        if (loot_out && loot_in_first) {
            if (!((game.current_container).cobj != null)) {
                await pline("%s", emptymsg);
                if (!game.current_container.cknown) {
                    used = 1;
                }
                game.current_container.cknown = 1;
            } else {
                add_valid_menu_class(0);
                if (game.flags.menu_style == 0) {
                    used |= await traditional_loot((0));
                } else {
                    used |= (await menu_loot(0, (0)) > 0);
                }
                add_valid_menu_class(0);
            }
        }
    }
    if (used) {
        /* Not completely correct; if we put something in without knowing
           whatever was already inside, now we suddenly do.  That can't
           be helped unless we want to track things item by item and then
           deal with containers whose contents are "partly known". */
        if (game.current_container) {
            game.current_container.cknown = 1;
        }
        update_inventory();
    }
    /* in case in_container() set it */
    sellobj_state((0));
    objp.value = game.current_container;
    if (game.current_container) {
        game.current_container = null;
    /* avoid hanging on to stale pointer */
    } else {
        game.abort_looting = (1);
    }
    return used;
}
/* loot current_container (take things out or put things in), by prompting */
export async function traditional_loot(put_in) {
    let actionfunc = null;
    let checkfunc = null;
    let objlist = null;
    let selection = '';
    let action = null;
    let one_by_one = 0;
    let allflag = 0;
    let used = 0;
    let menu_on_request = 0;
    if (put_in) {
        action = "put in";
        objlist = game.invent;
        actionfunc = in_container;
        checkfunc = ck_bag;
    } else {
        action = "take out";
        objlist = (game.current_container.cobj);
        actionfunc = out_container;
        checkfunc = null;
        game.pickup_encumbrance = 0;
    }
    if (await query_classes(selection, { get value() { return one_by_one; }, set value(_v) { one_by_one = _v; } }, { get value() { return allflag; }, set value(_v) { allflag = _v; } }, action, objlist, (0), { get value() { return menu_on_request; }, set value(_v) { menu_on_request = _v; } })) {
        if (await askchain(objlist, (one_by_one ? null : selection), allflag, actionfunc, checkfunc, 0, action)) {
            used = 1;
        }
    } else if (menu_on_request < 0) {
        used = (await menu_loot(menu_on_request, put_in) > 0);
    }
    return used;
}
/* loot current_container (take things out or put things in), using a menu */
export async function menu_loot(retry, put_in) {
    let n = 0;
    let i = 0;
    let n_looted = 0;
    let all_categories = (1);
    let loot_everything = (0);
    let autopick = (0);
    let buf = '';
    let loot_justpicked = (0);
    let action = put_in ? "Put in" : "Take out";
    let otmp = null;
    let otmp2 = null;
    let pick_list = null;
    let mflags = 0;
    let res = 0;
    let count = 0;
    game.pickup_encumbrance = 0;
    if (retry) {
        all_categories = (retry == -2);
    } else if (game.flags.menu_style == 2) {
        all_categories = (0);
        buf = sprintf(buf, "%s what type of objects?", action);
        mflags = (32 | 4 | ((256 | 512 | 1024) | 2048) | 128 | 4096);
        n = await query_category(buf, put_in ? game.invent : game.current_container.cobj, mflags, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2);
        /* when paranoid_confirm:A is set, 'A' by itself implies
               'A'+'a' which will be followed by a confirmation prompt;
               when that option isn't set, 'A' by itself is rejected
               by query_categorry() and result here will be n==0 */
        if (!n) {
            return 0;
        }
        for (i = 0; i < n; i++) {
            if (pick_list[i].item.a_int == 65) {
                /* no non-autopick category filters specified */
                loot_everything = autopick = (1);
            } else if (put_in && pick_list[i].item.a_int == 80) {
                loot_justpicked = (1);
                count = ((0) > (pick_list[i].count) ? (0) : (pick_list[i].count));
                add_valid_menu_class(pick_list[i].item.a_int);
                loot_everything = (0);
            } else if (pick_list[i].item.a_int == -2) {
                all_categories = (1);
            } else {
                add_valid_menu_class(pick_list[i].item.a_int);
                loot_everything = (0);
            }
        }
        free(pick_list);
    }
    if (autopick) {
        /* in_container or out_container */
        let inout_func = null;
        let firstobj = null;
        if (!put_in) {
            game.current_container.cknown = 1;
            inout_func = out_container;
            firstobj = game.current_container.cobj;
        } else {
            inout_func = in_container;
            firstobj = game.invent;
        }
        for (otmp = firstobj; otmp && game.current_container; otmp = otmp2) {
            /*
         * Note:  for put_in, current_container might be destroyed during
         * mid-traversal by a magic bag explosion.
         * Note too:  items are processed in internal list order rather
         * than menu display order ('sortpack') or 'sortloot' order;
         * for put_in that should be item->invlet order so reasonable.
         */
            otmp2 = otmp.nobj;
            if (loot_everything || all_categories || allow_category(otmp)) {
                res = (inout_func)(otmp);
                if (res < 0) {
                    break;
                }
                n_looted += res;
            }
        }
    } else if (put_in && loot_justpicked && count_justpicked(game.invent) == 1) {
        otmp = find_justpicked(game.invent);
        if (otmp) {
            n_looted = 1;
            if (count > 0 && count < otmp.quan) {
                otmp = await splitobj(otmp, count);
            }
            await in_container(otmp);
        }
    } else {
        mflags = 16 | 2;
        if (put_in && game.flags.invlet_constant) {
            mflags |= 8;
        }
        if (put_in && loot_justpicked) {
            mflags |= 4096;
        }
        if (!put_in) {
            game.current_container.cknown = 1;
        }
        buf = sprintf(buf, "%s what?", action);
        n = await query_objlist(buf, put_in ? game.invent : (game.current_container.cobj), mflags, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2, all_categories ? allow_all : allow_category);
        if (n) {
            n_looted = n;
            for (i = 0; i < n; i++) {
                otmp = pick_list[i].item.a_obj;
                (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                count = pick_list[i].count;
                if (count > 0 && count < otmp.quan) {
                    otmp = await splitobj(otmp, count);
                }
                res = put_in ? await in_container(otmp) : await out_container(otmp);
                if (res <= 0) {
                    if (!game.current_container) {
                        /* otmp caused current_container to explode;
                           both are now gone */
                        otmp = null;
                    } else if (otmp && otmp != pick_list[i].item.a_obj) {
                        await unsplitobj(otmp);
                    }
                    if (res < 0) {
                        break;
                    }
                }
            }
            free(pick_list);
        }
    }
    return n_looted ? 1 : 0;
}
/* can take out */
/* can put in */
/* controls phrasing of the decline choice */
const __in_or_out_menu_lootchars = "_:oibrsnq";
const __in_or_out_menu_abc_chars = "_:abcdenq";
export async function in_or_out_menu(prompt, obj, outokay, inokay, alreadyused, more_containers) {
    let win = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let pick_list = null;
    let buf = '';
    let n = 0;
    let menuselector = game.flags.lootabc ? __in_or_out_menu_abc_chars : __in_or_out_menu_lootchars;
    let clr = 8;
    Object.assign(any, cg.zeroany);
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    any.a_int = 1;
    buf = sprintf(buf, "Look inside %s", await thesimpleoname(obj));
    await add_menu(win, nul_glyphinfo, any, __nh_char_at0(__nh_advance_str(menuselector, any.a_int)), 0, 0, clr, buf, 0);
    if (outokay) {
        any.a_int = 2;
        buf = sprintf(buf, "take %s out", c_common_strings.c_something);
        await add_menu(win, nul_glyphinfo, any, __nh_char_at0(__nh_advance_str(menuselector, any.a_int)), 0, 0, clr, buf, 0);
    }
    if (inokay) {
        any.a_int = 3;
        buf = sprintf(buf, "put %s in", c_common_strings.c_something);
        await add_menu(win, nul_glyphinfo, any, __nh_char_at0(__nh_advance_str(menuselector, any.a_int)), 0, 0, clr, buf, 0);
    }
    if (outokay) {
        any.a_int = 4;
        buf = sprintf(buf, "%stake out, then put in", inokay ? "both; " : "");
        await add_menu(win, nul_glyphinfo, any, __nh_char_at0(__nh_advance_str(menuselector, any.a_int)), 0, 0, clr, buf, 0);
    }
    if (inokay) {
        any.a_int = 5;
        buf = sprintf(buf, "%sput in, then take out", outokay ? "both reversed; " : "");
        await add_menu(win, nul_glyphinfo, any, __nh_char_at0(__nh_advance_str(menuselector, any.a_int)), 0, 0, clr, buf, 0);
        any.a_int = 6;
        buf = sprintf(buf, "stash one item into %s", await thesimpleoname(obj));
        await add_menu(win, nul_glyphinfo, any, __nh_char_at0(__nh_advance_str(menuselector, any.a_int)), 0, 0, clr, buf, 0);
    }
    await add_menu_str(win, "");
    if (more_containers) {
        any.a_int = 7;
        await add_menu(win, nul_glyphinfo, any, __nh_char_at0(__nh_advance_str(menuselector, any.a_int)), 0, 0, clr, "loot next container", 1);
    }
    any.a_int = 8;
    buf = strcpy(buf, alreadyused ? "done" : "do nothing");
    await add_menu(win, nul_glyphinfo, any, __nh_char_at0(__nh_advance_str(menuselector, any.a_int)), 0, 0, clr, buf, more_containers ? 0 : 1);
    (game.windowprocs.win_end_menu)(win, prompt);
    n = await select_menu(win, 1, pick_list);
    (game.windowprocs.win_destroy_nhwindow)(win);
    if (n > 0) {
        let k = pick_list[0].item.a_int;
        if (n > 1 && k == (more_containers ? 7 : 8)) {
            k = pick_list[1].item.a_int;
        }
        free(pick_list);
        return __nh_char_at0(__nh_advance_str(__in_or_out_menu_lootchars, k));
    }
    return (n == 0 && more_containers) ? 110 : 113;
}
/* getobj callback for object to tip */
export function tip_ok(obj) {
    if (!obj || obj.oclass == COIN_CLASS) {
        return GETOBJ_EXCLUDE;
    }
    if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS)) {
        return GETOBJ_SUGGEST;
    }
    /* include horn of plenty if sufficiently discovered */
    if (obj.otyp == HORN_OF_PLENTY && obj.dknown && game.objects[obj.otyp].oc_name_known) {
        return GETOBJ_SUGGEST;
    }
    /* allow trying anything else in inventory */
    return GETOBJ_DOWNPLAY;
}
/* show a menu of containers under hero,
   and one extra entry for choosing an inventory.
   returns ECMD_CANCEL if menu was canceled,
   ECMD_TIME if a container was picked,
   otherwise returns ECMD_OK. */
export async function choose_tip_container_menu() {
    let n = 0;
    let i = 0;
    let win = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let pick_list = null;
    let dummyobj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let otmp = null;
    let clr = 8;
    Object.assign(any, cg.zeroany);
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    for (otmp = game.level.objects[game.u.ux][game.u.uy] , i = 0; otmp; otmp = otmp.v.v_nexthere) {
        if (((otmp).otyp >= LARGE_BOX && (otmp).otyp <= BAG_OF_TRICKS)) {
            ++i;
            any.a_obj = otmp;
            await add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, await doname(otmp), 0);
        }
    }
    if (game.invent) {
        await add_menu_str(win, "");
        any.a_obj = dummyobj;
        /* use 'i' for inventory unless there are so many
           containers that it's already being used */
        i = (i <= 105 - 97 && !game.flags.lootabc) ? 105 : 0;
        await add_menu(win, nul_glyphinfo, any, i, 0, 0, clr, "tip something being carried", 1);
    }
    (game.windowprocs.win_end_menu)(win, "Tip which container?");
    n = await select_menu(win, 1, pick_list);
    (game.windowprocs.win_destroy_nhwindow)(win);
    /*
     * Deal with quirk of preselected item in pick-one menu:
     * n ==  0 => picked preselected entry, toggling it off;
     * n ==  1 => accepted preselected choice via SPACE or RETURN;
     * n ==  2 => picked something other than preselected entry;
     * n == -1 => cancelled via ESC;
     */
    otmp = (n <= 0) ? null : pick_list[0].item.a_obj;
    if (n > 1 && otmp == dummyobj) {
        otmp = pick_list[1].item.a_obj;
    }
    if (pick_list) {
        free(pick_list);
    }
    if (otmp && otmp != dummyobj) {
        await tipcontainer(otmp);
        return 1;
    }
    if (n == -1) {
        return 2;
    }
    return 0;
}
/* #tip command -- empty container contents onto floor */
export async function dotip() {
    let cobj = null;
    let nobj = null;
    let cc = { x: 0, y: 0 };
    let boxes = 0;
    let c = 0;
    let buf = '';
    let qbuf = '';
    let spillage = null;
    /*
     * Doesn't require free hands;
     * limbs are needed to tip floor containers.
     *
     * Note: for menustyle:Traditional, using m prefix forces a menu
     * of floor containers when more than one is present.  For other
     * menustyle settings or when fewer than two floor containers are
     * present, using 'm' skips floor and goes straight to invent.
     * This somewhat unintuitive behavior is driven by the way that
     * context-sensitive inventory item actions use m prefix.
     */
    /* at present, can only tip things at current spot, not adjacent ones */
    cc.x = game.u.ux , cc.y = game.u.uy;
    /* check floor container(s) first; at most one will be accessed */
    boxes = container_at(cc.x, cc.y, (1));
    if (boxes > 0 && (!game.iflags.menu_requested || (game.flags.menu_style == 0 && boxes > 1))) {
        buf = sprintf(buf, "You can't tip %s while carrying so much.", !game.flags.verbose ? "a container" : (boxes > 1) ? "one" : "it");
        if (!await check_capacity(buf) && await able_to_loot(cc.x, cc.y, (0))) {
            if (boxes > 1) {
                /* this is iffy for menustyle:traditional; 'm' prefix is ambiguous
       for it: skip floor vs handle multiple containers via menu */
                let res = 0;
                if ((res = await choose_tip_container_menu()) != 0) {
                    return res;
                }
            } else {
                for (cobj = game.level.objects[cc.x][cc.y]; cobj; cobj = nobj) {
                    nobj = cobj.v.v_nexthere;
                    if (!((cobj).otyp >= LARGE_BOX && (cobj).otyp <= BAG_OF_TRICKS)) {
                        continue;
                    }
                    c = await yn_function(await safe_qbuf(qbuf, "There is ", " here, tip it?", cobj, doname, ansimpleoname, "container"), ynqchars, 113, (1));
                    if (c == 113) {
                        return 0;
                    }
                    if (c == 110) {
                        continue;
                    }
                    await tipcontainer(cobj);
                    return 1;
                }
            }
        }
    }
    cobj = await getobj("tip", tip_ok, 2);
    if (!cobj) {
        return 2;
    }
    if (((cobj).otyp >= LARGE_BOX && (cobj).otyp <= BAG_OF_TRICKS) || cobj.otyp == HORN_OF_PLENTY) {
        await tipcontainer(cobj);
        return 1;
    }
    if ((cobj.otyp == TALLOW_CANDLE || cobj.otyp == WAX_CANDLE) && cobj.lamplit) {
        /* note "wax" even for tallow candles to avoid giving away info */
        spillage = "wax";
    } else if ((cobj.otyp == POT_OIL && cobj.lamplit) || (cobj.otyp == OIL_LAMP && cobj.age != 0) || (cobj.otyp == MAGIC_LAMP && cobj.spe != 0)) {
        /* todo: reduce potion's remaining burn timer or oil lamp's fuel */
        spillage = "oil";
    } else if (cobj.otyp == CAN_OF_GREASE && cobj.spe > 0) {
        spillage = "grease";
    } else if (cobj.otyp == FOOD_RATION || cobj.otyp == CRAM_RATION || cobj.otyp == LEMBAS_WAFER) {
        spillage = "crumbs";
    } else if (cobj.oclass == VENOM_CLASS) {
        spillage = "venom";
    }
    if (spillage) {
        buf = '';
        if (is_pool(game.u.ux, game.u.uy)) {
            buf = sprintf(buf, " and gradually %s", await vtense(spillage, "dissipate"));
        } else if (is_lava(game.u.ux, game.u.uy)) {
            buf = sprintf(buf, " and immediately %s away", await vtense(spillage, "burn"));
        }
        await pline("Some %s %s onto the %s%s.", spillage, await vtense(spillage, "spill"), surface(game.u.ux, game.u.uy), buf);
        if (cobj.otyp == CAN_OF_GREASE && cobj.spe > 0) {
            await consume_obj_charge(cobj, (1));
        }
        return 1;
    }
    if (cobj.oclass == POTION_CLASS) {
        await pline_The("%s %s securely sealed.", await xname(cobj), await otense(cobj, "are"));
    } else if (game.uarmh && cobj == game.uarmh) {
        return await tiphat() ? 1 : 0;
    } else if (cobj.otyp == STATUE) {
        await pline("Nothing interesting happens.");
    } else {
        await pline("%s", c_common_strings.c_nothing_happens);
    }
    return 0;
}
export const TIPCHECK_OK = 0;
export const TIPCHECK_LOCKED = 1;
export const TIPCHECK_TRAPPED = 2;
export const TIPCHECK_CANNOT = 3;
export const TIPCHECK_EMPTY = 4;
/* or bag */
export async function tipcontainer(box) {
    /* #tip only works at hero's location */
    let ox = game.u.ux;
    let oy = game.u.uy;
    let srcheld = (0);
    let dstheld = (0);
    let maybeshopgoods = 0;
    let targetbox = null;
    let cancelled = (0);
    if (get_obj_location(box, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 0)) {
        box.ox = ox , box.oy = oy;
    }
    targetbox = await tipcontainer_gettarget(box, { get value() { return cancelled; }, set value(_v) { cancelled = _v; } });
    if (cancelled) {
        return;
    }
    maybeshopgoods = !((box).where == 3) && await costly_spot(box.ox, box.oy);
    if (await tipcontainer_checks(box, targetbox, (0)) != TIPCHECK_OK) {
        return;
    }
    if (targetbox && await tipcontainer_checks(targetbox, null, (1)) != TIPCHECK_OK) {
        return;
    }
{
        let otmp = null;
        let nobj = null;
        let terse = 0;
        let highdrop = !can_reach_floor((1));
        let altarizing = ((game.level.locations[ox][oy].typ) == ALTAR);
        let cursed_mbag = (((box).otyp == BAG_OF_HOLDING || (box).otyp == BAG_OF_TRICKS) && box.cursed);
        let loss = 0;
        srcheld = ((box).where == 3);
        dstheld = (targetbox && ((targetbox).where == 3));
        if (game.u.uswallow) {
            highdrop = altarizing = (0);
        }
        terse = !(highdrop || altarizing || await costly_spot(box.ox, box.oy));
        box.cknown = 1;
        if (targetbox) {
            await pline("%s into %s.", box.cobj.nobj ? "Objects tumble" : "An object tumbles", await the(await xname(targetbox)));
        } else {
            await pline("%s out%c", box.cobj.nobj ? "Objects spill" : "An object spills", terse ? 58 : 46);
        }
        for (otmp = box.cobj; otmp; otmp = nobj) {
            nobj = otmp.nobj;
            await obj_extract_self(otmp);
            otmp.ox = box.ox , otmp.oy = box.oy;
            if (box.otyp == ICE_BOX) {
                await removed_from_icebox(otmp);
            } else if (cursed_mbag && is_boh_item_gone()) {
                loss += await mbag_item_gone(srcheld, otmp, (0));
                /* abbreviated drop format is no longer appropriate */
                terse = (0);
                continue;
            }
            if (maybeshopgoods) {
                await addtobill(otmp, (0), (0), (1));
                game.iflags.suppress_price++;
            }
            if (targetbox) {
                if (((targetbox).otyp == BAG_OF_HOLDING || (targetbox).otyp == BAG_OF_TRICKS) && mbag_explodes(otmp, 0)) {
                    livelog_printf(2, "just blew up %s bag of holding via tipping", (genders[game.flags.female ? 1 : 0].his));
                    await urgent_pline("As %s %s inside, you are blasted by a magical explosion!", await doname(otmp), await otense(otmp, "tumble"));
                    if (otmp.otyp == BAG_OF_HOLDING) {
                        await do_boh_explosion(otmp, !srcheld);
                    }
                    await obfree(otmp, null);
                    await do_boh_explosion(targetbox, !dstheld);
                    if (dstheld) {
                        await useup(targetbox);
                    } else {
                        await useupf(targetbox, targetbox.quan);
                    }
                    targetbox = null;
                    /* stop tipping; want loop to exit 'normally' */
                    nobj = null;
                    await losehp(d(6, 6), "magical explosion", 0);
                } else {
                    await add_to_container(targetbox, otmp);
                }
            } else if (highdrop) {
                otmp.how_lost = 2;
                await hitfloor(otmp, (1));
            } else {
                if (altarizing) {
                    await doaltarobj(otmp);
                } else if (!terse) {
                    await pline("%s %s to the %s.", await Doname2(otmp), await otense(otmp, "drop"), surface(ox, oy));
                } else {
                    await pline("%s%c", await doname(otmp), nobj ? 44 : 46);
                    game.iflags.last_msg = PLNMSG_OBJNAM_ONLY;
                }
                otmp.how_lost = 2;
                await dropy(otmp);
                /* terse formatting has been interrupted */
                if (game.iflags.last_msg != PLNMSG_OBJNAM_ONLY) {
                    terse = (0);
                }
            }
            if (maybeshopgoods) {
                game.iflags.suppress_price--;
            }
        }
        if (loss) {
            await You("owe %ld %s for lost merchandise.", loss, await currency(loss));
        }
        box.owt = await weight(box);
        if (targetbox) {
            targetbox.owt = await weight(targetbox);
        }
        if (srcheld || dstheld) {
            await encumber_msg();
        }
    }
    if (srcheld || dstheld) {
        update_inventory();
    }
}
/* returns number of containers in object chain; does not recurse into
   containers; skips bags of tricks when they're known */
/* list of objects (invent) */
/* particular object to exclude if found in list */
/* include bag of tricks when not known to be such */
/* ask user for a carried container into which they want box to be emptied;
   cancelled is TRUE if user cancelled the menu pick; hands aren't required
   when tipping to the floor but are when tipping into another container */
export async function tipcontainer_gettarget(box, cancelled) {
    let n = 0;
    let n_conts = 0;
    let win = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let buf = '';
    let pick_list = null;
    let dummyobj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let otmp = null;
    let hands_available = (1);
    let exclude_it = 0;
    let clr = 8;
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    /* lint suppression; only its address matters */
    Object.assign(dummyobj, cg.zeroobj);
    Object.assign(any, cg.zeroany);
    any.a_obj = dummyobj;
    await add_menu(win, nul_glyphinfo, any, 45, 0, 0, clr, "on the floor", 1);
    await add_menu_str(win, "");
    n_conts = 0;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        /* [TODO? vary destination string depending on surface()] */
        if (otmp == box) {
            continue;
        }
        /* skip non-containers; bag of tricks passes Is_container() test,
           only include it if it isn't known to be a bag of tricks */
        if (!((otmp).otyp >= LARGE_BOX && (otmp).otyp <= BAG_OF_TRICKS) || (otmp.otyp == BAG_OF_TRICKS && otmp.dknown && game.objects[otmp.otyp].oc_name_known)) {
            continue;
        }
        if (!n_conts++) {
            hands_available = await u_handsy();
        }
        /* container-to-container tip requires free hands;
           exclude container as possible target when known to be locked */
        exclude_it = !hands_available || (otmp.olocked && otmp.lknown);
        Object.assign(any, cg.zeroany);
        any.a_obj = !exclude_it ? otmp : null;
        buf = sprintf(buf, "%s%s", !exclude_it ? "" : "    ", await doname(otmp));
        await add_menu(win, nul_glyphinfo, any, !exclude_it ? otmp.invlet : 0, 0, 0, clr, buf, 0);
    }
    buf = sprintf(buf, "Where to tip the contents of %s", await doname(box));
    (game.windowprocs.win_end_menu)(win, buf);
    n = await select_menu(win, 1, pick_list);
    (game.windowprocs.win_destroy_nhwindow)(win);
    otmp = null;
    if (pick_list) {
        otmp = pick_list[0].item.a_obj;
        /* PICK_ONE with a preselected item might return 2;
           if so, choose the one that wasn't preselected */
        if (n > 1 && otmp == dummyobj) {
            otmp = pick_list[1].item.a_obj;
        }
        if (otmp == dummyobj) {
            otmp = null;
        }
        free(pick_list);
    }
    cancelled.value = (n == -1);
    return otmp;
}
/* Perform check on box if we can tip it.
   Returns one of TIPCHECK_foo values.
   If allowempty if TRUE, return TIPCHECK_OK instead of TIPCHECK_EMPTY. */
/* container player wants to tip */
/* destination (used here for horn of plenty) */
/* affects result when box is empty */
export async function tipcontainer_checks(box, targetbox, allowempty) {
    if (targetbox && targetbox.otyp == BAG_OF_TRICKS) {
        /* undiscovered bag of tricks is acceptable as a container-to-container
       destination but it can't receive items; it has to be opened in
       preparation so apply it once before even trying to tip source box */
        let seencount = 0;
        await bagotricks(targetbox, (0), { get value() { return seencount; }, set value(_v) { seencount = _v; } });
        /* actually means 'already done' */
        return TIPCHECK_CANNOT;
    }
    if (!box.lknown) {
        /* caveat: this assumes that cknown, lknown, olocked, and otrapped
       fields haven't been overloaded to mean something special for the
       non-standard "container" horn of plenty */
        box.lknown = 1;
        if (((box).where == 3)) {
            update_inventory();
        }
    }
    if (box.olocked) {
        await pline("%s is locked.", upstart(await thesimpleoname(box)));
        return TIPCHECK_LOCKED;
    } else if (box.otrapped) {
        await chest_trap(box, HAND, (0));
        if (game.multi >= 0) {
            nomul(-1);
            game.multi_reason = "tipping a container";
            game.nomovemsg = "";
        }
        return TIPCHECK_TRAPPED;
    } else if (box.otyp == BAG_OF_TRICKS || box.otyp == HORN_OF_PLENTY) {
        let res = TIPCHECK_OK;
        let bag = (box.otyp == BAG_OF_TRICKS);
        let old_spe = box.spe;
        let seen = 0;
        let totseen = 0;
        let maybeshopgoods = (!((box).where == 3) && await costly_spot(box.ox, box.oy));
        let ox = game.u.ux;
        let oy = game.u.uy;
        if (targetbox && ((res = await tipcontainer_checks(targetbox, null, (1))) != TIPCHECK_OK)) {
            return res;
        }
        if (get_obj_location(box, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 0)) {
            box.ox = ox , box.oy = oy;
        }
        if (maybeshopgoods && !box.no_charge) {
            await addtobill(box, (0), (0), (1));
        }
        /* apply this bag/horn until empty or monster/object creation fails
           (if the latter occurs, force the former...) */
        seen = totseen = 0;
        do {
            if (!(bag ? await bagotricks(box, (1), { get value() { return seen; }, set value(_v) { seen = _v; } }) : await hornoplenty(box, (1), targetbox))) {
                break;
            }
            totseen += seen;
        } while (box.spe > 0);
        if (box.spe < old_spe) {
            if (bag && !totseen) {
                await pline("%s", c_common_strings.c_nothing_seems_to_happen);
            }
            /* check_unpaid wants to see a non-zero charge count */
            box.spe = old_spe;
            await check_unpaid_usage(box, (1));
            box.spe = 0;
            box.cknown = 1;
        }
        if (maybeshopgoods && !box.no_charge) {
            await subfrombill(box, await shop_keeper(in_rooms(ox, oy, SHOPBASE)));
        }
        return TIPCHECK_CANNOT;
    } else if (((box).otyp == LARGE_BOX && (box).spe == 1)) {
        let yourbuf = '';
        let empty_it = (0);
        await observe_quantum_cat(box, (1), (1));
        if (!((box).cobj != null)) {
            await pline("%sbox is now empty.", await Shk_Your(yourbuf, box));
        /* evidently a live cat came out */
        /* container type of "large box" is inferred */
        } else {
            empty_it = (1);
        }
        box.cknown = 1;
        return (empty_it || allowempty) ? TIPCHECK_OK : TIPCHECK_EMPTY;
    } else if (!allowempty && !((box).cobj != null)) {
        box.cknown = 1;
        await pline("%s is empty.", upstart(await thesimpleoname(box)));
        return TIPCHECK_EMPTY;
    }
    return TIPCHECK_OK;
}
/*pickup.c*/
/* Neither of the first two cases is expected to happen, since
     * we're only called after multiple classes of objects have been
     * detected, hence multiple objects must be present.
     */
/*
         * Work around a message sequencing issue if Fumbling's periodic
         * timeout is about to kick in:  avoid the combination
         *  |You are back on floor.
         *  |You trip over <object>.  or  You flounder.
         * when the trip is being caused by moving on ice as hero
         * steps off ice onto non-ice.  Defer the back-on-floor part if
         * that is about to happen.
         */
/* no auto-pick if no-pick move, nothing there, or in a pool */
/* even when !flags.mention_decor */
/* multi && !svc.context.run means they are in the middle of some
         * other action, or possibly paralyzed, sleeping, etc.... and they
         * just teleported onto the object.  They shouldn't pick it up.
         */
/*
     * Start the actual pickup process.  This is split into two main
     * sections, the newer menu and the older "traditional" methods.
     * Automatic pickup has been split into its own menu-style routine
     * to make things less confusing.
     */
/* set up callback selector */
/* correct counts, if any given */
/* position may need updating (invisible hero) */
/* check if there's anything else here after auto-pickup is done */
/* calculate 'costly' just once for a given autopickup operation */
/* check for autopickup exceptions */
/* first count the number of eligible items */
/* dotypeinv() supplies gt.this_title to display as initial header;
           intentionally avoid the menu_headings highlight attribute here */
/* stop the menu and revert */
/* this isn't actually possible; fake item representing
                   hero is only included for look here (':'), not pickup,
                   and that's PICK_NONE so we can't get here from there */
/* quit | ESC => cancel, no Auto-select and no 2nd menu */
/* the menu entry description is "Auto-select every relevant item"
           [not sure whether issuing a message here is a good idea...] */
/* override weight consideration for loadstone picked up by anybody
       and for boulder picked up by hero poly'd into a giant; override
       availability of open inventory slot iff not already carrying one */
/* lift regardless of current situation */
/* if we reach here, we're out of slots and already have at least
           one of these, so treat this one more like a normal item
           [this was using simpleonames(obj) for shortest description, but
           that's suboptimal for loadstones because it omits user-assigned
           type name which is something of interest for gray stones] */
/* [exception for gold coins will have to change
                   if silver/copper ones ever get implemented] */
/* if there is some gold here (and we haven't already skipped it),
           we aren't limited by the 52 item limit for it, but caller and
           "grandcaller" aren't prepared to skip stuff and then pickup
           just gold, so the best we can do here is vary the message */
/* process a count before altering/deleting scrolls;
           tricky because being unable to lift full stack imposes an
           implicit count; unliftable ones should be treated as if
           the count excluded them so that they don't change state */
/* couldn't even pick up 1, so effectively untouched */
/* all current callers handle a new object sanely when traversing
           a list; other half of a split will be left as-is and whatever
           already follows 'obj' will still be processed next */
/* obj has either already passed autopick_testobj or we are explicitly
       picking it off the floor, so addinv() will override obj->how_lost;
       otherwise we couldn't pick up a thrown, stolen, or dropped item that
       was split off from a carried stack even while still carrying the
       rest of the stack unless we have at least one free slot available */
/* sets obj->unpaid if necessary */
/* if you're taking a shop item from outside the shop, make shk notice */
/* not skilled enough to reach */
/* at present, can't loot in water even when Underwater;
           can tip underwater, but not when over--or stuck in--lava */
/* if both the untrap and apply_key bits are set, untrap
               attempt will be performed first but we need to set up
               unlocktool in case "check for trap?" is declined */
/* pass ox and oy to avoid direction prompt */
/* if blind and without gloves, attempting to #loot at the
               location of a cockatrice corpse is fatal before asking
               whether to manipulate any containers */
/* Preserve pre-3.3.1 behavior for containers.
         * Adjust this if-block to allow container looting
         * from one square away to change that in the future.
         */
/* n objects: 1/(n+1) chance per object, 1/(n+1) to fall off end */
/* gold might be quivered; dropping would un-wear it, but freeinv()
       expects caller to do that; do so now */
/* the dropped gold might have fallen to lower level */
/* remember closest ordinary chest */
/* Prohibit Amulets in containers; if you allow it, monsters can't
         * steal them.  It also becomes a pain to check to see if someone
         * has the Amulet.  Ditto for the Candelabrum, the Bell and the Book.
         */
/* unwielded, died, rewielded */
/* boxes, boulders, and big statues can't fit into any container */
/* consumes multiple obufs but not enough to overwrite the result */
/* this used to be part of freeinv() */
/* explicitly mention what item is triggering the explosion */
/* did not actually insert obj yet */
/* one bag of holding into another */
/* gold needs this, and freeinv() many lines above may cause
     * the encumbrance to disappear from the status, so just always
     * update status immediately.
     */
/* Remove the object from the list. */
/* update character's gold piece count immediately */
/* non-frozen globs gradually shrink away to nothing */
/* give experience points for releasing live cat; slightly
                   different amount from what is given for "killing" it */
/* 10:current exp; 20:score bonus */
/* give experience points for the death of the cat since
                   that has been finalized by the hero opening the box */
/* 20:current exp; 10:score bonus */
/* preformat the empty-container message */
/* this unintentionally allows user to answer with 'o' or
                   'r'; fortunately, those are already valid choices here */
/* PARTIAL|FULL vs other modes */
/*
     * What-to-do prompt's list of possible actions:
     * always include the look-inside choice (':');
     * include the take-out choice ('o') if container
     * has anything in it or if player doesn't yet know
     * that it's empty (latter can change on subsequent
     * iterations if player picks ':' response);
     * include the put-in choices ('i','s') if hero
     * carries any inventory (including gold) aside from
     * the container itself;
     * include do-both when 'o' is available, even if
     * inventory is empty--taking out could alter that;
     * include do-both-reversed when 'i' is available,
     * even if container is empty--for similar reason;
     * include the next container choice ('n') when
     * relevant, and make it the default;
     * always include the quit choice ('q'), and make
     * it the default if there's no next container;
     * include the help choice (" or ?") if `cmdassist'
     * run-time option is set;
     * (Player can pick any of (o,i,b,r,n,s,?) even when
     * they're not listed among the available actions.)
     *
     * Do what with <the/your/Shk's container>? [:oibrs nq or ?] (q)
     * or
     * <The/Your/Shk's container> is empty.  Do what with it? [:irs nq or ?]
     */
/* couldn't put selected item into container for some
                   reason; might need to undo splitobj() */
/* return value doesn't matter, even if container blew up */
/* special split case also handled by askchain() */
/* split occurred, merge again */
/* pick one container via menu or ... */
/* else pick-from-gi.invent below */
/* either no floor container(s) or 'm' prefix was used to ignore such
       or couldn't tip one or didn't tip any */
/* shop usage message comes after the spill message */
/* anything not covered yet */
/*
     * TODO?
     *  if 'box' is known to be empty or known to be locked, give up
     *  before choosing 'targetbox'.
     */
/* Shop handling:  can't rely on the container's own unpaid
       or no_charge status because contents might differ with it.
       A carried container's contents will be flagged as unpaid
       or not, as appropriate, and need no special handling here.
       Items owned by the hero get sold to the shop without
       confirmation as with other uncontrolled drops.  A floor
       container's contents will be marked no_charge if owned by
       hero, otherwise they're owned by the shop.  By passing
       the contents through shop billing, they end up getting
       treated the same as in the carried case.   We do so one
       item at a time instead of doing whole container at once
       to reduce the chance of exhausting shk's billing capacity. */
/* Terse formatting is
         * "Objects spill out: obj1, obj2, obj3, ..., objN."
         * If any other messages intervene between objects, we revert to
         * "ObjK drops to the floor.", "ObjL drops to the floor.", &c.
         */
/* resume rotting for corpse */
/* explicitly mention what item is triggering explosion */
/* if putting one bag of holding into another, first
                       blow up the one going in, then (below) blow up the
                       one it's going into */
/* always delete the item which triggered the explosion */
/* [assumes targetbox is carried, otherwise shop bill
                       handling becomes necessary here] */
/* might break or fall down stairs; handles altars itself */
/* magic bag lost some shop goods */
/* mbag_item_gone() doesn't update this */
/* tip to floor does not require free hands */
/* jumping the gun slightly; hope that's ok */
/* we're not reaching inside but we're still handling it... */
