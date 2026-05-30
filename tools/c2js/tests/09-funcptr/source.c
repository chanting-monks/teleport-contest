/* 09-funcptr/source.c — function pointer types and dispatch.
 * Mirrors NetHack's `windowprocs` struct-of-callbacks pattern.
 *
 * Constructs exercised:
 *   - typedef of function pointer: `typedef int (*int_op)(int, int);`
 *   - assignment to function pointer variable
 *   - call through function pointer variable
 *   - struct with a function-pointer field
 *   - static const table whose entries reference functions by name
 *   - call through struct-field-of-function-pointer
 */

#include <stdio.h>

typedef int (*int_op)(int, int);

static int
op_add(int a, int b)
{
    return a + b;
}

static int
op_sub(int a, int b)
{
    return a - b;
}

struct dispatcher {
    int kind;
    int_op op;
};

static const struct dispatcher dispatchers[] = {
    { 1, op_add },
    { 2, op_sub },
};

int
main(void)
{
    int_op fn = op_add;
    printf("call via var: add(3,4) = %d\n", fn(3, 4));

    fn = op_sub;
    printf("call via var: sub(3,4) = %d\n", fn(3, 4));

    printf("dispatch[0]: kind=%d call(5,6)=%d\n",
           dispatchers[0].kind, dispatchers[0].op(5, 6));
    printf("dispatch[1]: kind=%d call(5,6)=%d\n",
           dispatchers[1].kind, dispatchers[1].op(5, 6));

    return 0;
}
