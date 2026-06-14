import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	mklev.c	$NHDT-Date: 1737387068 2025/01/20 07:31:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.194 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Alex Smith, 2017. */
/* NetHack may be freely redistributed.  See license for details. */
/* for UNIX, Rand #def'd to (long)lrand48() or (long)random() */
/* croom->lx etc are schar (width <= int), so % arith ensures that */
/* conversion of result to int is reasonable */
import { game } from '../gstate.js';
import { lua_gc, lua_getglobal, lua_pushstring, lua_settop, nhl_done, nhl_init, nhl_loadlua, nhl_pcall_handle } from '../c2js-runtime/lua.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free, memcpy, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, pline, pline_The } from '../c2js-runtime/pline.js';
import { qsort , qsort_async } from '../c2js-runtime/qsort.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat } from '../c2js-runtime/string.js';
import { getbones } from './bones.js';
import { isok } from './cmd.js';
import { is_lava, is_pool, is_pool_or_lava } from './dbridge.js';
import { nhcb_name, xdir, ydir } from './decl.js';
import { buried_ball_to_punishment } from './dig.js';
import { back_to_glyph, flush_screen, newsym, set_wall_state } from './display.js';
import { breaktest } from './dothrow.js';
import { defsyms } from './drawing.js';
import { Can_fall_thru, In_V_tower, In_hell, In_mines, In_quest, Is_botlevel, Is_branchlev, Is_special, assign_level, at_dgn_entrance, depth, dungeon_branch, dunlev, dunlevs_in_dungeon, find_level, free_exclusions, init_dungeons, init_mapseen, insert_branch, level_difficulty, on_level, single_level_branch } from './dungeon.js';
import { make_engr_at, make_grave, random_engraving, wipe_engr_at } from './engrave.js';
import { makerogueghost, makeroguerooms } from './extralev.js';
import { glyph_to_cmap } from './glyphs.js';
import { in_rooms, invocation_pos } from './hack.js';
import { sobj_at } from './invent.js';
import { makemon, mkclass, set_mimic_sym } from './makemon.js';
import { bound_digging, makemaz, mazexy, mkportal, set_levltyp, wallification } from './mkmaze.js';
import { add_to_buried, add_to_container, curse, dealloc_obj, mkcorpstat, mkgold, mkobj, mkobj_at, mksobj, mksobj_at, obj_extract_self, place_object, weight } from './mkobj.js';
import { antholemon, do_mkroom, has_dnstairs, has_upstairs, inside_room, somex, somexyspace, somey } from './mkroom.js';
import { minliquid, seemimic } from './mon.js';
import { ALTAR, ANTHOLE, ARMOR_CLASS, ARROW, ARROW_TRAP, BARRACKS, BEAR_TRAP, BEEHIVE, BELL, BLCORNER, BOULDER, BRCORNER, CHEST, COCKNEST, CORPSE, CORR, COURT, CRAM_RATION, DART, DART_TRAP, DBWALL, DIR_E, DIR_N, DIR_S, DIR_W, DOOR, DRAWBRIDGE_UP, FIRE_TRAP, FOOD_CLASS, FOOD_RATION, FOUNTAIN, GEM_CLASS, GLYPH_UNEXPLORED_OFF, GOLD_PIECE, HOLE, HWALL, ICE, IRONBARS, KELP_FROND, LANDMINE, LARGE_BOX, LEMBAS_WAFER, LEPREHALL, LEVEL_TELEP, MAGIC_PORTAL, MAGIC_TRAP, MOAT, MORGUE, NHCB_LVL_ENTER, NHLpa_impossible, NHLpa_panic, NO_TRAP, N_DIRS_Z, OROOM, PIT, PM_ARCHEOLOGIST, PM_COCKATRICE, PM_DWARF, PM_ELF, PM_GIANT_MIMIC, PM_GIANT_SPIDER, PM_GNOME, PM_HUMAN, PM_KILLER_BEE, PM_LARGE_MIMIC, PM_LEPRECHAUN, PM_ORC, PM_SMALL_MIMIC, PM_SOLDIER, PM_WIZARD, POLY_TRAP, POOL, POTION_CLASS, POT_EXTRA_HEALING, POT_GAIN_ENERGY, POT_HEALING, POT_SPEED, RANDOM_CLASS, RING_CLASS, ROCK, ROCKTRAP, ROLLING_BOULDER_TRAP, ROOM, RUST_TRAP, SCORR, SCROLL_CLASS, SCR_CONFUSE_MONSTER, SCR_ENCHANT_ARMOR, SCR_ENCHANT_WEAPON, SCR_SCARE_MONSTER, SCR_TELEPORTATION, SDOOR, SHOPBASE, SINK, SLP_GAS_TRAP, SPBOOK_CLASS, SPE_HEALING, SPIKED_PIT, SQKY_BOARD, STAIRS, STATUE, STATUE_TRAP, STONE, SWAMP, S_HUMAN, S_MIMIC, TALLOW_CANDLE, TELEP_TRAP, TEMPLE, THEMEROOM, TLCORNER, TOOL_CLASS, TRAPDOOR, TRAPNUM, TRAPPED_CHEST, TRAPPED_DOOR, TRCORNER, TREE, TT_BURIEDBALL, VAULT, VIBRATING_SQUARE, VWALL, WAN_DIGGING, WATER, WAX_CANDLE, WEAPON_CLASS, WEB, ZOO, most_themes, tut_themes } from './nh-constants.js';
import { oinit } from './o_init.js';
import { nh_getenv } from './options.js';
import { init_rect, rnd_rect } from './rect.js';
import { clear_regions } from './region.js';
import { reseed_random, rn2, rn2_on_display_rng, rnd } from './rnd.js';
import { obfree } from './shk.js';
import { check_room, create_des_coder, create_room, dig_corridor, fill_special_room, reset_xystart_size } from './sp_lev.js';
import { stairway_add, stairway_free_all } from './stairs.js';
import { begin_burn } from './timeout.js';
import { deltrap, maketrap, mintrap, reset_utrap, t_at } from './trap.js';
import { does_block, unblock_point } from './vision.js';
import { fracture_rock } from './zap.js';

/* Args must be (const genericptr) so that qsort will always be happy. */
export function mkroom_cmp(vx, vy) {
    let x = null;
    let y = null;
    x = vx;
    y = vy;
    if (x.lx < y.lx) {
        return -1;
    }
    return (x.lx > y.lx);
}
/* is x,y a good location for a door into room? */
export function good_rm_wall_doorpos(x, y, dir, room) {
    let tx = 0;
    let ty = 0;
    let rmno = 0;
    if (!isok(x, y) || !room.needjoining) {
        return (0);
    }
    if (!(game.level.locations[x][y].typ == HWALL || game.level.locations[x][y].typ == VWALL || ((game.level.locations[x][y].typ) == DOOR) || game.level.locations[x][y].typ == SDOOR)) {
        return (0);
    }
    if (bydoor(x, y)) {
        return (0);
    }
    tx = x + xdir[dir];
    ty = y + ydir[dir];
    if (!isok(tx, ty) || ((game.level.locations[tx][ty].typ) < POOL)) {
        return (0);
    }
    rmno = (game.rooms.indexOf(room)) + 3;
    if (rmno != game.level.locations[tx][ty].roomno) {
        return (0);
    }
    return (1);
}
/* starting from x,y going towards dir, find a good location for a door */
export function finddpos_shift(x, y, dir, aroom) {
    let dx = 0;
    let dy = 0;
    dir = (((dir) + 4) % (N_DIRS_Z - 2));
    dx = xdir[dir];
    dy = ydir[dir];
    if (good_rm_wall_doorpos(x.value, y.value, dir, aroom)) {
        return (1);
    }
    if (aroom.irregular) {
        /* irregular rooms may have the room wall away from the room rectangular
       area; go into the area until we encounter something */
        let rx = x.value;
        let ry = y.value;
        let fail = (0);
        while (!fail && isok(rx, ry) && (game.level.locations[rx][ry].typ == STONE || game.level.locations[rx][ry].typ == CORR)) {
            rx += dx;
            ry += dy;
            if (good_rm_wall_doorpos(rx, ry, dir, aroom)) {
                x.value = rx;
                y.value = ry;
                return (1);
            }
            if (!(game.level.locations[rx][ry].typ == STONE || game.level.locations[rx][ry].typ == CORR)) {
                fail = (1);
            }
            if (rx < aroom.lx || rx > aroom.hx || ry < aroom.ly || ry > aroom.hy) {
                fail = (1);
            }
        }
    }
    return (0);
}
/* find a valid door position at room edge.
   dir is the preferred edge of the room.
   if found, returns TRUE and the coordinate in cc */
