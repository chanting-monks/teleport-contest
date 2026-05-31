/* 43-multi-reset-walker/source.c — multiple `name = bufRef` resets
 *
 * Tests the multi-reset relaxation (commit ca92ad4, §23.216).
 * The recognizer accepts MULTIPLE assignment-init assignments to
 * the SAME bufRef — each is a `__nh_p_idx = 0` reset.
 *
 * Common in NetHack hacklib.c::strNsubst (two `for (rp =
 * replacement; ...)` loops in the same function).
 *
 * Pattern: walker `rp` is reset twice, each time to the same
 * source buffer.
 *
 * Expected: each `rp = src` becomes `__nh_rp_idx = 0` (a reset).
 */

#include <stdio.h>
#include <string.h>

static void
double_walk(char *out, char *src)
{
    char buf[16];
    char *op = buf;
    const char *rp;
    /* First walk through src */
    for (rp = src; *rp; ) {
        *op++ = *rp++;
    }
    /* Separator */
    *op++ = '|';
    /* Second walk through src (rp resets to src) */
    for (rp = src; *rp; ) {
        *op++ = *rp++;
    }
    *op = '\0';
    strcpy(out, buf);
}

int
main(void)
{
    char out[16];
    char src[4];
    src[0] = 'a'; src[1] = 'b'; src[2] = 'c'; src[3] = '\0';
    double_walk(out, src);
    printf("%s\n", out);
    return 0;
}
