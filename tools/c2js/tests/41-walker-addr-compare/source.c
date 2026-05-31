/* 41-walker-addr-compare/source.c — walker `p < &buf[N]` sentinel
 *
 * Tests the charBufferRewrites address-comparison recognizer
 * (matchCharBufferAddrCompare, §23.215 commit b318336).
 *
 * Pattern: walker advances through buf, checking sentinel
 * `p < &buf[3]` (explicit address-of subscript form).
 *
 * Expected emit: `__nh_p_idx < 3` (index-form of address compare).
 */

#include <stdio.h>
#include <string.h>

#define N 3

static int
fill_until_full(char *out)
{
    char buf[N + 1];
    char *p = buf;
    int count = 0;
    while (p < &buf[N]) {
        *p++ = 'a' + count;
        count++;
    }
    *p = '\0';
    strcpy(out, buf);
    return count;
}

int
main(void)
{
    char out[N + 1];
    int n = fill_until_full(out);
    printf("%d %s\n", n, out);
    return 0;
}
