/* 12-extern/source.c — external-symbol detection.
 *
 * Constructs exercised:
 *   - Reference to a function declared in <stdlib.h> (`abs`).  Since
 *     it's not defined in this TU, the translator should detect it as
 *     external and emit an import for it from
 *     js/c2js-runtime/math.js.
 *   - A locally-defined function (`my_sgn`) that should NOT be
 *     imported — it's in the local-names set.
 *   - A few callsites of each, verifying the C and JS forms produce
 *     byte-identical output.
 */

#include <stdio.h>
#include <stdlib.h>     /* abs */

static int
my_sgn(int x)
{
    return x > 0 ? 1 : x < 0 ? -1 : 0;
}

int
main(void)
{
    printf("abs(-7) = %d\n", abs(-7));
    printf("abs(3) = %d\n", abs(3));
    printf("my_sgn(-5) = %d\n", my_sgn(-5));
    printf("my_sgn(0) = %d\n", my_sgn(0));
    printf("my_sgn(7) = %d\n", my_sgn(7));
    return 0;
}
