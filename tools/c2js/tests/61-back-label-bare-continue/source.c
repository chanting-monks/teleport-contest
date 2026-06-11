/* 61-back-label-bare-continue/source.c — bare continue/break inside
 * a back-jump label region must bind to the ENCLOSING loop, not to
 * the synthetic `LABEL: while (true)` wrapper the translator emits
 * for the label.
 *
 * Mirrors invent.c getobj: a prompt for(;;) loop containing a
 * back-jump label (redo_menu).  The not-found path says `continue`
 * meaning "re-read the prompt" (outer loop); with the old emit it
 * re-entered the synthetic wrapper instead, spinning forever on
 * "You don't have that object." (seed0101 OOM).  The success path's
 * bare `break` must likewise exit the OUTER loop.
 *
 * Expected output:
 *   key=1 miss
 *   key=2 menu
 *   key=3 hit
 *   done ilet=3 reads=3
 */
#include <stdio.h>

static int keys[] = { 1, 2, 3, 4, 5 };
static int nextkey = 0;

static int
readkey(void)
{
    return keys[nextkey++];
}

int
main(void)
{
    int ilet = 0, reads = 0;

    for (;;) {
        ilet = readkey();
        reads++;
        if (ilet == 0)
            continue; /* pre-label bare continue: outer loop as-is */
 redo_menu:
        if (ilet == 2) {
            printf("key=%d menu\n", ilet);
            ilet = readkey();
            reads++;
            if (ilet == 2)
                goto redo_menu;
        }
        if (ilet == 1) {
            printf("key=%d miss\n", ilet);
            continue; /* must re-read via the OUTER loop */
        }
        printf("key=%d hit\n", ilet);
        break; /* must exit the OUTER loop */
    }
    printf("done ilet=%d reads=%d\n", ilet, reads);
    return 0;
}
