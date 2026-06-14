/* NetHack 5.0	strutil.c	$NHDT-Date: 1709571807 2024/03/04 17:03:27 $  $NHDT-Branch: keni-mdlib-followup $:$NHDT-Revision: 1.0 $ */
/* Copyright (c) Robert Patrick Rankin, 1991                      */
/* NetHack may be freely redistributed.  See license for details. */
/* for config.h+extern.h */
/* strbuf_init() initializes strbuf state for use */
import { alloc, free } from '../c2js-runtime/memory.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strcat, strchr, strcpy, strlen } from '../c2js-runtime/string.js';
import { lowc } from './hacklib.js';

export function strbuf_init(strbuf) {
    strbuf.str = null;
    strbuf.len = 0;
}
/* strbuf_append() appends given str to strbuf->str */
export function strbuf_append(strbuf, str) {
    let len = strlen(str) + 1;
    strbuf_reserve(strbuf, len + (strbuf.str ? strlen(strbuf.str) : 0));
    strbuf.str = strcat(strbuf.str, str);
}
/* strbuf_reserve() ensure strbuf->str has storage for len characters */
export function strbuf_reserve(strbuf, len) {
    if (strbuf.str == (null)) {
        strbuf.str = strbuf.buf;
        strbuf.str = __nh_char_write(strbuf.str, 0, 0);
        strbuf.len = 256 /* sizeof(char [256]) */;
    }
    if (len > strbuf.len) {
        let oldbuf = strbuf.str;
        strbuf.len = len + 256 /* sizeof(char [256]) */;
        strbuf.str = alloc(strbuf.len);
        strbuf.str = strcpy(strbuf.str, oldbuf);
        if (oldbuf != strbuf.buf) {
            free(oldbuf);
        }
    }
}
/* strbuf_empty() frees allocated memory and set strbuf to initial state */
export function strbuf_empty(strbuf) {
    if (strbuf.str != (null) && strbuf.str != strbuf.buf) {
        free(strbuf.str);
    }
    strbuf_init(strbuf);
}
/* strbuf_nl_to_crlf() converts all occurrences of \n to \r\n */
export function strbuf_nl_to_crlf(strbuf) {
    if (strbuf.str) {
        let len = strlen(strbuf.str);
        let count = 0;
        let cp = strbuf.str;
        while (__nh_char_at0(cp)) {
            if ((cp = __nh_advance_str(cp, 1)) == 10) {
                count++;
            }
        }
        if (count) {
            strbuf_reserve(strbuf, len + count + 1);
            for (cp = __nh_advance_str(strbuf.str, len) + count; count; (cp = __nh_advance_str(cp, -1))) {
                if ((void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = __nh_char_at0(__nh_advance_str(cp, -coun) */) == 10) {
                    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 13) */;
                    --count;
                }
            }
        }
    }
}
/* strlen() but returns unsigned and panics if string is unreasonably long;
   used by dlb as well as by nethack */
export async function Strlen_(str, file, line) {
    if (str == null) await panic("Strlen_:%s null str at %d", file, line);
    const _s = (typeof str === "string") ? str
            : (Array.isArray(str) ? str.findIndex(b => b === 0) : String(str));
    const len = (typeof _s === "string") ? _s.length : (_s < 0 ? str.length : _s);
    if (len >= 32767) await panic("%s:%d string too long", file, line);
    return len;
}
/* guts of pmatch(), pmatchi(), and pmatchz();
   match a string against a pattern */
/* True => case-insensitive,
                                   False => case-sensitive */
/* set of characters to skip */
export function pmatch_internal(patrn, strng, ci, sk) {
    /* strnlen(str, LARGEST_INT) w/o requiring posix.1 headers or libraries */
    let s = 0;
    let p = 0;
    pmatch_top: while (true) {
        if (!sk) {
            /*
     *  Simple pattern matcher:  '*' matches 0 or more characters, '?' matches
     *  any single character.  Returns TRUE if 'strng' matches 'patrn'.
     */
            s = (strng = __nh_advance_str(strng, 1));
            /* get next chars and pre-advance */
            p = (patrn = __nh_advance_str(patrn, 1));
        } else {
            /* fuzzy match variant of pmatch; particular characters are ignored */
            do {
                s = (strng = __nh_advance_str(strng, 1));
            } while (strchr(sk, s));
            do {
                p = (patrn = __nh_advance_str(patrn, 1));
            } while (strchr(sk, p));
        }
        if (!p) {
            return (s == 0);
        } else if (p == 42) {
            return ((!__nh_char_at0(patrn) || pmatch_internal(patrn, strng - 1, ci, sk)) ? (1) : s ? pmatch_internal(patrn - 1, strng, ci, sk) : (0));
        } else if ((ci ? lowc(p) != lowc(s) : p != s) && (p != 63 || !s)) {
            return (0);
        /* matches iff end of string too */
        /* return pmatch_internal(patrn, strng, ci, sk); */
        } else {
            continue pmatch_top;
        }
        break;
    }
}
/* case-sensitive wildcard match */
export function pmatch(patrn, strng) {
    return pmatch_internal(patrn, strng, (0), null);
}
/* case-insensitive wildcard match */
export function pmatchi(patrn, strng) {
    return pmatch_internal(patrn, strng, (1), null);
}
/*strutil.c*/
