/* 05-switch/source.c — switch statements with fall-through, default,
 * nested switch, and char-as-int discrimination.
 *
 * Constructs exercised:
 *   - switch on int with explicit cases and default
 *   - case fall-through (no break)
 *   - break inside switch
 *   - char literal cases ('a', 'b')
 *   - nested switch
 */

#include <stdio.h>

static const char *
direction_name(int dx, int dy)
{
    switch (dx) {
    case -1:
        switch (dy) {
        case -1: return "northwest";
        case  0: return "west";
        case  1: return "southwest";
        }
        break;
    case 0:
        switch (dy) {
        case -1: return "north";
        case  0: return "here";
        case  1: return "south";
        }
        break;
    case 1:
        switch (dy) {
        case -1: return "northeast";
        case  0: return "east";
        case  1: return "southeast";
        }
        break;
    default:
        return "?";
    }
    return "?";
}

static int
classify(char c)
{
    /* fall-through in cases — vowels both lowercase and uppercase */
    switch (c) {
    case 'a':
    case 'e':
    case 'i':
    case 'o':
    case 'u':
    case 'A':
    case 'E':
    case 'I':
    case 'O':
    case 'U':
        return 1; /* vowel */
    default:
        return 0; /* consonant or other */
    }
}

int
main(void)
{
    int dx, dy;
    for (dx = -1; dx <= 1; dx++) {
        for (dy = -1; dy <= 1; dy++) {
            printf("(%d,%d) -> %s\n", dx, dy, direction_name(dx, dy));
        }
    }
    printf("classify('a') = %d\n", classify('a'));
    printf("classify('z') = %d\n", classify('z'));
    printf("classify('E') = %d\n", classify('E'));
    return 0;
}
