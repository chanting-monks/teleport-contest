import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	dogmove.c	$NHDT-Date: 1725733007 2024/09/07 18:16:47 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.156 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, Your, pline } from '../c2js-runtime/pline.js';
import { strchr, strcpy } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { m_unleash } from './apply.js';
import { dirtocoord, isok, xytodir } from './cmd.js';
import { is_lava, is_pool } from './dbridge.js';
import { c_common_strings, cg } from './decl.js';
import { canseemon, glyph_at, mon_visible, newsym, sensemon } from './display.js';
import { Mgender, Monnam, noit_Monnam, pmname, y_monnam } from './do_name.js';
import { dogfood } from './dog.js';
import { defsyms } from './drawing.js';
import { on_level } from './dungeon.js';
import { eaten_stat } from './eat.js';
import { may_dig } from './hack.js';
import { dist2, distmin } from './hacklib.js';
import { currency, sobj_at } from './invent.js';
import { mattackm, mdisplacem } from './mhitm.js';
import { mattacku } from './mhitu.js';
import { lose_guardian_angel } from './minion.js';
import { costly_alteration, obj_extract_self, splitobj } from './mkobj.js';
import { can_carry, check_gear_next_turn, m_consume_obj, mfndpos, mon_allowflags, mondied, monnear } from './mon.js';
import { Resists_Elem, attacktype, locomotion, max_passive_dmg, pronoun_gender, resist_conflict } from './mondata.js';
import { bee_eat_jelly, m_avoid_kicked_loc, m_avoid_soko_push_loc, m_digweapon_check, mon_track_add, onscary, set_apparxy, should_displace, undesirable_disp } from './monmove.js';
import { mon_reflects } from './muse.js';
import { ACCFOOD, APPORT, BALL_CLASS, BOULDER, CADAVER, CHAIN_CLASS, COIN_CLASS, CONFLICT, CORPSE, COST_CONTENTS, COST_DEGRD, CREDIT_CARD, DEAF, DISMOUNT_POLY, DISMOUNT_THROWN, DOGFOOD, DOOR, DWARVISH_MATTOCK, FIRST_OBJECT, FOOD_CLASS, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GOLD_PIECE, HALLUC, HALLUC_RES, HIGH_PM, LOCK_PICK, LOW_PM, LUMP_OF_ROYAL_JELLY, MAGIC_PORTAL, MANFOOD, MS_GUARDIAN, MS_LEADER, M_AP_FURNITURE, M_AP_MONSTER, M_AP_NOTHING, M_AP_OBJECT, NEED_HTH_WEAPON, NEED_WEAPON, NUMMONS, NUM_OBJECTS, N_DIRS_Z, PICK_AXE, PM_CHICKATRICE, PM_COCKATRICE, PM_DOG, PM_FIRE_ELEMENTAL, PM_FLOATING_EYE, PM_GELATINOUS_CUBE, PM_GIANT_RAT, PM_HOUSECAT, PM_KILLER_BEE, PM_KITTEN, PM_LARGE_CAT, PM_LARGE_DOG, PM_LITTLE_DOG, PM_LONG_WORM, PM_RUST_MONSTER, PM_SALAMANDER, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, POOL, PROT_FROM_SHAPE_CHANGERS, P_PICK_AXE, ROCK_CLASS, ROOM, SCR_MAIL, SKELETON_KEY, STONE_RES, S_DOG, S_EYE, S_LIGHT, S_MIMIC, S_VAMPIRE, S_sink, TOOL_CLASS, TRIPE_RATION, UNDEF, UNICORN_HORN, WEAPON_CLASS } from './nh-constants.js';
import { an, distant_name, doname, vtense, xname } from './objnam.js';
import { pline_mon, pline_xy } from './pline.js';
import { m_in_out_region } from './region.js';
import { rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { unpaid_cost } from './shk.js';
import { beg, domonnoise, whimper } from './sounds.js';
import { On_stairs } from './stairs.js';
import { mpickobj, relobj } from './steal.js';
import { dismount_steed, place_monster } from './steed.js';
import { goodpos } from './teleport.js';
import { gettrack } from './track.js';
import { t_at } from './trap.js';
import { clear_path, do_clear_area } from './vision.js';
import { mon_wield_item } from './weapon.js';
import { which_armor } from './worn.js';

/* pick a carried item for pet to drop */
let __droppables_dummy = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
export function droppables(mon) {
    /*
     * 'key|pickaxe|&c = &dummy' is used to make various creatures
     * that can't use a key/pick-axe/&c behave as if they are already
     * holding one so that any other such item in their inventory will
     * be considered a duplicate and get treated as a normal candidate
     * for dropping.
     *
     * This could be 'auto', but then 'gcc -O2' warns that this function
     * might return the address of a local variable.  It's mistaken,
     * &dummy is never returned.  'static' is simplest way to shut it up.
     */
    let obj = null;
    let wep = null;
    let pickaxe = null;
    let unihorn = null;
    let key = null;
    Object.assign(__droppables_dummy, cg.zeroobj);
    /* not STRANGE_OBJECT or tools of interest */
    __droppables_dummy.otyp = GOLD_PIECE;
    /* so real artifact won't override "don't keep it" */
    __droppables_dummy.oartifact = 1;
    pickaxe = unihorn = key = null;
    wep = ((mon).mw);
    if ((((mon.data).mflags1 & 262144) != 0) || (((mon.data).mflags1 & 65536) != 0)) {
        /* won't hang on to any objects of these types */
        /* act as if already have them */
        pickaxe = unihorn = key = __droppables_dummy;
    } else {
        /* don't hang on to pick-axe if can't use one or don't need one */
        if (!(((mon.data).mflags1 & 32) != 0) || !(((mon.data).mflags1 & 64) != 0)) {
            pickaxe = __droppables_dummy;
        }
        /* don't hang on to key if can't open doors */
        if ((((mon.data).mflags1 & 8192) != 0) || ((mon.data).msize < 1)) {
            key = __droppables_dummy;
        }
    }
    if (wep) {
        if (((wep.oclass == WEAPON_CLASS || wep.oclass == TOOL_CLASS) && game.objects[wep.otyp].oc_subtyp == P_PICK_AXE)) {
            pickaxe = wep;
        }
        /* don't need any wielded check for keys... */
        if (wep.otyp == UNICORN_HORN) {
            unihorn = wep;
        }
    }
    for (obj = mon.minvent; obj; obj = obj.nobj) {
        switch (obj.otyp) {
            case DWARVISH_MATTOCK:
                if (which_armor(mon, 8)) {
                    break;
                }
                /* keep mattock in preference to pick unless pick is already
               wielded or is an artifact and mattock isn't */
                if (pickaxe && pickaxe.otyp == PICK_AXE && pickaxe != wep && (!pickaxe.oartifact || obj.oartifact)) {
                    return pickaxe;
                }
                ;
            case PICK_AXE:
                if (!pickaxe || (obj.oartifact && !pickaxe.oartifact)) {
                    /* reject mattock if couldn't wield it */
                    /* drop the one we earlier decided to keep */
                    if (pickaxe) {
                        return pickaxe;
                    }
                    pickaxe = obj;
                    continue;
                }
                break;
            case UNICORN_HORN:
                if (obj.cursed) {
                    break;
                }
                if (!unihorn || (obj.oartifact && !unihorn.oartifact)) {
                    /* reject cursed unicorn horns */
                    /* keep artifact unihorn in preference to ordinary one */
                    if (unihorn) {
                        return unihorn;
                    }
                    unihorn = obj;
                    continue;
                }
                break;
            case SKELETON_KEY:
                if (key && key.otyp == LOCK_PICK && (!key.oartifact || obj.oartifact)) {
                    return key;
                }
                ;
            case LOCK_PICK:
                if (key && key.otyp == CREDIT_CARD && (!key.oartifact || obj.oartifact)) {
                    return key;
                }
                ;
            case CREDIT_CARD:
                if (!key || (obj.oartifact && !key.oartifact)) {
                    /* keep key in preference to lock-pick */
                    /* keep lock-pick in preference to credit card */
                    if (key) {
                        return key;
                    }
                    /* keep this unlocking tool */
                    key = obj;
                    continue;
                }
                break;
            default:
                break;
        }
        if (!obj.owornmask && obj != wep) {
            return obj;
        }
    }
    return null;
}
const nofetch = [BALL_CLASS, CHAIN_CLASS, ROCK_CLASS, 0];
export function cursed_object_at(x, y) {
    let otmp = null;
    for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp.cursed) {
            return (1);
        }
    }
    return (0);
}
export function dog_nutrition(mtmp, obj) {
    fnEnter("dog_nutrition", "dogmove.c", 0);
    let nutrit = 0;
    if (obj.oclass == FOOD_CLASS) {
        if (obj.otyp == CORPSE) {
            /*
     * It is arbitrary that the pet takes the same length of time to eat
     * as a human, but gets more nutritional value.
     */
            mtmp.meating = 3 + (game.mons[obj.corpsenm].cwt >> 6);
            nutrit = game.mons[obj.corpsenm].cnutrit;
        } else {
            mtmp.meating = game.objects[obj.otyp].oc_delay;
            nutrit = game.objects[obj.otyp].oc_nutrition;
        }
        switch (mtmp.data.msize) {
            case 0:
                nutrit *= 8;
                break;
            case 1:
                nutrit *= 6;
                break;
            default:
            case 2:
                nutrit *= 5;
                break;
            case 3:
                nutrit *= 4;
                break;
            case 4:
                nutrit *= 3;
                break;
            case 7:
                nutrit *= 2;
                break;
        }
        if (obj.oeaten) {
            mtmp.meating = eaten_stat(mtmp.meating, obj);
            nutrit = eaten_stat(nutrit, obj);
        }
    } else if (obj.oclass == COIN_CLASS) {
        mtmp.meating = (Math.trunc(obj.quan / 2000)) + 1;
        if (mtmp.meating < 0) {
            mtmp.meating = 1;
        }
        nutrit = (Math.trunc(obj.quan / 20));
        if (nutrit < 0) {
            nutrit = 0;
        }
    } else {
        /* Unusual pet such as gelatinous cube eating odd stuff.
         * meating made consistent with wild monsters in mon.c.
         * nutrit made consistent with polymorphed player nutrit in
         * eat.c.  (This also applies to pets eating gold.)
         */
        mtmp.meating = Math.trunc(obj.owt / 20) + 1;
        nutrit = 5 * game.objects[obj.otyp].oc_nutrition;
    }
    return nutrit;
}
/* returns 2 if pet dies, otherwise 1 */
/* if unpaid, then thrown or kicked by hero */
/* dog's starting location, */
/* might be different from current */
export function dog_eat(mtmp, obj, x, y, devour) {
    fnEnter("dog_eat", "dogmove.c", 0);
    let edog = ((mtmp).mextra.edog);
    let nutrit = 0;
    let res = 0;
    let oprice = 0;
    let objnambuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let obj_name = null;
    objnambuf[0] = 0;
    if (edog.hungrytime < game.moves) {
        edog.hungrytime = game.moves;
    }
    nutrit = dog_nutrition(mtmp, obj);
    if (devour) {
        if (mtmp.meating > 1) {
            mtmp.meating = Math.trunc(mtmp.meating / 2);
        }
        if (nutrit > 1) {
            nutrit = Math.trunc((nutrit * 3) / 4);
        }
    }
    edog.hungrytime += nutrit;
    mtmp.mconf = 0;
    if (edog.mhpmax_penalty) {
        mtmp.mhpmax += edog.mhpmax_penalty;
        edog.mhpmax_penalty = 0;
    }
    if (mtmp.mflee && mtmp.mfleetim > 1) {
        mtmp.mfleetim = Math.trunc(mtmp.mfleetim / 2);
    }
    if (mtmp.mtame < 20) {
        mtmp.mtame++;
    }
    if (x != mtmp.mx || y != mtmp.my) {
        /* moved & ate on same turn */
        newsym(x, y);
        newsym(mtmp.mx, mtmp.my);
    }
    if (mtmp.data == game.mons[PM_KILLER_BEE] && obj.otyp == LUMP_OF_ROYAL_JELLY && (res = bee_eat_jelly(mtmp, obj)) >= 0) {
        return (res + 1);
    }
    /* 1 -> 2, 0 -> 1; -1, keep going */
    /* food items are eaten one at a time; entire stack for other stuff */
    if (obj.quan > 1 && obj.oclass == FOOD_CLASS) {
        obj = splitobj(obj, 1);
    }
    if (obj.unpaid) {
        game.iflags.suppress_price++;
    }
    if (is_pool(mtmp.mx, mtmp.my) && !(game.u.uinwater)) {} else {
        /* bypass most of dog_eat(), including apport update */
        /* TODO: Reveal presence of sea monster (especially sharks) */
        /* food is at monster's current location, <mx,my>;
           <x,y> was monster's location at start of this turn;
           they might be the same but will be different when
           the monster is moving+eating on same turn */
        let seeobj = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
        let sawpet = ((game.viz_array[y][x] & 2) != 0) && mon_visible(mtmp);
        if (sawpet || (seeobj && (canseemon(mtmp) || sensemon(mtmp)))) {
            /* Observe the action if either the food location or the pet
           itself is in view.  When pet which was in view moves to an
           unseen spot to eat the food there, avoid referring to that
           pet as "it".  However, we want "it" if invisible/unsensed
           pet eats visible food. */
            /* call distant_name() for possible side-effects even if the
               result won't be printed */
            obj_name = distant_name(obj, doname);
            if ((((mtmp.data).mflags1 & 32) != 0)) {
                pline_mon(mtmp, "%s digs in.", noit_Monnam(mtmp));
            } else {
                pline_mon(mtmp, "%s %s %s.", noit_Monnam(mtmp), devour ? "devours" : "eats", obj_name);
            }
        } else if (seeobj) {
            obj_name = distant_name(obj, doname);
            pline("It %s %s.", devour ? "devours" : "eats", obj_name);
        }
    }
    if (obj.unpaid) {
        objnambuf = strcpy(objnambuf, xname(obj));
        game.iflags.suppress_price--;
    }
    if (mtmp.data == game.mons[PM_RUST_MONSTER] && obj.oerodeproof) {
        /* The object's rustproofing is gone now */
        if (obj.unpaid) {
            costly_alteration(obj, COST_DEGRD);
        }
        obj.oerodeproof = 0;
        mtmp.mstun = 1;
        if (canseemon(mtmp)) {
            obj_name = distant_name(obj, doname);
            if (game.flags.verbose) {
                pline("%s spits %s out in disgust!", Monnam(mtmp), obj_name);
            }
        }
    } else {
        if (dogfood(mtmp, obj) == DOGFOOD && obj.invlet) {
            /* It's a reward if it's DOGFOOD and the player dropped/threw it.
           We know the player had it if invlet is set. -dlc */
            let prior_apport = edog.apport;
            edog.apport += (Math.trunc(200 / (edog.dropdist + game.moves - edog.droptime)));
            if (edog.apport <= 0) {
                impossible("dog_eat: pet apport <= 0 (%d, %d, %ld, %ld, %d, %u, %u)", edog.apport, edog.dropdist, edog.droptime, game.moves, prior_apport, mtmp.m_id, edog.parentmid);
                edog.apport = 1;
            }
        }
        if (obj.unpaid) {
            /* check whether edog struct got clobbered;
                              these two values should always match if
                              edog content is still intact */
            /* edible item owned by shop has been thrown or kicked
               by hero and caught by tame or food-tameable monst */
            oprice = unpaid_cost(obj, COST_CONTENTS);
            /* m_consume_obj() -> delobj() -> obfree() will handle the shop
               billing update */
            pline("That %s will cost you %ld %s.", objnambuf, oprice, currency(oprice));
        }
        m_consume_obj(mtmp, obj);
    }
    return (((mtmp).mhp < 1)) ? 2 : 1;
}
export function dog_starve(mtmp) {
    if (mtmp.mleashed && mtmp != game.u.usteed) {
        Your("leash goes slack.");
    } else if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
        pline_mon(mtmp, "%s starves.", Monnam(mtmp));
    } else {
        You_feel("%s for a moment.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "bummed" : "sad");
    }
    mondied(mtmp);
}
/* hunger effects -- returns TRUE on starvation */
export function dog_hunger(mtmp, edog) {
    if (game.moves > edog.hungrytime + 500) {
        if (!(((mtmp.data).mflags1 & 536870912) != 0) && !(((mtmp.data).mflags1 & 1073741824) != 0)) {
            /* but not too high; it might polymorph */
            edog.hungrytime = game.moves + 500;
        } else if (!edog.mhpmax_penalty) {
            /* starving pets are limited in healing */
            let newmhpmax = Math.trunc(mtmp.mhpmax / 3);
            mtmp.mconf = 1;
            edog.mhpmax_penalty = mtmp.mhpmax - newmhpmax;
            mtmp.mhpmax = newmhpmax;
            if (mtmp.mhp > mtmp.mhpmax) {
                mtmp.mhp = mtmp.mhpmax;
            }
            if (((mtmp).mhp < 1)) {
                dog_starve(mtmp);
                return (1);
            }
            if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                pline_mon(mtmp, "%s is confused from hunger.", Monnam(mtmp));
            } else if (((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
                beg(mtmp);
            } else {
                You_feel("worried about %s.", y_monnam(mtmp));
            }
            stop_occupation();
        } else if (game.moves > edog.hungrytime + 750 || ((mtmp).mhp < 1)) {
            dog_starve(mtmp);
            return (1);
        }
    }
    return (0);
}
/* do something with object (drop, pick up, eat) at current position
 * returns 1 if object eaten (since that counts as dog's move), 2 if died
 */
export function dog_invent(mtmp, edog, udist) {
    fnEnter("dog_invent", "dogmove.c", 0);
    let omx = 0;
    let omy = 0;
    let carryamt = 0;
    let obj = null;
    let otmp = null;
    if (((mtmp).msleeping || !(mtmp).mcanmove) || mtmp.meating) {
        return 0;
    }
    omx = mtmp.mx;
    omy = mtmp.my;
    if (droppables(mtmp)) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        if (!rn2(udist + 1) || !rn2(edog.apport)) {
            if (rn2(10) < edog.apport) {
                /* If we are carrying something then we drop it (perhaps near @).
     * Note: if apport == 1 then our behavior is independent of udist.
     * Use udist+1 so steed won't cause divide by zero.
     */
                relobj(mtmp, mtmp.minvis, (1));
                if (edog.apport > 1) {
                    edog.apport--;
                }
                edog.dropdist = udist;
                edog.droptime = game.moves;
            }
        }
    } else {
        if ((obj = game.level.objects[omx][omy]) != null && !strchr(nofetch, obj.oclass) && obj.otyp != SCR_MAIL && !(((obj).o_id == game.context.achieveo.mines_prize_oid) || ((obj).o_id == game.context.achieveo.soko_prize_oid))) {
            /* avoid special items; once hero picks them up, they'll cease
               being special and become eligible for normal monst activity */
            let edible = dogfood(mtmp, obj);
            if ((edible <= CADAVER || (edog.mhpmax_penalty && edible == ACCFOOD)) && could_reach_item(mtmp, obj.ox, obj.oy)) {
                return dog_eat(mtmp, obj, omx, omy, (0));
            }
            carryamt = can_carry(mtmp, obj);
            if (carryamt > 0 && !obj.cursed && could_reach_item(mtmp, obj.ox, obj.oy)) {
                if (rn2(20) < edog.apport + 3) {
                    if (rn2(udist) || !rn2(edog.apport)) {
                        /* starving pet is more aggressive about eating */
                        otmp = obj;
                        if (carryamt != obj.quan) {
                            otmp = splitobj(obj, carryamt);
                        }
                        if (((game.viz_array[omy][omx] & 2) != 0)) {
                            /* call distant_name() for possible side-effects
                               even if the result won't be printed; should be
                               done before extract+pickup for distant_name()
                               -> doname() -> xname() -> find_artifact()
                               while otmp is still on floor */
                            let otmpname = distant_name(otmp, doname);
                            if (game.flags.verbose) {
                                pline_xy(omx, omy, "%s picks up %s.", Monnam(mtmp), otmpname);
                            }
                        }
                        obj_extract_self(otmp);
                        newsym(omx, omy);
                        mpickobj(mtmp, otmp);
                        if (attacktype(mtmp.data, 254) && mtmp.weapon_check == NEED_WEAPON) {
                            mtmp.weapon_check = NEED_HTH_WEAPON;
                            mon_wield_item(mtmp);
                        }
                        check_gear_next_turn(mtmp);
                    }
                }
            }
        }
    }
    return 0;
}
/* set dog's goal -- gtyp, gx, gy;
   returns -1/0/1 (dog's desire to approach player) or -2 (abort move) */
