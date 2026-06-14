import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	dungeon.c	$NHDT-Date: 1737343478 2025/01/19 19:24:38 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.228 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { get_table_int, get_table_int_opt, get_table_option, get_table_str, get_table_str_opt, luaL_checkoption, lua_getfield, lua_getglobal, lua_gettable, lua_gettop, lua_istable, lua_len, lua_next, lua_pop, lua_pushinteger, lua_pushnil, lua_settop, lua_tointeger, lua_type, nhl_done, nhl_init, nhl_loadlua } from '../c2js-runtime/lua.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, pline } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, fprintf, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strcat, strchr, strcmp, strcpy, strlen, strncmp, strncmpi, strstri } from '../c2js-runtime/string.js';
import { describe_level } from './botl.js';
import { isok } from './cmd.js';
import { db_under_typ, is_drawbridge_wall, is_ice, is_lava, is_pool } from './dbridge.js';
import { cg, vowels } from './decl.js';
import { canseemon, map_location, nul_glyphinfo, see_nearby_objects } from './display.js';
import { goto_level } from './do.js';
import { hliquid } from './do_name.js';
import { done } from './end.js';
import { in_rooms, switch_terrain } from './hack.js';
import { eos, highc, mungspaces, strsubst, trimspaces } from './hacklib.js';
import { place_lregion } from './mkmaze.js';
import { cmap_to_type } from './mkroom.js';
import { dmgtype_fromattack } from './mondata.js';
import { AGGRAVATE_MONSTER, AIR, ALTAR, ASCENDED, BLINDED, CLOUD, CORR, DBWALL, DELPHI, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, ESCAPED, FLYING, FOOT, FOUNTAIN, GRAVE, HALLUC, HALLUC_RES, LEVITATION, LR_DOWNTELE, LR_UPTELE, MAGIC_PORTAL, MAX_TYPE, M_AP_FURNITURE, PM_DWARF, ROOM, SDOOR, SHOPBASE, SINK, TEMPLE, THRONE, TREE, VAULT, VIBRATING_SQUARE } from './nh-constants.js';
import { an, makeplural } from './objnam.js';
import { body_part } from './polyself.js';
import { align_gname, altarmask_at } from './pray.js';
import { findpriest, inhistemple } from './priest.js';
import { ldrname } from './questpgr.js';
import { rn2, rnd } from './rnd.js';
import { sfi_branch, sfi_char, sfi_d_level, sfi_dgn_topology, sfi_dungeon, sfi_int, sfi_int16, sfi_linfo, sfi_mapseen_feat, sfi_mapseen_flags, sfi_mapseen_rooms, sfi_nhcoord, sfi_unsigned, sfi_xint16, sfo_branch, sfo_char, sfo_d_level, sfo_dgn_topology, sfo_dungeon, sfo_int, sfo_int16, sfo_linfo, sfo_mapseen_feat, sfo_mapseen_flags, sfo_mapseen_rooms, sfo_nhcoord, sfo_unsigned, sfo_xint16 } from './sfbase.js';
import { inhishop, shop_keeper } from './shk.js';
import { On_stairs, stairway_at, stairway_find_special_dir } from './stairs.js';
import { formatkiller } from './topten.js';
import { add_menu, add_menu_heading, add_menu_str, getlin, select_menu } from './windows.js';

// struct proto_dungeon: { tmpdungeon, tmplevel, final_lev, tmpbranch, start, n_levs, n_brs }
/* corresponding level pointers */
/* starting index of current dungeon sp levels */
/* number of tmplevel entries */
/* number of tmpbranch entries */
// struct lchoice: { idx, lev, playerlev, dgn, menuletter }
export function dumpit() {
    /* this function is used for three purposes: to provide a factor
     * of difficulty in monster generation; to provide a factor of
     * difficulty in experience calculations (botl.c and end.c); and
     * to insert the deepest level reached in the game in the topten
     * display.  the 'noquest' arg switch is required for the latter.
     *
     * from the player's point of view, going into the Quest is _not_
     * going deeper into the dungeon -- it is going back "home", where
     * the dungeon starts at level 1.  given the setup in dungeon.def,
     * the depth of the Quest (thought of as starting at level 1) is
     * never lower than the level of entry into the Quest, so we exclude
     * the Quest from the topten "deepest level reached" display
     * calculation.  _However_ the Quest is a difficult dungeon, so we
     * include it in the factor of difficulty calculations.
     */
    let i = 0;
    let x = null;
    let br = null;
    if (!debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dungeon.c", (0))) {
        return;
    }
    for (i = 0; i < game.n_dgns; i++) {
        fprintf(stderr, "\n#%d \"%s\" (%s):\n", i, game.dungeons[i].dname, game.dungeons[i].proto);
        fprintf(stderr, "    num_dunlevs %d, dunlev_ureached %d\n", game.dungeons[i].num_dunlevs, game.dungeons[i].dunlev_ureached);
        fprintf(stderr, "    depth_start %d, ledger_start %d\n", game.dungeons[i].depth_start, game.dungeons[i].ledger_start);
        fprintf(stderr, "    flags:%s%s%s\n", game.dungeons[i].flags.rogue_like ? " rogue_like" : "", game.dungeons[i].flags.maze_like ? " maze_like" : "", game.dungeons[i].flags.hellish ? " hellish" : "");
        getchar();
    }
    fprintf(stderr, "\nSpecial levels:\n");
    for (x = game.sp_levchn; x; x = x.next) {
        fprintf(stderr, "%s (%d): ", x.proto, x.rndlevs);
        fprintf(stderr, "on %d, %d; ", x.dlevel.dnum, x.dlevel.dlevel);
        fprintf(stderr, "flags:%s%s%s%s\n", x.flags.rogue_like ? " rogue_like" : "", x.flags.maze_like ? " maze_like" : "", x.flags.hellish ? " hellish" : "", x.flags.town ? " town" : "");
        getchar();
    }
    fprintf(stderr, "\nBranches:\n");
    /* Find the branch that connects to dungeon i's branch. */
    for (br = game.branches; br; br = br.next) {
        fprintf(stderr, "%d: %s, end1 %d %d, end2 %d %d, %s\n", br.id, br.type == 0 ? "stair" : br.type == 1 ? "no end1" : br.type == 2 ? "no end2" : br.type == 3 ? "portal" : "unknown", br.end1.dnum, br.end1.dlevel, br.end2.dnum, br.end2.dlevel, br.end1_up ? "end1 up" : "end1 down");
    }
    getchar();
    fprintf(stderr, "\nDone\n");
    getchar();
    return;
}
/* Save the dungeon structures. */
export function save_dungeon(nhfp, perform_write, free_data) {
    let i = 0;
    let count = 0;
    let curr = null;
    let next = null;
    let curr_ms = null;
    let next_ms = null;
    if (perform_write) {
        sfo_int(nhfp, { get value() { return game.n_dgns; }, set value(_v) { game.n_dgns = _v; } }, "dungeon_count");
        for (i = 0; i < game.n_dgns; ++i) {
            sfo_dungeon(nhfp, game.dungeons[i], "dungeon");
        }
        sfo_dgn_topology(nhfp, game.dungeon_topology, "svd.dungeon_topology");
        sfo_char(nhfp, game.tune, "tune", 6 /* sizeof(char [6]) */);
        for (count = 0 , curr = game.branches; curr; curr = curr.next) {
            count++;
        }
        sfo_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "branch_count");
        for (curr = game.branches; curr; curr = curr.next) {
            sfo_branch(nhfp, curr, "branch");
        }
        count = maxledgerno();
        sfo_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "level_info_count");
        for (i = 0; i < count; ++i) {
            sfo_linfo(nhfp, game.level_info[i], "svl.level_info");
        }
        sfo_nhcoord(nhfp, game.inv_pos, "svi.inv_pos");
        for (count = 0 , curr_ms = game.mapseenchn; curr_ms; curr_ms = curr_ms.next) {
            count++;
        }
        sfo_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "mapseen_count");
        for (curr_ms = game.mapseenchn; curr_ms; curr_ms = curr_ms.next) {
            save_mapseen(nhfp, curr_ms);
        }
    }
    if (free_data) {
        for (curr = game.branches; curr; curr = next) {
            next = curr.next;
            free(curr);
        }
        game.branches = null;
        for (curr_ms = game.mapseenchn; curr_ms; curr_ms = next_ms) {
            next_ms = curr_ms.next;
            if (curr_ms.custom) {
                free(curr_ms.custom);
            }
            if (curr_ms.final_resting_place) {
                savecemetery(nhfp, curr_ms.final_resting_place);
            }
            free(curr_ms);
        }
        game.mapseenchn = null;
    }
}
/* !SFCTOOL */
/* Restore the dungeon structures. */
export async function restore_dungeon(nhfp) {
    let curr = null;
    let last = null;
    let count = 0;
    let i = 0;
    let curr_ms = null;
    let last_ms = null;
    sfi_int(nhfp, { get value() { return game.n_dgns; }, set value(_v) { game.n_dgns = _v; } }, "dungeon_count");
    ;
    for (i = 0; i < game.n_dgns; ++i) {
        sfi_dungeon(nhfp, game.dungeons[i], "dungeon");
    }
    sfi_dgn_topology(nhfp, game.dungeon_topology, "svd.dungeon_topology");
    sfi_char(nhfp, game.tune, "tune", 6 /* sizeof(char [6]) */);
    last = game.branches = null;
    sfi_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "branch_count");
    ;
    for (i = 0; i < count; i++) {
        curr = alloc(1 /* sizeof(branch) */);
        sfi_branch(nhfp, curr, "branch");
        curr.next = null;
        if (last) {
            last.next = curr;
        } else {
            game.branches = curr;
        }
        last = curr;
    }
    sfi_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "level_info_count");
    ;
    if (count >= (16 * 32)) {
        await panic("level information count larger (%d) than allocated size", count);
    }
    for (i = 0; i < count; ++i) {
        sfi_linfo(nhfp, game.level_info[i], "svl.level_info");
    }
    sfi_nhcoord(nhfp, game.inv_pos, "svi.inv_pos");
    sfi_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "mapseen_count");
    ;
    last_ms = null;
    for (i = 0; i < count; i++) {
        curr_ms = load_mapseen(nhfp);
        curr_ms.next = null;
        if (last_ms) {
            last_ms.next = curr_ms;
        } else {
            game.mapseenchn = curr_ms;
        }
        last_ms = curr_ms;
    }
}
export async function dname_to_dnum(s) {
    let i = 0;
    for (i = 0; i < game.n_dgns; i++) {
        if (!strcmp(game.dungeons[i].dname, s)) {
            return i;
        }
    }
    await panic("Couldn't resolve dungeon number for name \"%s\".", s);
    return 0;
}
export function find_level(s) {
    let curr = null;
    for (curr = game.sp_levchn; curr; curr = curr.next) {
        if (!strncmpi((s), (curr.proto), -1)) {
            break;
        }
    }
    return curr;
}
/* Find the branch that links the named dungeon. */
/* dungeon name */
export async function find_branch(s, pd) {
    let i = 0;
    if (pd) {
        for (i = 0; i < pd.n_brs; i++) {
            if (!strcmp(pd.tmpbranch[i].name, s)) {
                break;
            }
        }
        if (i == pd.n_brs) {
            await panic("find_branch: can't find %s", s);
        }
    } else {
        /* support for level tport by name */
        let br = null;
        let dnam = null;
        for (br = game.branches; br; br = br.next) {
            dnam = game.dungeons[br.end2.dnum].dname;
            if (!strncmpi((dnam), (s), -1) || (!strncmpi(dnam, "The ", 4) && !strncmpi((__nh_advance_str(dnam, 4)), (s), -1))) {
                break;
            }
        }
        i = br ? ((ledger_no(br.end1) << 8) | ledger_no(br.end2)) : -1;
    }
    return i;
}
/*
 * Find the "parent" by searching the prototype branch list for the branch
 * listing, then figuring out to which dungeon it belongs.
 */
/* dungeon name */
export async function parent_dnum(s, pd) {
    let i = 0;
    let pdnum = 0;
    i = await find_branch(s, pd);
    /*
     * Got branch, now find parent dungeon.  Stop if we have reached
     * "this" dungeon (if we haven't found it by now it is an error).
     */
    for (pdnum = 0; strcmp(pd.tmpdungeon[pdnum].name, s); pdnum++) {
        if ((i -= pd.tmpdungeon[pdnum].branches) < 0) {
            return pdnum;
        }
    }
    await panic("parent_dnum: couldn't resolve branch.");
    return 0;
}
/*
 * Return a starting point and number of successive positions a level
 * or dungeon entrance can occupy.
 *
 * Note: This follows the acouple (instead of the rcouple) rules for a
 *       negative random component (randc < 0).  These rules are found
 *       in dgn_comp.y.  The acouple [absolute couple] section says that
 *       a negative random component means from the (adjusted) base to the
 *       end of the dungeon.
 */
export async function level_range(dgn, base, randc, chain, pd, adjusted_base) {
    let lmax = game.dungeons[dgn].num_dunlevs;
    if (chain >= 0) {
        /* relative to a special level */
        let levtmp = pd.final_lev[chain];
        if (!levtmp) {
            await panic("level_range: empty chain level!");
        }
        base += levtmp.dlevel.dlevel;
    } else {
        if (base < 0) {
            base = (lmax + base + 1);
        }
    }
    if (base < 1 || base > lmax) {
        await panic("level_range: base value out of range");
    }
    adjusted_base.value = base;
    if (randc == -1) {
        /* from base to end of dungeon */
        return (lmax - base + 1);
    } else if (randc) {
        /* make sure we don't run off the end of the dungeon */
        return (((base + randc - 1) > lmax) ? lmax - base + 1 : randc);
    }
    return 1;
}
export async function parent_dlevel(s, pd) {
    fnEnter("parent_dlevel", "dungeon.c", 0);
    let i = 0;
    let j = 0;
    let num = 0;
    let base = 0;
    let dnum = await parent_dnum(s, pd);
    let curr = null;
    i = await find_branch(s, pd);
    num = await level_range(dnum, pd.tmpbranch[i].lev.base, pd.tmpbranch[i].lev.rand, pd.tmpbranch[i].chain, pd, { get value() { return base; }, set value(_v) { base = _v; } });
    /* KMH -- Try our best to find a level without an existing branch */
    i = j = rn2(num);
    do {
        if (++i >= num) {
            i = 0;
        }
        for (curr = game.branches; curr; curr = curr.next) {
            if ((curr.end1.dnum == dnum && curr.end1.dlevel == base + i) || (curr.end2.dnum == dnum && curr.end2.dlevel == base + i)) {
                break;
            }
        }
    } while (curr && i != j);
    return (base + i);
}
/* Convert from the temporary branch type to the dungeon branch type. */
export async function correct_branch_type(tbr) {
    switch (tbr.type) {
        /* players are computer scientists: 0, 1, 2, n */
        case 0:
            return 0;
        /* an() returns too much.  index/strchr is ok in this case */
        case 1:
            return tbr.up ? 1 : 2;
        case 2:
            return tbr.up ? 2 : 1;
        case 3:
            return 3;
    }
    await impossible("correct_branch_type: unknown branch type");
    return 0;
}
/*
 * Add the given branch to the branch list.  The branch list is ordered
 * by end1 dungeon and level followed by end2 dungeon and level.  If
 * extract_first is true, then the branch is already part of the list
 * but needs to be repositioned.
 */
