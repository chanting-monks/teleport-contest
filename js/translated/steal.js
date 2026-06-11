/* NetHack 5.0	steal.c	$NHDT-Date: 1720895742 2024/07/13 18:35:42 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.132 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, Your, pline } from '../c2js-runtime/pline.js';
import { __nh_advance_str, strchr, strcpy, strncmp, strstri } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { o_unleash } from './apply.js';
import { touch_artifact } from './artifact.js';
import { canseemon, newsym, sensemon } from './display.js';
import { flooreffects } from './do.js';
import { Adjmonnam, Mgender, Monnam, Some_Monnam, pmname, y_monnam } from './do_name.js';
import { Amulet_off, Armor_off, Blindf_off, Boots_off, Cloak_off, Gloves_off, Helmet_off, Ring_gone, Shield_off, Shirt_off, cancel_don, doffing, donning, stop_donning } from './do_wear.js';
import { droppables } from './dogmove.js';
import { is_fainted, maybe_finished_meal } from './eat.js';
import { in_rooms, inv_cnt, money_cnt, nomul } from './hack.js';
import { copynchars, dist2, s_suffix, strsubst, upstart } from './hacklib.js';
import { carry_obj_effects, count_unpaid, freeinv, g_at, stackobj } from './invent.js';
import { obj_sheds_light, snuff_light_source } from './light.js';
import { add_to_minv, obj_extract_self, place_object, splitobj, unknow_object } from './mkobj.js';
import { can_carry, monnear } from './mon.js';
import { attacktype, dmgtype } from './mondata.js';
import { monflee } from './monmove.js';
import { ADORNED, AMULET_CLASS, AMULET_OF_YENDOR, ARMOR_CLASS, ART_ORB_OF_DETECTION, BELL, BELL_OF_OPENING, BLINDED, BOULDER, CANDELABRUM_OF_INVOCATION, COIN_CLASS, CONFLICT, CORPSE, FAKE_AMULET_OF_YENDOR, FLYING, FOOD_CLASS, FOOT, GOLD_PIECE, HAND, LEASH, LEVITATION, PLNMSG_MON_TAKES_OFF_ITEM, PM_CHICKATRICE, PM_COCKATRICE, RING_CLASS, ROCK_CLASS, SHOPBASE, SPE_BOOK_OF_THE_DEAD, S_NYMPH, TOOL_CLASS, TT_BURIEDBALL, WEAPON_CLASS } from './nh-constants.js';
import { Tobjnam, armor_simple_name, distant_name, doname, makeplural, otense, simpleonames, yname } from './objnam.js';
import { encumber_msg } from './pickup.js';
import { pline_mon, urgent_pline } from './pline.js';
import { body_part, mbodypart, skinback } from './polyself.js';
import { is_quest_artifact } from './questpgr.js';
import { unpunish } from './read.js';
import { rn2, rnd } from './rnd.js';
import { costly_spot, find_objowner, obfree, shop_keeper, subfrombill } from './shk.js';
import { rloc, rloco, tele_restrict } from './teleport.js';
import { minstapetrify, openholdingtrap, unconscious } from './trap.js';
import { uqwepgone, uswapwepgone, uwepgone, welded } from './wield.js';
import { extract_from_minvent, setnotworn, setworn, update_mon_extrinsics } from './worn.js';
import { obj_resists } from './zap.js';

/* proportional subset of gold; return value actually fits in an int */
export function somegold(lmoney) {
    let igold = (lmoney >= 32767) ? 32767 : lmoney;
    if (igold < 50) {
        ;
    } else if (igold < 100) {
        igold = (rn2(igold - 25 + 1) + (25));
    } else if (igold < 500) {
        igold = (rn2(igold - 50 + 1) + (50));
    } else if (igold < 1000) {
        igold = (rn2(igold - 100 + 1) + (100));
    } else if (igold < 5000) {
        igold = (rn2(igold - 500 + 1) + (500));
    } else if (igold < 10000) {
        igold = (rn2(igold - 1000 + 1) + (1000));
    } else {
        igold = (rn2(igold - 5000 + 1) + (5000));
    }
    return igold;
}
/*
 * Find the first (and hopefully only) gold object in a chain.
 * Used when leprechaun (or you as leprechaun) looks for
 * someone else's gold.  Returns a pointer so the gold may
 * be seized without further searching.
 * May search containers too.
 * Deals in gold only, as leprechauns don't care for lesser coins.
*/
export function findgold(argchain) {
    let chain = argchain;
    while (chain && chain.otyp != GOLD_PIECE) {
        chain = chain.nobj;
    }
    return chain;
}
/*
 * Steal gold coins only.  Leprechauns don't care for lesser coins.
*/
export function stealgold(mtmp) {
    let fgold = g_at(game.u.ux, game.u.uy);
    let ygold = null;
    let tmp = 0;
    let who = null;
    let whose = null;
    let what = null;
    /* skip lesser coins on the floor */
    while (fgold && fgold.otyp != GOLD_PIECE) {
        fgold = fgold.v.v_nexthere;
    }
    ygold = findgold(game.invent);
    if (fgold && (!ygold || fgold.quan > ygold.quan || !rn2(5))) {
        obj_extract_self(fgold);
        add_to_minv(mtmp, fgold);
        newsym(game.u.ux, game.u.uy);
        if (game.u.usteed) {
            who = game.u.usteed;
            whose = s_suffix(y_monnam(who));
            what = makeplural(mbodypart(who, FOOT));
        } else {
            who = game.youmonst;
            whose = "your";
            what = makeplural(body_part(FOOT));
        }
        /* [ avoid "between your rear regions" :-] */
        if ((((who.data).mflags1 & 524288) != 0)) {
            what = "coils";
        }
        /* reduce "rear hooves/claws" to "hooves/claws" */
        if (!strncmp(what, "rear ", 5)) {
            what = __nh_advance_str(what, 5);
        }
        pline("%s quickly snatches some gold from %s %s %s!", Monnam(mtmp), (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) ? "beneath" : "between", whose, what);
        if (!ygold || !rn2(5)) {
            if (!tele_restrict(mtmp)) {
                rloc(mtmp, 2);
            }
            monflee(mtmp, 0, (0), (0));
        }
    } else if (ygold) {
        let gold_price = game.objects[GOLD_PIECE].oc_cost;
        tmp = Math.trunc((somegold(money_cnt(game.invent)) + gold_price - 1) / gold_price);
        tmp = ((tmp) < (ygold.quan) ? (tmp) : (ygold.quan));
        if (tmp < ygold.quan) {
            ygold = splitobj(ygold, tmp);
        } else {
            setnotworn(ygold);
        }
        freeinv(ygold);
        add_to_minv(mtmp, ygold);
        Your("purse feels lighter.");
        if (!tele_restrict(mtmp)) {
            rloc(mtmp, 2);
        }
        monflee(mtmp, 0, (0), (0));
        game.disp.botl = (1);
    }
}
/* monster who was stealing from hero has just died */
export function thiefdead() {
    /* hero is busy taking off an item of armor which takes multiple turns */
    game.stealmid = 0;
    if (game.afternmv == stealarm) {
        game.afternmv = unstolenarm;
        game.nomovemsg = null;
    }
}
/* checks whether hero can be responsive to seduction attempts; similar to
   Unaware but also includes paralysis */
