// nhlib-js.mjs — JS hand-port of dat/nhlib.lua.
//
// PRNG-critical: the top-level `shuffle(align)` MUST fire the same
// `rn2(3), rn2(2)` sequence the Lua version does, in exact order.
// seed8000's PRNG match (3130/3130) gates this — any drift here
// breaks every session.
//
// This file is consumed by lua-bootstrap.js / lua.js:
// - `bootstrapNhlib(L)` runs the top-level (shuffle align + define
//   globals on the Lua state via install_nh_globals path).
// - The exported helpers (`shuffle`, `d`, `percent`, etc.) can also
//   be called directly from JS when nhlib's behavior is needed
//   outside the Lua bridge.
//
// What's mirrored:
// - math.random override (rerouted to nh.rn2 / nh.random)
// - shuffle (Fisher-Yates, reversed iteration)
// - d (XdY dice)
// - percent
// - align global = ["law", "neutral", "chaos"], shuffled in-place
// - monkfoodshop
// - table_stringify, pline, nh_set/get_variables_string,
//   tutorial_* (cold paths — kept sync, faithful)
//
// What's NOT mirrored yet (kept fengari-side for now):
// - hell_tweaks (uses selection: builder DSL, multi-method chains)
// - tutorial_events table (closures over JS-side state)
//
// The shuffle-align case is the load-bearing PRNG-fired piece;
// helpers like `d` and `percent` only matter when called by other
// hand-ported code, so their JS versions sit unused until that
// code is wired in.

// math.random override.  C ref nhlib.lua:5-15.
//   1-arg form: math.random(n) → 1 + nh.rn2(n)  (range [1, n])
//   2-arg form: math.random(low, high) → low + nh.rn2(high+1-low)
// Bound to globalThis.rn2 / globalThis.nh_random (installed by
// the harness via __nh_lua_bindings or directly on globalThis).
function mathRandom(...args) {
    const rn2 = globalThis.__nh_lua_bindings?.rn2 || globalThis.rn2;
    if (args.length === 1) {
        return 1 + rn2(args[0]);
    }
    if (args.length === 2) {
        const random = globalThis.__nh_lua_bindings?.random || globalThis.nh_random;
        if (typeof random === 'function') return random(args[0], args[1] + 1 - args[0]);
        return args[0] + rn2(args[1] + 1 - args[0]);
    }
    throw new Error('NetHack math.random requires at least one parameter');
}

// shuffle: Fisher-Yates from #list down to 2.
// C ref nhlib.lua:17-22.  Mutates `list` in-place.
// Lua iteration `for i = #list, 2, -1` translates to:
//   for (let i = list.length; i >= 2; i--)
// Lua arrays are 1-indexed; we represent them as JS arrays whose
// length matches the Lua #list value (the underlying storage is
// 0-indexed so list[i] in Lua → list[i-1] in JS).
function shuffle(list) {
    for (let i = list.length; i >= 2; i--) {
        const j = mathRandom(i);  // returns 1..i; map to 0-index
        const tmp = list[i - 1];
        list[i - 1] = list[j - 1];
        list[j - 1] = tmp;
    }
}

// d(dice, faces): roll `dice` d`faces`, return sum.
// 1-arg form: d(n) = math.random(1, n) — single roll of d`n`.
// C ref nhlib.lua:29-40.
function d(dice, faces) {
    if (faces === undefined || faces === null) {
        return mathRandom(1, dice);
    }
    let sum = 0;
    for (let i = 0; i < dice; i++) sum += mathRandom(1, faces);
    return sum;
}

// percent(threshold): true `threshold`% of the time.
// C ref nhlib.lua:43-45.  math.random(0, 99) < threshold.
function percent(threshold) {
    return mathRandom(0, 99) < threshold;
}

// align: global Lua table, shuffled once at module load.
// C ref nhlib.lua:24-25.  Order after shuffle is deterministic
// given the PRNG state at that point.  Returned to caller so the
// caller can mirror it into the Lua state.
function shuffleAlign() {
    const align = ['law', 'neutral', 'chaos'];
    shuffle(align);
    return align;
}

// Bootstrap entry: runs the top-level effects (the math.random
// override + shuffle(align)) that any nhlib client expects.
// Returns the shuffled align so the caller can also publish it as
// a Lua global if the Lua state is in scope.
//
// PRNG sequence fired: rn2(3) from shuffle's first iter (i=3, j=rn2(3)+1)
//                      rn2(2) from shuffle's second iter (i=2, j=rn2(2)+1)
export function bootstrapNhlib() {
    return { align: shuffleAlign() };
}

// Exported helpers for hand-ported code that wants nhlib's
// semantics without going through fengari.  Currently unused —
// integrated when downstream hand-ports land.
export { mathRandom, shuffle, d, percent };

// ── Cold-path helpers (not yet on any session's hot path) ──

// monkfoodshop: returns "health food shop" iff hero is a Monk,
// else "food shop".  C ref nhlib.lua:47-52.
export function monkfoodshop() {
    const role = globalThis.__nh_gameRef?.u?.urole?.name?.m;
    return (role === 'Monk') ? 'health food shop' : 'food shop';
}

// table_stringify: NetHack's pure-Lua table-to-string for save/
// restore round-trips.  Mirrors C ref nhlib.lua:157-176.  Only
// used by nh_set_variables_string / nh_get_variables_string, which
// in turn are used only for save/restore.  Cold path; faithful
// implementation here so save data can round-trip even when
// fengari is removed.
export function tableStringify(tbl) {
    let str = '';
    for (const key of Object.keys(tbl)) {
        const value = tbl[key];
        const typ = (value === null) ? 'nil'
                  : (typeof value === 'object') ? 'table'
                  : typeof value;
        if (typ === 'table') {
            str += `["${key}"]=${tableStringify(value)}`;
        } else if (typ === 'string') {
            str += `["${key}"]=[[${value}]]`;
        } else if (typ === 'boolean') {
            str += `["${key}"]=${value}`;
        } else if (typ === 'number') {
            str += `["${key}"]=${value}`;
        } else if (typ === 'nil') {
            str += `["${key}"]=nil`;
        }
        str += ',';
    }
    return `{${str}}`;
}

export function nhSetVariablesString(key, tbl) {
    return `nh_lua_variables["${key}"]=${tableStringify(tbl)};`;
}

export function nhGetVariablesString(tbl) {
    return `return ${tableStringify(tbl)};`;
}

// pline (variadic): forwards to globalThis.pline with the format
// resolved.  Cold path; the engine's pline routing is via
// _pending_message rather than this entry.  Kept for completeness.
export function pline(fmt, ...args) {
    // Limited Lua-style string.format: substitute %s in order.
    let i = 0;
    const msg = fmt.replace(/%s/g, () => String(args[i++] ?? ''));
    if (typeof globalThis.pline === 'function') globalThis.pline(msg);
}
