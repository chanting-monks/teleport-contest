// run-lua.mjs — translator self-tests for Lua → JS transpilation.
//
// Each test under tools/c2js/tests/lua/NN-name/ has:
//   - source.lua    — input Lua source (lifted verbatim from a real
//                     nethack-c/upstream/dat/*.lua file, file:line cited
//                     in the source comment)
//   - expected.js   — snapshot of expected transpiled output
//   - expected-prng.txt (optional) — PRNG call sequence the snippet
//                     fires when the transpiled JS executes against a
//                     recorder.  Pinned from a known-good run.
//
// The harness exposes two gates:
//
//   1. SNAPSHOT — `expected.js` exact match.  Pins translator output
//      so a regression can't slip in unnoticed.
//   2. PRNG TRACE — transpiled JS, when run with a stub env that
//      records math.random calls, fires the pinned call sequence.
//      This validates SEMANTIC equivalence, not just syntactic.
//
// Historical note: when fengari was a devDependency the PRNG gate
// also cross-validated against a live Lua interpretation
// (differential check).  fengari was retired (see LEARNINGS §23.199)
// — we now rely on the pinned expected-prng.txt snapshot only.  The
// fengari import path remains in tracePrngFromLua() so that, if
// someone temporarily npm-installs fengari for local validation, the
// differential check re-engages; otherwise it gracefully degrades.
//
// Usage:
//   node tools/c2js/tests/run-lua.mjs                # check snapshots + PRNG
//   node tools/c2js/tests/run-lua.mjs --update       # write snapshots + PRNG
//   node tools/c2js/tests/run-lua.mjs --filter=02    # subset
//   node tools/c2js/tests/run-lua.mjs --no-prng      # skip PRNG gate

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const luaDir = join(here, 'lua');

const { parseTemplaticLua, renderJsCalls } = await import('../lua-templatic.mjs');
const { parseLuaData } = await import('../lua-data.mjs');

function listTests() {
    if (!existsSync(luaDir)) return [];
    return readdirSync(luaDir)
        .filter(n => statSync(join(luaDir, n)).isDirectory())
        .filter(n => /^\d{2}-/.test(n))
        .sort();
}

function transpile(luaSrc) {
    try {
        const data = parseLuaData(luaSrc);
        return { kind: 'data', value: data };
    } catch {}
    const ast = parseTemplaticLua(luaSrc);
    return { kind: 'templatic', js: renderJsCalls(ast) };
}

function loadModule(jsSrc) {
    const dataUrl = 'data:text/javascript;base64,' + Buffer.from(jsSrc).toString('base64');
    return import(dataUrl);
}

// ---------------------------------------------------------------------
// Differential PRNG harness.
//
// Both sides run the same logic against identical stubs:
//   - math.random / mathRandom — RECORDING.  Returns deterministic
//     values so control flow is reproducible: random(N) → 1,
//     random(a, b) → a, random() → 0.
//   - All namespaces (des, selection, monster, obj, feature, table,
//     string) and helpers (percent, d, type, shuffle, ipairs, pairs,
//     nh, __lua_bor, __lua_band, __lua_bxor, level_difficulty,
//     impossible, pline) — chainable proxy that records access
//     without firing PRNG.  Method calls return self so chains like
//     `selection.room():percentage(30):iterate(fn)` work.
//
// The recorded trace is the sequence of PRNG-firing calls
// (mathRandom / percent / d / nh.rn2) plus the call args.  Equal
// traces mean equivalent semantic behavior on the PRNG channel.
// ---------------------------------------------------------------------

function makePrngRecorder() {
    const trace = [];
    const rng = (...args) => {
        if (args.length === 0) { trace.push('rn()'); return 0; }
        if (args.length === 1) { trace.push(`rn(${args[0]})`); return 1; }
        trace.push(`rn(${args[0]},${args[1]})`); return args[0];
    };
    return { trace, rng };
}

// Chainable stub object.  Any property access yields another chainable
// stub; any call returns the chainable itself, recording nothing
// (PRNG sources are dispatched separately).  Lets transpiled code
// like `selection.room():percentage(30):iterate(fn)` execute without
// throwing, regardless of which methods get called.
function makeChainStub() {
    const fn = () => stub;
    const stub = new Proxy(fn, {
        get(_t, prop) {
            if (prop === Symbol.toPrimitive) return () => 0;
            if (prop === 'length') return 0;
            if (prop === 'then') return undefined;  // not a thenable
            return stub;
        },
        apply: () => stub,
        construct: () => stub,
    });
    return stub;
}

