/* 40-param-walker-advance/source.c — `char *p = src_param; p += N`
 *
 * Tests the hasPointerIncrement extension (commit follow-up to test 39).
 *
 * Before the extension: `char *p = src_param` triggered the scalar-ptr
 * outparam early-return because hasPointerIncrement only matched ++/--.
 * `p += 1` was not seen as "walker behavior", so the alias was rejected.
 *
 * After: hasPointerIncrement also accepts `p += N` / `p -= N` compound
 * advances, so the alias is claimed from the value-box system and
 * registered as a charBufferRewrites candidate.
 *
 * Expected emit:
 *   let __nh_p_idx = 0;
 *   __nh_p_idx += 1;
 *   return strlen(src.slice(__nh_p_idx));
 */

#include <stdio.h>
#include <string.h>

static unsigned long
walk_param_then_measure(char *src)
{
    char *p = src;
    p += 1;
    return strlen(p);
}

int
main(void)
{
    char src[4];
    src[0] = 'a'; src[1] = 'b'; src[2] = 'c'; src[3] = '\0';
    printf("%lu\n", walk_param_then_measure(src));
    return 0;
}
