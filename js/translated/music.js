/* NetHack 5.0	music.c	$NHDT-Date: 1736530208 2025/01/10 09:30:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.120 $ */
/*      Copyright (c) 1989 by Jean-Christophe Collet */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * This file contains the different functions designed to manipulate the
 * musical instruments and their various effects.
 *
 * The list of instruments / effects is :
 *
 * (wooden) flute       may calm snakes if player has enough dexterity
 * magic flute          may put monsters to sleep:  area of effect depends
 *                      on player level.
 * (tooled) horn        Will awaken monsters:  area of effect depends on
 *                      player level.  May also scare monsters.
 * fire horn            Acts like a wand of fire.
 * frost horn           Acts like a wand of cold.
 * bugle                Will awaken soldiers (if any):  area of effect depends
 *                      on player level.
 * (wooden) harp        May calm nymph if player has enough dexterity.
 * magic harp           Charm monsters:  area of effect depends on player
 *                      level.
 * (leather) drum       Will awaken monsters like the horn.
 * drum of earthquake   Will initiate an earthquake whose intensity depends
 *                      on player level.  That is, it creates random pits
 *                      called here chasms.
 */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcmp, strcpy, strlen } from '../c2js-runtime/string.js';
import { acurr, exercise } from './attrib.js';
import { getdir, isok, yn_function } from './cmd.js';
import { close_drawbridge, find_drawbridge, is_drawbridge_wall, open_drawbridge } from './dbridge.js';
import { c_common_strings, ynqchars } from './decl.js';
import { cvt_sdoor_to_door } from './detect.js';
import { fillholetyp, liquid_flow } from './dig.js';
import { canseemon, newsym } from './display.js';
import { flooreffects } from './do.js';
import { Amonnam, Monnam, a_monnam, mon_nam, x_monnam } from './do_name.js';
import { tamedog } from './dog.js';
import { In_V_tower, on_level } from './dungeon.js';
import { in_rooms, losehp } from './hack.js';
import { dist2, highc, mungspaces } from './hacklib.js';
import { align_str, record_achievement } from './insight.js';
import { consume_obj_charge, sobj_at } from './invent.js';
import { sleep_monst, slept_monst } from './mhitm.js';
import { set_levltyp } from './mkmaze.js';
import { obj_extract_self } from './mkobj.js';
import { seemimic, wakeup, xkilled } from './mon.js';
import { can_blow } from './mondata.js';
import { monflee, onscary } from './monmove.js';
import { ACH_TUNE, ALTAR, A_DEX, A_WIS, BLINDED, BOULDER, BUGLE, CONFUSION, CORR, DEAF, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, DRUM_OF_EARTHQUAKE, FIRE_HORN, FLYING, FOUNTAIN, FROST_HORN, FUMBLING, GRAVE, HALF_PHDAM, HALLUC, HALLUC_RES, LEATHER_DRUM, LEVITATION, MAGIC_FLUTE, MAGIC_HARP, M_AP_MONSTER, M_AP_NOTHING, PIT, PM_ARCHEOLOGIST, PM_GUARD, ROOM, SCORR, SDOOR, SHOPBASE, SINK, SPIKED_PIT, STUNNED, S_MIMIC, S_NYMPH, S_SNAKE, THRONE, TOOLED_HORN, TOOL_CLASS, TT_BURIEDBALL, TT_PIT, UNCHANGING, WOODEN_FLUTE, WOODEN_HARP, ins_no_instrument } from './nh-constants.js';
import { discover_object } from './o_init.js';
import { Tobjnam, Yname2, an, the, thesimpleoname, xname, yname } from './objnam.js';
import { Norep } from './pline.js';
import { incr_itimeout } from './potion.js';
import { altarmask_at, desecrate_altar } from './pray.js';
import { d, rn2, rnd, rnl } from './rnd.js';
import { genders } from './role.js';
import { add_damage } from './shk.js';
import { maketrap, mselftouch, reset_utrap, selftouch, set_utrap, t_at } from './trap.js';
import { recalc_block_point, unblock_point } from './vision.js';
import { getlin } from './windows.js';
import { flash_str, resist, ubuzz, zapyourself } from './zap.js';

