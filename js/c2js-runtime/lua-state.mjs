// lua-state.mjs — JS-native Lua state shim.
//
// NetHack uses Lua only as a configuration / scripting layer.  The
// transpiled .lua → .js modules (lua-templatic.mjs + the env shim
// in lua-module-env.mjs, commit 65036f3) drive actual execution, so
// a full Lua interpreter is never needed.  But the C-translated
// lspo_* functions in sp_lev.js still use ~30 lua_X primitives to
// marshal args across the Lua/JS boundary, and the C bridge
// translated from src/nhlua.c (lua.js) wraps that surface.
//
// This module provides a JS-native lua_state implementing the same
// API names fengari historically exposed (now retired — see
// docs/LEARNINGS.md §23.199).  No Lua-source-interpretation is
// supported — that's the responsibility of the transpiled paths.
//
// Stack values are tagged JS objects:
//   { type: 'nil'        | value: null }
//   { type: 'boolean'    | value: true / false }
//   { type: 'integer'    | value: <int> }
//   { type: 'number'     | value: <float> }
//   { type: 'string'     | value: <string> }     // OR Uint8Array (Lua bytes)
//   { type: 'table'      | value: Map<key, taggedValue> }
//   { type: 'function'   | value: <JS function L → number-of-results> }
//   { type: 'userdata'   | value: <opaque JS object> }
//
// Lua's `nil` and the empty slot are conflated as `NIL`.  Stack
// indices are 1-based positive or negative-from-top, matching the
// Lua C API.

const NIL = Object.freeze({ type: 'nil', value: null });

// Type constants (mirror the standard Lua 5.3 LUA_T* values).
export const LUA_TNONE = -1;
export const LUA_TNIL = 0;
export const LUA_TBOOLEAN = 1;
export const LUA_TLIGHTUSERDATA = 2;
export const LUA_TNUMBER = 3;
export const LUA_TSTRING = 4;
export const LUA_TTABLE = 5;
export const LUA_TFUNCTION = 6;
export const LUA_TUSERDATA = 7;
export const LUA_TTHREAD = 8;

export const LUA_OK = 0;
export const LUA_ERRRUN = 2;
export const LUA_ERRSYNTAX = 3;
export const LUA_ERRMEM = 4;
export const LUA_ERRERR = 5;

// Convert a Lua string argument (which the historical fengari API
// passed as Uint8Array via to_luastring, and which callers in our
// codebase still use via to_lstr() wrappers) to a JS string.  We
// accept JS strings, Uint8Array, and number-array forms.
function asKey(s) {
    if (typeof s === 'string') return s;
    if (s instanceof Uint8Array) return new TextDecoder().decode(s);
    if (Array.isArray(s)) return String.fromCharCode(...s.filter(c => c !== 0));
    if (s && typeof s.toString === 'function') return s.toString();
    return String(s);
}

// Decode a Lua string (Uint8Array) to a JS string.
export function from_lstr(s) {
    if (s == null) return null;
    return asKey(s);
}

// Encode a JS string to a Lua-style byte array (mirrors the
// historical fengari to_luastring signature).
export function to_luastring(s, _cache) {
    if (typeof s !== 'string') s = String(s);
    return new TextEncoder().encode(s);
}
export const to_jsstring = from_lstr;
export const to_lstr = to_luastring;

export function lua_newstate() {
    return {
        stack: [],            // Global value stack (0-based JS array)
        // Call-frame base stack.  Each entry is the absolute (0-based)
        // index just before the first arg/local of a call frame.
        // The frame's view: lua_gettop returns L.stack.length - top
        // frame base; positive lua indices map to frameBase + idx.
        // Negative indices are top-relative (frame-independent) and
        // resolve to L.stack.length + idx.  At the outermost (no
        // C function active), frameBase is 0.
        frameBases: [0],
        globals: new Map(),
        metatables: new WeakMap(),  // table-value → metatable-value
        error: null,
    };
}

export function lua_close(_L) { /* no-op (GC handles cleanup) */ }

function frameBase(L) {
    return L.frameBases[L.frameBases.length - 1] || 0;
}

