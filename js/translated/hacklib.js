
// __nh_toJsStr — char-array safe coerce.  See §23.43.
function __nh_toJsStr(x) {
    if (x == null) return '';
    if (Array.isArray(x)) {
        let r = '';
        for (let i = 0; i < x.length && x[i]; i++) r += String.fromCharCode(x[i]);
        return r;
    }
    return String(x);
}
/* NetHack 5.0	hacklib.c	$NHDT-Date: 1706213796 2024/01/25 20:16:36 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.116 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Michael Allison, 2007. */
/* Copyright (c) Robert Patrick Rankin, 1991                      */
/* NetHack may be freely redistributed.  See license for details. */
/* for config.h+extern.h */
/*=
    Assorted 'small' utility routines.  They're virtually independent of
    NetHack.

      return type     routine name    argument type(s)
        boolean         digit           (char)
        boolean         letter          (char)
        char            highc           (char)
        char            lowc            (char)
        char *          lcase           (char *)
        char *          ucase           (char *)
        char *          upstart         (char *)
        char *          upwords         (char *)
        char *          mungspaces      (char *)
        char *          trimspaces      (char *)
        char *          strip_newline   (char *)
        char *          stripchars      (char *, const char *, const char *)
        char *          stripdigits     (char *)
        char *          eos             (char *)
        const char *    c_eos           (const char *)
        boolean         str_start_is    (const char *, const char *, boolean)
        boolean         str_end_is      (const char *, const char *)
        int             str_lines_maxlen (const char *)
        char *          strkitten       (char *,char)
        void            copynchars      (char *,const char *,int)
        char            chrcasecpy      (int,int)
        char *          strcasecpy      (char *,const char *)
        char *          s_suffix        (const char *)
        char *          ing_suffix      (const char *)
        char *          xcrypt          (const char *, char *)
        boolean         onlyspace       (const char *)
        char *          tabexpand       (char *)
        char *          visctrl         (char)
        char *          strsubst        (char *, const char *, const char *)
        int             strNsubst       (char *,const char *,const char *,int)
        const char *    findword        (const char *,const char *,int,boolean)
        const char *    ordin           (int)
        char *          sitoa           (int)
        int             sgn             (int)
        int             distmin         (coordxy, coordxy, coordxy, coordxy)
        int             dist2           (coordxy, coordxy, coordxy, coordxy)
        boolean         online2         (coordxy, coordxy)
        int             strncmpi        (const char *, const char *, int)
        char *          strstri         (const char *, const char *)
        boolean         fuzzymatch      (const char *, const char *,
                                         const char *, boolean)
        int             swapbits        (int, int, int)
        void            nh_snprintf     (const char *, int, char *, size_t,
                                         const char *, ...)
=*/
/* is 'c' a digit? */
import { game } from '../gstate.js';
import { __builtin_va_end, __builtin_va_start } from '../c2js-runtime/builtins.js';
import { __nh_hp_case_insensitive_comp, __nh_hp_strNsubst, __nh_hp_upwords, __nh_hp_xcrypt } from '../c2js-runtime/hacklib-handports.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { sprintf, vsnprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strchr, strlen, strncmp } from '../c2js-runtime/string.js';

