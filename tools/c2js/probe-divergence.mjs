// Run newgame with a chosen session's seed/options, capture our
// engine's RNG sequence, and report the first divergence point vs
// the recorded RNG calls.  Usage:
//   node tools/c2js/probe-divergence.mjs <session.json>
//
// Parses role / race / gender / align from the session's nethackrc
// (which mirrors the C-side OPTIONS that the recorder used).

import { game } from '../../js/gstate.js';
import { initRng, enableRngLog, getRngLog } from '../../js/rng.js';
import { readFileSync } from 'fs';

const sessionPath = process.argv[2];
if (!sessionPath) {
    console.error('Usage: probe-divergence.mjs <session.json>');
    process.exit(1);
}
const sess = JSON.parse(readFileSync(sessionPath, 'utf-8'));
const seg = sess.segments[0];
const seed = seg.seed;

// Parse nethackrc OPTIONS for role/race/gender/align.
const opts = {};
for (const line of seg.nethackrc.split('\n')) {
    const m = line.match(/^OPTIONS=(.*)$/);
    if (!m) continue;
    for (const kv of m[1].split(',')) {
        const [k, v] = kv.split(':');
        if (v !== undefined) opts[k.trim()] = v.trim();
    }
}

const role = opts.role || 'Tourist';
const race = opts.race || 'human';
const align = opts.align || 'neutral';
const gender = opts.gender || 'female';
const plname = opts.name || 'Hero';

console.log(`Session: ${sessionPath}`);
console.log(`  seed=${seed} role=${role} race=${race} gender=${gender} align=${align} plname=${plname}`);

// First import allmain so the module-load top-level code runs and
// game.flags is populated (otherwise our settings get clobbered).
const { newgame } = await import('../../js/allmain.js');

initRng(seed);
game.flags = game.flags || {};
game.flags.female = (gender === 'female');
if (opts.playmode === 'debug') game.flags.debug = 1;
game._optsRole = role;
game._optsRace = race;
game._optsAlign = align;
game.plname = plname;

enableRngLog();
let err = null;
try {
    await newgame();
} catch (e) {
    err = e;
}
const ours = getRngLog();
console.log(`Our log length: ${ours.length}${err ? ' (newgame errored: ' + err.message.split('\n')[0] + ')' : ''}`);

const recRng = seg.steps[0].rng;
console.log(`Recording length (step 0): ${recRng.length}`);

let div = -1;
for (let i = 0; i < Math.min(ours.length, recRng.length); i++) {
    const ourCall = ours[i].replace(/=.*$/, '');
    const recCall = recRng[i].replace(/=.*$/, '').replace(/ @ .*$/, '');
    if (ourCall !== recCall) { div = i; break; }
}

if (div === -1) {
    console.log('All', Math.min(ours.length, recRng.length), 'calls match.');
} else {
    console.log(`\nFirst divergence at index ${div}:`);
    for (let i = Math.max(0, div - 5); i <= Math.min(ours.length, recRng.length, div + 10); i++) {
        const o = ours[i] || '<MISSING>';
        const r = recRng[i] || '<MISSING>';
        const marker = i === div ? '<<<' : '   ';
        console.log(`  [${i}] ${marker} ours=${o.padEnd(40)} rec=${r}`);
    }
}
