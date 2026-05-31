/* 38-walker-advance/source.c — walker advance `p += N`
 *
 * Tests the §23.217 advance pattern (commit d1019d6) — when a
 * char-pointer walker is advanced by a non-unit amount via compound
 * assignment `p += N`, the translator should emit
 * `__nh_p_idx += N`.
 *
 * The critical AST detail: clang routes compound assigns through
 * the distinct `CompoundAssignOperator` node kind, NOT through
 * `BinaryOperator` with opcode `+=`.  The emit hook must live in
 * the compoundAssign translator, not binaryOp.
 *
 * Pattern (mirroring NetHack's hacklib.c::strNsubst):
 *   bp = src;
 *   ...
 *   bp += skip_len;
 *   *dst++ = *bp++;
 */

#include <stdio.h>
#include <string.h>

static void
skip_and_copy(char *dst, const char *src, int skip)
{
    char *op = dst;
    const char *bp;
    bp = src;
    bp += skip;            /* compound advance: __nh_bp_idx += skip */
    for ( ; *bp; )
        *op++ = *bp++;
    *op = '\0';
}

int
main(void)
{
    char buf[16];
    char src[6];
    memset(buf, 0, sizeof buf);
    src[0] = 'a'; src[1] = 'b'; src[2] = 'c'; src[3] = 'd'; src[4] = 'e'; src[5] = '\0';
    skip_and_copy(buf, src, 2);
    printf("%s\n", buf);
    return 0;
}
