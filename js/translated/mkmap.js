import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	mkmap.c	$NHDT-Date: 1717432093 2024/06/03 16:28:13 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.40 $ */
/* Copyright (c) J. C. Collet, M. Stephenson and D. Cohrs, 1992   */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { __nh_advance_str, __nh_char_at0 } from '../c2js-runtime/string.js';
import { isok } from './cmd.js';
import { depth } from './dungeon.js';
import { add_room } from './mklev.js';
import { somexy } from './mkroom.js';
import { DBWALL, DOOR, ICE, LAVAPOOL, OROOM, POOL, ROOM, SDOOR, TREE } from './nh-constants.js';
import { rn2, rnd } from './rnd.js';
import { dig_corridor, wallify_map } from './sp_lev.js';

export function init_map(bg_typ) {
    let x = 0;
    let y = 0;
    for (x = 1; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            game.level.locations[x][y].roomno = 0;
            game.level.locations[x][y].typ = bg_typ;
            game.level.locations[x][y].lit = (0);
        }
    }
}
export function init_fill(bg_typ, fg_typ) {
    let x = 0;
    let y = 0;
    let limit = 0;
    let count = 0;
    limit = Math.trunc(((80 - 2) * (21 - 1) * 2) / 5);
    count = 0;
    while (count < limit) {
        x = (rn2((80 - 2) - 1) + (2));
        y = rnd((21 - 1) - 1);
        if (game.level.locations[x][y].typ == bg_typ) {
            game.level.locations[x][y].typ = fg_typ;
            count++;
        }
    }
}
export function get_map(col, row, bg_typ) {
    if (col <= 0 || row < 0 || col > (80 - 2) || row >= (21 - 1)) {
        return bg_typ;
    }
    return game.level.locations[col][row].typ;
}
export const dirs = [-1, -1, -1, 0, -1, 1, 0, -1, 0, 1, 1, -1, 1, 0, 1, 1];
/**/
/**/
/**/
/**/
/**/
/**/
/**/
export function pass_one(bg_typ, fg_typ) {
    let x = 0;
    let y = 0;
    let count = 0;
    let dr = 0;
    for (x = 2; x <= (80 - 2); x++) {
        for (y = 1; y < (21 - 1); y++) {
            for (count = 0 , dr = 0; dr < 8; dr++) {
                if (get_map(x + dirs[dr * 2], y + dirs[(dr * 2) + 1], bg_typ) == fg_typ) {
                    count++;
                }
            }
            switch (count) {
                case 0:
                case 1:
                case 2:
                    game.level.locations[x][y].typ = bg_typ;
                    break;
                case 5:
                case 6:
                case 7:
                case 8:
                    game.level.locations[x][y].typ = fg_typ;
                    break;
                default:
                    break;
            }
        }
    }
}
export function pass_two(bg_typ, fg_typ) {
    let x = 0;
    let y = 0;
    let count = 0;
    let dr = 0;
    for (x = 2; x <= (80 - 2); x++) {
        for (y = 1; y < (21 - 1); y++) {
            for (count = 0 , dr = 0; dr < 8; dr++) {
                if (get_map(x + dirs[dr * 2], y + dirs[(dr * 2) + 1], bg_typ) == fg_typ) {
                    count++;
                }
            }
            if (count == 5) {
                game.new_locations[y * 79 + x] = bg_typ;
            } else {
                game.new_locations[y * 79 + x] = get_map(x, y, bg_typ);
            }
        }
    }
    for (x = 2; x <= (80 - 2); x++) {
        for (y = 1; y < (21 - 1); y++) {
            game.level.locations[x][y].typ = __nh_char_at0((__nh_advance_str(game.new_locations, ((y) * ((80 - 2) + 1))) + (x)));
        }
    }
}
export function pass_three(bg_typ, fg_typ) {
    let x = 0;
    let y = 0;
    let count = 0;
    let dr = 0;
    for (x = 2; x <= (80 - 2); x++) {
        for (y = 1; y < (21 - 1); y++) {
            for (count = 0 , dr = 0; dr < 8; dr++) {
                if (get_map(x + dirs[dr * 2], y + dirs[(dr * 2) + 1], bg_typ) == fg_typ) {
                    count++;
                }
            }
            if (count < 3) {
                game.new_locations[y * 79 + x] = bg_typ;
            } else {
                game.new_locations[y * 79 + x] = get_map(x, y, bg_typ);
            }
        }
    }
    for (x = 2; x <= (80 - 2); x++) {
        for (y = 1; y < (21 - 1); y++) {
            game.level.locations[x][y].typ = __nh_char_at0((__nh_advance_str(game.new_locations, ((y) * ((80 - 2) + 1))) + (x)));
        }
    }
}
/*
 * use a flooding algorithm to find all locations that should
 * have the same rm number as the current location.
 * if anyroom is TRUE, use IS_ROOM to check room membership instead of
 * exactly matching levl[sx][sy].typ and walls are included as well.
 */
