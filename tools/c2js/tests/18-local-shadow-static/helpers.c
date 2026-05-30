/* 18-local-shadow-static/helpers.c — declare a file-static `step`
 * in this TU.  The translator will hoist it onto `game.step` per
 * spec §2's GLOBAL_BUCKETS rule (file-statics flatten to game).
 *
 * Used by main.c's lookup() to verify the cross-TU symbol resolves.
 * Independently, main.c declares a function-local `int step` —
 * which previously got falsely promoted to `game.step` via the
 * crossTuGameHoisted set, clobbering the global on every assignment
 * and reading stale state from the global on every read.
 *
 * After §23.39, declRefExpr consults ctx.functionLocals first and
 * emits the bare identifier when there's a local shadow.
 */

#include <stdio.h>

static int step = 10;

int
get_helper_step(void)
{
    return step;
}

void
bump_helper_step(void)
{
    step++;
}
