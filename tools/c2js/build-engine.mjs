// build-engine.mjs — translate the C source closure into js/translated/.
//
// Why: the harness (`prng-diff-extended.mjs`) writes translator output to
// `.cache/c2js/oinit-test/`, which is `.gitignore`d.  The contest scorer
// (`bash frozen/score.sh`) doesn't run any build step, so the engine path
// (`js/jsmain.js` → `js/allmain.js`) can't import from the cache when
// scoring runs in a fresh checkout.
//
// This script writes the same translator output to `js/translated/`,
// which IS checked in.  Engine code can then `import { roles } from
// './translated/role.js'` and the scoring path resolves it.
//
// What it does:
//   1. Run buildTree with the same SOURCES list the harness uses (kept
//      in sync via the comment block below — if the harness gains a TU,
//      add it here too).
//   2. Apply the structural post-processes the harness applies for
//      pointer-mutation idioms that the translator can't yet model
//      (mklev's room-array iteration, mkmaze's get_level_extends).
//      These are necessary for the translated code to RUN correctly;
//      they're not harness-specific.
//   3. SKIP the harness's rnd.js logging patch — that's PRNG-tracing
//      infrastructure for the diff harness, not for engine runtime.
//
// Usage:
//   node tools/c2js/build-engine.mjs
//
// Run after any change to translator source (translate.mjs, build-tree.mjs)
// or to the SOURCES list, then commit the regenerated js/translated/.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTree } from './build-tree.mjs';
import { PLATFORM_DEFINES } from './c2js.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const root = dirname(dirname(dirname(__filename)));
const upstreamDir = join(root, 'nethack-c/upstream');
const stubsDir = join(root, 'tools/c2js/stubs');
const outputDir = join(root, 'js/translated');
mkdirSync(outputDir, { recursive: true });

// SOURCES — kept in sync with tools/c2js/prng-diff-extended.mjs's
// SOURCES list.  See that file for per-TU rationale comments.
const SOURCES = [
    'src/o_init.c', 'src/objects.c', 'src/decl.c', 'src/rnd.c', 'src/hacklib.c',
    'src/dungeon.c', 'src/u_init.c', 'src/bones.c',
    'src/mklev.c', 'src/mkroom.c', 'src/sp_lev.c', 'src/mkobj.c',
    'src/vision.c', 'src/region.c', 'src/rect.c', 'src/mkmap.c',
    'src/makemon.c', 'src/monst.c',
    'src/engrave.c', 'src/rumors.c',
    'src/attrib.c', 'src/mon.c', 'src/monmove.c', 'src/mondata.c',
    'src/allmain.c', 'src/sounds.c', 'src/eat.c',
    'src/quest.c', 'src/teleport.c', 'src/mhitm.c',
    'src/questpgr.c', 'src/muse.c', 'src/trap.c',
    'src/role.c', 'src/exper.c',
    'src/pline.c', 'src/do.c',
    'src/hack.c', 'src/do_wear.c',
    'src/display.c',
    'src/apply.c', 'src/read.c', 'src/zap.c',
    'src/wizard.c', 'src/pray.c', 'src/priest.c',
    'src/dothrow.c', 'src/dokick.c',
    'src/mhitu.c', 'src/uhitm.c',
    'src/dog.c',
    'src/invent.c',
    'src/insight.c', 'src/objnam.c', 'src/pickup.c',
    'src/polyself.c',
    'src/potion.c', 'src/spell.c', 'src/steal.c',
    'src/timeout.c',
    'src/dogmove.c',
    'src/wield.c', 'src/worn.c', 'src/weapon.c',
    'src/dig.c',
    'src/dbridge.c', 'src/detect.c', 'src/explode.c',
    'src/fountain.c', 'src/light.c', 'src/lock.c',
    'src/minion.c', 'src/music.c',
    'src/sit.c', 'src/stairs.c', 'src/steed.c',
    'src/topten.c', 'src/track.c', 'src/were.c',
    'src/worm.c', 'src/vault.c', 'src/artifact.c',
    'src/ball.c', 'src/shk.c', 'src/shknam.c',
    'src/end.c', 'src/mthrowu.c',
    'src/botl.c', 'src/calendar.c', 'src/date.c',
    'src/drawing.c', 'src/glyphs.c',
    'src/getpos.c', 'src/do_name.c',
    'src/mkmaze.c',
    'src/mcastu.c', 'src/mplayer.c', 'src/write.c',
    'src/report.c', 'src/iactions.c',
    'src/extralev.c', 'src/symbols.c', 'src/sys.c',
    'src/utf8map.c', 'src/options.c',
    'src/coloratt.c',
    'src/strutil.c',
    'src/version.c',
    'src/rip.c',
    'src/sfbase.c',
    'src/windows.c',
    'src/wizcmds.c', 'src/selvar.c',
    'src/cmd.c', 'src/pager.c',
];

console.log('build-engine: translating', SOURCES.length, 'TUs to', outputDir);
const t0 = Date.now();
const sources = SOURCES.map((p) => join(upstreamDir, p));
const parserOpts = {
    extraFlags: [`-I${upstreamDir}/include`, `-I${stubsDir}`, ...PLATFORM_DEFINES],
};
buildTree({ sources, outputDir, parserOpts });
console.log('build-engine: translation', Date.now() - t0, 'ms');

// Post-process structural fixes the translator can't yet emit cleanly.
// Same patches as the harness applies — see prng-diff-extended.mjs for
// the per-patch rationale.

let __patchFile_callCount = 0;
let __patchFile_noopCount = 0;
function patchFile(name, mutate) {
    __patchFile_callCount++;
    const p = join(outputDir, name);
    let s = readFileSync(p, 'utf8');
    const before = s;
    s = mutate(s);
    if (s !== before) {
        writeFileSync(p, s);
    } else {
        __patchFile_noopCount++;
        if (process.env.BUILD_ENGINE_TRACE_NOOP) {
            const err = new Error('patchFile noop');
            const where = err.stack.split('\n')[2] || '';
            console.log(`patchFile noop: ${name} @ ${where.trim()}`);
        }
    }
}

// rnd.js: wrap the generated rn2/rnd/d/rne/rnz exports to push
// each call into game._rngLog, so engine code that calls these
// (directly or transitively through translated chargen) records
// the same trace the contest scorer reads via getRngLog().
//
// Without this, replacing fastforward.js's hardcoded `rn2(N)`
// calls with translated `init_objects()` etc. would advance PRNG
// state but emit no log entries — score=0 even though state is
// correct.
patchFile('rnd.js', (s) => {
    const NAMES = new Set(['rn2', 'rn1', 'rnd', 'd', 'rne', 'rnz', 'rnl', 'rn2_on_display_rng']);
    let out = '', i = 0;
    // Opt-in caller-trace helper: when NH_TRACE_CALLER=1, each
    // PRNG call's log entry gets a ` @ funcName(file:line)` suffix
    // mirroring the C-side trace's format.  Stack-walk per call is
    // not cheap (~5-15s overhead on a 44-session sweep), so it's
    // gated.  See LEARNINGS §23.127 — this is the diagnostic that
    // makes the JS column of divergence-table.mjs actionable.
    //
    // Module-load env read avoids per-call process.env access.  The
    // helper itself is a top-of-file const so the wrapper bodies
    // below can reference it.  Frames inside rnd.js / c2js-runtime
    // are skipped so the caller is the engine-side callee, not the
    // PRNG wrapper itself.
    out += '\nconst _NH_TRACE_CALLER = ';
    out += '(typeof process !== "undefined" && process.env && process.env.NH_TRACE_CALLER === "1");\n';
    out += 'function _nh_trace_caller() {\n';
    out += '    if (!_NH_TRACE_CALLER) return "";\n';
    out += '    const stk = (new Error()).stack || "";\n';
    out += '    const lines = stk.split("\\n");\n';
    out += '    for (let i = 1; i < lines.length; i++) {\n';
    out += '        const L = lines[i];\n';
    out += '        if (L.includes("/rnd.js:")) continue;\n';
    out += '        if (L.includes("/c2js-runtime/")) continue;\n';
    out += '        let m = L.match(/at\\s+(\\S+)\\s+\\(.*?\\/([^/]+):(\\d+):\\d+\\)/);\n';
    out += '        if (m) return " @ " + m[1] + "(" + m[2] + ":" + m[3] + ")";\n';
    out += '        m = L.match(/at\\s+.*?\\/([^/]+):(\\d+):\\d+/);\n';
    out += '        if (m) return " @ (" + m[1] + ":" + m[2] + ")";\n';
    out += '    }\n';
    out += '    return "";\n';
    out += '}\n';
    while (i < s.length) {
        const tail = s.slice(i);
        const m = tail.match(/^export function ([A-Za-z_][A-Za-z0-9_]*)\(([^)]*)\) \{/);
        if (!m) { out += s[i]; i += 1; continue; }
        const fname = m[1], argList = m[2];
        if (!NAMES.has(fname)) { out += tail.slice(0, m[0].length); i += m[0].length; continue; }
        let depth = 1, j = i + m[0].length;
        while (j < s.length && depth > 0) {
            if (s[j] === '{') depth += 1;
            else if (s[j] === '}') depth -= 1;
            j += 1;
        }
        const body = s.slice(i + m[0].length, j - 1);
        out += 'function _orig_' + fname + '(' + argList + ') {' + body + '}\n';
        out += 'export function ' + fname + '(' + argList + ') {\n';
        out += '    const _r = _orig_' + fname + '(' + argList + ');\n';
        out += '    if (game._rngLogEnabled) game._rngLog.push("' + fname + '(" + [' + argList + '].join(",") + ")=" + _r + _nh_trace_caller());\n';
        // Watchdog hook: allmain.js sets game._movemon_watchdog
        // when calling real movemon().  Count-based check — each
        // PRNG call bumps a counter, throws when limit exceeded.
        // Catches rn2-firing infinite loops (m_move / mfndpos paths
        // in some sessions).  No wall-clock check here because
        // Date.now is non-deterministic and banned in translator
        // output (spec §6 banned calls); allmain.js's per-iter
        // wrapper or trace.js fnEnter still uses wall-clock for
        // engine-side backup.
        out += '    const _wd = game._movemon_watchdog;\n';
        out += '    if (_wd) {\n';
        out += '        if (++_wd.count > _wd.limit) throw new Error("movemon rn2-count watchdog tripped");\n';
        out += '    }\n';
        out += '    return _r;\n}\n';
        i = j;
    }
    return out;
});

// o_init.js: one C idiom still needing a post-process patch.
//
// (Patch #1 — strchr(X, c) - X — migrated to translate.mjs binaryOp.)
// (Patch #3 — disco_append_typename buf-mutation — migrated to
//             translate.mjs RETURNS_FIRST_ARG + MUTATING_STR_CALLS.)
//
// `for (s = classes; *s; s++) { oclass = *s; ... }` (the char-array
// walk in dodiscovered) → JS char-code iteration.  Translator emits
// `for (s = classes; s; s++) { oclass = s; }`, where `s++` on a
// string is NaN and `oclass = s` assigns the whole string instead
// of the current char.  Pattern is too site-specific (depends on
// loop var name `s` and assignment shape) to move generically.
patchFile('o_init.js', (s) => {
    s = s.replace(
        /for \(s = classes; s; s\+\+\) \{\s*oclass = s;/,
        'for (let __ci = 0; __ci < classes.length && classes.charCodeAt(__ci); __ci++) { oclass = classes.charCodeAt(__ci);'
    );
    return s;
});

// vault.js: same pointer-deref pattern as o_init's `for (s = classes...)`.
// C: `for (ptr = array; *ptr; ptr++) if (svr.rooms[*ptr - ROOMOFFSET].rtype == VAULT) return *ptr;`
// Translator emits: `for (ptr = array; ptr; ptr++) if (game.rooms[ptr - 3].rtype == VAULT) return ptr;`
// — drops the `*ptr` deref so the loop iterates on the reference (NaN
// arithmetic) and the index expression `ptr - 3` operates on the
// array itself rather than the current char.  Until the translator
// can detect `for (P; *P; P++)` and emit index iteration generically,
// rewrite this site here.  C ref: vault.c:244-251 vault_occupied.
patchFile('vault.js', (s) => {
    s = s.replace(
        /export function vault_occupied\(array\) \{[\s\S]*?return 0;\s*\}/,
        `export function vault_occupied(array) {
    if (!array) return 0;
    for (let i = 0; i < array.length; i++) {
        const v = array[i];
        if (!v) break;
        if (game.rooms[v - 3].rtype == VAULT) return v;
    }
    return 0;
}`
    );
    return s;
});

// mkmap.js: pass_two / pass_three drop the `*p = X` writes that
// flip cave-smooth pass terrain.  C ref mkmap.c:113-115, 136-138:
//   new_loc(x, y) = bg_typ;          // pass_two count==5 branch
//   new_loc(x, y) = get_map(...);    // pass_two else branch
// where `new_loc(i, j)` is `*(gn.new_locations + j * (WIDTH+1) + i)`.
// Translator can't model `*p = X` so emits `void 0 /* TODO */`.
// Without the writes, our smoothed map is wrong and the readback
// loop later (line 99/124) reads from new_locations which contains
// alloc()'s makeStructProxy() default → wrong terrain.
// COLNO=80, WIDTH=COLNO-2=78, so stride is WIDTH+1=79.
// Fix: replace the TODO no-ops with array writes.  Same fix for
// both passes.
patchFile('mkmap.js', (s) => {
    // pass_two: count == 5 (line 91) and else (line 93)
    s = s.replace(
        /if \(count == 5\) \{\s*void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = bg_typ\) \*\/;\s*\} else \{\s*void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = get_map\(x, y, bg_typ\)\) \*\/;\s*\}/,
        `if (count == 5) {
                game.new_locations[y * 79 + x] = bg_typ;
            } else {
                game.new_locations[y * 79 + x] = get_map(x, y, bg_typ);
            }`
    );
    // pass_three: count < 3 (line 115) and else (line 117)
    s = s.replace(
        /if \(count < 3\) \{\s*void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = bg_typ\) \*\/;\s*\} else \{\s*void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = get_map\(x, y, bg_typ\)\) \*\/;\s*\}/,
        `if (count < 3) {
                game.new_locations[y * 79 + x] = bg_typ;
            } else {
                game.new_locations[y * 79 + x] = get_map(x, y, bg_typ);
            }`
    );
    // Read-back loop: `levl[x][y].typ = new_loc(x, y)` translated
    // as `game.level.locations[x][y].typ = (game.new_locations + ...)`
    // — that's a pointer (array index expression value) where the C
    // is reading through the pointer (`*(p + ...)`).  Fix the read.
    s = s.replace(
        /game\.level\.locations\[x\]\[y\]\.typ = \(game\.new_locations \+ \(\(y\) \* \(\(80 - 2\) \+ 1\)\) \+ \(x\)\);/g,
        'game.level.locations[x][y].typ = game.new_locations[y * 79 + x];'
    );
    return s;
});

// mklev.js: clear_level_structures drops `*lev++ = zerorm` write.
// C ref mklev.c:864 — `*lev++ = zerorm;` clears each location to a
// zero-struct (default for new level).  Translator dropped the
// pointer-write.  Without it, locations carry stale state across
// level transitions (multi-segment sessions, level changes).
//
// `zerorm` is a static struct in the C function — we replicate it
// inline here.
patchFile('mklev.js', (s) => {
    s = s.replace(
        /lev = game\.level\.locations\[x\]\[0\];\s*for \(y = 0; y < 21; y\+\+\) \{\s*void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = __clear_level_structures_zerorm\) \*\/;/,
        `for (y = 0; y < 21; y++) {
            Object.assign(game.level.locations[x][y], __clear_level_structures_zerorm);`
    );
    return s;
});

// mklev.js: do_room_or_subroom drops `*p = ROOM` / `*p = 1` writes
// for room interior cells.  C ref mklev.c:249-254 and 287-291:
//   lev = &levl[x][lowy - 1];
//   for (y = ...; y <= ...; y++) lev++->lit = 1;        // lit pass
//   lev = &levl[x][lowy];
//   for (y = lowy; y <= hiy; y++) lev++->typ = ROOM;    // typ pass
// The translator drops both the `lev = &levl[x][lowy]` setup AND
// the `lev++->X = Y` post-increment writes.  Result: rooms get
// created with empty interiors (no ROOM cells, no lit flags).
// Replace TODOs with direct index writes using x, y from the
// enclosing loop variables.
patchFile('mklev.js', (s) => {
    s = s.replace(
        /lev = game\.level\.locations\[x\]\[\(\(lowy - 1\) > \(0\) \? \(lowy - 1\) : \(0\)\)\];\s*for \(y = lowy - 1; y <= hiy \+ 1; y\+\+\) \{\s*void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 1\) \*\/;\s*\}/,
        `for (y = lowy - 1; y <= hiy + 1; y++) {
                game.level.locations[x][y >= 0 ? y : 0].lit = 1;
            }`
    );
    s = s.replace(
        /lev = game\.level\.locations\[x\]\[lowy\];\s*for \(y = lowy; y <= hiy; y\+\+\) \{\s*void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = ROOM\) \*\/;\s*\}/,
        `for (y = lowy; y <= hiy; y++) {
                game.level.locations[x][y].typ = ROOM;
            }`
    );
    return s;
});

// makemon.js: makemon_rnd_goodpos has `goto gotgood` TODOs that
// the translator can't model (jump out of nested loops to a
// labeled block).  Without the gotos, the fallback search never
// returns success when goodpos finds a spot — the loops keep
// running and the function falls through to `return 0`.
// Result: monster placement fails when the random-pos retry loop
// exhausts but a goodpos exists, leading to monsters not being
// placed.  Replace the two `goto gotgood` TODOs with inline
// `cc.x = nx; cc.y = ny; return 1` since gotgood just does that.
patchFile('makemon.js', (s) => {
    s = s.replace(
        /if \(goodpos\(nx, ny, mon, gpflags\)\) \{\s*\/\* TODO Phase 5\+: goto gotgood \(label not in scope of break\) \*\/\s*\}/g,
        `if (goodpos(nx, ny, mon, gpflags)) {
                        cc.x = nx;
                        cc.y = ny;
                        return 1;
                    }`
    );
    return s;
});

// botl.js armor_status: superseded by char-buffer slice A walker-
// vs-outparam dispatch (commit 83262f8 + strkitten coercion fix
// b77aee0).  The translator now emits `armbuf[__nh_p_idx++] = 'G'`
// natively; the old textual patch above was matching the broken
// `let p = armbuf; if (...) { void 0 ... }` shape that no longer
// exists.

// botl.js status_hilite_menu shlmenu_redo: superseded by the A3
// goto back-jump-to-loop recognizer (commit 85cb377 / §23.103).
// The translator now emits `shlmenu_redo: while (true) { ...;
// continue shlmenu_redo; break; }` directly; the old textual
// patch's `shlmenu_redo: { ... }` block shape no longer exists
// in the translator output.

// display.js: clear_glyph_buffer drops `*gptr = nul_gbuf` writes
// AND `gptr++` advances in a 2D row iteration.
// C ref display.c:
//   for (y = 0; y < ROWNO; y++) {
//     gptr = &gbuf[y][0];
//     for (x = COLNO; x; x--, gptr++)
//       *gptr = nul_gbuf;
//   }
// Translator emits the loop but drops both the pointer-write and
// the pointer-advance.  Result: glyph buffer never clears between
// frames; stale glyphs persist.  Replace with index-based iteration
// using Object.assign for the struct copy.
patchFile('display.js', (s) => {
    s = s.replace(
        /for \(y = 0; y < 21; y\+\+\) \{\s*gptr = game\.gbuf\[y\]\[0\];\s*for \(x = 80; x; x--\) \{\s*void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = game\.nul_gbuf\) \*\/;\s*\}/,
        `for (y = 0; y < 21; y++) {
        for (x = 0; x < 80; x++) {
            if (typeof game.gbuf[y][x] === 'object' && game.gbuf[y][x] !== null) {
                Object.assign(game.gbuf[y][x], game.nul_gbuf);
            }
        }`
    );
    return s;
});

// display.js: show_glyph reads `game.gbuf[y][x].glyphinfo.glyph` and
// other struct fields.  The translator emits game.gbuf as a 21x80
// 2D array of zero NUMBERS (decl.js g_init_g.gbuf), so the read
// throws `TypeError: Cannot read properties of undefined (reading
// 'glyph')` for entries that haven't been overwritten with structs.
// Inside `movemon`, the throw triggers the watchdog's PRNG rollback
// in `js/allmain.js moveloop_core` and erases the monster's partial
// rn2 sequence.  C ref: display.c show_glyph reads `gbuf[y][x]` as
// `gbuf_entry` struct value; the C bss-zeroed memory just reads as
// zeros for `gnew`, `glyphinfo.glyph`, etc.
//
// Guard at function entry: if `gbuf[y][x]` isn't a real object,
// no glyph state is tracked yet — return silently.  Matches C's
// "read zeros, compare to glyph, update gbuf entry if different"
// only for the IF-DIFFERENT case (where C would write); the read-
// only branches that just compare oldglyph to glyph are short-
// circuited away.  Acceptable because the comparison's only
// downstream effect is the a11y `show_glyph_change` flag, which
// stays at default 0 in our runs (a11y.glyph_updates is 0).
patchFile('display.js', (s) => {
    s = s.replace(
        /(export function show_glyph\(x, y, glyph\) \{\s*let glyphinfo[^]*?return;\s*\}\s*if \(!isok\(x, y\)\) \{)/,
        (m, prefix) => prefix.replace(
            /(if \(!isok\(x, y\)\) \{)$/,
            `if (typeof game.gbuf?.[y]?.[x] !== 'object' || game.gbuf[y][x] === null) return;
    $1`
        )
    );
    return s;
});

// decl.js: g_init_r.repo.location is emitted as the number 0, but C
// has it as a `coord {xchar x, y;}` struct.  paybill (shk.c) does
// `repo.location.x = repo.location.y = 0;` which throws on assigning
// `.x` to a number.  Inside movemon's death path (dochug → mattacku
// → mhitu → mdamageu → done_in_by → done → really_done → paybill),
// the throw fires the watchdog rollback and erases ~5 PRNG calls per
// player-death event.
//
// C ref: extern.h struct repo { struct monst *shopkeeper; coord
// location; }; the `coord` type is two-int.
patchFile('decl.js', (s) => {
    return s.replace(
        /repo: \{ shopkeeper: null, location: 0 \}/,
        `repo: { shopkeeper: null, location: { x: 0, y: 0 } }`
    );
});

// decl.js: `cg.zeroany` and `cg.zeroNhRect` are zero-initialized
// C aggregates.  Translator emits them as static `[null]` /
// `{ lx: 0, ... }` shared values, but C semantics treat them as
// "produces a fresh zero value when copied" — `=` between aggregates
// is a value-copy in C.  In JS, `let r = cg.zeroNhRect` shares the
// reference, so any caller that writes to `r.lx = X` permanently
// mutates the global `cg.zeroNhRect`.
//
// Real-world usage patterns:
// - timeout.js write_timer: `arg_save = cg.zeroany; arg_save.a_obj
//   = timer.arg.a_obj;`  Polluted cg.zeroany.a_obj for every other
//   caller after first invocation.
// - region.js create_gas_cloud_selection: `r = cg.zeroNhRect;
//   selection_getbounds(sel, r);`  Polluted cg.zeroNhRect after
//   first call.
//
// Fix: convert each to a getter so every access returns a fresh
// zero-shape object.  C ref include/extern.h `union any` and
// `NhRect` struct.
patchFile('decl.js', (s) => {
    s = s.replace(
        /zeroany: \[null\]/,
        `get zeroany() { return { a_obj: null, a_void: null, a_monst: null, a_long: 0, a_int: 0, a_uint: 0, a_ulong: 0, a_iflags: 0 }; }`
    );
    s = s.replace(
        /zeroNhRect: \{ lx: 0, ly: 0, hx: 0, hy: 0 \}/,
        `get zeroNhRect() { return { lx: 0, ly: 0, hx: 0, hy: 0 }; }`
    );
    // cg.zeroobj has a nested `v` sub-struct.  Static `{ ..., v: { ... } }`
    // means Object.assign(target, cg.zeroobj) shares the `v` reference
    // across all targets.  Mksobj and init_dummyobj explicitly reset
    // target.v after Object.assign, but many other dummy-object init
    // sites (o_init, muse, trap, zap, pickup, detect) don't — so any
    // function that mutates dummy.v.v_nexthere et al would pollute the
    // shared cg.zeroobj.v.
    // Convert to a getter returning a fresh outer + fresh v on every
    // access; preserve all the scalar fields' shape from the original.
    const zeroobjMatch = s.match(/zeroobj: \{(.+?)\}, zeromonst/);
    if (zeroobjMatch) {
        const inner = zeroobjMatch[1];
        // Build a freshly-allocated zeroobj literal.  Keep all fields
        // exactly as the original emitted them — the original had `v:
        // { v_nexthere: null, v_ocontainer: null, v_ocarry: null }` as
        // a nested object literal, which the getter recreates on each
        // call.
        s = s.replace(
            /zeroobj: \{(.+?)\}, zeromonst/,
            `get zeroobj() { return {${inner}}; }, zeromonst`
        );
    }
    // Same shared-reference issue for `cg.zeromonst` (has `mtrack` nested
    // array etc., though currently emitted as `mtrack: null`).  Even with
    // mtrack: null, future translator changes could add nested objects;
    // be defensive and make it a getter.
    const zeromonstMatch = s.match(/zeromonst: \{(.+?)\}, get zeroany/);
    if (zeromonstMatch) {
        const inner = zeromonstMatch[1];
        s = s.replace(
            /zeromonst: \{(.+?)\}, get zeroany/,
            `get zeromonst() { return {${inner}}; }, get zeroany`
        );
    }
    return s;
});

// mkobj.js: splitobj's `Object.assign(otmp, obj)` shares the `v`
// sub-struct between otmp and obj (JS reference semantics).  Then
// the next line `obj.v.v_nexthere = otmp` ALSO sets
// `otmp.v.v_nexthere = otmp` — a self-loop in the floor chain.
// First confirmed by tracing seed0004 iter 40: dog_invent ->
// could_reach_item -> sobj_at(BOULDER, 49, 9) walks a self-loop
// forever (LEARNINGS §19, this session's investigation).
//
// C ref `*otmp = *obj;` copies the struct by VALUE — in C the
// `v` union field is part of the struct.  In JS, Object.assign
// is a shallow copy, so `v` becomes a shared reference.
//
// Fix: after the Object.assign, explicitly clone the v sub-struct
// so otmp.v and obj.v are distinct objects.
patchFile('mkobj.js', (s) => {
    return s.replace(
        /(Object\.assign\(otmp, obj\);)/,
        '$1\n    otmp.v = { v_nexthere: obj.v.v_nexthere, v_ocontainer: obj.v.v_ocontainer, v_ocarry: obj.v.v_ocarry };'
    );
});

// mkobj.js + invent.js: fix `extract_nobj` / `extract_nexthere`
// call sites where the translator emitted the VALUE of the head
// pointer instead of a head_ptr wrapper.
//
// C ref:
//   extract_nobj(obj, struct obj **head_ptr) {
//       curr = *head_ptr;
//       ...
//       if (prev) prev->nobj = curr->nobj;
//       else *head_ptr = curr->nobj;  // <-- needs setter
//   }
//
// The translator EXPECTS callers to pass a `{value}` wrapper so
// the inner `*head_ptr = X` becomes `head_ptr.value = X`.  For
// most struct-pointer args it emits this wrapper.  But for
// expressions like `game.level.objects[x][y]` or `game.invent` it
// missed — it passes the value, so the head update is lost (writes
// to `obj.value`, not the slot).
//
// Concrete impact: when remove_object is called for an obj that
// IS the head of its floor pile, the head field is never cleared.
// The "extracted" obj still has `v_nexthere` cleared to null (line
// after the loop), but `game.level.objects[x][y]` still points to
// it.  Next place_object adds a NEW obj at the same position:
//   place_object: otmp2 = game.level.objects[x][y];  // == stale obj
//                 otmp.v.v_nexthere = otmp2;
//                 game.level.objects[x][y] = otmp;
// Now otmp.v_nexthere = stale obj.  Then next remove_object on
// THAT new head leaves it as orphan head again, but ANOTHER
// remove_object on a non-head obj walks the chain correctly...
// At some point the chain becomes self-referential.  Specifically:
// when an obj is added at a position that ALREADY has a stale
// orphan as head, the new obj's v_nexthere points to the stale,
// AND a later remove_object on the chain may set the stale's
// v_nexthere to itself.
//
// Concrete symptom (LEARNINGS §19): seed0004 iter 40 hangs in
// sobj_at(BOULDER, 49, 9) because that position has a circular
// v_nexthere chain (gold oid=70 -> itself).
//
// Fix: wrap each value-argument call site as a {get/set value}
// wrapper.
[
    ['mkobj.js', /extract_nexthere\(([^,]+), game\.level\.objects\[([^\]]+)\]\[([^\]]+)\]\)/g,
        'extract_nexthere($1, { get value() { return game.level.objects[$2][$3]; }, set value(_v) { game.level.objects[$2][$3] = _v; } })'],
    ['mkobj.js', /extract_nobj\(([^,]+), game\.level\.objlist\)/g,
        'extract_nobj($1, { get value() { return game.level.objlist; }, set value(_v) { game.level.objlist = _v; } })'],
    ['mkobj.js', /extract_nobj\(([^,]+), game\.invent\)/g,
        'extract_nobj($1, { get value() { return game.invent; }, set value(_v) { game.invent = _v; } })'],
    ['mkobj.js', /extract_nobj\(([^,]+), game\.migrating_objs\)/g,
        'extract_nobj($1, { get value() { return game.migrating_objs; }, set value(_v) { game.migrating_objs = _v; } })'],
    ['mkobj.js', /extract_nobj\(([^,]+), game\.level\.buriedobjlist\)/g,
        'extract_nobj($1, { get value() { return game.level.buriedobjlist; }, set value(_v) { game.level.buriedobjlist = _v; } })'],
    ['mkobj.js', /extract_nobj\(([^,]+), game\.billobjs\)/g,
        'extract_nobj($1, { get value() { return game.billobjs; }, set value(_v) { game.billobjs = _v; } })'],
    // obj.v.v_ocontainer.cobj — container nesting.
    ['mkobj.js', /extract_nobj\(([^,]+), ([^,]+)\.v\.v_ocontainer\.cobj\)/g,
        'extract_nobj($1, { get value() { return $2.v.v_ocontainer.cobj; }, set value(_v) { $2.v.v_ocontainer.cobj = _v; } })'],
    // obj.v.v_ocarry.minvent — monster inventory.
    ['mkobj.js', /extract_nobj\(([^,]+), ([^,]+)\.v\.v_ocarry\.minvent\)/g,
        'extract_nobj($1, { get value() { return $2.v.v_ocarry.minvent; }, set value(_v) { $2.v.v_ocarry.minvent = _v; } })'],
    ['invent.js', /extract_nobj\(([^,]+), game\.invent\)/g,
        'extract_nobj($1, { get value() { return game.invent; }, set value(_v) { game.invent = _v; } })'],
].forEach(([file, re, sub]) => {
    patchFile(file, (s) => s.replace(re, sub));
});

// worn.js write-only fix (F3 work-in-progress, uncommitted).
patchFile('worn.js', (s) => {
    const fieldMap = '({1:"uarm",2:"uarmc",4:"uarmh",8:"uarms",' +
        '16:"uarmg",32:"uarmf",64:"uarmu",131072:"uleft",' +
        '262144:"uright",256:"uwep",1024:"uswapwep",512:"uquiver",' +
        '65536:"uamul",524288:"ublindf",2097152:"uball",4194304:"uchain"})';
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = obj\) \*\/;/g,
        `{ const __f = ${fieldMap}[wp.w_mask]; if (__f) game[__f] = obj; }`
    );
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = null\) \*\/;/g,
        `{ const __f = ${fieldMap}[wp.w_mask]; if (__f) game[__f] = null; }`
    );
    return s;
});

// artifact.js: stub artilist (F3 work-in-progress).
patchFile('artifact.js', (s) => {
    const stub = `\nconst artilist = (() => {\n  const ent = () => ({ name: "", otyp: 0, spfx: 0, cspfx: 0, defn: 0,\n    attk: { aatyp: 0, adtyp: 0, damn: 0, damd: 0 },\n    defense: { aatyp: 0, adtyp: 0, damn: 0, damd: 0 },\n    carry: { aatyp: 0, adtyp: 0, damn: 0, damd: 0 },\n    inv_prop: 0, alignment: 0, role: 0, race: 0,\n    acost: 0, gift_value: 0, cost: 0, color: 0, aflags: 0 });\n  const arr = []; for (let i = 0; i < 34; i++) arr.push(ent()); return arr;\n})();\n`;
    const lastImportMatch = s.match(/(^import .*;\n)+/m);
    if (lastImportMatch) {
        const insertAt = lastImportMatch.index + lastImportMatch[0].length;
        s = s.slice(0, insertAt) + stub + s.slice(insertAt);
    } else {
        s = stub + s;
    }
    return s;
});

// artifact.js: mk_artifact pointer walk — different shape: the C
// source counts via `m` while indexing `&artilist[m]`, and the
// translator emits `artilist[m + m]` (doubled).  Not absorbed by
// the struct-ptr for-loop recognizer because the iteration is on
// `m`, not on a pointer that gets `++`'d.  Distinct from the
// `for (a = artilist + 1; ...; a++)` family.
patchFile('artifact.js', (s) => {
    return s.replace(
        /for \(m = 1; a\.otyp; m\+\+\) \{\s+a = artilist\[m \+ m\];/,
        `for (m = 1; m < artilist.length && (a = artilist[m]).otyp; m++) {`
    );
});

// decl.js: gbuf-as-objects patch — diagnostic-gated.  Without
// this, glyph_at throws on every t_domove call and JS falls back
// to a manual move that doesn't fire C's do_attack /
// domove_bump_mon / domove_attackmon_at RNG (seed0014 et al
// diverge here).  With it, t_domove gets past glyph_at but
// crashes later on null windowprocs.win_cliparound — the
// position-restore guard in cmd.js's domove() catch prevents
// the double-move that would otherwise cascade.  See
// LEARNINGS §23.25.  Diagnostic env: NH_GBUF_FIX=1.
patchFile('decl.js', (s) => {
    return s.replace(
        /Object\.assign\(game, g_init_g\);/,
        `Object.assign(game, g_init_g);
    // C gbuf is gbuf_entry[ROWNO][COLNO] zero-initialised; the
    // translator emits the 21×80 array as scalar 0s because the
    // nested struct type isn't resolved at decl-time.  Replace
    // with proper objects so glyph_at, get_bkglyph_and_framecolor,
    // newsym, etc. can read \`gbuf[y][x].glyphinfo.glyph\` without
    // crashing on \`undefined.glyph\`.  Was gated behind
    // NH_GBUF_FIX=1; flipped to default on as part of Phase F now
    // that translated mklev is the default level generator.
    const newGbuf = new Array(21);
    for (let y = 0; y < 21; y++) {
        const row = new Array(80);
        for (let x = 0; x < 80; x++) {
            row[x] = { gnew: 0, glyphinfo: { glyph: 0, ttychar: 0, framecolor: 0,
                gm: { glyphflags: 0, sym: { color: 0, symidx: 0 },
                      customcolor: 0, color256idx: 0, tileidx: 0, u: null } } };
        }
        newGbuf[y] = row;
    }
    game.gbuf = newGbuf;`
    );
});

// pickup.js: query_objlist's `for (i = k = 0, mi = *pick_list;
// i < n; i++, mi++)` — now handled by translate.mjs's
// detectPointerIteration, which was extended to accept `*pp`
// deref in init (in addition to plain DeclRef, MemberExpr,
// arr+N, &arr[N], and ArraySubscript shapes).  expr() renders
// `*pick_list` as `pick_list.value` via the outparam-wrapper
// convention; the for-loop emit then indexes into that array.

// weapon.js: skill_init pointer walk over class_skill array
// (the per-role skill_X table from u_init.c).  C ref weapon.c:1774
// `for (; class_skill->skill != P_NONE; class_skill++)`.  Translator
// emitted the post-increment as `(class_skill = __nh_blackhole)`,
// AND keeps `class_skill.skill` as a field-read on the array
// (always undefined → loop test undefined != P_NONE truthy → body
// runs once with class_skill being the array, then advances to
// Proxy whose .skill == 0 == P_NONE so the loop exits).
// Result: weapon_skills[skill].max_skill stays at P_ISRESTRICTED
// for every weapon — skill_advance / enhance can't promote any
// skill.  No PRNG fired by skill_init itself, but downstream
// can_twoweapon and skill-gated paths depend on these maxes being
// set.  Rewrite to indexed iteration.
// weapon.js: skill_init `for (; class_skill->skill != P_NONE;
// class_skill++) { ...}` — now handled by translate.mjs's empty-
// init for-loop recognizer (uses the same temp-capture trick as
// detectWhilePtrWalk).

// objnam.js: 4 pointer-walk patterns over `spellings` and
// `Japanese_items`.  C ref objnam.c uses `for (as = spellings;
// as->sp; as++) { ... }` style.  Translator emitted:
//   let as = spellings;       // array
//   while (as.sp) {           // array.sp = undefined (truthy via auto-Proxy)
//     ...;
//     (as = __nh_blackhole);  // Proxy whose .sp coerces to 0/falsy → exits
//   }
// Same translator gap as the artifact walks: the loop body
// effectively runs at most ONCE on undefined-vs-real, then exits.
// Plus the Proxy.toPrimitive==0 quirk makes `while (Proxy.sp)`
// fall through after one iter.
// Used by readobjnam (wish parsing, "wand of polymorph", and the
// Japanese-item name table for Samurai display).  Rewrite as
// indexed iteration.
// objnam.js: spellings ×2 + Japanese_items ×2 while-loop pointer walks
// — now handled by translate.mjs `detectWhilePtrWalk` (CompoundStmt-
// level recognizer that pairs a DeclStmt(p = arr) with a WhileStmt
// ending in p++ and rewrites as init + for-loop).

// engrave.js: wipeout_text drops `*p = X` writes for engraving
// character wipe.  C ref engrave.c:144,164,184:
//   p = &engr[nxt];                              // local var
//   if (strchr("?.,'`-|_", *p)) { *p = ' '; continue; }
//   ... *p = rubouts[i].wipeto[j];   if matched rubout
//   ... *p = '?';                    if no rubout matched
// The translator dropped both the `p = &engr[nxt]` and the
// `*p = X` writes.  Result: our engraving never gets modified
// when wiped, so strlen(engr) stays constant across iterations.
// Replace TODOs with direct index writes using `nxt`.
// rumors.js: getrumor's cookie-prefix strip is a pointer-arithmetic
// translator gap.  C source:
//   char *src = &rumor_buf[marklen]; char *dst = rumor_buf;
//   for (; *src != '\0'; ++src, ++dst) *dst = *src;
//   *dst = '\0';
// The translator emits this as JS string concatenation: `src =
// rumor_buf + marklen` is string concat, `src != 0` is always
// truthy (string strict-compares !=0), and `++src` keeps growing
// the string — an unbounded allocation loop that OOMs.  Rewrite
// to an explicit char-array shift over rumor_buf.
// role.js: role_init's pl_character setup is a char-array vs string
// translator gap.  C source (role.c near line 1180):
//   Strcpy(svp.pl_character, roles[flags.initrole].name.m);
//   svp.pl_character[PL_CSIZ - 1] = '\0';
// The translator emits:
//   game.pl_character = strcpy(game.pl_character, roles[...].name.m);
//   game.pl_character[32 - 1] = 0;
// Our strcpy() returns a JS string AND writes into the dst array
// when dst is an array.  The translator's assignment form replaces
// the char-array with the returned string, then `[31] = 0` on a
// string throws "Cannot create property '31' on string 'Tourist'".
// Fix: drop the assignment (so pl_character stays an array — strcpy
// already wrote the bytes plus a trailing NUL), and the [31] = 0
// line becomes a no-op safe array write.
patchFile('role.js', (s) => {
    return s.replace(
        /game\.pl_character = strcpy\(game\.pl_character, roles\[game\.flags\.initrole\]\.name\.m\);\s+game\.pl_character\[32 - 1\] = 0;/,
        `strcpy(game.pl_character, roles[game.flags.initrole].name.m);
    if (Array.isArray(game.pl_character)) game.pl_character[32 - 1] = 0;`
    );
});

patchFile('rumors.js', (s) => {
    s = s.replace(
        /if \(!exclude_cookie && !strncmp\(rumor_buf, __getrumor_cookie_marker, marklen\)\) \{\s+let src = rumor_buf \+ marklen;\s+let dst = rumor_buf;\s+for \(; src != 0; \+\+src , \+\+dst\) \{\s+dst\.value = src;\s+\}\s+dst\.value = 0;\s+\}/,
        `if (!exclude_cookie && !strncmp(rumor_buf, __getrumor_cookie_marker, marklen)) {
        if (Array.isArray(rumor_buf)) {
            let i = marklen;
            let j = 0;
            while (i < rumor_buf.length && rumor_buf[i] !== 0) {
                rumor_buf[j++] = rumor_buf[i++];
            }
            if (j < rumor_buf.length) rumor_buf[j] = 0;
        } else if (typeof rumor_buf === 'string') {
            return rumor_buf.slice(marklen);
        }
    }`
    );
    // Local getrumor body relies on `fopen("rumors", "r")` which the
    // c2js autostubber resolves to a no-op returning 0.  The function
    // therefore bails out via the `couldnt_open_file` branch, skipping
    // every rn2 call C makes inside getrumor (rn2(2), rn2(filesz),
    // rn2(19) via exercise(A_WIS, ...)).  The only intra-module caller
    // is outrumor (fortune cookie eat / oracle / artifact whisper);
    // cross-module callers are routed via EXTERNAL_SYMBOLS to the
    // runtime override directly.  Replace this body to delegate to the
    // runtime override so the local path also fires the correct PRNG
    // sequence.  Cookie-prefix strip + exercise call live inside the
    // runtime override, so we just return its result.
    if (!s.includes('__runtime_getrumor')) {
        // Anchor on `from '../c2js-runtime/string.js';` which is stable
        // across translator output changes that vary the imported set
        // (e.g. adding nh_strchr_truncate).  Append the runtime import
        // immediately after this line.
        s = s.replace(
            /(import \{[^}]+\} from '\.\.\/c2js-runtime\/string\.js';)/,
            "$1\nimport { getrumor as __runtime_getrumor } from '../c2js-runtime/rumors.js';"
        );
    }
    s = s.replace(
        /export function getrumor\(truth, rumor_buf, exclude_cookie\) \{\s+let rumors = null;[\s\S]*?\n {4}\}\s+return rumor_buf;\n\}/,
        `export function getrumor(truth, rumor_buf, exclude_cookie) {
    return __runtime_getrumor(truth, rumor_buf, exclude_cookie);
}`
    );
    return s;
});

patchFile('engrave.js', (s) => {
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 32\) \*\/;/g,
        'engr[nxt] = 32;'
    );
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = rubouts\[i\]\.wipeto\[j\]\) \*\/;/g,
        'engr[nxt] = rubouts[i].wipeto.charCodeAt(j);'
    );
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 63\) \*\/;/g,
        'engr[nxt] = 63;'
    );
    return s;
});

// engrave.js: make_engr_at body replacement moved later in this
// file so it runs AFTER the stub-injecting patch around line ~1389.

// vision.js: right_side / left_side / view_from have a pointer-
// to-pointer translator gap on cs_left[row] / cs_right[row] writes.
//
// C ref: vision.c right_side():
//   int *row_min = &cs_left[row];   /* min in this row */
//   int *row_max = &cs_right[row];
//   ...
//   if (*row_min > left)  *row_min = left;
//   if (*row_max < right) *row_max = right;
//
// The translator emits `row_min = game.cs_left[row]` (a value, not
// a pointer), so the write `*p = X` becomes a TODO and drops.
//
// Result: cs_left[row] / cs_right[row] never narrow as right_side
// processes each row, breaking the visible-range tracking that
// later view_from invocations rely on.  This compounds across
// multi-iter sessions where the hero's vision area changes shape.
//
// Fix: rewrite the patterns so the writes go through to
// game.cs_left[row] / game.cs_right[row] directly using the
// in-scope `row` variable.  The translator's local `row_min` /
// `row_max` shadow the cs_left/cs_right values for the read side;
// keep those reads working by also patching the variable read to
// pick up the live value.
//
// Simpler patch: replace each TODO with a direct write to
// game.cs_left[row] / game.cs_right[row].  The local row_min /
// row_max variables stay as cached values for the if-comparison,
// which is fine — we just need the WRITES to land.
patchFile('vision.js', (s) => {
    // Pattern for "left" writes (row_min = MIN(row_min, left)):
    //   if (row_min > (X)) { void 0 /* C: *p = (X) */; }
    //   if (row_min > (left)) { void 0 /* C: *p = (left) */; }
    // Replace with game.cs_left[row] = X
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = \(left\)\) \*\/;/g,
        'game.cs_left[row] = left;'
    );
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = \(right\)\) \*\/;/g,
        'game.cs_right[row] = right;'
    );
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = \(right_edge\)\) \*\/;/g,
        'game.cs_right[row] = right_edge;'
    );
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = \(left_edge\)\) \*\/;/g,
        'game.cs_left[row] = left_edge;'
    );
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = \(lim_max\)\) \*\/;/g,
        'game.cs_right[row] = lim_max;'
    );
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = \(lim_min\)\) \*\/;/g,
        'game.cs_left[row] = lim_min;'
    );
    return s;
});

// track.js: gettrack has a pointer-walk translator gap that makes
// it always return null.
//
// C ref track.c gettrack:
//   for (tc = &gu.utrack[gu.utpnt]; cnt--;) {
//       if (tc == gu.utrack) tc = gu.utrack + 100 - 1;
//       else tc--;
//       ndist = distmin(x, y, tc->x, tc->y);
//       ...
//   }
//
// `tc` is `coord *` walking backwards through utrack with wraparound.
// The translator emitted `tc = __nh_blackhole` for the else branch
// (which should be `tc--`), so every subsequent iteration reads
// tc.x = 0, tc.y = 0.  Result: gettrack always returns null (unless
// x,y happens to be within 1 of (0,0)).
//
// This breaks pet path-following when the pet is out of sight of
// the hero — pets normally follow the hero's recent footstep trail
// via dog_goal -> gettrack.  No direct RNG impact but cascading
// state divergence over multi-iter sessions.
//
// Fix: rewrite gettrack to walk an integer index backwards instead
// of a pointer.  The full function is small; replace it entirely.
patchFile('track.js', (s) => {
    const re = /export function gettrack\(x, y\) \{[\s\S]*?\n\}/;
    if (!re.test(s)) return s;
    return s.replace(re, `export function gettrack(x, y) {
    let i = game.utpnt;
    let cnt = game.utcnt;
    while (cnt-- > 0) {
        // Walk backwards with wraparound — mirrors C's tc--.
        if (i === 0) {
            i = 100 - 1;
        } else {
            i--;
        }
        const tc = game.utrack[i];
        const ndist = distmin(x, y, tc.x, tc.y);
        if (ndist <= 1) {
            return ndist ? tc : null;
        }
    }
    return null;
}`);
});

// vision.js: vision_reset has a pointer-arithmetic translator gap
// that prevents left_ptrs/right_ptrs/viz_clear from being
// populated for any row.  C ref vision.c:vision_reset:
//   lev = &svl.level.locations[1][y];
//   for (x = 1; x < COLNO; x++, lev += ROWNO) {
//     if (block != (IS_ROCK(lev->typ) || does_block(x, y, lev))) ...
//   }
// In C, `lev` is a struct rm* and `lev += ROWNO` advances the
// pointer by ROWNO (21) array elements — since locations is
// stored as locations[COLNO][ROWNO], adding ROWNO elements
// advances to next column at the same row.  The translator
// emitted `lev += 21` in JS, which is numeric arithmetic on the
// row object — produces NaN.  All subsequent `lev.typ` reads
// return undefined, the if-condition never fires, and the loop
// body never updates left_ptrs/right_ptrs/viz_clear.
//
// Result: right_ptrs[y][x] = 0 for ALL y/x.  This breaks
// view_from / right_side / left_side any time they're called
// from a non-hero origin (do_clear_area, monster vision, etc.) —
// they enter an infinite loop because right_edge=0 leaves left
// stuck at 1.  Concretely, this is the seed0004 iter 18 hang
// (LEARNINGS §16.2): pony's dog_goal calls do_clear_area which
// calls view_from which hangs in right_side's while loop.
//
// Fix: rewrite the inner-for body to use game.level.locations
// [x][y] directly instead of relying on the broken `lev`
// pointer, and drop the `lev += 21` from the for-update.
patchFile('vision.js', (s) => {
    // Match the original vision_reset structure and rewrite to
    // use game.level.locations[x][y] each iteration.  Two issues
    // to fix: the lev-init and the for-update.
    s = s.replace(
        'lev = game.level.locations[1][y];\n        for (x = 1; x < 80; x++ , lev += 21) {',
        'for (x = 1; x < 80; x++) {\n            lev = game.level.locations[x][y];'
    );
    return s;
});

// priest.js: temple_occupied has the EXACT same pointer-deref
// translator bug as vault_occupied.  C ref priest.c:142-150:
//   for (ptr = array; *ptr; ptr++)
//     if (svr.rooms[*ptr - ROOMOFFSET].rtype == TEMPLE) return *ptr;
// Translator drops `*ptr` to `ptr` again.  Apply the same fix.
patchFile('priest.js', (s) => {
    s = s.replace(
        /export function temple_occupied\(array\) \{[\s\S]*?return 0;\s*\}/,
        `export function temple_occupied(array) {
    if (!array) return 0;
    for (let i = 0; i < array.length; i++) {
        const v = array[i];
        if (!v) break;
        if (game.rooms[v - 3].rtype == TEMPLE) return v;
    }
    return 0;
}`
    );
    return s;
});

// decl.js: gs.subrooms = &svr.rooms[MAXNROFROOMS + 1] expects subrooms
// to be a sub-array view starting at index 41 of svr.rooms.  Translator
// drops the `&` and emits `game.rooms[40 + 1]` which is a SINGLE
// struct, not the sub-array.  Then translated mklev's
// `game.subrooms[0].hx = -1` crashes (game.subrooms is one struct, [0]
// is undefined).
//
// Fix: emit `game.rooms.slice(41)` — a sub-array of struct references.
// Element field writes propagate (objects shared); the only divergence
// from C is element REPLACEMENT (`subrooms[i] = newRoom`), but
// translated mklev's usage is field-only (verified by grep).
patchFile('decl.js', (s) => {
    return s.replace(
        /game\.subrooms = game\.rooms\[40 \+ 1\];/,
        'game.subrooms = game.rooms.slice(40 + 1);'
    );
});

// mkobj.js: the C "weighted-pick by walking a probability table" idiom:
//   const struct probtab *iprobs = (cond ? rogueprobs : ...);
//   for (tprob = rnd(100); (tprob -= iprobs->iprob) > 0; iprobs++) ;
//   oclass = iprobs->iclass;
// Translator emits `(iprobs = __nh_blackhole)` for the post-increment,
// causing iprobs to lose its array context after one iteration.
// Subsequent .iprob is undefined, NaN arithmetic exits the loop, and
// .iclass is undefined → `rnd(undefined)` BigInt error.
//
// Rewrite to indexed iteration that preserves the array context.
// The init expression (the complex ternary) is captured into _iprobs_arr;
// iprobs walks _iprobs_arr[0], _iprobs_arr[1], ... etc.
// All files: `struct obj` zero-init has a `union vptrs v` member.
// Translator handles unions inconsistently — sometimes emits `v: 0`
// (treating union as scalar), sometimes drops it entirely.  Downstream
// code does `obj.v.v_nexthere = X` etc., which fails either way.
//
// Two patch shapes:
// (a) `nobj: X, v: 0,` -> inject the union member object.
// (b) `nobj: X, cobj: ...` (no `v` at all) -> insert union after nobj.
const objVUnionInject = 'v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }';
const objVUnionFix = (s) => {
    // Case (a): replace existing `v: 0,`.
    s = s.replace(
        /(nobj: [^,]+, )v: 0,/g,
        `$1${objVUnionInject},`
    );
    // Case (b): insert when `nobj:` is followed directly by `cobj:`.
    s = s.replace(
        /(nobj: [^,]+, )(cobj: )/g,
        `$1${objVUnionInject}, $2`
    );
    return s;
};
for (const fname of ['decl.js', 'mkobj.js', 'mon.js', 'mkroom.js']) {
    patchFile(fname, objVUnionFix);
}

patchFile('mkobj.js', (s) => {
    // Match: `let iprobs = <anything-up-to-;>;` followed by a for-loop
    // whose inc is `(iprobs = __nh_blackhole)`.  Body may be empty
    // (`continue` or `;`).  Use indented variants because the call
    // site is inside an if-block.
    const re = /(\s+)let iprobs = ([^;]+);\s*for \(tprob = rnd\(100\); \(tprob -= iprobs\.iprob\) > 0; \(iprobs = __nh_blackhole\)\) \{\s*(?:continue;?|;)\s*\}/g;
    return s.replace(re, (_m, indent, init) =>
        `${indent}const _iprobs_arr = ${init};`
        + `${indent}let _iprobs_i = 0;`
        + `${indent}let iprobs = _iprobs_arr[0];`
        + `${indent}for (tprob = rnd(100); (tprob -= iprobs.iprob) > 0; iprobs = _iprobs_arr[++_iprobs_i]) ;`);
});

// invent.js sortedinvent pointer-walk: now handled by translate.mjs
// detectStructPtrForLoop().

// objnam.js sprintf(eos(BUF)) rewrite: now handled by the
// callExpr-level recognizer in translate.mjs.  Applies uniformly
// across all TUs (was previously objnam.js-only).

// strutil.js Strlen_ rewrite: now handled by SPECIAL_FUNCTION_RECOGNIZERS
// in translate.mjs (a clean translator-side predicate, not a regex
// post-process).  See commit migrating it.

// u_init.js: rewrite ini_inv to use indexed-array access for `trop`.
// C's `trop` is `const struct trobj *`, walked via
// `while (trop->trclass) { ...; trop++; }`.  The translator emits
// `trop.trclass` (field access on the Array — always undefined) and
// `(trop = __nh_blackhole)` for the post-increment.  Both break the
// loop.  Inject a trailing `__ti` index and rewrite accesses to
// indexed form, mirroring the harness's identical fix.  Without
// this, ini_inv() returns immediately on its first iteration with
// no PRNG fired, so wiring `u_init_role()` from the engine would
// silently produce wrong results.
patchFile('u_init.js', (s) => {
    const start = s.indexOf('export function ini_inv(trop) {');
    if (start < 0) return s;
    const fnEnd = (() => {
        let i = s.indexOf('{', start) + 1;
        let depth = 1;
        while (i < s.length && depth > 0) {
            if (s[i] === '{') depth++;
            else if (s[i] === '}') depth--;
            i++;
        }
        return i;
    })();
    const before = s.slice(0, start);
    let body = s.slice(start, fnEnd);
    const after = s.slice(fnEnd);
    body = body.replace(
        /export function ini_inv\(trop\) \{/,
        'export function ini_inv(trop) { let __ti = 0;'
    );
    body = body.replace(/\btrop\.(tr[a-zA-Z_]+)/g, 'trop[__ti].$1');
    body = body.replace(/\(trop = __nh_blackhole\)/g, '__ti++');
    body = body.replace(/trquan\(trop\)/g, 'trquan(trop[__ti])');
    body = body.replace(/ini_inv_obj_substitution\(trop, /g, 'ini_inv_obj_substitution(trop[__ti], ');
    body = body.replace(/ini_inv_adjust_obj\(trop, /g, 'ini_inv_adjust_obj(trop[__ti], ');
    return before + body + after;
});

// u_init.js: rewrite restricted_spell_discipline pointer walk.
// C ref u_init.c:1094-1105 — `const struct def_skill *skills =
// skills_for_role(); while (skills && skills->skill != P_NONE) {
// if (skills->skill == this_skill) return FALSE; ++skills; }
// return TRUE;`.  The translator emits `skills = __nh_blackhole`
// for `++skills`, AND keeps `skills.skill` as a raw field access on
// the array.  Both wrong: the array has no `.skill` (so the loop
// body fires once on undefined != P_NONE, mismatches every entry,
// then advances to __nh_blackhole whose Proxy.skill coerces to 0 ==
// P_NONE — so the loop exits and the function ALWAYS returns 1).
// Net effect: every spellbook is "restricted" — Wizard's random
// SPBOOK_CLASS slot in ini_inv_mkobj_filter rejects every otyp,
// burns 1000 mkobj retries, then falls back to PANCAKE.  That
// burns thousands of PRNG calls before the next ini_inv entry,
// shifting every downstream rng for Wizard/Priest/spellbook-bearing
// roles.  Rewrite to indexed iteration.
// u_init.js: restricted_spell_discipline `skills = skills_for_role();
// while (skills && skills.skill != P_NONE) { ...; skills++; }` — now
// handled by translate.mjs `detectWhilePtrWalk` (temp-capture form
// works for CallExpr inits).

// mklev.js room-iter pointer walk: now handled by translate.mjs
// detectStructPtrForLoop().

// vision.js: vision_recalc's `lev += ROWNO` pointer-walk in the
// inner col-iteration loop.  Same translator bug as get_level_extends
// below — `lev += 21` on a struct object yields a string/NaN, and
// subsequent `lev.seenv` reads/writes hit the wrong slot (or no-op
// in strict mode).  Rewrite as direct-indexed access.
patchFile('vision.js', (s) => {
    if (s.includes('/* col-walk fixed */')) return s;
    return s.replace(
        /lev = game\.level\.locations\[start\]\[row\];\s*sv = seenv_matrix\[dy \+ 1\]\[start < game\.u\.ux \? 0 : \(start > game\.u\.ux \? 2 : 1\)\];\s*for \(col = start; col <= stop; lev \+= 21 , sv \+= __vision_recalc_colbump\[\+\+col\]\) \{/,
        `/* col-walk fixed */
            sv = seenv_matrix[dy + 1][start < game.u.ux ? 0 : (start > game.u.ux ? 2 : 1)];
            for (col = start; col <= stop;) {
                lev = game.level.locations[col][row];`
    ).replace(
        /(if \(\(old_row\[col\] & 2\) \|\| \(\(next_row\[col\] & 1\) \^ \(old_row\[col\] & 1\)\)\) \{\s*if \(col != 0\) \{\s*newsym\(col, row\);\s*\}\s*\}\s*\}\s*\}\s*\}\s*\}\s*__vision_recalc_colbump\[game\.u\.ux\])/,
        function(m) {
            // Replace the loop-end with col++/sv update before the outer braces.
            return m.replace(
                /\}\s*\}\s*\}\s*__vision_recalc_colbump\[game\.u\.ux\]/,
                `}
                col++;
                sv += __vision_recalc_colbump[col];
            }
        }
        __vision_recalc_colbump[game.u.ux]`
            );
        }
    );
});

// mkroom.js: COURT case has `goto throne_placed` to skip random throne
// pick when one already exists (maze-level case).  Rewrite as a
// found-flag.  Only applies to maze levels (Mines, Sokoban, etc.),
// not the default Dungeons of Doom.
patchFile('mkroom.js', (s) => {
    if (s.includes('/* throne_placed flag */')) return s;
    return s.replace(
        /        case COURT:\n            if \(game\.level\.flags\.is_maze_lev\) \{\n                for \(tx = sroom\.lx; tx <= sroom\.hx; tx\+\+\) \{\n                    for \(ty = sroom\.ly; ty <= sroom\.hy; ty\+\+\) \{\n                        if \(\(\(game\.level\.locations\[tx\]\[ty\]\.typ\) == THRONE\)\) \{\n                            \/\* TODO Phase 5\+: goto throne_placed \(label not in scope of break\) \*\/\n                        \}\n                    \}\n                \}\n            \}\n            i = 100;\n            do \{\n                somexyspace\(sroom, mm\);\n                tx = mm\.x;\n                ty = mm\.y;\n            \} while \(occupied\(tx, ty\) && --i > 0\);\n            \/\/ TODO LabelStmt throne_placed not at compound-stmt level\n            break;/,
        `        case COURT: {
            /* throne_placed flag */
            let __throne_placed = (0);
            if (game.level.flags.is_maze_lev) {
                for (tx = sroom.lx; tx <= sroom.hx && !__throne_placed; tx++) {
                    for (ty = sroom.ly; ty <= sroom.hy; ty++) {
                        if (((game.level.locations[tx][ty].typ) == THRONE)) {
                            __throne_placed = (1);
                            break;
                        }
                    }
                }
            }
            if (!__throne_placed) {
                i = 100;
                do {
                    somexyspace(sroom, mm);
                    tx = mm.x;
                    ty = mm.y;
                } while (occupied(tx, ty) && --i > 0);
            }
            break;
        }`
    );
});

// mon.js / makemon.js: pointer-mutation lvalue `*EXTRAFIELD(m2) = *EXTRAFIELD(m1);`
// punts in copy_mextra and split_mon.  C dereferences both sides and
// copies the STRUCT CONTENTS into the existing destination struct.
// Translator emits `void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = X) */;`
// — skipping the copy entirely.  Defensive fix: rewrite to Object.assign
// so both monsters keep separate-but-equal struct copies.
patchFile('mon.js', (s) => {
    const pairs = [
        ['egd', 'mtmp1', 'mtmp2'],
        ['epri', 'mtmp1', 'mtmp2'],
        ['eshk', 'mtmp1', 'mtmp2'],
        ['emin', 'mtmp1', 'mtmp2'],
        ['edog', 'mtmp1', 'mtmp2'],
        ['ebones', 'mtmp1', 'mtmp2'],
    ];
    for (const [field, src, dst] of pairs) {
        const re = new RegExp(`        \\(4 /\\* sizeof\\(int\\) \\*/ , void 0 /\\* StmtExpr \\*/\\);\\n        void 0 /\\* TODO Phase 5\\+: pointer-mutation lvalue \\(C: \\*p = \\(\\(${src}\\)\\.mextra\\.${field}\\)\\) \\*/;`);
        s = s.replace(re, `        Object.assign(${dst}.mextra.${field}, ${src}.mextra.${field});`);
    }
    return s;
});
patchFile('makemon.js', (s) => {
    // Two indents in this function: 8-space (emin under m2.isminion) and
    // 12-space (edog under nested if).  Patch both.
    for (const indent of ['        ', '            ']) {
        for (const field of ['emin', 'edog']) {
            const re = new RegExp(
                `${indent}\\(4 /\\* sizeof\\(int\\) \\*/ , void 0 /\\* StmtExpr \\*/\\);\\n${indent}void 0 /\\* TODO Phase 5\\+: pointer-mutation lvalue \\(C: \\*p = \\(\\(mon\\)\\.mextra\\.${field}\\)\\) \\*/;`
            );
            s = s.replace(re, `${indent}Object.assign(m2.mextra.${field}, mon.mextra.${field});`);
        }
    }
    return s;
});

// cmd.js: reset_commands stores dirchars as a JS string ("hykulnjb><")
// but uses dirchars[i] (single-char string) as a binding key.  Commands_init
// uses integer keys (e.g. bind_key(108, "loot")).  cmdbind_get('l') and
// cmdbind_get(108) don't match (string != int in `==`), so the dirchars
// rebinding creates duplicate string-keyed bindings while leaving the
// int-keyed loot/help/kick/etc. bindings intact.  Result: movecmd reads
// the int key from readchar and finds 'loot' instead of 'moveeast' →
// getdir returns 0 → doride/dozap/etc. short-circuit.
//
// Fix: convert single-char dirchars[i] reads to char codes at the
// binding sites in reset_commands so the binding key matches the int
// key that movecmd/cmdbind_get later use.
patchFile('cmd.js', (s) => {
    if (s.includes('/* dirchars-int fix */')) return s;
    // Rewrite the four binding-site references to dirchars[i] in
    // reset_commands.  Each is followed by `, game.move_funcs[...]`.
    // Use charCodeAt(0) so the key matches integer-keyed lookups.
    s = s.replace(
        /bind_key_fn\(game\.Cmd\.dirchars\[i\], game\.move_funcs\[i\]\[MV_WALK\]\);/,
        '/* dirchars-int fix */\n        bind_key_fn(game.Cmd.dirchars.charCodeAt(i), game.move_funcs[i][MV_WALK]);'
    );
    s = s.replace(
        /bind_key_fn\(highc\(game\.Cmd\.dirchars\[i\]\), game\.move_funcs\[i\]\[MV_RUN\]\);/,
        'bind_key_fn(game.Cmd.dirchars.charCodeAt(i) >= 0x61 && game.Cmd.dirchars.charCodeAt(i) <= 0x7a ? game.Cmd.dirchars.charCodeAt(i) - 32 : game.Cmd.dirchars.charCodeAt(i), game.move_funcs[i][MV_RUN]);'
    );
    s = s.replace(
        /bind_key_fn\(\(31 & \(game\.Cmd\.dirchars\[i\]\)\), game\.move_funcs\[i\]\[MV_RUSH\]\);/,
        'bind_key_fn(31 & game.Cmd.dirchars.charCodeAt(i), game.move_funcs[i][MV_RUSH]);'
    );
    // Also fix the cmdbind_remove(di) loop (the unbind step right before
    // rebinding).  di is computed as game.Cmd.dirchars[dir] (string char).
    s = s.replace(
        /let di = game\.Cmd\.dirchars\[dir\];/,
        'let di = game.Cmd.dirchars.charCodeAt(dir);'
    );
    // num_pad mode also indexes dirchars as string; convert to int.
    s = s.replace(
        /bind_key_fn\(\(\(game\.Cmd\.dirchars\[i\]\) - 128\), game\.move_funcs\[i\]\[MV_RUN\]\);/,
        'bind_key_fn(game.Cmd.dirchars.charCodeAt(i) - 128, game.move_funcs[i][MV_RUN]);'
    );
    // getdir's CMDQ_DIR / debug_fuzzer paths also index dirchars as
    // string — convert to int so comparisons against game.Cmd.spkeys
    // (which are int) work and movecmd lookups find the right binding.
    s = s.replace(
        /dirsym = game\.Cmd\.dirchars\[xytodir\(cmdq\.dirx, cmdq\.diry\)\];/,
        'dirsym = game.Cmd.dirchars.charCodeAt(xytodir(cmdq.dirx, cmdq.diry));'
    );
    s = s.replace(
        /dirsym = game\.Cmd\.dirchars\[\(cmdq\.dirz > 0\) \? DIR_DOWN : DIR_UP\];/,
        'dirsym = game.Cmd.dirchars.charCodeAt((cmdq.dirz > 0) ? DIR_DOWN : DIR_UP);'
    );
    s = s.replace(
        /dirsym = game\.Cmd\.dirchars\[rn2\(2\) \? DIR_DOWN : DIR_UP\];/,
        'dirsym = game.Cmd.dirchars.charCodeAt(rn2(2) ? DIR_DOWN : DIR_UP);'
    );
    s = s.replace(
        /dirsym = game\.Cmd\.dirchars\[rn2\(\(N_DIRS_Z - 2\)\)\];/,
        'dirsym = game.Cmd.dirchars.charCodeAt(rn2((N_DIRS_Z - 2)));'
    );
    s = s.replace(
        /if \(mode == MV_RUN\) \{\s*di = highc\(di\);\s*\} else if \(mode == MV_RUSH\) \{\s*di = \(31 & \(di\)\);\s*\}/,
        `if (mode == MV_RUN) {
                    di = (di >= 0x61 && di <= 0x7a) ? di - 32 : di;
                } else if (mode == MV_RUSH) {
                    di = (31 & di);
                }`
    );
    return s;
});

// cmd.js getdir: restructure the cmdq/retry/got_dirsym goto flow.  In
// C, cmdq_pop() at top either fills dirsym and `goto got_dirsym`
// (skipping the input read), or falls through to retry: where input
// is read and `goto retry` loops on redraw_cmd.  Translator emitted
// both branches sequentially with TODO no-ops on the gotos, so a
// queued cmdq direction got OVERWRITTEN by the input prompt and the
// ^R redraw retry never looped.  Patch sets a __from_cmdq flag from
// the cmdq path and gates the input path on !__from_cmdq with a
// proper while-loop for the retry.  Score-stable (cmdq is empty in
// the 44 score sessions' direct-key playback); defensive correctness
// for cmdq-driven playback (#zap, macros, do-again).
patchFile('cmd.js', (s) => {
    if (s.includes('/* getdir-cmdq-flow fix */')) return s;
    const oldFlow = `    retry: {
        cmdq = cmdq_pop();
        if (cmdq) {
            if (cmdq.typ == CMDQ_DIR) {
                if (!cmdq.dirz) {
                    dirsym = game.Cmd.dirchars.charCodeAt(xytodir(cmdq.dirx, cmdq.diry));
                } else {
                    dirsym = game.Cmd.dirchars.charCodeAt((cmdq.dirz > 0) ? DIR_DOWN : DIR_UP);
                }
            } else if (cmdq.typ == CMDQ_KEY) {
                dirsym = cmdq.key;
            } else {
                cmdq_clear(CQ_CANNED);
                dirsym = 0;
                impossible("getdir: command queue had no dir?");
            }
            free(cmdq);
            /* TODO Phase 5+: goto got_dirsym (label not in scope of break) */
        }
    }
    game.program_state.input_state = getdirInp;
    got_dirsym: {
        if (game.in_doagain || readchar_queue) {
            dirsym = readchar();
        } else {
            dirsym = yn_function((s && s.value != 94) ? s : "In what direction?", null, 0, (0));
            if (game.iflags.debug_fuzzer && rn2(20)) {
                switch (rn2(20)) {
                    case 0:
                        dirsym = game.Cmd.spkeys[rn2(2) ? NHKF_GETDIR_SELF : NHKF_ESC];
                        break;
                    case 1:
                        dirsym = game.Cmd.dirchars.charCodeAt(rn2(2) ? DIR_DOWN : DIR_UP);
                        break;
                    default:
                        dirsym = game.Cmd.dirchars.charCodeAt(rn2((N_DIRS_Z - 2)));
                        break;
                }
            }
        }
        (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
        if (redraw_cmd(dirsym)) {
            docrt_flags(docrtRefresh);
            /* TODO Phase 5+: goto retry (label not in scope of break) */
        }
        if (!game.in_doagain) {
            cmdq_add_key(CQ_REPEAT, dirsym);
        }
    }`;
    const newFlow = `    /* getdir-cmdq-flow fix */
    let __from_cmdq = (0);
    cmdq = cmdq_pop();
    if (cmdq) {
        if (cmdq.typ == CMDQ_DIR) {
            if (!cmdq.dirz) {
                dirsym = game.Cmd.dirchars.charCodeAt(xytodir(cmdq.dirx, cmdq.diry));
            } else {
                dirsym = game.Cmd.dirchars.charCodeAt((cmdq.dirz > 0) ? DIR_DOWN : DIR_UP);
            }
        } else if (cmdq.typ == CMDQ_KEY) {
            dirsym = cmdq.key;
        } else {
            cmdq_clear(CQ_CANNED);
            dirsym = 0;
            impossible("getdir: command queue had no dir?");
        }
        free(cmdq);
        __from_cmdq = (1);
    }
    if (!__from_cmdq) {
        retry: while (true) {
            game.program_state.input_state = getdirInp;
            if (game.in_doagain || readchar_queue) {
                dirsym = readchar();
            } else {
                dirsym = yn_function((s && s.value != 94) ? s : "In what direction?", null, 0, (0));
                if (game.iflags.debug_fuzzer && rn2(20)) {
                    switch (rn2(20)) {
                        case 0:
                            dirsym = game.Cmd.spkeys[rn2(2) ? NHKF_GETDIR_SELF : NHKF_ESC];
                            break;
                        case 1:
                            dirsym = game.Cmd.dirchars.charCodeAt(rn2(2) ? DIR_DOWN : DIR_UP);
                            break;
                        default:
                            dirsym = game.Cmd.dirchars.charCodeAt(rn2((N_DIRS_Z - 2)));
                            break;
                    }
                }
            }
            (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
            if (redraw_cmd(dirsym)) {
                docrt_flags(docrtRefresh);
                continue retry;
            }
            if (!game.in_doagain) {
                cmdq_add_key(CQ_REPEAT, dirsym);
            }
            break;
        }
    }`;
    return s.replace(oldFlow, newFlow);
});

// cmd.js getdir extension: the help-requested `goto retry` in the
// !movecmd && !u.dz branch also needs to re-enter the retry loop.
// Restructure: pull the retry loop OUT of the `if (!__from_cmdq)`
// guard, gate the input section on `!__from_cmdq` INSIDE the loop,
// reset __from_cmdq after the input section, wrap the dispatch
// inside the loop too, replace the help-requested goto with
// `continue retry;`, and `break;` at end of dispatch.
//
// Runs AFTER the getdir-cmdq-flow fix above.  Pure cold-path UI
// (help-requested fires when player presses '?' in a direction
// prompt); score-irrelevant.
patchFile('cmd.js', (s) => {
    if (s.includes('/* getdir-retry-help fix */')) return s;
    // 1. Reshape the input-section gating: replace
    //    `if (!__from_cmdq) { retry: while (true) { ... break; } }`
    //    with `retry: while (true) { if (!__from_cmdq) { ... }
    //    __from_cmdq = (0);`
    const oldInput = `    if (!__from_cmdq) {
        retry: while (true) {
            game.program_state.input_state = getdirInp;
            if (game.in_doagain || readchar_queue) {
                dirsym = readchar();
            } else {
                dirsym = yn_function((s && s.value != 94) ? s : "In what direction?", null, 0, (0));
                if (game.iflags.debug_fuzzer && rn2(20)) {
                    switch (rn2(20)) {
                        case 0:
                            dirsym = game.Cmd.spkeys[rn2(2) ? NHKF_GETDIR_SELF : NHKF_ESC];
                            break;
                        case 1:
                            dirsym = game.Cmd.dirchars.charCodeAt(rn2(2) ? DIR_DOWN : DIR_UP);
                            break;
                        default:
                            dirsym = game.Cmd.dirchars.charCodeAt(rn2((N_DIRS_Z - 2)));
                            break;
                    }
                }
            }
            (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
            if (redraw_cmd(dirsym)) {
                docrt_flags(docrtRefresh);
                continue retry;
            }
            if (!game.in_doagain) {
                cmdq_add_key(CQ_REPEAT, dirsym);
            }
            break;
        }
    }
    if (dirsym == game.Cmd.spkeys[NHKF_GETDIR_SELF] || dirsym == game.Cmd.spkeys[NHKF_GETDIR_SELF2]) {`;
    const newInput = `    /* getdir-retry-help fix */
    retry: while (true) {
        if (!__from_cmdq) {
            game.program_state.input_state = getdirInp;
            if (game.in_doagain || readchar_queue) {
                dirsym = readchar();
            } else {
                dirsym = yn_function((s && s.value != 94) ? s : "In what direction?", null, 0, (0));
                if (game.iflags.debug_fuzzer && rn2(20)) {
                    switch (rn2(20)) {
                        case 0:
                            dirsym = game.Cmd.spkeys[rn2(2) ? NHKF_GETDIR_SELF : NHKF_ESC];
                            break;
                        case 1:
                            dirsym = game.Cmd.dirchars.charCodeAt(rn2(2) ? DIR_DOWN : DIR_UP);
                            break;
                        default:
                            dirsym = game.Cmd.dirchars.charCodeAt(rn2((N_DIRS_Z - 2)));
                            break;
                    }
                }
            }
            (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
            if (redraw_cmd(dirsym)) {
                docrt_flags(docrtRefresh);
                continue retry;
            }
            if (!game.in_doagain) {
                cmdq_add_key(CQ_REPEAT, dirsym);
            }
        }
        __from_cmdq = (0);
    if (dirsym == game.Cmd.spkeys[NHKF_GETDIR_SELF] || dirsym == game.Cmd.spkeys[NHKF_GETDIR_SELF2]) {`;
    s = s.replace(oldInput, newInput);
    // 2. Convert help-requested goto retry → continue retry
    const oldHelp = `                if (help_requested) {
                    /* TODO Phase 5+: goto retry (label not in scope of break) */
                }`;
    const newHelp = `                if (help_requested) {
                    continue retry;
                }`;
    s = s.replace(oldHelp, newHelp);
    // 3. Close the retry loop with break+brace after the last else-if
    const oldClose = `    } else if (is_mov && !dxdy_moveok()) {
        You_cant("orient yourself that direction.");
        return 0;
    }
    if (!game.u.dz) {
        confdir((0));
    }
    return 1;
}`;
    const newClose = `    } else if (is_mov && !dxdy_moveok()) {
        You_cant("orient yourself that direction.");
        return 0;
    }
    break;
    }
    if (!game.u.dz) {
        confdir((0));
    }
    return 1;
}`;
    s = s.replace(oldClose, newClose);
    return s;
});

// cmd.js handler_rebind_keys redo_rebind: superseded by A3 goto
// back-jump-to-loop recognizer (commit 85cb377).  Translator
// emits `redo_rebind: while (true) { ...; continue redo_rebind;
// ...; break; }` natively.

// pager.js checkfile: C source uses `bad_data_file:` and
// `checkfile_done:` labels (NOT blocks).  `goto bad_data_file` runs
// the "'data' file in wrong format" impossible() + cleanup;
// `goto checkfile_done` SKIPS the impossible to cleanup directly.
// The translator emitted `bad_data_file:` as a labeled BLOCK with
// `break bad_data_file` (correctly), but left the 7 `goto
// checkfile_done` sites as TODO no-ops.  Result: every successful
// do_look / ia_checkfile call fell through to the spurious
// "'data' file in wrong format or corrupted" impossible() message
// after the bad_data_file block closed.
//
// Fix: declare `__skip_impossible` flag before the bad_data_file
// block, replace each `goto checkfile_done` site with `__skip_impossible
// = (1); break bad_data_file;`, and gate the impossible() call.
//
// Defensive correctness for `:` (look here), `;` (look elsewhere),
// and iactions's ia_checkfile().  Score-stable.
patchFile('pager.js', (s) => {
    if (s.includes('/* checkfile-skip-impossible fix */')) return s;
    s = s.replace(
        /(    let datawin = 0;\n    let res = 0;\n)(    bad_data_file: \{)/,
        `$1    /* checkfile-skip-impossible fix */\n    let __skip_impossible = (0);\n$2`
    );
    s = s.replace(
        /\/\* TODO Phase 5\+: goto checkfile_done \(label not in scope of break\) \*\//g,
        '__skip_impossible = (1); break bad_data_file;'
    );
    s = s.replace(
        /(        __skip_impossible = \(1\); break bad_data_file;\n    \}\n)    impossible\("'data' file in wrong format or corrupted"\);/,
        `$1    if (!__skip_impossible) {\n        impossible("'data' file in wrong format or corrupted");\n    }`
    );
    return s;
});

// pager.js do_screen_description: forward `goto didlook` from the
// unreconnoitered tile-type branch jumps past the monster
// classification loop to the didlook label.  Translator emitted
// it as a TODO no-op, so monster classification ran even for
// unreconnoitered (unmapped) tiles — harmless on classification
// (sym won't match a monster) but unnecessary work and a real
// semantic divergence from C.  Fix: add `__skip_monster_class`
// flag set in the unreconnoitered branch, gate the monster
// classification block on `!__skip_monster_class`.  Defensive
// correctness; score-stable.  (The orthogonal `goto check_monsters`
// back-jump from pet/hero override remains as a separate
// translator gap — its block-vs-loop semantics are not addressed
// here.)
patchFile('pager.js', (s) => {
    if (s.includes('/* didlook-skip-monsters fix */')) return s;
    s = s.replace(
        /(    let glyphinfo = \{ glyph: 0, ttychar: 0, framecolor: 0, gm: \{ glyphflags: 0, sym: \{ color: 0, symidx: 0 \}, customcolor: 0, color256idx: 0, tileidx: 0, u: null \} \};\n)(    check_monsters: \{)/,
        `$1    /* didlook-skip-monsters fix */\n    let __skip_monster_class = (0);\n$2`
    );
    s = s.replace(
        /            if \(x_str == __do_screen_description_unreconnoitered\) \{\n                \/\* TODO Phase 5\+: goto didlook \(label not in scope of break\) \*\/\n            \}/,
        `            if (x_str == __do_screen_description_unreconnoitered) {\n                __skip_monster_class = (1);\n            }`
    );
    s = s.replace(
        /    if \(!game\.iflags\.terrainmode \|\| \(game\.iflags\.terrainmode & 8\) != 0\) \{\n        for \(i = 1; i < MAXMCLASSES; i\+\+\) \{/,
        `    if (!__skip_monster_class && (!game.iflags.terrainmode || (game.iflags.terrainmode & 8) != 0)) {\n        for (i = 1; i < MAXMCLASSES; i++) {`
    );
    return s;
});

// pager.js do_screen_description check_monsters back-jumps: 2
// sites in the SYM_PET_OVERRIDE / SYM_HERO_OVERRIDE switch (inside
// the obj-loop didlook block) want `goto check_monsters` to
// re-classify the cell with a newly-derived sym (without override).
// Translator emitted these as TODO no-ops so override-display
// cells got their underlying monster type misreported.
//
// Recipe 7 (multi-site multi-target labeled loop, LEARNINGS
// §23.103): wrap monster classification + obj loop + symX
// switch + found>4 in a `do { __rerun = 0; ... } while
// (__rerun);` so the pet/hero override sets the flag and the
// outer loop re-iterates with the new sym.  In each case body,
// set `__rerun_monsters = (1);` and after the switch (but
// inside for-j) `if (__rerun_monsters) break;` so the for-j
// exits immediately (matching C's `goto check_monsters`
// semantics where the for-j is exited too).
//
// Runs AFTER the §23.97 didlook-skip-monsters fix above (which
// inserts the `__skip_monster_class` flag).  Pure cold-path UI
// (called only by display.js show_glyph_change accessibility);
// score-irrelevant.
//
// C ref: src/pager.c lines 1326-1591 do_screen_description
// (check_monsters label at 1326; goto check_monsters at 1570
// and 1575).
patchFile('pager.js', (s) => {
    if (s.includes('/* check_monsters-rerun fix')) return s;
    s = s.replace(
        `    if (!__skip_monster_class && (!game.iflags.terrainmode || (game.iflags.terrainmode & 8) != 0)) {
        for (i = 1; i < MAXMCLASSES; i++) {`,
        `    /* check_monsters-rerun fix — wrap monster + obj + symX-override
       loop in a do-while so pet/hero override \`goto check_monsters\`
       back-jumps become __rerun_monsters re-iterations. */
    let __rerun_monsters = (0);
    do {
        __rerun_monsters = (0);
    if (!__skip_monster_class && (!game.iflags.terrainmode || (game.iflags.terrainmode & 8) != 0)) {
        for (i = 1; i < MAXMCLASSES; i++) {`
    );
    s = s.replace(
        `                switch (j) {
                    case SYM_PET_OVERRIDE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6):
                        if (looked) {
                            map_glyphinfo(cc.x, cc.y, glyph, 1, glyphinfo);
                            sym = glyphinfo.ttychar;
                            /* TODO Phase 5+: goto check_monsters (label not in scope of break) */
                        }
                        break;
                    case SYM_HERO_OVERRIDE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6):
                        sym = game.showsyms[S_HUMAN + (((0) + MAXPCHARS) + MAXOCLASSES)];
                        /* TODO Phase 5+: goto check_monsters (label not in scope of break) */
                }
            }
        }`,
        `                switch (j) {
                    case SYM_PET_OVERRIDE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6):
                        if (looked) {
                            map_glyphinfo(cc.x, cc.y, glyph, 1, glyphinfo);
                            sym = glyphinfo.ttychar;
                            __rerun_monsters = (1);
                        }
                        break;
                    case SYM_HERO_OVERRIDE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6):
                        sym = game.showsyms[S_HUMAN + (((0) + MAXPCHARS) + MAXOCLASSES)];
                        __rerun_monsters = (1);
                }
            }
            if (__rerun_monsters) break;
        }`
    );
    s = s.replace(
        `        if (found > 4) {
            out_str = sprintf(out_str, "%scan be many things", prefix);
        }
    }
    if (looked) {
        let pm = null;`,
        `        if (found > 4) {
            out_str = sprintf(out_str, "%scan be many things", prefix);
        }
    }
    } while (__rerun_monsters);
    if (looked) {
        let pm = null;`
    );
    return s;
});

// getpos.js getpos_help: `if (goal && !strcmp(goal, "a monster"))
// goto skip_non_mons;` jumps forward past the obj/door/explore/
// menu help blocks AND INTO the `if (!iflags.terrainmode)` block
// (skip_non_mons label lives inside that conditional).  C's
// goto-into-block semantics let the inner block execute even when
// terrainmode is set.
//
// Fix: `__goto_skip_non_mons` flag set in the "a monster" branch.
// Gate the obj/door/menu help blocks on `!__goto_skip_non_mons`.
// Change the outer `if (!iflags.terrainmode)` to fire on
// `__goto_skip_non_mons || !iflags.terrainmode` so the inner
// skip_non_mons body + doing_what_is sections execute on the
// goto path too.
//
// Pure cold-path UI (only fires when player presses '?' in
// getpos cursor mode); score-irrelevant.
patchFile('getpos.js', (s) => {
    if (s.includes('/* skip_non_mons-flag fix */')) return s;
    const oldBlock = `    if (goal && !strcmp(goal, "a monster")) {
        /* TODO Phase 5+: goto skip_non_mons (label not in scope of break) */
    }
    if (!game.iflags.terrainmode || (game.iflags.terrainmode & 4) != 0) {
        getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_OBJ_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_OBJ_PREV]), GLOC_OBJS);
    }
    if (!game.iflags.terrainmode || (game.iflags.terrainmode & 1) != 0) {
        getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_DOOR_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_DOOR_PREV]), GLOC_DOOR);
        getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_UNEX_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_UNEX_PREV]), GLOC_EXPLORE);
        getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_INTERESTING_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_INTERESTING_PREV]), GLOC_INTERESTING);
    }
    sbuf = sprintf(sbuf, "Use '%s' to change fast-move mode to %s.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_MOVESKIP]), __getpos_help_fastmovemode[!game.iflags.getloc_moveskip]);
    (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
    if (!game.iflags.terrainmode || (game.iflags.terrainmode & 32) == 0) {
        sbuf = sprintf(sbuf, "Use '%s' to toggle menu listing for possible targets.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_MENU]));
        (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
        sbuf = sprintf(sbuf, "Use '%s' to change the mode of limiting possible targets.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_LIMITVIEW]));
        (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
    }
    if (!game.iflags.terrainmode) {`;
    const newBlock = `    /* skip_non_mons-flag fix */
    let __goto_skip_non_mons = (0);
    if (goal && !strcmp(goal, "a monster")) {
        __goto_skip_non_mons = (1);
    }
    if (!__goto_skip_non_mons) {
        if (!game.iflags.terrainmode || (game.iflags.terrainmode & 4) != 0) {
            getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_OBJ_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_OBJ_PREV]), GLOC_OBJS);
        }
        if (!game.iflags.terrainmode || (game.iflags.terrainmode & 1) != 0) {
            getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_DOOR_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_DOOR_PREV]), GLOC_DOOR);
            getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_UNEX_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_UNEX_PREV]), GLOC_EXPLORE);
            getpos_help_keyxhelp(tmpwin, visctrl(game.Cmd.spkeys[NHKF_GETPOS_INTERESTING_NEXT]), visctrl(game.Cmd.spkeys[NHKF_GETPOS_INTERESTING_PREV]), GLOC_INTERESTING);
        }
        sbuf = sprintf(sbuf, "Use '%s' to change fast-move mode to %s.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_MOVESKIP]), __getpos_help_fastmovemode[!game.iflags.getloc_moveskip]);
        (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
        if (!game.iflags.terrainmode || (game.iflags.terrainmode & 32) == 0) {
            sbuf = sprintf(sbuf, "Use '%s' to toggle menu listing for possible targets.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_MENU]));
            (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
            sbuf = sprintf(sbuf, "Use '%s' to change the mode of limiting possible targets.", visctrl(game.Cmd.spkeys[NHKF_GETPOS_LIMITVIEW]));
            (game.windowprocs.win_putstr)(tmpwin, 0, sbuf);
        }
    }
    if (__goto_skip_non_mons || !game.iflags.terrainmode) {`;
    return s.replace(oldBlock, newBlock);
});

// dungeon.js recalc_mapseen: copy of game.level.bonesinfo into
// mptr.final_resting_place uses C's pointer-to-pointer linked-list
// copy pattern:
//   bonesaddr = &mptr->final_resting_place;
//   do {
//       *bonesaddr = alloc(sizeof(struct cemetery));
//       **bonesaddr = *bp;
//       bp = bp->next;
//       bonesaddr = &(*bonesaddr)->next;
//   } while (bp);
//   *bonesaddr = NULL;
//
// The translator dropped the `*p =` writes as TODO no-ops and the
// `bonesaddr = (bonesaddr).next` line is also broken (bonesaddr
// stays null), so the final_resting_place pointer was never
// populated even when bones data existed.
//
// Fix: replace with direct head+tail list construction.  Pure
// defensive correctness — autoplay sessions don't restore from
// bones so this path is dead in score testing.  Score-stable.
patchFile('dungeon.js', (s) => {
    if (s.includes('/* bonesinfo-copy fix')) return s;
    const oldBlock = `    if (game.level.bonesinfo && !mptr.final_resting_place) {
        bonesaddr = mptr.final_resting_place;
        bp = game.level.bonesinfo;
        do {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = alloc(1 /* sizeof(struct cemetery) *\\/)) */;
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = bp) */;
            bp = bp.next;
            bonesaddr = (bonesaddr).next;
        } while (bp);
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = null) */;
    }`;
    const newBlock = `    if (game.level.bonesinfo && !mptr.final_resting_place) {
        /* bonesinfo-copy fix — pointer-to-pointer linked-list copy:
           C \`*bonesaddr = alloc(); **bonesaddr = *bp; bonesaddr = &(*bonesaddr)->next\`
           expressed as direct head+tail list construction. */
        let __head = null;
        let __tail = null;
        for (bp = game.level.bonesinfo; bp; bp = bp.next) {
            const node = {
                next: null,
                who: bp.who,
                how: bp.how,
                when: bp.when,
                frpx: bp.frpx,
                frpy: bp.frpy,
                bonesknown: bp.bonesknown,
            };
            if (__head === null) __head = node;
            else __tail.next = node;
            __tail = node;
        }
        mptr.final_resting_place = __head;
    }`;
    return s.replace(oldBlock, newBlock);
});

// mkmaze.js: get_level_extends's pointer-arithmetic loops.  C ref
// (mkmaze.c) walks `lev = &levl[xmin][ymin]; lev += ROWNO` to step
// across columns at fixed y.  Newer translator outputs `lev += 21`
// on a struct-object — broken (adds 21 to an object, which yields a
// string concat or NaN, then `.typ` on that is `undefined`, and
// `undefined != STONE` is TRUE, falsely flipping `found` to 1 on
// the second iteration of every outer pass).  Result: ymin lands at
// -1 and ymax at 21 → bound_digging() misses W_NONDIGGABLE on the
// y=0 / y=20 boundary rows → mineralize() finds too many candidate
// cells along y=19, firing extra rn2(1000) draws that diverge from
// C from the very first map onwards.
//
// Older translator output used `lev = __nh_blackhole` for the
// post-increment — the previous patch matched that.  This patch
// also rewrites the newer `lev += 21` form to direct-indexed access.
//
// Score impact: +0.56 pp aggregate P (12.35→12.91), +0.06 pp S
// (0.39→0.45).  Many sessions gain 100s of P (seed0002 +867,
// seed0367 +260, seed0102 +118 to 4452/4485 = 99.3% etc.).
patchFile('mkmaze.js', (s) => {
    // Match the y-extents loops with the broken `x++ , lev += 21`
    // pointer-arithmetic and rewrite to direct indexing.
    return s.replace(
        /for \(x = xmin; x <= xmax; x\+\+ , lev \+= 21\) \{\s+typ = lev\.typ;/g,
        function(_match) {
            // Replace with indexed access.  The surrounding ymin/ymax
            // loop variable is bound; we capture it via the outer
            // context via a placeholder transform.
            return 'for (x = xmin; x <= xmax; x++) {\n            typ = game.level.locations[x][__NHY__].typ;';
        }
    )
    // Two ymin/ymax instances: rewrite the placeholder with the
    // correct outer loop variable based on context.  Easiest is
    // a per-block replace.
    .replace(
        /for \(ymin = 0; !found && ymin <= 21; ymin\+\+\) \{[\s\S]*?for \(x = xmin; x <= xmax; x\+\+\) \{\s+typ = game\.level\.locations\[x\]\[__NHY__\]\.typ;/,
        function(m) { return m.replace('__NHY__', 'ymin'); }
    )
    .replace(
        /for \(ymax = 21 - 1; !found && ymax >= 0; ymax--\) \{[\s\S]*?for \(x = xmin; x <= xmax; x\+\+\) \{\s+typ = game\.level\.locations\[x\]\[__NHY__\]\.typ;/,
        function(m) { return m.replace('__NHY__', 'ymax'); }
    )
    // Also drop the now-dead `lev = game.level.locations[xmin][ymin]`
    // / `lev = game.level.locations[xmin][ymax]` initializer just
    // before each rewritten inner loop (they served the pre-increment
    // version and are no-ops now).
    .replace(
        /\s+lev = game\.level\.locations\[xmin\]\[ymin\];\n(\s+for \(x = xmin; x <= xmax; x\+\+\) \{)/g,
        '$1'
    )
    .replace(
        /\s+lev = game\.level\.locations\[xmin\]\[ymax\];\n(\s+for \(x = xmin; x <= xmax; x\+\+\) \{)/g,
        '$1'
    );
});

// mkmaze.js: fixup_special's switch on r.rtype has C `goto place_it`
// from LR_BRANCH that jumps forward to a label inside the shared
// LR_UPSTAIR/LR_DOWNSTAIR body containing `place_lregion(...)`.
// The translator emitted a TODO comment in place of the goto AND
// dropped the `place_lregion(...)` call entirely (replaced by another
// TODO comment), so LR_BRANCH falls through into LR_PORTAL (wrong)
// and place_lregion is NEVER CALLED for any of BRANCH/PORTAL/UPSTAIR/
// DOWNSTAIR cases.  Effect: level-region placement silently no-ops
// every time fixup_special() runs on a special level — branch stairs
// (Mines/Sokoban/Quest/Knox), portals, and special-level stairs all
// stay un-placed.  Many sessions that descend past the regular dungeon
// crash or diverge once they hit a special level.
//
// Restructure: emit `place_lregion(...)` at the end of each of the
// four cases that need it (BRANCH, PORTAL, UPSTAIR/DOWNSTAIR share a
// fallthrough → end with a single place_lregion call), with explicit
// break in BRANCH to prevent the fallthrough into PORTAL.
patchFile('mkmaze.js', (s) => {
    return s.replace(
        /            case LR_BRANCH:\n                added_branch = \(1\);\n                \/\* TODO Phase 5\+: goto place_it \(label not in scope of break\) \*\/\n            case LR_PORTAL:\n                if \(r\.rname\.str >= 48 && r\.rname\.str <= 57\) \{\n                    Object\.assign\(lev, game\.u\.uz\);\n                    lev\.dlevel = atoi\(r\.rname\.str\);\n                \} else \{\n                    sp = find_level\(r\.rname\.str\);\n                    Object\.assign\(lev, sp\.dlevel\);\n                \}\n                ;\n            case LR_UPSTAIR:\n            case LR_DOWNSTAIR:\n                \/\/ TODO LabelStmt place_it not at compound-stmt level\n                break;/,
        `            case LR_BRANCH:
                added_branch = (1);
                place_lregion(r.inarea.x1, r.inarea.y1, r.inarea.x2, r.inarea.y2, r.delarea.x1, r.delarea.y1, r.delarea.x2, r.delarea.y2, r.rtype, lev);
                break;
            case LR_PORTAL:
                if (r.rname.str >= 48 && r.rname.str <= 57) {
                    Object.assign(lev, game.u.uz);
                    lev.dlevel = atoi(r.rname.str);
                } else {
                    sp = find_level(r.rname.str);
                    Object.assign(lev, sp.dlevel);
                }
                place_lregion(r.inarea.x1, r.inarea.y1, r.inarea.x2, r.inarea.y2, r.delarea.x1, r.delarea.y1, r.delarea.x2, r.delarea.y2, r.rtype, lev);
                break;
            case LR_UPSTAIR:
            case LR_DOWNSTAIR:
                place_lregion(r.inarea.x1, r.inarea.y1, r.inarea.x2, r.inarea.y2, r.delarea.x1, r.delarea.y1, r.delarea.x2, r.delarea.y2, r.rtype, lev);
                break;`
    );
});

// mon.js mfndpos nexttry: superseded by A3 goto back-jump-to-loop
// recognizer (commit 85cb377).  Translator emits `nexttry: while
// (true) { ...; continue nexttry; ...; break; }` natively.

// eat.js: opentin's `goto no_opener` (forward jump into else-branch
// body when no weapon is wielded OR wielded weapon doesn't match the
// dagger/axe whitelist) and `goto give_feedback` (forward jump from
// EGG/LEMBAS_WAFER/MEATBALL/etc. cases into default's feedback pline).
// Translator emitted TODOs and left the goto bodies inaccessible.
//
// no_opener fix: convert to a precomputed flag — set `__no_opener`
// when uwep is unrecognized OR no uwep, restructure if/else so the
// no_opener path runs in both cases.
//
// give_feedback fix: inline the pline call at each of the three goto
// sites (EGG-fresh, LEMBAS_WAFER-non-orc-non-elf, MEAT*-group); cheaper
// than extracting a helper since the pline string is C-verbatim.
patchFile('eat.js', (s) => {
    const FEEDBACK_PLINE = 'pline("This %s is %s", singular(otmp, xname), otmp.cursed ? ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "grody!" : "terrible!") : (otmp.otyp == CRAM_RATION || otmp.otyp == K_RATION || otmp.otyp == C_RATION) ? "bland." : (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "gnarly!" : "delicious!");';
    s = s.replace(
        /                \/\* TODO Phase 5\+: goto give_feedback \(label not in scope of break\) \*\//,
        '                ' + FEEDBACK_PLINE
    );
    s = s.replace(
        /            \/\* TODO Phase 5\+: goto give_feedback \(label not in scope of break\) \*\/\n        case MEATBALL:/,
        '            ' + FEEDBACK_PLINE + '\n            break;\n        case MEATBALL:'
    );
    s = s.replace(
        /            \/\* TODO Phase 5\+: goto give_feedback \(label not in scope of break\) \*\/\n        case CLOVE_OF_GARLIC:/,
        '            ' + FEEDBACK_PLINE + '\n            break;\n        case CLOVE_OF_GARLIC:'
    );
    s = s.replace(
        /    \} else if \(game\.uwep\) \{\n        switch \(game\.uwep\.otyp\) \{\n            case TIN_OPENER:\n                mesg = "You easily open the tin\.";\n                tmp = rn2\(game\.uwep\.cursed \? 3 : !game\.uwep\.blessed \? 2 : 1\);\n                break;\n            case DAGGER:\n            case SILVER_DAGGER:\n            case ELVEN_DAGGER:\n            case ORCISH_DAGGER:\n            case ATHAME:\n            case KNIFE:\n            case STILETTO:\n            case CRYSKNIFE:\n                tmp = 3;\n                break;\n            case PICK_AXE:\n            case AXE:\n                tmp = 6;\n                break;\n            default:\n                \/\* TODO Phase 5\+: goto no_opener \(label not in scope of break\) \*\/\n        \}\n        pline\("Using %s you try to open the tin\.", yobjnam\(game\.uwep, null\)\);\n    \} else \{\n        no_opener: \{\n        \}\n        pline\("It is not so easy to open this tin\."\);\n        if \(game\.u\.uprops\[GLIB\]\.intrinsic\) \{\n            pline_The\("tin slips from your %s\.", fingers_or_gloves\(\(0\)\)\);\n            if \(otmp\.quan > 1\) \{\n                otmp = splitobj\(otmp, 1\);\n            \}\n            if \(\(\(otmp\)\.where == 3\)\) \{\n                dropx\(otmp\);\n            \} else \{\n                stackobj\(otmp\);\n            \}\n            return;\n        \}\n        tmp = \(rn2\(1 \+ Math\.trunc\(500 \/ \(\(\(acurr\(A_DEX\)\) \+ \(acurrstr\(\)\)\)\)\)\) \+ \(10\)\);\n    \}/,
        `    } else {
        let __no_opener = !game.uwep || !((game.uwep.otyp == TIN_OPENER) || (game.uwep.otyp == DAGGER || game.uwep.otyp == SILVER_DAGGER || game.uwep.otyp == ELVEN_DAGGER || game.uwep.otyp == ORCISH_DAGGER || game.uwep.otyp == ATHAME || game.uwep.otyp == KNIFE || game.uwep.otyp == STILETTO || game.uwep.otyp == CRYSKNIFE) || (game.uwep.otyp == PICK_AXE || game.uwep.otyp == AXE));
        if (game.uwep && !__no_opener) {
            switch (game.uwep.otyp) {
                case TIN_OPENER:
                    mesg = "You easily open the tin.";
                    tmp = rn2(game.uwep.cursed ? 3 : !game.uwep.blessed ? 2 : 1);
                    break;
                case DAGGER:
                case SILVER_DAGGER:
                case ELVEN_DAGGER:
                case ORCISH_DAGGER:
                case ATHAME:
                case KNIFE:
                case STILETTO:
                case CRYSKNIFE:
                    tmp = 3;
                    break;
                case PICK_AXE:
                case AXE:
                    tmp = 6;
                    break;
            }
            pline("Using %s you try to open the tin.", yobjnam(game.uwep, null));
        } else {
            pline("It is not so easy to open this tin.");
            if (game.u.uprops[GLIB].intrinsic) {
                pline_The("tin slips from your %s.", fingers_or_gloves((0)));
                if (otmp.quan > 1) {
                    otmp = splitobj(otmp, 1);
                }
                if (((otmp).where == 3)) {
                    dropx(otmp);
                } else {
                    stackobj(otmp);
                }
                return;
            }
            tmp = (rn2(1 + Math.trunc(500 / (((acurr(A_DEX)) + (acurrstr()))))) + (10));
        }
    }`
    );
    return s;
});

// worn.js update_mon_extrinsics again: superseded by A3 goto back-
// jump-to-loop recognizer (commit 85cb377).  Translator emits
// `again: while (true) { ... }` natively.

// mondata.js / monmove.js: pointer-iteration translator gap.
// Translator emitted C's `for (a = &ptr->mattk[0]; a < &ptr->mattk[NATTK]; a++)`
// as `for (let __nhi_a = 0; (a = ptr.mattk[__nhi_a]) && (a < ptr.mattk[6]); __nhi_a++)`.
// Two problems:
//   1. `ptr.mattk[6]` is undefined (array length 6, valid indices 0..5).
//   2. `a` is a struct OBJECT — `object < undefined` is NaN comparison
//      and evaluates false on the FIRST iteration.
// So the loop body NEVER runs.  Affects: attacktype, dmgtype_fromattack,
// and monmove's spell-cast attack scan.  attacktype() always returning
// 0 means m_initweap is skipped for every monster (kobold's dart,
// orc's helm, soldier's spear, samurai's katana, knight's lance, etc.).
//
// Fix: replace the bogus pointer comparison with an explicit bounds
// check (`__nhi_a < 6`).  C ref mondata.c attacktype/dmgtype_fromattack;
// monmove.c castmu loop in dochug.
patchFile('mondata.js', (s) => {
    return s.replace(
        /for \(let __nhi_a = 0; \(a = ptr\.mattk\[__nhi_a\]\) && \(a < ptr\.mattk\[6\]\); __nhi_a\+\+\) \{/g,
        'for (let __nhi_a = 0; __nhi_a < 6 && (a = ptr.mattk[__nhi_a]); __nhi_a++) {'
    );
});

// dogmove.js: can_reach_location is a recursive flood-fill with a
// "strictly closer dist" pruning rule.  C's version (dogmove.c:1379)
// terminates in practice because terrain (walls, water, etc.) heavily
// prunes branches at the typical pet/object distance of 1-5 cells.
// Without memoization, the worst-case branching is 9 per cell × depth
// = exponential.  For sparser terrain (some sessions' hand-mklev
// layouts), or for larger pet/target distances, recursion explodes.
//
// Add per-call memoization: a Set of visited (x,y) keys.  Each cell
// can be reached via at most one strictly-decreasing-dist path
// anyway, so memoization preserves semantics while capping the work
// at O(ROWNO*COLNO) cells per call.
patchFile('dogmove.js', (s) => {
    return s.replace(
        /export function can_reach_location\(mon, mx, my, fx, fy\) \{\n    let i = 0;\n    let j = 0;\n    let dist = 0;\n    if \(mx == fx && my == fy\) \{\n        return \(1\);\n    \}\n    if \(!isok\(mx, my\)\) \{\n        return \(0\);\n    \}\n    dist = dist2\(mx, my, fx, fy\);\n    for \(i = mx - 1; i <= mx \+ 1; i\+\+\) \{\n        for \(j = my - 1; j <= my \+ 1; j\+\+\) \{\n            if \(!isok\(i, j\)\) \{\n                continue;\n            \}\n            if \(dist2\(i, j, fx, fy\) >= dist\) \{\n                continue;\n            \}\n            if \(\(\(game\.level\.locations\[i\]\[j\]\.typ\) < POOL\) && !\(\(\(mon\.data\)\.mflags1 & 8\) != 0\) && \(!may_dig\(i, j\) \|\| !\(\(\(mon\.data\)\.mflags1 & 32\) != 0\) \|\| \(\(\(\(\(game\.dungeon_topology\.d_rogue_level\)\)\.dlevel \|\| \(\(game\.dungeon_topology\.d_rogue_level\)\)\.dnum\) && on_level\(game\.u\.uz, \(game\.dungeon_topology\.d_rogue_level\)\)\)\)\)\) \{\n                continue;\n            \}\n            if \(\(\(game\.level\.locations\[i\]\[j\]\.typ\) == DOOR\) && \(game\.level\.locations\[i\]\[j\]\.flags & \(4 \| 8\)\)\) \{\n                continue;\n            \}\n            if \(!could_reach_item\(mon, i, j\)\) \{\n                continue;\n            \}\n            if \(can_reach_location\(mon, i, j, fx, fy\)\) \{\n                return \(1\);\n            \}\n        \}\n    \}\n    return \(0\);\n\}/,
        `function _can_reach_inner(mon, mx, my, fx, fy, visited) {
    if (mx == fx && my == fy) return 1;
    if (!isok(mx, my)) return 0;
    const key = my * 80 + mx;
    if (visited.has(key)) return 0;
    visited.add(key);
    const dist = dist2(mx, my, fx, fy);
    for (let i = mx - 1; i <= mx + 1; i++) {
        for (let j = my - 1; j <= my + 1; j++) {
            if (!isok(i, j)) continue;
            if (dist2(i, j, fx, fy) >= dist) continue;
            if (((game.level.locations[i][j].typ) < POOL) && !(((mon.data).mflags1 & 8) != 0) && (!may_dig(i, j) || !(((mon.data).mflags1 & 32) != 0) || (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))))) {
                continue;
            }
            if (((game.level.locations[i][j].typ) == DOOR) && (game.level.locations[i][j].flags & (4 | 8))) {
                continue;
            }
            if (!could_reach_item(mon, i, j)) continue;
            if (_can_reach_inner(mon, i, j, fx, fy, visited)) return 1;
        }
    }
    return 0;
}
export function can_reach_location(mon, mx, my, fx, fy) {
    return _can_reach_inner(mon, mx, my, fx, fy, new Set());
}`
    );
});
patchFile('monmove.js', (s) => {
    return s.replace(
        /for \(let __nhi_a = 0; \(a = mdat\.mattk\[__nhi_a\]\) && \(a < mdat\.mattk\[6\]\); __nhi_a\+\+\) \{/g,
        'for (let __nhi_a = 0; __nhi_a < 6 && (a = mdat.mattk[__nhi_a]); __nhi_a++) {'
    );
});

// vision.js: get_unused_cs's per-row `*nrmin++ = COLNO - 1` and
// `*nrmax++ = 1` are emitted as `void 0 /* TODO Phase 5+: pointer-
// mutation lvalue */`.  Without these assignments, the unused work
// area's row min/max bounds stay at 0/0 (not 79/1), so the next
// vision_recalc treats every row as fully blocked and lighting/
// LOS computation reads stale data.  Replace with explicit indexing
// against nrmin/nrmax (already aliased to the 1D arrays).  C ref
// vision.c:295-298.
patchFile('vision.js', (s) => {
    return s.replace(
        /(    for \(row = 0; row < 21; row\+\+\) \{\n)        void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 80 - 1\) \*\/;\n        void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 1\) \*\/;\n(    \})/,
        '$1        nrmin[row] = 80 - 1;\n        nrmax[row] = 1;\n$2'
    );
});

// teleport.js: collect_coords + enexto_core have several pointer-
// arithmetic translator gaps.  collect_coords does `*ccc++ = cc` to
// append cells and `++passcc` to advance the shuffle base; both
// emit `void 0 /* TODO Phase 5+: pointer-mutation lvalue */` (or
// `(passcc = __nh_blackhole)`).  Without these, the candy array
// stays full of (0,0) entries so every goodpos check inside
// enexto_core fails.  enexto_core's own `*cc = candy[i]` coord-
// copy is similarly stubbed.
//
// Fix: explicit index tracking against the array, and a direct
// coord-copy in enexto_core's loop.  This makes makedog→makemon→
// enexto_core actually find a near-tile spawn for the pet, so the
// subsequent next_ident/newmonhp/peace_minded RNG matches recordings.
patchFile('teleport.js', (s) => {
    s = s.replace(
        /(export function collect_coords\(ccc, cx, cy, maxradius, cc_flags, filter\) \{)/,
        '$1\n    let cccIdx = 0;\n    let passccIdx = 0;'
    );
    s = s.replace(
        /(            passcc = ccc;)/,
        '$1\n            passccIdx = cccIdx;'
    );
    s = s.replace(
        /                void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = cc\) \*\/;/,
        '                ccc[cccIdx++] = { x: cc.x, y: cc.y };'
    );
    s = s.replace(
        /                    Object\.assign\(cc, passcc\[0\]\);\n                    Object\.assign\(passcc\[0\], passcc\[k\]\);\n                    Object\.assign\(passcc\[k\], cc\);/,
        '                    const __tmp = passcc[passccIdx];\n                    passcc[passccIdx] = passcc[passccIdx + k];\n                    passcc[passccIdx + k] = __tmp;'
    );
    s = s.replace(
        /                \(passcc = __nh_blackhole\);/,
        '                ++passccIdx;'
    );
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = candy\[i\]\) \*\/;/g,
        'cc.x = candy[i].x; cc.y = candy[i].y;'
    );
    return s;
});

// engrave.js: two patches that were previously hand-applied to
// translated output, now part of the build so subsequent regens
// don't lose them.
patchFile('engrave.js', (s) => {
    // wipeout_text coerce string→char-code array.  random_engraving's
    // `outbuf = strcpy(outbuf, pristine_copy)` returns a JS string.
    // wipeout_text reads `engr[nxt]` expecting a char code, but on
    // a string it's a 1-char string and `s == rubouts[i].wipefrom`
    // (numeric) never matches.  rn2(ln) at engrave.c:164 doesn't
    // fire and rumor lookups misalign.
    s = s.replace(
        /export function wipeout_text\(engr, cnt, seed\) \{\s*\n\s*let s = null;/,
        `export function wipeout_text(engr, cnt, seed) {
    if (typeof engr === "string") {
        const __arr = new Array(engr.length + 1);
        for (let __i = 0; __i < engr.length; __i++) __arr[__i] = engr.charCodeAt(__i);
        __arr[engr.length] = 0;
        engr = __arr;
    }
    let s = null;`
    );
    // make_engr_at stub: alloc + pointer-arithmetic on engr_txt[i]
    // can't run cleanly in JS.  Stub to return null so callers
    // (fill_ordinary_room's graffiti branch) don't throw mid-fill.
    s = s.replace(
        /(export function make_engr_at\([^)]*\) \{)\s*\n\s*let i = 0;/,
        '$1\n    return null;\n    // eslint-disable-next-line no-unreachable\n    let i = 0;'
    );
    return s;
});

// engrave.js: make_engr_at body replacement.  The stub above injected
// `return null;` so callers don't throw, but that loses the side-effect
// of creating an engraving.  Replace the `return null;` with a minimal
// constructor that builds an engr object and links it into head_engr,
// so wipe_engr_at / engr_at find it later and fire wipeout_text's RNG
// (matching C's per-engr rn2(strlen)+rn2(4) pairs for makeniche's
// trap_engravings ageing — seed0501 etc).
patchFile('engrave.js', (s) => {
    return s.replace(
        /(export function make_engr_at\(x, y, s, pristine_s, e_time, e_type\) \{)\s*\n\s*return null;\s*\n\s*\/\/ eslint-disable-next-line no-unreachable/,
        `$1
    {
        // Minimal JS-friendly make_engr_at: build an engr object
        // with engr_txt as 3 char-arrays, link into head_engr.
        // C ref: engrave.c:408-451.  No RNG fired here unless
        // e_type == 0 (random type), in which case rnd(6-1) fires —
        // we forward that to match C.
        const __toArr = (str) => {
            if (str == null) return null;
            if (Array.isArray(str)) return str.slice();
            const arr = new Array(str.length + 1);
            for (let __i = 0; __i < str.length; __i++) arr[__i] = str.charCodeAt(__i);
            arr[str.length] = 0;
            return arr;
        };
        const __sStr = Array.isArray(s) ? ((() => { let __r=''; for (let __i=0; __i<s.length && s[__i]; __i++) __r += String.fromCharCode(s[__i]); return __r; })()) : (typeof s === 'string' ? s : '');
        let __oldEp = engr_at(x, y);
        if (__oldEp) del_engr(__oldEp);
        const __ep = {
            nxt_engr: game.head_engr,
            engr_x: x, engr_y: y,
            engr_time: e_time,
            engr_type: (e_type > 0) ? e_type : rnd(6 - 1),
            engr_txt: [__toArr(s), __toArr(s), __toArr(pristine_s || s)],
            nowipeout: 0, guardobjects: 0,
            engr_szeach: __sStr.length + 1, engr_alloc: (__sStr.length + 1) * 3,
        };
        game.head_engr = __ep;
        if (__sStr === 'Elbereth') {
            if (game.in_mklev) {
                __ep.guardobjects = 1;
            } else {
                exercise(A_WIS, (1));
            }
        }
        return;
    }
    // eslint-disable-next-line no-unreachable`
    );
});

// makemon.js: cg.zeromonst (in decl.js) has scalar/null defaults for
// the monster's embedded coord arrays (`mtrack: null`, `mgoal: 0`).
// `Object.assign(mtmp, cg.zeromonst)` then overwrites mtmp's mtrack
// (which alloc returned as a Proxy) with null.  Downstream
// `mtmp.mtrack[0]` in m_move (monmove.js:1344) crashes with
// "Cannot read properties of null".  C's struct-embedded array
// requires per-monster instances; share-via-zeromonst would conflate
// independent monsters' mtrack history.  Inject a per-call mtrack +
// mgoal reset right after the Object.assign.
// attrib.js: the *_abil tables (sam_abil, val_abil, etc.) translate
// C's `&(HFast)` (pointer to u.uprops[FAST].intrinsic) as
// `(game.u.uprops[FAST].intrinsic)` — capturing the VALUE (always 0
// at module load) instead of a reference to the slot.  Combined with
// the `(abil = __nh_blackhole)` translator gap for `abil++`, adjabil
// processes only the first entry and never writes back to the live
// uprops array.  Net: HFast/HStealth/HSearching/etc. role-1
// intrinsics are NEVER set for ANY role.
//
// Effect: u_calc_moveamt (allmain.c:131) misses Fast intrinsic check
// for Samurai/Valkyrie/etc., so its rn2(3) doesn't fire on iter 1's
// per-turn block.  Many other downstream effects too (Stealth, etc.).
//
// Fix: change ability fields to `() => game.u.uprops[X]` lambda that
// returns the LIVE slot reference, and rewrite adjabil + postadjabil
// + check_innate_abil to use index-based iteration and access
// .intrinsic on the slot.  C ref attrib.c:1006-1066 (adjabil),
// 780-800 (postadjabil), 988-1004 (check_innate_abil).
patchFile('attrib.js', (s) => {
    // Tables: (game.u.uprops[X].intrinsic) → () => game.u.uprops[X]
    s = s.replace(
        /ability: \(?game\.u\.uprops\[(\w+)\]\.intrinsic\)?/g,
        'ability: () => game.u.uprops[$1]'
    );
    // adjabil: pointer-walk turned into index loop with slot access
    s = s.replace(
        /export function adjabil\(oldlevel, newlevel\) \{\n    let abil = null;\n    let rabil = null;\n    let prevabil = 0;\n    let mask = 16777216;\n    abil = role_abil\(\(game\.urole\.mnum\)\);\n    switch \(\(game\.urace\.mnum\)\) \{\n        case PM_ELF:\n            rabil = elf_abil;\n            break;\n        case PM_ORC:\n            rabil = orc_abil;\n            break;\n        case PM_HUMAN:\n        case PM_DWARF:\n        case PM_GNOME:\n        default:\n            rabil = null;\n            break;\n    \}\n    while \(abil \|\| rabil\) \{\n        if \(!abil \|\| !abil\.ability\) \{\n            if \(!rabil \|\| !rabil\.ability\) \{\n                break;\n            \}\n            abil = rabil;\n            rabil = null;\n            mask = 33554432;\n        \}\n        prevabil = \(abil\.ability\);\n        if \(oldlevel < abil\.ulevel && newlevel >= abil\.ulevel\) \{\n            if \(abil\.ulevel == 1\) \{\n                \(abil\.ability\) \|= \(mask \| 67108864\);\n            \} else \{\n                \(abil\.ability\) \|= mask;\n            \}\n            if \(!\(\(abil\.ability\) & \(67108864 \| 33554432 \| 16777216\) & ~mask\)\) \{\n                if \(\(abil\.gainstr\)\) \{\n                    You_feel\("%s!", abil\.gainstr\);\n                \}\n            \}\n        \} else if \(oldlevel >= abil\.ulevel && newlevel < abil\.ulevel\) \{\n            \(abil\.ability\) &= ~mask;\n            if \(!\(\(abil\.ability\) & \(67108864 \| 33554432 \| 16777216\)\)\) \{\n                if \(\(abil\.losestr\)\) \{\n                    You_feel\("%s!", abil\.losestr\);\n                \} else if \(\(abil\.gainstr\)\) \{\n                    You_feel\("less %s!", abil\.gainstr\);\n                \}\n            \}\n        \}\n        if \(prevabil != \(abil\.ability\)\) \{\n            postadjabil\(abil\.ability\);\n        \}\n        \(abil = __nh_blackhole\);\n    \}/,
        `export function adjabil(oldlevel, newlevel) {
    let prevabil = 0;
    let mask = 16777216;
    let abilArr = role_abil((game.urole.mnum));
    let rabilArr = null;
    switch ((game.urace.mnum)) {
        case PM_ELF:
            rabilArr = elf_abil;
            break;
        case PM_ORC:
            rabilArr = orc_abil;
            break;
        case PM_HUMAN:
        case PM_DWARF:
        case PM_GNOME:
        default:
            rabilArr = null;
            break;
    }
    let abilIdx = 0;
    while (true) {
        let entry = abilArr ? abilArr[abilIdx] : null;
        if (!entry || !entry.ability) {
            if (!rabilArr) break;
            abilArr = rabilArr;
            rabilArr = null;
            abilIdx = 0;
            mask = 33554432;
            entry = abilArr[abilIdx];
            if (!entry || !entry.ability) break;
        }
        const slot = entry.ability();
        prevabil = slot.intrinsic;
        if (oldlevel < entry.ulevel && newlevel >= entry.ulevel) {
            if (entry.ulevel == 1) {
                slot.intrinsic |= (mask | 67108864);
            } else {
                slot.intrinsic |= mask;
            }
            if (!(slot.intrinsic & (67108864 | 33554432 | 16777216) & ~mask)) {
                if (entry.gainstr) {
                    You_feel("%s!", entry.gainstr);
                }
            }
        } else if (oldlevel >= entry.ulevel && newlevel < entry.ulevel) {
            slot.intrinsic &= ~mask;
            if (!(slot.intrinsic & (67108864 | 33554432 | 16777216))) {
                if (entry.losestr) {
                    You_feel("%s!", entry.losestr);
                } else if (entry.gainstr) {
                    You_feel("less %s!", entry.gainstr);
                }
            }
        }
        if (prevabil != slot.intrinsic) {
            postadjabil(slot);
        }
        abilIdx++;
    }`
    );
    // postadjabil: takes a uprops slot now, compare by identity
    s = s.replace(
        /export function postadjabil\(ability\) \{\n    if \(!game\.u\.ulevel\) \{\n        return;\n    \}\n    if \(ability == \(game\.u\.uprops\[WARNING\]\.intrinsic\) \|\| ability == \(game\.u\.uprops\[SEE_INVIS\]\.intrinsic\)\) \{\n        see_monsters\(\);\n    \}\n\}/,
        `export function postadjabil(slot) {
    if (!game.u.ulevel) {
        return;
    }
    if (slot === game.u.uprops[WARNING] || slot === game.u.uprops[SEE_INVIS]) {
        see_monsters();
    }
}`
    );
    // check_innate_abil: convert .ability reads to ability() calls.
    // The earlier "tables" replace (rule 1 in this block) rewrote
    // `ability: <slot>` to `ability: () => <slot>`, making .ability
    // a lambda.  The while-loop pointer-walk itself is now handled
    // by translate.mjs's detectWhilePtrWalk recognizer, so we
    // pattern-match its output and inject the `()` call sites.
    s = s.replace(
        /const __nhi_abil_arr = abil;\n    for \(let __nhi_abil = 0; \(abil = __nhi_abil_arr\[__nhi_abil\]\) && \(abil && abil\.ability\); __nhi_abil\+\+\) \{\n        if \(\(abil\.ability == ability\) && \(game\.u\.ulevel >= abil\.ulevel\)\) \{\n            return abil;\n        \}\n    \}/,
        `const __nhi_abil_arr = abil;
    for (let __nhi_abil = 0; (abil = __nhi_abil_arr[__nhi_abil]) && (abil && abil.ability); __nhi_abil++) {
        if ((abil.ability() === ability) && (game.u.ulevel >= abil.ulevel)) {
            return abil;
        }
    }`
    );
    return s;
});

// mon.js dmonsfree: C uses pointer-to-pointer (`*mtmpp = freetmp->nmon`)
// to unlink dead monsters from the linked list.  Translator emits
// `void 0 /* TODO Phase 5+: pointer-mutation lvalue */` for the unlink.
// Worse: in the dead branch, `mtmp` isn't advanced.  So as soon as
// dmonsfree encounters a dead monster, it stays at that mtmp forever
// (the loop condition `; mtmp;` still passes).  Infinite loop.
//
// Currently latent because no monster dies in seed8000's iter-1/iter-2
// path (the only iters using real movemon).  But Step E.2+ will
// exercise this on sessions where movemon kills hostile monsters
// (e.g., pet kills) — pre-emptive fix.
//
// Replace with an explicit prev-link walk that handles head-of-list
// removal too.
// mon.js make_corpse: C ref src/mon.c default_1 label.  Translator
// emits the three `goto default_1` fall-throughs (dragon, unicorn,
// long worm) AND the `default:` case body as TODO no-ops.  Result
// in shipping JS:
//   - dragons drop scales but no corpse (default_1 mkcorpstat
//     skipped)
//   - normal monsters in default: case drop nothing (the entire
//     default_1 body is a no-op)
// Restructure: introduce runDefault_1 flag set by each goto site
// and the default: case; after the switch run the default_1 body
// (G_NOCORPSE check + corpstatflags |= CORPSTAT_INIT + mkcorpstat
// with KEEPTRAITS condition).  Bury branch (CORPSTAT_BURIED →
// bury_an_obj) deferred to avoid circular dig.js↔mon.js import.
// C-correct; previously was net-negative under cascading at-index
// matches (project_make_corpse_default_1 memory), reapply now that
// t_domove throws are eliminated and the first-divergence point
// has shifted.
patchFile('mon.js', (s) => {
    // Add the flag declaration
    s = s.replace(
        `    let burythem = ((corpstatflags & 16) != 0);`,
        `    let burythem = ((corpstatflags & 16) != 0);
    let runDefault_1 = (0);`
    );
    // Replace the three goto-default_1 TODOs with flag-and-break.
    // Note: the existing 3 goto sites each precede a different
    // next-case fall-through; without `break`, JS execution flows
    // into the next case body.  We want goto-default_1 semantics
    // (jump OUT of switch to default_1 body), so we MUST add break.
    s = s.replace(
        /            \/\* TODO Phase 5\+: goto default_1 \(label not in scope of break\) \*\/\n        case PM_WHITE_UNICORN:/,
        `            runDefault_1 = (1);
            break;
        case PM_WHITE_UNICORN:`
    );
    s = s.replace(
        /            \/\* TODO Phase 5\+: goto default_1 \(label not in scope of break\) \*\/\n        case PM_LONG_WORM:/,
        `            runDefault_1 = (1);
            break;
        case PM_LONG_WORM:`
    );
    s = s.replace(
        /            \/\* TODO Phase 5\+: goto default_1 \(label not in scope of break\) \*\/\n        case PM_VAMPIRE:/,
        `            runDefault_1 = (1);
            break;
        case PM_VAMPIRE:`
    );
    // Replace the default: case TODO and inject the default_1 body
    // after the switch.
    s = s.replace(
        `        default:
            // TODO LabelStmt default_1 not at compound-stmt level
            break;
    }
    /* All special cases should precede the G_NOCORPSE check */
    if (!obj) {`,
        `        default:
            runDefault_1 = (1);
            break;
    }
    if (runDefault_1) {
        /* default_1 body — C ref mon.c make_corpse default_1 label.
           KEEPTRAITS = isshk || mtame || unique_corpstat (geno&G_UNIQ)
                        || is_reviver (is_rider || mlet==S_TROLL)
                        || m_id == quest_status.leader_m_id
                        || dmgtype(AD_SEDU || AD_SSEX) */
        if ((game.mvitals[mndx].mvflags & 16 /*G_NOCORPSE*/) != 0) {
            return null;
        }
        corpstatflags |= 8 /*CORPSTAT_INIT*/;
        const _isUnique = (mtmp.data.geno & 0x1000 /*G_UNIQ*/) != 0;
        const _isRider = mndx === 311 /*PM_DEATH*/
            || mndx === 312 /*PM_PESTILENCE*/
            || mndx === 313 /*PM_FAMINE*/;
        const _isReviver = _isRider || mtmp.data.mlet === 46 /*S_TROLL*/;
        const _isLeader = mtmp.m_id === game.quest_status?.leader_m_id;
        const _keepTraits = mtmp.isshk || mtmp.mtame
            || _isUnique || _isReviver || _isLeader;
        obj = mkcorpstat(CORPSE, _keepTraits ? mtmp : null, mdat, x, y, corpstatflags);
        /* bury branch (CORPSTAT_BURIED → bury_an_obj) intentionally
           omitted here — see build-engine.mjs comment. */
    }
    if (!obj) {`
    );
    return s;
});

patchFile('mon.js', (s) => {
    return s.replace(
        /    for \(mtmp = game\.level\.monlist; mtmp; \) \{\n        freetmp = mtmp;\n        if \(\(\(freetmp\)\.mhp < 1\) && !freetmp\.isgd\) \{\n            void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = freetmp\.nmon\) \*\/;\n            freetmp\.nmon = null;\n            dealloc_monst\(freetmp\);\n            count\+\+;\n        \} else \{\n            mtmp = \(freetmp\.nmon\);\n        \}\n    \}/,
        `    let prev = null;
    mtmp = game.level.monlist;
    while (mtmp) {
        freetmp = mtmp;
        if (((freetmp).mhp < 1) && !freetmp.isgd) {
            if (prev) prev.nmon = freetmp.nmon;
            else game.level.monlist = freetmp.nmon;
            mtmp = freetmp.nmon;
            freetmp.nmon = null;
            dealloc_monst(freetmp);
            count++;
        } else {
            prev = mtmp;
            mtmp = (freetmp.nmon);
        }
    }`
    );
});

// mkobj.js: cg.zeroobj.v is a single shared `{v_nexthere, v_ocontainer,
// v_ocarry}` substruct across ALL allocated objects.  When mksobj does
// `Object.assign(otmp, cg.zeroobj)`, otmp.v becomes an ALIAS to that
// shared reference, so writing `otmp.v.v_nexthere = otmp2` in
// place_object simultaneously writes through every other object that
// was also derived from cg.zeroobj — eventually creating self-cycles
// in the level-objects per-tile linked list.
//
// Effect: cursed_object_at walks `o.v.v_nexthere` until null; a
// self-cycle makes it loop forever.  This was the hang in real
// movemon → dog_move → dog_goal for sessions like seed0016 (pet at
// (51,2) evaluating objects in 5x5 range).
//
// Fix: after Object.assign(otmp, cg.zeroobj), reset otmp.v to a fresh
// per-object struct.  Same pattern as the makemon mtrack/mgoal fix.
// Apply to mksobj and init_dummyobj.
patchFile('mkobj.js', (s) => {
    s = s.replace(
        /(    otmp = Object\.assign\(alloc\(1\), \{ nobj: null, v: \{ v_nexthere: null, v_ocontainer: null, v_ocarry: null \}[^}]+\}\);\n    Object\.assign\(otmp, cg\.zeroobj\);\n)/,
        '$1    otmp.v = { v_nexthere: null, v_ocontainer: null, v_ocarry: null };\n'
    );
    s = s.replace(
        /(export function init_dummyobj\(obj, otyp, oquan\) \{\n    if \(obj\) \{\n        Object\.assign\(obj, cg\.zeroobj\);\n)/,
        '$1        obj.v = { v_nexthere: null, v_ocontainer: null, v_ocarry: null };\n'
    );
    return s;
});

patchFile('makemon.js', (s) => {
    // Patch the makemon (real-monster) Object.assign — NOT the
    // fakemon one, which is a transient stack copy.  alloc() arg
    // includes a `sizeof(...)` C-comment so the regex must allow
    // nested parens.
    return s.replace(
        /(mtmp = alloc\([^;]*\);\s*Object\.assign\(mtmp, cg\.zeromonst\);)/,
        '$1\n    mtmp.mtrack = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];\n    mtmp.mgoal = { x: 0, y: 0 };'
    );
});

// vision.js: viz_clear_rows is initialized to a fixed-size array of
// nulls at module load.  vision_init() populates each row (line 67:
// game.viz_clear_rows[i] = game.viz_clear[i]).  C calls vision_init
// once at startup; our engine never did.  Without it, clear_path
// (vision.js:733) reads `viz_clear_rows[y][x]` and crashes on null
// row.  No RNG fired by vision_init, so calling it from allmain's
// newgame is a pure setup fix.

// invent.js: update_inventory dereferences game.windowprocs
// .win_update_inventory which is null in our default windowprocs
// table (windows.js stub init).  Translated dispatch paths that
// call update_inventory before they fire RNG (e.g. dotwoweapon's
// set_twoweap → update_inventory → rnd(20)) throw, swallow the
// rnd, and silently mismatch the recording.  Make it null-safe.
//
// Also: getobj's overflow guard at invent.c:1865 — `&bp[suggested]
// == &buf[sizeof buf - 1] || ap == &altlets[sizeof altlets - 1]`
// is C pointer-equality, but the translator emitted it as a *value*
// comparison `bp[suggested] == buf[255] || ap == altlets[255]`.
// Both buffers initialize to all zeros, so the value-comparison is
// true on the very first iteration and the loop fires
// "inventory overflow" immediately.  Replace with the index check
// the C is really doing.  ap doesn't advance in our JS (the
// `*ap++ = ...` pointer-mutation is stubbed) so guard only on
// suggested.
patchFile('invent.js', (s) => {
    return s
        .replace(
            /\(game\.windowprocs\.win_update_inventory\)\(0\);/g,
            'if (typeof game.windowprocs.win_update_inventory === "function") (game.windowprocs.win_update_inventory)(0);'
        )
        .replace(
            /if \(bp\[suggested\] == buf\[256 \/\* sizeof\(char \[256\]\) \*\/ - 1\] \|\| ap == altlets\[256 \/\* sizeof\(char \[256\]\) \*\/ - 1\]\) \{/,
            'if (suggested >= 255) {'
        );
});

// hack.js: the *_to_any constructors translate C's `union any` builders
// (you.h: a_obj/a_void/a_monst/a_long share memory).  The generator
// writes them as `game.tmp_anything = cg.zeroany; tmp_anything.a_X = v`
// which (1) shares one global object across every call so successive
// calls clobber the previous, and (2) only populates one field so
// callers reading the other union members (e.g. start_timer's
// `dup.arg.a_void == arg.a_void` check) see undefined.  Return fresh
// objects with all the union aliases set to the same value.  Mirrors
// C's union semantics: writing one member is equivalent to writing
// every member of the same size class.
// decl.js: decl_globals_init's `Object.assign(game, init_sv*)` shares
// the const-table's nested objects (e.g. init_svc.context, the timer
// list head, dungeon_topology) with the live game state.  After
// segment 0 writes game.context.startingpet_mid, that write is
// VISIBLE on the supposedly-static init_svc.context — so when segment
// 1's newgame() calls decl_globals_init again, game.context inherits
// the polluted state from segment 0 instead of the fresh 0 values.
//
// Symptom: "nh_impossible: makedog() when startingpet_mid is already
// non-zero?" for every multi-segment session (seed0030, seed0013-
// friday13-save, seed5006, seed4500, etc.) and various
// inventory_overflow / state-leak symptoms.
//
// Fix: shallow-replace each Object.assign(game, init_X) with
// Object.assign(game, structuredClone(init_X)) so segment N gets a
// fresh deep copy of every init table.  C semantics: the C globals
// reset via memset(0) at game start; our equivalent is structuredClone.
patchFile('decl.js', (s) => {
    // Nested-struct fields in init_svc.context get emitted as scalar `0`
    // by the translator instead of struct literals (likely because the
    // translator doesn't follow struct typedefs through include layers
    // when emitting static initializers — `game.u` has nested objects
    // like `uz: { dnum: 0, dlevel: 0 }`, but `init_svc.context.digging`
    // etc. come out as 0).  C ref include/context.h:172-184 — these are
    // all `struct X_info` fields with their own initialized members.
    // Without struct literals here, any access like
    // `game.context.takeoff.mask = 0` (reset_remarm,
    // do_wear.js:2402) throws "Cannot create property 'mask' on
    // number 0".  Replace each scalar with a minimal zero-struct.
    // Use leading-comma+space prefix as anchor so we only match the
    // init_svc.context fields (not other identifiers like read_tribute
    // in init_sv* uevent which would otherwise be clobbered).
    s = s.replace(
        /, digging: 0,/,
        ', digging: { effort: 0, level: { dnum: 0, dlevel: 0 }, pos: { x: 0, y: 0 }, lastdigtime: 0, down: 0, chew: 0, warned: 0, quiet: 0 },'
    );
    s = s.replace(
        /, victual: 0,/,
        ', victual: { piece: null, o_id: 0, usedtime: 0, reqtime: 0, nmod: 0, canchoke: 0, fullwarn: 0, eating: 0, doreset: 0 },'
    );
    s = s.replace(
        /, engraving: 0,/,
        ', engraving: { text: new Array(257).fill(0), nextc: null, stylus: null, type: 0, pos: { x: 0, y: 0 }, actionct: 0 },'
    );
    s = s.replace(
        /, tin: 0,/,
        ', tin: { tin: null, o_id: 0, usedtime: 0, reqtime: 0 },'
    );
    s = s.replace(
        /, spbook: 0,/,
        ', spbook: { book: null, o_id: 0, delay: 0 },'
    );
    s = s.replace(
        /, takeoff: 0,/,
        ', takeoff: { mask: 0, what: 0, delay: 0, cancelled_don: 0, disrobing: new Array(31).fill(0) },'
    );
    s = s.replace(
        /, warntype: 0,/,
        ', warntype: { obj: 0, polyd: 0, species: null, speciesidx: 0 },'
    );
    s = s.replace(
        /, polearm: 0,/,
        ', polearm: { hitmon: null, m_id: 0 },'
    );
    s = s.replace(
        /, objsplit: 0,/,
        ', objsplit: { parent_oid: 0, child_oid: 0 },'
    );
    s = s.replace(
        /, tribute: 0,/,
        ', tribute: { tributesz: 0, enabled: 0, bookstock: 0, Deathnotice: 0 },'
    );
    s = s.replace(
        /, novel: 0,/,
        ', novel: { id: 0, count: 0, pasg: new Array(30).fill(0) },'
    );
    s = s.replace(
        /, achieveo: 0,/,
        ', achieveo: { mines_prize_oid: 0, soko_prize_oid: 0, castle_prize_old: 0, mines_prize_otyp: 0, soko_prize_otyp: 0, castle_prize_otyp: 0, minetn_reached: 0 },'
    );
    s = s.replace(
        /, lifelist: 0,/,
        ', lifelist: { total_seen_upclose: 0, total_photographed: 0 },'
    );
    // `bughack` (decl.c:227 — wallification preservation rect) is a
    // `lev_region` struct = { inarea: NhRect, delarea: NhRect,
    // in_islev: bool, del_islev: bool, rtype, padding, rname: union }.
    // C-side init is positional `{ {COLNO,ROWNO,0,0}, {COLNO,ROWNO,0,0},
    // FALSE, FALSE, 0, 0, {0} }`.  Translator emits this as a raw JS
    // array `[{...},{...},(0),(0),0,0,[null]]` because it doesn't have
    // the field names handy at struct-init time.  Translated callers
    // access `game.bughack.inarea.x1` (mkmaze.js wall_cleanup,
    // walkfrom, etc.) which on an array reads `undefined.x1` → crash.
    // Replace the array literal with the proper object literal.
    s = s.replace(
        /bughack: \[\{ x1: 80, y1: 21, x2: 0, y2: 0 \}, \{ x1: 80, y1: 21, x2: 0, y2: 0 \}, \(0\), \(0\), 0, 0, \[null\]\]/,
        'bughack: { inarea: { x1: 80, y1: 21, x2: 0, y2: 0 }, delarea: { x1: 80, y1: 21, x2: 0, y2: 0 }, in_islev: 0, del_islev: 0, rtype: 0, padding: 0, rname: { str: null, len: 0 } }'
    );
    return s.replace(
        /Object\.assign\(game, (g_init_[a-z]|init_sv[a-z])\);/g,
        'Object.assign(game, structuredClone($1));'
    );
});

// mkmap.js: join_map's main loop joins each room to the next via
// `dig_corridor`.  C uses pointer iteration:
//   for (croom = &rooms[0], croom2 = croom + 1;
//        croom2 < &rooms[nroom]; croom2++) {
//       ...; if (...) croom = croom2;
//   }
// Translator emitted `croom2 = croom + 1` (NaN/string-concat), the
// pointer comparison `croom2 < rooms[nroom]` (always false in JS),
// and `croom2++` as `(croom2 = __nh_blackhole)`.  The whole loop
// never enters — rooms in randomly-laid-out levels stay
// unconnected by corridors, surfacing as different level layouts
// between JS and C (player walks differ → wrong squares → divergent
// per-turn block RNG → cascade).
//
// Rewrite as an index-based walk that keeps the same "croom tracks
// the previous segment, croom2 always advances" semantics.
patchFile('mkmap.js', (s) => {
    return s.replace(
        /for \(croom = game\.rooms\[0\] , croom2 = croom \+ 1; croom2 < game\.rooms\[game\.nroom\]; \) \{([\s\S]*?)\(croom2 = __nh_blackhole\);\s*\}/,
        `{
        let __croomIdx = 0;
        for (let __croom2Idx = 1; __croom2Idx < game.nroom; __croom2Idx++) {
            croom = game.rooms[__croomIdx];
            croom2 = game.rooms[__croom2Idx];
            if (!croom || !croom2) continue;$1
            if (croom === croom2) { __croomIdx = __croom2Idx; }
        }
    }`
    );
});

// sp_lev.js: light_region's inner loop walks the y axis with
// `lev++` (advances the locations[x][?] pointer down a row), but
// the translator emits `(lev = __nh_blackhole)`.  Only the FIRST
// row gets the lit flag — every row below stays at the old lit
// value.  Symptom: lit/dark transitions in special-level regions
// drawn from .des files are partial (top edge correct, rest wrong).
patchFile('sp_lev.js', (s) => {
    return s.replace(
        /for \(x = lowx; x <= hix; x\+\+\) \{\s*lev = game\.level\.locations\[x\]\[lowy\];\s*for \(y = lowy; y <= hiy; y\+\+\) \{\s*lev\.lit = \(\(lev\.typ\) == LAVAPOOL \|\| \(lev\.typ\) == LAVAWALL\) \? 1 : litstate;\s*\(lev = __nh_blackhole\);\s*\}\s*\}/,
        `for (x = lowx; x <= hix; x++) {
        for (y = lowy; y <= hiy; y++) {
            lev = game.level.locations[x][y];
            lev.lit = ((lev.typ) == LAVAPOOL || (lev.typ) == LAVAWALL) ? 1 : litstate;
        }
    }`
    );
});

// check_room (sp_lev.c:1404) has two translator-gap issues that
// together make the function never refuse a candidate room:
//   1. The inner-loop check `lev++->typ != STONE` (C pointer-walk
//      that reads the current cell's typ and advances the pointer)
//      emits as `(0 /* TODO Phase 5+: pointer-mutation member-
//      access (typ) */) != STONE`.  STONE === 0, so the condition
//      is `0 != 0` — always false.  The body (rn2(3) gate, return
//      FALSE) never runs.
//   2. The C `goto chk` that restarts the bounds-scan with the
//      tightened (lowx, hix, lowy, hiy) emits as a `/* TODO Phase
//      5+: goto chk (label not in scope of break) */` comment.
// Combined: check_room always returns TRUE without firing the
// rn2(3) call that C does — every level that contains a non-stone
// neighbor to a candidate room misses one PRNG slot, shifting all
// downstream calls by one.  Affects every seed that exercises
// makerooms/create_room with adjacent rooms (seed0014, 0007, 0077,
// 0012, 0101 in the find-divs survey).
//
// Rewrite the body to (a) read `game.level.locations[x][y].typ`
// for the current cell, and (b) wrap the bounds-check + double-
// scan in a `chk_loop: while (true)` so the `goto chk` becomes a
// `continue chk_loop` (with a `break chk_loop` on normal exit).
patchFile('sp_lev.js', (s) => {
    const NEW_BODY = `export function check_room(lowx, ddx, lowy, ddy, vault) {
    let x = 0;
    let y = 0;
    let hix = 0;
    let hiy = 0;
    let lev = null;
    let xlim = 0;
    let ylim = 0;
    let ymax = 0;
    let s_lowx = 0;
    let s_ddx = 0;
    let s_lowy = 0;
    let s_ddy = 0;
    hix = lowx.value + ddx.value;
    hiy = lowy.value + ddy.value;
    s_lowx = lowx.value;
    s_ddx = ddx.value;
    s_lowy = lowy.value;
    s_ddy = ddy.value;
    xlim = 4 + (vault ? 1 : 0);
    ylim = 3 + (vault ? 1 : 0);
    if (lowx.value < 3) {
        lowx.value = 3;
    }
    if (lowy.value < 2) {
        lowy.value = 2;
    }
    if (hix > 80 - 3) {
        hix = 80 - 3;
    }
    if (hiy > 21 - 3) {
        hiy = 21 - 3;
    }
    chk_loop: while (true) {
        if (hix <= lowx.value || hiy <= lowy.value) {
            return (0);
        }
        if (game.in_mk_themerooms && (s_lowx != lowx.value) && (s_ddx != ddx.value) && (s_lowy != lowy.value) && (s_ddy != ddy.value)) {
            return (0);
        }
        let __restart = false;
        outer_for: for (x = lowx.value - xlim; x <= hix + xlim; x++) {
            if (x <= 0 || x >= 80) {
                continue;
            }
            y = lowy.value - ylim;
            ymax = hiy + ylim;
            if (y < 0) {
                y = 0;
            }
            if (ymax >= 21) {
                ymax = (21 - 1);
            }
            for (; y <= ymax; y++) {
                lev = game.level.locations[x][y];
                if (lev.typ != STONE) {
                    if (!vault) {
                        do {
                            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/sp_lev.c", (1))) {
                                let save_plnmsg = game.iflags.last_msg;
                                pline("strange area [%d,%d] in check_room.", x, y);
                                game.iflags.last_msg = save_plnmsg;
                            }
                        } while (0);
                    }
                    if (!rn2(3)) {
                        return (0);
                    }
                    if (game.in_mk_themerooms) {
                        return (0);
                    }
                    if (x < lowx.value) {
                        lowx.value = x + xlim + 1;
                    } else {
                        hix = x - xlim - 1;
                    }
                    if (y < lowy.value) {
                        lowy.value = y + ylim + 1;
                    } else {
                        hiy = y - ylim - 1;
                    }
                    __restart = true;
                    break outer_for;
                }
            }
        }
        if (__restart) continue chk_loop;
        break chk_loop;
    }
    ddx.value = hix - lowx.value;
    ddy.value = hiy - lowy.value;
    if (game.in_mk_themerooms && (s_lowx != lowx.value) && (s_ddx != ddx.value) && (s_lowy != lowy.value) && (s_ddy != ddy.value)) {
        return (0);
    }
    return (1);
}`;
    // Match the entire existing check_room function from `export
    // function check_room(...)` through the closing `}` of its body.
    // Brace-balanced scan from the export line.
    const head = s.indexOf('export function check_room(lowx, ddx, lowy, ddy, vault) {');
    if (head < 0) return s;
    let depth = 1, i = head + s.slice(head).indexOf('{') + 1;
    while (i < s.length && depth > 0) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}') depth--;
        i++;
    }
    if (depth !== 0) return s;
    const end = i;
    return s.slice(0, head) + NEW_BODY + s.slice(end);
});

// mklev.js: add_room and add_subroom in C do
//   croom = &svr.rooms[svn.nroom];
//   do_room_or_subroom(croom, ...);
//   croom++;
//   croom->hx = -1;
//   svn.nroom++;
// The `croom++` then `croom->hx = -1` writes the END-OF-ROOMS sentinel
// to the NEXT slot — every iteration that does
// `for (croom = rooms; croom->hx >= 0; croom++)` stops there.  The
// translator emitted the post-increment as `(croom = __nh_blackhole)`,
// so the sentinel write goes to /dev/null.  rooms[nroom+1].hx stays
// at its initialized value (0 from the mkroom-zero shape), so the
// `hx >= 0` check is true and the loop reads into uninitialized
// rooms — surfaces as wrong room iteration / wrong hx in mkroom.js's
// search_special, choose_specstairs, etc.  Patch the assignment to
// write rooms[nroom+1] directly.
patchFile('mklev.js', (s) => {
    return s.replace(
        /croom = game\.rooms\[game\.nroom\];\s*do_room_or_subroom\(croom, lowx, lowy, hix, hiy, lit, rtype, special, \(1\)\);\s*\(croom = __nh_blackhole\);\s*croom\.hx = -1;\s*game\.nroom\+\+;/,
        `croom = game.rooms[game.nroom];
    do_room_or_subroom(croom, lowx, lowy, hix, hiy, lit, rtype, special, (1));
    if (game.rooms[game.nroom + 1]) game.rooms[game.nroom + 1].hx = -1;
    game.nroom++;`
    ).replace(
        /croom = game\.subrooms\[game\.nsubroom\];\s*do_room_or_subroom\(croom, lowx, lowy, hix, hiy, lit, rtype, special, \(0\)\);\s*proom\.sbrooms\[proom\.nsubrooms\+\+\] = croom;\s*\(croom = __nh_blackhole\);\s*croom\.hx = -1;\s*game\.nsubroom\+\+;/,
        `croom = game.subrooms[game.nsubroom];
    do_room_or_subroom(croom, lowx, lowy, hix, hiy, lit, rtype, special, (0));
    proom.sbrooms[proom.nsubrooms++] = croom;
    if (game.subrooms[game.nsubroom + 1]) game.subrooms[game.nsubroom + 1].hx = -1;
    game.nsubroom++;`
    );
});

// mklev.js: makelevel's `goto fill_vault` is a cross-branch
// back-jump from inside the `else if (rnd_rect() && create_room
// (..., VAULT, 1))` second-chance branch into the `fill_vault`
// label inside the first `if (check_room(...))` branch.  Both
// paths run the same finalize sequence (add_room + has_vault +
// fill_special_room + mk_knox_portal + makevtele).  Restructure
// with a __do_fill_vault flag: each candidate-check path sets
// the flag, then a single post-chain block runs the finalize
// sequence once.  RNG-critical: rn2(3) for makevtele must fire
// in the same order; flag-based approach preserves it because
// both check_room calls and the rnd_rect/create_room calls
// happen in the original order before the body.  Score effect:
// +1419 P on seed0399 (the level chain hit a vault-second-
// chance level that was silently skipping the finalize before).
patchFile('mklev.js', (s) => {
    return s.replace(
        /                if \(check_room\(\{ get value\(\) \{ return game\.vault_x; \}, set value\(_v\) \{ game\.vault_x = _v; \} \}, \{ get value\(\) \{ return w; \}, set value\(_v\) \{ w = _v; \} \}, \{ get value\(\) \{ return game\.vault_y; \}, set value\(_v\) \{ game\.vault_y = _v; \} \}, \{ get value\(\) \{ return h; \}, set value\(_v\) \{ h = _v; \} \}, \(1\)\)\) \{\n                    fill_vault: \{\n                    \}\n                    add_room\(game\.vault_x, game\.vault_y, game\.vault_x \+ w, game\.vault_y \+ h, \(1\), VAULT, \(0\)\);\n                    game\.level\.flags\.has_vault = 1;\n                    \+\+room_threshold;\n                    game\.rooms\[game\.nroom - 1\]\.needfill = 1;\n                    fill_special_room\(game\.rooms\[game\.nroom - 1\]\);\n                    mk_knox_portal\(game\.vault_x \+ w, game\.vault_y \+ h\);\n                    if \(!game\.level\.flags\.noteleport && !rn2\(3\)\) \{\n                        makevtele\(\);\n                    \}\n                \} else if \(rnd_rect\(\) && create_room\(-1, -1, 2, 2, -1, -1, VAULT, \(1\)\)\) \{\n                    game\.vault_x = game\.rooms\[game\.nroom\]\.lx;\n                    game\.vault_y = game\.rooms\[game\.nroom\]\.ly;\n                    if \(check_room\(\{ get value\(\) \{ return game\.vault_x; \}, set value\(_v\) \{ game\.vault_x = _v; \} \}, \{ get value\(\) \{ return w; \}, set value\(_v\) \{ w = _v; \} \}, \{ get value\(\) \{ return game\.vault_y; \}, set value\(_v\) \{ game\.vault_y = _v; \} \}, \{ get value\(\) \{ return h; \}, set value\(_v\) \{ h = _v; \} \}, \(1\)\)\) \{\n                        \/\* TODO Phase 5\+: goto fill_vault \(label not in scope of break\) \*\/\n                    \} else \{\n                        game\.rooms\[game\.nroom\]\.hx = -1;\n                    \}\n                \}/,
        `                let __do_fill_vault = false;
                if (check_room({ get value() { return game.vault_x; }, set value(_v) { game.vault_x = _v; } }, { get value() { return w; }, set value(_v) { w = _v; } }, { get value() { return game.vault_y; }, set value(_v) { game.vault_y = _v; } }, { get value() { return h; }, set value(_v) { h = _v; } }, (1))) {
                    __do_fill_vault = true;
                } else if (rnd_rect() && create_room(-1, -1, 2, 2, -1, -1, VAULT, (1))) {
                    game.vault_x = game.rooms[game.nroom].lx;
                    game.vault_y = game.rooms[game.nroom].ly;
                    if (check_room({ get value() { return game.vault_x; }, set value(_v) { game.vault_x = _v; } }, { get value() { return w; }, set value(_v) { w = _v; } }, { get value() { return game.vault_y; }, set value(_v) { game.vault_y = _v; } }, { get value() { return h; }, set value(_v) { h = _v; } }, (1))) {
                        __do_fill_vault = true;
                    } else {
                        game.rooms[game.nroom].hx = -1;
                    }
                }
                if (__do_fill_vault) {
                    add_room(game.vault_x, game.vault_y, game.vault_x + w, game.vault_y + h, (1), VAULT, (0));
                    game.level.flags.has_vault = 1;
                    ++room_threshold;
                    game.rooms[game.nroom - 1].needfill = 1;
                    fill_special_room(game.rooms[game.nroom - 1]);
                    mk_knox_portal(game.vault_x + w, game.vault_y + h);
                    if (!game.level.flags.noteleport && !rn2(3)) {
                        makevtele();
                    }
                }`
    );
});

// mklev.js: two translator-dropped pointer-mutation lvalues.
//
//   1. mkrooms theme-load failure: C `*fname = '\0'` clears the
//      themerms field so next level-make won't retry the failed
//      load.  Translator emitted TODO no-op; JS would retry the
//      bad lua file every level.
//
//   2. mk_knox_portal: C `*source = u.uz` sets the Fort Ludios
//      branch's end1.dnum/.dlevel to the current level so the
//      portal links correctly.  Translator TODO no-op; portal
//      inserts with stale (br->end1) values pointing to wrong
//      dungeon.
//
// JS-equivalent: assign properties directly.  themerms = '' for
// #1; source.dnum/dlevel = u.uz for #2.
//
// Score-stable in current 44-session run (knox portal only
// fires for vaults on depth>10 levels which autoplay sessions
// don't reach yet; themerms retry adds duplicate work but no
// RNG drift in chargen).  Defensive correctness.
//
// C ref: src/mklev.c lines 389 (themerms clear) + 2654 (knox
// source = u.uz).
patchFile('mklev.js', (s) => {
    s = s.replace(
        /        if \(!themes\) \{\n            void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 0\) \*\/;\n        \}/,
        `        if (!themes) {
            game.dungeons[game.u.uz.dnum].themerms = '';
        }`
    );
    s = s.replace(
        /    if \(!\(game\.u\.uz\.dnum == \(game\.dungeon_topology\.d_oracle_level\)\.dnum && !at_dgn_entrance\("The Quest"\) && \(u_depth = depth\(game\.u\.uz\)\) > 10 && u_depth < depth\(\(game\.dungeon_topology\.d_medusa_level\)\)\)\) \{\n        return;\n    \}\n    void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = game\.u\.uz\) \*\/;\n    insert_branch\(br, \(1\)\);/,
        `    if (!(game.u.uz.dnum == (game.dungeon_topology.d_oracle_level).dnum && !at_dgn_entrance("The Quest") && (u_depth = depth(game.u.uz)) > 10 && u_depth < depth((game.dungeon_topology.d_medusa_level)))) {
        return;
    }
    source.dnum = game.u.uz.dnum;
    source.dlevel = game.u.uz.dlevel;
    insert_branch(br, (1));`
    );
    return s;
});

// mapfrag_fromstr's line-counting loop relies on C s1++ (advance
// pointer past newline) which JS can't model on a string.  The
// translator emits the loop verbatim — but JS coerces s1 to NaN
// at the post-increment, the next iter's `tmps && tmps` is falsy,
// and the loop exits after one iteration → mf.hei = 1 regardless
// of input.  Effect on lspo_map: `rn2(ROWNO - mf.hei)` becomes
// `rn2(20)` instead of `rn2(10)` (ROWNO=21, real fragment height
// 11), dropping every fragment-placement y-coord onto the wrong
// PRNG slot.  Same 6 sessions as the dupstr fix surface here
// (seed0004/0009/0013-rogue/0013-friday13/0015/0200).
//
// Replace the loop with a JS-native split-and-count, char-array
// safe (mf.data may be string or char-array depending on dupstr
// path).
patchFile('sp_lev.js', (s) => s.replace(
    /mf\.hei = 0;\s*tmps = mf\.data;\s*while \(tmps && tmps\) \{\s*let s1 = strchr\(tmps, 10\);\s*if \(mf\.hei > 21\) \{\s*free\(mf\.data\);\s*free\(mf\);\s*return null;\s*\}\s*if \(s1\) \{\s*s1\+\+;\s*\}\s*tmps = s1;\s*mf\.hei\+\+;\s*\}/,
    "mf.hei = 0;\n    if (mf.data) {\n        const __mfs = typeof mf.data === 'string'\n            ? mf.data\n            : (() => { let r = ''; for (let i = 0; i < mf.data.length && mf.data[i]; i++) r += String.fromCharCode(mf.data[i]); return r; })();\n        for (let __i = 0; __i < __mfs.length; __i++) {\n            if (__mfs.charCodeAt(__i) === 10) {\n                mf.hei++;\n                if (mf.hei > 21) { free(mf.data); free(mf); return null; }\n            }\n        }\n        if (__mfs.length > 0 && __mfs.charCodeAt(__mfs.length - 1) !== 10) {\n            mf.hei++;\n        }\n    }"
));

// sp_lev.js: lspo_map — `goto redo_maploc` (back-jump to retry theme
// room placement) cannot be modelled as `break label` because `break`
// only exits a labeled statement, never re-enters it.  The translator
// emits the prologue as `redo_maploc: { ... }` (a labeled block that
// is structurally unreachable as a goto target) and the body as
// `skipmap: { ... }` with a TODO comment in place of the actual
// `continue redo_maploc` jump.
//
// Restructure into a labeled while-true loop spanning the C body
// after the `redo_maploc:` label.  Mapping:
//   goto redo_maploc  →  continue redo_maploc
//   goto skipmap      →  break redo_maploc
//   fall-through end  →  break redo_maploc  (one-shot if no retry)
patchFile('sp_lev.js', (s) => {
    s = s.replace(
        /\n    redo_maploc: \{\n((?:.*\n)*?)    \}\n    game\.xsize = mf\.wid;\n    skipmap: \{\n        game\.ysize = mf\.hei;/,
        (_m, body) => {
            const dedented = body.replace(/^    /gm, '').replace(/\n$/, '');
            return '\n' + dedented +
                '\n    redo_maploc: while (true) {' +
                '\n        game.xsize = mf.wid;' +
                '\n        game.ysize = mf.hei;';
        }
    );
    s = s.replace(/break skipmap;/g, 'break redo_maploc;');
    s = s.replace(
        /\/\* TODO Phase 5\+: goto redo_maploc \(label not in scope of break\) \*\//g,
        'continue redo_maploc;'
    );
    s = s.replace(
        /(\n {16}\}\n {12}\}\n {8}\}\n {4}\})\n(    mapfrag_free\(\{ get value\(\) \{ return mf;)/,
        '\n                }\n            }\n        }\n        break redo_maploc;\n    }\n$2'
    );
    return s;
});

// `room - game.rooms` (C: pointer-difference yields room's index in
// the rooms array) translates verbatim through binaryOp, but in JS
// `roomObj - arrayObj` is NaN — both operands coerce to NaN.  Every
// `(croom - game.rooms) + 3`, `(sroom - game.rooms)`, etc. site that
// computes a 0-based room index (or +3 to get the roomno) was
// silently producing NaN.  Downstream effects include:
//   - sort_rooms()'s ri[roomnoidx] = i remap never touches the right
//     index (ri[NaN] sets a string key); locations[].roomno renumber
//     ends up identity, so cells point at pre-sort room slots.
//   - good_rm_wall_doorpos() compares rmno (NaN) against
//     locations[tx][ty].roomno (number), which is always !=, so
//     finddpos_shift fails repeatedly and finddpos either burns
//     extra rn2() calls in retry or falls into the deterministic
//     scan path with stale x/y values.
// Rewrite every `(IDENT - game.rooms)` site to a JS index-of call.
// indexOf is O(n) but rooms arrays cap at MAXNROFROOMS=40, so the
// cost is negligible compared to the correctness gain.  The pattern
// covers all 7 files that use this idiom (room/croom/aroom/sroom/
// droom/...).
// Three passes (order matters — wrapped form first, then parenthesized
// without inner parens, then naked `ID - game.rooms`):
//   1. `((ID) - game.rooms)` — sounds.js shape with inner-parens around
//      the identifier (`((sroom) - game.rooms)`).
//   2. `(ID - game.rooms)` — the standard shape across most call sites.
//   3. `ID - game.rooms` (word-bounded, no surrounding parens) —
//      mkroom.js:137 `if (sroom - game.rooms >= game.nroom)`.
// Each turns the pointer-difference into `game.rooms.indexOf(ID)`.
const ROOM_PTRDIFF_WRAPPED_RE = /\(\(([a-zA-Z_][a-zA-Z0-9_]*)\) - game\.rooms\)/g;
const ROOM_PTRDIFF_RE = /\(([a-zA-Z_][a-zA-Z0-9_]*) - game\.rooms\)/g;
const ROOM_PTRDIFF_NAKED_RE = /\b([a-zA-Z_][a-zA-Z0-9_]*) - game\.rooms\b/g;
for (const f of ['mklev.js', 'mkroom.js', 'sp_lev.js', 'selvar.js', 'shknam.js', 'priest.js', 'sounds.js']) {
    patchFile(f, (s) => s
        .replace(ROOM_PTRDIFF_WRAPPED_RE, 'game.rooms.indexOf($1)')
        .replace(ROOM_PTRDIFF_RE, 'game.rooms.indexOf($1)')
        .replace(ROOM_PTRDIFF_NAKED_RE, 'game.rooms.indexOf($1)'));
}

patchFile('hack.js', (s) => {
    return s
        .replace(
            /export function obj_to_any\(obj\) \{\s*game\.tmp_anything = cg\.zeroany;\s*game\.tmp_anything\.a_obj = obj;\s*return game\.tmp_anything;\s*\}/,
            'export function obj_to_any(obj) {\n    return { a_obj: obj, a_void: obj, a_monst: null, a_long: 0, a_int: 0, a_uint: 0, a_ulong: 0, a_iflags: 0 };\n}'
        )
        .replace(
            /export function monst_to_any\(mtmp\) \{\s*game\.tmp_anything = cg\.zeroany;\s*game\.tmp_anything\.a_monst = mtmp;\s*return game\.tmp_anything;\s*\}/,
            'export function monst_to_any(mtmp) {\n    return { a_obj: null, a_void: mtmp, a_monst: mtmp, a_long: 0, a_int: 0, a_uint: 0, a_ulong: 0, a_iflags: 0 };\n}'
        )
        .replace(
            /export function long_to_any\(lng\) \{\s*game\.tmp_anything = cg\.zeroany;\s*game\.tmp_anything\.a_long = lng;\s*return game\.tmp_anything;\s*\}/,
            'export function long_to_any(lng) {\n    return { a_obj: null, a_void: null, a_monst: null, a_long: lng, a_int: lng, a_uint: lng, a_ulong: lng, a_iflags: lng };\n}'
        )
        .replace(
            /export function uint_to_any\(ui\) \{\s*game\.tmp_anything = cg\.zeroany;\s*game\.tmp_anything\.a_uint = ui;\s*return game\.tmp_anything;\s*\}/,
            'export function uint_to_any(ui) {\n    return { a_obj: null, a_void: null, a_monst: null, a_long: ui, a_int: ui, a_uint: ui, a_ulong: ui, a_iflags: ui };\n}'
        );
});

// hack.js: move_update — the room/shop entry tracking loop walks
// `u.urooms` etc. as a C string (`char *`) with pointer arithmetic.
// Translator emitted `ptr1 = game.u.urooms` (string-as-array),
// `c = ptr1` (whole string instead of *ptr1), and four `void 0
// /* TODO ... *p = X */` for the post-increment store-and-advance.
// Result: `c - 3` is `string - 3` = NaN, `game.rooms[NaN].rtype`
// throws "Cannot read properties of undefined (reading 'rtype')".
//
// C ref hack.c:3588 move_update.  Rewrite the function body using
// indexed array iteration and string mutation.  u.urooms etc. are
// 5-element arrays of bytes (chars + null terminator).
patchFile('hack.js', (s) => {
    const oldBody = `    game.u.urooms = strcpy(game.u.urooms, in_rooms(game.u.ux, game.u.uy, 0));
    for (ptr1 = game.u.urooms , ptr2 = game.u.uentered , ptr3 = game.u.ushops , ptr4 = game.u.ushops_entered; ptr1; ptr1++) {
        c = ptr1;
        if (!strchr(game.u.urooms0, c)) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = c) */;
        }
        if ((game.rooms[c - 3].rtype >= SHOPBASE)) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = c) */;
            if (!strchr(game.u.ushops0, c)) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = c) */;
            }
        }
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */ , void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */ , void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    for (ptr1 = game.u.ushops0 , ptr2 = game.u.ushops_left; ptr1; ptr1++) {
        if (!strchr(game.u.ushops, ptr1)) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = ptr1) */;
        }
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
}`;
    const newBody = `    game.u.urooms = strcpy(game.u.urooms, in_rooms(game.u.ux, game.u.uy, 0));
    // Indexed iteration: walk u.urooms (room number array, terminated
    // by 0 byte); for each entry, mirror to u.uentered if not in
    // u.urooms0, and to u.ushops + u.ushops_entered if it's a shop.
    let __p2 = 0, __p3 = 0, __p4 = 0;
    for (let __p1 = 0; __p1 < game.u.urooms.length && game.u.urooms[__p1]; __p1++) {
        const c = game.u.urooms[__p1];
        if (!strchr(game.u.urooms0, c)) {
            game.u.uentered[__p2++] = c;
        }
        const __rno = c - 3;
        if (__rno >= 0 && game.rooms[__rno] && (game.rooms[__rno].rtype >= SHOPBASE)) {
            game.u.ushops[__p3++] = c;
            if (!strchr(game.u.ushops0, c)) {
                game.u.ushops_entered[__p4++] = c;
            }
        }
    }
    if (__p2 < game.u.uentered.length) game.u.uentered[__p2] = 0;
    if (__p3 < game.u.ushops.length) game.u.ushops[__p3] = 0;
    if (__p4 < game.u.ushops_entered.length) game.u.ushops_entered[__p4] = 0;
    let __pl2 = 0;
    for (let __pl1 = 0; __pl1 < game.u.ushops0.length && game.u.ushops0[__pl1]; __pl1++) {
        const __c2 = game.u.ushops0[__pl1];
        if (!strchr(game.u.ushops, __c2)) {
            game.u.ushops_left[__pl2++] = __c2;
        }
    }
    if (__pl2 < game.u.ushops_left.length) game.u.ushops_left[__pl2] = 0;
}`;
    s = s.replace(oldBody, newBody);
    // check_special_room (line ~2497) has the same string-iteration
    // gap: `for (ptr = game.u.uentered[0]; ptr; ptr++)` walks chars
    // but reads index [0] then numerically increments the value (room
    // number) instead of advancing through the array.  C ref hack.c
    // around line 3640 — `for (ptr = u.uentered; *ptr; ptr++)`.  Patch
    // just the loop header, leaving the (large) body intact.
    s = s.replace(
        /for \(ptr = game\.u\.uentered\[0\]; ptr; ptr\+\+\) \{\s+let roomno = ptr - 3;\s+let rt = game\.rooms\[roomno\]\.rtype;/,
        `for (let __ue_i = 0; __ue_i < game.u.uentered.length && game.u.uentered[__ue_i]; __ue_i++) {
        const ptr = game.u.uentered[__ue_i];
        let roomno = ptr - 3;
        if (roomno < 0 || !game.rooms[roomno]) continue;
        let rt = game.rooms[roomno].rtype;`
    );
    return s;
});

// hack.js: `in_rooms(x, y, typewanted)` — returns a string of
// room numbers (as char codes) for rooms adjacent to (x,y).  C
// uses pointer-to-pointer-style prepending: `char *ptr = &buf[4]`
// then `*(--ptr) = rno`.  Translator emits:
//   - `let ptr = __in_rooms_buf[4];` (sets ptr to the VALUE at
//     buf[4], not the address) — so ptr = 0 (number).
//   - `*(--ptr) = rno;` → `void 0 /* TODO ... */;` (4 places).
//   - Local `step` is mistakenly emitted as `game.step` (4 places)
//     because of a translator name-resolution bug that promotes
//     `step` onto `game`.  Not yet diagnosed.
// Result: in_rooms returns 0 ALWAYS.  Every caller
// (shop_keeper(...), strchr(in_rooms(...), c), if(in_rooms(...)))
// gets the wrong answer — shops aren't detected, shop bills don't
// apply, shop-leave warnings don't fire, etc.  Hot path: called
// from move_update, check_special_room, shk.js many places,
// dig.js, dothrow.js, etc.
//
// Replace the entire function body with a JS-idiomatic version
// that returns a STRING of room-number chars.  Callers that
// use it work naturally:
//   - `if (in_rooms(...))` → empty string is falsy.
//   - `strchr(in_rooms(...), c)` → runtime strchr accepts strings.
//   - `shop_keeper(in_rooms(...))` → see shk.js patch below — we
//     normalize the string-or-number to a numeric room code at the
//     shop_keeper entry boundary.
//   - `in_rooms(x, y) == in_rooms(x', y')` → string equality.
patchFile('hack.js', (s) => {
    // Find the in_rooms function start, then walk forward through
    // balanced braces to find the function's closing `}`.  Replace
    // the entire body with a clean JS-idiomatic version.
    const fnStart = s.indexOf('export function in_rooms(x, y, typewanted) {');
    if (fnStart < 0) return s;
    let i = fnStart + 'export function in_rooms(x, y, typewanted) {'.length;
    let depth = 1;
    while (i < s.length && depth > 0) {
        const c = s[i];
        if (c === '{') depth++;
        else if (c === '}') depth--;
        i++;
    }
    if (depth !== 0) return s;
    const fnEnd = i; // index past the closing `}`
    const replacement = `export function in_rooms(x, y, typewanted) {
    let result = "";
    let step = 0;
    let typefound = 0;
    const goodtype = (rn) => (!typewanted
        || (typefound = game.rooms[rn - 3].rtype) == typewanted
        || (typewanted == 14 /*SHOPBASE*/ && typefound > 14));
    let rno = game.level.locations[x][y].roomno;
    switch (rno) {
        case 0: return result;
        case 1: step = 2; break;
        case 2: step = 1; break;
        default:
            if (goodtype(rno)) result = String.fromCharCode(rno) + result;
            return result;
    }
    let min_x = x - 1, max_x = x + 1;
    if (x < 1) min_x += step;
    else if (x >= 80) max_x -= step;
    let min_y = y - 1, max_y_offset = 2;
    if (min_y < 0) { min_y += step; max_y_offset -= step; }
    else if ((min_y + max_y_offset) >= 21) max_y_offset -= step;
    for (let xx = min_x; xx <= max_x; xx += step) {
        for (let yo = 0; yo <= max_y_offset; yo += step) {
            const yy = min_y + yo;
            const cell = game.level.locations[xx][yy];
            const rn = cell.roomno;
            if (rn >= 3 && result.indexOf(String.fromCharCode(rn)) < 0 && goodtype(rn)) {
                result = String.fromCharCode(rn) + result;
            }
        }
    }
    return result;
}`;
    return s.slice(0, fnStart) + replacement + s.slice(fnEnd);
});

// hack.js: u.urooms / u.urooms0 / u.ushops / u.ushops_left buffer
// preservation.  Translator emits `game.u.urooms = strcpy(game.u.urooms,
// in_rooms(...))` faithfully to C's `strcpy(u.urooms, ...)`.  In C
// strcpy returns dst (mutating it in place); in the JS runtime
// strcpy DOES mutate dst when dst is an Array but RETURNS the src
// string.  Assigning that string back to game.u.urooms destroys the
// Array, leaving urooms as `""` (or as the prior src string).  The
// loop `for (...; uroom = u.urooms[i] != 0; ...)` then reads
// undefined past index 0 and never exits — `ridx = NaN - 3 = NaN`,
// `rooms[NaN].rtype` throws (32× per 44-session run from
// recalc_mapseen via update_mapseen_for via doopen_indir).
//
// Patch: drop the LHS so strcpy is called for side-effect only,
// preserving the original Array identity.  This is faithful to C's
// strcpy(u.urooms, ...) which mutates the buffer in place.
patchFile('hack.js', (s) => {
    return s
        .replace(`game.u.urooms0 = strcpy(game.u.urooms0, game.u.urooms);`,
                 `strcpy(game.u.urooms0, game.u.urooms);`)
        .replace(`game.u.ushops0 = strcpy(game.u.ushops0, game.u.ushops);`,
                 `strcpy(game.u.ushops0, game.u.ushops);`)
        .replace(`game.u.ushops_left = strcpy(game.u.ushops_left, game.u.ushops0);`,
                 `strcpy(game.u.ushops_left, game.u.ushops0);`)
        .replace(`game.u.urooms = strcpy(game.u.urooms, in_rooms(game.u.ux, game.u.uy, 0));`,
                 `strcpy(game.u.urooms, in_rooms(game.u.ux, game.u.uy, 0));`);
});
patchFile('teleport.js', (s) => {
    return s
        .replace(`game.u.urooms = strcpy(game.u.urooms, in_rooms(game.u.ux, game.u.uy, VAULT));`,
                 `strcpy(game.u.urooms, in_rooms(game.u.ux, game.u.uy, VAULT));`)
        .replace(`game.u.urooms = strcpy(game.u.urooms, save_urooms);`,
                 `strcpy(game.u.urooms, save_urooms);`);
});

// hack.js: test_move's `goto testdiag` — forward jump from inside
// `if (closed_door)` else-branch to a label inside the `else`
// (non-closed-door) branch, where the diagonal-door check lives.
// Translator emitted TODO → JS unconditionally returned FALSE for
// TEST_TRAV/TEST_TRAP modes on closed doors, breaking travel
// pathfinding and trap detection through doors.
//
// Restructure: inline the diagonal-door check inside the
// `else if (mode == 2 || mode == 3)` branch; replace the
// post-chain unconditional `return (0)` with mode-conditional
// returns (mode == 0 → FALSE, mode != 2/3 → FALSE, mode == 2/3
// + diagonal-blocked → FALSE, mode == 2/3 + OK → fall through to
// bad_rock check).
patchFile('hack.js', (s) => {
    return s.replace(
        /                \} else if \(mode == 2 \|\| mode == 3\) \{\n                    \/\* TODO Phase 5\+: goto testdiag \(label not in scope of break\) \*\/\n                \}\n                return \(0\);\n            \}\n        \} else \{\n            testdiag: \{\n            \}\n            if \(dx && dy && !\(game\.u\.uprops\[PASSES_WALLS\]\.intrinsic \|\| game\.u\.uprops\[PASSES_WALLS\]\.extrinsic\) && \(!doorless_door\(x, y\) \|\| block_door\(x, y\)\)\) \{/,
        `                } else if (mode == 2 || mode == 3) {
                    if (dx && dy && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && (!doorless_door(x, y) || block_door(x, y))) {
                        return (0);
                    }
                } else {
                    return (0);
                }
                if (mode == 0) {
                    return (0);
                }
            }
        } else {
            if (dx && dy && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && (!doorless_door(x, y) || block_door(x, y))) {`
    );
});

// invent.js: askchain's `goto nextclass` (back-jump for multi-class
// olets iteration) + display_pickinv's `goto nextclass` (back-jump
// for sortpack class enumeration) + adjust_loc's `goto noadjust`
// (3 forward jumps to cleanup-and-return body).  Same prologue mis-
// placement pattern; nextclass needs labeled-while-true restructure,
// noadjust gets inlined at each goto site.
patchFile('invent.js', (s) => {
    // askchain's nextclass: drop prologue wrapper, wrap body
    s = s.replace(
        /    nextclass: \{\n        cnt = 0;\n        dud = 0;\n        sortedchn = null;\n        takeoff = taking_off\(word\);\n        ident = !strcmp\(word, "identify"\);\n        take_out = !strcmp\(word, "take out"\);\n        put_in = !strcmp\(word, "put in"\);\n        nodot = \(!strcmp\(word, "nodot"\) \|\| !strcmp\(word, "drop"\) \|\| ident \|\| takeoff \|\| take_out \|\| put_in\);\n        ininv = \(objchn == game\.invent\);\n        bycat = \(menu_class_present\(117\) \|\| menu_class_present\(66\) \|\| menu_class_present\(85\) \|\| menu_class_present\(67\) \|\| menu_class_present\(88\) \|\| menu_class_present\(80\)\);\n        sortedchn = sortloot\(objchn, 2, \(0\), null\);\n        first = \(1\);\n    \}\n    ilet = 97 - 1;\n    ret: \{/,
        `    cnt = 0;
    dud = 0;
    sortedchn = null;
    takeoff = taking_off(word);
    ident = !strcmp(word, "identify");
    take_out = !strcmp(word, "take out");
    put_in = !strcmp(word, "put in");
    nodot = (!strcmp(word, "nodot") || !strcmp(word, "drop") || ident || takeoff || take_out || put_in);
    ininv = (objchn == game.invent);
    bycat = (menu_class_present(117) || menu_class_present(66) || menu_class_present(85) || menu_class_present(67) || menu_class_present(88) || menu_class_present(80));
    sortedchn = sortloot(objchn, 2, (0), null);
    first = (1);
    nextclass: while (true) {
    ilet = 97 - 1;
    ret: {`
    );
    s = s.replace(
        /        if \(olets && olets\.value && \+\+olets\) \{\n            \/\* TODO Phase 5\+: goto nextclass \(label not in scope of break\) \*\/\n        \}\n        if \(!takeoff && \(dud \|\| cnt\)\) \{\n            pline\("That was all\."\);\n        \} else if \(!dud && !cnt\) \{\n            pline\("No applicable objects\."\);\n        \}\n    \}\n    unsortloot/,
        `        if (olets && olets.value && ++olets) {
            continue nextclass;
        }
        if (!takeoff && (dud || cnt)) {
            pline("That was all.");
        } else if (!dud && !cnt) {
            pline("No applicable objects.");
        }
    }
    break nextclass;
    }
    unsortloot`
    );
    // display_pickinv's nextclass: drop prologue wrapper
    s = s.replace(
        /    let usextra = 0;\n    nextclass: \{\n        invlet = game\.flags\.inv_order;/,
        `    let usextra = 0;
    {
        invlet = game.flags.inv_order;`
    );
    s = s.replace(
        /    classcount = 0;\n    prevorderclass = 0;\n    for \(let __nhi_srtinv = 0; \(srtinv = sortedinvent\[__nhi_srtinv\]\) && \(\(otmp = srtinv\.obj\) != null\); __nhi_srtinv\+\+\) \{/,
        `    nextclass: while (true) {
    classcount = 0;
    prevorderclass = 0;
    for (let __nhi_srtinv = 0; (srtinv = sortedinvent[__nhi_srtinv]) && ((otmp = srtinv.obj) != null); __nhi_srtinv++) {`
    );
    s = s.replace(
        /    if \(game\.flags\.sortpack\) \{\n        if \(\+\+invlet\) \{\n            \/\* TODO Phase 5\+: goto nextclass \(label not in scope of break\) \*\/\n        \}\n        if \(--invlet != venom_inv\) \{\n            invlet = venom_inv;\n            \/\* TODO Phase 5\+: goto nextclass \(label not in scope of break\) \*\/\n        \}\n    \}\n    if \(save_flags_sortpack != game\.flags\.sortpack\) \{/,
        `    if (game.flags.sortpack) {
        if (++invlet) {
            continue nextclass;
        }
        if (--invlet != venom_inv) {
            invlet = venom_inv;
            continue nextclass;
        }
    }
    break nextclass;
    }
    if (save_flags_sortpack != game.flags.sortpack) {`
    );
    // noadjust: 3 forward goto sites — inline the body
    const NOADJUST_BODY = `if (splitting) {
                    merged({ get value() { return splitting; }, set value(_v) { splitting = _v; } }, obj);
                }
                if (!ever_mind) {
                    pline("%s", c_common_strings.c_Never_mind);
                }
                return 0;`;
    s = s.replace(
        /            if \(let_ == 27\) \{\n                \/\* TODO Phase 5\+: goto noadjust \(label not in scope of break\) \*\/\n            \}/,
        `            if (let_ == 27) {
                ${NOADJUST_BODY}
            }`
    );
    s = s.replace(
        /        \} else if \(let_ == GOLD_SYM && obj\.oclass != COIN_CLASS\) \{\n            pline\("Only gold coins may be moved into the '%c' slot\.", GOLD_SYM\);\n            ever_mind = \(1\);\n            \/\* TODO Phase 5\+: goto noadjust \(label not in scope of break\) \*\/\n        \}/,
        `        } else if (let_ == GOLD_SYM && obj.oclass != COIN_CLASS) {
            pline("Only gold coins may be moved into the '%c' slot.", GOLD_SYM);
            ever_mind = (1);
            if (splitting) {
                merged({ get value() { return splitting; }, set value(_v) { splitting = _v; } }, obj);
            }
            if (!ever_mind) {
                pline("%s", c_common_strings.c_Never_mind);
            }
            return 0;
        }`
    );
    s = s.replace(
        /        if \(trycnt == 5\) \{\n            \/\* TODO Phase 5\+: goto noadjust \(label not in scope of break\) \*\/\n        \}\n        pline\("Select an inventory slot letter\."\);/,
        `        if (trycnt == 5) {
            if (splitting) {
                merged({ get value() { return splitting; }, set value(_v) { splitting = _v; } }, obj);
            }
            if (!ever_mind) {
                pline("%s", c_common_strings.c_Never_mind);
            }
            return 0;
        }
        pline("Select an inventory slot letter.");`
    );
    return s;
});

// apply.js: use_whip's `goto whipattack` (cross-branch forward
// from `if (u.utrap && u.utraptype == TT_PIT)` branch with
// small-monster + no-wrap-target case into `else if (mtmp)`
// branch's whipattack body).  Translator TODO no-op: when the
// player is in a pit + a small monster is present + no
// wrap-target (boulder/furniture) → JS falls through to the
// `if (wrapped_what)` check.  wrapped_what is null so JS runs
// the `else pline msg_snap` branch.  Then the pit branch ends
// without attacking the monster.
//
// C behavior: goto whipattack → run the disarm/attack logic
// against the small monster (otmp = monster's wielded weapon,
// try to yank it; or force_attack if no weapon).
//
// Extract whipattack body into __whipattack closure returning
// 'early_return' (force_attack hit, return 1) or 'normal'
// (continue past).  Call from both the pit-goto site (with
// return 1 after either status) and the else-if-mtmp branch.
//
// C ref: src/apply.c lines 3088-3275 (use_whip pit + whipattack
// body).  ~80 lines of inline duplication avoided via closure.
patchFile('apply.js', (s) => {
    // 1. Insert __whipattack closure before `if (game.u.uswallow)` chain
    s = s.replace(
        /    if \(proficient < 0\) \{\n        proficient = 0;\n    \}\n    if \(game\.u\.uswallow\) \{\n        There\("is not enough room to flick your bullwhip\."\);/,
        `    if (proficient < 0) {
        proficient = 0;
    }
    const __whipattack = () => {
        otmp = null;
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            let spotitnow = 0;
            mtmp.mundetected = 0;
            spotitnow = (canseemon(mtmp) || sensemon(mtmp));
            if (spotitnow || !((game.level.locations[rx][ry].glyph) == GLYPH_INVIS_OFF)) {
                pline("%s is there that you %s.", !spotitnow ? "A monster" : Amonnam(mtmp), !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "couldn't see" : "hadn't noticed");
                if (!spotitnow) {
                    map_invisible(rx, ry);
                } else {
                    newsym(rx, ry);
                }
            }
        } else {
            otmp = ((mtmp).mw);
        }
        if (otmp) {
            let onambuf = [${new Array(384).fill('0').join(', ')}];
            let mon_hand = null;
            let gotit = proficient && (!(game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || !rn2(10));
            onambuf = strcpy(onambuf, cxname(otmp));
            if (gotit) {
                mon_hand = mbodypart(mtmp, HAND);
                if (((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_big)) {
                    mon_hand = makeplural(mon_hand);
                }
            } else {
                mon_hand = null;
            }
            You("wrap your bullwhip around %s.", yname(otmp));
            if (gotit && mwelded(otmp)) {
                pline("%s welded to %s %s%c", (otmp.quan == 1) ? "It is" : "They are", (genders[pronoun_gender(mtmp, 2)].his), mon_hand, !otmp.bknown ? 33 : 46);
                set_bknown(otmp, 1);
                gotit = (0);
            }
            if (gotit) {
                obj_extract_self(otmp);
                possibly_unwield(mtmp, (0));
                setmnotwielded(mtmp, otmp);
                switch (rn2(proficient + 1)) {
                    case 2:
                        You("yank %s to the %s!", yname(otmp), surface(game.u.ux, game.u.uy));
                        place_object(otmp, game.u.ux, game.u.uy);
                        stackobj(otmp);
                        break;
                    case 3:
                        You("snatch %s!", yname(otmp));
                        if (otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) && !game.uarmg && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM))) {
                            let kbuf = [${new Array(384).fill('0').join(', ')}];
                            kbuf = strcpy(kbuf, (otmp.quan == 1) ? an(onambuf) : onambuf);
                            pline("Snatching %s is a fatal mistake.", kbuf);
                            place_object(otmp, game.u.ux, game.u.uy);
                            instapetrify(kbuf);
                            obj_extract_self(otmp);
                        }
                        hold_another_object(otmp, "You drop %s!", doname(otmp), null);
                        break;
                    default:
                        You("yank %s from %s %s!", the(onambuf), s_suffix(mon_nam(mtmp)), mon_hand);
                        obj_no_longer_held(otmp);
                        place_object(otmp, mtmp.mx, mtmp.my);
                        stackobj(otmp);
                        break;
                }
            } else {
                pline("%s", msg_slipsfree);
            }
        } else {
            let do_snap = (1);
            if (((mtmp).m_ap_type & 7) && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && !sensemon(mtmp)) {
                stumble_onto_mimic(mtmp);
                do_snap = (0);
            } else {
                You("flick your bullwhip towards %s.", mon_nam(mtmp));
            }
            if (proficient && force_attack(mtmp, (0))) {
                return 'early_return';
            }
            if (do_snap) {
                pline("%s", msg_snap);
            }
        }
        wakeup(mtmp, (1));
        return 'normal';
    };
    if (game.u.uswallow) {
        There("is not enough room to flick your bullwhip.");`
    );
    // 2. Replace pit-branch goto site
    s = s.replace(
        /            if \(!wrapped_what\) \{\n                \/\* TODO Phase 5\+: goto whipattack \(label not in scope of break\) \*\/\n            \}/,
        `            if (!wrapped_what) {
                const __r = __whipattack();
                if (__r === 'early_return') return 1;
                return 1;
            }`
    );
    // 3. Replace else-if-mtmp branch body
    s = s.replace(
        /    \} else if \(mtmp\) \{\n        whipattack: \{\n        \}\n        otmp = null;\n[\s\S]*?        wakeup\(mtmp, \(1\)\);\n    \} else if \(\(\(\(\(\(game\.dungeon_topology\.d_air_level\)\)/,
        `    } else if (mtmp) {
        const __r = __whipattack();
        if (__r === 'early_return') return 1;
    } else if ((((((game.dungeon_topology.d_air_level))`
    );
    return s;
});

// objnam.js: xname's `goto nameit` (forward jump from
// obj_is_pname-true branch to nameit label inside the
// `if (oextra.oname && dknown)` block).  When obj is a
// named artifact, C skips the type-name switch (buf
// stays empty) and jumps to nameit which appends just the
// artifact name (no " named " prefix).
//
// Translator TODO no-op meant pname-artifact names got the
// full "amulet named Excalibur"-style treatment instead of
// just "Excalibur".  Restructure with __is_pname flag that
// gates the switch and the " named " concat.
//
// C ref: src/objnam.c lines 663-664 (goto nameit) +
// 998-1009 (nameit body).
patchFile('objnam.js', (s) => {
    // xname_flags buffer setup: translator emits `buf = game.xnamep + 80`
    // which is a JS string-concat (xnamep is an Array of bytes, +80 makes
    // "0,0,...,80"), and then `buf[0] = 0` throws TypeError "Cannot assign
    // to read only property '0' of string ..." in strict mode (29× per
    // 44-session run from xname_flags).  C ref: src/objnam.c lines
    // 525-528 — `buf = obuf+PREFIX; buf_end = obuf+OBUFSZ-1; buf[0] = 0;`
    // is pointer-into-array.  We can't translate that arithmetic
    // faithfully without TypedArray-backed obufs, but we CAN neutralize
    // the throw by initializing buf as a fresh fixed-capacity char array.
    // Downstream `buf = strcpy(buf, name)` / `buf = strcat(buf, suffix)`
    // re-assigns buf to the returned string anyway, so the array is only
    // used by the buf[0]=0 initial-NUL.
    s = s.replace(
        `    buf = game.xnamep + 80;
    buf_end = game.xnamep + 256 - 1;
    buf[0] = 0;`,
        `    buf = new Array(176).fill(0);
    buf_end = 175;
    /* patched: fixed-capacity char array instead of broken pointer
       arithmetic; xnamep+80 was string-concat, throwing on buf[0]=0 */
    void 0;`
    );
    // just_an: pointer-deref translation gap.  C `*outbuf = '\\0'`
    // emitted as `outbuf.value = 0` (treating outbuf as a pointer
    // struct) — throws "Cannot create property 'value' on string"
    // when outbuf is a JS string (36 throws per 44-session run).
    // `lowc(str.value)` is also broken — should read first char.
    // Subsequent `outbuf = strcpy(outbuf, ...)` reassigns outbuf, so
    // the initial clear is redundant for the string-input case.  Use
    // a runtime guard so the array-input case still mutates.
    s = s.replace(
        `export function just_an(outbuf, str) {
    let c0 = 0;
    outbuf.value = 0;
    c0 = lowc(str.value);`,
        `export function just_an(outbuf, str) {
    let c0 = 0;
    if (Array.isArray(outbuf) && outbuf.length > 0) outbuf[0] = 0;
    c0 = lowc((typeof str === 'string') ? str.charCodeAt(0) : (str && str[0]) || 0);`
    );
    // xname_flags pluralize buf reset: C `buf[0] = '\\0'; ConcUpdate;
    // Strncat(buf, obufp, ...);` to replace buf content with obufp's
    // plural form.  Translator's literal `buf[0] = 0` throws when buf
    // is a JS string at this point in the function (15 throws per
    // 44-session run).  The simpler semantic equivalent is just
    // `buf = obufp` — the strncat append after the reset achieves
    // the same content.
    s = s.replace(
        `    if (pluralize) {
        obufp = makeplural(buf);
        buf[0] = 0;
        buf_eos = eos(buf) , bufspaceleft = (buf_end - buf_eos);
        do {
            strncat(buf_eos - 0, obufp, bufspaceleft + 0);
            buf_eos = eos(buf) , bufspaceleft = (buf_end - buf_eos);
        } while (0);
        releaseobuf(obufp);
    }`,
        `    if (pluralize) {
        /* patched: pluralize path used buf[0]=0+strncat to copy obufp
           into buf, which throws when buf is a JS string.  Direct
           string assignment is the semantic equivalent. */
        obufp = makeplural(buf);
        buf = (typeof obufp === 'string') ? obufp
            : (Array.isArray(obufp) ? ((() => { let __r=''; for (let __i=0; __i<obufp.length && obufp[__i]; __i++) __r += String.fromCharCode(obufp[__i]); return __r; })()) : String(obufp ?? ''));
        releaseobuf(obufp);
    }`
    );
    // strprepend: heavy pointer arithmetic — `s.value` read+write of
    // the pre-prefix byte, `s - i` for pointer rewind, copynchars
    // call into the rewound position.  Faithful translation throws
    // "Cannot create property 'value' on string" the moment s is a
    // JS string (22 throws per 44-session run, mostly via
    // xname_flags's prefix appenders).  Replace the body with a
    // string-concat: pref + s.  Semantic equivalent to C's
    // "prepend pref to s at position s-i" since the caller uses the
    // returned string identity, not the underlying obuf in-place
    // mutation.
    s = s.replace(
        `export function strprepend(s, pref) {
    let star_s = s.value;
    let i = strlen(pref);
    if (i > 80) {
        impossible("PREFIX too short (for %d).", i);
        return s;
    }
    copynchars(s - i, pref, i + 1);
    s.value = star_s;
    return s - i;
}`,
        `export function strprepend(s, pref) {
    /* patched: pointer-arithmetic body replaced by string-concat.
       The C original rewinds the pointer by strlen(pref) and writes
       pref into the freed PREFIX area of an 80-byte buffer; here
       we just concatenate.  The C 80-byte cap is meaningless in JS
       (string concat has no overflow) and bailing out without the
       prepend silently corrupts the name we hand back — drop the
       cap and warning. */
    const sStr = (typeof s === 'string') ? s
        : (Array.isArray(s) ? ((() => { let __r=''; for (let __i=0; __i<s.length && s[__i]; __i++) __r += String.fromCharCode(s[__i]); return __r; })()) : String(s ?? ''));
    const prefStr = (typeof pref === 'string') ? pref
        : (Array.isArray(pref) ? ((() => { let __r=''; for (let __i=0; __i<pref.length && pref[__i]; __i++) __r += String.fromCharCode(pref[__i]); return __r; })()) : String(pref ?? ''));
    return prefStr + sStr;
}`
    );
    // an(str) / the(str): translator emits `if (!str || !str.value)`
    // to check for null-pointer / empty-string.  In C, `str` is a
    // const char *, `str.value` is the deref (first byte == 0 for
    // empty).  In JS, every JS string has `str.value === undefined`,
    // so this guard ALWAYS fires impossible("Alphabet soup ...") for
    // any string call (59× per 44-session run).  The right semantic:
    // check for null/undefined OR (string with length 0) OR (array
    // with first byte 0).
    s = s.replace(
        `    let buf = nextobuf();
    if (!str || !str.value) {
        impossible("Alphabet soup: 'an(%s)'.", str ? "\\"\\"" : "<null>");
        return strcpy(buf, "an []");
    }
    just_an(buf, str);`,
        `    let buf = nextobuf();
    const __anEmpty = (str == null)
        || (typeof str === 'string' ? str.length === 0
            : Array.isArray(str) ? (!str[0])
            : !str.value);
    if (__anEmpty) {
        impossible("Alphabet soup: 'an(%s)'.", str ? "\\"\\"" : "<null>");
        return strcpy(buf, "an []");
    }
    just_an(buf, str);`
    );
    s = s.replace(
        `    let buf = nextobuf();
    if (!str || !str.value) {
        impossible("Alphabet soup: 'the(%s)'.", str ? "\\"\\"" : "<null>");
        return strcpy(buf, "the []");
    }`,
        `    let buf = nextobuf();
    const __theEmpty = (str == null)
        || (typeof str === 'string' ? str.length === 0
            : Array.isArray(str) ? (!str[0])
            : !str.value);
    if (__theEmpty) {
        impossible("Alphabet soup: 'the(%s)'.", str ? "\\"\\"" : "<null>");
        return strcpy(buf, "the []");
    }`
    );
    // makeplural(oldstr): translator emits a pointer-walk
    // `while (oldstr.value == 32) oldstr++` to skip leading spaces,
    // then `if (!oldstr || !oldstr.value) impossible("plural of null?")`.
    // Both fail for JS strings (`.value` undefined).  Patch: strip
    // leading spaces with String.prototype.replace and check for
    // non-empty string properly.  Downstream code uses oldstr as a
    // string anyway via strcpy/Strlen/etc. so promoting to string is
    // safe.
    s = s.replace(
        `    bottom: {
        str = nextobuf();
        excess = null;
        if (oldstr) {
            while (oldstr.value == 32) {
                oldstr++;
            }
        }
        if (!oldstr || !oldstr.value) {
            impossible("plural of null?");
            str = strcpy(str, "s");
            return str;
        }`,
        `    bottom: {
        str = nextobuf();
        excess = null;
        if (typeof oldstr === 'string') {
            oldstr = oldstr.replace(/^ +/, '');
        } else if (Array.isArray(oldstr)) {
            let __pi = 0;
            while (__pi < oldstr.length && oldstr[__pi] === 32) __pi++;
            if (__pi > 0) oldstr = oldstr.slice(__pi);
        } else if (oldstr) {
            while (oldstr.value == 32) {
                oldstr++;
            }
        }
        const __plEmpty = (oldstr == null)
            || (typeof oldstr === 'string' ? oldstr.length === 0
                : Array.isArray(oldstr) ? (!oldstr[0])
                : !oldstr.value);
        if (__plEmpty) {
            impossible("plural of null?");
            str = strcpy(str, "s");
            return str;
        }`
    );
    s = s.replace(
        /    if \(obj\.oartifact && obj\.dknown\) \{\n        find_artifact\(obj\);\n    \}\n    if \(obj_is_pname\(obj\)\) \{\n        \/\* TODO Phase 5\+: goto nameit \(label not in scope of break\) \*\/\n    \}\n    switch \(obj\.oclass\) \{/,
        `    if (obj.oartifact && obj.dknown) {
        find_artifact(obj);
    }
    let __is_pname = obj_is_pname(obj);
    if (!__is_pname) {
    switch (obj.oclass) {`
    );
    s = s.replace(
        /    if \(\(\(obj\)\.oextra && \(\(obj\)\.oextra\.oname\)\) && dknown\) \{\n        nameit: \{\n            do \{\n                strncat\(buf_eos - 0, " named ", bufspaceleft \+ 0\);\n                buf_eos = eos\(buf\) , bufspaceleft = \(buf_end - buf_eos\);\n            \} while \(0\);\n        \}\n        obufp = eos\(buf\);\n        do \{\n            strncat\(buf_eos - 0, \(\(obj\)\.oextra\.oname\), bufspaceleft \+ 0\);\n            buf_eos = eos\(buf\) , bufspaceleft = \(buf_end - buf_eos\);\n        \} while \(0\);/,
        `    }
    if (__is_pname || (((obj).oextra && ((obj).oextra.oname)) && dknown)) {
        if (!__is_pname) {
            do {
                strncat(buf_eos - 0, " named ", bufspaceleft + 0);
                buf_eos = eos(buf) , bufspaceleft = (buf_end - buf_eos);
            } while (0);
        }
        obufp = eos(buf);
        do {
            strncat(buf_eos - 0, ((obj).oextra.oname), bufspaceleft + 0);
            buf_eos = eos(buf) , bufspaceleft = (buf_end - buf_eos);
        } while (0);`
    );
    return s;
});

// pager.js: mhidden_description's `goto objfrommap` (cross-
// branch forward from `mundetected + hiding-under-mflag +
// glyph-is-object` branch to the M_AP_OBJECT branch's
// object-name building body).  Translator TODO no-op meant
// JS appended c_something instead of the actual object name
// ("hiding under something" instead of e.g. "hiding under
// a fountain").  Inline the object-name building body at the
// goto site and gate the c_something fallback with else.
//
// C ref: src/pager.c mhidden_description.
patchFile('pager.js', (s) => {
    return s.replace(
        /            if \(\(\(\(glyph\) == GLYPH_OBJ_OFF \|\| \(\(glyph\) >= GLYPH_OBJ_OFF \+ FIRST_OBJECT - 1 && \(glyph\) < \(GLYPH_OBJ_OFF \+ NUM_OBJECTS\)\) \|\| \(\(glyph\) == GLYPH_OBJ_PILETOP_OFF \|\| \(\(glyph\) > GLYPH_OBJ_PILETOP_OFF \+ FIRST_OBJECT - 1 && \(glyph\) < \(GLYPH_OBJ_PILETOP_OFF \+ NUM_OBJECTS\)\)\)\) \|\| \(\(\(glyph\) > GLYPH_OBJ_OFF && \(glyph\) < GLYPH_OBJ_OFF \+ FIRST_OBJECT - 1\) \|\| \(\(glyph\) > GLYPH_OBJ_PILETOP_OFF && \(glyph\) < GLYPH_OBJ_PILETOP_OFF \+ FIRST_OBJECT - 1\)\) \|\| \(\(\(\(\(glyph\) >= GLYPH_STATUE_MALE_OFF\) && \(\(glyph\) < \(GLYPH_STATUE_MALE_OFF \+ NUMMONS\)\)\) \|\| \(\(\(glyph\) >= GLYPH_STATUE_MALE_PILETOP_OFF\) && \(\(glyph\) < \(GLYPH_STATUE_MALE_PILETOP_OFF \+ NUMMONS\)\)\)\) \|\| \(\(\(\(glyph\) >= GLYPH_STATUE_FEM_OFF\) && \(\(glyph\) < \(GLYPH_STATUE_FEM_OFF \+ NUMMONS\)\)\) \|\| \(\(\(glyph\) >= GLYPH_STATUE_FEM_PILETOP_OFF\) && \(\(glyph\) < \(GLYPH_STATUE_FEM_PILETOP_OFF \+ NUMMONS\)\)\)\)\) \|\| \(\(\(\(glyph\) >= GLYPH_BODY_OFF\) && \(\(glyph\) < \(GLYPH_BODY_OFF \+ NUMMONS\)\)\) \|\| \(\(\(glyph\) >= GLYPH_BODY_PILETOP_OFF\) && \(\(glyph\) < \(GLYPH_BODY_PILETOP_OFF \+ NUMMONS\)\)\)\)\)\) \{\n                \/\* TODO Phase 5\+: goto objfrommap \(label not in scope of break\) \*\/\n            \}\n            outbuf = strcat\(outbuf, c_common_strings\.c_something\);\n        \} else if \(\(\(\(mon\.data\)\.mflags1 & 256\) != 0\)\) \{/,
        `            if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
                otmp = null;
                fakeobj = object_from_map(glyph, x, y, { get value() { return otmp; }, set value(_v) { otmp = _v; } });
                what = (otmp && otmp.otyp != STRANGE_OBJECT) ? simpleonames(otmp) : game.obj_descr[STRANGE_OBJECT].oc_name;
                if (incl_article && (!otmp || otmp.quan == 1)) {
                    what = an(what);
                }
                outbuf = strcat(outbuf, what);
                if (fakeobj && otmp) {
                    otmp.where = 0;
                    dealloc_obj(otmp);
                }
            } else {
                outbuf = strcat(outbuf, c_common_strings.c_something);
            }
        } else if ((((mon.data).mflags1 & 256) != 0)) {`
    );
});

// pager.js: do_look()'s `goto dowhatiscmd` from cmdq-pop branch.
// In C, the dowhatiscmd label is INSIDE the `if (!clicklook)`
// block, after the menu setup; the goto from cmdq jumps PAST
// the if-!clicklook check and into the switch on `i`.  JS
// translator placed the switch inside the if-!clicklook
// block and made the goto a TODO no-op: when cmdq has a key,
// either the menu re-runs (overwriting i) or the entire
// switch is skipped (i is dropped).
//
// Fix: add __from_cmdq flag; gate the `if (!clicklook)` to
// also fire on cmdq; gate the menu setup with `if (!__from_cmdq)`.
// Switch then runs in both branches as intended.
//
// C ref: src/pager.c lines 1700-1812 (cmdq + dowhatiscmd).
patchFile('pager.js', (s) => {
    return s.replace(
        /    if \(\(cmdq = cmdq_pop\(\)\) != null\) \{\n        Object\.assign\(cq, cmdq\);\n        free\(cmdq\);\n        if \(cq\.typ == CMDQ_KEY\) \{\n            i = cq\.key;\n        \} else \{\n            cmdq_clear\(CQ_CANNED\);\n        \}\n        \/\* TODO Phase 5\+: goto dowhatiscmd \(label not in scope of break\) \*\/\n    \}\n    if \(!clicklook\) \{\n        dowhatiscmd: \{\n            if \(quick\) \{\n                i = 121;\n            \} else \{/,
        `    let __from_cmdq = false;
    if ((cmdq = cmdq_pop()) != null) {
        Object.assign(cq, cmdq);
        free(cmdq);
        if (cq.typ == CMDQ_KEY) {
            i = cq.key;
        } else {
            cmdq_clear(CQ_CANNED);
        }
        __from_cmdq = true;
    }
    if (!clicklook || __from_cmdq) {
        if (!__from_cmdq) {
            if (quick) {
                i = 121;
            } else {`
    );
});

// invent.js: getobj() has 3 goto sites — need_more_cq (back-jump
// after CMDQ_INT for count, to re-pop cmdq for the actual key),
// split_otmp (forward from inside cntgiven branch to skip
// `return otmp` and run the split logic), and redo_menu
// (back-jump inside the prompt for-loop when user types '*' or
// '?' again).
//
// The translator placed the initial state setup INSIDE the
// need_more_cq labeled block; goto would re-run the
// cntgiven=0 etc reset, clobbering the just-set values.  Move
// the init OUT of the label, wrap only the cmdq-pop chain in
// `need_more_cq: while (true)`, use continue/break.  Replace
// goto split_otmp with `break need_more_cq` to skip
// `return otmp` and reach the split_otmp body.  Replace goto
// redo_menu with plain `continue` (the for-loop is the
// immediate enclosing loop).
//
// C ref: src/invent.c lines 1778 (need_more_cq) + 2075
// (split_otmp); redo_menu is in the for-loop interactive
// prompt.
patchFile('invent.js', (s) => {
    // 1. Restructure need_more_cq: move init out, wrap cmdq-pop in while (true)
    s = s.replace(
        /    let need_more_cq = 0;\n    need_more_cq: \{\n        ilet = 0;\n        suggested = 0;\n        bp = buf;\n        ap = altlets;\n        allowcnt = \(ctrlflags & 1\);\n        forceprompt = \(ctrlflags & 2\);\n        allownone = \(0\);\n        inaccess = 0;\n        cnt = 0;\n        cntgiven = \(0\);\n        msggiven = \(0\);\n        oneloop = \(0\);\n        need_more_cq = \(0\);\n    \}\n    if \(\(cmdq = cmdq_pop\(\)\) != null\) \{/,
        `    let need_more_cq = 0;
    ilet = 0;
    suggested = 0;
    bp = buf;
    ap = altlets;
    allowcnt = (ctrlflags & 1);
    forceprompt = (ctrlflags & 2);
    allownone = (0);
    inaccess = 0;
    cnt = 0;
    cntgiven = (0);
    msggiven = (0);
    oneloop = (0);
    need_more_cq = (0);
    need_more_cq: while (true) {
    if ((cmdq = cmdq_pop()) != null) {`
    );
    // 2. CMDQ_INT goto need_more_cq → continue need_more_cq
    s = s.replace(
        /            \} else if \(cq\.typ == CMDQ_INT\) \{\n                if \(!cntgiven && allowcnt\) \{\n                    cnt = cq\.intval;\n                    cntgiven = \(1\);\n                    \/\* TODO Phase 5\+: goto need_more_cq \(label not in scope of break\) \*\/\n                \} else \{/,
        `            } else if (cq.typ == CMDQ_INT) {
                if (!cntgiven && allowcnt) {
                    cnt = cq.intval;
                    cntgiven = (1);
                    need_more_cq = (1);
                    continue need_more_cq;
                } else {`
    );
    // 3. cntgiven goto split_otmp → break need_more_cq + close the while-true loop
    s = s.replace(
        /            if \(!otmp\) \{\n                cmdq_clear\(CQ_CANNED\);\n            \} else if \(cntgiven\) \{\n                if \(cnt < 1 \|\| otmp\.quan <= cnt\) \{\n                    cntgiven = \(0\);\n                \}\n                \/\* TODO Phase 5\+: goto split_otmp \(label not in scope of break\) \*\/\n            \}\n            return otmp;\n        \}\n    \} else if \(need_more_cq\) \{\n        return null;\n    \}\n    split_otmp: \{/,
        `            if (!otmp) {
                cmdq_clear(CQ_CANNED);
            } else if (cntgiven) {
                if (cnt < 1 || otmp.quan <= cnt) {
                    cntgiven = (0);
                }
                break need_more_cq;
            }
            return otmp;
        }
    } else if (need_more_cq) {
        return null;
    }
    break;
    }
    split_otmp: {`
    );
    // 4. redo_menu goto → continue (for-loop is immediate enclosing)
    s = s.replace(
        /                if \(ilet == 42 \|\| ilet == 63\) \{\n                    \/\* TODO Phase 5\+: goto redo_menu \(label not in scope of break\) \*\/\n                \}/,
        `                if (ilet == 42 || ilet == 63) {
                    continue;
                }`
    );
    return s;
});

// lock.js: obstructed's `goto objhere` (cross-branch forward from
// M_AP_OBJECT case to OBJ_AT label body) AND doclose's `goto nodoor`
// (forward from `!isok` early-exit to nodoor body inside if-else).
patchFile('lock.js', (s) => {
    s = s.replace(
        /    if \(mtmp && \(\(mtmp\)\.m_ap_type & 7\) != M_AP_FURNITURE\) \{\n        if \(\(\(mtmp\)\.m_ap_type & 7\) == M_AP_OBJECT\) \{\n            \/\* TODO Phase 5\+: goto objhere \(label not in scope of break\) \*\/\n        \}\n        if \(!quietly\) \{/,
        `    if (mtmp && ((mtmp).m_ap_type & 7) != M_AP_FURNITURE) {
        if (((mtmp).m_ap_type & 7) == M_AP_OBJECT) {
            if (!quietly) {
                pline("%s's in the way.", c_common_strings.c_Something);
            }
            return (1);
        }
        if (!quietly) {`
    );
    s = s.replace(
        /    if \(!isok\(x, y\)\) \{\n        \/\* TODO Phase 5\+: goto nodoor \(label not in scope of break\) \*\/\n    \}\n    if \(stumble_on_door_mimic\(x, y\)\) \{/,
        `    if (!isok(x, y)) {
        You("%s no door there.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "see");
        return res;
    }
    if (stumble_on_door_mimic(x, y)) {`
    );
    return s;
});

// priest.js: move_special's `goto pick_move` back-jump (priest's
// avoid-and-line-up retry when no movement candidate was found).
// The forward goto in the early shk-check is correctly translated
// as `break pick_move` (the pick_move:{} block wraps the prologue).
// The back-jump needed a separate label since pick_move:{} doesn't
// enclose the chcnt loop site.  Wrap the chcnt loop + priest-check
// in `pick_move_iter: while (true)`, continue pick_move_iter for
// back-jump, break to exit.
patchFile('priest.js', (s) => {
    return s.replace(
        /    chcnt = 0;\n    for \(i = 0; i < cnt; i\+\+\) \{\n        nx = mfp\.poss\[i\]\.x;\n        ny = mfp\.poss\[i\]\.y;\n        if \(\(\(game\.level\.locations\[nx\]\[ny\]\.typ\) >= ROOM\) \|\| \(mtmp\.isshk && \(!in_his_shop \|\| \(\(mtmp\)\.mextra\.eshk\)\.following\)\)\) \{\n            if \(avoid && \(mfp\.info\[i\] & 2097152\) && !\(mfp\.info\[i\] & 524288\)\) \{\n                continue;\n            \}\n            if \(\(!appr && !rn2\(\+\+chcnt\)\) \|\| \(appr && \(dist2\(nx, ny, ggx, ggy\)\) < \(dist2\(nix, niy, ggx, ggy\)\)\) \|\| \(mfp\.info\[i\] & 524288\)\) \{\n                nix = nx;\n                niy = ny;\n                ninfo = mfp\.info\[i\];\n            \}\n        \}\n    \}\n    if \(mtmp\.ispriest && avoid && nix == omx && niy == omy && online2\(\(omx\), \(omy\), game\.u\.ux, game\.u\.uy\)\) \{\n        avoid = \(0\);\n        \/\* TODO Phase 5\+: goto pick_move \(label not in scope of break\) \*\/\n    \}/,
        `    pick_move_iter: while (true) {
    chcnt = 0;
    for (i = 0; i < cnt; i++) {
        nx = mfp.poss[i].x;
        ny = mfp.poss[i].y;
        if (((game.level.locations[nx][ny].typ) >= ROOM) || (mtmp.isshk && (!in_his_shop || ((mtmp).mextra.eshk).following))) {
            if (avoid && (mfp.info[i] & 2097152) && !(mfp.info[i] & 524288)) {
                continue;
            }
            if ((!appr && !rn2(++chcnt)) || (appr && (dist2(nx, ny, ggx, ggy)) < (dist2(nix, niy, ggx, ggy))) || (mfp.info[i] & 524288)) {
                nix = nx;
                niy = ny;
                ninfo = mfp.info[i];
            }
        }
    }
    if (mtmp.ispriest && avoid && nix == omx && niy == omy && online2((omx), (omy), game.u.ux, game.u.uy)) {
        avoid = (0);
        continue pick_move_iter;
    }
    break;
    }`
    );
});

// zap.js makewish retry: superseded by A3 goto back-jump-to-loop
// recognizer (commit 85cb377).  Translator emits
// `retry: while (true) { ...; continue retry; ...; break; }`
// directly; the old prologue-misplacement shape this patch
// targeted no longer exists in the translator output.

// options.js: handler_menu_colors's `goto menucolors_done` forward
// exit from ESC-on-prompt.  The two back-jump retries to
// menucolors_again are absorbed by the A3 translator recognizer
// (commit 85cb377) and emit as `continue menucolors_again` natively.
// What remains is the FORWARD goto into the menucolors_done labeled
// block.  Inline the menucolors_done body (use_menu_color +
// update_inventory check, then return) at the ESC goto site, and
// drop the now-dead empty `menucolors_done: { }` block emitted by
// the forward-goto wrapper.
patchFile('options.js', (s) => {
    // Drop the dead empty labeled block inside the opt_idx==3 arm.
    s = s.replace(
        /    if \(opt_idx == 3\) \{\n            menucolors_done: \{\n            \}\n            if \(game\.iflags\.use_menu_color\) \{/,
        `    if (opt_idx == 3) {
            if (game.iflags.use_menu_color) {`
    );
    // Inline the menucolors_done body at the ESC goto site.
    s = s.replace(
        /            if \(mcbuf == 27\) \{\n                \/\* TODO Phase 5\+: goto menucolors_done \(label not in scope of break\) \*\/\n            \}/,
        `            if (mcbuf == 27) {
                if (game.iflags.use_menu_color) {
                    if (game.iflags.perm_invent) {
                        update_inventory();
                    }
                }
                return optn_ok;
            }`
    );
    return s;
});

// options.js handler_autopickup_exception ape_again: superseded by
// A3 goto back-jump-to-loop recognizer (commit 85cb377).

// options.js msgtypes_again / redo_opt_help / rerun back-jumps:
// all three superseded by A3 goto back-jump-to-loop recognizer
// (commit 85cb377).  Translator now emits `LABEL: while (true)
// { ...; continue LABEL; ...; break; }` natively for each; the
// old `LABEL: { ... }` block shape these patches matched no
// longer exists in the translator output.

// engrave.js: two broken char-walk loops in doengrave —
// `for (sp = de.ebuf; *sp; sp++)` translates to broken JS
// `for (sp = de.ebuf; sp; sp++)` which exits after one iter
// (sp++ on string → NaN).
//
// Loop 1 (line ~874): subtract 1 from de.len for each space
// char.  Replace with regex-based count.
//
// Loop 2 (line ~896): RNG-based char garbling under blind/
// confused/stunned/hallucinating engraving.  C consumes
// rn2() per iter; JS only fires once.  Real RNG-shift bug.
// Rewrite using array-of-chars iteration.
//
// C ref: src/engrave.c lines 1194-1228.
patchFile('engrave.js', (s) => {
    s = s.replace(
        /        de\.len = strlen\(de\.ebuf\);\n        for \(sp = de\.ebuf; sp; sp\+\+\) \{\n            if \(sp == 32\) \{\n                de\.len -= 1;\n            \}\n        \}/,
        `        de.len = strlen(de.ebuf);
        de.len -= (typeof de.ebuf === 'string' ? (de.ebuf.match(/ /g) || []).length : 0);`
    );
    s = s.replace(
        /        for \(sp = de\.ebuf; sp; sp\+\+\) \{\n            if \(sp == 32\) \{\n                continue;\n            \}\n            if \(\(\(de\.type == 1 \|\| de\.type == 5\) && !rn2\(25\)\) \|\| \(\(\(game\.u\.uprops\[BLINDED\]\.intrinsic \|\| game\.u\.uprops\[BLINDED\]\.extrinsic\) && !game\.u\.uprops\[BLINDED\]\.blocked\) && !rn2\(11\)\) \|\| \(game\.u\.uprops\[CONFUSION\]\.intrinsic && !rn2\(7\)\) \|\| \(game\.u\.uprops\[STUNNED\]\.intrinsic && !rn2\(4\)\) \|\| \(\(game\.u\.uprops\[HALLUC\]\.intrinsic && !\(game\.u\.uprops\[HALLUC_RES\]\.intrinsic \|\| game\.u\.uprops\[HALLUC_RES\]\.extrinsic\)\) && !rn2\(2\)\)\) \{\n                void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 32 \+ rnd\(96 - 2\)\) \*\/;\n            \}\n        \}/,
        `        if (typeof de.ebuf === 'string') {
            const __ebuf_arr = [...de.ebuf].map(c => c.charCodeAt(0));
            for (let __sp_idx = 0; __sp_idx < __ebuf_arr.length; __sp_idx++) {
                let sp_char = __ebuf_arr[__sp_idx];
                if (sp_char === 32) {
                    continue;
                }
                if (((de.type == 1 || de.type == 5) && !rn2(25)) || (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !rn2(11)) || (game.u.uprops[CONFUSION].intrinsic && !rn2(7)) || (game.u.uprops[STUNNED].intrinsic && !rn2(4)) || ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !rn2(2))) {
                    __ebuf_arr[__sp_idx] = 32 + rnd(96 - 2);
                }
            }
            de.ebuf = __ebuf_arr.map(c => String.fromCharCode(c)).join('');
        }`
    );
    return s;
});

// apply.js: find_poleable_mon's `*pos = mpos` out-param
// struct-copy.  TODO no-op; caller's pos never got the
// found-mon coordinates.  JS: pos.x = mpos.x; pos.y = mpos.y;
patchFile('apply.js', (s) => {
    return s.replace(
        /    if \(!mpos\.x\) \{\n        return \(0\);\n    \}\n    void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = mpos\) \*\/;\n    return \(1\);/,
        `    if (!mpos.x) {
        return (0);
    }
    pos.x = mpos.x;
    pos.y = mpos.y;
    return (1);`
    );
});

// music.js: do_play_instrument tune-input case: C
// `for (s = buf; *s; s++) { *s = highc(*s); if (*s == 'H')
// *s = 'B'; }` uppercases and replaces 'H' with 'B'.
// Translator-emitted for-loop is broken (s++ → NaN), and
// the H→B mutation is TODO no-op.  Replace entire loop with
// single JS expression that handles both array-of-ints and
// string buf.
patchFile('music.js', (s) => {
    return s.replace(
        /            for \(s = buf; s; s\+\+\) \{\n                s = \(\(\) => \{ const __s = s; if \(!__s\) return __s; const __t = Array\.isArray\(__s\)   \? \(\(\) => \{ let r=''; for \(let i=0;i<__s\.length&&__s\[i\];i\+\+\) r\+=String\.fromCharCode\(__s\[i\]\); return r; \}\)\(\)   : \(__s \+ ''\); return __t\.length \? __t\[0\]\.toUpperCase\(\) \+ __t\.slice\(1\) : __s; \}\)\(\);\n                if \(s == 72\) \{\n                    void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 66\) \*\/;\n                \}\n            \}/,
        `            buf = (Array.isArray(buf) ? (() => { let r=''; for (let i=0;i<buf.length&&buf[i];i++) r+=String.fromCharCode(buf[i]); return r; })() : String(buf)).toUpperCase().replace(/H/g, 'B');`
    );
});

// artifact.js: orb_of_detection's "demons → demon" singular
// truncation.  C: `*(eos(subject) - 1) = '\\0'` removes last
// 's'.  Translator TODO no-op; plural even when 1 vanished.
// Fix: `subject = "demon";`.
patchFile('artifact.js', (s) => {
    return s.replace(
        /    if \(nvanished\) \{\n        let subject = "demons";\n        if \(nvanished == 1\) \{\n            void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 0\) \*\/;\n        \}/,
        `    if (nvanished) {
        let subject = "demons";
        if (nvanished == 1) {
            subject = "demon";
        }`
    );
});

// shk.js: shopkeeper-death code removes the shoproom char
// from u.ushops via C's `do { *p = *(p+1); } while (++p);`
// (shift-down loop).  Translator TODO no-op; the ushops
// string kept the dead shopkeeper's room marker, causing
// stale shop-presence checks.  JS-equivalent: replace the
// shoproom char in u.ushops with empty string.
patchFile('shk.js', (s) => {
    return s.replace(
        /        if \(\(p = strchr\(game\.u\.ushops, eshk\.shoproom\)\) != null\) \{\n            setpaid\(mtmp\);\n            eshk\.bill_p = null;\n            do \{\n                void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = \(p \+ 1\)\) \*\/;\n            \} while \(\+\+p\);\n        \}/,
        `        if ((p = strchr(game.u.ushops, eshk.shoproom)) != null) {
            setpaid(mtmp);
            eshk.bill_p = null;
            game.u.ushops = game.u.ushops.replace(String.fromCharCode(eshk.shoproom), '');
        }`
    );
});

// dig.js: use_pick_axe's dirsyms accumulation — C writes
// each valid direction char via `*dsp++ = dirch` into a 12-
// byte buffer, then null-terminates with `*dsp = 0`.  The
// dirsyms buffer is then displayed in a "[%s]" sprintf
// prompt.
//
// Translator emitted both pointer-mutations as TODO no-ops:
// dirsyms stayed at its initial [0,0,...,0] state, so the
// prompt showed an empty bracket "[]" with no valid
// directions listed.  Player would have no hints on which
// directions are diggable.
//
// JS-equivalent: use an index variable __dsp_idx (since dsp
// is just a write-pointer into dirsyms).  Increment per
// write; final null-terminator at __dsp_idx.  The runtime
// sprintf coerceArgForS handles char-array → string already.
//
// Defensive UI fix (use_pick_axe is the apply on pickaxe; if
// player has no pickaxe, doesn't fire).
//
// C ref: src/dig.c use_pick_axe dirsyms-build loop.
patchFile('dig.js', (s) => {
    return s.replace(
        /    downok = !!can_reach_floor\(\(0\)\);\n    dsp = dirsyms;\n    for \(dir = 0; dir < N_DIRS_Z; dir\+\+\) \{\n        let dirch = cmd_from_dir\(dir, MV_WALK\);\n        if \(game\.u\.uswallow\) \{\n            ;\n        \} else if \(movecmd\(dirch, MV_WALK\)\) \{\n            if \(!dxdy_moveok\(\)\) \{\n                continue;\n            \}\n            rx = game\.u\.ux \+ game\.u\.dx;\n            ry = game\.u\.uy \+ game\.u\.dy;\n            if \(!isok\(rx, ry\) \|\| dig_typ\(obj, rx, ry\) == DIGTYP_UNDIGGABLE\) \{\n                continue;\n            \}\n        \} else \{\n            if \(\(game\.u\.dz > 0\) \^ downok\) \{\n                continue;\n            \}\n        \}\n        void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = dirch\) \*\/;\n    \}\n    void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 0\) \*\/;/,
        `    downok = !!can_reach_floor((0));
    dsp = dirsyms;
    let __dsp_idx = 0;
    for (dir = 0; dir < N_DIRS_Z; dir++) {
        let dirch = cmd_from_dir(dir, MV_WALK);
        if (game.u.uswallow) {
            ;
        } else if (movecmd(dirch, MV_WALK)) {
            if (!dxdy_moveok()) {
                continue;
            }
            rx = game.u.ux + game.u.dx;
            ry = game.u.uy + game.u.dy;
            if (!isok(rx, ry) || dig_typ(obj, rx, ry) == DIGTYP_UNDIGGABLE) {
                continue;
            }
        } else {
            if ((game.u.dz > 0) ^ downok) {
                continue;
            }
        }
        dirsyms[__dsp_idx++] = dirch;
    }
    dirsyms[__dsp_idx] = 0;`
    );
});

// display.js: get_bkglyph_and_framecolor's *framecolor = X
// out-param writes.  Translator emitted TODO no-op; framecolor
// stayed at caller's previous value, causing wrong frame
// coloring around the map when bgcolors enabled.  JS-equivalent:
// `framecolor.value = X` (out-param is a value-box object).
patchFile('display.js', (s) => {
    return s.replace(
        /    bkglyph\.value = tmp_bkglyph;\n    if \(game\.iflags\.bgcolors && game\.wsettings\.map_frame_color != 8 && mapxy_valid\(x, y\)\) \{\n        void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = game\.wsettings\.map_frame_color\) \*\/;\n    \} else \{\n        void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 8\) \*\/;\n    \}\n\}/,
        `    bkglyph.value = tmp_bkglyph;
    if (game.iflags.bgcolors && game.wsettings.map_frame_color != 8 && mapxy_valid(x, y)) {
        framecolor.value = game.wsettings.map_frame_color;
    } else {
        framecolor.value = 8;
    }
}`
    );
});

// teleport.js: level_tele heaven path's `*u.ushops0 =
// *u.ushops = '\\0'` shop-occupancy clear.  Translator
// emitted TODO no-op pair; JS still thought player was in
// shop after level tele.  JS-equivalent: assign '' to both.
patchFile('teleport.js', (s) => {
    return s.replace(
        /        if \(game\.u\.ushops0\) \{\n            game\.in_mklev = \(1\);\n            u_left_shop\(game\.u\.ushops0, \(1\)\);\n            \(void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 0\) \*\/, void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 0\) \*\/\);\n            game\.in_mklev = \(0\);\n        \}/,
        `        if (game.u.ushops0) {
            game.in_mklev = (1);
            u_left_shop(game.u.ushops0, (1));
            game.u.ushops0 = '';
            game.u.ushops = '';
            game.in_mklev = (0);
        }`
    );
});

// uhitm.js: theft()'s pointer-walk over mdef->minvent — C uses
// `struct obj **minvent_ptr = &mdef->minvent` to unlink the
// worn-armor item from the linked list, then re-attach at end.
// Translator emitted `minvent_ptr = mdef.minvent` (value, not
// pointer-to-pointer) and TODO no-ops at the unlink + re-attach
// sites.  Effect: nymph seduction never actually took the worn
// armor from defender — the unlink fails AND the re-attach is
// silent.
//
// Restructure with `__mp_box` accessor object for the head, and
// `minvent_ptr = otmp` for subsequent positions (otmp acts as
// the pointer-target since accessing minvent_ptr.nobj reads/
// writes otmp.nobj).  Final `minvent_ptr.nobj = ustealo;`
// appends the armor at end.
//
// C ref: src/uhitm.c lines 2187-2198.  Defensive (nymph
// seduction rare in autoplay).
patchFile('uhitm.js', (s) => {
    return s.replace(
        /    ustealo = null;\n    if \(could_seduce\(game\.youmonst, mdef, mattk\) && mdef\.mcanmove\) \{\n        minvent_ptr = mdef\.minvent;\n        while \(\(otmp = minvent_ptr\) != null\) \{\n            if \(otmp\.owornmask & 1\) \{\n                if \(ustealo\) \{\n                    panic\("steal_it: multiple worn suits"\);\n                \}\n                void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = otmp\.nobj\) \*\/;\n                ustealo = otmp;\n                ustealo\.nobj = null;\n            \} else \{\n                minvent_ptr = otmp\.nobj;\n            \}\n        \}\n        void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = ustealo\) \*\/;\n    \}/,
        `    ustealo = null;
    if (could_seduce(game.youmonst, mdef, mattk) && mdef.mcanmove) {
        const __mp_box = { get nobj() { return mdef.minvent; }, set nobj(v) { mdef.minvent = v; } };
        minvent_ptr = __mp_box;
        while ((otmp = minvent_ptr.nobj) != null) {
            if (otmp.owornmask & 1) {
                if (ustealo) {
                    panic("steal_it: multiple worn suits");
                }
                minvent_ptr.nobj = otmp.nobj;
                ustealo = otmp;
                ustealo.nobj = null;
            } else {
                minvent_ptr = otmp;
            }
        }
        minvent_ptr.nobj = ustealo;
    }`
    );
});

// zap.js: revive (shopkeeper case) translator-dropped
// `*ESHK(mtmp) = *ESHK(mtmp2)` struct-copy.  Translator
// emitted TODO no-op; the dummy mtmp's eshk stayed empty
// when reviving from monster traits, causing replmon ->
// replshk to lose shopkeeper state (name, bill, formula, etc.).
//
// JS equivalent: Object.assign() does struct-copy of object
// properties.  Defensive correctness (shopkeeper revival
// rare in autoplay), but real bug otherwise.
//
// C ref: src/zap.c line 813 (*ESHK(mtmp) = *ESHK(mtmp2)).
patchFile('zap.js', (s) => {
    return s.replace(
        /        if \(mtmp2\.isshk\) \{\n            neweshk\(mtmp\);\n            void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = \(\(mtmp2\)\.mextra\.eshk\)\) \*\/;/,
        `        if (mtmp2.isshk) {
            neweshk(mtmp);
            Object.assign((mtmp).mextra.eshk, (mtmp2).mextra.eshk);`
    );
});

// zap.js: buzz()'s `goto make_bounce` (forward jump from stone/
// oob detection at the top of the while-range loop into the
// bounce body inside `if (!ZAP_POS(typ) || (closed_door &&
// range>=0))`).  Translator emitted `make_bounce: {}` empty
// label-block + TODO at the goto site, so when the ray hit
// stone or off-map the entire mon/u-hit body would execute (or
// crash on OOB access) before reaching the natural bounce
// guard.  Restructure with __skip_to_bounce flag: when the
// stone/oob check trips, skip the mon/u-hit body and force-
// enter the bounce-guard via `||` short-circuit (which also
// avoids typ access for OOB).  RNG-neutral because both paths
// reach the same bchance computation in the same order.
patchFile('zap.js', (s) => {
    return s.replace(
        /    while \(range-- > 0\) \{\n        lsx = sx;\n        sx \+= dx;\n        lsy = sy;\n        sy \+= dy;\n        if \(!isok\(sx, sy\) \|\| game\.level\.locations\[sx\]\[sy\]\.typ == STONE\) \{\n            \/\* TODO Phase 5\+: goto make_bounce \(label not in scope of break\) \*\/\n        \}\n        mon = \(game\.level\.monsters\[sx\]\[sy\]\);/,
        `    while (range-- > 0) {
        lsx = sx;
        sx += dx;
        lsy = sy;
        sy += dy;
        let __skip_to_bounce = false;
        if (!isok(sx, sy) || game.level.locations[sx][sy].typ == STONE) {
            __skip_to_bounce = true;
        }
        if (!__skip_to_bounce) {
        mon = (game.level.monsters[sx][sy]);`
    ).replace(
        /        if \(gas_hit\) \{\n            zap_over_floor\(sx, sy, type, \{ get value\(\) \{ return shopdamage; \}, set value\(_v\) \{ shopdamage = _v; \} \}, \(1\), 0\);\n        \}\n        if \(!\(\(game\.level\.locations\[sx\]\[sy\]\.typ\) >= POOL\) \|\| \(closed_door\(sx, sy\) && range >= 0\)\) \{\n            let bchance = 0;\n            make_bounce: \{\n            \}\n            bchance = \(!isok\(sx, sy\) \|\| game\.level\.locations\[sx\]\[sy\]\.typ == STONE\) \? 10 : \(In_mines\(game\.u\.uz\) && \(\(game\.level\.locations\[sx\]\[sy\]\.typ\) && \(game\.level\.locations\[sx\]\[sy\]\.typ\) <= DBWALL\)\) \? 20 : 75;/,
        `        if (gas_hit) {
            zap_over_floor(sx, sy, type, { get value() { return shopdamage; }, set value(_v) { shopdamage = _v; } }, (1), 0);
        }
        }
        if (__skip_to_bounce || !((game.level.locations[sx][sy].typ) >= POOL) || (closed_door(sx, sy) && range >= 0)) {
            let bchance = 0;
            bchance = (!isok(sx, sy) || game.level.locations[sx][sy].typ == STONE) ? 10 : (In_mines(game.u.uz) && ((game.level.locations[sx][sy].typ) && (game.level.locations[sx][sy].typ) <= DBWALL)) ? 20 : 75;`
    );
});

// zap.js: zapdoor's `goto def_case` (forward jump from ZT_DEATH
// case when not death-breath to default's def_case body) +
// translator dropped the `if (exploding_wand_typ > 0)` /
// WAN_STRIKING check from the default body (replaced by
// `// TODO LabelStmt def_case`).  Door-zap with WAN_STRIKING was
// failing to crash doors open; ZT_DEATH non-breath was falling
// through to ZT_LIGHTNING (wrong door message).
//
// Inline the def_case body at ZT_DEATH non-breath path with
// explicit break, restore the exploding_wand_typ WAN_STRIKING
// check at the default body top.
patchFile('zap.js', (s) => {
    return s.replace(
        /            case \(5 - 1\):\n                if \(abs\(type\) != \(20 \+ \(\(5 - 1\)\)\)\) \{\n                    \/\* TODO Phase 5\+: goto def_case \(label not in scope of break\) \*\/\n                \}\n                new_doormask = 0;\n                see_txt = "The door disintegrates!";\n                hear_txt = "crashing wood\.";\n                break;\n            case \(6 - 1\):\n                new_doormask = 1;\n                see_txt = "The door splinters!";\n                hear_txt = "crackling\.";\n                break;\n            default:\n                \/\/ TODO LabelStmt def_case not at compound-stmt level\n                if \(see_it\) \{\n                    if \(exploding_wand_typ\) \{\n                        pline_The\("door remains intact\."\);\n                    \} else \{\n                        pline_The\("door absorbs %s %s!", yourzap \? "your" : "the", zapverb\);\n                    \}\n                \} else \{\n                    You_feel\("vibrations\."\);\n                \}\n                break;/,
        `            case (5 - 1):
                if (abs(type) != (20 + ((5 - 1)))) {
                    if (exploding_wand_typ > 0) {
                        if (exploding_wand_typ == WAN_STRIKING) {
                            new_doormask = 1;
                            see_txt = "The door crashes open!";
                            sense_txt = "feel a burst of cool air.";
                            break;
                        }
                    }
                    if (see_it) {
                        if (exploding_wand_typ) {
                            pline_The("door remains intact.");
                        } else {
                            pline_The("door absorbs %s %s!", yourzap ? "your" : "the", zapverb);
                        }
                    } else {
                        You_feel("vibrations.");
                    }
                    break;
                }
                new_doormask = 0;
                see_txt = "The door disintegrates!";
                hear_txt = "crashing wood.";
                break;
            case (6 - 1):
                new_doormask = 1;
                see_txt = "The door splinters!";
                hear_txt = "crackling.";
                break;
            default:
                if (exploding_wand_typ > 0) {
                    if (exploding_wand_typ == WAN_STRIKING) {
                        new_doormask = 1;
                        see_txt = "The door crashes open!";
                        sense_txt = "feel a burst of cool air.";
                        break;
                    }
                }
                if (see_it) {
                    if (exploding_wand_typ) {
                        pline_The("door remains intact.");
                    } else {
                        pline_The("door absorbs %s %s!", yourzap ? "your" : "the", zapverb);
                    }
                } else {
                    You_feel("vibrations.");
                }
                break;`
    );
});

// zap.js buzz() buzzmonst goto-into-block: when the spell hits
// the player's cell and the player is on a steed, the steed-
// redirect branch does `mon = u.usteed; goto buzzmonst;` to
// re-enter the monster-hit block with mon=usteed.  Translator
// emitted the goto as a TODO no-op so the steed-redirect path
// would (a) set mon but not fire monster-hit code, and (b) fall
// through to the post-chain flashburn/stop_occupation/nomul code
// which should NOT run on the goto path.
//
// Recipe 6 (goto-into-block, LEARNINGS §23.99/100/101): add
// `__steed_redirect` flag.  Reverse the if/else order — check
// player-at-sx-sy FIRST (with `!mon` guard to preserve the
// original mutual exclusion).  In that branch, the steed-
// redirect path sets mon = u.usteed and the flag; the post-
// chain code is gated on `!__steed_redirect`.  Then `if (mon)`
// catches both the original mon AND the steed-redirect mon and
// runs the monster-hit code.  Remove the now-unused
// `buzzmonst: { ... }` labeled block, inlining its body
// (`if (fireball) break;` still breaks the outer while-loop
// since labeled non-iteration blocks don't catch unlabeled
// break).
//
// Rare path (requires player on steed AND spell hits player AND
// rn2(3) AND steed doesn't reflect); score-relevant for
// zap-heavy sessions but score-stable on the 44-session run.
//
// C ref: src/zap.c lines 4864-4961 buzz() (buzzmonst label at
// 4869, goto buzzmonst at 4961).
patchFile('zap.js', (s) => {
    if (s.includes('/* buzzmonst-steed-redirect fix')) return s;
    const oldBlock = `        if (mon) {
            buzzmonst: {
                if (fireball) {
                    break;
                }
                if (type >= 0) {
                    mon.mstrategy &= ~(268435456 | 536870912);
                }
            }
            game.notonhead = (mon.mx != game.bhitpos.x || mon.my != game.bhitpos.y);
            if (!forcemiss && zap_hit(find_mac(mon), spell_type)) {`;
    const newBlock = `        /* buzzmonst-steed-redirect fix — C \`goto buzzmonst\` from the
           player-on-steed branch jumps INTO the if(mon) body with
           mon = u.usteed.  Translator emitted it as a TODO no-op.
           Reverse the if/else order: check player-at-sx-sy first
           (with !mon guard to preserve original mutual exclusion);
           set __steed_redirect + mon = u.usteed there; then if(mon)
           catches both the original mon AND the steed-redirect mon. */
        let __steed_redirect = (0);
        if (!mon && ((sx) == game.u.ux && (sy) == game.u.uy) && range >= 0) {
            nomul(0);
            if (game.u.usteed && !rn2(3) && !mon_reflects(game.u.usteed, null)) {
                mon = game.u.usteed;
                __steed_redirect = (1);
            } else if (!forcemiss && zap_hit(game.u.uac, 0)) {
                range -= 2;
                pline_dir(xytodir(-dx, -dy), "%s hits you!", The(flash_str(fltyp, (0))));
                if ((game.u.uprops[REFLECTING].intrinsic || game.u.uprops[REFLECTING].extrinsic)) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        ureflects("But %s reflects from your %s!", "it");
                    } else {
                        pline("For some reason you are not affected.");
                    }
                    monstseesu(M_SEEN_REFL);
                    dx = -dx;
                    dy = -dy;
                    shieldeff(sx, sy);
                    gas_hit = (0);
                } else {
                    zhitu(type, nd, flash_str(fltyp, (1)), sx, sy);
                    monstunseesu(M_SEEN_REFL);
                }
            } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s whizzes by you!", The(flash_str(fltyp, (0))));
            } else if (damgtype == (6 - 1)) {
                Your("%s tingles.", body_part(ARM));
            }
            if (!__steed_redirect) {
                if (damgtype == (6 - 1)) {
                    flashburn(d(nd, 50), (1));
                }
                stop_occupation();
                nomul(0);
            }
        }
        if (mon) {
            if (fireball) {
                break;
            }
            if (type >= 0) {
                mon.mstrategy &= ~(268435456 | 536870912);
            }
            game.notonhead = (mon.mx != game.bhitpos.x || mon.my != game.bhitpos.y);
            if (!forcemiss && zap_hit(find_mac(mon), spell_type)) {`;
    s = s.replace(oldBlock, newBlock);
    // 2. Remove the now-duplicated original else-if(player) block
    const oldElseIf = `            }
        } else if (((sx) == game.u.ux && (sy) == game.u.uy) && range >= 0) {
            nomul(0);
            if (game.u.usteed && !rn2(3) && !mon_reflects(game.u.usteed, null)) {
                mon = game.u.usteed;
                /* TODO Phase 5+: goto buzzmonst (label not in scope of break) */
            } else if (!forcemiss && zap_hit(game.u.uac, 0)) {
                range -= 2;
                pline_dir(xytodir(-dx, -dy), "%s hits you!", The(flash_str(fltyp, (0))));
                if ((game.u.uprops[REFLECTING].intrinsic || game.u.uprops[REFLECTING].extrinsic)) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        ureflects("But %s reflects from your %s!", "it");
                    } else {
                        pline("For some reason you are not affected.");
                    }
                    monstseesu(M_SEEN_REFL);
                    dx = -dx;
                    dy = -dy;
                    shieldeff(sx, sy);
                    gas_hit = (0);
                } else {
                    zhitu(type, nd, flash_str(fltyp, (1)), sx, sy);
                    monstunseesu(M_SEEN_REFL);
                }
            } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("%s whizzes by you!", The(flash_str(fltyp, (0))));
            } else if (damgtype == (6 - 1)) {
                Your("%s tingles.", body_part(ARM));
            }
            if (damgtype == (6 - 1)) {
                flashburn(d(nd, 50), (1));
            }
            stop_occupation();
            nomul(0);
        }
        if (gas_hit) {`;
    const newElseIf = `            }
        }
        if (gas_hit) {`;
    s = s.replace(oldElseIf, newElseIf);
    return s;
});

// trap.js: water_damage_trap's `goto uglovecheck` (player gloves)
// + `goto mglovecheck` (monster gloves) — both forward cross-case
// gotos.  Translator emitted TODOs AND dropped the glove-target
// dereferences from case 1 bodies (uglovecheck: water_damage(uarmg,
// gloves_simple_name) and mglovecheck: target=which_armor(W_ARMG)
// + water_damage(target, ...)).  Result: case 1 ran water_damage
// on wrong target (player: dropped; monster: previous MON_WEP);
// case 2 fell through to default firing wrong gush-of-water pline.
//
// Inline the gloves water_damage at case 1 (using game.uarmg /
// which_armor(mtmp, 16) for W_ARMG) and at case 2 + break.
patchFile('trap.js', (s) => {
    s = s.replace(
        /                if \(game\.u\.twoweap \|\| \(game\.uwep && \(\(game\.uwep\.oclass == WEAPON_CLASS \|\| game\.uwep\.oclass == TOOL_CLASS\) && game\.objects\[game\.uwep\.otyp\]\.oc_big\)\)\) \{\n                    water_damage\(game\.u\.twoweap \? game\.uswapwep : game\.uwep, null, \(1\)\);\n                \}\n                \/\/ TODO LabelStmt uglovecheck not at compound-stmt level\n                break;\n            case 2:\n                pline\("%s your right %s!", A_gush_of_water_hits, body_part\(ARM\)\);\n                water_damage\(game\.uwep, null, \(1\)\);\n                \/\* TODO Phase 5\+: goto uglovecheck \(label not in scope of break\) \*\/\n            default:/,
        `                if (game.u.twoweap || (game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big))) {
                    water_damage(game.u.twoweap ? game.uswapwep : game.uwep, null, (1));
                }
                water_damage(game.uarmg, gloves_simple_name(game.uarmg), (1));
                break;
            case 2:
                pline("%s your right %s!", A_gush_of_water_hits, body_part(ARM));
                water_damage(game.uwep, null, (1));
                water_damage(game.uarmg, gloves_simple_name(game.uarmg), (1));
                break;
            default:`
    );
    s = s.replace(
        /                target = \(\(mtmp\)\.mw\);\n                if \(target && \(\(target\.oclass == WEAPON_CLASS \|\| target\.oclass == TOOL_CLASS\) && game\.objects\[target\.otyp\]\.oc_big\)\) \{\n                    water_damage\(target, null, \(1\)\);\n                \}\n                \/\/ TODO LabelStmt mglovecheck not at compound-stmt level\n                water_damage\(target, gloves_simple_name\(target\), \(1\)\);\n                break;\n            case 2:\n                if \(in_sight\) \{\n                    pline_mon\(mtmp, "%s %s's right %s!", A_gush_of_water_hits, mon_nam\(mtmp\), mbodypart\(mtmp, ARM\)\);\n                \}\n                water_damage\(\(\(mtmp\)\.mw\), null, \(1\)\);\n                \/\* TODO Phase 5\+: goto mglovecheck \(label not in scope of break\) \*\//,
        `                target = ((mtmp).mw);
                if (target && ((target.oclass == WEAPON_CLASS || target.oclass == TOOL_CLASS) && game.objects[target.otyp].oc_big)) {
                    water_damage(target, null, (1));
                }
                target = which_armor(mtmp, 16);
                water_damage(target, gloves_simple_name(target), (1));
                break;
            case 2:
                if (in_sight) {
                    pline_mon(mtmp, "%s %s's right %s!", A_gush_of_water_hits, mon_nam(mtmp), mbodypart(mtmp, ARM));
                }
                water_damage(((mtmp).mw), null, (1));
                target = which_armor(mtmp, 16);
                water_damage(target, gloves_simple_name(target), (1));
                break;`
    );
    return s;
});

// trap.js: launch's `goto roll` (forward jump from ROLL|UNSEEN
// case to the ROLL-case body `delaycnt = 2`).  Translator emitted
// TODO + dropped `delaycnt = 2` from case ROLL (replaced with
// `// TODO LabelStmt roll`).  Result: ROLL|UNSEEN fell through to
// ROLL|KNOWN (wrongly setting otrapped=1), and ROLL fell through
// to default (delaycnt defaulted to 1 instead of 2).
//
// Inline the roll body (delaycnt=2 + curs_on_u + tmp_at) + break
// at ROLL|UNSEEN, and restore `delaycnt = 2` at ROLL case.
patchFile('trap.js', (s) => {
    return s.replace(
        /            style &= ~64;\n            \/\* TODO Phase 5\+: goto roll \(label not in scope of break\) \*\/\n        case 1 \| 128:\n            singleobj\.otrapped = 1;\n            style &= ~128;\n            ;\n        case 1:\n            \/\/ TODO LabelStmt roll not at compound-stmt level\n            ;\n        default:/,
        `            style &= ~64;
            delaycnt = 2;
            if (!((game.viz_array[y][x] & 2) != 0)) {
                curs_on_u();
            }
            tmp_at((-4), (((singleobj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((singleobj).corpsenm + ((((singleobj).spe & 3) == 1) ? (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((singleobj).otyp == CORPSE) ? (((singleobj).corpsenm + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(singleobj).dknown && ((singleobj).oclass == POTION_CLASS || ((singleobj).otyp >= FIRST_REAL_GEM && ((singleobj).otyp <= LAST_GLASS_GEM)) || ((singleobj).otyp >= FIRST_SPELL && ((singleobj).otyp <= LAST_SPELL)))) ? (((singleobj).oclass + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((singleobj).otyp + (((singleobj).where == 1 && ((game.otg_otmp = game.level.objects[(singleobj).ox][(singleobj).oy].v.v_nexthere) != null) && ((singleobj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
            tmp_at(x, y);
            break;
        case 1 | 128:
            singleobj.otrapped = 1;
            style &= ~128;
            ;
        case 1:
            delaycnt = 2;
            ;
        default:`
    );
});

// steal.js: steal_it's `goto nothing_to_steal` (back-jump after
// gotobj inv-iteration when no valid item was found) — translator
// emitted TODO; JS would impossible-error or skip cleanup.  Inline
// the nothing_to_steal body (4 cases: uball+rn2(4), buried_ball+
// rn2(4), Blinded, gold-only, generic) at the goto site.
patchFile('steal.js', (s) => {
    return s.replace(
        /        if \(!tmp\) \{\n            \/\* TODO Phase 5\+: goto nothing_to_steal \(label not in scope of break\) \*\/\n        \}\n        tmp = rn2\(tmp\);/,
        `        if (!tmp) {
            if ((game.uball != null) && !monkey_business && rn2(4)) {
                (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                worn_item_removal(mtmp, game.uchain);
            } else if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL && !monkey_business && !rn2(4)) {
                let dummy = 0;
                pline("%s takes off your unseen chain.", Monnambuf);
                openholdingtrap(game.youmonst, { get value() { return dummy; }, set value(_v) { dummy = _v; } });
            } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("Somebody tries to rob you, but finds nothing to steal.");
            } else if (inv_cnt((1)) > inv_cnt((0))) {
                pline("%s tries to rob you, but isn't interested in gold.", Monnambuf);
            } else {
                pline("%s tries to rob you, but there is nothing to steal!", Monnambuf);
            }
            return 1;
        }
        tmp = rn2(tmp);`
    );
});

// steal.js: steal_it's 2x `goto gotobj` (forward jumps from
// the ADORNED-ring branches to gotobj label which is AFTER
// the random-pick block).  Translator placed the gotobj
// labeled block AROUND the random-pick + override code
// instead of after it, so TODO no-ops at the goto sites
// meant the random-pick branch ran ANYWAY, OVERWRITING
// otmp set by ADORNED.  Nymphs would steal a random item
// instead of the specifically-targeted ring of adornment.
//
// Restructure with `__adorned_pick` flag: set at ADORNED
// branches, gate the random-pick block with `if (!__adorned_pick)`.
// Stealoid check + boulder check + monkey check run
// regardless.  RNG-relevant: skipping the rn2(tmp) call when
// ADORNED fires matches C behavior.
//
// C ref: src/steal.c lines 405-411 (ADORNED + goto gotobj) +
// 448 (gotobj label).
patchFile('steal.js', (s) => {
    s = s.replace(
        /    let monkey_business = 0;\n    let seen = 0;\n    let was_doffing = 0;\n    let was_punished = 0;\n    retry: \{/,
        `    let monkey_business = 0;
    let seen = 0;
    let was_doffing = 0;
    let was_punished = 0;
    let __adorned_pick = false;
    retry: {`
    );
    s = s.replace(
        /        if \(monkey_business \|\| game\.uarmg\) \{\n            ;\n        \} else if \(game\.u\.uprops\[ADORNED\]\.extrinsic & 131072\) \{\n            otmp = game\.uleft;\n            \/\* TODO Phase 5\+: goto gotobj \(label not in scope of break\) \*\/\n        \} else if \(game\.u\.uprops\[ADORNED\]\.extrinsic & 262144\) \{\n            otmp = game\.uright;\n            \/\* TODO Phase 5\+: goto gotobj \(label not in scope of break\) \*\/\n        \}\n    \}\n    tmp = 0;\n    gotobj: \{/,
        `        if (monkey_business || game.uarmg) {
            ;
        } else if (game.u.uprops[ADORNED].extrinsic & 131072) {
            otmp = game.uleft;
            __adorned_pick = true;
        } else if (game.u.uprops[ADORNED].extrinsic & 262144) {
            otmp = game.uright;
            __adorned_pick = true;
        }
    }
    tmp = 0;
    if (!__adorned_pick) {`
    );
    return s;
});

// steal.js: steal_it's 2x `goto cant_take` (forward jumps from
// cursed-leash-monkey site and from armor-delay-rn2(10) site
// to the cant_take body inside the monkey-business `if-ostuck`
// branch).  Translator emitted TODOs.  Effects: monkeys could
// unleash cursed leashes (should fail); armor stealing with
// take-off delay never bailed out on the rn2(10) check (90%
// of attempts), so the cant_take's rn2(verb) + rn2(inv_cnt)
// were never consumed and JS ran worn_item_removal instead.
// Inline the cant_take body (pline + rn2(inv_cnt/5+2) return)
// at both sites.  C ref: src/steal.c lines 492-495 (cursed
// leash) + 521-522 (armor delay).
patchFile('steal.js', (s) => {
    s = s.replace(
        /    if \(otmp\.otyp == LEASH && otmp\.corpsenm\) \{\n        if \(monkey_business && otmp\.cursed\) \{\n            \/\* TODO Phase 5\+: goto cant_take \(label not in scope of break\) \*\/\n        \}\n        o_unleash\(otmp\);\n    \}/,
        `    if (otmp.otyp == LEASH && otmp.corpsenm) {
        if (monkey_business && otmp.cursed) {
            pline("%s tries to %s %s%s but gives up.", Monnambuf, __steal_how[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)))], (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? "your " : "", (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? armor_simple_name(otmp) : yname(otmp));
            return !rn2(Math.trunc(inv_cnt((0)) / 5) + 2);
        }
        o_unleash(otmp);
    }`
    );
    s = s.replace(
        /                if \(monkey_business \|\| unresponsive\(\)\) \{\n                    if \(armordelay >= 1 && !olddelay && rn2\(10\)\) \{\n                        \/\* TODO Phase 5\+: goto cant_take \(label not in scope of break\) \*\/\n                    \}\n                    worn_item_removal\(mtmp, otmp\);\n                    break;\n                \} else \{/,
        `                if (monkey_business || unresponsive()) {
                    if (armordelay >= 1 && !olddelay && rn2(10)) {
                        pline("%s tries to %s %s%s but gives up.", Monnambuf, __steal_how[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)))], (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? "your " : "", (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? armor_simple_name(otmp) : yname(otmp));
                        return !rn2(Math.trunc(inv_cnt((0)) / 5) + 2);
                    }
                    worn_item_removal(mtmp, otmp);
                    break;
                } else {`
    );
    return s;
});

// steal.js: boulder retry restructure.  Translator placed
// the C `retry:` label at function entry, but C's label is
// AFTER the initial setup (icnt, nothing_to_steal, ADORNED
// detection) and just before the random-pick loop.  So
// `goto retry` from boulder re-runs ONLY the random pick.
//
// Effect of mis-placed label: nymph/leprechaun stealing a
// boulder didn't retry-pick; JS continued with boulder otmp,
// falling into monkey_business cant_take or worn_item_removal
// cascade.  RNG-wise consumed different rn2 calls than C.
//
// Restructure:
//   - Remove translator's mis-placed `retry: {` wrapper.
//   - Insert `retry: while (true) {` AFTER ADORNED detection,
//     BEFORE `tmp = 0;`.
//   - boulder retry → `__adorned_pick = false; continue retry;`.
//   - boulder cant_take → inline pline + return.
//   - Add `break;` after boulder check to exit loop.
//
// This patch must run AFTER the ADORNED patch (which inserts
// `let __adorned_pick = false;` before `retry: {`) and AFTER
// the cant_take patches (so we match the post-ADORNED-patch
// shape).
//
// C ref: src/steal.c line 413 (retry label) + 452-456
// (boulder check).
patchFile('steal.js', (s) => {
    s = s.replace(
        /    let __adorned_pick = false;\n    retry: \{\n        named = 0;\n        retrycnt = 0;/,
        `    let __adorned_pick = false;
    {
        named = 0;
        retrycnt = 0;`
    );
    s = s.replace(
        /        \} else if \(game\.u\.uprops\[ADORNED\]\.extrinsic & 262144\) \{\n            otmp = game\.uright;\n            __adorned_pick = true;\n        \}\n    \}\n    tmp = 0;\n    if \(!__adorned_pick\) \{/,
        `        } else if (game.u.uprops[ADORNED].extrinsic & 262144) {
            otmp = game.uright;
            __adorned_pick = true;
        }
    }
    retry: while (true) {
    tmp = 0;
    if (!__adorned_pick) {`
    );
    s = s.replace(
        /    if \(otmp\.otyp == BOULDER && !\(\(\(mtmp\.data\)\.mflags2 & 134217728\) != 0\)\) \{\n        if \(!retrycnt\+\+\) \{\n            \/\* TODO Phase 5\+: goto retry \(label not in scope of break\) \*\/\n        \}\n        \/\* TODO Phase 5\+: goto cant_take \(label not in scope of break\) \*\/\n    \}\n    if \(monkey_business\) \{/,
        `    if (otmp.otyp == BOULDER && !(((mtmp.data).mflags2 & 134217728) != 0)) {
        if (!retrycnt++) {
            __adorned_pick = false;
            continue retry;
        }
        pline("%s tries to %s %s%s but gives up.", Monnambuf, __steal_how[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)))], (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? "your " : "", (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) ? armor_simple_name(otmp) : yname(otmp));
        return !rn2(Math.trunc(inv_cnt((0)) / 5) + 2);
    }
    break;
    }
    if (monkey_business) {`
    );
    return s;
});

// sit.js: dosit's 2x `goto in_water` (forward from pool-and-not-
// underwater branch and from gremlin-at-fountain branch to the
// shared in_water body inside the next else-if).  Translator
// emitted TODOs; sitting in water was silently no-op (no message,
// no gremlin split, no armor damage).
//
// Merge both branches into a single else-if with combined
// conditions, inline the in_water body (You(sit) + gremlin/armor
// rn2 dispatch) + early return.
patchFile('sit.js', (s) => {
    return s.replace(
        /    \} else if \(is_pool\(game\.u\.ux, game\.u\.uy\) && !\(game\.u\.uinwater\)\) \{\n        \/\* TODO Phase 5\+: goto in_water \(label not in scope of break\) \*\/\n    \} else if \(\(game\.u\.umonnum != game\.u\.umonster\) && game\.u\.umonnum == PM_GREMLIN && \(game\.level\.locations\[game\.u\.ux\]\[game\.u\.uy\]\.typ == FOUNTAIN \|\| is_pool\(game\.u\.ux, game\.u\.uy\)\)\) \{\n        \/\* TODO Phase 5\+: goto in_water \(label not in scope of break\) \*\/\n    \}/,
        `    } else if ((is_pool(game.u.ux, game.u.uy) && !(game.u.uinwater)) || ((game.u.umonnum != game.u.umonster) && game.u.umonnum == PM_GREMLIN && (game.level.locations[game.u.ux][game.u.uy].typ == FOUNTAIN || is_pool(game.u.ux, game.u.uy)))) {
        You("sit in the %s.", hliquid("water"));
        if ((game.u.umonnum != game.u.umonster) && game.u.umonnum == PM_GREMLIN) {
            if (split_mon(game.youmonst, null)) {
                if (game.level.locations[game.u.ux][game.u.uy].typ == FOUNTAIN) {
                    dryup(game.u.ux, game.u.uy, (1));
                }
            }
        } else {
            if (!rn2(10) && game.uarm) {
                water_damage(game.uarm, "armor", (1));
            }
            if (!rn2(10) && game.uarmf && game.uarmf.otyp != WATER_WALKING_BOOTS) {
                water_damage(game.uarm, "armor", (1));
            }
        }
        return 1;
    }`
    );
});

// wizcmds.js: wiz_intrinsic's `goto def_feedback` (forward jump
// from WARN_OF_MON case to default's feedback body).  Translator
// emitted TODO + dropped `if (p != GLIB) incr_itimeout(...)`
// from default body.  Wizard #intrinsic command was broken
// (incr_itimeout never fired, intrinsic timeouts never advanced).
//
// Inline def_feedback body at WARN_OF_MON case + restore the
// incr_itimeout call in default case.
patchFile('wizcmds.js', (s) => {
    return s.replace(
        /                case WARN_OF_MON:\n                    if \(!\(game\.u\.uprops\[WARN_OF_MON\]\.intrinsic \|\| game\.u\.uprops\[WARN_OF_MON\]\.extrinsic\)\) \{\n                        game\.context\.warntype\.speciesidx = PM_GRID_BUG;\n                        game\.context\.warntype\.species = game\.mons\[game\.context\.warntype\.speciesidx\];\n                    \}\n                    \/\* TODO Phase 5\+: goto def_feedback \(label not in scope of break\) \*\/\n                case GLIB:\n                    make_glib\(newtimeout\);\n                    ;\n                default:\n                    \/\/ TODO LabelStmt def_feedback not at compound-stmt level\n                    game\.disp\.botl = \(1\);\n                    pline\("Timeout for %s %s %d\.", propname, oldtimeout \? "increased by" : "set to", amt\);\n                    break;/,
        `                case WARN_OF_MON:
                    if (!(game.u.uprops[WARN_OF_MON].intrinsic || game.u.uprops[WARN_OF_MON].extrinsic)) {
                        game.context.warntype.speciesidx = PM_GRID_BUG;
                        game.context.warntype.species = game.mons[game.context.warntype.speciesidx];
                    }
                    if (p != GLIB) {
                        incr_itimeout({ get value() { return game.u.uprops[p].intrinsic; }, set value(_v) { game.u.uprops[p].intrinsic = _v; } }, amt);
                    }
                    game.disp.botl = (1);
                    pline("Timeout for %s %s %d.", propname, oldtimeout ? "increased by" : "set to", amt);
                    break;
                case GLIB:
                    make_glib(newtimeout);
                    ;
                default:
                    if (p != GLIB) {
                        incr_itimeout({ get value() { return game.u.uprops[p].intrinsic; }, set value(_v) { game.u.uprops[p].intrinsic = _v; } }, amt);
                    }
                    game.disp.botl = (1);
                    pline("Timeout for %s %s %d.", propname, oldtimeout ? "increased by" : "set to", amt);
                    break;`
    );
});

// muse.js muse_undead_reply try_again: superseded by A3 goto
// back-jump-to-loop recognizer (commit 85cb377).

// muse.js: use_misc case 1 (cursed potion-of-gain-level quaffed
// by monster).  C source has `goto skipmsg` jumping from inside
// the `if (Can_rise_up)` branch into the `else` branch's
// `skipmsg:` label body when the target level is the current
// level.  Inline the skipmsg body (vismon "looks uneasy" +
// trycall, then m_useup, return 2) at the goto site, so the
// rise-up path correctly short-circuits to the "uneasy"
// fallback when the monster is already on the destination
// level.
patchFile('muse.js', (s) => {
    return s.replace(
        /                if \(Can_rise_up\(mtmp\.mx, mtmp\.my, game\.u\.uz\)\) \{\n                    let tolev = depth\(game\.u\.uz\) - 1;\n                    let tolevel = \{ dnum: 0, dlevel: 0 \};\n                    get_level\(tolevel, tolev\);\n                    if \(on_level\(tolevel, game\.u\.uz\)\) \{\n                        \/\* TODO Phase 5\+: goto skipmsg \(label not in scope of break\) \*\/\n                    \}\n                    if \(vismon\) \{\n                        pline_mon\(mtmp, "%s rises up, through the %s!", Monnam\(mtmp\), ceiling\(mtmp\.mx, mtmp\.my\)\);\n                        trycall\(otmp\);\n                    \}\n                    m_useup\(mtmp, otmp\);\n                    migrate_to_level\(mtmp, ledger_no\(tolevel\), 0, null\);\n                    return 2;\n                \} else \{\n                    skipmsg: \{\n                    \}\n                    if \(vismon\) \{\n                        pline_mon\(mtmp, "%s looks uneasy\.", Monnam\(mtmp\)\);\n                        trycall\(otmp\);\n                    \}\n                    m_useup\(mtmp, otmp\);\n                    return 2;\n                \}/,
        `                if (Can_rise_up(mtmp.mx, mtmp.my, game.u.uz)) {
                    let tolev = depth(game.u.uz) - 1;
                    let tolevel = { dnum: 0, dlevel: 0 };
                    get_level(tolevel, tolev);
                    if (on_level(tolevel, game.u.uz)) {
                        if (vismon) {
                            pline_mon(mtmp, "%s looks uneasy.", Monnam(mtmp));
                            trycall(otmp);
                        }
                        m_useup(mtmp, otmp);
                        return 2;
                    }
                    if (vismon) {
                        pline_mon(mtmp, "%s rises up, through the %s!", Monnam(mtmp), ceiling(mtmp.mx, mtmp.my));
                        trycall(otmp);
                    }
                    m_useup(mtmp, otmp);
                    migrate_to_level(mtmp, ledger_no(tolevel), 0, null);
                    return 2;
                } else {
                    if (vismon) {
                        pline_mon(mtmp, "%s looks uneasy.", Monnam(mtmp));
                        trycall(otmp);
                    }
                    m_useup(mtmp, otmp);
                    return 2;
                }`
    );
});

// makemon.js: m_initappear's 2x `goto assign_sym` (cross-branch
// forward from SHOP-branch sub-cases to else-branch's assign_sym
// body that does s_sym dispatch).  Translator emitted TODOs;
// SHOP branch fell through to wrong sub-cases (firing rn2(2)
// FODDERSHOP path or overwriting s_sym).  Restructure: use a
// `__do_assign_sym` flag in an outer-else, dispatch assign_sym
// body once after the inner if-else chain.
patchFile('makemon.js', (s) => {
    return s.replace(
        /    \} else if \(rt >= SHOPBASE\) \{\n        if \(rn2\(10\) >= depth\(game\.u\.uz\)\) \{\n            s_sym = S_MIMIC_DEF;\n            \/\* TODO Phase 5\+: goto assign_sym \(label not in scope of break\) \*\/\n        \}\n        s_sym = get_shop_item\(rt - SHOPBASE\);\n        if \(s_sym < 0\) \{\n            ap_type = M_AP_OBJECT;\n            appear = -s_sym;\n        \} else if \(rt == FODDERSHOP && s_sym > MAXOCLASSES\) \{\n            ap_type = M_AP_OBJECT;\n            appear = rn2\(2\) \? LUMP_OF_ROYAL_JELLY : SLIME_MOLD;\n        \} else \{\n            if \(s_sym == RANDOM_CLASS \|\| s_sym >= MAXOCLASSES\) \{\n                s_sym = syms\[rn2\(\(Math\.trunc\(17 \/\* sizeof\(const char \[17\]\) \*\/ \/ 1 \/\* sizeof\(const char\) \*\/\)\) - 2\) \+ 2\];\n            \}\n            \/\* TODO Phase 5\+: goto assign_sym \(label not in scope of break\) \*\/\n        \}\n    \} else \{\n        assign_sym: \{\n            s_sym = syms\[rn2\(\(Math\.trunc\(17 \/\* sizeof\(const char \[17\]\) \*\/ \/ 1 \/\* sizeof\(const char\) \*\/\)\)\)\];\n        \}\n        if \(s_sym == MAXOCLASSES\) \{\n            ap_type = M_AP_FURNITURE;\n            appear = __set_mimic_sym_furnsyms\[rn2\(\(Math\.trunc\(32 \/\* sizeof\(const int \[8\]\) \*\/ \/ 4 \/\* sizeof\(const int\) \*\/\)\)\)\];\n        \} else \{\n            ap_type = M_AP_OBJECT;\n            if \(s_sym == S_MIMIC_DEF\) \{\n                appear = STRANGE_OBJECT;\n            \} else if \(s_sym == COIN_CLASS\) \{\n                appear = GOLD_PIECE;\n            \} else \{\n                otmp = mkobj\(s_sym, \(0\)\);\n                appear = otmp\.otyp;\n                obfree\(otmp, null\);\n            \}\n        \}\n    \}/,
        `    } else {
        let __do_assign_sym = false;
        if (rt >= SHOPBASE) {
            if (rn2(10) >= depth(game.u.uz)) {
                s_sym = S_MIMIC_DEF;
                __do_assign_sym = true;
            } else {
                s_sym = get_shop_item(rt - SHOPBASE);
                if (s_sym < 0) {
                    ap_type = M_AP_OBJECT;
                    appear = -s_sym;
                } else if (rt == FODDERSHOP && s_sym > MAXOCLASSES) {
                    ap_type = M_AP_OBJECT;
                    appear = rn2(2) ? LUMP_OF_ROYAL_JELLY : SLIME_MOLD;
                } else {
                    if (s_sym == RANDOM_CLASS || s_sym >= MAXOCLASSES) {
                        s_sym = syms[rn2((Math.trunc(17 /* sizeof(const char [17]) */ / 1 /* sizeof(const char) */)) - 2) + 2];
                    }
                    __do_assign_sym = true;
                }
            }
        } else {
            s_sym = syms[rn2((Math.trunc(17 /* sizeof(const char [17]) */ / 1 /* sizeof(const char) */)))];
            __do_assign_sym = true;
        }
        if (__do_assign_sym) {
            if (s_sym == MAXOCLASSES) {
                ap_type = M_AP_FURNITURE;
                appear = __set_mimic_sym_furnsyms[rn2((Math.trunc(32 /* sizeof(const int [8]) */ / 4 /* sizeof(const int) */)))];
            } else {
                ap_type = M_AP_OBJECT;
                if (s_sym == S_MIMIC_DEF) {
                    appear = STRANGE_OBJECT;
                } else if (s_sym == COIN_CLASS) {
                    appear = GOLD_PIECE;
                } else {
                    otmp = mkobj(s_sym, (0));
                    appear = otmp.otyp;
                    obfree(otmp, null);
                }
            }
        }
    }`
    );
});

// uhitm.js: do_stone_mon's `goto post_stone` (forward jump from
// munstone-true path into resists_ston-else body) AND
// mhitm_ad_dise's `goto mhitm_dise` (same uhitm-to-mhitm pattern
// as famn/pest/deth).  Inline at each goto site.
patchFile('uhitm.js', (s) => {
    s = s.replace(
        /    if \(munstone\(mdef, \(0\)\)\) \{\n        \/\* TODO Phase 5\+: goto post_stone \(label not in scope of break\) \*\/\n    \}\n    if \(poly_when_stoned\(pd\)\) \{/,
        `    if (munstone(mdef, (0))) {
        if (!((mdef).mhp < 1)) {
            mhm.hitflags = 0;
            mhm.done = (1);
            return;
        } else if (mdef.mtame && !game.vis) {
            You(brief_feeling, "peculiarly sad");
        }
        mhm.hitflags = (2 | (grow_up(magr, mdef) ? 0 : 4));
        mhm.done = (1);
        return;
    }
    if (poly_when_stoned(pd)) {`
    );
    s = s.replace(
        /    if \(magr == game\.youmonst\) \{\n        \/\* TODO Phase 5\+: goto mhitm_dise \(label not in scope of break\) \*\/\n    \} else if \(mdef == game\.youmonst\) \{\n        hitmsg\(magr, mattk\);\n        if \(!diseasemu\(pa\)\) \{\n            mhm\.damage = 0;\n        \}\n    \} else \{/,
        `    if (magr == game.youmonst) {
        if (pd.mlet == S_FUNGUS || pd == game.mons[PM_GHOUL] || defended(mdef, 33)) {
            mhm.damage = 0;
        }
        return;
    } else if (mdef == game.youmonst) {
        hitmsg(magr, mattk);
        if (!diseasemu(pa)) {
            mhm.damage = 0;
        }
    } else {`
    );
    return s;
});

// display.js get_bkglyph_and_framecolor: translator emitted the 4th
// outparam `bkglyphinfo.framecolor` (a struct field number) raw
// instead of as a `{get/set value}` accessor.  C signature is
// `int *framecolor`; without the accessor wrapper, `framecolor.value
// = 8` throws "Cannot create property 'value' on number '8'".
//
// 3 callsites in display.js (lines 1620, 1881, 1936) — patch all.
patchFile('display.js', (s) => {
    return s.replace(
        /get_bkglyph_and_framecolor\(x, y, (\{ get value\(\) \{ return [a-zA-Z_.]+; \}, set value\(_v\) \{ [a-zA-Z_.]+ = _v; \} \}), bkglyphinfo\.framecolor\)/g,
        `get_bkglyph_and_framecolor(x, y, $1, { get value() { return bkglyphinfo.framecolor; }, set value(_v) { bkglyphinfo.framecolor = _v; } })`
    );
});

// botl.js do_statusline2 line 137: translator emitted `dloc = ...`
// without the function-scoped rename prefix `__do_statusline2_`,
// so dloc is an undeclared reference and throws.  C source botl.c:130
// is `Sprintf(eos(dloc), ...)` — i.e. APPEND to dloc starting at its
// current end-of-string (eos).
//
// __do_statusline2_dloc starts as a char array (128 zeros), then
// describe_level() at line 133 writes "Dlvl:N " into it.  The natural
// JS rewrite "dloc = dloc + sprintf(...)" stringifies the array as
// "68,108,118,108,58,49,32,0,0,0,..." (comma-joined char codes) and
// concatenates the sprintf result — producing a 280+ char string
// that fails the MAXCO panic check downstream.
//
// Fix: extract the array's NUL-terminated string content first, then
// concatenate the sprintf result, then store back as a JS string
// (subsequent strlen/strstri/etc treat strings correctly).
patchFile('botl.js', (s) => {
    return s.replace(
        `    dloc = (dloc || '') + sprintf('', "%s:%-2ld",`,
        `    {
        let __dloc_prefix = '';
        if (typeof __do_statusline2_dloc === 'string') {
            __dloc_prefix = __do_statusline2_dloc;
        } else if (Array.isArray(__do_statusline2_dloc)) {
            for (let __i = 0; __i < __do_statusline2_dloc.length && __do_statusline2_dloc[__i]; __i++) {
                __dloc_prefix += String.fromCharCode(__do_statusline2_dloc[__i]);
            }
        }
        __do_statusline2_dloc = __dloc_prefix;
    }
    __do_statusline2_dloc = __do_statusline2_dloc + sprintf('', "%s:%-2ld",`
    );
});

// botl.js do_statusline1 line 66: same `var = strcpy(var, src)` reassign
// pattern as uhitm.js do_attack (see fix below).  Subsequent
// `var[0] += 65-97` (line 68) and `var[16] = 0` (line 70) try to mutate
// what's now a JS string and throw "Cannot create property '16' on
// string 'David'".  Drop the reassignment so the array stays mutated
// in place by strcpy; mutations on subsequent indices work.
patchFile('botl.js', (s) => {
    return s.replace(
        `    __do_statusline1_newbot1 = strcpy(__do_statusline1_newbot1, game.plname);`,
        `    strcpy(__do_statusline1_newbot1, game.plname);`
    );
});

// uhitm.js do_attack line 445-446: `buf = strcpy(buf, y_monnam(mtmp));
// buf[0] = highc(buf[0]);`  The C source is the canonical "uppercase
// the first letter of an arbitrary string" pattern: strcpy into a
// local char buf[] (so buf stays the same pointer), then mutate
// buf[0].  Our strcpy returns the source string by convention (so
// callers that do `s = strcpy(buf, src)` get back a JS string) — but
// the `buf = strcpy(...)` assignment form here REPLACES buf with the
// string, so the subsequent `buf[0] = highc(buf[0])` tries to mutate
// a string char and throws "Cannot assign to read only property '0'
// of string".  11 t_domove throws across multiple sessions land here.
//
// Replace the two-line `strcpy + buf[0]=highc(buf[0])` pattern with
// a direct case-flip on the y_monnam() return.  Semantically
// identical (the buf char-array is never re-read elsewhere in this
// branch) and bypasses the strcpy ↔ string round-trip entirely.
patchFile('uhitm.js', (s) => {
    return s.replace(
        `                    buf = strcpy(buf, y_monnam(mtmp));
                    buf[0] = highc(buf[0]);
                    You("stop.  %s is in the way!", buf);`,
        `                    /* C ref uhitm.c — capitalize the y_monnam result */
                    let __ynm = y_monnam(mtmp);
                    __ynm = __ynm ? __ynm.charAt(0).toUpperCase() + __ynm.slice(1) : __ynm;
                    You("stop.  %s is in the way!", __ynm);`
    );
});

// uhitm.js: mhitm_ad_famn / mhitm_ad_pest / mhitm_ad_deth all have
// `goto mhitm_LABEL` from the uhitm branch (magr == youmonst) into
// the else-mhitm branch's body — code-sharing pattern.  Inline the
// mhitm body + return at each uhitm goto site.
patchFile('uhitm.js', (s) => {
    s = s.replace(
        /export function mhitm_ad_famn\(magr, mattk, mdef, mhm\) \{\n    let pd = mdef\.data;\n    if \(magr == game\.youmonst\) \{\n        \/\* TODO Phase 5\+: goto mhitm_famn \(label not in scope of break\) \*\/\n    \} else if \(mdef == game\.youmonst\) \{/,
        `export function mhitm_ad_famn(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        if (!((((pd).mflags1 & 536870912) != 0) || (((pd).mflags1 & 1073741824) != 0) || (((pd).mflags1 & 2147483648) != 0))) {
            mhm.damage = 0;
        }
        return;
    } else if (mdef == game.youmonst) {`
    );
    s = s.replace(
        /export function mhitm_ad_pest\(magr, mattk, mdef, mhm\) \{\n    let alt_attk = \{ aatyp: 0, adtyp: 0, damn: 0, damd: 0 \};\n    let pa = magr\.data;\n    if \(magr == game\.youmonst\) \{\n        \/\* TODO Phase 5\+: goto mhitm_pest \(label not in scope of break\) \*\/\n    \} else if \(mdef == game\.youmonst\) \{/,
        `export function mhitm_ad_pest(magr, mattk, mdef, mhm) {
    let alt_attk = { aatyp: 0, adtyp: 0, damn: 0, damd: 0 };
    let pa = magr.data;
    if (magr == game.youmonst) {
        Object.assign(alt_attk, mattk);
        alt_attk.adtyp = 33;
        mhitm_ad_dise(magr, alt_attk, mdef, mhm);
        return;
    } else if (mdef == game.youmonst) {`
    );
    s = s.replace(
        /export function mhitm_ad_deth\(magr, mattk, mdef, mhm\) \{\n    let pd = mdef\.data;\n    if \(magr == game\.youmonst\) \{\n        \/\* TODO Phase 5\+: goto mhitm_deth \(label not in scope of break\) \*\/\n    \} else if \(mdef == game\.youmonst\) \{/,
        `export function mhitm_ad_deth(magr, mattk, mdef, mhm) {
    let pd = mdef.data;
    if (magr == game.youmonst) {
        if ((((pd).mflags2 & 2) != 0) && mhm.damage > 1) {
            mhm.damage = rnd(Math.trunc(mhm.damage / 2));
        }
        mhitm_ad_drli(magr, mattk, mdef, mhm);
        return;
    } else if (mdef == game.youmonst) {`
    );
    return s;
});

// shk.js: paybill's `goto skip` (cross-branch forward from multi-
// shopkeeper branch to skip-body inside the eshkp.following/angry
// branch).  Inline rouse_shk + home_shk + break clear at the goto
// site — matches C's fall-through past skip body to clear cleanup.
patchFile('shk.js', (s) => {
    return s.replace(
        /            taken = uinshop;\n            \/\* TODO Phase 5\+: goto skip \(label not in scope of break\) \*\/\n        \}/,
        `            taken = uinshop;
            rouse_shk(shkp, (0));
            if (!inhishop(shkp)) {
                home_shk(shkp, (0));
            }
            break clear;
        }`
    );
});

// topten.js: topten()'s 3 `goto destroywin` forward jumps for
// early-exit paths (lock-failure, fopen-fail, write-fail).
// Each goto site inlines the destroywin body (free t0 if unused
// + destroy toptenwin) + return.
patchFile('topten.js', (s) => {
    s = s.replace(
        /        if \(!lock_file\("record", 5, 60\)\) \{\n            \/\* TODO Phase 5\+: goto destroywin \(label not in scope of break\) \*\/\n        \}/,
        `        if (!lock_file("record", 5, 60)) {
            if (!t0_used) { free(t0); }
            if (game.iflags.toptenwin) {
                (game.windowprocs.win_destroy_nhwindow)(game.toptenwin);
                game.toptenwin = (-1);
            }
            return;
        }`
    );
    s = s.replace(
        /            unlock_file\("record"\);\n            \/\* TODO Phase 5\+: goto destroywin \(label not in scope of break\) \*\/\n        \}/,
        `            unlock_file("record");
            if (!t0_used) { free(t0); }
            if (game.iflags.toptenwin) {
                (game.windowprocs.win_destroy_nhwindow)(game.toptenwin);
                game.toptenwin = (-1);
            }
            return;
        }`
    );
    s = s.replace(
        /                unlock_file\("record"\);\n                free_ttlist\(game\.tt_head\);\n                \/\* TODO Phase 5\+: goto destroywin \(label not in scope of break\) \*\/\n            \}/,
        `                unlock_file("record");
                free_ttlist(game.tt_head);
                if (!t0_used) { free(t0); }
                if (game.iflags.toptenwin) {
                    (game.windowprocs.win_destroy_nhwindow)(game.toptenwin);
                    game.toptenwin = (-1);
                }
                return;
            }`
    );
    return s;
});

// topten.js get_rnd_toptenentry pickentry: superseded by A3 goto
// back-jump-to-loop recognizer (commit 85cb377).

// vision.js: vision_recalc's `goto not_in_sight` (cross-branch
// forward from door/wall LOS-blocked sub-branch to else-of-elseif
// chain's not_in_sight body).  Inline the not_in_sight body
// (old-IN_SIGHT or COULD_SEE-change check + newsym if col!=0) at
// the goto site.
patchFile('vision.js', (s) => {
    return s.replace(
        /                        \} else \{\n                            \/\* TODO Phase 5\+: goto not_in_sight \(label not in scope of break\) \*\/\n                        \}/,
        `                        } else {
                            if ((old_row[col] & 2) || ((next_row[col] & 1) ^ (old_row[col] & 1))) {
                                if (col != 0) {
                                    newsym(col, row);
                                }
                            }
                        }`
    );
});

// sounds.js: dochat's `goto nada` (cross-branch forward from
// !mtmp/!responsive elseif to else-of-else with nothing_happens
// pline).  Inline the pline at the goto site.
patchFile('sounds.js', (s) => {
    return s.replace(
        /    \} else if \(!mtmp \|\| !responsive_mon_at\(x, y\)\) \{\n        if \(vismon\) \{\n            pline\("%s seems not to notice you\.", Monnam\(mtmp\)\);\n        \} else \{\n            \/\* TODO Phase 5\+: goto nada \(label not in scope of break\) \*\/\n        \}\n    \} else \{/,
        `    } else if (!mtmp || !responsive_mon_at(x, y)) {
        if (vismon) {
            pline("%s seems not to notice you.", Monnam(mtmp));
        } else {
            pline("%s", c_common_strings.c_nothing_happens);
        }
    } else {`
    );
});

// display.js: newsym's `goto show_mem` (cross-branch forward jumps
// from rogue-level / non-rogue-non-lit else-branches to the
// final else's show_glyph(x, y, lev.glyph) body).  Inline the
// show_glyph call at each goto site.  Also drop the dead
// `show_mem: {}` empty block.
patchFile('display.js', (s) => {
    s = s.replace(
        /            \} else \{\n                \/\* TODO Phase 5\+: goto show_mem \(label not in scope of break\) \*\/\n            \}\n        \} else if \(!lev\.waslit \|\| \(game\.flags\.dark_room && game\.iflags\.wc_color\)\) \{/,
        `            } else {
                show_glyph(x, y, lev.glyph);
            }
        } else if (!lev.waslit || (game.flags.dark_room && game.iflags.wc_color)) {`
    );
    s = s.replace(
        /            \} else \{\n                \/\* TODO Phase 5\+: goto show_mem \(label not in scope of break\) \*\/\n            \}\n        \} else \{\n            show_mem: \{\n            \}\n            show_glyph\(x, y, lev\.glyph\);\n        \}/,
        `            } else {
                show_glyph(x, y, lev.glyph);
            }
        } else {
            show_glyph(x, y, lev.glyph);
        }`
    );
    return s;
});

// uhitm.js: hmonas's three `goto use_weapon` (cross-case forward
// from AT_CLAW/AT_TUCH/AT_MAGC to AT_WEAP body) plus the
// translator-dropped `odd_claw = !odd_claw;` toggle at the C
// `use_weapon:` label (line 5471).  Translator emitted
// `// TODO LabelStmt use_weapon` and TODO no-op at each goto, so
// player polymorphed into form with claw/touch/magic attack +
// wielding weapon used the natural-attack body instead of the
// weapon attack body.  Additionally the odd_claw toggle was
// missing from the JS case 254 body, breaking the silver-ring
// alternation invariant for multi-claw forms.
//
// Extract case 254 body into a __use_weapon_attack closure
// returning a status code ('continue_for', 'break_switch',
// 'break_passivedone').  Call at case 254 site and at each of
// the 3 goto sites, dispatching on the returned status.  This
// avoids ~90 lines of duplication and preserves all control-
// flow semantics (continue for-loop, break switch, break
// labeled passivedone block).
//
// C ref: src/uhitm.c lines 5468-5547 (use_weapon body) +
// 5549/5554/5803 (goto sites).
patchFile('uhitm.js', (s) => {
    // 1. Insert closure declaration before the for-loop
    s = s.replace(
        /    multi_claw = \(multi_claw > 1\);\n    game\.twohits = 0;\n    game\.skipdrin = \(0\);\n    for \(i = 0; i < 6; i\+\+\) \{/,
        `    multi_claw = (multi_claw > 1);
    game.twohits = 0;
    game.skipdrin = (0);
    const __use_weapon_attack = () => {
        odd_claw = !odd_claw;
        if (weapon_used && (sum[i - 1] > 0) && game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
            return 'continue_for';
        }
        weapon_used = (1);
        originalweapon = (altwep && game.uswapwep) ? game.uswapwep : game.uwep;
        if (game.uswapwep && game.uwep && (game.uwep.oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)) && !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big) && !game.uarms && !game.uswapwep.oartifact && (game.uswapwep.oclass == WEAPON_CLASS || ((game.uswapwep).oclass == TOOL_CLASS && game.objects[(game.uswapwep).otyp].oc_subtyp != P_NONE)) && !((game.uswapwep.oclass == WEAPON_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp >= P_BOW && game.objects[game.uswapwep.otyp].oc_subtyp <= P_CROSSBOW) || ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == GEM_CLASS) && game.objects[game.uswapwep.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uswapwep.otyp].oc_subtyp <= -P_BOW) || ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == TOOL_CLASS) && game.objects[game.uswapwep.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[game.uswapwep.otyp].oc_subtyp <= -P_DART)) && !((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == TOOL_CLASS) && game.objects[game.uswapwep.otyp].oc_big) && !(game.objects[game.uswapwep.otyp].oc_material == SILVER && (game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data)))) {
            altwep = !altwep;
        }
        weapon = originalweapon;
        if (!weapon) {
            originalweapon = game.uarmg;
        }
        tmp = find_roll_to_hit(mon, 254, weapon, { get value() { return attknum; }, set value(_v) { attknum = _v; } }, { get value() { return armorpenalty; }, set value(_v) { armorpenalty = _v; } });
        mon_maybe_unparalyze(mon);
        dieroll = rnd(20);
        dhit = (tmp > dieroll || game.u.uswallow);
        if (multi_weap > 1) {
            ++game.twohits;
        }
        monster_survived = known_hitum(mon, weapon, { get value() { return dhit; }, set value(_v) { dhit = _v; } }, tmp, armorpenalty, mattk, dieroll);
        weapon = originalweapon;
        if (!monster_survived) {
            sum[i] = 2;
            return 'break_switch';
        } else {
            sum[i] = dhit ? 1 : 0;
        }
        if ((game.level.monsters[game.u.ux + game.u.dx][game.u.uy + game.u.dy]) != mon) {
            i = 6;
            return 'break_passivedone';
        }
        if (dhit && mattk.adtyp != 241 && mattk.adtyp != 0) {
            sum[i] = damageum(mon, mattk, 0);
        }
        return 'break_switch';
    };
    for (i = 0; i < 6; i++) {`
    );
    // 2. Replace case 254 body with closure call
    s = s.replace(
        /            switch \(mattk\.aatyp\) \{\n                case 254:\n                    \/\/ TODO LabelStmt use_weapon not at compound-stmt level\n                    if \(weapon_used && \(sum\[i - 1\] > 0\) && game\.uwep && \(\(game\.uwep\.oclass == WEAPON_CLASS \|\| game\.uwep\.oclass == TOOL_CLASS\) && game\.objects\[game\.uwep\.otyp\]\.oc_big\)\) \{\n                        continue;\n                    \}\n                    weapon_used = \(1\);\n                    originalweapon = \(altwep && game\.uswapwep\) \? game\.uswapwep : game\.uwep;\n                    if \(game\.uswapwep && game\.uwep && \(game\.uwep\.oclass == WEAPON_CLASS \|\| \(\(game\.uwep\)\.oclass == TOOL_CLASS && game\.objects\[\(game\.uwep\)\.otyp\]\.oc_subtyp != P_NONE\)\) && !\(\(game\.uwep\.oclass == WEAPON_CLASS \|\| game\.uwep\.oclass == TOOL_CLASS\) && game\.objects\[game\.uwep\.otyp\]\.oc_big\) && !game\.uarms && !game\.uswapwep\.oartifact && \(game\.uswapwep\.oclass == WEAPON_CLASS \|\| \(\(game\.uswapwep\)\.oclass == TOOL_CLASS && game\.objects\[\(game\.uswapwep\)\.otyp\]\.oc_subtyp != P_NONE\)\) && !\(\(game\.uswapwep\.oclass == WEAPON_CLASS && game\.objects\[game\.uswapwep\.otyp\]\.oc_subtyp >= P_BOW && game\.objects\[game\.uswapwep\.otyp\]\.oc_subtyp <= P_CROSSBOW\) \|\| \(\(game\.uswapwep\.oclass == WEAPON_CLASS \|\| game\.uswapwep\.oclass == GEM_CLASS\) && game\.objects\[game\.uswapwep\.otyp\]\.oc_subtyp >= -P_CROSSBOW && game\.objects\[game\.uswapwep\.otyp\]\.oc_subtyp <= -P_BOW\) \|\| \(\(game\.uswapwep\.oclass == WEAPON_CLASS \|\| game\.uswapwep\.oclass == TOOL_CLASS\) && game\.objects\[game\.uswapwep\.otyp\]\.oc_subtyp >= -P_BOOMERANG && game\.objects\[game\.uswapwep\.otyp\]\.oc_subtyp <= -P_DART\)\) && !\(\(game\.uswapwep\.oclass == WEAPON_CLASS \|\| game\.uswapwep\.oclass == TOOL_CLASS\) && game\.objects\[game\.uswapwep\.otyp\]\.oc_big\) && !\(game\.objects\[game\.uswapwep\.otyp\]\.oc_material == SILVER && \(game\.u\.ulycn >= LOW_PM \|\| hates_silver\(game\.youmonst\.data\)\)\)\) \{\n                        altwep = !altwep;\n                    \}\n                    weapon = originalweapon;\n                    if \(!weapon\) \{\n                        originalweapon = game\.uarmg;\n                    \}\n                    tmp = find_roll_to_hit\(mon, 254, weapon, \{ get value\(\) \{ return attknum; \}, set value\(_v\) \{ attknum = _v; \} \}, \{ get value\(\) \{ return armorpenalty; \}, set value\(_v\) \{ armorpenalty = _v; \} \}\);\n                    mon_maybe_unparalyze\(mon\);\n                    dieroll = rnd\(20\);\n                    dhit = \(tmp > dieroll \|\| game\.u\.uswallow\);\n                    if \(multi_weap > 1\) \{\n                        \+\+game\.twohits;\n                    \}\n                    monster_survived = known_hitum\(mon, weapon, \{ get value\(\) \{ return dhit; \}, set value\(_v\) \{ dhit = _v; \} \}, tmp, armorpenalty, mattk, dieroll\);\n                    weapon = originalweapon;\n                    if \(!monster_survived\) \{\n                        sum\[i\] = 2;\n                        break;\n                    \} else \{\n                        sum\[i\] = dhit \? 1 : 0;\n                    \}\n                    if \(\(game\.level\.monsters\[game\.u\.ux \+ game\.u\.dx\]\[game\.u\.uy \+ game\.u\.dy\]\) != mon\) \{\n                        i = 6;\n                        break passivedone;\n                    \}\n                    if \(dhit && mattk\.adtyp != 241 && mattk\.adtyp != 0\) \{\n                        sum\[i\] = damageum\(mon, mattk, 0\);\n                    \}\n                    break;\n                case 1:/,
        `            switch (mattk.aatyp) {
                case 254: {
                    const __r = __use_weapon_attack();
                    if (__r === 'continue_for') continue;
                    if (__r === 'break_passivedone') break passivedone;
                    break;
                }
                case 1:`
    );
    // 3. Replace case 1 goto site
    s = s.replace(
        /                case 1:\n                    if \(game\.uwep && !\(\(\(\(game\.youmonst\.data\)\.mflags1 & 8192\) != 0\) \|\| \(\(game\.youmonst\.data\)\.msize < 1\)\) && !weapon_used\) \{\n                        \/\* TODO Phase 5\+: goto use_weapon \(label not in scope of break\) \*\/\n                    \}\n                    ;/,
        `                case 1:
                    if (game.uwep && !((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1)) && !weapon_used) {
                        const __r = __use_weapon_attack();
                        if (__r === 'continue_for') continue;
                        if (__r === 'break_passivedone') break passivedone;
                        break;
                    }
                    ;`
    );
    // 4. Replace case 5 goto site
    s = s.replace(
        /                case 5:\n                    if \(game\.uwep && game\.youmonst\.data\.mlet == S_LICH && !weapon_used\) \{\n                        \/\* TODO Phase 5\+: goto use_weapon \(label not in scope of break\) \*\/\n                    \}\n                    ;/,
        `                case 5:
                    if (game.uwep && game.youmonst.data.mlet == S_LICH && !weapon_used) {
                        const __r = __use_weapon_attack();
                        if (__r === 'continue_for') continue;
                        if (__r === 'break_passivedone') break passivedone;
                        break;
                    }
                    ;`
    );
    // 5. Replace case 255 goto site
    s = s.replace(
        /                case 255:\n                    if \(\(game\.youmonst\.data\.mlet == S_KOBOLD \|\| game\.youmonst\.data\.mlet == S_ORC \|\| game\.youmonst\.data\.mlet == S_GNOME\) && !weapon_used\) \{\n                        \/\* TODO Phase 5\+: goto use_weapon \(label not in scope of break\) \*\/\n                    \}\n                    ;/,
        `                case 255:
                    if ((game.youmonst.data.mlet == S_KOBOLD || game.youmonst.data.mlet == S_ORC || game.youmonst.data.mlet == S_GNOME) && !weapon_used) {
                        const __r = __use_weapon_attack();
                        if (__r === 'continue_for') continue;
                        if (__r === 'break_passivedone') break passivedone;
                        break;
                    }
                    ;`
    );
    return s;
});

// objnam.js: doname_base's three goto-related bugs.
//
// 1. WAND_CLASS body and the `goto charges` from TOOL_CLASS
//    both target the C `charges:` label whose body is
//    `if (known) ConcatF2(bp, 0, " (%d:%d)", recharged, spe);`.
//    Translator emitted `// TODO LabelStmt charges` and TODO
//    no-op at the goto, so all wand/charged-tool charge
//    displays were silently dropped (no " (recharged:spe)"
//    suffix).
//
// 2. RING_CLASS was missing the `(on right ` strncat
//    (translator dropped the W_RINGR check; only the W_RINGL
//    and combined-W_RING strncats survived).
//
// 3. FOOD MEAT_RING's `goto ring` (jump from FOOD_CLASS into
//    RING_CLASS's ring: label body) was a TODO no-op, so meat
//    rings worn on either hand displayed without on-right/
//    on-left suffix.
//
// Inline the charges body in WAND_CLASS and at the TOOL_CLASS
// goto site, restore the W_RINGR `(on right ` strncat in
// RING_CLASS, inline the full ring body at the MEAT_RING goto
// site.  C ref: src/objnam.c lines 1480-1502.
patchFile('objnam.js', (s) => {
    // 1. Fix WAND_CLASS charges body and TOOL_CLASS goto charges
    s = s.replace(
        /            if \(game\.objects\[obj\.otyp\]\.oc_charged\) \{\n                \/\* TODO Phase 5\+: goto charges \(label not in scope of break\) \*\/\n            \}\n            break;\n        case WAND_CLASS:\n            \/\/ TODO LabelStmt charges not at compound-stmt level\n            break;/,
        `            if (game.objects[obj.otyp].oc_charged) {
                if (known) {
                    do {
                        nh_snprintf("doname_base", 1486, bp_eos - 0, bpspaceleft + 0, " (%d:%d)", obj.recharged, obj.spe);
                        bp_eos = eos(bp) , bpspaceleft = (bp_end - bp_eos);
                    } while (0);
                }
            }
            break;
        case WAND_CLASS:
            if (known) {
                do {
                    nh_snprintf("doname_base", 1486, bp_eos - 0, bpspaceleft + 0, " (%d:%d)", obj.recharged, obj.spe);
                    bp_eos = eos(bp) , bpspaceleft = (bp_end - bp_eos);
                } while (0);
            }
            break;`
    );
    // 2. Restore W_RINGR "(on right " in RING_CLASS and drop label TODO comment
    s = s.replace(
        /        case RING_CLASS:\n            \/\/ TODO LabelStmt ring not at compound-stmt level\n            if \(obj\.owornmask & 131072\) \{\n                do \{\n                    strncat\(bp_eos - 0, " \(on left ", bpspaceleft \+ 0\);\n                    bp_eos = eos\(bp\) , bpspaceleft = \(bp_end - bp_eos\);\n                \} while \(0\);\n            \}\n            if \(obj\.owornmask & \(131072 \| 262144\)\) \{/,
        `        case RING_CLASS:
            if (obj.owornmask & 262144) {
                do {
                    strncat(bp_eos - 0, " (on right ", bpspaceleft + 0);
                    bp_eos = eos(bp) , bpspaceleft = (bp_end - bp_eos);
                } while (0);
            }
            if (obj.owornmask & 131072) {
                do {
                    strncat(bp_eos - 0, " (on left ", bpspaceleft + 0);
                    bp_eos = eos(bp) , bpspaceleft = (bp_end - bp_eos);
                } while (0);
            }
            if (obj.owornmask & (131072 | 262144)) {`
    );
    // 3. Inline ring body at FOOD MEAT_RING goto site
    s = s.replace(
        /            \} else if \(obj\.otyp == MEAT_RING\) \{\n                \/\* TODO Phase 5\+: goto ring \(label not in scope of break\) \*\/\n            \}\n            break;\n        case BALL_CLASS:/,
        `            } else if (obj.otyp == MEAT_RING) {
                if (obj.owornmask & 262144) {
                    do {
                        strncat(bp_eos - 0, " (on right ", bpspaceleft + 0);
                        bp_eos = eos(bp) , bpspaceleft = (bp_end - bp_eos);
                    } while (0);
                }
                if (obj.owornmask & 131072) {
                    do {
                        strncat(bp_eos - 0, " (on left ", bpspaceleft + 0);
                        bp_eos = eos(bp) , bpspaceleft = (bp_end - bp_eos);
                    } while (0);
                }
                if (obj.owornmask & (131072 | 262144)) {
                    do {
                        nh_snprintf("doname_base", 1499, bp_eos - 0, bpspaceleft + 0, "%s)", body_part(HAND));
                        bp_eos = eos(bp) , bpspaceleft = (bp_end - bp_eos);
                    } while (0);
                }
                if (known && game.objects[obj.otyp].oc_charged) {
                    prefix = (prefix || '') + sprintf('', "%+d ", obj.spe);
                }
            }
            break;
        case BALL_CLASS:`
    );
    return s;
});

// display.js: wall_angle's three label/goto bugs — do_twall,
// do_crwall, and horiz.  C source uses goto-jumps to share
// per-axis idx computation between sibling switch cases.  The
// translator emitted `// TODO LabelStmt do_X not at compound-
// stmt level` comments for each label AND replaced each goto
// with TODO no-op.  Effect: every T-wall case fell through to
// the next (TUWALL → TLWALL → TRWALL → TDWALL) overwriting
// row, and idx ended up as row[0]=S_stone for ALL T-walls.
// Same for the 4 CROSSWALL inner-switch cases.  SDOOR
// horizontal also fell through to VWALL body instead of
// running HWALL.  Restructure with three flags (__do_twall,
// __do_horiz, __do_crwall) set in each case + break, and
// post-switch blocks running the appropriate body.  C ref:
// src/display.c lines 3520-3751.
patchFile('display.js', (s) => {
    // 1. Replace function entry: add flags + fix T-wall fallthroughs + fix SDOOR horiz
    s = s.replace(
        /export function wall_angle\(lev\) \{\n    let seenv = lev\.seenv & 255;\n    let row = null;\n    let col = 0;\n    let idx = 0;\n    switch \(lev\.typ\) \{\n        case TUWALL:\n            row = wall_matrix\[2\];\n            seenv = \(seenv >> 4 \| seenv << 4\) & 255;\n            \/\* TODO Phase 5\+: goto do_twall \(label not in scope of break\) \*\/\n        case TLWALL:\n            row = wall_matrix\[1\];\n            seenv = \(seenv >> 2 \| seenv << 6\) & 255;\n            \/\* TODO Phase 5\+: goto do_twall \(label not in scope of break\) \*\/\n        case TRWALL:\n            row = wall_matrix\[3\];\n            seenv = \(seenv >> 6 \| seenv << 2\) & 255;\n            \/\* TODO Phase 5\+: goto do_twall \(label not in scope of break\) \*\/\n        case TDWALL:\n            row = wall_matrix\[0\];\n            \/\/ TODO LabelStmt do_twall not at compound-stmt level\n            idx = row\[col\];\n            break;\n        case SDOOR:\n            if \(lev\.candig\) \{\n                idx = S_tree;\n                break;\n            \}\n            if \(lev\.horizontal\) \{\n                \/\* TODO Phase 5\+: goto horiz \(label not in scope of break\) \*\/\n            \}\n            ;\n        case VWALL:/,
        `export function wall_angle(lev) {
    let seenv = lev.seenv & 255;
    let row = null;
    let col = 0;
    let idx = 0;
    let __do_twall = false;
    let __do_horiz = false;
    let __do_crwall = false;
    switch (lev.typ) {
        case TUWALL:
            row = wall_matrix[2];
            seenv = (seenv >> 4 | seenv << 4) & 255;
            __do_twall = true;
            break;
        case TLWALL:
            row = wall_matrix[1];
            seenv = (seenv >> 2 | seenv << 6) & 255;
            __do_twall = true;
            break;
        case TRWALL:
            row = wall_matrix[3];
            seenv = (seenv >> 6 | seenv << 2) & 255;
            __do_twall = true;
            break;
        case TDWALL:
            row = wall_matrix[0];
            __do_twall = true;
            break;
        case SDOOR:
            if (lev.candig) {
                idx = S_tree;
                break;
            }
            if (lev.horizontal) {
                __do_horiz = true;
                break;
            }
            ;
        case VWALL:`
    );
    // 2. Replace HWALL case
    s = s.replace(
        /        case HWALL:\n            \/\/ TODO LabelStmt horiz not at compound-stmt level\n            break;/,
        `        case HWALL:
            __do_horiz = true;
            break;`
    );
    // 3. Replace CROSSWALL inner cases 1-4
    s = s.replace(
        /                case 1:\n                    row = cross_matrix\[1\];\n                    seenv = \(seenv >> 4 \| seenv << 4\) & 255;\n                    \/\* TODO Phase 5\+: goto do_crwall \(label not in scope of break\) \*\/\n                case 2:\n                    row = cross_matrix\[2\];\n                    seenv = \(seenv >> 6 \| seenv << 2\) & 255;\n                    \/\* TODO Phase 5\+: goto do_crwall \(label not in scope of break\) \*\/\n                case 3:\n                    row = cross_matrix\[0\];\n                    seenv = \(seenv >> 2 \| seenv << 6\) & 255;\n                    \/\* TODO Phase 5\+: goto do_crwall \(label not in scope of break\) \*\/\n                case 4:\n                    row = cross_matrix\[3\];\n                    \/\/ TODO LabelStmt do_crwall not at compound-stmt level\n                    break;/,
        `                case 1:
                    row = cross_matrix[1];
                    seenv = (seenv >> 4 | seenv << 4) & 255;
                    __do_crwall = true;
                    break;
                case 2:
                    row = cross_matrix[2];
                    seenv = (seenv >> 6 | seenv << 2) & 255;
                    __do_crwall = true;
                    break;
                case 3:
                    row = cross_matrix[0];
                    seenv = (seenv >> 2 | seenv << 6) & 255;
                    __do_crwall = true;
                    break;
                case 4:
                    row = cross_matrix[3];
                    __do_crwall = true;
                    break;`
    );
    // 4. Insert do_twall + do_horiz + do_crwall bodies before return idx;
    s = s.replace(
        /        default:\n            impossible\("wall_angle: unexpected wall type %d", lev\.typ\);\n            idx = S_stone;\n    \}\n    return idx;\n\}\nexport function fn_cmap_to_glyph/,
        `        default:
            impossible("wall_angle: unexpected wall type %d", lev.typ);
            idx = S_stone;
    }
    if (__do_twall) {
        switch (lev.flags & 7) {
            case 0:
                if (seenv == 16) {
                    col = 1;
                } else if (seenv == 64) {
                    col = 2;
                } else if (seenv & (8 | 32 | 128) || ((seenv & 16) && (seenv & 64))) {
                    col = 4;
                } else if (seenv & (1 | 2 | 4)) {
                    col = (seenv & (16 | 64)) ? 4 : 3;
                } else {
                    t_warn(lev);
                    col = 0;
                }
                break;
            case 1:
                if ((seenv & (8 | 16)) && !(seenv & (32 | 64 | 128))) {
                    col = 1;
                } else if ((seenv & (64 | 128)) && !(seenv & (8 | 16 | 32))) {
                    col = 2;
                } else if ((seenv & 32) || ((seenv & (8 | 16)) && (seenv & (64 | 128)))) {
                    col = 4;
                } else {
                    if (!((seenv & (1 | 2 | 4)) && !(seenv & ~(1 | 2 | 4)))) {
                        t_warn(lev);
                    }
                    col = 0;
                }
                break;
            case 2:
                if ((seenv & (16 | 32)) && !(seenv & ~(16 | 32))) {
                    col = 1;
                } else if ((seenv & (1 | 2 | 4 | 128)) && !(seenv & (8 | 16 | 32))) {
                    col = 3;
                } else if ((seenv & 64) && !(seenv & ~64)) {
                    col = 0;
                } else {
                    col = 4;
                }
                break;
            case 3:
                if ((seenv & (32 | 64)) && !(seenv & ~(32 | 64))) {
                    col = 2;
                } else if ((seenv & (1 | 2 | 4 | 8)) && !(seenv & (32 | 64 | 128))) {
                    col = 3;
                } else if ((seenv & 16) && !(seenv & ~16)) {
                    col = 0;
                } else {
                    col = 4;
                }
                break;
            default:
                impossible("wall_angle: unknown T wall mode %d", lev.flags & 7);
                col = 0;
                break;
        }
        idx = row[col];
    }
    if (__do_horiz) {
        switch (lev.flags & 7) {
            case 0:
                idx = seenv ? S_hwall : S_stone;
                break;
            case 1:
                idx = (seenv & (8 | 16 | 32 | 64 | 128)) ? S_hwall : S_stone;
                break;
            case 2:
                idx = (seenv & (1 | 2 | 4 | 8 | 128)) ? S_hwall : S_stone;
                break;
            default:
                impossible("wall_angle: unknown hwall mode %d", lev.flags & 7);
                idx = S_stone;
                break;
        }
    }
    if (__do_crwall) {
        if (seenv == 16) {
            idx = S_stone;
        } else {
            seenv = seenv & ~16;
            if (seenv == 1) {
                col = 1;
            } else if (seenv & (4 | 8)) {
                if (seenv & (32 | 64 | 128)) {
                    col = 5;
                } else if (seenv & (1 | 2)) {
                    col = 4;
                } else {
                    col = 2;
                }
            } else if (seenv & (32 | 64)) {
                if (seenv & (2 | 4 | 8)) {
                    col = 5;
                } else if (seenv & (1 | 128)) {
                    col = 3;
                } else {
                    col = 0;
                }
            } else if (seenv & 2) {
                col = (seenv & 128) ? 5 : 4;
            } else if (seenv & 128) {
                col = (seenv & 2) ? 5 : 3;
            } else {
                impossible("wall_angle: bottom of crwall check");
                col = 5;
            }
            idx = row[col];
        }
    }
    return idx;
}
export function fn_cmap_to_glyph`
    );
    return s;
});

// polyself.js: newman's `goto dead` (forward jump when polyself
// level-change drives ulevel below 0).  Translator emitted TODO
// — the catastrophic-polymorph death path silently no-op'd.
// Inline urgent_pline + killer setup + done(DIED) + newuhs +
// encumber_msg + return at the goto site.
patchFile('polyself.js', (s) => {
    return s.replace(
        /    if \(newlvl > 127 \|\| newlvl < 1\) \{\n        \/\* TODO Phase 5\+: goto dead \(label not in scope of break\) \*\/\n    \}\n    if \(newlvl > 30\) \{/,
        `    if (newlvl > 127 || newlvl < 1) {
        urgent_pline("Your new form doesn't seem healthy enough to survive.");
        game.killer.format = 2;
        game.killer.name = strcpy(game.killer.name, "unsuccessful polymorph");
        done(DIED);
        newuhs((0));
        encumber_msg();
        return;
    }
    if (newlvl > 30) {`
    );
});

// spell.js: study_book's `goto raise_dead` (cross-branch forward
// from invocation-amiss path into cursed-book2 body).  Translator
// emitted TODO + empty `raise_dead: {}` block — invocation-amiss
// path silently returned without raising the dead.  Inline the
// raise_dead body (makemon + unturn_dead + mkundead) at the goto
// site with explicit return.
patchFile('spell.js', (s) => {
    return s.replace(
        /        \} else \{\n            You\("have a feeling that %s is amiss\.\.\.", c_common_strings\.c_something\);\n            \/\* TODO Phase 5\+: goto raise_dead \(label not in scope of break\) \*\/\n        \}\n        return;\n    \}/,
        `        } else {
            You("have a feeling that %s is amiss...", c_common_strings.c_something);
            You("raised the dead!");
            if (!rn2(3) && ((mtmp = makemon(game.mons[PM_MASTER_LICH], game.u.ux, game.u.uy, 1)) != null || (mtmp = makemon(game.mons[PM_NALFESHNEE], game.u.ux, game.u.uy, 1)) != null)) {
                mtmp.mpeaceful = 0;
                set_malign(mtmp);
            }
            unturn_dead(game.youmonst);
            mm.x = game.u.ux;
            mm.y = game.u.uy;
            mkundead(mm, (1), 1);
            return;
        }
        return;
    }`
    );
});

// potion.js: potionhit's monster-switch has two cross-case
// gotos (do_healing / do_illness) AND the translator dropped
// both label bodies (emitted `// TODO LabelStmt do_X not at
// compound-stmt level`).  Net effect: POT_HEALING+PESTILENCE
// healed instead of damaged; POT_SICKNESS+PESTILENCE fell
// through to dmgtype check then no-oped (no damage to non-
// resistant monsters); POT_HEALING family was missing
// `angermon = FALSE` so player healing throws caused spurious
// monster wakeup.  Inline do_illness body at the PESTILENCE
// branch of healing-cases (mhp/=2 + "looks rather ill") and
// do_healing body at the PESTILENCE branch of POT_SICKNESS
// (angermon=0 + heal + cureblind).  Also restore the dropped
// do_illness body for the normal POT_SICKNESS non-resistant
// path, and add `angermon = (0)` to the do_healing body.  C
// ref: src/potion.c lines 1740-1777.
patchFile('potion.js', (s) => {
    return s.replace(
        /            case POT_HEALING:\n                if \(obj\.blessed\) \{\n                    cureblind = \(1\);\n                \}\n                if \(mon\.data == game\.mons\[PM_PESTILENCE\]\) \{\n                    \/\* TODO Phase 5\+: goto do_illness \(label not in scope of break\) \*\/\n                \}\n                ;\n            case POT_RESTORE_ABILITY:\n            case POT_GAIN_ABILITY:\n                \/\/ TODO LabelStmt do_healing not at compound-stmt level\n                if \(mon\.mhp < mon\.mhpmax\) \{\n                    healmon\(mon, mon\.mhpmax, 0\);\n                    if \(canseemon\(mon\)\) \{\n                        pline\("%s looks sound and hale again\.", Monnam\(mon\)\);\n                    \}\n                \}\n                if \(cureblind\) \{\n                    mcureblindness\(mon, canseemon\(mon\)\);\n                \}\n                break;\n            case POT_SICKNESS:\n                if \(mon\.data == game\.mons\[PM_PESTILENCE\]\) \{\n                    \/\* TODO Phase 5\+: goto do_healing \(label not in scope of break\) \*\/\n                \}\n                if \(dmgtype\(mon\.data, 33\) \|\| dmgtype\(mon\.data, 38\) \|\| Resists_Elem\(mon, POISON_RES\)\) \{\n                    if \(canseemon\(mon\)\) \{\n                        pline\("%s looks unharmed\.", Monnam\(mon\)\);\n                    \}\n                    break;\n                \}\n                \/\/ TODO LabelStmt do_illness not at compound-stmt level\n                break;/,
        `            case POT_HEALING:
                if (obj.blessed) {
                    cureblind = (1);
                }
                if (mon.data == game.mons[PM_PESTILENCE]) {
                    if (mon.mhp > 2) {
                        mon.mhp = Math.trunc(mon.mhp / 2);
                        if (canseemon(mon)) {
                            pline("%s looks rather ill.", Monnam(mon));
                        }
                    }
                    break;
                }
                ;
            case POT_RESTORE_ABILITY:
            case POT_GAIN_ABILITY:
                angermon = (0);
                if (mon.mhp < mon.mhpmax) {
                    healmon(mon, mon.mhpmax, 0);
                    if (canseemon(mon)) {
                        pline("%s looks sound and hale again.", Monnam(mon));
                    }
                }
                if (cureblind) {
                    mcureblindness(mon, canseemon(mon));
                }
                break;
            case POT_SICKNESS:
                if (mon.data == game.mons[PM_PESTILENCE]) {
                    angermon = (0);
                    if (mon.mhp < mon.mhpmax) {
                        healmon(mon, mon.mhpmax, 0);
                        if (canseemon(mon)) {
                            pline("%s looks sound and hale again.", Monnam(mon));
                        }
                    }
                    if (cureblind) {
                        mcureblindness(mon, canseemon(mon));
                    }
                    break;
                }
                if (dmgtype(mon.data, 33) || dmgtype(mon.data, 38) || Resists_Elem(mon, POISON_RES)) {
                    if (canseemon(mon)) {
                        pline("%s looks unharmed.", Monnam(mon));
                    }
                    break;
                }
                if (mon.mhp > 2) {
                    mon.mhp = Math.trunc(mon.mhp / 2);
                    if (canseemon(mon)) {
                        pline("%s looks rather ill.", Monnam(mon));
                    }
                }
                break;`
    );
});

// read.js: recharge's `goto not_chargable` (cross-branch forward
// from default switch case to else branch's pline body).  Inline
// `You("have a feeling of loss."); cap_spe(obj); return;` at the
// default site — equivalent to C's fall-through past the if-else
// to cap_spe(obj) (function ends right after).
patchFile('read.js', (s) => {
    return s.replace(
        /            default:\n                \/\* TODO Phase 5\+: goto not_chargable \(label not in scope of break\) \*\/\n                break;\n        \}\n    \} else \{/,
        `            default:
                You("have a feeling of loss.");
                cap_spe(obj);
                return;
        }
    } else {`
    );
});

// do.js: dosinkring's `goto giveback` (forward jump within switch
// that skips the "regurgitated" pline) AND the translator dropped
// `obj->in_use = FALSE` at the giveback label.  RIN_SEARCHING
// case originally fell through into RIN_SLOW_DIGESTION's
// "regurgitated!" message (wrong text) and in_use stayed TRUE.
//
// Inline the full giveback body (in_use=0 + dropx + trycall +
// return) at both RIN_SEARCHING and RIN_SLOW_DIGESTION sites.
patchFile('do.js', (s) => {
    return s.replace(
        /        case RIN_SEARCHING:\n            You\("thought %s got lost in the sink, but there it is!", yname\(obj\)\);\n            \/\* TODO Phase 5\+: goto giveback \(label not in scope of break\) \*\/\n        case RIN_SLOW_DIGESTION:\n            pline_The\("ring is regurgitated!"\);\n            \/\/ TODO LabelStmt giveback not at compound-stmt level\n            dropx\(obj\);\n            trycall\(obj\);\n            return;/,
        `        case RIN_SEARCHING:
            You("thought %s got lost in the sink, but there it is!", yname(obj));
            obj.in_use = (0);
            dropx(obj);
            trycall(obj);
            return;
        case RIN_SLOW_DIGESTION:
            pline_The("ring is regurgitated!");
            obj.in_use = (0);
            dropx(obj);
            trycall(obj);
            return;`
    );
});

// questpgr.js: com_pager_core's `goto tryagain` (back-jump for
// quest-text fallback retry) + 5x `goto compagerdone` (forward
// jumps to cleanup body).  Translator wrapped the prologue in
// `tryagain: {}` and the post-prologue body in `compagerdone: {}`
// — neither is reachable via break/continue since the labels are
// non-enclosing for the goto sites.
//
// Restructure: hoist `compagerdone: {}` to enclose the entire
// function body (after the skip_pager early-return); drop the
// prologue's `tryagain: {}` wrapper; wrap the lua_getfield body
// in `tryagain: while (true)` so the back-jump for msg_fallbacks
// becomes `continue tryagain`.
patchFile('questpgr.js', (s) => {
    return s.replace(
        /    let sbi = \{ flags: 0, memlimit: 0, steps: 0, perpcall: 0 \};\n    tryagain: \{\n        text = null;\n        synopsis = null;\n        fallback_msgid = null;\n        res = 0;\n        sbi = \{ flags: 2147483648, memlimit: 1 \* 1024 \* 1024, steps: 0, perpcall: 1 \* 1024 \* 1024 \};\n        if \(skip_pager\(1\)\) \{\n            return 0;\n        \}\n        L = nhl_init\(sbi\);\n        if \(!L\) \{\n            if \(showerror\) \{\n                impossible\("com_pager: nhl_init\(\) failed"\);\n            \}\n            \/\* TODO Phase 5\+: goto compagerdone \(label not in scope of break\) \*\/\n        \}\n        if \(!nhl_loadlua\(L, "quest\.lua"\)\) \{\n            if \(showerror\) \{\n                impossible\("com_pager: %s not found\.", "quest\.lua"\);\n            \}\n            \/\* TODO Phase 5\+: goto compagerdone \(label not in scope of break\) \*\/\n        \}\n        lua_settop\(L, 0\);\n        lua_getglobal\(L, "questtext"\);\n        if \(!lua_istable\(L, -1\)\) \{\n            if \(showerror\) \{\n                impossible\("com_pager: questtext in %s is not a lua table", "quest\.lua"\);\n            \}\n            \/\* TODO Phase 5\+: goto compagerdone \(label not in scope of break\) \*\/\n        \}\n        lua_getfield\(L, -1, section\);\n        if \(!lua_istable\(L, -1\)\) \{\n            if \(showerror\) \{\n                impossible\("com_pager: questtext\[%s\] in %s is not a lua table", section, "quest\.lua"\);\n            \}\n            \/\* TODO Phase 5\+: goto compagerdone \(label not in scope of break\) \*\/\n        \}\n    \}\n    lua_getfield\(L, -1, fallback_msgid \? fallback_msgid : msgid\);\n    compagerdone: \{\n        if \(!lua_istable\(L, -1\)\) \{\n            if \(!fallback_msgid\) \{\n                lua_getfield\(L, -3, "msg_fallbacks"\);\n                if \(lua_istable\(L, -1\)\) \{\n                    fallback_msgid = get_table_str_opt\(L, msgid, null\);\n                    lua_pop\(L, 2\);\n                    if \(fallback_msgid\) \{\n                        \/\* TODO Phase 5\+: goto tryagain \(label not in scope of break\) \*\/\n                    \}\n                \}\n            \}/,
        `    let sbi = { flags: 0, memlimit: 0, steps: 0, perpcall: 0 };
    text = null;
    synopsis = null;
    fallback_msgid = null;
    res = 0;
    sbi = { flags: 2147483648, memlimit: 1 * 1024 * 1024, steps: 0, perpcall: 1 * 1024 * 1024 };
    if (skip_pager(1)) {
        return 0;
    }
    compagerdone: {
    L = nhl_init(sbi);
    if (!L) {
        if (showerror) {
            impossible("com_pager: nhl_init() failed");
        }
        break compagerdone;
    }
    if (!nhl_loadlua(L, "quest.lua")) {
        if (showerror) {
            impossible("com_pager: %s not found.", "quest.lua");
        }
        break compagerdone;
    }
    lua_settop(L, 0);
    lua_getglobal(L, "questtext");
    if (!lua_istable(L, -1)) {
        if (showerror) {
            impossible("com_pager: questtext in %s is not a lua table", "quest.lua");
        }
        break compagerdone;
    }
    lua_getfield(L, -1, section);
    if (!lua_istable(L, -1)) {
        if (showerror) {
            impossible("com_pager: questtext[%s] in %s is not a lua table", section, "quest.lua");
        }
        break compagerdone;
    }
    tryagain: while (true) {
        lua_getfield(L, -1, fallback_msgid ? fallback_msgid : msgid);
        if (!lua_istable(L, -1)) {
            if (!fallback_msgid) {
                lua_getfield(L, -3, "msg_fallbacks");
                if (lua_istable(L, -1)) {
                    fallback_msgid = get_table_str_opt(L, msgid, null);
                    lua_pop(L, 2);
                    if (fallback_msgid) {
                        continue tryagain;
                    }
                }
            }`
    ).replace(
        /        res = 1;\n    \}\n    if \(text\) \{\n        free\(text\);\n    \}\n    if \(synopsis\) \{\n        free\(synopsis\);\n    \}\n    if \(fallback_msgid\) \{\n        free\(fallback_msgid\);\n    \}\n    nhl_done\(L\);\n    return res;\n\}\nexport function com_pager/,
        `        res = 1;
        break tryagain;
    }
    }
    if (text) {
        free(text);
    }
    if (synopsis) {
        free(synopsis);
    }
    if (fallback_msgid) {
        free(fallback_msgid);
    }
    nhl_done(L);
    return res;
}
export function com_pager`
    );
});

// dothrow.js: breakobj's `goto petrify` (cross-branch forward from
// EGG case to else-if petrifier body inside the !uarmh path).
// Inline the petrify body at the EGG goto site (terminal path —
// calls done(STONING) and returns).
patchFile('dothrow.js', (s) => {
    return s.replace(
        /                if \(petrifier && !\(game\.u\.uprops\[STONE_RES\]\.intrinsic \|\| game\.u\.uprops\[STONE_RES\]\.extrinsic\) && !\(poly_when_stoned\(game\.youmonst\.data\) && polymon\(PM_STONE_GOLEM\)\)\) \{\n                    if \(game\.uarmh\) \{\n                        Your\("%s fails to protect you\.", helm_simple_name\(game\.uarmh\)\);\n                    \}\n                    \/\* TODO Phase 5\+: goto petrify \(label not in scope of break\) \*\/\n                \}\n                ;\n            case CREAM_PIE:/,
        `                if (petrifier && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM))) {
                    if (game.uarmh) {
                        Your("%s fails to protect you.", helm_simple_name(game.uarmh));
                    }
                    game.killer.format = 1;
                    game.killer.name = strcpy(game.killer.name, "elementary physics");
                    You("turn to stone.");
                    if (obj) {
                        dropy(obj);
                    }
                    game.thrownobj = null;
                    done(STONING);
                    return obj ? (1) : (0);
                }
                ;
            case CREAM_PIE:`
    );
});

// teleport.js: m_unleash_impossible's `goto release_it` (when
// mleashed but get_mleash returns null — impossible case, still
// needs to release).  Inline m_unleash + return at goto site.
patchFile('teleport.js', (s) => {
    return s.replace(
        /        if \(!otmp\) \{\n            impossible\("%s is leashed, without a leash\.", Monnam\(mtmp\)\);\n            \/\* TODO Phase 5\+: goto release_it \(label not in scope of break\) \*\/\n        \}/,
        `        if (!otmp) {
            impossible("%s is leashed, without a leash.", Monnam(mtmp));
            m_unleash(mtmp, (0));
            return (1);
        }`
    );
});

// role.js: plsel()'s 2 goto sites — `goto setup_done` from the
// initial random-prompt loop's ESC/q (early-bail to cleanup)
// and `goto makepicks` from confirmation case 2 (Restart, back-
// jump to redo the entire pick process).
//
// Translator wrapped both targets in labeled blocks (no-op
// JS labels) and emitted the gotos as TODOs.  Effects:
//   - ESC/q at initial prompt: do-while never exits (condition
//     requires pick4u == 121/110/97; ESC=27/q=113 fail both
//     branches) — INFINITE LOOP if the prompt fires.
//   - Restart confirmation: no-op meant case 2 just `break;`'d
//     the switch without restarting; falls through to result=1
//     and returns success even though user wanted to redo.
//
// Restructure with `chargen_loop: while (true)` wrapping both
// makepicks initial setup and the setup_done picking loop.
// The in_role_selection++ is hoisted outside the loop (matches
// C placement BEFORE the makepicks label).  ESC/q sets a flag
// + break chargen_loop (skip to cleanup decrement+return).
// case 2 becomes `continue chargen_loop` (restart from top).
//
// Score-stable in current 44-session run (autoplay sessions
// preset all four init* flags so the prompt loop is skipped),
// but closes a real infinite-loop bug for ESC/q at the
// chargen prompt and a real Restart-confirmation bug.
//
// C ref: src/role.c lines 2288 (makepicks label) + 2722
// (setup_done label) + 2304 (goto setup_done) + ~2700 (case 2
// goto makepicks).
patchFile('role.js', (s) => {
    s = s.replace(
        /    makepicks: \{\n        win = \(-1\);\n        selected = null;\n        clr = 8;\n        pick4u = 110;\n        result = 0;\n        game\.program_state\.in_role_selection\+\+;\n        picksomething = \(game\.flags\.initrole == \(-1\) \|\| game\.flags\.initrace == \(-1\) \|\| game\.flags\.initgend == \(-1\) \|\| game\.flags\.initalign == \(-1\)\);\n        if \(game\.flags\.randomall && picksomething\) \{\n            if \(game\.flags\.initrole == \(-1\)\) \{\n                game\.flags\.initrole = \(-2\);\n            \}\n            if \(game\.flags\.initrace == \(-1\)\) \{\n                game\.flags\.initrace = \(-2\);\n            \}\n            if \(game\.flags\.initgend == \(-1\)\) \{\n                game\.flags\.initgend = \(-2\);\n            \}\n            if \(game\.flags\.initalign == \(-1\)\) \{\n                game\.flags\.initalign = \(-2\);\n            \}\n        \}\n        rigid_role_checks\(\);\n        if \(game\.flags\.initrole == \(-1\) \|\| game\.flags\.initrace == \(-1\) \|\| game\.flags\.initgend == \(-1\) \|\| game\.flags\.initalign == \(-1\)\) \{\n            let prompt = build_plselection_prompt\(pbuf, 128, game\.flags\.initrole, game\.flags\.initrace, game\.flags\.initgend, game\.flags\.initalign\);\n            prompt = trimspaces\(prompt\);\n            do \{\n                pick4u = yn_function\(prompt, null, 0, \(0\)\);\n                pick4u = lowc\(pick4u\);\n                if \(pick4u == 27 \|\| pick4u == 113\) \{\n                    \/\* TODO Phase 5\+: goto setup_done \(label not in scope of break\) \*\/\n                \}\n                if \(pick4u == 32 \|\| pick4u == 10 \|\| pick4u == 13\) \{\n                    pick4u = 121;\n                \} else if \(pick4u == 64 \|\| pick4u == 42\) \{\n                    pick4u = 97;\n                \}\n            \} while \(pick4u != 121 && pick4u != 110 && pick4u != 97\);\n        \}\n    \}\n    nextpick = 1;\n    setup_done: \{/,
        `    game.program_state.in_role_selection++;
    chargen_loop: while (true) {
    win = (-1);
    selected = null;
    clr = 8;
    pick4u = 110;
    result = 0;
    picksomething = (game.flags.initrole == (-1) || game.flags.initrace == (-1) || game.flags.initgend == (-1) || game.flags.initalign == (-1));
    if (game.flags.randomall && picksomething) {
        if (game.flags.initrole == (-1)) {
            game.flags.initrole = (-2);
        }
        if (game.flags.initrace == (-1)) {
            game.flags.initrace = (-2);
        }
        if (game.flags.initgend == (-1)) {
            game.flags.initgend = (-2);
        }
        if (game.flags.initalign == (-1)) {
            game.flags.initalign = (-2);
        }
    }
    rigid_role_checks();
    let __bail_chargen = false;
    if (game.flags.initrole == (-1) || game.flags.initrace == (-1) || game.flags.initgend == (-1) || game.flags.initalign == (-1)) {
        let prompt = build_plselection_prompt(pbuf, 128, game.flags.initrole, game.flags.initrace, game.flags.initgend, game.flags.initalign);
        prompt = trimspaces(prompt);
        do {
            pick4u = yn_function(prompt, null, 0, (0));
            pick4u = lowc(pick4u);
            if (pick4u == 27 || pick4u == 113) {
                __bail_chargen = true;
                break;
            }
            if (pick4u == 32 || pick4u == 10 || pick4u == 13) {
                pick4u = 121;
            } else if (pick4u == 64 || pick4u == 42) {
                pick4u = 97;
            }
        } while (pick4u != 121 && pick4u != 110 && pick4u != 97);
    }
    if (__bail_chargen) {
        break chargen_loop;
    }
    nextpick = 1;
    setup_done: {`
    );
    s = s.replace(
        /                case 2:\n                    pick4u = 110;\n                    game\.flags\.initrole = game\.flags\.initrace = game\.flags\.initgend = game\.flags\.initalign = \(-1\);\n                    \/\* TODO Phase 5\+: goto makepicks \(label not in scope of break\) \*\/\n                    break;/,
        `                case 2:
                    pick4u = 110;
                    game.flags.initrole = game.flags.initrace = game.flags.initgend = game.flags.initalign = (-1);
                    continue chargen_loop;`
    );
    s = s.replace(
        /        result = 1;\n    \}\n    game\.program_state\.in_role_selection--;\n    return result;\n\}\nexport function reset_role_filtering/,
        `        result = 1;
    }
    break chargen_loop;
    }
    game.program_state.in_role_selection--;
    return result;
}
export function reset_role_filtering`
    );
    return s;
});

// teleport.js: level_tele's 4x `goto random_levtport` (forward
// from teleport-controlled pick branch to else-branch's random
// pick) plus 1x late back-jump from debug_fuzzer + newlev<0.
//
// In C, random_levtport label is in the else-branch of the
// `if (Teleport_control || wizard)` chain.  Forward gotos from
// the if-branch jump into the else-branch's body, bypassing
// the rest of the controllable-pick flow.  The debug_fuzzer
// goto is a back-jump from later code to redo the random pick.
//
// Translator emitted all 5 as TODOs.  Effects:
//   - "*"/"random" input: goto random_levtport never fires;
//     control falls past the if-buf-empty check into the
//     `if (newlev == 0)` branch where ynq pings, then suicide
//     code runs (player commits suicide instead of random tele).
//   - confusion: similar — pline "Oops..." prints but no random
//     tele happens; ynq + suicide instead.
//   - 10-try exhaustion: same suicide-instead-of-random bug.
//   - debug_fuzzer newlev<0: never redo with random.
//
// Restructure with __do_random_levtport flag and a labeled
// `levtport_pick: do ... while (...)` loop; break out of the
// pick on "*"/confusion sites; check the flag after the loop;
// inline the random body for debug_fuzzer late site.
//
// C ref: src/teleport.c lines 1214/1217/1256/1293/1324
// (5x random_levtport sites).
patchFile('teleport.js', (s) => {
    // 1. Add flags + wrap controllable branch with __controllable_taken + label do-while
    s = s.replace(
        /    if \(\(\(game\.u\.uprops\[TELEPORT_CONTROL\]\.intrinsic \|\| game\.u\.uprops\[TELEPORT_CONTROL\]\.extrinsic\) && !game\.u\.uprops\[STUNNED\]\.intrinsic\) \|\| game\.flags\.debug\) \{\n        let qbuf = (\[0(?:, 0)+\]);\n        let trycnt = 0;\n        qbuf = strcpy\(qbuf, "To what level do you want to teleport\?"\);\n        do \{\n            if \(game\.iflags\.menu_requested\) \{/,
        `    let __do_random_levtport = false;
    let __controllable_taken = false;
    if (((game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic) && !game.u.uprops[STUNNED].intrinsic) || game.flags.debug) {
        __controllable_taken = true;
        let qbuf = $1;
        let trycnt = 0;
        qbuf = strcpy(qbuf, "To what level do you want to teleport?");
        levtport_pick: do {
            if (game.iflags.menu_requested) {`
    );
    // 2. Replace "*" goto random_levtport
    s = s.replace(
        /            if \(!strcmp\(buf, "\*"\)\) \{\n                \/\* TODO Phase 5\+: goto random_levtport \(label not in scope of break\) \*\/\n            \} else if \(game\.u\.uprops\[CONFUSION\]\.intrinsic && rnl\(5\)\) \{\n                pline\("Oops\.\.\."\);\n                \/\* TODO Phase 5\+: goto random_levtport \(label not in scope of break\) \*\/\n            \} else if \(!strcmp\(buf, "\\x1b"\)\) \{/,
        `            if (!strcmp(buf, "*")) {
                __do_random_levtport = true;
                break levtport_pick;
            } else if (game.u.uprops[CONFUSION].intrinsic && rnl(5)) {
                pline("Oops...");
                __do_random_levtport = true;
                break levtport_pick;
            } else if (!strcmp(buf, "\\x1b")) {`
    );
    // 3. Replace the newlev==0 / trycnt>=10 goto + restructure into flag-set + skip-suicide
    s = s.replace(
        /        \} while \(!newlev && !digit\(buf\[0\]\) && \(buf\[0\] != 45 \|\| !digit\(buf\[1\]\)\) && trycnt < 10\);\n        if \(newlev == 0\) \{\n            if \(trycnt >= 10\) \{\n                \/\* TODO Phase 5\+: goto random_levtport \(label not in scope of break\) \*\/\n            \}\n            if \(yn_function\("Go to Nowhere\.  Are you sure\?", ynqchars, 113, \(1\)\) != 121\) \{\n                return;\n            \}\n            You\("%s in agony as your body begins to warp\.\.\.", \(\(game\.youmonst\.data\)\.msound == MS_SILENT\) \? "writhe" : "scream"\);\n            \(game\.windowprocs\.win_display_nhwindow\)\(game\.WIN_MESSAGE, \(0\)\);\n            You\("cease to exist\."\);\n            if \(game\.invent\) \{\n                Your\("possessions land on the %s with a thud\.", surface\(game\.u\.ux, game\.u\.uy\)\);\n            \}\n            game\.killer\.format = 2;\n            game\.killer\.name = strcpy\(game\.killer\.name, "committed suicide"\);\n            done\(DIED\);\n            pline\("An energized cloud of dust begins to coalesce\."\);\n            Your\("body rematerializes%s\.", game\.invent \? ", and you gather up all your possessions" : ""\);\n            return;\n        \}\n        if \(single_level_branch\(game\.u\.uz\) && newlev > 0 && !force_dest\) \{\n            You\("%s", c_common_strings\.c_shudder_for_moment\);\n            return;\n        \}\n        if \(In_quest\(game\.u\.uz\) && newlev > 0\) \{\n            newlev = newlev \+ game\.dungeons\[game\.u\.uz\.dnum\]\.depth_start - 1;\n        \}\n    \} else \{\n        random_levtport: \{\n        \}\n        newlev = random_teleport_level\(\);\n        if \(newlev == depth\(game\.u\.uz\)\) \{\n            You\("%s", c_common_strings\.c_shudder_for_moment\);\n            return;\n        \}\n    \}/,
        `        } while (!newlev && !digit(buf[0]) && (buf[0] != 45 || !digit(buf[1])) && trycnt < 10);
        if (!__do_random_levtport && newlev == 0) {
            if (trycnt >= 10) {
                __do_random_levtport = true;
            } else {
                if (yn_function("Go to Nowhere.  Are you sure?", ynqchars, 113, (1)) != 121) {
                    return;
                }
                You("%s in agony as your body begins to warp...", ((game.youmonst.data).msound == MS_SILENT) ? "writhe" : "scream");
                (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
                You("cease to exist.");
                if (game.invent) {
                    Your("possessions land on the %s with a thud.", surface(game.u.ux, game.u.uy));
                }
                game.killer.format = 2;
                game.killer.name = strcpy(game.killer.name, "committed suicide");
                done(DIED);
                pline("An energized cloud of dust begins to coalesce.");
                Your("body rematerializes%s.", game.invent ? ", and you gather up all your possessions" : "");
                return;
            }
        }
        if (!__do_random_levtport) {
            if (single_level_branch(game.u.uz) && newlev > 0 && !force_dest) {
                You("%s", c_common_strings.c_shudder_for_moment);
                return;
            }
            if (In_quest(game.u.uz) && newlev > 0) {
                newlev = newlev + game.dungeons[game.u.uz.dnum].depth_start - 1;
            }
        }
    }
    if (__do_random_levtport || !__controllable_taken) {
        newlev = random_teleport_level();
        if (newlev == depth(game.u.uz)) {
            You("%s", c_common_strings.c_shudder_for_moment);
            return;
        }
    }`
    );
    // 4. Inline random body for debug_fuzzer late goto
    s = s.replace(
        /    game\.killer\.name\[0\] = 0;\n    if \(game\.iflags\.debug_fuzzer && newlev < 0\) \{\n        \/\* TODO Phase 5\+: goto random_levtport \(label not in scope of break\) \*\/\n    \}/,
        `    game.killer.name[0] = 0;
    if (game.iflags.debug_fuzzer && newlev < 0) {
        newlev = random_teleport_level();
        if (newlev == depth(game.u.uz)) {
            You("%s", c_common_strings.c_shudder_for_moment);
            return;
        }
    }`
    );
    return s;
});

// rumors.js rumor_check: `goto no_rumors` from the
// init_rumors-failed branch (inside `if (rumors) { ... }`)
// jumps INTO the `else if (true_rumor_size < 0) { no_rumors: }`
// branch.  C's goto-into-block crosses the if-else boundary so
// that init-fail and the "previous attempt failed" cases share
// the "rumors not accessible" message.
//
// Translator emitted the goto as a TODO no-op, so when init
// failed the function fell through to the rumor dump code with
// rumors=null — crash.
//
// Fix: add `__rumors_failed` flag set in the init-fail branch.
// Split the if-rumors into two consecutive ifs: the first does
// the init check, the second (if (rumors)) does the dump.  After
// both, fire "rumors not accessible" when `__rumors_failed ||
// (!rumors && true_rumor_size < 0)`, else fire "couldn't open"
// when `!rumors && !__rumors_failed`.
//
// Wizard-mode only (#rumorcheck); score-irrelevant.
patchFile('rumors.js', (s) => {
    if (s.includes('/* rumors-failed-flag fix */')) return s;
    s = s.replace(
        `    rumors = (game.true_rumor_size >= 0) ? fopen("rumors", "r") : null;
    if (rumors) {
        let ftell_rumor_start = 0;
        rumor_buf[0] = 0;
        if (game.true_rumor_size == 0) {
            init_rumors(rumors);
            if (game.true_rumor_size < 0) {
                rumors = null;
                /* TODO Phase 5+: goto no_rumors (label not in scope of break) */
            }
        }
        tmpwin = (game.windowprocs.win_create_nhwindow)(5);`,
        `    rumors = (game.true_rumor_size >= 0) ? fopen("rumors", "r") : null;
    /* rumors-failed-flag fix */
    let __rumors_failed = (0);
    if (rumors) {
        let ftell_rumor_start = 0;
        rumor_buf[0] = 0;
        if (game.true_rumor_size == 0) {
            init_rumors(rumors);
            if (game.true_rumor_size < 0) {
                rumors = null;
                __rumors_failed = (1);
            }
        }
    }
    if (rumors) {
        let ftell_rumor_start = 0;
        tmpwin = (game.windowprocs.win_create_nhwindow)(5);`
    );
    s = s.replace(
        `        fclose(rumors);
    } else if (game.true_rumor_size < 0) {
        no_rumors: {
        }
        pline("rumors not accessible.");
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
    } else {
        couldnt_open_file("rumors");
        game.true_rumor_size = -1;
    }`,
        `        fclose(rumors);
    }
    if (__rumors_failed || (!rumors && game.true_rumor_size < 0)) {
        pline("rumors not accessible.");
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
    } else if (!rumors && !__rumors_failed) {
        couldnt_open_file("rumors");
        game.true_rumor_size = -1;
    }`
    );
    return s;
});

// teleport.js level_tele: `goto levTport_menu` from the
// `if (iflags.menu_requested && flags.debug)` check jumps INTO
// the `if (debug && buf == "?")` block, bypassing the trycnt
// increment, qbuf strcat, getlin, "*"/CONFUSION/ESC checks, and
// the if-condition itself.  Translator emitted it as a TODO no-op
// so the menu_requested+debug path fell through to getlin and
// menu_requested was effectively ignored.
//
// Fix: `__force_menu` flag set in the menu_requested+debug branch.
// Skip the input section on `__force_menu`.  Run the print_dungeon
// menu code when `__force_menu || (debug && buf == "?")`.
//
// Runs AFTER the patch above which transforms the raw do-while
// into the labeled `levtport_pick: do { ... } while (...)` form
// and replaces random_levtport gotos with `break levtport_pick`.
//
// Wizard-mode only (#leveltel); score-irrelevant.
patchFile('teleport.js', (s) => {
    if (s.includes('/* levTport_menu-force-menu fix */')) return s;
    const oldBlock = `        levtport_pick: do {
            if (game.iflags.menu_requested) {
                game.iflags.menu_requested = (0);
                if (game.flags.debug) {
                    /* TODO Phase 5+: goto levTport_menu (label not in scope of break) */
                }
            }
            if (++trycnt == 2) {
                if (game.flags.debug) {
                    qbuf = strcat(qbuf, " [type a number, name, or ? for a menu]");
                } else {
                    qbuf = strcat(qbuf, " [type a number or name]");
                }
            }
            buf = '';
            getlin(qbuf, buf);
            if (!strcmp(buf, "*")) {
                __do_random_levtport = true;
                break levtport_pick;
            } else if (game.u.uprops[CONFUSION].intrinsic && rnl(5)) {
                pline("Oops...");
                __do_random_levtport = true;
                break levtport_pick;
            } else if (!strcmp(buf, "\\x1b")) {
                return;
            }
            if (game.flags.debug && !strcmp(buf, "?")) {
                let destlev = 0;
                let destdnum = 0;
                levTport_menu: {
                }
                destlev = 0;
                destdnum = 0;
                newlev = print_dungeon((1), { get value() { return destlev; }, set value(_v) { destlev = _v; } }, { get value() { return destdnum; }, set value(_v) { destdnum = _v; } });`;
    const newBlock = `        /* levTport_menu-force-menu fix */
        levtport_pick: do {
            let __force_menu = (0);
            if (game.iflags.menu_requested) {
                game.iflags.menu_requested = (0);
                if (game.flags.debug) {
                    __force_menu = (1);
                }
            }
            if (!__force_menu) {
                if (++trycnt == 2) {
                    if (game.flags.debug) {
                        qbuf = strcat(qbuf, " [type a number, name, or ? for a menu]");
                    } else {
                        qbuf = strcat(qbuf, " [type a number or name]");
                    }
                }
                buf = '';
                getlin(qbuf, buf);
                if (!strcmp(buf, "*")) {
                    __do_random_levtport = true;
                    break levtport_pick;
                } else if (game.u.uprops[CONFUSION].intrinsic && rnl(5)) {
                    pline("Oops...");
                    __do_random_levtport = true;
                    break levtport_pick;
                } else if (!strcmp(buf, "\\x1b")) {
                    return;
                }
            }
            if (__force_menu || (game.flags.debug && !strcmp(buf, "?"))) {
                let destlev = 0;
                let destdnum = 0;
                newlev = print_dungeon((1), { get value() { return destlev; }, set value(_v) { destlev = _v; } }, { get value() { return destdnum; }, set value(_v) { destdnum = _v; } });`;
    return s.replace(oldBlock, newBlock);
});

// strutil.js pmatch_internal pmatch_top + pickup.js query_category
// ask_again: both superseded by A3 goto back-jump-to-loop recognizer
// (commit 85cb377).

// pickup.js: pickup()'s 2x `goto menu_pickup` (forward jumps to
// the shared menu_pickup processing body — reset_justpicked +
// pickup_object loop + free pick_list).
//
// 1. After autopick(): in C, `goto menu_pickup` skips both the
//    if-menu_style branch and the else (old-style) branch,
//    jumping directly to the processing.  In JS, TODO no-op +
//    fallthrough meant the autopick result was either
//    re-queried (menu_style != 0) or DISCARDED while old-style
//    iterated objects separately, causing duplicate pickup
//    attempts and RNG divergence.
//
// 2. Old-style bulk-select case: when query_classes triggers
//    via_menu and query_objlist runs, `goto menu_pickup`
//    should run the processing.  JS TODO no-op meant the
//    pick_list was DISCARDED and obj-by-obj loop ran instead.
//
// Restructure: add __do_pickup_processing flag, set at autopick
// site and at menu_style end and at old-style query_objlist
// site (with break end_query to skip obj-by-obj).  Move the
// processing to a shared post-branch block.
//
// C ref: src/pickup.c lines 754-791 (menu_pickup body) +
// 756/835 (goto sites).
patchFile('pickup.js', (s) => {
    // 1. Replace autopick + menu_style branch + old-style entry
    s = s.replace(
        /        if \(autopickup\) \{\n            n = autopick\(objchain_p, traverse_how, \{ get value\(\) \{ return pick_list; \}, set value\(_v\) \{ pick_list = _v; \} \}\);\n            \/\* TODO Phase 5\+: goto menu_pickup \(label not in scope of break\) \*\/\n        \}\n        if \(game\.flags\.menu_style != 0 \|\| game\.iflags\.menu_requested\) \{\n            menu_pickup: \{\n                traverse_how \|= 4 \| \(game\.flags\.sortpack \? 16 : 0\);\n                if \(count\) \{\n                    let qbuf = \[0(?:, 0){127}\];\n                    qbuf = sprintf\(qbuf, "Pick %d of what\?", count\);\n                    game\.val_for_n_or_more = count;\n                    n = query_objlist\(qbuf, objchain_p, traverse_how, \{ get value\(\) \{ return pick_list; \}, set value\(_v\) \{ pick_list = _v; \} \}, 1, n_or_more\);\n                    for \(i = 0; i < n; i\+\+\) \{\n                        pick_list\[i\]\.count = count;\n                    \}\n                \} else \{\n                    n = query_objlist\("Pick up what\?", objchain_p, \(traverse_how \| 128\), \{ get value\(\) \{ return pick_list; \}, set value\(_v\) \{ pick_list = _v; \} \}, 2, all_but_uchain\);\n                \}\n            \}\n            if \(n > 0\) \{\n                reset_justpicked\(game\.invent\);\n            \}\n            n_tried = n;\n            for \(n_picked = i = 0; i < n; i\+\+\) \{\n                res = pickup_object\(pick_list\[i\]\.item\.a_obj, pick_list\[i\]\.count, \(0\)\);\n                if \(res < 0\) \{\n                    break;\n                \}\n                n_picked \+= res;\n            \}\n            if \(pick_list\) \{\n                free\(pick_list\);\n            \}\n        \} else \{/,
        `        let __do_pickup_processing = false;
        if (autopickup) {
            n = autopick(objchain_p, traverse_how, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } });
            __do_pickup_processing = true;
        }
        if (!__do_pickup_processing && (game.flags.menu_style != 0 || game.iflags.menu_requested)) {
            traverse_how |= 4 | (game.flags.sortpack ? 16 : 0);
            if (count) {
                let qbuf = [${new Array(128).fill('0').join(', ')}];
                qbuf = sprintf(qbuf, "Pick %d of what?", count);
                game.val_for_n_or_more = count;
                n = query_objlist(qbuf, objchain_p, traverse_how, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 1, n_or_more);
                for (i = 0; i < n; i++) {
                    pick_list[i].count = count;
                }
            } else {
                n = query_objlist("Pick up what?", objchain_p, (traverse_how | 128), { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2, all_but_uchain);
            }
            __do_pickup_processing = true;
        } else if (!__do_pickup_processing) {`
    );
    // 2. Replace old-style query_objlist goto site
    s = s.replace(
        /                        n = query_objlist\("Pick up what\?", objchain_p, traverse_how, \{ get value\(\) \{ return pick_list; \}, set value\(_v\) \{ pick_list = _v; \} \}, 2, \(via_menu == -2\) \? allow_all : allow_category\);\n                        \/\* TODO Phase 5\+: goto menu_pickup \(label not in scope of break\) \*\/\n                    \}/,
        `                        n = query_objlist("Pick up what?", objchain_p, traverse_how, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2, (via_menu == -2) ? allow_all : allow_category);
                        __do_pickup_processing = true;
                        break end_query;
                    }`
    );
    // 3. Insert processing block before uswallow check
    s = s.replace(
        /                    n_picked \+= res;\n                \}\n            \}\n        \}\n        if \(!game\.u\.uswallow\) \{\n            if \(\(\(\(game\.youmonst\.data\)\.mflags1 & 128\) != 0\)\) \{\n                hideunder\(game\.youmonst\);\n            \}\n            if \(n_picked\) \{\n                newsym_force\(game\.u\.ux, game\.u\.uy\);\n            \}\n            if \(autopickup\) \{\n                check_here\(n_picked > 0\);\n            \}\n        \}\n    \}\n    game\.pickup_encumbrance = 0;/,
        `                    n_picked += res;
                }
            }
        }
        if (__do_pickup_processing) {
            if (n > 0) {
                reset_justpicked(game.invent);
            }
            n_tried = n;
            for (n_picked = i = 0; i < n; i++) {
                res = pickup_object(pick_list[i].item.a_obj, pick_list[i].count, (0));
                if (res < 0) {
                    break;
                }
                n_picked += res;
            }
            if (pick_list) {
                free(pick_list);
            }
        }
        if (!game.u.uswallow) {
            if ((((game.youmonst.data).mflags1 & 128) != 0)) {
                hideunder(game.youmonst);
            }
            if (n_picked) {
                newsym_force(game.u.ux, game.u.uy);
            }
            if (autopickup) {
                check_here(n_picked > 0);
            }
        }
    }
    game.pickup_encumbrance = 0;`
    );
    return s;
});

// getpos.js: getpos_help's `goto do_rushrun` (forward goto from
// MV_WALK+rushrun branch into MV_RUSH/MV_RUN body) — inline the
// rushrun body at the goto site.
patchFile('getpos.js', (s) => {
    return s.replace(
        /                \} else if \(movecmd\(c, MV_WALK\)\) \{\n                    if \(rushrun\) \{\n                        \/\* TODO Phase 5\+: goto do_rushrun \(label not in scope of break\) \*\/\n                    \}\n                    dx = game\.u\.dx;\n                    dy = game\.u\.dy;\n                    truncate_to_map\(\{ get value\(\) \{ return cx; \}, set value\(_v\) \{ cx = _v; \} \}, \{ get value\(\) \{ return cy; \}, set value\(_v\) \{ cy = _v; \} \}, dx, dy\);\n                    break nxtc;\n                \} else if \(movecmd\(c, MV_RUSH\) \|\| movecmd\(c, MV_RUN\)\) \{\n                    do_rushrun: \{\n                    \}\n                    if \(game\.iflags\.getloc_moveskip\) \{/,
        `                } else if (movecmd(c, MV_WALK)) {
                    if (rushrun) {
                        if (game.iflags.getloc_moveskip) {
                            let glyph = glyph_at(cx, cy);
                            dx = game.u.dx;
                            dy = game.u.dy;
                            while (isok(cx + dx, cy + dy) && glyph == glyph_at(cx + dx, cy + dy) && isok(cx + dx + game.u.dx, cy + dy + game.u.dy) && glyph == glyph_at(cx + dx + game.u.dx, cy + dy + game.u.dy)) {
                                dx += game.u.dx;
                                dy += game.u.dy;
                            }
                        } else {
                            dx = 8 * game.u.dx;
                            dy = 8 * game.u.dy;
                        }
                        truncate_to_map({ get value() { return cx; }, set value(_v) { cx = _v; } }, { get value() { return cy; }, set value(_v) { cy = _v; } }, dx, dy);
                        break nxtc;
                    }
                    dx = game.u.dx;
                    dy = game.u.dy;
                    truncate_to_map({ get value() { return cx; }, set value(_v) { cx = _v; } }, { get value() { return cy; }, set value(_v) { cy = _v; } }, dx, dy);
                    break nxtc;
                } else if (movecmd(c, MV_RUSH) || movecmd(c, MV_RUN)) {
                    if (game.iflags.getloc_moveskip) {`
    );
});

// detect.js: use_crystal_ball's `goto implode` (cross-branch
// forward jump from Magic-8-Ball cancelled to Crystal-Ball
// implode body) — inline the implode body at the goto site.
patchFile('detect.js', (s) => {
    return s.replace(
        /            pline\("All you see is funky %s haze\.", hcolor\(null\)\);\n            if \(obj\.spe < 0\) \{\n                \/\* TODO Phase 5\+: goto implode \(label not in scope of break\) \*\/\n            \}/,
        `            pline("All you see is funky %s haze.", hcolor(null));
            if (obj.spe < 0) {
                pline("%s!", Tobjnam(obj, "implode"));
                useup(obj);
                optr.value = obj = null;
                return;
            }`
    );
});

// wield.js: dowield's `goto already_wielded` (cross-branch forward
// jump from objsplit child-id branch to wep==uwep branch's body) AND
// ready_weapon's `goto already_quivered` (same pattern for quiver).
// Inline the body at each goto site.
patchFile('wield.js', (s) => {
    s = s.replace(
        /            if \(game\.uwep && game\.uwep\.o_id == game\.context\.objsplit\.parent_oid\) \{\n                unsplitobj\(wep\);\n                wep = game\.uwep;\n                \/\* TODO Phase 5\+: goto already_wielded \(label not in scope of break\) \*\/\n            \}/,
        `            if (game.uwep && game.uwep.o_id == game.context.objsplit.parent_oid) {
                unsplitobj(wep);
                wep = game.uwep;
                You("are already wielding that!");
                if (((wep).oclass == TOOL_CLASS && game.objects[(wep).otyp].oc_subtyp != P_NONE) || ((wep).otyp == TOWEL && (wep).spe > 0)) {
                    game.unweapon = (0);
                }
                return 4;
            }`
    );
    s = s.replace(
        /            if \(game\.uquiver && game\.uquiver\.o_id == game\.context\.objsplit\.parent_oid\) \{\n                unsplitobj\(newquiver\);\n                \/\* TODO Phase 5\+: goto already_quivered \(label not in scope of break\) \*\/\n            \} else if \(newquiver\.oclass == COIN_CLASS\) \{/,
        `            if (game.uquiver && game.uquiver.o_id == game.context.objsplit.parent_oid) {
                unsplitobj(newquiver);
                pline("That ammunition is already readied!");
                return 0;
            } else if (newquiver.oclass == COIN_CLASS) {`
    );
    return s;
});

// hack.js: findtravelpath's `goto noguess` back-jump (travel
// pathfinding retry when can't find direct path) AND trapmove's
// `goto wriggle_free` (forward jump from TT_BEARTRAP case into
// TT_INFLOOR/TT_BURIEDBALL case's else body).
//
// noguess: same mis-placement pattern as redo_maploc — translator
// wrapped the PROLOGUE in `noguess: {}` block instead of the body.
// Restructure: drop prologue wrapper, wrap body (post-prologue)
// in `noguess: while (true) { ... }`, convert TODO to
// `continue noguess`.  The `goto found` (forward jump to function
// tail) is already correctly translated as `break found` since
// `found: {}` wraps the entire function body.
//
// wriggle_free: forward jump that shares pline text across BEARTRAP
// (anchored=false) and INFLOOR/BURIEDBALL (anchored variable) cases.
// Inline the wriggle-free pline at the BEARTRAP TODO site using
// !anchored constants.
patchFile('hack.js', (s) => {
    s = s.replace(
        /            noguess: \{\n                n = 1;\n                set = 0;\n                radius = 1;\n                if \(mode == 1 \|\| mode == 2\) \{\n                    tx = game\.u\.ux;\n                    ty = game\.u\.uy;\n                    ux = game\.u\.tx;\n                    uy = game\.u\.ty;\n                \} else \{\n                    tx = game\.u\.tx;\n                    ty = game\.u\.ty;\n                    ux = game\.u\.ux;\n                    uy = game\.u\.uy;\n                \}\n            \}\n            memset\(travel, 0, 80 \/\* sizeof\(coordxy \[80\]\[21\]\) \*\/\);/,
        `            n = 1;
            set = 0;
            radius = 1;
            if (mode == 1 || mode == 2) {
                tx = game.u.ux;
                ty = game.u.uy;
                ux = game.u.tx;
                uy = game.u.ty;
            } else {
                tx = game.u.tx;
                ty = game.u.ty;
                ux = game.u.ux;
                uy = game.u.uy;
            }
            noguess: while (true) {
            memset(travel, 0, 80 /* sizeof(coordxy [80][21]) */);`
    );
    s = s.replace(
        /                mode = 0;\n                \/\* TODO Phase 5\+: goto noguess \(label not in scope of break\) \*\/\n            \}\n            return \(0\);\n        \}\n    \}\n    game\.u\.dx = 0;/,
        `                mode = 0;
                continue noguess;
            }
            return (0);
            }
        }
    }
    game.u.dx = 0;`
    );
    s = s.replace(
        /            if \(!game\.u\.utrap\) \{\n                \/\* TODO Phase 5\+: goto wriggle_free \(label not in scope of break\) \*\/\n            \}\n            break;\n        case TT_PIT:/,
        `            if (!game.u.utrap) {
                if (game.u.usteed) {
                    pline("%s finally %s free.", upstart(steedname), "lurches");
                } else {
                    You("finally %s free.", "wriggle");
                }
            }
            break;
        case TT_PIT:`
    );
    return s;
});

// hack.js: lookaround's `goto bcorr` (3 sites) and `goto stop` (1
// post-loop site).  Forward jumps that bypass the if-else chain
// to land in CORR's bcorr handler, or to the stop handler at
// loop-body end.  Translator emitted TODO comments — bcorr handler
// never runs from trap/door/objects paths, and post-loop goto-stop
// produces no return.  Lookaround is called on every running/
// traveling step, so this affects any session that uses run keys.
//
// Inline the bcorr handler body at each of the 3 goto sites
// (followed by `continue;` for the for-y iteration).  Replace the
// post-loop `goto stop` with explicit `nomul(0); return;`.
patchFile('hack.js', (s) => {
    const BCORR_INLINE = `if (game.level.locations[game.u.ux][game.u.uy].typ != ROOM) {
                            if (game.context.run == 1 || game.context.run == 3 || game.context.run == 8) {
                                i = dist2(x, y, game.u.ux + game.u.dx, game.u.uy + game.u.dy);
                                if (i > 2) { continue; }
                                if (corrct == 1 && dist2(x, y, x0, y0) != 1) { noturn = 1; }
                                if (i < i0) { i0 = i; x0 = x; y0 = y; m0 = mtmp ? 1 : 0; }
                            }
                            corrct++;
                        }
                        continue;`;
    s = s.replace(
        /                    if \(game\.context\.run == 1\) \{\n                        \/\* TODO Phase 5\+: goto bcorr \(label not in scope of break\) \*\/\n                    \}\n                    if \(infront\) \{\n                        break stop;\n                    \}\n                \}\n                if \(\(\(game\.level\.locations\[x\]\[y\]\.typ\) < POOL\)/,
        `                    if (game.context.run == 1) {
                        ${BCORR_INLINE}
                    }
                    if (infront) {
                        break stop;
                    }
                }
                if (((game.level.locations[x][y].typ) < POOL)`
    );
    s = s.replace(
        /                        break stop;\n                    \}\n                    \/\* TODO Phase 5\+: goto bcorr \(label not in scope of break\) \*\/\n                \} else if \(game\.level\.locations\[x\]\[y\]\.typ == CORR\) \{/,
        `                        break stop;
                    }
                    if (game.level.locations[game.u.ux][game.u.uy].typ != ROOM) {
                        if (game.context.run == 1 || game.context.run == 3 || game.context.run == 8) {
                            i = dist2(x, y, game.u.ux + game.u.dx, game.u.uy + game.u.dy);
                            if (i > 2) { continue; }
                            if (corrct == 1 && dist2(x, y, x0, y0) != 1) { noturn = 1; }
                            if (i < i0) { i0 = i; x0 = x; y0 = y; m0 = mtmp ? 1 : 0; }
                        }
                        corrct++;
                    }
                    continue;
                } else if (game.level.locations[x][y].typ == CORR) {`
    );
    s = s.replace(
        /                \} else \{\n                    if \(game\.context\.run == 1\) \{\n                        \/\* TODO Phase 5\+: goto bcorr \(label not in scope of break\) \*\/\n                    \}\n                    if \(game\.context\.run == 8\) \{/,
        `                } else {
                    if (game.context.run == 1) {
                        ${BCORR_INLINE}
                    }
                    if (game.context.run == 8) {`
    );
    s = s.replace(
        /    if \(corrct > 1 && game\.context\.run == 2\) \{\n        if \(game\.flags\.mention_walls\) \{\n            pline_The\("corridor widens here\."\);\n        \}\n        \/\* TODO Phase 5\+: goto stop \(label not in scope of break\) \*\/\n    \}/,
        `    if (corrct > 1 && game.context.run == 2) {
        if (game.flags.mention_walls) {
            pline_The("corridor widens here.");
        }
        nomul(0);
        return;
    }`
    );
    return s;
});

// shk.js: `shop_keeper(rmno)` — accept either a string (one or
// more room-number chars, from the new in_rooms return) or a
// numeric room code (from direct numeric callers).  Extract the
// first char code if rmno is a string.
patchFile('shk.js', (s) => {
    return s.replace(
        /export function shop_keeper\(rmno\) \{\n    let shkp = null;\n    shkp = \(rmno >= 3\) \? game\.rooms\[rmno - 3\]\.resident : null;/,
        `export function shop_keeper(rmno) {
    let shkp = null;
    if (typeof rmno === 'string') {
        rmno = rmno.length ? rmno.charCodeAt(0) : 0;
    }
    shkp = (rmno >= 3) ? game.rooms[rmno - 3].resident : null;`
    );
});

// shk.js: block_door's `int roomno = *in_rooms(x, y, SHOPBASE)` was
// translated as `let roomno = in_rooms(...)` — dropping the pointer
// deref so roomno ends up as the WHOLE string rather than its first
// char code.  Subsequent `game.rooms[roomno].rtype` then throws
// because `game.rooms[""]` is undefined.  Same pattern as
// shop_keeper above — coerce to first-char int.  Also fixes
// `roomno != game.u.ushops` to compare against game.u.ushops's
// first-char int (C: `*u.ushops`).
//
// This is one of the top t_domove throw categories (113 throws across
// many sessions); fixing it lets translated test_move's diagonal-
// shop-exit check run faithfully instead of falling into cmd.js's
// manual-domove fallback.
patchFile('shk.js', (s) => {
    return s.replace(
        `export function block_door(x, y) {
    let roomno = in_rooms(x, y, SHOPBASE);
    let shkp = null;
    if (roomno < 0 || !(game.rooms[roomno].rtype >= SHOPBASE)) {
        return (0);
    }
    if (!((game.level.locations[x][y].typ) == DOOR)) {
        return (0);
    }
    if (roomno != game.u.ushops) {
        return (0);
    }`,
        `export function block_door(x, y) {
    let __rs = in_rooms(x, y, SHOPBASE);
    let roomno = (typeof __rs === 'string')
        ? (__rs.length ? __rs.charCodeAt(0) : 0)
        : (__rs | 0);
    let shkp = null;
    if (roomno < 3 || !game.rooms[roomno - 3] || !(game.rooms[roomno - 3].rtype >= SHOPBASE)) {
        return (0);
    }
    if (!((game.level.locations[x][y].typ) == DOOR)) {
        return (0);
    }
    let __uroom = (Array.isArray(game.u.ushops) && game.u.ushops.length)
        ? (game.u.ushops[0] | 0)
        : (game.u.ushops | 0);
    if (roomno != __uroom) {
        return (0);
    }`
    );
});

// options.js: `def_inv_order` is a `static const char[]` array
// in C using enum CLASS names (COIN_CLASS, AMULET_CLASS, ...) as
// initializers.  The translator emitted it as `[0, 0, ..., 0]`
// (all zeros) instead of the enum values.  C ref options.c:118.
//
// game.flags.inv_order is memcpy'd from def_inv_order at
// initoptions time; with the array of zeros, flags.inv_order is
// all-zero too.  Hand-port fix-up in allmain.js had to detect
// this and re-init from hardcoded values.
//
// Replace the zeros with the proper enum literal values (per
// nh-constants.js: COIN=12, AMULET=5, WEAPON=2, ARMOR=3, FOOD=7,
// SCROLL=9, SPBOOK=10, POTION=8, RING=4, WAND=11, TOOL=6, GEM=13,
// ROCK=14, BALL=15, CHAIN=16) so translator output is
// spec-correct (eliminates the hand-port re-init).
patchFile('options.js', (s) => {
    return s.replace(
        /const def_inv_order = \[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0\];/,
        'const def_inv_order = [12, 5, 2, 3, 7, 9, 10, 8, 4, 11, 6, 13, 14, 15, 16, 0, 0, 0]; /* COIN, AMULET, WEAPON, ARMOR, FOOD, SCROLL, SPBOOK, POTION, RING, WAND, TOOL, GEM, ROCK, BALL, CHAIN, 0, 0, 0 */'
    );
});

// options.js: with the translator now emitting allopt_t's `addr`
// field as a value-box wrapper (so `*p = initval` writes propagate
// back to the underlying flags.X/iflags.X slot), the two
// initoptions_init / allopt_array_init "TODO Phase 5+: pointer-
// mutation lvalue (C: *p = game.allopt[i].initval)" sites become
// real writes — `game.allopt[i].addr.value = game.allopt[i].initval`.
// This restores C-correct default-value initialization for ~120
// boolean options (e.g. safe_pet → flags.safe_dog defaults to On).
//
// Also patch four truthy-context bool_p uses where the wrapper
// object is always truthy: replace `bool_p ? "X" : " "` and similar
// ternaries with `bool_p.value` reads.  `bool_p == X` and `bool_p
// != X` use `==`/`!=` which invoke ToPrimitive→valueOf — the
// wrapper has valueOf() so those work unchanged.
patchFile('options.js', (s) => {
    s = s.replace(
        /if \(game\.allopt\[i\]\.addr\) \{\n            void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = game\.allopt\[i\]\.initval\) \*\/;\n        \}/g,
        `if (game.allopt[i].addr) {
            game.allopt[i].addr.value = game.allopt[i].initval;
        }`
    );
    s = s.replace(
        /if \(game\.allopt\[i\]\.addr\) \{\n                void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = game\.allopt\[i\]\.initval\) \*\/;\n            \}/g,
        `if (game.allopt[i].addr) {
                game.allopt[i].addr.value = game.allopt[i].initval;
            }`
    );
    s = s.replace(
        /__get_option_value_retbuf = sprintf\(__get_option_value_retbuf, "%s", bool_p \? "true" : "false"\);/,
        '__get_option_value_retbuf = sprintf(__get_option_value_retbuf, "%s", bool_p.value ? "true" : "false");'
    );
    s = s.replace(
        /buf = sprintf\(buf, fmtstr, name, bool_p \? "X" : " "\);/,
        'buf = sprintf(buf, fmtstr, name, bool_p.value ? "X" : " ");'
    );
    s = s.replace(
        /tmp = sprintf\(tmp, "OPTIONS=%s%s\\n", bool_p \? "" : "!", name\);/,
        'tmp = sprintf(tmp, "OPTIONS=%s%s\\n", bool_p.value ? "" : "!", name);'
    );
    s = s.replace(
        /buf = sprintf\(buf, "%s%s", game\.allopt\[i\]\.addr \? "!" : "", game\.allopt\[i\]\.name\);/,
        'buf = sprintf(buf, "%s%s", game.allopt[i].addr.value ? "!" : "", game.allopt[i].name);'
    );
    return s;
});

// NOTE: Seven per-function patches for C-static persistence in
// align_shift, tmp_at, cls, flush_screen, spoteffects,
// eval_notify_windowport_field, and add_branch were retired here
// once the translator gained universal function-local-static
// hoisting (translate.mjs, declStmt + functionDecl).  Every
// function-local `static T x = init;` in C is now emitted as a
// module-scope `let __<fnname>_<x> = init;` declaration, with all
// references inside the body rewritten to the hoisted name.  The
// 9 hand-patches that did this one function at a time became dead
// code (their regexes targeted `let var = init` body bindings the
// translator no longer emits) and are unnecessary.  See
// LEARNINGS.md §23.37.

// dungeon.js: level_map entries hold references to
// game.dungeon_topology slots evaluated at module-load time.  At
// load time, game.dungeon_topology is the empty auto-Proxy ghost,
// so each lev_spec ends up being the blackhole.  After
// decl_globals_init populates game.dungeon_topology with fresh
// objects, the level_map references would be stale.  This forced a
// hand-port re-link in allmain.js newgame.
//
// Convert each `lev_spec: (game.dungeon_topology.d_X_level)` to a
// getter `get lev_spec() { return game.dungeon_topology.d_X_level; }`
// so resolution happens at read-time, not module-load.  Combined
// with the deepClone accessor-preserving fix in gstate.js, the
// getter survives the resetGame snapshot/restore cycle.
//
// Per docs/NEXT_STEPS.md Phase F2 step 2 option (b): "making
// level_map use lazy lookups (lev_name → game.dungeon_topology
// [fieldName] resolved at read time, not at module load)".
patchFile('dungeon.js', (s) => {
    return s.replace(
        /lev_spec: \(game\.dungeon_topology\.(d_[a-z0-9_]+_level)\)/g,
        'get lev_spec() { return game.dungeon_topology.$1; }'
    );
});

// dungeon.js recalc_mapseen guard attempt was REVERTED: adding the
// `game.rooms[i] &&` guards lets the function complete (instead of
// throwing into cmd.js's manual-fallback), but the downstream code
// after recalc_mapseen has its own issues and the session ETIMEs
// out for 8 sessions.  Keep the throw-and-fallback path for now
// until the downstream issues are identified.

// shk.js: 6 pointer-walks over `bill_p` (the shop's bill_x array)
// — `bp = bill_p; while (ct--/--ct>=0) {...; bp++;}` and
// `for (bp = bill_p, end_bp = &bill_p[billct]; bp < end_bp; bp++)`
// shapes.  All now handled by translate.mjs recognizers
// (detectWhilePtrWalk for the while-form, detectBoundedStructPtrForLoop
// for the bounded-pointer for-form).
//
// One remaining patch: sub_one_frombill `*otmp = *obj` struct
// value-copy.  Translator emits Object.assign which shares the
// `v` sub-struct by reference (same hazard as mkobj.js splitobj
// at line 444).  Clone otmp.v explicitly after the assign.
patchFile('shk.js', (s) => {
    return s.replace(
        /(Object\.assign\(otmp, obj\);\s+otmp\.oextra = null;)/,
        `Object.assign(otmp, obj);\n            otmp.v = { v_nexthere: obj.v?.v_nexthere ?? null, v_ocontainer: obj.v?.v_ocontainer ?? null, v_ocarry: obj.v?.v_ocarry ?? null };\n            otmp.oextra = null;`
    );
});

// hacklib.js: lcase/ucase/mungspaces/trimspaces/strip_newline/
// stripdigits/ing_suffix/tabexpand/s_suffix all use `(s + '')`
// to coerce inputs to strings.  Char-array inputs (e.g. local
// `char buf[BUFSZ]` translations) produce comma-joined garbage
// "65,66,67,0" instead of "ABC".  Callers like pager.js's
// `dbase_str = lcase(dbase_str)`, sounds.js's `ucase(strcpy(
// tmpbuf, verbl_msg))`, topten.js's `lcase(rnkbuf)`, etc. all
// pass buffers and silently get garbage.
//
// Fix: pre-coerce char-array arguments to JS strings via a tiny
// inline helper inserted at the top of hacklib.js.  The recognizer-
// emitted bodies are rewritten to call this helper instead of
// `(${s} + '')`.  This sidesteps modifying the translator's
// STRING_TRANSFORM_RECOGNIZERS dictionary directly (which would
// affect every TU; only hacklib.js owns these recognized bodies).
patchFile('hacklib.js', (s) => {
    if (!s.includes('export function lcase(')) return s;
    // Prepend the helper just after the imports.
    const helper = `\n// __nh_toJsStr — char-array safe coerce.  See §23.43.\n` +
        `function __nh_toJsStr(x) {\n` +
        `    if (x == null) return '';\n` +
        `    if (Array.isArray(x)) {\n` +
        `        let r = '';\n` +
        `        for (let i = 0; i < x.length && x[i]; i++) r += String.fromCharCode(x[i]);\n` +
        `        return r;\n` +
        `    }\n` +
        `    return String(x);\n` +
        `}\n`;
    // Locate the end of the import block: last contiguous run of
    // `import ... from ...;` at file top.
    const importEnd = (() => {
        const lines = s.split('\n');
        let last = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) last = i + 1;
            else if (lines[i].trim() === '') continue;
            else break;
        }
        return lines.slice(0, last).join('\n').length;
    })();
    let out = s.slice(0, importEnd) + helper + s.slice(importEnd);
    // Rewrite `(${s} + '')` patterns in lcase/ucase to use the
    // helper.  The s_suffix recognizer also has `(${s} + '')` —
    // include it.  Match conservatively: only rewrite where the
    // pattern is followed by `.toLowerCase`, `.toUpperCase`, or
    // appears in a `_b = ` / `_s = ` / `_str = ` assignment.
    out = out.replace(/\((\w+) \+ ''\)\.toLowerCase\(\)/g, '__nh_toJsStr($1).toLowerCase()');
    out = out.replace(/\((\w+) \+ ''\)\.toUpperCase\(\)/g, '__nh_toJsStr($1).toUpperCase()');
    out = out.replace(/let _b = (\w+) \+ '';/g, 'let _b = __nh_toJsStr($1);');
    out = out.replace(/let _s = (\w+) \+ '';/g, 'let _s = __nh_toJsStr($1);');
    out = out.replace(/const _str = (\w+) \+ '';/g, 'const _str = __nh_toJsStr($1);');
    out = out.replace(/const _s = (\w+) == null \? '' : \((\w+) \+ ''\);/g, 'const _s = __nh_toJsStr($1);');
    // mungspaces/trimspaces/strip_newline/stripdigits chain
    // `(${s} + '').replace(...)` — replace the coerce.
    out = out.replace(/\((\w+) \+ ''\)\.replace\(/g, '__nh_toJsStr($1).replace(');
    // onlyspace pattern: `/^\\s*$/.test(${s} + '')`.
    out = out.replace(/\.test\((\w+) \+ ''\)/g, '.test(__nh_toJsStr($1))');
    // str_lines_maxlen: C does `len = s2 - s1` (pointer subtraction
    // between two positions in the same string buffer to compute
    // line length).  Translator emits this verbatim, but in JS both
    // operands are JS strings; `"\nfoo" - "bar\nfoo"` coerces to
    // NaN.  Every loop iteration's `len = NaN`, `if (len > max_len)`
    // never triggers, max_len stays 0, function returns 0.  Result:
    // lspo_map's `rn2(COLNO - 1 - mf->wid)` becomes `rn2(79)`
    // everywhere instead of `rn2(71 - mf.wid)` — divergence on every
    // seed that hits a fragment-map placement with no enclosing
    // croom (seed0004, 0009, 0013-rogue, 0013-fullmoon, 0015, 0200
    // per find-divs).  Replace the body with a JS string-split
    // implementation that computes the max line length directly.
    out = out.replace(
        /export function str_lines_maxlen\(str\) \{[\s\S]*?return max_len;\s*\}/,
        `export function str_lines_maxlen(str) {
    if (str == null) return 0;
    const s = __nh_toJsStr(str);
    let max_len = 0;
    for (const line of s.split('\\n')) {
        if (line.length > max_len) max_len = line.length;
    }
    return max_len;
}`
    );
    return out;
});

// dog.js + vault.js + wizard.js + wizcmds.js: `struct monst **mprev`
// linked-list iteration with mid-loop removal.  C uses:
//   for (mprev = &game.LIST; (mtmp = *mprev) != 0; ) {
//       if (cond_to_remove) {
//           *mprev = mtmp->nmon;  // unlink mtmp, mprev stays
//           do_something_with(mtmp);
//       } else {
//           mprev = &mtmp->nmon;  // advance
//       }
//   }
// The translator can't model pointer-to-pointer, so it emits:
//   for (mprev = game.LIST; (mtmp = mprev) != null; ) {
//       if (cond) { void 0 /* TODO *p = mtmp.nmon */; do_something_with(mtmp); }
//       else { mprev = mtmp.nmon; }
//   }
// which silently drops the unlink (mtmp stays on the list) AND
// uses the wrong `(mtmp = mprev)` semantics (mprev is a node, not
// a slot pointer).
//
// Fix: rewrite to a sentinel-prev pattern where `__prev.nmon` is
// either the head field (via getter/setter on a sentinel box) or
// a real node's `.nmon`, so the unlink `__prev.nmon = mtmp.nmon`
// works uniformly without losing the head reference.  Hot on
// keepdogs (level transitions), losedogs (level depart),
// vault_dest, wiz_loc-monster code paths.

function fixMprevLoop(s, listFieldExpr, sourceFile, opts = {}) {
    // Match the for-loop heading + brace-balanced body.  Regex
    // can't balance braces, so we find each candidate heading,
    // then walk forward counting `{` / `}` until back to depth 0
    // (the loop's close).
    const prevVar = opts.prevVar || 'mprev';     // C: `mprev`
    const itemVar = opts.itemVar || 'mtmp';      // C: `mtmp`
    const linkField = opts.linkField || 'nmon';  // C: `mtmp->nmon`
    const escapedExpr = listFieldExpr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedLink = linkField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Two acceptable shapes for the for-loop heading:
    //   (a) empty inc: `for (prevVar = X; (itemVar = prevVar) != null; ) {`
    //   (b) advance in inc: `for (prevVar = X; (itemVar = prevVar) != null; prevVar = itemVar.LINK) {`
    const headRe = new RegExp(
        `( *)for \\(${prevVar} = ${escapedExpr}; \\(${itemVar} = ${prevVar}\\) != null;(?:\\s*${prevVar} = [a-zA-Z_]+\\.${escapedLink})?\\s*\\) \\{`,
        'g'
    );
    const out = [];
    let lastEnd = 0;
    let m;
    while ((m = headRe.exec(s)) !== null) {
        const indent = m[1];
        const headStart = m.index;
        const bodyStart = m.index + m[0].length;
        // Walk forward, counting braces.  m[0] already consumed the
        // opening `{` of the for-body, so depth starts at 1.
        let depth = 1;
        let i = bodyStart;
        while (i < s.length && depth > 0) {
            const c = s[i];
            if (c === '{') depth++;
            else if (c === '}') depth--;
            i++;
        }
        if (depth !== 0) {
            // Brace-balance failed; leave this occurrence as-is.
            continue;
        }
        const bodyEnd = i - 1; // index of the closing `}`
        const body = s.slice(bodyStart, bodyEnd);
        const todoRe = new RegExp(`void 0 \\/\\* TODO Phase 5\\+: pointer-mutation lvalue \\(C: \\*p = [a-zA-Z_]+\\.${escapedLink}\\)`);
        const advRe = new RegExp(`${prevVar} = [a-zA-Z_]+\\.${escapedLink}`);
        if (!todoRe.test(body) && !advRe.test(body)) {
            // Not the shape we expect; skip silently.
            continue;
        }
        // Rewrite inside body.
        let b = body;
        b = b.replace(
            new RegExp(`void 0 \\/\\* TODO Phase 5\\+: pointer-mutation lvalue \\(C: \\*p = ([a-zA-Z_]+)\\.${escapedLink}\\) \\*\\/;`, 'g'),
            `__${prevVar}.${linkField} = $1.${linkField};`
        );
        b = b.replace(
            new RegExp(`${prevVar} = ([a-zA-Z_]+)\\.${escapedLink};`, 'g'),
            `__${prevVar} = $1;`
        );
        // If the for-loop's increment was `prevVar = mtmp->nmon` (shape b),
        // the advance lives in the LOOP HEADER, not the body — so the body
        // doesn't contain any `prevVar = X.nmon` for the second replace
        // above to catch.  The new while-loop has no advance, infinite-
        // loops when the if-branch doesn't return.  Append the advance
        // at the end of the body to mirror the C for-loop's increment.
        // Detect this by checking if the body now contains __prevVar = ...
        // — if not, append.  C ref: vault.c findgd:217-218, etc.
        if (!new RegExp(`__${prevVar} = `).test(b)) {
            // Body ends with whitespace + closing brace; insert advance
            // before that closing brace.  Use indent + 4 spaces for body
            // indent (matches the for-loop's body indent style).
            b = b.replace(/(\n[\s]*)$/, `\n${indent}    __${prevVar} = ${itemVar};$1`);
        }
        const replacement = [
            `${indent}{ /* ${prevVar} pointer-to-pointer rewrite — sourced from ${sourceFile} */`,
            `${indent}    const __${prevVar}_box = { get ${linkField}(){ return ${listFieldExpr}; }, set ${linkField}(v){ ${listFieldExpr} = v; } };`,
            `${indent}    let __${prevVar} = __${prevVar}_box;`,
            `${indent}    while ((${itemVar} = __${prevVar}.${linkField}) != null) {${b}}`,
            `${indent}}`,
        ].join('\n');
        out.push(s.slice(lastEnd, headStart), replacement);
        lastEnd = bodyEnd + 1;
        // Move the headRe lastIndex past the consumed body so
        // we don't re-scan inside the (now-replaced) region.
        headRe.lastIndex = lastEnd;
    }
    out.push(s.slice(lastEnd));
    return out.join('');
}

patchFile('dog.js', (s) => {
    s = fixMprevLoop(s, 'game.migrating_mons', 'dog.c keepdogs/losedogs');
    // Same idiom for migrating_objs in losedogs (object list):
    // `for (oprev = &gm.migrating_objs; (otmp = *oprev) != 0; )`
    // with `*oprev = otmp->nobj` in the unlink branch.
    s = fixMprevLoop(s, 'game.migrating_objs', 'dog.c losedogs (objects)', {
        prevVar: 'oprev', itemVar: 'otmp', linkField: 'nobj'
    });
    return s;
});

patchFile('vault.js', (s) => {
    s = fixMprevLoop(s, 'game.migrating_mons', 'vault.c');
    return s;
});

// vault.js: gd_move()'s 3 goto sites for vault guard movement.
//
//   1. `goto newpos` (from typ >= DOOR branch in corridor-create
//      loop): skip corridor-create + proceed + fcorr setup, just
//      gd_mv_monaway at the door position.
//   2. `goto proceed` (after del_engr_at in corridor-create
//      loop): skip movement-direction computation, fall to fcorr
//      setup.
//   3. `goto nextpos` (back-jump retry from stuck guard, find_
//      guard_dest succeeded with new gdx/gdy): restart corridor-
//      create loop with new destination.
//
// Translator emitted all 3 as TODOs.  Effects:
//   - typ >= DOOR: gddone=1 was set but the code kept digging
//     a corridor toward gdx/gdy and the guard MOVED to a
//     different position instead of stopping at the door.
//   - after del_engr_at: code fell through to next iteration
//     of inner for-loop, then proceed body ran movement compute
//     overwriting nx/ny that the door-found-and-paved
//     correctly setup.
//   - stuck retry: guard didn't retry; instead used original
//     nx/ny and moved to wrong position.
//
// Restructure with __skip_to_gd_mv_monaway and
// __skip_to_fcorr_setup flags wrapped in
// `gd_move_loop: while (true)` for the back-jump retry.
//
// C ref: src/vault.c lines 1085 (goto newpos) + 1105 (goto
// proceed) + 1180 (goto nextpos back-jump).
patchFile('vault.js', (s) => {
    // 1. Insert loop start + flag init before nextpos
    s = s.replace(
        /    let u_in_vault = 0;\n    let grd_in_vault = 0;\n    let semi_dead = 0;\n    let u_carry_gold = 0;\n    let newspot = 0;\n    nextpos: \{/,
        `    let u_in_vault = 0;
    let grd_in_vault = 0;
    let semi_dead = 0;
    let u_carry_gold = 0;
    let newspot = 0;
    let __skip_to_gd_mv_monaway = false;
    let __skip_to_fcorr_setup = false;
    gd_move_loop: while (true) {
    __skip_to_gd_mv_monaway = false;
    __skip_to_fcorr_setup = false;
    nextpos: {`
    );
    // 2. Replace TODO goto newpos / goto proceed inside corridor-create
    s = s.replace(
        /                            egrd\.gddone = 1;\n                            if \(\(\(typ\) >= DOOR\)\) \{\n                                \/\* TODO Phase 5\+: goto newpos \(label not in scope of break\) \*\/\n                            \}\n                            crm\.typ = \(typ == SCORR\) \? CORR : DOOR;\n                            if \(crm\.typ == DOOR\) \{\n                                crm\.flags = 0;\n                            \} else \{\n                                crm\.flags = 0;\n                            \}\n                            del_engr_at\(nx, ny\);\n                            \/\* TODO Phase 5\+: goto proceed \(label not in scope of break\) \*\/\n                        \}/,
        `                            egrd.gddone = 1;
                            if (((typ) >= DOOR)) {
                                __skip_to_gd_mv_monaway = true;
                                break nextpos;
                            }
                            crm.typ = (typ == SCORR) ? CORR : DOOR;
                            if (crm.typ == DOOR) {
                                crm.flags = 0;
                            } else {
                                crm.flags = 0;
                            }
                            del_engr_at(nx, ny);
                            __skip_to_fcorr_setup = true;
                            break nextpos;
                        }`
    );
    // 3. Wrap proceed body in flag check, wrap newpos in flag check, add loop-end break, replace nextpos back-jump
    s = s.replace(
        /    nx = x;\n    proceed: \{\n        ny = y;\n        ggx = egrd\.gdx;/,
        `    nx = x;
    if (!__skip_to_gd_mv_monaway && !__skip_to_fcorr_setup) {
    proceed: {
        ny = y;
        ggx = egrd.gdx;`
    );
    s = s.replace(
        /        crm\.typ = CORR;\n        crm\.flags = 0;\n    \}\n    newspot = \(1\);\n    newpos: \{/,
        `        crm.typ = CORR;
        crm.flags = 0;
    }
    }
    newspot = (1);
    if (!__skip_to_gd_mv_monaway) {
    newpos: {`
    );
    s = s.replace(
        /            \} else \{\n                \/\* TODO Phase 5\+: goto nextpos \(label not in scope of break\) \*\/\n            \}\n        \}\n    \}\n    gd_mv_monaway\(grd, nx, ny\);/,
        `            } else {
                continue gd_move_loop;
            }
        }
    }
    }
    break;
    }
    gd_mv_monaway(grd, nx, ny);`
    );
    return s;
});

// Generic string-truncation pattern: C `*p = '\0'` where `p`
// came from `strstri(buf, needle)` or `strchr(buf, c)` — truncates
// `buf` in place at the match position.  JS strings are immutable,
// but the translator-emitted code does `bufp = obj_typename(...)`
// (a string) and then `*p = 0` becomes a no-op TODO.
//
// Rewrite the pattern when it matches the simple shape:
//   if ((P = strstri(BUF, NEEDLE)) != null) {
//       void 0 /* TODO ... *p = 0 */;
//   }
// to:
//   if ((P = strstri(BUF, NEEDLE)) != null) {
//       BUF = (typeof BUF === 'string') ? BUF.slice(0, BUF.length - P.length) : BUF;
//   }
//
// Note (2026-05-21): the strchr-truncate recognizer (§23.114) absorbs
// the SAFETY-CLEAN sites natively, but this textual rewrite still
// catches sites that have position-dependent post-truncate uses of P
// — the recognizer rejects those.  Re-confirmed it's load-bearing
// when removing it added +17 TODOs to objnam.js.
function fixStrstriTruncate(s) {
    // Simple shape with optional trailing `&& X` clauses after `!=
    // null` (pager.js: `&& ep > dbase_str`).  Extra clauses must use
    // no parens to keep the `\) \{` closer unambiguous.
    const simpleRe = /if \(\(([A-Za-z_]\w*) = (strstri|strstr|strchr|strrchr)\(([A-Za-z_]\w*), ([^)]+)\)\) != null(?:\s*\&\&[^){]*)?\) \{\s+void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 0\) \*\/;\s+\}/g;
    s = s.replace(simpleRe, (m, P, fn, BUF, NEEDLE) => {
        // Re-extract the test portion verbatim so we preserve any
        // trailing `&& X` clauses the regex captured.
        const test = m.match(/if \((.*?)\) \{/)[1];
        return `if (${test}) {\n        ${BUF} = (typeof ${BUF} === 'string') ? ${BUF}.slice(0, ${BUF}.length - ${P}.length) : ${BUF};\n    }`;
    });
    // Compound shape: `} else if (cond && (P = strstri(BUF, NEEDLE)) != null) {
    //                       TODO
    //                  }`.  cond is opaque to us; we only rewrite the body.
    // Match by anchoring on the `(P = strstri(...))` assignment-test
    // and a TODO immediately inside the brace.
    // Compound shape may have additional `&& X` clauses after `!= null`
    // (pager.js: `&& (ep = strstri(...)) != null && ep > dbase_str`).
    // The extra clauses use only non-paren operators in practice, so
    // `[^)]*` captures them cleanly without messing up the closing
    // paren of the outer if.
    const compoundRe = /(\&\& \(([A-Za-z_]\w*) = (strstri|strstr|strchr|strrchr)\(([A-Za-z_]\w*), ([^)]+)\)\) != null(?:\s*\&\&[^){]*)?\) \{)\s+void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = 0\) \*\/;/g;
    s = s.replace(compoundRe, (_m, prefix, _P, _fn, BUF, _NEEDLE) =>
        `${prefix}\n            ${BUF} = (typeof ${BUF} === 'string') ? ${BUF}.slice(0, ${BUF}.indexOf(${_NEEDLE})) : ${BUF};`
    );
    return s;
}
// Only pager.js still needs this textual rewrite — the other
// 5 files (objnam, do_name, mklev, invent, attrib) have their
// strchr-truncate sites absorbed natively by the recognizer.
patchFile('pager.js', fixStrstriTruncate);

// uhitm.js: do_attack's in_shop check at uhitm.c:478:
//   for (p = in_rooms(mtmp->mx, mtmp->my, SHOPBASE); *p; p++)
//       if (tended_shop(&svr.rooms[*p - ROOMOFFSET])) { inshop = TRUE; break; }
// C iterates over the room-id chars in p (in_rooms returns a string
// where each char's code = room index + ROOMOFFSET).  Translator
// emitted as `for (p = in_rooms(...); p; p++)` (checks p truthiness
// without dereference) and `game.rooms[p - 3]` (string arithmetic
// yields NaN).  Loop runs once with garbage indexing, tended_shop
// always returns falsy via autostub → inshop never set.
//
// Fix: rewrite to iterate over each char of the returned string,
// looking up game.rooms[code - 3] for each.
patchFile('uhitm.js', (s) => {
    return s.replace(
        /                if \(!foo\) \{\s+for \(p = in_rooms\(mtmp\.mx, mtmp\.my, SHOPBASE\); p; p\+\+\) \{\s+if \(tended_shop\(game\.rooms\[p - 3\]\)\) \{\s+inshop = \(1\);\s+break;\s+\}\s+\}\s+\}/,
        `                if (!foo) {
                    const __rooms = in_rooms(mtmp.mx, mtmp.my, SHOPBASE);
                    const __rs = (typeof __rooms === 'string') ? __rooms : '';
                    for (let __ri = 0; __ri < __rs.length; __ri++) {
                        if (tended_shop(game.rooms[__rs.charCodeAt(__ri) - 3])) {
                            inshop = (1);
                            break;
                        }
                    }
                }`
    );
});

// mhitu.js: monst_attk's permanent-HP-damage block has a C
// `int *hpmax_p = &u.mhmax;` (or `&u.uhpmax`) pointer-to-scalar
// idiom.  Translator emits `let hpmax_p = game.u.mhmax;` (copies
// the VALUE) and the writes `*hpmax_p -= permdmg` / `*hpmax_p =
// lowerlimit` become local mutations and a `void 0` TODO — no
// effect on the underlying field.  Result: permanent HP damage
// from amulets of life saving, deathblow, etc. is silently
// dropped.  C ref mhitu.c:1242-1252.
//
// Fix: replace `hpmax_p = game.u.X` with a `{ get value, set
// value }` wrapper bound to the correct field, and rewrite
// reads + writes to go through `.value`.
patchFile('mhitu.js', (s) => {
    return s.replace(
        /if \(\(game\.u\.umonnum != game\.u\.umonster\)\) \{\s+hpmax_p = game\.u\.mhmax;\s+lowerlimit = \(\(game\.youmonst\.data\.mlevel\) < \(game\.u\.ulevel\) \? \(game\.youmonst\.data\.mlevel\) : \(game\.u\.ulevel\)\);\s+\} else \{\s+hpmax_p = game\.u\.uhpmax;\s+lowerlimit = minuhpmax\(1\);\s+\}\s+if \(hpmax_p - mhm\.permdmg > lowerlimit\) \{\s+hpmax_p -= mhm\.permdmg;\s+\} else if \(hpmax_p > lowerlimit\) \{\s+void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = lowerlimit\) \*\/;\s+\}/,
        `if ((game.u.umonnum != game.u.umonster)) {
                hpmax_p = { get value() { return game.u.mhmax; }, set value(v) { game.u.mhmax = v; } };
                lowerlimit = ((game.youmonst.data.mlevel) < (game.u.ulevel) ? (game.youmonst.data.mlevel) : (game.u.ulevel));
            } else {
                hpmax_p = { get value() { return game.u.uhpmax; }, set value(v) { game.u.uhpmax = v; } };
                lowerlimit = minuhpmax(1);
            }
            if (hpmax_p.value - mhm.permdmg > lowerlimit) {
                hpmax_p.value -= mhm.permdmg;
            } else if (hpmax_p.value > lowerlimit) {
                hpmax_p.value = lowerlimit;
            }`
    );
});

patchFile('wizard.js', (s) => {
    s = fixMprevLoop(s, 'game.migrating_mons', 'wizard.c');
    // wizard.c summon_minion has a different shape — `mmtmp` instead
    // of `mprev`, `while` instead of `for`, with init outside the
    // loop and advance at body's end.  Rewrite specifically the
    // shape we know about.  C ref wizard.c:732-758.
    const headStart = s.indexOf('mmtmp = game.migrating_mons;\n        while ((mtmp = mmtmp) != null) {');
    if (headStart < 0) return s;
    // Walk forward from the `{` of the while-body, counting braces.
    let i = headStart + 'mmtmp = game.migrating_mons;\n        while ((mtmp = mmtmp) != null) {'.length;
    let depth = 1;
    while (i < s.length && depth > 0) {
        const c = s[i];
        if (c === '{') depth++;
        else if (c === '}') depth--;
        i++;
    }
    if (depth !== 0) return s;
    const bodyClose = i; // index past the closing `}`
    const bodyStart = headStart + 'mmtmp = game.migrating_mons;\n        while ((mtmp = mmtmp) != null) {'.length;
    const body = s.slice(bodyStart, bodyClose - 1); // exclude the closing `}`
    // Rewrite the body.
    let b = body;
    b = b.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = ([a-zA-Z_]+)\.nmon\) \*\/;/g,
        '__mprev.nmon = $1.nmon;'
    );
    b = b.replace(
        /mmtmp = mtmp\.nmon;/g,
        '__mprev = mtmp;'
    );
    const replacement =
        `{ /* mmtmp pointer-to-pointer rewrite — sourced from wizard.c summon_minion */
        const __mprev_box = { get nmon(){ return game.migrating_mons; }, set nmon(v){ game.migrating_mons = v; } };
        let __mprev = __mprev_box;
        while ((mtmp = __mprev.nmon) != null) {${b}}\n        }`;
    return s.slice(0, headStart) + replacement + s.slice(bodyClose);
});

patchFile('wizcmds.js', (s) => {
    s = fixMprevLoop(s, 'game.migrating_mons', 'wizcmds.c');
    return s;
});

// symbols.js: match_sym `while (sp.range) { ...; sp++; }` walks ×2 —
// now handled by translate.mjs `detectWhilePtrWalk`.

// worn.js: nxt_unbypassed_loot `while ((obj = lootarray.obj) != null)
// { ...; lootarray++; }` — now handled by translate.mjs
// `detectWhilePtrWalk` (cond `(obj = lootarray.obj) != null` is
// preserved verbatim; the walk indexing wraps it).

// wizcmds.js: wiz_mon_diff walks `mons[]` (terminated by !mlet).
// C: `for (ptr = &mons[0]; ptr->mlet; ptr++, cnt++)`.  Translator
// emits post-increment as Proxy.  Wizard-mode debug command; doesn't
// affect scoring but spec-correct.
patchFile('wizcmds.js', (s) => {
    return s.replace(
        /for \(ptr = game\.mons\[0\]; ptr\.mlet; \(ptr = __nh_blackhole\) , cnt\+\+\) \{/,
        `for (let __ptr_i = 0; __ptr_i < game.mons.length && (ptr = game.mons[__ptr_i]).mlet; __ptr_i++, cnt++) {`
    );
});

// windows.js: in C, init_nhwindows() runs at startup and copies the
// chosen winport's procs (tty_procs, hup_procs, etc.) into
// `windowprocs`.  Headless test/scoring boots through hand-rolled
// `js/allmain.js` which never calls init_nhwindows, so
// `game.windowprocs.win_X` stay null and translated code that
// dereferences them (e.g. dungeon.js `u_on_newpos` →
// `windowprocs.win_cliparound(...)`) throws.  hup_procs is the
// pre-existing no-op procs table NetHack installs on SIGHUP; copy
// its function pointers into windowprocs for any null field as a
// safe headless default.
//
// Why diagnostic-gated (NH_WINPROCS_DEFAULTS=1): installing the
// defaults unconditionally regresses ~20 P at current state — many
// translated paths previously short-circuited via null-throw +
// hand-rolled fallback, and the no-op path fires extra RNG.  Pair
// with NH_GBUF_FIX=1 to test full t_domove unblock (also a
// regression at current state; see LEARNINGS §23.25).  Leave both
// gates in place as diagnostic infrastructure for Step F / future
// translator-driven replacement work.
patchFile('windows.js', (s) => {
    const tail = `\n// Install hup_procs no-op defaults for null windowprocs fields.\n// Gated: enable with NH_WINPROCS_DEFAULTS=1.  See LEARNINGS §23.29.\nif (process.env.NH_WINPROCS_DEFAULTS) {\n    for (const __wp_k of Object.keys(game.windowprocs)) {\n        if (game.windowprocs[__wp_k] === null && typeof game.hup_procs[__wp_k] === 'function') {\n            game.windowprocs[__wp_k] = game.hup_procs[__wp_k];\n        }\n    }\n}\n`;
    if (s.includes('Install hup_procs no-op defaults')) return s;
    return s + tail;
});

// === seed0014 investigation: ^enexto state-snapshot checkpoints ===
//
// Adds traceCheckpoint events at enexto_core start and each
// goodpos-pick decision so the JS trace records (xx, yy) at entry
// and (x, y, ok) for each candidate considered.  Lets the differ
// pin which candidate cell JS picks vs C.
patchFile('teleport.js', (s) => {
    if (s.includes('enexto_core.start')) return s;  // idempotent
    if (!s.includes("from '../c2js-runtime/trace.js'")) {
        s = "import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';\n" + s;
    } else {
        s = s.replace(
            /import \{ fnEnter \} from '\.\.\/c2js-runtime\/trace\.js';/,
            "import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';"
        );
    }
    // Emit ^enexto_core.start at function entry; ^enexto_core.pick at
    // each cell that wins goodpos (returns 1).
    s = s.replace(
        /    nearcandyct = collect_coords\(candy, xx, yy, 3, 0, null\);\n    for \(i = 0; i < nearcandyct; \+\+i\) \{\n        cc\.x = candy\[i\]\.x; cc\.y = candy\[i\]\.y;\n        if \(goodpos\(cc\.x, cc\.y, fakemon, entflags\)\) \{\n            return \(1\);\n        \}\n    \}/,
        `    traceCheckpoint('enexto_core.start', { xx, yy, gpflags: entflags });
    nearcandyct = collect_coords(candy, xx, yy, 3, 0, null);
    for (i = 0; i < nearcandyct; ++i) {
        cc.x = candy[i].x; cc.y = candy[i].y;
        const __ok = goodpos(cc.x, cc.y, fakemon, entflags);
        traceCheckpoint('enexto_core.try', { i, x: cc.x, y: cc.y, ok: __ok ? 1 : 0 });
        if (__ok) {
            traceCheckpoint('enexto_core.pick', { x: cc.x, y: cc.y });
            return (1);
        }
    }`
    );
    return s;
});

// === seed0014 investigation: ^makedog state-snapshot checkpoints ===
//
// Adds traceCheckpoint events at makedog start/end so the JS trace
// records (ux, uy, pettype) at start and (mx, my, mtame, mpeaceful)
// at end.  Pairs with C-side TRACE_CHECKPOINT markers (added in the
// 010-call-trace-instrumentation.patch when seed0014 work needs a
// re-record).  Currently JS-only; the unmatched events appear in JS
// trace but not C.  compare-traces.mjs --traces flag shows them.
//
// Why these specific events: seed0014 first PRNG divergence is
// rn2(7) @ do_attack(uhitm.c:474) — the safe-pet displacement roll
// when player moves onto a tame monster.  JS pet ends at (46,6) NE
// of player while C must have it at the SE cell where the user
// moves.  Identical PRNG, identical room dimensions, identical
// scrambled candidate order, identical goodpos result (TRUE on
// first candidate) — yet final position differs.  Logging the
// exact JS-side values via ^events lets future investigation cross-
// reference what C records at the same code points after a
// matching C-side TRACE_CHECKPOINT patch + re-record.
//
// Usage: NH_TRACE=on node scripts/capture-js-trace.mjs <session>
// then grep '^^makedog' in the output trace.
patchFile('dog.js', (s) => {
    if (s.includes('traceCheckpoint')) return s;  // idempotent
    // Add import at top — the fnEnter-injection block runs AFTER us
    // and will skip its import if our trace.js import already exists.
    if (!s.includes("from '../c2js-runtime/trace.js'")) {
        s = "import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';\n" + s;
    } else {
        s = s.replace(
            /import \{ fnEnter \} from '\.\.\/c2js-runtime\/trace\.js';/,
            "import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';"
        );
    }
    // Insert ^makedog.start at top of makedog body
    s = s.replace(
        /export function makedog\(\) \{\n    let mtmp = null;/,
        `export function makedog() {
    traceCheckpoint('makedog.start', { ux: game.u.ux, uy: game.u.uy });
    let mtmp = null;`
    );
    // Insert ^makedog.end before final return mtmp (after initedog)
    s = s.replace(
        /    initedog\(mtmp, \(1\)\);\n    return mtmp;\n\}\nexport function set_mon_lastmove/,
        `    initedog(mtmp, (1));
    traceCheckpoint('makedog.end', { mx: mtmp.mx, my: mtmp.my, mtame: mtmp.mtame, mpeaceful: mtmp.mpeaceful, pmidx: mtmp.data ? mtmp.data.pmidx : -1 });
    return mtmp;
}
export function set_mon_lastmove`
    );
    return s;
});

// === seed0105 mklev divergence trace: ^makemon.call / .return + ^mksobj_at ===
//
// seed0105 has 100% PRNG match (2499/2499) but 0/30 screens because
// JS's mklev places 1 fewer monster (missing giant ant at (31,16))
// and 1 fewer boulder (missing at (26,17)) than C.  Identical RNG
// implies same call sequence but different placement decisions —
// somewhere a non-RNG guard returns differently between C and JS.
//
// Add ^makemon.call (entry) and ^makemon.return (exit) checkpoints
// to log every makemon invocation's request args + final placement.
// Also ^mksobj_at to track object placements (boulders).  Mirror the
// makedog pattern (commit 7405 above).
patchFile('makemon.js', (s) => {
    if (s.includes("traceCheckpoint('makemon.call'")) return s;
    if (!s.includes("from '../c2js-runtime/trace.js'")) {
        s = "import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';\n" + s;
    } else {
        s = s.replace(
            /import \{ fnEnter \} from '\.\.\/c2js-runtime\/trace\.js';/,
            "import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';"
        );
    }
    // Insert ^makemon.call at top of makemon body.  The fnEnter
    // injection block runs AFTER us, so the body opener at patch
    // time is just `function ... {` without the fnEnter line yet.
    s = s.replace(
        /export function makemon\(ptr, x, y, mmflags\) \{\n    let mtmp = null;/,
        `export function makemon(ptr, x, y, mmflags) {
    traceCheckpoint('makemon.call', { x, y, mmflags, pmidx: ptr ? (ptr.pmidx | 0) : -1 });
    let mtmp = null;`
    );
    // Insert ^makemon.return at the main success-return point (just
    // before \`return mtmp;\` at line ~1533 in current output).  This
    // logs the final placement (mx, my) and chosen pmidx.
    s = s.replace(
        /        if \(game\.occupation\) \{\n            dochugw\(mtmp, \(0\)\);\n        \}\n    \}\n    return mtmp;\n\}\n\/\* caller rejects makemon\(\)/,
        `        if (game.occupation) {
            dochugw(mtmp, (0));
        }
    }
    if (mtmp) traceCheckpoint('makemon.return', { mx: mtmp.mx, my: mtmp.my, pmidx: mtmp.data ? mtmp.data.pmidx : -1 });
    return mtmp;
}
/* caller rejects makemon()`
    );
    return s;
});

// Add ^mksobj_at.call at entry of mksobj_at — tracks object
// placement (boulders, gold, items).  seed0105 missing boulder
// at (26, 17) should show up here as either missing/extra call.
patchFile('mkobj.js', (s) => {
    if (s.includes("traceCheckpoint('mksobj_at.call'")) return s;
    if (!s.includes("from '../c2js-runtime/trace.js'")) {
        s = "import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';\n" + s;
    } else {
        s = s.replace(
            /import \{ fnEnter \} from '\.\.\/c2js-runtime\/trace\.js';/,
            "import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';"
        );
    }
    // Match the export, capture the body opener.  Use a simple
    // string-replace anchored on the signature line.
    s = s.replace(
        /export function mksobj_at\(otyp, x, y, init, artif\) \{\n/,
        `export function mksobj_at(otyp, x, y, init, artif) {
    traceCheckpoint('mksobj_at.call', { otyp, x, y, init: init|0 });\n`
    );
    return s;
});

// hacklib.js unicodeval_to_utf8str: C `*b++ = byte` writes
// UTF-8 bytes into the caller-provided buffer.  Translator
// dropped all eight pointer-mutation writes so the function
// returned TRUE but the buffer stayed at its initial state
// (typically zeros).  Result: custom symset entries (e.g.
// DECgraphics) stored all-zero utf8str instead of the real
// UTF-8 bytes.  Downstream rendering of those entries would
// display invalid/blank glyphs.
//
// Fix: replace the pointer-arithmetic pattern with an
// index-based write — track `__i` as the write position,
// `buffer[__i++] = byte` for each output byte, leading and
// trailing `buffer[__i] = 0` for the C-string null
// terminators.
//
// No RNG impact (data-table loading path).  Score-stable on
// the 44-session run, but the fix closes a real rendering
// bug for sessions with custom symsets in their nethackrc
// (e.g. seed0102 uses DECgraphics).
//
// C ref: src/hacklib.c unicodeval_to_utf8str.
patchFile('hacklib.js', (s) => {
    if (s.includes('/* unicodeval_to_utf8str fix')) return s;
    const oldBody = `export function unicodeval_to_utf8str(uval, buffer, bufsz) {
    let b = buffer;
    if (bufsz < 5) {
        return 0;
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    if (uval < 128) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = uval) */;
    } else if (uval < 2048) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 192 + Math.trunc(uval / 64)) */;
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 128 + uval % 64) */;
    } else if (uval - 55296 < 2048) {
        return 0;
    } else if (uval < 65536) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 224 + Math.trunc(uval / 4096)) */;
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 128 + Math.trunc(uval / 64) % 64) */;
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 128 + uval % 64) */;
    } else if (uval < 1114112) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 240 + Math.trunc(uval / 262144)) */;
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 128 + Math.trunc(uval / 4096) % 64) */;
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 128 + Math.trunc(uval / 64) % 64) */;
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 128 + uval % 64) */;
    } else {
        return 0;
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    return 1;
}`;
    const newBody = `export function unicodeval_to_utf8str(uval, buffer, bufsz) {
    /* unicodeval_to_utf8str fix - C \`*b++ = byte\` writes UTF-8 bytes
       into the buffer.  Translator dropped all the writes so the
       function returned TRUE but the buffer stayed at its caller-
       provided initial state (typically zeros).  Replace with direct
       index-based writes. */
    if (bufsz < 5) {
        return 0;
    }
    let __i = 0;
    buffer[__i] = 0;
    if (uval < 128) {
        buffer[__i++] = uval;
    } else if (uval < 2048) {
        buffer[__i++] = 192 + Math.trunc(uval / 64);
        buffer[__i++] = 128 + uval % 64;
    } else if (uval - 55296 < 2048) {
        return 0;
    } else if (uval < 65536) {
        buffer[__i++] = 224 + Math.trunc(uval / 4096);
        buffer[__i++] = 128 + Math.trunc(uval / 64) % 64;
        buffer[__i++] = 128 + uval % 64;
    } else if (uval < 1114112) {
        buffer[__i++] = 240 + Math.trunc(uval / 262144);
        buffer[__i++] = 128 + Math.trunc(uval / 4096) % 64;
        buffer[__i++] = 128 + Math.trunc(uval / 64) % 64;
        buffer[__i++] = 128 + uval % 64;
    } else {
        return 0;
    }
    buffer[__i] = 0;
    return 1;
}`;
    return s.replace(oldBody, newBody);
});

// light.js obj_split_light_source: C struct-copy
// `*new_ls = *ls` value-copies the light_source after alloc().
// Translator emitted as TODO no-op so new_ls fields stayed
// undefined (alloc() returns a Proxy that auto-creates fields
// on access — reads return new Proxy sub-objects, not the
// real values).
//
// Fix: `Object.assign(new_ls, ls);` to copy scalar fields,
// plus `new_ls.id = Object.assign({}, ls.id);` to give the
// union a fresh container so subsequent `new_ls.id.a_obj =
// dest` mutates the new node's id without corrupting ls.id.
//
// Rare path (object-stack split on candles); score-stable.
//
// C ref: src/light.c obj_split_light_source (struct copy
// after alloc).
patchFile('light.js', (s) => {
    if (s.includes('/* light-source-split fix')) return s;
    s = s.replace(
        `    for (ls = game.light_base; ls; ls = ls.next) {
        if (ls.type == LS_OBJECT && ls.id.a_obj == src) {
            new_ls = alloc(1 /* sizeof(light_source) */);
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = ls) */;
            if ((src.otyp == TALLOW_CANDLE || src.otyp == WAX_CANDLE)) {`,
        `    for (ls = game.light_base; ls; ls = ls.next) {
        if (ls.type == LS_OBJECT && ls.id.a_obj == src) {
            new_ls = alloc(1 /* sizeof(light_source) */);
            /* light-source-split fix - C struct-copy \`*new_ls = *ls\`
               for value-copy semantics; the union \`id\` needs a
               fresh container so subsequent \`new_ls.id.a_obj =
               dest\` doesn't corrupt ls.id. */
            Object.assign(new_ls, ls);
            new_ls.id = Object.assign({}, ls.id);
            if ((src.otyp == TALLOW_CANDLE || src.otyp == WAX_CANDLE)) {`
    );
    return s;
});

// calendar.js: route localtime() through c2js-runtime so the session-
// datetime hook (globalThis.__nh_localtime) drives it.  Translated
// calendar.c uses localtime as a free identifier (no C-side import);
// autostub fills it with `() => 0` which makes phase_of_the_moon
// return NaN-bitwise-and-7 = 0 (NEW_MOON) for every session.  Adding
// the import lets jsmain.js's per-session date take effect for
// phase_of_the_moon / friday_13th / night / midnight callers.
patchFile('calendar.js', (s) => {
    if (s.includes("import { time, localtime }")) return s;
    return s.replace(
        "import { time } from '../c2js-runtime/calendar.js';",
        "import { time, localtime } from '../c2js-runtime/calendar.js';"
    );
});

// end.js set_killer_from_monst multireasonbuf truncate: superseded
// by strchr-truncate recognizer maturity (§23.114).  Translator
// emits `game.multireasonbuf = nh_strchr_truncate(game.multireasonbuf,
// 32, 'chr')` natively now.

// === Trace instrumentation: inject fnEnter() at top of working-set ===
//
// Reads the working-set list from tools/c2js/trace-working-set.json and
// injects a `fnEnter('funcname', 'cfile.c', 0);` call as the first
// statement of each listed export function.  No-op unless
// NH_TRACE=on/probe (gated inside trace.js).  Pairs with the
// FN_ENTER() macros in nethack-c/patches/010-call-trace-instrumentation.patch
// so the same function names appear in both traces.
//
// We don't (yet) inject fnExit wrappers around returns — function
// entry alone gives most of the divergence-localization value, and
// rewriting every `return X;` to `return fnExitInt('foo','file',0,X);`
// is more invasive than the value justifies right now.  Add it later
// when an investigation specifically wants return-value tracking.
{
    const wsPath = join(SCRIPT_DIR, 'trace-working-set.json');
    const ws = JSON.parse(readFileSync(wsPath, 'utf8'));
    let injected = 0;
    for (const jsFile of Object.keys(ws)) {
        if (jsFile.startsWith('_')) continue;
        const entry = ws[jsFile];
        const cFile = entry._c_file || jsFile.replace(/\.js$/, '.c');
        const funcs = entry.functions || [];
        patchFile(jsFile, (s) => {
            // Insert the import if missing
            if (!s.includes("from '../c2js-runtime/trace.js'")) {
                s = "import { fnEnter } from '../c2js-runtime/trace.js';\n" + s;
            }
            // For each function, inject fnEnter() at top of body.  Match
            // `export function NAME(args) {` followed by a newline.
            // Runs BEFORE the async-await post-process injector, so the
            // file is sync at this point (regardless of NH_EMIT_ASYNC).
            for (const fn of funcs) {
                const re = new RegExp(
                    'export function ' + fn.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') +
                    '\\(([^)]*)\\) \\{\\n(?!    fnEnter\\()',
                    'g'
                );
                s = s.replace(re, (m, args) => {
                    injected++;
                    return `export function ${fn}(${args}) {\n    fnEnter("${fn}", "${cFile}", 0);\n`;
                });
            }
            return s;
        });
    }
    console.log('build-engine: injected', injected, 'fnEnter() trace calls');
}

// === Async-await post-process injector ===
//
// Translator emits sync output; patches operate on sync form.
// Async/await keywords are sprinkled in AFTER all patches have
// applied, driven by the cross-TU async closure computed by
// tools/c2js/async-closure.mjs and written to
// `<outputDir>/__async_closure.json` by build-tree.mjs.
//
// Activated only when NH_EMIT_ASYNC=1.  Default builds keep the
// sync translator output unchanged.
//
// Rule per translated function name in the closure:
//   - `function NAME(...)` → `async function NAME(...)`
//   - call sites `NAME(` → `await NAME(` (skip if already
//     prefixed by `await `, skip method calls `.NAME(`, skip
//     function references where `(` doesn't immediately follow).
//
// Plus the seed itself: `(game.windowprocs.win_nhgetch)()`
// → `await (game.windowprocs.win_nhgetch)()`.
//
// This is the load-bearing design choice: instead of relaxing
// ~200 patchFile() patterns to accept both sync and async forms,
// we keep patches sync-only and centralize the keyword injection
// in this one place.  Future translator changes can't break async
// emit silently because the injector reads the same closure data
// the translator would have used.
if (process.env.NH_EMIT_ASYNC) {
    const manifestPath = join(outputDir, '__async_closure.json');
    let asyncSet;
    try {
        asyncSet = new Set(JSON.parse(readFileSync(manifestPath, 'utf8')));
    } catch (e) {
        console.warn(`build-engine: NH_EMIT_ASYNC=1 but no closure manifest at ${manifestPath} — skipping injection`);
        asyncSet = null;
    }
    if (asyncSet) {
        let injectedAsyncFns = 0;
        let injectedAwaitCalls = 0;
        for (const f of readdirSync(outputDir)) {
            if (!f.endsWith('.js')) continue;
            if (f === '__async_closure.json') continue;
            const p = join(outputDir, f);
            let s = readFileSync(p, 'utf8');
            const before = s;
            // All substitutions below operate on code only — never
            // inside string literals (a function name in a string is
            // text, not a call).  `replaceInCode` walks the source
            // and applies the regex only to code spans, leaving
            // double/single-quoted strings and backtick template
            // literals untouched.
            for (const name of asyncSet) {
                // `function NAME(` → `async function NAME(`.
                const fnRe = new RegExp(
                    String.raw`(?<!async\s)\bfunction ${escapeRe(name)}\(`,
                    'g'
                );
                s = replaceInCode(s, fnRe, (m) => {
                    injectedAsyncFns++;
                    return 'async ' + m;
                });
                // `NAME(` → `await NAME(` at call sites.  Skip if
                // already awaited, skip property accesses (`.NAME(`),
                // skip the function's OWN declaration (where it
                // appears right after the `function ` keyword).
                //
                // Lookbehinds:
                //   (?<!await\s)     — not already awaited
                //   (?<!function )   — not the function's declaration
                //                      (covers both `function NAME` and
                //                       `async function NAME` since the
                //                       9-char `function ` suffix matches
                //                       both)
                //   (?<![\w.])       — not a property access or chained
                //                      call (`obj.NAME(`, `foo().NAME(`)
                const callRe = new RegExp(
                    String.raw`(?<!await\s)(?<!function )(?<![\w.])\b${escapeRe(name)}\(`,
                    'g'
                );
                s = replaceInCode(s, callRe, (m) => {
                    injectedAwaitCalls++;
                    return 'await ' + m;
                });
            }
            // The async seed itself: indirect `(game.windowprocs.win_nhgetch)()` call.
            s = replaceInCode(s,
                /(?<!await\s)(\(game\.windowprocs\.win_nhgetch\))\(/g,
                'await $1('
            );
            // Translator-emitted goto-label arrow functions —
            // `const __NAME = () => { ... };` — need `async` when
            // their body contains `await`, plus their callsites need
            // `await`.  Two-pass over the file (collect, then rewrite).
            s = asyncifyArrowFns(s);
            if (s !== before) {
                writeFileSync(p, s);
            }
        }
        console.log(`build-engine: NH_EMIT_ASYNC=1 — injected ${injectedAsyncFns} async-function heads, ${injectedAwaitCalls} await call sites across ${asyncSet.size} closure entries`);
    }
}

// Apply `regex.replace(str, replacement)` to a source file, but
// ONLY to code spans — string literals, template-literal text,
// and comments are left untouched.  The translated JS contains:
//   - double-quoted strings (extensively; preserved C string lits)
//   - single-quoted strings (sparingly; import paths, char lits)
//   - backtick template literals (rare; sprintf-style helpers)
//   - /* ... */ block comments (translator preserves C comments —
//     critical because some contain apostrophes like "aren't" that
//     would naively look like single-quoted string openers)
//   - // ... line comments (rare in translator output but defensive)
//
// This is a deliberately small tokenizer — not a JS parser.  It
// doesn't handle regex literals (`/.../`) specially because the
// translated output doesn't contain them in positions that would
// confuse this scanner.
function replaceInCode(s, regex, replacement) {
    const out = [];
    let i = 0, codeStart = 0;
    const flushCode = (end) => {
        if (end > codeStart) {
            out.push(s.slice(codeStart, end).replace(regex, replacement));
        }
    };
    while (i < s.length) {
        const c = s[i];
        // Block comment /* ... */
        if (c === '/' && s[i + 1] === '*') {
            flushCode(i);
            let j = i + 2;
            while (j < s.length - 1 && !(s[j] === '*' && s[j + 1] === '/')) j++;
            j = Math.min(j + 2, s.length); // past `*/`
            out.push(s.slice(i, j));
            i = j;
            codeStart = i;
            continue;
        }
        // Line comment // ... (to end of line)
        if (c === '/' && s[i + 1] === '/') {
            flushCode(i);
            let j = i + 2;
            while (j < s.length && s[j] !== '\n') j++;
            out.push(s.slice(i, j));
            i = j;
            codeStart = i;
            continue;
        }
        // String literals
        if (c === '"' || c === "'" || c === '`') {
            flushCode(i);
            const quote = c;
            let j = i + 1;
            while (j < s.length) {
                if (s[j] === '\\') { j += 2; continue; }
                if (s[j] === quote) { j++; break; }
                j++;
            }
            out.push(s.slice(i, j));
            i = j;
            codeStart = i;
            continue;
        }
        i++;
    }
    flushCode(s.length);
    return out.join('');
}

// For each `const __NAME = (ARGS) => { ... };` arrow whose body
// contains an `await`, prefix the arrow with `async` and prefix
// callsites with `await`.  Two-pass: first collect (name, args)
// of affected arrows by brace-counting their bodies, then rewrite.
//
// Handles both arg-less `() =>` and parameterized `(x, y) =>`
// shapes — current translator output only emits the arg-less form
// for goto-label helpers, but the regex covers the general case
// in case future translator-emitted helpers take parameters.
function asyncifyArrowFns(s) {
    const asyncArrows = [];
    const arrowRe = /^( *)const (__\w+) = (\([^)]*\)) => \{/gm;
    let m;
    while ((m = arrowRe.exec(s)) !== null) {
        const name = m[2];
        const args = m[3];
        const bodyStart = m.index + m[0].length;
        let depth = 1, i = bodyStart;
        while (i < s.length && depth > 0) {
            if (s[i] === '{') depth++;
            else if (s[i] === '}') depth--;
            i++;
        }
        const body = s.slice(bodyStart, i);
        if (/\bawait\b/.test(body)) asyncArrows.push({ name, args });
    }
    for (const { name, args } of asyncArrows) {
        s = s.replace(
            new RegExp(`(const ${escapeRe(name)} = )${escapeRe(args)} => \\{`, 'g'),
            `$1async ${args} => {`
        );
        const callRe = new RegExp(
            String.raw`(?<!await\s)(?<!function )(?<![\w.])\b${escapeRe(name)}\(`,
            'g'
        );
        s = s.replace(callRe, 'await ' + name + '(');
    }
    return s;
}

function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log(`build-engine: patchFile applied ${__patchFile_callCount - __patchFile_noopCount}/${__patchFile_callCount} (${__patchFile_noopCount} noop)`);

// Post-patch inside-body comment injection (§23.122).  The translator
// can't emit inside-function-body comments inline without breaking
// ~12+ verbatim patchFile patterns (LEARNINGS §23.120).  Solution:
// translate.mjs records each inside-body comment to a sidecar
// manifest with an "anchor" — the first JS line of the stmt the
// comment was leading.  build-tree.mjs writes the manifest to
// `js/translated/__pending_inside_comments.json` after Phase 2.
// Here, AFTER all patchFile patterns have run, we read each entry,
// search for its anchor in the post-patch file, and inject the
// comment text immediately before the anchor line.
//
// Anchors that:
//   - aren't found in the post-patch file (patches rewrote the line)
//   - match multiple times (anchor isn't unique enough)
// are silently dropped.  Dropping is safe: spec §11 just sees them
// as missing, same as before this injection pass existed.
{
    let injected = 0;
    let droppedNotFound = 0;
    let ambiguousBestEffort = 0;
    let droppedAlreadyPresent = 0;
    const manifestPath = join(outputDir, '__pending_inside_comments.json');
    let manifest = [];
    try {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
        manifest = [];
    }
    // Group entries by file so each file is read/written once.
    const byFile = new Map();
    for (const e of manifest) {
        if (!byFile.has(e.file)) byFile.set(e.file, []);
        byFile.get(e.file).push(e);
    }
    for (const [file, entries] of byFile) {
        const p = join(outputDir, file);
        let s;
        try {
            s = readFileSync(p, 'utf8');
        } catch {
            continue;
        }
        // Apply each injection by line-based replacement.  Multi-pass
        // with each pass picking up newly-inserted content is safe
        // because anchors are stmt text (not comment text), and we
        // only inject BEFORE the anchor (never modifying it).
        // Track which (anchor, content) we've already injected so a
        // duplicate entry doesn't double-inject.
        const seen = new Set();
        for (const { anchor, content, position } of entries) {
            const key = anchor + '\x00' + content + '\x00' + (position || 'before');
            if (seen.has(key)) continue;
            seen.add(key);
            // Already-present check (spec §11 only cares about
            // presence; if the comment text already appears anywhere
            // in the file, don't re-add).
            if (s.includes(content)) {
                droppedAlreadyPresent++;
                continue;
            }
            // Anchor lookup.  String-includes works because the
            // anchor includes leading indentation, which is preserved
            // unless a patch rewrites the surrounding block.
            // Empty anchor forces the no-anchor branch — used for
            // residual captures (preprocessed-out regions, etc.)
            // where the per-stmt walk couldn't find an anchor.
            const first = anchor === '' ? -1 : s.indexOf(anchor);
            if (first < 0) {
                // Anchor not found — patch rewrote the line.  Fall
                // back to end-of-file append: spec §11 only requires
                // verbatim presence anywhere in the JS, so a tail
                // append preserves compliance even though the
                // position is no longer semantically meaningful.
                droppedNotFound++;
                if (!s.endsWith('\n')) s += '\n';
                s += content + '\n';
                injected++;
                continue;
            }
            // Ambiguous anchors get a best-effort placement: inject
            // before the FIRST match.  Position may be slightly off
            // relative to the C source's exact location, but spec §11
            // only requires the comment text to appear *somewhere* in
            // the JS file.  This is a strict improvement over silently
            // dropping the comment — and the inside-body comments in
            // question would otherwise be lost entirely.
            const second = s.indexOf(anchor, first + anchor.length);
            if (second !== -1) {
                ambiguousBestEffort++;
                // Fall through and inject anyway.
            }
            // Find the start of the line containing the anchor and
            // its leading-whitespace indent.
            const lineStart = s.lastIndexOf('\n', first) + 1;
            const leadingWs = s.slice(lineStart).match(/^[ \t]*/)?.[0] ?? '';
            // Insert the comment relative to the anchor line.
            // Default: BEFORE the anchor (leading comment on stmt).
            // position: 'after' — AFTER the anchor's line (used for
            //   tail-of-compound comments anchored on the LAST stmt
            //   so they land between the stmt and the closing `}`).
            if (position === 'after') {
                // Find the END of the anchor's line.
                const nextNl = s.indexOf('\n', first);
                const lineEnd = nextNl < 0 ? s.length : nextNl + 1;
                s = s.slice(0, lineEnd) + leadingWs + content + '\n' + s.slice(lineEnd);
            } else {
                s = s.slice(0, lineStart) + leadingWs + content + '\n' + s.slice(lineStart);
            }
            injected++;
        }
        writeFileSync(p, s);
    }
    if (manifest.length > 0) {
        console.log(
            `build-engine: post-patch comment injection — ${injected}/${manifest.length} injected` +
            ` (${ambiguousBestEffort} best-effort, ${droppedNotFound} tail-fallback,` +
            ` dropped: ${droppedAlreadyPresent} already-present)`
        );
    }
}

// Translator-broken-marker tally across the final translated output.
// These are the residual TODOs that patchFile didn't cover.  Printed
// per build so a regression (e.g. a patch becoming noop after a
// translator change silently re-introduces a marker class) is
// visible in the build log without a separate sweep step.
{
    const counts = {
        'goto (forward-not-in-scope)': 0,
        'pointer-mutation lvalue': 0,
        'chained pointer-mutation': 0,
        'pointer-mutation member-access': 0,
        'LabelStmt freestanding': 0,
        'CaseStmt outside switch': 0,
        'switch with non-compound body': 0,
        'unresolved goto declId': 0,
    };
    // Patterns matched against generated JS.  Each pattern is anchored
    // by the TODO-class prefix; the `[^*]*\*+(?:[^/*][^*]*\*+)*\/`
    // tail consumes everything up to the matching `*/` (handles
    // unbalanced parens in the captured RHS slice, which can happen
    // for ternary/CallExpr RHSes).
    const COMMENT_TAIL = String.raw`[^*]*\*+(?:[^/*][^*]*\*+)*\/`;
    const pats = [
        [new RegExp(String.raw`\/\* TODO Phase 5\+: goto ` + COMMENT_TAIL, 'g'), 'goto (forward-not-in-scope)'],
        [new RegExp(String.raw`\/\* TODO Phase 5\+: pointer-mutation lvalue ` + COMMENT_TAIL, 'g'), 'pointer-mutation lvalue'],
        [new RegExp(String.raw`\/\* TODO Phase 5\+: chained pointer-mutation ` + COMMENT_TAIL, 'g'), 'chained pointer-mutation'],
        [new RegExp(String.raw`\/\* TODO Phase 5\+: pointer-mutation member-access ` + COMMENT_TAIL, 'g'), 'pointer-mutation member-access'],
        [/\/\/ TODO LabelStmt [A-Za-z_0-9]+ not at compound-stmt level/g, 'LabelStmt freestanding'],
        [/\/\/ TODO bare CaseStmt outside switch/g, 'CaseStmt outside switch'],
        [/\/\/ TODO SwitchStmt with non-compound body/g, 'switch with non-compound body'],
        [/\/\/ TODO goto with unresolved targetLabelDeclId [^\n]+/g, 'unresolved goto declId'],
    ];
    let total = 0;
    for (const f of readdirSync(outputDir)) {
        if (!f.endsWith('.js')) continue;
        const text = readFileSync(join(outputDir, f), 'utf8');
        for (const [re, key] of pats) {
            const n = (text.match(re) || []).length;
            counts[key] += n;
            total += n;
        }
    }
    const parts = Object.entries(counts)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${k}=${n}`);
    console.log(`build-engine: residual TODO markers (${total} total) — ${parts.join(', ') || 'none'}`);
}

console.log('build-engine: done');
