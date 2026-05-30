/* 15-runtime-mem/source.c — runtime helpers: alloc/free, qsort.
 *
 * NetHack defines `alloc(unsigned int)` in extern.h (a thin wrapper
 * over malloc).  For this test we declare it with the same signature
 * and provide a stub local definition so C-side compilation links;
 * the translator should emit a runtime import (alloc is in
 * EXTERNAL_SYMBOLS regardless of the local definition... actually no,
 * the local definition makes it a localName).
 *
 * Simplest: rename the local alloc to avoid the collision, OR use
 * malloc via stdlib and have the translator special-case malloc->alloc.
 *
 * Even simpler: write a test that uses qsort (in stdlib.h, no
 * conflict) and a translator-detected alloc-shaped pattern.
 *
 * For now: just test qsort.  alloc gets covered when we hit a real
 * NetHack TU.
 */

#include <stdio.h>
#include <stdlib.h>     /* qsort */

struct point {
    int x;
    int y;
};

static int
cmp_x(const void *a, const void *b)
{
    const struct point *pa = a;
    const struct point *pb = b;
    if (pa->x < pb->x) return -1;
    if (pa->x > pb->x) return 1;
    return 0;
}

int
main(void)
{
    struct point pts[4] = {
        { 5, 50 },
        { 1, 10 },
        { 3, 30 },
        { 1, 11 },          /* duplicate x with [1] — tests stability */
    };

    qsort(pts, 4, sizeof(struct point), cmp_x);

    for (int i = 0; i < 4; i++) {
        printf("[%d] x=%d y=%d\n", i, pts[i].x, pts[i].y);
    }
    return 0;
}
