// dungeon.js — Dungeon initialization.
// C ref: dungeon.c — init_dungeons orchestrates the per-dungeon
//        init_dungeon_dungeons → init_level → place_level chain that
//        decides where each special level lives in its dungeon.
//
// Direct port. No fastforward, no hardcoded sequences. All PRNG
// consumption matches C's call sequence given the same seed and mode
// (game.flags.debug ↔ wizard).
//
// What the data ports: dat/dungeon.lua transcribed as a JS array,
// preserving field order per entry. The C side parses lua dynamically;
// we hardcode the same data because the lua dungeon definition is
// frozen in 5.0 and not seed-dependent. If 5.1 changes dungeon.lua,
// regenerate this file from dat/dungeon.lua.

import { game } from './gstate.js';
import { rn2, rnd } from './rng.js';

// Constants (from include/global.h, include/dgn_file.h).
export const MAXLEVEL = 32;
export const MAXDUNGEON = 16;
export const LEV_LIMIT = 50;
export const BRANCH_LIMIT = 32;

// Level/dungeon flag bits.
export const TOWN = 0x01;
export const HELLISH = 0x02;
export const MAZELIKE = 0x04;
export const ROGUELIKE = 0x08;
export const UNCONNECTED = 0x10;

// Alignment bits (from align.h: AM_LAWFUL=4, AM_NEUTRAL=2, AM_CHAOTIC=1,
// AM_NONE=0). D_ALIGN values shift these into bits 4-6 of dgn_flags.
export const AM_NONE = 0;
export const AM_CHAOTIC = 1;
export const AM_NEUTRAL = 2;
export const AM_LAWFUL = 4;

export const D_ALIGN_NONE = 0;
export const D_ALIGN_CHAOTIC = AM_CHAOTIC << 4;
export const D_ALIGN_NEUTRAL = AM_NEUTRAL << 4;
export const D_ALIGN_LAWFUL = AM_LAWFUL << 4;

// Branch types (dgn_file.h).
export const TBR_STAIR = 0;
export const TBR_PORTAL = 1;
export const TBR_NO_DOWN = 2;
export const TBR_NO_UP = 3;

// Branch directions (dgn_file.h: 1 = up, 0 = down). Stored as boolean
// `up` in tmpbranch.

// Helpers for parsing lua-style flags/alignment from a JS string or
// array. C's get_dgn_flags and get_dgn_align logic.
function flagsToInt(flags) {
    if (flags == null) return 0;
    const map = { town: TOWN, hellish: HELLISH, mazelike: MAZELIKE,
                  roguelike: ROGUELIKE, unconnected: UNCONNECTED };
    if (typeof flags === 'string') return map[flags] || 0;
    let r = 0;
    for (const f of flags) r |= (map[f] || 0);
    return r;
}
function alignToInt(align) {
    if (!align) return D_ALIGN_NONE;
    return ({ unaligned: D_ALIGN_NONE, noalign: D_ALIGN_NONE,
              lawful: D_ALIGN_LAWFUL, neutral: D_ALIGN_NEUTRAL,
              chaotic: D_ALIGN_CHAOTIC })[align] ?? D_ALIGN_NONE;
}
function brTypeToInt(t) {
    return ({ stair: TBR_STAIR, portal: TBR_PORTAL,
              no_down: TBR_NO_DOWN, no_up: TBR_NO_UP })[t || 'stair'] ?? TBR_STAIR;
}
function brDirToInt(d) {
    return d === 'up' ? 1 : 0;
}

