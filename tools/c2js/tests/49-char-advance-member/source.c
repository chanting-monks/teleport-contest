/* 49-char-advance-member/source.c — `++d.bp` / `d.bp += N` on a
 * struct member whose type is `char *` and whose runtime binding
 * is a JS string.
 *
 * Mirrors the C `objnam.c` wish-parsing pattern: the wish struct `d`
 * carries `d.bp` / `d.p` / `d.dn` as `char *` members; pointer-
 * advance on these members is broken by the same "JS string += N
 * is concat" bug as the local-pointer case.
 *
 * Tests Phase A2's MemberExpr extension: __nh_advance_str applied
 * to MemberExpr LHS like `d.bp += N`.  Phase A1's deref read is a
 * separate piece (would need MemberExpr deref recognizer); this
 * test ONLY exercises the advance, with no deref read involved.
 *
 * Expected output:
 *   member_drop_first: materasu Omikami
 *   member_drop_n: terasu Omikami
 *   member_advance_postfix: materasu Omikami
 */
#include <stdio.h>

struct wishparse {
    const char *bp;
};

static const char *
member_drop_first(struct wishparse *d)
{
    ++d->bp;
    return d->bp;
}

static const char *
member_drop_n(struct wishparse *d, int n)
{
    d->bp += n;
    return d->bp;
}

static const char *
member_advance_postfix(struct wishparse *d)
{
    d->bp++;
    return d->bp;
}

int
main(void)
{
    struct wishparse d1 = { "Amaterasu Omikami" };
    struct wishparse d2 = { "Amaterasu Omikami" };
    struct wishparse d3 = { "Amaterasu Omikami" };
    printf("member_drop_first: %s\n", member_drop_first(&d1));
    printf("member_drop_n: %s\n", member_drop_n(&d2, 3));
    printf("member_advance_postfix: %s\n", member_advance_postfix(&d3));
    return 0;
}
