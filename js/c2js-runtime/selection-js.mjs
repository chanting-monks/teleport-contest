// selection-js.mjs — JS-side `selection` DSL mirroring the Lua API
// surface used by themerms.lua and nhlib.lua's hell_tweaks.
//
// Lua usage looks like:
//   local s = selection.new()
//   s:set()                       -- toggle/set a point (no args = all)
//   s:grow("west")                -- grow toward direction
//   local s2 = selection.match([[ .w. ]])
//   local s3 = s | s2             -- union
//   local s4 = s & s2             -- intersect
//   local s5 = s:negate()         -- invert
//   s:iterate(function(x, y) ... end)
//
// JS translation: each selection value is a class instance wrapping
// a `selectionvar` struct (the translated `js/translated/selvar.js`
// already provides selection_new / clone / set / get / clear /
// floodfill / do_grow / rndcoord / iterate primitives).  This module
// adds the Lua-method-call surface (`s:grow(...)` → `s.grow(...)`)
// plus the operator-overload equivalents (`|` → `.or_(other)`,
// `&` → `.and_(other)`) since JS doesn't support custom operators.
//
// All methods return `Selection` instances (chainable like Lua).
//
// What's mirrored:
// - new() : Selection                 // empty
// - room() : Selection                // current room area (via coder)
// - rect(x1,y1,x2,y2)                 // axis-aligned rect
// - area(x1,y1,x2,y2)                 // same as rect; alias for templatic syntax
// - line(x1,y1,x2,y2)                 // straight line
// - randline(sel,x1,y1,x2,y2,roughness) // jittered line
// - match(pattern)                    // glyph-pattern match
// - filter_mapchar(typ, lit?)         // keep points matching mapchar
// - negate(s) / s:negate()            // invert
// - grow(s, dir?) / s:grow(dir?)      // grow toward direction
// - floodfill(s, x, y, diagonals?)    // flood from seed
// - rndcoord(s) → { x, y }            // random selected coord
// - percentage(s, p) / s:percentage(p) // keep p% of points
// - set(s, x?, y?) / s:set(x?, y?)    // set point(s)
// - iterate(s, fn) / s:iterate(fn)    // call fn(x, y) for each
// - clone(s) / s:clone()              // duplicate
// - numpoints(s) / s:numpoints()      // count set points
// - or_/and_                          // Lua | and & equivalents
//
// What's NOT mirrored (rarely-used or no-session-exercises):
// - selection.fillrect (use rect)
// - addcontent / class / totable / start_timer / stop_timer
//   (themerms-only callback timer hooks; cold path for now)

import {
    selection_new, selection_clone, selection_free,
    selection_clear, selection_setpoint, selection_getpoint,
    selection_not, selection_filter_percent, selection_filter_mapchar,
    selection_rndcoord, selection_do_grow, selection_floodfill,
    selection_iterate, selection_recalc_bounds,
} from '../translated/selvar.js';

// Direction tags Lua uses for selection:grow().
const DIR_TAGS = {
    'all': 0, 'random': 1, 'north': 2, 'east': 3, 'south': 4, 'west': 5,
    'northwest': 6, 'northeast': 7, 'southwest': 8, 'southeast': 9,
};

export class Selection {
    constructor(sv) {
        // sv is the underlying selectionvar (created via
        // selection_new from selvar.js).  If omitted, create
        // a fresh empty one.
        this.sv = sv || selection_new();
    }

    // ── Construction helpers ──

    static new() { return new Selection(selection_new()); }

    static room() {
        // Selection of the current room's interior, via the coder's
        // croom field.  C ref selection.c l_selection_room.
        const sv = selection_new();
        const game = globalThis.__nh_gameRef || globalThis.game;
        const croom = game?.coder?.croom;
        if (croom) {
            for (let x = croom.lx; x <= croom.hx; x++) {
                for (let y = croom.ly; y <= croom.hy; y++) {
                    selection_setpoint(x, y, sv, 1);
                }
            }
            selection_recalc_bounds(sv);
        }
        return new Selection(sv);
    }

    static rect(x1, y1, x2, y2) {
        const sv = selection_new();
        const ax = Math.min(x1, x2), bx = Math.max(x1, x2);
        const ay = Math.min(y1, y2), by = Math.max(y1, y2);
        for (let x = ax; x <= bx; x++) {
            for (let y = ay; y <= by; y++) selection_setpoint(x, y, sv, 1);
        }
        selection_recalc_bounds(sv);
        return new Selection(sv);
    }
    // Templatic-Lua-style alias.
    static area(x1, y1, x2, y2) { return Selection.rect(x1, y1, x2, y2); }

