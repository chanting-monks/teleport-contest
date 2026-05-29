import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	mkroom.c	$NHDT-Date: 1613086701 2021/02/11 23:38:21 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.52 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * Entry points:
 *      do_mkroom() -- make and stock a room of a given type
 *      nexttodoor() -- return TRUE if adjacent to a door
 *      has_dnstairs() -- return TRUE if given room has a down staircase
 *      has_upstairs() -- return TRUE if given room has an up staircase
 *      courtmon() -- generate a court monster
 *      save_rooms() -- save rooms into file fd
 *      rest_rooms() -- restore rooms from file fd
 *      cmap_to_type() -- convert S_xxx symbol to XXX topology code
 */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { isok } from './cmd.js';
import { def_oc_syms } from './drawing.js';
import { In_hell, induced_align, level_difficulty } from './dungeon.js';
import { del_engr_at, make_grave } from './engrave.js';
import { dist2, distmin } from './hacklib.js';
import { sobj_at } from './invent.js';
import { makemon, mkclass, mongets, set_malign } from './makemon.js';
import { ndemon } from './minion.js';
import { occupied, topologize } from './mklev.js';
import { add_to_container, mk_tt_object, mkgold, mkobj, mkobj_at, mksobj, mksobj_at, weight } from './mkobj.js';
import { AIR, ALTAR, ANTHOLE, BARRACKS, BEEHIVE, BLCORNER, BRCORNER, CHEST, CLOUD, COCKNEST, CORPSE, CORR, COURT, CROSSWALL, DBWALL, DOOR, DRAWBRIDGE_DOWN, FODDERSHOP, FOOD_CLASS, FOUNTAIN, GOLD_PIECE, GRAVE, HWALL, ICE, IRONBARS, LADDER, LARGE_BOX, LAVAPOOL, LAVAWALL, LEPREHALL, LUMP_OF_ROYAL_JELLY, MACE, MORGUE, NON_PM, OROOM, PM_BUGBEAR, PM_CAPTAIN, PM_COCKATRICE, PM_DWARF_RULER, PM_ELECTRIC_EEL, PM_ELVEN_MONARCH, PM_FIRE_ANT, PM_GHOST, PM_GIANT_ANT, PM_GIANT_EEL, PM_GNOME_RULER, PM_HOBGOBLIN, PM_KILLER_BEE, PM_LEPRECHAUN, PM_LIEUTENANT, PM_OGRE_TYRANT, PM_PIRANHA, PM_QUEEN_BEE, PM_SERGEANT, PM_SOLDIER, PM_SOLDIER_ANT, PM_WRAITH, POOL, RANDOM_CLASS, ROOM, SDOOR, SHOPBASE, SINK, SPBOOK_CLASS, STAIRS, STATUE, STONE, SWAMP, S_CENTAUR, S_DEMON, S_DRAGON, S_FUNGUS, S_GIANT, S_GNOME, S_KOBOLD, S_ORC, S_TROLL, S_VAMPIRE, S_ZOMBIE, S_air, S_altar, S_bars, S_blcorn, S_brcorn, S_cloud, S_corr, S_crwall, S_darkroom, S_dnladder, S_dnstair, S_fountain, S_grave, S_hcdbridge, S_hcdoor, S_hodbridge, S_hodoor, S_hwall, S_ice, S_lava, S_lavawall, S_litcorr, S_ndoor, S_pool, S_room, S_sink, S_stone, S_tdwall, S_throne, S_tlcorn, S_tlwall, S_trcorn, S_tree, S_trwall, S_tuwall, S_upladder, S_upstair, S_vcdbridge, S_vcdoor, S_vodbridge, S_vodoor, S_vwall, S_water, TDWALL, TEMPLE, THRONE, TLCORNER, TLWALL, TRCORNER, TREE, TRWALL, TUWALL, VWALL, WAND_CLASS, WATER, ZOO } from './nh-constants.js';
import { nh_getenv } from './options.js';
import { priestini } from './priest.js';
import { rn2, rnd } from './rnd.js';
import { sfi_int, sfi_mkroom, sfo_int, sfo_mkroom } from './sfbase.js';
import { shtypes } from './shknam.js';
import { enexto } from './teleport.js';
import { t_at } from './trap.js';
import { revive } from './zap.js';

