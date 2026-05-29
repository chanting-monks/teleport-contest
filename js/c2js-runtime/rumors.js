// rumors.js — runtime override for src/rumors.c.
//
// The translated rumors.c uses libc-shaped file primitives
// (fopen/fseek/ftell/fgets/fclose) plus a `sscanf`-driven header
// parser, none of which fit a clean JS port.  Rather than wire up
// a virtual filesystem, this runtime replaces those four entry
// points with PRNG-faithful implementations that consume the
// rumors data as in-memory structured tables.
//
// The translator's EXTERNAL_SYMBOLS map wires `getrumor`,
// `init_rumors`, `get_rnd_line`, and `get_rnd_text` to this module
// so the rest of the engine (random_engraving, getrumor callers,
// etc.) imports the runtime versions instead of the broken
// translated forms.
//
// Data tables are populated by the harness's `registerRumorsData`
// call, which preprocesses dat/rumors.tru, dat/rumors.fal,
// dat/engrave, dat/epitaph the same way util/makedefs.c does:
// pad each line with `_` to MD_PAD_RUMORS (60), keep lines that
// already exceed the pad length unchanged.  We don't apply
// xcrypt — there's no need for the cipher when the data lives
// in-process.
//
// PRNG-faithful semantics: get_rnd_line mirrors C's loop in
// src/rumors.c:444-481 — up to 10 tries, each calling rng with
// the chunk size, until the line at the chosen offset is short
// enough.  Then "use the next line".

let _trueLines = [];
let _falseLines = [];
let _engraveLines = [];
let _epitaphLines = [];

// Cumulative byte-size of each section (offset of next-section
// start within a hypothetical concatenated buffer).  Each line
// carries its own padded length (including the implicit trailing
// newline) so a uniform random offset into the section maps to
// (line, position-within-line) the same way fseek+fgets would.
let _trueSize = 0;
let _falseSize = 0;
let _engraveSize = 0;
let _epitaphSize = 0;

function totalLen(lines) {
    let n = 0;
    for (const ln of lines) n += ln.length + 1; // +1 for newline
    return n;
}

export function registerRumorsData({ trueLines = [], falseLines = [],
                                     engraveLines = [], epitaphLines = [] }) {
    _trueLines = trueLines;
    _falseLines = falseLines;
    _engraveLines = engraveLines;
    _epitaphLines = epitaphLines;
    _trueSize = totalLen(_trueLines);
    _falseSize = totalLen(_falseLines);
    _engraveSize = totalLen(_engraveLines);
    _epitaphSize = totalLen(_epitaphLines);
    // Expose sizes on the game object so callers checking
    // `game.true_rumor_size` see the populated values.
    const game = globalThis.__nh_gameRef;
    if (game) {
        game.true_rumor_size = _trueSize;
        game.true_rumor_start = 0;
        game.true_rumor_end = _trueSize;
        game.false_rumor_size = _falseSize;
        game.false_rumor_start = 0;
        game.false_rumor_end = _falseSize;
    }
}

// Helper: walk lines summing lengths until we cover the offset.
// Returns { line, posInLine, lineLen } where lineLen includes
// the trailing newline.
function landOffset(lines, offset) {
    let cum = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i].length + 1;
        if (offset < cum + lineLen) {
            return { idx: i, posInLine: offset - cum, lineLen };
        }
        cum += lineLen;
    }
    // Past the end — clamp to last line.
    const i = lines.length - 1;
    return { idx: i, posInLine: 0, lineLen: lines[i].length + 1 };
}

