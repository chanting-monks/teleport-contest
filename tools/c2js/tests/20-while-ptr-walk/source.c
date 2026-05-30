/* 20-while-ptr-walk/source.c — while-loop pointer sentinel walk.
 *
 * C idiom common in NetHack name-table iteration (objnam.js
 * spellings, Japanese_items, u_init.js skills, etc.):
 *
 *   const struct rec *p = arr;
 *   while (p->key) {
 *       body...
 *       p++;
 *   }
 *
 * The translator's CompoundStmt-level `detectWhilePtrWalk`
 * recognizer pairs the prior `p = arr` assignment with the
 * WhileStmt-ending-with-p++ and rewrites as:
 *
 *   let p = arr;
 *   const __nhi_p_arr = p;
 *   for (let __nhi_p = 0; (p = __nhi_p_arr[__nhi_p]) && (p.key); __nhi_p++) {
 *       body without trailing p++
 *   }
 *
 * Without the recognizer, the body's last `p++` translates to
 * `(p = __nh_blackhole)` so the loop exits after one iteration.
 *
 * Constructs exercised:
 *   - DeclStmt(p = arr) followed by WhileStmt
 *   - sentinel cond (p->key checks for zero-terminated array)
 *   - p++ at end of while-loop body
 */

#include <stdio.h>

struct entry {
    int key;
    int value;
};

static struct entry table[] = {
    { 1, 100 },
    { 2, 200 },
    { 3, 300 },
    { 0, 0 },   /* sentinel */
};

static int
find(int key)
{
    const struct entry *p = table;
    while (p->key) {
        if (p->key == key) return p->value;
        p++;
    }
    return -1;
}

int
main(void)
{
    printf("1 -> %d\n", find(1));
    printf("3 -> %d\n", find(3));
    printf("9 -> %d\n", find(9));
    return 0;
}
