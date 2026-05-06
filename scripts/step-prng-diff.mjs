#!/usr/bin/env node
// step-prng-diff.mjs — Per-step PRNG match diagnostic for finding
// coupled-bug regressions.
//
// score-table.mjs counts step boundaries where every PRNG call within a
// step matches in order (the p:(turnsFully) column).  When a C-faithful
// fix advances the FIRST divergence but breaks a previously-matched
// downstream step, AGENTS.md §5.4 says "DO NOT REVERT — find the
// coupled bug."  This script makes that easier:  it walks the C and JS
// PRNG flat logs in parallel, slices them by per-step counts, and
// reports each step's match status so you can pinpoint which step lost
// alignment.
//
// Usage:
//   node scripts/step-prng-diff.mjs <session-name>           # show all steps
//   node scripts/step-prng-diff.mjs <session> --matched      # only fully-matched steps
//   node scripts/step-prng-diff.mjs <session> --diverged     # only diverged steps
//   node scripts/step-prng-diff.mjs <session> --range=<a>..<b>  # step index range
//
// Per-step lines:
//   step N  n=<calls>  p=<flat-start>  ✓ fully       (every call matched)
//   step N  n=<calls>  p=<flat-start>  ✗ diverge@k=<offset>  C:<call>  JS:<call>
//
// Exit code: 0 if all active steps fully match, 1 if any diverged, 2 on error.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SESSIONS_DIR = join(PROJECT_ROOT, 'sessions');

function isRngCall(entry) {
    return typeof entry === 'string'
        && /^(?:rn2|rnd|rn1|rnl|rne|rnz|d)\(/.test(entry);
}

function normalizeRng(entry) {
    return String(entry).replace(/\s*@\s.*$/, '').replace(/^\d+\s+/, '').trim();
}

function resolveSession(arg) {
    if (arg.endsWith('.session.json')) return arg;
    const direct = join(SESSIONS_DIR, arg + '.session.json');
    if (existsSync(direct)) return direct;
    return arg;
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('usage: step-prng-diff.mjs <session> [--matched|--diverged] [--range=a..b]');
        process.exit(2);
    }
    const sessionArg = args[0];
    const showMatched = !args.includes('--diverged');
    const showDiverged = !args.includes('--matched');
    let rangeLo = 0, rangeHi = Infinity;
    for (const a of args) {
        const m = a.match(/^--range=(\d+)\.\.(\d+)$/);
        if (m) { rangeLo = +m[1]; rangeHi = +m[2]; }
    }

    const sessionPath = resolveSession(sessionArg);
    const sessionData = JSON.parse(readFileSync(sessionPath, 'utf8'));
    const { normalizeSession } = await import(join(PROJECT_ROOT, 'frozen/session_loader.mjs'));
    const { runSegment } = await import(join(PROJECT_ROOT, 'js/jsmain.js'));
    const segments = normalizeSession(sessionData).segments;

    // Flatten C-side: per-step PRNG calls.
    const cSteps = [];
    for (const seg of segments) {
        for (const step of seg.steps || []) {
            const rng = (step.rng || []).filter(isRngCall);
            cSteps.push(rng);
        }
    }
    const cFlat = cSteps.flat();

    // Run JS port and collect its flat RNG log.
    let game;
    try {
        for (const seg of segments) {
            game = await runSegment({
                seed: seg.seed,
                datetime: seg.datetime,
                nethackrc: seg.nethackrc,
                moves: seg.moves || ''
            }, game);
        }
    } catch (e) {
        console.error('JS error:', e.message);
        process.exit(2);
    }
    const jsFlat = (game.getRngLog() || []).filter(isRngCall);

    let p = 0;
    let activeSteps = 0;
    let fullyMatched = 0;
    let anyDiverged = false;
    for (let stepIdx = 0; stepIdx < cSteps.length; stepIdx++) {
        const n = cSteps[stepIdx].length;
        if (n === 0) continue;
        activeSteps++;
        let firstDiverge = -1;
        let mismatchC = '', mismatchJs = '';
        for (let k = 0; k < n; k++) {
            const c = (cFlat[p + k] || '').toString();
            const j = (jsFlat[p + k] || '').toString();
            if (normalizeRng(c) !== normalizeRng(j)) {
                if (firstDiverge < 0) {
                    firstDiverge = k;
                    mismatchC = c;
                    mismatchJs = j;
                }
            }
        }
        const inRange = stepIdx >= rangeLo && stepIdx <= rangeHi;
        if (inRange) {
            if (firstDiverge < 0 && showMatched) {
                fullyMatched++;
                console.log(`step ${stepIdx.toString().padStart(4)}  n=${n.toString().padStart(4)}  p=${p.toString().padStart(6)}  ✓ fully`);
            } else if (firstDiverge >= 0 && showDiverged) {
                anyDiverged = true;
                console.log(`step ${stepIdx.toString().padStart(4)}  n=${n.toString().padStart(4)}  p=${p.toString().padStart(6)}  ✗ diverge@k=${firstDiverge}  C:${normalizeRng(mismatchC)}  JS:${normalizeRng(mismatchJs)}`);
            }
        }
        p += n;
    }
    console.log(`\nactive steps: ${activeSteps}  fully matched: ${fullyMatched}  diverged: ${activeSteps - fullyMatched}`);
    process.exit(anyDiverged ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
