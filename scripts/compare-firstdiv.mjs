#!/usr/bin/env node
// compare-firstdiv.mjs — First-divergence localizer for the JS NetHack
// port. Walks the JS log and the C session.rng log in parallel, finds
// the first mismatched line, and prints a context window around it.
// The C side preserves caller annotations (`@ funcname(file:line)`)
// even though normalizeRng() strips them for equality checks — this
// script keeps them visible so you know exactly which C function
// emitted the divergent event.
//
// Usage:
//   node scripts/compare-firstdiv.mjs <session-name-or-path>
//   node scripts/compare-firstdiv.mjs seed0077-rogue-chargen
//   node scripts/compare-firstdiv.mjs sessions/seed0077-rogue-chargen.session.json
//   node scripts/compare-firstdiv.mjs --all     (summary table sorted by firstDiv asc)
//   node scripts/compare-firstdiv.mjs --prng-only <session>  (filter both sides
//                                                             to PRNG calls before
//                                                             comparison — matches
//                                                             score-table's p: column)
//   node scripts/compare-firstdiv.mjs --all --prng-only       (combine)
//
// Exit code: 0 if logs fully match, 1 if a divergence was found, 2 on error.

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SESSIONS_DIR = join(PROJECT_ROOT, 'sessions');

const CONTEXT_WINDOW = 8; // lines before AND after the divergence

// Same canonical normalizer ps_test_runner uses for equality. Keep
// these in sync — this script's notion of "matched" must match the
// scorer's, otherwise the agent will chase ghosts.
function normalize(entry) {
    return entry.replace(/\s*@\s.*$/, '').replace(/^\d+\s+/, '').trim();
}

// Drop the JS-side leading "<index> " counter that getRngLog emits.
function stripJsIndex(s) {
    return s.replace(/^\d+\s+/, '');
}

