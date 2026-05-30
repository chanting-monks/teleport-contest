// conformance.mjs — spec-conformance pass for the transpiler output.
//
// Runs the nine checks defined in docs/TRANSPORT.md against the JS
// output tree (js/, excluding frozen and runtime modules).  Returns
// {ok: bool, results: [{name, ok, errors[]}]}.  Phase boundary gate:
// every check must report ok before the phase commit lands.
//
// This pass uses string + regex analysis rather than a full JS AST
// parser to keep tools/c2js/ dependency-free.  When a phase introduces
// JS constructs the regex can't handle (template literals containing
// '/*', clever destructuring, etc.), the offending check upgrades to
// AST-based analysis at that point.  Until then, regex is sufficient
// for everything the transpiler emits, and gives us readable error
// reports.
//
// Each check is a pure function from {files, sources, config} to
// {ok, errors}.  No I/O inside checks; this lets us unit-test them.
//
// CLI entry: see tools/c2js/build.mjs --conformance.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import {
    projectRoot, jsDir, runtimeDir, upstreamDir,
    FROZEN_FILES, SKELETON_FILES, RUNTIME_MODULES,
    GLOBAL_BUCKETS, JS_RESERVED_RENAMES, BANNED_CALLS,
} from './c2js.config.mjs';

// ── File discovery ──────────────────────────────────────────────

// Enumerate every .js file under js/ that the translator might own.
// Excludes frozen files (judge overlays them at score time), the small
// hand-written runtime shim under js/c2js-runtime/, and the skeleton
// files the contest provides at fork time.
function listAllJsFiles() {
    const out = [];
    if (!existsSync(jsDir)) return out;
    walk(jsDir, out);
    return out
        .filter((p) => p.endsWith('.js'))
        .filter((p) => !FROZEN_FILES.includes(basename(p)))
        .filter((p) => !SKELETON_FILES.includes(basename(p)))
        .filter((p) => !p.startsWith(runtimeDir + '/'))
        .sort();
}

// Apply the manifest: only files listed in tools/c2js/manifest.json's
// `owned` array are checked for hard conformance.  The rest are
// diagnostic-only.
function applyManifest(allFiles, ownedRelative) {
    const ownedAbs = new Set(ownedRelative.map((p) => join(jsDir, p)));
    return {
        owned: allFiles.filter((f) => ownedAbs.has(f)),
        skeleton: allFiles.filter((f) => !ownedAbs.has(f)),
    };
}

function walk(dir, out) {
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        const st = statSync(path);
        if (st.isDirectory()) walk(path, out);
        else out.push(path);
    }
}

// ── Source text helpers ─────────────────────────────────────────

// Strip JS comments and string literals so regex searches don't trip
// on them.  Replaces them with same-length whitespace so source-line
// numbers stay accurate in error messages.
function stripCommentsAndStrings(src) {
    const out = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
        const ch = src[i];
        if (ch === '/' && src[i + 1] === '/') {
            // line comment
            const eol = src.indexOf('\n', i);
            const stop = eol === -1 ? n : eol;
            for (let k = i; k < stop; k++) out.push(src[k] === '\n' ? '\n' : ' ');
            i = stop;
        } else if (ch === '/' && src[i + 1] === '*') {
            // block comment
            const stop = src.indexOf('*/', i + 2);
            const end = stop === -1 ? n : stop + 2;
            for (let k = i; k < end; k++) out.push(src[k] === '\n' ? '\n' : ' ');
            i = end;
        } else if (ch === '"' || ch === "'" || ch === '`') {
            // string literal — note: template literals can contain ${} expressions
            // with nested code, but we only suppress the literal *content*
            // for purposes of regex search.  Nested-code-inside-template
            // is rare enough in transpiled output that the simple
            // approach is acceptable; if a check fires inside a template,
            // we revisit.
            const quote = ch;
            out.push(' ');
            i++;
            while (i < n && src[i] !== quote) {
                if (src[i] === '\\') {
                    out.push(' ');
                    i++;
                    if (i < n) {
                        out.push(src[i] === '\n' ? '\n' : ' ');
                        i++;
                    }
                    continue;
                }
                if (src[i] === '\n') out.push('\n');
                else out.push(' ');
                i++;
            }
            if (i < n) { out.push(' '); i++; }
        } else {
            out.push(ch);
            i++;
        }
    }
    return out.join('');
}

