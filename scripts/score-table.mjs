#!/usr/bin/env node
// score-table.mjs — Produces the canonical parity table for all 44 public
// sessions in the form mandated by docs/ITERATION.md. The table is the
// commit-message contract: every commit on main embeds the output of
// this script. Async human review consumes it via `git log`.
//
// Output line per session (left-padded session name for readability):
//   seedXXXX-name    p:(turns) calls/total   s:(turns) screens/total   e:- m:-
//
// Where:
//   p:(turns) = boundaries where every PRNG call matched C in order
//   p calls   = total individual PRNG calls matched in order
//   p total   = total PRNG calls C recorded
//   s:(turns) = same as s screens (one screen per boundary), kept for column shape
//   s screens = boundaries where the 24x80 grid matched C exactly
//   s total   = boundaries in the session
//   e:        = event channel — '-' until the recorder's 7th patch and
//               JS-side event mirror exist (Parts 2-3 of PROMPT.md)
//   m:        = map snapshot channel — '-' until the per-turn state-hash
//               patch is in place (Part 3.5 of PROMPT.md)
//
// Trailing TOTAL line aggregates across all 44 sessions.
// Stdout: the table (suitable for embedding in a commit message).
// Stderr: per-session progress.
// Also writes .cache/score-table.txt for downstream consumers.
//
// Worker mode (internal): `--worker-session=<path>` runs one session and
// emits __TABLE_RESULT_ONE__\n{json}. Spawned per session for isolation.

