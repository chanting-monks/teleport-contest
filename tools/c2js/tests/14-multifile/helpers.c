/* 14-multifile/helpers.c — exporter side of a two-TU test.
 *
 * Defines functions, a const data table, AND a mutable counter that
 * main.c increments.  The translator should:
 *   1. Pre-scan helpers.c.  Functions/const → cross-TU symbol
 *      table → JS imports.  Mutable counter → tree-wide
 *      gameHoistedNames → game.counter rewrite in BOTH files.
 *   2. Translate each TU with both maps available.
 */

#include <stdio.h>

const int LIMITS[] = { 10, 100, 1000 };

/* Mutable file-private (or extern in a real port) — gets hoisted
 * onto game per spec §2.  Both helpers.js and main.js should
 * reference it as `game.call_count`. */
int call_count = 0;

int
add(int a, int b)
{
    call_count++;
    return a + b;
}

int
square(int n)
{
    call_count++;
    return n * n;
}

void
greet(void)
{
    printf("hello from helpers\n");
}
