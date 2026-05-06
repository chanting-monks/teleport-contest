#!/usr/bin/env node
// screen-diff.mjs — Per-screen cell-level diff for finding which row
// of the 24x80 grid breaks each screen mismatch.
//
// score-table.mjs reports s:(matched/total) per session but doesn't
// say WHERE each unmatched screen differs.  This script renders both
// C and JS screens for a given session, and for every mismatched
// screen reports the first row+col where cells differ — letting you
// pinpoint whether the gap is status bar (rows 22-23), message
// (row 0), map (rows 1-21), or some specific cell.
//
// Usage:
//   node scripts/screen-diff.mjs <session> [step-index]
//   node scripts/screen-diff.mjs seed0006-wizard-water-demon         # all screens
//   node scripts/screen-diff.mjs seed0006-wizard-water-demon 35      # one screen detail
//   node scripts/screen-diff.mjs seed0006-wizard-water-demon --diverged-only
//
// Output:
//   step N  ✓ match
//   step N  ✗ row=R col=C  C:'<chars>' JS:'<chars>'  hint=<status|message|map>
//
// Exit code: 0 if all match, 1 on any divergence, 2 on error.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SESSIONS_DIR = join(PROJECT_ROOT, 'sessions');

function preDecode(s) {
    let cur = String(s);
    cur = cur.replace(/Version\s+\d+\.\d+\.\d+[^\n]*/, '<<VERSION_BANNER>>');
    cur = cur.replace(/^\d{2}:\d{2}:\d{2}\.$/gm, '<time>.');
    return cur;
}

function rowHint(r) {
    if (r === 0) return 'message';
    if (r === 1) return 'message-or-more';
    if (r === 22 || r === 23) return 'status';
    if (r >= 2 && r <= 21) return 'map';
    return 'unknown';
}

function resolveSession(arg) {
    if (arg.endsWith('.session.json')) return arg;
    const direct = join(SESSIONS_DIR, arg + '.session.json');
    if (existsSync(direct)) return direct;
    return arg;
}

function showRow(grid, r) {
    let line = '';
    for (let c = 0; c < 80; c++) line += grid[r][c].ch;
    return line.replace(/\s+$/, '');
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('usage: screen-diff.mjs <session> [step-index|--diverged-only]');
        process.exit(2);
    }
    const sessionArg = args[0];
    let stepFilter = null;
    let divergedOnly = false;
    for (const a of args.slice(1)) {
        if (a === '--diverged-only') divergedOnly = true;
        else if (/^\d+$/.test(a)) stepFilter = parseInt(a);
    }

    const sessionPath = resolveSession(sessionArg);
    const sessionData = JSON.parse(readFileSync(sessionPath, 'utf8'));
    const { normalizeSession } = await import(join(PROJECT_ROOT, 'frozen/session_loader.mjs'));
    const { decodeScreen, diffCell } = await import(join(PROJECT_ROOT, 'frozen/screen-decode.mjs'));
    const { runSegment } = await import(join(PROJECT_ROOT, 'js/jsmain.js'));
    const segments = normalizeSession(sessionData).segments;

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

    const cScreens = segments.flatMap(s => (s.steps || []).map(x => x.screen ?? ''));
    const jsScreens = game.getScreens();

    let anyDiverged = false;
    let totalSteps = 0, matched = 0;
    for (let i = 0; i < cScreens.length; i++) {
        if (stepFilter !== null && i !== stepFilter) continue;
        totalSteps++;
        const ga = decodeScreen(preDecode(cScreens[i] || ''));
        const gb = decodeScreen(preDecode(jsScreens[i] || ''));
        let firstDiffRow = -1, firstDiffCol = -1;
        for (let r = 0; r < 24 && firstDiffRow < 0; r++) {
            for (let c = 0; c < 80 && firstDiffRow < 0; c++) {
                if (diffCell(ga[r][c], gb[r][c])) {
                    firstDiffRow = r;
                    firstDiffCol = c;
                }
            }
        }
        if (firstDiffRow < 0) {
            matched++;
            if (!divergedOnly) console.log(`step ${i.toString().padStart(4)}  ✓ match`);
        } else {
            anyDiverged = true;
            const cRow = showRow(ga, firstDiffRow).slice(0, 50);
            const jRow = showRow(gb, firstDiffRow).slice(0, 50);
            const hint = rowHint(firstDiffRow);
            console.log(`step ${i.toString().padStart(4)}  ✗ r=${firstDiffRow} c=${firstDiffCol}  hint=${hint}`);
            if (stepFilter !== null) {
                console.log(`           C:  ${cRow}`);
                console.log(`           JS: ${jRow}`);
            }
        }
    }
    console.log(`\nscreens: ${matched}/${totalSteps} matched`);
    process.exit(anyDiverged ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
