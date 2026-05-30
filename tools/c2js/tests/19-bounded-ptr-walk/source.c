/* 19-bounded-ptr-walk/source.c — bounded pointer walks.
 *
 * C idiom common in NetHack shop-bill iteration:
 *
 *   for (p = arr, end_p = &arr[N]; p < end_p; p++) body
 *
 * The translator's `detectBoundedStructPtrForLoop` recognizer
 * detects this two-pointer-init-with-cond-comparison shape and
 * rewrites to indexed iteration `for (let __nhi_p = 0;
 * __nhi_p < N && (p = arr[__nhi_p]); __nhi_p++) body`.
 *
 * Without the recognizer, JS would emit `p < end_p` (NaN compare,
 * always false → loop never enters) and `p++` as `(p = __nh_blackhole)`.
 *
 * Constructs exercised:
 *   - comma-init with two struct-pointer locals
 *   - cond is exactly `iter < boundary`
 *   - inc is just `iter++` (boundary stays fixed)
 *   - boundary init is `&arr[count]` shape
 */

#include <stdio.h>

struct rec {
    int key;
    int value;
};

static struct rec items[] = {
    { 1, 10 },
    { 2, 20 },
    { 3, 30 },
    { 4, 40 },
    { 5, 50 },
};

static int
sum_first(int n)
{
    struct rec *p, *end_p;
    int total = 0;
    for (p = items, end_p = &items[n]; p < end_p; p++) {
        total += p->value;
    }
    return total;
}

int
main(void)
{
    printf("first 0: %d\n", sum_first(0));
    printf("first 3: %d\n", sum_first(3));
    printf("first 5: %d\n", sum_first(5));
    return 0;
}
