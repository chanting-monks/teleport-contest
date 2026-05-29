/* NetHack 5.0	selvar.c	$NHDT-Date: 1769840272 2026/01/30 22:17:52 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.4 $ */
/* Copyright (c) 2024 by Pasi Kallinen */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { isok } from './cmd.js';
import { cg } from './decl.js';
import { newsym_force } from './display.js';
import { dist2 } from './hacklib.js';
import { rn2 } from './rnd.js';
import { match_maptyps, random_wdir } from './sp_lev.js';

/* selection */
export function selection_new() {
    let tmps = alloc(1 /* sizeof(struct selectionvar) */);
    tmps.wid = 80;
    tmps.hei = 21;
    tmps.bounds_dirty = (0);
    tmps.bounds.lx = 80;
    tmps.bounds.ly = 21;
    tmps.bounds.hx = tmps.bounds.hy = 0;
    tmps.map = alloc((80 * 21) + 1);
    memset(tmps.map, 1, (80 * 21));
    tmps.map[(80 * 21)] = 0;
    return tmps;
}
export function selection_free(sel, freesel) {
    if (sel) {
        if (sel.map) {
            free(sel.map);
        }
        sel.map = null;
        if (freesel) {
            free(sel);
        } else {
            memset(sel, 0, 1 /* sizeof(struct selectionvar) */);
        }
    }
}
/* clear selection, setting all locations to value val */
export function selection_clear(sel, val) {
    memset(sel.map, 1 + val, (80 * 21));
    if (val) {
        sel.bounds.lx = 0;
        sel.bounds.ly = 0;
        sel.bounds.hx = 80 - 1;
        sel.bounds.hy = 21 - 1;
    } else {
        sel.bounds.lx = 80;
        sel.bounds.ly = 21;
        sel.bounds.hx = sel.bounds.hy = 0;
    }
    sel.bounds_dirty = (0);
}
export function selection_clone(sel) {
    let tmps = alloc(1 /* sizeof(struct selectionvar) */);
    Object.assign(tmps, sel);
    tmps.map = dupstr(sel.map);
    return tmps;
}
/* get boundary rect of selection sel into b */
export function selection_getbounds(sel, b) {
    if (!sel || !b) {
        return;
    }
    selection_recalc_bounds(sel);
    if (sel.bounds.lx >= sel.wid) {
        b.lx = 0;
        b.ly = 0;
        b.hx = 80 - 1;
        b.hy = 21 - 1;
    } else {
        b.lx = sel.bounds.lx;
        b.ly = sel.bounds.ly;
        b.hx = sel.bounds.hx;
        b.hy = sel.bounds.hy;
    }
}
/* recalc the boundary of selection, if necessary */
export function selection_recalc_bounds(sel) {
    let x = 0;
    let y = 0;
    let r = { lx: 0, ly: 0, hx: 0, hy: 0 };
    if (!sel.bounds_dirty) {
        return;
    }
    sel.bounds.lx = 80;
    sel.bounds.ly = 21;
    sel.bounds.hx = sel.bounds.hy = 0;
    r.lx = r.ly = r.hx = r.hy = -1;
    for (x = 0; x < sel.wid; x++) {
        for (y = 0; y < sel.hei; y++) {
            if (selection_getpoint(x, y, sel)) {
                r.lx = x;
                break;
            }
        }
        if (r.lx > -1) {
            break;
        }
    }
    if (r.lx > -1) {
        for (x = sel.wid - 1; x >= r.lx; x--) {
            for (y = 0; y < sel.hei; y++) {
                if (selection_getpoint(x, y, sel)) {
                    r.hx = x;
                    break;
                }
            }
            if (r.hx > -1) {
                break;
            }
        }
        for (y = 0; y < sel.hei; y++) {
            for (x = r.lx; x <= r.hx; x++) {
                if (selection_getpoint(x, y, sel)) {
                    r.ly = y;
                    break;
                }
            }
            if (r.ly > -1) {
                break;
            }
        }
        for (y = sel.hei - 1; y >= r.ly; y--) {
            for (x = r.lx; x <= r.hx; x++) {
                if (selection_getpoint(x, y, sel)) {
                    r.hy = y;
                    break;
                }
            }
            if (r.hy > -1) {
                break;
            }
        }
        sel.bounds = r;
    }
    sel.bounds_dirty = (0);
}
export function selection_getpoint(x, y, sel) {
    if (!sel || !sel.map) {
        return 0;
    }
    if (x < 0 || y < 0 || x >= sel.wid || y >= sel.hei) {
        return 0;
    }
    return (sel.map[sel.wid * y + x] - 1);
}
export function selection_setpoint(x, y, sel, c) {
    if (!sel || !sel.map) {
        return;
    }
    if (x < 0 || y < 0 || x >= sel.wid || y >= sel.hei) {
        return;
    }
    if (c && !sel.bounds_dirty) {
        if (sel.bounds.lx > x) {
            sel.bounds.lx = x;
        }
        if (sel.bounds.ly > y) {
            sel.bounds.ly = y;
        }
        if (sel.bounds.hx < x) {
            sel.bounds.hx = x;
        }
        /* only set bounds_dirty if changing a point from 1 to 0; if changing
       a point from 0 to 0, nothing has really changed with the bounds */
        if (sel.bounds.hy < y) {
            sel.bounds.hy = y;
        }
    } else if (sel.map[sel.wid * y + x] != 0) {
        sel.bounds_dirty = (1);
    }
    sel.map[sel.wid * y + x] = (c + 1);
}
export function selection_not(s) {
    let x = 0;
    let y = 0;
    let tmprect = cg.zeroNhRect;
    for (x = 0; x < s.wid; x++) {
        for (y = 0; y < s.hei; y++) {
            selection_setpoint(x, y, s, selection_getpoint(x, y, s) ? 0 : 1);
        }
    }
    selection_getbounds(s, tmprect);
    return s;
}
export function selection_filter_percent(ov, percent) {
    let x = 0;
    let y = 0;
    let ret = null;
    let rect = cg.zeroNhRect;
    if (!ov) {
        return null;
    }
    ret = selection_new();
    selection_getbounds(ov, rect);
    for (x = rect.lx; x <= rect.hx; x++) {
        for (y = rect.ly; y <= rect.hy; y++) {
            if (selection_getpoint(x, y, ov) && (rn2(100) < percent)) {
                selection_setpoint(x, y, ret, 1);
            }
        }
    }
    return ret;
}
export function selection_filter_mapchar(ov, typ, lit) {
    let x = 0;
    let y = 0;
    let ret = null;
    let rect = cg.zeroNhRect;
    if (!ov) {
        return null;
    }
    ret = selection_new();
    selection_getbounds(ov, rect);
    for (x = rect.lx; x <= rect.hx; x++) {
        for (y = rect.ly; y <= rect.hy; y++) {
            if (selection_getpoint(x, y, ov) && match_maptyps(typ, game.level.locations[x][y].typ)) {
                switch (lit) {
                    default:
                    case -2:
                        selection_setpoint(x, y, ret, 1);
                        break;
                    case -1:
                        selection_setpoint(x, y, ret, rn2(2));
                        break;
                    case 0:
                    case 1:
                        if (game.level.locations[x][y].lit == lit) {
                            selection_setpoint(x, y, ret, 1);
                        }
                        break;
                }
            }
        }
    }
    return ret;
}
export function selection_rndcoord(ov, x, y, removeit) {
    let idx = 0;
    let c = 0;
    let dx = 0;
    let dy = 0;
    let rect = cg.zeroNhRect;
    selection_getbounds(ov, rect);
    for (dx = rect.lx; dx <= rect.hx; dx++) {
        for (dy = rect.ly; dy <= rect.hy; dy++) {
            if (selection_getpoint(dx, dy, ov)) {
                idx++;
            }
        }
    }
    if (idx) {
        c = rn2(idx);
        for (dx = rect.lx; dx <= rect.hx; dx++) {
            for (dy = rect.ly; dy <= rect.hy; dy++) {
                if (selection_getpoint(dx, dy, ov)) {
                    if (!c) {
                        x.value = dx;
                        y.value = dy;
                        if (removeit) {
                            selection_setpoint(dx, dy, ov, 0);
                        }
                        return 1;
                    }
                    c--;
                }
            }
        }
    }
    x.value = y.value = -1;
    return 0;
}
export function selection_do_grow(ov, dir) {
    let x = 0;
    let y = 0;
    let tmp = null;
    let rect = cg.zeroNhRect;
    if (!ov) {
        return;
    }
    tmp = selection_new();
    if (dir == -1) {
        dir = random_wdir();
    }
    selection_getbounds(ov, rect);
    for (x = ((0) > (rect.lx - 1) ? (0) : (rect.lx - 1)); x <= ((80 - 1) < (rect.hx + 1) ? (80 - 1) : (rect.hx + 1)); x++) {
        for (y = ((0) > (rect.ly - 1) ? (0) : (rect.ly - 1)); y <= ((21 - 1) < (rect.hy + 1) ? (21 - 1) : (rect.hy + 1)); y++) {
            if (((dir & 8) && selection_getpoint(x + 1, y, ov)) || (((dir & (8 | 1)) == (8 | 1)) && selection_getpoint(x + 1, y + 1, ov)) || ((dir & 1) && selection_getpoint(x, y + 1, ov)) || (((dir & (1 | 4)) == (1 | 4)) && selection_getpoint(x - 1, y + 1, ov)) || ((dir & 4) && selection_getpoint(x - 1, y, ov)) || (((dir & (4 | 2)) == (4 | 2)) && selection_getpoint(x - 1, y - 1, ov)) || ((dir & 2) && selection_getpoint(x, y - 1, ov)) || (((dir & (2 | 8)) == (2 | 8)) && selection_getpoint(x + 1, y - 1, ov))) {
                /* note:  dir is a mask of multiple directions, but the only
               way to specify diagonals is by including the two adjacent
               orthogonal directions, which effectively specifies three-
               way growth [WEST|NORTH => WEST plus WEST|NORTH plus NORTH] */
                selection_setpoint(x, y, tmp, 1);
            }
        }
    }
    selection_getbounds(tmp, rect);
    for (x = rect.lx; x <= rect.hx; x++) {
        for (y = rect.ly; y <= rect.hy; y++) {
            if (selection_getpoint(x, y, tmp)) {
                selection_setpoint(x, y, ov, 1);
            }
        }
    }
    selection_free(tmp, (1));
}
game.selection_flood_check_func = null;
export function set_selection_floodfillchk(f) {
    game.selection_flood_check_func = f;
}
/* check whethere <x,y> is already in xs[],ys[] */
export function sel_flood_havepoint(x, y, xs, ys, n) {
    let xx = x;
    let yy = y;
    while (n > 0) {
        --n;
        if (xs[n] == xx && ys[n] == yy) {
            return (1);
        }
    }
    return (0);
}
const __selection_floodfill_floodfill_stack_overrun = "floodfill stack overrun";
export function selection_floodfill(ov, x, y, diagonals) {
    let tmp = selection_new();
    let idx = 0;
    let dx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let dy = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (game.selection_flood_check_func == null) {
        selection_free(tmp, (1));
        return;
    }
    do {
        if (idx < (80 * 21)) {
            dx[idx] = (x);
            dy[idx] = (y);
            idx++;
        } else {
            panic(__selection_floodfill_floodfill_stack_overrun);
        }
    } while (0);
    do {
        idx--;
        x = dx[idx];
        y = dy[idx];
        if (isok(x, y)) {
            selection_setpoint(x, y, ov, 1);
            selection_setpoint(x, y, tmp, 1);
        }
        do {
            if (isok(((x + 1)), (y)) && (game.selection_flood_check_func)(((x + 1)), (y)) && !selection_getpoint(((x + 1)), (y), (tmp)) && !sel_flood_havepoint(((x + 1)), (y), dx, dy, idx)) {
                do {
                    if (idx < (80 * 21)) {
                        dx[idx] = (((x + 1)));
                        dy[idx] = ((y));
                        idx++;
                    } else {
                        panic(__selection_floodfill_floodfill_stack_overrun);
                    }
                } while (0);
            }
        } while (0);
        do {
            if (isok(((x - 1)), (y)) && (game.selection_flood_check_func)(((x - 1)), (y)) && !selection_getpoint(((x - 1)), (y), (tmp)) && !sel_flood_havepoint(((x - 1)), (y), dx, dy, idx)) {
                do {
                    if (idx < (80 * 21)) {
                        dx[idx] = (((x - 1)));
                        dy[idx] = ((y));
                        idx++;
                    } else {
                        panic(__selection_floodfill_floodfill_stack_overrun);
                    }
                } while (0);
            }
        } while (0);
        do {
            if (isok((x), ((y + 1))) && (game.selection_flood_check_func)((x), ((y + 1))) && !selection_getpoint((x), ((y + 1)), (tmp)) && !sel_flood_havepoint((x), ((y + 1)), dx, dy, idx)) {
                do {
                    if (idx < (80 * 21)) {
                        dx[idx] = ((x));
                        dy[idx] = (((y + 1)));
                        idx++;
                    } else {
                        panic(__selection_floodfill_floodfill_stack_overrun);
                    }
                } while (0);
            }
        } while (0);
        do {
            if (isok((x), ((y - 1))) && (game.selection_flood_check_func)((x), ((y - 1))) && !selection_getpoint((x), ((y - 1)), (tmp)) && !sel_flood_havepoint((x), ((y - 1)), dx, dy, idx)) {
                do {
                    if (idx < (80 * 21)) {
                        dx[idx] = ((x));
                        dy[idx] = (((y - 1)));
                        idx++;
                    } else {
                        panic(__selection_floodfill_floodfill_stack_overrun);
                    }
                } while (0);
            }
        } while (0);
        if (diagonals) {
            do {
                if (isok(((x + 1)), ((y + 1))) && (game.selection_flood_check_func)(((x + 1)), ((y + 1))) && !selection_getpoint(((x + 1)), ((y + 1)), (tmp)) && !sel_flood_havepoint(((x + 1)), ((y + 1)), dx, dy, idx)) {
                    do {
                        if (idx < (80 * 21)) {
                            dx[idx] = (((x + 1)));
                            dy[idx] = (((y + 1)));
                            idx++;
                        } else {
                            panic(__selection_floodfill_floodfill_stack_overrun);
                        }
                    } while (0);
                }
            } while (0);
            do {
                if (isok(((x - 1)), ((y - 1))) && (game.selection_flood_check_func)(((x - 1)), ((y - 1))) && !selection_getpoint(((x - 1)), ((y - 1)), (tmp)) && !sel_flood_havepoint(((x - 1)), ((y - 1)), dx, dy, idx)) {
                    do {
                        if (idx < (80 * 21)) {
                            dx[idx] = (((x - 1)));
                            dy[idx] = (((y - 1)));
                            idx++;
                        } else {
                            panic(__selection_floodfill_floodfill_stack_overrun);
                        }
                    } while (0);
                }
            } while (0);
            do {
                if (isok(((x - 1)), ((y + 1))) && (game.selection_flood_check_func)(((x - 1)), ((y + 1))) && !selection_getpoint(((x - 1)), ((y + 1)), (tmp)) && !sel_flood_havepoint(((x - 1)), ((y + 1)), dx, dy, idx)) {
                    do {
                        if (idx < (80 * 21)) {
                            dx[idx] = (((x - 1)));
                            dy[idx] = (((y + 1)));
                            idx++;
                        } else {
                            panic(__selection_floodfill_floodfill_stack_overrun);
                        }
                    } while (0);
                }
            } while (0);
            do {
                if (isok(((x + 1)), ((y - 1))) && (game.selection_flood_check_func)(((x + 1)), ((y - 1))) && !selection_getpoint(((x + 1)), ((y - 1)), (tmp)) && !sel_flood_havepoint(((x + 1)), ((y - 1)), dx, dy, idx)) {
                    do {
                        if (idx < (80 * 21)) {
                            dx[idx] = (((x + 1)));
                            dy[idx] = (((y - 1)));
                            idx++;
                        } else {
                            panic(__selection_floodfill_floodfill_stack_overrun);
                        }
                    } while (0);
                }
            } while (0);
        }
    } while (idx > 0);
    selection_free(tmp, (1));
}
/* McIlroy's Ellipse Algorithm */
export function selection_do_ellipse(ov, xc, yc, a, b, filled) {
    /* e(x,y) = b^2*x^2 + a^2*y^2 - a^2*b^2 */
    let x = 0;
    let y = b;
    let a2 = a * a;
    let b2 = b * b;
    let crit1 = -(Math.trunc(a2 / 4) + a % 2 + b2);
    let crit2 = -(Math.trunc(b2 / 4) + b % 2 + a2);
    let crit3 = -(Math.trunc(b2 / 4) + b % 2);
    /* e(x+1/2,y-1/2) - (a^2+b^2)/4 */
    let t = -a2 * y;
    let dxt = 2 * b2 * x;
    let dyt = -2 * a2 * y;
    let d2xt = 2 * b2;
    let d2yt = 2 * a2;
    let width = 1;
    let i = 0;
    if (!ov) {
        return;
    }
    filled = !filled;
    if (!filled) {
        while (y >= 0 && x <= a) {
            selection_setpoint(xc + x, yc + y, ov, 1);
            if (x != 0 || y != 0) {
                selection_setpoint(xc - x, yc - y, ov, 1);
            }
            if (x != 0 && y != 0) {
                selection_setpoint(xc + x, yc - y, ov, 1);
                selection_setpoint(xc - x, yc + y, ov, 1);
            }
            if (t + b2 * x <= crit1 || t + a2 * y <= crit3) {
                x++;
                dxt += d2xt;
                t += dxt;
            } else if (t - a2 * y > crit2) {
                y--;
                dyt += d2yt;
                t += dyt;
            } else {
                x++;
                dxt += d2xt;
                t += dxt;
                y--;
                dyt += d2yt;
                t += dyt;
            }
        }
    } else {
        while (y >= 0 && x <= a) {
            if (t + b2 * x <= crit1 || t + a2 * y <= crit3) {
                x++;
                dxt += d2xt;
                t += dxt;
                width += 2;
            } else if (t - a2 * y > crit2) {
                for (i = 0; i < width; i++) {
                    selection_setpoint(xc - x + i, yc - y, ov, 1);
                }
                if (y != 0) {
                    for (i = 0; i < width; i++) {
                        selection_setpoint(xc - x + i, yc + y, ov, 1);
                    }
                }
                y--;
                dyt += d2yt;
                t += dyt;
            } else {
                for (i = 0; i < width; i++) {
                    selection_setpoint(xc - x + i, yc - y, ov, 1);
                }
                if (y != 0) {
                    for (i = 0; i < width; i++) {
                        selection_setpoint(xc - x + i, yc + y, ov, 1);
                    }
                }
                x++;
                dxt += d2xt;
                t += dxt;
                y--;
                dyt += d2yt;
                t += dyt;
                width += 2;
            }
        }
    }
}
/* square of distance from line segment (x1,y1, x2,y2) to point (x3,y3) */
export function line_dist_coord(x1, y1, x2, y2, x3, y3) {
    let px = x2 - x1;
    let py = y2 - y1;
    let s = px * px + py * py;
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = 0;
    let distsq = 0;
    let lu = 0;
    if (x1 == x2 && y1 == y2) {
        return dist2(x1, y1, x3, y3);
    }
    lu = Math.trunc(((x3 - x1) * px + (y3 - y1) * py) / s);
    if (lu > 1) {
        lu = 1;
    } else if (lu < 0) {
        lu = 0;
    }
    x = x1 + lu * px;
    y = y1 + lu * py;
    dx = x - x3;
    dy = y - y3;
    distsq = dx * dx + dy * dy;
    return distsq;
}
/* guts of l_selection_gradient */
export function selection_do_gradient(ov, x, y, x2, y2, gtyp, mind, maxd) {
    let dx = 0;
    let dy = 0;
    let dofs = 0;
    if (mind > maxd) {
        let tmp = mind;
        mind = maxd;
        maxd = tmp;
    }
    dofs = maxd * maxd - mind * mind;
    if (dofs < 1) {
        dofs = 1;
    }
    switch (gtyp) {
        default:
            impossible("Unrecognized gradient type! Defaulting to radial...");
            ;
        case 0:
{
                for (dx = 0; dx < 80; dx++) {
                    for (dy = 0; dy < 21; dy++) {
                        let d0 = line_dist_coord(x, y, x2, y2, dx, dy);
                        if (d0 <= mind * mind || (d0 <= maxd * maxd && d0 - mind * mind < rn2(dofs))) {
                            selection_setpoint(dx, dy, ov, 1);
                        }
                    }
                }
                break;
            }
        case 1:
{
                for (dx = 0; dx < 80; dx++) {
                    for (dy = 0; dy < 21; dy++) {
                        let d1 = line_dist_coord(x, y, x2, y2, x, dy);
                        let d2 = line_dist_coord(x, y, x2, y2, dx, y);
                        let d3 = line_dist_coord(x, y, x2, y2, x2, dy);
                        let d4 = line_dist_coord(x, y, x2, y2, dx, y2);
                        let d5 = line_dist_coord(x, y, x2, y2, dx, dy);
                        let d0 = ((d5) < (((((d1) > (d2) ? (d1) : (d2))) < (((d3) > (d4) ? (d3) : (d4))) ? (((d1) > (d2) ? (d1) : (d2))) : (((d3) > (d4) ? (d3) : (d4))))) ? (d5) : (((((d1) > (d2) ? (d1) : (d2))) < (((d3) > (d4) ? (d3) : (d4))) ? (((d1) > (d2) ? (d1) : (d2))) : (((d3) > (d4) ? (d3) : (d4))))));
                        if (d0 <= mind * mind || (d0 <= maxd * maxd && d0 - mind * mind < rn2(dofs))) {
                            selection_setpoint(dx, dy, ov, 1);
                        }
                    }
                }
                break;
            }
    }
}
/* bresenham line algo */
export function selection_do_line(x1, y1, x2, y2, ov) {
    let d0 = 0;
    let dx = 0;
    let dy = 0;
    let ai = 0;
    let bi = 0;
    let xi = 0;
    let yi = 0;
    if (x1 < x2) {
        xi = 1;
        dx = x2 - x1;
    } else {
        xi = -1;
        dx = x1 - x2;
    }
    if (y1 < y2) {
        yi = 1;
        dy = y2 - y1;
    } else {
        yi = -1;
        dy = y1 - y2;
    }
    selection_setpoint(x1, y1, ov, 1);
    if (!dx && !dy) {
        ;
    } else if (dx > dy) {
        /* single point - already all done */
        ai = (dy - dx) * 2;
        bi = dy * 2;
        d0 = bi - dx;
        do {
            if (d0 >= 0) {
                y1 += yi;
                d0 += ai;
            } else {
                d0 += bi;
            }
            x1 += xi;
            selection_setpoint(x1, y1, ov, 1);
        } while (x1 != x2);
    } else {
        ai = (dx - dy) * 2;
        bi = dx * 2;
        d0 = bi - dy;
        do {
            if (d0 >= 0) {
                x1 += xi;
                d0 += ai;
            } else {
                d0 += bi;
            }
            y1 += yi;
            selection_setpoint(x1, y1, ov, 1);
        } while (y1 != y2);
    }
}
export function selection_do_randline(x1, y1, x2, y2, rough, rec, ov) {
    let mx = 0;
    let my = 0;
    let dx = 0;
    let dy = 0;
    if (rec < 1 || (x2 == x1 && y2 == y1)) {
        return;
    }
    if (rough > ((abs(x2 - x1)) > (abs(y2 - y1)) ? (abs(x2 - x1)) : (abs(y2 - y1)))) {
        rough = ((abs(x2 - x1)) > (abs(y2 - y1)) ? (abs(x2 - x1)) : (abs(y2 - y1)));
    }
    if (rough < 2) {
        mx = (Math.trunc((x1 + x2) / 2));
        my = (Math.trunc((y1 + y2) / 2));
    } else {
        do {
            dx = rn2(rough) - (Math.trunc(rough / 2));
            dy = rn2(rough) - (Math.trunc(rough / 2));
            mx = (Math.trunc((x1 + x2) / 2)) + dx;
            my = (Math.trunc((y1 + y2) / 2)) + dy;
        } while ((mx > 80 - 1 || mx < 0 || my < 0 || my > 21 - 1));
    }
    if (!selection_getpoint(mx, my, ov)) {
        selection_setpoint(mx, my, ov, 1);
    }
    rough = Math.trunc((rough * 2) / 3);
    rec--;
    selection_do_randline(x1, y1, mx, my, rough, rec, ov);
    selection_do_randline(mx, my, x2, y2, rough, rec, ov);
    selection_setpoint(x2, y2, ov, 1);
}
export function selection_iterate(ov, func, arg) {
    let x = 0;
    let y = 0;
    let rect = cg.zeroNhRect;
    if (!ov) {
        return;
    }
    selection_getbounds(ov, rect);
    for (x = rect.lx; x <= rect.hx; x++) {
        for (y = rect.ly; y <= rect.hy; y++) {
            if (isok(x, y) && selection_getpoint(x, y, ov)) {
                (func)(x, y, arg);
            }
        }
    }
}
/* selection is not rectangular, or has holes in it */
export function selection_is_irregular(sel) {
    let x = 0;
    let y = 0;
    let rect = cg.zeroNhRect;
    selection_getbounds(sel, rect);
    for (x = rect.lx; x <= rect.hx; x++) {
        for (y = rect.ly; y <= rect.hy; y++) {
            if (isok(x, y) && !selection_getpoint(x, y, sel)) {
                return (1);
            }
        }
    }
    return (0);
}
/* return a description of the selection size */
export function selection_size_description(sel, buf) {
    let rect = cg.zeroNhRect;
    let dx = 0;
    let dy = 0;
    selection_getbounds(sel, rect);
    dx = rect.hx - rect.lx + 1;
    dy = rect.hy - rect.ly + 1;
    buf = sprintf(buf, "%s %i by %i", selection_is_irregular(sel) ? "irregularly shaped" : (dx == dy) ? "square" : "rectangular", dx, dy);
    return buf;
}
export function selection_from_mkroom(croom) {
    let sel = selection_new();
    let x = 0;
    let y = 0;
    let rmno = 0;
    if (!croom && game.coder && game.coder.croom) {
        croom = game.coder.croom;
    }
    if (!croom) {
        return sel;
    }
    rmno = (game.rooms.indexOf(croom) + 3);
    for (y = croom.ly; y <= croom.hy; y++) {
        for (x = croom.lx; x <= croom.hx; x++) {
            if (isok(x, y) && !game.level.locations[x][y].edge && game.level.locations[x][y].roomno == rmno) {
                selection_setpoint(x, y, sel, 1);
            }
        }
    }
    return sel;
}
export function selection_force_newsyms(sel) {
    let x = 0;
    let y = 0;
    for (x = 1; x < sel.wid; x++) {
        for (y = 0; y < sel.hei; y++) {
            if (selection_getpoint(x, y, sel)) {
                newsym_force(x, y);
            }
        }
    }
}
/*selvar.c*/