export function flood_fill_rm(sx, sy, rmno, lit, anyroom) {
    let i = 0;
    let nx = 0;
    let fg_typ = game.level.locations[sx][sy].typ;
    /* back up to find leftmost uninitialized location */
    while (sx > 0 && (anyroom ? ((game.level.locations[sx][sy].typ) >= ROOM) : game.level.locations[sx][sy].typ == fg_typ) && game.level.locations[sx][sy].roomno != rmno) {
        sx--;
    }
    sx++;
    /* compensate for extra decrement */
    if (sx < game.min_rx) {
        game.min_rx = sx;
    }
    if (sy < game.min_ry) {
        game.min_ry = sy;
    }
    for (i = sx; i <= (80 - 2) && game.level.locations[i][sy].typ == fg_typ; i++) {
        game.level.locations[i][sy].roomno = rmno;
        game.level.locations[i][sy].lit = lit;
        if (anyroom) {
            /* add walls to room as well */
            let ii = 0;
            let jj = 0;
            for (ii = (i == sx ? i - 1 : i); ii <= i + 1; ii++) {
                for (jj = sy - 1; jj <= sy + 1; jj++) {
                    if (isok(ii, jj) && (((game.level.locations[ii][jj].typ) && (game.level.locations[ii][jj].typ) <= DBWALL) || ((game.level.locations[ii][jj].typ) == DOOR) || game.level.locations[ii][jj].typ == SDOOR)) {
                        game.level.locations[ii][jj].edge = 1;
                        if (lit) {
                            game.level.locations[ii][jj].lit = lit;
                        }
                        if (game.level.locations[ii][jj].roomno == 0) {
                            game.level.locations[ii][jj].roomno = rmno;
                        } else if (game.level.locations[ii][jj].roomno != rmno) {
                            game.level.locations[ii][jj].roomno = 1;
                        }
                    }
                }
            }
        }
        game.n_loc_filled++;
    }
    nx = i;
    if (isok(sx, sy - 1)) {
        for (i = sx; i < nx; i++) {
            if (game.level.locations[i][sy - 1].typ == fg_typ) {
                if (game.level.locations[i][sy - 1].roomno != rmno) {
                    flood_fill_rm(i, sy - 1, rmno, lit, anyroom);
                }
            } else {
                if ((i > sx || isok(i - 1, sy - 1)) && game.level.locations[i - 1][sy - 1].typ == fg_typ) {
                    if (game.level.locations[i - 1][sy - 1].roomno != rmno) {
                        flood_fill_rm(i - 1, sy - 1, rmno, lit, anyroom);
                    }
                }
                if ((i < nx - 1 || isok(i + 1, sy - 1)) && game.level.locations[i + 1][sy - 1].typ == fg_typ) {
                    if (game.level.locations[i + 1][sy - 1].roomno != rmno) {
                        flood_fill_rm(i + 1, sy - 1, rmno, lit, anyroom);
                    }
                }
            }
        }
    }
    if (isok(sx, sy + 1)) {
        for (i = sx; i < nx; i++) {
            if (game.level.locations[i][sy + 1].typ == fg_typ) {
                if (game.level.locations[i][sy + 1].roomno != rmno) {
                    flood_fill_rm(i, sy + 1, rmno, lit, anyroom);
                }
            } else {
                if ((i > sx || isok(i - 1, sy + 1)) && game.level.locations[i - 1][sy + 1].typ == fg_typ) {
                    if (game.level.locations[i - 1][sy + 1].roomno != rmno) {
                        flood_fill_rm(i - 1, sy + 1, rmno, lit, anyroom);
                    }
                }
                if ((i < nx - 1 || isok(i + 1, sy + 1)) && game.level.locations[i + 1][sy + 1].typ == fg_typ) {
                    if (game.level.locations[i + 1][sy + 1].roomno != rmno) {
                        flood_fill_rm(i + 1, sy + 1, rmno, lit, anyroom);
                    }
                }
            }
        }
    }
    if (nx > game.max_rx) {
        game.max_rx = nx - 1;
    }
    /* nx is just past valid region */
    if (sy > game.max_ry) {
        game.max_ry = sy;
    }
}
/* join_map uses temporary rooms; clean up after it */
export function join_map_cleanup() {
    let x = 0;
    let y = 0;
    for (x = 1; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            game.level.locations[x][y].roomno = 0;
        }
    }
    game.nroom = game.nsubroom = 0;
    game.rooms[game.nroom].hx = game.subrooms[game.nsubroom].hx = -1;
}
export async function join_map(bg_typ, fg_typ) {
    fnEnter("join_map", "mkmap.c", 0);
    let croom = null;
    let croom2 = null;
    let x = 0;
    let y = 0;
    let sx = 0;
    let sy = 0;
    let sm = { x: 0, y: 0 };
    let em = { x: 0, y: 0 };
    joinm: {
        for (x = 2; x <= (80 - 2); x++) {
            for (y = 1; y < (21 - 1); y++) {
                if (game.level.locations[x][y].typ == fg_typ && game.level.locations[x][y].roomno == 0) {
                    /* first, use flood filling to find all of the regions that need joining
     */
                    game.min_rx = game.max_rx = x;
                    game.min_ry = game.max_ry = y;
                    game.n_loc_filled = 0;
                    flood_fill_rm(x, y, game.nroom + 3, (0), (0));
                    if (game.n_loc_filled > 3) {
                        await add_room(game.min_rx, game.min_ry, game.max_rx, game.max_ry, (0), OROOM, (1));
                        game.rooms[game.nroom - 1].irregular = (1);
                        if (game.nroom >= (40 * 2)) {
                            break joinm;
                        }
                    } else {
                        /*
                     * it's a tiny hole; erase it from the map to avoid
                     * having the player end up here with no way out.
                     */
                        for (sx = game.min_rx; sx <= game.max_rx; sx++) {
                            for (sy = game.min_ry; sy <= game.max_ry; sy++) {
                                if (game.level.locations[sx][sy].roomno == game.nroom + 3) {
                                    game.level.locations[sx][sy].typ = bg_typ;
                                    game.level.locations[sx][sy].roomno = 0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    {
        let __croomIdx = 0;
        for (let __croom2Idx = 1; __croom2Idx < game.nroom; __croom2Idx++) {
            croom = game.rooms[__croomIdx];
            croom2 = game.rooms[__croom2Idx];
            if (!croom || !croom2) continue;
        if (!somexy(croom, sm) || !somexy(croom2, em)) {
            await impossible("No start/end room loc in join_map.");
            sm.x = croom.lx + (Math.trunc((croom.hx - croom.lx) / 2));
            sm.y = croom.ly + (Math.trunc((croom.hy - croom.ly) / 2));
            em.x = croom2.lx + (Math.trunc((croom2.hx - croom2.lx) / 2));
            em.y = croom2.ly + (Math.trunc((croom2.hy - croom2.ly) / 2));
        }
        await dig_corridor(sm, em, null, (0), fg_typ, bg_typ);
        if (croom2.lx > croom.hx || ((croom2.ly > croom.hy || croom2.hy < croom.ly) && rn2(3))) {
            /* choose next region to join */
            /* only increment croom if croom and croom2 are non-overlapping */
            croom = croom2;
        }
        
            if (croom === croom2) { __croomIdx = __croom2Idx; }
        }
    }
    join_map_cleanup();
}
export function finish_map(fg_typ, bg_typ, lit, walled, icedpools) {
    fnEnter("finish_map", "mkmap.c", 0);
    let x = 0;
    let y = 0;
    if (walled) {
        wallify_map(1, 0, 80 - 1, 21 - 1);
    }
    if (lit) {
        for (x = 1; x < 80; x++) {
            for (y = 0; y < 21; y++) {
                if ((!((fg_typ) < POOL) && game.level.locations[x][y].typ == fg_typ) || (!((bg_typ) < POOL) && game.level.locations[x][y].typ == bg_typ) || (bg_typ == TREE && game.level.locations[x][y].typ == bg_typ) || (walled && ((game.level.locations[x][y].typ) && (game.level.locations[x][y].typ) <= DBWALL))) {
                    game.level.locations[x][y].lit = (1);
                }
            }
        }
        for (x = 0; x < game.nroom; x++) {
            game.rooms[x].rlit = 1;
        }
    }
    for (x = 1; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            /* light lava even if everything's otherwise unlit;
       ice might be frozen pool rather than frozen moat */
            if (game.level.locations[x][y].typ == LAVAPOOL) {
                game.level.locations[x][y].lit = (1);
            } else if (game.level.locations[x][y].typ == ICE) {
                game.level.locations[x][y].flags = icedpools ? 8 : 16;
            }
        }
    }
}
/*
 * TODO: If we really want to remove rooms after a map is plopped down
 * in a special level, this needs to be rewritten - the maps may have
 * holes in them ("x" mapchar), leaving parts of rooms still on the map.
 *
 * When level processed by join_map is overlaid by a MAP, some rooms may no
 * longer be valid.  All rooms in the region lx <= x < hx, ly <= y < hy are
 * removed.  Rooms partially in the region are truncated.  This function
 * must be called before the REGIONs or ROOMs of the map are processed, or
 * those rooms will be removed as well.  Assumes roomno fields in the
 * region are already cleared, and roomno and irregular fields outside the
 * region are all set.
 */
export async function remove_rooms(lx, ly, hx, hy) {
    let i = 0;
    let croom = null;
    for (i = game.nroom - 1; i >= 0; --i) {
        croom = game.rooms[i];
        if (croom.hx < lx || croom.lx >= hx || croom.hy < ly || croom.ly >= hy) {
            continue;
        }
        if (croom.lx < lx || croom.hx >= hx || croom.ly < ly || croom.hy >= hy) {
            if (!croom.irregular) {
                await impossible("regular room in joined map");
            }
        } else {
            /* total overlap, remove the room */
            remove_room(i);
        }
    }
}
/*
 * Remove roomno from the rooms array, decrementing nroom.
 * The last room is swapped with the being-removed room and locations
 * within it have their roomno field updated.  Other rooms are unaffected.
 * Assumes level structure contents corresponding to roomno have already
 * been reset.
 * Currently handles only the removal of rooms that have no subrooms.
 */
export function remove_room(roomno) {
    let croom = game.rooms[roomno];
    let maxroom = game.rooms[--game.nroom];
    let x = 0;
    let y = 0;
    let oroomno = 0;
    if (croom != maxroom) {
        /* since the order in the array only matters for making corridors,
         * copy the last room over the one being removed on the assumption
         * that corridors have already been dug. */
        Object.assign(croom, maxroom);
        /* since maxroom moved, update affected level roomno values */
        oroomno = game.nroom + 3;
        roomno += 3;
        for (x = croom.lx; x <= croom.hx; ++x) {
            for (y = croom.ly; y <= croom.hy; ++y) {
                if (game.level.locations[x][y].roomno == oroomno) {
                    game.level.locations[x][y].roomno = roomno;
                }
            }
        }
    }
    maxroom.hx = -1;
}
/* tune map generation via this value */
/* tune map generation via this value */
/* tune map smoothing via this value */
export function litstate_rnd(litstate) {
    if (litstate < 0) {
        return (rnd(1 + abs(depth(game.u.uz))) < 11 && rn2(77)) ? (1) : (0);
    }
    return litstate;
}
export async function mkmap(init_lev) {
    fnEnter("mkmap", "mkmap.c", 0);
    let bg_typ = init_lev.bg;
    let fg_typ = init_lev.fg;
    let smooth = init_lev.smoothed;
    let join = init_lev.joined;
    let lit = init_lev.lit;
    let walled = init_lev.walled;
    let i = 0;
    lit = litstate_rnd(lit);
    game.new_locations = alloc(((80 - 2) + 1) * (21 - 1));
    init_map(bg_typ);
    init_fill(bg_typ, fg_typ);
    for (i = 0; i < 1; i++) {
        pass_one(bg_typ, fg_typ);
    }
    for (i = 0; i < 1; i++) {
        pass_two(bg_typ, fg_typ);
    }
    if (smooth) {
        for (i = 0; i < 2; i++) {
            pass_three(bg_typ, fg_typ);
        }
    }
    if (join) {
        await join_map(bg_typ, fg_typ);
    }
    finish_map(fg_typ, bg_typ, lit, walled, init_lev.icedpools);
    if (walled && join) {
        /* a walled, joined level is cavernous, not mazelike -dlc */
        game.level.flags.is_maze_lev = (0);
        game.level.flags.is_cavernous_lev = (1);
    }
    free(game.new_locations);
}
/*mkmap.c*/
/*
     * Ok, now we can actually join the regions with fg_typ's.
     * The rooms are already sorted due to the previous loop,
     * so don't call sort_rooms(), which can screw up the roomno's
     * validity in the levl structure.
     */
/* pick random starting and end locations for "corridor" */
/* ack! -- the level is going to be busted */
/* arbitrarily pick centers of both rooms and hope for the best */
/* always increment the next room */
/* TODO: ensure remaining parts of room are still joined */