// Resolve a 1-based positive index (frame-relative) or negative-from-
// top index (frame-independent) to a 0-based absolute stack index.
// Returns -1 if out of range.
function resolveIdx(L, idx) {
    if (idx > 0) return frameBase(L) + idx - 1;
    if (idx < 0) return L.stack.length + idx;
    return -1;
}

function stackAt(L, idx) {
    const i = resolveIdx(L, idx);
    if (i < 0 || i >= L.stack.length) return NIL;
    return L.stack[i] || NIL;
}

// ── Stack manipulation ──────────────────────────────────────────────

// lua_gettop returns the count of items in the CURRENT frame, not
// the global stack.  fb is the absolute index just before the
// frame's first slot, so gettop = absolute-top - fb.
export function lua_gettop(L) { return L.stack.length - frameBase(L); }

export function lua_settop(L, idx) {
    const fb = frameBase(L);
    if (idx < 0) {
        const n = L.stack.length + idx + 1;
        L.stack.length = Math.max(fb, n);
    } else {
        // Extend with nils if growing
        const target = fb + idx;
        while (L.stack.length < target) L.stack.push(NIL);
        L.stack.length = target;
    }
}

export function lua_pop(L, n) { L.stack.length -= n; }

export function lua_remove(L, idx) {
    const i = resolveIdx(L, idx);
    if (i >= 0 && i < L.stack.length) L.stack.splice(i, 1);
}

export function lua_pushvalue(L, idx) {
    L.stack.push(stackAt(L, idx));
}

// ── Push primitives ─────────────────────────────────────────────────

export function lua_pushnil(L) { L.stack.push(NIL); }
export function lua_pushboolean(L, b) { L.stack.push({ type: 'boolean', value: !!b }); }
export function lua_pushinteger(L, n) { L.stack.push({ type: 'integer', value: n | 0 }); }
export function lua_pushnumber(L, n) { L.stack.push({ type: 'number', value: +n }); }
export function lua_pushstring(L, s) { L.stack.push({ type: 'string', value: asKey(s) }); }
export function lua_pushlstring(L, s, _len) { lua_pushstring(L, s); }
export function lua_pushlightuserdata(L, ud) { L.stack.push({ type: 'userdata', value: ud, light: true }); }
export function lua_pushjsfunction(L, fn) { L.stack.push({ type: 'function', value: fn }); }
// Lua C function pointers via fengari: same as JS function.
export const lua_pushcfunction = lua_pushjsfunction;
export const lua_pushcclosure = (L, fn, _nupvalues) => lua_pushjsfunction(L, fn);

// ── Tables ─────────────────────────────────────────────────────────

export function lua_newtable(L) {
    L.stack.push({ type: 'table', value: new Map() });
}
export function lua_createtable(L, _narr, _nrec) { lua_newtable(L); }

export function lua_setfield(L, idx, key) {
    // Lua C API: idx is resolved relative to the stack BEFORE the
    // value is popped.  Resolve first, then pop, then use the
    // absolute index.
    const absIdx = resolveIdx(L, idx);
    const v = L.stack.pop();
    if (absIdx < 0 || absIdx >= L.stack.length) return;
    const t = L.stack[absIdx];
    if (t && t.type === 'table') t.value.set(asKey(key), v);
}

export function lua_getfield(L, idx, key) {
    const t = stackAt(L, idx);
    if (t.type !== 'table') { L.stack.push(NIL); return LUA_TNIL; }
    const v = t.value.get(asKey(key));
    L.stack.push(v || NIL);
    return luaTypeOf(v || NIL);
}

export function lua_settable(L, idx) {
    const absIdx = resolveIdx(L, idx);
    const v = L.stack.pop();
    const k = L.stack.pop();
    if (absIdx < 0 || absIdx >= L.stack.length) return;
    const t = L.stack[absIdx];
    if (t && t.type === 'table') {
        const key = (k.type === 'string') ? k.value
                  : (k.type === 'integer' || k.type === 'number') ? k.value
                  : asKey(k.value);
        t.value.set(key, v);
    }
}

