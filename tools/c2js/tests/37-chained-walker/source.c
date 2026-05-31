/* 37-chained-walker/source.c — chained walker `*op++ = *rp++`
 *
 * Tests the §23.216 multi-reset relaxation (commit ca92ad4) that
 * allows multiple assignment-init resets to the SAME bufRef, AND
 * the chained-walker RHS emit that produces correct
 * `dst[__nh_op_idx++] = src[__nh_rp_idx++]` JS.
 *
 * Pattern (mirroring NetHack's hacklib.c::strNsubst):
 *   for (rp = replacement; *rp; ) *op++ = *rp++;
 *
 * Uses a char[] source (not a string literal) because the
 * translator emits `src[idx]` which returns numeric byte values
 * only when src is an array.  Production NetHack always passes
 * arrays at this kind of site.
 */

#include <stdio.h>
#include <string.h>

static void
double_copy(char *dst, const char *src)
{
    char *op = dst;
    const char *rp;
    /* First copy: src -> dst */
    for (rp = src; *rp; )
        *op++ = *rp++;
    /* Separator + second copy (tests the multi-reset path) */
    *op++ = '|';
    for (rp = src; *rp; )
        *op++ = *rp++;
    *op = '\0';
}

int
main(void)
{
    char buf[32];
    char src[4];
    memset(buf, 0, sizeof buf);
    src[0] = 'a'; src[1] = 'b'; src[2] = 'c'; src[3] = '\0';
    double_copy(buf, src);
    printf("%s\n", buf);
    return 0;
}
