/* 34-char-param-walker-alias/source.c — char* param walker with
 * a save-original alias.
 *
 * Real-world shape: `getlin(prompt, char *bufp)` does
 *   `char *obufp = bufp;`
 *   ...
 *   *bufp++ = c;
 *   ...
 *   pline("%s", obufp);
 *
 * The save-original alias `obufp = bufp` captures the start of the
 * caller's buffer before the walker advances bufp.  The post-loop
 * read needs to see the buffer from position 0 (the original), not
 * from wherever bufp ended up.
 *
 * In v1's rewrite (commit 951553e), bufp's references are routed
 * through `bufp[__nh_bufp_idx]` and the actual JS reference to
 * `bufp` stays as the array — never reassigned, never advanced.
 * That means `let obufp = bufp;` copies the array reference, and
 * obufp == bufp (same array, no advancement on either side).
 * Reading from obufp with `printf("%s", obufp)` walks from
 * position 0 and reports "hi".
 *
 * The verifier in v1 rejects this pattern because the init of the
 * obufp alias ('= bufp' DeclRef without a *) isn't in the walker
 * safe-set.  v2 extends the verifier to ALLOW exactly one
 * read-only alias decl ('char *ALIAS = PARAM;' or a const-cast
 * variant), with the alias's body uses themselves restricted to
 * safe reads (no *alias = X, no alias++, no alias as a function
 * arg that could escape).
 */

#include <stdio.h>
#include <string.h>

static void
save_then_write(char *bufp)
{
    char *obufp = bufp;
    *bufp++ = 'h';
    *bufp++ = 'i';
    *bufp = '\0';
    printf("%s\n", obufp);
}

int
main(void)
{
    char buf[16];
    memset(buf, 0, sizeof buf);
    save_then_write(buf);
    return 0;
}
