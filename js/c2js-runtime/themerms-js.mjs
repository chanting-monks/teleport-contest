// themerms-js.mjs — JS hand-port of dat/themerms.lua's top-level
// orchestration.
//
// This is the FOURTH and largest of the "complex" Lua files
// blocking fengari removal (per project_nh_emit_async.md).  The
// upstream file is 1097 lines; ~870 of those are the
// `themeroom_fills` array (~25 fill closures) and `themerooms`
// array (~30 room closures).  The remaining ~230 lines are the
// orchestration: is_eligible, lookup_by_name, themerooms_generate,
// pre/post_themerooms_generate, themeroom_fill, post-process
// callbacks, etc.
//
// This commit ports the ORCHESTRATION SCAFFOLD.  The
// `themerooms` and `themeroom_fills` arrays start EMPTY and must
// be populated by follow-up commits before this module replaces
// the fengari load of themerms.lua — wiring is gated until then,
// because empty arrays would fire NO PRNG inside themerooms_generate
// where fengari currently fires the rn2(N) reservoir-sample picks.
//
// What's mirrored from the orchestration:
// - is_eligible(room, mkrm)
// - lookup_by_name(name, checkfills)
// - themerooms_generate()  — reservoir-sample picks one eligible
//   themed room and calls its contents() closure.  Fires rn2(N)
//   per eligible room.  Currently a no-op (empty array).
// - themeroom_fill(rm)     — same pattern for themeroom_fills.
// - pre/post_themerooms_generate
// - post_level_generate    — runs queued postprocess handlers
// - make_dig_engraving / make_garden_walls / make_a_trap (postprocess)
// - filler_region
//
// Hand-port strategy: each room closure in themeroom_fills /
// themerooms is intentionally NOT copy-pasted here yet.  Adding
// them mechanically without a `selection.match()` impl and without
// the PRNG-faithful `randline` would silently diverge.  Each room
// is added in a follow-up commit (or a batch commit) with its own
// PRNG-equivalence verification.

import { shuffle, d, percent, mathRandom } from './nhlib-js.mjs';
import { Selection, selection } from './selection-js.mjs';

// Test/debug overrides.  pre_themerooms_generate reads
// nh.debug_themerm(false) / (true) for a forced room/fill index;
// they're nil in normal play.
let debug_rm_idx = null;
let debug_fill_idx = null;

// Postprocess queue: handlers to run after the whole level
// generates.  C ref themerms.lua:42 `local postprocess = {}`.
let postprocess = [];

// Room arrays — populated by follow-up commits one room/fill
// closure at a time.  Each entry is:
//   { name, frequency?, contents, mindiff?, maxdiff?, eligible? }
export const themeroom_fills = [];
export const themerooms = [];

// C ref themerms.lua:890-903.
export function is_eligible(room, mkrm) {
    if (!room || typeof room !== 'object') return false;
    const diff = (typeof globalThis.level_difficulty === 'function')
        ? globalThis.level_difficulty() : 1;
    if (room.mindiff != null && diff < room.mindiff) return false;
    if (room.maxdiff != null && diff > room.maxdiff) return false;
    if (mkrm != null && room.eligible != null) {
        return !!room.eligible(mkrm);
    }
    return true;
}

// C ref themerms.lua:905-924.  Linear scan; arrays are small.
export function lookup_by_name(name, checkfills) {
    if (name == null) return null;
    const arr = checkfills ? themeroom_fills : themerooms;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] && arr[i].name === name) return i + 1;  // 1-indexed (Lua)
    }
    return null;
}

// C ref themerms.lua:926-980.  Reservoir sampling — for each
// eligible room, add its frequency to total_frequency and pick it
// iff `rn2(total_frequency) < this_frequency`.  Result is a
// frequency-weighted random selection where the order of iteration
// determines the PRNG call order (load-bearing for parity).
export function themerooms_generate() {
    if (debug_rm_idx != null) {
        let actualrm = lookup_by_name('default', false);
        if (percent(50)) {
            if (is_eligible(themerooms[debug_rm_idx - 1])) {
                actualrm = debug_rm_idx;
            } else if (typeof globalThis.pline === 'function') {
                globalThis.pline(`Warning: themeroom '${themerooms[debug_rm_idx - 1]?.name}' is ineligible`);
            }
        }
        if (actualrm != null) themerooms[actualrm - 1]?.contents?.();
        return;
    }
    if (debug_fill_idx != null) {
        const pickName = percent(50) ? 'Default room with themed fill' : 'default';
        const actualrm = lookup_by_name(pickName, false);
        if (actualrm != null) themerooms[actualrm - 1]?.contents?.();
        return;
    }
    let pick = null;
    let total_frequency = 0;
    const rn2 = globalThis.__nh_lua_bindings?.rn2 || globalThis.rn2;
    for (let i = 0; i < themerooms.length; i++) {
        const room = themerooms[i];
        if (!room || typeof room !== 'object') {
            if (typeof globalThis.impossible === 'function') {
                globalThis.impossible(`themed room ${i + 1} is not a table`);
            }
        } else if (is_eligible(room, null)) {
            const this_frequency = (room.frequency != null) ? room.frequency : 1;
            total_frequency += this_frequency;
            if (this_frequency > 0 && rn2(total_frequency) < this_frequency) {
                pick = i;
            }
        }
    }
    if (pick == null) {
        if (typeof globalThis.impossible === 'function') {
            globalThis.impossible('no eligible themed rooms?');
        }
        return;
    }
    themerooms[pick].contents();
}

