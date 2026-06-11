/* 58-typedef-anon-struct/source.c — typedef of an ANONYMOUS struct
 * must zero-init as a struct object (Q9 iterations 18-19).
 *
 * sp_lev.h: `typedef struct { xint16 ter, tlit; } terrain;` — newer
 * clang names the record after its typedef ("struct terrain") while
 * the RecordDecl is nameless, so the registry missed it and
 * `terrain terr;` emitted `let terr = 0;` whose `terr.ter = X`
 * threw a strict-mode TypeError swallowed by the Lua pcall —
 * aborting themed-room contents mid-map-load (Lua-percent x7).
 * Pairing is via the ElaboratedType's ownedTagDecl id.
 *
 * Expected output:
 *   ter=7 tlit=1
 */
#include <stdio.h>

typedef struct {
    short ter, tlit;
} terrain;

int
main(void)
{
    terrain terr;

    terr.ter = 7;
    terr.tlit = 1;
    printf("ter=%d tlit=%d\n", terr.ter, terr.tlit);
    return 0;
}
