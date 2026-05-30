// probe-mklev-switch.mjs — Phase 6 step 6.1
//
// Investigates the translated mklev's call surface, state writes,
// and execution behavior in isolation.  Output goes to stdout for
// inclusion in docs/MKLEV_AUDIT.md.
//
// Run: node tools/c2js/probe-mklev-switch.mjs

import { game } from '../../js/gstate.js';
import { initRng } from '../../js/rng.js';
import { newgame } from '../../js/allmain.js';

initRng(8000);

game.flags = game.flags || {};
game.flags.female = true;
game._optsRole = 'Tourist';
game._optsRace = 'human';
game._optsAlign = 'neutral';
game.plname = 'Hero';

console.log('## A. Module-load surface\n');
const tmkl = await import('../../js/translated/mklev.js');
const exports = Object.keys(tmkl).sort();
console.log(`exports: ${exports.length}`);
for (const e of exports) console.log(`  - ${e}: ${typeof tmkl[e]}`);

console.log('\n## B. Engine state after newgame() — pre-translated-mklev\n');
await newgame();

const fmonCount = (() => {
    let n = 0;
    for (let m = game.fmon; m && n < 100; m = m.nmon, n++);
    return n;
})();
console.log(`game.moves            = ${game.moves}`);
console.log(`game.fmon list length = ${fmonCount}`);
console.log(`game.level.nroom      = ${game.level?.nroom ?? 'undefined'}`);
console.log(`game.level.rooms      = Array(${game.level?.rooms?.length ?? 0})`);
console.log(`game.nroom (top-lvl)  = ${game.nroom ?? 'undefined'}`);
console.log(`game.rooms (top-lvl)  = ${Array.isArray(game.rooms) ? `Array(${game.rooms.length})` : (game.rooms ? typeof game.rooms : 'undefined')}`);
console.log(`game.level.locations  = Array(${game.level?.locations?.length ?? 0})`);
console.log(`game.in_mklev         = ${game.in_mklev}`);
console.log(`game.u.uz             = ${JSON.stringify(game.u?.uz)}`);

console.log('\n## C. Translated mklev attempted (try/catch)\n');
let crashCount = 0;
let firstError = null;
try {
    tmkl.mklev();
    console.log('  COMPLETED without exception.');
} catch (e) {
    crashCount++;
    firstError = e;
    console.log(`  CRASHED: ${e.message}`);
    if (e.stack) console.log(`  ${e.stack.split('\n').slice(0, 5).join('\n  ')}`);
}

console.log('\n## D. State after translated mklev attempt\n');
const fmonAfter = (() => {
    let n = 0;
    for (let m = game.fmon; m && n < 100; m = m.nmon, n++);
    return n;
})();
console.log(`game.fmon list length = ${fmonAfter}`);
console.log(`game.level.nroom      = ${game.level?.nroom ?? 'undefined'}`);
console.log(`game.nroom            = ${game.nroom ?? 'undefined'}`);
console.log(`game.rooms count      = ${Array.isArray(game.rooms) ? game.rooms.length : (game.rooms ? typeof game.rooms : 'undefined')}`);
if (Array.isArray(game.rooms) && game.rooms.length) {
    console.log('  First 3 rooms (if any):');
    for (let i = 0; i < Math.min(3, game.rooms.length); i++) {
        const r = game.rooms[i];
        if (r) console.log(`    [${i}] lx=${r.lx} ly=${r.ly} hx=${r.hx} hy=${r.hy} rtype=${r.rtype}`);
    }
}

console.log('\n## E. Marker count in translated mklev (Phase 5 TODOs)\n');
const fs = await import('node:fs');
const mklevSrc = fs.readFileSync('js/translated/mklev.js', 'utf8');
const markerLines = mklevSrc.split('\n').map((l, i) => ({ l, n: i + 1 }))
    .filter(({ l }) => l.includes('TODO Phase 5'));
console.log(`markers: ${markerLines.length}`);
for (const { l, n } of markerLines) console.log(`  L${n}: ${l.trim()}`);

console.log('\n## F. Pointer-arithmetic sites (croom - game.rooms style)\n');
const ptrArith = mklevSrc.split('\n').map((l, i) => ({ l, n: i + 1 }))
    .filter(({ l }) => /\bcroom\s*-\s*game\.rooms\b|\bgame\.rooms\s*-\s*\w+/.test(l));
console.log(`sites: ${ptrArith.length}`);
for (const { l, n } of ptrArith) console.log(`  L${n}: ${l.trim()}`);
