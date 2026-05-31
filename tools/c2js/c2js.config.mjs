// c2js.config.mjs — paths, platform defines, and constants used by every
// other tool under tools/c2js/.
//
// All paths are resolved from this file's location, so the tools work
// regardless of the cwd they're invoked from.

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export const projectRoot = resolve(here, '../..');
export const upstreamDir = join(projectRoot, 'nethack-c/upstream');
export const patchDir = join(projectRoot, 'nethack-c/patches');
export const cacheRoot = join(projectRoot, '.cache/c2js');
export const preparedSourceDir = join(cacheRoot, 'nethack-port');
export const jsDir = join(projectRoot, 'js');
export const runtimeDir = join(jsDir, 'c2js-runtime');
export const testsDir = join(here, 'tests');

// Files the contest overlays at score time.  We never re-emit these from
// the translator; they are imported as external boundaries.
// Cross-checked against frozen/score.sh.
export const FROZEN_FILES = ['isaac64.js', 'terminal.js', 'storage.js'];

// Files the contest's playbook says are contestant-owned but the
// transpiler should NOT regenerate (they exist on the skeleton with
// hand-written contracts the translator must respect).
export const SKELETON_FILES = ['rng.js', 'jsmain.js', 'index.html'];

// Modules under js/c2js-runtime/ are hand-written libc/OS shims the
// translator emits imports of.  Listed here so the conformance pass
// knows they're not C-translated output.
export const RUNTIME_MODULES = [
    'string.js',     // strlen, strcpy, strncpy, strcmp, memcpy, memset, ...
    'stdio.js',      // printf-family routed through display
    'input.js',      // nhgetch, yn_prompt, getlin, getobj, getpos, menu, modal_guard
    'time.js',       // re-exports getnow from js/calendar.js
    'setjmp.js',     // NhLongjmp class + helpers
    'qsort.js',      // deterministic sort matching 002-deterministic-qsort.patch
    'lua.js',        // minimal Lua loader (Phase 9; TBD whether interpreter or hand-translated themerms)
];

// NetHack 5.0's alphabetically-bucketed global structs, per spec §2.
// The translator rewrites references to ga.X / gb.X / ... / gz.X as game.X,
// preserving genuine sub-structs.  NetHack 5.0 also splits saved-game
// state into a parallel `sv*` series (svb..svy), which we flatten the
// same way: `svd.dungeon_topology` → `game.dungeon_topology`.
// Source: nethack-c/upstream/include/decl.h.
export const GLOBAL_BUCKETS = [
    'ga', 'gb', 'gc', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gj', 'gk',
    'gl', 'gm', 'gn', 'go', 'gp', 'gq', 'gr', 'gs', 'gt', 'gu', 'gv',
    'gw', 'gx', 'gy', 'gz',
    'svb', 'svc', 'svd', 'sve', 'svh', 'svi', 'svk', 'svl', 'svm',
    'svn', 'svo', 'svp', 'svq', 'svr', 'svs', 'svt', 'svu', 'svw',
    'svx', 'svy',
];

// JS reserved words that collide with NetHack identifiers, per spec §11.
// The translator appends a trailing underscore.  Listed here so the
// conformance pass can spot inconsistent renames.
export const JS_RESERVED_RENAMES = [
    'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export',
    'extends', 'finally', 'for', 'function', 'if', 'implements',
    'import', 'in', 'instanceof', 'interface', 'let', 'new', 'null',
    'package', 'private', 'protected', 'public', 'return', 'static',
    'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
    'void', 'while', 'with', 'yield',
];

// Banned runtime calls per spec §8.  Conformance pass rejects any
// translator output that contains them.
export const BANNED_CALLS = [
    'Math.random',
    'Date.now',
    'setTimeout',
    'setInterval',
    'setImmediate',
];