export async function insert_branch(new_branch, extract_first) {
    let curr = null;
    let prev = null;
    let new_val = 0;
    let curr_val = 0;
    let prev_val = 0;
    if (extract_first) {
        for (prev = null , curr = game.branches; curr; prev = curr , curr = curr.next) {
            if (curr == new_branch) {
                break;
            }
        }
        if (!curr) {
            await panic("insert_branch: not found");
        }
        if (prev) {
            prev.next = curr.next;
        } else {
            game.branches = curr.next;
        }
    }
    new_branch.next = null;
    /* Convert the branch into a unique number so we can sort them. */
    /*
     * Insert the new branch into the correct place in the branch list.
     */
    prev = null;
    prev_val = -1;
    new_val = ((((new_branch).end1.dnum * (32 + 1) + (new_branch).end1.dlevel) * (16 + 1) * (32 + 1)) + ((new_branch).end2.dnum * (32 + 1) + (new_branch).end2.dlevel));
    for (curr = game.branches; curr; prev_val = curr_val , prev = curr , curr = curr.next) {
        curr_val = ((((curr).end1.dnum * (32 + 1) + (curr).end1.dlevel) * (16 + 1) * (32 + 1)) + ((curr).end2.dnum * (32 + 1) + (curr).end2.dlevel));
        if (prev_val < new_val && new_val <= curr_val) {
            break;
        }
    }
    if (prev) {
        new_branch.next = curr;
        prev.next = new_branch;
    } else {
        new_branch.next = game.branches;
        game.branches = new_branch;
    }
}
/* Add a dungeon branch to the branch list. */
let __add_branch_branch_id = 0;
__nh_register_static(() => { __add_branch_branch_id = 0; });
export async function add_branch(dgn, child_entry_level, pd) {
    let branch_num = 0;
    let new_branch = null;
    branch_num = await find_branch(game.dungeons[dgn].dname, pd);
    new_branch = alloc(1 /* sizeof(branch) */);
    memset(new_branch, 0, 1 /* sizeof(branch) */);
    new_branch.next = null;
    new_branch.id = __add_branch_branch_id++;
    new_branch.type = await correct_branch_type(pd.tmpbranch[branch_num]);
    new_branch.end1.dnum = await parent_dnum(game.dungeons[dgn].dname, pd);
    new_branch.end1.dlevel = await parent_dlevel(game.dungeons[dgn].dname, pd);
    new_branch.end2.dnum = dgn;
    new_branch.end2.dlevel = child_entry_level;
    new_branch.end1_up = pd.tmpbranch[branch_num].up ? (1) : (0);
    await insert_branch(new_branch, (0));
    return new_branch;
}
/*
 * Add new level to special level chain.  Insert it in level order with the
 * other levels in this dungeon.  This assumes that we are never given a
 * level that has a dungeon number less than the dungeon number of the
 * last entry.
 */
export function add_level(new_lev) {
    let prev = null;
    let curr = null;
    prev = null;
    for (curr = game.sp_levchn; curr; curr = curr.next) {
        if (curr.dlevel.dnum == new_lev.dlevel.dnum && curr.dlevel.dlevel > new_lev.dlevel.dlevel) {
            break;
        }
        prev = curr;
    }
    if (!prev) {
        new_lev.next = game.sp_levchn;
        game.sp_levchn = new_lev;
    } else {
        new_lev.next = curr;
        prev.next = new_lev;
    }
}
export function init_level(dgn, proto_index, pd) {
    fnEnter("init_level", "dungeon.c", 0);
    let new_level = null;
    let tlevel = pd.tmplevel[proto_index];
    pd.final_lev[proto_index] = null;
    if (!game.flags.debug && tlevel.chance <= rn2(100)) {
        return;
    }
    pd.final_lev[proto_index] = new_level = alloc(1 /* sizeof(s_level) */);
    memset(new_level, 0, 1 /* sizeof(s_level) */);
    new_level.proto = strcpy(new_level.proto, tlevel.name);
    /* load new level with data */
    new_level.boneid = tlevel.boneschar;
    new_level.dlevel.dnum = dgn;
    new_level.dlevel.dlevel = 0;
    new_level.flags.town = !!(tlevel.flags & 1);
    new_level.flags.hellish = !!(tlevel.flags & 2);
    new_level.flags.maze_like = !!(tlevel.flags & 4);
    new_level.flags.rogue_like = !!(tlevel.flags & 8);
    new_level.flags.align = ((tlevel.flags & 112) >> 4);
    if (!new_level.flags.align) {
        new_level.flags.align = ((pd.tmpdungeon[dgn].flags & 112) >> 4);
    }
    new_level.rndlevs = tlevel.rndlevs;
    new_level.next = null;
}
/* prototype index */
/* array MAXLEVEL+1 in length */
export async function possible_places(idx, map, pd) {
    let i = 0;
    let start = 0;
    let count = 0;
    let lev = pd.final_lev[idx];
    /* init level possibilities */
    for (i = 0; i <= 32; i++) {
        map[i] = (0);
    }
    count = await level_range(lev.dlevel.dnum, pd.tmplevel[idx].lev.base, pd.tmplevel[idx].lev.rand, pd.tmplevel[idx].chain, pd, { get value() { return start; }, set value(_v) { start = _v; } });
    for (i = start; i < start + count; i++) {
        map[i] = (1);
    }
    for (i = pd.start; i < idx; i++) {
        if (pd.final_lev[i] && map[pd.final_lev[i].dlevel.dlevel]) {
            /* mark off already placed levels */
            map[pd.final_lev[i].dlevel.dlevel] = (0);
            --count;
        }
    }
    return count;
}
/* Pick the nth TRUE entry in the given boolean array. */
/* an array MAXLEVEL+1 in size */
export async function pick_level(map, nth) {
    let i = 0;
    for (i = 1; i <= 32; i++) {
        if (map[i] && !nth--) {
            return i;
        }
    }
    await panic("pick_level:  ran out of valid levels");
    return 0;
}
/*
 * Place a level.  First, find the possible places on a dungeon map
 * template.  Next pick one.  Then try to place the next level.  If
 * successful, we're done.  Otherwise, try another (and another) until
 * all possible places have been tried.  If all possible places have
 * been exhausted, return false.
 */