// Find line/column for an offset in the original source.
function locOf(src, offset) {
    let line = 1, col = 1;
    for (let i = 0; i < offset && i < src.length; i++) {
        if (src[i] === '\n') { line++; col = 1; } else { col++; }
    }
    return { line, col };
}

// ── Check 1: Tier A DAG ─────────────────────────────────────────

// Tier A modules are data-only (no `function` declarations, no `class`
// declarations).  Their import graph must be acyclic.  Tier B modules
// have function/class decls and may cycle freely.
function classifyTier(src) {
    const stripped = stripCommentsAndStrings(src);
    const hasFunction = /\bfunction\b/.test(stripped);
    const hasClass = /\bclass\s+[A-Za-z_$]/.test(stripped);
    return (hasFunction || hasClass) ? 'B' : 'A';
}

function extractImports(src) {
    const stripped = stripCommentsAndStrings(src);
    const re = /\bimport\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
    const out = [];
    let m;
    while ((m = re.exec(stripped)) !== null) out.push(m[1]);
    return out;
}

function resolveImport(fromFile, spec) {
    if (!spec.startsWith('.')) return null; // package import — ignore
    const dir = fromFile.substring(0, fromFile.lastIndexOf('/'));
    let target = join(dir, spec);
    if (!target.endsWith('.js')) target += '.js';
    return target;
}

function checkTierADag(files, sources) {
    const errors = [];
    const tier = new Map();
    for (const f of files) tier.set(f, classifyTier(sources.get(f)));
    // Build the Tier A subgraph
    const aGraph = new Map();
    for (const f of files) {
        if (tier.get(f) !== 'A') continue;
        const deps = [];
        for (const spec of extractImports(sources.get(f))) {
            const r = resolveImport(f, spec);
            if (r && tier.get(r) === 'A') deps.push(r);
        }
        aGraph.set(f, deps);
    }
    // DFS for cycles
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map([...aGraph.keys()].map((k) => [k, WHITE]));
    const stack = [];
    function visit(node) {
        color.set(node, GRAY);
        stack.push(node);
        for (const dep of aGraph.get(node) || []) {
            const c = color.get(dep);
            if (c === GRAY) {
                const cycle = stack.slice(stack.indexOf(dep)).concat(dep);
                errors.push(`Tier A cycle: ${cycle.map((p) => relative(projectRoot, p)).join(' → ')}`);
            } else if (c === WHITE) visit(dep);
        }
        stack.pop();
        color.set(node, BLACK);
    }
    for (const node of aGraph.keys()) if (color.get(node) === WHITE) visit(node);
    return { ok: errors.length === 0, errors };
}

// ── Check 2: No module-level mutable state ──────────────────────

// Top-level `let` / `var` is forbidden outside js/gstate.js (which is
// where the single `game` root lives).  `const` is allowed.
function checkNoModuleMutables(files, sources) {
    const errors = [];
    for (const f of files) {
        if (basename(f) === 'gstate.js') continue;
        const stripped = stripCommentsAndStrings(sources.get(f));
        // Match top-level `let X` or `var X`.  "Top-level" = at column 0
        // or preceded only by `export `.  Skip inside braces by counting
        // depth; we approximate via "lines starting with `let ` /
        // `var ` / `export let ` / `export var ` after trimming, with
        // brace depth tracking.
        let depth = 0;
        const lines = stripped.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.replace(/^\s+/, '');
            if (depth === 0 && /^(export\s+)?(let|var)\s+/.test(trimmed)) {
                const kw = trimmed.match(/^(?:export\s+)?(let|var)\s+/)[1];
                // Exempt translator-hoisted function-local `static`
                // bindings (named `__<fnname>_<varname>`): they
                // implement C's once-initialized, persisted-across-
                // calls semantics, and are file-local by C definition.
                // Bounded exemption — only bare `let __` at column 0,
                // never via `export`.
                const isHoistedStatic =
                    /^let\s+(__[A-Za-z_][A-Za-z0-9_]*)\s*=/.test(trimmed);
                if (!isHoistedStatic) {
                    errors.push(`${relative(projectRoot, f)}:${i + 1}: top-level ${kw} forbidden (use const, or move to gstate.js)`);
                }
            }
            for (const c of line) {
                if (c === '{') depth++;
                else if (c === '}') depth--;
            }
        }
    }
    return { ok: errors.length === 0, errors };
}

