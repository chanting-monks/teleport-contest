// levelfile.js — memory-backed nhfp implementation for the
// NetHack save/restore level-file abstraction.
//
// Why: in C, NetHack writes per-level state to disk files
// (create_levelfile/savelev/close_nhfile, then open_levelfile/
// getlev/close_nhfile to restore).  Headless contest mode has
// no filesystem; the C calls would normally route through
// stdio.  This runtime backs the abstraction with an in-memory
// per-ledger buffer of sf_X-typed values.
//
// Design (per docs/TRANSPORT.md four-axis plan, Axis D engine
// wiring, prerequisite for ^V wizlevelport per
// project_wizlevelport_blocked memory):
//
//   - `_store` is a Map<ledger_no, Buffer> where Buffer is an
//     array of `{t, n, v?, b?, c?}` entries.
//   - Each sf_X call (sfo_* for write, sfi_* for read) routes
//     through game.sfoprocs[fnidx]/game.sfiprocs[fnidx] to write
//     or read one entry.
//   - `t` is the sf type tag ('int', 'monst', etc.).
//   - `v` is the serialized value (scalar or deep-clone of
//     struct).
//   - `b` is the byte buffer for sf_char(nhfp, buf, "tag", cnt)
//     forms — `c` is the cnt.
//
// Limitations:
//   - savelev/getlev (which actually call the sf_X functions)
//     live in save.c/restore.c which aren't yet in the
//     translator's SOURCES list.  Without those, level
//     transitions still don't move state — but this runtime
//     provides the foundation so adding save.c next is a clean
//     follow-up.

import { game } from '../gstate.js';

const _store = new Map();
const _FNIDX = 0;
let _installed = false;

function _writeFn(t) {
    return (nhfp, val, myname, cnt) => {
        if (!nhfp || !nhfp.buffer) return;
        if (cnt !== undefined && cnt > 0
            && val && typeof val === 'object'
            && !Array.isArray(val) && val.value === undefined
            && typeof val[0] !== 'undefined') {
            const arr = new Array(cnt);
            for (let i = 0; i < cnt; i++) arr[i] = val[i] | 0;
            nhfp.buffer.push({ t, n: myname, c: cnt, b: arr });
            return;
        }
        const v = (val && typeof val === 'object' && val.value !== undefined)
            ? val.value : val;
        const copy = (typeof v === 'object' && v !== null)
            ? JSON.parse(JSON.stringify(v)) : v;
        nhfp.buffer.push({ t, n: myname, v: copy });
    };
}

function _readFn(t) {
    return (nhfp, dst, myname, cnt) => {
        if (!nhfp || !nhfp.buffer) {
            if (nhfp) nhfp.eof = 1;
            return;
        }
        const e = nhfp.buffer.shift();
        if (e === undefined) {
            nhfp.eof = 1;
            return;
        }
        if (cnt !== undefined && cnt > 0 && e.b) {
            for (let i = 0; i < cnt; i++) {
                if (dst && typeof dst === 'object') dst[i] = e.b[i] | 0;
            }
            return;
        }
        if (dst && typeof dst === 'object' && 'value' in dst) {
            dst.value = e.v;
            return;
        }
        if (dst && typeof dst === 'object' && e.v && typeof e.v === 'object') {
            Object.assign(dst, e.v);
        }
    };
}

const _TYPES = [
    // primitives
    'int', 'int16', 'int32', 'int64',
    'uint16', 'uint32', 'uint64',
    'short', 'ushort', 'long', 'ulong', 'unsigned',
    'char', 'schar', 'uchar',
    'xint8', 'xint16',
    'boolean', 'coordxy', 'aligntyp',
    'bitfield', 'genericptr', 'size_t', 'time_t', 'fe',
    // structs / aggregates
    'monst', 'obj', 'arti_info', 'nhrect', 'branch', 'bubble',
    'cemetery', 'context_info', 'damage', 'dest_area',
    'dgn_topology', 'dungeon', 'd_level', 's_level',
    'ebones', 'edog', 'egd', 'emin', 'engr', 'epri', 'eshk',
    'flag', 'fruit', 'gamelog_line', 'kinfo',
    'levelflags', 'linfo', 'ls_t',
    'mapseen_feat', 'mapseen_flags', 'mapseen_rooms',
    'mkroom', 'mvitals', 'objclass', 'nhcoord',
    'q_score', 'rm', 'spell', 'stairway',
    'trap', 'version_info', 'you', 'any',
];