/* SFCTOOL */
/* defined in shknam.c */
export function isbig(sroom) {
    let area = (sroom.hx - sroom.lx + 1) * (sroom.hy - sroom.ly + 1);
    return (area > 20);
}
/* make and stock a room of a given type */
export function do_mkroom(roomtype) {
    if (roomtype >= SHOPBASE) {
        /* someday, we should be able to specify shop type */
        mkshop();
    } else {
        switch (roomtype) {
            case COURT:
                mkzoo(COURT);
                break;
            case ZOO:
                mkzoo(ZOO);
                break;
            case BEEHIVE:
                mkzoo(BEEHIVE);
                break;
            case MORGUE:
                mkzoo(MORGUE);
                break;
            case BARRACKS:
                mkzoo(BARRACKS);
                break;
            case SWAMP:
                mkswamp();
                break;
            case TEMPLE:
                mktemple();
                break;
            case LEPREHALL:
                mkzoo(LEPREHALL);
                break;
            case COCKNEST:
                mkzoo(COCKNEST);
                break;
            case ANTHOLE:
                mkzoo(ANTHOLE);
                break;
            default:
                impossible("Tried to make a room of type %d.", roomtype);
        }
    }
}
export function mkshop() {
    let sroom = null;
    let i = 0;
    let ep = null;
    gottype: {
        i = -1;
        /* (init == lint suppression) */
        ep = null;
        if (game.flags.debug) {
            /* first determine shoptype */
            ep = nh_getenv("SHOPTYPE");
            if (ep) {
                if (ep == 122 || ep == 90) {
                    mkzoo(ZOO);
                    return;
                }
                if (ep == 109 || ep == 77) {
                    mkzoo(MORGUE);
                    return;
                }
                if (ep == 98 || ep == 66) {
                    mkzoo(BEEHIVE);
                    return;
                }
                if (ep == 116 || ep == 84 || ep == 92) {
                    mkzoo(COURT);
                    return;
                }
                if (ep == 115 || ep == 83) {
                    mkzoo(BARRACKS);
                    return;
                }
                if (ep == 97 || ep == 65) {
                    mkzoo(ANTHOLE);
                    return;
                }
                if (ep == 99 || ep == 67) {
                    mkzoo(COCKNEST);
                    return;
                }
                if (ep == 108 || ep == 76) {
                    mkzoo(LEPREHALL);
                    return;
                }
                if (ep == 95) {
                    mktemple();
                    return;
                }
                if (ep == 125) {
                    mkswamp();
                    return;
                }
                for (i = 0; shtypes[i].name; i++) {
                    if (ep == def_oc_syms[shtypes[i].symb].sym) {
                        break gottype;
                    }
                }
                if (ep == 103 || ep == 71) {
                    i = 0;
                } else if (ep == 118 || ep == 86) {
                    i = FODDERSHOP - SHOPBASE;
                } else {
                    i = -1;
                }
            }
        }
    }
    for (let __nhi_sroom = 0; (sroom = game.rooms[__nhi_sroom]); __nhi_sroom++) {
        /* return from this loop: cannot find any eligible room to be a shop
         * continue: sroom is ineligible
         * break: sroom is eligible
         */
        if (sroom.hx < 0) {
            return;
        }
        if (game.rooms.indexOf(sroom) >= game.nroom) {
            impossible("rooms[] not closed by -1?");
            return;
        }
        if (sroom.rtype != OROOM) {
            continue;
        }
        if (has_dnstairs(sroom) || has_upstairs(sroom)) {
            continue;
        }
        if (sroom.doorct == 1 || (game.flags.debug && ep && sroom.doorct != 0)) {
            if (invalid_shop_shape(sroom)) {
                continue;
            } else {
                break;
            }
        }
    }
    if (!sroom.rlit) {
        let x = 0;
        let y = 0;
        for (x = sroom.lx - 1; x <= sroom.hx + 1; x++) {
            for (y = sroom.ly - 1; y <= sroom.hy + 1; y++) {
                game.level.locations[x][y].lit = 1;
            }
        }
        sroom.rlit = 1;
    }
    if (i < 0) {
        /* shoptype not yet determined */
        let j = 0;
        /* pick a shop type at random */
        for (j = rnd(100) , i = 0; (j -= shtypes[i].prob) > 0; i++) {
            continue;
        }
        /* big rooms cannot be wand or book shops,
         * - so make them general stores
         */
        if (isbig(sroom) && (shtypes[i].symb == WAND_CLASS || shtypes[i].symb == SPBOOK_CLASS)) {
            i = 0;
        }
    }
    sroom.rtype = SHOPBASE + i;
    /* set room bits before stocking the shop */
    /* doesn't matter - this is a special room */
    topologize(sroom);
    /* The shop used to be stocked here, but this no longer happens--all we do
       is set its rtype, and it gets stocked at the end of makelevel() along
       with other special rooms. */
    sroom.needfill = 1;
}
/* pick an unused room, preferably with only one door */
export function pick_room(strict) {
    let sroom = null;
    let i = game.nroom;
    for (let __nhi_sroom = rn2(game.nroom); (sroom = game.rooms[__nhi_sroom]) && (i--); __nhi_sroom++) {
        if (sroom == game.rooms[game.nroom]) {
            sroom = game.rooms[0];
        }
        if (sroom.hx < 0) {
            return null;
        }
        if (sroom.rtype != OROOM) {
            continue;
        }
        if (!strict) {
            if (has_upstairs(sroom) || (has_dnstairs(sroom) && rn2(3))) {
                continue;
            }
        } else if (has_upstairs(sroom) || has_dnstairs(sroom)) {
            continue;
        }
        if (sroom.doorct == 1 || !rn2(5) || game.flags.debug) {
            return sroom;
        }
    }
    return null;
}
export function mkzoo(type) {
    let sroom = null;
    if ((sroom = pick_room((0))) != null) {
        sroom.rtype = type;
        /* room does not get stocked at this time - it will get stocked at the
         * end of makelevel() */
        sroom.needfill = 1;
    }
}
export function mk_zoo_thronemon(x, y) {
    let i = rnd(level_difficulty());
    let pm = (i > 9) ? PM_OGRE_TYRANT : (i > 5) ? PM_ELVEN_MONARCH : (i > 2) ? PM_DWARF_RULER : PM_GNOME_RULER;
    let mon = makemon(game.mons[pm], x, y, 0);
    if (mon) {
        mon.msleeping = 1;
        mon.mpeaceful = 0;
        set_malign(mon);
        /* Give him a sceptre to pound in judgment */
        mongets(mon, MACE);
    }
}
export function fill_zoo(sroom) {
    let mon = null;
    let sx = 0;
    let sy = 0;
    let i = 0;
    let sh = 0;
    let goldlim = 0;
    let type = sroom.rtype;
    let tx = 0;
    let ty = 0;
    let rmno = (game.rooms.indexOf(sroom) + 3);
    let mm = { x: 0, y: 0 };
    /* Note: This doesn't check needfill; it assumes the caller has already
       done that. */
    sh = sroom.fdoor;
    switch (type) {
        case COURT: {
            /* throne_placed flag */
            let __throne_placed = (0);
            if (game.level.flags.is_maze_lev) {
                for (tx = sroom.lx; tx <= sroom.hx && !__throne_placed; tx++) {
                    for (ty = sroom.ly; ty <= sroom.hy; ty++) {
                        if (((game.level.locations[tx][ty].typ) == THRONE)) {
                            __throne_placed = (1);
                            break;
                        }
                    }
                }
            }
            if (!__throne_placed) {
                i = 100;
                do {
                    /* don't place throne on top of stairs */
                    /* center might not be valid, so put queen elsewhere */
                    somexyspace(sroom, mm);
                    tx = mm.x;
                    ty = mm.y;
                } while (occupied(tx, ty) && --i > 0);
            }
            break;
        }
        case BEEHIVE:
            tx = sroom.lx + Math.trunc((sroom.hx - sroom.lx + 1) / 2);
            ty = sroom.ly + Math.trunc((sroom.hy - sroom.ly + 1) / 2);
            if (sroom.irregular) {
                if (game.level.locations[tx][ty].roomno != rmno || game.level.locations[tx][ty].edge) {
                    somexyspace(sroom, mm);
                    tx = mm.x;
                    ty = mm.y;
                }
            }
            break;
        case ZOO:
        case LEPREHALL:
            goldlim = 500 * level_difficulty();
            break;
    }
    for (sx = sroom.lx; sx <= sroom.hx; sx++) {
        for (sy = sroom.ly; sy <= sroom.hy; sy++) {
            if (sroom.irregular) {
                if (game.level.locations[sx][sy].roomno != rmno || game.level.locations[sx][sy].edge || (sroom.doorct && (distmin(sx, sy, game.doors[sh].x, game.doors[sh].y) <= 1))) {
                    continue;
                }
            } else if (!((game.level.locations[sx][sy].typ) > DOOR) || (sroom.doorct && ((sx == sroom.lx && game.doors[sh].x == sx - 1) || (sx == sroom.hx && game.doors[sh].x == sx + 1) || (sy == sroom.ly && game.doors[sh].y == sy - 1) || (sy == sroom.hy && game.doors[sh].y == sy + 1)))) {
                continue;
            }
            /* don't place monster on explicitly placed throne */
            if (type == COURT && ((game.level.locations[sx][sy].typ) == THRONE)) {
                continue;
            }
            mon = makemon((type == COURT) ? courtmon() : (type == BARRACKS) ? squadmon() : (type == MORGUE) ? morguemon() : (type == BEEHIVE) ? (sx == tx && sy == ty ? game.mons[PM_QUEEN_BEE] : game.mons[PM_KILLER_BEE]) : (type == LEPREHALL) ? game.mons[PM_LEPRECHAUN] : (type == COCKNEST) ? game.mons[PM_COCKATRICE] : (type == ANTHOLE) ? antholemon() : null, sx, sy, 4096 | 8192);
            if (mon) {
                mon.msleeping = 1;
                if (type == COURT && mon.mpeaceful) {
                    mon.mpeaceful = 0;
                    set_malign(mon);
                }
            }
            switch (type) {
                case ZOO:
                case LEPREHALL:
                    if (sroom.doorct) {
                        let distval = dist2(sx, sy, game.doors[sh].x, game.doors[sh].y);
                        i = ((distval) * (distval));
                    } else {
                        i = goldlim;
                    }
                    if (i >= goldlim) {
                        i = 5 * level_difficulty();
                    }
                    goldlim -= i;
                    mkgold((rn2(i) + (10)), sx, sy);
                    break;
                case MORGUE:
                    if (!rn2(5)) {
                        mk_tt_object(CORPSE, sx, sy);
                    }
                    /* lots of treasure buried with dead */
                    if (!rn2(10)) {
                        mksobj_at((rn2(3)) ? LARGE_BOX : CHEST, sx, sy, (1), (0));
                    }
                    if (!rn2(5)) {
                        make_grave(sx, sy, null);
                    }
                    break;
                case BEEHIVE:
                    if (!rn2(3)) {
                        mksobj_at(LUMP_OF_ROYAL_JELLY, sx, sy, (1), (0));
                    }
                    break;
                case BARRACKS:
                    if (!rn2(20)) {
                        mksobj_at((rn2(3)) ? LARGE_BOX : CHEST, sx, sy, (1), (0));
                    }
                    break;
                case COCKNEST:
                    if (!rn2(3)) {
                        /* the payroll and some loot */
                        let sobj = mk_tt_object(STATUE, sx, sy);
                        if (sobj) {
                            for (i = rn2(5); i; i--) {
                                add_to_container(sobj, mkobj(RANDOM_CLASS, (0)));
                            }
                            sobj.owt = weight(sobj);
                        }
                    }
                    break;
                case ANTHOLE:
                    if (!rn2(3)) {
                        mkobj_at(FOOD_CLASS, sx, sy, (0));
                    }
                    break;
            }
        }
    }
    switch (type) {
        case COURT:
{
                let chest = null;
                let gold = null;
                game.level.locations[tx][ty].typ = THRONE;
                somexyspace(sroom, mm);
                gold = mksobj(GOLD_PIECE, (1), (0));
                gold.quan = (rn2(50 * level_difficulty()) + (10));
                gold.owt = weight(gold);
                chest = mksobj_at(CHEST, mm.x, mm.y, (1), (0));
                add_to_container(chest, gold);
                chest.owt = weight(chest);
                /* so it can be found later */
                chest.spe = 2;
                game.level.flags.has_court = 1;
                break;
            }
        case BARRACKS:
            game.level.flags.has_barracks = 1;
            break;
        case ZOO:
            game.level.flags.has_zoo = 1;
            break;
        case MORGUE:
            game.level.flags.has_morgue = 1;
            break;
        case SWAMP:
            game.level.flags.has_swamp = 1;
            break;
        case BEEHIVE:
            game.level.flags.has_beehive = 1;
            break;
    }
}
/* make a swarm of undead around mm */
export function mkundead(mm, revive_corpses, mm_flags) {
    let cnt = Math.trunc((level_difficulty() + 1) / 10) + rnd(5);
    let mdat = null;
    let otmp = null;
    let cc = { x: 0, y: 0 };
    while (cnt--) {
        mdat = morguemon();
        if (mdat && enexto(cc, mm.x, mm.y, mdat) && (!revive_corpses || !(otmp = sobj_at(CORPSE, cc.x, cc.y)) || !revive(otmp, (0)))) {
            makemon(mdat, cc.x, cc.y, mm_flags);
        }
    }
    /* reduced chance for undead corpse */
    game.level.flags.graveyard = (1);
}
export function morguemon() {
    let i = rn2(100);
    let hd = rn2(level_difficulty());
    if (hd > 10 && i < 10) {
        if (In_hell(game.u.uz) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
            return mkclass(S_DEMON, 0);
        } else {
            let ndemon_res = ndemon((-128));
            /* else do what? As is, it will drop to ghost/wraith/zombie */
            if (ndemon_res != NON_PM) {
                return game.mons[ndemon_res];
            }
        }
    }
    if (hd > 8 && i > 85) {
        return mkclass(S_VAMPIRE, 0);
    }
    return ((i < 20) ? game.mons[PM_GHOST] : (i < 40) ? game.mons[PM_WRAITH] : mkclass(S_ZOMBIE, 0));
}
export function antholemon() {
    let mtyp = 0;
    let indx = 0;
    let trycnt = 0;
    /* casts are for dealing with time_t */
    indx = (game.ubirthday % 3);
    indx += level_difficulty();
    do {
        switch ((indx + trycnt) % 3) {
            /* Same monsters within a level, different ones between levels */
            case 0:
                mtyp = PM_SOLDIER_ANT;
                break;
            case 1:
                mtyp = PM_FIRE_ANT;
                break;
            default:
                mtyp = PM_GIANT_ANT;
                break;
        }
    } while (++trycnt < 3 && (game.mvitals[mtyp].mvflags & (2 | 1)));
    return ((game.mvitals[mtyp].mvflags & (2 | 1)) ? null : game.mons[mtyp]);
}
/* Michiel Huisjes & Fred de Wilde */
export function mkswamp() {
    let sroom = null;
    let i = 0;
    let eelct = 0;
    let sx = 0;
    let sy = 0;
    let rmno = 0;
    for (i = 0; i < 5; i++) {
        /* turn up to 5 rooms swampy */
        sroom = game.rooms[rn2(game.nroom)];
        if (sroom.hx < 0 || sroom.rtype != OROOM || has_upstairs(sroom) || has_dnstairs(sroom)) {
            continue;
        }
        rmno = game.rooms.indexOf(sroom) + 3;
        sroom.rtype = SWAMP;
        for (sx = sroom.lx; sx <= sroom.hx; sx++) {
            for (sy = sroom.ly; sy <= sroom.hy; sy++) {
                if (!((game.level.locations[sx][sy].typ) >= ROOM) || game.level.locations[sx][sy].roomno != rmno) {
                    continue;
                }
                if (!(game.level.objects[sx][sy] != null) && !(game.level.monsters[sx][sy] != null) && !t_at(sx, sy) && !nexttodoor(sx, sy)) {
                    if ((sx + sy) % 2) {
                        del_engr_at(sx, sy);
                        game.level.locations[sx][sy].typ = POOL;
                        if (!eelct || !rn2(4)) {
                            /* mkclass() won't do, as we might get kraken */
                            makemon(rn2(5) ? game.mons[PM_GIANT_EEL] : rn2(2) ? game.mons[PM_PIRANHA] : game.mons[PM_ELECTRIC_EEL], sx, sy, 0);
                            eelct++;
                        }
                    } else if (!rn2(4)) {
                        makemon(mkclass(S_FUNGUS, 0), sx, sy, 0);
                    }
                }
            }
        }
        game.level.flags.has_swamp = 1;
    }
}
let __shrine_pos_buf = { x: 0, y: 0 };
export function shrine_pos(roomno) {
    let delta = 0;
    let troom = game.rooms[roomno - 3];
    /* if width and height are odd, placement will be the exact center;
       if either or both are even, center point is a hypothetical spot
       between map locations and placement will be adjacent to that */
    delta = troom.hx - troom.lx;
    __shrine_pos_buf.x = troom.lx + Math.trunc(delta / 2);
    if ((delta % 2) && rn2(2)) {
        __shrine_pos_buf.x++;
    }
    delta = troom.hy - troom.ly;
    __shrine_pos_buf.y = troom.ly + Math.trunc(delta / 2);
    if ((delta % 2) && rn2(2)) {
        __shrine_pos_buf.y++;
    }
    return __shrine_pos_buf;
}
export function mktemple() {
    let sroom = null;
    let shrine_spot = null;
    let lev = null;
    if (!(sroom = pick_room((1)))) {
        return;
    }
    /* set up Priest and shrine */
    sroom.rtype = TEMPLE;
    shrine_spot = shrine_pos((game.rooms.indexOf(sroom) + 3));
    lev = game.level.locations[shrine_spot.x][shrine_spot.y];
    lev.typ = ALTAR;
    lev.flags = induced_align(80);
    priestini(game.u.uz, sroom, shrine_spot.x, shrine_spot.y, (0));
    lev.flags |= 8;
    game.level.flags.has_temple = 1;
}
export function nexttodoor(sx, sy) {
    let dx = 0;
    let dy = 0;
    let lev = null;
    for (dx = -1; dx <= 1; dx++) {
        for (dy = -1; dy <= 1; dy++) {
            if (!isok(sx + dx, sy + dy)) {
                continue;
            }
            lev = game.level.locations[sx + dx][sy + dy];
            if (((lev.typ) == DOOR) || lev.typ == SDOOR) {
                /* shopkeeper standing just inside the door can only move
             * to one other square; this cannot be a shop. */
                return (1);
            }
        }
    }
    return (0);
}
export function has_dnstairs(sroom) {
    let stway = game.stairs;
    while (stway) {
        if (!stway.up && inside_room(sroom, stway.sx, stway.sy)) {
            return (1);
        }
        stway = stway.next;
    }
    return (0);
}
export function has_upstairs(sroom) {
    let stway = game.stairs;
    while (stway) {
        if (stway.up && inside_room(sroom, stway.sx, stway.sy)) {
            return (1);
        }
        stway = stway.next;
    }
    return (0);
}
export function somex(croom) {
    fnEnter("somex", "mkroom.c", 0);
    return (rn2(croom.hx - croom.lx + 1) + (croom.lx));
}
export function somey(croom) {
    fnEnter("somey", "mkroom.c", 0);
    return (rn2(croom.hy - croom.ly + 1) + (croom.ly));
}
export function inside_room(croom, x, y) {
    if (croom.irregular) {
        let i = (game.rooms.indexOf(croom) + 3);
        return (!game.level.locations[x][y].edge && game.level.locations[x][y].roomno == i);
    }
    return (x >= croom.lx - 1 && x <= croom.hx + 1 && y >= croom.ly - 1 && y <= croom.hy + 1);
}
/* return a coord c inside mkroom croom, but not in a subroom.
   returns TRUE if any such space found.
   can return a non-accessible location, eg. inside a wall
   if a themed room is not irregular, but has some non-room terrain */
