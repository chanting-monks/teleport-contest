import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	mkmaze.c	$NHDT-Date: 1745114235 2025/04/19 17:57:15 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.179 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Pasi Kallinen, 2018. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { alloc, free, memcpy } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { pline } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, atoi, strcat, strchr, strcmp, strcpy, strncmp, strrchr } from '../c2js-runtime/string.js';
import { lift_covet_and_placebc, unplacebc_and_covet_placebc } from './ball.js';
import { isok } from './cmd.js';
import { is_ice, is_pool } from './dbridge.js';
import { newsym } from './display.js';
import { christen_monst, christen_orc, new_oname, rndorcname } from './do_name.js';
import { migrate_to_level } from './dog.js';
import { In_hell, In_mines, In_quest, Invocation_lev, Is_branchlev, Is_special, depth, dunlev, dunlevs_in_dungeon, find_level, get_level, ledger_no, on_level, u_on_newpos } from './dungeon.js';
import { dist2, distmin, upstart } from './hacklib.js';
import { stackobj } from './invent.js';
import { makemon, set_malign } from './makemon.js';
import { count_level_features, mkstairs, mktrap, occupied, place_branch } from './mklev.js';
import { add_to_minv, dealloc_obj, mk_tt_object, mkcorpstat, mkgold, mkobj, mkobj_at, mksobj, mksobj_at, mksobj_migr_to_species, obj_ice_effects, place_object, remove_object, rndmonnum, set_corpsenm, weight } from './mkobj.js';
import { somex, somey } from './mkroom.js';
import { dmonsfree, elemental_clog, m_into_limbo, mnearto, mnexto } from './mon.js';
import { poly_when_stoned } from './mondata.js';
import { AIR, BLCORNER, BOULDER, BRCORNER, CLOUD, CONS_HERO, CONS_MON, CONS_OBJ, CONS_TRAP, CORPSE, CORR, CROSSWALL, C_RATION, DBWALL, DEAF, DOOR, EGG, FOOD_CLASS, FOUNTAIN, GAUNTLETS_OF_DEXTERITY, GEM_CLASS, GLYPH_ALTAR_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GOLD_PIECE, HWALL, ICE, IRONBARS, K_RATION, LADDER, LAVAPOOL, LAVAWALL, LEATHER_GLOVES, LEMBAS_WAFER, LONG_SWORD, LR_BRANCH, LR_DOWNSTAIR, LR_DOWNTELE, LR_PORTAL, LR_TELE, LR_UPSTAIR, LR_UPTELE, MAGIC_PORTAL, MAX_GLYPH, MAX_TYPE, MELT_ICE_AWAY, PM_CLERIC, PM_MINOTAUR, PM_ORC, PM_ORC_CAPTAIN, PM_ORC_SHAMAN, POOL, RANDOM_CLASS, RING_CLASS, ROCK, ROOM, SDOOR, SILVER_SABER, SINK, SKELETON_KEY, SLIME_MOLD, STAIRS, STATUE, STONE, STRANGE_OBJECT, SWIMMING, S_air, S_altar, S_arrow_trap, S_cloud, S_digbeam, S_goodpos, S_grave, S_ndoor, S_stone, S_trwall, S_vwall, S_water, TALLOW_CANDLE, TDWALL, TIN, TLCORNER, TLWALL, TRAPNUM, TRCORNER, TRIPE_RATION, TRWALL, TUWALL, VIBRATING_SQUARE, VWALL, WATER, WAX_CANDLE, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned } from './nh-constants.js';
import { shiny_obj } from './objnam.js';
import { fruitadd } from './options.js';
import { Norep } from './pline.js';
import { create_gas_cloud } from './region.js';
import { rn2, rnd } from './rnd.js';
import { sfi_bubble, sfi_int, sfo_bubble, sfo_int } from './sfbase.js';
import { load_special } from './sp_lev.js';
import { stairway_find_dir } from './stairs.js';
import { Strlen_ } from './strutil.js';
import { goodpos, rloc } from './teleport.js';
import { spot_stop_timers } from './timeout.js';
import { deltrap, maketrap, t_at } from './trap.js';
import { block_point, recalc_block_point, unblock_point, vision_recalc } from './vision.js';
import { remove_worm } from './worm.js';

/* adjust a coordinate one step in the specified direction */
/* used to determine if wall spines can join this location */
export function iswall(x, y) {
    let type = 0;
    if (!isok(x, y)) {
        return 0;
    }
    type = game.level.locations[x][y].typ;
    return (((type) && (type) <= DBWALL) || ((type) == DOOR) || type == LAVAWALL || type == WATER || type == SDOOR || type == IRONBARS);
}
/* used to determine if wall spines can join this location */
export function iswall_or_stone(x, y) {
    if (!isok(x, y)) {
        return 1;
    }
    return (game.level.locations[x][y].typ == STONE || iswall(x, y));
}
/* return TRUE if out of bounds, wall or rock */
export function is_solid(x, y) {
    return (!isok(x, y) || ((game.level.locations[x][y].typ) <= DBWALL));
}
/* set map terrain type, handling lava lit, ice melt timers, etc */
export function set_levltyp(x, y, newtyp) {
    if (isok(x, y) && newtyp >= STONE && newtyp < MAX_TYPE) {
        let oldtyp = game.level.locations[x][y].typ;
        if (oldtyp == SDOOR && newtyp == AIR) {
            game.level.locations[x][y].candig = 1;
            /* hack for secret doors in garden theme rooms */
            /* levl[][].typ stays SDOOR rather than change to AIR */
            /* level.flags.nfountains,nsinks */
            return (1);
        }
        if ((game.iflags.debug_overwrite_stairs || !((oldtyp) == LADDER || (oldtyp) == STAIRS))) {
            /* typ==ICE || (typ==DRAWBRIDGE_UP && drawbridgemask==DB_ICE) */
            let was_ice = is_ice(x, y);
            game.level.locations[x][y].typ = newtyp;
            /* TODO?
             *  if oldtyp used flags or horizontal differently from
             *  the way newtyp will use them, clear them.
             */
            /* [what about IS_LAVA(oldtyp)=>.lit = 0?] */
            if (((newtyp) == LAVAPOOL || (newtyp) == LAVAWALL)) {
                game.level.locations[x][y].lit = 1;
            }
            if (was_ice && newtyp != ICE) {
                /* frozen corpses resume rotting, no more ice to melt away */
                obj_ice_effects(x, y, (1));
                spot_stop_timers(x, y, MELT_ICE_AWAY);
            }
            if ((((oldtyp) == FOUNTAIN) != ((newtyp) == FOUNTAIN)) || (((oldtyp) == SINK) != ((newtyp) == SINK))) {
                count_level_features();
            }
            return (1);
        }
    }
    return (0);
}
/* set map terrain type and light state */
export function set_levltyp_lit(x, y, typ, lit) {
    let ret = set_levltyp(x, y, typ);
    if (ret && isok(x, y)) {
        if (lit != -2) {
            if (((typ) == LAVAPOOL || (typ) == LAVAWALL)) {
                lit = 1;
            } else if (lit == -1) {
                lit = rn2(2);
            }
            game.level.locations[x][y].lit = lit;
        }
    }
    return ret;
}
/*
 * Return 1 (not TRUE - we're doing bit vectors here) if we want to extend
 * a wall spine in the (dx,dy) direction.  Return 0 otherwise.
 *
 * To extend a wall spine in that direction, first there must be a wall there.
 * Then, extend a spine unless the current position is surrounded by walls
 * in the direction given by (dx,dy).  E.g. if 'x' is our location, 'W'
 * a wall, '.' a room, 'a' anything (we don't care), and our direction is
 * (0,1) - South or down - then:
 *
 *              a a a
 *              W x W           This would not extend a spine from x down
 *              W W W           (a corridor of walls is formed).
 *
 *              a a a
 *              W x W           This would extend a spine from x down.
 *              . W W
 */
