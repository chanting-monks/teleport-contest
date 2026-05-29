// game.js — Core game data structures.
// C ref: rm.h struct rm, dungeon.h, you.h

import { COLNO, ROWNO, STONE } from './const.js';
import { NO_COLOR } from './terminal.js';

// A single map cell. Mirrors C's struct rm.
export function makeLocation() {
    return {
        typ: STONE,      // terrain type (STONE, ROOM, CORR, DOOR, etc.)
        roomno: 0,        // room number (0 = not in a room)
        lit: false,        // is this cell lit?
        waslit: false,     // was this cell lit last time we checked?
        flags: 0,          // door flags, wall flags, etc.
        doormask: 0,       // door state (D_NODOOR, D_CLOSED, etc.)
        seenv: 0,          // which angles the hero has seen this wall from
        horizontal: false, // is this a horizontal wall?
        edge: false,       // is this at the edge of the map?
        wall_info: 0,      // wall flags (W_NONDIGGABLE, etc.)
        disp_ch: ' ',      // current display character
        disp_color: NO_COLOR,
        disp_decgfx: false,
        disp_attr: 0,
        gnew: 0,           // dirty flag for flush_glyph_buf
        glyph_symidx: -1,  // S_* symbol index
        remembered_glyph: undefined,  // { ch, color, decgfx, symidx }
    };
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
        this.objects = [];
        this.monsters = [];
        this.traps = [];
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
