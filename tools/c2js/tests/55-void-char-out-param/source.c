/* 55-void-char-out-param/source.c — §23.239 void-char*-out-param
 * convention, modeled on windows.c getlin:
 *
 *     void getlin(const char *query, char *bufp);   C out-param
 *     char buf[BUFSZ]; getlin(qbuf, buf);           caller reads buf
 *
 * JS strings pass by value, so no implementation can write back
 * through the param.  The convention: the callee returns the buffer
 * at EVERY exit (mid-body `return;` included), and statement-level
 * call sites rebind (`buf = getlin(qbuf, buf)`).  `fillbuf` is the
 * configured test writer in VOID_CHAR_OUT_PARAM_RETURNS.
 *
 * Expected output:
 *   got=hello
 *   got=X
 */
#include <stdio.h>

static void
fillbuf(const char *src, char *out)
{
    int i;

    if (src[0] == 'X') {
        /* mid-body exit: convention must still return the buffer */
        out[0] = 'X';
        out[1] = '\0';
        return;
    }
    for (i = 0; src[i]; i++)
        out[i] = src[i];
    out[i] = '\0';
}

int
main(void)
{
    char buf[16];

    buf[0] = '\0';
    fillbuf("hello", buf);
    printf("got=%s\n", buf);
    fillbuf("X-rest-ignored", buf);
    printf("got=%s\n", buf);
    return 0;
}
