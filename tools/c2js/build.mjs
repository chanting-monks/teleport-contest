#!/usr/bin/env node
// build.mjs — CLI dispatcher for the c2js transpiler.
//
// Usage:
//   node tools/c2js/build.mjs --conformance     # run the spec-conformance pass
//   node tools/c2js/build.mjs --self-test       # run the translator's tests
//   node tools/c2js/build.mjs --print-config    # dump paths + chosen platform defines
//   node tools/c2js/build.mjs --help
//
// Phase 0: only --conformance, --self-test, --print-config are wired up.
// Later phases add --prepare, --parse, --translate-file, --translate-tu,
// --translate-all as the corresponding capabilities land.

import { runConformance, formatReport } from './conformance.mjs';
import { runSelfTests } from './tests/run.mjs';
import { parseCFile, extractComments } from './parser.mjs';
import { translateUnit } from './translate.mjs';
import { buildTree } from './build-tree.mjs';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as config from './c2js.config.mjs';

// Build the per-C-file function-name set + comment list that the
// conformance pass uses for checks 4 (function-name parity) and 5
// (verbatim comment migration).  Without these indexes both checks
// early-return ok=true vacuously — silent gaps in the spec gate.
//
// fnIndex:      Map<cFilePath, Set<funcName>> — every C-source
//               function definition (FunctionDecl with a body)
//               that the translator owns.  Forward-decl-only
//               headers excluded (no body → no JS counterpart).
// commentIndex: Map<cFilePath, Comment[]> — every comment > 30
//               chars, via the same `extractComments` the
//               translator uses for verbatim copy.
//
// Sources: every `.c` file under `nethack-c/upstream/src/` whose
// basename matches a translated `.js` file under `js/translated/`.
// Untranslated TUs (save/restore/Lua bridge per Phase 9) are
// skipped — they don't need parity checks yet.
function buildConformanceIndexes() {
    const fnIndex = new Map();
    const commentIndex = new Map();
    const srcDir = join(config.upstreamDir, 'src');
    const translatedDir = join(config.jsDir, 'translated');
    const translatedBases = new Set();
    try {
        for (const f of readdirSync(translatedDir)) {
            if (f.endsWith('.js')) translatedBases.add(f.slice(0, -3));
        }
    } catch { return { fnIndex, commentIndex }; }
    for (const f of readdirSync(srcDir)) {
        if (!f.endsWith('.c')) continue;
        const base = f.slice(0, -2);
        if (!translatedBases.has(base)) continue;
        const cFile = join(srcDir, f);
        let parsed;
        try {
            parsed = parseCFile(cFile, { extraFlags: extraFlagsFor(cFile) });
        } catch { continue; } // skip unparseable files (e.g. missing headers)
        const fns = new Set();
        for (const d of parsed.decls || []) {
            if (d.kind !== 'FunctionDecl' || !d.name) continue;
            // Only count definitions (have a body), not forward decls.
            const hasBody = (d.inner || []).some((c) => c?.kind === 'CompoundStmt');
            if (hasBody) fns.add(d.name);
        }
        fnIndex.set(cFile, fns);
        commentIndex.set(cFile, parsed.comments || []);
    }
    return { fnIndex, commentIndex };
}

function usage() {
    console.log(`Usage:
  node tools/c2js/build.mjs --conformance       # check manifested files (gate)
  node tools/c2js/build.mjs --conformance-all   # check entire js/ tree (diagnostic)
  node tools/c2js/build.mjs --self-test
  node tools/c2js/build.mjs --print-config
  node tools/c2js/build.mjs --help

Phase 0: scaffolding only.  --conformance and --self-test are the
deliverable gates.  Later phases add --translate-* commands as the
translator capabilities land.

The conformance pass implements docs/TRANSPORT.md's nine checks and
exits non-zero on any failure.  Manifested files are listed in
tools/c2js/manifest.json's "owned" array.  --conformance-all also
scans skeleton-inherited files for diagnostic visibility.

--self-test runs the synthetic round-trip tests under tools/c2js/tests/.
`);
}

function printConfig() {
    const out = {
        projectRoot:           config.projectRoot,
        upstreamDir:           config.upstreamDir,
        patchDir:              config.patchDir,
        cacheRoot:             config.cacheRoot,
        preparedSourceDir:     config.preparedSourceDir,
        jsDir:                 config.jsDir,
        runtimeDir:            config.runtimeDir,
        testsDir:              config.testsDir,
        FROZEN_FILES:          config.FROZEN_FILES,
        SKELETON_FILES:        config.SKELETON_FILES,
        RUNTIME_MODULES:       config.RUNTIME_MODULES,
        GLOBAL_BUCKETS:        config.GLOBAL_BUCKETS,
        DETERMINISTIC_PATCHES: config.DETERMINISTIC_PATCHES,
        PLATFORM_DEFINES:      config.PLATFORM_DEFINES,
    };
    console.log(JSON.stringify(out, null, 2));
}

// Invoke both bundle-staleness checkers; print each result line and
// return overall ok.  Used by --check-bundles (gates) and
// --conformance (soft adjunct).
async function runBundleStalenessCheck() {
    const { runCheck: checkDat } = await import('./build-dat-bundle.mjs');
    const { runCheck: checkRumors } = await import('./build-rumors-bundle.mjs');
    const datResult = checkDat();
    const rumorsResult = checkRumors();
    console.log(datResult.message);
    console.log(rumorsResult.message);
    return datResult.ok && rumorsResult.ok;
}