// dungeon.lua transcribed. Order matters — C's init_dungeons iterates
// dungeons in this order, processing each via init_dungeon_dungeons
// before moving to the next.
export const DUNGEON_DEF = [
    {
        name: "The Dungeons of Doom", bonetag: "D",
        base: 25, range: 5, alignment: "unaligned",
        themerooms: "themerms.lua",
        branches: [
            { name: "The Gnomish Mines", base: 2, range: 3 },
            { name: "Sokoban", chainlevel: "oracle", base: 1, direction: "up" },
            { name: "The Quest", chainlevel: "oracle", base: 6, range: 2, branchtype: "portal" },
            { name: "Fort Ludios", base: 18, range: 4, branchtype: "portal" },
            { name: "Gehennom", chainlevel: "castle", base: 0, branchtype: "no_down" },
            { name: "The Elemental Planes", base: 1, branchtype: "no_down", direction: "up" },
        ],
        levels: [
            { name: "rogue", bonetag: "R", base: 15, range: 4, flags: "roguelike" },
            { name: "oracle", bonetag: "O", base: 5, range: 5, alignment: "neutral" },
            { name: "bigrm", bonetag: "B", base: 10, range: 3, chance: 40, nlevels: 13 },
            { name: "medusa", base: -5, range: 4, nlevels: 4, alignment: "chaotic" },
            { name: "castle", base: -1 },
        ],
    },
    {
        name: "Gehennom", bonetag: "G",
        base: 20, range: 5,
        flags: ["mazelike", "hellish"], lvlfill: "hellfill",
        alignment: "noalign",
        branches: [
            { name: "Vlad's Tower", base: 9, range: 5, direction: "up" },
        ],
        levels: [
            { name: "valley", bonetag: "V", base: 1 },
            { name: "sanctum", base: -1 },
            { name: "juiblex", bonetag: "J", base: 4, range: 4 },
            { name: "baalz", bonetag: "B", base: 6, range: 4 },
            { name: "asmodeus", bonetag: "A", base: 2, range: 6 },
            { name: "wizard1", base: 11, range: 6 },
            { name: "wizard2", bonetag: "X", chainlevel: "wizard1", base: 1 },
            { name: "wizard3", bonetag: "Y", chainlevel: "wizard1", base: 2 },
            { name: "orcus", bonetag: "O", base: 10, range: 6 },
            { name: "fakewiz1", bonetag: "F", base: -6, range: 4 },
            { name: "fakewiz2", bonetag: "G", base: -6, range: 4 },
        ],
    },
    {
        name: "The Gnomish Mines", bonetag: "M",
        base: 8, range: 2, alignment: "lawful",
        flags: ["mazelike"], lvlfill: "minefill",
        branches: [],
        levels: [
            { name: "minetn", bonetag: "T", base: 3, range: 2, nlevels: 7, flags: "town" },
            { name: "minend", base: -1, nlevels: 3 },
        ],
    },
    {
        name: "The Quest", bonetag: "Q",
        base: 5, range: 2, branches: [],
        levels: [
            { name: "x-strt", base: 1, range: 1 },
            { name: "x-loca", bonetag: "L", base: 3, range: 1 },
            { name: "x-goal", base: -1 },
        ],
    },
    {
        name: "Sokoban", base: 4, alignment: "neutral",
        flags: ["mazelike"], entry: -1, branches: [],
        levels: [
            { name: "soko1", base: 1, nlevels: 2 },
            { name: "soko2", base: 2, nlevels: 2 },
            { name: "soko3", base: 3, nlevels: 2 },
            { name: "soko4", base: 4, nlevels: 2 },
        ],
    },
    {
        name: "Fort Ludios", base: 1, bonetag: "K",
        flags: ["mazelike"], alignment: "unaligned",
        branches: [],
        levels: [
            { name: "knox", bonetag: "K", base: -1 },
        ],
    },
    {
        name: "Vlad's Tower", base: 3, bonetag: "T",
        protofile: "tower", alignment: "chaotic",
        flags: ["mazelike"], entry: -1, branches: [],
        levels: [
            { name: "tower1", base: 1 },
            { name: "tower2", base: 2 },
            { name: "tower3", base: 3 },
        ],
    },
    {
        name: "The Elemental Planes", bonetag: "E",
        base: 6, alignment: "unaligned",
        flags: ["mazelike"], entry: -2, branches: [],
        levels: [
            { name: "astral", base: 1 },
            { name: "water", base: 2 },
            { name: "fire", base: 3 },
            { name: "air", base: 4 },
            { name: "earth", base: 5 },
            { name: "dummy", base: 6 },
        ],
    },
    {
        name: "The Tutorial", base: 2,
        flags: ["mazelike", "unconnected"], branches: [],
        levels: [
            { name: "tut-1", base: 1 },
            { name: "tut-2", base: 2 },
        ],
    },
];

