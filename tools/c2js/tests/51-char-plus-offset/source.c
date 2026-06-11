/* 51-char-plus-offset/source.c — expression-form `p + N` on a
 * `(const)? char *` whose runtime binding is a JS string.
 *
 * Mirrors C objnam.c patterns like:
 *   strncmp(p + 5, "foo", 3)                  (local pointer)
 *   strncmpi((d->bp + i - 5), " glob", 5)     (member pointer)
 *   const char *dbp = d->bp + 9;              (assignment)
 *
 * In C, `p + N` is pointer arithmetic — advances by N bytes.  In
 * JS string-land, `"foo" + 5` is concat → "foo5", breaking every
 * downstream string comparison.  Phase A3 routes the expression
 * through __nh_advance_str so the result is the proper suffix.
 *
 * Tests Phase A3: binaryOp `+` recognizer for `T + INTEGER` where
 * T is a char-typed DeclRefExpr or MemberExpr.  Applied at the
 * binaryOp emit level (not statement level), so it composes with
 * surrounding expressions (function-call arg, assignment RHS).
 *
 * Expected output:
 *   1 (cmp(p+0, "ABC", 3)=match)
 *   0 (cmp(p+3, "DEF", 3)=match→0)
 *   1 (cmp(p+3, "DEX", 3)=no-match)
 *   matches
 */
#include <stdio.h>
#include <string.h>

struct holder {
    const char *bp;
};

static int
compare_at_offset(const char *p, int offset, const char *needle, int n)
{
    return strncmp(p + offset, needle, n);
}

static const char *
member_drop_first_n(struct holder *h, int n)
{
    return h->bp + n;
}

int
main(void)
{
    printf("%d\n", compare_at_offset("ABCDEF", 0, "ABC", 3) == 0);
    printf("%d\n", compare_at_offset("ABCDEF", 3, "DEF", 3));
    printf("%d\n", compare_at_offset("ABCDEF", 3, "DEX", 3) != 0);
    struct holder h = { "needle haystack" };
    printf("%s\n", strncmp(member_drop_first_n(&h, 7), "haystack", 8) == 0 ? "matches" : "no");
    return 0;
}