// Strip trailing `_` padding (and any trailing newline) from a line.
// C ref rumors.c::unpadline (called by get_rnd_line at line 492).
// makedefs pads short rumor/engrave/epitaph lines to padlength with
// `_` chars so a random-offset seek lands evenly in long-and-short
// lines.  At runtime, after reading the chosen line, C strips both
// the trailing newline AND the `_` padding before returning, so the
// caller (random_engraving → wipeout_text) sees the ORIGINAL line
// length when computing rn2(strlen(engr)).  Without this strip, JS
// engr is the padded form: rn2(59) for a padded line whose original
// text was 48 chars — diverging from C's rn2(48) at every random
// rumor/engraving used (see seed0007 PRNG idx 1631+).
function unpadline(s) {
    let end = s.length;
    if (end > 0 && s.charCodeAt(end - 1) === 0x0A) end--;  // \n
    while (end > 0 && s.charCodeAt(end - 1) === 0x5F) end--;  // '_'
    return end < s.length ? s.slice(0, end) : s;
}

// Pick a random line from `lines` using `rng(N)` calls, mirroring
// src/rumors.c get_rnd_line():
//   for (trylimit = 10; trylimit > 0; --trylimit) {
//       chunkoffset = (long) (*rng)((int) filechunksize); ...
//   }
// 10 body iterations max — the for-update is post-body.
function pickRandomLine(lines, totalSize, rng, padlength) {
    if (lines.length === 0 || totalSize < 1) return '';
    let acceptedLineIdx = 0;
    // C is `for (trylimit = 10; trylimit > 0; --trylimit)` — the
    // for-update runs AFTER the body, so trylimit takes the values
    // 10, 9, …, 1 inside the body (10 iterations).  An earlier
    // comment here claimed C used pre-decrement so the body ran
    // only 9 times; that misread the for-loop semantics.  Use the
    // for-loop form so JS matches C bit-for-bit, including the
    // worst-case all-fail path where C fires 10 rng() calls.
    for (let trylimit = 10; trylimit > 0; trylimit--) {
        const offset = rng(totalSize);
        const land = landOffset(lines, offset);
        const restLen = land.lineLen - land.posInLine;
        // C's first read consumes from offset to end-of-line.
        // We replicate the strlen check on that partial line.
        if (!padlength || restLen <= padlength + 1) {
            acceptedLineIdx = land.idx;
            break;
        }
        // No accept — retry; keep last seen idx as fallback.
        acceptedLineIdx = land.idx;
    }
    // C then reads the NEXT line via a fresh fgets; if at endpos
    // it wraps to the start.
    const nextIdx = (acceptedLineIdx + 1 < lines.length) ? acceptedLineIdx + 1 : 0;
    // C ref rumors.c:491-492 — `if (padlength) unpadline(buf);`
    // Strip trailing `_` so callers see the original line length.
    return padlength ? unpadline(lines[nextIdx]) : lines[nextIdx];
}

// init_rumors — translated C parses a header in the file; we
// already know the sizes from registerRumorsData.  No-op.
export function init_rumors(_fp) {
    // The harness pre-populates game.true_rumor_size and friends
    // when registerRumorsData fires, so the translated callers
    // skip the real init_rumors invocation.  This stub exists so
    // any direct invocation (rare) doesn't crash.
}

// get_rnd_line(fh, buf, bufsiz, rng, startpos, endpos, padlength)
// — the seek/read primitive used by getrumor and get_rnd_text.
// In our runtime, fh and startpos/endpos act as a section selector.
// We bind the section by (startpos, endpos) — the harness sets
// game.true_rumor_start/end and game.false_rumor_start/end so
// callers can pick the correct half.
export function get_rnd_line(_fh, buf, _bufsiz, rng, startpos, endpos, padlength) {
    const game = globalThis.__nh_gameRef;
    let lines = null;
    let totalSize = 0;
    if (game && startpos === game.true_rumor_start
        && endpos === game.true_rumor_end) {
        lines = _trueLines;
        totalSize = _trueSize;
    } else if (game && startpos === game.false_rumor_start
        && endpos === game.false_rumor_end) {
        lines = _falseLines;
        totalSize = _falseSize;
    } else {
        // Section unbound — fall back to true rumors.
        lines = _trueLines;
        totalSize = _trueSize;
    }
    const out = pickRandomLine(lines, totalSize, rng, padlength);
    writeToBuf(buf, out);
    return out;
}