export function digit(c) {
    return (48 <= c && c <= 57);
}
/* is 'c' a letter?  note: '@' classed as letter */
export function letter(c) {
    return (64 <= c && c <= 90) || (97 <= c && c <= 122);
}
/* force 'c' into uppercase */
export function highc(c) {
    return ((97 <= c && c <= 122) ? (c & ~32) : c);
}
/* force 'c' into lowercase */
export function lowc(c) {
    return ((65 <= c && c <= 90) ? (c | 32) : c);
}
/* convert a string into all lowercase */
export function lcase(s) {
    return s == null ? s : __nh_toJsStr(s).toLowerCase();
}
/* convert a string into all uppercase */
export function ucase(s) {
    return s == null ? s : __nh_toJsStr(s).toUpperCase();
}
/* convert first character of a string to uppercase */
export function upstart(s) {
    if (!s) return s;
    const __t = Array.isArray(s)
      ? (() => { let r=''; for (let i=0;i<s.length&&s[i];i++) r+=String.fromCharCode(s[i]); return r; })()
      : (s + '');
    return __t.length ? __t[0].toUpperCase() + __t.slice(1) : s;
}
/* capitalize first letter of every word in a string (in place) */
export function upwords(s) {
    return __nh_hp_upwords(s);
}
/* remove excess whitespace from a string buffer (in place) */
export function mungspaces(bp) {
    if (bp == null) return bp;
    return __nh_toJsStr(bp).replace(/\t/g, ' ').split('\n')[0].replace(/ +/g, ' ').replace(/^ +| +$/g, '');
}
/* skip leading whitespace; remove trailing whitespace, in place */
export function trimspaces(txt) {
    return txt == null ? txt : __nh_toJsStr(txt).replace(/[ \t]+$/, '');
}
/* remove \n from end of line; remove \r too if one is there */
export function strip_newline(str) {
    return str == null ? str : __nh_toJsStr(str).replace(/\n$/, '');
}
/* return the end of a string (pointing at '\0') */
export function eos(s) {
    while (__nh_char_at0(s)) {
        (s = __nh_advance_str(s, 1));
    }
    return s;
}
/* version of eos() which takes a const* arg and returns that result */
export function c_eos(s) {
    while (__nh_char_at0(s)) {
        (s = __nh_advance_str(s, 1));
    }
    return s;
}
/* determine whether 'str' starts with 'chkstr', possibly ignoring case;
 * panics on huge strings */
export function str_start_is(str, chkstr, caseblind) {
    let t1 = 0;
    let t2 = 0;
    let n = 32767;
    while (--n) {
        if (!__nh_char_at0(str)) {
            return (__nh_char_at0(chkstr) == 0);
        } else if (!__nh_char_at0(chkstr)) {
            return (1);
        }
        t1 = caseblind ? lowc(__nh_char_at0(str)) : __nh_char_at0(str);
        t2 = caseblind ? lowc(__nh_char_at0(chkstr)) : __nh_char_at0(chkstr);
        (str = __nh_advance_str(str, 1)) , (chkstr = __nh_advance_str(chkstr, 1));
        if (t1 != t2) {
            return (0);
        }
    }
    return (1);
}
/* determine whether 'str' ends in 'chkstr' */
export function str_end_is(str, chkstr) {
    let clen = strlen(chkstr);
    if (strlen(str) >= clen) {
        return (!strncmp(eos(str) - clen, chkstr, clen));
    }
    return (0);
}
/* return max line length from buffer comprising newline-separated strings */
export function str_lines_maxlen(str) {
    if (str == null) return 0;
    const s = __nh_toJsStr(str);
    let max_len = 0;
    for (const line of s.split('\n')) {
        if (line.length > max_len) max_len = line.length;
    }
    return max_len;
}
/* append a character to a string (in place): strcat(s, {c,'\0'}); */
export function strkitten(s, c) {
    return __nh_toJsStr(s) + String.fromCharCode(c);
}
/* truncating string copy */
export function copynchars(dst, src, n) {
    if (src == null) return dst;
    const _src = src + '';
    let _i = 0;
    const _max = Math.min(n, _src.length);
    while (_i < _max) {
        const _c = _src.charCodeAt(_i);
        if (_c === 0 || _c === 10) break;
        _i++;
    }
    return _src.slice(0, _i);
}
/* convert char nc into oc's case; mostly used by strcasecpy */
export function chrcasecpy(oc, nc) {
    if (97 <= oc && oc <= 122) {
        /* copies at most n characters, stopping sooner if terminator reached;
       treats newline as input terminator; unlike strncpy, always supplies
       '\0' terminator so dst must be able to hold at least n+1 characters */
        /* this will be necessary if we switch to <ctype.h> */
        /* old char is lower case; if new char is upper case, downcase it */
        if (65 <= nc && nc <= 90) {
            nc += 97 - 65;
        }
    } else if (65 <= oc && oc <= 90) {
        /* old char is upper case; if new char is lower case, upcase it */
        if (97 <= nc && nc <= 122) {
            nc += 65 - 97;
        }
    }
    return nc;
}
/* overwrite string, preserving old chars' case;
   for case-insensitive editions of makeplural() and makesingular();
   src might be shorter, same length, or longer than dst */