export function somexy(croom, c) {
    fnEnter("somexy", "mkroom.c", 0);
    let try_cnt = 0;
    let i = 0;
    if (croom.irregular) {
        i = (game.rooms.indexOf(croom) + 3);
        while (try_cnt++ < 100) {
            /* Check that coords doesn't fall into a subroom or into a wall */
            c.x = somex(croom);
            c.y = somey(croom);
            if (!game.level.locations[c.x][c.y].edge && game.level.locations[c.x][c.y].roomno == i) {
                return (1);
            }
        }
        /* try harder; exhaustively search until one is found */
        for (c.x = croom.lx; c.x <= croom.hx; c.x++) {
            for (c.y = croom.ly; c.y <= croom.hy; c.y++) {
                if (!game.level.locations[c.x][c.y].edge && game.level.locations[c.x][c.y].roomno == i) {
                    return (1);
                }
            }
        }
        return (0);
    }
    if (!croom.nsubrooms) {
        c.x = somex(croom);
        c.y = somey(croom);
        return (1);
    }
    while (try_cnt++ < 100) {
        you_lose: {
            c.x = somex(croom);
            c.y = somey(croom);
            if (((game.level.locations[c.x][c.y].typ) && (game.level.locations[c.x][c.y].typ) <= DBWALL)) {
                continue;
            }
            for (i = 0; i < croom.nsubrooms; i++) {
                if (inside_room(croom.sbrooms[i], c.x, c.y)) {
                    break you_lose;
                }
            }
            break;
        }
    }
    if (try_cnt >= 100) {
        return (0);
    }
    return (1);
}
/* like somexy(), but returns an accessible location */
export function somexyspace(croom, c) {
    fnEnter("somexyspace", "mkroom.c", 0);
    let trycnt = 0;
    let okay = 0;
    do {
        okay = somexy(croom, c) && isok(c.x, c.y) && !occupied(c.x, c.y) && (game.level.locations[c.x][c.y].typ == ROOM || game.level.locations[c.x][c.y].typ == CORR || game.level.locations[c.x][c.y].typ == ICE);
    } while (trycnt++ < 100 && !okay);
    return okay;
}
/*
 * Search for a special room given its type (zoo, court, etc...)
 *      Special values :
 *              - ANY_SHOP
 *              - ANY_TYPE
 */