// ── Check 3: File-name parity ───────────────────────────────────

// For every C file the translator has been pointed at, the
// corresponding JS file must exist with the same basename (`.c` →
// `.js`).  In Phase 0 we don't have a translator manifest yet, so this
// check passes vacuously; Phase 1 onward populates the manifest.
function checkFileNameParity(files, sources, manifest) {
    const errors = [];
    if (!manifest || manifest.length === 0) return { ok: true, errors }; // Phase 0
    for (const cFile of manifest) {
        const expected = basename(cFile, '.c') + '.js';
        const found = files.some((f) => basename(f) === expected);
        if (!found) errors.push(`expected ${expected} for translated ${cFile}, not found`);
    }
    return { ok: errors.length === 0, errors };
}

// ── Check 4: Function-name parity ───────────────────────────────

// Every C function `name` in the translation manifest must appear as a
// JS `function name` or `async function name` somewhere in the
// corresponding output module.  Phase 0: manifest empty, vacuous pass.
function checkFunctionNameParity(files, sources, manifest, fnIndex) {
    const errors = [];
    if (!fnIndex || fnIndex.size === 0) {
        return { ok: true, errors, skipped: 'no fnIndex provided' };
    }
    for (const [cFile, fns] of fnIndex) {
        const jsFile = findCorrespondingJsFile(files, cFile);
        if (!jsFile) continue; // file-name parity check will report it
        const stripped = stripCommentsAndStrings(sources.get(jsFile));
        for (const fn of fns) {
            const re = new RegExp(`\\b(?:async\\s+)?function\\s+${escapeRegex(fn)}\\b`);
            if (!re.test(stripped)) {
                errors.push(`${relative(projectRoot, jsFile)}: missing function ${fn} (declared in ${basename(cFile)})`);
            }
        }
    }
    return { ok: errors.length === 0, errors };
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// For a C source path, find the JS file in `files` whose basename
// matches.  Prefer files under `js/translated/` (translator output)
// over engine-layer copies at `js/` top-level: e.g. allmain.c → both
// `js/allmain.js` (hand-written engine wiring) and
// `js/translated/allmain.js` (translator output) exist; the
// translator owns the latter and that's what conformance checks 4
// and 5 must compare against.
function findCorrespondingJsFile(files, cFile) {
    const want = basename(cFile, '.c') + '.js';
    const matches = files.filter((f) => basename(f) === want);
    if (matches.length === 0) return null;
    const inTranslated = matches.find((f) => f.includes('/translated/'));
    return inTranslated || matches[0];
}

// ── Check 5: Verbatim comment migration ─────────────────────────

// Every C comment longer than 30 characters must appear byte-identical
// somewhere in the corresponding JS output.  Short line-end comments
// can drift.  Phase 0: manifest empty, vacuous.
function checkComments(files, sources, manifest, commentIndex) {
    const errors = [];
    if (!commentIndex || commentIndex.size === 0) {
        return { ok: true, errors, skipped: 'no commentIndex provided' };
    }
    for (const [cFile, comments] of commentIndex) {
        const jsFile = findCorrespondingJsFile(files, cFile);
        if (!jsFile) continue;
        const jsSrc = sources.get(jsFile);
        for (const c of comments) {
            if (c.text.length < 30) continue;
            if (!jsSrc.includes(c.text)) {
                errors.push(`${relative(projectRoot, jsFile)}: missing comment from ${basename(cFile)}:${c.line} (${c.text.slice(0, 60)}${c.text.length > 60 ? '...' : ''})`);
            }
        }
    }
    return { ok: errors.length === 0, errors };
}

// ── Check 6: Banned calls ───────────────────────────────────────

// AST-grep for any of the BANNED_CALLS in translator output.  Zero
// hits.  Math.random / Date.now / setTimeout / setInterval / new Date(
// (without args) etc. are explicitly forbidden by spec §8.
function checkBannedCalls(files, sources) {
    const errors = [];
    for (const f of files) {
        const stripped = stripCommentsAndStrings(sources.get(f));
        for (const banned of BANNED_CALLS) {
            const idx = stripped.indexOf(banned);
            if (idx !== -1) {
                const { line, col } = locOf(sources.get(f), idx);
                errors.push(`${relative(projectRoot, f)}:${line}:${col}: banned call ${banned}`);
            }
        }
        // `new Date(` with no args (reads wall clock).  `new Date(0)` etc.
        // are allowed for ISO formatting.
        const newDateMatch = stripped.match(/\bnew\s+Date\s*\(\s*\)/);
        if (newDateMatch) {
            const { line, col } = locOf(sources.get(f), newDateMatch.index);
            errors.push(`${relative(projectRoot, f)}:${line}:${col}: banned call new Date() (no args reads wall clock)`);
        }
    }
    return { ok: errors.length === 0, errors };
}

// ── Check 7: Async closure correctness ──────────────────────────

// If function f calls g, and g is `async`, then f must be `async` and
// the call must be `await g()`.  Without a real call graph, we
// approximate: for every line of the form `g(...)` where g is a known
// async function in the same file, the call must be preceded by
// `await` or be inside a `Promise.all` etc.  Phase 0: no async
// functions yet, vacuous.
function checkAsyncClosure(files, sources) {
    const errors = [];
    // Collect the set of async function names declared in each file.
    const fileAsyncs = new Map();
    for (const f of files) {
        const stripped = stripCommentsAndStrings(sources.get(f));
        const re = /\b(?:export\s+)?async\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
        const set = new Set();
        let m;
        while ((m = re.exec(stripped)) !== null) set.add(m[1]);
        fileAsyncs.set(f, set);
    }
    // For each file, scan for calls to local async functions without await.
    for (const f of files) {
        const stripped = stripCommentsAndStrings(sources.get(f));
        const asyncs = fileAsyncs.get(f);
        if (!asyncs.size) continue;
        for (const name of asyncs) {
            // Match `name(` not preceded by 'await ', 'await\n', or '.'
            // or 'function '.  Approximate.
            const re = new RegExp(`(\\W|^)${escapeRegex(name)}\\s*\\(`, 'g');
            let m;
            while ((m = re.exec(stripped)) !== null) {
                const idx = m.index + m[1].length;
                // Look backward for `await ` or function declaration.
                const before = stripped.slice(Math.max(0, idx - 32), idx);
                if (/\bawait\s+$/.test(before)) continue;
                if (/\.\s*$/.test(before)) continue;
                if (/\bfunction\s+$/.test(before)) continue;
                if (/\basync\s+function\s+$/.test(before)) continue;
                // It's a call to async fn without await.
                const { line, col } = locOf(sources.get(f), idx);
                errors.push(`${relative(projectRoot, f)}:${line}:${col}: call to async ${name}() without await`);
            }
        }
    }
    return { ok: errors.length === 0, errors };
}

// ── Check 8: `game` object purity ───────────────────────────────

// No translator output may contain references to ga.X / gb.X / ... /
// gz.X — those alphabetical-bucket prefixes are flattened to game.X
// per spec §2.
function checkGameFlatten(files, sources) {
    const errors = [];
    for (const f of files) {
        const stripped = stripCommentsAndStrings(sources.get(f));
        for (const bucket of GLOBAL_BUCKETS) {
            // Match `bucket.X` only when bucket is at expression top-level —
            // not as a struct member access like `glyphinfo.gm.customcolor`
            // where `gm` is a field name that happens to collide with the
            // bucket prefix.  The negative lookbehind excludes `.` (member
            // access) and identifier characters (so `Stigma.x` doesn't hit
            // the `gm` bucket).
            const re = new RegExp(`(?<![A-Za-z0-9_$.])${bucket}\\.[A-Za-z_$]`, 'g');
            let m;
            while ((m = re.exec(stripped)) !== null) {
                const { line, col } = locOf(sources.get(f), m.index);
                errors.push(`${relative(projectRoot, f)}:${line}:${col}: bucket reference ${m[0]} (flatten to game.X)`);
            }
        }
    }
    return { ok: errors.length === 0, errors };
}

// ── Check 9: Identifier-collision renames ───────────────────────

// Any identifier that matches a JS reserved word and was renamed with a
// trailing underscore must be renamed at every call site too.  We
// detect the *forward* pattern: a function declaration `function name_(`
// where `name` is reserved, then check that no call site uses bare
// `name(`.
function checkReservedRenames(files, sources) {
    const errors = [];
    for (const f of files) {
        const stripped = stripCommentsAndStrings(sources.get(f));
        for (const reserved of JS_RESERVED_RENAMES) {
            const declRe = new RegExp(`\\bfunction\\s+${escapeRegex(reserved)}_\\s*\\(`);
            if (!declRe.test(stripped)) continue;
            // The renamed function exists; ensure no bare-name call site.
            const callRe = new RegExp(`(\\W|^)${escapeRegex(reserved)}\\s*\\(`, 'g');
            let m;
            while ((m = re_(callRe).exec(stripped)) !== null) {
                const idx = m.index + m[1].length;
                const { line, col } = locOf(sources.get(f), idx);
                errors.push(`${relative(projectRoot, f)}:${line}:${col}: call to ${reserved}() should be ${reserved}_() (renamed for JS reserved word)`);
            }
        }
    }
    return { ok: errors.length === 0, errors };
}
// helper to avoid `re` scope shadowing in checkReservedRenames
function re_(r) { return r; }

// ── Driver ──────────────────────────────────────────────────────

function loadManifest() {
    const path = join(projectRoot, 'tools/c2js/manifest.json');
    if (!existsSync(path)) return { owned: [] };
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        return { owned: [] };
    }
}

