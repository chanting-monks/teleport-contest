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

// Hand-port stub-anchor table.  For functions where the C source uses
// libc-style idioms that don't translate cleanly to JS (in-place
// mutation, char-walker loops, pointer-position arithmetic), the
// translator emits a THIN STUB that delegates to an idiomatic JS
// implementation living in js/c2js-runtime/.  This preserves:
//   - Function-name parity (spec §4) — the function still exports
//     with the C name.
//   - Verbatim comment migration (spec §11) — the C-source comment
//     block above the function is preserved on the stub.
//   - Signature parity — the stub accepts the same params and
//     returns the same shape.
// While replacing the translator's broken body emit with hand-written
// idiomatic JS (regex, string methods, etc.) that survives JS-string
// vs char-array shape mismatches.
//
// Anchored by `(cFile basename, C function name)`.  Survives variable
// renames + body reformatting within the function; only breaks if the
// function itself is renamed at the C level (which is a deliberate
// signal to revisit the hand-port anyway).
//
// Per-tu sub-map: each TU's hand-port file lives at the path under
// `runtimeDir`.  The translator emits:
//   import { upwords as __nh_hp_upwords } from '../c2js-runtime/<file>';
//   /* verbatim C-source comments */
//   export function upwords(s) { return __nh_hp_upwords(s); }
//
// Added 2026-05-31 per architectural conversation (move libc-style
// hotspots out of translator-emit to keep gameplay-code translation
// idiomatic and the libc-side JS-faithful).
export const HAND_PORTED_FUNCTIONS = {
    'hacklib.c': {
        runtime: 'hacklib-handports.js',
        // upwords: regex-based first-letter-of-word uppercase.
        //
        // Excluded (tested + reverted in §23.222aw): eos / c_eos /
        // findword.  Their hand-ports are semantically equivalent to
        // the §23.222at cherry-pick form for null / string / array
        // shapes, but the cherry-pick form quietly enters an infinite
        // loop on `{value: N!=0}` scalar-ptr-wrapper input (each iter
        // does __nh_advance_str which returns the wrapper unchanged,
        // and __nh_char_at0 keeps returning the same byte).  Production
        // somehow tolerates this — perhaps the wrapper case is never
        // exercised — but replacing eos with a return-on-scalar-ptr
        // form breaks seed1800 (-3 screens).  The loop-vs-return
        // difference must be observable somewhere; investigation
        // deferred.
        functions: ['upwords', 'xcrypt', 'strNsubst', 'case_insensitive_comp'],
    },
};

// §23.228 — Force scalar-ptr-outparam classification on the named
// function's specified arg indices.  Used for functions whose body
// writes through the param indirectly (via a function-pointer
// dispatch) where the body-scanner's `functionWritesViaParam`
// doesn't see the write.  Without this allowlist, the param is
// classified as read-only (no scalar-ptr-wrapper at callsites),
// silently losing the write.
//
// Example: src/sfbase.c sfo_char(NHFILE *nhfp, char *d_char, ...)
// writes `d_char` only via `(*sfoprocs[idx].fn.sf_char)(nhfp,
// d_char, ...)` — the body-scanner only matches direct `*p = X`
// writes, so d_char is demoted to read-only.  Caller sites end up
// with raw value passthrough (`sfi_char(nhfp, indicate, ...)`),
// losing the write.  Previously hand-patched (version.c surgical
// patch, commit 6567248).
//
// Map: function name → Set of arg indices (0-based).
export const FORCED_SCALAR_PTR_PARAMS = new Map([
    ['sfo_char',   new Set([1])],
    ['sfi_char',   new Set([1])],
    ['sfo_uchar',  new Set([1])],
    ['sfi_uchar',  new Set([1])],
    ['sfo_short',  new Set([1])],
    ['sfi_short',  new Set([1])],
    ['sfo_ushort', new Set([1])],
    ['sfi_ushort', new Set([1])],
    ['sfo_int',    new Set([1])],
    ['sfi_int',    new Set([1])],
    ['sfo_uint',   new Set([1])],
    ['sfi_uint',   new Set([1])],
    ['sfo_int16',  new Set([1])],
    ['sfi_int16',  new Set([1])],
    ['sfo_uint16', new Set([1])],
    ['sfi_uint16', new Set([1])],
    ['sfo_int32',  new Set([1])],
    ['sfi_int32',  new Set([1])],
    ['sfo_uint32', new Set([1])],
    ['sfi_uint32', new Set([1])],
    ['sfo_int64',  new Set([1])],
    ['sfi_int64',  new Set([1])],
    ['sfo_uint64', new Set([1])],
    ['sfi_uint64', new Set([1])],
    ['sfo_long',   new Set([1])],
    ['sfi_long',   new Set([1])],
    ['sfo_ulong',  new Set([1])],
    ['sfi_ulong',  new Set([1])],
    ['sfo_aligntyp', new Set([1])],
    ['sfi_aligntyp', new Set([1])],
    ['sfo_boolean',  new Set([1])],
    ['sfi_boolean',  new Set([1])],
    ['sfo_genericptr', new Set([1])],
    ['sfi_genericptr', new Set([1])],
    ['sfo_any',    new Set([1])],
    ['sfi_any',    new Set([1])],
]);