export function strcasecpy(dst, src) {
    if (src == null) return dst;
    const _src = src + '';
    const _dst = dst == null ? '' : (dst + '');
    let _r = '';
    for (let _i = 0; _i < _src.length; _i++) {
        const _ic = _src.charCodeAt(_i);
        const _oc = _i < _dst.length ? _dst.charCodeAt(_i) : 0;
        _r += String.fromCharCode(chrcasecpy(_oc, _ic));
    }
    return _r;
}
/* return a name converted to possessive */
export function s_suffix(s) {
    const _s = __nh_toJsStr(s);
    if (_s.toLowerCase() === 'it') return _s + 's';
    if (_s.toLowerCase() === 'you') return _s + 'r';
    if (_s.endsWith('s')) return _s + "'";
    return _s + "'s";
}
/* construct a gerund (a verb formed by appending "ing" to a noun) */
export function ing_suffix(s) {
    if (s == null) return s;
    let _b = __nh_toJsStr(s);
    let _onoff = '';
    const _vowel = 'aeiouwy';
    const _lc = _b.toLowerCase();
    if (_lc.endsWith(' on') || _lc.endsWith(' off') || _lc.endsWith(' with')) {
        const _i = _b.lastIndexOf(' ');
        if (_i >= 0) { _onoff = _b.slice(_i); _b = _b.slice(0, _i); }
    }
    const _bl = _b.toLowerCase();
    if (_bl.endsWith('er')) {
        /* nothing */
    } else if (_b.length >= 3
               && !_vowel.includes(_bl[_bl.length - 1])
               && _vowel.includes(_bl[_bl.length - 2])
               && !_vowel.includes(_bl[_bl.length - 3])) {
        _b = _b + _b[_b.length - 1];
    } else if (_bl.endsWith('ie')) {
        _b = _b.slice(0, -2) + 'y';
    } else if (_bl.endsWith('e')) {
        _b = _b.slice(0, -1);
    }
    return _b + 'ing' + _onoff;
}
/* trivial text encryption routine (see makedefs) */
export function xcrypt(str, buf) {
    return __nh_hp_xcrypt(str, buf);
}
/* is a string entirely whitespace? */
export function onlyspace(s) {
    return s == null || /^\s*$/.test(__nh_toJsStr(s));
}
/* expand tabs into proper number of spaces (in place) */
/* assumed to be [BUFSZ] but can be smaller provided that
                 * expanded string fits; expansion bigger than BUFSZ-1
                 * will be truncated */
export function tabexpand(sbuf) {
    if (sbuf == null) return sbuf;
    const _str = __nh_toJsStr(sbuf);
    if (_str.length === 0) return _str;
    let _r = '', _idx = 0;
    for (let _i = 0; _i < _str.length; _i++) {
        const _c = _str[_i];
        if (_c === '\t') {
            do { _r += ' '; _idx++; } while (_idx % 8);
        } else {
            _r += _c; _idx++;
        }
        if (_idx >= 256) break;
    }
    return _r;
}
/* make a displayable string from a character */
export function visctrl(c) {
    let _c = c | 0;
    let _pre = '';
    if (_c & 0x80) { _pre = 'M-'; _c &= 0x7F; }
    if (_c < 0x20) return _pre + '^' + String.fromCharCode(_c | 0x40);
    if (_c === 0x7F) return _pre + '^?';
    return _pre + String.fromCharCode(_c);
}
/* strip all the chars in stuff_to_strip from orig */
/* caller is responsible for ensuring that bp is a
   valid pointer to a BUFSZ buffer */
