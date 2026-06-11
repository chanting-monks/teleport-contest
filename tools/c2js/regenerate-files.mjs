#!/usr/bin/env node
// regenerate-files.mjs — per-file regeneration through the full
// translator+comment-injection pipeline.
//
// Why: build-engine.mjs runs the entire build at once.  Running it
// when ANY load-bearing hand-patch exists in production silently
// regresses sessions (observed during cycle 1: full build broke
// seed8000 with 0/0 RNG because some non-clean file's patch was
// clobbered).  We need a way to regenerate ONLY a verified-safe
// file (a structurally-clean file with no patchFile entries in
// build-engine.mjs) so the other production files stay untouched.
//
// What it does:
//   1. Verifies each target file appears in tools/c2js/manifest.json's
//      "owned" list and has a corresponding C source.
//   2. Runs --translate-tree on the FULL owned set (so cross-TU
//      resolution matches production).
//   3. Reads the resulting __pending_inside_comments.json sidecar
//      and applies the inside-body comment injections that target
//      the requested files (§23.122 logic, ported here).
//   4. Verifies each regenerated file produces seed8000 PASS in
//      isolation before committing it to production.  If ANY file
//      regresses, restores production from git and exits non-zero.
//   5. The user is responsible for `git add` + commit; this script
//      intentionally does NOT auto-commit so the change is reviewed.
//
// Usage:
//   node tools/c2js/regenerate-files.mjs translated/drawing.js
//   node tools/c2js/regenerate-files.mjs translated/monst.js translated/rect.js
//   node tools/c2js/regenerate-files.mjs --dry-run translated/drawing.js
//     (just diff against production; don't modify or test)
//
// NOT for files that build-engine.mjs has patchFile entries for —
// those need the patches reapplied, which this script doesn't do.
// Check the script's own warning before using on a patched file.

