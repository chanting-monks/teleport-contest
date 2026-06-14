/* NetHack 5.0	lock.c	$NHDT-Date: 1741793439 2025/03/12 07:30:39 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.145 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
/* occupation callbacks */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_hear, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcat } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { is_magic_key, touch_artifact } from './artifact.js';
import { acurr, acurrstr, exercise } from './attrib.js';
import { cmdq_add_dir, cmdq_add_ec, get_adjacent_loc, getdir, isok, set_occupation, yn_function } from './cmd.js';
import { is_db_wall, is_drawbridge_wall, is_lava, is_pool } from './dbridge.js';
import { c_common_strings, cg, ynchars, ynqchars } from './decl.js';
import { canseemon, feel_location, feel_newsym, map_invisible, newsym, sensemon } from './display.js';
import { Some_Monnam, hliquid, mon_nam } from './do_name.js';
import { dokick } from './dokick.js';
import { on_level, update_mapseen_for } from './dungeon.js';
import { is_fainted } from './eat.js';
import { can_reach_floor, cant_reach_floor } from './engrave.js';
import { in_rooms } from './hack.js';
import { dist2, s_suffix } from './hacklib.js';
import { currency, delobj, stackobj, useup } from './invent.js';
import { costly_alteration, obj_extract_self, place_object, start_corpse_timeout } from './mkobj.js';
import { wake_nearby, wake_nearto } from './mon.js';
import { closed_door, mb_trapped } from './monmove.js';
import { ART_ORB_OF_DETECTION, A_CON, A_DEX, A_STR, A_WIS, BLINDED, CHEST, CONFUSION, CORPSE, COST_BRKLCK, CQ_CANNED, CREDIT_CARD, DEAF, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, FINGER, FLESH, GLASS, ICE_BOX, LARGE_BOX, LEVITATION, LOCK_PICK, M_AP_FURNITURE, M_AP_OBJECT, PAPER, PASSES_WALLS, PM_ORACLE, PM_ROGUE, PM_WIZARD, POTION_CLASS, PROT_FROM_SHAPE_CHANGERS, P_DAGGER, P_FLAIL, P_LANCE, P_NONE, P_PICK_AXE, P_SABER, ROCK_CLASS, SDOOR, SHOPBASE, SKELETON_KEY, SPE_FORCE_BOLT, SPE_KNOCK, SPE_POLYMORPH, SPE_WIZARD_LOCK, STUNNED, S_hcdoor, S_vcdoor, TOOL_CLASS, TT_PIT, VEGGY, WAND_CLASS, WAN_LOCKING, WAN_OPENING, WAN_POLYMORPH, WAN_STRIKING, WAX, WEAPON_CLASS, WOOD } from './nh-constants.js';
import { An, an, ansimpleoname, doname, safe_qbuf, simple_typename, singular, the, xname, yname, ysimple_name } from './objnam.js';
import { container_at, doloot } from './pickup.js';
import { There, set_msg_xy } from './pline.js';
import { bottlename, potionbreathe } from './potion.js';
import { is_quest_artifact } from './questpgr.js';
import { rn2, rnl } from './rnd.js';
import { add_damage, costly_spot, obfree, shop_keeper, stolen_value } from './shk.js';
import { maybe_absorb_item } from './steal.js';
import { b_trapped, chest_trap, could_untrap, t_at, unconscious, untrap } from './trap.js';
import { stumble_onto_mimic } from './uhitm.js';
import { block_point, recalc_block_point, unblock_point, vision_recalc } from './vision.js';
import { obj_resists } from './zap.js';

