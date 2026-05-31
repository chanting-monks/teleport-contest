/* 35-typedef-scalar-ptr/source.c — scalar-ptr outparam via a
 * typedef'd integer name.
 *
 * NetHack has `typedef long cmdcount_nht;` (hack.h:199) and uses
 * `cmdcount_nht *count` as a scalar-ptr outparam in cmd.c::get_count.
 * The translator's isScalarPtrType only accepts a curated list of
 * type names (int, long, coordxy, etc.) — typedef'd integer aliases
 * that aren't in the list fall through, the function body emits a
 * generic pointer-mutation TODO marker, and the caller-side `&local`
 * isn't box-wrapped.
 *
 * Pre-architectural-fix: only the literal typedef name in the
 * accept list works.  cmdcount_nht had to be added explicitly
 * (commit 50340f1) for the single site that uses it.
 *
 * Architectural fix: resolve typedef aliases through a cross-TU
 * typedef-alias map collected during build phase.  This test
 * exercises the resolution: declares `typedef long my_count_t;`
 * NOT in the curated list, writes through it as an outparam,
 * expects the caller's variable to see the update.
 */

#include <stdio.h>

typedef long my_count_t;

static void
increment_via_ptr(my_count_t *p, my_count_t delta)
{
    *p = *p + delta;
}

int
main(void)
{
    my_count_t total = 100;
    increment_via_ptr(&total, 23);
    printf("%ld\n", total);
    return 0;
}