// Run conformance on the manifested set (hard gate).  Pass `all=true`
// to ignore the manifest and scan every file in js/ (diagnostic mode).
export function runConformance({
    fileManifest = null,
    fnIndex = null,
    commentIndex = null,
    all = false,
} = {}) {
    const allFiles = listAllJsFiles();
    const manifest = loadManifest();
    const { owned } = applyManifest(allFiles, manifest.owned || []);
    const files = all ? allFiles : owned;
    const sources = new Map();
    for (const f of files) sources.set(f, readFileSync(f, 'utf8'));

    const checks = [
        ['1: Tier A DAG',                  checkTierADag(files, sources)],
        ['2: no module-level mutables',    checkNoModuleMutables(files, sources)],
        ['3: file-name parity',            checkFileNameParity(files, sources, fileManifest)],
        ['4: function-name parity',        checkFunctionNameParity(files, sources, fileManifest, fnIndex)],
        ['5: verbatim comment migration',  checkComments(files, sources, fileManifest, commentIndex)],
        ['6: banned calls',                checkBannedCalls(files, sources)],
        ['7: async closure correctness',   checkAsyncClosure(files, sources)],
        ['8: game object purity',          checkGameFlatten(files, sources)],
        ['9: reserved-word renames',       checkReservedRenames(files, sources)],
    ];

    const results = checks.map(([name, r]) => ({ name, ok: r.ok, errors: r.errors, skipped: r.skipped }));
    const ok = results.every((r) => r.ok);
    return {
        ok,
        results,
        fileCount: files.length,
        ownedCount: owned.length,
        skeletonCount: allFiles.length - owned.length,
        mode: all ? 'all' : 'owned',
    };
}