export function picking_lock(x, y) {
    if (game.occupation == picklock) {
        x.value = game.u.ux + game.u.dx;
        y.value = game.u.uy + game.u.dy;
        return (1);
    } else {
        x.value = y.value = 0;
        return (0);
    }
}
export function picking_at(x, y) {
    return (game.occupation == picklock && game.xlock.door == game.level.locations[x][y]);
}
/* produce an occupation string appropriate for the current activity */
const __lock_action_actions = ["unlocking the door", "unlocking the chest", "unlocking the box", "picking the lock"];
export function lock_action() {
    if (game.xlock.door && !(game.xlock.door.flags & 8)) {
        return __lock_action_actions[0] + 2;
    } else if (game.xlock.box && !game.xlock.box.olocked) {
        return game.xlock.box.otyp == CHEST ? __lock_action_actions[1] + 2 : __lock_action_actions[2] + 2;
    /* "unlocking"+2 == "locking" */
    /* if the target is currently unlocked, we're trying to lock it now */
    /* otherwise we're trying to unlock it */
    } else if (game.xlock.picktyp == LOCK_PICK) {
        return __lock_action_actions[3];
    } else if (game.xlock.picktyp == CREDIT_CARD) {
        return __lock_action_actions[3];
    } else if (game.xlock.door) {
        return __lock_action_actions[0];
    } else if (game.xlock.box) {
        return game.xlock.box.otyp == CHEST ? __lock_action_actions[1] : __lock_action_actions[2];
    } else {
        return __lock_action_actions[3];
    }
}
/* try to open/close a lock */
export async function picklock() {
    if (game.xlock.box) {
        if (game.xlock.box.where != 1 || game.xlock.box.ox != game.u.ux || game.xlock.box.oy != game.u.uy) {
            return ((game.xlock.usedtime = 0));
        }
    } else {
        if (game.xlock.door != (game.level.locations[game.u.ux + game.u.dx][game.u.uy + game.u.dy])) {
            return ((game.xlock.usedtime = 0));
        }
        switch (game.xlock.door.flags) {
            case 0:
                await pline("This doorway has no door.");
                return ((game.xlock.usedtime = 0));
            case 2:
                await You("cannot lock an open door.");
                return ((game.xlock.usedtime = 0));
            case 1:
                await pline("This door is broken.");
                return ((game.xlock.usedtime = 0));
        }
    }
    if (game.xlock.usedtime++ >= 50 || (((game.youmonst.data).mflags1 & 8192) != 0)) {
        await You("give up your attempt at %s.", lock_action());
        await exercise(A_DEX, (1));
        return ((game.xlock.usedtime = 0));
    }
    if (rn2(100) >= game.xlock.chance) {
        return 1;
    }
    if ((!game.xlock.door ? game.xlock.box.otrapped : (game.xlock.door.flags & 16) != 0) && game.xlock.magic_key) {
        /* using the Master Key of Thievery finds traps if its bless/curse
       state is adequate (non-cursed for rogues, blessed for others;
       checked when setting up 'xlock') */
        /* less effort needed next time */
        game.xlock.chance += 20;
        if (!game.xlock.door) {
            if (!game.xlock.box.tknown) {
                await You("find a trap!");
            }
            game.xlock.box.tknown = 1;
        }
        if (await yn_function("Do you want to try to disarm it?", ynchars, 110, (1)) == 121) {
            let what = null;
            let alreadyunlocked = 0;
            if (game.xlock.door) {
                /* disarming while using magic key always succeeds */
                game.xlock.door.flags &= ~16;
                what = "door";
                alreadyunlocked = !(game.xlock.door.flags & 8);
            } else {
                game.xlock.box.otrapped = 0;
                game.xlock.box.tknown = 0;
                what = (game.xlock.box.otyp == CHEST) ? "chest" : "box";
                alreadyunlocked = !game.xlock.box.olocked;
            }
            await You("succeed in disarming the trap.  The %s is still %slocked.", what, alreadyunlocked ? "un" : "");
            await exercise(A_WIS, (1));
        } else {
            await You("stop %s.", lock_action());
            await exercise(A_WIS, (0));
        }
        return ((game.xlock.usedtime = 0));
    }
    await You("succeed in %s.", lock_action());
    if (game.xlock.door) {
        if (game.xlock.door.flags & 16) {
            await b_trapped("door", FINGER);
            game.xlock.door.flags = 0;
            unblock_point(game.u.ux + game.u.dx, game.u.uy + game.u.dy);
            if (in_rooms(game.u.ux + game.u.dx, game.u.uy + game.u.dy, SHOPBASE)) {
                await add_damage(game.u.ux + game.u.dx, game.u.uy + game.u.dy, 400);
            }
            await newsym(game.u.ux + game.u.dx, game.u.uy + game.u.dy);
        } else if (game.xlock.door.flags & 8) {
            game.xlock.door.flags = 4;
        } else {
            game.xlock.door.flags = 8;
        }
    } else {
        game.xlock.box.olocked = !game.xlock.box.olocked;
        game.xlock.box.lknown = 1;
        if (game.xlock.box.otrapped) {
            await chest_trap(game.xlock.box, FINGER, (0));
        }
    }
    await exercise(A_DEX, (1));
    return ((game.xlock.usedtime = 0));
}
export async function breakchestlock(box, destroyit) {
    if (!destroyit) {
        /* bill for the box but not for its contents */
        let hide_contents = box.cobj;
        box.cobj = null;
        await costly_alteration(box, COST_BRKLCK);
        box.cobj = hide_contents;
        box.olocked = 0;
        box.obroken = 1;
        box.lknown = 1;
    } else {
        /* #force has destroyed this box (at <u.ux,u.uy>) */
        let otmp = null;
        let shkp = (game.u.ushops && await costly_spot(game.u.ux, game.u.uy)) ? await shop_keeper(game.u.ushops) : null;
        let costly = (shkp != null);
        let peaceful_shk = costly && shkp.mpeaceful;
        let loss = 0;
        await pline("In fact, you've totally destroyed %s.", await the(await xname(box)));
        while ((otmp = box.cobj) != null) {
            await obj_extract_self(otmp);
            if (!rn2(3) || otmp.oclass == POTION_CLASS) {
                await chest_shatter_msg(otmp);
                if (costly) {
                    loss += await stolen_value(otmp, game.u.ux, game.u.uy, peaceful_shk, (1));
                }
                if (otmp.quan == 1) {
                    await obfree(otmp, null);
                    continue;
                }
                await useup(otmp);
            }
            if (box.otyp == ICE_BOX && otmp.otyp == CORPSE) {
                otmp.age = game.moves - otmp.age;
                await start_corpse_timeout(otmp);
            }
            await place_object(otmp, game.u.ux, game.u.uy);
            await stackobj(otmp);
        }
        if (costly) {
            loss += await stolen_value(box, game.u.ux, game.u.uy, peaceful_shk, (1));
        }
        if (loss) {
            await You("owe %ld %s for objects destroyed.", loss, await currency(loss));
        }
        await delobj(box);
    }
}
/* try to force a locked chest */
export async function forcelock() {
    if ((game.xlock.box.ox != game.u.ux) || (game.xlock.box.oy != game.u.uy)) {
        return ((game.xlock.usedtime = 0));
    }
    if (game.xlock.usedtime++ >= 50 || !game.uwep || (((game.youmonst.data).mflags1 & 8192) != 0)) {
        await You("give up your attempt to force the lock.");
        if (game.xlock.usedtime >= 50) {
            await exercise((game.xlock.picktyp) ? A_DEX : A_STR, (1));
        }
        return ((game.xlock.usedtime = 0));
    }
    if (game.xlock.picktyp) {
        if (rn2(1000 - game.uwep.spe) > (992 - ((game.uwep).oeroded > (game.uwep).oeroded2 ? (game.uwep).oeroded : (game.uwep).oeroded2) * 10) && !game.uwep.cursed && !obj_resists(game.uwep, 0, 99)) {
            await pline("%sour %s broke!", (game.uwep.quan > 1) ? "One of y" : "Y", await xname(game.uwep));
            await useup(game.uwep);
            await You("give up your attempt to force the lock.");
            await exercise(A_DEX, (1));
            return ((game.xlock.usedtime = 0));
        }
    } else {
        await wake_nearby((0));
    }
    if (rn2(100) >= game.xlock.chance) {
        return 1;
    }
    await You("succeed in forcing the lock.");
    await exercise(game.xlock.picktyp ? A_DEX : A_STR, (1));
    await breakchestlock(game.xlock.box, (!game.xlock.picktyp && !rn2(3)));
    /* lock-picking context is no longer valid */
    reset_pick();
    return 0;
}
export function reset_pick() {
    game.xlock.usedtime = game.xlock.chance = game.xlock.picktyp = 0;
    game.xlock.magic_key = (0);
    game.xlock.door = null;
    /* A lock is made only for the honest man, the thief will break it. */
    game.xlock.box = null;
}
/* level change or object deletion; context may no longer be valid */
/* passed from obfree() */
export function maybe_reset_pick(container) {
    /*
     * If a specific container, only clear context if it is for that
     * particular container (which is being deleted).  Other stuff on
     * the current dungeon level remains valid.
     * However if 'container' is Null, clear context if not carrying
     * gx.xlock.box (which might be Null if context is for a door).
     * Used for changing levels, where a floor container or a door is
     * being left behind and won't be valid on the new level but a
     * carried container will still be.  There might not be any context,
     * in which case redundantly clearing it is harmless.
     */
    if (container ? (container == game.xlock.box) : (!game.xlock.box || !((game.xlock.box).where == 3))) {
        reset_pick();
    }
}
/* pick a tool for autounlock */
/* True: key, pick, or card; False: key or pick */
export function autokey(opening) {
    let o = null;
    let key = null;
    let pick = null;
    let card = null;
    let akey = null;
    let apick = null;
    let acard = null;
    /* mundane item or regular artifact or own role's quest artifact */
    key = pick = card = null;
    /* other role's quest artifact (Rogue's Key or Tourist's Credit Card) */
    akey = apick = acard = null;
    for (o = game.invent; o; o = o.nobj) {
        if (((o).oartifact >= ART_ORB_OF_DETECTION) && !is_quest_artifact(o)) {
            switch (o.otyp) {
                case SKELETON_KEY:
                    if (!akey) {
                        akey = o;
                    }
                    /* else already closed and locked */
                    /* striking: continue door handling below */
                    break;
                case LOCK_PICK:
                    if (!apick) {
                        apick = o;
                    }
                    break;
                case CREDIT_CARD:
                    if (!acard) {
                        acard = o;
                    }
                    break;
                default:
                    break;
            }
        } else {
            switch (o.otyp) {
                case SKELETON_KEY:
                    if (!key || is_magic_key(game.youmonst, o)) {
                        key = o;
                    }
                    break;
                case LOCK_PICK:
                    if (!pick) {
                        pick = o;
                    }
                    break;
                case CREDIT_CARD:
                    if (!card) {
                        card = o;
                    }
                    break;
                default:
                    break;
            }
        }
    }
    if (!opening) {
        card = acard = null;
    }
    /* only resort to other role's quest artifact if no other choice */
    if (!key && !pick && !card) {
        key = akey;
    }
    if (!pick && !card) {
        pick = apick;
    }
    if (!card) {
        card = acard;
    }
    return key ? key : pick ? pick : card ? card : null;
}
/* for doapply(); if player gives a direction or resumes an interrupted
   previous attempt then it usually costs hero a move even if nothing
   ultimately happens; when told "can't do that" before being asked for
   direction or player cancels with ESC while giving direction, it doesn't */
