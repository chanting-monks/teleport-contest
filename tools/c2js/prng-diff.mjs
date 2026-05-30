#!/usr/bin/env node
// prng-diff.mjs — Step 5 harness.
//
// Runs the translated NetHack code as far as it can go, captures the
// PRNG call sequence, and diffs it line-for-line against the C-side
// recording for a given session.
//
// Usage:
//   node tools/c2js/prng-diff.mjs <session-name>
//
// Where <session-name> is the basename of a sessions/*.session.json
// (e.g. seed8000-tourist-starter).
//
// Phase 4 status: most of the code in /tmp/c2js-out/ does NOT yet RUN.
// The harness exists so we can:
//   a. Iterate on runtime stubs and see immediately which symbol is
//      missing next.
//   b. Once running works, do the actual line-for-line PRNG diff.
//
// The harness runs the build-tree pipeline on the mklev closure,
// writes generated JS into .cache/c2js/generated/, then attempts to
// dynamic-import the generated rng module and run the entry point.

import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTree } from './build-tree.mjs';
import { upstreamDir, projectRoot, stubsDir, PLATFORM_DEFINES } from './c2js.config.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// Files in mklev's structural dependency closure (per docs/TRANSPORT.md
// Phase 5).  We translate all of them as a tree so cross-TU references
// resolve.
const MKLEV_CLOSURE = [
    'src/mklev.c',
    'src/mkroom.c',
    'src/sp_lev.c',
    'src/mkobj.c',
    'src/dungeon.c',
    'src/vision.c',
    'src/region.c',
    'src/rect.c',
    'src/rnd.c',
    'src/hacklib.c',
    // decl.c is the canonical home of NetHack's bucket structs and
    // standalone global flags (has_strong_rngseed, &c).  Without it
    // the translator can't see those names as game-hoisted, so any
    // TU that references them emits a bare identifier that fails
    // module-load.  Adding it here keeps the closure self-contained
    // for module-eval, even though decl.c contributes no
    // game-logic functions.
    'src/decl.c',
];

function loadSession(name) {
    const path = join(projectRoot, 'sessions', `${name}.session.json`);
    if (!existsSync(path)) {
        throw new Error(`session not found: ${path}`);
    }
    return JSON.parse(readFileSync(path, 'utf8'));
}

function extractRecordedPrngCalls(session) {
    // Each step's `rng` array is a list of strings:
    //   "rn2(N)=R @ caller(file:line)"
    //   ">funcname @ caller(file:line)"            (event)
    //   "<funcname=retval"                          (event)
    //   "^tag[args]"                                (state marker)
    //   "^mapstate[v=N ...]"                        (map snapshot)
    // We want only PRNG leaf calls (rn2/rnd/d/rne/rnz/rnl).
    const out = [];
    const segments = session.segments || [];
    for (const seg of segments) {
        for (const step of seg.steps || []) {
            for (const entry of step.rng || []) {
                if (typeof entry !== 'string') continue;
                if (/^(?:rn2|rnd|rn1|rnl|rne|rnz|d)\(/.test(entry)) {
                    out.push(entry);
                }
            }
        }
    }
    return out;
}

function ensureGenerated() {
    const outputDir = join(projectRoot, '.cache/c2js/generated');
    mkdirSync(outputDir, { recursive: true });
    const sources = MKLEV_CLOSURE.map((rel) => join(upstreamDir, rel));
    const parserOpts = {
        extraFlags: [
            `-I${upstreamDir}/include`,
            `-I${stubsDir}`,
            ...PLATFORM_DEFINES,
        ],
    };
    console.log(`[prng-diff] translating ${sources.length} sources → ${outputDir}`);
    const outputs = buildTree({ sources, outputDir, parserOpts });
    return { outputDir, outputs };
}

// Stub registry for symbols mklev's closure references but whose
// defining TUs aren't yet in the closure.  Each stub returns a
// neutral value matching the C function's "do nothing for a fresh
// dungeon" path.  As more TUs are added to MKLEV_CLOSURE these
// entries get deleted (the real implementation overrides them).
const RUNTIME_STUBS = {
    getbones: () => 0,                  // bones.c — no save file → 0
    init_dungeons: () => {},            // dungeon.c (real impl exists; stubbed if not loaded)
    flush_screen: () => {},             // display.c — no terminal in headless run
    pline: () => {},                    // pline.c — message printer
    pline_The: () => {},                // pline.c — variant
    debugcore: () => 0,                 // sys/* — debug toggle
    nh_getenv: () => null,              // sys/* — env lookup
    paniclog: () => {},                 // end.c
    you: () => {},                      // hack.c — placeholder
    makemon: () => null,                // makemon.c
    mintrap: () => 0,                   // trap.c
    maketrap: () => null,               // trap.c
    deltrap: () => {},                  // trap.c
    t_at: () => null,                   // trap.c
    sobj_at: () => null,                // mkobj.c family
    mkclass: () => null,                // mon.c
    obfree: () => {},                   // mkobj.c
    newsym: () => {},                   // display.c
    seemimic: () => {},                 // mon.c
    set_mimic_sym: () => {},            // mon.c
    glyph_to_cmap: () => 0,             // display.c
    back_to_glyph: () => 0,             // display.c
    set_wall_state: () => {},           // mklev support
    is_pool: () => 0,                   // hack.c
    is_lava: () => 0,                   // hack.c
    is_pool_or_lava: () => 0,           // hack.c
    fracture_rock: () => 0,             // dig.c
    bound_digging: () => 0,             // dig.c
    minliquid: () => 0,                 // hack.c
    begin_burn: () => {},               // light.c
    crumble_floor_at: () => {},         // dig.c (alt name)
    in_rooms: () => 0,                  // mkroom.c (real exists if loaded)
    has_dnstairs: () => 0,              // mkroom.c (real exists if loaded)
    has_upstairs: () => 0,              // mkroom.c (real exists if loaded)
    makemaz: () => {},                  // mkmaze.c
    makerogueghost: () => {},           // mkmaze.c
    makeroguerooms: () => {},           // mkmaze.c
    mkportal: () => {},                 // mkmaze.c
    invocation_pos: () => 0,            // dungeon.c
    stairway_add: () => {},             // dungeon.c
    stairway_free_all: () => {},        // dungeon.c
    set_levltyp: () => {},              // mklev.c support
    isok: (x, y) => x >= 0 && y >= 0,   // hack.c — bounds check
    nh_callback_run: () => {},          // callback dispatch
    post_level_generate: () => {},      // hooks
    post_themerooms_generate: () => {}, // hooks
    pre_themerooms_generate: () => {},  // hooks
    themerooms_generate: () => {},      // sp_lev support
    nhl_init: () => ({ stub: 'lua_state' }), // lua bridge — truthy so caller proceeds
    nhl_done: () => {},                 // lua bridge
    nhl_loadlua: () => 1,               // lua bridge — truthy so loader proceeds
    nhl_pcall_handle: () => 1,          // lua bridge — truthy: success
    lua_gc: () => 0,                    // lua bridge
    lua_getglobal: () => 0,             // lua bridge
    lua_pushstring: () => {},           // lua bridge
    lua_settop: () => {},               // lua bridge
    make_engr_at: () => {},             // engrave.c
    wipe_engr_at: () => {},             // engrave.c
    random_engraving: () => 0,          // engrave.c
    make_grave: () => {},               // engrave.c
    mazexy: () => {},                   // mkmaze.c
    breaktest: () => 0,                 // mkobj.c
    place_object: () => {},             // mkobj.c (real exists)
    add_to_buried: () => {},            // mkobj.c (real exists)
    buried_ball_to_punishment: () => {}, // ball.c
    reset_utrap: () => {},              // trap.c
    add_to_container: () => {},         // mkobj.c (real exists)
    bonus_items: () => {},              // mkroom.c
    supply_items: () => {},             // mkroom.c
    poss_class: () => 0,                // mkobj.c
    overflow4: () => 0,                 // helper
    rno: () => 0,                       // helper (room number?)
    perpcall: () => 0,                  // helper
    skip0: () => 0,                     // helper
    skip_nonrogue: () => 0,             // helper
    skip_lvl_checks: () => 0,           // helper
    fillable: () => 0,                  // mkobj.c helper
    fillname: () => 'gold',             // mkroom.c
    set_levltyp_lit: () => {},          // mklev support
    near_door: () => 0,                 // mkroom.c helper
    bound_engr: () => {},               // engrave.c
    sprintf: () => 0,                   // formatted print stub
    strcat: (a, b) => (a ?? '') + (b ?? ''), // libc
};

async function attemptRun(outputDir) {
    // Two-stage gate.  Stage 1: import the entry module.  Stage 2:
    // call mklev() and let it run as far as it can.  Each unresolved
    // bare reference / missing field will throw; we surface the
    // first failure and let the next iteration close that gap.
    // ES modules consult globalThis for free identifiers, so we can
    // pre-populate stubs there to satisfy references whose home TU
    // isn't yet translated.
    for (const [name, fn] of Object.entries(RUNTIME_STUBS)) {
        if (!(name in globalThis)) globalThis[name] = fn;
    }
    const entryPath = join(outputDir, 'mklev.js');
    let mod;
    try {
        mod = await import(entryPath);
    } catch (err) {
        return { ok: false, stage: 'import', why: err.message, stack: err.stack };
    }
    if (typeof mod.mklev !== 'function') {
        return { ok: false, stage: 'import', why: `mklev.js loaded but doesn't export mklev()` };
    }

    // Initialize the bucket structs the same way main() would by
    // calling decl_globals_init() / program_state_init() from
    // decl.js.  In C those are called by allmain.c before any level
    // generation.  Without them the `game.X` namespaces are empty
    // and any field access returns the auto-created Proxy slot
    // instead of the C-style zeroed struct.
    try {
        const declMod = await import(join(outputDir, 'decl.js'));
        if (typeof declMod.program_state_init === 'function') declMod.program_state_init();
        if (typeof declMod.decl_globals_init === 'function') declMod.decl_globals_init();
    } catch (err) {
        return { ok: false, stage: 'globals_init', why: err.message, stack: err.stack };
    }

    // Stage 2: invoke mklev().  Wrap in try/catch — at this point in
    // Phase 4 the call WILL fail somewhere; the value of running it
    // is to surface the next missing symbol or unset field.
    try {
        mod.mklev();
        return { ok: true, stage: 'invoke', module: mod };
    } catch (err) {
        return { ok: false, stage: 'invoke', why: err.message, stack: err.stack };
    }
}

async function main() {
    const sessionName = process.argv[2] || 'seed8000-tourist-starter';
    console.log(`[prng-diff] session: ${sessionName}`);

    const session = loadSession(sessionName);
    const recorded = extractRecordedPrngCalls(session);
    console.log(`[prng-diff] recorded PRNG calls in C session: ${recorded.length}`);

    const { outputDir } = ensureGenerated();
    console.log(`[prng-diff] attempting to import translated mklev.js…`);

    const result = await attemptRun(outputDir);
    if (!result.ok) {
        console.error(`[prng-diff] FAIL at ${result.stage}: ${result.why}`);
        if (result.stack) {
            console.error(result.stack.split('\n').slice(0, 8).join('\n'));
        }
        console.error(`\nThis is expected at this point in Phase 4.`);
        console.error(`Each missing symbol surfaced here is an entry to add to`);
        console.error(`tools/c2js/c2js.config.mjs's EXTERNAL_SYMBOLS, or a runtime`);
        console.error(`module to flesh out under js/c2js-runtime/.`);
        process.exit(1);
    }

    console.log(`[prng-diff] import succeeded`);
    console.log(`[prng-diff] (TODO: run mklev() and diff PRNG sequence)`);
}

main().catch((err) => {
    console.error(`prng-diff: ${err.stack || err.message}`);
    process.exit(1);
});