import { readFileSync, writeFileSync, existsSync, mkdtempSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __thisFile = fileURLToPath(import.meta.url);
const __thisDir = dirname(__thisFile);
const ROOT = dirname(dirname(__thisDir));
const MANIFEST = join(ROOT, 'tools/c2js/manifest.json');
const TRANSLATED_DIR = join(ROOT, 'js/translated');
const SRC_DIR = join(ROOT, 'nethack-c/upstream/src');
const BUILD_ENGINE = join(ROOT, 'tools/c2js/build-engine.mjs');

function usage(code = 2) {
    console.error('Usage: node tools/c2js/regenerate-files.mjs [--dry-run] <translated/FILE.js>...');
    process.exit(code);
}

function parseArgs() {
    const opts = { dryRun: false, keepTmp: false, forcePatched: false, files: [] };
    for (const a of process.argv.slice(2)) {
        if (a === '--dry-run') opts.dryRun = true;
        else if (a === '--keep-tmp') opts.keepTmp = true;
        else if (a === '--force-patched') opts.forcePatched = true;
        else if (a === '--help' || a === '-h') usage(0);
        else if (a.startsWith('--')) { console.error('unknown flag:', a); usage(); }
        else opts.files.push(a);
    }
    if (opts.files.length === 0) usage();
    return opts;
}

function loadOwned() {
    return JSON.parse(readFileSync(MANIFEST, 'utf8')).owned;
}

// Returns the list of file basenames (e.g., "drawing.js") that
// appear in patchFile('NAME', ...) calls in build-engine.mjs.  Used
// to warn when a target is patched — the patches won't be reapplied.
function loadPatchedFiles() {
    const src = readFileSync(BUILD_ENGINE, 'utf8');
    const out = new Set();
    for (const m of src.matchAll(/patchFile\(\s*'([^']+)'/g)) {
        out.add(m[1]);
    }
    return out;
}

// In-file hand-port detection.  Some `js/translated/*.js` files
// contain hand-written JS reimplementations of individual functions
// or surgical fixes for specific translator gaps — these are NOT
// recorded as patchFile entries in build-engine.mjs because they
// live directly in the translated file, not in a patch.
// Regenerating would silently clobber them.  Refuse if any markers
// are present.
//
// Markers covered (case-insensitive):
//   "Hand-port:" — whole-function JS rewrite (rgbstr_to_int32 etc.)
//   "JS rewrite:" — partial JS rewrite of a code block
//   "Translator gap:" — surgical workaround for a translator emit
//     bug (e.g., write.js's nm.slice(N) vs broken nm += N concat).
//     Added 2026-05-30 after near-miss on write.js regen.
//   "Translator-bug fix" / "Translator bug:" — defensive code for
//     a translator output bug (e.g., dbridge.js's three-case verb
//     test for !verb || verb.length === 0 || ...).  Added
//     2026-05-30 after near-miss on dbridge.js regen.
//   "Translator workaround" — same category as -bug fix.
//   "JS-faithful" — defensive multi-case JS handling for string /
//     array / value-box (e.g., pray.js's underscore-prefix check
//     for deity names).  Added 2026-05-30 after near-miss on
//     pray.js regen.
function hasHandPortMarkers(absPath) {
    let s;
    try { s = readFileSync(absPath, 'utf8'); } catch { return 0; }
    const m = s.match(/Hand-port:|JS rewrite:|Translator[- ](?:gap|bug|workaround|fix)|JS-faithful/gi);
    return m ? m.length : 0;
}

function findCSource(jsRel) {
    const base = basename(jsRel, '.js');
    const cPath = join(SRC_DIR, `${base}.c`);
    return existsSync(cPath) ? cPath : null;
}

// Apply the inside-body comment injection from build-engine.mjs
// (§23.122) to a single file.  Reads the __pending_inside_comments
// manifest from `outDir`, filters to entries that target `file`
// (basename, e.g., "drawing.js"), and rewrites the file in-place.
// Returns { injected, droppedAlreadyPresent, droppedNotFound, tail }.
function applyInsideBodyComments(outDir, file) {
    const manifestPath = join(outDir, '__pending_inside_comments.json');
    let manifest = [];
    try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); }
    catch { return { injected: 0, droppedAlreadyPresent: 0, droppedNotFound: 0, tail: 0 }; }
    const entries = manifest.filter((e) => e.file === file);
    if (entries.length === 0) {
        return { injected: 0, droppedAlreadyPresent: 0, droppedNotFound: 0, tail: 0 };
    }
    const p = join(outDir, file);
    let s = readFileSync(p, 'utf8');
    let injected = 0, droppedAlreadyPresent = 0, droppedNotFound = 0, tail = 0;
    const seen = new Set();
    for (const { anchor, content, position } of entries) {
        const key = anchor + '\x00' + content + '\x00' + (position || 'before');
        if (seen.has(key)) continue;
        seen.add(key);
        if (s.includes(content)) {
            droppedAlreadyPresent++;
            continue;
        }
        const first = anchor === '' ? -1 : s.indexOf(anchor);
        if (first < 0) {
            // Anchor not found — append at end for §11 verbatim presence.
            if (!s.endsWith('\n')) s += '\n';
            s += content;
            if (!content.endsWith('\n')) s += '\n';
            droppedNotFound++;
            tail++;
            continue;
        }
        const second = s.indexOf(anchor, first + anchor.length);
        if (second !== -1) {
            // Ambiguous anchor — best-effort: inject at the first hit
            // anyway, matching build-engine.mjs.
        }
        // Mirror build-engine.mjs lines 8006-8022: take the leading
        // whitespace of the anchor's line and prepend it to the
        // content so the comment lines up with the anchor.
        const lineStart = s.lastIndexOf('\n', first) + 1;
        const leadingWs = s.slice(lineStart).match(/^[ \t]*/)?.[0] ?? '';
        if (position === 'after') {
            const nextNl = s.indexOf('\n', first);
            const lineEnd = nextNl < 0 ? s.length : nextNl + 1;
            s = s.slice(0, lineEnd) + leadingWs + content + '\n' + s.slice(lineEnd);
        } else {
            s = s.slice(0, lineStart) + leadingWs + content + '\n' + s.slice(lineStart);
        }
        injected++;
    }
    writeFileSync(p, s);
    return { injected, droppedAlreadyPresent, droppedNotFound, tail };
}

