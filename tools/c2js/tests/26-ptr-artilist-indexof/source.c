/* 26-ptr-artilist-indexof/source.c — `ptr - artilist` ptrdiff via indexOf.
 *
 * C idiom from NetHack artifact.c artifact_exists, mk_artifact:
 *
 *   let m = (int)(a - artilist);
 *
 * where `artilist` is the artifact table.  The translator's
 * binaryOp recognizer has a PTRDIFF_TABLES allowlist with two
 * entries:
 *
 *   `mons`     → `(ptr).pmidx`  (uses self-index field)
 *   `artilist` → `artilist.indexOf(ptr)`  (no self-index field, O(n) scan)
 *
 * This test exercises the artilist→indexOf path.  Companion to
 * test 25-ptr-mons-ptrdiff which exercises the pmidx fast path.
 *
 * Unlike mons[], artilist entries have no `pmidx` field, so the
 * recognizer falls back to `indexOf` for object-identity lookup.
 * Reliable because static struct arrays don't get aliased outside
 * the table.
 */

#include <stdio.h>

struct artifact {
    int otyp;
    const char *name;
};

static struct artifact artilist[] = {
    { 0, "(none)" },        /* sentinel at index 0 */
    { 11, "Excalibur" },
    { 22, "Magicbane" },
    { 33, "Stormbringer" },
};

static int
get_arti_index(struct artifact *a)
{
    return (int) (a - artilist);
}

int
main(void)
{
    printf("idx of Excalibur: %d\n", get_arti_index(&artilist[1]));
    printf("idx of Magicbane: %d\n", get_arti_index(&artilist[2]));
    printf("idx of Stormbringer: %d\n", get_arti_index(&artilist[3]));
    return 0;
}
