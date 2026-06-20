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
    selection_do_randline, selection_from_mkroom,
    selection_getbounds,
} from '../translated/selvar.js';
import { set_floodfillchk_match_under, get_location_coord } from '../translated/sp_lev.js';
import { splev_chr2typ } from './lua.js';
import { IS_STWALL } from '../const.js';
import { MAX_TYPE, MATCH_WALL } from '../translated/nh-constants.js';

// Direction tags Lua uses for selection:grow().
const DIR_TAGS = {
    'all': 0, 'random': 1, 'north': 2, 'east': 3, 'south': 4, 'west': 5,
    'northwest': 6, 'northeast': 7, 'southwest': 8, 'southeast': 9,
};

// C ref nhlsel.c: every coordinate-taking selection binding runs its
// coords through get_location_coord(ANY_LOC, coder->croom, PACK) —
// converting croom-relative / map-offset coords to absolute map
// coords.  The wrappers below mirror that (identity when there's no
// coder/croom and xstart/ystart are 0, which is why unconverted
// wrappers matched on some levels and not others).
function __lcoord(x, y) {
    const g = globalThis.__nh_gameRef || globalThis.game;
    const coder = g && g.coder;
    const croom = (coder && typeof coder.n_subroom === 'number') ? coder.croom : null;
    const xb = { value: x }, yb = { value: y };
    try {
        get_location_coord(xb, yb, 16 /* ANY_LOC */, croom || null,
            ((x & 255) + ((y & 255) << 16)));
    } catch (_e) { return [x, y]; }
    return [xb.value, yb.value];
}

export class Selection {
    constructor(sv) {
        // sv is the underlying selectionvar (created via
        // selection_new from selvar.js).  If omitted, create
        // a fresh empty one.
        this.sv = sv || selection_new();
    }

    // ── Construction helpers ──

    static new() { return new Selection(selection_new()); }

    static room(i) {
        // C ref nhlsel.c l_selection_room + selvar.c
        // selection_from_mkroom: cells must have roomno == the
        // room's number and !edge — NOT the bounding rectangle.
        // For irregular themed rooms (des.map + region irregular)
        // the rectangle overcounts (seed0015 @357: rndcoord fired
        // rn2(54) over the 9x6 box where C fires rn2(36) over the
        // actual floor).  selection_from_mkroom(null) falls back to
        // coder.croom, matching C's no-arg form.
        const game = globalThis.__nh_gameRef || globalThis.game;
        let croom = null;
        if (typeof i === 'number') {
            croom = (i >= 0 && Array.isArray(game?.rooms)
                     && i < (game.nroom | 0)) ? game.rooms[i] : null;
        }
        const sv = selection_from_mkroom(croom);
        selection_recalc_bounds(sv);
        return new Selection(sv);
    }