export function extend_spine(locale, wall_there, dx, dy) {
    let spine = 0;
    let nx = 0;
    let ny = 0;
    nx = 1 + dx;
    ny = 1 + dy;
    if (wall_there) {
        if (dx) {
            if (locale[1][0] && locale[1][2] && locale[nx][0] && locale[nx][2]) {
                spine = 0;
            } else {
                spine = 1;
            }
        } else {
            if (locale[0][1] && locale[2][1] && locale[0][ny] && locale[2][ny]) {
                spine = 0;
            } else {
                spine = 1;
            }
        }
    } else {
        spine = 0;
    }
    return spine;
}
/* Remove walls totally surrounded by stone */
export function wall_cleanup(x1, y1, x2, y2) {
    let type = 0;
    let x = 0;
    let y = 0;
    let lev = null;
    /* sanity check on incoming variables */
    /*
     * Value 0 represents a free-standing wall.  It could be anything,
     * so even though this table says VWALL, we actually leave whatever
     * typ was there alone.
     */
    if (x1 < 0 || x2 >= 80 || x1 > x2 || y1 < 0 || y2 >= 21 || y1 > y2) {
        panic("wall_cleanup: bad bounds (%d,%d) to (%d,%d)", x1, y1, x2, y2);
    }
    for (x = x1; x <= x2; x++) {
        for (y = y1; y <= y2; y++) {
            /* change walls surrounded by rock to rock. */
            if (((x) >= (game.bughack.inarea.x1) && (x) <= (game.bughack.inarea.x2) && (y) >= (game.bughack.inarea.y1) && (y) <= (game.bughack.inarea.y2))) {
                continue;
            }
            /* set the correct wall type. */
            lev = game.level.locations[x][y];
            type = lev.typ;
            if (((type) && (type) <= DBWALL) && type != DBWALL) {
                if (is_solid(x - 1, y - 1) && is_solid(x - 1, y) && is_solid(x - 1, y + 1) && is_solid(x, y - 1) && is_solid(x, y + 1) && is_solid(x + 1, y - 1) && is_solid(x + 1, y) && is_solid(x + 1, y + 1)) {
                    lev.typ = STONE;
                }
            }
        }
    }
}
/* Correct wall types so they extend and connect to each other */
let __fix_wall_spines_spine_array = [VWALL, HWALL, HWALL, HWALL, VWALL, TRCORNER, TLCORNER, TDWALL, VWALL, BRCORNER, BLCORNER, TUWALL, VWALL, TLWALL, TRWALL, CROSSWALL];
export function fix_wall_spines(x1, y1, x2, y2) {
    let type = 0;
    let x = 0;
    let y = 0;
    let lev = null;
    let loc_f = null;
    let bits = 0;
    /* rock or wall status surrounding positions */
    let locale = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    if (x1 < 0 || x2 >= 80 || x1 > x2 || y1 < 0 || y2 >= 21 || y1 > y2) {
        panic("wall_extends: bad bounds (%d,%d) to (%d,%d)", x1, y1, x2, y2);
    }
    for (x = x1; x <= x2; x++) {
        for (y = y1; y <= y2; y++) {
            lev = game.level.locations[x][y];
            type = lev.typ;
            if (!(((type) && (type) <= DBWALL) && type != DBWALL)) {
                continue;
            }
            /* set the locations TRUE if rock or wall or out of bounds */
            loc_f = ((x) >= (game.bughack.inarea.x1) && (x) <= (game.bughack.inarea.x2) && (y) >= (game.bughack.inarea.y1) && (y) <= (game.bughack.inarea.y2)) ? iswall : iswall_or_stone;
            locale[0][0] = (loc_f)(x - 1, y - 1);
            locale[1][0] = (loc_f)(x, y - 1);
            locale[2][0] = (loc_f)(x + 1, y - 1);
            locale[0][1] = (loc_f)(x - 1, y);
            locale[2][1] = (loc_f)(x + 1, y);
            locale[0][2] = (loc_f)(x - 1, y + 1);
            locale[1][2] = (loc_f)(x, y + 1);
            locale[2][2] = (loc_f)(x + 1, y + 1);
            /* determine if wall should extend to each direction NSEW */
            bits = (extend_spine(locale, iswall(x, y - 1), 0, -1) << 3) | (extend_spine(locale, iswall(x, y + 1), 0, 1) << 2) | (extend_spine(locale, iswall(x + 1, y), 1, 0) << 1) | extend_spine(locale, iswall(x - 1, y), -1, 0);
            /* don't change typ if wall is free-standing */
            if (bits) {
                lev.typ = __fix_wall_spines_spine_array[bits];
            }
        }
    }
}
export function wallification(x1, y1, x2, y2) {
    wall_cleanup(x1, y1, x2, y2);
    fix_wall_spines(x1, y1, x2, y2);
}
export function okay(x, y, dir) {
    do {
        switch (dir) {
            case 0:
                --(y);
                /* place_lregion gets called from goto_level() */
                break;
            case 1:
                (x)++;
                break;
            case 2:
                (y)++;
                break;
            case 3:
                --(x);
                break;
            default:
                panic("mz_move: bad direction %d", dir);
        }
    } while (0);
    do {
        switch (dir) {
            case 0:
                --(y);
                break;
            case 1:
                (x)++;
                break;
            case 2:
                (y)++;
                break;
            case 3:
                --(x);
                break;
            default:
                panic("mz_move: bad direction %d", dir);
        }
    } while (0);
    if (x < 3 || y < 3 || x > game.x_maze_max || y > game.y_maze_max || game.level.locations[x][y].typ != STONE) {
        return (0);
    }
    return (1);
}
/* find random starting point for maze generation */
export function maze0xy(cc) {
    cc.x = 3 + 2 * rn2((game.x_maze_max >> 1) - 1);
    cc.y = 3 + 2 * rn2((game.y_maze_max >> 1) - 1);
    return;
}
export function is_exclusion_zone(type, x, y) {
    let ez = game.exclusion_zones;
    while (ez) {
        if (((type == LR_DOWNTELE && (ez.zonetype == LR_DOWNTELE || ez.zonetype == LR_TELE)) || (type == LR_UPTELE && (ez.zonetype == LR_UPTELE || ez.zonetype == LR_TELE)) || type == ez.zonetype) && ((x) >= (ez.lx) && (x) <= (ez.hx) && (y) >= (ez.ly) && (y) <= (ez.hy))) {
            return (1);
        }
        ez = ez.next;
    }
    return (0);
}
/*
 * Bad if:
 *      pos is occupied OR
 *      pos is inside restricted region (nlx,nly,nhx,nhy) OR
 *      NOT (pos is corridor and a maze level OR pos is a room OR pos is air)
 */
export function bad_location(x, y, nlx, nly, nhx, nhy) {
    return (occupied(x, y) || ((x) >= (nlx) && (x) <= (nhx) && (y) >= (nly) && (y) <= (nhy)) || !((game.level.locations[x][y].typ == CORR && game.level.flags.is_maze_lev) || game.level.locations[x][y].typ == ROOM || game.level.locations[x][y].typ == AIR));
}
/* pick a location in area (lx, ly, hx, hy) but not in (nlx, nly, nhx, nhy)
   and place something (based on rtype) in that region */
export function place_lregion(lx, ly, hx, hy, nlx, nly, nhx, nhy, rtype, lev) {
    let trycnt = 0;
    let oneshot = 0;
    let x = 0;
    let y = 0;
    if (!lx) {
        if (rtype == LR_BRANCH && game.nroom) {
            /*
         * if there are rooms and this a branch, let place_branch choose
         * the branch location (to avoid putting branches in corridors).
         */
            /* place branch stair or portal */
            place_branch(Is_branchlev(game.u.uz), 0, 0);
            /* no mazification right now */
            return;
        }
        lx = 1;
        hx = 80 - 1;
        /* 3.6.0 and earlier erroneously had 1 here */
        ly = 0;
        hy = 21 - 1;
    }
    /* clamp the area to the map */
    if (lx < 1) {
        lx = 1;
    }
    if (hx > 80 - 1) {
        hx = 80 - 1;
    }
    if (ly < 0) {
        ly = 0;
    }
    if (hy > 21 - 1) {
        hy = 21 - 1;
    }
    /* first a probabilistic approach */
    oneshot = (lx == hx && ly == hy);
    for (trycnt = 0; trycnt < 200; trycnt++) {
        x = (rn2((hx - lx) + 1) + (lx));
        y = (rn2((hy - ly) + 1) + (ly));
        if (put_lregion_here(x, y, nlx, nly, nhx, nhy, rtype, oneshot, lev)) {
            return;
        }
    }
    /* then a deterministic one */
    for (x = lx; x <= hx; x++) {
        for (y = ly; y <= hy; y++) {
            if (put_lregion_here(x, y, nlx, nly, nhx, nhy, rtype, (1), lev)) {
                return;
            }
        }
    }
    impossible("Couldn't place lregion type %d!", rtype);
}
export function put_lregion_here(x, y, nlx, nly, nhx, nhy, rtype, oneshot, lev) {
    let mtmp = null;
    if (bad_location(x, y, nlx, nly, nhx, nhy) || is_exclusion_zone(rtype, x, y)) {
        if (!oneshot) {
            return (0);
        } else {
            /* Must make do with the only location possible;
               avoid failure due to a misplaced trap.
               It might still fail if there's a dungeon feature here. */
            let t = t_at(x, y);
            if (t && !((t.ttyp) == MAGIC_PORTAL || (t.ttyp) == VIBRATING_SQUARE)) {
                if (((mtmp = (game.level.monsters[x][y])) != null) && mtmp.mtrapped) {
                    mtmp.mtrapped = 0;
                }
                deltrap(t);
            }
            if (bad_location(x, y, nlx, nly, nhx, nhy) || is_exclusion_zone(rtype, x, y)) {
                return (0);
            }
        }
    }
    switch (rtype) {
        case LR_TELE:
        case LR_UPTELE:
        case LR_DOWNTELE:
            /* something at temporary pool... */
            if ((mtmp = (game.level.monsters[x][y])) != null) {
                if (oneshot) {
                    /* "something" means the player in this case */
                    /* move the monster if no choice, or just try again */
                    if (!rloc(mtmp, 4)) {
                        m_into_limbo(mtmp);
                    }
                } else {
                    return (0);
                }
            }
            u_on_newpos(x, y);
            break;
        case LR_PORTAL:
            mkportal(x, y, lev.dnum, lev.dlevel);
            break;
        case LR_DOWNSTAIR:
        case LR_UPSTAIR:
            mkstairs(x, y, rtype, null, (0));
            break;
        case LR_BRANCH:
            place_branch(Is_branchlev(game.u.uz), x, y);
            break;
    }
    return (1);
}
/* fix up Baalzebub's lair, which depicts a level-sized beetle;
   its legs are walls within solid rock--regular wallification
   classifies them as superfluous and gets rid of them */
