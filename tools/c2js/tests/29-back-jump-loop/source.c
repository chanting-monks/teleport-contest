/* 29-back-jump-loop/source.c — exercises A3 goto-back-jump-as-while-true
 * recognizer in translate.mjs.
 *
 * Three back-jump patterns:
 *   - simple counter retry (bumps a value until a condition is met)
 *   - retry with a side-effecting pre-label statement
 *   - retry with VarDecls declared inside the labeled region
 *
 * Each function uses `LABEL: ...; if (cond) goto LABEL;` — a back-jump
 * with no forward gotos to the same label.  The translator's pure-back-
 * jump path should emit `LABEL: while (true) { ...; if (cond) continue
 * LABEL; ...; break; }`.
 */

#include <stdio.h>

static int
bump_until(int start, int target)
{
    int x = start;
retry:
    x++;
    if (x < target) goto retry;
    return x;
}

static int
accumulate_until(int start, int cap)
{
    int total = 0;
    int n = start;
again:
    total += n;
    n++;
    if (total < cap) goto again;
    return total;
}

static int
walk_with_decl(int seed)
{
    int sum = 0;
retry:
    {
        int local = seed;
        sum += local;
        seed--;
    }
    if (seed > 0) goto retry;
    return sum;
}

int
main(void)
{
    printf("bump_until(0, 5) = %d\n", bump_until(0, 5));
    printf("bump_until(3, 5) = %d\n", bump_until(3, 5));
    printf("bump_until(10, 5) = %d\n", bump_until(10, 5));
    printf("accumulate_until(1, 10) = %d\n", accumulate_until(1, 10));
    printf("accumulate_until(5, 5) = %d\n", accumulate_until(5, 5));
    printf("walk_with_decl(4) = %d\n", walk_with_decl(4));
    printf("walk_with_decl(1) = %d\n", walk_with_decl(1));
    return 0;
}