/* wake up monster, possibly scare it */
export function awaken_scare(mtmp, scary) {
    mtmp.msleeping = 0;
    mtmp.mcanmove = 1;
    mtmp.mfrozen = 0;
    /* may scare some monsters -- waiting monsters excluded */
    if (!(((mtmp.data).geno & 4096) != 0) && (mtmp.mstrategy & (268435456 | 536870912)) != 0) {
        mtmp.mstrategy &= ~(268435456 | 536870912);
    } else if (scary && !(((mtmp.data).mflags1 & 65536) != 0) && !resist(mtmp, TOOL_CLASS, 0, 0) && onscary(0, 0, mtmp)) {
        monflee(mtmp, 0, (0), (1));
    }
}
/*
 * Wake every monster in range...
 */
export function awaken_monsters(distance) {
    let mtmp = null;
    let distm = 0;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if ((distm = dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy)) < distance) {
            awaken_scare(mtmp, (distm < Math.trunc(distance / 3)));
        }
    }
}
/*
 * Make monsters fall asleep.  Note that they may resist the spell.
 */
export function put_monsters_to_sleep(distance) {
    let mtmp = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) < distance && sleep_monst(mtmp, d(10, 10), TOOL_CLASS)) {
            /* 10d10 turns + wake_nearby to rouse */
            mtmp.msleeping = 1;
            slept_monst(mtmp);
        }
    }
}
/*
 * Charm snakes in range.  Note that the snakes are NOT tamed.
 */
export function charm_snakes(distance) {
    let mtmp = null;
    let could_see_mon = 0;
    let was_peaceful = 0;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (mtmp.data.mlet == S_SNAKE && mtmp.mcanmove && dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) < distance) {
            was_peaceful = mtmp.mpeaceful;
            mtmp.mpeaceful = 1;
            mtmp.mavenge = 0;
            mtmp.mstrategy &= ~(268435456 | 536870912);
            could_see_mon = canseemon(mtmp);
            mtmp.mundetected = 0;
            newsym(mtmp.mx, mtmp.my);
            if (canseemon(mtmp)) {
                if (!could_see_mon) {
                    You("notice %s, swaying with the music.", a_monnam(mtmp));
                } else {
                    pline("%s freezes, then sways with the music%s.", Monnam(mtmp), was_peaceful ? "" : ", and now seems quieter");
                }
            }
        }
    }
}
/*
 * Calm nymphs in range.
 */