async function main() {
    const args = new Set(process.argv.slice(2));
    if (args.has('--help') || args.size === 0) {
        usage();
        return;
    }
    if (args.has('--print-config')) {
        printConfig();
        return;
    }
    if (args.has('--check-bundles')) {
        // Stand-alone bundle-staleness gate: invokes both bundlers
        // in --check mode (build-dat-bundle.mjs + build-rumors-bundle.mjs)
        // and exits non-zero if either tracked bundle differs from a
        // fresh build.  Suitable for CI / pre-commit.  See §23.203 for
        // why these bundles exist (runtime fs-independence for the
        // chanting-monks scoring env).
        const ok = await runBundleStalenessCheck();
        process.exit(ok ? 0 : 1);
    }
    if (args.has('--conformance')) {
        const { fnIndex, commentIndex } = buildConformanceIndexes();
        const report = runConformance({ all: false, fnIndex, commentIndex });
        console.log(formatReport(report));
        // Bundle-staleness is a soft adjunct check (does not gate
        // conformance pass/fail) — surfaced because a stale bundle
        // is exactly the class of bug §23.202 / §23.203 trace back
        // to: invisible drift between dat/*.lua sources and the
        // shipped runtime artefact.
        const bundlesOk = await runBundleStalenessCheck();
        if (!bundlesOk) {
            console.log('(adjunct) one or more bundles are stale — see --check-bundles');
        }
        process.exit(report.ok ? 0 : 1);
    }
    if (args.has('--conformance-all')) {
        const { fnIndex, commentIndex } = buildConformanceIndexes();
        const report = runConformance({ all: true, fnIndex, commentIndex });
        console.log(formatReport(report));
        // Diagnostic mode: report findings but always exit 0; this is
        // for visibility into the skeleton's inherited spec violations,
        // not a gate.
        process.exit(0);
    }
    if (args.has('--self-test')) {
        const report = await runSelfTests({
            translateFn: translateCFile,
            buildTreeFn: buildTreeWithFlags,
        });
        console.log(report.summary);
        // Also run Lua transpilation snapshot tests, gated under
        // tools/c2js/tests/lua/.  Each test pins the rendered JS for
        // a real snippet from nethack-c/upstream/dat/*.lua so future
        // translator changes can't silently regress real patterns.
        const { runLuaTests } = await import('./tests/run-lua.mjs');
        const lr = await runLuaTests({});
        const luaTotal = lr.pass + lr.fail;
        console.log(`lua tests: ${lr.pass}/${luaTotal} passed`);
        for (const f of lr.failures) {
            console.log(`  FAIL ${f.name} [${f.kind}]`);
            if (f.error) console.log(`    ${f.error}`);
        }
        process.exit((report.ok && lr.fail === 0) ? 0 : 1);
    }
    // --translate-file <c-source> <out-js>
    const argv = process.argv.slice(2);
    const tIdx = argv.indexOf('--translate-file');
    if (tIdx !== -1 && argv.length >= tIdx + 3) {
        const cPath = argv[tIdx + 1];
        const outPath = argv[tIdx + 2];
        translateCFile(cPath, outPath);
        console.log(`translated ${cPath} -> ${outPath}`);
        return;
    }
    // --translate-tree <out-dir> <c-source...>
    const ttIdx = argv.indexOf('--translate-tree');
    if (ttIdx !== -1 && argv.length >= ttIdx + 3) {
        const outDir = argv[ttIdx + 1];
        const sources = argv.slice(ttIdx + 2);
        const outputs = buildTreeWithFlags({ sources, outputDir: outDir });
        console.log(`translated ${sources.length} source(s) into ${outDir}:`);
        for (const o of outputs) console.log(`  ${o}`);
        return;
    }
    usage();
    process.exit(2);
}

// Single-file translation entry — used by tests and for early phases.
// Reads cPath, produces JS, writes to outPath.  Not a full
// configure/preprocess pipeline yet; that lands in Phase 5+ when we
// point the translator at real NetHack source.
function translateCFile(cPath, outPath) {
    const parsed = parseCFile(cPath, { extraFlags: extraFlagsFor(cPath) });
    const js = translateUnit({ ...parsed, opts: { outputPath: outPath } });
    writeFileSync(outPath, js);
    return outPath;
}

// Wrapper around buildTree that picks the right clang flags for any
// .c source under nethack-c/upstream (include paths + platform defines).
function buildTreeWithFlags({ sources, outputDir }) {
    const anyUpstream = sources.some((p) => p.includes('nethack-c/upstream/'));
    const parserOpts = {};
    if (anyUpstream) parserOpts.extraFlags = extraFlagsFor(sources[0]);
    return buildTree({ sources, outputDir, parserOpts });
}

function extraFlagsFor(cPath) {
    if (!cPath.includes('nethack-c/upstream/')) return [];
    return [
        `-I${config.upstreamDir}/include`,
        `-I${config.stubsDir}`,
        ...config.PLATFORM_DEFINES,
    ];
}

main().catch((err) => {
    console.error(`c2js: ${err.stack || err.message}`);
    process.exit(1);
});
