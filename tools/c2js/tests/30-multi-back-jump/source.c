/* 30-multi-back-jump/source.c — exercises A3's extension to handle
 * MULTIPLE backward-only labels at the same compound level.  Each
 * label becomes a nested `LABEL: while (true) { ... }` loop; `goto Li`
 * from inside the innermost wrap emits as `continue Li`, which JS's
 * labeled-continue resolves to the named enclosing loop.
 *
 * Three variants:
 *   - two_label_nested: L1 outer + L2 inner; gotos from after L2
 *   - three_label_nested: L1, L2, L3 all backward-only; full nesting
 *   - mixed_with_inner_if: gotos guarded by `if` blocks
 *
 * If the recognizer's nesting is wrong, the back-jumps reset the
 * wrong loop variable and the output diverges from C.
 */

#include <stdio.h>

static int
two_label_nested(int seed)
{
    int outer = 0, inner = 0;
L1:
    outer++;
L2:
    inner++;
    if (inner < 3) goto L2;
    if (outer < 2) goto L1;
    return outer * 100 + inner;
}

static int
three_label_nested(int seed)
{
    int a = 0, b = 0, c = 0;
A:
    a++;
    b = 0;
B:
    b++;
    c = 0;
C:
    c++;
    if (c < 2) goto C;
    if (b < 2) goto B;
    if (a < 2) goto A;
    return a * 10000 + b * 100 + c;
}

static int
mixed_with_inner_if(int seed)
{
    int total = 0;
    int outer = 0;
    int inner = 0;
loop1:
    outer++;
    inner = 0;
loop2:
    inner++;
    total += outer + inner;
    if (inner < seed) goto loop2;
    if (outer < seed) goto loop1;
    return total;
}

int
main(void)
{
    printf("two_label_nested(0) = %d\n", two_label_nested(0));
    printf("three_label_nested(0) = %d\n", three_label_nested(0));
    printf("mixed_with_inner_if(3) = %d\n", mixed_with_inner_if(3));
    printf("mixed_with_inner_if(1) = %d\n", mixed_with_inner_if(1));
    return 0;
}