export function unresponsive() {
    if (game.multi >= 0) {
        return (0);
    }
    return (unconscious() || is_fainted() || (game.multi_reason && (!strncmp(game.multi_reason, "frozen", 6) || !strncmp(game.multi_reason, "paralyzed", 9))));
}
/* called via (*ga.afternmv)() when hero finishes taking off armor that
   was slated to be stolen but the thief died in the interim */
export function unstolenarm() {
    let obj = null;
    /* find the object before clearing stealoid; it has already become
       not-worn and is still in hero's inventory */
    for (obj = game.invent; obj; obj = obj.nobj) {
        if (obj.o_id == game.stealoid) {
            break;
        }
    }
    game.stealoid = 0;
    if (obj) {
        You("finish taking off your %s.", armor_simple_name(obj));
    }
    /* in case only one has been reset so far */
    return 0;
}
/* finish stealing an item of armor which takes multiple turns to take off */
export function stealarm() {
    let mtmp = null;
    let otmp = null;
    let nextobj = null;
    botm: {
        if (!game.stealoid || !game.stealmid) {
            break botm;
        }
        for (otmp = game.invent; otmp; otmp = nextobj) {
            nextobj = otmp.nobj;
            if (otmp.o_id == game.stealoid) {
                for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
                    if (mtmp.m_id == game.stealmid) {
                        if (((mtmp).mhp < 1)) {
                            impossible("stealarm(): dead monster stealing");
                            /* (could just use 'break' here) */
                            break botm;
                        }
                        /* maybe the thief polymorphed into something without a
                       steal attack, or perhaps while stealing hero's suit
                       the thief took away other items causing hero to fall
                       into water or lava and then teleport to safety */
                        if (!dmgtype(mtmp.data, 21) || dist2((mtmp.mx), (mtmp.my), game.u.ux, game.u.uy) > 2) {
                            break botm;
                        }
                        if (otmp.unpaid) {
                            subfrombill(otmp, shop_keeper(game.u.ushops));
                        }
                        freeinv(otmp);
                        pline("%s steals %s!", Monnam(mtmp), doname(otmp));
                        /* could merge and free otmp but won't */
                        mpickobj(mtmp, otmp);
                        /* Implies seduction, "you gladly hand over ..."
                       so we don't set mavenge bit here. */
                        monflee(mtmp, 0, (0), (0));
                        if (!tele_restrict(mtmp)) {
                            rloc(mtmp, 2);
                        }
                        break;
                    }
                }
                break;
            }
        }
    }
    game.stealoid = game.stealmid = 0;
    return 0;
}
/* An object you're wearing has been taken off by a monster (theft or
   seduction).  Also used if a worn item gets transformed (stone to flesh). */
