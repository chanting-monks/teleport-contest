/* 03-array/source.c — arrays of structs and arrays of ints.
 *
 * Constructs exercised:
 *   - fixed-size array of int with zero-init
 *   - fixed-size array of struct
 *   - array element indexing on lvalue and rvalue
 *   - iterating with `for (int i = 0; i < N; i++)`
 *   - sizeof on a static array (translates to a literal)
 *
 * NOTE: deliberately avoids C's struct-by-value passing; arrays of
 * struct in C decay to pointer-to-struct on indexing, which matches
 * JS array-of-objects naturally.
 */

#include <stdio.h>

#define NPOINTS 4

struct point {
    int x;
    int y;
};

static int sums[NPOINTS];

static struct point points[NPOINTS] = {
    { 1, 2 },
    { 3, 4 },
    { 5, 6 },
    { 7, 8 },
};

static int
sum_xy(struct point *p)
{
    return p->x + p->y;
}

int
main(void)
{
    int i;

    for (i = 0; i < NPOINTS; i++) {
        sums[i] = sum_xy(&points[i]);
    }

    for (i = 0; i < NPOINTS; i++) {
        printf("sum[%d] = %d\n", i, sums[i]);
    }

    /* Touch a member through array-indexed expression */
    points[2].x = 50;
    printf("after edit: points[2] = (%d, %d)\n", points[2].x, points[2].y);

    return 0;
}
