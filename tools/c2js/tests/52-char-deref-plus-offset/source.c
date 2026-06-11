/* 52-char-deref-plus-offset/source.c — Phase A1 extension for the
 * `*(p + N)` deref-on-pointer-arithmetic idiom.  C source has
 * patterns like `*(c + 1)` (questpgr.c), `*(str + 1) == 'G'`
 * (windows.c), `*limits >= *(limits + 1)` (vision.c), `*(word + 1)
 * == '('` (mdlib.c), `digit(*(op + 1))` (options.c).
 *
 * In each case the inner `p + N` would emit via A3 as
 * `__nh_advance_str(p, N)` — a string SUFFIX of the buffer, not
 * a byte.  The outer `*` is meant to read the first byte at that
 * advanced position.  Without this Phase A1 extension, the
 * fallthrough emit returns the suffix string, breaking byte
 * comparisons (string-vs-number coerces to NaN, always false).
 *
 * Expected output:
 *   B
 *   match
 *   match
 *   no
 */
#include <stdio.h>

struct holder {
    const char *bp;
};

int
main(void)
{
    /* (1) local char* deref at offset */
    const char *p = "ABC";
    printf("%c\n", *(p + 1));  /* B */

    /* (2) byte comparison with literal */
    printf("%s\n", (*(p + 0) == 'A') ? "match" : "no");

    /* (3) member char* deref at offset */
    struct holder h = { "needle haystack" };
    printf("%s\n", (*(h.bp + 7) == 'h') ? "match" : "no");

    /* (4) compound expression: ! deref */
    printf("%s\n", (*(p + 3) == 0) ? "no" : "yes-end");  /* no (NUL) */

    return 0;
}
