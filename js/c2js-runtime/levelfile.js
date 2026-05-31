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
