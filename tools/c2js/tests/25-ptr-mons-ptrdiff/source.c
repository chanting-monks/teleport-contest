/* 25-ptr-mons-ptrdiff/source.c — `ptr - mons` ptrdiff recognizer.
 *
 * C idiom from NetHack mon.c (NODIAG macro, dragon-scale lookup):
 *
 *   nodiag = NODIAG(mdat - mons);
 *   mndx = (int) (Dragon_scales_to_pm(armr) - mons);
 *
 * where `mons` is the global monster-data table.  In C, the
 * pointer subtraction `ptr - mons` yields a ptrdiff_t — the
 * integer index of ptr within mons[].
 *
 * In JS, both operands are object references, so subtraction
 * yields NaN.  The translator's `binaryOp` recognizer detects
 * this exact shape via PTRDIFF_TABLES and rewrites to use the
 * `pmidx` field which every mons[] entry pre-initializes to its
 * own array index:
 *
 *   nodiag = (mdat).pmidx == PM_GRID_BUG;
 *
 * Test exercises the AST signature: BinaryOperator(-) with the
 * RHS being a DeclRefExpr to `mons` (array-typed global).
 */

#include <stdio.h>

/* Simulate a permonst-like table with a self-index field. */
struct permonst {
    int pmidx;  /* array index, set at init */
    int mlet;
};

#define PM_FIRST   0
#define PM_SECOND  1
#define PM_THIRD   2

static struct permonst mons[] = {
    { 0, 100 },
    { 1, 200 },
    { 2, 300 },
};

static int
get_pmidx(struct permonst *p)
{
    /* Pointer subtraction: yields ptr's index in mons[] */
    return (int) (p - mons);
}

int
main(void)
{
    printf("first idx: %d\n", get_pmidx(&mons[PM_FIRST]));
    printf("second idx: %d\n", get_pmidx(&mons[PM_SECOND]));
    printf("third idx: %d\n", get_pmidx(&mons[PM_THIRD]));
    return 0;
}