// proto_dungeon (pd) holds work-in-progress data while iterating
// dungeons. C uses fixed arrays sized to LEV_LIMIT/BRANCH_LIMIT/MAXDUNGEON;
// JS uses growable arrays of plain objects.
function newProtoDungeon() {
    return {
        start: 0,         // first level idx in current dungeon
        n_levs: 0,        // total levels accumulated across dungeons
        n_brs: 0,         // total branches accumulated
        tmpdungeon: [],   // [{name, levels, branches, base, rand, chance, flags, align, entry, ...}]
        tmplevel: [],     // [{name, lev:{base,rand}, chance, rndlevs, flags, chainlvl, chain, boneschar}]
        tmpbranch: [],    // [{name, lev:{base,rand}, type, up, chain}]
        final_lev: [],    // [s_level | null]; index parallel to tmplevel
    };
}

// svd / svb / svn / svs equivalents — single shared instance per game.
// Reset by init_dungeons.
const svd = { dungeons: [] };       // one entry per dungeon: {dname, num_dunlevs, ledger_start, depth_start, dunlev_ureached, entry_lev, flags, boneid, fill_lvl, ...}
const svb = { branches: null };     // linked list head
const svn = { n_dgns: 0 };
const svs = { sp_levchn: null };    // s_level chain head

export function getSvd() { return svd; }
export function getSvb() { return svb; }
export function getSvn() { return svn; }
export function getSpLevchn() { return svs.sp_levchn; }

function resetState() {
    svd.dungeons = [];
    svb.branches = null;
    svn.n_dgns = 0;
    svs.sp_levchn = null;
}

// C ref: dungeon.c:380 level_range
function level_range(dgn, base, randc, chain, pd) {
    const lmax = svd.dungeons[dgn].num_dunlevs;
    let adjustedBase = base;
    if (chain >= 0) {
        const levtmp = pd.final_lev[chain];
        if (!levtmp) throw new Error('level_range: empty chain level');
        adjustedBase = base + levtmp.dlevel.dlevel;
    } else {
        if (adjustedBase < 0) adjustedBase = (lmax + adjustedBase + 1);
    }
    if (adjustedBase < 1 || adjustedBase > lmax)
        throw new Error(`level_range: base value out of range (base=${adjustedBase}, lmax=${lmax})`);
    let count;
    if (randc === -1) {
        count = lmax - adjustedBase + 1;
    } else if (randc) {
        count = ((adjustedBase + randc - 1) > lmax) ? (lmax - adjustedBase + 1) : randc;
    } else {
        count = 1;
    }
    return { count, adjustedBase };
}

// C ref: dungeon.c:597 possible_places
function possible_places(idx, map, pd) {
    const lev = pd.final_lev[idx];
    for (let i = 0; i <= MAXLEVEL; i++) map[i] = false;
    const tlevel = pd.tmplevel[idx];
    const lr = level_range(lev.dlevel.dnum, tlevel.lev.base, tlevel.lev.rand,
                           tlevel.chain, pd);
    let count = lr.count;
    const start = lr.adjustedBase;
    for (let i = start; i < start + count; i++) map[i] = true;
    // mark off already placed levels
    for (let i = pd.start; i < idx; i++) {
        if (pd.final_lev[i] && map[pd.final_lev[i].dlevel.dlevel]) {
            map[pd.final_lev[i].dlevel.dlevel] = false;
            --count;
        }
    }
    return count;
}

// C ref: dungeon.c:632 pick_level
function pick_level(map, nth) {
    for (let i = 1; i <= MAXLEVEL; i++) {
        if (map[i]) {
            if (nth-- === 0) return i;
        }
    }
    throw new Error('pick_level: ran out of valid levels');
}

