/* 31-forward-into-if/source.c — exercises the narrow A4 recognizer
 * slice: forward goto into a nested IfStmt body where the LabelStmt
 * is the FIRST child of the body.
 *
 * Variants:
 *   - single_goto: one goto site, no intervening stmts
 *   - with_intervening: one goto, several stmts in between to verify
 *     they are gated on `!__goto_LABEL`
 *   - multiple_goto_sites: two goto sites set the flag
 *
 * Each function exercises:
 *   - `if (condA) goto LABEL;` set the flag
 *   - intervening stmts skipped on goto
 *   - target IfStmt fires on `flag || condB`
 *   - body inside the target IfStmt runs
 */

#include <stdio.h>

static int
single_goto(int x)
{
    int result = 0;
    if (x < 0) goto skip;
    result = x * 2;
    if (x > 100) {
    skip:
        result = -1;
    }
    return result;
}

static int
with_intervening(int x)
{
    int total = 0;
    int side_effect = 0;
    if (x < 0) goto cleanup;
    total += x;
    side_effect = x * 10;
    total += side_effect;
    if (x == 0) {
    cleanup:
        total = -999;
    }
    return total;
}

static int
multiple_goto_sites(int x, int y)
{
    int result = 0;
    if (x < 0) goto err;
    if (y < 0) goto err;
    result = x + y;
    if (x + y > 1000) {
    err:
        result = -1;
    }
    return result;
}

int
main(void)
{
    printf("single_goto(5) = %d\n", single_goto(5));
    printf("single_goto(-3) = %d\n", single_goto(-3));
    printf("single_goto(150) = %d\n", single_goto(150));
    printf("with_intervening(5) = %d\n", with_intervening(5));
    printf("with_intervening(-1) = %d\n", with_intervening(-1));
    printf("with_intervening(0) = %d\n", with_intervening(0));
    printf("multiple_goto_sites(3, 4) = %d\n", multiple_goto_sites(3, 4));
    printf("multiple_goto_sites(-1, 4) = %d\n", multiple_goto_sites(-1, 4));
    printf("multiple_goto_sites(3, -1) = %d\n", multiple_goto_sites(3, -1));
    printf("multiple_goto_sites(600, 600) = %d\n", multiple_goto_sites(600, 600));
    return 0;
}