export async function finddpos(cc, dir, aroom) {
    let x = 0;
    let y = 0;
    let x1 = 0;
    let y1 = 0;
    let x2 = 0;
    let y2 = 0;
    let tryct = 0;
    gotit: {
        tryct = 0;
        switch (dir) {
            case DIR_N:
                x1 = aroom.lx;
                x2 = aroom.hx;
                y1 = aroom.ly - 1;
                y2 = aroom.ly - 1;
                /* don't adjust the quantity; maybe the trap shot multiple
           times, there was an untrapping attempt, etc... */
                break;
            case DIR_S:
                x1 = aroom.lx;
                x2 = aroom.hx;
                y1 = aroom.hy + 1;
                y2 = aroom.hy + 1;
                break;
            case DIR_W:
                x1 = aroom.lx - 1;
                x2 = aroom.lx - 1;
                y1 = aroom.ly;
                y2 = aroom.hy;
                break;
            case DIR_E:
                x1 = aroom.hx + 1;
                x2 = aroom.hx + 1;
                y1 = aroom.ly;
                y2 = aroom.hy;
                break;
            default:
                await impossible("finddpos: illegal dir");
                return (0);
        }
        do {
            x = (x2 - x1) ? (rn2(x2 - x1 + 1) + (x1)) : x1;
            y = (y2 - y1) ? (rn2(y2 - y1 + 1) + (y1)) : y1;
            if (finddpos_shift({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, dir, aroom)) {
                break gotit;
            }
        } while (++tryct < 20);
        for (x = x1; x <= x2; x++) {
            for (y = y1; y <= y2; y++) {
                if (finddpos_shift({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, dir, aroom)) {
                    break gotit;
                }
            }
        }
        /* cannot find something reasonable -- strange */
        cc.x = x1;
        cc.y = y1;
        return (0);
    }
    cc.x = x;
    cc.y = y;
    return (1);
}
/* Sort rooms on the level so they're ordered from left to right on the map.
   makecorridors() by default links rooms N and N+1 */
export async function sort_rooms() {
    let x = 0;
    let y = 0;
    let i = 0;
    let ri = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let n = game.nroom;
    await qsort_async(game.rooms, n, 1 /* sizeof(struct mkroom) */, mkroom_cmp);
    /* Update the roomnos on the map */
    for (i = 0; i < n; i++) {
        ri[game.rooms[i].roomnoidx] = i;
    }
    for (x = 1; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            let rno = game.level.locations[x][y].roomno;
            if (rno >= 3 && rno < 40 + 1) {
                game.level.locations[x][y].roomno = ri[rno - 3] + 3;
            }
        }
    }
}
export async function do_room_or_subroom(croom, lowx, lowy, hix, hiy, lit, rtype, special, is_room) {
    let x = 0;
    let y = 0;
    let lev = null;
    /* locations might bump level edges in wall-less rooms */
    /* add/subtract 1 to allow for edge locations */
    if (!lowx) {
        lowx++;
    }
    if (!lowy) {
        lowy++;
    }
    if (hix >= 80 - 1) {
        hix = 80 - 2;
    }
    if (hiy >= 21 - 1) {
        hiy = 21 - 2;
    }
    if (lit) {
        for (x = lowx - 1; x <= hix + 1; x++) {
            for (y = lowy - 1; y <= hiy + 1; y++) {
                game.level.locations[x][y >= 0 ? y : 0].lit = 1;
            }
        }
        croom.rlit = 1;
    } else {
        croom.rlit = 0;
    }
    croom.roomnoidx = (game.rooms.indexOf(croom));
    croom.lx = lowx;
    croom.hx = hix;
    croom.ly = lowy;
    croom.hy = hiy;
    croom.rtype = rtype;
    croom.doorct = 0;
    /* if we're not making a vault, gd.doorindex will still be 0
     * if we are, we'll have problems adding niches to the previous room
     * unless fdoor is at least gd.doorindex
     */
    croom.fdoor = game.doorindex;
    croom.irregular = (0);
    croom.nsubrooms = 0;
    croom.sbrooms[0] = null;
    if (!special) {
        croom.needjoining = (1);
        for (x = lowx - 1; x <= hix + 1; x++) {
            for (y = lowy - 1; y <= hiy + 1; y += (hiy - lowy + 2)) {
                game.level.locations[x][y].typ = HWALL;
                game.level.locations[x][y].horizontal = 1;
            }
        }
        for (x = lowx - 1; x <= hix + 1; x += (hix - lowx + 2)) {
            for (y = lowy; y <= hiy; y++) {
                game.level.locations[x][y].typ = VWALL;
                game.level.locations[x][y].horizontal = 0;
            }
        }
        for (x = lowx; x <= hix; x++) {
            for (y = lowy; y <= hiy; y++) {
                game.level.locations[x][y].typ = ROOM;
            }
        }
        if (is_room) {
            game.level.locations[lowx - 1][lowy - 1].typ = TLCORNER;
            game.level.locations[hix + 1][lowy - 1].typ = TRCORNER;
            game.level.locations[lowx - 1][hiy + 1].typ = BLCORNER;
            game.level.locations[hix + 1][hiy + 1].typ = BRCORNER;
        } else {
            await wallification(lowx - 1, lowy - 1, hix + 1, hiy + 1);
        }
    }
}
export async function add_room(lowx, lowy, hix, hiy, lit, rtype, special) {
    fnEnter("add_room", "mklev.c", 0);
    /* generate_stairs_find_room() returns Null if nroom == 0, but that
       should never happen for a rooms+corridors style level */
    let croom = null;
    if (game.nroom >= 40) {
        await panic("level has too many rooms");
    }
    croom = game.rooms[game.nroom];
    await do_room_or_subroom(croom, lowx, lowy, hix, hiy, lit, rtype, special, (1));
    if (game.rooms[game.nroom + 1]) game.rooms[game.nroom + 1].hx = -1;
    game.nroom++;
}
export async function add_subroom(proom, lowx, lowy, hix, hiy, lit, rtype, special) {
    fnEnter("add_subroom", "mklev.c", 0);
    let croom = null;
    if (game.nsubroom >= 40) {
        await panic("level has too many subrooms");
    }
    if (proom.nsubrooms >= 24) {
        await panic("room has too many subrooms");
    }
    croom = game.subrooms[game.nsubroom];
    await do_room_or_subroom(croom, lowx, lowy, hix, hiy, lit, rtype, special, (0));
    proom.sbrooms[proom.nsubrooms++] = croom;
    if (game.subrooms[game.nsubroom + 1]) game.subrooms[game.nsubroom + 1].hx = -1;
    game.nsubroom++;
}
export function free_luathemes(theme_group) {
    let i = 0;
    for (i = 0; i < game.n_dgns; ++i) {
        /*
     * Release which group(s)?
     *  tut_themes  => leaving tutorial, free tutorial themes only;
     *  most_themes => entering endgame, free non-endgame themes;
     *  all_themes  => end of game, free all themes.
     */
        if ((theme_group == tut_themes && i != (game.dungeon_topology.d_tutorial_dnum)) || (theme_group == most_themes && i == (game.dungeon_topology.d_astral_level).dnum)) {
            continue;
        }
        if (game.luathemes[i]) {
            nhl_done(game.luathemes[i]);
            game.luathemes[i] = null;
        }
    }
}
export async function makerooms() {
    let tried_vault = (0);
    let themeroom_tries = 0;
    let fname = null;
    let sbi = { flags: 2147483648, memlimit: 1 * 1024 * 1024, steps: 0, perpcall: 1 * 1024 * 1024 };
    let themes = game.luathemes[game.u.uz.dnum];
    if (!themes && (fname = game.dungeons[game.u.uz.dnum].themerms)) {
        if ((themes = await nhl_init(sbi)) != null) {
            if (!await nhl_loadlua(themes, fname)) {
                /* loading lua failed, don't use themed rooms */
                nhl_done(themes);
                themes = null;
            } else {
                /* success; save state for this dungeon branch */
                game.luathemes[game.u.uz.dnum] = themes;
                /* keep themes context, so not 'nhl_done(themes);' */
                /* can affect error messages */
                game.iflags.in_lua = (0);
            }
        }
        if (!themes) {
            game.dungeons[game.u.uz.dnum].themerms = '';
        }
    }
    if (themes) {
        /* svd.dungeons[u.uz.dnum].themerms */
        create_des_coder();
        game.iflags.in_lua = game.in_mk_themerooms = (1);
        game.themeroom_failed = (0);
        lua_getglobal(themes, "pre_themerooms_generate");
        await nhl_pcall_handle(themes, 0, 0, "makerooms-1", NHLpa_impossible);
        game.iflags.in_lua = game.in_mk_themerooms = (0);
    }
    while (game.nroom < (40 - 1) && rnd_rect()) {
        if (game.nroom >= (Math.trunc(40 / 6)) && rn2(2) && !tried_vault) {
            /* make rooms until satisfied */
            /* rnd_rect() will returns 0 if no more rects are available... */
            tried_vault = (1);
            if (await create_room(-1, -1, 2, 2, -1, -1, VAULT, (1))) {
                game.vault_x = game.rooms[game.nroom].lx;
                game.vault_y = game.rooms[game.nroom].ly;
                game.rooms[game.nroom].hx = -1;
            }
        } else {
            if (themes) {
                game.iflags.in_lua = game.in_mk_themerooms = (1);
                game.themeroom_failed = (0);
                lua_getglobal(themes, "themerooms_generate");
                await nhl_pcall_handle(themes, 0, 0, "makerooms-2", NHLpa_panic);
                game.iflags.in_lua = game.in_mk_themerooms = (0);
                if (game.themeroom_failed && ((themeroom_tries++ > 10) || (game.nroom >= (Math.trunc(40 / 6))))) {
                    break;
                }
            } else {
                if (!await create_room(-1, -1, -1, -1, -1, -1, OROOM, -1)) {
                    break;
                }
                ;
            }
        }
    }
    if (themes) {
        reset_xystart_size();
        game.iflags.in_lua = game.in_mk_themerooms = (1);
        game.themeroom_failed = (0);
        lua_getglobal(themes, "post_themerooms_generate");
        await nhl_pcall_handle(themes, 0, 0, "makerooms-3", NHLpa_panic);
        game.iflags.in_lua = game.in_mk_themerooms = (0);
    }
}
export async function join(a, b, nxcor) {
    let cc = { x: 0, y: 0 };
    let tt = { x: 0, y: 0 };
    let org = { x: 0, y: 0 };
    let dest = { x: 0, y: 0 };
    let tx = 0;
    let ty = 0;
    let xx = 0;
    let yy = 0;
    let croom = null;
    let troom = null;
    let dx = 0;
    let dy = 0;
    let npoints = 0;
    let dig_result = 0;
    croom = game.rooms[a];
    troom = game.rooms[b];
    if (!croom.needjoining || !troom.needjoining) {
        return;
    }
    /* find positions cc and tt for doors in croom and troom
       and direction for a corridor between them */
    if (troom.hx < 0 || croom.hx < 0) {
        return;
    }
    if (troom.lx > croom.hx) {
        dx = 1;
        dy = 0;
        if (!await finddpos(cc, DIR_E, croom)) {
            return;
        }
        if (!await finddpos(tt, DIR_W, troom)) {
            return;
        }
    } else if (troom.hy < croom.ly) {
        dy = -1;
        dx = 0;
        if (!await finddpos(cc, DIR_N, croom)) {
            return;
        }
        if (!await finddpos(tt, DIR_S, troom)) {
            return;
        }
    } else if (troom.hx < croom.lx) {
        dx = -1;
        dy = 0;
        if (!await finddpos(cc, DIR_W, croom)) {
            return;
        }
        if (!await finddpos(tt, DIR_E, troom)) {
            return;
        }
    } else {
        dy = 1;
        dx = 0;
        if (!await finddpos(cc, DIR_S, croom)) {
            return;
        }
        if (!await finddpos(tt, DIR_N, troom)) {
            return;
        }
    }
    xx = cc.x;
    yy = cc.y;
    tx = tt.x - dx;
    ty = tt.y - dy;
    if (nxcor && game.level.locations[xx + dx][yy + dy].typ != STONE) {
        return;
    }
    org.x = xx + dx;
    org.y = yy + dy;
    dest.x = tx;
    dest.y = ty;
    dig_result = await dig_corridor(org, dest, { get value() { return npoints; }, set value(_v) { npoints = _v; } }, nxcor, game.level.flags.arboreal ? ROOM : CORR, STONE);
    /* we created at least 1 tile of corridor, even if it failed */
    if ((npoints > 0) && (okdoor(xx, yy) || !nxcor)) {
        await dodoor(xx, yy, croom);
    }
    if (!dig_result) {
        return;
    }
    if (okdoor(tt.x, tt.y) || !nxcor) {
        await dodoor(tt.x, tt.y, troom);
    }
    if (game.smeq[a] < game.smeq[b]) {
        game.smeq[b] = game.smeq[a];
    } else {
        game.smeq[a] = game.smeq[b];
    }
}
/* create random corridors between rooms */
export async function makecorridors() {
    fnEnter("makecorridors", "mklev.c", 0);
    let a = 0;
    let b = 0;
    let i = 0;
    let any = (1);
    for (a = 0; a < game.nroom - 1; a++) {
        await join(a, a + 1, (0));
        if (!rn2(50)) {
            break;
        }
    }
    for (a = 0; a < game.nroom - 2; a++) {
        if (game.smeq[a] != game.smeq[a + 2]) {
            await join(a, a + 2, (0));
        }
    }
    for (a = 0; any && a < game.nroom; a++) {
        any = (0);
        for (b = 0; b < game.nroom; b++) {
            if (game.smeq[a] != game.smeq[b]) {
                await join(a, b, (0));
                any = (1);
            }
        }
    }
    if (game.nroom > 2) {
        for (i = rn2(game.nroom) + 4; i; i--) {
            /* add some extra corridors which may be blocked off */
            a = rn2(game.nroom);
            b = rn2(game.nroom - 2);
            if (b >= a) {
                b += 2;
            }
            await join(a, b, (1));
        }
    }
}
/* (re)allocate space for svd.doors array */
export function alloc_doors() {
    if (!game.doors || game.doorindex >= game.doors_alloc) {
        let c = game.doors_alloc + 20;
        let doortmp = alloc(c * 1 /* sizeof(coord) */);
        memset(doortmp, 0, c * 1 /* sizeof(coord) */);
        if (game.doors) {
            memcpy(doortmp, game.doors, game.doors_alloc * 1 /* sizeof(coord) */);
            free(game.doors);
        }
        game.doors = doortmp;
        game.doors_alloc = c;
    }
}
export function add_door(x, y, aroom) {
    let broom = null;
    let tmp = 0;
    let i = 0;
    alloc_doors();
    if (aroom.doorct) {
        for (i = 0; i < aroom.doorct; i++) {
            tmp = aroom.fdoor + i;
            if (game.doors[tmp].x == x && game.doors[tmp].y == y) {
                return;
            }
        }
    }
    if (aroom.doorct == 0) {
        aroom.fdoor = game.doorindex;
    }
    aroom.doorct++;
    for (tmp = game.doorindex; tmp > aroom.fdoor; tmp--) {
        Object.assign(game.doors[tmp], game.doors[tmp - 1]);
    }
    for (i = 0; i < game.nroom; i++) {
        broom = game.rooms[i];
        if (broom != aroom && broom.doorct && broom.fdoor >= aroom.fdoor) {
            broom.fdoor++;
        }
    }
    for (i = 0; i < game.nsubroom; i++) {
        broom = game.subrooms[i];
        if (broom != aroom && broom.doorct && broom.fdoor >= aroom.fdoor) {
            broom.fdoor++;
        }
    }
    game.doorindex++;
    game.doors[aroom.fdoor].x = x;
    game.doors[aroom.fdoor].y = y;
}
export async function dosdoor(x, y, aroom, type) {
    let shdoor = in_rooms(x, y, SHOPBASE) ? (1) : (0);
    /* avoid S.doors on already made doors */
    if (!((game.level.locations[x][y].typ) && (game.level.locations[x][y].typ) <= DBWALL)) {
        type = DOOR;
    }
    game.level.locations[x][y].typ = type;
    if (type == DOOR) {
        if (!rn2(3)) {
            /* is it a locked door, closed, or a doorway? */
            if (!rn2(5)) {
                game.level.locations[x][y].flags = 2;
            } else if (!rn2(6)) {
                game.level.locations[x][y].flags = 8;
            } else {
                game.level.locations[x][y].flags = 4;
            }
            if (game.level.locations[x][y].flags != 2 && !shdoor && await level_difficulty() >= 5 && !rn2(25)) {
                game.level.locations[x][y].flags |= 16;
            }
        } else {
            game.level.locations[x][y].flags = (shdoor ? 2 : 0);
        }
        /* also done in roguecorr(); doing it here first prevents
           making mimics in place of trapped doors on rogue svl.level */
        if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
            game.level.locations[x][y].flags = 0;
        }
        if (game.level.locations[x][y].flags & 16) {
            let mtmp = null;
            if (await level_difficulty() >= 9 && !rn2(5) && !((game.mvitals[PM_SMALL_MIMIC].mvflags & (2 | 1)) && (game.mvitals[PM_LARGE_MIMIC].mvflags & (2 | 1)) && (game.mvitals[PM_GIANT_MIMIC].mvflags & (2 | 1)))) {
                game.level.locations[x][y].flags = 0;
                mtmp = await makemon(await mkclass(S_MIMIC, 0), x, y, 0);
                if (mtmp) {
                    await set_mimic_sym(mtmp);
                }
            }
        }
    } else {
        if (shdoor || !rn2(5)) {
            game.level.locations[x][y].flags = 8;
        } else {
            game.level.locations[x][y].flags = 4;
        }
        if (!shdoor && await level_difficulty() >= 4 && !rn2(20)) {
            game.level.locations[x][y].flags |= 16;
        }
    }
    add_door(x, y, aroom);
}
/* is x,y location such that NEWS direction from it is inside aroom,
   excluding subrooms */
