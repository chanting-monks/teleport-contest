/* 53-addr-compare-both-sides/source.c — both-sides address compare
 * `&A[i] OP &B[j]` on char buffers, mirroring invent.c getobj's
 * capacity guard:
 *
 *     if (&bp[suggested] == &buf[sizeof buf - 1]) ...
 *
 * where bp aliases buf.  In C this is address arithmetic — true only
 * when the write cursor reaches the buffer's last cell.  The JS
 * string-mode fallback used to emit the left side as an advanced
 * STRING and the right side as a CHAR CODE; `'' == 0` coerces true,
 * so the guard fired on the very first loop iteration.  The fixed
 * emit compares the index expressions instead.
 *
 * Expected output:
 *   fired=0 suggested=5 lets=abcde
 *   nefired=1
 */
#include <stdio.h>

int
main(void)
{
    char buf[256];
    char *bp = buf;
    int suggested = 0;
    int fired = 0;
    int i;

    buf[0] = '\0';
    for (i = 0; i < 5; i++) {
        if (&bp[suggested] == &buf[sizeof buf - 1]) {
            /* capacity guard: must never fire for tiny inputs */
            fired = 1;
            break;
        }
        bp[suggested++] = 'a' + i;
    }
    bp[suggested] = '\0';
    /* print via bp (== buf in C): isolates the guard semantics from
       the separate string-alias write-through gap, so this test also
       passes under forced NH_STRING_MODE=1 trial runs */
    printf("fired=%d suggested=%d lets=%s\n", fired, suggested, bp);

    /* inequality form, indexes equal: `!=` must be false */
    if (&buf[3] != &buf[3])
        printf("nefired=0\n");
    else
        printf("nefired=1\n");
    return 0;
}