export function baalz_fixup() {
    let mtmp = null;
    let x = 0;
    let y = 0;
    let lastx = 0;
    let lasty = 0;
    /*
     * baalz level's nondiggable region surrounds the "insect" and rooms.
     * The outermost perimeter of that region is subject to wall cleanup
     * (hence 'x + 1' and 'y + 1' for starting don't-clean column and row,
     * 'lastx - 1' and 'lasty - 1' for ending don't-clean column and row)
     * and the interior is protected against that (in wall_cleanup()).
     *
     * Assumes level.flags.corrmaze is True, otherwise the bug legs will
     * have already been "cleaned" away by general wallification.
     */
    /* find low and high x for to-be-wallified portion of level */
    y = Math.trunc(21 / 2);
    for (lastx = x = 0; x < 80; ++x) {
        if ((game.level.locations[x][y].flags & 8) != 0) {
            if (!lastx) {
                game.bughack.inarea.x1 = x + 1;
            }
            lastx = x;
        }
    }
    game.bughack.inarea.x2 = ((lastx > game.bughack.inarea.x1) ? lastx : x) - 1;
    /* find low and high y for to-be-wallified portion of level */
    x = game.bughack.inarea.x1;
    for (lasty = y = 0; y < 21; ++y) {
        if ((game.level.locations[x][y].flags & 8) != 0) {
            if (!lasty) {
                game.bughack.inarea.y1 = y + 1;
            }
            lasty = y;
        }
    }
    game.bughack.inarea.y2 = ((lasty > game.bughack.inarea.y1) ? lasty : y) - 1;
    for (x = game.bughack.inarea.x1; x <= game.bughack.inarea.x2; ++x) {
        for (y = game.bughack.inarea.y1; y <= game.bughack.inarea.y2; ++y) {
            if (game.level.locations[x][y].typ == POOL) {
                game.level.locations[x][y].typ = HWALL;
                if (game.bughack.delarea.x1 == 80) {
                    game.bughack.delarea.x1 = x , game.bughack.delarea.y1 = y;
                /* two pools mark where special post-wallify fix-ups are needed */
                } else {
                    game.bughack.delarea.x2 = x , game.bughack.delarea.y2 = y;
                }
            } else if (game.level.locations[x][y].typ == IRONBARS) {
                if (isok(x - 1, y) && (game.level.locations[x - 1][y].flags & 8) != 0) {
                    game.level.locations[x - 1][y].flags &= ~8;
                    /* novelty effect; allowing digging in front of 'eyes' */
                    if (isok(x - 2, y)) {
                        game.level.locations[x - 2][y].flags &= ~8;
                    }
                } else if (isok(x + 1, y) && (game.level.locations[x + 1][y].flags & 8) != 0) {
                    game.level.locations[x + 1][y].flags &= ~8;
                    if (isok(x + 2, y)) {
                        game.level.locations[x + 2][y].flags &= ~8;
                    }
                }
            }
        }
    }
    wallification(((game.bughack.inarea.x1 - 2) > (1) ? (game.bughack.inarea.x1 - 2) : (1)), ((game.bughack.inarea.y1 - 2) > (0) ? (game.bughack.inarea.y1 - 2) : (0)), ((game.bughack.inarea.x2 + 2) < (80 - 1) ? (game.bughack.inarea.x2 + 2) : (80 - 1)), ((game.bughack.inarea.y2 + 2) < (21 - 1) ? (game.bughack.inarea.y2 + 2) : (21 - 1)));
    /* bughack hack for rear-most legs on baalz level; first joint on
       both top and bottom gets a bogus extra connection to room area,
       producing unwanted rectangles; change back to separated legs */
    x = game.bughack.delarea.x1 , y = game.bughack.delarea.y1;
    if (isok(x, y) && (game.level.locations[x][y].typ == TLWALL || game.level.locations[x][y].typ == TRWALL) && isok(x, y + 1) && game.level.locations[x][y + 1].typ == TUWALL) {
        game.level.locations[x][y].typ = (game.level.locations[x][y].typ == TLWALL) ? BRCORNER : BLCORNER;
        game.level.locations[x][y + 1].typ = HWALL;
        if ((mtmp = (game.level.monsters[x][y])) != null) {
            rloc(mtmp, 1 | 4);
        }
    }
    x = game.bughack.delarea.x2 , y = game.bughack.delarea.y2;
    if (isok(x, y) && (game.level.locations[x][y].typ == TLWALL || game.level.locations[x][y].typ == TRWALL) && isok(x, y - 1) && game.level.locations[x][y - 1].typ == TDWALL) {
        game.level.locations[x][y].typ = (game.level.locations[x][y].typ == TLWALL) ? TRCORNER : TLCORNER;
        game.level.locations[x][y - 1].typ = HWALL;
        if ((mtmp = (game.level.monsters[x][y])) != null) {
            rloc(mtmp, 1 | 4);
        }
    }
    /* reset bughack region; set low end to <COLNO,ROWNO> so that
       within_bounded_region() in fix_wall_spines() will fail
       most quickly--on its first test--when loading other levels */
    game.bughack.inarea.x1 = game.bughack.delarea.x1 = 80;
    game.bughack.inarea.y1 = game.bughack.delarea.y1 = 21;
    game.bughack.inarea.x2 = game.bughack.delarea.x2 = 0;
    game.bughack.inarea.y2 = game.bughack.delarea.y2 = 0;
}
/* this is special stuff that the level compiler cannot (yet) handle */
export function fixup_special() {
    let r = game.lregions;
    let sp = null;
    let lev = { dnum: 0, dlevel: 0 };
    let x = 0;
    let y = 0;
    let croom = null;
    let added_branch = (0);
    if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
        game.level.flags.hero_memory = 0;
        /* water level is an odd beast - it has to be set up
           before calling place_lregions etc. */
        setup_waterlevel();
    }
    for (x = 0; x < game.num_lregions; x++ , r++) {
        switch (r.rtype) {
            case LR_BRANCH:
                added_branch = (1);
                /* TODO Phase 5+: goto place_it (label not in scope of break) */
            case LR_PORTAL:
                if (__nh_char_at0(r.rname.str) >= 48 && __nh_char_at0(r.rname.str) <= 57) {
                    Object.assign(lev, game.u.uz);
                    lev.dlevel = atoi(r.rname.str);
                } else {
                    sp = find_level(r.rname.str);
                    Object.assign(lev, sp.dlevel);
                }
                ;
            case LR_UPSTAIR:
            case LR_DOWNSTAIR:
                // TODO LabelStmt place_it not at compound-stmt level
                break;
            case LR_TELE:
            case LR_UPTELE:
            case LR_DOWNTELE:
                if (r.rtype == LR_TELE || r.rtype == LR_UPTELE) {
                    /* save the region outlines for goto_level() */
                    game.updest.lx = r.inarea.x1;
                    game.updest.ly = r.inarea.y1;
                    game.updest.hx = r.inarea.x2;
                    game.updest.hy = r.inarea.y2;
                    game.updest.nlx = r.delarea.x1;
                    game.updest.nly = r.delarea.y1;
                    game.updest.nhx = r.delarea.x2;
                    game.updest.nhy = r.delarea.y2;
                }
                if (r.rtype == LR_TELE || r.rtype == LR_DOWNTELE) {
                    game.dndest.lx = r.inarea.x1;
                    game.dndest.ly = r.inarea.y1;
                    game.dndest.hx = r.inarea.x2;
                    game.dndest.hy = r.inarea.y2;
                    game.dndest.nlx = r.delarea.x1;
                    game.dndest.nly = r.delarea.y1;
                    game.dndest.nhx = r.delarea.x2;
                    game.dndest.nhy = r.delarea.y2;
                }
                break;
        }
        if (r.rname.str) {
            free(r.rname.str) , r.rname.str = null;
        }
    }
    if (!added_branch && Is_branchlev(game.u.uz)) {
        /* place dungeon branch if not placed above */
        place_lregion(0, 0, 0, 0, 0, 0, 0, 0, LR_BRANCH, null);
    }
    if ((((((game.dungeon_topology.d_medusa_level)).dlevel || ((game.dungeon_topology.d_medusa_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_medusa_level))))) {
        /* Still need to add some stuff to level file */
        let otmp = null;
        let tryct = 0;
        /* the first room defined on the medusa level */
        croom = game.rooms[0];
        for (tryct = rnd(4); tryct; tryct--) {
            x = somex(croom);
            y = somey(croom);
            if (goodpos(x, y, null, 0)) {
                let tryct2 = 0;
                otmp = mk_tt_object(STATUE, x, y);
                while (++tryct2 < 100 && otmp && (poly_when_stoned(game.mons[otmp.corpsenm]) || (((game.mons[otmp.corpsenm]).mresists & (128)) != 0))) {
                    /* set_corpsenm() handles weight too */
                    set_corpsenm(otmp, rndmonnum());
                }
            }
        }
        if (rn2(2)) {
            otmp = mk_tt_object(STATUE, somex(croom), somey(croom));
        /* Medusa statues don't contain books */
        } else {
            otmp = mkcorpstat(STATUE, null, null, somex(croom), somey(croom), 0);
        }
        if (otmp) {
            tryct = 0;
            while (++tryct < 100 && ((((game.mons[otmp.corpsenm]).mresists & (128)) != 0) || poly_when_stoned(game.mons[otmp.corpsenm]))) {
                set_corpsenm(otmp, rndmonnum());
            }
        }
    } else if ((game.urole.mnum == (PM_CLERIC)) && In_quest(game.u.uz)) {
        /* less chance for undead corpses (lured from lower morgues) */
        game.level.flags.graveyard = 1;
    } else if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
        game.level.flags.graveyard = 1;
    } else if (on_level(game.u.uz, (game.dungeon_topology.d_baalzebub_level))) {
        /* custom wallify the "beetle" potion of the level */
        baalz_fixup();
    } else if (game.u.uz.dnum == (game.dungeon_topology.d_mines_dnum) && game.ransacked) {
        stolen_booty();
    }
    if ((sp = Is_special(game.u.uz)) != null && sp.flags.town) {
        game.level.flags.has_town = 1;
    }
    if (game.lregions) {
        free(game.lregions) , game.lregions = null;
    }
    game.num_lregions = 0;
}
export function check_ransacked(s) {
    /* this kludge only works as long as orctown is minetn-1 */
    game.ransacked = (game.u.uz.dnum == (game.dungeon_topology.d_mines_dnum) && !strcmp(s, "minetn-1"));
}
const orcfruit = ["paddle cactus", "dwarven root"];
export function migrate_orc(mtmp, mflags) {
    let nlev = 0;
    let max_depth = 0;
    let cur_depth = 0;
    let dest = { dnum: 0, dlevel: 0 };
    cur_depth = depth(game.u.uz);
    max_depth = dunlevs_in_dungeon(game.u.uz) + (game.dungeons[game.u.uz.dnum].depth_start - 1);
    if (mflags == 1) {
        /* Note that the orc leader will take possession of any
         * remaining stuff not already delivered to other
         * orcs between here and the bottom of the mines.
         */
        nlev = max_depth;
        /* once in a blue moon, he won't be at the very bottom */
        if (!rn2(40)) {
            nlev--;
        }
        mtmp.migflags |= 8192;
    } else {
        nlev = rn2((max_depth - cur_depth) + 1) + cur_depth;
        if (nlev == cur_depth) {
            nlev++;
        }
        if (nlev > max_depth) {
            nlev = max_depth;
        }
        mtmp.migflags = (mtmp.migflags & ~8192);
    }
    get_level(dest, nlev);
    migrate_to_level(mtmp, ledger_no(dest), 0, null);
}
export function shiny_orc_stuff(mtmp) {
    let gemprob = 0;
    let goldprob = 0;
    let otyp = 0;
    let otmp = null;
    let is_captain = (mtmp.data == game.mons[PM_ORC_CAPTAIN]);
    goldprob = is_captain ? 600 : 300;
    gemprob = Math.trunc(goldprob / 4);
    if (rn2(1000) < goldprob) {
        if ((otmp = mksobj(GOLD_PIECE, (1), (0))) != null) {
            otmp.quan = 1 + rnd(goldprob);
            otmp.owt = weight(otmp);
            add_to_minv(mtmp, otmp);
        }
    }
    if (rn2(1000) < gemprob) {
        if ((otmp = mkobj(GEM_CLASS, (0))) != null) {
            if (otmp.otyp == ROCK) {
                dealloc_obj(otmp);
            } else {
                add_to_minv(mtmp, otmp);
            }
        }
    }
    if (is_captain || !rn2(8)) {
        otyp = shiny_obj(RING_CLASS);
        if (otyp != STRANGE_OBJECT && (otmp = mksobj(otyp, (1), (0))) != null) {
            add_to_minv(mtmp, otmp);
        }
    }
}
export function migr_booty_item(otyp, gang) {
    let otmp = null;
    otmp = mksobj_migr_to_species(otyp, 128, (1), (0));
    if (otmp && gang) {
        /* removes old name if present */
        new_oname(otmp, Strlen_(gang, "migr_booty_item", 786) + 1);
        (otmp).oextra.oname = strcpy(((otmp).oextra.oname), gang);
        if (game.objects[otyp].oc_class == FOOD_CLASS) {
            if (otyp == SLIME_MOLD) {
                otmp.spe = fruitadd(orcfruit[rn2((Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */)))], null);
            }
            otmp.quan += rn2(3);
            otmp.owt = weight(otmp);
        }
    }
}
export function stolen_booty() {
    let gang = null;
    let gang_name = '';
    let mtmp = null;
    let cnt = 0;
    let i = 0;
    let otyp = 0;
    /*
     * --------------------------------------------------------
     * Mythos:
     *
     *      A tragic accident has occurred in Frontier Town...
     *      It has been overrun by orcs.
     *
     *      The booty that the orcs took from the town is now
     *      in the possession of the orcs that did this and
     *      have long since fled the level.
     * --------------------------------------------------------
     */
    gang = rndorcname(gang_name);
    /* create the stuff that the gang took */
    cnt = rnd(4);
    for (i = 0; i < cnt; ++i) {
        migr_booty_item(rn2(4) ? TALLOW_CANDLE : WAX_CANDLE, gang);
    }
    cnt = rnd(3);
    for (i = 0; i < cnt; ++i) {
        migr_booty_item(SKELETON_KEY, gang);
    }
    otyp = (rn2((GAUNTLETS_OF_DEXTERITY - LEATHER_GLOVES) + 1) + (LEATHER_GLOVES));
    migr_booty_item(otyp, gang);
    cnt = rnd(10);
    for (i = 0; i < cnt; ++i) {
        /* Food items - but no lembas! (or some other weird things) */
        otyp = (rn2(TIN - TRIPE_RATION + 1) + (TRIPE_RATION));
        if (otyp != LEMBAS_WAFER && (game.objects[otyp].oc_prob != 0 || otyp == C_RATION || otyp == K_RATION) && otyp != CORPSE && otyp != EGG && otyp != TIN) {
            migr_booty_item(otyp, gang);
        }
    }
    migr_booty_item(rn2(2) ? LONG_SWORD : SILVER_SABER, gang);
    /* create the leader of the orc gang */
    mtmp = makemon(game.mons[PM_ORC_CAPTAIN], 0, 0, 64);
    if (mtmp) {
        /* exclude meat <anything>, globs of <anything>, kelp
               which all have random generation probability of 0
               (K-/C-rations do too, but we want to include those) */
        /* exclude food items which utilize obj->corpsenm because
               that field is going to be overloaded for delivery purposes */
        mtmp = christen_monst(mtmp, upstart(gang));
        mtmp.mpeaceful = 0;
        set_malign(mtmp);
        shiny_orc_stuff(mtmp);
        migrate_orc(mtmp, 1);
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        /* Make most of the orcs on the level be part of the invading gang */
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if ((((mtmp.data).mflags2 & 128) != 0) && !((mtmp).mextra && ((mtmp).mextra.mgivenname)) && rn2(10)) {
            /*
             * We'll consider the orc captain from the level
             * description to be the captain of a rival orc horde
             * who is there to see what has transpired, and to
             * contemplate future action.
             *
             * Don't christen the orc captain as a subordinate
             * member of the main orc horde.
             */
            if (mtmp.data != game.mons[PM_ORC_CAPTAIN]) {
                mtmp = christen_orc(mtmp, upstart(gang), "");
            }
        }
    }
    /* Lastly, ensure there's several more orcs from the gang along the way.
     * The mechanics are such that they aren't actually identified as
     * members of the invading gang until they get their spoils assigned
     * to the inventory; handled during that assignment.
     */
    cnt = rn2(10) + 5;
    for (i = 0; i < cnt; ++i) {
        let mtyp = 0;
        mtyp = rn2((PM_ORC_SHAMAN - PM_ORC) + 1) + PM_ORC;
        mtmp = makemon(game.mons[mtyp], 0, 0, 64);
        if (mtmp) {
            shiny_orc_stuff(mtmp);
            migrate_orc(mtmp, 0);
        }
    }
    game.ransacked = 0;
}
export function maze_inbounds(x, y) {
    return (x >= 2 && y >= 2 && x < game.x_maze_max && y < game.y_maze_max && isok(x, y));
}
export function maze_remove_deadends(typ) {
    let dirok = '';
    let x = 0;
    let y = 0;
    let dir = 0;
    let idx = 0;
    let idx2 = 0;
    let dx = 0;
    let dy = 0;
    let dx2 = 0;
    let dy2 = 0;
    dirok = '';
    for (x = 2; x < game.x_maze_max; x++) {
        for (y = 2; y < game.y_maze_max; y++) {
            if (((game.level.locations[x][y].typ) >= DOOR) && (x % 2) && (y % 2)) {
                idx = idx2 = 0;
                for (dir = 0; dir < 4; dir++) {
                    /* note: mz_move() is a macro which modifies
                       one of its first two parameters */
                    dx = dx2 = x;
                    dy = dy2 = y;
                    do {
                        switch (dir) {
                            case 0:
                                --(dy);
                                break;
                            case 1:
                                (dx)++;
                                break;
                            case 2:
                                (dy)++;
                                break;
                            case 3:
                                --(dx);
                                break;
                            default:
                                panic("mz_move: bad direction %d", dir);
                        }
                    } while (0);
                    if (!maze_inbounds(dx, dy)) {
                        idx2++;
                        continue;
                    }
                    do {
                        switch (dir) {
                            case 0:
                                --(dy2);
                                break;
                            case 1:
                                (dx2)++;
                                break;
                            case 2:
                                (dy2)++;
                                break;
                            case 3:
                                --(dx2);
                                break;
                            default:
                                panic("mz_move: bad direction %d", dir);
                        }
                    } while (0);
                    do {
                        switch (dir) {
                            case 0:
                                --(dy2);
                                break;
                            case 1:
                                (dx2)++;
                                break;
                            case 2:
                                (dy2)++;
                                break;
                            case 3:
                                --(dx2);
                                break;
                            default:
                                panic("mz_move: bad direction %d", dir);
                        }
                    } while (0);
                    if (!maze_inbounds(dx2, dy2)) {
                        idx2++;
                        continue;
                    }
                    if (!((game.level.locations[dx][dy].typ) >= DOOR) && ((game.level.locations[dx2][dy2].typ) >= DOOR)) {
                        dirok[idx++] = dir;
                        idx2++;
                    }
                }
                if (idx2 >= 3 && idx > 0) {
                    dx = x;
                    dy = y;
                    dir = dirok[rn2(idx)];
                    do {
                        switch (dir) {
                            case 0:
                                --(dy);
                                break;
                            case 1:
                                (dx)++;
                                break;
                            case 2:
                                (dy)++;
                                break;
                            case 3:
                                --(dx);
                                break;
                            default:
                                panic("mz_move: bad direction %d", dir);
                        }
                    } while (0);
                    game.level.locations[dx][dy].typ = typ;
                }
            }
        }
    }
}
/* Create a maze with specified corridor width and wall thickness
 * TODO: rewrite walkfrom so it works on temp space, not levl
 */
