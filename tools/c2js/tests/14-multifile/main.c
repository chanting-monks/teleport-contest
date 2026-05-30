/* 14-multifile/main.c — entry point of the two-TU test. */

#include <stdio.h>

extern int add(int, int);
extern int square(int);
extern void greet(void);
extern const int LIMITS[];
extern int call_count;

int
main(void)
{
    greet();
    printf("add(3, 4) = %d\n", add(3, 4));
    printf("square(7) = %d\n", square(7));
    printf("LIMITS = %d, %d, %d\n", LIMITS[0], LIMITS[1], LIMITS[2]);
    printf("call_count = %d\n", call_count);
    call_count++;
    printf("call_count after main increment = %d\n", call_count);
    return 0;
}
