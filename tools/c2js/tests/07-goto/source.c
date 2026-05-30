/* 07-goto/source.c — forward goto, the most common pattern in NetHack.
 *
 * Constructs exercised:
 *   - `goto LABEL` inside a for body, jumping to a `LABEL: ;` later
 *     in the same body.  Equivalent to `continue` in idiomatic JS,
 *     but the translator handles it by wrapping the pre-label segment
 *     in a `LABEL: { ... break LABEL; }` block.
 *   - Multiple labels in the same compound statement (LABEL1: ...
 *     LABEL2: ...).
 *   - A label at end of a function body with cleanup code after it.
 */

#include <stdio.h>

struct rect {
    int lx, ly, hx, hy;
};

/* find_rect: linear search.  Each rectangle is checked, on miss we
 * `goto next` to skip to the next iteration. */
static int
find_rect(struct rect *rs, int n, int x, int y)
{
    int i;
    for (i = 0; i < n; i++) {
        if (x < rs[i].lx) goto next;
        if (x > rs[i].hx) goto next;
        if (y < rs[i].ly) goto next;
        if (y > rs[i].hy) goto next;
        return i;
        next: ;
    }
    return -1;
}

/* validate: multiple early-exit gotos to a single cleanup label. */
static int
validate(int a, int b, int c)
{
    int valid = 1;
    if (a < 0)  goto fail;
    if (b < a)  goto fail;
    if (c < b)  goto fail;
    return valid;
    fail:
    valid = 0;
    return valid;
}

int
main(void)
{
    struct rect rs[3] = {
        { 0,  0,  5,  5 },
        { 10, 10, 15, 15 },
        { 20, 20, 25, 25 },
    };

    printf("(2,3) -> %d\n", find_rect(rs, 3, 2, 3));
    printf("(12,12) -> %d\n", find_rect(rs, 3, 12, 12));
    printf("(22,22) -> %d\n", find_rect(rs, 3, 22, 22));
    printf("(99,99) -> %d\n", find_rect(rs, 3, 99, 99));

    printf("validate(1,2,3) = %d\n", validate(1, 2, 3));
    printf("validate(-1,2,3) = %d\n", validate(-1, 2, 3));
    printf("validate(1,5,3) = %d\n", validate(1, 5, 3));

    return 0;
}
