/* 02-struct/source.c — struct definitions, field access, pointer-style
 * mutation.  Phase 1 continuation: the translator gains struct-record
 * detection (build a struct→fields map at translate time), MemberExpr
 * (-> and .) emission, and address-of/dereference pass-through.
 *
 * Constructs exercised:
 *   - struct definition with int fields
 *   - local struct variable (zero-init)
 *   - field access via . and ->
 *   - functions taking struct* parameter
 *   - mutation through pointer (matches JS object-by-reference)
 */

#include <stdio.h>

struct point {
    int x;
    int y;
};

/* Read-only access via pointer */
static int
distance_squared(struct point *p)
{
    return p->x * p->x + p->y * p->y;
}

/* Write via pointer; JS object aliasing matches C pointer semantics */
static void
move_by(struct point *p, int dx, int dy)
{
    p->x = p->x + dx;
    p->y = p->y + dy;
}

int
main(void)
{
    struct point a;
    a.x = 3;
    a.y = 4;
    printf("a: (%d, %d)\n", a.x, a.y);
    printf("distance squared: %d\n", distance_squared(&a));

    move_by(&a, 10, 20);
    printf("after move: (%d, %d)\n", a.x, a.y);

    return 0;
}