export function calm_nymphs(distance) {
    let mtmp = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (mtmp.data.mlet == S_NYMPH && mtmp.mcanmove && dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) < distance) {
            mtmp.msleeping = 0;
            mtmp.mpeaceful = 1;
            mtmp.mavenge = 0;
            mtmp.mstrategy &= ~(268435456 | 536870912);
            if (canseemon(mtmp)) {
                pline("%s listens cheerfully to the music, then seems quieter.", Monnam(mtmp));
            }
        }
    }
}
/* Awake soldiers anywhere the level (and any nearby monster). */
/* monster that played instrument */
export function awaken_soldiers(bugler) {
    let mtmp = null;
    let distance = 0;
    let distm = 0;
    /* distance of affected non-soldier monsters to bugler */
    distance = ((bugler == game.youmonst) ? game.u.ulevel : bugler.data.mlevel) * 30;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if ((((mtmp.data).mflags2 & 512) != 0) && mtmp.data != game.mons[PM_GUARD]) {
            if (!mtmp.mtame) {
                mtmp.mpeaceful = 0;
            }
            mtmp.msleeping = mtmp.mfrozen = 0;
            mtmp.mcanmove = 1;
            mtmp.mstrategy &= ~(268435456 | 536870912);
            if (canseemon(mtmp)) {
                pline("%s is now ready for battle!", Monnam(mtmp));
            } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                Norep("%s the rattle of battle gear being readied.", "You hear");
            }
        } else if ((distm = ((bugler == game.youmonst) ? dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) : dist2(bugler.mx, bugler.my, mtmp.mx, mtmp.my))) < distance) {
            awaken_scare(mtmp, (distm < Math.trunc(distance / 3)));
        }
    }
}
/* Charm monsters in range.  Note that they may resist the spell. */
export function charm_monsters(distance) {
    let mtmp = null;
    let mtmp2 = null;
    if (game.u.uswallow) {
        distance = 0;
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp2) {
        /* only u.ustuck will be affected (u.usteed is Null
                       * since hero gets forcibly dismounted when engulfed) */
        mtmp2 = mtmp.nmon;
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= distance) {
            /* a shopkeeper can't be tamed but tamedog() pacifies an angry
               one; do that even if mtmp resists in order to behave the same
               as a non-cursed scroll of taming or spell of charm monster */
            if (!resist(mtmp, TOOL_CLASS, 0, 0) || mtmp.isshk) {
                tamedog(mtmp, null, (1));
            }
        }
    }
}
/* Try to make a pit. */
export function do_pit(x, y, tu_pit) {
    let mtmp = null;
    let otmp = null;
    let chasm = null;
    let filltype = 0;
    chasm = maketrap(x, y, PIT);
    if (!chasm) {
        return;
    }
    /* no pit if portal at that location */
    chasm.tseen = 1;
    mtmp = (game.level.monsters[x][y]);
    if ((otmp = sobj_at(BOULDER, x, y)) != null) {
        if (((game.viz_array[y][x] & 2) != 0)) {
            pline("KADOOM!  The boulder falls into a chasm%s!", ((x) == game.u.ux && (y) == game.u.uy) ? " below you" : "");
        }
        if (mtmp) {
            mtmp.mtrapped = 0;
        }
        obj_extract_self(otmp);
        flooreffects(otmp, x, y, "");
        return;
    }
    /* Let liquid flow into the newly created chasm.
       Adjust corresponding code in apply.c for exploding
       wand of digging if you alter this sequence. */
    filltype = fillholetyp(x, y, (0));
    if (filltype != ROOM) {
        set_levltyp(x, y, filltype);
        liquid_flow(x, y, filltype, chasm, null);
        /* liquid_flow() deletes trap, might kill mtmp */
        if ((chasm = t_at(x, y)) == (null)) {
            return;
        }
    }
    if (mtmp) {
        if (!(((mtmp.data).mflags1 & 1) != 0) && !(((mtmp.data).mflags1 & 16) != 0)) {
            /* We have to check whether monsters or hero falls into a
       new pit....  Note: if we get here, chasm is non-Null. */
            let m_already_trapped = mtmp.mtrapped;
            mtmp.mtrapped = 1;
            if (!m_already_trapped) {
                if (((game.viz_array[y][x] & 2) != 0)) {
                    pline("%s falls into a chasm!", Monnam(mtmp));
                } else if ((((mtmp.data).mflags1 & 131072) != 0)) {
                    ;
                    You_hear("a scream!");
                }
            }
            /* Falling is okay for falling down
               within a pit from jostling too */
            mselftouch(mtmp, "Falling, ", (1));
            if (!((mtmp).mhp < 1)) {
                mtmp.mhp -= rnd(m_already_trapped ? 4 : 6);
                if (((mtmp).mhp < 1)) {
                    if (!((game.viz_array[y][x] & 2) != 0)) {
                        pline("It is destroyed!");
                    } else {
                        You("destroy %s!", mtmp.mtame ? x_monnam(mtmp, 1, "poor", ((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? 8 : 0, (0)) : mon_nam(mtmp));
                    }
                    xkilled(mtmp, 1);
                }
            }
        }
    } else if (((x) == game.u.ux && (y) == game.u.uy)) {
        if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
            /* Note:  the chain should break if a pit gets
               created at the buried ball's location, which
               is not necessarily here.  But if we don't do
               things this way, entering the new pit below
               will override current trap anyway, but too
               late to get Lev and Fly handling. */
            Your("chain breaks!");
            reset_utrap((1));
        }
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || (((game.youmonst.data).mflags1 & 16) != 0)) {
            if (!tu_pit) {
                pline("A chasm opens up under you!");
                You("don't fall in!");
            }
        } else if (!tu_pit || !game.u.utrap || game.u.utraptype != TT_PIT) {
            /* no pit here previously, or you were
               not in it even if there was */
            You("fall into a chasm!");
            set_utrap((rn2(6) + (2)), TT_PIT);
            losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(6)) + 1) / 2)) : (rnd(6))), "fell into a chasm", 2);
            selftouch("Falling, you");
        } else if (game.u.utrap && game.u.utraptype == TT_PIT) {
            let keepfooting = (!((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) && rn2(5)) && (!(rnl((game.urole.mnum == (PM_ARCHEOLOGIST)) ? 3 : 9)) || (((acurr(A_DEX)) > 7) && rn2(5))));
            You("are jostled around violently!");
            set_utrap((rn2(6) + (2)), TT_PIT);
            losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(keepfooting ? 2 : 4)) + 1) / 2)) : (rnd(keepfooting ? 2 : 4))), "hurt in a chasm", 2);
            if (keepfooting) {
                exercise(A_DEX, (1));
            } else {
                selftouch(((game.u.umonnum != game.u.umonster) && ((((game.youmonst.data).mflags1 & 524288) != 0) || (((game.youmonst.data).mflags1 & 24576) == 24576))) ? "Shaken, you" : "Falling down, you");
            }
        }
    } else {
        newsym(x, y);
    }
}
/* Generate earthquake :-) of desired force.
 * That is:  create random chasms (pits).
 */
