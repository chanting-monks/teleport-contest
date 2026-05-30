/* 21-ptr-offset-init/source.c — `arr + N` start offset in pointer walks.
 *
 * C idiom common in NetHack artilist walks:
 *
 *   for (p = arr + 1; p->key; p++) body
 *
 * The translator's `detectStructPtrForLoop` recognizer parses the
 * `arr + 1` init via `parsePtrInitAssignment` to extract
 * arrayNode=arr and startNode=1, then emits:
 *
 *   for (let __nhi_p = 1; (p = arr[__nhi_p]) && (p.key); __nhi_p++) body
 *
 * Without the recognizer, the translator emits broken
 * `(p = arr + 1[__nhi_p])` which is `arr + undefined = NaN`.
 *
 * Also exercises `&arr[N]` shape via the `find_after_N` variant.
 */

#include <stdio.h>

struct entry {
    int key;
    int value;
};

static struct entry table[] = {
    { 0, 0 },     /* placeholder; skipped via `arr + 1` */
    { 1, 100 },
    { 2, 200 },
    { 3, 300 },
    { 0, 0 },     /* sentinel */
};

static int
find_from_1(int key)
{
    /* C idiom: walk starting from arr[1] (skip placeholder at [0]) */
    const struct entry *p;
    for (p = table + 1; p->key; p++) {
        if (p->key == key) return p->value;
    }
    return -1;
}

static int
find_from_addr_idx(int key)
{
    /* C idiom: walk starting from &arr[1] (same semantics, AST is
     * `UnaryOp(&, ArraySubscript(arr, 1))` instead of
     * `BinaryOp(+, arr, 1)`). */
    const struct entry *p;
    for (p = &table[1]; p->key; p++) {
        if (p->key == key) return p->value;
    }
    return -1;
}

int
main(void)
{
    printf("from+1 key=2: %d\n", find_from_1(2));
    printf("from+1 key=5: %d\n", find_from_1(5));
    printf("from&[1] key=3: %d\n", find_from_addr_idx(3));
    return 0;
}