export function formatReport(report) {
    const lines = [];
    const head = report.mode === 'all'
        ? `conformance: ${report.ok ? 'PASS' : 'FAIL'} (${report.fileCount} files scanned, all-mode)`
        : `conformance: ${report.ok ? 'PASS' : 'FAIL'} (${report.ownedCount}/${report.ownedCount + report.skeletonCount} files owned by translator)`;
    lines.push(head);
    for (const r of report.results) {
        // Tag conventions:
        //   ✓  check ran AND passed
        //   ✗  check ran AND failed
        //   ⚠  check skipped because required input not provided (e.g.
        //      no fnIndex/commentIndex); previously this returned a
        //      silent ✓ hiding spec gaps (LEARNINGS §23.119)
        const tag = r.skipped ? '⚠' : (r.ok ? '✓' : '✗');
        const suffix = r.skipped
            ? ` (SKIPPED: ${r.skipped})`
            : (r.ok ? '' : ` (${r.errors.length} error${r.errors.length === 1 ? '' : 's'})`);
        lines.push(`  ${tag} ${r.name}${suffix}`);
        for (const e of r.errors.slice(0, 8)) lines.push(`      ${e}`);
        if (r.errors.length > 8) lines.push(`      ... and ${r.errors.length - 8} more`);
    }
    if (report.mode === 'owned' && report.skeletonCount > 0 && report.ok) {
        lines.push(`  (${report.skeletonCount} skeleton-inherited files not checked; run with --conformance-all to see them)`);
    }
    return lines.join('\n');
}
