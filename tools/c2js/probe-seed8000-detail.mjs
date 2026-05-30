// Capture seed8000 RNG by running the same flow as the test runner
// (jsmain runSegment), then locate the 4 mismatches vs recording.

import { readFileSync } from 'fs';

const sessionPath = 'sessions/seed8000-tourist-starter.session.json';
const sess = JSON.parse(readFileSync(sessionPath, 'utf-8'));
const seg = sess.segments[0];

const { normalizeSession } = await import('../../frozen/session_loader.mjs');
const normalized = normalizeSession(sess);
const inputSeg = normalized.segments[0];
const input = {
    seed: inputSeg.seed,
    datetime: inputSeg.datetime,
    nethackrc: inputSeg.nethackrc,
    moves: inputSeg.moves,
};

const { runSegment } = await import('../../js/jsmain.js');
const game = await runSegment(input, null);

const rngLog = game.getRngLog() || [];
const jsRng = rngLog.map(e => e.replace(/^\d+\s+/, '')).filter(s => /^(rn2|rnd|rne|rnz|rnl)\b/.test(s));

const cRng = [];
for (const step of seg.steps) {
    for (const r of step.rng || []) cRng.push(r);
}

console.log(`jsRng length: ${jsRng.length}, cRng length: ${cRng.length}`);

// Normalize: drop result and source-attribution.
const norm = (s) => s.replace(/=.*?(?: @ .*)?$/, '').replace(/=.*$/, '').replace(/ @ .*$/, '');

const total = Math.min(jsRng.length, cRng.length);
let matched = 0;
const mismatches = [];
for (let i = 0; i < total; i++) {
    if (norm(cRng[i]) === norm(jsRng[i])) matched++;
    else mismatches.push({ i, ours: jsRng[i], rec: cRng[i] });
}
console.log(`Matched: ${matched}/${total}`);
console.log(`Mismatches (first 20):`);
for (const m of mismatches.slice(0, 20)) {
    console.log(`  [${m.i}] ours=${m.ours.padEnd(40)} rec=${m.rec}`);
}
console.log('\nOurs at 3100-3135:');
for (let i = 3100; i < Math.min(3135, jsRng.length); i++) console.log(`  [${i}] ${jsRng[i]}`);
console.log('\nOurs at 3225-3228 (extra calls):');
for (let i = Math.max(0, jsRng.length - 5); i < jsRng.length; i++) console.log(`  [${i}] ${jsRng[i]}`);