export function create_maze(corrwid, wallthick, rmdeadends) {
    let x = 0;
    let y = 0;
    let mm = { x: 0, y: 0 };
    let tmp_xmax = game.x_maze_max;
    let tmp_ymax = game.y_maze_max;
    let rdx = 0;
    let rdy = 0;
    let scale = 0;
    if (corrwid == -1) {
        corrwid = rnd(4);
    }
    if (wallthick == -1) {
        wallthick = rnd(4) - corrwid;
    }
    if (wallthick < 1) {
        wallthick = 1;
    } else if (wallthick > 5) {
        wallthick = 5;
    }
    if (corrwid < 1) {
        corrwid = 1;
    } else if (corrwid > 5) {
        corrwid = 5;
    }
    scale = corrwid + wallthick;
    rdx = (Math.trunc(game.x_maze_max / scale));
    rdy = (Math.trunc(game.y_maze_max / scale));
    if (game.level.flags.corrmaze) {
        for (x = 2; x < (rdx * 2); x++) {
            for (y = 2; y < (rdy * 2); y++) {
                game.level.locations[x][y].typ = STONE;
            }
        }
    } else {
        for (x = 2; x <= (rdx * 2); x++) {
            for (y = 2; y <= (rdy * 2); y++) {
                game.level.locations[x][y].typ = ((x % 2) && (y % 2)) ? STONE : HWALL;
            }
        }
    }
    /* set upper bounds for maze0xy and walkfrom */
    game.x_maze_max = (rdx * 2);
    game.y_maze_max = (rdy * 2);
    maze0xy(mm);
    walkfrom(mm.x, mm.y, 0);
    if (rmdeadends) {
        maze_remove_deadends((game.level.flags.corrmaze) ? CORR : ROOM);
    }
    game.x_maze_max = tmp_xmax;
    game.y_maze_max = tmp_ymax;
    if (scale > 2) {
        let tmpmap = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
        let mx = 0;
        let my = 0;
        let dx = 0;
        let dy = 0;
        let rx = 1;
        let ry = 1;
        for (x = 1; x < game.x_maze_max; x++) {
            for (y = 1; y < game.y_maze_max; y++) {
                /* back up the existing smaller maze */
                tmpmap[x][y] = game.level.locations[x][y].typ;
            }
        }
        rx = x = 2;
        while (rx < game.x_maze_max) {
            mx = (x % 2) ? corrwid : (x == 2 || x == rdx * 2) ? 1 : wallthick;
            ry = y = 2;
            while (ry < game.y_maze_max) {
                my = (y % 2) ? corrwid : (y == 2 || y == rdy * 2) ? 1 : wallthick;
                for (dx = 0; dx < mx; dx++) {
                    for (dy = 0; dy < my; dy++) {
                        if (rx + dx >= game.x_maze_max || ry + dy >= game.y_maze_max) {
                            break;
                        }
                        game.level.locations[rx + dx][ry + dy].typ = tmpmap[x][y];
                    }
                }
                ry += my;
                y++;
            }
            rx += mx;
            x++;
        }
    }
}
export function pick_vibrasquare_location() {
    let x = 0;
    let y = 0;
    let stway = null;
    let trycnt = 0;
    /* these are also defined in mklev.c and they may not be appropriate
       for mazes with corridors wider than 1 or for cavernous levels */
    /*
     * Pick a position where the stairs down to Moloch's Sanctum
     * level will ultimately be created.  At that time, an area
     * will be altered:  walls removed, moat and traps generated,
     * boulders destroyed.  The position picked here must ensure
     * that that invocation area won't extend off the map.
     *
     * We actually allow up to 2 squares around the usual edge of
     * the area to get truncated; see mkinvokearea(mklev.c).
     */
    let x_range = game.x_maze_max - 2 - 2 * (6 - 2) - 1;
    let y_range = game.y_maze_max - 2 - 2 * (5 - 2) - 1;
    if (x_range <= (6 - 2) || y_range <= (5 - 2) || (x_range * y_range) <= (11 * 11)) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkmaze.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("svi.inv_pos: maze is too small! (%d x %d)", game.x_maze_max, game.y_maze_max);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
    /*{occupied() => invocation_pos()}*/
    game.inv_pos.x = game.inv_pos.y = 0;
    do {
        x = (rn2(x_range) + (2 + (6 - 2) + 1));
        y = (rn2(y_range) + (2 + (5 - 2) + 1));
        /* we don't want it to be too near the stairs, nor
           to be on a spot that's already in use (wall|trap) */
        if (++trycnt > 1000) {
            break;
        }
    } while (((stway = stairway_find_dir((1))) != null) && (x == stway.sx || y == stway.sy || abs(x - stway.sx) == abs(y - stway.sy) || distmin(x, y, stway.sx, stway.sy) <= 11 || !((game.level.locations[x][y].typ) > DOOR) || occupied(x, y)));
    game.inv_pos.x = x;
    game.inv_pos.y = y;
}
/* add objects and monsters to random maze */
export function populate_maze() {
    let i = 0;
    let mm = { x: 0, y: 0 };
    for (i = (rn2(8) + (11)); i; i--) {
        mazexy(mm);
        mkobj_at(rn2(2) ? GEM_CLASS : RANDOM_CLASS, mm.x, mm.y, (1));
    }
    for (i = (rn2(10) + (2)); i; i--) {
        mazexy(mm);
        mksobj_at(BOULDER, mm.x, mm.y, (1), (0));
    }
    for (i = rn2(3); i; i--) {
        mazexy(mm);
        makemon(game.mons[PM_MINOTAUR], mm.x, mm.y, 0);
    }
    for (i = (rn2(5) + (7)); i; i--) {
        mazexy(mm);
        makemon(null, mm.x, mm.y, 0);
    }
    for (i = (rn2(6) + (7)); i; i--) {
        mazexy(mm);
        mkgold(0, mm.x, mm.y);
    }
    for (i = (rn2(6) + (7)); i; i--) {
        mktrap(0, 2, null, null);
    }
}
export function makemaz(s) {
    fnEnter("makemaz", "mkmaze.c", 0);
    let protofile = '';
    let sp = Is_special(game.u.uz);
    let mm = { x: 0, y: 0 };
    if (__nh_char_at0(s)) {
        if (sp && sp.rndlevs) {
            protofile = nh_snprintf("makemaz", 1136, protofile, 20 /* sizeof(char [20]) */, "%s-%d", s, rnd(sp.rndlevs));
        } else {
            protofile = strcpy(protofile, s);
        }
    } else if ((game.dungeons[game.u.uz.dnum].proto)) {
        if (dunlevs_in_dungeon(game.u.uz) > 1) {
            if (sp && sp.rndlevs) {
                protofile = nh_snprintf("makemaz", 1144, protofile, 20 /* sizeof(char [20]) */, "%s%d-%d", game.dungeons[game.u.uz.dnum].proto, dunlev(game.u.uz), rnd(sp.rndlevs));
            } else {
                protofile = nh_snprintf("makemaz", 1148, protofile, 20 /* sizeof(char [20]) */, "%s%d", game.dungeons[game.u.uz.dnum].proto, dunlev(game.u.uz));
            }
        } else if (sp && sp.rndlevs) {
            protofile = nh_snprintf("makemaz", 1152, protofile, 20 /* sizeof(char [20]) */, "%s-%d", game.dungeons[game.u.uz.dnum].proto, rnd(sp.rndlevs));
        } else {
            protofile = strcpy(protofile, game.dungeons[game.u.uz.dnum].proto);
        }
    } else {
        protofile = strcpy(protofile, "");
    }
    if (game.flags.debug && protofile && sp && sp.rndlevs) {
        /* SPLEVTYPE format is "level-choice,level-choice"... */
        let ep = getenv("SPLEVTYPE");
        if (ep) {
            /* strrchr always succeeds due to code in prior block */
            let len = ((strrchr(protofile, 45) - protofile) + 1);
            while (ep && __nh_char_at0(ep)) {
                if (!strncmp(ep, protofile, len)) {
                    let pick = atoi(__nh_advance_str(ep, len));
                    /* use choice only if valid */
                    if (pick > 0 && pick <= sp.rndlevs) {
                        sprintf(protofile + len, "%d", pick);
                    }
                    break;
                } else {
                    ep = strchr(ep, 44);
                    if (ep) {
                        (ep = __nh_advance_str(ep, 1));
                    }
                }
            }
        }
    }
    if (protofile) {
        check_ransacked(protofile);
        protofile = strcat(protofile, ".lua");
        game.in_mk_themerooms = (0);
        if (load_special(protofile)) {
            /* some levels can end up with monsters
               on dead mon list, including light source monsters */
            dmonsfree();
            return;
        }
        impossible("Couldn't load \"%s\" - making a maze.", protofile);
    }
    game.level.flags.is_maze_lev = 1;
    game.level.flags.corrmaze = !rn2(3);
    if (!Invocation_lev(game.u.uz) && rn2(2)) {
        create_maze(-1, -1, !rn2(5));
    } else {
        create_maze(1, 1, (0));
    }
    if (!game.level.flags.corrmaze) {
        wallification(2, 2, game.x_maze_max, game.y_maze_max);
    }
    mazexy(mm);
    mkstairs(mm.x, mm.y, 1, null, (0));
    if (!Invocation_lev(game.u.uz)) {
        mazexy(mm);
        mkstairs(mm.x, mm.y, 0, null, (0));
    } else {
        /* choose "vibrating square" location */
        pick_vibrasquare_location();
        maketrap(game.inv_pos.x, game.inv_pos.y, VIBRATING_SQUARE);
    }
    place_branch(Is_branchlev(game.u.uz), 0, 0);
    populate_maze();
}
/* Make the mazewalk iterative by faking a stack.  This is needed to
 * ensure the mazewalk is successful in the limited stack space of
 * the program.  This iterative version uses the minimum amount of stack
 * that is totally safe.
 */