// External-symbol registry.  When the translator sees a DeclRefExpr to
// a name that isn't declared in the current translation unit, it looks
// up here.  Each entry maps a C identifier to a JS module under js/
// (relative to projectRoot, with a leading slash that gets resolved
// to a relative path against the output file).
//
// Hand-curated for now.  Phase 4+ will replace this with a generated
// per-TU symbol manifest produced as a side-effect of translating the
// whole tree, so unresolved refs never go silently undefined.
//
// Module paths are relative to projectRoot.  Names not listed here
// remain as bare references in the output and would error at module
// load — the conformance pass surfaces them.
export const EXTERNAL_SYMBOLS = {
    // <stdio.h> — handled via RUNTIME_IMPORT_MAP in translate.mjs;
    // listed here for cross-referencing only.
    // printf, fprintf, puts, putchar — runtime/stdio.js

    // <stdlib.h> + NetHack math conventions
    abs:     'js/c2js-runtime/math.js',
    sgn:     'js/c2js-runtime/math.js',
    min:     'js/c2js-runtime/math.js',
    max:     'js/c2js-runtime/math.js',

    // NetHack hard / soft error reporters.  C ref: src/end.c:panic,
    // src/pline.c:impossible.
    panic:       'js/c2js-runtime/panic.js',
    impossible:  'js/c2js-runtime/panic.js',

    // Memory primitives.  alloc/free are no-ops over GC; memset/
    // memcpy delegate to JS primitives.  NetHack uses these
    // throughout level generation.
    alloc:    'js/c2js-runtime/memory.js',
    free:     'js/c2js-runtime/memory.js',
    memset:   'js/c2js-runtime/memory.js',
    memcpy:   'js/c2js-runtime/memory.js',

    // Memory-backed level-file abstraction.  C ref: files.c
    // create_levelfile/open_levelfile/close_nhfile/delete_levelfile.
    // Backs the NHFILE pointer with an in-memory per-ledger buffer.
    // Foundation for ^V wizlevelport and any other level-transition
    // path; full save/restore also requires save.c/restore.c
    // translation so savelev/getlev (currently auto-stubbed) work.
    create_levelfile: 'js/c2js-runtime/levelfile.js',
    open_levelfile:   'js/c2js-runtime/levelfile.js',
    close_nhfile:     'js/c2js-runtime/levelfile.js',
    delete_levelfile: 'js/c2js-runtime/levelfile.js',

    // libc <string.h> shims.
    strcmp:        'js/c2js-runtime/string.js',
    strncmp:       'js/c2js-runtime/string.js',
    strcasecmp:    'js/c2js-runtime/string.js',
    strncasecmp:   'js/c2js-runtime/string.js',
    strlen:        'js/c2js-runtime/string.js',
    strcpy:        'js/c2js-runtime/string.js',
    strncpy:       'js/c2js-runtime/string.js',
    strcat:        'js/c2js-runtime/string.js',
    strncat:       'js/c2js-runtime/string.js',
    strchr:        'js/c2js-runtime/string.js',
    strrchr:       'js/c2js-runtime/string.js',
    strstr:        'js/c2js-runtime/string.js',
    strdup:        'js/c2js-runtime/string.js',
    strncmpi:      'js/c2js-runtime/string.js',
    strstri:       'js/c2js-runtime/string.js',
    nh_strsearch_idx: 'js/c2js-runtime/string.js',
    nh_strchr_truncate: 'js/c2js-runtime/string.js',
    xcrypt:        'js/c2js-runtime/string.js',

    // Runtime override of src/rumors.c: getrumor / init_rumors /
    // get_rnd_line / get_rnd_text consume in-memory data tables
    // (registered by the harness from dat/rumors.tru, .fal,
    // engrave, epitaph) instead of reading via fopen+fseek+fgets.
    // Feedback (2026-05-08): static NetHack data files belong as
    // structured tables, not virtual-filesystem byte streams.
    getrumor:      'js/c2js-runtime/rumors.js',
    init_rumors:   'js/c2js-runtime/rumors.js',
    get_rnd_line:  'js/c2js-runtime/rumors.js',
    get_rnd_text:  'js/c2js-runtime/rumors.js',

    // Message-print helpers from src/pline.c.  Static tables in some
    // TUs (attrib.c's poiseff[], etc.) reference these as function
    // pointers, so they must be importable; the runtime versions are
    // no-ops since messages don't drive PRNG.
    pline:         'js/c2js-runtime/pline.js',
    pline_The:     'js/c2js-runtime/pline.js',
    pline_dir:     'js/c2js-runtime/pline.js',
    You:           'js/c2js-runtime/pline.js',
    Your:          'js/c2js-runtime/pline.js',
    You_feel:      'js/c2js-runtime/pline.js',
    You_hear:      'js/c2js-runtime/pline.js',
    You_see:       'js/c2js-runtime/pline.js',
    You_cant:      'js/c2js-runtime/pline.js',
    You_ex:        'js/c2js-runtime/pline.js',
    verbalize:     'js/c2js-runtime/pline.js',
    verbalize_dir: 'js/c2js-runtime/pline.js',
    raw_print:     'js/c2js-runtime/pline.js',
    raw_printf:    'js/c2js-runtime/pline.js',

    // Deterministic stable sort matching the contest's
    // 002-deterministic-qsort.patch.
    qsort:    'js/c2js-runtime/qsort.js',

    // The `extern const char regex_id[]` symbol is defined by one of
    // upstream NetHack's regex-impl files (sys/share/posixregex.c,
    // pmatchregex.c, cppregex.cpp).  Those aren't in our translation
    // closure, so version.c's reference would otherwise emit as a
    // bare global.  Map it to a runtime shim providing the
    // posixregex string the frozen Linux build links against.
    regex_id:  'js/c2js-runtime/regex.js',

    // tty windowing system declared in include/wintty.h:
    //   extern struct window_procs tty_procs;
    //   extern void win_tty_init(int);
    // Definitions live in win/tty/wintty.c, which isn't part of the
    // translation closure (the contest replaces tty rendering with
    // its own js/terminal.js).  Map to a runtime shim with empty
    // placeholders so windows.c imports cleanly.
    tty_procs:    'js/c2js-runtime/wintty.js',
    win_tty_init: 'js/c2js-runtime/wintty.js',

    // save/restore + system-shell + mail functions referenced from
    // cmd.c's extcmdlist[] static initializer.  Their definitions
    // live in TUs we don't translate (src/save.c, src/cfgfiles.c,
    // sys/unix/unixmain.c, src/mail.c).  Stubs let cmd.js module-load
    // complete; the PRNG-faithful game path never invokes any.
    dosave:                  'js/c2js-runtime/savestubs.js',
    do_write_config_file:    'js/c2js-runtime/savestubs.js',
    dosh_core:               'js/c2js-runtime/savestubs.js',
    dosuspend_core:          'js/c2js-runtime/savestubs.js',
    dobugreport:             'js/c2js-runtime/savestubs.js',

    // <time.h> shims.  u_init_misc calls `time(game.ubirthday)` —
    // not a PRNG-firing call but the symbol must resolve.
    time:                    'js/c2js-runtime/calendar.js',
    difftime:                'js/c2js-runtime/calendar.js',
    localtime:               'js/c2js-runtime/calendar.js',

    // clang/gcc varargs builtins.  livelog_printf and similar
    // printf-style helpers reference these; they're no-ops in JS
    // (we use the arguments object / rest parameters directly).
    __builtin_va_start:      'js/c2js-runtime/builtins.js',
    __builtin_va_end:        'js/c2js-runtime/builtins.js',

    // libc printf-family beyond what RUNTIME_IMPORT_MAP already
    // covers.  sprintf / snprintf / nh_snprintf return the
    // formatted string (translated NetHack assigns the result back
    // to `buf` and displays via win_putstr).  vsnprintf is no-op.
    vsnprintf:               'js/c2js-runtime/stdio.js',
    snprintf:                'js/c2js-runtime/stdio.js',
    nh_snprintf:             'js/c2js-runtime/stdio.js',
    sprintf:                 'js/c2js-runtime/stdio.js',

    // Frozen ISAAC64 PRNG.  The contest overlays js/isaac64.js at
    // score time; we import the same names the C code references.
    // EXCEPT isaac64_init: the frozen API takes 1 arg and returns a
    // new ctx, but C-translated code expects the 3-arg
    // (ctx, seed, len) signature that mutates in place.  Route it
    // through our runtime bridge.
    isaac64_init:        'js/c2js-runtime/rng.js',
    isaac64_reseed:      'js/isaac64.js',
    isaac64_next_uint64: 'js/isaac64.js',
    isaac64_peek_uint64: 'js/isaac64.js',
    isaac64_next_uint:   'js/isaac64.js',

    // Lua bridge.  Backed by js/c2js-runtime/lua.js, which models a
    // minimal stack and reads from harness-registered parsed
    // dat/*.lua data.  Avoids embedding a full Lua interpreter while
    // still serving NetHack's declarative-content needs.
    nhl_init:           'js/c2js-runtime/lua.js',
    nhl_done:           'js/c2js-runtime/lua.js',
    nhl_loadlua:        'js/c2js-runtime/lua.js',
    nhl_pcall_handle:   'js/c2js-runtime/lua.js',
    lua_gc:             'js/c2js-runtime/lua.js',
    lua_gettop:         'js/c2js-runtime/lua.js',
    lua_settop:         'js/c2js-runtime/lua.js',
    lua_pop:            'js/c2js-runtime/lua.js',
    lua_pushvalue:      'js/c2js-runtime/lua.js',
    lua_pushnil:        'js/c2js-runtime/lua.js',
    lua_pushinteger:    'js/c2js-runtime/lua.js',
    lua_pushnumber:     'js/c2js-runtime/lua.js',
    lua_pushstring:     'js/c2js-runtime/lua.js',
    lua_pushboolean:    'js/c2js-runtime/lua.js',
    lua_insert:         'js/c2js-runtime/lua.js',
    lua_remove:         'js/c2js-runtime/lua.js',
    lua_type:           'js/c2js-runtime/lua.js',
    lua_isnil:          'js/c2js-runtime/lua.js',
    lua_isnoneornil:    'js/c2js-runtime/lua.js',
    lua_isnumber:       'js/c2js-runtime/lua.js',
    lua_isstring:       'js/c2js-runtime/lua.js',
    lua_istable:        'js/c2js-runtime/lua.js',
    lua_isboolean:      'js/c2js-runtime/lua.js',
    lua_isnone:         'js/c2js-runtime/lua.js',
    lua_tointeger:      'js/c2js-runtime/lua.js',
    lua_tointegerx:     'js/c2js-runtime/lua.js',
    lua_tonumber:       'js/c2js-runtime/lua.js',
    lua_tostring:       'js/c2js-runtime/lua.js',
    lua_tolstring:      'js/c2js-runtime/lua.js',
    lua_toboolean:      'js/c2js-runtime/lua.js',
    lua_getfield:       'js/c2js-runtime/lua.js',
    lua_setfield:       'js/c2js-runtime/lua.js',
    lua_gettable:       'js/c2js-runtime/lua.js',
    lua_settable:       'js/c2js-runtime/lua.js',
    lua_geti:           'js/c2js-runtime/lua.js',
    lua_seti:           'js/c2js-runtime/lua.js',
    lua_rawgeti:        'js/c2js-runtime/lua.js',
    lua_rawseti:        'js/c2js-runtime/lua.js',
    lua_len:            'js/c2js-runtime/lua.js',
    lua_next:           'js/c2js-runtime/lua.js',
    lua_getglobal:      'js/c2js-runtime/lua.js',
    lua_setglobal:      'js/c2js-runtime/lua.js',
    lua_pcall:          'js/c2js-runtime/lua.js',
    lua_setmetatable:   'js/c2js-runtime/lua.js',
    lua_getmetatable:   'js/c2js-runtime/lua.js',

    // NetHack's higher-level helpers (originally in src/nhlua.c) live
    // alongside the lua_* primitives in our runtime.
    get_table_int:           'js/c2js-runtime/lua.js',
    get_table_int_opt:       'js/c2js-runtime/lua.js',
    get_table_str:           'js/c2js-runtime/lua.js',
    get_table_str_opt:       'js/c2js-runtime/lua.js',
    get_table_boolean:       'js/c2js-runtime/lua.js',
    get_table_boolean_opt:   'js/c2js-runtime/lua.js',
    get_table_option:        'js/c2js-runtime/lua.js',
    luaL_checkoption:        'js/c2js-runtime/lua.js',
    luaL_setfuncs:           'js/c2js-runtime/lua.js',
    luaL_newlib:             'js/c2js-runtime/lua.js',
    lua_pushcfunction:       'js/c2js-runtime/lua.js',
    lua_pushjsfunction:      'js/c2js-runtime/lua.js',
    lua_newtable:            'js/c2js-runtime/lua.js',
    luaL_checktype:          'js/c2js-runtime/lua.js',
    luaL_argcheck:           'js/c2js-runtime/lua.js',
    luaL_argerror:           'js/c2js-runtime/lua.js',
    lcheck_param_table:      'js/c2js-runtime/lua.js',
    nhl_error:               'js/c2js-runtime/lua.js',
    lua_createtable:         'js/c2js-runtime/lua.js',
    lua_error:               'js/c2js-runtime/lua.js',
};

