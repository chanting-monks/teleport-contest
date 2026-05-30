/* 27-prior-init-counter-walk/source.c — CompoundStmt-level pair
 * recognizer: prior ptr-init stmt + for-loop with counter+ptr inc.
 *
 * C idiom from NetHack monmove.c m_move's mtrack walk:
 *
 *   mtrk = mtmp->mtrack;
 *   for (j = 0; j < jcnt; mtrk++, j++) {
 *       if (nx == mtrk->x && ny == mtrk->y) goto nxti;
 *   }
 *
 * The translator's `detectStructPtrCounterLoop` recognizer (in
 * compoundStmt) pairs the prior `mtrk = arr` assignment with the
 * subsequent ForStmt that has:
 *   - init: `j = 0` (counter, must be IntegerLiteral 0)
 *   - inc: comma-expr with both `p++` and counter++
 *
 * Emits:
 *
 *   mtrk = arr;
 *   for (let j = 0; j < jcnt; j++) {
 *       mtrk = arr[j];
 *       body
 *   }
 *
 * Distinct from detectPointerIteration (test 10), which handles
 * the inline form `for (i = 0, p = &arr[0]; i < n; i++, p++)`
 * where the pointer is in the for-loop's comma-init.
 *
 * Both shapes appear in NetHack; the prior-stmt form lets a
 * function set the pointer outside the loop's init slot.
 */

#include <stdio.h>

struct entry {
    int key;
    int value;
};

static struct entry table[] = {
    { 1, 10 },
    { 2, 20 },
    { 3, 30 },
    { 4, 40 },
    { 5, 50 },
};

static int
sum_first_n(int n)
{
    struct entry *p;
    int total = 0;
    int j;
    /* Note: the recognizer requires the prior ptr-init to be a
     * separate assignment (BinaryOp), not a DeclStmt with init.
     * Matches NetHack's `mtrk = mtmp->mtrack;` pattern where the
     * pointer was declared earlier. */
    p = table;
    for (j = 0; j < n; p++, j++) {
        total += p->value;
    }
    return total;
}

int
main(void)
{
    printf("first 0: %d\n", sum_first_n(0));
    printf("first 3: %d\n", sum_first_n(3));
    printf("first 5: %d\n", sum_first_n(5));
    return 0;
}
