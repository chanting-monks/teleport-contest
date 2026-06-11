/* 59-nested-anon-struct/source.c — NESTED anonymous member structs
 * (hack.h lev_region's inarea/delarea) must zero-init with their
 * own shapes (Q9 iteration 19).
 *
 * The adjacency-stash version of the anon-typedef fix mis-paired
 * here: the nested records overwrote the stash, so lev_region's
 * registered shape was garbage and decl.js emitted
 * `bughack: { x1: [80, 21, 0, 0], ... }` — wall_cleanup then read
 * `.inarea.x1` of undefined and mklev aborted mid-finalize (35
 * sessions diverging at mineralize).  Pairing is per-id; nested
 * member fields get synthetic registry keys.
 *
 * Expected output:
 *   in=3,4 del=5,6 rtype=2
 */
#include <stdio.h>

typedef struct {
    struct {
        short x1, y1, x2, y2;
    } inarea;
    struct {
        short x1, y1, x2, y2;
    } delarea;
    short rtype;
} lev_region;

static lev_region bug;

int
main(void)
{
    bug.inarea.x1 = 3;
    bug.inarea.y1 = 4;
    bug.delarea.x1 = 5;
    bug.delarea.y1 = 6;
    bug.rtype = 2;
    printf("in=%d,%d del=%d,%d rtype=%d\n",
           bug.inarea.x1, bug.inarea.y1,
           bug.delarea.x1, bug.delarea.y1, bug.rtype);
    return 0;
}
