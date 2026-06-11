// nhlsel-bridge.mjs — JS bridge for the Lua `selection` userdata
// type that translated `lspo_*` functions check via
// `l_selection_check(L, idx)`.
//
// Why: hand-ported translated code in `js/translated/sp_lev.js`
// has paths like:
//     lua_getfield(L, 1, "selection");
//     sel = l_selection_check(L, -1);
// — but `l_selection_check` isn't defined anywhere in JS today,
// because `nhlsel.c` (where C's l_selection_check lives) isn't
// translated.  Result: calls into lspo_gas_cloud / lspo_terrain /
// lspo_replace_terrain etc. fail with ReferenceError when they
// hit a selection-arg path.  Currently this manifests as
// makerooms-2 pcall failures in seed8000 → safety-net kicks in
// after 100 retries → mklev falls back.
//
// This module provides:
// - `l_selection_check(L, index)` — JS impl that reads light-
//   userdata at `index` and returns the JS Selection (or its sv).
// - `pushSelection(L, sel)` — push a Selection onto L as
//   light-userdata so the receiving lspo_* can read it back.
//
// Used by:
// - `des-bridge.mjs`'s pushJsValue() when arg is a Selection
// - eventually exported as a global so translated code can call
//   `l_selection_check` once its calls are wired (via build-engine
//   import patch or a globalThis shim).
//
// We use the shim's light userdata (`lua_pushlightuserdata`) which
// stores an opaque JS reference and returns it from
// `lua_touserdata`.  No metatable setup needed for this slice —
// `l_selection_check` just unwraps the pointer.  (Real `nhlsel.c`
// uses full userdata with a "selection" metatable for __gc; for
// our purposes lightuserdata is simpler because GC is JS-side.)

import { lua } from './lua-state.mjs';
import { Selection } from './selection-js.mjs';

// Push a JS Selection (or raw selectionvar) onto the Lua stack
// as light userdata.  The receiving translated code calls
// `l_selection_check(L, idx)` which retrieves the pointer.
export function pushSelection(L, sel) {
    if (sel == null) {
        lua.lua_pushnil(L);
        return;
    }
    // Normalize: pushSelection takes either a Selection instance
    // or its underlying sv (selectionvar).  Both are JS objects;
    // we store the sv since that's what translated code expects.
    const sv = (sel && sel.sv) ? sel.sv : sel;
    lua.lua_pushlightuserdata(L, sv);
}

// l_selection_check — JS counterpart of nhlsel.c's
// l_selection_check.  Reads light userdata at `index`, returns
// the wrapped JS sv.  Throws if absent (matching C semantics
// where luaL_checktype raises a Lua error).
export function l_selection_check(L, index) {
    const sv = lua.lua_touserdata(L, index);
    if (sv == null) {
        // Match C: nhl_error(L, "Selection error")
        throw new Error('l_selection_check: not a selection at index ' + index);
    }
    return sv;
}

// l_selection_new — alloc a fresh selectionvar, push as
// lightuserdata.  Translated callers may use this when they
// want to create a new selection to populate.
export async function l_selection_new(L) {
    const { selection_new } = await import('../translated/selvar.js');
    const sv = selection_new();
    pushSelection(L, sv);
    return 1;
}

// l_selection_push_copy — JS counterpart of nhlsel.c:112.  C
// allocs a fresh selection userdata, struct-copies *tmp into it
// and dupstr()s the map:
//     *sel = *tmp;
//     sel->map = dupstr(tmp->map);
// Our map is an immutable JS string, so a shallow spread plus a
// bounds copy gives the same value semantics; push as light
// userdata like pushSelection.  (lspo_map returns the selection
// of map locations this way — sp_lev.js:5514.)
export function l_selection_push_copy(L, tmp) {
    const sel = { ...tmp, bounds: { ...tmp.bounds } };
    lua.lua_pushlightuserdata(L, sel);
}

// Install the JS-side l_selection_check etc. as globalThis
// references so translated code that calls them resolves.
// Idempotent — but must WIN over a previously-installed autostub
// (Q9 iter 51: the stub-manifest carries l_selection_check, so a
// bare-truthiness guard left the `() => 0` autostub in place and
// every selection-arg lspo_* silently no-opped: Bar-strt's
// des.terrain(randline, ".") never carved the river, 4 extra kelp
// cells, seed0373 div @4108).
export function installSelectionGlobals() {
    if (globalThis.l_selection_check === l_selection_check) return;
    globalThis.l_selection_check = l_selection_check;
    globalThis.l_selection_new = l_selection_new;
    globalThis.l_selection_push_copy = l_selection_push_copy;
    globalThis.pushSelection = pushSelection;
}