// C ref themerms.lua:982-1004.
export function pre_themerooms_generate() {
    const debug_themerm = (typeof globalThis.nh_debug_themerm === 'function')
        ? globalThis.nh_debug_themerm(false) : null;
    const debug_fill = (typeof globalThis.nh_debug_themerm === 'function')
        ? globalThis.nh_debug_themerm(true) : null;
    debug_rm_idx = lookup_by_name(debug_themerm, false);
    debug_fill_idx = lookup_by_name(debug_fill, true);
    // C-side warnings are pline calls; cold path here.
}

// C ref themerms.lua:1006-1008.  Currently a no-op upstream.
export function post_themerooms_generate() {
    // upstream is empty
}

// C ref themerms.lua:1009-1050.  Same reservoir sampling as
// themerooms_generate, but for fills (passes `rm` to closures).
export function themeroom_fill(rm) {
    if (debug_fill_idx != null) {
        const fill = themeroom_fills[debug_fill_idx - 1];
        if (is_eligible(fill, rm)) {
            fill.contents(rm);
        }
        return;
    }
    let pick = null;
    let total_frequency = 0;
    const rn2 = globalThis.__nh_lua_bindings?.rn2 || globalThis.rn2;
    for (let i = 0; i < themeroom_fills.length; i++) {
        const fill = themeroom_fills[i];
        if (!fill || typeof fill !== 'object') {
            if (typeof globalThis.impossible === 'function') {
                globalThis.impossible(`themeroom fill ${i + 1} must be a table`);
            }
        } else if (is_eligible(fill, rm)) {
            const this_frequency = (fill.frequency != null) ? fill.frequency : 1;
            total_frequency += this_frequency;
            if (this_frequency > 0 && rn2(total_frequency) < this_frequency) {
                pick = i;
            }
        }
    }
    if (pick == null) {
        if (typeof globalThis.impossible === 'function') {
            globalThis.impossible('no eligible themed room fills?');
        }
        return;
    }
    themeroom_fills[pick].contents(rm);
}

// C ref themerms.lua:880-888.  Wrapper around des.region used by
// some fills.  Calls into the engine's `des` table.
export function filler_region(x, y) {
    let rmtyp = 'ordinary';
    let func = null;
    if (percent(30)) {
        rmtyp = 'themed';
        func = themeroom_fill;
    }
    const des = globalThis.__nh_des;
    if (des && typeof des.region === 'function') {
        des.region({ region: [x, y, x, y], type: rmtyp, irregular: true, filled: 1, contents: func });
    }
}

// Postprocess handlers (C ref themerms.lua:1052-1090).

export function make_dig_engraving(data) {
    const floors = Selection.negate(Selection.new()).filter_mapchar('.');
    const pos = floors.rndcoord();
    if (!pos) return;
    const tx = data.x - pos.x - 1;
    const ty = data.y - pos.y;
    let dig = '';
    if (tx === 0 && ty === 0) {
        dig = ' here';
    } else {
        if (tx !== 0) dig = ` ${Math.abs(tx)} ${tx > 0 ? 'east' : 'west'}`;
        if (ty !== 0) dig = dig + ` ${Math.abs(ty)} ${ty > 0 ? 'south' : 'north'}`;
    }
    const des = globalThis.__nh_des;
    if (des && typeof des.engraving === 'function') {
        des.engraving({ coord: pos, type: 'burn', text: 'Dig' + dig });
    }
}

export function make_garden_walls(data) {
    const sel = (data.sel?.grow ? data.sel.grow() : new Selection(data.sel).grow());
    const des = globalThis.__nh_des;
    if (des && typeof des.replace_terrain === 'function') {
        des.replace_terrain({ selection: sel, fromterrain: 'w', toterrain: 'T' });
        des.replace_terrain({ selection: sel, fromterrain: 'S', toterrain: 'A' });
    }
}

export function make_a_trap(data) {
    if (data.teledest === 1 && data.type === 'teleport') {
        const locs = Selection.negate(Selection.new()).filter_mapchar('.');
        let p;
        do {
            p = locs.rndcoord();
            if (!p) break;
        } while (p.x === data.coord.x && p.y === data.coord.y);
        data.teledest = p;
    }
    const des = globalThis.__nh_des;
    if (des && typeof des.trap === 'function') des.trap(data);
}

// C ref themerms.lua:1092-1097.  Drains the postprocess queue.
export function post_level_generate() {
    const queue = postprocess;
    postprocess = [];
    for (const item of queue) {
        if (typeof item.handler === 'function') item.handler(item.data);
    }
}

// Helper for follow-up room definitions: push a postprocess
// handler to be run by post_level_generate.
export function pushPostprocess(handler, data) {
    postprocess.push({ handler, data });
}

// Test hook for verification: reset module state between tests.
export function _resetForTest() {
    themeroom_fills.length = 0;
    themerooms.length = 0;
    postprocess = [];
    debug_rm_idx = null;
    debug_fill_idx = null;
}