export function stripchars(bp, stuff_to_strip, orig) {
    if (orig == null) return bp;
    const _strip = stuff_to_strip == null ? '' : (stuff_to_strip + '');
    return [...(orig + '')].filter(c => !_strip.includes(c)).join('').slice(0, 255);
}
/* remove digits from string */
export function stripdigits(s) {
    return s == null ? s : __nh_toJsStr(s).replace(/[0-9]/g, '');
}
/* substitute a word or phrase in a string (in place);
   caller is responsible for ensuring that bp points to big enough buffer */
export function strsubst(bp, orig, replacement) {
    if (bp == null || orig == null || replacement == null) return bp;
    return __nh_toJsStr(bp).replace(orig, replacement);
}
/* substitute the Nth occurrence of a substring within a string (in place);
   if N is 0, substitute all occurrences; returns the number of substitutions;
   maximum output length is BUFSZ (BUFSZ-1 chars + terminating '\0') */
/* current string, and result buffer */
/* old substring; if "", insert in front of Nth char */
/* new substring; if "", delete old substring */
/* which occurrence to replace; 0 => all */
export function strNsubst(inoutbuf, orig, replacement, n) {
    return __nh_hp_strNsubst(inoutbuf, orig, replacement, n);
}
/* search for a word in a space-separated list; returns non-Null if found */
/* string of space-separated words */
/* word to try to find */
/* so that it isn't required to be \0 terminated */
/* T: case-blind, F: case-sensitive */
export function findword(list, word, wordlen, ignorecase) {
    let p = list;
    while (p) {
        /* no match (or len==0) so retain current character */
        /* special case: orig=="" (!len) and n==strlen(inoutbuf)+1,
           insert in front of terminator (in other words, append);
           [when orig=="", ocount will have been incremented once for
           each input char] */
        while (__nh_char_at0(p) == 32) {
            (p = __nh_advance_str(p, 1));
        }
        if (!__nh_char_at0(p)) {
            break;
        }
        if ((ignorecase ? !strncmpi(p, word, wordlen) : !strncmp(p, word, wordlen)) && (__nh_char_at0(__nh_advance_str(p, wordlen)) == 0 || __nh_char_at0(__nh_advance_str(p, wordlen)) == 32)) {
            return p;
        }
        p = strchr(__nh_advance_str(p, 1), 32);
    }
    return null;
}
/* return the ordinal suffix of a number */
/* note: should be non-negative */
export function ordin(n) {
    let dd = n % 10;
    return (dd == 0 || dd > 3 || Math.trunc((n % 100) / 10) == 1) ? "th" : (dd == 1) ? "st" : (dd == 2) ? "nd" : "rd";
}
/* one compiler complains about
                                      result of ?: for format string */
