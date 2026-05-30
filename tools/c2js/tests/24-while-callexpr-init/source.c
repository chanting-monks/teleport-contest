/* 24-while-callexpr-init/source.c — while-loop pointer walk with
 * CallExpr init.
 *
 * C idiom from NetHack's u_init.js restricted_spell_discipline:
 *
 *   const struct rec *p = pick_table_for_role();
 *   while (p->key) {
 *       body using p
 *       p++;
 *   }
 *
 * The translator's `detectWhilePtrWalk` recognizer captures p's
 * CURRENT VALUE (whatever the call returned) into a temp before
 * the loop, avoiding re-evaluation of the function call each
 * iteration:
 *
 *   const __nhi_p_arr = p;
 *   for (let __nhi_p = 0;
 *        (p = __nhi_p_arr[__nhi_p]) && (p && p.key);
 *        __nhi_p++) body
 *
 * This was specifically the slice 3b refactor (commit 985aa32):
 * moving from a 2-statement pair pattern to a single-WhileStmt
 * recognizer with temp-capture, so ANY init expression shape
 * (CallExpr included) is handled correctly.
 *
 * Test verifies that calling `pick_a` once gives the correct
 * sum from arr_a's entries, NOT calling it once per iteration.
 *
 * Constructs exercised:
 *   - DeclStmt with CallExpr init (`p = func()`)
 *   - WhileStmt with cond `p && p->key`
 *   - body ending with `p++`
 *   - the function call must NOT be re-invoked per iter
 */

#include <stdio.h>

struct entry {
    int key;
    int value;
};

static struct entry arr_a[] = {
    { 1, 10 },
    { 2, 20 },
    { 3, 30 },
    { 0, 0 },   /* sentinel */
};

static struct entry arr_b[] = {
    { 7, 70 },
    { 0, 0 },
};

static int call_count = 0;

static struct entry *
pick(int which)
{
    call_count++;
    return (which == 0) ? arr_a : arr_b;
}

static int
sum_table(int which)
{
    const struct entry *p = pick(which);
    int total = 0;
    while (p && p->key) {
        total += p->value;
        p++;
    }
    return total;
}

int
main(void)
{
    call_count = 0;
    int a = sum_table(0);
    int calls_after_a = call_count;
    int b = sum_table(1);
    int calls_after_b = call_count;
    printf("a=%d (calls=%d)\n", a, calls_after_a);
    printf("b=%d (calls=%d)\n", b, calls_after_b);
    return 0;
}