// §23.227 — Phase 2 string-mode allowlist.  C-file basenames in this
// set are translated under STRING_MODE regardless of the env var,
// so future regens (full builds or selective regen-files) preserve
// the idiomatic JS-string emit form for these TUs.  Add a file here
// when its Phase 2 batch lands; remove when migrating back is needed.
// See docs/STRING_MIGRATION.md for the per-batch ordering.
export const STRING_MODE_FILES = new Set([
    'rip.c',
    'coloratt.c',
    'report.c',
    'fountain.c',
    'mcastu.c',
    'iactions.c',
    'region.c',
    'explode.c',
    'dokick.c',
    'bones.c',
    'steed.c',
    'dig.c',
    'mthrowu.c',
    'weapon.c',
    'mhitm.c',
    'symbols.c',
    'timeout.c',
    'minion.c',
    'mplayer.c',
    'pray.c',
    'dbridge.c',
    'do_wear.c',
    'glyphs.c',
    'sfbase.c',
    'utf8map.c',
    'were.c',
    'calendar.c',
    'write.c',
    'shknam.c',
    'version.c',
    'end.c',
    'insight.c',
    // §23.230 — Bulk addition: TUs that are unpatched, marker-free,
    // and either have no char buffers or already have clean (parity-
    // neutral) regen diffs.  Adding them here makes future builds
    // emit idiomatic JS-string form natively for any string-mode
    // pattern (e.g., char[N] → '', buf[0] = 0 → buf = '').
    'ball.c',
    'drawing.c',
    'exper.c',
    'extralev.c',
    'monst.c',
    'objects.c',
    'quest.c',
    'rect.c',
    'selvar.c',
    'stairs.c',
    'strutil.c',
    'sys.c',
    'wizard.c',
    'worm.c',
    // §23.230b — Patched TUs with NO char-array literals.  Adding
    // them is a no-op for current production (nothing to convert)
    // but flags them as string-mode for future regens.
    'dog.c',
    'mkroom.c',
    'track.c',
    'u_init.c',
    'decl.c',
    'mkmap.c',
    'attrib.c',
    // §23.230d — Patched TUs with 1 char-array literal each.
    // Migrated via --force-patched workflow (regen + reapply patches
    // + verify parity).
    'light.c',
    'mondata.c',
    'monmove.c',
    'sit.c',
    'vision.c',
    // §23.230e — Continued migration via --force-patched
    'dothrow.c',
    'priest.c',
    'lock.c',
    'music.c',
    'vault.c',
    'display.c',
    'sounds.c',
    'dogmove.c',
    'engrave.c',
    'makemon.c',
    'mkmaze.c',
    'steal.c',
    // §23.230f — Medium-array patched TUs (5-7 arrays each)
    'wield.c',
    'detect.c',
    'worn.c',
    // §23.230g — Larger char-buffer TUs (8-12 arrays)
    'polyself.c',
    'muse.c',
    'spell.c',
    'eat.c',
    'hack.c',
    // §23.230h — Medium-large char-buffer TUs (11-12 arrays)
    'mhitu.c',
    'role.c',
    'potion.c',
    'read.c',
    // §23.230i — Large char-buffer TUs (15+ arrays)
    'getpos.c',
    'mkobj.c',
    'mon.c',
    'zap.c',
    'shk.c',
    'trap.c',
    // §23.230j — Largest char-buffer TUs
    'apply.c',
    'uhitm.c',
    'wizcmds.c',
    'pager.c',
    'cmd.c',
    'options.c',
    'date.c',
    'questpgr.c',
    'teleport.c',
    'pickup.c',
    'rumors.c',
    'artifact.c',
    'topten.c',
    'windows.c',
    'o_init.c',
    'do_name.c',
    'botl.c',
    'allmain.c',
    'invent.c',
    'rnd.c',
    'hacklib.c',
]);