// get_rnd_text(fname, buf, rng, padlength) — used for
// "engrave" and "epitaph" data files.  Picks a random line from
// the registered section and writes it into buf.
export function get_rnd_text(fname, buf, rng, padlength) {
    let lines = _engraveLines;
    let totalSize = _engraveSize;
    if (fname === 'epitaph' || fname === 'epitaphs') {
        lines = _epitaphLines;
        totalSize = _epitaphSize;
    }
    const out = pickRandomLine(lines, totalSize, rng, padlength);
    writeToBuf(buf, out);
    return out;
}

// getrumor(truth, rumor_buf, exclude_cookie) — picks true / false
// via rn2(2), then asks get_rnd_line for a random line until a
// non-cookie one is found (when exclude_cookie is set).  Mirrors
// C's getrumor in rumors.c:108-185.
export function getrumor(truth, rumor_buf, exclude_cookie) {
    const game = globalThis.__nh_gameRef;
    if (game && game.true_rumor_size < 0) {
        writeToBuf(rumor_buf, '');
        return rumor_buf;
    }
    if (_trueLines.length === 0 && _falseLines.length === 0) {
        // No data registered — fail soft.
        writeToBuf(rumor_buf, '');
        return rumor_buf;
    }
    // Need access to rn2.  Translated callers reach getrumor from
    // engrave.js which pulls rn2 from rnd.js.  We use globalThis.rn2
    // (the harness installs it during setup).
    const rn2fn = globalThis.rn2;
    if (typeof rn2fn !== 'function') {
        writeToBuf(rumor_buf, '');
        return rumor_buf;
    }
    const cookieMarker = '[cookie] ';
    let line = '';
    let count = 0;
    let adjtruth = 0;
    do {
        adjtruth = truth + rn2fn(2);
        const useFalse = adjtruth <= 0;
        const lines = useFalse ? _falseLines : _trueLines;
        const totalSize = useFalse ? _falseSize : _trueSize;
        line = pickRandomLine(lines, totalSize, rn2fn, 60);
    } while (count++ < 50 && exclude_cookie && line.startsWith(cookieMarker));
    // C ref rumors.c:159-162 — after picking a line, getrumor calls
    // exercise(A_WIS, adjtruth > 0) when not in_mklev.  exercise fires
    // rn2(19) — a PRNG advance every random rumor consumes.  The local
    // translated getrumor in rumors.js never reaches its exercise call
    // because fopen() autostubs to 0 and the function bails out, so the
    // PRNG drops three calls (rn2(2), rn2(filesz), rn2(19)) per
    // outrumor / artifact-whisper / random-engraving invocation.
    // Mirror C's PRNG-faithful semantics here via globalThis-installed
    // exercise (allmain.js wires it after rn2).
    if (count < 50 && globalThis.__nh_gameRef
        && !globalThis.__nh_gameRef.in_mklev
        && typeof globalThis.__nh_exercise === 'function') {
        globalThis.__nh_exercise(2 /* A_WIS */, adjtruth > 0);
    }
    // C ref rumors.c:180-189 — when exclude_cookie is FALSE and the
    // chosen line still starts with cookie_marker, strip the marker
    // from the returned string.  Without this, JS callers see the
    // "[cookie] " prefix (9 chars) which inflates strlen and shifts
    // downstream rn2(strlen) calls in wipeout_text by 9 positions
    // per random-engraving-via-cookie invocation.
    if (!exclude_cookie && line.startsWith(cookieMarker)) {
        line = line.slice(cookieMarker.length);
    }
    writeToBuf(rumor_buf, line);
    return line;
}

function writeToBuf(buf, str) {
    if (!Array.isArray(buf)) return;
    const s = String(str || '');
    for (let i = 0; i < s.length && i < buf.length; i++) buf[i] = s.charCodeAt(i);
    if (s.length < buf.length) buf[s.length] = 0;
}