// C ref: dungeon.c:665 place_level — recursive backtracking. Each
// iteration emits exactly one rn2(npossible) call; wrong arg here
// scrambles every PRNG draw downstream.
function place_level(proto_index, pd) {
    if (proto_index === pd.n_levs) return true;
    const lev = pd.final_lev[proto_index];
    if (!lev) return place_level(proto_index + 1, pd);
    const map = new Array(MAXLEVEL + 1).fill(false);
    let npossible = possible_places(proto_index, map, pd);
    for (; npossible; --npossible) {
        lev.dlevel.dlevel = pick_level(map, rn2(npossible));
        if (place_level(proto_index + 1, pd)) return true;
        map[lev.dlevel.dlevel] = false;
    }
    return false;
}

// C ref: dungeon.c:565 init_level — chance check + level allocation.
// In wizard mode, the rn2(100) chance check is skipped entirely
// (wizard always succeeds).
function init_level(dgn, proto_index, pd) {
    const tlevel = pd.tmplevel[proto_index];
    pd.final_lev[proto_index] = null;
    if (!game.flags?.debug && tlevel.chance <= rn2(100)) return;
    const new_level = {
        proto: tlevel.name,
        boneid: tlevel.boneschar || 0,
        dlevel: { dnum: dgn, dlevel: 0 },
        flags: {
            town: !!(tlevel.flags & TOWN),
            hellish: !!(tlevel.flags & HELLISH),
            maze_like: !!(tlevel.flags & MAZELIKE),
            rogue_like: !!(tlevel.flags & ROGUELIKE),
            align: (tlevel.flags & 0x70 /* D_ALIGN_MASK */) >> 4,
        },
        rndlevs: tlevel.rndlevs || 0,
        next: null,
    };
    if (!new_level.flags.align) {
        new_level.flags.align = (pd.tmpdungeon[dgn].flags & 0x70) >> 4;
    }
    pd.final_lev[proto_index] = new_level;
}

// C ref: dungeon.c:414 parent_dlevel — emits one rn2(num) for the
// parent-dungeon level where this dungeon's branch attaches.
function parent_dlevel(s, pd) {
    const dnum = parent_dnum(s, pd);
    const i0 = find_branch(s, pd);
    const lr = level_range(dnum, pd.tmpbranch[i0].lev.base,
                           pd.tmpbranch[i0].lev.rand, pd.tmpbranch[i0].chain, pd);
    const num = lr.count;
    const base = lr.adjustedBase;
    let i = rn2(num);
    const j = i;
    let curr;
    do {
        if (++i >= num) i = 0;
        curr = svb.branches;
        while (curr) {
            if ((curr.end1.dnum === dnum && curr.end1.dlevel === base + i)
             || (curr.end2.dnum === dnum && curr.end2.dlevel === base + i))
                break;
            curr = curr.next;
        }
    } while (curr && i !== j);
    return base + i;
}

// C ref: dungeon.c:346 parent_dnum — find the parent dungeon by walking
// tmpdungeon[]'s `branches` counts. tmpdungeon[i].branches is the COUNT
// of branches that dungeon i contributes to pd.tmpbranch (flat shared
// array across all dungeons).
function parent_dnum(s, pd) {
    let i = find_branch(s, pd);
    for (let pdnum = 0; pdnum < pd.tmpdungeon.length; pdnum++) {
        if (pd.tmpdungeon[pdnum].name === s) break;
        i -= pd.tmpdungeon[pdnum].branches;
        if (i < 0) return pdnum;
    }
    throw new Error(`parent_dnum: couldn't resolve branch for ${s}`);
}

// C ref: dungeon.c:280 find_branch — returns tmpbranch index by name.
function find_branch(s, pd) {
    for (let i = 0; i < pd.tmpbranch.length; i++) {
        if (pd.tmpbranch[i].name === s) return i;
    }
    throw new Error(`find_branch: no branch named ${s}`);
}

// C ref: dungeon.c:512 add_branch — allocates a branch, fills end1/end2,
// inserts into svb.branches list. Calls parent_dlevel (rn2 site).
let _branch_id = 0;
function add_branch(dgn, child_entry_level, pd) {
    const branch_num = find_branch(svd.dungeons[dgn].dname, pd);
    const tbr = pd.tmpbranch[branch_num];
    const new_branch = {
        next: null,
        id: _branch_id++,
        type: correct_branch_type(tbr),
        end1: { dnum: parent_dnum(svd.dungeons[dgn].dname, pd),
                dlevel: parent_dlevel(svd.dungeons[dgn].dname, pd) },
        end2: { dnum: dgn, dlevel: child_entry_level },
        end1_up: !!tbr.up,
    };
    insert_branch(new_branch);
    return new_branch;
}

