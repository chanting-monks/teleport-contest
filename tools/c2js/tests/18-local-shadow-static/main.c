/* 18-local-shadow-static/main.c — verify a function-local `step`
 * is not shadowed by helpers.c's file-static `static int step`.
 *
 * The TU-local `step` should retain ITS own value (5, then 10) and
 * should NOT clobber the helpers.c `step` (which starts at 10 and
 * is bumped to 11 by bump_helper_step).
 */

#include <stdio.h>

extern int get_helper_step(void);
extern void bump_helper_step(void);

int
local_doubler(int seed)
{
    int step = seed;        /* local, must NOT be helpers.c's step */
    step = step * 2;
    return step;
}

int
main(void)
{
    int initial_helper = get_helper_step();
    int doubled = local_doubler(5);
    int still_initial = get_helper_step();
    bump_helper_step();
    int bumped = get_helper_step();
    int second_doubled = local_doubler(50);
    printf("initial_helper=%d\n", initial_helper);
    printf("doubled=%d\n", doubled);
    printf("still_initial=%d\n", still_initial);
    printf("bumped=%d\n", bumped);
    printf("second_doubled=%d\n", second_doubled);
    return 0;
}