// Build the env table the transpiled JS module expects, with PRNG
// calls funnelled through `rng`.
function buildJsEnv(rng) {
    const chain = makeChainStub();
    const env = {
        // Math/stdlib helpers
        math: { random: (...a) => rng(...a), abs: Math.abs, floor: Math.floor },
        table: { insert: (t, v) => { if (Array.isArray(t)) t.push(v); }, remove: (t) => Array.isArray(t) ? t.pop() : undefined },
        string: { format: (...a) => a.join(' ') },
        type: (v) => v == null ? 'nil' : typeof v === 'object' ? 'table' : typeof v,
        ipairs: (t) => t,  // for-in renders inline; this is just a sentinel for safety
        pairs: (t) => t,
        // Namespaces (chain stubs — record-free no-ops)
        des: chain, selection: chain, monster: chain, obj: chain, feature: chain,
        // PRNG-firing helpers
        // Always return true so conditional blocks exercise their
        // bodies (and fire their nested PRNG calls).  Mirrors the
        // Lua-side `percent` stub.
        percent: (n) => { rng(100); return true; },
        d: (dice, faces) => {
            if (faces === undefined) { rng(dice); return 1; }
            let sum = 0;
            for (let i = 0; i < dice; i++) { rng(faces); sum += 1; }
            return sum;
        },
        shuffle: () => { /* no PRNG without args */ },  // tests can override
        mathRandom: (...a) => rng(...a),
        nh: new Proxy({}, { get: (_t, p) => {
            if (p === 'rn2') return (n) => rng(n);
            if (p === 'random') return (a, b) => rng(a, b);
            if (p === 'level_difficulty') return () => 1;
            return chain;
        } }),
        level_difficulty: () => 1,
        pline: () => {}, impossible: () => {},
        // Bitwise-op helpers
        __lua_bor: () => chain, __lua_band: () => chain, __lua_bxor: () => chain,
    };
    return env;
}

async function tracePrngFromJs(jsSrc, jsSetup = null) {
    const { trace, rng } = makePrngRecorder();
    const env = buildJsEnv(rng);
    // Apply optional per-test setup: defines module-level globals
    // (rm, themerooms, etc.) on globalThis so the transpiled module
    // resolves them via its `globalThis.X` references.
    if (jsSetup) {
        const setupFn = new Function(jsSetup);
        setupFn();
    }
    const mod = await loadModule(jsSrc);
    try { await mod.default(env); } catch (e) {
        return { trace, error: e.message };
    }
    return { trace };
}

