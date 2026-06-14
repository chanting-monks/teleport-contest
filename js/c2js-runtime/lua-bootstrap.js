// lua-bootstrap.js — register the pre-compiled dat/*.lua bundle
// with the runtime Lua bridge.  Required for translated
// `init_dungeons()`, `read_lua_file_obj()`, and similar functions
// that call `nhl_loadlua(L, "dungeon.lua")` etc.
//
// Pre-compilation runs offline via
// `tools/c2js/build-dat-bundle.mjs`, which produces
// `./dat-bundle.js`.  At runtime we only import that module — no
// filesystem touches to `nethack-c/upstream/dat/`.  See LEARNINGS
// §23.202 for the reason: the chanting-monks scoring sandbox
// does not have the upstream submodule, so any readdirSync of
// dat/ would silently return [].
//
// Idempotent (registers once per process).

import { registerLuaData, registerLuaTemplatic, registerLuaJsModule, installNhlibLuaGlobals, LSPO_FUNCTION_REGISTRY, installThemermsWrappers } from './lua.js';
import { buildLuaModuleEnv } from './lua-module-env.mjs';
import { installSelectionGlobals } from './nhlsel-bridge.mjs';
import { DAT_BUNDLE } from './dat/_index.js';

// JS-module replacements for hand-ported / transpiled Lua files.
// Each entry: name → { modulePath, makeLoader } where
//   - modulePath: ES module to import once at bootstrap (side
//     effects populate any required globalThis)
//   - makeLoader(mod): build a sync `(L) => 1` callback that
//     runs at nhl_loadlua time.  This is where PRNG-firing side
//     effects (e.g. nhlib.lua's top-level `shuffle(align)`) must
//     happen so the call order matches the original Lua load timing.
const JS_MODULE_REPLACEMENTS = new Map();

// Register a JS module replacement.  Idempotent.
export function registerJsReplacement(luaName, modulePath, makeLoader) {
    JS_MODULE_REPLACEMENTS.set(luaName, { modulePath, makeLoader });
}

// Default replacement set — files we've hand-ported with verified
// PRNG-equivalent behavior under seed8000.  Adding files here is
// the path used to retire the fengari interpreter dependency
// (see docs/LEARNINGS.md §23.199).
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
// other Lua-loaded chunks may call; the loader installs JS-backed
// Lua callbacks for those before bootstrapNhlib runs.
//
// Verified 2026-05-25: aggregate P=110285/792838 preserved,
// seed8000 P=3130/3130 S=23/23, no session-level regression
// vs. the prior Lua-source nhlib.lua load.
JS_MODULE_REPLACEMENTS.set('nhlib.lua', {
    modulePath: './nhlib-js.mjs',
    makeLoader: (mod) => (L) => {
        // Install Lua-side wrappers for the helpers nhlib.lua would
        // have defined.  Without these, any Lua chunk that calls
        // `shuffle()` / `percent()` / `d()` / `math.random()` would
        // not resolve them at the Lua level.
        installNhlibLuaGlobals(L);
        // Fire the PRNG calls nhlib.lua's top-level shuffle(align)
        // would have fired (rn2(3), rn2(2)) AND publish the shuffled
        // `align` table as the global the transpiled themerms reads
        // ("Temple of the gods" fill: des.altar({align = align[1]})).
        // It was being discarded as "dead code" — seed2600's themed
        // fill crashed on globalThis.align[0] (Q9 iter 41).
        try {
            const r = mod.bootstrapNhlib();
            if (r && Array.isArray(r.align)) globalThis.align = r.align;
        } catch (_e) {}
        // nhlib.lua also defines the global function hell_tweaks
        // (hellfill.lua's maze branches await it).  Build the same
        // per-load env the transpiled dat modules receive and bind
        // the hand-ported factory (§23.243; previously undefined —
        // "globalThis.hell_tweaks is not a function" killed every
        // deep-Gehennom replay that rolled a maze variant).
        const lspoTable = LSPO_FUNCTION_REGISTRY.get('des') || [];
        globalThis.hell_tweaks = mod.makeHellTweaks(buildLuaModuleEnv(L, lspoTable));
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
    // JS_MODULE_REPLACEMENTS override anything else.  These are the
    // hand-ported files (nhcore-js.mjs, nhlib-js.mjs) whose runtime
    // semantics are validated against the source-Lua behavior.  The
    // bundle's `jsmodule` entry for the same name is dropped on the
    // floor so the hand-port's side effects win.
    for (const [name, { modulePath, makeLoader }] of JS_MODULE_REPLACEMENTS) {
        const mod = await import(modulePath);
        registerLuaJsModule(name, makeLoader ? makeLoader(mod) : () => 1);
    }
    // Bundle-data category: parsed JSON-safe values, materialized
    // onto the Lua state as globals by lua.js's push_js_value.
    for (const [name, value] of Object.entries(DAT_BUNDLE.data)) {
        if (JS_MODULE_REPLACEMENTS.has(name)) continue;
        registerLuaData(name, value);
    }
    // Bundle-templatic category: flat `{ ns, method, args }` call
    // sequences.  nhl_loadlua replays these.
    for (const [name, calls] of Object.entries(DAT_BUNDLE.templatic)) {
        if (JS_MODULE_REPLACEMENTS.has(name)) continue;
        registerLuaTemplatic(name, calls);
    }
    // Bundle-jsmodule category: pre-rendered async functions whose
    // default-export shape matches what the data:URL import used to
    // produce (a function taking the per-load env shim).
    for (const [name, defaultFn] of Object.entries(DAT_BUNDLE.jsmodule)) {
        if (JS_MODULE_REPLACEMENTS.has(name)) continue;
        registerLuaJsModule(name, async (L) => {
            const lspoTable = LSPO_FUNCTION_REGISTRY.get('des') || [];
            const env = buildLuaModuleEnv(L, lspoTable);
            await defaultFn(env);
            if (name === 'themerms.lua') installThemermsWrappers(L);
            return 1;
        });
    }
}

