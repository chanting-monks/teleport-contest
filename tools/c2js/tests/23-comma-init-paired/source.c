/* 23-comma-init-paired/source.c — paired pointer walks via comma-init.
 *
 * C idiom from NetHack's exist_artifact (artifact.c):
 *
 *   for (a = arr1, b = arr2; a->key; a++, b++) {
 *       // both a and b advance in lockstep
 *   }
 *
 * The translator's `detectStructPtrForLoop` recognizer extended in
 * slice 2 accepts comma-init shapes and emits a comma-form head:
 *
 *   for (let __nhi_a = 0; (b = arr2[__nhi_a], a = arr1[__nhi_a])
 *        && (a.key); __nhi_a++) body
 *
 * The "primary" pointer (the one referenced in cond, here `a`) is
 * placed LAST in the comma chain so the comma's value drives loop
 * termination.
 *
 * Without the recognizer, both `a++` and `b++` translate to
 * `(X = __nh_blackhole)` and the loop exits after one iteration
 * with both pointing at the Proxy sentinel.
 */

#include <stdio.h>

struct ka {
    int key;
};

struct vb {
    int value;
};

static struct ka keys[] = {
    { 1 }, { 2 }, { 3 }, { 4 }, { 0 },  /* sentinel */
};

static struct vb values[] = {
    { 100 }, { 200 }, { 300 }, { 400 }, { 0 },
};

static int
sum_matching(int target_key)
{
    struct ka *a;
    struct vb *b;
    int total = 0;
    for (a = keys, b = values; a->key; a++, b++) {
        if (a->key == target_key) total += b->value;
    }
    return total;
}

static int
sum_until_zero(void)
{
    struct ka *a;
    struct vb *b;
    int total = 0;
    for (a = keys, b = values; a->key; a++, b++) {
        total += a->key * b->value;
    }
    return total;
}

int
main(void)
{
    printf("key 2: %d\n", sum_matching(2));
    printf("key 9: %d\n", sum_matching(9));
    printf("weighted sum: %d\n", sum_until_zero());
    return 0;
}