/* whether to unpunish or just unwield */
export function remove_worn_item(obj, unchain_ball) {
    let oldinuse = 0;
    if (donning(obj)) {
        cancel_don();
    }
    if (!obj.owornmask) {
        return;
    }
    /*
     * Losing worn gear might drop hero into water or lava or onto a
     * location-changing trap or take away the ability to breathe in water.
     * Marking it 'in_use' prevents emergency_disrobe() from dropping it
     * and lava_effects() from destroying it; other cases impacting object
     * location (or destruction) might still have issues.
     *
     * Note:  if a hangup save occurs when 'in_use' is set, the item will
     * be destroyed via useup() during restore.  Maybe remove_worn_item()
     * and emergency_disrobe() should switch to using obj->bypass instead
     * but that would need a lot more cooperation by callers.  It's a
     * tradeoff between protecting the player against unintentional hangup
     * and defending the game against deliberate hangup when player sees a
     * message about something undesirable followed by --More--.
     */
    oldinuse = obj.in_use;
    obj.in_use = 1;
    if (obj.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) {
        if (obj == game.uskin) {
            impossible("Removing embedded scales?");
            /* uarm = uskin; uskin = 0; */
            skinback((1));
        }
        if (obj == game.uarm) {
            Armor_off();
        } else if (obj == game.uarmc) {
            Cloak_off();
        } else if (obj == game.uarmf) {
            Boots_off();
        } else if (obj == game.uarmg) {
            Gloves_off();
        } else if (obj == game.uarmh) {
            Helmet_off();
        } else if (obj == game.uarms) {
            Shield_off();
        } else if (obj == game.uarmu) {
            Shirt_off();
        /* catchall -- should never happen */
        } else {
            setworn(null, obj.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64));
        }
    } else if (obj.owornmask & 65536) {
        Amulet_off();
    } else if (obj.owornmask & (131072 | 262144)) {
        Ring_gone(obj);
    } else if (obj.owornmask & 524288) {
        Blindf_off(obj);
    } else if (obj.owornmask & (256 | 1024 | 512)) {
        if (obj == game.uwep) {
            uwepgone();
        }
        if (obj == game.uswapwep) {
            uswapwepgone();
        }
        if (obj == game.uquiver) {
            uqwepgone();
        }
    }
    if (obj.owornmask & (2097152 | 4194304)) {
        if (unchain_ball) {
            unpunish();
        }
    } else if (obj.owornmask) {
        setnotworn(obj);
    }
    if (obj.where == 9) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/steal.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("remove_worn_item() \"%s\" deleted!", simpleonames(obj));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
    obj.in_use = oldinuse;
}
/* during theft of a worn item: remove_worn_item(), prefaced by a message */
export function worn_item_removal(mon, obj) {
    let objbuf = '';
    let article = '';
    let p = null;
    let verb = null;
    let strip_art = 0;
    objbuf = strcpy(objbuf, doname(obj));
    /* massage the object description */
    strip_art = !strncmp(objbuf, "the ", 4) ? 4 : !strncmp(objbuf, "an ", 3) ? 3 : !strncmp(objbuf, "a ", 2) ? 2 : 0;
    if (strip_art) {
        /* convert "a/an/the <object>" to "your object" */
        article = copynchars(article, objbuf, strip_art);
        /* when removing attached iron ball, caller passes 'uchain';
           when formatted, it will be "an iron chain (attached to you)";
           change "an" to "the" rather than to "your" in that situation */
        objbuf = strsubst(objbuf, article, (obj == game.uchain) ? "the " : "your ");
    }
    /* these ought to be guarded against matching user-supplied name */
    objbuf = strsubst(objbuf, " (being worn)", "");
    objbuf = strsubst(objbuf, " (alternate weapon; not wielded)", "");
    /* convert "ring (on left hand)" to "ring (from left hand)" */
    if ((p = strstri(objbuf, " (on ")) && (!strncmp(__nh_advance_str(p, 5), "left ", 5) || !strncmp(__nh_advance_str(p, 5), "right ", 6))) {
        strsubst(__nh_advance_str(p, 2), "on", "from");
    }
    /* slightly iffy for alternate weapon that isn't actively dual-wielded,
       but it's better to alert the player to the change in equipment than
       to suppress the message for that case */
    verb = ((obj.owornmask & (256 | 1024 | 512)) != 0) ? "disarms" : ((obj.owornmask & ((131072 | 262144) | 65536 | 524288)) != 0) ? "removes" : "takes off";
    pline("%s %s %s.", Some_Monnam(mon), verb, objbuf);
    game.iflags.last_msg = PLNMSG_MON_TAKES_OFF_ITEM;
    /* removal might trigger more messages (due to loss of Lev|Fly;
       descending happens before the theft in progress finishes) */
    remove_worn_item(obj, (1));
}
/* Returns 1 when something was stolen (or at least, when N should flee now),
 * returns -1 if the monster died in the attempt.
 * Avoid stealing the object 'stealoid'.
 * Nymphs and monkeys won't steal coins (so that their "steal item" attack
 * doesn't become a superset of leprechaun's "steal gold" attack).
 */