export function dog_goal(mtmp, edog, after, udist, whappr) {
    fnEnter("dog_goal", "dogmove.c", 0);
    let omx = 0;
    let omy = 0;
    let in_masters_sight = 0;
    let dog_has_minvent = 0;
    let obj = null;
    let otyp = 0;
    let appr = 0;
    /* Steeds don't move on their own will */
    if (mtmp == game.u.usteed) {
        return -2;
    }
    omx = mtmp.mx;
    omy = mtmp.my;
    in_masters_sight = ((game.viz_array[omy][omx] & 1) != 0);
    dog_has_minvent = (droppables(mtmp) != null);
    if (!edog || mtmp.mleashed) {
        /* he's not going anywhere... */
        game.gtyp = APPORT;
        /* follow player if appropriate */
        game.gx = game.u.ux;
        game.gy = game.u.uy;
    } else {
        let min_x = 0;
        let max_x = 0;
        let min_y = 0;
        let max_y = 0;
        let nx = 0;
        let ny = 0;
        game.gtyp = UNDEF;
        /* suppress 'used before set' message */
        game.gx = game.gy = 0;
        if ((min_x = omx - 5) < 1) {
            min_x = 1;
        }
        if ((max_x = omx + 5) >= 80) {
            max_x = 80 - 1;
        }
        if ((min_y = omy - 5) < 0) {
            min_y = 0;
        }
        if ((max_y = omy + 5) >= 21) {
            max_y = 21 - 1;
        }
        for (obj = game.level.objlist; obj; obj = obj.nobj) {
            /* nearby food is the first choice, then other objects */
            nx = obj.ox;
            ny = obj.oy;
            if (nx >= min_x && nx <= max_x && ny >= min_y && ny <= max_y) {
                otyp = dogfood(mtmp, obj);
                if (otyp > game.gtyp || otyp == UNDEF) {
                    continue;
                }
                /* avoid cursed items unless starving */
                if (cursed_object_at(nx, ny) && !(edog.mhpmax_penalty && otyp < MANFOOD)) {
                    continue;
                }
                /* skip completely unreachable goals */
                if (!could_reach_item(mtmp, nx, ny) || !can_reach_location(mtmp, mtmp.mx, mtmp.my, nx, ny)) {
                    continue;
                }
                if (otyp < MANFOOD) {
                    if (otyp < game.gtyp || (dist2(nx, ny, omx, omy)) < (dist2(game.gx, game.gy, omx, omy))) {
                        game.gx = nx;
                        game.gy = ny;
                        game.gtyp = otyp;
                    }
                } else if (game.gtyp == UNDEF && in_masters_sight && !dog_has_minvent && (!game.level.locations[omx][omy].lit || game.level.locations[game.u.ux][game.u.uy].lit) && (otyp == MANFOOD || clear_path((mtmp).mx, (mtmp).my, (nx), (ny))) && edog.apport > rn2(8) && can_carry(mtmp, obj) > 0) {
                    game.gx = nx;
                    game.gy = ny;
                    game.gtyp = APPORT;
                }
            }
        }
    }
    if (game.gtyp == UNDEF || (game.gtyp != DOGFOOD && game.gtyp != APPORT && game.moves < edog.hungrytime)) {
        game.gx = game.u.ux;
        game.gy = game.u.uy;
        if (after && udist <= 4 && ((game.gx) == game.u.ux && (game.gy) == game.u.uy)) {
            return -2;
        }
        appr = (udist >= 9) ? 1 : (mtmp.mflee) ? -1 : 0;
        if (udist > 1) {
            if (!((game.level.locations[game.u.ux][game.u.uy].typ) >= ROOM) || !rn2(4) || whappr || (dog_has_minvent && rn2(edog.apport))) {
                /* if you have dog food it'll follow you more closely; if you are
           on stairs (or ladder) or on or next to a magic portal, it will
           behave as if you have dog food */
                appr = 1;
            }
        }
        if (appr == 0) {
            if (On_stairs(game.u.ux, game.u.uy)) {
                appr = 1;
            } else {
                for (obj = game.invent; obj; obj = obj.nobj) {
                    if (dogfood(mtmp, obj) == DOGFOOD) {
                        appr = 1;
                        break;
                    }
                }
                if (appr == 0) {
                    let t = null;
                    for (t = game.ftrap; t; t = t.ntrap) {
                        if (t.ttyp == MAGIC_PORTAL) {
                            /* assume at most one magic portal per level;
                       [should this be limited to known portals?] */
                            if (dist2((t.tx), (t.ty), game.u.ux, game.u.uy) <= 2) {
                                appr = 1;
                            }
                            break;
                        }
                    }
                }
            }
        }
    } else {
        appr = 1;
    }
    if (mtmp.mconf) {
        appr = 0;
    }
    if (((game.gx) == game.u.ux && (game.gy) == game.u.uy) && !in_masters_sight) {
        let cp = null;
        cp = gettrack(omx, omy);
        if (cp) {
            game.gx = cp.x;
            game.gy = cp.y;
            if (edog) {
                edog.ogoal.x = 0;
            }
        } else {
            if (edog && edog.ogoal.x && (edog.ogoal.x != omx || edog.ogoal.y != omy)) {
                /* assume master hasn't moved far, and reuse previous goal */
                game.gx = edog.ogoal.x;
                game.gy = edog.ogoal.y;
                edog.ogoal.x = 0;
            } else {
                let fardist = (80 + 2) * (80 + 2);
                game.gx = game.gy = (80 + 2);
                do_clear_area(omx, omy, 9, wantdoor, fardist);
                if (game.gx == (80 + 2) || (game.gx == omx && game.gy == omy)) {
                    /* here gx == FARAWAY e.g. when dog is in a vault */
                    game.gx = game.u.ux;
                    game.gy = game.u.uy;
                } else if (edog) {
                    edog.ogoal.x = game.gx;
                    edog.ogoal.y = game.gy;
                }
            }
        }
    } else if (edog) {
        edog.ogoal.x = 0;
    }
    return appr;
}
export function find_targ(mtmp, dx, dy, maxdist) {
    let targ = null;
    let curx = mtmp.mx;
    let cury = mtmp.my;
    let dist = 0;
    for (; dist < maxdist; ++dist) {
        curx += dx;
        cury += dy;
        if (!isok(curx, cury)) {
            break;
        }
        /* FIXME: Check if we hit a wall/door/boulder to
         *        short-circuit unnecessary subsequent checks
         */
        /* If we can't see up to here, forget it - will this
         * mean pets in corridors don't breathe at monsters
         * in rooms? If so, is that necessarily bad?
         */
        /* If the pet can't see beyond this point, don't
         * check any farther
         */
        if (!clear_path((mtmp).mx, (mtmp).my, (curx), (cury))) {
            break;
        }
        if (curx == mtmp.mux && cury == mtmp.muy) {
            return game.youmonst;
        }
        if ((targ = (game.level.monsters[curx][cury])) != null) {
            /* Is the monster visible to the pet? */
            if ((!targ.minvis || (((mtmp.data).mflags1 & 16777216) != 0)) && !targ.mundetected && targ.mx == curx && targ.my == cury) {
                break;
            }
            /* If the pet can't see it, it assumes it ain't there */
            targ = null;
        }
    }
    return targ;
}
export function find_friends(mtmp, mtarg, maxdist) {
    let pal = null;
    let dx = sgn(mtarg.mx - mtmp.mx);
    let dy = sgn(mtarg.my - mtmp.my);
    let curx = mtarg.mx;
    let cury = mtarg.my;
    let dist = distmin(mtarg.mx, mtarg.my, mtmp.mx, mtmp.my);
    for (; dist <= maxdist; ++dist) {
        curx += dx;
        cury += dy;
        if (!isok(curx, cury)) {
            /* maybe we tamed him while being swallowed --jgm */
            return 0;
        }
        if (!clear_path((mtmp).mx, (mtmp).my, (curx), (cury))) {
            return 0;
        }
        /* Does pet think you're here? */
        if (mtmp.mux == curx && mtmp.muy == cury) {
            return 1;
        }
        pal = (game.level.monsters[curx][cury]);
        if (pal) {
            if (pal.mtame) {
                /* Pet won't notice invisible pets */
                if (!pal.minvis || (((mtmp.data).mflags1 & 16777216) != 0)) {
                    return 1;
                }
            } else {
                /* Quest leaders and guardians are always seen */
                if (pal.data.msound == MS_LEADER || pal.data.msound == MS_GUARDIAN) {
                    return 1;
                }
            }
        }
    }
    return 0;
}
export function score_targ(mtmp, mtarg) {
    fnEnter("score_targ", "dogmove.c", 0);
    let score = 0;
    if (!mtmp.mconf || !rn2(3) || (((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level))))) {
        /* If the monster is confused, normal scoring is disrupted -
     * anything may happen
     */
        /* Give 1 in 3 chance of safe breathing even if pet is confused or
     * if you're on the quest start level */
        let mtmp_lev = 0;
        let align1 = (-128);
        let align2 = (-128);
        let faith1 = (1);
        let faith2 = (1);
        if (mtmp.isminion) {
            align1 = ((mtmp).mextra.emin).min_align;
        } else if (mtmp.ispriest) {
            align1 = ((mtmp).mextra.epri).shralign;
        } else {
            faith1 = (0);
        }
        if (mtarg.isminion) {
            align2 = ((mtarg).mextra.emin).min_align;
        } else if (mtarg.ispriest) {
            align2 = ((mtarg).mextra.epri).shralign;
        } else {
            faith2 = (0);
        }
        /* Never target quest friendlies */
        if (mtarg.data.msound == MS_LEADER || mtarg.data.msound == MS_GUARDIAN) {
            return -5000;
        }
        if (faith1 && faith2 && align1 == align2 && mtarg.mpeaceful) {
            /* D: Fixed angelic beings using gaze attacks on coaligned priests */
            score -= 5000;
            return score;
        }
        if (distmin(mtmp.mx, mtmp.my, mtarg.mx, mtarg.my) <= 1) {
            /* Is the monster peaceful or tame? */
            /* Pets will never be targeted */
            /* Is master/pet behind monster? Check up to 15 squares beyond pet. */
            score -= 3000;
            return score;
        }
        if (mtarg.mtame || mtarg == game.youmonst) {
            score -= 3000;
            return score;
        }
        if (find_friends(mtmp, mtarg, 15)) {
            score -= 3000;
            return score;
        }
        /* Target hostile monsters in preference to peaceful ones */
        if (!mtarg.mpeaceful) {
            score += 10;
        }
        /* Is the monster passive? Don't waste energy on it, if so */
        if (mtarg.data.mattk[0].aatyp == 0) {
            score -= 1000;
        }
        /* Even weak pets with breath attacks shouldn't take on very
           low-level monsters. Wasting breath on lichens is ridiculous. */
        if ((mtarg.m_lev < 2 && mtmp.m_lev > 5) || (mtmp.m_lev > 12 && mtarg.m_lev < mtmp.m_lev - 9 && game.u.ulevel > 8 && mtarg.m_lev < game.u.ulevel - 7)) {
            score -= 25;
        }
        /* for strength purposes, a vampshifter in weak form (vampire bat,
           fog cloud, maybe wolf) will attack as if in vampire form;
           otherwise if won't do much and usually wouldn't suffer enough
           damage (from counterattacks) to switch back to vampire form;
           make it be more aggressive by behaving as if stronger */
        mtmp_lev = mtmp.m_lev;
        if (((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER) && mtmp.data.mlet != S_VAMPIRE) {
            /* is_vampshifter() implies (mtmp->cham >= LOW_PM) */
            mtmp_lev = game.mons[mtmp.cham].mlevel;
            /* actual vampire level would range from 1.0*mlvl to 1.5*mlvl */
            mtmp_lev += rn2(Math.trunc(mtmp_lev / 2) + 1);
            /* we don't expect actual level in weak form to exceed
               base level of strong form, but handle that if it happens */
            if (mtmp.m_lev > mtmp_lev) {
                mtmp_lev = mtmp.m_lev;
            }
        }
        /* And pets will hesitate to attack vastly stronger foes.
           This penalty will be discarded if master's in trouble. */
        if (mtarg.m_lev > mtmp_lev + 4) {
            score -= (mtarg.m_lev - mtmp_lev) * 20;
        }
        /* All things being the same, go for the beefiest monster. This
           bonus should not be large enough to override the pet's aversion
           to attacking much stronger monsters. */
        score += mtarg.m_lev * 2 + Math.trunc(mtarg.mhp / 3);
    }
    /* Fuzz factor to make things less predictable when very
       similar targets are abundant. */
    score += rnd(5);
    /* Pet may decide not to use ranged attack when confused */
    if (mtmp.mconf && !rn2(3)) {
        score -= 1000;
    }
    return score;
}
/* Pet */
export function best_target(mtmp, forced) {
    let dx = 0;
    let dy = 0;
    let bestscore = -40000;
    let currscore = 0;
    let best_targ = null;
    let temp_targ = null;
    if (!mtmp) {
        return null;
    }
    /* If the pet is blind, it's not going to see any target */
    if (!mtmp.mcansee) {
        return null;
    }
    for (dy = -1; dy < 2; ++dy) {
        for (dx = -1; dx < 2; ++dx) {
            /* Search for any monsters lined up with the pet, within an arbitrary
     * distance from the pet (7 squares, even along diagonals). Monsters
     * are assigned scores and the best score is chosen.
     */
            if (!dx && !dy) {
                continue;
            }
            /* Traverse the line to find the first monster within 7
             * squares. Invisible monsters are skipped (if the
             * pet doesn't have see invisible).
             */
            temp_targ = find_targ(mtmp, dx, dy, 7);
            if (!temp_targ) {
                continue;
            }
            /* Decide how attractive the target is */
            currscore = score_targ(mtmp, temp_targ);
            if (currscore > bestscore) {
                bestscore = currscore;
                best_targ = temp_targ;
            }
        }
    }
    /* Filter out targets the pet doesn't like */
    if (!forced && bestscore < 0) {
        best_targ = null;
    }
    return best_targ;
}
/* Pet considers and maybe executes a ranged attack */
export function pet_ranged_attk(mtmp, forced) {
    let mtarg = null;
    let hungry = 0;
    if (!mtmp.isminion) {
        let dog = ((mtmp).mextra.edog);
        hungry = (game.moves > (dog.hungrytime + 300));
    }
    /* Identify the best target in a straight line from the pet;
     * if there is such a target, we'll let the pet attempt an attack.
     */
    mtarg = best_target(mtmp, forced);
    if (mtarg && (!hungry || !rn2(5))) {
        /* Hungry pets are unlikely to use breath/spit attacks */
        let mstatus = 0;
        if (mtarg == game.youmonst) {
            if (mattacku(mtmp)) {
                return 2;
            }
            /* Treat this as the pet having initiated an attack even if it
             * didn't, so it will lose its move.  This isn't entirely fair,
             * but mattacku doesn't distinguish between "did not attack"
             * and "attacked but didn't die" cases, and this is preferable
             * to letting the pet attack the player and continuing to move.
             */
            mstatus = 1;
        } else {
            game.bhitpos.x = mtmp.mx , game.bhitpos.y = mtmp.my;
            game.notonhead = (0);
            mstatus = mattackm(mtmp, mtarg);
            /* Shouldn't happen, really */
            if (mstatus & 4) {
                return 2;
            }
            if ((mstatus & 1) && !(mstatus & 2) && rn2(4) && mtarg != game.youmonst) {
                if (mtarg.mcansee && (((mtarg.data).mflags1 & 4096) == 0)) {
                    /* Allow the targeted nasty to strike back - if
             * the targeted beast doesn't have a ranged attack,
             * nothing will happen.
             */
                    /* Can monster see?  If it can, it can retaliate
                 * even if the pet is invisible, since it'll see
                 * the direction from which the ranged attack came;
                 * if it's blind or unseeing, it can't retaliate
                 */
                    let mresp = 0;
                    game.bhitpos.x = mtmp.mx , game.bhitpos.y = mtmp.my;
                    game.notonhead = (0);
                    mresp = mattackm(mtarg, mtmp);
                    if (mresp & 2) {
                        return 2;
                    }
                }
            }
        }
        /* Only return 3 if the pet actually made a ranged attack, and
         * thus should lose the rest of its move.
         * There's a chain of assumptions here:
         * 1. score_targ and best_target will never select a monster
         *    that can be attacked in melee, so the mattackm call can
         *    only ever try ranged options
         * 2. if the only attacks available to mattackm are ranged
         *    options, and the monster cannot make a ranged attack, it
         *    will return M_ATTK_MISS.
         */
        if (mstatus != 0) {
            return 3;
        }
    } else if (forced) {
        domonnoise(mtmp);
    }
    return 0;
}
/* Return values (same as m_move):
 * 0: did not move, but can still attack and do other stuff.
 * 1: moved, possibly can attack.
 * 2: monster died.
 * 3: did not move, and can't do anything else either.
 *    (may have attacked something)
 */