// PRNG-only filter — same shape ps_test_runner / score-table use to
// compute the p: column. When the C log contains events but the JS
// log doesn't (the current state of the world), full-log alignment
// reports firstDiv@0 even when the PRNG-only sequences agree for
// hundreds of calls. --prng-only reveals the real PRNG drift point.
function isRngCall(entry) {
    return typeof entry === 'string' && /^(?:rn2|rnd|rn1|rnl|rne|rnz|d)\(/.test(entry);
}

function resolveSessionPath(target) {
    if (existsSync(target)) return target;
    const fromRoot = join(PROJECT_ROOT, target);
    if (existsSync(fromRoot)) return fromRoot;
    const inSessions = join(SESSIONS_DIR, target);
    if (existsSync(inSessions)) return inSessions;
    const inSessionsExt = inSessions.endsWith('.session.json')
        ? inSessions
        : inSessions + '.session.json';
    if (existsSync(inSessionsExt)) return inSessionsExt;
    throw new Error(`session not found: ${target}`);
}

// Worker mode (internal) — emit a single-session summary as JSON for
// the --all driver to consume.
const WORKER_FLAG = '--worker-summary=';

async function singleSessionSummary(sessionPath, prngOnly) {
    try {
        const fr = join(PROJECT_ROOT, 'frozen');
        const js = join(PROJECT_ROOT, 'js');
        for (const f of ['isaac64.js', 'terminal.js']) {
            const src = join(fr, f);
            const dst = join(js, f);
            if (existsSync(src)) writeFileSync(dst, readFileSync(src));
        }
    } catch (_) { /* best-effort */ }

    const sessionData = JSON.parse(readFileSync(sessionPath, 'utf8'));
    const { normalizeSession } = await import(join(PROJECT_ROOT, 'frozen/session_loader.mjs'));
    const { runSegment } = await import(join(PROJECT_ROOT, 'js/jsmain.js'));

    const segments = normalizeSession(sessionData).segments;
    const cLog = [];
    let stepIdx = 0;
    for (const seg of segments) {
        for (const step of seg.steps || []) {
            for (const line of (step.rng || [])) {
                if (typeof line !== 'string') continue;
                if (prngOnly && !isRngCall(line)) continue;
                cLog.push({ line, step: stepIdx });
            }
            stepIdx++;
        }
    }

    let game = null;
    let jsError = null;
    try {
        for (const seg of segments) {
            game = await runSegment(
                { seed: seg.seed, datetime: seg.datetime, nethackrc: seg.nethackrc, moves: seg.moves },
                game
            );
        }
    } catch (e) {
        jsError = e.message;
    }
    let jsLog = (game?.getRngLog() || []).map(stripJsIndex);
    if (prngOnly) jsLog = jsLog.filter(isRngCall);

    let firstDiv = -1;
    const N = Math.max(cLog.length, jsLog.length);
    for (let i = 0; i < N; i++) {
        const c = cLog[i]?.line;
        const j = jsLog[i];
        const cn = c === undefined ? null : normalize(c);
        const jn = j === undefined ? null : normalize(j);
        if (cn !== jn) { firstDiv = i; break; }
    }

    const cLine = firstDiv >= 0 ? cLog[firstDiv]?.line ?? '' : '';
    const jLine = firstDiv >= 0 ? jsLog[firstDiv] ?? '' : '';
    const cStep = firstDiv >= 0 ? cLog[firstDiv]?.step ?? -1 : -1;

    return {
        session: basename(sessionPath).replace(/\.session\.json$/, ''),
        cLines: cLog.length,
        jsLines: jsLog.length,
        firstDiv,
        cStep,
        cLine,
        jLine,
        error: jsError,
    };
}

async function runAll(prngOnly) {
    const files = readdirSync(SESSIONS_DIR)
        .filter(f => f.endsWith('.session.json'))
        .sort()
        .map(f => join(SESSIONS_DIR, f));

    const timeoutMs = Number(process.env.SESSION_REPLAY_TIMEOUT_MS || 60000);
    const results = [];
    for (const sf of files) {
        const sessionName = basename(sf).replace(/\.session\.json$/, '');
        process.stderr.write(`  ${sessionName} ... `);
        const workerArgs = [SCRIPT_PATH, `${WORKER_FLAG}${sf}`];
        if (prngOnly) workerArgs.push('--prng-only');
        const child = spawnSync(process.execPath, workerArgs, {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            timeout: timeoutMs,
            maxBuffer: 64 * 1024 * 1024,
        });
        let r;
        if (child.error || (child.status ?? 0) !== 0) {
            const err = child.error?.message || (child.stderr || '').trim().split('\n').slice(-1)[0] || `exit ${child.status}`;
            r = { session: sessionName, cLines: 0, jsLines: 0, firstDiv: -1, cStep: -1, cLine: '', jLine: '', error: err };
        } else {
            const out = child.stdout || '';
            const idx = out.lastIndexOf('__SUMMARY__');
            if (idx < 0) {
                r = { session: sessionName, cLines: 0, jsLines: 0, firstDiv: -1, cStep: -1, cLine: '', jLine: '', error: 'missing __SUMMARY__ marker' };
            } else {
                r = JSON.parse(out.slice(idx + '__SUMMARY__'.length).trim());
            }
        }
        results.push(r);
        process.stderr.write(
            r.error ? `err\n` : `firstDiv@${r.firstDiv} (step ${r.cStep})\n`
        );
    }

    // Sort: matches first (firstDiv === -1 and no error), then by firstDiv ascending.
    // Within the diverging ones, low firstDiv = simpler session = better focus.
    results.sort((a, b) => {
        const aMatch = a.firstDiv === -1 && !a.error;
        const bMatch = b.firstDiv === -1 && !b.error;
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
        if (a.error && !b.error) return 1;
        if (!a.error && b.error) return -1;
        return (a.firstDiv === -1 ? Infinity : a.firstDiv) - (b.firstDiv === -1 ? Infinity : b.firstDiv);
    });

    const padTo = Math.max(40, ...results.map(r => r.session.length));
    process.stdout.write(`# first-divergence summary across ${results.length} sessions${prngOnly ? '  [PRNG-only]' : ''}\n`);
    process.stdout.write(`# sort: matched first, then firstDiv ascending (simplest = highest focus priority)\n`);
    process.stdout.write('\n');
    for (const r of results) {
        const name = r.session.padEnd(padTo);
        if (r.error) {
            process.stdout.write(`${name}  ERROR  ${r.error.slice(0, 60)}\n`);
        } else if (r.firstDiv === -1) {
            process.stdout.write(`${name}  MATCH  (${r.cLines} lines)\n`);
        } else {
            process.stdout.write(
                `${name}  firstDiv@${String(r.firstDiv).padStart(5)}  step=${String(r.cStep).padStart(4)}  C=${r.cLines} JS=${r.jsLines}\n`
            );
            const c = r.cLine ? r.cLine.slice(0, 70) : '<JS overshoots>';
            const j = r.jLine ? r.jLine.slice(0, 70) : '<JS underruns>';
            process.stdout.write(`${' '.repeat(padTo)}    C: ${c}\n`);
            process.stdout.write(`${' '.repeat(padTo)}   JS: ${j}\n`);
        }
    }

    const matched = results.filter(r => !r.error && r.firstDiv === -1).length;
    process.stdout.write(`\n# matched=${matched}/${results.length}  diverging=${results.filter(r => r.firstDiv >= 0).length}  errored=${results.filter(r => r.error).length}\n`);
}

async function main() {
    const args = process.argv.slice(2);
    const prngOnly = args.includes('--prng-only');

    const workerArg = args.find(a => a.startsWith(WORKER_FLAG));
    if (workerArg) {
        const summary = await singleSessionSummary(workerArg.slice(WORKER_FLAG.length), prngOnly);
        process.stdout.write('__SUMMARY__\n');
        process.stdout.write(JSON.stringify(summary));
        return;
    }

    if (args.includes('--all')) {
        await runAll(prngOnly);
        return;
    }

    const target = args.find(a => !a.startsWith('--'));
    if (!target) {
        process.stderr.write(
            'Usage: node scripts/compare-firstdiv.mjs [--prng-only] <session>\n' +
            '       node scripts/compare-firstdiv.mjs [--prng-only] --all\n' +
            'Example: node scripts/compare-firstdiv.mjs seed0077-rogue-chargen\n'
        );
        process.exit(2);
    }

    const sessionPath = resolveSessionPath(target);
    const sessionName = basename(sessionPath).replace(/\.session\.json$/, '');

    // Overlay frozen files like the scorer does. The comparator must
    // see the same JS as the scorer, otherwise its first-divergence
    // line won't be the same one the official runner found.
    try {
        const fr = join(PROJECT_ROOT, 'frozen');
        const js = join(PROJECT_ROOT, 'js');
        for (const f of ['isaac64.js', 'terminal.js']) {
            const src = join(fr, f);
            const dst = join(js, f);
            if (existsSync(src)) writeFileSync(dst, readFileSync(src));
        }
    } catch (_) { /* best-effort */ }

    const sessionData = JSON.parse(readFileSync(sessionPath, 'utf8'));
    const { normalizeSession } = await import(join(PROJECT_ROOT, 'frozen/session_loader.mjs'));
    const { runSegment } = await import(join(PROJECT_ROOT, 'js/jsmain.js'));

    const segments = normalizeSession(sessionData).segments;

    // C-side flat log, with each line annotated by which step (input
    // boundary) it came from. Useful for "C diverged at step 392"
    // localization that's already routine in this codebase.
    const cLog = [];
    let stepIdx = 0;
    for (const seg of segments) {
        for (const step of seg.steps || []) {
            for (const line of (step.rng || [])) {
                if (typeof line !== 'string') continue;
                if (prngOnly && !isRngCall(line)) continue;
                cLog.push({ line, step: stepIdx });
            }
            stepIdx++;
        }
    }

    let game = null;
    let jsError = null;
    try {
        for (const seg of segments) {
            game = await runSegment(
                {
                    seed: seg.seed,
                    datetime: seg.datetime,
                    nethackrc: seg.nethackrc,
                    moves: seg.moves,
                },
                game
            );
        }
    } catch (e) {
        jsError = e;
    }

    let jsLog = (game?.getRngLog() || []).map(stripJsIndex);
    if (prngOnly) jsLog = jsLog.filter(isRngCall);

    // Walk in parallel until the first normalized mismatch.
    let firstDiv = -1;
    const N = Math.max(cLog.length, jsLog.length);
    for (let i = 0; i < N; i++) {
        const c = cLog[i]?.line;
        const j = jsLog[i];
        const cn = c === undefined ? null : normalize(c);
        const jn = j === undefined ? null : normalize(j);
        if (cn !== jn) { firstDiv = i; break; }
    }

    if (firstDiv < 0 && cLog.length === jsLog.length) {
        process.stdout.write(`OK: ${sessionName} — JS and C logs match exactly (${cLog.length} lines)\n`);
        process.exit(0);
    }

    // Format context window. Use the C step number as the localizing
    // anchor — that's what the agent will reach for when reading the C
    // function the divergence points to.
    const start = Math.max(0, firstDiv - CONTEXT_WINDOW);
    const end = Math.min(N, firstDiv + CONTEXT_WINDOW + 1);

    process.stdout.write(`session:    ${sessionName}\n`);
    process.stdout.write(`first div:  index ${firstDiv}`);
    if (cLog[firstDiv]?.step !== undefined) {
        process.stdout.write(`  (C step ${cLog[firstDiv].step})`);
    }
    process.stdout.write(`\n`);
    process.stdout.write(`C lines:    ${cLog.length}\n`);
    process.stdout.write(`JS lines:   ${jsLog.length}\n`);
    if (jsError) {
        process.stdout.write(`JS error:   ${jsError.message}\n`);
    }
    process.stdout.write(`\n`);

    const COL = 90;
    const truncate = (s, n) => (s.length <= n ? s : s.slice(0, n - 1) + '…');

    process.stdout.write(`     ${'C side (with @ annotations)'.padEnd(COL)} | JS side\n`);
    process.stdout.write(`     ${'-'.repeat(COL)}-+-${'-'.repeat(COL)}\n`);
    for (let i = start; i < end; i++) {
        const c = cLog[i]?.line ?? '';
        const j = jsLog[i] ?? '';
        const marker = i === firstDiv ? '>>>' : '   ';
        const stepTag = cLog[i]?.step !== undefined ? `[s${cLog[i].step}]` : '     ';
        process.stdout.write(
            `${marker}${stepTag} ${truncate(c, COL).padEnd(COL)} | ${truncate(j, COL)}\n`
        );
    }
    process.stdout.write(`\n`);

    // Pull out the C annotation at the divergence line if present.
    // This is the actionable single fact: "the C function that emitted
    // the divergent event lives at file:line."
    const cLine = cLog[firstDiv]?.line;
    if (cLine) {
        const ann = cLine.match(/@\s+([^\s]+\(([^:)]+):(\d+)\))/);
        if (ann) {
            process.stdout.write(`C annotation:  ${ann[1]}\n`);
            process.stdout.write(`  open:        nethack-c/upstream/src/${ann[2]}  line ${ann[3]}\n`);
        } else {
            process.stdout.write(`(no C annotation on this line — try inspecting nearby lines or porting via call-chain trace)\n`);
        }
    }

    process.exit(1);
}

main().catch(e => {
    process.stderr.write(`Fatal: ${e.message}\n${e.stack}\n`);
    process.exit(2);
});
