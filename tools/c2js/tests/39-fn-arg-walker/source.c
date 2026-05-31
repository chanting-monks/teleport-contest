/* 39-fn-arg-walker/source.c — char[] local walker passed to strlen.
 *
 * Tests the §23.217 function-arg bare-pointer recognizer
 * (READ_ONLY_STRING_CALLEES allowlist, commit d1019d6).  When a
 * char-pointer walker variable appears as the bare argument to
 * a known read-only string function (strlen, strncmp, etc.), the
 * translator emits `${bufRef}.slice(${idxName})` instead of
 * leaving the bare walker reference (which would reference an
 * undeclared variable since p gets replaced by an idx tracker).
 *
 * Pattern: walker into a char[] LOCAL (`char buf[N]`) — this
 * exercises the decl-init recognizer.  Walker advances via
 * `p += N` (advance pattern from §23.217), then bare `p` is
 * passed to strlen.
 *
 * Expected emit (when recognized):
 *   let __nh_p_idx = 0;
 *   __nh_p_idx += 1;
 *   return strlen(buf.slice(__nh_p_idx));
 *
 * Runtime: buf = "abc\0", advance by 1, strlen of suffix "bc" = 2.
 */

#include <stdio.h>
#include <string.h>

static unsigned long
walk_then_measure(void)
{
    char buf[4];
    char *p = buf;
    buf[0] = 'a'; buf[1] = 'b'; buf[2] = 'c'; buf[3] = '\0';
    p += 1;               /* advance one — uses advance pattern */
    return strlen(p);     /* should be strlen("bc") = 2 */
}

int
main(void)
{
    printf("%lu\n", walk_then_measure());
    return 0;
}
