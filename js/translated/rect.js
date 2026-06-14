/* NetHack 5.0	rect.c	$NHDT-Date: 1596498203 2020/08/03 23:43:23 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.14 $ */
/* Copyright (c) 1990 by Jean-Christophe Collet                   */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { rn2 } from './rnd.js';

/*
 * In this file, we will handle the various rectangle functions we
 * need for room generation.
 */
game.rect = null;
game.n_rects = 0;
game.rect_cnt = 0;
/*
 * Initialization of internal structures. Should be called for every
 * new level to be build...
 */
export async function init_rect() {
    if (!game.rect) {
        game.n_rects = Math.trunc((80 * 21) / 30);
        game.rect = alloc(1 /* sizeof(NhRect) */ * game.n_rects);
        if (!game.rect) {
            await panic("Could not alloc rect");
        }
    }
    game.rect_cnt = 1;
    game.rect[0].lx = game.rect[0].ly = 0;
    game.rect[0].hx = 80 - 1;
    game.rect[0].hy = 21 - 1;
}
export function free_rect() {
    if (game.rect) {
        free(game.rect);
    }
    game.rect = null;
    game.n_rects = game.rect_cnt = 0;
}
/*
 * Search Index of one precise NhRect.
 *
 */
export function get_rect_ind(r) {
    let rectp = null;
    let lx = 0;
    let ly = 0;
    let hx = 0;
    let hy = 0;
    let i = 0;
    lx = r.lx;
    ly = r.ly;
    hx = r.hx;
    hy = r.hy;
    for (i = 0; i < game.rect_cnt; i++) {
        rectp = game.rect[i];
        if (lx == rectp.lx && ly == rectp.ly && hx == rectp.hx && hy == rectp.hy) {
            return i;
        }
    }
    return -1;
}
/*
 * Search a free rectangle that include the one given in arg
 */
export function get_rect(r) {
    let rectp = null;
    let lx = 0;
    let ly = 0;
    let hx = 0;
    let hy = 0;
    let i = 0;
    lx = r.lx;
    ly = r.ly;
    hx = r.hx;
    hy = r.hy;
    for (i = 0; i < game.rect_cnt; i++) {
        rectp = game.rect[i];
        if (lx >= rectp.lx && ly >= rectp.ly && hx <= rectp.hx && hy <= rectp.hy) {
            return rectp;
        }
    }
    return null;
}
/*
 * Get some random NhRect from the list.
 */
export function rnd_rect() {
    return game.rect_cnt > 0 ? game.rect[rn2(game.rect_cnt)] : null;
}
/*
 * Search intersection between two rectangles (r1 & r2).
 * return TRUE if intersection exist and put it in r3.
 * otherwise returns FALSE
 */
export function intersect(r1, r2, r3) {
    if (r2.lx > r1.hx || r2.ly > r1.hy || r2.hx < r1.lx || r2.hy < r1.ly) {
        return (0);
    }
    r3.lx = (r2.lx > r1.lx ? r2.lx : r1.lx);
    r3.ly = (r2.ly > r1.ly ? r2.ly : r1.ly);
    r3.hx = (r2.hx > r1.hx ? r1.hx : r2.hx);
    r3.hy = (r2.hy > r1.hy ? r1.hy : r2.hy);
    if (r3.lx > r3.hx || r3.ly > r3.hy) {
        return (0);
    }
    return (1);
}
/* Put the rectangle containing both r1 and r2 into r3 */
export function rect_bounds(r1, r2, r3) {
    r3.lx = ((r1.lx) < (r2.lx) ? (r1.lx) : (r2.lx));
    r3.ly = ((r1.ly) < (r2.ly) ? (r1.ly) : (r2.ly));
    r3.hx = ((r1.hx) > (r2.hx) ? (r1.hx) : (r2.hx));
    r3.hy = ((r1.hy) > (r2.hy) ? (r1.hy) : (r2.hy));
}
/*
 * Remove a rectangle from the list of free NhRect.
 */
export function remove_rect(r) {
    let ind = 0;
    ind = get_rect_ind(r);
    if (ind >= 0) {
        Object.assign(game.rect[ind], game.rect[--game.rect_cnt]);
    }
}
/*
 * Add a NhRect to the list.
 */
export async function add_rect(r) {
    if (game.rect_cnt >= game.n_rects) {
        await impossible("n_rects may be too small.");
        return;
    }
    /* Check that this NhRect is not included in another one */
    if (get_rect(r)) {
        return;
    }
    Object.assign(game.rect[game.rect_cnt], r);
    game.rect_cnt++;
}
/*
 * Okay, here we have two rectangles (r1 & r2).
 * r1 was already in the list and r2 is included in r1.
 * What we want is to allocate r2, that is split r1 into smaller rectangles
 * then remove it.
 */
export async function split_rects(r1, r2) {
    let r = { lx: 0, ly: 0, hx: 0, hy: 0 };
    let old_r = { lx: 0, ly: 0, hx: 0, hy: 0 };
    let i = 0;
    Object.assign(old_r, r1);
    remove_rect(r1);
    /* Walk down since rect_cnt & rect[] will change... */
    for (i = game.rect_cnt - 1; i >= 0; i--) {
        if (intersect(game.rect[i], r2, r)) {
            await split_rects(game.rect[i], r);
        }
    }
    if (r2.ly - old_r.ly - 1 > (old_r.hy < 21 - 1 ? 2 * 3 : 3 + 1) + 4) {
        Object.assign(r, old_r);
        r.hy = r2.ly - 2;
        await add_rect(r);
    }
    if (r2.lx - old_r.lx - 1 > (old_r.hx < 80 - 1 ? 2 * 4 : 4 + 1) + 4) {
        Object.assign(r, old_r);
        r.hx = r2.lx - 2;
        await add_rect(r);
    }
    if (old_r.hy - r2.hy - 1 > (old_r.ly > 0 ? 2 * 3 : 3 + 1) + 4) {
        Object.assign(r, old_r);
        r.ly = r2.hy + 2;
        await add_rect(r);
    }
    if (old_r.hx - r2.hx - 1 > (old_r.lx > 0 ? 2 * 4 : 4 + 1) + 4) {
        Object.assign(r, old_r);
        r.lx = r2.hx + 2;
        await add_rect(r);
    }
}
/*rect.c*/