const __do_earthquake_into_a_chasm = " into a chasm";
export function do_earthquake(force) {
    let x = 0;
    let y = 0;
    let mtmp = null;
    let trap_at_u = t_at(game.u.ux, game.u.uy);
    let start_x = 0;
    let start_y = 0;
    let end_x = 0;
    let end_y = 0;
    let amsk = 0;
    let algn = 0;
    let tu_pit = 0;
    if (trap_at_u) {
        tu_pit = ((trap_at_u.ttyp) == PIT || (trap_at_u.ttyp) == SPIKED_PIT);
    }
    /* sanity precaution; maximum used is actually 10 */
    if (force > 13) {
        force = 13;
    }
    start_x = game.u.ux - (force * 2);
    start_y = game.u.uy - (force * 2);
    end_x = game.u.ux + (force * 2);
    end_y = game.u.uy + (force * 2);
    start_x = ((start_x) > (1) ? (start_x) : (1));
    start_y = ((start_y) > (0) ? (start_y) : (0));
    end_x = ((end_x) < (80 - 1) ? (end_x) : (80 - 1));
    end_y = ((end_y) < (21 - 1) ? (end_y) : (21 - 1));
    for (x = start_x; x <= end_x; x++) {
        for (y = start_y; y <= end_y; y++) {
            if ((mtmp = (game.level.monsters[x][y])) != null) {
                /* peaceful monster will become hostile */
                wakeup(mtmp, (1));
                if (mtmp.mundetected) {
                    mtmp.mundetected = 0;
                    newsym(x, y);
                    if (((((mtmp.data).mflags1 & 256) != 0) && (((((mtmp.data).mflags1 & 16) != 0) && (mtmp.data).mlet != S_MIMIC) || (((mtmp.data).mflags1 & 1) != 0)))) {
                        if (((game.viz_array[y][x] & 2) != 0)) {
                            pline("%s is shaken loose from the ceiling!", Amonnam(mtmp));
                        } else if (!(((mtmp.data).mflags1 & 1) != 0)) {
                            ;
                            You_hear("a thump.");
                        }
                    }
                }
                if (((mtmp).m_ap_type & 7) != M_AP_NOTHING && ((mtmp).m_ap_type & 7) != M_AP_MONSTER) {
                    seemimic(mtmp);
                }
            }
            if (rn2(14 - force)) {
                continue;
            }
            switch (game.level.locations[x][y].typ) {
                /*
        * Possible extensions:
        *  When a door is trapped, explode it instead of silently
        *   turning it into an empty doorway.
        *  Trigger divine wrath when an altar is dumped into a chasm.
        *  Sometimes replace sink with fountain or fountain with pool
        *   instead of always producing a pit.
        *  Sometimes release monster and/or treasure from a grave or
        *   a throne instead of just dumping them into the chasm.
        *  Chance to destroy wall segments?  Trees too?
        *  Honor non-diggable for locked doors, walls, and trees.
        *   Treat non-passwall as if it was non-diggable?
        *  Conjoin some of the umpteen pits when they're adjacent?
        *
        *  Replace 'goto do_pit;' with 'do_pit = TRUE; break;' and
        *   move the pit code to after the switch.
        */
                /* make the fountain disappear */
                case FOUNTAIN:
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        pline_The("fountain falls%s.", __do_earthquake_into_a_chasm);
                    }
                    do_pit(x, y, tu_pit);
                    break;
                case SINK:
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        pline_The("kitchen sink falls%s.", __do_earthquake_into_a_chasm);
                    }
                    do_pit(x, y, tu_pit);
                    break;
                case ALTAR:
                    amsk = altarmask_at(x, y);
                    /* always preserve the high altars */
                    if ((amsk & 16) != 0) {
                        break;
                    }
                    algn = (((((amsk & 7) & 7) == 0) ? (-128) : (((amsk & 7) & 7) == 4) ? 1 : (((amsk & 7) & 7)) - 2));
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        pline_The("%s altar falls%s.", align_str(algn), __do_earthquake_into_a_chasm);
                    }
                    desecrate_altar((0), algn);
                    do_pit(x, y, tu_pit);
                    break;
                case GRAVE:
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        pline_The("headstone topples%s.", __do_earthquake_into_a_chasm);
                    }
                    do_pit(x, y, tu_pit);
                    break;
                case THRONE:
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        pline_The("throne falls%s.", __do_earthquake_into_a_chasm);
                    }
                    do_pit(x, y, tu_pit);
                    break;
                case SCORR:
                    game.level.locations[x][y].typ = CORR;
                    unblock_point(x, y);
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        pline("A secret corridor is revealed.");
                    }
                    ;
                case CORR:
                case ROOM:
                    do_pit(x, y, tu_pit);
                    break;
                case SDOOR:
                    cvt_sdoor_to_door(game.level.locations[x][y]);
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        pline("A secret door is revealed.");
                    }
                    ;
                case DOOR:
                    if (game.level.locations[x][y].flags == 0) {
                        /* if already doorless, treat like room or corridor */
                        do_pit(x, y, tu_pit);
                        break;
                    }
                    game.level.locations[x][y].flags = 0;
                    /* wasn't doorless, now it will be */
                    recalc_block_point(x, y);
                    newsym(x, y);
                    if (((game.viz_array[y][x] & 2) != 0)) {
                        pline_The("door collapses.");
                    }
                    if (in_rooms(x, y, SHOPBASE)) {
                        add_damage(x, y, 0);
                    }
                    break;
            }
        }
    }
}
export function generic_lvl_desc() {
    if ((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level))))) {
        return "astral plane";
    } else if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        return "plane";
    } else if ((((((game.dungeon_topology.d_sanctum_level)).dlevel || ((game.dungeon_topology.d_sanctum_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_sanctum_level))))) {
        return "sanctum";
    } else if (((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum))) {
        return "puzzle";
    } else if (In_V_tower(game.u.uz)) {
        return "tower";
    } else {
        return "dungeon";
    }
}
const beats = ["stepper", "one drop", "slow two", "triple stroke roll", "double shuffle", "half-time shuffle", "second line", "train"];
/*
 * The player is trying to extract something from his/her instrument.
 */