// C ref: dungeon.c:439 correct_branch_type
function correct_branch_type(tbr) {
    switch (tbr.type) {
        case TBR_STAIR: return 0;     // BR_STAIR
        case TBR_NO_UP: return tbr.up ? 2 /* BR_NO_END1 */ : 3 /* BR_NO_END2 */;
        case TBR_NO_DOWN: return tbr.up ? 3 /* BR_NO_END2 */ : 2 /* BR_NO_END1 */;
        case TBR_PORTAL: return 1;    // BR_PORTAL
    }
    return 0;
}

// C ref: dungeon.c:462 insert_branch — sorted insertion into svb.branches.
function insert_branch(new_branch) {
    const branchVal = (bp) =>
        ((bp.end1.dnum * (MAXLEVEL + 1) + bp.end1.dlevel)
            * (MAXDUNGEON + 1) * (MAXLEVEL + 1))
        + (bp.end2.dnum * (MAXLEVEL + 1) + bp.end2.dlevel);
    const new_val = branchVal(new_branch);
    let prev = null, prev_val = -1;
    let curr = svb.branches, curr_val = 0;
    while (curr) {
        curr_val = branchVal(curr);
        if (prev_val < new_val && new_val <= curr_val) break;
        prev_val = curr_val;
        prev = curr;
        curr = curr.next;
    }
    if (prev) {
        new_branch.next = curr;
        prev.next = new_branch;
    } else {
        new_branch.next = svb.branches;
        svb.branches = new_branch;
    }
}

// C ref: dungeon.c:538 add_level — insert s_level into svs.sp_levchn,
// ordered by (dnum, dlevel).
function add_level(new_lev) {
    let prev = null, curr = svs.sp_levchn;
    while (curr) {
        if (curr.dlevel.dnum === new_lev.dlevel.dnum
            && curr.dlevel.dlevel > new_lev.dlevel.dlevel) break;
        prev = curr; curr = curr.next;
    }
    if (!prev) {
        new_lev.next = svs.sp_levchn;
        svs.sp_levchn = new_lev;
    } else {
        new_lev.next = curr;
        prev.next = new_lev;
    }
}

// C ref: dungeon.c:932 init_dungeon_set_entry
function init_dungeon_set_entry(pd, dngidx) {
    const dgn_entry = pd.tmpdungeon[dngidx].entry_lev;
    const sd = svd.dungeons[dngidx];
    if (dgn_entry < 0) {
        sd.entry_lev = sd.num_dunlevs + dgn_entry + 1;
        if (sd.entry_lev <= 0) sd.entry_lev = 1;
    } else if (dgn_entry > 0) {
        sd.entry_lev = dgn_entry;
        if (sd.entry_lev > sd.num_dunlevs) sd.entry_lev = sd.num_dunlevs;
    } else {
        sd.entry_lev = 1;
    }
}

// C ref: dungeon.c:959 init_dungeon_set_depth — emits parent_dlevel
// rn2(num) via add_branch.
function init_dungeon_set_depth(pd, dngidx) {
    const br = add_branch(dngidx, svd.dungeons[dngidx].entry_lev, pd);
    let from_depth, from_up;
    if (br.end1.dnum === dngidx) {
        from_depth = depth(br.end2);
        from_up = !br.end1_up;
    } else {
        from_depth = depth(br.end1);
        from_up = br.end1_up;
    }
    svd.dungeons[dngidx].depth_start =
        from_depth + (br.type === 1 /* BR_PORTAL */ ? 0 : (from_up ? -1 : 1))
        - (svd.dungeons[dngidx].entry_lev - 1);
}

// C ref: dungeon.c:1530 depth — runs along branches summing.
function depth(lev) {
    let sd = svd.dungeons[lev.dnum];
    if (!sd) return 0;
    let d = sd.depth_start + lev.dlevel - 1;
    return d;
}