/* a maze cell is 4 squares */
/* char's are OK */
/* might still be on edge of MAP, so don't overwrite */
/* !MICRO */
export function walkfrom(x, y, typ) {
    fnEnter("walkfrom", "mkmaze.c", 0);
    let q = 0;
    let a = 0;
    let dir = 0;
    let dirs = [0, 0, 0, 0];
    if (!typ) {
        if (game.level.flags.corrmaze) {
            typ = CORR;
        } else {
            typ = ROOM;
        }
    }
    if (!((game.level.locations[x][y].typ) == DOOR)) {
        game.level.locations[x][y].typ = typ;
        game.level.locations[x][y].flags = 0;
    }
    while (1) {
        q = 0;
        for (a = 0; a < 4; a++) {
            if (okay(x, y, a)) {
                dirs[q++] = a;
            }
        }
        if (!q) {
            return;
        }
        dir = dirs[rn2(q)];
        do {
            switch (dir) {
                case 0:
                    --(y);
                    break;
                case 1:
                    (x)++;
                    break;
                case 2:
                    (y)++;
                    break;
                case 3:
                    --(x);
                    break;
                default:
                    panic("mz_move: bad direction %d", dir);
            }
        } while (0);
        game.level.locations[x][y].typ = typ;
        do {
            switch (dir) {
                case 0:
                    --(y);
                    break;
                case 1:
                    (x)++;
                    break;
                case 2:
                    (y)++;
                    break;
                case 3:
                    --(x);
                    break;
                default:
                    panic("mz_move: bad direction %d", dir);
            }
        } while (0);
        walkfrom(x, y, typ);
    }
}
/* ?MICRO */
/* find random point in generated corridors,
   so we don't create items in moats, bunkers, or walls */
