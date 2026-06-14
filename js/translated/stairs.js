/* NetHack 5.0	stairs.c	$NHDT-Date: 1704043695 2023/12/31 17:28:15 $  $NHDT-Branch: keni-luabits2 $:$NHDT-Revision: 1.207 $ */
/* Copyright (c) 2024 by Pasi Kallinen */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { assign_level, depth, dunlev, on_level, single_level_branch, u_on_newpos, u_on_rndspot } from './dungeon.js';
import { strsubst } from './hacklib.js';

export function stairway_add(x, y, up, isladder, dest) {
    let tmp = alloc(1 /* sizeof(stairway) */);
    memset(tmp, 0, 1 /* sizeof(stairway) */);
    tmp.sx = x;
    tmp.sy = y;
    tmp.up = up;
    tmp.isladder = isladder;
    tmp.u_traversed = (0);
    assign_level((tmp.tolev), dest);
    tmp.next = game.stairs;
    game.stairs = tmp;
}
export function stairway_free_all() {
    let tmp = game.stairs;
    while (tmp) {
        let tmp2 = tmp.next;
        free(tmp);
        tmp = tmp2;
    }
    game.stairs = null;
}
export function stairway_at(x, y) {
    let tmp = game.stairs;
    while (tmp && !(tmp.sx == x && tmp.sy == y)) {
        tmp = tmp.next;
    }
    return tmp;
}
export function stairway_find(fromdlev) {
    let tmp = game.stairs;
    while (tmp) {
        if (tmp.tolev.dnum == fromdlev.dnum && tmp.tolev.dlevel == fromdlev.dlevel) {
            break;
        }
        tmp = tmp.next;
    }
    return tmp;
}
export function stairway_find_from(fromdlev, isladder) {
    let tmp = game.stairs;
    while (tmp) {
        if (tmp.tolev.dnum == fromdlev.dnum && tmp.tolev.dlevel == fromdlev.dlevel && tmp.isladder == isladder) {
            break;
        }
        tmp = tmp.next;
    }
    return tmp;
}
export function stairway_find_dir(up) {
    let tmp = game.stairs;
    while (tmp && !(tmp.up == up)) {
        tmp = tmp.next;
    }
    return tmp;
}
export function stairway_find_type_dir(isladder, up) {
    let tmp = game.stairs;
    while (tmp && !(tmp.isladder == isladder && tmp.up == up)) {
        tmp = tmp.next;
    }
    return tmp;
}
export function stairway_find_special_dir(up) {
    let tmp = game.stairs;
    while (tmp) {
        if (tmp.tolev.dnum != game.u.uz.dnum && tmp.up != up) {
            return tmp;
        }
        tmp = tmp.next;
    }
    return tmp;
}
/* place you on the special staircase */
export async function u_on_sstairs(upflag) {
    let stway = stairway_find_special_dir(upflag);
    if (stway) {
        await u_on_newpos(stway.sx, stway.sy);
    } else {
        await u_on_rndspot(upflag);
    }
}
/* place you on upstairs (or special equivalent) */
export async function u_on_upstairs() {
    let stway = stairway_find_dir((1));
    if (stway) {
        await u_on_newpos(stway.sx, stway.sy);
    } else {
        await u_on_sstairs(0);
    }
}
/* place you on dnstairs (or special equivalent) */
export async function u_on_dnstairs() {
    let stway = stairway_find_dir((0));
    if (stway) {
        await u_on_newpos(stway.sx, stway.sy);
    } else {
        await u_on_sstairs(1);
    }
}
export function On_stairs(x, y) {
    return (stairway_at(x, y) != (null));
}
export function On_ladder(x, y) {
    let stway = stairway_at(x, y);
    return (stway && stway.isladder);
}
export function On_stairs_up(x, y) {
    let stway = stairway_at(x, y);
    return (stway && stway.up);
}
export function On_stairs_dn(x, y) {
    let stway = stairway_at(x, y);
    return (stway && !stway.up);
}
/* return True if 'sway' is a branch staircase and hero has used these stairs
   to visit the branch */
export function known_branch_stairs(sway) {
    return (sway && sway.tolev.dnum != game.u.uz.dnum && sway.u_traversed);
}
/* describe staircase 'sway' based on whether hero knows the destination */
/* stairs/ladder to describe */
/* result buffer */
/* True: "staircase" or "ladder", always singular;
                     * False: "stairs" or "ladder"; caller needs to deal
                     * with singular vs plural when forming a sentence */
export function stairs_description(sway, outbuf, stcase) {
    let tolev = { dnum: 0, dlevel: 0 };
    let stairs = null;
    let updown = null;
    Object.assign(tolev, sway.tolev);
    stairs = sway.isladder ? "ladder" : stcase ? "staircase" : "stairs";
    updown = sway.up ? "up" : "down";
    if (!known_branch_stairs(sway)) {
        outbuf = sprintf(outbuf, "%s %s", stairs, updown);
        if (sway.u_traversed) {
            /* ordinary stairs or branch stairs to not-yet-visited branch */
            let specialdepth = (tolev.dnum == (game.dungeon_topology.d_quest_dnum) || single_level_branch(tolev));
            let to_dlev = specialdepth ? dunlev(tolev) : depth(tolev);
            outbuf = __nh_buf_append(outbuf, sprintf('', " to level %d", to_dlev));
        }
    } else if (game.u.uz.dnum == 0 && game.u.uz.dlevel == 1 && sway.up) {
        outbuf = sprintf(outbuf, "%s%s %s %s", !game.u.uhave.amulet ? "" : "branch ", stairs, updown, !game.u.uhave.amulet ? "out of the dungeon" : (on_level(tolev, (game.dungeon_topology.d_earth_level)) || on_level(tolev, (game.dungeon_topology.d_air_level)) || on_level(tolev, (game.dungeon_topology.d_fire_level)) || on_level(tolev, (game.dungeon_topology.d_water_level))) ? "to the Elemental Planes" : "to the end game");
    } else {
        outbuf = sprintf(outbuf, "branch %s %s to %s", stairs, updown, game.dungeons[tolev.dnum].dname);
        /* dungeons[].dname is capitalized; undo that for "The <Branch>" */
        outbuf = strsubst(outbuf, "The ", "the ");
    }
    return outbuf;
}
/*stairs.c*/
/* destination upstairs implies moving down */
/* destination dnstairs implies moving up */
/* known branch stairs; tacking on destination level is too verbose */
/* stairs up from level one are a special case; they are marked
           as having been traversed because the hero obviously started
           the game by coming down them, but the remote side varies
           depending on whether the Amulet is being carried */
/* minimize our expectations about what comes next */
