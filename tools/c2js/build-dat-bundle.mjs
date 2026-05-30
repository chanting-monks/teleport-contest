#!/usr/bin/env node
// build-dat-bundle.mjs — precompile every nethack-c/upstream/dat/*.lua
// into one readable JS module per source file under
// `js/c2js-runtime/dat/` + a small `_index.js` that re-exports
// the registry the runtime consumes.  No `.lua` files needed at
// runtime — see LEARNINGS §23.202 / §23.203.
//
// Output layout:
//
//   js/c2js-runtime/dat/
//     dungeon.js                 // category: data  (parsed JSON-safe value)
//     nhthemes.js                //   "
//     bigrm-1.js                 // category: templatic (flat call sequence)
//     bigrm-2.js                 //   "
//     ...
//     themerms.js                // category: jsmodule (full transpiled module)
//     nhcore.js                  //   "
//     ...
//     _index.js                  // imports all 131 + exports DAT_BUNDLE
//
// `_index.js`'s DAT_BUNDLE shape matches what lua-bootstrap.js used
// to consume from the old monolithic `dat-bundle.js`:
//   { data: { 'dungeon.lua': obj, ... },
//     templatic: { 'bigrm-1.lua': [...], ... },
//     jsmodule: { 'themerms.lua': asyncFn, ... } }
//
// Why split: a single 634KB module is opaque — hard to diff, hard
// to git-blame, hard to read.  Per-file modules restore everything
// you get from a normal source tree.
//
// Usage:
//   node tools/c2js/build-dat-bundle.mjs           # build
//   node tools/c2js/build-dat-bundle.mjs --check   # CI staleness gate

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLuaData } from './lua-data.mjs';
import { parseTemplaticLua, renderJsCalls } from './lua-templatic.mjs';

const __thisFile = fileURLToPath(import.meta.url);
const __thisDir = dirname(__thisFile);
const repoRoot = dirname(dirname(__thisDir));
const LUA_DIR = join(repoRoot, 'nethack-c/upstream/dat');
const OUT_DIR = join(repoRoot, 'js/c2js-runtime/dat');

const LEGACY_NAMESPACES = new Set(['des', 'selection', 'monster', 'obj', 'feature']);
function isLegacySafeSubset(ast) {
    for (const stmt of ast.body) {
        if (stmt.kind !== 'exprstmt') return false;
        const e = stmt.expr;
        if (!e || e.kind !== 'call') return false;
        const cb = e.callee;
        if (!cb || cb.kind !== 'field' || cb.target?.kind !== 'ident') return false;
        if (!LEGACY_NAMESPACES.has(cb.target.name)) return false;
    }
    return true;
}

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
        const cb = expr.callee;
        if (cb?.kind === 'field' && cb.target?.kind === 'ident') {
            return { __call: `${cb.target.name}.${cb.name}`, args: expr.args.map(astArgToValue) };
        }
        return null;
    }
    case 'unop':
        if (expr.op === '-') {
            const v = astArgToValue(expr.operand);
            if (typeof v === 'number') return -v;
        }
        return null;
    case 'ident':  return { __ident: expr.name };
    default: return null;
    }
}

// "bigrm-1.lua" → "bigrm-1.js"
function stemFromLua(name) {
    return name.replace(/\.lua$/, '') + '.js';
}
// "bigrm-1.lua" → "bigrm_1" (JS-identifier-safe import alias)
function importAlias(name) {
    return name.replace(/\.lua$/, '').replace(/-/g, '_');
}

function fileHeader(name, category) {
    return [
        `// ${stemFromLua(name)} — AUTO-GENERATED from`,
        `// nethack-c/upstream/dat/${name}.  Do NOT edit by hand.`,
        `// Regenerate via tools/c2js/build-dat-bundle.mjs.`,
        `// Category: ${category}.`,
        '',
    ].join('\n');
}

function dataFileContent(entry) {
    return fileHeader(entry.name, 'data') +
        `export default ${JSON.stringify(entry.value, null, 2)};\n`;
}

function templaticFileContent(entry) {
    return fileHeader(entry.name, 'templatic') +
        `export default ${JSON.stringify(entry.calls, null, 2)};\n`;
}

function jsmoduleFileContent(entry) {
    // Renderer emits `export default async function({...}) {...}` —
    // already a valid ES module.  Just prepend our header.
    return fileHeader(entry.name, 'jsmodule') + entry.jsCode + '\n';
}