// The deterministic patches the contest provides.  Mirrors serteal's
// list because they're the same patches; we apply them before
// preprocessing so the translator sees the patched C source.
export const DETERMINISTIC_PATCHES = [
    '001-deterministic-runtime.patch',
    '002-deterministic-qsort.patch',
    '003-rng-log-core.patch',
    '004-rng-log-lua-context.patch',
    '005-rng-display-logging.patch',
    '006-nomux-capture.patch',
];

// Platform defines fed to cpp / clang during preprocessing.  Picks the
// single configuration the contest's recorder used (UNIX + tty graphics,
// no curses, no compression).  We keep nhlua.h's include enabled (no
// CROSSCOMPILE define) and supply a stub nhlua.h via tools/c2js/stubs/
// so source files that mention `lua_State *` parse cleanly.  Real Lua
// runtime lands in Phase 9.
export const PLATFORM_DEFINES = [
    '-DUNIX',
    '-DTTY_GRAPHICS',
    '-DLUA_USE_POSIX',
    '-DPOSIX_TYPES',
    '-DNH_C2JS',
    '-DNH_C2JS_RECORDER_PLATFORM',
    // Force-include stddef.h so ptrdiff_t / size_t / NULL are
    // available wherever NetHack code uses them.  config1.h's
    // stddef.h include is gated by USE_PROTOTYPES (which we don't
    // set since we're using a modern clang); cstd.h's comment
    // says stddef is "common", but the file doesn't actually
    // include it.  coloratt.c uses ptrdiff_t directly at line
    // 740 — without -include stddef.h, parse fails.
    '-include', 'stddef.h',
];

// Path to the c2js stub headers (nhlua.h and friends).  Added to
// every clang -I path when translating upstream sources.
import { dirname as _dirname } from 'node:path';
export const stubsDir = join(_dirname(fileURLToPath(import.meta.url)), 'stubs');
