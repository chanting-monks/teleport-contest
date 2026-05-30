/* 06-rect-shape/source.c — typedef + static array + pointer return.
 * Mirrors rect.c's call/data shape without depending on hack.h.
 *
 * Constructs exercised:
 *   - typedef of struct (NhRect) — struct registered under typedef name
 *   - typedef int boolean — passes through transparently
 *   - #define-expanded constants in array sizes and field values
 *   - NULL pointer return + null-check
 *   - Mutating struct field through array index + member access
 *   - Multiple functions sharing static state
 */

#include <stdio.h>
#include <stdlib.h>     /* NULL */

typedef int boolean;
#define TRUE 1
#define FALSE 0

#define COLNO 80
#define ROWNO 21

typedef struct nhrect {
    int lx, ly, hx, hy;
} NhRect;

#define MAX_RECTS 8

static NhRect rect[MAX_RECTS];
static int rect_cnt = 0;

static void
init_rect(void)
{
    rect_cnt = 1;
    rect[0].lx = 0;
    rect[0].ly = 0;
    rect[0].hx = COLNO - 1;
    rect[0].hy = ROWNO - 1;
}

static NhRect *
get_rect_ind(int i)
{
    if (i < 0 || i >= rect_cnt) return NULL;
    return &rect[i];
}

static boolean
within(NhRect *r, int x, int y)
{
    return x >= r->lx && x <= r->hx && y >= r->ly && y <= r->hy;
}

int
main(void)
{
    init_rect();

    NhRect *r = get_rect_ind(0);
    if (r) {
        printf("rect[0]: (%d,%d)-(%d,%d)\n", r->lx, r->ly, r->hx, r->hy);
    }

    NhRect *missing = get_rect_ind(7);
    printf("rect[7]: %s\n", missing ? "found" : "(null)");

    if (within(r, 10, 5)) printf("(10,5) inside\n");
    if (!within(r, 100, 5)) printf("(100,5) outside\n");

    return 0;
}
