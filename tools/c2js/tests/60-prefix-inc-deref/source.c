/* 60-prefix-inc-deref/source.c — `*++p` as a VALUE must read the
 * byte at the advanced position (Q9 iteration 31).
 *
 * display_pickinv's class loop `if (*++invlet) goto nextclass;`
 * walks flags.inv_order; the emit's inner prefix-inc renders as an
 * advance-assign whose VALUE is the advanced suffix — truthy even
 * when exhausted for array-backed buffers ([] is truthy), so the
 * loop never terminated (the seed4500 census hang).
 *
 * Expected output:
 *   classes=3
 *   last=99
 */
#include <stdio.h>

int
main(void)
{
    char order[5];
    const char *invlet;
    int classes = 1;
    int last = 0;

    order[0] = 'a';
    order[1] = 'b';
    order[2] = 'c';
    order[3] = '\0';
    invlet = order;
    while (*++invlet) {
        classes++;
        last = *invlet;
    }
    printf("classes=%d\n", classes);
    printf("last=%d\n", last);
    return 0;
}
