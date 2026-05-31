/* 36-assign-init-walker/source.c — char* local with assignment-init walker
 *
 * Tests the charBufferRewrites assignment-init recognizer landed in
 * §23.216 (commit 0303caf).  Pattern: `char *p; ...; p = bufRef; *p++ = X;`
 * where the char-pointer local is declared without init and gets its
 * first concrete value from a body-level assignment.
 *
 * This is the split-decl form found in NetHack's hacklib.c::strNsubst
 * (`for (bp = inoutbuf, op = workbuf; ...)`) — common when multiple
 * char-pointer locals get bulk-initialized in a for-init comma
 * expression.
 *
 * The bp_idx/op_idx position trackers must:
 *   - reset to 0 at the assignment-init point (`__nh_p_idx = 0`)
 *   - advance correctly through *p++ = X writes
 *   - support null-terminate `*p = '\0'` at the final position
 */

#include <stdio.h>
#include <string.h>

static void
fill_buf(char *dst)
{
    char *p;
    p = dst;            /* assignment-init: __nh_p_idx = 0 */
    *p++ = 'h';
    *p++ = 'i';
    *p++ = '!';
    *p = '\0';          /* null-terminate at current position */
}

int
main(void)
{
    char buf[16];
    memset(buf, 0, sizeof buf);
    fill_buf(buf);
    printf("%s\n", buf);
    return 0;
}