export async function place_level(proto_index, pd) {
    fnEnter("place_level", "dungeon.c", 0);
    /* valid levels are 1..MAXLEVEL inclusive */
    let map = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let lev = null;
    let npossible = 0;
    if (proto_index == pd.n_levs) {
        return (1);
    }
    lev = pd.final_lev[proto_index];
    if (!lev) {
        return await place_level(proto_index + 1, pd);
    }
    npossible = await possible_places(proto_index, map, pd);
    for (; npossible; --npossible) {
        lev.dlevel.dlevel = await pick_level(map, rn2(npossible));
        if (await place_level(proto_index + 1, pd)) {
            return (1);
        }
        map[lev.dlevel.dlevel] = (0);
    }
    return (0);
}
// struct level_map: { lev_name, lev_spec }
game.level_map = [{ lev_name: "air", get lev_spec() { return game.dungeon_topology.d_air_level; } }, { lev_name: "asmodeus", get lev_spec() { return game.dungeon_topology.d_asmodeus_level; } }, { lev_name: "astral", get lev_spec() { return game.dungeon_topology.d_astral_level; } }, { lev_name: "baalz", get lev_spec() { return game.dungeon_topology.d_baalzebub_level; } }, { lev_name: "bigrm", get lev_spec() { return game.dungeon_topology.d_bigroom_level; } }, { lev_name: "castle", get lev_spec() { return game.dungeon_topology.d_stronghold_level; } }, { lev_name: "earth", get lev_spec() { return game.dungeon_topology.d_earth_level; } }, { lev_name: "fakewiz1", get lev_spec() { return game.dungeon_topology.d_portal_level; } }, { lev_name: "fire", get lev_spec() { return game.dungeon_topology.d_fire_level; } }, { lev_name: "juiblex", get lev_spec() { return game.dungeon_topology.d_juiblex_level; } }, { lev_name: "knox", get lev_spec() { return game.dungeon_topology.d_knox_level; } }, { lev_name: "medusa", get lev_spec() { return game.dungeon_topology.d_medusa_level; } }, { lev_name: "oracle", get lev_spec() { return game.dungeon_topology.d_oracle_level; } }, { lev_name: "orcus", get lev_spec() { return game.dungeon_topology.d_orcus_level; } }, { lev_name: "rogue", get lev_spec() { return game.dungeon_topology.d_rogue_level; } }, { lev_name: "sanctum", get lev_spec() { return game.dungeon_topology.d_sanctum_level; } }, { lev_name: "valley", get lev_spec() { return game.dungeon_topology.d_valley_level; } }, { lev_name: "water", get lev_spec() { return game.dungeon_topology.d_water_level; } }, { lev_name: "wizard1", get lev_spec() { return game.dungeon_topology.d_wiz1_level; } }, { lev_name: "wizard2", get lev_spec() { return game.dungeon_topology.d_wiz2_level; } }, { lev_name: "wizard3", get lev_spec() { return game.dungeon_topology.d_wiz3_level; } }, { lev_name: "minend", get lev_spec() { return game.dungeon_topology.d_mineend_level; } }, { lev_name: "soko1", get lev_spec() { return game.dungeon_topology.d_sokoend_level; } }, { lev_name: "x-strt", get lev_spec() { return game.dungeon_topology.d_qstart_level; } }, { lev_name: "x-loca", get lev_spec() { return game.dungeon_topology.d_qlocate_level; } }, { lev_name: "x-goal", get lev_spec() { return game.dungeon_topology.d_nemesis_level; } }, { lev_name: "", lev_spec: null }];
const __get_dgn_flags_flagstrs = ["town", "hellish", "mazelike", "roguelike", "unconnected", null];
const __get_dgn_flags_flagstrs2i = [1, 2, 4, 8, 16, 0];
export async function get_dgn_flags(L) {
    let dgn_flags = 0;
    lua_getfield(L, -1, "flags");
    if (lua_type(L, -1) == 5) {
        let f = 0;
        let nflags = 0;
        lua_len(L, -1);
        nflags = lua_tointeger(L, -1);
        /* get rid of the dungeon global */
        lua_pop(L, 1);
        for (f = 0; f < nflags; f++) {
            lua_pushinteger(L, f + 1);
            lua_gettable(L, -2);
            if (lua_type(L, -1) == 4) {
                dgn_flags |= __get_dgn_flags_flagstrs2i[luaL_checkoption(L, -1, (null), __get_dgn_flags_flagstrs)];
                lua_pop(L, 1);
            } else {
                await impossible("flags[%i] is not a string", f);
            }
        }
    } else if (lua_type(L, -1) == 4) {
        dgn_flags |= __get_dgn_flags_flagstrs2i[luaL_checkoption(L, -1, (null), __get_dgn_flags_flagstrs)];
    } else if (lua_type(L, -1) != 0) {
        await impossible("flags is not an array or string");
    }
    lua_pop(L, 1);
    return dgn_flags;
}
const __get_dgn_align_dgnaligns = ["unaligned", "noalign", "lawful", "neutral", "chaotic", null];
const __get_dgn_align_dgnaligns2i = [0, 0, (4 << 4), (2 << 4), (1 << 4), 0];
export function get_dgn_align(L) {
    let a = __get_dgn_align_dgnaligns2i[get_table_option(L, "alignment", "unaligned", __get_dgn_align_dgnaligns)];
    return a;
}
export async function init_dungeon_levels(L, pd, dngidx) {
    let lvl_name = null;
    let lvl_bonetag = null;
    let lvl_chain = null;
    let lvl_base = 0;
    let lvl_range = 0;
    let lvl_nlevels = 0;
    let lvl_chance = 0;
    let lvl_align = 0;
    let lvl_flags = 0;
    let tmpl = null;
    let bi = 0;
    let f = 0;
    let nlevels = 0;
    lua_len(L, -1);
    nlevels = lua_tointeger(L, -1);
    pd.tmpdungeon[dngidx].levels = nlevels;
    lua_pop(L, 1);
    for (f = 0; f < nlevels; f++) {
        lua_pushinteger(L, f + 1);
        lua_gettable(L, -2);
        if (lua_type(L, -1) == 5) {
            lvl_name = get_table_str(L, "name");
            lvl_bonetag = get_table_str_opt(L, "bonetag", game.emptystr);
            lvl_chain = get_table_str_opt(L, "chainlevel", null);
            lvl_base = get_table_int(L, "base");
            lvl_range = get_table_int_opt(L, "range", 0);
            lvl_nlevels = get_table_int_opt(L, "nlevels", 0);
            lvl_chance = get_table_int_opt(L, "chance", 100);
            lvl_align = get_dgn_align(L);
            lvl_flags = await get_dgn_flags(L);
            /* array index is offset by cumulative number of levels
               defined for preceding branches (iterations of 'while'
               loop we're inside, not branch connections below) */
            tmpl = pd.tmplevel[pd.n_levs + f];
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dungeon.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    await pline("LEVEL[%i]:%s,(%i,%i)", f, lvl_name, lvl_base, lvl_range);
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            tmpl.name = lvl_name;
            tmpl.chainlvl = lvl_chain;
            tmpl.lev.base = lvl_base;
            tmpl.lev.rand = lvl_range;
            tmpl.chance = lvl_chance;
            tmpl.rndlevs = lvl_nlevels;
            tmpl.flags = lvl_flags | lvl_align;
            tmpl.boneschar = __nh_char_at0(lvl_bonetag) ? __nh_char_at0(lvl_bonetag) : 0;
            free(lvl_bonetag);
            tmpl.chain = -1;
            if (lvl_chain) {
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dungeon.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        await pline("CHAINLEVEL: %s", lvl_chain);
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                for (bi = 0; bi < pd.n_levs + f; bi++) {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dungeon.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            await pline("checking(%i):%s", bi, pd.tmplevel[bi].name);
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                    if (!strcmp(pd.tmplevel[bi].name, lvl_chain)) {
                        tmpl.chain = bi;
                        break;
                    }
                }
                if (tmpl.chain == -1) {
                    await panic("Could not chain level %s to %s", lvl_name, lvl_chain);
                }
            }
        } else {
            await panic("dungeon[%i].levels[%i] is not a hash", dngidx, f);
        }
        lua_pop(L, 1);
    }
    pd.n_levs += nlevels;
    if (pd.n_levs > 50) {
        await panic("init_dungeon: too many special levels");
    }
}
const __init_dungeon_branches_brdirstr = ["up", "down", null];
const __init_dungeon_branches_brdirstr2i = [(1), (0), (0)];
const __init_dungeon_branches_brtypes = ["stair", "portal", "no_down", "no_up", null];
const __init_dungeon_branches_brtypes2i = [0, 3, 2, 1, 0];
export async function init_dungeon_branches(L, pd, dngidx) {
    let br_name = null;
    let br_chain = null;
    let br_base = 0;
    let br_range = 0;
    let br_type = 0;
    let br_up = 0;
    let tmpb = null;
    let bi = 0;
    let f = 0;
    let nbranches = 0;
    lua_len(L, -1);
    nbranches = lua_tointeger(L, -1);
    pd.tmpdungeon[dngidx].branches = nbranches;
    lua_pop(L, 1);
    for (f = 0; f < nbranches; f++) {
        lua_pushinteger(L, f + 1);
        lua_gettable(L, -2);
        if (lua_type(L, -1) == 5) {
            br_name = get_table_str(L, "name");
            br_chain = get_table_str_opt(L, "chainlevel", null);
            br_base = get_table_int(L, "base");
            br_range = get_table_int_opt(L, "range", 0);
            br_type = __init_dungeon_branches_brtypes2i[get_table_option(L, "branchtype", "stair", __init_dungeon_branches_brtypes)];
            br_up = __init_dungeon_branches_brdirstr2i[get_table_option(L, "direction", "down", __init_dungeon_branches_brdirstr)];
            tmpb = (pd.tmpbranch[pd.n_brs + f]);
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dungeon.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    await pline("BRANCH[%i]:%s,(%i,%i)", f, br_name, br_base, br_range);
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            tmpb.name = br_name;
            tmpb.lev.base = br_base;
            tmpb.lev.rand = br_range;
            tmpb.type = br_type;
            tmpb.up = br_up;
            tmpb.chain = -1;
            if (br_chain) {
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dungeon.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        await pline("CHAINBRANCH:%s", br_chain);
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                for (bi = 0; bi < pd.n_levs + f - 1; bi++) {
                    if (!strcmp(pd.tmplevel[bi].name, br_chain)) {
                        tmpb.chain = bi;
                        break;
                    }
                }
                if (tmpb.chain == -1) {
                    await panic("Could not chain branch %s to level %s", br_name, br_chain);
                }
                free(br_chain);
            }
        } else {
            await panic("dungeon[%i].branches[%i] is not a hash", dngidx, f);
        }
        lua_pop(L, 1);
    }
    pd.n_brs += nbranches;
    if (pd.n_brs > 32) {
        await panic("init_dungeon: too many branches");
    }
}
export function init_dungeon_set_entry(pd, dngidx) {
    let dgn_entry = pd.tmpdungeon[dngidx].entry_lev;
    if (dgn_entry < 0) {
        /*
     * Set the entry level for this dungeon.  The entry value means:
     *              < 0     from bottom (-1 == bottom level)
     *                0     default (top)
     *              > 0     actual level (1 = top)
     *
     * Note that the entry_lev field in the dungeon structure is
     * redundant.  It is used only here and in print_dungeon().
     */
        game.dungeons[dngidx].entry_lev = game.dungeons[dngidx].num_dunlevs + dgn_entry + 1;
        if (game.dungeons[dngidx].entry_lev <= 0) {
            game.dungeons[dngidx].entry_lev = 1;
        }
    } else if (dgn_entry > 0) {
        game.dungeons[dngidx].entry_lev = dgn_entry;
        if (game.dungeons[dngidx].entry_lev > game.dungeons[dngidx].num_dunlevs) {
            game.dungeons[dngidx].entry_lev = game.dungeons[dngidx].num_dunlevs;
        }
    } else {
        game.dungeons[dngidx].entry_lev = 1;
    }
}
export async function init_dungeon_set_depth(pd, dngidx) {
    let br = null;
    let from_depth = 0;
    let from_up = 0;
    br = await add_branch(dngidx, game.dungeons[dngidx].entry_lev, pd);
    if (br.end1.dnum == dngidx) {
        /* Get the depth of the connecting end. */
        from_depth = depth(br.end2);
        from_up = !br.end1_up;
    } else {
        from_depth = depth(br.end1);
        from_up = br.end1_up;
    }
    /*
     * Calculate the depth of the top of the dungeon via
     * its branch.  First, the depth of the entry point:
     *
     *  depth of branch from "parent" dungeon
     *  + -1 or 1 depending on an up or down stair or
     *    0 if portal
     *
     * Followed by the depth of the top of the dungeon:
     *
     *  - (entry depth - 1)
     *
     * We'll say that portals stay on the same depth.
     */
    game.dungeons[dngidx].depth_start = from_depth + (br.type == 3 ? 0 : (from_up ? -1 : 1)) - (game.dungeons[dngidx].entry_lev - 1);
}
export async function init_dungeon_dungeons(L, pd, dngidx) {
    let dgn_name = null;
    let dgn_bonetag = null;
    let dgn_protoname = null;
    let dgn_fill = null;
    let dgn_themerms = null;
    let dgn_base = 0;
    let dgn_range = 0;
    let dgn_align = 0;
    let dgn_entry = 0;
    let dgn_chance = 0;
    let dgn_flags = 0;
    dgn_name = get_table_str(L, "name");
    /* TODO: accept single char or "none" for bonetag */
    dgn_bonetag = get_table_str_opt(L, "bonetag", game.emptystr);
    dgn_protoname = get_table_str_opt(L, "protofile", game.emptystr);
    dgn_base = get_table_int(L, "base");
    dgn_range = get_table_int_opt(L, "range", 0);
    dgn_align = get_dgn_align(L);
    dgn_entry = get_table_int_opt(L, "entry", 0);
    dgn_chance = get_table_int_opt(L, "chance", 100);
    dgn_flags = await get_dgn_flags(L);
    dgn_fill = get_table_str_opt(L, "lvlfill", game.emptystr);
    dgn_themerms = get_table_str_opt(L, "themerooms", game.emptystr);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dungeon.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            await pline("DUNGEON[%i]: %s, base=(%i,%i)", dngidx, dgn_name, dgn_base, dgn_range);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    if (!game.flags.debug && dgn_chance && (dgn_chance <= rn2(100))) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dungeon.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                await pline("IGNORING %s", dgn_name);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        game.n_dgns--;
        free(dgn_name);
        /* free((genericptr) dgn_protoname); -- stored in pd.tmpdungeon[] */
        free(dgn_bonetag);
        free(dgn_protoname);
        free(dgn_fill);
        free(dgn_themerms);
        return (0);
    }
    lua_getfield(L, -1, "levels");
    if (lua_type(L, -1) == 5) {
        await init_dungeon_levels(L, pd, dngidx);
    } else if (lua_type(L, -1) != 0) {
        await panic("dungeon[%i].levels is not an array of hashes", dngidx);
    }
    lua_pop(L, 1);
    lua_getfield(L, -1, "branches");
    if (lua_type(L, -1) == 5) {
        await init_dungeon_branches(L, pd, dngidx);
    } else if (lua_type(L, -1) != 0) {
        await panic("dungeon[%i].branches is not an array of hashes", dngidx);
    }
    lua_pop(L, 1);
    pd.tmpdungeon[dngidx].name = dgn_name;
    pd.tmpdungeon[dngidx].protoname = dgn_protoname;
    pd.tmpdungeon[dngidx].boneschar = __nh_char_at0(dgn_bonetag) ? __nh_char_at0(dgn_bonetag) : 0;
    pd.tmpdungeon[dngidx].lev.base = dgn_base;
    pd.tmpdungeon[dngidx].lev.rand = dgn_range;
    pd.tmpdungeon[dngidx].flags = dgn_flags;
    pd.tmpdungeon[dngidx].align = dgn_align;
    pd.tmpdungeon[dngidx].chance = dgn_chance;
    pd.tmpdungeon[dngidx].entry_lev = dgn_entry;
    game.dungeons[dngidx].fill_lvl = strcpy(game.dungeons[dngidx].fill_lvl, dgn_fill);
    game.dungeons[dngidx].dname = strcpy(game.dungeons[dngidx].dname, dgn_name);
    game.dungeons[dngidx].proto = strcpy(game.dungeons[dngidx].proto, dgn_protoname);
    game.dungeons[dngidx].themerms = strcpy(game.dungeons[dngidx].themerms, dgn_themerms);
    /* FIXME: these should have length checks */
    /* FIXME: accept "none", convert that to '\0' */
    game.dungeons[dngidx].boneid = __nh_char_at0(dgn_bonetag) ? __nh_char_at0(dgn_bonetag) : 0;
    free(dgn_fill);
    free(dgn_bonetag);
    free(dgn_themerms);
    if (dgn_range) {
        game.dungeons[dngidx].num_dunlevs = (rn2(dgn_range) + (dgn_base));
    } else {
        game.dungeons[dngidx].num_dunlevs = dgn_base;
    }
    if (!dngidx) {
        game.dungeons[dngidx].ledger_start = 0;
        game.dungeons[dngidx].depth_start = 1;
        game.dungeons[dngidx].dunlev_ureached = 1;
    } else {
        game.dungeons[dngidx].ledger_start = game.dungeons[dngidx - 1].ledger_start + game.dungeons[dngidx - 1].num_dunlevs;
        game.dungeons[dngidx].dunlev_ureached = 0;
    }
    game.dungeons[dngidx].flags.hellish = !!(dgn_flags & 2);
    game.dungeons[dngidx].flags.maze_like = !!(dgn_flags & 4);
    game.dungeons[dngidx].flags.rogue_like = !!(dgn_flags & 8);
    game.dungeons[dngidx].flags.align = dgn_align & 0xF; /* C 4-bit bitfield truncation (dungeon.c:1092) */
    game.dungeons[dngidx].flags.unconnected = !!(dgn_flags & 16);
    init_dungeon_set_entry(pd, dngidx);
    if (game.dungeons[dngidx].flags.unconnected) {
        game.dungeons[dngidx].depth_start = 1;
    } else if (dngidx) {
        await init_dungeon_set_depth(pd, dngidx);
    }
    if (game.dungeons[dngidx].num_dunlevs > 32) {
        game.dungeons[dngidx].num_dunlevs = 32;
    }
    return (1);
}
/* initialize the Castle drawbridge tune */
export function init_castle_tune() {
    let i = 0;
    for (i = 0; i < 5; i++) {
        game.tune[i] = 65 + rn2(7);
    }
    game.tune[5] = 0;
}
/* fix up the special level names and locations for quick access */
export async function fixup_level_locations() {
    let i = 0;
    let x = null;
    let lev_map = null;
    for (let __nhi_lev_map = 0; (lev_map = game.level_map[__nhi_lev_map]) && (__nh_char_at0(lev_map.lev_name)); __nhi_lev_map++) {
        /*
     * Find most of the special levels and dungeons so we can access their
     * locations quickly.
     */
        x = find_level(lev_map.lev_name);
        if (x) {
            assign_level(lev_map.lev_spec, x.dlevel);
            if (!strncmp(lev_map.lev_name, "x-", 2)) {
                x.proto = sprintf(x.proto, "%s%s", game.urole.filecode, __nh_advance_str(lev_map.lev_name, 1));
            } else if (lev_map.lev_spec == (game.dungeon_topology.d_knox_level)) {
                /* This is where the name substitution on the
                 * levels of the quest dungeon occur.
                 */
                let br = null;
                /*
                 * Kludge to allow floating Knox entrance.  We
                 * specify a floating entrance by the fact that its
                 * entrance (end1) has a bogus dnum, namely n_dgns.
                 */
                /*
                 * Find the parent dungeon of this dungeon.
                 *
                 * This assumes that end2 is always the "child" and it is
                 * unique.
                 */
                for (br = game.branches; br; br = br.next) {
                    if (on_level(br.end2, (game.dungeon_topology.d_knox_level))) {
                        break;
                    }
                }
                if (br) {
                    br.end1.dnum = game.n_dgns;
                    await insert_branch(br, (1));
                }
            }
        }
    }
    (game.dungeon_topology.d_quest_dnum) = await dname_to_dnum("The Quest");
    (game.dungeon_topology.d_sokoban_dnum) = await dname_to_dnum("Sokoban");
    (game.dungeon_topology.d_mines_dnum) = await dname_to_dnum("The Gnomish Mines");
    (game.dungeon_topology.d_tower_dnum) = await dname_to_dnum("Vlad's Tower");
    (game.dungeon_topology.d_tutorial_dnum) = await dname_to_dnum("The Tutorial");
    if ((x = find_level("dummy")) != null) {
        /*
     *  I hate hardwiring these names. :-(
     */
        /* one special fixup for dummy surface level */
        i = x.dlevel.dnum;
        /* the code above puts earth one level above dungeon level #1,
           making the dummy level overlay level 1; but the whole reason
           for having the dummy level is to make earth have depth -1
           instead of 0, so adjust the start point to shift endgame up */
        /* TODO: strip "dummy" out all the way here,
           so that it's hidden from '#wizwhere' feedback. */
        if (dunlevs_in_dungeon(x.dlevel) > 1 - game.dungeons[i].depth_start) {
            game.dungeons[i].depth_start -= 1;
        }
    }
}
export function free_proto_dungeon(pd) {
    let i = 0;
    for (i = 0; i < pd.n_brs; i++) {
        free(pd.tmpbranch[i].name);
    }
    for (i = 0; i < pd.n_levs; i++) {
        free(pd.tmplevel[i].name);
        if (pd.tmplevel[i].chainlvl) {
            free(pd.tmplevel[i].chainlvl);
        }
    }
    for (i = 0; i < game.n_dgns; i++) {
        free(pd.tmpdungeon[i].name);
        free(pd.tmpdungeon[i].protoname);
    }
}
/* initialize the "dungeon" structs */
export async function init_dungeons() {
    fnEnter("init_dungeons", "dungeon.c", 0);
    let L = null;
    let i = 0;
    let cl = 0;
    let pd = { tmpdungeon: [{ name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }, { name: null, protoname: null, lev: { base: 0, rand: 0 }, flags: 0, chance: 0, levels: 0, branches: 0, entry_lev: 0, boneschar: 0, align: 0 }], tmplevel: [{ name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }, { name: null, chainlvl: null, lev: { base: 0, rand: 0 }, chance: 0, rndlevs: 0, chain: 0, flags: 0, boneschar: 0 }], final_lev: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], tmpbranch: [{ name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }, { name: null, lev: { base: 0, rand: 0 }, chain: 0, type: 0, up: 0 }], start: 0, n_levs: 0, n_brs: 0 };
    let tidx = 0;
    let sbi = { flags: 2147483648, memlimit: 1 * 1024 * 1024, steps: 0, perpcall: 1 * 1024 * 1024 };
    memset(pd, 0, 1 /* sizeof(struct proto_dungeon) */);
    pd.n_levs = pd.n_brs = 0;
    L = await nhl_init(sbi);
    if (!L) {
        await panic("%s", "'nhl_init' failed; can't continue.");
    }
    if (!await nhl_loadlua(L, "dungeon.lua")) {
        let tbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        tbuf = sprintf(tbuf, "Cannot open dungeon description - \"%s", "dungeon.lua");
        tbuf = strcat(tbuf, "\" file!");
        await panic("%s", tbuf);
    }
    if (game.iflags.window_inited) {
        (game.windowprocs.win_clear_nhwindow)(game.WIN_MAP);
    }
    game.sp_levchn = null;
    lua_settop(L, 0);
    lua_getglobal(L, "dungeon");
    if (!lua_istable(L, -1)) {
        await panic("dungeon is not a lua table");
    }
    lua_len(L, -1);
    game.n_dgns = lua_tointeger(L, -1);
    lua_pop(L, 1);
    pd.start = 0;
    pd.n_levs = 0;
    pd.n_brs = 0;
    if (game.n_dgns >= 16) {
        await panic("init_dungeons: too many dungeons");
    }
    tidx = lua_gettop(L);
    lua_pushnil(L);
    i = 0;
    while (lua_next(L, tidx) != 0) {
        if (!lua_istable(L, -1)) {
            await panic("dungeon[%i] is not a lua table", i);
        }
        if (await init_dungeon_dungeons(L, pd, i)) {
            for (; cl < pd.n_levs; cl++) {
                init_level(i, cl, pd);
            }
            if (!await place_level(pd.start, pd)) {
                await panic("init_dungeon:  couldn't place levels");
            }
            for (; pd.start < pd.n_levs; pd.start++) {
                if (pd.final_lev[pd.start]) {
                    add_level(pd.final_lev[pd.start]);
                }
            }
            i++;
        }
        lua_pop(L, 1);
    }
    lua_pop(L, 1);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dungeon.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            await pline("init_dungeon lua DONE (n_levs=%i, n_brs=%i)", pd.n_levs, pd.n_brs);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    init_castle_tune();
    await fixup_level_locations();
    nhl_done(L);
    free_proto_dungeon(pd);
    dumpit();
}
/* return the level number for lev in *this* dungeon */
export function dunlev(lev) {
    return lev.dlevel;
}
/* return the lowest level number for *this* dungeon */
export function dunlevs_in_dungeon(lev) {
    return game.dungeons[lev.dnum].num_dunlevs;
}
/* return the lowest level explored in the game*/
export function deepest_lev_reached(noquest) {
    let i = 0;
    let tmp = { dnum: 0, dlevel: 0 };
    let ret = 0;
    for (i = 0; i < game.n_dgns; i++) {
        if (noquest && i == (game.dungeon_topology.d_quest_dnum)) {
            continue;
        }
        tmp.dlevel = game.dungeons[i].dunlev_ureached;
        if (tmp.dlevel == 0) {
            continue;
        }
        tmp.dnum = i;
        if (depth(tmp) > ret) {
            ret = depth(tmp);
        }
    }
    return ret;
}
/* return a bookkeeping level number for purpose of comparisons and
   save/restore */
export function ledger_no(lev) {
    return (lev.dlevel + game.dungeons[lev.dnum].ledger_start);
}
/*
 * The last level in the bookkeeping list of level is the bottom of the last
 * dungeon in the svd.dungeons[] array.
 *
 * Maxledgerno() -- which is the max number of levels in the bookkeeping
 * list, should not be confused with dunlevs_in_dungeon(lev) -- which
 * returns the max number of levels in lev's dungeon, and both should
 * not be confused with deepest_lev_reached() -- which returns the lowest
 * depth visited by the player.
 */
export function maxledgerno() {
    return (game.dungeons[game.n_dgns - 1].ledger_start + game.dungeons[game.n_dgns - 1].num_dunlevs);
}
/* return the dungeon that this ledgerno exists in */
export async function ledger_to_dnum(ledgerno) {
    let i = 0;
    /* find i such that (i->base + 1) <= ledgerno <= (i->base + i->count) */
    for (i = 0; i < game.n_dgns; i++) {
        if (game.dungeons[i].ledger_start < ledgerno && ledgerno <= (game.dungeons[i].ledger_start + game.dungeons[i].num_dunlevs)) {
            return i;
        }
    }
    await panic("level number out of range [ledger_to_dnum(%d)]", ledgerno);
    return 0;
}
/* return the level of the dungeon this ledgerno exists in */
export async function ledger_to_dlev(ledgerno) {
    return (ledgerno - game.dungeons[await ledger_to_dnum(ledgerno)].ledger_start);
}
/* returns the depth of a level, in floors below the surface
   (note levels in different dungeons can have the same depth) */
