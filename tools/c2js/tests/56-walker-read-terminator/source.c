/* 56-walker-read-terminator/source.c — char-walker READ form
 * `(sym = *ip++) != '\0'` (invent.c ggetobj).
 *
 * In a string-mode TU the walker read used to emit `buf[idx++]`,
 * which on a JS string yields a one-char STRING (so byte compares
 * coerce wrong) or `undefined` past the end — and `undefined != 0`
 * is TRUE, so the terminator test never fired (seed5002 OOM, Q9
 * iteration 13).  The read must route through the char helpers,
 * giving byte numbers with 0 at end-of-string.
 *
 * Expected output:
 *   97 98 99
 *   n=3
 */
#include <stdio.h>

int
main(void)
{
    char buf[16];
    char *ip;
    int sym;
    int n = 0;

    buf[0] = 'a';
    buf[1] = 'b';
    buf[2] = 'c';
    buf[3] = '\0';

    ip = buf;
    while ((sym = *ip++) != '\0') {
        printf("%d ", sym);
        n++;
        if (n > 8) break; /* hard stop if the terminator is missed */
    }
    printf("\nn=%d\n", n);
    return 0;
}
