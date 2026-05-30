// Capture our JS RNG sequence around the divergence point and compare
// to the recording.

import { game } from '../../js/gstate.js';
import { initRng, enableRngLog, getRngLog } from '../../js/rng.js';
import { newgame } from '../../js/allmain.js';
import { readFileSync } from 'fs';

initRng(8000);
game.flags = game.flags || {};
game.flags.female = true;
game._optsRole = 'Tourist';
game._optsRace = 'human';
game._optsAlign = 'neutral';
game.plname = 'Hero';

enableRngLog();
try { await newgame(); } catch (e) { console.log('newgame error:', e.message); }
const ours = getRngLog();
console.log('Our log length:', ours.length);

const rec = JSON.parse(readFileSync('sessions/seed8000-tourist-starter.session.json', 'utf-8'));
const recRng = rec.segments[0].steps[0].rng;

// Find first divergence.
let div = -1;
for (let i = 0; i < Math.min(ours.length, recRng.length); i++) {
    // Compare just the call signature (rn2(N)) without =result
    const ourCall = ours[i].replace(/=.*$/, '');
    const recCall = recRng[i].replace(/=.*$/, '').replace(/ @ .*$/, '');
    if (ourCall !== recCall) { div = i; break; }
}

if (div === -1) {
    console.log('No divergence in first', Math.min(ours.length, recRng.length), 'calls');
} else {
    console.log(`First divergence at index ${div}:`);
    for (let i = Math.max(0, div - 5); i <= Math.min(ours.length, recRng.length, div + 10); i++) {
        const o = ours[i] || '<MISSING>';
        const r = recRng[i] || '<MISSING>';
        const marker = i === div ? '<<<' : '   ';
        console.log(`  [${i}] ${marker} ours=${o.padEnd(40)} rec=${r}`);
    }
}
