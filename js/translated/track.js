/* NetHack 5.0	track.c	$NHDT-Date: 1596498219 2020/08/03 23:43:39 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.12 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Kenneth Lorber, Kensington, Maryland, 2015. */
/* NetHack may be freely redistributed.  See license for details. */
/* track.c - version 1.0.2 */
import { game } from '../gstate.js';
import { memset } from '../c2js-runtime/memory.js';
import { panic } from '../c2js-runtime/panic.js';
import { distmin } from './hacklib.js';
import { RIN_STEALTH } from './nh-constants.js';
import { sfi_int, sfi_nhcoord, sfo_int, sfo_nhcoord } from './sfbase.js';

game.utcnt = 0;
game.utpnt = 0;
game.utrack = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
export function initrack() {
    game.utcnt = game.utpnt = 0;
    memset(game.utrack, 0, 100 /* sizeof(coord [100]) */);
}
/* add to track */
export function settrack() {
    if ((game.uleft && game.uleft.otyp == RIN_STEALTH) || (game.uright && game.uright.otyp == RIN_STEALTH)) {
        return;
    }
    if (game.utcnt < 100) {
        game.utcnt++;
    }
    if (game.utpnt == 100) {
        game.utpnt = 0;
    }
    game.utrack[game.utpnt].x = game.u.ux;
    game.utrack[game.utpnt].y = game.u.uy;
    game.utpnt++;
}
/* get a track coord on or next to x,y and last tracked by hero,
   returns null if no such track */
export function gettrack(x, y) {
    let i = game.utpnt;
    let cnt = game.utcnt;
    while (cnt-- > 0) {
        // Walk backwards with wraparound — mirrors C's tc--.
        if (i === 0) {
            i = 100 - 1;
        } else {
            i--;
        }
        const tc = game.utrack[i];
        const ndist = distmin(x, y, tc.x, tc.y);
        if (ndist <= 1) {
            return ndist ? tc : null;
        }
    }
    return null;
}
/* !SFCTOOL */
/* return TRUE if x,y has hero tracks on it */
export function hastrack(x, y) {
    let i = 0;
    for (i = 0; i < game.utcnt; i++) {
        if (game.utrack[i].x == x && game.utrack[i].y == y) {
            return (1);
        }
    }
    return (0);
}
/* save the hero tracking info */
export function save_track(nhfp) {
    if (((nhfp).mode & (1 | 2))) {
        let i = 0;
        sfo_int(nhfp, { get value() { return game.utcnt; }, set value(_v) { game.utcnt = _v; } }, "track-utcnt");
        sfo_int(nhfp, { get value() { return game.utpnt; }, set value(_v) { game.utpnt = _v; } }, "track-utpnt");
        for (i = 0; i < game.utcnt; i++) {
            sfo_nhcoord(nhfp, game.utrack[i], "utrack");
        }
    }
    if (((nhfp).mode & 4)) {
        initrack();
    }
}
/* restore the hero tracking info */
export function rest_track(nhfp) {
    let i = 0;
    sfi_int(nhfp, { get value() { return game.utcnt; }, set value(_v) { game.utcnt = _v; } }, "track-utcnt");
    ;
    sfi_int(nhfp, { get value() { return game.utpnt; }, set value(_v) { game.utpnt = _v; } }, "track-utpnt");
    ;
    if (game.utcnt > 100 || game.utpnt > 100) {
        panic("rest_track: impossible pt counts");
    }
    for (i = 0; i < game.utcnt; i++) {
        sfi_nhcoord(nhfp, game.utrack[i], "utrack");
    }
}
/*track.c*/