    static rect(x1, y1, x2, y2) {
        // C ref nhlsel.c l_selection_rect: the four EDGES only
        // (outline).  The old implementation filled the whole box —
        // that's C's `area`/fillrect, which the alias below
        // accidentally inherited correctly while rect itself
        // over-selected (bigrm border terrains painted the interior).
        ([x1, y1] = __lcoord(x1, y1));
        ([x2, y2] = __lcoord(x2, y2));
        const sv = selection_new();
        const ax = Math.min(x1, x2), bx = Math.max(x1, x2);
        const ay = Math.min(y1, y2), by = Math.max(y1, y2);
        for (let x = ax; x <= bx; x++) {
            selection_setpoint(x, ay, sv, 1);
            selection_setpoint(x, by, sv, 1);
        }
        for (let y = ay; y <= by; y++) {
            selection_setpoint(ax, y, sv, 1);
            selection_setpoint(bx, y, sv, 1);
        }
        selection_recalc_bounds(sv);
        return new Selection(sv);
    }
    // C ref nhlsel.c: "area" registers l_selection_fillrect — the
    // FILLED box.
    static area(x1, y1, x2, y2) {
        ([x1, y1] = __lcoord(x1, y1));
        ([x2, y2] = __lcoord(x2, y2));
        const sv = selection_new();
        const ax = Math.min(x1, x2), bx = Math.max(x1, x2);
        const ay = Math.min(y1, y2), by = Math.max(y1, y2);
        for (let x = ax; x <= bx; x++) {
            for (let y = ay; y <= by; y++) selection_setpoint(x, y, sv, 1);
        }
        selection_recalc_bounds(sv);
        return new Selection(sv);
    }
    static fillrect(x1, y1, x2, y2) { return Selection.area(x1, y1, x2, y2); }

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
        // C ref nhlsel.c l_selection_randline: clones the input
        // selection and runs selection_do_randline(x1,y1,x2,y2,
        // rough, rec=12, clone) — the recursive midpoint jitter
        // FIRES rn2(rough) pairs (selvar.c:704).  The old wrapper
        // drew a straight line with "jitter unimplemented", silently
        // skipping those calls (seed0373 div @3289, Q9 iter 47).
        // Numeric-first form (no selection arg) also supported per
        // the C binding.
        if (typeof sel === 'number') {
            // (x1,y1,x2,y2,rough) shifted left one slot
            const sv = selection_new();
            selection_do_randline(sel, x1, y1, x2, roughness === undefined ? 7 : y2, 12, sv);
            return new Selection(sv);
        }
        const src = ((sel && sel.sv) || sel) || selection_new();
        const sv = selection_clone(src);
        ([x1, y1] = __lcoord(x1, y1));
        ([x2, y2] = __lcoord(x2, y2));
        selection_do_randline(x1, y1, x2, y2, roughness === undefined ? 7 : roughness, 12, sv);
        return new Selection(sv);
    }

    static match(pattern) {
        // C ref nhlsel.c l_selection_match + sp_lev.c mapfrag_fromstr
        // / mapfrag_match / match_maptyps, re-expressed synchronously.
        // (The translated mapfrag_* family is async-colored only
        // because mapfrag_get can panic(); the generated dat code
        // calls selection.match() WITHOUT await, so a sync mirror is
        // required.)  Previously a return-empty stub: hellfill's
        // mazegrid branch got full-map bounds and hell_tweaks' river
        // walk had no floor to anchor on.
        const sv = selection_new();
        // mapfrag_fromstr: stripdigits, then line-split.
        const data = String(pattern ?? '').replace(/[0-9]/g, '');
        const lines = data.split('\n');
        const wid = Math.max(...lines.map((l) => l.length));
        const hei = lines.length;
        // mapfrag_canmatch: both dimensions must be odd (C raises a
        // lua error otherwise; mirror as empty selection).
        if (!(wid % 2) || !(hei % 2)) return new Selection(sv);
        const g = globalThis.__nh_gameRef || globalThis.game;
        const locs = g && g.level && g.level.locations;
        if (!locs) return new Selection(sv);
        const halfW = (wid / 2) | 0, halfH = (hei / 2) | 0;
        // Pre-resolve fragment cell types (C mapfrag_get →
        // splev_chr2typ; a missing char on a ragged short line reads
        // as NUL → INVALID_TYPE → matches anything except 'w').
        const fragTyp = [];
        for (let fy = 0; fy < hei; fy++) {
            const row = [];
            for (let fx = 0; fx < wid; fx++) {
                row.push(splev_chr2typ((lines[fy] || '')[fx] || ''));
            }
            fragTyp.push(row);
        }
        for (let y = 0; y <= sv.hei; y++) {
            for (let x = 1; x < sv.wid; x++) {
                let ok = true;
                for (let rx = -halfW; ok && rx <= halfW; rx++) {
                    for (let ry = -halfH; ok && ry <= halfH; ry++) {
                        const mapc = fragTyp[ry + halfH][rx + halfW];
                        const ax = x + rx, ay = y + ry;
                        const inok = ax >= 1 && ax < sv.wid && ay >= 0 && ay < sv.hei;
                        // C: isok() ? levl[ax][ay].typ : STONE
                        const levc = inok ? ((locs[ax] && locs[ax][ay] && locs[ax][ay].typ) | 0) : 0;
                        // match_maptyps
                        if (mapc === MATCH_WALL && !IS_STWALL(levc)) { ok = false; break; }
                        if (mapc < MAX_TYPE && mapc !== levc) { ok = false; break; }
                    }
                }
                selection_setpoint(x, y, sv, ok ? 1 : 0);
            }
        }
        selection_recalc_bounds(sv);
        return new Selection(sv);
    }

    static negate(s) {
        // C ref nhlsel.c l_selection_not: the no-arg class form
        // (`selection.negate()`) returns a NEW all-selected
        // selection (selection_clear(sel, 1)); the with-arg form
        // CLONES first and inverts the clone, leaving the original
        // untouched.  The old wrapper passed undefined through to
        // selection_not (crash: undefined.wid — hellfill's icey
        // layer died as a detached rejection that killed the frozen
        // scorer subprocess AFTER the session finished, the real
        // cause of seed4500's P=0/0 row) and mutated in place.
        if (s == null) {
            const sv = selection_new();
            selection_clear(sv, 1);
            return new Selection(sv);
        }
        const sv = selection_clone((s && s.sv) || s);
        selection_not(sv);
        return new Selection(sv);
    }

    static grow(s, dir) {
        // C ref nhlsel.c l_selection_grow: CLONES the source first
        // (l_selection_clone) and grows the CLONE, leaving the original
        // selection UNCHANGED.  The old wrapper grew sv in place, so a
        // selection reused after `:grow()` was silently corrupted.
        const sv = selection_clone((s && s.sv) || s);
        const tag = DIR_TAGS[dir] ?? 0;
        selection_do_grow(sv, tag);
        return new Selection(sv);
    }

    static floodfill(s, x, y, diagonals) {
        // C ref nhlsel.c:723 — the documented lua forms are
        // `selection.floodfill(x, y[, diagonals])` (flood the MAP
        // from a point into a NEW selection) and the method form
        // `sel:floodfill(x, y)`.  The old wrapper assumed a
        // selection first arg, so the numeric form flooded garbage
        // (s=37 as the selection) and produced an empty selection —
        // Bar-strt's ogre band picked rndcoord(-1,-1) twelve times
        // (Q9 iter 47).
        if (typeof s === 'number') {
            ([s, x] = __lcoord(s, x));
            // C ref nhlsel.c l_selection_flood: before flooding, set
            // the match predicate to "same typ as the start cell" —
            // without it the stale/unset chk matches nothing and the
            // flood comes back EMPTY (the ogre band's rndcoord then
            // fires no rng at all; Q9 iter 50 second half).
            const g = globalThis.__nh_gameRef || globalThis.game;
            const sv = selection_new();
            const cell = g?.level?.locations?.[s]?.[x];
            if (cell && typeof cell.typ === 'number') {
                set_floodfillchk_match_under(cell.typ);
                selection_floodfill(sv, s, x, y ? 1 : 0);
            }
            return new Selection(sv);
        }
        const sv = ((s && s.sv) || s);
        selection_floodfill(sv, x, y, diagonals ? 1 : 0);
        return new Selection(sv);
    }

    static rndcoord(s, removeit) {
        // C ref nhlsel.c l_selection_rndcoord.  The translated
        // selection_rndcoord takes FOUR args — (ov, xBox, yBox,
        // removeit) with {value} out-boxes; the old wrapper passed
        // (sv, {x,y}, 0), so the y box was the NUMBER 0 ("Cannot
        // create property 'value' on number '0'" — pcall-swallowed,
        // aborting themed-room contents) and removeit was dropped
        // (rndcoord(1) callers in themerms rely on it to deplete
        // the selection between picks).  C then converts the hit to
        // ROOM-RELATIVE coords — update_croom(), subtract croom
        // lx/ly when the coder is in a room, else xstart/ystart —
        // and ALWAYS returns a table ({x:-1,y:-1} on miss, not nil).
        const sv = ((s && s.sv) || s);
        const game = globalThis.__nh_gameRef || globalThis.game;
        const xb = { value: -1 }, yb = { value: -1 };
        selection_rndcoord(sv, xb, yb, removeit ? 1 : 0);
        let x = xb.value, y = yb.value;
        if (!(x === -1 && y === -1)) {
            // update_croom (translated sp_lev.js): croom :=
            // tmproomlist[n_subroom-1] or null.  Inlined to avoid an
            // import cycle; concrete-shape guards per the gstate
            // Proxy-ghost rule.
            const coder = game?.coder;
            const hasCoder = !!coder && typeof coder.n_subroom === 'number';
            if (hasCoder) {
                coder.croom = coder.n_subroom
                    ? (coder.tmproomlist?.[coder.n_subroom - 1] ?? null)
                    : null;
            }
            const croom = hasCoder ? coder.croom : null;
            if (croom && typeof croom.lx === 'number') {
                x -= croom.lx;
                y -= croom.ly;
            } else {
                x -= (typeof game?.xstart === 'number' ? game.xstart : 0);
                y -= (typeof game?.ystart === 'number' ? game.ystart : 0);
            }
        }
        return { x, y };
    }

    static percentage(s, p) {
        // C ref nhlsel.c l_selection_filter_percent: returns the NEW
        // filtered selection (tmp = selection_filter_percent(sel,p);
        // push_copy(tmp)), leaving the original UNCHANGED.  The old
        // wrapper discarded selection_filter_percent's return and
        // handed back the original (unfiltered) selection — so a chain
        // like hellfill's `negate():percentage(10):grow():filter_mapchar(".")`
        // kept ALL floor cells instead of ~10%, turning the whole
        // Gehennom level to ice and leaving no floor for the UPTELE
        // lregion (seed4500).  Masked until selection_clear() was fixed
        // to actually fill (empty selections hid every filter).
        const sv = ((s && s.sv) || s);
        return new Selection(selection_filter_percent(sv, p));
    }

    static set(s, x, y) {
        // C ref nhlsel.c l_selection_setpoint: coords ALWAYS run
        // through get_location_coord(ANY_LOC, croom, PACK); a
        // missing (x,y) packs SP_COORD_PACK_RANDOM(0) -- ONE random
        // location (rn2-rolling), NOT "set all points" (the old
        // wrapper filled all 1680 cells, and stored given coords
        // RAW without the xstart/ystart conversion -- soko1-1's
        // prize spot landed at the (78,20) clamp; Q9 iter 56).
        const sv = ((s && s.sv) || s);
        const g = globalThis.__nh_gameRef || globalThis.game;
        const coder = g && g.coder;
        const croom = (coder && typeof coder.n_subroom === 'number') ? coder.croom : null;
        const xb = { value: (x === undefined ? -1 : (x | 0)) };
        const yb = { value: (y === undefined ? -1 : (y | 0)) };
        const crd = (xb.value === -1 && yb.value === -1)
            ? 0x01000000 /* SP_COORD_PACK_RANDOM(0) */
            : ((xb.value & 255) + ((yb.value & 255) << 16));
        get_location_coord(xb, yb, 16 /* ANY_LOC */, croom || null, crd);
        selection_setpoint(xb.value, yb.value, sv, 1);
        selection_recalc_bounds(sv);
        return new Selection(sv);
    }

    // ── Instance methods (Lua `s:method()` syntax) ──

    new() { return new Selection(selection_clone(this.sv)); }
    clone() { return new Selection(selection_clone(this.sv)); }
    // C ref nhlsel.c l_selection_getbounds (`local rect = sel:bounds()`):
    // returns a plain {lx, ly, hx, hy} table.  hellfill.lua's mazegrid
    // branch calls it on selection.match's result; before this existed
    // the call threw TypeError and killed the replay (the layer of the
    // seed4500 loader-crash chain BEHIND the negate fix — fixing negate
    // let execution reach this).
    bounds() {
        const rect = { lx: 0, ly: 0, hx: 0, hy: 0 };
        selection_getbounds(this.sv, rect);
        return rect;
    }
    negate() { return Selection.negate(this); }
    grow(dir) { return Selection.grow(this, dir); }
    floodfill(x, y, diagonals) { return Selection.floodfill(this, x, y, diagonals); }
    rndcoord(removeit) { return Selection.rndcoord(this, removeit); }
    percentage(p) { return Selection.percentage(this, p); }
    set(x, y) { return Selection.set(this, x, y); }
    filter_mapchar(typ, lit) {
        // C ref nhlsel.c l_selection_filter_mapchar: returns the NEW
        // filtered selection, original UNCHANGED.  Same discard bug as
        // percentage() above — returning `this` (the unfiltered source)
        // broke the hellfill icey chain.
        return new Selection(selection_filter_mapchar(this.sv, typ, lit));
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
    fillrect: Selection.fillrect,
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