export function depth(lev) {
    return (game.dungeons[lev.dnum].depth_start + lev.dlevel - 1);
}
/* !SFCTOOL */
/* are "lev1" and "lev2" actually the same? */
export function on_level(lev1, lev2) {
    return (lev1.dnum == lev2.dnum && lev1.dlevel == lev2.dlevel);
}
/* is this level referenced in the special level chain? */
export function Is_special(lev) {
    let levtmp = null;
    for (levtmp = game.sp_levchn; levtmp; levtmp = levtmp.next) {
        if (on_level(lev, levtmp.dlevel)) {
            return levtmp;
        }
    }
    return null;
}
/*
 * Is this a multi-dungeon branch level?  If so, return a pointer to the
 * branch.  Otherwise, return null.
 */
export function Is_branchlev(lev) {
    let curr = null;
    for (curr = game.branches; curr; curr = curr.next) {
        if (on_level(lev, curr.end1) || on_level(lev, curr.end2)) {
            return curr;
        }
    }
    return null;
}
/* returns True iff the branch 'lev' is in a branch which builds up */
export async function builds_up(lev) {
    let dptr = game.dungeons[lev.dnum];
    let br = null;
    if (dptr.num_dunlevs > 1) {
        return (dptr.entry_lev == dptr.num_dunlevs);
    }
    for (br = game.branches; br; br = br.next) {
        if (on_level(lev, br.end2)) {
            /* else, single-level branch; find branch connection that connects this
     * dungeon from a parent dungeon and determine whether it builds up from
     * that */
            return br.end1_up;
        }
    }
    await impossible("builds_up: can't find branch for dungeon %d", lev.dnum);
    return (0);
}
/* goto the next level (or appropriate dungeon) */
export async function next_level(at_stairs) {
    let stway = stairway_at(game.u.ux, game.u.uy);
    let newlevel = { dnum: 0, dlevel: 0 };
    if (at_stairs && stway) {
        stway.u_traversed = (1);
    }
    if (at_stairs && stway) {
        newlevel.dnum = stway.tolev.dnum;
        newlevel.dlevel = stway.tolev.dlevel;
        await goto_level(newlevel, at_stairs, (0), (0));
    } else {
        /* Going up a stairs or rising through the ceiling. */
        newlevel.dnum = game.u.uz.dnum;
        newlevel.dlevel = game.u.uz.dlevel + 1;
        await goto_level(newlevel, at_stairs, !at_stairs, (0));
    }
}
/* goto the previous level (or appropriate dungeon) */
export async function prev_level(at_stairs) {
    let stway = stairway_at(game.u.ux, game.u.uy);
    let newlevel = { dnum: 0, dlevel: 0 };
    if (at_stairs && stway) {
        stway.u_traversed = (1);
    }
    if (at_stairs && stway && stway.tolev.dnum != game.u.uz.dnum) {
        if (!game.u.uz.dnum && game.u.uz.dlevel == 1 && !game.u.uhave.amulet) {
            await done(ESCAPED);
        /* Taking an up dungeon branch. */
        /* KMH -- Upwards branches are okay if not level 1 */
        /* (Just make sure it doesn't go above depth 1) */
        } else {
            newlevel.dnum = stway.tolev.dnum;
            newlevel.dlevel = stway.tolev.dlevel;
            await goto_level(newlevel, at_stairs, (0), (0));
        }
    } else {
        newlevel.dnum = game.u.uz.dnum;
        newlevel.dlevel = game.u.uz.dlevel - 1;
        await goto_level(newlevel, at_stairs, (0), (0));
    }
}
/* Dwarves have "earth sense",
   able to sense if something is buried under their feet */
export async function earth_sense() {
    let otmp = null;
    if (!(game.urace.mnum == (PM_DWARF))) {
        return;
    }
    if (game.u.usteed || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (game.u.umonnum != game.u.umonster)) {
        return;
    }
    if (game.level.locations[game.u.ux][game.u.uy].typ != CORR && game.level.locations[game.u.ux][game.u.uy].typ != ROOM) {
        return;
    }
    for (otmp = game.level.buriedobjlist; otmp; otmp = otmp.nobj) {
        if (((otmp.ox) == game.u.ux && (otmp.oy) == game.u.uy)) {
            await You("sense something below your %s.", await makeplural(await body_part(FOOT)));
            return;
        }
    }
}
export async function u_on_newpos(x, y) {
    if (!isok(x, y)) {
        let func = null;
        func = (x < 0 || y < 0 || x > 80 - 1 || y > 21 - 1) ? panic : impossible;
        (func)("u_on_newpos: trying to place hero off map <%d,%d>", x, y);
    }
    game.u.ux = x;
    game.u.uy = y;
    (game.windowprocs.win_cliparound)(game.u.ux, game.u.uy);
    game.u.uundetected = 0;
    /* ridden steed always shares hero's location */
    if (game.u.usteed) {
        game.u.usteed.mx = game.u.ux , game.u.usteed.my = game.u.uy;
    }
    if (!on_level(game.u.uz, game.u.uz0)) {
        /* when changing levels, don't leave old position set with
       stale values from previous level */
        game.u.ux0 = game.u.ux , game.u.uy0 = game.u.uy;
        await map_location(game.u.ux, game.u.uy, (0));
        /* "none of the above" value */
        game.iflags.terrain_typ = MAX_TYPE;
    } else {
        /* still on same level; might have come close enough to
           generic object(s) to redisplay them as specific objects */
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !game.u.uswallow) {
            await see_nearby_objects();
        }
    }
    await earth_sense();
}
/* place you on a random location when arriving on a level */
export async function u_on_rndspot(upflag) {
    let up = (upflag & 1);
    let was_in_W_tower = (upflag & 2);
    /*
     * Place the hero at a random location within the relevant region.
     * place_lregion(xTELE) -> put_lregion_here(xTELE) -> u_on_newpos()
     * Unspecified region (.lx == 0) defaults to entire level.
     */
    if (was_in_W_tower && On_W_tower_level(game.u.uz)) {
        await place_lregion(game.dndest.nlx, game.dndest.nly, game.dndest.nhx, game.dndest.nhy, 0, 0, 0, 0, LR_DOWNTELE, null);
    } else if (up) {
        await place_lregion(game.updest.lx, game.updest.ly, game.updest.hx, game.updest.hy, game.updest.nlx, game.updest.nly, game.updest.nhx, game.updest.nhy, LR_UPTELE, null);
    } else {
        await place_lregion(game.dndest.lx, game.dndest.ly, game.dndest.hx, game.dndest.hy, game.dndest.nlx, game.dndest.nly, game.dndest.nhx, game.dndest.nhy, LR_DOWNTELE, null);
    }
    await switch_terrain();
}
/* !SFCTOOL */
export function Is_botlevel(lev) {
    return (lev.dlevel == game.dungeons[lev.dnum].num_dunlevs);
}
export function Can_dig_down(lev) {
    return (!game.level.flags.hardfloor && !Is_botlevel(lev) && !Invocation_lev(lev));
}
/*
 * Like Can_dig_down (above), but also allows falling through on the
 * stronghold level.  Normally, the bottom level of a dungeon resists
 * both digging and falling.
 */
export function Can_fall_thru(lev) {
    return (Can_dig_down(lev) || (((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(lev, (game.dungeon_topology.d_stronghold_level)))));
}
/*
 * True if one can rise up a level (e.g. cursed gain level).
 * This happens on intermediate dungeon levels or on any top dungeon
 * level that has a stairwell style branch to the next higher dungeon.
 * Checks for amulets and such must be done elsewhere.
 */
export async function Can_rise_up(x, y, lev) {
    let stway = stairway_find_special_dir((0));
    if (((lev).dnum == (game.dungeon_topology.d_astral_level).dnum) || ((lev).dnum == (game.dungeon_topology.d_sokoban_dnum)) || ((((((game.dungeon_topology.d_wiz1_level)).dlevel || ((game.dungeon_topology.d_wiz1_level)).dnum) && on_level(lev, (game.dungeon_topology.d_wiz1_level)))) && await In_W_tower(x, y, lev))) {
        return (0);
    }
    return (lev.dlevel > 1 || (game.dungeons[lev.dnum].entry_lev == 1 && ledger_no(lev) != 1 && stway && stway.up));
}
export function has_ceiling(lev) {
    /* FIXME: some (most? all?) of the quest home levels are conceptually
       above ground and don't have ceilings outside of their buildings
       but we don't presently check for that */
    if (((lev).dnum == (game.dungeon_topology.d_astral_level).dnum) && !(((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(lev, (game.dungeon_topology.d_earth_level))))) {
        return (0);
    }
    return (1);
}
export function avoid_ceiling(lev) {
    /* The quest is challenging since parts of the level
       may have ceilings and other parts may not; Avoid
       the ambiguity there by testing with avoid_ceiling()
       and using alternative messaging that avoids the term
       ceiling altogether there */
    if (In_quest(lev) || !has_ceiling(lev)) {
        return (1);
    }
    return (0);
}
export function ceiling(x, y) {
    let lev = game.level.locations[x][y];
    let what = null;
    if (in_rooms(x, y, VAULT)) {
        what = "vault's ceiling";
    } else if (in_rooms(x, y, TEMPLE)) {
        what = "temple's ceiling";
    } else if (in_rooms(x, y, SHOPBASE)) {
        what = "shop's ceiling";
    } else if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        what = "water above";
    } else if (((lev.typ) == AIR || (lev.typ) == CLOUD)) {
        what = "sky";
    } else if ((((((game.dungeon_topology.d_fire_level)).dlevel || ((game.dungeon_topology.d_fire_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_fire_level))))) {
        what = "flames above";
    } else if (In_quest(game.u.uz)) {
        what = "expanse above";
    } else if ((game.u.uinwater)) {
        what = "water's surface";
    } else if ((((lev.typ) >= ROOM) && !(((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level))))) || ((lev.typ) && (lev.typ) <= DBWALL) || ((lev.typ) == DOOR) || lev.typ == SDOOR) {
        what = "ceiling";
    /* other room types will no longer exist when we're interested --
     * see check_special_room()
     */
    /* water plane has no surface; its air bubbles aren't below sky */
    /* just in case; try to avoid in caller if you can */
    } else {
        what = "rock cavern";
    }
    return what;
}
export function surface(x, y) {
    let lev = game.level.locations[x][y];
    let levtyp = ((game.level.locations[x][y].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[x][y].flags) : game.level.locations[x][y].typ);
    if (((x) == game.u.ux && (y) == game.u.uy) && game.u.uswallow && (((game.u.ustuck.data).mflags1 & 262144) != 0)) {
        return (dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null) ? "maw" : (dmgtype_fromattack((game.u.ustuck.data), 28, 11) != null) ? "husk" : "nonesuch";
    } else if (((levtyp) == AIR || (levtyp) == CLOUD)) {
        return (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? "air bubble" : (levtyp == CLOUD) ? "cloud" : "air";
    } else if (is_pool(x, y)) {
        return ((game.u.uinwater) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) ? "bottom" : hliquid("water");
    } else if (is_ice(x, y)) {
        return "ice";
    } else if (is_lava(x, y)) {
        return hliquid("lava");
    } else if (lev.typ == DRAWBRIDGE_DOWN) {
        return "bridge";
    } else if (((levtyp) == ALTAR)) {
        return "altar";
    } else if (((levtyp) == GRAVE)) {
        return "headstone";
    } else if (((levtyp) == FOUNTAIN)) {
        return "fountain";
    } else if (On_stairs(x, y)) {
        return "stairs";
    } else if (((levtyp) && (levtyp) <= DBWALL) || levtyp == SDOOR) {
        return "wall";
    } else if (((levtyp) == DOOR)) {
        return "doorway";
    } else if (((levtyp) >= ROOM) && !(((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level))))) {
        return "floor";
    /* 'husk' is iffy but maw is wrong for 't' class */
    /* can't happen (fingers crossed...) */
    /* 'surface' during Passes_walls */
    } else {
        return "ground";
    }
}
/*
 * It is expected that the second argument of get_level is a depth value,
 * either supplied by the user (teleport control) or randomly generated.
 * But more than one level can be at the same depth.  If the target level
 * is "above" the present depth location, get_level must trace "up" from
 * the player's location (through the ancestors dungeons) the dungeon
 * within which the target level is located.  With only one exception
 * which does not pass through this routine (see level_tele), teleporting
 * "down" is confined to the current dungeon.  At present, level teleport
 * in dungeons that build up is confined within them.
 */
export async function get_level(newlevel, levnum) {
    let br = null;
    let dgn = game.u.uz.dnum;
    if (levnum <= 0) {
        /* can only currently happen in endgame */
        levnum = game.u.uz.dlevel;
    } else if (levnum > (game.dungeons[dgn].depth_start + game.dungeons[dgn].num_dunlevs - 1)) {
        /* beyond end of dungeon, jump to last level */
        levnum = game.dungeons[dgn].num_dunlevs;
    } else {
        if (levnum < game.dungeons[dgn].depth_start) {
            /* The desired level is in this dungeon or a "higher" one. */
            /*
         * Branch up the tree until we reach a dungeon that contains the
         * levnum.
         */
            do {
                for (br = game.branches; br; br = br.next) {
                    if (br.end2.dnum == dgn) {
                        break;
                    }
                }
                if (!br) {
                    await panic("get_level: can't find parent dungeon");
                }
                dgn = br.end1.dnum;
            } while (levnum < game.dungeons[dgn].depth_start);
        }
        /* We're within the same dungeon; calculate the level. */
        levnum = levnum - game.dungeons[dgn].depth_start + 1;
    }
    newlevel.dnum = dgn;
    newlevel.dlevel = levnum;
}
/* are you in the quest dungeon? */
export function In_quest(lev) {
    return (lev.dnum == (game.dungeon_topology.d_quest_dnum));
}
/* are you in the mines dungeon? */
export function In_mines(lev) {
    return (lev.dnum == (game.dungeon_topology.d_mines_dnum));
}
/*
 * Return the branch for the given dungeon.
 *
 * This function assumes:
 *      + This is not called with "Dungeons of Doom".
 *      + There is only _one_ branch to a given dungeon.
 *      + Field end2 is the "child" dungeon.
 */
export async function dungeon_branch(s) {
    let br = null;
    let dnum = 0;
    dnum = await dname_to_dnum(s);
    for (br = game.branches; br; br = br.next) {
        if (br.end2.dnum == dnum) {
            break;
        }
    }
    if (!br) {
        await panic("dgn_entrance: can't find entrance to %s", s);
    }
    return br;
}
/*
 * This returns true if the hero is on the same level as the entrance to
 * the named dungeon.
 *
 * Called from do.c and mklev.c.
 *
 * Assumes that end1 is always the "parent".
 */
export async function at_dgn_entrance(s) {
    let br = null;
    br = await dungeon_branch(s);
    return on_level(game.u.uz, br.end1) ? (1) : (0);
}
/* is `lev' part of Vlad's tower? */
export function In_V_tower(lev) {
    return (lev.dnum == (game.dungeon_topology.d_tower_dnum));
}
/* is `lev' a level containing the Wizard's tower? */
export function On_W_tower_level(lev) {
    return ((((((game.dungeon_topology.d_wiz1_level)).dlevel || ((game.dungeon_topology.d_wiz1_level)).dnum) && on_level(lev, (game.dungeon_topology.d_wiz1_level)))) || (((((game.dungeon_topology.d_wiz2_level)).dlevel || ((game.dungeon_topology.d_wiz2_level)).dnum) && on_level(lev, (game.dungeon_topology.d_wiz2_level)))) || (((((game.dungeon_topology.d_wiz3_level)).dlevel || ((game.dungeon_topology.d_wiz3_level)).dnum) && on_level(lev, (game.dungeon_topology.d_wiz3_level)))));
}
/* is <x,y> of `lev' inside the Wizard's tower? */
export async function In_W_tower(x, y, lev) {
    if (!On_W_tower_level(lev)) {
        return (0);
    }
    if (!game.dndest.nlx) {
        await impossible("No boundary for Wizard's Tower?");
        return (0);
    }
    /*
     * Both of the exclusion regions for arriving via level teleport
     * (from above or below) define the tower's boundary.
     *  assert( svu.updest.nIJ == svd.dndest.nIJ for I={l|h},J={x|y} );
     */
    return ((x) >= (game.dndest.nlx) && (x) <= (game.dndest.nhx) && (y) >= (game.dndest.nly) && (y) <= (game.dndest.nhy));
}
/* are you in one of the Hell levels? */
export function In_hell(lev) {
    return (game.dungeons[lev.dnum].flags.hellish);
}
/* sets *lev to be the gateway to Gehennom... */
export function find_hell(lev) {
    lev.dnum = (game.dungeon_topology.d_valley_level).dnum;
    lev.dlevel = 1;
}
/* go directly to hell... */
export async function goto_hell(at_stairs, falling) {
    let lev = { dnum: 0, dlevel: 0 };
    find_hell(lev);
    await goto_level(lev, at_stairs, falling, (0));
}
/* is 'lev' the only level in its branch?  affects level teleporters */
export function single_level_branch(lev) {
    /*
     * TODO:  this should be generalized instead of assuming that
     * Fort Ludios is the only single level branch in the dungeon.
     */
    return (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(lev, (game.dungeon_topology.d_knox_level))));
}
/* equivalent to dest = source */
export function assign_level(dest, src) {
    dest.dnum = src.dnum;
    dest.dlevel = src.dlevel;
}
/* dest = src + rn1(range) */
export function assign_rnd_level(dest, src, range) {
    dest.dnum = src.dnum;
    dest.dlevel = src.dlevel + ((range > 0) ? rnd(range) : -rnd(-range));
    if (dest.dlevel > dunlevs_in_dungeon(dest)) {
        dest.dlevel = dunlevs_in_dungeon(dest);
    } else if (dest.dlevel < 1) {
        dest.dlevel = 1;
    }
}
/* return an alignment mask */
export function induced_align(pct) {
    let lev = Is_special(game.u.uz);
    let al = 0;
    if (lev && lev.flags.align) {
        if (rn2(100) < pct) {
            return lev.flags.align;
        }
    }
    if (game.dungeons[game.u.uz.dnum].flags.align) {
        if (rn2(100) < pct) {
            return game.dungeons[game.u.uz.dnum].flags.align;
        }
    }
    al = rn2(3) - 1;
    return ((((al) == (-128)) ? 0 : ((al) == 1) ? 4 : ((al) + 2)));
}
export function Invocation_lev(lev) {
    return (In_hell(lev) && lev.dlevel == game.dungeons[lev.dnum].num_dunlevs - 1);
}
/* use instead of depth() wherever a degree of difficulty is made
 * dependent on the location in the dungeon (eg. monster creation).
 */