async function tracePrngFromLua(luaSrc, luaSetup = null) {
    let lua, lauxlib, lualib, to_jsstring, to_luastring;
    try {
        const f = await import('fengari');
        ({ lua, lauxlib, lualib, to_jsstring, to_luastring } = f);
    } catch (e) {
        return { trace: [], error: 'fengari unavailable: ' + e.message };
    }
    const { trace, rng } = makePrngRecorder();
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    // Push a JS function that wraps `rng` for Lua callers.  Stack-safe
    // argument count handling: peek at top.
    const pushRng = (impl) => {
        lua.lua_pushjsfunction(L, function(L) {
            const n = lua.lua_gettop(L);
            const args = [];
            for (let i = 1; i <= n; i++) args.push(lua.lua_tointeger(L, i));
            const result = impl(...args);
            if (typeof result === 'number') { lua.lua_pushinteger(L, result); return 1; }
            return 0;
        });
    };

    // math.random = recording stub
    lua.lua_getglobal(L, to_luastring('math'));
    pushRng(rng);
    lua.lua_setfield(L, -2, to_luastring('random'));
    lua.lua_pop(L, 1);

    // Install percent / d / shuffle / mathRandom / nh / level_difficulty
    // / impossible / pline / type (Lua's type is built in) / ipairs.
    // Lua percent stub: fire rn(100) and return true so conditionals
    // enter their bodies (matching JS-side `percent` stub behavior).
    lua.lua_pushjsfunction(L, function(L) {
        rng(100);
        lua.lua_pushboolean(L, 1);
        return 1;
    });
    lua.lua_setglobal(L, to_luastring('percent'));
    lua.lua_pushjsfunction(L, function(L) {
        const n = lua.lua_gettop(L);
        const dice = lua.lua_tointeger(L, 1);
        const faces = n >= 2 ? lua.lua_tointeger(L, 2) : null;
        if (faces == null) { rng(dice); lua.lua_pushinteger(L, 1); return 1; }
        for (let i = 0; i < dice; i++) rng(faces);
        lua.lua_pushinteger(L, dice); return 1;
    }); lua.lua_setglobal(L, to_luastring('d'));
    lua.lua_pushjsfunction(L, () => 0); lua.lua_setglobal(L, to_luastring('shuffle'));

    // nh = table with rn2 / level_difficulty / random / impossible
    lua.lua_newtable(L);
    pushRng(rng); lua.lua_setfield(L, -2, to_luastring('rn2'));
    pushRng((a, b) => { rng(a, b); return a; }); lua.lua_setfield(L, -2, to_luastring('random'));
    lua.lua_pushjsfunction(L, () => { lua.lua_pushinteger(L, 1); return 1; }); lua.lua_setfield(L, -2, to_luastring('level_difficulty'));
    lua.lua_pushjsfunction(L, () => 0); lua.lua_setfield(L, -2, to_luastring('impossible'));
    lua.lua_setglobal(L, to_luastring('nh'));

    lua.lua_pushjsfunction(L, () => 0); lua.lua_setglobal(L, to_luastring('impossible'));
    lua.lua_pushjsfunction(L, () => 0); lua.lua_setglobal(L, to_luastring('pline'));
    lua.lua_pushjsfunction(L, () => { lua.lua_pushinteger(L, 1); return 1; });
    lua.lua_setglobal(L, to_luastring('level_difficulty'));

    // Chain-stub namespaces: des, selection, monster, obj, feature.
    // Each is a Lua table whose metatable returns self for any
    // property access, call, or bitwise operation (selection metamethod
    // overloads for set arithmetic).  This lets transpiled chains like
    // `selection.room():percentage(30):iterate(fn)` and bitwise
    // expressions like `selection.area(...) | selection.area(...)`
    // execute without throwing (recording is via the math.random /
    // d / percent / nh.rn2 hooks installed above).
    const setupChainStub = (globalName) => {
        lua.lua_newtable(L);   // [t]
        lua.lua_newtable(L);   // [t, mt]
        const returnSelf = function(L) { lua.lua_pushvalue(L, 1); return 1; };
        for (const mm of ['__index', '__call', '__bor', '__band', '__bxor', '__bnot', '__shl', '__shr', '__unm', '__len']) {
            lua.lua_pushjsfunction(L, returnSelf);
            lua.lua_setfield(L, -2, to_luastring(mm));
        }
        lua.lua_setmetatable(L, -2);
        lua.lua_setglobal(L, to_luastring(globalName));
    };
    for (const ns of ['des', 'selection', 'monster', 'obj', 'feature']) {
        setupChainStub(ns);
    }

    // Run optional setup.lua (per-test bootstrap of module-level
    // globals like `rm`, `themerooms`, `postprocess` that the snippet
    // would normally inherit from its enclosing file).
    if (luaSetup) {
        const setupStatus = lauxlib.luaL_dostring(L, to_luastring(luaSetup));
        if (setupStatus !== lua.LUA_OK) {
            const err = to_jsstring(lua.lua_tostring(L, -1));
            return { trace, error: 'setup: ' + err };
        }
    }

    const status = lauxlib.luaL_dostring(L, to_luastring(luaSrc));
    if (status !== lua.LUA_OK) {
        const err = to_jsstring(lua.lua_tostring(L, -1));
        return { trace, error: err };
    }
    return { trace };
}

// ---------------------------------------------------------------------