const __steal_how = ["steal", "snatch", "grab", "take"];
export function steal(mtmp, objnambuf) {
    let otmp = null;
    let Monnambuf = '';
    let tmp = 0;
    let could_petrify = 0;
    let armordelay = 0;
    let olddelay = 0;
    let icnt = 0;
    let named = 0;
    let retrycnt = 0;
    let monkey_business = 0;
    let seen = 0;
    let was_doffing = 0;
    let was_punished = 0;
    let __adorned_pick = false;
    {
        named = 0;
        retrycnt = 0;
        monkey_business = (((mtmp.data).mflags1 & 262144) != 0);
        seen = (canseemon(mtmp) || sensemon(mtmp));
        was_punished = (game.uball != null);
        if (objnambuf) {
            objnambuf.value = 0;
        }
        /* the following is true if successful on first of two attacks. */
        if (!monnear(mtmp, game.u.ux, game.u.uy)) {
            return 0;
        }
        Monnambuf = strcpy(Monnambuf, Some_Monnam(mtmp));
        /* stealing a worn item might drop hero into water or lava where
       teleporting to safety could result in a previously visible thief
       no longer being visible; it could also be a case of a blinded
       hero being able to see via wearing the Eyes of the Overworld and
       having those stolen; remember the name as it is now; if unseen,
       nymphs will be "Someone" and monkeys will be "Something" */
        /* food being eaten might already be used up but will not have
       been removed from inventory yet; we don't want to steal that,
       so this will cause it to be removed now */
        if (game.occupation) {
            maybe_finished_meal((0));
        }
        icnt = inv_cnt((0));
        if (!icnt || (icnt == 1 && game.uskin)) {
            nothing_to_steal: {
            }
            if ((game.uball != null) && !monkey_business && rn2(4)) {
                (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                /* Not even a thousand men in armor can strip a naked man. */
                /* nymphs might target uchain if invent is empty; monkeys won't;
           hero becomes unpunished but nymph ends up empty handed */
                /* uball is not carried (uchain never is) */
                worn_item_removal(mtmp, game.uchain);
            } else if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL && !monkey_business && !rn2(4)) {
                let dummy = 0;
                /* buried ball is not tracked via 'uball' and there is no chain
               at all (hence no uchain to take off) */
                pline("%s takes off your unseen chain.", Monnambuf);
                openholdingtrap(game.youmonst, { get value() { return dummy; }, set value(_v) { dummy = _v; } });
            } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("Somebody tries to rob you, but finds nothing to steal.");
            } else if (inv_cnt((1)) > inv_cnt((0))) {
                pline("%s tries to rob you, but isn't interested in gold.", Monnambuf);
            } else {
                pline("%s tries to rob you, but there is nothing to steal!", Monnambuf);
            }
            return 1;
        }
        if (monkey_business || game.uarmg) {
            ;
        } else if (game.u.uprops[ADORNED].extrinsic & 131072) {
            otmp = game.uleft;
            __adorned_pick = true;
        } else if (game.u.uprops[ADORNED].extrinsic & 262144) {
            otmp = game.uright;
            __adorned_pick = true;
        }
    }
    retry: while (true) {
    tmp = 0;
    if (!__adorned_pick) {
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if ((!game.uarm || otmp != game.uarmc) && otmp != game.uskin && otmp.oclass != COIN_CLASS) {
                tmp += (otmp.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288))) ? 5 : 1;
            }
        }
        if (!tmp) {
            if ((game.uball != null) && !monkey_business && rn2(4)) {
                (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                worn_item_removal(mtmp, game.uchain);
            } else if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL && !monkey_business && !rn2(4)) {
                let dummy = 0;
                pline("%s takes off your unseen chain.", Monnambuf);
                openholdingtrap(game.youmonst, { get value() { return dummy; }, set value(_v) { dummy = _v; } });
            } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("Somebody tries to rob you, but finds nothing to steal.");
            } else if (inv_cnt((1)) > inv_cnt((0))) {
                pline("%s tries to rob you, but isn't interested in gold.", Monnambuf);
            } else {
                pline("%s tries to rob you, but there is nothing to steal!", Monnambuf);
            }
            return 1;
        }
        tmp = rn2(tmp);
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if ((!game.uarm || otmp != game.uarmc) && otmp != game.uskin && otmp.oclass != COIN_CLASS) {
                tmp -= (otmp.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288))) ? 5 : 1;
                if (tmp < 0) {
                    break;
                }
            }
        }
        if (!otmp) {
            impossible("Steal fails!");
            return 0;
        }
        /* can't steal ring(s) while wearing gloves */
        if ((otmp == game.uleft || otmp == game.uright) && game.uarmg) {
            otmp = game.uarmg;
        }
        /* can't steal gloves while wielding - so steal the wielded item. */
        if (otmp == game.uarmg && game.uwep) {
            otmp = game.uwep;
        } else if (otmp == game.uarm && game.uarmc) {
            otmp = game.uarmc;
        } else if (otmp == game.uarmu && game.uarmc) {
            otmp = game.uarmc;
        } else if (otmp == game.uarmu && game.uarm) {
            otmp = game.uarm;
        }
    }
    if (otmp.o_id == game.stealoid) {
        return 0;
    }
    if (otmp.otyp == BOULDER && !(((mtmp.data).mflags2 & 134217728) != 0)) {
        if (!retrycnt++) {
            __adorned_pick = false;
            continue retry;
        }
        pline("%s tries to %s %s%s but gives up.", Monnambuf, __steal_how[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)))], (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? "your " : "", (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? armor_simple_name(otmp) : yname(otmp));
        return !rn2(Math.trunc(inv_cnt((0)) / 5) + 2);
    }
    break;
    }
    if (monkey_business) {
        /* animals can't overcome curse stickiness nor unlock chains */
        let ostuck = 0;
        if (otmp == game.uball) {
            ostuck = (1);
        } else if (otmp == game.uquiver || (otmp == game.uswapwep && !game.u.twoweap)) {
            ostuck = (0);
        /* is the player prevented from voluntarily giving up this item?
           (ignores loadstones; the !can_carry() check will catch those) */
        /* effectively worn; curse is implicit */
        /* not really worn; curse doesn't matter */
        } else {
            ostuck = ((otmp.cursed && otmp.owornmask) || (otmp == ((game.u.uhandedness == 1) ? game.uleft : game.uright) && welded(game.uwep)) || (otmp == ((game.u.uhandedness == 1) ? game.uright : game.uleft) && welded(game.uwep) && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)));
        }
        if (ostuck || can_carry(mtmp, otmp) == 0) {
            cant_take: {
            }
            /* nymphs can steal rings from under
                         cursed weapon but animals can't */
            pline("%s tries to %s %s%s but gives up.", Monnambuf, __steal_how[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)))], (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? "your " : "", (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? armor_simple_name(otmp) : yname(otmp));
            /* the fewer items you have, the less likely the thief
               is going to stick around to try again (0) instead of
               running away (1) */
            return !rn2(Math.trunc(inv_cnt((0)) / 5) + 2);
        }
    }
    if (otmp.otyp == LEASH && otmp.corpsenm) {
        if (monkey_business && otmp.cursed) {
            pline("%s tries to %s %s%s but gives up.", Monnambuf, __steal_how[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)))], (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? "your " : "", (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? armor_simple_name(otmp) : yname(otmp));
            return !rn2(Math.trunc(inv_cnt((0)) / 5) + 2);
        }
        o_unleash(otmp);
    }
    was_doffing = doffing(otmp);
    /* stop donning/doffing now so that afternmv won't be clobbered
       below; stop_occupation doesn't handle donning/doffing */
    olddelay = stop_donning(otmp);
    /* you're going to notice the theft... */
    stop_occupation();
    if (otmp.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288))) {
        switch (otmp.oclass) {
            case TOOL_CLASS:
            case AMULET_CLASS:
            case RING_CLASS:
            case FOOD_CLASS:
                worn_item_removal(mtmp, otmp);
                break;
            case ARMOR_CLASS:
                armordelay = game.objects[otmp.otyp].oc_delay;
                if (olddelay > 0 && olddelay < armordelay) {
                    armordelay = olddelay;
                }
                if (monkey_business || unresponsive()) {
                    /* animals usually don't have enough patience to take off
                   items which require extra time; unconscious or paralyzed
                   hero can't be charmed into taking off his own armor */
                    if (armordelay >= 1 && !olddelay && rn2(10)) {
                        pline("%s tries to %s %s%s but gives up.", Monnambuf, __steal_how[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)))], (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? "your " : "", (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? armor_simple_name(otmp) : yname(otmp));
                        return !rn2(Math.trunc(inv_cnt((0)) / 5) + 2);
                    }
                    worn_item_removal(mtmp, otmp);
                    break;
                } else {
                    let curssv = otmp.cursed;
                    let slowly = 0;
                    otmp.cursed = 0;
                    slowly = (armordelay >= 1 || game.multi < 0);
                    if (game.flags.female) {
                        urgent_pline("%s charms you.  You gladly %s your %s.", !seen ? "She" : Monnambuf, curssv ? "let her take" : !slowly ? "hand over" : was_doffing ? "continue removing" : "start removing", armor_simple_name(otmp));
                    } else {
                        urgent_pline("%s seduces you and %s off your %s.", !seen ? "She" : Adjmonnam(mtmp, "beautiful"), curssv ? "helps you to take" : !slowly ? "you take" : was_doffing ? "you continue taking" : "you start taking", armor_simple_name(otmp));
                    }
                    named++;
                    /* the following is to set multi for later on */
                    nomul(-armordelay);
                    game.multi_reason = "taking off clothes";
                    game.nomovemsg = null;
                    remove_worn_item(otmp, (1));
                    otmp.cursed = curssv;
                    if (game.multi < 0) {
                        game.stealoid = otmp.o_id;
                        game.stealmid = mtmp.m_id;
                        game.afternmv = stealarm;
                        return 0;
                    }
                }
                break;
            default:
                impossible("Tried to steal a strange worn thing. [%d]", otmp.oclass);
        }
        /* hero's blindfold might have just been stolen; if so, replace
           cached "Someone" or "Something" with Monnam */
        if (!seen && (canseemon(mtmp) || sensemon(mtmp))) {
            Monnambuf = strcpy(Monnambuf, Monnam(mtmp));
        }
    } else if (otmp.owornmask) {
        let item = otmp;
        /* non-Null uball implies non-Null uchain */
        if (otmp == game.uball) {
            item = game.uchain;
        }
        /* yields a more accurate 'takes off' message */
        worn_item_removal(mtmp, item);
        /* if we switched from uball to uchain for the preface message,
           then unpunish() took place and both those pointers are now Null,
           with 'item' a stale pointer to freed chain; the ball is still
           present though and 'otmp' is still valid; if uball was also
           wielded or quivered, the corresponding weapon pointer hasn't
           been cleared yet; do that, with no preface message this time */
        if ((otmp.owornmask & (256 | 1024 | 512)) != 0) {
            remove_worn_item(otmp, (0));
        }
    }
    /* do this before removing it from inventory */
    if (objnambuf) {
        objnambuf = strcpy(objnambuf, yname(otmp));
    }
    /* usually set mavenge bit so knights won't suffer an alignment penalty
       during retaliation; not applicable for removing attached iron ball */
    if (!(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !(was_punished && !(game.uball != null))) {
        mtmp.mavenge = 1;
    }
    if (otmp.unpaid) {
        subfrombill(otmp, shop_keeper(game.u.ushops));
    }
    freeinv(otmp);
    /* if we just gave a message about removing a worn item and there have
       been no intervening messages, shorten '<mon> stole <item>' message */
    if (game.iflags.last_msg == PLNMSG_MON_TAKES_OFF_ITEM && mtmp.data.mlet == S_NYMPH) {
        ++named;
    }
    urgent_pline("%s stole %s.", named ? "She" : Monnambuf, doname(otmp));
    encumber_msg();
    could_petrify = (otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]));
    otmp.how_lost = 3;
    mpickobj(mtmp, otmp);
    if (could_petrify && !(mtmp.misc_worn_check & 16)) {
        minstapetrify(mtmp, (1));
        return -1;
    }
    return (game.multi < 0) ? 0 : 1;
}
/* Returns 1 if otmp is free'd, 0 otherwise. */
export function mpickobj(mtmp, otmp) {
    let freed_otmp = 0;
    let snuff_otmp = (0);
    if (!otmp) {
        impossible("monster (%s) taking or picking up nothing?", pmname(mtmp.data, Mgender(mtmp)));
        return 1;
    } else if (otmp == game.uball || otmp == game.uchain) {
        impossible("monster (%s) taking or picking up attached %s (%s)?", pmname(mtmp.data, Mgender(mtmp)), (otmp == game.uchain) ? "chain" : "ball", simpleonames(otmp));
        return 0;
    }
    /* if monster is acquiring a thrown or kicked object, the throwing
       or kicking code shouldn't continue to track and place it */
    if (otmp == game.thrownobj) {
        game.thrownobj = null;
    } else if (otmp == game.kickedobj) {
        game.kickedobj = null;
    }
    if (otmp.unpaid || (((otmp).cobj != null) && count_unpaid(otmp.cobj))) {
        /* an unpaid item can be on the floor; if a monster picks it up, take
       it off the shop bill */
        subfrombill(otmp, find_objowner(otmp, otmp.ox, otmp.oy));
    }
    if (obj_sheds_light(otmp) && attacktype(mtmp.data, 11)) {
        /* don't want hidden light source inside the monster; assumes that
       engulfers won't have external inventories; whirly monsters cause
       the light to be extinguished rather than letting it shine through */
        /* this is probably a burning object that you dropped or threw */
        if ((game.u.uswallow && (game.u.ustuck == (mtmp))) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s out.", Tobjnam(otmp, "go"));
        }
        snuff_otmp = (1);
    }
    /* for hero owned object on shop floor, mtmp is taking possession
       and if it's eventually dropped in a shop, shk will claim it */
    otmp.no_charge = 0;
    if (!mtmp.mtame) {
        /* some object handling is only done if mtmp isn't a pet */
        /* if monst is unseen, some info hero knows about this object becomes
           lost; continual pickup and drop by pets makes this too annoying if
           it is applied to them; when engulfed (where monster can't be seen
           because vision is disabled), or when held (or poly'd and holding)
           while blind, behave as if the monster can be 'seen' by touch */
        if (!canseemon(mtmp) && mtmp != game.u.ustuck) {
            unknow_object(otmp);
        }
        /* if otmp has flags set for how it left hero's inventory, change
           those flags; if thrown, now stolen and autopickup might override
           pickup_types and autopickup exceptions based on 'pickup_stolen'
           rather than 'pickup_thrown'; if previously stolen, stays stolen;
           if previously dropped, now forgotten and autopickup will operate
           normally regardless of the setting for 'dropped_nopick' */
        if (otmp.how_lost == 1) {
            otmp.how_lost = 3;
        } else if (otmp.how_lost == 2) {
            otmp.how_lost = 0;
        }
    }
    /* Must do carrying effects on object prior to add_to_minv() */
    carry_obj_effects(otmp);
    /* add_to_minv() might free otmp [if merged with something else],
       so we have to call it after doing the object checks */
    freed_otmp = add_to_minv(mtmp, otmp);
    /* and we had to defer this until object is in mtmp's inventory */
    if (snuff_otmp) {
        snuff_light_source(mtmp.mx, mtmp.my);
    }
    return freed_otmp;
}
/* called for AD_SAMU (the Wizard and quest nemeses) */
export function stealamulet(mtmp) {
    let buf = '';
    let otmp = null;
    let obj = null;
    let real = 0;
    let fake = 0;
    let n = 0;
    /* target every quest artifact, not just current role's;
       if hero has more than one, choose randomly so that player
       can't use inventory ordering to influence the theft */
    for (n = 0 , obj = game.invent; obj; obj = obj.nobj) {
        if (((obj).oartifact >= ART_ORB_OF_DETECTION)) {
            ++n , otmp = obj;
        }
    }
    if (n > 1) {
        n = rnd(n);
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if (((otmp).oartifact >= ART_ORB_OF_DETECTION) && !--n) {
                break;
            }
        }
    }
    if (!otmp) {
        if (game.u.uhave.amulet) {
            /* if we didn't find any quest artifact, find another valuable item */
            real = AMULET_OF_YENDOR;
            fake = FAKE_AMULET_OF_YENDOR;
        } else if (game.u.uhave.bell) {
            real = BELL_OF_OPENING;
            fake = BELL;
        } else if (game.u.uhave.book) {
            real = SPE_BOOK_OF_THE_DEAD;
        } else if (game.u.uhave.menorah) {
            real = CANDELABRUM_OF_INVOCATION;
        /* you have nothing of special interest */
        } else {
            return;
        }
        /* If we get here, real and fake have been set up. */
        for (n = 0 , obj = game.invent; obj; obj = obj.nobj) {
            if (obj.otyp == real || (obj.otyp == fake && !mtmp.iswiz)) {
                ++n , otmp = obj;
            }
        }
        if (n > 1) {
            n = rnd(n);
            for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                if ((otmp.otyp == real || (otmp.otyp == fake && !mtmp.iswiz)) && !--n) {
                    break;
                }
            }
        }
    }
    if (otmp) {
        /* we have something to snatch */
        /* take off outer gear if we're targeting [hypothetical]
           quest artifact suit, shirt, gloves, or rings */
        if ((otmp == game.uarm || otmp == game.uarmu) && game.uarmc) {
            worn_item_removal(mtmp, game.uarmc);
        }
        if (otmp == game.uarmu && game.uarm) {
            worn_item_removal(mtmp, game.uarm);
        }
        if ((otmp == game.uarmg || ((otmp == game.uright || otmp == game.uleft) && game.uarmg)) && game.uwep) {
            /* gloves are about to be unworn; unwield weapon(s) first */
            /* remove_worn_item(uswapwep) indirectly */
            if (game.u.twoweap) {
                worn_item_removal(mtmp, game.uswapwep);
            }
            worn_item_removal(mtmp, game.uwep);
        }
        if ((otmp == game.uright || otmp == game.uleft) && game.uarmg) {
            worn_item_removal(mtmp, game.uarmg);
        }
        /* finally, steal the target item */
        if (otmp.owornmask) {
            worn_item_removal(mtmp, otmp);
        }
        if (otmp.unpaid) {
            subfrombill(otmp, shop_keeper(game.u.ushops));
        }
        freeinv(otmp);
        buf = strcpy(buf, doname(otmp));
        mpickobj(mtmp, otmp);
        pline("%s steals %s!", Some_Monnam(mtmp), buf);
        if ((((mtmp.data).mflags1 & 33554432) != 0) && !tele_restrict(mtmp)) {
            rloc(mtmp, 2);
        }
        encumber_msg();
    }
}
/* when a mimic gets poked with something, it might take that thing
   (at present, only implemented for when the hero does the poking) */
