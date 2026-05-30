/* NetHack 5.0	extralev.c	$NHDT-Date: 1737345573 2025/01/19 19:59:33 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.28 $ */
/*      Copyright 1988, 1989 by Ken Arromdee                      */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * Support code for "rogue"-style level.
 */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { christen_monst, roguename } from './do_name.js';
import { makemon } from './makemon.js';
import { add_room, dodoor } from './mklev.js';
import { curse, mksobj_at, weight } from './mkobj.js';
import { somex, somey } from './mkroom.js';
import { ARROW, BOW, CORR, DBWALL, FAKE_AMULET_OF_YENDOR, FOOD_RATION, MACE, OROOM, PLATE_MAIL, PM_GHOST, RING_MAIL, SCORR, TWO_HANDED_SWORD } from './nh-constants.js';
import { rn2, rnd } from './rnd.js';

export function roguejoin(x1, y1, x2, y2, horiz) {
    let x = 0;
    let y = 0;
    let middle = 0;
    if (horiz) {
        middle = x1 + rn2(x2 - x1 + 1);
        for (x = ((x1) < (middle) ? (x1) : (middle)); x <= ((x1) > (middle) ? (x1) : (middle)); x++) {
            corr(x, y1);
        }
        for (y = ((y1) < (y2) ? (y1) : (y2)); y <= ((y1) > (y2) ? (y1) : (y2)); y++) {
            corr(middle, y);
        }
        for (x = ((middle) < (x2) ? (middle) : (x2)); x <= ((middle) > (x2) ? (middle) : (x2)); x++) {
            corr(x, y2);
        }
    } else {
        middle = y1 + rn2(y2 - y1 + 1);
        for (y = ((y1) < (middle) ? (y1) : (middle)); y <= ((y1) > (middle) ? (y1) : (middle)); y++) {
            corr(x1, y);
        }
        for (x = ((x1) < (x2) ? (x1) : (x2)); x <= ((x1) > (x2) ? (x1) : (x2)); x++) {
            corr(x, middle);
        }
        for (y = ((middle) < (y2) ? (middle) : (y2)); y <= ((middle) > (y2) ? (middle) : (y2)); y++) {
            corr(x2, y);
        }
    }
}
export function roguecorr(x, y, dir) {
    let fromx = 0;
    let fromy = 0;
    let tox = 0;
    let toy = 0;
    if (dir == 2) {
        game.r[x][y].doortable &= ~2;
        if (!game.r[x][y].real) {
            fromx = game.r[x][y].rlx;
            fromy = game.r[x][y].rly;
            fromx += 1 + 26 * x;
            fromy += 7 * y;
        } else {
            fromx = game.r[x][y].rlx + rn2(game.r[x][y].dx);
            fromy = game.r[x][y].rly + game.r[x][y].dy;
            fromx += 1 + 26 * x;
            fromy += 7 * y;
            if (!((game.level.locations[fromx][fromy].typ) && (game.level.locations[fromx][fromy].typ) <= DBWALL)) {
                impossible("down: no wall at %d,%d?", fromx, fromy);
            }
            dodoor(fromx, fromy, game.rooms[game.r[x][y].nroom]);
            game.level.locations[fromx][fromy].flags = 0;
            fromy++;
        }
        if (y >= 2) {
            impossible("down door from %d,%d going nowhere?", x, y);
            return;
        }
        y++;
        game.r[x][y].doortable &= ~1;
        if (!game.r[x][y].real) {
            tox = game.r[x][y].rlx;
            toy = game.r[x][y].rly;
            tox += 1 + 26 * x;
            toy += 7 * y;
        } else {
            tox = game.r[x][y].rlx + rn2(game.r[x][y].dx);
            toy = game.r[x][y].rly - 1;
            tox += 1 + 26 * x;
            toy += 7 * y;
            if (!((game.level.locations[tox][toy].typ) && (game.level.locations[tox][toy].typ) <= DBWALL)) {
                impossible("up: no wall at %d,%d?", tox, toy);
            }
            dodoor(tox, toy, game.rooms[game.r[x][y].nroom]);
            game.level.locations[tox][toy].flags = 0;
            toy--;
        }
        roguejoin(fromx, fromy, tox, toy, (0));
        return;
    } else if (dir == 8) {
        game.r[x][y].doortable &= ~8;
        if (!game.r[x][y].real) {
            fromx = game.r[x][y].rlx;
            fromy = game.r[x][y].rly;
            fromx += 1 + 26 * x;
            fromy += 7 * y;
        } else {
            fromx = game.r[x][y].rlx + game.r[x][y].dx;
            fromy = game.r[x][y].rly + rn2(game.r[x][y].dy);
            fromx += 1 + 26 * x;
            fromy += 7 * y;
            if (!((game.level.locations[fromx][fromy].typ) && (game.level.locations[fromx][fromy].typ) <= DBWALL)) {
                impossible("down: no wall at %d,%d?", fromx, fromy);
            }
            dodoor(fromx, fromy, game.rooms[game.r[x][y].nroom]);
            game.level.locations[fromx][fromy].flags = 0;
            fromx++;
        }
        if (x >= 2) {
            impossible("right door from %d,%d going nowhere?", x, y);
            return;
        }
        x++;
        game.r[x][y].doortable &= ~4;
        if (!game.r[x][y].real) {
            tox = game.r[x][y].rlx;
            toy = game.r[x][y].rly;
            tox += 1 + 26 * x;
            toy += 7 * y;
        } else {
            tox = game.r[x][y].rlx - 1;
            toy = game.r[x][y].rly + rn2(game.r[x][y].dy);
            tox += 1 + 26 * x;
            toy += 7 * y;
            if (!((game.level.locations[tox][toy].typ) && (game.level.locations[tox][toy].typ) <= DBWALL)) {
                impossible("left: no wall at %d,%d?", tox, toy);
            }
            dodoor(tox, toy, game.rooms[game.r[x][y].nroom]);
            game.level.locations[tox][toy].flags = 0;
            tox--;
        }
        roguejoin(fromx, fromy, tox, toy, (1));
        return;
    } else {
        impossible("corridor in direction %d?", dir);
    }
}
/* Modified walkfrom() from mkmaze.c */
export function miniwalk(x, y) {
    let q = 0;
    let dir = 0;
    let dirs = [0, 0, 0, 0];
    while (1) {
        q = 0;
        if (x > 0 && (!((game.r[x][y].doortable) & 4)) && (!game.r[x - 1][y].doortable || !rn2(10))) {
            dirs[q++] = 0;
        }
        if (x < 2 && (!((game.r[x][y].doortable) & 8)) && (!game.r[x + 1][y].doortable || !rn2(10))) {
            dirs[q++] = 1;
        }
        if (y > 0 && (!((game.r[x][y].doortable) & 1)) && (!game.r[x][y - 1].doortable || !rn2(10))) {
            dirs[q++] = 2;
        }
        if (y < 2 && (!((game.r[x][y].doortable) & 2)) && (!game.r[x][y + 1].doortable || !rn2(10))) {
            dirs[q++] = 3;
        }
        /* Rogue levels aren't just 3 by 3 mazes; they have some extra
         * connections, thus that 1/10 chance
         */
        if (!q) {
            return;
        }
        dir = dirs[rn2(q)];
        switch (dir) {
            case 0:
                (game.r[x][y].doortable) |= 4;
                x--;
                (game.r[x][y].doortable) |= 8;
                break;
            case 1:
                (game.r[x][y].doortable) |= 8;
                x++;
                (game.r[x][y].doortable) |= 4;
                break;
            case 2:
                (game.r[x][y].doortable) |= 1;
                y--;
                (game.r[x][y].doortable) |= 2;
                break;
            case 3:
                (game.r[x][y].doortable) |= 2;
                y++;
                (game.r[x][y].doortable) |= 1;
                break;
        }
        miniwalk(x, y);
    }
}
export function makeroguerooms() {
    let x = 0;
    let y = 0;
    /* Rogue levels are structured 3 by 3, with each section containing
     * a room or an intersection.  The minimum width is 2 each way.
     * One difference between these and "real" Rogue levels: real Rogue
     * uses 24 rows and NetHack only 23.  So we cheat a bit by making the
     * second row of rooms not as deep.
     *
     * Each normal space has 6/7 rows and 25 columns in which a room may
     * actually be placed.  Walls go from rows 0-5/6 and columns 0-24.
     * Not counting walls, the room may go in
     * rows 1-5 and columns 1-23 (numbering starting at 0).  A room
     * coordinate of this type may be converted to a level coordinate
     * by adding 1+28*x to the column, and 7*y to the row.  (The 1
     * is because column 0 isn't used [we only use 1-78]).
     * Room height may be 2-4 (2-5 on last row), length 2-23 (not
     * counting walls).
     */
    game.nroom = 0;
    for (y = 0; y < 3; y++) {
        for (x = 0; x < 3; x++) {
            /* Note: we want to insure at least 1 room.  So, if the
             * first 8 are all dummies, force the last to be a room.
             */
            if (!rn2(5) && (game.nroom || (x < 2 && y < 2))) {
                game.r[x][y].real = (0);
                game.r[x][y].rlx = (rn2(22) + (2));
                game.r[x][y].rly = (rn2((y == 2) ? 4 : 3) + (2));
            } else {
                game.r[x][y].real = (1);
                game.r[x][y].dx = (rn2(22) + (2));
                game.r[x][y].dy = (rn2((y == 2) ? 4 : 3) + (2));
                game.r[x][y].rlx = rnd(23 - game.r[x][y].dx + 1);
                game.r[x][y].rly = rnd(((y == 2) ? 5 : 4) - game.r[x][y].dy + 1);
                /* boundaries of room floor */
                game.nroom++;
            }
            game.r[x][y].doortable = 0;
        }
    }
    miniwalk(rn2(3), rn2(3));
    game.nroom = 0;
    for (y = 0; y < 3; y++) {
        for (x = 0; x < 3; x++) {
            if (game.r[x][y].real) {
                /* Arbitrary: dummy rooms may only go where real
                 * ones do.
                 */
                let lowx = 0;
                let lowy = 0;
                let hix = 0;
                let hiy = 0;
                game.r[x][y].nroom = game.nroom;
                game.smeq[game.nroom] = game.nroom;
                lowx = 1 + 26 * x + game.r[x][y].rlx;
                lowy = 7 * y + game.r[x][y].rly;
                hix = 1 + 26 * x + game.r[x][y].rlx + game.r[x][y].dx - 1;
                hiy = 7 * y + game.r[x][y].rly + game.r[x][y].dy - 1;
                /* Strictly speaking, it should be lit only if above
                 * level 10, but since Rogue rooms are only
                 * encountered below level 10, use !rn2(7).
                 */
                add_room(lowx, lowy, hix, hiy, !rn2(7), OROOM, (0));
            }
        }
    }
    for (y = 0; y < 3; y++) {
        for (x = 0; x < 3; x++) {
            /* Now, add connecting corridors. */
            if (game.r[x][y].doortable & 2) {
                roguecorr(x, y, 2);
            }
            if (game.r[x][y].doortable & 8) {
                roguecorr(x, y, 8);
            }
            if (game.r[x][y].doortable & 4) {
                impossible("left end of %d, %d never connected?", x, y);
            }
            if (game.r[x][y].doortable & 1) {
                impossible("up end of %d, %d never connected?", x, y);
            }
        }
    }
}
export function corr(x, y) {
    if (rn2(50)) {
        game.level.locations[x][y].typ = CORR;
    } else {
        game.level.locations[x][y].typ = SCORR;
    }
}
export function makerogueghost() {
    let ghost = null;
    let ghostobj = null;
    let croom = null;
    let x = 0;
    let y = 0;
    if (!game.nroom) {
        return;
    }
    croom = game.rooms[rn2(game.nroom)];
    x = somex(croom);
    y = somey(croom);
    if (!(ghost = makemon(game.mons[PM_GHOST], x, y, 0))) {
        return;
    }
    ghost.msleeping = 1;
    ghost = christen_monst(ghost, roguename());
    ((ghost));
    if (rn2(4)) {
        ghostobj = mksobj_at(FOOD_RATION, x, y, (0), (0));
        ghostobj.quan = rnd(7);
        ghostobj.owt = weight(ghostobj);
    }
    if (rn2(2)) {
        ghostobj = mksobj_at(MACE, x, y, (0), (0));
        ghostobj.spe = rnd(3);
        if (rn2(4)) {
            curse(ghostobj);
        }
    } else {
        ghostobj = mksobj_at(TWO_HANDED_SWORD, x, y, (0), (0));
        ghostobj.spe = rnd(5) - 2;
        if (rn2(4)) {
            curse(ghostobj);
        }
    }
    ghostobj = mksobj_at(BOW, x, y, (0), (0));
    ghostobj.spe = 1;
    if (rn2(4)) {
        curse(ghostobj);
    }
    ghostobj = mksobj_at(ARROW, x, y, (0), (0));
    ghostobj.spe = 0;
    ghostobj.quan = (rn2(10) + (25));
    ghostobj.owt = weight(ghostobj);
    if (rn2(4)) {
        curse(ghostobj);
    }
    if (rn2(2)) {
        ghostobj = mksobj_at(RING_MAIL, x, y, (0), (0));
        ghostobj.spe = rn2(3);
        if (!rn2(3)) {
            ghostobj.oerodeproof = (1);
        }
        if (rn2(4)) {
            curse(ghostobj);
        }
    } else {
        ghostobj = mksobj_at(PLATE_MAIL, x, y, (0), (0));
        ghostobj.spe = rnd(5) - 2;
        if (!rn2(3)) {
            ghostobj.oerodeproof = (1);
        }
        if (rn2(4)) {
            curse(ghostobj);
        }
    }
    if (rn2(2)) {
        ghostobj = mksobj_at(FAKE_AMULET_OF_YENDOR, x, y, (1), (0));
        ghostobj.known = (1);
    }
}
/*extralev.c*/