export function lua_gettable(L, idx) {
    const absIdx = resolveIdx(L, idx);
    const k = L.stack.pop();
    const t = (absIdx >= 0 && absIdx < L.stack.length) ? L.stack[absIdx] : NIL;
    if (t.type !== 'table') { L.stack.push(NIL); return LUA_TNIL; }
    const key = (k.type === 'string') ? k.value
              : (k.type === 'integer' || k.type === 'number') ? k.value
              : asKey(k.value);
    const v = t.value.get(key);
    L.stack.push(v || NIL);
    return luaTypeOf(v || NIL);
}

export function lua_rawseti(L, idx, n) {
    const absIdx = resolveIdx(L, idx);
    const v = L.stack.pop();
    if (absIdx < 0 || absIdx >= L.stack.length) return;
    const t = L.stack[absIdx];
    if (t && t.type === 'table') t.value.set(n | 0, v);
}
export function lua_rawset(L, idx) { lua_settable(L, idx); }
export function lua_rawget(L, idx) { return lua_gettable(L, idx); }
export function lua_rawgeti(L, idx, n) {
    const t = stackAt(L, idx);
    if (t.type !== 'table') { L.stack.push(NIL); return LUA_TNIL; }
    const v = t.value.get(n | 0);
    L.stack.push(v || NIL);
    return luaTypeOf(v || NIL);
}

export function lua_setmetatable(L, idx) {
    const absIdx = resolveIdx(L, idx);
    const mt = L.stack.pop();
    if (absIdx < 0 || absIdx >= L.stack.length) return 0;
    const t = L.stack[absIdx];
    if (t && t.type === 'table') L.metatables.set(t.value, mt.type === 'table' ? mt.value : null);
    return 1;
}
export function lua_getmetatable(L, idx) {
    const t = stackAt(L, idx);
    if (t.type !== 'table') return 0;
    const mt = L.metatables.get(t.value);
    if (!mt) return 0;
    L.stack.push({ type: 'table', value: mt });
    return 1;
}

// Lua `#t` (length).  For sequence tables this is the highest integer
// key; for strings the byte length.
export function lua_len(L, idx) {
    const v = stackAt(L, idx);
    let len = 0;
    if (v.type === 'string') len = String(v.value).length;
    else if (v.type === 'table') {
        for (const k of v.value.keys()) {
            if (typeof k === 'number' && k > len) len = k;
        }
    }
    L.stack.push({ type: 'integer', value: len });
}

export function lua_rawlen(L, idx) {
    const v = stackAt(L, idx);
    if (v.type === 'string') return String(v.value).length;
    if (v.type === 'table') {
        let len = 0;
        for (const k of v.value.keys()) {
            if (typeof k === 'number' && k > len) len = k;
        }
        return len;
    }
    return 0;
}

// Iterate t[key, value] pairs.  Standard Lua C API: pop the previous
// key from the stack, push the next key + value if any, return 1; or
// pop the previous key and return 0 when iteration ends.
export function lua_next(L, idx) {
    const absIdx = resolveIdx(L, idx);
    const t = (absIdx >= 0 && absIdx < L.stack.length) ? L.stack[absIdx] : NIL;
    if (t.type !== 'table') { L.stack.pop(); return 0; }
    const prev = L.stack.pop();
    const keys = [...t.value.keys()];
    let nextIdx = 0;
    if (prev && prev.type !== 'nil') {
        const pk = (prev.type === 'string') ? prev.value : prev.value;
        const found = keys.indexOf(pk);
        nextIdx = found >= 0 ? found + 1 : keys.length;
    }
    if (nextIdx >= keys.length) return 0;
    const k = keys[nextIdx];
    L.stack.push(typeof k === 'number'
        ? { type: 'integer', value: k }
        : { type: 'string', value: k });
    L.stack.push(t.value.get(k) || NIL);
    return 1;
}

// ── Globals ────────────────────────────────────────────────────────

export function lua_setglobal(L, key) {
    L.globals.set(asKey(key), L.stack.pop());
}
export function lua_getglobal(L, key) {
    const v = L.globals.get(asKey(key));
    L.stack.push(v || NIL);
    return luaTypeOf(v || NIL);
}

// ── Type checks ────────────────────────────────────────────────────