let __do_improvisation_my_goto_song = [67, 0];
let __do_improvisation_improvisation = __do_improvisation_my_goto_song;
export function do_improvisation(instr) {
    let damage = 0;
    let mode = 0;
    let do_spec = !(game.u.uprops[STUNNED].intrinsic || game.u.uprops[CONFUSION].intrinsic);
    let itmp = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let mundane = (0);
    let same_old_song = (0);
    Object.assign(itmp, instr);
    /* ok on this copy as instr maintains
                                        * the ptr to free at some point if
                                        * there is one */
    itmp.oextra = null;
    if (!do_spec || instr.spe <= 0) {
        while (game.objects[itmp.otyp].oc_magic) {
            /* if won't yield special effect, make sound of mundane counterpart */
            itmp.otyp -= 1;
            mundane = (1);
        }
    }
    mode = 0;
    if (game.u.uprops[STUNNED].intrinsic) {
        mode |= 1;
    }
    if (game.u.uprops[CONFUSION].intrinsic) {
        mode |= 2;
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        mode |= 4;
    }
    if (!rn2(2)) {
        /*
         * TEMPORARY?  for multiple impairments, don't always
         * give the generic "it's far from music" message.
         */
        /* remove if STUNNED+CONFUSED ever gets its own message below */
        if (mode == (1 | 2)) {
            mode = !rn2(2) ? 1 : 2;
        }
        /* likewise for stunned and/or confused combined with hallucination */
        if (mode & 4) {
            mode = 4;
        }
    }
    switch (mode) {
        /* 3.6.3: most of these gave "You produce <blah>" and then many of
       the instrument-specific messages below which immediately follow
       also gave "You produce <something>."  That looked strange so we
       now use a different verb here */
        case 0:
            You("start playing %s.", yname(instr));
            break;
        case 1:
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                You("radiate an obnoxious droning sound.");
            } else {
                You_feel("a monotonous vibration.");
            }
            break;
        case 2:
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                You("generate a raucous noise.");
            } else {
                You_feel("a jarring vibration.");
            }
            break;
        case 4:
            You("disseminate a kaleidoscopic display of floating butterflies.");
            break;
        /* TODO? give some or all of these combinations their own feedback;
       hallucination ones should reference senses other than hearing... */
        case 1 | 2:
        case 1 | 4:
        case 2 | 4:
        case 1 | 2 | 4:
        default:
            pline("What you perform is quite far from music...");
            break;
    }
    __do_improvisation_improvisation = improvised_notes({ get value() { return same_old_song; }, set value(_v) { same_old_song = _v; } });
    switch (itmp.otyp) {
        /* note: itmp.otyp might differ from instr->otyp */
        /* Make monster fall asleep */
        case MAGIC_FLUTE:
            consume_obj_charge(instr, (1));
            You("%sproduce %s%s music.", !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "" : "seem to ", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "piped" : "soft", same_old_song ? ", familiar" : "");
            ;
            put_monsters_to_sleep(game.u.ulevel * 5);
            exercise(A_DEX, (1));
            break;
        case WOODEN_FLUTE:
            do_spec &= (rn2((acurr(A_DEX))) + game.u.ulevel > 25);
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                pline("%s%s.", Tobjnam(instr, do_spec ? "trill" : "toot"), same_old_song ? " a familiar tune" : "");
            } else {
                You_feel("%s %s.", yname(instr), do_spec ? "trill" : "toot");
            }
            ;
            if (do_spec) {
                charm_snakes(game.u.ulevel * 3);
            }
            exercise(A_DEX, (1));
            break;
        case FIRE_HORN:
        case FROST_HORN:
            consume_obj_charge(instr, (1));
            if (!getdir(null)) {
                pline("%s.", Tobjnam(instr, "vibrate"));
                break;
            } else if (!game.u.dx && !game.u.dy && !game.u.dz) {
                if ((damage = zapyourself(instr, (1))) != 0) {
                    let buf = '';
                    buf = sprintf(buf, "using a magical horn on %sself", (genders[game.flags.female ? 1 : 0].him));
                    ;
                    losehp(damage, buf, 1);
                }
            } else {
                let type = (abs(((instr.otyp == FROST_HORN) ? 3 : 2) - 1) % 10);
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    pline("A %s blasts out of the horn!", flash_str(type, (0)));
                }
                ;
                game.current_wand = instr;
                ubuzz((0 + (type)), (rn2(6) + (6)));
                game.current_wand = null;
            }
            discover_object((instr.otyp), (1), (1), (1));
            break;
        /* Awaken or scare monsters */
        case TOOLED_HORN:
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                You("produce a frightful, grave%s sound.", same_old_song ? ", yet familiar," : "");
            } else {
                You("blow into the horn.");
            }
            ;
            awaken_monsters(game.u.ulevel * 30);
            exercise(A_WIS, (0));
            break;
        /* Awaken & attract soldiers */
        case BUGLE:
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                You("extract a loud%s noise from %s.", same_old_song ? ", familiar" : "", yname(instr));
            } else {
                You("blow into the bugle.");
            }
            ;
            awaken_soldiers(game.youmonst);
            exercise(A_WIS, (0));
            break;
        case MAGIC_HARP:
            consume_obj_charge(instr, (1));
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                pline("%s very attractive%s music.", Tobjnam(instr, "produce"), same_old_song ? " and familiar" : "");
            } else {
                You_feel("very soothing vibrations.");
            }
            ;
            charm_monsters(Math.trunc((game.u.ulevel - 1) / 3) + 1);
            exercise(A_DEX, (1));
            break;
        case WOODEN_HARP:
            do_spec &= (rn2((acurr(A_DEX))) + game.u.ulevel > 25);
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                pline("%s %s.", Yname2(instr), (do_spec && same_old_song) ? "produces a familiar, lilting melody" : (do_spec) ? "produces a lilting melody" : (same_old_song) ? "twangs a familiar tune" : "twangs");
            } else {
                You_feel("soothing vibrations.");
            }
            ;
            if (do_spec) {
                calm_nymphs(game.u.ulevel * 3);
            }
            exercise(A_DEX, (1));
            break;
        case DRUM_OF_EARTHQUAKE:
            consume_obj_charge(instr, (1));
            You("produce a heavy, thunderous rolling!");
            ;
            pline_The("entire %s is shaking around you!", generic_lvl_desc());
            do_earthquake(Math.trunc((game.u.ulevel - 1) / 3) + 1);
            /* shake up monsters in a much larger radius... */
            awaken_monsters(21 * 80);
            discover_object((DRUM_OF_EARTHQUAKE), (1), (1), (1));
            break;
        case LEATHER_DRUM:
            if (!mundane) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    /* a drum of earthquake does not cause deafness
           while still magically functional, nor afterwards
           when it invokes the LEATHER_DRUM case instead and
           mundane is flagged */
                    You("beat a %sdeafening row!", same_old_song ? "familiar " : "");
                    ;
                    incr_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, (rn2(20) + (30)));
                } else {
                    You("pound on the drum.");
                }
                exercise(A_WIS, (0));
            } else {
                /* TODO maybe: sound effects for these riffs */
                You("%s %s.", rn2(2) ? "butcher" : rn2(2) ? "manage" : "pull off", an(beats[rn2((Math.trunc(64 /* sizeof(const char *[8]) */ / 8 /* sizeof(const char *) */)))]));
                ;
            }
            awaken_monsters(game.u.ulevel * (mundane ? 5 : 40));
            game.disp.botl = (1);
            break;
        default:
            impossible("What a weird instrument (%d)!", instr.otyp);
            return 0;
    }
    ((__do_improvisation_improvisation));
    return 2;
}
const __improvised_notes_notes = [65, 66, 67, 68, 69, 70, 71];
export function improvised_notes(same_as_last_time) {
    if (!((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && game.context.jingle[0] != 0)) {
        /* target buffer has to be in svc.context, otherwise saving game
     * between improvised recitals would not be able to maintain
     * the same_as_last_time context. */
        /* You can change your tune, usually */
        let i = 0;
        let notecount = rnd((Math.trunc(6 /* sizeof(char [6]) */ / 1 /* sizeof(char) */)) - 1);
        for (i = 0; i < notecount; ++i) {
            game.context.jingle[i] = __improvised_notes_notes[rn2((Math.trunc(7 /* sizeof(const char [7]) */ / 1 /* sizeof(const char) */)))];
        }
        game.context.jingle[notecount] = 0;
        same_as_last_time.value = (0);
    } else {
        same_as_last_time.value = (1);
    }
    return game.context.jingle;
}
/*
 * So you want music...
 */
export function do_play_instrument(instr) {
    let buf = '';
    let c = 0;
    let __nh_s_idx = 0;
    let x = 0;
    let y = 0;
    let ok = 0;
    nevermind: {
        buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        c = 121;
        if ((game.u.uinwater)) {
            You_cant("play music underwater!");
            return 0;
        } else if ((instr.otyp == WOODEN_FLUTE || instr.otyp == MAGIC_FLUTE || instr.otyp == TOOLED_HORN || instr.otyp == FROST_HORN || instr.otyp == FIRE_HORN || instr.otyp == BUGLE) && !can_blow(game.youmonst)) {
            You("are incapable of playing %s.", thesimpleoname(instr));
            return 0;
        }
        if (instr.otyp != LEATHER_DRUM && instr.otyp != DRUM_OF_EARTHQUAKE && !(game.u.uprops[STUNNED].intrinsic || game.u.uprops[CONFUSION].intrinsic || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))) {
            c = yn_function("Improvise?", ynqchars, 113, (1));
            if (c == 113) {
                break nevermind;
            }
        }
        if (c != 110) {
            return do_improvisation(instr) ? 1 : 0;
        }
        if (game.u.uevent.uheard_tune == 2) {
            c = yn_function("Play the passtune?", ynqchars, 113, (1));
        }
        if (c == 113) {
            break nevermind;
        } else if (c == 121) {
            buf = strcpy(buf, game.tune);
        } else {
            getlin("What tune are you playing? [5 notes, A-G]", buf);
            buf = mungspaces(buf);
            if (buf == 27) {
                break nevermind;
            }
            for (__nh_s_idx = 0; buf[__nh_s_idx]; __nh_s_idx++) {
                /* convert to uppercase and change any "H" to the expected "B" */
                buf[__nh_s_idx] = highc(buf[__nh_s_idx]);
                if (buf[__nh_s_idx] == 72) {
                    buf[__nh_s_idx] = 66;
                }
            }
        }
        You(!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "extract a strange sound from %s!" : "can feel %s emitting vibrations.", the(xname(instr)));
        ;
        if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
            /* Check if there was the Stronghold drawbridge near
     * and if the tune conforms to what we're waiting for.
     */
            exercise(A_WIS, (1));
            if (!strcmp(buf, game.tune)) {
                for (y = game.u.uy - 1; y <= game.u.uy + 1; y++) {
                    for (x = game.u.ux - 1; x <= game.u.ux + 1; x++) {
                        /* Search for the drawbridge */
                        if (!isok(x, y)) {
                            continue;
                        }
                        if (find_drawbridge({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } })) {
                            /* could only get `gears == 5' by playing five
                       correct notes followed by excess; otherwise,
                       tune would have matched above */
                            game.u.uevent.uheard_tune = 2;
                            record_achievement(ACH_TUNE);
                            if (game.level.locations[x][y].typ == DRAWBRIDGE_DOWN) {
                                close_drawbridge(x, y);
                            } else {
                                open_drawbridge(x, y);
                            }
                            return 1;
                        }
                    }
                }
            } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                if (game.u.uevent.uheard_tune < 1) {
                    game.u.uevent.uheard_tune = 1;
                }
                /* Okay, it wasn't the right tune, but perhaps
             * we can give the player some hints like in the
             * Mastermind game */
                ok = (0);
                for (y = game.u.uy - 1; y <= game.u.uy + 1 && !ok; y++) {
                    for (x = game.u.ux - 1; x <= game.u.ux + 1 && !ok; x++) {
                        if (isok(x, y)) {
                            if (((game.level.locations[x][y].typ) == DRAWBRIDGE_UP || (game.level.locations[x][y].typ) == DRAWBRIDGE_DOWN) || is_drawbridge_wall(x, y) >= 0) {
                                ok = (1);
                            }
                        }
                    }
                }
                if (ok) {
                    /* There is a drawbridge near */
                    let tumblers = 0;
                    let gears = 0;
                    let matched = [0, 0, 0, 0, 0];
                    tumblers = gears = 0;
                    for (x = 0; x < 5; x++) {
                        matched[x] = (0);
                    }
                    for (x = 0; x < strlen(buf); x++) {
                        if (x < 5) {
                            if (buf[x] == game.tune[x]) {
                                gears++;
                                matched[x] = (1);
                            } else {
                                for (y = 0; y < 5; y++) {
                                    if (!matched[y] && buf[x] == game.tune[y] && buf[y] != game.tune[y]) {
                                        tumblers++;
                                        matched[y] = (1);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (tumblers) {
                        if (gears) {
                            ;
                            ;
                            You_hear("%d tumbler%s click and %d gear%s turn.", tumblers, (((tumblers) == 1) ? "" : "s"), gears, (((gears) == 1) ? "" : "s"));
                        } else {
                            ;
                            You_hear("%d tumbler%s click.", tumblers, (((tumblers) == 1) ? "" : "s"));
                        }
                    } else if (gears) {
                        You_hear("%d gear%s turn.", gears, (((gears) == 1) ? "" : "s"));
                        if (gears == 5) {
                            game.u.uevent.uheard_tune = 2;
                            record_achievement(ACH_TUNE);
                        }
                    }
                }
            }
        }
        return 1;
    }
    pline("%s", c_common_strings.c_Never_mind);
    return 0;
}
export function obj_to_instr(obj) {
    let ret_instr = ins_no_instrument;
    return ret_instr;
}
/*music.c*/
/* some monsters are immune */
