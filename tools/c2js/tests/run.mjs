// tools/c2js/tests/run.mjs — runner for translator self-tests.
//
// Each test under tools/c2js/tests/NN-name/ has:
//   - source.c       — input C
//   - expected.txt   — what the C program prints when compiled and run
//   - (in later phases) generated/source.js — translator output
//
// Phase 0: just a smoke test that the harness itself works.  No real
// translator yet, so no real translation happens.  The harness verifies
// that:
//   (a) every test has a source.c and an expected.txt
//   (b) compiling source.c with clang and running it produces
//       expected.txt byte-identical
//
// Phase 1 onward also runs the translator on source.c and verifies
// that `node generated/source.js` produces expected.txt byte-identical.

import { readdirSync, statSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

function listTests() {
    const out = [];
    for (const entry of readdirSync(here).sort()) {
        const path = join(here, entry);
        if (!statSync(path).isDirectory()) continue;
        if (!/^\d{2}-/.test(entry)) continue;
        out.push({ name: entry, path });
    }
    return out;
}

// Returns the .c sources in a test directory.  Single-file tests have
// `source.c`; multi-file tests have any number of .c files (the entry
// point is the one containing `int main(`).
function listCSources(testPath) {
    return readdirSync(testPath)
        .filter((f) => f.endsWith('.c'))
        .map((f) => join(testPath, f))
        .sort();
}

function findEntryFile(cFiles) {
    if (cFiles.length === 1) return cFiles[0];
    for (const f of cFiles) {
        const text = readFileSync(f, 'utf8');
        if (/\bint\s+main\s*\(/.test(text)) return f;
    }
    return cFiles[0]; // fallback
}

function compileAndRunC(test) {
    const cFiles = listCSources(test.path);
    if (cFiles.length === 0) return { ok: false, why: 'no .c sources' };
    const bin = join(test.path, '.a.out');
    const compile = spawnSync('clang', ['-O0', '-Wall', '-Wno-unused', ...cFiles, '-o', bin], {
        encoding: 'utf8',
        stdio: 'pipe',
    });
    if (compile.status !== 0) {
        return { ok: false, why: `clang failed:\n${compile.stderr || compile.stdout}` };
    }
    const run = spawnSync(bin, [], { encoding: 'utf8', stdio: 'pipe' });
    if (run.status !== 0) {
        return { ok: false, why: `run failed (status ${run.status}):\n${run.stderr || run.stdout}` };
    }
    return { ok: true, output: run.stdout };
}

function runJs(jsPath) {
    const run = spawnSync(process.execPath, [jsPath], { encoding: 'utf8', stdio: 'pipe' });
    if (run.status !== 0) {
        return { ok: false, why: `node failed (status ${run.status}):\n${run.stderr || run.stdout}` };
    }
    return { ok: true, output: run.stdout };
}

export async function runSelfTests({ translateFn = null, buildTreeFn = null } = {}) {
    const tests = listTests();
    if (tests.length === 0) {
        return { ok: true, summary: 'self-tests: 0 cases (Phase 0 — no tests authored yet)' };
    }
    const results = [];
    for (const t of tests) {
        const expectedPath = join(t.path, 'expected.txt');
        if (!existsSync(expectedPath)) {
            results.push({ name: t.name, ok: false, why: 'missing expected.txt' });
            continue;
        }
        const expected = readFileSync(expectedPath, 'utf8');
        const c = compileAndRunC(t);
        if (!c.ok) {
            results.push({ name: t.name, ok: false, why: `C side: ${c.why}` });
            continue;
        }
        if (c.output !== expected) {
            results.push({
                name: t.name,
                ok: false,
                why: `C output differs from expected.\n--- expected ---\n${expected}\n--- got ---\n${c.output}`,
            });
            continue;
        }
        // C side passes.  Now: if a translator is supplied, run it,
        // then run the produced JS and diff against expected.
        if (!translateFn) {
            results.push({ name: t.name, ok: true, note: 'C-side only (no translator wired)' });
            continue;
        }
        const cFiles = listCSources(t.path);
        const generatedDir = join(t.path, 'generated');
        mkdirSync(generatedDir, { recursive: true });
        let entryJs;
        try {
            if (cFiles.length > 1 && buildTreeFn) {
                // Multi-file test: translate every .c via the tree
                // driver so cross-TU references resolve as imports.
                buildTreeFn({ sources: cFiles, outputDir: generatedDir });
                const entryC = findEntryFile(cFiles);
                entryJs = join(generatedDir, basename(entryC, '.c') + '.js');
            } else {
                entryJs = join(generatedDir, 'source.js');
                translateFn(cFiles[0], entryJs);
            }
        } catch (e) {
            results.push({ name: t.name, ok: false, why: `translator failed: ${e.message}` });
            continue;
        }
        // Additional assertion: ALL generated JS files in the
        // test's generated/ directory should be free of
        // translator-broken markers.  These signal the
        // translator emitted a fallback no-op instead of a real
        // translation.  Even if the synthetic test's output
        // happens to be correct, the marker indicates a
        // recognizer gap that the test catalog should cover.
        //
        // Two classes of markers are checked:
        //
        //   `__nh_blackhole` — pointer-walk increment fallback
        //                      (struct-ptr `p++` not absorbed by
        //                      any pointer-walk recognizer)
        //
        //   `// TODO ` / `/* TODO ` — any translator-emitted
        //                             TODO comment.  Covers all
        //                             explicit fallback paths in
        //                             translate.mjs:
        //                             - "TODO Phase 5+: goto..."
        //                             - "TODO Phase 5+: pointer-mutation..."
        //                             - "TODO SwitchStmt with non-compound body"
        //                             - "TODO bare CaseStmt outside switch"
        //                             - "TODO goto with unresolved targetLabelDeclId"
        //                             - "TODO LabelStmt X not at compound-stmt level"
        //                             - "TODO ForStmt with N children"
        //                             - "TODO Phase 5+: chained pointer-mutation lvalue"
        //
        // For multi-file tests, every translated .js file is
        // checked (not just the entry).  No current test has any
        // such marker in any generated file, so this assertion
        // is a regression net: if a future translator change
        // starts emitting one, the relevant test fails loudly.
        let markerFailure = null;
        const genJsFiles = readdirSync(generatedDir)
            .filter((f) => f.endsWith('.js'))
            .map((f) => join(generatedDir, f));
        // Helper: 1-based line number of `needle` inside `text`,
        // or 0 if not found.  Used for diagnostic context in the
        // broken-marker failure message.
        const lineOf = (text, needle) => {
            const idx = text.indexOf(needle);
            if (idx < 0) return 0;
            return text.slice(0, idx).split('\n').length;
        };
        // Translator-emitted broken-fallback markers all follow
        // recognizable shapes:
        //   `(... = __nh_blackhole)` — pointer-walk fallback
        //   `void 0 /* TODO Phase 5+: ...`  — pointer-mutation / chained
        //   `/* TODO Phase 5+: goto ... (label not in scope of break) */`
        //                     — goto fallback at a stmt position
        //   `// TODO unhandled stmt ...` — stmt(): unhandled kind
        //   `// TODO bare CaseStmt outside switch ...` etc.
        // Preserved C-source comments may *describe* these markers
        // (e.g. a comment that explains what `__nh_blackhole` is) —
        // those mentions should NOT trip the check.  Match each
        // marker's full template, not just a substring.
        const MARKER_PATTERNS = [
            // __nh_blackhole as an actual emitted assignment target
            // or value (always inside an expression, never standalone
            // in code).  Source comments that mention it use bare text.
            { re: /=\s*__nh_blackhole\b/, label: '__nh_blackhole assignment' },
            // Translator-emitted pointer-mutation marker.
            { re: /void 0 \/\* TODO Phase 5\+: (?:chained )?pointer-mutation/, label: 'pointer-mutation TODO' },
            // Translator-emitted forward-goto marker.
            { re: /\/\* TODO Phase 5\+: goto [A-Za-z_][A-Za-z0-9_]* \(label not in scope of break\) \*\//, label: 'goto TODO' },
            // Translator-emitted unhandled-stmt markers.
            { re: /\/\/ TODO unhandled stmt \w+/, label: 'unhandled stmt' },
            { re: /\/\/ TODO bare CaseStmt outside switch/, label: 'bare CaseStmt' },
            { re: /\/\/ TODO goto with unresolved targetLabelDeclId/, label: 'unresolved goto' },
            { re: /\/\/ TODO LabelStmt \S+ not at compound-stmt level/, label: 'LabelStmt freestanding' },
            { re: /\/\/ TODO ForStmt with \d+ children/, label: 'ForStmt arity' },
            { re: /\/\/ TODO SwitchStmt with non-compound body/, label: 'SwitchStmt non-compound' },
        ];
        // Strip block + line comments before scanning for
        // __nh_blackhole so preserved C-source comments that
        // describe the marker (e.g. a block comment containing
        // the literal text `(p = __nh_blackhole)` explaining what
        // would happen WITHOUT the recognizer) don't false-fire.
        // For the translator-emitted-TODO patterns we want the
        // full template to match against raw text — those are
        // distinct enough that source comments don't collide.
        const stripAllComments = (s) =>
            s.replace(/\/\*[\s\S]*?\*\//g, ' ')
             .replace(/\/\/[^\n]*/g, ' ');
        for (const gf of genJsFiles) {
            const rawText = readFileSync(gf, 'utf8');
            const codeOnly = stripAllComments(rawText);
            const hits = [];
            // __nh_blackhole only counts if it appears in code (not
            // inside a comment from the source description).
            const blackMatch = codeOnly.match(/=\s*__nh_blackhole\b/);
            if (blackMatch) {
                hits.push(`__nh_blackhole assignment at line ${lineOf(rawText, blackMatch[0])}`);
            }
            // The rest of MARKER_PATTERNS are translator-emitted
            // comment shapes; they must be matched against the
            // un-stripped raw text.
            for (const { re, label } of MARKER_PATTERNS.slice(1)) {
                const m = rawText.match(re);
                if (!m) continue;
                hits.push(`${label} at line ${lineOf(rawText, m[0])}: ${m[0].slice(0, 80)}`);
            }
            if (hits.length) {
                markerFailure = `Generated JS ${gf} contains translator-broken markers:\n      - ${hits.join('\n      - ')}`;
                break;
            }
        }
        if (markerFailure) {
            results.push({ name: t.name, ok: false, why: markerFailure });
            continue;
        }
        const j = runJs(entryJs);
        if (!j.ok) {
            results.push({ name: t.name, ok: false, why: `JS side: ${j.why}` });
            continue;
        }
        if (j.output !== expected) {
            results.push({
                name: t.name,
                ok: false,
                why: `JS output differs from expected.\n--- expected ---\n${expected}\n--- got ---\n${j.output}`,
            });
            continue;
        }
        results.push({ name: t.name, ok: true });
    }
    const failed = results.filter((r) => !r.ok);
    const lines = [`self-tests: ${results.length - failed.length}/${results.length} passed`];
    for (const r of results) {
        const tag = r.ok ? '✓' : '✗';
        const note = r.ok && r.note ? ` (${r.note})` : '';
        lines.push(`  ${tag} ${r.name}${note}${r.ok ? '' : `\n      ${r.why.replace(/\n/g, '\n      ')}`}`);
    }
    return { ok: failed.length === 0, summary: lines.join('\n') };
}
