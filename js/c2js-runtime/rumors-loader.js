// rumors-loader.js — auto-load NetHack data files (rumors, engrave,
// epitaph) into the runtime rumors module on first import.
//
// Without this, registerRumorsData is never called during a normal
// engine startup, so getrumor returns an empty buffer and skips the
// rn2 calls C makes when reading from the data file.  PRNG-faithful
// callers (random_engraving, ...) need that RNG to fire.
//
// Lookup strategy: search a few candidate locations for `dat/`,
// preferring `nethack-c/upstream/dat/` (the canonical contest copy)
// then falling back to `dat/` at the project root.  If neither
// exists (e.g. in a stripped browser build), register empty tables;
// callers fail soft.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { registerRumorsData } from './rumors.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(dirname(HERE)); // js/c2js-runtime → project root

const CANDIDATE_DIRS = [
    join(ROOT, 'nethack-c/upstream/dat'),
    join(ROOT, 'dat'),
];

const PAD = 60; // MD_PAD_RUMORS

function padline(body) {
    if (body.length + 1 >= PAD) return body;
    return body + '_'.repeat(PAD - body.length - 1);
}

// loadSection: mirror util/makedefs.c do_rnd_access_file processing.
// C ref makedefs.c:1127-1133 — for each input line, skip lines that
// start with '#' or '\n' (comment/blank), then padline(line, padlength).
// If a default content string is provided, prepend it (after padline'ing)
// to match makedefs.c:1113-1116 which writes the default unconditionally
// before iterating the input lines.  Without these two steps, the
// in-memory section length differs from the C-built binary's
// `filechunksize` and rumors.c:get_rnd_text's rn2(filechunksize) call
// disagrees with C at the very first text-table-driven roll
// (e.g. seed0104 mkgrave epitaph pull: rn2(24523) JS vs rn2(24075) C).
function loadSection(filename, defaultContent) {
    for (const dir of CANDIDATE_DIRS) {
        const p = join(dir, filename);
        if (existsSync(p)) {
            const src = readFileSync(p, 'utf8');
            const lines = src.split('\n');
            if (lines[lines.length - 1] === '') lines.pop();
            // C ref util/makedefs.c::do_rnd_access_file:1128 — strip
            // comment ('#') and blank lines.
            // C ref util/makedefs.c::grep0 / GREP_MAGIC = '^' —
            // makedefs runs the input through grep0() FIRST, which
            // intercepts lines starting with '^' as preprocessor-style
            // directives.  Most such directives (e.g. '^?MAIL', '^.')
            // resolve to "no output" via do_grep_control's default
            // path.  Strip them here so the engrave/epitaph chunk
            // size matches C's filechunksize (e.g. engrave: 2894 bytes
            // in C vs 3014 in our prior unfiltered JS).  Without this
            // strip, random_engraving's `rn2(engr_size)` diverged from
            // C at the first random engraving — surfaced as a 1196 P
            // gain on seed0116 and 84 P on seed0383.
            const filtered = lines.filter(l => l[0] !== '#' && l !== '' && l[0] !== '^');
            const padded = filtered.map(padline);
            if (defaultContent) {
                padded.unshift(padline(defaultContent));
            }
            return padded;
        }
    }
    return defaultContent ? [padline(defaultContent)] : [];
}

let _loaded = false;
export function ensureRumorsLoaded() {
    if (_loaded) return;
    _loaded = true;
    try {
        // Rumors true/false use a different file format (a single combined
        // file with header offsets, processed by do_rumors()) — leave the
        // comment-strip + default-prepend off until that path is wired
        // separately.  Engrave / epitaph / bogusmon use do_rnd_access_file
        // which strips comments and prepends a default.
        const tru = loadSection('rumors.tru');
        const fal = loadSection('rumors.fal');
        // C ref makedefs.c:427 — engrave default is the popular quote.
        const eng = loadSection('engrave.txt', 'No matter where you go, there you are.');
        // C ref makedefs.c:421 — epitaph default is the parody-engraving.
        const epi = loadSection('epitaph.txt', 'No matter where I went, here I am.');
        if (process.env.PHASE_TRACE) {
            console.error(`[rumors-loader] tru=${tru.length} fal=${fal.length} eng=${eng.length} epi=${epi.length}`);
        }
        registerRumorsData({
            trueLines: tru, falseLines: fal,
            engraveLines: eng, epitaphLines: epi,
        });
    } catch (e) {
        if (process.env.PHASE_TRACE) console.error('[rumors-loader] error:', e.message);
    }
}
