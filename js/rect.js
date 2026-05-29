// rect.js — Rectangle allocator for room placement.
// C ref: rect.c — init_rect, rnd_rect, split_rects.
// Used by makerooms() to find free space for room placement.
// Only RNG call: rn2(rect_cnt) in rnd_rect().

import { game } from './gstate.js';
import { COLNO, ROWNO } from './const.js';
import { rn2 } from './rng.js';

const XLIM = 4;
const YLIM = 3;

// C ref: rect.c:28 init_rect()
export function init_rect() {
    if (!game.nhrect) {
        game.n_rects = Math.trunc((COLNO * ROWNO) / 30);
        game.nhrect = new Array(game.n_rects);
        for (let i = 0; i < game.n_rects; i++) {
            game.nhrect[i] = { lx: 0, ly: 0, hx: 0, hy: 0 };
        }
    }
    game.rect_cnt = 1;
    game.nhrect[0].lx = 0;
    game.nhrect[0].ly = 0;
    game.nhrect[0].hx = COLNO - 1;
    game.nhrect[0].hy = ROWNO - 1;
}

// C ref: rect.c:44 free_rect()
export function free_rect() {
    game.nhrect = null;
    game.n_rects = game.rect_cnt = 0;
}

// C ref: rect.c:59 get_rect_ind()
export function get_rect_ind(r) {
    const { lx, ly, hx, hy } = r;
    for (let i = 0; i < game.rect_cnt; i++) {
        const rectp = game.nhrect[i];
        if (lx === rectp.lx && ly === rectp.ly
            && hx === rectp.hx && hy === rectp.hy)
            return i;
    }
    return -1;
}

// C ref: rect.c:81 get_rect()
// Find a free rectangle that includes the given one.
export function get_rect(r) {
    const { lx, ly, hx, hy } = r;
    for (let i = 0; i < game.rect_cnt; i++) {
        const rectp = game.nhrect[i];
        if (lx >= rectp.lx && ly >= rectp.ly
            && hx <= rectp.hx && hy <= rectp.hy)
            return rectp;
    }
    return null;
}

// C ref: rect.c:103 rnd_rect()
// RNG: rn2(rect_cnt)
export function rnd_rect() {
    if (game.rect_cnt <= 0) return null;
    return game.nhrect[rn2(game.rect_cnt)];
}
export function get_rect_cnt() { return game.rect_cnt; }

// C: within_bounded_area(x, y, lx, ly, hx, hy) — check if point is within bounds
export function within_bounded_area(x, y, lx, ly, hx, hy) {
    return (x >= lx && x <= hx && y >= ly && y <= hy);
}

// C ref: rect.c:115 intersect()
function intersect(r1, r2, r3) {
    if (r2.lx > r1.hx || r2.ly > r1.hy
        || r2.hx < r1.lx || r2.hy < r1.ly)
        return false;

    r3.lx = (r2.lx > r1.lx ? r2.lx : r1.lx);
    r3.ly = (r2.ly > r1.ly ? r2.ly : r1.ly);
    r3.hx = (r2.hx > r1.hx ? r1.hx : r2.hx);
    r3.hy = (r2.hy > r1.hy ? r1.hy : r2.hy);

    if (r3.lx > r3.hx || r3.ly > r3.hy)
        return false;
    return true;
}

// C ref: rect.c:133 rect_bounds()
export function rect_bounds(r1, r2, r3) {
    r3.lx = Math.min(r1.lx, r2.lx);
    r3.ly = Math.min(r1.ly, r2.ly);
    r3.hx = Math.max(r1.hx, r2.hx);
    r3.hy = Math.max(r1.hy, r2.hy);
}

// C ref: rect.c:146 remove_rect()
export function remove_rect(r) {
    const ind = get_rect_ind(r);
    if (ind >= 0) {
        game.rect_cnt--;
        game.nhrect[ind] = { ...game.nhrect[game.rect_cnt] };
    }
}

// C ref: rect.c:160 add_rect()
export function add_rect(r) {
    if (game.rect_cnt >= game.n_rects) {
        // impossible("n_rects may be too small.")
        return;
    }
    if (get_rect(r))
        return;
    game.nhrect[game.rect_cnt] = { ...r };
    game.rect_cnt++;
}

// C ref: rect.c:181 split_rects()
// Split r1 to accommodate r2 (r2 is included in r1).
export function split_rects(r1, r2) {
    const old_r = { ...r1 };
    remove_rect(r1);

    // Walk down since rect_cnt & rects[] will change
    for (let i = game.rect_cnt - 1; i >= 0; i--) {
        const r = { lx: 0, ly: 0, hx: 0, hy: 0 };
        if (intersect(game.nhrect[i], r2, r))
            split_rects(game.nhrect[i], r);
    }

    // Top piece
    if (r2.ly - old_r.ly - 1
        > (old_r.hy < ROWNO - 1 ? 2 * YLIM : YLIM + 1) + 4) {
        const r = { ...old_r };
        r.hy = r2.ly - 2;
        add_rect(r);
    }
    // Left piece
    if (r2.lx - old_r.lx - 1
        > (old_r.hx < COLNO - 1 ? 2 * XLIM : XLIM + 1) + 4) {
        const r = { ...old_r };
        r.hx = r2.lx - 2;
        add_rect(r);
    }
    // Bottom piece
    if (old_r.hy - r2.hy - 1
        > (old_r.ly > 0 ? 2 * YLIM : YLIM + 1) + 4) {
        const r = { ...old_r };
        r.ly = r2.hy + 2;
        add_rect(r);
    }
    // Right piece
    if (old_r.hx - r2.hx - 1
        > (old_r.lx > 0 ? 2 * XLIM : XLIM + 1) + 4) {
        const r = { ...old_r };
        r.lx = r2.hx + 2;
        add_rect(r);
    }
}

export function init_rect_globals() {
    game.nhrect = null;
    game.n_rects = 0;
    game.rect_cnt = 0;
}