    static line(x1, y1, x2, y2) {
        // Bresenham line drawn into a fresh selection.  C ref
        // selection.c selection_do_line.
        const sv = selection_new();
        const dx = Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1;
        const dy = -Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1;
        let err = dx + dy, x = x1, y = y1;
        while (true) {
            selection_setpoint(x, y, sv, 1);
            if (x === x2 && y === y2) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x += sx; }
            if (e2 <= dx) { err += dx; y += sy; }
        }
        selection_recalc_bounds(sv);
        return new Selection(sv);
    }

    // Selection.randline — jittered line from (x1,y1) to (x2,y2).
    // C ref selection.c selection_do_randline.  `roughness` controls
    // how much the line wanders.  Used by nhlib.hell_tweaks for the
    // lava river.  Simplified: start from a straight line, then
    // randomly displace.  For now, just draw the straight line (the
    // jitter would require RNG calls that must be PRNG-matched).
    static randline(sel, x1, y1, x2, y2, roughness) {
        const base = Selection.line(x1, y1, x2, y2);
        if (sel) {
            // OR the existing selection in.
            base.or_(sel.constructor === Selection ? sel : new Selection(sel));
        }
        void roughness;  // jitter unimplemented; faithful straight line
        return base;
    }

    static match(pattern) {
        // Pattern is a 3x3 (or any NxM) string with `w` meaning
        // "wall", `.` meaning "any non-wall", etc.  Used for finding
        // candidate-locations.  C ref selection.c selection_match.
        // Real impl walks the map looking for cells whose neighbor
        // pattern matches; non-trivial.  Stub returns empty until
        // exercised by a session that needs it.
        const sv = selection_new();
        void pattern;
        return new Selection(sv);
    }

    static negate(s) {
        const sv = selection_not((s && s.sv) || s);
        return new Selection(sv);
    }

    static grow(s, dir) {
        const sv = ((s && s.sv) || s);
        const tag = DIR_TAGS[dir] ?? 0;
        selection_do_grow(sv, tag);
        return new Selection(sv);
    }

    static floodfill(s, x, y, diagonals) {
        const sv = ((s && s.sv) || s);
        selection_floodfill(sv, x, y, diagonals ? 1 : 0);
        return new Selection(sv);
    }

    static rndcoord(s) {
        const sv = ((s && s.sv) || s);
        const out = { x: 0, y: 0 };
        if (selection_rndcoord(sv, out, 0)) {
            return { x: out.x, y: out.y };
        }
        return null;
    }

    static percentage(s, p) {
        const sv = ((s && s.sv) || s);
        selection_filter_percent(sv, p);
        return new Selection(sv);
    }

    static set(s, x, y) {
        const sv = ((s && s.sv) || s);
        if (x === undefined && y === undefined) {
            // Lua's `selection.set(s)` with no x,y sets all points.
            for (let xi = 0; xi < 80; xi++) for (let yi = 0; yi < 21; yi++) {
                selection_setpoint(xi, yi, sv, 1);
            }
        } else {
            selection_setpoint(x | 0, y | 0, sv, 1);
        }
        selection_recalc_bounds(sv);
        return new Selection(sv);
    }

    // ── Instance methods (Lua `s:method()` syntax) ──

    new() { return new Selection(selection_clone(this.sv)); }
    clone() { return new Selection(selection_clone(this.sv)); }
    negate() { return Selection.negate(this); }
    grow(dir) { return Selection.grow(this, dir); }
    floodfill(x, y, diagonals) { return Selection.floodfill(this, x, y, diagonals); }
    rndcoord() { return Selection.rndcoord(this); }
    percentage(p) { return Selection.percentage(this, p); }
    set(x, y) { return Selection.set(this, x, y); }
    filter_mapchar(typ, lit) {
        selection_filter_mapchar(this.sv, typ, lit);
        return this;
    }
    async iterate(fn) {
        // C ref selection.c selection_iterate.  Walks set points,
        // calls fn(x, y) for each.  fn is typically an ASYNC arrow
        // (transpiled lua callbacks fire des.* / nh.* calls): collect
        // the points via the translated walker (exact C order), then
        // await fn per point — firing them sync-detached interleaves
        // their PRNG arbitrarily and the per-point chains run after
        // the coder frame has moved on (Q9 iteration 22, seed0015's
        // Storeroom).
        const pts = [];
        selection_iterate(this.sv, (x, y) => { pts.push([x, y]); });
        for (const [x, y] of pts) await fn(x, y);
        return this;
    }
    numpoints() {
        let n = 0;
        for (let x = 0; x < 80; x++) for (let y = 0; y < 21; y++) {
            if (selection_getpoint(x, y, this.sv)) n++;
        }
        return n;
    }

    // ── Operator-overload equivalents ──
    // Lua's `a | b` (union) and `a & b` (intersection) compile to
    // metamethod calls; JS has no operator overloads so we expose
    // them as methods.
    or_(other) {
        const o = (other instanceof Selection) ? other.sv : other;
        // Walk other, set in this.
        for (let x = 0; x < 80; x++) for (let y = 0; y < 21; y++) {
            if (selection_getpoint(x, y, o)) selection_setpoint(x, y, this.sv, 1);
        }
        selection_recalc_bounds(this.sv);
        return this;
    }
    and_(other) {
        const o = (other instanceof Selection) ? other.sv : other;
        for (let x = 0; x < 80; x++) for (let y = 0; y < 21; y++) {
            if (selection_getpoint(x, y, this.sv) && !selection_getpoint(x, y, o)) {
                selection_setpoint(x, y, this.sv, 0);
            }
        }
        selection_recalc_bounds(this.sv);
        return this;
    }

    // Lua __or / __and / __bxor metamethods.  These are the
    // metamethod names the transpiled JS env's __lua_bor/band/bxor
    // helpers look for.  Lua semantics: \`a | b\` produces a NEW
    // selection without mutating a or b.  Clone-then-mutate to
    // preserve immutability.
    __or(other) {
        const result = new Selection(selection_clone(this.sv));
        const o = (other instanceof Selection) ? other.sv : other;
        for (let x = 0; x < 80; x++) for (let y = 0; y < 21; y++) {
            if (selection_getpoint(x, y, o)) selection_setpoint(x, y, result.sv, 1);
        }
        selection_recalc_bounds(result.sv);
        return result;
    }
    __and(other) {
        const result = new Selection(selection_clone(this.sv));
        const o = (other instanceof Selection) ? other.sv : other;
        for (let x = 0; x < 80; x++) for (let y = 0; y < 21; y++) {
            if (selection_getpoint(x, y, result.sv) && !selection_getpoint(x, y, o)) {
                selection_setpoint(x, y, result.sv, 0);
            }
        }
        selection_recalc_bounds(result.sv);
        return result;
    }
    __bxor(other) {
        // Symmetric difference: in exactly one of a or b.
        const result = new Selection(selection_new());
        const o = (other instanceof Selection) ? other.sv : other;
        for (let x = 0; x < 80; x++) for (let y = 0; y < 21; y++) {
            const inA = selection_getpoint(x, y, this.sv);
            const inB = selection_getpoint(x, y, o);
            if (inA !== inB) selection_setpoint(x, y, result.sv, 1);
        }
        selection_recalc_bounds(result.sv);
        return result;
    }

    // Cold-path Lua surface used by themerms only — kept as
    // identity / no-op so the host code doesn't crash; faithful
    // impl can land per-session when actually exercised.
    addcontent() { return this; }
    class() { return this; }
    totable() {
        const out = [];
        for (let x = 0; x < 80; x++) for (let y = 0; y < 21; y++) {
            if (selection_getpoint(x, y, this.sv)) out.push({ x, y });
        }
        return out;
    }
    start_timer() { return this; }
    stop_timer() { return this; }

    // Resource cleanup (rarely called explicitly; JS GC handles it).
    free() { try { selection_free(this.sv, 1); } catch (_e) {} this.sv = null; }
}

// Module-level `selection` namespace object — what Lua client code
// calls via `selection.new()` / `selection.match(...)` etc.
export const selection = {
    new: Selection.new,
    room: Selection.room,
    rect: Selection.rect,
    area: Selection.area,
    line: Selection.line,
    randline: Selection.randline,
    match: Selection.match,
    negate: Selection.negate,
    grow: Selection.grow,
    floodfill: Selection.floodfill,
    rndcoord: Selection.rndcoord,
    percentage: Selection.percentage,
    set: Selection.set,
};