function luaTypeOf(v) {
    if (!v || v.type === 'nil') return LUA_TNIL;
    if (v.type === 'boolean') return LUA_TBOOLEAN;
    if (v.type === 'integer' || v.type === 'number') return LUA_TNUMBER;
    if (v.type === 'string') return LUA_TSTRING;
    if (v.type === 'table') return LUA_TTABLE;
    if (v.type === 'function') return LUA_TFUNCTION;
    if (v.type === 'userdata') return v.light ? LUA_TLIGHTUSERDATA : LUA_TUSERDATA;
    return LUA_TNONE;
}

export function lua_type(L, idx) { return luaTypeOf(stackAt(L, idx)); }
export function lua_typename(_L, t) {
    return ['nil','boolean','lightuserdata','number','string','table','function','userdata','thread'][t] || 'none';
}

export function lua_isnil(L, idx) { return lua_type(L, idx) === LUA_TNIL; }
export function lua_isboolean(L, idx) { return lua_type(L, idx) === LUA_TBOOLEAN; }
export function lua_istable(L, idx) { return lua_type(L, idx) === LUA_TTABLE; }
export function lua_isfunction(L, idx) { return lua_type(L, idx) === LUA_TFUNCTION; }
export function lua_isuserdata(L, idx) {
    const t = lua_type(L, idx);
    return t === LUA_TUSERDATA || t === LUA_TLIGHTUSERDATA;
}
export function lua_islightuserdata(L, idx) { return lua_type(L, idx) === LUA_TLIGHTUSERDATA; }
// Lua coercion: numbers ↔ strings.
export function lua_isnumber(L, idx) {
    const t = lua_type(L, idx);
    if (t === LUA_TNUMBER) return true;
    if (t === LUA_TSTRING) {
        const v = stackAt(L, idx).value;
        return v !== '' && !Number.isNaN(Number(v));
    }
    return false;
}
export function lua_isstring(L, idx) {
    const t = lua_type(L, idx);
    return t === LUA_TSTRING || t === LUA_TNUMBER;
}
export function lua_isinteger(L, idx) {
    const v = stackAt(L, idx);
    return v && v.type === 'integer';
}

// ── Conversions ────────────────────────────────────────────────────

