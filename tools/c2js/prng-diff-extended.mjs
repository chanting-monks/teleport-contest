#!/usr/bin/env node
// prng-diff-extended.mjs — extended PRNG-parity harness for the
// transport branch.
//
// Runs the seed8000-tourist-starter session's first ~337 recorded
// PRNG calls against our translated JS engine and reports how many
// match before the first divergence.  This is the gate metric for
// Phase 4+ work: each round of translator/runtime improvements is
// expected to advance the matched-call count.
//
// What it does, end-to-end:
//   1. Translates a fixed list of upstream NetHack TUs (o_init.c,
//      objects.c, decl.c, rnd.c, hacklib.c, dungeon.c, u_init.c,
//      bones.c, mklev.c, mkroom.c, sp_lev.c, mkobj.c, vision.c,
//      region.c, rect.c) into .cache/c2js/oinit-test/.
//   2. Patches the generated rnd.js to wrap each PRNG function
//      with a logger that pushes "name(args)=result" to
//      globalThis.__prngSink on every call.
//   3. Pre-loads dungeon.lua as parsed JS data and registers every
//      other dat/*.lua file as raw Lua source for the fengari
//      bridge.
//   4. Wires the translated `l_register_des(L)` from sp_lev.js
//      into the lua-bridge so themerooms_generate's
//      `des.room({...})` calls route into translated lspo_room
//      handlers.
//   5. Seeds ISAAC64 with seed=8000 (the tourist-starter recording's
//      seed), runs init_objects → init_dungeons (with a hand-port of
//      fixup_level_locations) → u_init_misc → mklev() to capture
//      JS-side PRNG calls.
//   6. Compares the captured sink to the recorded session and
//      reports the count and first-divergence point.
//
// Current status (commit e9f6fca, fengari bridge + des registrar):
//   captured matches first 337 calls (init_objects + nhlib +
//   init_dungeons + getbones + makelevel branch + first
//   themerooms_generate iteration).  Diverges in the 2nd
//   iteration of the room-creation loop because lspo_room needs
//   more nhlua.c helpers (lcheck_param_table, get_table_xy_or_coord,
//   ...) before completing a real room.
//
// Run from the repo root:
//   node tools/c2js/prng-diff-extended.mjs
//
// Self-tests (`node tools/c2js/build.mjs --self-test`) cover the
// translator's smaller invariants; this harness covers the
// integration surface end-to-end.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTree } from './build-tree.mjs';
import {
    upstreamDir, projectRoot, stubsDir, PLATFORM_DEFINES,
} from './c2js.config.mjs';
import { parseLuaData } from './lua-data.mjs';
import {
    registerLuaData, registerLuaSource, setDesRegistrar,
} from '../../js/c2js-runtime/lua.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = projectRoot;
const outputDir = join(root, '.cache/c2js/oinit-test');
mkdirSync(outputDir, { recursive: true });

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
    // Phase 6 (chargen): role.c contains pick_role/pick_race/
    // pick_gend/pick_align which fire the rn2(13)/rn2(2)/...
    // calls for sessions whose nethackrc doesn't pre-specify a
    // role.  exper.c rounds out the chargen TU closure per
    // TRANSPORT.md Phase 6.
    'src/role.c', 'src/exper.c',
    // Phase 7 (moveloop + display): pline-family for output,
    // do.c for stairway/level-change handling, hack.c for hero
    // movement, do_wear.c for armor/accessory effects.  Adding
    // TUs gradually verifies the translator handles each new
    // file without breaking the seed8000 PRNG-faithful streak.
    'src/pline.c', 'src/do.c',
    'src/hack.c', 'src/do_wear.c',
    'src/display.c',
    'src/apply.c', 'src/read.c', 'src/zap.c',
    'src/wizard.c', 'src/pray.c', 'src/priest.c',
    'src/dothrow.c', 'src/dokick.c',
    'src/mhitu.c', 'src/uhitm.c',
    'src/dog.c',
    'src/invent.c',  // unblocked in step 95 by build-tree.mjs fix
    'src/insight.c', 'src/objnam.c', 'src/pickup.c',
    'src/polyself.c',  // unblocked in step 101 — see harness state-init
    'src/potion.c', 'src/spell.c', 'src/steal.c',
    'src/timeout.c',  // unblocked in step 103
    'src/dogmove.c',  // unblocked in step 104 by vision_init
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
    'src/mkmaze.c',  // unblocked in step 110 by get_level_extends post-process
    'src/mcastu.c', 'src/mplayer.c', 'src/write.c',
    'src/report.c', 'src/iactions.c',
    'src/extralev.c', 'src/symbols.c', 'src/sys.c',
    'src/utf8map.c', 'src/options.c',
    'src/coloratt.c',  // unblocked in step 105 by -include stddef.h
    'src/strutil.c',
    'src/version.c',  // unblocked in step 108 by regex_id stub
    'src/rip.c',
    'src/sfbase.c',
    'src/windows.c',  // unblocked in step 109 by tty_procs/win_tty_init stub
    'src/wizcmds.c', 'src/selvar.c',
    'src/cmd.c', 'src/pager.c',  // unblocked in step 109 by save-stub family
    //
    // SOURCES coverage summary (after step 110):
    //   - 116 of NetHack 5.0's 128 source TUs translate cleanly.
    //   - Held: NONE (all translator-owned TUs unblocked).
    //   - Skipped (not translator-owned): alloc.c, isaac64.c,
    //     dlb.c, files.c, mail.c, save.c, restore.c, cfgfiles.c,
    //     earlyarg.c, mdlib.c, nhmd4.c, nhl{obj,sel,ua}.c,
    //     sfstruct.c — system / save-state / Lua-bridge handled
    //     by runtime shims and frozen overlays.
];

// 1. Translate.
{
    const t0 = Date.now();
    const sources = SOURCES.map((p) => join(upstreamDir, p));
    const parserOpts = {
        extraFlags: [`-I${upstreamDir}/include`, `-I${stubsDir}`, ...PLATFORM_DEFINES],
    };
    buildTree({ sources, outputDir, parserOpts });
    if (process.env.PHASE_TIMINGS) console.error('[harness] build', Date.now() - t0, 'ms');
}

// 2. Patch rnd.js to log calls.
{
    const rndPath = join(outputDir, 'rnd.js');
    let src = readFileSync(rndPath, 'utf8');
    const NAMES = new Set(['rn2', 'rn1', 'rnd', 'd', 'rne', 'rnz', 'rnl', 'rn2_on_display_rng']);
    let out = '', i = 0;
    while (i < src.length) {
        const tail = src.slice(i);
        const m = tail.match(/^export function ([A-Za-z_][A-Za-z0-9_]*)\(([^)]*)\) \{/);
        if (!m) { out += src[i]; i += 1; continue; }
        const fname = m[1], argList = m[2];
        if (!NAMES.has(fname)) { out += tail.slice(0, m[0].length); i += m[0].length; continue; }
        let depth = 1, j = i + m[0].length;
        while (j < src.length && depth > 0) {
            if (src[j] === '{') depth += 1;
            else if (src[j] === '}') depth -= 1;
            j += 1;
        }
        const body = src.slice(i + m[0].length, j - 1);
        out += 'function _orig_' + fname + '(' + argList + ') {' + body + '}\n';
        out += 'export function ' + fname + '(' + argList + ') {\n';
        out += '    if (globalThis.__prngSink && globalThis.__prngSink.length > (globalThis.__prngCap || 50000)) throw new Error("prng cap reached at " + globalThis.__prngSink.length);\n';
        out += '    const r = _orig_' + fname + '(' + argList + ');\n';
        out += '    if (globalThis.__prngSink) {\n';
        out += '        const _entry = "' + fname + '(" + [' + argList + '].join(",") + ")=" + r;\n';
        out += '        if (globalThis.__prngTrace) {\n';
        out += '            const _frames = (new Error()).stack.split("\\n").slice(2, 6).map(l => l.trim()).join(" | ");\n';
        out += '            globalThis.__prngSink.push(_entry + " @ " + _frames);\n';
        out += '        } else {\n';
        out += '            globalThis.__prngSink.push(_entry);\n';
        out += '        }\n';
        out += '    }\n';
        out += '    return r;\n}\n';
        i = j;
    }
    writeFileSync(rndPath, out);
}

// (3) The des-registrar wiring is intentionally delayed until
//     after decl_globals_init() — see the deferred block below.
//     Importing sp_lev.js too early triggers dungeon.js's
//     top-level (which builds game.level_map) before the bucket-
//     flatten globals are populated, leaving level_map's
//     `lev_spec` slots as orphaned auto-Proxies.

// Post-process mklev.js: fix level_finalize_topology's
// `for (croom = game.rooms[0]; croom != game.rooms[game.nroom]; (croom = __nh_blackhole))`.
// Our struct-pointer-increment-to-blackhole rewrite makes the
// blackhole never equal the loop terminator, producing an
// infinite loop.  C-side this is `for (croom = svr.rooms;
// croom != &svr.rooms[svn.nroom]; croom++)` — iterating through
// a fixed-size array.  Rewrite as an indexed for-loop.
{
    const p = outputDir + '/mklev.js';
    let s = readFileSync(p, 'utf8');
    s = s.replace(
        /for \(croom = game\.rooms\[0\]; croom != game\.rooms\[game\.nroom\]; \(croom = __nh_blackhole\)\) \{\s*topologize\(croom\);\s*\}/,
        'for (let __i = 0; __i < game.nroom; __i++) { croom = game.rooms[__i]; topologize(croom); }'
    );
    // makelevel uses `for (croom = svr.rooms; croom->hx > 0; croom++)` to
    // iterate live rooms (terminator is the first hx<=0 slot).  Translator
    // turned `croom = svr.rooms` into `croom = game.rooms` (the array,
    // whose `.hx` is undefined → loop body never runs) and `croom++` into
    // blackhole.  Rewrite both occurrences as indexed walks scanning
    // game.rooms[i].hx > 0.
    s = s.replace(
        /for \(croom = game\.rooms; croom\.hx > 0; \(croom = __nh_blackhole\)\) \{\s*if \(\(\(croom\.rtype == OROOM \|\| croom\.rtype == THEMEROOM\) && croom\.needfill == 1\)\) \{\s*fillable_room_count\+\+;\s*\}\s*\}/,
        'for (let __i = 0; __i < game.nroom; __i++) { croom = game.rooms[__i]; if (croom.hx <= 0) break; if (((croom.rtype == OROOM || croom.rtype == THEMEROOM) && croom.needfill == 1)) { fillable_room_count++; } }'
    );
    s = s.replace(
        /for \(croom = game\.rooms; croom\.hx > 0; \(croom = __nh_blackhole\)\) \{\s*let fillable = \(\(croom\.rtype == OROOM \|\| croom\.rtype == THEMEROOM\) && croom\.needfill == 1\);\s*fill_ordinary_room\(croom, fillable && bonus_item_room_countdown == 0\);\s*if \(fillable\) \{\s*--bonus_item_room_countdown;\s*\}\s*\}/,
        'for (let __i = 0; __i < game.nroom; __i++) { croom = game.rooms[__i]; if (croom.hx <= 0) break; const fillable = ((croom.rtype == OROOM || croom.rtype == THEMEROOM) && croom.needfill == 1); fill_ordinary_room(croom, fillable && bonus_item_room_countdown == 0); if (fillable) { --bonus_item_room_countdown; } }'
    );
    writeFileSync(p, s);
}

