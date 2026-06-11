// autostub.js — populate globalThis with no-op stubs for any C
// function name referenced in translator output but not yet
// resolvable via imports.
//
// Why: translated NetHack code references many libc / utility
// functions (vsnprintf, dupstr, atoi, abs, sleep, fopen, ...) and
// NetHack-internal helpers whose home TUs aren't in the closure
// (savefruitchn, savecemetery, paniclog, ...).  EXTERNAL_SYMBOLS
// covers the ones that fire from PRNG-faithful code paths.  The
// rest can fire transitively from translated chargen / mklev /
// movement when those are wired into the engine.
//
// This module is the systemic catch-all: scan every loaded
// translator output module's source text, identify identifier names
// at expression-call position that aren't already defined globally,
// and pre-install a no-op returning 0 / null on globalThis.  ES
// modules consult globalThis for free identifiers, so the stubs
// resolve naturally without changing the import graph.
//
// This mirrors the pattern in tools/c2js/prng-diff-extended.mjs
// lines ~1530-1550.  Lifting it into a runtime module means the
// engine path gets the same protection without copy-pasting the
// harness logic.
//
// Call `installAutoStubs(translatedDir)` once during engine
// startup, AFTER all translator-output modules have loaded.
//
// Browser compatibility: node:fs / node:path are loaded lazily
// at install-time via dynamic import.  Browsers without those
// modules see installAutoStubs() gracefully no-op (the caller
// is responsible for pre-installing any needed stubs).

const RESERVED = new Set([
    'if', 'for', 'while', 'switch', 'return', 'function',
    'typeof', 'new', 'do', 'catch', 'else', 'case',
    'continue', 'break', 'throw', 'await', 'async',
    'let', 'const', 'var', 'in', 'of', 'try', 'finally',
    'instanceof', 'void', 'delete', 'this', 'super',
]);

let _installed = false;

// Manifest-first (UNWEDGE_PLAN Q2): the candidate list is generated
// at build time by tools/c2js/gen-stub-manifest.mjs into
// js/translated/stub-manifest.js — a tiny ES module that imports in
// ANY environment (node + browser).  This replaces re-reading and
// regex-scanning 12+ MB of translated source at every startup
// (~200 ms), and closes the old node/browser divergence where the
// browser silently got no stubs at all.
//
// The legacy fs scan below remains ONLY as a degradation path for a
// missing manifest, with a loud warning.  NH_FORBID_AUTOSTUB_SCAN=1
// turns reaching the fallback into a hard error (used by test
// tooling to prove the manifest path is taken).
export async function installAutoStubs(translatedDir) {
    if (_installed) return;
    _installed = true;

    try {
        const { STUB_NAMES } = await import(
            new URL('../translated/stub-manifest.js', import.meta.url).href);
        for (const name of STUB_NAMES) {
            if (typeof globalThis[name] !== 'undefined') continue;
            globalThis[name] = () => 0;
        }
        return;
    } catch (e) {
        const env = globalThis.process?.env || {};
        if (env.NH_FORBID_AUTOSTUB_SCAN) {
            throw new Error('autostub: stub-manifest.js missing and scan forbidden: ' + e.message);
        }
        console.warn('[autostub] stub-manifest.js unavailable (' + e.message
            + ') — falling back to runtime source scan; run'
            + ' tools/c2js/gen-stub-manifest.mjs');
    }

    // ── legacy fallback: runtime source scan (node-only) ──
    // Keep behaviorally identical to gen-stub-manifest.mjs.
    // `pathJoin`, not `join`: NetHack has its own join() (corridor
    // joining, sp_lev.c) which is async in async builds — the bare
    // name collides and trips the Q7 await linter as a false
    // positive.  Renaming eliminates the collision class for this
    // file rather than allowlisting it.
    let readdirSync, readFileSync, pathJoin;
    try {
        ({ readdirSync, readFileSync } = await import('node:fs'));
        ({ join: pathJoin } = await import('node:path'));
    } catch {
        return;  // browser without manifest: no stubs (warned above)
    }
    if (!translatedDir) {
        const { fileURLToPath } = await import('node:url');
        const { dirname } = await import('node:path');
        translatedDir = pathJoin(dirname(dirname(fileURLToPath(import.meta.url))), 'translated');
    }

    // Phase 1: collect every name DECLARED in translator output
    // (exported functions, exported consts, imported names).
    const declared = new Set();
    let files;
    try { files = readdirSync(translatedDir).filter((f) => f.endsWith('.js')); }
    catch { return; }  // dir absent: harmless no-op
    for (const f of files) {
        const src = readFileSync(pathJoin(translatedDir, f), 'utf8');
        for (const m of src.matchAll(/(?:^|\n)export (?:async\s+)?function ([A-Za-z_][A-Za-z0-9_]*)/g)) declared.add(m[1]);
        for (const m of src.matchAll(/(?:^|\n)export const ([A-Za-z_][A-Za-z0-9_]*)/g)) declared.add(m[1]);
        for (const m of src.matchAll(/import\s*\{([^}]+)\}/g)) {
            for (const name of m[1].split(',').map(s => s.trim()).filter(s => s.length)) {
                // Strip "X as Y" syntax; both X and Y count as declared.
                const parts = name.split(/\s+as\s+/);
                for (const p of parts) declared.add(p);
            }
        }
    }

    // Phase 2: scan each file for `name(` patterns, identify ones
    // not declared and not reserved JS keywords, pre-install no-op
    // returning 0 on globalThis.
    for (const f of files) {
        const src = readFileSync(pathJoin(translatedDir, f), 'utf8');
        for (const m of src.matchAll(/(?<![\w$.])([a-z_][A-Za-z0-9_]*)\s*\(/g)) {
            const name = m[1];
            if (declared.has(name)) continue;
            if (RESERVED.has(name)) continue;
            if (typeof globalThis[name] !== 'undefined') continue;
            globalThis[name] = () => 0;
        }
    }
}
