/* NetHack 5.0	ball.c	$NHDT-Date: 1596498150 2020/08/03 23:42:30 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.51 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) David Cohrs, 2006. */
/* NetHack may be freely redistributed.  See license for details. */
/* Ball & Chain
 * =============================================================*/
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { exercise } from './attrib.js';
import { is_pool } from './dbridge.js';
import { cls, map_object, newsym } from './display.js';
import { canletgo, flooreffects, set_wounded_legs } from './do.js';
import { hliquid } from './do_name.js';
import { hard_helmet } from './do_wear.js';
import { hitfloor, omon_adj } from './dothrow.js';
import { on_level } from './dungeon.js';
import { losehp, movobj, near_capacity, nomul, spoteffects, weight_cap } from './hack.js';
import { dist2, distmin } from './hacklib.js';
import { freeinv } from './invent.js';
import { obj_extract_self, place_object, remove_object } from './mkobj.js';
import { maybe_unhide_at } from './mon.js';
import { A_STR, BLINDED, DOOR, HALF_PHDAM, HEAD, HEAVY_IRON_BALL, HMON_DRAGGED, HOLE, IRON_CHAIN, LEG, LEVITATION, PIT, POOL, SLT_ENCUMBER, SPIKED_PIT, TRAPDOOR, TT_BEARTRAP, TT_BURIEDBALL, TT_INFLOOR, TT_LAVA, TT_PIT, TT_WEB, override_restriction } from './nh-constants.js';
import { Yname2, otense, safe_typename, xname, yname } from './objnam.js';
import { encumber_msg } from './pickup.js';
import { body_part } from './polyself.js';
import { rn2, rnd } from './rnd.js';
import { deltrap, fill_pit, reset_utrap, t_at } from './trap.js';
import { hmon } from './uhitm.js';
import { setuqwep, setuswapwep, setuwep, welded } from './wield.js';
import { find_mac, setnotworn } from './worn.js';
import { miss } from './zap.js';

game.bcrestriction = 0;
export function ballrelease(showmsg) {
    if (((game.uball).where == 3) && !welded(game.uball)) {
        if (showmsg) {
            pline("Startled, you drop the iron ball.");
        }
        if (game.uwep == game.uball) {
            setuwep(null);
        }
        if (game.uswapwep == game.uball) {
            setuswapwep(null);
        }
        if (game.uquiver == game.uball) {
            setuqwep(null);
        }
        /* [this used to test 'if (uwep != uball)' but that always passes
           after the setuwep() above] */
        /* remove from inventory but don't place on floor */
        freeinv(game.uball);
        encumber_msg();
    }
}
/* ball&chain might hit hero when falling through a trap door */
export function ballfall() {
    let gets_hit = 0;
    if (!game.uball || (game.uball && ((game.uball).where == 3) && welded(game.uball))) {
        /* ball&chain not unplaced while swallowed */
        return;
    }
    gets_hit = (((game.uball.ox != game.u.ux) || (game.uball.oy != game.u.uy)) && ((game.uwep == game.uball) ? (0) : rn2(5)));
    ballrelease((1));
    if (gets_hit) {
        let dmg = (rn2(7) + (25));
        pline_The("iron ball falls on your %s.", body_part(HEAD));
        if (game.uarmh) {
            if (hard_helmet(game.uarmh)) {
                pline("Fortunately, you are wearing a hard helmet.");
                dmg = 3;
            } else if (game.flags.verbose) {
                pline("%s does not protect you.", Yname2(game.uarmh));
            }
        }
        losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "crunched in the head by an iron ball", 2);
    }
}
/*
 *  To make this work, we have to mess with the hero's mind.  The rules for
 *  ball&chain are:
 *
 *      1. If the hero can see them, fine.
 *      2. If the hero can't see either, it isn't seen.
 *      3. If either is felt it is seen.
 *      4. If either is felt and moved, it disappears.
 *
 *  If the hero can see, then when a move is done, the ball and chain are
 *  first picked up, the positions under them are corrected, then they
 *  are moved after the hero moves.  Not too bad.
 *
 *  If the hero is blind, then she can "feel" the ball and/or chain at any
 *  time.  However, when the hero moves, the felt ball and/or chain become
 *  unfelt and whatever was felt "under" the ball&chain appears.  Pretty
 *  nifty, but it requires that the ball&chain "remember" what was under
 *  them --- i.e. they pick-up glyphs when they are felt and drop them when
 *  moved (and felt).  When swallowed, the ball&chain are pulled completely
 *  off of the dungeon, but are still on the object chain.  They are placed
 *  under the hero when she is expelled.
 */
/*
 * from you.h
 *      int u.bglyph            glyph under the ball
 *      int u.cglyph            glyph under the chain
 *      int u.bc_felt           mask for ball/chain being felt
 *      #define BC_BALL  0x01   bit mask in u.bc_felt for ball
 *      #define BC_CHAIN 0x02   bit mask in u.bc_felt for chain
 *      int u.bc_order          ball & chain order
 *
 * u.bc_felt is also manipulated in display.c and read.c, the others only
 * in this file.  None of these variables are valid unless the player is
 * Blind.
 */