export function search_special(type) {
    fnEnter("search_special", "mkroom.c", 0);
    let croom = null;
    for (let __nhi_croom = 0; (croom = game.rooms[__nhi_croom]) && (croom.hx >= 0); __nhi_croom++) {
        if ((type == (-1) && croom.rtype != OROOM) || (type == (-2) && croom.rtype >= SHOPBASE) || croom.rtype == type) {
            return croom;
        }
    }
    for (let __nhi_croom = 0; (croom = game.subrooms[__nhi_croom]) && (croom.hx >= 0); __nhi_croom++) {
        if ((type == (-1) && croom.rtype != OROOM) || (type == (-2) && croom.rtype >= SHOPBASE) || croom.rtype == type) {
            return croom;
        }
    }
    return null;
}
export function courtmon() {
    let i = rn2(60) + rn2(3 * level_difficulty());
    if (i > 100) {
        return mkclass(S_DRAGON, 0);
    } else if (i > 95) {
        return mkclass(S_GIANT, 0);
    } else if (i > 85) {
        return mkclass(S_TROLL, 0);
    } else if (i > 75) {
        return mkclass(S_CENTAUR, 0);
    } else if (i > 60) {
        return mkclass(S_ORC, 0);
    } else if (i > 45) {
        return game.mons[PM_BUGBEAR];
    } else if (i > 30) {
        return game.mons[PM_HOBGOBLIN];
    } else if (i > 15) {
        return mkclass(S_GNOME, 0);
    } else {
        return mkclass(S_KOBOLD, 0);
    }
}
const squadprob = [{ pm: PM_SOLDIER, prob: 80 }, { pm: PM_SERGEANT, prob: 15 }, { pm: PM_LIEUTENANT, prob: 4 }, { pm: PM_CAPTAIN, prob: 1 }];
/* return soldier types. */
export function squadmon() {
    let sel_prob = 0;
    let i = 0;
    let cpro = 0;
    let mndx = 0;
    gotone: {
        sel_prob = rnd(80 + level_difficulty());
        cpro = 0;
        for (i = 0; i < (Math.trunc(4 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkroom.c:807:14) [4]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkroom.c:807:14)) */)); i++) {
            cpro += squadprob[i].prob;
            if (cpro > sel_prob) {
                mndx = squadprob[i].pm;
                break gotone;
            }
        }
        mndx = squadprob[rn2((Math.trunc(4 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkroom.c:807:14) [4]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mkroom.c:807:14)) */)))].pm;
    }
    if (!(game.mvitals[mndx].mvflags & (2 | 1))) {
        return game.mons[mndx];
    } else {
        return null;
    }
}
/*
 * save_room : A recursive function that saves a room and its subrooms
 * (if any).
 */