function runFullTranslateTree(outDir) {
    const owned = loadOwned();
    const cFiles = [];
    for (const j of owned) {
        const c = findCSource(j);
        if (c) cFiles.push(c);
    }
    const args = ['tools/c2js/build.mjs', '--translate-tree', outDir, ...cFiles];
    const r = spawnSync(process.execPath, args, {
        cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    if (r.status !== 0) {
        throw new Error('--translate-tree failed: ' + (r.stderr || '').slice(0, 2000));
    }
}

// Runs the spec-conformance pass.  AGENTS.md (hard rule): "Every
// output module must pass the conformance pass before commit."
// The pass takes ~5s — cheap enough to run on every regen.
function runConformance() {
    const r = spawnSync(process.execPath, [
        'tools/c2js/build.mjs', '--conformance',
    ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    // Look for the explicit PASS line.
    const ok = /conformance: PASS/.test(r.stdout || '');
    if (!ok) {
        console.error('--- conformance failed; output (tail) ---');
        console.error((r.stdout || '').slice(-2000));
        console.error((r.stderr || '').slice(-1000));
    }
    return ok;
}

function runSeed8000() {
    // ps_test_runner writes the human PASS/FAIL line to stderr and a
    // __RESULTS_JSON__ banner + JSON to stdout.  Parse the JSON.
    const r = spawnSync(process.execPath, [
        'frozen/ps_test_runner.mjs',
        'sessions/seed8000-tourist-starter.session.json',
    ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const out = r.stdout || '';
    const marker = '__RESULTS_JSON__';
    const i = out.lastIndexOf(marker);
    if (i < 0) {
        console.error('seed8000 runner produced no __RESULTS_JSON__ banner');
        console.error('stdout tail:', out.slice(-1000));
        console.error('stderr tail:', (r.stderr || '').slice(-1000));
        return false;
    }
    try {
        const json = JSON.parse(out.slice(i + marker.length).trim());
        return Array.isArray(json.results) && json.results.every((x) => x.passed);
    } catch (e) {
        console.error('seed8000 JSON parse failed:', e.message);
        return false;
    }
}

function main() {
    const opts = parseArgs();
    const owned = new Set(loadOwned());
    const patched = loadPatchedFiles();
    // Validate targets.
    for (const f of opts.files) {
        if (!owned.has(f)) {
            console.error(`Not in manifest: ${f}`);
            process.exit(2);
        }
        const base = basename(f);
        if (patched.has(base) && !opts.forcePatched) {
            console.error(`WARNING: ${base} has patchFile entries in build-engine.mjs.`);
            console.error('  This script does NOT reapply patches.  Production will lose');
            console.error('  the patch and may regress.  Aborting.');
            console.error('  (use --force-patched to bypass; patches will be re-applied');
            console.error('   from build-engine.mjs after regen)');
            process.exit(2);
        }
        const handPortCount = hasHandPortMarkers(join(ROOT, 'js', f));
        if (handPortCount > 0) {
            console.error(`WARNING: ${f} contains ${handPortCount} in-file hand-port marker(s).`);
            console.error('  Regenerating would replace hand-written JS with raw translator');
            console.error('  output (which is what the hand-port was working around).  Aborting.');
            console.error('  Grep for "Hand-port:" / "JS rewrite:" / "Translator gap:" /');
            console.error('  "Translator-bug fix" / "JS-faithful" to inspect.');
            process.exit(2);
        }
        if (!findCSource(f)) {
            console.error(`No C source for ${f}`);
            process.exit(2);
        }
    }
    // Translate full set into a sibling temp dir so import-relative
    // paths match production's depth-from-ROOT.
    const stamp = Date.now().toString(36);
    const tmpDir = join(ROOT, 'js', `translated__regenerate_${stamp}`);
    spawnSync('mkdir', ['-p', tmpDir]);
    console.error(`regenerate-files: translating full owned set into ${tmpDir}...`);
    try {
        runFullTranslateTree(tmpDir);
    } catch (e) {
        console.error(e.message);
        if (!opts.keepTmp) rmSync(tmpDir, { recursive: true, force: true });
        else console.error(`tmpdir kept at ${tmpDir}`);
        process.exit(1);
    }
    // Inject inside-body comments for the requested files.
    const injectionStats = {};
    for (const f of opts.files) {
        const base = basename(f);
        const stats = applyInsideBodyComments(tmpDir, base);
        injectionStats[base] = stats;
    }
    if (opts.dryRun) {
        console.log('--- DRY RUN ---');
        for (const f of opts.files) {
            const base = basename(f);
            const prodPath = join(ROOT, 'js', f);
            const newPath = join(tmpDir, base);
            const r = spawnSync('diff', ['-u', prodPath, newPath], {
                encoding: 'utf8', maxBuffer: 1024 * 1024,
            });
            const lines = (r.stdout || '').split('\n').length - 1;
            const stats = injectionStats[base] || {};
            console.log(`${f} — ${lines} diff lines, comments inject={injected:${stats.injected || 0}, tail:${stats.tail || 0}, already-present:${stats.droppedAlreadyPresent || 0}}`);
        }
        if (!opts.keepTmp) rmSync(tmpDir, { recursive: true, force: true });
        else console.error(`tmpdir kept at ${tmpDir}`);
        return;
    }
    // Save production for restore-on-failure.
    const backupDir = join(ROOT, 'js', `translated__backup_${stamp}`);
    spawnSync('mkdir', ['-p', backupDir]);
    for (const f of opts.files) {
        const base = basename(f);
        copyFileSync(join(ROOT, 'js', f), join(backupDir, base));
    }
    // Copy regenerated → production.
    for (const f of opts.files) {
        const base = basename(f);
        copyFileSync(join(tmpDir, base), join(ROOT, 'js', f));
    }
    // §23.230c — With --force-patched: also run build-engine to apply
    // patches over the regenerated content.  build-engine reads from
    // outputDir (which we redirect to a sandbox), so it sees the
    // freshly-translated content + applies all patchFile() entries.
    // We then copy the post-patch versions of the requested files
    // back to production.  The conformance + seed8000 checks below
    // catch any regression.
    if (opts.forcePatched) {
        const patchTmpDir = join(ROOT, 'js', `translated__patch_${stamp}`);
        spawnSync('mkdir', ['-p', patchTmpDir]);
        // Copy the full translator output (all files) to patchTmpDir
        // so build-engine sees a fresh-translation baseline.
        const fullTmpFiles = readdirSync(tmpDir);
        for (const fname of fullTmpFiles) {
            try { copyFileSync(join(tmpDir, fname), join(patchTmpDir, fname)); }
            catch {}
        }
        // §23.232m — Closure freeze: overwrite the recomputed
        // __async_closure.json with production's frozen version so
        // build-engine's NH_EMIT_ASYNC injection uses the EXACT set
        // production was built with.  Single-TU migrations that
        // would otherwise cause closure cascade (e.g. enexto becoming
        // async due to pline closure) won't shift the injection set.
        // Opt out with FREEZE_CLOSURE=0 if needed.
        if (process.env.FREEZE_CLOSURE !== '0') {
            const frozenManifest = join(TRANSLATED_DIR, '__async_closure.json');
            const sandboxManifest = join(patchTmpDir, '__async_closure.json');
            if (existsSync(frozenManifest)) {
                copyFileSync(frozenManifest, sandboxManifest);
                console.error(`regenerate-files: frozen closure from ${frozenManifest}`);
            }
        }
        console.error(`regenerate-files: running build-engine patches in ${patchTmpDir}...`);
        // Forward NH_EMIT_ASYNC so the build-engine's async-keyword
        // injection runs, matching production for TUs that contain
        // async-call sites (sp_lev, mklev, questpgr, etc.).  Without
        // this, the conformance check fails with "call to async
        // nhl_pcall_handle() without await" because production has
        // the await keywords sprinkled in.
        // §23.232j: explicitly accept NH_EMIT_ASYNC=0 / NH_EMIT_ASYNC=
        // (empty) to OPT OUT of injection — needed when the target TU
        // matches production's sync emit style (e.g. teleport.c whose
        // production file has no async/await despite pline being in
        // the closure).  Default still injects.
        const env = { ...process.env, BUILD_ENGINE_OUT: patchTmpDir };
        if (env.NH_EMIT_ASYNC === undefined) env.NH_EMIT_ASYNC = '1';
        else if (env.NH_EMIT_ASYNC === '0' || env.NH_EMIT_ASYNC === '')
            delete env.NH_EMIT_ASYNC;
        const beResult = spawnSync(
            'node', [BUILD_ENGINE],
            { env, stdio: 'inherit' }
        );
        if (beResult.status !== 0) {
            console.error('build-engine failed during --force-patched');
            for (const f of opts.files) {
                copyFileSync(join(backupDir, basename(f)), join(ROOT, 'js', f));
            }
            rmSync(patchTmpDir, { recursive: true, force: true });
            if (!opts.keepTmp) rmSync(tmpDir, { recursive: true, force: true });
            rmSync(backupDir, { recursive: true, force: true });
            process.exit(1);
        }
        // Copy the post-patch versions of the requested files back
        // to production.
        for (const f of opts.files) {
            const base = basename(f);
            copyFileSync(join(patchTmpDir, base), join(ROOT, 'js', f));
        }
        if (!opts.keepTmp) rmSync(patchTmpDir, { recursive: true, force: true });
        else console.error(`patch tmpdir kept at ${patchTmpDir}`);
    }
    // Verify conformance + seed8000 in that order (AGENTS.md hard
    // rule: "Every output module must pass the conformance pass
    // before commit.")
    const restoreAndExit = (why) => {
        console.error(`REGRESSION: ${why}.  Restoring production.`);
        for (const f of opts.files) {
            const base = basename(f);
            copyFileSync(join(backupDir, base), join(ROOT, 'js', f));
        }
        if (!opts.keepTmp) rmSync(tmpDir, { recursive: true, force: true });
        else console.error(`tmpdir kept at ${tmpDir}`);
        rmSync(backupDir, { recursive: true, force: true });
        process.exit(1);
    };
    console.error('regenerate-files: running conformance check...');
    if (!runConformance()) restoreAndExit('conformance FAIL after regeneration');
    console.error('regenerate-files: running seed8000 PASS check...');
    if (!runSeed8000()) restoreAndExit('seed8000 FAIL after regeneration');
    console.error('regenerate-files: conformance PASS + seed8000 PASS preserved.');
    for (const f of opts.files) {
        const base = basename(f);
        const stats = injectionStats[base] || {};
        console.log(`  regenerated ${f} (comments inject=${stats.injected || 0}, tail=${stats.tail || 0})`);
    }
    rmSync(tmpDir, { recursive: true, force: true });
    rmSync(backupDir, { recursive: true, force: true });
    console.error('regenerate-files: done.  Review the diff (`git diff`) and commit if intended.');
}

main();
