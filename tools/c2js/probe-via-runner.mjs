// Run a session through the proper runner (jsmain.runSegment) and
// dump the engine's RNG sequence at the divergence point with the
// recording.
import { readFileSync } from 'fs';
import { runSegment } from '../../js/jsmain.js';

const sessionPath = process.argv[2];
if (!sessionPath) { console.error('usage'); process.exit(1); }
const sess = JSON.parse(readFileSync(sessionPath, 'utf-8'));
const { normalizeSession } = await import('../../frozen/session_loader.mjs');
const norm = normalizeSession(sess);
const seg = norm.segments[0];

const game = await runSegment({
    seed: seg.seed,
    datetime: seg.datetime,
    nethackrc: seg.nethackrc,
    moves: seg.moves,
}, null);

const rngLog = game.getRngLog() || [];
const jsRng = rngLog.map(e => e.replace(/^\d+\s+/, '')).filter(s => /^(?:rn2|rnd|rn1|rnl|rne|rnz|d)\(/.test(s));

const cRng = [];
for (const step of sess.segments[0].steps) for (const r of step.rng||[]) cRng.push(r);

const norm2 = (s) => s.replace(/=.*$/, '').replace(/ @ .*$/, '');

let firstDiv = -1;
for (let i = 0; i < Math.min(jsRng.length, cRng.length); i++) {
    if (norm2(cRng[i]) !== norm2(jsRng[i])) { firstDiv = i; break; }
}
console.log(`jsRng=${jsRng.length} cRng=${cRng.length} first divergence at: ${firstDiv}`);
const startArg = process.argv.find(a => a.startsWith('--start='));
const endArg = process.argv.find(a => a.startsWith('--end='));
const start = startArg ? parseInt(startArg.split('=')[1]) : (firstDiv >= 0 ? Math.max(0, firstDiv - 4) : 0);
const end = endArg ? parseInt(endArg.split('=')[1]) : (firstDiv >= 0 ? firstDiv + 8 : 0);
if (firstDiv >= 0 || startArg) {
    for (let i = Math.max(0, start); i < Math.min(end, jsRng.length, cRng.length); i++) {
        const m = i === firstDiv ? '<<<' : '   ';
        console.log(`  [${i}] ${m} ours=${jsRng[i].padEnd(40)} rec=${cRng[i]}`);
    }
}
