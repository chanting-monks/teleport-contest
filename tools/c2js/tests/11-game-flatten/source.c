/* 11-game-flatten/source.c — exercises spec §2's ga/gb/gc flattening.
 *
 * NetHack 5.0 partitions globals across `ga` through `gz` structs.
 * Spec §2 says the JS port collapses ALL bucket prefixes into one
 * `game` root: `ga.X` → `game.X`, regardless of which letter bucket
 * X lived in.  Genuine substructs (`gc.context.run`) keep their
 * nesting (`game.context.run`).
 *
 * This synthetic test mirrors the shape of decl.c's bucket structs
 * and a few uses elsewhere.
 */

#include <stdio.h>

struct instance_globals_a {
    int activemonst;
    int allow_sokoban;
};

struct context_t {
    int run;
    int move;
};

struct instance_globals_c {
    struct context_t context;
    int forcefight;
};

/* In real NetHack these are defined in decl.c; for this synthetic
 * test we define them in the same TU so the translator sees them. */
struct instance_globals_a ga = { 0, 1 };
struct instance_globals_c gc = { { 0, 0 }, 0 };

static void
do_stuff(void)
{
    ga.activemonst = 42;
    gc.context.run = 7;
    gc.context.move = 1;
    gc.forcefight = 1;
    if (ga.allow_sokoban) {
        printf("sokoban=%d activemonst=%d\n", ga.allow_sokoban, ga.activemonst);
    }
    printf("run=%d move=%d forcefight=%d\n",
           gc.context.run, gc.context.move, gc.forcefight);
}

int
main(void)
{
    do_stuff();
    return 0;
}
