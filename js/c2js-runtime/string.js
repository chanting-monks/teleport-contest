// string.js — libc string-handling shims for translated C.
//
// NetHack's C uses libc's <string.h> heavily.  Translated calls land
// here with C-shaped signatures.  Strings in our model are JS strings
// (immutable); functions that "mutate" a buffer (e.g. strcpy) take a
// CharBuffer-shaped argument once Phase 5+ supplies one.  Today we
// model them as best-effort: read-only consumers work correctly,
// mutating ones return the result.

// Coerce a strcmp-style argument to a JS string.  Char arrays are
// walked up to NUL terminator; everything else is String()-coerced.
// Exported for use by translated-output helpers (e.g. lcase/ucase in
// hacklib.js) that need the same char-array-as-c-string semantics.
export function coerceCStr(x) {
    if (x == null) return '';
    if (Array.isArray(x)) {
        let out = '';
        for (let i = 0; i < x.length; i++) {
            if (!x[i]) break;
            out += String.fromCharCode(x[i]);
        }
        return out;
    }
    return String(x);
}

export function strcmp(a, b) {
    a = coerceCStr(a);
    b = coerceCStr(b);
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

export function strncmp(a, b, n) {
    a = coerceCStr(a);
    b = coerceCStr(b);
    return strcmp(a.slice(0, n), b.slice(0, n));
}

export function strcasecmp(a, b) {
    a = coerceCStr(a).toLowerCase();
    b = coerceCStr(b).toLowerCase();
    return strcmp(a, b);
}

export function strncasecmp(a, b, n) {
    a = coerceCStr(a).toLowerCase();
    b = coerceCStr(b).toLowerCase();
    return strncmp(a, b, n);
}

export function strlen(s) {
    if (s == null) return 0;
    // char-array buffer (typical of `char buf[BUFSZ]` translations):
    // C strlen counts bytes up to the NUL terminator (0).  JS's
    // String(arr) joins with commas, so we must walk the array
    // directly.
    if (Array.isArray(s)) {
        for (let i = 0; i < s.length; i++) if (!s[i]) return i;
        return s.length;
    }
    return String(s).length;
}

// strcpy(dst, src) — C copies NUL-terminated bytes of src into dst's
// byte buffer.  In our JS model:
//   • If dst is a char-array, write src bytes into dst in-place.
//   • Always return src as a JS string (existing convention used by
//     many translated callers `s = strcpy(buf, src)`; treating buf
//     as opaque storage).
// Callers that need to preserve the dst-as-array reference for
// downstream char-code indexing should not use the assignment form;
// see harness post-processes that fix specific call sites
// (random_engraving, etc.).
export function strcpy(dst, src) {
    if (src == null) return '';
    const s = (Array.isArray(src))
        ? String.fromCharCode(...Array.from(src).slice(0, srcLen(src)))
        : String(src);
    if (Array.isArray(dst)) {
        for (let i = 0; i < s.length && i < dst.length; i++) dst[i] = s.charCodeAt(i);
        if (s.length < dst.length) dst[s.length] = 0;
    }
    return s;
}

// Internal: walk a char array up to its NUL terminator (or end of
// array if no NUL found).  Mirrors C's strlen for buf[].
function srcLen(arr) {
    for (let i = 0; i < arr.length; i++) if (!arr[i]) return i;
    return arr.length;
}

export function strncpy(_dst, src, n) {
    return coerceCStr(src).slice(0, n);
}

export function strcat(a, b) {
    const aStr = coerceCStr(a);
    const bStr = coerceCStr(b);
    const result = aStr + bStr;
    // Append `bStr`'s bytes after `a`'s existing NUL-terminated data
    // when `a` is a JS Array (C `char[N]` local).  Mirrors the
    // sprintf-mutate pattern in stdio.js — without this, callers that
    // pass a char array as outparam see no change.  Cap at array
    // length and re-NUL-terminate.
    if (Array.isArray(a)) {
        const lim = a.length;
        let i = 0;
        while (i < lim && a[i]) i++;
        let k = 0;
        for (; i < lim && k < bStr.length; i++, k++) a[i] = bStr.charCodeAt(k);
        if (i < lim) a[i] = 0;
    }
    return result;
}

export function strncat(a, b, n) {
    const aStr = coerceCStr(a);
    const bTail = coerceCStr(b).slice(0, n);
    const result = aStr + bTail;
    if (Array.isArray(a)) {
        const lim = a.length;
        let i = 0;
        while (i < lim && a[i]) i++;
        let k = 0;
        for (; i < lim && k < bTail.length; i++, k++) a[i] = bTail.charCodeAt(k);
        if (i < lim) a[i] = 0;
    }
    return result;
}

export function strchr(s, c) {
    if (s == null) return null;
    const targetCode = (typeof c === 'number') ? c : String(c).charCodeAt(0);
    if (Array.isArray(s)) {
        // char-array: find first index whose byte equals targetCode,
        // stopping at NUL (which terminates the C string).  Return
        // the byte-string suffix so callers that want to write through
        // the result get a primitive — but importantly, return a
        // truthy value so `if ((p = strchr(buf, '\n')) != NULL)`
        // checks work.
        for (let i = 0; i < s.length; i++) {
            if (!s[i]) return null;
            if (s[i] === targetCode) {
                let out = '';
                for (let j = i; j < s.length && s[j]; j++) out += String.fromCharCode(s[j]);
                return out;
            }
        }
        return null;
    }
    const ch = (typeof c === 'number') ? String.fromCharCode(c) : c;
    const i = String(s).indexOf(ch);
    return i < 0 ? null : String(s).slice(i);
}

export function strrchr(s, c) {
    if (s == null) return null;
    const targetCode = (typeof c === 'number') ? c : String(c).charCodeAt(0);
    if (Array.isArray(s)) {
        // char-array: find LAST index whose byte equals targetCode,
        // stopping the scan at the first NUL (C-string terminator).
        // Return the byte-string suffix so callers can compare or
        // do strncpy from the match point.
        let lastMatch = -1;
        for (let i = 0; i < s.length; i++) {
            if (!s[i]) break;
            if (s[i] === targetCode) lastMatch = i;
        }
        if (lastMatch < 0) return null;
        let out = '';
        for (let j = lastMatch; j < s.length && s[j]; j++) out += String.fromCharCode(s[j]);
        return out;
    }
    const ch = (typeof c === 'number') ? String.fromCharCode(c) : c;
    const i = String(s).lastIndexOf(ch);
    return i < 0 ? null : String(s).slice(i);
}

export function strstr(haystack, needle) {
    if (haystack == null || needle == null) return null;
    // Coerce both args through coerceCStr so char-array buffers
    // walk to NUL terminator instead of stringifying with commas.
    const h = coerceCStr(haystack);
    const n = coerceCStr(needle);
    const i = h.indexOf(n);
    return i < 0 ? null : h.slice(i);
}

export function strdup(s) {
    return coerceCStr(s);
}

// dupstr — NetHack alloc.c:238.  Same shape as strdup but a
// different name (different C TU).  Translator output references
// it as a free identifier from sp_lev.js (mapfrag_fromstr),
// questpgr.js, pline.js, glyphs.js, etc.  Without a real
// implementation, autostub.js falls back to the `() => 0` no-op,
// which left mapfragment.data as the number 0 — str_lines_maxlen
// then returned 0, lspo_map's `rn2(COLNO-1-mf.wid)` always became
// `rn2(79)` regardless of fragment width, and 6 sessions (seed0004,
// 0009, 0013-rogue, 0013-fullmoon, 0015, 0200) diverged in the
// lua-driven map placement of mklev.
export function dupstr(s) {
    return coerceCStr(s);
}

// strncmpi — case-insensitive strncmp.  C ref: src/hacklib.c.  The
// translated C version uses pointer arithmetic that doesn't survive
// our string-as-JS-string model; this overrides it.  `n < 0` means
// "compare full strings" (NetHack idiom: pass -1 for unbounded).
export function strncmpi(a, b, n) {
    a = coerceCStr(a).toLowerCase();
    b = coerceCStr(b).toLowerCase();
    if (n < 0) return strcmp(a, b);
    return strcmp(a.slice(0, n), b.slice(0, n));
}

// strstri — case-insensitive strstr.  C ref: src/hacklib.c.
export function strstri(haystack, needle) {
    if (haystack == null || needle == null) return null;
    // Coerce both args through coerceCStr; case-fold for the search.
    const h = coerceCStr(haystack);
    const n = coerceCStr(needle);
    const i = h.toLowerCase().indexOf(n.toLowerCase());
    return i < 0 ? null : h.slice(i);
}

// nh_strchr_truncate — searches `haystack` for `needle` and
// truncates at the matching position.  For array haystacks: mutates
// in place (writes 0 at the index) and returns the same array.  For
// string haystacks: returns a NEW sliced string (the caller must
// reassign).  If not found, returns the haystack unchanged.
//
// Used by the strchr-truncate recognizer's emit:
//   buf = nh_strchr_truncate(buf, X, kind[, startAt])
//
// The reassignment is a no-op for arrays (haystack returned is the
// same array reference, mutated in place) and a real rebind for
// strings (haystack returned is the new sliced string).  This lets
// a single emit form handle both runtime representations of
// "C char *" — mutable char[BUFSZ] arrays and immutable suffix
// strings returned by the strchr family.
//
// `kind` and `startAt` semantics match nh_strsearch_idx (see below).
export function nh_strchr_truncate(haystack, needle, kind, startAt) {
    if (haystack == null) return haystack;
    const idx = nh_strsearch_idx(haystack, needle, kind, startAt);
    if (idx === -1) return haystack;
    if (Array.isArray(haystack)) {
        haystack[idx] = 0;
        return haystack;
    }
    return String(haystack).slice(0, idx);
}

// nh_strsearch_idx — returns the index of `needle` in `haystack`,
// or -1 if not found.  Used by the translator's strchr-/strrchr-/
// strstr-/strstri-truncate recognizer to compute the truncation
// position in the underlying char-array buffer (which strchr's
// string-suffix return value can't directly support).
//
// `kind` selects the search behavior:
//   'chr'   — find first occurrence of single char (needle is int code)
//   'rchr'  — find last occurrence of single char  (needle is int code)
//   'str'   — find first occurrence of substring   (needle is string)
//   'stri'  — case-insensitive substring search    (needle is string)
//
// `startAt` (default 0) starts the search from a given offset.
// Used for the C `strchr(&buf[k], X)` pattern where the search
// position is offset into the buffer.
//
// For array haystacks: walks to NUL terminator, converts to string
// for substring searches, uses indexOf for char searches.
export function nh_strsearch_idx(haystack, needle, kind, startAt) {
    if (haystack == null) return -1;
    const start = startAt | 0;
    if (kind === 'chr' || kind === 'rchr') {
        const target = (typeof needle === 'number') ? needle : String(needle).charCodeAt(0);
        if (Array.isArray(haystack)) {
            if (kind === 'chr') {
                for (let i = start; i < haystack.length; i++) {
                    if (!haystack[i]) return -1;
                    if (haystack[i] === target) return i;
                }
                return -1;
            }
            let last = -1;
            for (let i = start; i < haystack.length; i++) {
                if (!haystack[i]) break;
                if (haystack[i] === target) last = i;
            }
            return last;
        }
        const s = String(haystack);
        const ch = String.fromCharCode(target);
        return kind === 'chr' ? s.indexOf(ch, start) : s.lastIndexOf(ch);
    }
    // Substring search.
    const h = coerceCStr(haystack);
    const n = (needle == null) ? '' : coerceCStr(needle);
    return (kind === 'stri')
        ? h.toLowerCase().indexOf(n.toLowerCase(), start)
        : h.indexOf(n, start);
}

// xcrypt — bit-rotation cipher from src/hacklib.c:399-415.  Self-
// inverse; cycles a bitmask through 1, 2, 4, 8, 16 per character and
// XORs with chars whose bits 32 or 64 are set (the alphabetics-ish).
// The translated version uses pointer-walked string iteration that
// the translator can't model (`for (...; *p; q++) { *q = *p++; ... }`),
// so the generated code infinite-loops.  Override with a JS-string
// implementation here.
export function xcrypt(str, buf) {
    if (str == null) return buf;
    const s = (typeof str === 'string') ? str : String.fromCharCode(...Array.from(str).filter((c) => c !== 0));
    let bm = 1;
    let out = '';
    for (let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);
        if (c & (32 | 64)) c ^= bm;
        out += String.fromCharCode(c);
        bm <<= 1;
        if (bm >= 32) bm = 1;
    }
    if (Array.isArray(buf)) {
        for (let i = 0; i < out.length && i < buf.length; i++) buf[i] = out.charCodeAt(i);
        if (out.length < buf.length) buf[out.length] = 0;
    }
    return out;
}