/* make a signed digit string from a number */
let __sitoa_buf = '';
__nh_register_static(() => { __sitoa_buf = ''; });
export function sitoa(n) {
    __sitoa_buf = sprintf(__sitoa_buf, (n < 0) ? "%d" : "+%d", n);
    return __sitoa_buf;
}
/* return the sign of a number: -1, 0, or 1 */
export function sgn(n) {
    return Math.sign(n) | 0;
}
/* distance between two points, in moves */
export function distmin(x0, y0, x1, y1) {
    let dx = x0 - x1;
    let dy = y0 - y1;
    if (dx < 0) {
        dx = -dx;
    }
    if (dy < 0) {
        dy = -dy;
    }
    /*  The minimum number of moves to get from (x0,y0) to (x1,y1) is the
     *  larger of the [absolute value of the] two deltas.
     */
    return (dx < dy) ? dy : dx;
}
/* square of Euclidean distance between pair of pts */
export function dist2(x0, y0, x1, y1) {
    let dx = x0 - x1;
    let dy = y0 - y1;
    return dx * dx + dy * dy;
}
/* integer square root function without using floating point */
export function isqrt(val) {
    let rt = 0;
    let odd = 1;
    while (val >= odd) {
        /*
     * This could be replaced by a faster algorithm, but has not been because:
     * + the simple algorithm is easy to read;
     * + this algorithm does not require 64-bit support;
     * + in current usage, the values passed to isqrt() are not really that
     *   large, so the performance difference is negligible;
     * + isqrt() is used in only few places, which are not bottle-necks.
     */
        val = val - odd;
        odd = odd + 2;
        rt = rt + 1;
    }
    return rt;
}
/* are two points lined up (on a straight line)? */
export function online2(x0, y0, x1, y1) {
    let dx = x0 - x1;
    let dy = y0 - y1;
    /*  If either delta is zero then they're on an orthogonal line,
     *  else if the deltas are equal (signs ignored) they're on a diagonal.
     */
    return (!dy || !dx || dy == dx || dy == -dx);
}
/* case-insensitive counted string comparison */
/*{ aka strncasecmp }*/
/*(should probably be size_t, which is unsigned)*/
export function strncmpi(s1, s2, n) {
    let t1 = 0;
    let t2 = 0;
    while (n--) {
        if (!__nh_char_at0(s2)) {
            return (__nh_char_at0(s1) != 0);
        } else if (!__nh_char_at0(s1)) {
            return -1;
        }
        t1 = lowc((s1 = __nh_advance_str(s1, 1)));
        t2 = lowc((s2 = __nh_advance_str(s2, 1)));
        if (t1 != t2) {
            return (t1 > t2) ? 1 : -1;
        }
    }
    return 0;
}
/* STRNCMPI */
/* case-insensitive substring search */
export function strstri(str, sub) {
    let s1 = null;
    let __nh_s2_idx = 0;
    let i = 0;
    let k = 0;
    /* 0x40 would be case-sensitive */
    let tstr = '';
    let tsub = '';
    /* must be exact power of 2 */
    /* special case: empty substring */
    if (!__nh_char_at0(sub)) {
        return str;
    }
    /* do some useful work while determining relative lengths */
    for (i = 0; i < 32; i++) {
        (tsub = __nh_char_write(tsub, i, 0), tstr = __nh_char_write(tstr, i, 0));
    }
    for (k = 0 , s1 = str; __nh_char_at0(s1); k++) {
        __nh_char_at0(__nh_advance_str(tstr, (s1 = __nh_advance_str(s1, 1)) & (32 - 1)))++;
    }
    for (__nh_s2_idx = 0; __nh_char_at0(__nh_advance_str(sub, __nh_s2_idx)); --k) {
        __nh_char_at0(__nh_advance_str(tsub, __nh_char_at0(__nh_advance_str(sub, __nh_s2_idx++)) & (32 - 1)))++;
    }
    /* evaluate the info we've collected */
    if (k < 0) {
        return null;
    }
    /* sub longer than str, so can't match */
    /* does sub have more 'x's than str? */
    for (i = 0; i < 32; i++) {
        if (__nh_char_at0(__nh_advance_str(tsub, i)) > __nh_char_at0(__nh_advance_str(tstr, i))) {
            return null;
        }
    }
    for (i = 0; i <= k; i++) {
        /* now actually compare the substring repeatedly to parts of the string */
        s1 = __nh_advance_str(str, i);
        __nh_s2_idx = 0;
        while (lowc((s1 = __nh_advance_str(s1, 1))) == lowc(__nh_char_at0(__nh_advance_str(sub, __nh_s2_idx++)))) {
            if (!__nh_char_at0(__nh_advance_str(sub, __nh_s2_idx))) {
                return __nh_advance_str(str, i);
            }
        }
    }
    return null;
}
/* STRSTRI */
/* compare two strings for equality, ignoring the presence of specified
   characters (typically whitespace) and possibly ignoring case */