/* pet */
/* this is extra fast monster movement */
export function dog_move(mtmp, after) {
    fnEnter("dog_move", "dogmove.c", 0);
    let omx = 0;
    let omy = 0;
    let appr = 0;
    let whappr = 0;
    let udist = 0;
    let i = 0;
    let j = 0;
    let k = 0;
    let edog = null;
    let obj = null;
    let otyp = 0;
    let cursemsg = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let do_eat = 0;
    let better_with_displacing = 0;
    let ranged_only = 0;
    let nix = 0;
    let niy = 0;
    let nx = 0;
    let ny = 0;
    let cnt = 0;
    let uncursedcnt = 0;
    let chcnt = 0;
    let chi = 0;
    let nidist = 0;
    let ndist = 0;
    let allowflags = 0;
    let mfp = { cnt: 0, poss: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], info: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    newdogpos: {
        edog = (mtmp.mtame && ((mtmp).mextra && ((mtmp).mextra.edog))) ? ((mtmp).mextra.edog) : null;
        obj = null;
        do_eat = (0);
        better_with_displacing = (0);
        /* position mtmp is (considering) moving to */
        chi = -1;
        if (!edog && !mtmp.isminion) {
            /*
     * Tame Angels have isminion set and an ispriest structure instead of
     * an edog structure.  Fortunately, guardian Angels need not worry
     * about mundane things like eating and fetching objects, and can
     * spend all their energy defending the player.  (They are the only
     * monsters with other structures that can be tame.)
     */
            impossible("dog_move for non-pet?");
            return 0;
        }
        omx = mtmp.mx;
        omy = mtmp.my;
        if (edog && dog_hunger(mtmp, edog)) {
            return 2;
        }
        udist = dist2((omx), (omy), game.u.ux, game.u.uy);
        if (mtmp == game.u.usteed) {
            if ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !resist_conflict(mtmp)) {
                /* Let steeds eat and maybe throw rider during Conflict */
                dismount_steed(DISMOUNT_THROWN);
                return 1;
            }
            udist = 1;
        } else if (!udist) {
            return 0;
        }
        nix = omx;
        niy = omy;
        cursemsg[0] = (0);
        if (edog) {
            j = dog_invent(mtmp, edog, udist);
            if (j == 2 || ((mtmp).mstate != 0)) {
                return ((mtmp).mhp < 1) ? 2 : 3;
            } else if (j == 1) {
                break newdogpos;
            }
            whappr = (game.moves - edog.whistletime < 5);
        } else {
            whappr = 0;
        }
        appr = dog_goal(mtmp, edog, after, udist, whappr);
        if (appr == -2) {
            return 0;
        }
        if ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !resist_conflict(mtmp)) {
            if (!edog) {
                /* Guardian angel refuses to be conflicted; rather,
             * it disappears, angrily, and sends in some nasties
             */
                lose_guardian_angel(mtmp);
                return 2;
            }
        }
        /* [this is now handled in dochug()] */
        /* swallowed case handled above */
        allowflags = mon_allowflags(mtmp);
        cnt = mfndpos(mtmp, mfp, allowflags);
        /* Normally dogs don't step on cursed items, but if they have no
     * other choice they will.  This requires checking ahead of time
     * to see how many uncursed item squares are around.
     */
        uncursedcnt = 0;
        for (i = 0; i < cnt; i++) {
            nx = mfp.poss[i].x;
            ny = mfp.poss[i].y;
            if ((game.level.monsters[nx][ny] != null) && !((mfp.info[i] & 524288) || mfp.info[i] & 4096)) {
                continue;
            }
            if (cursed_object_at(nx, ny)) {
                continue;
            }
            uncursedcnt++;
        }
        better_with_displacing = should_displace(mtmp, mfp, game.gx, game.gy);
        chcnt = 0;
        chi = -1;
        nidist = (dist2(nix, niy, game.gx, game.gy));
        for (i = 0; i < cnt; i++) {
            nxti: {
                nx = mfp.poss[i].x;
                ny = mfp.poss[i].y;
                cursemsg[i] = (0);
                /* if leashed, we drag him along. */
                if (mtmp.mleashed && dist2((nx), (ny), game.u.ux, game.u.uy) > 4) {
                    continue;
                }
                /* if a guardian, try to stay close by choice */
                if (!edog && (j = dist2((nx), (ny), game.u.ux, game.u.uy)) > 16 && j >= udist) {
                    continue;
                }
                ranged_only = (0);
                if ((mfp.info[i] & 524288) && (game.level.monsters[nx][ny] != null)) {
                    let mstatus = 0;
                    let mtmp2 = (game.level.monsters[nx][ny]);
                    /* weight the audacity of the pet to attack a differently-leveled
             * foe based on its fraction of max HP:
             *       100%: up to level + 2
             * 80% and up: up to level + 1
             * 60% to 80%: up to level
             * 40% to 60%: up to level - 1
             * 25% to 40%: up to level - 2
             *  below 25%: won't attack peacefuls of any level (different case)
             *  below 20%: up to level - 3
             *
             * note that balk's maximum value is +3, as it is the lowest level
             * the pet will balk at attacking rather than the highest level
             * they are willing to attack; note the >= used when comparing it.
             */
                    let balk = mtmp.m_lev + (Math.trunc((5 * mtmp.mhp) / mtmp.mhpmax)) - 2;
                    if (mtmp2.m_lev >= balk || (mtmp2.mtame && mtmp.mtame && !(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic)) || (max_passive_dmg(mtmp2, mtmp) >= mtmp.mhp) || ((mtmp.mhp * 4 < mtmp.mhpmax || mtmp2.data.msound == MS_GUARDIAN || mtmp2.data.msound == MS_LEADER) && mtmp2.mpeaceful && !(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic))) {
                        continue;
                    }
                    if ((mtmp2.data == game.mons[PM_FLOATING_EYE] && rn2(10) && mtmp.mcansee && (((mtmp.data).mflags1 & 4096) == 0) && mtmp2.mcansee && (!mtmp2.minvis || (((mtmp.data).mflags1 & 16777216) != 0)) && !mon_reflects(mtmp, (null))) || (mtmp2.data == game.mons[PM_GELATINOUS_CUBE] && rn2(10)) || (((mtmp2.data) == game.mons[PM_COCKATRICE] || (mtmp2.data) == game.mons[PM_CHICKATRICE]) && !Resists_Elem(mtmp, STONE_RES))) {
                        /* only skip this foe if a ranged attack isn't viable */
                        if (dist2(mtmp.mx, mtmp.my, mtmp2.mx, mtmp2.my) <= 2 || best_target(mtmp, (0)) != mtmp2) {
                            continue;
                        }
                        ranged_only = (1);
                    }
                    /** FIXME: 'ranged_only' isn't used as intended yet **/
                    if (ranged_only) {
                        continue;
                    }
                    if (after) {
                        return 0;
                    }
                    game.bhitpos.x = nx , game.bhitpos.y = ny;
                    game.notonhead = mtmp2.mx != nx || mtmp2.my != ny;
                    mstatus = mattackm(mtmp, mtmp2);
                    if (mstatus & 4) {
                        return 2;
                    }
                    if ((mstatus & (1 | 2)) == 1 && rn2(4) && mtmp2.mlstmv != game.moves && !onscary(mtmp.mx, mtmp.my, mtmp2) && monnear(mtmp2, mtmp.mx, mtmp.my)) {
                        /* monnear check needed: long worms hit on tail */
                        game.bhitpos.x = mtmp.mx , game.bhitpos.y = mtmp.my;
                        game.notonhead = (0);
                        mstatus = mattackm(mtmp2, mtmp);
                        if (mstatus & 2) {
                            return 2;
                        }
                    }
                    return 3;
                }
                if ((mfp.info[i] & 4096) && (game.level.monsters[nx][ny] != null) && better_with_displacing && !undesirable_disp(mtmp, nx, ny)) {
                    let mstatus = 0;
                    let mtmp2 = (game.level.monsters[nx][ny]);
                    mstatus = mdisplacem(mtmp, mtmp2, (0));
                    if (mstatus & 2) {
                        return 2;
                    }
                    return 0;
                }
                /* avoid a location hero just kicked */
                if (m_avoid_kicked_loc(mtmp, nx, ny)) {
                    continue;
                }
                if (m_avoid_soko_push_loc(mtmp, nx, ny)) {
                    continue;
                }
{
                    /* Dog avoids harmful traps, but perhaps it has to pass one
             * in order to follow player.  (Non-harmful traps do not
             * have ALLOW_TRAPS in info[].)  The dog only avoids the
             * trap if you've seen it, unlike enemies who avoid traps
             * if they've seen some trap of that type sometime in the
             * past.  (Neither behavior is really realistic.)
             */
                    let trap = null;
                    if ((mfp.info[i] & 131072) && (trap = t_at(nx, ny))) {
                        if (mtmp.mleashed) {
                            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                                whimper(mtmp);
                            }
                        } else {
                            /* 1/40 chance of stepping on it anyway, in case
                     * it has to pass one to follow the player...
                     */
                            if (trap.tseen && rn2(40)) {
                                continue;
                            }
                        }
                    }
                }
                if (edog) {
                    /* dog eschews cursed objects, but likes dog food */
                    /* (minion isn't interested; `cursemsg' stays FALSE) */
                    let can_reach_food = could_reach_item(mtmp, nx, ny);
                    for (obj = game.level.objects[nx][ny]; obj; obj = obj.v.v_nexthere) {
                        if (obj.cursed) {
                            cursemsg[i] = (1);
                        } else if (can_reach_food && (otyp = dogfood(mtmp, obj)) < MANFOOD && (otyp < ACCFOOD || edog.hungrytime <= game.moves)) {
                            /* Note: our dog likes the food so much that he
                     * might eat it even when it conceals a cursed object */
                            nix = nx;
                            niy = ny;
                            chi = i;
                            do_eat = (1);
                            cursemsg[i] = (0);
                            break newdogpos;
                        }
                    }
                }
                /* didn't find something to eat; if we saw a cursed item and
           aren't being forced to walk on it, usually keep looking */
                if (cursemsg[i] && !mtmp.mleashed && uncursedcnt > 0 && rn2(13 * uncursedcnt)) {
                    continue;
                }
                if (!mtmp.mleashed && distmin(mtmp.mx, mtmp.my, game.u.ux, game.u.uy) > 5) {
                    /*
         * Lessen the chance of backtracking to previous position(s).
         * This causes unintended issues for pets trying to follow the
         * hero.  Thus, only run it if not leashed and >5 tiles away.
         */
                    k = edog ? uncursedcnt : cnt;
                    for (j = 0; j < 4 && j < k - 1; j++) {
                        if (nx == mtmp.mtrack[j].x && ny == mtmp.mtrack[j].y) {
                            if (rn2(4 * (k - j))) {
                                break nxti;
                            }
                        }
                    }
                }
                j = ((ndist = (dist2(nx, ny, game.gx, game.gy))) - nidist) * appr;
                if ((j == 0 && !rn2(++chcnt)) || j < 0 || (j > 0 && !whappr && ((omx == nix && omy == niy && !rn2(3)) || !rn2(12)))) {
                    nix = nx;
                    niy = ny;
                    nidist = ndist;
                    if (j < 0) {
                        chcnt = 0;
                    }
                    chi = i;
                }
            }
        }
        /* Pet hasn't attacked anything but is considering moving -
     * now's the time for ranged attacks. Note that the pet can move
     * after it performs its ranged attack. Should this be changed?
     */
        if ((i = pet_ranged_attk(mtmp, (0))) != 0) {
            return i;
        }
    }
    if (nix != omx || niy != omy) {
        let wasseen = 0;
        if (mfp.info[chi] & 262144) {
            if (mtmp.mleashed) {
                pline_mon(mtmp, "%s breaks loose of %s leash!", Monnam(mtmp), (genders[pronoun_gender(mtmp, 2)].his));
                m_unleash(mtmp, (0));
            }
            mattacku(mtmp);
            return 3;
        }
        if (!m_in_out_region(mtmp, nix, niy)) {
            return 1;
        }
        if (m_digweapon_check(mtmp, nix, niy)) {
            return 0;
        }
        /* insert a worm_move() if worms ever begin to eat things */
        wasseen = canseemon(mtmp);
        game.level.monsters[omx][omy] = null;
        place_monster(mtmp, nix, niy);
        if (cursemsg[chi] && (wasseen || canseemon(mtmp))) {
            /* describe top item of pile, not necessarily cursed item itself;
               don't use glyph_at() here--it would return the pet but we want
               to know whether an object is remembered at this map location */
            let o = (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && game.level.flags.hero_memory && (((game.level.locations[nix][niy].glyph) == GLYPH_OBJ_OFF || ((game.level.locations[nix][niy].glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (game.level.locations[nix][niy].glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((game.level.locations[nix][niy].glyph) == GLYPH_OBJ_PILETOP_OFF || ((game.level.locations[nix][niy].glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (game.level.locations[nix][niy].glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((game.level.locations[nix][niy].glyph) > GLYPH_OBJ_OFF && (game.level.locations[nix][niy].glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((game.level.locations[nix][niy].glyph) > GLYPH_OBJ_PILETOP_OFF && (game.level.locations[nix][niy].glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((game.level.locations[nix][niy].glyph) >= GLYPH_STATUE_MALE_OFF) && ((game.level.locations[nix][niy].glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((game.level.locations[nix][niy].glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((game.level.locations[nix][niy].glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((game.level.locations[nix][niy].glyph) >= GLYPH_STATUE_FEM_OFF) && ((game.level.locations[nix][niy].glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((game.level.locations[nix][niy].glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((game.level.locations[nix][niy].glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((game.level.locations[nix][niy].glyph) >= GLYPH_BODY_OFF) && ((game.level.locations[nix][niy].glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((game.level.locations[nix][niy].glyph) >= GLYPH_BODY_PILETOP_OFF) && ((game.level.locations[nix][niy].glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) ? (game.level.objects[nix][niy]) : null;
            let what = o ? distant_name(o, doname) : c_common_strings.c_something;
            pline_mon(mtmp, "%s %s reluctantly %s %s.", noit_Monnam(mtmp), vtense(null, locomotion(mtmp.data, "step")), ((((mtmp.data).mflags1 & 1) != 0) || ((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)) ? "over" : "onto", what);
        }
        mon_track_add(mtmp, omx, omy);
        if (do_eat) {
            /* We have to know if the pet's going to do a combined eat and
         * move before moving it, but it can't eat until after being
         * moved.  Thus the do_eat flag.
         */
            if (dog_eat(mtmp, obj, omx, omy, (0)) == 2) {
                return 2;
            }
        }
    } else if (mtmp.mleashed && dist2((omx), (omy), game.u.ux, game.u.uy) > 4) {
        let cc = { x: 0, y: 0 };
        dognext: {
            /* an incredible kludge, but the only way to keep pooch near
         * after it spends time eating or in a trap, etc.
         */
            nx = sgn(omx - game.u.ux);
            ny = sgn(omy - game.u.uy);
            cc.x = game.u.ux + nx;
            cc.y = game.u.uy + ny;
            if (goodpos(cc.x, cc.y, mtmp, 0)) {
                break dognext;
            }
            i = xytodir(nx, ny);
            for (j = (((i) + 7) % (N_DIRS_Z - 2)); j < (((i) + 1) % (N_DIRS_Z - 2)); j++) {
                dirtocoord(cc, j);
                if (goodpos(cc.x, cc.y, mtmp, 0)) {
                    break dognext;
                }
            }
            for (j = (((i) + 6) % (N_DIRS_Z - 2)); j < (((i) + 2) % (N_DIRS_Z - 2)); j++) {
                dirtocoord(cc, j);
                if (goodpos(cc.x, cc.y, mtmp, 0)) {
                    break dognext;
                }
            }
            cc.x = mtmp.mx;
            cc.y = mtmp.my;
        }
        if (!m_in_out_region(mtmp, nix, niy)) {
            return 1;
        }
        game.level.monsters[mtmp.mx][mtmp.my] = null;
        place_monster(mtmp, cc.x, cc.y);
        newsym(cc.x, cc.y);
        set_apparxy(mtmp);
    }
    return 1;
}
/* check if a monster could pick up objects from a location */
export function could_reach_item(mon, nx, ny) {
    fnEnter("could_reach_item", "dogmove.c", 0);
    if ((!is_pool(nx, ny) || (((mon.data).mflags1 & 2) != 0)) && (!is_lava(nx, ny) || (mon.data == game.mons[PM_FIRE_ELEMENTAL] || mon.data == game.mons[PM_SALAMANDER])) && (!sobj_at(BOULDER, nx, ny) || (((mon.data).mflags2 & 134217728) != 0))) {
        return (1);
    }
    return (0);
}
/* Hack to prevent a dog from being endlessly stuck near an object that
 * it can't reach, such as caught in a teleport scroll niche.  It recursively
 * checks to see if the squares in between are good.  The checking could be
 * a little smarter; a full check would probably be useful in m_move() too.
 * Since the maximum food distance is 5, this should never be more than 5
 * calls deep.
 */
function _can_reach_inner(mon, mx, my, fx, fy, visited) {
    if (mx == fx && my == fy) return 1;
    if (!isok(mx, my)) return 0;
    const key = my * 80 + mx;
    if (visited.has(key)) return 0;
    visited.add(key);
    const dist = dist2(mx, my, fx, fy);
    for (let i = mx - 1; i <= mx + 1; i++) {
        for (let j = my - 1; j <= my + 1; j++) {
            if (!isok(i, j)) continue;
            if (dist2(i, j, fx, fy) >= dist) continue;
            if (((game.level.locations[i][j].typ) < POOL) && !(((mon.data).mflags1 & 8) != 0) && (!may_dig(i, j) || !(((mon.data).mflags1 & 32) != 0) || (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))))) {
                continue;
            }
            if (((game.level.locations[i][j].typ) == DOOR) && (game.level.locations[i][j].flags & (4 | 8))) {
                continue;
            }
            if (!could_reach_item(mon, i, j)) continue;
            if (_can_reach_inner(mon, i, j, fx, fy, visited)) return 1;
        }
    }
    return 0;
}
export function can_reach_location(mon, mx, my, fx, fy) {
    fnEnter("can_reach_location", "dogmove.c", 0);
    return _can_reach_inner(mon, mx, my, fx, fy, new Set());
}
/* do_clear_area client */
export function wantdoor(x, y, distance) {
    let ndist = 0;
    let dist_ptr = distance;
    if (dist_ptr.value > (ndist = dist2((x), (y), game.u.ux, game.u.uy))) {
        game.gx = x;
        game.gy = y;
        dist_ptr.value = ndist;
    }
}
// struct qmchoices: { mndx, mlet, mappearance, m_ap_type }
/* type of pet, 0 means any  */
/* symbol of pet, 0 means any */
/* mimic this */
/* what is the thing it is mimicking? */
const qm = [{ mndx: PM_LITTLE_DOG, mlet: 0, mappearance: PM_KITTEN, m_ap_type: M_AP_MONSTER }, { mndx: PM_DOG, mlet: 0, mappearance: PM_HOUSECAT, m_ap_type: M_AP_MONSTER }, { mndx: PM_LARGE_DOG, mlet: 0, mappearance: PM_LARGE_CAT, m_ap_type: M_AP_MONSTER }, { mndx: PM_KITTEN, mlet: 0, mappearance: PM_LITTLE_DOG, m_ap_type: M_AP_MONSTER }, { mndx: PM_HOUSECAT, mlet: 0, mappearance: PM_DOG, m_ap_type: M_AP_MONSTER }, { mndx: PM_LARGE_CAT, mlet: 0, mappearance: PM_LARGE_DOG, m_ap_type: M_AP_MONSTER }, { mndx: PM_HOUSECAT, mlet: 0, mappearance: PM_GIANT_RAT, m_ap_type: M_AP_MONSTER }, { mndx: 0, mlet: S_DOG, mappearance: S_sink, m_ap_type: M_AP_FURNITURE }, { mndx: 0, mlet: 0, mappearance: TRIPE_RATION, m_ap_type: M_AP_OBJECT }];
/* Things that some pets might be thinking about at the time */
/* sorry, no fire hydrants */
/* leave this at end */
export function finish_meating(mtmp) {
    mtmp.meating = 0;
    if (((mtmp).m_ap_type & 7) != M_AP_NOTHING && mtmp.data.mlet != S_MIMIC) {
        /* was eating a mimic and now appearance needs resetting */
        mtmp.m_ap_type = M_AP_NOTHING;
        mtmp.mappearance = 0;
        newsym(mtmp.mx, mtmp.my);
    }
}
/*
 * variation of leashable() that takes a PM_ index */
export function mnum_leashable(mnum) {
    return ((mnum >= LOW_PM && mnum <= HIGH_PM) && mnum != PM_LONG_WORM && !(((game.mons[mnum]).mflags1 & 1048576) != 0) && (!(((game.mons[mnum]).mflags1 & 24576) == 24576) || (((game.mons[mnum]).mflags1 & 32768) == 0))) ? (1) : (0);
}
export function quickmimic(mtmp) {
    let idx = 0;
    let trycnt = 5;
    let spotted = 0;
    let seeloc = 0;
    let was_leashed = mtmp.mleashed;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if ((game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) || !mtmp.meating) {
        return;
    }
    /* with polymorph, the steed's equipment would be re-checked and its
       saddle would come off, triggering DISMOUNT_FELL, but mimicking
       doesn't impact monster's equipment; normally DISMOUNT_POLY is for
       rider taking on an unsuitable shape, but its message works fine
       for this and also avoids inflicting damage during forced dismount;
       do this before changing so that dismount refers to original shape */
    if (mtmp == game.u.usteed) {
        dismount_steed(DISMOUNT_POLY);
    }
    do {
        idx = rn2((Math.trunc(9 /* sizeof(const struct qmchoices [9]) */ / 1 /* sizeof(const struct qmchoices) */)));
        if (qm[idx].mndx != 0 && ((mtmp.data).pmidx) == qm[idx].mndx) {
            break;
        }
        if (qm[idx].mlet != 0 && mtmp.data.mlet == qm[idx].mlet) {
            break;
        }
        if (qm[idx].mndx == 0 && qm[idx].mlet == 0) {
            break;
        }
    } while (--trycnt > 0);
    if (trycnt == 0) {
        idx = (Math.trunc(9 /* sizeof(const struct qmchoices [9]) */ / 1 /* sizeof(const struct qmchoices) */)) - 1;
    }
    buf = strcpy(buf, y_monnam(mtmp));
    /* "your <pet>" or "the <mon>" or "Fang" */
    spotted = (canseemon(mtmp) || sensemon(mtmp));
    seeloc = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
    mtmp.m_ap_type = qm[idx].m_ap_type;
    mtmp.mappearance = qm[idx].mappearance;
    if (spotted || seeloc || (canseemon(mtmp) || sensemon(mtmp))) {
        let prev_glyph = glyph_at(mtmp.mx, mtmp.my);
        let what = (((mtmp).m_ap_type & 7) == M_AP_FURNITURE) ? defsyms[mtmp.mappearance].explanation : (((mtmp).m_ap_type & 7) == M_AP_OBJECT && (game.obj_descr[(game.objects[mtmp.mappearance]).oc_descr_idx].oc_descr)) ? (game.obj_descr[(game.objects[mtmp.mappearance]).oc_descr_idx].oc_descr) : (((mtmp).m_ap_type & 7) == M_AP_OBJECT && (game.obj_descr[(game.objects[mtmp.mappearance]).oc_name_idx].oc_name)) ? (game.obj_descr[(game.objects[mtmp.mappearance]).oc_name_idx].oc_name) : (((mtmp).m_ap_type & 7) == M_AP_MONSTER) ? pmname(game.mons[mtmp.mappearance], Mgender(mtmp)) : c_common_strings.c_something;
        newsym(mtmp.mx, mtmp.my);
        if (was_leashed && (((mtmp).m_ap_type & 7) != M_AP_MONSTER || !mnum_leashable(mtmp.mappearance))) {
            Your("leash goes slack.");
            m_unleash(mtmp, (0));
        }
        if (glyph_at(mtmp.mx, mtmp.my) != prev_glyph) {
            You("%s %s %s where %s was!", seeloc ? "see" : "sense that", (what != c_common_strings.c_something) ? an(what) : what, seeloc ? "appear" : "has appeared", buf);
        } else {
            You("sense that %s feels rather %s-ish.", buf, what);
        }
        (game.windowprocs.win_display_nhwindow)(game.WIN_MAP, (1));
    }
}
/*dogmove.c*/
/* if a long worm, only accept the head as a target */
/* tunnelling monsters can't do that on the rogue level */
