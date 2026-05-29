// des-bridge.mjs — JS-native `des` / `selection` / etc. proxy
// that lets the templatic-transpiled JS modules call into the
// existing translated `lspo_*` functions WITHOUT going through
// fengari's interpreter.
//
// Why: the transpiled themerms.lua emits `await des.region({...})`
// as plain JS.  The fengari sync/async boundary that blocks
// `NH_EMIT_ASYNC=1` (per project_nh_emit_async.md) is in
// fengari's INTERPRETER calling JS callbacks — when lspo_* are
// async, fengari sees Promises and silently fails.  But if my JS
// code calls lspo_* DIRECTLY (not through fengari's interpreter),
// the call is just JS-to-JS, and `await` on the (potentially
// async) lspo_* resolves naturally.
//
// Strategy: wrap each registered `lspo_*` function in a JS
// dispatch that:
//   1. Saves the fengari stack pointer.
//   2. Pushes JS args onto fengari's stack using the existing
//      lua_pushinteger / lua_createtable / lua_setfield primitives.
//   3. Calls lspo_*(L) directly (just a JS function call).
//   4. Reads any return values from the stack.
//   5. Restores the stack pointer.
//
// This keeps the fengari L alive (since lspo_* internally calls
// lua_getfield / lua_tointeger etc., all backed by fengari), but
// no Lua source ever gets interpreted — the call sequence is
// driven by JS.
//
// Used by:
//   - the transpiled themerms.lua JS module (when wired up)
//   - any other transpiled .lua file that needs des/selection
//
// Not used by:
//   - the fengari interpretation path (still active for `kind:
//     'source'` files like nhlib.lua, quest.lua)

import { lua, lauxlib } from 'fengari';
import {
    lua_pushinteger, lua_pushnumber, lua_pushstring, lua_pushboolean,
    lua_pushnil, lua_gettop, lua_settop, lua_setfield, lua_rawseti,
    lua_createtable, lua_tointeger, lua_tostring, lua_tonumber,
    lua_isnumber, lua_isstring,
} from './lua.js';
import { pushSelection } from './nhlsel-bridge.mjs';
import { Selection } from './selection-js.mjs';

// Build the `des` proxy bound to a specific Lua state.  Each
// method is `async` so JS callers can `await` it.  The body
// pushes args onto L, calls the registered C-translated lspo_*,
// reads back any return values.
//
// `lspoTable` is the array-of-{name, func} from sp_lev.js
// (nhl_functions).  We iterate it once to build the proxy.
export function buildDesProxy(L, lspoTable) {
    const proxy = {};
    for (const entry of lspoTable) {
        if (!entry?.name || !entry?.func) continue;
        const lspoFn = entry.func;
        // Each method takes any number of JS args, pushes them
        // onto L, calls lspoFn(L), reads any returned values.
        proxy[entry.name] = async function(...args) {
            const baseTop = lua_gettop(L);
            try {
                for (const a of args) pushJsValue(L, a);
                const nresults = await lspoFn(L);
                // Read return values if any.  Most lspo_* return 0.
                const top = lua_gettop(L);
                const ret = [];
                for (let i = 0; i < (nresults || 0); i++) {
                    const idx = top - (nresults - 1 - i);
                    ret.push(popJsValue(L, idx));
                }
                return (ret.length === 1) ? ret[0] : ret;
            } finally {
                lua_settop(L, baseTop);
            }
        };
    }
    return proxy;
}

// Push an arbitrary JS value onto the Lua stack.  Mirrors what
// fengari would push if it interpreted a Lua literal with the
// same shape.  Supports numbers, strings, booleans, null, arrays
// (Lua sequence tables), plain objects (Lua key-value tables),
// and Selection-class instances (push their userdata-equivalent).
//
// For nested calls (a value that's itself a call result like
// `selection.area(0,0,5,5)`), the caller should resolve it to a
// concrete value BEFORE handing to pushJsValue.  In templatic-
// transpiled JS this happens naturally (`await des.region(selection.area(0,0,5,5))`
// evaluates the inner call first).
export function pushJsValue(L, v) {
    if (v === null || v === undefined) {
        lua_pushnil(L);
        return;
    }
    if (typeof v === 'boolean') {
        lua_pushboolean(L, v);
        return;
    }
    if (typeof v === 'number') {
        if (Number.isInteger(v)) lua_pushinteger(L, v);
        else lua_pushnumber(L, v);
        return;
    }
    if (typeof v === 'string') {
        lua_pushstring(L, v);
        return;
    }
    if (Array.isArray(v)) {
        // Sequence-table: { [1] = v[0], [2] = v[1], ... }
        lua_createtable(L, v.length, 0);
        for (let i = 0; i < v.length; i++) {
            pushJsValue(L, v[i]);
            lua_rawseti(L, -2, i + 1);
        }
        return;
    }
    if (typeof v === 'object') {
        // Selection: push as light userdata via the nhlsel bridge.
        // Receiving translated code calls `l_selection_check(L, idx)`
        // which retrieves the JS selectionvar via lua_touserdata.
        // See nhlsel-bridge.mjs for the protocol.
        if (v instanceof Selection || (v && typeof v === 'object' && v.sv)) {
            pushSelection(L, v);
            return;
        }
        // Plain key-value table.
        lua_createtable(L, 0, Object.keys(v).length);
        for (const [k, val] of Object.entries(v)) {
            pushJsValue(L, val);
            // Numeric-string keys → integer keys (Lua sequence).
            if (/^[0-9]+$/.test(k)) {
                lua_rawseti(L, -2, Number(k));
            } else {
                lua_setfield(L, -2, k);
            }
        }
        return;
    }
    // Fallback
    lua_pushstring(L, String(v));
}

// Pop a JS value from the Lua stack at the given absolute index.
// For now we handle the common scalar types — integer, string,
// number, nil.  Used by buildDesProxy for return values, though
// most lspo_* return 0 (no return value).
export function popJsValue(L, idx) {
    if (lua_isnumber(L, idx)) return lua_tonumber(L, idx);
    if (lua_isstring(L, idx)) return lua_tostring(L, idx);
    return null;
}