/* values for u.bc_order */
/* ball & chain at different positions */
/* chain on top of ball */
/* ball on top of chain */
/*
 *  Place the ball & chain under the hero.  Make sure that the ball & chain
 *  variables are set (actually only needed when blind, but what the heck).
 *  It is assumed that when this is called, the ball and chain are NOT
 *  attached to the object list.
 *
 *  Should not be called while swallowed except on waterlevel.
 */
export function placebc_core() {
    if (!game.uchain || !game.uball) {
        impossible("Where are your ball and chain?");
        return;
    }
    flooreffects(game.uchain, game.u.ux, game.u.uy, "");
    if (((game.uball).where == 3)) {
        game.u.bc_order = 0;
    } else {
        /* ball might rust -- already checked when carried */
        flooreffects(game.uball, game.u.ux, game.u.uy, "");
        place_object(game.uball, game.u.ux, game.u.uy);
        game.u.bc_order = 1;
    }
    place_object(game.uchain, game.u.ux, game.u.uy);
    game.u.bglyph = game.u.cglyph = game.level.locations[game.u.ux][game.u.uy].glyph;
    newsym(game.u.ux, game.u.uy);
    game.bcrestriction = 0;
}
export function unplacebc_core() {
    if (game.u.uswallow) {
        if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
            /* we need to proceed with the removal from the floor
             * so that movebubbles() processing will disregard it as
             * intended. Ignore all the vision stuff.
             */
            if (!((game.uball).where == 3)) {
                obj_extract_self(game.uball);
            }
            obj_extract_self(game.uchain);
        }
        return;
    }
    if (!((game.uball).where == 3)) {
        obj_extract_self(game.uball);
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && (game.u.bc_felt & 1)) {
            game.level.locations[game.uball.ox][game.uball.oy].glyph = game.u.bglyph;
        }
        maybe_unhide_at(game.uball.ox, game.uball.oy);
        newsym(game.uball.ox, game.uball.oy);
    }
    obj_extract_self(game.uchain);
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && (game.u.bc_felt & 2)) {
        game.level.locations[game.uchain.ox][game.uchain.oy].glyph = game.u.cglyph;
    }
    maybe_unhide_at(game.uchain.ox, game.uchain.oy);
    newsym(game.uchain.ox, game.uchain.oy);
    game.u.bc_felt = 0;
}
export function check_restriction(restriction) {
    let ret = (0);
    if (!game.bcrestriction || (restriction == override_restriction)) {
        ret = (1);
    } else {
        ret = (game.bcrestriction == restriction) ? (1) : (0);
    }
    return ret;
}
export function placebc() {
    if (!check_restriction(0)) {
        return;
    }
    if (game.uchain && game.uchain.where != 0) {
        impossible("bc already placed?");
        return;
    }
    placebc_core();
}
export function unplacebc() {
    if (game.bcrestriction) {
        impossible("unplacebc denied, restriction in place");
        return;
    }
    unplacebc_core();
}
export function unplacebc_and_covet_placebc() {
    let restriction = 0;
    if (game.bcrestriction) {
        impossible("unplacebc_and_covet_placebc denied, already restricted");
    } else {
        restriction = game.bcrestriction = rnd(400);
        unplacebc_core();
    }
    return restriction;
}
export function lift_covet_and_placebc(pin) {
    if (!check_restriction(pin)) {
        return;
    }
    if (game.uchain && game.uchain.where != 0) {
        impossible("bc already placed?");
        return;
    }
    placebc_core();
}
/* BREADCRUMBS */
/* BREADCRUMBS */
/*
 *  Return the stacking of the hero's ball & chain.  This assumes that the
 *  hero is being punished.
 */
export function bc_order() {
    let obj = null;
    if (game.uchain.ox != game.uball.ox || game.uchain.oy != game.uball.oy || ((game.uball).where == 3) || game.u.uswallow) {
        return 0;
    }
    for (obj = game.level.objects[game.uball.ox][game.uball.oy]; obj; obj = obj.v.v_nexthere) {
        if (obj == game.uchain) {
            return 1;
        }
        if (obj == game.uball) {
            return 2;
        }
    }
    impossible("bc_order:  ball&chain not in same location!");
    return 0;
}
/*
 *  set_bc()
 *
 *  The hero is either about to go blind or already blind and just punished.
 *  Set up the ball and chain variables so that the ball and chain are "felt".
 */