export function save_room(nhfp, r) {
    let i = 0;
    sfo_mkroom(nhfp, r, "room-mkroom");
    for (i = 0; i < r.nsubrooms; i++) {
        /*
     * Well, I really should write only useful information instead
     * of writing the whole structure. That is I should not write
     * the gs.subrooms pointers, but who cares ?
     */
        save_room(nhfp, r.sbrooms[i]);
    }
}
/*
 * save_rooms : Save all the rooms on disk!
 */
export function save_rooms(nhfp) {
    let i = 0;
    sfo_int(nhfp, { get value() { return game.nroom; }, set value(_v) { game.nroom = _v; } }, "room-nroom");
    /* First, write the number of rooms */
    for (i = 0; i < game.nroom; i++) {
        save_room(nhfp, game.rooms[i]);
    }
}
/* !SFCTOOL */
export function rest_room(nhfp, r) {
    let i = 0;
    sfi_mkroom(nhfp, r, "room-mkroom");
    for (i = 0; i < r.nsubrooms; i++) {
        r.sbrooms[i] = game.subrooms[game.nsubroom];
        rest_room(nhfp, game.subrooms[game.nsubroom]);
        game.subrooms[game.nsubroom++].resident = null;
    }
}
/*
 * rest_rooms : That's for restoring rooms. Read the rooms structure from
 * the disk.
 */