function indexContent(buckets) {
    const lines = [];
    lines.push('// _index.js — AUTO-GENERATED by tools/c2js/build-dat-bundle.mjs.');
    lines.push('// Imports each per-file module and re-exposes them keyed by the');
    lines.push('// original Lua filename so lua-bootstrap.js can wire them into');
    lines.push('// nhl_loadlua\'s registry.');
    lines.push('');

    const allEntries = [
        ...buckets.data.map(e => ({ ...e, bucket: 'data' })),
        ...buckets.templatic.map(e => ({ ...e, bucket: 'templatic' })),
        ...buckets.jsmodule.map(e => ({ ...e, bucket: 'jsmodule' })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    for (const e of allEntries) {
        lines.push(`import ${importAlias(e.name)} from './${stemFromLua(e.name)}';`);
    }
    lines.push('');
    lines.push('export const DAT_BUNDLE = {');
    for (const bucket of ['data', 'templatic', 'jsmodule']) {
        lines.push(`  ${bucket}: {`);
        for (const e of buckets[bucket]) {
            lines.push(`    ${JSON.stringify(e.name)}: ${importAlias(e.name)},`);
        }
        lines.push('  },');
    }
    lines.push('};');
    lines.push('');
    return lines.join('\n');
}

function classify() {
    const names = readdirSync(LUA_DIR).filter(f => f.endsWith('.lua')).sort();
    const buckets = { data: [], templatic: [], jsmodule: [], skipped: [] };
    for (const name of names) {
        const src = readFileSync(join(LUA_DIR, name), 'utf8');
        try {
            buckets.data.push({ name, value: parseLuaData(src) });
            continue;
        } catch {}
        let ast;
        try { ast = parseTemplaticLua(src); }
        catch (e) {
            buckets.skipped.push({ name, reason: 'parse: ' + e.message.slice(0, 100) });
            continue;
        }
        if (isLegacySafeSubset(ast)) {
            buckets.templatic.push({ name, calls: astToLegacyCalls(ast) });
            continue;
        }
        try {
            buckets.jsmodule.push({ name, jsCode: renderJsCalls(ast) });
        } catch (e) {
            buckets.skipped.push({ name, reason: 'render: ' + e.message.slice(0, 100) });
        }
    }
    return buckets;
}

function planFiles(buckets) {
    const plan = new Map(); // relPath → content string
    for (const e of buckets.data)       plan.set(stemFromLua(e.name), dataFileContent(e));
    for (const e of buckets.templatic)  plan.set(stemFromLua(e.name), templaticFileContent(e));
    for (const e of buckets.jsmodule)   plan.set(stemFromLua(e.name), jsmoduleFileContent(e));
    plan.set('_index.js', indexContent(buckets));
    return plan;
}

function listExistingFiles() {
    if (!existsSync(OUT_DIR)) return new Set();
    return new Set(readdirSync(OUT_DIR).filter(f => f.endsWith('.js')));
}

export function runCheck() {
    const buckets = classify();
    if (buckets.skipped.length) {
        return { ok: false, message: `dat-bundle build would skip ${buckets.skipped.length} file(s); run build-dat-bundle.mjs` };
    }
    const plan = planFiles(buckets);
    const existing = listExistingFiles();
    // Missing files
    for (const path of plan.keys()) {
        if (!existing.has(path)) {
            return { ok: false, message: `dat-bundle: missing ${join('dat', path)}; run build-dat-bundle.mjs` };
        }
    }
    // Extra files
    for (const f of existing) {
        if (!plan.has(f)) {
            return { ok: false, message: `dat-bundle: stale extra file ${join('dat', f)}; run build-dat-bundle.mjs` };
        }
    }
    // Content drift
    for (const [path, content] of plan) {
        const onDisk = readFileSync(join(OUT_DIR, path), 'utf8');
        if (onDisk !== content) {
            return { ok: false, message: `dat-bundle: stale content in ${join('dat', path)}; run build-dat-bundle.mjs` };
        }
    }
    const total = plan.size;
    return { ok: true, message: `dat-bundle: ${total} files up to date (${buckets.data.length} data + ${buckets.templatic.length} templatic + ${buckets.jsmodule.length} jsmodule + 1 index)` };
}

function main() {
    const args = process.argv.slice(2);
    const check = args.includes('--check');
    if (check) {
        const r = runCheck();
        console.error(r.message);
        process.exit(r.ok ? 0 : 1);
    }
    const buckets = classify();
    const plan = planFiles(buckets);

    // Ensure output dir; remove stale files not in plan.
    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
    const existing = listExistingFiles();
    for (const f of existing) {
        if (!plan.has(f)) {
            rmSync(join(OUT_DIR, f));
        }
    }
    let bytes = 0;
    for (const [path, content] of plan) {
        writeFileSync(join(OUT_DIR, path), content);
        bytes += content.length;
    }
    console.log(`wrote ${plan.size} files to ${OUT_DIR}/`);
    console.log(`  data:       ${buckets.data.length}`);
    console.log(`  templatic:  ${buckets.templatic.length}`);
    console.log(`  jsmodule:   ${buckets.jsmodule.length}`);
    console.log(`  total bytes: ${bytes}`);
    if (buckets.skipped.length) {
        console.log(`  SKIPPED:    ${buckets.skipped.length}`);
        for (const s of buckets.skipped) console.log(`    ${s.name}: ${s.reason}`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
