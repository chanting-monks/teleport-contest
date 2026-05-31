/* 33-char-param-walker/source.c — char * parameter used as a walker.
 *
 * NetHack's `getlin(prompt, char *bufp)` (windows.c:1098) takes a
 * caller-allocated buffer and writes into it via `*bufp++ = c;`
 * followed by `*bufp = '\0';` for null-termination.  The C semantics
 * advance bufp through the caller's memory; JS strings are immutable
 * and `bufp = bufp + 1` on a JS array reference is a NaN no-op.
 *
 * Without a translator-side recognizer for this pattern, the JS
 * output is `bufp.value = c; bufp = bufp + 1;` — the .value write
 * sets a property nobody reads, and the bufp NaN trick means the
 * subsequent `*bufp = '\0'` is also lost.  Every getlin caller
 * (#wizwish, #wizlevelport, #levelchange) silently sees an empty
 * buffer.
 *
 * Pattern to recognize:
 *   - function parameter declared `char *NAME`
 *   - body uses are in the walker safe-set:
 *     - `*NAME = X` (write through the pointer)
 *     - `*NAME++ = X` (combined write+advance)
 *   - REJECT anything else (reads of *NAME for comparison,
 *     indexed bufp[i] access, pointer arithmetic bufp - other, ...)
 *
 * Emit rewrite (with `__nh_NAME_idx` synthesized at function entry):
 *   - `*NAME = X`        → `NAME[__nh_NAME_idx] = X`
 *   - `*NAME++ = X`      → `NAME[__nh_NAME_idx++] = X`
 *
 * Test: writes a fixed sequence ('h','i','!','\0') into a 16-char
 * buffer via the walker, then prints the result.  Expected: "hi!".
 *
 * NOTE: keep the walker function's parameter signature simple — no
 * input source `char *`, no `*src++ = c` reads.  The string-literal
 * vs char-buffer interop (C: "hello" is bytes, JS: "hello" is an
 * immutable string) is a separate translator concern; this test
 * exercises ONLY the destination-side walker rewrite.
 */

#include <stdio.h>
#include <string.h>

static void
write_three(char *dst)
{
    *dst++ = 'h';
    *dst++ = 'i';
    *dst++ = '!';
    *dst = '\0';
}

int
main(void)
{
    char buf[16];
    memset(buf, 0, sizeof buf);
    write_three(buf);
    printf("%s\n", buf);
    return 0;
}
