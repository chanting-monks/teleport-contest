/* 16-param-shadow-static/helpers.c — file-static name shouldn't
 * leak across TUs and shadow function parameters in OTHER files.
 *
 * `static const char magical[]` lives only in this TU.  It is NOT
 * exported.  But the build-tree symbolTable historically added every
 * top-level VarDecl, so a function parameter of the same name in
 * main.c got falsely promoted to `import { magical } from './helpers.js'`
 * — a load-time crash because helpers.js correctly omits the export.
 *
 * The translator's declRefExpr now bails early when referencedDecl.kind
 * === 'ParmVarDecl', resolving the parameter binding directly.
 */

#include <stdio.h>

static const char magical[] = { 'A', 'B', 'C', '\0' };

int
sum_classes(void)
{
    return magical[0] + magical[1] + magical[2];
}
