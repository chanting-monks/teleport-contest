/* 54-char-array-brace-init/source.c — decl/read consistency for
 * char arrays initialized with brace lists of constants (§23.238).
 *
 * `static const char syms[] = { MAXOCLASSES, ... }` (makemon.c
 * set_mimic_sym) emits as a JS ARRAY literal, but the string-mode
 * subscript-read path used to assume every `char [N]` decl is a JS
 * string and emitted __nh_char_at0(__nh_advance_str(syms, i)) —
 * a TypeError on an array.  Reads of brace-init char arrays must
 * stay `syms[i]`; reads of string-literal char buffers must still
 * go through the char helpers.
 *
 * Expected output:
 *   65 66 67
 *   hi
 *   90
 */
#include <stdio.h>

#define A_VAL 65
#define B_VAL 66

static const char syms[] = { A_VAL, B_VAL, 67, 0 };

static int
pick(int i)
{
    /* function-local static brace-init form (makemon furnsyms) */
    static const char locsyms[] = { 90, 91, 92 };

    return locsyms[i];
}

int
main(void)
{
    int i;

    /* file-static brace-init: reads must be byte values */
    for (i = 0; syms[i]; i++)
        printf("%d ", syms[i]);
    printf("\n");

    /* string-literal char buffer: must still read as a string */
    {
        char buf[8] = "hi";

        printf("%c%c\n", buf[0], buf[1]);
    }

    printf("%d\n", pick(0));
    return 0;
}