export function fuzzymatch(s1, s2, ignore_chars, caseblind) {
    /* §23.232r fuzzymatch — char-array-safe byte iteration via
       charCodeAt + ignore-chars indexOf.  C ref hacklib.c does
       `while ((c1 = *s1++) != 0 && index(...) != 0)`. */
    const a = (s1 == null) ? '' : ((typeof s1 === 'string') ? s1 : (() => { let r=''; for (let k=0;k<s1.length&&s1[k];k++) r+=String.fromCharCode(s1[k]); return r; })());
    const b = (s2 == null) ? '' : ((typeof s2 === 'string') ? s2 : (() => { let r=''; for (let k=0;k<s2.length&&s2[k];k++) r+=String.fromCharCode(s2[k]); return r; })());
    const ign = (ignore_chars == null) ? '' : ((typeof ignore_chars === 'string') ? ignore_chars : (() => { let r=''; for (let k=0;k<ignore_chars.length&&ignore_chars[k];k++) r+=String.fromCharCode(ignore_chars[k]); return r; })());
    let i = 0, j = 0;
    let c1 = 0, c2 = 0;
    do {
        do { c1 = (i < a.length) ? a.charCodeAt(i++) : 0; } while (c1 !== 0 && ign.indexOf(String.fromCharCode(c1)) >= 0);
        do { c2 = (j < b.length) ? b.charCodeAt(j++) : 0; } while (c2 !== 0 && ign.indexOf(String.fromCharCode(c2)) >= 0);
        if (!c1 || !c2) {
            /* stop when end of either string is reached */
            break;
        }
        if (caseblind) {
            if (c1 >= 65 && c1 <= 90) c1 |= 32;
            if (c2 >= 65 && c2 <= 90) c2 |= 32;
        }
    } while (c1 === c2);
    /* match occurs only when the end of both strings has been reached */
    return (!c1 && !c2);
}
/*
 * Time routines
 *
 * The time is used for:
 *  - seed for rand()
 *  - year on tombstone and yyyymmdd in record file
 *  - phase of the moon (various monsters react to NEW_MOON or FULL_MOON)
 *  - night and midnight (the undead are dangerous at midnight)
 *  - determination of what files are "very old"
 */
/* TIME_type: type of the argument to time(); we actually use &(time_t);
   you might need to define either or both of these to 'long *' in *conf.h */
/* swapbits(val, bita, bitb) swaps bit a with bit b in val */
export function swapbits(val, bita, bitb) {
    let tmp = ((val >> bita) & 1) ^ ((val >> bitb) & 1);
    return (val ^ ((tmp << bita) | (tmp << bitb)));
}
/*
 * Wrap snprintf for use in the main code.
 *
 * Wrap reasons:
 *   1. If there are any platform issues, we have one spot to fix them -
 *      snprintf is a routine with a troubling history of bad implementations.
 *   2. Add cumbersome error checking in one spot.  Problems with text
 *      wrangling do not have to be fatal.
 *   3. Gcc 9+ will issue a warning unless the return value is used.
 *      Annoyingly, explicitly casting to void does not remove the error.
 *      So, use the result - see reason #2.
 */
