/* 10-ptr-iter/source.c — pointer iteration over a struct array.
 *
 * The C idiom `for (i = 0, p = &arr[0]; i < N; i++, p++)` is a hot
 * path in NetHack (rect.c, mklev.c, monmove.c, ...) where C's pointer
 * arithmetic incrementally walks a struct array.  JS objects are
 * references, not byte-addressable memory, so `p++` on an object
 * yields NaN.  The translator must rewrite this loop pattern to use
 * array indexing.
 *
 * Constructs exercised:
 *   - for-loop with comma-init (`i = 0, p = &arr[0]`)
 *   - for-loop with comma-inc (`i++, p++`)
 *   - access through the pointer: `p->field`
 *   - the pointer also re-used across loop iterations
 */

#include <stdio.h>

struct entry {
    int key;
    int value;
};

static const struct entry table[] = {
    { 1, 100 },
    { 2, 200 },
    { 3, 300 },
    { 4, 400 },
};

#define TABLE_SIZE 4

static int
find_value(int key)
{
    int i;
    const struct entry *p;
    for (i = 0, p = &table[0]; i < TABLE_SIZE; i++, p++) {
        if (p->key == key) return p->value;
    }
    return -1;
}

int
main(void)
{
    printf("key 1 -> %d\n", find_value(1));
    printf("key 3 -> %d\n", find_value(3));
    printf("key 5 -> %d\n", find_value(5));
    return 0;
}
