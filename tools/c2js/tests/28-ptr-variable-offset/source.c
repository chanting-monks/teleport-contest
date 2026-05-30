/* 28-ptr-variable-offset/source.c — variable-offset pointer-walk init.
 *
 * Test 21 exercises `for (p = arr + 1; ...; p++)` and
 * `for (p = &arr[1]; ...; p++)` — start offset is a LITERAL.
 * This test exercises the recognizer's handling of a VARIABLE
 * start offset:
 *
 *   for (p = arr + start_idx; ...; p++) body
 *
 * The translator's `parsePtrInitAssignment` splits the
 * `arr + start_idx` into arrayNode=arr + startNode=start_idx;
 * then `forStmtWithStructPtrRewrite` emits the start expression
 * via `expr(sp.startNode, ctx)`.  For a variable, that renders
 * to a VarRef in the loop's index initializer:
 *
 *   for (let __nhi_p = start_idx; (p = arr[__nhi_p]) && cond;
 *        __nhi_p++) body
 *
 * This verifies the recognizer correctly handles non-literal
 * offsets (the AST shape is still BinaryOp(+, arr, expr)).
 */

#include <stdio.h>

struct entry {
    int key;
    int value;
};

static struct entry table[] = {
    { 1, 100 },
    { 2, 200 },
    { 3, 300 },
    { 4, 400 },
    { 5, 500 },
    { 0, 0 },   /* sentinel */
};

static int
sum_from(int start)
{
    struct entry *p;
    int total = 0;
    for (p = table + start; p->key; p++) {
        total += p->value;
    }
    return total;
}

int
main(void)
{
    printf("from 0: %d\n", sum_from(0));
    printf("from 2: %d\n", sum_from(2));
    printf("from 4: %d\n", sum_from(4));
    return 0;
}