export function mazexy(cc) {
    let x = 0;
    let y = 0;
    let allowedtyp = (game.level.flags.corrmaze ? CORR : ROOM);
    let cpt = 0;
    do {
        /* once upon a time this only considered odd values greater than 2
           and less than N (for N=={x,y}_maze_max) because even values were
           where maze walls always got placed; when wider maze corridors
           were introduced it was changed to 1+rn2(N) which is just an
           obscure way to get rnd(N); probably ought to be using 2+rn2(N-1)
           to exclude the maze's outer boundary walls; trying and rejecting
           those walls will waste some of the 100 random attempts... */
        x = rnd(game.x_maze_max);
        y = rnd(game.y_maze_max);
        if (game.level.locations[x][y].typ == allowedtyp) {
            cc.x = x;
            cc.y = y;
            return;
        }
    } while (++cpt < 100);
    for (x = 1; x <= game.x_maze_max; x++) {
        for (y = 1; y <= game.y_maze_max; y++) {
            if (game.level.locations[x][y].typ == allowedtyp) {
                /* 100 random attempts failed; systematically try every possibility */
                cc.x = x;
                cc.y = y;
                return;
            }
        }
    }
    /* every spot on the area of map allowed for mazes has been rejected */
    panic("mazexy: can't find a place!");
    return;
}
export function get_level_extends(left, top, right, bottom) {
    let x = 0;
    let y = 0;
    let typ = 0;
    let lev = null;
    let found = 0;
    let nonwall = 0;
    let xmin = 0;
    let xmax = 0;
    let ymin = 0;
    let ymax = 0;
    found = nonwall = (0);
    for (xmin = 0; !found && xmin <= 80; xmin++) {
        lev = game.level.locations[xmin][0];
        for (y = 0; y <= 21 - 1; y++) {
            lev = game.level.locations[xmin][y];
            typ = lev.typ;
            if (typ != STONE) {
                found = (1);
                if (!((typ) && (typ) <= DBWALL)) {
                    nonwall = (1);
                }
            }
        }
    }
    xmin -= (nonwall || !game.level.flags.is_maze_lev) ? 2 : 1;
    if (xmin < 0) {
        xmin = 0;
    }
    found = nonwall = (0);
    for (xmax = 80 - 1; !found && xmax >= 0; xmax--) {
        lev = game.level.locations[xmax][0];
        for (y = 0; y <= 21 - 1; y++) {
            lev = game.level.locations[xmax][y];
            typ = lev.typ;
            if (typ != STONE) {
                found = (1);
                if (!((typ) && (typ) <= DBWALL)) {
                    nonwall = (1);
                }
            }
        }
    }
    xmax += (nonwall || !game.level.flags.is_maze_lev) ? 2 : 1;
    if (xmax >= 80) {
        xmax = 80 - 1;
    }
    found = nonwall = (0);
    for (ymin = 0; !found && ymin <= 21; ymin++) {        for (x = xmin; x <= xmax; x++) {
            typ = game.level.locations[x][ymin].typ;
            if (typ != STONE) {
                found = (1);
                if (!((typ) && (typ) <= DBWALL)) {
                    nonwall = (1);
                }
            }
        }
    }
    ymin -= (nonwall || !game.level.flags.is_maze_lev) ? 2 : 1;
    found = nonwall = (0);
    for (ymax = 21 - 1; !found && ymax >= 0; ymax--) {        for (x = xmin; x <= xmax; x++) {
            typ = game.level.locations[x][ymax].typ;
            if (typ != STONE) {
                found = (1);
                if (!((typ) && (typ) <= DBWALL)) {
                    nonwall = (1);
                }
            }
        }
    }
    ymax += (nonwall || !game.level.flags.is_maze_lev) ? 2 : 1;
    left.value = xmin;
    right.value = xmax;
    top.value = ymin;
    bottom.value = ymax;
}
/* put a non-diggable/non-phaseable boundary around the initial portion
 * of a level map. assumes that no level will initially put things
 * beyond the isok() range.
 *
 * we can't bound unconditionally on the last line with something in it,
 * because that something might be a niche which was already reachable,
 * so the boundary would be breached
 *
 * we can't bound unconditionally on one beyond the last line, because
 * that provides a window of abuse for wallified special levels
 */