/* time passes */
/* no time passes */
/* player is applying a key, lock pick, or credit card */
/* coordinates of door/container, for autounlock:
                             * doesn't prompt for direction if these are set */
/* container, for autounlock */
let __pick_lock_no_longer = "Unfortunately, you can no longer %s %s.";
__nh_register_static(() => { __pick_lock_no_longer = "Unfortunately, you can no longer %s %s."; });
export async function pick_lock(pick, rx, ry, container) {
    let dummypick = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let picktyp = 0;
    let c = 0;
    let ch = 0;
    let cc = { x: 0, y: 0 };
    let door = null;
    let otmp = null;
    let qbuf = '';
    let autounlock = (rx != 0 || container != (null));
    if (!pick) {
        /* 'pick' might be Null [called by do_loot_cont() for AUTOUNLOCK_UNTRAP] */
        Object.assign(dummypick, cg.zeroobj);
        /* pick->otyp will be STRANGE_OBJECT */
        pick = dummypick;
    }
    picktyp = pick.otyp;
    if (game.xlock.usedtime && picktyp == game.xlock.picktyp) {
        if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
            /* check whether we're resuming an interrupted previous attempt */
            let what = (picktyp == LOCK_PICK) ? "pick" : "key";
            if (picktyp == CREDIT_CARD) {
                what = "card";
            }
            await pline(__pick_lock_no_longer, "hold the", what);
            reset_pick();
            /* decided against all boxes */
            return (-1);
        } else if (game.u.uswallow || (game.xlock.box && !can_reach_floor((1)))) {
            await pline(__pick_lock_no_longer, "reach the", "lock");
            reset_pick();
            return (-1);
        } else {
            let action = lock_action();
            await You("resume your attempt at %s.", action);
            game.xlock.magic_key = is_magic_key(game.youmonst, pick);
            set_occupation(picklock, action, 0);
            return 1;
        }
    }
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        await You_cant("hold %s -- you have no hands!", await doname(pick));
        return 0;
    } else if (game.u.uswallow) {
        await You_cant("%sunlock %s.", (picktyp == CREDIT_CARD) ? "" : "lock or ", await mon_nam(game.u.ustuck));
        return 0;
    }
    if (pick != dummypick && picktyp != SKELETON_KEY && picktyp != LOCK_PICK && picktyp != CREDIT_CARD) {
        await impossible("picking lock with object %d?", picktyp);
        return 0;
    }
    ch = 0;
    if (rx != 0) {
        /* autounlock; caller has provided coordinates */
        cc.x = rx;
        cc.y = ry;
    } else if (!await get_adjacent_loc(null, "Invalid location!", game.u.ux, game.u.uy, cc)) {
        return 0;
    }
    if (((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
        /* pick lock on a container */
        let verb = null;
        let qsfx = '';
        let it = 0;
        let count = 0;
        if (game.u.dz < 0 && !autounlock) {
            await There("isn't any sort of lock up %s.", ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) ? "here" : "there");
            return (-1);
        } else if (is_lava(game.u.ux, game.u.uy)) {
            await pline("Doing that would probably melt %s.", await yname(pick));
            return (-1);
        } else if (is_pool(game.u.ux, game.u.uy) && !(game.u.uinwater)) {
            await pline_The("%s has no lock.", hliquid("water"));
            return (-1);
        }
        count = 0;
        /* in case there are no boxes here */
        c = 110;
        for (otmp = game.level.objects[cc.x][cc.y]; otmp; otmp = otmp.v.v_nexthere) {
            /* autounlock on boxes: only the one that was just discovered to
               be locked; don't include any other boxes which might be here */
            if (autounlock && otmp != container) {
                continue;
            }
            if (((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST)) {
                ++count;
                if (!can_reach_floor((1))) {
                    await You_cant("reach %s from up here.", await the(await xname(otmp)));
                    return (-1);
                }
                it = 0;
                if (otmp.obroken) {
                    verb = "fix";
                } else if (!otmp.olocked) {
                    verb = "lock" , it = 1;
                } else if (picktyp != LOCK_PICK) {
                    verb = "unlock" , it = 1;
                } else {
                    verb = "pick";
                }
                if (autounlock && (game.flags.autounlock & 1) != 0 && await could_untrap((0), (1)) && (c = otmp.tknown ? (otmp.otrapped ? 121 : 110) : await yn_function(await safe_qbuf(qbuf, "Check ", " for a trap?", otmp, yname, ysimple_name, "this"), ynqchars, 113, (1))) != 110) {
                    if (c == 113) {
                        /* this used to return PICKLOCK_LEARNED_SOMETHING but the
               #open command doesn't use a turn for similar situation */
                        return 0;
                    }
                    await untrap((0), 0, 0, otmp);
                    /* note: for !autounlock, apply already did touch check */
                    return 1;
                } else if (autounlock && (game.flags.autounlock & 2) != 0) {
                    c = 113;
                    if (pick != dummypick) {
                        qbuf = sprintf(qbuf, "Unlock it with %s?", await yname(pick));
                        c = await yn_function(qbuf, ynqchars, 113, (1));
                    }
                    if (c != 121) {
                        return 0;
                    }
                } else {
                    qsfx = sprintf(qsfx, " here; %s %s?", verb, it ? "it" : "its lock");
                    await safe_qbuf(qbuf, "There is ", qsfx, otmp, doname, ansimpleoname, "a box");
                    otmp.lknown = 1;
                    c = await yn_function(qbuf, ynqchars, 113, (1));
                    if (c == 113) {
                        return 0;
                    }
                    if (c == 110) {
                        continue;
                    }
                }
                if (otmp.obroken) {
                    await You_cant("fix its broken lock with %s.", await ansimpleoname(pick));
                    return (-1);
                } else if (picktyp == CREDIT_CARD && !otmp.olocked) {
                    await You_cant("do that with %s.", await an(await simple_typename(picktyp)));
                    return (-1);
                } else if (autounlock && !await touch_artifact(pick, game.youmonst)) {
                    return 1;
                }
                switch (picktyp) {
                    case CREDIT_CARD:
                        ch = (acurr(A_DEX)) + 20 * (game.urole.mnum == (PM_ROGUE));
                        break;
                    case LOCK_PICK:
                        ch = 4 * (acurr(A_DEX)) + 25 * (game.urole.mnum == (PM_ROGUE));
                        break;
                    case SKELETON_KEY:
                        ch = 75 + (acurr(A_DEX));
                        break;
                    default:
                        ch = 0;
                }
                if (otmp.cursed) {
                    ch = Math.trunc(ch / 2);
                }
                game.xlock.box = otmp;
                game.xlock.door = null;
                break;
            }
        }
        /* not the hero's location; pick the lock in an adjacent door */
        if (c != 121) {
            if (!count) {
                await There("doesn't seem to be any sort of lock here.");
            }
            return (-1);
        }
    } else {
        let mtmp = null;
        if (game.u.utrap && game.u.utraptype == TT_PIT) {
            await You_cant("reach over the edge of the pit.");
            return 0;
        }
        door = game.level.locations[cc.x][cc.y];
        mtmp = (game.level.monsters[cc.x][cc.y]);
        if (mtmp && canseemon(mtmp) && ((mtmp).m_ap_type & 7) != M_AP_FURNITURE && ((mtmp).m_ap_type & 7) != M_AP_OBJECT) {
            if (picktyp == CREDIT_CARD && (mtmp.isshk || mtmp.data == game.mons[PM_ORACLE])) {
                ;
                await verbalize("No checks, no credit, no problem.");
            } else {
                await pline("I don't think %s would appreciate that.", await mon_nam(mtmp));
            }
            return (-1);
        } else if (mtmp && (((mtmp).m_ap_type & 7) == M_AP_FURNITURE && ((mtmp).mappearance == S_hcdoor || (mtmp).mappearance == S_vcdoor))) {
            await stumble_onto_mimic(mtmp);
            await maybe_absorb_item(mtmp, pick, 50, 10);
            return (-1);
        }
        if (!((door.typ) == DOOR)) {
            let res = 0;
            let oldglyph = door.glyph;
            let oldlastseentyp = await update_mapseen_for(cc.x, cc.y);
            await feel_location(cc.x, cc.y);
            if (door.glyph != oldglyph || game.lastseentyp[cc.x][cc.y] != oldlastseentyp) {
                res = (-1);
            }
            if (is_drawbridge_wall(cc.x, cc.y) >= 0) {
                await You("%s no lock on the drawbridge.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "see");
            } else {
                await You("%s no door there.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "see");
            }
            return res;
        }
        switch (door.flags) {
            case 0:
                await pline("This doorway has no door.");
                return (-1);
            case 2:
                await You("cannot lock an open door.");
                return (-1);
            case 1:
                await pline("This door is broken.");
                return (-1);
            default:
                if ((game.flags.autounlock & 1) != 0 && await could_untrap((0), (0)) && (c = await yn_function("Check this door for a trap?", ynqchars, 113, (1))) != 110) {
                    if (c == 113) {
                        return 0;
                    }
                    await untrap((0), cc.x, cc.y, null);
                    return 1;
                }
                if (picktyp == CREDIT_CARD && !(door.flags & 8)) {
                    await You_cant("lock a door with a credit card.");
                    return (-1);
                }
                qbuf = sprintf(qbuf, "%s it%s%s?", (door.flags & 8) ? "Unlock" : "Lock", autounlock ? " with " : "", autounlock ? await yname(pick) : "");
                c = await yn_function(qbuf, ynqchars, 113, (1));
                if (c != 121) {
                    return 0;
                }
                if (autounlock && !await touch_artifact(pick, game.youmonst)) {
                    return 1;
                }
                switch (picktyp) {
                    case CREDIT_CARD:
                        ch = 2 * (acurr(A_DEX)) + 20 * (game.urole.mnum == (PM_ROGUE));
                        break;
                    case LOCK_PICK:
                        ch = 3 * (acurr(A_DEX)) + 30 * (game.urole.mnum == (PM_ROGUE));
                        break;
                    case SKELETON_KEY:
                        ch = 70 + (acurr(A_DEX));
                        break;
                    default:
                        ch = 0;
                }
                game.xlock.door = door;
                game.xlock.box = null;
        }
    }
    game.context.move = 0;
    game.xlock.chance = ch;
    game.xlock.picktyp = picktyp;
    game.xlock.magic_key = is_magic_key(game.youmonst, pick);
    game.xlock.usedtime = 0;
    set_occupation(picklock, lock_action(), 0);
    return 1;
}
/* is hero wielding a weapon that can #force? */
export function u_have_forceable_weapon() {
    if (!game.uwep || ((game.uwep.oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)) ? (game.objects[game.uwep.otyp].oc_subtyp < P_DAGGER || game.objects[game.uwep.otyp].oc_subtyp == P_FLAIL || game.objects[game.uwep.otyp].oc_subtyp > P_LANCE) : game.uwep.oclass != ROCK_CLASS)) {
        return (0);
    }
    return (1);
}
/* the #force command - try to force a chest with your weapon */
export async function doforce() {
    let otmp = null;
    let c = 0;
    let picktyp = 0;
    let qbuf = '';
    if (game.u.uswallow) {
        await You_cant("force anything from inside here.");
        return 0;
    }
    if (!u_have_forceable_weapon()) {
        let use_plural = game.uwep && game.uwep.quan > 1;
        await You_cant("force anything %s weapon%s.", !game.uwep ? "when not wielding a" : (game.uwep.oclass != WEAPON_CLASS && !((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)) ? (use_plural ? "without proper" : "without a proper") : (use_plural ? "with those" : "with that"), use_plural ? "s" : "");
        return 0;
    }
    if (!can_reach_floor((1))) {
        await cant_reach_floor(game.u.ux, game.u.uy, (0), (1), (0));
        return 0;
    }
    picktyp = (game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_DAGGER && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER) && !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp == P_PICK_AXE);
    if (game.xlock.usedtime && game.xlock.box && picktyp == game.xlock.picktyp) {
        await You("resume your attempt to force the lock.");
        set_occupation(forcelock, "forcing the lock", 0);
        return 1;
    }
    game.xlock.box = null;
    for (otmp = game.level.objects[game.u.ux][game.u.uy]; otmp; otmp = otmp.v.v_nexthere) {
        if (((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST)) {
            if (otmp.obroken || !otmp.olocked) {
                /* force doname() to omit known "broken" or "unlocked"
                   prefix so that the message isn't worded redundantly;
                   since we're about to set lknown, there's no need to
                   remember and then reset its current value */
                otmp.lknown = 0;
                await There("is %s here, but its lock is already %s.", await doname(otmp), otmp.obroken ? "broken" : "unlocked");
                otmp.lknown = 1;
                continue;
            }
            await safe_qbuf(qbuf, "There is ", " here; force its lock?", otmp, doname, ansimpleoname, "a box");
            otmp.lknown = 1;
            c = await yn_function(qbuf, ynqchars, 113, (1));
            if (c == 113) {
                return 0;
            }
            if (c == 110) {
                continue;
            }
            if (picktyp) {
                await You("force %s into a crack and pry.", await yname(game.uwep));
            } else {
                await You("start bashing it with %s.", await yname(game.uwep));
            }
            game.xlock.box = otmp;
            game.xlock.chance = game.objects[game.uwep.otyp].oc_wldam * 2;
            game.xlock.picktyp = picktyp;
            game.xlock.magic_key = (0);
            game.xlock.usedtime = 0;
            break;
        }
    }
    if (game.xlock.box) {
        set_occupation(forcelock, "forcing the lock", 0);
    } else {
        await You("decide not to force the issue.");
    }
    return 1;
}
export async function stumble_on_door_mimic(x, y) {
    let mtmp = null;
    if ((mtmp = (game.level.monsters[x][y])) && (((mtmp).m_ap_type & 7) == M_AP_FURNITURE && ((mtmp).mappearance == S_hcdoor || (mtmp).mappearance == S_vcdoor)) && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
        await stumble_onto_mimic(mtmp);
        return (1);
    }
    return (0);
}
/* the #open command - try to open a door */
export async function doopen() {
    return await doopen_indir(0, 0);
}
/* try to open a door in direction u.dx/u.dy */
export async function doopen_indir(x, y) {
    let cc = { x: 0, y: 0 };
    let door = null;
    let portcullis = 0;
    let dirprompt = null;
    let res = 0;
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        await You_cant("open anything -- you have no hands!");
        return 0;
    }
    /* have get_adjacent_loc() -> getdir() use default */
    dirprompt = null;
    if (game.u.utrap && game.u.utraptype == TT_PIT && container_at(game.u.ux, game.u.uy, (0))) {
        dirprompt = "Open where? [.>]";
    }
    if (x > 0 && y >= 0) {
        /* nonzero <x,y> is used when hero in amorphous form tries to
           flow under a closed door at <x,y>; the test here was using
           'y > 0' but that would give incorrect results if doors are
           ever allowed to be placed on the top row of the map */
        cc.x = x;
        cc.y = y;
    } else if (!await get_adjacent_loc(dirprompt, null, game.u.ux, game.u.uy, cc)) {
        return 0;
    }
    /* open at yourself/up/down: switch to loot unless there is a closed
       door here (possible with Passes_walls) and direction isn't 'down' */
    if (((cc.x) == game.u.ux && (cc.y) == game.u.uy) && (game.u.dz > 0 || !closed_door(game.u.ux, game.u.uy))) {
        return await doloot();
    }
    if (game.u.utrap && game.u.utraptype == TT_PIT) {
        await You_cant("reach over the edge of the pit.");
        return 0;
    }
    if (await stumble_on_door_mimic(cc.x, cc.y)) {
        return 1;
    }
    /* when choosing a direction is impaired, use a turn
       regardless of whether a door is successfully targeted */
    if (game.u.uprops[CONFUSION].intrinsic || game.u.uprops[STUNNED].intrinsic) {
        res = 1;
    }
    door = game.level.locations[cc.x][cc.y];
    portcullis = (is_drawbridge_wall(cc.x, cc.y) >= 0);
/* this used to be 'if (Blind)' but using a key skips that so we do too */
{
        let oldglyph = door.glyph;
        let oldlastseentyp = await update_mapseen_for(cc.x, cc.y);
        await newsym(cc.x, cc.y);
        if (door.glyph != oldglyph || game.lastseentyp[cc.x][cc.y] != oldlastseentyp) {
            res = 1;
        }
    }
    if (portcullis || !((door.typ) == DOOR)) {
        /* closed portcullis or spot that opened bridge would span */
        if (is_db_wall(cc.x, cc.y) || door.typ == DRAWBRIDGE_UP) {
            await There("is no obvious way to open the drawbridge.");
        } else if (portcullis || door.typ == DRAWBRIDGE_DOWN) {
            await pline_The("drawbridge is already open.");
        } else if (container_at(cc.x, cc.y, (1))) {
            await pline("%s like something lootable over there.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "Feels" : "Seems");
        } else {
            await You("%s no door there.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "see");
        }
        return res;
    }
    if (!(door.flags & 4)) {
        let mesg = null;
        let locked = (0);
        switch (door.flags) {
            case 1:
                mesg = " is broken";
                break;
            case 0:
                mesg = "way has no door";
                break;
            case 2:
                mesg = " is already open";
                break;
            default:
                mesg = " is locked";
                locked = (1);
                break;
        }
        /* door is known to be CLOSED */
        set_msg_xy(cc.x, cc.y);
        await pline("This door%s.", mesg);
        if (locked && game.flags.autounlock) {
            let unlocktool = null;
            /* should already be 0 since hero moved toward door */
            game.u.dz = 0;
            if ((game.flags.autounlock & 2) != 0 && (unlocktool = autokey((1))) != null) {
                res = await pick_lock(unlocktool, cc.x, cc.y, null) ? 1 : 0;
            } else if ((game.flags.autounlock & 4) != 0 && !game.u.usteed && await yn_function("Kick it?", ynqchars, 113, (1)) == 121) {
                /* kicking is different when mounted */
                cmdq_add_ec(CQ_CANNED, dokick);
                cmdq_add_dir(CQ_CANNED, sgn(cc.x - game.u.ux), sgn(cc.y - game.u.uy), 0);
                /* this was 'ECMD_TIME', but time shouldn't elapse until
                   the canned kick takes place */
                res = 0;
            }
        }
        return res;
    }
    if (((game.youmonst.data).msize < 1)) {
        await pline("You're too small to pull the door open.");
        return res;
    }
    if (rnl(20) < Math.trunc(((acurrstr()) + (acurr(A_DEX)) + (acurr(A_CON))) / 3)) {
        set_msg_xy(cc.x, cc.y);
        await pline_The("door opens.");
        if (door.flags & 16) {
            await b_trapped("door", FINGER);
            door.flags = 0;
            if (in_rooms(cc.x, cc.y, SHOPBASE)) {
                await add_damage(cc.x, cc.y, 400);
            }
        } else {
            door.flags = 2;
        }
        await feel_newsym(cc.x, cc.y);
        /* vision: new see through there */
        recalc_block_point(cc.x, cc.y);
    } else {
        await exercise(A_STR, (1));
        set_msg_xy(cc.x, cc.y);
        await pline_The("door resists!");
    }
    return 1;
}
export async function obstructed(x, y, quietly) {
    let mtmp = (game.level.monsters[x][y]);
    if (mtmp && ((mtmp).m_ap_type & 7) != M_AP_FURNITURE) {
        if (((mtmp).m_ap_type & 7) == M_AP_OBJECT) {
            if (!quietly) {
                await pline("%s's in the way.", c_common_strings.c_Something);
            }
            return (1);
        }
        if (!quietly) {
            let Mn = await Some_Monnam(mtmp);
            if ((mtmp.mx != x || mtmp.my != y) && (canseemon(mtmp) || sensemon(mtmp))) {
                Mn = strcat(s_suffix(Mn), " tail");
            }
            await pline("%s blocks the way!", Mn);
        }
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            await map_invisible(x, y);
        }
        return (1);
    }
    if ((game.level.objects[x][y] != null)) {
        objhere: {
        }
        if (!quietly) {
            await pline("%s's in the way.", c_common_strings.c_Something);
        }
        return (1);
    }
    return (0);
}
/* the #close command - try to close a door */
export async function doclose() {
    let x = 0;
    let y = 0;
    let door = null;
    let portcullis = 0;
    let res = 0;
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        await You_cant("close anything -- you have no hands!");
        return 0;
    }
    if (game.u.utrap && game.u.utraptype == TT_PIT) {
        await You_cant("reach over the edge of the pit.");
        return 0;
    }
    if (!await getdir(null)) {
        return 2;
    }
    x = game.u.ux + game.u.dx;
    y = game.u.uy + game.u.dy;
    if (((x) == game.u.ux && (y) == game.u.uy) && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
        await You("are in the way!");
        return 1;
    }
    if (!isok(x, y)) {
        await You("%s no door there.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "see");
        return res;
    }
    if (await stumble_on_door_mimic(x, y)) {
        return 1;
    }
    if (game.u.uprops[CONFUSION].intrinsic || game.u.uprops[STUNNED].intrinsic) {
        res = 1;
    }
    door = game.level.locations[x][y];
    portcullis = (is_drawbridge_wall(x, y) >= 0);
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        let oldglyph = door.glyph;
        let oldlastseentyp = await update_mapseen_for(x, y);
        await feel_location(x, y);
        if (door.glyph != oldglyph || game.lastseentyp[x][y] != oldlastseentyp) {
            res = 1;
        }
    }
    if (portcullis || !((door.typ) == DOOR)) {
        if (is_db_wall(x, y) || door.typ == DRAWBRIDGE_UP) {
            await pline_The("drawbridge is already closed.");
        } else if (portcullis || door.typ == DRAWBRIDGE_DOWN) {
            await There("is no obvious way to close the drawbridge.");
        /* is_db_wall: closed portcullis */
        } else {
            nodoor: {
            }
            await You("%s no door there.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "see");
        }
        return res;
    }
    if (door.flags == 0) {
        await pline("This doorway has no door.");
        return res;
    } else if (await obstructed(x, y, (0))) {
        return res;
    } else if (door.flags == 1) {
        await pline("This door is broken.");
        return res;
    } else if (door.flags & (4 | 8)) {
        await pline("This door is already closed.");
        return res;
    }
    if (door.flags == 2) {
        if (((game.youmonst.data).msize < 1) && !game.u.usteed) {
            await pline("You're too small to push the door closed.");
            return res;
        }
        if (game.u.usteed || rn2(25) < Math.trunc(((acurrstr()) + (acurr(A_DEX)) + (acurr(A_CON))) / 3)) {
            await pline_The("door closes.");
            door.flags = 4;
            await feel_newsym(x, y);
            /* vision:  no longer see there */
            block_point(x, y);
        } else {
            await exercise(A_STR, (1));
            await pline_The("door resists!");
        }
    }
    return 1;
}
/* box obj was hit with spell or wand effect otmp;
   returns true if something happened */
/* obj *is* a box */
export async function boxlock(obj, otmp) {
    let res = 0;
    switch (otmp.otyp) {
        case WAN_LOCKING:
        case SPE_WIZARD_LOCK:
            if (!obj.olocked) {
                ;
                await pline("Klunk!");
                obj.olocked = 1;
                obj.obroken = 0;
                if ((game.urole.mnum == (PM_WIZARD))) {
                    obj.lknown = 1;
                } else {
                    obj.lknown = 0;
                }
                res = 1;
            }
            break;
        case WAN_OPENING:
        case SPE_KNOCK:
            if (obj.olocked) {
                ;
                await pline("Klick!");
                obj.olocked = 0;
                res = 1;
                if ((game.urole.mnum == (PM_WIZARD))) {
                    obj.lknown = 1;
                } else {
                    obj.lknown = 0;
                }
            } else {
                obj.obroken = 0;
            }
            break;
        case WAN_POLYMORPH:
        case SPE_POLYMORPH:
            if (game.xlock.box == obj) {
                reset_pick();
            }
            break;
    }
    return res;
}
/* Door/secret door was hit with spell or wand effect otmp;
   returns true if something happened */
export async function doorlock(otmp, x, y) {
    let door = game.level.locations[x][y];
    let res = (1);
    let loudness = 0;
    let msg = null;
    let dustcloud = "A cloud of dust";
    let quickly_dissipates = "quickly dissipates";
    let mysterywand = (otmp.oclass == WAND_CLASS && !otmp.dknown);
    if (door.typ == SDOOR) {
        switch (otmp.otyp) {
            case WAN_OPENING:
            case SPE_KNOCK:
            case WAN_STRIKING:
            case SPE_FORCE_BOLT:
                door.typ = DOOR;
                door.flags = 4 | (door.flags & 16);
                await newsym(x, y);
                if (((game.viz_array[y][x] & 2) != 0)) {
                    await pline("A door appears in the wall!");
                }
                if (otmp.otyp == WAN_OPENING || otmp.otyp == SPE_KNOCK) {
                    return (1);
                }
                break;
            case WAN_LOCKING:
            case SPE_WIZARD_LOCK:
            default:
                return (0);
        }
    }
    switch (otmp.otyp) {
        case WAN_LOCKING:
        case SPE_WIZARD_LOCK:
            if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                let vis = ((game.viz_array[y][x] & 2) != 0);
                if (vis) {
                    await pline("%s springs up in the older, more primitive doorway.", dustcloud);
                } else {
                    ;
                    await You_hear("a swoosh.");
                }
                if (await obstructed(x, y, mysterywand)) {
                    if (vis) {
                        await pline_The("cloud %s.", quickly_dissipates);
                    }
                    return (0);
                }
                block_point(x, y);
                door.typ = SDOOR , door.flags = 0;
                if (vis) {
                    await pline_The("doorway vanishes!");
                }
                await newsym(x, y);
                return (1);
            }
            if (await obstructed(x, y, mysterywand)) {
                return (0);
            }
            if (t_at(x, y)) {
                await pline("%s springs up in the doorway, but %s.", dustcloud, quickly_dissipates);
                return (0);
            }
            switch (door.flags & ~16) {
                case 4:
                    msg = "The door locks!";
                    break;
                case 2:
                    msg = "The door swings shut, and locks!";
                    break;
                case 1:
                    msg = "The broken door reassembles and locks!";
                    break;
                case 0:
                    msg = "A cloud of dust springs up and assembles itself into a door!";
                    break;
                default:
                    res = (0);
                    break;
            }
            block_point(x, y);
            door.flags = 8 | (door.flags & 16);
            await newsym(x, y);
            break;
        case WAN_OPENING:
        case SPE_KNOCK:
            if (door.flags & 8) {
                msg = "The door unlocks!";
                door.flags = 4 | (door.flags & 16);
            } else {
                res = (0);
            }
            break;
        case WAN_STRIKING:
        case SPE_FORCE_BOLT:
            if (door.flags & (8 | 4)) {
                /* sawit: closed door location is more visible than open */
                let sawit = 0;
                let seeit = 0;
                if (door.flags & 16) {
                    let mtmp = (game.level.monsters[x][y]);
                    sawit = mtmp ? canseemon(mtmp) : ((game.viz_array[y][x] & 2) != 0);
                    door.flags = 0;
                    unblock_point(x, y);
                    await newsym(x, y);
                    seeit = mtmp ? canseemon(mtmp) : ((game.viz_array[y][x] & 2) != 0);
                    if (mtmp) {
                        await mb_trapped(mtmp, sawit || seeit);
                    } else {
                        /* for mtmp, mb_trapped() does is own wake_nearto() */
                        loudness = 40;
                        if (game.flags.verbose) {
                            ;
                            if ((sawit || seeit) && !(game.multi < 0 && (unconscious() || is_fainted()))) {
                                await pline("KABOOM!!  You see a door explode.");
                            } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                                ;
                                await You_hear("a %s explosion.", (dist2((x), (y), game.u.ux, game.u.uy) > 7 * 7) ? "distant" : "nearby");
                            }
                        }
                    }
                    break;
                }
                sawit = ((game.viz_array[y][x] & 2) != 0);
                door.flags = 1;
                recalc_block_point(x, y);
                seeit = ((game.viz_array[y][x] & 2) != 0);
                await newsym(x, y);
                if (game.flags.verbose) {
                    if ((sawit || seeit) && !(game.multi < 0 && (unconscious() || is_fainted()))) {
                        await pline_The("door crashes open!");
                    } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                        ;
                        await You_hear("a crashing sound.");
                    }
                }
                if (game.vision_full_recalc) {
                    await vision_recalc(0);
                }
                loudness = 20;
            } else {
                res = (0);
            }
            break;
        default:
            await impossible("magic (%d) attempted on door.", otmp.otyp);
            break;
    }
    if (msg && ((game.viz_array[y][x] & 2) != 0)) {
        await pline("%s", msg);
    }
    if (loudness > 0) {
        await wake_nearto(x, y, loudness);
        if (in_rooms(x, y, SHOPBASE)) {
            await add_damage(x, y, 0);
        }
    }
    if (res && picking_at(x, y)) {
        await stop_occupation();
        reset_pick();
    }
    return res;
}
export async function chest_shatter_msg(otmp) {
    let disposition = null;
    let thing = null;
    let save_HBlinded = 0;
    let save_BBlinded = 0;
    if (otmp.oclass == POTION_CLASS) {
        await You("%s %s shatter!", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "hear" : "see", await an(bottlename()));
        if (!(((game.youmonst.data).mflags1 & 1024) != 0) || (((game.youmonst.data).mflags1 & 4096) == 0)) {
            await potionbreathe(otmp);
        }
        return;
    }
    /* We have functions for distant and singular names, but not one */
    save_HBlinded = game.u.uprops[BLINDED].intrinsic , save_BBlinded = game.u.uprops[BLINDED].blocked;
    game.u.uprops[BLINDED].intrinsic = 1 , game.u.uprops[BLINDED].blocked = 0;
    thing = await singular(otmp, xname);
    game.u.uprops[BLINDED].intrinsic = save_HBlinded , game.u.uprops[BLINDED].blocked = save_BBlinded;
    switch (game.objects[otmp.otyp].oc_material) {
        case PAPER:
            disposition = "is torn to shreds";
            break;
        case WAX:
            disposition = "is crushed";
            break;
        case VEGGY:
            disposition = "is pulped";
            break;
        case FLESH:
            disposition = "is mashed";
            break;
        case GLASS:
            disposition = "shatters";
            break;
        case WOOD:
            disposition = "splinters to fragments";
            break;
        default:
            disposition = "is destroyed";
            break;
    }
    await pline("%s %s!", await An(thing), disposition);
}
/*lock.c*/
/* even if you don't succeed */
/* Put the contents on ground at the hero's feet. */
/* this works because we're sure to have at least 1 left;
                   otherwise it would fail since otmp is not in inventory */
