// hacklib-handports.js — idiomatic JS implementations for libc-style
// utilities in nethack-c/upstream/src/hacklib.c that don't translate
// cleanly via the AST translator.
//
// Functions here are wired into `js/translated/hacklib.js` via thin
// stubs that the translator emits when it sees the C function name +
// TU in `tools/c2js/c2js.config.mjs::HAND_PORTED_FUNCTIONS`.  The
// stub preserves the C function's verbatim comment + signature
// (spec §4 / §11), and the body is `return __nh_hp_<name>(...);`.
//
// This file is the source of truth for behavior of the listed
// functions.  Stay JS-faithful: take whatever shape the caller passes
// (JS string, char array, scalar-ptr wrapper) and coerce; never
// require a specific runtime container shape.

import { coerceCStr, strncmp, strncmpi } from './string.js';

// upwords(char *bp) — capitalize the first letter of every word in
// the string, where "word" is a run of letters preceded by start-of-
// string or whitespace.
//
// C source uses an in-place char-walker that sets a `space` flag,
// advances bp, and writes `*bp = highc(*bp)` at the first letter
// after each space.  Translator emit used charBufferRewrites indexed
// access (`s[i]` returns a 1-char STRING, not a byte code; comparisons
// against 32 fail), plus the uppercase write target was an undefined
// local `p` instead of `s` — silently returned input unchanged.
//
// Idiomatic JS: regex match start-of-string or whitespace followed
// by an ASCII letter, uppercase the letter.  C-faithful for all
// printable-ASCII input (NetHack's text doesn't include exotic
// whitespace).
export function __nh_hp_upwords(s) {
    if (s == null) return s;
    const str = coerceCStr(s);
    return str.replace(/(^|\s)([a-zA-Z])/g, (_, ws, letter) => ws + letter.toUpperCase());
}

// eos(char *s) — return end-of-string pointer (one past the last
// non-NUL byte).
//
// C source: `while (*s) s++; return s;`.  In JS the "true end"
// equivalent for a string is the empty-string suffix (s.slice(s.length)
// === ""), which is what the §23.222at cherry-pick using
// __nh_char_at0 + __nh_advance_str produces by walking through.
// This hand-port matches that semantic directly without the loop.
export function __nh_hp_eos(s) {
    if (s == null) return s;
    if (typeof s === 'string') return '';
    if (Array.isArray(s)) {
        for (let i = 0; i < s.length; i++) if (!s[i]) return s.slice(i);
        return s.slice(s.length);
    }
    return s;
}

export function __nh_hp_c_eos(s) {
    return __nh_hp_eos(s);
}

// xcrypt(const char *str, char *buf) — trivial text encryption.
// Walks input str, XORs each byte with a rotating bitmask (1, 2,
// 4, 8, 16 → 1 again), writes encrypted bytes into buf, returns
// buf.
//
// C source: `for (bitmask=1, p=str, q=buf; *p; q++) { *q = *p++;
//             if (*q & (32|64)) *q ^= bitmask;
//             if ((bitmask <<= 1) >= 32) bitmask = 1; } *q = 0;`
//
// Translator emit: charBufferRewrites indexed-access walker, fails
// when str is a JS string (str[i] returns a 1-char STRING, then
// `(string) & (32|64)` is NaN, XOR is NaN, write garbage).
//
// JS-faithful: read input as bytes via coerceCStr→charCodeAt; XOR
// bytes that have the 32 or 64 bit set with the rotating bitmask;
// return as JS string AND write into buf array for callers that
// depend on the side effect (engrave.js's `xcrypt(blengr(), de.buf)`
// discards the return value).
// strNsubst(inoutbuf, orig, replacement, n) — substitute the Nth
// occurrence of `orig` with `replacement` in inoutbuf (n=0 means
// substitute all).  Mutates inoutbuf in place when it's a char
// array; returns the count of substitutions made.
//
// C source: walks inoutbuf byte-by-byte into workbuf, replacing
// at each occurrence that hits ocount==n (or any if n==0).  Special
// case for orig=="": insert replacement BEFORE each char (n=0) or
// before the Nth char.  Truncates output to BUFSZ-1.
//
// Translator emit's charBufferRewrites indexed walker uses
// `inoutbuf[idx]` which on a string returns a 1-char STRING, and
// `replacement[__nh_rp_idx]` similarly returns a string — the inner
// `workbuf[__nh_op_idx++] = replacement[__nh_rp_idx++]` writes
// string-typed entries into a byte array, then the Strcpy(inoutbuf,
// workbuf) at the end re-coerces, but the intermediate is broken.
//
// Common callers: mhitm.js ("%" → "%%" escape), botl.js (clrbuf
// space-to-dash for color names).  Hand-port via JavaScript
// string operations is straightforward.
export function __nh_hp_strNsubst(inoutbuf, orig, replacement, n) {
    if (inoutbuf == null) return 0;
    const str = coerceCStr(inoutbuf);
    const origStr = orig == null ? '' : coerceCStr(orig);
    const replStr = replacement == null ? '' : coerceCStr(replacement);
    const origLen = origStr.length;
    let ocount = 0; // matches found
    let rcount = 0; // substitutions made (return value)
    let result = '';
    let i = 0;
    if (origLen === 0) {
        // orig == "": insert replacement before each char (n==0) or
        // before the Nth char.
        if (n === 0) {
            for (let k = 0; k < str.length; k++) {
                result += replStr;
                rcount++;
                result += str[k];
                ocount++;
            }
        } else {
            for (let k = 0; k < str.length; k++) {
                ocount++;
                if (ocount === n) { result += replStr; rcount++; }
                result += str[k];
            }
            // C special case: orig=="" and n == strlen(input)+1
            // (append at end).
            if (ocount + 1 === n) {
                result += replStr;
                rcount++;
                ocount++;
            }
        }
    } else {
        while (i < str.length) {
            if (str.startsWith(origStr, i)) {
                ocount++;
                if (n === 0 || ocount === n) {
                    result += replStr;
                    rcount++;
                    i += origLen;
                    continue;
                }
            }
            result += str[i++];
        }
    }
    // Truncate to BUFSZ-1 (= 255 chars).
    if (result.length > 255) result = result.slice(0, 255);
    // Write back to inoutbuf array if applicable (C also only
    // touches inoutbuf if rcount > 0; we always overwrite when
    // mutable, matching the safer behavior).
    if (Array.isArray(inoutbuf)) {
        for (let j = 0; j < result.length && j < inoutbuf.length; j++) {
            inoutbuf[j] = result.charCodeAt(j);
        }
        if (result.length < inoutbuf.length) inoutbuf[result.length] = 0;
    }
    return rcount;
}

