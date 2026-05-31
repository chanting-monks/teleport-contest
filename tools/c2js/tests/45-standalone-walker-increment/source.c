/* 45-standalone-walker-increment/source.c — `*p = X; p++;` as two
 * statements (NOT combined `*p++ = X`).
 *
 * Tests the standalone-increment safe-set extension and emit (commit
 * follow-up to test 44's ternary divisor fix).
 *
 * Before: the verifier safe-set rejected `bufp++` standalone increment
 * because isCharBufferWriteUsage required the `++` to be wrapped in
 * `*` (`*bufp++ = X` form).  The two-statement variant in
 * windows.c::getlin and similar input-readers fell through to the
 * scalar-ptr emit (`bufp.value = X; bufp++;`), which is broken when
 * bufp is an array argument — the .value write sets a property
 * nobody reads, and the ++ increments a number that doesn't index
 * the array.
 *
 * After: isCharBufferStandaloneIncrement accepts `p++` / `++p` / `p--`
 * / `--p` standalone (parent of UnaryOp(++) is NOT UnaryOp(*)).  The
 * verifier accepts the standalone form.  unaryOp's emit produces
 * `__nh_p_idx++` for recognized walkers.  hasCharBufferTrueWrite
 * gates the recognizer to require at least one concrete `*p = X` or
 * `*p++ = X` so read-only walkers don't get accidentally rewritten.
 *
 * Pattern: char[] local + two-statement write/advance loop.  Uses a
 * char[] for the source so JS-runtime char-by-int comparison is
 * unambiguously numeric (avoiding a string vs number coercion that
 * would mask the walker test).
 *
 * Expected emit:
 *   let __nh_p_idx = 0;
 *   while (src[i] != 0) {
 *       buf[__nh_p_idx] = src[i];
 *       __nh_p_idx++;
 *       i++;
 *   }
 *
 * Runtime: copy "abc" into buf via two-statement walker, then strlen=3.
 */
#include <stdio.h>
#include <string.h>

static unsigned long
two_stmt_walker(void)
{
    char buf[8];
    char *p = buf;
    char src[4];
    int i = 0;
    src[0] = 'a'; src[1] = 'b'; src[2] = 'c'; src[3] = '\0';
    while (src[i] != '\0') {
        *p = src[i];
        p++;
        i++;
    }
    *p = '\0';
    return strlen(buf);
}

int
main(void)
{
    printf("%lu\n", two_stmt_walker());
    return 0;
}