// C ref: dungeon.c:996 init_dungeon_dungeons — per-dungeon entry. Emits
// the dgn_chance rn2(100) (line 1022, normal mode only) and the
// num_dunlevs rn2(rand) (line 1074, only if rand>0).
function init_dungeon_dungeons(pd, dngidx, def) {
    const dgn_chance = def.chance ?? 100;
    const dgn_range = def.range ?? 0;
    const dgn_base = def.base ?? 1;
    // C stores flags and align as SEPARATE fields on tmpdungeon (see
    // dungeon.c:1056-1057). Don't merge — D_ALIGN_CHAOTIC (0x10) and
    // UNCONNECTED (0x10) collide bit-for-bit and a chaotic dungeon
    // would falsely register as unconnected. Levels DO merge these
    // fields (dungeon.c:838 `tmpl->flags = lvl_flags | lvl_align`),
    // and the level-side check uses the D_ALIGN_MASK shift; dungeon-
    // side checks read each field separately.
    const dgn_align = alignToInt(def.alignment);
    const dgn_flags = flagsToInt(def.flags);
    const dgn_entry = def.entry ?? 0;

    if (!game.flags?.debug && dgn_chance && dgn_chance <= rn2(100)) {
        // dungeon skipped; the proto_dungeon's slot at dngidx is not used
        return false;
    }

    // populate tmpdungeon entry for this dungeon (mirrors C's per-dungeon
    // record kept in pd->tmpdungeon[dngidx]).
    pd.tmpdungeon[dngidx] = {
        name: def.name,
        base: dgn_base, rand: dgn_range,
        chance: dgn_chance, flags: dgn_flags, align: dgn_align,
        entry_lev: dgn_entry,
        levels: 0, branches: 0,  // set by init_dungeon_levels/branches below
    };
    // populate svd.dungeons[dngidx]. Note: align is taken from dgn_align,
    // not extracted from dgn_flags (the latter has UNCONNECTED at the
    // same bit position as D_ALIGN_CHAOTIC).
    svd.dungeons[dngidx] = {
        dname: def.name,
        boneid: def.bonetag ? def.bonetag.charCodeAt(0) : 0,
        flags: { hellish: !!(dgn_flags & HELLISH), maze_like: !!(dgn_flags & MAZELIKE),
                 rogue_like: !!(dgn_flags & ROGUELIKE), align: dgn_align,
                 unconnected: !!(dgn_flags & UNCONNECTED) },
        ledger_start: 0, depth_start: 0, num_dunlevs: 0,
        dunlev_ureached: 0, entry_lev: 0,
        fill_lvl: def.lvlfill || '',
        proto: def.protofile || '',
    };

    // levels
    const levels = def.levels || [];
    pd.tmpdungeon[dngidx].levels = levels.length;
    for (let f = 0; f < levels.length; f++) {
        const lvl = levels[f];
        const lvl_base = lvl.base ?? 1;
        const lvl_range = lvl.range ?? 0;
        const lvl_nlevels = lvl.nlevels ?? 0;
        const lvl_chance = lvl.chance ?? 100;
        const lvl_align = alignToInt(lvl.alignment);
        const lvl_flags = flagsToInt(lvl.flags) | lvl_align;
        const tmpl = {
            name: lvl.name,
            chainlvl: lvl.chainlevel || null,
            lev: { base: lvl_base, rand: lvl_range },
            chance: lvl_chance,
            rndlevs: lvl_nlevels,
            flags: lvl_flags,
            boneschar: lvl.bonetag ? lvl.bonetag.charCodeAt(0) : 0,
            chain: -1,
        };
        if (tmpl.chainlvl) {
            for (let bi = 0; bi < pd.n_levs + f; bi++) {
                if (pd.tmplevel[bi].name === tmpl.chainlvl) {
                    tmpl.chain = bi;
                    break;
                }
            }
            if (tmpl.chain === -1)
                throw new Error(`Could not chain level ${lvl.name} to ${tmpl.chainlvl}`);
        }
        pd.tmplevel[pd.n_levs + f] = tmpl;
    }
    pd.n_levs += levels.length;
    if (pd.n_levs > LEV_LIMIT) throw new Error('init_dungeon: too many special levels');

    // branches
    const branches = def.branches || [];
    pd.tmpdungeon[dngidx].branches = branches.length;
    for (let f = 0; f < branches.length; f++) {
        const br = branches[f];
        const tmpb = {
            name: br.name,
            lev: { base: br.base, rand: br.range || 0 },
            type: brTypeToInt(br.branchtype),
            up: brDirToInt(br.direction),
            chain: -1,
        };
        if (br.chainlevel) {
            for (let bi = 0; bi < pd.n_levs + f - 1; bi++) {
                if (pd.tmplevel[bi].name === br.chainlevel) {
                    tmpb.chain = bi;
                    break;
                }
            }
            if (tmpb.chain === -1)
                throw new Error(`Could not chain branch ${br.name} to ${br.chainlevel}`);
        }
        pd.tmpbranch[pd.n_brs + f] = tmpb;
    }
    pd.n_brs += branches.length;
    if (pd.n_brs > BRANCH_LIMIT) throw new Error('init_dungeon: too many branches');

    // num_dunlevs — C uses rn1(dgn_range, dgn_base) which expands to
    // rn2(dgn_range) + dgn_base. Direct rn2() so the log records the
    // bare PRNG call (rn1 in C is a macro/inline, not a separate log
    // entry).
    if (dgn_range)
        svd.dungeons[dngidx].num_dunlevs = rn2(dgn_range) + dgn_base;
    else
        svd.dungeons[dngidx].num_dunlevs = dgn_base;

    if (dngidx === 0) {
        svd.dungeons[dngidx].ledger_start = 0;
        svd.dungeons[dngidx].depth_start = 1;
        svd.dungeons[dngidx].dunlev_ureached = 1;
    } else {
        svd.dungeons[dngidx].ledger_start =
            svd.dungeons[dngidx - 1].ledger_start
            + svd.dungeons[dngidx - 1].num_dunlevs;
        svd.dungeons[dngidx].dunlev_ureached = 0;
    }

    init_dungeon_set_entry(pd, dngidx);
    // C ref: dungeon.c:1097 — UNCONNECTED dungeons skip parent setup
    // (Tutorial, e.g.). dngidx 0 (Doom) is also unparented.
    if (svd.dungeons[dngidx].flags.unconnected) {
        svd.dungeons[dngidx].depth_start = 1;
    } else if (dngidx > 0) {
        init_dungeon_set_depth(pd, dngidx);
    }

    if (svd.dungeons[dngidx].num_dunlevs > MAXLEVEL)
        svd.dungeons[dngidx].num_dunlevs = MAXLEVEL;

    return true;
}

