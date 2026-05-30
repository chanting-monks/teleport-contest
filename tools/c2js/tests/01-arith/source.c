/* 01-arith/source.c — minimal arithmetic + control flow + function calls.
 *
 * Phase 1 of the c2js translator should round-trip this to JS that
 * produces byte-identical stdout when run with `node generated/source.js`.
 *
 * Constructs exercised:
 *   - int variables, arithmetic
 *   - static globals
 *   - function definition, parameter, return value
 *   - function calls
 *   - while loop
 *   - for loop with declaration
 *   - if/else
 *   - printf with %d format
 */

#include <stdio.h>

/* a static global the translator should put on `game` */
static int counter = 0;

static int
add(int a, int b)
{
    return a + b;
}

/* multiplication via repeated addition exercises while + call + var update */
static int
multiply(int a, int b)
{
    int result = 0;
    int i = 0;
    while (i < b) {
        result = add(result, a);
        i = i + 1;
    }
    return result;
}

int
main(void)
{
    int x = 7;
    int y = 5;
    counter = add(x, y);
    printf("counter = %d\n", counter);

    int product = multiply(3, 4);
    printf("product = %d\n", product);

    if (product > 10) {
        printf("big\n");
    } else {
        printf("small\n");
    }

    for (int i = 0; i < 3; i++) {
        printf("i = %d\n", i);
    }

    return 0;
}