// (UNWEDGE_PLAN Q8) Indirect async dispatch — three shapes the C
// call-graph walker cannot see as edges:
//   1. input-reading windowprocs members (their JS implementations
//      await keys; the C AST shows only an opaque member call)
//   2. function-pointer GLOBALS dispatched via (*name)() — occupation
//      (interrupted-action continuation) and afternmv (post-move
//      hook) hold command functions that are async in async builds
//   3. function-pointer TABLE members dispatched via (*tbl[i].f)() —
//      timeout_funcs (timer expiry handlers) and help_menu_items
// Consumed by async-closure.mjs (functions containing such calls
// join the closure) and by build-engine's NH_EMIT_ASYNC injection
// (the call sites get awaits).
export const INPUT_WINDOWPROCS = [
    'win_nhgetch', 'win_yn_function', 'win_getlin',
    'win_get_ext_cmd', 'win_select_menu', 'win_poskey',
];
export const INDIRECT_ASYNC_MEMBERS = [
    ...INPUT_WINDOWPROCS,
    'f',         // timeout_funcs[i].f / help_menu_items[i].f
    'ef_funct',  // extcmd dispatch (translated site currently behind a
                 // goto-TODO; hand cmd.js sites are linter territory)
];
export const INDIRECT_ASYNC_GLOBALS = [
    'occupation', 'afternmv',
    // Monster-iterator callback params (Q9 iteration 9): mon.c's
    // iter_mons_safe(bfunc)/iter_mons(vfunc)/get_iter_mons* invoke
    // their callbacks via (bfunc)(mtmp) — a parameter call invisible
    // to the call-graph walker AND the await linter.  movemon's
    // un-awaited movemon_singlemon callback ran every monster's
    // movement DETACHED and interleaved (the pet double-placement /
    // over-itself class).  Seeding the param names puts the
    // iterators in the closure; the matching paren-deref injection
    // regex awaits the invocations.
    'bfunc', 'vfunc',
    // qsort: the runtime sort awaits possibly-async comparators
    // (qsort_async twin, Q9 iter 3) — so every qsort CALLER must be
    // async-headed.  The FATAL detector named the exact six functions
    // this entry exists for: sortloot, sort_rooms, sortspells,
    // disco_output_sorted, init_mongen_order, condopt.
    'qsort',
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
    atoi:          'js/c2js-runtime/string.js',
    atol:          'js/c2js-runtime/string.js',
    __nh_char_at0:    'js/c2js-runtime/string.js',
    __nh_advance_str: 'js/c2js-runtime/string.js',
    __nh_char_write:  'js/c2js-runtime/string.js',
    __nh_register_static: 'js/c2js-runtime/static-registry.js',
    load_lua:      'js/c2js-runtime/lua.js',
    splev_chr2typ: 'js/c2js-runtime/lua.js',
    check_mapchr:  'js/c2js-runtime/lua.js',
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
    __nh_buf_append:         'js/c2js-runtime/stdio.js',

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
    luaL_checkstring:        'js/c2js-runtime/lua.js',
    luaL_checkinteger:       'js/c2js-runtime/lua.js',
    luaL_checknumber:        'js/c2js-runtime/lua.js',
    luaL_optinteger:         'js/c2js-runtime/lua.js',
    luaL_optstring:          'js/c2js-runtime/lua.js',
    luaL_typename:           'js/c2js-runtime/lua.js',
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