export async function level_difficulty() {
    let res = 0;
    /* when in the endgame, list all endgame levels visited, whether they
       have annotations or not, so that #overview doesn't become extremely
       sparse once the rest of the dungeon has been flagged as notreachable */
    /* show the endgame levels before the rest of the dungeon,
       so that the Planes (dnum 5-ish) come out above main dungeon (dnum 0) */
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        res = depth((game.dungeon_topology.d_sanctum_level)) + Math.trunc(game.u.ulevel / 2);
    } else if (game.u.uhave.amulet) {
        res = deepest_lev_reached((0));
    } else {
        res = depth(game.u.uz);
        if (await builds_up(game.u.uz)) {
            res += 2 * (game.dungeons[game.u.uz.dnum].entry_lev - game.u.uz.dlevel + 1);
        }
    }
    /* ring of aggravate monster */
    if (game.u.uprops[AGGRAVATE_MONSTER].extrinsic) {
        res = res > 25 ? 50 : res * 2;
    }
    return res;
}
/* within same branch, or else main dungeon <-> gehennom */
/* Take one word and try to match it to a level.
 * Recognized levels are as shown by print_dungeon().
 */
export async function lev_by_name(nam) {
    let lev = 0;
    let slev = null;
    let dlev = { dnum: 0, dlevel: 0 };
    let p = null;
    let idx = 0;
    let idxtoo = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let mseen = null;
    if ((mseen = find_mapseen_by_str(nam)) != null) {
        /* look at the player's custom level annotations first */
        Object.assign(dlev, mseen.lev);
    } else {
        /* no matching annotation, check whether they used a name we know */
        /* allow strings like "the oracle level" to find "oracle" */
        if (!strncmpi(nam, "the ", 4)) {
            nam = __nh_advance_str(nam, 4);
        }
        if ((p = strstri(nam, " level")) != null && p == eos(nam) - 6) {
            if (typeof nam === 'string') {
                const __levelIdx = nam.toLowerCase().lastIndexOf(' level');
                if (__levelIdx >= 0) nam = nam.slice(0, __levelIdx);
                nam = strcpy(buf, nam);
            } else {
                nam = strcpy(buf, nam);
            }
        }
        if (!strncmpi((nam), ("gehennom"), -1) || !strncmpi((nam), ("hell"), -1)) {
            if (In_V_tower(game.u.uz)) {
                nam = " to Vlad's tower";
            /* hell is the old name, and wouldn't match; gehennom would match its
           branch, yielding the castle level instead of valley of the dead */
            } else {
                nam = "valley";
            }
        } else if (!strncmpi((nam), ("delphi"), -1)) {
            /* Oracle says "welcome to Delphi" so recognize that name too */
            nam = "oracle";
        }
        if ((slev = find_level(nam)) != null) {
            Object.assign(dlev, slev.dlevel);
        }
    }
    if (mseen || slev) {
        idx = ledger_no(dlev);
        if ((dlev.dnum == game.u.uz.dnum || (game.u.uz.dnum == (game.dungeon_topology.d_valley_level).dnum && dlev.dnum == (game.dungeon_topology.d_medusa_level).dnum) || (game.u.uz.dnum == (game.dungeon_topology.d_medusa_level).dnum && dlev.dnum == (game.dungeon_topology.d_valley_level).dnum)) && (game.flags.debug || (game.level_info[idx].flags & 1) == 1)) {
            /* either wizard mode or else seen and not forgotten;
               note: used to be '(flags & (FORGOTTEN|VISITED)) == VISITED'
               back when amnesia could cause levels to be forgotten */
            lev = depth(dlev);
        }
    } else {
        idx = await find_branch(nam, null);
        if (idx < 0 && (p = strstri(nam, " to ")) != null) {
            idx = await find_branch(__nh_advance_str(p, 4), null);
        }
        if (idx >= 0) {
            idxtoo = (idx >> 8) & 255;
            idx &= 255;
            if (game.flags.debug || (((game.level_info[idx].flags & 1) == 1) && ((game.level_info[idxtoo].flags & 1) == 1))) {
                if (await ledger_to_dnum(idxtoo) == game.u.uz.dnum) {
                    idx = idxtoo;
                }
                dlev.dnum = await ledger_to_dnum(idx);
                dlev.dlevel = await ledger_to_dlev(idx);
                if ((dlev.dnum == game.u.uz.dnum || (game.u.uz.dnum == (game.dungeon_topology.d_valley_level).dnum && dlev.dnum == (game.dungeon_topology.d_medusa_level).dnum) || (game.u.uz.dnum == (game.dungeon_topology.d_medusa_level).dnum && dlev.dnum == (game.dungeon_topology.d_valley_level).dnum))) {
                    lev = depth(dlev);
                }
            }
        }
    }
    return lev;
}
export function unplaced_floater(dptr) {
    let br = null;
    let idx = Array.isArray(game.dungeons) ? game.dungeons.indexOf(dptr) : -1; /* C: dptr - svd.dungeons (pointer arith) */
    /* if other floating branches are added, this will need to change */
    if (idx != (game.dungeon_topology.d_knox_level).dnum) {
        return (0);
    }
    for (br = game.branches; br; br = br.next) {
        if (br.end1.dnum == game.n_dgns && br.end2.dnum == idx) {
            return (1);
        }
    }
    return (0);
}
export function unreachable_level(lvl_p, unplaced) {
    let dummy = null;
    if (unplaced) {
        return (1);
    }
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && !((lvl_p).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        return (1);
    }
    if ((dummy = find_level("dummy")) != null && on_level(lvl_p, dummy.dlevel)) {
        return (1);
    }
    return (0);
}
export async function tport_menu(win, entry, lchoices, lvl_p, cannotreach) {
    let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let clr = 8;
    lchoices.lev[lchoices.idx] = lvl_p.dlevel;
    lchoices.dgn[lchoices.idx] = lvl_p.dnum;
    lchoices.playerlev[lchoices.idx] = depth(lvl_p);
    Object.assign(any, cg.zeroany);
    if (cannotreach) {
        tmpbuf = sprintf(tmpbuf, "    %s", entry);
        /* not selectable, but still consumes next menuletter;
           prepend padding in place of missing menu selector */
        entry = tmpbuf;
    } else {
        any.a_int = lchoices.idx + 1;
    }
    await add_menu(win, nul_glyphinfo, any, lchoices.menuletter, 0, 0, clr, entry, 0);
    if (lchoices.menuletter == 122) {
        lchoices.menuletter = 65;
    /* this assumes there are at most 52 interesting levels */
    } else {
        lchoices.menuletter++;
    }
    lchoices.idx++;
    return;
}
/* Convert a branch type to a string usable by print_dungeon(). */
export function br_string(type) {
    switch (type) {
        case 3:
            return "Portal";
        case 1:
            return "Connection";
        case 2:
            return "One way stair";
        case 0:
            return "Stair";
    }
    return " (unknown)";
}
export function chr_u_on_lvl(dlev) {
    return game.u.uz.dnum == dlev.dnum && game.u.uz.dlevel == dlev.dlevel ? 42 : 32;
}
/* Print all child branches between the lower and upper bounds. */
export async function print_branch(win, dnum, lower_bound, upper_bound, bymenu, lchoices_p) {
    let br = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (br = game.branches; br; br = br.next) {
        /* This assumes that end1 is the "parent". */
        if (br.end1.dnum == dnum && lower_bound < br.end1.dlevel && br.end1.dlevel <= upper_bound) {
            buf = sprintf(buf, "%c %s to %s: %d", bymenu ? chr_u_on_lvl(br.end1) : 32, br_string(br.type), game.dungeons[br.end2.dnum].dname, depth(br.end1));
            if (bymenu) {
                await tport_menu(win, buf, lchoices_p, br.end1, unreachable_level(br.end1, (0)));
            } else {
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
        }
    }
}
/* Print available dungeon information. */
export async function print_dungeon(bymenu, rlev, rdgn) {
    let i = 0;
    let last_level = 0;
    let nlev = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let descr = null;
    let first = 0;
    let unplaced = 0;
    let slev = null;
    let dptr = null;
    let br = null;
    let lchoices = { idx: 0, lev: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], playerlev: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], dgn: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], menuletter: 0 };
    let win = (game.windowprocs.win_create_nhwindow)(4);
    if (bymenu) {
        (game.windowprocs.win_start_menu)(win, 0);
        lchoices.idx = 0;
        lchoices.menuletter = 97;
    }
    for (i = 0; i < game.n_dgns; i++) {
        dptr = game.dungeons[i];
        if (bymenu && ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && i != (game.dungeon_topology.d_astral_level).dnum) {
            continue;
        }
        unplaced = unplaced_floater(dptr);
        descr = unplaced ? "depth" : "level";
        nlev = dptr.num_dunlevs;
        if (nlev > 1) {
            buf = nh_snprintf("print_dungeon", 2317, buf, 256 /* sizeof(char [256]) */, "%s: %s %d to %d", dptr.dname, await makeplural(descr), dptr.depth_start, dptr.depth_start + nlev - 1);
        } else {
            buf = nh_snprintf("print_dungeon", 2320, buf, 256 /* sizeof(char [256]) */, "%s: %s %d", dptr.dname, descr, dptr.depth_start);
        }
        if (dptr.entry_lev != 1) {
            /* Most entrances are uninteresting. */
            if (dptr.entry_lev == nlev) {
                buf = strcat(buf, ", entrance from below");
            } else {
                buf = __nh_buf_append(buf, sprintf('', ", entrance on %d", dptr.depth_start + dptr.entry_lev - 1));
            }
        }
        if (bymenu) {
            await add_menu_heading(win, buf);
        } else {
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
        for (slev = game.sp_levchn , last_level = 0; slev; slev = slev.next) {
            /*
         * Circle through the special levels to find levels that are in
         * this dungeon.
         */
            if (slev.dlevel.dnum != i) {
                continue;
            }
            await print_branch(win, i, last_level, slev.dlevel.dlevel, bymenu, lchoices);
            buf = sprintf(buf, "%c %s: %d", chr_u_on_lvl(slev.dlevel), slev.proto, depth(slev.dlevel));
            if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(slev.dlevel, (game.dungeon_topology.d_stronghold_level))))) {
                buf = __nh_buf_append(buf, sprintf('', " (tune %s)", game.tune));
            }
            if (bymenu) {
                await tport_menu(win, buf, lchoices, slev.dlevel, unreachable_level(slev.dlevel, unplaced));
            } else {
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
            last_level = slev.dlevel.dlevel;
        }
        await print_branch(win, i, last_level, 32, bymenu, lchoices);
    }
    if (bymenu) {
        let n = 0;
        let selected = null;
        let idx = 0;
        (game.windowprocs.win_end_menu)(win, "Level teleport to where:");
        { const __selbox = { value: null }; n = await select_menu(win, 1, __selbox); selected = __selbox.value; }
        (game.windowprocs.win_destroy_nhwindow)(win);
        if (n > 0) {
            idx = selected[0].item.a_int - 1;
            free(selected);
            if (rlev && rdgn) {
                rlev.value = lchoices.lev[idx];
                rdgn.value = lchoices.dgn[idx];
                return lchoices.playerlev[idx];
            }
        }
        return 0;
    }
    for (first = (1) , br = game.branches; br; br = br.next) {
        if (br.end1.dnum == game.n_dgns) {
            if (first) {
                (game.windowprocs.win_putstr)(win, 0, "");
                (game.windowprocs.win_putstr)(win, 0, "Floating branches");
                /* Print out floating branches (if any). */
                first = (0);
            }
            buf = sprintf(buf, "   %s to %s", br_string(br.type), game.dungeons[br.end2.dnum].dname);
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
    }
    /* I hate searching for the invocation pos while debugging. -dean */
    if (Invocation_lev(game.u.uz)) {
        (game.windowprocs.win_putstr)(win, 0, "");
        buf = sprintf(buf, "Invocation position @ (%d,%d), hero @ (%d,%d)", game.inv_pos.x, game.inv_pos.y, game.u.ux, game.u.uy);
        (game.windowprocs.win_putstr)(win, 0, buf);
    } else {
        let trap = null;
        /* if current level has a magic portal, report its location;
           this assumes that there is at most one magic portal on any
           given level; quest and ft.ludios have pairs (one in main
           dungeon matched with one in the corresponding branch), the
           elemental planes have singletons (connection to next plane) */
        /* we assume that these are mutually exclusive */
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        for (trap = game.ftrap; trap; trap = trap.ntrap) {
            if (trap.ttyp == MAGIC_PORTAL) {
                break;
            }
        }
        if (trap) {
            buf = sprintf(buf, "Portal @ (%d,%d), hero @ (%d,%d)", trap.tx, trap.ty, game.u.ux, game.u.uy);
        } else if ((((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || (((((game.dungeon_topology.d_fire_level)).dlevel || ((game.dungeon_topology.d_fire_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_fire_level)))) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level)))) || await at_dgn_entrance("The Quest") || (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level))))) {
            buf = strcpy(buf, "No portal found.");
        }
        /* only give output if we found a portal or expected one and didn't */
        if (buf) {
            (game.windowprocs.win_putstr)(win, 0, "");
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
    }
    await (game.windowprocs.win_display_nhwindow)(win, (1));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
/* Record that the player knows about a branch from a level. This function
 * will determine whether or not it was a "real" branch that was taken.
 * This function should not be called for a transition done via level
 * teleport or via the Eye.
 */
export async function recbranch_mapseen(source, dest) {
    let mptr = null;
    let br = null;
    if (source.dnum == dest.dnum) {
        return;
    }
    for (br = game.branches; br; br = br.next) {
        /* we only care about forward branches */
        if (on_level(source, br.end1) && on_level(dest, br.end2)) {
            break;
        }
        if (on_level(source, br.end2) && on_level(dest, br.end1)) {
            return;
        }
    }
    /* branch not found, so not a real branch. */
    if (!br) {
        return;
    }
    if ((mptr = find_mapseen(source)) != null) {
        if (mptr.br && br != mptr.br) {
            await impossible("Two branches on the same level?");
        }
        mptr.br = br;
    } else {
        await impossible("Can't note branch for unseen level (%d, %d)", source.dnum, source.dlevel);
    }
}
export function get_annotation(lev) {
    let mptr = null;
    if ((mptr = find_mapseen(lev))) {
        return mptr.custom;
    }
    return null;
}
/* print the annotation for the current level, if it exists */
export async function print_level_annotation() {
    let annotation = null;
    if ((annotation = get_annotation(game.u.uz)) != null) {
        await You("remember this level as %s.", annotation);
    }
}
/* ask user to annotate level lev.
   if lev is NULL, uses current level. */
