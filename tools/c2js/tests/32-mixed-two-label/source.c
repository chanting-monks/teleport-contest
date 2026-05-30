/* 32-mixed-two-label/source.c — exercises the A4 mixed-two-label
 * recognizer slice: a CompoundStmt with exactly two top-level labels
 * where the first is back-jump-only and the second is forward-only.
 * Pattern matches pickup.js doloot's lootcont/lootmon shape.
 *
 * Mechanical translation target:
 *
 *   let __goto_LFWD = (0);
 *   [pre stmts with goto-LFWD → flag-set]
 *   LBACK: while (true) {
 *       if (!__goto_LFWD) {
 *           [L_back body]
 *       }
 *       __goto_LFWD = (0);
 *       [L_fwd body with goto-LBACK → continue LBACK]
 *       break;
 *   }
 *
 * Three test functions cover:
 *   - basic mixed: forward goto + back-jump
 *   - forward-skip-only: forward goto fires, back-jump doesn't
 *   - back-loop-only: forward goto doesn't fire, back-jump loops
 */

#include <stdio.h>

static int
mixed_basic(int x, int max_iter)
{
    int back_count = 0;
    int fwd_count = 0;
    int iter = 0;
    if (x < 0) goto fwd;
back:
    back_count++;
fwd:
    fwd_count++;
    iter++;
    if (iter < max_iter && fwd_count < 3) goto back;
    return back_count * 100 + fwd_count;
}

static int
forward_skip_only(int x)
{
    int b = 0;
    int f = 0;
    if (x > 100) goto target;
back:
    b += 10;
    if (b < 30) goto back;     /* makes `back` a real back-jump label */
target:
    f += 1;
    return b * 100 + f;
}

static int
back_loop_only(int n)
{
    int b = 0;
    int f = 0;
    if (n < 0) goto target;
back:
    b++;
target:
    f++;
    if (f < n) goto back;
    return b * 100 + f;
}

/* Intervening-stmt case: a non-goto stmt sits between the forward
 * goto site and the L_back label.  C semantics: when the goto fires,
 * the intervening stmt is SKIPPED (goto jumps out of pre-L_back
 * region).  The recognizer must gate the intervening stmt on
 * `!__goto_LFWD`.
 */
static int
with_intervening_after_goto(int x)
{
    int pre = 0;
    int b = 0;
    int f = 0;
    if (x < 0) goto fwd;
    pre = 42;   /* must NOT run when goto fires */
back:
    b += 10;
    if (b < 30) goto back;
fwd:
    f = pre + 1;   /* if pre stayed 0, f = 1; if pre = 42, f = 43 */
    return b * 100 + f;
}

int
main(void)
{
    printf("mixed_basic(5, 3) = %d\n", mixed_basic(5, 3));
    printf("mixed_basic(-1, 3) = %d\n", mixed_basic(-1, 3));
    printf("mixed_basic(5, 1) = %d\n", mixed_basic(5, 1));
    printf("forward_skip_only(5) = %d\n", forward_skip_only(5));
    printf("forward_skip_only(150) = %d\n", forward_skip_only(150));
    printf("back_loop_only(3) = %d\n", back_loop_only(3));
    printf("back_loop_only(0) = %d\n", back_loop_only(0));
    printf("back_loop_only(-1) = %d\n", back_loop_only(-1));
    printf("with_intervening_after_goto(5) = %d\n", with_intervening_after_goto(5));
    printf("with_intervening_after_goto(-1) = %d\n", with_intervening_after_goto(-1));
    return 0;
}