// C ref: dungeon.c:1116 init_castle_tune — 5x rn2(7) for the castle's
// musical sequence. Always fires (no wizard guard).
function init_castle_tune(svt) {
    for (let i = 0; i < 5; i++) {
        // svt.tune[i] = 'A' + rn2(7);  — we don't store the tune value
        // anywhere yet; the rn2 consumption is what matters for parity.
        rn2(7);
    }
}

// C ref: dungeon.c:1238 init_dungeons — top-level entry. Mirrors the
// while(lua_next) loop, processing each dungeon in DUNGEON_DEF order.
export function init_dungeons() {
    resetState();
    _branch_id = 0;
    svn.n_dgns = DUNGEON_DEF.length;
    const pd = newProtoDungeon();
    let cl = 0;
    let i = 0;
    let dungeons_kept = 0;
    for (const def of DUNGEON_DEF) {
        if (init_dungeon_dungeons(pd, dungeons_kept, def)) {
            for (; cl < pd.n_levs; cl++) {
                init_level(dungeons_kept, cl, pd);
            }
            if (!place_level(pd.start, pd))
                throw new Error("init_dungeons: couldn't place levels");
            for (; pd.start < pd.n_levs; pd.start++) {
                if (pd.final_lev[pd.start]) add_level(pd.final_lev[pd.start]);
            }
            dungeons_kept++;
        }
        i++;
    }
    init_castle_tune(null);
    svn.n_dgns = dungeons_kept;
    return pd;
}