function _install() {
    if (_installed) return;
    _installed = true;
    if (!Array.isArray(game.sfoprocs)) game.sfoprocs = [];
    if (!Array.isArray(game.sfiprocs)) game.sfiprocs = [];
    const writeFns = {};
    const readFns = {};
    for (const t of _TYPES) {
        writeFns['sf_' + t] = _writeFn(t);
        readFns['sf_' + t] = _readFn(t);
    }
    game.sfoprocs[_FNIDX] = { ext: 'levelfile', fn: writeFns };
    game.sfiprocs[_FNIDX] = { ext: 'levelfile', fn: readFns };
}

function _makeNhfp(ledger_no, buffer, modeBits) {
    return {
        ledger_no,
        buffer,
        mode: modeBits,
        structlevel: 1,
        fnidx: _FNIDX,
        eof: 0,
        ftype: 1,
        fplog: 0,
        nhfpconvert: null,
        fd: -1,
    };
}

// C ref: files.c create_levelfile(int lev, char *errbuf).  Returns
// NHFILE* (writable) or NULL on failure.  Memory-backed: always
// succeeds, allocates a new empty buffer keyed by ledger_no.
export function create_levelfile(ledger_no, errbuf) {
    _install();
    const buffer = [];
    _store.set(ledger_no, buffer);
    // C ref files.c:658 — creating the level file marks
    // level_info[lev].flags |= LFILE_EXISTS (0x04); goto_level's
    // revisit-vs-mklev decision reads exactly this bit.  Guard on
    // concrete shape (gstate Proxy ghost).
    const li = game.level_info;
    if (li && li[ledger_no] && typeof li[ledger_no].flags === 'number') {
        li[ledger_no].flags |= 4;
    }
    return _makeNhfp(ledger_no, buffer, 2 /* FWRITING */);
}

// C ref: files.c open_levelfile(int lev, char *errbuf).  Returns
// NHFILE* (readable) or NULL if the level file doesn't exist.
// Memory-backed: returns nhfp pointing at a clone of the stored
// buffer so reads don't drain the canonical version (re-reads
// possible).
export function open_levelfile(ledger_no, errbuf) {
    _install();
    const buffer = _store.get(ledger_no);
    if (!buffer) return null;
    // savelev() stores a JS-native stash OBJECT ({ __levstash: 1,
    // ... }) under the same key -- not a byte array.  getlev() reads
    // the stash by ledger key, so the nhfp just needs to exist as
    // the "file is present" handle; .slice() on the stash threw
    // ("buffer.slice is not a function") and the silently-absorbed
    // failure made goto_level REGENERATE every revisited level
    // (Q9 iter 54, seed0373 judged 15524).
    if (!Array.isArray(buffer)) {
        return _makeNhfp(ledger_no, buffer, 4 /* FREADING */);
    }
    return _makeNhfp(ledger_no, buffer.slice(), 4 /* FREADING */);
}

// C ref: files.c close_nhfile(NHFILE *nhfp).  Cleanup; for
// memory-backed nhfps this is a no-op (the buffer stays in
// _store).  Generic enough to accept non-levelfile nhfps
// (returns without action if nhfp.ftype isn't level-file-shaped).
export function close_nhfile(nhfp) {
    /* no-op for memory-backed */
}