/* percent chance for ordinary item, artifact */
export function maybe_absorb_item(mon, obj, ochance, achance) {
    if (obj == game.uball || obj == game.uchain || obj.oclass == ROCK_CLASS || obj_resists(obj, 100 - ochance, 100 - achance) || !touch_artifact(obj, mon)) {
        return;
    }
    if (((obj).where == 3)) {
        if (obj.owornmask) {
            remove_worn_item(obj, (1));
        }
        if (obj.unpaid) {
            subfrombill(obj, shop_keeper(game.u.ushops));
        }
        if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
            /* Some_Monnam() avoids "It pulls ... and absorbs it!"
               if hero can see the location but not the monster */
            pline("%s pulls %s away from you and absorbs %s!", Some_Monnam(mon), yname(obj), (obj.quan > 1) ? "them" : "it");
        } else {
            let hand_s = body_part(HAND);
            if (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_big)) {
                hand_s = makeplural(hand_s);
            }
            pline("%s %s pulled from your %s!", upstart(yname(obj)), otense(obj, "are"), hand_s);
        }
        freeinv(obj);
        encumber_msg();
    } else {
        /* not carried; presumably thrown or kicked */
        if ((canseemon(mon) || sensemon(mon))) {
            pline("%s absorbs %s!", Monnam(mon), yname(obj));
        }
    }
    mpickobj(mon, obj);
}
/* drop one object taken from a (possibly dead) monster's inventory */
export function mdrop_obj(mon, obj, verbosely) {
    let omx = mon.mx;
    let omy = mon.my;
    let unwornmask = obj.owornmask;
    /* call distant_name() for its possible side-effects even if the result
       might not be printed, and do it before extracting obj from minvent */
    let obj_name = distant_name(obj, doname);
    extract_from_minvent(mon, obj, (0), (1));
    if (unwornmask && mon.mtame && (unwornmask & 1048576) != 0 && !obj.unpaid && costly_spot(omx, omy) && strchr(in_rooms(game.u.ux, game.u.uy, SHOPBASE), game.level.locations[omx][omy].roomno)) {
        /* don't charge for an owned saddle on dead steed (provided
        that the hero is within the same shop at the time) */
        /* being at costly_spot guarantees lev->roomno is not 0 */
        obj.no_charge = 1;
    }
    /* obj_no_longer_held(obj); -- done by place_object */
    if (verbosely && ((game.viz_array[omy][omx] & 2) != 0)) {
        pline_mon(mon, "%s drops %s.", Monnam(mon), obj_name);
    }
    if (!flooreffects(obj, omx, omy, "fall")) {
        place_object(obj, omx, omy);
        stackobj(obj);
    }
    /* do this last, after placing obj on floor; removing steed's saddle
       throws rider, possibly inflicting fatal damage and producing bones; this
       is why we had to call extract_from_minvent() with do_intrinsics=FALSE */
    if (!((mon).mhp < 1) && unwornmask) {
        update_mon_extrinsics(mon, obj, (0), (1));
    }
}
/* some monsters bypass the normal rules for moving between levels or
   even leaving the game entirely; when that happens, prevent them from
   taking the Amulet, invocation items, or quest artifact with them */
