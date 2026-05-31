/* 44-ternary-divisor/source.c — ternary as integer-division divisor
 *
 * Tests the binaryOp(/) and compoundAssign(/=) emit fix for the
 * ternary-precedence bug (commit 1708073).
 *
 * JS precedence: `/` (14) > `?:` (4).  So `Math.trunc(x / cond ? a : b)`
 * parses as `Math.trunc(x / cond) ? a : b` — the ternary captures
 * the entire expression instead of being the divisor.
 *
 * Fix: detect ConditionalOperator as RHS of `/` or `/=` and wrap in
 * extra parens.
 *
 * Pattern (mirrors makemon.c::m_initgrp):
 *   int cnt = 40;
 *   cnt /= (some_flag) ? 4 : 2;
 *   // Should give cnt = 40/4 = 10 (or 40/2 = 20), NOT just 4 or 2.
 */

#include <stdio.h>
#include <string.h>

static int
divide_by_ternary(int cnt, int flag)
{
    cnt /= (flag) ? 4 : 2;
    return cnt;
}

static int
divide_in_expr(int cnt, int flag)
{
    int r = cnt / ((flag) ? 4 : 2);
    return r;
}

int
main(void)
{
    printf("%d %d\n", divide_by_ternary(40, 1), divide_by_ternary(40, 0));
    printf("%d %d\n", divide_in_expr(40, 1), divide_in_expr(40, 0));
    return 0;
}