export function set_bc(already_blind) {
    let ball_on_floor = !((game.uball).where == 3);
    game.u.bc_order = bc_order();
    game.u.bc_felt = ball_on_floor ? 1 | 2 : 2;
    if (already_blind || game.u.uswallow) {
        game.u.cglyph = game.u.bglyph = game.level.locations[game.u.ux][game.u.uy].glyph;
        return;
    }
    /*
     *  Since we can still see, remove the ball&chain and get the glyph that
     *  would be beneath them.  Then put the ball&chain back.  This is pretty
     *  disgusting, but it will work.
     */
    remove_object(game.uchain);
    if (ball_on_floor) {
        remove_object(game.uball);
    }
    newsym(game.uchain.ox, game.uchain.oy);
    game.u.cglyph = game.level.locations[game.uchain.ox][game.uchain.oy].glyph;
    if (game.u.bc_order == 0) {
        place_object(game.uchain, game.uchain.ox, game.uchain.oy);
        newsym(game.uchain.ox, game.uchain.oy);
        if (ball_on_floor) {
            newsym(game.uball.ox, game.uball.oy);
            game.u.bglyph = game.level.locations[game.uball.ox][game.uball.oy].glyph;
            place_object(game.uball, game.uball.ox, game.uball.oy);
            newsym(game.uball.ox, game.uball.oy);
        }
    } else {
        game.u.bglyph = game.u.cglyph;
        if (game.u.bc_order == 1) {
            place_object(game.uball, game.uball.ox, game.uball.oy);
            place_object(game.uchain, game.uchain.ox, game.uchain.oy);
        } else {
            place_object(game.uchain, game.uchain.ox, game.uchain.oy);
            place_object(game.uball, game.uball.ox, game.uball.oy);
        }
        newsym(game.uball.ox, game.uball.oy);
    }
}
/*
 *  move_bc()
 *
 *  Move the ball and chain.  This is called twice for every move.  The first
 *  time to pick up the ball and chain before the move, the second time to
 *  place the ball and chain after the move.  If the ball is carried, this
 *  function should never have BC_BALL as part of its control.
 *
 *  Should not be called while swallowed.
 */