export function bound_digging() {
    let x = 0;
    let y = 0;
    let xmin = 0;
    let xmax = 0;
    let ymin = 0;
    let ymax = 0;
    if ((((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level))))) {
        return;
    }
    /* everything diggable here */
    get_level_extends({ get value() { return xmin; }, set value(_v) { xmin = _v; } }, { get value() { return ymin; }, set value(_v) { ymin = _v; } }, { get value() { return xmax; }, set value(_v) { xmax = _v; } }, { get value() { return ymax; }, set value(_v) { ymax = _v; } });
    for (x = 0; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            if (((game.level.locations[x][y].typ) <= DBWALL)) {
                /* undiggable walls at edges, ... */
                if (y <= ymin || y >= ymax || x <= xmin || x >= xmax) {
                    game.level.locations[x][y].flags |= 8;
                }
                /* one tile past that, everything is also unphaseable */
                if (y < ymin || y > ymax || x < xmin || x > xmax) {
                    game.level.locations[x][y].flags |= 16;
                }
            }
        }
    }
}
export function mkportal(x, y, todnum, todlevel) {
    /* a portal "trap" must be matched by a
       portal in the destination dungeon/dlevel */
    let ttmp = maketrap(x, y, MAGIC_PORTAL);
    if (!ttmp) {
        impossible("portal on top of portal?");
        return;
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkmaze.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("mkportal: at <%d,%d>, to %s, level %d", x, y, game.dungeons[todnum].dname, todlevel);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    ttmp.dst.dnum = todnum;
    ttmp.dst.dlevel = todlevel;
    return;
}
/* augment the Plane of Fire; called from goto_level() when arriving and
   moveloop_core() when on the level */
export function fumaroles() {
    let n = 0;
    let nmax = rn2(3);
    let sizemin = 5;
    let snd = (0);
    let loud = (0);
    if ((((((game.dungeon_topology.d_fire_level)).dlevel || ((game.dungeon_topology.d_fire_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_fire_level))))) {
        nmax++;
        sizemin += 5;
    }
    if (game.level.flags.temperature > 0) {
        nmax++;
        sizemin += 5;
    }
    for (n = nmax; n; n--) {
        let x = (rn2(80 - 4) + (3));
        let y = (rn2(21 - 4) + (3));
        if (game.level.locations[x][y].typ == LAVAPOOL) {
            let r = create_gas_cloud(x, y, (rn2(10) + (sizemin)), (rn2(10) + (5)));
            ((r).player_flags |= 2);
            snd = (1);
            if (dist2((x), (y), game.u.ux, game.u.uy) < 15) {
                loud = (1);
            }
        }
    }
    if (snd && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        Norep("You hear a %swhoosh!", loud ? "loud " : "");
    }
}
/*
 * Special waterlevel stuff in endgame (TH).
 *
 * Some of these functions would probably logically belong to some
 * other source files, but they are all so nicely encapsulated here.
 */
/* bubble movement boundaries */
/* the bubble hero is in */
game.hero_bubble = null;
/* augment the Planes of Water (for bubbles) and Air (for clouds); called
   from goto_level() when arriving and moveloop_core() when on the level */
const __movebubbles_water_pos = { glyph: (((S_water) - S_grave) + GLYPH_CMAP_B_OFF), typ: WATER, seenv: 0, flags: 0, horizontal: 0, lit: 0, waslit: 0, roomno: 0, edge: 0, candig: 0 };
const __movebubbles_air_pos = { glyph: (((S_cloud) - S_grave) + GLYPH_CMAP_B_OFF), typ: AIR, seenv: 0, flags: 0, horizontal: 0, lit: 1, waslit: 0, roomno: 0, edge: 0, candig: 0 };
let __movebubbles_up = (0);
export function movebubbles() {
    /*
     * These bit masks make visually pleasing bubbles on a normal aspect
     * 25x80 terminal, which naturally results in them being mathematically
     * anything but symmetric.  For this reason they cannot be computed
     * in situ, either.  The first two elements tell the dimensions of
     * the bubble's bounding box.
     */
    let b = null;
    let cons = null;
    let btrap = null;
    let x = 0;
    let y = 0;
    let i = 0;
    let j = 0;
    let bcpin = 0;
    /* set up the portal the first time bubbles are moved */
    if (!game.wportal) {
        set_wportal();
    }
    vision_recalc(2);
    game.hero_bubble = null;
    if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        /* keep attached ball&chain separate from bubble objects */
        if ((game.uball != null)) {
            bcpin = unplacebc_and_covet_placebc();
        }
        for (b = __movebubbles_up ? game.bbubbles : game.ebubbles; b; b = __movebubbles_up ? b.next : b.prev) {
            /*
         * Pick up everything inside of a bubble then fill all bubble
         * locations.
         */
            if (b.cons) {
                panic("movebubbles: cons != null");
            }
            for (i = 0 , x = b.x; i < b.bm[0]; i++ , x++) {
                for (j = 0 , y = b.y; j < b.bm[1]; j++ , y++) {
                    if (b.bm[j + 2] & (1 << i)) {
                        if (!isok(x, y)) {
                            impossible("movebubbles: bad pos (%d,%d)", x, y);
                            continue;
                        }
                        if ((game.level.objects[x][y] != null)) {
                            /* pick up objects, monsters, hero, and traps */
                            let olist = null;
                            let otmp = null;
                            while ((otmp = game.level.objects[x][y]) != null) {
                                remove_object(otmp);
                                otmp.ox = otmp.oy = 0;
                                otmp.v.v_nexthere = olist;
                                olist = otmp;
                            }
                            cons = alloc(1 /* sizeof(struct container) */);
                            cons.x = x;
                            cons.y = y;
                            cons.what = CONS_OBJ;
                            cons.list = olist;
                            cons.next = b.cons;
                            b.cons = cons;
                        }
                        if ((game.level.monsters[x][y] != null)) {
                            let mon = (game.level.monsters[x][y]);
                            cons = alloc(1 /* sizeof(struct container) */);
                            cons.x = x;
                            cons.y = y;
                            cons.what = CONS_MON;
                            cons.list = mon;
                            cons.next = b.cons;
                            b.cons = cons;
                            if (mon.wormno) {
                                remove_worm(mon);
                            } else {
                                game.level.monsters[x][y] = null;
                            }
                            newsym(x, y);
                            mon.mx = mon.my = 0;
                            mon.mstate |= 16;
                        }
                        if (!game.u.uswallow && ((x) == game.u.ux && (y) == game.u.uy)) {
                            cons = alloc(1 /* sizeof(struct container) */);
                            cons.x = x;
                            cons.y = y;
                            cons.what = CONS_HERO;
                            cons.list = null;
                            cons.next = b.cons;
                            b.cons = cons;
                            game.hero_bubble = b;
                        }
                        if ((btrap = t_at(x, y)) != null) {
                            cons = alloc(1 /* sizeof(struct container) */);
                            cons.x = x;
                            cons.y = y;
                            cons.what = CONS_TRAP;
                            cons.list = btrap;
                            cons.next = b.cons;
                            b.cons = cons;
                        }
                        Object.assign(game.level.locations[x][y], __movebubbles_water_pos);
                        block_point(x, y);
                    }
                }
            }
        }
    } else if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
        let xedge = 0;
        let yedge = 0;
        for (x = 1; x <= (80 - 1); x++) {
            for (y = 0; y <= (21 - 1); y++) {
                Object.assign(game.level.locations[x][y], __movebubbles_air_pos);
                recalc_block_point(x, y);
                /* all air or all cloud around the perimeter of the Air
                   level tends to look strange; break up the pattern */
                xedge = (x < (game.xmin + 1) || x > (game.xmax - 1));
                yedge = (y < (game.ymin + 1) || y > (game.ymax - 1));
                if (xedge || yedge) {
                    if (!rn2(xedge ? 3 : 5)) {
                        game.level.locations[x][y].typ = CLOUD;
                        block_point(x, y);
                    }
                }
            }
        }
    }
    /*
     * Every second time traverse down.  This is because otherwise
     * all the junk that changes owners when bubbles overlap
     * would eventually end up in the last bubble in the chain.
     */
    __movebubbles_up = !__movebubbles_up;
    for (b = __movebubbles_up ? game.bbubbles : game.ebubbles; b; b = __movebubbles_up ? b.next : b.prev) {
        let rx = rn2(3);
        let ry = rn2(3);
        mv_bubble(b, b.dx + 1 - (!b.dx ? rx : (rx ? 1 : 0)), b.dy + 1 - (!b.dy ? ry : (ry ? 1 : 0)), (0));
    }
    /* put attached ball&chain back */
    if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && (game.uball != null)) {
        lift_covet_and_placebc(bcpin);
    }
    game.vision_full_recalc = 1;
}
/* when moving in water, possibly (1 in 3) alter the intended destination */
export function water_friction() {
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = 0;
    let eff = (0);
    if ((game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) && rn2(4)) {
        return;
    }
    if (game.u.dx && !rn2(!game.u.dy ? 3 : 6)) {
        /* natural swimmers have advantage */
        /* cancel delta x and choose an arbitrary delta y value */
        x = game.u.ux;
        do {
            dy = rn2(3) - 1;
            y = game.u.uy + dy;
        } while (dy && (!isok(x, y) || !is_pool(x, y)));
        game.u.dx = 0;
        game.u.dy = dy;
        eff = (1);
    } else if (game.u.dy && !rn2(!game.u.dx ? 3 : 5)) {
        /* cancel delta y and choose an arbitrary delta x value */
        y = game.u.uy;
        do {
            dx = rn2(3) - 1;
            x = game.u.ux + dx;
        } while (dx && (!isok(x, y) || !is_pool(x, y)));
        game.u.dy = 0;
        game.u.dx = dx;
        eff = (1);
    }
    if (eff) {
        pline("Water turbulence affects your movements.");
    }
}
export function save_waterlevel(nhfp) {
    let b = null;
    if (!game.bbubbles) {
        return;
    }
    if (((nhfp).mode & (1 | 2))) {
        let n = 0;
        for (b = game.bbubbles; b; b = b.next) {
            ++n;
        }
        sfo_int(nhfp, { get value() { return n; }, set value(_v) { n = _v; } }, "waterlevel-bubble_count");
        sfo_int(nhfp, { get value() { return game.xmin; }, set value(_v) { game.xmin = _v; } }, "waterlevel-xmin");
        sfo_int(nhfp, { get value() { return game.ymin; }, set value(_v) { game.ymin = _v; } }, "waterlevel-ymin");
        sfo_int(nhfp, { get value() { return game.xmax; }, set value(_v) { game.xmax = _v; } }, "waterlevel-xmax");
        sfo_int(nhfp, { get value() { return game.ymax; }, set value(_v) { game.ymax = _v; } }, "waterlevel-ymax");
        for (b = game.bbubbles; b; b = b.next) {
            sfo_bubble(nhfp, b, "waterlevel-bubble");
        }
    }
    if (((nhfp).mode & 4)) {
        unsetup_waterlevel();
    }
}
/* !SFCTOOL */
/* restoring air bubbles on Plane of Water or clouds on Plane of Air */
export function restore_waterlevel(nhfp) {
    let b = null;
    let btmp = null;
    let i = 0;
    let n = 0;
    sfi_int(nhfp, { get value() { return n; }, set value(_v) { n = _v; } }, "waterlevel-bubble_count");
    ;
    sfi_int(nhfp, { get value() { return game.xmin; }, set value(_v) { game.xmin = _v; } }, "waterlevel-xmin");
    ;
    sfi_int(nhfp, { get value() { return game.ymin; }, set value(_v) { game.ymin = _v; } }, "waterlevel-ymin");
    ;
    sfi_int(nhfp, { get value() { return game.xmax; }, set value(_v) { game.xmax = _v; } }, "waterlevel-xmax");
    ;
    sfi_int(nhfp, { get value() { return game.ymax; }, set value(_v) { game.ymax = _v; } }, "waterlevel-ymax");
    ;
    for (i = 0; i < n; i++) {
        btmp = b;
        b = alloc(1 /* sizeof(struct bubble) */);
        sfi_bubble(nhfp, b, "waterlevel-bubble");
        if (btmp) {
            btmp.next = b;
            b.prev = btmp;
        } else {
            game.bbubbles = b;
            b.prev = null;
        }
        mv_bubble(b, 0, 0, (1));
    }
    game.ebubbles = b;
    if (b) {
        b.next = null;
    } else {
        /* avoid "saving and reloading may fix this" */
        game.program_state.something_worth_saving = 0;
        /* during restore, information about what level this is might not
           be available so we're wishy-washy about what we describe */
        impossible("No %s to restore?", ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.uz_save, (game.dungeon_topology.d_water_level))))) ? "air bubbles" : ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.uz_save, (game.dungeon_topology.d_air_level))))) ? "clouds" : "air bubbles or clouds");
        game.program_state.something_worth_saving = 1;
    }
}
export function set_wportal() {
    /* there better be only one magic portal on water level... */
    for (game.wportal = game.ftrap; game.wportal; game.wportal = game.wportal.ntrap) {
        if (game.wportal.ttyp == MAGIC_PORTAL) {
            return;
        }
    }
    impossible("set_wportal(): no portal!");
}
export function setup_waterlevel() {
    let typ = 0;
    let glyph = 0;
    let x = 0;
    let y = 0;
    let xskip = 0;
    let yskip = 0;
    if (!(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
        panic("setup_waterlevel(): [%d:%d] neither 'Water' nor 'Air'", game.u.uz.dnum, game.u.uz.dlevel);
    }
    /* ouch, hardcoded... (file scope statics and used in bxmin,bymax,&c) */
    game.xmin = 3;
    game.ymin = 1;
    /* use separate statements so that compiler won't complain about min()
       comparing two constants; the alternative is to do this in the
       preprocessor: #if (20 > ROWNO-1) ymax=ROWNO-1 #else ymax=20 #endif */
    game.xmax = 78;
    game.xmax = ((game.xmax) < ((80 - 1) - 1) ? (game.xmax) : ((80 - 1) - 1));
    game.ymax = 20;
    game.ymax = ((game.ymax) < ((21 - 1)) ? (game.ymax) : ((21 - 1)));
    /* entire level is remembered as one glyph and any unspecified portion
       should default to level's base element rather than to usual stone */
    glyph = ((((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) <= S_trwall) ? (((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) < S_altar) ? ((((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) < S_arrow_trap + (TRAPNUM - 1)) ? ((((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) - S_grave) + GLYPH_CMAP_B_OFF) : (((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) <= S_goodpos) ? ((((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? S_water : S_air) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
    typ = (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? WATER : AIR;
    for (x = 1; x <= 80 - 1; x++) {
        for (y = 0; y <= 21 - 1; y++) {
            game.level.locations[x][y].glyph = glyph;
            /* set unspecified terrain (stone) and hero's memory to water or air */
            if (game.level.locations[x][y].typ == STONE) {
                game.level.locations[x][y].typ = typ;
            }
        }
    }
    if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        xskip = 10 + rn2(10);
        yskip = 4 + rn2(4);
    } else {
        xskip = 6 + rn2(4);
        yskip = 3 + rn2(3);
    }
    for (x = (game.xmin + 1); x <= (game.xmax - 1); x += xskip) {
        for (y = (game.ymin + 1); y <= (game.ymax - 1); y += yskip) {
            mk_bubble(x, y, rn2(7));
        }
    }
}
export function unsetup_waterlevel() {
    let b = null;
    let bb = null;
    for (b = game.bbubbles; b; b = bb) {
        bb = b.next;
        free(b);
    }
    game.bbubbles = game.ebubbles = null;
}
const __mk_bubble_bm2 = [2, 1, 3];
const __mk_bubble_bm3 = [3, 2, 7, 7];
const __mk_bubble_bm4 = [4, 3, 6, 15, 6];
const __mk_bubble_bm5 = [5, 3, 14, 31, 14];
const __mk_bubble_bm6 = [6, 4, 30, 63, 63, 30];
const __mk_bubble_bm7 = [7, 4, 62, 127, 127, 62];
const __mk_bubble_bm8 = [8, 4, 126, 255, 255, 126];
const __mk_bubble_bmask = [__mk_bubble_bm2, __mk_bubble_bm3, __mk_bubble_bm4, __mk_bubble_bm5, __mk_bubble_bm6, __mk_bubble_bm7, __mk_bubble_bm8];
export function mk_bubble(x, y, n) {
    let b = null;
    if (x >= (game.xmax - 1) || y >= (game.ymax - 1)) {
        return;
    }
    if (n >= (Math.trunc(7 /* sizeof(const uchar *const [7]) */ / 1 /* sizeof(const uchar *const) */))) {
        impossible("n too large (mk_bubble)");
        n = (Math.trunc(7 /* sizeof(const uchar *const [7]) */ / 1 /* sizeof(const uchar *const) */)) - 1;
    }
    if (__mk_bubble_bmask[n][1] > 4) {
        panic("bmask size is larger than MAX_BMASK");
    }
    b = alloc(1 /* sizeof(struct bubble) */);
    if ((x + __mk_bubble_bmask[n][0] - 1) > (game.xmax - 1)) {
        x = (game.xmax - 1) - __mk_bubble_bmask[n][0] + 1;
    }
    if ((y + __mk_bubble_bmask[n][1] - 1) > (game.ymax - 1)) {
        y = (game.ymax - 1) - __mk_bubble_bmask[n][1] + 1;
    }
    b.x = x;
    b.y = y;
    b.dx = 1 - rn2(3);
    b.dy = 1 - rn2(3);
    /* y dimension is the length of bitmap data - see bmask above */
    memcpy(b.bm, __mk_bubble_bmask[n], (__mk_bubble_bmask[n][1] + 2) * 1 /* sizeof(uchar) */);
    b.cons = null;
    if (!game.bbubbles) {
        game.bbubbles = b;
    }
    if (game.ebubbles) {
        game.ebubbles.next = b;
        b.prev = game.ebubbles;
    } else {
        b.prev = null;
    }
    b.next = null;
    game.ebubbles = b;
    mv_bubble(b, 0, 0, (1));
}
/* maybe change the movement direction of the bubble hero is in */
export function maybe_adjust_hero_bubble() {
    if (!(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        return;
    }
    if (!game.u.dx && !game.u.dy) {
        return;
    }
    if (game.hero_bubble && !rn2(2)) {
        game.hero_bubble.dx = game.u.dx;
        game.hero_bubble.dy = game.u.dy;
    }
}
/*
 * The player, the portal and all other objects and monsters
 * float along with their associated bubbles.  Bubbles may overlap
 * freely, and the contents may get associated with other bubbles in
 * the process.  Bubbles are "sticky", meaning that if the player is
 * in the immediate neighborhood of one, he/she may get sucked inside.
 * This property also makes leaving a bubble slightly difficult.
 */
export function mv_bubble(b, dx, dy, ini) {
    let i = 0;
    let j = 0;
    let colli = 0;
    let x = 0;
    let y = 0;
    let cons = null;
    let ctemp = null;
    if (!(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || !rn2(6)) {
        if (dx < -1 || dx > 1 || dy < -1 || dy > 1) {
            /* pline("mv_bubble: dx = %d, dy = %d", dx, dy); */
            dx = sgn(dx);
            dy = sgn(dy);
        }
        /*
         * collision with level borders?
         *      1 = horizontal border, 2 = vertical, 3 = corner
         */
        if (b.x <= (game.xmin + 1)) {
            colli |= 2;
        }
        if (b.y <= (game.ymin + 1)) {
            colli |= 1;
        }
        if ((b.x + b.bm[0] - 1) >= (game.xmax - 1)) {
            colli |= 2;
        }
        if ((b.y + b.bm[1] - 1) >= (game.ymax - 1)) {
            colli |= 1;
        }
        if (b.x < (game.xmin + 1)) {
            pline("bubble xmin: x = %d, xmin = %d", b.x, (game.xmin + 1));
            b.x = (game.xmin + 1);
        }
        if (b.y < (game.ymin + 1)) {
            pline("bubble ymin: y = %d, ymin = %d", b.y, (game.ymin + 1));
            b.y = (game.ymin + 1);
        }
        if ((b.x + b.bm[0] - 1) > (game.xmax - 1)) {
            pline("bubble xmax: x = %d, xmax = %d", b.x + b.bm[0] - 1, (game.xmax - 1));
            b.x = (game.xmax - 1) - b.bm[0] + 1;
        }
        if ((b.y + b.bm[1] - 1) > (game.ymax - 1)) {
            pline("bubble ymax: y = %d, ymax = %d", b.y + b.bm[1] - 1, (game.ymax - 1));
            b.y = (game.ymax - 1) - b.bm[1] + 1;
        }
        /* bounce if we're trying to move off the border */
        if (b.x == (game.xmin + 1) && dx < 0) {
            dx = -dx;
        }
        if (b.x + b.bm[0] - 1 == (game.xmax - 1) && dx > 0) {
            dx = -dx;
        }
        if (b.y == (game.ymin + 1) && dy < 0) {
            dy = -dy;
        }
        if (b.y + b.bm[1] - 1 == (game.ymax - 1) && dy > 0) {
            dy = -dy;
        }
        b.x += dx;
        b.y += dy;
    }
    for (i = 0 , x = b.x; i < b.bm[0]; i++ , x++) {
        for (j = 0 , y = b.y; j < b.bm[1]; j++ , y++) {
            if (b.bm[j + 2] & (1 << i)) {
                if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
                    game.level.locations[x][y].typ = AIR;
                    game.level.locations[x][y].lit = 1;
                    unblock_point(x, y);
                } else if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
                    game.level.locations[x][y].typ = CLOUD;
                    game.level.locations[x][y].lit = 1;
                    block_point(x, y);
                }
            }
        }
    }
    if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        for (cons = b.cons; cons; cons = ctemp) {
            /* replace contents of bubble */
            ctemp = cons.next;
            cons.x += dx;
            cons.y += dy;
            switch (cons.what) {
                case CONS_OBJ:
{
                        let olist = null;
                        let otmp = null;
                        for (olist = cons.list; olist; olist = otmp) {
                            otmp = olist.v.v_nexthere;
                            place_object(olist, cons.x, cons.y);
                            stackobj(olist);
                        }
                        break;
                    }
                case CONS_MON:
{
                        let mon = cons.list;
                        /* mnearto() might fail. We can jump right to elemental_clog
                   from here rather than deal_with_overcrowding() */
                        if (!mnearto(mon, cons.x, cons.y, (1), 4)) {
                            elemental_clog(mon);
                        }
                        break;
                    }
                case CONS_HERO:
{
                        let mtmp = (game.level.monsters[cons.x][cons.y]);
                        let ux0 = game.u.ux;
                        let uy0 = game.u.uy;
                        u_on_newpos(cons.x, cons.y);
                        newsym(ux0, uy0);
                        if (mtmp) {
                            mnexto(mtmp, 4);
                        }
                        break;
                    }
                case CONS_TRAP:
{
                        let btrap = cons.list;
                        btrap.tx = cons.x;
                        btrap.ty = cons.y;
                        break;
                    }
                default:
                    impossible("mv_bubble: unknown bubble contents");
                    break;
            }
            free(cons);
        }
        b.cons = null;
    }
    switch (colli) {
        case 1:
            b.dy = -b.dy;
            break;
        case 3:
            b.dy = -b.dy;
            ;
        case 2:
            b.dx = -b.dx;
            break;
        default:
            if (!ini && ((b.dx || b.dy) ? !rn2(20) : !rn2(5))) {
                /* sometimes alter direction for fun anyway
           (higher probability for stationary bubbles) */
                b.dx = 1 - rn2(3);
                b.dy = 1 - rn2(3);
            }
    }
}
/* !SFCTOOL */
/*mkmaze.c*/
/* isok() test is superfluous here (unless something has
               clobbered the static *_maze_max variables) */
