// game.js — Core game data structures.
// C ref: rm.h struct rm, dungeon.h, you.h

import { COLNO, ROWNO, STONE } from './const.js';
import { NO_COLOR } from './terminal.js';

// A single map cell. Mirrors C's struct rm.
//
// C ref include/rm.h:213-220 — `doormask`, `altarmask`, `wall_info`,
// `ladder`, `drawbridgemask`, `looted`, `icedpool`, `emptygrave` are
// all `#define`d as macro aliases for the SAME `flags` bit-field
// (5 bits, overloaded by terrain type).  The translator expands the
// macros to `flags` in `js/translated/*.js` output (e.g.
// translated/zap.js:4227 writes `lev.flags = new_doormask`).
// Hand-rolled readers (display.js, cmd.js, vision.js) historically
// referenced the macro names directly (`loc.doormask`), treating
// them as separate fields.  Without the aliasing below, hand-rolled
// reads return undefined and hand-rolled writes to `loc.flags`
// (mklev.js dosdoor) silently don't appear under `loc.doormask`.
//
// Define each macro alias as a getter/setter that proxies to
// `_flags` — matching C's macro semantics so hand-rolled and
// translated code agree on a single physical field.
export function makeLocation() {
    const loc = {
        typ: STONE,      // terrain type (STONE, ROOM, CORR, DOOR, etc.)
        roomno: 0,        // room number (0 = not in a room)
        lit: false,        // is this cell lit?
        waslit: false,     // was this cell lit last time we checked?
        _flags: 0,         // physical field; access via flags / doormask / altarmask / etc.
        seenv: 0,          // which angles the hero has seen this wall from
        horizontal: false, // is this a horizontal wall?
        edge: false,       // is this at the edge of the map?
        disp_ch: ' ',      // current display character
        disp_color: NO_COLOR,
        disp_decgfx: false,
        disp_attr: 0,
        gnew: 0,           // dirty flag for flush_glyph_buf
        glyph_symidx: -1,  // S_* symbol index
        remembered_glyph: undefined,  // { ch, color, decgfx, symidx }
    };
    // C ref include/rm.h:213-220 — all of these are `#define X flags`.
    const aliasNames = ['flags', 'doormask', 'altarmask', 'wall_info',
                        'ladder', 'drawbridgemask', 'looted',
                        'icedpool', 'emptygrave'];
    for (const name of aliasNames) {
        Object.defineProperty(loc, name, {
            get() { return this._flags; },
            set(v) { this._flags = v; },
            enumerable: true,
            configurable: true,
        });
    }
    return loc;
}

// The dungeon level map. C ref: struct level.
export class GameMap {
    constructor() {
        this.locations = [];
        for (let x = 0; x < COLNO; x++) {
            this.locations[x] = [];
            for (let y = 0; y < ROWNO; y++) {
                this.locations[x][y] = makeLocation();
            }
        }
        this.rooms = [];
        this.nroom = 0;
        this.doors = [];
        this.doorindex = 0;
        // C ref: gl.level.objects[COLNO][ROWNO], gl.level.monsters[COLNO][ROWNO],
        // gl.level.traps (linked list).  Translated clear_level_structures
        // (and other functions) does `game.level.objects[x][y] = null` in
        // 2D loops; initialize matching 2D shape so those calls don't
        // crash with "Cannot set properties of undefined".
        this.objects = [];
        this.monsters = [];
        for (let x = 0; x < COLNO; x++) {
            this.objects[x] = new Array(ROWNO).fill(null);
            this.monsters[x] = new Array(ROWNO).fill(null);
        }
        this.traps = null;  // linked list (head pointer); not 2D
        this.flags = {
            nfountains: 0,
            nsinks: 0,
            hero_memory: true,
            is_maze_lev: false,
        };
    }

    at(x, y) {
        if (x < 0 || x >= COLNO || y < 0 || y >= ROWNO) return null;
        return this.locations[x]?.[y] || null;
    }
}