// C ref: files.c delete_levelfile(int lev).  Removes the level
// from storage so a subsequent open_levelfile returns NULL and
// the engine re-generates via mklev.
export function delete_levelfile(ledger_no) {
    _store.delete(ledger_no);
    // C ref files.c:728 — clears LFILE_EXISTS.
    const li = game.level_info;
    if (li && li[ledger_no] && typeof li[ledger_no].flags === 'number') {
        li[ledger_no].flags &= ~4;
    }
}

// ── savelev / getlev — JS-native level stash (Q9 iter 45) ──────
//
// C's savelev/getlev serialize the per-level state to the level
// file and free the in-memory chains; goto_level re-loads on
// revisit.  Neither fires PRNG, so a JS-native stash/restore of
// the per-level slice of `game` gives identical parity semantics
// without the C byte format.  clear_level_structures() MUTATES the
// location cells and rooms array in place, so grids/structs are
// COPIED at save; the chains (monlist/objlist/ftrap/stairs/...)
// are merely re-pointed by the next level's init, so they stash by
// REFERENCE (exactly C's "the file holds the only copy" model).
//
// v1 LIMITATIONS (documented, loud): level-range timers, light
// sources, worm segments, regions, bubbles (Plane of Water/Air),
// exclusions and track are NOT stashed — corpse-rot timers and
// lamp light on a stashed level are lost on revisit.  Add as
// sessions demonstrate the need.

function _cloneRoomsPair(rooms, subrooms) {
    // rooms[i].sbrooms holds REFERENCES into subrooms[] — clone the
    // two arrays together through one memo so the links stay
    // internally consistent.
    const memo = new Map();
    const cloneRoom = (r) => {
        if (r === null || typeof r !== 'object') return r;
        if (memo.has(r)) return memo.get(r);
        const out = {};
        memo.set(r, out);
        for (const k of Object.keys(r)) {
            const v = r[k];
            if (k === 'sbrooms' && Array.isArray(v)) {
                out[k] = v.map((sr) => cloneRoom(sr));
            } else if (Array.isArray(v)) {
                out[k] = v.slice();
            } else if (v && typeof v === 'object') {
                out[k] = { ...v };
            } else {
                out[k] = v;
            }
        }
        return out;
    };
    return {
        rooms: Array.isArray(rooms) ? rooms.map(cloneRoom) : rooms,
        subrooms: Array.isArray(subrooms) ? subrooms.map(cloneRoom) : subrooms,
    };
}