export async function query_annotation(lev) {
    let mptr = null;
    let nbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!(mptr = find_mapseen(lev ? lev : game.u.uz))) {
        return;
    }
    nbuf[0] = 0;
    if (mptr.custom) {
        let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        tmpbuf = sprintf(tmpbuf, "Replace annotation \"%.30s%s\" with?", mptr.custom, (strlen(mptr.custom) > 30) ? "..." : "");
        nbuf = await getlin(tmpbuf, nbuf);
    } else {
        let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let lbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        if (!lev || on_level(game.u.uz, lev)) {
            lbuf = strcpy(lbuf, "this dungeon level");
        } else {
            let dflgs = (lev.dnum == game.u.uz.dnum) ? 0 : 2;
            let save_uz = game.u.uz;
            Object.assign(game.u.uz, lev);
            describe_level(lbuf, dflgs);
            Object.assign(game.u.uz, save_uz);
            lbuf = strsubst(lbuf, "Dlvl:", "level ");
            /* even though we've told describe_level() not to append
               a trailing space (by not including '1' in dflgs), the
               level number is formatted with %-2d so single digit
               values will end up with one anyway; remove it */
            lbuf = trimspaces(lbuf);
        }
        qbuf = nh_snprintf("query_annotation", 2543, qbuf, 128 /* sizeof(char [128]) */, "What do you want to call %s?", lbuf);
        nbuf = await getlin(qbuf, nbuf);
    }
    /* empty input or ESC means don't add or change annotation;
       space-only means discard current annotation without adding new one */
    if (!nbuf || nbuf == 27) {
        return;
    }
    /* strip leading and trailing spaces, compress out consecutive spaces */
    nbuf = mungspaces(nbuf);
    if (mptr.custom) {
        /* discard old annotation, if any */
        free(mptr.custom);
        mptr.custom = null;
        mptr.custom_lth = 0;
    }
    if (nbuf && strcmp(nbuf, " ")) {
        /* add new annotation, unless it's all spaces (which will be an
       empty string after mungspaces() above) */
        mptr.custom = dupstr(nbuf);
        /* _lth field does not include trailing '\0' in the count */
        mptr.custom_lth = strlen(mptr.custom);
    }
}
/* #annotate command - add a custom name to the current level */
export async function donamelevel() {
    if (game.iflags.menu_requested) {
        return await dooverview();
    }
    await query_annotation(null);
    return 0;
}
/* !SFCTOOL */
/* exclusion zones */
export function free_exclusions() {
    let ez = game.exclusion_zones;
    while (ez) {
        let nxtez = ez.next;
        free(ez);
        ez = nxtez;
    }
    game.exclusion_zones = null;
}
export function save_exclusions(nhfp) {
    let ez = null;
    let nez = 0;
    for (nez = 0 , ez = game.exclusion_zones; ez; ez = ez.next , ++nez) {
        ;
    }
    if (((nhfp).mode & (1 | 2))) {
        sfo_int(nhfp, { get value() { return nez; }, set value(_v) { nez = _v; } }, "exclusion_count");
        for (ez = game.exclusion_zones; ez; ez = ez.next) {
            sfo_xint16(nhfp, { get value() { return ez.zonetype; }, set value(_v) { ez.zonetype = _v; } }, "exclusion-zonetype");
            sfo_int16(nhfp, { get value() { return ez.lx; }, set value(_v) { ez.lx = _v; } }, "exclusion-lx");
            sfo_int16(nhfp, { get value() { return ez.ly; }, set value(_v) { ez.ly = _v; } }, "exclusion-ly");
            sfo_int16(nhfp, { get value() { return ez.hx; }, set value(_v) { ez.hx = _v; } }, "exclusion-hx");
            sfo_int16(nhfp, { get value() { return ez.hy; }, set value(_v) { ez.hy = _v; } }, "exclusion-hy");
        }
    }
}
export function load_exclusions(nhfp) {
    let ez = null;
    let nez = 0;
    sfi_int(nhfp, { get value() { return nez; }, set value(_v) { nez = _v; } }, "exclusion_count");
    ;
    while (nez-- > 0) {
        ez = alloc(1 /* sizeof(struct exclusion_zone) */);
        sfi_xint16(nhfp, { get value() { return ez.zonetype; }, set value(_v) { ez.zonetype = _v; } }, "exclusion-zonetype");
        ;
        sfi_int16(nhfp, { get value() { return ez.lx; }, set value(_v) { ez.lx = _v; } }, "exclusion-lx");
        sfi_int16(nhfp, { get value() { return ez.ly; }, set value(_v) { ez.ly = _v; } }, "exclusion-ly");
        sfi_int16(nhfp, { get value() { return ez.hx; }, set value(_v) { ez.hx = _v; } }, "exclusion-hx");
        sfi_int16(nhfp, { get value() { return ez.hy; }, set value(_v) { ez.hy = _v; } }, "exclusion-hy");
        ez.next = game.exclusion_zones;
        game.exclusion_zones = ez;
    }
}
/* find the particular mapseen object in the chain; may return null */
export function find_mapseen(lev) {
    let mptr = null;
    for (mptr = game.mapseenchn; mptr; mptr = mptr.next) {
        if (on_level((mptr.lev), lev)) {
            break;
        }
    }
    return mptr;
}
export function find_mapseen_by_str(s) {
    let mptr = null;
    for (mptr = game.mapseenchn; mptr; mptr = mptr.next) {
        if (mptr.custom && !strncmpi((s), (mptr.custom), -1)) {
            break;
        }
    }
    return mptr;
}
export function rm_mapseen(ledger_num) {
    let mptr = null;
    let mprev = null;
    let bp = null;
    let bpnext = null;
    for (mptr = game.mapseenchn; mptr; mprev = mptr , mptr = mptr.next) {
        if (game.dungeons[mptr.lev.dnum].ledger_start + mptr.lev.dlevel == ledger_num) {
            break;
        }
    }
    if (!mptr) {
        return;
    }
    if (mptr.custom) {
        free(mptr.custom) , mptr.custom = (null);
    }
    bpnext = mptr.final_resting_place;
    while ((bp = bpnext) != (null)) {
        bpnext = bp.next;
        free(bp);
    }
    if (mprev) {
        mprev.next = mptr.next;
    } else {
        game.mapseenchn = mptr.next;
    }
    free(mptr);
}
export function save_mapseen(nhfp, mptr) {
    let curr = null;
    let i = 0;
    let brindx = 0;
    for (brindx = 0 , curr = game.branches; curr; curr = curr.next , ++brindx) {
        if (curr == mptr.br) {
            break;
        }
    }
    sfo_int(nhfp, { get value() { return brindx; }, set value(_v) { brindx = _v; } }, "mapseen-branch_index");
    sfo_d_level(nhfp, mptr.lev, "mapseen-d_level");
    sfo_mapseen_feat(nhfp, mptr.feat, "mapseen-feat");
    sfo_mapseen_flags(nhfp, mptr.flags, "mapseen-flags");
    sfo_unsigned(nhfp, { get value() { return mptr.custom_lth; }, set value(_v) { mptr.custom_lth = _v; } }, "mapseen-custom_lth");
    if (mptr.custom_lth) {
        sfo_char(nhfp, mptr.custom, "mapseen-custom", mptr.custom_lth);
    }
    for (i = 0; i < ((40 + 1) * 2); ++i) {
        sfo_mapseen_rooms(nhfp, mptr.msrooms[i], "mapseen-msrooms");
    }
    savecemetery(nhfp, mptr.final_resting_place);
}
/* !SFCTOOL */
export function load_mapseen(nhfp) {
    let i = 0;
    let branchnum = 0;
    let brindx = 0;
    let load = null;
    let curr = null;
    load = alloc(1 /* sizeof(mapseen) */);
    sfi_int(nhfp, { get value() { return branchnum; }, set value(_v) { branchnum = _v; } }, "mapseen-branch_index");
    ;
    for (brindx = 0 , curr = game.branches; curr; curr = curr.next , ++brindx) {
        if (brindx == branchnum) {
            break;
        }
    }
    load.br = curr;
    sfi_d_level(nhfp, load.lev, "mapseen-d_level");
    sfi_mapseen_feat(nhfp, load.feat, "mapseen-feat");
    sfi_mapseen_flags(nhfp, load.flags, "mapseen-flags");
    sfi_unsigned(nhfp, { get value() { return load.custom_lth; }, set value(_v) { load.custom_lth = _v; } }, "mapseen-custom_lth");
    ;
    if (load.custom_lth) {
        /* length doesn't include terminator (which isn't saved & restored) */
        load.custom = alloc(load.custom_lth + 1);
        sfi_char(nhfp, load.custom, "mapseen-custom", load.custom_lth);
        load.custom = __nh_char_write(load.custom, load.custom_lth, 0);
    } else {
        load.custom = null;
    }
    for (i = 0; i < ((40 + 1) * 2); ++i) {
        sfi_mapseen_rooms(nhfp, load.msrooms[i], "mapseen-msrooms");
    }
    restcemetery(nhfp, load.final_resting_place);
    return load;
}
/* for '#stats' wizard-mode command, to show memory used for #overview data */
/* output window */
/* format */
/* args for the format */
export function overview_stats(win, statsfmt, total_count, total_size) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let hdrbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ocount = 0;
    let osize = 0;
    let bcount = 0;
    let bsize = 0;
    let acount = 0;
    let asize = 0;
    let ce = null;
    let mptr = null;
    ocount = bcount = acount = osize = bsize = asize = 0;
    for (mptr = game.mapseenchn; mptr; mptr = mptr.next) {
        ++ocount;
        osize += 1 /* sizeof(mapseen) */;
        for (ce = mptr.final_resting_place; ce; ce = ce.next) {
            ++bcount;
            bsize += 1 /* sizeof(struct cemetery) */;
        }
        if (mptr.custom_lth) {
            ++acount;
            asize += (mptr.custom_lth + 1);
        }
    }
    hdrbuf = sprintf(hdrbuf, "general, size %ld", 1 /* sizeof(mapseen) */);
    buf = sprintf(buf, statsfmt, hdrbuf, ocount, osize);
    (game.windowprocs.win_putstr)(win, 0, buf);
    if (bcount) {
        hdrbuf = sprintf(hdrbuf, "cemetery, size %ld", 1 /* sizeof(struct cemetery) */);
        buf = sprintf(buf, statsfmt, hdrbuf, bcount, bsize);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    if (acount) {
        hdrbuf = sprintf(hdrbuf, "annotations, text");
        buf = sprintf(buf, statsfmt, hdrbuf, acount, asize);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    total_count.value += ocount + bcount + acount;
    total_size.value += osize + bsize + asize;
}
/* Remove all mapseen objects for a particular dnum.
 * Useful during quest expulsion to remove quest levels.
 * [No longer deleted, just marked as notreachable.  #overview will
 * ignore such levels, end of game disclosure will include them.]
 */
export function remdun_mapseen(dnum) {
    let mptr = null;
    let mptraddr = null;
    mptraddr = game.mapseenchn;
    while ((mptr = mptraddr) != null) {
        if (mptr.lev.dnum == dnum) {
            mptr.flags.notreachable = 1;
        }
        mptraddr = mptr.next;
    }
}
export function init_mapseen(lev) {
    /* Create a level and insert in "sorted" order.  This is an insertion
     * sort first by dungeon (in order of discovery) and then by level number.
     */
    let mptr = null;
    let init = null;
    let prev = null;
    init = alloc(1 /* sizeof(mapseen) */);
    memset(init, 0, 1 /* sizeof(mapseen) */);
    /* memset is fine for feature bits, flags, and rooms array;
       explicitly initialize pointers to null */
    init.next = null , init.br = null , init.custom = null;
    init.final_resting_place = null;
    /* svl.lastseentyp[][] is reused for each level, so get rid of
       previous level's data */
    memset(game.lastseentyp, 0, 80 /* sizeof(schar [80][21]) */);
    init.lev.dnum = lev.dnum;
    init.lev.dlevel = lev.dlevel;
    for (mptr = game.mapseenchn , prev = null; mptr; prev = mptr , mptr = mptr.next) {
        /* walk until we get to the place where we should insert init */
        if (mptr.lev.dnum > init.lev.dnum || (mptr.lev.dnum == init.lev.dnum && mptr.lev.dlevel > init.lev.dlevel)) {
            break;
        }
    }
    if (!prev) {
        init.next = game.mapseenchn;
        game.mapseenchn = init;
    } else {
        mptr = prev.next;
        prev.next = init;
        init.next = mptr;
    }
}
/* || (feat).water || (feat).ice || (feat).lava */
/* returns true if this level has something interesting to print out */
export function interest_mapseen(mptr) {
    if (on_level(game.u.uz, mptr.lev)) {
        return (1);
    }
    if (mptr.flags.notreachable || mptr.flags.forgot) {
        return (0);
    }
    if (((game.u.uz).dnum == (game.dungeon_topology.d_tutorial_dnum))) {
        /* when in tutorial, show all tutorial levels visited whether interesting
       or not and don't show any other levels; when outside tutorial, don't
       show any tutorial levels even if they're considered interesting */
        return ((mptr.lev).dnum == (game.dungeon_topology.d_tutorial_dnum));
    } else {
        if (((mptr.lev).dnum == (game.dungeon_topology.d_tutorial_dnum))) {
            return (0);
        }
    }
    /* level is of interest if it has an auto-generated annotation */
    if (mptr.flags.oracle || mptr.flags.bigroom || mptr.flags.roguelevel || mptr.flags.castle || mptr.flags.valley || mptr.flags.msanctum || mptr.flags.vibrating_square || mptr.flags.quest_summons || mptr.flags.questing) {
        return (1);
    }
    /* when in Sokoban, list all sokoban levels visited; when not in it,
       list any visited Sokoban level which remains unsolved (will usually
       only be furthest one reached, but it's possible to enter pits and
       climb out on the far side on the first Sokoban level; also, wizard
       mode overrides teleport restrictions) */
    if (((mptr.lev).dnum == (game.dungeon_topology.d_sokoban_dnum)) && (((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) || !mptr.flags.sokosolved)) {
        return (1);
    }
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        return ((mptr.lev).dnum == (game.dungeon_topology.d_astral_level).dnum);
    }
    /* level is of interest if it has non-zero feature count or known bones
       or user annotation or known connection to another dungeon branch
       or is the furthest level reached in its branch */
    return (((mptr.feat).nfount || (mptr.feat).nsink || (mptr.feat).nthrone || (mptr.feat).naltar || (mptr.feat).ngrave || (mptr.feat).ntree || (mptr.feat).nshop || (mptr.feat).ntemple) || (mptr.final_resting_place && (mptr.flags.knownbones || game.flags.debug)) || mptr.custom || mptr.br || (mptr.lev.dlevel == game.dungeons[mptr.lev.dnum].dunlev_ureached));
}
/* update the lastseentyp at x,y */
export function update_lastseentyp(x, y) {
    let mtmp = null;
    let ltyp = game.level.locations[x][y].typ;
    if (ltyp == DRAWBRIDGE_UP) {
        ltyp = db_under_typ(game.level.locations[x][y].flags);
    }
    if ((mtmp = (game.level.monsters[x][y])) != null && ((mtmp).m_ap_type & 7) == M_AP_FURNITURE && canseemon(mtmp)) {
        ltyp = cmap_to_type(mtmp.mappearance);
    }
    game.lastseentyp[x][y] = ltyp;
}
/* for some cases where deferred update needs to be done immediately;
   hide details from caller */
export async function update_mapseen_for(x, y) {
    await recalc_mapseen();
    return game.lastseentyp[x][y];
}
/* count mapseen feature from lastseentyp at x,y */
/* remembered data for a level; update feat.X counts */
export function count_feat_lastseentyp(mptr, x, y) {
    let count = 0;
    let atmp = 0;
    switch (game.lastseentyp[x][y]) {
        /* levels that have these tend of have a lot of them */
        /*
     * FIXME?  due to theme rooms, lots of levels have an increased
     * chance of having these so automatic annotations for them may
     * have become more worthwhile now.
     */
        case TREE:
            count = mptr.feat.ntree + 1;
            if (count <= 3) {
                mptr.feat.ntree = count;
            }
            break;
        case FOUNTAIN:
            count = mptr.feat.nfount + 1;
            if (count <= 3) {
                mptr.feat.nfount = count;
            }
            break;
        case THRONE:
            count = mptr.feat.nthrone + 1;
            if (count <= 3) {
                mptr.feat.nthrone = count;
            }
            break;
        case SINK:
            count = mptr.feat.nsink + 1;
            if (count <= 3) {
                mptr.feat.nsink = count;
            }
            break;
        case GRAVE:
            count = mptr.feat.ngrave + 1;
            if (count <= 3) {
                mptr.feat.ngrave = count;
            }
            break;
        case ALTAR:
            atmp = altarmask_at(x, y);
            atmp = ((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) && (game.level.locations[x][y].seenv & (255)) != (255)) ? 0 : ((((atmp) & 7) == 4) ? 3 : (atmp) & 7);
            if (!mptr.feat.naltar) {
                mptr.feat.msalign = atmp;
            } else if (mptr.feat.msalign != atmp) {
                mptr.feat.msalign = 0;
            }
            count = mptr.feat.naltar + 1;
            if (count <= 3) {
                mptr.feat.naltar = count;
            }
            break;
        case DOOR:
            if ((((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level))))) {
                /* get the altarmask for this location; might be a mimic */
                /*  An automatic annotation is added to the Castle and
         *  to Fort Ludios once their structure's main entrance
         *  has been seen (in person or via magic mapping).
         *  For the Fort, that entrance is just a secret door
         *  which will be converted into a regular one when
         *  located (or destroyed).
         * DOOR: possibly a lowered drawbridge's open portcullis;
         * DBWALL: a raised drawbridge's "closed door";
         * DRAWBRIDGE_DOWN: the span provided by lowered bridge,
         *  with moat or other terrain hidden underneath;
         * DRAWBRIDGE_UP: moat in front of a raised drawbridge,
         *  not recognizable as a bridge location unless/until
         *  the adjacent DBWALL has been seen.
         */
                let ty = 0;
                let tx = x - 4;
                for (ty = y - 1; ty <= y + 1; ++ty) {
                    if (isok(tx, ty) && ((game.level.locations[tx][ty].typ) == THRONE)) {
                        /* Throne is four columns to left, either directly in
             * line or one row higher or lower, and doesn't have
             * to have been seen yet.
             *   ......|}}}.
             *   ..\...S}...
             *   ..\...S}...
             *   ......|}}}.
             * For 3.6.0 and earlier, it was always in direct line:
             * both throne and door on the lower of the two rows.
             */
                        mptr.flags.ludios = 1;
                        break;
                    }
                }
                break;
            }
            if (is_drawbridge_wall(x, y) < 0) {
                break;
            }
            ;
        case DBWALL:
        case DRAWBRIDGE_DOWN:
            if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
                mptr.flags.castle = 1 , mptr.flags.castletune = 1;
            }
            break;
        default:
            break;
    }
}
/* recalculate mapseen for the current level */
export async function recalc_mapseen() {
    let mptr = null;
    let oth_mptr = null;
    let mtmp = null;
    let bp = null;
    let bonesaddr = null;
    let t = null;
    let i = 0;
    let ridx = 0;
    let count = 0;
    let x = 0;
    let y = 0;
    let uroom = 0;
    /* Should not happen in general, but possible if in the process
     * of being booted from the quest.  The mapseen object gets
     * removed during the expulsion but prior to leaving the level
     * [Since quest expulsion no longer deletes quest mapseen data,
     * null return from find_mapseen() should now be impossible.]
     */
    if (!(mptr = find_mapseen(game.u.uz))) {
        return;
    }
    /* reset all features; mptr->feat.* = 0; */
    memset(mptr.feat, 0, 1 /* sizeof(struct mapseen_feat) */);
    if (mptr.flags.notreachable) {
        /* reset most flags; some level-specific ones are left as-is */
        /* reached it; Eye of the Aethiopica? */
        mptr.flags.notreachable = 0;
        if (In_quest(game.u.uz)) {
            let mptrtmp = game.mapseenchn;
            /* when quest was notreachable due to ejection and portal removal,
               getting back to it via arti-invoke should revive annotation
               data for all quest levels, not just the one we're on now */
            do {
                if (mptrtmp.lev.dnum == mptr.lev.dnum) {
                    mptrtmp.flags.notreachable = 0;
                }
                mptrtmp = mptrtmp.next;
            } while (mptrtmp);
        }
    }
    mptr.flags.knownbones = 0;
    mptr.flags.sokosolved = ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) && !game.level.flags.sokoban_rules;
    /* mptr->flags.bigroom retains previous value when hero can't see */
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        mptr.flags.bigroom = (((((game.dungeon_topology.d_bigroom_level)).dlevel || ((game.dungeon_topology.d_bigroom_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_bigroom_level))));
    } else if (mptr.flags.forgot) {
        mptr.flags.bigroom = 0;
    }
    mptr.flags.roguelevel = (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))));
    /* recalculated during room traversal below */
    mptr.flags.oracle = 0;
    mptr.flags.castletune = 0;
    /* flags.castle retains previous value */
    mptr.flags.forgot = 0;
    mptr.flags.quest_summons = (await at_dgn_entrance("The Quest") && game.u.uevent.qcalled && !(game.u.uevent.qcompleted || game.u.uevent.qexpelled || game.quest_status.leader_is_dead));
    mptr.flags.questing = (on_level(game.u.uz, (game.dungeon_topology.d_qstart_level)) && game.quest_status.got_quest);
    for (i = 0; (uroom = game.u.urooms[i]) != 0; ++i) {
        /* flags.msanctum, .valley, and .vibrating_square handled below */
        /* track rooms the hero is in */
        ridx = uroom - 3;
        mptr.msrooms[ridx].seen = 1;
        mptr.msrooms[ridx].untended = (game.rooms[ridx].rtype >= SHOPBASE) ? (!(mtmp = await shop_keeper(uroom)) || !inhishop(mtmp)) : (game.rooms[ridx].rtype == TEMPLE) ? (!(mtmp = findpriest(uroom)) || !inhistemple(mtmp)) : 0;
    }
    for (i = 0; i < (Math.trunc(82 /* sizeof(struct mapseen_rooms [82]) */ / 1 /* sizeof(struct mapseen_rooms) */)); ++i) {
        if (mptr.msrooms[i].seen) {
            if (game.rooms[i].rtype >= SHOPBASE) {
                /* recalculate room knowledge: for now, just shops and temples
     * this could be extended to an array of 0..SHOPBASE
     */
                if (mptr.msrooms[i].untended) {
                    mptr.feat.shoptype = SHOPBASE - 1;
                } else if (!mptr.feat.nshop) {
                    mptr.feat.shoptype = game.rooms[i].rtype;
                } else if (mptr.feat.shoptype != game.rooms[i].rtype) {
                    mptr.feat.shoptype = 0;
                }
                count = mptr.feat.nshop + 1;
                if (count <= 3) {
                    mptr.feat.nshop = count;
                }
            } else if (game.rooms[i].rtype == TEMPLE) {
                /* altar and temple alignment handled below */
                count = mptr.feat.ntemple + 1;
                if (count <= 3) {
                    mptr.feat.ntemple = count;
                }
            } else if (game.rooms[i].orig_rtype == DELPHI) {
                mptr.flags.oracle = 1;
            }
        }
    }
    /* Update svl.lastseentyp with typ if and only if it is in sight or the
     * hero can feel it on their current location (i.e. not levitating).
     * This *should* give the "last known typ" for each dungeon location.
     * (At the very least, it's a better assumption than determining what
     * the player knows from the glyph and the typ (which is isn't quite
     * enough information in some cases)).
     *
     * It was reluctantly added to struct rm to track.  Alternatively
     * we could track "features" and then update them all here, and keep
     * track of when new features are created or destroyed, but this
     * seemed the most elegant, despite adding more data to struct rm.
     * [3.6.0: we're using svl.lastseentyp[][] rather than level.locations
     * to track the features seen.]
     *
     * Although no current windowing systems (can) do this, this would add
     * the ability to have non-dungeon glyphs float above the last known
     * dungeon glyph (i.e. items on fountains).
     */
    if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        update_lastseentyp(game.u.ux, game.u.uy);
    }
    for (x = 1; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            count_feat_lastseentyp(mptr, x, y);
        }
    }
    if ((((((game.dungeon_topology.d_valley_level)).dlevel || ((game.dungeon_topology.d_valley_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_valley_level))))) {
        /* Moloch's Sanctum and the Valley of the Dead are normally given an
       automatic annotation when you enter a temple attended by a priest,
       but it is possible for the priest to be killed prior to that; we
       assume that both of those levels only contain one altar, so add the
       annotation if that altar has been mapped (seen or magic mapping) */
        /* don't clear valley if naltar==0; maybe altar got destroyed? */
        /* Sanctum and Gateway-to-Sanctum are mutually exclusive automatic
       annotations but handling that is tricky because they're stored
       with data for different levels */
        if (mptr.feat.naltar > 0) {
            mptr.flags.valley = 1;
        }
    } else if ((((((game.dungeon_topology.d_sanctum_level)).dlevel || ((game.dungeon_topology.d_sanctum_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_sanctum_level))))) {
        if (mptr.feat.naltar > 0) {
            mptr.flags.msanctum = 1;
        }
        if (mptr.flags.msanctum) {
            let invocat_lvl = { dnum: 0, dlevel: 0 };
            Object.assign(invocat_lvl, game.u.uz);
            invocat_lvl.dlevel -= 1;
            if ((oth_mptr = find_mapseen(invocat_lvl)) != null) {
                oth_mptr.flags.vibrating_square = 0;
            }
        }
    } else if (Invocation_lev(game.u.uz)) {
        /* annotate vibrating square's level if vibr_sqr 'trap' has been
           found or if that trap is gone (indicating that invocation has
           happened) provided that the sanctum's annotation hasn't been
           added (either hero hasn't descended to that level yet or hasn't
           mapped its temple) */
        for (t = game.ftrap; t; t = t.ntrap) {
            if (t.ttyp == VIBRATING_SQUARE) {
                break;
            }
        }
        mptr.flags.vibrating_square = t ? t.tseen : ((oth_mptr = find_mapseen((game.dungeon_topology.d_sanctum_level))) == null || !oth_mptr.flags.msanctum);
    }
    if (game.level.bonesinfo && !mptr.final_resting_place) {
        /* bonesinfo-copy fix — pointer-to-pointer linked-list copy:
           C `*bonesaddr = alloc(); **bonesaddr = *bp; bonesaddr = &(*bonesaddr)->next`
           expressed as direct head+tail list construction. */
        let __head = null;
        let __tail = null;
        for (bp = game.level.bonesinfo; bp; bp = bp.next) {
            const node = {
                next: null,
                who: bp.who,
                how: bp.how,
                when: bp.when,
                frpx: bp.frpx,
                frpy: bp.frpy,
                bonesknown: bp.bonesknown,
            };
            if (__head === null) __head = node;
            else __tail.next = node;
            __tail = node;
        }
        mptr.final_resting_place = __head;
    }
    for (bp = mptr.final_resting_place; bp; bp = bp.next) {
        if (game.lastseentyp[bp.frpx][bp.frpy]) {
            /* decide which past hero deaths have become known; there's no
       guarantee of either a grave or a ghost, so we go by whether the
       current hero has seen the map location where each old one died */
            bp.bonesknown = (1);
            mptr.flags.knownbones = 1;
        }
    }
}
/*ARGUSED*/
/* valley and sanctum levels get automatic annotation once their temple
   is entered */
/* not used; might be useful someday */
export function mapseen_temple(priest) {
    let mptr = find_mapseen(game.u.uz);
    if (!mptr) {
        return;
    }
    if ((((((game.dungeon_topology.d_valley_level)).dlevel || ((game.dungeon_topology.d_valley_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_valley_level))))) {
        mptr.flags.valley = 1;
    } else if ((((((game.dungeon_topology.d_sanctum_level)).dlevel || ((game.dungeon_topology.d_sanctum_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_sanctum_level))))) {
        mptr.flags.msanctum = 1;
    }
}
/* room entry message has just been delivered so learn room even if blind */
export async function room_discovered(roomno) {
    let mptr = find_mapseen(game.u.uz);
    if (mptr && !mptr.msrooms[roomno].seen) {
        mptr.msrooms[roomno].seen = 1;
        await recalc_mapseen();
    }
}
/* #overview command */
export async function dooverview() {
    await show_overview(game.iflags.menu_requested ? -1 : 0, 0);
    game.iflags.menu_requested = (0);
    return 0;
}
/* called for #overview or for end of game disclosure */
/* 0 => normal #overview command, -1 => 'm' prefix #overview;
              * 1 or 2 => final disclosure (1: hero lived, 2: hero died) */
/* how hero died; used when disclosing end-of-game level */
export async function show_overview(why, reason) {
    let win = 0;
    let lastdun = -1;
    let selected = null;
    let n = 0;
    await recalc_mapseen();
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        await traverse_mapseenchn(1, win, why, reason, { get value() { return lastdun; }, set value(_v) { lastdun = _v; } });
    }
    /* if game is over or we're not in the endgame yet, show the dungeon */
    if (why > 0 || !((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        await traverse_mapseenchn(0, win, why, reason, { get value() { return lastdun; }, set value(_v) { lastdun = _v; } });
    }
    (game.windowprocs.win_end_menu)(win, null);
    { const __selbox = { value: null }; n = await select_menu(win, (why != -1) ? 0 : 1, __selbox); selected = __selbox.value; }
    if (n > 0) {
        let ledger = 0;
        let lev = { dnum: 0, dlevel: 0 };
        ledger = selected[0].item.a_int - 1;
        lev.dnum = await ledger_to_dnum(ledger);
        lev.dlevel = await ledger_to_dlev(ledger);
        await query_annotation(lev);
        free(selected);
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
}
/* display endgame levels or non-endgame levels, not both */
/* 0: show endgame branch; 1: show other branches */
/* output window */
/* -1: menu, 0: normal, 1 and 2: end of game disclosure */
/* when 'why'==1 or 2, how the game ended */
/* where to restart if called twice */
export async function traverse_mapseenchn(viewendgame, win, why, reason, lastdun_p) {
    let mptr = null;
    let showheader = 0;
    for (mptr = game.mapseenchn; mptr; mptr = mptr.next) {
        if (viewendgame ^ ((mptr.lev).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
            continue;
        }
        if (why != 0 || interest_mapseen(mptr)) {
            /* only print out info for a level or a dungeon if it's of interest */
            showheader = (mptr.lev.dnum != lastdun_p.value);
            await print_mapseen(win, mptr, why, reason, showheader);
            lastdun_p.value = mptr.lev.dnum;
        }
    }
}
export function seen_string(x, obj) {
    switch (x) {
        case 0:
            return "no";
        case 1:
            return strchr(vowels, __nh_char_at0(obj)) ? "an" : "a";
        case 2:
            return "some";
        case 3:
            return "many";
    }
    return "(unknown)";
}
/* better br_string */
export function br_string2(br) {
    /* Special case: quest portal says closed if kicked from quest */
    let closed_portal = (br.end2.dnum == (game.dungeon_topology.d_quest_dnum) && game.u.uevent.qexpelled);
    switch (br.type) {
        case 3:
            return closed_portal ? "Sealed portal" : "Portal";
        case 1:
            return "Connection";
        case 2:
            return br.end1_up ? "One way stairs up" : "One way stairs down";
        case 0:
            return br.end1_up ? "Stairs up" : "Stairs down";
    }
    return "(unknown)";
}
/* get the name of an endgame level; topten.c does something similar */
export function endgamelevelname(outbuf, indx) {
    let planename = null;
    outbuf.value = 0;
    switch (indx) {
        case -5:
            outbuf = strcpy(outbuf, "Astral Plane");
            break;
        case -4:
            planename = "Water";
            break;
        case -3:
            planename = "Fire";
            break;
        case -2:
            planename = "Air";
            break;
        case -1:
            planename = "Earth";
            break;
    }
    if (planename) {
        outbuf = sprintf(outbuf, "Plane of %s", planename);
    } else if (!outbuf.value) {
        outbuf = sprintf(outbuf, "unknown plane #%d", indx);
    }
    return outbuf;
}
/* short shop description */
export function shop_string(rtype) {
    /* convert room type to shop type */
    let shoptype = rtype - SHOPBASE;
    let str = "shop?";
    if (shoptype < 0) {
        str = "untended shop";
    } else if (shtypes[shoptype].annotation) {
        str = shtypes[shoptype].annotation;
    } else if (shtypes[shoptype].name) {
        str = shtypes[shoptype].name;
    }
    return str;
}
/* if player knows about the mastermind tune, append it to Castle annotation;
   if drawbridge has been destroyed, flags.castletune will be zero */
/* size of outbuf */
export function tunesuffix(mptr, outbuf, bsz) {
    outbuf.value = 0;
    if (mptr.flags.castletune && game.u.uevent.uheard_tune) {
        let tmp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        if (game.u.uevent.uheard_tune == 2) {
            tmp = sprintf(tmp, "notes \"%s\"", game.tune);
        } else {
            tmp = strcpy(tmp, "5-note tune");
        }
        outbuf = nh_snprintf("tunesuffix", 3473, outbuf, bsz, " (play %s to open or close drawbridge)", tmp);
    }
    return outbuf;
}
/* some utility macros for print_mapseen */
/* three spaces */
/* empty; otherwise output becomes cluttered */
/*!0*/
/* K&R: don't require support for concatenation of adjacent string literals */
/* two TABs + empty BULLET: six spaces */
/* "iterate" once; safe to use as ``if (cond) ADDTOBUF(); else whatever;'' */
/* ADD2NTOBUF: for "M temples and N altars"; seen_string() is safe to use
   multiple times within one expression; so is plur() */
/* -1: as menu; 0: not final;
                * 1: game over, alive; 2: game over, dead */
/* cause of death; only used if final==2 and mptr->lev==u.uz */
export async function print_mapseen(win, mptr, final, how, printdun) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    let depthstart = 0;
    let dnum = 0;
    let died_here = (final == 2 && on_level(game.u.uz, mptr.lev));
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    /* The quest and knox should appear to be level 1 to match
     * other text.
     */
    dnum = mptr.lev.dnum;
    if (dnum == (game.dungeon_topology.d_quest_dnum) || dnum == (game.dungeon_topology.d_knox_level).dnum) {
        depthstart = 1;
    } else {
        depthstart = game.dungeons[dnum].depth_start;
    }
    if (printdun) {
        if (game.dungeons[dnum].dunlev_ureached == game.dungeons[dnum].entry_lev || ((mptr.lev).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
            buf = sprintf(buf, "%s:", game.dungeons[dnum].dname);
        } else if (await builds_up(mptr.lev)) {
            buf = sprintf(buf, "%s: levels %d up to %d", game.dungeons[dnum].dname, depthstart + game.dungeons[dnum].entry_lev - 1, depthstart + game.dungeons[dnum].dunlev_ureached - 1);
        } else {
            buf = sprintf(buf, "%s: levels %d to %d", game.dungeons[dnum].dname, depthstart, depthstart + game.dungeons[dnum].dunlev_ureached - 1);
        }
        await add_menu_heading(win, buf);
    }
    i = depthstart + mptr.lev.dlevel - 1;
    if (((mptr.lev).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        buf = sprintf(buf, "%s%s:", (final != -1) ? "   " : "", endgamelevelname(tmpbuf, i));
    } else {
        buf = sprintf(buf, "%sLevel %d:", (final != -1) ? "   " : "", i);
    }
    if (game.flags.debug) {
        /* suppress the negative numbers in the endgame */
        /* wizmode prints out proto dungeon names for clarity */
        let slev = null;
        if ((slev = Is_special(mptr.lev)) != null) {
            buf = __nh_buf_append(buf, sprintf('', " [%s]", slev.proto));
        }
    }
    /* [perhaps print custom annotation on its own line when it's long] */
    if (mptr.custom) {
        buf = __nh_buf_append(buf, sprintf('', " \"%s\"", mptr.custom));
    }
    if (on_level(game.u.uz, mptr.lev)) {
        buf = __nh_buf_append(buf, sprintf('', " <- You %s here.", (final <= 0 || (final == 1 && how == ASCENDED)) ? "are" : (final == 1 && how == ESCAPED) ? "left from" : "were"));
    }
    Object.assign(any, cg.zeroany);
    if (final == -1) {
        any.a_int = ledger_no((mptr.lev)) + 1;
    }
    await add_menu(win, nul_glyphinfo, any, 0, 0, 0, 8, buf, 0);
    if (mptr.flags.forgot) {
        return;
    }
    if (((mptr.feat).nfount || (mptr.feat).nsink || (mptr.feat).nthrone || (mptr.feat).naltar || (mptr.feat).ngrave || (mptr.feat).ntree || (mptr.feat).nshop || (mptr.feat).ntemple)) {
        buf[0] = 0;
        i = 0;
        if (mptr.feat.nshop > 0) {
            /* List interests in an order vaguely corresponding to
         * how important they are.
         */
            if (mptr.feat.nshop > 1) {
                do {
                    if (mptr.feat.nshop) {
                        buf = __nh_buf_append(buf, sprintf('', "%s%s %s%s", (i++ > 0 ? ", " : "      "), seen_string((mptr.feat.nshop), ("shop")), ("shop"), (((mptr.feat.nshop) == 1) ? "" : "s")));
                    }
                } while (0);
            } else {
                buf = __nh_buf_append(buf, sprintf('', "%s%s", (i++ > 0 ? ", " : "      "), await an(shop_string(mptr.feat.shoptype))));
            }
        }
        if (mptr.feat.naltar > 0 || mptr.feat.ntemple > 0) {
            let atmp = 0;
            do {
                if (mptr.feat.ntemple && mptr.feat.naltar) {
                    buf = __nh_buf_append(buf, sprintf('', "%s%s %s%s and %s %s%s", (i++ > 0 ? ", " : "      "), seen_string((mptr.feat.ntemple), ("temple")), ("temple"), (((mptr.feat.ntemple) == 1) ? "" : "s"), seen_string((mptr.feat.naltar), ("altar")), ("altar"), (((mptr.feat.naltar) == 1) ? "" : "s")));
                } else if (mptr.feat.ntemple) {
                    do {
                        if (mptr.feat.ntemple) {
                            buf = __nh_buf_append(buf, sprintf('', "%s%s %s%s", (i++ > 0 ? ", " : "      "), seen_string((mptr.feat.ntemple), ("temple")), ("temple"), (((mptr.feat.ntemple) == 1) ? "" : "s")));
                        }
                    } while (0);
                } else if (mptr.feat.naltar) {
                    do {
                        if (mptr.feat.naltar) {
                            buf = __nh_buf_append(buf, sprintf('', "%s%s %s%s", (i++ > 0 ? ", " : "      "), seen_string((mptr.feat.naltar), ("altar")), ("altar"), (((mptr.feat.naltar) == 1) ? "" : "s")));
                        }
                    } while (0);
                }
            } while (0);
            /* being aware of a temple doesn't guarantee being aware of its
               altar (via entrance message when entering while blinded, or
               possibly it being out of view in an irregularly shaped room);
               FIXME: if all temples present have been desecrated, we ought
               to say so */
            /* only print out altar's god if they are all to your god */
            atmp = mptr.feat.msalign;
            atmp = (((atmp) == 3) ? 4 : (atmp));
            if ((((((atmp) & 7) == 0) ? (-128) : (((atmp) & 7) == 4) ? 1 : (((atmp) & 7)) - 2)) == game.u.ualign.type) {
                buf = __nh_buf_append(buf, sprintf('', " to %s", await align_gname(game.u.ualign.type)));
            }
        }
        do {
            if (mptr.feat.nthrone) {
                buf = __nh_buf_append(buf, sprintf('', "%s%s %s%s", (i++ > 0 ? ", " : "      "), seen_string((mptr.feat.nthrone), ("throne")), ("throne"), (((mptr.feat.nthrone) == 1) ? "" : "s")));
            }
        } while (0);
        do {
            if (mptr.feat.nfount) {
                buf = __nh_buf_append(buf, sprintf('', "%s%s %s%s", (i++ > 0 ? ", " : "      "), seen_string((mptr.feat.nfount), ("fountain")), ("fountain"), (((mptr.feat.nfount) == 1) ? "" : "s")));
            }
        } while (0);
        do {
            if (mptr.feat.nsink) {
                buf = __nh_buf_append(buf, sprintf('', "%s%s %s%s", (i++ > 0 ? ", " : "      "), seen_string((mptr.feat.nsink), ("sink")), ("sink"), (((mptr.feat.nsink) == 1) ? "" : "s")));
            }
        } while (0);
        do {
            if (mptr.feat.ngrave) {
                buf = __nh_buf_append(buf, sprintf('', "%s%s %s%s", (i++ > 0 ? ", " : "      "), seen_string((mptr.feat.ngrave), ("grave")), ("grave"), (((mptr.feat.ngrave) == 1) ? "" : "s")));
            }
        } while (0);
        do {
            if (mptr.feat.ntree) {
                buf = __nh_buf_append(buf, sprintf('', "%s%s %s%s", (i++ > 0 ? ", " : "      "), seen_string((mptr.feat.ntree), ("tree")), ("tree"), (((mptr.feat.ntree) == 1) ? "" : "s")));
            }
        } while (0);
        i = strlen("      ");
        buf[i] = highc(buf[i]);
        buf = strcat(buf, ".");
        await add_menu_str(win, buf);
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    if (mptr.flags.oracle) {
        buf = sprintf(buf, "%sOracle of Delphi.", "      ");
    } else if (((mptr.lev).dnum == (game.dungeon_topology.d_sokoban_dnum))) {
        buf = sprintf(buf, "%s%s.", "      ", mptr.flags.sokosolved ? "Solved" : "Unsolved");
    } else if (mptr.flags.bigroom) {
        buf = sprintf(buf, "%sA very big room.", "      ");
    } else if (mptr.flags.roguelevel) {
        buf = sprintf(buf, "%sA primitive area.", "      ");
    } else if (on_level(mptr.lev, (game.dungeon_topology.d_qstart_level))) {
        buf = sprintf(buf, "%sHome%s.", "      ", mptr.flags.notreachable ? " (no way back...)" : "");
        if (game.u.uevent.qcompleted) {
            buf = sprintf(buf, "%sCompleted quest for %s.", "      ", ldrname());
        } else if (mptr.flags.questing) {
            buf = sprintf(buf, "%sGiven quest by %s.", "      ", ldrname());
        }
    } else if (mptr.flags.ludios) {
        buf = sprintf(buf, "%sFort Ludios.", "      ");
    } else if (mptr.flags.castle) {
        buf = nh_snprintf("print_mapseen", 3663, buf, 256 /* sizeof(char [256]) */, "%sThe castle%s.", "      ", tunesuffix(mptr, tmpbuf, 256 /* sizeof(char [256]) */));
    } else if (mptr.flags.valley) {
        buf = sprintf(buf, "%sValley of the Dead.", "      ");
    } else if (mptr.flags.vibrating_square) {
        buf = sprintf(buf, "%sGateway to Moloch's Sanctum.", "      ");
    } else if (mptr.flags.msanctum) {
        buf = sprintf(buf, "%sMoloch's Sanctum.", "      ");
    }
    if (buf) {
        await add_menu_str(win, buf);
    }
    if (mptr.flags.quest_summons) {
        buf = sprintf(buf, "%sSummoned by %s.", "      ", ldrname());
        await add_menu_str(win, buf);
    }
    if (mptr.br) {
        buf = sprintf(buf, "%s%s to %s", "      ", br_string2(mptr.br), game.dungeons[mptr.br.end2.dnum].dname);
        /* Since mapseen objects are printed out in increasing order
         * of dlevel, clarify which level this branch is going to
         * if the branch goes upwards.  Unless it's the end game.
         */
        if (mptr.br.end1_up && !(((mptr.br.end2)).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
            buf = __nh_buf_append(buf, sprintf('', ", level %d", depth((mptr.br.end2))));
        }
        buf = strcat(buf, ".");
        await add_menu_str(win, buf);
    }
    if (mptr.final_resting_place || final > 0) {
        /* maybe print out bones details */
        let bp = null;
        let kncnt = !died_here ? 0 : 1;
        for (bp = mptr.final_resting_place; bp; bp = bp.next) {
            if (bp.bonesknown || game.flags.debug || final > 0) {
                ++kncnt;
            }
        }
        if (kncnt) {
            buf = sprintf(buf, "%s%s", "      ", "Final resting place for");
            await add_menu_str(win, buf);
            if (died_here) {
                await formatkiller(tmpbuf, 256 /* sizeof(char [256]) */, how, (1));
                /* rephrase a few death reasons to work with "you" */
                tmpbuf = strsubst(tmpbuf, " himself", " yourself");
                tmpbuf = strsubst(tmpbuf, " herself", " yourself");
                tmpbuf = strsubst(tmpbuf, " his ", " your ");
                tmpbuf = strsubst(tmpbuf, " her ", " your ");
                buf = nh_snprintf("print_mapseen", 3716, buf, 256 /* sizeof(char [256]) */, "%s%syou, %s%c", "      ", "   ", tmpbuf, --kncnt ? 44 : 46);
                await add_menu_str(win, buf);
            }
            for (bp = mptr.final_resting_place; bp; bp = bp.next) {
                if (bp.bonesknown || game.flags.debug || final > 0) {
                    buf = sprintf(buf, "%s%s%s, %s%c", "      ", "   ", bp.who, bp.how, --kncnt ? 44 : 46);
                    await add_menu_str(win, buf);
                }
            }
        }
    }
}
/* !SFCTOOL */
/*dungeon.c*/
/* get base and range and set those entries to true */
/* No level created for this prototype, goto next. */
/* free(lvl_chain); -- recorded in pd.tmplevel[] */
/* adjust the branch's position on the list */
/* private Lua state for this function */
/* using a resource from the executable */
/* using a file or DLB file */
/*
     * Read in each dungeon and transfer the results to the internal
     * dungeon arrays.
     */
/*
             * Recursively place the generated levels for this dungeon.  This
             * routine will attempt all possible combinations before giving
             * up.
             */
/* sets lastseentyp[u.ux][u.uy]; needed for switch_terrain()
           somewhere back up the call chain */
/* might have just left solid rock and unblocked levitation */
/* Stay inside the Wizard's tower when feasible.
           We use the W Tower's exclusion region for the
           destination instead of its enclosing region.
           Note: up vs down doesn't matter in this case
           because both specify the same exclusion area. */
/* can't rise up from inside the top of the Wizard's tower */
/* depth() is the number of elevation units (levels) below
           the theoretical surface; in a builds-up branch, that value
           ends up making the harder to reach levels be treated as if
           they were easier; adjust for the extra effort involved in
           going down to the entrance and then up to the location */
/*
         * The inside of the Wizard's Tower is also effectively a
         * builds-up area, reached from a portal an arbitrary distance
         * below rather than stairs 1 level beneath the entry level.
         */
/*
             * Handling this properly would need more information here:
             * an inside/outside flag, or coordinates to calculate it.
             * Unfortunately level difficulty may be wanted before
             * coordinates have been chosen so simply extending this
             * routine to take extra arguments is not sufficient to cope.
             * The difference beyond naive depth-from-surface is small
             * relative to the overall depth, so just ignore complications
             * posed by W_tower.
             */
/*
             * 'Proof' by example:  suppose the entrance to sokoban is
             * on dungeon level 9, leading up to bottom sokoban level
             * of 8 [entry_lev].  When the hero is on sokoban level 8
             * [uz.dlevel], depth() yields eight but he has ventured
             * one level beyond 9, so difficulty depth should be 10:
             *   8 + 2 * (8 - 8 + 1) => 10.
             * Going up to 7, depth is 7 but hero will be two beyond 9:
             *   7 + 2 * (8 - 7 + 1) => 11.
             * When he goes up to level 6, three levels beyond 9:
             *   6 + 2 * (8 - 6 + 1) => 12.
             * And the top level of sokoban at 5, four levels beyond 9:
             *   5 + 2 * (8 - 5 + 1) => 13.
             * The same applies to Vlad's Tower, although the increment
             * there is inconsequential compared to overall depth.
             */
/* not a specific level; try branch names */
/* either wizard mode, or else _both_ sides of branch seen; */
/* (flags & VISITED)==VISITED: see comment about amnesia above */
/* print any branches before this level */
/* print branches after the last special level */
/* only report "no portal found" when actually expecting a portal */
/* flags.quest_summons disabled once quest finished */
/* no trap implies that invocation has been performed */
/* clone the bonesinfo so we aren't dependent upon this
           level being in memory */
/* game in progress; 'why' is 0 for normal #overview, -1 if user prefixed
       #overview with 'm'; 'reason' for end of game isn't applicable: use 0 */
/* capitalizing it makes it a sentence; terminate with '.' */
/* presence of the ludios branch in #overview output indicates that
           the player has made it onto the level; presence of this annotation
           indicates that the fort's entrance has been seen (or mapped) */
/* quest entrance is not mutually-exclusive with bigroom or rogue level */
/* disclosure occurs before bones creation, so listing dead
                   hero here doesn't give away whether bones are produced */
