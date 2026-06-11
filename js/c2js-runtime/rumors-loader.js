// rumors-loader.js — register the pre-compiled rumors / engrave /
// epitaph bundle with the runtime rumors module on first import.
//
// Without this, registerRumorsData is never called during a normal
// engine startup, so getrumor returns an empty buffer and skips the
// rn2 calls C makes when reading from the data file.  PRNG-faithful
// callers (random_engraving, ...) need that RNG to fire.
//
// Pre-compilation runs offline via
// `tools/c2js/build-rumors-bundle.mjs`, which processes the four
// data files (rumors.tru, rumors.fal, engrave.txt, epitaph.txt)
// the same way the C makedefs build does — strip '#' / '^' / blank
// lines, padline to MD_PAD_RUMORS=60, prepend the per-section
// default — and writes the pre-processed arrays into
// `./rumors-bundle.js`.  At runtime we only import that module — no
// filesystem touches to `nethack-c/upstream/dat/`.  See LEARNINGS
// §23.202 part B.
//
// Idempotent (registers once per process).

import { registerRumorsData } from './rumors.js';
import { RUMORS_BUNDLE } from './rumors/_index.js';

let _loaded = false;
export function ensureRumorsLoaded() {
    if (_loaded) return;
    _loaded = true;
    if (typeof process !== 'undefined' && process.env && process.env.PHASE_TRACE) {
        console.error(`[rumors-loader] tru=${RUMORS_BUNDLE.trueLines.length} fal=${RUMORS_BUNDLE.falseLines.length} eng=${RUMORS_BUNDLE.engraveLines.length} epi=${RUMORS_BUNDLE.epitaphLines.length}`);
    }
    registerRumorsData({
        trueLines:    RUMORS_BUNDLE.trueLines,
        falseLines:   RUMORS_BUNDLE.falseLines,
        engraveLines: RUMORS_BUNDLE.engraveLines,
        epitaphLines: RUMORS_BUNDLE.epitaphLines,
    });
}