/* for a +0 weapon, probability that it survives an unsuccessful
             * attempt to force the lock is (.992)^50 = .67
             */
/* due to hammering on the container */
/* breakchestlock() might destroy xlock.box; if so, xlock context will
       be cleared (delobj -> obfree -> maybe_reset_pick); but it might not,
       so explicitly clear that manually */
/* "There is <a box> here; <verb> <it|its lock>?" */
/* credit cards are only good for unlocking */
/* "The door actually was a <mimic>!" */
/* mimic might keep the key (50% chance, 10% for PYEC or MKoT) */
/* this is probably only relevant when blind */
/* note: for !autounlock, 'apply' already did touch check */
/*
     * TODO?
     *  allow force with edged weapon to be performed on doors.
     */
/* this used to be done prior to get_adjacent_loc() but doing so was
       incorrect once open at hero's spot became an alternate way to loot */
/* the hero knows she opened it */
/* Monnam, Someone or Something */
/* s_suffix() returns a modifiable buffer */
/* the hero knows she closed it */
/* unlock; isn't broken so doesn't need fixing */
/* maybe start unlocking chest, get interrupted, then zap it;
           we must avoid any attempt to resume unlocking it */
/* Can't have real locking in Rogue, so just hide doorway */
/* Don't allow doors to close over traps.  This is for pits */
/* & trap doors, but is it ever OK for anything else? */
/* maketrap() clears doormask, so it should be NODOOR */
/* force vision recalc before printing more messages */
/* maybe unseen monster zaps door you're unlocking */
