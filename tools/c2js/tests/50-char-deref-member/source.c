/* 50-char-deref-member/source.c — `*d->bp` on a struct member
 * whose type is `char *` and whose runtime binding is a JS string.
 *
 * Mirrors the C `objnam.c` wish-parsing read pattern: the wish
 * struct `d` carries parse pointers like `d.bp` / `d.p` as
 * `const char *` members; deref read (`*d->bp == 'X'`) is broken
 * by the same "JS string deref no-op" bug as the local-pointer
 * case Phase A1 already handles.
 *
 * Tests Phase A1's MemberExpr extension: __nh_char_at0 applied to
 * MemberExpr inner expressions like `*d->bp`.  Paired with the
 * Phase A2-MemberExpr extension (test 49), this is the complete
 * "deref + advance on a struct char* member" pattern needed for
 * objnam.js wish-parsing.
 *
 * Expected output:
 *   1
 *   0
 *   1
 */
#include <stdio.h>

struct wishparse {
    const char *bp;
};

static int
member_starts_with_underscore(struct wishparse *d)
{
    if (*d->bp == '_')
        return 1;
    return 0;
}

int
main(void)
{
    struct wishparse d1 = { "_Amaterasu Omikami" };
    struct wishparse d2 = { "Brigit" };
    struct wishparse d3 = { "_" };
    printf("%d\n", member_starts_with_underscore(&d1));
    printf("%d\n", member_starts_with_underscore(&d2));
    printf("%d\n", member_starts_with_underscore(&d3));
    return 0;
}