import { readFileSync, readdirSync, existsSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DEFAULT_SESSIONS_DIR = join(PROJECT_ROOT, 'sessions');

// ---- shared helpers (kept in sync with frozen/ps_test_runner.mjs) ----

function isRngCall(entry) {
    return typeof entry === 'string' && /^(?:rn2|rnd|rn1|rnl|rne|rnz|d)\(/.test(entry);
}

function extractRngCalls(rngArray) {
    return (rngArray || []).filter(isRngCall);
}

function normalizeRng(entry) {
    return entry.replace(/\s*@\s.*$/, '').replace(/^\d+\s+/, '').trim();
}

// Event-channel detector. Most sessions/ recordings already contain
// diagnostic events emitted by the contest recorder build — call entry
// (>funcname @ caller(file:line)), call return (<funcname=retval), and
// state markers (^tag[args]). These are NOT scored by frozen/score.sh
// (which filters them out via isRngCall) but they ARE the finer-grained
// signal that lets the comparator pinpoint divergences. The map channel
// (^mapstate[...]) is split out separately — see isMapLine.
function isEventLine(entry) {
    if (typeof entry !== 'string') return false;
    if (entry.startsWith('^mapstate[')) return false;
    return /^(?:>|<|\^)/.test(entry);
}

function extractEvents(rngArray) {
    return (rngArray || []).filter(isEventLine);
}

// Map-snapshot detector. The recorder emits one `^mapstate[v=N ...]`
// line per relevant boundary describing the encoded game-state hash
// (Part 3.5 of PROMPT.md). Whole-line equality after normalization is
// sufficient — drift in any cell flips the line.
function isMapLine(entry) {
    return typeof entry === 'string' && entry.startsWith('^mapstate[');
}

function extractMaps(rngArray) {
    return (rngArray || []).filter(isMapLine);
}

// ---- worker mode: run one session, emit per-boundary match arrays ----

async function runOneSession(sessionPath) {
    const sessionData = JSON.parse(readFileSync(sessionPath, 'utf8'));
    const { normalizeSession } = await import(join(PROJECT_ROOT, 'frozen/session_loader.mjs'));
    const { decodeScreen, diffCell, ROWS_24, COLS_80 } = await import(
        join(PROJECT_ROOT, 'frozen/screen-decode.mjs')
    );
    const { runSegment } = await import(join(PROJECT_ROOT, 'js/jsmain.js'));

    // Reproduce ps_test_runner's screen normalizer locally so this
    // script doesn't depend on a frozen-file refactor.
    const STARTUP_VARIANT_LINES = [/Version\s+\d+\.\d+\.\d+[^\n]*/];
    function preDecode(s) {
        let cur = String(s);
        for (const re of STARTUP_VARIANT_LINES) cur = cur.replace(re, '<<VERSION_BANNER>>');
        cur = cur.replace(/^\d{2}:\d{2}:\d{2}\.$/gm, '<time>.');
        return cur;
    }
    function screensVisuallyEqual(a, b) {
        const ga = decodeScreen(preDecode(a));
        const gb = decodeScreen(preDecode(b));
        for (let r = 0; r < ROWS_24; r++) {
            for (let c = 0; c < COLS_80; c++) {
                if (diffCell(ga[r][c], gb[r][c])) return false;
            }
        }
        return true;
    }

    const segments = normalizeSession(sessionData).segments;

    // Per-boundary C-side capture, preserving the boundary structure
    // (we need turn-fully-matched, not just flattened call equality).
    const cSteps = [];      // [{rng:[…calls], events:[…lines], maps:[…lines], screen}]
    for (const seg of segments) {
        for (const step of seg.steps || []) {
            cSteps.push({
                rng: extractRngCalls(step.rng),
                events: extractEvents(step.rng),
                maps: extractMaps(step.rng),
                screen: step.screen ?? null,
            });
        }
    }
    const cRngFlat = cSteps.flatMap(s => s.rng);
    const cEventsFlat = cSteps.flatMap(s => s.events);
    const cMapsFlat = cSteps.flatMap(s => s.maps);

    // Replay JS port. Capture the same way ps_test_runner does: flat
    // logs from getRngLog/getScreens, then re-bucket into per-boundary
    // slices using cumulative-length pointers from the C side. This
    // assumes the JS port emits a flat log corresponding 1:1 to C's
    // flat log; if that assumption breaks for events specifically, the
    // event column will read low — that itself is a useful signal.
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
        jsError = e.message;
    }

    let jsRngFlat = [];
    let jsEventsFlat = [];
    let jsMapsFlat = [];
    let jsScreens = [];
    if (game) {
        const log = (game.getRngLog() || []).map(e => e.replace(/^\d+\s+/, ''));
        jsRngFlat = log.filter(isRngCall);
        jsEventsFlat = log.filter(isEventLine);
        jsMapsFlat = log.filter(isMapLine);
        jsScreens = game.getScreens() || [];
    }

    // Build cumulative-length boundaries over the C side, then walk
    // both flat logs in parallel checking per-boundary equality.
    // For each channel, only boundaries where C emitted at least one
    // entry are "active" for that channel. turnsFully counts active
    // boundaries where every entry matched. A boundary with 0 entries
    // is irrelevant to this channel — don't credit it as matched.
    function bucket(cFlat, jsFlat, perStepCounts) {
        let total = 0;
        let matched = 0;
        let turnsFully = 0;
        let activeTurns = 0;
        let p = 0;
        for (const n of perStepCounts) {
            if (n === 0) continue;
            activeTurns++;
            let stepFully = true;
            for (let k = 0; k < n; k++, p++) {
                total++;
                const c = (cFlat[p] || '').toString();
                const j = (jsFlat[p] || '').toString();
                if (normalizeRng(c) === normalizeRng(j) && c !== '') matched++;
                else stepFully = false;
            }
            if (stepFully) turnsFully++;
        }
        return { matched, total, turnsFully, activeTurns };
    }

    const pCounts = cSteps.map(s => s.rng.length);
    const eCounts = cSteps.map(s => s.events.length);
    const mCounts = cSteps.map(s => s.maps.length);

    const p = bucket(cRngFlat, jsRngFlat, pCounts);
    const e = bucket(cEventsFlat, jsEventsFlat, eCounts);
    const m = bucket(cMapsFlat, jsMapsFlat, mCounts);

    // Screens are one per boundary; "fully matched" == "screen matched".
    const screenTotal = cSteps.length;
    let screenMatched = 0;
    for (let i = 0; i < screenTotal; i++) {
        const cs = cSteps[i].screen ?? '';
        const js = jsScreens[i] ?? '';
        if (cs && screensVisuallyEqual(js, cs)) screenMatched++;
    }

    return {
        session: basename(sessionPath),
        error: jsError,
        p,
        s: { matched: screenMatched, total: screenTotal },
        e,
        m,
        eHasData: cEventsFlat.length > 0,
        mHasData: cMapsFlat.length > 0,
    };
}

// ---- table formatting ----

function fmtChannel(prefix, ch) {
    return `${prefix}:(${ch.turnsFully})${ch.matched}/${ch.total}`;
}

function fmtSessionLine(name, r, padTo) {
    const padded = name.padEnd(padTo, ' ');
    if (r.error) {
        return `${padded}  p:err  s:err  e:err  m:err   (${r.error.slice(0, 60)})`;
    }
    const pCol = fmtChannel('p', r.p);
    const sCol = `s:(${r.s.matched})${r.s.matched}/${r.s.total}`;
    const eCol = r.eHasData ? fmtChannel('e', r.e) : 'e:-';
    const mCol = r.mHasData ? fmtChannel('m', r.m) : 'm:-';
    return `${padded}  ${pCol.padEnd(22, ' ')}${sCol.padEnd(18, ' ')}${eCol.padEnd(18, ' ')}${mCol}`;
}

function fmtTotal(results) {
    const sum = (arr, f) => arr.reduce((a, r) => a + (r.error ? 0 : f(r)), 0);
    const N = results.length;

    // Aggregate turnsFully and activeTurns across all sessions, plus
    // matched/total. Sessions with no data on a channel (eHasData=false)
    // contribute zero to all sums.
    const aggregate = (key) => {
        const turnsFully = sum(results, r => r[key].turnsFully || 0);
        const activeTurns = sum(results, r => r[key].activeTurns || 0);
        const matched = sum(results, r => r[key].matched || 0);
        const total = sum(results, r => r[key].total || 0);
        return { turnsFully, activeTurns, matched, total };
    };

    const p = aggregate('p');
    const e = aggregate('e');
    const m = aggregate('m');
    const sMatched = sum(results, r => r.s.matched);
    const sTotal = sum(results, r => r.s.total);
    const sFullSessions = results.filter(r => !r.error && r.s.total > 0 && r.s.matched === r.s.total).length;
    const sAnySessions = results.filter(r => !r.error && r.s.total > 0).length;

    const fmt = (label, ch) =>
        ch.activeTurns > 0
            ? `${label}:(${ch.turnsFully}/${ch.activeTurns}) ${ch.matched}/${ch.total}`
            : `${label}:-`;

    const eCol = results.some(r => !r.error && r.eHasData) ? fmt('e', e) : 'e:-';
    const mCol = results.some(r => !r.error && r.mHasData) ? fmt('m', m) : 'm:-';

    const padded = 'TOTAL'.padEnd(longestName(results), ' ');
    return `${padded}  ${fmt('p', p).padEnd(28, ' ')}s:(${sFullSessions}/${sAnySessions}) ${sMatched}/${sTotal}    ${eCol}    ${mCol}`;
}

function longestName(results) {
    return Math.max(40, ...results.map(r => (r.session || '').replace(/\.session\.json$/, '').length));
}

// ---- session resolution + parent-mode orchestration ----

function resolveSessionFiles(target) {
    const path = target.startsWith('/') ? target : join(PROJECT_ROOT, target);
    if (!existsSync(path)) throw new Error(`Not found: ${target}`);
    const st = statSync(path);
    const out = [];
    if (st.isFile() && path.endsWith('.session.json')) out.push(path);
    else if (st.isDirectory()) {
        for (const f of readdirSync(path)) {
            if (f.endsWith('.session.json')) out.push(join(path, f));
        }
    }
    return out.sort();
}

async function main() {
    const args = process.argv.slice(2);

    // Worker mode — run one session, emit single-result JSON.
    const workerArg = args.find(a => a.startsWith('--worker-session='));
    if (workerArg) {
        // Overlay frozen files like frozen/score.sh does. Mirrors the
        // judge's environment so local scoring matches official scoring.
        try {
            const fr = join(PROJECT_ROOT, 'frozen');
            const js = join(PROJECT_ROOT, 'js');
            for (const f of ['isaac64.js', 'terminal.js']) {
                const src = join(fr, f);
                const dst = join(js, f);
                if (existsSync(src)) writeFileSync(dst, readFileSync(src));
            }
        } catch (_) { /* best-effort */ }

        const result = await runOneSession(workerArg.slice('--worker-session='.length));
        process.stdout.write('__TABLE_RESULT_ONE__\n');
        process.stdout.write(JSON.stringify(result));
        return;
    }

    // Parent mode — fan out subprocesses, collect, format table.
    const target = args[0] || DEFAULT_SESSIONS_DIR;
    const sessionFiles = resolveSessionFiles(target);
    if (sessionFiles.length === 0) {
        process.stderr.write('No session files found.\n');
        process.exit(1);
    }

    const timeoutMs = Number(process.env.SESSION_REPLAY_TIMEOUT_MS || 60000);
    const results = [];
    for (const sf of sessionFiles) {
        const sessionName = basename(sf).replace(/\.session\.json$/, '');
        process.stderr.write(`  scoring ${sessionName} ... `);
        const child = spawnSync(process.execPath, [SCRIPT_PATH, `--worker-session=${sf}`], {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            timeout: timeoutMs,
            maxBuffer: 64 * 1024 * 1024,
        });

        let result;
        if (child.error || (child.status ?? 0) !== 0) {
            const err = child.error?.message || (child.stderr || '').trim().split('\n').slice(-1)[0] || `exit ${child.status}`;
            result = {
                session: basename(sf),
                error: err,
                p: { matched: 0, total: 0, turnsFully: 0, totalTurns: 0 },
                s: { matched: 0, total: 0 },
                e: { matched: 0, total: 0, turnsFully: 0, totalTurns: 0 },
                m: { matched: 0, total: 0, turnsFully: 0, totalTurns: 0 },
                eHasData: false,
                mHasData: false,
            };
        } else {
            const out = child.stdout || '';
            const idx = out.lastIndexOf('__TABLE_RESULT_ONE__');
            if (idx < 0) {
                result = {
                    session: basename(sf),
                    error: 'worker output missing marker',
                    p: { matched: 0, total: 0, turnsFully: 0, totalTurns: 0 },
                    s: { matched: 0, total: 0 },
                    e: { matched: 0, total: 0, turnsFully: 0, totalTurns: 0 },
                    m: { matched: 0, total: 0, turnsFully: 0, totalTurns: 0 },
                    eHasData: false,
                    mHasData: false,
                };
            } else {
                result = JSON.parse(out.slice(idx + '__TABLE_RESULT_ONE__'.length).trim());
            }
        }
        results.push(result);
        const status = result.error
            ? `err`
            : `p:(${result.p.turnsFully})${result.p.matched}/${result.p.total} s:${result.s.matched}/${result.s.total}`;
        process.stderr.write(`${status}\n`);
    }

    const padTo = longestName(results);
    const lines = [];
    const header = '# parity table — see docs/ITERATION.md';
    lines.push(header);
    lines.push('');
    for (const r of results) {
        lines.push(fmtSessionLine(r.session.replace(/\.session\.json$/, ''), r, padTo));
    }
    lines.push('');
    lines.push(fmtTotal(results));

    let commit = 'unknown';
    try {
        commit = execSync('git rev-parse --short HEAD', { cwd: PROJECT_ROOT }).toString().trim();
    } catch (_) { /* not a checkout */ }
    lines.push('');
    lines.push(`# generated by scripts/score-table.mjs at ${new Date().toISOString()}  commit ${commit}`);

    const table = lines.join('\n') + '\n';
    process.stdout.write(table);

    try {
        const cache = join(PROJECT_ROOT, '.cache', 'score-table.txt');
        mkdirSync(dirname(cache), { recursive: true });
        writeFileSync(cache, table);
    } catch (e) {
        process.stderr.write(`(could not write .cache/score-table.txt: ${e.message})\n`);
    }
}

main().catch(e => {
    process.stderr.write(`Fatal: ${e.message}\n`);
    process.exit(1);
});
