/* 08-enum/source.c — enum declarations and their use in switch.
 *
 * Constructs exercised:
 *   - enum with sequential auto-numbering (NORTH = 0, then SOUTH = 1, ...)
 *   - enum with explicit start (RED = 1)
 *   - enum constant referenced in case labels
 *   - enum constant in printf arg
 *   - enum used as ordinary int value
 */

#include <stdio.h>

enum direction {
    NORTH = 0,
    SOUTH,
    EAST,
    WEST,
};

enum color {
    RED = 1,
    GREEN,
    BLUE,
};

static const char *
direction_name(int d)
{
    switch (d) {
    case NORTH: return "north";
    case SOUTH: return "south";
    case EAST:  return "east";
    case WEST:  return "west";
    default:    return "?";
    }
}

int
main(void)
{
    printf("NORTH=%d SOUTH=%d EAST=%d WEST=%d\n",
           NORTH, SOUTH, EAST, WEST);
    printf("RED=%d GREEN=%d BLUE=%d\n", RED, GREEN, BLUE);
    printf("name(SOUTH) = %s\n", direction_name(SOUTH));
    return 0;
}
