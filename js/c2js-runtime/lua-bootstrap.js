// lua-bootstrap.js — read dat/*.lua files and register with the
// runtime Lua bridge.  Required for translated `init_dungeons()`,
// `read_lua_file_obj()`, and similar functions that call
// `nhl_loadlua(L, "dungeon.lua")` etc.
//
// Mirrors the harness's pattern at prng-diff-extended.mjs lines
// ~1580-1596: scan upstream dat/, parse what our limited Lua
// declarative-data parser accepts, register the rest as raw
// source for fengari to interpret.
//
// Idempotent (registers once per process).

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerLuaData, registerLuaSource, registerLuaTemplatic, registerLuaJsModule, installNhlibLuaGlobals } from './lua.js';
import { installSelectionGlobals } from './nhlsel-bridge.mjs';
import { parseLuaData } from '../../tools/c2js/lua-data.mjs';
import { parseTemplaticLua } from '../../tools/c2js/lua-templatic.mjs';

// JS-module replacements for hand-ported / transpiled Lua files.
// Each entry: name → { modulePath, makeLoader } where
//   - modulePath: ES module to import once at bootstrap (side
//     effects populate any required globalThis)
//   - makeLoader(mod): build a sync `(L) => 1` callback that
//     runs at nhl_loadlua time.  This is where PRNG-firing side
//     effects (e.g. nhlib.lua's top-level `shuffle(align)`) must
//     happen so the call order matches fengari's load timing.
const JS_MODULE_REPLACEMENTS = new Map();

// Register a JS module replacement.  Idempotent.
export function registerJsReplacement(luaName, modulePath, makeLoader) {
    JS_MODULE_REPLACEMENTS.set(luaName, { modulePath, makeLoader });
}

// Default replacement set — files we've hand-ported with verified
// PRNG-equivalent behavior under seed8000.  Adding files here is
// the path to dropping fengari (project_nh_emit_async.md).
//
// nhcore.lua: zero PRNG calls; loader is a no-op.  Verified
// 2026-05-24 (commit 3273699): replacement preserves seed8000.
JS_MODULE_REPLACEMENTS.set('nhcore.lua', {
    modulePath: './nhcore-js.mjs',
    makeLoader: () => () => 1,
});

// nhlib.lua: replaced.  Top-level fires rn2(3), rn2(2) via
// `shuffle(align)` (PRNG-critical); JS replacement covers that
// via `bootstrapNhlib()`.  nhlib.lua also DEFINES Lua-side
// functions (shuffle, percent, d, math.random override) that
// themerms.lua (still fengari-loaded) calls; the loader installs
// JS-backed Lua callbacks for those before bootstrapNhlib runs.
//
// Verified 2026-05-25: aggregate P=110285/792838 preserved,
// seed8000 P=3130/3130 S=23/23, no session-level regression
// vs. fengari-loaded nhlib.lua.
JS_MODULE_REPLACEMENTS.set('nhlib.lua', {
    modulePath: './nhlib-js.mjs',
    makeLoader: (mod) => (L) => {
        // Install Lua-side wrappers for the helpers nhlib.lua would
        // have defined.  Without these, themerms.lua's fengari
        // execution can't find `shuffle()` / `percent()` / `d()` /
        // `math.random()` and its contents closures throw.
        installNhlibLuaGlobals(L);
        // Fire the PRNG calls nhlib.lua's top-level shuffle(align)
        // would have fired (rn2(3), rn2(2)).  The shuffled `align`
        // array is dead code in current sessions (the Lua-side
        // global isn't read), so we don't publish it.
        try { mod.bootstrapNhlib(); } catch (_e) {}
        return 1;
    },
});

let _installed = false;