export function lua_toboolean(L, idx) {
    const v = stackAt(L, idx);
    if (v.type === 'nil') return 0;
    if (v.type === 'boolean') return v.value ? 1 : 0;
    return 1;
}
export function lua_tointeger(L, idx) {
    const v = stackAt(L, idx);
    if (v.type === 'integer') return v.value | 0;
    if (v.type === 'number') return v.value | 0;
    if (v.type === 'string') {
        const n = parseInt(v.value, 10);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}
export function lua_tointegerx(L, idx, isnum) {
    const v = stackAt(L, idx);
    if (v.type === 'integer' || v.type === 'number') {
        if (isnum) isnum.value = 1;
        return v.value | 0;
    }
    if (v.type === 'string') {
        const n = parseInt(v.value, 10);
        if (Number.isFinite(n)) {
            if (isnum) isnum.value = 1;
            return n;
        }
    }
    if (isnum) isnum.value = 0;
    return 0;
}
export function lua_tonumber(L, idx) {
    const v = stackAt(L, idx);
    if (v.type === 'integer' || v.type === 'number') return v.value;
    if (v.type === 'string') {
        const n = Number(v.value);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}
export function lua_tonumberx(L, idx, isnum) {
    const v = stackAt(L, idx);
    if (v.type === 'integer' || v.type === 'number') {
        if (isnum) isnum.value = 1;
        return v.value;
    }
    if (v.type === 'string') {
        const n = Number(v.value);
        if (Number.isFinite(n)) {
            if (isnum) isnum.value = 1;
            return n;
        }
    }
    if (isnum) isnum.value = 0;
    return 0;
}
export function lua_tostring(L, idx) {
    const v = stackAt(L, idx);
    if (v.type === 'string') return v.value;
    if (v.type === 'integer' || v.type === 'number') {
        const s = String(v.value);
        // Replace stack slot with the string version (matches fengari).
        const i = resolveIdx(L, idx);
        if (i >= 0 && i < L.stack.length) L.stack[i] = { type: 'string', value: s };
        return s;
    }
    return null;
}
export function lua_touserdata(L, idx) {
    const v = stackAt(L, idx);
    return v.type === 'userdata' ? v.value : null;
}
export function lua_tojsstring(L, idx) {
    const v = lua_tostring(L, idx);
    return v == null ? null : v;
}

// ── Calls (no Lua-source interpretation; only registered JS callbacks) ──

// Invoke the function at stack[top-1-nargs] with nargs args.
//
// Lua C-API semantics for callable C-function-like JS callbacks: the
// function sees a fresh stack frame where args are at indices 1..nargs
// and lua_gettop returns nargs.  Inside the callback, all positive
// lua_X indices are frame-relative.  Returned results push onto the
// frame; we promote them to the caller's frame after the call.
//
// Stack timeline:
//   before: [..outer..., fn, arg1, arg2, ...argN]   top=outer+1+N
//   step 1 (remove fn): [..outer..., arg1, ..., argN]   top=outer+N
//   step 2 (push frame): frameBase = outer (so frame's idx 1 = arg1)
//   step 3 (call): fn(L); fn pushes R results
//                  [..outer..., arg1..argN, res1..resR]
//   step 4 (pop frame): frameBase restored
//   step 5 (collapse): copy results down to outer position
//                       [..outer..., res1..resR]
//                       truncate/pad to nresults if not LUA_MULTRET
function callJsFunctionOnStack(L, nargs, nresults) {
    const callerFb = frameBase(L);
    const fnIdx = L.stack.length - 1 - nargs;
    if (fnIdx < callerFb) {
        L.error = 'no function on stack';
        return LUA_ERRRUN;
    }
    const f = L.stack[fnIdx];
    if (!f || f.type !== 'function') {
        L.error = 'attempt to call a ' + lua_typename(L, luaTypeOf(f)) + ' value';
        L.stack.length = fnIdx;
        L.stack.push({ type: 'string', value: L.error });
        return LUA_ERRRUN;
    }
    // Step 1: drop the function.
    L.stack.splice(fnIdx, 1);
    // Step 2: push a new frame whose base is just before the args.
    const newBase = fnIdx;  // absolute index, args start at newBase+0
    L.frameBases.push(newBase);
    let returned = 0;
    try {
        const r = f.value(L);
        returned = (typeof r === 'number' && r >= 0) ? r : 0;
    } catch (e) {
        L.frameBases.pop();
        L.error = String(e?.message || e);
        L.stack.length = fnIdx;
        L.stack.push({ type: 'string', value: L.error });
        return LUA_ERRRUN;
    }
    // Step 3: pop frame.
    L.frameBases.pop();
    // Step 4: collapse args+results → just results at fnIdx.
    const finalTop = L.stack.length;
    const resultsStart = finalTop - returned;
    if (resultsStart > fnIdx) {
        const results = L.stack.slice(resultsStart, finalTop);
        L.stack.length = fnIdx;
        for (const r of results) L.stack.push(r);
    } else {
        // pad or truncate: returned > nargs+1, which shouldn't happen
        // for well-formed C functions, but handle defensively
        L.stack.length = fnIdx + returned;
    }
    // Step 5: adjust to nresults (LUA_MULTRET = -1 means keep all).
    if (nresults !== -1) {
        while (L.stack.length < fnIdx + nresults) L.stack.push(NIL);
        L.stack.length = fnIdx + nresults;
    }
    return LUA_OK;
}

export function lua_call(L, nargs, nresults) {
    const status = callJsFunctionOnStack(L, nargs, nresults);
    if (status !== LUA_OK) throw new Error(L.error || 'lua_call failed');
}
export function lua_pcall(L, nargs, nresults, _errfunc) {
    return callJsFunctionOnStack(L, nargs, nresults);
}
export function lua_pcallk(L, nargs, nresults, errfunc, _ctx, _k) {
    return lua_pcall(L, nargs, nresults, errfunc);
}

// ── lauxlib aliases ────────────────────────────────────────────────

export function luaL_newstate() { return lua_newstate(); }
export function luaL_openlibs(_L) { /* no stdlib loading — we don't run Lua source */ }

export function luaL_setfuncs(L, funcs, _nupvalues) {
    if (!Array.isArray(funcs)) return;
    for (const entry of funcs) {
        if (!entry || !entry.name) break;
        lua_pushjsfunction(L, entry.func);
        lua_setfield(L, -2, entry.name);
    }
}

export function luaL_dostring(_L, _src) {
    // Lua-source interpretation not supported.  Callers should
    // register transpiled JS modules via registerLuaJsModule instead.
    throw new Error('luaL_dostring: Lua source interpretation not supported (fengari-free build); use registerLuaJsModule');
}

export function luaL_loadstring(_L, _src) {
    throw new Error('luaL_loadstring: Lua source interpretation not supported');
}

export function luaL_checkstring(L, idx) {
    const s = lua_tostring(L, idx);
    if (s == null) throw new Error('bad argument #' + idx + ' (string expected)');
    return s;
}
export function luaL_checkinteger(L, idx) {
    if (!lua_isnumber(L, idx)) throw new Error('bad argument #' + idx + ' (integer expected)');
    return lua_tointeger(L, idx);
}
export function luaL_checknumber(L, idx) {
    if (!lua_isnumber(L, idx)) throw new Error('bad argument #' + idx + ' (number expected)');
    return lua_tonumber(L, idx);
}
export function luaL_checktype(L, idx, t) {
    if (lua_type(L, idx) !== t) {
        throw new Error('bad argument #' + idx + ' (' + lua_typename(L, t) + ' expected)');
    }
}
export function luaL_optstring(L, idx, def) {
    return lua_isnil(L, idx) ? def : luaL_checkstring(L, idx);
}
export function luaL_optinteger(L, idx, def) {
    return lua_isnil(L, idx) ? def : luaL_checkinteger(L, idx);
}
export function luaL_optnumber(L, idx, def) {
    return lua_isnil(L, idx) ? def : luaL_checknumber(L, idx);
}
export function luaL_checkoption(L, idx, def, names) {
    const s = lua_isnil(L, idx) ? def : luaL_checkstring(L, idx);
    for (let i = 0; i < names.length; i++) if (names[i] === s) return i;
    return -1;
}

// Compatibility re-export: a fake `lua` object so code written as
// `lua.lua_X(...)` (fengari namespacing) keeps working as we
// migrate.  Each property maps to the corresponding function above.
export const lua = {
    lua_newstate, lua_close, lua_gettop, lua_settop, lua_pop, lua_remove,
    lua_pushvalue, lua_pushnil, lua_pushboolean, lua_pushinteger,
    lua_pushnumber, lua_pushstring, lua_pushlstring, lua_pushlightuserdata,
    lua_pushjsfunction, lua_pushcfunction, lua_pushcclosure,
    lua_newtable, lua_createtable, lua_setfield, lua_getfield,
    lua_settable, lua_gettable, lua_rawseti, lua_rawget, lua_rawset,
    lua_rawgeti, lua_setmetatable, lua_getmetatable, lua_len, lua_rawlen,
    lua_next, lua_setglobal, lua_getglobal,
    lua_type, lua_typename, lua_isnil, lua_isboolean, lua_istable,
    lua_isfunction, lua_isuserdata, lua_islightuserdata, lua_isnumber,
    lua_isstring, lua_isinteger,
    lua_toboolean, lua_tointeger, lua_tointegerx, lua_tonumber,
    lua_tonumberx, lua_tostring, lua_touserdata, lua_tojsstring,
    lua_call, lua_pcall, lua_pcallk,
    LUA_TNONE, LUA_TNIL, LUA_TBOOLEAN, LUA_TLIGHTUSERDATA, LUA_TNUMBER,
    LUA_TSTRING, LUA_TTABLE, LUA_TFUNCTION, LUA_TUSERDATA, LUA_TTHREAD,
    LUA_OK, LUA_ERRRUN, LUA_ERRSYNTAX, LUA_ERRMEM, LUA_ERRERR,
};

export const lauxlib = {
    luaL_newstate, luaL_openlibs, luaL_setfuncs, luaL_dostring, luaL_loadstring,
    luaL_checkstring, luaL_checkinteger, luaL_checknumber, luaL_checktype,
    luaL_optstring, luaL_optinteger, luaL_optnumber, luaL_checkoption,
};

export const lualib = {
    luaL_openlibs,
};