export function rest_rooms(nhfp) {
    let i = 0;
    sfi_int(nhfp, { get value() { return game.nroom; }, set value(_v) { game.nroom = _v; } }, "room-nroom");
    ;
    game.nsubroom = 0;
    for (i = 0; i < game.nroom; i++) {
        rest_room(nhfp, game.rooms[i]);
        game.rooms[i].resident = null;
    }
    game.rooms[game.nroom].hx = -1;
    game.subrooms[game.nsubroom].hx = -1;
}
/* convert a display symbol for terrain into topology type;
   used for remembered terrain when mimics pose as furniture */
export function cmap_to_type(sym) {
    let typ = STONE;
    switch (sym) {
        case S_stone:
            typ = STONE;
            break;
        case S_vwall:
            typ = VWALL;
            break;
        case S_hwall:
            typ = HWALL;
            break;
        case S_tlcorn:
            typ = TLCORNER;
            break;
        case S_trcorn:
            typ = TRCORNER;
            break;
        case S_blcorn:
            typ = BLCORNER;
            break;
        case S_brcorn:
            typ = BRCORNER;
            break;
        case S_crwall:
            typ = CROSSWALL;
            break;
        case S_tuwall:
            typ = TUWALL;
            break;
        case S_tdwall:
            typ = TDWALL;
            break;
        case S_tlwall:
            typ = TLWALL;
            break;
        case S_trwall:
            typ = TRWALL;
            break;
        case S_ndoor:
        case S_vodoor:
        case S_hodoor:
        case S_vcdoor:
        case S_hcdoor:
            typ = DOOR;
            break;
        case S_bars:
            typ = IRONBARS;
            break;
        case S_tree:
            typ = TREE;
            break;
        case S_room:
        case S_darkroom:
            typ = ROOM;
            break;
        case S_corr:
        case S_litcorr:
            typ = CORR;
            break;
        case S_upstair:
        case S_dnstair:
            typ = STAIRS;
            break;
        case S_upladder:
        case S_dnladder:
            typ = LADDER;
            break;
        case S_altar:
            typ = ALTAR;
            break;
        case S_grave:
            typ = GRAVE;
            break;
        case S_throne:
            typ = THRONE;
            break;
        case S_sink:
            typ = SINK;
            break;
        case S_fountain:
            typ = FOUNTAIN;
            break;
        case S_pool:
            typ = POOL;
            break;
        case S_ice:
            typ = ICE;
            break;
        case S_lava:
            typ = LAVAPOOL;
            break;
        /* open drawbridge spanning north/south */
        case S_vodbridge:
        case S_hodbridge:
            typ = DRAWBRIDGE_DOWN;
            break;
        /* closed drawbridge in vertical wall */
        case S_vcdbridge:
        case S_hcdbridge:
            typ = DBWALL;
            break;
        case S_air:
            typ = AIR;
            break;
        case S_cloud:
            typ = CLOUD;
            break;
        case S_water:
            typ = WATER;
            break;
        case S_lavawall:
            typ = LAVAWALL;
            break;
        default:
            break;
    }
    return typ;
}
/* With the introduction of themed rooms, there are certain room shapes that
 * may generate a door, the square just inside the door, and only one other
 * ROOM square touching that one. E.g.
 *   ---
 * ---..
 * +....
 * ---..
 *   ---
 * This means that if the room becomes a shop, the shopkeeper will move
 * between those two squares nearest the door without ever allowing the
 * player to get past them.
 * Before approving sroom as a shop, check for this circumstance, and if it
 * exists, don't consider it as valid for a shop.
 *
 * Note that the invalidity of the shape derives from the position of its door
 * already being chosen. It's quite possible that if the door were somewhere
 * else on the perimeter of this room, it would work fine as a shop.*/
