/* 57-struct-member-copy/source.c — struct assignment into a struct-
 * typed MEMBER must be a COPY, not a reference alias (Q9.5(b)).
 *
 * Mirrors role.c role_init: `gu.urole = roles[flags.initrole];`
 * followed by `gu.urole.lgod = ...`.  With the old emit (MemberExpr
 * excluded from isStructValueLvalue) the assignment aliased, so the
 * field write mutated the shared roles[] table — leaking into the
 * next session of a one-process run.
 *
 * Expected output:
 *   urole.god=Crom table.god=(null)
 *   second.god=(null)
 */
#include <stdio.h>

struct Role {
    const char *name;
    const char *god;
};

static struct Role roles[2] = {
    { "Priest", 0 },
    { "Barbarian", "Crom" },
};

struct You {
    int x;
    struct Role urole;
};

static struct You gu;

int
main(void)
{
    /* struct copy into a struct-typed member (the role_init shape) */
    gu.urole = roles[0];
    /* field write must hit the COPY, never the table */
    gu.urole.god = "Crom";
    printf("urole.god=%s table.god=%s\n",
           gu.urole.god ? gu.urole.god : "(null)",
           roles[0].god ? roles[0].god : "(null)");

    /* a fresh copy (next session's role_init) sees the clean table */
    gu.urole = roles[0];
    printf("second.god=%s\n", gu.urole.god ? gu.urole.god : "(null)");
    return 0;
}