export function savelev(nhfp, ledger_no) {
    _install();
    const g = game;
    if (!g.level || !Array.isArray(g.level.locations)) return;
    const pair = _cloneRoomsPair(g.rooms, g.subrooms);
    const stash = {
        __levstash: 1,
        locations: g.level.locations.map((col) => col.map((c) => ({ ...c }))),
        objectsGrid: g.level.objects.map((col) => col.slice()),
        monstersGrid: g.level.monsters.map((col) => col.slice()),
        objlist: g.level.objlist,
        buriedobjlist: g.level.buriedobjlist,
        monlist: g.level.monlist,
        damagelist: g.level.damagelist,
        bonesinfo: g.level.bonesinfo,
        levelFlags: { ...g.level.flags },
        stairs: g.stairs,
        ftrap: g.ftrap,
        head_engr: g.head_engr,
        billobjs: g.billobjs,
        nroom: g.nroom,
        nsubroom: g.nsubroom,
        doorindex: g.doorindex,
        rooms: pair.rooms,
        subrooms: pair.subrooms,
        doors: Array.isArray(g.doors) ? g.doors.map((d) => (d && typeof d === 'object' ? { ...d } : d)) : g.doors,
        doors_alloc: g.doors_alloc,
        smeq: Array.isArray(g.smeq) ? g.smeq.slice() : g.smeq,
        updest: g.updest && typeof g.updest === 'object' ? JSON.parse(JSON.stringify(g.updest)) : g.updest,
        dndest: g.dndest && typeof g.dndest === 'object' ? JSON.parse(JSON.stringify(g.dndest)) : g.dndest,
    };
    const key = (nhfp && typeof nhfp.ledger_no === 'number') ? nhfp.ledger_no : ledger_no;
    _store.set(key, stash);
    // C ref save.c:560-565 (release_data tail): after the level is
    // written, the live chains are FREED -- gf.ftrap = 0,
    // gb.billobjs = 0 -- and the engravings/stairs chains are freed
    // by their save_* FREEING passes.  Without this, the old level's
    // chains leak into the next mklev: a previous level's squeaky
    // board made choose_trapnote see 11 free notes where C sees 12
    // (Q9 iter 55, seed0373 judged 15749).
    //
    // BUT the freeing is GATED on FREEING mode in C: release_data and
    // the save_* free passes only run when nhfp->mode & FREEING (a
    // level-SWITCH save — goto_level sets mode 2|4).  A CHECKPOINT
    // write (save_currentstate, mode 2 = WRITING only) must NOT free
    // the live chains, because the hero is still standing on that
    // level.  Nulling unconditionally destroyed the live level on a
    // checkpoint: seed0015's save_currentstate (ins_chkpt) ran right
    // after arriving on dlvl 2 and nulled g.stairs, so On_stairs()
    // returned false for the hero on the upstair, forking the pet's
    // dog_goal appr (the dominant "distfleeck/dog" cluster).  FREEING
    // is bit 4 (C nhfile.h: COUNTING=1, WRITING=2, FREEING=4); do.js
    // uses the same literal (`nhfp.mode = ... (2 | 4)`).
    if (nhfp && (nhfp.mode & 4) /* FREEING */) {
        g.ftrap = null;
        g.billobjs = null;
        g.stairs = null;
        g.head_engr = null;
    }
}

export function getlev(nhfp, _pid, ledger_no) {
    _install();
    const key = (nhfp && typeof nhfp.ledger_no === 'number') ? nhfp.ledger_no : ledger_no;
    const stash = _store.get(key);
    if (!stash || !stash.__levstash) return;
    const g = game;
    // Hand ownership of the stashed copies back to the live game;
    // the NEXT savelev re-snapshots, so the later in-place clears by
    // clear_level_structures can't corrupt the stash.
    g.level.locations = stash.locations;
    g.level.objects = stash.objectsGrid;
    g.level.monsters = stash.monstersGrid;
    g.level.objlist = stash.objlist;
    g.level.buriedobjlist = stash.buriedobjlist;
    g.level.monlist = stash.monlist;
    g.level.damagelist = stash.damagelist;
    g.level.bonesinfo = stash.bonesinfo;
    Object.assign(g.level.flags, stash.levelFlags);
    g.stairs = stash.stairs;
    g.ftrap = stash.ftrap;
    g.head_engr = stash.head_engr;
    g.billobjs = stash.billobjs;
    g.nroom = stash.nroom;
    g.nsubroom = stash.nsubroom;
    g.doorindex = stash.doorindex;
    g.rooms = stash.rooms;
    g.subrooms = stash.subrooms;
    g.doors = stash.doors;
    g.doors_alloc = stash.doors_alloc;
    if (Array.isArray(stash.smeq)) g.smeq = stash.smeq;
    if (stash.updest) Object.assign(g.updest, stash.updest);
    if (stash.dndest) Object.assign(g.dndest, stash.dndest);
    // The stash is now live; replace it with a marker so a re-open
    // before the next savelev doesn't alias the live containers.
    _store.set(key, { __levstash: 0 });
}

// Test helper — not exported via EXTERNAL_SYMBOLS.  Lets tests
// verify the memory-backed round-trip without invoking
// savelev/getlev.
export function _peek(ledger_no) {
    const b = _store.get(ledger_no);
    return b ? b.slice() : null;
}

// Test helper — reset the store.  Useful for repeated session
// runs.
export function _reset() {
    _store.clear();
    _installed = false;
}
