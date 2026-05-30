/* 04-static-table/source.c — `static const` table of struct
 * initializers.  This is the shape NetHack's monst[]/objects[]/roles[]
 * tables take, and the canonical input for spec §1's Tier A path.
 *
 * Constructs exercised:
 *   - typedef-style use of `enum` constants for table indices
 *   - `static const struct foo bar[] = { {...}, {...}, ... };`
 *   - C array decay → JS array of objects (still mutable in JS, but
 *     emitted as `const` so the binding is immutable; field mutation
 *     through it is technically possible in JS but a code-review smell)
 *   - read-only iteration with field access
 */

#include <stdio.h>

struct enemy {
    int kind;
    int hp;
    int dmg;
};

/* Const table — Tier A material when the translator graduates this
 * file to a real NetHack TU. */
static const struct enemy enemies[] = {
    { 1,  5, 1 },
    { 2, 10, 2 },
    { 3, 20, 4 },
};

int
main(void)
{
    for (int i = 0; i < 3; i++) {
        printf("enemy[%d]: kind=%d hp=%d dmg=%d\n",
               i, enemies[i].kind, enemies[i].hp, enemies[i].dmg);
    }
    return 0;
}
