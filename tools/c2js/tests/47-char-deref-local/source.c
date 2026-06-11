/* 47-char-deref-local/source.c — `*p OP literal-char` on a local
 * `const char *` whose binding is a JS string at runtime.
 *
 * Mirrors the C `pray.c::align_gname` deref check (commit e358388
 * hand-patched two specific sites): translator emitted the broken
 * `gnam == 95` form, comparing the whole string to the ASCII code
 * of '_' (always false), so the leading-underscore detect never
 * fired.
 *
 * Tests Phase A1 of the translator-capability plan: a
 * `*p`-on-char-ptr-local recognizer emits `__nh_char_at0(p)` so the
 * runtime helper handles all three shapes the pointer may carry
 * (JS string, char-array, scalar-ptr wrapper).  Phase A1 covers
 * READ patterns only (deref + compare).  Pointer-arithmetic
 * advances like `++p` / `p += N` are a separate gap (Phase A2),
 * not exercised here so the test stays focused.
 *
 * Pattern: a function takes a const char* and returns 1 if the
 * first character is '_', 0 otherwise.  Exercises the
 * `*p == 'X'` and `*p != 'X'` forms.
 *
 * Expected output:
 *   1
 *   0
 *   1
 */
#include <stdio.h>

static int
starts_with_underscore(const char *gnam)
{
    if (*gnam == '_')
        return 1;
    return 0;
}

int
main(void)
{
    printf("%d\n", starts_with_underscore("_Amaterasu Omikami"));
    printf("%d\n", starts_with_underscore("Brigit"));
    printf("%d\n", starts_with_underscore("_"));
    return 0;
}
