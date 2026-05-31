/* 46-ptr-minus-zero/source.c — pointer ± 0 no-op simplification.
 *
 * Tests the §23.222b peephole that drops `ptr - 0` / `ptr + 0` when
 * the LHS is pointer-typed and the RHS is integer literal 0.
 *
 * C macros like Concat (NetHack objnam.c:75) expand to forms like
 * `Strncat(base ## _eos - delta, text, base ## spaceleft + delta)`
 * and the common Concat(buf, 0, text) instantiates delta=0.  In C
 * the subtraction is a no-op pointer offset; in JS `array - 0`
 * coerces the array to a string then to NaN, breaking strncat.
 *
 * After the peephole: `buf_eos - 0` emits as `buf_eos`.
 *
 * Pattern: assign a char[] to a char-pointer alias, then call strlen
 * on the alias minus zero.  Without the peephole, JS evaluates
 * `array - 0` → NaN → `strlen(NaN)` → 0.  With the peephole the
 * `- 0` is dropped, strlen returns 3.
 *
 * Expected output: 3
 */
#include <stdio.h>
#include <string.h>

static unsigned long
ptr_minus_zero_strlen(void)
{
    char buf[8];
    char *p;
    buf[0] = 'a';
    buf[1] = 'b';
    buf[2] = 'c';
    buf[3] = '\0';
    p = buf;
    return strlen(p - 0);
}

int
main(void)
{
    printf("%lu\n", ptr_minus_zero_strlen());
    return 0;
}