export function cardinal_nextto_room(aroom, x, y) {
    let rmno = ((game.rooms.indexOf(aroom)) + 3);
    if (isok(x - 1, y) && !game.level.locations[x - 1][y].edge && game.level.locations[x - 1][y].roomno == rmno) {
        return (1);
    }
    if (isok(x + 1, y) && !game.level.locations[x + 1][y].edge && game.level.locations[x + 1][y].roomno == rmno) {
        return (1);
    }
    if (isok(x, y - 1) && !game.level.locations[x][y - 1].edge && game.level.locations[x][y - 1].roomno == rmno) {
        return (1);
    }
    if (isok(x, y + 1) && !game.level.locations[x][y + 1].edge && game.level.locations[x][y + 1].roomno == rmno) {
        return (1);
    }
    return (0);
}
export async function place_niche(aroom, dy, xx, yy) {
    let dd = { x: 0, y: 0 };
    if (rn2(2)) {
        dy.value = 1;
        if (!await finddpos(dd, DIR_S, aroom)) {
            return (0);
        }
    } else {
        dy.value = -1;
        if (!await finddpos(dd, DIR_N, aroom)) {
            return (0);
        }
    }
    xx.value = dd.x;
    yy.value = dd.y;
    return ((isok(xx.value, yy.value + dy.value) && game.level.locations[xx.value][yy.value + dy.value].typ == STONE) && (isok(xx.value, yy.value - dy.value) && !((game.level.locations[xx.value][yy.value - dy.value].typ) >= POOL && (game.level.locations[xx.value][yy.value - dy.value].typ) <= DRAWBRIDGE_UP) && !((game.level.locations[xx.value][yy.value - dy.value].typ) >= STAIRS && (game.level.locations[xx.value][yy.value - dy.value].typ) <= ALTAR)) && cardinal_nextto_room(aroom, xx.value, yy.value));
}
/* there should be one of these per trap, in the same order as trap.h */
const trap_engravings = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, "Vlad was here", "ad aerarium", "ad aerarium", null, null, null, null, null, null, null, null, null];
/* 14..16: trap door, teleport, level-teleport */
/* 24..25 */
export async function makeniche(trap_type) {
    let aroom = null;
    let rm = null;
    let dy = 0;
    let vct = 8;
    let xx = 0;
    let yy = 0;
    let ttmp = null;
    while (vct--) {
        aroom = game.rooms[rn2(game.nroom)];
        if (aroom.rtype != OROOM) {
            continue;
        }
        if (aroom.doorct == 1 && rn2(5)) {
            continue;
        }
        if (!await place_niche(aroom, { get value() { return dy; }, set value(_v) { dy = _v; } }, { get value() { return xx; }, set value(_v) { xx = _v; } }, { get value() { return yy; }, set value(_v) { yy = _v; } })) {
            continue;
        }
        rm = game.level.locations[xx][yy + dy];
        if (trap_type || !rn2(4)) {
            rm.typ = SCORR;
            if (trap_type) {
                if (((trap_type) == HOLE || (trap_type) == TRAPDOOR) && !Can_fall_thru(game.u.uz)) {
                    trap_type = ROCKTRAP;
                }
                ttmp = await maketrap(xx, yy + dy, trap_type);
                if (ttmp) {
                    if (trap_type != ROCKTRAP) {
                        ttmp.once = 1;
                    }
                    if (trap_engravings[trap_type]) {
                        await make_engr_at(xx, yy - dy, trap_engravings[trap_type], null, 0, 1);
                        await wipe_engr_at(xx, yy - dy, 5, (0));
                    }
                }
            }
            await dosdoor(xx, yy, aroom, SDOOR);
        } else {
            rm.typ = CORR;
            if (rn2(7)) {
                await dosdoor(xx, yy, aroom, rn2(5) ? SDOOR : DOOR);
            } else {
                if (!rn2(5) && ((game.level.locations[xx][yy].typ) && (game.level.locations[xx][yy].typ) <= DBWALL)) {
                    await set_levltyp(xx, yy, IRONBARS);
                    if (rn2(3)) {
                        await mkcorpstat(CORPSE, null, await mkclass(S_HUMAN, 0), xx, yy + dy, (1));
                    }
                }
                if (!game.level.flags.noteleport) {
                    await mksobj_at(SCR_TELEPORTATION, xx, yy + dy, (1), (0));
                }
                if (!rn2(3)) {
                    await mkobj_at(RANDOM_CLASS, xx, yy + dy, (1));
                }
            }
        }
        return;
    }
}
export async function make_niches() {
    let ct = rnd((game.nroom >> 1) + 1);
    let dep = depth(game.u.uz);
    let ltptr = (!game.level.flags.noteleport && dep > 15);
    let vamp = (dep > 5 && dep < 25);
    while (ct--) {
        if (ltptr && !rn2(6)) {
            ltptr = (0);
            await makeniche(LEVEL_TELEP);
        } else if (vamp && !rn2(6)) {
            vamp = (0);
            await makeniche(TRAPDOOR);
        } else {
            await makeniche(NO_TRAP);
        }
    }
}
export async function makevtele() {
    await makeniche(TELEP_TRAP);
}
/* count the tracked features (sinks, fountains) present on the level */
export function count_level_features() {
    let x = 0;
    let y = 0;
    game.level.flags.nfountains = game.level.flags.nsinks = 0;
    for (y = 0; y < 21; y++) {
        for (x = 1; x < 80; x++) {
            let typ = game.level.locations[x][y].typ;
            if (typ == FOUNTAIN) {
                game.level.flags.nfountains++;
            } else if (typ == SINK) {
                game.level.flags.nsinks++;
            }
        }
    }
}
/* clear out various globals that keep information on the current level.
 * some of this is only necessary for some types of levels (maze, normal,
 * special) but it's easier to put it all in one place than make sure
 * each type initializes what it needs to separately.
 */
let __clear_level_structures_zerorm = { glyph: GLYPH_UNEXPLORED_OFF, typ: 0, seenv: 0, flags: 0, horizontal: 0, lit: 0, waslit: 0, roomno: 0, edge: 0, candig: 0, disp_ch: '', disp_color: 8, disp_decgfx: false, disp_attr: 0, remembered_glyph: null, gnew: 0 };
__nh_register_static(() => { __clear_level_structures_zerorm = { glyph: GLYPH_UNEXPLORED_OFF, typ: 0, seenv: 0, flags: 0, horizontal: 0, lit: 0, waslit: 0, roomno: 0, edge: 0, candig: 0, disp_ch: '', disp_color: 8, disp_decgfx: false, disp_attr: 0, remembered_glyph: null, gnew: 0 }; });
export async function clear_level_structures() {
    let x = 0;
    let y = 0;
    let lev = null;
    for (x = 0; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            Object.assign(game.level.locations[x][y], __clear_level_structures_zerorm);
            game.level.objects[x][y] = null;
            game.level.monsters[x][y] = null;
        }
    }
    game.level.objlist = null;
    game.level.buriedobjlist = null;
    game.level.monlist = null;
    game.level.damagelist = null;
    game.level.bonesinfo = null;
    game.level.flags.nfountains = 0;
    game.level.flags.nsinks = 0;
    game.level.flags.has_shop = 0;
    game.level.flags.has_vault = 0;
    game.level.flags.has_zoo = 0;
    game.level.flags.has_court = 0;
    game.level.flags.has_morgue = game.level.flags.graveyard = 0;
    game.level.flags.has_beehive = 0;
    game.level.flags.has_barracks = 0;
    game.level.flags.has_temple = 0;
    game.level.flags.has_swamp = 0;
    game.level.flags.noteleport = 0;
    game.level.flags.hardfloor = 0;
    game.level.flags.nommap = 0;
    game.level.flags.hero_memory = 1;
    game.level.flags.shortsighted = 0;
    game.level.flags.sokoban_rules = 0;
    game.level.flags.is_maze_lev = 0;
    game.level.flags.is_cavernous_lev = 0;
    game.level.flags.arboreal = 0;
    game.level.flags.has_town = 0;
    game.level.flags.wizard_bones = 0;
    game.level.flags.corrmaze = 0;
    game.level.flags.temperature = In_hell(game.u.uz) ? 1 : 0;
    game.level.flags.rndmongen = 1;
    game.level.flags.deathdrops = 1;
    game.level.flags.noautosearch = 0;
    game.level.flags.fumaroles = 0;
    game.level.flags.stormy = 0;
    game.level.flags.stasis_until = 0;
    game.nroom = 0;
    game.rooms[0].hx = -1;
    game.nsubroom = 0;
    game.subrooms[0].hx = -1;
    game.doorindex = 0;
    if (game.doors_alloc) {
        free(game.doors);
        game.doors = null;
        game.doors_alloc = 0;
    }
    await init_rect();
    game.vault_x = -1;
    stairway_free_all();
    game.made_branch = (0);
    clear_regions();
    free_exclusions();
    reset_xystart_size();
    if (game.lev_message) {
        free(game.lev_message);
        game.lev_message = null;
    }
}
/* Fill a "random" room (i.e. a typical non-special room in the Dungeons of
   Doom) with random monsters, objects, and dungeon features.

   If bonus_items is TRUE, there may be an additional special item
   generated, depending on depth. */
