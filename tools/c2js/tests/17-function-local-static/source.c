/* 17-function-local-static/source.c — function-local `static` must
 * persist across calls.
 *
 * Before this test passed, the translator emitted `static T x = init;`
 * inside a function as `let T x = init;` — losing the cross-call
 * persistence that C's `static` semantics guarantee.  The fix hoists
 * function-local statics to module-scope `let __funcname_varname = init`
 * declarations, and rewrites references inside the function body to
 * the hoisted name.
 *
 * Constructs exercised:
 *   - `static int counter = 0;` (scalar) persistence across calls
 *   - assignment + read-back on the same static
 *   - multiple statics in the same function
 *   - a static with no initializer (must zero-init at module load)
 */

#include <stdio.h>

static int
bump(void)
{
    static int counter = 0;
    static int even_count;     /* no init — must zero at module load */
    counter = counter + 1;
    if ((counter & 1) == 0) {
        even_count = even_count + 1;
    }
    return counter * 100 + even_count;
}

int
main(void)
{
    /* Four calls: counter ends at 4, even_count at 2 (calls 2 and 4). */
    printf("call1=%d\n", bump());
    printf("call2=%d\n", bump());
    printf("call3=%d\n", bump());
    printf("call4=%d\n", bump());
    return 0;
}