export function move_bc(before, control, ballx, bally, chainx, chainy) {
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        if (!before) {
            if ((control & 2) && (control & 1)) {
                /*
         *  The hero is blind.  Time to work hard.  The ball and chain that
         *  are attached to the hero are very special.  The hero knows that
         *  they are attached, so when they move, the hero knows that they
         *  aren't at the last position remembered.  This is complicated
         *  by the fact that the hero can "feel" the surrounding locations
         *  at any time, hence, making one or both of them show up again.
         *  So, we have to keep track of which is felt at any one time and
         *  act accordingly.
         */
                /*
                 *  Both ball and chain moved.  If felt, drop glyph.
                 */
                if (game.u.bc_felt & 1) {
                    game.level.locations[game.uball.ox][game.uball.oy].glyph = game.u.bglyph;
                }
                if (game.u.bc_felt & 2) {
                    game.level.locations[game.uchain.ox][game.uchain.oy].glyph = game.u.cglyph;
                }
                game.u.bc_felt = 0;
                /* Pick up glyph at new location. */
                game.u.bglyph = game.level.locations[ballx][bally].glyph;
                game.u.cglyph = game.level.locations[chainx][chainy].glyph;
                movobj(game.uball, ballx, bally);
                movobj(game.uchain, chainx, chainy);
            } else if (control & 1) {
                if (game.u.bc_felt & 1) {
                    if (game.u.bc_order == 0) {
                        game.level.locations[game.uball.ox][game.uball.oy].glyph = game.u.bglyph;
                    } else if (game.u.bc_order == 2) {
                        if (game.u.bc_felt & 2) {
                            map_object(game.uchain, 0);
                        } else {
                            game.level.locations[game.uball.ox][game.uball.oy].glyph = game.u.bglyph;
                        }
                    }
                    game.u.bc_felt &= ~1;
                }
                /* Pick up glyph at new position. */
                game.u.bglyph = (ballx != chainx || bally != chainy) ? game.level.locations[ballx][bally].glyph : game.u.cglyph;
                movobj(game.uball, ballx, bally);
            } else if (control & 2) {
                if (game.u.bc_felt & 2) {
                    if (game.u.bc_order == 0) {
                        game.level.locations[game.uchain.ox][game.uchain.oy].glyph = game.u.cglyph;
                    } else if (game.u.bc_order == 1) {
                        if (game.u.bc_felt & 1) {
                            map_object(game.uball, 0);
                        } else {
                            game.level.locations[game.uchain.ox][game.uchain.oy].glyph = game.u.cglyph;
                        }
                    }
                    game.u.bc_felt &= ~2;
                }
                game.u.cglyph = (ballx != chainx || bally != chainy) ? game.level.locations[chainx][chainy].glyph : game.u.bglyph;
                movobj(game.uchain, chainx, chainy);
            }
            game.u.bc_order = bc_order();
        }
    } else {
        if (before) {
            if (!control) {
                /*
         *  The hero is not blind.  To make this work correctly, we need to
         *  pick up the ball and chain before the hero moves, then put them
         *  in their new positions after the hero moves.
         */
                /*
                 * Neither ball nor chain is moving, so remember which was
                 * on top until !before.  Use the variable u.bc_order
                 * since it is only valid when blind.
                 */
                game.u.bc_order = bc_order();
            }
            remove_object(game.uchain);
            maybe_unhide_at(game.uchain.ox, game.uchain.oy);
            newsym(game.uchain.ox, game.uchain.oy);
            if (!((game.uball).where == 3)) {
                remove_object(game.uball);
                maybe_unhide_at(game.uball.ox, game.uball.oy);
                newsym(game.uball.ox, game.uball.oy);
            }
        } else {
            let on_floor = !((game.uball).where == 3);
            if ((control & 2) || (!control && game.u.bc_order == 1)) {
                /* If the chain moved or nothing moved & chain on top. */
                if (on_floor) {
                    place_object(game.uball, ballx, bally);
                }
                place_object(game.uchain, chainx, chainy);
            } else {
                place_object(game.uchain, chainx, chainy);
                if (on_floor) {
                    place_object(game.uball, ballx, bally);
                }
            }
            newsym(chainx, chainy);
            if (on_floor) {
                newsym(ballx, bally);
            }
        }
    }
}
/* return TRUE if the caller needs to place the ball and chain down again */
export function drag_ball(x, y, bc_control, ballx, bally, chainx, chainy, cause_delay, allow_drag) {
    let t = null;
    let already_in_rock = 0;
    drag: {
        t = null;
        /*
     * Should not be called while swallowed.  Should be called before
     * movement, because we might want to move the ball or chain to the
     * hero's old position.
     *
     * It is called if we are moving.  It is also called if we are
     * teleporting *if* the ball doesn't move and we thus must drag the
     * chain.  It is not called for ordinary teleportation.
     *
     * 'allow_drag' is only used in the ugly special case where teleporting
     * must drag the chain, while an identical-looking movement must drag
     * both the ball and chain.
     */
        ballx.value = game.uball.ox;
        bally.value = game.uball.oy;
        chainx.value = game.uchain.ox;
        chainy.value = game.uchain.oy;
        bc_control.value = 0;
        cause_delay.value = (0);
        if (dist2(x, y, game.uchain.ox, game.uchain.oy) <= 2) {
            move_bc(1, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
            return (1);
        }
        if (((game.uball).where == 3) || distmin(x, y, game.uball.ox, game.uball.oy) <= 2) {
            /* only need to move the chain? */
            let oldchainx = game.uchain.ox;
            let oldchainy = game.uchain.oy;
            bc_control.value = 2;
            move_bc(1, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
            if (((game.uball).where == 3)) {
                if (distmin(x, y, game.uchain.ox, game.uchain.oy) > 1) {
                    /* move chain only if necessary */
                    chainx.value = game.u.ux;
                    chainy.value = game.u.uy;
                }
                return (1);
            }
            if ((((game.level.locations[game.u.ux][game.u.uy].typ) < POOL) || (((game.level.locations[game.u.ux][game.u.uy].typ) == DOOR) && (game.level.locations[game.u.ux][game.u.uy].flags & (4 | 8)))) || (((game.level.locations[chainx.value][chainy.value].typ) < POOL) || (((game.level.locations[chainx.value][chainy.value].typ) == DOOR) && (game.level.locations[chainx.value][chainy.value].flags & (4 | 8)))) || (((game.level.locations[game.uball.ox][game.uball.oy].typ) < POOL) || (((game.level.locations[game.uball.ox][game.uball.oy].typ) == DOOR) && (game.level.locations[game.uball.ox][game.uball.oy].flags & (4 | 8))))) {
                already_in_rock = (1);
            /*
     * Don't ever move the chain into solid rock.  If we have to, then
     * instead undo the move_bc() and jump to the drag ball code.  Note
     * that this also means the "cannot carry and drag" message will not
     * appear, since unless we moved at least two squares there is no
     * possibility of the chain position being in solid rock.
     */
            } else {
                already_in_rock = (0);
            }
            switch (dist2(x, y, game.uball.ox, game.uball.oy)) {
                /* two spaces diagonal from ball, move chain in-between */
                case 8:
                    chainx.value = Math.trunc((game.uball.ox + x) / 2);
                    chainy.value = Math.trunc((game.uball.oy + y) / 2);
                    if ((((game.level.locations[chainx.value][chainy.value].typ) < POOL) || (((game.level.locations[chainx.value][chainy.value].typ) == DOOR) && (game.level.locations[chainx.value][chainy.value].flags & (4 | 8)))) && !already_in_rock) {
                        do {
                            chainx.value = oldchainx;
                            chainy.value = oldchainy;
                            move_bc(0, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
                            break drag;
                        } while (0);
                    }
                    break;
                case 5:
{
                        /* player is distance 2/1 from ball; move chain to one of the
         * two spaces between
         *   @
         *   __
         *    0
         */
                        let tempx = 0;
                        let tempy = 0;
                        let tempx2 = 0;
                        let tempy2 = 0;
                        if (abs(x - game.uball.ox) == 1) {
                            /* find position closest to current position of chain;
               no effect if current position is already OK */
                            tempx = x;
                            tempx2 = game.uball.ox;
                            tempy = tempy2 = Math.trunc((game.uball.oy + y) / 2);
                        } else {
                            tempx = tempx2 = Math.trunc((game.uball.ox + x) / 2);
                            tempy = y;
                            tempy2 = game.uball.oy;
                        }
                        if ((((game.level.locations[tempx][tempy].typ) < POOL) || (((game.level.locations[tempx][tempy].typ) == DOOR) && (game.level.locations[tempx][tempy].flags & (4 | 8)))) && !(((game.level.locations[tempx2][tempy2].typ) < POOL) || (((game.level.locations[tempx2][tempy2].typ) == DOOR) && (game.level.locations[tempx2][tempy2].flags & (4 | 8)))) && !already_in_rock) {
                            if (allow_drag) {
                                /* Avoid pathological case *if* not teleporting:
                     *   0                          0_
                     *   _X  move northeast  ----->  X@
                     *    @
                     */
                                if (dist2(game.u.ux, game.u.uy, game.uball.ox, game.uball.oy) == 5 && dist2(x, y, tempx, tempy) == 1) {
                                    do {
                                        chainx.value = oldchainx;
                                        chainy.value = oldchainy;
                                        move_bc(0, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
                                        break drag;
                                    } while (0);
                                }
                                /* Avoid pathological case *if* not teleporting:
                     *    0                          0
                     *   _X  move east       ----->  X_
                     *    @                           @
                     */
                                if (dist2(game.u.ux, game.u.uy, game.uball.ox, game.uball.oy) == 4 && dist2(x, y, tempx, tempy) == 2) {
                                    do {
                                        chainx.value = oldchainx;
                                        chainy.value = oldchainy;
                                        move_bc(0, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
                                        break drag;
                                    } while (0);
                                }
                            }
                            chainx.value = tempx2;
                            chainy.value = tempy2;
                        } else if (!(((game.level.locations[tempx][tempy].typ) < POOL) || (((game.level.locations[tempx][tempy].typ) == DOOR) && (game.level.locations[tempx][tempy].flags & (4 | 8)))) && (((game.level.locations[tempx2][tempy2].typ) < POOL) || (((game.level.locations[tempx2][tempy2].typ) == DOOR) && (game.level.locations[tempx2][tempy2].flags & (4 | 8)))) && !already_in_rock) {
                            if (allow_drag) {
                                if (dist2(game.u.ux, game.u.uy, game.uball.ox, game.uball.oy) == 5 && dist2(x, y, tempx2, tempy2) == 1) {
                                    do {
                                        chainx.value = oldchainx;
                                        chainy.value = oldchainy;
                                        move_bc(0, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
                                        break drag;
                                    } while (0);
                                }
                                if (dist2(game.u.ux, game.u.uy, game.uball.ox, game.uball.oy) == 4 && dist2(x, y, tempx2, tempy2) == 2) {
                                    do {
                                        chainx.value = oldchainx;
                                        chainy.value = oldchainy;
                                        move_bc(0, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
                                        break drag;
                                    } while (0);
                                }
                            }
                            chainx.value = tempx;
                            chainy.value = tempy;
                        } else if ((((game.level.locations[tempx][tempy].typ) < POOL) || (((game.level.locations[tempx][tempy].typ) == DOOR) && (game.level.locations[tempx][tempy].flags & (4 | 8)))) && (((game.level.locations[tempx2][tempy2].typ) < POOL) || (((game.level.locations[tempx2][tempy2].typ) == DOOR) && (game.level.locations[tempx2][tempy2].flags & (4 | 8)))) && !already_in_rock) {
                            do {
                                chainx.value = oldchainx;
                                chainy.value = oldchainy;
                                move_bc(0, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
                                break drag;
                            } while (0);
                        } else if (dist2(tempx, tempy, game.uchain.ox, game.uchain.oy) < dist2(tempx2, tempy2, game.uchain.ox, game.uchain.oy) || ((dist2(tempx, tempy, game.uchain.ox, game.uchain.oy) == dist2(tempx2, tempy2, game.uchain.ox, game.uchain.oy)) && rn2(2))) {
                            chainx.value = tempx;
                            chainy.value = tempy;
                        } else {
                            chainx.value = tempx2;
                            chainy.value = tempy2;
                        }
                        break;
                    }
                /* ball is two spaces horizontal or vertical from player; move*/
                /* chain in-between *unless* current chain position is OK */
                case 4:
                    if ((distmin(x, y, game.uchain.ox, game.uchain.oy) <= 1 && distmin(game.uchain.ox, game.uchain.oy, game.uball.ox, game.uball.oy) <= 1)) {
                        break;
                    }
                    chainx.value = Math.trunc((x + game.uball.ox) / 2);
                    chainy.value = Math.trunc((y + game.uball.oy) / 2);
                    if ((((game.level.locations[chainx.value][chainy.value].typ) < POOL) || (((game.level.locations[chainx.value][chainy.value].typ) == DOOR) && (game.level.locations[chainx.value][chainy.value].flags & (4 | 8)))) && !already_in_rock) {
                        do {
                            chainx.value = oldchainx;
                            chainy.value = oldchainy;
                            move_bc(0, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
                            break drag;
                        } while (0);
                    }
                    break;
                case 2:
                    if (dist2(x, y, game.uball.ox, game.uball.oy) == 2 && dist2(x, y, game.uchain.ox, game.uchain.oy) == 4) {
                        if (game.uchain.oy == y) {
                            chainx.value = game.uball.ox;
                        /* ball is one space diagonal from player.  Check for the
         * following special case:
         *   @
         *    _    moving southwest becomes  @_
         *   0                                0
         * (This will also catch teleporting that happens to resemble
         * this case, but oh well.)  Otherwise fall through.
         */
                        } else {
                            chainy.value = game.uball.oy;
                        }
                        if ((((game.level.locations[chainx.value][chainy.value].typ) < POOL) || (((game.level.locations[chainx.value][chainy.value].typ) == DOOR) && (game.level.locations[chainx.value][chainy.value].flags & (4 | 8)))) && !already_in_rock) {
                            do {
                                chainx.value = oldchainx;
                                chainy.value = oldchainy;
                                move_bc(0, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
                                break drag;
                            } while (0);
                        }
                        break;
                    }
                    ;
                case 1:
                case 0:
                    if ((distmin(x, y, game.uchain.ox, game.uchain.oy) <= 1 && distmin(game.uchain.ox, game.uchain.oy, game.uball.ox, game.uball.oy) <= 1)) {
                        break;
                    }
                    if ((distmin(x, y, game.u.ux, game.u.uy) <= 1 && distmin(game.u.ux, game.u.uy, game.uball.ox, game.uball.oy) <= 1)) {
                        /* otherwise try to drag chain to player's old position */
                        chainx.value = game.u.ux;
                        chainy.value = game.u.uy;
                        break;
                    }
                    /* otherwise use player's new position (they must have
               teleported, for this to happen) */
                    chainx.value = x;
                    chainy.value = y;
                    break;
                default:
                    impossible("bad chain movement");
                    break;
            }
            return (1);
        }
    }
    if (near_capacity() > SLT_ENCUMBER && dist2(x, y, game.u.ux, game.u.uy) <= 2) {
        You("cannot %sdrag the heavy iron ball.", game.invent ? "carry all that and also " : "");
        nomul(0);
        return (0);
    }
    if ((is_pool(game.uchain.ox, game.uchain.oy) && (game.level.locations[game.uchain.ox][game.uchain.oy].typ == POOL || !is_pool(game.uball.ox, game.uball.oy) || game.level.locations[game.uball.ox][game.uball.oy].typ == POOL)) || ((t = t_at(game.uchain.ox, game.uchain.oy)) && (((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT) || ((t.ttyp) == HOLE || (t.ttyp) == TRAPDOOR)))) {
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            /* water not mere continuation of previous water */
            You_feel("a tug from the iron ball.");
            if (t) {
                t.tseen = 1;
            }
        } else {
            let victim = null;
            You("are jerked back by the iron ball!");
            if ((victim = (game.level.monsters[game.uchain.ox][game.uchain.oy])) != null) {
                let tmp = 0;
                let dieroll = rnd(20);
                tmp = -2 + (game.u.uluck + game.u.moreluck) + find_mac(victim);
                tmp += omon_adj(victim, game.uball, (1));
                if (tmp >= dieroll) {
                    hmon(victim, game.uball, HMON_DRAGGED, dieroll);
                } else {
                    miss(xname(game.uball), victim);
                }
            }
            if (!(game.level.monsters[game.uchain.ox][game.uchain.oy])) {
                /* now check again in case mon died */
                game.u.ux = game.uchain.ox;
                game.u.uy = game.uchain.oy;
                newsym(game.u.ux0, game.u.uy0);
            }
            nomul(0);
            bc_control.value = 1;
            move_bc(1, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
            ballx.value = game.uchain.ox;
            bally.value = game.uchain.oy;
            move_bc(0, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
            spoteffects((1));
            return (0);
        }
    }
    bc_control.value = 1 | 2;
    move_bc(1, bc_control.value, ballx.value, bally.value, chainx.value, chainy.value);
    if (dist2(x, y, game.u.ux, game.u.uy) > 2) {
        /* Awful case: we're still in range of the ball, so we thought we
         * could only move the chain, but it turned out that the target
         * square for the chain was rock, so we had to drag it instead.
         * But we can't drag it either, because we teleported and are more
         * than one square from our old position.  Revert to the teleport
         * behavior.
         */
        ballx.value = chainx.value = x;
        bally.value = chainy.value = y;
    } else {
        let newchainx = game.u.ux;
        let newchainy = game.u.uy;
        if (dist2(x, y, game.uchain.ox, game.uchain.oy) == 4 && !(((game.level.locations[newchainx][newchainy].typ) < POOL) || (((game.level.locations[newchainx][newchainy].typ) == DOOR) && (game.level.locations[newchainx][newchainy].flags & (4 | 8))))) {
            /*
         * Generally, chain moves to hero's previous location and ball
         * moves to chain's previous location, except that we try to
         * keep the chain directly between the hero and the ball.  But,
         * take the simple approach if the hero's previous location or
         * the potential between location is inaccessible.
         */
            newchainx = Math.trunc((x + game.uchain.ox) / 2);
            newchainy = Math.trunc((y + game.uchain.oy) / 2);
            if ((((game.level.locations[newchainx][newchainy].typ) < POOL) || (((game.level.locations[newchainx][newchainy].typ) == DOOR) && (game.level.locations[newchainx][newchainy].flags & (4 | 8))))) {
                /* don't let chain move to inaccessible location */
                newchainx = game.u.ux;
                newchainy = game.u.uy;
            }
        }
        ballx.value = game.uchain.ox;
        bally.value = game.uchain.oy;
        chainx.value = newchainx;
        chainy.value = newchainy;
    }
    cause_delay.value = (1);
    return (1);
}
/*
 *  drop_ball()
 *
 *  The punished hero drops or throws her iron ball.  If the hero is
 *  blind, we must reset the order and glyph.  Check for side effects.
 *  This routine expects the ball to be already placed.
 *
 *  Should not be called while swallowed.
 */
const __drop_ball_pullmsg = "The ball pulls you out of the ";
export function drop_ball(x, y) {
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        game.u.bc_order = bc_order();
        game.u.bglyph = (game.u.bc_order) ? game.u.cglyph : game.level.locations[x][y].glyph;
    }
    if (x != game.u.ux || y != game.u.uy) {
        let t = null;
        let side = 0;
        if (game.u.utrap && game.u.utraptype != TT_INFLOOR && game.u.utraptype != TT_BURIEDBALL) {
            switch (game.u.utraptype) {
                case TT_PIT:
                    pline("%s%s!", __drop_ball_pullmsg, "pit");
                    break;
                case TT_WEB:
                    pline("%s%s!", __drop_ball_pullmsg, "web");
                    ;
                    pline_The("web is destroyed!");
                    deltrap(t_at(game.u.ux, game.u.uy));
                    break;
                case TT_LAVA:
                    pline("%s%s!", __drop_ball_pullmsg, hliquid("lava"));
                    break;
                case TT_BEARTRAP:
                    side = rn2(3) ? 131072 : 262144;
                    pline("%s%s!", __drop_ball_pullmsg, "bear trap");
                    set_wounded_legs(side, (rn2(1000) + (500)));
                    if (!game.u.usteed) {
                        Your("%s %s is severely damaged.", (side == 131072) ? "left" : "right", body_part(LEG));
                        losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((2) + 1) / 2)) : (2)), "leg damage from being pulled out of a bear trap", 1);
                    }
                    break;
            }
            reset_utrap((1));
            fill_pit(game.u.ux, game.u.uy);
        }
        game.u.ux0 = game.u.ux;
        game.u.uy0 = game.u.uy;
        if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !(game.level.monsters[x][y] != null) && !game.u.utrap && (is_pool(x, y) || ((t = t_at(x, y)) && (((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT) || ((t.ttyp) == HOLE || (t.ttyp) == TRAPDOOR))))) {
            game.u.ux = x;
            game.u.uy = y;
        } else {
            game.u.ux = x - game.u.dx;
            game.u.uy = y - game.u.dy;
        }
        /* hero has moved, recalc vision later */
        game.vision_full_recalc = 1;
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            /* drop glyph under the chain */
            if (game.u.bc_felt & 2) {
                game.level.locations[game.uchain.ox][game.uchain.oy].glyph = game.u.cglyph;
            }
            game.u.bc_felt = 0;
            game.u.cglyph = (game.u.bc_order) ? game.u.bglyph : game.level.locations[game.u.ux][game.u.uy].glyph;
        }
        movobj(game.uchain, game.u.ux, game.u.uy);
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            game.u.bc_order = bc_order();
        }
        newsym(game.u.ux0, game.u.uy0);
        if (game.u.ux0 != game.u.ux || game.u.uy0 != game.u.uy) {
            spoteffects((1));
        }
    }
}
/* ball&chain cause hero to randomly lose stuff from inventory */
export function litter() {
    let otmp = null;
    let nextobj = null;
    let capacity = weight_cap();
    for (otmp = game.invent; otmp; otmp = nextobj) {
        nextobj = otmp.nobj;
        if (otmp != game.uball && rnd(capacity) <= otmp.owt) {
            if (canletgo(otmp, "")) {
                You("drop %s and %s %s down the stairs with you.", yname(otmp), (otmp.quan == 1) ? "it" : "they", otense(otmp, "fall"));
                setnotworn(otmp);
                freeinv(otmp);
                hitfloor(otmp, (0));
            }
        }
    }
}
export function drag_down() {
    let forward = 0;
    let dragchance = 3;
    /*
     *  Assume that the ball falls forward if:
     *
     *  a) the character is wielding it, or
     *  b) the character has both hands available to hold it (i.e. is
     *     not wielding any weapon), or
     *  c) (perhaps) it falls forward out of his non-weapon hand
     */
    forward = ((game.uball).where == 3) && (game.uwep == game.uball || !game.uwep || !rn2(3));
    if (((game.uball).where == 3) && !welded(game.uball)) {
        You("lose your grip on the iron ball.");
    }
    /* previous level is still displayed although you
               went down the stairs. Avoids bug C343-20 */
    cls();
    if (forward) {
        if (rn2(6)) {
            pline_The("iron ball drags you downstairs!");
            losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(6)) + 1) / 2)) : (rnd(6))), "dragged downstairs by an iron ball", 2);
            litter();
        }
    } else {
        if (rn2(2)) {
            ;
            pline_The("iron ball smacks into you!");
            losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(20)) + 1) / 2)) : (rnd(20))), "iron ball collision", 0);
            exercise(A_STR, (0));
            dragchance -= 2;
        }
        if (dragchance >= rnd(6)) {
            pline_The("iron ball drags you downstairs!");
            losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(3)) + 1) / 2)) : (rnd(3))), "dragged downstairs by an iron ball", 2);
            exercise(A_STR, (0));
            litter();
        }
    }
}
export function bc_sanity_check() {
    let otyp = 0;
    let freeball = 0;
    let freechain = 0;
    let onam = null;
    if ((game.uball != null) && (!game.uball || !game.uchain)) {
        impossible("Punished without %s%s%s?", !game.uball ? "iron ball" : "", (!game.uball && !game.uchain) ? " and " : "", !game.uchain ? "attached chain" : "");
    } else if (!(game.uball != null) && (game.uball || game.uchain)) {
        impossible("Attached %s%s%s without being Punished?", game.uchain ? "chain" : "", (game.uchain && game.uball) ? " and " : "", game.uball ? "iron ball" : "");
    }
    /* ball is free when swallowed, when changing levels or during air bubble
       management on Plane of Water (both of which start and end in between
       sanity checking cycles, so shouldn't be relevant), other times? */
    freechain = (!game.uchain || game.uchain.where == 0);
    freeball = (!game.uball || game.uball.where == 0 || (freechain && game.uball.where == 3));
    if (game.uball && (game.uball.otyp != HEAVY_IRON_BALL || (game.uball.where != 1 && game.uball.where != 3 && game.uball.where != 0) || (freeball ^ freechain) || (game.uball.owornmask & 2097152) == 0 || (game.uball.owornmask & ~(2097152 | (256 | 1024 | 512))) != 0)) {
        /* lie to simplify the testing logic */
        otyp = game.uball.otyp;
        onam = safe_typename(otyp);
        impossible("uball: type %d (%s), where %d, wornmask=0x%08lx", otyp, onam, game.uball.where, game.uball.owornmask);
    }
    if (game.uchain && (game.uchain.otyp != IRON_CHAIN || (game.uchain.where != 1 && game.uchain.where != 0) || (freechain ^ freeball) || (game.uchain.owornmask & 4194304) == 0 || (game.uchain.owornmask & ~4194304) != 0)) {
        /* similar check to ball except can't be in inventory */
        /* [could simplify this to owornmask != W_CHAIN] */
        otyp = game.uchain.otyp;
        onam = safe_typename(otyp);
        impossible("uchain: type %d (%s), where %d, wornmask=0x%08lx", otyp, onam, game.uchain.where, game.uchain.owornmask);
    }
    if (game.uball && game.uchain && !(freeball && freechain)) {
        let bx = 0;
        let by = 0;
        let cx = 0;
        let cy = 0;
        let bdx = 0;
        let bdy = 0;
        let cdx = 0;
        let cdy = 0;
        /* non-free chain should be under or next to the hero;
           non-free ball should be on or next to the chain or else carried */
        cx = game.uchain.ox , cy = game.uchain.oy;
        cdx = cx - game.u.ux , cdy = cy - game.u.uy;
        cdx = abs(cdx) , cdy = abs(cdy);
        if (game.uball.where == 3) {
            bx = game.u.ux , by = game.u.uy;
        } else {
            bx = game.uball.ox , by = game.uball.oy;
        }
        bdx = bx - cx , bdy = by - cy;
        bdx = abs(bdx) , bdy = abs(bdy);
        if (cdx > 1 || cdy > 1 || bdx > 1 || bdy > 1) {
            impossible("b&c distance: you@<%d,%d>, chain@<%d,%d>, ball@<%d,%d>", game.u.ux, game.u.uy, cx, cy, bx, by);
        }
    }
}
/*ball.c*/
