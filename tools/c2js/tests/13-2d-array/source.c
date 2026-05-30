/* 13-2d-array/source.c — two-dimensional struct arrays.
 *
 * NetHack's level grid is `struct rm levl[COLNO][ROWNO]` accessed as
 * `levl[x][y].typ`.  This test exercises:
 *   - 2D struct array declaration with a static initializer
 *   - 2D index expression `arr[i][j]`
 *   - struct field access through 2D index: `arr[i][j].field = ...`
 *   - iteration with nested for-loops
 */

#include <stdio.h>

#define WIDTH 3
#define HEIGHT 2

struct cell {
    int kind;
    int value;
};

static struct cell grid[WIDTH][HEIGHT];

int
main(void)
{
    int x, y;

    /* Fill the grid */
    for (x = 0; x < WIDTH; x++) {
        for (y = 0; y < HEIGHT; y++) {
            grid[x][y].kind = x;
            grid[x][y].value = (x + 1) * (y + 1);
        }
    }

    /* Print it back */
    for (x = 0; x < WIDTH; x++) {
        for (y = 0; y < HEIGHT; y++) {
            printf("(%d,%d) kind=%d value=%d\n",
                   x, y, grid[x][y].kind, grid[x][y].value);
        }
    }
    return 0;
}
