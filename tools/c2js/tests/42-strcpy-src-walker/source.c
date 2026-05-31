/* 42-strcpy-src-walker/source.c — walker as strcpy SOURCE arg
 *
 * Tests the per-arg classification in READ_ONLY_STRING_CALLEES
 * (commit 9b51c32).  strcpy(dst, src) — arg 0 is dst (write-target),
 * arg 1 is src (read-only).  The allowlist registers strcpy with
 * positions Set([1]), meaning ONLY arg 1 is safe to slice.
 *
 * Pattern: walker as the SOURCE arg of strcpy.
 *
 * Expected emit: `strcpy(out, buf.slice(__nh_p_idx))` — slice form
 * for arg 1, plain emit for arg 0.
 */

#include <stdio.h>
#include <string.h>

static void
copy_suffix(char *out)
{
    char buf[8];
    char *p = buf;
    buf[0] = 'a'; buf[1] = 'b'; buf[2] = 'c';
    buf[3] = 'd'; buf[4] = 'e'; buf[5] = '\0';
    p += 2;
    strcpy(out, p);    /* should copy "cde" to out */
}

int
main(void)
{
    char out[8];
    out[0] = '\0';
    copy_suffix(out);
    printf("%s\n", out);
    return 0;
}
