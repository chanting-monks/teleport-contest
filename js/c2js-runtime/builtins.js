// builtins.js — runtime shims for clang/gcc compiler builtins that
// translated NetHack code references.
//
// `__builtin_va_start(va_list, last_named_arg)` and
// `__builtin_va_end(va_list)`: C macros for varargs handling.  In C
// they're no-ops at runtime (the compiler translates them to stack
// frame manipulation).  Translated NetHack uses them for printf-style
// helpers (livelog_printf, vsnprintf wrappers).  In JS we already
// receive args via the function's arguments object / rest params, so
// these are pure no-ops.
//
// `__builtin_offsetof(type, field)` / `__builtin_choose_expr` etc.
// would also live here if encountered.

export function __builtin_va_start(_ap, _last) {}
export function __builtin_va_end(_ap) {}
