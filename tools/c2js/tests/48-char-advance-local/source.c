/* 48-char-advance-local/source.c — `++p` / `p += N` on a local
 * `const char *` whose runtime binding is a JS string at runtime.
 *
 * Mirrors the C `pray.c::align_gname` underscore strip pattern:
 *
 *   const char *gnam = "...";
 *   if (*gnam == '_')
 *       ++gnam;              // <-- THIS line
 *   return gnam;
 *
 * Tests Phase A2 of the translator-capability plan: pointer-advance
 * recognizers for `++p` / `--p` / `p++` / `p--` / `p += N` / `p -= N`
 * on local char-typed pointers route through `__nh_advance_str` so
 * the rebind respects JS-string / char-array suffix semantics.
 *
 * Phase A1 handles the deref read (`*p`); Phase A2 handles the
 * advance.  Together they're sufficient for the align_gname pattern
 * — the hand-port in pray.js can retire once both land + the file
 * is regenerated (gated on Phase B hand-port-preservation work).
 *
 * Expected output:
 *   Amaterasu Omikami      (strip_underscore: ++gnam past '_')
 *   Brigit                 (no strip, no '_')
 *   materasu Omikami       (drop_first: ++gnam unconditional)
 *   terasu Omikami         (drop_n: gnam += 3)
 */
#include <stdio.h>

static const char *
strip_underscore(const char *gnam)
{
    if (*gnam == '_')
        ++gnam;
    return gnam;
}

static const char *
drop_first(const char *p)
{
    p++;
    return p;
}

static const char *
drop_n(const char *p, int n)
{
    p += n;
    return p;
}

int
main(void)
{
    printf("%s\n", strip_underscore("_Amaterasu Omikami"));
    printf("%s\n", strip_underscore("Brigit"));
    printf("%s\n", drop_first("Amaterasu Omikami"));
    printf("%s\n", drop_n("Amaterasu Omikami", 3));
    return 0;
}