export async function runLuaTests({ update = false, filter = null, prng = true } = {}) {
    const tests = listTests();
    let pass = 0, fail = 0;
    const failures = [];
    for (const name of tests) {
        if (filter && !name.includes(filter)) continue;
        const dir = join(luaDir, name);
        const source = readFileSync(join(dir, 'source.lua'), 'utf8');
        const expectedPath = join(dir, 'expected.js');
        const prngPath = join(dir, 'expected-prng.txt');
        let result;
        try {
            result = transpile(source);
        } catch (e) {
            failures.push({ name, kind: 'parse', error: e.message });
            fail++;
            continue;
        }
        const actual = result.kind === 'data'
            ? '// kind: data\n' + JSON.stringify(result.value, null, 2) + '\n'
            : result.js;
        // Module load smoke-check.
        if (result.kind === 'templatic') {
            try {
                const mod = await loadModule(actual);
                if (typeof mod.default !== 'function') {
                    failures.push({ name, kind: 'no-default', error: 'imported module has no default export function' });
                    fail++; continue;
                }
            } catch (e) {
                failures.push({ name, kind: 'import', error: e.message });
                fail++; continue;
            }
        }
        // Snapshot.
        if (update || !existsSync(expectedPath)) {
            writeFileSync(expectedPath, actual);
        } else {
            const expected = readFileSync(expectedPath, 'utf8');
            if (expected !== actual) {
                failures.push({ name, kind: 'snapshot', expected, actual });
                fail++; continue;
            }
        }
        // PRNG trace (level 1 gate).  When fengari is installed locally,
        // this becomes a differential check (Lua vs JS); otherwise it
        // degrades to a pinned-snapshot check against expected-prng.txt.
        if (prng && result.kind === 'templatic') {
            // Each test directory MAY have setup.lua and setup.js to
            // define module-level globals (rm, themerooms, etc.) that
            // the snippet references but isn't part of the lifted
            // source.  Both files run before their respective sources.
            const setupLuaPath = join(dir, 'setup.lua');
            const setupJsPath = join(dir, 'setup.js');
            const luaSetup = existsSync(setupLuaPath) ? readFileSync(setupLuaPath, 'utf8') : null;
            const jsSetup = existsSync(setupJsPath) ? readFileSync(setupJsPath, 'utf8') : null;
            const luaResult = await tracePrngFromLua(source, luaSetup);
            const jsResult = await tracePrngFromJs(actual, jsSetup);
            // If fengari isn't installed (production retirement), skip
            // the lua-vs-js differential gate; pinned snapshot still
            // catches js-side regressions via prng-drift below.
            const fengariMissing = luaResult.error && luaResult.error.startsWith('fengari unavailable');
            const jsTrace = (jsResult.trace || []).join('\n');
            if (update || !existsSync(prngPath)) {
                if (fengariMissing) {
                    // Pin against the JS side only when refreshing
                    // snapshots without an oracle available.
                    writeFileSync(prngPath, jsTrace + '\n');
                } else if (luaResult.error || jsResult.error) {
                    failures.push({ name, kind: 'prng-execute', error: 'lua: ' + (luaResult.error || 'ok') + ' / js: ' + (jsResult.error || 'ok') });
                    fail++; continue;
                } else {
                    const luaTrace = luaResult.trace.join('\n');
                    writeFileSync(prngPath, luaTrace + '\n');
                }
            } else {
                const expectedTrace = readFileSync(prngPath, 'utf8').trim();
                if (!fengariMissing) {
                    const luaTrace = luaResult.trace.join('\n');
                    if (luaTrace !== jsTrace) {
                        failures.push({ name, kind: 'prng-diff', luaTrace, jsTrace, luaErr: luaResult.error, jsErr: jsResult.error });
                        fail++; continue;
                    }
                    if (luaTrace !== expectedTrace) {
                        failures.push({ name, kind: 'prng-drift', expected: expectedTrace, actual: luaTrace });
                        fail++; continue;
                    }
                } else {
                    if (jsTrace !== expectedTrace) {
                        failures.push({ name, kind: 'prng-drift', expected: expectedTrace, actual: jsTrace });
                        fail++; continue;
                    }
                }
            }
        }
        pass++;
    }
    return { pass, fail, failures };
}

// CLI entry
if (process.argv[1] && process.argv[1].endsWith('run-lua.mjs')) {
    const args = process.argv.slice(2);
    const update = args.includes('--update');
    const noPrng = args.includes('--no-prng');
    const filterArg = args.find(a => a.startsWith('--filter='));
    const filter = filterArg ? filterArg.slice('--filter='.length) : null;
    const { pass, fail, failures } = await runLuaTests({ update, filter, prng: !noPrng });
    const total = pass + fail;
    console.log(`lua tests: ${pass}/${total} ${update ? '(snapshots written)' : 'passed'}`);
    for (const f of failures) {
        console.log(`  FAIL ${f.name} [${f.kind}]`);
        if (f.error) console.log(`    ${f.error}`);
        if (f.kind === 'snapshot') {
            const expL = f.expected.split('\n');
            const actL = f.actual.split('\n');
            for (let i = 0; i < Math.max(expL.length, actL.length); i++) {
                if (expL[i] !== actL[i]) {
                    console.log(`    line ${i + 1}:`);
                    console.log(`      expected: ${JSON.stringify(expL[i]?.slice(0, 80))}`);
                    console.log(`      actual:   ${JSON.stringify(actL[i]?.slice(0, 80))}`);
                    break;
                }
            }
        }
        if (f.kind === 'prng-diff') {
            const lLines = f.luaTrace.split('\n');
            const jLines = f.jsTrace.split('\n');
            console.log(`    lua trace (${lLines.length} calls): ${lLines.slice(0, 5).join(' | ')}${lLines.length > 5 ? ' ...' : ''}`);
            console.log(`    js  trace (${jLines.length} calls): ${jLines.slice(0, 5).join(' | ')}${jLines.length > 5 ? ' ...' : ''}`);
            if (f.luaErr) console.log(`    lua error: ${f.luaErr}`);
            if (f.jsErr) console.log(`    js  error: ${f.jsErr}`);
        }
    }
    process.exit(fail > 0 ? 1 : 0);
}