export async function installLuaData() {
    if (_installed) return;
    _installed = true;
    // Install the JS-side l_selection_check / l_selection_new
    // globals so translated `lspo_*` code in sp_lev.js (which
    // calls them as bare globals) resolves to the JS impls in
    // nhlsel-bridge.mjs.  Idempotent.
    installSelectionGlobals();
    const __thisDir = dirname(fileURLToPath(import.meta.url));
    const repoRoot = dirname(dirname(__thisDir));
    const luaDir = join(repoRoot, 'nethack-c/upstream/dat');
    let names;
    try { names = readdirSync(luaDir).filter((f) => f.endsWith('.lua')); }
    catch { return; }
    for (const name of names) {
        // JS-module replacement takes priority over all Lua-source
        // classification.  Loads the module (which populates
        // globalThis as a side effect of import) and registers a
        // no-op jsmodule entry so nhl_loadlua returns success.
        if (JS_MODULE_REPLACEMENTS.has(name)) {
            try {
                const { modulePath, makeLoader } = JS_MODULE_REPLACEMENTS.get(name);
                const mod = await import(modulePath);
                const loader = makeLoader ? makeLoader(mod) : () => 1;
                registerLuaJsModule(name, loader);
                continue;
            } catch (e) {
                if (process.env.NH_DEBUG_LUA) {
                    console.error(`[lua-bootstrap] JS replacement failed for ${name}:`, e.message);
                }
                // Fall through to source-load below
            }
        }
        const src = readFileSync(join(luaDir, name), 'utf8');
        // Classification order matters: try declarative first
        // (lua-data.mjs handles dungeon.lua etc.), then templatic
        // (pure call-sequence files), then fall back to raw source
        // for fengari.  Future plan: hand-port the remaining
        // "source" files so fengari can be dropped entirely.
        //
        // The templatic path in nhl_loadlua expects a flat array
        // of `{ ns, method, args }` records — only the
        // straight-line-call subset.  AST-rich files (with local,
        // if, for, function defs, etc.) parse OK with the extended
        // parser but their replay strategy is different (they
        // need a JS-native lspo_* dispatch layer or hand-port).
        // Gate templatic registration on the "legacy safe subset":
        // the AST body must contain only exprstmt calls into
        // ALLOWED_NAMESPACES.
        try { registerLuaData(name, parseLuaData(src)); continue; } catch {}
        try {
            const ast = parseTemplaticLua(src);
            if (isLegacySafeSubset(ast)) {
                registerLuaTemplatic(name, astToLegacyCalls(ast));
                continue;
            }
        } catch {}
        registerLuaSource(name, src);
    }
}

// Check whether the parsed AST is restricted to the original
// templatic subset (exprstmt → call into ns.method only).
function isLegacySafeSubset(ast) {
    for (const stmt of ast.body) {
        if (stmt.kind !== 'exprstmt') return false;
        const e = stmt.expr;
        // Top-level must be a call expression.
        if (!e || e.kind !== 'call') return false;
        // Callee must be `ns.method` where ns is a known namespace.
        const cb = e.callee;
        if (!cb || cb.kind !== 'field' || cb.target?.kind !== 'ident') return false;
        if (!['des', 'selection', 'monster', 'obj', 'feature'].includes(cb.target.name)) return false;
    }
    return true;
}

// Convert AST → old { ns, method, args } record list.  Each arg
// is a plain JS value (the old format that nhl_loadlua's
// templatic-replay path expects).
function astToLegacyCalls(ast) {
    return ast.body.map((stmt) => {
        const e = stmt.expr;
        return {
            ns: e.callee.target.name,
            method: e.callee.name,
            args: e.args.map(astArgToValue),
        };
    });
}

function astArgToValue(expr) {
    switch (expr.kind) {
    case 'num':  return expr.value;
    case 'str':  return expr.value;
    case 'bool': return expr.value;
    case 'nil':  return null;
    case 'table': {
        const allPos = expr.entries.every(en => en.key === null);
        if (allPos) return expr.entries.map(en => astArgToValue(en.value));
        const obj = {};
        let posIdx = 1;
        for (const en of expr.entries) {
            if (en.key === null) obj[posIdx++] = astArgToValue(en.value);
            else if (en.key.kind === 'str') obj[en.key.value] = astArgToValue(en.value);
            else obj[String(astArgToValue(en.key))] = astArgToValue(en.value);
        }
        return obj;
    }
    case 'call': {
        // Nested ns.method(args) — emit as `__call` marker.
        const cb = expr.callee;
        if (cb?.kind === 'field' && cb.target?.kind === 'ident') {
            return { __call: `${cb.target.name}.${cb.name}`, args: expr.args.map(astArgToValue) };
        }
        return null;
    }
    case 'unop':
        if (expr.op === '-') {
            const v = astArgToValue(expr.operand);
            return (typeof v === 'number') ? -v : null;
        }
        return null;
    default:
        return null;
    }
}
