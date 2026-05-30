/* 16-param-shadow-static/main.c — uses `magical` as a function
 * parameter.  Must NOT pick up the file-static `magical[]` from
 * helpers.c.
 */

#include <stdio.h>

extern int sum_classes(void);

static int
check_flag(int magical)
{
    return magical * 2;
}

int
main(void)
{
    printf("sum_classes=%d\n", sum_classes());
    printf("check_flag(7)=%d\n", check_flag(7));
    return 0;
}