const __fill_ordinary_room_supply_items = [POT_EXTRA_HEALING, POT_SPEED, POT_GAIN_ENERGY, SCR_ENCHANT_WEAPON, SCR_ENCHANT_ARMOR, SCR_CONFUSE_MONSTER, SCR_SCARE_MONSTER, WAN_DIGGING, SPE_HEALING];
const __fill_ordinary_room_extra_classes = [FOOD_CLASS, WEAPON_CLASS, ARMOR_CLASS, GEM_CLASS, SCROLL_CLASS, POTION_CLASS, RING_CLASS, (0 - SPBOOK_CLASS), (0 - SPBOOK_CLASS), (0 - SPBOOK_CLASS)];
export async function fill_ordinary_room(croom, bonus_items) {
    let trycnt = 0;
    let pos = { x: 0, y: 0 };
    let tmonst = null;
    let x = 0;
    let y = 0;
    let skip_chests = 0;
    skip_nonrogue: {
        trycnt = 0;
        /* always put a web with a spider */
        skip_chests = (0);
        if (croom.rtype != OROOM && croom.rtype != THEMEROOM) {
            return;
        }
        for (x = 0; x < croom.nsubrooms; ++x) {
            /* If there are subrooms, fill them now - we don't want an outer room
     * that's specified to be unfilled to block an inner subroom that's
     * specified to be filled. */
            let subroom = croom.sbrooms[x];
            if (!subroom) {
                await impossible("fill_ordinary_room: Null subroom");
                return;
            }
            await fill_ordinary_room(subroom, (0));
        }
        if (croom.needfill != 1) {
            return;
        }
        if ((game.u.uhave.amulet || !rn2(3)) && somexyspace(croom, pos)) {
            tmonst = await makemon(null, pos.x, pos.y, 8192);
            if (tmonst && tmonst.data == game.mons[PM_GIANT_SPIDER] && !occupied(pos.x, pos.y)) {
                await maketrap(pos.x, pos.y, WEB);
            }
        }
        x = 8 - (Math.trunc(await level_difficulty() / 6));
        if (x <= 1) {
            x = 2;
        }
        while (!rn2(x) && (++trycnt < 1000)) {
            await mktrap(0, 0, croom, null);
        }
        if (!rn2(3) && somexyspace(croom, pos)) {
            await mkgold(0, pos.x, pos.y);
        }
        if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
            break skip_nonrogue;
        }
        if (!rn2(10)) {
            await mkfount(croom);
        }
        if (!rn2(60)) {
            await mksink(croom);
        }
        if (!rn2(60)) {
            await mkaltar(croom);
        }
        x = 80 - (depth(game.u.uz) * 2);
        if (x < 2) {
            x = 2;
        }
        if (!rn2(x)) {
            await mkgrave(croom);
        }
        if (!rn2(20) && somexyspace(croom, pos)) {
            await mkcorpstat(STATUE, null, null, pos.x, pos.y, 8);
        }
        if (bonus_items && somexyspace(croom, pos)) {
            /*
     * bonus_items means that this is the room where the bonus item
     * should be placed, if there is one; but there might not be a
     * bonus item on any given level.
     *
     * Bonus items are currently as follows:
     * a) on the Mines branch level, 100% chance of a fairly filling
     *    comestible;
     * b) on other levels above the Oracle, 2/3 chance of a "supply
     *    chest" that contains an early-game survivability item
     *    (there are therefore more of these when Sokoban is deep,
     *    which is intentional as those games are harder).
     * This mechanism could be expanded in the future to place
     * near-guaranteed items on particular levels (but, it is possible
     * that no room will be given a bonus item if there is no suitable
     * room to place it in, so it should not be used for plot-critical
     * items).
     */
            let uz_branch = Is_branchlev(game.u.uz);
            if (uz_branch && game.u.uz.dnum != (game.dungeon_topology.d_mines_dnum) && (uz_branch.end1.dnum == (game.dungeon_topology.d_mines_dnum) || uz_branch.end2.dnum == (game.dungeon_topology.d_mines_dnum))) {
                await mksobj_at((rn2(5) < 3) ? FOOD_RATION : rn2(2) ? CRAM_RATION : LEMBAS_WAFER, pos.x, pos.y, (1), (0));
            } else if (game.u.uz.dnum == (game.dungeon_topology.d_oracle_level).dnum && game.u.uz.dlevel < (game.dungeon_topology.d_oracle_level).dlevel && rn2(3)) {
                /* Object generated by the trap; initially NULL, stays NULL if
       the trap doesn't generate objects. */
                let otmp = null;
                let otyp = 0;
                let tryct = 0;
                let cursed = 0;
                let supply_chest = await mksobj_at(rn2(3) ? CHEST : LARGE_BOX, pos.x, pos.y, (0), (0));
                supply_chest.olocked = !!(rn2(6));
                do {
                    /* 50% this is a potion of healing */
                    otyp = rn2(2) ? POT_HEALING : __fill_ordinary_room_supply_items[rn2((Math.trunc(36 /* sizeof(const int [9]) */ / 4 /* sizeof(const int) */)))];
                    otmp = await mksobj(otyp, (1), (0));
                    if (otyp == POT_HEALING && rn2(2)) {
                        otmp.quan = 2;
                        otmp.owt = await weight(otmp);
                    }
                    cursed = otmp.cursed;
                    await add_to_container(supply_chest, otmp);
                    ++tryct;
                    if (tryct == 50) {
                        await impossible("couldn't generate supply chest item");
                        break;
                    }
                } while (cursed || !rn2(5));
                if (rn2(3)) {
                    /* maybe put a random item into the supply chest, biased
               slightly towards low-level spellbooks; avoid tools
               because chests don't fit into other chests */
                    let oclass = __fill_ordinary_room_extra_classes[rn2((Math.trunc(40 /* sizeof(const int [10]) */ / 4 /* sizeof(const int) */)))];
                    otmp = await mkobj(oclass, (0));
                    if (oclass == (0 - SPBOOK_CLASS)) {
                        let pass = 0;
                        let maxpass = (depth(game.u.uz) > 2) ? 2 : 3;
                        for (pass = 1; pass <= maxpass; ++pass) {
                            let otmp2 = await mkobj(oclass, (0));
                            if (game.objects[otmp.otyp].oc_oc2 <= game.objects[otmp2.otyp].oc_oc2) {
                                await dealloc_obj(otmp2);
                            } else {
                                await dealloc_obj(otmp);
                                otmp = otmp2;
                            }
                        }
                    }
                    await add_to_container(supply_chest, otmp);
                }
                supply_chest.owt = await weight(supply_chest);
                /* don't want a second chest in this room */
                skip_chests = (1);
            }
        }
        /* put box/chest inside;
     *  40% chance for at least 1 box, regardless of number
     *  of rooms; about 5 - 7.5% for 2 boxes, least likely
     *  when few rooms; chance for 3 or more is negligible.
     */
        /*assert(svn.nroom > 0); // must be true because we're filling a room*/
        if (!skip_chests && !rn2(Math.trunc(game.nroom * 5 / 2)) && somexyspace(croom, pos)) {
            await mksobj_at(rn2(3) ? LARGE_BOX : CHEST, pos.x, pos.y, (1), (0));
        }
        if (!rn2(27 + 3 * abs(depth(game.u.uz)))) {
            /* maybe make some graffiti */
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let pristinebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let mesg = await random_engraving(buf, pristinebuf);
            if (mesg) {
                do {
                    somexyspace(croom, pos);
                    x = pos.x;
                    y = pos.y;
                } while (game.level.locations[x][y].typ != ROOM && !rn2(40));
                if (game.level.locations[x][y].typ == ROOM) {
                    await make_engr_at(x, y, mesg, pristinebuf, 0, 4);
                }
            }
        }
    }
    if (!rn2(3) && somexyspace(croom, pos)) {
        await mkobj_at(RANDOM_CLASS, pos.x, pos.y, (1));
        trycnt = 0;
        while (!rn2(5)) {
            if (++trycnt > 100) {
                await impossible("trycnt overflow4");
                break;
            }
            if (somexyspace(croom, pos)) {
                await mkobj_at(RANDOM_CLASS, pos.x, pos.y, (1));
            }
        }
    }
}
export async function themerooms_post_level_generate() {
    let themes = game.luathemes[game.u.uz.dnum];
    /* themes should already be loaded by makerooms();
      * if not, we don't run this either */
    if (!themes) {
        return;
    }
    reset_xystart_size();
    game.iflags.in_lua = game.in_mk_themerooms = (1);
    game.themeroom_failed = (0);
    lua_getglobal(themes, "post_level_generate");
    await nhl_pcall_handle(themes, 0, 0, "post_level_generate", NHLpa_panic);
    game.iflags.in_lua = game.in_mk_themerooms = (0);
    await wallification(1, 0, 80 - 1, 21 - 1);
    if (game.coder) {
        free(game.coder) , game.coder = null;
    }
    lua_gc(themes, 2);
}
/* if x,y is door, does it open into solid terrain */
export function chk_okdoor(x, y) {
    if (((game.level.locations[x][y].typ) == DOOR)) {
        if (game.level.locations[x][y].horizontal) {
            if ((isok(x, y - 1) && (game.level.locations[x][y - 1].typ > TREE)) && (isok(x, y + 1) && (game.level.locations[x][y + 1].typ <= TREE))) {
                return (0);
            }
            if ((isok(x, y - 1) && (game.level.locations[x][y - 1].typ <= TREE)) && (isok(x, y + 1) && (game.level.locations[x][y + 1].typ > TREE))) {
                return (0);
            }
        } else {
            if ((isok(x - 1, y) && (game.level.locations[x - 1][y].typ > TREE)) && (isok(x + 1, y) && (game.level.locations[x + 1][y].typ <= TREE))) {
                return (0);
            }
            if ((isok(x - 1, y) && (game.level.locations[x - 1][y].typ <= TREE)) && (isok(x + 1, y) && (game.level.locations[x + 1][y].typ > TREE))) {
                return (0);
            }
        }
        return (1);
    }
    return (1);
}
/* check mklev created level sanity */
export async function mklev_sanity_check() {
    let x = 0;
    let y = 0;
    let i = 0;
    let rmno = -1;
    if (!(game.iflags.sanity_check || game.iflags.debug_fuzzer)) {
        return;
    }
    for (y = 0; y < 21; y++) {
        for (x = 1; x < 80; x++) {
            if (!chk_okdoor(x, y)) {
                await impossible("levl[%i][%i] door not ok", x, y);
            }
        }
    }
    for (i = 0; i < game.nroom; i++) {
        if (!game.rooms[i].needjoining) {
            continue;
        }
        if (rmno == -1) {
            rmno = game.smeq[i];
        }
        if (rmno != -1 && game.smeq[i] != rmno) {
            await impossible("room %i not connected?", i);
        }
    }
}
export async function makelevel() {
    fnEnter("makelevel", "mklev.c", 0);
    let croom = null;
    let branchp = null;
    let prevstairs = null;
    let room_threshold = 0;
    let slev = null;
    let i = 0;
    if ((game.dungeon_topology.d_wiz1_level).dlevel == 0) {
        await impossible("makelevel() called when dungeon not yet initialized.");
        await init_dungeons();
    }
    await oinit();
    await clear_level_structures();
    slev = Is_special(game.u.uz);
    if (slev && !(((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        await makemaz(slev.proto);
    } else if (game.dungeons[game.u.uz.dnum].proto[0]) {
        await makemaz("");
    } else if (game.dungeons[game.u.uz.dnum].fill_lvl[0]) {
        await makemaz(game.dungeons[game.u.uz.dnum].fill_lvl);
    } else if (In_quest(game.u.uz)) {
        let fillname = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        let loc_lev = null;
        fillname = sprintf(fillname, "%s-loca", game.urole.filecode);
        loc_lev = find_level(fillname);
        fillname = sprintf(fillname, "%s-fil", game.urole.filecode);
        fillname = strcat(fillname, (game.u.uz.dlevel < loc_lev.dlevel.dlevel) ? "a" : "b");
        await makemaz(fillname);
    } else if (In_hell(game.u.uz) || (rn2(5) && game.u.uz.dnum == (game.dungeon_topology.d_medusa_level).dnum && depth(game.u.uz) > depth((game.dungeon_topology.d_medusa_level)))) {
        await makemaz("");
    } else {
        let u_depth = 0;
        let fillable_room_count = 0;
        let bonus_item_room_countdown = 0;
        skip0: {
            /* otherwise, fall through - it's a "regular" level. */
            u_depth = depth(game.u.uz);
            if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                await makeroguerooms();
                await makerogueghost();
            } else {
                await makerooms();
            }
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            await sort_rooms();
            await generate_stairs();
            branchp = Is_branchlev(game.u.uz);
            /* minimum number of rooms needed
                                            to allow a random special room */
            room_threshold = branchp ? 4 : 3;
            if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                break skip0;
            }
            await makecorridors();
            await make_niches();
            await mklev_sanity_check();
            if ((game.vault_x != -1)) {
                /* make a secret treasure vault, not connected to the rest */
                let w = 0;
                let h = 0;
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mklev.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        await pline("trying to make a vault...");
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                w = 1;
                h = 1;
                let __do_fill_vault = false;
                if (await check_room({ get value() { return game.vault_x; }, set value(_v) { game.vault_x = _v; } }, { get value() { return w; }, set value(_v) { w = _v; } }, { get value() { return game.vault_y; }, set value(_v) { game.vault_y = _v; } }, { get value() { return h; }, set value(_v) { h = _v; } }, (1))) {
                    __do_fill_vault = true;
                } else if (rnd_rect() && await create_room(-1, -1, 2, 2, -1, -1, VAULT, (1))) {
                    game.vault_x = game.rooms[game.nroom].lx;
                    game.vault_y = game.rooms[game.nroom].ly;
                    if (await check_room({ get value() { return game.vault_x; }, set value(_v) { game.vault_x = _v; } }, { get value() { return w; }, set value(_v) { w = _v; } }, { get value() { return game.vault_y; }, set value(_v) { game.vault_y = _v; } }, { get value() { return h; }, set value(_v) { h = _v; } }, (1))) {
                        __do_fill_vault = true;
                    } else {
                        game.rooms[game.nroom].hx = -1;
                    }
                }
                if (__do_fill_vault) {
                    await add_room(game.vault_x, game.vault_y, game.vault_x + w, game.vault_y + h, (1), VAULT, (0));
                    game.level.flags.has_vault = 1;
                    ++room_threshold;
                    game.rooms[game.nroom - 1].needfill = 1;
                    await fill_special_room(game.rooms[game.nroom - 1]);
                    await mk_knox_portal(game.vault_x + w, game.vault_y + h);
                    if (!game.level.flags.noteleport && !rn2(3)) {
                        await makevtele();
                    }
                }
            }
            /* make up to 1 special room, with type dependent on depth;
           note that mkroom doesn't guarantee a room gets created, and that
           this step only sets the room's rtype - it doesn't fill it yet. */
            if (game.flags.debug && nh_getenv("SHOPTYPE")) {
                await do_mkroom(SHOPBASE);
            } else if (u_depth > 1 && u_depth < depth((game.dungeon_topology.d_medusa_level)) && game.nroom >= room_threshold && rn2(u_depth) < 3) {
                await do_mkroom(SHOPBASE);
            } else if (u_depth > 4 && !rn2(6)) {
                await do_mkroom(COURT);
            } else if (u_depth > 5 && !rn2(8) && !(game.mvitals[PM_LEPRECHAUN].mvflags & (2 | 1))) {
                await do_mkroom(LEPREHALL);
            } else if (u_depth > 6 && !rn2(7)) {
                await do_mkroom(ZOO);
            } else if (u_depth > 8 && !rn2(5)) {
                await do_mkroom(TEMPLE);
            } else if (u_depth > 9 && !rn2(5) && !(game.mvitals[PM_KILLER_BEE].mvflags & (2 | 1))) {
                await do_mkroom(BEEHIVE);
            } else if (u_depth > 11 && !rn2(6)) {
                await do_mkroom(MORGUE);
            } else if (u_depth > 12 && !rn2(8) && await antholemon()) {
                await do_mkroom(ANTHOLE);
            } else if (u_depth > 14 && !rn2(4) && !(game.mvitals[PM_SOLDIER].mvflags & (2 | 1))) {
                await do_mkroom(BARRACKS);
            } else if (u_depth > 15 && !rn2(6)) {
                await do_mkroom(SWAMP);
            } else if (u_depth > 16 && !rn2(8) && !(game.mvitals[PM_COCKATRICE].mvflags & (2 | 1))) {
                await do_mkroom(COCKNEST);
            }
        }
        prevstairs = game.stairs;
        await place_branch(branchp, 0, 0);
        /* for main dungeon level 1, the stairs up where the hero starts
           are branch stairs; treat them as if hero had just come down
           them by marking them as having been traversed; most recently
           created stairway is held in 'gs.stairs' */
        if (game.u.uz.dnum == 0 && game.u.uz.dlevel == 1 && game.stairs != prevstairs) {
            game.stairs.u_traversed = (1);
        }
        /* some levels have specially generated items in ordinary
           rooms (intended to be indistinguishable from the normally
           generated items); work out which room these will be placed in */
        fillable_room_count = 0;
        for (let __nhi_croom = 0; (croom = game.rooms[__nhi_croom]) && (croom.hx > 0); __nhi_croom++) {
            if (((croom.rtype == OROOM || croom.rtype == THEMEROOM) && croom.needfill == 1)) {
                fillable_room_count++;
            }
        }
        /* choose a random fillable room to be the one that gets the
           bonus items, if there are any; if there aren't any we don't
           generate the bonus items (but levels with no fillable rooms
           typically don't have any bonus items to generate anyway) */
        bonus_item_room_countdown = fillable_room_count ? rn2(fillable_room_count) : -1;
        for (let __nhi_croom = 0; (croom = game.rooms[__nhi_croom]) && (croom.hx > 0); __nhi_croom++) {
            /* for each room: put things inside */
            let fillable = ((croom.rtype == OROOM || croom.rtype == THEMEROOM) && croom.needfill == 1);
            await fill_ordinary_room(croom, fillable && bonus_item_room_countdown == 0);
            if (fillable) {
                --bonus_item_room_countdown;
            }
        }
    }
    for (i = 0; i < game.nroom; ++i) {
        await fill_special_room(game.rooms[i]);
    }
    await themerooms_post_level_generate();
    if (game.luacore && game.nhcb_counts[NHCB_LVL_ENTER]) {
        lua_getglobal(game.luacore, "nh_callback_run");
        lua_pushstring(game.luacore, nhcb_name[NHCB_LVL_ENTER]);
        await nhl_pcall_handle(game.luacore, 1, 0, "makelevel", NHLpa_panic);
        lua_settop(game.luacore, 0);
    }
}
/* return TRUE if water location at (x,y) should have kelp. */
export function water_has_kelp(x, y, kelp_pool, kelp_moat) {
    if ((kelp_pool && (game.level.locations[x][y].typ == POOL || (game.level.locations[x][y].typ == WATER && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) && !rn2(kelp_pool)) || (kelp_moat && game.level.locations[x][y].typ == MOAT && !rn2(kelp_moat))) {
        return (1);
    }
    return (0);
}
/*
 *      Place deposits of minerals (gold and misc gems) in the stone
 *      surrounding the rooms on the map.
 *      Also place kelp in water.
 *      mineralize(-1, -1, -1, -1, FALSE); => "default" behavior
 */
export async function mineralize(kelp_pool, kelp_moat, goldprob, gemprob, skip_lvl_checks) {
    let sp = null;
    let otmp = null;
    let x = 0;
    let y = 0;
    let cnt = 0;
    if (kelp_pool < 0) {
        kelp_pool = 10;
    }
    if (kelp_moat < 0) {
        kelp_moat = 30;
    }
    /* Place kelp, except on the plane of water */
    if (!skip_lvl_checks && ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        return;
    }
    for (x = 2; x < (80 - 2); x++) {
        for (y = 1; y < (21 - 1); y++) {
            if (water_has_kelp(x, y, kelp_pool, kelp_moat)) {
                await mksobj_at(KELP_FROND, x, y, (1), (0));
            }
        }
    }
    /* determine if it is even allowed;
       almost all special levels are excluded */
    if (!skip_lvl_checks && (In_hell(game.u.uz) || In_V_tower(game.u.uz) || (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) || game.level.flags.arboreal || ((sp = Is_special(game.u.uz)) != null && !(((((game.dungeon_topology.d_oracle_level)).dlevel || ((game.dungeon_topology.d_oracle_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_oracle_level)))) && (!In_mines(game.u.uz) || sp.flags.town)))) {
        return;
    }
    /* basic level-related probabilities */
    if (goldprob < 0) {
        goldprob = 20 + Math.trunc(depth(game.u.uz) / 3);
    }
    if (gemprob < 0) {
        gemprob = Math.trunc(goldprob / 4);
    }
    if (!skip_lvl_checks) {
        if (In_mines(game.u.uz)) {
            /* mines have ***MORE*** goodies - otherwise why mine? */
            goldprob *= 2;
            gemprob *= 3;
        } else if (In_quest(game.u.uz)) {
            goldprob = Math.trunc(goldprob / 4);
            gemprob = Math.trunc(gemprob / 6);
        }
    }
    for (x = 2; x < (80 - 2); x++) {
        for (y = 1; y < (21 - 1); y++) {
            if (game.level.locations[x][y + 1].typ != STONE) {
                /*
     * Seed rock areas with gold and/or gems.
     * We use fairly low level object handling to avoid unnecessary
     * overhead from placing things in the floor chain prior to burial.
     */
                /* next two spots aren't eligible either */
                y += 2;
            } else if (game.level.locations[x][y].typ != STONE) {
                /* next spot isn't eligible either */
                y += 1;
            } else if (!(game.level.locations[x][y].flags & 8) && game.level.locations[x][y - 1].typ == STONE && game.level.locations[x + 1][y - 1].typ == STONE && game.level.locations[x - 1][y - 1].typ == STONE && game.level.locations[x + 1][y].typ == STONE && game.level.locations[x - 1][y].typ == STONE && game.level.locations[x + 1][y + 1].typ == STONE && game.level.locations[x - 1][y + 1].typ == STONE) {
                if (rn2(1000) < goldprob) {
                    if ((otmp = await mksobj(GOLD_PIECE, (0), (0))) != null) {
                        otmp.ox = x , otmp.oy = y;
                        otmp.quan = 1 + rnd(goldprob * 3);
                        otmp.owt = await weight(otmp);
                        if (!rn2(3)) {
                            await add_to_buried(otmp);
                        } else {
                            await place_object(otmp, x, y);
                        }
                    }
                }
                if (rn2(1000) < gemprob) {
                    for (cnt = rnd(2 + Math.trunc(dunlev(game.u.uz) / 3)); cnt > 0; cnt--) {
                        if ((otmp = await mkobj(GEM_CLASS, (0))) != null) {
                            if (otmp.otyp == ROCK) {
                                await dealloc_obj(otmp);
                            } else {
                                otmp.ox = x , otmp.oy = y;
                                if (!rn2(3)) {
                                    await add_to_buried(otmp);
                                } else {
                                    await place_object(otmp, x, y);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
export async function level_finalize_topology() {
    let croom = null;
    let ridx = 0;
    bound_digging();
    await mineralize(-1, -1, -1, -1, (0));
    game.in_mklev = (0);
    /* avoid coordinates in future lua-loads for this level being thrown off
     * because xstart and ystart aren't saved with the level and will be 0
     * after leaving and returning */
    game.xstart = game.ystart = 0;
    /* has_morgue gets cleared once morgue is entered; graveyard stays
       set (graveyard might already be set even when has_morgue is clear
       [see fixup_special()], so don't update it unconditionally) */
    if (game.level.flags.has_morgue) {
        game.level.flags.graveyard = 1;
    }
    if (!game.level.flags.is_maze_lev) {
        for (let __nhi_croom = 0; (croom = game.rooms[__nhi_croom]) && (croom != game.rooms[game.nroom]); __nhi_croom++) {
            topologize(croom);
        }
    }
    set_wall_state();
    /* for many room types, svr.rooms[].rtype is zeroed once the room has been
       entered; svr.rooms[].orig_rtype always retains original rtype value */
    for (ridx = 0; ridx < (Math.trunc(82 /* sizeof(struct mkroom [82]) */ / 1 /* sizeof(struct mkroom) */)); ridx++) {
        game.rooms[ridx].orig_rtype = game.rooms[ridx].rtype;
    }
}
export async function mklev() {
    fnEnter("mklev", "mklev.c", 0);
    await reseed_random(rn2);
    await reseed_random(rn2_on_display_rng);
    init_mapseen(game.u.uz);
    if (await getbones()) {
        return;
    }
    game.in_mklev = (1);
    await makelevel();
    await level_finalize_topology();
    await reseed_random(rn2);
    await reseed_random(rn2_on_display_rng);
}
export function topologize(croom) {
    fnEnter("topologize", "mklev.c", 0);
    let x = 0;
    let y = 0;
    let roomno = ((game.rooms.indexOf(croom)) + 3);
    let lowx = croom.lx;
    let lowy = croom.ly;
    let hix = croom.hx;
    let hiy = croom.hy;
    let subindex = 0;
    let nsubrooms = croom.nsubrooms;
    /* skip the room if already done; i.e. a shop handled out of order */
    /* also skip if this is non-rectangular (it _must_ be done already) */
    if (game.level.locations[lowx][lowy].roomno == roomno || croom.irregular) {
        return;
    }
{
        for (x = lowx; x <= hix; x++) {
            for (y = lowy; y <= hiy; y++) {
                game.level.locations[x][y].roomno = roomno;
            }
        }
        for (x = lowx - 1; x <= hix + 1; x++) {
            for (y = lowy - 1; y <= hiy + 1; y += (hiy - lowy + 2)) {
                game.level.locations[x][y].edge = 1;
                if (game.level.locations[x][y].roomno) {
                    game.level.locations[x][y].roomno = 1;
                } else {
                    game.level.locations[x][y].roomno = roomno;
                }
            }
        }
        for (x = lowx - 1; x <= hix + 1; x += (hix - lowx + 2)) {
            for (y = lowy; y <= hiy; y++) {
                game.level.locations[x][y].edge = 1;
                if (game.level.locations[x][y].roomno) {
                    game.level.locations[x][y].roomno = 1;
                } else {
                    game.level.locations[x][y].roomno = roomno;
                }
            }
        }
    }
    for (subindex = 0; subindex < nsubrooms; subindex++) {
        topologize(croom.sbrooms[subindex]);
    }
}
/* Find an unused room for a branch location. */
export async function find_branch_room(mp) {
    let croom = null;
    if (game.nroom == 0) {
        await mazexy(mp);
    } else {
        croom = generate_stairs_find_room();
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        if (!somexyspace(croom, mp)) {
            await impossible("Can't place branch!");
        }
    }
    return croom;
}
/* Find the room for (x,y).  Return null if not in a room. */
export function pos_to_room(x, y) {
    let i = 0;
    let curr = null;
    for (i = 0; i < game.nroom; i++) {
        curr = game.rooms[i];
        if (inside_room(curr, x, y)) {
            return curr;
        }
    }
    ;
    return null;
}
/* If given a branch, randomly place a special stair or portal. */
/* branch to place */
/* location */
export async function place_branch(br, x, y) {
    let m = { x: 0, y: 0 };
    let dest = null;
    let make_stairs = 0;
    /*
     * Return immediately if there is no branch to make or we have
     * already made one.  This routine can be called twice when
     * a special level is loaded that specifies an SSTAIR location
     * as a favored spot for a branch.
     */
    if (!br || game.made_branch) {
        return;
    }
    if (!x) {
        await find_branch_room(m);
        x = m.x;
        y = m.y;
    } else {
        pos_to_room(x, y);
    }
    if (on_level(br.end1, game.u.uz)) {
        make_stairs = br.type != 1;
        dest = br.end2;
    } else {
        make_stairs = br.type != 2;
        dest = br.end1;
    }
    if (br.type == 3) {
        if (game.iflags.debug_fuzzer && (game.u.ucamefrom.dnum || game.u.ucamefrom.dlevel)) {
            await mkportal(x, y, game.u.ucamefrom.dnum, game.u.ucamefrom.dlevel);
        } else {
            await mkportal(x, y, dest.dnum, dest.dlevel);
        }
    } else if (make_stairs) {
        let goes_up = on_level(br.end1, game.u.uz) ? br.end1_up : !br.end1_up;
        stairway_add(x, y, goes_up, (0), dest);
        await set_levltyp(x, y, STAIRS);
        game.level.locations[x][y].flags = goes_up ? 1 : 2;
    }
    /*
     * Set made_branch to TRUE even if we didn't make a stairwell (i.e.
     * make_stairs is false) since there is currently only one branch
     * per level, if we failed once, we're going to fail again on the
     * next call.
     */
    game.made_branch = (1);
}
export function bydoor(x, y) {
    let typ = 0;
    if (isok(x + 1, y)) {
        typ = game.level.locations[x + 1][y].typ;
        if (((typ) == DOOR) || typ == SDOOR) {
            return (1);
        }
    }
    if (isok(x - 1, y)) {
        typ = game.level.locations[x - 1][y].typ;
        if (((typ) == DOOR) || typ == SDOOR) {
            return (1);
        }
    }
    if (isok(x, y + 1)) {
        typ = game.level.locations[x][y + 1].typ;
        if (((typ) == DOOR) || typ == SDOOR) {
            return (1);
        }
    }
    if (isok(x, y - 1)) {
        typ = game.level.locations[x][y - 1].typ;
        if (((typ) == DOOR) || typ == SDOOR) {
            return (1);
        }
    }
    return (0);
}
/* see whether it is allowable to create a door at [x,y] */
export function okdoor(x, y) {
    let near_door = bydoor(x, y);
    return ((game.level.locations[x][y].typ == HWALL || game.level.locations[x][y].typ == VWALL) && ((isok(x - 1, y) && !((game.level.locations[x - 1][y].typ) < POOL)) || (isok(x + 1, y) && !((game.level.locations[x + 1][y].typ) < POOL)) || (isok(x, y - 1) && !((game.level.locations[x][y - 1].typ) < POOL)) || (isok(x, y + 1) && !((game.level.locations[x][y + 1].typ) < POOL))) && !near_door);
}
/* do we want a secret door/corridor? */
export function maybe_sdoor(chance) {
    return (depth(game.u.uz) > 2) && !rn2(((2) > (chance) ? (2) : (chance)));
}
/* create a door at x,y in room aroom */
export async function dodoor(x, y, aroom) {
    await dosdoor(x, y, aroom, maybe_sdoor(8) ? SDOOR : DOOR);
}
export function occupied(x, y) {
    return (t_at(x, y) || ((game.level.locations[x][y].typ) >= STAIRS && (game.level.locations[x][y].typ) <= ALTAR) || is_lava(x, y) || is_pool(x, y) || invocation_pos(x, y));
}
/* generate a corpse and some items on top of a trap */
export async function mktrap_victim(ttmp) {
    let otmp = null;
    let victim_mnum = 0;
    let lvl = await level_difficulty();
    let kind = ttmp.ttyp;
    let x = ttmp.tx;
    let y = ttmp.ty;
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    switch (kind) {
        /* Not all trap types have special handling here; only the ones
       that kill in a specific way that's obvious after the fact. */
        case ARROW_TRAP:
            otmp = await mksobj(ARROW, (1), (0));
            otmp.otrapped = 0;
            break;
        case DART_TRAP:
            otmp = await mksobj(DART, (1), (0));
            break;
        case ROCKTRAP:
            otmp = await mksobj(ROCK, (1), (0));
            break;
        default:
            break;
    }
    if (otmp) {
        await place_object(otmp, x, y);
    }
    do {
        /* init => lint suppression */
        let poss_class = RANDOM_CLASS;
        switch (rn2(4)) {
            /* now otmp is reused for other items we're placing */
            /* Place a random possession. This could be a weapon, tool,
       food, or gem, i.e. the item classes that are typically
       nonmagical and not worthless. */
            case 0:
                poss_class = WEAPON_CLASS;
                break;
            case 1:
                poss_class = TOOL_CLASS;
                break;
            case 2:
                poss_class = FOOD_CLASS;
                break;
            case 3:
                poss_class = GEM_CLASS;
                break;
        }
        otmp = await mkobj(poss_class, (0));
        await curse(otmp);
        /* 20% chance of placing an additional item, recursively */
        if (ttmp.ttyp == PIT && breaktest(otmp)) {
            await dealloc_obj(otmp);
        } else {
            await place_object(otmp, x, y);
        }
    } while (!rn2(5));
    switch (rn2(15)) {
        case 0:
            victim_mnum = PM_ELF;
            /* elven adventurers get sleep resistance early; so don't
           generate elf corpses on sleeping gas traps unless a)
           we're on dlvl 2 (1 is impossible) and b) we pass a coin
           flip */
            if (kind == SLP_GAS_TRAP && !(lvl <= 2 && rn2(2))) {
                victim_mnum = PM_HUMAN;
            }
            break;
        case 1:
        case 2:
            victim_mnum = PM_DWARF;
            break;
        case 3:
        case 4:
        case 5:
            victim_mnum = PM_ORC;
            break;
        case 6:
        case 7:
        case 8:
        case 9:
            victim_mnum = PM_GNOME;
            if (!rn2(10)) {
                otmp = await mksobj(rn2(4) ? TALLOW_CANDLE : WAX_CANDLE, (1), (0));
                otmp.quan = 1;
                otmp.owt = await weight(otmp);
                await curse(otmp);
                await place_object(otmp, x, y);
                if (!game.level.locations[x][y].lit) {
                    await begin_burn(otmp, (0));
                }
            }
            break;
        default:
            victim_mnum = PM_HUMAN;
            break;
    }
    /* PM_HUMAN is a placeholder monster primarily used for zombie, mummy,
       and vampire corpses; usually change it into a fake player monster
       instead (always human); no role-specific equipment is provided */
    if (victim_mnum == PM_HUMAN && rn2(25)) {
        victim_mnum = (rn2(PM_WIZARD - PM_ARCHEOLOGIST) + (PM_ARCHEOLOGIST));
    }
    otmp = await mkcorpstat(CORPSE, null, game.mons[victim_mnum], x, y, 8);
    /* died too long ago to safely eat */
    otmp.age -= ((50) + 1);
}
/* pick a random trap type, return NO_TRAP if "too hard" */
export async function traptype_rnd(mktrapflags) {
    let lvl = await level_difficulty();
    let kind = rnd(TRAPNUM - 1);
    switch (kind) {
        /* these are controlled by the feature or object they guard,
           not by the map so mustn't be created on it */
        case TRAPPED_DOOR:
        case TRAPPED_CHEST:
            kind = NO_TRAP;
            break;
        /* these can have a random location but can't be generated
           randomly */
        case MAGIC_PORTAL:
        case VIBRATING_SQUARE:
            kind = NO_TRAP;
            break;
        case ROLLING_BOULDER_TRAP:
        case SLP_GAS_TRAP:
            if (lvl < 2) {
                kind = NO_TRAP;
            }
            break;
        case LEVEL_TELEP:
            if (lvl < 5 || game.level.flags.noteleport || single_level_branch(game.u.uz)) {
                kind = NO_TRAP;
            }
            break;
        case SPIKED_PIT:
            if (lvl < 5) {
                kind = NO_TRAP;
            }
            break;
        case LANDMINE:
            if (lvl < 6) {
                kind = NO_TRAP;
            }
            break;
        case WEB:
            if (lvl < 7 && !(mktrapflags & 4)) {
                kind = NO_TRAP;
            }
            break;
        case STATUE_TRAP:
        case POLY_TRAP:
            if (lvl < 8) {
                kind = NO_TRAP;
            }
            break;
        case FIRE_TRAP:
            if (!In_hell(game.u.uz)) {
                kind = NO_TRAP;
            }
            break;
        case TELEP_TRAP:
            if (game.level.flags.noteleport) {
                kind = NO_TRAP;
            }
            break;
        case HOLE:
            if (rn2(7)) {
                kind = NO_TRAP;
            }
            break;
    }
    return kind;
}
/* random trap type for the Rogue level */
export function traptype_roguelvl() {
    let kind = 0;
    switch (rn2(7)) {
        default:
            kind = BEAR_TRAP;
            break;
        case 1:
            kind = ARROW_TRAP;
            break;
        case 2:
            kind = DART_TRAP;
            break;
        case 3:
            kind = TRAPDOOR;
            break;
        case 4:
            kind = PIT;
            break;
        case 5:
            kind = SLP_GAS_TRAP;
            break;
        case 6:
            kind = RUST_TRAP;
            break;
    }
    return kind;
}
/* mktrap(): select trap type and location, then use maketrap() to create it;
   make it at location 'tm' when that isn't Null, otherwise in 'croom'
   if mktrapflags doesn't have MKTRAP_MAZEFLAG set, else in maze corridor */
/* if non-zero, specific type of trap to make */
/* MKTRAP_{SEEN,MAZEFLAG,NOSPIDERONWEB,NOVICTIM} */
/* room to hold trap */
/* specific location for trap */
let __mktrap_mktrap_err = 0;
__nh_register_static(() => { __mktrap_mktrap_err = 0; });
export async function mktrap(num, mktrapflags, croom, tm) {
    let t = null;
    let m = { x: 0, y: 0 };
    let kind = 0;
    let lvl = await level_difficulty();
    if (!tm && !croom && !(mktrapflags & 2)) {
        if (!__mktrap_mktrap_err++) {
            /* complain when the combination of arguments will never set 'm' */
            let errbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            errbuf = nh_snprintf("mktrap", 2055, errbuf, 256 /* sizeof(char [256]) */, "args (%d,%d,%s,%s) are invalid", num, mktrapflags, "null room", "null location");
            paniclog("mktrap", errbuf);
        }
        return;
    }
    m.x = m.y = 0;
    if (tm && is_pool_or_lava(tm.x, tm.y)) {
        return;
    }
    if (num > NO_TRAP && num < TRAPNUM) {
        kind = num;
    } else if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        kind = traptype_roguelvl();
    } else if (In_hell(game.u.uz) && !rn2(5)) {
        /* bias the frequency of fire traps in Gehennom */
        kind = FIRE_TRAP;
    } else {
        do {
            kind = await traptype_rnd(mktrapflags);
        } while (kind == NO_TRAP);
    }
    if (((kind) == HOLE || (kind) == TRAPDOOR) && !Can_fall_thru(game.u.uz)) {
        kind = ROCKTRAP;
    }
    if (tm) {
        Object.assign(m, tm);
    } else {
        let tryct = 0;
        let avoid_boulder = (((kind) == PIT || (kind) == SPIKED_PIT) || ((kind) == HOLE || (kind) == TRAPDOOR));
        do {
            if (++tryct > 200) {
                return;
            }
            if ((mktrapflags & 2) != 0) {
                await mazexy(m);
            } else if (croom && !somexyspace(croom, m)) {
                return;
            }
        } while (occupied(m.x, m.y) || (avoid_boulder && sobj_at(BOULDER, m.x, m.y)));
    }
    t = await maketrap(m.x, m.y, kind);
    /* we should always get type of trap we're asking for (occupied() test
       should prevent cases where that might not happen) but be paranoid */
    kind = t ? t.ttyp : NO_TRAP;
    if (kind == WEB && !(mktrapflags & 4)) {
        await makemon(game.mons[PM_GIANT_SPIDER], m.x, m.y, 0);
    }
    if (t && (mktrapflags & 1)) {
        t.tseen = (1);
    }
    if (kind == MAGIC_PORTAL && (game.u.ucamefrom.dnum || game.u.ucamefrom.dlevel)) {
        assign_level(t.dst, game.u.ucamefrom);
    }
    /* The hero isn't the only person who's entered the dungeon in
       search of treasure. On the very shallowest levels, there's a
       chance that a created trap will have killed something already
       (and this is guaranteed on the first level).

       This isn't meant to give any meaningful treasure (in fact, any
       items we drop here are typically cursed, other than ammo fired
       by the trap). Rather, it's mostly just for flavour and to give
       players on very early levels a sufficient chance to avoid traps
       that may end up killing them before they have a fair chance to
       build max HP. Including cursed items gives the same fair chance
       to the starting pet, and fits the rule that possessions of the
       dead are normally cursed.

       Some types of traps are excluded because they're entirely
       nonlethal, even indirectly. We also exclude all of the
       later/fancier traps because they tend to have special
       considerations (e.g. webs, portals), often are indirectly
       lethal, and tend not to generate on shallower levels anyway
       (exception: magic traps can generate on dlvl 1 and be
       immediately lethal). Finally, pits are excluded because it's
       weird to see an item in a pit and yet not be able to identify
       that the pit is there. */
    if (game.in_mklev && kind != NO_TRAP && !(mktrapflags & 8) && lvl <= rnd(4) && kind != SQKY_BOARD && kind != RUST_TRAP && !(kind == ROLLING_BOULDER_TRAP && t.launch.x == t.tx && t.launch.y == t.ty) && !((kind) == PIT || (kind) == SPIKED_PIT) && (kind < HOLE || kind == MAGIC_TRAP)) {
        if (kind == LANDMINE) {
            /* rolling boulder trap might not have a boulder if there was no
           viable path (such as when placed in the corner of a room), in
           which case tx,ty==launch.x,y; no boulder => no dead predecessor */
            /* if victim was killed by a land mine, we won't scatter objects;
               treat it as exploded, converting it into an unconcealed pit */
            t.ttyp = PIT;
            t.tseen = 1;
        }
        await mktrap_victim(t);
    }
    return;
}
/* Create stairs up or down at x,y.
   If force is TRUE, change the terrain to ROOM first */
/* [why 'char' when usage is boolean?] */
export async function mkstairs(x, y, up, croom, force) {
    let ltyp = 0;
    let dest = { dnum: 0, dlevel: 0 };
    if (!x || !isok(x, y)) {
        await impossible("mkstairs:  bogus stair attempt at <%d,%d>", x, y);
        return;
    }
    if (force) {
        game.level.locations[x][y].typ = ROOM;
    }
    /* somexyspace() allows ice */
    ltyp = game.level.locations[x][y].typ;
    if (ltyp != ROOM && ltyp != CORR && ltyp != ICE) {
        let glyph = await back_to_glyph(x, y);
        let sidx = glyph_to_cmap(glyph);
        await impossible("mkstairs:  placing stairs %s on %s at <%d,%d>", up ? "up" : "down", defsyms[sidx].explanation, x, y);
    }
    /*
     * We can't make a regular stair off an end of the dungeon.  This
     * attempt can happen when a special level is placed at an end and
     * has an up or down stair specified in its description file.
     */
    if (dunlev(game.u.uz) == (up ? 1 : dunlevs_in_dungeon(game.u.uz))) {
        return;
    }
    dest.dnum = game.u.uz.dnum;
    dest.dlevel = game.u.uz.dlevel + (up ? -1 : 1);
    stairway_add(x, y, up ? (1) : (0), (0), dest);
    await set_levltyp(x, y, STAIRS);
    game.level.locations[x][y].flags = up ? 1 : 2;
}
/* is room a good one to generate up or down stairs in? */
export function generate_stairs_room_good(croom, phase) {
    /*
     * phase values, smaller allows for more relaxed criteria:
     *  2 == no relaxed criteria;
     *  1 == allow a themed room;
     *  0 == allow same room as existing up/downstairs;
     * -1 == allow an unjoined room.
     */
    return (croom && (croom.needjoining || (phase < 0)) && ((!has_dnstairs(croom) && !has_upstairs(croom)) || phase < 1) && (croom.rtype == OROOM || ((phase < 2) && croom.rtype == THEMEROOM)));
}
/* find a good room to generate an up or down stairs in */
export function generate_stairs_find_room() {
    let croom = null;
    let i = 0;
    let phase = 0;
    let ai = 0;
    let rmarr = null;
    if (!game.nroom) {
        return null;
    }
    rmarr = alloc(4 /* sizeof(int) */ * game.nroom);
    for (phase = 2; phase > -1; phase--) {
        ai = 0;
        for (i = 0; i < game.nroom; i++) {
            if (generate_stairs_room_good(game.rooms[i], phase)) {
                rmarr[ai++] = i;
            }
        }
        if (ai > 0) {
            i = rmarr[rn2(ai)];
            free(rmarr);
            return game.rooms[i];
        }
    }
    free(rmarr);
    croom = game.rooms[rn2(game.nroom)];
    return croom;
}
/* construct stairs up and down within the same branch,
   up and down in different rooms if possible */
const __generate_stairs_gen_stairs_panic = "generate_stairs: failed to find a room! (%d)";
export async function generate_stairs() {
    let croom = null;
    let pos = { x: 0, y: 0 };
    if (!Is_botlevel(game.u.uz)) {
        /* if there is only 1 room and we found it above, this will find
           it again */
        if ((croom = generate_stairs_find_room()) == (null)) {
            await panic(__generate_stairs_gen_stairs_panic, game.nroom);
        }
        if (!somexyspace(croom, pos)) {
            pos.x = somex(croom);
            pos.y = somey(croom);
        }
        await mkstairs(pos.x, pos.y, 0, croom, (0));
    }
    if (game.u.uz.dlevel != 1) {
        if ((croom = generate_stairs_find_room()) == (null)) {
            await panic(__generate_stairs_gen_stairs_panic, game.nroom);
        }
        if (!somexyspace(croom, pos)) {
            pos.x = somex(croom);
            pos.y = somey(croom);
        }
        await mkstairs(pos.x, pos.y, 1, croom, (0));
    }
}
export async function mkfount(croom) {
    let m = { x: 0, y: 0 };
    if (!find_okay_roompos(croom, m)) {
        return;
    }
    if (!await set_levltyp(m.x, m.y, FOUNTAIN)) {
        return;
    }
    /* Is it a "blessed" fountain? (affects drinking from fountain) */
    if (!rn2(7)) {
        game.level.locations[m.x][m.y].horizontal = 1;
    }
    game.level.flags.nfountains++;
}
export function find_okay_roompos(croom, crd) {
    let tryct = 0;
    do {
        if (++tryct > 200) {
            return (0);
        }
        if (!somexyspace(croom, crd)) {
            return (0);
        }
    } while (occupied(crd.x, crd.y) || bydoor(crd.x, crd.y));
    return (1);
}
export async function mksink(croom) {
    let m = { x: 0, y: 0 };
    if (!find_okay_roompos(croom, m)) {
        return;
    }
    if (!await set_levltyp(m.x, m.y, SINK)) {
        return;
    }
    game.level.flags.nsinks++;
}
export async function mkaltar(croom) {
    let m = { x: 0, y: 0 };
    let al = 0;
    if (croom.rtype != OROOM) {
        return;
    }
    if (!find_okay_roompos(croom, m)) {
        return;
    }
    if (!await set_levltyp(m.x, m.y, ALTAR)) {
        return;
    }
    /* -1 - A_CHAOTIC, 0 - A_NEUTRAL, 1 - A_LAWFUL */
    al = rn2(1 + 2) - 1;
    game.level.locations[m.x][m.y].flags = ((((al) == (-128)) ? 0 : ((al) == 1) ? 4 : ((al) + 2)));
}
export async function mkgrave(croom) {
    let m = { x: 0, y: 0 };
    let tryct = 0;
    let otmp = null;
    let dobell = !rn2(10);
    if (croom.rtype != OROOM) {
        return;
    }
    if (!find_okay_roompos(croom, m)) {
        return;
    }
    await make_grave(m.x, m.y, dobell ? "Saved by the bell!" : null);
    if (!rn2(3)) {
        let gold = await mksobj(GOLD_PIECE, (1), (0));
        gold.quan = (rnd(20) + await level_difficulty() * rnd(5));
        gold.owt = await weight(gold);
        gold.ox = m.x , gold.oy = m.y;
        await add_to_buried(gold);
    }
    for (tryct = rn2(5); tryct; tryct--) {
        otmp = await mkobj(RANDOM_CLASS, (1));
        if (!otmp) {
            return;
        }
        await curse(otmp);
        otmp.ox = m.x;
        otmp.oy = m.y;
        await add_to_buried(otmp);
    }
    if (dobell) {
        await mksobj_at(BELL, m.x, m.y, (1), (0));
    }
    return;
}
/*
 * Major level transmutation:  add a set of stairs (to the Sanctum) after
 * an earthquake that leaves behind a new topology, centered at inv_pos.
 * Assumes there are no rooms within the invocation area and that svi.inv_pos
 * is not too close to the edge of the map.  Also assume the hero can see,
 * which is guaranteed for normal play due to the fact that sight is needed
 * to read the Book of the Dead.  [That assumption is not valid; it is
 * possible that "the Book reads the hero" rather than vice versa if
 * attempted while blind (in order to make blind-from-birth conduct viable).]
 */
export async function mkinvokearea() {
    let dist = 0;
    let wallct = 0;
    let xmin = 0;
    let xmax = 0;
    let ymin = 0;
    let ymax = 0;
    let i = 0;
    await pline_The("floor shakes violently under you!");
{
        /* reset after the check for walls */
        xmin = xmax = game.inv_pos.x;
        ymin = ymax = game.inv_pos.y;
        wallct = mkinvk_check_wall(xmin, ymin);
        for (dist = 1; !wallct && dist < 7; ++dist) {
            /* decide whether to issue the crumbling walls message */
            /* this replicates the somewhat convoluted loop below, working
           out from the stair position, except for stopping early when
           walls are found */
            xmin-- , xmax++;
            if (dist != 3) {
                /* the area is wider that it is high */
                ymin-- , ymax++;
                for (i = xmin + 1; i < xmax; i++) {
                    if (mkinvk_check_wall(i, ymin)) {
                        ++wallct;
                    }
                    /* we could break after finding first wall
                                   * but it isn't a significant optimization
                                   * for code which only executes once */
                    if (mkinvk_check_wall(i, ymax)) {
                        ++wallct;
                    }
                }
            }
            if (!wallct) {
                for (i = ymin; i <= ymax; i++) {
                    /* skip y loop if x loop found any walls */
                    if (mkinvk_check_wall(xmin, i)) {
                        ++wallct;
                    }
                    if (mkinvk_check_wall(xmax, i)) {
                        ++wallct;
                    }
                }
            }
        }
        if (wallct) {
            await pline_The("walls around you begin to bend and crumble!");
        }
    }
    await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
    if (game.u.utrap) {
        /* any trap hero is stuck in will be going away now */
        if (game.u.utraptype == TT_BURIEDBALL) {
            await buried_ball_to_punishment();
        }
        await reset_utrap((0));
    }
    xmin = xmax = game.inv_pos.x;
    ymin = ymax = game.inv_pos.y;
    await mkinvpos(xmin, ymin, 0);
    for (dist = 1; dist < 7; dist++) {
        xmin--;
        xmax++;
        if (dist != 3) {
            ymin--;
            ymax++;
            for (i = xmin + 1; i < xmax; i++) {
                await mkinvpos(i, ymin, dist);
                await mkinvpos(i, ymax, dist);
            }
        }
        for (i = ymin; i <= ymax; i++) {
            await mkinvpos(xmin, i, dist);
            await mkinvpos(xmax, i, dist);
        }
        await flush_screen(1);
        (game.windowprocs.win_delay_output)();
    }
    await You("are standing at the top of a stairwell leading down!");
    await mkstairs(game.u.ux, game.u.uy, 0, null, (0));
    await newsym(game.u.ux, game.u.uy);
    game.vision_full_recalc = 1;
}
/* Change level topology.  Boulders in the vicinity are eliminated.
 * Temporarily overrides vision in the name of a nice effect.
 */
export async function mkinvpos(x, y, dist) {
    let ttmp = null;
    let otmp = null;
    let make_rocks = 0;
    let lev = game.level.locations[x][y];
    let mon = null;
    if (!((x) >= (2) && (x) <= (game.x_maze_max) && (y) >= (2) && (y) <= (game.y_maze_max))) {
        if (dist < (7 - 2)) {
            /* maze levels have slightly different constraints from normal levels;
       these are also defined in mkmaze.c and may not be appropriate for
       mazes with corridors wider than 1 or for cavernous levels */
            /* clip at existing map borders if necessary */
            /* outermost 2 columns and/or rows may be truncated due to edge */
            let errfunc = null;
            errfunc = !isok(x, y) ? panic : impossible;
            (errfunc)("mkinvpos: <%d,%d> (%d) off map edge!", x, y, dist);
        }
        return;
    }
    if ((ttmp = t_at(x, y)) != null) {
        await deltrap(ttmp);
    }
    /* clear boulders; leave some rocks for non-{moat|trap} locations */
    make_rocks = (dist != 1 && dist != 4 && dist != 5) ? (1) : (0);
    while ((otmp = sobj_at(BOULDER, x, y)) != null) {
        if (make_rocks) {
            await fracture_rock(otmp);
            /* don't bother with more rocks */
            make_rocks = (0);
        } else {
            await obj_extract_self(otmp);
            await obfree(otmp, null);
        }
    }
    lev.seenv = 0;
    lev.flags = 0;
    if (dist < 6) {
        lev.lit = (1);
    }
    lev.waslit = (1);
    lev.horizontal = (0);
    /* short-circuit vision recalc */
    game.viz_array[y][x] = (dist < 6) ? (2 | 1) : 1;
    switch (dist) {
        case 1:
            if (is_pool(x, y)) {
                break;
            }
            lev.typ = ROOM;
            ttmp = await maketrap(x, y, FIRE_TRAP);
            if (ttmp) {
                ttmp.tseen = (1);
            }
            break;
        case 0:
        case 2:
        case 3:
        case 6:
            lev.typ = ROOM;
            break;
        case 4:
        case 5:
            lev.typ = MOAT;
            break;
        default:
            await impossible("mkinvpos called with dist %d", dist);
            break;
    }
    if ((mon = (game.level.monsters[x][y])) != null) {
        if (mon.m_ap_type) {
            await seemimic(mon);
        }
        if ((ttmp = t_at(x, y)) != null) {
            await mintrap(mon, 0);
        } else {
            await minliquid(mon);
        }
    }
    if (!does_block(x, y, lev)) {
        unblock_point(x, y);
    }
    await newsym(x, y);
}
/* reduces clutter in mkinvokearea() while avoiding potential static analyzer
   confusion about using isok(x,y) to control access to levl[x][y] */
export function mkinvk_check_wall(x, y) {
    let ltyp = 0;
    if (!isok(x, y)) {
        return 0;
    }
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    ltyp = game.level.locations[x][y].typ;
    return (((ltyp) <= DBWALL) || ltyp == IRONBARS) ? 1 : 0;
}
/*
 * The portal to Ludios is special.  The entrance can only occur within a
 * vault in the main dungeon at a depth greater than 10.  The Ludios branch
 * structure reflects this by having a bogus "source" dungeon:  the value
 * of n_dgns (thus, Is_branchlev() will never find it).
 *
 * Ludios will remain isolated until the branch is corrected by this function.
 */
export async function mk_knox_portal(x, y) {
    let source = null;
    let br = null;
    let u_depth = 0;
    br = await dungeon_branch("Fort Ludios");
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    if (on_level((game.dungeon_topology.d_knox_level), br.end1)) {
        /* dungeon_branch() panics (so never returns) if result would be Null */
        source = br.end2;
    } else {
        /* disallow Knox branch on a level with one branch already */
        if (Is_branchlev(game.u.uz)) {
            return;
        }
        source = br.end1;
    }
    /* Already set or 2/3 chance of deferring until a later level. */
    if (source.dnum < game.n_dgns || (rn2(3) && !game.flags.debug)) {
        return;
    }
    if (!(game.u.uz.dnum == (game.dungeon_topology.d_oracle_level).dnum && !await at_dgn_entrance("The Quest") && (u_depth = depth(game.u.uz)) > 10 && u_depth < depth((game.dungeon_topology.d_medusa_level)))) {
        return;
    }
    /* Adjust source to be current level and re-insert branch. */
    Object.assign(source, game.u.uz);
    await insert_branch(br, (1));
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mklev.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            await pline("Made knox portal.");
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    await place_branch(br, x, y);
}
/*mklev.c*/
/* don't try again when making next level */
/* we succeeded in digging the corridor */
/* inaccessible niches occasionally have iron bars */
/* note:  normally we'd start at x=1 because map column #0 isn't used
       (except for placing vault guard at <0,0> when removed from the map
       but not from the level); explicitly reset column #0 along with the
       rest so that we start the new level with a completely clean slate */
/* put a sleeping monster inside */
/* Note: monster may be on the stairs. This cannot be
       avoided: maybe the player fell through a trap door
       while a monster was on the stairs. Conclusion:
       we have to check for monsters on the stairs anyway. */
/* put traps and mimics inside */
/* reverse probabilities compared to non-supply chests;
               these are twice as likely to be chests than large
               boxes, rather than vice versa */
/* guarantee at least one noncursed item, with a small
                   probability of more; if we generate a cursed item, it's
                   added to the supply chest but we reroll for a noncursed
                   item and add that too */
/* bias towards lower level by generating again
                       and taking the lower-level book; do that three
                       times if on level 1 or 2, twice when deeper */
/* add_to_container() doesn't update the container's weight */
/* assign level dependent obj probabilities */
/* check for special levels */
/* used to test for place_branch() success */
/* Place multi-dungeon branch. */
/* Fill all special rooms now, regardless of whether this is a special
     * level, proto level, or ordinary level. */
/* already verifies location */
/* Null iff nroom==0 which won't get here */
/* find random coordinates for branch */
/* br_room = find_branch_room(&m); */
/* sets m via mazexy() or somexy() */
/* no item dropped by the trap */
/* these items are always cursed, both for flavour (owned
           by a dead adventurer, bones-pile-style) and for balance
           (less useful to use, and encourage pets to avoid the trap) */
/* for mktrap_victim(), PIT is actually an exploded LANDMINE */
/* landmine: if fragile object has been created, destroy it;
               don't worry about non-empty containers--they aren't
               breakable--nor about breakable contents of such */
/* elf corpses are the rarest as they're the most useful */
/* more common as they could have come from the Mines */
/* 10% chance of a candle too */
/* human is the most common result */
/* make these much less often than other traps */
/* Put a fountain at m.x, m.y */
/* Put an altar at m.x, m.y */
/* Put a grave at <m.x,m.y> */
/* Possibly fill it with objects */
/* this used to use mkgold(), which puts a stack of gold on
           the ground (or merges it with an existing one there if
           present), and didn't bother burying it; now we create a
           loose, easily buriable, stack but we make no attempt to
           replicate mkgold()'s level-based formula for the amount */
/* Leave a bell, in case we accidentally buried someone alive */
/* slightly odd if levitating, but not wrong */
/* message won't appear if the maze 'walls' on this level are lava
           or if all the walls within range have been dug away; when it does
           appear, it will describe iron bars as "walls" (which is ok) */
/* middle, before placing stairs */
/* make sure the new glyphs shows up */
/* wake up mimics, don't want to deal with them blocking vision */
/* make sure vision knows location is open */
/* display new value of position; could have a monster/object on it */