// case_insensitive_comp(s1, s2) — lowercase-fold compare, returning
// strcmp-style negative / zero / positive based on first differing
// byte.  Used by date.js for case-insensitive month name lookup.
//
// C source: `for (;;) { u1 = tolower(*s1); u2 = tolower(*s2);
//   if (u1 == 0 || u1 != u2) break; s1++; s2++; } return u1-u2;`.
// Translator emit uses A1/A2 helpers + character-by-character walk
// which is correct but verbose and fragile.  Idiomatic JS: lowercase
// both strings then byte-wise compare.
export function __nh_hp_case_insensitive_comp(s1, s2) {
    const a = (s1 == null ? '' : coerceCStr(s1)).toLowerCase();
    const b = (s2 == null ? '' : coerceCStr(s2)).toLowerCase();
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const d = a.charCodeAt(i) - b.charCodeAt(i);
        if (d !== 0) return d;
    }
    return a.length - b.length;
}

export function __nh_hp_xcrypt(str, buf) {
    if (str == null) return buf;
    const s = coerceCStr(str);
    let bitmask = 1;
    const codes = [];
    for (let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);
        if (c & (32 | 64)) c ^= bitmask;
        codes.push(c);
        bitmask <<= 1;
        if (bitmask >= 32) bitmask = 1;
    }
    if (Array.isArray(buf)) {
        for (let i = 0; i < codes.length && i < buf.length; i++) buf[i] = codes[i];
        if (codes.length < buf.length) buf[codes.length] = 0;
    }
    return String.fromCharCode(...codes);
}

// findword(list, word, wordlen, ignorecase) — search a list of
// space-separated words and return the (slice) pointer to the
// first occurrence matching `word` exactly, or null.
//
// C source: walk list with `*p` deref + `p++` advance, skipping
// spaces; match candidate by strncmp/strncmpi + checking that the
// char at +wordlen is space or NUL (word-boundary).  Translator
// emit's char-walker uses scalar-ptr-param treatment of `p` so
// `*p == ' '` checks compile to `p.value == 32` which is always
// false for string bindings — every word was missed.
//
// JS-faithful: split list on whitespace and scan candidates.  Slow
// vs the C walker but trivially correct for the typical short
// lists this is called on (~20-word lists like the bogon-codes
// table).
export function __nh_hp_findword(list, word, wordlen, ignorecase) {
    if (list == null) return null;
    const listStr = coerceCStr(list);
    const wordStr = coerceCStr(word).slice(0, wordlen);
    // Scan from each position where a word starts (after space or
    // start-of-string).  Return the slice of `list` starting at
    // that position — preserves the "returned pointer is a position
    // into list" semantic that C uses.
    let i = 0;
    while (i < listStr.length) {
        while (i < listStr.length && listStr[i] === ' ') i++;
        if (i >= listStr.length) return null;
        const candidate = listStr.slice(i, i + wordlen);
        const matches = ignorecase
            ? candidate.toLowerCase() === wordStr.toLowerCase()
            : candidate === wordStr;
        if (matches) {
            const tailCh = i + wordlen >= listStr.length ? '\0' : listStr[i + wordlen];
            if (tailCh === '\0' || tailCh === ' ') return listStr.slice(i);
        }
        // Skip past this word to the next space.
        while (i < listStr.length && listStr[i] !== ' ') i++;
    }
    return null;
}
