/* 22-empty-init-for/source.c — for-loop with empty init slot.
 *
 * C idiom common in NetHack skill-init / class-skill walks:
 *
 *   void f(struct rec *p) {
 *       for (; p->key; p++) body
 *   }
 *
 * Where the pointer `p` is set elsewhere (typically a function
 * parameter receiving a WHOLE array — e.g. `skill_init(Sam_skill)`
 * in weapon.c) and the for-loop's init slot is empty.
 *
 * The translator's empty-init for-loop recognizer captures p's
 * current value into a temp and emits indexed iteration:
 *
 *   const __nhi_p_arr = p;
 *   for (let __nhi_p = 0; (p = __nhi_p_arr[__nhi_p]) && (p->key);
 *        __nhi_p++) body
 *
 * Clang emits the empty init slot as a node without a `.kind`
 * field (distinct from `NullStmt` which is an explicit `;`); the
 * recognizer accepts both representations.
 *
 * IMPORTANT: This recognizer works because the caller passes the
 * WHOLE array reference, and JS's identity-based array semantics
 * lets `arr[0]` access the first element.  Callers passing
 * mid-array pointers (`&arr[k]`) are NOT supported — C pointer
 * arithmetic into the middle of an array has no clean JS
 * equivalent.  All current NetHack call sites pass whole arrays.
 */

#include <stdio.h>

struct entry {
    int key;
    int value;
};

static struct entry skills_A[] = {
    { 1, 10 },
    { 2, 20 },
    { 3, 30 },
    { 0, 0 },   /* sentinel */
};

static struct entry skills_B[] = {
    { 7, 700 },
    { 8, 800 },
    { 0, 0 },   /* sentinel */
};

static int
sum_skills(struct entry *p)
{
    int total = 0;
    for (; p->key; p++) {
        total += p->value;
    }
    return total;
}

int
main(void)
{
    printf("A: %d\n", sum_skills(skills_A));
    printf("B: %d\n", sum_skills(skills_B));
    return 0;
}