export function nh_snprintf(func, line, str, size, fmt, ...__nh_va_rest) {
    let ap = 0;
    let n = 0;
    ap = __nh_va_rest;
    n = vsnprintf(str, size, fmt, ap);
    __builtin_va_end(ap);
    if (n < 0 || n >= size) {
        /* make sure it is nul terminated */
        str = __nh_char_write(str, size - 1, 0);
    }
}
/* Unicode routines */
export function unicodeval_to_utf8str(uval, buffer, bufsz) {
    let __nh_b_idx = 0;
    if (bufsz < 5) {
        return 0;
    }
    /*
     *   Binary   Hex        Comments
     *   0xxxxxxx 0x00..0x7F Only byte of a 1-byte character encoding
     *   10xxxxxx 0x80..0xBF Continuation byte : one of 1-3 bytes following
     * first 110xxxxx 0xC0..0xDF First byte of a 2-byte character encoding
     *   1110xxxx 0xE0..0xEF First byte of a 3-byte character encoding
     *   11110xxx 0xF0..0xF7 First byte of a 4-byte character encoding
     */
    buffer = buffer.slice(0, __nh_b_idx);
    if (uval < 128) {
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(uval);
    } else if (uval < 2048) {
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(192 + Math.trunc(uval / 64));
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(128 + uval % 64);
    } else if (uval - 55296 < 2048) {
        return 0;
    } else if (uval < 65536) {
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(224 + Math.trunc(uval / 4096));
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(128 + Math.trunc(uval / 64) % 64);
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(128 + uval % 64);
    } else if (uval < 1114112) {
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(240 + Math.trunc(uval / 262144));
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(128 + Math.trunc(uval / 4096) % 64);
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(128 + Math.trunc(uval / 64) % 64);
        buffer = buffer.slice(0, __nh_b_idx++) + String.fromCharCode(128 + uval % 64);
    } else {
        return 0;
    }
    buffer = buffer.slice(0, __nh_b_idx);
    return 1;
}
export function case_insensitive_comp(s1, s2) {
    return __nh_hp_case_insensitive_comp(s1, s2);
}
export function copy_bytes(ifd, ofd) {
    let buf = '';
    let nfrom = 0;
    let nto = 0;
    do {
        nto = 0;
        nfrom = read(ifd, buf, 8192);
        if (nfrom >= 0 && nfrom <= 8192) {
            nto = write(ofd, buf, nfrom);
        }
        if (nto != nfrom || nfrom < 0) {
            return (0);
        }
    } while (nfrom == 8192);
    return (1);
}
// struct datamodel_information: { sz, datamodel, dmplatform }
game.dm = [{ sz: [2 /* sizeof(short) */, 4 /* sizeof(int) */, 8 /* sizeof(long) */, 8 /* sizeof(long long) */, 1 /* sizeof(genericptr_t) */], datamodel: "", dmplatform: "" }, { sz: [2, 4, 4, 8, 4], datamodel: "ILP32LL64", dmplatform: "x86 32-bit" }, { sz: [2, 4, 4, 8, 8], datamodel: "IL32LLP64", dmplatform: "Windows x64 64-bit" }, { sz: [2, 4, 8, 8, 8], datamodel: "I32LP64", dmplatform: "Unix 64-bit" }, { sz: [2, 8, 8, 8, 8], datamodel: "ILP64", dmplatform: "Unix ILP64" }];
/* Windows or Unix */
/* HAL, SPARC64 */
const __datamodel_unknown = "Unknown";
export function datamodel(retidx) {
    let i = 0;
    let j = 0;
    let matchcount = 0;
    for (i = 1; i < (Math.trunc(5 /* sizeof(struct datamodel_information [5]) */ / 1 /* sizeof(struct datamodel_information) */)); ++i) {
        matchcount = 0;
        for (j = 0; j < 5; ++j) {
            if (game.dm[0].sz[j] == game.dm[i].sz[j]) {
                ++matchcount;
            }
        }
        if (matchcount == 5) {
            return (retidx == 0) ? game.dm[i].datamodel : game.dm[i].dmplatform;
        }
    }
    return __datamodel_unknown;
}
const __what_datamodel_is_this_unknown = "Unknown";
export function what_datamodel_is_this(retidx, szshort, szint, szlong, szll, szptr) {
    let i = 0;
    for (i = 1; i < (Math.trunc(5 /* sizeof(struct datamodel_information [5]) */ / 1 /* sizeof(struct datamodel_information) */)); ++i) {
        if (szshort == game.dm[i].sz[0] && szint == game.dm[i].sz[1] && szlong == game.dm[i].sz[2] && szll == game.dm[i].sz[3] && szptr == game.dm[i].sz[4]) {
            return (retidx == 0) ? game.dm[i].datamodel : game.dm[i].dmplatform;
        }
    }
    return __what_datamodel_is_this_unknown;
}
/*hacklib.c*/
/* treat newline the same as end-of-string */
/* leading whitespace will remain in the buffer */
/* while dst has characters, replace each one with corresponding
       character from src, converting case in the process if they differ;
       once dst runs out, propagate the case of its last character to any
       remaining src; if dst starts empty, it must be a pointer to the
       tail of some other string because we examine the char at dst[-1] */
/*
             * clang-8's optimizer at -Os has been observed to mis-compile
             * this code.  Symptom is nethack getting stuck in an apparent
             * infinite loop (or perhaps just an extremely long one) when
             * examining data.base entries.
             * clang-9 doesn't exhibit this problem.  [Was the incorrect
             * optimization fixed or just disabled?]
             */
/* [this could be replaced by strNsubst(bp, orig, replacement, 1)] */
/* number of times 'orig' has been matched */
/* number of substitutions made */
