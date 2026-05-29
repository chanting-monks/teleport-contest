// lua-module-env.mjs — env shim for transpiled .lua → .js modules.
//
// When a templatic .lua file transpiles via lua-templatic.mjs's
// renderJsCalls, the rendered ES module exports a default async
// function that takes a single env object with destructured params
// like `{ des, selection, math, percent, ... }`.
//
// This module builds that env, backing each namespace and helper
// with the appropriate runtime implementation:
//
//   des / monster / obj / feature   - wired to sp_lev.js's lspo_*
//     functions via des-bridge.buildDesProxy, so transpiled code's
//     `await des.terrain(...)` calls the same C-translated routine
//     that fengari would invoke.
//
//   selection   - the Selection class's static methods (selection-js.mjs).
//     Already JS-native; no Lua state needed.
//
//   math / table / string  - Lua stdlib mirrors.  math.random routes
//     to nh.rn2 so PRNG sequencing matches the fengari path.
//
//   type / ipairs / pairs  - Lua stdlib globals.  type() returns
//     Lua-style names ("table", "string", "number", "nil", etc.).
//
//   percent / d / shuffle / mathRandom / nh  - PRNG-firing helpers
//     from nhlib-js.mjs; their identity is preserved across the
//     fengari and transpiled paths.
//
//   __lua_bor / __lua_band / __lua_bxor  - Selection metamethod
//     dispatch.  If either operand is a Selection (has __or/__and/
//     __bxor or sv property), call the method; else fall back to
//     integer bitwise.
//
// The env-builder takes a Lua state L because des-bridge requires
// it to marshal args between JS and the C-translated lspo_* code.
// Each invocation of the transpiled module's default function gets
// a fresh env; the underlying L is shared with fengari (transition
// phase — when fengari leaves entirely, the env-builder will pivot
// to a JS-native lua state shim).

import { buildDesProxy } from './des-bridge.mjs';
import { selection } from './selection-js.mjs';
import { mathRandom, shuffle, d, percent } from './nhlib-js.mjs';

// Lua-style type() — returns Lua type name for a JS value.
function luaType(v) {
    if (v === null || v === undefined) return 'nil';
    if (typeof v === 'string') return 'string';
    if (typeof v === 'number') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'function') return 'function';
    return 'table';   // arrays and plain objects both → table
}

// Minimal Lua-string-format polyfill.  Supports %s, %d, %i, %x, %%.
function luaFormat(fmt, ...args) {
    let i = 0;
    return String(fmt).replace(/%[%dxis]/g, (m) => {
        if (m === '%%') return '%';
        const arg = args[i++];
        if (m === '%s') return String(arg);
        if (m === '%d' || m === '%i') return String(arg | 0);
        if (m === '%x') return (arg >>> 0).toString(16);
        return m;
    });
}

// Build the env object passed to a transpiled .lua module's default
// function.  `L` is the shared Lua state (used by des-bridge to
// marshal args to lspo_*); `lspoTable` is sp_lev.js's nhl_functions
// array.
export function buildLuaModuleEnv(L, lspoTable, helpers = {}) {
    const des = buildDesProxy(L, lspoTable);
    // obj namespace: the transpiled snippets only use `obj.new(name)`
    // (themerms.lua's Buried Treasure room).  Stub to return a chain-
    // like object whose methods (`:class()`, `:totable()`) return
    // sensible defaults so the surrounding logic doesn't throw.
    // TODO: route obj.new through a real factory backed by mksobj
    // when we wire its companions.
    const obj = {
        new: (name) => ({
            class: () => ({}),
            totable: () => ({}),
        }),
    };
    // monster / feature namespaces: not exercised by current
    // transpiled snippets (no monster.X / feature.X calls — those
    // are all des.monster / des.feature methods).  Empty objects
    // are sufficient stubs.
    const monster = {};
    const feature = {};

    // Lua stdlib mirrors
    const math = {
        random: (...args) => mathRandom(...args),
        abs: Math.abs,
        floor: Math.floor,
        ceil: Math.ceil,
        max: Math.max,
        min: Math.min,
        pi: Math.PI,
        sqrt: Math.sqrt,
    };
    const table = {
        insert: (t, v) => { if (Array.isArray(t)) t.push(v); },
        remove: (t) => Array.isArray(t) ? t.pop() : undefined,
        concat: (t, sep = '') => Array.isArray(t) ? t.join(sep) : '',
    };
    const stringStdlib = {
        format: luaFormat,
        sub: (s, i, j) => String(s).slice(i > 0 ? i - 1 : i, j == null ? undefined : (j > 0 ? j : undefined)),
        upper: (s) => String(s).toUpperCase(),
        lower: (s) => String(s).toLowerCase(),
        len: (s) => String(s).length,
        rep: (s, n) => String(s).repeat(n),
        match: (s, pat) => String(s).match(pat),
        gmatch: function* (s, pat) {
            const re = new RegExp(pat, 'g');
            let m;
            while ((m = re.exec(s)) !== null) yield m[1] !== undefined ? m[1] : m[0];
        },
    };

    // Bitwise-op helpers: dispatch to selection metamethods when
    // present, else fall back to integer bitwise.
    const isSelectionLike = (v) => v && typeof v === 'object'
        && (v.sv !== undefined || typeof v.__or === 'function' || typeof v.__and === 'function');
    const lua_bor = (a, b) => {
        if (isSelectionLike(a) && typeof a.__or === 'function') return a.__or(b);
        if (isSelectionLike(b) && typeof b.__or === 'function') return b.__or(a);
        return (a | 0) | (b | 0);
    };
    const lua_band = (a, b) => {
        if (isSelectionLike(a) && typeof a.__and === 'function') return a.__and(b);
        if (isSelectionLike(b) && typeof b.__and === 'function') return b.__and(a);
        return (a | 0) & (b | 0);
    };
    const lua_bxor = (a, b) => {
        if (isSelectionLike(a) && typeof a.__bxor === 'function') return a.__bxor(b);
        if (isSelectionLike(b) && typeof b.__bxor === 'function') return b.__bxor(a);
        return (a | 0) ^ (b | 0);
    };

    return {
        des, selection, monster, obj, feature,
        math, table, string: stringStdlib,
        type: luaType,
        ipairs: (t) => t,    // for-in renders inline; sentinel for safety
        pairs: (t) => t,
        percent, d, shuffle, mathRandom,
        nh: helpers.nh || globalThis.nh || {
            rn2: (n) => mathRandom(n) - 1,
            rn: (n) => mathRandom(n),
            random: (a, b) => mathRandom(a, b),
            level_difficulty: helpers.level_difficulty || (() => 1),
            impossible: () => {},
            // debug_themerm: NetHack debug-mode toggle for showing
            // which themed room got placed.  In release builds and
            // for our transpile path, it's a no-op returning false
            // (so `if nh.debug_themerm(...)` blocks skip).
            debug_themerm: () => false,
            // start_timer_at: schedule a timed effect at (x, y).
            // The transpiled themerms.lua's Ice room uses this for
            // ice-melt timing.  No-op stub for now; the real impl
            // routes through start_timer in timeout.c.
            start_timer_at: () => 0,
        },
        level_difficulty: helpers.level_difficulty || (() => 1),
        pline: helpers.pline || (() => {}),
        impossible: () => {},
        __lua_bor: lua_bor,
        __lua_band: lua_band,
        __lua_bxor: lua_bxor,
    };
}