export function invalid_shop_shape(sroom) {
    let x = 0;
    let y = 0;
    let doorx = game.doors[sroom.fdoor].x;
    let doory = game.doors[sroom.fdoor].y;
    let insidex = 0;
    let insidey = 0;
    let insidect = 0;
    for (x = ((doorx - 1) > (sroom.lx) ? (doorx - 1) : (sroom.lx)); x <= ((doorx + 1) < (sroom.hx) ? (doorx + 1) : (sroom.hx)); x++) {
        for (y = ((doory - 1) > (sroom.ly) ? (doory - 1) : (sroom.ly)); y <= ((doory + 1) < (sroom.hy) ? (doory + 1) : (sroom.hy)); y++) {
            if (game.level.locations[x][y].typ == ROOM) {
                /* First, identify squares inside the room and next to the door. */
                insidex = x;
                insidey = y;
                insidect++;
            }
        }
    }
    if (insidect < 1) {
        impossible("invalid_shop_shape: no squares inside door?");
        return (1);
    }
    if (insidect == 1) {
        /* if insidect > 1, then the shopkeeper already has alternate
     * squares to move to so we don't need to check further. */
        /* But if it is 1, scan all adjacent squares for other squares
         * that are part of this room. */
        insidect = 0;
        for (x = ((insidex - 1) > (sroom.lx) ? (insidex - 1) : (sroom.lx)); x <= ((insidex + 1) < (sroom.hx) ? (insidex + 1) : (sroom.hx)); x++) {
            for (y = ((insidey - 1) > (sroom.ly) ? (insidey - 1) : (sroom.ly)); y <= ((insidey + 1) < (sroom.hy) ? (insidey + 1) : (sroom.hy)); y++) {
                if (x == insidex && y == insidey) {
                    continue;
                }
                if (game.level.locations[x][y].typ == ROOM) {
                    insidect++;
                }
            }
        }
        if (insidect == 1) {
            return (1);
        }
    }
    return (0);
}
/* !SFCTOOL */
/*mkroom.c*/
/* try again if chosen type has been genocided or used up */
/*
     * In temples, shrines are blessed altars
     * located in the center of the room
     */
/* open door in vertical wall */
/* open door in horizontal wall */
/* closed door in vertical wall */
