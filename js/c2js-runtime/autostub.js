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

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const RESERVED = new Set([
    'if', 'for', 'while', 'switch', 'return', 'function',
    'typeof', 'new', 'do', 'catch', 'else', 'case',
    'continue', 'break', 'throw', 'await', 'async',
    'let', 'const', 'var', 'in', 'of', 'try', 'finally',
    'instanceof', 'void', 'delete', 'this', 'super',
]);

let _installed = false;

export function installAutoStubs(translatedDir) {
    if (_installed) return;
    _installed = true;

    // Phase 1: collect every name DECLARED in translator output
    // (exported functions, exported consts, imported names).
    const declared = new Set();
    let files;
    try { files = readdirSync(translatedDir).filter((f) => f.endsWith('.js')); }
    catch { return; }  // dir absent: harmless no-op
    for (const f of files) {
        const src = readFileSync(join(translatedDir, f), 'utf8');
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
        const src = readFileSync(join(translatedDir, f), 'utf8');
        for (const m of src.matchAll(/(?<![\w$.])([a-z_][A-Za-z0-9_]*)\s*\(/g)) {
            const name = m[1];
            if (declared.has(name)) continue;
            if (RESERVED.has(name)) continue;
            if (typeof globalThis[name] !== 'undefined') continue;
            globalThis[name] = () => 0;
        }
    }
}