export function mdrop_special_objs(mon) {
    let obj = null;
    let otmp = null;
    for (obj = mon.minvent; obj; obj = otmp) {
        otmp = obj.nobj;
        if (obj_resists(obj, 0, 0) || is_quest_artifact(obj)) {
            if (mon.mx) {
                /* the Amulet, invocation tools, and Rider corpses resist even when
           artifacts and ordinary objects are given 0% resistance chance;
           current role's quest artifact is rescued too--quest artifacts
           for the other roles are not */
                mdrop_obj(mon, obj, (0));
            } else {
                /* migrating monster not on map */
                extract_from_minvent(mon, obj, (1), (1));
                rloco(obj);
            }
        }
    }
}
/* release the objects the creature is carrying */
/* If true, pet should keep wielded/worn items */
export function relobj(mtmp, show, is_pet) {
    let otmp = null;
    let omx = mtmp.mx;
    let omy = mtmp.my;
    if (mtmp.isgd && (otmp = findgold(mtmp.minvent)) != null) {
        /* vault guard's gold goes away rather than be dropped... */
        if ((canseemon(mtmp) || sensemon(mtmp))) {
            pline("%s gold %s.", s_suffix(Monnam(mtmp)), canseemon(mtmp) ? "vanishes" : "seems to vanish");
        }
        obj_extract_self(otmp);
        obfree(otmp, null);
    }
    while ((otmp = (is_pet ? droppables(mtmp) : mtmp.minvent)) != null) {
        mdrop_obj(mtmp, otmp, is_pet && game.flags.verbose);
    }
    if (show && ((game.viz_array[omy][omx] & 2) != 0)) {
        newsym(omx, omy);
    }
}
/*steal.c*/
/* can't steal armor while wearing cloak - so steal the cloak. */
/* can't steal shirt while wearing cloak or suit */
/* calls Gloves_off() to handle wielded cockatrice corpse */