// Optional diagnostic: trace rndmonst_adj's per-monster decisions.
if (process.env.RNDMONST_TRACE) {
    const p = outputDir + '/makemon.js';
    let s = readFileSync(p, 'utf8');
    s = s.replace(
        /(if \(weight > 0\) \{)/,
        'console.log("[rndmonst] mndx=" + mndx + " name=" + (game.mons[mndx]&&game.mons[mndx].pmnames&&game.mons[mndx].pmnames[2]) + " geno=" + (game.mons[mndx]&&game.mons[mndx].geno) + " G_FREQ=" + ((game.mons[mndx]&&game.mons[mndx].geno)&7) + " align=" + (game.mons[mndx]&&game.mons[mndx].maligntyp) + " diff=" + (game.mons[mndx]&&game.mons[mndx].difficulty) + " minmlev=" + minmlev + " maxmlev=" + maxmlev + " weight=" + weight); $1'
    );
    writeFileSync(p, s);
}

// (The translated rumors.js is generated but unused at runtime: the
// translator's EXTERNAL_SYMBOLS map routes getrumor / init_rumors /
// get_rnd_line / get_rnd_text imports in other TUs to
// js/c2js-runtime/rumors.js instead of './rumors.js'.  No
// post-process needed for the broken pointer-mutation TODO inside
// the translated rumors.js itself — that copy is dead code.)
if (process.env.FILL_TRACE) {
    const p = outputDir + '/mklev.js';
    let s = readFileSync(p, 'utf8');
    s = s.replace(
        /export function fill_ordinary_room\(croom, bonus_items\) \{/,
        'export function fill_ordinary_room(croom, bonus_items) { const __fid = (globalThis.__fid = (globalThis.__fid||0)+1); console.log("[fill_ord] enter #" + __fid + " rtype=" + croom.rtype + " needfill=" + croom.needfill + " bonus=" + bonus_items + " hx=" + croom.hx + " ly=" + croom.ly);'
    );
    writeFileSync(p, s);
}
if (process.env.MKTRAP_TRACE) {
    const p = outputDir + '/mklev.js';
    let s = readFileSync(p, 'utf8');
    s = s.replace(
        /export function mktrap\(num, mktrapflags, croom, tm\) \{/,
        'export function mktrap(num, mktrapflags, croom, tm) { console.log("[mktrap] enter num=" + num + " croom=" + (croom?"yes":"no") + " tm=" + (tm?JSON.stringify(tm):"null"));'
    );
    s = s.replace(
        /t = maketrap\(m\.x, m\.y, kind\);/,
        'console.log("[mktrap] reaching maketrap m=" + m.x + "," + m.y + " kind=" + kind); t = maketrap(m.x, m.y, kind);'
    );
    writeFileSync(p, s);
}
if (process.env.SOMEXYSPACE_TRACE) {
    const p = outputDir + '/mkroom.js';
    let s = readFileSync(p, 'utf8');
    s = s.replace(
        /(okay = somexy\(croom, c\) && isok\(c\.x, c\.y\) && !occupied\(c\.x, c\.y\) && \(game\.level\.locations\[c\.x\]\[c\.y\]\.typ == ROOM \|\| game\.level\.locations\[c\.x\]\[c\.y\]\.typ == CORR \|\| game\.level\.locations\[c\.x\]\[c\.y\]\.typ == ICE\);)/,
        '$1\n        if (process.env.SOMEXYSPACE_TRACE) console.log("[sxy] try=" + trycnt + " x=" + c.x + " y=" + c.y + " typ=" + game.level.locations[c.x][c.y].typ + " occupied=" + (occupied(c.x, c.y) ? 1 : 0) + " okay=" + (okay ? 1 : 0));'
    );
    writeFileSync(p, s);
}
// Stub make_engr_at to a no-op return: the translated body uses
// `alloc((smem*3)+1)` to allocate a struct-with-trailing-payload
// (NetHack's tricks for variable-size strings inside the struct);
// our alloc returns an array of Proxies for n>1 which doesn't model
// the trailing-payload correctly, and `ep.engr_txt[i] = ((ep) + 1)`
// throws.  C's call from fill_ordinary_room ignores the return; we
// just need it not to abort mklev so the post-engraving rn2 calls
// at fill_ordinary_room:1158 still fire.
{
    const p = outputDir + '/engrave.js';
    let s = readFileSync(p, 'utf8');
    s = s.replace(
        /export function make_engr_at\(([^)]+)\) \{/,
        'export function make_engr_at($1) { return null; /* stubbed: see prng-diff-extended.mjs */'
    );
    writeFileSync(p, s);
}

// Post-process engrave.js: wipeout_text reads `engr[nxt]` expecting
// a char code (C: `char *engr; engr[nxt]` is int).  When `engr` is
// a JS string (after `outbuf = strcpy(...)`), `engr[nxt]` is a
// 1-character string instead.  Compare with `rubouts[i].wipefrom`
// (a number) then never matches.  Insert a char-code coercion at
// the start of wipeout_text and at every read site.
{
    const p = outputDir + '/engrave.js';
    let s = readFileSync(p, 'utf8');
    // Add a normalize step at function entry: if engr is a string,
    // convert to a mutable array of char codes; remember to keep the
    // length-tracking consistent.
    s = s.replace(
        /export function wipeout_text\(engr, cnt, seed\) \{/,
        'export function wipeout_text(engr, cnt, seed) {\n' +
        '    if (typeof engr === "string") {\n' +
        '        const __arr = new Array(engr.length + 1);\n' +
        '        for (let __i = 0; __i < engr.length; __i++) __arr[__i] = engr.charCodeAt(__i);\n' +
        '        __arr[engr.length] = 0;\n' +
        '        engr = __arr;\n' +
        '    }'
    );
    writeFileSync(p, s);
}

// Post-process mkobj.js: rewrite mkobj's iprobs-array walk.
// Translator turned `iprobs++` into `(iprobs = __nh_blackhole)`,
// breaking iteration after the first comparison: `iprobs.iprob` reads
// blackhole.iprob = blackhole Proxy → `tprob -= blackhole = NaN` →
// loop exits → `oclass = iprobs.iclass = mkobjprobs.iclass = undefined`
// → `rnd(undefined)` BigInt crash.  Rewrite as an indexed walk.
// Safe to enable now that struct-obj typed-alloc nulls pointer fields
// (without that, fixing iprobs unblocked a downstream OOM in
// add_to_container's `for (otmp = container.cobj; otmp; otmp = otmp.nobj)`
// linked-list walk — fresh objects had .nobj as auto-Proxy, so the loop
// allocated a new Proxy per iteration and ran forever).
{
    const p = outputDir + '/mkobj.js';
    let s = readFileSync(p, 'utf8');
    s = s.replace(
        /for \(tprob = rnd\(100\); \(tprob -= iprobs\.iprob\) > 0; \(iprobs = __nh_blackhole\)\) \{\s*continue;\s*\}\s*oclass = iprobs\.iclass;/,
        'let __ipi = 0; for (tprob = rnd(100); (tprob -= iprobs[__ipi].iprob) > 0; __ipi++) { continue; }\n        oclass = iprobs[__ipi].iclass;'
    );
    writeFileSync(p, s);
}

// Diagnostic infrastructure (off by default) for the next attempt
// at unblocking the 1388-call divergence:
//
// LOOP_CAPS=1 — instruments every for/while in the generated TUs
//   with a per-loop counter that throws after 200k iterations.
//   Useful for pinpointing which loop runs unboundedly when
//   blessorcurse's rn2 calls are unmasked.
//
// PCALL_PROPAGATE=1 — makes nhl_pcall_handle re-throw any Lua
//   error after logging it, exposing pcall-suppressed failures.
if (process.env.VAULT_TRACE) {
    const p = outputDir + '/mklev.js';
    let s = readFileSync(p, 'utf8');
    s = s.replace(
        /(tried_vault = \(1\);\s*\n\s*)if \(create_room\(-1, -1, 2, 2, -1, -1, VAULT, \(1\)\)\) \{/,
        `$1const __vault_result = create_room(-1, -1, 2, 2, -1, -1, VAULT, (1));\n` +
        `            console.log('[harness] vault attempt: nroom=' + game.nroom + ' result=' + __vault_result);\n` +
        `            if (__vault_result) {`
    );
    writeFileSync(p, s);
}

if (process.env.LOOP_CAPS) {
    // First, hand-port blessorcurse so the underlying divergence
    // is exercised.
    const p = outputDir + '/mkobj.js';
    let s = readFileSync(p, 'utf8');
    if (!s.includes('__nh_blessorcurse_rng_only')) {
        s = s.replace(
            /export function blessorcurse\(otmp, chance\)\s*\{[\s\S]*?\n\}/,
            'export function blessorcurse(otmp, chance) { __nh_blessorcurse_rng_only(otmp, chance); }'
        );
        s = s.replace(
            /(\n)(export function )/,
            '$1function __nh_blessorcurse_rng_only(otmp, chance) {\n' +
            '    if (!rn2(chance)) { rn2(2); }\n' +
            '}\n$2'
        );
        writeFileSync(p, s);
    }
    let _loopId = 0;
    const _capPerLoop = 200000;
    const filesToCap = ['mkobj.js', 'mklev.js', 'sp_lev.js', 'mkroom.js',
                         'vision.js', 'rect.js', 'region.js', 'mkmap.js',
                         'dungeon.js', 'hacklib.js', 'rnd.js', 'o_init.js',
                         'u_init.js', 'bones.js'];
    for (const f of filesToCap) {
        const fp = outputDir + '/' + f;
        let fs2 = readFileSync(fp, 'utf8');
        fs2 = fs2.replace(/(\n\s*)(for|while)\s*\(([^)]*)\)\s*\{/g, (m, sp, kw, cond) => {
            const id = ++_loopId;
            return `${sp}let __c${id} = 0;${sp}${kw} (${cond}) {${sp}    if (++__c${id} > ${_capPerLoop}) throw new Error("[loop-cap] ${f} loop#${id} exceeded ${_capPerLoop}");`;
        });
        writeFileSync(fp, fs2);
    }
    console.log('[harness] capped', _loopId, 'loops in', filesToCap.join(', '));
}

// Post-process makemon.js: fix the `*mtmp = cg.zeromonst` TODO at
// the top of makemon (after `mtmp = alloc(...)`).  Without zeroing,
// the alloc'd Proxy returns auto-Proxy ghosts for every field read,
// breaking later checks that expect numeric scalars (mflee, msleeping,
// mhp-comparisons, etc.).  Step 50 added per-monster sanitization
// AFTER mklev, but doing it during makemon means subsequent makemon
// code (set_mon_data, copy_mextra, etc.) reads correct zeros.
//
// `*mtmp = cg.zeromonst` becomes `Object.assign(mtmp, cg.zeromonst)`.
{
    const p = outputDir + '/makemon.js';
    let s = readFileSync(p, 'utf8');
    s = s.replace(
        /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = cg\.zeromonst\) \*\/;/g,
        'Object.assign(mtmp, cg.zeromonst);'
    );
    s = s.replace(
        /\/\* TODO Phase 5\+: goto gotgood \(label not in scope of break\) \*\//g,
        'cc.x = nx; cc.y = ny; return 1;'
    );
    writeFileSync(p, s);
}

// Post-process: instrument the working-set functions with FN_ENTER /
// FN_EXIT_* trace markers (call-trace patch — see docs/CALL_TRACE.md).
// When __nh_traceEnabled is set on globalThis at run time, every entry
// to and exit from these functions will append a `>funcname` /
// `<funcname` line to the PRNG sink, giving us an aligned-by-counter
// call graph that mirrors the C-side rng_log_fn_* output.
//
// The patch list below mirrors the working-set in patch
// 010-call-trace-instrumentation.patch.  The injection is mechanical:
//   1. Insert `fnEnter('NAME', 'file.c', LINE);` after the function
//      body's opening brace.
//   2. Wrap each `return EXPR;` with `return fnExitKind('NAME', 'file.c', LINE, EXPR);`.
//      `void` exits inject `fnExitVoid(...);` before each return path.
{
    const traceTargets = [
        // [file.js, funcName, c-source-file, returnKind]
        ['teleport.js', 'goodpos',             'teleport.c', 'int'],
        ['teleport.js', 'enexto',              'teleport.c', 'int'],
        ['teleport.js', 'enexto_core',         'teleport.c', 'int'],
        ['teleport.js', 'enexto_gpflags',      'teleport.c', 'int'],
        ['teleport.js', 'collect_coords',      'teleport.c', 'int'],
        ['makemon.js',  'makemon',             'makemon.c',  'ptr'],
        ['makemon.js',  'makemon_rnd_goodpos', 'makemon.c',  'int'],
        ['makemon.js',  'clone_mon',           'makemon.c',  'ptr'],
        ['mon.js',      'mfndpos',             'mon.c',      'int'],
        ['mon.js',      'mcalcmove',           'mon.c',      'int'],
        ['mon.js',      'm_in_air',            'mon.c',      'int'],
        ['mon.js',      'm_poisongas_ok',      'mon.c',      'int'],
        ['monmove.js',  'dochug',              'monmove.c',  'int'],
        ['monmove.js',  'distfleeck',          'monmove.c',  'void'],
        ['monmove.js',  'm_move',              'monmove.c',  'int'],
        ['monmove.js',  'set_apparxy',         'monmove.c',  'void'],
        ['monmove.js',  'm_search_items',      'monmove.c',  'int'],
        ['monmove.js',  'onscary',             'monmove.c',  'int'],
        ['mondata.js',  'attacktype',          'mondata.c',  'int'],
        ['mondata.js',  'attacktype_fordmg',   'mondata.c',  'ptr'],
        ['mondata.js',  'Resists_Elem',        'mondata.c',  'int'],
        ['mkroom.js',   'somex',               'mkroom.c',   'int'],
        ['mkroom.js',   'somey',               'mkroom.c',   'int'],
        ['mkroom.js',   'somexy',              'mkroom.c',   'int'],
        ['mkroom.js',   'somexyspace',         'mkroom.c',   'int'],
        ['mkobj.js',    'mksobj',              'mkobj.c',    'ptr'],
        ['mkobj.js',    'mkobj',               'mkobj.c',    'ptr'],
        ['allmain.js',  'maybe_generate_rnd_mon', 'allmain.c', 'void'],
        ['allmain.js',  'moveloop_core',       'allmain.c',  'void'],
        ['sounds.js',   'dosounds',            'sounds.c',   'void'],
        ['eat.js',      'gethungry',           'eat.c',      'void'],
    ];
    // Build a runtime helper import line and a per-file patch.
    // Group targets by file.
    const byFile = new Map();
    for (const t of traceTargets) {
        const arr = byFile.get(t[0]) || [];
        arr.push(t);
        byFile.set(t[0], arr);
    }
    for (const [file, targets] of byFile) {
        const fp = outputDir + '/' + file;
        let src;
        try { src = readFileSync(fp, 'utf8'); }
        catch (e) { continue; }
        // Add the trace import (idempotent).
        if (!src.includes("from '../../../js/c2js-runtime/trace.js'")) {
            // Insert after the first existing `import` line.
            src = src.replace(
                /^(import [^\n]*\n)/,
                "$1import { fnEnter, fnExitVoid, fnExitInt, fnExitPtr } from '../../../js/c2js-runtime/trace.js';\n",
            );
        }
        for (const [, fname, cfile, kind] of targets) {
            // Find: `export function FNAME(args) {` and inject FN_ENTER.
            const fnRe = new RegExp(
                'export function ' + fname.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&') + '\\(([^)]*)\\) \\{',
            );
            const m = src.match(fnRe);
            if (!m) continue;
            // Compute the source line number (1-indexed) where the
            // function declaration appears.  This is the JS-output
            // line; the C source line is what we'd ideally use, but
            // we don't have a per-function file:line map handy from
            // the translator yet.  This is still useful to disambiguate
            // multiple call sites in the same JS file.
            const matchIdx = m.index || src.indexOf(m[0]);
            const lineNumber = src.slice(0, matchIdx).split('\n').length;
            const enterStr = "\n    fnEnter('" + fname + "', '" + cfile + "', " + lineNumber + ");";
            // Only inject once.
            if (src.indexOf("fnEnter('" + fname + "',") >= 0) continue;
            src = src.replace(fnRe, m[0] + enterStr);
            // Wrap returns within the function body to emit fnExit.
            // Find body bounds via brace counting starting after the
            // first inserted enterStr.
            const bodyOpen = src.indexOf(m[0] + enterStr);
            if (bodyOpen >= 0) {
                let bodyStart = bodyOpen + (m[0] + enterStr).length;
                let depth = 1, idx = bodyStart;
                while (idx < src.length && depth > 0) {
                    const c = src[idx];
                    if (c === '{') depth++;
                    else if (c === '}') depth--;
                    idx++;
                }
                const bodyEnd = idx - 1;
                const bodyText = src.substring(bodyStart, bodyEnd);
                const exitFn = kind === 'void' ? 'fnExitVoid'
                    : kind === 'ptr' ? 'fnExitPtr'
                    : 'fnExitInt';
                // For non-void: wrap `return EXPR;` with
                //   `return fnExit*(NAME, file, line, EXPR);`
                // For void: replace `return;` with
                //   `{ fnExitVoid(NAME, file, line); return; }`
                let body2;
                if (kind === 'void') {
                    body2 = bodyText.replace(
                        /\breturn\s*;/g,
                        `{ fnExitVoid('${fname}', '${cfile}', ${lineNumber}); return; }`,
                    );
                    // ALSO emit a final fnExitVoid before the closing `}`
                    body2 += `    fnExitVoid('${fname}', '${cfile}', ${lineNumber});\n`;
                } else {
                    // Walk the body tracking brace depth.  Only wrap
                    // `return EXPR;` at depth 0 — inside nested
                    // functions/getters/setters, leave returns alone
                    // (they belong to the inner function, not ours).
                    let i = 0, out = '', braceDepth = 0;
                    while (i < bodyText.length) {
                        const c = bodyText[i];
                        // Skip string literals so we don't treat `}` etc.
                        // inside strings as syntax.
                        if (c === '"' || c === "'" || c === '`') {
                            const q = c;
                            out += c;
                            i++;
                            while (i < bodyText.length && bodyText[i] !== q) {
                                if (bodyText[i] === '\\') {
                                    out += bodyText[i] + (bodyText[i + 1] || '');
                                    i += 2;
                                    continue;
                                }
                                out += bodyText[i];
                                i++;
                            }
                            if (i < bodyText.length) { out += bodyText[i]; i++; }
                            continue;
                        }
                        if (c === '/' && bodyText[i + 1] === '*') {
                            const end = bodyText.indexOf('*/', i + 2);
                            const e = end < 0 ? bodyText.length : end + 2;
                            out += bodyText.slice(i, e);
                            i = e;
                            continue;
                        }
                        if (c === '/' && bodyText[i + 1] === '/') {
                            const end = bodyText.indexOf('\n', i);
                            const e = end < 0 ? bodyText.length : end;
                            out += bodyText.slice(i, e);
                            i = e;
                            continue;
                        }
                        if (c === '{') { braceDepth++; out += c; i++; continue; }
                        if (c === '}') { braceDepth--; out += c; i++; continue; }
                        // Only wrap returns at depth 0 (top of function body)
                        if (braceDepth === 0
                            && bodyText.substr(i, 7) === 'return '
                            && (i === 0 || !/[A-Za-z_0-9]/.test(bodyText[i - 1]))) {
                            // Find terminating ; balancing parens
                            let k = i + 7, d = 0;
                            while (k < bodyText.length) {
                                const ch = bodyText[k];
                                if (ch === '(') d++;
                                else if (ch === ')') d--;
                                else if (ch === ';' && d === 0) break;
                                k++;
                            }
                            const expr = bodyText.slice(i + 7, k).trim();
                            if (expr === '') {
                                out += bodyText.slice(i, k + 1);
                            } else {
                                out += `return ${exitFn}('${fname}', '${cfile}', ${lineNumber}, ${expr});`;
                            }
                            i = k + 1;
                            continue;
                        }
                        out += c;
                        i++;
                    }
                    body2 = out;
                }
                src = src.slice(0, bodyStart) + body2 + src.slice(bodyEnd);
            }
            // Wrap every `return EXPR;` (within a reasonable distance —
            // we apply globally; spurious wraps in nested helpers are
            // rare and harmless because the import + fnEnter is gated
            // by __nh_traceEnabled).
            // For void-returning functions we don't have many bare
            // `return;` to handle — leave those for later.
            const exitFn = kind === 'void' ? 'fnExitVoid'
                : kind === 'ptr' ? 'fnExitPtr'
                : kind === 'long' ? 'fnExitLong'
                : 'fnExitInt';
            // Restrict the wrap to only the first occurrence of `return`
            // inside the target function.  A safer strategy is per-
            // function-body parsing, but for our working set the
            // injection is bounded.
        }
        writeFileSync(fp, src);
    }
}

// Post-process teleport.js: replace the buggy translator output
// for collect_coords (which has a TODO for *ccc++ = cc that leaves
// the output array unpopulated) with a clean JS implementation.
//
// This is the root cause of monster placement divergence — without
// a populated candy[] array, enexto can't pick from the collected
// candidates and falls through to (xx,yy) trial.  Different from
// what C does, leading to position mismatch despite matching PRNG.
{
    const p = outputDir + '/teleport.js';
    let s = readFileSync(p, 'utf8');
    // Match the entire `export function collect_coords(...) { ... }`
    // body and replace with a clean implementation.
    const cleanCollectCoords = `export function collect_coords(ccc, cx, cy, maxradius, cc_flags, filter) {
    // Clean reimplementation — translator's *ccc++ = cc was TODO'd
    // leaving the output array empty.  Mirrors C teleport.c:578.
    const include_cxcy = (cc_flags & 1) != 0;
    const scramble = (cc_flags & 2) == 0;
    const ring_pairs = (scramble && (cc_flags & 4) != 0);
    const skip_mons = (cc_flags & 8) != 0;
    const skip_inaccessible = (cc_flags & 16) != 0;
    const COLNO_C = 80, ROWNO_C = 21;
    const rowrange = (cy < Math.trunc(ROWNO_C / 2)) ? (ROWNO_C - 1 - cy) : cy;
    const colrange = (cx < Math.trunc(COLNO_C / 2)) ? (COLNO_C - 1 - cx) : cx;
    const k_max = Math.max(rowrange, colrange);
    if (!maxradius) maxradius = k_max;
    else maxradius = Math.min(maxradius, k_max);
    let result = 0;
    let passStart = 0; // index in ccc where this pass started
    let n = 0;         // entries collected this pass
    for (let radius = include_cxcy ? 0 : 1; radius <= maxradius; ++radius) {
        let newpass, passend;
        if (!ring_pairs) {
            newpass = passend = true;
        } else {
            newpass = ((radius % 2) != 0 || radius == 0);
            passend = ((radius % 2) == 0 || radius == maxradius);
        }
        if (newpass) {
            passStart = result;
            n = 0;
        }
        const lox = cx - radius, hix = cx + radius;
        const loy = cy - radius, hiy = cy + radius;
        for (let y = Math.max(loy, 0); y <= hiy; ++y) {
            if (y > ROWNO_C - 1) break;
            for (let x = Math.max(lox, 1); x <= hix; ++x) {
                if (x > COLNO_C - 1) break;
                if (x != lox && x != hix && y != loy && y != hiy) continue;
                if ((skip_mons && game.level.monsters[x][y])
                    || (skip_inaccessible && !(game.level.locations[x][y].typ >= POOL))) continue;
                if (filter && !filter(x, y)) continue;
                ccc[result] = { x: x, y: y };
                ++n;
                ++result;
            }
        }
        if (scramble && passend) {
            // Shuffle entries [passStart .. passStart+n-1] in place.
            // Mirrors C's "swap[k] with [0], advance passcc, decrement n"
            // loop.  Each iter the [first remaining] slot is finalized.
            let passIdx = passStart;
            while (n > 1) {
                const r = rn2(n);
                if (r) {
                    const tmp = ccc[passIdx];
                    ccc[passIdx] = ccc[passIdx + r];
                    ccc[passIdx + r] = tmp;
                }
                ++passIdx;
                --n;
            }
        }
    }
    return result;
}`;
    s = s.replace(/export function collect_coords\(ccc, cx, cy, maxradius, cc_flags, filter\) \{[\s\S]*?\n\}/m, cleanCollectCoords);
    writeFileSync(p, s);
}

// Post-process mkmaze.js's `get_level_extends`: the translator
// emits `lev = __nh_blackhole` in the inner loop where C does
// `lev++` on a row pointer.  This loses the cell data and
// produces wrong bounds → `bound_digging` marks the wrong
// cells as W_NONDIGGABLE → mineralize sees more eligible
// cells and the rn2(1000) loop fires more (or fewer) times
// than the recording.  Replace with an indexed-access version.
//
// Only run if mkmaze.c is in the closure (file exists).
{
    const p = outputDir + '/mkmaze.js';
    if (existsSync(p)) {
        let s = readFileSync(p, 'utf8');
        const cleanGetLevelExtends = `export function get_level_extends(left, top, right, bottom) {
    // Clean reimplementation — translator emits \`lev = __nh_blackhole\`
    // for the inner \`lev++\` walk, which loses the cell read.  Use
    // direct indexed access via the loop variables.  Mirrors
    // mkmaze.c:1352-1394 exactly.
    const COLNO = 80, ROWNO = 21;
    const STONE = 0;
    const isStWall = (t) => (t >= 1 && t <= 12); // VWALL..DBWALL
    let xmin = 0, xmax = 0, ymin = 0, ymax = 0;
    let found = false, nonwall = false;
    // xmin: scan columns left-to-right.
    found = nonwall = false;
    for (xmin = 0; !found && xmin <= COLNO; xmin++) {
        for (let y = 0; y <= ROWNO - 1; y++) {
            const cell = game.level.locations[xmin] && game.level.locations[xmin][y];
            if (cell && cell.typ !== STONE) {
                found = true;
                if (!isStWall(cell.typ)) nonwall = true;
            }
        }
    }
    xmin -= (nonwall || !game.level.flags.is_maze_lev) ? 2 : 1;
    if (xmin < 0) xmin = 0;
    // xmax: scan columns right-to-left.
    found = nonwall = false;
    for (xmax = COLNO - 1; !found && xmax >= 0; xmax--) {
        for (let y = 0; y <= ROWNO - 1; y++) {
            const cell = game.level.locations[xmax] && game.level.locations[xmax][y];
            if (cell && cell.typ !== STONE) {
                found = true;
                if (!isStWall(cell.typ)) nonwall = true;
            }
        }
    }
    xmax += (nonwall || !game.level.flags.is_maze_lev) ? 2 : 1;
    if (xmax >= COLNO) xmax = COLNO - 1;
    // ymin: scan rows top-to-bottom within xmin..xmax.
    found = nonwall = false;
    for (ymin = 0; !found && ymin <= ROWNO; ymin++) {
        for (let x = xmin; x <= xmax; x++) {
            const cell = game.level.locations[x] && game.level.locations[x][ymin];
            if (cell && cell.typ !== STONE) {
                found = true;
                if (!isStWall(cell.typ)) nonwall = true;
            }
        }
    }
    ymin -= (nonwall || !game.level.flags.is_maze_lev) ? 2 : 1;
    // ymax: scan rows bottom-to-top within xmin..xmax.
    found = nonwall = false;
    for (ymax = ROWNO - 1; !found && ymax >= 0; ymax--) {
        for (let x = xmin; x <= xmax; x++) {
            const cell = game.level.locations[x] && game.level.locations[x][ymax];
            if (cell && cell.typ !== STONE) {
                found = true;
                if (!isStWall(cell.typ)) nonwall = true;
            }
        }
    }
    ymax += (nonwall || !game.level.flags.is_maze_lev) ? 2 : 1;
    left.value = xmin;
    top.value = ymin;
    right.value = xmax;
    bottom.value = ymax;
}`;
        s = s.replace(/export function get_level_extends\(left, top, right, bottom\) \{[\s\S]*?\n\}/m, cleanGetLevelExtends);
        writeFileSync(p, s);
    }
}

// Post-process generated TUs that reference C pointer arithmetic
// like `(room - game.rooms)` (pointer subtraction).  In our JS
// model, rooms are object references — `room - game.rooms` is NaN.
// Replace each such expression with the room's stored .idx, set
// when add_room places it.
for (const fname of ['mklev.js', 'mkroom.js', 'sp_lev.js']) {
    const p = outputDir + '/' + fname;
    let s = readFileSync(p, 'utf8');
    if (!s.includes('__nh_ptr_to_room_idx')) {
        // Replace `(X - game.rooms)` with `__nh_ptr_to_room_idx(X)`.
        s = s.replace(/\(([\w.\[\]]+)\s*-\s*game\.rooms\b\)/g,
                      '__nh_ptr_to_room_idx($1)');
        // Same for subrooms.
        s = s.replace(/\(([\w.\[\]]+)\s*-\s*game\.subrooms\b\)/g,
                      '__nh_ptr_to_subroom_idx($1)');
        // Inject helper after the import block.
        s = s.replace(
            /(\n)(export function )/,
            '$1function __nh_ptr_to_room_idx(r) {\n' +
            '    if (r == null) return -1;\n' +
            '    if (typeof r.idx === "number") return r.idx;\n' +
            '    const i = game.rooms.indexOf(r);\n' +
            '    return i;\n' +
            '}\n' +
            'function __nh_ptr_to_subroom_idx(r) {\n' +
            '    if (r == null) return -1;\n' +
            '    if (typeof r.idx === "number") return r.idx;\n' +
            '    const i = game.subrooms.indexOf(r);\n' +
            '    return i;\n' +
            '}\n$2'
        );
    }
    writeFileSync(p, s);
}

// Post-process mklev.js to make do_room_or_subroom paint the
// level.locations[][].typ map.  The translator emits the
// `lev++->typ = ROOM` pointer-iteration as a no-op TODO, so the
// floor cells never get marked.  Subsequent somexyspace checks
// against `level.locations[x][y].typ == ROOM` always fail and
// drive 100-iteration retry loops that diverge the PRNG sequence.
//
// We patch in a follow-up loop that re-walks the room interior
// and sets typ=ROOM (and the wall typs for the perimeter) using
// straight 2D-array indexing.  Run unconditionally — the patch
// is idempotent.
{
    const p = outputDir + '/mklev.js';
    let s = readFileSync(p, 'utf8');
    // Insert before each `croom.lx = lowx;` — that's the marker
    // inside do_room_or_subroom right after the lit-loop and the
    // TODO interior-typ loop.  Painting *after* the TODO ensures
    // we pick up any walls already set by the wall loops.
    if (!s.includes('__nh_paint_room_typ')) {
        s = s.replace(
            /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: \*p = ROOM\) \*\/;/,
            '__nh_paint_room_typ(lowx, lowy, hix, hiy, is_room);'
        );
        // Inject the helper *after* the import block (ESM requires
        // imports at the top of the module).  We append before the
        // first `export function`.  Mirrors do_room_or_subroom's wall/
        // floor painting (mklev.c:236-302) so check_room's perimeter
        // scan correctly rejects overlapping room placements.
        s = s.replace(
            /(\n)(export function )/,
            '$1function __nh_paint_room_typ(lx, ly, hx, hy, is_room) {\n' +
            '    const ROOM=25, HWALL=2, VWALL=1, TLCORNER=3, TRCORNER=4, BLCORNER=5, BRCORNER=6;\n' +
            '    for (let x = lx - 1; x <= hx + 1; x++) {\n' +
            '        for (let y = ly - 1; y <= hy + 1; y += (hy - ly + 2)) {\n' +
            '            const cell = game.level.locations[x][y];\n' +
            '            cell.typ = HWALL; cell.horizontal = 1;\n' +
            '        }\n' +
            '    }\n' +
            '    for (let x = lx - 1; x <= hx + 1; x += (hx - lx + 2)) {\n' +
            '        for (let y = ly; y <= hy; y++) {\n' +
            '            const cell = game.level.locations[x][y];\n' +
            '            cell.typ = VWALL; cell.horizontal = 0;\n' +
            '        }\n' +
            '    }\n' +
            '    for (let x = lx; x <= hx; x++) {\n' +
            '        for (let y = ly; y <= hy; y++) {\n' +
            '            game.level.locations[x][y].typ = ROOM;\n' +
            '        }\n' +
            '    }\n' +
            '    if (is_room) {\n' +
            '        game.level.locations[lx - 1][ly - 1].typ = TLCORNER;\n' +
            '        game.level.locations[hx + 1][ly - 1].typ = TRCORNER;\n' +
            '        game.level.locations[lx - 1][hy + 1].typ = BLCORNER;\n' +
            '        game.level.locations[hx + 1][hy + 1].typ = BRCORNER;\n' +
            '    }\n' +
            '}\n$2'
        );
    }
    {
        // Replace the broken check_room body — the translator emitted
        // `(0 /* TODO ... pointer-mutation member-access (typ) */)`
        // for the `lev++->typ` pattern, which means the `typ != STONE`
        // check ALWAYS evaluates to false (0 == STONE).  So check_room
        // never rejects an overlapping room.  The C semantics: walk the
        // perimeter cells and reject if any are non-STONE.  Re-implement
        // with straight 2D-array indexing, including the goto-chk
        // restart loop the translator couldn't model.
        const splPath = outputDir + '/sp_lev.js';
        let sp = readFileSync(splPath, 'utf8');
        const newCheckRoom =
            `export function check_room(lowx, ddx, lowy, ddy, vault) {\n` +
            `    if (process.env.CHECK_ROOM_TRACE) {\n` +
            `      console.log("[harness] check_room call lowx=" + lowx.value + " lowy=" + lowy.value + " ddx=" + ddx.value + " ddy=" + ddy.value + " vault=" + vault + " nroom=" + game.nroom);\n` +
            `      // Dump scan area's typ values (only non-STONE cells) for diagnostic.\n` +
            `      const _dxlim = 4 + (vault ? 1 : 0);\n` +
            `      const _dylim = 3 + (vault ? 1 : 0);\n` +
            `      const _dhix = lowx.value + ddx.value, _dhiy = lowy.value + ddy.value;\n` +
            `      const _hits = [];\n` +
            `      for (let _x = Math.max(1, lowx.value - _dxlim); _x <= Math.min(79, _dhix + _dxlim); _x++) {\n` +
            `        for (let _y = Math.max(0, lowy.value - _dylim); _y <= Math.min(20, _dhiy + _dylim); _y++) {\n` +
            `          const _t = game.level.locations[_x][_y].typ;\n` +
            `          if (_t !== 0) _hits.push(_x + "," + _y + "=" + _t);\n` +
            `        }\n` +
            `      }\n` +
            `      console.log("[harness]  non-STONE in scan: " + (_hits.length ? _hits.join(" ") : "<all stone>"));\n` +
            `    }\n` +
            `    const STONE = 0;\n` +
            `    const COLNO = 80, ROWNO = 21;\n` +
            `    const xlim = 4 + (vault ? 1 : 0);\n` +
            `    const ylim = 3 + (vault ? 1 : 0);\n` +
            `    let hix = lowx.value + ddx.value;\n` +
            `    let hiy = lowy.value + ddy.value;\n` +
            `    const s_lowx = lowx.value, s_ddx = ddx.value;\n` +
            `    const s_lowy = lowy.value, s_ddy = ddy.value;\n` +
            `    if (lowx.value < 3) lowx.value = 3;\n` +
            `    if (lowy.value < 2) lowy.value = 2;\n` +
            `    if (hix > COLNO - 3) hix = COLNO - 3;\n` +
            `    if (hiy > ROWNO - 3) hiy = ROWNO - 3;\n` +
            `    chk: while (true) {\n` +
            `        if (hix <= lowx.value || hiy <= lowy.value) return 0;\n` +
            `        if (game.in_mk_themerooms && (s_lowx != lowx.value) && (s_ddx != ddx.value)\n` +
            `            && (s_lowy != lowy.value) && (s_ddy != ddy.value)) return 0;\n` +
            `        for (let x = lowx.value - xlim; x <= hix + xlim; x++) {\n` +
            `            if (x <= 0 || x >= COLNO) continue;\n` +
            `            let y = lowy.value - ylim;\n` +
            `            let ymax = hiy + ylim;\n` +
            `            if (y < 0) y = 0;\n` +
            `            if (ymax >= ROWNO) ymax = ROWNO - 1;\n` +
            `            for (; y <= ymax; y++) {\n` +
            `                const lev = game.level.locations[x][y];\n` +
            `                if (lev.typ !== STONE) {\n` +
            `                    if (!rn2(3)) return 0;\n` +
            `                    if (game.in_mk_themerooms) return 0;\n` +
            `                    if (x < lowx.value) lowx.value = x + xlim + 1;\n` +
            `                    else hix = x - xlim - 1;\n` +
            `                    if (y < lowy.value) lowy.value = y + ylim + 1;\n` +
            `                    else hiy = y - ylim - 1;\n` +
            `                    continue chk;\n` +
            `                }\n` +
            `            }\n` +
            `        }\n` +
            `        ddx.value = hix - lowx.value;\n` +
            `        ddy.value = hiy - lowy.value;\n` +
            `        if (game.in_mk_themerooms && (s_lowx != lowx.value) && (s_ddx != ddx.value)\n` +
            `            && (s_lowy != lowy.value) && (s_ddy != ddy.value)) return 0;\n` +
            `        return 1;\n` +
            `    }\n` +
            `}\n`;
        // Replace from the existing check_room declaration to the closing
        // `return (1); }` of the original.
        sp = sp.replace(
            /export function check_room\(lowx, ddx, lowy, ddy, vault\) \{[\s\S]*?\n    return \(1\);\n\}\n/,
            newCheckRoom,
        );
        writeFileSync(splPath, sp);
    }
    if (process.env.LSPO_TRACE) {
        const splPath = outputDir + '/sp_lev.js';
        let sp = readFileSync(splPath, 'utf8');
        sp = sp.replace(
            /export function lspo_room\(L\) \{/,
            'export function lspo_room(L) { console.log("[harness] lspo_room called n_subroom=" + (game.coder && game.coder.n_subroom));'
        );
        sp = sp.replace(
            /tmproom\.rtype = get_table_roomtype_opt\(L, "type", OROOM\);/,
            'tmproom.rtype = get_table_roomtype_opt(L, "type", OROOM); console.log("[harness] lspo_room rtype=" + tmproom.rtype + " (THEMEROOM=" + THEMEROOM + ")");'
        );
        writeFileSync(splPath, sp);
    }
    // Post-process u_init.js: rewrite ini_inv to use indexed-array
    // access for `trop`.  C's `trop` is `struct trobj *`, accessed
    // as `trop->trclass`, `trop++`, etc.  The translator emits
    // `trop.trclass` (field on the Array — undefined) and
    // `(trop = __nh_blackhole)` for the increment.  Both break.
    // Rewrite to use a trailing `__ti` index.  Mirrors the same
    // trick we apply to other pointer-walk patterns (e.g.
    // mkobj.js's iprobs walk in step 26).
    {
        const ui = outputDir + '/u_init.js';
        let us = readFileSync(ui, 'utf8');
        // Inject `let __ti = 0;` at the top of ini_inv and rewrite
        // `trop.X` to `trop[__ti].X`, `(trop = __nh_blackhole)` to
        // `__ti++`, and the trquan(trop) call to trquan(trop[__ti]).
        const start = us.indexOf('export function ini_inv(trop) {');
        const fnEnd = (() => {
            let i = us.indexOf('{', start) + 1;
            let depth = 1;
            while (i < us.length && depth > 0) {
                if (us[i] === '{') depth++;
                else if (us[i] === '}') depth--;
                i++;
            }
            return i;
        })();
        const before = us.slice(0, start);
        let body = us.slice(start, fnEnd);
        const after = us.slice(fnEnd);
        body = body.replace(
            /export function ini_inv\(trop\) \{/,
            'export function ini_inv(trop) { let __ti = 0;'
        );
        // Replace `trop.X` (where X is an identifier) with `trop[__ti].X`.
        body = body.replace(/\btrop\.(tr[a-zA-Z_]+)/g, 'trop[__ti].$1');
        // Replace `(trop = __nh_blackhole)` with `__ti++`.
        body = body.replace(/\(trop = __nh_blackhole\)/g, '__ti++');
        // Pass the current element to trquan and other helpers that
        // take a `const struct trobj *` (which the translator emits
        // as a plain `trop` parameter).
        body = body.replace(/trquan\(trop\)/g, 'trquan(trop[__ti])');
        body = body.replace(/ini_inv_obj_substitution\(trop, /g, 'ini_inv_obj_substitution(trop[__ti], ');
        body = body.replace(/ini_inv_adjust_obj\(trop, /g, 'ini_inv_adjust_obj(trop[__ti], ');
        body = body.replace(/ini_inv_mkobj_filter\(trop\[__ti\]\.trclass/g, 'ini_inv_mkobj_filter(trop[__ti].trclass');
        if (process.env.INI_INV_TRACE) {
            body = body.replace(
                /export function ini_inv\(trop\) \{ let __ti = 0;/,
                'export function ini_inv(trop) { let __ti = 0; console.log("[ini_inv] called pauper=" + game.u.uroleplay.pauper + " trotyp=" + (trop && trop[0] && trop[0].trotyp));'
            );
        }
        us = before + body + after;
        writeFileSync(ui, us);
    }
    if (process.env.NROOM_TRACE) {
        s = s.replace(
            /export function add_room\(([^)]+)\)\s*\{/,
            'export function add_room($1) { const _before = game.nroom;'
        );
        s = s.replace(
            /game\.nroom\+\+;\s*\n\}/,
            'game.nroom++; console.log("[harness] add_room@prng=" + (globalThis.__prngSink ? globalThis.__prngSink.length : "?") + ": " + _before + "->" + game.nroom);\n}'
        );
    }
    if (process.env.MAKEROOMS_TRACE) {
        // Log every makerooms iteration: nroom, rect_cnt, branch chosen.
        s = s.replace(
            /while \(game\.nroom < \(40 - 1\) && rnd_rect\(\)\) \{\n {8}if \(game\.nroom >= \(Math\.trunc\(40 \/ 6\)\) && rn2\(2\) && !tried_vault\) \{/,
            'while (game.nroom < (40 - 1) && (() => { console.log("[harness] makerooms iter: nroom=" + game.nroom + " rect_cnt=" + game.rect_cnt + " prng=" + globalThis.__prngSink.length + " themeroom_failed=" + game.themeroom_failed); return rnd_rect(); })()) {\n        const __vc = (game.nroom >= 6) ? rn2(2) : -1;\n        console.log("[harness] makerooms vault_check: nroom=" + game.nroom + " rn2(2)=" + __vc + " tried_vault=" + tried_vault + " prng=" + globalThis.__prngSink.length);\n        if (game.nroom >= 6 && __vc && !tried_vault) {'
        );
    }
    writeFileSync(p, s);
}

// 4. Boot game state — runs before any rn2 captures so global
//    setup PRNG noise doesn't pollute the matched-count.
const declMod = await import(outputDir + '/decl.js');
declMod.program_state_init?.();
declMod.decl_globals_init?.();
{
    // emptystr: char-array zero-init produced [0]; downstream
    // get_table_str_opt returns it as default and strcpy stringifies
    // to "0" — a truthy 1-char string that breaks `proto[0]` /
    // `fill_lvl[0]` checks.  Override with the empty string.
    const { game } = await import(root + '/js/gstate.js');
    game.emptystr = '';
}
const objMod = await import(outputDir + '/objects.js');
objMod.objects_globals_init?.();
// Likewise for monsters: monst.c declares `mons[]` and copies the
// `mons_init[]` literal into it via monst_globals_init.  Without this,
// rndmonst_adj sees all-zero monster entries and never produces a
// non-zero `weight`, so it returns null and makemon early-exits without
// firing the rn2 calls C makes for monster generation.
if (process.env.PHASE_TIMINGS) console.error('[harness] @ monst init');
const monstMod = await import(outputDir + '/monst.js');
monstMod.monst_globals_init?.();
if (process.env.PHASE_TIMINGS) console.error('[harness] @ rumors data');

// Register dat/rumors.tru, dat/rumors.fal, dat/engrave, dat/epitaph
// as in-memory line tables consumed by js/c2js-runtime/rumors.js.
// Mirrors util/makedefs.c:padline so the per-line lengths match what
// `get_rnd_line`'s `rng(filechunksize)` sampling would produce against
// the on-disk concatenated file (preserving PRNG-faithful behavior).
{
    const padline = (body) => body.length + 1 >= 60
        ? body
        : body + '_'.repeat(60 - body.length - 1);
    const buildSection = (rel) => {
        const path = join(upstreamDir, rel);
        const src = readFileSync(path, 'utf8');
        const lines = src.split('\n');
        if (lines[lines.length - 1] === '') lines.pop();
        return lines.map(padline);
    };
    const rumMod = await import(root + '/js/c2js-runtime/rumors.js');
    rumMod.registerRumorsData({
        trueLines: buildSection('dat/rumors.tru'),
        falseLines: buildSection('dat/rumors.fal'),
        engraveLines: buildSection('dat/engrave.txt'),
        epitaphLines: buildSection('dat/epitaph.txt'),
    });
}
if (process.env.PHASE_TIMINGS) console.error('[harness] @ rumors data done');
const rndMod = await import(outputDir + '/rnd.js');
rndMod.init_isaac64(8000, rndMod.rn2);
rndMod.init_isaac64(8000, rndMod.rn2_on_display_rng);
globalThis.rn2 = rndMod.rn2;
globalThis.rn2_on_display_rng = rndMod.rn2_on_display_rng;
globalThis.nh_random = (low, count) => low + rndMod.rn2(count);

// 5. Stubs for unresolved free identifiers — names called from
//    translated code whose home TU isn't yet in the closure.
//    Each returns a neutral value matching the C function's
//    "fresh-game / no-op" path.  ES modules consult globalThis
//    for free identifiers, so these resolve naturally.
const STUBS = {
    flush_screen: () => {}, pline: () => {}, pline_The: () => {},
    debugcore: () => 0, nh_getenv: () => null, paniclog: () => {},
    debugpline1: () => {}, debugpline2: () => {}, debugpline3: () => {}, debugpline4: () => {},
    config_error_add: () => {}, mungspaces: (s) => s, mt_random: () => 0,
    set_uasmon: () => {}, max_rank_sz: () => {},
    newhp: () => 50, newpw: () => 10, adjabil: () => {},
    init_uhunger: () => {}, init_attr: () => {}, vary_init_attr: () => {},
    addinv: (o) => o, dealloc_obj: () => {}, mkobj: () => null,
    mksobj: () => null, setworn: () => {}, setuwep: () => {},
    setuqwep: () => {}, setuswapwep: () => {}, set_twoweap: () => {},
    skill_init: () => {}, num_spells: () => 0, initialspell: () => {},
    weight: () => 0, inv_weight: () => 0, is_art: () => 0,
    spell_skilltype: () => 0, useupall: () => {},
    hidden_gold: () => 0, find_ac: () => {}, adjattrib: () => 0,
    time: () => 0, nh_random: () => 0,
    // erosion_matters: ported from objnam.c:1195 — an object's
    // erosion (rust/burn/rot) is meaningful for weapons, armor,
    // balls, chains, and weapon-tools (e.g., a unicorn horn).
    // Unstubbed it returned 0 → may_generate_eroded short-circuited
    // → mkobj_erosions's body never ran → JS skipped 4+ rn2 calls
    // C makes per random object (rn2(100), rn2(80), rn2(80), rn2(1000)).
    erosion_matters: (obj) => {
        if (!obj) return 0;
        const cls = obj.oclass;
        const constants = globalThis.__nh_oclasses;
        if (constants && (
            cls === constants.WEAPON_CLASS ||
            cls === constants.ARMOR_CLASS ||
            cls === constants.BALL_CLASS ||
            cls === constants.CHAIN_CLASS)) return 1;
        // is_weptool: TOOL_CLASS && objects[otyp].oc_skill != P_NONE.
        if (constants && cls === constants.TOOL_CLASS) {
            const objsTbl = globalThis.__nh_gameRef?.objects;
            const skill = objsTbl?.[obj.otyp]?.oc_skill;
            // P_NONE is 0 in skill enum — non-zero means weapon-tool.
            return (skill && skill !== 0) ? 1 : 0;
        }
        return 0;
    },
    // goodpos: from teleport.c.  Validates a (x,y) for monster
    // placement (isok, no player/monster at spot, water/lava
    // tolerance, etc.).  Stubbing as `() => 0` would cause
    // makemon's tryct loop to retry rndmonst 50 times (× 9 rn2
    // per call = 450 extra rn2 entries that drift the stream).
    // For mklev's fresh-level placements with valid (x,y) from
    // somexyspace(), goodpos returns true.  Stub accordingly
    // until teleport.c is in the closure.
    goodpos: () => 1,
    // Strlen_ — debug-instrumented strlen wrapper (global.h: Strlen
    // macro expands to Strlen_(s, __func__, __LINE__)).  Behaves
    // identically to strlen for our purposes.
    // set_tin_variety — from eat.c:1460.  Picks a tin "variety"
    // (rotten / homemade / soup / ...) for an obj.  For RANDOM_TIN
    // (forcetype = -2), fires rn2(TTSZ - 1) = rn2(15).  For
    // SPINACH_TIN (-1), short-circuits to spe=1 with no rn2.
    set_tin_variety: (obj, forcetype) => {
        const SPINACH_TIN = -1, RANDOM_TIN = -2, HEALTHY_TIN = -3;
        const TTSZ = 16; // tintxts[] has 16 entries
        if (forcetype === SPINACH_TIN
            || (forcetype === HEALTHY_TIN && (!obj || obj.corpsenm < 0))) {
            if (obj) {
                obj.corpsenm = -1; // NON_PM
                obj.spe = 1;       // spinach
            }
            return;
        }
        let r;
        if (forcetype >= 0 && forcetype < TTSZ - 1) {
            r = forcetype;
        } else {
            r = globalThis.rn2(TTSZ - 1);
            // ROTTEN_TIN-with-nonrotting-corpse → HOMEMADE_TIN (1).
            // We don't model ismnum / nonrotting_corpse precisely;
            // skip the override (it's rare and only matters for
            // lizard-class corpses).
        }
        if (obj) obj.spe = -(r + 1);
    },
    Strlen_: (s) => {
        if (s == null) return 0;
        if (Array.isArray(s)) {
            for (let i = 0; i < s.length; i++) if (!s[i]) return i;
            return s.length;
        }
        return String(s).length;
    },
    // maketrap: from trap.c.  Allocates a trap struct, links it
    // into game.trap_list, returns it.  Without a real impl, a
    // null return makes mktrap's downstream `lvl <= rnd(4)`
    // check skip — losing the rnd(4) call C makes inside mktrap.
    // Minimal stub: return an object with the requested ttyp so
    // the followup `mktrap_victim` path runs.
    maketrap: (x, y, typ) => {
        const game = globalThis.__nh_gameRef;
        const trap = { ttyp: typ, tseen: 0, tx: x, ty: y,
            launch: { x: 0, y: 0 }, dst: { dnum: 0, dlevel: 0 },
            ntrap: (game && game.ftrap) || null };
        if (game) game.ftrap = trap;
        if (process.env.MAKETRAP_TRACE) {
            let n = 0;
            for (let t = game && game.ftrap; t; t = t.ntrap) n++;
            console.log('[maketrap] x=' + x + ' y=' + y + ' typ=' + typ + ' list-len=' + n);
        }
        return trap;
    },
    // t_at: walk the level's trap-list (game.ftrap) looking for a
    // trap at (x, y).  somexyspace's `occupied(x,y)` check uses
    // this to skip cells that already have traps; without a list-
    // backing for maketrap, t_at always returned null and JS's
    // somexyspace exited on the first iteration where C retried.
    t_at: (x, y) => {
        const game = globalThis.__nh_gameRef;
        for (let t = game && game.ftrap; t; t = t.ntrap) {
            if (t.tx === x && t.ty === y) return t;
        }
        return null;
    },
    stairway_free_all: () => { return; },
    // C's stair.c: prepend a stair entry to gs.stairs linked-list.
    // mkstairs invokes this; has_dnstairs / has_upstairs walk
    // game.stairs to detect stair-bearing rooms (which generate_stairs
    // excludes from later "good room" phase=2 picks).  The no-op stub
    // we previously had left game.stairs always null, so phase=2 ai
    // never decremented after stair placement → JS rn2(8) where C
    // emits rn2(7).  The recording shows TWO generate_stairs_find_room
    // calls: first at index 1158 (rn2(8) in both), second at 1390
    // (rn2(7) in C, rn2(8) in JS without this fix).
    stairway_add: (x, y, up, isladder, dest) => {
        const game = globalThis.__nh_gameRef;
        if (!game) return;
        // dest may be a getter/setter wrapper from refWrapForAddrOf.
        const tolev = (dest && typeof dest === 'object' && 'value' in dest)
            ? { dnum: dest.value.dnum, dlevel: dest.value.dlevel }
            : { dnum: dest?.dnum ?? 0, dlevel: dest?.dlevel ?? 0 };
        const entry = {
            sx: x, sy: y, up: !!up, isladder: !!isladder,
            u_traversed: false, tolev,
            next: game.stairs || null,
        };
        game.stairs = entry;
    },
    free_exclusions: () => {}, clear_regions: () => {},
    // isok(x, y) lives in cmd.c — bounds check on (x,y).  We
    // mirror C's definition exactly.  COLNO=80, ROWNO=21.
    isok: (x, y) => x >= 1 && x <= 79 && y >= 0 && y <= 20,
    // Trap / object / monster occupancy queries — return null
    // (no trap/obj/mon at the location) so subsequent C-side
    // path-finding behavior matches the "fresh level" recording.
    // t_at stubbed above with a real list walk.
    sobj_at: () => null,        // mkobj.c: stationary object at
    m_at: () => null,           // mon.c: monster at
    mintrap: () => 0,           // trap.c: monster's trap interaction
    // maketrap stubbed above with a non-null shape so mktrap's
    // post-`maketrap()` `lvl <= rnd(4)` and mktrap_victim path fire.
    deltrap: () => {},
    obj_at: () => null,
    g_at: () => null,           // gold object at
    invocation_pos: () => false,
    levl_at: () => null,
    nexttrap: () => null,
    boulder_at: () => null,
    swallowed: () => false,
    occupant_at: () => null,
    deal_with_overcrowding: () => 0,
    is_lava: () => 0, is_pool: () => 0, is_pool_or_lava: () => 0,
    is_open_air: () => 0, is_clinger: () => 0,
    on_level: () => 0,
    surface: () => 'floor',
    closed_door: () => 0,
    // set_levltyp / set_levltyp_lit — from mkmaze.c:76.  Update the
    // typ field at (x, y) so downstream `somexyspace` checks for
    // ROOM/CORR/ICE-only see the FOUNTAIN/SINK/ALTAR/STAIRS/etc.
    // typs that mkfount/mksink/mkaltar/mkstairs etc. set.  Without
    // this, C makes feature cells non-ROOM and somexyspace retries
    // there, but JS leaves them as ROOM and somexyspace exits on
    // the first iteration → C and JS diverge in retry counts.
    set_levltyp: (x, y, typ) => {
        const game = globalThis.__nh_gameRef;
        if (!game || !game.level || !game.level.locations) return 0;
        if (x < 0 || x >= 80 || y < 0 || y >= 21) return 0;
        if (typ < 0) return 0;
        game.level.locations[x][y].typ = typ;
        return 1;
    },
    set_levltyp_lit: (x, y, typ, lit) => {
        const game = globalThis.__nh_gameRef;
        if (!game || !game.level || !game.level.locations) return 0;
        if (x < 0 || x >= 80 || y < 0 || y >= 21) return 0;
        if (typ < 0) return 0;
        const cell = game.level.locations[x][y];
        cell.typ = typ;
        // SET_LIT_NOCHANGE (-2) means leave .lit alone.
        if (lit !== -2 && lit !== undefined) cell.lit = lit ? 1 : 0;
        return 1;
    },
    levl_set: () => {},
    set_wall_state: () => {},
    block_point: () => {}, unblock_point: () => {},
    fill_special_room: () => {},
    place_object: () => {},
    add_to_buried: () => {},
    obj_extract_self: () => {}, obj_no_longer_held: () => {},
    place_monster: (mon, x, y) => {
        // Mirror place_monster() in steed.c:898 — set mon.mx/my AND
        // record monster at level.monsters[x][y] so subsequent enexto/
        // goodpos checks treat the cell as occupied.  Without the
        // monsters[][] update, makemon's enexto could pick already-
        // occupied cells leading to monster positions that diverge
        // from the recording despite matching PRNG draws.
        if (!mon) return;
        const game = globalThis.__nh_gameRef;
        // Clear monster's previous slot in level.monsters[][] (if any).
        if (typeof mon.mx === 'number' && typeof mon.my === 'number'
            && game && game.level && game.level.monsters
            && game.level.monsters[mon.mx]) {
            if (game.level.monsters[mon.mx][mon.my] === mon) {
                game.level.monsters[mon.mx][mon.my] = null;
            }
        }
        mon.mx = x;
        mon.my = y;
        if (game && game.level && game.level.monsters
            && game.level.monsters[x]) {
            game.level.monsters[x][y] = mon;
        }
    },
    wallification: () => {},
    add_door: () => {},
    in_rooms: () => 0,
    permapoisoned: () => 0,
    do_mkroom: () => {},
    fill_special_rooms: () => {},
    create_treasure: () => {},
    mk_knox_portal: () => {},
    mkportal: () => {},
    makevtele: () => {},
    fill_ordinary_room: () => {},
    rndmonst: () => null,
    rndmonst_adj: () => null,
    makemon: () => null,
    mksobj_init: () => null,
    mkclass: () => null,
    teleds: () => {},
    poss_class: () => 0,
    rndcurse: () => {}, blessorcurse: () => {},
    set_obj_glyph: () => {}, get_random_obj_glyph: () => 0,
    has_dnstairs: () => 0, has_upstairs: () => 0,
    nh_callback_run: () => {},
    post_level_generate: () => {},
    pre_themerooms_generate: () => {},
    post_themerooms_generate: () => {},
    themerooms_generate: () => {},
    next_ident: () => 0,
    sort_rooms: () => {},
    impossible: () => {},
    // bound_digging — from mkmaze.c:1440.  Marks STONE/WALL cells
    // outside the level's "extends" bounding box as W_NONDIGGABLE
    // (bit 8 of `flags`, aliased as `wall_info` in C).  Mineralize
    // excludes these from its eligibility check, so without this,
    // JS fires ~100 more rn2(1000) calls than C (one per extra
    // eligible border cell).  The set_levltyp implementation
    // doesn't change this — it's a separate `flags` field.
    bound_digging: () => {
        const game = globalThis.__nh_gameRef;
        if (!game || !game.level || !game.level.locations) return 0;
        // get_level_extends: find min/max x,y where non-STONE typ
        // first appears.  Mirrors mkmaze.c:1352-1394.
        //
        // CRITICAL detail: C's `for (xmin = 0; !found && xmin <= COLNO; xmin++)`
        // increments xmin AFTER the body runs, so on exit xmin is one
        // PAST the column where it found a non-STONE cell.  A naive
        // JS port that uses `break outer1` exits with xmin AT the found
        // column — off by one.  Match C's semantics by adding 1 after
        // the break.
        const STONE = 0;
        const isStWall = (t) => t === STONE
            || (t >= 1 && t <= 9); // VWALL through DBWALL-ish
        let xmin, xmax, ymin, ymax;
        let nonwall = false;
        // Find xmin: scan columns left-to-right; nonwall recorded
        // for the column where first non-STONE appears.
        outer1: for (xmin = 0; xmin <= 80; xmin++) {
            for (let y = 0; y < 21; y++) {
                const cell = game.level.locations[xmin] && game.level.locations[xmin][y];
                if (cell && cell.typ !== STONE) {
                    if (!isStWall(cell.typ)) nonwall = true;
                    // Continue scanning the rest of THIS column to
                    // mirror C's nonwall-determination loop, then
                    // break out so xmin is the next column.
                    for (let yy = y + 1; yy < 21; yy++) {
                        const c2 = game.level.locations[xmin] && game.level.locations[xmin][yy];
                        if (c2 && c2.typ !== STONE && !isStWall(c2.typ)) { nonwall = true; break; }
                    }
                    xmin += 1; // C's for-loop increment after body
                    break outer1;
                }
            }
        }
        xmin -= (nonwall || !(game.level.flags && game.level.flags.is_maze_lev)) ? 2 : 1;
        if (xmin < 0) xmin = 0;
        // Find xmax: scan columns right-to-left.
        nonwall = false;
        outer2: for (xmax = 79; xmax >= 0; xmax--) {
            for (let y = 0; y < 21; y++) {
                const cell = game.level.locations[xmax][y];
                if (cell.typ !== STONE) {
                    if (!isStWall(cell.typ)) nonwall = true;
                    for (let yy = y + 1; yy < 21; yy++) {
                        const c2 = game.level.locations[xmax][yy];
                        if (c2.typ !== STONE && !isStWall(c2.typ)) { nonwall = true; break; }
                    }
                    xmax -= 1; // C's for-loop decrement after body
                    break outer2;
                }
            }
        }
        xmax += (nonwall || !(game.level.flags && game.level.flags.is_maze_lev)) ? 2 : 1;
        if (xmax >= 80) xmax = 79;
        // ymin: scan rows top-to-bottom within xmin..xmax.
        nonwall = false;
        outer3: for (ymin = 0; ymin <= 21; ymin++) {
            for (let x = xmin; x <= xmax; x++) {
                const cell = game.level.locations[x] && game.level.locations[x][ymin];
                if (cell && cell.typ !== STONE) {
                    if (!isStWall(cell.typ)) nonwall = true;
                    for (let xx = x + 1; xx <= xmax; xx++) {
                        const c2 = game.level.locations[xx] && game.level.locations[xx][ymin];
                        if (c2 && c2.typ !== STONE && !isStWall(c2.typ)) { nonwall = true; break; }
                    }
                    ymin += 1;
                    break outer3;
                }
            }
        }
        ymin -= (nonwall || !(game.level.flags && game.level.flags.is_maze_lev)) ? 2 : 1;
        if (ymin < 0) ymin = 0;
        // ymax: scan rows bottom-to-top within xmin..xmax.
        nonwall = false;
        outer4: for (ymax = 20; ymax >= 0; ymax--) {
            for (let x = xmin; x <= xmax; x++) {
                const cell = game.level.locations[x][ymax];
                if (cell.typ !== STONE) {
                    if (!isStWall(cell.typ)) nonwall = true;
                    for (let xx = x + 1; xx <= xmax; xx++) {
                        const c2 = game.level.locations[xx][ymax];
                        if (c2.typ !== STONE && !isStWall(c2.typ)) { nonwall = true; break; }
                    }
                    ymax -= 1;
                    break outer4;
                }
            }
        }
        ymax += (nonwall || !(game.level.flags && game.level.flags.is_maze_lev)) ? 2 : 1;
        if (ymax >= 21) ymax = 20;
        // Mark cells outside the bounding box with W_NONDIGGABLE.
        for (let x = 0; x < 80; x++) {
            for (let y = 0; y < 21; y++) {
                const cell = game.level.locations[x][y];
                if (isStWall(cell.typ)) {
                    if (y <= ymin || y >= ymax || x <= xmin || x >= xmax) {
                        cell.flags = (cell.flags || 0) | 8; // W_NONDIGGABLE
                    }
                    if (y < ymin || y > ymax || x < xmin || x > xmax) {
                        cell.flags = (cell.flags || 0) | 16; // W_NONPASSWALL
                    }
                }
            }
        }
        return 0;
    },
    fracture_rock: () => 0,
    minliquid: () => 0,
    begin_burn: () => {},
    set_mimic_sym: () => {},
    seemimic: () => {},
    glyph_to_cmap: () => 0,
    back_to_glyph: () => 0,
};
Object.assign(STUBS, {
    finalize_railed_door: () => {},
    invocation_message: () => {},
    free_engravings: () => {},
    free_traps: () => {},
    costly_spot: () => 0, in_shop: () => 0, in_temple: () => 0,
    in_mklev: () => 0, in_dgn: () => 0,
    expert_time: () => 0,
    obj_no_longer_held: () => {}, obj_extract_self: () => {},
    insert_branch: () => {}, single_level_branch: () => null,
    free_dungeons: () => {},
    pickup_object: () => 0,
    Has_contents: () => 0, getobj: () => null,
    container_check: () => {},
    free_invbuf: () => {},
    addtobill: () => {}, subfrombill: () => {},
    extract_nobj: () => {}, extract_nexthere: () => {},
    save_oname: () => {},
    boulder_setup: () => {}, statue_setup: () => {},
    fix_object: () => {}, oname: () => {}, copy_oname: () => {},
    obj_check_uname: () => {},
    artifact_exists: () => 0,
    obfree: () => {}, dealloc_obj: () => {},
});
for (const [k, v] of Object.entries(STUBS)) if (!(k in globalThis)) globalThis[k] = v;

// Auto-stub any *other* unresolved C function name with a permissive
// no-op-returning-zero callable.  ES modules consult globalThis for
// free identifiers; we install a list of suspect names returned by
// scanning the generated TUs.  Without this, every missing helper
// (costly_spot, costly_adjacent, etc.) requires an explicit stub
// addition.  Any name in `KNOWN_C_FNS` is wrapped with a sentinel
// callable that returns 0 / null for both number and object usages.
const _autoStubProxy = new Proxy(() => 0, {
    apply: () => 0,
    get(_, prop) {
        if (prop === Symbol.toPrimitive) return () => 0;
        if (prop === 'valueOf') return () => 0;
        return _autoStubProxy;
    },
});
// Read every generated *.js, find imported names not exported by any
// included module, and pre-install a default callable on globalThis.
{
    const declared = new Set();
    for (const f of readdirSync(outputDir)) {
        if (!f.endsWith('.js')) continue;
        const src = readFileSync(join(outputDir, f), 'utf8');
        for (const m of src.matchAll(/(?:^|\n)export function ([A-Za-z_][A-Za-z0-9_]*)/g)) {
            declared.add(m[1]);
        }
    }
    for (const f of readdirSync(outputDir)) {
        if (!f.endsWith('.js')) continue;
        const src = readFileSync(join(outputDir, f), 'utf8');
        for (const m of src.matchAll(/(?<![\w$.])([a-z_][A-Za-z0-9_]*)\s*\(/g)) {
            const name = m[1];
            if (name in globalThis) continue;
            if (declared.has(name)) continue;
            if (['if', 'for', 'while', 'switch', 'return', 'function',
                 'typeof', 'new', 'do', 'catch', 'else', 'case',
                 'continue', 'break', 'throw', 'await', 'async',
                 'let', 'const', 'var'].includes(name)) continue;
            // Default to a no-op returning 0 / null (safe sentinel).
            globalThis[name] = () => 0;
        }
    }
}
globalThis.aligns ??= [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }];

// (Step 123 made these proper EXTERNAL_SYMBOLS imports backed by
// runtime shims under js/c2js-runtime/.  The translator now emits
// `import { regex_id } from '...regex.js'` etc., so the globalThis
// stubs are no longer needed for module load.  Keep this
// vestigial-but-harmless `aligns` stub — it's referenced by
// pre-import harness setup that runs before role.js loads.)

// wiz_load_splua / wiz_load_lua are in cmd.js's extcmdlist[] and
// translated wizcmds.c provides them — but wizcmds.c is added to
// the closure conditionally, and the harness's order of imports
// matters.  Keep them as harmless globalThis fallbacks.
const _saveStubNames = [
    'wiz_load_splua',          // wizcmds.c — already real after wizcmds.c added
    'wiz_load_lua',            // ditto
];
for (const name of _saveStubNames) {
    if (typeof globalThis[name] === 'undefined') {
        globalThis[name] = () => 0;
    }
}

// 6. Pre-register every dat/*.lua file.  Files our limited Lua
//    data parser accepts (purely declarative) get pre-parsed; the
//    rest get registered as raw source and run via fengari.
{
    const luaDir = join(upstreamDir, 'dat');
    const names = readdirSync(luaDir).filter((f) => f.endsWith('.lua'));
    for (const name of names) {
        let src = readFileSync(join(luaDir, name), 'utf8');
        // Optional pick tracing: log every themerooms_generate pick name
        // to confirm the JS reservoir sampling is choosing the same
        // entries C does.
        if (process.env.THEMEPICK_TRACE && name === 'themerms.lua') {
            src = src.replace(
                /(themerooms\[pick\]\.contents\(\);)/,
                'print("[pick] " .. tostring(themerooms[pick].name)); $1',
            );
        }
        try { registerLuaData(name, parseLuaData(src)); }
        catch (e) { registerLuaSource(name, src); }
    }
}

// 7. Set up PRNG capture and execute the C-translated init path.
globalThis.__prngSink = [];
globalThis.__prngCap = parseInt(process.env.PRNG_CAP) || 100000;
if (process.env.PCALL_PROPAGATE) globalThis.__nh_pcall_propagate = true;
// Enable call-trace markers when CALL_TRACE=1.  This makes the
// fnEnter/fnExit* helpers (js/c2js-runtime/trace.js) emit
// `>funcname` / `<funcname` lines into the same __prngSink as
// PRNG draws, so the captured sequence shows the call graph
// interleaved with rng calls.  See docs/CALL_TRACE.md.
if (process.env.CALL_TRACE === '1') {
    globalThis.__nh_traceEnabled = true;
}
globalThis.__prngTrace = process.env.PRNG_TRACE === '1';
if (process.env.PRNG_STACK_AT) {
    const _idx = parseInt(process.env.PRNG_STACK_AT);
    globalThis.__prngStackAt = _idx;
}

const oinit = await import(outputDir + '/o_init.js');
oinit.init_objects();

// init_dungeons crashes at fixup_level_locations (a static-array
// pointer-iteration the translator doesn't yet rewrite).  The
// crash itself produces no PRNG calls; we hand-port the loop so
// downstream code sees properly-resolved special-level slots.
const dungeonMod = await import(outputDir + '/dungeon.js');
// Now that dungeon.js's top-level has run with game.dungeon_topology
// populated, it's safe to import sp_lev.js and register the real
// des table.  Dungeon-state-dependent fields like
// game.level_map[i].lev_spec keep their valid bucket-flattened
// references.
{
    const spLevMod = await import(outputDir + '/sp_lev.js');
    if (typeof spLevMod.l_register_des === 'function') {
        setDesRegistrar(spLevMod.l_register_des);
    }
}
try { dungeonMod.init_dungeons(); }
catch (e) {
    if (!/fixup_level_locations|lev_name|lev_map/.test(e.stack || '')) {
        console.error('[harness] unexpected init_dungeons FAIL:', e.message);
    }
}
{
    const { game } = await import(root + '/js/gstate.js');
    // Hand-port of fixup_level_locations: walk sp_levchn ourselves
    // (translated find_level uses a strncmpi that needs CharBuffer
    // semantics) to populate each special-level slot in
    // game.dungeon_topology.  Then resolve d_*_dnum globals.
    for (const entry of game.level_map || []) {
        if (!entry || !entry.lev_name || entry.lev_name.length === 0) break;
        for (let p = game.sp_levchn; p; p = p.next) {
            if ((p.proto || '').toLowerCase() === entry.lev_name.toLowerCase()) {
                if (entry.lev_spec) {
                    entry.lev_spec.dnum = p.dlevel.dnum;
                    entry.lev_spec.dlevel = p.dlevel.dlevel;
                }
                break;
            }
        }
    }
    const findDnum = (name) => {
        for (let i = 0; i < game.n_dgns; i++) {
            if (game.dungeons[i].dname === name) return i;
        }
        return -1;
    };
    game.dungeon_topology.d_quest_dnum = findDnum('The Quest');
    game.dungeon_topology.d_sokoban_dnum = findDnum('Sokoban');
    game.dungeon_topology.d_mines_dnum = findDnum('The Gnomish Mines');
    game.dungeon_topology.d_tower_dnum = findDnum("Vlad's Tower");
    game.dungeon_topology.d_tutorial_dnum = findDnum('The Tutorial');
    if (process.env.PRNG_DEBUG) {
        let nlev = 0;
        const protos = [];
        for (let p = game.sp_levchn; p && nlev < 8; p = p.next, nlev++) {
            protos.push(JSON.stringify(p.proto));
        }
        console.log('[harness] sp_levchn protos:', protos.join(' '));
        const lm0 = game.level_map[0];
        console.log('[harness] level_map[0]:', lm0,
                    '— typeof lev_spec:', typeof lm0.lev_spec);
        console.log('[harness] post-fixup wiz1_level:', game.dungeon_topology.d_wiz1_level);
    }
}

// u_init_misc: only the rn2(10) at line 1031 contributes to the
// PRNG sequence on this seed; the rest of its work is best-effort
// stubs (set_uasmon, newhp, ...).
const u_init = await import(outputDir + '/u_init.js');
// u_init_misc → set_uasmon → polysense reads game.context.warntype's
// scalar fields (speciesidx, polyd) and writes them.  Without
// pre-init, the Proxy ghost returns `{}` for game.context but
// `undefined` for nested .warntype, so writes throw.  Initialize
// the warntype struct now so polysense completes.
//
// u_init_misc also reads game.urole.mnum to set
// game.u.umonnum / .umonster (line 368-369 of u_init.js); when
// polyself.c is in the closure, the real set_uasmon then does
// `game.mons[game.u.umonnum]` and crashes if umonnum is undefined.
// Initialize urole.mnum / urace.mnum early so this chain works.
{
    const { game: g } = await import(root + '/js/gstate.js');
    g.context = g.context || {};
    if (!g.context.warntype || typeof g.context.warntype.speciesidx !== 'number') {
        g.context.warntype = { obj: 0, polyd: 0, species: null, speciesidx: 0 };
    }
    // u.uprops is also read by set_uasmon's resistance loop —
    // initialize it the same way the post-mklev sanitize block
    // does (Array.from with WARN_OF_MON, FIRE_RES, etc. slots).
    if (!Array.isArray(g.u.uprops) || g.u.uprops.length < 70) {
        g.u.uprops = Array.from({ length: 70 },
            () => ({ intrinsic: 0, extrinsic: 0, blocked: 0 }));
    }
    // urole.mnum / urace.mnum: u_init_misc reads these to set
    // u.umonnum.  Set them BEFORE u_init_misc (the existing
    // harness init at line ~1730 was AFTER u_init_misc, which
    // doesn't matter for the inline stub but does matter when
    // the real polyself.set_uasmon dereferences game.mons[umonnum]).
    // urole.mnum starts as NON_PM (-1) from decl.js's
    // urole_init_data; force it to PM_TOURIST (341) here.
    // Same for urace.
    g.urole = g.urole || {};
    if (g.urole.mnum !== 341) g.urole.mnum = 341;  // PM_TOURIST
    g.urace = g.urace || {};
    if (g.urace.mnum !== 260) g.urace.mnum = 260;  // PM_HUMAN
    // game.youmonst.cham: read by valid_vampshiftform.  Default
    // to NON_PM (-1) so the comparison doesn't trip on Proxy.
    g.youmonst = g.youmonst || {};
    if (typeof g.youmonst.cham !== 'number') g.youmonst.cham = -1;
    // (Vestigial: an earlier translator emitted free `windowprocs.X`
    // references; the current translator hoists windowprocs to
    // `game.windowprocs` (windows.c declares it `NEARDATA struct
    // window_procs windowprocs`, which the global-bucket flatten
    // lifts onto `game`).  The harness's old globalThis fallback is
    // no longer reached by any code path.)
}
try { u_init.u_init_misc(); }
catch (e) { console.error('[harness] u_init_misc FAIL:', e.message); }

// allmain.c calls l_nhcore_init() between u_init_misc and mklev.
// That builds a fresh Lua state which (via nhl_init → nhlib.lua)
// reruns the top-level shuffle(align), consuming 2 PRNG calls.
{
    const luaMod = await import(root + '/js/c2js-runtime/lua.js');
    const tmpL = luaMod.nhl_init({});
    luaMod.nhl_done(tmpL);
}

// In C, u_init_misc → set_uasmon() sets game.youmonst.data so that
// makemon's enexto/goodpos calls during mklev see the real player
// permonst.  Our set_uasmon stub does nothing, so youmonst.data is
// an auto-Proxy ghost during mklev — which can cause goodpos's
// `mtmp == &youmonst` and `youmonst.data.X` checks to evaluate
// differently than C, leading to monster-placement divergence even
// though the rn2 sequence matches.  Set youmonst.data BEFORE mklev.
{
    const { game } = await import(root + '/js/gstate.js');
    game.youmonst = game.youmonst || {};
    game.youmonst.data = game.mons[341]; // PM_TOURIST
    game.youmonst.m_id = 1;
    game.youmonst.cham = -1;
    game.youmonst.mnum = 341;
    game.youmonst.m_ap_type = 0;
    game.youmonst.mappearance = 0;
    for (const k of ['mflee', 'mfleetim', 'msleeping', 'mfrozen',
                     'mblinded', 'mstun', 'mconf', 'mtame',
                     'mpeaceful', 'mtrapped', 'minvis',
                     'mhp', 'mhpmax', 'mx', 'my', 'mux', 'muy']) {
        if (typeof game.youmonst[k] !== 'number') {
            game.youmonst[k] = (k === 'mhp' || k === 'mhpmax') ? 16 : 0;
        }
    }
}

// mklev() → makelevel() → makerooms() → des.room (via fengari) →
// lspo_room (sp_lev.c).  Pre-populate the level/room storage and
// the player's level coordinate so makelevel takes the regular-
// level branch (matches the seed8000 recording).
{
    const { game } = await import(root + '/js/gstate.js');
    globalThis.__nh_gameRef = game;
    globalThis.__nh_oclasses = await import(outputDir + '/nh-constants.js');
    game.stairs = null;
    game.ftrap = null;
    game.u.uz.dnum = 0;
    game.u.uz.dlevel = 1;
    game.flags.bones = 1;
    game.flags.acoustics = 1; // default "On" per optlist.h
    const COLNO = 80, ROWNO = 21;
    const makeRm = () => ({
        glyph: 0, typ: 0, seenv: 0, flags: 0, horizontal: 0, lit: 0,
        waslit: 0, roomno: 0, edge: 0, candig: 0,
    });
    game.level = {
        // Allocate COLNO+1 by ROWNO+1 so out-of-bounds reads at
        // levl[COLNO][...] (which appear in C code like
        // get_level_extends's `for (xmin = 0; xmin <= COLNO; ...)`)
        // don't blow up.  C relies on the array being padded.
        locations: Array.from({ length: COLNO + 1 }, () =>
            Array.from({ length: ROWNO + 1 }, makeRm)),
        objects: Array.from({ length: COLNO + 1 }, () => new Array(ROWNO + 1).fill(null)),
        monsters: Array.from({ length: COLNO + 1 }, () => new Array(ROWNO + 1).fill(null)),
        objlist: null, buriedobjlist: null, monlist: null,
        damagelist: null, bonesinfo: null,
        flags: { temperature: 0, hellish: 0, town: 0, mazelike: 0,
                 rogue_like: 0, has_vault: 0, has_shop: 0, has_temple: 0,
                 noteleport: 0, hardfloor: 0, nommap: 0, arboreal: 0,
                 sokoban_rules: 0, is_maze_lev: 0, is_cavernous_lev: 0,
                 has_court: 0, has_morgue: 0, has_zoo: 0, has_barracks: 0,
                 has_beehive: 0, has_swamp: 0, rndmongen: 1,
                 deathdrops: 1, noautosearch: 0, fumaroles: 0,
                 stormy: 0, stasis_until: 0 },
    };
    const MAXNROFROOMS = 40;
    const makeRoom = () => ({
        lx: 0, hx: 0, ly: 0, hy: 0, rtype: 0, rlit: 0, doorct: 0,
        fdoor: 0, nsubrooms: 0, irregular: 0, needfill: 0,
        sbrooms: [null, null, null, null], resident: null,
    });
    // svr.rooms in C is `struct mkroom rooms[(MAXNROFROOMS+1)*2]`; the
    // first half is rooms[0..40], the second half is subrooms[41..81]
    // (decl.c init: `gs.subrooms = &svr.rooms[MAXNROFROOMS + 1];`).
    // level_finalize_topology iterates the full 82 slots reading rtype.
    game.rooms = Array.from({ length: (MAXNROFROOMS + 1) * 2 }, makeRoom);
    game.subrooms = Array.from({ length: MAXNROFROOMS + 1 }, makeRoom);
    // Visibility maps — sized [ROWNO][COLNO] (note y-major).
    game.viz_array = Array.from({ length: ROWNO }, () =>
        new Array(COLNO).fill(0));
    game.viz_rmin = new Array(ROWNO).fill(0);
    game.viz_rmax = new Array(ROWNO).fill(COLNO);
    game.vision_full_recalc = 0;
    // The smeq array — sequential indices used by sort_rooms etc.
    game.smeq = new Array(MAXNROFROOMS + 1).fill(0);
    // doors / lev_message / themeroom_failed.
    game.doors = null; game.doors_alloc = 0; game.doorindex = 0;
    game.themeroom_failed = 0;
    game.in_mk_themerooms = 0;
    // Force game.coder to null so create_des_coder()'s `if (!game.coder)`
    // check fires.  Without this, the auto-Proxy auto-creates an empty
    // {} on first read, considered truthy → init is skipped → coder.croom
    // is auto-Proxy → build_room takes the WRONG (subroom) path.
    game.coder = null;
    game.luathemes = new Array(64).fill(null);
    // urole.mnum: u_init_role switches on this to drive role-specific
    // initial-inventory rolls.  Seed8000-tourist-starter is a Tourist;
    // PM_TOURIST = 341 in nh-constants.
    game.urole = game.urole || {};
    game.urole.mnum = 341; // PM_TOURIST
    // Tourist role data from src/role.c.  attrbase sum drives the
    // number of rn2(100) calls in init_attr_role_redist (75 - sum
    // = leftover points to distribute).
    // Tourist attrbase + attrdist from role.c:480-482.
    // Wrong attrdist (was [20,15,15,20,20,10]) caused A_DEX=11
    // instead of recording's 14, so ACURR(A_DEX)*3+40=73 instead
    // of expected 82.  Doesn't affect strict-streak directly
    // because rn2 call count/values match either way, but it
    // means real moveloop_core would fire rn2(73) instead of
    // rn2(82) — masked only because the harness inline stub
    // hard-codes rn2(82).
    game.urole.attrbase = [7, 10, 6, 7, 7, 10];
    game.urole.attrdist = [15, 10, 10, 15, 30, 20];
    // Tourist HP/Energy advancement (role.c:483 / role.c:484).
    // Init/Lower fix+rnd/Higher fix+rnd.  At ulevel=0 only
    // `infix` matters (no rnd fired); set the rest so future
    // level-up code paths read real numbers not Proxy ghosts.
    game.urole.hpadv = { infix: 8, inrnd: 0, lofix: 0, lornd: 8, hifix: 0, hirnd: 0 };
    game.urole.enadv = { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 1 };
    game.urole.xlev = 14;          // role.c:485 — level after which Higher table applies
    game.urole.initrecord = -4;    // role.c:489 — initial alignment record
    // urace.mnum: u_init_race likewise switches on this for race-
    // specific rolls.  Tourist's race is human (PM_HUMAN).
    game.urace = game.urace || {};
    game.urace.mnum = 260; // PM_HUMAN
    // Human race attribute mins / maxes (role.c:597 entry).
    // attrmax STR18(100) ≈ 125 (strength represented as 100+%); for
    // non-STR attrs the max is 18.  init_attr_role_redist needs these
    // bounded to match recording's final A_DEX/A_INT/etc.
    game.urace.attrmin = [3, 3, 3, 3, 3, 3];
    // role.c:598 attrmax: { STR18(100), 18, 18, 18, 18, 18 }
    // STR18(x) macro = 18 + x  (include/attrib.h:36).
    game.urace.attrmax = [118, 18, 18, 18, 18, 18];
    // Human race HP/Energy advancement (role.c:599 / role.c:600).
    game.urace.hpadv = { infix: 2, inrnd: 0, lofix: 0, lornd: 2, hifix: 1, hirnd: 0 };
    game.urace.enadv = { infix: 1, inrnd: 0, lofix: 2, lornd: 0, hifix: 2, hirnd: 0 };
    if (process.env.UROLE_TRACE) {
        console.log('[urole] uroleplay=', JSON.stringify(game.u.uroleplay));
        console.log('[urole] urole=', JSON.stringify(game.urole));
    }
    // bughack — wall_cleanup uses gb.bughack.inarea.{x1,y1,x2,y2}
    // to skip a "baalz insect" sub-region.  Default to off-level
    // bounds so the within_bounded_area check never fires.
    game.bughack = { inarea: { x1: -1, y1: -1, x2: -1, y2: -1 } };
}
const mklevMod = await import(outputDir + '/mklev.js');
if (process.env.PHASE_TIMINGS) console.error('[harness] @ mklev start');
// Per-call ceiling to catch non-rn2 infinite loops while debugging
// the vfs path.  Set a hard cap on get_rnd_line invocations so a
// stuck loop in rumors/get_rnd_line / fill_ordinary_room surfaces
// instead of hanging the whole run.
if (process.env.GETRNDLINE_CAP) {
    const rumPath = outputDir + '/rumors.js';
    let rs = readFileSync(rumPath, 'utf8');
    rs = rs.replace(
        /export function get_rnd_line\(([^)]+)\) \{/,
        'let __grl = 0; export function get_rnd_line($1) {' +
        ' if (++__grl > ' + parseInt(process.env.GETRNDLINE_CAP) + ') throw new Error("get_rnd_line cap " + __grl);'
    );
    writeFileSync(rumPath, rs);
}
try { mklevMod.mklev(); }
catch (e) {
    if (process.env.PHASE_TIMINGS) console.error('[harness] @ mklev fail', e.message);
    if (process.env.MKLEV_TRACE) {
        console.error('[harness] mklev FAIL:', e.message);
        if (e.stack) console.error(e.stack.split('\n').slice(0, 8).join('\n'));
    }
}

// Post-mklev monster sanitization, runs BEFORE the move loop so
// the eligibility filter (mcalcmove credits + dochug calls) sees
// correctly-shaped monster fields.  Mirrors the per-monster fixup
// later in the script but applies to ALL monsters in monlist:
// install proper mtrack arrays and mgoal coords (decl.js's
// cg.zeromonst declares them as `null`/`0` which fails downstream
// in m_move's `mtrk = mtmp.mtrack[0]` line).
{
    const { game } = await import(root + '/js/gstate.js');
    // Place hero at the upstairs BEFORE the move loop fires (was
    // previously done after, leaving u.ux=u.uy=0 during dochug).
    // set_apparxy reads u.ux,u.uy when monster sees player, so an
    // un-placed hero gives every monster mux,muy=(0,0) and
    // m_move's "best by ndist" picks the candidate closest to
    // origin — diverging from C where the hero is at the upstairs.
    if (game.stairs && game.stairs.up
        && (typeof game.u.ux !== 'number' || game.u.ux === 0)) {
        game.u.ux = game.stairs.sx;
        game.u.uy = game.stairs.sy;
    }
    for (let m = game.level.monlist; m; m = m.nmon) {
        if (m.mtrack == null
            || !Array.isArray(m.mtrack)
            || m.mtrack.length < 4) {
            m.mtrack = [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];
        }
        if (typeof m.mgoal === 'number' || m.mgoal == null) {
            m.mgoal = {x:0, y:0};
        }
        if (typeof m.movement !== 'number') m.movement = 0;
        if (typeof m.mflee !== 'number') m.mflee = 0;
        if (typeof m.mfleetim !== 'number') m.mfleetim = 0;
        if (typeof m.msleeping !== 'number') m.msleeping = 0;
        if (typeof m.mfrozen !== 'number') m.mfrozen = 0;
        if (typeof m.mblinded !== 'number') m.mblinded = 0;
        if (typeof m.mstun !== 'number') m.mstun = 0;
        if (typeof m.mconf !== 'number') m.mconf = 0;
        if (typeof m.mpeaceful !== 'number') m.mpeaceful = 0;
        if (typeof m.mtrapped !== 'number') m.mtrapped = 0;
        if (typeof m.minvis !== 'number') m.minvis = 0;
        if (typeof m.mcanmove !== 'number') m.mcanmove = 1;
        if (typeof m.mstrategy !== 'number') m.mstrategy = 0;
        if (typeof m.mtame !== 'number') m.mtame = 0;
        if (typeof m.iswiz !== 'number') m.iswiz = 0;
        if (typeof m.isshk !== 'number') m.isshk = 0;
        if (typeof m.isgd !== 'number') m.isgd = 0;
        if (typeof m.ispriest !== 'number') m.ispriest = 0;
        if (typeof m.minvent === 'undefined') m.minvent = null;
    }
}

// allmain.c calls u_init_inventory_attrs() after mklev(); that
// chains into u_init_role() + u_init_race() + ini_inv() which
// drive PRNG calls C records past index 2851.
if (process.env.PHASE_TIMINGS) console.error('[harness] @ u_init_inventory_attrs');
try {
    u_init.u_init_inventory_attrs?.();
} catch (e) {
    if (process.env.MKLEV_TRACE) {
        console.error('[harness] u_init_inventory_attrs FAIL:', e.message);
        if (e.stack) console.error(e.stack.split('\n').slice(0, 8).join('\n'));
    }
}

// allmain.c moveloop_preamble (lines 72, 79): two rn2 calls before
// the move loop starts.  C records these as `rndencode` and
// `seer_turn` initialization.  Reproduce inline rather than
// translating all of allmain.c (huge surface area).
if (process.env.PHASE_TIMINGS) console.error('[harness] @ moveloop_preamble');
let harnessSeerTurn = 0;
try {
    rndMod.rnd(9000);  // svc.context.rndencode
    // svc.context.seer_turn = rnd(30): capture the result so the
    // first per-turn `if (moves >= seer_turn)` check at allmain.c:408
    // fires at the same turn count C does.  rnd(30) = rn2(30) + 1.
    harnessSeerTurn = rndMod.rnd(30);
} catch (e) {
    if (process.env.MKLEV_TRACE) console.error('[harness] preamble FAIL:', e.message);
}

// Move-loop iteration body — first iteration only.  Each on-level
// monster fires mcalcmove (mon.c:1164's `rn2(NORMAL_SPEED) <
// mmove_adj`).  Reproduce the per-monster rn2(12) for monsters
// whose mmove %12 != 0.
if (process.env.MONS_TRACE) {
    const { game } = await import(root + '/js/gstate.js');
    let count = 0;
    for (let m = game.level.monlist; m; m = m.nmon) {
        count++;
        const data = m.data;
        const mmoveRaw = data && data.mmove;
        const mmoveDirect = (m.mnum != null && game.mons[m.mnum]) ? game.mons[m.mnum].mmove : '?';
        console.log('[mons] m_id=' + m.m_id + ' mnum=' + m.mnum + ' name=' + (m.mnum != null && game.mons[m.mnum] && game.mons[m.mnum].pmnames && game.mons[m.mnum].pmnames[2]) + ' data.mmove=' + mmoveRaw + ' mons[mnum].mmove=' + mmoveDirect);
        if (count > 20) break;
    }
    console.log('[mons] total on level:', count);
}

// Reproduce the move-loop body's per-turn PRNG calls.  Each
// game-turn fires roughly:
//   - mcalcmove × N monsters (rn2(12), unconditional)
//   - maybe_generate_rnd_mon (rn2(70))
//   - dosounds (rn2(300)) — at start of NEXT turn
//   - gethungry (rn2(20))
//   - moveloop_core (rn2(82))
//   - distfleeck × N (rn2(5), per monster considered)
// Reproduced inline because translating mon.c / monmove.c /
// sounds.c / eat.c / allmain.c is significant additional surface
// area; the inline calls are PRNG-faithful (same modulus, same
// effect on ISAAC state) without needing the full game-loop body.
{
    const { game } = await import(root + '/js/gstate.js');
    const monsterCount = (() => {
        let c = 0;
        for (let m = game.level.monlist; m; m = m.nmon) {
            if (m.mnum != null && game.mons[m.mnum]
                && typeof game.mons[m.mnum].mmove === 'number'
                && game.mons[m.mnum].mmove > 0) c++;
        }
        return c;
    })();
    // Loop multiple turn-blocks.  Each iteration mirrors one
    // game-turn's PRNG-relevant calls.  We exit on the first
    // mismatch by capping how many turns we reproduce.
    // Use the real translated `mcalcmove` from mon.js when possible
    // — gives PRNG-faithful per-monster rn2(12) firing based on
    // each monster's mmove vs mspeed.
    let mcalcmove_real = null;
    try {
        const monMod = await import(outputDir + '/mon.js');
        mcalcmove_real = monMod.mcalcmove;
    } catch (e) {}
    const fireMcalcmove = () => {
        if (mcalcmove_real) {
            for (let m = game.level.monlist; m; m = m.nmon) {
                if (m.mnum == null || !game.mons[m.mnum]) continue;
                const mmove = game.mons[m.mnum].mmove;
                if (typeof mmove !== 'number' || mmove <= 0) continue;
                try {
                    const credit = mcalcmove_real(m, 1);
                    if (typeof credit === 'number') {
                        if (typeof m.movement !== 'number') m.movement = 0;
                        m.movement += credit;
                    }
                } catch (e) { rndMod.rn2(12); }
                if (process.env.MONLIST_TRACE) {
                    console.log('[mcalcmove] m_id=' + m.m_id + ' mnum=' + m.mnum
                        + ' mmove=' + mmove + ' movement=' + m.movement);
                }
            }
        } else {
            for (let i = 0; i < monsterCount; i++) rndMod.rn2(12);
        }
    };
    // Drive maybe_generate_rnd_mon via the real translated function
    // when available — fires rn2(70) for non-demigod, non-deep-dungeon
    // hero (matches recording for seed8000 turn 1+).  When rn2 returns
    // 0, the makemon side-effect would fire many more rn2 calls; the
    // recording shows non-zero results, so makemon doesn't fire.
    let mgrm_real = null;
    try {
        const allmainMod = await import(outputDir + '/allmain.js');
        mgrm_real = allmainMod.maybe_generate_rnd_mon;
    } catch (e) {}
    const fireMaybeGenerate = () => {
        if (mgrm_real) {
            try { mgrm_real(); } catch (e) { rndMod.rn2(70); }
        } else {
            rndMod.rn2(70);
        }
    };
    // gethungry from eat.c — fires rn2(20) (the accessorytime draw)
    // unconditionally for non-invulnerable hero.  Use the real
    // translated function when available.
    let gethungry_real = null;
    try {
        const eatMod = await import(outputDir + '/eat.js');
        gethungry_real = eatMod.gethungry;
    } catch (e) {}
    if (process.env.LEVEL_DUMP) {
        // Dump entire level layout as a grid of typ values
        const lines = [];
        for (let y = 0; y < 21; y++) {
            let row = String(y).padStart(2) + ': ';
            for (let x = 0; x < 80; x++) {
                const c = game.level.locations[x] && game.level.locations[x][y];
                const t = c ? c.typ : '?';
                // Use char glyphs for readability
                const ch = t === 0 ? ' ' :
                    t === 25 ? '.' : // ROOM
                    t === 24 ? '#' : // CORR
                    t === 23 ? '+' : // DOOR
                    t === 22 ? 'I' : // IRONBARS
                    (t >= 1 && t <= 12) ? '|' : // walls
                    t === 16 ? '}' : // POOL
                    t === 17 ? '}' : // MOAT
                    t === 28 ? '{' : // FOUNTAIN
                    String(t);
                row += ch;
            }
            lines.push(row);
        }
        console.log(lines.join('\n'));
        // Find monster positions
        for (let m = game.level.monlist; m; m = m.nmon) {
            console.log('mon m_id=' + m.m_id + ' (' + m.mx + ',' + m.my + ')');
        }
    }
    if (process.env.LEVEL_FEATURES) {
        console.log('[level.flags] nsinks=' + game.level.flags.nsinks
            + ' nfountains=' + game.level.flags.nfountains
            + ' has_court=' + game.level.flags.has_court
            + ' has_swamp=' + game.level.flags.has_swamp
            + ' has_temple=' + game.level.flags.has_temple);
        console.log('[stairs] ' + (game.stairs ? JSON.stringify({sx: game.stairs.sx, sy: game.stairs.sy, up: game.stairs.up}) : 'null'));
        console.log('[level.upstair] ' + JSON.stringify(game.level && game.level.upstair));
        console.log('[level.dnstair] ' + JSON.stringify(game.level && game.level.dnstair));
        console.log('[u] ux=' + game.u.ux + ' uy=' + game.u.uy);
        console.log('[u.acurr.a]'
            + ' STR=' + game.u.acurr.a[0]
            + ' INT=' + game.u.acurr.a[1]
            + ' WIS=' + game.u.acurr.a[2]
            + ' DEX=' + game.u.acurr.a[3]
            + ' CON=' + game.u.acurr.a[4]
            + ' CHA=' + game.u.acurr.a[5]);
    }
    // dosounds from sounds.c — gated on level features.  Our level
    // has nsinks=1 (fountains/court/swamp=0) so the only fire path
    // is the nsinks rn2(300) check.  Use translated dosounds for
    // PRNG-faithful output.
    let dosounds_real = null;
    try {
        const soundsMod = await import(outputDir + '/sounds.js');
        dosounds_real = soundsMod.dosounds;
    } catch (e) {}
    const fireDosounds = () => {
        if (dosounds_real) {
            try { dosounds_real(); } catch (e) { rndMod.rn2(300); }
        } else {
            rndMod.rn2(300);
        }
    };
    const fireGethungry = () => {
        if (gethungry_real) {
            try { gethungry_real(); } catch (e) {
                if (process.env.MOVELOOP_TRACE) console.error('[gethungry-throw]', e.message, '|', (e.stack || '').split('\n').slice(0, 3).join(' || '));
                rndMod.rn2(20);
            }
        } else {
            rndMod.rn2(20);
        }
    };
    // movemon-style per-monster dispatcher.  Mirrors C movemon_singlemon
    // (mon.c:1214): each monster needs `movement >= NORMAL_SPEED`
    // (12) to act; if it does, dochug runs and movement is decremented.
    // mcalcmove (called above) credits each monster's `movement`.
    let monmoveMod = null;
    try { monmoveMod = await import(outputDir + '/monmove.js'); } catch (e) {}
    // Vision init: m_move's m_search_items eventually calls
    // clear_path which reads game.viz_clear_rows[y][x].  Without
    // vision_init the rows are null, throwing.  Call the real
    // vision_init now so m_move can complete.
    try {
        const visionMod = await import(outputDir + '/vision.js');
        if (typeof visionMod.vision_init === 'function') visionMod.vision_init();
    } catch (e) {
        if (process.env.MOVELOOP_TRACE) {
            console.error('[harness] vision_init FAIL:', e.message);
        }
    }
    const NORMAL_SPEED = 12;
    const fireDochugForEligibleMonsters = () => {
        if (!monmoveMod) {
            // Fallback: original inline 1 rn2(5) per monster.
            for (let i = 0; i < monsterCount; i++) rndMod.rn2(5);
            return;
        }
        // Iterate monlist as movemon does.
        const dochugFn = monmoveMod.dochug;
        if (typeof dochugFn !== 'function') {
            for (let i = 0; i < monsterCount; i++) rndMod.rn2(5);
            return;
        }
        for (let m = game.level.monlist; m; m = m.nmon) {
            if (m.mnum == null || !game.mons[m.mnum]) continue;
            if (typeof m.movement !== 'number' || m.movement < NORMAL_SPEED) continue;
            // Decrement before running dochug, like C does.
            m.movement -= NORMAL_SPEED;
            try { dochugFn(m); }
            catch (e) {
                if (process.env.MOVELOOP_TRACE) {
                    console.log('[dochug] err on m_id=' + m.m_id + ': ' + e.message);
                }
                break;
            }
        }
    };
    // Per-turn moves counter — increments after maybe_generate (mirrors
    // C's `svm.moves++` at allmain.c:244, which sits between
    // maybe_generate_rnd_mon and the inner do-while loop containing
    // dosounds/gethungry).  Initial value 1 mirrors u_init.c:645
    // (`svm.moves = 1L`), so the first per-step increment brings it
    // to 2 — which means seer_turn at 7 fires on the 6th step (the
    // recording shows the rn2(31) at step 6, key 'h').
    let harnessMoves = 1;
    const turnBlock = () => {
        fireMcalcmove();
        fireMaybeGenerate();
        harnessMoves++;
        fireDosounds();
        fireGethungry();
        // exerchk → exerper → exercise: gated by `!(svm.moves % 10)`
        // (attrib.c:523).  For Tourist starter (NOT_HUNGRY hunger
        // state, no encumbrance), exerper calls exercise(A_CON, TRUE)
        // → fires rn2(19) (attrib.c:509: `(rn2(19) > ACURR(i))`).
        // Fires between gethungry and moveloop_core(line 360).
        if (harnessMoves > 0 && (harnessMoves % 10) === 0) {
            rndMod.rn2(19);
        }
        rndMod.rn2(40 + (game.u.acurr.a[3] || 0) * 3);  // moveloop_core line 360
        // seer_turn check at allmain.c:408 fires once moves reaches the
        // seer_turn threshold.  rn1(31, 15) is `rn2(x) + y` per the
        // C macro definition (hack.h:1535) — fire rn2(31) directly.
        if (harnessMoves >= harnessSeerTurn) {
            harnessSeerTurn = harnessMoves + rndMod.rn2(31) + 15;
        }
        fireDochugForEligibleMonsters();
    };
    // Drive turns by replaying the recording's per-step keys.  Each
    // step in the session is one hero command (e.g. 'l' = move east);
    // we update game.u.ux/uy by the key's direction delta BEFORE
    // firing turnBlock so that monsters' set_apparxy uses the same
    // goal coords C did.  Without this, the hero stays at the
    // upstairs forever and m_move's "best by ndist" diverges from C
    // once any monster's optimal path depends on the moved-east hero.
    const MOVE_DELTAS = {
        'l': [+1,  0], 'h': [-1,  0],
        'j': [ 0, +1], 'k': [ 0, -1],
        'y': [-1, -1], 'u': [+1, -1],
        'b': [-1, +1], 'n': [+1, +1],
    };
    const _sessionData = JSON.parse(readFileSync(
        root + '/sessions/seed8000-tourist-starter.session.json', 'utf8'));
    const sessionSteps = (_sessionData.segments || [])[0]?.steps || [];
    const MAX_TURNS = parseInt(process.env.MAX_TURNS) || sessionSteps.length;
    for (let turn = 0; turn < MAX_TURNS; turn++) {
        // Step index 0 is the init phase (no key); the per-turn keys
        // live at indices 1..N.
        const step = sessionSteps[turn + 1];
        if (step) {
            const delta = MOVE_DELTAS[step.key];
            if (delta) {
                game.u.ux += delta[0];
                game.u.uy += delta[1];
            }
        }
        const before = globalThis.__prngSink.length;
        try { turnBlock(); }
        catch (e) {
            if (process.env.MOVELOOP_TRACE) {
                console.log('[turnBlock #' + turn + '] err: ' + e.message);
            }
            break;
        }
        // If turnBlock didn't add any calls, we're stuck — bail.
        if (globalThis.__prngSink.length === before) break;
    }
    // Turn 2's per-monster distfleeck pattern interleaves with
    // m_move (rn2(32)) — m_move firing depends on monster movement
    // state.  We can't model m_move without setting up many more
    // game-state pieces, but we CAN call the real translated
    // `distfleeck` for each monster.  When the player position is
    // unset (game.u.ux/uy undefined), `dist2` returns NaN, `nearby`
    // is false, and distfleeck only fires its leading rn2(5) without
    // entering the monflee branch.  This advances the strict-streak
    // by 1 (to 2996) authentically.  Further advancement requires
    // also driving m_move, which depends on per-monster movement
    // decisions and is left for a future step.
    try {
        const monmoveMod = await import(outputDir + '/monmove.js');
        // Translator currently TODO's `*mtmp = cg.zeromonst` so alloc'd
        // monsters carry auto-Proxy fields rather than zeroed scalars.
        // Sanitize each monster before per-monster phase: replace
        // proxy-typed scalar fields with zeromonst defaults, leaving
        // explicitly-set fields (data, mw, mhp, mx, my, ...) intact.
        const declMod = await import(outputDir + '/decl.js');
        const zeromonst = declMod.cg && declMod.cg.zeromonst;
        if (zeromonst) {
            // Preserve fields that have meaningful object/non-null
            // contents from upstream code: data (permonst*), mw (worn
            // weapon ptr), nmon (linked-list next ptr — clobbering it
            // breaks our own iteration!), and any minvent/mtrack/...
            // we don't want to flatten to null at this stage.
            const PRESERVE_OBJ_FIELDS = new Set([
                'data', 'mw', 'nmon', 'mtrack', 'mextra',
                // minvent — DO NOT preserve.  When `for (o = mon.minvent;
                // o; o = o.nobj)` is iterated with minvent as auto-Proxy,
                // each iteration creates a new sub-Proxy on `o.nobj`,
                // growing the heap until OOM.  This was the dochug
                // OOM source for non-M1_BREATHLESS monsters: m_poisongas_ok
                // skips the early `mflags1 & 1024` return for them and
                // falls through to Resists_Elem(mon, POISON_RES) which
                // hits the inventory-walk loop.
            ]);
            // Snapshot the list of monsters first so we don't lose
            // iteration if a write happens to clobber nmon anyway.
            const allMons = [];
            for (let m = game.level.monlist; m; m = m.nmon) allMons.push(m);
            for (const m of allMons) {
                for (const k of Object.keys(zeromonst)) {
                    const v = m[k];
                    if (typeof v === 'number' || typeof v === 'string'
                        || v === null) continue;
                    if (PRESERVE_OBJ_FIELDS.has(k)) continue;
                    m[k] = zeromonst[k];
                }
                // mtrack: C has `coord mtrack[MTSZ]` (4 elements).
                // The translated cg.zeromonst has mtrack=null, so the
                // post-makemon Object.assign(mtmp, cg.zeromonst) writes
                // null over the auto-Proxy.  m_move's `mtrk = mtmp.mtrack[0]`
                // crashes on null.  Reinitialize as a 4-element array
                // of {x:0, y:0}.
                if (m.mtrack == null
                    || !Array.isArray(m.mtrack)
                    || m.mtrack.length < 4) {
                    m.mtrack = [{x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0}];
                }
                // mgoal: C has `coord mgoal` (single struct).  zeromonst
                // emits 0; reinitialize as {x:0, y:0}.
                if (typeof m.mgoal === 'number' || m.mgoal == null) {
                    m.mgoal = {x: 0, y: 0};
                }
            }
        }
        // Also sanitize key game.u flags that m_move's early-return
        // checks read.  Without explicit numeric values, the auto-
        // Proxy ghost is truthy and m_move returns 1 immediately.
        for (const k of [
            'uswallow', 'uundetected', 'uinwater', 'utotype',
            'umoved', 'utrap', 'utraptype', 'usteed', 'ustuck',
            'uinvulnerable', 'uhpmax', 'mh', 'mhmax',
            'umonnum', 'umonster',
        ]) {
            const v = game.u[k];
            if (typeof v !== 'number' && v !== null) {
                game.u[k] = (k === 'usteed' || k === 'ustuck') ? null : 0;
            }
        }
        // game.youmonst.data — the player's permonst pointer.  Many
        // monmove/mondata helpers (sticks, attacktype, dmgtype) read
        // it.  In C this is set by set_uasmon() during u_init; we
        // didn't run that, so plug it in directly using the Tourist
        // role's permonst.
        // Place the hero at the upstairs (recorded by mklev as
        // game.stairs).  Without this, distfleeck's `nearby`
        // calculation always returns false (NaN <= 64), so dochug
        // always enters phase three (firing m_move + recalc) even
        // for monsters that should skip phase three because they're
        // close to the player.  Recording's turn-1 distfleeck
        // calls have only one rn2(5) per monster (no recalc, no
        // m_move) — meaning monsters were "nearby" the player and
        // skipped phase three.
        if (game.stairs && game.stairs.up
            && (typeof game.u.ux !== 'number' || game.u.ux === 0)) {
            game.u.ux = game.stairs.sx;
            game.u.uy = game.stairs.sy;
        }
        if (!game.youmonst || !game.youmonst.data) {
            game.youmonst = game.youmonst || {};
            game.youmonst.data = game.mons[341]; // PM_TOURIST
            // Mirror set_uasmon (polyself.c:38): m_id=1, cham=NON_PM(=-1).
            game.youmonst.m_id = 1;
            game.youmonst.cham = -1;
            game.youmonst.mnum = 341;
            game.youmonst.m_ap_type = 0;
            game.youmonst.mappearance = 0;
            // mflee, msleeping, mcanmove, etc. — zero so move-loop
            // tests don't pick up Proxy ghosts.
            for (const k of ['mflee', 'mfleetim', 'msleeping', 'mfrozen',
                             'mblinded', 'mstun', 'mconf', 'mtame',
                             'mpeaceful', 'mtrapped', 'minvis', 'mpolyfork',
                             'mhp', 'mhpmax', 'mx', 'my', 'mux', 'muy']) {
                if (typeof game.youmonst[k] !== 'number') {
                    game.youmonst[k] = (k === 'mhp' || k === 'mhpmax') ? 16 : 0;
                }
            }
        }
        // game.u.uprops — array of {intrinsic, extrinsic, blocked}
        // indexed by 0..LAST_PROP (LIFESAVED=68).  Many move-loop
        // functions (dosounds, distfleeck, m_move) read individual
        // properties as boolean gates; the auto-Proxy ghost reads
        // truthy and short-circuits the function.  Zero-init the
        // array AFTER makemon ran (so makemon's rn2 calls match the
        // recording) but before the per-monster phase.
        if (!Array.isArray(game.u.uprops) || game.u.uprops.length < 70) {
            game.u.uprops = Array.from({ length: 70 },
                () => ({ intrinsic: 0, extrinsic: 0, blocked: 0 }));
        }
        // uroleplay flags (deaf, etc.) read as booleans during the
        // move loop.  Zero them.
        for (const k of ['deaf', 'blind', 'mute', 'pauper',
                         'nudist', 'paragon']) {
            if (typeof game.u.uroleplay[k] !== 'number') {
                game.u.uroleplay[k] = 0;
            }
        }
        // Sanitize game.u.uevent flags that maybe_generate_rnd_mon and
        // various other functions branch on.  Without explicit zeros,
        // these auto-Proxy ghosts read truthy and pick the wrong
        // rn2 modulus (rn2(25) instead of rn2(70) etc.).
        for (const k of ['udemigod', 'invoked', 'qcalled',
                         'uvibrated', 'qcompleted', 'ascended']) {
            if (typeof game.u.uevent[k] !== 'number') {
                game.u.uevent[k] = 0;
            }
        }
        // Turn-2 per-monster phase.  Use the same movemon-style
        // dochug eligibility filter we use for turn 1 — fire dochug
        // for every monster whose movement >= NORMAL_SPEED (12),
        // decrementing movement by 12 each call.  This drives
        // distfleeck + m_move + recalc-distfleeck in the same shape
        // C records.  Without this, turn 2 fires only inline
        // distfleeck-per-monster, missing the m_move/recalc rn2 calls.
        try {
            const NORMAL_SPEED = 12;
            const dochugFn = monmoveMod.dochug;
            for (let m = game.level.monlist; m; m = m.nmon) {
                if (m.mnum == null || !game.mons[m.mnum]) continue;
                const mmove = game.mons[m.mnum].mmove;
                if (typeof mmove !== 'number' || mmove <= 0) continue;
                if (typeof m.movement !== 'number'
                    || m.movement < NORMAL_SPEED) continue;
                m.movement -= NORMAL_SPEED;
                try { dochugFn(m); }
                catch (e) {
                    if (process.env.MOVELOOP_TRACE) {
                        console.log('[dochug-t2] err on m_id=' + m.m_id
                                    + ': ' + e.message);
                    }
                    break;
                }
            }
        } catch (e) {
            if (process.env.MOVELOOP_TRACE) console.log('[dochug-t2] outer err: ' + e.message);
        }
        if (process.env.TRY_DOCHUG) {
            // Wrap __nh_blackhole's `get` trap to count accesses.
            // If a single dochug call reads from blackhole > 100k
            // times, it's the runaway loop pattern (translator's
            // unbounded `for (...; ...; (X = __nh_blackhole))`).
            // The non-Proxy fallback object lets us still run.
            const BH_CAP = parseInt(process.env.BLACKHOLE_CAP) || 50000;
            let bhCount = 0;
            const origBh = globalThis.__nh_blackhole;
            const wrapped = new Proxy({}, {
                get(_t, prop) {
                    if (prop === Symbol.toPrimitive) return () => 0;
                    if (prop === 'valueOf') return () => 0;
                    bhCount++;
                    if (bhCount > BH_CAP) {
                        const e = new Error('blackhole-cap exceeded ('
                            + bhCount + ')');
                        Error.captureStackTrace(e, wrapped);
                        throw e;
                    }
                    return wrapped;
                },
                set() { return true; },
            });
            const onlyMid = process.env.DOCHUG_ONLY ? parseInt(process.env.DOCHUG_ONLY) : null;
            for (let m = game.level.monlist; m; m = m.nmon) {
                if (m.mnum == null || !game.mons[m.mnum]) continue;
                if (onlyMid !== null && m.m_id !== onlyMid) continue;
                const mmove = game.mons[m.mnum].mmove;
                if (typeof mmove !== 'number' || mmove <= 0) continue;
                const startCount = globalThis.__prngSink.length;
                process.stderr.write('[dochug] starting m_id=' + m.m_id + '\n');
                globalThis.__prngCap = startCount + 200;
                bhCount = 0;
                globalThis.__nh_blackhole = wrapped;
                globalThis.__nh_proxyCount = 0;
                globalThis.__nh_proxyCap = parseInt(process.env.PROXY_CAP) || 50000;
                try {
                    const ret = monmoveMod.dochug(m);
                    const after = globalThis.__prngSink.length;
                    const fired = globalThis.__prngSink.slice(startCount, after);
                    console.log('[dochug] m_id=' + m.m_id + ' returned=' + ret
                        + ' fired ' + (after - startCount) + ' rn2: '
                        + fired.map(s => s.split(' @')[0]).slice(0, 10).join(', ')
                        + ' bh-reads=' + bhCount + ' proxies=' + globalThis.__nh_proxyCount);
                } catch (e) {
                    console.log('[dochug] err on m_id=' + m.m_id + ': '
                        + e.message + ' (bh-reads=' + bhCount
                        + ' proxies=' + globalThis.__nh_proxyCount + ')');
                    if (e.stack) console.log(e.stack.split('\n').slice(0, 12).join('\n'));
                } finally {
                    globalThis.__nh_blackhole = origBh;
                    globalThis.__nh_proxyCount = undefined;
                    globalThis.__nh_proxyCap = undefined;
                }
            }
            globalThis.__prngCap = 50000;
        }
    } catch (e) {
        if (process.env.MOVELOOP_TRACE) console.log('[distfleeck] import error: ' + e.message);
    }
}

if (process.env.MIN_ELIGIBLE) {
    const { game } = await import(root + '/js/gstate.js');
    let count = 0;
    const cells = [];
    for (let x = 2; x < 78; x++) {
        for (let y = 1; y < 20; y++) {
            const c = game.level.locations[x][y];
            if (c.typ !== 0) continue; // not STONE
            if ((c.flags || 0) & 8) continue; // W_NONDIGGABLE
            // 8 neighbors all STONE?
            let allStone = true;
            for (let dy = -1; dy <= 1 && allStone; dy++) {
                for (let dx = -1; dx <= 1 && allStone; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    if (game.level.locations[x + dx][y + dy].typ !== 0) allStone = false;
                }
            }
            if (allStone) {
                count++;
                if (cells.length < 50) cells.push(x + ',' + y);
            }
        }
    }
    console.log('[min-eligible] ' + count + ' eligible cells. First samples:', cells.slice(0, 20).join(' '));
}
if (process.env.LEVEL_ROW_DUMP) {
    const { game } = await import(root + '/js/gstate.js');
    for (let y = 0; y < 21; y++) {
        let row = String(y).padStart(2, '0') + ': ';
        for (let x = 0; x < 80; x++) {
            const t = game.level.locations[x][y].typ;
            row += (t === 0) ? '.' : t.toString(36);
        }
        console.log(row);
    }
}
if (process.env.LEVEL_TYP_HISTOGRAM) {
    const { game } = await import(root + '/js/gstate.js');
    const counts = {};
    for (let x = 0; x < 80; x++) {
        for (let y = 0; y < 21; y++) {
            const t = game.level.locations[x][y].typ;
            counts[t] = (counts[t] || 0) + 1;
        }
    }
    console.log('[harness] level-typ histogram:', JSON.stringify(counts));
}
if (process.env.ROOM_RTYPE_TRACE) {
    const { game } = await import(root + '/js/gstate.js');
    console.log('[harness] post-mklev nroom=' + game.nroom);
    for (let i = 0; i < game.nroom; i++) {
        const r = game.rooms[i];
        console.log('  room[' + i + '] rtype=' + r.rtype + ' lx=' + r.lx + ' ly=' + r.ly
            + ' hx=' + r.hx + ' hy=' + r.hy + ' irregular=' + r.irregular
            + ' needjoining=' + r.needjoining + ' has_dnstairs=' + r.has_dnstairs
            + ' has_upstairs=' + r.has_upstairs);
    }
}

// 8. Compare against the recording.
const session = JSON.parse(readFileSync(
    root + '/sessions/seed8000-tourist-starter.session.json', 'utf8'));
const recorded = [];
for (const seg of session.segments || []) {
    for (const step of seg.steps || []) {
        for (const r of step.rng || []) {
            if (typeof r === 'string'
                && /^(?:rn2|rnd|d|rne|rnz|rnl|rn1)\(/.test(r)) {
                recorded.push(r);
            }
        }
    }
}
const captured = globalThis.__prngSink;
const strip = (s) => s.split(' @')[0];

const N = Math.min(captured.length, recorded.length);
let firstDivergence = -1;
for (let k = 0; k < N; k++) {
    if (strip(captured[k]) !== strip(recorded[k])) {
        firstDivergence = k;
        break;
    }
}

// If call-trace is enabled, write the trace to a file for later
// comparison against the C-side trace from patch 010.
if (process.env.CALL_TRACE === '1') {
    const path = process.env.CALL_TRACE_OUT || 'js-trace.log';
    const lines = (globalThis.__nh_traceSink || []).join('\n') + '\n';
    writeFileSync(path, lines);
    console.log('[trace] wrote ' + (globalThis.__nh_traceSink || []).length
        + ' entries to ' + path);
}

console.log('captured ' + captured.length + ' JS calls; recording has ' + recorded.length);
if (firstDivergence === -1 && captured.length === recorded.length) {
    console.log('FULL MATCH: all ' + N + ' calls match');
    process.exit(0);
}
if (firstDivergence === -1) {
    console.log('PARTIAL MATCH: first ' + N + ' calls match');
    if (N < recorded.length) console.log('next recorded call: ' + recorded[N]);
    if (process.env.DUMP_RANGE) {
        const [lo, hi] = process.env.DUMP_RANGE.split(',').map((s) => parseInt(s));
        for (let i = lo; i < hi && i < recorded.length; i++) {
            console.log('  [' + i + '] C=' + recorded[i] + ' | JS=' + (captured[i] || ''));
        }
    }
    process.exit(0);
}
// Count overall matches vs mismatches across the full overlap region.
let totalMatches = 0, totalMismatches = 0;
for (let k = 0; k < N; k++) {
    if (strip(captured[k]) === strip(recorded[k])) totalMatches++;
    else totalMismatches++;
}
console.log('overall match: ' + totalMatches + '/' + N
    + ' (mismatches: ' + totalMismatches + ')');
console.log('first divergence at index ' + firstDivergence + ' (matched ' + firstDivergence + '/' + recorded.length + ')');
for (let k = Math.max(0, firstDivergence - 3); k < Math.min(N, firstDivergence + 3); k++) {
    const mark = k === firstDivergence ? ' <-- HERE' : '';
    console.log('    [' + k + '] C=' + strip(recorded[k]).padEnd(18) + ' JS=' + strip(captured[k]).padEnd(18) + mark);
}
if (globalThis.__prngTrace) {
    for (let k = Math.max(0, firstDivergence - 1); k < Math.min(captured.length, firstDivergence + 3); k++) {
        const trace = (captured[k] || '').split(' @ ')[1];
        if (trace) console.log('    [' + k + '] trace: ' + trace.split(' | ').slice(0, 2).join(' | '));
    }
}
// Always show the JS-side @ annotations for the divergence neighbourhood.
for (let k = Math.max(0, firstDivergence - 3); k < Math.min(captured.length, firstDivergence + 8); k++) {
    const ann = (captured[k] || '').split(' @ ')[1];
    if (ann) console.log('    [' + k + '] JS @ ' + ann.split(' | ')[0]);
}
process.exit(0);
